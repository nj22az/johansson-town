import * as THREE from '../../vendor/three.module.js';
import DRINK_CAN_MOTION from './motions/drink-can.js';
import {normalizeMotion,sampleTrack} from './motion.js';
import {HAND,handPoint,measure} from './build.js';
import {recipeFor} from './cast.js';
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
const pockets=new WeakMap(),lips=new WeakMap(),chosen=new WeakMap();
/** The body the motion was made on (tools/blender/drink-can.py writes its name and size into `props.can.made`): the can is
 *  not drawn to a body's size, nor held in its socket in proportion, so a body of another size cannot take the can's part of
 *  the paths in its own proportion (Vy's rim came 25 mm off her lip, her hooked finger 26 mm off the ring, the can 7 mm into
 *  her face). */
let madeOn=null,madePocket=null;
const made=()=>madeOn||(madeOn=measure(recipeFor(M.props?.can?.made?.name||'Nils Johansson')));
/** A contact's weight widened into its approach and its leaving (each sample: the contact's weight in the `reach` seconds
 *  round it, eased): how far a wrist's path is put right for what this body's own can and hand make of the contact, from well
 *  before it is made, so the hand comes to it on its own path and is not pulled onto it at the last. */
function widen(data,reach){
 const out=new Float32Array(data.length);
 for(let i=0;i<data.length;i++){let w=0;for(let j=0;j<data.length&&w<1;j++){const d=Math.abs(T[i]-T[j]);if(d<reach)w=Math.max(w,data[j]*smooth(1-d/reach));}out[i]=w;}
 return out;
}
const RING_NEAR=widen(M.contact.ring,.45),POCKET_NEAR=widen(M.contact.pocket,.35),LIP_NEAR=widen(M.contact.lip,.3);
/** Where a ring the hooked left forefinger lifts lies, in the left hand bone's frame (build.js HAND.hookAt). */
const hookLocal=avatar=>new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt));
/** This body's lower lip in its head's frame (consume.js lowerLip: found on the drawn head once, the head is not re-drawn). */
const lipOf=avatar=>lips.get(avatar)||lips.set(avatar,lowerLip(avatar).lower.clone()).get(avatar);
/** Where the tab goes into this body's shirt pocket, in the chest's frame: the middle of the pocket's mouth (story-props.js
 *  pocketSpot), 12 mm out from the cloth in its size, where the hooked forefinger's pad goes with the tab, its tip not in the
 *  chest (as tools/blender/drink-can.py keys it). */
export const pocketMouth=avatar=>{const p=pocketSpot(avatar);return p.mouth.clone().addScaledVector(p.normal,.012*avatar.measure.k);};
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
/** The motion's joints at time t over the pose the bones have, by `w` (0 the animator's own, 1 the motion's): a number, or
 *  each joint's own (levelWeights). */
function poseAt(avatar,t,w){
 for(const [name,track] of tracks){const b=avatar.bones[name];if(!b)continue;_q.fromArray(track.evaluate(Math.max(0,Math.min(END,t))));b.quaternion.slerp(_q,typeof w==='number'?w:w[LEVEL[name]]);}
 avatar.root.updateMatrixWorld(true);
}

/** The drag hierarchy (docs/ANIMATION-STANDARD.md 3.5): the root, then the chest, head and upper arms, then the forearms
 *  and hands. The move blends in and out level by level, six game frames apart (the root first both ways), not every
 *  joint in the same frame out of the stance the animator had: in, each over 0.25 s (the forearms and hands 0.3 s: the
 *  can comes from a hanging hand no faster than 30 mm a frame), all of it within the motion's still
 *  beat at its start (0.35 s, then the left hand's first key), so the opening's anticipation and the drink's are played
 *  whole; out, each over 0.45 s, from the can settled at his waist. */
const LEVEL={spine:0,chest:1,neck:1,head:1,shoulderL:1,shoulderR:1,elbowL:2,elbowR:2,handL:2,handR:2},APART=.1,IN=.25,IN_HANDS=.3,OUT=.45,APART_OUT=.1;
/** Each level's weight, `blend` {in: seconds since the move began, out: seconds before it ends}. */
export function levelWeights(blend){
 return [0,1,2].map(l=>smooth((blend.in-l*APART)/(l===2?IN_HANDS:IN))*smooth((blend.out-(2-l)*APART_OUT)/OUT));
}
/** What each arm is turned by to fit this body (the reach above, before any contact is put right), taken a little at a time:
 *  the IK that fits another body's arm to the path can turn the elbow 0.04 rad in a frame for a hair's move of the hand (Sverker's
 *  left arm, hanging), which the animator's follow does not smooth, being after it. Two eased followers in turn (a critically
 *  damped follow, about a tenth of a second), so a change sets off and comes to rest softly; started where it is at the move's
 *  start. The contacts are put right after this, exactly. */
const ARM=['shoulder','elbow','hand'],steadied=new WeakMap(),_d=new THREE.Quaternion();
function steady(avatar,side,before,t,much){
 const all=steadied.get(avatar)||steadied.set(avatar,{}).get(avatar),was=all[side],fresh=!was||Math.abs(t-was.t)>.1,now={t,j:[]};
 ARM.forEach((j,i)=>{const b=avatar.bones[j+side],q=_d.copy(b.quaternion).multiply(before[i].clone().invert());if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
  const s=Math.hypot(q.x,q.y,q.z),a=2*Math.atan2(s,q.w),v=s>1e-9?[q.x/s*a,q.y/s*a,q.z/s*a]:[0,0,0];
  const p=fresh?{s1:v,s2:v}:was.j[i],s1=p.s1.map((x,c)=>x+(v[c]-x)*.35),s2=p.s2.map((x,c)=>x+(s1[c]-x)*.35);now.j.push({s1,s2});
  const ang=Math.hypot(...s2),d=ang>1e-9?new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...s2).divideScalar(ang),ang):new THREE.Quaternion();
  b.quaternion.slerp(d.multiply(before[i]),much);});
 all[side]=now;avatar.bones['shoulder'+side].updateWorldMatrix(false,true);
}
/** The bones the motion turns, as they are now: a function that puts them back. */
function held(avatar){
 const was=tracks.map(([name])=>[avatar.bones[name],avatar.bones[name]?.quaternion.clone()]).filter(([b])=>b);
 return ()=>{for(const [b,q] of was)b.quaternion.copy(q);avatar.root.updateMatrixWorld(true);};
}
/** The arm `side` moved so the point `at` of its hand (world, moving with the hand) goes to `goal`, by `w`; the hand's own
 *  turn in the world kept (what it holds is where it is to be), or (`keepWorld` false) its turn at the wrist. How far it was
 *  off (metres). */
function bring(avatar,side,pt,goal,w,keepWorld=true,firm=1,tag=side){
 const hand=avatar.bones['hand'+side],point=()=>pt?hand.localToWorld(pt.clone()):hand.getWorldPosition(new THREE.Vector3());
 const at=point(),off=_v.copy(goal).sub(at),d=off.length();if(w<=0)return d;   // (posed even when it is on its goal: the arm keeps the way it has, not another for a frame)
 const aim=at.clone().addScaledVector(off,w);
 const handLocal=hand.quaternion.clone(),k0=keepWorld===true?1:keepWorld===false?0:keepWorld;let k=k0;
 hand.getWorldQuaternion(_m);const keep=_m.clone(),elbow=avatar.bones['elbow'+side].getWorldPosition(new THREE.Vector3()),shoulder=avatar.bones['shoulder'+side].getWorldPosition(new THREE.Vector3());
 // (the elbow kept on the side it is: its way from the line from the shoulder to the wrist)
 const wrist=hand.getWorldPosition(new THREE.Vector3()),to=wrist.clone().addScaledVector(off,w),line=to.clone().sub(shoulder).normalize(),out=elbow.clone().sub(shoulder);out.addScaledVector(line,-out.dot(line));
 // (where the arm hangs nearly straight that way is all but nothing, and turns over from one frame to the next: steadied by the
 // way an elbow goes when the arm bends, back and out, as much as the arm is straight)
 const bend=new THREE.Vector3(side==='R'?-.4:.4,0,-1).normalize().transformDirection(avatar.root.matrixWorld);bend.addScaledVector(line,-bend.dot(line));
 const pole=out.addScaledVector(bend,.003*avatar.measure.k).normalize(),inv=avatar.root.matrixWorld.clone().invert();
 // (the elbow turned round by as much as the arm is moved: a contact coming on turns it from where it was, not at once)
 const pose=(a,turn=true)=>{const p=pole.clone().applyAxisAngle(line,a*Math.min(1,w)).transformDirection(inv);const local=hand.quaternion.clone();reach(avatar,to,side,[p.x,p.y,p.z]);
  // (keepWorld: 1 the hand's turn in the world kept, 0 its turn at the wrist, or between)
  if(turn)hand.quaternion.copy(handLocal).slerp(hand.parent.getWorldQuaternion(_m).invert().multiply(keep),k);else hand.quaternion.copy(local);
  twistIntoForearm(avatar,side);};
 // (where the hand's turn in the world is kept, the elbow is turned about the line from the shoulder as little as will do
 // to keep the wrist within what a wrist does: a body built narrower holds the same can with its elbow a little out)
 // (and where the turn need not be held exactly, `firm` less than 1, let go toward the wrist's own as far as that does)
 // (the last frame's way tried first (for this arm and this contact, `tag`), and kept while it will do: the elbow is not
 // sent from one side to the other and back between frames for a turn of the wrist a hair less)
 let best=0;const last=(chosen.get(avatar)||chosen.set(avatar,{}).get(avatar))[tag];
 if(k0>0){let kept=false,want=null;
  if(last){k=Math.min(k0,firm)+(k0-Math.min(k0,firm))*last.ease;pose(last.a);kept=wristExcess(hand.quaternion,side)<.02;if(kept)want={a:last.a,ease:last.ease};}
  if(!kept)for(const ease of [1,.5,0]){k=Math.min(k0,firm)+(k0-Math.min(k0,firm))*ease;let least=Infinity;
   for(const a of [0,.2,-.2,.4,-.4,.7,-.7,1,-1]){pose(a);const x=wristExcess(hand.quaternion,side);if(x<least-1e-4){least=x;best=a;}if(x<1e-4)break;}
   want={a:best,ease};if(least<.02)break;}
  // (and a new way taken eased, not in a frame and not at a rate snapped to: the turn about the line and the share of the hand's
  // turn held in the world follow what is wanted as a critically damped spring, at most 0.06 rad and a tenth a frame, its
  // speed changing by at most a fifth of that a frame: they set off and come to rest softly, as the rest of the arm does)
  const c=last?{...last}:{a:want.a,ease:want.ease,va:0,ve:0};
  const follow=(x,v,to,top)=>{const nv=Math.max(-top,Math.min(top,v+Math.max(-top*.2,Math.min(top*.2,.09*(to-x)-.6*v))));return [x+nv,nv];};
  if(last){[c.a,c.va]=follow(last.a,last.va||0,want.a,.06);[c.ease,c.ve]=follow(last.ease,last.ve||0,want.ease,.1);}
  chosen.get(avatar)[tag]=c;best=c.a;k=Math.min(k0,firm)+(k0-Math.min(k0,firm))*c.ease;}
 pose(best);
 // (a hand turned other than it was carries its point elsewhere: the wrist moved again for it, the turn at the wrist kept;
 // up to five times, so a contact lands to a fraction of a millimetre: the torn tab hangs from the finger where it tore)
 for(let i=0;i<5&&pt;i++){const miss=aim.clone().sub(point());if(miss.length()<2e-4)break;to.add(miss);pose(best,false);}
 return d;
}
/** The hand's turn about the forearm's line moved into the forearm (the elbow's own twist, as the game turns it, and as
 *  tools/blender/drink-can.py bakes it): the hand's turn in the world is the same, the wrist bends and does not wring. */
function twistIntoForearm(avatar,side){
 const hand=avatar.bones['hand'+side],elbow=avatar.bones['elbow'+side],a=hand.position.clone().normalize(),q=hand.quaternion;
 const d=q.x*a.x+q.y*a.y+q.z*a.z,t=new THREE.Quaternion(a.x*d,a.y*d,a.z*d,q.w);if(t.lengthSq()<1e-12)return;t.normalize();
 elbow.quaternion.multiply(t);hand.quaternion.premultiply(t.invert());elbow.updateWorldMatrix(false,true);
}
/** A wrist (the hand's turn at it) brought within what a wrist does, where it is past it. */
function holdWrist(q,side){
 _e.setFromQuaternion(q,'XYZ');const m=side==='R'?1:-1,c=(v,[lo,hi])=>Math.min(hi,Math.max(lo,v));
 _e.set(c(_e.x,WRIST[0]),m*c(m*_e.y,WRIST[1]),m*c(m*_e.z,WRIST[2]),'XYZ');q.setFromEuler(_e);
}
/** A wrist eased into what a wrist does (tools/blender/drink-can.py soft_wrist): within 0.15 rad of an end it comes to it more
 *  and more slowly, never past it; a little inside them, as the game samples between frames. */
function softWrist(q,side){
 _e.setFromQuaternion(q,'XYZ');const m=side==='R'?1:-1,soft=(v,lo,hi,s=.15)=>v>hi-s?hi-s+s*Math.tanh((v-hi+s)/s):v<lo+s?lo+s-s*Math.tanh((lo+s-v)/s):v;
 _e.set(soft(_e.x,WRIST[0][0]+.03,WRIST[0][1]-.03),m*soft(m*_e.y,WRIST[1][0]+.03,WRIST[1][1]-.03),m*soft(m*_e.z,WRIST[2][0]+.03,WRIST[2][1]-.03),'XYZ');q.setFromEuler(_e);
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
export function playCanDrink(avatar,prop,t,w=1,blend=null){
 const cues=canCues(t),fix={lip:0,ring:0,pocket:0,R:0,L:0};
 // (blended level by level where the move says how far in and out it is; the hands' level is the contacts' weight)
 const lw=blend?levelWeights(blend):null;if(lw)w=lw[2];
 if(w<=0&&!(lw&&lw[0]>0))return {...cues,fix};
 // each wrist where the animated body's was, in this body's size, from its chest (a narrower body's arms, turned as his
 // were, crossed in front of it): the arm put there, the hand's turn kept
 // (while it blends in or out, what the motion's own pose would be put right by, by as much as it is blended: an arm half
 // way from the animator's pose is not pulled to where the motion's whole pose would have it, its elbow flipped over)
 const goals={};
 const back=M.reach&&(w<1||lw&&lw[0]<1)?held(avatar):null;poseAt(avatar,t,M.reach?1:lw||w);
 if(M.reach){
  const chest=avatar.bones.chest,k=avatar.measure.k;
  // (and the right one, as it goes to the mouth, from this body's lower lip: a bigger head's is further out)
  const mouth=M.reach.mouth?sampleTrack(M,M.contact.mouth,t):0,lip=mouth>0?lipOf(avatar):null;
  for(const side of ['R','L']){const goal=chest.localToWorld(pathAt(M.reach[side],t).multiplyScalar(k));
   if(side==='R'&&mouth>0)goal.lerp(avatar.bones.head.localToWorld(pathAt(M.reach.mouth,t).multiplyScalar(k).add(lip)),mouth);
   goals[side]=goal.sub(avatar.bones['hand'+side].getWorldPosition(_v));}
  // (the paths are the motion's body's in this body's size; what is not of this body's size put right: the can in the hand
  // and the hooked finger, near where they make a contact (the rim at the lip, the ring, the pocket))
  if(prop)sizeContacts(avatar,prop,t,mouth,goals);}
 if(back){back();poseAt(avatar,t,lw||w);}
 for(const side of M.reach?['R','L']:[]){const hand=avatar.bones['hand'+side].getWorldPosition(new THREE.Vector3());
  // (the right hand's turn in the world kept, the can tipped as it was animated; the left's at the wrist, the arm being
  // another body's and the hand turning with it as a hand does, but for while it is hooked on the ring)
  // (the left hand's turn held in the world from well before it hooks the ring, as the path is put right for it: RING_NEAR,
  // or the hooked finger comes to the ring turned as another body's arm turns it, 20 mm off on Thao)
  // (and let go of as slowly after the tear, the tab in the hook: not dropped to the wrist's own turn in the frame it tears)
  const near=side==='L'?Math.max(cues.ring,sampleTrack(M,RING_NEAR,t)):cues.ring;
  const before=ARM.map(j=>avatar.bones[j+side].quaternion.clone());
  fix[side]=bring(avatar,side,null,hand.add(goals[side]),w,side==='R'?1:near,side==='R'?Math.max(cues.lip,sampleTrack(M,LIP_NEAR,t)):near*.4);
  // (the left, hanging or easy at his side, steadied where no contact holds it; by as much as the move is in, so it ends on the
  // animator's own arm)
  if(side==='L')steady(avatar,side,before,t,w*(1-Math.max(near,prop?.userData?.sealed?sampleTrack(M,POCKET_NEAR,t):0)));
  // (off the lip, the right wrist kept within what a wrist does, softly: the can a little less tipped on a body whose arm
  // will not turn it so, rather than the wrist bent past its end)
  const off=1-Math.max(cues.lip,sampleTrack(M,LIP_NEAR,t));   // (let go of over 0.3 s each side of the lip, as the rim is)
  if(side==='R'&&off>0){const q=avatar.bones.handR.quaternion,soft=q.clone();softWrist(soft,'R');q.slerp(soft,off);avatar.bones.handR.updateWorldMatrix(false,true);}}
 if(prop)placeCan(avatar,prop);
 const near=prop&&M.reach?.mouth?sampleTrack(M,M.contact.mouth,t):0;
 if(prop&&(cues.lip>0||near>0)){
  // the rim on the lip: this body's lip, the rim where the hand has put it. And near his mouth (the can coming to it, between
  // the pulls, leaving it) the rim where the motion's own was from its lip, in this body's size: the contact comes on and goes
  // off as the rim arrives and leaves, not pulled in early or let go of at once
  const head=avatar.bones.head,lip=head.localToWorld(lipOf(avatar).clone()),rim=prop.localToWorld(canRim(prop));
  // (and from the motion's own place to the lip itself over the last 0.3 s before the contact, and back after it: LIP_NEAR)
  const on=Math.max(cues.lip,sampleTrack(M,LIP_NEAR,t));if(on<1&&M.reach?.mouth)lip.add(madeRimOff(avatar,prop,t).multiplyScalar(1-on));
  fix.lip=bring(avatar,'R',avatar.bones.handR.worldToLocal(rim.clone()),lip,Math.max(cues.lip,near)*w,true,1,'lip');placeCan(avatar,prop);
 }
 const S=prop?.userData?.sealed;
 if(S&&!S.off)liftTab(prop,cues.tab);
 if(S&&!S.off&&cues.ring>0){
  // the hooked forefinger on the ring (lifted with the tab, open-can.js liftTab)
  const hook=avatar.bones.handL.localToWorld(new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt))),ring=S.tab.localToWorld(S.ring.clone());
  S.lastFix=ring.clone().sub(hook).multiplyScalar(cues.ring*w);S.lastFixAt=t;
  fix.ring=bring(avatar,'L',hookLocal(avatar),ring,cues.ring*w,true,.4,'ring');
 }else if(S?.off&&cues.pocket>0){
  // the tab to this body's own shirt pocket, at its mouth (story-props.js pocketSpot: the pocket drawn on the shirt)
  // (and the hand still there as the motion takes it away, once the tab is in: let go of as the contact is, not at once)
  const pocket=pockets.get(avatar)||pockets.set(avatar,pocketMouth(avatar)).get(avatar);
  const hook=avatar.bones.handL.localToWorld(new THREE.Vector3(...handPoint(avatar.measure,'L',HAND.hookAt)));
  // (the hand turning with the arm as it is moved, its turn at the wrist kept, and held to what a wrist does: a hand putting
  // a thing in a pocket is not held to a turn in the world, and the elbow, sought round for one, would go from one side to
  // the other between frames as the hand lets go)
  fix.pocket=bring(avatar,'L',hookLocal(avatar),avatar.bones.chest.localToWorld(pocket.clone()),cues.pocket*w,false);
  // (eased into its ends, by as much as the pocket holds the hand: a hard stop at them stopped the hand dead in a frame)
  {const q=avatar.bones.handL.quaternion,soft=q.clone();softWrist(soft,'L');q.slerp(soft,Math.min(1,cues.pocket*w));}avatar.bones.handL.updateWorldMatrix(false,true);
 }else if(S?.lastFix&&t>S.lastFixAt&&t<S.lastFixAt+.25){
  // (torn off: what the hand was put right by on the ring, let go over a quarter of a second, not at once)
  const f=1-smooth((t-S.lastFixAt)/.25),hand=avatar.bones.handL.getWorldPosition(new THREE.Vector3());
  fix.ring=bring(avatar,'L',null,hand.clone().add(S.lastFix),f,true,.4,'ring');   // (the elbow on the way the ring had it, the hand held as firmly)
 }
 return {...cues,fix};
}

/** Each wrist's goal put right for the parts of a contact that are not in this body's proportion (the motion's own pose on
 *  the bones): the can, held in this body's socket, at the lip and under the hooked finger, the hooked finger itself, and the
 *  pocket drawn on this body's shirt. The motion's body would have them at its own, scaled by k/k0; this body has its own. */
function sizeContacts(avatar,prop,t,mouth,goals){
 const m=avatar.measure,m0=made(),f=m.k/m0.k,S=prop.userData?.sealed,i=Math.min(T.length-1,Math.max(0,Math.round(t*M.fps)));
 const ring=S&&!S.off?RING_NEAR[i]:0,pocket=S?POCKET_NEAR[i]:0;if(mouth<=0&&ring<=0&&pocket<=0)return;
 const own=canSocket(m,prop,'R'),theirs=canSocket(m0,prop,'R'),handR=avatar.bones.handR.getWorldQuaternion(new THREE.Quaternion());
 // (a point of the can, from the wrist: in this body's socket, less the motion's body's in this body's size)
 const held=p=>p.clone().applyQuaternion(own.quaternion).add(own.position).sub(p.clone().applyQuaternion(theirs.quaternion).add(theirs.position).multiplyScalar(f)).applyQuaternion(handR);
 if(mouth>0)goals.R.addScaledVector(held(canRim(prop)),-mouth);
 if(ring>0||pocket>0){
  const handL=avatar.bones.handL.getWorldQuaternion(new THREE.Quaternion()),hook=hookLocal(avatar).sub(new THREE.Vector3(...handPoint(m0,'L',HAND.hookAt)).multiplyScalar(f)).applyQuaternion(handL);
  goals.L.addScaledVector(hook,-Math.max(ring,pocket));
  if(ring>0)goals.L.addScaledVector(held(S.ring.clone().applyMatrix4(S.tab.matrix)),ring);
  if(pocket>0){const chest=avatar.bones.chest.getWorldQuaternion(new THREE.Quaternion()),own=pockets.get(avatar)||pockets.set(avatar,pocketMouth(avatar)).get(avatar);
   madePocket??=pocketMouth({measure:m0,recipe:recipeFor(M.props?.can?.made?.name||'Nils Johansson')});
   goals.L.addScaledVector(own.clone().sub(madePocket.clone().multiplyScalar(f)).applyQuaternion(chest),pocket);}
 }
}

/** Where the motion's own rim was from its lower lip at time t (world, in this body's size and its head's turn): its wrist from the
 *  lip (the motion's `mouth` path) and the can in its socket, its hand turned as this body's now is. */
function madeRimOff(avatar,prop,t){
 const m0=made(),s=canSocket(m0,prop,'R'),head=avatar.bones.head.getWorldQuaternion(new THREE.Quaternion());
 const can=canRim(prop).applyQuaternion(s.quaternion).add(s.position).applyQuaternion(avatar.bones.handR.getWorldQuaternion(new THREE.Quaternion()));
 return pathAt(M.reach.mouth,t).multiplyScalar(m0.k).applyQuaternion(head).add(can).multiplyScalar(avatar.measure.k/m0.k);
}

/** The can in the right hand's socket (the hand is where the motion has put it). */
export function placeCan(avatar,prop){
 const S=canSocket(avatar.measure,prop,'R');
 if(prop.parent!==avatar.bones.handR)avatar.bones.handR.add(prop);
 prop.matrixAutoUpdate=false;prop.matrix.compose(S.position,S.quaternion,_w.set(1,1,1));prop.matrixWorldNeedsUpdate=true;prop.updateMatrixWorld(true);
}
