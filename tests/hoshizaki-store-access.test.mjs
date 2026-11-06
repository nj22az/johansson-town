import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {COAST_BOUNDS} from '../src/world/island-coast.js';
import {HOSHIZAKI_STORE} from '../src/world/island-plan.js';
import {planHeight,groundHeight,setWalkSurface,routeAt} from '../src/world/layout.js';
import {onIslandLand} from '../src/world/coastal-ground.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {createNeighbours} from '../src/people/neighbours.js';
import {PLACES} from '../src/people/cast.js';
import {townBoundsBlocked,standingHitsRect} from '../physics.js';

// The store is closed (people/cast.js PLACES: nobody keeps it since Mina left), and Hoshizaki went with the rural
// districts: the owner, 18 October 2026 (AGENTS.md), "Keep Minato a compact urban port town. Do not restore rural
// districts"; docs/qa/urban-only-island/README.md names Hoshizaki among the removed places ("Removed rural locations are
// explicitly tested as sea without routes, meshes, colliders or map targets"). So its old approach must be sea, with
// nothing drawn or solid there, and no neighbour may be sent to its counter or its door.
test('the Hoshizaki store is closed and retired: its approach is sea, nothing stands there, and nobody keeps or queues at it',async()=>{
 installDOM();globalThis.self=globalThis;
 assert.ok(PLACES['hoshizaki-store'].closed,'the cast says the store is closed');
 assert.ok(!Object.values(PLACES).some(p=>!p.closed&&/Hoshizaki/.test(p.name)),'no open place is the store');
 const {createTown}=await import('../src/world/town.js'),{createBusinesses}=await import('../src/world/businesses.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const surface=createWalkSurface({minX:COAST_BOUNDS.minX-2,maxX:COAST_BOUNDS.maxX+2,minZ:COAST_BOUNDS.minZ-2,maxZ:COAST_BOUNDS.maxZ+2,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const area=(x,z)=>x>115&&x<165&&z>175&&z<218;
 assert.deepEqual(world.colliders.filter(c=>area(c.x,c.z)).map(c=>c.id),[],'no solids where the village stood');
 world.group.updateMatrixWorld(true);
 const drawn=[];world.group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const b=new THREE.Box3().setFromObject(o);if(!b.isEmpty()&&b.min.x>=115&&b.max.x<=165&&b.min.z>=175&&b.max.z<=218)drawn.push(o.name);});
 assert.deepEqual(drawn,[],'nothing drawn where the village stood');
 const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
 const approach=[[138,206],[138,210],[126,210],HOSHIZAKI_STORE.customer,HOSHIZAKI_STORE.clerk,HOSHIZAKI_STORE.waiting];
 for(const [x,z] of approach){
  assert.equal(onIslandLand(x,z),false,'the old approach is sea at '+[x,z]);
  assert.equal(routeAt(x,z,.32),null,'no walking route at '+[x,z]);
  assert.equal(blocked(x,z),true,'the town bounds keep walkers off the sea at '+[x,z]);
 }
 const neighbours=createNeighbours({parent:new THREE.Group(),blocked});
 const viewer={x:126,z:207.3};
 try{
  // Noon and the early afternoon were the store's busy hours; now nobody is there at any hour.
  for(const minute of [480,720,820,960]){
   neighbours.update(0,minute,viewer);for(let frame=0;frame<120;frame++)neighbours.update(1/60,minute,viewer);
   for(const {g,spec} of neighbours.people){
    if(!g.visible)continue;
    for(const [what,[x,z]] of [['counter',HOSHIZAKI_STORE.clerk],['door',HOSHIZAKI_STORE.customer]])
     assert.ok(Math.hypot(g.position.x-x,g.position.z-z)>1,`${spec.name} stands at the closed store’s ${what} at ${minute}`);
   }
  }
 }finally{setWalkSurface(null);}
});
