import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CAST} from '../src/people/cast.js';
import {RESIDENTS,WORLD_CAST} from '../src/people/residents.js';
import {residentPlan} from '../src/people/social.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {BOILER_DUTY,boilerDutyAt} from '../src/people/onsen-boiler.js';
import {ONSEN_BOILER,ONSEN_DOOR,onsenPoint} from '../src/world/onsen-layout.js';
import {standingHitsRect,townBoundsBlocked} from '../physics.js';
import {HARBOUR_PARK_BEDS,PARK_PLANTS} from '../src/world/harbour-park-garden.js';
const BODY=.3;   // a walker's radius (schedules.js, physics.js)
/** Is (x, z) on a bed's earth, or within `pad` of it? */
const onBed=(x,z,pad=0)=>HARBOUR_PARK_BEDS.find(b=>x>b.bounds.minX-pad&&x<b.bounds.maxX+pad&&z>b.bounds.minZ-pad&&z<b.bounds.maxZ+pad)||null;

// Umi-no-yu's boiler (world/onsen-layout.js ONSEN_BOILER, people/onsen-boiler.js). Tetsuo's cast.js day has him at the
// onsen for the boiler at 18:00 and from 20:00, and the yuntaku bench's reason sends him "back up to the boiler at
// eight"; his walking body used to go to Minato or Sakura at six and home at eight, because the onsen's place is the bath,
// entered in swimwear. The coordinator's ask of 27 November 2026: his body goes where his day says, to a boiler-room spot
// at the back of the bathhouse, never the bath, and works there.
const tetsuo=RESIDENTS.find(p=>p.name==='Tetsuo');
const DAY=1440,ordinary=d=>d*DAY;   // 1 January 1970 onwards: no happening names him on these days
const clock=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};

test('the boiler hours are the cast day’s own rows, and only Tetsuo has them',()=>{
 const rows=CAST.find(p=>p.name==='Tetsuo').day.map(([t,place,activity])=>({from:clock(t),place,activity}));
 const boiler=rows.filter(r=>r.place==='onsen'&&/boiler/.test(r.activity));
 assert.equal(boiler.length,2,'two rows of his day are the boiler');
 assert.deepEqual(BOILER_DUTY.Tetsuo.map(s=>[s.from,s.to]),[[1080,1110],[1200,1350]],'six to half past six, eight to half past ten');
 for(const s of BOILER_DUTY.Tetsuo)assert.equal(rows[rows.findIndex(r=>r.from===s.from)+1].from,s.to,'each until the next row of his day');
 assert.deepEqual(Object.keys(BOILER_DUTY),['Tetsuo']);
 assert.equal(boilerDutyAt('Christina',1090),null);assert.equal(boilerDutyAt('Tetsuo',1110),null);assert.equal(boilerDutyAt('Tetsuo',1350),null);
});

test('his walking body is at the boiler at those times, on the lawn facing it, and never sent into the bath',()=>{
 for(let d=0;d<7;d++){
  for(const m of [1080,1095,1109,1200,1260,1349]){
   const plan=residentPlan(tetsuo,ordinary(d)+m,false,{});
   assert.equal(plan.place,'onsen-boiler','day '+d+' '+m);assert.deepEqual(plan.target,[...ONSEN_BOILER.stand]);
   assert.equal(plan.stand.pose,'Interact');assert.match(plan.activity,/boiler/);
   // and it is raining or not: the boiler is his work
   assert.equal(residentPlan(tetsuo,ordinary(d)+m,true,{}).place,'onsen-boiler','in the rain too');
  }
  assert.equal(residentPlan(tetsuo,ordinary(d)+1125,false,{}).place,'higa-bench','the bench between, half past six to eight');
  assert.equal(residentPlan(tetsuo,ordinary(d)+1355,false,{}).place,'home','home at half past ten');
  for(let m=0;m<DAY;m+=5)for(const rain of [false,true])assert.notEqual(residentPlan(tetsuo,ordinary(d)+m,rain,{}).place,'onsen','never the bath, never in swimwear: '+m);
 }
 // The story's view of his day says the same (canonical-day.js).
 assert.equal(canonicalDay('Tetsuo',1090).place,'onsen-boiler');assert.equal(canonicalDay('Tetsuo',1250).place,'onsen-boiler');
 // The eisa on the last night of Obon (19:30-21:30) is where its news says he was (happenings.js), as with the bench.
 const obon=Date.UTC(2026,7,17)/60000;
 assert.equal(residentPlan(tetsuo,obon+1230,false,{}).happening,'eisa');assert.equal(residentPlan(tetsuo,obon+1300,false,{}).place,'onsen-boiler','back to the boiler after the drums');
});

test('the boiler stands at the back corner of the bathhouse, off the wall, with a clear place to work it',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');const {createIslandBusinesses}=await import('../src/world/businesses.js');
 const prompts=[],actions=[];
 const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:false,shadows:false,register:(o,label,fn)=>prompts.push({o,label,fn}),enter(){},onAction:(...a)=>actions.push(a),getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 const box=name=>{const o=world.group.getObjectByName(name);assert.ok(o,name);return new THREE.Box3().setFromObject(o);};
 const heater=box('Umi-no-yu boiler and oil tank'),flue=box('Umi-no-yu boiler flue and pipes');assert.equal(world.group.getObjectByName('Umi-no-yu boiler pad'),undefined,'no slab of its own (ground-standard.js)');
 // Outside the bathhouse's and the bath's walls (park-onsen colliders), at its corner with the bath's fence, on the park side.
 const solid=world.colliders.find(c=>c.id==='onsen-boiler');assert.ok(solid);
 const walls=world.colliders.filter(c=>c.id==='park-onsen');
 const overlap=(a,b)=>Math.min(a.x+a.w/2,b.x+b.w/2)-Math.max(a.x-a.w/2,b.x-b.w/2)>1e-6&&Math.min(a.z+a.d/2,b.z+b.d/2)-Math.max(a.z-a.d/2,b.z-b.d/2)>1e-6;
 assert.equal(walls.some(w=>overlap(w,solid)),false,'outside the walls, not in the bath');
 const [cx,cz]=onsenPoint(-3.8,-.2);assert.ok(Math.hypot(solid.x+solid.w/2-cx,solid.z+solid.d/2-cz)<.4,'at the corner where the bathhouse meets the bath’s fence');
 assert.ok(Math.hypot(ONSEN_DOOR[0]-solid.x,ONSEN_DOOR[1]-solid.z)>4,'away from the street door');
 // It stands on the garden's ground, 3 mm over it (the ground there is at 0, ground-standard.js), never in it.
 const {groundHeight:ground}=await import('../src/world/layout.js');const [ux,uz]=onsenPoint((ONSEN_BOILER.unit.x0+ONSEN_BOILER.unit.x1)/2,(ONSEN_BOILER.unit.z0+ONSEN_BOILER.unit.z1)/2);
 assert.ok(Math.abs(heater.min.y-ground(ux,uz)-ONSEN_BOILER.unit.foot)<1e-6,'the heater on the ground');
 assert.ok(flue.max.y>2.4&&flue.max.y<3.3,'the flue up the wall to its cap, under the eaves');
 // Its place to work it: clear of every solid, on the town's walkable ground, facing the heater a step away.
 const [sx,sz]=ONSEN_BOILER.stand;
 assert.equal(world.colliders.some(c=>standingHitsRect(sx,sz,.3,0,c)),false,'room to stand');
 // On the lawn, not in a bed's earth, and clear of every plant by the plant's reach and his body (the coordinator's
 // photographs of 27 November 2026: the first stand point was inside the gettō screen and one of its plants).
 assert.equal(onBed(sx,sz,BODY)?.id,undefined,'his feet are on the lawn, off every bed');
 for(const bed of HARBOUR_PARK_BEDS)for(const [kind,x,z] of bed.plants)
  assert.ok(Math.hypot(sx-x,sz-z)>=PARK_PLANTS[kind].reach+BODY,`clear of the ${kind} at ${x}, ${z} in ${bed.id}`);
 // and the heater and its tank are not behind a bed's plants: the lawn in front of them, out to where he stands, is open.
 for(const bed of HARBOUR_PARK_BEDS){const b=bed.bounds,[x0,x1]=[solid.x-solid.w/2,solid.x+solid.w/2];
  assert.ok(!(b.maxX>x0&&b.minX<x1&&b.maxZ>sz-BODY&&b.minZ<solid.z+solid.d/2),bed.id+' is not between the boiler and the lawn');}
 assert.equal(townBoundsBlocked(sx,sz,.3),false,'on the town’s ground');
 const front=solid.z-solid.d/2,gap=front-sz;assert.ok(gap>.3&&gap<.7,'a step from the heater: '+gap.toFixed(2));
 const yaw=boilerDutyAt('Tetsuo',1090).stand.yaw;assert.ok(Math.abs(Math.cos(yaw)+1)<1e-9,'facing it (the town’s +z)');
 // You can look at it, and it says whose and why.
 const look=prompts.find(p=>p.label==='Look at the bath’s boiler');assert.ok(look);look.fn();
 assert.match(actions.at(-1)[2],/Tetsuo/);assert.match(actions.at(-1)[2],/kerosene/);

 // He walks there from the yuntaku bench and from his workshop, and works it: on the spot, facing it, in his clothes.
 const {createColliderGrid}=await import('../src/world/collider-grid.js');const {createWalkSurface}=await import('../src/world/walk-surface.js');
 const {groundHeight,planHeight,setWalkSurface}=await import('../src/world/layout.js');const {createCastAI}=await import('../src/people/schedules.js');
 const surface=createWalkSurface({minX:-45,maxX:50,minZ:-78,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 try{
  const grid=createColliderGrid(world.colliders),blocked=(x,z,r)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
  const profile=WORLD_CAST.find(p=>p.name==='Tetsuo');
  for(const [from,minute] of [[[4.72,9.2],1200],[profile.work,1080]]){
   const parent=new THREE.Group();parent.visible=false;const g=new THREE.Group();g.userData={name:'Tetsuo',hit:{inside:false}};parent.add(g);
   const person={g,profile},state={inventory:[],residentLocations:{Tetsuo:{position:from,indoors:null}}};
   g.position.set(from[0],groundHeight(from[0],from[1]),from[1]);
   const ai=createCastAI({world:{people:[person],homes:new Map()},player:new THREE.Vector3(100,0,100),state:()=>state,paused:()=>false,collides:blocked});
   let arrived=false;const crossed=new Set();
   for(let i=0;i<9000&&!arrived;i++){ai.update(.1,minute,false);arrived=g.userData.standPose&&Math.hypot(g.position.x-sx,g.position.z-sz)<.2;
    const bed=onBed(g.position.x,g.position.z,.15);if(bed)crossed.add(bed.id);}
   assert.deepEqual([...crossed],[],'his walk to the boiler crosses no bed');
   assert.ok(arrived,'Tetsuo works the boiler from '+from+'; at '+g.position.toArray().map(v=>v.toFixed(2)));
   assert.equal(g.userData.socialPose,'Interact');assert.ok(!g.userData.indoors&&!g.userData.inOnsen,'outdoors, not in the bath');
   assert.ok(Math.abs(Math.atan2(Math.sin(g.rotation.y-yaw),Math.cos(g.rotation.y-yaw)))<.06,'facing the heater');
  }
 }finally{setWalkSurface(null);}
});
