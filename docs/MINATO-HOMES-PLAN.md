# Minato homes: occupied households, no surplus empty houses

> **Superseded on 19 October 2026 by [CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md)** (the owner's cast, household and crew consolidation; its addendum wins). This document is kept as dependency evidence of the earlier design; where it names Johansson mayor, gives Grandmother Sakurai Sakura or a home, keeps Thuan a weekday room, or counts 31 residents and 23/24 households, the consolidation's 21 core and 5 supporting identities, 14 households and ten retirements are the plan of record (`src/people/roster.js`, `docs/cast-roster.json`). Corrections below are marked *(superseded …)*.

Status: runtime implementation, 18 October 2026. See [MINATO-HOMES-IMPLEMENTATION.md](MINATO-HOMES-IMPLEMENTATION.md) for performed checks and outstanding visual/device verification. The ordered plan below records the approved scope; it is not evidence that unperformed device tests passed.

## Owner decisions

Minato remains the compact urban port island. Every ordinary villager needs a real home there; surplus empty houses are unnecessary. Reuse suitable existing homes before considering construction. Keep streets, coastal walking circuits, working businesses, Harbour Park, Umi-no-yu and port/ferry operations intact.

Johansson is the ship's chief engineer, with a cabin aboard. Johansson and Thuan's main home remains together on the separate tropical island. ~~Thuan also keeps her room with Thao and Chin at 1 Kitahama.~~ *(superseded 19 Oct 2026: the weekday room is dropped; kitahama-1 is purely Thao, Chin and Vy.)* These are explicit exceptions to a rule that every primary home must be on Minato.

Sakura's upper floor becomes the **main office with a kitchenette and views over the port and town**, not residential accommodation. The tiny existing ground-floor office remains a complementary room for till work, quick administration and immediate shop supervision. ~~Grandmother Sakurai must receive another actual home; changing the room label alone would leave her homeless.~~ *(superseded 19 Oct 2026: Grandmother Sakurai retires and Thuan owns Sakura outright.)* Do not rebuild or expand the tropical island to implement this plan.

## What the current repository establishes

The audited base is main `e1b606d50a58d5c5fab0781e590fe773bb3472fd`. PR #206 adds Nakamura's separate family entrance and stairs without changing the cast or housing assignments.

- `src/people/cast.js` defines **31 villagers**. Every one has a primary home ID; this does not establish that every entrance, interior or bedtime routine works.
- `src/people/island-households.js` contains 39 home records: 36 labelled Minato and 3 Kitano. Minato has 22 occupied records, **12 vacant records** and 2 retired save identities. Thuan is counted at both the tropical primary home and her Minato weekday room.
- Johansson, Thuan and Grandmother Chinen currently have Kitano primary-home records. Chinen moves to Minato; Johansson and Thuan retain their shared tropical primary home as requested.
- Sakura currently assigns Grandmother Sakurai to `market`. The ship currently assigns the chief-engineer role/home to Mr Nakandakari. Both conflict with the owner's latest decisions.
- The two occupied Kitahama Heights flats have measured door approaches, but `src/world/island-homes.js` expressly stops short of promising authored interiors. A labelled map pin is not a completed dwelling.
- `src/world/kitano-hamlet.js` uses the airport island's world transform for the existing Johansson/Thuan house. Preserve that existing home and save identity; verify its actual entrance rather than adding another island house.
- The 12 current Minato vacancies are 5/7/9/10/11/12 Kitahama, Flats 3/4, Nakasone, Miyagi, Arakaki and Yonamine. Tamaki/Kamiya are retired records, not two more houses to demolish.

Sources of geometry and behaviour also include `kitahama-layout.js`, `okinawa/layout.js`, `architecture-plan.js`, `people/home-directory.js`, `people/home-residents.js`, `people/neighbours.js` and the ferry crew modules. The canonical 31-person cast is the initial scope; reconcile actual spawned residents against it so visitors, alias characters and procedural background actors cannot silently become homeless villagers.

## Proposed final household assignments

*(superseded 19 Oct 2026: the plan of record is the 14 households of CAST-CONSOLIDATION.md §7; this table records the 18 October state the consolidation starts from.)*

Keep established family relationships and primary homes wherever possible. All rows except the tropical household are Minato addresses, including Fujita's established harbour home.

| Home | Primary occupants | Work to complete |
| --- | --- | --- |
| Existing tropical home (`kitano-1`) | Johansson, Thuan | Keep the home; remove stale mayor-only labels and cross-check its ferry/home route. |
| 1 Kitahama | Thao, Chin, Vy | Keep Thuan's separate weekday room; preserve the family sleeping places. |
| 2 Kitahama | Mrs Sato | Retain and verify the home/ramen routine. |
| 3 Kitahama | Kōji, Riku | Retain both sleeping places and school/port routes. |
| 4 Kitahama | Postman Tōma | Retain and verify the postal round/home route. |
| 5 Kitahama | Grandmother Chinen | Occupy this existing vacant ground-access house; provide an age-appropriate interior and clear walking route. |
| 6 Kitahama | Ferry master (legacy name `Bus driver`) | Retain; do not turn him into Johansson's engineering role. |
| 8 Kitahama | Ms Uezu | Retain her shore home and work-week duty berth. |
| Kitahama Heights, Flat 1 | Mr Higa Jr | Retain; author a usable room behind the measured door. |
| Kitahama Heights, Flat 2 | Grandmother Sakurai | Ground-floor exchange used for level daily access. |
| Kitahama Heights, Flat 3 | Mr Nakandakari | Occupy this existing vacant unit; retain an engineering colleague/relief role and suitable duty berth. |
| Kitahama Heights, Flat 4 | Ms Ganaha | Occupied upper unit with its measured exterior stair route. |
| Higa house | Miss Higa, Grandmother Higa | Retain both occupants and their own sleeping places. |
| Kinjō house | Mrs Kinjō | Retain; verify the florist/home route. |
| Ōshiro house | Mr Ōshiro | Retain; verify the boatyard/home route. |
| 1 Front-Row Yard | Nhung, Reiko | Keep the established shared home; do not casually rewrite family arrangements. |
| 2 Front-Row Yard | Tetsuo | Retain and verify the workshop/home route. |
| Above Nakamura Zenzai | Mrs Nakamura, Mai | Keep PR #206's family entrance/stairs; complete the real flat, beds and Mai's school/home transition. |
| Above the post office | Mr Shimabukuro | Add/verify a separate residential door, stair and actual flat. |
| Harbour Office residence | Harbour master | Keep genuine private sleeping space separate from public operations. |
| Town Hall Clinic flat | Dr Kakazu | Keep genuine private accommodation separate from treatment areas. |
| Police Box residence | Officer Mori | Retain the private living space and work access. |
| Minato Izakaya home | Barfly | Verify an actual private room; a bar stool is not a bed. |
| Shiosai houseboat | Mr Fujita | Preserve his occupied harbour home, wooden access and shed/berth routine. |

This accounts for **31 primary residents**, in **23 occupied Minato households plus one shared tropical household**. Johansson additionally has a ship cabin; Thuan additionally has her room at 1 Kitahama. Neither secondary accommodation creates a second primary household.

The accompanying `minato-home-assignments.json` lists every person and proposed primary/secondary home explicitly. It is planning data, not an imported runtime registry.

Grandmother Sakurai's proposed Flat 4 is upstairs. If stair verification reveals that the route is unsuitable, exchange her assignment with Ms Ganaha's ground-floor Flat 2, updating both units together. This uses the same two occupied flats and creates no additional housing. This is a measured access decision, not permission to improvise a new building.

## Buildings and units to remove or repurpose

Allocate 5 Kitahama and Flats 3/4 first. The remaining nine vacant Minato dwelling records have no proposed occupants:

| Existing dwelling | Proposed treatment |
| --- | --- |
| 7, 9, 10, 11 and 12 Kitahama | Remove the five redundant houses, private walls, gates, empty-home prompts and residential props. Keep the public lane and coastal connections. |
| Nakasone and Miyagi houses | Remove the two unoccupied houses and their private enclosures. Keep surrounding public access. |
| Arakaki and Yonamine shop-houses | Both trades are recorded as closed and the flats vacant. Audit story/prop uses, then remove these unused mixed-use buildings rather than preserve empty homes as scenery. Retain historical business/save aliases without routing players into removed buildings. |
| Sakura upper floor (`market`) | Convert the existing upper floor into the shop office and kitchenette. Remove home/sleeping registration there after Grandmother Sakurai moves. The ground-floor shop, stockroom and deliveries remain operational. |
| Existing ferry chief's cabin | Assign to Johansson as duty accommodation; separate Mr Nakandakari's relief-engineer identity/berth. Do not add a second chief-engineer cabin or remove required crew posts. |

Nine is the proposed count of redundant dwelling/building records, subject to the physical/non-residential audit; it is not a demolition already performed. Removed ground should become a modest continuation of existing paving or planting. Do not fill it with new attractions, roads, decorative clutter or placeholder houses. Keep the current compact shoreline: this is a housing consolidation, not another island expansion.

## Ordered implementation and verification

1. **Reconcile resident identity and occupancy.** Compare `CAST`, households, all spawned villagers, crew, directory records and story aliases. Apply the owner's chief-engineer/home decisions and the explicit assignment table to one canonical source. Migrate `market`, old chief-home and Chinen save references. Verify exactly 31 unique canonical villagers, one primary household per person, named occupants for every active Minato dwelling and no contradictory chief-engineer identity. Keep off-duty island travel optional rather than forcibly relocating the player.
2. **Make existing homes real.** Complete 5 Kitahama, the four occupied flats and retained shop/workplace residences: doors, clear approach, stairs where required, interior, sleeping place and privacy. Complete Johansson's existing cabin assignment and Thuan's room. Verify street-to-door-to-bed routes, collision at actual foot height, door swings, ceilings and night lighting. Give elderly residents measured access, not a nominal map pin.
3. **Convert Sakura's upper floor.** Keep the tiny ground-floor office as a complement to the real office upstairs. Make the upper room comfortable and deliberately oriented to the port and town: place the main desk by a genuinely visible harbour outlook, retain a second town-facing sightline, add modest visitor seating and warm timber shelving, and keep the window fronts free of tall storage. Use period-appropriate furniture, a telephone, ledgers and restrained blinds rather than generic filler. Verify the views from the seated desk and standing window positions against actual rendered surroundings; a window facing a blank wall does not meet the requirement. Use the retained stairs and a small kitchenette: sink, worktop, cupboards, kettle and modest fridge. Make the fittings useful for shop work/breaks and compatible with 1997 Okinawa. Preserve downstairs trading and delivery routes. Verify no resident still attempts to sleep upstairs and every kitchen/office interaction is reachable.
4. **Connect daily life.** Residents leave home, reach their actual work/school, close up and return via their own doors. Synchronise walking actors, neighbours, ferry crew, home lights and directory locations. Update dialogue, biographies, relationship text and storyteller scenes that call Johansson mayor or put Grandmother Sakurai above Sakura. Verify weekday/weekend, rain, closing time, overnight clock wrap, sleep/wake and save/reload transitions. A scheduled hidden NPC or text saying “at home” is insufficient evidence of a traversable route.
5. **Remove the audited surplus.** Only after replacement households work, delete redundant meshes, foundations, walls, colliders, lights, signs and empty residential prompts. Remove obsolete plot detours from architecture/street geometry and map/navigation destinations. Preserve compatibility aliases without leaving active empty houses. Verify no orphan geometry, route targets or stale “to let” dwellings; preserve working commerce, ferry access, all retained building circuits and the continuous coastal walk.
6. **Rebuild and inspect.** Run focused cast/household, collision, navigation, stairs, schedule, shop and save-migration checks, then runtime build and packaging checks. Inspect every retained entrance at pedestrian level and the consolidated blocks from above, desktop and touch layouts. Test physical iPhone Safari for launch, sustained play, shop use, stairs, sleep/wake and ferry travel. Preserve the single-pass resource limits; measure any asset increase. Publish only after checks pass and record unavailable visual/device checks honestly.

## Completion criteria

- 31 known villagers reconciled; 29 primary residents on Minato and Johansson/Thuan sharing their tropical primary home.
- 23 occupied Minato households, no active vacant residential units; explicit secondary rooms/cabins for actual users only.
- Every retained home has a reachable entrance, a functional private interior and sufficient sleeping places for its household. A family may share a home; do not build one house per character.
- Sakura upstairs is a comfortable main office/kitchenette with verified port and town views; its tiny downstairs office remains complementary. Grandmother Sakurai has moved into a completed home.
- Johansson is chief engineer across game, ship, directory and story data. Mr Nakandakari remains a purposeful engineering colleague, not an unexplained competing chief.
- Removed residences leave no walls, slabs, collision boxes, lit phantom windows, home prompts, navigation detours or broken save targets.
- Compact Minato coastline, working port and ferry, Harbour Park, Umi-no-yu, retained street hierarchy and the separate tropical island remain intact.
- Build/tests pass; visual and physical-device evidence is recorded separately from CPU geometry checks.
