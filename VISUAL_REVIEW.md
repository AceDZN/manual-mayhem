# Mockup versus actual game

Built-in imagegen target was generated with the exact supplied prompt and inspected before gameplay code. `docs/visual-targets/gameplay-mockup.png` is concept/design evidence only. Actual browser captures live separately in `docs/qa/` and `docs/playtest/`.

The actual scene uses one Three.js canvas, a fully deep ivory/petrol/orange device, brass wheels with distinct diameters, raised switches, front-facing module zoom, socket/cable geometry, clip motion, gauge movement, module indicator lighting, tangible owned pump and service arm, a wooden service bench and workshop lighting/shadows. DOM paper manual is independently scrollable, LTR English with Hebrew support. Device labels and collider geometry are deterministic.

The first successful actual capture, `docs/qa/initial-gameplay.png`, was inspected by lead and independent art helper beside the generated target. Findings led to a closer/lower overview camera, grounded pump moved forward, stronger label sizing, darkened background rails, explicit drawn square/round screen glyphs, asymmetric wheel marker, clip closure motion and harmless vent puff. These refinements are checked in later captures, not retroactively claimed in the first capture.

Intentional achievable differences: stylized clean enamel and simple workshop architecture rather than the mockup's photographic wear, dense surface scratches and depth of field. One live pressure gauge serves the conditional task, with separate square and round signal screens; no decorative false readings. Featured props are rigid mesh assemblies; there is no character or deformation animation to rig. The functional engine casing/controls are original procedural meshes, so exact labels and actions agree with authored truth.

Performance: 1024px static shadow map refreshed on meaningful state changes; 1.5 DPR cap; 25fps motion cap and render-on-demand after settling. Initial headless tests stalled under renderer load; these changes allowed actual UI/capture completion. This is a rendering optimization, not a simulated screenshot fallback. Real screenshots and serialized current state are retained together.

Desktop, portrait and landscape captures are reviewed separately in PLAYTEST.md. No classroom usability, retained learning or musical-quality assertion is inferred from browser automation.

Later actual physical captures confirm these refinements: `docs/qa/rotation-before.png` / `rotation-after.png`, `physical-valve-before.png` / `physical-valve-after.png`, `cable-mid-drag.png`, `physical-cable-connected.png`, `maintenance-tag.png`, and `paired-b-prevented.png`. Lead and independent art/QA reviewers inspected them. A status-toast hit interception found during the real cable test was corrected with pointer-transparent status and a side position. Physical cable drag/drop, clip closure and the resulting stable module were retested successfully.
