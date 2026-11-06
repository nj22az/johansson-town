# Johansson Island master plan — 10 October 2026

Two islands and one walking network. Minato is the compact harbour town, crossed on foot in a few minutes. The
uplands to the south hold the farms, Mount Aoba, Aoba Radio, Hoshizaki and the West Cape lighthouse. Across the
strait, Kitano-jima is a tropical island with a small commuter airport, reached by the Minato car ferry.

## Survey: can you walk everywhere?

`node tools/reachability-audit.mjs [--json out.json] [--png out.ppm]` flood-fills the game's own walking rules
(`routeAt`, colliders at standing height, the climbable step) on a 0.5 m grid. It starts on Main Street and at the
Kitano quay, which the ferry joins to the town. Then it checks every door, seat, counter and notice against the
ground it reached. Results today:

| Measure | Value |
|---|---|
| Walkable ground | 60,860 m² |
| Reached from Main Street | 49,360 m² |
| Kitano-jima, from the quay | 11,390 m² |
| Doors that cannot be reached | 0 |

The one flagged interaction, the Aoba Radio roof lookout, is reached by its stair; the flat survey cannot climb
stairs. The sealed pockets left are the Ōshiro cattle pen and the inside of Mr Fujita's houseboat, both closed on
purpose. Re-run the survey after any change to ground, colliders or doors.

## Districts

| District | Purpose | Access |
|---|---|---|
| Minato harbour town | Daily life: Sakura Shōten, Front-Row Books, the harbour office, Harbour Park, izakaya and ramen | On foot |
| Rainflower Lane, Aoba Garden | Second shopping street, Umi-no-yu, the pond garden | Short walk south of Main Street |
| The uplands | Cane fields, the Ōshiro farmstead, tombs, Aoba Radio, the coastal road loop | Walk or cycle; coastal bus |
| Fumoto | The farming hamlet at the foot of Mount Aoba: four houses, the co-op store, the well and the square | Main lane from the coastal road; on the way up the summit path |
| Mount Aoba | The island's landmark hill, 14 m, south-east of Aoba Radio (`ISLAND.mountain`) | Walk up any side; slopes stay climbable |
| Hoshizaki, West Cape | Fishing village, store, guesthouse; the lighthouse | Coastal road; village bus |
| Kitano-jima | Coral Bay, the jungle trail to the Hinata lookout, Turtle Cove; the airport plaza, three kiosks, the departure lounge | Car ferry from the town quay; Naha commuter from Gate 1 |

Kitano-jima's terrain, outline, trails and plantings are `src/world/tropical-island.js`; its walking rules are
`airportSurface` in `airport-ground.js`; its plaza, lounge, benches, fence and notices are `airport-district.js`.

## Rules the plan keeps

- One walking network: every door sits on ground connected to Main Street. The ferry is the only link not on foot.
- Walking height and drawn ground come from one grid (the town plan, `islandTerrainHeight`, `tropicHeight`).
- Airside stays airside: the airport fence crosses the whole of Kitano-jima at v = 16.75.
- Nothing is random: every kiosk, bench and sign has someone it is for, recorded in its notice text.
- The third-person lens stops at drawn surfaces (awnings, canopies, shop glass) and never sits inside the avatar's
  head (`src/render/lens-occlusion.js`).

## Built on 11 October 2026

1. **The uplands.** Mount Aoba's summit has an utaki, the island's sacred grove: a dry coral-stone wall, an altar
   stone with an incense bowl, and four gajumaru banyans. A gravel path spirals up from Aoba Radio (`SUMMIT_PATH`,
   under 25 % grade). Haru from Hoshizaki climbs to it before dawn to pray for the catch. The Ōshiro family's
   honesty stand on the coastal loop sells gōya, sweet potatoes and shima-rakkyō. Aoba's woods use the vegetation
   kit's evergreen broadleaf trees.
2. **One sea, one horizon.** The surrounding sea is marked as horizon scenery, so the section streamer no longer cuts
   it into the 24 m cells near the player. That was the square of sea round the player, with bare sky beyond it,
   seen from every hill. The sea keeps its colour past Kitano-jima and hazes only near the true horizon. It hazes
   further out from higher ground, and now reaches the distant southern ridge.
3. **Smoothness.** Static groups are batched by `static-props.js`: the airport island, Kitano-jima's plaza and
   stands, the island landscape, the countryside, the brick planters, Blue Coral, the Rainflower lane and the
   izakaya frontage. Glowing or rain-darkened materials stay live. This saves 5–8 % of draw calls in every view
   measured. The rest of the cost is the outline and shadow passes, which a later phase should target.
4. **Life on Kitano-jima.** The Coral Bay Bar is supplied by Sakura Trading (its Umineko lager was Higa Liquor's until the shop closed, 22 October 2026)
   (juice). It rents out parasols. Jun eats his lunch on the sand. Coral Bay and the utaki are storyteller places
   with captured backdrops.
5. **Detail.** `vegetation-kit.js` grows plants from their anatomy in the cel-shaded style:
   - coconut palms with ringed trunks and feathered fronds;
   - buttressed rainforest trees and banyans with aerial roots;
   - pandanus, banana plants, ferns, flowering shrubs and grass;
   - coral rocks, driftwood and shells.

   `island-architecture.js` builds layered thatch, bamboo, corrugated iron, striped awnings, planks and stocked
   shelves. Small detail (ferns, grass, shells) is hidden beyond 150 m.

## 11 October 2026, later

- **Kitano-jima is far across the strait.** The island moved from 150 m to 360 m off the quay (centre (270, −290)):
  from the port it is a low green island on the horizon. The camera's far plane is 640 m, the sea's haze starts at
  300 m, navigation and the shore map reach it, and the car ferry takes 34 s instead of 18.
- **Minato Izakaya's street front.** The front wall stands on the door plane, behind the recessed doorway, and the
  street through the door and window is the live town (`streetFrontage`, the same renderer as Sakura's glass), not
  a picture pasted into the opening. Four sliding koshi-do (kick boards, kumiko-barred glass) fill the opening, with
  the middle pair slid open for a 1.8 m entrance, a granite step and a two-groove track. The window looks out
  through the frontage's own koshi slats.

## Fumoto, 11 October 2026

Fumoto (麓, "the foot of the mountain") is the farming hamlet at the south-west foot of Mount Aoba, built as an
Okinawan buraku of the seventies to nineties (`fumoto-layout.js`, `okinawa/fumoto.js`).

- **Plan.** A main lane of white coral sand runs from the coastal road, through the gap between the two south cane
  fields, past the hamlet and up to the summit path below Aoba Radio, so the hamlet is on the way up the mountain.
  Two cross lanes run west from it. Four walled houses face south onto them, as Okinawan houses do: three red-tile
  houses with coral-stone walls and a hinpun, and one concrete house with a block wall, rebuilt after a typhoon.
  The mountain's foot is eased back from the hamlet so that its ground is level, at Kitahama's height.
- **Village things.** The kyōdō baiten (co-op store), which the hamlet owns in shares, has its post box, telephone,
  bench and drinks machine. The asagi square has an old gajumaru, the village well and a stone bench. There are
  ishiganto stones at both T-junctions, a fukugi windbreak behind the houses, kitchen gardens across the lower lane,
  Old Mr Zukeran's goat pen, and a pole line up the lane from the coast road.
- **People.** The Kuniyoshi (the kuchō), Tokashiki, Ishimine (tofu at dawn) and Zukeran households have family homes
  with lit windows that follow farmers' hours. Grandmother Tokashiki keeps the co-op store; Old Mr Zukeran feeds his
  goats, weeds the garden and plays the sanshin under the gajumaru in the evening. Both are in the resident guide
  with portraits and photographs.
- **Trade.** The co-op buys its everyday goods from Sakura Trading and its awamori and beer from Sakura Trading too (Higa Liquor's until the shop closed, 22 October 2026)
  (`merchandising.js`), collected on Wednesdays by the store's van. The Ishimines' tofu is made for its counter.
- **Stories.** The square is a storyteller place (`fumoto-square`) with captured backdrops.
- **Survey.** No door is unreachable. The goat pen is closed on purpose, like the Ōshiro cattle pen.

## Next

- Day-trippers: ferry arrivals that bring visitors with towels to Coral Bay. This needs new residents with portraits
  in the resident guide.
- Outline and shadow pass budgets on iPad: the largest remaining frame cost.
