# Independent revision QA

The revised manual is visible on first load, its main action fits the viewport, and the current English procedure appears above the diagram. The numbered reading/operation phases and matching serials make the intended sequence clear. Desktop keeps the paper alongside the device; mobile provides a reversible reading/operation view.

This judgment uses actual running captures, not build status or the imagegen target as proof of implementation.

## Executed evidence

| Check | Actual result | Evidence |
|---|---|---|
| Semantic regression | 25/25 tests pass; authored grade7/8/9 rules retained | `tests/semantics.test.ts` |
| Nine missions at900×760 | All nine won through visible read/context/operate controls; independent and transfer paths had zero strikes/retries and no hints | `results.json` |
| Natural message order | G8/G9 message/prediction answered after physical modules; ready and won states remained correct | `results.json` |
| Wrong interpretation | Wrong valve order caused fault/strike and precise feedback; external recovery accepted corrected order | `900-wrong-order.png`, `results.json` |
| Keyboard | Actual Tab/Enter drawer actions, M reading, layered Escape; M/Digit ignored under pause/settings | `focused-results.json` |
| Physical interaction | Wheel rim drag/click preserved camera separation; free cable cancellation/drop, clips and TEST worked; physical relays completed startup | `focused-results.json` |
| Manual context | Same serial and complete English text; scroll reset on section change; reading alone did not mark assistance; explicit translation did | `focused-results.json`, `900-context-reset.png` |
| Responsive flow | Settled1440/900/390 captures,390touch module success,844×390 instruction-first landscape; no document auto-scroll to reach Start | `results.json`, `focused-results.json` |
| Final cable visibility | Free plug at(487,618), socket at(222,318), clear of feedback/navigation at900×760; actual drag accepted | `cable-feedback-results.json` |
| Changed order | Physical G7transfer closed clips first, then connected round and tested, zero strikes; positive feedback did not hide source | `900-clips-first-final-*.png/json` |
| Partner manual | Nine fixed procedure sections, no live canvas or operation controls | `partner-final.png`, `cable-feedback-results.json` |

The three passing browser result sets contain no console/page errors. The first software-WebGL capture attempt timed out during load; passing revision runs used isolated native Chrome with Metal. No unrelated process was stopped.

## Direct target comparison

Compared the exact [imagegen mockup](../../visual-targets/gameplay-mockup.png) with [1440 initial gameplay](1440-final-initial.png), [900 initial gameplay](900-final-initial.png), [physical cable interaction](900-cable-final-drag.png), [mobile reading](390-final-initial.png) and [landscape reading](844-final-read.png). These actual captures were opened and inspected.

The current scene has a thick worn ivory portable casing, a substantial orange handle, deep petrol recesses, cast brass wheels, readable paired gauges, distinct screen shapes and sockets, and warm workshop depth. The23°overview reveals the case; inspection faces the controls directly so left/right stay stable. The paper has a useful current procedure and an immediately visible action.

Intentional differences remain: the paper contains the authored curriculum procedure and contextual navigation; module inspection uses a front view; narrow layouts fit the available stage, and phone operation uses a separate reading phase. The background is an original defocused environment image; the machine, gauges, controls, table and cable are actual 3D meshes.

## Defects found and corrected

- Initial paper/action overflow clipped Start. Browser auto-scroll made a successful automated click misleading and removed the topbar at900px. Grid/flex containment now pins the action; bounds and scrollTop0 were verified.
- Initial materials/dials were washed out. Correct color spaces, reflected-light environment, exposure and deeper petrol restored material/ink contrast.
- Operator return text was dark on a dark button; primary treatment restores legibility.
- Short landscape chrome hid the English instruction. Compact chrome now puts the instruction in the visible scroll area.
- Initial cable inspection projected the free plug outside the viewport and hid the fixed source beneath navigation. Wider/lower framing now exposes both.
- Stale success feedback visually covered the free plug despite permitting pointer input. Context changes now clear stale status and feedback sits away from the cable; connection-first and clips-first gestures were recaptured afterward.

The rejected internal captures are retained under `first-pass/`. Final cable evidence uses the `900-cable-final-*` and `900-clips-first-final-*` names.

## Limits

These finite tests do not establish learning gains, retained mastery or live speaking/listening ability. This tester did not personally audition the score or change the operating-system keyboard layout. See AUDIO.md for the audio owner's revised17-check report. The prior native focus-event automation limitation remains distinct from synthetic handler and explicit pause tests. No user visual approval is inferred from this independent review.
