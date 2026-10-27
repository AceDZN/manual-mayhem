# Manual Mayhem — בלגן לפי המדריך

An original harmless festival-engine adaptation of **Keep Talking and Nobody Explodes**: inspect a changing tangible machine, consult a separate manual, communicate a precise procedure and operate valves, cables and relays. Three strikes shut the test down; recovery restores a module, startup brings back the score.

## Play locally

```sh
npm ci
npm run dev
```

Open http://localhost:5262/ . Production preview: `npm run build && npm run preview` → http://localhost:4262/ . Ports are strict. No backend, AI runtime, keys or accounts. All assets are local. Source and public repository: https://github.com/AceDZN/manual-mayhem . No production deployment.

Select grade 7, 8 or 9 and one of three authored missions. Start enables audio. Click a module to inspect it straight on; use the physical controls or the labeled buttons. Drag the handle/background to rotate the overview. Turn wheels by rim drag/click; drag the orange OUT cable to the socket under the described screen. M opens/closes the manual; Esc closes the active view; 1/2/3 inspect modules; Tab/Enter operate buttons; F toggles fullscreen. Left/right always refer to facing the module. No movement controls or pointer lock.

Solo manual flip is complete play. For a real human reader, open `?manual=1` on a separate screen (or `/manual` with a SPA fallback). The reader page is static: no live answers, machine state, microphone, account or sync. It can be printed.

Practice has no clock. Optional challenge time stops during inspection, manual, translation, pause and settings. A hint/translation, retry, mistake or reviewed message selection is recorded locally; successful play does not imply retained mastery or speaking assessment. RESET is a physical action that can violate a prohibition. “איפוס לצורך ניסיון חוזר” is an external recovery affordance.

## Learning scope

Nine authored missions, guided → independent → changed-context transfer per grade:

- G7: imperative action/object, ordered procedure, must/negation, functional-text restrictions.
- G8: present passive receiver and by-agent mapping, before/after order, relevant complete relay selection.
- G9: repeated zero-conditional rule; past-passive maintenance plus explicit current test; a specific first-conditional prediction and prevention plan.

Exact Workbook sources and evidence limits: `CURRICULUM.md`, `coverage.json`, `COVERAGE.md`. Selected rules only: no complete-chapter coverage, spontaneous writing, live speaking/listening, full tense system or second conditional claim.

## Assets and audio

`ASSET_SEARCH.md` records six live Chrome Tripo gallery searches and owned-asset inspection. Two locally bundled owned meshes are rigid machinery, with provenance/rights/size/rig status in `ASSETS.md`; no new generations or credits. Noto Sans Hebrew is OFL licensed.

`AUDIO.md` documents the original 32-bar ABAC electro-mechanical composition, module stems, ambience, eleven cues, independent music/SFX/voice/master gains, limiting and QA. Preview: `docs/audio/manual-mayhem-mix-preview.wav`. Audio/source is MIT; no source-game recordings. No spoken audio is bundled, so voice gain is reserved and labeled accordingly. Human audition is not claimed.

## Checks and evidence

`npm test` runs independent semantic fixtures; `npm run build` typechecks and produces static relative-base output. `window.render_game_to_text()` exposes current visible state and evidence without next-action solutions. `window.advanceTime(ms)` respects game pause and deterministic pressure stepping. Browser scripts/evidence are under scripts/, docs/playtest/, docs/qa/ and docs/audio/; `PLAYTEST.md` and `VISUAL_REVIEW.md` state completed checks and limitations.

The image in `docs/visual-targets/gameplay-mockup.png` is an AI-generated **design target**, never presented as working gameplay. See its exact prompt and built-in generation record in the same folder. Gameplay captures are separately named.
