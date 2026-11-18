const MOTIONS = new Set(["idle", "walk", "run", "shock"]);
const CAMERAS = new Set(["wide", "tracking", "close"]);
const LIGHTING = new Set(["cinematic", "warm", "blackout"]);

export function buildTimeline(scenes, defaultDuration = 6) {
  const duration = clampDuration(defaultDuration);
  return scenes.map(scene => {
    const text = scene.text.toLowerCase();
    const motion = /run|running|يركض|يجري|الهروب/.test(text) ? "run"
      : /shock|صدمة|مصدوم|خوف|انطف|انقطع/.test(text) ? "shock"
      : /walk|walking|يمشي|يسير/.test(text) ? "walk" : "idle";
    return {
      ...scene,
      duration,
      motion,
      camera: motion === "run" ? "tracking" : motion === "shock" ? "close" : "wide",
      lighting: /انطف|انقطع|blackout|darkness/.test(text) ? "blackout" : "cinematic",
      subtitle: scene.text
    };
  });
}

export function clampDuration(value, fallback = 6) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(12, Math.max(3, n)) : fallback;
}

export function updateScene(scenes, id, patch) {
  return scenes.map(scene => {
    if (scene.id !== id) return scene;
    const next = { ...scene };
    if (Object.hasOwn(patch, "duration")) next.duration = clampDuration(patch.duration);
    if (Object.hasOwn(patch, "motion") && MOTIONS.has(patch.motion)) next.motion = patch.motion;
    if (Object.hasOwn(patch, "camera") && CAMERAS.has(patch.camera)) next.camera = patch.camera;
    if (Object.hasOwn(patch, "lighting") && LIGHTING.has(patch.lighting)) next.lighting = patch.lighting;
    if (Object.hasOwn(patch, "subtitle")) next.subtitle = String(patch.subtitle).slice(0, 240);
    return next;
  });
}

export function setAllDurations(scenes, duration) {
  const value = clampDuration(duration);
  return scenes.map(scene => ({ ...scene, duration: value }));
}

export function getTimelineDuration(scenes) {
  return scenes.reduce((sum, scene) => sum + clampDuration(scene.duration), 0);
}

export function getSceneAtTime(scenes, time) {
  if (!scenes.length) return null;
  let cursor = 0;
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const end = cursor + clampDuration(scene.duration);
    if (time < end || index === scenes.length - 1) {
      return { scene, index, localTime: Math.max(0, time - cursor), start: cursor };
    }
    cursor = end;
  }
  return null;
}
