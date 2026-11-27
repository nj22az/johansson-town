// What Blender needs to rig and animate a resident drinking a can (tools/blender/drink-can.py), measured on the game's own
// body, in the game's frame (y up, the body facing +z, its left +x; the bind pose, every bone unturned):
// - the hands' shapes (build.js grip: at rest, round the can (the wrap), the fist, the forefinger hooked), point by point
//   for the body's hand points, keyed by where each point is at rest;
// - the can's socket in the right hand (consume.js canSocket: its axis along the knuckle line, the palm on it) and where a
//   ring hooked by the left forefinger lies, in each hand bone's frame;
// - the lower lip and the mouth on the drawn head, in the head bone's frame; the shirt's chest pocket, in the chest's;
// - the can (izakaya-serving-visuals.js 'can', sealed) as drawn: its radius, height, rim, opening, tab and ring.
//   node tools/drink-kit.mjs [--name Johansson] out.json
import {writeFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
installDOM();
const {buildAvatar,HAND,handPoint}=await import('../src/avatars/build.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {canSocket,lowerLip}=await import('../src/avatars/consume.js');
const {pocketSpot}=await import('../src/avatars/story-props.js');
const {createDrinkProp}=await import('../src/people/izakaya-beer.js');
const args=process.argv.slice(2),i=args.indexOf('--name'),NAME=i>=0?args[i+1]:'Johansson';
const out=args.find((a,k)=>!a.startsWith('--')&&args[k-1]!=='--name');
const a=buildAvatar(recipeFor(NAME),{shadows:false,eyes3d:false});a.root.rotation.set(0,0,0);a.root.updateMatrixWorld(true);
const m=a.measure,g=a.body.geometry,P=g.attributes.position,r=v=>Math.round(v*1e5)/1e5;
// the hands' points in every shape, keyed by where they are at rest (the body's corners are each triangle's own)
const at=()=>Array.from(P.array);
const rest=at(),shapes={};
for(const [name,amount,shape] of [['wrap',HAND.wrapAt,'close'],['fist',1,'close'],['hook',1,'hook']]){
 for(const s of ['L','R'])a.grip(s,amount,shape);shapes[name]=at();for(const s of ['L','R'])a.grip(s,0);
}
const hands={};
for(let v=0;v<P.count;v++){
 const moved=['wrap','fist','hook'].some(n=>Math.abs(shapes[n][v*3]-rest[v*3])+Math.abs(shapes[n][v*3+1]-rest[v*3+1])+Math.abs(shapes[n][v*3+2]-rest[v*3+2])>1e-7);
 if(!moved)continue;
 const key=[0,1,2].map(j=>r(rest[v*3+j])).join(',');
 if(!hands[key])hands[key]=Object.fromEntries(['wrap','fist','hook'].map(n=>[n,[0,1,2].map(j=>r(shapes[n][v*3+j]))]));
}
const prop=createDrinkProp('can',{held:true,sealed:true}),S=prop.userData.sealed,socket=canSocket(m,prop,'R');
const pocket=pocketSpot(a),lip=lowerLip(a);
const kit={name:NAME,measure:{k:m.k,hand:m.hand,H:m.H,Rh:m.Rh,headCentre:m.headCentre,headY:m.headY,chestY:m.chestY,shoulderY:m.shoulderY,shoulderX:m.shoulderX,upper:m.upper,fore:m.fore,depth:m.depth},
 bones:Object.fromEntries(Object.entries(a.bones).map(([n,b])=>[n,b.getWorldPosition(new THREE.Vector3()).toArray().map(r)])),
 hand:{wrapAt:HAND.wrapAt,points:hands},
 socket:{R:{position:socket.position.toArray().map(r),quaternion:socket.quaternion.toArray().map(r)}},
 hook:{L:handPoint(m,'L',HAND.hookAt).map(r)},
 lip:{lower:lip.lower.toArray().map(r),mouth:lip.mouth.toArray().map(r)},
 pocket:{position:pocket.position.toArray().map(r),normal:pocket.normal.toArray().map(r),mouth:pocket.mouth.toArray().map(r)},
 can:{radius:prop.userData.grip.radius,height:.122,rim:prop.userData.rimHeight,rimRadius:.03,opening:[0,.121,.012],pivot:[0,.121,.023],ring:S.ring.toArray()}};
await writeFile(out,JSON.stringify(kit));
console.log('wrote',out,Object.keys(hands).length,'hand points');
