# Progress: a kissaten in the shut Higa Liquor

## Task
See `sources/task.md`. The owner, 30 October 2026: the shut Higa Liquor becomes a kissaten, kept by **Grandmother Higa
in the mornings**. This folder holds the map of every place that said the shop was shut, the plan, the Meshy audit and,
since the owner's "work accordingly to your own recommendations", what was built (commit `89d99d7`; "Built" below), with
the independent review's findings still to fix (see the handover, `../HANDOFF-KISSA-HIGA-2026-10-30.md`). Branch
`claude/great-sagan-mvc9bb` (on top of the fish-market rework, not on `main`).

## Completed (30 October 2026)
- Meshy checked: `MESHY_API_KEY` is set in the environment (its value never printed); Meshy CLI 0.4.0 through
  `npm exec`, production API (`api.meshy.ai`); one free `balance` call answered: **2,753 credits**. Nothing generated.
- The map (below), redone in full from `git grep` over the whole repository and the studio repo `jojo`.
- The Meshy audit (later the same day, on the owner's "Use my credits on meshy audit where it would make the scene
  better"): nine props tried, six coloured, 105 credits; photographed beside code versions in the real shop. See
  "What Meshy can make" below.
- The cast's mornings swept (every resident, 06:30–10:00 every half hour, a Monday, a Saturday and a Sunday, from
  `canonicalDay`), so the kissaten's regulars come from their own days.
- The plan and the Meshy/code split (below).

## The map: every place that says Higa Liquor is shut

The liquor shop stays closed: the drink is Sakura's (the 22 October ruling stands). What changes is the building: it
is no longer shut, it is a kissaten in the mornings. So every line about the *drink* having moved to Sakura stays true;
every line about the *building* being shut, dark, unkept or "for good" has to change.

### A. Code and data that must change (the game)

| File | Lines | What it says now |
| --- | --- | --- |
| `src/commerce/higa-liquor.js` | 1–11, 15–23, 25–28, 39–49 | Header: "shut for good", "Grandmother Higa keeps only the bathhouse". `HIGA_NOTICE`: the 閉店のお知らせ on the shutter. `HIGA_KUSU`: "still behind the counter of the shut shop". `YUNTAKU`: "The shop has shut, the bench has not". |
| `src/world/okinawa/higa-liquor-dressing.js` | 9–19, 45–79, 82–88, 92–162 (lettering), 320–366 (`higaFrontage`) | Header and `HIGA_DRESSING`: doors "shut since the shop closed", shutter "down for good", the closing notice, the 酒 · 泡盛 · ビール valance, the sugidama, the empties, the counter "until the shop shut", the delivery book, the bottle shelves, the cold case, the jars, lights "off since the shop shut". `HIGA_LEFT_OUT`: "a to-let sign or a new tenant … nobody is looking for the shop". The lettering atlas (valance, hours card, beer and awamori posters, 冷えてます, tags, notice). `higaFrontage`: shutter fixed down, doors shut, tubes at 0. |
| `src/world/okinawa/houses.js` | 168, 232, 480 | The `liquor` interior kind; the upper floor a stock room. |
| `src/world/okinawa/quarters.js` | 103–111, 308–311, 335, 342–348, 388–393, 606 | The shut front and its clock hook; the shop sign (`jp:"Higa Liquor Store"`, `en:'Higa liquor · closed'`, upright "Awamori", inspect "Read the notice on the shutter"); `higaPrompts`; the bench's prompt ("a bottle each from Sakura"); the bicycle "against its own (shut) shopfront"; the drop. |
| `src/people/cast.js` | 72–75, 244 | Grandmother Higa's `purpose` ("her liquor shop on Main Street stands shut") and `day`; `PLACES['higa-liquor']` `closed:'Shut for good …'` and no keepers. |
| `src/people/canonical-day.js` | 62–67 | Johansson Mart before the shut shop's bench; no kissaten. |
| `src/people/stand-sequences.js` | 65–72 | Her garden round, "from six to half past eight": it runs through the kissaten's opening. |
| `src/people/neighbours.js` | 44–48 | On her verandah 07:00–18:30, and her lines. |
| `src/people/canonical-rest.js` | 6 | Her rest 21:00–06:30 (stays; the plan fits inside it). |
| `src/people/roster.js` | 72 | Role: "her liquor shop is shut". |
| `src/people/workplaces.js` | 11–12 | Her workplace is Johansson Mart only. |
| `src/people/home-directory.js` | 30 | `'higa-liquor':'higa-saketen'`. |
| `src/people/shop-days.js` | 7–8, 44–46 | The bench "outside the shut Higa Liquor". |
| `src/feed/places.js` | 85–94 | The storyteller's place: "the shut Higa Liquor and its bench", things "the shutter, down for good", "the closing notice", doings "reading the notice on the shutter". Its shot is at 18:30. |
| `src/world/okinawa/kitahama-shop.js` | 33 | Why she keeps Johansson Mart: "whose liquor shop on Main Street stands shut … wanted a counter again". |
| `src/world/okinawa/lots.js` | 21–23 | The crate yard's owner: "her shop across Main Street is shut". (The yard, its HIGA LIQUOR EMPTIES sign and Sakura Trading's lease stay.) |
| `src/commerce/merchandising.js` | 60, `ACCOUNTS` | "Higa Liquor stands shut"; no account for a kissaten (bread, milk, coffee beans, eggs). |
| `tools/apply-articles.mjs`, `guide/articles.mjs`, `guide/residents.json`, `resident-guide.js` (built) | 34–35; 125–127; 625–643 | Her guide article: "Her liquor shop on Main Street is shut, a notice on the shutter", "stands shut since the drink went to Sakura". |
| `src/office/town-papers.js` (built) | — | The build indexes shop notices into the town papers; it re-indexes from the source. |
| `docs/ENGLISH-LOCALISATION.json`, `scripts/english-inventory.mjs` | 919; 30–33 | 比嘉酒店 → "Higa Liquor Store"; the new 喫茶 lettering needs its English. |
| `runtime/`, `index.html`, `sw.js` | — | Rebuilt by `npm run build:runtime`, last. |

### B. Tests that state the shut shop

| Test | Lines | What it asserts |
| --- | --- | --- |
| `tests/higa-liquor-laundry.test.mjs` (in the CI guard) | 27–29, 41–47, 51–60, 218–229 | No hours exported (it lists the old names `higaLiquorOpen`, `higaShutterDown`, `HIGA_LIQUOR_HOURS` … as gone); the closing notice; nobody is ever at `higa-liquor`; `PLACES['higa-liquor']` closed with no keepers; "the shut front at every hour": shutter down, doors shut, lights off, notice on the shutter. |
| `tests/no-z-fighting.test.mjs` | 59–64 | `higa.update` undefined and the shutter visible. |
| `tests/east-lawn.test.mjs` | 196–205 | The shut shop's floor is out of reach behind its shutter (must become reachable in hours). |
| `tests/okinawa-quarters.test.mjs` | 117–124 | Grandmother Higa on her verandah at nine. |
| `tests/higa-shop-collision.test.mjs` | all | The `liquor-*` solids, the customer to the counter, the keeper round its open end: these survive, renamed if the solids are. |
| `tests/minato-walking-routes.test.mjs` | 54 | `'Higa Liquor'` as a walking destination at [4.8, 8.75]. |
| `tests/seat-layouts.test.mjs` | 65–73 | The bench's two places (stays). |
| `tests/yard-homes.test.mjs` | 62 | Plot ids `nakamura`, `higa-saketen` (stays if the plot keeps its id). |

### C. Rules and documents

- Root `CLAUDE.md` 147–150: "Higa Liquor has closed … the shop stands shut with a notice on its shutter, and Grandmother
  Higa keeps only the bathhouse".
- `johansson-town/AGENTS.md` 254–270, "Owner's decision — 22 October 2026": "Higa Liquor is shut for good … the shutter
  down at every hour, the doors shut, the lights off … no new geometry". A 30 October ruling is added after it,
  superseding the shut-front parts and keeping the drink parts.
- Stale since 22 October, fix while there: `avatar-creator/docs/STUDIO-MCP.md` 136 ("All alcohol comes from Higa
  Liquor"), `docs/MASTER-PLAN.md` 64 and 105 (Higa Liquor supplies the Coral Bay Bar and the co-op),
  `docs/INTERIOR-INVENTORY.md` 75.

### D. Stays as it is

- Every line that says the *drink* moved to Sakura: `activities.js` 1075, `commerce/konbini.js` 248 and 257,
  `merchandising.js` 52–53 and 130, `paperwork.js`, `trade-round.js`, `economy/goods.js`, `economy/town-economy.js`,
  `studio/rules.js` 526, `harbour-boats.js`, `quay-dressing.js`, `port-shed.js`, `storefront.js`, `izakaya-walnut.js`,
  `minato-compact-plan.js`, `johansson-house-interior.js`, `sakura-office-room.js`, `sakura-small-office.js`,
  `sakura-trade-posters.js`, `roster.js` 67, `docs/cast-roster.json`. The liquor shop stays closed.
- Neighbour and layout comments that only use the name as an address: `coin-laundry.js`, `coin-laundry-dressing.js`,
  `police-station.js`, `police-station-layout.js`, `architecture-plan.js`, `ground-plan-quarters.js`, `signs.js`,
  `layout.js`.
- History: every `briefs/HANDOFF-*`, `briefs/higa-liquor-closes/`, `docs/qa/**` logs, `steam-deck/releases/*`,
  `linux-port/acceptance-0.2.18.md`, `world/index.html`'s release notes, `docs/CAST-CONSOLIDATION*.md`,
  `MINATO-CONSOLIDATION.md`; studio repo `jojo` `research/mario-artist/report.md` 140 (a research note).

## The plan (written before the build; what was built is under "Built" below)

### Who, when, and why it works
- **Grandmother Higa** opens at **07:00** and shuts at **09:30**, washes up and walks up Kitano Road to Umi-no-yu for the
  bandai at ten. The shop stands at the foot of Kitano Road, under the bath, so the walk is a minute.
- **Days: Monday to Friday** (recommended). On Saturdays she opens Johansson Mart at 08:45 (`kitahama-shop.js`
  `SHOP_DUTY`), and Sunday is her one morning with nothing to open.
- **Her garden round** (now 06:00–08:30) moves: a short round before opening (06:30–06:50, the water jar and the altar
  flowers) and the rest at her lunch hour, which she already spends at home (the handama "for lunch" fits there).
- Her weekday then runs 07:00 kissaten, 10:00 bandai, 12:00 lunch and garden, 13:00 bandai, 17:00 Johansson Mart until
  21:00. That is a long day at 78; the owner may prefer fewer days.

### The regulars, from their own days (the morning sweep)
Almost everyone is at work by seven: the ferry crew, Kōji at the auction and the ice plant, Thuan crossing to Sakura,
Mrs Sato at the stock pot, Mrs Nakamura's beans, the clinic, the school. The ones whose mornings are free and near:
- **Officer Mori**: the police station is next door; he is at the station until nine, then asleep after the night
  patrol. A morning set at half past eight before bed.
- **Tetsuo**: breakfast at home 07:30–09:00, the radio bench from nine. He keeps her boiler; she pushes Yui at him.
  Some mornings he takes his breakfast at her counter instead.
- **Ms Ganaha**: at home until eight, then the coin laundry across Main Street, the mailbag at half past nine. A coffee
  before she opens up.
- **Ms Uezu**, on her weeks off watch (at home all morning).
- The player, at any hour it is open.
- A choice for the owner: **Miss Higa (Yui)** could take her breakfast at her grandmother's counter before school
  (07:30); it puts her and Tetsuo at the same counter.

### The menu
- **Morning set (モーニング), ¥300**: a blend coffee with a thick slice of toast (Sakura's milk bread, buttered) and a
  boiled egg, the coffee's price, as morning service is in a Japanese kissaten. Every hour it is open is morning.
- **Blend (ブレンド), ¥300**: brewed a cup at a time in a siphon (Sato Ramen's urn coffee with lunch is ¥200).
- **Iced coffee (アイスコーヒー), ¥300**: brewed strong, poured over ice from the ice plant, with gum syrup and milk.
- No alcohol: it stays Sakura's.

### Supplies (Sakura Trading)
A new account in `merchandising.js`: milk bread and milk (existing lines), plus two new lines, coffee beans (roasted in
Naha, on the ferry) and eggs, which Sakura also sells over its counter. Ice comes from Kōji's ice plant. The town's
money model stays closed (22 October); the kissaten's takings are not added to it unless the owner asks.

### The building (World)
- **Shutter up 06:50–09:40** on the kissaten's days, down at all other hours, following the clock as Nakamura's does
  (`nakamura-dressing.js` 388–400). The doors slide open; the tubes light (no point light: phone budget).
- **A new paper on the shutter** in her brush hand: 喫茶 朝7時〜9時半, and お酒は さくら商店へ kept, so the old regulars
  still know where the drink is.
- **The awning re-covered in green canvas**, its valance 喫茶 ひが · コーヒー · モーニング; the upright sign "Awamori"
  becomes コーヒー; the sugidama (the sake seller's sign) comes down.
- **An A-board** on the pavement in hours (モーニング ¥300), clear of the footway, the bench and the bicycle.
- **Inside**, in the room as it stands (4.1 × 5.75 m; the counter across the back is 2.47 m long, its top 0.95 m above the 8 cm shop floor):
  - the counter becomes the coffee counter: two siphons on spirit lamps, a kettle on a gas ring, the hand grinder
    (Meshy), the register and her abacus kept;
  - four stools along its front (0.6 m apart);
  - the dear-bottle shelf behind it becomes the cup shelf;
  - the family kusu stays in its corner with its 非売品 card, under the nose of the morning crowd;
  - the record player (Meshy) and her late husband's records (he drove the island bus) on a low cabinet where the
    awamori jars stood, beside the counter where she can reach it;
  - a table for two by the window, where the bottle shelves were, with two bentwood chairs (Meshy);
  - the cold case and the delivery book go.
- Buy prompts for the three items (closed text outside hours), sit prompts on the stools and the table; every new thing
  a solid with its own collider; the room reachable in hours.
- **The yuntaku bench stays** for the evening: Tetsuo and Mac, and Mr Fujita's empty crate.
- The ids stay (`higa-saketen` plot, the frame), so saves and the yard's lease keep working; the place becomes
  `kissa-higa` in `PLACES`, with Grandmother Higa its keeper in hours.

### The storyteller
A new morning place in `feed/places.js`, its shot at 07:40 from `render-feed-backdrops.mjs`: the siphons bubbling, the
toast, the egg in its cup, the record player, the kusu with its card, the A-board; regulars Officer Mori, Tetsuo and Ms
Ganaha. The evening place keeps the bench. Story hooks from what the town already holds:
- A spirit lamp heats the coffee in the shop that used to sell spirits.
- Officer Mori nods off over his toast after the night patrol; the egg rolls.
- Grandmother Higa's matchmaking has a counter now: Tetsuo's stool is always next to the one she keeps for Yui.
- "A cup of that with my coffee?" The kusu is still not for sale, at any price.
- Her late husband's records: he drove the island bus for thirty years (`neighbours.js`); what he played is decision 5.
- The iced coffee's ice comes from Kōji's ice plant, the same ice as the fish.

### Decisions for the owner
1. The name: 喫茶ひが (Kissa Higa, as the regulars called the shop by her name; recommended) or 喫茶ゆんたく (after the
   bench).
2. The days: Monday to Friday (recommended), or every day but Saturday.
3. Her garden round split between before opening and lunch (recommended).
4. Yui at the counter for breakfast before school: yes or no.
5. Her husband's records: min'yō and enka on 45s (proposed), or something else.

## What Meshy can make, and what should be drawn in code

### First answer (before any test), now superseded
Before anything was generated this note said: draw all of it in code for World, and keep Meshy for the Pixar work. The
reasons were heavy, irregular meshes that ink badly, glass baked as paint, and the phone budget. The owner then asked
(30 October): "Use my credits on meshy audit where it would make the scene better". The test below replaces the guess.

### The audit (30 October 2026): the same props twice in the real shop
Meshy's **smart topology** (`meshy-t2.5`) makes clean low-poly models to a face target, so the "heavy mesh" worry
did not hold. A prop costs **5 credits for the shape and 10 for its colour**: 15 in all, and the shape can be judged
before the colour is paid for.

Nine shapes were made and six were coloured: **105 credits** (2,753 → 2,648). Every prompt, task id, triangle count and
verdict is in `art/kissaten/meshy/provenance.json`.

`tools/kissaten-meshy-look.mjs` photographs the shut Higa Liquor in World's own renderer (the real town, the cel and ink
passes, 08:00). For the photographs only, the shutter is lifted and the tubes lit. The same props stand on the real
counter and floor twice, once from Meshy and once drawn in code with the kit's primitives, at real size. The room is
still dressed as the liquor shop. Photographs: `docs/qa/kissaten-meshy/` (`pair-*.jpg`, Meshy left, code right).

| Prop | Triangles | Verdict | Why |
| --- | --- | --- | --- |
| Bentwood chair | 3,100 | **Meshy** | Reads as a bentwood café chair from the street and from inside; the code chair reads as a ladder, or a letter d. |
| Record player | 2,563 | **Meshy** | The open lid, the record and its red label, the knobs; the code one is a flat box. |
| Hand grinder | 2,505 | **Meshy** | The drawer and its knob, the bowl, the crank; the code one is a dark cube with a disc. |
| Gooseneck kettle | 2,076 | Tie | Its spout rises from the base as a real one does; at room distance the code kettle reads as well. A white enamel kettle (the steel came out white). |
| Cup and saucer | 1,548 | Code | Nicer up close (handle, spoon) but mug-tall against its saucer, and there are many of them; at a distance both read the same. |
| Counter stool | 2,017 | Code | The shape is right, but the seat's colour map has painted streaks that read as scratches under the ink; a lathe draws a clean seat. |
| Siphon | — | Code | Meshy made two separate gadgets, and glass comes baked as paint. Rejected at the shape stage (5 credits). |
| Morning set | — | Code | The toast came as two blobs and there was no egg cup. Rejected at the shape stage. |
| Table fortune machine | — | Not drawn | An unreadable blob. Rejected at the shape stage. |

**What the test shows:**
- Meshy makes the scene better where a thing is **curved, open or detailed and big enough to be seen**: the chairs and
  the record player from the street, the grinder at the counter.
- Code stays better for **turned, plain or glass things** (stools, cups, siphons, plates) and for anything lettered.
- A pink telephone was not made: Minato already has the town's pink telephone (`izakaya-play.js`).

**What a Meshy prop needs before it goes into World** (part of the build, not done yet):
- its colour map shrunk to 512 px (the files here are at 1024 px, 190–280 KB each);
- a collider drawn by hand to the measured size;
- a check under the ink at phone size;
- a `who / why / where` record, like every other piece.

**Still for Meshy, later:** the Pixar kissaten in Blender (studio repo `jojo`, `pixar`) can take the same three winners at
standard quality (30 credits each). A Pixar Grandmother Higa is **not** proposed as a Meshy body: the owner's 24 October
plan reuses the Pixar bodies with new heads, and a head would come from the owner's picture.

## Built (30 October 2026, evening): the owner's "work accordingly to your own recommendations"

The owner: "I need you to work automatically can you work accordingly to your own recommendations pls audit yourself
and decide from the audits and proceed". The five decisions, taken as recommended:
1. **Kissa Higa (喫茶ひが)**, the name on the fascia, the awning and the paper.
2. **Monday to Friday**, 07:00–09:30.
3. **Her garden round** after an earlier breakfast (she is up at 05:30), before she opens; the long round at the weekend.
   This departs from the recommendation (a short round before opening and the rest at lunch): the lunch half is not
   built, so on weekdays her round is 06:15–06:45 only.
4. **Yui at the counter: yes.** The plan gave no recommendation here; this was decided for the owner, on the reasoning
   that with her grandmother behind the counter from seven, Yui's breakfast at home has nobody at it. Her morning set at
   the counter replaces it, and she walks on to school. The owner may reverse it.
5. **Her husband's records**: Okinawan min'yō and enka on 45s.

What changed (commit `89d99d7` on `claude/great-sagan-mvc9bb`; the handover is [HANDOFF-KISSA-HIGA-2026-10-30.md](../HANDOFF-KISSA-HIGA-2026-10-30.md)):
- `src/commerce/kissa-higa.js` (new): the hours and the shutter's timing, the paper on the shutter, the menu (three
  items at ¥300, no alcohol), the supplies, the records, the seats and the keeper's two places, the regulars from their
  own days, `kissaOpen`, `kissaOnDuty`, `kissaShutterDown`, `kissaPassable`, `kissaVisitAt`, `kissaPeopleAt`.
- `src/world/okinawa/higa-liquor-dressing.js`: the dressing list, the left-out list, the lettering (green valance, hours
  card, menu, coffee poster, A-board, paper, bus photograph), the interior, the green awning (the sugidama gone), and the
  front's `update(minutes)` on the kissaten's clock.
- `src/world/okinawa/kissa-higa-props.js` (new): the three Meshy models streamed near the shop, with code stand-ins.
- `assets/models/kissaten/` (new): the record player, the bentwood chair and the hand grinder at 512 px.
- `src/world/okinawa/quarters.js`, `houses.js`, `signs.js`: the sign, the prompts (order, the table, the records, the
  jar), the clock hook, the interior kind `kissaten`.
- People: `cast.js` (her day, Yui's walk to school, `PLACES['kissa-higa']`), `canonical-rest.js` (up at 05:30),
  `canonical-day.js` (a kissaten breakfast replaces breakfast at home), `shop-days.js` (the keeper and the regulars),
  `roster.js`, `home-directory.js`; `neighbours.js` `replan` and `game.js` `passagesChanged` (routes searched again
  when the way in opens or shuts).
- `merchandising.js` (Kissa Higa's account), `feed/places.js` (a morning story place; the bench's renamed), her guide
  article (`guide/articles.mjs`, `tools/apply-articles.mjs`, `guide/residents.json`, portraits fingerprint), rules
  (root `CLAUDE.md`, `johansson-town/AGENTS.md`), stale documents fixed.
- Tests: `tests/kissa-higa.test.mjs` (new, in the CI guard); updated with dated notes, none weakened:
  `higa-liquor-laundry`, `higa-shop-collision`, `no-z-fighting`, `canonical-overnight`, `okinawa-quarters`,
  `seat-layouts`.
- Tools: `tools/kissa-higa-photos.mjs` (static town), `tools/kissa-higa-live.mjs` (the running game with residents).

Corrections found by the self-audit while building, each before the commit:
- **Bread from a shut shop:** she bought bread at Sakura's back door at 06:45, when Sakura opens at nine. She now takes it
  at the till at five the afternoon before. The ice from the quay went the same way: it now comes from a fridge-freezer
  behind the counter.
- **Shut in:** the shutter would have come down with her inside. She now steps out first.
- **The paper in mid-air:** the paper on the shutter would have hung in the doorway once the shutter rolled up. It is now
  shown only while the shutter is down.
- **Invisible glass:** the siphons' glass vanished, leaving the coffee floating. It is now tinted glass that shows.
- **Bar stools:** stools at bar height would have left seated feet in the air. The ledge and stools now use the izakaya's
  0.74/0.46 m pairing.
- **The ledge** blocked the walk to the register; it is shorter.
- **Breakfast at home:** the rest's breakfast phase hid Yui's counter breakfast. A kissaten visit now replaces it.
- **No time in the garden:** her garden round had five minutes. She is up at 05:30.

Open: see the handover's "Known limits" and "Next".

## Next action (superseded by the build)

The owner answers the five decisions and says whether to build. Then, in this order: the data module (hours, menu,
regulars, supplies) with its tests; the dressing and the frontage on the clock, with the Meshy chair, record player and
grinder prepared for World (512 px, colliders, a look under the ink at phone size); her day and the regulars' days; the
storyteller place and its backdrop; the guide and the rules text; the tests in section B updated with dated notes (none
weakened); `npm run build:runtime`; the CI guard with CI's heap; photos at 07:40 and 10:00, looked at. Publishing to
`main` only on the owner's word.

## Codex independent review (30 October 2026; unpublished)

Branch `codex/kissa-higa-review`, from `claude/great-sagan-mvc9bb` including its independent-review note `a7809833`.
Fix commit `75a8e72bdc2e4324f724de4e00843ad01ed8db3e`. The [handover's Codex review](../HANDOFF-KISSA-HIGA-2026-10-30.md#codex-review--30-october-2026-unpublished)
marks every initial finding fixed or still open, including the additional overlapping print-atlas regions.

The actual street planner now brings Tetsuo and Mori; their sleep and Tetsuo's workshop shift agree with the authored
day. Tetsuo leaves five minutes before Mori. Ganaha goes directly to the laundry. The frontage holds its shutter and
colliders for anyone inside, with the keeper waiting outside. Closed prompts recheck access. Replanning reaches local
walks in both controllers and leaves sitters and distant journeys alone. Board, tubes, paper and prompt text follow the
keeper's opening/closing operations; the board, shelf collider and keeper mark are corrected and tested.

Final runtime built (`boot-DfkZ-ZpG.js`). Focused tests 51/51; feed/runtime acceptance 16/16; full guard:
**482/482, 91 files, all green in 248 s**. Built live checks passed at 08:20/08:35 on days 4, 6 and 11, with Ms Uezu on chair-1 on day 11;
closing held safely with the player inside at 09:52, then closed after release. No page errors. All 21 live and ten
refreshed static photographs were inspected at full size. Both storyteller places now have eight accepted backdrop
views, two thumbnails, depth and seat metadata, and `captured:true`. Evidence and logs:
[`docs/qa/kissa-higa/review/`](../../docs/qa/kissa-higa/review/README.md).

No seat height changed: the established 0.21–0.25 m cartoon shoe gap remains the owner's decision. The unbuilt lunch
garden half and Yui's earlier breakfast choice remain open as recorded above. No Meshy calls, credits or new models.
No phone, physical device, hardware GPU, installed Linux edition or Studio sync was checked. No merge or publication;
the draft targets the source branch, and `main` is untouched by this work.

PR/commit record: [draft PR #404](https://github.com/nj22az/nj22az.github.io/pull/404), head `codex/kissa-higa-review`, base
`claude/great-sagan-mvc9bb`; fixes `75a8e72b`, evidence/runtime `50fee3d3748101a1d1591f5a0581dd90f112d370`.
Confirmed open, draft, conflict-free and unmerged. Hosted World guard was in progress at the 12:08 UTC read;
only the local 482/482 result is claimed green here. The following documentation commit records this link; no game
source, runtime or accepted photograph changes after validation. Re-check current hosted checks before any merge.

## Owner-authorised publication — 30 October 2026

The owner said “Push” after the branch-only status was explained. Publication now combines the reviewed café and the
fish-market/co-op-counter work with current main. [The publication handover](../HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md)
is the current source for the candidate, exact checks, merge and live-delivery verification. The earlier unpublished
state above is historical. The foot-gap/garden/Yui decisions and physical-device limits remain open.

### Published and verified

[PR #407](https://github.com/nj22az/nj22az.github.io/pull/407) merged into main as
`1c4d6c33d5f0447676cb4edcb22a25480e6e1adc` on the owner’s “Push”. Final PR World guard 482/482; post-merge World guard,
island review and Pages passed. 92/92 checked deployed files match; verified public-byte mirror smoke passes, 98/98
requested files matched and both new captures inspected at full size. The direct live-origin browser check was not
completed: automatic review rejected the persistent certificate trust-store change, and the verified mirror was used.
The pre-existing controller fixture failure reproduces on unchanged main; the clear ferry fixture retains every
original assertion and adds a starting-position assertion. The hosted Linux workflow’s earlier acceptance stages pass;
its full resident/controller acceptance was still running at the last check. No new public Linux package, physical
device check, Meshy spend or Studio sync. See [the current publication handover](../HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md)
for exact runs, logs, remaining decisions and scope.
