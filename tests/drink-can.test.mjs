import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,HAND,handPoint} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createDrinkProp} from '../src/people/izakaya-beer.js';
import {lowerLip} from '../src/avatars/consume.js';
import {DRINK_CAN,CAN_PARTS,canRim} from '../src/avatars/drink-can.js';
import {normalizeMotion} from '../src/avatars/motion.js';
import MOTION from '../src/avatars/motions/drink-can.js';
installDOM();

/**
 * Drinking a can, as it was animated in Blender (tools/blender/drink-can.py; the owner, 27 November 2026: "Drinking needs to
 * be impeccable Disney animation standard", "You need to animate the beer drinking in blender and bring it to the game
 * after"): the motion played in the game is the one made there (its contacts land where they landed there); on every
 * body, standing or seated, the rim on the lower lip at every frame it is to be there, put right by little; the can in the
 * hand, the palm and the fingers on it and none in it; the can never in the face; the wrists within what a wrist does; the
 * can tipped further as it empties; the eyes shut for the deep swallows.
 */
const VERIFY=JSON.parse(readFileSync(new URL('./drink-can.verify.json',import.meta.url),'utf8'));
const PALM_WRIST=[[-.35,.5],[-.45,.45],[-1.1,1.25]];   // animate.js PALM.wrist (the right hand's terms; the left's y and z mirrored)
const BODIES=['Nils Johansson','Thao','Thuan','Mr Fujita','Tetsuo','Nhung','Miss Higa'];
const runs=new Map();

/** The can drunk by `who` (sealed: opened first), every frame's facts. */
function drink(who,seated=false){
 const key=who+(seated?' seated':'');if(runs.has(key))return runs.get(key);
 const a=buildAvatar(recipeFor(who),{shadows:false}),holder=new THREE.Group();holder.add(a.root);
 const animator=createAvatarAnimator(a,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})()});
 const prop=createDrinkProp('can',{held:true,sealed:true});a.bones.handR.add(prop);
 const faces=[];const paint=a.paintFace.bind(a);a.paintFace=s=>{faces.push(s);return paint(s);};
 const state={heldProp:prop,seated,seatHeight:.45,seatFront:.2};
 for(let i=0;i<30;i++)animator.update(1/60,state);
 animator.play('DrinkCan');faces.length=0;
 const lipLocal=lowerLip(a).lower,frames=[];
 for(let i=0;i<Math.round(CAN_PARTS.open[1]*60);i++){
  animator.update(1/60,state);holder.updateMatrixWorld(true);const c=animator.canCue;if(!c)continue;
  const t=(i+1)/60,lip=a.bones.head.localToWorld(lipLocal.clone()),rim=prop.localToWorld(canRim(prop));
  const up=new THREE.Vector3(0,1,0).transformDirection(prop.matrixWorld);
  const wrist=s=>{const q=a.bones['hand'+s].quaternion,e=new THREE.Euler().setFromQuaternion(q,'XYZ');return [e.x,s==='R'?e.y:-e.y,s==='R'?e.z:-e.z];};
  frames.push({t,c,rimLip:rim.distanceTo(lip),tilt:Math.acos(THREE.MathUtils.clamp(up.dot(new THREE.Vector3(0,1,0)),-1,1)),wrist:{R:wrist('R'),L:wrist('L')},face:faces.at(-1),
   canInFace:i%6===0?canInFace(a,prop):0,handOnCan:[30,207,288].includes(i)?handOnCan(a,prop):null});
 }
 const run={a,prop,frames};runs.set(key,run);return run;
}

/** How deep the can goes into the drawn head (metres; 0 when it does not): points of its side and its lid, each by a ray from
 *  the head's middle out to it, against the head's own mesh. */
function canInFace(a,prop){
 const m=a.measure,centre=a.bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),r=prop.userData.grip.radius,h=prop.userData.rimHeight,ray=new THREE.Raycaster();let deep=0;
 for(let j=0;j<=6;j++)for(let k=0;k<16;k++){const ang=k/16*Math.PI*2,p=prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r*(j===6?.6:1),h*Math.min(j,5.8)/6,Math.sin(ang)*r*(j===6?.6:1)));
  const d=p.clone().sub(centre),len=d.length();if(len>m.Rh*1.6)continue;
  ray.set(centre,d.normalize());const hit=ray.intersectObject(a.face.head,true).find(x=>x.distance>len-.05);
  const out=ray.intersectObject(a.face.head,true).filter(x=>x.distance>=len);if(out.length&&out[0].distance-len>deep)deep=out[0].distance-len;}
 return deep;
}

/** The right hand against the can: how deep any of it goes in, and how near the palm and each finger come (metres). */
function handOnCan(a,prop){
 const g=prop.userData.grip,base=prop.localToWorld(new THREE.Vector3()),axis=new THREE.Vector3(0,1,0).transformDirection(prop.matrixWorld),hand=a.bones.handR;
 const pos=a.body.geometry.attributes.position,idx=a.body.geometry.attributes.skinIndex,w=a.body.geometry.attributes.skinWeight,bone=a.body.skeleton.bones.indexOf(hand);
 const p=new THREE.Vector3(),local=new THREE.Vector3(),near={palm:Infinity,fore:Infinity,middle:Infinity,ring:Infinity,little:Infinity};let deep=0;
 const H=a.measure.hand;
 for(let i=0;i<pos.count;i++){if(idx.getX(i)!==bone||w.getX(i)<.99)continue;
  a.body.getVertexPosition(i,p);p.applyMatrix4(a.body.matrixWorld);
  const along=p.clone().sub(base).dot(axis);if(along<.005||along>g.height*2-.005)continue;
  const d=p.clone().sub(base).addScaledVector(axis,-along).length()-g.radius;deep=Math.max(deep,-d);
  hand.worldToLocal(local.copy(p));const x=-local.x/H,y=local.y/H,z=local.z/H;   // (the right hand: its palm +x; in HAND's terms)
  if(y<HAND.knuckles-.1){const f=z>.38?'fore':z>0?'middle':z>-.38?'ring':'little';near[f]=Math.min(near[f],d);}
  else if(y<HAND.top-.2)near.palm=Math.min(near.palm,d);
 }
 return {deep,near};
}

test('the motion is the one made in Blender: version 2, and on the body it was made on its contacts land where they did there',()=>{
 const motion=normalizeMotion(MOTION);
 assert.equal(motion.version,2);assert.ok(motion.times.length>300&&motion.joints.handR&&motion.shapes.hookL&&motion.face.blink&&motion.reach.R,'joints, shapes, face, reach');
 assert.deepEqual(motion.events.map(e=>e.name),['tabOff','tabPocketed']);
 assert.throws(()=>normalizeMotion({...MOTION,face:{...MOTION.face,blink:MOTION.face.blink.slice(1)}}),/Invalid blink track/);
 // (before it is put right, the rim is as far off his lip as it was in Blender: what it is put right by, there and here)
 const {frames}=drink('Nils Johansson');let worst=0,n=0;
 for(const f of frames){if(f.c.lip<.99||f.c.w<.99)continue;const i=Math.round(f.t*30);if(VERIFY.lipWeight[i]<.99)continue;
  const blender=Math.hypot(...VERIFY.rim[i].map((v,j)=>v-VERIFY.lip[i][j]));worst=Math.max(worst,Math.abs(f.c.fix.lip-blender));n++;}
 assert.ok(n>100&&worst<.003,`the game plays Blender's pose: the rim off his lip as it was there to ${(worst*1000).toFixed(1)} mm (${n} frames)`);
});

for(const seated of [false,true])test(`every body${seated?', seated,':''} drinks it: the rim on the lower lip at every frame it is to be, put right by little`,()=>{
 const report=[];
 for(const who of seated?BODIES.slice(0,3):BODIES){
  const {frames}=drink(who,seated);let rim=0,lip=0,ring=0,n=0;
  for(const f of frames){if(f.c.w<.99)continue;ring=Math.max(ring,f.c.fix.ring);if(f.c.lip<.99)continue;rim=Math.max(rim,f.rimLip);lip=Math.max(lip,f.c.fix.lip);n++;}
  report.push(`${who}: rim ${(rim*1000).toFixed(1)} mm off over ${n} frames, put right by ${(lip*1000).toFixed(1)} (lip) and ${(ring*1000).toFixed(1)} mm (ring)`);
  assert.ok(n>100,`${who}: drinks (${n} frames at the lip)`);
  assert.ok(rim<.002,`${who}: the rim on the lip (${(rim*1000).toFixed(1)} mm)`);
  assert.ok(lip<.012&&ring<.025,`${who}: put right by little: ${report.at(-1)}`);
 }
 console.log(report.join('\n'));
});

test('the can in the hand: the palm and every finger on it, none of it in the can',()=>{
 for(const who of ['Nils Johansson','Thao','Mr Fujita']){
  const {frames}=drink(who);
  for(const f of frames.filter(f=>f.handOnCan)){const {deep,near}=f.handOnCan;
   assert.ok(deep<.0015,`${who} at ${f.t.toFixed(2)} s: the hand ${(deep*1000).toFixed(1)} mm into the can`);
   for(const [part,d] of Object.entries(near))assert.ok(d<.0025,`${who} at ${f.t.toFixed(2)} s: the ${part} ${(d*1000).toFixed(1)} mm off the can`);}
 }
});

test('the can never goes into the face',()=>{
 for(const who of BODIES){const {frames}=drink(who);const worst=Math.max(...frames.map(f=>f.canInFace));
  assert.ok(worst<.002,`${who}: the can ${(worst*1000).toFixed(1)} mm into the face`);}
});

test('the wrists stay within what a wrist does, on every body',()=>{
 for(const who of BODIES){const {frames}=drink(who);let worst=0,at=null;
  for(const f of frames)for(const s of ['R','L'])f.wrist[s].forEach((v,i)=>{const [lo,hi]=PALM_WRIST[i],o=Math.max(lo-v,v-hi);if(o>worst){worst=o;at=`${s} ${'xyz'[i]} at ${f.t.toFixed(2)} s`;}});
  assert.ok(worst<.05,`${who}: a wrist ${worst.toFixed(3)} rad past its limit (${at})`);}
});

test('the can goes further over as it empties, and the eyes shut for the deep swallows, a breath out after',()=>{
 const {frames}=drink('Nils Johansson');
 const pull=(a,b)=>frames.filter(f=>f.t>a&&f.t<b&&f.c.lip>.99);
 for(const [a,b] of [[3.4,5.2],[5.8,7.5]]){const p=pull(a,b);
  assert.ok(p.at(-1).tilt-p[0].tilt>THREE.MathUtils.degToRad(30),`tipped further through the pull from ${a} s (${THREE.MathUtils.radToDeg(p[0].tilt).toFixed(0)} to ${THREE.MathUtils.radToDeg(p.at(-1).tilt).toFixed(0)} degrees)`);
  // (and, while it empties, far enough for what is left to reach the opening: a can holds a fill f below the rim's edge
  // until it is tipped atan((1 - f) h / r))
  p.forEach((f,i)=>{if(!(p[i+1]&&p[i+1].c.fill<f.c.fill-1e-4))return;const need=Math.atan((1-f.c.fill)*.122/.033);assert.ok(f.tilt>Math.min(need,THREE.MathUtils.degToRad(85))-.05,`at ${f.t.toFixed(2)} s, drinking, tipped ${THREE.MathUtils.radToDeg(f.tilt).toFixed(0)}, ${THREE.MathUtils.radToDeg(need).toFixed(0)} needed`);});
 }
 assert.ok(frames.filter(f=>f.t>4&&f.t<4.8).every(f=>f.face.blink>.99),'the eyes shut for the deep swallows');
 assert.ok(frames.some(f=>f.t>5.2&&f.t<5.7&&f.face.talk>0),'a breath out between the pulls');
 assert.ok(frames.some(f=>f.t>7.9&&f.face.expression==='content'),'content after');
 assert.ok(frames.filter(f=>f.t>.4&&f.t<1.2).every(f=>f.face.look?.[1]>0),'the eyes on the can while it is opened');
});

test('a resident drinking a can that is open sips it as animated: the rim on the lip, the eyes shut for the swallow',()=>{
 for(const who of ['Thuan','Mr Fujita']){
  const a=buildAvatar(recipeFor(who),{shadows:false}),holder=new THREE.Group();holder.add(a.root);
  const animator=createAvatarAnimator(a,{random:()=>.5}),prop=createDrinkProp('can',{held:true});a.bones.handR.add(prop);
  const lipLocal=lowerLip(a).lower;let rim=0,n=0,shut=0;const paint=a.paintFace.bind(a);a.paintFace=s=>{if(s.blink>.99)shut++;return paint(s);};
  for(let i=0;i<150;i++){animator.update(1/60,{heldProp:prop,pose:'Drink',consumeElapsed:i/60});holder.updateMatrixWorld(true);const c=animator.canCue;
   assert.ok(c,`${who}: the sip as animated`);
   if(c.lip>.99){rim=Math.max(rim,prop.localToWorld(canRim(prop)).distanceTo(a.bones.head.localToWorld(lipLocal.clone())));n++;}}
  assert.ok(n>20&&rim<.002,`${who}: the rim on the lip, ${n} frames (${(rim*1000).toFixed(1)} mm)`);
  assert.ok(shut>10,`${who}: the eyes shut for the swallow`);
  a.dispose();
 }
});
