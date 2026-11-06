import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {AIRPORT_ISLAND} from '../src/world/airport-island.js';

/** The town as the game builds it (kitano:'distant') or as the tests and tools do ('full'), with its prompts and sites. */
async function town(kitano){
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
 const prompts=[],sites=createBusinesses();
 const world=createTown({scene:new THREE.Scene(),sites,townMode:'peninsula',mobile:true,shadows:false,kitano,register:(o,label)=>prompts.push(label),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 return {world,prompts,sites};
}
const count=list=>list.reduce((m,k)=>m.set(k,(m.get(k)||0)+1),new Map());
const names=root=>{const out=[];root.traverse(o=>{if(o.isMesh&&o.name&&!o.name.startsWith('static-props:'))out.push(o.name);});return out;};
const KITANO_COLLIDERS=['Island palm trunk','Island broadleaf trunk','Island pandanus trunk','Island banana trunk','Island hill rock','Island bench','Lounge post','Beach bar post'];

test('Kitano-jima at startup: its ground, airport, sites and a distant view, none of its plants, district or houses',async()=>{
 const {world,prompts,sites}=await town('distant'),island=world.airportIsland.group;
 assert.equal(world.kitano.state,'distant');
 for(const n of ['Kitano-jima distant plants','Kitano-jima distant airport district','Kitano hamlet, distant','Kitano-jima island ground','Kitano-jima ferry quay wall'])assert.ok(island.getObjectByName(n),'no '+n);
 for(const n of ['Kitano-jima plants','Coconut palms','Kitano hamlet','Airport terminal plaza'])assert.equal(island.getObjectByName(n),undefined,n+' built at startup');
 for(const id of KITANO_COLLIDERS)assert.ok(!world.colliders.some(c=>c.id===id),id+' collider at startup');
 // What the doors, the Town Book and the residents read is there from the start.
 for(const id of ['mayor-home','home-kitano-2'])assert.ok(sites.some(s=>s.id===id),'no site '+id);assert.ok(!sites.some(s=>s.id==='home-kitano-3'),'the Chinen house is gone (phase 4)');
 assert.ok(prompts.includes('Go home')&&prompts.includes('Airport ferry back to Minato'));
 // CAD crowns and fronds retain their silhouette across the strait. Count actual
 // indexed triangles (vertex count / 3 undercounts these shared-vertex meshes).
 const cost=root=>{let n=0;root.traverse(o=>{if(o.isInstancedMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*o.count;});return n;};
 const tris=cost(island.getObjectByName('Kitano-jima distant plants'));
 assert.ok(tris<120000,'distant CAD plants: '+tris+' triangles');
 // Near the island it is "there"; at the Minato pier it is not.
 assert.ok(world.kitano.near(AIRPORT_ISLAND.x,AIRPORT_ISLAND.z)&&!world.kitano.near(-3,-71));
});

test('built on demand, it is the same island the full build makes: colliders, prompts and meshes',async()=>{
 const full=await town('full'),part=await town('distant');
 const before=part.prompts.length;
 assert.equal(part.world.kitano.ensure(),true);assert.equal(part.world.kitano.state,'full');assert.equal(part.world.kitano.ensure(),false,'built twice');
 assert.deepEqual(part.world.kitano.built,['plants','hamlet','airport district']);
 // The distant district and houses are gone; the distant plants stay for the view from across the strait.
 const island=part.world.airportIsland.group;
 assert.equal(island.getObjectByName('Kitano-jima distant airport district'),undefined);assert.equal(island.getObjectByName('Kitano hamlet, distant'),undefined);
 assert.ok(island.getObjectByName('Kitano-jima distant plants'));
 assert.deepEqual([...count(part.world.colliders.map(c=>c.id)).entries()].sort(),[...count(full.world.colliders.map(c=>c.id)).entries()].sort(),'colliders differ');
 assert.deepEqual([...count(part.prompts).entries()].sort(),[...count(full.prompts).entries()].sort(),'prompts differ');
 assert.ok(part.prompts.length>before,'no prompts came with the island');
 const distant=n=>/distant/.test(n);
 assert.deepEqual([...count(names(part.world.group).filter(n=>!distant(n))).entries()].sort(),[...count(names(full.world.group)).entries()].sort(),'meshes differ');
 // Everything static on the island is batched inside its own group, drawn from anywhere (render/static-props.js).
 const loose=[];island.traverse(o=>{if(o.isMesh&&o.userData.staticProp&&!o.userData.renderBatch&&!o.material?.transparent&&!(o.material?.emissive?.getHex())&&!o.material?.userData?.kitFinish)loose.push(o.name);});
 assert.ok(loose.length<10,'unbatched on the island: '+loose.slice(0,5));
 // The real plants near the island, the far ones from Minato.
 const tropic=part.world.airportIsland.tropic;
 tropic.lod(new THREE.Vector3(-3,0,-71));assert.equal(tropic.plants.visible,false);assert.equal(tropic.farPlants.visible,true);
 tropic.lod(new THREE.Vector3(AIRPORT_ISLAND.x,0,AIRPORT_ISLAND.z));assert.equal(tropic.plants.visible,true);assert.equal(tropic.farPlants.visible,false);
});

test('prepared on the way: a step at a time, and a placement in the middle finishes it at once',async()=>{
 const {world}=await town('distant');let frames=0;const waits=[];
 const frame=()=>new Promise(resolve=>{frames++;waits.push(resolve);});
 const done=world.kitano.prepare({frame});assert.equal(world.kitano.state,'loading');
 assert.equal(world.kitano.prepare({frame}),done,'a second request starts a second build');
 waits.shift()();await new Promise(r=>setTimeout(r,0));assert.deepEqual(world.kitano.built,['plants']);
 // He is put on the island before the rest has come: it is built there and then.
 world.kitano.ensure();assert.equal(world.kitano.state,'full');assert.deepEqual(world.kitano.built,['plants','hamlet','airport district']);
 waits.shift()?.();assert.equal(await done,true);assert.ok(frames<=3);
});
