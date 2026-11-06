# The Minato Maru in CAD: sheets X1–X3 (Rev B, 3 November 2026)

The owner, 3 November 2026:
- With a screenshot of her alongside Kitano-jima: *"The minato Ferry has lots of problems can you draw it in cad"* (Rev A).
- Then: *"Can you fix the problems ?"*, *"We need an interior stair case to the bridge as well"* and *"the accommodation
  needs to be more cosy and comfortable it should be fun to sit there and do nothing"* (Rev B).

The design book in the folder above draws her spaces as boxes. These sheets draw her **as she is actually modelled in
the game**. `tools/ferry-exterior-cad.mjs` builds `buildFerryModel()` in Node exactly as the game does. It projects every
visible triangle orthographically, removes hidden lines against a 10 mm depth buffer, and writes the visible outline,
feature and silhouette edges as vectors. For the plans and sections of X3, she is first cut by the plane, and the cut is
drawn heavy. Nothing on the ship is redrawn by hand.

| Sheet | Files | What it shows |
|---|---|---|
| JS-127-X1 | `JS-127-X1-exterior.svg` / `.dxf` / `.png` | Exterior as built, at sea with the ramp raised, at 1:100 on A1: starboard and port profiles, plan, and bow and stern elevations, with deck levels, the frame scale and the particulars. |
| JS-127-X2 | `JS-127-X2-kitano-problems.svg` / `.dxf` / `.png` | Alongside Kitano-jima, the pose in the owner's screenshot: the ramp laid on the pier by `restRamp()`, the lines laid as `createFerryRun` lays them. Profile and plan at 1:100, bow elevation at 1:50, and **Detail A** (the ramp toe on the pier) at 1:50. Also the findings with their state now, and the name and lane boards painted by the game's own code. |
| JS-127-X3 | `JS-127-X3-accommodation.svg` / `.dxf` / `.png` | New in Rev B: the accommodation and the crew stair, at 1:50. The passenger and bridge decks are planned 1.5 m above each deck; Section A–A runs up the crew stair and Section B–B through the saloon. It marks the seats anyone may take (S1–S3) and lists what changed. |
| all | `Minato_Maru_Exterior_CAD_RevB.pdf` | The three sheets as one vector A1 PDF. |
| — | `problems.json` | Every figure the sheets quote: heights, extents, the lines at both berths and every face they pierce, the ramp's clearance over its landings, the boards' measurements, and the findings with their state. |

The DXF files are AutoCAD R12 ASCII, in millimetres at sheet size; the views are at the scales printed under them.

- **Layers:** `OUTLINE`, `DETAIL`, `MARKING` (paint), `CUT` (sections), `WATERLINE`, `CENTRE`, `DIM`, `TEXT`, `ROOM`, `PIER`, `SECTION`, `HATCH`, `ROPE`, `SEAT`, `RESOLVED` (fixed findings, green) and `MARKUP` (open ones, red).
- **Validation:** all three open in ezdxf 1.x (`recover.readfile`) with no errors and no fixes.

**Regenerating:**
- Run `node tools/ferry-exterior-cad.mjs` from `johansson-town/`; it takes about 11 s.
- The PDF, the PNGs and the board measurements need the pre-installed Chromium. With `--no-pdf` it writes only the SVG, DXF and JSON.
- The sheets are a dated survey. Rev A (the problems as first found) is in git at commit `b6873c5`.

## Findings (Rev A found 1–4, Rev B found 5–6; all fixed in Rev B and measured again)

1. **At Kitano-jima the after spring and stern line ran through the ship.** In Rev A they ran 37–38 m from the
   port-quarter fairlead, through casing P and across the car deck, to pier bitts ahead of the bow. The yellow line in
   the screenshot.
   - *Fix:* each station keeps its own two ropes (`ferry.js` `FERRY_MOORING.ropes`). Bow-on at Kitano-jima she makes fast
     from both bows only, through the stem fairleads, to the bitts on each side; the bosun works the starboard bow and the
     stern ropes stay coiled aft.
   - The Minato head line also clipped the bow house's roof edge; it now leads through a new side chock.
   - The forward coils moved clear of the windlass drums.
   - *Now:* no laid line pierces her at either berth, with the ramp raised or laid.
2. **The bridge name board's names ran into each other** (about 25 px of overlap on an iPad).
   - *Fix:* the names are laid out from measured widths (`src/world/ferry-boards.js`).
   - *Now:* about 26 px between them.
3. **The lane boards' truck sign sat across a lane divider** and read as a stray "L".
   - *Fix:* a larger truck under a shortened centre arrow, with the dividers midway between the lanes.
   - *Now:* the truck is 22 px clear of each divider.
4. **The ramp's side girders ran into the pier** (0.28 m into Kitano-jima's, 0.33 m into Minato's plate). The flap's
   hinge pin also sank 2 cm into the landing.
   - *Fix:* the girders taper over the leaf's last 2 m, and the plate's toe and the flap's pin are flush.
   - *Now:* the laid ramp's lowest point is 0.000 m clear of its landing at both berths.
5. **The chart table stood in front of the starboard wing door**, so that wing could not be reached from inside.
   - *Fix:* the table moved to the aft bulkhead.
   - *Now:* it is 0.47 m clear of both doors' ways in.
6. **The saloon's front row stood 0.25 m out through the forward wall.** Seven rows of three at 0.85 m did not fit:
   42 seats were claimed where 36 fitted.
   - *Fix:* five rows at 0.88 m.
   - *Now:* the front row ends 1.08 m inside the wall.

## What changed with the stair and the accommodation (Rev B)

### Crew stair to the wheelhouse (`ferry-interior.js` `FERRY_CREW_STAIR`)
- **The flight:** straight, 0.8 m clear, 13 risers of 0.2 m at 45°.
- **The enclosure:** a trunk on the saloon's starboard side, entered from the cross passage through a doorway with an
  indigo noren and the sign 乗組員専用 (crew only). A framed chart of the crossing hangs on the trunk's face.
- **The well:** it rises through the master's cabin's forward outboard corner, walled off, into the wheelhouse's aft
  starboard corner. There it is railed and arrives beside the starboard wing door, which moved 0.85 m forward.
- **The master's cabin:** the bunk now runs along the corridor's wall, the safe sits under the desk, and the locker stands
  in the forward corner.

### The saloon (`FERRY_SALOON`)
- **Seats:** 34 reclining seats in terracotta moquette, 0.7 m a place, with wooden arms and white head covers.
- **Layout:** five rows at 0.88 m facing the bow, with a 0.9 m aisle.
- **Room:** a rose-brown carpet, cream curtains tied back at the side windows, a teak ledge under the bow windows, and a
  pothos from Sakura.

### The carpet room
- A round low table each side, with zabuton, tea cups, pillows and folded blankets.
- The reading rack at the forward partition: the town paper (printed at Front-Row), and manga and paperbacks from Sakura.

### Seats you can take (`FERRY_PASSENGER_SEATS`)
- S1 by the bow windows, S2 the port window seat, S3 a cushion in the carpet room.
- `game.js` keeps a seat aboard in her frame, so she carries you across while you sit.

### Places for 100 passengers

| Space | Places |
|---|---|
| Open deck | 22 |
| Lobby benches | 6 (now counted) |
| Carpet room | 38 |
| Saloon | 34 |
| **Total** | **100** |

## Limits

- **What the survey covers:** the hull, superstructure, fittings, ramp and interior as `buildFerryModel()` builds them.
  - Not drawn: people, crew figures, the shore other than the Kitano pier outline and section (from `AIRPORT_JETTY`), and
    the engine-room GLB, which loads only in the browser.
- **Hidden-line accuracy:** removal samples a 10 mm depth buffer, with a 20 mm depth tolerance and a one-pixel
  neighbourhood.
  - Edges within about 10 mm of a nearer surface's outline may show.
  - Feature edges are faces meeting at 50° or more.
- **Board measurements:** measured in this Chromium's fonts and in Helvetica Bold's advance widths; no physical iPad was
  used.
- **Approval:** this is an as-built survey of a game vessel. No flag, class or construction approval exists.
