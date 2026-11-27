import * as THREE from '../../vendor/three.module.js';
import DRINK_CAN_MOTION from './motions/drink-can.js';
import {normalizeMotion,sampleTrack} from './motion.js';
import {HAND,handPoint} from './build.js';
import {canSocket,lowerLip,reach} from './consume.js';
import {liftTab} from './open-can.js';
import {pocketSpot} from './story-props.js';

/**
 * A can opened and drunk as it was animated in Blender (tools/blender/drink-can.py; the owner, 27 November 2026: "You need
 * to animate the beer drinking in blender and bring it to the game after, the rigging might need improvement").
 *
 * The motion (motions/drink-can.js) is Johansson's body from the waist up, keyed pose to pose and baked to the game's bones:
 * the opening at the lower chest (the left forefinger hooked under the ring, the ring lifted, the tab torn off and put in
 * the shirt's pocket), then the drink in two pulls (anticipation, the arc up with the elbow rising out, the rim on the lower
 * lip at 40 degrees, deep at 75 with the head back and the eyes shut, the swallows, a breath, the second pull right up, a
 * breath out and a smile, the settle); then a sip, for a resident drinking a can already open. The hands' shapes, the face's
 * cues, the contacts and the events come with it.
 *
 * Played over the animator's pose, blended in and out (the legs and the hips stay as the game stands or seats the body). The
 * can is in the right hand's socket (consume.js canSocket) all through. For a body that is not Johansson's, the arm is put
 * right where a contact the motion keeps is on (the rim on the lip, the hooked forefinger on the ring): the wrist moved by
 * what is off, the hand's turn kept (`fix` says how far, metres, for the tests).
 */
export const DRINK_CAN=normalizeMotion(DRINK_CAN_MOTION);
const M=DRINK_CAN,T=M.times,END=T.at(-1);
/** Where each part of it is (seconds): the whole of it for a sealed can, the drink for an open one, a sip for a resident. */
export const CAN_PARTS=Object.freeze({open:[0,M.markers.drinkEnd],drink:[M.markers.drink,M.markers.drinkEnd],sip:[M.markers.sip,END]});
const tracks=Object.entries(M.joints).map(([name,data])=>[name,new THREE.QuaternionKeyframeTrack(name+'.quaternion',T,data).createInterpolant()]);
const _q=new THREE.Quaternion(),_v=new THREE.Vector3(),_w=new THREE.Vector3(),_m=new THREE.Quaternion();
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
const pockets=new WeakMap(),lips=new WeakMap();
/** Where a ring the hooked left forefinger lifts lies, in the left hand bone's frame (build.js HAND.hookAt). */
const hookLocal=avatar=>new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt));
/** This body's lower lip in its head's frame (consume.js lowerLip: found on the drawn head once, the head is not re-drawn). */
const lipOf=avatar=>lips.get(avatar)||lips.set(avatar,lowerLip(avatar).lower.clone()).get(avatar);
/** The can's rim on the side of its opening, where the lip goes (izakaya-serving-visuals.js 'can', in its frame: a 190 g
 *  can is drawn smaller, its grip and rim measured as drawn, commerce/bought-can.js). */
export const canRim=prop=>new THREE.Vector3(0,(prop?.userData?.rimHeight??.124)-.003,(prop?.userData?.grip?.radius??.033)*.91);

/** The motion's cues at time t (seconds): the hands' closing, the face's, the contacts' weights, what is left. */
export function canCues(t){
 const s=d=>sampleTrack(M,d,t);
 return {closeR:s(M.shapes.closeR),closeL:s(M.shapes.closeL),hookL:s(M.shapes.hookL),blink:s(M.face.blink),breath:s(M.face.breath),smile:s(M.face.smile),
  look:s(M.face.look),tab:s(M.prop.tab),lip:s(M.contact.lip),ring:s(M.contact.ring),mouth:s(M.contact.mouth),pocket:s(M.contact.pocket),fill:M.fill?s(M.fill):1};
}

/** The events between two times (exclusive, inclusive): what happens to the tab. */
export function canEvents(from,to){return M.events.filter(e=>e.t>from&&e.t<=to).map(e=>e.name);}

/** A path's point at time t ([x, y, z] a sample). */
function pathAt(data,t){
 if(t<=T[0])return new THREE.Vector3().fromArray(data,0);if(t>=END)return new THREE.Vector3().fromArray(data,data.length-3);
 let lo=0,hi=T.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(T[mid]<=t)lo=mid;else hi=mid;}
 return new THREE.Vector3().fromArray(data,lo*3).lerp(new THREE.Vector3().fromArray(data,hi*3),(t-T[lo])/(T[hi]-T[lo]));
}
/** The motion's joints at time t over the pose the bones have, by `w` (0 the animator's own, 1 the motion's). */
function poseAt(avatar,t,w){
 for(const [name,track] of tracks){const b=avatar.bones[name];if(!b)continue;_q.fromArray(track.evaluate(Math.max(0,Math.min(END,t))));b.quaternion.slerp(_q,w);}
 avatar.root.updateMatrixWorld(true);
}

/** The arm `side` moved so the point `at` of its hand (world, moving with the hand) goes to `goal`, by `w`; the hand's own
 *  turn in the world kept (what it holds is where it is to be), or (`keepWorld` false) its turn at the wrist. How far it was
 *  off (metres). */
function bring(avatar,side,pt,goal,w,keepWorld=true,firm=1){
 const hand=avatar.bones['hand'+side],point=()=>pt?hand.localToWorld(pt.clone()):hand.getWorldPosition(new THREE.Vector3());
 const at=point(),off=_v.copy(goal).sub(at),d=off.length();if(d<1e-5||w<=0)return d;
 const aim=at.clone().addScaledVector(off,w);
 const handLocal=hand.quaternion.clone(),k0=keepWorld===true?1:keepWorld===false?0:keepWorld;let k=k0;
 hand.getWorldQuaternion(_m);const keep=_m.clone(),elbow=avatar.bones['elbow'+side].getWorldPosition(new THREE.Vector3()),shoulder=avatar.bones['shoulder'+side].getWorldPosition(new THREE.Vector3());
 // (the elbow kept on the side it is: its way from the line from the shoulder to the wrist)
 const wrist=hand.getWorldPosition(new THREE.Vector3()),to=wrist.clone().addScaledVector(off,w),line=to.clone().sub(shoulder).normalize(),out=elbow.clone().sub(shoulder);out.addScaledVector(line,-out.dot(line));
 const pole=out.lengthSq()>1e-8?out.normalize():new THREE.Vector3(side==='R'?-1:1,0,0),inv=avatar.root.matrixWorld.clone().invert();
 const pose=(a,turn=true)=>{const p=pole.clone().applyAxisAngle(line,a).transformDirection(inv);const local=hand.quaternion.clone();reach(avatar,to,side,[p.x,p.y,p.z]);
  // (keepWorld: 1 the hand's turn in the world kept, 0 its turn at the wrist, or between)
  if(turn)hand.quaternion.copy(handLocal).slerp(hand.parent.getWorldQuaternion(_m).invert().multiply(keep),k);else hand.quaternion.copy(local);
  twistIntoForearm(avatar,side);};
 // (where the hand's turn in the world is kept, the elbow is turned about the line from the shoulder as little as will do
 // to keep the wrist within what a wrist does: a body built narrower holds the same can with its elbow a little out)
 // (and where the turn need not be held exactly, `firm` less than 1, let go toward the wrist's own as far as that does)
 let best=0;
 if(k0>0)for(const ease of [1,.5,0]){k=Math.min(k0,firm)+(k0-Math.min(k0,firm))*ease;let least=Infinity;
  for(const a of [0,.2,-.2,.4,-.4,.7,-.7,1,-1]){pose(a);const x=wristExcess(hand.quaternion,side);if(x<least-1e-4){least=x;best=a;}if(x<1e-4)break;}
  if(least<.02)break;}
 pose(best);
 // (a hand turned other than it was carries its point elsewhere: the wrist moved again for it, the turn at the wrist kept)
 for(let i=0;i<2&&pt;i++){const miss=aim.clone().sub(point());if(miss.length()<2e-4)break;to.add(miss);pose(best,false);}
 return d;
}
/** The hand's turn about the forearm's line moved into the forearm (the elbow's own twist, as the game turns it, and as
 *  tools/blender/drink-can.py bakes it): the hand's turn in the world is the same, the wrist bends and does not wring. */
function twistIntoForearm(avatar,side){
 const hand=avatar.bones['hand'+side],elbow=avatar.bones['elbow'+side],a=hand.position.clone().normalize(),q=hand.quaternion;
 const d=q.x*a.x+q.y*a.y+q.z*a.z,t=new THREE.Quaternion(a.x*d,a.y*d,a.z*d,q.w);if(t.lengthSq()<1e-12)return;t.normalize();
 elbow.quaternion.multiply(t);hand.quaternion.premultiply(t.invert());elbow.updateWorldMatrix(false,true);
}
/** How far a wrist (the hand's turn at it) is past what a wrist does (animate.js PALM.wrist, the right hand's terms; the
 *  left's turns about y and z are the right's mirror), radians, all its ways added. */
const WRIST=[[-.35,.5],[-.45,.45],[-1.1,1.25]],_e=new THREE.Euler();
export function wristExcess(q,side){
 _e.setFromQuaternion(q,'XYZ');const v=[_e.x,side==='R'?_e.y:-_e.y,side==='R'?_e.z:-_e.z];
 return v.reduce((sum,x,i)=>sum+Math.max(0,WRIST[i][0]-x,x-WRIST[i][1]),0);
}

/**
 * The can drunk at time t (seconds into the motion), over the pose the animator has made, by `w`: the body from the waist
 * up as animated; the can in the right hand's socket; the rim brought onto this body's lower lip, and the hooked forefinger
 * onto the ring, where the motion keeps them. Returns the cues (canCues) and how far each contact was put right (`fix`).
 */
export function playCanDrink(avatar,prop,t,w=1){
 const cues=canCues(t),fix={lip:0,ring:0,pocket:0,R:0,L:0};
 if(w<=0)return {...cues,fix};
 poseAt(avatar,t,w);
 // each wrist where the animated body's was, in this body's size, from its chest (a narrower body's arms, turned as his
 // were, crossed in front of it): the arm put there, the hand's turn kept
 if(M.reach){const chest=avatar.bones.chest,k=avatar.measure.k;
  // (and the right one, as it goes to the mouth, from this body's lower lip: a bigger head's is further out)
  const mouth=M.reach.mouth?sampleTrack(M,M.contact.mouth,t):0,lip=mouth>0?lipOf(avatar):null;
  for(const side of ['R','L']){const goal=chest.localToWorld(pathAt(M.reach[side],t).multiplyScalar(k));
   if(side==='R'&&mouth>0)goal.lerp(avatar.bones.head.localToWorld(pathAt(M.reach.mouth,t).multiplyScalar(k).add(lip)),mouth);
   // (the right hand's turn in the world kept, the can tipped as it was animated; the left's at the wrist, the arm being
   // another body's and the hand turning with it as a hand does, but for while it is hooked on the ring)
   fix[side]=bring(avatar,side,null,goal,w,side==='R'?1:cues.ring,side==='R'?cues.lip:cues.ring*.4);}}
 if(prop)placeCan(avatar,prop);
 if(prop&&cues.lip>0){
  // the rim on the lip: this body's lip, the rim where the hand has put it
  const lip=avatar.bones.head.localToWorld(lipOf(avatar).clone()),rim=prop.localToWorld(canRim(prop));
  fix.lip=bring(avatar,'R',avatar.bones.handR.worldToLocal(rim.clone()),lip,cues.lip*w);placeCan(avatar,prop);
 }
 const S=prop?.userData?.sealed;
 if(S&&!S.off)liftTab(prop,cues.tab);
 if(S&&!S.off&&cues.ring>0){
  // the hooked forefinger on the ring (lifted with the tab, open-can.js liftTab)
  const hook=avatar.bones.handL.localToWorld(new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt))),ring=S.tab.localToWorld(S.ring.clone());
  S.lastFix=ring.clone().sub(hook).multiplyScalar(cues.ring*w);S.lastFixAt=t;
  fix.ring=bring(avatar,'L',hookLocal(avatar),ring,cues.ring*w,true,.4);
 }else if(S?.off&&!S.done&&cues.pocket>0){
  // the tab to this body's own shirt pocket (story-props.js pocketSpot: where the torch is clipped), a little in at its mouth
  const pocket=pockets.get(avatar)||pockets.set(avatar,pocketSpot(avatar).position.clone()).get(avatar);
  const hook=avatar.bones.handL.localToWorld(new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt)));
  fix.pocket=bring(avatar,'L',hookLocal(avatar),avatar.bones.chest.localToWorld(pocket.clone()),cues.pocket*w,true,0);
 }else if(S?.lastFix&&t>S.lastFixAt&&t<S.lastFixAt+.25){
  // (torn off: what the hand was put right by on the ring, let go over a quarter of a second, not at once)
  const f=1-smooth((t-S.lastFixAt)/.25),hand=avatar.bones.handL.getWorldPosition(new THREE.Vector3());
  fix.ring=bring(avatar,'L',null,hand.clone().add(S.lastFix),f,true,0);
 }
 return {...cues,fix};
}

/** The can in the right hand's socket (the hand is where the motion has put it). */
export function placeCan(avatar,prop){
 const S=canSocket(avatar.measure,prop,'R');
 if(prop.parent!==avatar.bones.handR)avatar.bones.handR.add(prop);
 prop.matrixAutoUpdate=false;prop.matrix.compose(S.position,S.quaternion,_w.set(1,1,1));prop.matrixWorldNeedsUpdate=true;prop.updateMatrixWorld(true);
}
