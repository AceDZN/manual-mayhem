# Manual Mayhem audio

Original composition **Festival Engine**, composed and synthesized locally for this game. No commercial music, external recordings, paid services, third-party samples, runtime keys or audio network dependencies. Notes, instruments, rhythmic patterns, environmental bed and effects are reproducible from [`scripts/audio-compose.py`](scripts/audio-compose.py). The original audio and composition source are MIT licensed; see [`public/audio/LICENSE.txt`](public/audio/LICENSE.txt).

## Score and arrangement

108 BPM, 4/4, D major. 32 bars / 71.111 seconds, ABAC with eight bars in each section. The shared transport keeps four music buffers sample aligned. A fifth source supplies the environmental loop.

| Layer | Musical content | Runtime entry |
| --- | --- | --- |
| Harmony | Airy sine/analog chord voicings; D6, Bm7, Gmaj7, Aadd9; light stereo delay | Engine inspection begins |
| Groove | Warm bass with root/fifth/octave movement, soft kick, brushed noise hats and woodblock backbeat | First module stabilizes |
| Glass | Authored syncopated eight-bar glass/marimba motif, answering phrases and harmonic B variation | Second module stabilizes |
| Lift | Quiet high arpeggios, percussion pickups and stronger C voicing | Third module stabilizes |
| Ambience | Slow fan harmonics, filtered air, occasional timber/airship creak | Engine inspection begins |

A (bars 1–8): D–D–Bm–Bm–G–G–A–A. B (9–16): G–A–D–Bm twice, varied motif. A (17–24): motif returns. C (25–32): Bm–G–D–A–G–A–D–D, brighter arpeggio and resolved cadence into the opening D. Instrument envelopes wrap into the next loop rather than truncating tails. Runtime loop points use the exact score duration, excluding encoder padding.

## Tactile vocabulary

Eleven separate local cues: `knob` (low detent), `switch` (two-part thunk), `cable` (elastic snap/ping), `latch` (double metallic catch), `page` (fluttering filtered noise), `settle` (descending glass), `error` (soft pressure vent), `strike` (brief low dissonance), `reset` (ascending winding), `activate` (major arpeggio), `victory` (resolved engine cadence). Repeated short cues vary pitch by ±3% and pan slightly. No sustained reading alarm. Visual and textual error feedback remains the game's responsibility.

## Integration and controls

`AudioEngine` in `src/audio.ts` exports `start()`, `setPaused(bool)`, `setProgress(0..3)`, `setGains({master,music,sfx,voice})`, `duck(bool)`, `cue(name)`, `snapshot()` and `dispose()`. `start()` must be called by a gesture and is idempotent. Restart resets progress on the same engine; it does not allocate new loops. Gain changes ramp, ten one-shots maximum, compressor protects headroom, settings persist under `manual-mayhem-audio-v1`. Manual/translation reading can duck music and ambience to 28%. Pause and blur fade master before suspending the context; resume/focus preserve transport phase. Independent voice gain is provided; this version contains no spoken audio and claims no listening/speaking assessment.

## Preview and numerical verification

[25-second mixed WAV preview](docs/audio/manual-mayhem-mix-preview.wav) · [bundled MP3 preview](public/audio/manual-mayhem-preview.mp3), served at `/audio/manual-mayhem-preview.mp3`. Both contain the same original MIT-licensed composition and effects. The preview introduces groove at 3s, glass at 8s and lift at 16s, with all eleven effects placed in context. Preview fades are for this standalone demonstration; the game uses a complete loop.

- Stereo PCM16, 22050 Hz, exactly 25.000 seconds; verified decodable by `ffprobe`.
- Peak **−11.63 dBFS**, RMS **−27.64 dBFS**, zero clipped samples.
- The sixteen playback assets total approximately 5.5 MiB, plus a 392 KiB MP3 preview. Four music loop buffers, one ambience buffer and eleven short WAV effects; decoded audio memory is approximately 55 MB at the source sample rate, and can increase when browser AudioContext resamples.
- Source waveform boundary sample changes: harmony 0.0006833, groove 0.0001786, glass 0.0002706, lift 0.0011911; ambient end is matched to its beginning. These measurements bound discontinuity and do not establish subjective musical quality.
- Full asset measurements: [`docs/audio/audio-metrics.json`](docs/audio/audio-metrics.json). The separately served MP3 preview decodes to 25.001 seconds, peak −12.27 dBFS, RMS −28.09 dBFS, zero clipped samples; [`preview-mp3-validation.json`](docs/audio/preview-mp3-validation.json) records its codec measurements and SHA-256.

Rebuild with the bundled Python runtime (NumPy) and local `ffmpeg`: `python3 scripts/audio-compose.py`. Numerical metrics are generated from the source PCM before encoding. `ffprobe -v error -show_entries format=duration:stream=codec_name,sample_rate,channels -of json docs/audio/manual-mayhem-mix-preview.wav` checks the saved deliverable.

## Playback QA status

The standalone browser harness passed **16 assertions** in real Chromium Web Audio playback with no console errors. Evidence: [`docs/audio/browser-audio-qa.json`](docs/audio/browser-audio-qa.json) and an inspected [`audio-browser-qa.png`](docs/audio/audio-browser-qa.png). Executed `node scripts/audio-browser-qa.mjs` against the local Vite server. Verified gesture start, sixteen decoded buffers, nonzero output, independent gain persistence, master-zero silence, ducking, all eleven cues, paused/frozen transport, resume, repeated restarts retaining five loop sources, and actual HTML preview playback advancing in time. The initial cold-start test used an arbitrary 500ms wait; the final test waits for decoded sources and nonzero output before assessing playback.

Headless Chromium did **not** change native tab visibility when another tab was selected; this is recorded as an observation, not a pass. Synthetic browser blur/focus events verified the handlers suspend and resume the existing transport. Native OS focus behavior still requires a headed/native check.

Independent `scripts/audio-validate.py` decoded every saved asset with ffmpeg: sixteen successes, zero clipped samples; all four decoded score loops retain exactly 71.111111 seconds, ambience 17.777778 seconds. Encoded boundary deltas are recorded in [`docs/audio/encoding-validation.json`](docs/audio/encoding-validation.json).

The later independent **integrated game-UI run passed all nine missions** using real controls. [`docs/qa/browser-results.json`](docs/qa/browser-results.json) records gesture-driven AudioContext start, sixteen loaded assets, five active sources, settings persistence, pause suspension, Escape resume and restart retaining five sources, with no console errors. [`docs/qa/browser-playtest.mjs`](docs/qa/browser-playtest.mjs) contains the exact assertions: the music slider is set to zero through its keyboard control and remains zero after reload; pause suspends the context; Escape resumes; restart preserves the source count. The sound-check button was clicked in this run, while the separate harness established actual cue playback.

The inspected state captures support layer endpoints: [`skill-client/state-0.json`](docs/qa/skill-client/state-0.json) shows the initial running mix with zero added module stems and nonzero RMS; all three transfer-win captures ([G7](docs/qa/g7-transfer-won.json), [G8](docs/qa/g8-transfer-won.json), [G9](docs/qa/g9-transfer-won.json)) show three module stems and five active sources. [`keyboard-cable.json`](docs/qa/keyboard-cable.json) captures an intermediate one-stem state. These integrated snapshots do not separately establish every intermediate stem transition; the standalone audio harness checks the layer API.

Earlier diagnostic history: `node scripts/audio-game-qa.mjs` initially timed out waiting for the full-page load before Start. Its final snapshot was the valid intro with no audio context; [`integrated-audio-qa-failure.json`](docs/audio/integrated-audio-qa-failure.json) preserves that earlier evidence. The later successful independent UI run supersedes that initial loading blocker. Main settings now pause action pressure while ducking audio, allowing sound check after Start.

No human listening or subjective audition is claimed; numerical analysis and automated playback alone are not listening.
