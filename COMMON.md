# English clones — three independent builder crews

27 October 2026. Read this and your own BUILD_HANDOFF.md. The human asked to create three more **actual known-game clones**, with fun gameplay, real educational work, logical controls, good 3D assets, background music and SFX. They explicitly requested one separate chat for each builder team. Their original requirements persist: web-playable real 3D, Hebrew-speaking Israeli learners in grades 7, 8 and 9, Workbook curriculum, imagegen gameplay targets before implementation, Chrome/Tripo assets and character rigs, standalone public AceDZN repo with main commits. Begin the build now; no kickoff approval is needed.

The new art priority is explicit:

> for good 3d models the builders can find 3d assets (https://studio.tripo3d.ai/3d-model-gallery/) or generate in my tripo studio if none found. always prefer searching first because generation is expensive and should be used if nothing found or if really need very custom models (like specific characters and such).

The new audio requirement is explicit:

> make sure That the games have good background sounds and sfx sounds. builders can orchestrate a background music or something ... builders can generate all kinds of sfx if need ... you can use my browser if needed.

## Isolation, repositories and crew

| Lead | Standalone repository to create | Public origin | Dev / preview |
|---|---|---|---|
| Skyport Inspector | /Users/acedzn/dev/AceDZN-exp/skyport-inspector | https://github.com/AceDZN/skyport-inspector | 5261 / 4261 |
| Manual Mayhem | /Users/acedzn/dev/AceDZN-exp/manual-mayhem | https://github.com/AceDZN/manual-mayhem | 5262 / 4262 |
| Wordcraft Islands | /Users/acedzn/dev/AceDZN-exp/wordcraft-islands | https://github.com/AceDZN/wordcraft-islands | 5263 / 4263 |

These new game repositories do not exist at dispatch. Your first step is to create your assigned folder if absent, copy this COMMON.md and your BUILD_HANDOFF.md into it, copy **only your listed curriculum snapshots** into docs/curriculum, initialize main, and create/push its public AceDZN origin. Use gh if the GitHub connector does not expose repository creation. Check that gh's active account is AceDZN without printing credentials. Public repo creation/push is authorized by the human's continuing request. If the remote name already exists, inspect it and refuse to overwrite unrelated work; report the collision and choose a clear unused suffix. Never force push or commit secrets. Gitignore node_modules, dist, environment secrets, local caches and test output. Put redistributable models/audio/fonts and actual code in the game repo.

Use your own absolute repo workdir for every command. Your chat's initial projectless workspace is only a launch location. Never edit Idea Plotter source, spec, datasets, old games or another crew's files. Read-only references and copying proven owned assets with provenance are allowed. Do not fork the existing games as a shortcut: retain the chosen source loop and create this game's distinct project. Do not message other user chats. Parent can inspect this chat's progress without such messages.

Use three helper agents with distinct ownership (the human explicitly requested builder teams):

1. **Art/assets:** owns asset search, Chrome/Tripo, models and visual QA; agrees scene ownership with lead.
2. **Audio:** composes/orchestrates music and ambience, creates SFX, owns audio modules/assets and AUDIO.md, tests actual integration.
3. **English/QA:** independently reviews Workbook alignment and content fixtures, solves levels, tests controls and learning bypasses; owns review docs and agreed semantic tests.

Lead owns gameplay integration, build, commits and a cohesive final product. Assign files explicitly; no overlapping edits or competing Git operations. Use inherited model settings. Only the art owner in a crew drives its Tripo tab. All tools must be discovered/used from the actual available catalog; do not assume previous chats' tools or authentication carry over.

## Source-loop fidelity and scope

Your BUILD_HANDOFF names **one source game**, not a blend. Preserve its essential verbs, decisions, cadence, escalating complications, feedback and replay. Document these in SOURCE_LOOP.md and show them in a 60-second playable recording/state sequence. Implement original code, names, art, audio, dialogue, rules/manual and levels. No copied commercial source files, soundtracks, logos or characters are needed.

The human has explicitly expanded this round to **grades 7, 8 and 9**, based on each grade’s rules chapters 10, 11 and 12. Read GRADES.md and the shared COVERAGE.md before content design. Every game must ship three working grade tracks, with at least **three authored challenges per grade** (guided, independent and changed-context transfer): nine challenges in the first release, roughly 8–15 minutes across all tracks. Reuse the same core engine and assets; change the actual English rule, evidence and valid action, not just speed, word count or colors. The coverage matrix identifies complementary ownership across the nine chapters; this is selected-rule coverage, not completion of entire chapters. One complete success/mistake/recovery/retry loop must work before content expansion. A menu, scene walk, asset viewer, question slideshow or core-loop imitation with no functional rules is incomplete. Online services/accounts/runtime AI are outside scope. Deliver single-player completeness; the Manual Mayhem partner manual is a static optional human role, not a backend project.

## Mandatory screenshot-first workflow

Before game implementation, read `/Users/acedzn/.codex/skills/.system/imagegen/SKILL.md`, generate and inspect at least one 16:9 gameplay design target with built-in image_gen and your supplied prompt. Save exact prompt and image in docs/visual-targets. Generated art is a **mockup/design target**, never an actual screenshot of a working game. A second target may cover a later state if useful. Do not substitute nano-banana, a one-off API runner, SVG or a start-screen screenshot for this requirement. If the built-in tool fails, record and report the actual blocker; don't invent a successful image or silently claim completion.

After implementation, take real gameplay captures and compare directly: camera, world occupancy, material/lighting quality, model scale, HUD, readable English and visible player action. Fix material mismatches and record intentional achievable differences in VISUAL_REVIEW.md. Attractive concept art does not establish a good final game.

## Tripo search first — spend only when justified

Use the human's **Chrome** through `mcp__cua_repl` and its current docs. Open your own named browser tab; never navigate or cancel another task's tab/jobs. Gallery: https://studio.tripo3d.ai/3d-model-gallery/ . Owned assets: https://studio.tripo3d.ai/assets . Generation: https://studio.tripo3d.ai/workspace/generate/ . Parent verified signed-in gallery access on 27 October. The DOM search textbox was “Search tag...”, though AX called it “search”; inspect current state rather than guessing selectors. If extension control fails, read browser-troubleshooting and try the supported native Chrome App surface through cua; this recovered earlier crews' Tripo work. Do not use osascript, hidden APIs, extracted tokens, raw network endpoints or an unrelated browser control mechanism.

**Default new generations: zero.** Search the gallery for the needed ordinary prop/character and inspect My Assets. Record query, candidate links or owned task IDs, fit, download/rights status, and rejection reasons in ASSET_SEARCH.md. Relax cosmetic preferences and harmonize materials before spending on a near-identical custom prop. Choose generic existing assets during art direction; don't design an unnecessary bespoke character and then call it a requirement.

Generate only for a genuine documented search miss or a truly necessary custom character. Limit this slice to at most **two justified new models per game**, using existing credits; record the displayed credit cost before starting. Rig/animate chosen characters as needed. Never buy credits, subscribe or upgrade. Prior balance observations are not reserved budget. Reuse suitable already-owned assets where possible; the earlier six repos contain GLBs and ASSETS.md (see your brief). **Do not alter their files**. Check provenance and redistribution rights; gallery availability alone isn't a verified license. Download normally through the UI, keep original/optimized hashes, record source/license/attribution in ASSETS.md. No asset mirroring from a competitor game.

Runtime models live locally in public/models; optimize textures/geometry and measure bytes. Target roughly ≤3 MB per featured model and ≤25 MB initial download, but report actual values. Give models consistent scale, ground contact, readable silhouette, coherent materials, smooth appropriate normals, intact textures and sensible collision proxies. Check them from the gameplay camera, not only in a viewer. Include wireframe/polycount and memory considerations when large. Procedural exact surfaces, terrain, switches, document planes, colliders and particles are fine. Featured props/characters must be good meshes, not a permanent cube stand-in. Deformed/full-body character animation needs a real rig and appropriate clips; use Tripo rigging where acquiring that character. Static props may rotate/bob as rigid bodies without a fake rig claim. Avoid facial animation if not necessary.

## Audio is a first-class deliverable

The audio owner must ship **music + ambience + action SFX**, not just a beep and background hum. Each game's brief sets its own musical identity. An original local composition is preferred for reliability: a documented 32-bar ABAC or AABA arrangement with a recognisable motif, harmony, bass and light percussion, varied voicing/fills and a seamless loop; use layered scheduled Web Audio or render to local audio files. Include at least a calm/play section and a tasteful higher-energy layer or variation for the climax. Keep texture suitable for English reading.

Licensed free recordings or AI-generated music/SFX through the human's browser are also allowed when the actual service and output rights are checked. Do not invent a free tier, assume Gemini access, sign up/accept new terms, enter billing, subscribe or spend money. If a service is blocked, compose locally; it is a complete approach, not an excuse for missing audio. Never reuse commercial source-game music. Record tools/prompts, score/composition source, sample URLs/license/attribution and processing in AUDIO.md.

Implement at least **eight contextually different cues** appropriate to the loop, with variation so repeated actions don't sound like the same UI blip. Include environmental bed and clear success/mistake/recovery cues. Avoid harsh sustained alarms during reading. Correctness must also have visual/textual feedback, not color or sound alone. Language audio is replayable and subtitled; speech is optional, and music/ambience duck under it.

Audio starts/resumes only after a user gesture; independent music, SFX and voice gain/mute controls plus a master mute. Remember settings locally, ramp gains to avoid clicks, cap concurrent one-shots, keep headroom/limiting, prevent multiple loops after restart, and suspend/fade appropriately on pause/tab blur. No stuck notes, clipping, abrupt loop seams or default deafening effects.

Test actual running audio after Start, settings, pause/resume, restart and focus changes. Offline-render a **20–30 second mixed preview** in docs/audio and expose it for the user. Inspect duration, decodability, non-silent waveform/RMS, peak/headroom and loop boundary; verify real browser playback/AudioContext state. Listen through available supported audio playback if possible; state honestly which checks were automated and whether anyone actually auditioned it. A nonzero analyser is not proof of musical quality. The final delivery must offer the preview and document known audio limitations.

## Learning and novice controls

Hebrew UI/help, English task text LTR; bundled readable Hebrew font, no forced transliteration. Use exactly the cited Workbook scope. New scenarios are original fixtures. CURRICULUM.md maps each challenge to URL, skill, intentional contrast, authoritative world state, outcome and feedback. Formal coverage stays accurate: no speaking claim from a solo text task; no article-production claim from automatically inserted articles; no claim of retained mastery from a single win.

Each game needs a short teach → guided attempt → feedback → reduced-support repetition → changed-context transfer sequence. Test **paired fixtures differing in meaning but sharing appearance**, so English changes the valid action. Test both sides of each contrast. Shuffle cosmetic features and answer location; don't secretly highlight the right answer. Model all stated conditions and missing information. Multiple physically and semantically valid solutions are welcome. If the player bypasses a target skill, let a valid game solution stand but don't score that skill as demonstrated.

Local events distinguish unaided first attempt, hints/translation, spelling help, retries and transfer. Show a short Hebrew explanation tied to the precise source phrase after a misconception. No unrelated quiz gates and no repeated button-only brute force counted as learning. Practice mode pauses action pressure while inspecting, consulting the manual, translating or typing; optional challenge mode may add a timer after onboarding. Reading speed is not proficiency.

Controls must fit your loop and be explained in under 20 seconds. Pointer/touch affordances must match the physical object, with consistent grab/inspect/rotate/release behavior, forgiving targets and undo/recovery. Core actions need keyboard alternatives, focus outlines and an accessible text inspection view. Never fire movement/fullscreen shortcuts while an input is focused. Test Hebrew keyboard layout, drag cancellation, Esc closing only the active overlay, resize/orientation, mobile touch and restart. Fixed inspection cameras do not need WASD/pointer lock. No camera movement while dragging a device dial or document. User can exit any zoom/interaction state.

## Implementation and verification

Vite + TypeScript + Three.js, real 3D with depth/light/raycasting, one main canvas; pure TS authoritative content/rules independent from rendering. Add Rapier only where physical puzzles need it. Static npm run build with relative base, lockfile and local models/audio/fonts. No secrets, backend, student accounts, tracking, runtime AI or production deployment. Strict assigned ports, do not kill processes you didn't start; document fallback if occupied.

Read `/Users/acedzn/.codex/skills/develop-web-game/SKILL.md`; initialize progress.md with Original prompt; use its existing Playwright action client for meaningful gameplay changes. Expose `window.render_game_to_text()` (objectives, shown content, world quantities, decisions, learning evidence and audio state) and deterministic `window.advanceTime(ms)` respecting pause. Unit tests cover semantic fixtures, world success conditions and level solvability. Do not inject a win state as a playtest. Actually inspect latest gameplay screenshots, resolve console errors, and play the full causal paths.

Independent QA must execute a complete win, a wrong interpretation with visible consequence and recovery, hint/assisted path, changed-context unaided transfer, pause/settings/restart, keyboard-only core actions, touch/mobile and audio. Log actual commands/results and defects in PLAYTEST.md; do not assert fun or learning gains from automation. Keep controls and listening checks separate from simulated state tests. Compare actual art with the imagegen target. Typecheck/build/relevant tests must pass or have truthful blockers.

## Deliver and keep building

Commit/push meaningful checkpoints on main; no force. Keep the dev server running on your documented port. Final output includes playable local URL, public repository, real gameplay captures, mockup-versus-game comparison, model provenance/search log and rig status, music/SFX preview and licenses, curriculum mapping, tests and exact remaining limitations. Files: README, progress.md, SOURCE_LOOP.md, CURRICULUM.md, ASSET_SEARCH.md, ASSETS.md, AUDIO.md, docs/visual-targets, docs/audio, VISUAL_REVIEW.md and PLAYTEST.md. Deliver the full finite playable slice; do not end after a design, dependency install, generated mockup or asset search. External blockers do not excuse concealing missing requirements.
