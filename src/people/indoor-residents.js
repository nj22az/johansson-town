import {sakuraClerkAt} from '../commerce/sakura-rota.js';
import {MINATO_COMPACT} from '../world/interiors/minato-compact-plan.js';
import {SHARED_DINING_SEAT_FRONT} from '../world/interiors/shared-dining-layout.js';
import {groundHeight} from '../world/layout.js?snappy=1';
import {STORE_CLERK_POSITION,STORE_SEATS} from '../world/interiors/store-layout.js';
import {residentPlan,RAMEN_DOOR,IZAKAYA_DOOR,IZAKAYA_SEATS} from './social.js';
import {createRoomWalk,atDestination} from './room-walk.js';
import {tillStep} from './retail-clerk.js';
import {izakayaJob} from './izakaya-hours.js';
import {ONSEN_DOOR,ONSEN_ENTRY_RADIUS} from '../world/onsen-layout.js';
import {ONSEN_SEATS} from '../world/interiors/onsen.js';
import {ONSEN_DOORWAYS,onsenSide} from '../world/interiors/onsen-lobby.js';
import {recipeFor} from '../avatars/cast.js';
import {SATO_GUEST_SEATS,SATO_COOK,SATO_ROOM} from '../world/sato-ramen-layout.js';

/** Each guest seat names its real support top and a clear approach beside the furniture. */
export const IZAKAYA_GUEST_SEATS=Object.freeze(IZAKAYA_SEATS.map(([x,z],i)=>{
 const p=MINATO_COMPACT,counter=i<p.counterStools.length,north=z===p.booth.benchZ[0];
 return Object.freeze({position:[x,0,z],surfaceY:p.seatHeight,height:p.seatHeight,yaw:counter||!north?0:Math.PI,front:SHARED_DINING_SEAT_FRONT[counter?'stool':'bench'],
  stand:counter?[x,0,p.counterStandZ]:[p.booth.standX[x===p.booth.seatX[0]?0:1],0,z],
  table:counter?[x,p.counter.top,p.counter.position[2]+p.counter.depth*.25]:[x,p.booth.tableTop,p.booth.position[2]+(north?-1:1)*p.booth.tableDepth*.2],
 });
}));

// One actor belongs to one location. New visitors cross the door and walk to a
// reserved place; changing the clock sends seated guests back to the exit.
export function createIndoorResidents({world,parent,place,getState=()=>({}),getPlayerSeat=()=>null,onBorrow=()=>{},canLeave=()=>true,getStandingVisit=()=>null,collides=()=>false,getRain=()=>false,layout=null,isOccupied=()=>false,radiusFor=()=>.3,validateSpawn=false}){
 const borrowed=new Map(),walkers=new Map();let clock=0;
 function walk(p,target,dt){
  // Use the fitted room's bounds and a separate dynamic plan for each actual person.
  let path=walkers.get(p);if(!path){path={walker:createRoomWalk((x,z,r)=>collides(x,z,r)||isOccupied(x,z,r,p),{bounds:layout?.bounds||(place==='izakaya'?MINATO_COMPACT.bounds:{minX:-8,maxX:12,minZ:-8,maxZ:8}),radius:radiusFor(p)}),stalled:0};walkers.set(p,path);}
  const before=p.g.position.clone(),arrived=path.walker.move(p,target,dt);
  if(validateSpawn&&!arrived&&p.g.position.distanceTo(before)<.0001){path.stalled+=dt;if(path.stalled>=2){path.walker.clear();path.stalled=0;}}else path.stalled=0;
  return arrived;
 }
 // On the island the ramen counter is Sato Ramen, beside Minato (world/sato-ramen-layout.js).
 const sato=(place==='ramen');
 const entrance=layout?.entrance||(sato?[SATO_ROOM.spawn[0],0,SATO_ROOM.spawn[2]]:place==='izakaya'?MINATO_COMPACT.entrance.spawn:[0,0,5.2]);
 const door=p=>place==='ramen'?RAMEN_DOOR:place==='izakaya'?IZAKAYA_DOOR:place==='onsen'?ONSEN_DOOR:world.people.find(p=>p.profile.name==='Thuan').profile.work;
 const wanted=p=>residentPlan(p.profile,clock,getRain(),getState()).place===place&&!(p.profile.name==='Chin'&&getState().kenjiEscort==='walking');
 function restore(p){
  const saved=borrowed.get(p);if(!saved)return;const g=p.g,point=door(p),remaining=wanted(p);
  saved.parent.add(g);g.position.set(point[0],groundHeight(...point),point[1]);g.quaternion.copy(saved.rotation);g.userData.hit.inside=saved.inside;
  for(const key of ['inMarket','inRamen','inIzakaya','inOnsen','outfit','indoors','socialPose','seatHeight','seatFront','chairBlend','floorHeight','ramenSeat','izakayaSeat','storeSeatId','serving','heldItem','mealState','residentSpeech','roomTransition','carrying','carriedTray','shopGoods','shopReach','shopping','tool'])delete g.userData[key];
  if(remaining)g.userData.indoors=place;g.visible=!remaining;borrowed.delete(p);walkers.get(p)?.walker.clear();walkers.delete(p);
 }
 function seatFor(p){
  const name=p.profile.name;
  const standing=getStandingVisit(p,clock);if(standing)return {position:standing,stand:standing,yaw:0,managed:true};
  // The clerk walks to the approach behind the counter and steps forward to the till (sakura-queue.js: 0.75 m behind
  // the counter's front, nearer than a clerk-sized clearance circle is routed).
  // `body`: a clerk already at work (a save made in her shift) is found at the till, which only her body, not the
  // routed clearance circle, has to be clear for; she does not walk in from the door again.
  if(place==='market'&&name===sakuraClerkAt(clock))return {position:layout?.staff||STORE_CLERK_POSITION,stand:layout?.staffApproach||layout?.staff||STORE_CLERK_POSITION,yaw:layout?.staffYaw??Math.PI,staff:true,body:layout?.staffBody};
  if(place==='market'&&layout?.guestStands){
   // A finished errand can still be followed by an evening browse. These are
   // standing places in the actual shop, never the older store's removed chairs.
   const radius=radiusFor(p),position=layout.guestStands.find(at=>
    !collides(at[0],at[2],radius)&&!isOccupied(at[0],at[2],radius,p)&&
    ![...borrowed.values()].some(v=>v.seat.guestStand===at));
   if(!position)return null;
   return {position,stand:position,guestStand:position,standing:true,yaw:layout.guestYaw??Math.PI,activity:layout.guestActivity??'visiting Sakura'};
  }
  if(sato&&name==='Mrs Sato')return {position:[...SATO_COOK.position],stand:[...SATO_COOK.position],yaw:SATO_COOK.yaw,staff:true};
  if(place==='izakaya'&&name==='Thao')return {position:[...MINATO_COMPACT.staff.position],stand:[...MINATO_COMPACT.staff.position],yaw:Math.PI,staff:true};
  // Umi-no-yu: into the rock bath by the sea wall, leaving the other side for the player. Everyone goes in through
  // their own side's noren and changes there (ONSEN_DOORWAYS: by the body's silhouette in its recipe), then out through
  // that side's bath door; they come back the same way. `via` is the walk's waypoints before the seat.
  if(place==='onsen'){
   const seat=ONSEN_SEATS[getPlayerSeat()==='rockBeside'?'rock':'rockBeside'],side=onsenSide(recipeFor(name));
   return {...seat,height:seat.surfaceY,soak:true,side,via:[ONSEN_DOORWAYS[side].changeAt]};
  }
  const seats=sato?SATO_GUEST_SEATS:place==='market'?STORE_SEATS:IZAKAYA_GUEST_SEATS;
  // A seat the player is sitting on is taken: at Minato they may have any free stool.
  const mine=getPlayerSeat(),taken=s=>Array.isArray(mine)&&Math.hypot(s.position[0]-mine[0],s.position[2]-mine[2])<.4;
  const index=seats.findIndex((s,i)=>(place!=='market'||i>=2&&s.id!==mine)&&!taken(s)&&![...borrowed.values()].some(v=>v.index===i&&!v.seat.staff));
  if(index<0)return null;const seat=seats[index];
  return {...seat,index,stand:seat.stand||[1.16,0,seat.position[2]]};
 }
 // A walk through waypoints: `via` in order, then `to`; going out, the same waypoints backwards. Returns true on arrival.
 function walkVia(p,saved,via,to,dt,dir){
  if(saved.leg?.dir!==dir)saved.leg={dir,i:0};
  const points=[...(dir==='out'?[...via].reverse():via),to];
  if(saved.leg.i<points.length&&walk(p,points[saved.leg.i],dt))saved.leg.i++;
  return saved.leg.i>=points.length;
 }
 /**
  * What a bather has on at Umi-no-yu: their clothes until they reach their side's lockers (the walk's waypoints, `via`) on
  * the way in, and again from there on the way out; swimwear (build.js wear('swim')) in between, in the shared bath.
  */
 function onsenDress(g,saved){
  const via=saved.seat.via||[],leg=saved.leg,past=leg&&leg.i>=via.length;
  const swim=saved.phase==='arriving'?!!(leg?.dir==='in'&&past):saved.phase==='leaving'?!(leg?.dir==='out'&&past):true;
  if(swim)g.userData.outfit='swim';else delete g.userData.outfit;
 }
 const hasSeat=seat=>Number.isFinite(seat.surfaceY)||Number.isFinite(seat.height);
 const seatHeight=(seat,g)=>Number.isFinite(seat.surfaceY)?seat.surfaceY-g.position.y:seat.height;
 function moveAcrossSeat(g,from,to,amount){g.position.set(from[0]+(to[0]-from[0])*amount,from[1]+(to[1]-from[1])*amount,from[2]+(to[2]-from[2])*amount);}
 // (`front`: where the seat's front edge is, so the shins hang in front of it: animate.js seatFront)
 const seatFront=(seat,g)=>{if(Number.isFinite(seat.front))g.userData.seatFront=seat.front;else delete g.userData.seatFront;};
 function chairPose(g,seat,blend){
  if(!hasSeat(seat))return;
  g.userData.seatHeight=seatHeight(seat,g);seatFront(seat,g);g.userData.chairBlend=blend;g.userData.socialPose=seat.soak?'Soak':'Sit';
 }
 function sync(minutes,dt=0){
  clock=minutes;
  for(const p of world.people){
   const g=p.g;let saved=borrowed.get(p);
   if(!saved){
    if(!wanted(p)||!atDestination(p,place,door(p),place==='onsen'?ONSEN_ENTRY_RADIUS:.85))continue;
    const seat=seatFor(p);if(!seat)continue;
    const settled=g.userData.indoors===place&&!g.userData.justArrived,radius=radiusFor(p);
    let at=settled||seat.managed?seat.position:entrance;
    const fits=point=>{const r=point===seat.position&&seat.body?seat.body:radius;return !collides(point[0],point[2],r)&&!isOccupied(point[0],point[2],r,p);};
    if(validateSpawn&&!fits(at))at=entrance;
    if(validateSpawn&&!fits(at))continue;
    const atSeat=at===seat.position;
    walkers.get(p)?.walker.clear();walkers.delete(p);onBorrow(p,minutes);saved={parent:g.parent,rotation:g.quaternion.clone(),inside:g.userData.hit.inside,seat,index:seat.index,phase:seat.managed||settled&&atSeat?'seated':'arriving',blend:settled&&atSeat?1:0};borrowed.set(p,saved);parent.add(g);
    // Face the path we will walk. Using seat.yaw at the door made visitors moonwalk
    // toward their stand (Walk clip forward, body aimed at the chair).
    if(atSeat||seat.managed){g.position.set(...at);g.rotation.set(0,seat.yaw,0);}
    else{
     const stand=seat.stand||seat.position;
     g.position.set(...entrance);
     const dx=stand[0]-entrance[0],dz=stand[2]-entrance[2];
     g.rotation.set(0,Math.hypot(dx,dz)>.001?Math.atan2(-dx,-dz):seat.yaw,0);
    }
   }
   g.visible=true;g.userData.hit.inside=true;g.userData.indoors=place;
   g.userData[place==='ramen'?'inRamen':place==='market'?'inMarket':place==='onsen'?'inOnsen':'inIzakaya']=true;g.userData.place=place;
   // Changed on their own side (the women at the lockers, the men at the baskets): in through the lobby in their clothes,
   // into swimwear at their side's lockers, because past the bath doors the washing room and the rock bath are shared, a
   // swimwear zone (nobody bathes bare), and dressed again at the lockers on the way home (onsenDress).
   if(place==='onsen')onsenDress(g,saved);
   // Closed Minato: whoever is there works through their cleaning stations
   // (izakaya-hours.js), walking from one to the next; when the job ends they go back
   // to their own place.
   if(place==='izakaya'&&['seated','arriving'].includes(saved.phase)&&wanted(p)){
    const job=izakayaJob(p.profile.name,clock),key=job?.key||null;
    if(key!==(saved.jobKey??null)){
     saved.jobKey=key;
     const next=job?{position:[...job.at],stand:[...job.at],yaw:job.yaw,staff:true,job}:(saved.seat.job?seatFor(p):null);
     if(next){
      delete g.userData.socialPose;delete g.userData.tool;delete g.userData.seatHeight;delete g.userData.seatFront;
      // Off a seat first (seats sit inside their furniture), then walk to the next place.
      if(saved.phase==='seated'&&hasSeat(saved.seat)){saved.pending=next;saved.phase='standing';saved.blend=1;}
      else{saved.seat=next;saved.index=next.index;saved.phase='arriving';saved.blend=0;}
     }
    }
   }
   const seat=saved.seat;
   // Staff can be at a break chair or carrying an order when their shift ends.
   // Let the service finish standing/returning before the exit walker takes over.
   if(!wanted(p)&&!['standing','leaving'].includes(saved.phase)&&canLeave(p))saved.phase=['seated','sitting'].includes(saved.phase)&&hasSeat(seat)?'standing':'leaving';
   if(saved.phase!=='seated'){
    g.userData.roomTransition=true;
    for(const key of ['socialPose','seatHeight','seatFront','chairBlend','storeSeatId','heldItem','mealState','serving','carrying','carriedTray','shopGoods','shopReach','shopping'])delete g.userData[key];
    g.userData.activity=saved.pending||saved.phase==='arriving'&&seat.job?'getting up to work':['standing','leaving'].includes(saved.phase)?'leaving '+place:'walking to '+(seat.staff?'work':'a seat');
    if(saved.phase==='standing'){
     saved.blend=Math.max(0,saved.blend-dt*2);moveAcrossSeat(g,seat.stand,seat.position,saved.blend);chairPose(g,seat,saved.blend);if(saved.blend===0){for(const key of ['seatHeight','seatFront','chairBlend','socialPose'])delete g.userData[key];if(saved.pending){saved.seat=saved.pending;saved.index=saved.pending.index;delete saved.pending;saved.phase='arriving';}else saved.phase='leaving';}
    }else if(saved.phase==='leaving'){
     if(walkVia(p,saved,seat.via||[],entrance,dt,'out'))restore(p);
    }else if(saved.phase==='arriving'){
     if(walkVia(p,saved,seat.via||[],seat.stand,dt,'in')){if(hasSeat(seat)||!seat.staff)g.rotation.set(0,seat.yaw,0);saved.phase=seat.standing?'seated':'sitting';}
    }else if(saved.phase==='sitting'&&!hasSeat(seat)&&seat.staff){
     // A standing place at work (Sakura's till, sakura-queue.js): walked onto from wherever the routed walk stopped,
     // facing the way the step goes, never slid or set down on it.
     // On it, she turns to face the counter at a walker's turning pace: set straight round, she swung a quarter of a
     // turn in one frame as she stepped onto it.
     if(tillStep(g,seat.position,dt)){const a=Math.atan2(Math.sin(seat.yaw-g.rotation.y),Math.cos(seat.yaw-g.rotation.y));
      if(Math.abs(a)>dt*2.6)g.rotation.y+=Math.sign(a)*dt*2.6;else{g.rotation.set(0,seat.yaw,0);saved.blend=1;saved.phase='seated';}}
    }else if(saved.phase==='sitting'){
     saved.blend=Math.min(1,saved.blend+dt*2);moveAcrossSeat(g,seat.stand,seat.position,saved.blend);chairPose(g,seat,saved.blend);if(saved.blend===1)saved.phase='seated';
    }
    continue;
   }
   delete g.userData.roomTransition;delete g.userData.chairBlend;
   if(!seat.staff&&!seat.managed&&!seat.standing){g.position.set(...seat.position);g.rotation.set(0,seat.yaw,0);}
   if(hasSeat(seat)){g.userData.seatHeight=seatHeight(seat,g);seatFront(seat,g);if(!g.userData.mealState)g.userData.socialPose=seat.soak?'Soak':'Sit';}
   if(place==='market'&&!seat.staff&&!seat.managed)g.userData.storeSeatId=seat.id;
   if(place==='ramen')g.userData.ramenSeat=seat.index;
   if(place==='izakaya')g.userData.izakayaSeat=seat.index;
   if(seat.job){g.userData.socialPose=seat.job.pose;if(seat.job.tool)g.userData.tool=seat.job.tool;else delete g.userData.tool;g.userData.activity=seat.job.activity;continue;}
   // Mrs Sato's kitchen (people/ramen-kitchen.js) hands her a cloth or a glass itself.
   if(!g.userData.kitchen)delete g.userData.tool;
   if(!seat.managed&&!g.userData.mealState&&!(seat.staff&&g.userData.serving))g.userData.activity=seat.activity||(seat.staff?p.profile.role:seat.soak?'soaking in the rock bath':'relaxing at '+place);
   const home=world.homes?.get(p.profile.name);if(home)home.occupied=false;
  }
  return [...borrowed.keys()].map(p=>p.profile.name);
 }
 return {sync,names:()=>[...borrowed.keys()].map(p=>p.profile.name),restore(){for(const p of [...borrowed.keys()])restore(p);for(const path of walkers.values())path.walker.clear();walkers.clear();}};
}
