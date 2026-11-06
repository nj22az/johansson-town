# Johansson's house (ヨハンソン邸): the design book

The creator, 2026-10-13, with the drawings: *"Can you use these drawings and model Johansson’s house on the tropical island?"*
Three revisions came: Rev B (`cad-rev-b/`, a schematic set), Rev C (`cad-rev-c/`, three coordinated plans, the building
manifest and the shell) and the **Final Rev F** (`cad-rev-f/`, the coordinated game production reference: 21 DXF, the
drawing book, the architecture and services GLB, the building manifest (schema 2), the collision and navigation contract,
the schedules, the defect register, the validation record and the executable reference simulation of the house's
systems). **Rev F rules**; B and C are kept as the record. This folder is generated from what the game builds
(`node tools/johansson-house-drawings.mjs`; `tests/johansson-house.test.mjs` fails when a sheet is stale), so the house
in World, these drawings and the house in the stories are one house.

- **The drawings, read:** `src/world/johansson-house-cad.js`, generated from `cad-rev-f/` by
  `node tools/johansson-house-import.mjs`, which checks the package on the way in: every file against SHA256SUMS.txt,
  the collision contract against the manifest, each plan against the manifest cut 1 m over its floor, the schedules,
  the roof plan and the site plan. A wall or slab split round a service sleeve is one element there.
- **The house as built:** `src/world/johansson-house.js`: the drawings, and where they leave something open, the findings
  below. Nothing else departs from them.
- **Outside, in Kitano hamlet:** `src/world/johansson-house-build.js`, on plot `kitano-1` (`kitano-hamlet-layout.js`,
  `kitano-hamlet.js`), its front door the site `mayor-home`. The court and the lightwell are dug into the yard: the
  yard's slab and the island's ground are cut round them, the sea is not drawn in them (`ocean.js` `setOceanPits`:
  their floors are under its level), and the garden stair is a floor of the island that slopes through its nosings.
- **Inside:** `src/world/interiors/johansson-house-interior.js`, walked floor by floor with `src/world/house-walk.js`.
  The 17 sliding doors keep their state by id in the save, under `johansson.house.v2`.

A new revision: put it in `cad-rev-<x>/`, point the importer's `SOURCE` at it, run the importer, and the tests say
which finding it settles and what no longer fits.

## Particulars

| | |
|---|---|
| Footprint | 12 × 10 m outside, walls 200 mm, partitions 120 mm |
| Floors (finished, no offset) | Basement -2 800, ground 0, upper +2 800 mm; 2 800 mm floor to floor, slabs 180 mm |
| Clear heights | Basement 2 620, ground 2 620, upper 2 620 mm (to the roof deck, the upper floor's ceiling) |
| Roof | Hipped, weathered red tile: eaves +5 800, ridge +8 000 (2 m long), overhang 400 mm; two sleeves for the vent and the flue |
| Stair | Dog-leg, 16 risers × 175 mm a storey, goings 250 mm, flights 900 mm either side of a 200 mm gap, landing 900 mm; guards 1 100 mm; the flights stack 2.8 m apart |
| Doors | 18 between rooms, 900 mm clear, heads +2 100; 17 timber sliding leaves (RF1: one without) |
| Site | Yard level with the ground floor, 1.3 m above the sea; terrace behind; the court outside D-BEXT 1 400 × 1 300 mm at -2 800, the garden stair (16 × 175 mm, 1000 mm wide) up to the yard; the lightwell outside W-B1 |
| Rooms | 19: 6 on B1, 7 on G0, 6 on L1 |

## The sheets

| Sheet | File | What it is |
|---|---|---|
| B1 | `plan-B1.svg`, `as-built-B1.dxf` | Basement plan as built |
| G0 | `plan-G0.svg`, `as-built-G0.dxf` | Ground floor plan as built |
| L1 | `plan-L1.svg`, `as-built-L1.dxf` | Upper floor plan as built |

The DXF are in millimetres on Rev F's layers (A-WALL, A-OPENING, A-TAGS, A-ROOM, A-STAIR), with the game's own on layers of
their own (A-DOOR-LEAF, A-GUARD, A-GUARD-ADDED, A-OPENING-ADDED, E-LIGHT, E-SOCKET, M-EQUIPMENT), so they open over the
creator's sheets and show what was added.

## Rooms

| Id | Room | Area | What it is for |
|---|---|---|---|
| B1-ROOM-01 | Electrical workshop | 21.994 m² | Johansson’s bench, his meters and the parts drawers, and the board he wired to teach the island’s apprentices: the ship’s electrician’s workshop he kept when he came ashore. |
| B1-ROOM-02 | Club reading room | 21.994 m² | The reading club meets here: armchairs, the books, a bar; the high window on the lightwell lets in the day. |
| B1-ROOM-03 | Stair hall | 20.467 m² | The foot of the stair, the basement’s distribution board, the preserves and the typhoon kit under the genkan. |
| B1-ROOM-04 | Boiler and pumps | 11.146 m² | The water heater and the cold-water manifold, with its own door to the court and the garden stair (D-BEXT). |
| B1-ROOM-05 | Sauna and shower | 11.971 m² | A Swede’s sauna: the cedar cabin, the shower over the drain to the lift pump, the changing bench. |
| B1-ROOM-06 | Storage | 19.709 m² | Shelves, the fishing gear and the spare roof tiles; through it, the club and the far store. |
| G0-ROOM-01 | Living room | 21.994 m² | The low table, the television and the window to the garden. |
| G0-ROOM-02 | Kitchen and dining | 21.994 m² | The kitchen along the west wall, the dining table under the north window. |
| G0-ROOM-03 | Stair hall | 20.467 m² | The landing of the stair’s well and the way to the kitchen, the WC and the terrace. |
| G0-ROOM-04 | Thuan sewing studio | 16.306 m² | Thuan’s machine at the east window, her cutting table and her fabric. |
| G0-ROOM-05 | Entry and genkan | 10.627 m² | The front door, the stone floor where shoes come off, the boards and the meter, and the stair up and down. |
| G0-ROOM-06 | WC and utility | 6.811 m² | The toilet, the washbasin, the washing machine and the utility sink. |
| G0-ROOM-07 | Covered terrace access | 9.082 m² | Boots, the garden tools and the door out to the covered terrace (D-TERRACE). |
| L1-ROOM-01 | Primary bedroom | 21.994 m² | Johansson and Thuan’s room: the futons and the wardrobe. |
| L1-ROOM-02 | Guest bedroom | 21.994 m² | For visitors, and for Thuan’s sisters when the last boat has gone. |
| L1-ROOM-03 | Stair hall | 20.467 m² | The top of the stair, the upper floor’s board, and the suitcases under the window-less south wall. |
| L1-ROOM-04 | Bathroom | 11.146 m² | The ofuro under the east window, the washing place, the changing room with the basin. |
| L1-ROOM-05 | Study | 11.971 m² | The desk at the east window, the bookshelf, the town’s papers. |
| L1-ROOM-06 | Linen and landing | 19.709 m² | The linen and the airing rail under the landing window; the way to the guest room. |

## Findings

Where the house as built departs from Rev F, and why: for the next revision to settle.

### RF1. The genkan’s partition stands across the foot of the stair

- **Drawn:** G0-INT-ENTRY-00, 4 960–7 300 × 3 440–3 560, floor to soffit, between the genkan and the stair hall. Both flights meet the ground floor at y 3 700 (the flight down from it, RAMP-B1-B, and the flight up, RAMP-G0-A), and the navigation’s vertical links STAIR-B1 and STAIR-G0 end at y 3 200, in the genkan.
- **Problem:** The partition leaves 140 mm of floor in front of both flights: nobody can step off the stair onto the ground floor, or onto it, and the 0.25 m capsule cannot pass. The drawings’ own links say the stair opens into the genkan.
- **Built:** The partition stops at the well’s guard lines (x 5 060 and 7 140): between them it is a head over a 2.1 m opening, the height of every door head, so the stair rises from the genkan. D-G0-ENTRY-HALL stays a 900 mm doorway, without a leaf: 160 mm of its partition is left, too little for a 950 mm leaf to slide over.

### RF2. The upper floor’s edge over the foot of the flight is unguarded

- **Drawn:** Guards round the upper floor’s well on its west, east and north sides (OPENING-GUARD-L1-*); none along y 3 700.
- **Problem:** From x 5 060 to 6 200 the upper floor stops at y 3 700 over the flight up from the ground floor, its foot 2.6 m below: a fall.
- **Built:** A guard as the drawn ones along y 3 700 from the west guard to the top of the flight (x 5 100–6 200): posts 30 mm at 190 mm, 1.1 m, the rail on them.

### RF3. The inner side of each upper flight is unguarded

- **Drawn:** Each flight up from the landing to the next floor (B, x 6 200–7 100) has a guard and rail on its outer side (x 7 110). The inner rail (x 6 100) is the lower flight’s, 1.1 m over its nosings.
- **Problem:** The upper flight stands up to 2.2 m above the lower one beside it, across a 200 mm gap: an open drop along its whole inner edge.
- **Built:** The posts the outer side has, at the same nosings and 1.1 m high, on the upper flight’s inner string (x 6 170–6 200), and a rail on them. The strings are closed: a string either side of every flight, 50 mm over the nosings, and a soffit under the treads.

### RF4. The sockets stand off the walls

- **Drawn:** Each dry room’s socket is drawn 350 mm out from the nearer wall (B1-ROOM-01-SOCKET at 550, 900 in a room whose wall is at x 200).
- **Problem:** A socket is fixed to a wall.
- **Built:** Each socket on the nearest wall, at the drawn position along it and the drawn height (350 mm over the floor).

### RF5. The services are not built yet

- **Drawn:** Pipes, ducts, cables and the flue on their routes (Route_Schedule.csv, the R_*_3D drawings, Johansson_House_Services.glb), through sleeves in walls and slabs (Penetration_Schedule.csv).
- **Problem:** Open: they are the next batch, with the systems.
- **Built:** The sleeves (40–250 mm) are filled until the services go through them; the equipment the drawings place (the boards, the water heater, the manifold, the lift pump, the outdoor units) is built and can be looked at.

### RF6. The house’s systems are not running yet

- **Drawn:** source/reference_sim.py: electrics (single-phase three-wire 100/200 V, 60 Hz), water, drainage, ventilation and cooling, faults and repairs, saved under johansson.house.v2.
- **Problem:** Open: the next batch, with RF5.
- **Built:** The sliding doors keep their state under johansson.house.v2 (game.js); they start open, where the reference starts them shut, because a house is lived in with its doors open.

### RF7. The basement is under the sea’s level

- **Drawn:** Basement floor −2 800; game construction layers of 200 mm concrete, membrane, protection board, perimeter drain; the court’s storm sump and pump.
- **Problem:** On Kitano-jima the yard, level with the ground floor, is 1.3 m above the sea, so the basement floor and the court’s, 2.8 m under it, are 1.5 m below the sea (the lightwell’s, 1.8 m under it, 0.5 m below), in coral sand.
- **Built:** As drawn. A builder would check the tanked box against flotation: open.

### RF8. The plot round the house

- **Drawn:** An assumed plot, −6 000 to 18 000 × −7 000 to 16 000, not surveyed.
- **Problem:** Kitano-jima’s kitano-1 lies between the lane and the beach, its east side against rising ground.
- **Built:** The plot is 17 × 22 m round the house: 2.5 m either side (the lightwell, 1.3 m, west; the outdoor units, 1.25 m, east), 7.5 m in front (the garden stair’s top landing is 6.25 m out), 4.5 m behind (the terrace, 2 m).

## Rev C's findings, and Rev F

Rev C's twelve findings (F1–F12, the record in git) were never sent; Rev F settles all but one on its own:
the stair is a stacked dog-leg in the stair halls, the rooms over and under the genkan are part of the halls, every room
has a door, the study's window is in the study, the walls run to the slabs, the doors have heads, the site, the court,
the garden stair and the lightwell are drawn, the roof is a hipped tile roof, and the kitchen's sill is 850 over the
floor. The basement under the sea's level stays open (RF7). The genkan is level with the hall (Rev F): shoes come off on
the stone at the door, and a timber strip marks where.

## Open

- The services (RF5) and the systems (RF6): the routes of the electrics, water, drainage, ventilation and cooling, the
  flue and the vent through the roof, the downpipes, the supply from the pole; the reference simulation's 31 cases in the
  game, the faults and repairs, the alarms. The equipment the drawings place is built.
- D-BEXT, the basement's door onto the court, is bolted from inside (the story: the typhoon season); the court and the
  garden stair are walked, the door is not yet a way in. The reference's flood alarm, which closes the basement's links,
  comes with the systems.
- Game_Integration.md's host acceptance: every room walked on the desktop and the phone, the frame rate under the
  town's load, the save surviving a reload (the doors' does).
