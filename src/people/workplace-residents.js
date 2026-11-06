import {createRoomWalk,atDestination} from './room-walk.js';
import {residentPlan} from './social.js';
import {createTownActivities} from './town-activities.js';
import {standNow} from './stand-points.js';
import {OWN_STAFF_ROOMS,EVENING_DESKS,workRoomOf} from './workplaces.js';

/** On a stand point: turn to its facing at a walker's pace, then its pose and tool (stand-points.js). */
function faceStand(g,stand,dt){
 const diff=Math.atan2(Math.sin(stand.yaw-g.rotation.y),Math.cos(stand.yaw-g.rotation.y));
 g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,diff));
 if(Math.abs(diff)<.05){const u=g.userData;u.socialPose=stand.point.pose||'Idle';if(stand.point.tool)u.tool=stand.point.tool;else delete u.tool;u.standPose=true;}
}
/** Off a stand point: put down only what faceStand took up. */
function dropStand(g){const u=g.userData;if(u.standPose){delete u.socialPose;delete u.tool;delete u.standPose;}}
/** Who may be drawn in this room: its own workers, and whoever keeps an evening desk in it. */
const staffOf=(p,id)=>p.profile.workSite===id||EVENING_DESKS[p.profile.name]?.site===id;
// Workplaces are assigned to people, so two residents can share one real room.
export function createWorkplaceResidents({world,parent,getTargets,collides,getPlayerPosition,getState,ledger,onBorrow=()=>{},getEntrance=()=>[0,0,5.2],getLayout=()=>null}){
 const borrowed=new Map();let site=null,interactions=null,walker=null,clock=0,departing=null;
 const occupied=(x,z,person)=>{
  const player=getPlayerPosition();if(player&&Math.hypot(player.x-x,player.z-z)<.72)return true;
  return [...borrowed.keys()].some(other=>other!==person&&Math.hypot(other.g.position.x-x,other.g.position.z-z)<.68);
 };
 function restore(person){
  const saved=borrowed.get(person);if(!saved)return;interactions?.release(person,clock);
  const g=person.g;saved.parent.add(g);g.position.copy(saved.position);g.quaternion.copy(saved.rotation);g.visible=true;g.userData.hit.inside=saved.inside;
  for(const key of ['inWorkplace','indoors','usingTownObject','socialPose','seatHeight','heldItem','roomTransition','tool','standPose'])delete g.userData[key];
  const plan=residentPlan(person.profile,clock,false,getState());
  if(workRoomOf(person.profile,plan)){g.userData.indoors=plan.place;g.visible=false;}
  borrowed.delete(person);
  if(departing===person)departing=null;
 }
 function walk(person,target,dt){
  const before=person.g.position.clone(),arrived=walker.move(person,target,dt);
  if(occupied(person.g.position.x,person.g.position.z,person)){person.g.position.copy(before);return false;}
  return arrived;
 }
 function update(dt,minutes,rain,initial=false){
  clock=minutes;if(!site)return;
  // A worker the ferry has called to the quay for her lines (ferry-shore-crew.js) walks out of the room like anyone whose day moves on.
  // Working here: at their own workplace, or at an evening desk in it (workplaces.js EVENING_DESKS).
  const working=p=>workRoomOf(p.profile,residentPlan(p.profile,minutes,rain,getState()))===site.id&&!(p.profile.name==='Chin'&&getState().kenjiEscort==='walking')&&!p.g.userData.ferryShoreTask;
  // One worker uses the narrow exit at a time. Otherwise two converging routes
  // can stop shoulder to shoulder, each rejecting the other's next step forever.
  const leaving=[...borrowed.keys()].filter(person=>!working(person));
  if(!leaving.includes(departing))departing=null;
  if(!departing){const entrance=getEntrance();departing=leaving.sort((a,b)=>Math.hypot(a.g.position.x-entrance[0],a.g.position.z-entrance[2])-Math.hypot(b.g.position.x-entrance[0],b.g.position.z-entrance[2]))[0]||null;}
  for(const person of leaving){
   interactions.release(person,minutes);person.g.userData.roomTransition=true;person.g.userData.activity='leaving work';
   if(person===departing&&walk(person,getEntrance(),dt))restore(person);
  }
  const staff=world.people.filter(p=>staffOf(p,site.id)),layout=getLayout();
  for(const worker of staff){
   if(borrowed.has(worker)||!working(worker))continue;
   const plan=residentPlan(worker.profile,minutes,rain,getState()),place=plan.place;
   if(!atDestination(worker,place,place==='work'?worker.profile.work:plan.target))continue;
   const preferred=layout?.staff?.[worker.profile.name];
   const choices=preferred?[preferred]:[[-.9,0,1.5],[1.4,0,1.5],[0,0,.3],[-1.2,0,-.3],[1.2,0,-.3]];
   const stand=choices.find(([x,,z])=>!collides(x,z,.35)&&!occupied(x,z,worker));if(!stand)continue;
   const alreadyInside=initial&&worker.g.userData.indoors===place,entrance=getEntrance();
   if(!alreadyInside&&occupied(entrance[0],entrance[2],worker))continue;
   const g=worker.g;onBorrow(worker,minutes);borrowed.set(worker,{parent:g.parent,position:g.position.clone(),rotation:g.quaternion.clone(),inside:g.userData.hit.inside,stand,arriving:!alreadyInside});
   parent.add(g);g.position.set(...(alreadyInside?stand:entrance));g.userData.hit.inside=true;g.userData.inWorkplace=site.id;g.userData.indoors=place;g.userData.place=site.id;g.visible=true;
   if(alreadyInside)g.rotation.y=0;
  }
  for(const [person,saved] of borrowed){
   if(!working(person))continue;
   const g=person.g;
   if(saved.arriving){g.userData.roomTransition=true;g.userData.activity='walking to work';if(!walk(person,saved.stand,dt))continue;saved.arriving=false;delete g.userData.roomTransition;}
   if(site.bookshop&&g.userData.bookshopServing){interactions.release(person,minutes);dropStand(g);walk(person,saved.stand,dt);continue;}
   // A phase of their day with stand points in this room (stand-points.js): the counter, the back bench, the window
   // desk, the notice board, in the order and for the time the seeded clock gives; the room's odd jobs wait.
   const stand=standNow(person.profile.name,minutes,site.id);
   if(stand){
    interactions.release(person,minutes);g.userData.place=site.id;g.userData.activity=stand.point.activity;
    if(g.userData.chatHold||g.userData.facePlayerUntil>performance.now())continue;
    if(walk(person,[stand.point.x,0,stand.point.z],dt))faceStand(g,stand,dt);else dropStand(g);
    continue;
   }
   dropStand(g);
   const base={place:'work',target:[saved.stand[0],saved.stand[2]],activity:'working at '+site.title},plan=interactions.plan(person,base,minutes,rain,dt);
   g.userData.place=site.id;g.userData.activity=plan.activity;
   if(g.userData.usingTownObject||g.userData.chatHold||g.userData.facePlayerUntil>performance.now())continue;
   walk(person,[plan.target[0],0,plan.target[1]],dt);
  }
 }
 function leave(){for(const person of [...borrowed.keys()])restore(person);interactions?.dispose();interactions=null;walker?.clear();walker=null;site=null;departing=null;}
 return {enter(next,minutes){leave();if(OWN_STAFF_ROOMS.includes(next.id)||!world.people.some(p=>staffOf(p,next.id)))return;site=next;
  walker=createRoomWalk(collides,{bounds:getLayout()?.bounds});
  interactions=createTownActivities({getTargets,collides,getPlayerPosition,getState,ledger,inside:true});update(0,minutes,false,true);
 },update,restore:leave};
}
