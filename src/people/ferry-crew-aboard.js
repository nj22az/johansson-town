import * as THREE from '../../vendor/three.module.js';
import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_DAY} from '../world/ferry-ship.js';
import {FERRY_ENGINE_ROOM} from '../world/ferry-interior.js';
import {FERRY_CASINGS} from '../world/ferry-model.js';
import {FERRY_CREW,FERRY_WATCH,FERRY_RELIEF,FERRY_PEOPLE,crewFor,onWatch} from './ferry-crew.js';
import {crewRoute,stepCrewRoute,crewBlocked,crewObstacleAt} from './ferry-crew-walk.js';
import {createFerryShoreCrew} from './ferry-shore-crew.js';
import {createMasterCommute} from './master-commute.js';
import {wearEarDefenders} from '../avatars/ear-defenders.js';
export const BELOW_DECK_PLACES=Object.freeze(['engine-room','steering-gear']);
const HALF=FERRY_SHIP.length/2,Z=zy=>zy-HALF,Y=yk=>yk-FERRY_SHIP.draft;
const CAR=Y(FERRY_HEIGHTS.carDeck),PASS=Y(FERRY_HEIGHTS.passengerDeck),BRIDGE=Y(FERRY_HEIGHTS.bridgeDeck),FP=FERRY_ENGINE_ROOM.floor;
/** Work positions are actual walkable deck coordinates, in the ship's frame. */
export const CREW_POSTS=Object.freeze({
 wheelhouse:{pos:[.45,BRIDGE,Z(20.7)],yaw:Math.PI},
 'port-wing':{pos:[3.55,BRIDGE,Z(20.6)],yaw:Math.PI},
 'engine-room':{pos:[-3.1,FP,Z(10.4)],yaw:Math.PI/2},
 'steering-gear':{pos:[0,FP,Z(9.6)],yaw:0},
 stern:{pos:[1.2,CAR,Z(1.6)],yaw:0},
 bow:{pos:[3.55,FERRY_CASINGS.bowHouses.top+.06,16.35],yaw:Math.PI/2},
 // The starboard bow's mooring station, worked by the bosun where she lies bow-on (Kitano-jima: ferry.js KITANO_LINES).
 'starboard-bow':{pos:[-3.55,FERRY_CASINGS.bowHouses.top+.06,16.35],yaw:-Math.PI/2},
 gangway:{pos:[3.4,CAR,Z(12.6)],yaw:Math.PI},
 'car-deck':{pos:[0,CAR,Z(18.5)],yaw:Math.PI},
 ramp:{pos:[2.75,CAR,11.35],yaw:Math.PI},
 saloon:{pos:[0,PASS,Z(17.0)],yaw:Math.PI},
 purser:{pos:[-1.6,PASS,Z(8.6)],yaw:-Math.PI/2},
 kiosk:{pos:[1.4,PASS,Z(8.6)],yaw:Math.PI/2},
 mess:{pos:[1.6,BRIDGE,Z(14.55)],yaw:Math.PI},
 galley:{pos:[-1.6,BRIDGE,Z(15.2)],yaw:Math.PI/2},
 cabin:{pos:[1.4,BRIDGE,Z(9.55)],yaw:Math.PI/2},
});
const POST_SPOTS=Object.freeze({
 oiler:Object.freeze({'engine-room':{pos:[0,FP,Z(12.2)],yaw:-Math.PI/2}}),
 cook:Object.freeze({mess:CREW_POSTS.galley}),
});
const PHASES=new Set(Object.keys(FERRY_WATCH));
export function watchPhase(run,minutes){
 const op=run.operation;
 if(op&&!['alongside','held'].includes(op.stage))return ['passage','departing'].includes(op.stage)?'crossing':op.stage==='arriving'||op.stage==='making-fast'?'arriving':'waiting';
 const m=((minutes%1440)+1440)%1440;
 if(m<FERRY_DAY.generators||m>=FERRY_DAY.shorePower)return 'night';
 const p=run.phase;return PHASES.has(p)?p:(p==='away'?'crossing':'waiting');
}
function stationFor(post,where){return POST_SPOTS[post]?.[where]||CREW_POSTS[where];}
export function crewPlaces(phase,minutes=0){
 const watch=FERRY_WATCH[phase]||{};
 return FERRY_CREW.map(c=>{const w=watch[c.post];if(!w)return null;const at=stationFor(c.post,w[0]);if(!at)return null;return {post:c.post,title:c.title,name:crewFor(c.post,minutes),where:w[0],doing:w[1],pos:at.pos,yaw:at.yaw};}).filter(Boolean);
}

/** One body per signed-on post, moving through the real ship before it can report a task complete. */
/**
 * Who keeps the chief engineer's watch (the owner, 21 October 2026, briefs/ferry-timetable.md): Johansson, the player,
 * only while he is aboard in the crew's working hours; otherwise Mac, the relief engineer. The ship's day never waits
 * for either: with Johansson on watch his tasks are done on the watch's own time, whatever the player is doing.
 */
export const chiefWatchHolder=({minutes,playerAboard,playerIsChief=true})=>playerIsChief&&playerAboard&&onWatch(minutes)?'player':'relief';
export function createFerryCrewAboard({run,characters,register,onAction,townBody:townBodyOf=()=>null,portShed,shoreParent,shoreColliders=[],playerIdentity=()=>null,playerAboard=()=>false}){
 // The master's town body is the shed's (world/port-shed.js), which the street does not list.
 const townBody=name=>townBodyOf(name)||(portShed?.fujita?.userData.name===name?portShed.fujita:null);
 const ferry=run.ferry,bodies=new Map(),records=new Map(),shore=createFerryShoreCrew({shoreParent,shoreColliders,characters,register,onAction,townBody});
 const commute=portShed?.fujita&&FERRY_CREW.find(c=>c.post==='master').name===portShed.fujita.userData.name?createMasterCommute({shed:portShed,run,shoreColliders}):null;
 let phase=null,day=-1,operationId=null,chiefHolder=null;
 const profiles=Object.fromEntries(FERRY_CREW.map(c=>[c.post,c]));
 function body(c){
  if(bodies.has(c.name))return bodies.get(c.name);
  const g=new THREE.Group();g.name='Crew: '+c.name;g.userData.name=c.name;g.userData.ferryCrew=true;g.userData.hit=null;ferry.add(g);
  const actor=characters?.attach(g,c.name)||null;
  const a=new THREE.Object3D();a.name='Crew prompt: '+c.name;a.position.set(0,1.2,0);a.userData.sameLevel=true;g.add(a);
  const b={g,prompt:a,name:c.name,post:c.post,title:c.title,text:'',actor,earDefenders:false,route:[],routeIndex:0,goal:null,where:c.where,taskId:null,state:'at station',blocked:null,initialised:false};
  bodies.set(c.name,b);register?.(a,'Talk to '+c.name,()=>onAction?.('inspect',c.name,b.text));return b;
 }
 const obstacles=()=>run.vehicleObstacles?.()||[];
 function destination(b,at,key){
  if(!at){b.blocked='Unknown crew station';b.state='blocked';return;}
  const occupied=obstacles(),stamp=occupied.map(c=>[c.id,c.x,c.z,c.w,c.d].join(',')).join('|');
  if(b.goalKey===key&&(!b.blocked||b.obstacleStamp===stamp))return;
  if(b.g.userData.climbing){b.deferred={at,key};return;}
  b.goalKey=key;b.goal=[...at.pos];b.yaw=at.yaw;b.blocked=null;b.routeIndex=0;
  b.obstacleStamp=stamp;
  const plan=crewRoute(b.g.position.toArray(),b.goal,{obstacles:occupied});
  b.route=plan.path||[];b.blocked=plan.ok?null:plan.reason;b.state=plan.ok?'walking':'blocked';
 }
 function place(minutes){
  const p=watchPhase(run,minutes),d=Math.floor(minutes/1440);
  phase=p;day=d;const aboard=new Set(),op=run.operation,active=op?.tasks||[];
  if(op?.id!==operationId){operationId=op?.id??null;records.clear();}
  const holder=chiefWatchHolder({minutes,playerAboard:!!playerAboard(),playerIsChief:crewFor('chief',minutes)===playerIdentity()});
  // The watch changing hands drops the chief's open tasks, so the new holder takes them up from his own station.
  if(holder!==chiefHolder){chiefHolder=holder;for(const [id,r] of records)if(r.task.post==='chief')records.delete(id);}
  for(const watch of crewPlaces(p,minutes)){
   // The player is the chief engineer. His relief takes the working watch rather than spawning a second Johansson.
   if(watch.post==='chief'&&watch.name===playerIdentity()&&p==='night')continue;
   // The bosun's relief has a family at 3 Kitahama and sleeps there; only the signed-on bosun lives aboard on her week on.
   if(watch.post==='bosun'&&p==='night'&&watch.name===FERRY_RELIEF.bosun.name)continue;
   // Johansson on watch: his tasks are kept by the watch itself (no second body); Mac rests in his duty berth.
   if(watch.post==='chief'&&holder==='player'){
    for(const t of active.filter(t=>t.post==='chief'))if(!records.has(t.id))records.set(t.id,{task:t,b:null,elapsed:0,done:false,player:true});
    const rest={...watch,name:FERRY_RELIEF.chief.name,title:'Relief engineer · off watch',where:'cabin',doing:'Off watch in his duty berth while the chief is aboard',...CREW_POSTS.cabin};
    const b=body(rest);aboard.add(rest.name);b.g.visible=true;b.post='relief';b.title=rest.title;b.taskId=null;b.where='cabin';b.doing=rest.doing;
    if(!b.initialised){b.g.position.set(...rest.pos);b.g.rotation.y=rest.yaw;b.initialised=true;b.actor?.last?.copy(b.g.position);}
    destination(b,CREW_POSTS.cabin,'off-watch:'+d);b.text=rest.name+', relief engineer: '+rest.doing.toLowerCase()+'. '+FERRY_RELIEF.chief.why;b.g.userData.activity=rest.doing;
    continue;
   }
   const c=watch.post==='chief'&&watch.name===playerIdentity()?{...watch,name:FERRY_RELIEF.chief.name,title:'Relief engineer · chief’s working watch'}:watch;
   const b=body(c);aboard.add(c.name);b.g.visible=true;b.post=c.post;b.title=c.title;
   if(!b.initialised){
    b.g.position.set(...c.pos);b.g.rotation.y=c.yaw;b.initialised=true;b.actor?.last?.copy(b.g.position);
    b.earDefenders=b.g.position.y<CAR-.35;if(b.actor?.avatar)wearEarDefenders(b.actor.avatar,b.earDefenders);
   }
   const task=active.find(t=>t.post===c.post),where=task?.station||c.where;
   const target=task?.target&&[task.target.x,task.target.y,task.target.z].every(Number.isFinite)?{pos:[task.target.x,task.target.y,task.target.z],yaw:stationFor(c.post,where)?.yaw??c.yaw}:stationFor(c.post,where);
   b.where=where;b.taskId=task?.id??null;b.doing=task?.action||c.doing;
   destination(b,target,(task?.id||'watch:'+p+':'+d+':'+c.post));
   if(task&&!records.has(task.id))records.set(task.id,{task,b,elapsed:0,done:false});
   b.text=c.name+', '+c.title.toLowerCase()+' of the Minato Maru: '+b.doing+'. '+(c.name===FERRY_RELIEF.chief.name?FERRY_RELIEF.chief.why:profiles[c.post].why);
   b.g.userData.activity=b.doing;
  }
  for(const [name,b] of bodies)if(!aboard.has(name)){b.g.visible=false;b.g.userData.climbing=false;}
  // Everyone the ship signs on keeps a single visible body: their town body (a street resident, a neighbour, the master
  // in his shed) is hidden while their ferry watch owns them. Those who live aboard have no town body.
  for(const name of FERRY_PEOPLE){
   const town=townBody(name);if(!town)continue;town.userData.aboardFerry=aboard.has(name);if(aboard.has(name))town.visible=false;
  }
 }
 const atStation=b=>b.g.visible&&!b.blocked&&b.goal&&b.g.position.distanceTo(new THREE.Vector3(...b.goal))<.075&&!crewBlocked(b.g.position.toArray())&&!crewObstacleAt(b.g.position.toArray(),obstacles())&&b.routeIndex>=b.route.length;
 function taskAtStation(id){const r=records.get(id);if(r?.player)return true;return r? r.b.taskId===id&&r.b.goalKey===id&&atStation(r.b):shore.taskAtStation(id);}
 function taskReady(id){const r=records.get(id);if(r?.player)return r.done;return r? r.done&&taskAtStation(id):shore.taskReady(id);}
 const controller={
  place,bodies,taskAtStation,taskReady,shore,commute,
  update(dt,minutes){
   place(minutes);const seconds=Math.min(Math.max(dt,0),.5),op=run.operation;
   // A line handoff starts only after both people have reached their stations.
   // Arrival stays independent so the operation can acknowledge each person.
   const lineWorkReady=!['letting-go','making-fast'].includes(op?.stage)||(op?.tasks||[]).every(t=>t.acknowledged);
   for(const b of bodies.values()){
    if(!b.g.visible)continue;
    if(!b.blocked){
     const movement=stepCrewRoute(b,seconds,{obstacles:obstacles()});
     b.state=movement.arrived?'at station':movement.climbing?'climbing':'walking';
     b.g.userData.walking=!movement.arrived;
     if(movement.arrived){b.g.rotation.y=b.yaw??b.g.rotation.y;b.g.userData.climbing=false;}
     if(b.deferred&&!b.g.userData.climbing){const next=b.deferred;b.deferred=null;destination(b,next.at,next.key);}
    }else{b.state='blocked';b.g.userData.walking=false;b.g.userData.climbing=false;}
    const record=b.taskId&&records.get(b.taskId),arrived=record?taskAtStation(b.taskId):atStation(b);
    if(record&&arrived&&lineWorkReady){
     record.elapsed=Math.min(record.task.seconds||0,record.elapsed+seconds);
     record.done=record.elapsed>=(record.task.seconds||0);
     b.state=record.done?'reported complete':'working';
     b.g.userData.socialPose=record.done?'Idle':'Interact';
    }else{
     b.g.userData.socialPose='Idle';
     if(record&&arrived)b.state='waiting for shore hand';
    }
    const below=b.g.position.y<CAR-.35;
    if(below!==b.earDefenders){b.earDefenders=below;if(b.actor?.avatar)wearEarDefenders(b.actor.avatar,below);}
    b.g.userData.activity=b.blocked?b.doing+' — waiting for a clear walking route':b.state==='waiting for shore hand'?'At the '+b.where+' station; waiting for the shore line hand':b.state==='walking'||b.state==='climbing'?'Going to '+b.where+' to '+b.doing.toLowerCase():b.doing;
   }
   for(const r of records.values())if(r.player&&!r.done){r.elapsed=Math.min(r.task.seconds||0,r.elapsed+seconds);r.done=r.elapsed>=(r.task.seconds||0);}
   shore.update(seconds,(op?.tasks||[]).filter(t=>t.post==='shore'),lineWorkReady,minutes);
   commute?.update(seconds,minutes);
   for(const name of FERRY_PEOPLE){const town=townBody(name);if(town?.userData.aboardFerry)town.visible=false;}
  },
  get phase(){return phase;},
  /** Who has the chief's watch now: 'player' (Johansson aboard in working hours) or 'relief' (Mac). */
  get chiefWatch(){return chiefHolder;},
  snapshot(){
   const ship=[...bodies.values()].filter(b=>b.g.visible).map(b=>{
    const r=b.taskId&&records.get(b.taskId);
    return {name:b.name,post:b.post,title:b.title,pos:b.g.position.toArray(),space:'ship',where:b.where,earDefenders:b.earDefenders,
     task:b.taskId,action:b.doing,state:b.state,atStation:atStation(b),progress:r?Math.min(1,r.elapsed/Math.max(.01,r.task.seconds||0)):0,
     blocked:b.blocked,remainingWaypoints:Math.max(0,b.route.length-b.routeIndex)};
   });
   return [...ship,...shore.snapshot()];
  },
 };
 run.bindCrewController?.(controller);return controller;
}
