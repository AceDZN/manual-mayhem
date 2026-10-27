# Campaign audio regression

28 October 2026 (Asia/Jerusalem). **14 checks passed**, no page or console errors, using native Chrome headless with the Metal renderer. The browser closed before the next independent physical-control QA window. Runtime audio source and sound assets were unchanged for this campaign test.

Executed:

```sh
node docs/qa/campaign/audio/regression.mjs docs/qa/campaign/earned-storage-state.json
```

[Full state evidence](results.json) records every assertion and the source save's SHA-256. The first context earned level 1 through real visible controls, then exercised replay, Next, map and saved resume. Later levels used the exact storage exported immediately after the independent QA team's real 30-level UI completion, before its error/replay/mobile tests. No unlocks, completion records or wins were injected. Later successes are **replays** and carry their legitimate nonzero retry counts; they are not claimed as new unaided first attempts.

The action sequences came from [independently authored manual readings](../solutions.json), not `ModuleSpec.steps` or `nextActions`. Cable/valve/relay actions used visible operation controls; physical 3D drag coverage belongs to the independent campaign QA run.

| Case | Observed result |
| --- | --- |
| Fresh level 1 | One active module, two standby modules, zero added stems; gesture creates sixteen decoded buffers and five loop sources with nonzero output |
| Reading → operation | Actual music gain 0.75 → 0.21 → 0.75; the stored preference is preserved |
| Level 1 completion | One activation and exactly one earned stem; standby modules add nothing |
| Replay and Next | Both reset musical progress to zero while retaining five sources |
| Campaign map | Mix ducks, context suspends and transport time freezes; closing resumes the existing sources |
| Map selection and saved resume | Unlocked level replay and reload start a fresh world with zero added stems |
| Level 6 | Two active modules; initial zero stems |
| Completed-module recovery | Cable completion adds one stem; reset removes it (1 → 0), with no additional activation or loop |
| Level 6 win and Next | Two stems at win, third added stem stays off; level 7 load resets to zero |
| Level 15 | Actual module completions produce 1 → 2 → 3 stems, then victory cadence |
| Level 30 | Actual final-level replay produces 1 → 2 → 3 stems and victory; final map suspends; replay resets to zero |
| Settings | Independent master/music/SFX/voice controls, real sound-check cue, and master mute producing zero output RMS |
| Pause / resume / restart | Paused transport freezes; resume and three restarts retain five sources; restart resets added stems |
| Final saved resume | Level 30 resumes as a fresh attempt; master 0.8, music 0.5, SFX 0.6, voice 0.4 persist; zero added stems and five sources |

Inspected captures: [early win](early-level-1-won.png), [final replay win](final-level-30-won.png), [final fresh resumed operation](final-resumed-operation.png).

The lead corrected one source-review finding before this run: recovery now recomputes the count of active completed modules, so resetting a stable module removes its musical layer. The new 14-check run verified that behavior.

This is automated browser playback and AudioContext/gain/cue observation. It is not a human listening session or subjective musical-quality assessment. Voice gain remains available for future voiced content; this game contains no spoken clips. Earlier native-OS focus limitations remain documented in AUDIO.md.
