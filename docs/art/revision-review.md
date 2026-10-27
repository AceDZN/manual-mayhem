# Material and workshop revision

27 October 2026. The human rejected the previous visual quality as below the saved target. The prior review's “no material blocker” described basic visibility, not closeness to the reference. The old result was visibly far simpler: thin symmetric valve wheels, small gauges, uniform paint, unreflected metal, sparse room rails, and a distant composition. This revision addresses those concrete differences. It does not claim photorealistic equivalence.

## Ownership and integration contract

Art helper owns only `src/surfaces.ts`, `public/textures/*`, and this review. Lead owns scene geometry, lights, camera, UI/manual and integration; no lead files or Git state were edited by this helper. No Tripo generation, model credit spend, new paid service or account was needed.

`createWorkshopSurfaces(renderer?, onLoad?)` returns `ivory`, `petrol`, `dark` (petrol alias), `brass`, `steel`, `rubber`, `wood`, `orange`, `paper`, `glass`, `ready`, `variant`, and `dispose`. `variant(kind, [repeatX, repeatY])` clones map transforms so table tiling cannot alter the same material on controls. Paint maps cover a full UV face and contain edge wear: do not densely tile them. Mark the scene dirty after `ready` resolves, because texture requests complete asynchronously.

`createWorkshopEnvironment(renderer)` returns `{texture, dispose}`. This is a warmed Three.js RoomEnvironment baked by PMREM, supplying meaningful reflection gradients for the metals. It does not replace real scene lights or geometry. Suggested starting point: `scene.environmentIntensity` 0.6–0.9; reduce the old strong hemisphere fill before tuning warm key and cooler fill. A white/flat environment or very bright global fill will hide material depth even with good maps.

## Local procedural PBR maps

All eight surfaces are authored locally and original for this game. The maps are deterministic Pillow field/stroke constructions, generated with seed 58306, then loaded through the factory. There is no texture download, runtime AI, paid texture license or remote request. The material-sheet image is a texture inspection sheet, not a rendered scene or gameplay screenshot.

- Ivory/petrol/orange: correlated broad weathering fields plus smaller paint tooth; grime and chipped enamel cluster at handled edges. The same chip mask changes base color, roughness, height and exposed-metal response. Fine scuffs run along short swept paths. These are not uniform polka-dot distress overlays.
- Brass/steel: irregular broad tarnish regions, muted albedo variation, and long nearly parallel machining fibres. Roughness varies with tarnish; subtle bump varies with the directional brushing.
- Rubber: restrained fine mould/abrasion lines and broad tone variation, with high roughness and no metal response.
- Wood: long flowing growth contours, local knot deflection, pores, and sparse long bench scuffs. Grain and roughness correlate. Surface direction should follow the length of the modeled board.
- Paper: broad age variation, fibres, restrained edge staining, very fine bump, high roughness.

All color textures use sRGB; roughness/height/metalness use linear NoColorSpace. Bump strengths are deliberately small. Glass uses clearcoat and low opacity without an expensive transmission pass, preserving dial legibility. Full filenames are `{kind}-{color,roughness,height,metalness}.png`; exact binary sizes/hashes are in `public/textures/manifest.json`. After the dark-petrol correction, the 32 map PNGs total 1,920,188 bytes. All texture assets including the backdrop and inspection sheet total 3,880,095 bytes. The sheet was opened and inspected: edge wear forms irregular clusters, wood has long grain, and brass/steel have broad patina variation plus fine directional fibres. This is map inspection, not a claim about final shaded appearance.

## Original runtime background

Built-in `image_gen` was used, with no CLI fallback. Generated output was inspected and copied to `public/textures/workshop-backdrop.png` (1672 × 941). It is an original **runtime background environment**, separate from the earlier mockup. It contains shelves, pegboard tools and an amber lamp, with dark quiet central space and a rear floor. It contains no foreground engine, manual, UI, labels, characters or foreground desktop. Actual engine, bench, gauges, valves and cable remain real separately rendered Three.js meshes.

Original generated file: `/Users/acedzn/.codex/generated_images/01a17dff-7bb9-7be1-866a-928f5aba0ede/exec-39f0809d-a648-4fe5-92d8-1f3c0f455bde.png`.

Exact prompt:

> Use case: stylized-concept. Asset type: 16:9 landscape runtime background for a Three.js browser repair game. Create a warm richly detailed vintage repair workshop, softly defocused BACKGROUND ONLY: pegboard tools, shelves of spare parts and small containers, amber desk lamp on the far right, muted petrol shadows, warm wood and aged brass, practical tungsten lighting. Desk-height camera, gentle shallow depth of field. Mood: tactile off-white enamel and brass workshop, warm grounded photographic illumination, original retrofuture festival airship repair setting. Keep center and lower-center softly dark and visually quiet behind an actual separately rendered 3D machine. NO engine/device, NO foreground desk or workbench surface, NO manual or books in foreground, NO text, NO labels, NO UI, NO characters, NO logos, NO watermarks. This is a contextual background environment only, not a game screenshot. Landscape 16:9.

## Target comparison priorities for lead

The target's material quality comes from broad reflection shapes, warm/cool light separation and occlusion around actual cast parts. Texture flecks alone are insufficient. Keep a close camera with the machine occupying roughly three quarters of the composition; use substantial valve rims, cast spokes, deep hubs, knurled collars, metal bezel lips and glass-covered readable gauges. The backdrop should be dimmer and softer than the device. Keep the paper manual genuinely legible and compact, with no fake machine pixels baked into the background.

## First integrated revision inspection and correction

Art helper inspected actual `docs/qa/revision/1440-initial.png`, `900-initial.png`, and `1440-start-valves.png`. The new casing, prominent two-gauge column, cast wheel structures, screen/socket bay, warm workshop and visible paper manual are substantially closer to the target composition. They were not accepted as final: enamel/gauges were overexposed, ink too pale, petrol looked light sage/camouflage, and the background competed with the machine. At 900 pixels wide the device was small and low, while manual/Start overflow impaired controls.

One real implementation bug was found in the helper: the initial PMREM warmth filter assigned a nonzero emissive color to every material that exposed an emissive property, including non-emissive walls. It has been corrected to warm **only existing nonzero emissive area panels**. Non-emissive room walls remain non-emissive. This mistake contributed broad self-emission and flattened contrast.

The petrol color map was also corrected around a deep `#0d2826` base; color variation is compressed and its exposed-metal mask reduced to 55% of the initial value. This retains edge wear without broad light patches. Manifest hashes and the material sheet were updated. Lead independently owns exposure/light reduction and crisp dial/label ink.

Further target-oriented recommendations sent to lead: thicker brass concentric hubs/collars, short cast valve bodies/T-joints behind wheels, slightly thicker rims, dimmer/softer background, and tighter 900-pixel framing. These are recommendations until verified in actual images. Corrected material integration and final revised gameplay capture inspection remain pending. This document does not claim shader appearance or final interaction success from texture assets alone.
