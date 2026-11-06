# The Minato–Kitano-jima ferry: a shipbuilder's audit

> **Read with `docs/FERRY-AUDIT.md`** (the plan another session built the Minato Maru from, 22 m, on 2026-10-10). This
> audit looked at the older 15 m launch. The creator's decisions of 2026-10-11 (bigger ship and harbour, the name Minato
> Maru, real-time crossings with a doze option, the bridge and engine room open to walk in) are recorded at the top of
> that file; this file supplies the bigger ship's particulars, electrics, crew additions and batch plan.


Written 2026-10-10 for NEXT.md §1, as a 1990s Japanese ship-construction engineer would audit a small island car-and-passenger
ferry (フェリー) built to JG / NK rules. Read only: no code was changed. The evidence is the World code, measurements taken
in the running game (the `johansson-town-audit` MCP server and a Playwright run of the same build), and ten small
screenshots kept outside the repo in `/tmp/claude-0/ferry-audit/` (listed at the end).

**In short.** The ferry in World is a 15 × 4.4 m launch with a box on it: a 1.05 m-tall wheelhouse nobody fits in,
one car on an open deck, no interior, no crew, no machinery, no mooring lines, no lights at night. In play it never keeps
its timetable, it backs off the berth at 17 knots and spins 90° in under half a second, and the island's cargo ship sits
inside it twice a day. The right ship for this route is a **199-ton class island car ferry of about 34.5 m** (10 cars,
100 passengers, crew of 8), the size that served 15–30 minute crossings in Okinawa in the 1990s. It does not fit the
harbour as built (31 m from the quay to the breakwater), so the port has to change first: **move the breakwater 23 m
seaward and extend the outer pier to 38 m**. The work is planned below in thirteen one-kind batches.

---

## 1. Findings

Severity: **S1** breaks the illusion or play; **S2** clearly wrong; **S3** polish. Line numbers are as of today's branch.

| # | Sev | Finding | Where | Evidence |
|---|---|---|---|---|
| 1 | S1 | **A launch, not a car ferry.** Hull 15.0 × 4.4 m, 0.6 m draft, deck 1.13 m above the water; one car. The wheelhouse is a box 3.0 × 2.2 × **1.05 m** high: a 1.6 m resident cannot stand in it. | `src/world/ferry.js:13` (FERRY), `:129` (bridge box); `src/world/airport-ferry.js:7` | Measured hull box x −8.65…−4.25, z −65.5…−50.5, y −1.16…0.53; shots 02, 04 |
| 2 | S1 | **Nothing inside and no way in.** The cabin is a sealed box: no doors, stairs or rooms. Boarding is a menu that teleports you onto the open car deck beside the car (local 1.3, 1.01, 0.2), where you ride frozen while the HUD says "PASSENGER DECK". | `ferry.js:126–128`; `src/island/play.js:17` (standOnFerry), `:37` (menu: "share the open deck"); `src/game.js:714` (speed 0), `:990` | Shots 06, 07 |
| 3 | S1 | **No crew.** The ship berths, loads and sails itself. Ms Uezu ("deckhand on the ferry, a week on and a week off") and Ms Ganaha ("sells tickets at the Port Terminal window") exist only as words; the ticket windows are unstaffed. | `src/people/island-households.js:34`, `:39`; `src/world/interiors/port-hall.js` (no clerk) | Resident list in the audit state at 08:00 |
| 4 | S1 | **The crossing moves like a toy.** It backs 15 m off the berth reaching ~9 m/s (17 kn astern), spins 90° in ~0.4 s (236°/s), runs the 261 m route at up to 26 m/s (51 kn), and on leaving Kitano-jima snaps round in a single step (≈4,600°/s). At sea the hull is held dead level: no roll, pitch, wake or bow wave. | `airport-ferry.js:20–29` (the `u<.08`, `u<.1`, `u>.9` blends); `ferry.js:226–229` (rotation set to `(0,yaw,0)`) | `airportFerryPose` sampled 3,600 steps per crossing; shot 07 |
| 5 | S1 | **The island cargo ship sits inside the ferry.** During its calls (07:30–08:40, 15:00–16:30) its bow is 1.15 m inside the ferry's port side. It arrives and leaves *sideways* straight through the breakwater (at 07:20 the beacon tower stands in its deck), and alongside it floats 3.5 m off the quay, held by a rope across the gap. | `src/world/cargo-shipping.js:15–16` (hull along x), `:23` (the rope), `:26` (position −20.5, −56−distance, no yaw); its own comment at `:10` promises it "never blocks ferry/pier walking" | Box intersection measured at 08:00; shots 03, 06, 09, 10 |
| 6 | S1 | **The timetable is dead in play.** Island play parks the ferry "on request" (`parkAt` → `localService`), so the three daily sailings never happen. Commuters and Vy walk to the gangway and vanish while the ship stays put; the horn never sounds. | `play.js:13`; `ferry.js:209–213`, `:244`; `src/people/schedules.js:362–376`; `src/people/neighbours.js:95–98`; `src/audio/town-audio.js:132–137` | Phase is only ever `waiting` or `crossing` |
| 7 | S2 | **Not moored.** No lines, no fenders on the berth face, no bollard used. The quay's bollards stand on the coping at x ±5, ±10, ±15; the tyres on the quay wall are for small boats. A real ship would drift off. | `harbour.js:273`, `:304`; `ferry.js` (none) | Shots 01–05 |
| 8 | S2 | **The ramp hangs from two chains attached to nothing** (they stick up into the air when it is down). Its slope is 13.7° (cars ground beyond about 1 in 8, 7°), and its corner lands against the quay bollard at (−5, −49.3). | `ferry.js:143–150`; `harbour.js:273` | Shot 05 |
| 9 | S2 | **Hull form and markings.** An extruded plan with vertical sides and a flat bottom: no sheer, flare, bilge, skeg, rudders, propellers, thruster tunnel, anchors, hawse pipes, bitts or fairleads. No name, port of registry, draft marks or load line; one bucket-shaped funnel. | `ferry.js:108–118`, `:133–135` | Shots 02, 04, 07 |
| 10 | S2 | **Car deck.** One lane whose lines are 1.1 m apart (a kei car is 1.48 m wide); no lashing points, scuppers, freeing ports, ventilation, wheel chocks or walkway separating people from cars. One car per crossing. | `ferry.js:123–125`; `src/world/town-traffic.js:12–16`, `:67–79` | Shot 05 |
| 11 | S2 | **Passengers have nothing**: no seats, carpet room, toilets, purser's window, vending, open deck, life-jacket lockers, liferafts, rescue boat or muster signs; two lifebuoys only. | `ferry.js:138–141` | — |
| 12 | S2 | **No machinery and no ship sound.** The "engine" loop plays at a fixed point at the Port Building (x 6, z −42), not on the ship. No exhaust, no generator hum. | `town-audio.js:158` | — |
| 13 | S2 | **Dark at night.** No navigation lights; the cabin windows light only in the dead timetable mode, so in play the ferry crosses unlit. | `ferry.js:160`, `:263`, `:282` | — |
| 14 | S2 | **Gangway**: a 1.6 m plank whose foot floats ~0.13 m above the pier deck. | `ferry.js:153–158` | Measured: plank bottom y 0.23, pier 0.098 |
| 15 | S2 | **Passengers and drivers ride on the car deck.** The hall text says drivers "stay aboard for the crossing" in their cars. The ship's safety rules (運航管理規程) send everyone up to the cabin and shut the car deck at sea. | `port-hall.js:70`; `play.js:37` | — |
| 16 | S2 | **Boarding during a car errand leaves you on the pier without a word.** At 12:00 the crossing sat at 0 % for 20 s while Tetsuo's kei truck drove round Main Street to the ramp. | `play.js` tick (`loading`); `town-traffic.js:125` (`prepareCrossing`) | Measured in the Playwright run |
| 17 | S2 | **The timetables disagree.** The pier poster and the departures board say "on request", the izakaya phone reads three sailings (08:30, 14:30, 22:00), the boarding menu says "open all day", and Vy waits for a "school bus" on the pier. | `src/world/port-building.js:127`; `port-hall.js:83–86`; `src/people/commuter-schedule.js:53–98`; `src/people/izakaya-play.js:18`; `neighbours.js:97` | — |
| 18 | S2 | **The harbour cannot take a real car ferry.** The basin is 31 m from the quay face (z −49.65) to the breakwater (z −83); the outer pier is 15.3 m long. | `src/world/harbour.js:325`; `src/world/layout.js:27–29` | Shot 09 |
| 19 | S2 | **Kitano-jima's berth is a 7.2 × 6 m concrete box**: no fenders, bollards, shelter or ticket check. | `src/world/airport-island.js:27` | Shot 08 |
| 20 | S2 | The island's power house is described at "6,600 volts and **50 cycles**". Okinawa is 60 Hz, and so must be the ferry's shore power. | `src/world/school.js:348` | — |
| 21 | S3 | **Whistle.** 110 and 139 Hz is a 200 m ship's whistle; a ship under 75 m sounds 250–700 Hz (COLREGs Annex III). "Two blasts leaving, one arriving" is not a signal (see §7). | `town-audio.js:106–110` | — |
| 22 | S3 | The spawn subtitle ("The end of the pier · the lighthouse, and the open sea") stays up through the whole crossing. | — | Shots 06–08 |
| 23 | S3 | **One ship, two sets of numbers** (FERRY and AIRPORT_FERRY; FERRY_BERTH and AIRPORT_FERRY_PORTS.town.berth) and two boarding prompts (canopy and pier landing). | `ferry.js:13–22`, `:300`; `airport-ferry.js:7–11`, `:32–35` | — |
| 24 | S3 | **Tests guard the wrong mode.** `ferry.test.mjs` checks the dead timetable mode for spins; nothing checks the crossing used in play, and nothing checks the cargo ship against the ferry. | `tests/ferry.test.mjs:36–45`; `tests/airport-ferry.test.mjs`; `tests/fujita-houseboat.test.mjs:31` | — |
| 25 | S3 | **37 separate meshes** (37 draw calls, 9 materials, 1,048 triangles) for a box ship: cheap in triangles, dear in draws; not built with the kit that merges by material. | `ferry.js:92–162` | Measured in the scene |
| 26 | S3 | No name ("Minato–Kitano-jima shared ferry"), no ensign at the stern, no company flag. | `ferry.js:93` | — |

What it does right, and should keep: the 1990s white-and-blue livery with a red boot-topping; the bow ramp landing on the
quay; **cars reversing aboard** so they drive off forwards at the other end (exactly what bow-ramp-only ferries do); the
real-clock arrival and departure times in `FERRY_TIMES`; the berth on the pier's west flank with the queue on the pier.

---

## 2. The target ship

### 2.1 Why this size

- **The route.** 18 minutes between a harbour town and an airport islet: a short sheltered crossing. In 1990s Japan,
  Okinawa included, crossings like this were worked by **199-ton class** car ferries of 30–40 m. The larger 40–60 m
  ferries of 400–700 tons worked the longer routes out of Naha with 300 or more passengers; on this route one would sail
  two-thirds empty and could not turn in the harbour.
- **The port.** A 34.5 m ship needs a 38 m berth and a 40 m turning circle; that is the smallest change to Minato that
  works (§6). A 40–60 m ship would need the harbour rebuilt.
- **The phone.** Two-thirds of the triangles of a 50 m ship, with every space the creator asked for.
- **The era.** Built 1994 (平成6年), refitted for GMDSS in 1998: the town's ferry when the onsen's massage chair was new.

### 2.2 Particulars

| | |
|---|---|
| Name | **フェリーみなと (Ferry Minato)**, port of registry 港町 (Minato), owned and run by Minato-chō (町営) |
| Type | Passenger ship and vehicle ferry (旅客船兼自動車渡船), bow ramp, twin screw |
| Built | 1994 at a small Seto Inland Sea yard; GMDSS refit 1998 |
| Rules | Ship Safety Act (船舶安全法) and its regulations; inspected by the Okinawa General Bureau's transport department (沖縄総合事務局運輸部); classed with NK (NS\*, MNS\*) at the insurer's request |
| Navigation area | Limited coastal (限定沿海) |
| Length overall / between perpendiculars | 34.50 m / 31.00 m |
| Breadth (moulded) | 8.40 m |
| Depth to the car deck | 3.00 m |
| Draft | 1.90 m full load, 1.70 m in service |
| Freeboard | 1.10 m at full load (car deck 1.1 m above the water) |
| Displacement | 283 t at 1.90 m (Cb 0.56); lightship 210 t; deadweight 73 t |
| Gross tonnage | **199** (Japanese domestic measure; about 270 by the international convention) |
| Vehicles | **10 cars**, or 2 trucks of 8 t + 5 cars; 12 kei trucks. Clear height 4.2 m (trucks to 3.8 m). Axle 5 t |
| Passengers | **100**: 36 carpet room, 42 seats, 22 open-deck benches |
| Crew | 8 |
| Main engines | 2 × 460 kW (625 PS) at 1,350 rpm |
| Speed | 11.5 kn in service at 85 % MCR, 12.8 kn on trials |
| Fuel / fresh water | A-heavy oil (A重油) 15 m³ (16 days) / 12 m³ |
| Colours | White superstructure; hull white over red-brown antifouling with a **teal** sheer band, the ferry company's colour already on the Port Building (`port-building.js`, TEAL 0x2f5f6a); teal funnels with the town's anchor mark |

Heights above the keel (and above the water at 1.90 m draft; in World at sea level −0.56 add −2.46):
car deck 3.0 (1.1), passenger deck 7.4 (5.5), bridge deck 10.0 (8.1), compass deck 12.4 (10.5), funnel tops 12.0 (10.1),
masthead light 15.0 (13.1), mast top 17.0 (15.1). The bridge eye (11.6) sees over the raised ramp to the water 15 m
ahead of the bow.

### 2.3 What the brief missed (the auditor's additions)

Watertight bulkheads and the stability booklet (a truck on one side heels her 3°, which is why the chief officer has a
loading plan); the load line and draft marks; anchors, cables and windlass; emergency steering; the bow thruster and the
rule that it may only start with two generators on the board; the preference trip (優先遮断) that sheds the air
conditioning before a generator overloads; the reverse-power relay; the emergency generator and the 24 V batteries;
shore power at night; fixed CO₂, fire detection and the steel insulation round the engine room; quick-closing fuel valves
and fan stops; the bilge holding tank and oily-water separator (the 1990s marine pollution law); sewage holding; car-deck
drainage and fume ventilation; lashing points; the "ramp closed and locked" lamp on the bridge (required after the
*Herald of Free Enterprise* capsized with her bow doors open in 1987); the GMDSS change-over Japan completed in 1999;
navigation lights and a whistle of the right pitch; the capacity sign and the ship's certificate in the lobby; monthly
drills (操練); the night watch (停泊当直); bunkering and fresh water; the yearly dry-docking in Naha with a relief boat; the
operator's safety rules (運航管理規程) with their weather limits; no passengers on the car deck at sea; mooring lines and
fenders; and the kiosk's supply chain.

### 2.4 Profile

```
 m above keel                                             (bow →)
 17 |                                 | mast
 15 |                                 * masthead light
 12 |     ## ##  twin funnels    +----+--------+  compass deck 12.4
 10 |   +-------------------------+ WHEELHOUSE +==wing
    |   | EG CO2|cab|cab|mess|CE M|            |
7.4 |===+-------+---+---+----+----+------------+ passenger deck
    |open| lobby |WC| carpet room |   seats   |
3.0 |====+=======+==+=============+===========+=====================+ car deck
    |moor|  casings P & S: ER entry, stairs, stores     open car deck  \ ramp
1.9 |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ waterline
0.9 | SG |FW| ENGINE ROOM  |  tanks, voids, sewage holding  |BT |FP  /
  0 +====+==+==============+================================+===+===/
    0   2.6  5            14                              27.5 30.5 34.5  m from the transom
```

### 2.5 General arrangement, deck by deck

Positions are metres from the transom (z) and across the ship (P port, S starboard). Every space below has a purpose
and two ways out; that is what the data and tests in batch 2 should hold it to.

**Below the car deck** (tank top 0.7 m, floor plates 0.9 m)

| Space | z | Size L × B × H | What is in it | Why |
|---|---|---|---|---|
| Aft peak tank | 0–2.6 | below 1.0 m | 4 m³ ballast | Trim |
| **Steering-gear room** (操舵機室) | 0.3–2.6 | 2.3 × 7.0 × 2.0 | Two rudder stocks, rams and tie bar; two hydraulic power units (2.2 kW); emergency hand pump; rudder-angle transmitter; stern-tube oil header tanks; the **emergency fire pump** (5.5 kW) with its own sea suction; sound-powered phone; emergency steering notice | Steering; a fire pump outside the engine room |
| Aft tanks | 2.6–5.0 | 2 × (2.4 × 1.8 × 1.5) | Fresh-water tanks P and S, 6 m³ each; stern tubes between them | Water |
| **Engine room** (機関室) | 5.0–14.0 | 9.0 × 8.2 × 1.9 clear | Main engines P and S with gearboxes and shafts; generators P and S forward; the **engine control booth** (2.4 × 2.0, soundproofed) with the main switchboard and engine panel; fire and general-service pumps, bilge pump, hydrophore set, sanitary pump, fuel transfer pump and purifier, starting-air compressor and two 150 L air bottles, oily-water separator, fuel service tank (1.5 m³), workbench and spares; CO₂ nozzles overhead; main stair (P) and escape trunk (S) | Propulsion and power. Low: tall men duck under the pipes |
| Double bottom under the ER | 5.0–14.0 | 0.7 high | Fuel storage P and S (7.5 m³ each), bilge holding 1 m³, sludge 0.3 m³, lube oil 0.6 m³ | Fuel for 16 days |
| Tanks and voids | 14.0–27.5 | — | Sewage holding 4 m³, ballast P and S (8 m³ each), voids | Trim and heel |
| **Bow-thruster room** | 27.5–30.5 | 3.0 × 5.5 × 2.2 | 75 kW motor on a 0.9 m tunnel, starter cabinet; hatch in the P bow house | Berthing |
| Fore peak and chain lockers | 30.5–34.5 | — | 6 m³ ballast; two chain lockers under the windlasses | Trim, anchors |

**Car deck** (上甲板, 3.0 m, 1.1 m above the water; covered by the passenger deck from z 0 to 23, open to the sky forward)

| Space | z | Size | What is in it | Why |
|---|---|---|---|---|
| Aft mooring station | 0–2.5 | 2.5 × 8.2 | Capstan (5.5 kW), two bitts, fairleads, steering-gear hatch | Stern lines |
| **Vehicle lanes** | 3.0–30.0, ramp opening to 33.0 | 2 lanes × 3.1 m | Yellow lane lines and numbers; 48 cloverleaf lashing sockets on a 1.25 × 2.5 m grid; wheel-chock racks; six scuppers a side with flaps and freeing ports forward; waterproof tube lights; two exhaust fans; four hydrants; powder extinguishers; signs: エンジン停止, 航行中車両甲板立入禁止 | 10 cars. Trucks go on the centreline forward (the loading plan) |
| **Casing P** | 3–20 | 17 × 1.0 × 4.2 | Engine uptake and ER supply-fan trunk (3–6); ER entrance and stair (6–8); **changing room** (更衣室, 8–10: lockers, washbasin, boots, overalls); passenger stair P (10–13.5); fan and hydrant | |
| **Casing S** | 3–20 | 17 × 1.0 × 4.2 | Uptake trunk (3–6); ER escape trunk (6–7); bosun's store (7–10: lashings, chocks, ropes, fenders); passenger stair S (10–13.5); **gangway door** and shore-power box (13.5–15); fan and hydrant | |
| **Walkway** | 10–15, beside casing S | 0.9 m, railed, hatched | From the gangway door to the foot of stair S | Foot passengers never cross a lane |
| Bow houses P and S | 30–34 | 2 × (4.0 × 1.9) | P: windlass, **ramp power pack**, thruster hatch. S: windlass, **paint store** | Anchors, ramp, paint away from the cabins |
| **Bow ramp** | hinge at 33.0 | 6.0 (4.0 + 2.0 flap) × 4.4 clear | Two 100 mm hydraulic cylinders at 14 MPa; two locking pins with limit switches to the bridge lamp; hand pump for emergencies | Lowered: 5° to the quay. Raised: closes the bow, 4 m high |

**Passenger deck** (旅客甲板, 7.4 m, 5.5 m above the water): deckhouse z 6–23 × 7.2 m with 0.5 m side walkways; open deck aft

| Space | z | Size | What is in it | Why |
|---|---|---|---|---|
| **Open deck** (遊歩甲板) | 0–6 | 6 × 8.2 | Benches for 22 under an awning; one liferaft (P aft); the rescue boat and davit (S aft); stern flagstaff (the national flag in port); two lifebuoys; muster station B sign | Fresh air, the view, embarkation |
| **Lobby** | 6.0–9.5 | 3.5 × 7.2 | Stair heads P and S; **purser's window** (S: ticket rack, cash box, punch, PA microphone, first-aid kit, lost property); **kiosk** (P counter); **vending corner** (two drink machines, a hot-water dispenser for cup noodles); timetable and fare boards; capacity sign (旅客100名 船員8名 計108名) and the ship's certificate; a 1994 ashtray stand by the aft door; the funnel casings in the aft corners; the crew-only door (関係者以外立入禁止) to the bridge-deck stair | Tickets, snacks |
| Toilets | 9.5–11.5 | 2 × (2.0 × 3.6) | Men's (P: one WC, two urinals, basin); women's (S: two WC, basin); sea-water flushing | |
| **Carpet room** (カーペット席) | 11.5–16.5 | 5.0 × 7.2, raised 0.3 m | Carpet, a cushion rack and blankets, shoe shelf at the step, a television on a bracket, life-jacket lockers; 36 places | Lie down for 18 minutes, as everyone does |
| **Seated saloon** (椅子席) | 16.5–23.0 | 6.5 × 7.2 | 42 moquette seats (7 rows of 3 + 3 at 0.85 m), windows forward over the car deck and the sea, life-jacket lockers, muster station A sign | |
| Side walkways | 6–23 | 0.5 m a side | Rails, liferafts (two P, two S), hydrants; escape routes | Crew and escape |

**Bridge deck** (航海船橋甲板, 10.0 m, 8.1 m above the water): deckhouse z 6–23 × 6.0 m, with a 0.9 m corridor down the
middle and a crew stair to the lobby

| Space | z | Size | What is in it |
|---|---|---|---|
| **Emergency-generator room** | 6.0–9.0 P | 3.0 × 2.55 | 40 kVA emergency generator, emergency switchboard, 24 V batteries and chargers, 60 L day tank, louvres; door to the open deck only |
| **CO₂ room** (fire control station) | 6.0–9.0 S | 3.0 × 2.55 | Four 45 kg CO₂ bottles, the release cabinet, remote fan stops and fuel quick-closing valves; door to the open deck only |
| Crew cabin (two berths) | 9.0–11.5 P | 2.5 × 2.55 | Bosun and oiler: bunk beds, lockers, a fold-down desk |
| Chief officer's cabin | 9.0–11.5 S | 2.5 × 2.55 | |
| Deckhand's cabin | 11.5–14.0 P | 2.5 × 2.55 | Ms Uezu, on her weeks |
| Crew WC and shower | 11.5–14.0 S | 2.5 × 2.55 | |
| **Mess room** (食堂) | 14.0–16.5 P | 2.5 × 2.55 | Table for six, television, kettle, the duty board (当直表) and muster list (部署配置表) |
| **Galley** (調理室) | 14.0–16.5 S | 2.5 × 2.55 | Three-plate range, rice cooker, fridge-freezer, sink, hood, provision locker, a hatch to the mess |
| Chief engineer's cabin | 16.5–19.5 P | 3.0 × 2.55 | |
| Master's cabin | 16.5–19.5 S | 3.0 × 2.55 | Desk, bunk, the ship's papers and safe |
| **Wheelhouse** (操舵室) | 19.5–23.0 | 3.5 × 6.0, wings to the ship's sides | Steering stand (wheel, non-follow-up lever, autopilot); two engine levers and the thruster lever at the centre and on both wing consoles; radar; magnetic compass periscope; VHF with DSC; ship's telephone (船舶電話); NAVTEX printer; echo sounder with its paper roll; GPS display (1996); chart table with drawers and a red lamp (paper charts, no ECDIS); navigation-light panel; fire panel; PA and general alarm; ramp lamps; whistle button; searchlight control; wipers; clock, barometer, inclinometer; log desk; the master's high chair |

**Compass deck and mast** (12.4 m): standard magnetic compass, radar scanner on the mast platform, masthead light at
15.0 m, all-round lights, the whistle, VHF and GPS antennas, the searchlight, a float-free EPIRB on the starboard wing,
the company flag. Sidelights on the wing ends; sternlight on the open-deck rail. Twin funnels at the lobby's aft corners
rise to 12.0 m.

---

## 3. Machinery and systems

### 3.1 Propulsion and steering

| Item | Rating | Notes |
|---|---|---|
| **Main engines** (主機) ×2 | 460 kW (625 PS) at 1,350 rpm each | Four-stroke six-cylinder, 160 × 200 mm, 24 L, turbocharged and intercooled, 17 bar mean effective pressure, ~3.0 t. Engine-driven lube-oil, jacket-water and sea-water pumps; fresh water cooled through a plate cooler. Air start at 2.94 MPa (30 kgf/cm²). A-heavy oil at 210 g/kWh. Firing note 67.5 Hz at full speed, 27.5 Hz at idle |
| **Reverse-reduction gears** ×2 | 3.0 : 1 | Hydraulic multi-disc ahead/astern clutches; bridge control from the wheelhouse and both wings, emergency control in the engine room |
| Shafts ×2 | 110 mm | Oil-lubricated stern tubes with lip seals; header tanks in the steering-gear room |
| **Propellers** ×2 | Fixed pitch, 4 blades, 1.45 m, P/D 0.80, 450 rpm | Aluminium bronze, outward turning. Fixed pitch because the gears reverse: the small-ferry choice of the period |
| Rudders ×2 | 0.75 m² each, ±35° | Behind each propeller |
| **Steering gear** | 2 × 2.2 kW electro-hydraulic units | One at sea, both in narrow water; 35° to 30° the other side in under 28 s; No.2 fed from the emergency board; hand pump and a phone to the bridge |
| **Bow thruster** | 75 kW, ~10 kN | Star-delta start; may start only with two generators on the board |
| Fuel at sea | ~46 L per crossing; ~920 L a day | 16 crossings and the generators; bunkered Monday and Thursday mornings |

### 3.2 Power

| Item | Rating | Notes |
|---|---|---|
| **Diesel generators** ×2 | 125 kVA (100 kW at 0.8 pf), 445 V, 3φ, **60 Hz**, 1,800 rpm, 162 A | Six-cylinder, brushless, AVR. Air circuit breakers 200 A frame set at 170 A; over-current, short-time, under-voltage and **reverse-power** (≈10 %) trips |
| **Emergency generator** | 40 kVA, 445 V, 60 Hz | Air-cooled, battery start, on the board within 45 s of a blackout; 60 L day tank (≈15 h at the emergency load) |
| Batteries | 24 V lead-acid | Starting bank and a radio/emergency bank: transitional emergency lights for 30 min, radios, alarms |
| **Shore power** (陸電) | 3φ 200 V 60 Hz from the quay kiosk, 50 kVA 200/440 V transformer ashore | Ship's shore box in casing S with a phase-sequence lamp and a 75 A breaker, interlocked so shore and generators never run together. Night load 10 kW |
| Transformers | 2 × 30 kVA 440/105 V (one in use); 5 kVA 440/105 V for the emergency board | Lighting and sockets at **100 V** (105 V at the transformer) |
| **Main switchboard** (主配電盤) | 440 V 3φ 3-wire, insulated from earth | Panels: DG1, synchronising (synchroscope, lamps, two kW meters, Hz, V, A, **three earth lamps** and an insulation meter), DG2, two 440 V feeder panels, shore. Preference trip: stage 1 sheds the saloon air conditioning, kiosk and vending; stage 2 the galley and water heater |
| Emergency switchboard | 440 V and 105 V sections | Fed through a bus-tie from the main board; from the emergency generator when the main board is dead |

### 3.3 Systems

| System | Equipment | Purpose and numbers |
|---|---|---|
| Fuel (燃料油) | Storage P/S 7.5 m³; transfer pump 1.5 kW; purifier 1.5 kW; service tank 1.5 m³; duplex filters; quick-closing valves worked from the CO₂ room | 16 days of A-oil. Bunkered from the town's tank lorry (Mr Shimabukuro, who already fetches the power house's diesel from the oil jetty) |
| Lube oil | Engine sumps; 0.6 m³ storage; two 0.75 kW priming pumps | Prime before the first start |
| Cooling | Engine-driven sea-water and jacket pumps; sea chests P and S with strainers | A plastic bag in a strainer is the classic overheating story |
| **Bilge** | Main 65 mm (rule: 25 + 1.68√(L(B+D)) = 57 mm); bilge pump 3.7 kW, 25 m³/h; both fire pumps can pump bilges; bilge holding 1 m³ and a 0.25 m³/h oily-water separator | |
| Ballast | Fore peak 6 m³, aft peak 4 m³, P/S 8 m³; the general-service pump | Trim with trucks forward; heel |
| **Fire main** | Two fire and general-service pumps, 11 kW star-delta, 40 m³/h at 0.5 MPa; emergency fire pump 5.5 kW, 20 m³/h; 65 mm main; hydrants: car deck 4, passenger deck 2, bridge deck 1, engine room 1; 15 m hoses with 12 mm jet/spray nozzles | 0.3 MPa at the furthest hydrant |
| **Fixed CO₂** | Four 45 kg bottles (180 kg) for the engine room and its casings | 40 % of ~190 m³ gross at 0.56 m³/kg = 136 kg needed. Two-action release, siren and lamp in the ER, fans and fuel stopped first |
| **Fire detection** | ~30 smoke and heat heads in six zones, manual call points, panel on the bridge (24 V) | |
| **Fresh water** | 2 × 6 m³; hydrophore with a 0.75 kW pump and a 300 L pressure tank (cut in 0.25, out 0.35 MPa) | 1.5 m³ a day; filled every fifth morning from Mr Chinen's water lorry |
| Sanitary and **sewage** | Sea-water flushing pump 1.5 kW; 4 m³ holding tank; 1.5 kW discharge pump | Pumped out ashore after the last boat |
| Ventilation and air conditioning | ER supply fans 2 × 3.7 kW (exhaust up the funnels); car-deck exhaust fans 2 × 2.2 kW; two sea-water-cooled package air conditioners for the saloon (7.5 kW each, ~22 kW of cooling); four 100 V room units for the bridge, mess and cabins | Okinawa: the saloon at 26 °C with 100 people aboard |
| Galley | Electric range 6 kW; 100 V rice cooker, microwave, pot, fridge-freezer, hood | Crew meals and the kiosk's hot water |
| **Ramp hydraulics** | Power pack with 2 × 5.5 kW pumps (one standby), 14 MPa, 60 s up, 45 s down; hand pump | |
| Anchors and mooring | Two 480 kg stockless anchors, 2 × 137.5 m of 19 mm grade-2 chain (equipment number ≈150); windlass 7.5 kW with warping heads; aft capstan 5.5 kW; six 40 m vinylon mooring lines | |
| Lights | Fluorescent tubes at 100 V inside, waterproof fittings on the car deck, 4 × 500 W floodlights for night loading, 1 kW searchlight | |
| Navigation lights | Masthead (225°, 5 nm), sidelights (112.5°, 2 nm), sternlight (135°, 2 nm), all-round anchor and not-under-command lights; 60 W each; panel with failure alarms; 24 V back-up | COLREGs Rule 22 (ranges for a ship of 12–50 m) and Annex I (masthead at least 6 m, and one breadth, above the hull) |
| **Bridge and radio** | X-band radar (24 nm); magnetic standard compass (no gyro: none required at this size, and it would need four hours to settle before the 06:40); autopilot on a fluxgate sensor; echo sounder; GPS; VHF with DSC; 406 MHz EPIRB; one SART; three portable two-way VHFs; NAVTEX (the Naha station); ship's telephone; PA and general alarm; air whistle | GMDSS from the 1998 refit |

### 3.4 Electric load analysis (電力調査表)

Five conditions, each the evening worst case for lighting. Values in kW drawn in that condition (rating × use factor);
current is per unit at full load at its own voltage (440 V 3φ motors at their size's efficiency and power factor; 105 V
single-phase groups). MSB main switchboard, LB 105 V lighting board, ESB emergency switchboard.

| Consumer | Where | Board | Supply | No. × kW | A at full load | Sea | Arr./dep. | Loading | Night (shore) | Blackout | Note |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Steering gear pump No.1 | steering gear room | MSB | 440 V 3φ | 2.2 | 4.0 | 1.8 | 2.0 | 0.7 | – | – |  |
| Steering gear pump No.2 | steering gear room | ESB | 440 V 3φ | 2.2 | 4.0 | – | 2.0 | – | – | 2.0 | both run in narrow water |
| Fire & general-service pump No.1 (Y-Δ) | engine room | MSB | 440 V 3φ | 11 | 19.1 | – | – | – | – | – | deck wash, ballast; fire |
| Fire & bilge pump No.2 (Y-Δ) | engine room | MSB | 440 V 3φ | 11 | 19.1 | – | – | – | – | – | fire; bilge |
| Bilge pump | engine room | MSB | 440 V 3φ | 3.7 | 6.8 | 0.4 | – | – | – | – | once a watch |
| Emergency fire pump | steering gear room | ESB | 440 V 3φ | 5.5 | 10.1 | – | – | – | – | 5.0 | fire with the main board dead |
| Engine-room supply fans | casings | MSB | 440 V 3φ | 2 × 3.7 | 6.8 | 6.3 | 6.3 | 6.3 | – | – |  |
| Car-deck exhaust fans | casings | MSB | 440 V 3φ | 2 × 2.2 | 4.0 | – | 3.7 | 3.7 | – | – | cars start their engines |
| Bow thruster (Y-Δ, two-generator interlock) | thruster room | MSB | 440 V 3φ | 75 | 121.6 | – | 60.0 | – | – | – |  |
| Anchor windlass / warping heads | bow houses | MSB | 440 V 3φ | 7.5 | 13.0 | – | 3.0 | – | – | – |  |
| Aft mooring capstan | stern | MSB | 440 V 3φ | 5.5 | 10.1 | – | 2.2 | – | – | – |  |
| Ramp power pack (1 of 2 pumps) | P bow house | MSB | 440 V 3φ | 5.5 | 10.1 | – | – | 4.7 | – | – | 60 s a lift |
| Starting-air compressor | engine room | MSB | 440 V 3φ | 3.7 | 6.8 | 0.7 | 1.9 | 0.7 | – | – |  |
| Fuel transfer pump | engine room | MSB | 440 V 3φ | 1.5 | 3.1 | 0.3 | – | 0.2 | – | – |  |
| Fuel purifier | engine room | MSB | 440 V 3φ | 1.5 | 3.1 | 0.8 | – | 0.3 | – | – |  |
| Main-engine lube-oil priming pumps | engine room | MSB | 440 V 3φ | 2 × 0.75 | 1.5 | – | – | – | – | – | before the first start |
| Fresh-water hydrophore pump | engine room | MSB | 440 V 3φ | 0.75 | 1.5 | 0.2 | 0.2 | 0.2 | 0.2 | – |  |
| Sanitary (sea-water flushing) pump | engine room | MSB | 440 V 3φ | 1.5 | 3.1 | 0.4 | 0.4 | 0.4 | 0.2 | – |  |
| Sewage discharge pump | engine room | MSB | 440 V 3φ | 1.5 | 3.1 | – | – | – | 0.4 | – | ashore after the last boat |
| Oily-water separator | engine room | MSB | 440 V 3φ | 0.4 | 0.8 | 0.2 | – | – | – | – |  |
| Rescue-boat davit winch | open deck | MSB | 440 V 3φ | 3.7 | 6.8 | – | – | – | – | – | drills |
| Saloon package air conditioners | passenger deck | MSB | 440 V 3φ | 2 × 7.5 | 13.0 | 12.8 | 12.8 | 9.0 | – | – | preference trip 1 |
| Galley range | galley | MSB | 440 V 3φ | 6 | 7.9 | 1.8 | – | 3.0 | 1.2 | – | preference trip 2 |
| Water heater 100 L | galley, shower | MSB | 440 V 3φ | 3 | 3.9 | 0.9 | – | 0.9 | 1.5 | – | preference trip 2 |
| 24 V battery chargers | EG room | MSB | 440 V 3φ | 2 × 1.5 | 2.0 | 0.9 | 0.9 | 0.9 | 0.9 | – |  |
| Workshop drill and grinder | engine room | MSB | 440 V 3φ | 2 × 0.4 | 0.8 | – | – | 0.1 | – | – |  |
| Lighting: saloon, carpet room, lobby, toilets, stairs | passenger deck | LB | 105 V | 2.36 | 25.0 | 2.4 | 2.4 | 2.4 | 0.2 | – |  |
| Lighting: car deck | car deck | LB | 105 V | 0.96 | 10.2 | 0.5 | 1.0 | 1.0 | 0.2 | – |  |
| Lighting: engine room, steering gear room | engine room | LB | 105 V | 1.06 | 11.2 | 1.1 | 1.1 | 1.1 | 0.2 | – |  |
| Lighting: bridge, mess, galley, cabins | crew spaces | LB | 105 V | 0.42 | 4.4 | 0.2 | 0.2 | 0.3 | 0.3 | – |  |
| Deck lights and ramp floodlights | outside | LB | 105 V | 2.6 | 27.5 | 0.6 | 2.6 | 2.6 | 0.7 | – | 6 × 100 W + 4 × 500 W |
| Searchlight | compass deck | LB | 105 V | 1 | 9.5 | – | 0.5 | – | – | – |  |
| Bridge electronics (radar, autopilot, echo sounder, GPS, NAVTEX, PA) | wheelhouse | LB | 105 V | 0.75 | 7.9 | 0.8 | 0.8 | 0.4 | 0.1 | – |  |
| Room air conditioners | crew spaces | LB | 105 V | 4 × 1 | 11.2 | 3.0 | 3.0 | 3.0 | 1.5 | – |  |
| Galley appliances (rice cooker, microwave, pot, fridge, hood) | galley | LB | 105 V | 4 | 38.1 | 1.2 | 0.4 | 1.6 | 1.2 | – | preference trip 2 |
| Kiosk (ice-cream freezer, showcase, hot water) | kiosk | LB | 105 V | 1.9 | 18.1 | 1.1 | 0.9 | 1.1 | 0.7 | – | preference trip 1 |
| Drink vending machines | vending corner | LB | 105 V | 2 × 0.6 | 6.7 | 0.7 | 0.7 | 0.7 | 0.7 | – | preference trip 1 |
| Carpet-room television | carpet room | LB | 105 V | 0.08 | 0.8 | 0.1 | 0.1 | 0.1 | – | – |  |
| Toilet exhaust fans | toilets | LB | 105 V | 2 × 0.15 | 1.7 | 0.3 | 0.3 | 0.3 | 0.1 | – |  |
| Emergency lighting (one fitting in four, escapes, muster stations) | everywhere | ESB | 105 V | 1.55 | 16.4 | – | – | – | – | 1.6 | inside the lighting above in normal service |
| Navigation lights (7 × 60 W) | mast, wings, stern | ESB | 105 V | 0.42 | 4.4 | 0.4 | 0.4 | – | – | 0.4 |  |
| Radar and PA on emergency supply | wheelhouse | ESB | 105 V | 0.5 | 5.3 | – | – | – | – | 0.5 | inside bridge electronics normally |
| 24 V emergency charger (radio, fire detection, alarm) | EG room | ESB | 440 V 3φ | 0.5 | 4.8 | – | – | – | – | 0.5 |  |
| **Total** | | | | | | **39.8** | **109.7** | **45.6** | **10.3** | **9.9** | |
| of which on the 105 V board | | | | | | 11.9 | 13.9 | 14.5 | 6.0 | – | |

What the numbers say, and why each rating is what it is:

- **At sea** one generator carries 40 kW (40 %, 64 A). The second rests.
- **Arriving and leaving**: 110 kW. One generator would be at 110 %; two share it at 55 %. Hence the rule the chief
  engineer lives by: *No.2 on the board before the breakwater*, and the thruster interlock that refuses to start
  without it. With one generator, the preference trip sheds 14.4 kW (stage 1: the saloon air conditioning, the kiosk,
  the vending machines) and the saloon gets warm before anything worse happens.
- **Loading alongside**: 46 kW, one generator (the ramp's 5.5 kW pump runs a minute each call).
- **Night alongside on shore power**: 10.3 kW, a quarter of the 50 kVA connection: the fridges, the vending machines,
  the night watch's cabin and a stair light. The generators are stopped, so the ship is quiet at night.
- **Blackout**: the emergency generator picks up 9.9 kW (31 % of 40 kVA): emergency lights, navigation lights, radar and
  PA, the radios and alarms, steering pump No.2 and, if there is a fire, the emergency fire pump. 40 kVA rather than
  25 because the 5.5 kW fire pump starts direct-on-line (66 A against a rated 52 A).
- The 105 V transformer runs at 44–54 %. The thruster draws 122 A at full load; direct-on-line it would draw ~790 A,
  star-delta 264 A, which two 162 A generators can take for the few seconds of a start.
- The main engines' own pumps are engine-driven, so **a blackout does not stop the propellers**: the ship keeps going,
  loses the thruster and steering pump No.1, and steers on No.2 once the emergency generator is on (≤ 45 s).

### 3.5 One-line diagram

```
 SHORE 3φ 200 V 60 Hz ── quay kiosk: 50 kVA 200/440 V ── shore box (phase lamp, 75 A) ──┐  interlock:
                                                                                         │  shore OR generators
 DG1 125 kVA 445 V 60 Hz ── ACB 170 A ──┐                       ┌── ACB 170 A ── DG2 125 kVA 445 V 60 Hz
                                        │                       │
 ═══════════════════════════════════════╧═══ MAIN SWITCHBOARD 440 V 3φ 3W, insulated (earth lamps) ═══╧════════
   │ ESSENTIAL           │ MANOEUVRING          │ HOTEL (preference trip)  │ 2 × 30 kVA 440/105 V │ 2 × charger  │ bus-tie
   │ steering No.1       │ bow thruster 75 kW   │ stage 1: saloon AC ×2,   │        │             │  24 V DC     │
   │ fire & GS No.1, No.2│  (Y-Δ, 2-DG interlock│  kiosk, vending          │ 105 V LIGHTING BOARD │  radio, DSC, │
   │ bilge pump          │ windlass 7.5 kW      │ stage 2: galley range,   │  lights, sockets,    │  fire panel, │
   │ ER fans ×2          │ aft capstan 5.5 kW   │  water heater, galley    │  room ACs, galley,   │  gen. alarm, │
   │ fuel transfer,      │ ramp pack 2 × 5.5 kW │  appliances              │  kiosk, vending,     │  nav-light   │
   │  purifier           │ car-deck fans ×2     │                          │  bridge electronics  │  back-up,    │
   │ compressor, priming │ davit winch          │                          │                      │  transitional│
   │ hydrophore, sanitary│                      │                          │                      │  lights      │
   │ sewage, separator   │                      │                          │                      │              │
                                                                                                                ▼
                                       EMERGENCY SWITCHBOARD 440 V + 105 V (5 kVA 440/105 V)
                                       steering No.2 · emergency fire pump · emergency lights ·
                                       navigation lights · radar, PA · 24 V emergency charger
                                                        ▲
                               EG 40 kVA 445 V 60 Hz: starts on a dead bus, on load within 45 s
```

### 3.6 Built the onsen's way

`src/world/ferry/electrics.js`, in the house style of `onsen-electrics.js`: data first (generators, boards, every load
with its kW, purpose, where, `why` and `period`, the preference-trip stages, the interlocks), state that lives as long as
the page, `assess()` and `advance(seconds)` (overload warms a breaker, the preference trip sheds after 5 s, reverse power
trips a motoring generator, a dead bus starts the emergency generator after 45 s), named scenarios the stories stage
(`sea`, `arrival`, `loading`, `night-shore`, `blackout-at-the-breakwater`, `earth-fault`), and the board's meters, earth
lamps and every room's lights wired to that state. Tests (`tests/ferry-electrics.test.mjs`) hold it to this section: the
totals per condition; one generator at sea, two in harbour; the thruster refused on one generator; the preference trip's
order; the emergency generator on load within 45 s and under 40 kVA; shore power never paralleled; every load with a
purpose and a board; 60 Hz everywhere.

---

## 4. Safety equipment

108 persons aboard at most (100 passengers and 8 crew).

| Item | Number and kind | Where | Notes |
|---|---|---|---|
| **Liferafts** (膨脹式救命いかだ) | 5 × 25-person, throw-overboard, in white canisters on cradles | Three port (one at the open deck's aft rail, two on the side walkway), two starboard (side walkway; the rescue boat has the aft corner) | 125 places for 108 people. Each with a **hydrostatic release unit** (自動離脱装置) that frees it at 2–4 m if the ship sinks, a painter and weak link, and an embarkation ladder. Serviced yearly in Naha |
| **Rescue boat** (救助艇) and davit | 4.0 m rigid boat for 6, 15 PS outboard; single-arm davit with a 3.7 kW winch and hand crank | Open deck, starboard aft | Launched in under 5 minutes. Also the island's only boat with radar and a crew at night |
| **Lifebuoys** (救命浮環) | 8 (four a side); two with self-igniting lights and smoke signals on the bridge wings; two with 27.5 m lines | Rails | Each lettered フェリーみなと / 港町 |
| **Life jackets** (救命胴衣) | 110 adult (solid foam, orange) and 10 children's | Lockers in the saloon, carpet room and lobby; crew's in their cabins | Children's: 10 % of the passengers |
| Pyrotechnics and radio | 4 rocket parachute flares, 6 hand flares, 2 buoyant smoke signals; line-throwing appliance; EPIRB; SART; three portable VHFs | Wheelhouse | |
| **Muster stations** (非常時集合場所) | A: the seated saloon. B: the open deck aft | Green and white signs | General alarm: seven short and one long blast on the whistle and the bells |
| Muster list (部署配置表) | Each crew member's post in fire, abandon ship and man overboard | Wheelhouse, mess, lobby | Monthly drill (操練) in the log |
| **Fire stations** | Hydrants with hose boxes as in §3.3 | Car deck, passenger deck, bridge deck, engine room | |
| Extinguishers | Powder: car deck 4, passenger spaces 4, engine room 2 + a 45 L foam unit; CO₂: wheelhouse, galley (with a fire blanket), EG room, paint store | | |
| Fireman's outfits | 2, with breathing apparatus | CO₂ room | |
| Fixed CO₂ and detection | As §3.3 | | Fans and fuel stopped from the CO₂ room |
| Structural fire protection | Steel throughout; insulated engine-room deckhead and casings; self-closing steel doors at the car-deck stair feet | | |
| **Escape routes** | Engine room: main stair (P casing) and escape trunk (S casing). Passenger deck: two stairs to the car deck, the aft doors to the open deck, the side walkways. Bridge deck: the crew stair and the wing ladders | Signed | The green running-man exit sign (非常口), a Japanese design of the early 1980s that the world then adopted; battery-backed exit lights |
| Notices | Capacity sign; the safety leaflet (安全のしおり) in every seat pocket; how to put on a life jacket; no smoking; no entry to the car deck at sea; drivers: engine off, handbrake on, in gear | Lobby, saloon, car deck | The PA briefing before every departure |

---

## 5. Crew

The ship needs eight on duty: master, chief officer, chief engineer, oiler, bosun, deckhand, purser and cook. The
officers hold licences of the period (deck and engineer officers' certificates, 海技士, at the grade this size and area
need); everyone carries a seafarer's pocket ledger (船員手帳). The crew works **a week on and a week off**, as the town
already says of Ms Uezu; the off-week reliefs exist only as names on the duty board, so the cast stays at eight. On
Ms Uezu's off-weeks the purser takes the stern line.

Who they are, chosen so nobody's existing life breaks:

| Role | Who | New or existing | Look | Personality | Lives |
|---|---|---|---|---|---|
| **Master** (船長) | **Captain Teruya**, 58 | New | Tall, lean, weathered; short white hair; black-rimmed reading glasses; white short-sleeved uniform shirt with four gold bars, white cap with the town's anchor badge | Calm, few words, reads the sky ("風が変わった"). Minato-born, 25 years on coastal tankers; came home in 1994 to take the town's new ferry | **5 Kitahama**, today "to let", with his wife |
| **Cook-steward** (司厨長) and kiosk | **Mrs Teruya**, 55 | New | Round face, hair under a white triangle scarf (三角巾), apron over a flowered blouse | Warm, bossy in her galley, feeds everybody. A married couple on one ship (夫婦船) is a real thing in Japanese coastal shipping | 5 Kitahama |
| **Chief officer** (一等航海士) | **Mr Kuniyoshi**, 44 | New | Stocky, crew cut, sunglasses on his cap, white shirt with three bars, a clipboard with the car plan (積付図) and a hand-held radio | Brisk, jokes with drivers, keeps a sanshin in his cabin and joins Grandmother Gushiken's Saturday lesson when the ship lies at Minato | Aboard on his weeks (his cabin); Naha on his weeks off |
| **Chief engineer** (機関長) | **Mr Gima**, 53 | New | Short, broad, sun-dark, grey crew cut, white towel round his neck, grey overalls, torch in the breast pocket, pencil behind the ear | Listens more than he talks; hears a sick cylinder from the mess; strict with the engine log; grows goya in a fish box by the funnel for his cook. Twenty years on Itoman tuna boats | Aboard on his weeks; Itoman on his weeks off |
| **Oiler** (機関員) | **Asato Tomo**, 20 | New | Lanky, shy, towel headband, oil-stained overalls, cotton gloves in his back pocket | Earnest, awkward with passengers, quick with numbers; studies for his engineer's certificate in the mess. Haru's nephew from Hoshizaki | Aboard on his weeks (two-berth cabin); Hoshizaki on his weeks off |
| **Bosun** (甲板長) | **Mr Yamashiro**, 47 | New | Big, bald under a towel, deep tan, rubber boots, marlinspike and knife on his belt, a whistle on a lanyard | Loud and kind, fussy about ropes, teaches knots to anyone, children included | Aboard on his weeks (two-berth cabin); Naha (Tomari) on his weeks off |
| **Deckhand** (甲板員) | **Ms Uezu**, 34 | Existing in the data (`island-households.js:34`), modelled for the first time | Wiry, short hair under a cap, deck gloves, an orange working life vest on deck | Quiet, precise, the best heaving-line thrower in the port; helps the old folk up the gangway | **8 Kitahama** (her shutters are down on her weeks aboard, as `quarters.js:561` already says); her cabin aboard on her weeks |
| **Purser** (事務長) | **Mr Nakama**, 49 | **Existing**: the retired "Bus driver" profile, reintroduced deliberately and named (`renamed.js`: Bus driver → Mr Nakama) | His own look (navy vest, neat dark hair) under a white ferry shirt with the purser's badge; ticket punch (改札鋏) and a leather cash pouch | Patient storyteller who "collects passengers and opening sentences": he drove the Harbour Line bus until the island had only the ferry. The Harbour master's gossip about him becomes true again | **Kitahama Heights flat 4**, the empty one (his Main Street flat has no door in the unified town, `residents.js:60–62`); Ms Ganaha, flat 1, is his colleague at the window |

Their days (the storyteller's places and moments):

| Who | Before the first boat (05:45–06:40) | Each call in port | Each crossing | Between sailings | After the last boat (22:00–22:30) |
|---|---|---|---|---|---|
| Captain Teruya | Weather: NHK radio, the NAVTEX printout, the harbour office barometer, a phone call with the Harbour master; decides the day (no sailing over 15 m/s of wind or 2.5 m of sea at the mouth) | On the starboard wing console, berthing and unberthing | Hands the watch to the chief officer outside the breakwater; the high chair and the log | Tea in the mess; walks the car deck | Writes the log and the night orders; walks home with his wife at 22:20 |
| Mrs Teruya | Rice on at 06:00; Mr Arakaki's sata andagi arrive at 06:30 for the kiosk | — | Runs the kiosk: canned coffee, Blue Coral's ice-cream cups, andagi, cup noodles | Lunch at 11:00 (Okinawa soba, goya champurū with Mr Gima's goya); supper at 17:00 for those aboard | Galley shut, walks home |
| Mr Kuniyoshi | Car list from Emi Kado | On the car deck: the loading plan (trucks on the centreline forward), lashings in bad weather, "ramp up and locked", reports to the bridge | Bridge watch outside the breakwater: radar, log | Monthly drill; paperwork | Night watch rota |
| Mr Gima | Rounds; No.1 generator on at 06:10 and shore power off; engines primed and started at 06:25 | In the control booth: No.2 generator on the board before the breakwater, thruster ready | Rounds and the hourly log | Filters, injectors (the parts come on the Thursday boat); bunkering Monday and Thursday | Engines and generators off, shore power on at 22:15 |
| Asato Tomo | Soundings | Aft capstan, stern line | Engine-room rounds with the chief | Bunkering with Mr Shimabukuro, fresh water with Mr Chinen, the purifier | Sewage pumped ashore; night watch every other night |
| Mr Yamashiro | Ropes and fenders checked | Head line; the ramp from the control box in the P bow house; waves the cars aboard with hand signals; chocks | Deck rounds | Paint, chipping, splicing | Lines doubled if wind is forecast |
| Ms Uezu | Gangway gear | Stern line; puts the gangway out and in; helps foot passengers | Checks the passenger spaces after each crossing (lost property, the carpet room tidy) | — | Night watch every other night |
| Mr Nakama | Cash float, ticket stock | At the gangway foot: clips tickets, counts heads, reports "passengers 46, cars 5" to the bridge; the departure announcement and safety briefing on the PA | The purser's window: sells tickets to those who boarded at Kitano-jima (no office there) | The cash book | Paying in at the Port Terminal; home to flat 4 |

Shore staff, existing residents whose routines only grow a little:

- **Ms Ganaha** (existing in the data, modelled at last): the Port Terminal's airport-ferry window, 06:15–21:45; passenger and car tickets; phones the bridge when a car books.
- **Harbour master**: VHF channel 12 for the port office; handles the head line at the first calls of the day (the 06:40 departure, the 07:33 and 08:30 arrivals: he is on duty from five already); keeps the port log of every call.
- **Jun** (Kitano-jima): takes the lines and checks tickets at the Kitano-jima pier for each call, between flights.
- **Emi Kado**: car bookings (車両航送) and the freight manifest for each sailing; hands the car list to the chief officer.
- **Riku**: marshals the waiting cars into the lanes with a whistle and a baton.
- **Mr Shimabukuro**: bunkers the ferry on Monday and Thursday mornings from the town's tank lorry.
- **Mr Chinen** (in the data): fills the fresh-water tanks every fifth morning from the island water lorry.

Trade, recorded the way `merchandising.js` records Sakura's: new accounts for the ship's galley and kiosk from
**Sakura** (rice, tea, coffee, water, cup noodles, tissues, detergent), **Higa Liquor** (canned Umineko lager for the
evening boats), **Front-Row** (ticket books, receipt books, the purser's ledger), **Blue Coral** (ice-cream cups: it
stays the town's only ice-cream shop, the kiosk resells its cups), Mr Arakaki's **andagi** at dawn, fish from
**Mrs Yonamine**, and New Year decorations for the bow from **Rainflower Florist**.

New storyteller places, with shots rendered by `tools/render-feed-backdrops.mjs`: `ferry-car-deck`, `ferry-saloon`,
`ferry-carpet-room`, `ferry-open-deck`, `ferry-bridge`, `ferry-mess`, `ferry-engine-room`.

---

## 6. Port side

### 6.1 Minato, today and what it needs

Today (shot 09): the quay face is at z −49.65, the breakwater (68 m, x −34…34) at z −83, so the basin is **31 m** deep;
the outer pier is 15.3 m (z −49.65…−64.95) × 8.2 m; the ferry lies on its west flank. The island cargo ship (26 m)
"lies" 3.5 m off the west quay at z −56 with its bow inside the ferry; the second pier's east arm reaches x −26 at
z −62; Mr Fujita's houseboat is at (−40.5, −56.5).

The new ship at the berth: centreline x −8.55 (beam 8.4, 0.25 m off the pier face on the fenders), stem at z −52.0,
stern at z −86.5, heading +z; the ramp hinge at z −53.5 lands the ramp's tip on the quay at z ≈ −47.5 (2 m of ramp on
the quay, 5°); the gangway door at z ≈ −72.

What has to change:

1. **The breakwater** moves 23 m seaward (centre z −83 → −106) with its beacons. Departing, the ship springs off,
   backs out to seaward and to the west (−z, −x) and pivots in the western basin about (−24, −84): a 17.8 m swept
   radius, clear of the outer pier by 2 m, of the second pier's arm by 2 m, of the breakwater by 2 m. The harbour's sea plane (160 × 86 m centred at
   z −92.5) already reaches z −135.
2. **The outer pier** extends from 15.3 m to **38 m** (to z −88), the ferry berth along its west face: nine V-type rubber
   fenders at 4 m, four bitt bollards (z −53 head line and forward spring, −63, −77, −86 stern line), a recessed ladder,
   a lifebuoy post, lamps. The fishing spot, bait station and winch move to the new pier end.
3. **The ramp landing**: a steel-edged landing plate and a short concrete slip (斜路) cut into the quay edge at
   x −10.8…−6.3, the cheap answer of the period that works at Okinawa's 2 m tides (a linkspan, 可動橋, is the upgrade).
   The quay bollard at (−10, −49.3) and the drying nets at x −8.6 move out of the ramp's footprint.
4. **The cargo ship** moves to the extended pier's **east face** (x 4.4…10, from z −52), arriving bow-first round the
   breakwater's end and lying properly alongside; the fishing boat moves to the east quay, where the other boats are.
   Its board, staging bay and Riku's forklift stay west, 60 m away. (Or: shorten it to 20 m and lay it alongside the west
   quay, x −33.7…−13.5.)
5. **Car marshalling**: two painted waiting lanes (乗船待ち) on the quay between the warehouse frontage and the pier root
   (x −9…−4, z −48…−38), four cars, numbered, with the "stop" bar; the existing stage lane re-drawn to feed them.
6. **The passenger walk**: hall doors → along the quay → a hatched walkway on the pier's west edge → the gangway at
   z ≈ −72, with the purser at its foot; passengers never cross the car lanes.
7. **The ticket office**: Ms Ganaha at the window; the poster and departures board show the real timetable and fares
   (passenger, and cars by length).
8. **Shore power**: the kiosk on the quay at the pier root, 200 V 60 Hz, 50 kVA, and a cable to the ship's shore box.

### 6.2 Kitano-jima

The airport's 7.2 × 6 m jetty becomes a matching ferry berth: a 40 m quay face with fenders and bollards, a ramp landing,
a small shelter (待合所) where Jun checks tickets, and the car lane to the cargo court. The ship berths bow-in there too,
so she turns at both ends.

### 6.3 If the harbour must stay as it is

Then the ship can be at most about **25 m** (about 99 tons): 4 cars, 60 passengers, a crew of 5, two 300 kW engines,
two 60 kVA generators, no bow thruster or a 30 kW one, and no mess, galley or crew cabins (a crew room with two bunks
for the night watch). She would berth bow-in with her stern 5 m off today's breakwater and turn in the western pocket
with 2 m to spare. The cargo ship still has to move, because it overlaps today. This loses most of what the creator
asked for, so it is the fallback, not the recommendation.

---

## 7. Behaviour

### 7.1 A call at Minato (the same at Kitano-jima)

| Time | What happens |
|---|---|
| Arr. −6:00 | No.2 generator started and put on the board (Mr Gima in the control booth); thruster ready; deck crew to stations: bosun and Ms Uezu forward and aft, the oiler at the aft capstan, the chief officer aft in charge. The purser's arrival announcement; drivers stay seated until called |
| −4:00 | Passing the breakwater's blind end: **one prolonged blast** (4–6 s; Rule 34(e)); 5 knots, then 3 |
| −2:00 | In the basin, dead slow, lined up 10 m off the pier; Captain Teruya on the starboard wing console |
| −1:00 | Closing at half a knot, bow slightly in; heaving lines to the Harbour master and the pier hand; head line and forward spring first (they stop her), then the stern line and after spring, then the breasts; capstans heave her onto the fenders |
| 0:00 | All fast (係留完了). Engines idle, clutches out, thruster off |
| +0:30 | Gangway out (Ms Uezu); ramp pins out, ramp down in 45 s, flap down (the bosun at the ramp box) |
| +1:30 | Foot passengers off past the purser; drivers called down by PA; car-deck fans on; cars drive off forwards, waved by the bosun |
| +6:00 | Loading: waiting cars reverse aboard by the chief officer's plan, chocked; drivers lock up and go up to the cabin; foot passengers board, tickets clipped |
| Dep. −3:00 | PA: departure announcement and the safety briefing; the chief officer checks the car deck empty of people |
| −2:00 | Ramp up and locked (the green lamp on the bridge); gangway in, door shut; "stand by" (出港用意); No.2 on the board; both steering pumps |
| −1:00 | Breasts let go; holding the head line and forward spring |
| 0:00 | **One prolonged blast**; stern line off; spring off (slow ahead against the spring, the stern swings out); spring off; **three short blasts** (Rule 34(a): going astern); astern at 1–2 knots |
| +1:30 | Pivot in the basin on the thruster and split engines (≤ 3°/s), then slow ahead |
| +3:00 | Passing the breakwater's end: one prolonged blast; half ahead |
| +4:00 | Full ahead (1,350 rpm, 11.5 knots); No.2 generator off; the captain hands over; the kiosk opens |

The crossing is 18 minutes: 4 out, 10 at sea, 4 in.

### 7.2 Moving like a ship

- **Speeds**: at most 3 knots (1.5 m/s) in the basin, 5 at the breakwater, 11.5 at sea, felt **locally** (wake, bow
  wave, water running past the hull, the engine note). Because World's distances are compressed, the world position
  moves only as fast as the 18 minutes need along the route; seen from the shore the ship then crosses the view at the
  same angular speed a real one does at the real distance.
- **Turning**: at most 3°/s pivoting, 1°/s under way. No snaps: one continuous heading.
- **Motion at sea**: roll period about 5.5 s (GM ≈ 1.6 m), up to 2° in the strait's swell; pitch about 0.5°; alongside
  ±0.3°, with a squeal from the fenders when she surges.
- **On board**: the crossing is a place, not a cutscene: walk the decks, go up to the saloon, buy an ice cream, lie in
  the carpet room, stand on the open deck. Sitting in the carpet room offers "doze until Kitano-jima" (time passes, as
  sleeping at home does). The car deck is shut at sea.

### 7.3 Sound, wake and lights

- **Engines**: two six-cylinder diesels, firing note 27.5 Hz at idle to 67.5 Hz at full, slightly out of step (a slow
  beat), a turbocharger whine that rises with load, exhaust from the twin funnels: one positional loop on the ship whose
  pitch follows rpm. **Generators**: a steady 90 Hz hum whenever the ship is in service; silence at night on shore power.
- **Whistle**: about 350 Hz (250–700 Hz for a ship under 75 m, audible 1 nautical mile); signals as in §7.1, one
  prolonged every two minutes in fog. Grandmother Higa, who "knows every ferry by its horn", hears this one.
- Also: the ramp pack's whine and the clang of the ramp seating; the gangway's rattle; the PA chime and announcements;
  the capstan's clatter; rain on the car deck.
- **Wake**: two white trails from the twin screws, three to five ship lengths long at speed; a bow wave at 11.5 knots;
  churned water at the stern going astern at the berth; a sideways boil at the bow when the thruster runs.
- **Lights**: navigation lights from sunset; floodlights on the ramp and car deck while loading after dark; the saloon
  lit; the searchlight finds the pier on the last boat. All driven by the circuits in §3.

### 7.4 The timetable

Eight round trips, built from what the town already needs: the three commuter arrivals at Minato (08:30, 14:30, 22:00,
`commuter-schedule.js`), the four flights from Kitano-jima (09:15, 12:40, 16:15, 19:00; arrive at least 20 minutes
before check-in closes), Vy's school boat, and the car errands (`town-traffic.js` appointments, which should be derived
from this table rather than fixed).

| No. | Minato dep. | Kitano-jima arr. | Kitano-jima dep. | Minato arr. | Carries |
|---|---|---|---|---|---|
| 1 | 06:40 | 06:58 | 07:15 | 07:33 | Airport early staff, the newspapers and post |
| 2 | 07:40 | 07:58 | 08:12 | 08:30 | Vy to school; the 09:15 flight; the 08:30 commuters |
| 3 | 10:00 | 10:18 | 10:35 | 10:53 | Chin's freight truck; island errands |
| 4 | 11:35 | 11:53 | 12:10 | 12:28 | The 12:40 flight; Tetsuo's kei truck (his 11:30–12:30 appointment fits exactly) |
| 5 | 13:39 | 13:57 | 14:12 | 14:30 | The 14:30 commuters |
| 6 | 15:20 | 15:38 | 15:55 | 16:13 | The 16:15 flight; the Harbour master's and Mrs Sato's cars |
| 7 | 18:10 | 18:28 | 18:45 | 19:03 | The 19:00 flight; Vy home (her evening wait moves to 17:50–18:10) |
| 8 | 21:09 | 21:27 | 21:42 | 22:00 | The 22:00 commuters: **the last ferry** |

The ship lies overnight at Minato on shore power with one crew member on night watch. No sailing in a typhoon or over
the weather limits (欠航): lines doubled, the island waits. The timetable replaces "on request"; a player who misses a
boat waits in the hall or "waits for the next boat" and the clock moves, as with the flights.

---

## 8. The batch plan

Each batch is one kind, is checked in the live game (the audit MCP server: walk it, look, screenshot) before the next,
and lists what it touches. Before any batch that moves something, run `remotion/tools/impact.py` for its box.
Today's impact results: no film view sees the ferry berth (x −9…−3, z −66…−48); the `cloud` view of `thuan-poster`
(beat 5, at 3.05 s) sees 34 % of the western basin (x −36…−6, z −86…−48), 5 % of it in plain view. The storyteller's
`harbour` (camera 6, 1.8, −47 → −4, 1, −58) and `pier` (−1.2, 1.8, −50 → −1.6, 1, −64) backdrops both show the
ship: re-render them after batches 3, 5 and 12.

Phone references: the harbour view is about 107 draw calls on a phone (`docs/PORT-BUILDING-PLAN.md`); the quay view
68–82 draws and ~75k triangles (`docs/harbour-batching.md`); today's ferry is 37 draws and 1,048 triangles.

| # | Kind | What | Affects | Phone budget |
|---|---|---|---|---|
| 0 | Behaviour | **Today's ferry stops misbehaving**: crossing speeds and turn rates capped (no snap leaving Kitano-jima), roll and pitch at sea, cabin lights at night in play, horn pitch and signals, the stale subtitle cleared, a word when the boat waits for a car | `airport-ferry.js`, `ferry.js`, `town-audio.js`, `play.js`; tests: `airport-ferry.test.mjs` (new speed and turn-rate limits), `ferry.test.mjs` | 0 draws |
| 1 | Port side | **The cargo ship**: alongside, never inside the ferry, in and out bow-first round the breakwater | `cargo-shipping.js` (position, path, rope, board text); tests: `lived-in-island.test.mjs` (pins z −56), `fujita-houseboat.test.mjs`, a new cargo-against-ferry test at every minute of both calls | 0 |
| 2 | Hull and decks (on paper) | **The ship as data**: `src/world/ferry/spec.js` with §2's particulars and GA, §4's equipment, §5's roster and §7's timetable, each with purpose and `why`; one source for FERRY and AIRPORT_FERRY | `ferry.js`, `airport-ferry.js` (constants only); tests: new `ferry-spec.test.mjs` (spaces fit the hull and do not overlap; two escapes each; rafts ≥ persons; 8 lifebuoys; jackets with 10 % children; ramp ≤ 1:8; timetable meets the flights and commuters) | 0 |
| 3 | Port side (sea and ground) | **Minato berth**: breakwater 23 m seaward with its beacons; outer pier to 38 m with fenders, bollards, ladder; ramp landing and slip; cargo ship to the pier's east face; fishing boat to the east quay; nets and the quay bollard moved; car waiting lanes; pier walkway; shore-power kiosk; real timetable boards | `harbour.js`, `layout.js` (OUTER_PIER, routes, `regionAt`), `ferry.js` approach and departure curves, `airport-ferry.js` route, `town-traffic.js` lanes, `port-building.js`, `port-hall.js`; standing spots: pier fishing spot, bait station, winch, the `pier` spawn lens; tests that pin the breakwater at z −83 (`ferry.test.mjs:38–39`, `airport-ferry.test.mjs:43`, `kitano-link.test.mjs:111`), `owned-vehicles`, `port-building`, `airport-dock-access`, `spawn-scene`; MCP tour `tools/mcp/merged-port-tour.mjs`; film: check `thuan-poster` `cloud` and re-photograph plates `main-street`, `main-street-2` and depth `main-street-depth` if the change shows; feed backdrops | +3 draws (pier merged into harbour cells; fenders and bollards instanced), +4k triangles |
| 4 | Port side | **Kitano-jima berth**: quay face, fenders, bollards, ramp landing, shelter, car lane | `airport-island.js` (AIRPORT_JETTY), `airport-ground.js` (AIRPORT_LANDING), `airport-vehicle-yard.js`; tests: `airport-island`, `airport-dock-access`, `airport-ferry`, `owned-vehicles` | +3 draws, +3k triangles |
| 5 | Hull and decks | **The new ship outside**, at the berth: hull form, car deck (lanes, lashing sockets, scuppers, casings with doors), ramp with cylinders and pins, rails, superstructure shells and windows, twin funnels, mast, lights (emissive, wired later), lifesaving gear on deck, name, registry, draft marks and load line; LOD; colliders. Built with the kit and written as recipes that can move into Studio's asset format (NEXT.md §5) | `ferry.js` (buildFerry, FERRY_BERTH, FERRY_TERMINAL queue, arrival and doorway), `town-traffic.js` (FERRY_VEHICLE_DECK_Z becomes two lanes of slots, `ferryLanes`), `play.js` (standOnFerry), `schedules.js` (doorway); colliders: hull, casings, ramp, gangway; tests: `ferry`, `airport-ferry`, `bus-boarding` (`:69` uses the beam), `owned-vehicles` (`:34` deck z), `airport-dock-access`, `spawn-scene` (the ferry opening); feed backdrops | ≤ 12 draws and ≤ 15k triangles within 120 m; ≤ 3 draws and ≤ 2k beyond (replaces 37 draws) |
| 6 | Behaviour | **A deck you can walk**: the ship as a moving room. The player and crew keep ship-local positions; decks, stairs and walkways are a walk surface in ship coordinates; colliders move with the hull; the gangway is walked, not menued; the camera rides along | `game.js` movement and `standUpAt`, `walk-surface.js`, `collider-grid.js` (moving solids), `play.js` (the crossing stops being a cutscene); tests: walk from the pier to the open deck at the berth and at sea | 0 draws; ≤ 0.3 ms a frame for ~40 moving colliders |
| 7 | Interiors | **Passenger deck**: lobby, purser's window, kiosk, vending, toilets, carpet room, seated saloon; the sea and the harbour through the windows | new room module, the stair heads as doors, the capacity sign and notices; feed place `ferry-saloon`, `ferry-carpet-room` | ≤ 60 draws, ≤ 40k triangles; seats instanced; loaded on entry |
| 8 | Interiors | **Bridge deck**: wheelhouse with every instrument, master's and chief engineer's cabins, mess and galley, crew cabins, WC and shower; the emergency-generator and CO₂ rooms | new room modules; feed places `ferry-bridge`, `ferry-mess` | ≤ 60 draws |
| 9 | Machinery | **Below decks**: engine room and control booth, steering-gear room, thruster room, changing room; the machinery data with ratings and purposes | new room modules; feed place `ferry-engine-room` | ≤ 70 draws, ≤ 50k triangles |
| 10 | Systems and electrics | **`ferry/electrics.js`** as §3.6, with its tests; the board's meters and earth lamps, every room's lights and the navigation lights wired to it; tank levels for fuel, water and sewage | new module and `tests/ferry-electrics.test.mjs`; also correct the power house to 60 Hz (`school.js:348`) | 0 draws; evaluated twice a second |
| 11 | Crew and routines (characters only) | **The crew**: six new residents and two from the data (Ms Uezu; the Bus driver reintroduced as Mr Nakama), their homes (5 Kitahama, Kitahama Heights flat 4, cabins), the duty rota, routines in port and at sea in ship coordinates; the shore staff's small additions; the trade accounts; storyteller places | `neighbours.js` or `residents.js`, `island-households.js`, `cast.js`, `renamed.js`, `social.js` (the Bus driver's routine), `merchandising.js`, `feed/places.js`, `feed/stories.js`, `home-lights.js`; tests: households, home lights, merchandising, seat layouts | ≤ 4 crew drawn outdoors at once; the rest only in their room |
| 12 | Behaviour | **The timetable and the call**: §7's eight round trips; the call sequence (lines, ramp, gangway, unload, load, signals, thruster, wake, motion, lights); sound on the ship; passengers and cars from the timetable (Vy, commuters, car errands); "doze until Kitano-jima"; weather cancellations | `ferry.js` (one mode, from the timetable), `play.js`, `commuter-schedule.js` (HARBOUR_LINE becomes the ferry timetable), `town-traffic.js` (appointments), `schedules.js` (boarding and alighting), `neighbours.js` (Vy), `town-audio.js`, `services.js` (fares); tests: `ferry`, `airport-ferry`, `bus-boarding`, `owned-vehicles`, `town-economy`; feed stories ("The last ferry" becomes true) | Wake 2 draws (≤ 1k triangles); two positional loops |

Order matters: 0 and 1 make today's ship honest while the rest is built; 2 settles the numbers before any geometry; 3 and
4 make room before 5 puts a ship there; 6 must work before anyone walks the interiors (7–9) or works aboard (11); 10
powers what 7–9 built; 12 brings it all to life. Ground and sea (3, 4), characters (11) and lighting never share a batch.

---

## 9. Story hooks

- **Blackout at the breakwater.** No.2 generator trips on a dirty fuel filter just as the thruster starts; the
  preference trip sheds the saloon's air conditioning, then the board goes dark. Emergency lights flicker on, the
  propellers keep turning (their pumps are engine-driven), steering returns on pump No.2 within 45 seconds, and Captain
  Teruya berths her on the engines alone while Mr Gima and Asato bring No.2 back.
- **A blackout at sea**: a plastic bag in a sea-water strainer, a generator overheats; the carpet room goes dark mid-nap;
  the cook's rice cooker stops; the oiler's first real emergency.
- **A fouled propeller**: a drifting net round the starboard screw; the shudder, the limp home on one engine, a diver at
  the pier, Mr Ōshiro identifying the net.
- **The broken ramp**: a hydraulic hose bursts with the ramp half up and two trucks waiting; the bosun on the hand pump
  for fifteen minutes while the island's newspapers wait.
- **The cook's lunch**: soba at eleven, goya from the funnel box, the smell drifting up to the saloon, and passengers
  asking to buy some.
- **The earth fault**: one earth lamp on the switchboard glows dim; Mr Gima and Tetsuo hunt it circuit by circuit (the
  studio's IT earth-fault episode, filmed in a real engine room).
- **Paralleling the generators**: the synchroscope's slow clockwise turn and the breaker closed at five to twelve (the
  studio's kW-versus-kVA and transformer episodes have a set at last).
- **The last ferry**: the 21:09, the horn the whole town knows, someone running the length of the quay.
- **Typhoon**: no sailings, lines doubled, the crew aboard, the island cut off; the town's shelves empty at Sakura.
- **Night emergency**: Dr Kakazu needs a patient taken across at 02:00; the crew is called from Kitahama, the
  searchlight finds the Kitano-jima pier.
- **Fog**: the radar, a prolonged blast every two minutes, and Grandmother Higa on her verandah naming the ship by its
  note.
- **The drill**: seven short and one long; passengers think it is real; life jackets on backwards.
- **Inspection day**: the bureau's inspector (船舶検査官) with his clipboard and torch, and the crew who painted
  everything the night before.
- **Bunkering Monday**: Mr Shimabukuro's lorry, Asato's soundings, a figure that does not add up.
- **Lost property**: what Ms Uezu finds in the carpet room after the 07:40.
- **Vy's kanji test** on the 07:40, with the purser who knows every regular.
- **The purser's stories**: Mr Nakama, the old bus driver, now with a ship full of opening sentences.
- **Dry-docking in Naha**: a strange relief boat for two weeks, and the town hating it.
- **New Year**: kadomatsu on the bow from Rainflower, the first sailing of the year, the crew's blessing at the utaki.

---

## Appendix

**Measurements** (live game, 2026-10-10). Ferry at the town berth: position (−6.45, −0.44, −58), hull box
x −8.65…−4.25, y −1.16…0.53, z −65.5…−50.5; deck at y 0.57; ramp down at z −50.84…−48.16; gangway y 0.23…1.32
against a pier at 0.098; 37 meshes, 9 materials, 1,048 triangles. Cargo ship at 08:00: x −33.5…−7.5, z −58.8…−53.2,
intersecting the ferry's hull; at 07:20 at z −86, across the breakwater. Crossing (`airportFerryPose`, 3,600 samples):
route 261 m in 18 s, top speed 26.4 m/s, top turn rate 236°/s outbound and a ≈4,600°/s snap on leaving Kitano-jima.
A crossing booked at 12:00 waited 20 s at 0 % for a car.

**Where the numbers come from.** COLREGs (海上衝突予防法) Annex I (lights) and III (whistle frequencies and ranges),
Rules 34 and 35 (signals); SOLAS as carried into the Japanese rules of the period (船舶設備規程, 船舶救命設備規則,
船舶消防設備規則, 船舶防火構造規則, 船舶機関規則, 満載喫水線規則, 船舶区画規程): two steering power units and the 28 s
rule, the 45 s emergency source, 8 lifebuoys under 60 m, children's jackets at 10 %, a rescue boat on small passenger
ships; the bilge-main formula d = 25 + 1.68√(L(B+D)); CO₂ at 40 % of the machinery space's gross volume at 0.56 m³/kg;
the equipment-number tables for anchors and cable; 60 Hz and 200 V three-phase supply in Okinawa; 440 V insulated
three-wire distribution and 105 V lighting as on Japanese ships of the period; the Japanese domestic tonnage measure; the
Ship Officers Act, Mariners Act, Marine Transportation Act (運航管理規程), the marine pollution law and the Port
Regulations Act (港則法) by their 1990s names. The engine, generator and pump ratings are sized from first principles
(resistance at Froude number 0.34, pump power from flow and head, motor currents from efficiency and power factor)
and checked against the class of ship, not copied from one vessel.

**Screenshots** (in `/tmp/claude-0/ferry-audit/`, not in the repo):
01 the starboard side from the pier; 02 from the pier end; 03 the cargo ship's bow against the ferry at 08:00; 04 the
whole ship from the west at noon; 05 the ramp on the quay, the chains to nothing, the one-lane deck and the gangway;
06 leaving the berth with the player on the car deck and a stale subtitle; 07 mid-crossing: flat sea, no wake; 08 put
down on the Kitano-jima pier; 09 the harbour from above: basin, breakwater, pier, ferry and cargo ship; 10 the cargo
ship crossing the breakwater sideways at 07:20.

**Decisions for the creator**: the harbour change (§6.1) or the 25 m fallback (§6.3); the ship's name; where the cargo
ship goes; whether the crossing runs in real time with "doze" to skip, or stays short; whether the player may visit the
bridge and engine room freely or by invitation (a story); fares.
