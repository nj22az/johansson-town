# Drink grip acceptance · 6 October 2026

The shared player/resident grip now places drinks on the thumb side of the hand, with right-hand mug handles turned towards the hand. Upright palm fitting also runs during resting holds. NPC props are created before their first pose update, preventing a first-frame fit against the wrong vessel dimensions.

Very short arms and large custom heads use a reachable rest position and a restrained head lean to meet the rim. Head position returns to its authored rest after consumption.

- 45 named characters, all eight vessel types, standing/seated and five phases (hold, lift, sip, lower, rest): 3,600 combinations. Tests measure the actual skinned hand/ thumb, grip contact and lip alignment.
- All 45 NPCs also pass first-frame and idle holding checks. Creator extremes cover child, teen, adult and elder stages, minimum/maximum heights, classic/rounded proportions and maximum round head size, including return to rest.
- 47 focused tests pass, plus 3 runtime package tests. Source fingerprint matches the rebuilt runtime: `6427195125f31342c9a5303499ac9fb76f9a2fc2ba2c192ebccbf3e85ff3778b`. Current compiled game: `game-DXud0z7i.js`. Published cached runtime chunks retained.
- Whole-cast source preview and the actual compiled shed both report zero browser errors. Preview images for all 45 characters, vessels and the smallest rounded avatar were inspected. Compiled Fujita hold/sip/lower captures confirm the fix inside his real shed.

Evidence: [whole-cast report](../../output/playwright/drink-grip/report.json), [compiled shed report](../../output/playwright/drink-grip/shed-final/report.json), [Fujita holding](../../output/playwright/drink-grip/shed-final/compiled-fujita-hold.png), [focused tests](../../output/playwright/drink-grip/focused-tests.tap), [runtime tests](../../output/playwright/drink-grip/runtime-tests.tap).

Preview/camera positions and fixed consumption phases are controlled review fixtures. The production shed and avatar pipeline remain in use. The installed skill client exercised the preview using real arrow-key input; its PNG/state were inspected. The same installed game client completed two normal input bursts (seated → standing/walking), with PNG/state inspected and no error files. Its default SwiftShader game run stalled on macOS and was stopped; a launch-only Metal shim was used for the successful game run. Evidence: `output/playwright/drink-grip/skill-game-metal/`.

Initial acceptance was performed locally before publication.

Main integration rechecked the expanded cast: all 46 named characters, eight vessels and creator size extremes. The rebuilt production shed passes hold/sip/lower with zero browser errors. Runtime and resident-guide checks pass (5 tests). Latest compiled game: `game-ZZsdh7sH.js`; source fingerprint: `517afeb6058c8bbd046ac8a1e9898f29709df5746535f6c12325330360eb64ea`. Main’s current portrait images and newer shop, bath and storytelling features are preserved. Previously published JavaScript chunks are retained for cached clients.

Integration validation: 897 tests, 892 passed and 5 expected skips. The initial full run had one missing-fixture failure because the sparse checkout omitted `motor-90l/motor.js` and `calc.mjs`; restoring the tracked files and rerunning all three motor tests passes. No production code change was needed. The audit-tool checks also pass independently (7 tests).
