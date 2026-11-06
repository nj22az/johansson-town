# Johansson World reference enhancement audit

## Current reconciliation — 18 October 2026

Audited source: main `6b9f5ea56d71e581355384e77ada0c4f987c7f55`. Confirmed that housing commit `dc3a15bbc5b3b5549bd4563cce3ebb48002b1459` is an ancestor. This addendum supersedes the occupancy, missing-office and next-worker instructions in the historical T01 snapshot below. Reference provenance and reuse requirements remain applicable.

**Decision: T02 implementation and prerequisite A are complete; T02 visual/device acceptance remains open.** The first incomplete task is acceptance of the existing office, not construction of another home or office. Keep T03 queued until T02's acceptance table in [REFERENCE-ENHANCEMENT-PLAN.md](REFERENCE-ENHANCEMENT-PLAN.md) closes. This review changes documentation only.

### Source verified now

- `src/people/cast.js::CAST`, `island-households.js` and `home-directory.js`: Sakurai's home is `kitahama-flat-2`, Ganaha's is `kitahama-flat-4`; Sakura remains Sakurai's workplace. Tests confirm 31 canonical villagers, 23 occupied Minato primary households, one shared tropical primary home, registered entrances and no active vacant Minato homes. The nine redundant dwellings are retired and their tested plots clear.
- `src/world/interiors/sakura-office-room.js::buildSakuraOfficeRoom`, `SAKURA_OFFICE`: authored office floor, walls/openings, desk and chair, visitor bench/table, ledger, telephone, shelves and kitchenette with sink, cupboards, worktop, kettle and fridge. No bedding. Layout returns an office spawn, bounds and exit; ledger, tea and outlook anchors are registered. The tea prompt is a read action; the telephone and storage are props, not appliance simulations. The visitor bench has geometry but no separately registered seating action in this builder; assess this against the required furniture use rather than assuming it is interactive. Do not claim additional interactions beyond those implemented.
- `src/world/thuan-flat.js::buildThuanFlat`: historical module name now owns the office shell and registered `sakura-office` entrance at `[-18.8,4.01,-26.66]`, plus two live street portals. `src/game.js::addRoomProps` dispatches that ID to the existing office builder; `streetFrontageOf` selects an outlook. The old instruction to add a separate upstairs contract is satisfied.
- `src/render/shop-street-view.js::mapShopCamera`: CPU checks map both portals from the seated desk to one physical observer at world y=5.13; normals face east/town and south/harbour. This confirms transforms, not actual visible scenery, occlusion or the seated framing.
- `src/save.js::migrateHousing`: revision 1 clears obsolete moved-resident location/home caches and canonicalises old home destinations without treating a shop visit as a residential move. Idempotence, unrelated shop/inventory/friendship data and tropical home preservation pass the housing fixture. Keep existing save keys and IDs. A real old-save gameplay/reload cycle remains unverified.
- `src/render/startup-recovery.js::graphicsProfile`, `drawingDpr`: iPhone/basic and explicit recovery retain no postprocess, no detail streaming, no shadows/native antialiasing, DPR cap 1 and 650,000 canvas pixels. Current main includes later cartoon/cel-shading work (#221); do not revert that work or increase framebuffer allocations to obtain office views.

### Checks actually performed in this reconciliation

From `johansson-town`:

```sh
node --test tests/housing-consolidation.test.mjs tests/runtime-package.test.mjs
# 14 passed; 0 failed
node --test tests/building-stairs.test.mjs tests/player-seating.test.mjs tests/save-safety.test.mjs tests/sakura-budget.test.mjs tests/shop-street-view.test.mjs tests/startup-recovery.test.mjs tests/single-pass-colour.test.mjs
# 29 passed; 0 failed
npm run build:runtime
# passed after npm ci --ignore-scripts supplied the checkout dependencies
node --test tests/runtime-package.test.mjs
# 3 passed; 0 failed (post-build)
```

The build's first attempt lacked `rollup`; dependency installation resolved it, and the runtime build succeeded (35 published files; Vite's large-chunk advisory remains). Build-only pruning of the previous cached runtime generation is excluded from this documentation change. No runtime behaviour was edited. These are focused checks, not a full `npm test` result. The housing implementation report's 130-test gate remains historical author evidence, not a count rerun here. See [MINATO-HOMES-IMPLEMENTATION.md](MINATO-HOMES-IMPLEMENTATION.md) for that gate and its documented unrelated legacy failures.

Housing tests exercise real builder collision/doors, bedding and CPU room walking, moved upper-flat outward/homeward routines, private residential stairs, reachable office prompts, migration and outlook transforms. `building-stairs` samples real town stair/landing clearance including Sakura. `player-seating` tests general avatar seat contact, not the office chair in a rendered scene. `shop-street-view` tests window render-state/parallax/clip handling, not a screenshot of this office. Do not turn these results into an end-to-end normal-control office walkthrough claim.

### Visual attempt and remaining acceptance

On 18 October 2026, opened `https://nj22az.github.io/johansson-town/` in available remote desktop Chrome (observed viewport 1363 × 936). The title UI appeared; Start Exploring displayed START FAILED and the message “The browser could not start the 3D graphics engine.” One Retry was attempted; subsequent start returned the same message. The screen was inspected visually. No office was entered, and no standing/seated office screenshot was obtained. The deployed build's exact source SHA was not established; this attempt does not replace local-source verification and does not diagnose a general website failure.

Outstanding: normal-control street/rear-stair/landing/door/office/exit route; actual harbour and town views from standing and seated camera positions; desk sit/stand and body/furniture contact at supported sizes; reachable interaction execution, visitor seating and clear windows/landing; moved residents' sleep/wake; downstairs trading and stockroom; legacy save/reload gameplay; phone viewport/touch layout; comparable GPU/resource and sustained-play measurements. **No physical iPhone Safari testing occurred.** Browser emulation, when performed later, must be recorded separately.

Next worker: refresh main, read this addendum, the housing implementation and T02's acceptance table. Use the existing `sakura-office` room in a working GPU browser. Record browser/device, viewport, build/source SHA and camera positions with standing/seated harbour and town captures; walk in/out and exercise existing office actions. Record failures precisely and fix only the demonstrated room defect. Finish mobile/save/shop checks before closing T02; then name T03's single domestic pilot before editing. Do not reconstruct Flat 2/4, reassign residents, recreate upstairs, restore retired plots or weaken Safari limits.

## Historical T01 snapshot — superseded implementation state

The remainder records the original inspection of `c5e36e578a3aa7ba6dea6b07a9cb89284edbfad9` before housing integration. Its present-tense source descriptions and prerequisite instructions are historical, not the current work queue. Use the current addendum and plan handover for continuation.

Date: 18 October 2026.
Task: T01 complete as a source and reference audit.
Audited main: `c5e36e578a3aa7ba6dea6b07a9cb89284edbfad9`.
Runtime edits: none. Rendered room acceptance, performance and physical-device stability remain unverified.

## Decision

Reuse the existing room, furniture, placement, save and Studio infrastructure. The first interior implementation remains Sakura upstairs. Its prerequisite is Grandmother Sakurai's completed replacement home, not merely a different registry label.

Sakura upstairs currently has an authored exterior, windows and external stair. The inspected room dispatcher gives `market` the ground-floor shop layout; it does not provide a separate upstairs office interior. Converting the exterior's appearance alone would not complete the task.

## Verified occupancy and prerequisite

Executing the extracted current cast and household modules established:
- 31 unique canonical residents; 39 home records.
- Minato: 22 occupied, 12 vacant, 2 retired records.
- `market` is still Grandmother Sakurai's home.
- Flat 1 houses Mr Higa Jr; Flat 2 houses Ms Ganaha; Flats 3 and 4 are vacant.
- `src/world/island-homes.js::buildIslandHomes` explicitly creates flat landmarks without promising authored interiors.

The housing plan proposes Sakurai in Flat 4, subject to measured stair suitability, with a possible Flat 2/Flat 4 exchange. This is still a proposal. The occupied Flat 2 must not be appropriated without completing Ms Ganaha's corresponding home and save/schedule transitions.

The cast also still describes Johansson as mayor and Nakandakari as chief engineer. These are pre-existing conflicts with the owner's instructions, to reconcile within the housing/ship-role programme rather than silently expanding an office decoration change.

**Historical next task (now completed by the housing implementation): T02 prerequisite A — Sakurai's replacement dwelling.** Confirm the route and unit choice first; then implement that one household move, including interior, bed, entry, schedule, directory and compatibility. Keep Sakura upstairs residential until the replacement works.

## Existing implementation owners

Paths below are relative to `johansson-town/`.

| Requirement | Existing owner | Reuse decision |
| --- | --- | --- |
| Furniture proportions | `src/world/furniture-standards.js::FURNITURE_HEIGHTS`, `setFurnitureSurface` | Reuse seat .46, table .72, low table .36, service counter .78 metre standards. |
| Small furniture catalogue | `src/build/home-furniture.js::HOME_FURNITURE`, `homeFurnitureFactory`, `HOME_CATALOGUE` | Seven pieces already exist: side table, tansu, low bookcase, andon, plant, cushion and rug. Reuse suitable pieces; no second catalogue. |
| Placement and passage checks | `src/build/placements.js::createPlacements`, `footprint`, `placementProblems` | Retain the existing validation path. General placement passage is 1.4 m; home arranging explicitly uses .78 m. Do not confuse them or weaken established route requirements. |
| Saved furnishing | `src/build/home-decorate.js::showHomeFurniture`, `createHomeDecorating` | Already persists position/yaw under `state.homeDecor.items`; restore accepts known IDs and caps at 40 items. Preserve saved IDs and validation. |
| Saved palettes/keepsakes | `src/progression/home-decor.js::restoreHomeDecor`, `setHomeDecor` | Three wall palettes, three textile palettes and four keepsake identities already exist. |
| Existing customisation target | `src/world/interiors/home-customization.js::createHomeCustomization` | Currently searches `Mayor’s home` and named meshes. It is not a universal all-resident room customiser. Do not rename those nodes without migration/integration review. |
| Domestic shell | `src/world/interiors/family-home.js::buildFamilyHome`, `FAMILY_HOME_LAYOUT` | Reuse its room contract, private spaces and sleep layouts. It delegates households containing Vy to `buildVyFamilyHome`; the domestic pilot must follow that branch. |
| Partitions and finishes | `src/world/interiors/house-plan.js::createPlanKit`, `materialCache` | Reuse door-gap/partition construction rather than inventing a room engine. |
| Shop entrance/runtime | `src/game.js::roomShell`, `addRoomProps`; `src/people/sakura-shop.js::createSakuraShop` | Preserve the persistent shop, shop collision and street-window representation. Add a distinct upper-floor contract in T02. |
| Ground-floor geometry | `src/world/interiors/sakura-shell.js::buildSakuraShell`, `SAKURA_SHELL`; `sakura-layout.js::SAKURA_LAYOUT` | Keep measured shop dimensions and collision in sync; no shop enlargement is required. |
| Small downstairs office | `src/world/interiors/sakura-cheer.js::BACK_OFFICE`, `buildSakuraCheer`; `sakura-life.js::buildSakuraLife` | Desk, chair, ledger, lamp, office door and mini fridge already exist. Preserve them as the complementary office. Private helper geometry can be extracted only if needed by the upper room. |
| Backroom | `src/world/interiors/sakura-backroom.js::buildSakuraBackroom` | Preserve stock racks, delivery paths and existing interactions. |
| Office reference geometry | `src/world/interiors/office-workplace.js::buildOfficeShell`, `buildOfficeWorkplace` | Existing period desk/equipment, filing and seat patterns are useful. Do not instantiate the whole harbour office upstairs: it includes its own resident, private bed and unrelated harbour actions. |
| Upper exterior and stairs | `src/world/okinawa/old-town.js::SAKURA_BOX`, private `dressSakura`; `okinawa/stairs.js::stairFlight`, `stairLanding` | Retain footprint/stair identity. New office must reconcile shell openings, interior entry and real sightlines. |
| Occupancy/directory | `src/people/cast.js::CAST`; `island-households.js::ISLAND_HOUSEHOLDS`, `householdAtHome`; `home-directory.js` | Change connected identity, entry and schedule data together during Sakurai's move. `market` also identifies the shop; do not globally replace it. |
| Studio props | `src/studio/prop-registry.js::PROP_REGISTRY`, `buildProp`, `propPurpose` | Reuse purpose/source/build registration. Extend only for newly shared props that the completed room needs. |

## Authored dimensions and integration risks

These are code-derived coordinates, not rendered or surveyed clearances:
- `SAKURA_BOX`: x -18.45..-7.45, z -34.43..-20.17; roof y 4.01.
- Upper exterior in `dressSakura`: x -18.30..-8.50, z -33.93..-20.67. Gross envelope 9.80 × 13.26 coordinate units; vertical extent 2.70 above roof. Slab and wall thickness reduce usable space. Verify the kit's world transform before treating this as an interior floor plan.
- External stair centre x -19.30, z -34.13..-27.41; run 6.72, rise 4.01 in the authored coordinates. Landing extends z -27.41..-25.91; door is near x -18.47, z -26.66.
- Street-facing glazing is on the upper shell's east side at z -31.4 and -23.2, with a terrace door near -27.3. These are candidates for outlooks, not proof of harbour/town visibility.
- Shop shell uses its own local frame: west/east x ±6.86; front z 3.91; back z -6.86; ceiling 2.98. Do not mix its local coordinates with the upper exterior coordinates.
- Small office desk is at local x 6.4, z -2.7, .70 × 1.20, top .74. Its current top differs from the shared .72 table standard; preserve the existing office while deliberately selecting the new upstairs standard.

T02 must verify an actual stair-top entrance, spawn/exit, floor/collision, camera treatment and windows showing the surrounding town. The exterior upper volume is currently built with a solid block, so transparent window panels alone cannot establish views through the interior wall. Decide how to form real wall openings and integrate the room with the exterior before placing the desk.

Keep office-only seating and controls separate from the existing harbour master's staff actions. Provide a kitchenette, not an additional restaurant simulation.

## Workbook provenance for selected references

Workbook: https://docs.google.com/spreadsheets/d/18nNVMXyrPFj3Ta_4_fQIKTVhj9OcjQli47Pb-fwQ2B4/edit

Tab: `Interior sets`. Column B is name; C is the first image formula. Exact formula URLs use `https://raw.githubusercontent.com/ltdimages/images/refs/heads/main/` followed by:

| Reference | Name / image cells | First image | Selected use |
| --- | --- | --- | --- |
| Office | B76 / C76 | Room_Style_Office00.png | Desk/storage grouping; restrained office palette. |
| Kitchen | B60 / C60 | Room_Style_BigFlower00.png | Continuous counter, cookware and grouped storage; adapt the strong palette. |
| Shōwa-Era Nostalgia | B88 / C88 | Room_Style_Japanese00.png | Domestic storage, low furniture and fan; later homes. |
| Natural Wood | B70 / C70 | Room_Style_SmallFlower00.png | Coordinated timber storage and dining furniture. |
| Food Mart | B39 / C39 | Room_Style_Market00.png | Later merchandising rhythm; existing products and commerce stay authoritative. |
| Bathhouse | B9 / C9 | Room_Style_PublicBath00.png | Later repeated wash stations and tile palette. |

Use these as visual references for original assets. Do not add their image URLs to runtime startup. Variant availability is not a requirement to import every colour.

## Stability and concurrent work

PR #206 merged 18 October at 04:27 UTC: colour recovery and Nakamura counter/family stairs. PR #208 merged at 07:45 UTC: planting consolidation and coast-support checks. Their reported checks are prior author evidence, not tests rerun by this audit.

Source inspection confirms the legacy east-lawn treeline is retired. Street furniture still uses authored chain runs and obstacle/road exclusions; this review does not establish that every outdoor placement is supported. Do not reopen the retired treeline work or claim all offshore defects fixed.

The current graphics policy makes iPhone/basic mode single pass: postprocessing and detail streaming disabled, no shadows/native antialiasing, DPR cap 1 and a 650,000-pixel canvas limit. `game.js::buildInk` respects the policy. Preserve it.

Open-PR inventory includes #103 Sakura density, #125 cooler, #155 bathhouse, #172 harbour/boardwalk and #152 browser smoke. Their titles identify possible overlap only; inspect actual diffs before implementation, and do not merge old branches as dependencies. No open PR in the fetched list explicitly implements the new upstairs office or Sakurai move. Main content remains the baseline.

## Verification and handover

Performed:
- Source review of room dispatch, upper exterior/stairs, furniture/placement/save/customisation, households, directory, Studio registry and graphics policy.
- Node assertions passed against extracted source modules: 31 unique cast identities; 39 home records; Sakurai at market; Flat 4 vacant; iPhone postprocessing/detail streaming disabled; canvas budget retained.
- XLSX XML/formula inspection verified the six exact reference rows above.
- Current open PR inventory and #206/#208 merge state checked.

Not performed: production build, full game tests, a running game walkthrough, save migration, actual stair route tests, rendered screenshots, draw-call/resource baseline, physical iPhone Safari. Only documentation changes result from T01; these runtime acceptance checks belong to the implementation tasks. No GPU browser was launched for this audit.

Superseded T01 handover (do not execute; see current addendum): start T02 prerequisite A by inspecting `KITAHAMA_FLATS`, its stair/door geometry and actual room dispatch, with the Sakurai fallback in MINATO-HOMES-PLAN.md. Record the unit decision and baseline before changing occupancy. Complete that one move before converting Sakura upstairs. Do not start T03 while this dependency remains unresolved.
