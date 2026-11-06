import test from 'node:test';
import assert from 'node:assert/strict';
import {OPENINGS,chooseOpening,recoverSakuraBenchCheckpoint} from '../src/world/openings.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('the game always starts at the docks, and shows every dock sight once before any again',()=>{
 const storage=memory(),docks=OPENINGS.filter(o=>o.docks);
 assert.ok(docks.length>=7,'at least seven sights at the docks');
 for(const minutes of [480,600,1140]){
  const context={ferryAlongside:true},fits=new Set(docks.filter(o=>(o.open?o.open(minutes):true)&&(!o.when||o.when(context))&&(o.hours?((minutes-o.hours[0]+1440)%1440)<o.hours[1]-o.hours[0]:true)).map(o=>o.id));
  let last=null;
  for(let round=0;round<3;round++){
   const seen=new Set();
   for(let i=0;i<fits.size;i++){
    const o=chooseOpening({minutes,storage,context,random:()=>((i*0.37+round*.11)%1)});
    assert.ok(o.docks,o.id+' is not at the docks');assert.ok(fits.has(o.id),o.id+' does not fit '+minutes);
    assert.ok(!seen.has(o.id),o.id+' again before every sight was seen');assert.notEqual(o.id,last,'the same sight twice running');
    seen.add(o.id);last=o.id;
   }
  }
 }
});
test('each sight only while it is there to be seen',()=>{
 const ids=(minutes,context={ferryAlongside:true})=>{const out=new Set();for(let i=0;i<60;i++)out.add(chooseOpening({minutes,storage:memory(),context,random:()=>i/60}).id);return out;};
 assert.ok(ids(480).has('cargo-boat'),'the cargo boat is alongside at eight');assert.ok(!ids(600).has('cargo-boat'),'the cargo boat is at sea at ten');
 assert.ok(!ids(600,{ferryAlongside:false}).has('minato-maru'),'the Minato Maru is not alongside');
 // In the small hours there is still more than one sight, and none of them anywhere but the docks.
 const night=ids(150);assert.ok(night.size>=3);for(const id of night)assert.ok(OPENINGS.find(o=>o.id===id).docks);
 // Rain does not move him off the docks.
 for(let i=0;i<20;i++)assert.ok(chooseOpening({minutes:600,rain:true,storage:memory(),random:()=>i/20}).docks);
});
test('an opening can be asked for by name, and every one says where you are',()=>{
 for(const o of OPENINGS){
  assert.equal(chooseOpening({force:o.id,storage:memory()}).id,o.id);
  assert.ok(o.caption&&(o.seat||o.stand||o.room),o.id+' has a place and a caption');
 }
 // Old audit/bookmark URLs must not sit him on the deleted bench or fall through to a random start.
 const retired=chooseOpening({force:'sakura-bench',storage:memory()});
 assert.equal(retired.id,'fish-auction');assert.deepEqual(retired.stand,[19.8,-40]);assert.equal(retired.seat,undefined);
});

test('only checkpoints in the retired bench footprint recover to the harbour',()=>{
 const yaw=Math.atan2(14.05,-5.2),c=Math.cos(yaw),s=Math.sin(yaw);
 const point=(x,z)=>({x:6.6+x*c+z*s,z:-32-x*s+z*c,yaw,pitch:-.08});
 // Both seated slots and the earlier centre-seat opening were saved by Linux.
 for(const x of [-.36,0,.36]){
  const saved=point(x,-.08),copy={...saved},recovered=recoverSakuraBenchCheckpoint(saved);
  assert.deepEqual(recovered,{...saved,x:19.8,z:-40,yaw:-1.03});assert.deepEqual(saved,copy);
  assert.equal(recoverSakuraBenchCheckpoint(recovered),recovered,'Recovery is idempotent');
 }
 for(const saved of [point(0,-1.45),point(.91,-.025),point(0,.31),point(0,-.36),{...point(0,-.08),atHome:true},{...point(0,-.08),ship:true},{...point(0,-.08),room:'office'},null,{}])
  assert.equal(recoverSakuraBenchCheckpoint(saved),saved,'Unrelated positions and coordinate frames stay unchanged');
});

test('every dock sight stands him on the docks, clear of everything, facing what it names',async()=>{
 const THREE=await import('../vendor/three.module.js');const {installDOM}=await import('./fixtures.mjs');installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
 const {routeAt,groundHeight}=await import('../src/world/layout.js');const {standingHitsRect}=await import('../physics.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 // What each looks at: a point on it.
 const LOOKS={ferry:[6.9,-46.7],'minato-maru':[-8.64,-66],pier:[34,-106],'cargo-boat':[6.9,-60],'fish-auction':[25.5,-43.4],houseboat:[-40.5,-56.5],'fishing-boat':[16.65,-51.6],'landing-sign':[270,-290]};
 for(const o of OPENINGS.filter(o=>o.docks)){
  const [x,z]=o.stand,y=groundHeight(x,z);
  assert.ok(routeAt(x,z,.28),o.id+' is not on walkable ground');
  assert.ok(!world.colliders.some(c=>!c.moving&&standingHitsRect(x,z,.28,y,c)),o.id+' stands him in something');
  const [lx,lz]=LOOKS[o.id],to=Math.atan2(-(lx-x),-(lz-z)),off=Math.abs(Math.atan2(Math.sin(to-o.facing),Math.cos(to-o.facing)));
  assert.ok(off<.45,`${o.id} faces ${(off*180/Math.PI).toFixed(0)}° off what it names`);
 }
});
