# Japanese Miniature Scenes: what they can give Johansson World

The owner, 30 October 2026: "<https://github.com/xiaoninemao/japanese-miniature-scenes> Explore which scenes can replace or
enhance a building or scene in Johansson's world I think spontaneous the fish market can be reworked".

Researched 30 October 2026 from the repository's `main` (`2e2fa20`, 19 September 2026) against World `main` (`5572f46`).
This note is the survey and the fish-market brief. The brief was built the same day ("Work accordingly to your
recommendations"; "I like the sale counter"): see [Built](#built-30-october-2026).

## What it is

Nine small three.js dioramas (TypeScript, Vite), each on a 15 × 15 m square base: a fish stall, a konbini, a ramen shop, a
coin laundry, a kissaten, a florist, a station, an onsen inn and a hillside bookshop. Everything is modelled in code from
boxes, cylinders, tubes and extrusions with flat toon materials; signs and dials are drawn on a canvas in the browser.
Each scene has geometry tests (the fish stall's walls meet its sloping roof, the station's benches stand on their supports,
fallen leaves touch sloping ground). That is the same family as our procedural kit (`src/world/okinawa/kit.js`) and our
geometry assertions, so its ideas translate directly into World's code.

**Licence: none.** The repository has no licence file, so it is all rights reserved by default. Treat it as we treat New
Yokosuka (`new-yokosuka.md`): study it and measure it, never copy its code, its sign names (朝凪鮮魚, AME MART …), its
colours wholesale or its preview images. Our builds are drawn from our own data (`fish.js`, `cast.js`, the ground plan).

**Setting.** Minato Machi is a subtropical Okinawan port town living in the 1990s. Snow, autumn maples and a railway do not belong; rain does
(the rainy season in May and June, typhoons), and so do the harbour, the bath and the coin laundry.

## Scene by scene

| Scene | World place | Verdict | What to take |
| --- | --- | --- | --- |
| **Morning Fish Market** | East-quay fish auction and the ice plant (Kōji; `okinawa/quarters.js` `buildEastQuay`) | **Rework first** (below) | The catch drawn as fish in ice, hollow boxes, a dial scale, price cards, the working kit of a wet floor, the quay edge's tyres and rope |
| **Midnight Laundromat** | Coin laundry (Ms Ganaha, open 24 hours; `commerce/coin-laundry.js`, `coin-laundry-dressing.js`) | Enhance | Round doors with the drum and the washing turning inside (it animates), the folding table, baskets, the blue night light that makes a 24-hour shop a place for night stories. Our machines already have their data (W1 7 kg, ¥200, 30 min) |
| **Snowy Ramen Shop** | Sato Ramen (Mrs Sato) | Enhance the front only | Noren, paper lanterns, the soup pots seen through the window, steam from the flue. No snow. The inside is the shared Minato compact room and stays |
| **Rainy Konbini** | Sakura Shōten | Do not replace | Sakura has its own CAD, keeps its upstairs office (the owner, 24 October) and is the Pixar priority. Take the technique only: rain on a wet street and its reflections (`reflection.ts`, `weather.ts`), for World's rain, where residents already open umbrellas |
| **Rainy Florist** | None now: the Rainflower pavilion came down on 19 October (phase 4); Sakura supplies flowers | Borrow pieces | Flower buckets and a wrapping table as Sakura's flower stand at the door; a rain chain on a house |
| **Seaside Station** | No railway. The Kitano-jima ferry pier (Kai) and the Port Terminal | Borrow pieces | The waiting shelter: benches that stand on real supports (their test checks it), a ticket window, a timetable board (we have `ferry-timetable.js`), a wind chime |
| **Mountain Onsen** | Umi-no-yu (Grandmother Higa) | Skip | Umi-no-yu is already World's most detailed place (about 4,000 lines: steam, rocks, signs, electrics). At most a stone lantern or bamboo fence for the onsen garden |
| **Afternoon Kissaten** | None: World has no coffee shop (Sato Ramen pours coffee from its drinks stand) | New place, the owner's call | A kissaten would make stories (regulars, a siphon, records), but it is a new place, not a replacement |
| **Hillside Bookshop** | Front-Row (bookshop, press and workshop; Sakura sells the books now) | Skip the building | Its terrain: one continuous slope with stair flights and landings, tested for continuity (`terrain.ts`), for World's hill paths (the mountain trail, the utaki approach) |

## The fish market: rework brief

### What stands there now

Photographed with `tools/fish-market-photos.mjs before` (`docs/qa/fish-market/before/`; the static town with its cel and
ink passes, no simulation; not a device check).

- The shed is 8.4 × 6.2 m and 4.4 m to the eaves, open on H-section columns, with a steel gable roof and purlins over a
  painted green floor (`EAST_QUAY.shed`). The ice plant stands to the east, the drinks machine on its west wall, two
  boats lie to the quay, the forklift waits under the chute. The price board (25 October) is good.
- **The catch does not read as fish.** Eighteen solid blue boxes (0.72 × 0.26 × 0.46 m) stand in a 3 × 6 grid. Each
  carries three spheres stretched to 0.44 m but set 0.2 m apart, so they merge into one sausage, and they lie on the lid
  (centre 2 cm above it), not in the box. There is no rim, no hollow and no ice, though the ice plant is next door.
- The scale is a plain grey box (0.6 × 0.9 × 0.6 m).
- **Nowhere sells a fish.** Yonamine Fresh Fish has closed and its plot is gone; `merchandising.js` sells no fish; Mrs
  Sato buys at the auction. The shed's own text says what is left in the crates "will be somebody's supper", but nobody
  can buy it.

### What the reference does better (measured, not copied)

1. A fish reads as a fish from three metres with six primitives: an oval body, a darker oval along the back, a flat fan
   for the tail, a white eye with a dark pupil and a thin gill line. Two to a box, turned about ±0.15 rad to each other.
2. The box is hollow: a floor, four walls and a lip, with a bed of crushed ice and a scatter of flattened ice chips above
   it, so the fish lie in ice.
3. A dial scale with a painted face (ticks, needle, "5 kg"), drawn on a canvas.
4. A price card on a stick in each box.
5. Working kit, each piece for a job: a sink with a gooseneck tap, a chest freezer with a chopping board on it, rubber
   boots, buckets, a hand trolley, a net drying on the back wall, a hanging lamp, a "today's fish" board.
6. A corrugated roof with ribs, a gutter and a downpipe to the drain; walls tested to meet the roof.
7. The quay edge: tyres hung on ropes along the face, rope coiled on the bollard.

Its stall is a miniature and exaggerated (its boxes are 1.26 × 0.89 m, its fish 0.75 m). Take the ideas, keep our real
sizes: a fish box is about 0.6–0.7 m long.

### Proposal, in order of value

Each item says who it is for and why it stands where it does (CLAUDE.md, "Nothing is random").

1. **The catch, drawn properly (a correction to the cartoon World, like the 25 October board).** Hollow blue co-op boxes
   on the auction floor, each on a bed of ice from the plant next door; two or three fish a box, drawn as fish in their
   `fish.js` colours and kinds (`fishAt('auction')`); no maguro or sēika, which the shed's text says went first. A lot ticket on each box (the boat and the weight), so the catch says whose it is. Build `fish(kind)` and
   `fishBox()` once and share them with the izakaya, the anglers' catch and the comic stills, so the storyteller can use
   them too.
2. **The working shed.** A dial platform scale for the grey box. A hose reel and a floor drain, and a wet floor after
   seven ("Floor washed by 07:00" is on the board). A boot rack (the wardrobe's boots are "for the wet quay and the fish
   market floor"). The auction bell the shed's text mentions. Hanging lamps for the dark winter mornings before six.
   White polystyrene boxes packed and labelled for the buyers who take fish away (`fish.js` lists the izakaya).
   Corrugated ribs, a gutter and a downpipe on the roof.
3. **A direct-sale counter: somewhere to buy one fish** (new purpose; the owner decides). It opens when the floor is
   washed and sells what the buyers left, with price cards and a "today's fish" board written each day from `fish.js` and
   the auction board's prices, which the storyteller can read. Real precedent: Naha's Tomari fishing port held the
   prefecture's fish auction from 1980, with a retail fish market, Tomari Iyumachi, on the same port (Ryukyu Shimpo).
   Open questions for the owner: who keeps it (Kōji keeps the auction and the ice plant and is the ferry's relief), and
   its days. Where it stands is drawn in CAD first, inside these limits: the walk between the shed and the parapet, from
   the lawn gate to the ice plant, stays clear; so does the forklift's run from the ice door to the boats; the drinks
   machine stays on the plant's west wall and the board at x 28.9, z −43.7. The shed's south-west bay, facing the lawn
   gate (x 19–21.65), is the first place to try.
4. **The quay edge.** Tyres on ropes along the face (one hangs there now), rope coiled on the bollard. No timber pier: the
   east quay is concrete and the boats lie to its face.

Not taken: the stall's name and sign, its lean-to stall in place of our co-op shed, its square base, its wooden pier.

### Built (30 October 2026)

`src/world/fish-market.js`, placed by `buildEastQuay` (`okinawa/quarters.js`); measured by `tests/fish-market.test.mjs`.

- **The catch:** 16 hollow co-op boxes (base, walls, a lighter lip) on beds of ice, two to six fish each by size, drawn
  as fish (body, darker back, paler belly, forked tail, eye), laid head to the left and belly to the viewer as a Japanese
  fishmonger lays them. Each lot records the boat that landed it, by how `fish.js` says it is caught (`LAID`,
  `LANDED_BY`); the slip under each box's lip is plain paper, too small to letter. Two lots of the old 18 gave their bay
  to the counter. Kōji's stack of empties stood 16 cm sunk in the floor and through the corner lot; it now stands on the
  floor behind the counter, beside where he sorts (`neighbours.js` [23.4, -41.7], which no solid touches any more).
- **The working shed:** a 30 kg platform scale with a painted dial (needle at nought) for the grey box; the tap, hose
  reel, trench drain and a damp band round it (always damp, not yet tied to the clock); three pairs of white boots upside
  down on a rack; the brass hand bell on the seaward column; three enamel lamps that light at dusk; lidded polystyrene
  boxes packed for the izakaya and Sato Ramen. The level bars that stood clear of the roof at the eaves are now ribs down
  both slopes, with a ridge cap, gutters along both eaves and downpipes down the two lane-end columns.
- **The sale counter (鮮魚直売):** in the landward west bay, its front on the walk from the lawn gate. A cabinet in the
  co-op's blue under a steel top, a sink with a gooseneck tap, an ice tray in two halves, a 5 kg dial scale to the
  customer, and its board on the front column. It sells gurukun and irabuchā by the kilo at the auction board's prices
  (¥900 and ¥1,200), the two kinds the board prices. Kōji keeps it from 07:00, when the floor is washed, until he goes
  to the ice plant at nine, on his weeks ashore (`fishCounterOpen`; on his relief weeks he is the ferry's bosun). The
  fish and price cards on the ice are out only while it is open; outside the hours the prompt says when it opens.
  Placed from the layout data and checked by the tests; no CAD drawing was made.
- **The quay edge:** three tyres on ropes from kerb rings, east of the boats, where the one disc-shaped tyre hung
  without a rope; the spare line coiled on the paving beside the bollard and made fast round it.

Cost: about 38,000 more vertices than the old crates (the town is about 2.9 million); the test holds the market under
56,000. Not done: lettering on the slips and packed boxes, a board that changes daily, the wet floor following the clock.

### Stories it opens (from what the town already holds)

- Boats in by five, the bell at six, the hose at seven: whoever is standing on the floor at seven gets wet.
- A lot ticket mixed up: Mrs Sato's box goes to the izakaya, her rival for the evening crowd (`cast.js`).
- Gurukun are blue in the sea and red on ice (`fish.js`): a story that teaches, told at the counter.
- The sēika, the diamond squid "the size of a cat", went first again.
- Somebody weighs something on the fish scale that is not a fish.

### Workflow

The owner, 24 October: `main` keeps the simplified cartoon World until the Pixar world is complete; Codex prototypes
detailed three.js rooms on `development`; Claude takes them to Pixar standard in Blender. Items 1, 2 and 4 are corrections
to the cartoon World's look and fit `main`. Item 3 is a new place: the owner chose it on 30 October ("I like the sale
counter"). The brief stands for a Pixar fish market later.

Before and after: `node tools/fish-market-photos.mjs after` (from `johansson-town/`) photographs the same five spots.

## Sources

- <https://github.com/xiaoninemao/japanese-miniature-scenes> (`main` `2e2fa20`), each scene's `src/model.ts`, `tests/` and
  `public/preview.png`.
- Ryukyu Shimpo: the last auction at Tomari fish market before it moved to Itoman (2022), and the Tomari Iyumachi events:
  <https://ryukyushimpo.jp/news/entry-1596261.html>, <https://ryukyushimpo.jp/tag/%e6%b3%8a%e3%81%84%e3%82%86%e3%81%be%e3%81%a1>.
