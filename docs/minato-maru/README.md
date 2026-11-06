# The Minato Maru (みなと丸): the design book

**Revision B · for design review · construction not approved.** These documents describe the
Johansson World game vessel. Japanese inspection and NK class references are narrative assumptions,
not evidence of actual flag, class or construction approval.

The [reviewed CAD download page](cad-revb/index.html) contains the complete 55-sheet PDF/DXF set,
the engineering review, equipment models, schedules, source snapshot and construction work register.
The archive is an immutable review issue dated 2026-10-13; its integration note records the state at
issue. Current publication and source-integration details are recorded separately in
[the publication record](cad-revb/PUBLICATION.md). The programme below retains historical work entries.

The creator, 2026-10-12: *"The ferry needs to be built like a realistic ferry in the 90's, the cartoon cel shading is just
to make it more fun. Be a naval ship architect and build the ferry as a real ferry would be built and make drawings, one
should be able to build a real ferry from our documentation."*

This folder is that documentation. Every drawing and table here is **generated from the ship's data** by
`tools/ferry-drawings.mjs` (`node tools/ferry-drawings.mjs`; the test `tests/ferry-design-book.test.mjs` fails when a
committed sheet no longer matches the data), so the ship in the game, the ship in the drawings and the ship in the stories
are one ship. The data: `src/world/ferry-ship.js` (particulars, general arrangement, machinery, electrics, loads, safety,
manning), `src/world/ferry-model.js` (the hull's lines), `src/world/ferry-interior.js` (every bulkhead, door, stair and
fitting inside her, as walked). The shipbuilder's brief behind the data is `briefs/ferry-audit.md`; the batches that built
her are in `docs/FERRY-AUDIT.md`.

## Principal particulars

| | |
|---|---|
| Name, port of registry | Minato Maru (みなと丸), Minato |
| Owner | Minato-chō (the town ferry, 町営フェリー) |
| Type | Passenger ship and vehicle ferry, bow ramp only, twin screw (旅客船兼自動車渡船) |
| Built, refit | 1994, Johansson Shipyard, Innoshima (hull No. 127); 1998 GMDSS |
| Rules, area | Fictional Japanese inspection/NK class setting; limited coastal (限定沿海); no actual approval obtained |
| Length overall / between perpendiculars | 34.5 m / 31.0 m |
| Breadth moulded / depth to car deck | 8.4 m / 3.0 m |
| Draft, laden / service | 1.9 m / 1.7 m |
| Freeboard to the car deck, laden | 1.1 m |
| Gross tonnage | 199 |
| Displacement at 1.9 m immersion | 375.41053 t from the procedural loft; Cb 0.74026634 on LBP 31.0 m |
| Lightship / payload planning target | Legacy assumptions 210 t / 73 t; weight budget unresolved. The former 283 t operating target is inconsistent with this loft at 1.9 m. The arithmetic displacement residual is not an approved deadweight limit. |
| Passengers / vehicles / crew | 100 / 6 cars (or an 8 t truck and two cars, or eight kei trucks) / 8 |
| Speed, service / trial | 11.5 kn / 12.8 kn |
| Main engines | 2 × 460 kW (625 PS) at 1 350 rpm, six-cylinder four-stroke medium-speed diesels, 160 × 200 mm, turbocharged and intercooled, air start |
| Gearing, propellers | 3:1 reverse-reduction gearboxes; 2 × four-bladed fixed-pitch aluminium-bronze propellers 1.45 m, 450 rpm, outward turning |
| Rudders, steering | 2 spade rudders 0.75 m² behind the propellers; electro-hydraulic, 2 × 2.2 kW units, hand pump |
| Bow thruster | 75 kW, 0.9 m tunnel, 10 kN |
| Generators | 2 × 125 kVA (100 kW) 445 V 60 Hz; emergency 40 kVA; 24 V batteries; 50 kVA shore supply at Minato |
| Fuel, fresh water | 15 m³ fuel storage: 9.23 days at 20 crossings/day and 90% usable storage, excluding idle/weather allowance; 12 m³ fresh water, narrative refill every fifth morning |
| Metacentric height | 1.6 m game-motion parameter only; intact/damage stability unverified |

## The sheets

| Sheet | File | What it is |
|---|---|---|
| 1 | `lines-plan.svg` | Sheer plan, half-breadth plan and body plan, 21 stations, buttocks and waterlines |
| 1a | `offsets.md` | Table of offsets: half-breadths at every station and waterline, keel and deck heights |
| 1b | `hydrostatics.md` | Displacement, LCB, KB, BM, KM, waterplane, TPC, MCT and the form coefficients by draft, and the check against the particulars |
| 2 | `general-arrangement.svg` | Profile and the five deck plans: every space of `FERRY_GA` |
| 3 | `electrical-one-line.svg` | Generation, main and emergency switchboards, transformers, feeders |
| 3b | `feeder-lists.svg` | Feeder lists: every consumer of the main, lighting and emergency switchboards with its KKS tag, full-load current, starter, breaker, cable (cores × mm², rating), route and length, voltage drop (`src/world/ferry-electrical.js`) |
| 3c | `cable-schedule.md` | The cable schedule the electricians pull from: every power cable numbered by the KKS rule, its ends, type, section, route and length |
| 3a | `electrical-load.md` | The electric load analysis (電力調査表): every consumer in the five conditions |
| 4 | `tanks.md` | Tank plan and capacities |
| 5 | `engine-room-arrangement.svg` | Machinery arrangement: plan at the floor plates with the frame grid, centreline elevation, hatched section through the mains, dimensions, equipment list keyed to the drawing (every rectangle a box of `FERRY_INTERIOR` as built) |
| 8.1–8.11 | `piping-<system>.svg` | Piping diagrams, one a system (fuel oil, lubricating oil, sea-water cooling, jacket water, bilge and ballast, fire main and CO₂, starting and service air, fresh water, sanitary water and sewage, exhaust, hydraulics): every tank, pump, valve, strainer, cooler and consumer with its KKS tag and its space, every line with its bore, and the duty/standby table of the system (`src/world/ferry-piping.js`) |
| 7 | `machinery-spaces.svg` | Machinery spaces, levels and rooms: the longitudinal section at the centreline with every level (tank top, floor plates, car deck, fan flat, passenger deck) and every hold space on its frames, the plan at the floor plates from the engine room through the watertight door to the auxiliary machinery room, the workshop and the store, the list of levels |
| — | `STATUS.md` | The status report of the vessel and her engine particulars for the creator's audit (2026-10-13), generated by `node tools/ferry-status.mjs`: particulars, the hull against the loft, machinery and the equipment list, electrical, piping, safety, the plant as it runs, the programme built and open, the open findings |
| 6 | `safety-plan.svg` | Fire control and safety plan: profile and the four decks with every extinguisher, hydrant, fixed system, liferaft, lifebuoy, lifejacket locker, muster station, escape and control station (`FERRY_SAFETY_ITEMS`, `src/world/ferry-safety-plan.js`); the same drawing is posted aboard, marked YOU ARE HERE |
| X1–X3 | `exterior/` | **The ship as built, in CAD (3 November 2026, Rev B):** the game's own `buildFerryModel()` projected with hidden lines removed (cut for plans and sections), as SVG, DXF and an A1 PDF. X1: profiles, plan, bow and stern at sea, 1:100. X2: alongside Kitano-jima as in the owner's screenshot, its four problems found (Rev A) and fixed, measured again. X3: the crew stair to the wheelhouse and the cosier saloon and carpet room, in plans and sections at 1:50 (`tools/ferry-exterior-cad.mjs`; [README](exterior/README.md)) |

The contents of each space, and why it is where it is, are the `what` and `why` of each `FERRY_GA` entry (read them in
`src/world/ferry-ship.js`); the inside of each space as built, to the centimetre, is `src/world/ferry-interior.js`.

## Tags: KKS (the creator, 2026-10-13: "Use correct KKS codes for the drawings")

Every system, machine, valve, tank, instrument and cable on the sheets carries a tag by the VGB Kraftwerk-Kennzeichensystem,
the power-plant identification system, with the ship as the plant (`src/world/ferry-kks.js`). The structure and the
counting rules are VGB-B 105's as restated in Eskom's open KKS Coding Standard 240-93576498 (2016):

| Level | Characters | Aboard |
|---|---|---|
| 0 total plant | G | 1 the Minato Maru; 0 the shore (the quay kiosk's shore supply is plant-common) |
| 1 system | F0 F1F2F3 FN | F0 tells identical systems apart (0 common, 1 port main engine, 2 starboard, 3 generator No.1, 4 No.2, 5 the emergency generator); F1F2F3 the function key; FN the subsystem decade in the direction of flow |
| 2 equipment unit | A1A2 AN | AP pump, AA valve, AN compressor or fan, AT filter or separator, AC heat exchanger, BB tank, BR pipe, BS silencer, AE winch or hoist, AH air-conditioning unit, GS board section, GT transformer, GU charger, C* measuring circuit (CP pressure, CT temperature, CL level, CF flow, CQ analysis, CS speed, CE electrical); numbered by the key part's rules: valves 1xx electric actuator, 2xx pneumatic/hydraulic/solenoid, 4xx drain and vent, 5xx hand, 6xx mechanical, 9xx safety; measuring circuits 0xx remote analogue, 3xx remote binary, 5xx local |
| 3 component | B1B2 BN | -M01 the motor, KP01 the pump, MK01 the coupling, KA01 the valve body, KC01 the cooler, KD01 the vessel, MG01 the gear |

So `11XJA10 AP001 -M01` reads: the ship, the port main engine, diesel engine 10, pump unit 001, its motor. Cables: the lower
end's tag in alphabetical order, then 1001–1999 for AC ≤ 1 kV, 2001–2499 DC power, 4501–5999 control, 7001–7999
measuring, 8001–8999 communication (`10BRA10 1009` is the thruster's cable from the main board).

The function keys and where each comes from (`KKS_FUNCTION_KEYS`, `source`): **read in the published key tables** (VGB-B
105 as quoted by the Eskom standard, the Siemens abridged key and the Voith Siemens handbook): XJA diesel engine, XJB
turbocharger, XJG liquid cooling, XJH charge-air cooling, XJK transmission gear, XJN fuel system at the engine; MKA
generator, MKC excitation; EG light fuel oil supply; PA main cooling water, PC auxiliary cooling water; GA raw water, GH
distribution not for drinking, GK drinking water, GM process drainage, GN process drains treatment, GQ domestic waste
water collection, GR its disposal; SG stationary fire protection (SGA fire water, SGJ CO₂), SC stationary compressed air
(SCA generation, SCB distribution), SA heating, ventilation and air conditioning, SM cranes and hoists; BAA generator
leads, BRA–BRS low-voltage distribution boards, BRU converters, BRV emergency power generating equipment; UM structures for
main machine sets, UZ for transport, UY general service. **The yard's reading of the key part's lettering, to be confirmed
against the full key part before a real yard cuts steel** (`source: 'yard'`, each with its reason): XJJ starting, XJL air
intake, XJR exhaust, XJV lubricating oil, XJY control (the X group letters its subsystems as the M group does: MBJ, MBL,
MBR, MBV are published); the EG decades EGA–EGD; BRT low-voltage transformers (BBT is the medium-voltage key); BTA the 24 V
batteries; BQA the shore supply; the C keys CMA engine control, CSA fire detection, CTA navigation and radio; SGP portable
extinguishers; and XSA–XSD for the ship's own machines the key part does not know (steering gear, ramp hydraulics, bow
thruster, windlasses), allocated under X (heavy machinery, not main machine sets).

## Findings (what a yard would send back)

1. **The original weight assumptions do not match the loft.** Revision B records the numerical loft displacement
   as **375.41053 t** at 1.9 m immersion in seawater of density 1.025 t/m³, with **Cb 0.74026634 on LBP 31.0 m**.
   The 283 t operating target and 210 t lightship remain unreconciled assumptions, explicitly separated from this
   geometric result. A weight estimate by hull, outfit and machinery group, loading cases, KG and intact/damage
   stability calculations are still needed before selecting a real operating draft or a revised hull. See
   `hydrostatics.md` and the Revision B engineering review; the game motion GM is not a stability approval.
2. **No structure is drawn yet.** The midship section with scantlings (keel, bottom and side shell, car deck under a
   5 t axle, frames at 500 mm, web frames, floors, girders, pillars, bulkheads), the shell expansion and the deck
   plating plans are what a yard cuts steel from; they need rule scantlings (NK rules for steel ships under 90 m) in the
   data first (`FERRY_STRUCTURE`, open).
3. **Drawing coverage and physical design are separate.** The generated SVG set and Revision B CAD set now cover
   the machinery arrangement, system diagrams and electrical records. The source has 55 accepted engineering pipe
   routes and 151 unresolved positive-bore connections; illustrative preview pipes remain explicitly unverified.
   Final pipe classes, hydraulic sizing, supports, penetrations, fire boundaries, equipment interfaces, lifting,
   removal and escape arrangements remain construction holds in the engineering review and work register.
5. **The hold forward of the engine room was empty.** Between Fr 28 and Fr 55 (z 14–27.5) the general arrangement had
   13.5 m of hull, 8 m wide and 2.1 m high under the car deck, down as "tanks and voids" holding 20 m³ of tanks: 260 m³
   of ship doing nothing, which no owner pays a yard for. Settled in 6q-1 as a yard would: the auxiliary machinery room
   (Fr 28–38, through a watertight sliding door in the engine room's forward bulkhead; the ballast and bilge manifold
   and the ballast pump over the ballast tanks, now in the double bottom under it; the sewage holding tank built in to
   port, out of the engine room; an escape trunk into casing S), the workshop and the engine store (Fr 38–45, through a
   door), and a reserve void forward (Fr 45–55). The watertight door is the rule's: the bulkhead is a subdivision
   bulkhead below the bulkhead deck, so the door slides, closes by hand at the door and from the wheelhouse, and is
   kept shut at sea (sheet 7). Open: the CO₂ covers the engine room only; the new rooms rely on their extinguishers and
   the detection heads, and the fan flat over the lower lobby (the 1.9 m between its deckhead at 5.5 m and the
   passenger deck at 7.4 m, 10 m long, which the arrangement had left unassigned) is designed as the engine-room fan
   room and will be built in 6q-2.
   **6q-3, the electrical workshop** (the creator, 2026-10-14, from his engine-room workshop diorama): the after 3.5 m
   of the reserve void (Fr 45–52) is the electrical workshop, reached through a door in the store's forward bulkhead;
   the void keeps 1.5 m as a cofferdam to the thruster room, the thruster's cable crossing in a tray, and the space
   under the floor plates is a void tank the fore peak's ballast line passes through. Fr 45 is taken as **not** a
   subdivision bulkhead (a plain door), so the workshop, the void and the store are one compartment in the damage
   cases still to be computed (finding 4): if those cases need a bulkhead there, the door becomes a sliding watertight
   door like Fr 28. Its second way out is an escape trunk to the open car deck beside the starboard lane; the trunk,
   its hatch and coaming are arranged but not yet detailed (an open item for the structural sheets). Its test panel
   (Johansson Marine JE-440T, SMA30 GS001) is a 2 kW consumer of the main board, used alongside at Minato on shore power,
   which moves the night condition from 10.3 to 11.0 kW (27.5 % of the 40 kW shore supply), and the machinery spaces'
   lighting by 0.12 kW. The sign on it reads 感電注意 (danger of electric shock): 440 V is low voltage in Japanese law,
   where 高圧 begins above 600 V AC. There is no porthole: the space is below her waterline.
4. **Stability**: intact stability curves (KN or GZ) and the damage cases the rules ask of a passenger ship (one
   compartment, with the car deck's free surface) are not computed yet; they need the weight estimate and the finer hull.

## The programme (in this order; each batch leaves the ship whole)

| Batch | Sheet(s) | What is built |
|---|---|---|
| D1 (built 2026-10-12) | 1, 1a, 1b, 2, 3, 3a, 4 | The generator, the lines, hydrostatics, GA, one-line, loads, tanks; finding 1 |
| D2 | weight estimate, 1b | Lightship by group and deadweight by condition in the data; draft, trim and KG by condition; the GM the ship really has |
| D3 | 1, 1a, 1b | The hull faired finer at the ends to the target block coefficient; the model follows; walked and photographed |
| D4 | 5 midship section, 5a scantlings | `FERRY_STRUCTURE`: frames, plating, stiffeners, deck loads, by rule; the section drawn |
| D5 | 6 shell expansion, 7 deck plans (structure) | Plates and seams, the car-deck grid of girders and pillars |
| D6 | 8 machinery arrangement, 9 piping | The engine room drawn to the data; one diagram per system |
| D7 | 10 fire-control and life-saving plans, 11 mooring | From `FERRY_SAFETY` and the mooring data |
| D8 | 12 stability booklet | Intact and damage stability, the loading conditions the master actually uses |
| D9 (built 2026-10-12) | 5, 6 | Engine room arrangement from the interior as built, with the equipment list; the fire control and safety plan, posted aboard |
| D9a (built 2026-10-12) | all | Every sheet framed as a yard drawing: border with zones, title block (yard, ship, drawing number JS-127-nn, scale, sheet, date, drawn/checked/approved, revision), wrapped notes, labels that fit, dimension lines, hatched sections (the creator, 2026-10-12: "The drawings don't look real and text overflowing") |
| D14 (6q-1, built 2026-10-13) | 7, 2, 4, 6 | The machinery spaces as a line of rooms on several levels (the creator, 2026-10-13: "The engine room should be several levels and have many rooms"): the auxiliary machinery room, the workshop and the engine store forward of the engine room through a watertight sliding door, walkable in the game with their machines, prompts and safety items; the ballast moved into the double bottom under them; finding 5 |
| D16 (6r-1, built 2026-10-13) | 5, 7 | The pipes built in 3D from the piping diagrams (the creator: "are pipes connected, do they lead to systems?"): every machine, tank stub and penetration of the machinery spaces anchored (`FERRY_INTERIOR.anchors`), every line between two of them routed as an orthogonal run in its system's colour and bore by `src/world/ferry-pipe-routes.js` (overhead lanes by system, bilge and oil mains under the plates, cross runs along the forward bulkheads, a machine's own circuit hugging it), drawn in the game and on the plans of sheets 5 and 7; 172 of 181 lines, the rest ending at a penetration to another deck; tested against the machines (`tests/ferry-pipes.test.mjs`) |
| D14b (6q-2) | 7 | The fan flat at 5.5 m over the lower lobby: the engine-room fans and their trunks down the casings, its ladder from the casing P landing and its hatch to the open deck; the `er-fans` load moves there |
| D14c (6q-3) | 5, 7 | The bilge level: the red tank top under the gratings, the bilge wells and their suctions, the sounding pipes, the shaft space seen through its manhole |
| D10 (built 2026-10-13) | 8.1–8.11 | Piping diagrams from `FERRY_PIPING` (the creator: "Make a piping diagram too, so all pipes are correct, and redundant motors so you can alternate"): eleven systems, 196 nodes and 210 lines with bores, every node tagged (KKS) and placed; every pumped service with two means (`FERRY_SERVICES`: duty and standby, alternated weekly): a second fuel transfer pump, compressor, hydrophore pump, sanitary pump and sewage pump added to the ship, the general-service pump standing by for either main engine's cooling and for the ballast, the fire and bilge pump for the bilge, the emergency fire pump outside the engine room; the engine-driven pumps' electric standbys. Open: the diagrams' pipe runs drawn in the engine room's model from the same data (the runs there are painted by system today) |
| D15 (built 2026-10-13) | 3, 3b, 3c | Electrical drawings from `FERRY_FEEDERS` (the creator: "electrical drawings for the ship … correct … with proper cabling"): the one-line with every source, board, transformer and feeder tagged; the feeder lists with full-load current, starter (star-delta over 7.5 kW), breaker (≥ 1.25 × FLA, standard ratings), marine cable by rating and by voltage drop (≤ 5 %) over its route, length and route; the cable schedule with KKS cable numbers. Open: control and alarm cabling (4501–5999), the motor starter schematics, the lighting circuits fixture by fixture |
| D17 (built 2026-10-13) | 3, 3a, 3b, 3c, 6 | The car deck's working fittings, from the creator's photographs and films of a working road ferry (he chose to keep her white and teal and take the fittings only): `FERRY_DECK_FITTINGS` in `ferry-model.js`. The vehicle barrier, two red-and-white leaves 0.7 m aft of the bow houses, shut across the lanes at sea and lifted upright onto the walkways when the ramp is down (a wall in the walk either way); a lane-signal post on each bow house with a board each way (lane 2, the truck's centre lane, lane 1) under three lamps, red at sea, green with the ramp down, and the four 500 W ramp floodlights of the `floodlights` load, drawn at last and lit for loading after dark; the lane signals as a consumer of their own on the lighting board (`lane-signals`, 0.18 kW, 10BRB10 GS020, cable 10BRB10 1016); red walkways outboard of the lanes forward of the casings; the four car-deck hydrants of the fire main (hCar1–4) drawn as valves with handwheel and brass coupling, aft on the casings by the hose boxes and forward on the bulwark with hose boxes of their own, and the safety plan corrected to them (it had three, at places the piping did not have); stainless exhaust pipes out of the funnels; 非常口 and 前に物を置かないでください on the engine room's escape door (`FERRY_DECK_SIGNS`). Views 18–20 and n5 in `tools/ferry-look.mjs`. The fittings cost 1 810 triangles and five meshes after trimming (the lamps, lenses and boards merged): the model is at 39 meshes of its 40, so the next moving part must share a mesh |
| D18 (6r-2, built 2026-10-13) | — | The plant runs (`src/world/ferry-plant.js`): every engine and motor-driven machine with a state, the duty/standby pairs, a chief's interlocks, the crew's day by the clock; the console's dials and alarm matrix, the prompts at 18 stations and her sound read it (`ferry-plant-controls.js`); the player starts, stops, changes over, isolates and opens machines (`tests/ferry-plant-game.test.mjs`) |
| D11 | 14 shafting and propeller | Shaft line, bearings, stern tube and seal, coupling, the propeller drawing (B-series section data), torsional check |
| D12 | 15 midship section, scantlings | Frames, plating, longitudinals, deck beams, pillars and bulkheads to a class rule (the ANYstructure DNV plate and girder tool is the reference), the lightship weight it gives feeding D2 |
| D13 | 16 ventilation, insulation, deck machinery | Engine-room air supply (the diesels' combustion air plus cooling), fire insulation classes, windlass and capstan foundations |

**Buildability (the creator, 2026-10-12: "one should be able to build a ship from the drawings a real functional and
floating ship").** Sheets 1–7 describe her form, her spaces, her electrics, her machinery arrangement and her machinery spaces level by level; they are not
yet a build set. A yard would also need D2 (the weights, so she floats at her marks), D3 (the hull faired to her
displacement), D10–D13 and D8, and the class approval of each. Every one of them is to be generated from data by
`tools/ferry-drawings.mjs`, as the sheets so far are, so the game, the book and the ship never disagree.

References the creator pointed to (2026-10-12): [ShipD](https://github.com/noahbagz/ShipD), 30 000 parametric hulls
(45 parameters, 49 feasibility constraints, hydrostatics at ten drafts, Michell wave drag) whose hull parameterisation
and constraints are the model for D3's fairing; the GitHub
[naval-architecture topic](https://github.com/topics/naval-architecture), where OpenHull and hullforge (parametric
hulls with hydrostatics, GZ stability and Michell resistance), ANYstructure (DNV plate, girder and cylinder design, for
D12) and the Wageningen B-series propeller tools (prop3d, propy_opt, for D11) are the tools to check our numbers
against; the King's College Ship-Design-Project (Simulink models of a ship and its control, for the engine control
later). ftShipBuilder is a Full Thrust tabletop ship builder, not naval architecture, and is not used.
