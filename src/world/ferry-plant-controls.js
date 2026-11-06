import {FERRY_INTERIOR,FERRY_ENGINE_ROOM} from './ferry-interior.js';
import {FERRY_SERVICES} from './ferry-piping.js';
import {FERRY_SHIP} from './ferry-ship.js';
/**
 * The handles of the plant (6r-2): where the player stands to work a machine, what the prompt there says, and the
 * menu it opens, built from the plant's own state (ferry-plant.js) so only what the machine can do is offered and
 * every refusal is the chief's reason. Pure: no three.js; ferry.js places the stations and game.js draws the menus.
 *
 * A station is a place on the ship (her frame) that works one or more machines: the local control stand at each main
 * engine's forward end (the engine and its priming pump), each generator's panel on the switchboard (start, stop, the
 * breaker), each pump and compressor at its start box, and the control console in the booth (the readings, the alarm
 * matrix, change-over of every duty/standby pair).
 */
const HALF=FERRY_SHIP.length/2,Z=zy=>zy-HALF,FP=FERRY_ENGINE_ROOM.floor;
const A=FERRY_INTERIOR.anchors;
const at=(key,dx=0,dy=0,dz=0)=>{const a=A[key];if(!a)throw new RangeError('No anchor '+key);return [a.pos[0]+dx,a.pos[1]+dy,a.pos[2]+dz];};
const panel=name=>{const p=FERRY_INTERIOR.plates.find(p=>p.name==='label: '+name);if(!p)throw new RangeError('No panel '+name);return [p.pos[0],FP+1.1,p.pos[2]+.5];};
const station=(id,pos,machines,title,o={})=>Object.freeze({id,pos:Object.freeze(pos),machines:Object.freeze(machines),title,reach:o.reach??1.9,kind:o.kind||'machine'});
export const PLANT_STATIONS=Object.freeze([
 station('stand-mainP',at('lube/prime-mainP',-.55,.6,.1),['mainP','prime-mainP'],'Port main engine · local control stand'),
 station('stand-mainS',at('lube/prime-mainS',.55,.6,.1),['mainS','prime-mainS'],'Starboard main engine · local control stand'),
 station('panel-gen1',panel('generator no.1'),['gen1'],'Generator No.1 panel'),
 station('panel-gen2',panel('generator no.2'),['gen2'],'Generator No.2 panel'),
 // Local panels travel with the relocated auxiliary-room machines; switchboard operation remains in the booth.
 station('local-gen1',[.6,FP+1.1,A['fuel/fuel-gen1'].pos[2]-.55],['gen1'],'Generator No.1 local control',{reach:1.0}),
 station('local-gen2',[-.6,FP+1.1,A['fuel/fuel-gen2'].pos[2]-.55],['gen2'],'Generator No.2 local control',{reach:1.0}),
 station('pump-fp1',at('fire/fp1',.6,.5),['fp1'],'Fire & GS pump No.1'),station('pump-fp2',at('fire/fp2',.6,.5),['fp2'],'Fire & bilge pump No.2'),
 station('pump-gs',at('seawater/gs',.6,.5),['gs'],'General-service pump'),station('pump-bp',at('bilge/bp',.5,.75),['bp'],'Bilge pump'),
 station('pump-sp1',at('sewage/sp1',.6,.5),['sp1'],'Sanitary pump No.1'),station('pump-hp1',at('freshwater/hp1',.6,.5),['hp1'],'Hydrophore pump No.1'),
 station('comp-c1',at('air/c1',0,.4,.6),['c1'],'Air compressor No.1'),
 station('pump-tp1',at('fuel/tp1',-.6,.5),['tp1'],'Fuel transfer pump No.1'),station('pump-tp2',at('fuel/tp2',-.6,.5),['tp2'],'Fuel transfer pump No.2'),
 station('pump-hp2',at('freshwater/hp2',-.6,.5),['hp2'],'Hydrophore pump No.2'),station('pump-sp2',at('sewage/sp2',-.6,.5),['sp2'],'Sanitary pump No.2'),
 station('comp-c2',at('air/c2',.6,.4),['c2'],'Air compressor No.2'),station('pump-balp',at('bilge/balp',.5,.75),['balp'],'Ballast pump'),
 station('console',[-3.4,FP+1.0,Z(10.1)],[],'Engine control console',{kind:'console',reach:2.2}),
]);

const STATE_WORDS=Object.freeze({running:'running',stopped:'stopped',standby:'on standby',isolated:'isolated · tagged out',open:'opened for overhaul'});
/** One line about a machine, as the prompt or a menu shows it: its name and state (and its breaker, for a generator). */
export function machineLine(plant,id){
 const x=plant.machine(id);if(!x)return '';
 return x.name+' · '+STATE_WORDS[x.state]+(x.kind==='generator'&&x.state==='running'?(x.breaker?' · on the board':' · breaker open'):'');
}
/** The prompt at a station: the first machine's state (the engine at a stand, the pump at its box), the console's alarms. */
export function stationLabel(plant,st){
 if(st.kind==='console'){const r=plant.readings();return 'Control console · '+(r.alarms.length?r.alarms.length+' alarm'+(r.alarms.length===1?'':'s'):r.board.live?(r.board.shore?'shore power':r.board.generatorsOnline+' on the board'):'board dead');}
 return machineLine(plant,st.machines[0]);
}
/**
 * The menu at a station: {title, line, items:[{label, act}]}; `act()` works the plant and returns its {ok, what|why}.
 * Only what the machine can do now is offered: a running machine can be stopped (an engine not under way); a stopped
 * one started, put on standby or isolated; an isolated one opened for overhaul or returned to service; an open one boxed up.
 */
export function stationMenu(plant,st){
 if(st.kind==='console')return consoleMenu(plant);
 const items=[];
 for(const id of st.machines){const x=plant.machine(id);if(!x)continue;const n=x.name;
  if(x.state==='running'){items.push({label:'Stop '+n,act:()=>plant.stop(id)});if(x.kind==='generator')items.push(x.breaker?{label:'Open breaker',act:()=>plant.openBreaker(id)}:{label:'Close breaker',act:()=>plant.closeBreaker(id)});}
  else if(x.state==='stopped'||x.state==='standby'){items.push({label:'Start '+n,act:()=>plant.start(id)});if(x.state==='stopped'&&plant.serviceOf(id))items.push({label:'Put '+n+' on standby',act:()=>plant.standby(id)});items.push({label:'Isolate '+n+' · tag out',act:()=>plant.isolate(id,true)});}
  else if(x.state==='isolated'){items.push({label:'Open '+n+' for overhaul',act:()=>plant.open(id)});items.push({label:'Return '+n+' to service',act:()=>plant.isolate(id,false)});}
  else if(x.state==='open')items.push({label:'Box up '+n,act:()=>plant.close(id)});}
 return {title:st.title,line:st.machines.map(id=>machineLine(plant,id)).join('\n'),items};
}
/** The console: what the board and the engines are doing, the alarms lit, and a change-over for every pair with a standby aboard. */
export function consoleMenu(plant){
 const r=plant.readings();
 const eng=(id,name)=>name+' '+plant.machine(id).state+(plant.machine(id).state==='running'?' · '+(r.telegraph[id]||'STOP').toLowerCase():'');
 const line=[(r.board.live?(r.board.shore?'Shore power on the board':r.board.generatorsOnline+' generator'+(r.board.generatorsOnline===1?'':'s')+' on the board, '+Math.round(r.board.kW)+' kW'):r.board.emergency?'Blackout · the emergency generator on load':'Blackout · the main board is dead'),
  eng('mainP','Port engine'),eng('mainS','Starboard engine'),'Starting air '+r.air.map(a=>a.toFixed(0)).join(' / ')+' bar · service tank '+Math.round(r.service*100)+' % · fresh water '+r.fwPressure.toFixed(2)+' MPa',
  r.alarms.length?'Alarms: '+r.alarms.join(', '):'No alarms'].join('\n');
 const items=[];
 for(const sv of FERRY_SERVICES){const d=plant.machine(sv.duty),s=plant.machine(sv.standby);if(!d||!s)continue;const onDuty=plant.dutyOf(sv.service);
  items.push({label:'Change over '+sv.service.toLowerCase()+' · duty '+plant.machine(onDuty).name,act:()=>plant.changeOver(sv.service)});}
 return {title:'Engine control console',line,items};
}
/**
 * What the ship sounds like from her plant (town-audio.js ENGINE): nothing on shore power, the generators' hum, the
 * engines idling alongside, manoeuvring or at sea by how far out she is, the emergency generator alone in a blackout.
 */
export function plantSound(readings,{underway=false,exposure=0}={}){
 const s=readings.sound;
 if(s==='underway'||(s==='idle'&&underway))return exposure>.5?'sea':'manoeuvring';
 return s;
}
/** The telegraph order the bridge has rung for her phase (ferry.js): the engines burn fuel by it. */
export function telegraphFor(phase,exposure=0){
 if(phase==='waiting'||phase==='away')return 'STOP';
 if(phase==='reversing')return 'SLOW ASTERN';
 if(phase==='swinging')return 'SLOW AHEAD';
 return exposure>.5?'FULL AHEAD':'HALF AHEAD';
}
/**
 * A live plate's reading from the plant (ferry-interior.js `live`): a dial's value 0–1 of its scale ('mainP.rpm',
 * 'gen1.kW', 'air0' for the first bottle of 30 bar), or the alarm matrix's lit names ('alarms').
 */
export function liveValue(readings,key){
 if(key==='alarms')return readings.alarms;
 if(key==='readout')return readoutLines(readings);
 if(key==='air0'||key==='air1')return Math.max(0,Math.min(1,readings.air[key==='air0'?0:1]/30));
 const [who,what]=key.split('.');
 if(who in readings.engines)return readings.engines[who][what]??0;
 const g=readings.generators.find(g=>g.id===who);if(!g)return 0;
 if(what==='rpm')return g.running?.6:0;
 return g[what]??0;
}
/** The console's readout strip (two lines): the engines, the board, the air and the tanks, in the units the dials use. */
export function readoutLines(r){
 const eng=(id,name)=>{const e=r.engines[id];return name+' '+Math.round(e.rpm*1000)+' rpm · LO '+(e.loPress*6).toFixed(1)+' bar · JW '+Math.round(e.water*100)+' °C · EXH '+Math.round(e.exhaust*600)+' °C · '+(r.telegraph[id]||'STOP');};
 const board=r.board.live?(r.board.shore?'SHORE POWER ON BOARD':r.board.generatorsOnline+' GEN ON BOARD · '+Math.round(r.board.kW)+' kW'):r.board.emergency?'BLACKOUT · EMERGENCY GEN ON':'BLACKOUT · BOARD DEAD';
 return [eng('mainP','PORT'),eng('mainS','STBD'),board+' · AIR '+r.air.map(a=>a.toFixed(0)).join('/')+' bar','SERVICE TANK '+Math.round(r.service*100)+' % · FW '+r.fwPressure.toFixed(2)+' MPa · BILGE AFT '+Math.round(r.bilgeAft*100)+' %'];
}

