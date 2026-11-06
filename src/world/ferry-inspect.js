import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_MACHINERY,FERRY_ELECTRICS,FERRY_LOADS} from './ferry-ship.js';
import {FERRY_ENGINE_ROOM} from './ferry-interior.js';
import {JOHANSSON_MARINE} from './johansson-marine.js';

/**
 * What you can look at aboard the Minato Maru, and what it tells you (ferry batch 6c): each a point in her frame
 * (ferry-model.js), the prompt, the title and the words. The numbers are her own (ferry-ship.js), so a story about
 * a blackout or a fouled screw has the same ship under it that you walked through.
 */
const HALF=FERRY_SHIP.length/2,Z=zy=>zy-HALF,Y=yk=>yk-FERRY_SHIP.draft;
const CAR=Y(FERRY_HEIGHTS.carDeck),PASS=Y(FERRY_HEIGHTS.passengerDeck),BRIDGE=Y(FERRY_HEIGHTS.bridgeDeck),FP=FERRY_ENGINE_ROOM.floor;
const M=FERRY_MACHINERY,E=FERRY_ELECTRICS,FERRY_LOADS_SEWAGE_KW=FERRY_LOADS.find(l=>l.id==='sewage').kW;
const at=(id,pos,label,title,text,o={})=>Object.freeze({id,pos:Object.freeze(pos),label,title,text,reach:o.reach??null,facing:o.facing??null});

export const FERRY_INSPECT=Object.freeze([
 at('bicycles',[2.1,CAR+1.0,Z(3.3)],'Bicycle rack','Bicycle rack',
  'Two islanders’ bicycles, lashed in the rack: a bicycle rides free, and on Kitano-jima it is the way from the pier to the village. The baggage shelf opposite is for the shopping, and the orange lockers over it hold the lifejackets for this deck.'),
 at('fire-doors',[0,CAR+1.2,Z(12.0)],'Safety plan','Safety plan',
  'The lower lobby’s plan: the two sliding fire doors onto the lanes close by themselves on the alarm; the ways up are the stairs either side, the way below the engine room’s door under its red sign, and aft the crew’s door to the mooring station. Drivers use these stairs to the passenger lobby before departure; they return after all fast and wheel securing is removed.'),
 at('crew-door',[0,BRIDGE+1.3,Z(5.7)],'Crew door','Crew only',
  'The crew’s door from the bridge deck’s aft platform (up either ladder from the open deck). Their corridor runs forward between the cabins, the mess and the galley to the wheelhouse. The wheelhouse can also be reached from the walkways: a ladder at each walkway’s forward end climbs to the bridge wing and its door.'),
 at('main-engine',[1.55,FP+1.3,Z(10.8)],'Port main engine','Main engine, port: Johansson Marine '+JOHANSSON_MARINE.catalogue.main.model,
  `A Johansson Marine ${JOHANSSON_MARINE.catalogue.main.model}, one of two: ${M.mains.cylinders} cylinders in line, ${M.mains.bore} mm bore and ${M.mains.stroke} mm stroke, ${M.mains.kW} kW (${M.mains.ps} PS) at ${M.mains.rpm} rpm, turbocharged. ${M.mains.start}. ${M.mains.driven}. It burns ${M.mains.fuel}.`),
 at('gearbox',[1.55,FP+1.1,Z(9.2)],'Port gearbox','Johansson Marine '+JOHANSSON_MARINE.catalogue.gear.model+' reverse-reduction gear',
  `A Johansson Marine ${JOHANSSON_MARINE.catalogue.gear.model}: ${M.gears.kind}. ${M.gears.ratio} : 1, so the screw turns at ${M.propellers.rpm} rpm. ${M.propellers.why}. The shaft runs aft through the bulkhead to a ${Math.round(M.propellers.diameter*100)/100} m, ${M.propellers.blades}-bladed ${M.propellers.material.toLowerCase()} screw.`),
 at('main-engine-s',[-1.55,FP+1.3,Z(10.8)],'Stbd main engine','Main engine, starboard: Johansson Marine '+JOHANSSON_MARINE.catalogue.main.model,
  `The starboard ${JOHANSSON_MARINE.catalogue.main.model}, the twin of the port engine, turning the other way so the screws turn outward. Her No.4 crankcase door is off: the second engineer had a look at the cams and the big-end this morning and liked what he saw.`),
 at('crankcase',[-1.0,FP+.9,Z(11.0)],'Open crankcase','No.4 crankcase door, starboard engine',
  'The door is off and on a rag on the plates with its bolts. Inside, the camshaft and a lobe, the crank web below, everything wet with oil and the inside painted red so a leak shows. Feel the bearings for heat with the back of the hand; look for metal in the oil. The door goes back on before she sails.',{reach:1.6,facing:.6}),
 at('gearbox-s',[-1.55,FP+1.1,Z(9.2)],'Stbd gearbox','Johansson Marine '+JOHANSSON_MARINE.catalogue.gear.model+' reverse-reduction gear, starboard',
  `The starboard ${JOHANSSON_MARINE.catalogue.gear.model}. Inside, the pinion and the wheel and two multi-disc clutch packs, ahead and astern, in oil. A spare ahead pack lies on a pallet by the workbench: the port one chattered in April.`),
 at('generator-1',[1.4,FP+1.2,Z(12.6)],'No.1 generator','Generator No.1: Johansson Marine '+JOHANSSON_MARINE.catalogue.genset.model,
  `No.1 carries the ship in port today: ${E.generators.kVA} kVA at ${E.generators.rpm} rpm, the kW meter on the board reading a third of its load. The sets take turns, a week each, so their hours stay level.`),
 at('strainer',[3.5,FP+.6,Z(13.66)],'Sea-water strainers','Sea-water strainers',
  'The two sea chests’ strainers (the starboard chest’s suction crosses under the plates), each under a bolted cover: the cooling pumps draw through them. The basket comes out every Monday morning with the weed and the mussels and the odd flip-flop; the drain cock at the bottom and a bucket, then the cover back on and the valve opened before anything is started.',{reach:1.6}),
 at('compressor',[2.9,FP+.6,Z(9.1)],'Air compressor','Johansson Marine '+JOHANSSON_MARINE.catalogue.compressor.model+' starting-air compressor',
  `A two-stage V compressor on its motor, filling the two bottles behind it to 30 bar. It runs when the pressure falls and stops by itself; the drain under it is blown down each watch.`,{reach:1.6}),
 at('spare-clutch',[3.8,FP+.4,Z(10.2)],'Spare clutch pack','Spare clutch pack, JR-30 ahead',
  'The spare ahead clutch pack on its pallet, slung down the casing in April when the port gearbox chattered. It stays aboard as the spare now: the plates, the hub and the piston, in grease under the bench.',{reach:1.6}),
 at('generator',[-1.4,FP+1.2,Z(12.6)],'No.2 generator','Generator No.2: Johansson Marine '+JOHANSSON_MARINE.catalogue.genset.model,
  `A Johansson Marine ${JOHANSSON_MARINE.catalogue.genset.model} set: ${E.generators.kVA} kVA (${E.generators.kW} kW at ${E.generators.pf} power factor), ${E.generators.volts} V three-phase ${E.hz} Hz at ${E.generators.rpm} rpm, ${E.generators.amps} A. Its breaker trips on ${E.generators.trips}. One carries her at sea; both are on the board in narrow water, because the ${M.bowThruster.kW} kW bow thruster ${M.bowThruster.interlock.toLowerCase()}.`),
 at('switchboard',[-2.65,FP+1.3,Z(8.95)],'Main switchboard','Main switchboard',
  `${E.boards.MSB}. The system is ${E.distribution}. Lighting is ${E.lighting} V through ${E.transformers.lighting.count} × ${E.transformers.lighting.kVA} kVA transformers. ${E.preferenceTrip.why}.`),
 // The control console is a station of the plant now (ferry-plant-controls.js): its readings are live, not a note.
 at('pumps',[-3.4,FP+.9,Z(11.8)],'The pumps','Pumps',
  `Two ${M.fireMain.pumpKW} kW fire and general-service pumps (${M.fireMain.pumpM3h} m³/h at ${M.fireMain.pressure} MPa), the ${M.bilge.pumpKW} kW bilge pump (${M.bilge.pumpM3h} m³/h), the sanitary pump and the hydrophore set (${M.freshWater.hydrophoreKW} kW, a ${M.freshWater.pressureTank} L pressure tank). ${M.bilge.why}.`),
 at('air',[2.5,FP+1.0,Z(9.2)],'Starting air','Starting air',
  `The compressor fills two 150 L bottles to ${M.mains.start.match(/[\d.]+ MPa/)?.[0]||'3 MPa'}, air for the main engines’ and the generators’ starters; the compressor runs again when the pressure falls.`),
 at('service-tank',[-3.1,FP+1.2,Z(13.3)],'Fuel service tank','Fuel service tank',
  `A day’s fuel, settled and purified, for the engines and generators: A-heavy oil from the double-bottom tanks (${M.tanks.fuelStorage.join(' + ')} m³). The quick-closing valve under it can be shut from the CO₂ room if there is a fire down here.`,{reach:1.4}),
 at('purifier',[3.3,FP+1.0,Z(12.0)],'Fuel purifier','Fuel purifier',
  `A centrifuge that spins the water and sludge out of the fuel on its way to the service tank. The sludge goes to its ${M.tanks.sludge} m³ tank and ashore.`),
 // Forward of the engine room (6q): the watertight door, the auxiliary machinery room, the workshop and the store.
 at('wt-door',[0,FP+1.2,Z(14.0)],'Watertight door','Watertight sliding door, Fr 28',
  'The door between the engine room and the auxiliary machinery room, in the bulkhead that keeps a flooded hold to one compartment. It slides shut on its hand pump (thirty strokes, the lever beside it) or from the wheelhouse, and the rule is that it stays shut at sea: open now, alongside, so the oiler can get to the sounding pipes.',{reach:1.8}),
 at('ballast-manifold',[-3.5,FP+.9,Z(15.4)],'Ballast manifold','Ballast and bilge manifold',
  `Six valves on one header: ballast port and starboard (${M.tanks.ballast.port} m³ each, under these plates), the aft peak (${M.tanks.ballast.aftPeak} m³, which balances a truck forward), the engine-room and auxiliary-room bilges, and the overboard. The ballast pump beside it, or the fire and general-service pump through the sea-water run, moves the water; the bilges go through the separator first.`,{reach:1.8}),
 at('ballast-pump',[-3.5,FP+.6,Z(16.85)],'Ballast pump','Ballast pump: Johansson Marine '+JOHANSSON_MARINE.catalogue.gsPump.model,
  'A 3.7 kW sea-water pump on the manifold, run alongside: the forward tanks filled or emptied for the truck, the aft peak the other way, so she sits level on the ramp. Its sounding pipes are capped on the plates by the bulkhead.',{reach:1.6}),
 at('sewage-tank',[3.1,FP+1.2,Z(17.7)],'Sewage tank','Sewage holding tank, 4 m³',
  `Everything from the toilets is held here and pumped ashore at Minato after the last boat, through the deck connection on the car deck: nothing goes into the strait. The sight glass shows the level; the vent runs up the casing. The discharge pump (${FERRY_LOADS_SEWAGE_KW} kW) is beside it.`,{reach:1.8}),
 at('escape-aux',[-3.6,FP+1.3,Z(18.7)],'Escape trunk','Escape trunk to casing S',
  'The auxiliary machinery room’s second way out: a vertical ladder in its own trunk up through the car deck into casing S, the hatch above shut but never locked. The first way out is back through the watertight door and up the engine-room ladder.',{reach:1.8}),
 at('lathe',[3.5,FP+1.1,Z(20.2)],'Lathe','Johansson Machine Tools JL-400 centre lathe',
  'A 400 mm centre lathe bolted to her side, with its chuck, tailstock and leadscrew: bushes, studs and the odd shaft repair are turned here alongside rather than sent to Naha. The chips go in the tray under the bed, the swarf hook hangs on the headstock.',{reach:1.8}),
 at('drill',[2.55,FP+1.2,Z(19.8)],'Pedestal drill','Johansson Machine Tools JD-13 pedestal drill',
  'A 13 mm pedestal drill by the door, its table at bench height. The grinder is on the bench by the vice; the welding set stands against her side with its cables coiled.',{reach:1.6}),
 at('wiped-bearing',[1.6,FP+.9,Z(22.2)],'Wiped bearing','The wiped bearing shell',
  'The starboard engine’s No.3 main bearing, wiped in April when a lube-oil filter choked: the white metal smeared and run. It is kept on the bench for the surveyor, with the date, and the new shell has run two thousand hours since.',{reach:1.6}),
 at('spares',[-3.5,FP+1.0,Z(21.2)],'Spares rack','Engine store: the spares',
  'Filters, gaskets and seals, injectors, bearing shells, V-belts, lamps, hoses and touch-up paint, each box labelled and counted at the monthly inventory. What the yard’s list says she carries for a year away from a chandler, though Naha is a morning’s drive and a ferry.',{reach:1.8}),
 at('oil-drums',[-1.9,FP+.8,Z(22.2)],'Oil drums','Lubricating oil, two 200 L drums',
  `Two drums of SAE 40 on their rack with the taps over the drip tray: the engines’ sumps and the gearboxes are topped up from here, a can at a time, and the sump tank in the double bottom holds ${M.tanks.lubeOil} m³ more. Slung down the casing by the chain block on the deckhead.`,{reach:1.8}),
 at('emergency-generator',[1.9,BRIDGE+1.1,Z(7.6)],'Emergency generator','Emergency generator',
  `${E.emergency.kVA} kVA, on its own board. If the main board goes dead it starts by itself and is on load within ${E.emergency.onLoadWithin} s, for steering pump No.2, the emergency lighting, the radios and the emergency fire pump. ${E.emergency.why}. Its day tank holds ${E.emergency.dayTank} L, ${E.emergency.hours} hours.`),
 at('co2',[-2.0,BRIDGE+1.1,Z(8.3)],'CO₂ bottles','Fixed CO₂',
  `${M.co2.bottles} bottles of ${M.co2.kg} kg for the engine room: ${M.co2.why}. The release cabinet opens only with its key, and the alarm sounds below first so everyone gets out.`),
 at('wheel',[0,BRIDGE+1.2,Z(21.7)],'The wheel','Steering stand',
  `The wheel, the non-follow-up lever and the autopilot. Each rudder (${M.rudders.area} m²) turns ${M.rudders.angle}° either way: ${M.steering.hardOver}. Of her two steering pumps, ${M.steering.emergency.replace(/^No\.2/,'No.2')}.`),
 at('radar',[-.9,BRIDGE+1.3,Z(22.6)],'Radar and console','Radar and console',
  `The radar under its hood, the engine levers and the thruster lever at the centre (the same on both wing consoles, where the master berths her), the VHF, the echo sounder and the GPS. No electronic chart: the paper chart is on the table aft.`),
 at('chart',[-2.3,BRIDGE+1.1,Z(19.9)],'Chart table','Chart table',
  `The chart of the strait between Minato and Kitano-jima, the course pencilled in, the tide table and the log book. The fire-detection panel (${M.fireDetection.heads} heads in ${M.fireDetection.zones} zones) is on the bulkhead beside it.`),
 at('purser',[-2.5,PASS+1.3,Z(9.0)],'Purser’s window','Purser’s window',
  'Ticket rack, cash box, the punch, the microphone for the announcements, the first-aid kit and lost property. The return fare is ¥400.'),
 at('mess',[1.85,BRIDGE+1.1,Z(15.6)],'Mess room','Mess room',
  'A table for six. The duty board says who is on watch and who has the galley; the muster list says where everyone goes if the alarm rings.'),
 at('galley',[-2.0,BRIDGE+1.1,Z(14.6)],'The galley','Galley',
  'A three-plate range under its hood, the rice cooker, the fridge-freezer, the sink and the provision locker. The kiosk’s hot water comes from here too.'),
 // The electrical workshop, Fr 45–52 (ferry-interior.js): Tetsuo's, under contract, worked alongside at Minato on shore power.
 at('ew-bench',[1.9,FP+1.1,Z(25.1)],'Electrical bench','The electrical bench',
  `Tetsuo’s bench. On the anti-static mat, a contactor out of the steering-gear starter, waiting for new contacts; the yellow multimeter on its leads reads the bus: ${E.volts-4} V at ${E.hz} Hz, the 440 V system as it should be. The vice holds the bilge pump’s rewound stator, the soldering station is warm, and a can of J-Coffee keeps the place.`,{reach:1.6}),
 at('ew-scope',[3.0,FP+1.6,Z(25.6)],'Oscilloscope','Johansson Denki JS-20 oscilloscope',
  `Twenty megahertz, two channels, a green tube. On channel 1 the ship’s own ${E.hz} Hz through a probe divider, on channel 2 the shore supply at ${E.shore.volts} V: the two have to agree in frequency before the changeover, and here is where Tetsuo shows the oiler why.`,{reach:1.6}),
 at('ew-test-panel',[-3.05,FP+1.2,Z(25.3)],'Test panel','440 V test panel, Johansson Marine JE-440T',
  `Fed from the main switchboard: test sockets for 440 V three-phase, the ${E.lighting} V lighting and 24 V DC, each behind its own breaker, and an insulation meter of its own. Her system is insulated from earth (IT): one earth fault leaves everything running and lights an earth lamp, and a second one on another phase is a short circuit. So the insulation is tested, motor by motor, and written down.`,{reach:1.6}),
 at('ew-motor',[-3.1,FP+.6,Z(23.3)],'Motor under test','Ballast pump motor, 3.7 kW, in for its insulation test',
  'Out of the auxiliary room for its five-yearly test. Isolate, lock and tag, prove it dead, then the tester at 500 V between each winding and the frame: anything under 1 MΩ is a motor to dry out or rewind. This one read 220 MΩ, which goes in the book with the date.',{reach:1.6}),
 at('ew-escape',[-3.1,FP+1.2,Z(24.9)],'Escape trunk','Emergency escape',
  'The electrical workshop’s second way out: a trunk up to the open car deck beside the starboard lane, its door dogged by the red handwheel, which turns from either side, and a weathertight hatch at the top.',{reach:1.4}),
 at('ew-cable',[3.3,FP+.7,Z(23.25)],'Shore cable','The spare shore-power cable',
  `The ship’s spare shore cable on its drum: at night at Minato she lies on ${E.shore.kVA} kVA of shore power, ${E.shore.volts} V from the quay kiosk, transformed to 440 V aboard. If the cable at the box is ever cut by a lorry, this one goes out instead.`,{reach:1.6})
]);

/**
 * The way below (the creator, 2026-10-12: "I want to be able to go down in the engine room"): at the casing door a
 * prompt takes you down the ladder to the floor plates, and at its foot one brings you back up to the car deck. The
 * ladder can still be walked. `to` is where you stand after, in her frame, `yaw` the way you face (π looks forward).
 */
const ENGINE_DOOR_Z=(FERRY_ENGINE_ROOM.door[0]+FERRY_ENGINE_ROOM.door[1])/2;
export const FERRY_LADDER=Object.freeze({
 down:Object.freeze({at:Object.freeze([2.7,CAR+1.3,ENGINE_DOOR_Z]),label:'Down to the engine room',to:Object.freeze([3.575,FP,Z(8.9)]),yaw:Math.PI,
  note:'Down the ladder to the floor plates. Ear defenders on: two diesels run here.'}),
 up:Object.freeze({at:Object.freeze([3.575,FP+1.2,Z(9.1)]),label:'Up to the car deck',to:Object.freeze([2.9,CAR,ENGINE_DOOR_Z]),yaw:Math.PI/2,
  note:'Up the ladder and out through the casing door. Ear defenders off.'}),
});
