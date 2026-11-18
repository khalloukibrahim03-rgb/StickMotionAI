import express from "express";
import multer from "multer";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 300 * 1024 * 1024 } });
const PORT = Number(process.env.PORT || 8787);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "stickmotion-render", ffmpeg: Boolean(ffmpegPath) }));

app.post("/api/render/mp4", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing recorded video. Send a WebM file in the 'video' field." });
  if (!ffmpegPath) return res.status(503).json({ error: "FFmpeg binary is unavailable on this host." });

  const dir = await mkdtemp(path.join(tmpdir(), "stickmotion-"));
  const input = path.join(dir, "recording.webm");
  const output = path.join(dir, "movie.mp4");
  try {
    await writeFile(input, req.file.buffer);
    const args = ["-y", "-i", input, "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", output];
    await new Promise((resolve, reject) => {
      const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", chunk => { stderr += chunk.toString(); });
      child.on("error", reject);
      child.on("close", code => code === 0 ? resolve() : reject(new Error(stderr.slice(-4000) || `FFmpeg exited with code ${code}`)));
    });
    const mp4 = await readFile(output);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'attachment; filename="stickmotion-film.mp4"');
    res.setHeader("Content-Length", mp4.length);
    res.send(mp4);
  } catch (error) {
    res.status(500).json({ error: "MP4 conversion failed.", detail: error.message });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`StickMotion render API listening on ${PORT}`));
