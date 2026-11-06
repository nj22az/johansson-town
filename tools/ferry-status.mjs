#!/usr/bin/env node
/**
 * The Minato Maru's status report (the creator, 2026-10-13: "I'm auditing the vessel, I'll give you CAD when I'm
 * done, please document current status of the vessel and engine particulars"): one document, generated from the ship's
 * data like every sheet of the design book, that says what she is, what her machines are, what is drawn, what is
 * built in the game, and what is still open, so an audit against the CAD has the same ship under it.
 *
 *   node tools/ferry-status.mjs            writes docs/minato-maru/STATUS.md
 *   tests/ferry-status.test.mjs            fails when the committed report no longer matches the data
 */
import {writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FERRY_SHIP,FERRY_MACHINERY,FERRY_ELECTRICS,FERRY_LOADS,FERRY_GA,FERRY_SAFETY,FERRY_CONDITIONS,FERRY_SUPPLY,FERRY_DAY,ferryDemand,ferrySupplyKW} from '../src/world/ferry-ship.js';
import {JOHANSSON_MARINE} from '../src/world/johansson-marine.js';
import {FERRY_PIPING,FERRY_SERVICES} from '../src/world/ferry-piping.js';
import {FERRY_FEEDERS,FERRY_BOARDS,electricalChecks} from '../src/world/ferry-electrical.js';
import {FERRY_INTERIOR} from '../src/world/ferry-interior.js';
import {createPlant} from '../src/world/ferry-plant.js';
import {PLANT_STATIONS} from '../src/world/ferry-plant-controls.js';
import {hydrostatics} from '../src/world/ferry-engineering-hydrostatics.js';

const S=FERRY_SHIP,M=FERRY_MACHINERY,E=FERRY_ELECTRICS,C=JOHANSSON_MARINE.catalogue;
const row=(...c)=>'| '+c.join(' | ')+' |';
const n1=x=>Math.round(x*10)/10;
const sum=a=>a.reduce((s,x)=>s+x,0);

/** The programme's rows from the README: which design batches are built and which are open. */
function programme(){
 const md=readFileSync(new URL('../docs/minato-maru/README.md',import.meta.url),'utf8');
 const rows=md.split('\n').filter(l=>/^\| D\d+/.test(l)).map(l=>{const c=l.split('|').map(s=>s.trim());return {id:c[1],sheets:c[2],what:c[3]};});
 return {built:rows.filter(r=>/built/.test(r.id)),open:rows.filter(r=>!/built/.test(r.id))};
}

export function statusReport(){
 const out=[];
 const H=hydrostatics({draftM:S.draft}),P=programme();
 const plant=createPlant({minutes:14*60});for(let t=0;t<14*60;t+=5){plant.routine(t);plant.tick(5);}plant.routine(14*60);
 const r=plant.readings();
 const byState={};for(const x of plant.machines.values())(byState[x.state]??=[]).push(x.name);
 out.push('# The Minato Maru: status of the vessel and engine particulars','',
  '**Revision B — for design review; construction not approved.** Johansson World game vessel, issued 2026-10-13. Generated from the ship\'s data by `node tools/ferry-status.mjs`',
  '(`tests/ferry-status.test.mjs` fails when this report no longer matches the data), so the numbers here are the ones the game, the',
  'drawings and the plant run on. Sources: `src/world/ferry-ship.js` (particulars, machinery, electrics, loads, safety), `ferry-model.js`',
  '(the loft), `ferry-interior.js` (the machinery spaces as built), `ferry-piping.js`, `ferry-electrical.js`, `ferry-plant.js`,',
  '`johansson-marine.js` (the fictional makers\' catalogue). The reviewed CAD and construction work register are linked from `cad-revb/index.html`. The yard\'s findings and historical programme are in `README.md`; the batches in `../FERRY-AUDIT.md`.','');
 // 1. Vessel
 out.push('## 1. The vessel','','| | |','|---|---|',
  row('Name, port of registry',`${S.name} (${S.jp}), ${S.registry}`),row('Owner',S.owner),row('Type',S.type),
  row('Built, refit',`${S.built}, ${S.yard}; ${S.refit}`),row('Rules, area',`${S.rules}; ${S.area}`),
  row('Length overall / between perpendiculars',`${S.length} m / ${S.lengthBP} m`),row('Breadth moulded / depth to car deck',`${S.beam} m / ${S.depth} m`),
  row('Draft laden / service; freeboard laden',`${S.draft} m / ${S.serviceDraft} m; ${S.freeboard} m`),row('Gross tonnage',String(S.grossTons)),
  row('Geometric displacement at the design immersion',`${S.displacement} t; numerical loft in seawater, not a verified loading condition`),
  row('Legacy lightship / operating target / payload target',`${S.lightship} t / ${S.assumedOperatingDisplacement} t / ${S.payloadPlanningTarget} t; unreconciled assumptions. ${S.deadweight} t is an arithmetic residual, not approved deadweight.`),
  row('Block coefficient / game-motion GM',`${S.blockCoefficient} on ${S.blockCoefficientLengthBasis}; ${S.gm} m motion parameter only, stability unverified`),
  row('Passengers / vehicles / crew',`${S.passengers} / ${S.vehicles} cars (or a truck and ${S.vehicleMix.trucksAndCars[1]} cars, or ${S.vehicleMix.keiTrucks} kei trucks; ${S.vehicleMix.axleTonnes} t axle, ${S.vehicleMix.clearHeight} m clear) / ${S.crew}`),
  row('Speed service / trial / manoeuvring / inside the breakwater',`${S.speed.service} / ${S.speed.trial} / ${S.speed.manoeuvring} / ${S.speed.breakwater} kn`),
  row('Colours',S.colours),'');
 out.push('### 1.1 The hull as lofted against the particulars (README finding 1: still open)','',
  '| | Particulars | From the loft at '+S.draft+' m |','|---|---|---|',
  row('Displacement',`${S.displacement} t geometric`,`${n1(H.displacementTonnes)} t`),
  row('Block coefficient on LBP 31 m',String(S.blockCoefficient),H.blockCoefficientLBP.toFixed(8)),
  row('Block coefficient on LOA 34.5 m','Separate length basis',H.blockCoefficientLOA.toFixed(8)),
  row('Waterplane area','—',`${H.waterplaneAreaM2.toFixed(2)} m²`),row('LCB from the transom','—',`${n1(H.lcbM)} m`),
  row('KB / BM_T / KM_T','—',`${H.kbM.toFixed(2)} / ${H.bmtM.toFixed(2)} / ${H.kmtM.toFixed(2)} m`),row('TPC','—',`${H.tpcTonnesPerCm.toFixed(2)} t/cm`),
  '',`The geometric particulars now match the numerical loft at the stated immersion and density 1.025 t/m³. The legacy weight targets remain unreconciled. Weight groups, loading cases, KG, free-surface corrections and intact/damage stability must establish a real operating condition before any hull revision or construction release.`,'');
 out.push('### 1.2 General arrangement','',`${FERRY_GA.length} spaces (sheet 2): `+FERRY_GA.map(g=>g.id).join(', ')+'.','',
  'Machinery spaces as built and walked (`ferry-interior.js`, sheets 5 and 7): the engine room (Fr 17–28) on three levels (tank top under the gratings, floor plates, upper grating), the control booth with the main switchboard, the auxiliary machinery room (Fr 28–38) through a watertight sliding door, the workshop and engine store (Fr 38–45), a void forward; the fan flat over the lower lobby is designed (6q-2) but not built.','');
 // 2. Machinery
 const m=M.mains,g=M.gears,p=M.propellers;
 out.push('## 2. Engine and machinery particulars','','Every machine is a Johansson Marine machine (CLAUDE.md: Johansson is this universe\'s Acme), built like the real marine machines of its day; its model number is in the catalogue and its numbers are the ship\'s own.','',
  '| | |','|---|---|',
  row('Main engines',`${m.count} × ${C.main.model}: ${m.kind}; ${m.cylinders} cylinders ${m.bore} × ${m.stroke} mm (${m.litres} L), ${m.kW} kW (${m.ps} PS) at ${m.rpm} rpm, mep ${m.mep} bar, ${m.tonnes} t each`),
  row('Starting',m.start),row('Engine-driven pumps',m.driven),row('Fuel',`${m.fuel}; firing pressure ${m.firing.idle} bar idle, ${m.firing.full} bar full; ${M.fuelPerCrossing} L a crossing, ${M.fuelPerDay} L a day`),
  row('Gearboxes',`${g.count} × ${C.gear.model}: ${g.kind}; ${g.ratio} : 1`),
  row('Shafting',`${M.shafts.count} × ${M.shafts.diameter*1000} mm; ${M.shafts.kind}`),
  row('Propellers',`${p.count} × ${p.blades}-bladed ${p.material.toLowerCase()} ${p.diameter} m, P/D ${p.pitchRatio}, ${p.pitch} pitch, ${p.rpm} rpm, turning ${p.turning}`),
  row('Rudders',`${M.rudders.count} × ${M.rudders.area} m², ${M.rudders.angle}°, ${M.rudders.kind.toLowerCase()}`),
  row('Steering gear',`${C.steering.model}: ${M.steering.kind}; ${M.steering.pumps} × ${M.steering.kW} kW; ${M.steering.hardOver}; ${M.steering.emergency}`),
  row('Bow thruster',`${C.thruster.model}: ${M.bowThruster.kW} kW, ${M.bowThruster.tunnel} m tunnel, ${M.bowThruster.thrust} kN, ${M.bowThruster.start} start; ${M.bowThruster.interlock.toLowerCase()}`),
  row('Starting air',`${C.compressor.count} × ${C.compressor.model}, ${C.compressor.spec}`),
  row('Fuel treatment',`${C.purifier.model} purifier, ${C.purifier.spec}; ${C.transferPump.count} × ${C.transferPump.model} transfer pumps`),
  row('Fire main',`${M.fireMain.pumps} × ${C.firePump.model} ${M.fireMain.pumpM3h} m³/h at ${M.fireMain.pressure} MPa (${M.fireMain.pumpKW} kW); emergency fire pump ${M.fireMain.emergencyKW} kW ${M.fireMain.emergencyM3h} m³/h; main DN ${M.fireMain.main}; hydrants car deck ${M.fireMain.hydrants.car}, passenger deck ${M.fireMain.hydrants.passenger}, bridge ${M.fireMain.hydrants.bridge}, engine room ${M.fireMain.hydrants.engine}`),
  row('Bilge',`${C.bilgePump.model} ${M.bilge.pumpM3h} m³/h (${M.bilge.pumpKW} kW); main DN ${M.bilge.main} (${M.bilge.why}); separator ${C.separator.model} ${C.separator.spec}`),
  row('Fixed fire fighting',`CO₂ ${M.co2.bottles} × ${M.co2.kg} kg for the engine room (${M.co2.why}); detection ${M.fireDetection.heads} heads in ${M.fireDetection.zones} zones, panel in the ${M.fireDetection.panel}`),
  row('Fresh water',`${C.hydrophore.model} hydrophore ${M.freshWater.hydrophoreKW} kW, ${M.freshWater.pressureTank} L tank, ${M.freshWater.cutIn}–${M.freshWater.cutOut} MPa; ${M.freshWater.perDay} m³ a day`),
  row('Ramp',`${C.rampPack.model}: ${M.ramp.pumps} × ${M.ramp.pumpKW} kW at ${M.ramp.pressure} MPa, ${M.ramp.cylinders} cylinders ${M.ramp.cylinderBore*1000} mm; up in ${M.ramp.up} s, down in ${M.ramp.down} s`),
  row('Anchors and mooring',`${M.anchors.count} × ${M.anchors.kg} kg ${M.anchors.kind}, ${M.anchors.chain.diameter} mm grade ${M.anchors.chain.grade} chain ${M.anchors.chain.length} m; ${C.windlass.count} × ${C.windlass.model} ${M.anchors.windlassKW} kW; ${C.capstan.model} ${M.anchors.capstanKW} kW; ${M.anchors.lines.count} × ${M.anchors.lines.length} m ${M.anchors.lines.kind} lines`),
  row('Tanks',`fuel ${M.tanks.fuel} m³ (storage ${M.tanks.fuelStorage.join(' + ')}, service ${M.tanks.fuelService}); fresh water ${M.tanks.freshWater}; sewage ${M.tanks.sewage}; bilge holding ${M.tanks.bilgeHolding}; sludge ${M.tanks.sludge}; lubricating oil ${M.tanks.lubeOil}; ballast fore peak ${M.tanks.ballast.forePeak}, aft peak ${M.tanks.ballast.aftPeak}, port ${M.tanks.ballast.port}, starboard ${M.tanks.ballast.starboard} m³ (sheet 4)`),'');
 out.push('### 2.1 Johansson Marine equipment list','','| Model | Machine | Specification | Fitted |','|---|---|---|---|');
 for(const c of Object.values(C))out.push(row(c.model,c.kind,c.spec,String(c.count)));
 out.push('');
 // 3. Electrical
 const gen=E.generators;
 out.push('## 3. Electrical particulars','','| | |','|---|---|',
  row('System',`${E.distribution}; lighting ${E.lighting} V through ${E.transformers.lighting.count} × ${E.transformers.lighting.kVA} kVA (${E.transformers.lighting.inUse} in use)`),
  row('Generators',`${gen.count} × ${C.genset.model} ${gen.kVA} kVA (${gen.kW} kW, pf ${gen.pf}) ${gen.volts} V ${gen.hz} Hz ${gen.rpm} rpm, ${gen.amps} A; breaker ${gen.breaker.frame} A frame set ${gen.breaker.setting} A; trips: ${gen.trips}`),
  row('Emergency generator',`${C.emergency.model} ${E.emergency.kVA} kVA (${E.emergency.kW} kW), on load within ${E.emergency.onLoadWithin} s as a game assumption; ${E.emergency.dayTank} L day tank with assumed ${E.emergency.hours} h endurance, unverified; ${E.emergency.why}`),
  row('Batteries',`${E.batteries.volts} V, banks: ${E.batteries.banks.join(', ')}; transitional ${E.batteries.transitionalMinutes} min`),
  row('Shore supply',`${E.shore.volts} V ${E.shore.phases}-phase ${E.shore.hz} Hz, ${E.shore.kVA} kVA (${E.shore.kW} kW), ${E.shore.transformer}; primary 200 V breaker ${E.shore.primaryBreaker} A frame / ${E.shore.primarySetting} A setting; secondary 440 V ${E.shore.breaker} A frame / ${E.shore.breakerSetting} A setting; ${E.shore.interlock}`),
  row('Switchboards',Object.entries(E.boards).map(([k,v])=>`${k}: ${v}`).join('; ')),
  row('Consumers',`${FERRY_LOADS.length} loads in the load analysis (sheet 3a), ${FERRY_FEEDERS.length} feeders with breakers and cables (sheets 3b, 3c)`),'');
 out.push('### 3.1 Load by condition (sheet 3a)','','| Condition | Supply | Demand | Load |','|---|---|---|---|');
 for(const c of FERRY_CONDITIONS){const s=FERRY_SUPPLY[c],d=ferryDemand(c),k=ferrySupplyKW(c);out.push(row(c,s.shore?'shore '+k+' kW':s.emergency?'emergency generator '+k+' kW':s.generators+' generator'+(s.generators>1?'s ':' ')+k+' kW',n1(d)+' kW',Math.round(d/k*100)+' %'));}
 const checks=electricalChecks();out.push('',`Source numerical consistency checks (`+'`electricalChecks()`'+`): ${checks.length?checks.join('; '):'zero mismatches in the implemented checks'}. Fault levels, selectivity, starting and installation engineering holds remain open.`,'');
 // 4. Piping
 out.push('## 4. Piping systems (sheets 8.1–8.11) and route status','','| System | Nodes | Lines | Duty / standby pairs |','|---|---|---|---|');
 for(const s of FERRY_PIPING){const sv=FERRY_SERVICES.filter(x=>x.system===s.id).map(x=>`${x.service}: ${x.duty} / ${x.standby}`);out.push(row(s.id,String(s.nodes.length),String(s.lines.length),sv.join('; ')||'—'));}
 const lines=sum(FERRY_PIPING.map(s=>s.lines.length));
 out.push('',`The graph contains ${lines} lines and ${Object.keys(FERRY_INTERIOR.anchors).length} machinery-space anchors. There are ${FERRY_INTERIOR.engineeringPipes.length} accepted engineering routes and ${FERRY_INTERIOR.pipeRouteIssues.length} unresolved positive-bore connections. The ${FERRY_INTERIOR.pipes.length} coloured game preview runs are illustrative and unverified; graph connectivity alone does not prove physical pipe routing. Every pumped service has two means in the source (${FERRY_SERVICES.length} pairs), with hydraulic capacity and installation verification still open.`,'');
 // 5. Safety
 const F=FERRY_SAFETY;
 out.push('## 5. Life-saving and fire safety (sheet 6)','',`${F.persons} persons; ${F.liferafts.count} liferafts × ${F.liferafts.persons} (serviced ${F.liferafts.serviced.toLowerCase().replace('naha','Naha')}); rescue boat ${F.rescueBoat.length} m for ${F.rescueBoat.persons} with a ${F.rescueBoat.outboard} hp outboard and a ${F.rescueBoat.davitKW} kW davit; extinguishers, hydrants, the CO₂ system, muster stations and escapes on the fire control and safety plan.`,'');
 // 6. The plant
 out.push('## 6. The plant as it runs in the game (6r-2)','',`The crew's day: shore power until ${fmt(FERRY_DAY.generators)}, No.1 generator on the board, the engines for the first boat at ${fmt(FERRY_DAY.inService)}, shore power again after the last at ${fmt(FERRY_DAY.shorePower)}; No.2 generator on the board for the thruster from the breakwater in and for the departure. At 14:00 alongside, replayed from midnight:`,'',
  '| State | Machines |','|---|---|');
 for(const [st,names] of Object.entries(byState))out.push(row(st,names.join(', ')));
 out.push('',`Readings at 14:00: board ${r.board.live?(r.board.shore?'on shore power':r.board.generatorsOnline+' generator(s) on the board, '+Math.round(r.board.kW)+' kW'):'dead'}; starting air ${r.air.map(a=>a.toFixed(0)).join(' / ')} bar; service tank ${Math.round(r.service*100)} %; fresh-water pressure ${r.fwPressure.toFixed(2)} MPa; alarms: ${r.alarms.length?r.alarms.join(', '):'none'}. The player works the plant at ${PLANT_STATIONS.length} stations (start, stop, standby, isolate and tag out, open for overhaul, breakers, change-overs); the console's dials, readout and alarm matrix read the plant.`,'');
 // 7. Programme
 out.push('## 7. The design programme: built and open','','### Built','','| Batch | Sheets | What |','|---|---|---|');
 for(const b of P.built)out.push(row(b.id,b.sheets,b.what));
 out.push('','### Open','','| Batch | Sheets | What |','|---|---|---|');
 for(const b of P.open)out.push(row(b.id,b.sheets,b.what));
 out.push('','## 8. Open findings and what the CAD audit should settle','',
  '1. **The hull and weights** (finding 1): numerical loft displacement is recorded (§1.1), while lightship and operating weight remain assumptions. Weight groups and loading/stability cases (D2, D8) must establish draft, trim, KG and GM.',
  '2. **No approved structure is drawn** (finding 2): midship scantlings (D12), shell expansion, deck plans (D5), machinery foundations and lifting structure need rule calculations and reviewed fabrication details. The CAD equipment envelopes are design references.',
  '3. **Shafting and propeller** (D11), **ventilation, insulation and deck machinery** (D13), **the stability booklet** (D8) are open.',
  '4. **The fan flat** (6q-2) and **the bilge level** (6q-3) of the machinery spaces are designed, not built; the CO₂ covers the engine room only (the new rooms rely on extinguishers and detection).',
  '5. **The plant** (6r-3): overhaul scenes (covers off, parts on the plates) when a machine is opened, the crew at the handles when the routine starts a machine, alarm acknowledge, the plant saved with the game; the starboard engine\'s open No.4 crankcase door (from the photographs) should follow the plant\'s state.',
  '6. **Lines beyond the machinery spaces** (hydrants on the car and passenger decks, the galley and toilets, the steering-gear room, the bow house) are on the diagrams but not yet built on their own decks.','',
  'Use the Revision B engineering review and construction work register for the full release holds, including supplier installation data, removal/escape paths, pipe classes and supports, electrical faults/selectivity/starting, flag/class basis and signed approval. Publication of the game and drawings does not close those holds.','');
 return out.join('\n');
}
const fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const url=new URL('../docs/minato-maru/STATUS.md',import.meta.url);writeFileSync(url,statusReport());console.log('wrote docs/minato-maru/STATUS.md');
}
