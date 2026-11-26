import * as THREE from '../../vendor/three.module.js';
import {bicycleRiderFit} from '../world/bicycle-fit.js';
import {handleAt} from './build.js';

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
/**
 * The handlebar's grips (world/bicycle.js): rubber tubes 21 mm round, each from `inner` to `outer` (the left's; the right's
 * mirrored), in the bicycle's frame before its scale. The closed hand goes round each `at` of the way out, its little finger
 * toward the end: the hollow (build.js handleAt) on the grip's line, the grip across the hand, the palm over it, the fingers
 * forward round it. (The mitten's middle went on the grip's end, its wrist 0.55 of a hand above it, and closed over it; the
 * hand's middle is in its palm, so the grip would have gone through the hand.)
 */
const GRIP=Object.freeze({inner:Object.freeze([.17,1.06,-.33]),outer:Object.freeze([.26,1.04,-.25]),radius:.021,at:.6});
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
  const hand=b['hand'+side];
  // (a body with a hand of its own, a Pixar body, as the mitten was: its middle on the grip's end, the hand level)
  if(m.realHand){solve(b['shoulder'+side],b['elbow'+side],hand,point(sign*.25*scale,1.04*scale+m.hand*.55,-.25*scale),pole(sign,-.2,.1));
   hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));hand.updateWorldMatrix(false,true);continue;}
  // the hand's frame in the bicycle's: across it (z, the forefinger's side) along the grip inward, its back up (the left
  // hand's +x, the right's -x: the right is the left's mirror), the wrist behind (y)
  const inner=new THREE.Vector3(sign*GRIP.inner[0],GRIP.inner[1],GRIP.inner[2]).multiplyScalar(scale),outer=new THREE.Vector3(sign*GRIP.outer[0],GRIP.outer[1],GRIP.outer[2]).multiplyScalar(scale);
  const across=inner.clone().sub(outer).normalize(),up=new THREE.Vector3(0,1,0),back=up.addScaledVector(across,-up.dot(across)).normalize();
  const x=side==='L'?back:back.clone().negate(),y=new THREE.Vector3().crossVectors(across,x);
  const turn=q.clone().multiply(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,across)));
  const on=inner.lerp(outer,GRIP.at),hold=new THREE.Vector3(...handleAt(m,side,GRIP.radius*scale)).applyQuaternion(turn);
  solve(b['shoulder'+side],b['elbow'+side],hand,point(on.x,on.y,on.z).sub(hold),pole(sign,-.2,.1));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(turn));hand.updateWorldMatrix(false,true);
 }
}
