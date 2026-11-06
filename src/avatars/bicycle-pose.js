import * as THREE from '../../vendor/three.module.js';
import {bicycleRiderFit} from '../world/bicycle-fit.js';

function aim(bone,child,target){
 const start=bone.getWorldPosition(new THREE.Vector3());
 const from=child.getWorldPosition(new THREE.Vector3()).sub(start).normalize();
 const to=target.clone().sub(start).normalize();
 const q=new THREE.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
 bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
 bone.updateWorldMatrix(false,true);
}
function solve(upper,lower,end,target,pole){
 const start=upper.getWorldPosition(new THREE.Vector3()),mid=lower.getWorldPosition(new THREE.Vector3()),tip=end.getWorldPosition(new THREE.Vector3());
 const a=start.distanceTo(mid),b=mid.distanceTo(tip),dir=target.clone().sub(start);
 const d=THREE.MathUtils.clamp(dir.length(),Math.abs(a-b)+.0001,a+b-.0001);dir.normalize();
 const bend=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();
 const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 aim(upper,lower,start.clone().addScaledVector(dir,along).addScaledVector(bend,height));
 aim(lower,end,start.clone().addScaledVector(dir,d));
}
/** Resolve contacts in the bicycle's frame, including turns and sloping ground. */
export function poseAvatarOnBicycle(avatar,phase=0,fit=bicycleRiderFit(avatar.measure)){
 const {bones:b,measure:m,root}=avatar,entity=root.parent,scale=fit.scale;
 root.updateWorldMatrix(true,true);
 const q=entity?entity.getWorldQuaternion(new THREE.Quaternion()):new THREE.Quaternion();
 const point=(x,y,z)=>{const p=new THREE.Vector3(x,y,z);return entity?entity.localToWorld(p):p;};
 const pole=(x,y,z)=>new THREE.Vector3(x,y,z).applyQuaternion(q);
 const shoe=root.getWorldQuaternion(new THREE.Quaternion());
 for(const [side,sign,offset] of [['L',-1,Math.PI],['R',1,0]]){
  const a=phase*Math.PI*2+offset;
  // The foot joint is one sole height above the pedal platform.
  solve(b['thigh'+side],b['knee'+side],b['foot'+side],point(sign*.12*scale,(.32+Math.sin(a)*.12)*scale+m.foot,(.12+Math.cos(a)*.12)*scale),pole(0,0,-1));
  const foot=b['foot'+side];foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(shoe));
  foot.updateWorldMatrix(false,true);
  solve(b['shoulder'+side],b['elbow'+side],b['hand'+side],point(sign*.25*scale,1.04*scale+m.hand*.55,-.25*scale),pole(sign,-.2,.1));
  const hand=b['hand'+side];hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));hand.updateWorldMatrix(false,true);
 }
}
