import {createVehicleDrivers} from '../people/vehicle-driver.js';
import * as THREE from '../../vendor/three.module.js';
import {createRoadNetwork,createTraffic,makeLane,syncVehicleCollider} from './road-network.js';
import {groundTopAt,MAIN_QUAY_TOP} from './ground-plan-harbour.js';
import {GROUND_CLASSES} from './ground-standard.js';
/** Where a wheel stands: on Main Street's and the quays' laid ground, else on the town's road level. */
const wheelsAt=(x,z)=>groundTopAt(x,z)??GROUND_CLASSES.road.top;
import {buildVehicle,VEHICLE_SIZE} from './road-vehicles.js';
import {MAIN_ROAD,MAIN_SERVICE_COURT} from './main-road.js';
import {FERRY,FERRY_BERTH} from './ferry.js';
import {FERRY_RAMP,FERRY_DECKS,FERRY_HULL} from './ferry-model.js';
import {MINATO_BERTH} from './minato-berth.js';
import {AIRPORT_FERRY_PORTS} from './airport-ferry.js';
import {SEA_LEVEL} from './ocean.js';
import {AIRPORT_ISLAND} from './airport-island.js';
import {AIRPORT_HEIGHT,airportWorld} from './airport-ground.js';
import {AIRPORT_VEHICLE_YARD as Y,airportVehiclePoint,airportVehicleBay} from './airport-vehicle-yard.js';
import {buildWheelSecuring} from './ferry-vehicle-securing.js';
import {townCalendarAt} from '../town-clock.js';

/** Owned vehicles travel on Main Street, the quay and the airport cargo court.
 * A single car shares the ferry's open foredeck with its existing resident driver.
 */
const MAIN_NORTH_X=MAIN_ROAD.x+1.1,MAIN_SOUTH_X=MAIN_ROAD.x-1.1;
export const KITANO_STOP_S=5.2;
/**
 * The car place a crossing car takes: the aft place in the starboard lane, as a loader fills her (the far end of
 * a lane first, the starboard lane before the port one).
 */
const FIRST_PLACE=FERRY_DECKS.car.slots.find(([x])=>x<0);
export const FERRY_VEHICLE_DECK_X=FIRST_PLACE[0],FERRY_VEHICLE_DECK_Z=FIRST_PLACE[1];
/**
 * Her ramp's toe, in her frame, resting on a landing at `landing` (world): the leaf from the hinge at her stem down
 * (or up) to the landing, the flap flat beyond it (ferry-model.js restRamp).
 */
const rampFoot=landing=>{const drop=Math.max(-3.5,Math.min(3.5,SEA_LEVEL+FERRY_HULL.origin+FERRY_DECKS.car.y-landing-.05));return [0,FERRY_DECKS.car.y-drop,FERRY.length/2-.05+Math.sqrt(FERRY_RAMP.leaf**2-drop**2)];};
const rampToe=landing=>{const f=rampFoot(landing);return [0,f[1],f[2]+FERRY_RAMP.flap];};
/** Where the ramp's toe lies on Minato's quay (she lies heading north, so her frame's z is the world's). */
const MINATO_TOE_Z=FERRY_BERTH.z+rampToe(MINATO_BERTH.landing.top)[2];
/**
 * The islanders' home bays: Tetsuo's kei truck on the quay by the ferry ramp, where he loads
 * the workshop's cargo, and the harbour master's car in the Main Street lay-by by the
 * crossing to his office (main-road.js MAIN_PARKING_LAYBY). Both used to stand side by
 * side on the apron, the car 0.8 m from the waiting hall's canopy posts.
 */
// (The lay-by's bay is on its centre less 13 cm: the car, 2.3 m over its mirrors, stays clear of the lay-by's kerb.)
export const QUAY_BAYS=Object.freeze([[.3,-40.9],[.45,-29.75]].map(Object.freeze));
/** Which home bay is the lay-by: pulled into from the town-bound lane, left the same way. */
const LAYBY_BAY=1;
export const SERVICE_BAYS=Object.freeze([[-5.8,10],[-5.8,4.5]].map(Object.freeze));
/**
 * Boarding at Minato is a three-point turn, as a driver does it: down from Main Street, left onto
 * the open quay and stop, nose east (TOWN_FERRY_STAGE); then back round to the west on a 3 m arc
 * (about a kei truck's lock) onto the berth's centreline, and straight back down the ramp, so the
 * car rides nose to the bow and drives off forwards at the other end.
 */
// The backing arc from the stage ends on her ramp's flap, between its toe (MINATO_TOE_Z) and the leaf's foot.
const STAGE_TURN_R=2.6,BACK_TURN_R=3,STAGE_Z=-44.2;
export const TOWN_FERRY_STAGE=Object.freeze([MAIN_SOUTH_X+STAGE_TURN_R,MAIN_QUAY_TOP,STAGE_Z]);
/** The reversing path from the stage to the foot of the ramp. */
function townBackingPath(){
 const x=FERRY_BERTH.x,c=x+BACK_TURN_R,pts=[[...TOWN_FERRY_STAGE],[c,MAIN_QUAY_TOP,STAGE_Z]];
 for(let i=1;i<=24;i++){const a=Math.PI/2+i*(Math.PI/2)/24;pts.push([c+Math.cos(a)*BACK_TURN_R,MAIN_QUAY_TOP,STAGE_Z-BACK_TURN_R+Math.sin(a)*BACK_TURN_R]);}
 return pts;
}
function smooth(points,rounds=3){let p=points;for(let r=0;r<rounds;r++){const out=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];if(i>0)out.push(a.map((v,k)=>v*.75+b[k]*.25));if(i<p.length-2)out.push(a.map((v,k)=>v*.25+b[k]*.75));}out.push(p.at(-1));p=out;}return p;}
/**
 * A lane's points on the ground, the wheels on its top: Main Street's carriageway lies a kerb under the town's datum and
 * is graded back up at its ends and at Kitano Road's mouth, and the main quay lies 16 mm under it (ground-plan.js,
 * ground-plan-harbour.js), so the points are laid a metre apart at the level there.
 */
/** The delivery turn's loop: from z, out this far up the street and back. */
const TURN_LOOP=Object.freeze({z:14.5,reach:2.6});
const flat=pts=>{const out=[];pts.forEach(([x,z],i)=>{
 if(i){const [px,pz]=pts[i-1],n=Math.floor(Math.hypot(x-px,z-pz));for(let k=1;k<n;k++){const qx=px+(x-px)*k/n,qz=pz+(z-pz)*k/n;out.push([qx,wheelsAt(qx,qz),qz]);}}
 out.push([x,wheelsAt(x,z),z]);});return out;};
const airportPts=pts=>pts.map(([u,v])=>airportVehiclePoint(u,v));
export function buildTownNetwork(){
 const net=createRoadNetwork();
 net.add(makeLane('main-north',flat([[MAIN_NORTH_X,-33.5],[MAIN_NORTH_X,13.3]]),{speed:3.8}));
 net.add(makeLane('main-south',flat([[MAIN_SOUTH_X,1.5],[MAIN_SOUTH_X,-38.6]]),{speed:3.8}));
 // The delivery turn is a long loop up the street, not a pivot on the spot, so the van's corners stay on the road's
 // level: the turnout's east half is footway, with the bench, the post box and the cabinet on it (ground-plan.js).
 const TURN_Z=TURN_LOOP.z,turn=[];for(let i=0;i<=32;i++){const a=i*Math.PI/32;{const x=MAIN_ROAD.x+Math.cos(a)*1.1,z=TURN_Z+Math.sin(a)*TURN_LOOP.reach;turn.push([x,wheelsAt(x,z),z]);}}
 SERVICE_BAYS.forEach(([x,z],i)=>{const entry=smooth([[MAIN_SOUTH_X,TURN_Z],[MAIN_SOUTH_X,z+(i?3.3:5.5)],[x,z+(i?2:4.7)],[x,z]]);net.add(makeLane('service-in-'+i,[[MAIN_NORTH_X,wheelsAt(MAIN_NORTH_X,13.3),13.3],...turn,...flat(entry)],{speed:1.5}));net.add(makeLane('service-out-'+i,flat(smooth([[x,z],[x,z-1],[MAIN_SOUTH_X,z-2.3],[MAIN_SOUTH_X,1.5]])),{speed:2.2}));});
 QUAY_BAYS.forEach(([x,z],i)=>{
  if(i===LAYBY_BAY){
   // Off the ferry and straight up the town-bound lane into the lay-by on its left; out
   // the same way, along the lay-by's north end and back into the lane before its kerb.
   // Straightened onto the bay's line on the cargo driveway, before the lay-by's kerb begins (ground-plan.js).
   net.add(makeLane('quay-in-'+i,flat(smooth([[MAIN_NORTH_X,-39],[MAIN_NORTH_X,-37.4],[x,-35.4],[x,-32.6],[x,z]])),{speed:1.8}));
   // Out forwards along the lay-by, which runs on past the bay to its kerb's end (ground-plan.js), and onto the road.
   net.add(makeLane('quay-out-'+i,flat(smooth([[x,z],[x,-28.8],[-.4,-26.6],[MAIN_NORTH_X,-24.6],[MAIN_NORTH_X,-23.5]])),{speed:2}));
   net.add(makeLane('layby-north',flat([[MAIN_NORTH_X,-23.5],[MAIN_NORTH_X,13.3]]),{speed:3.8}));
   return;
  }
  net.add(makeLane('quay-out-'+i,flat(smooth([[x,z],[x,-34.8],[MAIN_NORTH_X+.3,-34.8],[MAIN_NORTH_X,-33.5]])),{speed:2}));
  net.add(makeLane('quay-in-'+i,flat(smooth([[MAIN_SOUTH_X,-39.4],[-2.7,-42.6],[-2.2,-45.6],[-.9,-46.7],[x,-45.7],[x,z]])),{speed:1.8}));
 });
 const townStage=[...flat(smooth([[MAIN_SOUTH_X,-39.4],[MAIN_SOUTH_X,STAGE_Z+STAGE_TURN_R]]))];
 for(let i=1;i<=20;i++){const a=Math.PI+i*(Math.PI/2)/20;townStage.push([MAIN_SOUTH_X+STAGE_TURN_R+Math.cos(a)*STAGE_TURN_R,MAIN_QUAY_TOP,STAGE_Z+STAGE_TURN_R+Math.sin(a)*STAGE_TURN_R]);}
 net.add(makeLane('town-ferry-stage',townStage,{speed:1.3}));
 const enter=[[-47,31],[-44,28.5],[-18,28.5]],far=[[-16,28.5],[-14.5,30],[-16,31.5]];
 Y.bays.forEach(([u,v],i)=>{
  const south=i<3;
  const incoming=south?[[-47,31],[-44,28.5],[u-5,28.5],[u-3,25],[u,25]]:[...enter,...far,[u+4,31.5],[u+3,v],[u,v]];
  const out=south?[[u,v],[u+2,25],[u+4,28.5],[-18,28.5],...far,[-43,31.5]]:[[u,v],[u-2.5,v],[u-4.5,31.5],[-43,31.5],[-44.5,32.5],[-46.5,32.5]];
  const path=smooth(out);if(south)path.push([-46.5,32.5]);
  // A half turn on the plaza leaves the nose towards shore; the car can reverse aboard.
  for(let j=0;j<=32;j++){const a=Math.PI/2+j*Math.PI/32;path.push([-46.5+Math.cos(a)*1.5,31+Math.sin(a)*1.5]);}
  net.add(makeLane('airport-in-'+i,airportPts(smooth(incoming)),{speed:1.7}));
  net.add(makeLane('airport-stage-'+i,airportPts(path),{speed:1.2}));
 });
 return net;
}

/** Actual hull transform supplies the deck, hinge and lowered ramp at either shore. */
export function ferryLanes(ferry,slot=0,berth='town'){
 ferry.updateMatrixWorld();const world=p=>new THREE.Vector3(...p).applyMatrix4(ferry.matrixWorld);
 const deck=world([FERRY_VEHICLE_DECK_X,ferry.userData.deckY,FERRY_VEHICLE_DECK_Z]),bow=world([0,ferry.userData.deckY,FERRY.length/2]);
 const landing=berth==='airport'?AIRPORT_FERRY_PORTS.airport.height:MINATO_BERTH.landing.top,ramp=world(rampToe(landing)),foot=world(rampFoot(landing));
 const deckPts=[deck.toArray(),bow.toArray(),foot.toArray(),ramp.toArray()];
 if(berth==='airport'){
  const lead=airportPts(smooth([Y.stage,[-48.2,29.6],[-50.2,31]]));
  return {on:makeLane('airport-ferry-on',[...lead,ramp.toArray(),foot.toArray(),bow.toArray(),deck.toArray()],{speed:1}),off:makeLane('airport-ferry-off',[...deckPts,...airportPts([[-51,31],[-47,31]])],{speed:1.4}),deck,ramp,yaw:ferry.rotation.y};
 }
 const x=FERRY_BERTH.x;
 const t=MINATO_TOE_Z,off=[...deckPts,...flat(smooth([[x,t+.6],[x,t+1.6],[-5.6,t+2.4],[-3,t+2.5],[-2,-42.2],[MAIN_NORTH_X,-40.2]])),[MAIN_NORTH_X,0,-39]];
 return {on:makeLane('town-ferry-on',[...townBackingPath(),foot.toArray(),bow.toArray(),deck.toArray()],{speed:1}),off:makeLane('town-ferry-off',off,{speed:1.5}),deck,ramp,yaw:ferry.rotation.y};
}

export function createTownTraffic({parent,colliders=null,ferry=null,getPlayerPosition=()=>null,people=()=>[],register=null,onAction=null}){
 const group=new THREE.Group();group.name='Road traffic';parent.add(group);
 const net=buildTownNetwork(),drivers=createVehicleDrivers({people});
 const obstacles=()=>{const out=[],p=getPlayerPosition?.();if(p)out.push({x:p.x,z:p.z,r:.4,player:true});for(const q of people()){const g=q?.g;if(g?.visible&&!g.userData.playerControlled&&!g.userData.inVehicle&&!g.userData.indoors)out.push({x:g.position.x,z:g.position.z,r:.35});}return out;};
 const traffic=createTraffic({obstacles});let serial=0,requestedCrossing=null;
 const make=(kind,colour,role,owner,purpose)=>{const g=buildVehicle(kind,colour);group.add(g);const v=traffic.add({g,kind,role,owner,driver:owner,purpose,id:'owned-car-'+(++serial),...VEHICLE_SIZE[kind]});Object.assign(g.userData,{owner,driver:owner,purpose,vehicleId:v.id});g.name=owner+' · '+kind;const a=new THREE.Object3D();a.position.y=1.2;g.add(a);register?.(a,'Inspect '+owner+'’s '+kind,()=>onAction?.('inspect',owner+'’s '+kind,'Owner and driver: '+owner+'. '+purpose+'.'));v.solid={id:'parked-vehicle',moving:true,x:1e6,z:1e6,w:v.width,d:v.length,yaw:0,minY:0,height:2};colliders?.push(v.solid);return v;};
 const airportTaken=new Set(),townTaken=new Set();
 // Cars come and go, so the builder keeps their bays clear instead of asking whether one is parked now.
 const parkAt=(v,p)=>{v.where=p.where;v.bay=p.bay;v.shore=p.where==='airport'?'airport':'town';delete v.stageOrigin;traffic.park(v,p);};
 // Leaving a bay releases its reservation, never the car's physical collision boundary.
 const unpark=v=>{if(v.where==='airport')airportTaken.delete(v.bay);if(v.where==='service')townTaken.delete(v.bay);v.where='driving';};
 const reserve=(shore)=>{const set=shore==='airport'?airportTaken:townTaken,order=shore==='airport'?[0,1,2,3,4,5]:[1,0];for(const i of order)if(!set.has(i)){set.add(i);return i;}return null;};
 const quayBay=i=>{const [x,z]=QUAY_BAYS[i];return {where:'quay',bay:i,x,y:wheelsAt(x,z),z,yaw:0};};
 const serviceBay=i=>{const [x,z]=SERVICE_BAYS[i];return {where:'service',bay:i,x,y:wheelsAt(x,z),z,yaw:Math.PI};};
 const islanders=[make('kei truck',0x5f8f5a,'islander','Tetsuo','Collect airport cargo for the workshop'),make('car',0xe9e6dc,'islander','Harbour master','Inspect airport cargo manifests')];
 // (each errand on the Minato Maru's own sailings, ferry-timetable.js, one car a sailing: she sails to her timetable and
 // takes the one car on her deck; the errands still ran at the times set before it (11:30, 16:00, 10:00, 13:00), when she
 // lay at Kitano-jima, and a car waited at the ramp with no boat. Wanted on the far shore from 11 minutes before its boat
 // until 20 before the one back, as the airport errand's test has it. Tetsuo takes the first boat over at 07:30 for the
 // workshop's parts off the morning freight and comes back with the commuter boat at 08:08, on Mondays, Wednesdays and
 // Fridays; the harbour master the same boats on the other three days, to check that freight's manifests)
 const appointments=[{leave:7*60+30-11,back:8*60+8-20,weekdays:[1,3,5]},{leave:7*60+30-11,back:8*60+8-20,weekdays:[2,4,6]}];islanders.forEach((v,i)=>{v.home='town';v.homeBay=i;v.appointment=appointments[i];parkAt(v,quayBay(i));});
 // The first kei truck is Minato Izakaya's (Thao's): the dry goods off the airport freight for the evening trade. It
 // was Chin's, but Chin is the ferry's motorman through the ship's day (ferry-crew.js), his body the ship's then, and the
 // driver code refuses a body the ship has (vehicle-driver.js), so a truck of his would stand in its bay all day; the
 // workshop's airport freight is Tetsuo's islander run above.
 // The red car is the island doctor's (Nhung since 22 October 2026, people/clinic-hours.js): the clinic's medicines from
 // the wholesaler in Naha, off the airport freight, twice a week. Never in surgery, so it runs on the evening boats, over
 // from Kitano-jima on the 21:38 and back on the 22:15 (ferry-timetable.js), on Mondays and Thursdays: Wednesday evening
 // is her coin laundry (commerce/coin-laundry.js), Saturday afternoon and Sunday evening her own.
 const fleet=[make('kei truck',0xf2f0ea,'ferry','Thao','Deliver airport dry goods to Minato Izakaya'),make('kei truck',0x2f6f9f,'ferry','Mrs Sato','Deliver airport kitchen supplies to Main Street'),make('car',0xc8432f,'ferry','Nhung','Bring the clinic’s medicines from the airport freight')];
 // (Thao's dry goods come over on the 14:08 for the evening trade and her truck goes back on the 14:45, every day; Mrs
 // Sato's kitchen supplies on the evening boats, 21:38 over and 22:15 back, on Tuesdays and Fridays, the evenings the
 // clinic's car is not on the deck)
 const fleetAppointments=[{leave:14*60+8-11,back:14*60+45-20},{leave:21*60+38-11,back:22*60+15-20,weekdays:[2,5]},{leave:1280,back:1320,weekdays:[1,4]}];
 fleet.forEach((v,i)=>{v.home='airport';v.appointment=fleetAppointments[i];const bay=reserve('airport');v.homeBay=bay;parkAt(v,airportVehicleBay(bay));});
 const all=[...islanders,...fleet];
 const wantedShore=(v,minutes)=>{const m=((minutes%1440)+1440)%1440,a=v.appointment,today=!a.weekdays||a.weekdays.includes(townCalendarAt(minutes).weekday);return today&&m>=a.leave&&m<a.back?(v.home==='town'?'airport':'town'):v.home;};
 function stage(v,destination){
  if(!drivers.board(v))return false;const shore=v.shore,bay=v.bay;unpark(v);v.shipDestination=destination;v.stageOrigin=shore;
  const path=shore==='airport'?net.path(['airport-stage-'+bay]):net.path([...(v.role==='islander'?['quay-out-'+v.homeBay,v.homeBay===LAYBY_BAY?'layby-north':'main-north','service-in-1','service-out-1']:['service-out-'+bay]),'main-south','town-ferry-stage']);
  traffic.drive(v,path,{onArrive:()=>{v.where='waiting-ferry';v.stageOrigin=shore;}});return true;
 }
 function sitOnDeck(v){ferry.ferry.updateMatrixWorld();const p=new THREE.Vector3(FERRY_VEHICLE_DECK_X,ferry.ferry.userData.deckY,FERRY_VEHICLE_DECK_Z).applyMatrix4(ferry.ferry.matrixWorld);v.g.position.copy(p);v.g.quaternion.copy(ferry.ferry.quaternion);v.g.visible=ferry.ferry.visible;syncVehicleCollider(v);}
 function unload(v){
  if(!ferry.canUnload||!drivers.atWheel(v)||v.securing?.progress>0)return false;
  const shore=ferry.berth,directHome=shore==='town'&&v.role==='islander';const bay=directHome?v.homeBay:reserve(shore);if(bay===null)return false;
  const lanes=ferryLanes(ferry.ferry,0,shore);v.where='driving';v.transfer='off';v.shore=shore;v.bay=bay;v.securing=null;
  const tail=shore==='airport'?['airport-in-'+bay]:directHome?(bay===LAYBY_BAY?['quay-in-'+bay]:['main-north','service-in-1','service-out-1','main-south','quay-in-'+bay]):['main-north','service-in-'+bay];
  traffic.drive(v,net.path([lanes.off,...tail]),{onArrive:()=>{v.transfer=null;v.shipDestination=null;parkAt(v,shore==='airport'?airportVehicleBay(bay):directHome?quayBay(bay):serviceBay(bay));if(shore===v.home)drivers.release(v,{restore:v.home==='airport'});}});return true;
 }
 function updateFerry(){
  if(!ferry)return;
  for(const v of all)if(v.where==='aboard')sitOnDeck(v);
  if(!ferry.canLoad&&!ferry.canUnload)return;
  const aboard=all.find(v=>v.where==='aboard');if(aboard&&aboard.shipDestination===ferry.berth){if(ferry.canUnload)unload(aboard);return;}
  if(aboard||all.some(v=>v.transfer))return;
  const next=all.find(v=>v.where==='waiting-ferry'&&v.stageOrigin===ferry.berth&&v.shipDestination===requestedCrossing);
  if(!next||!drivers.has(next)||!ferry.canLoad||ferry.rampDown<1)return;
  const lanes=ferryLanes(ferry.ferry,0,ferry.berth);next.where='driving';next.transfer='on';
  traffic.drive(next,net.path([lanes.on]),{reverse:true,onArrive:()=>{next.transfer=null;next.where='aboard';sitOnDeck(next);}});
 }
 const loadingCount=()=>all.filter(v=>v.transfer).length;
 const aboardVehicles=()=>all.filter(v=>v.where==='aboard');
 const vehicleObstacles=()=>aboardVehicles().map(v=>({id:v.id,x:FERRY_VEHICLE_DECK_X,z:FERRY_VEHICLE_DECK_Z,w:v.width,d:v.length,y:FERRY_DECKS.car.y,height:2}));
 const api={group,network:net,traffic,fleet,islanders,appointments,drivers,serviceCourt:MAIN_SERVICE_COURT,
  prepareCrossing(destination){requestedCrossing=destination;updateFerry();if(all.some(v=>v.where==='aboard'&&v.shipDestination===destination)&&!loadingCount())return true;const active=all.some(v=>v.transfer||v.where==='driving'&&v.stageOrigin===ferry?.berth&&v.shipDestination===destination);const waiting=all.some(v=>v.where==='waiting-ferry'&&v.stageOrigin===ferry?.berth&&v.shipDestination===destination);return !active&&!waiting;},
  pendingVehicleJourney(){const v=all.find(v=>v.where==='aboard'||v.transfer==='on')||all.find(v=>v.where==='waiting-ferry');return v?.shipDestination?{id:v.id,origin:v.stageOrigin||v.shore,destination:v.shipDestination}:null;},
  vehicleObstacles,
  securingStation(){const v=aboardVehicles()[0];return v?{x:FERRY_VEHICLE_DECK_X+v.width/2+.32,y:FERRY_DECKS.car.y,z:FERRY_VEHICLE_DECK_Z+(v.g.userData.wheels?.find(w=>w.z>0)?.z||1)}:undefined;},
  beginSecuring(operation){for(const v of aboardVehicles()){
   if(v.securing?.operation===operation)continue;
   v.securing={operation,elapsed:0,progress:0,engineOff:true,parkingBrake:false,transmission:'pending',chocks:false,straps:false};
   v.secureRig??=buildWheelSecuring(v.g);drivers.leaveForPassenger(v,ferry.ferry,{obstacles:vehicleObstacles});
  }},
  advanceSecuring(dt,operation){for(const v of aboardVehicles()){
   const s=v.securing;if(!s||s.operation!==operation)continue;s.elapsed=Math.min(12,s.elapsed+Math.max(0,dt));s.progress=s.elapsed/12;
   s.parkingBrake=s.elapsed>=2;s.transmission=s.elapsed>=4?(v.g.userData.transmission==='automatic'?'Park':'neutral'):'pending';s.chocks=s.elapsed>=6;s.straps=s.elapsed>=12;v.secureRig.set(Math.max(0,(s.elapsed-4)/8));
  }},
  advanceUnsecuring(dt){for(const v of aboardVehicles()){
   const s=v.securing;if(!s)continue;if(!ferry.moored)return;
   s.progress=Math.max(0,s.progress-Math.max(0,dt)/12);v.secureRig.set(s.progress);
   if(s.progress<=0){s.chocks=false;s.straps=false;drivers.returnToVehicle(v);}
  }},
  securingSummary(){const list=aboardVehicles();return {aboard:list.length,secured:list.filter(v=>v.securing?.engineOff&&v.securing.parkingBrake&&v.securing.transmission!=='pending'&&v.securing.chocks&&v.securing.straps&&v.securing.progress>=1).length,driversClear:list.filter(v=>drivers.passengerClear(v)).length};},
  readyToDisembark(){return aboardVehicles().every(v=>(v.securing?.progress??0)<=0&&drivers.atWheel(v));},
  /** Offline time settles the errands and returns each borrowed resident to town life. */
  reconcileAbsent(){
   requestedCrossing=null;airportTaken.clear();townTaken.clear();
   for(const v of all){drivers.release(v,{restore:true});v.securing=null;v.secureRig?.set(0);v.transfer=null;v.shipDestination=null;v.hold=false;v.blocker=null;v.waited=0;v.personWait=0;
    if(v.home==='airport'){airportTaken.add(v.homeBay);parkAt(v,airportVehicleBay(v.homeBay));}else parkAt(v,quayBay(v.homeBay));
   }
   if(ferry)ferry.loadingVehicles=0;
  },
  get loadingVehicles(){return loadingCount();},
  snapshot:()=>all.map(v=>({id:v.id,owner:v.owner,driver:v.driver,purpose:v.purpose,location:v.where,shore:v.shore,destination:v.shipDestination??null,driving:!!v.trip,occupied:drivers.atWheel(v),driverState:drivers.snapshot(v),securing:v.securing?{...v.securing}:null,transfer:v.transfer??null,position:v.g.position.toArray()})),
  update(dt,minutes){if(Number.isFinite(minutes))for(const v of all){if(!['quay','service','airport'].includes(v.where))continue;const want=wantedShore(v,minutes);if(want!==v.shore)stage(v,want);}updateFerry();drivers.update(dt);if(ferry)ferry.loadingVehicles=loadingCount();traffic.update(dt);for(const v of all)if(v.trip&&!drivers.atWheel(v)){v.hold=true;v.speed=0;}}
 };
 ferry?.bindVehicleController?.(api);if(ferry)ferry.vehicleObstacles=vehicleObstacles;return api;
}
