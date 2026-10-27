# Campaign QA

Current requirement: one sequential 30-level campaign, with no learner grade selection or grade cap. The source grade metadata remains internal provenance. This supersedes the historical nine-track test reports.

`solutions.json` contains independently hand-read action and reviewed-choice solutions. They are not generated from `ModuleSpec.steps` or `nextActions`. `tests/campaign.test.ts` uses those readings for all 30 solvability checks and contrasts between meaningfully different procedures on comparable hardware.

`semantic-tests.txt` records 76 passing tests: 47 independent campaign checks, four progress checks and 25 legacy semantic regressions. Unit success does not establish visual quality or browser usability.

`visible-campaign.mjs` opens a fresh native Chrome/Metal context and uses actual UI page/read/operate buttons, accessible action controls, reviewed choices and engine start. It progresses through all 30 using the Next button rather than injecting a win, selecting locked levels or writing progress. Prediction questions are answered from their explicitly stated initial scenarios before the startup prevention actions. The runner checks world readings, active-only readiness, assistance, zero strikes/retries, unlock timing and earned replay/resume progress.

`campaign-results.json` is the actual per-level result log. `earned-storage-state.json` is written only after legitimate wins (checkpoint every five levels and final save after level 30). Its purpose is reproducible QA of later-level replay/audio; it is not a production seed or fabricated unlock file. Later tests must identify reuse of this earned state.

Screenshots and matching JSON state captures accompany representative early, middle, maintenance, calibration and capstone states. They require actual visual inspection; their creation alone is not a pass.

The initial runner stopped at level 1 because its assertion incorrectly expected guided assistance to be false. Guided levels are deliberately assisted. That harness expectation was corrected before the fresh full run. The initial image showed the genuine open paper and visible Start, not a game failure.

Final result: all 30 sequential UI wins and 34 campaign checks passed, plus five focused physical/context checks (including the final tag readability recheck). All reports contain no console/page errors. The audio helper separately passed 14 campaign regressions under `audio/`. Actual early/middle/final, connected-cable, physical-tag, mobile and final 1440/900 images were opened and inspected. The focused runner reuses legitimately earned progress; no new first-attempt claim is made.

Final visual fix: the case trim originally occluded letters in REPLACED. After the tag plane was moved forward, `tag-final.mjs` repeated actual right-tag selection. Both final before/after images were opened and the full word is readable. The original occluded image remains historical diagnostic evidence.
