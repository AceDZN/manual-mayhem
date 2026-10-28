# Workbook host integration QA

Scope: the standalone Manual Mayhem build, its bridge and lesson-entry behavior. This report does not claim that a catalog merge, release upload or the actual Workbook application has shipped. Those are lead-owned checks in the monorepo.

## Contract tests

`npx tsx --test tests/host.test.ts` passes **20/20** checks. The expected contract was read independently from the receiving `packages/workbook-games/src/components/game-player.tsx` and `docs/games/PLAN.md` sections 4.1–4.2 in the Workbook repository.

The tests cover all 30 one-based lesson links without a grade gate; malformed/out-of-range parameters; strict HTTPS Workbook and HTTP loopback parent origins; ready once; actual start/completion queue order; retry reset; duplicate suppression; invalid level/duration rejection; exact versioned postMessage envelope; allowed-referrer fallback; untrusted ancestor rejection; standalone silence; and bounded error reports.

The first run found a stale-target defect: initializing a standalone session after a trusted embedded initialization could retain the old target. The lead cleared the target at the start of `initHost`; the independent regression now passes. No bridge source was edited by QA.

## Actual built iframe

`node scripts/workbook-host-check.mjs` passes **8/8** scenarios against the production build served under a same-origin versioned prefix, `/play/manual-mayhem/host-qa/`. It uses real read/operate buttons, accessible physical action controls, engine start, recovery, retry and Next. It never writes solved state or fabricated progress.

| Scenario | Actual result |
|---|---|
|Required asset readiness|Holding the real pump GLB prevents ready. Releasing it allows ready after the loaded draw. Actual Start then emits level-start.|
|Level 1 completion|Repair alone emits no completion. Engine start produces exactly ready → start1 → complete1. Repeated frames do not duplicate success. The event has the exact source/version/slug/level and integer duration, without invented stars or language score.|
|Operating duration|Large deterministic intervals while reading, settings, paused, on the map, under synthetic blur and after readiness do not inflate completion time. Active operation advances it. Synthetic blur/focus is not a native OS focus test.|
|Retry and Next|Replay produces one new start and completion. A wrong large-valve action produces a strike, no success event; recovery followed by the actual valid action and engine start succeeds. Next opens level 2 but emits start2 only after actual operation.|
|Direct level 30|A fresh `level=30&grade=7` opens playable level 30 with zero completed levels, no final-completion headline, and no earlier completions invented. Start reports level 30.|
|Saved/invalid links|A plain reopen resumes the saved lesson entry; invalid level31 preserves it; valid level1 overrides the saved selection. Fresh invalid31/fractional links retain ordinary level1 progression.|
|Required model failure|Aborting pump.glb reports “Engine model unavailable: pump.glb” to the trusted parent. It emits neither ready nor fabricated play events. Its expected network error is retained separately.|
|Standalone and paths|Standalone play emits no bridge messages. JS/CSS, both GLBs, textures, font and audio resolve beneath the versioned prefix with successful HTTP responses.|

`browser-results.json` contains the received real MessageEvents, request statuses and results. The only error in the passing run is the expected `net::ERR_FAILED` from deliberate required-model abort. Screenshots include actual first/retry wins, fresh level30 and required-model failure. They were opened and visually inspected, not merely generated.

An early fixture run attempted Start while the required-model request was deliberately held and timed out dispatching the action. Readiness gating was instead tested by holding/releasing the asset before the actual click; pre-ready event queuing is covered by the independent unit tests. Another fixture-only error was missing automatic favicon handling; the fixture was corrected before the passing run. Neither diagnostic is counted as a game pass.

An extra negative-origin browser fixture at 127.0.0.2 failed to load the child at all, with a browser error frame and no child requests. Its cause was not established; it does not demonstrate a live origin-rejection result. That diagnostic is retained under `diagnostics/`. Deceptive/untrusted-parent and exact-target rejection remain verified by the 20 unit contract tests. The successful live fixture verifies an allowed real iframe parent.

## Final render and poster

The lead then changed only the first loaded draw to preserve camera settling. The final source was rebuilt separately and `node scripts/workbook-host-check.mjs --poster-only` passed 3/3 checks with zero errors: real iframe ready after the loaded draw, settled intro camera without an invented start, standalone silence/poster capture and prefixed asset resolution. `final-render-results.json` is kept separate from the earlier full bridge run. The render-only change does not claim a fresh full eight-scenario replay. The actual 1600×900 initial-view image is `workbook/poster.png`, with `poster-state.json` recording the genuine initial game state. The refreshed poster and `final-ready-settled.png` were both opened and inspected: settled workshop overview, readable open manual and fully visible Start. It is a real build capture, not generated artwork.

This integration QA does not rerun or replace the prior independent all-30 gameplay campaign. It verifies the host boundary and selected real causal paths. No spontaneous speaking/listening assessment, retained learning or subjective audio-audition claim is made.
