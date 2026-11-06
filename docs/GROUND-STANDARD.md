# One ground for Minato: the standard

The owner, 21 October 2026, on his phone: "the roads seems to have reversed to chaos again… Can you make a plan to
finally fix the roads to a unified system? Pavement? Walk paths, grass and sandy beach?" The plan was approved
("Go ahead"). This page is the plan of record. It covers the rulebook, the edges, the audit and what it finds today, and
the order of the work.

- **The rulebook** is `src/world/ground-standard.js`. It is the only place a ground colour, height or edge is written.
  The old `render/ground-palette.js` `GROUND`, `world/ground-layers.js` `GROUND_LAYER` and
  `world/road-standards.js` `ROAD_STANDARD.kerb` now just re-export it.
- **The audit** is `tools/ground-audit.mjs`. It builds the town and samples a 25 cm grid over it. At each point it takes
  the ground a person stands on and checks it against the rulebook.
- **The ratchet** is `tests/ground-standard.test.mjs`. Since step 4 its list (`tests/fixtures/ground-baseline.json`) is
  empty, and the test fails on any finding. Until then it failed on a new finding, one that grew, and one fixed but still
  listed, so the list could only shrink.

## Why the ground was chaos (the survey, 21 October)

- About twenty modules each drew their own ground slab. Between them they used about thirty colours (the palette had
  seven), about fifteen top heights (the layers named three) and four kinds of kerb.
- Nothing said what happens where two surfaces meet.
- `streetClass()` regexes gave every building a 2 m concrete or brick ring (`building-circuit-*`), even in sand or lawn.
- The phase-4 removals left paths that end in grass.
- `walk-surface.js` raycasts whatever is drawn, so a slab at the wrong height never failed.
- The z-fighting and ground-clearance tests skip polygon-offset surfaces. No test checked edges or connections.

## The rulebook

Heights are the top of the finished surface above the district's datum. The datum is the town plan's 0 (`layout.js`
`planHeight`). The open island ground outside the town lies 40 cm lower. Colours are the material colour in sRGB.
**Today** is the tone the town draws a class in until its step moves it; step 1 changes nothing that is drawn.

| Class | Belongs in | Top | Standard colour | Today | Finish |
|---|---|---|---|---|---|
| Asphalt road (`road`) | Main Street, Kitano Road, the quay driveway, car parks | 4 cm (the carriageway is the datum's finished surface) | `#5f6266` dark grey | `#a9aeb4` blue-grey | dense asphalt, patched where dug up |
| Back lane (`lane`) | Kitahama, Nishi, between houses; no footway | 4 cm | `#676a6c` | concrete `#b7b5ab` | thin asphalt over concrete, patched |
| Brick pavers (`pavers`) | Main Street's footways and shop fronts only | 19 cm (one kerb above the road) | `#b0907a` reddish beige | `#c6c3ba` at 4 cm | interlocking blocks, reddish and beige |
| Concrete (`concrete`) | aprons, forecourts, yards, other footways | 19 cm beside a road; flush (4 cm) where no road is beside it | `#c4c0b4` pale grey-beige | `#b7b5ab` | poured in 2 m bays, broom finish |
| Quay concrete (`quay`) | the quays and piers | its own level, 4 cm ±8 | `#b3b0a6` | several greys | heavy concrete; coping at the water |
| Park path (`park-path`) | Harbour Park, the school, the east lawn | 4 cm, flush with the grass edging | `#cbb994` | `#cfc2a0`, `#d2c39d` | rolled crushed stone |
| Grass (`grass`) | lawns and verges | 2 cm, just below the paths; follows the land where it slopes | `#5c9848` | same | mown lawn |
| Coral sand (`coral-sand`) | Nishi-machi's yards; Kitahama's unpaved lots | 2 cm, like grass | `#ddd6c4` | `#e2dac8` | crushed coral, raked |
| Beach sand (`beach-sand`) | the coast | graded down to the sea, −1.3 to +0.06 m | `#eee3c6` coral-white | `#e3d2a4` | beach sand |
| Gravel yard (`gravel`) | work yards, the boat yard, the sacred grove, the power house's compound | 2 cm | `#a29e93` | same | grey crushed limestone |
| Garden earth (`earth`) | Kitahama's and Nishi's plots, beds and cane rows | 4.5 cm (25 mm proud of the lawn) | `#9a5f40` | same | red Okinawan earth |
| Timber deck (`deck`) | boardwalks and timber piers | the quay's level | `#8a7559` | several browns | treated timber boards |

Each class records in the data where it belongs and why. The audit reports a class drawn outside those districts as
*out of place*.

### The edge elements

| Edge | Size | Colour |
|---|---|---|
| Concrete kerb | 15 cm high, 18 cm wide (dropped flush at crossings) | `#cac6bb` |
| White edge line | 15 cm wide, 30 cm in from the lane's edge | `#f2efe6` |
| U-gutter with concrete lids | 30 cm wide, lids flush with the lane | `#8d918f` (Kitahama's lid tints are accepted) |
| Stone edging | 10 cm wide, top flush with the path | `#9e9a8f` |
| Coral-stone edging | 15 cm wide | `#d8cfba` |
| Quay coping | 30 cm, painted safety yellow where boats come alongside | `#e0b93a` |

### The edge rules: what stands between two classes

| Meeting | Edge |
|---|---|
| road / pavers, road / concrete, road / grass, road / park path, road / coral sand, road / gravel, lane / pavers | **kerb**, 15 cm |
| lane / concrete, lane / grass, lane / coral sand, lane / gravel, lane / earth | **white edge line and U-gutter** |
| park path / grass, concrete / grass, pavers / grass, grass / gravel, concrete / gravel, earth / concrete, earth / gravel | **stone edging** |
| coral sand / grass, coral sand / concrete, coral sand / park path, coral sand / earth | **coral-stone edging** |
| grass / beach, park path / beach, coral sand / beach, concrete / beach, quay / beach | **graded**, never a step |
| road / lane, road / quay, road / deck, lane / park path, lane / quay, pavers / concrete, pavers / park path, concrete / quay, concrete / park path, concrete / deck, quay / deck, quay / gravel, earth / grass | **flush** (a joint and nothing else) |
| any pair not listed | stone edging: two surfaces never simply touch |

## The audit

`node tools/ground-audit.mjs` prints the counts by district and by kind, the ten worst places and the largest findings.
`--json` prints everything. `--diff` shows what the ratchet would say. `--write-baseline` records a fix, and should be
run only after one.

1. **Collecting surfaces.** It builds the town as the geometry tests do. It collects every upward-facing surface with a
   top below 20 cm over a square metre, polygon-offset slabs included. Road paint and other decals are recorded as
   markings on top. It leaves out water, boats, a building's own plinth, porch, step or shop front, and anything
   under a roof.
2. **Classifying them.** The audit takes a drawing's word for its class where the drawing gives one. A coordinated
   street patch knows its street class, and some meshes are named for what they are, such as "Main Street footway" or
   "Kitano Road carriageway". Everything else is classed by colour, using the nearest of the rulebook's standard and
   current tones; height and district break ties. A colour far from all of them is classed *unknown*.
3. **What it reports.** Each finding has a stable key:
   - *colour*: off the standard, in m².
   - *height*: off the class's top, in m².
   - *place*: a class outside its districts, in m².
   - *seam*: two classes meeting without the edge their rule needs, in metres. A kerb counts if there is a kerb strip
     or a 10–20 cm step. A line and gutter counts if there is paint or gutter lids. Edging counts if there is an edging
     strip. Graded counts if the step is under 5 cm.
   - *dead end*: a route in `layout.js` `ROUTES` or the park's paths that ends in grass, sand or nothing. A route that
     ends at another route, at firm paving, at the water or within 2 m of a building does not count.

## What it finds today (21 October 2026, before step 2)

| District | Findings | Off colour m² | Wrong height m² | Out of place m² | Seams with no edge, m | Dead ends |
|---|---|---|---|---|---|---|
| Main Street | 48 | 775 | 360 | 15 | 97 | 0 |
| Harbour | 36 | 424 | 354 | 48 | 46 | 0 |
| Kitahama | 75 | 2243 | 174 | 0 | 683 | 0 |
| Nishi-machi | 31 | 782 | 13 | 0 | 413 | 0 |
| West yard | 41 | 326 | 38 | 10 | 219 | 0 |
| Harbour Park | 38 | 397 | 30 | 11 | 299 | 1 |
| East lawn | 45 | 264 | 60 | 6 | 191 | 0 |
| School | 22 | 219 | 169 | 16 | 27 | 0 |
| Beach | 26 | 717 | 92 | 4 | 132 | 0 |
| **All Minato** | **362** | **6146** | **1290** | **110** | **2106** | **1** |

By kind: 113 colour findings, 70 height, 16 out of place, 162 seams and 1 dead end.

Most of the colour area is three palette families: asphalt drawn blue-grey, Kitahama and Nishi lanes drawn in concrete,
and pavers in grey. Each is one change in the rulebook's `drawn` once its district is rebuilt. The seams and heights are
the real chaos:

- Main Street's footway is flush with the road (4 cm against 19 cm).
- Concrete building circuits run into lawns with no edging.
- Nishi's coral yards meet the lanes with no gutter.
- In three places the bare island ground, 40 cm under the plan, shows through:
  - Kitano Road's junction with Main Street, around x 2.5, z 0.75 (a 44 cm step);
  - the harbour's east corner, x 21.75, z −38.25;
  - the harbour's west corner, x −39.25, z −44.25.

### The worst ten places (6 m squares)

Scores add up what is wrong on the ground in each square. A metre of seam with no edge counts 4. A square metre at the
wrong height or out of place counts 1. A dead end counts 20.

| # | Centre (x, z) | District | Score | What |
|---|---|---|---|---|
| 1 | 39, 33 | school / Kitahama | 116 | building circuit against lane and lawn with no gutter or edging; the school yard against bare island ground |
| 2 | 27, −33 | Harbour Park | 111 | gravel walks and the onsen's circuit against the lawn with no edging; park furnishings at the wrong height |
| 3 | 39, 27 | school / beach | 105 | circuit, school yard and beach sand meeting the lawn and bare island ground with no edge |
| 4 | −33, 21 | Nishi-machi | 101 | coral yards against lanes and concrete with no gutter or coral edging |
| 5 | 39, 39 | school / Kitahama | 98 | the same corner as 1, further north |
| 6 | 27, −27 | Harbour Park | 95 | Umi-no-yu's yard and circuit against the lawn with no edging |
| 7 | 33, −33 | east lawn / beach | 92 | park walks against the east lawn; beach sand against bare ground and a circuit |
| 8 | −33, 15 | Nishi-machi | 88 | coral yards against lanes, with no gutter |
| 9 | −9, 9 | west yard / Main Street | 88 | circuits and footway against the yard lawn; the freight pullout against the footway with no kerb |
| 10 | −27, 15 | Nishi-machi | 87 | coral yards against lanes and the west yard lawn |

For step 2, the worst places in Main Street and the harbour are:

- **Main Street**:
  - x 3, z −27: the parking lay-by and the footway, with no kerb;
  - x 3, z 3: the Kitano Road junction (bare ground, no kerb);
  - x 3, z −33: the quay driveway against the footway;
  - x 3, z −15: the south shop crossing, which ends in the park's lawn;
  - x −3, z 27: the bus plaza;
  - x 3, z 15: the service turnout.
- **The harbour**:
  - x 33, z −39 and x 39, z −45: the east quay's apron is 6 cm high, not at its own level, and meets the beach and bare
    ground;
  - x −39, z −45: the Nishi quay's apron;
  - x −21, z −39: the docklands against the west yard.

## Step 2: Main Street and the harbour on the generator (21 October 2026)

Main Street, the bus plaza and the harbour are no longer drawn by the modules that stand on them. They are laid by one
generator from the rulebook:

- **The plans** say what lies where. `src/world/ground-plan.js` holds Main Street and the bus plaza, and
  `src/world/ground-plan-harbour.js` holds the quays. A plan is a list of layers in the order a paving gang lays them:
  the footway everywhere, then the carriageway cut through it, then the kerbs. Each layer is a rectangle of one class
  or edge, with its top and the reason it is there. A top is a number, a straight grade, or flush with the surface it
  is set in. `partitionPlan()` cuts the layers into disjoint pieces, so no two surfaces lie one on the other.
- **The generator** is `src/world/ground-build.js`. It lays any list of plans as one merged mesh per class, each with
  one shared material in the rulebook's colour and painted finish. It adds one mesh for each kind of edge: the kerbs,
  the stone edging and the quay copings. A slab draws its sides only where they show: a kerb's face down to the road, a
  ramp's flank, a quay's edge over the water. Steps 3 and 4 add their districts' plans in the same form.
- **Main Street's datum is a kerb under the town's** (`ground-standard.js` `MAIN_STREET_DATUM`, −0.15 m). The rulebook
  puts the footway a kerb above the road. The street was brought to that by lowering the carriageway and its bays, not
  by raising the footways. So every shop door, step, drinks machine, bench and lamp on the footway stands where it
  stood, and the footways stay flush with the yard, the park and the lawns behind them.
  - The carriageway is graded back to the town's level where it leaves the street: onto the quay over its last 2 m
    (7.5 %), onto the lane beyond the bus plaza over 3 m (5 %), and up onto Kitano Road's mouth (7.5 %). The mouth is
    a raised table at the footway's level, so the footway crosses the side road on the flat.
  - The plans declare these grades (`MAIN_STREET_GRADES`), and the audit measures the tops over the graded datum there
    (`datumShift`).
  - `layout.js` `planHeight` follows the lowered road (`streetDrop`), so people step down onto it. The traffic's wheels
    stand on the laid ground (`groundTopAt`, `town-traffic.js`); before, they stood 4 cm into the old road.
- **The kerbs**: 15 cm along the carriageway and round every bay (the freight pullout, the lay-by, the cargo
  driveway), set 5 mm proud of the footway. They are dropped at both ends of the two zebras and at the bus stop's
  crossing, with a ramp behind each drop, the kerb tapering down to it, and the yellow warning blocks bedded at the top
  of the ramp, its flanks flared into the footway.
  - The lay-by runs on past its bay to where its kerb used to be dropped (`MAIN_PARKING_LAYBY.kerbTo`). The harbour
    master's car pulls out forwards and stays on the road's level.
  - The car stands 10 cm further from the lay-by's kerb, and the delivery van's turn swings round west of the crown into
    the pullout's north end (`town-traffic.js`). Wheels and bodies stay on the road, and parked cars stand on its top.
  - The shop crossing's west end lands in the freight pullout. Its kerb is dropped at the pullout's south end, by the
    bookshop's door.
  - Its east end lands in Kitano Road's mouth, which rises to the footway's level: nothing to drop there.
  - The service turnout's east half (to x 0.35) is footway now, with the bench, the post box and the utility cabinet on
    it.
- **The footways** are the reddish and beige pavers, kerb to shop front. Behind the west shop line and in front of the
  East Row and the park, a strip of concrete runs out to where the old footway reached, flush with what lies beyond,
  with a row of setts (stone edging) at its back. The building circuits under Main Street are masked
  (`street-plan.js`): a shop front's apron is the street's paving.
- **The quays** are one plan.
  - The main quay keeps its level (−16 mm, where the ferry's plate is let in). It rises over its last 1.5 m to meet
    Main Street's footways and road on their level.
  - The Nishi and east aprons (6 cm) come down to the main quay over 1.5 m each.
  - The Nishi apron runs under its seawall, where the bare island ground showed between them.
  - North of the oil jetty, the east apron runs out to the water. Bare bank and the beach's tail showed there before.
    The quay ends at the shore in a wall with its coping.
  - The copings (the main quay's raised kerb with its bollards, the aprons' low yellow one) are the generator's.
  - The quays meet the yard, the park and the lawns at a row of setts.
- **Deleted**: the slabs, kerbs and copings that `harbour.js`, `boardwalk.js` (now only the street's paint and
  ironwork, laid on the road at its height), `okinawa/quarters.js` (the East Row's aprons, the Nishi and east quays'
  aprons and copings), `docklands-life.js` (the cargo yard's slab), `kitano-link.js` (the mouth, west of the back
  strip) and the lane patches drew there. The bookshop's passage stops at the back strip.
- **Also fixed on the way**:
  - The audit leaves out the loose and the fitted, as it already did for crates: a drinks machine, a pallet, the
    ferry's landing plate and the frame under a pier's deck.
  - Mr Fujita's pier's boards are the rulebook's timber deck, a shade either way. Its toe boards are a mesh of their
    own: a pier's edge, as a coping is a quay's.
  - The oil jetty's pile heads no longer come up through its deck, and the outer pier's mass is the quay's concrete.
  - Kitano Road's footway lies flush with the Main Street footway it runs on from. It stood 4 cm proud of it.

Main Street and the harbour have no findings left. Elsewhere nothing is new, and what lay under the old slabs is
counted where it now shows: the lot pad under the East Row's drinks machines (`lot-dressing.js`), 1.7 m².

| District | Findings | Off colour m² | Wrong height m² | Out of place m² | Seams with no edge, m | Dead ends |
|---|---|---|---|---|---|---|
| Main Street | 48 → 0 | 775 → 0 | 360 → 0 | 15 → 0 | 97 → 0 | 0 |
| Harbour | 36 → 0 | 424 → 0 | 354 → 0 | 48 → 0 | 46 → 0 | 0 |
| Kitahama | 75 → 71 | 2243 → 2243 | 174 → 174 | 0 | 682 → 682 | 0 |
| Nishi-machi | 31 → 28 | 782 → 778 | 12 → 9 | 0 | 413 → 411 | 0 |
| West yard | 41 → 31 | 326 → 313 | 38 → 25 | 10 → 1 | 219 → 212 | 0 |
| Harbour Park | 38 → 29 | 396 → 385 | 30 → 20 | 11 → 1 | 299 → 284 | 1 |
| East lawn | 45 → 32 | 264 → 259 | 60 → 9 | 6 → 1 | 190 → 172 | 0 |
| School | 22 → 22 | 219 → 219 | 169 → 169 | 16 → 16 | 27 → 27 | 0 |
| Beach | 26 → 25 | 717 → 714 | 92 → 90 | 4 → 4 | 132 → 131 | 0 |
| **All Minato** | **362 → 238** | **6146 → 4911** | **1290 → 497** | **110 → 21** | **2106 → 1918** | **1** |

## Step 3: Kitahama, Nishi-machi, the west yard and the town hall (21 October 2026)

Four more districts are laid by the generator, from `src/world/ground-plan-quarters.js` (one plan each, in the form of
step 2's), and the lane builder (`lane-surfaces.js`) lays nothing there any more (`street-plan.js`
`laidByQuarterPlan`): only the coastal walk round Kitahama's shore keeps its paving, for step 4.

- **Kitahama.** Every lane is back-lane asphalt (`lane`, 4 cm, `#676a6c`), the north cross lane and the link to the
  coastal walk with them. Main Street north of the bus plaza is one of them: its old footways are the walking strips
  (路側帯) outside two white edge lines, where the kerbs were (`KITAHAMA_MAIN`).
  - The U-gutters of `okinawa/lane-edges.js` are the lanes' edge, unchanged in look. The plan holds their ground
    (`drawnBy: 'lane-edges'`), so nothing is laid under or over a gutter, and lane-edges draws exactly the plan's runs
    (`quarterGutterRuns`). The pure part moved to `okinawa/lane-edge-plan.js`.
  - A walled plot's ring now lies against its lane however far the plot stands back from it (3 and 8 Kitahama on the
    footpath, the Heights on Fukugi Lane: up to 1.6 m), the earth strip widening to meet it. The circuits used to
    hide a strip of lawn and a second gutter there.
  - Where a lane runs beside other paving with no gutter between (the coastal walk, the police station's yard), or
    ends on the lawn, it carries its white edge line, 30 cm in.
  - **The houses meet the lane by their own gate and the gutter.** No building circuit is paved in a lane district.
  - The cleared lots' pads are the plan's: the monthly parking and the eisa ground in crushed coral, the hoop's pad in
    concrete, the cane's red earth. The parking's bay lines and the hoop's key are the plan's paint
    (`lot-dressing.js lotPaint`), in the same places. The cars, the bays and the wheel stops are unchanged, and the
    pad is at the height the cars always stood on (4.5 cm). The rulebook now names that height: `coral-sand.raisedTop`,
    a pad rolled on a sub-base where wheels or feet work it, 25 mm proud of the lawn as a dug bed is.
  - The coral and concrete pads are edged against the lawn: coral-stone or stone setts, laid inside the pad.
  - The police station's yard is the plan's concrete, from the footway to the north lane. The service walk that
    crosses it keeps its paving, and the plan leaves a hole for it.
- **Nishi-machi.** The quarter's crushed coral (`#ddd6c4`, 2 cm) covers the yards from the seawall to the west yard
  and from the quay's setts to the north lane. The lanes and the seawall walk are back-lane asphalt.
  - Every yard side of a lane has a U-gutter. Gratings are set across the Higa gate, Gran Higa's garden gate and the
    utaki's opening, and a grated channel runs across each lane's end where it meets the west yard (where the old yard
    wall's gaps were).
  - The plots stand 0.3 m from their lanes, exactly a gutter's width.
  - The utaki is grey gravel. Its limestone stepping stones are set into it, 14 mm proud, with the gravel left out
    under them (`okinawa/layout.js utakiStones`).
  - A coral-stone edging runs where the coral meets the west yard's lawn, and where it meets the grove's gravel.
- **The west yard.** The lawn stays. The buildings (Sakura, Minato and the ramen shop, the bookshop pair, the coin
  laundry, 2 Front-Row Yard, the warehouse's yard end) stand on concrete aprons to their walls, as far out as their
  circuits reached. Also laid in concrete, flush: Sakura's service apron (`SAKURA_BACK.strip`), the bookshop–Minato
  passage, Higa Liquor's crate yard, the bicycle shed's slab, the yard's paths, the coastal walk's stretch down its
  west edge, and the Nishi lanes run on into the yard to the aprons they lead to. Every edge on the lawn is a row of
  setts, except at Sakura's back wall.
- **The town hall.** The old school's single painted plane is replaced by ground:
  - the yard in rolled crushed stone (the rulebook's park path, 4 cm);
  - a concrete forecourt from the gate to the canopy, and concrete aprons along the breezeway, round the power house
    and under the fuel tank's bund;
  - a concrete car park with its bays painted (its 来客用 lettering is still a decal);
  - the bicycle shed's pad;
  - a lawn with its flower bed, edged in setts;
  - turf verges outside the boundary wall and along the east side, where bare island ground showed.

  The rulebook lists the north lane (`lane`) and the flower bed (`earth`) as belonging in the school's district: the
  lane runs along the hall's back wall over the old seawall line.
- **Deleted.** Deleted ground slabs and the code that drew them:
  - the quarter's coral block and the grove's gravel (`quarters.js`);
  - the lots' pads (`lots.js lotGround` calls, in `lot-dressing.js` and the crate yard);
  - Sakura's service apron's bays (`old-town.js`);
  - the bookshop passage (`west-shops.js`);
  - the school's painted yard (`school.js`);
  - every lane-builder patch in these districts.
- **What stands on it.** Everything stands where it stood, or on the ground under it:
  - The bicycles under the town hall's shed and the yard's shed stand on their new slabs.
  - The steel sheds stand on footing blocks, not a slab.
  - The rubbish cage has a frame at its foot, not a plate.
  - The condensers behind Sakura stand on a plinth each.
  - The town hall's monument has a named plinth.
  - The Kitahama sandpit's sand is the beach's, 3 cm over the lawn.
  - The drinks corner on the post-office lot backs onto a block screen wall (`lots.js POST_OFFICE`).
- **The audit** (`tools/ground-audit.mjs`), three refinements, each a reading of what is drawn:
  - It takes the generator's word for a mesh's class (`userData.groundClass`).
  - A piece of a merged kit mesh with less than a square metre of upward faces is furniture, as a whole mesh already
    was. So is a piece drawn by a file named for what stands on the ground (`stairs.js`, `parked-bicycle.js`).
  - A seam under a wall needs no edge strip: a collider at least 0.5 m high, at most 0.8 m thick and at least 1.2 m
    long stands between the two surfaces.

| District | Findings | Off colour m² | Wrong height m² | Out of place m² | Seams with no edge, m | Dead ends |
|---|---|---|---|---|---|---|
| Kitahama | 71 → 14 | 2243 → 418 | 174 → 49 | 0 | 682 → 200 | 0 |
| Nishi-machi | 28 → 0 | 778 → 0 | 9 → 0 | 0 | 411 → 0 | 0 |
| West yard | 31 → 0 | 313 → 0 | 25 → 0 | 0.6 → 0 | 212 → 0 | 0 |
| School | 22 → 0 | 219 → 0 | 169 → 0 | 16 → 0 | 27 → 0 | 0 |
| East lawn | 32 → 19 | 259 → 228 | 9 → 7 | 0.8 → 0 | 172 → 148 | 0 |
| Beach | 25 → 17 | 714 → 710 | 90 → 91 | 3.5 → 0.8 | 131 → 122 | 0 |
| Harbour Park | 29 → 29 | 385 → 385 | 20 → 20 | 0.7 → 0.7 | 280 → 275 | 1 |
| **All Minato** | **238 → 79** | **4911 → 1742** | **497 → 167** | **21 → 1.5** | **1914 → 745** | **1** |

What is left in Kitahama is step 4's:
- the coastal walk round its shore: its colour, its top, and its seam with the lawn;
- the west shore's bank: its coping, pitching and sand, and the tetrapod gravel.

Two of step 4's findings grew a little, and nothing is new:
- The coastal walk's colour area grew from 346 to 372 m². The lattice now finds the walk, not the lane, on the line
  where the two meet: the walk is a polygon-offset decal, and it wins the tie.
- The east lawn's footway at the town hall's gate grew from 1.5 to 3.25 m of seam with the lawn. The town hall's
  circuit band no longer covers the lawn beside the footway's end.

## Step 4: the beach, the coast, the park and the lawns (21 October 2026)

The last of the town is on the rulebook, and the ratchet's baseline is empty: `tests/ground-standard.test.mjs` now fails
on any finding at all.

- **The walks across the lawns** are laid from `src/world/ground-plan-coast.js` by a second generator,
  `src/world/ground-paths.js`. A park's walks bend at any angle and meet in round joins, which the rectangle generator
  cannot lay, so this one takes convex polygons:
  - it cuts the walks into disjoint pieces, the first walk listed owning a junction;
  - it finds the outline of their union and lays a 10 cm row of setts outside it wherever the rulebook asks for stone
    edging (a lawn), with the corners filled round;
  - it lays one mesh per class in the generator's shared materials (`ground-build.js groundMaterial`), and one for the
    setts, 3 mm proud of the walk.
- **Harbour Park.** Every walk, the stone walks and the pond's circuit alike, is the rulebook's park path (rolled
  crushed stone, 4 cm, flush with the turf at 2 cm), edged in setts where it meets the turf.
  - Umi-no-yu stands on the lawn: the concrete ring round it is gone. A forecourt of the same crushed stone runs from the walks to its
    porch, with the footbath on it and the bathhouse's stepping stones set 2 cm proud in it (`ONSEN_GROUND`). The
    raised 8 cm porch apron that hid the stones is gone. The bath behind its fence is the bathhouse's own. The fallback
    shell's floor there is an enclosure's floor, and the audit leaves it out as it does a plinth.
  - The pond's edge stones and reeds are a kit of their own (`Harbour Park pond edge`): the pond's, not ground.
  - The park rework (21 October 2026): the flower beds are the rulebook's garden earth (`harbour-park` added to its
    districts), laid by the same generator from `harbour-park-garden.js HARBOUR_PARK_BEDS` with their sides down into the
    turf, each clear of the walks' setts by a strip of lawn; what grows in them, who keeps them and why is that file's data.
    The cherry walk leaves the approach a few metres in and the walk north starts on the bathhouse walk beside the
    forecourt, so the lawns are whole beds rather than a triangle at the gate and a sliver by the forecourt.
  - The south shop crossing ended in the park's lawn past the footway. It now ends on the east footway, where the
    park's approach begins (`layout.js`).
- **The east lawn.**
  - The service walk to the town hall's gate and the walk along the park's south edge to the harbour office are
    concrete, flush and edged (`ground-walks.js LAID_WALKS` says which routes are walks and why).
  - Kitano Road's carriageway is the rulebook's asphalt. Its 10 cm gutter strip on the lawn side is a 15 cm kerb now,
    dropped where the service walk crosses, and the lawn's zebra is moved onto that crossing. A kerb closes the road's
    end. Its footway is concrete at the road's level, edged on the lawn.
  - The drinks corner's pad (`lots.js POST_OFFICE`) is flush concrete, edged. The machines and the bench stand on it.
  - Main Street's frontage strip runs on to the police station's yard, under the station's street face and doors.
    The station's circuit used to fill that gap.
  - Every building circuit on the lawns is gone: the police station, Higa Liquor, the power house, the town hall, the
    fish auction, the port building and the shrine stand in their lawn.
- **The beach** (`beach-layout.js`, drawn by `east-lawn.js buildBeachSand`):
  - It is coral-white dry sand. Below the tide line (`beach-sand.wetBelow`, y −0.32) a band of wet sand runs to the
    water, blending over a couple of centimetres of height, and the sand goes on down under the sea.
  - It is graded up, never stepped, to everything firm on its edges (`BEACH_GRADES`): the quay's edge north of the oil
    jetty, the fuel depot's court, the town hall's yard and verge, the lawn past the parapet's north end, Kitahama's
    lawn, and the coastal walk where it comes down onto the sand.
  - **The east quay's corner** (approved by the owner): step 2 had laid quay concrete over the strip of beach and grass
    north of the oil jetty. The quay now ends there at x 42.3, in line with the fuel depot's court and the forklift's
    bay, and the beach runs from its edge to the water. South of the jetty's root the quay keeps its coping at the
    water. The sand runs on under the jetty's deck.
  - The fuel depot's service court is the harbour plan's: flush concrete, from the parapet to x 42.3, opening off the
    quay. The depot's paving ring and the court's 2 cm box are gone.
  - The coastal walk's strip of wet sand along the beach is gone: on the beach the walk is the sand. The
    neighbourhood's lawn no longer lies over the sand at the beach's north end. The beach runs on to the town hall's
    grounds and the coastal walk, with the beach corner's chairs on sand, not grass.
- **Kitahama's coastal walk** is concrete, flush and edged on the lawn, cut at the lanes it runs beside. The quarter
  plans leave it its ground and paint the lanes' edge line beside it. The neighbourhood's level ground runs out to its
  setts on the north shore (`NEIGHBOURHOOD.maxZ` 93.4), where the walk used to ride down the bank.
- **The west shore.** The bank's coping, its foreshore of wet sand and the armour stones on it are meshes named for what
  they are: a coping, the beach's wet band, and the rock armour at the water.
- **The lane builder lays nothing** (`street-plan.js coordinatedStreetPatches`). `streetPieces` is the junction owner's
  cut of the routes, and the plans lay from it.
- **The audit**, refined, each change with its reason in `tools/ground-audit.mjs`:
  - Beach sand may be its wet tone, or a blend towards it, at the tide line's height.
  - An edge narrower than the lattice (setts laid at an angle) is found by looking along the seam at 2.5 cm.
  - A lane's edge line is looked for within 0.8 m (it lies 30 cm in and is 15 cm wide), at a lane's corner along its
    other side too.
  - A deck on piles over the sand (the oil jetty's root) is no seam with it.
  - On the line where two surfaces of one height meet, the lattice gives each point to the same one all along it.
    Before, the last bit of rounding decided.
  - `--where=TEXT` prints every point of a finding.

| District | Findings | Off colour m² | Wrong height m² | Out of place m² | Seams with no edge, m | Dead ends |
|---|---|---|---|---|---|---|
| Kitahama | 14 → 0 | 418 → 0 | 49 → 0 | 0 | 200 → 0 | 0 |
| East lawn | 19 → 0 | 228 → 0 | 7 → 0 | 0 | 148 → 0 | 0 |
| Beach | 17 → 0 | 710 → 0 | 91 → 0 | 0.8 → 0 | 122 → 0 | 0 |
| Harbour Park | 29 → 0 | 385 → 0 | 20 → 0 | 0.7 → 0 | 275 → 0 | 1 → 0 |
| **All Minato** | **79 → 0** | **1742 → 0** | **167 → 0** | **1.5 → 0** | **745 → 0** | **1 → 0** |

## The order of the work

Each step is merged only after the owner has seen photos of it.

1. **The rulebook, the audit and the ratchet tests** (this step), the rule in `AGENTS.md`, and the parked cars rebuilt on
   `road-vehicles.js` (a separate job).
2. **Main Street and the harbour** (done, above), drawn by one generator from the rulebook:
   - the asphalt goes dark grey;
   - the footways become pavers at kerb height behind a 15 cm kerb, dropped at the crossings;
   - the quay is laid at its own level with its coping;
   - the holes at the Kitano Road junction and the harbour corners are closed.
3. **Kitahama, Nishi, the neighbourhood and the school** (done, above):
   - the back lanes become asphalt, with an edge line and U-gutter at every plot;
   - the coral yards get coral edging;
   - the building circuits are replaced by aprons that meet their ground by rule.
4. **The beach, the coast, the park and the lawns** (done, above):
   - park paths get their stone edging;
   - the beach is graded wherever a path comes onto it;
   - the whole island gets a photo walk;
   - the baseline reaches zero, and the ratchet becomes a plain test.
