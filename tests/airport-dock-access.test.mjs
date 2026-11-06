import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {TROPIC_TRAILS} from '../src/world/tropical-island.js';
import {installDOM} from './fixtures.mjs';
import {COAST_BOUNDS} from '../src/world/island-coast.js';
import {AIRPORT_LANDING,AIRPORT_COUNTER,airportWorld} from '../src/world/airport-ground.js';
import {FERRY_TERMINAL} from '../src/world/ferry.js';
import {AIRPORT_FERRY_PORTS} from '../src/world/airport-ferry.js';
import {planHeight,groundHeight,setWalkSurface} from '../src/world/layout.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {createNavigation} from '../src/people/navmesh.js';
import {townBoundsBlocked,standingHitsRect,canStepBetween} from '../physics.js';

test('both ferry landings have real, unobstructed walking routes to their passenger facilities',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.ferry.parkAt?.('town');
 // Match the game's actual sampling extent, including the airport's independent
 // plan-height grounding beyond the main island's terrain raster.
 const surface=createWalkSurface({minX:COAST_BOUNDS.minX-2,maxX:COAST_BOUNDS.maxX+2,minZ:COAST_BOUNDS.minZ-2,maxZ:COAST_BOUNDS.maxZ+2,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const bins=new Map(),cell=4;
 function refreshCollisions(){bins.clear();for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.5;for(let x=Math.floor((c.x-reach)/cell);x<=Math.floor((c.x+reach)/cell);x++)for(let z=Math.floor((c.z-reach)/cell);z<=Math.floor((c.z+reach)/cell);z++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(c);}}}
 refreshCollisions();
 const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||(bins.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]).some(c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
 world.group.updateMatrixWorld(true);
 const floors=[];world.group.traverse(o=>{
  if(!o.isMesh||o.material?.transparent)return;
  for(let p=o;p;p=p.parent)if(!p.visible||p===world.ferry.ferry||p.userData.dynamicProp)return;
  floors.push({mesh:o,bounds:new THREE.Box3().setFromObject(o)});
 });
 const ray=new THREE.Raycaster();
 function walk(points,label,exactFloor=false){
  let [x,z]=points[0];
  for(const [tx,tz] of points.slice(1)){
   const sx=x,sz=z,n=Math.ceil(Math.hypot(tx-x,tz-z)/.04);
   for(let k=1;k<=n;k++)for(const [px,pz] of [[sx+(tx-sx)*k/n,z],[sx+(tx-sx)*k/n,sz+(tz-sz)*k/n]]){
    const y=groundHeight(px,pz);assert.ok(canStepBetween(groundHeight(x,z),y),label+' floor cliff at '+[px,pz]);
    assert.equal(blocked(px,pz),false,label+' obstruction at '+[px,pz]);
    if(k%5===0||k===n){
     ray.set(new THREE.Vector3(px,y+.24,pz),new THREE.Vector3(0,-1,0));
     const candidates=floors.filter(({bounds:b})=>px>=b.min.x&&px<=b.max.x&&pz>=b.min.z&&pz<=b.max.z&&b.min.y<=y+.2&&b.max.y>=y-.06).map(o=>o.mesh);
     const support=ray.intersectObjects(candidates,false).find(hit=>hit.point.y>=y-.06&&hit.point.y<=y+.2);
     assert.ok(support,label+' has no drawn floor at '+[px,pz]);
     if(exactFloor)assert.ok(Math.abs(support.point.y-y)<.002,label+' feet differ from the visible '+support.object.name+' by '+(support.point.y-y)+'m at '+[px,pz]);
    }
    x=px;z=pz;
   }
  }
 }
 try{
  const nav=createNavigation(blocked,{step:.35,radius:.32,bounds:{minX:-10,maxX:10,minZ:-80,maxZ:-34}});
  for(const target of [FERRY_TERMINAL.queue,AIRPORT_FERRY_PORTS.town.landing]){
   const route=nav.path({x:0,z:-36},{x:target[0],z:target[1]});
   assert.ok(route.length,'Main Street reaches the Minato boarding point');
   assert.ok(Math.hypot(route.at(-1)[0]-target[0],route.at(-1)[1]-target[1])<.05);
   walk(route,'Minato street to ferry');walk([...route].reverse(),'Minato ferry to street');
  }
  world.ferry.parkAt('airport');refreshCollisions();
  const airport=[airportWorld(-54.8,31),AIRPORT_LANDING,airportWorld(-40,31),airportWorld(-40,18.7),AIRPORT_COUNTER];
  walk(airport,'Kitano-jima pier to check-in',true);walk([...airport].reverse(),'Kitano-jima check-in to pier',true);
  walk([airportWorld(-51,31.5),airportWorld(-16,31.5)],'Airport cargo aisle',true);
  // The island's trail: plaza to Coral Bay, up through the jungle to the lookout, down to Turtle Cove.
  const plaza=airportWorld(-4,30);
  for(const trail of TROPIC_TRAILS){const route=trail.map(p=>airportWorld(...p));walk(route,'Kitano-jima trail',true);walk([...route].reverse(),'Kitano-jima trail back',true);}
  walk([AIRPORT_COUNTER,plaza,airportWorld(...TROPIC_TRAILS[0][0])],'Check-in to the trail',true);
  // All public slab levels, their intersections, the beach, the hillside and the lookout deck.
  for(const [u,v] of [[-40,37],[-40,22],[-54.5,32],[-10,18.7],[-40,20.1],[-40,20.9],[0,30],[30,25],[-13,76],[30,56],[54,68],[88,64],[-30,60],[60,95]]){
   const p=airportWorld(u,v),y=groundHeight(...p);ray.set(new THREE.Vector3(p[0],y+.24,p[1]),new THREE.Vector3(0,-1,0));
   const candidates=floors.filter(({bounds:b})=>p[0]>=b.min.x&&p[0]<=b.max.x&&p[1]>=b.min.z&&p[1]<=b.max.z&&b.min.y<=y+.2&&b.max.y>=y-.06).map(o=>o.mesh);
   const top=ray.intersectObjects(candidates,false).find(hit=>hit.point.y>=y-.06&&hit.point.y<=y+.2);
   assert.ok(top,'Missing public floor at local '+[u,v]);assert.ok(Math.abs(top.point.y-y)<.002,'Public floor mismatch at local '+[u,v]+' on '+top.object.name);
  }
 }finally{setWalkSurface(null);}
});
