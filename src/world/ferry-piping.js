import {FERRY_MACHINERY,FERRY_ELECTRICS} from './ferry-ship.js';
import {kks,KKS_F0} from './ferry-kks.js';
/**
 * The Minato Maru's piping, system by system (the creator, 2026-10-13: "Make a piping diagram too, so all pipes are
 * correct, and redundant motors so you can alternate"): every tank, pump, valve, strainer, cooler and consumer with
 * its KKS tag (ferry-kks.js), where it stands (a FERRY_GA space), and every line between them with its bore. The
 * design book draws one diagram per system from this (tools/ferry-drawings.mjs sheets 8.1–8.11), the loads
 * (ferry-ship.js FERRY_LOADS) name the same pumps, and the engine room's pipe runs are painted in these colours.
 *
 * Redundancy, as the rules and a chief engineer want it: every pumped service has two means. Where a pump is driven
 * by the engine it serves (lubricating oil, jacket water, sea water: they run when the engine runs, electricity or
 * not), an electric pump stands by or can be cross-connected; where a pump is electric, there is a second one, No.1
 * and No.2 on the same manifold, and the sets take turns a week each so their hours stay level (FERRY_SERVICES).
 *
 * Node kinds: tank, pump, valve, nrv (non-return), qcv (quick-closing), relief, strainer, filter, cooler, purifier,
 * separator, compressor, bottle, fan, engine, consumer, seachest, overboard, shore (a deck connection), manifold,
 * sensor, hydrant, nozzle, cabinet, silencer, funnel, well (a bilge well), drum. `c`, `r` place the node on the
 * diagram's grid (columns in the direction of flow, rows down the page). `drive` on a pump: 'motor' (its own electric
 * motor), 'engine' (driven by the engine it serves), 'hand'.
 */
const M=FERRY_MACHINERY,E=FERRY_ELECTRICS,F0=KKS_F0;
const node=(id,kind,label,where,tag,c,r,o={})=>Object.freeze({id,kind,label,where,tag,c,r,...o});
const line=(from,to,dn,note='')=>Object.freeze({from,to,dn,note});
const system=(id,name,fn,medium,colour,nodes,lines,notes=[])=>Object.freeze({id,name,fn,medium,colour,nodes:Object.freeze(nodes),lines:Object.freeze(lines),notes:Object.freeze(notes)});
const T=(fn,n,eq,no,o={})=>kks({fn,n,eq,no,...o});

/** The two main engines and the two generator engines, for the per-engine systems. */
const ENGINES=[['mainP','Port main engine',F0.mainP,'engine-room'],['mainS','Starboard main engine',F0.mainS,'engine-room'],['gen1','Generator No.1 engine',F0.gen1,'aux-room'],['gen2','Generator No.2 engine',F0.gen2,'aux-room']];

export const FERRY_PIPING=Object.freeze([
 // ---- 8.1 Fuel oil: bunkering, storage in the double bottom, transfer (two pumps), the purifier, the service tank, the engines.
 system('fuel','Fuel oil','EGC','A-heavy oil (marine distillate)','#8a6a3a',[
  node('bunker','shore','Bunkering connection, port car deck','car-deck',T('EGA',10,'AA',501),0,1),
  node('storeP','tank','Fuel storage P · '+M.tanks.fuelStorage[0]+' m³','er-double-bottom',T('EGB',10,'BB',1),1,0),
  node('storeS','tank','Fuel storage S · '+M.tanks.fuelStorage[1]+' m³','er-double-bottom',T('EGB',10,'BB',2),1,2),
  node('vP','valve','Suction P','engine-room',T('EGC',10,'AA',501),2,0),node('vS','valve','Suction S','engine-room',T('EGC',10,'AA',502),2,2),
  node('tp1','pump','Fuel transfer pump No.1 · 1.5 kW · 2 m³/h','aux-room',T('EGC',10,'AP',1),3,0,{drive:'motor',kW:1.5}),
  node('tp2','pump','Fuel transfer pump No.2 · 1.5 kW · 2 m³/h','aux-room',T('EGC',10,'AP',2),3,2,{drive:'motor',kW:1.5}),
  node('purifier','purifier','Fuel purifier JF-1 · 250 L/h','engine-room',T('EGD',10,'AT',1),4,1),
  node('sludge','tank','Sludge tank · '+M.tanks.sludge+' m³','er-double-bottom',T('EGD',10,'BB',2),4,2),
  node('service','tank','Service tank · '+M.tanks.fuelService+' m³ · gauge glass · level alarm','engine-room',T('EGD',20,'BB',1),5,1),
  node('overflow','valve','Overflow to storage P','engine-room',T('EGD',20,'AA',401),5,0),
  node('qcv','qcv','Quick-closing valve · wire pull from the CO₂ room','engine-room',T('EGD',20,'AA',201),6,1),
  node('lvl','sensor','Level alarm (FUEL LEVEL on the console)','engine-room',T('EGD',20,'CL',1),5,2),
  ...ENGINES.map(([id,label,f0,where],i)=>node('fuel-'+id,'engine',label+': filters, engine-driven feed pump, injection pumps',where,T('XJN',10,'AT',1,{f0}),7,i*.7)),
  node('return','valve','Return line to the service tank','engine-room',T('EGD',20,'AA',503),6,2.4),
 ],[
  line('bunker','storeP',50,'hose from the lorry; the filling line to each tank'),line('bunker','storeS',50),line('storeP','vP',25),line('storeS','vS',25),line('vP','tp1',25),line('vS','tp2',25),line('vP','tp2',25,'cross-suction'),line('vS','tp1',25),
  line('tp1','purifier',25),line('tp2','purifier',25),line('purifier','service',25),line('purifier','sludge',20,'sludge discharge'),line('service','overflow',32),line('overflow','storeP',32),line('service','qcv',20),
  line('qcv','fuel-mainP',20),line('qcv','fuel-mainS',20),line('qcv','fuel-gen1',15),line('qcv','fuel-gen2',15),line('fuel-mainP','return',15),line('fuel-mainS','return',15),line('return','service',15),
 ],['Transfer: No.1 and No.2 alternate weekly; either tank to either pump through the cross-suction.','Gravity from the service tank, 1.8 m over the engines’ pumps; the quick-closing valve is shut from outside the engine room before CO₂ is released.']),

 // ---- 8.2 Lubricating oil: each engine its sump, engine-driven pump, electric priming pump, filters and cooler; the storage tank and the drums.
 system('lube','Lubricating oil','XJV','SAE 40 engine oil','#b08a2a',[
  node('lostore','tank','Lubricating-oil storage · '+M.tanks.lubeOil+' m³ · hand pump','er-double-bottom',T('XJV',10,'BB',1),0,1),
  node('drums','drum','Two 200 L drums on their rack, drip tray and taps','engine-store',T('XJV',10,'BB',2),0,2.5),
  ...ENGINES.flatMap(([id,label,f0,where],i)=>{const r=i*1.1;return [
   node('sump-'+id,'tank',label+' sump',where,T('XJV',10,'BB',3,{f0}),2,r),
   node('lop-'+id,'pump','Engine-driven lube-oil pump',where,T('XJV',10,'AP',1,{f0}),3,r,{drive:'engine'}),
   ...(i<2?[node('prime-'+id,'pump','Priming pump · 0.75 kW (before the first start)',where,T('XJV',10,'AP',2,{f0}),3,r+.5,{drive:'motor',kW:.75})]:[]),
   node('lof-'+id,'filter','Duplex filter · changed by the hours',where,T('XJV',10,'AT',1,{f0}),4,r),
   node('loc-'+id,'cooler','Lube-oil cooler (sea water)',where,T('XJV',10,'AC',1,{f0}),5,r),
   node('bear-'+id,'consumer','Bearings, camshaft, turbocharger',where,T('XJA',10,'BR',1,{f0}),6,r),
   node('lop-'+id+'-p','sensor','LO pressure (LO PRESS on the console; shutdown)',where,T('XJV',10,'CP',1,{f0}),5,r+.5),
  ];}),
 ],[
  line('lostore','sump-mainP',20,'top-up by the hand pump'),line('lostore','sump-mainS',20),line('drums','sump-gen1',0,'a can at a time'),line('drums','sump-gen2',0),
  ...ENGINES.flatMap(([id],i)=>[line('sump-'+id,'lop-'+id,40),...(i<2?[line('sump-'+id,'prime-'+id,25),line('prime-'+id,'lof-'+id,25)]:[]),line('lop-'+id,'lof-'+id,40),line('lof-'+id,'loc-'+id,40),line('loc-'+id,'bear-'+id,40),line('bear-'+id,'sump-'+id,50,'drain to the sump')]),
 ],['Engine-driven pumps run with the engine, electricity or not; the priming pumps fill the galleries before the first start of the day (electrical load lube-priming).','The gensets have no priming pump: a hand pump on each.']),

 // ---- 8.3 Sea-water cooling: two sea chests, strainers, the crossover; each engine its own engine-driven pump, the general-service pump standing by; the coolers; overboard.
 system('seawater','Sea-water cooling','PAB','Sea water','#3f8a5a',[
  node('chestP','seachest','Sea chest P (high, under the plates)','engine-room',T('PAB',10,'AA',501),0,0),node('chestS','seachest','Sea chest S (low)','engine-room',T('PAB',10,'AA',502),0,2.2),
  node('strP','strainer','Strainer P · basket Mondays','engine-room',T('PAB',10,'AT',1),1,0),node('strS','strainer','Strainer S','engine-room',T('PAB',10,'AT',2),1,2.2),
  node('cross','manifold','Crossover: either chest to every pump','engine-room',T('PAB',10,'AA',503),2,1.1),
  ...ENGINES.flatMap(([id,label,f0,where],i)=>[node('swp-'+id,'pump',label+': engine-driven sea-water pump',where,T('PAB',20,'AP',1,{f0}),3,i*.8,{drive:'engine'}),
   node('cac-'+id,'cooler','Charge-air cooler',where,T('XJH',10,'AC',1,{f0}),4,i*.8),node('jwc-'+id,'cooler','Jacket-water cooler',where,T('XJG',10,'AC',1,{f0}),5,i*.8)]),
  node('gs','pump','General-service pump JP-32 · 11 kW · standby cooling through the crossover','engine-room',T('GAA',10,'AP',1),3,3.4,{drive:'motor',kW:11}),
  node('obP','overboard','Overboard P · non-return','engine-room',T('PAB',30,'AA',504),6,.4),node('obS','overboard','Overboard S · non-return','engine-room',T('PAB',30,'AA',505),6,2.0),
 ],[
  line('chestP','strP',65),line('chestS','strS',65),line('strP','cross',65),line('strS','cross',65),
  ...ENGINES.flatMap(([id],i)=>[line('cross','swp-'+id,i<2?50:32),line('swp-'+id,'cac-'+id,i<2?50:32),line('cac-'+id,'jwc-'+id,i<2?50:32),line('jwc-'+id,i%2?'obS':'obP',i<2?50:32)]),
  line('cross','gs',65),line('gs','cac-mainP',50,'standby to either main engine'),line('gs','cac-mainS',50),
 ],['Each engine cools itself as long as it runs; the general-service pump takes over either main engine’s cooling through the crossover if its own pump fails.','The lube-oil coolers (8.2) sit in the same sea-water run after the charge-air coolers.']),

 // ---- 8.4 Jacket (fresh) water: closed circuit on each engine.
 system('jacket','Jacket water','XJG','Fresh water with inhibitor','#4f7fb0',[
  ...ENGINES.flatMap(([id,label,f0,where],i)=>{const r=i*1.0;return [
   node('exp-'+id,'tank',label+': expansion tank with sight glass and low-level alarm',where,T('XJG',10,'BB',1,{f0}),0,r),
   node('jwp-'+id,'pump','Engine-driven jacket-water pump',where,T('XJG',10,'AP',1,{f0}),1,r,{drive:'engine'}),
   node('blk-'+id,'engine','Cylinder block, heads, turbocharger',where,T('XJA',10,'BR',2,{f0}),2,r),
   node('thermo-'+id,'valve','Thermostat · 82 °C',where,T('XJG',10,'AA',601,{f0}),3,r),
   node('jwc2-'+id,'cooler','Jacket-water cooler (sea water: 8.3)',where,T('XJG',10,'AC',1,{f0}),4,r),
   node('jwt-'+id,'sensor','Water temperature (WATER on the console; shutdown)',where,T('XJG',10,'CT',1,{f0}),3,r+.5),
  ];}),
 ],[
  ...ENGINES.flatMap(([id])=>[line('exp-'+id,'jwp-'+id,25,'static head'),line('jwp-'+id,'blk-'+id,50),line('blk-'+id,'thermo-'+id,50),line('thermo-'+id,'jwc2-'+id,50),line('jwc2-'+id,'jwp-'+id,50),line('thermo-'+id,'jwp-'+id,40,'bypass while cold')]),
 ],['No electric pump: the circuit lives and dies with its engine. Filled from the fresh-water system (8.8) through the expansion tank.']),

 // ---- 8.5 Bilge and ballast: the wells, the manifold, two pumps either way, the separator, the holding tank; the ballast tanks and their pump.
 system('bilge','Bilge and ballast','GMA','Bilge water · sea water','#2f6f74',[
  node('wellERP','well','Bilge well ER aft P','engine-room',T('GMA',10,'AA',501),0,0),node('wellERS','well','Bilge well ER aft S','engine-room',T('GMA',10,'AA',502),0,.6),
  node('wellAux','well','Bilge well aux room','aux-room',T('GMA',10,'AA',503),0,1.2),node('wellShaft','well','Shaft space','shaft-space',T('GMA',10,'AA',504),0,1.8),node('wellSG','well','Steering-gear room','steering-gear',T('GMA',10,'AA',505),0,2.4),
  node('manifold','manifold','Bilge and ballast manifold · six valves','aux-room',T('GMA',10,'AA',506),1,1.2),
  node('bp','pump','Bilge pump JP-25 · 3.7 kW · 25 m³/h','engine-room',T('GMA',20,'AP',1),2,.6,{drive:'motor',kW:3.7}),
  node('fbp','pump','Fire and bilge pump No.2 (8.6) · 11 kW','engine-room',T('SGA',10,'AP',2),2,1.8,{drive:'motor',kW:11}),
  node('emerg','valve','Emergency bilge suction on the port main engine’s sea-water pump','engine-room',T('GMA',10,'AA',507),2,3.0),
  node('ows','separator','Oily-water separator JO-15 · 0.25 m³/h · 15 ppm','engine-room',T('GNA',10,'AT',1),3,.6),
  node('ppm','sensor','15 ppm monitor · stops the overboard','engine-room',T('GNA',10,'CQ',1),4,0),
  node('hold','tank','Bilge holding tank · '+M.tanks.bilgeHolding+' m³','er-double-bottom',T('GMA',20,'BB',1),3,1.8),
  node('ob','overboard','Overboard · non-return · 15 ppm interlock','engine-room',T('GNA',10,'AA',504),5,.6),
  node('shoreB','shore','Shore connection (bilge, sludge) · car deck','car-deck',T('GMA',20,'AA',508),5,1.8),
  node('chest','seachest','Sea chest (8.3 crossover)','engine-room',T('PAB',10,'AA',503),0,3.6),
  node('balp','pump','Ballast pump JP-32 · 3.7 kW','aux-room',T('GHA',10,'AP',1),2,3.6,{drive:'motor',kW:3.7}),
  node('gs2','pump','General-service pump (standby, 8.3)','engine-room',T('GAA',10,'AP',1),2,4.3,{drive:'motor',kW:11}),
  node('balP','tank','Ballast P · '+M.tanks.ballast.port+' m³','fwd-double-bottom',T('GHA',20,'BB',1),4,3.3),node('balS','tank','Ballast S · '+M.tanks.ballast.starboard+' m³','fwd-double-bottom',T('GHA',20,'BB',2),4,3.9),
  node('aftpk','tank','Aft peak · '+M.tanks.ballast.aftPeak+' m³','aft-peak',T('GHA',20,'BB',3),4,4.5),node('forepk','tank','Fore peak · '+M.tanks.ballast.forePeak+' m³','fore-peak',T('GHA',20,'BB',4),4,5.1),
 ],[
  line('wellERP','manifold',50),line('wellERS','manifold',50),line('wellAux','manifold',50),line('wellShaft','manifold',40),line('wellSG','manifold',40),
  line('manifold','bp',65),line('manifold','fbp',65),line('emerg','bp',65,'direct suction, no separator: only to save the ship'),line('bp','ows',25),line('bp','hold',65),line('fbp','ob',65,'fire-and-bilge pump straight overboard: emergencies only'),
  line('ows','ppm',25),line('ppm','ob',25),line('ows','hold',25,'oil and dirty water back to the tank'),line('hold','shoreB',50),
  line('chest','balp',65),line('chest','gs2',65),line('balp','manifold',65),line('gs2','manifold',65),line('manifold','balP',65),line('manifold','balS',65),line('manifold','aftpk',50),line('manifold','forepk',50),line('manifold','ob',65,'ballast discharge'),
 ],['The bilge main is 65 mm (25 + 1.68·√(L(B+D))); branches 50 and 40. Two pumps on it, and the emergency suction on a main engine’s pump.','Bilge water goes overboard only through the separator and its 15 ppm monitor; in port it goes to the holding tank and ashore.']),

 // ---- 8.6 Fire main and fixed CO₂.
 system('fire','Fire main and CO₂','SGA','Sea water · CO₂','#c2412f',[
  node('fchest','seachest','Sea chests (8.3 crossover)','engine-room',T('PAB',10,'AA',503),0,.6),
  node('fp1','pump','Fire and GS pump No.1 JP-40 · 11 kW · 40 m³/h at 0.5 MPa','engine-room',T('SGA',10,'AP',1),1,0,{drive:'motor',kW:11}),
  node('fp2','pump','Fire and bilge pump No.2 JP-40 · 11 kW','engine-room',T('SGA',10,'AP',2),1,1.2,{drive:'motor',kW:11}),
  node('efchest','seachest','Own sea suction, steering-gear room','steering-gear',T('SGA',20,'AA',501),0,2.4),
  node('efp','pump','Emergency fire pump · 5.5 kW · 20 m³/h · emergency switchboard','steering-gear',T('SGA',20,'AP',1),1,2.4,{drive:'motor',kW:5.5}),
  node('iso','valve','Isolating valve: the engine room cut off, the emergency pump feeds the rest','steering-gear',T('SGA',30,'AA',502),2,1.2),
  node('main','manifold','Fire main · 65 mm · '+M.fireMain.pressure+' MPa','car-deck',T('SGA',30,'BR',1),3,1.2),
  ...[['hER','Hydrant engine room','engine-room',511],['hCar1','Hydrant car deck P aft','car-deck',512],['hCar2','Hydrant car deck S aft','car-deck',513],['hCar3','Hydrant car deck P fwd','car-deck',514],['hCar4','Hydrant car deck S fwd','car-deck',515],['hPassP','Hydrant passenger deck P','walkway-p',516],['hPassS','Hydrant passenger deck S','walkway-s',517],['hBridge','Hydrant bridge deck','wing-p',518]].map(([id,label,where,no],i)=>node(id,'hydrant',label+' · 15 m hose · 12 mm nozzle',where,T('SGA',30,'AA',no),4,i*.5)),
  node('isc','shore','International shore connection · port car deck','car-deck',T('SGA',30,'AA',519),4,4.2),node('wash','valve','Deck wash and anchor wash','bow-house-p',T('SGA',30,'AA',520),4,4.8),
  node('co2b','bottle',M.co2.bottles+' × '+M.co2.kg+' kg CO₂','co2-room',T('SGJ',10,'BB',1),0,5.6),node('co2rel','cabinet','Release cabinet · key · alarm first','co2-room',T('SGJ',10,'CH',1),1,5.6),
  node('co2v','valve','Main valve · opened by the cabinet','co2-room',T('SGJ',10,'AA',201),2,5.6),node('co2n','nozzle','Six nozzles under the engine-room deckhead','engine-room',T('SGJ',10,'BR',1),3,5.6),
  node('co2al','sensor','CO₂ alarm and fan stop before release','engine-room',T('SGJ',10,'CH',2),4,5.6),
 ],[
  line('fchest','fp1',65),line('fchest','fp2',65),line('efchest','efp',65),line('fp1','main',65),line('fp2','main',65),line('efp','iso',65),line('iso','main',65),
  ...['hER','hCar1','hCar2','hCar3','hCar4','hPassP','hPassS','hBridge','isc','wash'].map(id=>line('main',id,id==='isc'?65:50)),
  line('co2b','co2rel',0,'wire'),line('co2rel','co2v',25,'pilot'),line('co2b','co2v',40),line('co2v','co2n',40),line('co2rel','co2al',0,'electric: the alarm sounds and the fans stop'),
 ],['Three pumps: two in the engine room, one outside it on the emergency board with its own sea suction, so a fire in the engine room never takes the fire main with it.','CO₂: '+M.co2.why+'.']),

 // ---- 8.7 Compressed air: two compressors, two bottles, the engines’ starting valves, a service-air reducing station.
 system('air','Starting and service air','SCA','Compressed air · 30 bar / 7 bar','#4f8fb0',[
  node('c1','compressor','Starting-air compressor No.1 JC-30 · 3.7 kW','engine-room',T('SCA',10,'AN',1),0,0,{drive:'motor',kW:3.7}),
  node('c2','compressor','Starting-air compressor No.2 JC-30 · 3.7 kW','aux-room',T('SCA',10,'AN',2),0,1.2,{drive:'motor',kW:3.7}),
  node('b1','bottle','Air bottle No.1 · 150 L · 30 bar','engine-room',T('SCA',20,'BB',1),1,0),node('b2','bottle','Air bottle No.2 · 150 L · 30 bar','engine-room',T('SCA',20,'BB',2),1,1.2),
  node('sv1','relief','Safety valve 33 bar','engine-room',T('SCA',20,'AA',901),2,-.5),node('sv2','relief','Safety valve 33 bar','engine-room',T('SCA',20,'AA',902),2,1.7),
  node('dr1','valve','Drain (blown down each watch)','engine-room',T('SCA',20,'AA',401),1,.5),node('dr2','valve','Drain','engine-room',T('SCA',20,'AA',402),1,1.7),
  node('pr','sensor','Pressure switch: start at 25, stop at 30 bar','engine-room',T('SCA',20,'CP',301),2,.6),
  node('dist','manifold','Starting-air main · 30 bar','engine-room',T('SCB',10,'BR',1),3,.6),
  ...ENGINES.map(([id,label,f0,where],i)=>node('start-'+id,'valve',label+': air-start valve and distributor',where,T('XJJ',10,'AA',201,{f0}),4,i*.6)),
  node('red','valve','Reducing station 30 → 7 bar · service air','engine-room',T('SCB',20,'AA',1),4,2.8),
  node('svc','consumer','Service air: the workshop, the whistle, the horn','workshop',T('SCB',20,'BR',1),5,2.8),
 ],[
  line('c1','b1',20),line('c2','b2',20),line('c1','b2',20,'either compressor to either bottle'),line('c2','b1',20),line('b1','sv1',15),line('b2','sv2',15),line('b1','dr1',10),line('b2','dr2',10),line('b1','pr',10),
  line('b1','dist',25),line('b2','dist',25),...ENGINES.map(([id],i)=>line('dist','start-'+id,i<2?25:15)),line('dist','red',15),line('red','svc',15),
 ],['Two compressors and two bottles: the rule asks for two means of starting; each bottle starts a main engine six times from cold.','Compressor No.1 and No.2 alternate weekly on the pressure switch.']),

 // ---- 8.8 Fresh (drinking) water: filling, two tanks, two hydrophore pumps, the pressure tank, the taps.
 system('freshwater','Fresh water','GKA','Drinking water','#5aa0d8',[
  node('fill','shore','Filling connection · the town water lorry from the power station yard','car-deck',T('GKA',10,'AA',501),0,.6),
  node('fwP','tank','Fresh-water tank P · '+M.tanks.freshWater/2+' m³','fresh-water',T('GKA',10,'BB',1),1,0),node('fwS','tank','Fresh-water tank S · '+M.tanks.freshWater/2+' m³','fresh-water',T('GKA',10,'BB',2),1,1.2),
  node('hp1','pump','Hydrophore pump No.1 · '+M.freshWater.hydrophoreKW+' kW','engine-room',T('GKB',10,'AP',1),2,0,{drive:'motor',kW:M.freshWater.hydrophoreKW}),
  node('hp2','pump','Hydrophore pump No.2 · '+M.freshWater.hydrophoreKW+' kW','aux-room',T('GKB',10,'AP',2),2,1.2,{drive:'motor',kW:M.freshWater.hydrophoreKW}),
  node('ptank','tank','Pressure tank · '+M.freshWater.pressureTank+' L · '+M.freshWater.cutIn+'–'+M.freshWater.cutOut+' MPa','engine-room',T('GKB',10,'BB',1),3,.6),
  node('psw','sensor','Pressure switch (cut in, cut out)','engine-room',T('GKB',10,'CP',301),3,1.4),
  node('heater','cooler','Water heater · 100 L · 3 kW','galley',T('GKB',20,'AC',1),4,1.4),
  node('galley','consumer','Galley · kiosk hot water','galley',T('GKB',20,'BR',1),5,0),node('toilets','consumer','Toilets’ basins · crew WC and shower','toilets',T('GKB',20,'BR',2),5,.8),node('expfill','consumer','Expansion tanks (8.4) · the ER tap','engine-room',T('GKB',20,'BR',3),5,1.6),
 ],[
  line('fill','fwP',40),line('fill','fwS',40),line('fwP','hp1',32),line('fwS','hp1',32),line('fwP','hp2',32),line('fwS','hp2',32),line('hp1','ptank',32),line('hp2','ptank',32),line('ptank','psw',10),
  line('ptank','galley',20),line('ptank','toilets',20),line('ptank','heater',15),line('heater','galley',15,'hot'),line('heater','toilets',15,'hot'),line('ptank','expfill',15),
 ],['Two pumps on one pressure tank, alternating; '+M.freshWater.perDay+' m³ a day for the taps.']),

 // ---- 8.9 Sanitary (sea-water flushing) and sewage: two sanitary pumps, the toilets, the holding tank, two discharge pumps, the deck connection.
 system('sewage','Sanitary water and sewage','GQA','Sea water · sewage','#7a756a',[
  node('schest','seachest','Sea chest (8.3 crossover)','engine-room',T('PAB',10,'AA',503),0,0),
  node('sp1','pump','Sanitary pump No.1 JP-15 · 1.5 kW','engine-room',T('GHB',10,'AP',1),1,0,{drive:'motor',kW:1.5}),node('sp2','pump','Sanitary pump No.2 JP-15 · 1.5 kW','aux-room',T('GHB',10,'AP',2),1,.8,{drive:'motor',kW:1.5}),
  node('flush','consumer','Flushing: three WCs, two urinals, the crew WC','toilets',T('GHB',10,'BR',1),2,.4),
  node('htank','tank','Sewage holding tank · '+M.tanks.sewage+' m³ · sight glass · vent up the casing','aux-room',T('GQA',10,'BB',1),3,.4),
  node('dp1','pump','Sewage discharge pump No.1 JP-15 · 1.5 kW','aux-room',T('GRA',10,'AP',1),4,0),node('dp2','pump','Sewage discharge pump No.2 JP-15 · 1.5 kW','aux-room',T('GRA',10,'AP',2),4,.8),
  node('deck','shore','Deck connection to the quay’s sewage truck · after the last boat','car-deck',T('GRA',10,'AA',501),5,.4),
  node('ob2','overboard','Overboard · blanked and sealed (never inside the strait)','aux-room',T('GRA',10,'AA',502),5,1.2),
 ],[
  line('schest','sp1',32),line('schest','sp2',32),line('sp1','flush',32),line('sp2','flush',32),line('flush','htank',100,'gravity'),line('htank','dp1',50),line('htank','dp2',50),line('dp1','deck',50),line('dp2','deck',50),line('dp1','ob2',50),
 ],['Nothing goes into the strait: the tank is pumped to the truck at Minato; the overboard is sealed with the inspector’s seal.']),

 // ---- 8.10 Exhaust gas: each engine through its turbocharger and silencer up the casing to its funnel.
 system('exhaust','Exhaust gas','XJR','Exhaust gas · 400 °C','#6f7476',[
  ...ENGINES.flatMap(([id,label,f0,where],i)=>[node('tc-'+id,'engine',label+': turbocharger turbine',where,T('XJB',10,'BR',1,{f0}),0,i),
   node('sil-'+id,'silencer','Silencer and spark arrester',where,T('XJR',10,'BS',1,{f0}),1,i),node('temp-'+id,'sensor','Exhaust temperature (EXHAUST on the console)',where,T('XJR',10,'CT',1,{f0}),.5,i+.45)]),
  node('funP','funnel','Funnel P: port main engine and generator No.1','funnel-p',T('XJR',20,'BR',1),3,.5),node('funS','funnel','Funnel S: starboard main engine and generator No.2','funnel-s',T('XJR',20,'BR',2),3,2.5),
 ],[
  line('tc-mainP','sil-mainP',200),line('sil-mainP','funP',200,'lagged, up casing P'),line('tc-gen1','sil-gen1',125),line('sil-gen1','funP',125),
  line('tc-mainS','sil-mainS',200),line('sil-mainS','funS',200,'lagged, up casing S'),line('tc-gen2','sil-gen2',125),line('sil-gen2','funS',125),
 ],['Lagged with mineral wool under stainless cladding; no exhaust pipe within 0.6 m of a fuel line.']),

 // ---- 8.11 Hydraulics: steering (two power units and the hand pump), the ramp (two pumps and a hand pump).
 system('hydraulics','Hydraulics: steering and ramp','XSA','Hydraulic oil · 14 MPa','#d0652a',[
  node('hpu1','pump','Steering power unit No.1 · '+M.steering.kW+' kW','steering-gear',T('XSA',10,'AP',1),0,0,{drive:'motor',kW:M.steering.kW}),
  node('hpu2','pump','Steering power unit No.2 · '+M.steering.kW+' kW · emergency board','steering-gear',T('XSA',10,'AP',2),0,1,{drive:'motor',kW:M.steering.kW}),
  node('hand','pump','Hand pump','steering-gear',T('XSA',10,'AP',3),0,2,{drive:'hand'}),
  node('hvalve','valve','Solenoid valve block (follow-up, non-follow-up)','steering-gear',T('XSA',10,'AA',201),1,.5),
  node('rams','consumer','Two rams on the tiller and tie bar · '+M.rudders.angle+'°','steering-gear',T('XSA',10,'BR',1),2,.5),
  node('htank','tank','Oil tank · 60 L · level switch','steering-gear',T('XSA',10,'BB',1),1,2),
  node('rp1','pump','Ramp pump No.1 · '+M.ramp.pumpKW+' kW','bow-house-p',T('XSB',10,'AP',1),0,3.5,{drive:'motor',kW:M.ramp.pumpKW}),
  node('rp2','pump','Ramp pump No.2 · '+M.ramp.pumpKW+' kW','bow-house-p',T('XSB',10,'AP',2),0,4.5,{drive:'motor',kW:M.ramp.pumpKW}),
  node('rhand','pump','Hand pump','bow-house-p',T('XSB',10,'AP',3),0,5.5,{drive:'hand'}),
  node('rvalve','valve','Control valve block · up, down, hold','bow-house-p',T('XSB',10,'AA',202),1,4.5),
  node('cyl','consumer','Two cylinders · '+M.ramp.cylinderBore*1000+' mm · '+M.ramp.pressure+' MPa','ramp',T('XSB',10,'BR',1),2,4.5),
  node('pins','consumer','Two locking pins · limit switches to the bridge lamp','ramp',T('XSB',10,'AA',203),2,5.5),
  node('rtank','tank','Oil tank · 120 L','bow-house-p',T('XSB',10,'BB',1),1,6),
 ],[
  line('htank','hpu1',20),line('htank','hpu2',20),line('htank','hand',15),line('hpu1','hvalve',15),line('hpu2','hvalve',15),line('hand','hvalve',15),line('hvalve','rams',15),line('rams','htank',20,'return'),
  line('rtank','rp1',25),line('rtank','rp2',25),line('rtank','rhand',15),line('rp1','rvalve',20),line('rp2','rvalve',20),line('rhand','rvalve',15),line('rvalve','cyl',20),line('rvalve','pins',12),line('cyl','rtank',25,'return'),
 ],[M.steering.kind+'; '+M.steering.emergency+'.',M.ramp.why+'.']),
]);
export const pipingSystem=id=>FERRY_PIPING.find(s=>s.id===id)||null;

/**
 * The pumped services and their two means (the creator: "redundant motors so you can alternate"): duty and standby,
 * how they are alternated, and what the second means is where the first is engine-driven.
 */
export const FERRY_SERVICES=Object.freeze([
 Object.freeze({service:'Fuel transfer',system:'fuel',duty:'tp1',standby:'tp2',rota:'weekly'}),
 Object.freeze({service:'Lubricating oil, port main engine',system:'lube',duty:'lop-mainP',standby:'prime-mainP',rota:'engine-driven; the priming pump primes and can circulate at standstill'}),
 Object.freeze({service:'Lubricating oil, starboard main engine',system:'lube',duty:'lop-mainS',standby:'prime-mainS',rota:'engine-driven; the priming pump'}),
 Object.freeze({service:'Sea-water cooling, port main engine',system:'seawater',duty:'swp-mainP',standby:'gs',rota:'engine-driven; the general-service pump through the crossover'}),
 Object.freeze({service:'Sea-water cooling, starboard main engine',system:'seawater',duty:'swp-mainS',standby:'gs',rota:'engine-driven; the general-service pump through the crossover'}),
 Object.freeze({service:'Bilge',system:'bilge',duty:'bp',standby:'fbp',rota:'the fire and bilge pump on the same manifold; the emergency suction third'}),
 Object.freeze({service:'Ballast',system:'bilge',duty:'balp',standby:'gs2',rota:'the general-service pump'}),
 Object.freeze({service:'Fire main',system:'fire',duty:'fp1',standby:'fp2',rota:'weekly; the emergency fire pump outside the engine room third'}),
 Object.freeze({service:'Starting air',system:'air',duty:'c1',standby:'c2',rota:'weekly on the pressure switch'}),
 Object.freeze({service:'Fresh water',system:'freshwater',duty:'hp1',standby:'hp2',rota:'weekly'}),
 Object.freeze({service:'Sanitary flushing',system:'sewage',duty:'sp1',standby:'sp2',rota:'weekly'}),
 Object.freeze({service:'Sewage discharge',system:'sewage',duty:'dp1',standby:'dp2',rota:'alternate discharges'}),
 Object.freeze({service:'Steering',system:'hydraulics',duty:'hpu1',standby:'hpu2',rota:'No.1 at sea, both in narrow water; the hand pump third'}),
 Object.freeze({service:'Ramp',system:'hydraulics',duty:'rp1',standby:'rp2',rota:'weekly; the hand pump third'}),
]);

