# Handover: Sakura's stockroom and stair without Z-fighting, and the climb as the loading screen (26–27 October 2026)

The owner: "Push to main, then audit the storage room and the stair case, Cad it first remove all Z fighting." Then: "The
black part should not be shown it should be like a loading screen when you up the stairs the loading starts for the top
Floor", "No the loading screen is walking up the stairs", "Sveeenshots too pls" and "Camera should lock from below we just
see him go up".

## Stockroom and stair surfaces (published to main, `23ac623f`, `f8f61105`)

Drawings SK-ZF-004/005 rev A (`docs/qa/sakura-surfaces/build_stair_cad.py`, `audit-stair-before.json`). The strict zones
(stockroom and stairwell: 2 mm / 0.1 cm² with identical faces kept, and 10 mm / 0.05 m² wide) are at 0 and tested in
`tests/sakura-surfaces.test.mjs`. The hosted guard ran out of memory in `no-z-fighting.test.mjs`; the scanner allocates less
and the workflow gives the guard step a 6 GB heap.

## The climb (this commit)

Drawing SK-ST-001 rev B (`docs/qa/sakura-surfaces/build_climb_cad.py`, 8/8 checks; rev A cut between two cameras).

- **No black.** The stairwell is built in full in both storeys (`buildSakuraStairwell` in `sakura-stairs.js`: closed
  carriages, 11 + 11 treads, the turning landing, the top landing, walls and ceiling). The dark volumes only keep their
  colliders.
- **The walk is the loading screen.** Stepping onto the stair (or Go upstairs/downstairs) starts `takeSakuraStair` in
  `game.js`: the other storey starts loading, and he walks his flight at 1.2 m/s (`SAKURA_STAIR_CLIMB`).
- **The camera is locked.** In third person: going up, low in the corner at the stair's foot, aimed up the lower flight;
  going down, high over the top landing, aimed down the upper flight. It turns only 30 % after him. The walls between the
  flights hide the other flight from any camera, so each walk ends as he turns on the landing. Then the cut (0.18 s) and he
  is at the stair head upstairs, or the foot in the stockroom. If the storey is not ready he waits on the landing, in view.
  In first person he climbs on his own eyes.
- On arrival his camera is put level behind him at once (the stair camera's aim used to carry into the first frame).
- Film: `node tools/sakura-climb-review.mjs <dir>` (after `npm run build:runtime`). The sheet sent to the owner:
  `docs/qa/sakura-surfaces/climb-locked-camera.jpg`.

## The stairwell trim (SK-ST-002 rev A, after the owner's review notes)

The owner sent a review of the climb frames (blank walls; a "dashed line" on the wall; a stray brown board; Blender
lighting and shader notes) and asked "But we are drawing in blender aren't you?". Answer given: both. World (`main`, these
frames) is three.js; the Pixar Sakura is Blender (`jojo`, `pixar`, `3d/sakura/`). The structural notes were built in World
now (`SAKURA_STAIR_TRIM` and `buildStairTrim` in `sakura-stairs.js`, `docs/qa/sakura-surfaces/build_trim_cad.py`, 20/20 checks).
The shader, AO, noise and light-pool notes belong to the Blender konbini, and the same trim data should be used there.

- The "dashed line" was the upper flight's stepped side, and the brown board was the under-stair cupboard door with no
  frame. There are now closed strings each side of each flight, with the treads housed in them, and the door is in a
  casing with a knob.
- One continuous wall handrail: 40 mm, 65 mm off the wall, 850 mm over the nosing line, on brackets at most 1 m apart.
- Skirting on both landings; non-slip nosing on all 22 treads.
- 1F 売場 and 2F 事務所 plates; the stair light with a switch at each end; the fire alarm (lamp, bell, button) on the landing.
- A fault found on the way: in the office storey the stairwell's west wall stopped at the office floor, so a dead strip of
  office floor (x -6.4..-5.65) showed as a slab floating on the landing wall. The wall now runs to the ceiling, and the
  office floor strip and rear wall end under it (`sakura-office-room.js`).
- Cost: 10 draws and about 2,000 triangles (shop fixture 727 draws, budget 813). The scanner shows 0 coplanar pairs on both
  storeys and in the strict zones.
- Not done from the notes: random box rotations (World places nothing at random), lighting pools and the 1F/2F colour
  shift (they change World's shared lighting), and Blender modifiers. Stockroom tape and the hand truck already exist.
- Sheet: `docs/qa/sakura-surfaces/stair-trim.jpg`. Test: the trim test in `tests/sakura-stairs.test.mjs`.

## No door; Thuan's campaign posters (SK-ST-002 rev B)

The owner: "Why is there a door in the staircase? Can you make it more realistic and bring the posters from the town with
the Pixar Thuan into the staircase ... on the walls". The under-stair cupboard door is gone: rev A put it on the carriage's
face to the 450 mm well between the flights, where nobody could reach it, so that face is now plain wall. The only town
poster with the Pixar Thuan is Sakura's campaign print on Blue Coral (SP-NK-001, "After the ice cream, a cold tea."). It
is pinned up twice as B2 (515 x 728 mm), with a push pin in each corner: between the flights at the eye height of someone
on the lower flight (the foot camera sees it), and straight ahead on the landing's back wall beside the fire alarm (the down
camera sees it). The paper is a decal 1 mm off the wall. `build_trim_cad.py` passes 24/24 checks (clear of the rail, on
its wall). Sheet: `docs/qa/sakura-surfaces/stair-posters.jpg`.

## The stair head's balustrade

The owner circled a brown slab beside the top of the stair: "What's this wall or door?". It was the stair head's guard in
the office hall, a solid 1.5 m × 1 m board put up when the stairwell was a black pit. It is now a balustrade: newel posts,
a handrail at 950 mm, a bottom rail, and 30 mm balusters with gaps under 110 mm (`SAKURA_STAIR_TRIM.guard`). It keeps
the same collider. `build_trim_cad.py` passes 26/26 checks.

## Trade posters and the drink stock (SK-ST-003 rev A)

The owner: "Put more advertisement posters on the walls in the hallway and stair case ... like a fake beer brand and make
up ads and liquor ads etc and I want liquor and beer boxes in the hallway outside the office". Built in
`src/world/interiors/sakura-trade-posters.js` (data, artwork, builders), drawn on `build_posters_cad.py` (27/27 checks),
tested by `tests/sakura-trade-posters.test.mjs`, photographed by `tools/sakura-hall-review.mjs`.

- Nine designs, painted in code on one sheet (one texture, one draw per room). UMINEKO Draft, Black and the year-end
  gift-set order poster use the town's lager; the others are new and fictional: KITANO 12 pure malt, SHIMAKAZE awamori,
  MINATO-TSURU junmai, NAMI SOUR lemon chūhai, and ASAGAO cosmetics (Coral Bay Red lipstick, UV milk). Every drink poster
  carries お酒は二十歳になってから.
- Ten slots. Six in the stairwell: up the lower flight's north wall, on the landing's west and south walls, and up the upper
  flight's south wall, each 120 mm or more over the rail at its higher edge. Four in the hall: lipstick by the store door,
  the gift set and UV milk over the cases on the west wall, Umineko Draft over the shoe cabinet. Push pins in each corner.
- Why: since Higa Liquor closed, the reps send campaign posters with each order and the spares go up on the staff walls.
  Asagao's rep hopes Thuan will stock their lipsticks; she has not said yes, which is a story hook.
- The cases, hand-stacked (a few mm off, a degree turned) and solid. West wall: 5 Umineko gift sets, 4 Shimakaze 1.8 L × 6,
  2 Minato-Tsuru, 2 Kitano 12, 6 Umineko 24-can cases. By the office door: 5 Umineko Black (sale or return). Why: the
  year-end gift orders and the Coral Bay Bar's December spirits wait dry, by the office and its safe, until Kōji's round.
  A 1.9 m way stays clear.

## Checks

- `tests/sakura-stairs.test.mjs`, `sakura-back`, `sakura-surfaces`: pass.
- Every test file that mentions Sakura (635 tests): 12 fail here and 11 on untouched main, the same 11 plus #335 (the office
  site named once more in `game.js`), which this branch then fixed. With it fixed all three files pass.
- The local `tools/ci-guard.mjs` result is recorded in the HANDOVER row.
- Frames up and down inspected: he is in view from his first step to the turn, nothing black, the arrival level.
  SwiftShader in desktop Chromium; not checked on the owner's phone.

## Next

- Phone check of the climb (timing of the loading on a slow connection: he may wait on the landing).
- The Pixar Blender konbini (`jojo`, `pixar`) should follow the same rules.
