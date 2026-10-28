# Workbook release

The standard `pnpm games:release manual-mayhem --from <game-repo> --poster <game-repo>/workbook/poster.png` command in acedzn-tools builds/tests this clean source tree, uploads immutable versioned files and records the source commit in the catalog.

The poster is an actual1600×900 browser capture, not the imagegen target. Host protocol and browser evidence are in docs/qa/workbook-host. Workbook lesson URLs use `?level=N`; this grants access without creating completion evidence for earlier levels. No grade selection or grade eligibility gate is added.

Published at [Workbook English Games](https://english-games.workbook.co.il/manual-mayhem) on 28 October 2026. Immutable release `2026-10-28` was built from game commit `b535e1c`; all 62 uploaded objects were checked against local SHA256 hashes. The catalog,30 levels and eight assessed lesson mappings were merged in [acedzn-tools PR 369](https://github.com/AceDZN/acedzn-tools/pull/369), merge commit `877f116bf5afd27fffed139031abae0d1fa7a4ad`.

The production build is READY. Five real public-app checks passed in anonymous desktop and mobile Chrome: home/detail links, lesson-level entry, manual-first loading, actual operation/completion, retry and next-level behavior. See [the report](../docs/qa/workbook-app/README.md) and its actual browser captures. Reproduce with `WORKBOOK_APP_URL=https://english-games.workbook.co.il node scripts/workbook-app-check.mjs`.
