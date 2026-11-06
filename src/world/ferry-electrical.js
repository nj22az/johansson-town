import {FERRY_LOADS,FERRY_ELECTRICS,FERRY_CONDITIONS,FERRY_SUPPLY,gaSpace,motorAmps} from './ferry-ship.js';
import {kks,kksCable,KKS_F0} from './ferry-kks.js';
/**
 * The Minato Maru's electrical installation as a yard draws it (the creator, 2026-10-13: "electrical drawings for the
 * ship … correct … with proper cabling"): every board and its sections, every feeder with its consumer's KKS tag,
 * its starter, its breaker, its cable (cores, section, rating, length and route) and its cable number, derived from
 * the load analysis (ferry-ship.js FERRY_LOADS) and the electrics (FERRY_ELECTRICS) by the rules below, so the
 * one-line, the feeder lists and the cable schedule (tools/ferry-drawings.mjs sheets 3, 3b, 3c, 3d) are one data set.
 *
 * Preliminary engineering assumptions, not a construction-approved installation:
 * - A motor's full-load current is its kW over √3·U·η·cos φ (motorAmps). A motor over 7.5 kW starts star-delta;
 *   smaller ones direct on line. The thruster (75 kW) is star-delta with the two-generator interlock.
 * - The feeder breaker is the next standard rating at or above 1.25 × the full-load current (motor), or the full-load
 *   current (heaters, lighting), from the moulded-case range 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200.
 * - The cable carries at least the breaker's rating: EPR-insulated, sheathed and braided marine cable,
 *   rated in air at 45 °C ambient (the engine room): 1.5 mm² 16 A, 2.5 mm² 21 A, 4 mm² 28 A, 6 mm² 36 A, 10 mm²
 *   50 A, 16 mm² 67 A, 25 mm² 89 A, 35 mm² 110 A, 50 mm² 134 A, 70 mm² 166 A, 95 mm² 201 A, 120 mm² 232 A; the
 *   generator leads 2 × 95 mm² a phase. Lighting and small 105 V loads: two-core.
 * - Resistance is corrected from 20 °C to a 90 °C conductor. A 5 % feeder budget leaves 1 % for upstream
 *   cables, but upstream and transformer drops still require verification against the total 6 % limit.
 * - Protective conductors are additional to the live-core count. Star-delta starters require six live
 *   conductors between the starter and motor; the three-live-core board feeder is not that motor tail.
 * - Cable ampacities are a conservative planning envelope below ClassNK Part H Table H2.15, 90 °C
 *   insulation at 45 °C ambient, three loaded conductors. Actual cable, grouping and routing are unverified.
 * - A cable's length is the route: along the deck from the board to the consumer's space (the manhattan distance
 *   between the spaces' centres), plus 4 m for every deck it climbs through a casing trunk, plus 15 % for the bends,
 *   the tray and the ends.
 * - Cable numbers follow the KKS rule: the tag of the lower end in alphabetical order, then 1001–1999 for AC ≤ 1 kV,
 *   2001–2499 for DC power, 4501–5999 for control, 7001–7999 for measuring, 8001–8999 for communication.
 */
const E=FERRY_ELECTRICS,F0=KKS_F0;
const DECK_Y={hold:0,car:1,passenger:2,bridge:3,compass:4};
/** 445 V alternator nameplate with 440 V nominal distribution and 105 V line-to-line lighting. */
export const ELECTRICAL_DESIGN=Object.freeze({distributionVolts:440,lightingVolts:105,dcVolts:24,
 conductorC:90,ambientC:45,copperRho20:.0175,copperAlpha:.00393,feederDropBudget:5,motorStartCableBudget:5,totalDropLimit:6,
 groupingFactor:1,groupingSensitivityFactor:.85,reactanceAssumptionOhmPerKm:.12,
 ampacityStatus:'Preliminary lower envelope; manufacturer, installation and grouping not verified',
 approvalStatus:'ENGINEERING DEVELOPMENT — NOT FOR CONSTRUCTION',
 rulesReference:'ClassNK Rules for the Survey and Construction of Steel Ships Part H, June 2026, 1.1.6, 2.3, 2.8, 2.9 and 3.3'});
export const BREAKERS=Object.freeze([6,10,16,20,25,32,40,50,63,80,100,125,160,200]);
/** Planning lower envelope, mm² → A; not a cable manufacturer's certified table. */
export const CABLE_RATINGS=Object.freeze([[1.5,16],[2.5,21],[4,28],[6,36],[10,50],[16,67],[25,89],[35,110],[50,134],[70,166],[95,201],[120,232]]);
/** ClassNK Table H2.15, EP rubber/XLPE 90 °C, three loaded cores, 45 °C ambient; an upper rule-table bound. */
export const CLASSNK_CABLE_RATING_BOUND=Object.freeze([[1.5,16],[2.5,21],[4,28],[6,36],[10,50],[16,67],[25,89],[35,110],[50,137],[70,169],[95,205],[120,237]]);
export const breakerFor=amps=>BREAKERS.find(b=>b>=amps)??null;
export const cableFor=amps=>CABLE_RATINGS.find(([,a])=>a>=amps)??null;
export function copperResistivity(conductorC=ELECTRICAL_DESIGN.conductorC){
 if(!Number.isFinite(conductorC)||conductorC<20||conductorC>90)throw new RangeError('Conductor temperature must be 20–90 °C');
 return ELECTRICAL_DESIGN.copperRho20*(1+ELECTRICAL_DESIGN.copperAlpha*(conductorC-20));
}
/** Resistance-only drop, one-way length; two-wire DC/single-phase requires the full outgoing-and-return loop. */
export function voltageDrop(amps,lengthM,mm2,volts=ELECTRICAL_DESIGN.distributionVolts,phases=3,conductorC=ELECTRICAL_DESIGN.conductorC){
 if(![amps,lengthM,mm2,volts].every(Number.isFinite)||amps<0||lengthM<0||mm2<=0||volts<=0||![0,1,3].includes(phases))throw new RangeError('Invalid electrical drop inputs');
 return 100*(phases===3?Math.sqrt(3):2)*amps*copperResistivity(conductorC)*lengthM/mm2/volts;
}
/** Returns null when no available size meets BOTH ampacity and drop; never silently accepts the last size. */
export function cableSized(breaker,amps,lengthM,volts,phases,{groupingFactor=ELECTRICAL_DESIGN.groupingFactor,maxDrop=ELECTRICAL_DESIGN.feederDropBudget}={}){
 if(!Number.isFinite(breaker)||breaker<=0||groupingFactor<=0||groupingFactor>1)return null;
 const row=CABLE_RATINGS.find(([s,a])=>a*groupingFactor>=breaker&&voltageDrop(amps,lengthM,s,volts,phases)<=maxDrop);
 return row?[row[0],row[1]*groupingFactor]:null;
}
/** Nominal line current; input kVA is apparent power, not kW. */
export const sourceAmps=(kVA,volts,phases=3)=>kVA*1000/((phases===3?Math.sqrt(3):1)*volts);
const r1=n=>Math.round(n*10)/10;
const cableWords=(cores,mm2)=>`${cores} × ${mm2} mm² + PE ${mm2} mm²`;
/** Planning source-side record. breaker is frame; breakerSetting is the long-time current assumption. */
function sourceSide(kVA,volts,{breaker=null,breakerSetting=null,mm2=null,phases=3}={}){
 const amps=sourceAmps(kVA,volts,phases),frame=breaker??breakerFor(amps),setting=breakerSetting??frame;
 const cable=mm2?CABLE_RATINGS.find(([s])=>s===mm2):cableFor(frame);
 return Object.freeze({volts,phases,amps:r1(amps),breaker:frame,breakerSetting:setting,mm2:cable?.[0]??null,
  rating:cable?.[1]??null,cores:phases===3?3:2,totalCores:phases===3?4:3,peMm2:cable?.[0]??null,
  cable:cable?cableWords(phases===3?3:2,cable[0]):'UNSIZED',manufacturerVerified:false});
}
function transformerSource(id,tag,name,where,to,kVA,primaryVolts,secondaryVolts,primaryOptions={},secondaryOptions={}){
 const primary=sourceSide(kVA,primaryVolts,primaryOptions),secondary=sourceSide(kVA,secondaryVolts,secondaryOptions);
 // Compatibility fields all describe the OUTPUT cable, the segment to the `to` board.
 return Object.freeze({id,tag,name,where,to,kVA,primary,secondary,amps:secondary.amps,breaker:secondary.breaker,
  breakerSetting:secondary.breakerSetting,cable:secondary.cable,rating:secondary.rating,
  compatibilitySide:'secondary/output',inrushCoordination:'Not verified; needs transformer data and protective-device curves'});
}

/** The boards: each a KKS installation unit with its sections, where it stands, what feeds it. */
export const FERRY_BOARDS=Object.freeze([
 Object.freeze({id:'MSB',tag:kks({fn:'BRA',n:10,eq:'GS',no:1}),name:'Main switchboard · 440 V 60 Hz · IT',where:'control-booth',sections:Object.freeze(['Generator No.1','Synchronising','Generator No.2','440 V feeders','105 V lighting']),fedBy:Object.freeze(['DG1','DG2','shore'])}),
 Object.freeze({id:'LB',tag:kks({fn:'BRB',n:10,eq:'GS',no:1}),name:'Lighting board · 105 V · through T1 or T2',where:'control-booth',sections:Object.freeze(['Transformer selector','Lighting feeders']),fedBy:Object.freeze(['T1','T2'])}),
 Object.freeze({id:'ESB',tag:kks({fn:'BRV',n:10,eq:'GS',no:1}),name:'Emergency switchboard · 440 V and 105 V',where:'eg-room',sections:Object.freeze(['Bus-tie from MSB','Emergency generator','440 V feeders','105 V feeders']),fedBy:Object.freeze(['MSB','EG'])}),
 Object.freeze({id:'DC',tag:kks({fn:'BTA',n:10,eq:'GS',no:1}),name:'24 V DC distribution · two battery banks and chargers',where:'eg-room',sections:Object.freeze(['Starting batteries','Radio and emergency batteries','Chargers']),fedBy:Object.freeze(['chargers'])}),
 Object.freeze({id:'shore',tag:kks({g:0,fn:'BQA',n:10,eq:'GS',no:1}),name:'Onboard shore box · 440 V after quay 200/440 V transformer · 50 kVA · phase-sequence indicator',where:'foyer',sections:Object.freeze(['Shore breaker 80 A frame / 66 A provisional setting','Phase sequence','Shore/generator interlock']),fedBy:Object.freeze([])}),
]);
/** The sources: generators, the emergency generator, the transformers, the shore transformer. */
export const FERRY_SOURCES=Object.freeze([
 ...['DG1','DG2'].map((id,i)=>{
  const where='aux-room',length=routeLength(where,'control-booth'),amps=sourceAmps(E.generators.kVA,E.generators.volts),parallelSets=2;
  return Object.freeze({id,tag:kks({f0:i?F0.gen2:F0.gen1,fn:'MKA',n:10,eq:'AG',no:1}),
   name:`Generator No.${i+1} · ${E.generators.kVA} kVA · ${E.generators.volts} V nameplate / 440 V distribution`,where,to:'MSB',
   volts:E.generators.volts,amps:r1(amps),breaker:E.generators.breaker.frame,
   breakerSetting:E.generators.breaker.setting,cable:'2 parallel × (3 × 95 mm²) + dedicated PE 95 mm²',rating:402,
   parallelSets,mm2:95,currentPerParallelSet:r1(amps/parallelSets),length,
   drop:r1(voltageDrop(amps/parallelSets,length,95,E.generators.volts,3)),
   dropPercent:voltageDrop(amps/parallelSets,length,95,E.generators.volts,3),route:routeWords(where,'control-booth'),
   routeStatus:'Preliminary space-centre route estimate; tray, transit and as-built lengths not verified',
   groupingStatus:'Assumes equal length/termination and separately arranged parallel sets; not installation verified',manufacturerVerified:false});
 }),
 Object.freeze({id:'EG',tag:kks({f0:F0.emergency,fn:'MKA',n:10,eq:'AG',no:1}),name:`Emergency generator · ${E.emergency.kVA} kVA · ${E.emergency.kW} kW`,
  where:'eg-room',to:'ESB',...sourceSide(E.emergency.kVA,E.emergency.volts,{breaker:63,breakerSetting:52,mm2:16}),
  transientStatus:'UNVERIFIED — motor-start current alone does not establish voltage recovery or frequency response'}),
 ...['T1','T2'].map((id,i)=>transformerSource(id,kks({fn:'BRT',n:10,eq:'GT',no:i+1}),
  `Lighting transformer ${id}${i?' (standby)':''} · ${E.transformers.lighting.kVA} kVA · 440/105 V`,
  'control-booth','LB',E.transformers.lighting.kVA,440,E.lighting,
  {breaker:50,breakerSetting:40,mm2:10},{breaker:200,breakerSetting:165,mm2:95})),
 transformerSource('ETR',kks({fn:'BRT',n:20,eq:'GT',no:1}),'Emergency lighting transformer · 5 kVA · 440/105 V','eg-room','ESB',
  E.transformers.emergency.kVA,440,E.lighting,{breaker:10,breakerSetting:7,mm2:1.5},{breaker:32,breakerSetting:28,mm2:6}),
 transformerSource('shore',kks({g:0,fn:'BQA',n:10,eq:'GT',no:1}),
  'Quay isolation transformer · 50 kVA · 200/440 V; ship receives 440 V',
  'foyer','MSB',E.shore.kVA,E.shore.volts,440,{breaker:160,breakerSetting:145,mm2:70},{breaker:80,breakerSetting:66,mm2:25}),
]);

/** The consumers' KKS tags: the pumps and machines as on the piping diagrams, the rest by their systems. */
const TAGS=Object.freeze({
 'steer-1':kks({fn:'XSA',n:10,eq:'AP',no:1,cmp:'-M'}),'steer-2':kks({fn:'XSA',n:10,eq:'AP',no:2,cmp:'-M'}),'fire-1':kks({fn:'SGA',n:10,eq:'AP',no:1,cmp:'-M'}),'fire-2':kks({fn:'SGA',n:10,eq:'AP',no:2,cmp:'-M'}),
 bilge:kks({fn:'GMA',n:20,eq:'AP',no:1,cmp:'-M'}),'fire-emergency':kks({fn:'SGA',n:20,eq:'AP',no:1,cmp:'-M'}),'er-fans':kks({fn:'SAA',n:10,eq:'AN',no:1,cmp:'-M'}),'car-deck-fans':kks({fn:'SAB',n:10,eq:'AN',no:1,cmp:'-M'}),
 thruster:kks({fn:'XSC',n:10,eq:'AN',no:1,cmp:'-M'}),windlass:kks({fn:'XSD',n:10,eq:'AE',no:1,cmp:'-M'}),capstan:kks({fn:'XSD',n:20,eq:'AE',no:1,cmp:'-M'}),ramp:kks({fn:'XSB',n:10,eq:'AP',no:1,cmp:'-M'}),
 compressor:kks({fn:'SCA',n:10,eq:'AN',no:1,cmp:'-M'}),'compressor-2':kks({fn:'SCA',n:10,eq:'AN',no:2,cmp:'-M'}),'fuel-transfer':kks({fn:'EGC',n:10,eq:'AP',no:1,cmp:'-M'}),'fuel-transfer-2':kks({fn:'EGC',n:10,eq:'AP',no:2,cmp:'-M'}),
 purifier:kks({fn:'EGD',n:10,eq:'AT',no:1,cmp:'-M'}),'lube-priming':kks({f0:F0.mainP,fn:'XJV',n:10,eq:'AP',no:2,cmp:'-M'}),hydrophore:kks({fn:'GKB',n:10,eq:'AP',no:1,cmp:'-M'}),'hydrophore-2':kks({fn:'GKB',n:10,eq:'AP',no:2,cmp:'-M'}),
 sanitary:kks({fn:'GHB',n:10,eq:'AP',no:1,cmp:'-M'}),'sanitary-2':kks({fn:'GHB',n:10,eq:'AP',no:2,cmp:'-M'}),sewage:kks({fn:'GRA',n:10,eq:'AP',no:1,cmp:'-M'}),'sewage-2':kks({fn:'GRA',n:10,eq:'AP',no:2,cmp:'-M'}),
 separator:kks({fn:'GNA',n:10,eq:'AT',no:1,cmp:'-M'}),davit:kks({fn:'SMA',n:10,eq:'AE',no:1,cmp:'-M'}),'saloon-ac':kks({fn:'SAC',n:10,eq:'AH',no:1}),range:kks({fn:'GKB',n:30,eq:'AH',no:1}),'water-heater':kks({fn:'GKB',n:20,eq:'AC',no:1}),
 chargers:kks({fn:'BRU',n:10,eq:'GU',no:1}),workshop:kks({fn:'SMA',n:20,eq:'AE',no:2,cmp:'-M'}),'electrical-workshop':kks({fn:'SMA',n:30,eq:'GS',no:1}),ballast:kks({fn:'GHA',n:10,eq:'AP',no:1,cmp:'-M'}),
 'light-passenger':kks({fn:'BRB',n:10,eq:'GS',no:11}),'light-car-deck':kks({fn:'BRB',n:10,eq:'GS',no:12}),'light-engine':kks({fn:'BRB',n:10,eq:'GS',no:13}),'light-crew':kks({fn:'BRB',n:10,eq:'GS',no:14}),
 floodlights:kks({fn:'BRB',n:10,eq:'GS',no:15}),searchlight:kks({fn:'CTA',n:10,eq:'GS',no:1}),'bridge-electronics':kks({fn:'CTA',n:10,eq:'GS',no:2}),'room-ac':kks({fn:'SAC',n:20,eq:'AH',no:1}),'galley-appliances':kks({fn:'GKB',n:30,eq:'GS',no:1}),
 kiosk:kks({fn:'BRB',n:10,eq:'GS',no:16}),vending:kks({fn:'BRB',n:10,eq:'GS',no:17}),'lane-signals':kks({fn:'BRB',n:10,eq:'GS',no:20}),tv:kks({fn:'BRB',n:10,eq:'GS',no:19}),'toilet-fans':kks({fn:'SAC',n:30,eq:'AN',no:1,cmp:'-M'}),
 'emergency-light':kks({fn:'BRV',n:20,eq:'GS',no:11}),'nav-lights':kks({fn:'CTA',n:20,eq:'GS',no:1}),'emergency-radar':kks({fn:'CTA',n:10,eq:'GS',no:3}),'emergency-charger':kks({fn:'BRU',n:10,eq:'GU',no:3}),
});
export const loadTag=id=>TAGS[id]||null;
/** The route length from a board's space to a consumer's space: manhattan across the decks' plan, 4 m a deck, 15 % slack. */
export function routeLength(fromId,toId){
 const a=gaSpace(fromId),b=gaSpace(toId);if(!a||!b)return null;
 const c=s=>[(s.z[0]+s.z[1])/2,(s.x[0]+s.x[1])/2];const [za,xa]=c(a),[zb,xb]=c(b);
 const decks=Math.abs((DECK_Y[a.deck]??0)-(DECK_Y[b.deck]??0));
 return Math.round((Math.abs(za-zb)+Math.abs(xa-xb)+decks*4)*1.15+2);
}
/** A consumer's starter: star-delta over 7.5 kW, direct on line below, none for heaters and lighting. */
export const starterFor=l=>l.supply!=='440'||/^light|lights|kiosk|vending|tv|electronics|charger|appliances|heater|range|searchlight|ac$/.test(l.id)||l.kW<=0?(l.supply==='440'&&/ac|heater|range|charger/.test(l.id)?'contactor':'switch'):l.kW>7.5?'star-delta':'DOL';
/** DC is explicitly a two-wire loop, never the three-phase default. */
export function feederSupply(supply){
 if(supply==='440')return {volts:440,phases:3,dc:false};
 if(supply==='105')return {volts:E.lighting,phases:1,dc:false};
 if(['24','24dc','DC24'].includes(String(supply)))return {volts:E.batteries.volts,phases:0,dc:true};
 throw new RangeError('Unknown ferry feeder supply '+supply);
}
/** Cable-only motor start, using an explicit 6× DOL assumption and one-third DOL line current in star.
 * The impedance envelope includes a provisional reactance. It is not alternator voltage dip or a start test.
 */
export function motorStartCableDrop(amps,lengthM,mm2,volts=440,starter='DOL',{
 lockedRotorMultiple=6,reactanceOhmPerKm=ELECTRICAL_DESIGN.reactanceAssumptionOhmPerKm}={}){
 if(!['DOL','star-delta'].includes(starter)||lockedRotorMultiple<=0||reactanceOhmPerKm<0)throw new RangeError('Invalid motor start assumptions');
 const multiple=starter==='star-delta'?lockedRotorMultiple/3:lockedRotorMultiple;
 const startAmps=amps*multiple,resistivePercent=voltageDrop(startAmps,lengthM,mm2,volts,3);
 const resistanceOhm=copperResistivity()*lengthM/mm2,reactanceOhm=reactanceOhmPerKm*lengthM/1000;
 return Object.freeze({startAmps:r1(startAmps),multiple,resistivePercent:r1(resistivePercent),
  impedanceEnvelopePercent:r1(100*Math.sqrt(3)*startAmps*Math.hypot(resistanceOhm,reactanceOhm)/volts),
  transitionDOLCablePercent:starter==='star-delta'?r1(voltageDrop(amps*lockedRotorMultiple,lengthM,mm2,volts,3)):null,
  assumptions:Object.freeze({lockedRotorMultiple,reactanceOhmPerKm,conductorC:90}),
  status:'CABLE-ONLY SCENARIO — source impedance, AVR/governor recovery, motor torque and transition unverified'});
}
/**
 * Every feeder: the consumer (FERRY_LOADS), its tag, its board and board tag, full-load current, starter, breaker,
 * cable (cores × mm², rating), length, voltage drop and route, and the cable number. One feeder per consumer; a
 * consumer counted twice (two fans, two pumps) has two feeders, A and B.
 */
export const FERRY_FEEDERS=Object.freeze((()=>{
 const out=[];const counters={};
 for(const l of FERRY_LOADS){
  const board=FERRY_BOARDS.find(b=>b.id===l.board),supply=feederSupply(l.supply),{volts,phases,dc}=supply;
  const motor=/DOL|star-delta/.test(starterFor(l));
  // No certified motor plate is available: do not reduce the declared current merely because the
  // provisional 90 % efficiency / 0.85 power-factor calculation gives a smaller value.
  const unitAmps=motor?Math.max(l.amps,motorAmps(l.kW,.9,.85,volts)):l.amps;
  const length=routeLength(board.where,l.where);
  const n=Math.max(1,l.count>1&&l.kW>=.5?Math.min(l.count,2):1);
  for(let i=0;i<n;i++){const key=l.board;counters[key]=(counters[key]||0);const cls=dc?'dc':'ac';
   const unitsPerFeeder=Math.floor(l.count/n)+(i<l.count%n?1:0),amps=unitAmps*unitsPerFeeder;
   const breaker=breakerFor(motor?amps*1.25:amps);let cable=cableSized(breaker,amps,length,volts,phases);
   // A cable-only 5 % starting target reduces avoidable cable drop; it cannot guarantee source recovery.
   if(motor&&cable&&motorStartCableDrop(amps,length,cable[0],volts,starterFor(l)).impedanceEnvelopePercent>ELECTRICAL_DESIGN.motorStartCableBudget){
    cable=CABLE_RATINGS.find(([s,a])=>s>=cable[0]&&a>=breaker&&voltageDrop(amps,length,s,volts,phases)<=ELECTRICAL_DESIGN.feederDropBudget&&
     motorStartCableDrop(amps,length,s,volts,starterFor(l)).impedanceEnvelopePercent<=ELECTRICAL_DESIGN.motorStartCableBudget)??null;
   }
   if(!cable)throw new RangeError(l.id+': no preliminary cable satisfies ampacity and drop');
   // A consumer counted twice is two feeders: the second numbered on (AN002), or, for a per-engine pump, on the other engine (12XJV10).
   const base=TAGS[l.id]||kks({fn:'BRA',n:10,eq:'GS',no:50+out.length});const tag=n>1?(/^11/.test(base)?base.replace(/^11/,'1'+(1+i)):base.replace(/(AP|AN|AE|AH|GU|GS)(\d{3})/,(m,eq,no)=>eq+String(+no+i).padStart(3,'0'))):base;
   const cores=phases===3?3:2,drop=voltageDrop(amps,length,cable[0],volts,phases),starting=motor?motorStartCableDrop(amps,length,cable[0],volts,starterFor(l)):null;
   out.push(Object.freeze({id:l.id+(n>1?['A','B'][i]:''),name:l.name+(n>1?' feeder '+(i+1):'')+(unitsPerFeeder>1?` (${unitsPerFeeder} units)`:'')+(/^steer-/.test(l.id)?' · overload alarm, no overload trip':''),
    tag,board:l.board,boardTag:board.tag,where:l.where,supply:l.supply,volts,phases,dc,kW:l.kW*unitsPerFeeder,
    unitsPerFeeder,unitAmps:r1(unitAmps),amps:r1(amps),starter:starterFor(l),breaker,
    currentBasis:motor?'Maximum of declared current and kW/(sqrt(3)·U·0.9·0.85); provisional':'Declared per-unit input current; manufacturer unverified',
    motorOverload:!motor?null:/^steer-/.test(l.id)?'Alarm; steering protection to be verified against Part D':r1(amps),
    cable:cableWords(cores,cable[0]),mm2:cable[0],loadedCores:cores,totalCores:cores+1,peMm2:cable[0],
    motorTailCable:starterFor(l)==='star-delta'?cableWords(6,cable[0]):null,
    rating:cable[1],length,drop:r1(drop),conductorC:90,ampacityStatus:ELECTRICAL_DESIGN.ampacityStatus,manufacturerVerified:false,
    starting,startAmps:starting?.startAmps??null,startCableDrop:starting?.impedanceEnvelopePercent??null,
    startAssessment:starting?.status??(/ac|appliances|vending|kiosk/.test(l.id)?'Packaged equipment starting data not supplied':'Not a modelled induction motor'),
    route:routeWords(board.where,l.where),number:kksCable(board.tag,tag,cls,counters[key]++)}));}
 }
 return out;
})());
/** The route in words: the spaces a cable passes, board to consumer. */
function routeWords(fromId,toId){
 const a=gaSpace(fromId),b=gaSpace(toId);if(!a||!b)return '';
 const steps=[a.id];
 if((a.id==='aux-room'&&b.id==='control-booth')||(a.id==='control-booth'&&b.id==='aux-room'))steps.push('engine-room');
 if(a.deck==='hold'&&b.deck!=='hold')steps.push('casing-p trunk');if(a.deck!=='hold'&&b.deck==='hold')steps.push('casing-s trunk');
 if(b.deck==='bridge'&&a.deck!=='bridge')steps.push('lobby','corridor');if(b.deck==='passenger'&&a.deck==='hold')steps.push('lobby');
 if(b.id!==a.id)steps.push(b.id);
 return steps.join(' → ');
}
/** Sums a yard checks: the generator breaker carries the full load; the main cables' drop; no cable under its breaker. */
export function electricalChecks(){
 const bad=[];
 for(const f of FERRY_FEEDERS){if(f.rating<f.breaker)bad.push(f.id+': cable '+f.rating+' A under breaker '+f.breaker+' A');if(f.drop>5)bad.push(f.id+': feeder drop '+f.drop+' %');if(f.breaker<f.amps)bad.push(f.id+': breaker under FLA');
  if(f.startCableDrop>5)bad.push(f.id+': cable-only start envelope '+f.startCableDrop+' %');
  if(f.totalCores!==f.loadedCores+1||f.peMm2<f.mm2)bad.push(f.id+': missing protective conductor');}
 for(const s of FERRY_SOURCES){for(const side of s.primary?[s.primary,s.secondary]:[s]){
  if(side.amps>side.breaker)bad.push(s.id+': source-side breaker frame below rated current');
  if(side.amps>side.breakerSetting)bad.push(s.id+': source-side long-time setting below rated current');
  if(side.rating<side.breakerSetting)bad.push(s.id+': source-side cable under long-time setting');
 }}
 return bad;
}

/** Transparent capacity scenarios and unresolved approval inputs. An empty electricalChecks() is only
 * a numerical consistency check, never a class approval or a short-circuit/starting validation.
 */
export function electricalEngineeringReview(){
 const pfFor=l=>/range|water-heater/.test(l.id)?1:/DOL|star-delta/.test(starterFor(l))?.85:.9;
 const conditions=FERRY_CONDITIONS.map(condition=>{
  const supply=FERRY_SUPPLY[condition],sourceKVA=supply.shore?E.shore.kVA:supply.emergency?E.emergency.kVA:supply.generators*E.generators.kVA;
  const sourceKW=supply.shore?E.shore.kW:supply.emergency?E.emergency.kW:supply.generators*E.generators.kW;
  const declaredKW=FERRY_LOADS.reduce((sum,l)=>sum+(l.draw[condition]??0),0);
  const estimatedKVA=FERRY_LOADS.reduce((sum,l)=>sum+(l.draw[condition]??0)/pfFor(l),0);
  return {condition,declaredKW:r1(declaredKW),estimatedKVA:r1(estimatedKVA),sourceKW,sourceKVA,
   activeReserveKW:r1(sourceKW-declaredKW),apparentReserveKVA:r1(sourceKVA-estimatedKVA),
   status:'Declared diversity scenario only; OEM power factors, input powers and maximum simultaneous duty not verified'};
 });
 const emergencyMotors=FERRY_FEEDERS.filter(f=>f.board==='ESB'&&f.starting),backgroundLightingKVA=FERRY_FEEDERS.filter(f=>f.board==='ESB'&&f.volts===105)
  .reduce((sum,f)=>sum+f.volts*f.amps/1000,0);
 const chargerKW=FERRY_LOADS.filter(l=>l.board==='ESB'&&/charger/.test(l.id)).reduce((sum,l)=>sum+l.kW*l.count,0);
 const emergencyStarts=emergencyMotors.map(f=>{
  const otherMotorKVA=emergencyMotors.filter(o=>o.id!==f.id).reduce((sum,o)=>sum+Math.sqrt(3)*o.volts*o.amps/1000,0);
  const startingKVA=Math.sqrt(3)*f.volts*f.startAmps/1000,totalScenarioKVA=startingKVA+otherMotorKVA+backgroundLightingKVA+chargerKW/.9;
  return {id:f.id,startAmps:f.startAmps,motorStartKVA:r1(startingKVA),backgroundKVA:r1(otherMotorKVA+backgroundLightingKVA+chargerKW/.9),
   totalScenarioKVA:r1(totalScenarioKVA),generatorKVA:E.emergency.kVA,exceedsContinuousRating:totalScenarioKVA>E.emergency.kVA,
   lockedRotor5to7KVA:[5,7].map(m=>r1(startingKVA*m/6+otherMotorKVA+backgroundLightingKVA+chargerKW/.9)),
   cableOnlyDrop:f.startCableDrop,status:'HOLD — generator step-load/AVR/governor/motor acceleration study required'};
 });
 const groupedCableSensitivity=FERRY_FEEDERS.filter(f=>f.rating*ELECTRICAL_DESIGN.groupingSensitivityFactor<f.breaker)
  .map(f=>({id:f.id,baseRating:f.rating,at085:r1(f.rating*.85),breaker:f.breaker,
   revisedSection:cableSized(f.breaker,f.amps,f.length,f.volts,f.phases,{groupingFactor:.85})?.[0]??null}));
 const totalConnectedKVA=FERRY_FEEDERS.reduce((sum,f)=>sum+(f.phases===3?Math.sqrt(3):1)*f.volts*f.amps/1000,0);
 return {design:ELECTRICAL_DESIGN,numericalDefects:electricalChecks(),feederCount:FERRY_FEEDERS.length,
  maximumFeederDrop:Math.max(...FERRY_FEEDERS.map(f=>f.drop)),maximumMotorStartCableDrop:Math.max(...FERRY_FEEDERS.map(f=>f.startCableDrop??0)),
  totalConnectedNameplateKVA:r1(totalConnectedKVA),conditions,emergencyStarts,groupedCableSensitivity,
  transformerSides:FERRY_SOURCES.filter(s=>s.primary).map(s=>({id:s.id,kVA:s.kVA,primary:s.primary,secondary:s.secondary})),
  corrections:['Separated transformer primary and secondary cable/current/protection records',
   'Separated 200 V quay and 440 V ship shore connections',
   'Used copper resistance at 90 °C and explicit two-wire 24 V DC loops',
   'Included all units in grouped consumers and declared additional PE conductors',
   'Added six-live-core star-delta motor tails and cable-only starting scenarios'],
  openHolds:[
   {id:'ELEC-01',item:'Real generator/transformer/motor/cable selection and certified installation data'},
   {id:'ELEC-02',item:'Prospective fault levels, breaker making/breaking duties, time-current discrimination and cable fault withstand'},
   {id:'ELEC-03',item:'Generator step-load response; emergency fire-pump scenario exceeds 40 kVA continuous rating; current-only sizing is insufficient'},
   {id:'ELEC-04',item:'Actual cable routes, installation/grouping, transformer regulation, unbalance and complete upstream-to-consumer voltage drop'},
   {id:'ELEC-05',item:'Battery Ah/endurance, DC load inventory, 105/24 V emergency converters and independent transition lighting'},
   {id:'ELEC-06',item:'Emergency duration against vessel-specific flag/class requirements; a 60 L/15 h claim lacks fuel-consumption evidence'},
   {id:'ELEC-07',item:'Motor six-terminal compatibility, star torque/acceleration, transition inrush and vendor packaged-equipment starting currents'},
   {id:'ELEC-08',item:'Switchboard construction, earthing/insulation monitoring, shore isolation, EMC and factory/onboard acceptance testing'},
   {id:'ELEC-09',item:'Mechanical ventilation duty and fan curves; fan motor kW does not prove airflow'},
   {id:'ELEC-10',item:'Navigation-light dedicated circuits, panel indications, changeover and lamp-voltage requirements; general feeder-drop budget is not navigation-light approval'}],
  rulesURL:'https://www.classnk.or.jp/hp/pdf/rules/420_part_h_e_202606.pdf'};
}

