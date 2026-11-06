import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createWalkingRoute} from '../src/navigation/walking-route.js';
import {createColliderGrid} from '../src/world/collider-grid.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {groundHeight,planHeight,routeAt,setWalkSurface} from '../src/world/layout.js';
import {standingHitsRect,canStepBetween} from '../physics.js';
import {MAIN_ROAD,SHOP_CROSSING_Z} from '../src/world/main-road.js';
import {ONSEN_APPROACH,ONSEN_DOOR} from '../src/world/onsen-layout.js';
import {SAKURA_FLOWER_STAND} from '../src/world/okinawa/old-town.js';
import {HARBOUR_PARK_ENTRY,NAKAMURA_DESSERTS,HARBOUR_PARK_PATHS} from '../src/world/harbour-park-plan.js';
import {KOBAN} from '../src/world/koban-layout.js';
import {KITAHAMA,plotGate} from '../src/world/kitahama-layout.js';
import {NISHI} from '../src/world/okinawa/layout.js';

installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const sites=createBusinesses(),world=createTown({scene:new THREE.Scene(),sites,townMode:'peninsula',kitano:'distant',mobile:false,shadows:false,
 register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const surface=createWalkSurface({minX:-50,maxX:75,minZ:-75,maxZ:110,base:planHeight});
surface.add(world.group);setWalkSurface(surface);world.group.updateMatrixWorld(true);
const grid=createColliderGrid(world.colliders);grid.refresh();
const R=.28,market=sites.find(s=>s.id==='market'),start={x:market.approachPosition[0],z:market.approachPosition[2]};
const inRoad=p=>p.x>MAIN_ROAD.west&&p.x<MAIN_ROAD.east&&p.z>MAIN_ROAD.minZ&&p.z<MAIN_ROAD.maxZ;
function physical(x,z){
 const y=groundHeight(x,z);
 return {y,blocked:!routeAt(x,z,R)||grid.some(x,z,R,c=>!c.moving&&(!c.only||c.only==='player')&&standingHitsRect(x,z,R,y,c))};
}
function sample(x,z){
 const s=physical(x,z),crossing=Math.min(Math.abs(z+18),Math.abs(z-SHOP_CROSSING_Z))<1.25;
 return {...s,blocked:s.blocked||inRoad({x,z})&&!crossing&&!(inRoad(start)&&Math.hypot(x-start.x,z-start.z)<5.5)};
}
function walk(path,label,probe=sample){
 let feet=path[0];assert.ok(feet,label+' has a route');assert.equal(probe(feet.x,feet.z).blocked,false,label+' starting position');
 for(const b of path.slice(1)){
  const a={...feet},count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.04));
  for(let i=1;i<=count;i++){
   const x=a.x+(b.x-a.x)*i/count,z=a.z+(b.z-a.z)*i/count;
   for(const next of [{x,z:feet.z},{x,z}]){
    const s=probe(next.x,next.z);
    assert.equal(s.blocked,false,`${label}: blocked component step at ${next.x},${next.z}`);
    assert.ok(canStepBetween(feet.y,s.y),`${label}: height step at ${next.x},${next.z}`);
    feet={...next,y:s.y};
   }
  }
 }
}

test('actual Minato collision and drawn floors carry Sakura walks to the consolidated services and homes',()=>{
 const destinations=[['Harbour Park',HARBOUR_PARK_ENTRY],['Onsen approach',ONSEN_APPROACH],['Onsen door',ONSEN_DOOR],['Koban',KOBAN.door],
  ['Higa Liquor',[4.8,8.75]],['Sakura flowers',SAKURA_FLOWER_STAND],['Nakamura',NAKAMURA_DESSERTS.approach],
  // The houses that stand (phase 4 took 4, 5 and 6 Kitahama and the Kinjō and Ōshiro houses), and the lane through the
  // cleared Nishi ground to the Front-Row yard, which stays the way to Tetsuo's door.
  ...['kitahama-1','kitahama-3','kitahama-8'].map(id=>[id,plotGate(KITAHAMA.plots.find(p=>p.id===id)).door]),
  ...['higa'].map(id=>['Nishi '+id,plotGate(NISHI.plots.find(p=>p.id===id)).door]),['Nishi lane to the yard',[-30.85,1.5]],['Nishi cleared ground',[-30.85,-5.7]]];
 for(const [label,p] of destinations){
  const goal={x:p[0],z:p[1]},route=createWalkingRoute({start,goal,sample,margin:18,maxVisited:40000});
  let turns=0;while(route.status==='searching'&&turns++<20000)route.step(600);
  assert.equal(route.status,'found',`${label}: ${route.reason}`);
  assert.equal(route.reason,'goal-reached',label+' reaches its actual entrance');
  const end=route.path.at(-1);assert.ok(Math.hypot(end.x-goal.x,end.z-goal.z)<1e-7,label+' exact endpoint');
  walk(route.path,label);
 }
});

test('park entrance, onsen and quay corridors keep their centres and half-metre side clearances',()=>{
 for(const r of HARBOUR_PARK_PATHS.filter(r=>['park-approach','garden-onsen-approach','garden-quay-walk'].includes(r.id))){
  for(const offset of [0,-.5,.5])for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/length,nz=(b[0]-a[0])/length;
   const p={x:a[0]+nx*offset,z:a[1]+nz*offset},q={x:b[0]+nx*offset,z:b[1]+nz*offset};p.y=groundHeight(p.x,p.z);q.y=groundHeight(q.x,q.z);
   walk([p,q],`${r.id} offset ${offset}`,physical);
  }
 }
});

test('the onsen’s entire final approach has visible floor at the walking height',()=>{
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 for(const z of [ONSEN_APPROACH[1]-.5,ONSEN_APPROACH[1],ONSEN_APPROACH[1]+.5]){
  for(let x=ONSEN_APPROACH[0];x<=ONSEN_DOOR[0]+1e-7;x+=.2){
   const y=groundHeight(x,z);ray.set(new THREE.Vector3(x,y+.3,z),down);
   const hit=ray.intersectObject(world.group,true).find(h=>h.point.y<=y+.1);
   assert.ok(hit,`drawn onsen approach at ${x},${z}`);
   assert.ok(Math.abs(hit.point.y-y)<.03,`feet agree with the visible floor at ${x},${z}`);
  }
 }
});

test('the original Koban tree-strip walk remains open in the complete world',()=>{
 walk([{x:12,z:22.5,y:groundHeight(12,22.5)},{x:12,z:24,y:groundHeight(12,24)}],'Koban tree gap',physical);
});
