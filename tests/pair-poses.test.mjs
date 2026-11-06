import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES,STORY_POSES,STILL_AT,PAIR_POSES,playPair} from '../src/avatars/animate.js';
import {PAIR_ROLES,PAIR_GAP,fitPair,placePair,headsApart} from '../src/avatars/pair-poses.js';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {POSES} from '../src/photo/layout.js';
import {surface,core,intrusion,clearance} from './body-contact.mjs';
installDOM();

/**
 * The pair poses (pair-poses.js; the creator, 2026-10-19: "And running and walking, and kissing and hugging and fighting",
 * for the stickers and the panels "so anyone can use these"): a hug, a peck on the cheek, a squabble by the collar and a
 * shove, each two roles played together by playPair, fitted for the two bodies that play them. For a matrix of pairs (tall
 * and short, round and slim, a grandmother and a child) at the still Johansson Studio shoots: nothing of either body goes
 * into the other beyond a few millimetres (the drawn surface of one against the core of the other: torso, head, limbs,
 * mittens, shoes), the hands touch where the pose says they do (a hug's mitten on the partner's back, the fists on the
 * collar, the palms on the chest, the faces together for the kiss, the backs together and the arms folded for the
 * buddy-film poster BackToBack of 2026-10-20), both stand on the floor, and each role plays alone as
 * any move does, smoothly and the same every time.
 */
const PAIRS=[['Thuan','Nils Johansson'],['Thao','Vy'],['Mr Fujita','Kōji'],['Riku','Vy'],['Grandmother Higa','Mai']];
const NAMES=Object.keys(PAIR_POSES);
/** A few millimetres: how far one body's drawn surface may go into the other's core. A mitten laid on a shirt that the core
 *  does not have (the core is the bare body) may press as far as the shirt's thickness. */
const INTO=.006,PRESS=.016;
/** Touching: a mitten's drawn surface within this of the partner's bare core (the shirt or a sleeve between them: the
 *  drawn clothes stand up to a centimetre and a half off the core where hands land). The core, not the drawn surface:
 *  the drawn chest is a coarse lathe whose nearest vertex can be two centimetres from a mitten that touches its face. */
const TOUCH=.03;
/** Back to back: how far apart the two backs may stand (the drawn shirt of one from the other's bare core). */
const BACK=.03;
function seeded(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function body(who,rand){
 const avatar=buildAvatar(recipeFor(who),{shadows:false});avatar.wear('clothes');const holder=new THREE.Group();holder.add(avatar.root);
 const own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
 const anim=own(()=>createAvatarAnimator(avatar,{random:rand}));
 const step=(n=1,state={})=>{for(let i=0;i<n;i++){own(()=>anim.update(1/60,state));avatar.springs?.update(1/60);}holder.updateMatrixWorld(true);};
 return {avatar,anim,holder,step,m:avatar.measure};
}
/** The two bodies at the still of a pair, as Johansson Studio shoots it: stood, the pair played, the still at STILL_AT. */
function still(a,b,name){
 const rand=seeded(),A=body(a,rand),B=body(b,rand);A.step(20);B.step(20);
 const fit=playPair(A.anim,B.anim,name),n=Math.round(GESTURES[name+':A']*STILL_AT*60);A.step(n);B.step(n);
 return {A,B,fit,dispose(){A.avatar.dispose();B.avatar.dispose();}};
}
const hands=(s,side)=>s.filter(p=>p.bone==='hand'+side);
const low=s=>Math.min(...s.map(p=>p.p.y));
/** The mitten's middle, in the world. */
const mitten=(b,side)=>b.avatar.bones['hand'+side].localToWorld(new THREE.Vector3(0,-b.m.hand*.55,0));
/** A world point in the other body's own frame (x to its left, z ahead of it). */
const inFrame=(b,p)=>b.avatar.root.worldToLocal(p.clone());

test('every pair is on the list with what it is for, its faces, and its two roles among the moves; the photo studio keeps them out of its single poses',()=>{
 assert.ok(NAMES.length>=4,NAMES.join());
 for(const [name,p] of Object.entries(PAIR_POSES)){
  assert.ok(p.label?.length>2&&p.label.length<16,name+' has a short label');assert.ok(p.use?.length>40,name+' says when to use it');
  for(const role of ['A','B']){const r=PAIR_ROLES[name+':'+role];assert.ok(r,name+':'+role+' is a move');assert.equal(GESTURES[name+':'+role],p.d);
   assert.ok(EXPRESSION_NAMES.includes(p.faces[role]),name+' '+role+'’s face is one the face painter knows: '+p.faces[role]);assert.ok(!STORY_POSES.has(name+':'+role));
   assert.ok(!POSES.includes(name+':'+role),name+':'+role+' is not a single pose');}
 }
});

test('on every pair at the still: in nothing of the other body, the hands where the pose puts them, both on the floor',()=>{
 const wrong=[];
 for(const [a,b] of PAIRS)for(const name of NAMES){
  const s=still(a,b,name),{A,B,fit}=s,tag=`${name}, ${a} + ${b}`;
  const sA=surface(A.avatar,{stride:2}),sB=surface(B.avatar,{stride:2}),cA=core(A.avatar),cB=core(B.avatar);
  const intoB=intrusion(sA,cB),intoA=intrusion(sB,cA);
  const limit=o=>o.bone?.startsWith('hand')?PRESS:INTO;
  if(intoB.depth>limit(intoB))wrong.push(`${tag}: ${a}’s ${intoB.bone} ${(intoB.depth*1000).toFixed(0)} mm into ${b}`);
  if(intoA.depth>limit(intoA))wrong.push(`${tag}: ${b}’s ${intoA.bone} ${(intoA.depth*1000).toFixed(0)} mm into ${a}`);
  for(const [who,sf] of [[a,sA],[b,sB]]){const l=low(sf);if(Math.abs(l)>.004)wrong.push(`${tag}: ${who} ${l<0?'through':'off'} the floor (${(l*1000).toFixed(0)} mm)`);}
  // the contact the pose promises
  const touch=(sf,side,c,what)=>{const d=clearance(hands(sf,side),c);if(d>TOUCH)wrong.push(`${tag}: ${what} is ${(d*1000).toFixed(0)} mm off`);};
  if(name==='Hug'){
   touch(sA,'L',cB,`${a}’s left mitten over ${b}’s shoulder`);touch(sB,'R',cA,`${b}’s right mitten on ${a}’s back`);
   // A's mitten hanging over B's near shoulder down its front (before the joint, about its height, on B's near side);
   // B's on A's back, behind A's middle
   const mA=inFrame(B,mitten(A,'L')),mB=inFrame(A,mitten(B,'R'));
   if(mA.z<0||mA.z>.2||Math.abs(mA.y-B.m.shoulderY)>.14*B.m.k||mA.x>-B.m.shoulderX*.5)wrong.push(`${tag}: ${a}’s mitten is not over ${b}’s near shoulder (${mA.toArray().map(v=>v.toFixed(2))})`);
   if(mB.z>-.02)wrong.push(`${tag}: ${b}’s mitten is not behind ${a} (z ${mB.z.toFixed(2)})`);
  }
  if(name==='Fight'||name==='Shove')for(const side of ['L','R'])touch(sA,side,cB,`${a}’s ${side} mitten on ${b}’s chest`);
  if(name==='BackToBack'){
   // the backs together: the two drawn backs (the shirts, or a skirt: a grandmother's long skirt is what meets a child's
   // back) within BACK of each other, or touching; each facing away from the other (B behind A, A behind B), the arms
   // folded in front, clear of the partner (above)
   // (the drawn surface of one against the other's bare core: the drawn lathe is too coarse to measure from vertex to vertex)
   const torso=p=>/^(hips|spine|chest|thigh[LR])$/.test(p.bone),back=Math.min(clearance(sA.filter(torso),cB),clearance(sB.filter(torso),cA));
   if(back>BACK)wrong.push(`${tag}: the backs are ${(back*1000).toFixed(0)} mm apart`);
   const hipsB=inFrame(A,B.avatar.bones.hips.getWorldPosition(new THREE.Vector3())),hipsA=inFrame(B,A.avatar.bones.hips.getWorldPosition(new THREE.Vector3()));
   if(hipsB.z>-.1||hipsA.z>-.1)wrong.push(`${tag}: not back to back (B at z ${hipsB.z.toFixed(2)} of A, A at z ${hipsA.z.toFixed(2)} of B)`);
   for(const [who,o] of [[a,A],[b,B]])for(const side of ['L','R']){const mt=inFrame(o,mitten(o,side));
    if(mt.z<o.m.depth*.3||Math.abs(mt.x)>o.m.width*.6)wrong.push(`${tag}: ${who}’s ${side} mitten is not folded in front (${mt.toArray().map(v=>v.toFixed(2))})`);}
  }
  // the two heads, with their hair and hats: never in each other; for the kiss, together (the nose on the cheek, or on the
  // hair that covers it)
  const heads=headsApart(A.avatar,B.avatar);
  if(heads<-.003)wrong.push(`${tag}: the heads are ${(-heads*1000).toFixed(0)} mm into each other`);
  if(name==='Kiss'&&heads>PAIR_GAP.lips+.01)wrong.push(`${tag}: the faces are ${(heads*1000).toFixed(0)} mm apart`);
  s.dispose();
 }
 assert.deepEqual(wrong,[]);
});

test('the fit is the same every time, and the partner stands where it says',()=>{
 const rand=seeded(),A=body('Thuan',rand),B=body('Nils Johansson',rand);
 const f1=fitPair('Hug',A.avatar,B.avatar),f2=fitPair('Hug',A.avatar,B.avatar);
 assert.deepEqual([f1.dx,f1.dz,f1.yawB],[f2.dx,f2.dz,f2.yawB]);
 assert.ok(f1.dx>.3&&f1.dx<.9&&Math.abs(f1.dz)<.2,'side by side: '+f1.dx.toFixed(2)+', '+f1.dz.toFixed(2));
 assert.ok(placePair(A.avatar,B.avatar,f1));A.holder.updateMatrixWorld(true);B.holder.updateMatrixWorld(true);
 // B's hips in A's own frame are where the fit put them (A's frame: x to A's left, z ahead of A)
 const hips=inFrame(A,B.avatar.bones.hips.getWorldPosition(new THREE.Vector3()));
 assert.ok(Math.abs(hips.x-f1.dx)<.01&&Math.abs(hips.z-f1.dz)<.01,`B at (${hips.x.toFixed(2)}, ${hips.z.toFixed(2)}), the fit says (${f1.dx.toFixed(2)}, ${f1.dz.toFixed(2)})`);
 A.avatar.dispose();B.avatar.dispose();
});

test('each role plays alone like any move: smoothly, the same every time, and the body is itself again after',()=>{
 const JOINTS=['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR'],wrong=[];
 const play=(who,name)=>{const b=body(who,seeded()),stillB=body(who,seeded());b.step(20);stillB.step(20);b.anim.play(name);
  let prev=JOINTS.map(j=>b.avatar.bones[j].quaternion.clone()),prevY=b.avatar.root.position.y,fastest=0,jump=0;const frames=[];
  for(let f=0;f<Math.round((GESTURES[name]+1.2)*60);f++){b.step();stillB.step();const now=JOINTS.map(j=>b.avatar.bones[j].quaternion.clone());
   now.forEach((q,i)=>fastest=Math.max(fastest,q.angleTo(prev[i])));jump=Math.max(jump,Math.abs(b.avatar.root.position.y-prevY));prev=now;prevY=b.avatar.root.position.y;frames.push(now.flatMap(q=>q.toArray()));}
  const off=Math.max(...JOINTS.map(j=>b.avatar.bones[j].quaternion.angleTo(stillB.avatar.bones[j].quaternion)));
  b.avatar.dispose();stillB.avatar.dispose();return {fastest,jump,off,frames};};
 for(const who of ['Thuan','Mr Fujita'])for(const name of Object.keys(PAIR_ROLES)){
  const a=play(who,name);
  if(a.fastest>.16)wrong.push(`${name}, ${who}: a joint turns ${a.fastest.toFixed(3)} rad in a frame`);
  if(a.jump>.04)wrong.push(`${name}, ${who}: the body jumps ${a.jump.toFixed(3)} m in a frame`);
  if(a.off>.04)wrong.push(`${name}, ${who}: ${a.off.toFixed(3)} rad from where it would be without the pose`);
  assert.deepEqual(play(who,name).frames,a.frames,`${name}, ${who}: the same every time`);
 }
 assert.deepEqual(wrong,[]);
});
