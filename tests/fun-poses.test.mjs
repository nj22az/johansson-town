import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {createAvatarAnimator,GESTURES,STORY_POSES,FUN_POSES,STILL_AT} from '../src/avatars/animate.js';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {POSES} from '../src/photo/layout.js';
import {surface} from './body-contact.mjs';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {availableParallelism} from 'node:os';
/** (the tests are the main thread's: a worker thread only answers for its bodies) */
const test=(...a)=>isMainThread?nodeTest(...a):undefined;
installDOM();

/**
 * The funny poses (fun-poses.js; the creator, 2026-10-11: "And add more poses and funny expressions"): each on the body's
 * list of moves with what it is for and the face that goes with it, offered by World's photo studio (and so by Johansson
 * Studio, which reads World's list); and on every body, child to elder, slim to round, played as a move: smooth, the same
 * every time, the feet on the floor (or off it, jumping, and back), the mittens where the pose puts them and in nothing (the
 * head, the hair, the body, the legs).
 */
const base=recipeFor('Thuan'),BODIES=[];
for(const age of ['child','teen','adult','elder'])for(const build of [0,1])for(const proportion of ['classic','rounded'])
 BODIES.push([`${age}, build ${build}, ${proportion}`,normalizeRecipe({...base,name:`Poser ${age} ${build} ${proportion}`,age,body:{...base.body,build,proportion,height:build}}),'clothes']);
for(const [who,outfit] of [['Mr Fujita','clothes'],['Miss Higa','clothes'],['Nhung','clothes'],['Tetsuo','afterbath']])BODIES.push([`${who} (${outfit})`,recipeFor(who),outfit]);
const NAMES=Object.keys(FUN_POSES),JUMPS=new Set(['JumpForJoy','StartledJump']);
/** The poses that leave the floor (fun-poses.js `airborne`): the two jumps, and up the pole. */
const AIRBORNE=new Set(NAMES.filter(name=>FUN_POSES[name].airborne));
/** When the still is taken: as World's photo studio and Johansson Studio take it. */
const stillAt=name=>Number.isFinite(GESTURES[name])?GESTURES[name]*STILL_AT:.7;

function seeded(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function body(recipe,outfit){
 const avatar=buildAvatar(recipe,{shadows:false});avatar.wear(outfit);const holder=new THREE.Group();holder.add(avatar.root);
 const rand=seeded(),own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
 const animator=own(()=>createAvatarAnimator(avatar,{random:rand}));
 const step=(n=1)=>{for(let i=0;i<n;i++){own(()=>animator.update(1/60,{}));avatar.springs?.update(1/60);}holder.updateMatrixWorld(true);};
 return {avatar,animator,step,m:avatar.measure};
}
/** The distance from a point to the nearest of `points`, exactly, or (when that is `bound` or more) a distance no nearer
 *  than `bound`: the points are filed in cubes of `cell` metres and the cubes searched outwards from the point's own, ring
 *  by ring, until no unsearched cube can hold a nearer one, or one nearer than `bound`. (Measured one
 *  by one, every mitten point against every point of the hair, with the ray casts below, a pose took two seconds, and
 *  this file over 900.) */
function nearestOf(points,cell=.02){
 const at=v=>Math.floor(v/cell),key=(i,j,k)=>((i+1024)*2048+(j+1024))*2048+(k+1024),grid=new Map();
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const p of points){const c=[at(p.x),at(p.y),at(p.z)],k=key(...c);let list=grid.get(k);if(!list)grid.set(k,list=[]);list.push(p.x,p.y,p.z);
  for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],c[a]);hi[a]=Math.max(hi[a],c[a]);}}
 // (the same search with nothing made for each point or each ring: the kit's hand put 28 000 points through it a pose)
 return (p,bound=Infinity)=>{
  if(!points.length)return Infinity;
  const c0=at(p.x),c1=at(p.y),c2=at(p.z),last=Math.max(Math.abs(c0-lo[0]),Math.abs(c0-hi[0]),Math.abs(c1-lo[1]),Math.abs(c1-hi[1]),Math.abs(c2-lo[2]),Math.abs(c2-hi[2]));let best=Infinity;
  const read=list=>{if(!list)return;for(let n=0;n<list.length;n+=3){const dx=list[n]-p.x,dy=list[n+1]-p.y,dz=list[n+2]-p.z,d=dx*dx+dy*dy+dz*dz;if(d<best)best=d;}};
  for(let r=0;r<=last;r++){
   // (only the cubes inside the points' own bounds can hold any)
   for(let i=Math.max(-r,lo[0]-c0);i<=Math.min(r,hi[0]-c0);i++)for(let j=Math.max(-r,lo[1]-c1);j<=Math.min(r,hi[1]-c1);j++){
    const k0=Math.max(-r,lo[2]-c2),k1=Math.min(r,hi[2]-c2);
    // (on the ring's edge in i or j, every k; inside it, only its two faces in k)
    if(Math.abs(i)===r||Math.abs(j)===r){for(let k=k0;k<=k1;k++)read(grid.get(key(c0+i,c1+j,c2+k)));}
    else{if(-r>=k0&&-r<=k1)read(grid.get(key(c0+i,c1+j,c2-r)));if(r!==-r&&r>=k0&&r<=k1)read(grid.get(key(c0+i,c1+j,c2+r)));}
   }
   // every cube not yet searched is r + 1 or more cubes from the point's own: at least r cubes away from the point
   if(best<=(r*cell)**2||r*cell>=bound)break;
  }
  return Math.sqrt(best);
 };
}
/** The first hit of a ray from `centre` out along a unit direction with a mesh's triangles (either side), as a distance, or
 *  undefined: the same as Raycaster.intersectObject's nearest, the mesh's triangles first put in the world once and each
 *  given the cone of directions from the centre it can be seen in, so a ray is tested only against the few in its way.
 *  The cones are filed under the cells of a cube of directions (`cells` a side) that each can meet: a ray reads only its
 *  own cell's, every one of which the full list's cone test would also have let through, so the hit is the same. (The
 *  body kit's hand, worn since 26 November 2026, has some 28 000 points on the hands and forearms where the mitten had a
 *  few thousand; each ray against every cone of the head's 20 000 triangles took a pose 10-20 s, and this file hours.) */
function rayFrom(mesh,centre,cells=12){
 mesh.updateWorldMatrix(true,false);
 const P=mesh.geometry.attributes.position,I=mesh.geometry.index,count=I?I.count:P.count,v=new THREE.Vector3(),tris=[];
 const vert=n=>mesh.getVertexPosition(I?I.getX(n):n,v).applyMatrix4(mesh.matrixWorld).clone();
 for(let n=0;n+2<count;n+=3){
  const a=vert(n),b=vert(n+1),c=vert(n+2),dirs=[a,b,c].map(q=>q.clone().sub(centre).normalize()),axis=dirs[0].clone().add(dirs[1]).add(dirs[2]);
  if(axis.lengthSq()<1e-12){tris.push({a,b,c,axis:null});continue;}
  axis.normalize();tris.push({a,b,c,axis,cos:Math.min(...dirs.map(d=>d.dot(axis)))-1e-9});
 }
 // the cube's cells: a direction's cell (its largest component picks the face, the other two over it the square), and each
 // cell's middle direction with the angle to its farthest corner (a cell is a convex patch of the sphere: no point of it is
 // further from its middle than a corner)
 const N=cells,side=t=>Math.min(N-1,Math.floor((t+1)/2*N)),onFace=(f,u,w)=>{const s=f%2?-1:1;return (f<2?new THREE.Vector3(s,u,w):f<4?new THREE.Vector3(u,s,w):new THREE.Vector3(u,w,s)).normalize();};
 const cellOf=d=>{const x=Math.abs(d.x),y=Math.abs(d.y),z=Math.abs(d.z);
  const [f,m,u,w]=x>=y&&x>=z?[d.x>0?0:1,x,d.y,d.z]:y>=z?[d.y>0?2:3,y,d.x,d.z]:[d.z>0?4:5,z,d.x,d.y];return (f*N+side(u/m))*N+side(w/m);};
 const middles=[],radii=[],at=k=>k/N*2-1;
 for(let f=0;f<6;f++)for(let i=0;i<N;i++)for(let j=0;j<N;j++){const mid=onFace(f,at(i+.5),at(j+.5));middles.push(mid);
  radii.push(Math.max(...[[i,j],[i+1,j],[i,j+1],[i+1,j+1]].map(([a,b])=>mid.angleTo(onFace(f,at(a),at(b)))))+1e-5);}
 // a cone meets a cell when the angle between their middles is within the two half-angles together; a cone over a half
 // turn wide (or with no middle) is tested whole, by every ray
 // (each cell filed the first time a ray reads it: the hands near a head look out through a few dozen of them)
 const whole=tris.filter(t=>!t.axis||t.cos<=0),cones=tris.filter(t=>t.axis&&t.cos>0).map(t=>{const hc=Math.min(1,t.cos);return {t,hc,hs:Math.sqrt(1-hc*hc),half:Math.acos(hc)};});
 const filed=new Map(),fileOf=k=>{let list=filed.get(k);if(list)return list;list=[];
  // (cos of the two half-angles together: cos(a + b) = cos a cos b - sin a sin b, both under a half turn)
  const mid=middles[k],r=radii[k],rc=Math.cos(r),rs=Math.sin(r);
  for(const {t,hc,hs,half} of cones)if(half+r>=Math.PI||mid.dot(t.axis)>=hc*rc-hs*rs)list.push(t);
  filed.set(k,list);return list;};
 const ray=new THREE.Ray(),hit=new THREE.Vector3();
 return dir=>{
  ray.set(centre,dir);let best;
  for(const list of [whole,fileOf(cellOf(dir))])for(const t of list){
   // (a cone wider than a half turn does not hold its triangle's directions: tested whole)
   if(t.axis&&t.cos>0&&dir.dot(t.axis)<t.cos)continue;
   if(ray.intersectTriangle(t.a,t.b,t.c,false,hit)){const d=hit.distanceTo(centre);if(best===undefined||d<best)best=d;}
  }
  return best;
 };
}
/** How the mittens and forearms sit against their own body: the deepest any point of them goes into the drawn head (from
 *  the head's middle out through the point to the head's own mesh; metres, negative inside), how deep a mitten goes into the
 *  torso (as bodyVolume has it, where the hips and the chest have taken it) and into the legs (round limbs of the legs'
 *  thickness): metres, negative inside. And how near each mitten comes to the head (its own mesh, the hair, the ears). */
function selfContact(b){
 const {avatar,m}=b,vol=bodyVolume(avatar.recipe,m),bones=avatar.bones;avatar.root.updateMatrixWorld(true);
 const frames=[['hips',m.hipY],['chest',m.chestY]].map(([n,y])=>[bones[n].matrixWorld.clone().invert(),y]);
 const torso=p=>Math.min(...frames.map(([inv,y])=>{const v=p.clone().applyMatrix4(inv);v.y+=y;return vol.sdf(v);}));
 const legs=['L','R'].flatMap(s=>[[bones['thigh'+s],bones['knee'+s],m.legR],[bones['knee'+s],bones['foot'+s],m.legR*.9]]).map(([a,c,r])=>[new THREE.Line3(a.getWorldPosition(new THREE.Vector3()),c.getWorldPosition(new THREE.Vector3())),r]);
 const mesh=avatar.face.head,centre=bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),cast=rayFrom(mesh,centre),q=new THREE.Vector3();
 const hair=nearestOf(surface(avatar,{only:n=>n==='head'}).map(a=>a.p));
 let head=Infinity,body=Infinity,leg=Infinity;const near={L:Infinity,R:Infinity};
 for(const {p,bone} of surface(avatar,{only:n=>/^(hand|elbow)[LR]$/.test(n)})){
  const d=p.clone().sub(centre),r=d.length();
  let gap=Infinity;if(r<m.Rh*1.6){const hit=cast(d.normalize());if(hit!==undefined){gap=r-hit;head=Math.min(head,gap);}}
  if(bone.startsWith('hand')){body=Math.min(body,torso(p));for(const [l,lr] of legs)leg=Math.min(leg,l.closestPointToPoint(p,true,q).distanceTo(p)-lr);
   // how near the mitten is to the head: to its drawn surface straight out from its middle, or to the hair and the ears
   const s=bone.at(-1);near[s]=Math.min(near[s],gap);if(r<m.Rh*2)near[s]=Math.min(near[s],hair(p,near[s]));}
 }
 return {head,body,leg,near};
}
/** A body's mittens against its torso in the town's own poses that lay them by it (standing easy, hands on the hips). */
function reference(recipe,outfit){
 let body=Infinity;
 for(const name of ['Idle','HandsOnHips']){const b=pose(recipe,outfit,name==='Idle'?null:name);body=Math.min(body,selfContact(b).body);b.avatar.dispose();}
 return body;
}
/** Each body's self contact in each pose at the still, as the test of them all found it: the hands' test reads the same
 *  ones (who|name), so the same pose is not posed and measured twice. */
const CONTACTS=new Map();
/** A body on its mark, in `name` at the still (or standing). */
function pose(recipe,outfit,name){const b=body(recipe,outfit);b.step(20);if(name){b.animator.play(name);b.step(Math.round(stillAt(name)*60));}return b;}

/** The bodies the moves are played on (the last test): a child, an adult round and slim, Fujita. */
const PLAYED=[BODIES[4],BODIES[11],BODIES.at(-4)];
/**
 * Each body's share of the work done in a thread of its own, a few at once, and the answers in the bodies' order: the same
 * code and the same answers as one after another (each body is built and seeded on its own), in a third of the time on four
 * cores. (Every pose on every body, one at a time, took the file 12 minutes; with the mitten's few thousand points it had
 * taken one.) A thread runs this file with `workerData` and does only its body.
 */
const JOBS={stills:stillsOf,plays:playsOf};
async function shared(kind,indices){
 const threads=Math.max(1,Math.min(3,availableParallelism()-1,indices.length)),queue=indices.map((index,at)=>({index,at})),out=new Array(indices.length);
 const run=()=>new Promise((resolve,reject)=>{const next=()=>{const job=queue.shift();if(!job){worker?.terminate();return resolve();}
   if(!worker){worker=new Worker(new URL(import.meta.url),{workerData:{kind}});worker.on('message',m=>{out[current.at]=m;next();});worker.on('error',reject);}
   current=job;worker.postMessage(job.index);};
  let worker=null,current=null;next();});
 await Promise.all(Array.from({length:threads},run));
 return out;
}
if(!isMainThread)parentPort.on('message',index=>parentPort.postMessage(JOBS[workerData.kind](index)));
test('every funny pose is on the body’s list with what it is for and its face, and World’s photo studio offers it',()=>{
 assert.ok(NAMES.length>=12,'a dozen of them: '+NAMES.length);
 for(const [name,p] of Object.entries(FUN_POSES)){
  assert.equal(GESTURES[name],p.d,name+' plays as a move');assert.ok(!STORY_POSES.has(name),name+' is not a story’s held pose');
  assert.ok(p.label?.length>2&&p.label.length<20,name+' has a short label');assert.ok(p.use?.length>40,name+' says when to use it');
  assert.ok(EXPRESSION_NAMES.includes(p.face),name+'’s face is one the face painter knows: '+p.face);
  assert.ok(POSES.includes(name),name+' is in the photo studio');
 }
});

/** One body in every funny pose at the still (the test below): what is wrong, and its self contact in each pose. */
function stillsOf(index){
 const [who,recipe,outfit]=BODIES[index],wrong=[],contacts=[],ref=reference(recipe,outfit);
 for(const name of NAMES){
  const b=pose(recipe,outfit,name),c=selfContact(b),tag=`${name}, ${who}`;contacts.push([who+'|'+name,c]);
  if(c.head<-.003)wrong.push(`${tag}: an arm ${(-c.head*1000).toFixed(0)} mm into the head`);
  if(c.body<Math.min(ref,0)-.004)wrong.push(`${tag}: a mitten ${(-c.body*1000).toFixed(0)} mm into the body (standing easy: ${(-ref*1000).toFixed(0)})`);
  if(c.leg<-.004)wrong.push(`${tag}: a mitten ${(-c.leg*1000).toFixed(0)} mm into a leg`);
  const low=Math.min(...surface(b.avatar,{only:n=>/^foot/.test(n)}).map(a=>a.p.y),...surface(b.avatar,{stride:3}).map(a=>a.p.y));
  if(AIRBORNE.has(name)?low<.02:Math.abs(low)>.004)wrong.push(`${tag}: ${AIRBORNE.has(name)?'not in the air':'off the floor'} (${(low*1000).toFixed(0)} mm)`);
  b.avatar.dispose();
 }
 return {wrong,contacts};
}
test('on every body, at the still: in nothing (the head, the body, the legs), on the floor or jumping off it',async()=>{
 const wrong=[];
 for(const r of await shared('stills',BODIES.map((_,i)=>i))){wrong.push(...r.wrong);for(const [key,c] of r.contacts)CONTACTS.set(key,c);}
 assert.deepEqual(wrong,[]);
});
test('the hands go where the pose says: on the cheeks, over the eyes, on the head, before the lips, at the brow',()=>{
 const HEAD={JawDrop:['L','R'],Facepalm:['R'],OhNo:['L','R'],HideFace:['L','R'],Shush:['R'],Salute:['R'],Swoon:['R']},wrong=[],gaps=[];
 // (a big round head on short arms reaches as near as it can: tested above for being in nothing)
 for(const [who,recipe,outfit] of BODIES.filter(([n])=>!n.includes('rounded')))for(const [name,sides] of Object.entries(HEAD)){
  const c=CONTACTS.get(who+'|'+name)??(()=>{const b=pose(recipe,outfit,name),c=selfContact(b);b.avatar.dispose();return c;})();
  // within a mitten's thickness of the head everywhere, and on average closer
  for(const s of sides){if(c.near[s]>.05)wrong.push(`${name}, ${who}: the ${s} mitten ${(c.near[s]*1000).toFixed(0)} mm off the head`);gaps.push(c.near[s]);}
 }
 assert.deepEqual(wrong,[]);
 const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length;assert.ok(mean<.03,'on average '+(mean*1000).toFixed(0)+' mm off the head');
});

/** The joints a move is watched on (the test below). */
const JOINTS=['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR'];
/** A move played on a body: the fastest any joint turns in a frame, the most the root moves in one, every frame, and how
 *  far from the body without the move the joints are a moment after it. */
// (`again`: the move played a second time only for its frames, to see it is the same: the body without the move, which
// only the first play's `off` reads, is not made for it; each body has its own seeded clock, so nothing else changes)
const play=(recipe,outfit,name,again=false)=>{const b=body(recipe,outfit),still=again?null:body(recipe,outfit);b.step(20);still?.step(20);b.animator.play(name,Number.isFinite(GESTURES[name])?undefined:2.4);
 let prev=JOINTS.map(j=>b.avatar.bones[j].quaternion.clone()),prevY=b.avatar.root.position.y,fastest=0,jump=0;const frames=[];
 for(let f=0;f<Math.round((Math.min(GESTURES[name],2.4)+1.2)*60);f++){b.step();still?.step();const now=JOINTS.map(j=>b.avatar.bones[j].quaternion.clone());
  now.forEach((q,i)=>fastest=Math.max(fastest,q.angleTo(prev[i])));jump=Math.max(jump,Math.abs(b.avatar.root.position.y-prevY));prev=now;prevY=b.avatar.root.position.y;frames.push(now.flatMap(q=>q.toArray()));}
 const off=still?Math.max(...JOINTS.map(j=>b.avatar.bones[j].quaternion.angleTo(still.avatar.bones[j].quaternion))):null;
 b.avatar.dispose();still?.avatar.dispose();return {fastest,jump,off,frames};};
/** The same frames, number for number (as assert.deepStrictEqual has them: Object.is, so 0 and -0 differ). */
const sameFrames=(a,b)=>a.length===b.length&&a.every((f,i)=>f.length===b[i].length&&f.every((v,j)=>Object.is(v,b[i][j])));
/** One body's every funny move played twice (the test below): what is wrong. */
function playsOf(index){
 const [who,recipe,outfit]=BODIES[index],wrong=[];
 // (a body's own way of standing comes undone as any move begins and comes back after: Fujita's hands behind his back. The
 // town's own photo pose with the hands at the cheeks says how fast that is on this body.)
 const ref=play(recipe,outfit,'DoubleCheek').fastest;
 for(const name of NAMES){const a=play(recipe,outfit,name),limit=JUMPS.has(name)||name==='FistPump'?.22:Math.max(.15,ref+.005);
  if(a.fastest>limit)wrong.push(`${name}, ${who}: a joint turns ${a.fastest.toFixed(3)} rad in a frame (up to ${limit.toFixed(3)})`);
  if(a.jump>.04)wrong.push(`${name}, ${who}: the body jumps ${a.jump.toFixed(3)} m in a frame`);
  if(a.off>.04)wrong.push(`${name}, ${who}: ${a.off.toFixed(3)} rad from where it would be without the pose`);
  if(!sameFrames(play(recipe,outfit,name,true).frames,a.frames))wrong.push(`${name}, ${who}: not the same every time`);}
 return wrong;
}
test('each plays and lets go smoothly, the same every time, and the body is itself again after',async()=>{
 const wrong=(await shared('plays',[BODIES.indexOf(PLAYED[0]),BODIES.indexOf(PLAYED[1]),BODIES.indexOf(PLAYED[2])])).flat();
 assert.deepEqual(wrong,[]);
});
