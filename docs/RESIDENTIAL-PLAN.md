# Johansson Town: residential quarter, no cave, a smaller anchored cast

2 October 2026. A plan, not yet built. The reference is a Shenmue-style back lane: a narrow lane between
block walls, two-storey houses in stained render with aluminium windows, a utility pole carrying a
transformer and sagging wires, and a gap at the end of the lane.

## Goals

1. **The island is just an island.** The sea cave goes. The dungeon minigame is paused, not deleted.
2. **One dungeon game: Thuan's storage.** It becomes a random dungeon crawler with bosses, kept at
   `/thuans-storage/`. Johansson Town links to it and does not run a second dungeon.
3. **A residential quarter that looks lived in.** It is a little apart from Main Street and the harbour,
   reached by a lane, and it is where everybody actually lives.
4. **Fewer people, each one real.** Thuan and Johansson come first. A small fixed cast is anchored
   (home, work, leisure, a daily route) before anybody new is added.

## 1. Remove the cave, pause the dungeon

| Step | Where | What |
|---|---|---|
| 1.1 | `src/world/coyote-tunnel.js`, `src/world/layout.js` (`cave-path` region) | Remove the cave mouth, its footpath region and the portal geometry. The headland stays as a plain grassy hill with rocks, and its shore is unchanged. |
| 1.2 | `src/game.js` (`DUNGEON_SITE`, the cave-mouth trigger near line 938, `dungeonLayout`) | Put dungeon entry behind a flag `DUNGEON_ENABLED=false`. Keep `src/dungeon/` and its tests. The tests build the dungeon directly, so they keep passing. |
| 1.3 | Save state (`dungeonDeepest`, banked loot) | Leave the fields alone, so turning the flag back on restores old saves. |
| 1.4 | Town book, map labels, WebMCP (`webmcp.js`), guide, README | Remove "The Old Sea Cave" from places, captions and the map. |
| 1.5 | Town book | Add a "Thuan's Storage" tile that opens `/thuans-storage/`, the one dungeon game. |
| 1.6 | `thuans-storage/` (separate plan) | Random floors, a boss every N floors, loot and a return to the shop. This is its own milestone. |

## 2. The residential quarter

**Where.** Kitahama, the north-east land behind the town hall. It already has a lane, five walled plots and
the cane field. It grows into the quarter, separated from Main Street by the town hall grounds and the beach.
Its only links to the rest of town are the approach lane from the beach and a footpath past the town hall.
That makes it "a bit separated" without a loading screen.

**Layout** (a sketch: lanes 3–4 m wide, plots on the 0.91 m grid):
- One spine lane and two dead-end back lanes, in the reference picture's proportions: block walls about
  1.4 m high on both sides, poles every 25–30 m, one transformer pole, and wires crossing the lane.
- 10–12 homes:
  - the existing five;
  - two-storey concrete houses with tiled or flat roofs (`concreteHouse` gets a gabled-tile variant);
  - one small apartment block (2×2 flats, outside stair) for the single residents, Thuan's flat among them
    if she moves here;
  - two old red-tile houses kept for the grandparents.
- **Signs of life, per plot,** from a recipe:
  - washing on the line, bicycles, potted plants, an air-conditioner unit, a gas bottle, a kei truck,
    shoes at the genkan;
  - post in the box, a nameplate, a dog house;
  - mould streaks under parapets and rust under fittings (the audit's weathering rule).
  - Windows already show rooms (`render/window-interior.js`). A home's lights follow its residents: lit
    when somebody is home and awake.
- **Shared places:**
  - a corner shop or vending bank;
  - a small park with a bench and a swing;
  - a rubbish point with nets over the bags, and a notice board;
  - the bus/ferry noticeboard at the lane mouth.

**Ground.** Build it with the kit on the island ground (`KITAHAMA.y`), with lanes as `kitahama-lane` regions,
so there is no repeat of the floating-lane bug. Extend `tests/ground-clearance` and the ground survey
(raycast every walkable point) to cover the quarter.

## 3. A smaller cast with anchored routines

**Today.**
- 11 active walking residents: Aya, Kenji, Mrs Sato, Harbour master, Reiko, Tetsuo, Officer Mori,
  Bus driver, Nao, Thuan, Barfly (`src/people/residents.js`).
- On top of them: households, neighbours, gateball players, pupils, izakaya guests and staff routines.

**Proposal.** One core cast of 6 to 8, and everyone else off until they are anchored.

| Tier | Who | Anchored by |
|---|---|---|
| Core | **Johansson** (player), **Thuan** (Sakura) | Home, work, evening, weekly day off, friendship, gifts; most dialogue |
| Key | **Nao** (Minato izakaya), **Mrs Sato** (Sato Ramen), **Officer Mori** (police box), **Harbour master** | Home in the quarter, workplace, one leisure place, a walk between them |
| Maybe | Aya, Kenji (yard homes) | Keep one if they get a job and a leisure place, otherwise retire |
| Retire for now | Reiko, Tetsuo, Bus driver (there is no bus on the island), Barfly; gateball crowd and pupils shrink to ambient groups or go | Back one at a time once the core is right |

**Each anchored character gets one record** (extend `profiles.json` and `schedules.js`), checked by a test:
- home (plot and door), bed and wake time;
- work (site, hours, days);
- leisure (one or two places, which days);
- the route between them on the navmesh, which must exist and be walkable;
- a few personal objects at home (window-interior seed, nameplate text, yard recipe).

**Rules.**
- Nobody appears or vanishes in view. They walk out of their gate and back in.
- Lights at home follow the character.
- The town book shows where each one is right now, and why ("at the counter", "walking home").

## 4. Order of work

1. Pause the dungeon and remove the cave (§1.1–1.5): small, and unblocks the rest.
2. Cut the cast to the core and key tiers; give each the anchored record and a test (§3).
3. Build the residential quarter shell: lanes, walls, poles, 10–12 houses (§2). Move the key cast's homes into it.
4. Signs of life and house lights tied to residents.
5. Thuan's Storage as a dungeon crawler with bosses (§1.6), as its own milestone.

## Open questions

- Does Thuan move into the quarter's apartment block, or keep the Kitahama red-tile house she shares with Nao?
- Keep Aya and Kenji (yard homes behind Main Street), or retire them with the yard homes?
- Should the headland keep a viewpoint path to its top once the cave is gone?

## Built (2 October 2026)

Answers to the open questions: Thuan keeps the Kitahama red-tile house she shares with Nao; Aya and Kenji stay
in the yard homes; the headland has no viewpoint. The walking cast on the island is already the nine-person street
cast (`STREET_CAST_NAMES`), so nobody else was retired yet.

- **The cave is gone** and the dungeon is paused (`CAVE_ACTIVE=false`).
- **The quarter** is Kitahama grown west (`kitahama-layout.js`, `okinawa/kitahama-quarter.js`):
  - the spine lane continuing the cross lane west, Fukugi Lane north to a dead end, Well Lane south to the rubbish
    point, and a footpath down past the school;
  - seven more walled homes (12 in all, two old red-tile ones for the grandparents), each household in
    `island-households.js` with a nameplate story;
  - Kitahama Heights, four flats with an open corridor, an outside stair, balconies with washing and mailboxes
    (Mr Fujita's flat is number 3, when he is not in his shed on the pier);
  - the pocket park (swing, sandpit, a bench under a gajumaru, three lit vending machines), the rubbish cage
    under its net and the notice board;
  - the pole line along the spine and up Fukugi Lane with a transformer and a drop to every house; a kei truck at
    the dead end, a dog house, bicycles.
- **The anchored cast** (`people/anchored-cast.js`): core, key and kept tiers; home, work, evening, bed time,
  a day off and named leisure places for everybody who walks. `tests/residential-quarter.test.mjs` checks the
  lanes, gates, overlaps, shared places and the cast record.

Next: home lights that follow their residents, the key cast's leisure trips on their days off, and then moving
residents into the quarter one at a time.
