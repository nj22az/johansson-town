import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect} from '../physics.js';
import {groundHeight,planHeight,setWalkSurface,routeAt} from '../src/world/layout.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {COAST_BOUNDS} from '../src/world/island-coast.js';
import {COAST_WALK,ISLAND_ROUTES} from '../src/world/island-plan.js';
import {KITAHAMA,plotGate} from '../src/world/kitahama-layout.js';
import {SCHOOL} from '../src/world/school-layout.js';
import {onIslandLand} from '../src/world/coastal-ground.js';

test('the complete island circuit and Main Street residential connection are clear at walking radius',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const world=createTown({scene:new THREE.Scene(),sites:(await import('../src/world/businesses.js')).createIslandBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const surface=createWalkSurface({...COAST_BOUNDS,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 try{
  assert.deepEqual(COAST_WALK[0],COAST_WALK.at(-1),'the coastal walk closes');
  assert.ok(COAST_BOUNDS.maxZ<=95,'only inhabited urban blocks remain');
  for(const path of [{id:'coastal circuit',points:COAST_WALK},...ISLAND_ROUTES.filter(r=>['island-shopping-lane','rainflower-residential-walk','kitahama-west-link'].includes(r.id))]){
   let previous=null;
   for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1);
    for(let j=0;j<=steps;j++){
     const t=j/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=groundHeight(x,z),where=`${path.id} at ${x.toFixed(2)},${z.toFixed(2)}`;
     assert.ok(routeAt(x,z,.32),where+' ground');assert.ok(onIslandLand(x,z),where+' stays on the island');
     assert.deepEqual(world.colliders.filter(c=>standingHitsRect(x,z,.32,y,c)).map(c=>c.id),[],where+' clear');
     if(previous!==null)assert.ok(Math.abs(y-previous)<=.24,where+' continuous floor');previous=y;
    }
   }
  }
  // Relocated blocks and town-hall entrances must belong to the same walkable component.
  const minX=-40,minZ=18,cell=.5,nx=191,nz=125,cache=new Map();
  const sample=(i,j)=>{
   const key=j*nx+i;if(cache.has(key))return cache.get(key);
   const x=minX+i*cell,z=minZ+j*cell,y=groundHeight(x,z),v={x,z,y,blocked:!routeAt(x,z,.32)||world.colliders.some(c=>standingHitsRect(x,z,.32,y,c))};cache.set(key,v);return v;
  };
  const start=[Math.round((1.9-minX)/cell),Math.round((18.5-minZ)/cell)],queue=[start],seen=new Set([start[1]*nx+start[0]]);
  for(let at=0;at<queue.length;at++){
   const [i,j]=queue[at],a=sample(i,j);
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ii=i+di,jj=j+dj,key=jj*nx+ii;if(ii<0||jj<0||ii>=nx||jj>=nz||seen.has(key))continue;
    const b=sample(ii,jj);if(b.blocked||Math.abs(b.y-a.y)>.24)continue;
    const x=(a.x+b.x)/2,z=(a.z+b.z)/2,y=groundHeight(x,z);if(!routeAt(x,z,.32)||world.colliders.some(c=>standingHitsRect(x,z,.32,y,c)))continue;
    seen.add(key);queue.push([ii,jj]);
   }
  }
  const targets=[...KITAHAMA.plots.map(p=>({id:p.id,point:plotGate(p).door})),{id:'town hall',point:[SCHOOL.genkan.x,SCHOOL.building.minZ-1.4]},{id:'power house',point:SCHOOL.powerHouse.door}];
  for(const {id,point:[x,z]} of targets){
   assert.deepEqual(world.colliders.filter(c=>standingHitsRect(x,z,.32,groundHeight(x,z),c)).map(c=>c.id),[],id+' doorway clear');
   assert.ok(queue.some(([i,j])=>Math.hypot(minX+i*cell-x,minZ+j*cell-z)<.7),id+' reachable from Main Street');
  }
  assert.deepEqual(KITAHAMA.plots.map(p=>p.id).sort(),['kitahama-1','kitahama-2','kitahama-3','kitahama-8'].sort(),'only occupied houses remain on the compact blocks (4, 5 and 6 went in phase 4)');
  assert.ok(SCHOOL.seawall.south<46,'the oversized former school grounds are shortened');
  assert.equal(routeAt(-26,-62,.32),null,'the obsolete seaward platform no longer admits walking');
  for(let z=-46.2;z>=-55.4;z-=.1){const x=-37.35,y=groundHeight(x,z);assert.ok(routeAt(x,z,.32),'Fujita boardwalk ground');assert.deepEqual(world.colliders.filter(c=>standingHitsRect(x,z,.32,y,c)).map(c=>c.id),[],'Fujita boardwalk clear');}

 }finally{setWalkSurface(null);}
});
