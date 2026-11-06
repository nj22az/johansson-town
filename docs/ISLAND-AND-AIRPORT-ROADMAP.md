# A Rishiri-inspired fictional island in 1990s Okinawa

The goal is an island with a memorable silhouette and an everyday life shaped by its coast, mountain, harbour and small airport. Use Rishiri's spatial structure and feeling of remoteness; keep Johansson Town's fictional identity, warm climate, English text, Okinawan shop-houses, red tiles, vegetation, food, yen prices and 1997 setting.

## What Rishiri contributes

Rishiri has a central mountain, coastal settlements, fishing harbours and a road around the shore. The mountain supplies a landmark visible from different sides; quieter coves and headlands separate settlements. Rishiri's airport is on the north-western coastal lowland. It had an 800 m runway before the June 1999 extension to 1,800 m. For our 1997 fiction, a modest terminal and propeller commuter aircraft make a useful reference.

Sources:
- Japan National Tourism Organization, mountain and coast: https://www.japan.travel/en/spot/1880/
- Official Hokkaido tourism, island loop and fishing villages: https://visit-hokkaido.org/abouthokkaido/citiesandtowns/wakkanai/
- Hokkaido government, airport location and development: https://www.souya.pref.hokkaido.lg.jp/kk/wkk/127636.html
- Rishiri municipal museum, island form: https://rishiri-town.jp/教育/利尻町博物館/利尻の自然・歴史/

## Implementation update — 2 October 2026

The garden, mountain, far-coast village, reachable ferry/commuter journey, development records and large airport construction district are now implemented in the island branch. The user requested a much larger airport than the original small-terminal reference: two public concourses and eight shops are open, with a third terminal fenced for construction. See [the playable implementation guide](ISLAND-GARDEN-AND-AIRPORT.md) for completed features and remaining work. The original baseline and development sequence below explain the design context.

## Original baseline

The present terrain is a small flat peninsula with coastal quarters and a working harbour. `src/world/peninsula.js` defines its shared coastline. The separate Kitano-jima airport is currently a horizon model: it has a runway, terminal, hangar, departure animation and a recorded future ferry landing, but no player access or functioning passenger journey. This is the largest airport gameplay gap.

The published `claude/johansson-town-amplify-audit` branch currently matches main at 985cc8f; the user's proposed dock expansion is not yet present there. Workshop relocation is isolated in `dock-workshop-layout.js` so its plot can be fitted to the eventual dock design.

## Proposed island structure

- Keep Minato/Johansson Town as the compact primary harbour settlement. Keep Front-Row Books on its original street and put the electrical workshop, stores and repair traffic in the industrial docks.
- Give the expanded island one original mountain with green foothills and a recognisable summit. It need not copy Mount Rishiri's height or outline. Add an upland pond, springs and one accessible viewpoint before a full summit route.
- Add a continuous coastal road, with short inland connections, walking/cycling sections, several coves and a lighthouse headland. Avoid duplicating busy shops all around the shore.
- Add one smaller fishing settlement on the far coast. Give it its own pier, family homes, net shed, small general store and distinct routines. Let open shoreline and fields separate it from the main town.
- Keep Kitano-jima as an adjacent airport island initially, connected by a real local ferry and onward bus. This preserves existing assets and supports a believable island group. If the chosen masterplan places the airport on the main island, decide that before extending terrain; use the coastal lowland, clear of the mountain, with a coastal bus connection.

The player's world should be compressed, not a literal reconstruction of a roughly 60 km island. Judge it by travel time: the existing neighbourhood remains comfortable on foot; the far village, trailhead and airport are reached by bike, bus or ferry, with places worth stopping between them. Use a shared design map for scenery, walkable terrain, vehicle routes, navigation and NPC destinations.

## Development order

| Phase | Build | Completion check |
| --- | --- | --- |
| 1. Agree the map | Combine Claude's dock/airport work with one coastline, mountain zone, coastal loop and reserved settlement plots. Keep existing doors and save IDs stable. | All authors use the same coordinates; no competing terrain or dock layouts. |
| 2. Separate town trades | Dock electrical workshop for Kenji/Tetsuo; bookshop for Aya/Reiko; customers browse, buy occasionally and exchange short recommendations. | Printing/repair quest still works; book customers walk around furniture, finish visits and do not duplicate on re-entry. |
| 3. Establish island character | Mountain silhouette and foothills, varied shore, forest/fields, headland, first viewpoint; extend the coastal route. | Ground, shoreline, collision and navigation agree; existing town stays recognisable; mountain is visible from key arrival views. |
| 4. Open the airport journey | Reachable Kitano-jima landing/terminal, passenger ferry transfer, local bus, ticket counter, baggage, apron viewing and one complete outbound/inbound commuter journey. | Walk town → transfer → check-in → board → arrive/return; missed connections, closure and save/reload leave the player in a valid place. |
| 5. Grow daily island life | Far-coast village, guesthouse, fishing/cargo cycles, airport staff and a small visitor flow. | Every new NPC has a home, work, meals and transport; aircraft and ferry arrivals drive actual visits instead of spawning crowds. |
| 6. Let places grow together | A fictional town development programme expands docks, airport services and the far village according to completed projects and demand. | Growth changes services and routines, keeps old saves usable, and produces traceable paperwork. |

## Airport and harbour as one economy

Use a shared fictional timetable for ferry, airport transfer and commuter flight. The industrial workshop repairs radios, pumps, harbour equipment and airport support equipment. Arriving visitors buy a guidebook or newspaper, use the guesthouse, eat locally and take the coastal bus. Cargo and supplies have identifiable destinations; the airport is also a resident service, not only a tourist attraction.

File tickets, passenger counts, cargo manifests, supplier orders, invoices, maintenance work orders, workshop test sheets and project minutes in the Community Hall register. Link each chain by a stable reference so the player can follow an airport maintenance job or an island development purchase through the same one-year audit system already built.

Growth is proposed gameplay, not an assertion that these features are already implemented. Keep the 1997 fiction consistent: airport expansion can begin with survey sheets, budgets, procurement and a service upgrade; do not introduce a modern international terminal or jet traffic by default.

## Engineering prerequisites

Terrain must use one height model shared by mesh generation, player/NPC grounding, collision, navigation, map and vehicles. Existing flat-world assumptions must be audited before adding steep slopes. Extend navigation bounds and camera/horizon distances deliberately; keep distant mountain/airport geometry simple and stream nearby settlement detail. Preserve mobile frame rate and memory by profiling each phase.

NPC visits must survive save/reload and clock changes. A single journey record should own transport reservations, boarding, arrival and recovery. New residents need names, homes, roles, schedules, money and social links before they are placed into a neighbourhood. Expand the avatar creator under issue #132 separately so geography work does not stall character improvements.
