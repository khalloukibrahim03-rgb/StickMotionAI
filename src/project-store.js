import { clampDuration } from "./timeline.js";

const PROJECT_VERSION = 1;
const MOTIONS = new Set(["idle", "walk", "run", "shock"]);
const CAMERAS = new Set(["wide", "tracking", "close"]);
const LIGHTING = new Set(["cinematic", "warm", "blackout"]);

export function serializeProject({ script, defaultDuration = 6, scenes = [] }) {
  const payload = {
    version: PROJECT_VERSION,
    script: String(script ?? "").slice(0, 50000),
    defaultDuration: clampDuration(defaultDuration),
    scenes: scenes.slice(0, 20).map(scene => ({
      id: Number(scene.id),
      duration: clampDuration(scene.duration),
      motion: MOTIONS.has(scene.motion) ? scene.motion : "idle",
      camera: CAMERAS.has(scene.camera) ? scene.camera : "wide",
      lighting: LIGHTING.has(scene.lighting) ? scene.lighting : "cinematic",
      subtitle: String(scene.subtitle ?? scene.text ?? "").slice(0, 240)
    }))
  };
  return JSON.stringify(payload);
}

export function deserializeProject(raw) {
  let data;
  try { data = JSON.parse(String(raw)); } catch { return null; }
  if (!data || data.version !== PROJECT_VERSION || typeof data.script !== "string" || !Array.isArray(data.scenes)) return null;
  if (data.script.length > 50000 || data.scenes.length > 20) return null;
  const scenes = [];
  for (const scene of data.scenes) {
    if (!scene || !Number.isInteger(Number(scene.id)) || Number(scene.id) < 1) return null;
    scenes.push({
      id: Number(scene.id),
      duration: clampDuration(scene.duration),
      motion: MOTIONS.has(scene.motion) ? scene.motion : "idle",
      camera: CAMERAS.has(scene.camera) ? scene.camera : "wide",
      lighting: LIGHTING.has(scene.lighting) ? scene.lighting : "cinematic",
      subtitle: String(scene.subtitle ?? "").slice(0, 240)
    });
  }
  return {
    version: PROJECT_VERSION,
    script: data.script,
    defaultDuration: clampDuration(data.defaultDuration),
    scenes
  };
}
