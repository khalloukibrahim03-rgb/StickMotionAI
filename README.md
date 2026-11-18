# StickMotion AI

Cinematic 3D Stickman Film Studio. Active implementation is on the `development` branch. The `main` branch remains the initial stable baseline.

## Current development build

- Three.js scene with a procedural dark city environment.
- Official Stickman visual direction: white spherical head, black body and limbs.
- Bilingual script parser and editable scene timeline with per-scene duration, movement, camera, lighting, and subtitle settings.
- Timeline scrubbing and preview playback; Arabic subtitle text is drawn into the WebGL frame for recording.
- Local project save and restore in the browser, including each scene's custom settings.
- Live camera, lighting, and character animation preview.
- Procedural scene-synchronized sound effects (footsteps, blackout impact, and shock whoosh), with no background music.
- Import an MP3/WAV narration track and synchronize it from the start or current preview position; narration and sound effects are included in the browser recording when supported.
- Browser recording of the actual WebGL canvas and mixed audio to WebM using MediaRecorder.
- Express endpoint that converts an uploaded WebM recording into H.264 MP4 using FFmpeg.
- GitHub Actions workflow that runs unit tests and the Vite production build.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev:full
```

Open the Vite URL printed in the terminal (normally http://localhost:5173). The render API listens on port 8787 and is proxied by Vite.

For a frontend-only preview, run `npm run dev`. Recording will produce a WebM fallback if the FFmpeg API is not running.

## Build

```bash
npm test
npm run build
```

## Important current limitations

This is an early functional foundation, not a finished AI film studio. Scene parsing is rule-based, not an LLM-powered AI director. The current character and environment are procedural primitives. AI voice generation (TTS) is not implemented: narration must currently be supplied as an MP3/WAV file. Procedural sound effects are illustrative synthesized effects, not recordings from a professional sound library. The narration file is loaded for the current browser session and is not embedded in the saved project. A full keyframe curve editor, cloud-synced projects, and cloud rendering are also not implemented yet.

MP4 export is real only when the app can reach the Express render API and FFmpeg successfully converts the recorded WebM. Without that service, the app downloads a WebM preview and clearly reports that MP4 conversion was unavailable. Browser MediaRecorder and WebGL support depend on the browser and device.

## Project goals

- AI-assisted script-to-storyboard direction.
- Character, world, animation, camera, and lighting studios.
- English narration, Arabic/Darija subtitles, and natural sound effects.
- Prefer free and open-source components; never imply paid AI services are free.
