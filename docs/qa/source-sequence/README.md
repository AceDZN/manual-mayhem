# Real 60-second source-loop sequence

Captured from the running game on 27 October 2026 using actual UI and physical cable controls. These are working-game screenshots, not imagegen mockups. No solved state was injected. `sequence.json` contains the actual timestamps, modes, strike and completion counts; matching JSON files contain the full visible game state.

| Target / actual second | Action and consequence | Capture |
|---|---|---|
| 0 / 0.10 | Read separate manual while inspecting engine | [Manual](00-read-manual.png) |
| 10 / 10.71 | Open large before small is closed → vent, fault, strike | [Misinterpretation](10-wrong-order-vent.png) |
| 20 / 20.12 | External recovery, correct valve order → first stable module | [Recovery](20-recover-valves.png) |
| 30 / 30.64 | Drag actual 3D source cable into square-screen socket | [Connection](30-physical-cable.png) |
| 40 / 40.13 | Close both clips and test → two stable modules | [Patch stable](40-patch-stable.png) |
| 50 / 50.11 | Correct relay procedure → startup ready | [Ready](50-ready-startup.png) |
| 60 / 60.04 | Start festival engine → win with strike/retry evidence preserved | [Engine online](60-festival-online.png) |

All seven captures were visually inspected. The run contains one strike and one retry; it is guided practice and is not represented as unaided mastery. Separate transfer runs in `../browser-results.json` show the three grade-specific first-attempt paths.
