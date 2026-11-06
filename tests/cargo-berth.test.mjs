import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {buildOilJetty,cargoBerthVisit} from '../src/world/oil-jetty.js';
import {OIL_JETTY,CARGO_BERTH,oilJettyHeight} from '../src/world/oil-jetty-layout.js';
import {routeAt,planHeight} from '../src/world/layout.js';
import {standingHitsRect,canStepBetween} from '../physics.js';
import {installDOM} from './fixtures.mjs';
import {airportSurface} from '../src/world/airport-ground.js';
import {airportFerryPose,AIRPORT_FERRY} from '../src/world/airport-ferry.js';

const bytes=await readFile(new URL('../assets/models/harbour/cargo-berth.glb',import.meta.url));
globalThis.self=globalThis;
const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const cad=await new GLTFLoader().parseAsync(data,'');
const near=(a,b)=>assert.ok(Math.abs(a-b)<.002,`${a} != ${b}`);

test('original CAD is full scale and keeps independent low-draw ship, quay and moorings',()=>{
 const vessel=cad.scene.getObjectByName('vessel'),quay=cad.scene.getObjectByName('quay');
 const vb=new THREE.Box3().setFromObject(vessel),qb=new THREE.Box3().setFromObject(quay);
 near(vb.max.x-vb.min.x,72.03424);near(vb.max.z-vb.min.z,13.5);near(vb.min.y,-3.6);
 near(qb.max.x-qb.min.x,100);near(qb.max.z,25.9);
 assert.ok(cad.scene.getObjectByName('connections'));
 let draws=0;cad.scene.traverse(o=>{if(o.isMesh)draws++;});assert.equal(draws,21);
});

test('call calendar distinguishes arrival, moored and departure, without lines underway',()=>{
 assert.equal(cargoBerthVisit(449).visible,false);
 assert.equal(cargoBerthVisit(465).phase,'arriving');
 assert.equal(cargoBerthVisit(480).moored,true);
 assert.equal(cargoBerthVisit(720).moored,true);
 assert.equal(cargoBerthVisit(915).phase,'departing');
 assert.equal(cargoBerthVisit(931).visible,false);
 assert.equal(cargoBerthVisit(1440+720).visible,false);
 assert.equal(cargoBerthVisit(3*1440+720).moored,true);
});

test('both airport ferry crossings pass clear of the full-scale cargo quay',()=>{
 const D=OIL_JETTY.deck;
 for(const destination of ['town','airport'])for(let i=0;i<=1000;i++){
  const p=airportFerryPose(destination,i/1000),c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  const halfX=Math.abs(c)*AIRPORT_FERRY.beam/2+Math.abs(s)*AIRPORT_FERRY.length/2;
  const halfZ=Math.abs(s)*AIRPORT_FERRY.beam/2+Math.abs(c)*AIRPORT_FERRY.length/2;
  assert.ok(p.x+halfX<D.minX||p.x-halfX>D.maxX||p.z+halfZ<D.minZ||p.z-halfZ>D.maxZ,'Ferry hits cargo quay at '+destination+' '+i/1000);
 }
});

test('shore ramp connects the island to the entire new quay with matching drawn floors',async()=>{
 installDOM();const fetchBefore=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>data});
 const world={group:new THREE.Group(),colliders:[]};
 try{
  const berth=buildOilJetty(world);
  await berth.load();await berth.load();assert.equal(berth.quay.children.length,1);
  assert.equal(world.group.getObjectByName('Cargo quay loading surface'),undefined);
  const path=[[43.9,-44.4],[57,-44.4],[57,-49],[57,-60],[57,-139],[66,-139],[66,-49],[57,-49]];
  world.group.updateMatrixWorld(true);const ray=new THREE.Raycaster(),meshes=[];
  world.group.traverse(o=>{if(o.isMesh)meshes.push(o);});
  let previous=null;
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.08);
   for(let k=0;k<=n;k++){
    const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n,y=planHeight(x,z);
    assert.ok(routeAt(x,z,.32),'no walking route at '+[x,z]);
    if(previous!==null)assert.ok(canStepBetween(previous,y),'floor cliff at '+[x,z]);previous=y;
    assert.equal(world.colliders.some(c=>standingHitsRect(x,z,.32,y,c)),false,'collider at '+[x,z]);
    if(x>=44.3){
     ray.set(new THREE.Vector3(x,y+.2,z),new THREE.Vector3(0,-1,0));
     const floor=ray.intersectObjects(meshes,false).find(hit=>Math.abs(hit.point.y-y)<.02);
     assert.ok(floor,'no drawn walking surface at '+[x,z]);
    }
   }
  }
  assert.equal(routeAt(49,-95),null,'water between ship and quay remains inaccessible');
  near(oilJettyHeight(57,-95),OIL_JETTY.deck.y);
  assert.equal(oilJettyHeight(69,-95),null);
  for(let x=36;x<=68;x+=2)for(let z=-145;z<=-46;z+=2)assert.equal(airportSurface(x,z),null,'CAD berth must stay clear of the airport');
  berth.update(0,720,0);assert.equal(berth.connections.visible,true);
  assert.deepEqual(berth.ship.position.toArray(),[CARGO_BERTH.x,CARGO_BERTH.y,CARGO_BERTH.z]);
  berth.update(0,915,0);assert.equal(berth.connections.visible,false);assert.equal(berth.ship.visible,true);
  berth.update(0,931,0);assert.equal(berth.ship.visible,false);assert.equal(berth.quay.visible,true);
 }finally{globalThis.fetch=fetchBefore;}
});
