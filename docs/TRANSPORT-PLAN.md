# Johansson Town: the combined airport ferry and working port

4 October 2026 — Current build: the airport bridge and causeway are removed. Kitano Road ends on the town mainland. One Minato–Kitano-jima ferry carries passengers and occasional owned vehicles between town and the airport island; the ship waits while a car boards or leaves its bow ramp. There is no separate passenger launch.

The airport has a west-side pier, a passenger waiting point clear of the vehicle lane, a continuous paved route to check-in and a connected cargo court. Cars have visible resident drivers, reverse onto the small foredeck and drive forward off. Delivery appointments determine which trips carry a car. Static legacy trucks and unused decorative cars are removed.

The bridge construction and separate-ferry proposals below are archived history. They no longer describe the live topology or accepted transport plan.

## Archived plan from 3 October 2026

3 October 2026. Phases 1 and 2 are built (see *Progress* below); the rest is the plan. It joins Kitano-jima, the airport island, to the main island with a bridge.
It gives the island one road network that cars, the bus and lorries drive realistically, and it moves the heavy
port beside the airport. The town keeps what a small island town keeps at its quay.

## What there is today (surveyed)

| Thing | Where | Built by |
|---|---|---|
| Airport island | Centre (165, -118). Runway 100 m (116,-129)→(214,-107), terminal, dock (114,-92.5). District foundation reaches NW to (83.5,-1). | `airport-island.js`, `airport-district.js` |
| Getting there | **Only by a scripted ferry ride** (¥400, 18 min) from the town pier. You cannot walk or drive there. | `island/play.js` |
| Oil jetty | Deck x 44–64 at z ≈ -45, depot at (40.6,-45.6), tanker every third day. **In town**, at its south-east corner. | `oil-jetty.js` |
| Cargo port | West quay, x -39…-18, z -50…-38, container stack, cargo ship calls twice a day. **In town.** | `docklands-life.js`, `cargo-shipping.js` |
| Car/passenger ferry | One ship at the outer pier's west flank (-6.35,-58); terminal box (7.1,-47.3). Two vehicles per call drive off on fixed curves up Main Street and vanish. | `ferry.js`, `ferry-vehicles.js` |
| Warehouse, harbour office | (-13.6,-42.4); (13.3,-42), door (13.3,-37.55). | `warehouse.js`, `business-layout.js` |
| Roads | Main Street (x -2.75, z -38…20.5) and the coastal road (5 m) round the island from (43,40). Both are only walkable surfaces. | `main-road.js`, `island-plan.js` |
| Vehicles | **No road graph, no traffic, no driving rules.** The island bus is a menu that teleports you. | — |

Distance across the water: the main island's south-east corner (44,-46.5) is about 50 m from the airport district's
west edge, and the shortest crossing (x 45→83.5 at z ≈ -1) runs through the middle of the east beach.

## Progress

**Decisions (agreed):** the car ferry gets its own name and timetable; the player rides the bus and watches the
traffic (no driving for now); the west quay goes back to fishing boats and the auction.

**The landing moved from the south-east corner to the east lawn.** Surveying the corridor showed that no road can
reach the south-east corner from Main Street without demolishing something the town keeps:
- the harbour office (x 9.7–16.9) and the ferry terminal (x 4.7–9.5) leave no gap between them;
- east of the office, the fish auction's canopy columns stand at z -48 on the quay apron;
- the east quay buildings and the ice plant fill the rest of the waterfront.

The alley between the post office and Higa Liquor (z ≈ 3.3) is already a straight east–west opening from Main Street,
and from the lawn the airport district's north-west corner is only about 40 m across the water. So:
- **Kitano Road** leaves Main Street at a T-junction opposite the shop crossing. It runs east through the old lane and
  across the lawn at grade, with a zebra crossing there. Past the walled garden it rises on a coral-stone embankment
  and crosses the beach on a causeway.
- **Kitano Bridge** (38 m) has a navigation span at its crest, east of the breakwaters, with 2.7 m clearance.
- The road comes down a ramp onto the district and ends at the **Terminal A car park**.

The cost is that the beach is now two walks, one from each opening in the seawall, either side of the causeway.

**Built:**
- `kitano-link-plan.js`: centreline, long section, cross-section and the walkable region.
- `road-network.js`: lanes, turning curves, the driver's rules.
- `town-traffic.js`: Main Street's two lanes, Kitano Road's two lanes, the car park loop and bays, the quay bays and
  the ferry ramp.
- `kitano-link.js`: the road, the embankment, the causeway and the bridge.
- The car ferry's four vehicles now drive off, over the bridge and park at the airport. Two others drive back aboard
  before the ramp goes up, and next call they swap.
- Two island cars run between the quay and the airport by day.
- Gates in `tests/kitano-link.test.mjs`:
  - gradient at or under 8 %, bends of at least 30 m, clearance at least 2.5 m;
  - walkable end to end;
  - every lane on ground and clear of colliders;
  - piers in the sea and no tetrapods under the deck;
  - a day of traffic at 60× with nobody stuck and no overlaps;
  - a car waits for you.

## The target

```
                         main island
   Main Street ──┐
                 │   Harbour Road (z ≈ -33, along the foot of the east lawn)
   ferry ▸ ▢ office ──────────────────────────────┐
   warehouse                                       │  bridgehead (SE corner, where the oil depot was)
   fishing quay · Fujita's pier                     ╲
                                                     ╲  Kitano Bridge, ~50 m, navigation span
                                                      ╲
                              Kitano Port ─── Port Road ─── Airport terminals A · B (C building)
                              RoPax berth + linkspan            │
                              cargo quay + yard                 runway
                              oil jetty + tank farm (fenced, set apart)
```

**In town (stays or comes back to this):**
- **The passenger ferry** to the main island at the outer pier, with the terminal you already have. The car deck moves away.
- **The warehouse** and **the harbour office**.
- **The fishing quay** and Mr Fujita's pier.
- The west quay, freed of containers, goes back to boats, nets and the fish auction.

**The harbour office becomes Port Control.** It stays in town and runs both ports by radio and camera:
- a control room with a VHF set, a radar repeater and CCTV screens of the RoPax berth and the oil jetty;
- a berth board that the ship calls write to;
- the harbour master clears the tanker in and out. When a ship is berthing at Kitano, you hear it on the radio in the office.

**At Kitano Port, on the airport district's reclaimed foundation, between the bridge and terminal A:**
- **RoPax (car ferry) berth.** A linkspan ramp, marshalling lanes (painted, numbered), a ticket booth and a canopy for
  foot passengers. Cars drive off, queue at the exit and take the Port Road to the bridge.
- **Cargo quay.** A container yard, a reach stacker, a cargo shed, and the "Kitano Cargo" boxes (moved from the west
  quay) with their lorry run to the town warehouse.
- **Oil jetty and tank farm.** These are fenced and kept furthest from the passengers:
  - two or three tanks inside a bund wall, a pipe trestle out to the jetty head and a tanker berth;
  - a road tanker filling bay; the tanker lorry drives to the power station and the town's petrol pump.

**The link: Kitano Bridge.** A low concrete girder bridge from the main island's south-east corner, about 50 m:
- two 3 m lanes, a 2 m footway on the harbour side, parapets and lamp posts;
- a raised navigation span so the fishing boats can still pass between the harbour and the east coast;
- abutments and piers in the water with scour rock, so it reads as standing in the sea, not floating;
- a short causeway on the airport side, on the same reclaimed foundation.

(The plan first put the landing at the south-east corner. It moved to the east lawn: see *Progress*.)

## Roads and driving

One road network for everything that drives (`world/road-network.js`):
- **Data:**
  - nodes and lanes with widths and speeds;
  - junctions with stop lines and give-way rules;
  - turning curves, bus stops, parking bays and loading bays.
- **Driving rules:** on the left, as Japan drives. 30 km/h in town, 40 on the coastal road and the bridge (scaled to
  the game's compressed distances).
- **Behaviour:**
  - vehicles follow lanes and keep a following distance;
  - they slow for bends and stop at stop lines;
  - they give way to people on zebra crossings and park in bays.
- **One height model:** the road is laid as its own surface (walk-surface lift), so wheels sit on the deck, the bridge
  and the ramps rather than on the plan's ground. That was the roadmap's engineering prerequisite.
- **Roads:**
  - **Kitano Road** (built), from Main Street across the east lawn to the bridge: two lanes and a footway on the harbour side.
  - **The bridge.**
  - **The Port Road** on Kitano: past the RoPax lanes, the cargo gate and the tank farm gate, to the terminals.
  - **The coastal road** joined to Harbour Road at its town end (43,40). It already has its edge lines.
- **Who drives, on timetables:**
  - **The island bus.** Town ↔ Kitano Port ↔ terminal A, timed to the flights and the ferry. It is a real bus you board,
    not a menu.
  - **Car ferry traffic.** Cars and kei trucks drive off the RoPax, cross the bridge, park in town; the return traffic
    queues at the linkspan.
  - **Lorries.** Cargo boxes to the warehouse. The tanker lorry to the power station and the pump on the day the
    tanker calls.
  - **A taxi** at terminal A. The water lorry and the postman's Super Cub on their rounds.

## Order of work, with a quality gate at the end of each

| Phase | Work | Gate: it is done when |
|---|---|---|
| 0 | Agree this plan and its open questions (below). | — |
| 1 | `road-network.js`: lanes, junctions, drive-on-left. Harbour Road built and the coastal road joined. The two existing ferry vehicles move onto the network. | Every lane is on drivable ground, never inside a collider. Gradient ≤ 8 %, bends at least the 30 km/h radius. A zebra wherever a footpath crosses. Vehicles never overlap each other or a person. |
| 2 | Kitano Bridge and the causeway. | Walkable and drivable end to end with no gaps. The parapet is solid. Boats pass under the navigation span. Piers stand in the water, with no part over land or floating. |
| 3 | Kitano Port: RoPax berth and linkspan, cargo quay and yard, oil jetty and tank farm. The car ferry, docklands cargo and oil jetty are removed from town; the passenger ferry stays. | A ferry call lands cars that drive to town. The tanker call runs at the new jetty. The tank farm is fenced off from passengers. Old saved games still load (old site ids are aliases). |
| 4 | Traffic life: the bus as a real service, lorries, taxi, ferry traffic, timetables. | 24 hours in fast time: nobody stuck, nobody vanishing in view, no vehicle in a wall. iPhone frame-time budget held. |
| 5 | Port Control in the harbour office: the control room, the radio and the berth board. | Each call at Kitano shows on the board and is heard on the radio. The harbour master's day includes it. |
| 6 | Tidy: the map, the town book, the directory text ("Take the bus or drive to the airport"), docs, the English check. | Full suite green, plus a walk-through of the published build on an iPhone, saved game included. |

## Quality control, applied at every gate

**Game quality (Nintendo standard):**
- **Reachability:** everything you can see, you can get to; every door, seat and prompt works.
- **No visual faults:** nothing clips, floats, sinks or overlaps.
- **Readable at a glance:** one clear silhouette per thing, and no visual noise (CLAUDE.md design principles).
- **Proof:** screenshots from the player's eye, day and night, before each gate closes, and a saved-game restart check.
- **Performance budgets:**
  - draw calls and triangles per district are tested, as the quarter's are;
  - vehicles are instanced;
  - the network only simulates near the player and on the timetable elsewhere.

**Architectural and engineering quality:**
- **Roads:** to the Road Structure Ordinance and the signs and markings order (`road-standards.js`, `PUBLIC-REALM-AUDIT.md`):
  lane and footway widths, white paint, stop control, tactile paving at the ferry and bus edges.
- **The bridge,** modelled on the Okinawan island bridges and causeways:
  - abutments, piers with scour protection, girders, expansion joints, parapets and lamps;
  - the navigation clearance stated and tested.
- **The RoPax berth:**
  - a linkspan that meets the stern ramp at deck height;
  - marshalling lanes sized for the ferry's load;
  - foot passengers kept apart from vehicles by a covered walkway.
- **The oil terminal:**
  - a bund wall round the tanks (holding the largest tank, plus margin);
  - the jetty and tank farm set well apart from passengers and the runway approach (scaled);
  - fire hydrants, a fenced gate and no public access.
- **Scale:** the world is compressed (the runway is 100 m), so every new piece keeps the same compression as the airport,
  and the bridge and berths are sized against the ship and vehicle models already in the game.

## Open questions

1. **The bridge landing:** the south-east corner (recommended) or the short crossing at z ≈ -1 through the east beach?
2. **Ferry names:** does the passenger ferry keep "Harbour Line"? Should the car ferry get its own name and timetable,
   say twice a day to the main island?
3. **Driving:** may the player drive (a kei truck, Thuan's bicycle on the road, a hired scooter), or only ride the bus
   and watch the traffic?
4. **The west quay:** fishing boats and the auction back, or a small marina for visitors?
