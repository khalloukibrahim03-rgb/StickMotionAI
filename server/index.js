import express from "express";
import multer from "multer";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (String(file.mimetype || "").split(";")[0] !== "video/webm") {
      const error = new Error("Upload a WebM video recording.");
      error.status = 415;
      return callback(error);
    }
    callback(null, true);
  }
});
const PORT = Number(process.env.PORT || 8787);

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "stickmotion-render", ffmpeg: Boolean(ffmpegPath), ttsEndpoint: process.env.PIPER_TTS_URL || "http://127.0.0.1:5000/synthesize" }));

app.post("/api/tts", express.json({ limit: "64kb" }), async (req, res) => {
  const text = String(req.body?.text || "").trim();
  const voice = String(req.body?.voice || "").trim();
  const lengthScale = Number(req.body?.length_scale ?? 1);
  if (!text) return res.status(400).json({ error: "اكتب النص أولاً." });
  if (text.length > 5000) return res.status(413).json({ error: "الحد الأقصى للنص هو 5000 حرف." });
  if (!/^[a-zA-Z0-9_-]+$/.test(voice)) return res.status(400).json({ error: "اسم الصوت غير صالح." });
  if (!Number.isFinite(lengthScale) || lengthScale < 0.7 || lengthScale > 1.43) {
    return res.status(400).json({ error: "قيمة سرعة النطق غير صالحة." });
  }
  const endpoint = process.env.PIPER_TTS_URL || "http://127.0.0.1:5000/synthesize";
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice, length_scale: lengthScale }),
      signal: AbortSignal.timeout(120000)
    });
    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 1000);
      return res.status(502).json({ error: "تعذر على Piper إنشاء الصوت. تحقق من الخادم واسم نموذج الصوت.", detail });
    }
    const contentType = upstream.headers.get("content-type") || "audio/wav";
    if (!contentType.includes("audio")) return res.status(502).json({ error: "خادم Piper لم يُرجع ملفاً صوتياً." });
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", 'attachment; filename="StickMotion_Narration.wav"');
    const audio = Buffer.from(await upstream.arrayBuffer());
    if (!audio.length) return res.status(502).json({ error: "ملف الصوت الناتج فارغ." });
    res.send(audio);
  } catch (error) {
    const unavailable = error.cause?.code === "ECONNREFUSED" || error.name === "TimeoutError";
    res.status(unavailable ? 503 : 502).json({
      error: unavailable
        ? "خادم Piper المحلي غير متصل. شغّله على المنفذ 5000 ثم حاول مجدداً."
        : "حدث خطأ أثناء الاتصال بخادم Piper.",
      detail: error.message
    });
  }
});

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

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "The WebM upload exceeds the 300 MB limit." });
  }
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: status === 415 ? error.message : "Video upload failed.", detail: status === 500 ? error.message : undefined });
});

app.listen(PORT, "0.0.0.0", () => console.log(`StickMotion render API listening on ${PORT}`));
