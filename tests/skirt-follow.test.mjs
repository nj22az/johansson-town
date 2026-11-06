import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {ORIGINAL_THUAN_RECIPE} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
installDOM();

test('original Thuận has no earrings or necklace',()=>{
 assert.equal(ORIGINAL_THUAN_RECIPE.accessories.earrings,'none');assert.equal(ORIGINAL_THUAN_RECIPE.accessories.neckwear,'none');
});
test('skirt front follows the thighs while the rear keeps hip support',()=>{
 const a=buildAvatar(ORIGINAL_THUAN_RECIPE,{shadows:false}),m=a.measure,g=a.body.geometry;
 const {position:P,skinIndex:I,skinWeight:W,towelFit:F}=g.attributes,waist=m.hipY+m.torso*.13,len=m.thigh*.9,front=[],rear=[];
 for(let i=0;i<P.count;i++){
  if(F.getX(i)!==2||P.getY(i)>waist-len*.85)continue;
  let legs=0;for(let k=0;k<4;k++)if(['thighL','thighR'].includes(a.body.skeleton.bones[I.array[i*4+k]].name))legs+=W.array[i*4+k];
  if(P.getZ(i)>m.depth*.3)front.push(legs);if(P.getZ(i)<-m.depth*.3)rear.push(legs);
 }
 assert.ok(front.length>10&&rear.length>10);assert.ok(front.every(w=>w>.8));assert.ok(rear.every(w=>w>.2&&w<.4));a.dispose();
});
test('seated front hem is supported continuously across the lap and stays finite',()=>{
 const a=buildAvatar(ORIGINAL_THUAN_RECIPE,{shadows:false}),anim=createAvatarAnimator(a),g=a.body.geometry,m=a.measure;
 for(let frame=0;frame<90;frame++)anim.update(1/60,{seated:true,seatHeight:.45});
 a.root.updateMatrixWorld(true);const fit=a.body.towelFit;fit.refresh();
 const P=g.attributes.position,F=g.attributes.towelFit,p=new THREE.Vector3(),rest=new THREE.Vector3();let checked=0;
 for(let i=0;i<P.count;i++){
  if(F.getX(i)!==2||P.getZ(i)<m.depth*.3||P.getY(i)>m.hipY+m.torso*.13-m.thigh*.9*.8)continue;
  rest.fromBufferAttribute(P,i);a.body.getVertexPosition(i,p);fit.fitPoint(p,2,rest);
  assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.y>fit.uniforms.uSeat.value+m.legR*.9,'front cloth lies above, not under the thighs');checked++;
 }
 assert.ok(checked>10);a.dispose();
});

test('side hem follows its own leg through an alternating stride',()=>{
 const a=buildAvatar(ORIGINAL_THUAN_RECIPE,{shadows:false}),m=a.measure,g=a.body.geometry;
 const {position:P,skinIndex:I,skinWeight:W,towelFit:F}=g.attributes;
 const waist=m.hipY+m.torso*.13,len=m.thigh*.9,indices=[];
 for(let i=0;i<P.count;i++){
  if(F.getX(i)!==2||P.getY(i)>waist-len*.85||Math.abs(P.getX(i))<m.width*.4||P.getZ(i)<0)continue;
  const side=P.getX(i)>0?'L':'R';let own=0,other=0;
  for(let k=0;k<4;k++){
   const name=a.body.skeleton.bones[I.array[i*4+k]].name;
   if(name==='thigh'+side)own+=W.array[i*4+k];
   if(name==='thigh'+(side==='L'?'R':'L'))other+=W.array[i*4+k];
  }
  assert.ok(own>.6&&other<.01,'side panels follow one thigh rather than averaging both');indices.push(i);
 }
 assert.ok(indices.length>10);
 const anim=createAvatarAnimator(a),p=new THREE.Vector3(),rest=new THREE.Vector3();
 let minZ=Infinity,maxZ=-Infinity;
 for(let frame=0;frame<120;frame++){
  anim.update(1/60,{speed:1.4});a.root.updateMatrixWorld(true);a.body.skeleton.update();a.body.towelFit.refresh();
  for(const i of indices){rest.fromBufferAttribute(P,i);a.body.getVertexPosition(i,p);a.body.towelFit.fitPoint(p,2,rest);assert.ok(p.toArray().every(Number.isFinite));minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);}
 }
 assert.ok(maxZ-minZ>m.thigh*.2,'hem moves with the stride');a.dispose();
});

test('walking cloth does not stretch adjoining panels into sharp spikes',()=>{
 const a=buildAvatar(ORIGINAL_THUAN_RECIPE,{shadows:false}),anim=createAvatarAnimator(a),g=a.body.geometry,P=g.attributes.position,F=g.attributes.towelFit;
 for(let frame=0;frame<100;frame++){
  anim.update(1/60,{speed:1.4});if(frame%10)continue;
  a.root.updateMatrixWorld(true);a.body.skeleton.update();a.body.towelFit.refresh();
  const posed=new Map();
  for(let i=0;i<P.count;i++)if(F.getX(i)===2){const r=new THREE.Vector3().fromBufferAttribute(P,i),p=a.body.getVertexPosition(i,new THREE.Vector3());a.body.towelFit.fitPoint(p,2,r);posed.set(i,p);}
  for(let i=0;i<P.count;i+=3)if(posed.has(i))for(const [j,k] of [[i,i+1],[i+1,i+2],[i+2,i]]){
   const distance=new THREE.Vector3().fromBufferAttribute(P,j).distanceTo(new THREE.Vector3().fromBufferAttribute(P,k));
   if(distance>.003)assert.ok(posed.get(j).distanceTo(posed.get(k))<distance*2,'cloth edges remain bounded across a stride');
  }
 }
 a.dispose();
});
