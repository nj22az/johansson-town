import * as THREE from '../../vendor/three.module.js';
import {faceLayout} from './face.js';
import {shapeHeadPoint} from './head-profile.js';
import {sampleCycle,CYCLE_DURATION} from '../drinking/cycle.js';

/** A single lift, pause at the lips, then return; shared by every avatar. */
export function consumptionPhase(t,duration=2.4){
 // Existing held-prop scenes retain their compact duration. Their lift and flow
 // envelope now comes from the same performance as the complete table interaction.
 const phase=sampleCycle(THREE.MathUtils.clamp(t/duration,0,1)*CYCLE_DURATION);
 return {lift:phase.lift,swallow:phase.flowProgress,done:t>=duration};
}
/**
 * How far a drink tips at the lips: a full mug barely, the last mouthful a long way, the
 * way you have to tip a glass further to reach what is left. Shared by the pose and the
 * grip so the rim and the mouth agree. Food stays level.
 */
export function drinkTilt(prop,lift,food=false){
 if(food)return 0;
 const left=THREE.MathUtils.clamp(prop?.userData?.portion??1,0,1);
 // (a full glass tipped a little, as a person sips it: its beer stands 9 mm under a 4 cm rim, so past about 12 degrees it
 // spills over the lip; at 31 degrees it stood 13 mm over the rim and the glass's far wall swung back into the nose. The
 // emptier the glass, the further it goes; the head goes back to meet it, drinkHeadTilt)
 return -(.2+.75*(1-left))*lift;
}
/** The head goes back with the sip, further for the last of the glass. */
export function drinkHeadTilt(prop,lift,food=false){
 if(food)return 0;
 const left=THREE.MathUtils.clamp(prop?.userData?.portion??1,0,1);
 return -(.14+.16*(1-left))*THREE.MathUtils.smoothstep(lift,.35,1);
}
/**
 * Where a drink sits against the hand, in the hand's level frame: from the palm's centre
 * to the drink's base. A mug or cup hangs off the outside of its handle; a tumbler, a
 * bottle or a can is held round its body, so the palm rests on the glass rather than
 * hovering beside it. Shared by the grip and the drinking pose so the rim and the
 * mouth agree.
 */
export function drinkGrip(prop,m,side='R'){
 const g=prop?.userData?.grip,s=side==='R'?1:-1;
 if(!g)return new THREE.Vector3(s*.10*m.k,-.08*m.k+m.hand*.55,.015*m.k);
 // (a real hand, a Pixar body's: the fingers through a handle with a finger's clearance, or the palm against a glass's
 // body; the mitten's offsets put a Pixar hand a span from the glass: the owner, 27 October 2026, "this is wrong")
 const out=m.realHand?(g.handle!=null?g.handle+.02:g.radius+.012):g.handle!=null?g.handle+m.hand*.25:g.radius+m.hand*.70;
 return new THREE.Vector3(s*out,-g.height,0);
}
/** A right hand's turn on a jug's handle (table-drink.js, the counter performance): the palm toward the glass, the
 * knuckle line up the bar, the thumb on top. The hand's frame (palm +x, fingers -y, thumb +z) onto the jug's (handle
 * +x, up +y). */
export const HOLD_Q=Object.freeze(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0))));
/**
 * A hand with finger bones (pixar.js holdPoint) on a jug made for fingers (a handle with an `opening`, the izakaya's
 * 大ジョッキ): where the bar lies in the jug's frame and where the curled fingers' hollow lies in the hand's, so the bar
 * sits in the fist. Null for a hand without finger bones, the left hand, or a vessel held round its body; they keep
 * drinkGrip. What Johansson learned at the counter, for everyone with fingers (the owner, 27 October 2026: "Can we use
 * what we learned from Johansson?"; "Everyone should eventually be Pixar style").
 */
export function fingerHold(avatar,prop,side='R'){
 const g=prop?.userData?.grip;if(side!=='R'||!g||g.handle==null||!g.opening)return null;
 const h=avatar.pixar?.holdPoint?.(side,1);if(!h)return null;
 return {centre:h.centre,barAt:new THREE.Vector3(g.handle-(g.bar??.008),g.height??.08,0)};
}
/** The jug's turn in a right hand: upright (tipped by `q`'s sip), its handle toward the hand (its +x to the body's -x). */
const jugTurn=q=>q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));
/** Keep the palm upright while holding or sipping, including idle holds. */
function alignDrinkHand(avatar,q,side='R'){
 const hand=avatar.bones['hand'+side],handQ=q;
 hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handQ));
 hand.updateWorldMatrix(false,true);
}
/** The palm's centre, below the wrist the hand bone pivots on (build.js, the mitten hand). */
const palm=m=>new THREE.Vector3(0,-m.hand*.55,0);
function aim(bone,child,target){
 const start=bone.getWorldPosition(new THREE.Vector3());
 const from=child.getWorldPosition(new THREE.Vector3()).sub(start).normalize();
 const q=new THREE.Quaternion().setFromUnitVectors(from,target.clone().sub(start).normalize()).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
 bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));bone.updateWorldMatrix(false,true);
}
/** Two-bone reach: the hand of `side` ('R' or 'L') to a world point, the elbow out and down (`lift` raises it, or is
 * the elbow's whole direction in the body's frame). */
export function reach(avatar,target,side='R',lift=-.25){
 const b=avatar.bones,shoulder=b['shoulder'+side],elbow=b['elbow'+side],hand=b['hand'+side];
 const start=shoulder.getWorldPosition(new THREE.Vector3());
 const a=start.distanceTo(elbow.getWorldPosition(new THREE.Vector3())),length=elbow.getWorldPosition(new THREE.Vector3()).distanceTo(hand.getWorldPosition(new THREE.Vector3()));
 const dir=target.clone().sub(start),d=THREE.MathUtils.clamp(dir.length(),Math.abs(a-length)+.0001,a+length-.0001);dir.normalize();
 const pole=(Array.isArray(lift)?new THREE.Vector3(...lift):new THREE.Vector3(side==='R'?-1:1,lift,0)).transformDirection(avatar.root.matrixWorld);
 pole.addScaledVector(dir,-pole.dot(dir)).normalize();
 const along=(a*a-length*length+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 aim(shoulder,elbow,start.clone().addScaledVector(dir,along).addScaledVector(pole,height));
 aim(elbow,hand,start.clone().addScaledVector(dir,d));
}
/**
 * Both hands on a steering wheel, at nine and three on its rim. `wheel` is {x,y,z,r} in
 * `vehicle`'s frame (world/road-vehicles.js steeringWheel). The wrist goes to the rim, so
 * the mitten closes over it. A gentle drift of the wheel keeps it from looking welded.
 */
export function gripWheel(avatar,vehicle,wheel,time=0){
 avatar.root.updateWorldMatrix(true,true);vehicle.updateWorldMatrix(true,false);
 const steer=Math.sin(time*.7)*.05+Math.sin(time*1.9)*.02;
 const rim=a=>vehicle.localToWorld(new THREE.Vector3(wheel.x+Math.cos(a)*wheel.r,wheel.y+Math.sin(a)*wheel.r,wheel.z));
 const three=rim(steer),nine=rim(Math.PI+steer);
 // Each hand takes the side of the rim nearer its own shoulder, whichever way round the
 // vehicle has turned the body.
 const left=avatar.bones.shoulderL.getWorldPosition(new THREE.Vector3());
 const leftTakesThree=left.distanceTo(three)<left.distanceTo(nine);
 reach(avatar,leftTakesThree?three:nine,'L');
 reach(avatar,leftTakesThree?nine:three,'R');
}
/** Keep the rim/morsel at the measured mouth, independent of height or head shape. */
export function poseAvatarConsumption(avatar,lift,food=false,prop=null){
 const {root,measure:m,bones:b}=avatar;root.updateWorldMatrix(true,true);
 const L=faceLayout(avatar.recipe),head=b.head;
 const theta=Math.PI*.28+L.mouthY/256*Math.PI*.58,phi=Math.PI/2-.95+L.mouthX/256*1.9;
 const v=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
 const lips=avatar.pixar?.lipsLocal||new THREE.Vector3(v.x*m.Rh*m.headSX,m.headCentre-m.headY+v.y*m.Rh*m.headSY,v.z*m.Rh*.98+.025*m.k);   // (a Pixar body's own lips, pixar.js)
 const rest=root.localToWorld(new THREE.Vector3(-m.shoulderX-m.hand*.4,m.shoulderY-m.upper-m.fore*.55,m.depth*.75));
 const q=root.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),drinkTilt(prop,lift,food)));
 // (what meets the lips: the cartoon's rim at its centre (its lips point stands off its big head); a Pixar body's lips are
 // its own skin, so the rim's near edge comes to them and the glass stands in front of the face, not through the cheek
 // and chin: the owner, 27 October 2026, "the arm gets stuck in his head")
 // (the edge nearest the face is behind the glass's axis, toward the body (-z, the body faces +z): it was +z, the far
 // edge, so the near edge and the rim went under the chin toward the throat: the owner, 27 October 2026, "do you look at
 // the screenshots? Look and correct")
 const rimNear=avatar.pixar&&!food?-(prop?.userData.grip?.radius??.039)*.9:0;
 const held=!food&&prop?fingerHold(avatar,prop):null,heldQ=held?jugTurn(q):null,heldHandQ=held?heldQ.clone().multiply(HOLD_Q):null;
 // (a jug held by its handle hangs its base a hand's height under the fist: the resting hand comes up and forward so the
 // base clears the thighs; at the lap it went into Thuận's)
 if(held){const base=held.centre.clone().applyQuaternion(heldHandQ).sub(held.barAt.clone().applyQuaternion(heldQ)),below=Math.max(0,-base.y),up=new THREE.Vector3(0,1,0),fwd=new THREE.Vector3(0,0,1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  rest.addScaledVector(up,Math.max(0,below-.05)).addScaledVector(fwd,.06);}
 // (with finger bones: from the wrist to the jug's base is the fingers' hollow less the bar's place on the jug; then the rim)
 const contact=held?held.centre.clone().applyQuaternion(heldHandQ).sub(held.barAt.clone().applyQuaternion(heldQ)).add(new THREE.Vector3(0,prop.userData.rimHeight??.15,rimNear).applyQuaternion(q))
  :(food?new THREE.Vector3(0,.04,.115):palm(m).add(drinkGrip(prop,m)).add(new THREE.Vector3(0,prop?.userData.rimHeight??.15,rimNear))).applyQuaternion(q);
 // Short arms and large custom heads still meet the drink. Start from a
 // reachable resting hand, then lean gently; any remaining reach is met by
 // bringing the head towards the hand instead of turning it through a right angle.
 const shoulder=b.shoulderR.getWorldPosition(new THREE.Vector3());
 const span=(m.upper+m.fore)*.985;
 if(rest.distanceTo(shoulder)>span*.95)rest.sub(shoulder).setLength(span*.95).add(shoulder);
 const initialPitch=head.rotation.x;
 let target=null;
 for(let pass=0;pass<12;pass++){
  head.updateWorldMatrix(true,false);
  target=rest.clone().lerp(head.localToWorld(lips.clone()).sub(contact),lift);
  const over=target.distanceTo(shoulder)-span;
  if(over<=.0005||lift<.01)break;
  const pitch=Math.min(initialPitch+.30*lift,head.rotation.x+Math.min(.12,over/(m.Rh*1.1)));
  if(pitch===head.rotation.x)break;
  head.rotation.x=pitch;
 }
 head.updateWorldMatrix(true,false);
 target=rest.clone().lerp(head.localToWorld(lips.clone()).sub(contact),lift);
 if(lift>.01&&target.distanceTo(shoulder)>span){
  const reachable=target.clone().sub(shoulder).setLength(span).add(shoulder);
  const shift=reachable.clone().sub(target).multiplyScalar(1/lift);
  head.position.copy(head.parent.worldToLocal(head.getWorldPosition(new THREE.Vector3()).add(shift)));
  head.updateWorldMatrix(true,false);
  target=rest.clone().lerp(head.localToWorld(lips.clone()).sub(contact),lift);
 }
 // (a Pixar body's elbow hangs below the shoulder as it drinks, the cartoon's short arm goes out to the side)
 reach(avatar,target,'R',avatar.pixar?[-.45,-1,.25]:-.25);
 // The vessel sits inside the hand, where the thumb can close on it, rather
 // than hanging outside the wrist. Keep the palm level throughout the sip.
 if(held)alignDrinkHand(avatar,heldHandQ);
 else if(!food)alignDrinkHand(avatar,q);
 else{b.handR.quaternion.copy(b.handR.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));b.handR.updateWorldMatrix(false,true);}
}
/** A drink is gripped in the palm (drinkGrip), clear of the arm; its base remains upright. */
export function fitAvatarHeldProp(avatar,prop,lift=0,side='R'){
 const food=!!prop.userData.food,m=avatar.measure,hand=avatar.bones['hand'+side];
 avatar.pixar?.grip?.(side,food?.35:1);   // (a hand with fingers closes on a glass, half on a morsel's sticks)
 avatar.root.updateWorldMatrix(true,true);
 const q=avatar.root.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),drinkTilt(prop,lift,food)));
 const held=!food?fingerHold(avatar,prop,side):null;
 if(held){
  // (the jug's bar in the fist: the hand turned onto the handle, the jug placed so its bar lies in the fingers' hollow;
  // the beer's surface levelled after, table-drink.js levelHeldDrink)
  const jq=jugTurn(q),hq=jq.clone().multiply(HOLD_Q);alignDrinkHand(avatar,hq,side);
  const p=hand.getWorldPosition(new THREE.Vector3()).add(held.centre.clone().applyQuaternion(hq)).sub(held.barAt.clone().applyQuaternion(jq));
  const world=new THREE.Matrix4().compose(p,jq,new THREE.Vector3(1,1,1));
  prop.matrixAutoUpdate=false;prop.matrix.copy(hand.matrixWorld).invert().multiply(world);prop.matrixWorldNeedsUpdate=true;
  prop.updateMatrixWorld(true);prop.userData.tableDrinkFluid?.update(prop.userData.portion??1);
  return;
 }
 if(!food)alignDrinkHand(avatar,q,side);
 const p=food?hand.getWorldPosition(new THREE.Vector3()):hand.localToWorld(palm(m)).add(drinkGrip(prop,m,side).applyQuaternion(q));
 const world=new THREE.Matrix4().compose(p,q,new THREE.Vector3(1,1,1));
 // A right-hand mug's handle faces the right hand (negative avatar X).
 // Its authored handle faces +X, so turn its orientation for the right hand.
 if(!food&&side==='R')world.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
 prop.matrixAutoUpdate=false;prop.matrix.copy(hand.matrixWorld).invert().multiply(world);prop.matrixWorldNeedsUpdate=true;
}
