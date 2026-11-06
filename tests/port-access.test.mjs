import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,townBoundsBlocked,sweepFraction} from '../physics.js';
import {createNavigation} from '../src/people/navmesh.js';

test('you can walk from the quay yard onto the pier and into Mr Fujita’s shed',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js?port-access');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const {PORT_SHED,SHED_PIER}=await import('../src/world/port-shed.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 // (as the town's walkers are blocked: at a standing height, so an overhead collider, the shed's roof for the lens, is not a wall)
 const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>standingHitsRect(x,z,r,0,c));
 const nav=createNavigation(blocked,{step:.5,bounds:{minX:-40,maxX:-7,minZ:-61,maxZ:-35}});
 const door=world.warehouse.place.door;
 const goal={x:PORT_SHED.x-.55,z:PORT_SHED.z+.4};
 const path=nav.path({x:door[0],z:door[2]},goal);
 assert.deepEqual(path.at(-1),[goal.x,goal.z],'The shed must be reachable from the warehouse, not just from an isolated pier');
 for(let i=1;i<path.length;i++)assert.equal(sweepFraction({x:path[i-1][0],z:path[i-1][1]},{x:path[i][0],z:path[i][1]},blocked),1,'Every walking segment is clear');
 // The full loading frontage, including the old rack position, stays clear.
 for(let z=-46.7;z<=-38.4;z+=.2)assert.ok(!blocked(-9.5,z),'Clear warehouse frontage at '+z);
 // Onto the pier along its west side, past the cargo on the quay, to the shed's open end.
 const x=SHED_PIER.minX+.9;
 // From the yard along the seawall, past the sterns of the two sabani hauled out there,
 // then out along the pier.
 for(const [px,pz] of [[-38,-41],[-38,-43.8],[-37.9,-46.1],[-37.6,-46.6]])assert.ok(!blocked(px,pz),`the way from the yard is blocked at ${px},${pz}`);
 for(let z=-46.2;z>=PORT_SHED.z+PORT_SHED.width/2+.4;z-=.4)assert.ok(!blocked(x,z),`the pier is blocked at ${x.toFixed(2)},${z.toFixed(1)}`);
 // And in at the shed's open end.
 for(let z=PORT_SHED.z+PORT_SHED.width/2+.8;z>=PORT_SHED.z+.4;z-=.3)assert.ok(!blocked(PORT_SHED.x-.55,z),'the shed doorway is blocked at z='+z.toFixed(1));
});
