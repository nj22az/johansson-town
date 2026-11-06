import * as THREE from '../../vendor/three.module.js';
import {residentPersonality,createResidentLedger} from './resident-personalities.js';
import {groundHeight} from '../world/layout.js?snappy=1';
import {freeSlot} from '../world/seat-slots.js';

// Interpret affordances, never player callbacks: NPCs must not open the player's
// menus, spend their money, remove quest items or trigger a journey on their behalf.
// Whole words only: "visit" holds "sit", "houseboat" holds "use", "cabinet" holds "bin". Matching inside
// words sent residents to sit on the ground at strangers' front doors and to "use" Mr Fujita's houseboat.
export function townAffordance(object){
 const label=object.userData.hit?.label||'',lower=label.toLowerCase();
 if(!label||object.userData.npcInteraction===false||object.userData.name||/^(talk|catch up|say hello|enter|come into|visit|exit|step outside|travel|board|return|take|pick up|ring service|complete|ride|review)/i.test(label))return null;
 let kind;
 if(object.userData.officeTask)kind='office';
 else if(/fish from|fishing/.test(lower))kind='fish';
 else if(/phone|telephone|call/.test(lower))kind='phone';
 else if(/arcade|star port|play/.test(lower))kind='arcade';
 else if(/radio|music|tune/.test(lower))kind='radio';
 else if(/post ?box|postcard|mail/.test(lower))kind='post';
 else if(/recycl|rubbish|\bbins?\b/.test(lower))kind='recycle';
 else if(/^(buy|order)|vending/.test(lower))kind='shop';
 else if(/\bsit\b|rest on|bench/.test(lower))kind='seat';
 else if(/read|browse|ledger|notice|newspaper|book/.test(lower))kind='read';
 else if(/\b(operate|use|test|switch|open|close)\b/.test(lower))kind='machine';
 else if(/inspect|admire|look|listen|check/.test(lower))kind='inspect';
 else return null;
 const cost=Number(label.match(/[¥￥]\s*(\d+)/)?.[1]||(['shop','arcade','phone'].includes(kind)?kind==='phone'?10:kind==='arcade'?100:120:0));
 const item=/newspaper|book|postcard/.test(lower)?'paper':/rice|onigiri/.test(lower)?'rice':/bun/.test(lower)?'bun':/tea/.test(lower)?'tea':/beer/.test(lower)?'beer':'can';
 return {kind,label,cost,object,item};
}

const POSE={read:'Read',inspect:'Use',machine:'Use',radio:'Use',post:'Use',recycle:'Use',arcade:'Use',phone:'Phone',fish:'Fish',seat:'Sit',shop:'Use'};
// An action label is an order to the player ("Read the Kitahama notice board"); a resident's activity names only its object
// ("reading the Kitahama notice board"), so the label's own verb is dropped.
const LABEL_VERB=/^(?:read|inspect|use|look (?:at|into|out for)|browse|watch|work|visit|enter|go into|come into|talk to|sit (?:on|under|beside)|fish from|buy|return|pray at|soak your feet in|cool off on|greet|cast|complete|board)\s+/i;
export const labelObject=label=>{const rest=String(label).replace(LABEL_VERB,'');return rest===label?label:rest.replace(/^The\b/,'the');};
const VERB={read:'reading',inspect:'examining',machine:'using',radio:'listening to',post:'posting a letter at',recycle:'sorting recycling at',arcade:'playing',phone:'making a call at',fish:'fishing at',seat:'resting at',shop:'buying a snack at'};
// A park visit is free time too: people who go there to rest find the bench, rather than
// standing beside it for an hour.
const eligible=place=>['work','evening','stroll','patrol','park'].includes(place);
/** How much a free moment pulls somebody towards a seat: most in the park, a little on a walk. */
const SEAT_PULL={park:12,evening:2.5,stroll:2.5};
/** How near the player may be to a place on a bench before it is theirs (they sit in it, or stand up out of it). */
const SLOT_CLEAR=.45;

export function createTownActivities({getTargets,collides,getPlayerPosition=()=>null,ledger=createResidentLedger(),getState=()=>({}),inside=false}){
 const active=new Map(),nextScan=new Map(),recent=new Map(),reservations=new Map();let serial=0;
 const point=new THREE.Vector3();
 function release(person,minutes,delay=25){
  const use=active.get(person);if(!use)return;
  reservations.delete(use.slot||use.object);if(use.object.userData.reservedBy===person.profile.name)delete use.object.userData.reservedBy;
  if(use.slot&&use.object.userData.slotsTaken?.[use.slot.slot]===person.profile.name)delete use.object.userData.slotsTaken[use.slot.slot];
  if(use.object.userData.seat&&use.phase==='using'){
   const stand=(use.slot||use.object.userData.seat).stand;
   if(stand)person.g.position.set(...stand);
   else person.g.position.set(use.target[0],inside?0:groundHeight(...use.target),use.target[1]);
  }
  for(const key of ['usingTownObject','heldItem','socialPose','seatHeight','seatFront','chairBlend'])delete person.g.userData[key];
  recent.set(person,use.id);active.delete(person);nextScan.set(person,minutes+delay);
 }
 function approach(object,person,slot=null){
  const seat=slot||object.userData.seat;
  if(seat?.stand){const [x,,z]=seat.stand;if(!collides(x,z,.32))return [x,z];}
  object.getWorldPosition(point);const origin=point.clone(),angle=Math.atan2(person.g.position.z-origin.z,person.g.position.x-origin.x);
  for(const radius of [.8,1.1,1.45])for(const offset of [0,.65,-.65,1.3,-1.3,Math.PI]){
   const a=angle+offset,x=origin.x+Math.cos(a)*radius,z=origin.z+Math.sin(a)*radius;
   if(!collides(x,z,.32))return [x,z];
  }return null;
 }
 function start(person,base,minutes){
  const taste=residentPersonality(person.profile.name),range=base.place==='work'?7:18,player=getPlayerPosition();
  const candidates=[];
  for(const object of getTargets()){
   // (a bench has a place for each sitter, seat-slots.js: one taken leaves the others free)
   const slots=object.userData.seat?.slots;
   const affordance=townAffordance(object);if(!affordance||!!object.userData.hit.inside!==inside||!object.parent||!object.visible||!slots&&(reservations.has(object)||object.userData.reservedBy))continue;
   if(inside&&object.userData.workers&&!object.userData.workers.includes(person.profile.name))continue;
   // On a bench: the free place nearest them, not one the player is in (or right beside, standing up from it).
   const slot=slots?freeSlot(object.userData.seat,person.g.position.x,person.g.position.z,s=>reservations.has(s)||player&&Math.hypot(player.x-s.position[0],player.z-s.position[2])<SLOT_CLEAR):null;
   if(slots&&!slot)continue;
   object.getWorldPosition(point);if(slot)point.set(slot.position[0],point.y,slot.position[2]);
   // Somebody else's place close by is somebody else's (the 1.6 m apart that keeps people from crowding one corner), unless
   // it is on the same bench: sitting beside somebody is what a bench is for.
   const distance=person.g.position.distanceTo(point);if(distance>range||Math.abs(point.y-person.g.position.y)>2.8||!slot&&player&&point.distanceTo(player)<1.6)continue;
   if([...reservations.values()].some(use=>use.object!==object&&Math.hypot(use.location.x-point.x,use.location.z-point.z)<1.6))continue;
   const preference=taste.interests.indexOf(affordance.kind),id=affordance.kind+':'+Math.round(point.x*10)+':'+Math.round(point.z*10);
   if(base.place==='patrol'&&!['read','inspect','phone','post'].includes(affordance.kind))continue;
   if(affordance.cost>ledger.account(person.profile.name,minutes).yen)continue;
   const pull=affordance.kind==='seat'?SEAT_PULL[base.place]||0:0;
   candidates.push({...affordance,id,slot,location:point.clone(),score:distance+(preference<0?5:preference)-pull-((person.profile.name.length+Math.floor(minutes/30))%3)*.2+(recent.get(person)===id?20:0)});
  }
  candidates.sort((a,b)=>a.score-b.score);
  // Bound work per scan. Navigation handles the selected approach; a timeout
  // releases inaccessible objects without holding a chair or retrying each frame.
  for(const candidate of candidates.slice(0,5)){
   const target=approach(candidate.object,person,candidate.slot);if(!target)continue;
   const use={...candidate,target,base:base.place,phase:'walking',remaining:candidate.kind==='fish'?22:candidate.kind==='seat'?(base.place==='park'?40:18):10,deadline:minutes+36,paid:false,transaction:'errand-'+(++serial)+'-'+Math.floor(minutes)};
   active.set(person,use);reservations.set(candidate.slot||candidate.object,use);
   if(candidate.slot)(candidate.object.userData.slotsTaken??={})[candidate.slot.slot]=person.profile.name;else candidate.object.userData.reservedBy=person.profile.name;return use;
  }return null;
 }
 function plan(person,base,minutes,rain,dt){
  const g=person.g;
  // A game with somebody (social.js sistersAtPlay) is not left for a bench or a vending machine.
  const interrupted=!eligible(base.place)||base.play||rain&&!inside||g.userData.chatHold||g.userData.facePlayerUntil>performance.now()||person.profile.name==='Chin'&&getState().kenjiEscort==='walking';
  if(interrupted){release(person,minutes);return base;}
  let use=active.get(person);
  if(use&&(use.base!==base.place||!use.object.parent||!use.object.visible||minutes>use.deadline)){release(person,minutes);use=null;}
  const player=getPlayerPosition();
  // (the player walking up to their seat has it; on a bench, only the player in their own place: sitting down beside them is
  // company, not a reason to get up)
  if(use&&player&&(use.slot?Math.hypot(player.x-use.location.x,player.z-use.location.z)<SLOT_CLEAR:player.distanceTo(use.location)<1.1)){release(person,minutes,18);return base;}
  if(!use){
   if(!nextScan.has(person)){nextScan.set(person,minutes+3+(person.profile.name.length%5)*1.4);return base;}
   if(minutes<nextScan.get(person))return base;nextScan.set(person,minutes+15);
   use=start(person,base,minutes);if(!use)return base;
  }
  const arrived=Math.hypot(g.position.x-use.target[0],g.position.z-use.target[1])<.95;
  if(use.phase==='walking'&&arrived){
   if(!ledger.purchase(person.profile.name,minutes,use.transaction,use.label,use.cost)){release(person,minutes);return base;}
   use.paid=true;use.phase='using';use.deadline=minutes+use.remaining+2;g.userData.usingTownObject=true;
   if(use.kind==='seat'||use.kind==='office'&&use.object.userData.seat){
    const seat=use.slot||use.object.userData.seat;
    if(seat?.position)g.position.set(...seat.position);
    // Furniture exports its physical seat surface in the same frame as position.
    // Camera eye height is independent of the avatar's support and proportions.
    g.userData.seatHeight=Number.isFinite(seat?.surfaceY)?seat.surfaceY-g.position.y:Number.isFinite(seat?.height)?seat.height:.45;
    if(Number.isFinite(seat?.yaw))g.rotation.y=seat.yaw;
    // (where the seat's front edge is, so the body sits forward enough for its shins to hang in front of it: animate.js)
    if(Number.isFinite(seat?.front))g.userData.seatFront=seat.front;
   }
  }
  if(use.phase==='using'){
   use.remaining-=dt;
   if(!use.object.userData.seat)g.rotation.y=Math.atan2(g.position.x-use.location.x,g.position.z-use.location.z);
   const shopping=use.kind==='shop'&&use.remaining<7;
   const office=use.object.userData.officeTask;
   g.userData.socialPose=office?office.pose:shopping?(use.item==='paper'?'Read':['rice','bun'].includes(use.item)?'EatStanding':'DrinkStanding'):POSE[use.kind];
   g.userData.heldItem=office?office.heldItem||null:shopping?use.item:use.kind==='phone'?'phone':use.kind==='fish'?'rod':use.kind==='read'?'paper':null;
   if(use.remaining<=0){ledger.record(person.profile.name,minutes,office?.activity||VERB[use.kind]+' '+labelObject(use.label));release(person,minutes,35);return base;}
  }
  return {place:'town-activity-'+use.id,target:use.target,activity:use.phase==='walking'?'going to '+labelObject(use.label):use.object.userData.officeTask?.activity||VERB[use.kind]+' '+labelObject(use.label)};
 }
 return {plan,release,stateFor:person=>active.get(person),dispose(){for(const person of [...active.keys()])release(person,0);nextScan.clear();recent.clear();}};
}
