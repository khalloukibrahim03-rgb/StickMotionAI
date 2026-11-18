import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

let piperServer;
let apiProcess;
let apiPort;
let piperPort;
let piperMode = "audio";
let receivedPayload;
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API server exited early (${child.exitCode}): ${apiStderr}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`API server did not become ready: ${apiStderr}`);
}

before(async () => {
  piperServer = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    receivedPayload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (piperMode === "error") {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("mock Piper failure");
      return;
    }
    res.writeHead(200, { "Content-Type": "audio/wav" });
    res.end(Buffer.from("RIFF-test-wav"));
  });
  piperPort = await listen(piperServer);

  const portProbe = createServer();
  apiPort = await listen(portProbe);
  await new Promise((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()));

  apiProcess = spawn(process.execPath, ["server/index.js"], {
    env: {
      ...process.env,
      PORT: String(apiPort),
      PIPER_TTS_URL: `http://127.0.0.1:${piperPort}/synthesize`
    },
    stdio: ["ignore", "ignore", "pipe"]
  });
  apiProcess.stderr.on("data", chunk => { apiStderr += chunk.toString(); });
  await waitForApi(`http://127.0.0.1:${apiPort}/api/health`, apiProcess);
});

after(async () => {
  if (apiProcess && apiProcess.exitCode === null) apiProcess.kill();
  if (piperServer?.listening) {
    await new Promise(resolve => piperServer.close(resolve));
  }
});

test("Piper proxy validates input, forwards synthesis and handles upstream errors", async () => {
  const base = `http://127.0.0.1:${apiPort}`;

  const invalid = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: " ", voice: "en_US-ryan-high" })
  });
  assert.equal(invalid.status, 400);

  const success = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello from the integration test", voice: "en_US-ryan-high", length_scale: 0.9 })
  });
  assert.equal(success.status, 200);
  assert.match(success.headers.get("content-type"), /audio\/wav/);
  assert.equal(Buffer.from(await success.arrayBuffer()).toString(), "RIFF-test-wav");
  assert.deepEqual(receivedPayload, {
    text: "Hello from the integration test",
    voice: "en_US-ryan-high",
    length_scale: 0.9
  });

  piperMode = "error";
  const upstreamFailure = await fetch(`${base}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Try again", voice: "en_US-ryan-high", length_scale: 1 })
  });
  assert.equal(upstreamFailure.status, 502);
  assert.match((await upstreamFailure.json()).error, /Piper/);
});
