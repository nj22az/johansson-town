import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES,STORY_POSES,CARRY,REACH_BACK} from '../src/avatars/animate.js';
import {MOVES} from '../src/avatars/moves.js';
import {STORY_PROPS,BASKET,CORD,PAPER,TORCH,pocketSpot,storyProps} from '../src/avatars/story-props.js';
import {drawFace,faceLayout} from '../src/avatars/face.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {seatContactHeight} from './seating-contact.mjs';
import {surface,core,intrusion as coreIntrusion,clearance} from './body-contact.mjs';
installDOM();

/**
 * The moves Fujita's Back needs (story v7; the shot plan's section 5), each on the person and in the clothes the story gives
 * it: Fujita stuck bent (standing, shuffling sideways, in the massage chair uncurling and stuck in a new shape, carried bent,
 * and carried stiff and level like a plank), the three women carrying him, Thao wound in her dryer's cord, Thuan under a
 * basket, Tetsuo reading and with his torch, Miss Higa reaching back for the supply breaker; and Fujita's squinting eyes
 * following his face. Each plays as a move and as a pose the scene names, holds, and lets go smoothly
 * and the same every time; the feet, the seat or the carriers hold the body; the mittens are where they belong (on the back,
 * on the knee, under the load, at the paper's edges, round the torch) and in nothing; the props rest on what carries them.
 */
const FPS=60,dt=1/FPS;
const NEW=['BentStuck','CrabWalk','ChairUncurl','FrozenAbsurd','CarriedBent','CarriedPlank','CarryFurniture','CarryLegs','CordWrapped','BasketHead','SitRead','TorchUp','TorchOff','ReachBack'];
/** The moves that are over when their time is (the rest are held until let go). */
const TIMED={ReachBack:3.2};
const F={who:'Mr Fujita',outfit:'afterbath'},FC={who:'Mr Fujita',outfit:'clothes'},T={who:'Tetsuo',outfit:'afterbath'};
const CHAIR={seated:true,seatHeight:.5},KOAGARI={seated:true,seatHeight:.3},STOOL={seated:true,seatHeight:.4};
/** Every place the story uses each move (the shot plan's marks): who, in what, doing what. */
const CASES=[
 ['BentStuck',FC],['BentStuck',F],['CrabWalk',F],['CrabWalk',{...F,state:{speed:.35},walking:true}],
 ['ChairUncurl',{...F,state:CHAIR}],['FrozenAbsurd',{...F,state:CHAIR}],['CarriedBent',F],['CarriedBent',{who:'Mr Fujita',outfit:'swim'}],
 ['CarriedPlank',F],['CarriedPlank',{who:'Mr Fujita',outfit:'swim'}],
 ['CarryFurniture',{who:'Thuan',outfit:'towel'}],['CarryFurniture',{who:'Nhung',outfit:'towel',state:{speed:.6},walking:true}],['CarryFurniture',{who:'Thao',outfit:'towel'}],
 ['CarryLegs',{who:'Thuan',outfit:'towel'}],['CarryLegs',{who:'Thuan',outfit:'towel',state:{speed:.6},walking:true}],
 ['CordWrapped',{who:'Thao',outfit:'towel'}],['BasketHead',{who:'Thuan',outfit:'towel'}],
 ['SitRead',{...T,state:KOAGARI}],['TorchUp',T],['TorchOff',T],
 ['ReachBack',{who:'Miss Higa',outfit:'clothes',state:STOOL}],
];
const label=(name,c)=>`${name} (${c.who}, ${c.outfit}${c.state?.seated?', seated':''}${c.walking?', walking':''})`;
function seededRandom(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function withRandom(rand,fn){const orig=Math.random;Math.random=rand;try{return fn();}finally{Math.random=orig;}}
function cast(c){
 const avatar=buildAvatar(recipeFor(c.who),{shadows:false});avatar.wear(c.outfit);
 const holder=new THREE.Group();holder.add(avatar.root);const rand=seededRandom();
 const animator=withRandom(rand,()=>createAvatarAnimator(avatar,{random:rand}));
 const looks=[];const paint=avatar.paintFace.bind(avatar);avatar.paintFace=s=>{looks.push(s.look);return paint(s);};
 const state={...(c.state||{})};
 const step=(n=1)=>{for(let i=0;i<n;i++){withRandom(rand,()=>animator.update(dt,state));avatar.springs?.update(dt);}holder.updateMatrixWorld(true);};
 return {avatar,holder,animator,step,looks,state,m:avatar.measure};
}
const JOINTS=['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR'];
const rotations=a=>JOINTS.flatMap(j=>a.bones[j].quaternion.toArray());
/** The body's frame on its mark: x to their left, y up from the floor, z ahead (the holder's, turned round as the body is). */
const local=(b,v)=>{const p=b.holder.worldToLocal(v.clone());return p.set(-p.x,p.y,-p.z);};
const world=(b,bone,p=[0,0,0])=>b.avatar.bones[bone].localToWorld(new THREE.Vector3(...p));
const mitten=(b,side)=>local(b,world(b,'hand'+side,[0,-b.m.hand*.55,0]));
/** The drawn skin and cloth, posed: [point in the body's frame, its main bone]. */
function skin(b,stride=1){
 const out=[],p=new THREE.Vector3();
 for(const mesh of b.avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,r=mesh.geometry.drawRange,end=Math.min(P.count,r.start+r.count);
  for(let i=r.start;i<end;i+=stride){mesh.getVertexPosition(i,p);mesh.localToWorld(p);out.push([local(b,p),mesh.skeleton.bones[I.getX(i)]?.name]);}
 }
 return out;
}
const lowest=b=>Math.min(...skin(b,2).map(([p])=>p.y),...(()=>{const h=b.avatar.face.head,P=h.geometry.attributes.position,v=new THREE.Vector3(),o=[];for(let i=0;i<P.count;i+=3){v.fromBufferAttribute(P,i);h.localToWorld(v);o.push(local(b,v).y);}return o;})());
function soles(b){
 const body=b.avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
 const {position,skinIndex,skinWeight}=body.geometry.attributes,feet=['footL','footR'].map(n=>body.skeleton.bones.indexOf(b.avatar.bones[n])),idx=[];
 for(let i=0;i<position.count;i++)if(feet.includes(skinIndex.getX(i))&&skinWeight.getX(i)>.999)idx.push(i);
 const p=new THREE.Vector3();return ()=>{let low=Infinity;for(const i of idx){body.getVertexPosition(i,p);body.localToWorld(p);low=Math.min(low,local(b,p).y);}return low;};
}
/** A mitten's drawn surface: its vertices, in the body's frame. */
function mittenPoints(b,side){return skin(b).filter(([,bone])=>bone==='hand'+side).map(([p])=>p);}
/** How far a point (the body's frame) is from the torso's surface, with the torso where the hips and the chest have taken it. */
function torsoDistance(b){
 const vol=bodyVolume(b.avatar.recipe,b.m),m=b.m;
 const frames=[['hips',m.hipY],['chest',m.chestY]].map(([bone,y])=>[b.avatar.bones[bone].matrixWorld.clone().invert(),y]);
 return p=>Math.min(...frames.map(([inv,y])=>{const q=b.holder.localToWorld(new THREE.Vector3(-p.x,p.y,-p.z)).applyMatrix4(inv);q.y+=y;return vol.sdf(q);}));
}

test('the moves are on the body’s list, and the scene can name each as a pose; none is on the moves menu',()=>{
 for(const name of NEW){assert.equal(GESTURES[name],TIMED[name]??Infinity,name);assert.ok(STORY_POSES.has(name),name);assert.ok(!MOVES.some(([n])=>n===name),name);}
 // every prop says who it is for, why, and where it is
 for(const [kind,p] of Object.entries(STORY_PROPS))for(const k of ['who','why','where'])assert.ok(p[k]?.length>(k==='who'?2:20),kind+' '+k);
});

test('every move plays, holds and lets go: as a move and as a pose, smoothly, nothing lost, the same every time',()=>{
 for(const [name,c] of CASES)for(const as of ['move','pose']){
  const run=()=>{
   const b=cast(c),control=cast(c);b.step(30);control.step(30);
   if(as==='move')assert.ok(b.animator.play(name,3),label(name,c)+' plays');else b.state.pose=name;
   const frames=[];let prev=rotations(b.avatar),prevRoot=b.avatar.root.position.clone(),fastest=0,jump=0;
   for(let f=0;f<Math.round(5.2*FPS);f++){
    if(as==='pose'&&f===3*FPS)delete b.state.pose;
    b.step();control.step();const now=rotations(b.avatar);
    assert.ok(now.every(Number.isFinite),label(name,c)+': a joint is not a number at frame '+f);
    // No snapping: no joint turns more than 0.15 rad in a frame (as the quaternions say: |Δq| < sin(0.075)·2), the body does
    // not jump.
    for(let j=0;j<now.length;j+=4){const d=Math.abs(now[j]*prev[j]+now[j+1]*prev[j+1]+now[j+2]*prev[j+2]+now[j+3]*prev[j+3]);fastest=Math.max(fastest,2*Math.acos(Math.min(1,d)));}
    jump=Math.max(jump,b.avatar.root.position.distanceTo(prevRoot));prev=now;prevRoot=b.avatar.root.position.clone();frames.push(now);
    if(f===Math.round(2.8*FPS)&&!TIMED[name])assert.ok(as==='pose'||b.animator.gesture===name,label(name,c)+' is held');
   }
   assert.ok(fastest<.15,`${label(name,c)} as a ${as}: a joint turns ${fastest.toFixed(3)} rad in one frame`);
   assert.ok(jump<.03,`${label(name,c)} as a ${as}: the body jumps ${jump.toFixed(3)} m in one frame`);
   const back=rotations(b.avatar),without=rotations(control.avatar);let off=0;
   for(let j=0;j<back.length;j+=4){const d=Math.abs(back[j]*without[j]+back[j+1]*without[j+1]+back[j+2]*without[j+2]+back[j+3]*without[j+3]);off=Math.max(off,2*Math.acos(Math.min(1,d)));}
   if(!c.walking)assert.ok(off<.04,`${label(name,c)} as a ${as}: ${off.toFixed(3)} rad from where it would be without the move`);
   b.avatar.dispose();control.avatar.dispose();return frames;
  };
  assert.deepEqual(run(),run(),label(name,c)+' is the same every time');
 }
});

test('standing, a foot is on the floor and nothing goes through it; seated, the seat carries them as before; carried, the carriers',()=>{
 for(const [name,c] of CASES){
  const b=cast(c),still=cast(c);b.step(20);still.step(20);b.state.pose=name;const sole=soles(b);
  for(let f=0;f<150;f++){
   b.step();still.step();if(f%10)continue;
   // carried like a plank, the body is lifted off its feet (eased in over the move's ramp) onto the carriers' mittens: his
   // underside, along his back, at the tops of them (CARRY.under above the floor) once he is up
   if(name==='CarriedPlank'){assert.ok(lowest(b)>-.004,`${label(name,c)}: something goes below the floor at ${f}`);
    if(f>=80){const under=Math.min(...skin(b,2).filter(([p,bone])=>['hips','spine','chest'].includes(bone)&&Math.abs(p.x)<.05).map(([p])=>p.y));
     assert.ok(Math.abs(under-CARRY.under)<.006,`${label(name,c)}: his underside ${under.toFixed(3)} m above the floor, not at the carriers' mittens (${CARRY.under})`);}
    continue;}
   // seated, the body sits on the seat as the town's seating puts it (on whatever of the pelvis and thighs is lowest over it)
   if(c.state?.seated){assert.ok(Math.abs(seatContactHeight(b.avatar)-c.state.seatHeight)<2e-3,`${label(name,c)} off the seat at ${f}: ${seatContactHeight(b.avatar).toFixed(4)}`);
    if(name!=='FrozenAbsurd')assert.ok(Math.abs(b.avatar.root.position.y-still.avatar.root.position.y)<1e-4,`${label(name,c)} moves on the seat at ${f}`);continue;}
   assert.ok(Math.abs(sole())<1e-5,`${label(name,c)} loses its supporting foot at ${f}: ${sole()}`);
   assert.ok(lowest(b)>-.004,`${label(name,c)}: something goes below the floor at ${f}`);
  }
  b.avatar.dispose();still.avatar.dispose();
 }
});

test('stuck (BentStuck): bent level at the hips over his feet, a mitten on the small of his back, the other arm hanging',()=>{
 for(const c of [FC,F]){
  const b=cast(c),m=b.m;b.step(20);b.state.pose='BentStuck';b.step(90);
  // the back about level: the line from the hips to the neck 80°–100° from upright
  const back=local(b,world(b,'neck')).sub(local(b,world(b,'hips'))).normalize(),angle=THREE.MathUtils.radToDeg(Math.acos(back.y));
  assert.ok(angle>80&&angle<100,'bent about 90°: '+angle.toFixed(1));assert.ok(back.z>.9,'forward');
  // over his feet: the hips behind the toes and ahead of the heels' back
  const hips=local(b,world(b,'hips')),feet=['L','R'].map(s=>local(b,world(b,'foot'+s)));assert.ok(hips.z<Math.max(...feet.map(f=>f.z))+.02,'the hips over the feet');
  // the right mitten laid on the back: on it (its nearest point within 12 mm), in it nowhere more than 4 mm
  const torso=torsoDistance(b),R=mittenPoints(b,'R').map(torso);
  assert.ok(Math.min(...R)>-.004&&Math.min(...R)<.012,`the right mitten on the back: ${Math.min(...R).toFixed(3)}`);
  assert.ok(mitten(b,'R').y>local(b,world(b,'hips')).y&&mitten(b,'R').x<.02,'on the back, on his right');
  // the left arm hangs bent, its mitten clear of the legs and well off the floor
  const q=new THREE.Vector3();for(const s of ['L','R']){const leg=new THREE.Line3(local(b,world(b,'thigh'+s)),local(b,world(b,'knee'+s)));
   assert.ok(Math.min(...mittenPoints(b,'L').map(p=>leg.closestPointToPoint(p,true,q).distanceTo(p)-m.legR*1.15))>.005,'the hanging mitten clear of the '+s+' leg');}
  assert.ok(Math.min(...mittenPoints(b,'L').map(p=>p.y))>.12,'off the floor');
  b.avatar.dispose();
 }
});

test('headTo turns only the head to the lens while the body holds the shape',()=>{
 const lens=new THREE.Vector3(.9,1,-1.4),b=cast(FC),still=cast(FC);   // ahead of him and to his right (he faces -z on his mark)
 for(const x of [b,still]){x.step(20);x.state.pose='BentStuck';}b.state.headTo=lens.toArray();b.step(120);still.step(120);
 const face=world(b,'head',[0,0,1]).sub(world(b,'head')).normalize(),to=lens.clone().sub(world(b,'head',[0,b.m.headCentre-b.m.headY,0])).normalize();
 assert.ok(face.angleTo(to)<.3,'the face to the lens: '+face.angleTo(to).toFixed(2));
 for(const j of ['hips','spine','chest','thighL','kneeL','shoulderR','shoulderL'])assert.ok(b.avatar.bones[j].quaternion.angleTo(still.avatar.bones[j].quaternion)<.02,j+' held');
 // let go, the head comes back to the shape over a moment, without a jump
 delete b.state.headTo;let prev=b.avatar.bones.head.quaternion.clone(),fastest=0;
 for(let f=0;f<90;f++){b.step();fastest=Math.max(fastest,b.avatar.bones.head.quaternion.angleTo(prev));prev=b.avatar.bones.head.quaternion.clone();}
 assert.ok(fastest<.15,'the head turns back smoothly: '+fastest.toFixed(3));still.step(90);
 assert.ok(b.avatar.bones.head.quaternion.angleTo(still.avatar.bones.head.quaternion)<.03,'and is back');
 b.avatar.dispose();still.avatar.dispose();
});

test('CrabWalk shuffles sideways the way he is moved: small steps out and in, the feet never crossing, both mittens on his back',()=>{
 for(const way of [1,-1]){
  const b=cast(F),m=b.m;b.step(20);b.state.pose='CrabWalk';b.step(40);
  // moved sideways along his own x at 0.35 m/s, as the film moves him
  b.state.speed=.35;const left=new THREE.Vector3(1,0,0).applyQuaternion(b.avatar.root.getWorldQuaternion(new THREE.Quaternion()));   // his left, in the world
  let planted=0,gap=Infinity,lowFoot=[],prev=null;
  for(let f=0;f<150;f++){b.holder.position.addScaledVector(left,way*.35*dt);b.holder.updateMatrixWorld(true);b.step();
   const fL=local(b,world(b,'footL')),fR=local(b,world(b,'footR'));gap=Math.min(gap,fL.x-fR.x);
   const lower=fL.y<fR.y?fL:fR;if(prev&&Math.abs(lower.y-Math.min(prev.l.y,prev.r.y))<.004)planted+=lower.x-(fL.y<fR.y?prev.l:prev.r).x;prev={l:fL,r:fR};}
  // the foot that carries him goes under him the other way to his travel, as far as he goes (it stays put on the floor)
  assert.ok(Math.sign(planted)===-way&&Math.abs(planted)>.15,`the planted foot goes the other way: ${planted.toFixed(3)} (${way>0?'to his left':'to his right'})`);
  assert.ok(gap>2*m.legR,'the feet never cross or touch: '+gap.toFixed(3));
  const torso=torsoDistance(b);for(const s of ['L','R']){const d=Math.min(...mittenPoints(b,s).map(torso));assert.ok(d>-.004&&d<.015,`the ${s} mitten on his back: ${d.toFixed(3)}`);}
  b.avatar.dispose();
 }
});

test('in the massage chair: curled over his knees, uncurling slowly to half way and stopping, the mittens on his thighs',()=>{
 const b=cast({...F,state:CHAIR}),m=b.m,lean=()=>{const up=new THREE.Vector3(0,1,0).applyQuaternion(b.avatar.bones.chest.getWorldQuaternion(new THREE.Quaternion()));return Math.acos(up.y);};
 b.step(20);b.state.pose='ChairUncurl';b.step(36);const curled=lean();b.step(150);const later=lean();b.step(120);const held=lean();
 assert.ok(curled>.75,'curled: '+curled.toFixed(2));assert.ok(later<curled-.2,'uncurling: '+later.toFixed(2));assert.ok(Math.abs(held-later)<.02&&held>.3,'stops half way: '+held.toFixed(2));
 for(const s of ['L','R']){const thigh=new THREE.Line3(local(b,world(b,'thigh'+s)),local(b,world(b,'knee'+s))),q=new THREE.Vector3();
  const d=Math.min(...mittenPoints(b,s).map(p=>thigh.closestPointToPoint(p,true,q).distanceTo(p)-m.legR*1.15));
  assert.ok(d>-.008&&d<.015,`the ${s} mitten on the thigh: ${d.toFixed(3)}`);}
 b.avatar.dispose();
});

test('stuck in the chair in a new shape (FrozenAbsurd): an arm up clear of the head, a mitten on his back, a knee up on the seat',()=>{
 const b=cast({...F,state:CHAIR}),m=b.m;b.step(20);b.state.pose='FrozenAbsurd';b.step(90);
 const top=local(b,world(b,'head',[0,m.headCentre-m.headY+m.Rh*m.headSY,0]));assert.ok(mitten(b,'R').y>top.y-.06,'the right arm up by the head');
 // the raised arm clear of the head: no point of it within the head
 const H=b.avatar.bones.head.matrixWorld.clone().invert(),S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY;
 for(const [p,bone] of skin(b))if(['shoulderR','elbowR','handR'].includes(bone)){const q=b.holder.localToWorld(new THREE.Vector3(-p.x,p.y,-p.z)).applyMatrix4(H);assert.ok(Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2])>1.02,'the arm in the head');}
 const torso=torsoDistance(b),d=Math.min(...mittenPoints(b,'L').map(torso));assert.ok(d>-.005&&d<.015,'the left mitten on his back: '+d.toFixed(3));
 assert.ok(local(b,world(b,'kneeL')).y>CHAIR.seatHeight+.15,'the left knee up');
 // nothing of him through the seat or the floor
 for(const [p,bone] of skin(b,2))if(!['footL','footR','kneeL','kneeR'].includes(bone)&&Math.abs(p.x)<.25&&p.z>-.25&&p.z<.25)assert.ok(p.y>CHAIR.seatHeight-.012,'into the seat: '+bone+' '+p.y.toFixed(3));
 assert.ok(lowest(b)>-.004,'into the floor');
 b.avatar.dispose();
});

test('carried bent (CarriedBent): the legs hang straight and stiff from the level back',()=>{
 const f=cast(F);f.step(20);f.state.pose='CarriedBent';f.step(90);
 const thigh=local(f,world(f,'kneeL')).sub(local(f,world(f,'thighL'))).normalize(),shin=local(f,world(f,'footL')).sub(local(f,world(f,'kneeL'))).normalize();
 assert.ok(thigh.y<-.97&&shin.y<-.95,'straight down');
 const back=local(f,world(f,'neck')).sub(local(f,world(f,'hips'))).normalize();assert.ok(Math.abs(back.y)<.2,'the back level');
 f.avatar.dispose();
});

/** The plank carry as the film stages it: Fujita on his mark, the three women at CARRY.stations round him, facing him. */
function plankCarry(outfit='afterbath'){
 const him=cast({who:'Mr Fujita',outfit,state:{pose:'CarriedPlank'}}),who=['Thao','Nhung','Thuan'];
 // he faces -z on his mark (the holder's frame) and lies with his head to +z: his left is the holder's -x
 const carriers=CARRY.stations.map((st,i)=>{const x=-st.side*st.out,w=cast({who:who[i],outfit:'towel',state:{pose:st.move}});
  w.holder.position.set(x,0,st.along);w.holder.rotation.y=Math.atan2(x,0);w.holder.updateMatrixWorld(true);return w;});
 for(let f=0;f<150;f++)for(const b of [him,...carriers])b.step();
 return {him,carriers,dispose:()=>[him,...carriers].forEach(b=>b.avatar.dispose())};
}

test('carried like a plank (CarriedPlank): level and rigid on the three women’s mittens, the face to the side, in no one',()=>{
 const {him,carriers,dispose}=plankCarry(),m=him.m;
 // rigid and level: the hips, the neck and the ankles on one level line, the legs straight and together
 const hips=local(him,world(him,'hips')),neck=local(him,world(him,'neck')),feet=['L','R'].map(s=>local(him,world(him,'foot'+s)));
 const back=neck.clone().sub(hips).normalize();assert.ok(Math.abs(back.y)<.05&&back.z<-.99,'the back level, the head where his back was: '+back.toArray().map(v=>v.toFixed(2)));
 for(const [i,f] of feet.entries()){const leg=f.clone().sub(local(him,world(him,'thigh'+'LR'[i]))).normalize();assert.ok(Math.abs(leg.y)<.06&&leg.z>.99,'the legs straight out from the hips: '+leg.toArray().map(v=>v.toFixed(2)));}
 assert.ok(Math.abs(feet[0].x-feet[1].x)<4*m.legR,'the legs together');
 // the face turned to his right and a little up, toward the camera at the side, not down into a carrier or up at the ceiling
 const face=world(him,'head',[0,0,1]).sub(world(him,'head')).normalize();
 assert.ok(Math.abs(face.x)>.8&&face.y>0&&face.y<.6,'the face to the side: '+face.toArray().map(v=>v.toFixed(2)));
 // his mittens laid on his belly, on it and in it nowhere
 const torso=torsoDistance(him);for(const s of ['L','R']){const d=Math.min(...mittenPoints(him,s).map(torso));assert.ok(d>-.006&&d<.015,`his ${s} mitten on his belly: ${d.toFixed(3)}`);}
 // every carrier's mittens under him: the top of each at his drawn underside (within a few mm either way: cloth gives), and
 // nobody's body in anybody's
 const his=surface(him.avatar),hisCore=core(him.avatar);
 for(const w of carriers){const hers=surface(w.avatar),herCore=core(w.avatar),name=w.avatar.recipe.name||'a carrier';
  for(const hand of ['handL','handR']){const pts=hers.filter(q=>q.bone===hand),top=Math.max(...pts.map(q=>q.p.y));let gap=Infinity;
   for(const a of pts)if(a.p.y>top-.012)for(const q of his)if(Math.hypot(q.p.x-a.p.x,q.p.z-a.p.z)<.012&&q.p.y>a.p.y-.06)gap=Math.min(gap,q.p.y-a.p.y);
   assert.ok(gap>-.008&&gap<.012,`${name}'s ${hand} under him: ${(gap*1000).toFixed(1)} mm from his underside`);}
  const into=coreIntrusion(hers,hisCore),back=coreIntrusion(his,herCore);
  assert.ok(into.depth<.005,`${name} ${(into.depth*1000).toFixed(1)} mm into him (${into.bone})`);assert.ok(back.depth<.005,`he is ${(back.depth*1000).toFixed(1)} mm into ${name} (${back.bone})`);
 }
 // the carriers clear of each other
 for(let i=0;i<carriers.length;i++)for(let j=i+1;j<carriers.length;j++)assert.ok(clearance(surface(carriers[i].avatar,{stride:2}),core(carriers[j].avatar))>.03,'two carriers too close');
 // the carriers' mittens palms up and forward of them, level
 for(const w of carriers){const tops=['L','R'].map(s=>Math.max(...mittenPoints(w,s).map(p=>p.y)));assert.ok(Math.abs(tops[0]-tops[1])<.012,'level');
  for(const s of ['L','R'])assert.ok(mitten(w,s).z>w.m.depth/2+.1,'forward of her');}
 dispose();
});

test('CordWrapped: the arms pinned, then the cord wound round her and them, close but in nothing, from the dryer’s handle',()=>{
 const b=cast({who:'Thao',outfit:'towel'}),m=b.m;b.step(20);b.state.pose='CordWrapped';
 b.step(18);assert.ok(!b.avatar.storyProps?.get('dryerCord')?.visible,'not before the arms are pinned');
 b.step(90);const cord=b.avatar.storyProps.get('dryerCord');assert.ok(cord?.visible,'wound');
 assert.equal(cord.geometry.drawRange.count,cord.userData.indexCount,'all of it');
 // every point of the cord's middle line is clear of the drawn body by its own thickness, and the turns are close to her
 const P=cord.geometry.attributes.position,c=new THREE.Vector3(),pts=skin(b).map(([p])=>p),turns=[];
 // the tube's rings: each ring's middle, from its 7 vertices (6 sides + seam)
 for(let i=0;i+7<=P.count;i+=7){c.set(0,0,0);for(let k=0;k<6;k++)c.add(new THREE.Vector3().fromBufferAttribute(P,i+k));c.multiplyScalar(1/6);
  const p=local(b,cord.localToWorld(c.clone()));let near=Infinity;for(const q of pts)if(Math.abs(q.y-p.y)<.03)near=Math.min(near,q.distanceTo(p));
  assert.ok(near>CORD.radius*.9,'the cord in her: '+near.toFixed(4)+' at '+p.toArray().map(v=>v.toFixed(3)));
  // how far it stands off her, round her middle: its radius against the widest of her near it (in angle and height)
  if(p.y>m.hipY+.03&&p.y<m.shoulderY-.12){const a=Math.atan2(p.x,p.z),r=Math.hypot(p.x,p.z);let out=0;
   for(const q of pts)if(Math.abs(q.y-p.y)<.012){let da=Math.abs(Math.atan2(q.x,q.z)-a);da=Math.min(da,2*Math.PI-da);if(da<.07)out=Math.max(out,Math.hypot(q.x,q.z));}
   turns.push(r-out-CORD.radius);}}
 // pulled tight: it touches her (within 6 mm) somewhere on every turn, bridging between what sticks out
 for(let i=0;i+72<=turns.length;i+=72)assert.ok(Math.min(...turns.slice(i,i+72))<.006,'snug: '+Math.min(...turns.slice(i,i+72)).toFixed(4));
 // round the arms too: at the height of the elbows, the cord passes outside them
 const el=['L','R'].map(s=>local(b,world(b,'elbow'+s)));for(const e of el)assert.ok(Math.abs(e.x)<m.width,'pinned at the side');
 b.avatar.dispose();
});

test('BasketHead: the locker basket upside down on her head, resting on the head towel, her arms out feeling the dark',()=>{
 const b=cast({who:'Thuan',outfit:'towel'}),m=b.m;b.step(20);b.state.pose='BasketHead';b.step(60);
 const basket=b.avatar.storyProps.get('basketOnHead');assert.equal(basket?.parent,b.avatar.bones.head,'on the head');
 // in the basket's frame: no point of the head or what is on it in its walls or above its floor, and it rests (within 3 mm)
 const inv=basket.matrixWorld.clone().invert(),B=BASKET;let gap=Infinity;
 const pts=skin(b).filter(([,bone])=>bone==='head').map(([p])=>b.holder.localToWorld(new THREE.Vector3(-p.x,p.y,-p.z)));
 const h=b.avatar.face.head,HP=h.geometry.attributes.position;for(let i=0;i<HP.count;i++)pts.push(h.localToWorld(new THREE.Vector3().fromBufferAttribute(HP,i)));
 for(const p of pts){const q=p.clone().applyMatrix4(inv),ax=Math.abs(q.x),az=Math.abs(q.z);if(ax>B.w/2||az>B.d/2)continue;
  const hollow=ax<B.w/2-B.wall&&az<B.d/2-B.wall;
  if(hollow){assert.ok(q.y<B.h-B.wall,'through its floor');gap=Math.min(gap,B.h-B.wall-q.y);}else{assert.ok(q.y<.0005,'through its rim: '+q.y.toFixed(4));gap=Math.min(gap,-q.y);}}
 assert.ok(gap<.006,'it rests on her: '+gap.toFixed(4));
 for(const s of ['L','R'])assert.ok(mitten(b,s).z>.25&&mitten(b,s).y>m.chestY-.05,'the arms out before her');
 b.avatar.dispose();
});

test('SitRead: the paper held open by its edges low over his lap, the torch on his pocket showing over it; a Nod looks up',()=>{
 const b=cast({...T,state:KOAGARI}),m=b.m;storyProps(b.avatar).give('torch');b.step(20);b.state.pose='SitRead';b.step(90);
 const paper=b.avatar.storyProps.get('newspaper');assert.ok(paper?.visible);
 const edge=s=>local(b,paper.children[s<0?0:1].localToWorld(new THREE.Vector3(s*PAPER.leaf,-.07*m.k,0)));
 assert.ok(edge(-1).distanceTo(mitten(b,'R'))<.01,'the right edge in the right mitten');assert.ok(edge(1).distanceTo(mitten(b,'L'))<.02,'the left edge in the left mitten');
 // over his lap: every corner ahead of his front, and the whole of it below his chest
 const corners=[-1,1].flatMap(s=>[-1,1].map(y=>local(b,paper.children[s<0?0:1].localToWorld(new THREE.Vector3(s*PAPER.leaf,y*PAPER.height/2,0)))));
 const torch=b.avatar.storyProps.get('torch'),pocket=local(b,torch.getWorldPosition(new THREE.Vector3()));
 for(const c of corners)assert.ok(c.z>m.depth/2+.02,'ahead of him');
 // its lower edge in his lap (below where his chest begins) and its middle below the torch, the top tilted away from him
 assert.ok(Math.max(corners[0].y,corners[2].y)<local(b,world(b,'chest')).y,'the lower edge in his lap');
 assert.ok(corners.reduce((y,c)=>y+c.y/4,0)<pocket.y,'below the pocket');assert.ok(corners[1].z>corners[0].z+.08,'tilted back');
 // the torch on his pocket in full view from in front of him, standing or sitting, straight on or from the side (none of it
 // behind the paper)
 const pts=[],sheets=[];
 torch.traverse(o=>{if(o.isMesh&&o.visible){const P=o.geometry.attributes.position;for(let i=0;i<P.count;i+=3)pts.push(o.localToWorld(new THREE.Vector3().fromBufferAttribute(P,i)));}});
 paper.traverse(o=>{if(o.isMesh)sheets.push(o);});const ray=new THREE.Raycaster();
 for(const cam of [[0,1.05,-1.9],[0,1.4,-1.8],[-1.2,1.1,-1.4],[1.2,1.1,-1.4]]){const c=new THREE.Vector3(...cam);let hidden=0;
  for(const p of pts){const d=p.clone().sub(c),len=d.length();ray.set(c,d.normalize());ray.far=len-.002;if(ray.intersectObjects(sheets,true).length)hidden++;}
  assert.equal(hidden,0,'the torch behind the paper from '+cam);}
 assert.ok(b.looks.at(-1)[1]>.5,'the eyes on it');
 // a Nod: the head comes up off the paper (to look at someone) and goes back to it; the paper stays in his lap
 const faceY=()=>world(b,'head',[0,0,1]).sub(world(b,'head')).normalize().y,down=faceY(),before=mitten(b,'R');
 assert.ok(down<-.3,'the head bent over it: '+down.toFixed(2));
 b.animator.play('Nod');b.step(30);assert.ok(faceY()>down+.2,'looks up for the nod: '+faceY().toFixed(2));assert.ok(mitten(b,'R').distanceTo(before)<.02,'the paper stays in his lap');
 b.step(60);assert.ok(Math.abs(faceY()-down)<.03,'and back to the paper');assert.ok(mitten(b,'R').distanceTo(before)<.01,'where it was');
 b.avatar.dispose();
});

test('the torch: clipped on his pocket; TorchUp takes it, holds it up and clicks it on, its light on his face; TorchOff; back',()=>{
 const b=cast(T),m=b.m;b.step(20);
 // it starts clipped on his left chest, on him and in nothing
 b.state.pose='TorchUp';b.step(1);const torch=b.avatar.storyProps.get('torch');
 assert.equal(torch.parent,b.avatar.bones.chest,'on the pocket at first');
 const torso=torsoDistance(b),at=local(b,torch.getWorldPosition(new THREE.Vector3()));assert.ok(torso(at)>TORCH.radius*.9&&torso(at)<TORCH.radius+.02,'on the chest: '+torso(at).toFixed(4));assert.ok(at.x>0&&at.z>0,'the left chest');
 let prev=torch.getWorldPosition(new THREE.Vector3()),jump=0,tookAt=-1,onAt=-1;
 for(let f=0;f<120;f++){b.step();const p=torch.getWorldPosition(new THREE.Vector3());jump=Math.max(jump,p.distanceTo(prev));prev=p;
  if(tookAt<0&&torch.parent===b.avatar.bones.handR)tookAt=f;if(onAt<0&&torch.userData.torch.on)onAt=f;}
 assert.ok(tookAt>20&&tookAt<40,'taken from the pocket: '+tookAt);assert.ok(onAt>tookAt+30,'clicked on once it is up: '+onAt);
 assert.ok(jump<.03,'it never jumps: '+jump.toFixed(3));
 // held up before the chest, the lens below the chin and ahead of him, pointing ahead and up; its light a spot on his face
 const lens=local(b,torch.localToWorld(new THREE.Vector3(0,0,TORCH.lensAt))),tail=local(b,torch.localToWorld(new THREE.Vector3(0,0,-.05)));
 assert.ok(lens.y>m.chestY-.05&&lens.y<m.neckY,'at chest height: '+lens.y.toFixed(3));assert.ok(lens.z>m.depth/2+.08,'before him');
 const dir=lens.clone().sub(tail).normalize();assert.ok(dir.z>.6&&dir.y>.15,'ahead and up: '+dir.toArray().map(v=>v.toFixed(2)));
 const light=torch.userData.torch.light;assert.ok(light?.isSpotLight&&light.intensity>0&&light.castShadow===false,'a small light, no shadows');
 const aim=local(b,light.target.getWorldPosition(new THREE.Vector3())),headC=local(b,world(b,'head',[0,m.headCentre-m.headY,0]));
 assert.ok(aim.distanceTo(headC)<m.Rh,'aimed at his face');assert.ok(aim.y>lens.y+.15,'from below');
 // TorchOff: clicked off at once, lowered to the waist, held across the fist
 b.state.pose='TorchOff';b.step(15);assert.ok(!torch.userData.torch.on,'off');b.step(90);
 const l2=local(b,torch.localToWorld(new THREE.Vector3(0,0,TORCH.lensAt))),t2=local(b,torch.localToWorld(new THREE.Vector3(0,0,-.05)));
 assert.ok(l2.z>t2.z,'across the fist, its lens ahead');assert.ok(l2.y<m.chestY,'lowered');
 // neither: back on the pocket, off, the hand down
 delete b.state.pose;prev=torch.getWorldPosition(new THREE.Vector3());jump=0;
 for(let f=0;f<120;f++){b.step();const p=torch.getWorldPosition(new THREE.Vector3());jump=Math.max(jump,p.distanceTo(prev));prev=p;}
 assert.equal(torch.parent,b.avatar.bones.chest,'back on the pocket');assert.ok(jump<.03,'without a jump: '+jump.toFixed(3));
 const spot=pocketSpot(b.avatar);assert.ok(torch.position.distanceTo(spot.position)<1e-6,'exactly where it was');
 assert.ok(mitten(b,'R').y<m.hipY+.1,'the hand down');
 b.avatar.dispose();
});

test('ReachBack: from her stool, the left mitten back over her shoulder to the breaker, up under the lever and pushing it up, eyes on her book',()=>{
 const b=cast({who:'Miss Higa',outfit:'clothes',state:STOOL}),m=b.m,R=REACH_BACK,seat=STOOL.seatHeight;b.step(40);
 // where things are round her, in her frame (x to her left, y up from the floor, z ahead)
 const here=v=>new THREE.Vector3(v[0],seat+v[1],v[2]),pivot=here(R.lever);
 const boxes=[['the breaker',R.box],['the board',R.board],['the wall',{min:[-1,-1,R.wall-1],max:[1,3,R.wall]}]].map(([n,x])=>[n,new THREE.Box3(here(x.min),here(x.max))]);
 // the lever (onsen-electrics.js): 22 mm wide, 32 mm long, 14 mm thick, from its pivot, 0.6 rad from upright, down or up
 const lever=up=>{const a=up?.6:Math.PI-.6,out=[];for(const x of [-.011,.011])for(const l of [0,.032])for(const t of [-.007,.007])
  out.push(pivot.clone().add(new THREE.Vector3(x,l*Math.cos(a)-t*Math.sin(a),l*Math.sin(a)+t*Math.cos(a))));return out;};
 const inMitten=p=>{const q=b.avatar.bones.handL.worldToLocal(b.holder.localToWorld(new THREE.Vector3(-p.x,p.y,-p.z)));return Math.hypot(q.x/(m.hand*.9),(q.y+m.hand*.55)/(m.hand*1.15),q.z/(m.hand*.78));};
 const tip=()=>local(b,world(b,'handL',[0,-m.hand*1.45,0]));
 const H=()=>b.avatar.bones.head.matrixWorld.clone().invert(),S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY;
 b.animator.play('ReachBack');let atReach=null,nearHead=Infinity,deepHead=Infinity;
 for(let f=1;f<=Math.round(3.4*FPS);f++){b.step();const t=f/FPS,pts=skin(b),inv=H();
  const arm=pts.filter(([,bone])=>['shoulderL','elbowL','handL'].includes(bone)).map(([p])=>p),head=pts.filter(([,bone])=>bone==='head').map(([p])=>p);
  // never through her face or head, nor brushing her hair, nor into the breaker, the board or the wall
  for(const p of arm){const q=b.holder.localToWorld(new THREE.Vector3(-p.x,p.y,-p.z)).applyMatrix4(inv);deepHead=Math.min(deepHead,Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2]));
   for(const [n,box] of boxes)assert.ok(!box.containsPoint(p),`the arm in ${n} at ${t.toFixed(2)} s`);}
  const shoulder=local(b,world(b,'shoulderL')).y+.03;
  if(f%3===0)for(const p of arm.filter((p,i)=>i%2===0))if(p.y>shoulder)for(const q of head)nearHead=Math.min(nearHead,p.distanceToSquared(q));
  if(f===Math.round(R.reach*FPS))atReach=tip().sub(pivot);
  // the lever down while the mitten comes to it, up once it is pushed: in the mitten nowhere
  if(t<R.reach)for(const p of lever(false))assert.ok(inMitten(p)>1,'the lever (down) in the mitten at '+t.toFixed(2));
  if(t>R.reach+.3&&t<GESTURES.ReachBack-R.out)for(const p of lever(true))assert.ok(inMitten(p)>1,'the lever (up) in the mitten at '+t.toFixed(2));
  if(f===Math.round((R.reach+.5)*FPS)){
   // held: the mitten's end on the lever's pivot, over the lever (pushed up level with its pivot), the head down on the book
   const d=tip().sub(pivot);assert.ok(Math.abs(d.x)<.01&&Math.abs(d.y)<.01&&Math.abs(d.z-R.ahead)<.01,'the mitten’s end at the lever: '+d.toArray().map(v=>(v*100).toFixed(1)).join(', ')+' cm');
   const face=world(b,'head',[0,0,1]).sub(world(b,'head')).normalize();assert.ok(face.y<-.25,'the head down: '+face.y.toFixed(2));
   assert.ok(b.looks.at(-1)[1]>.5,'the eyes down on the book');}
 }
 assert.ok(deepHead>1.05,'the arm through her head: '+deepHead.toFixed(2));assert.ok(Math.sqrt(nearHead)>.03,'the arm brushes her hair: '+(Math.sqrt(nearHead)*100).toFixed(1)+' cm');
 // it comes to the lever from below it, then pushes it up
 assert.ok(atReach.y<-.025&&atReach.length()<.1,'under the lever first: '+atReach.toArray().map(v=>(v*100).toFixed(1)).join(', ')+' cm');
 // and is back in her lap when it is over
 assert.ok(mitten(b,'L').y<seat+m.chestY-m.hipY&&mitten(b,'L').z>0,'back in front of her');
 b.avatar.dispose();
});

/** The commands that draw one eye (the screen-left one), from a face drawn into a recorder. */
function eyeOf(recipe,expression){
 const commands=[],canvas={};
 const ctx=new Proxy({canvas},{get(t,k){if(k in t)return t[k];if(k==='createRadialGradient')return (...a)=>{commands.push([k,...a]);return {addColorStop:()=>{}};};return (...a)=>commands.push([k,...a]);},set(t,k,v){t[k]=v;commands.push(['set',k,v]);return true;}});
 drawFace(ctx,recipe,{expression});const L=faceLayout(recipe),key=c=>c[0]==='translate'&&Math.abs(c[1]-(128-L.spread))<1e-9&&Math.abs(c[2]-L.eyeY)<1e-9;
 const i=commands.findIndex(key),j=commands.findIndex((c,n)=>n>i&&c[0]==='translate'&&Math.abs(c[1]-(128+L.spread))<1e-9);return JSON.stringify(commands.slice(i,j));
}

test('Fujita’s squinting eyes follow his face (pained, surprised, laughing, relieved, sad, cross) and stay his',()=>{
 const fujita=recipeFor('Mr Fujita');assert.equal(fujita.eyes.style,'squint');
 const faces=['neutral','pain','surprised','shock','laugh','relieved','sad','angry','worried','shy','thinking'],eyes=faces.map(e=>eyeOf(fujita,e));
 assert.equal(new Set(eyes).size,faces.length,'a different eye for each');
 // at rest his own short thick arch, and the same arch with a smile (not someone else's eyes)
 assert.ok(eyes[0].includes('quadraticCurveTo')&&!eyes[0].includes('ellipse'),'his arch');
 // surprised, his eyes pop open small: smaller than anyone else's surprise
 const radius=s=>Math.max(...JSON.parse(s).filter(c=>c[0]==='ellipse').map(c=>c[3]));
 assert.ok(radius(eyes[2])<radius(eyeOf(normalizeRecipe({eyes:{style:'round'}}),'surprised')),'his eyes pop open small');
 // the story's faces are every eye style's
 for(const e of ['pain','bliss','shock','dismay','calm','daze','dry','hope','focus','relieved'])assert.notEqual(eyeOf(normalizeRecipe({eyes:{style:'round'}}),e)+e,eyeOf(normalizeRecipe({eyes:{style:'round'}}),'neutral')+'neutral');
});

/**
 * The torso as it is drawn in these clothes, from the waist to under the shoulders (at rest): how far out from the body's
 * axis it reaches, by height and direction; and how deep the forearms and mittens go into it, or the forearms into the head.
 */
function torsoHull(b){
 const m=b.m,mesh=b.avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline')),g=mesh.geometry;
 const P=g.attributes.position,I=g.attributes.skinIndex,W=g.attributes.skinWeight,names=mesh.skeleton.bones.map(x=>x.name),torso=new Set(['hips','spine','chest']);
 const y0=m.hipY+m.torso*.25,y1=m.shoulderY-.06*m.k,dy=.015,da=Math.PI/12,bins=new Map();
 for(let i=0;i<P.count;i++){const y=P.getY(i);if(y<y0||y>y1)continue;let w=0;for(let k=0;k<4;k++)if(torso.has(names[I.getComponent(i,k)]))w+=W.getComponent(i,k);if(w<.9)continue;
  const x=P.getX(i),z=P.getZ(i),key=Math.floor((y-y0)/dy)+':'+Math.floor((Math.atan2(x,z)+Math.PI)/da);bins.set(key,Math.max(bins.get(key)||0,Math.hypot(x,z)));}
 return (p,r)=>{if(p.y<y0||p.y>y1)return -Infinity;const R=bins.get(Math.floor((p.y-y0)/dy)+':'+Math.floor((Math.atan2(p.x,p.z)+Math.PI)/da));return R===undefined?-Infinity:R+r-Math.hypot(p.x,p.z);};
}
function intrusion(b,hull){
 const m=b.m,toChest=b.avatar.bones.chest.matrixWorld.clone().invert(),lift=new THREE.Vector3(0,m.chestY,0);let arm=-Infinity,hand=-Infinity,headR=Infinity;
 const H=b.avatar.bones.head.matrixWorld.clone().invert(),S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY;
 for(const s of ['L','R']){
  const e=world(b,'elbow'+s),w=world(b,'hand'+s),c=world(b,'hand'+s,[0,-m.hand*.55,0]);
  for(let t=0;t<=1.001;t+=.1){const p=e.clone().lerp(w,t),q=p.clone().applyMatrix4(H);arm=Math.max(arm,hull(p.clone().applyMatrix4(toChest).add(lift),m.armR*.9));
   headR=Math.min(headR,Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2])-m.armR*.9/m.Rh);}
  hand=Math.max(hand,hull(c.applyMatrix4(toChest).add(lift),m.hand*.8));
 }
 return {arm,hand,headR};
}
const REFERENCE=['CollarTug','Heart','Think','HairDry','Phone','CheekRest','DoubleCheek','Clap','Sing','HandsOnHips'];

test('the arms keep out of the body, the clothes and the head as far as the town’s own moves do (the hands laid on him aside)',()=>{
 const seen=new Map();
 for(const [name,c] of CASES){
  // the mittens laid on the back or the thighs are tested where they lie (above); here the moves that hold things before them
  if(['BentStuck','CrabWalk','ChairUncurl','FrozenAbsurd','CarriedBent','CarriedPlank'].includes(name))continue;
  const key=c.who+'|'+c.outfit+'|'+(c.state?.seated?'seated':'standing');
  if(!seen.has(key)){
   const b=cast({...c,state:c.state?.seated?c.state:{}}),hull=torsoHull(b);b.step(30);let ref=intrusion(b,hull);
   for(const g of REFERENCE){b.animator.stop();b.animator.play(g,1.6);for(let f=0;f<80;f++){b.step();if(f%10===9){const r=intrusion(b,hull);ref={arm:Math.max(ref.arm,r.arm),hand:Math.max(ref.hand,r.hand),headR:Math.min(ref.headR,r.headR)};}}}
   seen.set(key,{ref,hull});b.avatar.dispose();
  }
  const {ref,hull}=seen.get(key),b=cast(c),tol=.004*b.m.k;b.step(20);b.state.pose=name;
  for(let f=0;f<150;f++){b.step();if(f%10!==9)continue;const r=intrusion(b,hull);
   assert.ok(r.arm<=Math.max(ref.arm,0)+tol,`${label(name,c)}: a forearm ${(r.arm*1000).toFixed(0)} mm into the body or its clothes (the town's own moves: ${(ref.arm*1000).toFixed(0)})`);
   assert.ok(r.hand<=Math.max(ref.hand,0)+tol,`${label(name,c)}: a mitten ${(r.hand*1000).toFixed(0)} mm into the body or its clothes (${(ref.hand*1000).toFixed(0)})`);
   assert.ok(r.headR>=Math.min(ref.headR,1)-.02,`${label(name,c)}: a forearm in the head (${r.headR.toFixed(3)})`);
  }
  b.avatar.dispose();
 }
});

test('bent in the after-bath clothes, the head (turned to the lens or not) never comes down on the tenugui round his neck',()=>{
 for(const [state,direction] of [['rest'],['flag',Math.PI],['flag',Math.PI/2]])for(const pose of ['BentStuck','CrabWalk','CarriedBent','CarriedPlank'])for(const headTo of [null,[0,1.1,-3],[2,1,-1]]){
  const b=cast(F),m=b.m;b.avatar.setTenugui(state,direction);b.step(10);b.state.pose=pose;if(headTo)b.state.headTo=headTo;
  const body=b.avatar.root.children.find(o=>o.name.startsWith('Shimanchu after the bath')&&!o.name.endsWith('outline')),t=body.userData.tenugui;
  const S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY,p=new THREE.Vector3();
  for(let f=0;f<100;f++){b.step();if(f%10)continue;const inv=b.avatar.bones.head.matrixWorld.clone().invert();
   for(let i=t.start;i<t.start+t.count;i+=2){body.getVertexPosition(i,p);body.localToWorld(p);p.applyMatrix4(inv);
    assert.ok(Math.hypot(p.x/S[0],(p.y-hc)/S[1],p.z/S[2])>=1,`${pose} ${state} headTo ${headTo}: the head comes down through the tenugui`);}}
  b.avatar.dispose();
 }
});
