# Published Workbook app verification

Verified 28 October 2026 against https://english-games.workbook.co.il with fresh anonymous Chrome contexts using the native Metal renderer. The standard release used game runtime `b535e1c`; the app is [PR 369](https://github.com/AceDZN/acedzn-tools/pull/369), merged as `877f116bf5afd27fffed139031abae0d1fa7a4ad`. Its production deployment `dpl_9aJC9wGJiyFocBrrVovWou3UkXmf` reported READY with the public custom domain assigned.

`scripts/workbook-app-check.mjs` passed all five checks. It used actual visible controls and observed the real parent messages; it did not inject progress, repairs or wins.

1. Home card opens the detail page, with 30 level rows and eight unique assessed lesson links.
2. Lesson 24 opens the released same-origin iframe. Required assets and rendering finish before ready; the parent loading overlay clears. It starts at 24 with zero completed levels and a visible manual. No grade selector is present.
3. Switching through the real map to 1, reading, operating the small valve and starting the engine produces a real win and exactly one received completion from the correct iframe origin.
4. A genuine retry produces one additional completion. Next opens 2 without reporting an operation before it begins.
5. A fresh 390×844 touch context opens lesson 30 with zero completed levels, a visible manual and no rotation gate, then completes 1 through real touch controls.

[Machine-readable results](results.json) record all five passes, zero page errors and only successful game-asset responses. The release verifier separately checked all 62 uploaded objects, including files not requested in these specific browser scenarios. The app production build, 98 game unit tests, 11 catalog/release checks, 9 lesson/analytics checks and the separate iframe boundary checks had also passed.

All five browser captures were opened and visually inspected:

- [Desktop detail](desktop-game-page.png)
- [Desktop linked24, manual visible](desktop-linked-level24.png)
- [Desktop genuine win](desktop-real-win.png)
- [Mobile linked30, manual visible](mobile-linked-level30.png)
- [Mobile genuine touch win](mobile-real-win.png)

Reproduce:

```sh
WORKBOOK_APP_URL=https://english-games.workbook.co.il node scripts/workbook-app-check.mjs
```

This focused integration check does not rerun all 30 solutions; the sequential 30-level gameplay record is under `../campaign/`. It does not claim human audio audition or native OS keyboard/focus testing. Earlier unsuccessful harness attempts remain in [diagnostics](diagnostics/README.md).
