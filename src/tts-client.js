export function validateTtsInput({ text, voice, speed = 1 } = {}) {
  const cleanText = String(text || "").trim();
  const cleanVoice = String(voice || "").trim();
  const numericSpeed = Number(speed);
  if (!cleanText) throw new Error("اكتب النص الذي تريد تحويله إلى صوت.");
  if (cleanText.length > 5000) throw new Error("النص طويل جداً. الحد الأقصى 5000 حرف لكل عملية.");
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanVoice)) throw new Error("اسم الصوت غير صالح.");
  if (!Number.isFinite(numericSpeed) || numericSpeed < 0.7 || numericSpeed > 1.3) {
    throw new Error("سرعة الصوت يجب أن تكون بين 0.7 و1.3.");
  }
  return { text: cleanText, voice: cleanVoice, length_scale: Number((1 / numericSpeed).toFixed(3)) };
}

export async function synthesizeSpeech(input, fetchImpl = fetch) {
  const payload = validateTtsInput(input);
  const response = await fetchImpl("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let message = "تعذر توليد الصوت.";
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
      if (data?.detail) message += " " + data.detail;
    } catch {}
    throw new Error(message);
  }
  const blob = await response.blob();
  if (!blob.size || (blob.type && !blob.type.includes("audio"))) {
    throw new Error("خادم TTS لم يُرجع ملفاً صوتياً صالحاً.");
  }
  return blob;
}
