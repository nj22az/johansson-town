# Fish market rework and sale counter — 30 October 2026

**Published, 30 October 2026:** on the owner’s **“Push”**, [PR #407](https://github.com/nj22az/nj22az.github.io/pull/407)
merged into main as `1c4d6c33d5f0447676cb4edcb22a25480e6e1adc`. Pages and source guard passed; 92/92 checked live files
match. Full check scope and limits are in [the publication handover](HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md).
Earlier unpublished/awaiting-owner statements below describe the earlier review stage.

The owner, 30 October 2026, after the survey of xiaoninemao/japanese-miniature-scenes
([research note](../docs/research/japanese-miniature-scenes.md)): "Work accordingly to your recommendations", then, while
it was being built, "I like the sale counter".

Branch `claude/great-sagan-mvc9bb` (nj22az.github.io), from main `5572f46`. **Not on `main`; not published.**

## What changed

- `src/world/fish-market.js` (new): the east-quay fish market as data and builders.
  - `AUCTION_LOTS`: 16 hollow co-op boxes on ice (the old 3 × 6 grid less the counter's bay), fish drawn as fish
    (`drawFish`: body, back, belly, forked tail, eye), laid head left, belly to the viewer. `LAID` gives each kind's
    length, depth, count a box and the boat that landed it; `LANDED_BY` the boats. No maguro or sēika (they went first).
  - `SHED_KIT`: 30 kg platform scale with a painted dial (replaces the grey box), tap, hose reel, trench drain and a damp
    band, a boot rack with three pairs, the hand bell, three enamel lamps (`lamp` finish, light at dusk), packed
    polystyrene boxes for the izakaya and Sato Ramen. `roofWater`: ribs down both slopes (replacing the level bars that
    stood clear of the roof at the eaves), ridge cap, gutters, downpipes on the two lane-end columns.
  - `FISH_COUNTER` / `fishCounterOpen`: the co-op's sale counter in the landward west bay. Gurukun and irabuchā by the
    kilo at the auction board's prices (¥900, ¥1,200). Kōji keeps it 07:00–09:00 on his weeks ashore (`rotaWeek`; on
    relief weeks he is the ferry's bosun). Wares (fish, price cards) are a separate group shown by `world.hourly`.
  - `QUAY_EDGE`: three tyres on ropes from kerb rings (the old disc tyre at x 41.1 had no rope), a rope coil on the
    paving by the bollard, made fast round it.
  - `FISH_MARKET_PIECES`: who / why / where for every piece.
- `src/world/okinawa/quarters.js` `buildEastQuay`: calls `buildFishMarket`; the old crates, grey box, level bars and disc
  tyre removed; the counter's two Buy prompts (closed text outside hours); the shed's inspect text mentions the slips;
  Kōji's sorting stack moved behind the counter and lifted onto the floor (it was 16 cm sunk and through the corner lot).
- `src/world/okinawa/props.js` `fishCrates`: optional `y` (what they stand on); default unchanged.
- The counter's ice tray is raked 0.2 rad towards the customer (a separate pivot group, its back on a steel bar), so the
  fish show their sides from the walk; the wares group is a child of that pivot.
- `scripts/english-inventory.mjs`: `fish-market.js` listed with the scenery files (the board's 鮮魚直売 heading).
- Runtime rebuilt (`npm run build:runtime`: `runtime/`, `index.html`, `sw.js`); the build also indexed the counter's
  closed notice in `src/office/town-papers.js`, as it does Nakamura's.
- `tests/fish-market.test.mjs` (new); `tests/okinawa-fish.test.mjs` reads the lot filter from `fish-market.js`.
- `tools/fish-market-photos.mjs` (new, earlier the same day) and `docs/qa/fish-market/{before,after}/`.

## Checks

Run in this cloud session (Node 22, swiftshader; no GPU browser, no physical device):

- `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs` (CI's heap): **90 files, 464/464 passed, 184 s**,
  after the final change. (A first run without CI's heap ran out of memory in `no-z-fighting` and, during `npm ci`,
  could not find `rollup`; both passed when rerun as CI runs them.)
- Outside the guard, 18 files with CI's heap (`fish-market`, `runtime-package`, `okinawa-quarters`, `okinawa-fish`,
  `quay-dressing`, `scenery-placement`, `openings-clear`, `openings`, `ground-clearance`, `neighbours`, `happenings`,
  `roadside-props`, `ship-posts`, `sato-ramen`, `diary`, `vending-placement`, `enterable-sites`, `english-language`):
  74/75; the one failure was the first rope-coil spot off the island's land outline, moved inland and rerun
  (`scenery-placement` + `fish-market` 13/13).
- Photos: `node tools/fish-market-photos.mjs after` → `docs/qa/fish-market/after/` (nine views; 06 at 07:40 with the
  counter open). Lens 03 moved: the counter stands where it stood. Looked at each; the first counter photo showed the
  fish edge-on, which is why the tray is raked.

## Limits and next

- The slips and packed boxes carry no lettering (too small); the counter's board is fixed, not written daily; the damp
  band is always there rather than following the 07:00 wash. The counter was placed from the layout data and tests, with
  no CAD drawing.
- Kōji's prompt and the storyteller do not yet know the counter; `FISH_COUNTER`, `AUCTION_LOTS` and `LANDED_BY` are
  exported for them.
- Cost: about +38,000 vertices (town about 2.9 million); the test caps the market at 56,000.
- Next: the owner reviews the after photos; publish to `main` only on the owner's word.

## Next task, not started: a kissaten in the shut Higa Liquor (the owner's decision, 30 October 2026)

The owner: "Since the liquor store is closed maybe it can be replaced by one of the buildings maybe the cafe" (the
Afternoon Kissaten of the survey). Asked who keeps it, the owner chose **Grandmother Higa, mornings**: a morning-set
kissaten (coffee, thick toast, boiled egg) about 07:00–09:30 in her own shop-house (plot `higa-saketen`, EAST_ROW), before
she keeps Umi-no-yu's bandai (10:00–17:00); she also keeps Johansson Mart's till on weekday evenings and Saturdays.

Plan (nothing built): shutter up in her hours, a green awning and a 喫茶 sign for the old fascia, a pavement A-board, a
counter with siphons on spirit lamps, cups, a back bar and a record player, counter seats; menu morning set, coffee and
iced coffee; no alcohol (it stays Sakura's, the 22 October ruling); keep the family kusu behind the counter and the
yuntaku bench. Supplies from Sakura Trading (merchandising.js). Must change with it: `commerce/higa-liquor.js` and
`okinawa/higa-liquor-dressing.js`, Grandmother Higa's day (cast.js, canonical-day.js), `tests/higa-liquor-laundry.test.mjs`
(in the CI guard), cast.js PLACES 'higa-liquor', and the root CLAUDE.md and AGENTS.md text that the shop "stands shut".
A full map of every place that says the shop is shut was started and stopped unfinished; redo it first.

Meshy: the owner is adding `MESHY_API_KEY` to the cloud environment's variables (30 October); a new session reads it.

## Update, 30 October 2026 (later session): Meshy checked, the map redone, the kissaten planned

Same branch, `claude/great-sagan-mvc9bb`; nothing in the game changed, nothing published. The task folder is
[`briefs/higa-kissaten/`](higa-kissaten/progress.md) (`progress.md`, `checks.md`, `sources/task.md`).

- **Meshy works.** `MESHY_API_KEY` is set (never printed); Meshy CLI 0.4.0 runs through
  `npm exec --yes --package=meshy-cli@0.4.0 -- meshy`; one free `balance` call: 2,753 credits. Costs, from Meshy's
  planner and price list: a textured model 30 credits (text or image), a remesh 5, rigging 5. Nothing generated.
- **The map** of every place that says Higa Liquor is shut, in four parts: code and data to change, tests that state it,
  rules and documents, and what stays (every line about the *drink* moving to Sakura stays true).
- **The plan**: Grandmother Higa, 07:00–09:30, Monday to Friday (Saturday she opens Johansson Mart at 08:45); her garden
  round split round it; regulars from their own days (Officer Mori next door before he sleeps, Tetsuo, Ms Ganaha, Ms
  Uezu on her weeks off); a ¥300 morning set, blend and iced coffee; Sakura Trading supplies bread, milk, coffee beans
  and eggs, the ice plant the ice. All of it drawn in code for World; Meshy only for a Pixar Grandmother Higa and the
  Pixar kissaten's props in Blender (about 175 credits in all).
- **Next:** the owner answers five decisions in the plan (the name, the days, her garden round, Yui at the counter, the
  records) and says whether to build. The fish-market review and its publishing still wait on the owner too.

## Update, 30 October 2026 (evening): the Meshy audit for the kissaten

The owner: "Use my credits on meshy audit where it would make the scene better". Same branch; nothing in the game
changed; nothing published.

- **Spent 105 credits** (2,753 → 2,648): nine props shaped with Meshy's smart topology (5 each), six coloured (10 each).
  The siphon, the morning set and a table fortune machine failed at the shape stage and were not coloured.
- **Photographed in the real shut shop**, Meshy beside code, in World's own light and ink:
  `tools/kissaten-meshy-look.mjs` → `johansson-town/docs/qa/kissaten-meshy/` (`pair-*.jpg`).
- **Verdict:**
  - Meshy for the bentwood chairs, the record player and the hand grinder (curved, open, detailed things seen from the
    street or the counter);
  - a tie on the kettle;
  - code for the stools, cups, siphons and the morning plate.
  - This replaces the first answer ("all code"), which was a guess before the test.
- **Files:** the six models at 1024 px in `johansson-town/art/kissaten/meshy/` (190–280 KB each), with
  `provenance.json` (prompts, task ids, triangles, credits, verdicts); `tools/shrink-glb-textures.py`.
- **Not proposed:** a Meshy body for Grandmother Higa (the owner's plan of 24 October reuses the Pixar bodies with new
  heads).
- **Next:** unchanged. The owner's five decisions and the word to build; the Meshy winners go in with the build (512 px,
  colliders, a look under the ink at phone size).


## Update, 30 October 2026 (night): Kissa Higa built

The kissaten is built on this branch (commit `89d99d7`) and has its own handover:
[HANDOFF-KISSA-HIGA-2026-10-30.md](HANDOFF-KISSA-HIGA-2026-10-30.md). The fish market's own state is unchanged: it waits
for the owner's review, and is published only on the owner's word.
