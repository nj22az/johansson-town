import * as THREE from '../../vendor/three.module.js';
import {reach,drinkGrip} from './consume.js';

/**
 * Hands at work behind a counter (people/izakaya-bar.js): each hand goes to what it is working on and holds what it
 * took, so a glass or a bottle is in the hand that took it, never in front of an empty one.
 *
 * `u.workHands[side]` says where the hand goes, eased by `w` (0 the body's own pose, 1 there):
 *   {reach:object}  round the object where it stands, the palm on its body (consume.js drinkGrip);
 *   {to:[x,y,z]}    the palm on a point: a tap's lever, a door's pull;
 *   {place:[x,y,z]} what the hand holds set down with its base on the point;
 *   {pour:object}   what the hand holds tipped by `tilt` with its spout over the object's rim;
 *   {rest:true}     hanging still at her side, out of the furniture she works at (no walking swing);
 *   {keep:true,up}  where it is now, going with her body (raised by `up`): just taken, as she steps back;
 *   {carry:true,forward} what the hand holds in front, the forearm level; wider dishes get extra clearance.
 * `u.workAvoid` are boxes ([min, max] in the world) the hands go over and never through: a worktop at her chest is
 * reached over its edge, and a hand comes back out over the edge before it drops to her side.
 * `u.workHeld[side]` is what that hand holds: it is taken into the hand as it is (it was reached for), and the palm
 * stays level unless it pours, so a glass stays upright wherever she walks.
 */
const X=new THREE.Vector3(1,0,0),_q=new THREE.Quaternion(),_p=new THREE.Quaternion(),_t=new THREE.Quaternion(),_m=new THREE.Matrix4();
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3();
const palm=m=>new THREE.Vector3(0,-m.hand*.55,0);
/** The hand's world rotation: the body's facing, tipped forward by `tilt` to pour. */
function handRotation(avatar,tilt=0,out=new THREE.Quaternion()){return avatar.root.getWorldQuaternion(out).multiply(_t.setFromAxisAngle(X,tilt));}
/** Where the wrist goes for the palm to close on `object` standing as it is. */
export function wristToHold(avatar,object,side='R'){
 const m=avatar.measure,q=handRotation(avatar,0,_q),base=object.localToWorld(_a.set(...(object.userData.gripAt||[0,0,0])));
 return base.sub(palm(m).add(drinkGrip(object.userData.workGrip?{userData:{grip:object.userData.workGrip}}:object,m,side)).applyQuaternion(q));
}
/** Where the wrist goes for the held object's local point `local` to be at world `target`, the hand turned by `tilt`. */
export function wristForHeld(avatar,held,local,target,tilt=0){
 const q=handRotation(avatar,tilt,_q);
 // The held object's place in the hand is fixed once taken: its matrix is the hand's frame.
 const inHand=_b.set(...local).applyMatrix4(_m.compose(held.position,held.quaternion,held.scale));
 return _c.copy(target).sub(inHand.applyQuaternion(q));
}
/** The next point on the way to `to`: up before going over a box, out over its edge before coming down. */
const _box=new THREE.Box3();
function detour(from,to,avoid,below=0){
 for(const [a,b] of avoid||[]){
  // `below`: how far what the hand holds hangs under the wrist; that is carried over the top too.
  const inside=p=>p.x>a[0]-.05&&p.x<b[0]+.05&&p.z>a[2]-.05&&p.z<b[2]+.05,over=b[1]+.05+below;
  if(!inside(from)&&inside(to)&&from.y<over-.005)return _d.set(from.x,over+.01,from.z);
  if(inside(from)&&from.y<over-.005)return _d.set(from.x,over+.01,from.z);
  if(inside(from)&&!inside(to)&&to.y<over)return _d.set(to.x,Math.max(from.y,over+.01),to.z);
 }
 return to;
}
const _d=new THREE.Vector3(),_e=new THREE.Vector3();
/**
 * Each hand eases to its goal (and back to the body's own pose when it has none), so changing from reaching to
 * carrying, or letting go, never jumps. About 95 % of the way in 0.3 s.
 */
export function workHands(avatar,u,dt=1/60){
 const W=u.workHands,state=avatar.workHands??={};if(!W&&!u.workHeld&&!state.R&&!state.L)return;
 avatar.root.updateWorldMatrix(true,true);const k=1-Math.exp(-10*Math.max(0,dt)),m=avatar.measure,b=avatar.bones;
 for(const side of ['R','L']){
  const h=W?.[side],hand=avatar.bones['hand'+side],held=u.workHeld?.[side]||null,own=hand.getWorldPosition(_b),sg=side==='R'?-1:1;
  if(!state[side]&&!h&&!held)continue;
  const at=state[side]??={wrist:own.clone(),tilt:0};if(!h?.keep)delete at.kept;
  at.tilt+=((h?.tilt||0)-at.tilt)*k;let target=null;
  if(h){
   if(h.reach)target=wristToHold(avatar,h.reach,side);
   else if(h.to)target=_c.set(...h.to).sub(palm(m).applyQuaternion(handRotation(avatar,0,_q)));
   // Set down a few millimetres above the surface: letting go settles it there (izakaya-bar.js release), never into it.
   else if(h.place&&held)target=wristForHeld(avatar,held,held.userData.gripAt||[0,0,0],_a.set(...h.place).add(_e.set(0,.006,0)),0);
   else if(h.pour&&held){
    // The spout over the glass's rim: held a bottle's length above it while upright, down to the rim as it tips, so
    // the bottle never dips into the glass or the worktop on the way.
    const rim=h.pour.localToWorld(_a.set(...(h.pour.userData.pourAt||[0,h.pour.userData.rimHeight??.1,0]))),spout=held.userData.spout||[0,.2,0];
    rim.y+=.03+spout[1]*Math.cos(Math.min(at.tilt,Math.PI/2));target=wristForHeld(avatar,held,spout,rim,at.tilt);
   }
   else if(h.rest)target=avatar.root.localToWorld(_c.set(sg*(m.shoulderX+m.armR*.6),m.shoulderY-(m.upper+m.fore)*.92,.01));
   else if(h.keep){
    // Held where it is, as part of her: the hand goes with her body when she steps back (a few centimetres up first).
    at.kept??=avatar.root.worldToLocal(at.wrist.clone()).add(_e.set(0,h.up||0,0));target=avatar.root.localToWorld(_c.copy(at.kept));
   }
   else if(h.carry){
    target=avatar.root.localToWorld(_c.set(sg*(m.shoulderX*.55),m.shoulderY-m.upper*.95,m.depth*.5+m.fore*.55+(h.forward||0)));
    // Stepping in to a worktop with something in hand: it is carried up over the top first.
    if(h.high!=null&&held){const under=held.parent===hand?hand.getWorldPosition(_e).y-_box.setFromObject(held).min.y:.12;target.y=Math.max(target.y,h.high+under);}
   }
  }
  // With no goal the hand goes home to the body's pose, and stops being steered once it is there.
  const below=held&&held.parent===hand?Math.max(0,hand.getWorldPosition(_e).y-_box.setFromObject(held).min.y):0;
  const goal=detour(at.wrist,target||own,u.workAvoid,below);at.wrist.lerp(goal,k);
  if(!target&&!held&&at.wrist.distanceTo(own)<.002){delete state[side];continue;}
  // Out of the arm's reach (the bottle at the front of the back counter, above her shoulder) she rises a little onto
  // her toes (the Shelve move's 2.5 cm, animate.js) and leans in from the chest: only to take, set down, pour or
  // work something, never to carry or hold.
  const shoulder=b['shoulder'+side].getWorldPosition(_c),span=(m.upper+m.fore)*.97,reaching=!!(h&&(h.reach||h.place||h.pour||h.to));
  if(side==='R'){
   const over=reaching?at.wrist.distanceTo(shoulder)-span:0,up=reaching?THREE.MathUtils.clamp((at.wrist.y-shoulder.y)/.12,0,1):0;
   at.lean=(at.lean||0)+(THREE.MathUtils.clamp(over/.25,0,1)-(at.lean||0))*k;at.toes=(at.toes||0)+(Math.max(up,at.lean)-(at.toes||0))*k;
   if(at.lean>.001||at.toes>.001){b.chest.rotation.x+=.55*at.lean;b.root.position.y+=.025*at.toes;b.footL.rotation.x+=.22*at.toes;b.footR.rotation.x+=.22*at.toes;avatar.root.updateWorldMatrix(true,true);}
  }
  // Over furniture at her chest the elbow goes up while the hand is high, so the arm stays above the top it reaches
  // over (out, up and back: the elbow clears the back counter's slate, which is above her shoulder); on the way down it
  // goes out and back, away from the furniture in front of her.
  const low=at.wrist.y<b['shoulder'+side].getWorldPosition(_c).y-.08;
  // Carrying or at rest, clear of the furniture, the elbow is tucked in at her side, down and a little back.
  const overFurniture=(u.workAvoid||[]).some(([a,b])=>at.wrist.x>a[0]-.12&&at.wrist.x<b[0]+.12&&at.wrist.z>a[2]-.12&&at.wrist.z<b[2]+.12);
  reach(avatar,at.wrist,side,(h?.carry||h?.rest)&&!overFurniture?[sg*.3,-1,-.5]:u.workAvoid?.length?(low?[sg,0,-1.2]:[sg*.5,1.2,-1]):-.25);
  // A level palm (tipped only to pour) keeps what it holds upright.
  const q=handRotation(avatar,at.tilt,_q);hand.quaternion.copy(hand.parent.getWorldQuaternion(_p).invert().multiply(q));hand.updateWorldMatrix(false,true);
  // Take the held thing into the levelled hand as it is now: the hand was brought to it.
  if(held&&held.parent!==hand)hand.attach(held);
 }
}
