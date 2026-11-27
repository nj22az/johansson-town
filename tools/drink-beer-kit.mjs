// What Blender needs to rig and animate a resident drinking beer from a glass at Minato's counter
// (tools/blender/drink-beer.py), measured on the game's own body, in the game's frame (y up, the body facing +z, its left
// +x; the bind pose, every bone unturned), as tools/drink-kit.mjs measures it for the can, and more:
// - the body seated on a counter stool as the game seats it (animate.js, the stool's 0.46 m), its root, hips and legs;
// - the counter (world/interiors/minato-compact-plan.js) and the place Thao sets a glass down at a stool
//   (izakaya-beer.js IZAKAYA_PLAYER_SEATS), in the seated body's frame;
// - each glass (izakaya-serving-visuals.js: the draught mug, the pint, the small glass the bottle is poured into) as drawn,
//   and how the right hand holds it (drink-beer.js beerSocket): the mug by its handle, the pint wrapped as the can is, the
//   small glass in the fingertips.
// - `--seat <id>` (izakaya-beer.js IZAKAYA_PLAYER_SEATS: `counter2`, the default, a counter stool; `window`, a seat at the
//   booth, its table 0.72 m high and the glass Thao sets down on it 0.35 m ahead, to the right), or `--standing` (a glass held
//   in the hand with nowhere to set it down: the body standing, no table).
//   node tools/drink-beer-kit.mjs [--name Johansson] [--seat counter2|window|--standing] out.json
import {writeFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
installDOM();
const {buildAvatar,HAND,handPoint}=await import('../src/avatars/build.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {lowerLip}=await import('../src/avatars/consume.js');
const {levelHeldDrink}=await import('../src/avatars/table-drink.js');
const {requiredTilt}=await import('../src/drinking/liquid.js');
const {JUG,PINT}=await import('../src/people/izakaya-serving-visuals.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');
const {createDrinkProp,IZAKAYA_PLAYER_SEATS}=await import('../src/people/izakaya-beer.js');
const {MINATO_COMPACT}=await import('../src/world/interiors/minato-compact-plan.js');
const {beerSocket,beerGrip,beerRim,VESSELS,HAND_SHAPES}=await import('../src/avatars/beer-hold.js');
const args=process.argv.slice(2),opt=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null;},NAME=opt('--name')||'Johansson',STANDING=args.includes('--standing');
const SEAT_ID=opt('--seat')||'counter2',out=args.find((a,k)=>!a.startsWith('--')&&!['--name','--seat'].includes(args[k-1]));
const r=v=>Math.round(v*1e5)/1e5,arr=v=>v.toArray().map(r);
const a=buildAvatar(recipeFor(NAME),{shadows:false,eyes3d:false});a.root.rotation.set(0,0,0);a.root.updateMatrixWorld(true);
const m=a.measure,g=a.body.geometry,P=g.attributes.position;
// the hands' points in every shape, keyed by where they are at rest
const at=()=>Array.from(P.array),rest=at(),shapes={};
for(const [name,amount,shape] of HAND_SHAPES){for(const s of ['L','R'])a.grip(s,amount,shape);shapes[name]=at();for(const s of ['L','R'])a.grip(s,0);}
const names=HAND_SHAPES.map(s=>s[0]),hands={};
for(let v=0;v<P.count;v++){
 if(!names.some(n=>[0,1,2].some(j=>Math.abs(shapes[n][v*3+j]-rest[v*3+j])>1e-7)))continue;
 const key=[0,1,2].map(j=>r(rest[v*3+j])).join(',');
 if(!hands[key])hands[key]=Object.fromEntries(names.map(n=>[n,[0,1,2].map(j=>r(shapes[n][v*3+j]))]));
}
const bind=Object.fromEntries(Object.entries(a.bones).map(([n,b])=>[n,b.getWorldPosition(new THREE.Vector3()).toArray().map(r)]));
const lip=lowerLip(a);
// each glass, and its socket in the right hand
const vessels={};
for(const [id,V] of Object.entries(VESSELS)){const prop=createDrinkProp(V.kind,{held:true}),s=beerSocket(m,prop,'R');
 const fluid=levelHeldDrink(prop),cap=fluid.startingVolumeMl;
 // (how far the glass must be tipped for the beer left to reach its rim, fill 0..1 of what it is served with: the tilt follows the fill)
 const tilt=Array.from({length:21},(_,j)=>[j/20,r(requiredTilt(fluid.profile,Math.max(.01,cap*j/20)))]);
 const outline=V.kind==='draft'?[[0,0],[JUG.r*.76,0],[JUG.r,.005],[JUG.r,JUG.h],[JUG.r-.002,JUG.h+.001],[JUG.r-.005,JUG.h-.003],[JUG.r-.008,.011],[0,.011]]
  :V.kind==='pint'?[...PINT.outer,...PINT.inner.slice().reverse()]:[[0,0],[.0228,0],[.03,.005],[.03,.09],[.028,.091],[.025,.087],[.022,.011],[0,.011]];
 const beer=fluid.profile;
 vessels[id]={outline,handle:V.kind==='draft'?{bar:JUG.bar,barX:JUG.barX,opening:JUG.opening,r:JUG.r}:null,beer:{bottom:beer.interiorBottom,top:beer.interiorTop,rb:beer.innerRadiusBottom,rt:beer.innerRadiusTop,ml:r(cap),colour:beer.liquidColor},tilt,
 kind:V.kind,rimHeight:prop.userData.rimHeight,rim:arr(beerRim(prop)),grip:prop.userData.grip,hold:beerGrip(m,prop),socket:{position:arr(s.position),quaternion:s.quaternion.toArray().map(r)},fill:V.fill};}
// seated as the game seats a body (the animator, the seat's height and its front edge), facing +z; or standing
const seat=IZAKAYA_PLAYER_SEATS[SEAT_ID],plan=MINATO_COMPACT;if(!seat)throw new Error('no seat '+SEAT_ID);
const animator=createAvatarAnimator(a,{random:()=>.5}),state=STANDING?{seated:false}:{seated:true,seatHeight:seat.surfaceY,seatFront:seat.front};
for(let k=0;k<180;k++)animator.update(1/60,state);
// (the animator slides a body forward on a seat that says where its front edge is, as `root.position.z = -slide`: forward for a
// root turned half round as the game builds one (build.js), back for this one, turned to face +z. Put forward, as in the game:
// otherwise Blender's counter is twice the slide (20 cm for Johansson) further than the game's, 27 November 2026)
a.root.position.z=Math.abs(a.root.position.z);a.root.updateMatrixWorld(true);
const seatedPose=Object.fromEntries(['hips','thighL','kneeL','footL','thighR','kneeR','footR','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR'].map(n=>[n,a.bones[n].quaternion.toArray().map(r)]));
// (the seat faces its table: the way it is turned (a seat's yaw, as the game turns the body on it: forward (-sin, 0, -cos)), the
// glass's place from the seat turned into the body's frame (+z ahead, +x his left))
const ahead=new THREE.Vector3(-Math.sin(seat.yaw),0,-Math.cos(seat.yaw)),left=new THREE.Vector3(-ahead.z,0,ahead.x).multiplyScalar(-1);
const toBody=([x,y,z])=>{const d=new THREE.Vector3(x-seat.position[0],y,z-seat.position[2]);return [r(d.dot(left)),r(y),r(d.dot(ahead))];};
// (the table: the counter at a stool, the booth's table at a booth seat; its near edge, from the seat, ahead)
const booth=!seat.counter,table=booth?{top:plan.booth.tableTop,depth:plan.booth.tableDepth,width:plan.booth.tableWidth,centre:[plan.booth.position[0],plan.booth.position[2]]}
 :{top:plan.counter.top,depth:plan.counter.depth,width:plan.counter.width,centre:[plan.counter.position[0],plan.counter.position[2]]};
const along=new THREE.Vector3(table.centre[0]-seat.position[0],0,table.centre[1]-seat.position[2]).dot(ahead),edgeAhead=along-table.depth/2;
const kit={name:NAME,measure:{k:m.k,hand:m.hand,H:m.H,Rh:m.Rh,headCentre:m.headCentre,headY:m.headY,chestY:m.chestY,shoulderY:m.shoulderY,shoulderX:m.shoulderX,upper:m.upper,fore:m.fore,depth:m.depth,hipY:m.hipY},
 bones:bind,hand:{wrapAt:HAND.wrapAt,points:hands,knuckles:HAND.knuckles,tip:HAND.tip,half:HAND.half,top:HAND.top},lip:{lower:arr(lip.lower),mouth:arr(lip.mouth)},vessels,
 seated:{root:arr(a.root.position),hips:arr(a.bones.hips.position),pose:seatedPose,
  chest:arr(a.bones.chest.getWorldPosition(new THREE.Vector3())),handR:arr(a.bones.handR.getWorldPosition(new THREE.Vector3())),handL:arr(a.bones.handL.getWorldPosition(new THREE.Vector3()))},
 counter:STANDING?null:{kind:booth?'booth':'counter',seat:SEAT_ID,top:table.top,edge:r(edgeAhead),depth:table.depth,width:table.width,
  // (the table's middle across, from the seat, his left: the booth's is off to one side of each seat)
  across:r(new THREE.Vector3(table.centre[0]-seat.position[0],0,table.centre[1]-seat.position[2]).dot(left)),spot:toBody(seat.table),seatHeight:seat.surfaceY,front:seat.front},
 standing:STANDING};
await writeFile(out,JSON.stringify(kit));
console.log('wrote',out,Object.keys(hands).length,'hand points;',STANDING?'standing':'the glass on the '+kit.counter.kind+' at '+kit.counter.spot,'; root',kit.seated.root,'hips',kit.seated.hips);
