> Current scope: one sequential 30-level campaign, with no grade selector or grade limits. The nine-mission reports below are historical. Current campaign verification is recorded in the campaign audit at the end of this file.

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

## Current campaign audit — 28 October 2026

The user's latest requirement supersedes the grade-selected release: this is one sequential campaign of 30 levels, with no grade selector or grade limits. The original nine-track results above remain historical regression evidence. Grade 7–9 metadata is internal curriculum provenance. `GRADES.md`, `COVERAGE.md` and root `coverage.json` now describe the campaign and explicitly distinguish sources consulted from direct assessed decisions.

`npm test` passed **76/76** checks (`docs/qa/campaign/semantic-tests.txt`): 47 independent campaign checks, four progress checks and 25 legacy semantics. All 30 campaign solutions were hand-read from the English procedures and stored in `docs/qa/campaign/solutions.json`; they were not generated from evaluator steps or `nextActions`. Contrast tests cover order reversal, square/round reference, clips before/after connection, already-closed/connected state, passive agent/receiver, replacement versus current working status, repeated pressure rules and opposite startup fan plans at stop thresholds 5 and 6. Inactive modules cannot create repair events, strikes or retry evidence.

`node docs/qa/campaign/visible-campaign.mjs` passed **all 30 sequential browser wins and 34 recorded checks** in native Chrome/Metal at 900×760. It used a fresh context, actual manual/read/operate/action buttons, reviewed choices, engine start and Next; it neither injected solved state nor wrote unlocks. The first runner version stopped at level 1 because its assertion wrongly expected a guided level to be unassisted. That harness assertion was corrected, then the full campaign was rerun fresh. The final report has no console or page errors.

| Actual campaign browser path | Result |
|---|---|
|Fresh entry and map|No grade/mission dropdown; level 1 and one active valve bay; 30 map buttons with the other 29 locked. Tab remains in the map and Escape restores focus to its opener.|
|Levels 1–6|One active family in 1–3, then pairs in 4–6; only active modules count toward readiness and completion.|
|Levels 7–20|All three physical procedures complete, including reversed order, explicit initial state, passive receivers and reviewed messages.|
|Levels 21–23|Receiver tags and separate current working-status procedures complete; the same past replacement record supports different current actions.|
|Levels 24–26|Actual valve TEST readings are 3/1/3, 2/4/2 and 2/4/3/1, respectively.|
|Levels 27–30|Initial-scenario prediction answered before prevention actions; startup rule/plan and full reviewed relay complete. Level 30 also measures 3/1/3 and handles the current-failure record.|
|Readiness and unlock|No next-level unlock before engine start. Each legitimate start unlocks only the next numbered level. Level 30 shows final campaign completion.|
|Assistance and attempts|Guided levels 1,2,3,11,21,24,27 are assisted by design. Other initial passes are unassisted; all 30 initial wins have zero strikes/retries.|
|Replay/resume|After all 30 wins, all map entries are enabled; reload resumes level 30. Replaying level 5 preserves the furthest unlock. Wrong valve order produces a strike; recovery retains retry evidence and accepts the corrected sequence.|
|Partner reader|30 fixed `.manual-mission` articles, direct level-30 jump, no live canvas or operation controls.|
|390px touch|Earned map opens within the mobile layout; visible touch controls complete and start a level-1 replay. No document-width overflow.|

The earned final storage state is `docs/qa/campaign/earned-storage-state.json`, saved immediately after the genuine level-30 win, before the later recovery/replay scenarios. The audio helper is authorized to reuse this earned state for late-level replay checks; it is not a fabricated production seed.

Actual images inspected include `900-opening.png`, `level-15-won.png`, `level-21-switches-done.png`, `level-24-switches-read.png`, `level-26-won.png`, `level-30-switches-read.png`, `level-30-switches-done.png`, `level-30-won.png`, the square/round connected cable captures, `900-completed-map.png`, `390-level30-read.png`, `390-map.png` and `partner-level-30.png`. They show the real machine, open contextual paper, readable English, pinned action, sequential map and final completion state. Long capstone procedures and maps scroll; screenshots do not imply that all their content fits in one viewport. Visual inspection is separate evidence from build/tests, and does not infer user approval or classroom learning gains.

Independent source review found one procedural ambiguity in level 18: its evaluator required A before B but the cable manual did not state that order clearly. The content author added an explicit “Close clip A before clip B.” The independent title review also found Hebrew titles that translated key decisions (notably fan-off and large-valve pressure direction); these were replaced with neutral titles after the full run. Procedures and action sequences were unchanged by the title patch. Prediction headings now explicitly identify the stated initial setup, so “now” in a question is not confused with a fan state changed later by the player.

`node docs/qa/campaign/focused-campaign.mjs` passed four further checks on the final interface: actual 3D right-tag selection in level 30; initial square/round cable connection in levels 17/20; inactive Digit2 leaving reading intact with only active controls exposed; and the INITIAL SETUP prediction label plus context scroll reset. It reused the earned campaign state and made no first-attempt claim. Final 1440/900 reading and operating images, tag before/after images and both initial cable captures were opened and inspected. The first focused navigation used a 15-second full-load wait and timed out; the runner was corrected to wait for DOMContentLoaded with a 60-second navigation allowance, then passed. No game code change was required.

The final physical capture exposed REPLACED letters hidden behind the vertical case trim. The lead moved the tag plane ahead of the trim. `node docs/qa/campaign/tag-final.mjs` then repeated the actual level-30 right-tag raycast and saved `level-30-tag-final-before/after.png` with matching states. Both images were opened: TAG R is readable before and the complete REPLACED word is readable after, with zero strikes. The focused report now contains five passing checks including this final visual fix, with no console/page errors. This targeted replay does not claim a new full-campaign run or unaided attempt.

The audio helper independently passed 14 campaign regressions in native Chrome/Metal, using fresh early progress and the earned state for later replays. Evidence and the absence of a human-audition claim are recorded in `docs/qa/campaign/audio/integration.md` and `results.json`.

Current limits remain the previously documented inability to generate native OS focus events in this automation environment, lack of this tester's personal musical audition and unchanged OS keyboard layout. Automated finite procedures and reviewed-choice success do not establish retained language learning, spontaneous mediation or live listening/speaking.


Lead final compiled-preview checks (28 October2026): `GAME_URL=http://localhost:4262/ node docs/qa/campaign/smoke.mjs` passed11 checks with no page errors: fresh30-level lock map, engine-start unlock gate, active-only win, Next/manual context, reload resume, replay,390px bounds, keyboard focus loop, inactive shortcut protection and static partner jump. Output is under `docs/qa/campaign/production` and is separate from independent full-campaign captures. Final map CSS explicitly overrides generic modal button margins; actual in-app capture shows all30 entries in the current viewport. The existing game tab was refreshed and left at level1 with the manual visible.

Final label polish moves maintenance cards above the valve TEST button and in front of the frame trim. `node docs/qa/campaign/production/tags.mjs` replayed21(left) and30(right) through actual raycasts in the compiled preview; both correct tags were accepted with zero strikes. Both before/after image pairs were opened and inspected: TAG L/TAG R and full REPLACED text are readable. The probe copies the independently earned full-campaign local save from dev origin5262 to preview origin4262 without changing progress/results; it does not fabricate unlocks or wins. Pure rules remain the76-test verified version. Final production build passes, with the existing Three.js bundle-size advisory.
