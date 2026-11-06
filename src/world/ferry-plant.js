import {FERRY_PIPING,FERRY_SERVICES} from './ferry-piping.js';
import {FERRY_FEEDERS,loadTag} from './ferry-electrical.js';
import {FERRY_ELECTRICS,FERRY_MACHINERY,FERRY_DAY,thrusterMayStart} from './ferry-ship.js';
/**
 * The Minato Maru's plant as it runs (6r-2; the creator, 2026-10-13: "Can you stop the engines and overhaul them?
 * Turn off help systems?"): every machine of the piping diagrams and the feeder lists with a state, the board and its
 * generators, the valves that matter, and the rules a chief engineer lives by, so that the console's dials, the alarm
 * matrix, the engine sound and the prompts at the machines read one plant, and the crew's day (FERRY_DAY) and the
 * player's hand work the same handles. Pure: no three.js; game.js and ferry.js ask it and draw it.
 *
 * States of a machine: 'stopped', 'running', 'standby' (stopped, ready to start by itself when its duty fails),
 * 'isolated' (its valves shut, tagged out), 'open' (opened for overhaul: covers off, parts on the plates).
 * Every refusal returns {ok:false, why} in the chief's words; nothing is random.
 */
const E=FERRY_ELECTRICS,M=FERRY_MACHINERY;
const ENGINE_IDS=Object.freeze({mainP:{tag:'11XJA10',name:'Port main engine',kW:M.mains.kW},mainS:{tag:'12XJA10',name:'Starboard main engine',kW:M.mains.kW},gen1:{tag:'13XJA10',name:'Generator No.1',kW:E.generators.kW},gen2:{tag:'14XJA10',name:'Generator No.2',kW:E.generators.kW}});
const AIR={full:30,cutIn:25,cutOut:30,perStart:3,fillPerMinute:1,minimum:18};
const FW={cutIn:.25,cutOut:.35,usePerMinute:.004,fillPerMinute:.05};
/** The alarm matrix's names (ferry-interior.js, the console): what lights each. */
export const PLANT_ALARMS=Object.freeze(['LO PRESS P','LO PRESS S','WATER TEMP P','WATER TEMP S','OVERSPEED P','OVERSPEED S','FUEL LEVEL','BILGE AFT','BILGE FWD','FIRE ER','GEN 1 TRIP','GEN 2 TRIP','STEERING','SHORE','EARTH 440','EARTH 105','CO₂ RELEASED','TELEGRAPH','START AIR','FW TANK','LO SUMP P','LO SUMP S','EXHAUST P','EXHAUST S','STRAINER P','STRAINER S','PURIFIER','SEPARATOR','THRUSTER','RAMP','EG RUN','SPARE']);

export function createPlant({minutes=FERRY_DAY.generators}={}){
 const machines=new Map();
 const add=(id,m)=>machines.set(id,{state:'stopped',hours:0,manual:false,breaker:false,...m,id});
 // The engines (from the diagrams' per-engine systems), then every motor-driven pump, compressor and fan of the
 // diagrams and the feeder lists, keyed by the diagram node where there is one, else by the feeder.
 for(const [id,e] of Object.entries(ENGINE_IDS))add(id,{kind:id.startsWith('main')?'engine':'generator',name:e.name,tag:e.tag,kW:e.kW,system:'engines'});
 for(const s of FERRY_PIPING)for(const n of s.nodes)if(n.drive==='motor'&&!machines.has(n.id))add(n.id,{kind:n.kind==='compressor'?'compressor':'pump',name:n.label.split(' · ')[0],tag:n.tag,kW:n.kW??0,system:s.id,node:n.id});
 for(const f of FERRY_FEEDERS)if(/^(er-fans|car-deck-fans|thruster|windlass|capstan|ramp|davit|purifier|separator)/.test(f.id)&&!machines.has(f.id))add(f.id,{kind:/fans/.test(f.id)?'fan':'motor',name:f.name,tag:f.tag,kW:f.kW,system:'electrical',feeder:f.id});
 const valves={qcv:true,chestP:true,chestS:true,crossover:true,obP:true,obS:true};
 /** Which machine holds each pumped service's duty (FERRY_SERVICES to begin with; changeOver swaps it). */
 const duty=new Map(FERRY_SERVICES.map(s=>[s.service,s.duty]));
 const board={MSB:{live:false,shore:false,kW:0},ESB:{live:false,source:null},EG:{state:'stopped'}};
 const tanks={service:.8,fuelStorage:1,freshWater:.9,bilgeAft:.05,bilgeFwd:.05,fwPressure:.3,air:[30,30]};
 const temps={mainP:30,mainS:30,gen1:30,gen2:30};
 let telegraph={mainP:'STOP',mainS:'STOP'},clock=minutes,events=[],underway=false,co2=false,fire=false,log=[],control='local';
 const note=(what)=>{log.push({at:clock,what});if(log.length>200)log.shift();};
 const m=id=>{const x=machines.get(id);if(!x)throw new RangeError('No machine '+id);return x;};
 const generatorsOnline=()=>['gen1','gen2'].filter(id=>m(id).state==='running'&&m(id).breaker).length;
 const live=()=>board.MSB.live;
 /** The duty/standby pair a machine belongs to (FERRY_SERVICES), if any. */
 const serviceOf=id=>FERRY_SERVICES.find(s=>s.duty===id||s.standby===id)||null;
 const refuse=why=>({ok:false,why});
 const ok=(what)=>{note(what);return {ok:true,what};};
 const airOk=()=>Math.max(...tanks.air)>=AIR.minimum;
 const coolingSupplied=id=>{const side=id==='mainP'?'P':'S',other=side==='P'?'S':'P';return valves['chest'+side]||valves.crossover&&valves['chest'+other];};

 function start(id,{automatic=false}={}){
  const x=m(id);
  if(x.state==='open')return refuse(x.name+' is opened for overhaul: the tag is on its start box.');
  if(x.state==='isolated')return refuse(x.name+' is isolated: open its valves and take the tag off first.');
  if(x.state==='running')return refuse(x.name+' is already running.');
  if(x.kind==='engine'||x.kind==='generator'){
   if(!airOk())return refuse('Starting air is down to '+Math.max(...tanks.air).toFixed(0)+' bar: run a compressor first.');
   if(!valves.qcv)return refuse('The fuel quick-closing valve is shut: reset it at the service tank.');
   if(tanks.service<.05)return refuse('The service tank is empty: run a transfer pump.');
   if(x.kind==='engine'){const prime=m('prime-'+id);if(!(prime.state==='running'||x.hours>0&&temps[id]>60))return refuse('Prime the lubricating oil first: the priming pump on the engine’s forward end.');
    if(!coolingSupplied(id))return refuse('No sea water: open a sea chest supplying the '+(id==='mainP'?'P':'S')+' cooling circuit.');}
   // Both bottles feed the starting-air manifold. Consume the bottle which
   // actually passed the pressure check, never an empty bank beside a full one.
   const bottle=tanks.air[0]>=tanks.air[1]?0:1;tanks.air[bottle]-=AIR.perStart;x.state='running';x.manual=!automatic;return ok(x.name+' started');
  }
  if(!live())return refuse('The main switchboard is dead: no power for '+x.name+'.');
  if(id==='thruster'&&!thrusterMayStart(generatorsOnline()))return refuse('The thruster starts only with two generators on the board: '+M.bowThruster.interlock+'.');
  x.state='running';x.manual=!automatic;return ok(x.name+' started');
 }
 function stop(id,{automatic=false}={}){
  const x=m(id);if(x.state!=='running')return refuse(x.name+' is not running.');
  if(x.kind==='engine'&&underway)return refuse('She is under way: the bridge has the engines. Bring the telegraph to STOP first.');
  if(x.kind==='generator'&&x.breaker&&generatorsOnline()===1&&!board.MSB.shore){x.breaker=false;x.state='stopped';blackout();return ok(x.name+' stopped with its breaker in: the board is dead (blackout)');}
  x.state='stopped';x.breaker=false;x.manual=!automatic;
  // The standby takes over a pumped service whose duty stops (FERRY_SERVICES), if it is on standby and has power.
  const sv=serviceOf(id);if(sv&&duty.get(sv.service)===id){const st=machines.get(sv.duty===id?sv.standby:sv.duty);if(st&&st.state==='standby'&&(st.kind!=='pump'||live())){st.state='running';note(st.name+' started by itself: '+sv.service+' standby');}}
  return ok(x.name+' stopped');
 }
 function standby(id){const x=m(id);if(x.state==='running')return refuse(x.name+' is running: stop it first.');if(x.state==='open'||x.state==='isolated')return refuse(x.name+' is not ready: '+x.state+'.');x.state='standby';return ok(x.name+' on standby');}
 function isolate(id,on=true){const x=m(id);if(on){if(x.state==='running')return refuse('Stop '+x.name+' before isolating it.');x.state='isolated';return ok(x.name+' isolated and tagged out');}if(x.state!=='isolated'&&x.state!=='open')return refuse(x.name+' is not isolated.');x.state='stopped';return ok(x.name+' back in service: tag off, valves open');}
 /** Opened for overhaul: only a stopped, isolated machine; its covers come off and its dials read nothing. */
 function openUp(id){const x=m(id);if(x.state!=='isolated')return refuse('Isolate '+x.name+' first: valves shut, tag on, then the covers come off.');x.state='open';return ok(x.name+' opened for overhaul');}
 function closeUp(id){const x=m(id);if(x.state!=='open')return refuse(x.name+' is not open.');x.state='isolated';return ok(x.name+' boxed up; still isolated');}
 function closeBreaker(id){const x=m(id);if(x.kind!=='generator')return refuse(x.name+' has no breaker on the generator panel.');if(x.state!=='running')return refuse(x.name+' is not running: start it before closing its breaker.');
  if(board.MSB.shore)return refuse('Shore power is on the board: its breaker is interlocked with the generators. Open the shore breaker first.');
  x.breaker=true;board.MSB.live=true;return ok(x.name+(generatorsOnline()>1?' synchronised and on the board':' on the board'));}
 function openBreaker(id){const x=m(id);if(!x.breaker)return refuse(x.name+'’s breaker is already open.');x.breaker=false;if(generatorsOnline()===0&&!board.MSB.shore)blackout();return ok(x.name+' off the board');}
 function shore(on){if(on){if(generatorsOnline()>0)return refuse('The generators are on the board: open their breakers first (the shore breaker is interlocked).');board.MSB.shore=true;board.MSB.live=true;return ok('Shore power on the board');}board.MSB.shore=false;if(generatorsOnline()===0)blackout();return ok('Shore power off');}
 function blackout(){board.MSB.live=false;for(const x of machines.values())if((x.kind==='pump'||x.kind==='compressor'||x.kind==='fan'||x.kind==='motor')&&x.state==='running'){x.state='stopped';}
  board.ESB.source=null;board.ESB.live=false;events.push({at:clock,kind:'blackout'});note('Blackout: the main board is dead, the emergency generator starting');}
 function valve(name,open){if(!(name in valves))return refuse('No valve '+name);valves[name]=open;if(name==='qcv'&&!open){for(const id of Object.keys(ENGINE_IDS))if(m(id).state==='running'){m(id).state='stopped';m(id).breaker=false;}if(generatorsOnline()===0&&!board.MSB.shore)blackout();return ok('Fuel quick-closing valve pulled: every engine stops');}return ok((open?'Opened ':'Shut ')+name);}
 function setTelegraph(side,order){
  if(!['mainP','mainS'].includes(side)||!['STOP','DEAD SLOW AHEAD','SLOW AHEAD','HALF AHEAD','FULL AHEAD','DEAD SLOW ASTERN','SLOW ASTERN','HALF ASTERN','FULL ASTERN'].includes(order))return refuse('Unknown engine order.');
  if(order!=='STOP'&&m(side).state!=='running')return refuse(m(side).name+' is not running.');
  if(telegraph[side]===order)return {ok:true,what:'Order unchanged'};
  telegraph[side]=order;return ok('Telegraph '+side+' '+order);
 }
 function acceptBridgeControl(){
  if(['mainP','mainS'].some(id=>m(id).state!=='running'))return refuse('Both main engines must be running before the bridge accepts control.');
  if(Object.values(telegraph).some(o=>o!=='STOP'))return refuse('Both telegraphs must be at STOP for the control handover.');
  control='bridge';return ok('Engine room: both engines ready; bridge control accepted');
 }
 function departureReadiness(){
  const why=[],r=readings();
  for(const id of ['mainP','mainS']){
   if(m(id).state!=='running')why.push(m(id).name+' is '+m(id).state);
   else{
    if(r.engines[id].loPress<.2)why.push(m(id).name+' lubricating-oil pressure is low');
    if(!coolingSupplied(id))why.push(m(id).name+' has no sea-water cooling supply');
   }
  }
  if(board.MSB.shore)why.push('Shore power is still connected');
  if(!live())why.push('Main switchboard is dead');
  if(generatorsOnline()<2)why.push('Two generators are required for the harbour manoeuvre');
  for(const id of ['hpu1','hpu2'])if(m(id).state!=='running')why.push(m(id).name+' is not running');
  if(control!=='bridge')why.push('The bridge has not accepted engine control');
  return {ready:why.length===0,reasons:why};
 }
 function changeOver(service){const sv=FERRY_SERVICES.find(s=>s.service===service);if(!sv)return refuse('No service '+service);const d=machines.get(sv.duty),s=machines.get(sv.standby);if(!d||!s)return refuse(service+' has no second pump aboard.');
  if(s.state!=='standby'&&s.state!=='stopped')return refuse(s.name+' is '+s.state+'.');const wasDuty=duty.get(service)===sv.duty,[from,to]=wasDuty?[d,s]:[s,d];duty.set(service,to.id);if(from.state==='running'){from.state='standby';to.state='running';}else if(to.state==='stopped')to.state='standby';return ok(service+': '+to.name+' takes the duty, '+from.name+' stands by');}
 /** The crew's own day (FERRY_DAY): generators at 6:10, the engines for the first boat, shore power after the last. A machine the player has handled stays as they left it until the next routine step touches it. */
 function routine(minutes){
  if(minutes>=FERRY_DAY.generators&&minutes<FERRY_DAY.shorePower){
   if(m('gen1').state!=='running'&&!m('gen1').manual&&start('gen1',{automatic:true}).ok){if(board.MSB.shore)shore(false);closeBreaker('gen1');
    for(const id of ['c1','hp1','sp1','er-fansA'])if(machines.get(id)?.state==='stopped')start(id,{automatic:true});
    for(const id of ['fp1','c2','hp2','sp2','fp2','tp2','dp2'])if(machines.get(id)?.state==='stopped')standby(id);}
   if(minutes>=FERRY_DAY.inService)for(const id of ['mainP','mainS'])if(m(id).state==='stopped'&&!m(id).manual){
    if(start('prime-'+id,{automatic:true}).ok&&start(id,{automatic:true}).ok)stop('prime-'+id,{automatic:true});}
  }else if(minutes>=FERRY_DAY.shorePower||minutes<FERRY_DAY.generators){
   for(const id of ['mainP','mainS'])if(m(id).state==='running'&&!m(id).manual)stop(id,{automatic:true});
   if(!board.MSB.shore&&!m('gen1').manual&&!underway){for(const id of ['gen1','gen2'])if(m(id).state==='running'){if(m(id).breaker)openBreaker(id);stop(id,{automatic:true});}shore(true);}
  }
 }
 /** Time passes: temperatures, air, water, fuel, bilge and hours; the pressure switches; the standby pumps. */
 function tick(dtMinutes){
  clock+=dtMinutes;
  for(const id of Object.keys(ENGINE_IDS)){const x=m(id),run=x.state==='running';if(run)x.hours+=dtMinutes/60;const target=run?82:30;temps[id]+=(target-temps[id])*Math.min(1,dtMinutes/25);
   if(run)tanks.service-=dtMinutes*(x.kind==='engine'?((telegraph[id]||'STOP')==='STOP'?.0003:.0012):.0001);}
  if(tanks.service<=0){tanks.service=0;for(const id of Object.keys(ENGINE_IDS))if(m(id).state==='running'){m(id).state='stopped';m(id).breaker=false;note(m(id).name+' stopped: the service tank ran dry');}if(generatorsOnline()===0&&!board.MSB.shore&&live())blackout();}
  if(machines.get('tp1')?.state==='running'||machines.get('tp2')?.state==='running'){tanks.service=Math.min(1,tanks.service+dtMinutes*.02);tanks.fuelStorage-=dtMinutes*.0005;}
  for(const [i,id] of [[0,'c1'],[1,'c2']]){const c=machines.get(id);if(!c)continue;if(c.state==='running')tanks.air[i]=Math.min(AIR.full,tanks.air[i]+AIR.fillPerMinute*dtMinutes);
   // The pressure switch: a compressor on standby starts at 25 bar and stops at 30 (duty by FERRY_SERVICES: No.1 unless changed over).
   if(id===duty.get('Starting air')&&live()){if(tanks.air[i]<=AIR.cutIn&&c.state!=='running'&&c.state!=='isolated'&&c.state!=='open'){c.state='running';note(c.name+' cut in at '+AIR.cutIn+' bar');}if(tanks.air[i]>=AIR.cutOut&&c.state==='running'&&!c.manual){c.state='standby';}}}
  tanks.air[0]=Math.max(0,tanks.air[0]-.002*dtMinutes);tanks.air[1]=Math.max(0,tanks.air[1]-.002*dtMinutes);
  // Fresh water: the taps use it, the duty hydrophore pump keeps the pressure tank between its switch points.
  tanks.fwPressure-=FW.usePerMinute*dtMinutes;const hp=machines.get(duty.get('Fresh water'));
  if(hp&&live()){if(tanks.fwPressure<=FW.cutIn&&hp.state!=='running'&&/stopped|standby/.test(hp.state)){hp.state='running';}if(hp.state==='running'){tanks.fwPressure=Math.min(FW.cutOut+.02,tanks.fwPressure+FW.fillPerMinute*dtMinutes);tanks.freshWater-=dtMinutes*.0003;if(tanks.fwPressure>=FW.cutOut&&!hp.manual)hp.state='standby';}}
  tanks.bilgeAft=Math.min(1,tanks.bilgeAft+dtMinutes*.0008);const bp=machines.get('bp');if(bp?.state==='running')tanks.bilgeAft=Math.max(0,tanks.bilgeAft-dtMinutes*.05);
  // The oiler pumps the well each watch before the float switch's alarm (0.5), and stops the pump when it sucks air; a pump the player handled is left alone.
  if(bp&&!bp.manual&&live()){if(tanks.bilgeAft>=.4&&bp.state==='stopped'){bp.state='running';note('Bilge pump started: the aft well pumped by the watch');}else if(bp.state==='running'&&tanks.bilgeAft<=.02)bp.state='stopped';}
  for(const x of machines.values())if(x.state==='running'&&!(x.kind==='engine'||x.kind==='generator'))x.hours+=dtMinutes/60;
  board.MSB.kW=[...machines.values()].filter(x=>x.state==='running'&&x.kind!=='engine'&&x.kind!=='generator').reduce((s,x)=>s+x.kW*.7,0)+(live()?12:0);
  if(!live()&&board.ESB.source===null&&events.some(e=>e.kind==='blackout'&&clock-e.at>=E.emergency.onLoadWithin/60)){board.ESB.source='EG';board.ESB.live=true;board.EG.state='running';note('Emergency generator on load');}
 }
 /** What the console shows: the dials (0–1 of their scales, as ferry-interior.js draws them) and the alarms that are lit. */
 function readings(){
  const eng=id=>{const x=m(id),run=x.state==='running';const order=telegraph[id]||'STOP';const rpm=!run?0:x.kind==='generator'?.6:order==='STOP'?.28:order.includes('DEAD SLOW')?.33:order.includes('SLOW')?.4:order.includes('HALF')?.5:.68;
   return {state:x.state,rpm,loPress:run?.55:(machines.get('prime-'+id)?.state==='running'?.3:0),water:Math.min(1,temps[id]/100),exhaust:run?(rpm>.4?.5:.3):0,chargeAir:run?rpm*.6:0,fuel:run?.5:0,loTemp:Math.min(1,(temps[id]-10)/100)};};
  const gens=['gen1','gen2'].map(id=>{const x=m(id),on=x.state==='running'&&x.breaker;const share=on?board.MSB.kW/Math.max(1,generatorsOnline())/E.generators.kW:0;return {id,on,running:x.state==='running',kW:Math.min(1,share),A:Math.min(1,share*E.generators.kW/E.generators.pf/(Math.sqrt(3)*E.volts)*1000/E.generators.amps/E.generators.amps*E.generators.amps),V:x.state==='running'?.88:0,Hz:x.state==='running'?.5:0};});
  const alarms=new Set();
  for(const [id,s] of [['mainP','P'],['mainS','S']]){const e=eng(id);if(m(id).state==='running'&&e.loPress<.2)alarms.add('LO PRESS '+s);if(temps[id]>95)alarms.add('WATER TEMP '+s);if(e.exhaust>.9)alarms.add('EXHAUST '+s);}
  if(tanks.service<.3)alarms.add('FUEL LEVEL');if(tanks.bilgeAft>.5)alarms.add('BILGE AFT');if(tanks.bilgeFwd>.5)alarms.add('BILGE FWD');if(fire)alarms.add('FIRE ER');if(co2)alarms.add('CO₂ RELEASED');
  if(Math.max(...tanks.air)<AIR.minimum+2)alarms.add('START AIR');if(tanks.freshWater<.15)alarms.add('FW TANK');if(board.MSB.shore)alarms.add('SHORE');if(board.ESB.source==='EG')alarms.add('EG RUN');
  for(const [id,n] of [['gen1','GEN 1 TRIP'],['gen2','GEN 2 TRIP']])if(m(id).state==='running'&&!m(id).breaker&&!board.MSB.shore&&generatorsOnline()===0)alarms.add(n);
  return {engines:{mainP:eng('mainP'),mainS:eng('mainS')},generators:gens,board:{live:live(),shore:board.MSB.shore,kW:board.MSB.kW,generatorsOnline:generatorsOnline(),emergency:board.ESB.source==='EG'},air:[...tanks.air],fwPressure:tanks.fwPressure,service:tanks.service,bilgeAft:tanks.bilgeAft,alarms:[...alarms],telegraph:{...telegraph},temps:{...temps},control,
   sound:board.ESB.source==='EG'&&!live()?'emergency':m('mainP').state==='running'||m('mainS').state==='running'?(underway?'underway':'idle'):generatorsOnline()>0?'generators':'off'};
 }
 function setUnderway(on){underway=on;}
 const snapshot=()=>({machines:[...machines.values()].map(x=>({id:x.id,state:x.state,hours:Math.round(x.hours*10)/10,breaker:x.breaker})),valves:{...valves},board:{...board.MSB},clock});
 return {machines,start,stop,standby,isolate,open:openUp,close:closeUp,closeBreaker,openBreaker,shore,valve,setTelegraph,acceptBridgeControl,departureReadiness,changeOver,routine,tick,readings,snapshot,setUnderway,serviceOf,dutyOf:service=>duty.get(service),get log(){return log.slice();},get events(){return events.slice();},machine:id=>machines.get(id)||null,get valves(){return {...valves};}};
}
