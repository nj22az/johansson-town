import {pierFishOfItem} from '../world/okinawa/fish.js';
import {sitOnStand,standUpFromStand,seatedOn} from './stand-seat.js';
import {TOWN_DESTINATIONS} from '../world/town-grid.js';
import {soberUp} from './drunk.js';
import {ONSEN_DOOR,ONSEN_ENTRY_RADIUS} from '../world/onsen-layout.js';
import {RAMEN_DOOR,IZAKAYA_DOOR} from './social.js';
import {homeRoutine} from './home-life.js';
import {residentPlan,NIGHT_PATROL} from './social.js';
import {VOICE_LINES} from './voice-lines.js';
import {createNavigation} from './navmesh.js?snappy=1';
import {groundHeight} from '../world/layout.js?snappy=1';
import {PROFILES} from './profiles.js';
import {RESIDENTS,HOME_OWNERS,residentHomeDescription} from './residents.js';
import {BUS_STATION} from '../world/bus-station.js';
import {transitStop,awayPlace} from '../world/transit.js';
import {ferryWords} from './social.js';
import {thuanHasCommutePriority,yieldAsideTarget,commuteCrowdRadii,residentCommitted} from './thuan-commute-yield.js';
import {STAFF_BENCH} from '../world/staff-bench.js';
import {MARKET_THRESHOLD} from '../world/town-grid.js';
import {createStaffBenchRoutine} from './staff-bench-routine.js';
import {commuterPhase,townPhase} from './commuter-schedule.js';
import * as THREE from '../../vendor/three.module.js';
import {alignedStep,forwardOnly,travelError,travelYaw} from './facing.js';
import {umbrellaColourFor,wantsUmbrella} from '../avatars/umbrella.js';
import {DOOR_POINT as KITAHAMA_SHOP_DOOR} from '../world/okinawa/kitahama-shop.js';
const HOME_RESIDENT_NAMES=new Set(HOME_OWNERS.map(p=>p.name));
/** How close a walker comes to a stand point or a quay spot before standing on it (stand-points.js). */
const STAND_STOP=.12;
/**
 * On a stand point (stand-points.js) or a claimed quay spot (quay-breaks.js): turn to its facing at a walker's turning
 * pace, then take its pose and tool; off it, put down only what this set (another controller's pose is left alone).
 */
function standOnPoint(g,stand,dt){
 const u=g.userData;
 if(stand){
  const diff=Math.atan2(Math.sin(stand.yaw-g.rotation.y),Math.cos(stand.yaw-g.rotation.y));
  g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,diff));
  if(Math.abs(diff)<.05){u.socialPose=stand.pose||'Idle';if(stand.tool)u.tool=stand.tool;else delete u.tool;u.standPose=true;sitOnStand(g,stand);}
  return;
 }
 standUpFromStand(g);
 if(u.standPose){delete u.socialPose;delete u.tool;delete u.standPose;}
}

export const DIALOGUE={
 Thuan:[['hello',"Welcome.\nWelcome to Sakura Shōten. Take your time; the kettle has only just boiled."],['pink',"This shirt is my favorite.\nThis yellow flower set is my favourite. My aunt says the shop is easier to find when I stand outside."],['work',"Afternoon stocking has finished.\nThe afternoon shelves are ready. Cold tea is in the cooler; postcards are beside the biscuits."],['harbour',"Would you like to take a walk to the port?\nWalking to the harbour? The light turns the water pink just before supper."],['catalogue',"Click here for the order form.\nThe mail-order book is on the counter. I keep those orders separate from the daily till."]],
 Nhung:[['books','The Swedish engineer keeps leaving historical novels here as if they were spare parts.'],['shelf','Six books. The shelf has requested a structural assessment.'],['century','Which century did you like? The seventeenth leaks through the shutters.','book'],['job','So he does have a real job. I assumed he only wrote about captains.','cv'],['cat','Tama has not read them. He reviews the binding by sleeping on it.'],['rain','Please leave the rain outside. The histories have enough disasters.'],['chair','The window chair is free. Twenty seconds of peace is an excellent bargain.'],['water','The harbour office tray is towards the water. Documents, not treasure.']],
 Chin:[['delivery','The morning round is parcels for half the arcade, and every one of them is heavier than it looks.'],['folio','Harbour office tray, unless the wind took it. Look for the blue tape.'],['game','One perfect Star Port run and I will show you the workshop. No charge for directions.'],['book','I delivered those books. My back now has a historical perspective.','book'],['part','A keychain without keys. Sensible. Nothing to lose yet.','keychain'],['map','Our repair bench is in the electrical workshop on the western quay, beside the warehouse.'],['weather','Rain is just the harbour making a delivery inland.'],['model','Don’t drop it. We’re inside.']],
 'Mrs Sato':[['stock','I sell many useful things. You seem determined to pick up paper.'],['shifts','The ramen counter keeps its own timetable. I arrive before the lunch rush and stay until the last bowl.'],['bligh','A captain is easier to judge from a dry chair.','bligh'],['fish','That fish is not becoming fresher while we discuss it.'],['food','Umeboshi rice ball. Eighty yen. Twenty seconds of renewed purpose.'],['book','Six books? He should charge by the kilogram.'],['weather','The noren is not an umbrella. Visitors continue to test this.'],['home','Leave things where you found them. A town runs on this small miracle.']],
 // Jack Reed (docs/CAST-CONSOLIDATION.md §4): the harbour agent, an American former merchant seaman, thirty years on this quay.
 'Harbour master':[['jack','Jack Reed. Paid off a freighter in Naha in sixty-six, meant to stay a month. The berth, the radio and the shore end of every line are mine; the sea can keep the rest.'],['lines','When she calls I walk out to the bitts myself. A line handed over properly is a line you do not hear about afterwards.'],['obvious','Did you check the obvious thing twice? Good. Now check the connector.'],['folio','It is a document, not a relic. Put it back in the tray.'],['pattern','I still prefer a wooden pattern and a sharp pencil.','keychain'],['bligh','Read the Bligh paper? Command is not the same thing as shouting.','bligh'],['commission','Commissioning: prove it works before everyone goes home.'],['diagnostics','A useful fault report begins with what happened. Not what you hoped happened.'],['tide','The tide has not read the work order. Allow for this.'],['radio','Harbour Service, 82.1. Clear instructions. Mostly clear reception.']],
 'Cold-storage kid':[['ice','Ice. Twenty yen. Briefly solid.'],['books','The Swedish books weigh more than the fish.'],['paper','The Bligh paper is dry. That is already a good voyage.','bligh'],['key','That blank could label the freezer key. We have lost the label twice.','keychain'],['shift','Night shift. The fish keep very unsociable hours.'],['home','Go home before you smell like your work.']]
};
for(const archived of PROFILES){
 const p=RESIDENTS.find(p=>p.name===archived.name)||archived;
 const personal=[['hello',p.hello],['friends',p.gossip],['discovery',p.clue],['home',residentHomeDescription(p.name)||'I live at '+p.homeAddress+'.']];
 DIALOGUE[p.name]=[...personal,...(DIALOGUE[p.name]||[])];
}
// Chin's own voice: friendly 1980s American slang, still grounded in his job.
DIALOGUE.Chin=[
 ['hello','Yo, bro! How’s it going? Just keeping this old workshop running.'],
 ['delivery','Parcels for the whole arcade, bro. Half of them are books. My back keeps a list.'],
 ['folio','Yo, bro, try the harbour office tray. Blue tape on the folder. Can’t miss it.'],
 ['game','One clean Star Port run? That’s totally rad. Then I’ll show you the workshop.'],
 ['book','Dude, I hauled those books over here. My back’s still talking about it.','book'],
 ['part','Check it out, bro. A keychain blank, ready for your own design.','keychain'],
 ['map','Workshop’s that way, dude. I’ll walk you over if you’ve earned the tour.'],
 ['weather','Bummer. Rain again. Good day to fix something indoors, huh?'],
 ['model','Easy, bro. That prototype took all afternoon.'],
 ['friends','Tetsuo’s got the electronics covered. Me? I handle the parts that need a proper wrench.'],
 ['discovery','Hey, bro, ask the harbour master about that waterlogged folder.'],
 ['home',residentHomeDescription('Chin')+' After supper I put the tools away and kick back.']
];
DIALOGUE.Thuan.push(['home',residentHomeDescription('Thuan')+' The plants by the shop stay here overnight.']);
// Apply the recorded clips last: a later rewrite of a resident's lines must not
// leave a published subtitle disagreeing with the audio it plays.
for(const clip of VOICE_LINES){const row=DIALOGUE[clip.resident]?.find(row=>row[0]===clip.topic);if(row){row[1]=clip.en;row[3]=null;}} // Retire Japanese-only recordings in the English game.
export function createCastAI({world,player,state,paused,collides,getObserverPosition=()=>player.position,activities=null,attends=()=>true,detourRetryMinutes=0}){
 // Keep scheduled targets off the forest bus road and painted coyote-tunnel mouth.
 // WalkFix owns how they walk there; we only refuse the arch as a stand/queue point.
 //
 // The bus's own door is the exception, and it is applied after this: the bus stands
 // at the arch now and is boarded there, so the one thing north of the platform that
 // anybody is allowed to walk to is the bus itself. Nobody is spawned there, and
 // nobody is sent there when there is no bus in it.
 const clearOfTunnelMouth=target=>{
  if(!target||!Number.isFinite(target[0])||!Number.isFinite(target[1]))return target;
  // The island has no bus road or tunnel mouth to keep people off.
  return target;
  return [...BUS_STATION.platform];
 };
 const patrol=NIGHT_PATROL;
 const navigation=createNavigation(collides),routes=new Map(),destinations=new Map(),initialised=new Set(),patrols=new Map();let clockMinutes=1002;
 // Visiting workers use the ferry; residents with playable homes sleep here.
 const commuterMode=profile=>!profile||!HOME_RESIDENT_NAMES.has(profile.name);
 for(const person of world.people)person.g.userData.scheduled=true;
 const thuan=world.people.find(p=>p.profile?.name==='Thuan');
 const staffBreak=thuan&&world.staffBench?createStaffBenchRoutine({entity:thuan.g,seat:world.staffBench.seat,isOccupied:()=>{
  const p=getObserverPosition();return p&&Math.hypot(p.x-STAFF_BENCH.seat[0],p.z-STAFF_BENCH.seat[1])<.9;
 }}):null;
 const thuanCommutePriority=()=>thuanHasCommutePriority(thuan?.g,thuan?townPhase(thuan.profile,clockMinutes):null);
 const yieldAsideForThuan=person=>{
  if(person===thuan||!thuanCommutePriority())return null;
  const tg=thuan.g,g=person.g;
  // Buying soda, eating, serving, sitting and other authored activities win right
  // of way. Thuan sees the resident as a solid obstacle and finds another line.
  if(residentCommitted(g))return null;
  if(g.userData.indoors||g.userData.inMarket||g.userData.inIzakaya||g.userData.inRamen||g.userData.inOnsen||g.userData.inHome)return null;
  const point=yieldAsideTarget([g.position.x,g.position.z],[tg.position.x,tg.position.z],tg.rotation.y,
   (x,z)=>collides(x,z,.32),(x,z)=>Math.abs(groundHeight(x,z)-g.position.y)<.45);
  return point?clearOfTunnelMouth(point):null;
 };
 // 'paper': Nhung's evenings at the back bench of the old Front-Row shop (social.js AFTER_WORK), indoors behind its door.
 const indoorDoor=(profile,place)=>place==='bookshop'||place==='paper'?TOWN_DESTINATIONS.books:place==='home'?profile.home:place==='market'?MARKET_THRESHOLD:place==='ramen'?RAMEN_DOOR:place==='izakaya'?IZAKAYA_DOOR:place==='onsen'?ONSEN_DOOR:place==='kitahama-shop'?KITAHAMA_SHOP_DOOR:place==='bus'?transitStop().queue:place==='work'&&profile.workSite?profile.work:null;
 function destination(person,target,tag){
  const key=person.g.userData.name+'/'+tag+'/'+target.join(',');if(destinations.has(key))return destinations.get(key);
  for(let radius=0;radius<=10;radius+=.85)for(let i=0;i<(radius?24:1);i++){
   const a=i/24*Math.PI*2,point=[target[0]+Math.cos(a)*radius,target[1]+Math.sin(a)*radius];
   if(collides(...point,.32)||[...destinations.values()].some(p=>Math.hypot(point[0]-p[0],point[1]-p[1])<.85))continue;
   destinations.set(key,point);return point;
  }return target;
 }
 function faceStep(g,dx,dz,dt,turnRate=2.6){
  const heading=travelYaw(dx,dz),delta=travelError(g.rotation.y,dx,dz);
  g.rotation.y+=THREE.MathUtils.clamp(delta,-turnRate*dt,turnRate*dt);
  return forwardOnly(g.rotation.y,dx,dz);
 }
 /** `points` without its first point when the walker at `at` is already nearer the second than the first is (the first
  *  is behind her or beside her) and the straight way to the second is clear. */
 const passed=(points,at)=>{
  if(points.length<2)return points;const [ax,az]=points[0],[bx,bz]=points[1],run=Math.hypot(bx-at.x,bz-at.z);
  if(run>Math.hypot(bx-ax,bz-az))return points;
  for(let t=0;t<=run;t+=.1){const k=t/run;if(collides(at.x+(bx-at.x)*k,at.z+(bz-at.z)*k,.3))return points;}
  return points.slice(1);
 };
 function move(person,target,dt,tag,pace=0,stopAt=0){const g=person.g,arrival=stopAt||(tag==='onsen'?ONSEN_ENTRY_RADIUS:person===thuan&&tag==='nap'?STAFF_BENCH.approachRadius:.7);if(Math.hypot(g.position.x-target[0],g.position.z-target[1])<arrival)return;
  // Somebody standing inside a collider can never leave it. Every step out of one is
  // still in one, so the walker refuses all of them -- and the route it would have
  // followed comes back empty anyway, because the path starts in an obstacle. Getting
  // up off the staff bench did exactly this, and she played out the rest of her day
  // from inside the bench. So before anything else: if the ground underfoot is already
  // blocked, walk whichever way has the most room, which can only be out.
  if(collides(g.position.x,g.position.z,.3)){
   // The nearest direction with room to stand in, searched outwards. A probe close in
   // is no use: clearing a bench means getting a body's width past it, so half a metre
   // of looking finds nothing and decides there is nowhere to go.
   let escape=null;
   for(const reach of [.35,.7,1.05,1.4,1.75]){
    for(let i=0;i<8;i++){
     const angle=i*Math.PI/4,px=g.position.x+Math.sin(angle)*reach,pz=g.position.z+Math.cos(angle)*reach;
     if(collides(px,pz,.3)||Math.abs(groundHeight(px,pz)-g.position.y)>.4)continue;
     escape=angle;break;
    }
    if(escape!==null)break;
   }
   if(escape!==null){
    const escapeDx=Math.sin(escape),escapeDz=Math.cos(escape);
    const escapeHeading=Math.atan2(-escapeDx,-escapeDz);
    const escapeAngle=Math.atan2(Math.sin(escapeHeading-g.rotation.y),Math.cos(escapeHeading-g.rotation.y));
    if(!faceStep(g,escapeDx,escapeDz,dt))return;
    // The step itself is not collision-checked, because every step from in here fails
    // that check -- that is the whole problem. Worst case it crosses something thin on
    // the way out, which beats standing in a bench until the end of the day.
    const out=Math.min(.4,dt*(person===thuan?.9:2.4)*alignedStep(escapeAngle));
    if(out<=0)return;
    const x=g.position.x+escapeDx*out,z=g.position.z+escapeDz*out;
    g.position.set(x,groundHeight(x,z),z);routes.delete(g);
   }
   return;
  }
  let route=routes.get(g);if(!route||route.tag!==tag){route={tag,points:navigation.path(g.position,{x:target[0],z:target[1]}),at:0,stalled:0,checkpoint:g.position.clone()};routes.set(g,route);}
  route.stalled+=dt;
  if(g.position.distanceTo(route.checkpoint)>1){route.stalled=0;route.checkpoint.copy(g.position);}
  // Held up by a wall, give it three seconds; held up by a person right in front of you,
  // step round them after one, the way people do on a pavement. Only one of the two steps round at once: the one
  // whose name sorts first goes after a second, the other holds for two and a half and then goes too if they are
  // still face to face. Two walkers who both stepped round at the same moment mirrored each other's detour and danced
  // on the kerb for the rest of the evening (Thuan and Tetsuo at Main Street, on the way to the izakaya).
  const facing=route.stalled>1?world.people.find(p=>p.g!==g&&p.g.visible&&!p.g.userData.indoors&&Math.hypot(p.g.position.x-g.position.x,p.g.position.z-g.position.z)<.9):null;
  const faceToFace=!!facing&&(route.stalled>2.5||String(person.profile?.name||'')<String(facing.profile?.name||''));
  // The web edition (edition.js detourRetryMinutes): a walker whose detour search found no way round keeps still for a
  // while instead of searching again every three seconds (a 200 ms search each time, for nothing).
  if((route.stalled>3||faceToFace)&&route.noDetourUntil>clockMinutes){route.stalled=0;route.checkpoint.copy(g.position);}
  else if(route.stalled>3||faceToFace){
   const obstacles=world.people.filter(p=>p.g!==g&&!p.g.userData.indoors&&!p.g.userData.inIzakaya&&!p.g.userData.inOnsen&&!p.g.userData.inMarket&&!p.g.userData.inRamen&&!p.g.userData.inHome).map(p=>p.g.position.clone());
   // Somebody already standing within the margin must not wall off the start of the
   // detour: a point is only refused for being nearer them than the walker is now, so
   // the way round is open. Refusing every point in the margin left two people who met
   // head-on with no detour at all, and they stood nose to nose for the rest of the hour.
   const hx=g.position.x,hz=g.position.z;
   const detour=createNavigation((x,z,r)=>collides(x,z,r)||obstacles.some(o=>{const d=Math.hypot(x-o.x,z-o.z);return d<r+.34&&d<Math.hypot(hx-o.x,hz-o.z)-.01;}));
   // The search starts on the grid point nearest the walker, which is often behind her: a walker replanning on the move
   // turned round to it, walked back, turned round again, and was stalled once more before she had gone a metre, so the
   // next detour sent her back again (Thuan in the yard behind Sakura, walking back from her break, for the rest of the
   // afternoon). A first point she has already passed is left out when the way to the next is clear.
   const points=passed(detour.path(g.position,{x:target[0],z:target[1]}),g.position);
   if(points.length){route.points=points;route.at=0;}else if(detourRetryMinutes)route.noDetourUntil=clockMinutes+detourRetryMinutes;route.stalled=0;route.checkpoint.copy(g.position);
  }
  const goal=route.points[route.at];if(!goal)return;const dx=goal[0]-g.position.x,dz=goal[1]-g.position.z,d=Math.hypot(dx,dz);if(d<Math.min(.16,arrival)){route.at++;return;}
  // A leg may ask for its own pace: an afternoon by the sea is not an errand.
  // Forward-only turns cost a little travel time at every corner. Thuan recovers it
  // on the straight instead of stealing it by sliding while still turned aside.
  const paceLimit=pace||(person===thuan?1.4:person.profile?.age>65?.75:1.25);
  const speed=person===thuan?Math.min(paceLimit,(route.speed||0)+dt*1.8):paceLimit;
  const step=Math.min(d,dt*speed),nx=g.position.x+dx/d*step,nz=g.position.z+dz/d*step;
  const clearOfPeople=(x,z)=>world.people.every(p=>{
   if(p.g===g||p.g.userData.indoors||p.g.userData.inIzakaya||p.g.userData.inOnsen||p.g.userData.inMarket||p.g.userData.inRamen||p.g.userData.inHome||p.g.userData.inWorkplace)return true;
   const old=Math.hypot(p.g.position.x-g.position.x,p.g.position.z-g.position.z),next=Math.hypot(p.g.position.x-x,p.g.position.z-z);
   // Thuan commute priority: others treat her as a wide impassable; she may ease past them
   // while they yield (sidestep below). Does not change faceStep / alignedStep.
   if(thuanCommutePriority()){
    if(person===thuan&&p===thuan)return true;
    const radius=commuteCrowdRadii(person===thuan,p===thuan,residentCommitted(p.g));
    if(p===thuan||person===thuan)return next>=radius||(old<radius&&next>old+.00001);
   }
   return next>=.61||(old<.61&&next>old+.00001);
  });
  // Near the Konbini door, lateral sidesteps into the frontage collider read as a
  // glide/moonwalk through the opening. Prefer forward/axis probes only.
  const atMarketDoor=tag==='market'&&d<2.8;
  const candidates=atMarketDoor?[[nx,nz],[nx,g.position.z],[g.position.x,nz]]:[[nx,nz],[nx,g.position.z],[g.position.x,nz],[g.position.x-dz/d*step,g.position.z+dx/d*step],[g.position.x+dz/d*step,g.position.z-dx/d*step]];
  const beforeX=g.position.x,beforeZ=g.position.z;
  // A turn changes orientation, not progress along the street. Resetting the
  // stall clock on every forward candidate lets an actor alternate between a
  // blocked step and its sidestep forever, never reaching the detour planner.
  // The three-second allowance already leaves time for an ordinary turn.
  const turned=()=>{route.speed=0;};
  for(const [x,z] of candidates){
   if(Math.hypot(x-beforeX,z-beforeZ)<.000001)continue;
   // A slope is taken at its gradient; a kerb of a hand's height is stepped up in one go.
   // Match the navigation raster's 18 cm step allowance. A route over an
   // ordinary kerb must not be accepted by the planner and refused by the walker.
   if(!clearOfPeople(x,z)||collides(x,z,.3)||Math.abs(groundHeight(x,z)-g.position.y)>Math.max(step*.65+.025,.180001))continue;
   // Face the actual clear step, including a detour, before advancing. Turning after
   // translation lets the walk clip carry them backwards or sideways around corners.
   const stepDx=x-beforeX,stepDz=z-beforeZ;
   const stepHeading=travelYaw(stepDx,stepDz);
   const stepAngle=travelError(g.rotation.y,stepDx,stepDz);
   if(!faceStep(g,stepDx,stepDz,dt)){
    // A deliberate turn is progress, not a blockage. Replanning mid-turn can choose
    // a grid point behind them and make them turn back and forth without leaving it.
    turned();return;
   }
   // faceStep may have completed the last fraction of the turn this frame. Measure
   // alignment again after it, so translation always agrees with the rendered body.
   const travel=alignedStep(travelError(g.rotation.y,stepDx,stepDz));
   if(travel<=0){turned();return;}
   const ax=beforeX+stepDx*travel,az=beforeZ+stepDz*travel;
   if(travel<1&&(!clearOfPeople(ax,az)||collides(ax,az,.3))){
    turned();return;
   }
   g.position.set(ax,groundHeight(ax,az),az);route.speed=speed;break;
  }
  const movedX=g.position.x-beforeX,movedZ=g.position.z-beforeZ;
  // Facing during outdoor schedule walks is owned by faceStep above.
  if(Math.hypot(movedX,movedZ)<.0001)route.speed=0;
 }

 /**
  * The web edition's walk for somebody nobody can see (attention.js): they are where their day has them, on the
  * clear point their walk would have ended on, with no route searched and no step taken. False when the point is not
  * clear to stand on, and they walk there as on Linux. Never called on Linux.
  */
 function settle(g,target,tag){
  if(Math.hypot(g.position.x-target[0],g.position.z-target[1])<(tag==='onsen'?ONSEN_ENTRY_RADIUS*.5:.3)){routes.delete(g);return true;}
  // A target inside something (a threshold in a door's collider) is walked to as on Linux.
  if(collides(target[0],target[1],.3))return false;
  routes.delete(g);g.position.set(target[0],groundHeight(target[0],target[1]),target[1]);return true;
 }
 /** True while the Harbour Line is standing at the terminus with its doors to you. */
 const atTheStop=()=>{const run=world.ferry||world.bus;return !run||['waiting','turning'].includes(run.phase);};
 /**
  * Somebody who has been waiting has got on once the bus they were waiting for has
  * pulled away. Without the memory they would blink out the moment their shift ended
  * whenever the service happened to be up the road, which is the thing this replaces.
  */
 const seenAtStop=new WeakSet(),aboard=new WeakSet();
 // Queue places are handed out in the order people arrive at the stop and given back
 // when they board, so the queue does not grow a gap where somebody used to stand.
 const queued=new Map();
 /** Whether someone stepping aboard is nearer her deck (the doorway) than the queue on the pier they came from. */
 const nearerDeck=g=>{const run=world.ferry||world.bus;if(!run?.doorway)return false;const [dx,dz]=run.doorway,[qx,qz]=run.queueSpot(g.userData.busQueue??0);
  return Math.hypot(g.position.x-dx,g.position.z-dz)<Math.hypot(g.position.x-qx,g.position.z-qz);};
 const queueNumber=g=>{
  const taken=new Set(queued.values());
  let place=0;while(taken.has(place))place++;
  queued.set(g,place);return place;
 };
 function boarded(g){
  const run=world.ferry||world.bus;
  if(!run)return true;                                   // No service modelled: as before.
  // Somebody who has walked through the door is on it. Without this the hold put them
  // straight back on the pavement the frame after they got on, because the bus was
  // still standing there and "still standing there" used to mean "still boarding".
  if(aboard.has(g))return true;
  if(atTheStop()){seenAtStop.add(g);return false;}        // It is here; you are still getting on.
  return seenAtStop.has(g);                               // It has gone, and you were here for it.
 }
 /** The kerb beside the bus's own door, so people step off it rather than out of it. */
 // You get off where you would have got on: the door, at the front of the bus, on the
 // flank away from the carriageway. It used to be worked out as an offset from the bus
 // and pointed at the shelter, which stopped being behind the bus when the bus stopped
 // coming down to the shelter.
 const alightingPoint=()=>(world.ferry||world.bus)?.door||transitStop().arrival;
 return {
 replan({at=null,radius=12}={}){
  navigation.clearCache();if(!at){routes.clear();return;}
  const near=point=>point&&Math.hypot(point[0]-at[0],point[1]-at[1])<=radius;
  for(const p of world.people){const g=p.g;if(g.userData.standSeat)continue;
   const route=routes.get(g),target=residentPlan(p.profile,clockMinutes,false,state())?.target;
   if(near([g.position.x,g.position.z])||near(target)||route?.points?.some(near))routes.delete(g);
  }
 },
 update(dt,minutes,rain){if(paused())return;
  // Drink wears off on the town clock for everyone (drunk.js), wherever they are.
  const passed=Number.isFinite(clockMinutes)?minutes-clockMinutes:0;
  if(passed>0)for(const p of world.people){const u=p.g?.userData;if(u?.tipsy)u.tipsy=soberUp(u.tipsy,passed);}
  clockMinutes=minutes;const minute=((minutes%1440)+1440)%1440,transit=commuterMode(),day=Math.floor(minutes/1440);
  const outside=[];
  for(const p of world.people){const v=p.profile;if(!v)continue;const g=p.g;
   if(g.userData.playerControlled){outside.push(p);continue;}
   if(p===thuan&&staffBreak?.active){
    staffBreak.update(dt,residentPlan(v,minutes,rain,state(),transit).place==='nap');
    routes.delete(g);outside.push(p);continue;
   }
   if(g.userData.inVehicle||g.userData.ferryPassenger||g.userData.inBookshop||g.userData.inWorkplace||g.userData.inIzakaya||g.userData.inOnsen||g.userData.inMarket||g.userData.inRamen||g.userData.inHome)continue;
   // The ferry's shore line hand (people/ferry-shore-crew.js) walks this body to the bitts and back; the street yields it,
   // and whatever it was using (a bench, the phone) is given up first.
   if(g.userData.ferryShoreTask){activities?.release?.(p,minutes);routes.delete(g);continue;}
   const scheduled=residentPlan(v,minutes,rain,state(),transit);
   // The calendar can keep a commuter home for a whole weekend, even during their
   // ordinary shift hours. Their actual presence must follow that plan too.
   const phase=commuterMode(v)?scheduled.place==='away'?'away':townPhase(v,minutes,rain):'town';
   // They leave on the bus, not by ceasing to exist at the kerb. While the service is
   // somewhere up the road they wait in the queue, and they only go once there has
   // been a bus standing there for them to go in.
   // Somebody who was already away when the game loaded is away.
   //
   // The hold below exists so that nobody blinks out at the kerb while you are
   // watching them, and there is nothing to preserve for a person you have never seen.
   // Held from the first frame, they spawn on the plan's target instead -- which for
   // 'away' is the far end of the bus road -- and stand in a clump at the mouth of the
   // tunnel until the next service, which is now as much as two and a half hours.
   if(transit&&phase==='away'&&!initialised.has(g))seenAtStop.add(g);
   const holdForBus=transit&&phase==='away'&&initialised.has(g)&&!boarded(g);
   if(transit&&phase==='away'&&!holdForBus){g.visible=false;delete g.userData.indoors;delete g.userData.usingTownObject;g.userData.place='away';g.userData.activity=awayPlace(v.name);g.userData.commuterAwayDay=day;routes.delete(g);continue;}
   // Coming back is the same in reverse: nobody is put down on the platform until the
   // bus they would have been on is at it.
   if(transit&&phase==='arriving'&&(!g.visible||g.userData.commuterAwayDay===day)){
    if(!atTheStop())continue;
    const step=alightingPoint();
    g.position.set(step[0],groundHeight(step[0],step[1]),step[1]);g.visible=true;
    aboard.delete(g);delete g.userData.commuterAwayDay;routes.delete(g);
   }
   const plan=activities?.plan(p,scheduled,minutes,rain,dt)||scheduled;let target=clearOfTunnelMouth(plan.target),tag=plan.place;
   g.userData.place=plan.place;g.userData.activity=plan.activity;delete g.userData.justArrived;
   // Still on the platform: the plan has written them off as away, so put them back in
   // the queue rather than sending them walking up the bus road on foot.
   if(holdForBus){g.visible=true;target=transitStop().queue;tag='bus';g.userData.place='bus';g.userData.activity='waiting for the ferry';}
   // The bus stands at the arch, not at the shelter, so that is where it is boarded --
   // and they set off for it as soon as they are going, rather than waiting on the
   // platform for it to show and then having twelve metres of road to cover in the
   // time it stands there. They wait at the door instead, which is where you wait for
   // a bus that only stops in one place.
   if(transit&&tag==='bus'&&(world.ferry||world.bus)&&phase!=='arriving'){
    // Each of them gets their own place in the queue: the same door for everybody put
    // the whole evening shift in one another's coats on the kerb.
    if(!Number.isFinite(g.userData.busQueue))g.userData.busQueue=queueNumber(g);
    target=(world.ferry||world.bus).queueSpot(g.userData.busQueue);
   }
   if(tag==='patrol'){
    let index=patrols.get(g)||0;
    if(Math.hypot(g.position.x-patrol[index][0],g.position.z-patrol[index][1])<.85)index=(index+1)%patrol.length;
    patrols.set(g,index);target=patrol[index];tag='patrol-'+index;
   }
   if(v.name==='Chin'&&state().kenjiEscort==='walking'){
    target=TOWN_DESTINATIONS.workshop;tag='escort';g.userData.activity='showing the workshop';
    if(Math.hypot(g.position.x-target[0],g.position.z-target[1])<1)state().kenjiEscort='done';
   }
   // Venue thresholds must not be displaced by generic crowd spacing.
   // A stand point or a claimed quay spot (plan.stand) is its own mark, measured and held: never spread for the crowd.
   if(!plan.stand&&!(tag==='work'&&v.workSite)&&!['home','bookshop','paper','izakaya','ramen','market','onsen','kitahama-shop','bus','station','nap'].includes(tag)&&!tag.startsWith('patrol')&&!tag.startsWith('town-activity'))target=destination(p,target,tag);
   // Each stand point is its own leg, so the walk is planned again from one to the next.
   if(plan.stand&&Number.isFinite(plan.stand.index))tag+='-'+plan.stand.index;
   if(!initialised.has(g)){
    initialised.add(g);
    const remembered=state().residentLocations?.[v.name],valid=remembered&&Array.isArray(remembered.position)&&remembered.position.length===2&&remembered.position.every(Number.isFinite)&&Math.abs(remembered.position[0])<300&&Math.abs(remembered.position[1])<300;
    // Indoor saves name a place, whose threshold may have moved since saving.
    // If its schedule has changed, the resident leaves that door and walks onward.
    const rememberedDoor=remembered?.indoors==='home'&&!HOME_RESIDENT_NAMES.has(v.name)?null:indoorDoor(v,remembered?.indoors),savedWalk=valid&&remembered.place!=='away'&&!commuterMode(v)&&!collides(...remembered.position,.32);
    const spawn=rememberedDoor||(savedWalk?clearOfTunnelMouth(remembered.position):transit&&phase==='arriving'?transitStop().arrival:clearOfTunnelMouth(target));
    delete g.userData.indoors;
    if(rememberedDoor)g.userData.indoors=remembered.indoors;
    else if(!savedWalk&&indoorDoor(v,tag))g.userData.indoors=tag;
    // Everybody restored from the same saved waypoint used to arrive in one another's
    // coats, and the crowd rule cannot separate bodies that start in the same place:
    // it only lets a step through when it increases the gap, and three people walking
    // the same way keep the gap at nothing. So they are set down a pace apart.
    const place=Number.isFinite(g.userData.busQueue)?g.userData.busQueue:0;
    const settle=place?[spawn[0]-(place%2)*.72,spawn[1]-Math.floor(place/2)*.95]:spawn;
    g.position.set(settle[0],groundHeight(...settle),settle[1]);
   }
   if(g.userData.indoors&&g.userData.indoors!==tag){delete g.userData.indoors;routes.delete(g);}
   if(p===thuan&&tag==='nap'&&staffBreak?.update(dt,true)){routes.delete(g);outside.push(p);continue;}
   const indoor=['home','bookshop','paper','izakaya','ramen','market','onsen','kitahama-shop'].includes(tag)||tag==='work'&&v.workSite;
   const arrived=()=>Math.hypot(g.position.x-target[0],g.position.z-target[1])<(tag==='onsen'?ONSEN_ENTRY_RADIUS:.85);
   const yieldTarget=p!==thuan?yieldAsideForThuan(p):null;
   if(yieldTarget){
    // Idle chats must not pin someone in Thuan's morning path.
    delete g.userData.chatHold;delete g.userData.chat;
    g.userData.activity='making way for Thuan';
    move(p,yieldTarget,dt,'yield-thuan');
   }else if(!g.userData.indoors&&!g.userData.usingTownObject&&!g.userData.chatHold&&!(g.userData.facePlayerUntil>performance.now())&&!(tag==='escort'&&g.position.distanceTo(player.position)>6)){
    // Unseen and out of reach on the web (people/attention.js), they keep the timetable without walking it.
    if(!seatedOn(g,plan.stand)&&(attends(g)||!settle(g,target,tag)))move(p,target,dt,tag,plan.pace,plan.stand?STAND_STOP:0);
   }
   standOnPoint(g,plan.stand&&!yieldTarget&&!g.userData.usingTownObject&&!g.userData.chatHold&&(seatedOn(g,plan.stand)||Math.hypot(g.position.x-target[0],g.position.z-target[1])<STAND_STOP+.02)?plan.stand:null,dt);
   // Playing (social.js sistersAtPlay): once both are there, they turn to each other,
   // keep their eyes on each other and play; until then, whoever is first waits.
   const partner=plan.play?world.people.find(q=>q.profile?.name===plan.play):null;
   if(partner&&arrived()&&Math.hypot(partner.g.position.x-g.position.x,partner.g.position.z-g.position.z)<2.6){
    g.userData.socialPose='Janken';g.userData.playing=plan.play;
    const yaw=Math.atan2(g.position.x-partner.g.position.x,g.position.z-partner.g.position.z);
    g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*(1-Math.exp(-dt*6));
    g.userData.lookTarget=[partner.g.position.x,partner.g.position.y+1.3,partner.g.position.z];g.userData.lookSource='play';
   }else if(g.userData.playing){delete g.userData.playing;if(g.userData.socialPose==='Janken')delete g.userData.socialPose;if(g.userData.lookSource==='play'){delete g.userData.lookTarget;delete g.userData.lookSource;}}
   // A passenger caught halfway through the step when the bus goes is put back on
   // their feet, rather than left holding a hand on a door that is not there.
   // On her gangway when it closes (the timetable does not wait, world/ferry-timetable.js): the nearer end. Nearer the
   // deck, the last step aboard is taken; nearer the pier, they step back off it and wait for the next boat.
   const stepping=g.userData.boarding&&transit&&tag==='bus'&&!(world.ferry||world.bus)?.boarding&&nearerDeck(g);
   if(g.userData.boarding&&!stepping&&!(transit&&tag==='bus'&&(world.ferry||world.bus)?.boarding)){
    delete g.userData.boarding;delete g.userData.usingTownObject;
   }
   // Getting on, rather than ceasing to exist at the kerb. The last two metres are
   // walked by hand because the inside of a bus is inside the bus's own collider and
   // the walker will not take a step into one.
   //
   // Either still inside their departing window, or past it and held at the door for
   // the bus they are plainly waiting for. Asking only for 'departing' meant the one
   // person whose departure time had come and gone -- which is everybody, by the time
   // the bus they are catching is standing there -- never got on it.
   if(transit&&tag==='bus'&&(stepping||(phase==='departing'||holdForBus)&&(world.ferry||world.bus)?.boarding&&(g.userData.boarding||arrived()))){
    const [insideX,insideZ]=(world.ferry||world.bus).doorway;
    g.userData.boarding=true;g.userData.usingTownObject=true;
    g.userData.activity='going aboard the ferry';
    const dx=insideX-g.position.x,dz=insideZ-g.position.z,reach=Math.hypot(dx,dz);
    if(reach>.3){
     const step=Math.min(reach,dt*1.1);
     g.position.x+=dx/reach*step;g.position.z+=dz/reach*step;
     g.rotation.y=Math.atan2(-dx,-dz);
     outside.push(p);continue;
    }
    world.busStation?.board(v.name,minutes);aboard.add(g);
    queued.delete(g);delete g.userData.busQueue;
    delete g.userData.boarding;delete g.userData.usingTownObject;
    g.userData.commuterAwayDay=day;g.userData.place='away';g.userData.activity=ferryWords('left by bus');
    g.visible=false;routes.delete(g);continue;
   }
   if(indoor&&(g.userData.indoors===tag||arrived())){
    if(!g.userData.indoors)g.userData.justArrived=true;
    g.userData.indoors=tag;g.visible=false;routes.delete(g);
    g.userData.activity=tag==='home'?homeRoutine(v,minutes).activity+' at home':plan.activity;
   }else outside.push(p);
   const home=world.homes?.get(v.name);if(home)home.occupied=g.userData.indoors==='home';
  }
  // Ten distinct low-poly residents remain present; camera rank cannot hide a neighbour.
  outside.forEach(p=>{if(!(transit&&p.g.userData.commuterAwayDay===day))p.g.visible=true;});world.updateHomes?.(minutes);
  // In the rain, everyone out in the street has an umbrella up (avatars/umbrella.js); it folds away indoors.
  for(const p of world.people){const u=p.g?.userData;if(!u)continue;
   const up=p.g.visible&&wantsUmbrella(u,rain);
   if(up)u.umbrella=umbrellaColourFor(p.profile?.name,p.profile?.age).canopy;else delete u.umbrella;}
  if(world.cat){const s=state();const spots=[TOWN_DESTINATIONS.books,[-4,-18],TOWN_DESTINATIONS.pier];let target=spots[minute<600?0:minute<1080?1:2];if(s.quest===3)target=spots[0];else if(s.quest===1)target=spots[1];if(s.quest===2||s.inventory.some(pierFishOfItem))target=[player.position.x+.8,player.position.z+.8];move({g:world.cat},target,dt,'cat-'+Math.round(target[0]/3)+'-'+Math.round(target[1]/3));}
 },snapshot(){return Object.fromEntries(world.people.map(p=>{const g=p.g,inside=g.userData.indoors,phase=commuterMode(p.profile)?commuterPhase(p.profile,clockMinutes):'town',target=phase==='away'?transitStop().exit:indoorDoor(p.profile,inside);return [p.profile.name,{position:target?[...target]:[g.position.x,g.position.z],indoors:target&&phase!=='away'?inside:null,place:phase==='away'?'away':g.userData.place}];}));},pose(){}};
}
