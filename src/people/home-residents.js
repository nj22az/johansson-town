import * as THREE from '../../vendor/three.module.js';
import {residentPlan} from './social.js';
import {homeRoutine,homeLayoutFor} from './home-life.js';
import {householdNames} from './households.js';
import {groundHeight} from '../world/layout.js?snappy=1';
import {createRoomWalk,atDestination} from './room-walk.js';
import {createSleepCover} from './sleep-cover.js';
import {residentPersonality} from './resident-personalities.js';
import {buildHatProp} from '../avatars/build.js';
import {recipeFor} from '../avatars/cast.js';

function createHomeResident({world,parent,collides=()=>false,onBorrow=()=>{},getRain=()=>false,getState=()=>({}),getPlayerSeat=()=>null},name){
 let site=null,person=null,saved=null,layout=null,walker=null,cover=null,hat=null,clock=0,rest=0,sleepBlend=0,tableBlend=0,entrySteps=[],leaving=false;
 // Home, the hat comes off and goes on its hook; it goes back on at the door. A room
 // with no hook for them leaves it on their head rather than make it vanish.
 function hangHat(g){
  const hook=layout.hatHook;if(!hook)return;
  hat=buildHatProp(recipeFor(name),{mode:hook.mode||'wall'});if(!hat)return;
  hat.position.set(...hook.position);hat.rotation.set(hook.tilt??(hook.mode==='stand'?0:.25),hook.yaw||0,0,'YXZ');
  parent.add(hat);g.userData.hatOff=true;
 }
 function takeHat(g){
  if(g)delete g.userData.hatOff;
  if(!hat)return;hat.removeFromParent();hat.geometry.dispose();hat.material.dispose();hat=null;
 }
 function restore(){
  cover?.dispose();cover=null;takeHat(person?.g);
  if(!saved)return;
  entrySteps=[];leaving=false;
  const g=person.g,stillHome=residentPlan(person.profile,clock,getRain(),getState()).place==='home';
  saved.parent.add(g);g.position.set(person.profile.home[0],groundHeight(...person.profile.home),person.profile.home[1]);g.quaternion.copy(saved.rotation);g.userData.hit.inside=saved.inside;
  for(const key of ['inHome','socialPose','seatHeight','seatFront','chairBlend','heldItem','sleeping','waking','sleepBlend','roomTransition','facePlayerUntil','chatHold'])delete g.userData[key];
  if(stillHome){g.userData.indoors='home';g.visible=false;}else{delete g.userData.indoors;g.visible=true;}
  const home=world.homes?.get(person.profile.name);if(home)home.occupied=stillHome;
  saved=null;rest=0;sleepBlend=0;tableBlend=0;
 }
 const nextRoute=()=>site?.entranceRoute;
 function update(dt,minutes){
  clock=minutes;if(!site)return;
  const plan=residentPlan(person.profile,minutes,getRain(),getState()),g=person.g;
  if(!saved){
   if(plan.place!=='home'||!atDestination(person,'home',person.profile.home))return;
   const alreadyHome=g.userData.indoors==='home'&&!g.userData.justArrived;
   onBorrow(person,minutes);saved={parent:g.parent,rotation:g.quaternion.clone(),inside:g.userData.hit.inside};parent.add(g);
   cover=createSleepCover(parent,layout,residentPersonality(person.profile.name).top);
   hangHat(g);
   g.position.set(...layout.door);g.rotation.set(0,0,0);g.userData.inHome=true;g.userData.indoors='home';g.userData.hit.inside=true;g.visible=true;
   if(!alreadyHome&&nextRoute()){entrySteps=nextRoute().map(p=>[...p]);g.position.set(...entrySteps.shift());}
   if(alreadyHome){sleepBlend=homeRoutine(person.profile,minutes).id==='sleep'?1:0;g.position.set(...layout.bedside);rest=['sleep','wake','bedtime'].includes(homeRoutine(person.profile,minutes).id)?1:0;}
  }
  const routine=homeRoutine(person.profile,minutes),bedtime=plan.place==='home'&&['sleep','wake','bedtime'].includes(routine.id);
  g.userData.place=site.id;g.userData.activity=plan.place==='home'?routine.activity:'leaving home';
  g.userData.sleeping=bedtime&&routine.id==='sleep';g.userData.waking=bedtime&&routine.id==='wake';
  delete g.userData.socialPose;delete g.userData.seatHeight;delete g.userData.seatFront;delete g.userData.chairBlend;delete g.userData.heldItem;
  const occupied=getPlayerSeat(),tableTaken=occupied&&Math.hypot(occupied[0]-layout.table[0],occupied[2]-layout.table[2])<.55;
  const atTable=plan.place==='home'&&!bedtime&&!tableTaken,tableStand=layout.tableStand||layout.table;
  if(!atTable&&tableBlend>0){
   tableBlend=Math.max(0,tableBlend-dt*2);setTable(g,tableStand,tableBlend,'Sit');
   g.userData.sleeping=false;g.userData.waking=false;g.userData.roomTransition=true;
   if(tableBlend===0)for(const key of ['socialPose','seatHeight','seatFront','chairBlend'])delete g.userData[key];
   return;
  }
  if(!bedtime&&rest>0){
   sleepBlend=Math.max(0,sleepBlend-dt*1.5);rest=Math.max(0,rest-dt*1.5);setRest(g,rest,false);cover?.update(dt,sleepBlend*rest);g.userData.roomTransition=true;return;
  }
  if(plan.place==='home'&&layout.prepareBedding?.(person,walker,dt)){g.userData.roomTransition=true;return;}
  if(entrySteps.length){
   const to=entrySteps[0],dx=to[0]-g.position.x,dy=to[1]-g.position.y,dz=to[2]-g.position.z,len=Math.hypot(dx,dy,dz),step=Math.min(len,dt*.7);
   if(len<.02)entrySteps.shift();else {g.position.x+=dx/len*step;g.position.y+=dy/len*step;g.position.z+=dz/len*step;if(dx||dz)g.rotation.y=Math.atan2(dx,dz)+Math.PI;}
   g.userData.roomTransition=true;return;
  }
  if(leaving&&!entrySteps.length){restore();return;}
  const target=plan.place!=='home'?layout.door:bedtime?layout.bedside:tableStand;
  // Navigation ends on clear floor; the chair routine owns the short movement
  // through its furniture footprint until they have stood clear again.
  if(rest===0&&tableBlend===0&&!walker.move(person,target,dt)){g.userData.roomTransition=true;return;}
  delete g.userData.roomTransition;
  if(plan.place!=='home'){if(nextRoute()&&!leaving){leaving=true;entrySteps=[...nextRoute()].reverse().map(p=>[...p]);return;}restore();return;}
  if(bedtime){rest=Math.min(1,rest+dt*1.5);sleepBlend=Math.max(0,Math.min(1,sleepBlend+(routine.id==='sleep'?dt:-dt)*1.5));setRest(g,rest,routine.id==='sleep');cover?.update(dt,sleepBlend*rest);}
  else {
   if(tableTaken){g.userData.activity='waiting for a free seat';delete g.userData.roomTransition;return;}
   tableBlend=Math.min(1,tableBlend+dt*2);setTable(g,tableStand,tableBlend,routine.pose);g.userData.heldItem=routine.item;
   if(tableBlend<1)g.userData.roomTransition=true;
   else delete g.userData.chairBlend;
  }
  const home=world.homes?.get(person.profile.name);if(home)home.occupied=true;
 }
 function setTable(g,stand,amount,pose){
  const at=layout.table;
  g.position.set(stand[0]+(at[0]-stand[0])*amount,stand[1]+(at[1]-stand[1])*amount,stand[2]+(at[2]-stand[2])*amount);
  g.rotation.set(0,layout.tableSeatYaw??0,0);g.userData.socialPose=pose;
  g.userData.seatHeight=(layout.tableSeatHeight??.42)+at[1]-g.position.y;g.userData.chairBlend=amount;
  // (where the seat's front edge is, so the shins hang in front of it: animate.js seatFront)
  if(Number.isFinite(layout.tableSeatFront))g.userData.seatFront=layout.tableSeatFront;
 }
 function setRest(g,amount,asleep){
  const from=layout.bedside,to=layout.bed;
  g.position.set(...from).lerp({x:to[0],y:to[1],z:to[2]},amount);
  const lying=layout.bedAxis==='x'?new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,Math.PI/2)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-Math.PI/2,0))):new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,Math.PI,0));
  g.quaternion.identity().slerp(lying,sleepBlend*amount);
  g.userData.sleepBlend=sleepBlend*amount;g.userData.socialPose=asleep||sleepBlend>.01?'Sleep':'Wake';if(!asleep&&sleepBlend<=.01)g.userData.seatHeight=to[1];
 }
 return {enter(next,minutes){restore();site=next;person=[...world.people,...(world.homeNeighbours||[])].find(p=>p.profile?.name===name);if(!person){site=null;return;}layout=next.homeLayouts?.[name]||homeLayoutFor(person.profile.name);walker=createRoomWalk(collides,{bounds:layout.bounds,height:layout.door[1]||0});update(0,minutes);},update,restore(){restore();site=null;walker?.clear();}};
}

// Borrow each existing street actor independently. Entering a shared home cannot
// summon a roommate from work, wake a night worker or duplicate a character.
export function createHomeResidents(options){
 let residents=[];
 const restore=()=>{residents.forEach(r=>r.restore());residents=[];};
 return {enter(site,minutes){restore();residents=householdNames(site).filter(name=>[...options.world.people,...(options.world.homeNeighbours||[])].some(p=>p.profile?.name===name)).map(name=>createHomeResident(options,name));residents.forEach(r=>r.enter(site,minutes));},
  update(dt,minutes){residents.forEach(r=>r.update(dt,minutes));},restore};
}
