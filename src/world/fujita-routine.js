import * as THREE from '../../vendor/three.module.js';
import {HOUSEBOAT as B} from './fujita-houseboat.js';
import {poolGlow} from '../render/dusk.js';
// Bed aboard Shiosai at a quarter to one, when the set goes off (fujita-day.js FUJITA_DAY.end: the last boat back from
// Kitano-jima lands him at Minato after eleven); up at six.
export const FUJITA_HOURS=Object.freeze({bedtime:45,wake:360});
export function fujitaAsleep(minutes){const m=((minutes%1440)+1440)%1440;return m>=FUJITA_HOURS.bedtime&&m<FUJITA_HOURS.wake;}
export function fujitaBoatRoute(chair){return [[chair[0],.02,chair[1]],[-36.6,.02,-55.6],[-37.5,.02,-55.6],[-37.5,.06,-54.2],[-39.2,.06,-54.2],[B.x+.3,.06,-54.2],[B.x+.3,.06,B.z+1.1],[B.x+.65,.06,B.z+1.1],[B.x+.65,.06,B.z+.15],[B.x+B.bedside[0],B.bedside[1],B.z+B.bedside[2]]];}
export function createFujitaRoutine(entity,{origin,chair,cover,boat}){
 const path=fujitaBoatRoute(chair).map(p=>new THREE.Vector3(p[0]-origin[0],p[1],p[2]-origin[1]));
 path[0].copy(entity.position);const chairSeatHeight=entity.userData.seatHeight??.42,chairYaw=entity.rotation.y;
 const bed=new THREE.Vector3(B.x+B.bed[0]-origin[0],B.bed[1],B.z+B.bed[2]-origin[1]),lying=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,Math.PI,0));
 let state=null,index=0,rest=0,targetSleep=false;
 const flags=()=>{const u=entity.userData;delete u.seatHeight;delete u.heldItem;u.sleeping=false;u.sleepBlend=0;u.socialPose='Idle';};
 function update(dt,minutes,programme){
  const wants=fujitaAsleep(minutes),u=entity.userData;
  if(state===null){targetSleep=wants;state=wants?'sleeping':'watching';index=wants?path.length-1:0;rest=wants?1:0;entity.position.copy(wants?bed:path[0]);}
  else if(wants!==targetSleep){if(state==='to-boat'&&!wants)index=Math.min(path.length-1,index+1);else if(state==='to-shed'&&wants)index=Math.max(0,index-1);targetSleep=wants;flags();state=wants?'to-boat':rest>0?'waking':'to-shed';}
  if(state==='waking'){rest=Math.max(0,rest-Math.min(dt,.2));entity.position.copy(path.at(-1)).lerp(bed,rest);entity.quaternion.identity().slerp(lying,rest);u.socialPose='Wake';u.sleepBlend=rest;u.activity='waking aboard Shiosai';if(rest===0)state='to-shed';}
  else if(state==='to-boat'||state==='to-shed'){
   flags();entity.rotation.set(0,0,0);let remaining=Math.min(Math.max(dt,0),.5)*.75;
   while(remaining>0){const next=state==='to-boat'?Math.min(path.length-1,index+1):Math.max(0,index-1),target=path[next],delta=target.clone().sub(entity.position),distance=delta.length();if(distance>1e-5)entity.rotation.y=Math.atan2(delta.x,delta.z)+Math.PI;
    if(distance<=remaining){entity.position.copy(target);remaining-=distance;index=next;if(state==='to-boat'&&index===path.length-1){state='settling';break;}if(state==='to-shed'&&index===0){state='watching';break;}}
    else{entity.position.addScaledVector(delta,remaining/distance);break;}}
   u.activity=state==='to-shed'?'returning to his shed':'walking aboard Shiosai to sleep';
  }
  if(state==='settling'){rest=Math.min(1,rest+Math.min(dt,.2));entity.position.copy(path.at(-1)).lerp(bed,rest);entity.quaternion.identity().slerp(lying,rest);u.socialPose='Sleep';u.sleepBlend=rest;u.activity='settling onto his sofa';if(rest===1)state='sleeping';}
  if(state==='sleeping'){flags();entity.position.copy(bed);entity.quaternion.copy(lying);u.socialPose='Sleep';u.sleeping=true;u.sleepBlend=1;u.hatOff=true;u.activity='sleeping aboard Shiosai';}
  if(state==='watching'){entity.position.copy(path[0]);entity.rotation.set(0,chairYaw,0);u.sleeping=false;u.sleepBlend=0;delete u.hatOff;u.seatHeight=chairSeatHeight;u.socialPose='Drink';u.heldItem='beer';u.heldPortion=Math.max(0,.6*Math.min(1,(((FUJITA_HOURS.bedtime-minutes)%1440)+1440)%1440/30));u.activity=programme==='baseball'?'watching the ballgame with a beer':programme==='news'?'watching the evening news':'watching television with a beer';}
  u.houseboatRoutine=state;u.walking=state==='to-boat'||state==='to-shed';cover?.update(dt,rest);boat?.tick({sleeping:rest>.01,night:poolGlow(minutes)});return state;
 }
 return {update,get state(){return state;}};
}
