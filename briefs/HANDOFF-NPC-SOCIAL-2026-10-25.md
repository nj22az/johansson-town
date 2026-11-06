# NPC social restoration — 25 October 2026

Owner request: restore NPC behaviour so residents talk and interact with each other naturally, following a screenshot of Vy and Tetsuo standing together in Harbour Park.

## Verified cause and scope

Production `src/edition.js` explicitly set `BUDGETS.web.neighbourChats=false`, following the 19 October browser-demo decision. The social controller also scanned only `world.people`, excluding the separate neighbourhood controller (`world.homeNeighbours`), including Vy. Canonical neighbourhood walks ignored `chatHold`, although the older generic walking branch already honoured it.

Implemented from main `344dc5d5cac9e73cd8d6b885a7d3bed2356f4715`. Newer production `e2773e5066bc041e6afaa9409598524cf8c78793` changes the hotel section and root handover only; its hotel changes and handover entries are preserved. This is a small cartoon-World correction, not promotion of the Sakura prototype. **Published to main as `dac65f40064c21fb32e5bfcc39326ffdca13cf8e`.** The uploaded Git tree was verified against the complete local delivery tree before promotion. [GitHub Pages deployment 40161172778](https://github.com/nj22az/nj22az.github.io/actions/runs/40161172778) passed. All six checked public files (page, edition budget, social controller, neighbourhood controller, compiled boot and compiled game) matched the tested local bytes exactly after deployment.

## Resulting behaviour

- Nearby ambient conversations are enabled on the browser. Distant timetable limits, trade, machinery, money and player-conversation budgets remain unchanged.
- Both resident collections join the same local exchange controller, with one pair at a time within 14 m of the observer and 0.85–2.8 m between speakers. Shared room/parent, floor height and unobstructed sight are required. Bodies are never teleported into conversation positions.
- Existing written personality dialogue, relationship exchanges, alternating speakers, gaze, gestures, line-reading times and cooldowns are retained. No language model is required; a user-enabled local writer remains optional.
- Driving, ferry passengers/crew/shore duties, boarding, service, shopping/restocking, sleep, transitions, authored games and player control take priority. Moving apart or changing the scheduled destination releases both actors.
- Vy and the other canonical neighbours pause walking and authored facing while conversing, then continue the same route. Neighbourhood identities can retain completed encounter memories in the bounded relationship save format.
- No chats run during time catch-up or paused play. Opening player conversations continues to cancel ambient exchanges.
- Runtime rebuilt, service-worker cache version updated, and the previous **production** runtime generation retained for already-open tabs. Intermediate local builds are not delivered.

## Checks actually run

- Focused edition, conversation and shared-dining checks: **19/19 passed**. This includes real `createNeighbours` Vy participation, saved encounter round-trip, pause/resume of her canonical route, speaker turn-taking, walls, room separation, proximity, duty interruption and control/visibility cancellation.
- Final runtime-package checks: **4/4 passed**.
- Full guard: **421/421 passed, 81 files**, serial run with `NODE_OPTIONS=--max-old-space-size=10240 node tools/ci-guard.mjs --test-concurrency=1` (510 s). This includes all 13 no-z-fighting checks. The initial parallel run exposed a shared-dining test fixture missing the new `cancel` method (corrected), and its geometry file exited without assertion detail under concurrent memory pressure; the complete serial run passes.
- Source/documentation whitespace check: passed. Vite’s generated compact-shops chunk retains whitespace inside upstream shader strings; generated shader source was not reformatted.
- Attempted Chromium launch using the available Chrome 151 binary: **blocked before any page loaded**, `socket() failed: Operation not permitted` in the process singleton. No compiled-game screenshots, frame-rate result or autonomous rendered-play result is claimed. Physical iPhone/iPad Safari and Steam Deck are unverified.

## Next acceptance

The [hosted World guard 40161173347](https://github.com/nj22az/nj22az.github.io/actions/runs/40161173347) was still running when publication was verified; the complete local 421-check run passed. On physical Safari, observe an ordinary Harbour Park encounter, both speakers' faces/gestures and readable balloons on iPhone/iPad; confirm separation, interruption and return to their routines. Inspect the owner's close-standing pair in motion: this task restores social exchanges and does not claim that every crowd-spacing or navigation issue is resolved. Linux packages require a later release to receive these shared-controller refinements; no Linux package was published by this task.
