import * as THREE from '../../vendor/three.module.js';
import {STAFF_BENCH} from '../world/staff-bench.js';
import {GROUND_LAYER} from '../world/ground-layers.js';
/** How far in front of the seat Thuan stands before she sits down. */
const THUAN_CHAIR_STEP=.48;
import {travelYaw} from './facing.js';

// Own the short movement through the bench's collision footprint until she is
// standing clear again. Ordinary navigation must never start inside the seat.
export function createStaffBenchRoutine({entity,seat,isOccupied=()=>false}){
 const data=entity.userData,forward=[-Math.sin(STAFF_BENCH.yaw),-Math.cos(STAFF_BENCH.yaw)];
 const front=STAFF_BENCH.seat.map((v,i)=>v+forward[i]*THUAN_CHAIR_STEP);
 let phase='idle',timer=0,amount=0;
 const duration=1.35;
 function turn(yaw,dt){
  const delta=Math.atan2(Math.sin(yaw-entity.rotation.y),Math.cos(yaw-entity.rotation.y));
  entity.rotation.y+=THREE.MathUtils.clamp(delta,-2.6*dt,2.6*dt);return Math.abs(delta)<.025;
 }
 function walk(target,dt){
  const dx=target[0]-entity.position.x,dz=target[1]-entity.position.z,d=Math.hypot(dx,dz);
  if(d<.004)return true;
  if(!turn(travelYaw(dx,dz),dt))return false;
  const step=Math.min(d,dt*Math.min(.72,Math.sqrt(2*1.8*d)));
  entity.position.x+=dx/d*step;entity.position.z+=dz/d*step;return false;
 }
 function chairPose(){
  const blend=amount*amount*(3-2*amount);
  data.socialPose='Sit';data.seatHeight=STAFF_BENCH.height;data.seatFront=STAFF_BENCH.front;data.chairBlend=blend;
  entity.position.x=front[0]-forward[0]*THUAN_CHAIR_STEP*blend;
  entity.position.z=front[1]-forward[1]*THUAN_CHAIR_STEP*blend;
 }
 function clearPose(){for(const key of ['seatHeight','seatFront','chairBlend','socialPose','sleeping','napping'])delete data[key];}
 return {get active(){return phase!=='idle';},get phase(){return phase;},update(dt,wantsBreak){
  if(phase==='idle'){
   if(!wantsBreak||!seat||seat.userData.reservedBy||isOccupied()||Math.hypot(entity.position.x-STAFF_BENCH.stand[0],entity.position.z-STAFF_BENCH.stand[1])>STAFF_BENCH.approachRadius)return false;
   seat.userData.reservedBy=data.name||'Thuan';data.usingTownObject=true;data.staffBenchPhase=phase='approach';data.floorHeight=GROUND_LAYER.lane;
  }
  data.place='nap';
  if(!wantsBreak&&!['wake','stand','leave'].includes(phase)){
   if(phase==='rest'||phase==='sleep'){phase='wake';timer=.8;delete data.sleeping;data.socialPose='Sit';}
   else if(phase==='sit'){phase='stand';}
   else phase='leave';
  }
  if(phase==='approach'){
   data.activity='stepping up to the bench';if(walk(front,dt))phase='turn';
  }else if(phase==='turn'){
   data.activity='turning to sit down';if(turn(STAFF_BENCH.yaw,dt)){phase='sit';amount=0;chairPose();}
  }else if(phase==='sit'){
   data.activity='sitting down';amount=Math.min(1,amount+dt/duration);chairPose();
   if(amount===1){phase='rest';timer=5;data.napping=true;delete data.chairBlend;}
  }else if(phase==='rest'){
   data.activity='resting on the bench';if((timer-=dt)<=0){phase='sleep';data.socialPose='Sleep';data.sleeping=true;}
  }else if(phase==='sleep')data.activity='dozing on the bench';
  else if(phase==='wake'){
   data.activity='waking up';if((timer-=dt)<=0){phase='stand';amount=1;}
  }else if(phase==='stand'){
   data.activity='standing up';amount=Math.max(0,amount-dt/duration);chairPose();
   if(amount===0){clearPose();phase='leave';}
  }else if(phase==='leave'){
   data.activity='stepping away from the bench';
   if(walk(STAFF_BENCH.stand,dt)){
    clearPose();delete data.usingTownObject;delete data.floorHeight;delete data.staffBenchPhase;
    if(seat.userData.reservedBy===(data.name||'Thuan'))delete seat.userData.reservedBy;
    phase='idle';return true;
   }
  }
  data.staffBenchPhase=phase;return true;
 }};
}
