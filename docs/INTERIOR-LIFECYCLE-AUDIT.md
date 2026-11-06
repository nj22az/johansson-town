# Interior rendering and resident continuity — 18 October 2026

Baseline: main `14a10d6fad4a35be62e58447664efa98acff2315` (includes PRs #226 and #228).

## Reproduction limit

The available interactive cloud Chrome browser failed to initialise WebGL at startup. It therefore could not reproduce entering Sakura on current main. This is an environment limitation, not evidence that the reported physical iPhone crash has been resolved. No physical iPhone Safari acceptance has been performed.

## Verified defects and corrections

- Sakura's merged street window copy expanded already-instanced shelf products into duplicate vertex arrays. The procedural fixture measured 31,559,736 bytes / 285,954 triangles before, and 3,266,664 bytes / 29,246 triangles afterwards: 28,293,072 fewer duplicate bytes. Products now keep their existing instanced buffers and stock updates. This is fixture geometry data, not total browser/GPU memory.
- Closing a nonpersistent room hid it but retained its owned geometry, materials and textures until another room was entered. Leaving now restores borrowed actors, disposes room-owned resources, clears colliders/interactions, and leaves Sakura's persistent live storefront intact.
- Interior window index caches lacked explicit disposal. They now release private index buffers on room changes, without disposing borrowed vertex buffers. Cache byte counts are exposed in the existing audit diagnostics.
- Spatial partition construction used growable arrays of boxed triangle indices. It now uses packed typed arrays, including 16-bit indices where possible.
- The simultaneous main-cast test reproduced Nhung remaining in the shared alley. Turns repeatedly reset the stall timer, preventing a detour. Only actual travel now resets progress. The test also exposed a 12 cm walker / 18 cm planner kerb mismatch on Mrs Sato’s homeward journey; both now permit the planned 18 cm step. Main schedule collisions use the same height-aware obstacle rule as secondary residents.
- Outdoor visibility entries retained disposed window-copy meshes while indoors. Invalidating the section list now drops those references immediately.

- Fresh WebKit repetition exposed one retained GPU bone texture per izakaya visit. Owned mascots now dispose their cloned skeletons (idempotently) while preserving cached geometry and paint. A ten-cycle ownership regression and a strict post-warm-up texture-count assertion cover the correction.

## Preserved behaviour

The town clock, cast schedules, shop jobs, neighbour navigation and relevant world journeys already advance indoors. No schedule freeze was added. Interior views retain only the real street geometry intersecting an actual window portal; turning away from windows uses a single room pass. No refraction framebuffer, offscreen town render target or extra background asset stream was added. Sakura retains live staff and customers through its existing inexpensive haze glazing.

## Verification scope

- Baseline: 21 rendering, housing and overnight checks passed.
- New journeys: all 18 secondary residents reach each authored destination through the real world colliders, occupy their homes overnight and depart the next morning with their parent town hidden. Destinations are held long enough to test reachability independently of time compression; the postman's working round is covered separately.
- All 10 main street residents reach home and scheduled indoor destinations against the production schedule collision predicate. A further test runs all ten together through five home/work/night/morning changes with the town hidden. This does not prove every possible crowd interaction or ferry connection.
- The canonical inventory covers 31 identities. Johansson is the player, Fujita has his dedicated shed/houseboat controller, and the Barfly has the izakaya resident controller. Existing home, overnight, Fujita, shop-cycle, stair, camera and collision checks are retained.
- Regression tests check immediate room disposal, preservation of shared resources, live storefront people, instanced stock reuse and ten portal cache release cycles.
- Final local validation: 138 regression checks and three production runtime-package checks pass. Two legacy tests expecting the Barfly to sleep on the public counter were corrected to assert his implemented private-room sleep/wake routine. The browser harness bounds its full-animation clock exercise to three minutes; longer daily journeys are covered by deterministic simulation tests.

The accompanying GitHub Actions workflow runs Linux WebKit with an iPhone-like portrait viewport, repeated Sakura/izakaya entry and exit, day/night views, renderer counts, runtime exceptions and an indoor clock/journey check. Its report explicitly identifies a simulated browser, not a physical iPhone. See the workflow result and attached report for the outcome of that run.

The browser clock assertion reads `__JOHANSSON_POSE__.minutes`. Its first failed assertion read the absent `__JOHANSSON_AUDIT__.minutes` property; that was a harness error, not evidence of a frozen game clock. A direct test of the actual `advanceTown`/`simulate` functions confirms 7,200 indoor simulation ticks advance both the clock and resident controllers while player input is paused.

The browser home-arrival fixture uses Grandmother Sakurai. Jumping from midday to bedtime does not cancel a car/ferry journey already holding Tetsuo; asserting that he instantly completes that separate transport journey was not a valid isolated home-walk check. The browser report records the shore resident's actual location and clock advancement; transport remains part of the stated wider verification limit.
