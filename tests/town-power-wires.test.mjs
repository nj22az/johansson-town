import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {sagCurve} from '../src/world/okinawa/kit.js';
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js?power-wires');
const {createBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const power=world.powerNetwork;

test('a few poles, one row to a street, and four wires a span',()=>{
 assert.ok(power.nodes.length<=40,'poles: '+power.nodes.length);
 assert.ok(power.wires.length<=power.spans.length*4);
 // No two poles stand closer than a span would ever be strung.
 for(const a of power.nodes)for(const b of power.nodes)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>3,`${a.id} and ${b.id} stand together`);
});

test('no wire runs through a building, a roof or a tree',()=>{
 // Moving things are not obstacles: the ferry waits out of service, hidden, at the origin under Main Street.
 const meshes=[],collect=o=>{if(o.userData.dynamicProp)return;if(o.isMesh&&!/Island distribution/.test(o.name))meshes.push(o);o.children.forEach(collect);};collect(world.group);
 const ray=new THREE.Raycaster(),u=new THREE.Vector3(),v=new THREE.Vector3();
 for(const [from,to,sag] of power.wires){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),curve=sagCurve(a,b,sag*Math.min(1.6,a.distanceTo(b)/14));
  // Clear of the pole heads at either end, where the crossarm and insulators are.
  const inset=1.4/Math.max(1.4*2.2,a.distanceTo(b));
  for(let t=inset;t<1-inset-1e-6;t+=.2){
   curve.getPoint(t,u);curve.getPoint(Math.min(1-inset,t+.2),v);const d=v.clone().sub(u),len=d.length();
   ray.set(u,d.normalize());ray.far=len;const hit=ray.intersectObjects(meshes,false)[0];
   assert.ok(!hit,`a wire from ${from.map(n=>n.toFixed(1))} passes through ${hit?.object.name} at ${hit?.point.toArray().map(n=>n.toFixed(1))}`);
  }
 }
});
