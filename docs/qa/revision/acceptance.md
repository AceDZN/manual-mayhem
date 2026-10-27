# Revision usability and visual acceptance

The user rejected the first delivery because its visual relationship to the supplied mockup was too weak and the manual was hidden or confusing. Prior passing behavior tests do not establish that this revision solves those problems.

## First encounter

- The paper manual is visible in the initial viewport, before any keyboard knowledge or hidden-menu discovery.
- One main Hebrew action explains the sequence: read the manual first, then manipulate the same physical module.
- The current module name and serial match between paper, 3D device and operation panel.
- Read/operate navigation is obvious, numbered, consistently positioned and reversible. Changing module preserves this model.
- English instructions remain LTR and readable; Hebrew purpose/help is adjacent. Help does not silently become evidence of unaided interpretation.
- No next-action highlight, narrowed answer list or result-based hint exposes independent/transfer solutions.

## Visual comparison to exact target

The imagegen target is a mockup, not gameplay evidence. Compare actual running captures directly with `docs/visual-targets/gameplay-mockup.png`.

- Thick off-white portable casing with material depth, orange handle, recessed petrol panels and prominent brass valve wheels.
- Readable gauge/screen shapes, tactile switches/sockets, warm workshop lighting and coherent scale.
- Machine dominates the useful scene area; avoid empty headroom and rail scenery competing with the device.
- Compact right-hand paper remains useful and legible instead of hiding actionable controls.
- Actual physical interaction is visible: valve state, cable source/target, clips and fault/recovery.

## Required test sizes and paths

- Desktop 1440×900: initial, read/operate, physical cable, fault/recovery.
- Narrow in-app-style panel 900×760: first encounter, selected module/manual matching, controls remain reachable.
- Mobile portrait 390×844 and landscape 844×390: readable manual, explicit operate/return flow, no clipped or unreachable controls.
- All nine authored missions: visible-control wins after the new manual flow; grade semantics unchanged.
- Optional reader and assistance/retry evidence remain truthful.

## Status

Completed against actual revised gameplay captures. Nine900px mission wins, physical/keyboard/context checks, mobile/landscape flow and final cable visibility passed. See `qa-review.md`, `results.json`, `focused-results.json` and `cable-feedback-results.json`. Initial defects and their rejected captures are retained in `first-pass/`; no user approval is inferred.
