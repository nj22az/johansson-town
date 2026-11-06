import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createColliderGrid} from '../src/world/collider-grid.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {planHeight,groundHeight,routeAt,setWalkSurface} from '../src/world/layout.js';
import {standingHitsRect} from '../physics.js';
import {VENDING_MACHINE} from '../src/world/vending.js';
import {EAST_QUAY} from '../src/world/okinawa/layout.js';

/**
 * Every drinks machine in the town stands where one would (the owner, 21 October 2026, of the machine on the fish
 * auction's floor: "a vending machine misplaced in the fish market"; and on 20 October, that machines stand against
 * walls): its back to a wall a few centimetres behind it, on ground people walk, off the floors where work is done, and
 * with room in front of it to stand and buy while somebody passes. Nothing is random (CLAUDE.md): each one's placement
 * says why it stands there.
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const {AUCTION_VENDING}=await import('../src/world/okinawa/quarters.js');
const {SAKURA_VENDING}=await import('../src/world/okinawa/old-town.js');
const {KITAHAMA_DRINKS}=await import('../src/world/okinawa/kitahama-quarter.js');
const {CLEARED_LOTS}=await import('../src/world/okinawa/lots.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const surface=createWalkSurface({minX:-50,maxX:75,minZ:-75,maxZ:110,base:planHeight});
surface.add(world.group);setWalkSurface(surface);world.group.updateMatrixWorld(true);
const grid=createColliderGrid(world.colliders);grid.refresh();

const M=VENDING_MACHINE.size,R=.28,BACKED=.08;
/** The floors where work is done, which a machine keeps off (with a buyer's step round them). */
const S=EAST_QUAY.shed;
const WORK_FLOORS=Object.freeze([
 Object.freeze({id:'fish auction floor',minX:S.minX,maxX:S.maxX,minZ:S.minZ,maxZ:S.maxZ}),
]);
/** Where each machine's placement is recorded, and why it stands there. */
const PLACED=[
 {x:AUCTION_VENDING.x,z:AUCTION_VENDING.z,why:AUCTION_VENDING.why},
 {x:SAKURA_VENDING.x,z:SAKURA_VENDING.z,why:SAKURA_VENDING.why,
  // In front of Sakura's shutter, its back 2 to 5 cm off the shutter's bottom rail (vending.test.mjs measures it): by day
  // the shutter is rolled up and what is behind is the shop window, a shutter's depth back.
  backed:.3},
 ...KITAHAMA_DRINKS.machines.map(m=>({x:m.x,z:m.z,why:KITAHAMA_DRINKS.why})),
 ...CLEARED_LOTS.flatMap(l=>(l.dressing?.props||[]).filter(p=>p.builtBy==='vending').map(p=>({x:p.at[0],z:p.at[1],why:l.dressing.why,lot:l.id}))),
];
/**
 * Machines known to stand free, each with its reason; an entry comes out when the machine is backed.
 * (None: the drinks corner on the post-office lot backs onto its screen wall since step 3 of the ground plan, lots.js.)
 */
const PENDING=new Set([]);

const machines=[];world.group.traverse(o=>{if(o.name==='Harbour vending machine')machines.push(o);});
const placed=m=>PLACED.find(p=>Math.abs(p.x-m.position.x)<.01&&Math.abs(p.z-m.position.z)<.01);
const checked=machines.filter(m=>!PENDING.has(placed(m)?.lot));
const where=m=>`machine at ${m.position.x.toFixed(2)},${m.position.z.toFixed(2)}`;
/** A point in the machine's own frame (u across its face, v out of its front) in the town's. */
const at=(m,u,v)=>{const p=new THREE.Vector3(u,0,v).applyMatrix4(m.matrixWorld);return [p.x,p.z];};
const free=(x,z)=>!!routeAt(x,z,R)&&!grid.some(x,z,R,c=>!c.moving&&(!c.only||c.only==='player')&&standingHitsRect(x,z,R,groundHeight(x,z),c));

test('the town has its drinks machines, each placed by data that says why it stands there',()=>{
 assert.ok(machines.length>=6,`${machines.length} machines`);
 for(const m of machines){const p=placed(m);assert.ok(p,`${where(m)} is placed from recorded data`);assert.ok(p.why?.length>40,`${where(m)} says why it stands there`);}
 assert.ok(checked.length>=4,'the pending list is the exception, not the rule');
});

test('every machine has its back to a wall a few centimetres behind it',()=>{
 // a ray straight back from the cabinet's back, at knee and waist height, at both edges and the middle: each meets
 // something drawn (a wall, a block wall, a plinth) within a few centimetres
 const loose=[],ray=new THREE.Raycaster(),own=new Set();
 for(const m of machines)m.traverse(o=>own.add(o));
 const meshes=[];world.group.traverse(o=>{if(o.isMesh&&!own.has(o))meshes.push(o);});
 for(const m of checked){
  const back=new THREE.Vector3(0,0,-1).transformDirection(m.matrixWorld),far=placed(m)?.backed??BACKED;
  for(const u of [-.45,0,.45])for(const h of [.5,1]){
   const from=new THREE.Vector3(u,h,-M.depth/2+.005).applyMatrix4(m.matrixWorld);
   ray.set(from,back);ray.far=far+.005;
   if(!ray.intersectObjects(meshes,false).length)loose.push(`${where(m)}: nothing within ${far} m behind it, ${h} m up at ${from.x.toFixed(2)},${from.z.toFixed(2)}`);
  }
 }
 assert.deepEqual(loose,[]);
});

test('every machine stands on ground people walk, off the work floors, with room to stand and buy and to pass',()=>{
 const wrong=[];
 for(const m of checked){
  const [x,z]=at(m,0,0);
  for(const f of WORK_FLOORS)if(x>f.minX-.6&&x<f.maxX+.6&&z>f.minZ-.6&&z<f.maxZ+.6)wrong.push(`${where(m)} on the ${f.id}`);
  for(const u of [-.45,.45])for(const v of [-.3,.3]){const [px,pz]=at(m,u,v);if(!routeAt(px,pz))wrong.push(`${where(m)} off the walkable ground at ${px.toFixed(2)},${pz.toFixed(2)}`);}
  // the buyer's place in front of it, and room for somebody to pass behind the buyer
  for(const v of [M.depth/2+.6,M.depth/2+1.2])for(const u of [-.35,0,.35]){const [px,pz]=at(m,u,v);if(!free(px,pz))wrong.push(`${where(m)}: blocked ${v.toFixed(2)} m out at ${px.toFixed(2)},${pz.toFixed(2)}`);}
 }
 assert.deepEqual(wrong,[]);
});
