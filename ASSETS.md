# Manual Mayhem assets and provenance

Two featured locally bundled meshes are reused from the human's existing owned Tripo outputs. Gallery and My Assets were searched live before choosing them; see ASSET_SEARCH.md. Public third-party gallery assets were not acquired. No new model or rig generation, payment, subscription, or agreement was submitted.

## Model ownership and acquisition

The current signed-in My Assets detail views identify Alex Sindalovsky as owner and show Pro status. Prior normal UI export evidence and exact acquisition paths are preserved in the read-only Sentence Foundry ASSETS.md. Current proof views are `docs/art/owned-pump.png` and `docs/art/owned-service-arm.png`.

The official [Tripo commercial-use guide](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) and [Terms section 5.2.2](https://www.tripo3d.ai/terms) were checked on 27 October 2026. They describe paid users' rights to use, modify, distribute, and commercially use their own outputs. This is the basis for bundling these owned outputs, not a claim that all gallery downloads share that license. Tripo does not grant rights to third-party input images. These generic mechanical objects contain no identified commercial game characters/logos.

| Runtime file | Original source and prompt | Acquisition history |
|---|---|---|
| `public/models/pump.glb` | [Task 53dc9822-02d0-4b27-9acf-6c4316955da8](https://studio.tripo3d.ai/3d-model/brass-steampunk-pump-with-pressure-gauge-and-transparent-tube-mounted-53dc9822-02d0-4b27-9acf-6c4316955da8). Exact prompt: `brass steampunk pump with pressure gauge and transparent tube mounted on stone base` | Prior GLB/1k visible UI export to `sentence-foundry-decor-pump.glb`; copied without changes from Sentence Foundry's runtime model. Current Tripo view: 19,032 faces / 12,755 vertices, 2K PBR H3.1 source. |
| `public/models/service-arm.glb` | [Task 3bda26ef-1f5a-4be0-af19-c531aef27d90](https://studio.tripo3d.ai/3d-model/sentence-foundry-original-game-machinery-one-compact-modular-industri-3bda26ef-1f5a-4be0-af19-c531aef27d90). Original prompt below. | Prior GLB/1k visible UI export to `sentence-foundry-service-arm.glb`; copied without changes from Sentence Foundry. Current Tripo view: 18,108 faces / 11,668 vertices, 2K PBR H3.1 source. |

Service-arm original prompt:

> Sentence Foundry original game machinery: one compact modular industrial service arm, cobalt blue enamel cast-metal pedestal, chunky articulated steel elbow, silver two-finger clamp pointing forward, small amber work lamp, cream faceplate with two screw heads, tactile brushed steel and light edge wear. Friendly whimsical miniature workshop prop, readable large mechanical shapes, square low base. No humanoid body, no legs, no text, no floor or scene, isolated single complete object. Low-poly game-ready PBR.

## Binary integrity and runtime cost

Original export bytes, copied bytes, and runtime bytes are identical. No extra lossy optimization was needed; both are below the 3 MB featured-model target. Each has one mesh/primitive, three embedded JPEG textures, and no required decoder extensions, skins, or animation clips. No runtime asset network request to Tripo is needed. Exact parsed metrics: `docs/art/asset-metrics.json`.

| Mesh | Bytes | Triangles / exported vertices | Bounds x × y × z | SHA256 original = runtime |
|---|---:|---:|---|---|
| pump | 1,292,920 | 19,032 / 13,051 | 1.000 × 0.491 × 0.413 | `45da97237e0986fe13d6c827fa23a59086b1cb07e05b4bd188a2ab34a19776a3` |
| service arm | 1,062,788 | 18,108 / 11,964 | 1.000 × 0.892 × 0.513 | `ee0c1eb2888452a29aa05f65bee2546389ad71fedcd5464b6618f94d7bb2e22f` |

Combined model transfer: **2,355,708 bytes**; 37,140 triangles. Exported vertex counts exceed the Tripo UI's source counts due to vertex splits at UV/normal seams. Both models have y-minimum 0 and local x/z centering, simplifying ground contact. Preserve original PBR textures and avoid crushing the subtle normal/roughness detail. At a nominal 1K RGBA uncompressed texture budget, six textures are approximately 24 MiB before mipmaps; this is an estimate, not measured GPU memory.

Final placement: pump as a forward-left bench circulation assembly and service arm as an outer-right bench fixture; neither should obscure the precise actionable valve/socket/switch surfaces. Semantic control geometry, labels, collision proxies, and mechanical gauge motion are authored by the lead. These rigid props have no deforming animation; any whole-object motion is a mechanical transform, not skeletal rigging. Final gameplay-camera integration is verified by the lead's visual review.

## Hebrew font

`public/fonts/NotoSansHebrew.ttf` is an unmodified local copy of Noto Sans Hebrew, 112,640 bytes. Copyright 2022 The Noto Project Authors; upstream [notofonts/hebrew](https://github.com/notofonts/hebrew). Copied read-only from Critter Safari alongside the full SIL Open Font License 1.1 at `public/fonts/OFL.txt`. SHA256 `7ef36a2c3593758cdb622e1bdef4f84523e92fbc3ccc667438dd80ff54c2de88`. The OFL permits bundling and redistribution with its notice; the font is not sold on its own or renamed. Use `@font-face` with a local project URL so Hebrew UI remains readable offline.
