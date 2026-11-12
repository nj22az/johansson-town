import {FERRY_H1_ENABLED,FERRY_H1} from './ferry-engine-room-plan.js';
/**
 * The Minato Maru (みなと丸), Minato-chō's town ferry to Kitano-jima, as she is designed: what she
 * is, how she is laid out deck by deck, what drives her, what her switchboard feeds and what she
 * carries to save life (docs/FERRY-AUDIT.md §6; briefs/ferry-audit.md §2–§5).
 *
 * The creator chose the bigger ship and the bigger harbour (2026-10-11): a 199-ton class island car
 * ferry of 34.5 m, the size that worked 15–30 minute crossings in Okinawa in the 1990s, carrying
 * six cars (or an 8-tonne truck and two cars) and a hundred passengers. Her safe minimum is a skipper and an
 * engineer (FERRY_SAFE_MANNING); the eight posts still signed on are the town's people, who keep sailing with her.
 * Built in 1994 by Johansson Shipyard on Innoshima in the Seto Inland Sea (hull No. 127); refitted for GMDSS in 1998.
 *
 * Everything is data first, so the model (ferry-model.js, drawn from these numbers since batch 5), the
 * crew's routines (people/ferry-crew.js), stories and tests read the same ship.
 *
 * Frames, as a shipyard draws them: `z` metres forward of the transom (0 at the stern, 34.5 at the
 * stem), `y` metres above the keel (base line), `x` across the ship, + to port. toShip() gives the
 * model's frame (origin amidships at the waterline, +z forward).
 */
/** Integrated seawater displacement of the procedural hull at 1.9 m immersion.
 * This is geometry, not an approved loading or lightship measurement. */
const GEOMETRIC_DISPLACEMENT=375.41053;
export const FERRY_ENGINEERING_STATUS=Object.freeze({
 revision:'B',issue:'FOR DESIGN REVIEW',constructionApproved:false,
 hydrostatics:'Numerically integrated procedural loft; seawater density 1.025 t/m3',
 mass:'210 t legacy lightship and 283 t operating target remain unreconciled assumptions',
 stability:'GM 1.6 m drives game motion only; intact/damage stability not approved',
 machinery:'Fictional 1994 Johansson Marine plant; separate manufacturer references are comparisons only',
 structure:'No approved scantlings, welding or machinery foundation design',
 classification:'JG/NK descriptions are narrative setting, not evidence of real approval',
});
export const FERRY_SHIP=Object.freeze({
 name:'Minato Maru',jp:'みなと丸',built:1994,refit:'1998: GMDSS (VHF with DSC, EPIRB, SART, NAVTEX)',
 yard:'Johansson Shipyard (ヨハンソン造船), Innoshima, Seto Inland Sea: hull No. 127, an island ferry like the dozens before her',
 owner:'Minato-chō (the town ferry, a chōei ferī)',registry:'Minato',
 type:'Passenger ship and vehicle ferry (ryokakusen ken jidōsha tosen), bow ramp only, twin screw',
 rules:'Fictional narrative reference to Japanese inspection and NK class; no actual flag, class or construction approval has been obtained',
 area:'Limited coastal (gentei engan)',
 grossTons:199,
 length:34.5,lengthBP:31,beam:8.4,depth:3+(FERRY_H1_ENABLED?1:0),
 /** Draft at full load, and as she usually floats in service. */
 draft:1.9,serviceDraft:1.7,
 /** The car deck above the waterline at full load: depth less draft. */
 freeboard:1.1+(FERRY_H1_ENABLED?1:0),
 /** Tonnes: geometry displacement at the design immersion; legacy assumed
  * lightship and arithmetic residual are NOT certified deadweight/cargo limits.
  * The former 283 t operating target cannot float this loft at 1.9 m. */
 displacement:GEOMETRIC_DISPLACEMENT,blockCoefficient:.74026634,
 blockCoefficientLengthBasis:'LBP 31 m',lightship:210,deadweight:GEOMETRIC_DISPLACEMENT-210,
 assumedOperatingDisplacement:283,payloadPlanningTarget:73,massReconciled:false,
 passengers:100,vehicles:6,crew:8,
 /** What the car deck takes (batch 6f: 17.4 m of lanes forward of the lower lobby): six cars, or an 8-tonne truck and two cars, or eight kei trucks; 4.2 m clear under the passenger deck, 5 t an axle. */
 vehicleMix:Object.freeze({cars:6,trucksAndCars:Object.freeze([1,2]),keiTrucks:8,clearHeight:4.2,axleTonnes:5}),
 /** Knots. */
 speed:Object.freeze({service:11.5,trial:12.8,manoeuvring:3,breakwater:5}),
 /** Metres, game-motion parameter only; not a verified loaded metacentric height. */
 gm:1.6,
 colours:'White superstructure; white hull over red-brown antifouling with a teal sheer band (the ferry company’s colour on the Port Building); teal funnels with the town’s anchor mark',
});

/** Heights above the keel (m), deck by deck, and the points on the mast that the rules care about. */
export const FERRY_HEIGHTS=Object.freeze({
 tankTop:.7,floorPlates:.9,carDeck:3+(FERRY_H1_ENABLED?1:0),passengerDeck:7.4+(FERRY_H1_ENABLED?1:0),bridgeDeck:10+(FERRY_H1_ENABLED?1:0),compassDeck:12.4+(FERRY_H1_ENABLED?1:0),
 funnelTop:12+(FERRY_H1_ENABLED?1:0),mastheadLight:15+(FERRY_H1_ENABLED?1:0),mastTop:17+(FERRY_H1_ENABLED?1:0),bridgeEye:11.6+(FERRY_H1_ENABLED?1:0),
});

/** A shipyard point (x across, + port; y above the keel; z forward of the transom) in the model's frame. */
export const toShip=([x,y,z],ship=FERRY_SHIP)=>[x,y-ship.draft,z-ship.length/2];

const space=(id,deck,z,x,y,what,why,extra={})=>Object.freeze({id,deck,z:Object.freeze(z),x:Object.freeze(x),y:Object.freeze(FERRY_H1_ENABLED&&['engine-room','control-booth','aux-room','workshop','engine-store','electrical-workshop','void'].includes(id)?[y[0],FERRY_H1.deckhead]:y),what,why,...extra});
const H=FERRY_HEIGHTS,DECKHOUSE=6.8,BRIDGEHOUSE=6;
/**
 * The general arrangement, deck by deck: every space with where it is (z and x ranges, and its floor
 * and deckhead above the keel), what is in it and why it is there. Spaces that people work or sit in
 * name their ways out (`exits`, two at least, or one into a space with two); the rest are tanks, voids
 * and machinery reached from them (`unmanned` says why one way is enough).
 */
export const FERRY_GA=Object.freeze([
 // ---- Below the car deck (tank top 0.7 m, floor plates 0.9 m).
 space('aft-peak','hold',[14.1,15.4],[-3.9,3.9],[.10,.68],'Paired aft trim-ballast reservation under the auxiliary room: 2 m3 each. Curved outboard faces follow the hull minus 0.10 m geometric clearance; centreline gap 0.40 m; floor is at least 0.10 m above the loft. Gross 5.3916 m3, 4.8524 m3 after a provisional 10% structure allowance. This replaces the former tank outside the stern hull without crowding the fuel tanks.','Trim ballast; final framing and net tank calibration remain to be engineered',{within:'fwd-double-bottom',shape:'conformal-hull',capacityStatus:'planning reservation, not fabricated capacity'}),
 space('steering-gear','hold',[.3,2.6],[-3.5,3.5],[2.0,H.carDeck],'Steering-gear room: two rudder stocks, rams and tie bar; two 2.2 kW hydraulic power units; the emergency hand pump; the rudder-angle transmitter; the stern-tube oil header tanks; the 5.5 kW emergency fire pump with its own sea suction; a sound-powered telephone and the emergency steering notice','Steering, and a fire pump outside the engine room',{exits:['steering-gear-hatch','engine-room']}),
 space('fresh-water','hold',[2.6,5],[-3.6,3.6],[1.95,2.9],'Fresh-water tanks port and starboard, 6 m³ each, the stern tubes between them','Water for the taps, the galley and the toilets: 1.5 m³ a day'),
 space('engine-room','hold',[8.5,14],[-4,4],[H.floorPlates,2.8],'Engine room (batch 6c: from z 8.5, where the counter leaves room for floor plates): the two main engines (x ±1.55, z 9.6–12.0) with their gearboxes aft and turbochargers forward, the shafts aft through the bulkhead; the forward service band of the main engines extends to z 14.0; the two generators are in the auxiliary room; the control booth aft to starboard; fire and general-service pumps, bilge pump, sanitary pump, hydrophore set along the starboard side; the starting-air compressor and two 150 L air bottles against the aft bulkhead to port; the workbench, the fuel purifier and the oily-water separator along the port side; the 1.5 m3 fuel service tank in the forward starboard corner; the sea chests under the plates either side forward; CO₂ nozzles overhead; the watertight door forward on the centreline to the auxiliary machinery room','Propulsion and power. Low: 1.9 m clear, and tall men duck under the pipes',{exits:['er-stair-p','er-escape-s']}),
 space('control-booth','hold',[8.6,10.9],[-4,-2.35],[H.floorPlates,2.8],'Engine control booth (2.3 × 1.6 m, soundproofed, glazed towards the engines): the main switchboard on the aft bulkhead, the engine panel and the log desk along her side, the telephone to the bridge','Where the chief engineer stands his watch out of the noise',{exits:['engine-room'],within:'engine-room'}),
 space('er-double-bottom','hold',[8.5,14],[-4,4],[0,H.tankTop],'Double bottom under the engine room: fuel storage port and starboard (7.5 m3 each), bilge holding (1 m3), sludge (0.3 m3), lubricating oil (0.6 m3): total 16.9 m3 against 18.5526 m3 planning envelope after a 10% structure allowance. Individual tank partitions and calibration remain to be designed.','Fuel storage: calculated 9.23 days at the stated duty and 90% usable capacity, excluding idle and weather allowance'),
 space('shaft-space','hold',[5,8.5],[-3.5,3.5],[2.0,H.carDeck],'Shaft space aft of the engine room, over the counter: the two shafts from the gearboxes to the stern tubes, the fresh-water tanks’ fill and air pipes','The hull rises aft of z 10.5; the shafts run through here at a slope',{unmanned:'Reached through a manhole in the engine room’s aft bulkhead, for the shafts’ couplings'}),
 // Forward of the engine room (batch 6q, the creator, 2026-10-13: "The engine room should be several levels and have many
 // rooms"): the hold that was tanks and voids is the auxiliary machinery room, the workshop and the engine store, in a
 // line through a watertight sliding door at Fr 28 and a door at Fr 38; the ballast lives in the double bottom under them.
 space('aux-room','hold',[14,19],[-4,4],[H.floorPlates,2.8],'Auxiliary machinery room, through the watertight sliding door at Fr 28 (kept shut at sea, slid by its hand pump at the door or closed from the bridge): two generator sets relocated to z15.20-16.05 with a 1.00 m centre aisle and at least 1.035 m to side plant; the ballast and bilge manifold and the ballast pump along the starboard side over the tanks they serve, the sewage holding tank (4 m³) and its two discharge pumps to port with the standby pumps in a row before them (fuel transfer No.1 and No.2, hydrophore No.2, sanitary No.2), starting-air compressor No.2 in the aft starboard corner, the sounding pipes to the double bottom, the escape trunk in the forward starboard corner up into casing S','The hold forward of the engines was 13.5 m of tanks and voids; a yard puts the auxiliaries that want no watch here, out of the noise, with the ballast valves over their tanks',{exits:['engine-room','aux-escape-s']}),
 space('workshop','hold',[19,22.5],[-.4,4],[H.floorPlates,2.8],'Workshop, through the door at Fr 38: the bench and vice along the forward bulkhead, the JL-400 centre lathe along her side, the pedestal drill, the bench grinder, the welding set, the tool board; a wiped main-bearing shell on the bench, kept for the surveyor','Repairs alongside at a bench with room to swing a hammer: the engine room has only the small bench by the ladder',{exits:['aux-room','electrical-workshop']}),
 space('engine-store','hold',[19,22.5],[-4,-.4],[H.floorPlates,2.8],'Engine store, behind the mesh partition off the workshop: the spares racks (filters, gaskets and seals, injectors, bearings, belts, lamps), two 200 L lubricating-oil drums on their rack with a drip tray, the oily-rag bin, a chain block','Spares locked away from the car deck, next to the bench that fits them',{exits:['workshop'],unmanned:'A store: entered to fetch a part; its one door is the workshop’s, a step from the aux room'}),
 space('fwd-double-bottom','hold',[14,22.5],[-4,4],[0,H.tankTop],'Double bottom under the auxiliary room, workshop and store: paired trim tanks 2 m3 each at z14.1-15.4; main ballast port and starboard 8 m3 each at z15.6-20.0. These disjoint conformal reservations have 4.8524 and 16.4238 m3 respective planning envelopes after a 10% structure allowance. Unassigned reserve is not additional certified capacity.','Heel and trim, with capacities and framing subject to tank design'),
 // The electrical workshop (the creator, 2026-10-14: "Build Tetsuo's workshop on the ferry", from his engine-room workshop
 // diorama): the after 3.5 m of the reserve void, through a door in the store's forward bulkhead at Fr 45, which is not a
 // subdivision bulkhead (finding 5); its second way out the escape trunk to the open car deck. The void keeps 1.5 m forward.
 space('electrical-workshop','hold',[22.5,26],[-4,4],[H.floorPlates,2.8],'Electrical workshop, through the door at Fr 45 from the workshop: the bench along the forward bulkhead (the insulating mat, the multimeters, the insulation tester, the clamp meter, the oscilloscope and the bench supply on their shelf, the soldering station, the vice), the tool board over it; the 440 V test panel to starboard (fed from the main switchboard; test sockets for 440 V, 105 V and 24 V DC, its own insulation meter), its insulating mat in front of it; a motor in for its insulation test on a pallet; the spare shore-power cable on its drum; the thruster cable overhead in its tray; the escape trunk in the starboard forward corner','The ship’s electrics are looked after alongside at Minato, on shore power, by the town’s electrician under contract: a room for that work away from the noise, and where the motors come to be tested',{exits:['workshop','ew-escape-s']}),
 space('ew-double-bottom','hold',[22.5,26],[-4,4],[0,H.tankTop],'Double bottom under the electrical workshop: a void tank, kept empty; the fore peak’s ballast line runs through it aft to the manifold','Kept empty: no tank was ordered for it, and the ballast line needs a dry way through',{unmanned:'A void: manhole only'}),
 space('void','hold',[26,27.5],[-4,4],[0,2.8],'Void (a cofferdam) between the electrical workshop and the thruster room: the thruster’s cable passes through it in its tray; a manhole in the electrical workshop’s forward bulkhead','What is left of the reserve: a dry space between the workshop and the thruster room',{unmanned:'A void: manhole only'}),
 space('bow-thruster','hold',[27.5,30.5],[-2.75,2.75],[.6,2.8],'Bow-thruster room: the 75 kW motor on its 0.9 m tunnel, the starter cabinet','Berthing: it pushes the bow off and on',{exits:['thruster-hatch'],unmanned:'Nobody works in it at sea: it is visited alongside, with the thruster isolated, through its one hatch'}),
 space('fore-peak','hold',[30.5,34.5],[-2.5,2.5],[0,2.8],'Fore peak: 6 m³ of ballast, and the two chain lockers under the windlasses','Trim, and the anchors’ cables'),
 // ---- The car deck (3.0 m above the keel, 1.1 m above the water); covered by the passenger deck from z 0 to 23, open to the sky forward.
 space('aft-mooring','car',[0,2.5],[-4.1,4.1],[H.carDeck,H.passengerDeck],'Aft mooring station: the 5.5 kW capstan, two pairs of bitts, closed fairleads, the steering-gear hatch','Stern lines',{exits:['lower-lobby','casing-p']}),
 space('lower-lobby','car',[2.5,12.6],[-2.75,2.75],[H.carDeck,H.carDeck+2.5],'Lower lobby (batch 6f), the car deck’s level aft of the lanes, between the casings under a 2.5 m deckhead: the drivers’ waiting benches along the casings, the bicycle rack and the baggage shelf either side of the crew door in the aft bulkhead, a drink machine and the safety plan on the forward bulkhead, lifejacket lockers; the engine-room door (casing P) and its escape (casing S), the feet of both passenger stairs, the foyer from the gangway, the crew door aft to the mooring station, and two 1.1 m sliding fire doors forward onto the lanes','Where drivers pass between the vehicle deck and passenger stairs, the islanders’ bicycles ride, and every way below and above begins: the ways are found, not hunted for',{exits:['car-deck','stair-p','stair-s','er-stair-p','aft-mooring','foyer']}),
 space('car-deck','car',[12.6,30],[-2.75,2.75],[H.carDeck,H.passengerDeck],'Vehicle lanes, 17.4 m: two of 2.75 m, yellow lane lines and numbers, 24 cloverleaf lashing sockets on a 1.25 × 2.5 m grid, wheel-chock racks, six scuppers a side with flaps and freeing ports forward, waterproof tube lights, two exhaust fans, four hydrants, powder extinguishers; the signs “engine off” and “no entry to the car deck at sea”','Six cars; a truck on the centreline forward by the loading plan',{exits:['ramp','lower-lobby','casing-p','casing-s']}),
 // The gangway door is in the port casing, the side she lies to at Minato (port side to the outer pier); the
 // brief had it to starboard, which would have faced the open water there (batch 5).
 space('casing-p','car',[3,20],[2.75,4.1],[H.carDeck,H.passengerDeck],'Casing, port, 1.3 m wide: the engine uptake and engine-room supply-fan trunk (z 3–6.25), the engine-room entrance (6.3–7.4, a 1.1 m door) and ladder, passenger stair P (7.4–11.3, 1.2 m clear: its 1.2 m door onto the car deck at 11.35–12.55, the flight rising aft at 48° to the lobby, the crew changing room under it), the foyer at its foot (11.3–13.3) and the gangway passage (13.3–14.7, 1.4 m) with the gangway door and the shore-power box, a fan and a hydrant','The engine room’s main way in, a stair up for drivers, and the way aboard from the pier',{exits:['car-deck','foyer','stair-p']}),
 space('casing-s','car',[3,20],[-4.1,-2.75],[H.carDeck,H.passengerDeck],'Casing, starboard, 1.3 m wide: uptake trunk (z 3–6), the engine-room escape trunk (6–7), passenger stair S (7.4–12.6, 1.2 m clear, its 1.2 m door at 11.35–12.55; the bosun’s store under its flight: lashings, chocks, ropes, fenders), a fan and a hydrant','The engine room’s second way out, the deck stores, the second stair up',{exits:['car-deck','stair-s']}),
 space('foyer','car',[11.3,14.7],[2.75,4.1],[H.carDeck,H.passengerDeck],'The way aboard on foot, 1.4 m wide the whole way: the gangway, the gate, the passage through casing P and the foyer aft of it to the foot of stair P, 2.2 m under its deckhead','Foot passengers never step onto a car lane',{exits:['casing-p','stair-p','car-deck'],within:'casing-p'}),
 space('bow-house-p','car',[30,34],[2.2,4.1],[H.carDeck,H.carDeck+2.4],'Bow house, port: the windlass, the ramp’s hydraulic power pack and its control box, the thruster room’s hatch','Anchors and the ramp, worked by the bosun',{exits:['car-deck']}),
 space('bow-house-s','car',[30,34],[-4.1,-2.2],[H.carDeck,H.carDeck+2.4],'Bow house, starboard: the windlass and the paint store','Anchors, and paint kept away from the cabins',{exits:['car-deck']}),
 space('ramp','car',[34.3,40.3],[-2.2,2.2],[H.carDeck-.05,H.carDeck+.3],'The bow ramp: hinged at the stem (z 34.3), 4.0 m and a 2.0 m flap that lies flat on the landing, 4.4 m clear; two 100 mm hydraulic cylinders at 14 MPa; two locking pins with limit switches to the “ramp closed and locked” lamp on the bridge; a hand pump','Lowered, 5° to the quay; raised, it closes the bow 4 m high',{opening:true}),
 // ---- The passenger deck (7.4 m): the deckhouse z 6–23, 7.2 m wide, with 0.5 m walkways each side; the open deck aft.
 space('open-deck','passenger',[0,6],[-4.1,4.1],[H.passengerDeck,H.bridgeDeck],'Open deck: benches for 22 under an awning, one liferaft (port, aft), the rescue boat and its davit (starboard, aft), the stern flagstaff, two lifebuoys, the sign for muster station B','Fresh air, the view, and where people embark the liferafts',{exits:['lobby','platform-ladders'],seats:22}),
 space('lobby','passenger',[6,9.5],[-4.1,4.1],[H.passengerDeck,H.bridgeDeck],'Lobby, the deckhouse’s full breadth: the stair heads P and S in its wings; the purser’s window (S: ticket rack, cash box, punch, PA microphone, first-aid kit, lost property); the kiosk (P counter); the vending corner (two drink machines and a hot-water dispenser for cup noodles); timetable and fare boards; the capacity sign and the ship’s certificate; an ashtray stand by the aft door; a teak bench either side of the aft door (6 places)','Tickets and snacks; everyone passes through',{exits:['open-deck','stair-p','stair-s'],seats:6}),
 space('toilets','passenger',[9.5,11.5],[-3.4,3.4],[H.passengerDeck,H.bridgeDeck],'Toilets: men’s to port (a WC, two urinals, a basin), women’s to starboard (two WCs, a basin); sea-water flushing','',{exits:['lobby']}),
 space('carpet-room','passenger',[11.5,16.5],[-3.4,3.4],[H.passengerDeck+.3,H.bridgeDeck],'Passenger seating, on the old carpet-room platform (12 November 2026: a small ferry has no passenger cabins and nowhere to lie down): simple teak benches either side of the aisle, the shoe shelf at the step, a television on a bracket, life-jacket lockers, and the reading rack at the forward partition (the town paper, manga and paperbacks from Sakura); 38 places','A bench for twenty-two minutes, and the view when she lifts',{exits:['lobby','saloon'],seats:38}),
 space('saloon','passenger',[16.5,23],[-3.4,3.4],[H.passengerDeck,H.bridgeDeck],'Seated saloon: a cross passage at its aft end to the side doors and the crew stair’s door (z 16.5–17.7), then 34 reclining seats in terracotta moquette, 0.7 m a place with wooden arms and white head covers, in five rows at 0.88 m facing the bow (four a row each side, two to starboard beside the crew stair); a teak ledge under the six windows forward over the car deck and the sea; curtains at the side windows; a pothos from Sakura; the sign for muster station A (3 November 2026: seven rows of three at 0.85 m did not fit)','The forward view, and somewhere warm to do nothing for twenty-two minutes',{exits:['carpet-room','walkway-p','walkway-s'],seats:34}),
 space('crew-stair','passenger',[17.6,20.35],[-3.4,-2.04],[H.passengerDeck,H.bridgeDeck],'Crew stair to the wheelhouse: a straight flight 0.8 m clear, 13 risers of 0.2 m at 45°, in a trunk on the saloon’s starboard side behind a door marked 乗組員専用 (crew only) from the cross passage; its well rises through the master’s cabin’s outboard forward corner, walled off, into the wheelhouse’s aft starboard corner beside the wing door, railed (the owner, 3 November 2026)','The watch reaches the bridge from inside, out of the rain, and the master is a flight from the passengers',{within:'saloon',exits:['saloon','wheelhouse']}),
 space('walkway-p','passenger',[9.5,23],[3.4,4.1],[H.passengerDeck,H.bridgeDeck],'Side walkway, port, 0.7 m: rails, two liferafts in cradles outboard of the rail, a hydrant, and the ladder up to the bridge wing at its forward end (z 17.6–19.5)','Crew and escape',{exits:['saloon','wing-p']}),
 space('walkway-s','passenger',[9.5,23],[-4.1,-3.4],[H.passengerDeck,H.bridgeDeck],'Side walkway, starboard, 0.7 m: rails, two liferafts in cradles outboard of the rail, a hydrant, and the ladder up to the bridge wing at its forward end (z 17.6–19.5)','Crew and escape',{exits:['saloon','wing-s']}),
 // ---- The bridge deck (10.0 m): the deckhouse z 6–23, 6.0 m wide, a 0.9 m corridor down the middle and a crew stair to the lobby.
 space('eg-room','bridge',[6,9],[.45,3],[H.bridgeDeck,H.compassDeck],'Emergency-generator room: the 40 kVA emergency generator, the emergency switchboard, the 24 V batteries and their chargers, a 60 L day tank, louvres','Power when the main board is dead; its door opens to the open deck only',{exits:['open-deck']}),
 space('co2-room','bridge',[6,9],[-3,-.45],[H.bridgeDeck,H.compassDeck],'CO₂ room and fire-control station: four 45 kg CO₂ bottles, the release cabinet, the remote fan stops and fuel quick-closing valves, two firemen’s outfits','Fire in the engine room is fought from outside it; its door opens to the open deck only',{exits:['open-deck']}),
 // The old private cabins are one crew lounge (12 November 2026). The floor ids stay, so a walk, a save or a
 // quarter that still names a cabin lands in the right part of the open room.
 space('crew-cabin','bridge',[9,11.5],[.45,3],[H.bridgeDeck,H.compassDeck],'Crew lounge, aft port: a bench along the side. The bosun’s and the relief engineer’s old berths were here; nobody has a cabin','',{exits:['corridor','deckhand-cabin']}),
 space('mate-cabin','bridge',[9,11.5],[-3,-.45],[H.bridgeDeck,H.compassDeck],'Sitting alcove off the lounge, starboard aft: one bench. The chief officer’s cabin was here','',{exits:['corridor']}),
 space('deckhand-cabin','bridge',[11.5,14],[.45,3],[H.bridgeDeck,H.compassDeck],'Crew lounge, port, open into the mess: a bench. The deckhand’s cabin was here','',{exits:['corridor','crew-cabin','mess']}),
 space('crew-wc','bridge',[11.5,14],[-3,-.45],[H.bridgeDeck,H.compassDeck],'Crew WC and shower','',{exits:['corridor']}),
 space('mess','bridge',[14,16.5],[.45,3],[H.bridgeDeck,H.compassDeck],'Crew lounge, the table: a table for six, benches, a television, a kettle, the duty board and the muster list. Open aft and forward; there is no cabin bulkhead','Where the crew eat and the watch is handed over',{exits:['corridor','deckhand-cabin','chief-cabin']}),
 space('galley','bridge',[14,16.5],[-3,-.45],[H.bridgeDeck,H.compassDeck],'Pantry off the lounge: a three-plate range, the rice cooker, a fridge-freezer, a sink, a hood and the provision locker, open forward into the skipper’s corner','The cook’s; the kiosk’s hot water too',{exits:['corridor','master-cabin']}),
 space('chief-cabin','bridge',[16.5,19.5],[.45,3],[H.bridgeDeck,H.compassDeck],'Crew lounge, forward port: a settee and a writing table for the engineer between watches. Johansson’s home is with Thuan on Kitano-jima; this is not a cabin','',{exits:['corridor','mess']}),
 space('master-cabin','bridge',[16.5,19.5],[-3,-.45],[H.bridgeDeck,H.compassDeck],'Skipper’s corner of the lounge: the ship’s papers, a desk and the safe; the crew stair’s trunk walled off in its outboard forward corner. No bunk. Fujita sleeps on Shiosai','',{exits:['corridor','galley']}),
 space('corridor','bridge',[6,19.5],[-.45,.45],[H.bridgeDeck,H.compassDeck],'The crew’s corridor down the middle, from their own door aft onto the bridge deck’s platform (they come up the open deck’s ladders) to the wheelhouse, with the lounge open off it','The crew’s way to the lounge and to the bridge, apart from the passengers',{exits:['crew-door','wheelhouse']}),
 space('wheelhouse','bridge',[19.5,23],[-3,3],[H.bridgeDeck,H.compassDeck],'Wheelhouse: the steering stand (wheel, non-follow-up lever, autopilot); two engine levers and the thruster lever at the centre and on both wing consoles; the radar; the magnetic compass periscope; VHF with DSC; the ship’s telephone; the NAVTEX printer; the echo sounder; the GPS display; the chart table with its drawers and red lamp; the navigation-light panel; the fire panel; the PA and general alarm; the ramp lamps; the whistle button; the searchlight control; the wipers; a clock, a barometer, an inclinometer; the log desk; the master’s high chair','She is conned from here and from the wings',{exits:['corridor','wing-p','wing-s','crew-stair']}),
 space('wing-p','bridge',[19.5,23],[3,4.1],[H.bridgeDeck,H.compassDeck],'Bridge wing, port, open: a wing console with the engine and thruster levers, the port sidelight at its end','Berthing port side to',{exits:['wheelhouse','walkway-p']}),
 space('wing-s','bridge',[19.5,23],[-4.1,-3],[H.bridgeDeck,H.compassDeck],'Bridge wing, starboard, open: a wing console, the starboard sidelight at its end, the float-free EPIRB','Berthing starboard side to',{exits:['wheelhouse','walkway-s']}),
 // ---- The compass deck (12.4 m) and the mast.
 space('compass-deck','compass',[19.5,23],[-3,3],[H.compassDeck,H.mastTop],'Compass deck: the standard magnetic compass, the mast with the radar scanner on its platform, the masthead light at 15 m, the all-round lights, the whistle, the VHF and GPS antennas, the searchlight, the company flag','What she sees and is seen by'),
 space('funnel-p','passenger',[4,5.8],[2.9,3.8],[H.passengerDeck,H.funnelTop],'Funnel, port: the port main engine’s and No.1 generator’s exhausts','Twin funnels at the open deck’s forward corners, clear of the bridge-deck house',{within:'open-deck'}),
 space('funnel-s','passenger',[4,5.8],[-3.8,-2.9],[H.passengerDeck,H.funnelTop],'Funnel, starboard: the starboard main engine’s and No.2 generator’s exhausts','',{within:'open-deck'}),
]);
export const gaSpace=id=>FERRY_GA.find(s=>s.id===id)||null;
/** The ways out that are not spaces of their own: stairs, hatches and trunks between decks. */
export const FERRY_ACCESS=Object.freeze({
 'er-stair-p':'The engine room’s ladder up through a hatch in the car deck into casing P, its door at z 6.6–7.4','crew-door':'The crew’s door from the bridge deck’s aft platform into their corridor','er-escape-s':'Escape trunk from the engine room up into casing S',
 'steering-gear-hatch':'Hatch from the steering-gear room up to the aft mooring station','thruster-hatch':'Hatch from the thruster room up into the port bow house',
 'aux-escape-s':'Escape trunk from the auxiliary machinery room’s forward starboard corner (z 18.4–19) up into casing S','ew-escape-s':'Escape trunk from the electrical workshop’s starboard side (z 24.6–25.2) up to the open car deck beside the starboard lane, a weathertight hatch at its head; its door at the foot is dogged and opens from either side','wt-door-28':'The watertight sliding door at Fr 28 on the centreline, engine room to auxiliary machinery room: 0.8 × 1.9 m (full height under the deckhead, as the crew are tall), hand pump at the door, remote closing from the wheelhouse',
 'stair-p':'Passenger stair P, car deck to the lobby','stair-s':'Passenger stair S, car deck to the lobby',
 'platform-ladders':'Two ladders from the open deck up to the bridge deck’s aft platform (the emergency-generator and CO₂ rooms’ doors)',
});

/**
 * The car places: six in two lanes of three, nose to the ramp, sized for the longest vehicle the town
 * runs (4.9 m) with half a metre between them to lash; x the place's centre (+ port), z its centre
 * forward of the transom, in lanes of 2.75 m between the casings forward of the lower lobby (batch 6f).
 */
export const FERRY_CAR_PLACES=Object.freeze((()=>{
 const places=[];
 for(const lane of ['port','starboard'])for(let i=0;i<3;i++){const z=15.35+i*5.45;
  places.push(Object.freeze({lane,x:lane==='starboard'?-1.375:1.375,z,length:4.9,width:1.95}));}
 return places;
})());
/**
 * The loading plan with a truck: one 8-tonne truck on the centreline forward, where the deck is clear of the
 * casings and it trims her evenly instead of heeling her (a truck on one side heels her 3°; two side by side
 * would leave 0.25 m between them in lanes of 2.75 m: batch 6f), and two cars aft of it.
 */
export const FERRY_TRUCK_PLAN=Object.freeze({
 trucks:Object.freeze([Object.freeze({x:0,z:25.4,length:8.5,width:2.5})]),
 cars:Object.freeze([[-1.375,15.35],[1.375,15.35]].map(([x,z])=>Object.freeze({x,z,length:4.9,width:1.95}))),
});

/** What drives her (briefs/ferry-audit.md §3.1, §3.3). Real numbers for a ship of her size and year. */
export const FERRY_MACHINERY=Object.freeze({
 mains:Object.freeze({count:2,kW:460,ps:625,rpm:1350,cylinders:6,bore:160,stroke:200,litres:24,mep:17,tonnes:3,
  kind:'Four-stroke medium-speed marine diesel, six in line, turbocharged and intercooled',
  start:'Compressed air at 2.94 MPa (30 kgf/cm²) from two 150 L bottles',
  driven:'Each engine drives its own lubricating-oil, jacket-water and sea-water pumps: they run when the engine runs, with or without electricity, so a blackout does not stop the propellers',
  fuel:'A-heavy oil (A-jūyu) at 210 g/kWh',firing:Object.freeze({idle:27.5,full:67.5})}),
 gears:Object.freeze({count:2,ratio:3,kind:'Reverse-reduction gearbox with hydraulic multi-disc ahead and astern clutches; bridge control from the wheelhouse and both wings, emergency control in the engine room'}),
 shafts:Object.freeze({count:2,diameter:.11,kind:'Oil-lubricated stern tubes with lip seals; header tanks in the steering-gear room'}),
 propellers:Object.freeze({count:2,blades:4,diameter:1.45,pitchRatio:.8,rpm:450,pitch:'fixed',turning:'outward',material:'Aluminium bronze',
  why:'Fixed pitch, because the gears reverse: the small ferry’s choice of the period'}),
 rudders:Object.freeze({count:2,area:.75,angle:35,kind:'Behind each propeller'}),
 steering:Object.freeze({pumps:2,kW:2.2,kind:'Electro-hydraulic, two power units: one at sea, both in narrow water',hardOver:'35° one side to 30° the other in under 28 s',emergency:'No.2 is fed from the emergency switchboard; a hand pump and a telephone to the bridge'}),
 bowThruster:Object.freeze({kW:75,thrust:10,tunnel:.9,start:'star-delta',interlock:'May start only with two generators on the board'}),
 /** Explicit duty estimate: 22-minute crossing, 80% propulsion load,
  * 210 g/kWh, density 860 kg/m3; assumed generator load 65 kW at 260 g/kWh.
  * Twenty crossings/day, excluding idle and weather. Not measured consumption. */
 fuelPerCrossing:73.1031,fuelPerDay:1462.062,
 tanks:Object.freeze({fuel:15,fuelStorage:Object.freeze([7.5,7.5]),fuelService:1.5,freshWater:12,sewage:4,bilgeHolding:1,sludge:.3,lubeOil:.6,
  ballast:Object.freeze({forePeak:6,aftPeak:4,port:8,starboard:8})}),
 bilge:Object.freeze({main:65,pumpKW:3.7,pumpM3h:25,separatorM3h:.25,why:'The rule asks for 25 + 1.68·√(L(B+D)) millimetres: 57 for her'}),
 fireMain:Object.freeze({pumps:2,pumpKW:11,pumpM3h:40,pressure:.5,emergencyKW:5.5,emergencyM3h:20,main:65,
  hydrants:Object.freeze({car:4,passenger:2,bridge:1,engine:1}),hose:15,nozzle:12}),
 co2:Object.freeze({bottles:4,kg:45,grossVolume:190,why:'Provisional inventory screen only: 180 kg carried against an assumed 190 m3 protected volume. Actual fire boundaries, ducts, protected volumes, nozzle distribution and release interlocks require engineered verification'}),
 fireDetection:Object.freeze({heads:30,zones:6,volts:24,panel:'wheelhouse'}),
 freshWater:Object.freeze({hydrophoreKW:.75,pressureTank:300,cutIn:.25,cutOut:.35,perDay:1.5,why:'Filled every fifth morning from the town water lorry, which comes down from the power station yard (Tetsuo keeps the yard since the power house lost its keeper)'}),
 ramp:Object.freeze({pumps:2,pumpKW:5.5,pressure:14,up:60,down:45,cylinders:2,cylinderBore:.1,why:'One pump runs and one stands by; a hand pump if both fail'}),
 anchors:Object.freeze({count:2,kg:480,kind:'stockless',chain:Object.freeze({length:137.5,diameter:19,grade:2}),windlassKW:7.5,capstanKW:5.5,lines:Object.freeze({count:6,length:40,kind:'vinylon'})}),
});

/**
 * Her electrical system (§3.2): two diesel generators of 125 kVA (100 kW at 0.8 power factor),
 * 445 V three-phase 60 Hz, on an insulated (IT) main switchboard with earth lamps; 105 V lighting
 * through two 30 kVA transformers; an emergency generator of 40 kVA on its own board; 24 V batteries;
 * and 50 kVA of shore power at Minato at night, interlocked so it never runs with the generators.
 */
export const FERRY_ELECTRICS=Object.freeze({
 hz:60,volts:445,distribution:'440 V three-phase three-wire, insulated from earth (earth lamps and an insulation meter on the board)',lighting:105,
 generators:Object.freeze({count:2,kVA:125,kW:100,pf:.8,volts:445,hz:60,rpm:1800,amps:162,breaker:Object.freeze({frame:200,setting:170}),
  trips:'over-current, short-time, under-voltage and reverse power (about 10 %)'}),
 emergency:Object.freeze({kVA:40,kW:32,volts:445,hz:60,onLoadWithin:45,dayTank:60,hours:15,why:'Provisional continuous capacity only. Emergency fire-pump starting and voltage recovery require generator/AVR/governor transient validation; current comparison alone does not prove performance.'}),
 batteries:Object.freeze({volts:24,banks:Object.freeze(['starting','radio and emergency']),transitionalMinutes:30}),
 shore:Object.freeze({volts:200,phases:3,hz:60,kVA:50,kW:40,transformer:'50 kVA 200/440 V in the quay kiosk at Minato',breaker:80,breakerSetting:66,primaryBreaker:160,primarySetting:145,
  interlock:'Shore power and the generators never run together: the shore breaker and the generators’ breakers are interlocked',phaseLamp:true}),
 transformers:Object.freeze({lighting:Object.freeze({count:2,kVA:30,ratio:'440/105 V',inUse:1}),emergency:Object.freeze({kVA:5,ratio:'440/105 V'})}),
 boards:Object.freeze({MSB:'Main switchboard, in the engine control booth: DG1, synchronising (synchroscope, lamps, two kW meters, Hz, V, A, three earth lamps, insulation meter), DG2, two 440 V feeder panels, shore',
  LB:'105 V lighting board, fed through one of the two 30 kVA transformers',ESB:'Emergency switchboard, 440 V and 105 V sections, in the emergency-generator room: fed from the main board through a bus-tie, and from the emergency generator when the main board is dead'}),
 preferenceTrip:Object.freeze({stages:2,delay:5,why:'Before a generator is overloaded the board sheds what can wait: stage 1 the saloon air conditioning, the kiosk and the vending machines; stage 2 the galley and the water heater'}),
});

/**
 * The electric load analysis (電力調査表, §3.4): every consumer, where it is (a FERRY_GA space), its
 * board and supply, how many and how big, its current at full load, and what it draws in each of
 * the five conditions (kW): at sea, arriving and leaving, loading alongside, at night on shore
 * power, and in a blackout on the emergency generator. `trip` is its preference-trip stage.
 */
export const FERRY_CONDITIONS=Object.freeze(['sea','arrival','loading','night','blackout']);
const load=(id,name,where,board,supply,count,kW,amps,draw,why,trip=null)=>Object.freeze({id,name,where,board,supply,count,kW,amps,
 draw:Object.freeze(Object.fromEntries(FERRY_CONDITIONS.map((c,i)=>[c,draw[i]??0]))),why,trip});
const _=null;
export const FERRY_LOADS=Object.freeze([
 load('steer-1','Steering gear pump No.1','steering-gear','MSB','440',1,2.2,4,[1.8,2,.7],'One pump steers her at sea'),
 load('steer-2','Steering gear pump No.2','steering-gear','ESB','440',1,2.2,4,[_,2,_,_,2],'Both run in narrow water; No.2 is on the emergency board, so she steers in a blackout'),
 load('fire-1','Fire and general-service pump No.1 (star-delta)','engine-room','MSB','440',1,11,19.1,[],'Deck wash and ballast; and the fire main'),
 load('fire-2','Fire and bilge pump No.2 (star-delta)','engine-room','MSB','440',1,11,19.1,[],'The fire main; the bilges if the bilge pump cannot keep up'),
 load('bilge','Bilge pump','engine-room','MSB','440',1,3.7,6.8,[.4],'Pumped once a watch'),
 load('fire-emergency','Emergency fire pump','steering-gear','ESB','440',1,5.5,10.1,[_,_,_,_,5],'Fire with the main board dead'),
 load('er-fans','Engine-room supply fans','casing-p','MSB','440',2,3.7,6.8,[6.3,6.3,6.3],'The diesels breathe engine-room air'),
 load('car-deck-fans','Car-deck exhaust fans','casing-s','MSB','440',2,2.2,4,[_,3.7,3.7],'Cars start their engines under the passenger deck'),
 load('thruster','Bow thruster (star-delta, two-generator interlock)','bow-thruster','MSB','440',1,75,121.6,[_,60],'Pushes the bow off and on the berth'),
 load('windlass','Anchor windlass and warping heads','bow-house-p','MSB','440',1,7.5,13,[_,3],'Head lines on the warping heads at every berth'),
 load('capstan','Aft mooring capstan','aft-mooring','MSB','440',1,5.5,10.1,[_,2.2],'Stern lines'),
 load('ramp','Ramp power pack pump (one of two runs)','bow-house-p','MSB','440',2,5.5,10.1,[_,_,4.7],'A minute a lift; No.1 and No.2 alternate weekly'),
 load('compressor','Starting-air compressor No.1','engine-room','MSB','440',1,3.7,6.8,[.7,1.9,.7],'Refills the bottles after each start'),
 load('compressor-2','Starting-air compressor No.2','aux-room','MSB','440',1,3.7,6.8,[],'The second means of starting; alternates weekly with No.1 (6q-2)'),
 load('fuel-transfer','Fuel transfer pump No.1','aux-room','MSB','440',1,1.5,3.1,[.3,_,.2],'Storage to service tank'),
 load('fuel-transfer-2','Fuel transfer pump No.2','aux-room','MSB','440',1,1.5,3.1,[],'Alternates weekly with No.1'),
 load('purifier','Fuel purifier','engine-room','MSB','440',1,1.5,3.1,[.8,_,.3],'Water and dirt out of the A-oil'),
 load('lube-priming','Main-engine lubricating-oil priming pumps','engine-room','MSB','440',2,.75,1.5,[],'Before the first start of the day'),
 load('hydrophore','Fresh-water hydrophore pump No.1','engine-room','MSB','440',1,.75,1.5,[.2,.2,.2,.2],'Pressure on the taps'),
 load('hydrophore-2','Fresh-water hydrophore pump No.2','aux-room','MSB','440',1,.75,1.5,[],'Alternates weekly with No.1, from the auxiliary machinery room'),
 load('sanitary','Sanitary (sea-water flushing) pump No.1','engine-room','MSB','440',1,1.5,3.1,[.4,.4,.4,.2],'The toilets'),
 load('sanitary-2','Sanitary pump No.2','aux-room','MSB','440',1,1.5,3.1,[],'Alternates weekly with No.1'),
 load('sewage','Sewage discharge pump No.1','aux-room','MSB','440',1,1.5,3.1,[_,_,_,.4],'Ashore after the last boat'),
 load('sewage-2','Sewage discharge pump No.2','aux-room','MSB','440',1,1.5,3.1,[],'Alternate discharges'),
 load('separator','Oily-water separator','engine-room','MSB','440',1,.4,.8,[.2],'Bilge water cleaned before it goes overboard'),
 load('davit','Rescue-boat davit winch','open-deck','MSB','440',1,3.7,6.8,[],'Drills'),
 load('saloon-ac','Saloon package air conditioners','saloon','MSB','440',2,7.5,13,[12.8,12.8,9],'Okinawa: the saloon at 26 °C with a hundred aboard',1),
 load('range','Galley range','galley','MSB','440',1,6,7.9,[1.8,_,3,1.2],'Crew meals',2),
 load('water-heater','Water heater, 100 L','galley','MSB','440',1,3,3.9,[.9,_,.9,1.5],'The galley and the shower',2),
 load('chargers','24 V battery chargers','eg-room','MSB','440',2,1.5,2,[.9,.9,.9,.9],'Both banks kept full'),
 load('workshop','Workshop lathe, drill and grinder','workshop','MSB','440',3,.4,.8,[_,_,.1],'Repairs alongside'),
 load('electrical-workshop','Electrical workshop test panel: bench supply, soldering, motor tests','electrical-workshop','MSB','440',1,2,3.3,[_,_,_,.6],'The electrician’s work, alongside at Minato on shore power'),
 load('ballast','Ballast pump','aux-room','MSB','440',1,3.7,6.8,[],'Trims her for the truck, ten minutes between boats before it drives on: not in any condition’s total'),
 load('light-passenger','Lighting: saloon, carpet room, lobby, toilets, stairs','saloon','LB','105',1,2.36,25,[2.4,2.4,2.4,.2],''),
 load('light-car-deck','Lighting: car deck','car-deck','LB','105',1,.96,10.2,[.5,1,1,.2],''),
 load('light-engine','Lighting: engine room, steering-gear room, workshops','engine-room','LB','105',1,1.18,12.5,[1.2,1.2,1.2,.3],''),
 load('light-crew','Lighting: bridge, mess, galley, cabins','mess','LB','105',1,.42,4.4,[.2,.2,.3,.3],''),
 load('floodlights','Deck lights and ramp floodlights (6 × 100 W + 4 × 500 W)','car-deck','LB','105',1,2.6,27.5,[.6,2.6,2.6,.7],'Loading after dark'),
 load('searchlight','Searchlight','compass-deck','LB','105',1,1,9.5,[_,.5],'Finds the pier on the last boat'),
 load('bridge-electronics','Bridge electronics (radar, autopilot, echo sounder, GPS, NAVTEX, PA)','wheelhouse','LB','105',1,.75,7.9,[.8,.8,.4,.1],''),
 load('room-ac','Room air conditioners (bridge, mess, cabins)','mess','LB','105',4,1,11.2,[3,3,3,1.5],''),
 load('galley-appliances','Galley appliances (rice cooker, microwave, pot, fridge, hood)','galley','LB','105',1,4,38.1,[1.2,.4,1.6,1.2],'',2),
 load('kiosk','Kiosk (ice-cream freezer, showcase, hot water)','lobby','LB','105',1,1.9,18.1,[1.1,.9,1.1,.7],'Packaged Blue Coral cups and ferry snacks',1),
 load('vending','Drink vending machines','lobby','LB','105',2,.6,6.7,[.7,.7,.7,.7],'Canned coffee and tea',1),
 load('tv','Carpet-room television','carpet-room','LB','105',1,.08,.8,[.1,.1,.1],''),
 load('toilet-fans','Toilet exhaust fans','toilets','LB','105',2,.15,1.7,[.3,.3,.3,.1],''),
 load('lane-signals','Lane signals at the ramp (2 posts, a board each way, 3 LED lamps a board, 15 W a lamp)','car-deck','LB','105',1,.18,1.9,[.18,.18,.18],'Red at sea and while the ramp moves, green when it is down: drivers on the quay and on the deck know when to go; off at night on shore power'),
 load('emergency-light','Emergency lighting (one fitting in four, the escapes, the muster stations)','corridor','ESB','105',1,1.55,16.4,[_,_,_,_,1.6],'Inside the lighting above in normal service'),
 load('nav-lights','Navigation lights (7 × 60 W)','compass-deck','ESB','105',1,.42,4.4,[.4,.4,_,_,.4],'Masthead, sidelights, stern light, all-round lights'),
 load('emergency-radar','Radar and PA on the emergency supply','wheelhouse','ESB','105',1,.5,5.3,[_,_,_,_,.5],'Inside the bridge electronics normally'),
 load('emergency-charger','24 V emergency charger (radio, fire detection, alarm)','eg-room','ESB','440',1,.5,4.8,[_,_,_,_,.5],''),
]);
/** How each condition is supplied: generators on the board, shore power, or the emergency generator alone. */
export const FERRY_SUPPLY=Object.freeze({sea:Object.freeze({generators:1}),arrival:Object.freeze({generators:2}),loading:Object.freeze({generators:1}),night:Object.freeze({shore:true}),blackout:Object.freeze({emergency:true})});
/** What the boards supply in a condition, in kW (optionally one board, or without a preference-trip stage and above). */
export function ferryDemand(condition,{board=null,shedFrom=null}={}){
 if(!FERRY_CONDITIONS.includes(condition))throw new RangeError('Unknown ferry condition '+condition);
 return FERRY_LOADS.filter(l=>(!board||l.board===board)&&!(shedFrom&&l.trip&&l.trip>=shedFrom)).reduce((sum,l)=>sum+l.draw[condition],0);
}
export function ferrySupplyKW(condition){const s=FERRY_SUPPLY[condition],E=FERRY_ELECTRICS;return s.shore?E.shore.kW:s.emergency?E.emergency.kW:s.generators*E.generators.kW;}
/** The heaviest consumer's interlock: the bow thruster will not start on one generator. */
export const thrusterMayStart=generatorsOnline=>generatorsOnline>=2;
/** What the preference trip sheds at a stage in a condition (kW). */
export const preferenceShed=(condition,stage)=>FERRY_LOADS.filter(l=>l.trip&&l.trip<=stage).reduce((sum,l)=>sum+l.draw[condition],0);
/** Line current (A) of a three-phase load at 440 V, from kW, efficiency and power factor; a starter's multiple. */
export const motorAmps=(kW,eff=.9,pf=.85,volts=440)=>kW*1000/(Math.sqrt(3)*volts*eff*pf);

/**
 * Lifesaving and fire appliances (§4), for 108 persons at most (100 passengers and 8 crew).
 * The safety plan in the lobby and the muster list show the same.
 */
export const FERRY_SAFETY=Object.freeze({
 persons:108,
 liferafts:Object.freeze({count:5,persons:25,kind:'Throw-overboard inflatable liferafts in white canisters on cradles, each with a hydrostatic release unit, a painter and weak link, and an embarkation ladder',
  where:Object.freeze(['open-deck','walkway-p','walkway-p','walkway-s','walkway-s']),serviced:'Yearly in Naha'}),
 rescueBoat:Object.freeze({length:4,persons:6,outboard:15,davitKW:3.7,where:'open-deck',launch:'Under five minutes',why:'A rescue boat on a small passenger ship; also the island’s only boat with radar and a crew at night'}),
 lifebuoys:Object.freeze({count:8,perSide:4,withLightAndSmoke:2,withLine:2,line:27.5,lettered:'みなと丸 · 港町'}),
 lifeJackets:Object.freeze({adult:110,child:10,where:'Lockers in the saloon, the passenger benches and the lobby; the crew’s in the lounge'}),
 pyrotechnics:Object.freeze({rockets:4,handFlares:6,smoke:2,lineThrower:1,epirb:1,sart:1,portableVHF:3}),
 muster:Object.freeze({A:'saloon',B:'open-deck',alarm:'Seven short and one long blast on the whistle and the bells'}),
 extinguishers:Object.freeze({powder:Object.freeze({car:4,passenger:4,engine:4}),foam45:1,co2:Object.freeze(['wheelhouse','galley','eg-room','bow-house-s'])}),
 firemenOutfits:2,
 notices:Object.freeze(['Capacity: passengers 100, crew 8, in all 108','The safety leaflet in every seat pocket','How to put on a life jacket','No smoking','No entry to the car deck at sea','Drivers: engine off, parking brake on, transmission secured for the vehicle']),
});

/**
 * Safe manning for this small ferry (the owner, 12 November 2026: "Minato Maru only needs a crew of two,
 * an engineer and a skipper"). The skipper is the master. The engineer is the chief, and Mac takes that
 * watch when the chief is ashore. She can sail with these two: the skipper cons and counts, the engineer
 * keeps the plant and the ramp, and the shore hands take the lines.
 */
export const FERRY_SAFE_MANNING=Object.freeze([
 Object.freeze({post:'master',title:'Skipper',who:'The master (Fujita)'}),
 Object.freeze({post:'chief',title:'Engineer',who:'The chief engineer (Johansson), or Mac when he is ashore'}),
]);
/**
 * The company still signed on (§5, as the town plays her): eight posts, with the licences of the
 * period (海技士). people/ferry-crew.js signs the roster’s people on to them. The six besides the
 * skipper and the engineer are people of the town, with days and friendships; they are not deleted
 * by the smaller safe minimum, and the Chisum is not part of this town. The deck and machinery
 * departments still report to the master.
 */
export const FERRY_MANNING=Object.freeze([
 Object.freeze({post:'master',title:'Master',jp:'senchō',licence:'Fourth-grade deck officer (yon-kyū kaigishi, navigation)'}),
 Object.freeze({post:'mate',title:'Chief officer',jp:'ittō kōkaishi',licence:'Fifth-grade deck officer'}),
 Object.freeze({post:'chief',title:'Chief engineer',jp:'kikanchō',licence:'Fourth-grade engineer officer (yon-kyū kaigishi, engine)'}),
 // The post key stays `oiler` (tasks, scenarios and the safe-departure checks key on it); its title is Motorman, the
 // engine-room rating's (people/roster.js SHIP_POST_ALIASES maps `motorman` to it).
 Object.freeze({post:'oiler',title:'Motorman',jp:'kikan’in',licence:'Seafarer’s pocket ledger; the engine-room rating'}),
 Object.freeze({post:'bosun',title:'Bosun',jp:'kōhanchō',licence:'Seafarer’s pocket ledger'}),
 Object.freeze({post:'deck',title:'Deck hand',jp:'kōhan’in',licence:'Seafarer’s pocket ledger'}),
 Object.freeze({post:'purser',title:'Purser',jp:'jimuchō',licence:'Seafarer’s pocket ledger'}),
 Object.freeze({post:'cook',title:'Cook-steward',jp:'shichōchō',licence:'Seafarer’s pocket ledger; the kiosk'}),
]);

/**
 * Her natural roll period in seconds, by the IMO Intact Stability Code's estimate
 * T = 2·C·B/√GM with C = 0.373 + 0.023·B/d − 0.043·L/100: about 6 s for her, the short roll of a
 * small, stiff ferry. Her motion on the water (ferry.js shipMotion) rolls at the period of the hull
 * it moves (pass the hull's numbers).
 */
export function rollPeriod(ship=FERRY_SHIP){const C=.373+.023*ship.beam/ship.draft-.043*ship.lengthBP/100;return 2*C*ship.beam/Math.sqrt(ship.gm);}
/** Her natural pitch period, seconds: about 2.4·√draft for a small hull. */
export function pitchPeriod(ship=FERRY_SHIP){return 2.4*Math.sqrt(ship.draft);}
/**
 * Her day, town minutes past midnight (briefs/ferry-audit.md §5, §7): the chief engineer puts No.1
 * generator on the board at 06:10 and takes the shore power off; she is in service from 06:25, when
 * the engines are started, to the last boat back from Kitano-jima; at 23:10 the generators stop and the shore power goes
 * back on. Her engine sound and her lights follow it (ferry.js).
 */
export const FERRY_DAY=Object.freeze({generators:6*60+10,inService:6*60+25,shorePower:23*60+10});

/**
 * What goes wrong, and what the crew does (stories use these; people/ferry-crew.js says who). Each
 * step is a real action by a post (FERRY_MANNING) in a place (a FERRY_GA space, or the quay).
 */
export const FERRY_SCENARIOS=Object.freeze([
 Object.freeze({id:'blackout',title:'Blackout at the breakwater',cause:'No.2 generator’s fuel filter chokes on a dirty batch of A-oil just as the thruster starts for the berth; the preference trip sheds the saloon’s air conditioning, the kiosk and the vending machines, and then No.2’s breaker opens and the main board goes dark',
  steps:Object.freeze([
   ['chief','control-booth','Sees No.2’s frequency sag, the preference trip shed stage 1, then both breakers open: the main board is dead.'],
   ['master','wheelhouse','The emergency lights come on from the 24 V bank. The propellers keep turning, their pumps on the engines; the thruster and steering pump No.1 are gone. Slow ahead on both engines.'],
   ['chief','eg-room','The emergency generator starts on the dead bus and is on load within 45 seconds: steering pump No.2, the radar, the navigation lights and the PA come back.'],
   ['master','wing-s','Berths her on the engines and the rudders alone, without the thruster, and a long spring forward.'],
   ['oiler','engine-room','Changes No.2’s fuel filter and drains the service tank’s water while the chief brings No.1 back on the board.'],
  ])}),
 Object.freeze({id:'fouled-propeller',title:'A net round the starboard screw',cause:'A drifting fishing net wraps the starboard propeller off the breakwater; the starboard engine labours and is stopped',
  steps:Object.freeze([
   ['chief','control-booth','Feels the starboard shaft shudder, sees the exhaust go black and stops the starboard engine.'],
   ['master','wheelhouse','Brings her in on the port engine and the bow thruster, both generators on the board.'],
   ['bosun','aft-mooring','Doubles the lines at the berth: on one screw she cannot hold herself alongside.'],
   ['master','quay','Telephones the harbour master for a diver; Kōji knows the net by its floats.'],
  ])}),
 Object.freeze({id:'ramp',title:'The ramp will not come down',cause:'A hose on the ramp power pack bursts at Kitano-jima with two trucks waiting',
  steps:Object.freeze([
   ['bosun','bow-house-p','Stops the pack, closes the isolating valves and puts sand on the oil.'],
   ['chief','bow-house-p','Fits the spare hose from the engine-room stores.'],
   ['bosun','bow-house-p','Lowers the ramp on the hand pump, two hundred strokes, while the drivers count.'],
  ])}),
 Object.freeze({id:'shore-power',title:'The shore power the wrong way round',cause:'At 23:10 the shore cable is plugged in at the quay kiosk with two phases crossed after a repair: the phase-sequence lamp in the shore box shows them reversed, and every pump on the board would run backwards',
  steps:Object.freeze([
   ['oiler','casing-p','Sees the phase-sequence lamp lit the wrong way and does not close the shore breaker.'],
   ['chief','quay','Isolates and locks out the shore supply, verifies dead, and has two phases corrected at the kiosk plug by the authorised electrician; checks the phase sequence after re-energising.'],
   ['chief','control-booth','Opens the generator breaker first, verifies the main bus dead and the shore interlock permissive, then closes the shore breaker. Stops the unloaded generator after the shore supply is established; shore and generators are never paralleled.'],
  ])}),
]);

