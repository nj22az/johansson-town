# New Yokosuka — measured lessons for Johansson World

Research date: 2026-10-19. Source: a shallow clone of <https://github.com/brynnb/new-yokosuka> (commit `b0df7f2`,
2026-10-10), its docs, `tools/evidence/`, `play/data/` and `public/data/`, and its asset viewer run headlessly against the
project's hosted asset bucket. Companion to [new-yokosuka.md](new-yokosuka.md) (the owner's note) and
[shenmue-lessons.md](shenmue-lessons.md) (the disc study of 2026-10-05, whose room budgets this does not repeat).

**Nothing from Shenmue or New Yokosuka is copied here or into the World**: no model, texture, name, music, text,
character or logo, and none of New Yokosuka's GPL-3.0 code. This document records numbers, layouts, densities,
routines and the way their research data is organised. Dialogue was counted, never read into this document.

Labels: **[confirmed]** = read from a data file or measured from a loaded model; **[inferred]** = an interpretation
of confirmed data (for example which room a cluster of objects belongs to); **[policy]** = New Yokosuka's own
choice for its browser game, not the original game's behaviour.

Units: New Yokosuka's browser units are metres (a sliding door pair measures 1.77 × 2.10 m, a vending machine
1.80 m tall, people walk at 1.2 m/s). Native collision X is mirrored against placement X; sizes are unaffected.

---

## 0. How this was produced (reproducible)

| Step | What |
|---|---|
| Clone | `git clone --depth 1`, 378 MB, 3,600 files; the game data is not in it (hosted bucket, SEGA's) |
| Read | `docs/` (implementation, research, reference), `tools/evidence/*.json` (388 files), `play/data/` (schedule catalog, runtime placements, vending, lights, layer states), `public/data/native-collisions/*.json` (155 areas) |
| Schedules | own script over `play/data/shenmue1-schedule-catalog.json`: per program the timetable entries `(seconds since midnight, descriptor)`, descriptor operations 8 (area), 3 (stand at a point with a facing), 7 (wait n seconds), 1 (walk a route of n points) |
| Plans | own script over `public/data/native-collisions/<AREA>.json`: wall chains, blocks and posts per area with exact coordinates |
| Rooms | `npm install` (its post-install step fetches a pinned EmulatorJS; the dev server refuses to start without it), `npm run dev`, then Playwright + the preinstalled Chromium (`--use-angle=swiftshader`) opening `/asset-viewer/`, clicking a catalogue entry and reading every mesh's world bounding box through the viewer's own state module; 155 models at 1.5–2.5 s each |
| Did the viewer load? | **Yes.** The hosted bucket answers from this network (one 1.5 KB prop fetched directly, then everything through Vite's `/r2-assets` proxy). The catalogue lists 4,880 models. The whole-area "Load Area" buttons could not be driven by script (they loaded single models); every number below is from single map sections and props, which is enough for footprints, ceilings and fixture heights |

The scripts live outside the clone in the session scratchpad and are not committed; the table above is enough to
redo them.

---

## 1. What New Yokosuka contains that we can learn from

| Location type | Native areas (data) | What is there |
|---|---|---|
| Family home | `JOMO` (house), `JHD0` (grounds, dojo) | 155 placed objects, 18 doors, 105 interaction models, 9 map sections, two residents with full timetables, per-door sounds (`jomo-runtime-placements.json`, `jomo-interaction-coverage.md`, `native-world-audio.md`) |
| Neighbourhood homes | `JU00` (hillside), `JD00` (suburb) | exterior only: 26 and 62 placed objects, 19 and 55 door models, 1 vending machine; the apartments are not enterable in the data |
| Convenience store | `DCBN` | room shell, 54 products, 2 lights, clerk and ten scheduled customers, its own ambience loop |
| Small shop | `JABE` (sweets shop) | room shell, 19 props, shopkeeper's day, a child customer |
| Shopping street | `D000` | 593 collision records, 120 door models, 5 vending machines, phone booth, capsule machines, bus, 15 lit-sign variants, 12 clock-switched layers, 150 schedule programs, 22 enterable interiors (restaurants, bars, barbers, travel agents, arcade, mahjong, slots) |
| Harbour | `MFSY` (quay), `MKSG` (warehouse yard), `MS08` (one warehouse inside), `MKYU` (workers' lounge), `MA00` (forklift course) | 443 / 113 / 30 collision records, 27 warehouse doors, 4 forklift controllers, 111 harbour programs, a race course |
| Routines | `shenmue1-schedule-catalog.json` (14 MB), 31 per-world shards | 265 programs, 1,215 timetable entries, 1,560 routes, 38,626 route points, stand points with facing, waits in seconds |
| Dialogue | `play/data/dialogue/messages/*.generated.js` | 257 actors, 26,767 voiced lines with per-line duration |
| Ambience | `play/config/ambient.js`, `docs/implementation/audio.md` | one loop per district and per interior, one music per district, a 21:00 cue, surface footsteps, per-door sounds |

Not present (so not a source): room-by-room furniture for the suburb homes, shop opening hours as data (see 3.3),
weather, and any Shenmue II numbers (not studied here).

---

## 2. The family home (`JOMO`, the main house) — numbers

### 2.1 Envelope and sections [confirmed]

| Measure | Value |
|---|---|
| Walkable interior (collision field) | 27.3 × 12.5 m, 132 records, 252 m of wall lines |
| Map union incl. porch and eaves | 29.6 × 19.3 m |
| Ceilings | 2.9–3.1 m in every section; the entrance block 3.9 m |
| Map sections | 8 loaded: 5.0 × 13.1, 9.8 × 7.0, 7.4 × 6.2, 10.3 × 7.5, 5.5 × 5.5, 18.4 × 8.3, 10.8 × 5.5, 3.8 × 5.6 m; 418–5,139 triangles each, 18,082 in all |

Room identities [inferred from the objects placed in each section and the residents' stand points]: a long central
run (18.4 × 8.3 m) with rooms on both sides; the entrance block (9.8 × 7.0 m, main door on its north face) opens off
the middle of it; the dining kitchen is 5.5 × 5.5 m (fridge, four chairs, kettle, frying pan); a young resident's room
is 3.8 × 5.6 m (two futons, a seven-drawer chest, a desk, a clock); the housekeeper's room is in the 7.4 × 6.2 m
section (a second seven-drawer chest); the bath, toilet and washroom are in the 5.0 × 13.1 m west wing (bath tub,
mirror, wash things); the altar room is 10.8 × 5.5 m; the main tatami room with hanging scrolls is 10.3 × 7.5 m at
the far end. The dojo on the grounds is a separate building, 11.7 × 12.5 m with a 5.8 m ridge [confirmed size].

### 2.2 What is in the house [confirmed counts, inferred names]

| Thing | Count and size |
|---|---|
| Doors | 18: 15 sliding pairs 1.77 × 2.10 m (incl. the main entrance), 3 hinged 0.90 × 2.10 m; plus 3 closet fronts 0.86 wide × 2.68 high × 1.79 m |
| Room lights | 13 ceiling fittings 0.87 × 0.33 m (one per room and three along the run) and 4 pull-cord lamps |
| Chests of drawers | 2, each 1.10 wide × 1.11 high × 0.57 m deep with 6 drawers (4 half-width 0.52 m, 2 full-width) — every drawer opens |
| Futons | 3 objects: one laid 0.86 × 1.43 m, one folded stack 1.58 × 0.54 × 1.83 m, one in a cupboard |
| Kitchen | fridge 0.83 wide × 1.88 m (two leaves), 4 chairs (0.42 m seat, 0.55 m back), a kettle and a pan [inferred], 8 smaller props |
| Altar | cabinet 0.84 × 0.62 m with 8 small items on it, 3 hanging scrolls 0.60 × 1.60 m |
| Everyday | 1 telephone (0.24 × 0.16 m), 1 cassette radio (0.66 × 0.24 × 0.17 m), 1 TV (0.80 × 0.40 m), 3 wall clocks (0.26 m) and an alarm clock, a desk, shoes at the entrance step [inferred] |
| Interactive | 147 of the 160 tagged objects respond to a click: every door, both fridge leaves, the drawers of both chests, cabinet leaves, the alarm clock, 22 inspect-only props |
| Door sounds | 7 door models × 2 sounds (opening start, closing start) = 10 distinct sounds for 18 placements |
| Ambience | one loop for the house, the same loop for the grounds; one house music |

### 2.3 The residents' day [confirmed]

| Resident | Timetable entries | Where | Waits |
|---|---|---|---|
| Housekeeper | 12 (00:01, 04:30, 08:30, then hourly-ish to 19:00) | 7 routes (36 points), stand points in her room, the kitchen, the step, the altar room | 600–1,800 s |
| Handyman | 7 (00:00, 04:00, 08:25, 10:15, 13:25, 16:35, 19:45) | no routes: 19 stand points with facing, sweeping the grounds with a broom attached to his hand (a 0.44 × 0.85 m prop at controller node 12) | 120–2,400 s |

A home day is therefore 7–12 rows, each "be in room X facing Y, wait N minutes, do motion M", not a path.

---

## 3. The convenience store (`DCBN`) and the sweets shop (`JABE`)

### 3.1 Convenience store [confirmed unless marked]

| Measure | Value |
|---|---|
| Shell (map section) | 8.03 × 4.23 m, ceiling 2.41 m, 4,273 triangles in 356 meshes |
| Walkable floor (collision) | 6.3 × 3.05 m, plus the entrance lane 0.9 m wide × 2.2 m deep; door 0.92 × 2.12 m |
| Wall shelving depth | 0.6–0.85 m (shell minus walkable) [inferred]; shelf tops at 0.3 m (bottom) and panels to 2.1 m |
| Counter | a 1.6 × 1.2 m block in the corner beside the door; top 0.8–0.9 m; the clerk's stand point 0.75 m behind its front, facing the floor |
| Window rack | 2.1 × 0.45 m along the front wall (the magazine rack) |
| A second fixture | 1.45 m long on the far side, 0.6 m deep [inferred: the hot case or a second till] |
| Lights | 2 (earlier study) |
| Products | 54 inspectable models, median 12 triangles: 29 cassette tapes 0.10 × 0.065 × 0.015 m, 3 cassette players 0.66 × 0.23 × 0.15 m, batteries (0.075 and 0.05 m), a magazine 0.19 × 0.11 m, a bag 0.30 × 0.42 m, a bottle 0.53 m, two capsule toys, wrapped sweets 0.08–0.12 m |
| Clerk | one, at her counter from 08:30 to 23:59 (two timetable entries, no routes) |
| Customers | 10 scheduled people call in (timetable entry starts): 08:30, 09:30, 10:30, 13:00, 14:00, 17:20, 17:50, 20:10, 20:20, 20:40; each uses the same two queue spots (in the entrance lane and just inside, 1.0 m apart) and one browsing spot mid-floor, with a 180° turn between facings |
| Ambience | its own loop (the only Dobuita shop with one besides the antiques shop, the Chinese restaurant, the slot house and the bars) |

So a 1980s–90s small-town konbini in this data is a **single-aisle shop of 34 m²** with shelving round the walls, the
magazine rack under the window, the till in the corner by the door, and a queue that forms in the doorway.

### 3.2 Sweets shop [confirmed]

| Measure | Value |
|---|---|
| Shell | 5.47 × 7.29 m, ceiling 2.79 m, 10,093 triangles |
| Walkable | 5.1 × 3.9 m (11 records): the shop, a 1.3 × 0.9 m side block, two round colliders (r 0.26 and 0.13 m) |
| Door | a double slider 1.80 × 2.10 m |
| Counters | low: slab tops at 0.5, 0.6, 0.7 and 0.8 m (a child's eye-line shop), one at 1.2 m |
| Props | 19: sweet jars 0.25 × 0.30 m, snack trays 0.46 × 0.18 × 0.33 m, capsule toys, potted plants, a noticeboard |
| Shopkeeper | at her stool from 08:30 (stand point at the back), to a second spot at 19:00; 8 waits of 120–1,200 s |
| Customers | a schoolboy at 14:30 (3 stand points) |

### 3.3 Hours

No shop in the data carries opening hours as such; New Yokosuka records this explicitly ("no verified physical-door
access rules", `timed-transition-access.json`) [policy]. What the street does carry [confirmed,
`d000-time-window-evidence.json`]: 15 literal clock windows that switch sign and shutter layers, grouped on a day that
turns over at 06:00:

| Window | Count | Reading [inferred] |
|---|---|---|
| 07:00–19:00, 07:30–18:00, 08:00–17:30, 08:30–18:30 (×2), 08:00–19:30 (×2), 08:00–22:00 | 8 | day shops: shutters up, day signs |
| 10:00–21:00 (×2) | 2 | restaurants |
| 11:00–15:00 | 1 | a lunch-only place |
| 19:00–23:00 (×2), 19:30–23:00 | 3 | bars: lit signs on |
| 22:00–05:25 | 1 | the late place |

Layer switching times for the whole street: 08:30/18:30 (day set), 19:00 and 19:30 (night sets), 10:00/21:00.
Shopkeepers' own timetables give the other half: the sweets shop 08:30–19:00, the konbini clerk 08:30 to close.

---

## 4. The shopping street (`D000`) — density

| Measure | Value | Label |
|---|---|---|
| Street core | map section 201 × 133 m; collision field 203 × 187 m, 593 records, 2,053 m of wall lines; 3 extra fields (an upper level 150 × 36 m) | confirmed |
| Doorways | 120 door models cluster into **51 distinct doorways** (2 m clusters); nearest-neighbour spacing median 6.2 m, mean 8.0 m | confirmed |
| Enterable interiors | 22 (restaurants 6, bars 4, barbers 2, travel agents 2, arcade, mahjong, slots, karaoke, antiques, china shop, konbini, a company office) | confirmed |
| Per 100 m of frontage (177 m door spread) | ≈ 29 doorways, ≈ 12 enterable shops | inferred |
| Vending machines | 5 on the street (1.24 × 1.80 × 0.60 m; the suburb's is 0.60 wide), 1 in the suburb, 2 on the quay, 4 on the forklift course; each sells 5 drinks at ¥100 with a 1-in-10 prize can | confirmed |
| Street furniture | 1 phone booth 0.97 × 2.25 m, 2 capsule-toy units 0.22 × 0.30 × 0.46 m, a bus with a driver (8.2 s authored arrival), 15 models of one sign family [inferred: the lit signs the clock layers switch] | confirmed; sign reading inferred |
| Posts and kerbs | 67 round colliders, 21 of r 0.18 m and 9 of r 0.21 m (poles) — about one per 3 m of street; 52 thin blocks 0.6–9.7 m long × 0.1–0.6 m (planters, benches, kerb walls) | confirmed; use inferred |
| People | 150 schedule programs name the street; 122 have entries there; New Yokosuka counts 38 present at noon [policy count] | confirmed |
| Sound | one street loop plus five beds (earlier study); 41 of 65 doors have a registered opening sound; footsteps from a 13-surface grid, 4 random variants per step | confirmed |

---

## 5. The harbour

| Measure | Value | Label |
|---|---|---|
| Quay area | collision 352 × 240 m, 443 records, 3,245 m of wall lines; 27 warehouse-door placements; 2 vending machines; a phone booth | confirmed |
| Blocks on the quay | 53: 17.9 × 7.8, 13.4 × 12.2, 8.1 × 7.2, 9.0 × 2.2, 5.6 × 1.8, 5.2 × 1.9 m (buildings and stacks); 4.5 × 4.2 (×2), 4.2 × 1.2 (×2), 1.1 × 0.9 (×2) m (containers, crates); 87 round: r 0.34–0.55 m (bollards, 23 of them), r 0.92–1.08 m (tanks) | confirmed; use inferred |
| Warehouse district (yard) | collision 74 × 88 m, 113 records, 703 m of walls; one 12.3 × 10.5 m shed, two 4.5 × 4.2 m blocks, seven 6.1–6.2 m rails or kerbs, three 1.1 × 0.9 m crates, two r 2.96 m tanks, drums r 0.41–0.46 m | confirmed; use inferred |
| One warehouse inside | walkable 27.3 × 24.3 m (650 m²) on the ground field and 23.0 × 19.8 m on the upper field; 30 + 7 records (crates 0.7–1.9 m, a r 2.4 m tank, 4 stair boundaries) | confirmed |
| Roller door | 7.86 m wide × 4.96 m high; crate stack 2.88 × 2.00 × 0.56 m; a fixed prop 3.7 × 4.8 × 3.1 m | confirmed |
| Workers' lounge | 16.1 × 17.5 m, ceiling 3.24 m, 6,921 triangles; 10 programs; 9 workers share the same two lunch spots (2.1 m apart) between 09:00 and 17:40 with waits of 60–1,800 s | confirmed |
| Guards | 3, each 08:30–23:50 on one patrol route of 47, 49 and 83 points, no waits | confirmed |
| Forklifts | 4 controllers; step 0.185 m per 30 Hz update = **5.6 m/s (20 km/h)**; 114 route operations, 12,871 points in 42 arrays; live routes of 28–155 points; a forklift's phase is shared yard state, not the driver's clock | confirmed |
| Race | 13 checkpoints, 3 laps, 4 opponents, inside 177 × 122 m | confirmed |
| Harbour people | 111 programs, 99 with quay entries, 771 entries, 480 routes (median 15 points), 309 waits (median 300 s) | confirmed |

---

## 6. Routines — the schedule format and its numbers [confirmed]

| Measure | Value |
|---|---|
| Programs | 265 for 249 actor codes; 234 mapped to a model; 431 selected variants over 16 selector slots (story flags, month/day bounds) |
| Per program | timetable entries: median 3, mean 6.2, max 59; 1,560 authored route segments (1,283 in the default tables, median 19 points, mean 25); 618 waits in the default tables (median 300 s; p10 120, p90 1,200, max 3,600) |
| Entry | `(seconds since midnight, descriptor)`; descriptor = area change, motion id, stand at (x, z) facing f, wait n s, walk route, attach prop to hand/controller node, hand off to a "free lunch-spot" graph (37 roots, 513 points, first free leaf) |
| Walking | 0.0417 m per 30 Hz update = **1.25 m/s**; a measured walker 1.19–1.23 m/s |
| Areas per day | 1–4 per person; a shopkeeper 1, a street regular 3 (street, konbini, a bar), a worker 2 (quay, lounge) |
| Per-area cast | street 122 programs, quay 99, suburb 37, hillside 9, bar 5, konbini 1 clerk + 10 callers, restaurants 2–3 staff, lounge 1 + 9 callers |
| Game day | 08:30–23:30 playable, one game hour per 4 real minutes, 23:30 jumps to 08:30 [policy]; light phases: sunrise blend 08:30–09:15, day to 18:00, sunset 18:00–19:00, evening 19:00–19:45, night from 20:30 [policy] |
| Dialogue | 257 actors with voice, 26,767 lines; median 88 lines per actor (max 422); line length median 1.8 s (p10 0.6, p90 3.7, max 9.7); subtitle median 31 characters (p90 58) |
| Characters | 332 in the character table; 369 streamed models (earlier study) |

---

## 7. Johansson World today, side by side, and what to change

| Topic | New Yokosuka | Johansson World (files) | Proposed change |
|---|---|---|---|
| Konbini floor | 34 m² single aisle, wall shelving, window rack 2.1 m, corner till 1.6 × 1.2 m, queue in the doorway | Sakura Shōten 13.7 × 7.9 m sales floor (108 m²), 3 gondolas 1.5 m high, shelf levels 0.36/0.67/0.98/1.29 m, counter 0.78 m, about 33 lines (`src/world/interiors/sakura-layout.js`, `sakura-shell.js`, `src/commerce/merchandising.js`) | **C1** keep our floor (it is the town's supplier, three times the konbini) but add the doorway queue: two stand spots 1.0 m apart in the entrance lane and one browsing spot per aisle, with a facing each; put the clerk's stand point 0.75 m behind the counter front |
| Konbini stock | 54 items of ≈12 triangles; a sideline of 29 cassette tapes and batteries at the till | 33 lines, product geometry shared shelf and hand (`sakura-layout.js`, `data/studio/products.json`) | **C2** add a till sideline (batteries, tapes, film) as 3–5 lines of ≤ 20 triangles, with `for`/`why`/`placed` as every line has |
| Shop ambience | one loop per interior for 6 of 22 shops; 11 loops for 16 worlds | 8 synthesised outdoor layers, indoor = outdoors × 0.2 (`src/audio/soundscape.js`, `town-audio.js`) | **C3** one synthesised room tone per interior kind (fridge hum for Sakura, kettle and radio for homes, extractor for Sato Ramen, bar murmur for Minato) crossfaded on entry; no new audio files |
| Home plan | 27 × 12.5 m house, central run, rooms 5.5 × 5.5 to 10 × 7.5 m, ceilings 2.9–3.1 m, sliding pairs 1.77 × 2.10 m, hinged 0.90 m | family home 6.4 × 5.6 m 2DK, ceiling 2.7 m, doors ≥ 0.8 m (`src/world/interiors/family-home.js`, `house-plan.js`, `tatami-home-layout.js`) | **C4** for the larger Minato houses (the Higa house, 1 Kitahama, the Kitano house): plan as a run with rooms off both sides, one wall switch per room by its door, a seven-drawer chest 1.10 × 1.11 × 0.57 m per bedroom, fridge 0.83 × 1.88 m, four chairs in a 5.5 × 5.5 m dining kitchen, sliding pairs 1.77 m; keep 2.7 m ceilings (Okinawan concrete houses are lower) |
| Home interaction | 147 clickable objects, 14 drawers, every door and fridge leaf | inspect prompts per home (`home-details.js`, `item-viewer.js`) | **C5** make drawers, cupboard leaves and the fridge openable in every home (cheap: ≤ 100 triangles each), contents from the household's belongings (`src/people/belongings.js`) |
| Home routine | housekeeper 12 rows/day, handyman 7 rows of stand-and-wait with a prop in hand, waits 2–40 min | 26 cast members with 4–8 phases a day (median 5), 142 rows (`src/people/cast.js` `day`, `canonical-day.js`, `schedules.js`) | **C6** add a `stand` form to a phase: `(x, z, facing, wait, activity, prop)`, so a phase at home or at work is a sequence of stand points, not one target; 7–12 rows for a homemaker, 2–3 for a shopkeeper |
| Street density | 51 doorways on 177 m (one per 6–8 m), 22 enterable on 177 m, 1 vending per ≈ 35 m, 1 phone booth, poles every ≈ 3 m, 15 lit-sign variants, 12 clock layers | Main Street and the East Row (`src/world/okinawa/old-town.js`, `signs.js`, `lots.js`, `src/world/vending.js`) | **C7** audit Main Street against these: doorway spacing, one vending machine per ≈ 35 m of frontage, poles and planters every 3–6 m; give each shop a day window and a night sign set switched at 18:30 / 19:00 / 19:30 (`signs.js`, `dusk.js`) |
| Shop hours | 10 distinct day windows on one street (07:00–19:00 … 11:00–15:00 … 22:00–05:25) | Sakura 9:00–20:30 (`src/commerce/sakura-rota.js`), izakaya and ramen in `social.js` | **C8** one `business-hours` table (shenmue-lessons A2) with at least four distinct patterns: day shop, restaurant 10–21, lunch-only, bar 19–23; shutters and signs read it |
| Docks | yard 74 × 88 m, shed 12.3 × 10.5 m, warehouse inside 27 × 24 m, roller door 7.9 × 5.0 m, crate 1.1 × 0.9 m, stacks 2.9 × 2.0 m, tanks r 3.0 m, bollards r 0.34–0.55 m, forklift 5.6 m/s | Quay Warehouse / Sakura Trading, port shed, quay dressing (`src/world/port-shed.js`, `quay-dressing.js`, `interiors/warehouse-port.js`, `interiors/warehouse.js`) | **C9** size the Quay Warehouse interior toward 27 × 24 m with a 7.9 × 5.0 m roller door and 1.1 × 0.9 m crates stacked to 2 m; bollards r 0.35–0.55 m; if a forklift ever moves, 5.6 m/s on a fixed polyline with shared yard phase |
| Harbour routine | 3 guards on one loop each (47–83 points), 8 workers sharing two lunch spots, 60–1,800 s waits | ferry crew and shore roles (`src/people/ferry-crew.js`, `shore-duty.js`, `master-commute.js`) | **C10** give the quay a shared "free spot" list (bench, bollard, lunch step) that workers claim first-free, as New Yokosuka's lunch-spot graph does |
| Dialogue rhythm | 1.8 s per line, 31 characters, 88 lines per person | `src/people/chat-lines.js`, `voice-lines.js`, `greetings.js` | **C11** hold our spoken lines to ≤ 35 characters and ≤ 3 s, and aim for ≥ 60 lines per core resident over time |
| Research data | one JSON per finding with `schema`, source path + SHA-256, `confidence`, `evidenceBoundary`; generated reference tables with input hashes; docs split research / implementation / design | our docs record numbers in prose | **C12** record the measurements we adopt as data beside the thing (`why`, period note, `source`), the way `quay-dressing.js` and `merchandising.js` already do, and keep research, implementation and plans in separate documents |

The owner approves which of C1–C12 go ahead; none is started by this document.

**In the World (19 October 2026, the owner's "Yes proceed" to C6, C1 and C10):**

- **C6** `src/people/stand-points.js` and `stand-sequences.js`: a day row may name a stand sequence (`{stand:'id'}`, the
  row's fourth element). Thuan sweeps her pavement at opening and keeps the till, the cooler and the west window; Nhung
  the counter, the new arrivals, the reading table and the paper's back bench; Mrs Sato the stock pots and the lunch
  stations; Officer Mori the desk, the counter window and the notice board; Gran Higa her garden; Kōji his nets; Jack
  his round of the quay. Waits are drawn from each point's range by the town clock (median near 300 s), walks are timed at
  1.25 m/s. Tests: `tests/stand-points.test.mjs`.
- **C1** `src/world/interiors/sakura-queue.js`: the clerk's point 0.75 m behind the counter's front (a straight step in
  from a routed approach, `retail-clerk.js tillStep`), two queue spots 1.0 m apart on the lane from the door facing the
  till, one browsing spot per aisle for whoever finds both taken. Tests: `tests/sakura-queue.test.mjs`.
- **C10** `src/world/quay-spots.js` and `src/people/quay-breaks.js`: five spots on Minato's quay and two on Kitano's
  pier, claimed first-free by Kōji, Jack, Chin and Kai on their breaks (60–1,800 s); Fuji and Ren are signed on through
  the ship's day and have no break ashore yet (`NOT_ASHORE`). Tests: `tests/quay-spots.test.mjs`.

---

## 8. What we must not take, and why

- **Assets**: no model, texture, animation, sound, music or sign from Shenmue, hosted or extracted. They are SEGA's; the
  World ships its own. The measurements above were taken from loaded models and then the models were discarded.
- **Names**: no character, shop, product or drink name (the konbini's own name, the five drinks in the vending data,
  the 332 character names). Minato's people and shops have their own names and reasons.
- **Text**: none of the 26,767 dialogue lines. Only their count, duration and length were measured.
- **Code**: New Yokosuka is GPL-3.0. Its loaders, schedulers, collision and audio code are not vendored, not
  translated and not "adapted"; their *organisation* (section 7, C12) is what we learn from.
- **Its hosted bucket**: our runtime never references it.
- **Its browser policies as if they were the original**: the 08:30–23:30 day, the four light phases, the lunch-spot
  reservations and the "no access rules" stance are New Yokosuka's choices, labelled [policy] above.

---

## 9. Open points

- Whole-area loads (the viewer's "Load Area") were not driven, so composite room numbers come from single map
  sections plus the collision field; the two agree (house 27.3 vs 29.6 m with porch; konbini 6.3 walkable in an 8.0 m
  shell).
- Room names in the house (section 2.1) are inferred from object clusters and stand points, not from a room table.
- Shop hours are inferred from clock-switched layers and shopkeepers' timetables; the original has no hours table.
- Shenmue II worlds and the suburb/hillside apartment interiors were not studied (not enterable in the data).
