# Workbook release

The standard `pnpm games:release manual-mayhem --from <game-repo> --poster <game-repo>/workbook/poster.png` command in acedzn-tools builds/tests this clean source tree, uploads immutable versioned files and records the source commit in the catalog.

The poster is an actual1600×900 browser capture, not the imagegen target. Host protocol and browser evidence are in docs/qa/workbook-host. Workbook lesson URLs use `?level=N`; this grants access without creating completion evidence for earlier levels. No grade selection or grade eligibility gate is added.
