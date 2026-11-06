import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {createMannequin} from '../src/drinking/mannequin.js';
import {DrinkingSimulation} from '../src/drinking/simulation.js';
import {DRINK_PROFILES,outerRadiusAtY} from '../src/drinking/profiles.js';
import {CYCLE_DURATION,DRINK_PHASES} from '../src/drinking/cycle.js';

const bytes=await readFile(new URL('../assets/models/drinking/drinking-mannequin.glb',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const makeRig=()=>createMannequin({arrayBuffer:buffer.slice(0)});
const point=new THREE.Vector3();

/** The actual exported vertices and triangle centroids, not just contact markers. */
function meshSamples(root){
 const meshes=[];
 root.traverse(o=>{
  if(!o.isMesh||/lip/i.test(o.name))return; // Lips intentionally meet the rounded drinking rim.
  const a=o.geometry.attributes.position,index=o.geometry.index;
  const points=[];
  for(let i=0;i<a.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(a,i));
  for(let i=0;i<index.count;i+=3){
   const v=new THREE.Vector3();for(let j=0;j<3;j++)v.add(new THREE.Vector3().fromBufferAttribute(a,index.getX(i+j)));
   points.push(v.multiplyScalar(1/3));
  }
  meshes.push({mesh:o,points});
 });return meshes;
}
function measureClearance(samples,vessel,profile){
 const inverse=vessel.matrixWorld.clone().invert();let minimum=Infinity,name='';
 for(const {mesh,points} of samples){
  const matrix=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
  for(const p of points){
   point.copy(p).applyMatrix4(matrix);
   // Exclude end planes: the vessel exterior ends at its base/rim, not an infinite cylinder.
   if(point.y<.0005||point.y>profile.height-.0005)continue;
   const clearance=Math.hypot(point.x,point.z)-outerRadiusAtY(profile,point.y);
   if(clearance<minimum){minimum=clearance;name=mesh.name;}
  }
 }
 return {minimum,name};
}

test('Blender source and GLB contain editable geometry and a complete articulated right hand',async()=>{
 const source=await readFile(new URL('../assets/models/drinking/drinking-mannequin.blend',import.meta.url));
 assert.equal(source.subarray(0,7).toString(),'BLENDER');
 assert.equal(bytes.subarray(0,4).toString(),'glTF');
 const rig=await makeRig();let meshCount=0,triangles=0;
 rig.root.traverse(o=>{assert.ok(o.scale.x>0&&o.scale.y>0&&o.scale.z>0,'no hand or joint is mirrored with negative scale');if(o.isMesh){meshCount++;triangles+=o.geometry.index.count/3;}});
 assert.ok(meshCount>35);assert.ok(triangles>10000&&triangles<40000,'actual geometry fits the small simulator budget');
 for(const digit of ['index','middle','ring','pinky'])for(const joint of ['MCP','PIP','DIP'])assert.ok(rig.root.getObjectByName(digit+joint));
 assert.ok(rig.root.getObjectByName('thumbCMC'));assert.ok(rig.root.getObjectByName('thumbIP'));
 const feet=['Foot_R','Foot_L'].map(name=>new THREE.Box3().setFromObject(rig.root.getObjectByName(name)));
 for(const box of feet)assert.ok(Math.abs(box.min.y)<1e-6,'rendered soles meet the floor');
 const pelvis=new THREE.Box3().setFromObject(rig.root.getObjectByName('Pelvis'));
 assert.ok(Math.abs(pelvis.min.y-.46)<1e-6,'rendered pelvis is supported by the seat');rig.dispose();
});

test('upper body and swallowing do not move hips, soles or the supported far hand',async()=>{
 const rig=await makeRig(),before=rig.getDiagnostics();
 const left=rig.root.getObjectByName('wristL').getWorldPosition(new THREE.Vector3());
 for(const lean of [0,.035,.08])for(const head of [0,.25,.5]){
  rig.setPosture({lean,head,neck:.08,shoulder:.02,swallow:.8,breath:.5});
  const d=rig.getDiagnostics();assert.deepEqual(d.hips,before.hips);assert.deepEqual(d.feet,before.feet);
  assert.ok(rig.root.getObjectByName('wristL').getWorldPosition(new THREE.Vector3()).distanceTo(left)<1e-8);
 }
 rig.dispose();
});

test('all digit closures preserve fixed anatomy and wrap outside each vessel',async()=>{
 const rig=await makeRig();
 for(const p of Object.values(DRINK_PROFILES))for(let i=0;i<=40;i++){
  rig.setGrip(p,i/40);const d=rig.getDiagnostics();
  assert.equal(d.handedness,'right');assert.ok(d.fingerMinClearance>.00045,p.id+' finger capsule clears the wall');assert.ok(d.thumbMinClearance>.00045,p.id+' opposing thumb capsule clears the wall');
  if(i===40){assert.ok(d.fingerMinClearance<.001);assert.ok(d.thumbMinClearance<.001);}
 }
 rig.dispose();
});

test('full, half and near-empty cycles keep actual hands, face and body clear of the glass',async()=>{
 const rig=await makeRig(),scene=new THREE.Scene();scene.add(rig.root);
 const sim=new DrinkingSimulation({scene,rig}),samples=meshSamples(rig.root);
 const boundaries=[];let end=0;for(const phase of DRINK_PHASES){end+=phase.duration;for(const offset of [-2,-1,0,1,2])boundaries.push(end+offset/120);}
 const times=[...new Set([...Array.from({length:Math.ceil(CYCLE_DURATION*40)},(_,i)=>i/40),...boundaries].filter(t=>t>=0&&t<=CYCLE_DURATION))].sort((a,b)=>a-b);
 for(const id of Object.keys(DRINK_PROFILES)){
  sim.reset();sim.selectDrink(id);
  for(const volume of [sim.profile.startingVolumeMl,sim.profile.startingVolumeMl/2,1]){
   let previous=null,previousTime=0;
   for(const time of times){
    sim.renderAt(time,{volume});const d=rig.getDiagnostics();
    assert.equal(d.reachClamped,false,`${id} ${volume}ml ${time}: reachable without stretching`);
    assert.ok(d.wristError<1e-6);assert.ok(d.wristDeviation<=55.001,`${id} wrist angle ${d.wristDeviation}`);
    assert.ok(d.elbowFlexion>=8-.001&&d.elbowFlexion<=155+.001);
    assert.ok(d.elbow[2]>.195,'elbow stays on the camera-facing side, clear of the torso');
    const e=new THREE.Vector3(...d.elbow);
    if(previous&&time-previousTime>1e-5)assert.ok(e.distanceTo(previous)/(time-previousTime)<1.7,`${id}: elbow does not jump or whip between nearby frames`);
    previous=e;previousTime=time;
    const c=measureClearance(samples,sim.vessel.root,sim.profile);
    assert.ok(c.minimum>-.0001,`${id} ${volume}ml t=${time.toFixed(3)} ${c.name} penetrates glass by ${-c.minimum}m`);
   }
  }
 }
 sim.dispose();rig.dispose();
});
