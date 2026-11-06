# Minato Maru: drawn in CAD, its problems fixed, a crew stair and a cosier saloon (3 November 2026)

The owner, 3 November 2026, in order:
1. With a screenshot of her alongside Kitano-jima: *"The minato Ferry has lots of problems can you draw it in cad"*.
2. *"Can you fix the problems ?"*
3. *"We need an interior stair case to the bridge as well"*.
4. *"And the accommodation needs to be more cosy and comfortable it should be fun to sit there and do nothing"*.
5. *"Push to main"*.
6. *"about the Minato Ferry there is lots of z-fighting in the whole ferry, have you audited interiors and the bridge"*.

Branch `claude/festive-rubin-fo8mmp`, rebased on main `adda7a0`, then merged with main `f7ea7f3`. The owner said
"Push to main"; the z-fighting audit below was finished first, then everything was published together (the publication
record is at the end).

## Rev A: the drawing (commit `b6873c5`)

`tools/ferry-exterior-cad.mjs` builds `buildFerryModel()` in Node as the game does. It projects every visible triangle
orthographically, removes hidden lines against a 10 mm depth buffer, and writes SVG, R12 DXF and an A1 PDF.
- Sheet X1: the exterior at sea.
- Sheet X2: Kitano-jima as in the screenshot, with four problems found:
  1. The aft mooring lines ran through the ship.
  2. The name board's names overlapped.
  3. The lane boards' truck sign sat across a divider.
  4. The ramp girders sank into the landings.

## Rev B: the fixes, the crew stair, the accommodation (this change)

### The problems, fixed
1. **Moorings** (`src/world/ferry.js`, `ferry-operations.js`, `src/people/ferry-crew-aboard.js`, `ferry-model.js`).
   - Each station keeps its own two ropes: `FERRY_MOORING.ropes`, six in all, each coiled on its own deck. A berth's
     lines name their `rope`, `bitt` and `lead`.
   - Bow-on at Kitano-jima (`KITANO_LINES`), she makes fast from both bows through the stem fairleads to the bitts on
     each side. The bosun works the new `starboard-bow` crew post, and the stern ropes stay coiled aft.
   - Minato's head line and forward spring lead through a new side chock on each bow house's corner; the old lead bent
     in the air over the roof edge, clipping it.
   - The forward coils moved 0.65 m aft, clear of the windlass drums (they touched before).
2. **Boards** (new `src/world/ferry-boards.js`, used by `ferry-model.js` and the CAD tool).
   - The name board is laid out from measured widths, 26 px between the names.
   - The lane boards have a centred truck under a shortened arrow, with the dividers midway between the lanes.
3. **Ramp** (`ferry-model.js`).
   - The girders taper over the leaf's last 2 m.
   - The plate is 4.4 m clear between the girders, and its toe eases up.
   - The flap's hinge pin is flush with its underside.
   - The laid ramp is 0.000 m clear of its landing at both berths.
4. **Found while fixing**:
   - The chart table blocked the starboard wing door, so that wing was unreachable from inside. It moved to the aft
     bulkhead; the bridge's paper chart and lamp shade (`ferry-bridge.js`) moved with it.
   - The saloon's front row stood 0.25 m out through the forward wall: seven rows did not fit, and 42 seats were claimed
     where 36 fitted.
   - The drawing book's engine-room plans drew round passenger-deck items onto the machinery plans. `tools/ferry-drawings.mjs`
     now draws only those below the car deck.

### The crew stair (`ferry-interior.js` `FERRY_CREW_STAIR`)
- **The flight:** straight, 0.8 m clear, 13 × 0.2 m at 45°.
- **The way in:** a trunk on the saloon's starboard side, from the cross passage through a 2.1 m doorway with an indigo
  noren and the sign 乗組員専用 / CREW ONLY.
- **The well:** it opens 0.2 m forward of the foot, so the head clears with 0.16 m to spare. It rises walled off through
  the master's cabin's forward outboard corner into the wheelhouse's aft starboard corner, railed.
- **The wing door:** the starboard wing door moved 0.85 m forward, so the stair arrives beside it.
- **The master's cabin:** rearranged (bunk along the corridor wall, safe under the desk, locker in the forward corner).
- **The general arrangement:** gains `crew-stair` (within the saloon), and the wheelhouse lists it as an exit.

### The accommodation (`FERRY_SALOON`, `FERRY_PASSENGER_SEATS`)
- **The saloon:** 34 reclining seats in terracotta moquette, 0.7 m a place, with wooden arms and white head covers; five
  rows at 0.88 m with a 0.9 m aisle. Also a rose-brown carpet, curtains tied back at the side windows, a teak ledge under
  the bow windows, a pothos from Sakura, and a framed chart of the crossing on the stair trunk.
- **The carpet room:** low tables with zabuton and tea cups, pillows and folded blankets, and a reading rack (the town
  paper, plus manga and paperbacks from Sakura).
- **Seats anyone may take:** S1 by the bow windows, S2 the port window seat, S3 a carpet cushion. They use the town's
  `seat` action.
- **`game.js`:** a seat with `aboard` data keeps its place, stand point, height and heading in her frame. `carry()` puts
  them back each time she moves (`pinAboardSeat`), so a seated player crosses with her.
- **Places for 100:** open deck 22 + lobby benches 6 (now counted) + carpet room 38 (was 36) + saloon 34 (was 42).

### The CAD, Rev B (`docs/minato-maru/exterior/`)
- **The sheets:** X1, X2 (findings shown resolved and measured again; boards painted by the game's own code in
  Chromium), and the new X3: deck plans cut 1.5 m above each deck, Section A–A up the stair and B–B through the saloon,
  at 1:50.
- **The files:** the PDF is now `Minato_Maru_Exterior_CAD_RevB.pdf`. All three DXF files read in ezdxf with 0 errors
  and 0 fixes.
- **Renders:** `docs/qa/minato-maru-accommodation-2026-11-03/` (source-geometry proofs, not game screenshots).

### Runtime
- `node scripts/build-runtime.mjs` rebuilt the bundle (finally entry `boot-BMcSgcmI.js`, after the seat-height and
  English-allowlist fixes below).
- Every older chunk the build pruned was restored, as the bridge releases did, so open clients keep loading.
  `tests/runtime-package.test.mjs` passes **4/4**.

## The z-fighting audit (owner's request 6)

The owner asked whether the interiors and the bridge had been audited. They had not: the town's flashing test
(`tests/no-z-fighting.test.mjs`) skips her because she is a dynamic prop, placed by the clock.

### How she was scanned
- `tools/z-fighting.mjs` scanned her as `buildFerryModel()` builds her: every room, the bridge, the casings, the car deck,
  the ramp and the boards.
- A pair is two faces that look the same way, lie within 2 mm of one plane and overlap.
- To name the source line of each merged piece, `ferry-model.js` and `ferry-interior.js` now record it under
  `__KIT_TRACE__` (`stackWhere`, `whereFrom`, `mesh.userData.kitSources`). This only happens in tests and tools.

### What it found
- **Before:** 72 pairs over 4 cm² (counted by source line), 12.2 m² in all; at 5 mm, 110.5 m².
- **After:** 1 pair, the navigation lantern's stand-in (see below).
- **Wall openings (32 of the 72, about 9.3 m²).** Every opening's reveal lay in its frame's plane. `wall()` now cuts each opening 4 mm
  larger than the frame and glass drawn into it.
- **Lane boards.** Their faces were in their bodies' planes, 1.44 m², the largest. They are now 8 mm proud.
- **Things standing in other things:**
  - The engine-room door leaf, hooked back, lay across the port aft fire-hose box. That box moved aft of the leaf.
  - The hose boxes were lifted clear of the drivers' benches' backs.
  - The purser's counter and the two drink machines stood 0.25–0.3 m out over stair S's and P's wells. They now stand
    inboard of the rails.
  - Stair P's and S's outboard rail ran up inside the lobby's side wall at its head. It is now 0.12 m in.
- **The crew stair.**
  - Her wings' floor slab and its deck paint (`ferry-model.js`) ran across the wheelhouse over the stair's well. The
    flight climbed into a ceiling 0.43 m over step 10. Both are now cut round the well.
  - The bridge deck's edge is now the last step: the well ends a going short of the head, at Z(20.15).
  - The treads stop short of the stringers' faces.
  - The rail and the linoleum end at the well.
- **Layers in one plane:**
  - curtains and their tie bands and valances
  - the crossing chart's sea, islands and route
  - the corridor walls meeting the cross walls' ends
  - door frames and bench straps standing in the deck plane (now 1 cm into it)
  - the lane line meeting the lobby wall
  - the freeing ports
  - the teal band under the passenger deck
  - the ramp's hinge pin and the flap's pin in the girders' faces
  - the flap's toe bar
  - the liferaft cradle
  - the gangway gate's teal bar
- **Seen from the quay (5 mm).** The car deck's plating over the machinery spaces was 5 mm under the car deck, 96 m²,
  and the lane lamps were 5 mm off their hoods. At 0.15 m near plane a phone's 24-bit depth buffer still tells 5 mm
  apart at about 110 m, so both now have 12 mm.
- **Found in the renders, not by the scan.** The dark stringers of all three stairs ran along the line of the treads'
  inner corners, so a stub of stringer stood up at the back of every step. They now run 8–8.5 cm under that line.
- **Left on purpose:** 15 cm² on the navigation lantern's stand-in (`ferry-bridge-lantern.js`): its cable gland's end cap
  in the plane of the mounting foot's underside.
  - The stand-in is replaced by its GLB as soon as anyone comes within 12 m.
  - Its plan is generated with the GLB (`tools/blender/build-minato-navigation-feeder.py`), so it should be fixed there.

### The test (`tests/ferry-z-fighting.test.mjs`, 4/4)
1. Nothing aboard shares a plane (2 mm) over 4 cm², except the stand-in above, named and limited to 20 cm².
2. Outside the wheelhouse, nothing within 5 mm of one plane over 0.01 m². In the wheelhouse no one stands more than 6 m
   from anything, so 2 mm is ample there.
3. The crew stair's well is open: nothing of hers over the flight below head height. It fails on the old slab.
4. The stairs' stringers run under their treads. It fails on the old stringers.

### Renders
- `docs/qa/minato-maru-accommodation-2026-11-03/` was rendered again from the fixed geometry.
- The first `crew-stair-from-the-foot.jpg` showed the white slab across the top of the flight. That first set is in git
  at `c83256c`.
- New: `stair-p-from-the-car-deck.jpg`.

## Checks actually run
- **New tests:** `tests/ferry-exterior.test.mjs` passes **6/6** (no laid line pierces her at either berth with the ramp
  up or down; Kitano lines from the bows; coils clear; both boards; the laid ramp never below its landing).
  `tests/ferry-accommodation.test.mjs` passes **4/4**.
- **Walking:** `tests/ferry-walk.test.mjs` passes **13/13**. It includes the new walk from the saloon up the crew stair
  into the wheelhouse and out of the starboard wing door, and back, plus the blocked walk into the well, the trunk and the
  cabin.
- **Updated tests:** the berth test in `tests/ferry.test.mjs` now expects six ropes and checks only the ropes worked at
  each berth.
- **Generated docs:** `ferry-design-book` and `ferry-status` pass after regeneration (both already failed on the
  untouched code). The hydrostatics/offsets/lines/electrical-load changes in that regeneration are byte-identical to
  regenerating the untouched code, so they come from earlier loft changes, not this work. The regenerated hydrostatics
  give 367.2 t at 1.9 m against the data's 375.41 t: worth an engineering look.
- **Already failing before this change:** identical failures on a clean worktree of `b6873c5`:
  - owned car rides her sailing
  - loaded car deck pedestrian access
  - Chin/Tetsuo step out of the car
  - engine-room ladder width
  - both forward mooring stations' ladder route (same error before and after, at the ladder)
  - Johansson Marine machines ×2
  - overhaul clearance
  - hull "56 meshes"
- **Full World suite** (`tests/*.test.mjs`, 472 files, concurrency 4, 873 s): 2,359 tests, **2,311 pass, 38 fail**, 8
  skipped, 2 todo. To sort the 38, the 26 files holding them were run again on this branch and on a clean worktree of
  `b6873c5`, under the same conditions:
  - **26 fail identically on both trees:** pre-existing, outside this work (Main Street circuits, east lawn, housing,
    z-fighting in Sakura's shop and stockroom, products, sisters, Vy, the cargo round trip, the engine room and others).
  - **10 failed only under the full suite's load** and passed on both trees in the rerun: Higa and Ganaha journeys,
    the pole hugs, the chair's sitters, Chin and Tetsuo stepping out, and others.
  - **2 were caused by this change, and are fixed:**
    - `seat-layouts`: the town's roster of public seats now lists the three ferry seats as single places, and the carpet
      cushion's support height matches its zabuton (0.08 m).
    - `english-language`: `src/world/ferry-boards.js`, painted scenery, joins the inventory's scenery files, so the name
      board's みなと丸 is allowed as it was in `ferry-model.js`.
  - After the two fixes, `seat-layouts`, `english-language`, `ferry-accommodation` and `runtime-package` pass.
- **Not tested:** the seat action has not been exercised in a running browser game, and no physical iPad was used.

- **CI guard list:** `tests/ci-guard.txt` gains `ferry-exterior`, `ferry-accommodation`, `ferry-walk` and
  `ferry-z-fighting`. The whole guard run locally: 117 files, **618/618** green.

## Publication record (3 November 2026)
- **Main:** `2248c85..3d30494` (fast-forward). It carries:
  - `b6873c5` Rev A
  - `cad6ce1` handover
  - `c591101` Rev B fixes, crew stair and saloon
  - `c83256c` seats and English allowlist
  - `f99f738` merge
  - `51f2d58` the z-fighting audit
  - `3d30494` merge of main's PF-82 jingles
- **Then:** `e6432d7`, the CI guard list, and this record.
- **Pages:** "pages build and deployment" #1621 for `3d30494` **succeeded** (19:48–19:51 UTC).
- **Live bytes:** about 3 minutes after the push, every file checked matches `3d30494`:
  - `ferry-interior.js`, `ferry-model.js`, `ferry-boards.js`, `game.js`
  - `johansson-town/index.html` and `sw.js`
  - `runtime/boot-BfEbudVM.js` and `runtime/source.json`
  - the CAD PDF
  - The previous entry, `runtime/boot-BMcSgcmI.js`, is still served (200), so open clients keep loading.
- **Johansson World guard** on `3d30494` (run 430):
  - The `guard` job (`tests/ci-guard.txt`) **passed**.
  - The iPhone startup smoke and the three ferry-exploration smokes were **stopped by the jobs' 15-minute limit**.
    Their checkouts alone took 3–10 minutes, so all four hit it at 20:04. GitHub reports that as "cancelled", not
    failed; they did not finish, so they prove nothing either way.
- **Johansson World guard** on `671c1eb` (run 431, the CI guard list and this record):
  - The `guard` job **passed**, now with the four ferry tests in it.
  - **ferry-exploration (desktop) passed** in WebKit: the real engine-room exploration, 9 minutes, after a 3.5-minute
    checkout.
  - The iPad portrait, iPad landscape and iPhone startup jobs were again stopped by the 15-minute limit. Their checkouts
    took 8–15 minutes, so the iPhone job never reached its test.
  - **Not yet shown in CI:** the two iPad profiles and the iPhone startup on this release.
- **Chromium stand-in, desktop profile, in this container:** it boarded with full graphics and rendered her Blender
  asset and interior (730,324 triangles, no GPU error, no page error). It restored the normal lens, then stopped on a
  30-second screenshot timeout under software rendering. That is a limit of the container, not evidence either way.

## Next concrete actions
1. Exercise S1–S3 in the running game in a browser, aboard during a crossing: sit, cross, stand up on her deck.
2. An engineering look at the hydrostatics drift (367.2 t against 375.41 t at 1.9 m), which predates this work.
3. Optional: storyteller places for the saloon's bow windows and the carpet room (the seats exist; no story uses them yet).
4. Small: in `tools/blender/build-minato-navigation-feeder.py`, drop `L1_cable_gland` 5 mm below `L1_mounting_foot`
   and regenerate the plan and GLB. Then remove the stand-in exception from `tests/ferry-z-fighting.test.mjs`.
