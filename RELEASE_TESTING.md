# StickMotion AI — Release Test Checklist

This is a hands-on test guide for the current `development` build. The project is still an early studio build; complete these checks before publishing a finished video.

## 1. Requirements

- Windows 10/11, macOS, or Linux
- Node.js 20+ and npm
- Current Chrome or Edge (recommended for WebGL and MediaRecorder)
- Optional: Piper TTS installed locally with a compatible voice model

## 2. Start the app

Open PowerShell or a terminal in the repository folder:

```bash
npm install
npm run dev:full
```

Keep the terminal open. Open the Vite address printed in the terminal (normally http://localhost:5173).

To confirm the render server is running, open http://localhost:5173/api/health. The response should contain `"ok":true` and `"ffmpeg":true`.

## 3. Test the basic studio

1. Confirm the 3D preview appears and the sample script is loaded.
2. Select **تحليل المشاهد** and confirm scene cards appear.
3. Select each scene and change movement, camera, lighting, duration, and subtitle.
4. Press **معاينة الفيلم**. Check that the character moves and the Arabic subtitle is readable.
5. Drag the timeline scrubber and confirm the preview jumps to the selected time.
6. Save the project, refresh the page, then load the project and verify the scene settings return.

## 4. Test narration and subtitles

1. Import a known-good MP3 or WAV narration file.
2. Preview the film and listen for narration and scene sound effects.
3. Check that the narration is not cut off at the end. The export should extend to the narration duration when it is longer than the scene timeline.
4. Export the SRT file and open it in a text editor. Confirm Arabic characters display correctly and timestamps follow the scene durations.
5. Optional Piper test: start the Piper HTTP server with a voice model installed on this computer, then use the TTS panel. TTS will not work unless Piper and its matching voice model are running locally.

## 5. Test a real MP4 export

1. Use a short 10–20 second test script first.
2. Press **إنشاء الفيلم وتصديره** and wait for the conversion to finish.
3. Confirm the downloaded file is `StickMotion_Film.mp4`.
4. Open the MP4 in VLC or another player. Check picture, Arabic subtitles, narration, and sound effects.
5. Check the file properties or run:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of default=noprint_wrappers=1 StickMotion_Film.mp4
```

Expected video settings: H.264, 1920×1080, 30 fps (browser capture can vary), and yuv420p. If audio is present, verify it plays from beginning to end.

## 6. Before publishing

- Watch the entire exported MP4, not only the browser preview.
- Check subtitle spelling, line breaks, timing, and safe margins on a phone-sized screen.
- Listen with headphones for clipping, missing narration, or abrupt sound transitions.
- Confirm the final video contains no unintended background music.
- Keep the original project and a backup of the exported MP4.

## Current limitations to keep in mind

- Export target is Full HD 1080p, not 4K.
- The character and environment are procedural 3D primitives; higher encoding quality cannot add detail that is not present in the scene.
- Piper TTS requires a separately installed local server and voice model. No hosted/cloud TTS is included.
- The director is rule-based rather than a generative AI model.
- Browser/device performance affects real-time capture. A successful CI build is not a substitute for watching a complete export on your own computer.
