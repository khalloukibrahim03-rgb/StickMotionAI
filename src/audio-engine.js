const MOTION_EVENTS = new Set(["walk", "run"]);

export function getSceneSoundEvents(scene = {}) {
  const events = [];
  if (MOTION_EVENTS.has(scene.motion)) events.push("footsteps");
  if (scene.lighting === "blackout") events.push("power-down-impact");
  if (scene.motion === "shock") events.push("shock-whoosh");
  return events;
}

/**
 * Procedural sound effects only. No music or soundtrack is generated.
 * Audio is routed both to the speakers and to a MediaStream destination
 * so a browser recording can include the same effects.
 */
export function createSoundEngine() {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  let context;
  let master;
  let destination;
  let narrationBuffer = null;
  let narrationSource = null;

  function ensureContext() {
    if (!AudioContextClass) throw new Error("Web Audio is not supported by this browser.");
    if (context) return;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.42;
    destination = context.createMediaStreamDestination();
    master.connect(context.destination);
    master.connect(destination);
  }

  function noiseBurst(at, duration, frequency, volume) {
    const length = Math.max(1, Math.ceil(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(at);
    source.stop(at + duration + 0.02);
  }

  function lowThump(at, frequency = 72, volume = 0.3, duration = 0.24) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(34, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  function playScene(scene) {
    if (!context || context.state !== "running") return;
    const now = context.currentTime + 0.04;
    for (const event of getSceneSoundEvents(scene)) {
      if (event === "footsteps") {
        const count = scene.motion === "run" ? 5 : 3;
        const interval = scene.motion === "run" ? 0.27 : 0.48;
        for (let i = 0; i < count; i += 1) {
          const at = now + i * interval;
          lowThump(at, scene.motion === "run" ? 95 : 78, 0.12, 0.13);
          noiseBurst(at, 0.11, 520, 0.07);
        }
      } else if (event === "power-down-impact") {
        lowThump(now, 54, 0.48, 0.72);
        noiseBurst(now, 0.8, 180, 0.16);
      } else if (event === "shock-whoosh") {
        noiseBurst(now, 0.62, 1100, 0.2);
        lowThump(now + 0.18, 66, 0.24, 0.34);
      }
    }
  }

  function stopNarration() {
    if (!narrationSource) return;
    try { narrationSource.stop(); } catch {}
    narrationSource.disconnect();
    narrationSource = null;
  }

  async function loadNarrationBlob(blob) {
    ensureContext();
    if (!blob || !String(blob.type || "").startsWith("audio/")) throw new Error("Choose an audio file such as MP3 or WAV.");
    const bytes = await blob.arrayBuffer();
    narrationBuffer = await context.decodeAudioData(bytes.slice(0));
    return narrationBuffer.duration;
  }

  async function loadNarration(file) {
    if (!file || !String(file.type || "").startsWith("audio/")) throw new Error("Choose an audio file such as MP3 or WAV.");
    return loadNarrationBlob(file);
  }

  function playNarration(offset = 0) {
    if (!context || !narrationBuffer || context.state !== "running") return false;
    stopNarration();
    const startAt = Math.max(0, Math.min(Number(offset) || 0, narrationBuffer.duration));
    if (startAt >= narrationBuffer.duration) return false;
    const source = context.createBufferSource();
    source.buffer = narrationBuffer;
    source.connect(master);
    narrationSource = source;
    source.onended = () => {
      source.disconnect();
      if (narrationSource === source) narrationSource = null;
    };
    source.start(0, startAt);
    return true;
  }

  return {
    async start() {
      ensureContext();
      if (context.state !== "running") await context.resume();
    },
    playScene,
    loadNarration,
    loadNarrationBlob,
    playNarration,
    stopNarration,
    getNarrationDuration() {
      return narrationBuffer?.duration || 0;
    },
    getTrack() {
      ensureContext();
      return destination.stream.getAudioTracks()[0] || null;
    }
  };
}
