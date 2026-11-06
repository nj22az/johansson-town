import * as THREE from '../../vendor/three.module.js';
import {crewRoute,stepCrewRoute,crewWalkSegment,CREW_RADIUS} from './ferry-crew-walk.js';

/** Borrow the existing resident, never add a second copy of their avatar. */
export function createVehicleDrivers({people}){
 const borrowed=new Map();
 const keys=['inVehicle','ferryPassenger','indoors','socialPose','seatHeight','floorHeight','activity'];
 const passengerPoint=[-.9,5.5,-10.45];
 function atWheel(v,saved){
  const g=saved.g,u=g.userData,seat=v.g.userData.driverSeat;v.g.add(g);
  g.position.set(seat.x,0,seat.z);g.rotation.set(0,Math.PI,0);g.visible=true;
  Object.assign(u,{inVehicle:v.id,indoors:'vehicle',socialPose:'Sit',seatHeight:seat.y,floorHeight:seat.floor??.22,activity:'Driving · '+v.purpose});delete u.ferryPassenger;saved.mode='driving';
 }
 function board(v){
  if(borrowed.has(v))return true;
  const person=people().find(p=>p.profile?.name===v.driver),g=person?.g,u=g?.userData;
  // The street scheduler represents offscreen work/home with `indoors` on the town
  // avatar. A scheduled delivery may borrow that exact resident; active interiors,
  // conversations and visible indoor work still keep ownership of their avatar.
  const scheduledOffscreen=!!(g&&!g.visible&&g.parent===v.g.parent?.parent&&v.purpose);
  // A body the ferry has signed on (ferry-crew-aboard.js hides it while the ship draws them) or the quay has called
  // (ferry-shore-crew.js) is not a driver: the one person would be in two places.
  if(!g||u.playerControlled||u.inVehicle||u.aboardFerry||u.ferryShoreTask||u.indoors&&!scheduledOffscreen||u.inHome||u.inMarket||u.inIzakaya||u.inRamen||u.inBookshop||u.inWorkplace||u.inOnsen||u.sleeping||u.roomTransition||u.playerConversation)return false;
  const saved={g,parent:g.parent,position:g.position.clone(),rotation:g.rotation.clone(),visible:g.visible,flags:Object.fromEntries(keys.map(k=>[k,u[k]]))};borrowed.set(v,saved);
  atWheel(v,saved);
  return true;
 }
 function release(v,{restore=false,away=false}={}){
  const saved=borrowed.get(v);if(!saved)return;
  const {g,parent,position,rotation,visible,flags}=saved,at=v.g.localToWorld(new THREE.Vector3(v.width/2+.65,0,0));
  parent.add(g);g.position.copy(restore?position:at);g.rotation.copy(rotation);g.visible=away?false:visible;
  for(const k of keys){if(flags[k]===undefined)delete g.userData[k];else g.userData[k]=flags[k];}
  borrowed.delete(v);
 }
 function walk(saved,target,mode){
  const obstacles=saved.obstacles?.()||[],points=[saved.g.position.toArray(),...(saved.exitVia?[saved.exitVia]:[]),target],path=[];
  for(let i=1;i<points.length;i++){
   const leg=crewRoute(points[i-1],points[i],{obstacles});if(!leg.ok){saved.blocked=leg.reason;return false;}
   path.push(...(path.length?leg.path.slice(1):leg.path));
  }
  saved.route=path;saved.routeIndex=1;saved.mode=mode;saved.blocked=null;return true;
 }
 function leaveForPassenger(v,ferry,{obstacles=()=>[]}={}){
  const saved=borrowed.get(v);if(!saved)return false;if(!['driving','exit-held'].includes(saved.mode))return true;
  const g=saved.g;ferry.updateWorldMatrix(true,true);v.g.updateWorldMatrix(true,true);
  const seatPosition=ferry.worldToLocal(g.getWorldPosition(new THREE.Vector3())).toArray();
  const car=ferry.worldToLocal(v.g.getWorldPosition(new THREE.Vector3())),seat=v.g.userData.driverSeat;
  const occupied=obstacles(),otherCars=occupied.filter(o=>o.id!==v.id);let exit=null,exitVia=null;
  // Cab-over doors sit close to the casing's fire-hose box. A short aft step at
  // the door clears that fitting; choose it only if the complete exit and onward
  // route are supported. The driver's own car is ignored solely while stepping out.
  for(const offset of [0,-.3,.3,-.6,.6]){
   const candidate=[car.x-v.width/2-.22,car.y,car.z+seat.z+offset];
   if(!crewWalkSegment(seatPosition,candidate,CREW_RADIUS,otherCars))continue;
   if(crewRoute(candidate,passengerPoint,{obstacles:occupied}).ok){exit=candidate;break;}
   // The space between this car and its casing fittings can be narrower than a
   // route-grid cell. Follow the physically checked side of this particular car
   // to its clear aft end before joining the general passenger route.
   const aft=[candidate[0],car.y,car.z-(v.length||3.9)/2-.32];
   if(!crewWalkSegment(candidate,aft,CREW_RADIUS,occupied)||!crewRoute(aft,passengerPoint,{obstacles:occupied}).ok)continue;
   exit=candidate;exitVia=aft;break;
  }
  if(!exit){saved.mode='exit-held';saved.blocked='The car door has no clear, supported exit to the passenger stair';saved.elapsed=0;saved.retryExit={ferry,obstacles};return false;}
  ferry.add(g);g.position.set(...seatPosition);g.rotation.set(0,Math.PI,0);
  saved.exit=exit;saved.exitVia=exitVia;saved.seat=seatPosition;saved.ferry=ferry;saved.obstacles=obstacles;saved.mode='stepping-out';saved.elapsed=0;saved.blocked=null;saved.retryExit=null;
  delete g.userData.inVehicle;delete g.userData.seatHeight;g.userData.floorHeight=0;delete g.userData.socialPose;
  Object.assign(g.userData,{ferryPassenger:v.id,indoors:'ferry',activity:'Leaving the car for the passenger deck'});return true;
 }
 function returnToVehicle(v){
  const saved=borrowed.get(v);if(!saved)return false;if(saved.mode==='driving'||saved.mode==='returning'||saved.mode==='stepping-in')return true;
  if(saved.mode!=='passenger')return false;return walk(saved,saved.exit,'returning');
 }
 function update(dt){
  dt=Math.min(.25,Math.max(0,Number(dt)||0));
  for(const [v,saved] of borrowed){const {g}=saved;
   if(saved.mode==='exit-held'){
    saved.elapsed+=dt;if(saved.elapsed>=2)leaveForPassenger(v,saved.retryExit.ferry,{obstacles:saved.retryExit.obstacles});
   }else if(saved.mode==='stepping-out'||saved.mode==='stepping-in'){
    saved.elapsed+=dt;const t=Math.min(1,saved.elapsed/1.5),out=saved.mode==='stepping-out',a=out?saved.seat:saved.exit,b=out?saved.exit:saved.seat;
    g.position.set(...a.map((n,i)=>n+(b[i]-n)*t));
    if(t>=1){if(out){if(!walk(saved,passengerPoint,'walking'))saved.mode='route-held';}else atWheel(v,saved);}
   }else if(saved.mode==='route-held'){
    saved.elapsed+=dt;if(saved.elapsed>=2){saved.elapsed=0;walk(saved,passengerPoint,'walking');}
   }else if(saved.mode==='walking'||saved.mode==='returning'){
    const r=stepCrewRoute(saved,dt,{speed:1.05,obstacles:saved.obstacles?.()||[]});
    if(r.arrived){if(saved.mode==='walking'){saved.mode='passenger';g.userData.activity='Passenger · waiting in the upper lobby';}else{saved.mode='stepping-in';saved.elapsed=0;}}
   }
  }
 }
 return {board,release,leaveForPassenger,returnToVehicle,update,has:v=>borrowed.has(v),atWheel:v=>borrowed.get(v)?.mode==='driving',passengerClear:v=>borrowed.get(v)?.mode==='passenger',
  snapshot:v=>{const s=borrowed.get(v);return s?{mode:s.mode,blocked:s.blocked||null,position:s.g.position.toArray(),parent:s.g.parent?.name}:null;}};
}
