import {FERRY_MACHINERY} from './ferry-ship.js';

/** The game's visible operating sequence. These durations do not replace a crew report or a machine interlock. */
export const FERRY_PROCEDURE=Object.freeze({
 preparing:Object.freeze({label:'Preparing machinery and passengers',description:'The master calls stations. The chief directs generator transfer, auxiliaries, priming, starting and the engine-control handover; the mate and purser prepare the deck and passengers.',seconds:null}),
 securing:Object.freeze({label:'Securing vehicles and clearing their drivers',description:'The bosun checks engine off, parking brake, suitable transmission position, chocks and fitted wheel straps. Drivers walk to the passenger deck before their clearance is reported.',seconds:12}),
 'closing-access':Object.freeze({label:'Clearing the ramp and stowing the gangway',description:'The mate stops loading. The deck hand clears and stows the gangway after the last passenger is counted.',seconds:8}),
 'raising-ramp':Object.freeze({label:'Raising and locking the bow ramp',description:'The mate works the local hydraulic controls for the full 60-second lift, checks both locking pins, and reports closed and locked to the bridge.',seconds:FERRY_MACHINERY.ramp.up+4}),
 'letting-go':Object.freeze({label:'Returning line eyes and heaving aboard',description:'On the deck department’s order the shore hand lifts each eye, returns it under control to the receiving seaman, and the line is heaved and coiled aboard.',seconds:8}),
 departing:Object.freeze({label:'Master: final departure checks',description:'Machinery, vehicles, passenger clearance, ramp locks and every mooring line must be ready. The master accepts the departmental reports and orders dead slow astern.',seconds:4}),
 passage:Object.freeze({label:'Under way',description:'One actual-time motion profile controls both passenger and unaccompanied sailings. The bridge, engineering and passenger watches stay at their posts.',seconds:null}),
 arriving:Object.freeze({label:'Approaching the berth',description:'Speed reduces on the berth approach. Forward and after mooring parties go to their stations while the mate reports distance off.',seconds:null}),
 'making-fast':Object.freeze({label:'Putting out lines and making fast',description:'The telegraphs are at Stop and the mains idle alongside. Lines are paid out to the shore hand and made fast before the ramp or passenger access can open.',seconds:8}),
 'opening-access':Object.freeze({label:'Opening access after all fast',description:'The ramp lowers over 45 seconds, the gangway is checked, and wheel securing is removed. Drivers return to their cars before unloading starts.',seconds:FERRY_MACHINERY.ramp.down}),
 alongside:Object.freeze({label:'Alongside · access open',description:'Passengers and vehicles may leave through their designated access. Running machinery remains available for a warm turnaround.',seconds:0}),
 held:Object.freeze({label:'Ferry operation held',description:'A crew report or machinery interlock has refused progression. The reason remains visible and no vessel movement is fabricated.',seconds:null,sequential:false}),
});
const TITLES=Object.freeze({master:'Master',mate:'Mate',chief:'Chief engineer',oiler:'Motorman',bosun:'Bosun',deck:'Able seaman',purser:'Purser',cook:'Cook',shore:'Shore hand'});
const ISSUER=Object.freeze({master:'master',mate:'master',chief:'master',oiler:'chief',bosun:'mate',deck:'bosun',purser:'mate',cook:'purser',shore:'bosun'});
const clamp=x=>Math.max(0,Math.min(1,x));
const success=()=>({ok:true});

/**
 * One actual-time controller for requested and unaccompanied voyages. Actor movement is owned by the
 * crew controller: a task is acknowledged on arrival at its station and reported only after its gesture.
 * A public request can never set the vessel's progress or manufacture those acknowledgements.
 */
/** Who works a mooring station's lines, and where they stand: the port bow is the deck hand's; the stern, and at a bow-on
 * berth the starboard bow, the bosun's (ferry.js FERRY_MOORING.ropes). */
const LINE_POSTS=Object.freeze({fwd:Object.freeze(['deck','bow']),aft:Object.freeze(['bosun','stern']),fwdS:Object.freeze(['bosun','starboard-bow'])});
/** The bosun's stand-by before the lines: the stern alongside Minato, the starboard bow where she lies bow-on (Kitano-jima). */
function secondStation(lines,when){
 const bow=(lines||[]).some(l=>l.station==='fwdS');
 return bow?['starboard-bow',when==='arrival'?'Stand by the starboard bow for mooring':'Stand by the starboard bow mooring station',4]
  :['stern',when==='arrival'?'Stand by aft for mooring':'Stand by the after mooring station',4];
}
export function createFerryOperations({plant,sailings,getBerth,getMinutes=()=>0,getLines,
 getCrew=()=>null,getVehicles=()=>null,accessClear=()=>true,onPose=()=>{},onBerth=()=>{},onStage=()=>{}}){
 let op=null,serial=0,eventSequence=0,completionSequence=0,completed=[],plantSteps=[],plantIndex=0,startedStep=null,
  lineIndex=0,lineElapsed=0,mechanicalElapsed=0,retry=null,retryElapsed=0;
 const history=[];
 const note=(post,text,kind='report')=>{const e={sequence:++eventSequence,speaker:TITLES[post]||post,post,text,kind,stage:op?.stage||'alongside',elapsed:op?.elapsed||0};history.push(e);if(history.length>80)history.shift();};
 // An `optional` task is an order the stage does not wait for (the shore hand's early call to the bitts): he is expected
 // there, and if he is late the line hands wait for him at the line itself, as they always did.
 const task=(key,post,station,action,seconds=4,target,optional=false)=>({id:`${op.id}:${op.stage}:${key}`,post,issuer:ISSUER[post]||'master',station,action,seconds,...(target?{target}:{}),...(optional?{optional:true}:{}),complete:false,acknowledged:false});
 function tasks(next){
  const old=new Map((op.tasks||[]).map(t=>[t.id,t]));
  op.tasks=next.map(t=>old.get(t.id)||t);
  for(const t of op.tasks)if(!old.has(t.id))note(t.issuer,`${TITLES[t.post]||t.post}: ${t.action}.`,'order');
 }
 function observeTasks(){for(const t of op.tasks){
  if(!t.acknowledged&&getCrew()?.taskAtStation?.(t.id)===true){t.acknowledged=true;note(t.post,`${t.action}: at station.`,'acknowledgement');}
  if(!t.complete&&t.acknowledged&&getCrew()?.taskReady?.(t.id)===true){t.complete=true;note(t.post,`${t.action}: complete.`);}
 }}
 const allReady=()=>op.tasks.every(t=>t.complete||t.optional);
 const atStation=post=>op.tasks.filter(t=>t.post===post).every(t=>t.acknowledged);
 const vehicleSummary=()=>getVehicles()?.securingSummary?.()||{aboard:0,secured:0,driversClear:0};
 const vehiclesReady=()=>{const s=vehicleSummary();return s.secured===s.aboard&&s.driversClear===s.aboard;};
 const pending=()=>op.tasks.filter(t=>!t.complete&&!t.optional).map(t=>`${TITLES[t.post]||t.post}: ${t.action}`).join('; ');
 const checkAccess=()=>{const r=accessClear();return r===true?null:typeof r==='string'?r:'Keep the ramp and gangway clear.';};
 const startMachine=id=>plant.machine(id)?.state==='running'?success():plant.start(id,{automatic:true});
 const stopMachine=id=>plant.machine(id)?.state==='running'?plant.stop(id,{automatic:true}):success();
 function commands(...fs){for(const f of fs){const r=f();if(!r?.ok)return r||{ok:false,why:'The machinery did not acknowledge the order.'};}return success();}
 function hold(why,again){
  if(op.stage!=='held'){op.heldFrom=op.stage;op.stage='held';note('chief',why,'hold');onStage(op.stage);}
  op.blocking=why;op.holdReason=why;retry=again;retryElapsed=0;
 }
 function command(fn){const r=fn();if(r?.ok)return true;hold(r?.why||'The order was not accepted.',fn);return false;}
 function enter(stage){
  op.stage=stage;op.stageElapsed=0;op.blocking=null;op.tasks=[];mechanicalElapsed=0;startedStep=null;onStage(stage);
  if(stage==='securing'){
   getVehicles()?.beginSecuring?.(op.id);
   tasks([task('car-check','bosun','car-deck','Check engines off, parking brakes, transmission and wheel securing',12,getVehicles()?.securingStation?.()),task('drivers','purser','saloon','Confirm drivers and passengers are clear of the vehicle deck',6)]);
  }else if(stage==='closing-access'){
   tasks([task('ramp-clear','mate','ramp','Clear the ramp and close the vehicle access',8),task('gangway','deck','gangway','Count the last passengers and stow the gangway',8)]);
  }else if(stage==='raising-ramp'){
   // The shore hand walks out to the first bitt while the ramp comes up, so letting go starts with both ends of the line manned.
   tasks([task('ramp-up','mate','ramp','Raise the bow ramp and check both locking pins',FERRY_MACHINERY.ramp.up+4),task('bow-ready','deck','bow','Stand by the forward mooring station',4),task('aft-ready','bosun',...secondStation(op.lines,'ready')),
    task('shore-standby','shore',`shore-${op.origin}`,'Stand by on the quay for her lines',4,op.lines[0]?.shoreTarget,true)]);
  }else if(stage==='letting-go'||stage==='making-fast'){
   lineIndex=0;lineElapsed=0;lineTasks(stage==='making-fast');
  }else if(stage==='departing'){
   tasks([task('release','master','wheelhouse','Accept all reports and order departure',4),task('lookout','mate','port-wing','Report the berth and water ahead clear',4)]);
  }else if(stage==='opening-access'){
   op.ramp.locked=false;
   tasks([task('ramp-down','mate','ramp','Lower the bow ramp onto its landing',FERRY_MACHINERY.ramp.down),task('gangway-out','deck','gangway','Rig the passenger gangway and check its landing',8),task('release-cars','bosun','car-deck','Remove wheel securing after all fast',12,getVehicles()?.securingStation?.()),task('passengers','purser','saloon','Prepare passengers and drivers to disembark',6)]);
  }else if(stage==='passage'){
   tasks([task('bridge-watch','master','wheelhouse','Keep the navigation watch',4),task('lookout','mate','port-wing','Keep a lookout',4),task('engineering-watch','chief','engine-room','Monitor engines and the switchboard',4),task('oiler-watch','oiler','engine-room','Check machinery temperatures and pressures',4),task('deck-round','bosun','car-deck','Check the secured vehicle deck',4),task('deck-watch','deck','saloon','Keep passenger exits clear',4),task('passenger-watch','purser','purser','Attend the passengers',4),task('galley-watch','cook','galley','Keep the galley secure',4)]);
  }else if(stage==='arriving'){
   // The shore hand is called to the berth on the approach, so he is at the first bitt when her lines come over.
   tasks([task('bridge-arrival','master','wheelhouse','Con the ship alongside',4),task('lookout-arrival','mate','port-wing','Report the distance off the berth',4),task('bow-arrival','deck','bow','Stand by forward for mooring',4),task('aft-arrival','bosun',...secondStation(getLines(op.destination),'arrival')),
    task('shore-standby','shore',`shore-${op.destination}`,'Stand by at the berth for her lines',4,getLines(op.destination)[0]?.shoreTarget,true)]);
  }else if(stage==='alongside'){
   note('master','All fast. Ramp landed and access checked; passengers may disembark.');
   const event={sequence:++completionSequence,id:op.id,destination:op.destination,origin:op.origin,automatic:op.automatic,sailing:op.sailing,departs:op.departs,startedMinute:op.startedMinute,elapsed:op.elapsed};
   completed.push(event);if(completed.length>12)completed.shift();
  }
 }
 function lineTasks(arrival){
  const l=op.lines[lineIndex];if(!l){const where=op.lines.some(x=>x.station==='aft')?'Forward and aft':'Both bows';note('bosun',arrival?`${where}: all lines fast.`:`${where}: all lines aboard and coiled.`);note('mate',arrival?'Master, the vessel is all fast.':'Master, the deck department is ready for departure.');enter(arrival?'opening-access':'departing');return;}
  const [post,station]=LINE_POSTS[l.station]||LINE_POSTS.aft;
  tasks([task(`line-${lineIndex}-ship`,post,station,arrival?`Pay out ${l.name} under control`:`Receive the ${l.name} eye and heave it aboard`,8),
   task(`line-${lineIndex}-shore`,'shore',`shore-${arrival?op.destination:op.origin}`,arrival?`Make the ${l.name} eye fast`:`Lift and return the ${l.name} eye`,8,l.shoreTarget)]);
 }
 function preparePlant(){
  const warm=['mainP','mainS'].every(id=>plant.machine(id)?.state==='running'||plant.readings().temps[id]>60);op.coldStart=!warm;
  const generator=id=>commands(()=>startMachine(id),()=>plant.readings().board.shore?plant.shore(false):success(),()=>plant.machine(id).breaker?success():plant.closeBreaker(id));
  const auxiliaries=()=>commands(...['er-fansA','hpu1','hpu2','c1'].map(id=>()=>startMachine(id)));
  const needsPrime=()=>['mainP','mainS'].filter(id=>plant.machine(id)?.state!=='running');
  plantSteps=[
   {id:'checks',post:'chief',action:'Inspect fuel, cooling, starting air and engine-room readiness',seconds:6,finish:()=>success()},
   {id:'gen1',post:'chief',action:'Start generator No.1 and transfer from shore power',seconds:4,finish:()=>generator('gen1')},
   {id:'gen2',post:'chief',action:'Synchronise generator No.2 for harbour manoeuvring',seconds:4,finish:()=>generator('gen2')},
   {id:'auxiliaries',post:'oiler',action:'Run ventilation and both steering power units',seconds:6,finish:auxiliaries},
   {id:'priming',post:'oiler',action:'Prime the main-engine lubricating oil',seconds:warm?6:20,skip:()=>needsPrime().length===0,start:()=>commands(...needsPrime().map(id=>()=>startMachine('prime-'+id)))},
   ...['mainP','mainS'].map((id,i)=>({id,post:'chief',action:`Start the ${i?'starboard':'port'} main engine at idle`,seconds:6,skip:()=>plant.machine(id)?.state==='running',finish:()=>commands(()=>startMachine(id),()=>stopMachine('prime-'+id))})),
   {id:'stabilise',post:'oiler',action:'Check stable idle, oil pressure and cooling flow',seconds:warm?6:30,finish:()=>{const r=plant.readings();return ['mainP','mainS'].every(id=>r.engines[id].state==='running'&&r.engines[id].loPress>=.2)?success():{ok:false,why:'The mains have not established stable idle and lubricating-oil pressure.'};}},
   {id:'steering',post:'chief',action:'Check steering response and report machinery ready',seconds:8,finish:()=>['hpu1','hpu2'].every(id=>plant.machine(id)?.state==='running')?success():{ok:false,why:'Both steering power units must respond before departure.'}},
   {id:'handover',post:'master',station:'wheelhouse',action:'Accept engine control from the chief engineer',seconds:5,finish:()=>plant.acceptBridgeControl()},
  ];plantIndex=0;
 }
 function preparationTasks(){
  while(plantIndex<plantSteps.length&&plantSteps[plantIndex].skip?.())plantIndex++;
  const s=plantSteps[plantIndex];op.plantStage=s?.action||'Machinery ready';
  const bases=[task('bridge','master','wheelhouse','Check the route and issue stations',6),task('lookout','mate','port-wing','Check traffic and the berth',6),task('deck','bosun','car-deck','Inspect vehicle lanes and securing equipment',6),task('boarding','deck','gangway','Supervise boarding',6),task('passengers','purser','purser','Check the passenger count and exits',8),task('galley','cook','galley','Secure the galley and loose equipment',6)];
  // The bridge handover replaces the master's already completed preparation task; one actor never has two destinations.
  tasks([...bases.filter(t=>!s||t.post!==s.post),...(s?[task('plant-'+s.id,s.post,s.station||'engine-room',s.action,s.seconds)]:[])]);
 }
 function tickPreparation(){
  preparationTasks();observeTasks();const s=plantSteps[plantIndex],t=s&&op.tasks.find(t=>t.id.endsWith(':plant-'+s.id));
  if(s&&t.acknowledged&&startedStep!==s.id){if(s.start&&!command(s.start))return;startedStep=s.id;}
  if(s&&t.complete){if(s.finish&&!command(s.finish))return;plantIndex++;startedStep=null;preparationTasks();}
  const loaded=getVehicles()?.prepareCrossing?.(op.destination)??true;
  if(plantIndex<plantSteps.length){op.blocking=pending();return;}
  const ready=plant.departureReadiness();
  if(!ready.ready){op.blocking=ready.reasons.join('; ');return;}
  // A car already on her ramp is waited for; one still on the road misses a timetabled sailing and takes the next.
  const late=Number.isFinite(op.departs)&&getMinutes()>=op.departs&&!getVehicles()?.loadingVehicles;
  if(!loaded&&!late){op.blocking='Waiting for the vehicle on the loading route.';return;}
  if(!allReady()){op.blocking=pending();return;}
  // The timetable's sailing: ready early, she keeps her gangway out until her time (world/ferry-timetable.js).
  if(Number.isFinite(op.departs)&&getMinutes()<op.departs){op.blocking='Alongside until her sailing time.';return;}
  note('chief','Master, both main engines and steering are ready; two generators are on the board and bridge control is accepted.');enter('securing');
 }
 function lineTick(dt,arrival){
  const l=op.lines[lineIndex];if(!l)return;
  if(!allReady()&&!op.tasks.every(t=>t.acknowledged)){op.blocking=pending();return;}
  lineElapsed=Math.min(8,lineElapsed+dt);const p=lineElapsed/8;l.progress=p;
  l.status=arrival?(p<.5?'paying-out':p<1?'eye-ashore':'fast'):(p<.25?'slack':p<.5?'eye-return':p<1?'heaving':'coiled');
  if(p>=1&&allReady()){l.status=arrival?'fast':'coiled';lineIndex++;lineElapsed=0;lineTasks(arrival);}
 }
 function readyToMove(){
  const why=plant.departureReadiness().reasons.slice();
  if(!vehiclesReady())why.push('Vehicle securing or driver clearance is incomplete');
  if(op.ramp.down>1e-6||!op.ramp.locked)why.push('The ramp is not closed and locked');
  if(op.gangway.out>1e-6)why.push('The gangway is not stowed');
  if(op.lines.some(l=>l.status!=='coiled'))why.push('A mooring line is still ashore');
  return {ready:why.length===0,reasons:why};
 }
 function tick(dt){
  if(!op||op.stage==='alongside'||!(dt>0)||!Number.isFinite(dt))return;
  // A suspended browser never catches the vessel up in one visible jump.
  dt=Math.min(dt,.25);op.elapsed+=dt;op.stageElapsed+=dt;op.blocking=null;
  if(op.stage==='held'){
   op.blocking=op.holdReason;retryElapsed+=dt;
   if(retry&&retryElapsed>=1){retryElapsed=0;const r=retry();if(r?.ok){op.stage=op.heldFrom;op.heldFrom=null;retry=null;note('chief','The held order has been accepted.');onStage(op.stage);}else op.blocking=r?.why||op.holdReason;}
   return;
  }
  observeTasks();
  if(op.stage==='preparing'){tickPreparation();return;}
  if(op.stage==='securing'){
   if(atStation('bosun'))getVehicles()?.advanceSecuring?.(dt,op.id);
   if(allReady()&&vehiclesReady()){note('bosun','Mate, vehicle securing is complete.');note('purser','Mate, all drivers and passengers are clear of the vehicle deck.');enter('closing-access');}else op.blocking=vehiclesReady()?pending():'Wheel securing and driver clearance are still in progress.';
  }else if(op.stage==='closing-access'){
   const blocked=checkAccess();if(blocked){op.blocking=blocked;return;}
   if(op.tasks.every(t=>t.acknowledged)){mechanicalElapsed+=dt;op.gangway.out=op.origin==='town'?1-clamp(mechanicalElapsed/8):0;}
   if(allReady()&&mechanicalElapsed>=8){op.gangway.out=0;enter('raising-ramp');}
  }else if(op.stage==='raising-ramp'){
   const blocked=checkAccess();if(blocked){op.blocking=blocked;return;}
   if(!atStation('mate')){op.blocking=pending();return;}
   if(!command(()=>startMachine('rp1')))return;
   mechanicalElapsed+=dt;op.ramp.down=1-clamp(mechanicalElapsed/FERRY_MACHINERY.ramp.up);
   if(mechanicalElapsed>=FERRY_MACHINERY.ramp.up+4&&allReady()){
    op.ramp.locked=true;stopMachine('rp1');note('mate','Bow ramp closed; both locking pins checked.');enter('letting-go');
   }
  }else if(op.stage==='letting-go')lineTick(dt,false);
  else if(op.stage==='departing'){
   const r=readyToMove();if(!r.ready){op.blocking=r.reasons.join('; ');return;}
   if(allReady()){op.sailingElapsed=0;plant.setUnderway(true);note('master','All lines aboard. Dead slow astern.');enter('passage');}
  }else if(op.stage==='passage'||op.stage==='arriving'){
   const r=readyToMove();if(!r.ready){op.blocking=r.reasons.join('; ');for(const id of ['mainP','mainS'])plant.setTelegraph(id,'STOP');return;}
   const sailing=sailings[op.destination];op.sailingElapsed=Math.min(sailing.duration,op.sailingElapsed+dt);
   const p=sailing.pose(op.sailingElapsed);op.sailingKind=p.kind;op.progress=op.sailingElapsed/sailing.duration;
   const order=p.kind==='astern'?'DEAD SLOW ASTERN':p.kind==='swing'?'STOP':p.kind==='sea'?'HALF AHEAD':p.kind==='manoeuvring'?'SLOW AHEAD':'DEAD SLOW AHEAD';
   if(p.kind==='swing'&&!command(()=>startMachine('thruster')))return;
   if(p.kind!=='swing')stopMachine('thruster');
   for(const id of ['mainP','mainS'])if(!command(()=>plant.setTelegraph(id,order)))return;
   onPose(p,op);
   if(op.stage==='passage'&&op.sailingElapsed>sailing.duration*.55&&['approach','berthing','swing'].includes(p.kind))enter('arriving');
   if(op.sailingElapsed>=sailing.duration){
    for(const id of ['mainP','mainS'])plant.setTelegraph(id,'STOP');stopMachine('thruster');plant.setUnderway(false);
    op.lines=getLines(op.destination).map(l=>({...l,status:'coiled',progress:0}));onBerth(op.destination);note('master','Alongside. Telegraphs STOP; mains at idle. Make fast before opening access.');enter('making-fast');
   }
  }else if(op.stage==='making-fast')lineTick(dt,true);
  else if(op.stage==='opening-access'){
   if(op.lines.some(l=>l.status!=='fast')){op.blocking='All mooring lines must be fast before access opens.';return;}
   if(atStation('mate')){if(!command(()=>startMachine('rp1')))return;mechanicalElapsed+=dt;op.ramp.down=clamp(mechanicalElapsed/FERRY_MACHINERY.ramp.down);}
   if(atStation('deck'))op.gangway.out=op.destination==='town'?clamp(mechanicalElapsed/8):0;
   if(atStation('bosun'))getVehicles()?.advanceUnsecuring?.(dt,op.id);
   const released=getVehicles()?.readyToDisembark?.()??true;
   if(mechanicalElapsed>=FERRY_MACHINERY.ramp.down&&allReady()&&released){stopMachine('rp1');op.ramp.down=1;enter('alongside');}
  }
  if(!op.blocking&&!allReady()&&!['passage','arriving'].includes(op.stage))op.blocking=pending();
 }
 function request(destination,{automatic=false,departs=null,sailing=null}={}){
  if(op&&op.stage!=='alongside'||!sailings[destination]||destination===getBerth())return false;
  const origin=getBerth();op={id:++serial,stage:'preparing',origin,destination,automatic:!!automatic,departs:Number.isFinite(departs)?departs:null,sailing,startedMinute:getMinutes(),elapsed:0,stageElapsed:0,sailingElapsed:0,progress:0,
   tasks:[],lines:getLines(origin).map(l=>({...l,status:'fast',progress:0})),ramp:{down:1,locked:false},gangway:{out:origin==='town'?1:0},blocking:null};
  for(const id of ['mainP','mainS'])plant.setTelegraph(id,'STOP');plant.setUnderway(false);preparePlant();preparationTasks();onStage(op.stage);
  note('master',`Prepare for departure from ${origin==='town'?'Minato':'Kitano-jima'}; report through your department.`, 'order');return true;
 }
 function snapshot(){
  if(!op)return null;const def=FERRY_PROCEDURE[op.stage],r=plant.departureReadiness();
  let progress=0;if(op.stage==='raising-ramp')progress=1-op.ramp.down;else if(op.stage==='opening-access')progress=op.ramp.down;else if(['letting-go','making-fast'].includes(op.stage))progress=(lineIndex+lineElapsed/8)/op.lines.length;else if(['passage','arriving'].includes(op.stage))progress=op.progress;
  else if(op.tasks.length)progress=op.tasks.filter(t=>t.complete).length/op.tasks.length;
  return {...op,label:def?.label||op.stage,stageDuration:def?.seconds??null,phaseProgress:clamp(progress),tasks:op.tasks.map(t=>({...t})),lines:op.lines.map(l=>({...l})),ramp:{...op.ramp},gangway:{...op.gangway},plant:{stage:op.plantStage,ready:r.ready,reasons:r.reasons},vehicleSummary:vehicleSummary(),history:history.map(e=>({...e}))};
 }
 return {request,tick,snapshot,readyToMove,get active(){return !!op&&op.stage!=='alongside';},get stage(){return op?.stage||'alongside';},get completed(){return completed.map(e=>({...e}));},reset(){if(op&&op.stage!=='alongside')return false;op=null;return true;},
  /** Only for the town's clock jumping (ferry.js settle): the voyage is taken as made, and she is put where the timetable has her. */
  abandon(){if(op){note('master','The clock has moved on: the voyage is logged as made.');op=null;}plant.setUnderway(false);return true;}};
}
