import * as THREE from '../../vendor/three.module.js';
import {bodyVolume} from './build.js';
/**
 * Funny poses for comics, memes and the scene builders (the creator, 2026-10-11: "And add more poses and funny
 * expressions"): the body of a joke, held long enough to read. One list for the whole of Johansson World: the animator plays
 * them as moves (animate.js GESTURES), World's photo studio and Johansson Studio's Build scene offer them as poses (a still
 * taken at STILL_AT of the move, at its peak), and the storyteller picks them by `use`.
 *
 * Each pose: `label` (a short name for a menu), `use` (when to pick it: what has just happened in the story), `face` (the
 * expression it goes with: face.js EXPRESSION_NAMES), `d` (how long it lasts as a move, in seconds; held moves last until the
 * next), `ramp` (how long it takes to come and to go, in seconds, or [in, out]: half a second unless said), `airborne` (it
 * leaves the floor: the feet are not held to it) and its body (`play`). Each comes from however the body was standing (its
 * hands behind its back, in its pockets) and goes back to it. A hand that goes to the head (a cheek, the brow, the face, the
 * crown) is placed by the animator on this body's own head (`reach`: animate.js REACH, solved once per body: the whole mitten
 * clear of the head and the hair by `cover`; a big head on short arms is reached as near as they go, never into it); the
 * rest is written as joint angles (animate.js: x swings a limb forward when negative, a knee or elbow folds when positive; z
 * lifts a shoulder out to its side, left positive). Family-friendly and of the 1990s: no pose belongs to anyone's franchise.
 */
export const STILL_AT=.43;
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
/** 0 → 1 between a and b, eased. */
const between=(t,a,b)=>smooth((t-a)/(b-a));
const clamp01=x=>Math.min(1,Math.max(0,x));

/** The legs a little bent and the knees turned in (weak at the knees; shy), written for both sides. */
const kneesIn=(P,w,bend=.22,inward=.07)=>{for(const [s,k] of [['L',1],['R',-1]]){P.toward('thigh'+s,-bend*.6,0,-k*inward,w);P.toward('knee'+s,bend,0,0,w);P.toward('foot'+s,-bend*.4,0,k*inward,w);}};
/** The left mitten on the hip, the elbow out (HandsOnHips' left arm). */
/** A mitten laid on the hip's side (`side` +1 the left, -1 the right), as onBack lays one on the back: the body's own surface
 *  at the hip, the mitten's thickness out from it. A fixed fold of the arm put the mitten in a short-armed, wide-hipped body's
 *  thigh; solved, it rests on the hip of every body. */
const onHip=(m,vol,side)=>{const p=vol.surf(side*Math.PI*.5,.2);return p.addScaledVector(vol.normal(p),m.hand*.95).toArray();};
/** The elbow of an arm akimbo: out to the side and a little below the shoulder, so the mitten on the hip reads as hands-on-hips. */
const akimbo=(m,side)=>[side*(m.shoulderX+m.upper*.72),m.shoulderY-m.upper*.62,.02];
/** A mitten laid on the front of the torso, on `side` of the middle (+1 the body's left) at height t up it, as animate.js's
 *  onFront lays one: the body's own surface, the mitten's thickness out from it. For arms folded across the chest. */
const onTorso=(m,vol,side,t,off=.9)=>{const p=vol.surf(side*.3,t);return p.addScaledVector(vol.normal(p),m.hand*off).toArray();};
/** Both hands where `reach` put them. */
export const both=(P,A,w)=>{if(A.R)P.armTo('R',A.R,w,A.handR);if(A.L)P.armTo('L',A.L,w,A.handL);};
/**
 * A leg of a frozen stride (Walk, Run, Dash, Skip, Tiptoe): the thigh swung `a` (forward negative), the knee folded `b`, and
 * the foot turned `f` more than level (0: the sole flat on the floor, whatever the thigh and the knee do: the foot's pitch
 * is the three added up). A planted foot is level, so the whole sole stands on the floor; a lifted foot points its toes.
 */
export const leg=(P,side,a,b,f,w,spread=0)=>{const k=side==='L'?1:-1;P.toward('thigh'+side,a,0,k*spread,w);P.toward('knee'+side,b,0,0,w);P.toward('foot'+side,-(a+b)+f,0,-k*spread,w);};
/** The knee fold of a rear leg swung back `a2` that stands its sole at the height of a front leg's (`a1` swung, `b1` folded), so
 *  both planted feet are flat on the floor at once: neither floats. */
export const matchKnee=(a1,b1,a2)=>Math.acos(Math.min(1,Math.max(-1,Math.cos(a1)+Math.cos(a1+b1)-Math.cos(a2))))-a2;

/**
 * PoleHug's pole (the nobori on Sakura Street, a lamp post, a flag pole: 2.2 cm in radius unless said): where its axis
 * stands in the hugging body's own frame (metres, x to the body's left, z ahead of it), as [x, z]: ahead of the chest, a
 * little to the side of the cheek against it (PoleHug: the right cheek, the face peeking out past the pole on its left;
 * PoleHugR: the left cheek), the head tipped back and turned out a little, and the pole as near as that head lets it (its
 * hair, a cap's peak or a beret included), the pole's radius and 2.5 cm clear (the body sways as it clings). A film or a scene puts the body there
 * from its pole (Johansson Studio: content/haunted-vending-machine, Mori up the nobori), and the arms and legs are solved
 * round it.
 */
export const POLE_RADIUS=.022;
// the hug's head: tipped back (a big head looking ahead keeps the pole at arm's length: tipped back, the chest comes to
// it) and turned out a little past the pole, the other cheek to it; the chest a little into the pole; the pole that far to
// the cheek's side
const POLE_HUG_HEAD=Object.freeze({pitch:-.3,yaw:.3,roll:0}),POLE_HUG_LEAN=.05,POLE_HUG_SIDE=.06;
// where the mittens grip the pole, from its axis (x, and the height over the chest; the first the left, the second the
// right, for PoleHug: the face's side a little higher), and how far beyond its axis
const POLE_HUG_GRIP=Object.freeze([[.1,.12],[-.1,.06],[.1,.06],[-.1,.12]]),POLE_HUG_GRIP_BEYOND=.03;
// where each arm's solve starts: the arm on the pole's side nearly straight out to it (from the far arm's bent start it
// came across the chest, in front of the pole), the other bent across the chest to its far side; and where the elbows go
// (out to the sides, so the arms ring the pole rather than lie along the chest)
const POLE_HUG_NEAR_SEED=Object.freeze([-1.5,.1,0,-.5,0]),POLE_HUG_FAR_SEED=Object.freeze([-1.3,.4,.6,-1.7,0]);
export const poleHugPole=(m,r=POLE_RADIUS,avatar=null,side='L')=>{const x=(side==='R'?1:-1)*POLE_HUG_SIDE*m.k;return [x,poleAhead(m,r,avatar,side,x)];};
const poleHugBoxes=(m,avatar,side,r=POLE_RADIUS)=>{const [x,z]=poleHugPole(m,r,avatar,side);
 // the pole, and its far side kept free: the mittens grip it either side of the far side, not clasped across it (a nobori's
 // flag hangs from its pole there, a sign is fixed to a post)
 return [{min:[x-r,-1,z-r],max:[x+r,4,z+r],clear:.006*m.k},{min:[x-.004,-1,z],max:[x+.004,4,z+.6],clear:.006*m.k}];};
/** How near the pole can stand ahead of the body, the head turned as the hug turns it: every head-bound point of the drawn
 *  head (its hair, a hat's brim) turned with it about the head's pivot (and leant with the chest), the pole's radius and
 *  3.5 cm clear of the nearest. Without the avatar, the head's measured ellipsoid. */
const poleAheads=new WeakMap();
function poleAhead(m,r,avatar,side,x){
 const key=side+r;let memo=avatar&&poleAheads.get(avatar);if(memo?.[key])return memo[key];
 const H=POLE_HUG_HEAD,o=side==='R'?-1:1,clear=r+.025*m.k;
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(H.pitch,o*H.yaw,o*H.roll)),lean=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),POLE_HUG_LEAN);
 const pivot=new THREE.Vector3(0,m.headY,0),chest=new THREE.Vector3(0,m.chestY,0),p=new THREE.Vector3();
 // (and room before the chest for the forearms to come round it: nearer, an elbow went across it)
 let z=m.depth/2+r+.13*m.k;
 const take=v=>{p.copy(v).sub(pivot).applyQuaternion(q).add(pivot).sub(chest).applyQuaternion(lean).add(chest);
  const dx=p.x-x;if(Math.abs(dx)<clear)z=Math.max(z,p.z+Math.sqrt(clear*clear-dx*dx));};
 const meshes=avatar?avatar.root.children.filter(c=>c.isSkinnedMesh&&c.visible&&!c.name.includes('outline')):[];
 let any=false;
 for(const mesh of meshes){
  const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,W=mesh.geometry.attributes.skinWeight,head=mesh.skeleton.bones.indexOf(avatar.bones.head);
  if(head<0)continue;const v=new THREE.Vector3();
  for(let i=0;i<P.count;i++)if(I.getX(i)===head&&W.getX(i)>.5){take(v.fromBufferAttribute(P,i));any=true;}
 }
 if(!any){const S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],v=new THREE.Vector3();
  for(let a=0;a<64;a++)for(let b=1;b<16;b++){const t=a/64*Math.PI*2,f=b/16*Math.PI;take(v.set(S[0]*Math.sin(f)*Math.cos(t),m.headCentre+S[1]*Math.cos(f),S[2]*Math.sin(f)*Math.sin(t)));}}
 // and far enough ahead of the body's own front (a round belly reaches well past the chest's depth) for both mittens to
 // close on the pole clear of it: each mitten's middle a mitten and a centimetre outside the torso where it grips
 if(avatar?.recipe){const vol=bodyVolume(avatar.recipe,m),need=m.hand+.01*m.k;
  for(let i=0;i<80;i++){let ok=true;
   for(const [dx,dy] of POLE_HUG_GRIP)if(vol.sdf(p.set(x+dx*m.k,m.chestY+dy*m.k,z+POLE_HUG_GRIP_BEYOND*m.k))<need){ok=false;break;}
   if(ok)break;z+=.005*m.k;}}
 if(avatar){memo??={};memo[key]=z;poleAheads.set(avatar,memo);}
 return z;
}
// the hug's body: the chest a little into the pole, the thighs up before it and apart, the knees either side of it, the
// shins down and the feet turned in against it (gripping it between the knees and the calves)
// (the pole is to the cheek's side: that knee goes wider round it)
const POLE_HUG_SPREAD=Object.freeze({near:.5,far:.14});
const POLE_HUG_JOINTS=Object.freeze(Object.fromEntries(['L','R'].map(side=>{const nL=side==='R'?POLE_HUG_SPREAD.near:POLE_HUG_SPREAD.far,nR=side==='R'?POLE_HUG_SPREAD.far:POLE_HUG_SPREAD.near;
 return [side,Object.freeze({chest:[POLE_HUG_LEAN,0,0],thighL:[-1.15,0,nL],kneeL:[.95,0,0],footL:[.25,.35,0],thighR:[-1.15,0,-nR],kneeR:[.95,0,0],footR:[.25,-.35,0]})];})));
/** Up the pole, hugging it: the pole ahead of the chest, both arms round it and the mittens gripping it either side, the
 *  knees either side of it below, the head tipped back and turned out to the `side`, the other cheek against it (each arm solved round the pole
 *  on every body: reach, the pole a box to keep clear of). The arms go a long way round it, so the hug closes over 0.9 s
 *  (at 0.6 a shoulder turned 0.2 rad a frame). */
function poleHug(side){
 const o=side==='L'?1:-1,H=POLE_HUG_HEAD,at=(dx,dy,dz)=>(m,v,a)=>{const [x,z]=poleHugPole(m,POLE_RADIUS,a,side);return [x+dx*m.k,m.chestY+dy*m.k,z+dz*m.k];};
 return Object.freeze({label:side==='L'?'Up the pole':'Up the pole (right)',face:'dismay',d:Infinity,ramp:.9,airborne:true,
  use:`Up a pole (or a tree) out of fright and not coming down: hugging it, both arms round it, the legs gripping it, the ${side==='L'?'right':'left'} cheek pressed to it and the face turned out to the ${side==='L'?'left':'right'}.`,
  reach:{pose:()=>POLE_HUG_JOINTS[side],head:[H.pitch,o*H.yaw,o*H.roll],hair:true,
   L:{on:['root',at(POLE_HUG_GRIP[0][0],o>0?POLE_HUG_GRIP[0][1]:POLE_HUG_GRIP[1][1],POLE_HUG_GRIP_BEYOND)],avoid:(m,a)=>poleHugBoxes(m,a,side),elbow:m=>[m.shoulderX+.05*m.k,m.chestY,m.depth/2+.03*m.k],seed:o<0?POLE_HUG_NEAR_SEED:POLE_HUG_FAR_SEED,hand:[0,.6,0]},
   R:{on:['root',at(POLE_HUG_GRIP[1][0],o>0?POLE_HUG_GRIP[1][1]:POLE_HUG_GRIP[0][1],POLE_HUG_GRIP_BEYOND)],avoid:(m,a)=>poleHugBoxes(m,a,side),elbow:m=>[-m.shoulderX-.05*m.k,m.chestY,m.depth/2+.03*m.k],seed:o>0?POLE_HUG_NEAR_SEED:POLE_HUG_FAR_SEED,hand:[0,.6,0]}},
  play(P){const {w,t,m}=P,sway=Math.sin(t*1.7)*.02*w;
   both(P,P.reach(),w);
   P.toward('chest',POLE_HUG_LEAN+sway,0,0,w);P.toward('head',H.pitch,o*H.yaw,o*H.roll,w);
   for(const [j,a] of Object.entries(POLE_HUG_JOINTS[side]))if(j!=='chest')P.toward(j,...a,w);
   return {root:.14*w*m.k};}});
}

export const FUN_POSES=Object.freeze({
 JawDrop:Object.freeze({label:'Jaw drop',face:'gobsmacked',d:2.6,ramp:.8,
  use:'Shock at something unbelievable: both mittens on the cheeks, leaning back, the knees gone weak.',
  reach:{hair:true,head:[-.12,0,0],R:{cover:true,head:[-.82,-.38,.42,.035],seed:[-.55,.6,-1.58,-1.92,.6],hand:[0,0,0]}},
  play(P){const {w,t}=P;both(P,P.reach(),w);P.toward('chest',-.12,0,0,w);P.add('head',-.12*w+Math.sin(t*31)*.004*w);kneesIn(P,w,.24,.06);}}),
 Facepalm:Object.freeze({label:'Facepalm',face:'dry',d:2.6,ramp:.8,
  use:'Someone has done something silly (or you have): one mitten over the eyes, the head bowed into it, the other on the hip.',
  // (pose: the body as play() stands it, which a mitten laid `on` the body is solved against)
  reach:{pose:()=>({chest:[.1,0,0],thighL:[0,0,.12]}),hair:true,head:[.26,0,-.1],R:{cover:true,head:[-.12,.18,1,.035],seed:[-1.55,.72,-.72,-1.9,0],hand:[0,0,0]},
   L:{touch:true,on:['hips',(m,v)=>onHip(m,v,1)],elbow:m=>akimbo(m,1),seed:[.15,0,-.75,-.3,0],hand:[0,0,0]}},
  // (the leg under the hip mitten set a little out, as HandsOnHips stands)
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('thighL',0,0,.12,w);P.toward('chest',.1,0,0,w);P.add('head',.26*w,0,-.1*w);}}),
 OhNo:Object.freeze({label:'Oh no!',face:'shock',d:2.6,ramp:.8,
  use:'Disaster: both mittens clapped to the head, the elbows out, crouching a little: it has all gone wrong.',
  reach:{hair:true,head:[.1,0,0],R:{cover:.015,head:[-.7,.62,.12,.03],seed:[-2.4,.3,-.9,-1.4,0],hand:[0,0,0]}},
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('chest',.08,0,0,w);P.add('head',.1*w);kneesIn(P,w,.3,0);}}),
 HideFace:Object.freeze({label:'Hide face',face:'embarrassed',d:2.8,ramp:.8,
  use:'Too embarrassed to look: both mittens over the face, the shoulders up, the knees turned in.',
  reach:{hair:true,head:[.14,0,0],R:{cover:true,head:[-.3,.02,1,.035],seed:[-1.55,.72,-.72,-1.9,0],hand:[0,0,0]}},
  play(P){const {w,t}=P;both(P,P.reach(),w);P.toward('chest',.06,0,0,w);P.add('head',.14*w);kneesIn(P,w,.2,.1);P.add('hips',0,Math.sin(t*2.2)*.05*w,0);}}),
 Shush:Object.freeze({label:'Shh!',face:'wink',d:2.6,ramp:.8,
  use:'A secret, or quiet please: a mitten held up before the lips, leaning in.',
  reach:{hair:true,head:[.06,0,0],only:'R',R:{cover:true,head:[-.04,-.4,1,.05],seed:[-1.3,.5,-.3,-2.1,0],hand:[0,-1.2,0]}},
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('chest',.14,0,0,w);P.add('head',.06*w);}}),
 Salute:Object.freeze({label:'Salute',face:'focus',d:2.6,ramp:.8,
  use:'Yes, sir! Reporting for duty: the edge of the mitten at the brow, standing straight, the heels together.',
  reach:{hair:true,head:[-.05,0,0],only:'R',R:{cover:true,head:[-.6,.42,.62,.03],elbow:m=>[-(m.shoulderX+m.upper*.85),m.shoulderY,m.depth*.25],seed:[-1.1,.3,-1.3,-2.2,0],hand:[0,-1.3,0]}},
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('chest',-.05,0,0,w);P.add('head',-.05*w);
   for(const s of ['L','R']){P.toward('thigh'+s,0,0,0,w);P.toward('knee'+s,0,0,0,w);P.toward('foot'+s,0,0,0,w);}}}),
 // (ramp .9: the mitten's way to the brow is the longest of these moves; at .8 a slim teen's shoulder turned faster than a frame allows)
 Swoon:Object.freeze({label:'Swoon',face:'daze',d:3,ramp:.9,
  use:'The dramatic swoon (oh my!): the back of a mitten to the brow, leaning back, the other arm flung out behind.',
  reach:{hair:true,head:[-.26,0,.14],only:'R',R:{cover:true,head:[-.25,.48,.85,.045],seed:[-2,.6,-.9,-1.9,0],hand:[0,1.6,0]}},
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('shoulderL',.5,0,1.1,w);P.toward('elbowL',-.25,0,0,w);P.toward('chest',-.22,0,.06,w);P.add('head',-.26*w,0,.14*w);
   P.toward('thighR',-.25,0,0,w);P.toward('kneeR',.55,0,0,w);P.toward('footR',-.3,0,0,w);}}),
 Flex:Object.freeze({label:'Flex',face:'smug',d:2.6,
  use:'Showing off how strong you are: both arms up and bent, the fists by the ears, the chest out.',
  play(P){const {w,t}=P,pump=Math.sin(t*5)*.06*w;
   P.armTo('R',[-.25,0,-1.45,0],w);P.armTo('L',[-.25,0,-1.45,0],w);P.toward('elbowR',0,0,-1.9-pump,w);P.toward('elbowL',0,0,1.9+pump,w);
   P.toward('chest',-.12,0,0,w);P.add('head',-.08*w);for(const [s,k] of [['L',1],['R',-1]]){P.toward('thigh'+s,0,0,k*.12,w);P.toward('foot'+s,0,0,-k*.12,w);}}}),
 PointLaugh:Object.freeze({label:'Point and laugh',face:'laugh',d:2.8,
  use:'Somebody else’s mishap is just too funny: pointing at them, the other mitten on the belly, rocking back.',
  play(P){const {w,t}=P,rock=Math.abs(Math.sin(t*7))*w;
   P.armTo('R',[-1.45,0,-.12,-.05],w);P.armTo('L',[-.45,0,.25,-1.7],w);P.toward('handL',.2,0,0,w);
   P.toward('chest',-.16-.06*rock,0,0,w);P.add('head',(-.22-.06*rock)*w);P.toward('thighL',-.2,0,0,w);P.toward('kneeL',.4,0,0,w);P.toward('footL',-.2,0,0,w);
   return {root:.006*rock};}}),
 FistPump:Object.freeze({label:'Yes!',face:'excited',d:1.6,ramp:[.2,.7],
  use:'Victory, it worked: a fist punched up at the sky, the other pulled down to the hip, a knee up.',
  // (the fist up beside the head and above it, the arm clear of the head and its hair: big heads, short arms)
  reach:{hair:true,head:[-.16,0,0],only:'R',R:{at:m=>[-(m.Rh*m.headSX*.8+m.hand),m.headCentre+m.Rh*m.headSY*1.05,.04*m.k],upper:true,seed:[-2.9,.1,-.35,-.1,0],hand:[0,0,0]}},
  play(P){const {w,t}=P,wind=between(t,0,.25)*(1-between(t,.28,.64)),up=between(t,.28,.64),A=P.reach();
   P.armTo('R',[.3*wind,0,-.2,-1.5*wind,0].map((v,i)=>v+((A.R[i]??0)-v)*up),w);P.armTo('L',[.25*wind+.3*up,0,.25+.1*up,-1.2*wind-1.45*up],w);
   P.toward('chest',.15*wind-.12*up,0,0,w);P.add('head',(.05*wind-.16*up)*w);
   for(const s of ['L','R']){P.toward('thigh'+s,-.35*wind,0,0,w);P.toward('knee'+s,.6*wind,0,0,w);P.toward('foot'+s,-.25*wind,0,0,w);}
   P.toward('thighL',-.35*wind-1.1*up,0,0,w);P.toward('kneeL',.6*wind+1.5*up,0,0,w);P.toward('footL',-.25*wind+.3*up,0,0,w);}}),
 JumpForJoy:Object.freeze({label:'Jump for joy',face:'excited',d:1.3,airborne:true,
  use:'The good news lands: up in the air, both arms up, the heels kicked up behind.',
  play(P){const {t,m}=P,crouch=between(t,0,.22)*(1-between(t,.22,.32))+between(t,.84,.95)*(1-between(t,1,1.25)),air=between(t,.24,.44)*(1-between(t,.72,.9));
   const h=Math.max(0,Math.sin(Math.PI*clamp01((t-.3)/.55)))*.32*m.k;
   P.armTo('R',[.45*crouch-.2*air,0,-.2-2*air,-.3],1);P.armTo('L',[.45*crouch-.2*air,0,-.2-2*air,-.3],1);
   for(const s of ['L','R']){P.set('thigh'+s,-.45*crouch-.25*air);P.set('knee'+s,.85*crouch+1.5*air);P.set('foot'+s,-.4*crouch+.3*air);}
   P.add('chest',.2*crouch-.1*air);P.add('head',-.12*air);return {root:h};}}),
 StartledJump:Object.freeze({label:'Startled',face:'shock',d:1.4,airborne:true,
  use:'Boo! A jump off the ground, leaning back from the fright, the arms flung up, a knee up.',
  play(P){const {t,m}=P,up=between(t,0,.3)*(1-between(t,.95,1.3)),air=Math.max(0,Math.sin(Math.PI*clamp01((t-.08)/.85)));
   P.armTo('R',[-.7,0,-1.9,-.9],up);P.armTo('L',[-.7,0,-1.9,-.9],up);
   P.toward('chest',-.28,0,0,up);P.add('head',-.16*up);P.toward('thighL',-1,0,0,up);P.toward('kneeL',1.4,0,0,up);P.toward('footL',.3,0,0,up);
   return {root:air*.12*m.k};}}),
  // A real pole (poleHugPole): the head is wider than the shoulders, so a pole hugged before a face looking ahead went
  // through it (Johansson Studio's collision check, the creator 2026-10-14: "the world should have its collisions intact").
  // The head turns out to the side, the cheek to the pole, which stands as near the chest as that head allows. Held up off the floor by the pole
  // (the body is lifted clear, as a jump is), never hovering a centimetre over it.
 PoleHug:poleHug('L'),
 PoleHugR:poleHug('R'),
 Sneak:Object.freeze({label:'Sneak',face:'scheme',d:Infinity,
  use:'Tiptoeing past someone: crouched on the toes, the mittens up like paws, looking sideways.',
  play(P){const {w,t}=P,bob=Math.sin(t*3)*.03*w;
   P.armTo('R',[-1.15,0,-.22,-1.75],w,[.9,0,0]);P.armTo('L',[-1.15,0,-.22,-1.75],w,[.9,0,0]);
   P.toward('chest',.36,0,0,w);P.add('neck',-.14*w);P.add('head',-.1*w,.42*w,0);
   P.toward('thighL',-.8-bob,0,.04,w);P.toward('kneeL',1.1,0,0,w);P.toward('footL',.5,0,-.04,w);
   P.toward('thighR',-.2+bob,0,-.04,w);P.toward('kneeR',.95,0,0,w);P.toward('footR',.55,0,.04,w);}}),
 // Tempers (the creator, 2026-10-19: "pissed off and raging angry is funny, make some more of those; whatever fits Crayon
 // Shin-chan's world in expressions"): comedy anger of the Nohara-household kind, the mother before the bonk and the boy
 // in a sulk, never a threat to anyone. Faces: face.js raging, seething, eyeroll (new), fuming, angry, pouting.
 Fume:Object.freeze({label:'Fume',face:'raging',d:2.8,ramp:.6,
  use:'The all-out yell: leaning in, the fists clenched down and back, the feet planted; the last straw has gone.',
  play(P){const {w,t}=P,shake=Math.sin(t*22)*.025*w;
   P.armTo('R',[.42,0,-.32,-.35],w,[-.35,0,0]);P.armTo('L',[.42,0,-.32,-.35],w,[-.35,0,0]);
   P.toward('chest',.22+shake,0,0,w);P.add('neck',.08*w);P.add('head',.1*w);
   P.toward('thighL',0,0,.14,w);P.toward('thighR',0,0,-.14,w);}}),
 ShakeFists:Object.freeze({label:'Shake fists',face:'fuming',d:2.8,ramp:.6,
  use:'Beside oneself: both fists shaking by the ears, the teeth gritted, the head down; what a mother does before the bonk.',
  play(P){const {w,t}=P,shake=Math.sin(t*20)*.08*w;
   P.armTo('R',[-.45,0,-1.25,0],w);P.armTo('L',[-.45,0,-1.25,0],w);P.toward('elbowR',0,0,-2.15+shake,w);P.toward('elbowL',0,0,2.15-shake,w);
   P.toward('chest',.14,0,0,w);P.add('head',.18*w);P.toward('thighL',0,0,.1,w);P.toward('thighR',0,0,-.1,w);}}),
 Scold:Object.freeze({label:'Scold',face:'angry',d:2.8,ramp:.6,
  use:'Telling someone off: a finger pointed in their face, the other mitten on the hip, leaning at them.',
  reach:{pose:()=>({chest:[.14,0,0],thighL:[0,0,.12]}),hair:true,head:[.1,0,0],only:'L',
   L:{touch:true,on:['hips',(m,v)=>onHip(m,v,1)],elbow:m=>akimbo(m,1),seed:[.15,0,-.75,-.3,0],hand:[0,0,0]}},
  play(P){const {w,t}=P,jab=Math.max(0,Math.sin(t*6))*.12*w;
   both(P,P.reach(),w);P.armTo('R',[-1.6+jab,.2,-.1,-.05],w);P.toward('chest',.14,0,0,w);P.add('head',.1*w);P.toward('thighL',0,0,.12,w);}}),
 // (ramp .8: folding both arms across the chest is a long way for a round body's shoulder; at .6 it turned faster than a frame allows)
 Huff:Object.freeze({label:'Huff',face:'pouting',d:Infinity,ramp:.8,
  use:'Not talking to you: the arms folded, the cheeks puffed, the head turned away; a sulk that wants to be noticed.',
  reach:{pose:()=>({chest:[-.04,0,0]}),R:{touch:true,on:['spine',(m,v)=>onTorso(m,v,1,.72)],seed:[-.6,.3,.35,-2.1,0],hand:[0,0,0]},
   L:{touch:true,on:['spine',(m,v)=>onTorso(m,v,-1,.62)],seed:[-.6,.3,.35,-2.1,0],hand:[0,0,0]}},
  play(P){const {w}=P;both(P,P.reach(),w);P.toward('chest',-.04,0,0,w);P.add('head',-.06*w,.45*w,.05*w);P.toward('thighL',0,0,.08,w);}}),
 Eyeroll:Object.freeze({label:'Eye-roll',face:'eyeroll',d:2.8,ramp:.6,
  use:'Give me a break: a shrug with the palms up, the head tipped, the eyes gone to the ceiling.',
  play(P){const {w}=P;P.armTo('R',[-.3,0,-.6,-1.35],w,[0,0,.4]);P.armTo('L',[-.3,0,-.6,-1.35],w,[0,0,.4]);
   P.toward('chest',-.08,0,0,w);P.add('head',-.14*w,0,.16*w);P.toward('thighR',0,0,-.1,w);}}),
 Seethe:Object.freeze({label:'Seethe',face:'seething',d:Infinity,ramp:.6,
  use:'Holding it in: standing stiff and straight, the fists tight at the sides, the shoulders up, a smile that fools nobody.',
  play(P){const {w,t}=P,tremble=Math.sin(t*30)*.012*w;
   // (the arms a hand's width out from the sides: straight down they press into a round body)
   P.armTo('R',[.08,0,-.26,-.08],w,[-.5,0,0]);P.armTo('L',[.08,0,-.26,-.08],w,[-.5,0,0]);
   P.toward('chest',-.06+tremble,0,0,w);P.add('head',.06*w,0,tremble);
   for(const s of ['L','R']){P.toward('thigh'+s,0,0,0,w);P.toward('knee'+s,0,0,0,w);}}}),
 // Moves (the creator, 2026-10-19: "And running and walking, and kissing and hugging and fighting", for the stickers and
 // the panels, "so anyone can use these"): a gait frozen at its most readable frame, the way a comic draws it, and held as
 // a short burst with a little life in it (the arms pump, the lifted foot flicks). The frame is the still from the first
 // moment it is in, so a sticker taken at STILL_AT and a panel's held pose are the same picture. The planted foot is level,
 // its whole sole on the floor (leg: the foot's pitch undoes the thigh's and the knee's); a lifted foot is bent at the knee
 // with the toes pointed, well off the floor, so nothing floats. Written for the left foot forward (the right arm forward
 // with it); the body leans from the spine and the chest, not the hips, so the legs keep their line.
 Walk:Object.freeze({label:'Walk',face:'calm',d:2.4,ramp:.5,
  use:'On the way somewhere, in no hurry: mid-stride, the left foot forward, both soles flat, the arms swinging easy, a relaxed face.',
  play(P){const {w,t}=P,sw=Math.sin(t*4)*.04*w;
   // (the rear knee folds just enough to stand its sole as low as the front one's: both feet flat)
   leg(P,'L',-.5,.08,0,w,.03);leg(P,'R',.46,matchKnee(-.5,.08,.46),0,w,.03);
   P.armTo('R',[-.55+sw,0,-.12,-.32],w);P.armTo('L',[.5+sw,0,-.12,-.26],w);
   P.toward('hips',0,.1,0,w);P.toward('spine',.02,0,0,w);P.toward('chest',.03,-.1,0,w);P.add('head',-.02*w,.04*w,0);}}),
 Run:Object.freeze({label:'Run',face:'excited',d:2.2,ramp:.4,
  use:'Flat out, late or thrilled: leaning into the sprint, the left foot planted ahead, the right heel kicked up behind, the arms pumping.',
  play(P){const {w,t}=P,pump=Math.sin(t*9)*.08*w,flick=Math.max(0,Math.sin(t*9))*.1*w;
   leg(P,'L',-.9,.3,0,w,.02);leg(P,'R',.5,1.45+flick,.35,w,.02);
   P.armTo('R',[-.95-pump,0,-.18,-1.5],w);P.armTo('L',[.85+pump,0,-.2,-1.35],w);
   P.toward('hips',0,.08,0,w);P.toward('spine',.1,0,0,w);P.toward('chest',.22,-.08,0,w);P.toward('neck',.02,0,0,w);P.add('head',-.2*w,.03*w,0);}}),
 Dash:Object.freeze({label:'Dash',face:'scared',d:2,ramp:.35,
  use:'The panic run, something terrible behind: leaning right into it, the left foot planted ahead, the right kicked up, both arms trailing straight back, the mouth wide.',
  play(P){const {w,t}=P,flap=Math.sin(t*12)*.06*w,scramble=Math.max(0,Math.sin(t*12))*.12*w;
   leg(P,'L',-1,.55,0,w,.02);leg(P,'R',.65,1.3+scramble,.4,w,.02);
   P.armTo('R',[1.15+flap,0,-.3,-.1],w,[-.35,0,0]);P.armTo('L',[1.15-flap,0,-.3,-.1],w,[-.35,0,0]);
   P.toward('hips',0,.05,0,w);P.toward('spine',.14,0,0,w);P.toward('chest',.28,0,0,w);P.toward('neck',-.05,0,0,w);P.add('head',-.4*w);}}),
 Skip:Object.freeze({label:'Skip',face:'happy',d:2,ramp:.4,
  use:'Too happy to walk: a skip, up on the left foot with the right knee hitched high, the left arm swung up ahead, the chin up.',
  play(P){const {w,t}=P,bounce=Math.sin(t*5)*.06*w;
   leg(P,'L',-.08,.05,0,w,.02);leg(P,'R',-1.1-bounce,1.35,.5,w,.02);
   P.armTo('R',[.55,0,-.25,-.4],w);P.armTo('L',[-1-bounce,0,-.3,-.7],w);
   P.toward('hips',0,.06,.03,w);P.toward('chest',-.06,-.05,-.03,w);P.add('head',-.1*w,0,.04*w);}}),
 Tiptoe:Object.freeze({label:'Tiptoe',face:'focus',d:2.6,ramp:.5,
  use:'Up on the toes, reaching for the top shelf or peering over a fence: tall, the heels up, the arms a little out for balance.',
  play(P){const {w,t}=P,sway=Math.sin(t*2.6)*.015*w;
   // (both feet pointed past level: the toes are the lowest thing on the body, and the floor meets them)
   leg(P,'L',-.06,.12,.85,w,.02);leg(P,'R',-.06,.12,.85,w,.02);
   P.armTo('R',[-.1,0,-.5,-.3],w,[0,0,-.25]);P.armTo('L',[-.1,0,-.5,-.3],w,[0,0,-.25]);
   P.toward('chest',.05,0,sway,w);P.add('head',-.05*w,0,-sway);}}),
});
