export function parseScript(raw, maxScenes = 20) {
  return String(raw ?? "")
    .split(/\r?\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxScenes)
    .map((line, index) => ({
      id: index + 1,
      text: line.replace(/^(?:(?:scene|المشهد)\s*\d*\s*[:：-]?\s*)/i, "").trim()
    }))
    .filter(scene => scene.text.length > 0);
}

export function normalizeDuration(value, fallback = 6) {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return fallback;
  return Math.min(12, Math.max(3, duration));
}
