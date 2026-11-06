# The town hall zone: remediation first, then four buildings

Status: **phases R (#319), M (#320) and S part 1 (#321) merged; S part 2 (people, doors, stories) done 21 October 2026, waiting for the owner's OK.**

The owner, 21 October 2026, with four phone photos (the beach at the end of the Kitahama lane, the yard under the
fukugi by the car park, the hall's forecourt from the gate, the monument): "Could this zone be subdivided into individual
structures, with the damaged beach and land sections restored? Please formulate a remediation plan to be implemented
prior to any construction activity. I think remove the mayors office and put it on the tropical island for now or even
rework it into one of the rooms in Johansson's house on the tropical island."

Read with the handoff (`HANDOFF-2026-10-21.md`), the ground standard (`docs/GROUND-STANDARD.md`) and the owner's rulings
in `AGENTS.md` (Nils is chief engineer, not mayor; he lives with Thuan on Kitano-jima; no way in without a working
interior; one ground system).

## 1. The zone today

One walled campus, x 12.4–40.6, z 24.6–45.1 (`src/world/school-layout.js` `SCHOOL`), holding everything in one block and
one yard:

| Part | Where (x, z) | Code |
|---|---|---|
| One-storey hall, 25 × 8 m | 14.5–39.5, 36.5–44.5 | `school.js buildTownHall` |
| Its four doors on the north face | classroom 20.5, community kitchen 27.0, **mayor's office 30.6**, clinic 34.1 | `school.js:344-366` |
| Clinic with Dr Kakazu's flat (`home-clinic`) | entrance 37.7, 36.4 | `island-homes.js:52` |
| Power house and its apron | 25.2–30.5, 24.4–29.8; door east at 31.2, 27.1 | `school.js:170-206`, `town-power.js` |
| Fuel tank in its bund | 16.6, 31.2 (on the old field, in front of the classroom) | `school-layout.js:48` |
| Car park, four bays | 31–39.6, 28.9–32.4 | `ground-plan-quarters.js:269` |
| Bike shed | 34–37.1, 25.3–28 | `school-layout.js:38` |
| Fukugi windbreak | x 12.95 (8 trees), x 40.05 (4 trees), two corners | `school-layout.js:56-63` |
| The whole yard | 12.4–40.6 × 24.6–44.5, one sheet of `park-path` (tan crushed stone) | `ground-plan-quarters.js:275` |

The hall is the old school with the town office moved in, and its rooms are still named after a mayor who no longer
exists in the canon.

## 2. What the photos show, traced to the code

**The beach (photo 2).** The beach is the north end of the east beach, where the Kitahama approach lane (x 42–45) runs
beside the shore.

- **D1. A slab of sand sticks out into the sea.** It covers about x 45.7–47.8 by z 26.3–29.3, straight on three sides.
  The cause is the `kitahama-lawn` grade (`beach-layout.js:78`). Its core runs from x 41 to the profile's far end
  (`BEACH.profile.at(-1)[0]`, x 47.8), at +0.02 m. So it lifts the sand above the water (−0.56) for 2.8 m past the
  coastline (x 45), and drops straight back at the edge of its 3 m reach.
- **D2. The foam is hard white stripes.** `ocean.js:190-201` draws the foam and the shore line with `step()` and no
  smoothing. Both read `SHORE_FIELD`, which is about 1.3 m to a texel. Along the straight x 45 coast that comes out as
  blocks.
- **D3. The wet band is a hard line.** The sand changes colour over 2 cm of height (`ground-standard.js:138-141`
  `wetBelow` −0.32/−0.30, `east-lawn.js:108`).

**The land (photos 1, 3, 4).**

- **D4. The whole campus is one sheet of tan crushed stone.** It runs under the trees, round the car park, up to the
  power house and along the hall. From the street it reads as sand or bare ground, not a kept yard.
- **D5. The car-park lettering reads mirrored from the street** (`school.js:37-47`, the 来客用 decal at 37.4, 31.8). Its
  plane is turned so it reads only from inside the hall.
- **D6. The monument says "Community Hall · Community Hall"** (`school.js:205`). The same happens on the gate plate and
  the door plates, whose `jp` fields hold English. The English-localisation sweep put the English into fields meant for
  Japanese, which breaks the rule that signs are correct Japanese.
- **D7. The power house's sign says "Power plant"** in English (`school.js:206`), beside a correct 港町発電所 poster
  (`town-power.js:68`).
- **D8. The power house's switch box stands loose in the yard** at 30.59, 33.9 (`town-power.js:64`). It is placed from
  `ph.maxX`, but the building ends at z 29.8.
- **D9. The fuel tank stands on the old field in front of the classroom.** It is 15 m from the power house it feeds,
  with nothing between them.
- **D10. The east verge (x 40.6–41.5) overlaps the seawall at x 41** (`ground-plan-quarters.js:268`).

The 1,5 KM and 2,7 KM pill in the photos is the phone's own status bar, not the game.

## 3. Remediation: restore the ground before anything is built (phase R)

The R items are repairs only. They move no building, door or person, and each is merged after the owner has seen
before-and-after photos at 390×844 (`?audit`).

**R1. Take the sand slab out of the sea (D1).**
- Stop the `kitahama-lawn` grade's core at the coastline (x 45, or `BEACH_DRY_EDGE_X`), not at the profile's end.
- Let the beach fall into the water by its own profile north of z 26.
- Add a test to `tests/east-lawn.test.mjs`: no sand above `BEACH.waterY` seaward of the coastline anywhere on the east
  beach, sampled every 25 cm.

**R2. Soften the foam (D2).**
- Replace both `step()` calls with `smoothstep` over a few centimetres, and let the lace break the shore line.
- Sample `SHORE_FIELD` with a 3×3 blur, or raise its resolution along the town's coast.
- Check the effect on the phone's frame time against the graphics ruling of 19 October: the same look on every
  device, made cheaper rather than dropped.

**R3. Widen the wet band (D3)** to a graded change over about 8 cm of height, in the rulebook, so every beach takes it.

**R4. Give the yard its ground back (D4).** Lay the campus by use, all from the plan (`TOWN_HALL_GROUND`, classes the
rulebook already has):
- grass under the fukugi rows and in the strip along the wall (the trees stand in turf, as at Harbour Park);
- crushed stone only where people walk: the gate to the forecourt, the breezeway, the walk to each door;
- concrete for the car park, the power house's court and the bike shed's pad, edged against the lawn;
- no bare stone left over between them.

The ground-standard audit stays empty.

**R5. Fix the signs (D5–D7).**
- Turn the car-park decal so it reads from the bay's entrance.
- Put Japanese back on the plates and the monument: 港町公民館, 港小学校, 港町診療所 and 港町発電所. Do it in
  `SIGN_JAPANESE` (`okinawa/signs.js`), the same job as handoff item 1.
- Spoken and prompt words stay English (repo rule 4).

**R6. Small placements (D8, D10).** Put the switch box on the power house's wall, and stop the verge at the seawall's
face.

**Done when:**
- the R tests are added and green, `node tools/ci-guard.mjs` is green, and `npm run build:runtime` is rebuilt;
- the owner has seen photos from his four spots (the lane's end, the yard by the car park, the gate and the monument)
  before and after.

### Phase R, as done (21 October 2026)

The owner: "Do 1 first then sign when you are done". Before-and-after photos from the four spots and two high looks are
in `docs/qa/town-hall-zone/` (`compare/` puts each pair side by side). They were taken by
`tools/town-hall-zone-photos.mjs`: the real `createTown` scene with the cel and ink passes and the sea, at 390×844 under
swiftshader. They are not from the full game or a phone, because the full game does not get past 0% loading in a cloud
session.

- **R1.** `beach-layout.js`: the Kitahama lawn's grade stops at the coastline (`BEACH_SHORE`), and every grade gives
  way to the beach's own profile between the coastline and the water's edge. At the lane's corner the sand now meets
  the water in a short bank of about 1:1, beside the coast's stone face. That bank is drawn at 10 cm there
  (`east-lawn.js`), because coarse it showed as ink scratches. Guarded by `tests/beach-shore.test.mjs` (added to the CI
  guard).
- **R2.** `ocean.js`: the shore distance is stored as a square root, so the metre where the foam is drawn has steps
  of about 7 cm instead of 31. The lace and the shore line are drawn with a narrow `smoothstep` instead of `step`.
- **R3.** `ground-standard.js` `wetBlend`: the wet band blends over 6 cm of height (about 2 m of beach), and the
  ground audit reads the same value.
- **R4.** `ground-plan-quarters.js` `TOWN_HALL_GROUND.stone`: the yard is lawn, and rolled stone lies only on the
  school playground, the front walk and the bicycle-shed walk. The ground audit stays empty, and
  `ground-quarters.test.mjs` checks that every fukugi stands in turf.
- **R5.** Every plate on the hall is Japanese through `SIGN_JAPANESE`: 港町役場・公民館 on the parapet and the
  monument, 港町役場 on the gate, 玄関, the bay plates, and 港町発電所. The east bay is 医師住宅, the doctor's flat. The
  flag reads みなと. The car-park lettering reads from the aisle. Read-prompt titles are plain English.
- **R6.** The switch box and the distribution board are on the power house's east wall. A defect found in the
  photos, **D11**: the day tank's fuel pipe ran 12 m through the air at hip height across the forecourt. It now runs
  buried. **D10** (the verge at the seawall) does not show in any view and is left as it is: it is the turf under the
  wall's thickness.

Left for later:
- A few ink specks remain at the very corner of the bank.
- The broken foam line further out still reads as separate white dashes. That is the look's design, now without the
  texel blocks.
- The tan ground beside the monument is the school playground, kept on purpose until phase S.

## 4. Move the mayor's office to Kitano-jima (phase M)

**Recommendation: rework it into the study in Johansson's house** (`johansson-house-interior.js:709`, room `l1-study`).
Don't build a separate office on the island. The reasons:

- Nils is chief engineer, not mayor. A town office on his island would carry the stale canon on.
- The study already has the desk at the east window and the bookshelf, and its text still talks about "the town's
  papers" and "the town budget for 1997". That text is stale as well.
- It keeps Kitano-jima's terrain and facilities intact, which the ruling of 18 October requires: no new building there.

**What the study takes from the office:**
- the computer at the desk and the document register (`action('document-archive')`), so the town's archive stays
  playable;
- the petitions tray, re-read as letters from the town to a neighbour who fixes things;
- the Merry Moose and the wall clock;
- the papers turn into the ship's: the engine log, the manning plan, the ferry's drawings.

The nameplate "Mayor Johansson" goes.

**What the civic counter becomes:** the town's register moves to the Community Hall (phase S). The hall already opens the
register from the kitchen (`town-hall.js:166`). The town keeps its paperwork and nobody becomes mayor.

**The work, in one PR:**
1. Remove the `mayor-office` door, plate, prompt and site (`school.js:358`), its route in `game.js:1185` and
   `scene-world.js`, and its map and directory entries.
2. Move `buildMayorOffice`'s furnishings into the study and retune its text. Retarget `tests/mayor-office.test.mjs` to
   the study: approach the chair, face the computer, open the archive, solid furniture.
3. **Saves.** `roster.js RETIRED_HOMES` sends nine retired homes to `mayor-office`, and `households.js:24` sends three
   more aliases there. Point them all at the Community Hall, and map `mayor-office` itself to it. This needs a save
   migration step (castRevision 3) with a test in `cast-migration.test.mjs`: a save inside the office lands at the
   hall's door.
4. **Stories.** The feed place `town-hall` (`feed/places.js:51`) is shot in `mayor-office`. Re-shoot it in the
   Community Hall. Drop the moose and the sofa from its things, or move them with the study as a new Kitano place.
   Regulars stay Dr Kakazu, and add the women's association and Mrs Nakamura, who already runs the kitchen.
5. Drop the `mayor-office` entries from `merchandising.js:97,134`. The hall takes the office supplies, from Front-Row as
   now. Also update `pocket-subjects.js`, `home-directory.js:30,46` and the studio handoff (`studio-handoff.js`).
6. Run `enterable-sites.test.mjs` (the study is reached inside the house; no new door) and the CI guard.

### Phase M, as done (21 October 2026)

The owner: "Yea proceed". Photos of the study, before and after, are in `docs/qa/town-hall-zone/compare/study-*`. They
were taken by `tools/johansson-study-photos.mjs`, which builds the house alone, so its light is flatter than in the
game.

- **The study** (`johansson-house-interior.js`, the L1 study):
  - the office's beige CRT and keyboard are on his desk at the window, facing his chair, and "Use the computer" opens
    the Community Hall's register;
  - the Merry Moose stands on its plinth in the corner by the door, facing the room, with a prompt that tells how it
    came there;
  - the desk and bookshelf texts are the ship's papers now, not the town's;
  - the house's layout disposes the moose when he leaves.

  Guarded by `tests/johansson-study.test.mjs` (added to the CI guard).
- **The town hall:**
  - the `mayor-office` site, door prompt, plate and room are gone (`school.js`, `game.js`, `town-hall.js`);
  - its bay is the Community Hall's 会議室 (meeting room), with the door drawn but no way in;
  - the kitchen took the request box (the old petitions, now "Requests to the town assembly") and the 1997 assembly
    minutes, beside the register it already had.
- **Saves:** `HOME_ALIASES['mayor-office']` and every retired home now land at the community kitchen's door
  (`households.js`, `roster.js RETIRED_HOMES`, `home-directory.js`, `docs/cast-roster.json`).
  `cast-migration.test.mjs` covers a save at the office.
- **Trade:** the office's Sakura account (tea, crackers, tissues, the wreaths and bunting) and its Front-Row stationery
  are the Community Hall's (`merchandising.js`, `products-move.test.mjs`).
- **Stories:**
  - the `town-hall` place is the Community Hall's kitchen, with Mrs Nakamura joining Dr Kakazu;
  - it is set `captured:false` until its backdrops are taken (`node tools/render-feed-backdrops.mjs town-hall`), which
    could not run in a cloud session;
  - the town papers are regenerated (`scripts/build-town-papers.mjs`): the office telephone and reference library are
    gone, and the minutes are kept.
- **Elsewhere:**
  - the Thuan figurine is "a present from the town", not from the mayor's office;
  - `pocket-subjects.js`, `scene-world.js`, `tools/mcp/tour-client.mjs` and `scripts/build-building-audit.mjs` drop the
    office.

## 5. Split the campus into individual buildings (phase S, after R and M)

**Yes, it can be split.** Without the mayor's office the block holds three uses with different hours, people and
visitors. Each should have its own building, door, plot and sign, with its own ground and edge from the rulebook. The
proposal keeps the existing footprint line (z 36.5–44.5) and the gate, so the street and the seawall do not move.

| Plot | Building (x) | Door | Who and when | Notes |
|---|---|---|---|---|
| **港小学校, Minato School** | 14.5–24.0, with the clock tower 18.4–22.6 | genkan 20.5, on the gate's line | Yui's Years 5–6, 8:30–15:30 | Keeps the field, the flagpole, the wash station and the chime. The fuel tank leaves the field. |
| *gap, 1.5 m* | 24.0–25.5 | | | A planted passage to the seawall: hana-block screen, a tap, a bench. |
| **港町公民館, Community Hall** | 25.5–31.5 | 27.0 (kitchen); a second door at 30.0 for the hall room | Mrs Nakamura's kitchen, Saturday association, the register, the public WC | Takes the town register from the old office (phase M). |
| *gap, 1.5 m* | 31.5–33.0 | | | The clinic's private side: the doctor's bicycle, the ambulance stretcher store. |
| **港町診療所, Minato Clinic** | 33.0–39.5 | 34.1 → moved to 35.5 (surgery); the flat's own door at 38.5 | Dr Kakazu, surgery hours and the night bell | His flat (`home-clinic`) becomes a real second door with a nameplate and a step, as every home now needs. |
| **港町発電所, Power house compound** | 24.6–31.8 × 24.6–30.4, fenced | gate east to the car park, for the fuel truck | Tetsuo's switchboard | The fuel tank moves inside the fence. The yard becomes a work yard (`gravel`), not public. |

Shared by all of them: the car park (serving the clinic and the hall, with a 来客用 visitors' bay and a 救急 bay at the
clinic's door), the bike shed (the school's), the gate and the two fukugi rows.

**The three buildings are drawn in the town's procedural kit, not as one block.** `buildTownHall` becomes three calls.
Each has its own roof line and eaves, and its own colour within the palette: school cream, hall pale green, clinic
white. The Blender school model (`tools/blender/build-school.py`) is retired, or cut to the school alone.

**Interiors.** The classroom, the community kitchen and the clinic already exist as rooms (`classroom.js`,
`town-hall.js buildCommunityKitchen`/`buildClinic`, `town-hall-plan.test.mjs`). Only the exits move.
`enterable-sites.test.mjs` must pass for each door.

**Who walks there.** Check every routine that enters `school`, `community-kitchen` or `clinic` against the new doors:
- `cast.js` Dr Kakazu, Yui, Mrs Nakamura and the pupils;
- `schedules.js` stand points;
- `ferry-shore-crew.js`, where it uses the hall.

**Storyteller.** Split `town-hall` into three places (school, community hall, clinic) with their own regulars, things and
shots. Photograph each (`tools/render-feed-backdrops.mjs`) before a story is set there.

**Tests that change:** `school.test.mjs` (one hall becomes three buildings), `ground-quarters.test.mjs`,
`east-lawn-tree-collision.test.mjs`, `compact-island.test.mjs`, `town-hall-plan.test.mjs`, `boot.test.mjs` and
`architecture-plan.js` plots (`town-hall` becomes three plots and the compound).

**Done when:**
- every door enters a working room;
- the ground audit is empty;
- `collide` passes for anyone filmed there;
- the CI guard is green;
- the owner has approved the photos from the gate, the car park and the beach end.

### Phase S part 1, as done (21 October 2026)

The owner took the recommendations ("Go with your recommendations"): three separate buildings with gaps, a register
nobody staffs, the school named 港小学校 with the old 港小中学校 showing through the paint, and the study (phase M).

- **Three buildings** (`school-layout.js` `TOWN_HALL_BUILDINGS`, drawn by `school.js buildTownHall`):
  - the school, x 14.5–24, with the entrance, clock and classroom;
  - the Community Hall, x 25.5–31.5, with the kitchen door and the meeting room's door;
  - the clinic, x 33–39.5, with the clinic's door and the doctor's flat.

  Each has its own veranda, roof, parapet, colour and name: 港小学校 over a faint 港小中学校, 港町公民館 and 港町診療所.
  Every door stands where it stood, so no room, exit or routine moved. The gate carries two plates, 港小学校 and 港町公民館.
- **Passages, 1.5 m wide,** run between the buildings (`TOWN_HALL_PASSAGES`, rolled stone). They lead through to
  Kitahama's north lane behind, not to a seawall: the old notes' "sea on two sides" is stale, because the lane runs at
  z 44.5. The seawall prompt is now "Look along the back lane".
- **Power compound:**
  - a hana-block fence surrounds the house, its apron and the day tank, with a gate at the steel doors;
  - the tank moved inside, north of the house (`powerHouse.compound`, `tank`), and its yard is gravel;
  - `gravel` is allowed in the school district (`ground-standard.js`, `docs/GROUND-STANDARD.md`);
  - the lawn and its flower bed moved north of the fence.
- **Fixed on the way:** the monument's read prompt stood 9 m from the monument. It is at the stone now.
- **Checks:** the CI guard is green. `ground-quarters.test.mjs` checks the passages and the compound, and
  `sign-backs.test.mjs` knows the fence is a block screen, not a sign. Photos are in
  `docs/qa/town-hall-zone/compare/split-*`.

### Phase S part 2, as done (21 October 2026)

- **Doors and names:**
  - the classroom's site is *Minato Elementary School*;
  - the kitchen's door is the Community Hall's: *Community Hall · Kitchen*, "Go into the Community Hall", with the
    register self-service and nobody at a counter;
  - the clinic's is unchanged;
  - photo captions read "in the school classroom" and "in the Community Hall", and the archive's opening records file
    under *Minato School*.
- **People:** no routine moved, because every door stands where it stood. Dr Kakazu, Miss Higa and the three pupils
  walk to the same doors, and the passages give the Kitahama children the short way in from the north lane. Mrs
  Nakamura is the hall's face in stories, with no new routine.
- **Stories:** `feed/places.js` now has the school (Miss Higa, Vy, Riku, Mai) and the clinic (Dr Kakazu) as places of
  their own, beside the Community Hall (`town-hall`). Each lists only things that are in its room. All three are
  `captured:false` until their backdrops are taken on a computer that can run the game:
  `node tools/render-feed-backdrops.mjs town-hall school clinic`. The storyteller sets no story in them until then.
- **Checks:** the CI guard is green. `boot.test.mjs` still fails on its stale list of homes, as it does on main.

## 6. Order and gates

1. **R1–R3**: the beach, one PR. Photos at the lane's end.
2. **R4–R6**: the yard and the signs, one PR. Photos from the gate, the car park and the monument.
3. **M**: the office into the study, one PR, with the save migration.
4. **S**: the split, one or two PRs (buildings and ground, then people and stories).

No construction (S) starts until R is merged and the owner has seen it.

## 7. Questions for the owner

1. **The study or a separate office on Kitano-jima?** The recommendation is the study (section 4).
2. **Should the town's register stay playable?** If yes, it goes to the Community Hall, with Nhung or Ms Ganaha at its
   counter on given mornings. If no, the archive lives only in the study.
3. **Three separate buildings with gaps between them, or one terrace with party walls and three fronts?** The gaps read
   better as separate structures. The terrace costs fewer draw calls (handoff item 6, phone smoothness).
4. **School name.** It is 港小学校 now that the junior high is gone. Or keep 港小中学校 as a painted-over sign, for a
   story.
