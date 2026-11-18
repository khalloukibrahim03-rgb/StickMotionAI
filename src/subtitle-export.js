function timestamp(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const wholeSeconds = Math.floor(value % 60);
  const milliseconds = Math.floor((value - Math.floor(value)) * 1000);
  return [hours, minutes, wholeSeconds].map(n => String(n).padStart(2, "0")).join(":")
    + "," + String(milliseconds).padStart(3, "0");
}

export function buildSrt(scenes = []) {
  let cursor = 0;
  const entries = [];
  for (const scene of scenes) {
    const duration = Math.min(12, Math.max(3, Number(scene.duration) || 6));
    const text = String(scene.subtitle ?? scene.text ?? "").trim();
    if (text) {
      entries.push(`${entries.length + 1}\n${timestamp(cursor)} --> ${timestamp(cursor + duration)}\n${text}`);
    }
    cursor += duration;
  }
  return entries.length ? entries.join("\n\n") + "\n" : "";
}
