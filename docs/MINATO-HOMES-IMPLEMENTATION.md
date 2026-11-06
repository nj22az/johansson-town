# Minato housing consolidation — implementation and verification

> **Superseded on 19 October 2026 by [CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md)** (the owner's cast, household and crew consolidation; its addendum wins). This document is kept as dependency evidence of the earlier design; where it names Johansson mayor, gives Grandmother Sakurai Sakura or a home, keeps Thuan a weekday room, or counts 31 residents and 23/24 households, the consolidation's 21 core and 5 supporting identities, 14 households and ten retirements are the plan of record (`src/people/roster.js`, `docs/cast-roster.json`). Corrections below are marked *(superseded …)*.

18 October 2026. Implementation follows PR #207, with Grandmother Sakurai in ground-floor Flat 2 and Ms Ganaha in upper Flat 4. This is the mobility exchange expressly allowed by the plan.

## Runtime changes

- `src/people/cast.js` remains the canonical 31-person cast. There are 23 occupied primary Minato households and one shared tropical primary household. No active vacant residential records remain on Minato. Duty accommodation is secondary, not an extra primary household.
- Chinen occupies 5 Kitahama. Sakurai occupies Flat 2. Nakandakari occupies Flat 3 and Ganaha Flat 4. Each flat has an Enter action and a furnished private room. Retained Nishi homes, Nakamura’s family flat, Shimabukuro’s flat, the doctor’s private east-wing accommodation and Barfly’s private room have explicit residential entrances and bedding. Established Front-Row, Kitahama family, harbour-office, police-box and houseboat accommodation is retained.
- Nakamura’s and Shimabukuro’s private rooms include an actual stairwell, floors, collision, visitor access and resident entry/exit routes. Upper Heights flats retain their exterior stair and corridor. A measured connector bridges the street raster and their upper doors in both directions.
- Home actors are borrowed from their existing street entities. Shared households have distinct sleeping positions. Canonical shore schedules cover home/work/school, rain shelter, school-free weekends, ferry relief weeks and clock wrap. Sakurai participates in the existing Sakura clerk rota from her new home. Tōma retains his existing postal round between home and post-office transitions. Barfly sleeps and has breakfast in his private room rather than on a bar stool.
- Johansson is chief engineer, keeps his existing tropical primary home with Thuan, and has the existing chief’s cabin as duty accommodation. Thuan retains her weekday room *(superseded 19 Oct 2026: dropped by the consolidation, phase 3)*. When playing Johansson, Nakandakari covers the operational engineering watch; a second visible Johansson is not spawned. The eight required working crew posts remain. The existing crew cabin identifies Nakandakari’s separate relief berth. He returns to his shore routine after duty.
- Sakura’s upper storey is an enterable main office with a supplier ledger, telephone, visitor seating, timber shelving and kitchenette with sink, cupboards, kettle and small fridge. Its old residential shell and laundry are removed. Its established rear stair is retained. The east and south outlooks use the existing live street renderer. The downstairs shop office, trading, stockroom and deliveries remain.
- *(Phase 4 of docs/CAST-CONSOLIDATION.md, 19 October 2026, removed eight more: 4, 5 and 6 Kitahama, the Kinjō and Ōshiro houses, 1 Front-Row Yard, the post-office shop-house and the Chinen house on Kitano-jima, with the Rainflower pavilion; the retired identities, the compaction and the cleared lots are recorded in `src/world/okinawa/lots.js` CLEARED_LOTS and `johansson-town/AGENTS.md`. The nine below are the housing project's own, not phase 4's.)*
- Five Kitahama houses (7, 9–12), Nakasone, Miyagi, Arakaki and Yonamine are removed from active geometry/layouts, household prompts and plot circuits. Arakaki and Yonamine have no active keepers or trade; their closed-business historical data is retained. Private dog-house/rental props and obsolete utility drops are removed. Existing ground and public lanes reclaim the plots without new attractions or decorative fillers.
- Stable tropical house/save identifiers remain. Housing migration invalidates only moved residents’ obsolete location/home caches, preserves business visits and unrelated progress, and redirects obsolete residential destinations. It is idempotent. Existing portrait subjects keep identical avatar recipes; three previously unauthored cast identities receive explicit recipes. Published guide copy and household metadata are synchronised.

## Checks performed

`tests/housing-consolidation.test.mjs` exercises occupancy, real registered entrance positions and standing collision, individual bedding, door-to-bed/table movement, schedule destinations, reachable office interactions, save migration, actual 60 Hz upper-flat residents travelling out and home, both directions of private stair traversal, nine cleared plots and consistent office outlook transforms.

`tools/check-housing-routes.mjs` builds the real town and checks 28 ordinary Minato home-to-work routes, sampling walking clearance and step heights. Johansson/Thuan’s established ferry commute and Fujita’s existing timber gangway/berth routine are covered by their established dedicated suites rather than this street-route script.

Focused suites cover the cast/directory, family and resident interiors, continuous life, light routines, ferry geometry/manning/tasks/crew walks, saves, Sakura budgets, the compact island, complete building/coastal circuits, and the iPhone startup/single-pass recovery safeguards. After incorporating PR #210, the final focused release command passed **130 tests, zero failures** across 27 relevant suites. `npm run build:runtime` and `tests/runtime-package.test.mjs` passed, including source-hash and compiled-asset checks. The build publishes 45 runtime files.

A full `npm test` run was attempted and stopped during the long-running unrelated avatar checks; it did not complete. Do not describe the whole legacy suite as passing. The focused release suites are the reported gate. Four older `neighbourhood-access.test.mjs` failures were reproduced on unchanged base main `c5e36e57`: an old garden connector intersects the park swing; an obsolete centreline crosses the 8 Kitahama plot; an old florist park-membership assumption; and a garden ground-height expectation. The housing work does not move those established roads or expand the shoreline. The Nakamura bench obstruction found by the architecture circuit check was corrected here by moving the existing bench clear.

Static town construction, before attaching animated character models or optional streamed detail, decreased from 2,915 to 2,845 meshes, 1,205,415 to 1,159,103 submitted triangles, and 923 to 815 colliders against base main with the same builder options. These CPU counts are not a device performance measurement. The final build also incorporates the Sakura shop refinements from PR #210.

## Verification limits

- No physical iPhone, Safari, desktop GPU view, touch-layout inspection or sustained-play device test was performed. Playwright browser installation failed in this environment.
- Office outlook transforms and compass directions are checked in geometry. Rendered seated/standing views over the actual surroundings still require visual inspection; they are not certified by the CPU tests.
- CPU traversal and avatar routines are not evidence of phone frame rate or GPU memory use. No new model, image or media downloads or framebuffer allocations are introduced. Preserve the existing iPhone recovery profile.
- Published guide photographs remain the existing curated set; this change does not claim newly rendered portrait photography for every canonical villager.

## Continuing the work

Use `MINATO-HOMES-PLAN.md` for the approved decisions and `minato-home-assignments.json` for the checked assignment inventory. Do not add another home for Thuan, move Johansson back into the town hall, restore retired houses or rebuild Kitano terrain. *(superseded 19 Oct 2026: continue from CAST-CONSOLIDATION.md, not from the assignment inventory below.)* Start the remaining visual/device review at Sakura’s rear stair and office, then inspect every numbered Heights doorway, both private residential stairs, sleep/wake, shop trading and ferry travel. Record actual device and browser results separately.

## Subsequent office access and lighting verification

The office now connects directly to the konbini through a continuous internal
stockroom stair; the outside stair was removed on 19 October 2026 for a fire escape. See
[SAKURA-INTERNAL-STAIRS.md](SAKURA-INTERNAL-STAIRS.md) and
`docs/qa/sakura-internal-stairs/` for the 60 focused/package checks, actual-input
up/down replay and reviewed daylight/midnight WebKit captures. This supplies
rendered office/stair evidence after the original housing implementation. Physical
iPhone Safari testing and the broader housing device review remain outstanding.
