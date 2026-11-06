# Next session: the brief (written 2026-10-10 at the end of a long session)

Read the repo's CLAUDE.md first. Game work: small batches, check each in the game, never ground/lighting/characters together.
Pushing `claude/sjoskolan-youtube-strategy-gofi3o` deploys the live game: test and look before pushing.

## 1. The Minato–Kitano-jima ferry (the creator, 2026-10-10)

**Status (2026-10-10, later):** audited and the first batch built: `docs/FERRY-AUDIT.md`. The Minato Maru (22 m, three
cars) is modelled whole, hull and underwater body; her particulars, machinery, load balance and scenarios are data
(`src/world/ferry-ship.js`); her crew is allocated (`src/people/ferry-crew.js`). Next: the open list in the audit, §5.

> "the ferry , I think it's easier if you audit it as marine ship construction engineer in Japan in the 1990's now it
> looks like a floating toy, it needs to be a realistic functional ship with loading decks, passenger waiting spaces, a
> realistic functional engine room with realistic engine electrical distribution and supply for all common systems found
> on a real ferry , and have a crew (some of our NPCs can be the crew and invent a new one if needed. Maybe a mess room
> or a small can time and crew accommodation places on the ship and fully functional propulsion and hydraulic systems
> what more did I miss , I'm sure a ship building auditor would find it"

Audit first, as a 1990s Japanese ship-construction engineer (a small island car-and-passenger ferry, フェリー, about
40–60 m, built to JG / NK rules, of the kind that ran between Okinawa's islands). Write the audit and a plan, then build
in batches (hull and decks; interiors; machinery; systems; crew and routines), each one checked in the game.

What a real ship of that kind has, so nothing is a toy (the creator's list, plus what an auditor adds):
- **Hull and decks:** a real hull form with draft marks and a load line; a car deck with a bow or stern ramp (hydraulic),
  lane markings, lashing points, car-deck ventilation fans and drainage scuppers; a passenger deck; a bridge deck.
- **Passengers:** a waiting cabin (carpet area to sit and lie on, as on Japanese ferries, and seats), a purser's window
  and ticket check, toilets, a vending corner, an open deck with benches, safety notices, life-jacket lockers.
- **Bridge:** wheel and autopilot, radar, magnetic and gyro compass, engine telegraph or bridge throttle, VHF and GMDSS
  radio, the paper chart table (1990s: no ECDIS), echo sounder, navigation lights panel, whistle, searchlight.
- **Engine room:** main diesel engines (two, for two shafts), reduction gears, shafts and controllable or fixed-pitch
  propellers, a bow thruster; two diesel generators and an emergency generator with batteries; the main switchboard
  (440 V) and the 100 V lighting board through a transformer; shore-power connection; the engine control room.
- **Systems the switchboard feeds:** fuel (bunkering, settling and service tanks, purifier), lubricating oil, sea-water and
  fresh-water cooling, bilge and ballast pumps, fire pumps and fire main, fixed CO₂ for the engine room, fire detection,
  fresh-water tank and hydrophore, sewage holding tank, ventilation and air conditioning, galley power, steering gear
  (hydraulic rams in the steering-gear room aft), the ramp's hydraulic power pack, the anchor windlass and mooring
  winches (fore and aft), navigation and emergency lighting.
- **Safety:** liferafts in cradles (hydrostatic release), a rescue boat and its davit, lifebuoys, life jackets, muster
  stations and their signs, fire extinguishers and fire stations, emergency escape routes marked.
- **Crew** (some from the existing residents, one or two new): master (船長), chief officer, chief engineer (機関長), an
  engine oiler, bosun and deckhands for the ramp and mooring lines, the purser who sells tickets, a cook. Each with a
  watch routine (in port: ramp, lines, tickets; at sea: bridge watch, engine-room rounds) that the storyteller can use.
- **Crew spaces:** a mess room (a small canteen), a galley, crew cabins, a changing room by the engine room.
- **Port side of it:** the linkspan or ramp at the berth, fenders, bollards the lines go to, the ticket office, the
  queue for cars and the passengers' walk to the gangway.
- **Behaviour:** docking against fenders, lines out, ramp down, cars and passengers off then on, ramp up, lines in,
  away; engine sound and wake; the timetable the town already has.

Everything must stay light enough for phones, and usable by the storyteller (stories about the crew, a blackout at
sea, a fouled propeller, a broken ramp…). The engine room's electrics should be as real as the onsen's (see
`src/world/interiors/onsen-electrics.js` for the house style: real numbers, a source, tests).

## 2. "Fujita's Back" comic (studio repo /home/user/jojo, content/onsen-breaker/)

- **The massage chair must read clearly** (the creator, 2026-10-10: "The chair needs to be clearer in the comic it's a
  bit blurry we don't see what Fujita is wanting to sit on"). Build a recognisable 1990s coin massage chair in the game
  (a props batch: a padded seat with a back and headrest, armrests with the coin box and a control panel, lighter
  upholstery than the walls), then rephotograph 2c, 4b, 4d, 5b, 6i, 7c with the chair large and sharp.
  **Status (2026-10-11):** the chair in Umi-no-yu is now Studio's coin massage chair (sky-blue vinyl, ivory shell, coin
  box, remote, calf and foot massager), placed through World's catalogue (§5) where the old one stood, with the same seat
  and marks. Next, the film's agent re-photographs the plates that show it (2c, 4b, 4d, 5a, 5b, 6i, 7c, 7f, film 8a,
  comic 6f and 8a), regenerates `onsen-set/colliders.json` (the leg rest is new) and the chair's box in the storyboard.
- Game characters batch: the carry (Fujita level like a plank, hands under him), Mrs Higa reaching back for the breaker
  without looking, Tetsuo's paper lower so his pocket torch shows, Nhung's half-dried hair stronger. Then draft 5.
- The studio's rule: simple panels, one subject, no grey blurs or foreground masses (`.claude/agents/cinematographer.md`).

## 3. Smaller game items

- Turn the ferry-canopy bench (src/world/port-building.js) to face the berth; move the post box off the neighbourhood
  bench (src/world/town.js:167). Look at both in the game first.
- The camera in very tight spots shows only the top of his head: pull it to an over-the-shoulder view.
- `kit.rect` in src/world/okinawa/kit.js makes colliders too small for small positive rotations: check other objects.
- Questions for the creator: Thuan's Wednesday off? A loading screen until interiors are ready? Town book rows that
  show where a resident is?
- The town's on-screen name is now Minato Machi: change it in the studio's comics and stories when next working there.

## 4. Modular comics in Johansson Studio (the creator, 2026-10-10)

> "I mean here in the comic, is it a way to enhance and make the comics modular, I'm thinking if it can be incorporated
> into the Johansson Studio?" (about page 2's bottom panel: the massage chair reads as a brown slab.)

Two causes: the game's chair is a plain box, and the comic shot it as a wide set photo. Plan:
- **Prop hero shots:** every important prop in the town gets a "hero" render: the model alone, lit, on a plain
  background, at a fixed three-quarter angle, with its name and purpose from the data (who it's for, why it's there).
  Rendered once by a tool from the game's own model, stored in a prop library the studio reads.
- **Panel modules:** the comic engine gets reusable panel types, picked per panel in the storyboard instead of
  hand-coded per story: `set` (a room photo), `cast` (people on a plain background), `insert` (a prop hero shot,
  big, optionally with a label or a coin/hand), `dark` (eyes and voices), `explainer` (diagram + presenter),
  `sfx` (a sound filling the panel). Each module has the simplicity rule built in.
- **In Johansson Studio** (the Town Studio app): a storyboard editor where each panel picks a module and its subject
  (a resident, a place, a prop from the library), previews it, and the comic builds from that. The same modules feed
  the film's shots.
- First use: page 2's chair as an `insert`, after the massage chair is rebuilt as a real 1990s coin massage chair.

## 5. Studio's 3D modelling section: build assets in Studio, assemble them in World (the creator, 2026-10-10)

> "I would like to build assets in studio and assemble them in world , I would like to implement a 3d modelling section ,
> that can make assets in code or by drawing"

Studio is the Python app in `jojo/town-studio` (`python3 -m townstudio`, a local web page). The modeller is a new page in
it, using World's own vendored three.js and toon look, so what you model is exactly what World shows.

- **One asset = one folder** (`jojo/town-studio/assets/<id>/`): `asset.json` (name; purpose: who it is for, why, where
  it belongs, per the "nothing is random" rule; real size in metres; colours from World's palette; collider; seats,
  standing spots and the action label; phone budget) plus its shape as either a **code recipe** (a small JS module using
  the same kit World uses: boxes, cylinders, lathe, extrude, rounded boxes) or a **GLB**.
- **Two ways to make one, same result:**
  - *Code*: an editor beside a live 3D preview; edit numbers, see the model change.
  - *Drawing*: sketch on a grid with a finger or mouse: draw a side profile and spin it (lathe: pots, bottles, lamps),
    draw an outline and give it depth (extrude: signs, panels, a chair's side), or stack and snap blocks (furniture,
    machines). Drawings are saved as the same code recipe, so they can be refined in code later.
- **Checks before publishing:** stands on the floor (no floating), real-world size next to a 1.6 m resident, under the
  phone budget (triangles, materials), collider generated and sensible, purpose filled in, no real brands.
- **Outputs:** a GLB + `asset.json` published into World's catalogue (`johansson-town/assets/catalog/`), and a hero
  render for the comic prop library (section 4).
- **World side:** a catalogue loader that places assets by id (from a place's layout file or the Build page), with the
  collider and interaction points from `asset.json`. Existing hand-coded props move over gradually.
- **First batch:** the asset format + the code mode + publishing one asset end to end: the 1990s coin massage chair
  (section 2), shown in the onsen and as the comic's insert. Then the drawing mode. Then the ferry's parts (section 1)
  are built in Studio this way.
- **Status (2026-10-11), World's side, first piece:** `assets/catalog/` holds what Studio publishes (the massage chair,
  v1); `tools/catalog/build-catalog.mjs` compiles the cards into `src/catalog/catalog-data.js` (`--check` runs in
  `tests/catalog.test.mjs`); `src/catalog/catalog.js` places an asset by id (`placeAsset`: the model, its card's colliders,
  seats, spots and anchors in the place's frame, parts the place draws itself left out), loads its model once
  (`loadAsset`, the model's hash in its URL) and fills a place in late for a host that does not wait (Studio's Build
  scene). The onsen's chair is the first (`src/world/interiors/onsen-chair.js`); the game fetches a room's assets as its
  door comes near and waits at the door if they have not come. Open:
  - *Ground (done, its own batch before the chair):* the agarikamachi now turns at x 3.0 towards the street wall
    (`GENKAN_STEP.turn`), and the lobby's hinoki runs to the street wall at the east end, so the chair stands wholly on
    the boards and a bather reaches it barefoot (`tests/onsen-front.test.mjs`, `tests/onsen-chair.test.mjs`). The film's
    plates of the genkan's east end are re-photographed with the chair's.
  - *Play (done):* seated in the chair the prompt reads "Massage ¥100 · Stand"; the action opens its menu (put in a ¥100
    coin, keep sitting, stand up). A coin starts the LED at 10:00, lights the lamp and the rollers knead; with no power
    Higa-san hands it back and nothing is charged; standing up early leaves it running to 0:00. The seat carries the
    card's label "Sit in the massage chair (¥100)" (`tests/onsen-massage-coin.test.mjs`).
  - *People (later):* a regular in after-bath clothes takes the chair after the bath (a routine, a reservation, the
    load on circuit 1, a storyteller line).
  - *Characters:* in KneelHug Fujita's right hand goes 4.5 cm into the chair's left arm (`tests/story-gestures.test.mjs`
    todo).
  - *Studio:* run World's build-catalog.mjs from its publish step; put a rating-plate anchor and the roller track's extent
    on the card (World still draws the plate itself); measure keepClear again without the retired cloud of hair; check a
    card's spots against the room it is placed in (the coin spot is 0.17 m from the koagari's corner, so World keeps it as
    a film mark); a band hint per colour if the vinyl washes out under the lobby lamp at night.
  - *Next pieces of the loader:* placing by id from a layout file and from the Build page (§6), moving hand-coded props
    over, regenerating the building survey (docs/building-plans still lists the old boxes).

- **Studio on the iPad: "Make model" (2026-10-14).** The creator, seeing a parametric lampshade page: "Yes proceed I want
  all assets to be available in a studio maker as well and easy to export". Taken from that page: a shape driven by a
  profile with ribs, twist and bulge, live checks while you drag, presets and a sealed mesh; not copied: its 43k
  triangles, glossy transmission materials, CDN scripts and STL-only export.
  - *Done:* Studio's fifth workspace, **Make model** (`avatar-creator/model.js`, `model-assets.mjs`): every catalogue
    asset and every prop in the registry as picture tiles grouped by kind, searchable, opened in World's look (its
    lights, cel pass and ink) to orbit by finger, optionally beside Miss Higa. The desktop's checks run live as Pass/Fail
    lines: `src/studio/modeller/checks.js` and `rules.json` are byte copies of `jojo/town-studio/modeller/` and
    `card-checks.js` ports `townstudio/assets.py`'s card checks (`tests/asset-modeller.test.mjs` holds all three to the
    desktop). One tap each, made ahead of the tap so iPad Safari keeps it: **GLB** for World (a catalogue asset's own
    file; anything else written by World's GLTFExporter, its root the asset node at the origin, real metres), **STL**
    (millimetres, z up, with a sentence on whether it is watertight), a 1200 × 1200 **transparent PNG** in World's look,
    and the **asset card**, all named `<id>.v<version>.<ext>`.
  - *Done:* the **Lathe maker** (`src/studio/makers/lathe.js`, in World's src so Studio, World and the desktop build
    the same mesh from the same parameters): chōchin, andon, vase, bottle or can, bucket, wooden onsen tub, three
    presets each; a profile of draggable points, height, radii, bulge, ribs (count, depth, round/pleat/flute/facet,
    round it or up it), twist, wall, sides, open or closed ends, rims and hoops, colours from World's palette (each
    with where World uses it), glow for the lamps (World's own lantern halo), and a smoothness the phone budget caps.
    A design is saved as its parameters (`card.maker`), in the browser and in its asset card, and opens again. The
    bandai andon in `onsen-lobby.js` is drawn inline; the andon preset "Bandai andon" is its standalone twin.
  - *Done:* the hand-off. A made asset whose checks all pass is sent as a package (`<id>.v<n>.studio-asset.json`: the
    resolved card, GLB and hero, each with its sha256); the johansson-studio tools `asset_list`, `asset_export` (the
    iPad's files drawn in headless Studio), `asset_draft` (checks it again into `data/studio/draft/assets/<id>/`) and
    `asset_publish` (only on "update World": into `assets/catalog/`, `index.json`, `catalog-data.js`), documented in
    `avatar-creator/docs/STUDIO-MCP.md`. Proved once with "Minato akachōchin" (a red izakaya chōchin): made in the
    maker, exported, looked at full size beside Miss Higa hung 2.2 m up, and kept in the draft; not published.
  - *Findings (World's own props against the desktop's checks):* the cord reel (9 materials), the voltage tester (10),
    the paperback (8) and the pumpkin lantern (5) are over a prop's 4 materials; the pumpkin lantern's face floats a
    few millimetres off its lobes; the cardboard obake is under a centimetre thick (a sheet). Each is shown as a Fail
    line, not hidden. Most hand-coded props are not watertight (open planes and cylinders): the STL says so.
  - *Done:* the desktop Studio builds a Lathe design from its card's parameters with this same maker (jojo
    `town-studio/modeller/build.js buildMaker`), checked: the same 2,688 triangles and the same checks pass.
  - *Open:* the desktop's Models page has no Lathe controls of its own (it opens and checks a design); the drawing modes "outline and extrude" and "stack blocks"; a `wearable` kind (§10); World placing a
    made asset somewhere (a layout file, §6); materials for a print (an STL has none; a 3MF with colours would);
    turning an open sheet into a printable shell automatically; thumbnails of registry props are drawn on the device
    on first open of the library (about a second each on an iPad).
- **The survey: what World builds in code, and which of it is in Studio's registry (2026-10-14).**
  - *In the registry (16):* the drinks machine (`vending.js`), the paper pumpkin lantern, the jack-o'-lantern pail, the
    plush and cardboard obake, Kuro, the cord reel and the J-Coffee can (`halloween-props.js`), Tetsuo's pocket torch,
    the rattan locker basket, the evening paper, Miss Higa's paperback and the voltage tester (`story-props.js`), the
    park's tea stop (`roadside-props.js`), the commuter bicycle (`bicycle.js`) and the kept sake bottle
    (`izakaya-devices.js`).
  - *Buildable alone, not in yet, and why:* the fish cart (`roadside-props.js buildFishCart`: built but placed nowhere,
    so it has no "where"); the obake holding a can (only the film uses it); the kei truck, car and delivery truck
    (`road-vehicles.js buildVehicle`) and the commuter plane (`airport-island.js buildPlane`): whole vehicles, which
    rules.json's kinds do not cover (a `vehicle` kind is the creator's call); the Minato Maru (`ferry.js buildFerry`):
    she has her own design book and is far past every kind's budget; Fujita's houseboat (`createHouseboatModel`): needs
    its hull GLB passed in; hats and shoes (`avatars/build.js buildHatProp`, `buildShoeProp`), costumes, the cord
    wrap, safety glasses, headlamp and gloves (`story-props.js`): fitted to a body, they wait for a `wearable` kind;
    the cleaning tools (`avatars/tools.js createToolProp`): built leaning in a hand's frame; the steamed bun
    (`createSteamedBunGeometry`): a geometry, not an object; the lantern halo (`buildHalo`): light, not shape.
  - *Built into a place, not alone:* the build catalogue's street things and the home furniture (`src/build`: bench,
    postbox, notice board…, made by factories): the next registry batch, through those factories; the rooms' small
    things (`onsen-props.js`, `onsen-lobby.js`, `sakura-*.js`, `izakaya-*.js` and the rest), drawn inline into their room
    with its colliders and actions: each moves over by giving it a builder of its own; building shells
    (`buildSakuraShell`, `buildWarehouseShell`, `buildOfficeShell`, doors): §6's building view; districts, streets,
    the park and the islands (`createTown`, `buildPark`, `buildHarbour` …): places, not assets (§6).

## 6. Studio as "Mario Maker for Johansson World": the island builder (the creator, 2026-10-10)

> "I would like a sim city kind of mode where I can build the island from my assets and build the houses and rooms and
> streets with my assets in studio and then choose to update Johansson World with it, with my studio setup the studio
> should sort of be Mario maker for Johansson World"

Studio already has a Build page (place things, save them into the town) and Publish (tests, build, then the online
town). Grow it into a builder with zoom levels, all made of the asset catalogue (section 5):
- **Island view** (SimCity-like, top-down): shape the coast and ground, lay streets and paths (with pavements, kerbs,
  crossings), zone plots (shop, home, harbour, park), place whole buildings from the catalogue, set the ferry berth.
- **Building view:** pick a building, set its floors and footprint, draw its rooms on a grid (walls, doors, windows,
  stairs), choose the facade, sign and roof from the catalogue.
- **Room view:** furnish a room from the catalogue with snapping to walls and floor; each asset brings its collider,
  seats and actions; give the room its purpose and who uses it (residents' routines, shop merchandising).
- **Play-test inside Studio** at any time (walk it as the player, see residents walk their routes), with the World
  rules checked live: walkways at least 1.4 m, nothing floating or clipping, no spawn inside anything, phone budget,
  every item has a purpose.
- **Update World:** a single button that shows what changed (a before/after map and a list), runs World's tests and
  build, and only then publishes. Nothing goes live without the creator choosing it.
- **Data, not code:** the island, buildings and rooms are saved as layout files (JSON) that World loads, so World becomes
  the player for what Studio makes. Existing hand-coded places are converted to layout files gradually; each
  conversion must look and play the same (photographs before and after).
- **Order:** section 5's asset format and modeller first; then the room view (smallest, proves the idea, e.g. the
  onsen's lobby); then the building view; then the island view; then converting existing places.

## 7. Retro study: Talent Studio and the Game Boy Camera (the creator, 2026-10-11)

What Ghidra showed in Mario Artist Talent Studio (64DD) and the Game Boy Camera cartridges, what was built from it
(Studio's Shuffle a moment, World's Pocket camera film), the ranked proposals (a carried pocket camera in first
person, a photo-sticker booth, a movie mode on Talent Studio's track model, more wardrobe slots) and a set reference
for remodelling World: `briefs/retro-study.md`.

## 8. All customisation is in Johansson Studio (the creator, 2026-10-11)

> "The build and decorate still shows first when loading Johansson world. Why is that I want all customisation be in
> Johansson Studio"

Done 2026-10-11. World has no BUILD on the title screen (it was in the page's HTML and only removed by a script after
loading, and only on the live site, which is why it showed first), no "Decorate your home", no "Arrange furniture", no
"Make your islander" or "Resident wardrobes" in the Town book, no maker in the wardrobe mirror and no "Thuan's
wardrobe" menus. The old maker address (`creator/`) forwards to Studio. Studio sends, World shows
(`src/studio-handoff.js`):
- **Edit character → Johansson World:** your islander's look (per saved game), any resident's look, Thuận's outfit;
  "Load their look from World" fetches the look World has now, to refine it.
- **Decorate home** (`avatar-creator/home.js`): World's own room, colours, keepsakes (only those earned in World) and
  furniture tool; nothing reaches World until "Use in Johansson World". World applies a change at once if it is open.

Open:
- The ?build town builder still runs inside World's page for the Town Studio desktop app (no button, off online). It
  moves into Studio with section 6.
- The browser QA scripts written for the old in-World maker (`tests/braids-skirt.browser.mjs`,
  `tests/thuan-original.browser.mjs`, `tests/harbour-visitor.browser.mjs`) still open `creator/`, which now forwards
  to Studio; port them to Studio's own browser test (`avatar-creator/tests/studio.browser.mjs`).
- On an iPhone or iPad, World installed on the Home Screen keeps its own storage, apart from Safari's, so a change made
  in Studio in Safari only reaches World played in Safari (Studio says so). A hand-off that crosses that (a link
  carrying the change) is not built.
- Done 2026-10-12 (the creator: "yes"): the Photo studio's per-photo wardrobe is gone (everyone wears their own clothes,
  as Studio dressed them), and a shared `?avatar=` link opens in Studio instead of changing the islander in World.
- In first person, the hands keep the old skin and sleeve colours until World is reloaded (fists.js cannot recolour).
- Placing furniture needs a mouse or touch; there is no keyboard way yet (World's build-mode.js).
- The festivals' things are not built: Haarii boats, Tanabata bamboo, eisa drums, the tug-of-war rope. The news names
  the residents who turn out (happenings.js `news`); when these are built, the news can name them too.
- Birthdays (the creator, 2026-10-12): Johansson 30 January, Thuan 15 March, the residents' made up on the creator's
  instruction (`johansson-town/src/people/birthdays.js`). Setting them in Studio is not built; the profiles show them.
- `jojo/town-studio/evidence/home-decorating.mjs` drove World's old "Arrange furniture"; it is evidence of that check,
  not a tool to run again.

## 9. The Minato Maru: first tighten the ship to the CAD, then Johansson Automation (the creator, 2026-10-13)

The creator, 2026-10-13: *"We need a automation system similar to Kongsberg with alarms and so but before that we need to
tighten the ship wait for the cad."* So, in this order, and nothing of the second before the first:

### 9.1 Tighten the ship: wait for the CAD, then audit against it

The creator is auditing the vessel and will hand over CAD. Until it comes, **no batch changes the ship** (her data, her
model, her machinery spaces); the status report `docs/minato-maru/STATUS.md` (`node tools/ferry-status.mjs`) is the
record of where she stands. When the CAD comes:
1. Compare it with the sheets (1–2 lines and GA, 5 and 7 machinery spaces, 8.x piping, 3.x electrical) and the status
   report; write every difference as a numbered finding in `docs/minato-maru/README.md` before any data changes.
2. Settle finding 1 by the CAD (fair the hull, or correct the particulars), then the weight estimate (D2), the hull
   (D3), structure (D4, D5, D12), shafting (D11), stability (D8), ventilation (D13), in the programme's order, each
   batch regenerating the book and walked in the game.
3. Tidy the programme: D6 and D7 are listed open although the machinery arrangement, the piping diagrams and the safety
   plan are drawn (D9, D10, sheet 6).

### 9.2 Johansson Automation: an integrated automation system of the K-Chief kind, Johansson-branded (after 9.1)

**It is a Johansson product** (the creator, 2026-10-13: "Automation system should also be Johansson Brand"; CLAUDE.md:
Johansson is this universe's Acme): a Johansson Marine automation line in the catalogue (`johansson-marine.js`) with
its own model (a "JA-" number, the works and the year on the maker's plate), the Johansson wordmark and livery on the
operator station, the repeater, the extension panels and every screen, and its own manual pages in the design book.
No other maker's name appears anywhere, Kongsberg's included: it is what such a system is, in Johansson's livery. It
reads the one plant (`ferry-plant.js`) the console already reads, so an alarm on the screen is the alarm on the
matrix and the state in the game. Built in small batches, each checked in the game:
- **Operator station** in the control booth (a screen and keyboard on the console) and a **repeater on the bridge**;
  an **extension alarm panel** in the chief's cabin and the mess for unmanned periods (UMS): the alarm goes to the
  duty engineer's cabin, and to all if not acknowledged in time; a dead-man (watch-call) timer in the engine room.
- **Alarm and monitoring**: every point of the plant with a tag (KKS, `ferry-kks.js`), limits and a priority; an alarm
  list with time, tag, text, value, state (unacknowledged / acknowledged / normal), acknowledge and reset, group
  alarms, inhibits for a machine stopped for overhaul, an alarm history and a log. PLANT_ALARMS become points.
- **Mimic diagrams**, one a system, drawn from `FERRY_PIPING` and `FERRY_FEEDERS` (the same data as sheets 8.x and
  3.x), live: pumps running, valves open, pressures and temperatures at the sensors, the board's one-line with
  breakers and kW.
- **Control**: start, stop, change-over and the generators' breakers from the mimics (the same `createPlant` calls
  as the stations), with the local/remote selector at each machine deciding who has it.
- **Power management**: standby start of the second generator on load or on a trip, load sharing, blackout recovery
  (the sequence FERRY_SCENARIOS "blackout" describes), preference tripping (`preferenceShed`), shore connection.
- **Trends** of any point over the day; **the log** the chief writes becomes the system's.
- Data first: `src/world/ferry-automation.js` (points, limits, priorities, groups, the UMS rules), tested without
  three.js; then the screens; then the panels and the sound of the alarm.

## 10. Worn assets: Johansson's trucker cap (the creator, 2026-10-14)

> "I want his cap to look nice, now it looks like cheap 3d tricks, he should be wearing a 3d asset, you should be able to
> buy a nice hat in the Konbini and wear it, use blender and build his cap and add it to the avatar creator"
> Then, the same day: "I want the hat look like a premium product, for now make it a trucker Cap with the J logo on it"

**Built (2026-10-14):** Johansson Headwear's JH-712, a premium 1990s six-panel trucker built in Blender
(`assets/catalog/johansson-trucker/source/`): a tall foam front with Johansson's J raised in embroidery inside the house
seal's rings, outlined in gold; four see-through mesh panels with contrast piping; a pre-curved bill, contrast
undervisor, braided rope, plastic snapback, sweatband and woven label. Checked and published by Johansson Studio into
World's catalogue; worn by any recipe as `outfit.hat: 'trucker'`, its front and bill in `hatColour`, its mesh, undervisor,
rope and J in `accent` (`src/avatars/hat-assets.js` reads the GLB itself, fits it to every head, presses the hair under its
band and out of its opening; build.js binds the solid parts to the head bone in the body and draws the mesh as the hat's
see-through layer); fetched before people are built (`src/catalog/hat-models.js`); in the wardrobe with three colourways;
stocked at Sakura on a cap tree by the east window (`src/commerce/sakura-caps.js`, `src/world/interiors/sakura-cap-stand.js`);
Kōji's Studio look wears it, navy front and white mesh (in Studio's draft until "update World"). The stand shows the same cap at a
shop-display level of detail (`assets/catalog/johansson-trucker-display`, 1,298 triangles, built by the same script with
`--display`), so six caps keep Sakura within its 450,000-triangle budget (tests/owned-display-lod.test.mjs). The Seagulls six-panel
built first is kept for later in `source/seagulls-six-panel/` (its script, its .blend); it is not in the catalogue.

Open:
- **Buying it.** Sakura's till (`commerce/konbini.js`) sells the packed goods of `data/studio/products.json` only; a cap has
  no pack shape and no label cell, so the products format needs a garment line (Studio's product tools, the till line,
  the bag, the stock count on the stand). Not faked: the stand's look-at text describes the caps, it sells nothing.
- **Wearing what you bought.** No purchase changes a look today: the player's look comes from Studio ("Use in Johansson
  World") or the photo studio's maker. A bought cap should go into the player's own wardrobe and onto `outfit.hat`.
- **The mesh's colour is the outfit's accent.** A colourway in the maker sets both; changing the accent elsewhere (a
  jersey's piping, a vest's shirt) changes the cap's mesh too. A hat's own second colour (`hatAccent`) is the clean fix.
- **The mesh has no ink line** (an outline shell would show through it); the solid parts keep theirs.
- **The film.** `remotion/tools/sync-town.sh` copies `hat-assets.js` (build.js imports it) and the film's three reads the
  GLB, but the film must copy `assets/catalog/johansson-trucker/model.glb` into `remotion/public/` and call
  `provideHatModel('johansson-trucker', bytes)` (in a `delayRender`) before building anyone; without it the cap's wearers
  wear the stand-in procedural cap. The film's own `src/town/koji.js` still has his old recipe. The sync also follows
  imports one level only: a file imported by a newly copied file (e.g. `head-cover.js`) is not copied.
- **Studio's modeller.** The cap went through as a `prop` with a hand-built GLB; a `wearable` kind would check what a
  hat needs (the head it is built on, the fit on the town's heads, no hair through it) and show it worn in its hero.
- **More hats.** The procedural cap, bucket hat, straw hat and the rest, and the Seagulls six-panel, could become
  catalogue assets the same way; `ASSET_HATS` takes another entry and its stand-in.
- **Runtime.** World's `runtime/` was not rebuilt with this batch; it ships at the next "update World".
