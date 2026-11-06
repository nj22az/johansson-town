# Expansion notes

What is built but not (yet) fully in play, what was retired in the September 2026
cleanup, and how to get any of it back. Everything removed is still in git history at
commit **`5c63eb8`** (the last commit before the cleanup), so nothing below is lost:

```sh
git show 5c63eb8:johansson-town/src/world/sea-cave.js > src/world/sea-cave.js
git checkout 5c63eb8 -- johansson-town/assets/models/sea-cave
```

## Dormant systems worth building on

| System | Where | State | Could become |
|---|---|---|---|
| Shopify storefront | `src/commerce/shopify.js`, `shopify-config.js`, the mail-order catalogue at Sakura's counter | Wired in, `enabled:false`, no store token | A real merch / print-on-demand shop for the Form 3D models: add a public Storefront token and product map (`docs/shopify-storefront-validation.txt`). |
| The town's local AI | `src/people/thuan-mind.js` (one shared model, `sharedMind`), `thuan-chat.js`, `thuan-voice.js` ("Ask her something"), `town-mind.js` (neighbours' small talk) | Live, opt-in; downloads a ~670 MB model in the browser via WebLLM. Once chosen it starts by itself on later visits, and the neighbours' chats are then written by it, ahead of time, from each speaker's personality; written lines (`chat-lines.js`) otherwise | Talking to any resident yourself; a smaller model or a server option. |
| WebMCP tools | `webmcp.js`, `webmcp-characters.js`, `WEBMCP.md` | Live, loaded lazily | Agent-driven playtesting, guided tours, AI co-players. |
| Avatar creator | `src/avatars/creator.js`, `creator/`, `tools/avatar-preview.html` | Live (Town book → Make your islander, share links) | Shareable islander codes, NPC authoring, a cast editor. |
| Office workbooks | `src/office/workbooks.js`, `assets/office-workbooks/`, `scripts/build-office-workbooks.mjs` | Live in the harbour office | Spreadsheet puzzles and records tied to quests. |
| Thuan's Storage | `/thuans-storage/` (sibling game) + `storage-restock` anchor + `shop-stock.js` | Live hand-off | A deeper restock-and-sell economy loop between the two games. |
| Third-person camera | `setThirdPerson` / `VIEW_KEY` in `src/game.js` | Live (the eye button) | A photo or spectator mode. |
| Okinawan quarter kit | `src/world/okinawa/*` (Sakura Crossing–derived) | Live | A procedural generator for new streets and districts. |
| Thuan's flat above Sakura | `src/world/thuan-flat.js` | Exterior dressing only; her schedule still sends her to the canal-side house she shares with Nao | Move her home upstairs: households, `residents.js` home fields, commute and evening routines, and an interior. |

## Residents

On the street: Thuan, Nao, and the Front-Row staff — Aya and Reiko (books, evening press), Kenji and
Tetsuo (workshop, radio repair) — who live in two yard houses behind the bookshop
(`src/world/yard-homes*.js`) and sleep there instead of taking the bus.

The harbour master and Officer Mori live where they work (`livesAtWork` in
`commuter-schedule.js`, `workplaceResidentPlan` in `social.js`). The harbour master sleeps behind a
folding screen in the harbour office (`buildBedNook` in `interiors/office-workplace.js`). Mori has the
police box, a chūzaisho on the lawn corner at the bus plaza (`src/world/koban*.js`,
`interiors/koban.js`): front desk from 16:00, night patrol 22:00–06:00, asleep in the tatami room
behind it through the morning. A site with `ownRoom` keeps its own interior as a home, and
`homeLayouts` gives home-residents.js the bed and table inside it.

Still held back, in `STREET_CAST_NAMES`: Mrs Sato and the Bus driver; they would each need a home and
a peninsula routine the same way. Thuan and Nao still commute; their flat above Sakura is dressed
from outside only. Everyone on the street is a recipe in `src/avatars/cast.js`.

Hats are a separate piece of the avatar (`avatar.hat`, `setHat`, the `hatOff` flag). At home the hat
goes on the room's `hatHook` (a peg, or the top of a hat stand) as a `buildHatProp` copy, and back
on the head at the door. A home layout without a hook leaves the hat on.

## Retired in the cleanup (recover from `5c63eb8`)

| What | Files | Why |
|---|---|---|
| Sea cave | `src/world/sea-cave.js`, `assets/models/sea-cave/` (12.5 MB), `tools/pack-sea-cave.mjs`, its test | Retired district; nothing in the game loaded it. A good future dungeon. |
| Full overworld | `src/world/full-town.js`, `promenade.js`, `street-clearance.js`, `assets/models/full-town/overworld.glb` (7.4 MB), `tools/prepare-street-clearance.mjs`, their tests | Replaced by the peninsula town. `navigation.json` and `street-clearance.json` stay (tests read them). |
| Harbour block | `src/world/harbour-block.js`, `assets/models/harbour-block/` (7.4 MB), `tools/compact-harbour-block.mjs`, `prepare-harbour-block.py`, `measure-art-scene.mjs`, its test | Retired street. |
| Merchant roofs | `src/world/merchant-roofs.js` | Only a test used it. |
| Orphan modules | `preflight.js`, `src/people/aya-animation.js`, `procedural.js`, `vroid.js`, `src/world/interiors/yuri-figurine.js` | Imported by nothing. |
| Unused assets | the old supplied Minato izakaya exterior (4.7 MB), Kenney mini-characters, three old konbini label images | No code loaded them. |
| Classic character cast | `assets/characters/` (~50 MB: MakeHuman Thuan and Johansson, Nao's VRoid, the Meshy Thuan and figurine, the low-poly residents), `art/characters/` (source art), the GLB branch of `src/people/models.js`, `johansson.js`, the `yuri-*`, `nao-vrm-animation`, `thuan-face-controller`, `thuan-fingers`, `resident-animation`, `resident-wardrobe`, `office-hands`, `meal-motion`, `thuan-seat-drape`, `gait`, `surface` modules, their Blender tools and tests | Everyone is a Shimanchu now; the `?classic` flag is gone. Recover from the commit before the removal (see `git log -- johansson-town/assets/characters`). |
| Old convenience store, Japanese street kit, old canal-house exterior | `convenience.js`, `store-service.js`, `shop-business.js`, `japanese-town.js`, `yuri-home.js` and their GLBs | Replaced by Sakura's real interior and the peninsula town. |
| Stale docs | `AUDIT.md`, `OFFICE-V4.md`, four identical `docs/YURI*.md` stubs, `COMPACT-TOWN.md`, `GRID-TOWN.md` | Superseded or describing systems that no longer exist. |
| Old runtime builds | ~615 hashed chunks in `runtime/` (~285 MB) | Each rebuild left its old chunks behind; the build script now prunes to the current and previous build. |

Generation reference images moved from `assets/generation/pilot/references/` to
`art/generation-references/`: they are inputs for making art, not game files.

## Done in the second cleanup pass

- CSS: 14 stylesheets merged into 5 in link order (`base.css`, `context-controls.css`,
  `landing.css`, `dual-controls.css`, `tomodachi-ui.css`), with ~90 rules for classes
  that no longer exist removed. Each section is labelled with its original file name.
- Old convenience store and street-kit leftovers retired; dead doc links fixed; the
  one-off `rebuild-town-runtime` workflow deleted.

## Openings and free time

The game starts at one of a few curated openings (`src/world/openings.js`): the Sakura bench, a beer
at Minato while it is open, the end of the pier, the park bench, the seawall, or the bus stop. The pick
fits the hour and the weather, and is never the same as last time. `?spawn=<id>` forces one; the
`?audit` harness keeps the Sakura bench unless it names one. Residents on a park visit, a stroll or
an evening out are drawn to benches (`SEAT_PULL` in `town-activities.js`).

## Minato and Sato Ramen

One building, one kitchen. The interior model (`tools/blender/build-minato-interior.py`, run with
Blender 4.2 or `pip install bpy==4.2.0`) now has a working line behind Nao's counter: a tall
fridge, a four-burner range under a canopy, the fryer, a double sink and a prep bench. It carries
on through an opening into Sato Ramen, a single-storey corner shop on Minato's alley flank
(`SATO_ANNEX` in `minato-facade.js`). The shop is open 11:00–14:00 while Minato is shut, and
Mrs Sato cooks there (`sato-ramen-layout.js`, `interiors/sato-ramen.js`); the old street's
Inakaya code paths are reused with Sato's seats, menu and hours.

At Minato you can sit on any free counter stool or table seat and order anything on the wall.
Nao cooks each dish at its station and brings it over (`DISHES`, `KITCHEN_STATIONS` in
`izakaya-beer.js`). Food and drink have their own places on the table; you eat and drink them a
mouthful at a time. You can also buy a guest a drink, which the game remembers (`state.treats`).

Everyone indoors is a Shimanchu too: Higa-san at the Umi-no-yu bandai (`Mrs Higa` in `cast.js`) and the
whole 5・6年 class with Yonamine-sensei (`src/people/school-avatars.js`, one avatar per person, recipes
made from the class list). The old placeholder figures (`school-kids.js`) are gone.

## Park and the east beach

- The supplied park model was reworked in Blender (`tools/blender/rework-park.py`, run
  with the `bpy` package): its merged bush clump, whose leaf rendered as a ring of grey
  boulders round the hill, is gone from the GLB. The original is in git history.
- The east lawn wears the park's painted turf from the first frame, so the hill and the
  lawn are one green even before the model streams in.
- The gateball court is cut level into the hill's foot (`inGateball` in `park-layout.js`)
  behind a low retaining wall with colliders, instead of the slope running under the sand.
- `src/world/beach-life.js`: red crabs on the dry sand (one instanced draw) that scuttle
  sideways, run seaward when you come within 3.4 m and dig in under 1.25 m; a pool of
  three fish leaping 10–55 m offshore with splash rings, riding `waveHeight` from
  `ocean.js`. Both groups are `dynamicProp`s placed where they live, because the
  section renderer batches static meshes and culls moving ones by their group's origin.
  Could become: hermit crabs at night, a heron at the tide line, catchable fish from the pier.

## The island: ferry, sea cave, dungeon, airport island

- **Ferry** (`src/world/ferry.js`): the island's commuters come and go on the three daily
  sailings (`HARBOUR_LINE` in `commuter-schedule.js`), lying alongside the outer pier's west
  flank. The run keeps the old bus interface (`door`, `queueSpot`, `doorway`, `boarding`,
  `phase`), so `schedules.js` boards it unchanged; `transit.js` says which stop a layout uses.
  The ticket booth on the quay is the terminal. The retired layouts keep the bus station.
- **Sea cave** (`src/world/coyote-tunnel.js`, name kept): the tunnel is now a low mouth in a
  nine-metre headland at the end of a gravel path. "Go into the old sea cave" opens the dungeon.
- **Bizarro Minato** (`src/dungeon/costumes.js`): the dungeon's inhabitants are the street cast in
  monster suits -- a hood on the head bone (face showing under the animal's jaw) and a suit
  recipe in its colours: Mori crocodile, Mrs Sato donkey, Thuan tanuki, Nao octopus, the harbour
  master seagull, Kenji shark, Aya owl, Reiko fox, Tetsuo bear. They speak in opposite-talk
  (`bizarroLine`). The cave is violet rock and teal floor, with mirror-writing shop signs and
  furniture on the roof. Could become: costumes in the town at a festival, a costume shop.
- **Dungeon** (`src/dungeon/`): seeded floors of rooms and passages (`generate.js`) built into
  the interior room (`dungeon.js`); walls are the tile grid via `layout.blocked`. Crabs and
  wisps, chests with yen and trinkets, stairs down, the rope up. Loot is banked on climbing
  out (`finishDungeon` in `game.js`) and lost on blacking out; `state.dungeonDeepest` records
  the record. Could become: keys and locked doors, a boss every fifth floor, a shop for
  lantern oil and armour, floors themed by depth, trinkets sold at the harbour office.
- **Kitano-jima** (`src/world/airport-island.js`): the airport island on the east horizon,
  marked `userData.horizon` so the section renderer never culls it. `AIRPORT_ISLAND.dock` is
  where a second ferry route would tie up; making it playable means a second town site the
  ferry run can carry the player to.
