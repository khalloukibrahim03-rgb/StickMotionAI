import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

let apiProcess;
let apiPort;
let apiStderr = "";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server.address().port);
    });
  });
}

async function waitForApi(url, child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Render API exited early (${child.exitCode}): ${apiStderr}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Render API did not become ready: ${apiStderr}`);
}

before(async () => {
  const probe = createServer();
  apiPort = await listen(probe);
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));

  apiProcess = spawn(process.execPath, ["server/index.js"], {
    env: { ...process.env, PORT: String(apiPort) },
    stdio: ["ignore", "ignore", "pipe"]
  });
  apiProcess.stderr.on("data", chunk => { apiStderr += chunk.toString(); });
  await waitForApi(`http://127.0.0.1:${apiPort}/api/health`, apiProcess);
});

after(async () => {
  if (apiProcess && apiProcess.exitCode === null) apiProcess.kill();
});

test("MP4 render endpoint transcodes a WebM recording and preserves its audio stream", {
  skip: !ffmpegPath
}, async () => {
  const webm = execFileSync(ffmpegPath, [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=black:s=160x120:r=24:d=1",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=1",
    "-shortest", "-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8",
    "-b:v", "200k", "-c:a", "libopus", "-f", "webm", "pipe:1"
  ], { maxBuffer: 8 * 1024 * 1024 });

  assert.ok(webm.length > 1000, "fixture WebM should contain video and audio data");

  const form = new FormData();
  form.append("video", new Blob([webm], { type: "video/webm" }), "fixture.webm");
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/render/mp4`, {
    method: "POST",
    body: form
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /video\/mp4/);
  const mp4 = Buffer.from(await response.arrayBuffer());
  assert.ok(mp4.length > 1000, "converted MP4 should not be empty");
  assert.equal(mp4.toString("ascii", 4, 8), "ftyp", "output should have an MP4 file-type box");
});

test("MP4 render endpoint rejects a request without a video upload", async () => {
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/render/mp4`, {
    method: "POST",
    body: new FormData()
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Missing recorded video/);
});

test("MP4 render endpoint returns a readable error for invalid WebM data", async () => {
  const form = new FormData();
  form.append("video", new Blob(["not a real video"], { type: "video/webm" }), "broken.webm");
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/render/mp4`, {
    method: "POST",
    body: form
  });
  assert.equal(response.status, 500);
  const payload = await response.json();
  assert.match(payload.error, /MP4 conversion failed/);
  assert.ok(payload.detail);
});
