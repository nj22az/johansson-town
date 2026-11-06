import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {buildBridgeWipers} from '../src/world/ferry-bridge-wipers.js';
import {WIPER_GEOMETRY as P} from '../src/world/ferry-bridge-wipers-geometry.js';
import {FERRY_INTERIOR,FERRY_HOUSE} from '../src/world/ferry-interior.js';
import {FERRY_DECKS} from '../src/world/ferry-model.js';
import {installDOM} from './fixtures.mjs';
installDOM();

const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`${a} ≠ ${b}`);
const frame=()=>new THREE.Group();
test('wiper dimensions use actual vertical fore windows and solid upper frame',()=>{
 const y=FERRY_DECKS.bridge.y,z=FERRY_HOUSE.fore;
 for(const x of P.sourcePane.centres){
  const pane=FERRY_INTERIOR.glass.find(g=>Math.abs(g.pos[0]-x)<1e-6&&Math.abs(g.pos[2]-(z-.04))<1e-6&&Math.abs(g.pos[1]-(y+1.45))<1e-6);
  assert.ok(pane);assert.deepEqual(pane.rot,[0,0,0]);assert.deepEqual(pane.size.map(v=>+v.toFixed(6)),[1.05,.95,.03]);
 }
 // Exterior plate begins exactly on forward solidwall z0. Its footprint is
 // above the pane and its metal top-frame trim, below the visor at2.08.
 assert.ok(P.rootY-.05>1.925);assert.ok(P.rootY+.05<2.08);
 close(P.rubberMinZ-P.sourcePane.outerFaceZ,.0005);
});
test('full 80-degree stroke: both arms remain linked; blade stays vertical and outside glass',()=>{
 const parent=frame(),rig=buildBridgeWipers(parent),fixed=rig.units.map(u=>u.parts.fixed.matrixWorld.clone());
 for(let i=0;i<=280;i++){
  const a=P.sweep[0]+(P.sweep[1]-P.sweep[0])*i/280;rig.setAngle(a);parent.updateMatrixWorld(true);
  for(const {unit,parts} of rig.units){
   const lowerA=new THREE.Vector3(0,-P.armLength,0).applyMatrix4(parts.drive.matrixWorld);
   const lowerB=new THREE.Vector3(0,-P.armLength,0).applyMatrix4(parts.idler.matrixWorld);
   const couplingA=new THREE.Vector3().applyMatrix4(parts.carrier.matrixWorld);
   const couplingB=new THREE.Vector3(P.shaftCentres,0,0).applyMatrix4(parts.carrier.matrixWorld);
   close(lowerA.distanceTo(couplingA),0);close(lowerB.distanceTo(couplingB),0);
   close(parts.carrier.rotation.z,0);
   const c=new THREE.Vector3(.025,0,P.rubberMinZ).applyMatrix4(parts.carrier.matrixWorld);
   close(c.z-P.sourcePane.outerFaceZ,.0005);
   const centreX=unit.position.x-P.rootXOffset;
   assert.ok(c.x-.006>centreX-.525&&c.x+.006<centreX+.525);
   assert.ok(c.y-P.bladeLength/2>.975&&c.y+P.bladeLength/2<1.925);
  }
 }
 // Supports cannot follow the arm; all three remain fixed acrossfullstroke.
 rig.setAngle(0);parent.updateMatrixWorld(true);const before=rig.units.map(u=>u.parts.fixed.matrixWorld.toArray());
 rig.setAngle(.7);parent.updateMatrixWorld(true);assert.deepEqual(rig.units.map(u=>u.parts.fixed.matrixWorld.toArray()),before);
 assert.equal(rig.wipers.length,3);assert.equal(new Set(rig.units.map(u=>u.parts.drive.children[0].geometry)).size,1);
});
test('wet powered wipes, power loss holds, dry powered self-parks without a pose jump',()=>{
 const rig=buildBridgeWipers(frame());close(rig.angle,P.park);
 for(let i=0;i<12;i++)rig.update(1/60,{rain:true,powered:true});
 const moving=rig.angle;assert.ok(moving>P.park);
 for(let i=0;i<100;i++)rig.update(1/60,{rain:false,powered:false});close(rig.angle,moving);
 rig.update(1/60,{rain:true,powered:true});assert.ok(Math.abs(rig.angle-moving)<.045);
 let previous=rig.angle;
 for(let i=0;i<180;i++){rig.update(1/60,{rain:false,powered:true});assert.ok(Math.abs(rig.angle-previous)<.045);previous=rig.angle;}
 close(rig.angle,P.park);for(let i=0;i<20;i++)rig.update(.1,{rain:false,powered:true});close(rig.angle,P.park);
 rig.update(.1,{rain:true,powered:true});assert.ok(rig.angle>P.park);
});
test('native GLB has same four articulated part meshes as the Blender-derived fallback',async()=>{
 const b=await readFile(new URL('../assets/models/ferry-bridge/bridge-wipers-v1.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 scene.updateMatrixWorld(true);let meshes=0,triangles=0;
 for(const name of P.parts){
  const root=scene.getObjectByName('wiper_'+name);assert.ok(root?.isObject3D&&!root.isMesh);assert.equal(root.children.length,1);
  const mesh=root.children[0];assert.ok(mesh.isMesh);meshes++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
  mesh.updateMatrix();const pos=mesh.geometry.attributes.position;
  const points=[];for(let i=0;i<pos.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrix));
  const a=new THREE.Box3().setFromPoints(points),g=P.fallback[name].position;
  const q=[];for(let i=0;i<g.length;i+=3)q.push(new THREE.Vector3(g[i],g[i+1],g[i+2]));
  const f=new THREE.Box3().setFromPoints(q);
  for(const key of ['min','max'])for(const axis of ['x','y','z'])close(a[key][axis],f[key][axis],2e-6);
 }
 assert.equal(meshes,4);assert.equal(triangles,1360);assert.ok(b.length<150000);
});
test('lazy native replacement keeps current pivots, linkage pose, and shared GPU buffers',async()=>{
 // Inject a local GLB parse at loader boundary; exercise realreplacementlogic
 // without browser/network access or allocating another geometry perwindow.
 const original=GLTFLoader.prototype.loadAsync;
 GLTFLoader.prototype.loadAsync=async()=>{
  const b=await readFile(new URL('../assets/models/ferry-bridge/bridge-wipers-v1.glb',import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 };
 try{
  const parent=frame(),rig=buildBridgeWipers(parent);rig.setAngle(.373);parent.updateMatrixWorld(true);
  const before=rig.units.map(u=>u.parts.carrier.matrixWorld.toArray()),pivots=rig.wipers.slice();
  assert.equal(await rig.ensureNative(),true);assert.equal(rig.loaded,true);parent.updateMatrixWorld(true);
  close(rig.angle,.373);assert.deepEqual(rig.wipers,pivots);assert.deepEqual(rig.units.map(u=>u.parts.carrier.matrixWorld.toArray()),before);
  for(const name of P.parts)assert.equal(new Set(rig.units.map(u=>u.parts[name].children[0].geometry)).size,1);
  const vertices=part=>{
   const mesh=part.children[0],p=mesh.geometry.attributes.position,out=[];
   for(let i=0;i<p.count;i++)out.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));return out;
  };
  const fixedMatrices=rig.units.map(u=>u.parts.fixed.matrixWorld.toArray());
  for(let sample=0;sample<=40;sample++){
   rig.setAngle(-.7+sample*1.4/40);parent.updateMatrixWorld(true);
   for(const {unit,parts} of rig.units){
    // Actual native circular hinge-ring vertices locate each hinge axis. Test
    // closure in the glass plane: concentric pins intentionally overlap in depth.
    const armA=vertices(parts.drive),armB=vertices(parts.idler),carrier=vertices(parts.carrier);
    for(const [arm,x,r] of [[armA,0,.021],[armB,P.shaftCentres,.014]]){
     const expected=new THREE.Vector3(x,0,0).applyMatrix4(parts.carrier.matrixWorld);
     const centre=(points,z,radius)=>{
      const unique=new Map();for(const v of points)if(Math.abs(v.z-z)<2e-6&&Math.abs(Math.hypot(v.x-expected.x,v.y-expected.y)-radius)<2e-6)unique.set(v.x.toFixed(6)+','+v.y.toFixed(6),v);
      assert.equal(unique.size,12);const values=[...unique.values()];return new THREE.Vector2(values.reduce((n,v)=>n+v.x,0)/values.length,values.reduce((n,v)=>n+v.y,0)/values.length);
     };
     for(const c of [centre(arm,.061,r),centre(carrier,.0725,.006)])close(c.distanceTo(new THREE.Vector2(expected.x,expected.y)),0,2e-6);
    }
    const rubber=carrier.filter(v=>Math.abs(v.z-P.rubberMinZ)<2e-6);assert.ok(rubber.length>=4);
    const box=new THREE.Box3().setFromPoints(rubber),cx=unit.position.x-P.rootXOffset;
    assert.ok(box.min.x>cx-.525&&box.max.x<cx+.525&&box.min.y>.975&&box.max.y<1.925);
    close(box.min.z-P.sourcePane.outerFaceZ,.0005,2e-6);
    close(box.max.z-box.min.z,0,2e-6);close(box.max.x-box.min.x,.0106,2e-6);
   }
   assert.deepEqual(rig.units.map(u=>u.parts.fixed.matrixWorld.toArray()),fixedMatrices);
  }
 }finally{GLTFLoader.prototype.loadAsync=original;}
});
