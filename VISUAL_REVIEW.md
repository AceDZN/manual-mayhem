# Visual revision against the original target

The human rejected the initial flat renderer and hidden manual on27 October2026. The old visual review is superseded by this revision. The original built-in imagegen mockup remains the fixed comparison at `docs/visual-targets/gameplay-mockup.png`; it is never a gameplay screenshot.

## Changes made in response

The device was rebuilt with a thick rounded instrument case, left gauge cluster, deep petrol recesses, central cast brass wheels with asymmetric markers, stepped knurled hubs, pipe unions and fasteners, a right patch bay and a lower relay strip. Actual Three.js controls remain raycastable and animate independently. PBR albedo/roughness/height/metalness maps, a corrected warm reflected environment, directional light/shadows and a defocused workshop backdrop replace the uniformly lit green room. The wooden bench, spanners, cable and two previously owned Tripo props remain separate real meshes.

The manual is now present on first load. It names the corresponding module and serial, shows the full English procedure before the diagram, explains reading then operating, and pins the main action inside the page. Desktop retains the book beside the device while operating; mobile has clear reading/operating phases. Module changes open the corresponding manual context. This directly addresses the discovery failure rather than relying on a keyboard shortcut.

## Actual comparisons and rejected iterations

`docs/qa/revision/first-pass/` preserves the first revised captures. Review found washed-out paint/dials and a clipped Start action. Those captures were not accepted. The environment incorrectly made non-emissive walls luminous; CanvasTexture ink also lacked sRGB color-space tagging. These were corrected, lighting reduced, petrol paint deepened and background dimmed/defocused. Explicit grid/flex height containment fixed the paper overflow.

The second real captures at1440×900 and900×760, `docs/qa/revision/1440-initial.png` and `900-initial.png`, were opened and inspected against the original target by lead, art and independent QA. The full Start bounding box is inside the viewport and document scroll is zero. English instructions are visible before the diagram. Worn ivory, dark recesses, prominent brass mechanisms, large readable gauges and the warm workshop are substantially closer to the target. Focused module captures verify readable geometry and a persistent useful manual. The final overview angle and lower labels are checked again in the final revision captures.

## Honest differences

The target is a photographic generated mockup; the real engine still has more regular authored geometry and simpler glass/micro-wear. The manual is a readable persistent application paper rather than a photographed bent book. At narrow desktop widths the overview is smaller to keep both machine and manual fully available; front inspection enlarges the actionable module. These differences remain visible and are not described as an identical match.

Final revised behavior and first-encounter checks are recorded in PLAYTEST.md and `docs/qa/revision/`. Background/material provenance and exact generation prompt are in `docs/art/revision-review.md`.

## Final checks

Final native captures `1440-final-initial.png`, `900-final-initial.png`, `390-final-initial.png`, `844-final-read.png` and the physical cable captures were inspected after the final camera/label updates. All nine revised mission flows passed at900px, including operator messages after physical repair. Keyboard/physical/touch/layout/audio results are in the revision report. A later direct check in the human's actual723px in-app panel verified the compiled preview: the open contextual book is clear initially, the main action is visible, and operating unfolds the full-width device with a clearly labelled return to the manual. Wide screens retain the side-by-side book; narrow panels use reading/operation phases to keep the machine large.

The stock develop-web-game client was executed and its actual rendered screenshot inspected. Its SwiftShader driver timed out while waiting to click Start, so that run is not claimed as a completed-play pass. The native Chrome/Metal regression and direct in-app browser checks exercised the real controls successfully.


28 October2026 campaign revision: the worn ivory/brass engine and workshop art remain the visual foundation. Grade selectors are replaced with a numbered30-level campaign map; manual-first reading stays visible. Final actual in-app captures are `docs/qa/campaign/production/app-game.png` and `app-level-map.png`. The map spacing is verified in the real panel, and maintenance cards are mounted clear of trim/TEST controls; both final physical tag captures were inspected. These are actual browser captures, separate from the original imagegen target.
