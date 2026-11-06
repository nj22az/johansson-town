> Superseded layout: Front-Row Books now contains only Aya/Reiko, books, newspapers and reading space. Kenji/Tetsuo and their equipment have moved to the separate western-quay industrial workshop. See `ISLAND-AND-AIRPORT-ROADMAP.md` and `src/world/dock-workshop-layout.js`. The material below records the earlier combined layout.

# Shared bookshop workshop and restored harbour office

19 September 2026. Combined-building update for the peninsula layout.

Front-Row moves north to Z = 1.6, with an 8.8 × 7.4 m exterior and an
8.4 × 7.0 m interior. Its south wall is at Z = −3.02; Minato’s north gable
is at approximately −6.10. The passage between them is paved and connects
the west pavement to the yard. Movement checks traverse it in both the
player and NPC collision envelope.

The exterior is a new single-storey wooden building: horizontal cedar plank
walls, exposed timber posts and beams, closed timber gables and one tiled
roof. Book and repair displays flank its single entrance beneath a combined
Front-Row Books & Workshop sign. The separate repair workshop exterior is
removed. Both activities share one room, without another interior transition.

Books, the evening press, Form 3D, StepWise, radio repairs and Star Port
share the Front-Row entrance. All 18 existing content objects remain
available across the combined shop and office. Historical workshop visits
and destinations resolve to Front-Row in this layout; inventory and print
jobs keep their existing identifiers.

| Building | Existing staff |
| --- | --- |
| Front-Row Books & Workshop | Aya, Reiko, Kenji, Tetsuo |
| Johansson Harbour Office | Harbour master |
| Harbour Warehouse | Mrs Sato |
| Sakura Shōten | Thuan |
| Minato Izakaya | Nao |

Officer Mori retains his patrol and the bus driver retains the terminal.
No new actors are created. Staff use the existing shifts and shopping
errands. The disabled ramen premises are removed from peninsula routines.
Workers queue for a shared interior exit instead of blocking one another.
The office uses the existing supplied office GLB, CRT workstation, filing
binders and downloadable spreadsheets. It remains staffed overnight.

The visitor board and map destinations reflect the combined address.
Archived street layouts retain their separate workshop and bookshop.

Integrated with main at 3f15ed5, retaining the dusk lighting, garden and
Thuan's current movement and bench routines. Live workshop destinations
resolve to the combined entrance before and after world construction.

Audit corrections close the 14 cm vertical gaps between both outer display
window stiles and the corner posts. Raycasts across both joints, at four
heights, now hit the solid frontage instead of the rear wall. The Minato
layout check measures the intended three-metre passage including the outer
corner posts.

The CPU game walkthrough now follows the published peninsula: one shared
street entrance, all five current interiors, four workers in the combined
room, an actual StepWise-to-Form-3D print and collection, old workshop-address
resolution, overnight access, and a complete unattended town day. It awaits
the real doorway transitions and drives the bounded catch-up worker. The
startup diagnostic expects the peninsula's seven street activities, and the
walkthrough checks every named action; the parked bicycle remains an eighth
requirement in archived layouts.

Validation after audit corrections:

| Revision | Tests | Passed | Failed |
| --- | ---: | ---: | ---: |
| Main 3f15ed5 | 417 | 411 | 6 |
| Combined building before corrections | 421 | 414 | 7 |
| Combined building after corrections | 422 | 417 | 5 |

The remaining failing tests also fail on unchanged main: full-town,
office, residential-street, sea-cave and supplied-buildings. The archived
full-town fixture still reports blocked door spawns, including the restored
office on this branch; the loaded peninsula walkthrough passes all current
interior entries, exits and startup checks. The office fixture expects
rendered actors without preloading their models; the loaded office-workplace
checks pass. These remaining failures are not attributed to network access.

The runtime rebuild succeeds and source-parity checks pass. The review
browser cannot access the local preview (ERR_BLOCKED_BY_CLIENT), so GPU
appearance and device frame rate remain unverified. No GitHub checks were
recorded on the PR at review time. Changes remain in draft PR #75; main and
the live site have not been changed.
