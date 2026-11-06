import * as THREE from '../../vendor/three.module.js';
import {airportWorld,airportSurface} from '../world/airport-ground.js';
import {KITANO_HAMLET,KITANO_PIER_STAND,hamletGate} from '../world/kitano-hamlet-layout.js';
import {FERRY_SHORE,FERRY_WORKING_DAY} from './ferry-crew.js';
import {createShoreWalker,worldPoint,setWorldPoint,SHORE_RADIUS as R} from './shore-walker.js';
import {callToQuay} from './shore-duty.js';
import {quayClaim} from './quay-breaks.js';
import {FERRY_TIMETABLE} from '../world/ferry-timetable.js';

/**
 * One real shore body at each berth, the roster's line hands (people/roster.js SHORE_ROLES; ferry-crew.js FERRY_SHORE):
 *  - at Minato, the harbour agent (the Harbour master's street body, Jack's), who keeps the berth radio in the Harbour
 *    Office between calls and walks from wherever his day has him to each bitt when the ship calls for her lines;
 *  - at Kitano-jima, Kai, the line hand, whose only body is this one: he stands by on the pier through the ship's day
 *    and goes home to the Shiroma house across the lane for the night (KITANO_HOME).
 * The Minato body belongs to the street's cast AI (schedules.js), which yields it while `ferryShoreTask` is set and the
 * rooms let him out when shore-duty.js says he is called; it is taken only when it is free (not borrowed into a room,
 * a vehicle or the ferry), and walked back to where it was taken from when the lines are done.
 */
/** Where Kai sleeps: the Shiroma house's gate (kitano-hamlet-layout.js kitano-2), in the world. */
export const KITANO_HOME=(()=>{const p=KITANO_HAMLET.plots.find(p=>p.id==='kitano-2'),{door}=hamletGate(p,1.1);const [x,z]=airportWorld(door[0],door[1]);return Object.freeze([x,z]);})();
/** The Kitano hand's day: out of the house before the crew sign on, home once the last boat has left Kitano-jima's pier (ferry-timetable.js). */
export const KITANO_HAND_DAY=Object.freeze({out:FERRY_WORKING_DAY.signOn-5,home:Math.max(...FERRY_TIMETABLE.filter(s=>s.from==='airport').map(s=>s.departs))+5});
const minute=m=>((m%1440)+1440)%1440;
export const kitanoHandOut=minutes=>{const m=minute(minutes);return m>=KITANO_HAND_DAY.out&&m<KITANO_HAND_DAY.home;};
/** How far round the straight line a route may look: the quay's way round the port building, Kitano's round the hamlet's walls. */
const MARGIN=Object.freeze({town:24,airport:12});
/** A street body the quay cannot take yet: borrowed into a room, riding, or aboard the ship herself. */
const busy=u=>!!(u.inWorkplace||u.inRamen||u.inMarket||u.inIzakaya||u.inOnsen||u.inHome||u.inBookshop||u.inVehicle||u.ferryPassenger||u.roomTransition||u.aboardFerry);

export function createFerryShoreCrew({shoreParent,shoreColliders=[],characters,register,onAction,townBody=()=>null}){
 const bodies=new Map(),walker=createShoreWalker(shoreColliders);
 const minato=FERRY_SHORE.find(s=>s.post==='linesman'),kitano=FERRY_SHORE.find(s=>s.post==='airport-linesman');
 function body(port){
  if(bodies.has(port))return bodies.get(port);
  let g,actor,home;
  if(port==='town'){
   g=townBody(minato.name);if(!g)return null;actor=g.userData.character||null;home=worldPoint(g);
  }else{
   if(!shoreParent)return null;
   g=new THREE.Group();g.name=kitano.name;g.userData.name=kitano.name;g.userData.ferryShoreRole=true;shoreParent.add(g);
   const [x,z]=airportWorld(...KITANO_PIER_STAND);home=[x,airportSurface(x,z,R)?.y??.1,z];setWorldPoint(g,home);
   actor=characters?.attach(g,kitano.name);
   const a=new THREE.Object3D();a.position.y=1.2;g.add(a);
   register?.(a,'Talk to '+kitano.name,()=>onAction?.('inspect',kitano.name,(g.userData.activity||'Standing by for the ferry’s shore lines.')+' '+kitano.why));
  }
  const b={port,g,actor,name:g.userData.name,home,route:[],index:0,search:null,task:null,blocked:null,state:'standing by',elapsed:0,returning:false,taken:false,rest:null};
  bodies.set(port,b);return b;
 }
 /** Take the body for the quay: visible, out of its doorway, its own controller yielding. */
 function take(b){
  const u=b.g.userData;
  // The street body goes back to where it was taken from (its doorway); Kai's post is always the pier.
  if(b.port==='town')b.home=worldPoint(b.g);
  u.ferryShoreTask=true;u.sleeping=false;u.sleepBlend=0;u.tipsy=0;u.socialPose='Idle';u.walking=true;
  delete u.seatHeight;delete u.heldItem;delete u.heldPortion;delete u.chairBlend;delete u.indoors;delete u.usingTownObject;
  b.g.visible=true;b.taken=true;b.rest=null;
 }
 function assign(task){
  const port=task.station==='shore-airport'?'airport':'town',b=body(port);if(!b)return null;
  if(b.task?.id===task.id)return b;
  const t=task.target;if(!t||![t.x,t.y,t.z].every(Number.isFinite)){b.blocked='The shore task has no landing target';b.task=task;return b;}
  // A new task while he is still out (the next line, or the lines after the standby): no return in between.
  const out=b.taken||b.returning;b.task=task;b.elapsed=0;b.returning=false;b.taken=out;
  if(port==='town')callToQuay(b.name,true);
  if(out){const t=b.task.target;walker.plan(b,[t.x,t.y,t.z],{margin:MARGIN[b.port]});}
  else start(b);
  return b;
 }
 /** Begin the walk to the task's bitt as soon as the body is free to walk the quay. */
 function start(b){
  if(b.taken||!b.task)return;
  if(b.port==='town'&&busy(b.g.userData)){b.state='called to the quay';b.g.userData.ferryShoreTask=true;return;}
  take(b);const t=b.task.target;walker.plan(b,[t.x,t.y,t.z],{margin:MARGIN[b.port]});
 }
 function update(dt,tasks,workReady=true,minutes=0){
  const active=new Set(tasks.map(t=>t.id));
  // Kai is at his pier (or at home) from the first frame, not from the first call for lines.
  body('airport');
  for(const task of tasks)assign(task);
  for(const b of bodies.values()){
   if(b.task&&!active.has(b.task.id)){
    b.task=null;b.elapsed=0;
    if(b.taken){b.returning=true;walker.plan(b,b.home,{margin:MARGIN[b.port]});}
    else{b.g.userData.ferryShoreTask=false;if(b.port==='town')callToQuay(b.name,false);b.state='standing by';}
   }
   if(b.task&&!b.taken){start(b);if(!b.taken){b.g.userData.activity='Called to the quay for the ferry’s lines';continue;}}
   if(b.port==='airport'&&!b.task&&!b.returning){rest(b,minutes,Math.min(Math.max(dt,0),.5));continue;}
   if(!b.task&&!b.returning)continue;
   const arrived=walker.step(b,Math.min(Math.max(dt,0),.5));
   const u=b.g.userData;u.walking=!arrived;u.socialPose=arrived&&b.task&&workReady?'Interact':'Idle';
   if(arrived&&b.task){
    if(workReady){b.elapsed=Math.min(b.task.seconds||0,b.elapsed+Math.min(Math.max(dt,0),.5));b.state=b.elapsed>=(b.task.seconds||0)?'reported complete':'working the line';}
    else b.state='waiting for ship crew';
   }
   else if(arrived&&b.returning){
    b.returning=false;b.taken=false;b.state='standing by';u.ferryShoreTask=false;u.walking=false;u.socialPose='Idle';
    if(b.port==='town')callToQuay(b.name,false);
   }
   u.activity=b.blocked?'Waiting for a clear shore route':b.state==='waiting for ship crew'?'At the shore bitt; waiting for the ship’s line hand':b.task?b.task.action:b.returning?(b.port==='town'?'Back to the office radio from the ferry’s lines':'Returning from the ferry’s shore lines'):'Standing by at the ferry pier';
  }
 }
 /**
  * Kai between calls: on the pier through the ship's day; at KITANO_HAND_DAY.home he walks to his gate and goes in
  * (the body is hidden there, as every resident's is at a door), and comes out again before the crew sign on. A late
  * call finds him at home and takes him out (take). A route the island cannot give him leaves him on the pier.
  */
 function rest(b,minutes,dt){
  const u=b.g.userData,out=kitanoHandOut(minutes);
  // Lunch between calls on one of the pier's shared spots (quay-breaks.js, world/quay-spots.js): out to it, facing the
  // bitt, and back to his post when the break is over. A call for lines takes him from it like from anywhere.
  const lunch=out?quayClaim(b.name,minutes):null;
  if(lunch&&b.rest===null){const s=lunch.spot;b.rest='to lunch';b.lunchYaw=lunch.yaw;walker.plan(b,[s.x,airportSurface(s.x,s.z,R)?.y??b.home[1],s.z],{margin:MARGIN.airport});}
  if(b.rest==='at lunch'&&!lunch){b.rest='back from lunch';u.socialPose='Idle';walker.plan(b,b.home,{margin:MARGIN.airport});}
  if(b.rest==='to lunch'||b.rest==='back from lunch'){
   const arrived=walker.step(b,dt);u.walking=!arrived;u.socialPose='Idle';
   if(b.blocked){b.blocked=null;b.rest=null;u.walking=false;u.activity='Standing by at the ferry pier';return;}
   if(arrived)b.rest=b.rest==='to lunch'?'at lunch':null;
   if(b.rest)u.activity=b.rest==='to lunch'?'Walking out along the pier with his lunch':'Back to his post on the pier';
   if(b.rest)return;
  }
  if(b.rest==='at lunch'){
   const diff=Math.atan2(Math.sin(b.lunchYaw-b.g.rotation.y),Math.cos(b.lunchYaw-b.g.rotation.y));
   b.g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,diff));u.walking=false;u.socialPose='Idle';
   u.activity=lunch.activity+', on '+lunch.spot.name;return;
  }
  if(!out&&b.rest===null){b.rest='going home';const [x,z]=KITANO_HOME;walker.plan(b,[x,airportSurface(x,z,R)?.y??b.home[1],z],{margin:MARGIN.airport});}
  else if(out&&b.rest==='home'){b.rest='to the pier';b.g.visible=true;delete u.indoors;walker.plan(b,b.home,{margin:MARGIN.airport});}
  if(b.rest==='going home'||b.rest==='to the pier'){
   const arrived=walker.step(b,dt);u.walking=!arrived;u.socialPose='Idle';
   if(b.blocked){b.rest=b.rest==='to the pier'?null:'stays';b.blocked=null;u.walking=false;u.activity='Standing by at the ferry pier';return;}
   if(arrived&&b.rest==='going home'){b.rest='home';b.g.visible=false;u.indoors='home';u.walking=false;}
   else if(arrived){b.rest=null;u.walking=false;}
  }
  u.activity=b.rest==='going home'?'Walking home to the Shiroma house':b.rest==='home'?'At home in the Shiroma house':b.rest==='to the pier'?'Walking down to the pier for the first boat':'Standing by at the ferry pier';
  if(b.rest==='stays'&&out)b.rest=null;
 }
 const taskAtStation=id=>[...bodies.values()].some(b=>b.task?.id===id&&b.taken&&walker.arrived(b));
 const taskReady=id=>[...bodies.values()].some(b=>b.task?.id===id&&taskAtStation(id)&&b.elapsed>=(b.task.seconds||0));
 return {update,taskAtStation,taskReady,bodies,
  snapshot:()=>[...bodies.values()].map(b=>({name:b.name,post:'shore',where:'shore-'+b.port,pos:worldPoint(b.g),space:'world',task:b.task?.id??null,state:b.state,action:b.task?.action??null,progress:b.task?Math.min(1,b.elapsed/Math.max(.01,b.task.seconds||0)):0,blocked:b.blocked,rest:b.rest,existingResident:b.port==='town'}))};
}
