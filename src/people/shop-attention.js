import * as THREE from '../../vendor/three.module.js';

function obscured(from,to,colliders){
 for(const c of colliders){
  let near=0,far=1;
  for(const [axis,centre,half] of [['x',c.x,c.w/2],['z',c.z,c.d/2]]){
   const delta=to[axis]-from[axis];
   if(Math.abs(delta)<1e-6){if(Math.abs(from[axis]-centre)>half){near=2;break;}continue;}
   const a=(centre-half-from[axis])/delta,b=(centre+half-from[axis])/delta;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
  }
  if(near<=far&&far>.03&&near<.97){const y=from.y+(to.y-from.y)*Math.max(0,near);if(y<(c.height??3)-.03)return true;}
 }
 return false;
}
export function createShopAttention({clerk,world,retail,colliders,isInside,getPlayerPosition}){
 let selected=null,hold=0,clock=0;
 return {update(dt){
  const data=clerk.userData;clock+=dt;hold=Math.max(0,hold-dt);
  if(!data.inMarket||data.roomTransition||data.carrying||data.shopReach||data.restocking||data.sleeping){
   // Only clear a look this pass put there. facing.js points the same head at whoever
   // is talking to her, in the shop or out of it, and that one is not ours to drop.
   if(data.lookSource!=='facing')delete data.lookTarget;
   selected=null;return;
  }
  if(clock<.12)return;clock=0;
  const origin=clerk.getWorldPosition(new THREE.Vector3());origin.y+=1.32;
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(clerk.getWorldQuaternion(new THREE.Quaternion())),candidates=[];
  const add=(id,point,priority=0)=>{const direction=point.clone().sub(origin),distance=Math.hypot(direction.x,direction.z);if(distance<.35||distance>3.2||direction.normalize().dot(forward)<.12||obscured(origin,point,colliders))return;candidates.push({id,point,score:distance+priority});};
  for(const p of world.people){if(p.g===clerk||!p.g.userData.inMarket||p.g.userData.roomTransition)continue;
   const record=retail.customers.get(p),point=p.g.getWorldPosition(new THREE.Vector3());point.y+=(p.g.userData.character?.height||p.profile.height||1.65)*.9;
   add(p.profile.name,point,record?.phase==='queue'&&record.atCounter?-10:0);
  }
  if(isInside()){const p=getPlayerPosition();add('player',new THREE.Vector3(p.x,p.y+1.65,p.z),data.playerConversation?-20:0);}
  candidates.sort((a,b)=>a.score-b.score);let target=candidates[0],previous=candidates.find(c=>c.id===selected);
  if(hold>0&&previous&&target&&previous.score-target.score<.45)target=previous;
  if(target){if(selected!==target.id)hold=1.2;selected=target.id;data.lookTarget=target.point.toArray();data.lookSource='shop';data.lookCustomer=target.id;}
  else{selected=null;if(data.lookSource!=='facing')delete data.lookTarget;delete data.lookCustomer;}
 }};
}
