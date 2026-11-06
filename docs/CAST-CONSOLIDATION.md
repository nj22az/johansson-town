# JOHANSSON WORLD — CAST, HOUSEHOLD AND CREW CONSOLIDATION

Implementation brief for a coding agent. Prepared 19 October 2026 by the owner. Adopted as the plan of record the same day, with the addendum at the end (the owner's later rulings, which win where they differ from the body).

## Later owner decision — 31 October 2026

The owner retired Emi and Mai Nakamura and prioritised facilities before further population. The live registry now has **18 core + 5 supporting identities, 13 retired identities and 12 core households**. The retained dessert/ice-cream premises are vacant and closed; the former family home is no longer an occupied address. Civic services and the clinic remain. Historical recipes and existing creative assets remain available. No replacement resident, staff assignment or friendship is implied. Current implementation and save compatibility: [room-crash/family handover](../briefs/HANDOFF-ROOM-CRASH-FAMILY-2026-10-31.md). The dated audit and original plan below remain historical context; this ruling supersedes their active Nakamura-family entries and totals.

## 1. TASK AND AUTHORITY

Implement a smaller, coherent population and a more compact town in https://github.com/nj22az/nj22az.github.io, project directory `johansson-town/`.

Use the final roster and decisions below. Preserve the Okinawa 1997 setting, existing families, established player progress, working ships, useful shops and good visual quality. Give people several compatible responsibilities across a credible schedule. A job does not require its own separate resident, house or building.

Read the current root AGENTS.md and CLAUDE.md, then johansson-town/AGENTS.md and applicable directory instructions. The owner's newer decisions in this brief supersede conflicting older character, ownership and housing descriptions. Reconcile older documentation rather than implementing two competing plans.

Inspect current main before changing anything. The source audit informing this brief inspected main tree 00402b65aedf4a495c7699fc36040c9a539609ba. This is a dated baseline, not an instruction to reset the repository. Preserve subsequent unrelated improvements.

Produce the implementation and evidence, not only another plan. Work in coherent, reviewable changes and report the resulting branch/commit or PR.

## 2. AUDITED FINDINGS — CURRENT SOURCE, NOT ALREADY IMPLEMENTED CHANGES

The audited source has:
- 31 registered core residents.
- 24 occupied primary households for that cast: 23 on Minato and the Johansson/Thuan household on Kitano-jima.
- Thuan also has a weekday room at 1 Kitahama. Nils and his relief engineer have duty accommodation aboard.
- Four ferry crew identities outside the core register: chief officer, deckhand, purser and cook-steward.
- One further role-only Kitano shore linesman.
- Eight distinct working posts in the existing ferry manning plan. Treat this as the game's existing operational design, not a verified statutory minimum.
- Nhung living with Reiko at 1 Front-Row Yard, while her husband Koji and son Riku live at 3 Kitahama.
- Four occupied Kitahama Heights flats. Removing the proposed occupants of Flats 1 and 2 does not empty the block: the relief engineer and ticket clerk occupy Flats 3 and 4.
- A private Barfly room inside the active izakaya and Shimabukuro's residence above the active post office. These are not standalone houses.
- Several houses already removed by the previous housing project. Do not count historical removals as new work.

The new target is:
- 21 core residents.
- Five existing supporting crew/pier workers given proper identities.
- 26 retained character identities in this scope, including Nils/the player; supporting workers are not new hires.
- 14 primary households for the 21-person core cast: 13 Minato households and one shared Kitano household.
- Supporting crew accommodation accounted for separately and honestly.
- Ten retired core identities and six additional standalone Minato house removals.

These counts describe this scope. Do not invent an overall world population or treat visiting cargo crews as resident households.

## 3. FIXED OWNER DECISIONS

- Thuan owns and runs Sakura outright: purchasing, accounts, stock, shop and supply business.
- Chin has NO Sakura clerk, till, stock-cover or relief-shopkeeper duties.
- Chin is a motorman aboard the ship and a repairman at the workshop with Tetsu when ashore.
- Tetsu remains Chin's workshop partner and the electrician for shipboard and island electrical work.
- Fujita becomes the ferry master, displayed as Fuji. He never drinks on duty and is sober when taking a watch. Drinking, tipsy behaviour and beer props belong only to his off-duty life.
- Fuji retains Shiosai as his home and his shed/television identity. His evening routine begins after he signs off, not at a fixed time that overlaps sailings.
- Nils is chief engineer, not mayor. His main home is with Thuan on Kitano-jima; his cabin aboard is duty accommodation.
- Keep the town compact. Removing houses must also remove obsolete private enclosures and unnecessary street sprawl.
- Preserve visual quality and the current standard rendering path. Do not introduce a phone-only low-detail art style as part of this work.

## 4. FINAL CORE ROSTER — 21 PEOPLE

Use short display names. Keep stable machine IDs distinct from names and provide explicit old-name aliases.

| Display name | Previous identity | Role and continuity |
|---|---|---|
| Nils | Johansson | Player; Swedish chief engineer; married to Thuan. |
| Thuan | unchanged | Vietnamese; owns Sakura; Nils's wife; sister of Thao and Nhung. |
| Thao | unchanged | Runs Minato Izakaya; Chin's wife and Vy's mother. |
| Chin | unchanged | Motorman; mechanical repairman; workshop partner of Tetsu; Thao's husband and Vy's father. |
| Vy | unchanged | Their daughter; school pupil; retain age 11. |
| Nhung | unchanged | Eldest sister; runs Front-Row Books and produces a modest local paper; Koji's wife and Riku's mother. |
| Koji | Kōji | Fisherman and relief bosun; Nhung's husband and Riku's father. |
| Riku | unchanged | Their son; school pupil; retain age 9. |
| Yui | Miss Higa; historical aliases Mrs Higa/Yonamine-sensei | Japanese schoolteacher; Gran Higa's granddaughter; helps at the bathhouse after school and at weekends. |
| Gran Higa | Grandmother Higa | Bathhouse owner and daytime keeper; retains Higa Liquor and family/community ties. |
| Tetsu | Tetsuo | Japanese electrician; workshop partner of Chin; maintains ship electrical equipment, bathhouse equipment and island electrical systems. |
| Aki | Mrs Sato | Japanese ramen-shop owner; the business remains Sato Ramen. |
| Mori | Officer Mori | Japanese police officer; retains police accommodation and patrols (see addendum: the police station). |
| Dr Ken | Dr Kakazu | Japanese island doctor; retains private accommodation separate from the clinic. |
| Emi | Mrs Nakamura | Japanese dessert-counter/community-kitchen operator; Mai's mother. |
| Mai | unchanged; historical alias Nakamura Mai | Emi's daughter and school pupil; retain age 10. |
| Fuji | Mr Fujita | Japanese ferry master; Fujita remains his surname; lives on Shiosai. |
| Jack | Harbour master | Replace with Jack Reed, an American former merchant seaman and long-term resident; harbour agent handling berth communications, freight and Minato shore-side mooring work. |
| Mac | Mr Nakandakari | Replace with Mac Turner, an older American relief engineer and established island resident; retains the former engineer's shore flat and separate duty berth. |
| Nao | Ms Uezu | Japanese bosun; retains shore home and credible relief rota. |
| Mika | Ms Ganaha | Japanese port clerk; combines passenger tickets, parcels and postal counter. |

Jack and Mac replace existing identities. Give them coherent biographies and links to retained residents. Preserve their associated role/home progress through explicit migration. Do not add unlisted spouses, children, houses or businesses to justify their backgrounds.

Keep existing authored avatar assets wherever suitable. Make any necessary nationality/biography or appearance changes deliberately within the established avatar system. Preserve the recognisable leading women, children, Fuji and player identity.

## 5. SUPPORTING WORKERS — FIVE EXISTING ROLES, NOW NAMED

| Display name | Existing role | Accommodation |
|---|---|---|
| Ryo | Generic Chief officer | Existing officer accommodation aboard. |
| Ren | Generic Deck hand | Existing crew accommodation aboard. |
| Aya | Generic Purser | Existing crew accommodation aboard. |
| Jun | Generic Cook-steward | Existing crew accommodation aboard. |
| Kai | Generic Kitano line hand | Existing Kitano shore worker; resolve suitable real accommodation as described in section 10. |

Give these people stable identity records, individual existing-system avatar recipes and usable biographies. They must not remain duplicate anonymous bodies alongside their named replacements.

Distinguish residency categories, primary homes and duty berths so a shipboard worker does not cause the ordinary-villager housing code to invent a shore house. Their lives can remain simpler than the central families, with meaningful work, rest and some shore activity.

## 6. RETIRE THESE TEN CORE CHARACTERS

| Old identity | Transfer of purpose | Former home |
|---|---|---|
| Bus driver / former ferry master | Fuji becomes master | kitahama-6. |
| Mr Higa Jr | Chin occupies the motorman/engine-room rating post | kitahama-flat-1. |
| Grandmother Sakurai | Thuan owns Sakura | kitahama-flat-2. |
| Grandmother Chinen | Retain only compatible family history for Tetsu | kitahama-5. |
| Postman Tōma | Mika runs tickets and postal/parcel collection at the port | kitahama-4. |
| Mr Shimabukuro | Chin handles mechanical work and Tetsu electrical maintenance | shimabukuro, above the former post office. |
| Mr Ōshiro | Koji fishes independently; Chin handles boat repairs; Fuji retains old-seaman stories | oshiro. |
| Mrs Kinjō | Sakura supplies flowers and decorations | kinjo. |
| Barfly | Existing residents, including Fuji, provide izakaya regulars and gossip | izakaya private residence. |
| Reiko | Nhung takes on a smaller local paper alongside the bookshop | resident-home-aya, 1 Front-Row Yard. |

Retirement means removing active spawns, schedules, home occupancy, shop staffing, directory entries and scenes that require their physical presence. Historical mentions may remain when coherent.

Do not blindly turn every retired person into their replacement. In particular, Fuji must not inherit the old captain's home as well as Shiosai, and Chin must not acquire Higa Jr's flat or Higa family relationships. Migrate progress according to its meaning: business/service state, household state and personal relationships are different things.

Remove or rewrite relationship pairs and stories that depend on retired people. Avoid self-relationships, accidental marriages, resurrected actors or romance inherited from an unrelated replacement.

## 7. FINAL CORE HOUSEHOLDS — EXACTLY 14

Retain adequate distinct sleeping positions, private access and usable interiors.

| Primary home / stable identity | Core occupants |
|---|---|
| kitano-1 | Nils and Thuan. |
| kitahama-1 | Thao, Chin and Vy (see addendum: Thuan's weekday room is dropped). |
| kitahama-3 | Nhung, Koji and Riku, reunited as one household. |
| higa | Yui and Gran Higa. |
| resident-home-kenji / 2 Front-Row Yard | Tetsu. |
| kitahama-2 | Aki. |
| koban | Mori (see addendum: inside the new police station). |
| office / Harbour Office residence | Jack. |
| clinic / doctor's private flat | Dr Ken. |
| nakamura / above the dessert business | Emi and Mai. |
| kitahama-flat-3 logical identity | Mac, in one of the two retained ground-floor homes after redesign. |
| kitahama-flat-4 logical identity | Mika, in the other retained ground-floor home after redesign. |
| kitahama-8 | Nao. |
| fujita-houseboat / Shiosai | Fuji. |

Shipboard duty accommodation does not add extra primary core households. Preserve Nils's chief's cabin and Mac's separate relief berth.

Nhung must actually move home: update her route, meals, sleeping place, belongings, directory and save migration. Preserve her friendship with retired Reiko only as compatible backstory, not an active shared tenancy.

## 8. HOUSES AND BUILDINGS

Remove these SIX additional standalone Minato houses:
- 4 Kitahama: kitahama-4.
- 5 Kitahama: kitahama-5.
- 6 Kitahama: kitahama-6.
- Kinjō house: kinjo.
- Ōshiro house: oshiro.
- 1 Front-Row Yard: resident-home-aya, after Nhung moves.

Remove each building's redundant foundations, private walls, gate, nameplate, utility drops, lights, washing lines, residential props, colliders and interaction anchors. Audit shared geometry before deletion. Preserve neighbouring workshop/bookshop access, public lanes and coastal connections.

Compact the remaining blocks and street frontage. Do not leave six fenced empty plots, duplicate pocket parks, long dead-end lanes or placeholder houses. Preserve Harbour Park, Umi-no-yu, existing shoreline and the town's character. Reposition retained entrances/routes consistently wherever frontage moves.

Kitahama Heights:
- Two core households remain: Mac and Mika.
- Reduce the four-flat block to two useful ground-floor homes, removing the redundant upper residential storey and stair/corridor geometry (see addendum: two attached ground-floor houses).
- Retain the logical home IDs kitahama-flat-3 and kitahama-flat-4 for migration compatibility; display the two new units with clear names.
- Retire the old logical units kitahama-flat-1 and kitahama-flat-2. Numeric historical IDs must not be confused with new visible door numbers.
- Verify both real door approaches, bedroom/dining access, collision, lights, map locations and resident routes. Do not retain two empty speculative flats.

Mixed-use buildings:
- Preserve Minato Izakaya. Retire Barfly's residential registration and integrate any released room sensibly into the existing business.
- Preserve Sakura, its warehouse/depot role, upstairs main office, kitchenette and internal stair. Its ownership changes; it does not become residential accommodation.
- Move postal/parcel services into Mika's port counter. Once transferred and Shimabukuro is retired, remove the former post-office shop-house (see addendum).
- Preserve Emi's dessert business and her shared home with Mai.
- Preserve the working power station, fish/ice facilities and useful boat-repair facilities; removing an operator does not remove required infrastructure.
- Remove the redundant florist pavilion after transferring sales/supply to Sakura (see addendum). Preserve adjacent Blue Coral access and existing shared pedestrian routes.

Historical removals already completed include 7/9/10/11/12 Kitahama, Nakasone, Miyagi, Arakaki and Yonamine. Verify the current source and do not claim these as fresh removals.

## 9. WORKING SHIPS, PORT AND SCHEDULES

Preserve eight separate onboard posts in the current game design:
Master: Fuji. Chief officer: Ryo. Chief engineer: Nils, with Mac providing relief. Motorman: Chin, replacing the previous oiler identity. Bosun: Nao, relieved by Koji on the existing appropriate rota. Deckhand: Ren. Purser: Aya. Cook-steward: Jun.

Map the existing oiler post key to Chin/the motorman through a deliberate compatibility layer or a complete post migration. Do not break machinery tasks, scenarios or safe-departure checks by changing a label.

One actor cannot occupy two simultaneous stations. Retain separate forward/aft deck work, bridge/machinery duties and the ship-to-shore line handoff.
- Jack covers Minato's former Fujita shore-line duties and berth communications. Provide an actual walking route and sensible radio/office behaviour.
- Kai remains at Kitano when required for shore lines.
- Mika stays ashore for tickets/post; Aya remains the sailing purser.
- Aki stays ashore at Sato Ramen; Jun remains the regular cook-steward.
- Tetsu is a workshop/contract electrician, not permanently added to the sailing crew.
- Chin's workshop work fits between assigned watches or on shore/off-duty periods. Tetsu can staff the workshop during Chin's ship duties; closures are preferable to duplicate staff bodies.
- Mac covers the player's engineering absence through the existing supported mechanism. Do not spawn a second Nils when the player is exploring.
- Nao/Koji's relief must not leave the deckhand post vacant or put Koji fishing and aboard simultaneously.
- The audited ship working day extends roughly 06:25–22:15; inspect actual current timetable/operations rather than assuming a short lunchtime crossing. Use a credible watch/rest arrangement.
- Fuji's beer/shed scenes start only after duty. Update behaviour, props, dialogue, animations and stories accordingly.

The visiting cargo boat keeps its own vessel identity and visits; do not borrow Minato's active ferry crew for simultaneous cargo operations or invent cargo-crew houses ashore. Keep cargo/mail/fish services and align handovers with actual calls. Remove obsolete references that give nine-year-old Riku adult freight-handling responsibilities.

## 10. KITANO HOUSING — DISTINCT FROM THE MINATO DEMOLITIONS

The audited builders retain: kitano-1 (occupied Nils/Thuan home); kitano-2 (vacant Shiroma house); kitano-3 (former Chinen house; its geometry remains although its active home prompt is skipped).

Preserve Nils/Thuan's authored house, terrain, airport, pier, businesses and island facilities.

Kai currently needs a documented real home/rest arrangement. Recommended resolution: inspect existing kitano-2 and use it for the existing Kitano pier worker if its access/interior are suitable. This reuses an existing house for an existing worker; record it as supporting accommodation, outside the 14 core households. Do not invent a family.

kitano-3: remove it in this job (see addendum). Do not silently expand the project into a tropical terrain rebuild.

## 11. IDENTITY, SAVES, STORIES AND PRESENTATION

Use one canonical identity system with explicit core/supporting categories and stable IDs. Short display names, full profile names and historical aliases are separate fields or clearly defined equivalents.

Reconcile:
- Cast, profiles, avatars, portraits, directory, household registry and nameplates.
- Street actors, workplace/room actors, ferry crew, shore crew and school actors.
- Shop staff, trade ownership, warehouse suppliers, ticket/post interactions.
- Work/home/meal/leisure schedules, weather/weekend cases and overnight wrap.
- Friendship/mood records, gifts, quests, biographies, gossip, dialogue and story generation.
- Interior entry/exit, teleport destinations, map pins, home lights and saved locations.
- Service worker, runtime sources/manifests and generated bundles required by the project.

Do not perform a blind global string replacement: Sato Ramen remains Sato Ramen, Higa family history remains Higa history, and business names such as Nakamura Zenzai may stay unless a specific conflict requires a change. Update labels like "Grandmother Sakurai's shop" to Thuan's ownership.

Saved players inside removed houses must load at a valid retained public location. Preserve inventory, money, clothing, vehicle state and unrelated quest progress. Migrations must be versioned/idempotent and survive repeated loads. Old names resolve through aliases without retaining duplicate living characters or active removed homes.

Make Jack and Mac American long-term residents with grounded individual histories. Keep the wider setting predominantly Okinawan and preserve the Vietnamese family and Swedish player identity. Use personalities and relationships, not caricatures.

## 12. IMPLEMENTATION ORDER

A. Reconcile current source and produce the final machine-readable roster, role assignments and household inventory.
B. Add stable IDs/aliases and save migration before destructive world changes.
C. Apply ownership, crew and shore-role changes; verify boarding, departure, engineering relief and mooring handoffs.
D. Reunite Nhung's household and make the two retained ground-floor homes usable.
E. Transfer postal, flowers, maintenance and newspaper responsibilities; implement compatible opening hours.
F. Retire the ten characters, remove the six houses, simplify the flats and compact the affected streets.
G. Synchronise stories, profiles, directories, trade, maps, lighting and documentation.
H. Rebuild, verify and deliver the reviewable implementation.

Avoid speculative replacement attractions, new residential districts or unrelated graphics/gameplay rewrites.

## 13. ACCEPTANCE AND EVIDENCE

Add or update focused meaningful tests appropriate to the changes:
- Exactly 21 core and five supporting identities in this scope; all 26 short display names are unique.
- Ten retired core identities have no active body, household occupancy or workplace shift.
- No duplicate bodies across street, homes, businesses and ship; player Nils is not duplicated.
- Exactly 14 primary core households with the specified members; supporting quarters and secondary rooms recorded separately.
- Thuan owns Sakura; no Chin/Sakura staffing assignment survives.
- Fuji is master and sober on duty; Chin is motorman; all eight ship posts remain covered.
- Engineering relief works while the player is away.
- Real ship/shore actors reach assigned stations before departure tasks complete.
- Mail, food, repairs, flowers, bathhouse, school and retained commerce remain usable under their new hours.
- Nhung's family actually reaches home, eats/rests and sleeps correctly.
- Mac and Mika reach their two ground-floor homes; no obsolete upper-floor route or vacancy remains.
- Six listed Minato houses have no live meshes, foundations, private enclosures, colliders, lights, entrance prompts or route/map destinations.
- Retained homes, shops, port and coastal routes remain reachable after street compaction.
- Old-name/home saves migrate correctly, including loading inside removed buildings and applying migrations twice.
- Core families, ages and sensible relationships survive; no stories summon retired residents.
- The final population/accommodation report includes supporting crew and does not hide them outside the roster.

Run the repository-required runtime build and packaging checks: `npm run build:runtime` and `node --test tests/runtime-package.test.mjs`, in the project working directory, and the relevant focused suites discovered in current source. Report unrelated pre-existing failures accurately; do not claim an incomplete full test run passed.

Review actual rendered pedestrian and overhead views of the affected blocks, both homes, family house, Sakura, port and ship operations. State separately what was tested on a physical iPhone; browser emulation is not physical-device evidence.

Compare before/after town geometry, collisions and active actor/interior costs with consistent settings. Report measured results only.

Deliver: focused implementation branch/commit or PR; final 26-person roster and old-name map; final household and supporting-accommodation inventory; actual house/building removals and street changes, distinguished from historical removals; crew/watch and shop-opening arrangements; save-migration notes; test/build results and reviewed screenshots; any unresolved source conflict, genuine schedule conflict or unavailable verification.

## 14. SOURCE STARTING POINTS

Read the CURRENT versions of: `src/people/cast.js`, `src/people/island-households.js`, `src/people/ferry-crew.js`, `src/people/ferry-crew-aboard.js`, `src/people/ferry-shore-crew.js`, `src/people/canonical-day.js`, `src/world/ferry-ship.js`, `src/world/ferry-operations.js`, `src/world/cargo-shipping.js`, `src/world/island-homes.js`, `src/world/kitahama-layout.js`, `src/world/okinawa/layout.js`, `src/world/okinawa/quarters.js`, `src/world/okinawa/kitahama-quarter.js`, `src/world/kitano-hamlet.js`, `src/world/kitano-hamlet-layout.js`, `docs/minato-home-assignments.json`, `docs/INTERIOR-INVENTORY.md`, `docs/MINATO-HOMES-IMPLEMENTATION.md`, `docs/MINATO-HOMES-PLAN.md`, `docs/CAST-PLAN.md`.

Older plans contain superseded assignments and stale mayor/owner descriptions. Use them as dependency evidence, and update them to agree with the final design rather than treating them as newer instructions.

## ADDENDUM — THE OWNER'S RULINGS, 19 OCTOBER 2026 (LATER THE SAME DAY; THESE WIN)

1. **Police station.** Mori does not stay in the kōban. A real police station (交番/警察署 on the signs, English in speech) is built on the empty lot next to it, enterable like the shops (front desk, waiting bench, lost-and-found, notice board, holding room, bicycle rack, patrol-car bay); Mori's accommodation moves inside it. The household count stays 14 (home id `koban` is retained as the logical identity). The station itself is a separate job after this consolidation; this consolidation must not build on that lot and must leave `koban` as Mori's home id.
2. **Kitahama lots.** The street-dressing pass skips the Kitahama lots; the compaction here decides the plan, and the dressing (gardens, 月極 parking, bike sheds, hedges) follows on the final layout.
3. **Trade rules.** Retiring Mrs Kinjō moves flowers to Sakura: change the "Rainflower Florist supplies decorations" line in the repo CLAUDE.md and `src/commerce/merchandising.js` with it, and remove the florist pavilion. Remove the former post-office shop-house once Mika's counter has the parcels (if inspection finds a shared/non-residential dependency, name it and make the smallest complete service-preserving change).
4. **Thuan's weekday room at 1 Kitahama is dropped.** She and Nils live on Kitano-jima and the ferry runs 06:25–22:15. kitahama-1 is purely Thao, Chin and Vy.
5. **kitano-3** (the dead Chinen house) is removed in this job, not reported as a candidate.
6. **Kitahama Heights** becomes two attached ground-floor houses with their own doors and gardens (no corridor, no stair), keeping the `kitahama-flat-3` / `kitahama-flat-4` ids for migration.

## HOW IT IS RUN (the plan of record)

Five PRs, each from the main of the day, in this order; each phase leaves the game playable and its tests green:
1. Roster data, stable ids, display names, aliases, save migration; this brief committed as `docs/CAST-CONSOLIDATION.md`; the owner's rulings recorded in `johansson-town/AGENTS.md`. Nothing visible changes yet.
2. Ship posts and shore roles: the five supporting crew identities, Fuji master (sober on watch), Chin motorman, Nao/Koji rota, Jack and Kai line handoff, Mac relief.
3. Households: Nhung home at 3 Kitahama, the two Kitahama Heights houses, ownership and counter transfers (Sakura, flowers, post), opening hours.
4. Retire the ten, remove the six Minato houses, the florist pavilion, the post-office shop-house and kitano-3; compact the streets.
5. Stories, directories, maps, docs, the CLAUDE.md trade line, runtime rebuild, the population and accommodation report.
Then the police station on the freed lot, then the docks and boats, then the lot dressing on the final layout.

## CLOSED — 19 OCTOBER 2026

All five phases are in (`johansson-town/AGENTS.md` records each), the police station stands on the freed lot (PR #252)
and the docks are in. The deliverable report is [CAST-CONSOLIDATION-REPORT.md](CAST-CONSOLIDATION-REPORT.md): the final
26-person roster and the old-name map; the 14 households member for member, the berths aboard and the quarters; the
removals of this job, distinguished from the housing project's; the watches, the reliefs and the opening hours; the
save-migration notes; the build and test results; and what is unresolved. The data of record is `src/people/roster.js`
(mirrored in `docs/cast-roster.json`); the brief above is kept as written, the addendum winning where they differ, and
`AGENTS.md` names what was reconciled against the source. What this job did not do, deliberately: the brief's short
display names are the roster's and resolve everywhere, but the world's own names (Mr Fujita, Harbour master, Ms Uezu,
Kōji, Ms Ganaha) stay on its prompts, drawings, saves and tests until a rename sweep of their own; the lot dressing
(ruling 2) follows on the final layout; the police station's and the terminal's story backdrops wait for a Chromium
with a GPU (the report says the command).
