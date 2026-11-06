# Current interior inventory — 18 October 2026

> **Superseded on 19 October 2026 by [CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md)** (the owner's cast, household and crew consolidation; its addendum wins). This document is kept as dependency evidence of the earlier design; where it names Johansson mayor, gives Grandmother Sakurai Sakura or a home, keeps Thuan a weekday room, or counts 31 residents and 23/24 households, the consolidation's 21 core and 5 supporting identities, 14 households and ten retirements are the plan of record (`src/people/roster.js`, `docs/cast-roster.json`). Corrections below are marked *(superseded …)*.

This inventory follows active building registrations and the runtime room builders, not screenshots or a claim of visual completion. All 24 occupied primary households have interior geometry: 23 in Minato and Johansson/Thuan's primary home on Kitano-jima *(superseded 19 Oct 2026: the target is 14 core households; see CAST-CONSOLIDATION.md §7–§8 for which of these go)*. An individual interior and a shared residential layout are distinguished below. Resident routines must not depend on a bespoke bedroom being finished.

## Individual home interiors

| Home | Residents | Builder / arrangement |
| --- | --- | --- |
| Kitano family house | Johansson and Thuan | `johansson-house-interior.js`; primary home |
| 1 Kitahama | Thao, Chin, Vy; ~~Thuan's weekday room~~ *(dropped 19 Oct 2026; her guest bedding removed in phase 3)* | `vy-room.js`; family rooms and separate sleeping places |
| 3 Kitahama | Nhung, Kōji and Riku *(Nhung moved home in phase 3)* | `family-home.js` with the residents' own futons; Nhung is put to bed here (`home-residents.js`) |
| ~~1 Front-Row Yard~~ | ~~Reiko~~ *(Nhung until phase 3; removed in phase 4)* | Gone: the yard's lawn (`okinawa/lots.js` CLEARED_LOTS) |
| 2 Front-Row Yard | Tetsuo | `tetsuo-flat.js`; individual flat |
| 2 Kitahama | Mrs Sato | `tatami-home.js`; individual tatami home |
| Police box residence | Officer Mori | `koban.js`; residence behind the workplace |
| Harbour office residence | Harbour master | `office-workplace.js`; sleeping nook behind the screen |
| Shiosai houseboat | Mr Fujita | `fujita-houseboat.js`; directly walkable cabin with sofa/blanket |

## Homes using shared furnished residential layouts

These are enterable and furnished, with sleeping and dining positions. They are not exterior-only buildings, but they still share a layout system rather than each having an individually designed interior.

| Home | Residents | Interior |
| --- | --- | --- |
| ~~4 Kitahama~~ | ~~Postman Tōma~~ | Removed in phase 4 with its resident; a cleared lot |
| ~~5 Kitahama~~ | ~~Grandmother Chinen~~ | Removed in phase 4 with its resident; a cleared lot |
| ~~6 Kitahama~~ | ~~Bus driver, the former master~~ | Removed in phase 4 with its resident; a cleared lot |
| 8 Kitahama | Ms Uezu | Family-home layout |
| Kitahama Heights A (id `kitahama-flat-3`) | Mac (Mr Nakandakari) | Family-home layout; its own gate and front door on Fukugi Lane, ground level *(phase 3: the block became two attached ground-floor houses)* |
| Kitahama Heights B (id `kitahama-flat-4`) | Ms Ganaha | Family-home layout; its own gate and front door on Fukugi Lane, ground level |
| ~~Kitahama Heights, Flat 1~~ | ~~Mr Higa Jr~~ | Retired in phase 3 with the upper storey; he retired in phase 4 |
| ~~Kitahama Heights, Flat 2~~ | ~~Grandmother Sakurai~~ | Retired in phase 3 with the upper storey; she retired in phase 4 |
| Higa house | Miss Higa and Grandmother Higa | Family-home layout |
| ~~Kinjō house~~ | ~~Mrs Kinjō~~ | Removed in phase 4 with its resident; cleared coral sand on the seawall walk |
| ~~Ōshiro house~~ | ~~Mr Ōshiro~~ | Removed in phase 4 with its resident; cleared coral sand on the seawall walk |
| Above Nakamura Zenzai | Mrs Nakamura and Mai | Upper-home layout with private stair |
| ~~Above the post office~~ | ~~Mr Shimabukuro~~ | Removed in phase 4 with the shop-house; the park's lawn meets Main Street there |
| Doctor's flat | Dr Kakazu | Family-home layout, separate from the clinic |
| ~~Private Izakaya residence~~ | ~~Barfly~~ | Registration retired in phase 4; the izakaya is a business only |

The vacant `home-kitano-2` on the separate tropical island also has a standard interior. It is not an occupied Minato household. Retired Minato dwellings are not counted as live homes.

## Public and working interiors

| Building | Existing interior |
| --- | --- |
| Sakura Shōten | Shop floor, till, back room and restroom |
| Sakura upper floor | Main office and kitchenette; latest main adds the internal stair connection |
| Minato Izakaya | Public bar and dining room |
| Sato Ramen | Ramen dining/service room |
| Front-Row Books | Bookshop, reading and printing areas |
| Dock Electrical & Repair Workshop | Repair and instrument benches, workshop equipment |
| Umi-no-yu | Lobby, changing/washing/bathing areas and service fittings |
| Harbour office | Working office plus its residential nook |
| Minato Police Box | Police room plus residence |
| Town Hall Classroom | Classroom |
| Community Kitchen | Kitchen and dining facilities |
| Mayor's Office | Civic office; its title does not make Johansson the mayor |
| Minato Clinic | Medical workplace, separate from Dr Kakazu's home |
| Port Terminal | Passenger waiting/ticket hall |
| Harbour Warehouse | Warehouse and Sakura supply/depot space |
| Minato Maru | Walkable machinery, passenger and crew spaces, including duty cabins and berths |

Naha arrivals and the city restaurant also have separate travel-scene interiors.

## Open frontage or exterior facilities

| Location | Current distinction |
| --- | --- |
| Rainflower Florist | Open pavilion/counter with furnishings; no separate enclosed room |
| Nakamura Zenzai / Blue Coral | Open public counter; the residence upstairs is separately enterable |
| Post office | Street counter/mailboxes; the residential room above is separate |
| Kissa Higa (the old Higa Liquor, 30 October 2026) | A walk-in room on the street: the coffee counter, the ledge and stools, the table; no dedicated room in the entry dispatcher |
| Power station | Exterior equipment/site; no dedicated room in the entry dispatcher |
| Fish auction / ice plant / boatyard | Working scenery and interactions; no dedicated entered room in the current dispatcher |
| Kitano airport | Runway/airport scenery; Naha arrivals is a different travel scene |

Sources: `src/game.js` (`roomShell`, `addRoomProps`), `src/world/businesses.js`, live town landmark registrations, `src/people/island-households.js`, `src/world/interiors/`, `src/world/ferry-interior.js`. Physical access, visual appearance and resident use still require acceptance checks; a room builder alone does not establish those.
