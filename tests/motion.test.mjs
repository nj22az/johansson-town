import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {normalizeMotion,createMotionPlayer,waveMotion,retargetMotion,motionClip,MOTION_JOINTS} from '../src/avatars/motion.js';
import {inspectMotionGLB} from '../src/avatars/motion-import.js';

const parents={hips:null,spine:'hips',chest:'spine',neck:'chest',head:'neck',shoulderL:'chest',elbowL:'shoulderL',handL:'elbowL',shoulderR:'chest',elbowR:'shoulderR',handR:'elbowR',thighL:'hips',kneeL:'thighL',footL:'kneeL',thighR:'hips',kneeR:'thighR',footR:'kneeR'};
const mixamo={hips:'Hips',spine:'Spine',chest:'Spine2',neck:'Neck',head:'Head',shoulderL:'LeftArm',elbowL:'LeftForeArm',handL:'LeftHand',shoulderR:'RightArm',elbowR:'RightForeArm',handR:'RightHand',thighL:'LeftUpLeg',kneeL:'LeftLeg',footL:'LeftFoot',thighR:'RightUpLeg',kneeR:'RightLeg',footR:'RightFoot'};
function rig({mix=false,scale=1}={}){
 const root=new THREE.Group(),bones={};
 for(const n of MOTION_JOINTS){const b=new THREE.Bone();b.name=mix?'mixamorig:'+mixamo[n]:n;b.position.set(0,.1*scale,0);bones[n]=b;(bones[parents[n]]||root).add(b);}
 const body=new THREE.SkinnedMesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());root.add(body);root.updateMatrixWorld(true);body.bind(new THREE.Skeleton(Object.values(bones)));
 return {root,bones,body};
}
const clip=(bone,axis,angle)=>{const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis),angle);return new THREE.AnimationClip('Test',1,[new THREE.QuaternionKeyframeTrack(bone+'.quaternion',[0,1],[0,0,0,1,...q.toArray()])]);};
test('wave is a finite portable take; player reaches and returns from the wave',()=>{
 const motion=normalizeMotion(JSON.parse(JSON.stringify(waveMotion()))),a=rig(),p=createMotionPlayer(motion);
 p.apply(a,1);assert.ok(Math.abs(a.bones.shoulderR.rotation.z)>1);p.apply(a,3);assert.ok(a.bones.shoulderR.quaternion.angleTo(new THREE.Quaternion())<1e-6);
 assert.equal(motionClip(motion).duration,3);
});
test('reject malformed timings, excessive duration, zero quaternions and unsupported-only joints',()=>{
 const m=waveMotion();
 for(const times of [[0,0],[0,Infinity],[0,31],[1,2]])assert.throws(()=>normalizeMotion({...m,times}));
 assert.throws(()=>normalizeMotion({...m,joints:{head:Array(m.times.length*4).fill(0)}}));
 assert.throws(()=>normalizeMotion({...m,joints:{unknown:m.joints.head}}));
 assert.throws(()=>normalizeMotion({...m,joints:{head:m.joints.head.map(()=>NaN)}}));
});
test('native transfer uses the actual bind, preserves length, and includes the final sample',()=>{
 const source=rig(),target=rig({scale:.4});source.root.rotation.y=Math.PI;target.root.rotation.y=Math.PI;
 source.bones.head.rotation.x=.7; // animated frame is deliberately not a bind pose
 const before=target.bones.head.position.clone(),motion=retargetMotion(source.root,clip('head',[1,0,0],.5),target),p=createMotionPlayer(motion);
 p.apply(target,1);assert.ok(Math.abs(target.bones.head.rotation.x-.5)<1e-5);assert.ok(target.bones.head.position.equals(before));
 assert.ok(Math.abs(source.bones.head.rotation.x-.7)<1e-5);assert.equal(source.bones.head.scale.x,1);
});
test('Mixamo rest transfers to Johansson T-pose and source scale is never copied',()=>{
 const source=rig({mix:true,scale:100}),target=rig({scale:.5});
 const p=createMotionPlayer(retargetMotion(source.root,clip(source.bones.elbowL.uuid,[0,0,1],.4),target));
 p.apply(target,1);assert.ok(Math.abs(target.bones.shoulderL.rotation.z-Math.PI/2)<1e-5);assert.ok(Math.abs(target.bones.elbowL.rotation.z-.4)<1e-5);
 assert.equal(target.bones.elbowL.position.y,.05);assert.equal(target.root.scale.x,1);
});
test('parent rotations are not applied twice to children',()=>{
 const source=rig(),target=rig();const p=createMotionPlayer(retargetMotion(source.root,clip('spine',[0,1,0],.6),target));
 p.apply(target,.5);assert.ok(Math.abs(target.bones.spine.rotation.y-.3)<1e-5);assert.ok(target.bones.chest.quaternion.angleTo(new THREE.Quaternion())<1e-5);
});
test('unsupported rigs and overlong clips fail without changing the target',()=>{
 const source=rig(),target=rig();source.bones.hips.name='unknown';assert.throws(()=>retargetMotion(source.root,clip('head',[1,0,0],1),target));
 assert.throws(()=>retargetMotion(rig().root,new THREE.AnimationClip('long',31,[]),target));
 assert.equal(target.bones.shoulderL.rotation.z,0);
});
function glb(json){const text=new TextEncoder().encode(JSON.stringify(json)),length=Math.ceil(text.length/4)*4,b=new ArrayBuffer(20+length),v=new DataView(b);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,b.byteLength,true);v.setUint32(12,length,true);v.setUint32(16,0x4e4f534a,true);new Uint8Array(b,20).fill(32);new Uint8Array(b,20).set(text);return b;}
test('GLB import rejects external resources, oversized scenes and missing animation',()=>{
 const base={asset:{version:'2.0'},animations:[{}],skins:[{}],nodes:[{}]};assert.doesNotThrow(()=>inspectMotionGLB(glb(base)));
 for(const change of [{buffers:[{uri:'https://example.com/a.bin'}]},{images:[{uri:'../private.png'}]},{animations:[]},{nodes:Array(4097).fill({})}])assert.throws(()=>inspectMotionGLB(glb({...base,...change})));
 assert.throws(()=>inspectMotionGLB(new ArrayBuffer(4)));
});
