import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor,ORIGINAL_THUAN_RECIPE} from '../src/avatars/cast.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {createAvatarAnimator,FLOOR_SIT} from '../src/avatars/animate.js';
import {seatContactHeight} from './seating-contact.mjs';
import {surface} from './body-contact.mjs';
installDOM();

/**
 * Sitting on the floor (the creator, 2026-10-11, of a man in Johansson Studio's Build scene sitting on the ground with his legs
 * straight out and his shoes lying flat, soles down: "He should not sit like that, no one should, the feet should show, or
 * soles of the shoes, he should sit like a baby on the floor and toes up"). Every body, child to elder, slim to round, in
 * everything the town dresses it in, sits on the floor like a small child (FLOOR_SIT): the bottom on the floor, the legs out
 * in front, the heels on the floor and the toes up so the soles face forward, the knees almost straight, the back upright,
 * the mittens on the thighs. On a cushion the thighs lie level on it and the heels reach the floor in front of it. Nothing goes
 * below the floor (the cloth of a skirt, a wrap or a dress lies on it, as drawn). A chair or a bench is sat on as before.
 * Getting down onto the floor and up again goes through a squat, smoothly, never through the floor.
 */
const base=recipeFor('Thuan');
const BODIES=[];
for(const age of ['child','teen','adult','elder'])for(const build of [0,1])for(const proportion of ['classic','rounded'])
 BODIES.push([`${age}, build ${build}, ${proportion}`,normalizeRecipe({...base,name:`Sitter ${age} ${build} ${proportion}`,age,body:{...base.body,build,proportion,height:build}}),'clothes']);
for(const [who,outfits] of [['Mr Fujita',['clothes','afterbath','swim','towel']],['Miss Higa',['clothes','afterbath']],['Nhung',['towel','afterbath']],['Tetsuo',['afterbath']]])
 for(const outfit of outfits)BODIES.push([`${who} (${outfit})`,recipeFor(who),outfit]);
BODIES.push(['Thuan in her pleated skirt',ORIGINAL_THUAN_RECIPE,'clothes']);

/** A body on its mark (facing -z, as the town's do), set going with `state` for `frames` sixtieths of a second. */
function seeded(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function sit(recipe,outfit,state,frames=60){
 const avatar=buildAvatar(recipe,{shadows:false});avatar.wear(outfit);const holder=new THREE.Group();holder.add(avatar.root);
 const rand=seeded(),own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
 const animator=own(()=>createAvatarAnimator(avatar,{random:rand}));
 const step=(st,n=1)=>{for(let i=0;i<n;i++){own(()=>animator.update(1/60,st));avatar.springs?.update(1/60);}holder.updateMatrixWorld(true);};
 step(state,frames);return {avatar,animator,holder,step,m:avatar.measure};
}
/** The lap as it is drawn (world): the thighs and what is worn on them, and the cloth of a skirt or a dress lying on it where
 *  the fit puts it (towel-fit.js kind 2), not the rest of the body. */
function lapSurface(avatar){
 const out=[],p=new THREE.Vector3(),rest=new THREE.Vector3();avatar.root.updateMatrixWorld(true);
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const g=mesh.geometry,P=g.attributes.position,I=g.attributes.skinIndex,F=g.attributes.towelFit,fit=F&&mesh.towelFit,names=mesh.skeleton.bones.map(b=>b.name);
  if(fit)fit.refresh();
  for(let i=0;i<P.count;i++){const cloth=!!fit&&F.getX(i)>1.5;if(fit&&!cloth&&F.getX(i)>.5)continue;if(!cloth&&!/^thigh[LR]$/.test(names[I.getX(i)]))continue;
   mesh.getVertexPosition(i,p);if(cloth)fit.fitPoint(p,F.getX(i),rest.fromBufferAttribute(P,i));out.push(p.clone().applyMatrix4(mesh.matrixWorld));}
 }
 return out;
}
/** Each foot's lowest drawn point (the back of the heel when the toes are up). */
const heels=b=>['L','R'].map(s=>Math.min(...surface(b.avatar,{only:n=>n==='foot'+s}).map(q=>q.p.y)));
/** Which way a bone's own axis points in the world. */
const axis=(b,bone,v)=>new THREE.Vector3(...v).transformDirection(b.avatar.bones[bone].matrixWorld);
const AHEAD=new THREE.Vector3(0,0,-1);

test('on the floor every body sits like a small child: the bottom and the heels on the floor, the toes up and the soles facing forward',()=>{
 for(const [name,recipe,outfit] of BODIES){
  const b=sit(recipe,outfit,{seated:true,seatHeight:0});
  assert.ok(Math.abs(seatContactHeight(b.avatar))<2e-3,`${name}: the bottom on the floor (${seatContactHeight(b.avatar).toFixed(4)})`);
  for(const [s,y] of heels(b).entries())assert.ok(Math.abs(y)<1.5e-3,`${name}: the ${s?'right':'left'} heel on the floor (${(y*1000).toFixed(1)} mm)`);
  for(const s of ['L','R']){
   const toes=axis(b,'foot'+s,[0,0,1]),sole=axis(b,'foot'+s,[0,-1,0]);
   assert.ok(toes.y>.85,`${name}: the toes up (${toes.y.toFixed(2)})`);
   assert.ok(sole.dot(AHEAD)>.85,`${name}: the sole facing forward (${sole.dot(AHEAD).toFixed(2)})`);
   // the toes above the heel, the legs out in front: the ankle well ahead of the hip, the knee nearly straight
   const toe=surface(b.avatar,{only:n=>n==='foot'+s}).reduce((a,q)=>q.p.y>a.p.y?q:a).p,heel=heels(b)[s==='L'?0:1];
   assert.ok(toe.y>heel+b.m.legR,`${name}: the toes well above the heel`);
   const hip=b.avatar.bones['thigh'+s].getWorldPosition(new THREE.Vector3()),ankle=b.avatar.bones['foot'+s].getWorldPosition(new THREE.Vector3());
   assert.ok(hip.z-ankle.z>(b.m.thigh+b.m.shin)*.9,`${name}: the leg out in front`);
   assert.ok(b.avatar.bones['knee'+s].rotation.x<.4,`${name}: the knee nearly straight (${b.avatar.bones['knee'+s].rotation.x.toFixed(2)})`);
  }
  // the back upright or leaning back a little, never slumped forward
  const up=b.avatar.bones.neck.getWorldPosition(new THREE.Vector3()).sub(b.avatar.bones.hips.getWorldPosition(new THREE.Vector3())).normalize();
  assert.ok(up.y>.95&&up.z>=-.05,`${name}: the back upright (${up.toArray().map(v=>v.toFixed(2))})`);
  b.avatar.dispose();
 }
});

test('nothing goes below the floor: skirts, wraps and dresses lie on it, as they are drawn',()=>{
 for(const [name,recipe,outfit] of BODIES){
  const b=sit(recipe,outfit,{seated:true,seatHeight:0}),m=b.m,q=new THREE.Vector3();
  // (only cloth pressed under a thigh, between it and the floor where nothing can see it, may go a little into the floor)
  const thighs=['L','R'].map(s=>new THREE.Line3(b.avatar.bones['thigh'+s].getWorldPosition(new THREE.Vector3()),b.avatar.bones['knee'+s].getWorldPosition(new THREE.Vector3())));
  const under=p=>thighs.some(t=>{const c=t.closestPointToPoint(p,true,q);return Math.hypot(c.x-p.x,c.z-p.z)<m.legR*1.1&&p.y<c.y;});
  for(const {p,bone} of surface(b.avatar))if(p.y<-1.5e-3){
   assert.ok(under(p),`${name}: ${bone} ${(p.y*-1000).toFixed(1)} mm below the floor, in sight`);
   assert.ok(p.y>-6e-3,`${name}: ${bone} ${(p.y*-1000).toFixed(1)} mm below the floor`);}
  b.avatar.dispose();
 }
});

test('the mittens rest on the thighs, or (arms too short for that over a round body) on the floor beside the hips: in nothing',()=>{
 let onThighs=0;
 for(const [name,recipe,outfit] of BODIES){
  const b=sit(recipe,outfit,{seated:true,seatHeight:0}),m=b.m,q=new THREE.Vector3(),vol=bodyVolume(b.avatar.recipe,m);
  const frames=[['hips',m.hipY],['chest',m.chestY]].map(([n,y])=>[b.avatar.bones[n].matrixWorld.clone().invert(),y]);
  const torso=p=>Math.min(...frames.map(([inv,y])=>{const v=p.clone().applyMatrix4(inv);v.y+=y;return vol.sdf(v);}));
  const near=[],lap=lapSurface(b.avatar);
  for(const s of ['L','R']){
   const thigh=new THREE.Line3(b.avatar.bones['thigh'+s].getWorldPosition(new THREE.Vector3()),b.avatar.bones['knee'+s].getWorldPosition(new THREE.Vector3()));
   const pts=surface(b.avatar,{only:n=>n==='hand'+s}).map(({p})=>p),mid=pts.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/pts.length);
   // (on the thigh, or on what is worn over it under the mitten: shorts, a skirt's or a dress's cloth on the lap; the mitten
   // lies on them, not in them, seated-pose.test.mjs)
   const worn=Math.max(m.legR*1.15,...lap.filter(p=>p.y<mid.y&&Math.hypot(p.x-mid.x,p.z-mid.z)<m.hand*.6).map(p=>{const t=thigh.closestPointToPointParameter(p,false);return t>.05&&t<.95?thigh.at(t,q).distanceTo(p):0;}));
   const d=Math.min(...pts.map(p=>thigh.closestPointToPoint(p,true,q).distanceTo(p)-worn));
   assert.ok(Math.min(...pts.map(torso))>-.002,`${name}: the ${s} mitten in the body`);
   // on the thigh: over it, on it (on the cloth over it: a robe's or a skirt's) and not in it
   const hip=thigh.start,c=pts.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/pts.length);
   if(d<.025){assert.ok(d>-.008,`${name}: the ${s} mitten in the thigh (${(d*1000).toFixed(1)} mm)`);near.push(true);continue;}
   // beside the hips: out to the side of the thigh, clear of it, down toward the floor and never through it
   assert.ok(Math.abs(c.x)>Math.abs(hip.x)+m.legR,`${name}: the ${s} mitten beside the hip, clear of the thigh (${(d*1000).toFixed(1)} mm)`);
   assert.ok(Math.min(...pts.map(p=>p.y))>-1.5e-3,`${name}: the ${s} mitten through the floor`);
   const elbow=b.avatar.bones['elbow'+s].getWorldPosition(new THREE.Vector3());
   assert.ok(c.y<elbow.y-m.fore*.6&&c.y<hip.y+m.legR*4,`${name}: the ${s} mitten down by the hip, not held up (${(c.y-hip.y).toFixed(3)} over the hip)`);near.push(false);
  }
  assert.equal(near[0],near[1],`${name}: both mittens the same way`);if(near[0])onThighs++;
  b.avatar.dispose();
 }
 // most bodies (every one of the town's people among them) have their mittens on their thighs
 assert.ok(onThighs>=BODIES.length/2,'on the thighs: '+onThighs+' of '+BODIES.length);
});

test('on a floor cushion the thighs lie level on it and the heels reach the floor in front of it, the toes up',()=>{
 for(const [name,recipe,outfit] of BODIES.filter(([,r])=>r.body.proportion!=='rounded'||r.age==='adult'||r.age==='elder')){
  const b=sit(recipe,outfit,{seated:true,seatHeight:.09});
  assert.ok(Math.abs(seatContactHeight(b.avatar)-.09)<2e-3,`${name}: on the cushion`);
  for(const y of heels(b))assert.ok(Math.abs(y)<1.5e-3,`${name}: a heel on the floor (${(y*1000).toFixed(1)} mm)`);
  for(const s of ['L','R']){
   const thigh=b.avatar.bones['knee'+s].getWorldPosition(new THREE.Vector3()).sub(b.avatar.bones['thigh'+s].getWorldPosition(new THREE.Vector3())).normalize();
   assert.ok(thigh.y>-.02,`${name}: the thigh level or rising, not dipping into the cushion (${thigh.y.toFixed(3)})`);
   assert.ok(axis(b,'foot'+s,[0,0,1]).y>.8,`${name}: the toes up`);
  }
  b.avatar.dispose();
 }
});

test('a chair, a bench or a stool is sat on as before: the thighs on the seat, the shins down',()=>{
 for(const seat of [.45,.3,.26])for(const [name,recipe,outfit] of BODIES.slice(0,16)){
  const b=sit(recipe,outfit,{seated:true,seatHeight:seat});
  assert.ok(Math.abs(seatContactHeight(b.avatar)-seat)<2e-3,`${name} on ${seat}: on the seat`);
  for(const s of ['L','R']){const r=b.avatar.bones['thigh'+s].rotation,k=b.avatar.bones['knee'+s].rotation.x;
   assert.ok(Math.abs(r.x+1.52)<.02&&Math.abs(r.y)<1e-6,`${name} on ${seat}: the thigh on the seat as before (${r.x.toFixed(3)})`);
   assert.ok(k>.9,`${name} on ${seat}: the shin down (${k.toFixed(2)})`);}
  b.avatar.dispose();
 }
});

test('getting down onto the floor and up again: through a squat, smoothly, never through the floor, the same every time',()=>{
 const LEGS=['thighL','kneeL','footL','thighR','kneeR','footR'];
 for(const [name,recipe,outfit] of [BODIES[0],BODIES[5],BODIES[9],BODIES.find(([n])=>n.startsWith('Miss Higa')),BODIES.at(-1)]){
  // as the player sits on a cushion: seated, with no blend of the scene's own; and as a resident: the scene's chairBlend
  for(const how of ['animator','scene']){
   const run=()=>{
    const b=sit(recipe,outfit,{},30),frames=[];let prev=null,prevY=b.avatar.root.position.y,low=0,squat=0;
    for(let f=0;f<240;f++){
     const t=f/60,blend=t<1?Math.min(1,t/.7):Math.max(0,1-(t-2)/.7),state=how==='scene'?(blend>0?{seated:true,seatHeight:0,chairBlend:blend}:{}):(t<2?{seated:true,seatHeight:0}:{});
     b.step(state);
     const now=LEGS.map(j=>b.avatar.bones[j].quaternion.clone());
     if(prev)for(let i=0;i<now.length;i++)assert.ok(now[i].angleTo(prev[i])<.2,`${name} (${how}) at ${t.toFixed(2)} s: the ${LEGS[i]} turns ${now[i].angleTo(prev[i]).toFixed(3)} rad in a frame`);
     assert.ok(Math.abs(b.avatar.root.position.y-prevY)<.035,`${name} (${how}) at ${t.toFixed(2)} s: the body drops ${(b.avatar.root.position.y-prevY).toFixed(3)} m in a frame`);
     prev=now;prevY=b.avatar.root.position.y;
     if(f%4===0)low=Math.min(low,...surface(b.avatar,{stride:3}).map(q=>q.p.y));
     squat=Math.max(squat,b.avatar.bones.kneeL.rotation.x);frames.push(now.flatMap(q=>q.toArray()));
    }
    assert.ok(low>-4e-3,`${name} (${how}): ${(-low*1000).toFixed(1)} mm below the floor on the way`);
    assert.ok(squat>FLOOR_SIT.squat.knee*.8,`${name} (${how}): down through a squat (the knees bent ${squat.toFixed(2)})`);
    // and up again, standing on the floor as before
    assert.ok(Math.abs(Math.min(...heels(b)))<2e-3,`${name} (${how}): standing on the floor after`);
    b.avatar.dispose();return frames;
   };
   assert.deepEqual(run(),run(),`${name} (${how}) the same every time`);
  }
 }
});

test('a scene that draws a body bigger or smaller (Johansson Studio’s size) gets the same floor sit, the mittens where they were',()=>{
 for(const [name,recipe,outfit] of [BODIES[0],BODIES[1],BODIES[10],BODIES.find(([n])=>n.startsWith('Mr Fujita'))]){
  const plain=sit(recipe,outfit,{seated:true,seatHeight:0});
  for(const size of [.8,1.25]){
   const avatar=buildAvatar(recipe,{shadows:false});avatar.wear(outfit);avatar.root.scale.setScalar(size);
   const rand=seeded(),own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
   const animator=own(()=>createAvatarAnimator(avatar,{random:rand}));
   for(let i=0;i<60;i++){own(()=>animator.update(1/60,{seated:true,seatHeight:0}));avatar.springs?.update(1/60);}
   for(const j of ['hips','chest','thighL','kneeL','footL','shoulderR','elbowR','handR','shoulderL','elbowL'])
    assert.ok(avatar.bones[j].quaternion.angleTo(plain.avatar.bones[j].quaternion)<1e-4,`${name} at ${size}: ${j} not as at full size`);
   assert.ok(Math.abs(avatar.root.position.y-plain.avatar.root.position.y)<1e-6,`${name} at ${size}: the root (in the body's own units) where it was`);
   avatar.dispose();
  }
  plain.avatar.dispose();
 }
});
