import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {COAST_BOUNDS} from '../src/world/island-coast.js';
import {MARKET_THRESHOLD,TOWN_DESTINATIONS} from '../src/world/town-grid.js';
import {RESIDENTS} from '../src/people/residents.js';
import {assignWorkplaces} from '../src/people/workplaces.js';
import {residentPlan} from '../src/people/social.js';
import {createCastAI} from '../src/people/schedules.js';
import {createNavigation} from '../src/people/navmesh.js';
import {groundHeight,planHeight,setWalkSurface} from '../src/world/layout.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {townBoundsBlocked,circleHitsRect,standingHitsRect,canStepBetween} from '../physics.js';

// (Reiko retired in phase 4 and 1 Front-Row Yard is lawn again: Nhung lives at 3 Kitahama, people/residents.js. Since
// 22 October 2026 she is the island doctor and sets the town's paper at Front-Row in the evening: place `paper`.)
test('Nhung walks from Sakura to Front-Row for the paper and home on the drawn floors',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const sites=createBusinesses(),world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});assignWorkplaces(world,sites);
 const surface=createWalkSurface({minX:COAST_BOUNDS.minX-2,maxX:COAST_BOUNDS.maxX+2,minZ:COAST_BOUNDS.minZ-2,maxZ:COAST_BOUNDS.maxZ+2,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const cells=new Map(),cell=4;
 for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.5;for(let x=Math.floor((c.x-reach)/cell);x<=Math.floor((c.x+reach)/cell);x++)for(let z=Math.floor((c.z-reach)/cell);z<=Math.floor((c.z+reach)/cell);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(c);}}
 const nearby=(x,z)=>cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
 const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||nearby(x,z).some(c=>circleHitsRect(x,z,r,c));
 const standingBlocked=(x,z)=>townBoundsBlocked(x,z,.32)||nearby(x,z).some(c=>standingHitsRect(x,z,.32,groundHeight(x,z),c));
 const floors=new Map(),ray=new THREE.Raycaster();world.group.updateMatrixWorld(true);
 world.group.traverse(o=>{
  if(!o.isMesh||o.material?.transparent)return;
  for(let p=o;p;p=p.parent)if(!p.visible||p.userData.dynamicProp)return;
  const b=new THREE.Box3().setFromObject(o);
  for(let x=Math.floor(b.min.x/cell);x<=Math.floor(b.max.x/cell);x++)for(let z=Math.floor(b.min.z/cell);z<=Math.floor(b.max.z/cell);z++){const key=x+','+z;if(!floors.has(key))floors.set(key,[]);floors.get(key).push(o);}
 });
 function checkPoint(x,z,label,drawFloor=true){
  assert.equal(blocked(x,z),false,label+' NPC capsule at '+[x,z]);
  assert.equal(standingBlocked(x,z),false,label+' standing capsule at '+[x,z]);
  if(drawFloor){const y=groundHeight(x,z),candidates=floors.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
   // BoxGeometry stores dimensions as Float32: adjacent road/footway facets can
   // leave a sub-micrometre numerical seam at their shared edge. Keep the height
   // test strict and only allow that coordinate precision at a facet boundary.
   const supported=[[0,0],[1e-6,0],[-1e-6,0],[0,1e-6],[0,-1e-6]].some(([dx,dz])=>{ray.set(new THREE.Vector3(x+dx,y+.24,z+dz),new THREE.Vector3(0,-1,0));return ray.intersectObjects(candidates,false).some(hit=>Math.abs(hit.point.y-y)<=.06);});
   assert.ok(supported,label+' drawn floor at '+[x,z]);}
 }
 function checkRoute(from,to,label){
  const nav=createNavigation(blocked,{heightAt:groundHeight}),points=nav.path({x:from[0],z:from[1]},{x:to[0],z:to[1]});
  assert.ok(points.length,label+' planned route');assert.ok(Math.hypot(points.at(-1)[0]-to[0],points.at(-1)[1]-to[1])<.001,label+' actual threshold');
  let [x,z]=from;checkPoint(x,z,label);
  for(const [tx,tz] of points){const sx=x,sz=z,n=Math.max(1,Math.ceil(Math.hypot(tx-x,tz-z)/.04));for(let k=1;k<=n;k++)for(const [px,pz] of [[sx+(tx-sx)*k/n,z],[sx+(tx-sx)*k/n,sz+(tz-sz)*k/n]]){assert.ok(canStepBetween(groundHeight(x,z),groundHeight(px,pz)),label+' floor step');checkPoint(px,pz,label,k%5===0||k===n);x=px;z=pz;}}
 }
 try{
  const books=TOWN_DESTINATIONS.books,home=RESIDENTS.find(p=>p.name==='Nhung').home;
  for(const [from,to,label] of [[MARKET_THRESHOLD,books,'Sakura to bookshop'],[books,MARKET_THRESHOLD,'Bookshop to Sakura'],[books,home,'Bookshop to shared home'],[home,books,'Shared home to bookshop']])checkRoute(from,to,label);
  // A reachable graph is insufficient: run the actual forward-facing schedule
  // controller from the saved market exit until both workers enter their shop.
  for(const name of ['Nhung']){
   const profile=world.people.find(p=>p.profile.name===name).profile;
   const minute=Array.from({length:7*1440},(_,m)=>m).find(m=>{const p=residentPlan(profile,m,false,{});return p.place==='paper'&&Math.hypot(p.target[0]-books[0],p.target[1]-books[1])<.01;});
   assert.notEqual(minute,undefined,name+' evening at the paper');
   for(const [from,indoors,clock,destination] of [[MARKET_THRESHOLD,'market',minute,books],[books,'paper',180,profile.home]]){
    const g=new THREE.Group();g.userData.name=name;
    const saved={inventory:[],residentLocations:{[name]:{position:[...from],indoors}}};
    const ai=createCastAI({world:{people:[{g,profile}]},player:new THREE.Group(),state:()=>saved,paused:()=>false,collides:blocked});
    ai.update(0,clock,false);
    let arrived=false,last=g.position.clone();
    for(let frame=0;frame<180*60;frame++){
     ai.update(1/60,clock,false);
     assert.ok(Math.hypot(g.position.x-last.x,g.position.z-last.z)<=1.25/60+.00001,name+' continuous outdoor step');
     assert.ok(canStepBetween(last.y,g.position.y),name+' scheduled floor step');
     checkPoint(g.position.x,g.position.z,name+' scheduled return',frame%60===0);
     last.copy(g.position);
     if(g.userData.indoors&&g.userData.indoors!==indoors){arrived=true;break;}
    }
    assert.ok(arrived,name+' completes the return to '+destination+' from '+from);
    assert.ok(Math.hypot(g.position.x-destination[0],g.position.z-destination[1])<.85,name+' enters the real door');
   }
  }
 }finally{setWalkSurface(null);}
});
