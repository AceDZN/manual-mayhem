# Manual Mayhem: one campaign, 30 levels

The campaign replaces the learner-facing school-grade selector. Everyone can play the same ordered 30-level route. `grade` remains internal source provenance inherited from the existing Mission interface; it is not a difficulty gate or a learner label. The original nine MISSIONS remain reference fixtures for regression tests, not the public campaign menu.

`src/campaign.ts` exports `CAMPAIGN: CampaignLevel[]`. Each entry contains Mission fields plus `level`, `chapter`, `skill`, `sourceModules`, and `activeModules`. IDs are `level-01` through `level-30`. Every entry has all three physical ModuleSpecs with matching V/C/S serials numbered 01–30. The first six levels mark unused bays as standby; their manuals explicitly say not to operate them. Levels 7–30 activate all three families.

This is a finite authored comprehension campaign, not a complete English grammar course. Difficulty changes the English meaning, current state, needed action, order, receiver, or condition. It does not merely shorten a timer. Optional reading/help support must remain available, and supported attempts must remain distinct from unaided evidence.

## Authored progression

V = valves, C = cable/clip bay, S = relay/fan deck. “Both clips” allows either clip order unless A-before-B or B-before-A is explicitly stated.

| Level | Name | Active | Meaning that changes the valid world action |
|---:|---|---|---|
| 1 | סגירה ראשונה | V | One imperative: close small; large must stay closed. |
| 2 | השקע שמתחת למסך | C | Connect below square, close both clips, TEST; round is prohibited. |
| 3 | רק המנוף השמאלי | S | Activate only left, then TEST; right and fan remain off. |
| 4 | הכנת הבמה | V+C | Small-close precedes large-open; cable reference changes to round. |
| 5 | נוהל חובה | V+S | Reverse the valve order: large-open before small-close; use right, not left. |
| 6 | שני נהלים | C+S | Clips precede square connection; right precedes left on the relay deck. |
| 7 | שלוש מערכות מתעוררות | V+C+S | Reopen small after closing it and opening large; A precedes B; fan precedes left. |
| 8 | מנוע הערב | V+C+S | Initial valves change; close large then open small; B precedes A; activate then deactivate left. |
| 9 | בדיקת ערב | V+C+S | Final-state prohibition: right must be turned off after both relays were activated; cable clips precede round in B/A order. |
| 10 | במה חדשה, אותו מדריך | V+C+S | Imperative transfer: three valve actions; B already closed; fan initially on must be stopped; right then left. |
| 11 | מי מקבל את הפעולה | V+C+S | Present passive identifies music as receiver and left as agent; request only music. |
| 12 | מפת קווים חדשה | V+C+S | Cooling is opened by right; fan follows that action. Relay must preserve only, agent and order. |
| 13 | שני קווים, סדר אחד | V+C+S | Open music with left before cooling with right; before/after also governs valves and TEST. |
| 14 | הודעה בלי קישוטים | V+C+S | Cooling is opened then closed before music opens; relay omits decorative bunting but retains round, clips-first and square prohibition. |
| 15 | כשהקו נפתח | V+C+S | When music opens, start fan; A is already closed, so cable procedure requires only B after connection. |
| 16 | לשמור על מילה קטנה | V+C+S | In the changed mapping, music is left and cooling is right. Fan comes before only music; relay must retain only and leave-cooling-closed. |
| 17 | חיווט הבמה | V+C+S | Current cable connection is explicit; reconnecting is not requested. B precedes A; music opens, fan starts, then music closes before TEST. |
| 18 | הסדר במסר משנה | V+C+S | Both lines open in order, then cooling closes; mediated cable message retains round and A-before-B. |
| 19 | הנמען צריך את התנאי | V+C+S | Both valves initially open; close large before small, reopen only large. A is already closed; relay preserves that state. |
| 20 | מנוע מסירת המסר | V+C+S | Passive/time-clause transfer: four valve actions; round already connected; fan on, music-right, cooling-left, fan off, TEST. Relay preserves no RESET. |
| 21 | מה הוחלף ומה עובד | V+C+S | Left was replaced, but the explicit current check says left fails/right works. Tag left and operate right. |
| 22 | תיקון אינו הבטחה | V+C+S | Right was replaced but still fails; left works. Tag right, operate left. The replaced square socket also explicitly fails now. |
| 23 | אותו רישום, בדיקה חדשה | V+C+S | Left was replaced and now explicitly works; right fails. Tag left and operate left. Past tense alone never determines current repair status. |
| 24 | כלל קבוע: פתוח וסגור | V+C+S | Repeated zero rule: small-open gives 3, small-closed gives 1; calibrate 3/1/3 with TEST after each setting. |
| 25 | כיוונון חדש | V+C+S | Reversed causal rule: large-open lowers to 2, large-closed gives 4. Calibrate 2/4/2; relay must retain every target/test. |
| 26 | כל ארבעת המצבים | V+C+S | Joint zero conditions: neither=1, only small=2, only large=3, both=4. Four targets require four distinct physical states. |
| 27 | הבדיקה הבאה | V+C+S | First conditional for this startup: pressure 3, +2 without fan, stop at 5. Predict current unsafe test, then start fan before TEST. |
| 28 | סבב בדיקה נוסף | V+C+S | Reversed startup plan: fan is on, pressure 4, +1 with fan, stop at 5. Predict failure and stop the fan; relay retains both-relays-off. |
| 29 | סף חדש להתנעה | V+C+S | Threshold changes to 6: current 3, +3 without fan or +1 with it. Start fan for safe 4; relay retains the new threshold. |
| 30 | מנוע הפסטיבל — מסירה מלאה | V+C+S | Mixed transfer: repeat fixed valve calibration; round was replaced but currently fails; tag replaced right relay yet use working left; predict fan-on test at 6, then stop fan before TEST. Relay preserves record, current check, prohibition and plan. |

## Source modules

These are exact saved Workbook modules. Original chapter snapshots are in `docs/curriculum`. The campaign uses selected rules deeply; it does not claim completion of entire chapters.

- Levels 1–10: [modals-and-imperatives](https://english.workbook.co.il/grade-7/chapter-11/modals-and-imperatives) and [reading-functional-texts](https://english.workbook.co.il/grade-7/chapter-12/reading-functional-texts).
- Levels 11–20: [present-simple-passive-reference](https://english.workbook.co.il/grade-8/chapter-10/present-simple-passive-reference), [connectors-and-time-clauses](https://english.workbook.co.il/grade-8/chapter-11/connectors-and-time-clauses), and selected levels' [mediation-and-shared-understanding](https://english.workbook.co.il/grade-8/chapter-12/mediation-and-shared-understanding).
- Levels 21–23: [past-simple-passive-reference](https://english.workbook.co.il/grade-9/chapter-10/past-simple-passive-reference) plus [mediation-reference](https://english.workbook.co.il/grade-9/chapter-12/mediation-reference).
- Levels 24–30: [conditionals-reference](https://english.workbook.co.il/grade-9/chapter-11/conditionals-reference) plus relevant mediation and retained functional-reading/passive sources listed in each entry's `sourceModules`.

The ordinary first-conditional pattern is used in the supplied machine situations; no universal “English never uses will after if” claim is taught. No second conditional, spontaneous writing, speaking/listening assessment, full tense mastery, or retained mastery is claimed. Solo relay choices assess recognition of a relevant complete message. Actual partner conversation remains an optional human activity.

## Authoritative condition semantics

`ModuleSpec.pressureRule` keys encode small-open then large-open: `00`, `01`, `10`, `11`. The evaluator must compute valve pressure from the current Boolean pair after accepted toggles; the same current state must always give the same pressure. Explicit initial pressures match their truth table.

| Level | 00 | 01 | 10 | 11 | Authored target sequence |
|---:|---:|---:|---:|---:|---|
| 24 | 1 | 1 | 3 | 3 | 3 → 1 → 3 |
| 25 | 4 | 2 | 4 | 2 | 2 → 4 → 2 |
| 26 | 1 | 3 | 2 | 4 | 2 → 4 → 3 → 1 |
| 30 | 1 | 1 | 3 | 3 | 3 → 1 → 3 |

Startup conditions live in `startup` with numerical deltas and stop threshold. Level 27 is safely fan-on, 28 is safely fan-off, 29 is safely fan-on at a new threshold, and 30 is safely fan-off while preserving a separate working-relay decision. The startup prediction refers explicitly to the original state before intervention. TEST must produce the described pressure and stop result on the unsafe branch, rather than merely marking an answer wrong.

Maintenance specs expose `maintenanceTag: 'none'` and `tagLeft`/`tagRight` booleans for generic renderer availability. Tag action follows the past record; operation follows the independent current check. A previous replacement is neither proof of present success nor proof of present failure.

## Authoring checks and verification boundary

Authoring check completed: exactly 30 ordered entries, 30 distinct full action-procedure signatures, 90 unique serials, all active families have nonempty procedures, every authored action has a defined world effect, and all initial pressure-rule states match. There are 273 authored action slots, including TEST and freely ordered clip groups. TypeScript compiled after the initial authoring pass.

These structural checks do not establish gameplay completion or learning. Independent English/QA owns manual-derived solutions, paired contrasts, state outcomes, browser play, accessible controls and truthful verification reports. Lead owns active-bay gating, campaign UI, persistence, renderer hooks and integration. Do not mark all levels verified from this document alone.
