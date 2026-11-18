# StickMotion AI

Cinematic 3D Stickman Film Studio. Active implementation is on the `development` branch. The `main` branch remains the initial stable baseline.

## Current development build

- Three.js scene with a procedural dark city environment.
- Official Stickman visual direction: white spherical head, black body and limbs.
- Script line parser that creates a simple scene list and assigns basic procedural movement from keywords.
- Live camera, lighting, and character animation preview.
- Browser recording of the actual WebGL canvas to WebM using MediaRecorder.
- Express endpoint that converts an uploaded WebM recording into H.264 MP4 using FFmpeg.
- GitHub Actions workflow that runs the Vite production build.

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
npm run build
```

## Important current limitations

This is an early functional foundation, not a finished AI film studio. Scene parsing is rule-based, not an LLM-powered AI director. The current character and environment are procedural primitives. Voice generation, audio mixing, accurate speech/subtitle synchronization, a keyframe editor, persistent projects, and cloud rendering are not implemented yet.

MP4 export is real only when the app can reach the Express render API and FFmpeg successfully converts the recorded WebM. Without that service, the app downloads a WebM preview and clearly reports that MP4 conversion was unavailable. Browser MediaRecorder and WebGL support depend on the browser and device.

## Project goals

- AI-assisted script-to-storyboard direction.
- Character, world, animation, camera, and lighting studios.
- English narration, Arabic/Darija subtitles, and natural sound effects.
- Timeline editing and reliable H.264 MP4 rendering.
- Prefer free and open-source components; never imply paid AI services are free.
