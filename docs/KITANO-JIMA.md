# Kitano-jima: the hamlet, the villagers, and the ferry's crew

> **History (19 October 2026).** The cast, households and crew described below are those of 12–18 October 2026. The consolidation ([CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md); the report [CAST-CONSOLIDATION-REPORT.md](CAST-CONSOLIDATION-REPORT.md)) retired Grandmother Chinen and removed the Chinen house (kitano-3), retired Reiko (Nhung prints the paper), made Nils the chief engineer rather than the mayor (`mayor-home` stays as a site id only), and gave the Kitano pier its named line hand, Kai, in the Shiroma house (kitano-2). The island's terrain, airport, pier and facilities are as described.

The creator, 2026-10-12: *"How about the staff and passengers I mean the crew, can you build in that some villagers maybe
live at the tropical island, move their home there, I think Johansson should live on the tropical island."*

Three things, built in three batches, people never in the same batch as buildings (CLAUDE.md):

| Batch | What | State |
|---|---|---|
| 7a | **Kitano hamlet**: three walled houses by the pier, Johansson's among them (his rooms move out of the town hall) | built, below |
| 7b | **The villagers**: Chin and Tetsuo move from the Front-Row yard to the house to let; Jun's home life in his house; the ferry commute | planned, §3 |
| 7c | **The crew at their posts** aboard the Minato Maru, by phase, with looks and lines | planned, §4 |

## 1. What was there (2026-10-12, before 7a)

Kitano-jima (`src/world/airport-island.js`, `tropical-island.js`, `airport-district.js`) had the airstrip behind its
fence, the terminal, the plaza with three kiosks, the departure lounge, the pier with the cargo court, the Hinata lookout,
Coral Bay with its bar, Turtle Cove, and the jungle trails: **no house, no village, no road but the cargo court.** One
person lived there: Jun (`src/people/neighbours.js`), who checks the commuter tickets, whose "home" was a hidden point on
the passenger walk. The ferry's prompt about the bicycle rack spoke of "the way from the pier to the village": that
village did not exist (the village in the menus is Hoshizaki, on Minato's own island). Walking residents cannot reach
Kitano-jima on foot (no bridge: `kitano-link-plan.js`); commuters who take the ferry are hidden "away" at sea.
Johansson's home was the room `mayor-home`, the town hall's east wing (`src/world/school.js`, `interiors/town-hall.js`),
with his futon, television, post and bath, and the furniture Johansson Studio puts in it.

## 2. Batch 7a: Kitano hamlet (北野集落)

**The plan.** A sandy lane of crushed coral runs south of the cargo court (island frame u −47…−20, v 47.5–51.5), about
twenty metres from the ferry's landing. North of it a row of two walled plots with their gates on the lane: **Jun's
house** (`kitano-2`, concrete, block walls, the bicycle in the yard: 城間, the Shiromas) and a **red-tile house to let**
(`kitano-3`, coral walls, hinpun, fukugi: 貸家). South of the lane, with the sea behind it, **Johansson's house**
(`kitano-1`, red-tile, coral walls, a gajumaru and his bicycle in the yard: ヨハンソン). Each plot has its slab (the
plateau here runs 0.9–1.25 m, the yards sit at 1.3, the lane at 1.22), its walls, its gate with the shisa on the posts
and the nameplate beside it, and the house at the back, in the Okinawan kit the Kitahama houses are built with
(`okinawa/houses.js`), so the hamlet is of the same town. Layout: `src/world/kitano-hamlet-layout.js` (no imports, read by
the ground and the plantings); builder: `src/world/kitano-hamlet.js`, on the island's own group in its frame, with every
wall's and house's collider turned into the world with the island.

**Johansson lives there.** The gate of `kitano-1` is the site `mayor-home`: through it are his rooms as they were
(`buildMayorHome`: the genkan, the low table, the futon that sleeps him until morning, the kitchen, the television with
the evening news, the bath, the letter box, the photographs), with the furniture Johansson Studio put there, because the
room's id and the group's name did not change; only its door moved across the water. The town hall's field face keeps
the community kitchen, the mayor's office and the clinic; the east-wing door is gone. *Go home* from Minato now means
the ferry: a crossing from the office, as the household registry says.

**What it touches (checked).**
- `airport-ground.js`: the lane and the three yards are public floors (`KITANO_HAMLET_FLOORS`), so feet stay level on
  the slabs; the gates' doors are on the lane's floor.
- `tropical-island.js`: no palm, tree, shrub or rock in the hamlet's rectangle (the seeded plantings reshuffle after it;
  the trails keep their clearance by their own rule).
- `districts.js`: built after Kitahama's and Fumoto's houses, with `options.sites`, so each gate is a door like theirs;
  `home-exit-label.js`: *Exit to the lane*; `island-households.js`: Johansson at `kitano-1`, Jun at `kitano-2` (the
  nameplates' "who lives here" lines read it, as the family-home interiors do).
- Tests: `school` (the town hall's doors), `boot` (the sites list, every site entered, the stability check that every
  door and its exit step are clear), `island-growth`, `airport-dock-access`, `airport-island`, `kitano-link`,
  `home-interiors`, `home-exit-label`, `residential-quarter`, `distant-islands`, `town-hall-plan`, `airport-ferry`.
- In the game: sailed over, walked the lane, read the gates' prompts, went in at Johansson's gate (his rooms, the exit
  label), looked at the row from the cargo court and at his house from the west.

**Found and fixed on the way.** The Okinawan kit records every house's service drop as a power node on the group it
finishes, in the kit's own frame; the town's power station then strung feeders to those points read as Minato
coordinates, and a wire hung over the coastal road at (−37, 44.5) became "ground" for the walk surface (the
`garden-bridge-access` test caught it). The hamlet now finishes into its own group and drops that network: Minato's
lines do not cross the strait. The island's own supply (a pole line from the airport's generator) is open.

**Open after 7a.** The 待合所 waiting shelter at the pier (the brief's §6.2); the lane's own lamp and power; a path from
the lane to Coral Bay; the yard-home at 2 Front-Row Yard still Chin's and Tetsuo's until 7b.

## 3. Batch 7b: the villagers (planned; the creator's lore of 2026-10-12 below rules)

The creator, 2026-10-12, after 7a: *"Thuan is Johansson's wife, they live together but she stays on the port town in the
weekdays and in the weekend she is home with her husband and Nhung covers in the shop and the book store is closed in
the weekend. Sakura is always open, it should change to 24-7 and have Chin work the night shift; Chin is Thao's
husband."* So:

- **Johansson and Thuan are married.** Their home is `kitano-1` on Kitano-jima. On weekdays Thuan stays in Minato at
  1 Kitahama (her weekday room, with Thao); on Friday evening she takes the ferry home to Kitano-jima and is there
  with her husband until the Monday morning boat. The household registry, the nameplate (ヨハンソン: Johansson & Thuan)
  and her "I live at…" line say so. In his house her futon lies beside his.
- **Chin is Thao's husband**: he lives with Thao at 1 Kitahama, not in the Front-Row yard. Tetsuo, alone in 2 Front-Row
  Yard, moves to Kitano-jima's house to let (`kitano-3`): his radio test is at the airport, his kei truck collects its
  cargo. 2 Front-Row Yard becomes the house to let in town.
- **Sakura Shōten is open 24 hours, seven days.** Thuan keeps the day shift on weekdays; **Chin works the night shift**
  (every night, after the workshop closes); **Nhung covers the day shift at the weekend** while Thuan is on Kitano-jima.
- **Front Row Books is closed at the weekend** (Nhung is at Sakura; Reiko's paper still comes out).
- Island residents (Johansson's wife at weekends, Tetsuo) are **ferry commuters** at Minato and keep **home life** on the
  island; Jun gets his house.


- **Tetsuo moves to `kitano-3`** (his profile's `home` getter in `people/residents.js` returns the hamlet gate; `world.homes`,
  the registry and 2 Front-Row Yard follow). At Minato he is a **ferry commuter** (off the morning boat, to the
  workshop, the evening boat home); on the island he keeps **home life** at his house.
- **Jun** gets his house: his routine's "off duty, home" is `kitano-2`'s yard and, when Johansson calls, his room.
- **Nameplates and dialogue**: "I live at Kitano hamlet, across the water"; the ferry's bicycle-rack prompt is true.
- Tests: `yard-homes` (2 Front-Row Yard to let), `continuous-life` (home owners' sites), `home-interiors`,
  `thuan-*` unaffected, a new `kitano-hamlet` test (the commute's timetable, the island home life).

### 7b-1, built: the households (2026-10-12)

- `people/households.js`: `yuri-home` is Thuan, Thao and Chin; 2 Front-Row Yard (`resident-home-kenji`) has no
  household and is **to let** (`yard-homes.js` now builds every yard house, the empty one with the agent's board, a
  family-home interior and *Look round*). `kitahama-layout.js`: 1 Kitahama's residents and nameplate name the three.
- `people/kitano-residents.js`: **Tetsuo lives at `kitano-3`** (the Chinen house, 知念); his profile's `home` is the
  hamlet's gate (world coordinates), his address Kitano hamlet; with no household in town he is no longer a home
  owner, so the timetable's commuter rules carry him: the 14:30 boat in, the workshop's afternoon-and-evening shift,
  the morning boat home, and `awayPlace` says *at home on Kitano-jima*, not the mainland.
- **Chin keeps the yard's day** (lunch at Sato, the workshop, the evening, then home) from 1 Kitahama: the commuter
  rules sent him through the generic branches and lost his lunch (the `continuous-life` test found it).
- Rooms: the family home lays **three futons** (red tile: Thuan's in the nibanza, Thao's and Chin's in the uraza; concrete:
  three in the east room) and a third seat at the low table's west cushion; the shared Kitahama room gives a third
  person the middle futon; Thuan's futon is in Johansson's house, folded by day in the corner by his pillow
  (`town-hall.js`); `home-life.js` gives Chin a place in the Yuri apartment.
- Texts: the household registry (Thuan his wife, Chin Thao's husband, Tetsuo at kitano-3), the hamlet's nameplates
  (ヨハンソン: Johansson & Thuan; 知念: Chinen), the residents' *I live at…* lines.
- Tests updated: `yard-homes` (to let), `resident-home-plan`, `visual-home-camera`, `seat-layouts`,
  `neighbourhood-access` (Tetsuo no longer in the park at 13:00: he is on the island), `home-interiors`,
  `continuous-life`, `town-hall-plan` pass with the rest of the household suite and `boot`.
- Open for 7b-2 and 7b-3: Sakura 24/7 with Chin's night shift and Nhung's weekend cover, Front Row closed at the
  weekend, Thuan's weekends on Kitano-jima, Jun's home life, the guide's portraits and backstories (Johansson's wife,
  Thao's husband) regenerated.

### 7b-2, built: Sakura open 24 hours, the rota, the weekend (2026-10-12)

- `commerce/sakura-rota.js` is the one place that says **who is at Sakura's counter**: Thuan 09:00–20:30 on weekdays,
  **Nhung** the same hours on Saturday and Sunday (Thuan is home on Kitano-jima), **Chin** 20:30–06:00 every night,
  and Grandmother Sakurai, who owns the shop and lives above it, 06:00–09:00 (she has no walking body yet; the counter
  keeps the last clerk's binding). The day clerk hands over at 20:30 so her end-of-day restock (`shop-stock.js`
  `closingDay`, from 20:00) is done with the night clerk already in the shop.
- **Sakura never closes**: the konbini hours, the shopfront shutter (always up; a fixture can still set it), the strip
  lights and the interior tubes (full strength all night), the shutter text, flyer, town papers and specials board
  ("Open 24 hours, every day"; the hot case still runs 09:00–20:00), and the staff board's rota. Purchases no longer
  wait for opening time; the till, the sold-out line, the restock entries and the recycling box name whoever is on shift.
- **The clerk follows the rota**: `shop-retail`, `indoor-residents` and `sakura-shop` bind the counter's services to the
  body on shift and re-bind when it changes (`followRota`).
- **Plans**: Chin works the night shift, sleeps 06:30–13:30 at 1 Kitahama, keeps his afternoon at the bench and loses
  his Sato lunch slot (he is asleep); Nhung minds Sakura at the weekend and has no bookshop day then; Thuan's weekday
  market shift is gated by the rota; **Front Row Books is closed at the weekend** (`town.js isOpen`, no bookshop
  visits). Tetsuo, who had fallen into the night-bus pattern after moving to Kitano-jima in 7b-1 (at the izakaya at
  midnight, away all day), now takes the 08:30 boat over, works 09:00–18:30 with lunch at Sato and goes home on the
  22:00 boat (`commuter-schedule.js`).
- Checked in the headless game: at 23:00 the shop is lit, the shutter up and Chin at the counter; on Saturday at
  10:00 Nhung is the clerk and Thuan is at home. Tests: the shutter, strip-light and tube tests say "always on";
  `continuous-life` and `npc-seating` use Nhung's and Reiko's lunch visits; `sato-ramen` has no slot for Chin.
- Open: Grandmother Sakurai's body for 06:00–09:00; Thuan's weekends on Kitano-jima (7b-3: at the weekend she is at
  home at 1 Kitahama, not yet across the water); Reiko is held at the market room's origin with `place: market` at all
  hours in the headless game, on main as well (an old resident-location record; not this batch's); the specials
  text in `activities.js` still says Thuan in places that are hers anyway.

### 7b-3, built: Thuan's weekend, Jun's house (2026-10-12)

- `social.js thuanWeekendAway/thuanWeekendPlan`: from the Friday 22:00 boat to the Monday 08:30 boat Thuan is **away,
  "at home on Kitano-jima with her husband, Johansson"**; on Friday evening, after Minato with her sisters, she walks
  to the ferry instead of home to Kitahama (rain sends her straight to the boat), and on Monday 08:30–09:00 she is
  "arriving on the ferry from Kitano-jima". Read before her Kitahama room's sleep and breakfast. Day 0 is a
  Wednesday (`town-clock.js`), so Friday is day 2.
- `neighbours.js`: **Jun's off-duty home is kitano-2's gate** (the Shiroma house); he walks there from the terminal at
  20:00 and is hidden indoors, as the island's other neighbours are at home.
- Tests: `kitano-residents.test.mjs` (Thuan's weekend, the rota, Tetsuo's ferry day, Jun's home);
  `thuan-daily-life` knows Friday.
- Open: bodies at home on the island (Thuan in Johansson's house at the weekend, Tetsuo and Jun in theirs when the
  player calls; today an island resident who is "away" has no body); the guide's portraits and backstories for the
  new relationships.

### 7b-4, built: the creator's correction (2026-10-12)

The creator: *"Only Johansson and Thuan live on the hamlet, the others live in the port"* and *"Tetsuo's mother lives on
the Hamlet in an old house"*. So:

- **kitano-1**: Johansson and Thuan, unchanged. **kitano-3**, the old red-tile Chinen house: **Grandmother Chinen, Tetsuo's
  mother**, a neighbour (`people/neighbours.js`: sweeps the lane in front of her gate from 06:30, sits at her gate for the
  breeze from 15:00, home otherwise; three lines about the house, her son and the mayor's wife). **kitano-2**, the
  concrete Shiroma house, is **to let** (its plate says so). `island-households.js` and the plates follow.
- **Tetsuo lives in the port again**, alone at 2 Front-Row Yard (`households.js`, `YARD_RESIDENT_NAMES`): his old day
  (lunch at Sato, the bench from five until midnight) and no boat; his line says his mother is across the water.
- **Jun lives in the port**: off duty his home is the ferry terminal's exit in Minato (he is hidden there); his body
  cannot yet walk the crossing, so he is hidden at the terminal until his shift (open: his ferry ride).
- Tests: `kitano-residents` (Tetsuo in the yard, Mrs Chinen, Jun in Minato), `yard-homes` (Tetsuo's door),
  `neighbourhood-access` (Tetsuo in the park at 13:00 again). Checked headless at 16:00: Grandmother Chinen at her gate.
- Open: an authored look for Grandmother Chinen (she borrows Fumiko's); Jun's crossing on the boat.

## 4. Batch 7c: the crew at their posts (built 2026-10-12)

The data is there (`people/ferry-crew.js`: the master, Mr Nakandakari the chief, Mr Higa Jr the oiler, Ms Uezu on deck,
Kōji her relief; `FERRY_WATCH` says where each is in every phase). Nobody is aboard. The batch: actors parented to the
ship's group (so they ride with her, as the inspect prompts do), one per post, placed by `FERRY_WATCH` for her phase:
alongside, the master in the wheelhouse, the chief at the booth's desk, the deck hand at the gangway or the ramp, the
purser at her window; under way, the master at the wheel, the chief by the engines, the deck hand on the car deck. Each
with a look (recipes in `avatars/cast.js`, portraits for the guide), a prompt with a few lines of their own, and the
purser's window selling nothing yet (section 7 of `docs/FERRY-AUDIT.md`). Tests: each post occupied in each phase, every
actor on a floor of hers.

**Built.** `src/people/ferry-crew-aboard.js`: one body per post of `FERRY_CREW`, a child of her group, placed by
`FERRY_WATCH` for her phase (`watchPhase`: her own phase by day, *night* outside `FERRY_DAY`), at `CREW_POSTS` (the
wheelhouse at the wheel, the port wing, the control booth, the floor plates by the engines for the oiler's watch, the
aft mooring station, the bow between the bow houses, the foyer at the gangway, the car deck, the saloon's cross
passage, the crew corridor by the mess and by the cabin), facing the work. The master is the bus driver, as
`ferry-crew.js` says; his body in town is hidden while he is aboard. At night the chief and, on her week on, the deck
hand. Each has a *Talk to* prompt that rides with her, saying what they are doing in this phase and why they have the
job. Looks are the cast's recipes (generated for the three new faces until recipes are authored). Wired in `game.js`
beside the neighbours and ticked with the town. Tests: `ferry-crew-aboard` (every post of every phase on one of her
floors and clear of her walls; who is aboard by day and night; the bodies ride with her; the town body hidden). In the
game: alongside, Mr Higa Jr in the foyer and Ms Uezu on the car deck with their prompts; at sea, Ms Uezu at the bow
end of the car deck. Open: authored looks and portraits for Mr Nakandakari, Ms Uezu and Mr Higa Jr; the purser's post
(the manning's eight); the crew moving between posts instead of appearing at them.


## 5. Batch 7d: Johansson's house from the creator's drawings (2026-10-13)

The creator, 2026-10-13, with a CAD set: *"Can you use these drawings and model Johansson’s house on the tropical
island?"* Rev B came first, then Rev C (coordinated plans with real wall gaps), then the **Final Rev F** (the coordinated
game production reference: manifest schema 2, the collision and navigation contract, schedules, services, a reference
simulation of the house's systems). The house is built from **Rev F**; Rev C was built first and committed as a
checkpoint, then replaced. The design book is `docs/johansson-house/README.md` (generated: the plans as SVG and the
as-built plans as DXF on Rev F's layers with the game's own beside them, the rooms, findings RF1–RF8).

**The drawings, read.** `tools/johansson-house-import.mjs` reads `docs/johansson-house/cad-rev-f/` into
`src/world/johansson-house-cad.js` and checks the package on the way in (SHA-256 of every file, the collision contract
against the manifest, each plan against the manifest cut 1 m over its floor, the room and opening schedules, the roof
and site plans). `src/world/johansson-house.js` is the house as built; its departures are the findings:
- **RF1:** the genkan's partition stood across the foot of both flights (140 mm of floor in front of them; the
  drawings' own navigation links end in the genkan): it is opened between the well's guard lines under a 2.1 m head, so
  the stair rises from the genkan. D-G0-ENTRY-HALL stays a doorway without a leaf (no wall left to slide one over).
- **RF2, RF3:** guards the drawings leave out: the upper floor's edge over the foot of the flight up, and the inner side
  of each upper flight (a 2.2 m drop onto the lower one).
- **RF4:** the sockets, drawn 350 mm off the walls, are on the walls.
- **RF5, RF6 (open):** the services and the systems simulation are the next batches; the equipment the drawings place
  (the boards, the water heater, the manifold, the lift pump, the outdoor units) is built and can be looked at.
- **RF7 (open):** the basement and the court are 1.5 m under the sea's level. **RF8:** the plot.

**Outside.** Plot `kitano-1` grows to 17 × 22 m (island u −49.5…−32.5, v 51.5…73.5; its slab goes down to 0.2 m where the
ground falls to the beach; the planting rectangle grows behind it, 4 m clear of the Coral Bay Bar). The house stands 7.5 m
in from the gate (room for the garden stair down to the court), its ground floor level with the yard (Rev F: no porch
step), the walls and openings as drawn, the slab bands, the front door with its letter slot, the drawn hipped roof of
red tile (the drawings' own mesh, eaves +5 800, ridge +8 000) with its hips and ridge pointed in lime and a shisa on the
ridge, the two roof sleeves capped until their pipes go through, and the outdoor units of the two cooling zones on
their stand by the house's east wall. The yard keeps the hinpun, the path, the gajumaru and his bicycle; fukugi along
the seaward wall and the back; the drawn terrace behind the back door.

**Inside.** The mayor's home is the house (`buildMayorHome`, `MAYOR_HOME_FLOOR` in town-hall.js are the house's), so
the game, Johansson Studio and the furniture tool find it by the old names. Nineteen rooms on three storeys, walked
floor by floor (`house-walk.js`: the floor nearest the feet within a step, and now nobody stands where a floor's body is
in theirs, so you step onto a flight and never walk under one lower than your head); the stacked dog-leg stair with
closed strings, soffits and the drawn guards; seventeen timber sliding doors (*Slide the door*) that carry their
colliders as they slide and keep their state by id in the save under `johansson.house.v2`; every room furnished for what
it is for; the boards on the riser in the genkan and the halls, the heater and the manifold in the boiler room, the lift
pump's cover in the sauna's shower. Walked in the running game: up both flights from the genkan to the upper floor and
down both to the basement.

**The court, the garden stair and the lightwell (the ground batch).** Dug into the yard as drawn: the court outside
D-BEXT 2.8 m down between its retaining walls and their 1.1 m parapets, its floor draining to the storm sump's grating;
the garden stair down into it from a paved top landing at the yard (16 × 175 mm, 1 000 mm clear between cheeks over the
200 mm the drawings leave either side); the lightwell outside the club's window with its drain and guards. The yard's
slab is cut round them (`kitano-hamlet.js`), the island's ground has no cells in them (`tropical-island.js`), and the sea
is not drawn in them (`ocean.js` `setOceanPits`, up to four fixed pits beside the ferry's moving hole): both floors are
under the sea's level. The island's public floors can slope (`airport-ground.js` `floorHeight`), so the stair is walked
through its nosings: walked in the running game down into the court and back up to the yard. D-BEXT is bolted from
inside (*Try the court door*, from either side).

**Open.** D-BEXT as a way in (with the systems' flood alarm). The services and the systems (RF5, RF6). Game_Integration.md's
host acceptance (phones, frame rate under the town's load).

**Found on the way.** Studio's furniture tool counted the basement's colliders under the living room: it ignores
colliders whose top is under the floor (`placements.js`). The residents' room navigator keeps 0.32 m from walls on a
0.2 m grid, so it cannot plan through the house's 900 mm doors: when residents live in the house, plan their walks on
the house's own floors.

## 6. The quick crossing (2026-10-13)

The creator: "Include a quick travel point at the docks to travel to the island and back", and "quick crossing should be
free it's only Johansson who can do it, npcs need to go by ferry". The Minato Maru's landing sign (のりば) stands at
each end of her run (`src/world/ferry-quick-crossing.js`): on the outer pier 0.7 m north of her gangway, off the berthing
face and clear of her lines and the queue (北野島行), and in the place of the Kitano-jima jetty's north rail stanchion at
its shore end, off the cars' lane (港町行). Each box reads the destination, フェリーのりば, and her name and minutes
(みなと丸 · 所要22分, from `AIRPORT_FERRY.duration`). The residents read it and take her. Johansson's prompt at it,
"Quick crossing to Kitano-jima" / "Quick crossing to Minato", takes him to the sign at the other end at once: no fare,
no time passes, nothing is filed, and the ship, her cars and her passengers are left as they are (`island/play.js`
`quickCrossing`; tests in `tests/airport-ferry.test.mjs`). The ferry ride stays as it was for him too.

## 7. Built when he goes there (2026-10-13)

The creator: "tropical island doesn't need to load until we are there we see it in the distance but it's not the whole
island". The game builds Kitano-jima's ground, airport, sites and prompts at startup, and a distant view of its plants,
district and hamlet; the real ones are built while the Minato Maru takes him over, or behind the quick crossing's veil,
or at once before anything puts him there (`src/world/kitano-on-demand.js`; docs/LOADING.md batch 3). Every new
builder on the island goes through `kitanoLater` (and, if it is seen from Minato, gets a stand-in through
`world.kitano.far`), so that the island built on demand stays the island built whole
(`tests/kitano-on-demand.test.mjs`).
