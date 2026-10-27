# Independent playtest

2026-10-27. Tester: independent English/QA helper. Scope: this standalone repository only. Source review, semantic tests, the nine-mission integrated browser run, physical-control tests and final recorded sequence are complete. Native focus-event generation has an explicit environment limitation below. No classroom learning gain or musical-quality claim can be established by automation.

## Planned causal paths

- Each grade: guided win, independent win, unaided changed-context transfer.
- Wrong English interpretation → visible strike/consequence → reset/recovery → successful procedure.
- Hint/translation and retry evidence remain marked as assisted.
- Identical-looking paired fixtures require different valid actions when negation, order, passive agent/receiver or conditional meaning changes.
- Keyboard-only controls; Hebrew keyboard layout; touch and resize; camera rotation versus dial drag; cable drag cancellation.
- Manual/inspection/settings/pause and Escape priority; pressure pauses during practice reading; restart from current grade.
- Static partner manual contains general rules and no live machine state.
- Audio start after gesture, running state, settings persistence, pause/resume/restart/focus handling. Audio-owner audition and waveform checks are reported separately in AUDIO.md.

## Commands and evidence

- `npm test` → 25/25 pass. Tests use independently authored action solutions read from the manuals, not the evaluator's `nextActions` helper. Both sides of order/reference/passive contrasts, repeated zero-conditional effects, past-passive receiver tagging, current-state evidence, generic paired startup, reset/strikes/shutdown and assistance are covered.
- `node /Users/acedzn/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js --url http://localhost:5262 --click-selector '#start' --actions-json '{"steps":[{"buttons":["enter"],"frames":1},{"buttons":[],"frames":4}]}' --iterations 1 --pause-ms 100 --screenshot-dir docs/qa/skill-client` → completed. `shot-0.png` and `state-0.json` inspected: genuine 3D playing state; AudioContext running, 16 buffers, 5 loops, nonzero RMS. No client error file.
- `node docs/qa/browser-playtest.mjs` → final run after S22 tag and V21 calibration fix passed all nine missions and the 16 recorded checks; `docs/qa/browser-results.json` contains no console/page errors. The script operates the actual dropdowns, buttons, keyboard and touch controls and never injects a solved state.
- `node docs/qa/physical-playtest.mjs` → eight causal checks passed: overview rotation 0.33 radians, physical wheel rim drag with camera rotation held at zero, large-wheel raycast click, cable cancellation, cable/socket/clips/test, timing freezes, full B-variant recovery and startup, and maintenance receiver tagging. Actual snapshots are in `physical-*.png/json`, `paired-b-*.png/json`, `maintenance-tag.png/json` and `cable-mid-drag.png`. The last headless native-tab focus assertion failed because no blur/visibility event was generated; `physical-results.json` preserves that observation and labels the environment limitation.
- `node docs/qa/evidence-playtest.mjs` → five checks passed on final source: failed attempt survives leave/re-entry and reload; a hint cannot be re-entered as first attempt; A/B attempts have separate keys; master mute/unmute works; synthetic blur freezes the overview clock and focus resumes without time catchup. The first version of this test forgot to re-enable the optional challenge checkbox after reload and compared null times; that harness setup was corrected before the passing run.
- `node docs/qa/headed-focus.mjs` → isolated native Chrome with Metal attempted the real focus test too. `bringToFront`/new tabs generated neither `document.hidden` nor blur, so real native focus is recorded as unsupported in this automation environment. This is not claimed as a passed real-focus test. Synthetic handlers, explicit pause/resume and audio-owner checks remain distinct evidence.
- `node docs/qa/source-sequence.mjs` → seven real captures at 0.10 / 10.71 / 20.12 / 30.64 / 40.13 / 50.11 / 60.04 seconds. Separate manual → wrong order/vent/strike → recovery → physical cable → stable modules → engine start/win. All captures and states are in `docs/qa/source-sequence`; all seven were inspected. No console/page errors.
- Required skill client repeated on final source with a real left-click burst selecting the valve module: `--actions-json '{"steps":[{"buttons":["left_mouse_button"],"frames":1,"mouse_x":465,"mouse_y":510},{"buttons":[],"frames":2}]}' --screenshot-dir docs/qa/skill-client-final`. Completed; final screenshot inspected. State confirms selected valves, camera rotation 0, running audio with 16 decoded buffers / five loops / RMS 0.013771. No client error file.

| Browser path | Actual result |
|---|---|
| G7 guided / independent / transfer | Won; 8 / 8 / 9 action events. Guided marked assisted; independent and transfer unassisted, zero strikes/retries. |
| G8 guided / independent / transfer | Won; 8 / 9 / 9 events including reviewed relay. Independent and transfer unassisted, zero strikes/retries. |
| G9 guided / independent / transfer | Won; 12 / 9 / 10 events including REPLACED receiver tag, calibration, prediction and relay. Independent and transfer unassisted, zero strikes/retries. |
| Wrong G7 valve order | Small-first in the large-first mission produced a strike, fault and phrase-linked Hebrew feedback. External recovery retained the strike, restored world state and accepted the corrected order. |
| Hint and restart | Hint set assistance; external recovery/restart increased retry count. |
| Audio/settings/pause | Music range changed to zero through Home and persisted across reload. Pause suspended the AudioContext; Escape resumed. Restart retained exactly five transport loops. |
| Keyboard | Actual Tab/Enter completed the two valve actions. M opened the manual; first Escape closed it and retained module inspection; second Escape returned to overview. Digit2 selected cable. |
| Touch and resize | At 390×844, touch selected and completed the G8 transfer relay module. Manual stayed within viewport. 844×390 landscape capture inspected after layout fix. |
| Static partner reader | Nine fixed serial procedures, no live canvas and no answer-choice controls; S24 appendix added separately. |

Actual captures include `g7-transfer-manual.png`, `g8-transfer-manual.png`, `g9-transfer-manual.png`, three transfer win images, `wrong-order.png`, `keyboard-cable.png`, `mobile-manual.png`, `mobile-landscape.png` and `partner-manual.png`. All named captures were opened and visually inspected, not merely created.

## Independent defects resolved during build

- Initial software-browser runs stalled and timed out. Render-on-demand, smaller shadow maps, capped pixel ratio and correct initial camera resolved the interaction/capture stalls; later full runs completed. A native Chrome diagnostic also displayed the real scene. No unrelated browser process was terminated.
- G9 startup outcome was coupled to a mission ID. It now uses generic pressure/fan metadata, and the S24 paired rule reverses the necessary fan action.
- G9 maintenance success could originally be inferred entirely from the current-state check. A required REPLACED receiver tag now makes reading the past-passive record consequential; current working status remains a separate decision.
- G9 zero-conditional instructions originally supplied the exact open/close sequence. Goal-only calibration values now require interpreting the fixed relationship.
- Tiny square/round glyphs were replaced with drawn shape textures. Valve wheels gained an asymmetric tick, clips visibly close, and wrong actions produce a harmless vent.
- The landscape inspector covered the header. A bounded scrollable short-height layout now keeps it below the header.
- Choice evaluation after shutdown and false strike audio from no-op interactions were guarded. Hidden tag hit targets are filtered.
- Feedback originally covered the physical source connector and intercepted drag gestures. It now passes pointer events and sits clear of the port; a complete physical cable/clip/test sequence and mid-drag front-plane preview were verified afterward.
- Re-entering a failed/hinted mission could reset evidence to first attempt. Per-mission and per-variant attempt history now persists; restart and external recovery also preserve it.
- Deterministic time stepping originally drew hundreds of synchronous software-WebGL frames. The hook now advances state/animation with one final GPU draw; timing checks subsequently passed. Blur/visibility guards prevent hidden-time catchup.
- Reviewed first-conditional relays now retain the complete condition/result as well as the plan and prohibition. Answer display order uses a stable per-session/per-question shuffle while retaining authoritative original choice IDs.

## Known limitations

- Browser automation verifies behavior, not whether a student learned, enjoyed the game or retained a rule.
- Audio was checked through live engine state and controls; this tester has not personally auditioned the tune. See AUDIO.md for the audio owner's render and playback evidence.
- Static partner mode supports real human communication, but no conversation is recorded or assessed.
- Real native window/tab focus events could not be generated by this environment in either headless Chromium or isolated headed native Chrome. Synthetic focus/blur handlers and explicit pause were verified, but this remains a manual-release check.
- Small landscape viewports remain compact and crop the workshop; the scrollable accessible controls and manual are usable. Portrait touch and keyboard alternatives were tested separately from physical mouse raycasts.

The operating-system Hebrew keyboard layout was not changed by this tester. Hebrew UI, LTR English, Tab/Enter and physical-code shortcuts were verified; a manual OS-layout check remains distinct.

## Revision audit — manual-first flow and visual fidelity

The user rejected the prior visual result and found the manual hidden or confusing. The earlier passing tests remain behavioral evidence; they do not constitute acceptance of the rejected visual/interaction design. This revision must make the paper visible immediately, make read → operate navigation clear, and improve the actual scene toward the exact imagegen target.

`docs/qa/revision/qa-review.md` records the completed independent review. All25 semantic tests pass. `node docs/qa/revision-usability.mjs` completed all nine missions at900×760 through visible contextual read→operate controls, with messages after the physical modules; all independent/transfer paths were first-attempt, unassisted and strike-free. Wrong-order/recovery,390px touch, desktop and landscape captures passed.

`node docs/qa/revision/focused-controls.mjs` passed seven focused checks: keyboard drawer/M/Escape, paused/settings shortcut guards, actual wheel/relay raycasts, free cable drag/cancel/clips, context scroll reset, assistance accounting and settled responsive layouts. A further `node docs/qa/revision/cable-feedback.mjs` verified the final visible free plug, actual connection and physical clips-first transfer path; it also confirmed the separate partner manual has nine fixed procedures and no live canvas/operation controls. The three passing browser reports contain no console/page errors. All named final captures were opened and inspected.

Visual review directly compared the fixed mockup with current1440/900/mobile images. The scene now has substantial worn ivory casing, readable gauges and labels, deep petrol recesses, cast brass wheels, warm workshop depth and visible useful paper. First-pass CTA clipping/washout, short-landscape instruction hiding, source outside the viewport and stale feedback over the cable were found through actual captures and corrected. Rejected internal evidence is retained under `docs/qa/revision/first-pass/`; final cable captures use `900-cable-final-*` and `900-clips-first-final-*`.

Passing revision runs used native Chrome/Metal after an initial software-WebGL load timeout. This tester has not personally auditioned audio or changed the OS keyboard layout; the earlier native focus-event automation limit remains explicit. These checks establish finite game behavior and a reviewed visual/interaction improvement, without inferring user approval or learning gains.

### Lead's final in-app and stock-client check

The compiled preview was refreshed in the human's existing in-app browser at723px. Lead inspected the real image and accessibility state, activated the visible read→operate action and confirmed the full-width valve inspection and explicit return-manual control. The initial reading view was restored for handoff. The intermediate responsive layout uses an open right-side book over the device during reading and full-width device operation.

The required stock develop-web-game client produced `docs/qa/revision/skill-client/shot-0.png` and state, both inspected. Its software SwiftShader browser timed out during the Start locator click; that output remains diagnostic rather than being counted as a successful gameplay action. Native Chrome/Metal full-game and physical checks are the operational evidence for this revision.
