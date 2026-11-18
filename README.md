# StickMotion AI

Cinematic 3D Stickman Film Studio. Active implementation is on the `development` branch. The `main` branch remains the initial stable baseline.

## Current development build

- Three.js scene with a procedural dark city environment.
- Official Stickman visual direction: white spherical head, black body and limbs.
- Bilingual script parser and editable scene timeline with per-scene duration, movement, camera, lighting, and subtitle settings.
- Timeline scrubbing and preview playback; Arabic subtitle text is drawn into the WebGL frame for recording.
- Export scene-timed subtitles as a standalone UTF-8 SRT file for YouTube or external video editors.
- Local project save and restore in the browser, including each scene's custom settings.
- Live camera, lighting, and character animation preview.
- Procedural scene-synchronized sound effects (footsteps, blackout impact, and shock whoosh), with no background music.
- Import an MP3/WAV narration track and synchronize it from the start or current preview position; narration and sound effects are included in the browser recording when supported.
- Optional local Piper TTS integration: enter script text, voice model ID, and speech speed to generate a WAV narration file without a paid cloud API. The generated WAV is loaded into the current session and downloaded separately.
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

## Local Piper TTS setup

The TTS button uses the Piper HTTP server running on the same computer as the StickMotion Express server. With Python installed on Windows, open PowerShell and install Piper's HTTP extra:

```powershell
py -m pip install "piper-tts[http]"
py -m piper.http_server -m en_US-ryan-high
```

Keep that terminal open. The server's default endpoint is `http://127.0.0.1:5000/synthesize`. In a second terminal, start StickMotion with `npm run dev:full`. See the [Piper project](https://github.com/OHF-Voice/piper1-gpl) for current installation and voice-model instructions.

If Piper listens elsewhere, set `PIPER_TTS_URL` before starting the StickMotion server, for example:

```powershell
$env:PIPER_TTS_URL="http://127.0.0.1:5000/synthesize"
npm run server
```

The UI voice field must match a voice installed on the Piper server. Examples include `en_US-ryan-high` for English and `ar_JO-kareem-medium` for Arabic (Jordanian Arabic, not Moroccan Darija). Piper's voice catalogue lists Arabic models and their model files; download both the `.onnx` file and its matching `.onnx.json` configuration. Voice model downloads are separate and may be large. Review each model's license before publishing generated narration. TTS runs locally only when this server is running on the same computer. A remote Render deployment cannot reach the user's own localhost Piper server automatically; no hosted TTS service is bundled.

## Build

```bash
npm test
npm run build
```

## Important current limitations

This is an early functional foundation, not a finished AI film studio. Scene parsing is rule-based, not an LLM-powered AI director. The current character and environment are procedural primitives. AI voice generation is not hosted in the cloud. The optional TTS button connects to a separately installed local Piper HTTP server; without Piper running, users must import an MP3/WAV file as before. Procedural sound effects are illustrative synthesized effects, not recordings from a professional sound library. The narration file is loaded for the current browser session and is not embedded in the saved project. SRT export uses the scene subtitle text and scene durations; it does not transcribe narration automatically. A full keyframe curve editor, cloud-synced projects, and cloud rendering are also not implemented yet.

MP4 export is real only when the app can reach the Express render API and FFmpeg successfully converts the recorded WebM. Without that service, the app downloads a WebM preview and clearly reports that MP4 conversion was unavailable. Browser MediaRecorder and WebGL support depend on the browser and device.

## Project goals

- AI-assisted script-to-storyboard direction.
- Character, world, animation, camera, and lighting studios.
- English narration, Arabic/Darija subtitles, and natural sound effects.
- Prefer free and open-source components; never imply paid AI services are free.
