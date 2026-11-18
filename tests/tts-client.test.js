import test from "node:test";
import assert from "node:assert/strict";
import { validateTtsInput, synthesizeSpeech } from "../src/tts-client.js";

test("validates and normalizes a Piper request", () => {
  assert.deepEqual(validateTtsInput({ text: "  Hello  ", voice: "en_US-ryan-high", speed: 1.25 }), {
    text: "Hello", voice: "en_US-ryan-high", length_scale: 0.8
  });
});

test("rejects empty text, invalid voice names and out-of-range speed", () => {
  assert.throws(() => validateTtsInput({ text: " ", voice: "en_US-amy" }), /اكتب النص/);
  assert.throws(() => validateTtsInput({ text: "Hello", voice: "../voice" }), /غير صالح/);
  assert.throws(() => validateTtsInput({ text: "Hello", voice: "en_US-amy", speed: 2 }), /سرعة الصوت/);
});

test("posts to the local app proxy and returns generated audio", async () => {
  let request;
  const wav = new Blob(["RIFF"], { type: "audio/wav" });
  const result = await synthesizeSpeech({ text: "Hello", voice: "en_US-amy-medium" }, async (url, options) => {
    request = { url, options };
    return new Response(wav, { status: 200, headers: { "Content-Type": "audio/wav" } });
  });
  assert.equal(request.url, "/api/tts");
  assert.equal(JSON.parse(request.options.body).text, "Hello");
  assert.equal(result.type, "audio/wav");
});

test("surfaces a local Piper server error", async () => {
  await assert.rejects(
    synthesizeSpeech({ text: "Hello", voice: "en_US-amy-medium" }, async () =>
      new Response(JSON.stringify({ error: "Piper server is offline." }), {
        status: 503, headers: { "Content-Type": "application/json" }
      })
    ),
    /Piper server is offline/
  );
});
