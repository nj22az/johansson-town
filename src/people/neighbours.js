import {CAST,castMember} from './cast.js';
import {activeResidentHome} from './home-directory.js';
import {canonicalDay,canonicalStreetRoute} from './canonical-day.js';
import {sitOnStand,standUpFromStand,seatedOn} from './stand-seat.js';
import {groundHeight} from '../world/layout.js';
import {createNavigation} from './navmesh.js';
import * as THREE from '../../vendor/three.module.js';
import {inGateball,COURT_TERRACE} from '../world/park-layout.js';
import {GROUND_LAYER} from '../world/ground-layers.js';
import {HARBOUR_PARK_STUDY} from '../world/harbour-park-plan.js';
import {kitahamaHomeFor} from '../world/kitahama-layout.js';
const VY_HOME=Object.freeze(kitahamaHomeFor('Vy').door),RIKU_HOME=Object.freeze(kitahamaHomeFor('Riku').door);
/** No occupied household currently uses an indoor stair route. The vacant Nakamura building is retained. */
export const STAIR_HOMES=Object.freeze({});

/**
 * The people who live and work in the new streets.
 *
 * They are not residents in the full sense -- no schedule engine, no homes to walk into,
 * no errands at Sakura -- because what a street needs from them is simpler: to be there
 * at the hours they would be, doing the thing they do, and to turn and talk when you
 * stop. So each has a place (or a round they walk), the hours they keep, a pose, and a
 * handful of things to say. The `look` is the drawing they are made from (avatars/cast.js); the name is their own.
 * Nobody the roster retired (roster.js RETIRED) is here: NEIGHBOURS is built from the cast, so a retired identity has
 * no body.
 *
 * Coordinates are world metres; `face` is the direction they look, as [dx, dz].
 */
const H=(h,m=0)=>h*60+m;

const ALL_NEIGHBOURS=Object.freeze([
 {name:'Riku',look:'Riku',height:1.32,role:'at home at 3 Kitahama',at:RIKU_HOME,home:RIKU_HOME,face:[0,1],hours:[[H(7),H(19)]],
  routine:[{from:0,at:RIKU_HOME,role:'at home at 3 Kitahama',home:true},{from:H(7,40),at:[RIKU_HOME[0],RIKU_HOME[1]-.8],role:'leaving for school'},{from:H(8,15),at:RIKU_HOME,role:'at school',away:true},{from:H(15,30),at:[12.5,-26.4],role:'playing in Harbour Park'},{from:H(17),at:[18,-9],role:'playing football on the park lawn'},{from:H(18,30),at:RIKU_HOME,role:'home with Kōji and Nhung at 3 Kitahama',home:true}],
  lines:['I live at 3 Kitahama with Mum and Dad. Mum is Nhung, the island doctor; Dad sorts the fish. Vy is my cousin.',
   'Dad sorts the catch on the quay. I can watch the boats, but I am not allowed out on one until I can swim to the buoy.',
   'The open lawn beside Harbour Park is our football place. We keep the ball away from the pond and the bathhouse windows.']},

 {name:'Grandmother Higa',look:'Fumiko',height:1.46,role:'on her verandah',at:[-29.8,-20.7],y:.47,face:[0,-1],pose:'Interact',hours:[[H(7),H(18,30)]],
  lines:[
   "Hey, welcome.\nSit a moment. You are the one who talks to the girl at Sakura every day. She is a good girl. She counts my change twice so I do not have to.",
   'These are shima-rakkyō beans — no, you are right, rakkyō is an onion. I have been saying it wrong for seventy years and nobody corrects a grandmother.',
   'The bus? Eight minutes to, eight minutes past. I can hear it in the tunnel before it comes out. My husband drove that bus for thirty years.',
   'When the typhoon comes you close the amado, fill the bath with water and wait. The house has been here since before the war. It knows what to do.']},
 {name:'Kōji',look:'Daichi',height:1.7,role:'sorting the catch',at:[23.4,-41.7],face:[0,-1],pose:'Interact',hours:[[H(5),H(12)]],
  lines:[
   'Auction is done, bro. What is left goes to Mrs Sato or to the freezer. You want a tuna head? Free. Great for soup. Nobody ever takes the tuna head.',
   'The Minato Maru came in at four with a full hold and the skipper is asleep on the wheel. That is the life.']},
 // Vy lives with Thao and Chin at 1 Kitahama. School is off-scene until it has a current public entrance.
 {name:'Vy',look:'Vy',height:1.56,role:'at home with Thao and Chin',at:VY_HOME,home:VY_HOME,face:[0,-1],hours:[[H(7),H(20)]],
  routine:[{from:0,at:VY_HOME,face:[0,-1],role:'at home at 1 Kitahama',home:true},{from:H(7,40),at:[VY_HOME[0]+1.0,VY_HOME[1]-.8],face:[0,-1],role:'leaving for school'},{from:H(8,15),at:VY_HOME,face:[0,-1],role:'at school',away:true},{from:H(15,30),at:HARBOUR_PARK_STUDY[0],face:[1,0],role:'walking through Harbour Park after school'},{from:H(16,20),at:HARBOUR_PARK_STUDY[0],face:[-1,0],role:'doing her homework in Harbour Park'},{from:H(18,30),at:VY_HOME,face:[0,-1],role:'home with Thao and Chin at 1 Kitahama',home:true}],
  lines:[
   'A walk before homework. It is a rule. I made the rule, but it is still a rule.',
   'My parents are Thao and Chin. Our home is 1 Kitahama. Aunt Thuan lives on Kitano-jima and comes over on the boat every day.',
   'Blue Coral is closed now. I walk to Harbour Park after school and find a place for my homework.',
   'The pond is right beside the bathhouse now. I can finish my homework while everybody goes for a soak.']},
]);
/** Who is about today. Everyone here is in the cast (cast.js); the plan's batch 2 moves them onto its schedules. */
const walking=new Set(['Johansson','Thuan','Thao','Chin','Nhung','Tetsuo','Mrs Sato','Officer Mori','Harbour master','Mr Fujita',
 // The supporting crew's bodies are the ship's (ferry-crew-aboard.js) and the Kitano pier's (ferry-shore-crew.js).
 ...CAST.filter(p=>p.supporting).map(p=>p.name)]);
// Named shore residents and off-watch crew all use their canonical household and day.
export const NEIGHBOURS=Object.freeze(CAST.filter(p=>!walking.has(p.name)).map(p=>{
 const old=ALL_NEIGHBOURS.find(n=>n.name===p.name),home=activeResidentHome(p.name)?.target;
 const at=home?[home.x,home.z]:old?.at;
 return {...old,name:p.name,look:old?.look||p.name,height:old?.height||(p.age<16?1.4:p.sex==='f'?1.58:1.7),
  at:old?.at||at,home:at,face:old?.face||[0,1],role:p.purpose,hours:[[0,1440]],canonical:true,stair:STAIR_HOMES[p.home]||null,
  lines:old?.lines||[p.purpose,'My home is '+home?.address+'.'],
  profile:{name:p.name,age:p.age,home:at,start:420,retire:1260,canonicalDay:true}};
}));

/** Everything they can say, by name, for the conversation box. */
export const NEIGHBOUR_TALK=Object.freeze(Object.fromEntries(NEIGHBOURS.map(n=>[n.name,n])));

export const neighbourAwake=(spec,minutes)=>{
 const m=((minutes%1440)+1440)%1440;
 return spec.hours.some(([from,to])=>m>=from&&m<to);
};

/** Where along its route a walker is after walking `distance` metres (it loops). */
export function routePoint(route,distance){
 const legs=[];let total=0;
 for(let i=0;i<route.length;i++){const a=route[i],b=route[(i+1)%route.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);legs.push([a,b,len]);total+=len;}
 let d=((distance%total)+total)%total;
 for(const [a,b,len] of legs){if(d<=len){const t=len?d/len:0;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:b[0]-a[0],dz:b[1]-a[1],total};}d-=len;}
 const [a]=legs[0];return {x:a[0],z:a[1],dx:0,dz:1,total};
}

/**
 * A stand point (stand-points.js) or a claimed quay spot (quay-breaks.js), once they are on it: turn to its facing at a
 * person's pace (never a snap), then take its pose with its tool in hand; on the way to the next, the pose is put down
 * and their own (spec.pose) comes back.
 */
function standAtPoint(g,spec,stand,onIt,dt){
 const u=g.userData;
 if(stand&&(onIt||seatedOn(g,stand))){
  const diff=Math.atan2(Math.sin(stand.yaw-g.rotation.y),Math.cos(stand.yaw-g.rotation.y));
  g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,diff));
  if(Math.abs(diff)<.05){u.socialPose=stand.pose||null;if(stand.tool)u.tool=stand.tool;else delete u.tool;u.standPose=true;sitOnStand(g,stand);}
  return;
 }
 standUpFromStand(g);
 if(u.standPose){u.socialPose=spec.pose||null;delete u.tool;delete u.standPose;}
}
/** The route point nearest a body, by straight 3D distance. */
function nearestOnRoute(route,at){
 let i=0,d=Infinity;
 route.forEach((r,k)=>{const e=Math.hypot(r[0]-at.x,r[1]-at.y,r[2]-at.z);if(e<d){d=e;i=k;}});
 return {i,d};
}
/** Within reach of the stair route's ground end: behind the counter, at the doorway or on the stair. */
const ON_ROUTE=1;
/** The ground under a neighbour: the gateball court stands on its terrace, everywhere else is level. */
const groundAt=(x,z)=>inGateball(x,z)?COURT_TERRACE.height+GROUND_LAYER.apron:groundHeight(x,z);
const faceAlong=(g,dx,dz)=>{if(dx||dz)g.rotation.y=Math.atan2(dx,dz)+Math.PI;};

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @param {(object:THREE.Object3D,label:string,fn:Function)=>void} options.register
 * @param {(kind:string,name:string)=>void} options.onAction
 * @param {{attach:Function}} [options.characters]
 */
export function createNeighbours({parent,register,onAction,characters,blocked=()=>false,getRain=()=>false,getState=()=>({}),attends=()=>true,getKissaClosing=()=>false}={}){
 const people=NEIGHBOURS.map((spec,i)=>{
  const g=new THREE.Group();g.name=spec.name;g.userData.name=spec.name;g.userData.neighbour=true;
  g.userData.activity=spec.role;g.userData.socialPose=spec.pose||null;
  const start=spec.walk?routePoint(spec.route,i*7):{x:spec.at[0],z:spec.at[1],dx:spec.face[0],dz:spec.face[1]};
  g.position.set(start.x,spec.y??groundAt(start.x,start.z),start.z);faceAlong(g,start.dx,start.dz);
  parent.add(g);
  characters?.attach(g,spec.look,spec.height);
  register?.(g,'Talk to '+spec.name,()=>onAction?.('neighbour',spec.name));
  return {g,spec,profile:spec.profile,travelled:i*7};
 });
 const navigation=createNavigation(blocked,{step:.5});let talking=null,talkUntil=0;
 /**
  * The canonical day of a resident whose home is up an indoor stair (STAIR_HOMES). The day says where and when; this
  * says how: home is reached through the family doorway and up the measured route, and rested in upstairs (hidden, as
  * a home is), never at the doorway at the foot of the stair; the counter is reached back down the same route; anywhere
  * else is down to the doorway and then the street. Unseen and out of reach on the web, the phase starts where it ends.
  */
 function stairDay(p,phase,key,dt){
  const {g,spec}=p,{route,door}=spec.stair,top=route.at(-1),u=g.userData,home=phase.place==='home';
  const [tx,tz]=phase.target,counter=!home&&Math.hypot(tx-route[0][0],tz-route[0][2])<ON_ROUTE;
  const goal=home?top:counter?[tx,route[0][1],tz]:null;
  if(!p.initialised){
   const saved=getState().residentLocations?.[spec.name]?.position;
   const valid=Array.isArray(saved)&&saved.length===2&&saved.every(Number.isFinite)&&Math.abs(saved[0])<300&&Math.abs(saved[1])<300;
   if(goal)g.position.set(...goal);
   else {const at=valid?saved:phase.target;g.position.set(at[0],groundAt(...at),at[1]);}
   p.initialised=true;p.phaseKey=key;p.steps=[];p.path=[];p.thenClimb=p.thenStreet=false;
  }
  if(p.phaseKey!==key){
   p.phaseKey=key;p.steps=[];p.path=[];p.thenClimb=p.thenStreet=false;
   const near=nearestOnRoute(route,g.position),indoors=near.d<ON_ROUTE,onStair=indoors&&near.i>0;
   if(!attends(g)&&(goal||!blocked(tx,tz,.3))){if(goal)g.position.set(...goal);else g.position.set(tx,groundAt(tx,tz),tz);}
   else if(home){
    // From the counter, the doorway or partway up: on along the route. From the street: to the doorway, then up.
    if(indoors)p.steps=route.slice(near.d<.025?near.i+1:near.i).map(a=>[...a]);
    else {p.path=canonicalStreetRoute(navigation,spec.name,g.position,[route[door][0],route[door][2]]);p.thenClimb=true;}
   }else if(onStair){
    // Down the route to the counter, or to the doorway and out.
    p.steps=route.slice(counter?0:door,near.i+1).reverse().map(a=>[...a]);
    if(counter)p.steps.push([...goal]);else p.thenStreet=true;
   }else if(counter&&indoors)p.steps=[[...goal]];
   else p.path=canonicalStreetRoute(navigation,spec.name,g.position,phase.target);
  }
  u.activity=phase.activity;u.place=phase.place;
  const free=!u.playerConversation&&!u.chatHold&&!u.aboardFerry;
  if(free&&p.steps.length){
   const to=p.steps[0],dx=to[0]-g.position.x,dy=to[1]-g.position.y,dz=to[2]-g.position.z,len=Math.hypot(dx,dy,dz),step=Math.min(len,dt*.75);
   if(len<.025){p.steps.shift();if(!p.steps.length&&p.thenStreet){p.thenStreet=false;p.path=canonicalStreetRoute(navigation,spec.name,g.position,phase.target);}}
   else {g.position.x+=dx/len*step;g.position.y+=dy/len*step;g.position.z+=dz/len*step;faceAlong(g,dx,dz);}
  }else if(free&&p.path.length){
   const to=p.path[0],dx=to[0]-g.position.x,dz=to[1]-g.position.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*(spec.profile.age>65?.7:1));
   if(len<.06){p.path.shift();if(!p.path.length&&p.thenClimb){p.thenClimb=false;if(Math.hypot(g.position.x-route[door][0],g.position.z-route[door][2])<.35)p.steps=route.slice(door).map(a=>[...a]);}}
   // Over the shop's raised floor (nakamura-plan.js `floor`) the feet stay on it, not 8 cm into it.
   else {const x=g.position.x+dx/len*step,z=g.position.z+dz/len*step,shop=Math.hypot(x-route[0][0],z-route[0][2])<ON_ROUTE;if(!blocked(x,z,.3)){g.position.set(x,shop?route[0][1]:groundAt(x,z),z);faceAlong(g,dx,dz);}}
  }
  const moving=!!(p.steps.length||p.path.length),upstairs=home&&!moving&&Math.hypot(g.position.x-top[0],g.position.y-top[1],g.position.z-top[2])<.05;
  const arrived=!moving&&(goal?Math.hypot(g.position.x-goal[0],g.position.z-goal[2])<.35:Math.hypot(g.position.x-tx,g.position.z-tz)<.35);
  if(upstairs)u.indoors='home';else delete u.indoors;
  u.sleeping=upstairs&&phase.rest==='sleep';
  u.walking=moving&&free;
  if(!u.chatHold)standAtPoint(g,spec,phase.stand,arrived&&!u.playerConversation,dt);
  if(arrived&&counter&&free)faceAlong(g,...spec.face);
  g.visible=!u.aboardFerry&&!upstairs&&!(arrived&&phase.school);
 }
 return {
  people,
  snapshot(){return Object.fromEntries(people.map(({g,spec})=>{
   const home=g.userData.indoors==='home'||g.userData.inHome,h=home&&activeResidentHome(spec.name)?.target;
   return [spec.name,{position:h?[h.x,h.z]:[g.position.x,g.position.z],indoors:home?'home':null,place:g.userData.place}];
  }));},
  entities:people.map(p=>p.g),
  /**
   * New walls (Kitano-jima built on demand) or a way in opened or shut (Kissa Higa's doors on its clock): forget which
   * ground was clear, and plan each walk again from where they are. A sitter has no journey to restart: its target is
   * the standing point, not the seat. Restarting it made an unseen sitter jump off the seat with the seated flag still
   * set. A climb up an indoor stair is also left to finish.
   */
  replan({at=null,radius=12}={}){navigation.clearCache?.();for(const p of people){
   if(p.g.userData.standSeat)continue;
   const near=point=>point&&Math.hypot(point[0]-at[0],point[1]-at[1])<=radius;
   if(at&&!near([p.g.position.x,p.g.position.z])&&!near(p.target)&&!p.path?.some(near))continue;
   if(p.routine)p.path=navigation.path(p.g.position,{x:p.routine.at[0],z:p.routine.at[1]});else if(!p.spec?.stair)p.phaseKey=null;
  }},
  /** Turn to whoever is talking to them, and stop walking while they do. */
  talkTo(name,to){
   const p=people.find(p=>p.spec.name===name);if(!p)return null;
   talking=p;talkUntil=performance.now()+2500;
   if(to)faceAlong(p.g,to.x-p.g.position.x,to.z-p.g.position.z);
   return p.g;
  },
  /**
   * @param {number} dt seconds
   * @param {number} minutes town clock
   * @param {{x:number,z:number}} [viewer] where the player is; the far ones rest
   */
  update(dt,minutes,viewer){
   const now=performance.now();
   for(const p of people){
    const {g,spec}=p;
    if(g.userData.inHome)continue;
    if(spec.canonical){
     const phase=canonicalDay(spec.name,minutes,getRain(),{kissaClosingHeld:getKissaClosing()});
     if(!phase?.target){g.visible=false;continue;}
     if(spec.walk&&phase.place==='main-street'){
      let stop=p.roundIndex||0;
      if(p.initialised&&!p.path?.length&&Math.hypot(g.position.x-spec.route[stop][0],g.position.z-spec.route[stop][1])<.12)stop=(stop+1)%spec.route.length;
      p.roundIndex=stop;phase.target=[...spec.route[stop]];
     }else p.roundIndex=0;
     p.target=phase.target;
     const key=phase.place+':'+phase.target.join(',');
     if(spec.stair){stairDay(p,phase,key,dt);continue;}
     if(!p.initialised){
      const saved=getState().residentLocations?.[spec.name],at=saved?.position;
      // A remembered spot nobody can walk out of (the first save can hold a neighbour's old verandah point, inside the
      // house's solid: Grandmother Higa stood there all day, 21 October 2026) is not a start: the day's own target is.
      const valid=Array.isArray(at)&&at.length===2&&at.every(Number.isFinite)&&Math.abs(at[0])<300&&Math.abs(at[1])<300&&!blocked(at[0],at[1],.3);
      const start=valid?at:phase.target;g.position.set(start[0],groundAt(...start),start[1]);p.initialised=true;
     }
     if(p.phaseKey!==key){
      p.phaseKey=key;
      // Unseen and out of reach on the web (people/attention.js), the new phase starts where it ends: no route searched.
      const [tx,tz]=phase.target;
      if(!attends(g)&&!blocked(tx,tz,.3)){g.position.set(tx,groundAt(tx,tz),tz);p.path=[];}
      else p.path=canonicalStreetRoute(navigation,spec.name,g.position,phase.target);
     }
     g.userData.activity=phase.activity;g.userData.place=phase.place;
     if(!g.userData.playerConversation&&!g.userData.chatHold&&!g.userData.aboardFerry&&p.path?.length){
      const to=p.path[0],dx=to[0]-g.position.x,dz=to[1]-g.position.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*(spec.profile.age>65?.7:1));
      if(len<.06)p.path.shift();else {const x=g.position.x+dx/len*step,z=g.position.z+dz/len*step;if(!blocked(x,z,.3)){g.position.set(x,groundAt(x,z),z);faceAlong(g,dx,dz);}}
     }
     const arrived=Math.hypot(g.position.x-phase.target[0],g.position.z-phase.target[1])<.35;
     // Indoors on arriving: at home, or behind a counter she keeps (Grandmother Higa at Johansson Mart's till,
     // world/okinawa/kitahama-shop.js; the shop's room draws her there, interiors/kitahama-shop-room.js).
     const goesIn=phase.place==='home'||phase.place==='kitahama-shop';
     if(arrived&&goesIn)g.userData.indoors=phase.place;else delete g.userData.indoors;
     g.userData.sleeping=arrived&&phase.place==='home'&&phase.rest==='sleep';
     g.userData.walking=!arrived&&!!p.path?.length&&!g.userData.chatHold&&!g.userData.aboardFerry;
     if(!g.userData.chatHold)standAtPoint(g,spec,phase.stand,arrived&&!p.path?.length&&!g.userData.playerConversation,dt);
     g.visible=!g.userData.aboardFerry&&!(arrived&&(goesIn||phase.school));
     continue;
    }
    if(spec.routine?.some(phase=>phase.route)){
     const m=((minutes%1440)+1440)%1440,phase=[...spec.routine].reverse().find(p=>m>=p.from);
     if(!p.routine){p.routine=phase;const at=phase.home?phase.route.at(-1):[spec.at[0],spec.y??0,spec.at[1]];g.position.set(...at);p.steps=[];}
     if(p.routine!==phase){p.routine=phase;p.steps=phase.route.map(a=>[...a]);}
     g.userData.activity=phase.role;
     if(!g.userData.playerConversation&&p.steps.length){
      const to=p.steps[0],dx=to[0]-g.position.x,dy=to[1]-g.position.y,dz=to[2]-g.position.z,len=Math.hypot(dx,dy,dz),step=Math.min(len,dt*.75);
      if(len<.025)p.steps.shift();else {g.position.x+=dx/len*step;g.position.y+=dy/len*step;g.position.z+=dz/len*step;faceAlong(g,dx,dz);}
     }
     g.visible=!!p.steps.length||!phase.home;
     if(g.visible&&!p.steps.length)faceAlong(g,...spec.face);
     continue;
    }
    if(spec.routine){const m=((minutes%1440)+1440)%1440,phase=[...spec.routine].reverse().find(p=>m>=p.from);if(!p.routine){g.position.set(phase.at[0],groundAt(...phase.at),phase.at[1]);p.routine=phase;}if(p.routine!==phase){p.routine=phase;p.path=phase.away?[]:navigation.path(g.position,{x:phase.at[0],z:phase.at[1]});}g.userData.activity=phase.role;g.userData.scheduledAway=!!phase.away;if(phase.away){g.visible=false;continue;}if(!g.userData.playerConversation&&p.path?.length){const to=p.path[0],dx=to[0]-g.position.x,dz=to[1]-g.position.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*.75);if(len<.07)p.path.shift();else {const x=g.position.x+dx/len*step,z=g.position.z+dz/len*step;if(!blocked(x,z,.32)){g.position.set(x,groundAt(x,z),z);faceAlong(g,dx,dz);}}}if(phase.home&&!p.path?.length){g.visible=false;continue;}}
    const awake=neighbourAwake(spec,minutes);
    const near=!viewer||Math.hypot(g.position.x-viewer.x,g.position.z-viewer.z)<45;
    g.visible=awake&&near;
    if(!g.visible)continue;
    const held=(talking===p&&now<talkUntil)||g.userData.playerConversation||g.userData.chatHold;
    if(spec.walk&&!held){
     p.travelled+=spec.speed*dt;
     const at=routePoint(spec.route,p.travelled);
     g.position.x=at.x;g.position.z=at.z;if(spec.y==null)g.position.y=groundAt(at.x,at.z);faceAlong(g,at.dx,at.dz);
    }else if(!spec.walk&&!held&&spec.face&&!p.path?.length){
     // Back to their work once you have gone.
     const face=p.routine?.face||spec.face,want=Math.atan2(face[0],face[1])+Math.PI,diff=Math.atan2(Math.sin(want-g.rotation.y),Math.cos(want-g.rotation.y));
     g.rotation.y+=diff*Math.min(1,dt*2.5);
    }
   }
  },
 };
}
