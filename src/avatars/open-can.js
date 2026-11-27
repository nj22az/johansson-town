import * as THREE from '../../vendor/three.module.js';
import {reach,fitAvatarHeldProp} from './consume.js';
import {handHold} from './build.js';
import {pocketSpot} from './story-props.js';

/**
 * A can opened before it is drunk (the owner, 27 November 2026: "A can needs to be opened also, removing the tab").
 * The right hand holds the sealed can up in front of the chest (animate.js OpenCan) and the head looks down at it; the
 * left hand comes over it, hooks the ring of its pull tab (izakaya-serving-visuals.js, sealed) in its fingers, lifts it
 * and pulls it back over the opening until the tongue tears away whole, and the opening shows. The tab is not dropped:
 * it goes into his shirt's chest pocket, on the left, to be thrown away with the empty can, and the hand comes back.
 *
 * Times are seconds into the move. The left hand's hollow (build.js handHold: where a closed hand holds a bar) is what
 * goes to the ring and carries the tab; the arm is solved to it (consume.js reach) over the move's own pose, blended in
 * and out, so the hand comes from where it was and goes back there.
 */
export const OPEN_CAN=Object.freeze({
 duration:1.7,
 come:[.08,.36],     // the hand over the can, a hand's length above the ring
 onto:[.3,.46],      // down onto the ring
 take:[.42,.56],     // the fingers close on it
 lift:[.5,.74],      // the ring lifted about the tongue's front end, the hand with it
 off:.74,            // the tongue tears away: the tab in the hand, the opening shown
 pull:[.74,.98],     // the tab drawn up and away over the can's front
 pocket:[.98,1.36],  // to the shirt's chest pocket
 drop:1.36,          // in the pocket: gone; the hand opens
 back:[1.36,1.7],    // the hand back where the move holds it
 closed:.8,          // how far the hand closes on the ring: the fingers hooked in it, not a fist
 liftAngle:.55,      // how far the ring is lifted before the tongue tears (radians, about its front end)
});
const smooth=(t,a,b)=>THREE.MathUtils.smoothstep(t,a,b);
/** How far the left hand is closed `t` seconds into the move (animate.js closes it, with the move's other hand wishes). */
export function openCanGrip(t){const T=OPEN_CAN;return T.closed*smooth(t,T.take[0],T.take[1])*(1-smooth(t,T.drop,T.drop+.12));}

const X=new THREE.Vector3(1,0,0),UP=new THREE.Vector3(0,1,0),_q=new THREE.Quaternion();
/** Where the tongue's front end is, in the can's frame: what the ring is lifted about. */
const PIVOT=new THREE.Vector3(0,.121,.023);

function hollow(avatar){return new THREE.Vector3(...handHold(avatar.measure,.0017).at);}
/** The left hand's hollow to `goal` (world), from where the move put it, by `w` (0 the move's own pose, 1 the goal). */
function handTo(avatar,goal,w){
 const hand=avatar.bones.handL,local=hollow(avatar);
 avatar.root.updateWorldMatrix(true,true);
 const rest=hand.localToWorld(local.clone()),aim=rest.clone().lerp(goal,w);
 // (the wrist so that the hollow, down the fingers, lands on the goal: twice, as the hand turns with the forearm)
 for(let i=0;i<2;i++){
  hand.getWorldQuaternion(_q);const wrist=aim.clone().sub(local.clone().applyQuaternion(_q));
  reach(avatar,wrist,'L',[1,-.6,-.2]);avatar.root.updateWorldMatrix(true,true);
 }
}
/** Where the can's top is held while it is opened, in the body's frame: in front of the chest, a little to the right of
 *  its middle, where the left hand reaches it with the elbow bent (a toy body's arms are short for its head: held at the
 *  right shoulder, as a drink is held at rest, the can was 8 cm past Johansson's left hand). */
const CAN_AT=m=>new THREE.Vector3(-.035*m.k,m.chestY-.03*m.k,m.depth/2+.16*m.k);
/** The right hand placed so the can's top is at CAN_AT, from where the move put it, by `w`; the can fitted to it again. */
function canTo(avatar,prop,w){
 if(w<=0)return;
 const hand=avatar.bones.handR,topOf=()=>prop.localToWorld(new THREE.Vector3(0,prop.userData.rimHeight??.124,0));
 avatar.root.updateWorldMatrix(true,true);
 // (between where the move put it and the goal; then the arm solved to it, twice, as the can turns with the hand)
 const aim=topOf().lerp(avatar.root.localToWorld(CAN_AT(avatar.measure)),w);
 for(let i=0;i<2;i++){
  const wrist=hand.getWorldPosition(new THREE.Vector3());
  reach(avatar,wrist.add(aim.clone().sub(topOf())),'R');avatar.root.updateWorldMatrix(true,true);fitAvatarHeldProp(avatar,prop,0);
  avatar.root.updateWorldMatrix(true,true);
 }
}
/** The tab gone from the can for good: in the pocket, or (a move cut short) torn off and put away at once. */
function putAway(S){S.tab.removeFromParent();S.tab.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});S.opening.visible=true;S.done=true;}

/** The opening, `t` seconds into the move, after the right hand and the can are placed (actors.js, fitAvatarHeldProp). */
export function openCan(avatar,prop,t){
 const S=prop?.userData?.sealed;if(!S)return;
 const T=OPEN_CAN,hand=avatar.bones.handL;
 // the can up in front of him for the whole move, eased in and out
 canTo(avatar,prop,smooth(t,0,.3)*(1-smooth(t,T.back[0],T.duration)));
 avatar.root.updateWorldMatrix(true,true);
 if(!S.off){
  // the ring lifted about the tongue's front end (the tab's own frame is the can's)
  const a=T.liftAngle*smooth(t,T.lift[0],T.lift[1]);S.tab.quaternion.setFromAxisAngle(X,a);S.tab.position.copy(PIVOT).sub(PIVOT.clone().applyAxisAngle(X,a));
  S.tab.updateWorldMatrix(true,false);
  const ring=S.tab.localToWorld(S.ring.clone()),over=ring.clone().addScaledVector(UP,.06*avatar.measure.k);
  if(t>=T.off){
   // the tongue tears away: the tab in the fingers from here, where they hold it
   handTo(avatar,ring,1);hand.attach(S.tab);S.opening.visible=true;S.off=ring.clone();
   prop.getWorldQuaternion(_q);S.front=new THREE.Vector3(0,0,1).applyQuaternion(_q).setY(0).normalize();
   // (the pocket's mouth, in the chest's frame: worked out once, the body's shape is not)
   const p=pocketSpot(avatar);S.pocket=p.position.clone().addScaledVector(p.normal,.012*avatar.measure.k);
  }else{
   const goal=over.clone().lerp(ring,smooth(t,T.onto[0],T.onto[1]));
   handTo(avatar,goal,smooth(t,T.come[0],T.come[1]));return;
  }
 }
 // up and away over the can's front, then to the chest pocket, then the hand back
 const up=S.off.clone().addScaledVector(UP,.07*avatar.measure.k).addScaledVector(S.front,.025*avatar.measure.k);
 const pocket=avatar.bones.chest.localToWorld(S.pocket.clone());
 let goal=S.off.clone().lerp(up,smooth(t,T.pull[0],T.pull[1]));
 if(t>T.pull[1])goal=up.clone().lerp(pocket,smooth(t,T.pocket[0],T.pocket[1]));
 if(t>=T.drop&&!S.done)putAway(S);
 handTo(avatar,goal,1-smooth(t,T.back[0],T.back[1]));
}
/** A move cut short (he walked off, or another move began): the can is opened all the same, the tab put away. */
export function finishOpening(prop){const S=prop?.userData?.sealed;if(!S||S.done)return;putAway(S);}
