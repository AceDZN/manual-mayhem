# Revision requested by the human

The human rejected the initial build's visual distance from the fixed imagegen mockup and the difficulty of finding/understanding the manual. This revision rebuilds the rendered engine and the manual-first user flow. The mockup was not replaced with an easier target.

## What changed

- Thick worn ivory casing, paired large working gauges, deep petrol recesses, cast brass wheels with collars/knurling and pipe unions, a separate patch bay, physical relay strip and a visible cable.
- Local PBR textures and warm reflected workshop lighting. The generated workshop-only background contains no game machine or manual; the engine, controls, workbench and tools remain actual meshes.
- A paper manual visible on first load. Full contextual English procedure appears before the diagram. Read1 and operate2 stay explicit, with a pinned main action and current serial/module.
- Desktop paper remains available alongside operation. Mobile switches clearly between reading and operating, retaining context. Module changes reset manual scroll to the new instruction; messages have their own clear section.
- Accessible operation buttons are available through a compact drawer, so they no longer dominate the tangible machine view.

## Iterations retained

`first-pass/` contains a rejected internal revision: overexposed/washed materials and clipped main action. Corrected color space, reflected environment, lighting and grid/flex containment resolved those defects. Further physical checks found the new cable inspection view hid its source below navigation; framing was widened/lowered rather than accepting a successful button-only cable test.

Current actual screenshots, bounds/state JSON and executed regression scripts are in this folder. Results are recorded separately for semantic/UI, physical/keyboard/layout and audio. No generated mockup is presented as a gameplay capture.
