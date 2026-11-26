# Z-fighting audit, Johansson Town (not the ferry) · 26 November 2026

The owner, on his iPad, 26 November 2026: "Lots of z fighting I thought we eliminated it", "no z fighting allowed".
Data: [zfight-audit-2026-11-26.json](zfight-audit-2026-11-26.json) (every pair, worst overlap first: `remaining`, and
`fixed`). Tools: `tools/near-coplanar.mjs` (the threshold), `tools/zfight-audit.mjs` (what is scanned:
`node --expose-gc --max-old-space-size=5000 tools/zfight-audit.mjs out.json [--rooms-only|--town-only]`). Test:
`tests/near-coplanar.test.mjs` (in the guard). Handover: `briefs/HANDOFF-ZFIGHT-TOWN-2026-11-26.md`.

## Why the old checks passed while the owner saw flicker

1. **Most rooms were never scanned.** `tests/no-z-fighting.test.mjs` scans the streets, Sakura's office storey and its
   stair; `tests/sakura-surfaces.test.mjs` (not in the guard) Sakura's shop. The other 23 rooms the game opens (the
   homes, Johansson's house, the town hall, the clinic, the police station, Umi-no-yu, the harbour office, the shops,
   the port terminal, the warehouse) had no scan at all. Most of what was found there is two faces exactly in one plane.
2. **The Kikkou line (since 25 November: Sakura, its office, the izakaya, Sato Ramen and the ferry indoors) sees what the
   picture does not.** Its ID pass (`src/render/kikkou-ids.js`) draws every object in a colour of its own and inks where
   the colour changes. So (a) two alike objects in one plane, which the old scan skipped as "drawn identically, cannot be
   told apart", now fight as ink scribbles (kind `ink`); and (b) its ID material does not copy the source material's
   `polygonOffset`, so every decal (print, poster, label, plate) is drawn in the ID pass at its backing's depth (kind
   `decal`). Both arrived the day before the complaint.
3. **One fixed 2 mm tolerance** is right in a room and too little on a large surface seen down the street: a sign 5 to
   12 mm proud of a 7 m² front is one or two depth steps at 100 m.

## The threshold (tools/near-coplanar.mjs)

- Depth step at distance z, 24-bit depth (a Metal GPU stores it as 32-bit float: the same 2⁻²⁴ step near 1.0), near
  0.15 m, far 640 m (`game.js`): **Δz(z) = z²(f − n) / (f · n · 2²⁴)**: 10 m 0.040 mm · 30 m 0.36 mm · 50 m 0.99 mm ·
  70 m 1.95 mm · 100 m 3.97 mm.
- Two faces are told apart when their depths differ by more than both their errors (each rounded, one step, and
  interpolated over its own triangulation after a float32 transform, about one more): **margin 4 steps**.
- The distance that matters: the farthest the overlap still covers 4 × 4 pixels on the owner's iPad (about 2000 drawn rows
  under the 65° lens, one pixel 0.64 mrad): **z(A) = min(392 √A, longest view)**; a room's longest view is its
  diagonal, the streets' 100 m (the ink has faded by 98 m).
- **required(A) = max(2 mm, 4 Δz(z(A)))**: 0.0005 m² → 2 mm (every room) · 0.01 m² → 2.45 mm · 0.03 m² → 7.3 mm ·
  0.065 m² and over → 15.9 mm. A pair exactly at the threshold passes.
- Decals in the Kikkou ID pass are held to the arithmetic alone (4 Δz, no 2 mm floor): paint is meant to lie 0.5–4 mm
  off what it is on (JSY-STD-403 rule 6).
- Also new: two faces alike but one taking shadows and the other not (`shadowLook`).

## Counts, before and after this pass

Rooms: **423 pairs over 85.5 m² before, 316 over 19.1 m² after** (the same rule both times; streets unchanged).

| Place | Kikkou | Pairs before | After | m² before | m² after |
|---|---|---|---|---|---|
| Minato streets |  | 117 | 117 | 59.792 | 59.792 |
| mayor-home |  | 72 | 60 | 58.078 | 5.141 |
| office |  | 50 | 14 | 4.618 | 1.477 |
| school |  | 33 | 33 | 3.964 | 3.964 |
| market | yes | 73 | 39 | 3.408 | 3.214 |
| clinic |  | 14 | 6 | 3.322 | 0.252 |
| community-kitchen |  | 10 | 2 | 3.131 | 0.06 |
| koban |  | 14 | 8 | 2.785 | 0.4 |
| resident-home-kenji |  | 16 | 13 | 1.917 | 0.256 |
| onsen |  | 43 | 43 | 1.692 | 1.692 |
| frontrow |  | 18 | 18 | 1.204 | 1.204 |
| form3d |  | 22 | 22 | 0.639 | 0.639 |
| ferry-terminal |  | 15 | 15 | 0.331 | 0.331 |
| sakura-office | yes | 2 | 2 | 0.11 | 0.11 |
| home-higa |  | 6 | 6 | 0.049 | 0.049 |
| home-kitahama-flat-4 |  | 6 | 6 | 0.046 | 0.046 |
| home-kitahama-8 |  | 6 | 6 | 0.046 | 0.046 |
| home-kitahama-3 |  | 6 | 6 | 0.046 | 0.046 |
| home-kitahama-flat-3 |  | 6 | 6 | 0.046 | 0.046 |
| home-kitano-2 |  | 6 | 6 | 0.046 | 0.046 |
| resident-home-thuan |  | 3 | 3 | 0.02 | 0.02 |
| warehouse |  | 2 | 2 | 0.019 | 0.019 |
`kitahama-shop` streams its models in and builds nothing synchronously, so it was not scanned. The izakaya and Sato
Ramen were scanned with the Kikkou ID pass and have no pairs.

## What was fixed (worst first)

| File | The two surfaces | Fix |
|---|---|---|
| `house-plan.js` (the plan kit: Tetsuo's flat, the yard homes, Vy's room, the WC rooms) | kitchen boards and the genkan tiles / the toilet floor, laid in one plane (0.93 + 0.72 m²) | one surface: a finish laid where another is cuts it (the earlier one is rebuilt round it) |
| `johansson-house-interior.js` | the painted window views (`View from W-…`), cards larger than their windows, in one plane on each side (up to 5.8 m² each, 10 pairs) | each card at a distance of its own, 4 cm further than the last on its side |
| `town-hall.js` (community kitchen, clinic), `office-workplace.js` (harbour office) | skirting and dado rail through the wall to its back, their back faces in the dado's and upper wall's (0.5–0.7 m² per wall) | the skirting and the rail stand on the dado's face (same front, same look) |
| `police-station.js` | the futon, the TV cabinet and the telephone started under the upstairs tatami (undersides in its plane, 1.66 + 0.67 m²); the boot rack's shelf flush with the rack | they start on the tatami's face; the shelf stands 4 mm proud |
| `sliding-door.js` (Sakura's front door and every sliding leaf), `shop-refrigerator.js`, `sakura-cheer.js` (hot case) | rails the full width over the stiles, panels over the base, ends in one plane: Kikkou ink flicker at every corner | the stiles take the corners, the rails butt between them (JSY-STD-403 rule 2) |
| `sakura-life.js` | the Tanabata star standee stood inside the beer crates, its strut through the bottles (the known `sakura-surfaces` stockroom failure) | the star leans west of the crates, on clear wall; `tests/sakura-surfaces.test.mjs` now passes and is in the guard |

The 25 largest fixed pairs:

| Place | Kind | Surface | Surface | Gap mm | m² |
|---|---|---|---|---|---|
| mayor-home | depth | Mayor’s home › House G0 › View from W-LIVING | Mayor’s home › House L1 › View from W-BED | 0 | 5.799 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-LIVING | Mayor’s home › House L1 › View from W-BED | 0 | 5.799 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-KITCHEN | Mayor’s home › House L1 › View from W-GUEST | 0 | 5.363 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-KITCHEN | Mayor’s home › House L1 › View from W-GUEST | 0 | 5.363 |
| mayor-home | depth | Mayor’s home › House G0 › View from D-TERRACE | Mayor’s home › House L1 › View from W-LANDING | 0 | 4.927 |
| mayor-home | depth | Mayor’s home › House G0 › View from D-TERRACE | Mayor’s home › House L1 › View from W-LANDING | 0 | 4.927 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-SEW | Mayor’s home › House L1 › View from W-BATH | 0 | 4.491 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-SEW | Mayor’s home › House L1 › View from W-BATH | 0 | 4.491 |
| mayor-home | depth | Mayor’s home › House L1 › View from W-BATH | Mayor’s home › House L1 › View from W-STUDY | 0 | 3.579 |
| mayor-home | depth | Mayor’s home › House L1 › View from W-BATH | Mayor’s home › House L1 › View from W-STUDY | 0 | 3.579 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-SEW | Mayor’s home › House L1 › View from W-STUDY | 0 | 2.311 |
| mayor-home | depth | Mayor’s home › House G0 › View from W-SEW | Mayor’s home › House L1 › View from W-STUDY | 0 | 2.311 |
| koban | depth | police-station.js:272:4 < at roomShell (evalmachine.<anonymous>:34:38⟩ | Police Station interior › Police station first floor › Upstairs tatami | 0 | 1.663 |
| resident-home-kenji | depth | Tetsuo’s flat › Kitchen boards | Tetsuo’s flat › Toilet floor | 0 | 0.931 |
| resident-home-kenji | depth | Tetsuo’s flat › Genkan tiles | Tetsuo’s flat › Kitchen boards | 0 | 0.720 |
| community-kitchen | depth | Community kitchen | Community kitchen | 0 | 0.701 |
| clinic | depth | Clinic | Clinic | 0 | 0.701 |
| koban | depth | police-station.js:290:4 < at roomShell (evalmachine.<anonymous>:34:38⟩ | Police Station interior › Police station first floor › Upstairs tatami | 0 | 0.665 |
| community-kitchen | depth | Community kitchen | Community kitchen | 0 | 0.596 |
| community-kitchen | depth | Community kitchen | Community kitchen | 0 | 0.596 |
| clinic | depth | Clinic | Clinic | 0 | 0.596 |
| clinic | depth | Clinic | Clinic | 0 | 0.596 |
| community-kitchen | depth | Community kitchen | Community kitchen | 0 | 0.586 |
| clinic | depth | Clinic | Clinic | 0 | 0.586 |
| office | depth | Harbour office shell › East wall › East wall dado | Harbour office shell › East wall › East wall skirting | 0 | 0.539 |
## What remains, worst first (the first 40 of 433; all in the JSON)

| Place | Kind | Surface | Surface | Gap mm | Needs mm | m² |
|---|---|---|---|---|---|---|
| Minato streets | depth | Harbour Warehouse › J-Coffee warehouse wall banner | use › J-Coffee warehouse wall banner › J-Coffee · A little island time | 5 | 15.89 | 8.670 |
| Minato streets | depth | Sakura glass storefront › Sakura signboard | rops ⟨batched Sakura glass storefront @0,3.25,0.12 box 14.56×0.8×0.45⟩ | 7 | 15.89 | 7.358 |
| Minato streets | depth | < at buildOkinawaQuarters (file://src/world/okinawa/quarters.js:85:19⟩ | .js:392:7 < at buildFishMarket (file://src/world/fish-market.js:436:2⟩ | 3 | 15.89 | 3.436 |
| Minato streets | depth | < at buildOkinawaQuarters (file://src/world/okinawa/quarters.js:85:19⟩ | .js:392:7 < at buildFishMarket (file://src/world/fish-market.js:436:2⟩ | 3 | 15.89 | 3.436 |
| Minato streets | depth | Minato izakaya frontage | s ⟨batched Minato izakaya frontage @-0.88,4.53,4.57 box 6.7×2.44×0.26⟩ | 12 | 15.89 | 3.300 |
| Minato streets | depth | Front-Row yard homes › Back window (shoji behind the glass) | Front-Row yard homes › Back window frame (aluminium sash) | 5 | 15.89 | 3.098 |
| Minato streets | depth | Sakura street poster · Blue Coral › Sakura street poster board | Sakura street poster · Blue Coral › Sakura street poster print | 3 | 15.89 | 2.772 |
| Minato streets | depth | Minato izakaya frontage | ic-props ⟨batched Minato izakaya frontage @0,1.05,0 box 0.75×2.1×0.07⟩ | 10 | 15.89 | 2.196 |
| Minato streets | depth | kamura frontage › Nakamura lettering (menu tags, cider tin, nameplate) | g.js:218:44 < at shopHouse (file://src/world/okinawa/houses.js:212:21⟩ | 6 | 15.89 | 1.513 |
| Minato streets | depth | Okinawan quarters › Coin laundry frontage › Coin laundry noticeboard | s:136:55 < at shopInterior (file://src/world/okinawa/houses.js:479:21⟩ | 6 | 15.89 | 1.125 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 13 | 15.89 | 1.092 |
| Minato streets | depth | Front-Row yard homes › Yard home window | Front-Row yard homes › Yard home window frame | 5 | 15.89 | 1.082 |
| Minato streets | depth | Harbour Park › Harbour Park koi pond | py=1:327:171 < at buildPark (file://src/world/park.js?snappy=1:128:37⟩ | 12 | 15.89 | 0.864 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 2.5 | 15.89 | 0.686 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 2.5 | 15.89 | 0.686 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 2.5 | 15.89 | 0.686 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 2.5 | 15.89 | 0.686 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 12 | 15.89 | 0.684 |
| Minato streets | depth | quarters › Minato fish auction noticeboard › Noticeboard pinboard core | quarters › Minato fish auction noticeboard › Noticeboard pinboard face | 10 | 15.89 | 0.675 |
| Minato streets | depth | Minato harbour noticeboard (JW-NB rev A) › Noticeboard pinboard core | Minato harbour noticeboard (JW-NB rev A) › Noticeboard pinboard face | 10 | 15.89 | 0.665 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 5 | 15.89 | 0.660 |
| Minato streets | depth | ld/school.js:213:6 < at buildSchool (file://src/world/school.js:333:2⟩ | Minato school › Town hall monument | 10 | 15.89 | 0.623 |
| school | depth | Mesh | static-props ⟨batched Mesh @-4.225,1.45,3.69 box 0.55×1.1×0.18⟩ | 0 | 2.54 | 0.605 |
| frontrow | depth | Front-Row bookshop: floor-to-ceiling shelves › Bookcase backs | Front-Row bookshop: floor-to-ceiling shelves › Bookcase timber | 0 | 2 | 0.602 |
| Minato streets | depth | Okinawan quarters › Harbour vending machine › Vending machine body | Okinawan quarters › Harbour vending machine › Vending machine body | 13 | 15.89 | 0.546 |
| Minato streets | depth | › Kissa Higa lettering (valance, tin, cards, poster, menu, photograph) | g.js:303:60 < at shopHouse (file://src/world/okinawa/houses.js:215:45⟩ | 6 | 15.89 | 0.538 |
| Minato streets | depth | › Kissa Higa lettering (valance, tin, cards, poster, menu, photograph) | g.js:303:60 < at shopHouse (file://src/world/okinawa/houses.js:215:45⟩ | 6 | 15.89 | 0.538 |
| Minato streets | depth | Okinawan quarters › Coin laundry frontage › Coin laundry glass | tage › Coin laundry lettering (banner, hours, prices, labels, numbers) | 10 | 15.89 | 0.527 |
| market | decal | Sakura noodles goods | Sakura noodles packaging | 0.5 | 0.57 | 0.526 |
| Minato streets | depth | ld/school.js:213:6 < at buildSchool (file://src/world/school.js:333:2⟩ | Minato school › Town hall monument | 10 | 15.89 | 0.509 |
| school | depth | Mesh | Mesh | 1 | 2.54 | 0.508 |
| Minato streets | depth | Minato school › Minato school fittings › Community Hall gate plate | /school.js:290:29 < at buildSchool (file://src/world/school.js:317:26⟩ | 10 | 15.89 | 0.496 |
| Minato streets | depth | Minato school › Minato school fittings › School gate plate | /school.js:290:29 < at buildSchool (file://src/world/school.js:317:26⟩ | 10 | 15.89 | 0.496 |
| school | depth | Mesh | static-props ⟨batched Mesh @-4.225,0.45,3.69 box 0.55×0.9×0.18⟩ | 0 | 2.54 | 0.495 |
| school | depth | Mesh | Mesh | 0 | 2.54 | 0.475 |
| mayor-home | depth |  shell (file://src/world/interiors/johansson-house-interior.js:181:71⟩ |  shell (file://src/world/interiors/johansson-house-interior.js:206:84⟩ | 0 | 2 | 0.445 |
| mayor-home | depth |  shell (file://src/world/interiors/johansson-house-interior.js:181:71⟩ |  shell (file://src/world/interiors/johansson-house-interior.js:206:84⟩ | 0 | 2 | 0.445 |
| mayor-home | depth |  shell (file://src/world/interiors/johansson-house-interior.js:181:71⟩ |  shell (file://src/world/interiors/johansson-house-interior.js:206:84⟩ | 0 | 2 | 0.445 |
| mayor-home | depth |  shell (file://src/world/interiors/johansson-house-interior.js:181:71⟩ |  shell (file://src/world/interiors/johansson-house-interior.js:206:84⟩ | 0 | 2 | 0.445 |
| frontrow | depth | Plaster rear wall | Side wall | 0 | 2 | 0.440 |
The streets (117 pairs, 59.8 m²) are all layers 2.5 to 13 mm off what they are on, over areas seen from 70–100 m: the
J-Coffee banner on the warehouse (5 mm, 8.7 m²), Sakura's signboard on its storefront (7 mm, 7.4 m²), the fish market's
roof under the quarters' (3 mm, 3.4 m² ×2), the izakaya frontage's boards (10–12 mm), the yard homes' windows in their
sashes (5 mm), the Blue Coral street poster (3 mm, 2.8 m²), the shop lettering (6–8 mm), the vending machines' panels
(2.5–13 mm), the noticeboards' faces (10 mm). None is in the 2 mm scan; all fight at a distance by the arithmetic above.
Each is a task in the handover.

## Not verified

No render was taken in this pass: the page draws the compiled runtime (which this pass does not rebuild), and the
machine's shared memory killed the heavier runs. The arithmetic is the yard's estimate for a 24-bit (or float32)
buffer and has not been measured on the owner's iPad; software GL in Chromium is not an iPhone GPU.
