import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createKit} from '../src/world/okinawa/kit.js';
import {shopHouse} from '../src/world/okinawa/houses.js';
import {NAKAMURA_PLAN as P,NAKAMURA_GO_HOME,nakamuraPoint} from '../src/world/nakamura-plan.js';
import {standingHitsRect} from '../physics.js';
import {createNeighbours} from '../src/people/neighbours.js';
installDOM();
const kit=createKit(),group=new THREE.Group();let colliders;
kit.at(P.x,P.z,-Math.PI/2,()=>{colliders=shopHouse(kit,{w:P.w,d:P.d,interior:'zenzai'});});
kit.finish(group);group.updateMatrixWorld(true);

test('the counter, family doorway and every homeward step have body clearance',()=>{
 const route=[nakamuraPoint(0,.08,2.05),...NAKAMURA_GO_HOME];
 for(let i=1;i<route.length;i++){
  const a=new THREE.Vector3(...route[i-1]),b=new THREE.Vector3(...route[i]);
  for(let t=0;t<=1;t+=.1){const v=a.clone().lerp(b,t);assert.equal(colliders.some(c=>standingHitsRect(v.x,v.z,.30,v.y,c)),false,JSON.stringify(v));}
 }
 assert.ok(colliders.some(c=>c.id==='zenzai-counter'));
 assert.ok(group.userData.walkLevels.filter(s=>s.id==='nakamura-home-stair').length>=18);
});

test('the shop has a visible stepable floor rather than the old 30 cm foundation slab',()=>{
 const p=nakamuraPoint(-1,1,3.65),ray=new THREE.Raycaster(new THREE.Vector3(...p),new THREE.Vector3(0,-1,0));
 const hit=ray.intersectObject(group,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-.08)<1e-5,hit.point.y);
});

test('the vacant shop retains its complete shell without illuminated rooms or windows',()=>{
 const build=occupied=>{const k=createKit(),g=new THREE.Group();k.at(P.x,P.z,-Math.PI/2,()=>shopHouse(k,{w:P.w,d:P.d,interior:'zenzai',occupied}));const result=k.finish(g);g.updateMatrixWorld(true);let triangles=0;g.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return {g,result,triangles,box:new THREE.Box3().setFromObject(g)};};
 const staffed=build(true),vacant=build(false);
 assert.ok(staffed.result.materials.window?.userData.windowInterior,'staffed buildings retain the normal window rendering');
 assert.ok(staffed.result.materials.glow,'staffed buildings retain their light surfaces');
 assert.equal(vacant.result.materials.window,undefined);assert.equal(vacant.result.materials.glow,undefined);
 assert.equal(vacant.triangles,staffed.triangles,'no facility geometry removed');
 assert.ok(vacant.box.min.distanceTo(staffed.box.min)<1e-6&&vacant.box.max.distanceTo(staffed.box.max)<1e-6,'the retained shell has the same bounds');
});

test('the retired ice-cream family has no street bodies at the retained shop',()=>{
 const neighbours=createNeighbours({parent:new THREE.Group()});
 for(const minutes of [600,720,1139,1140,2040]){
  neighbours.update(.1,minutes);
  assert.equal(neighbours.people.some(p=>['Mrs Nakamura','Mai'].includes(p.spec.name)),false);
 }
});

test('the built town retains the vacant shop shell, notices, stairs and public bench without a family home entry',async()=>{
 globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const {createIslandBusinesses}=await import('../src/world/businesses.js');
 const prompts=[],world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,shadows:false,kitano:'distant',register:(o,label,run)=>prompts.push({o,label,run}),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 for(const v of NAKAMURA_GO_HOME){assert.equal(world.colliders.some(c=>standingHitsRect(v[0],v[2],.30,v[1],c)),false,'Town route '+v);}
 for(const label of ['Read the dessert counter notice','Read the upstairs vacancy notice','Sit beside Nakamura with your dessert']){
  const prompt=prompts.find(p=>p.label===label);assert.ok(prompt,label);
  const p=prompt.o.getWorldPosition(new THREE.Vector3());assert.equal(world.colliders.some(c=>standingHitsRect(p.x,p.z,.30,0,c)),false,label);
 }
 assert.equal(world.landmarks.some(p=>p.id==='home-nakamura'),false);
 assert.ok(world.landmarks.some(p=>p.id==='nakamura'&&/vacant/.test(p.line)));
});
