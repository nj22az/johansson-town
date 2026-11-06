import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {STAFF_BENCH,buildStaffBench} from '../src/world/staff-bench.js';
import {createStaffBenchRoutine} from '../src/people/staff-bench-routine.js';
import {createCastAI} from '../src/people/schedules.js';
import {RESIDENTS} from '../src/people/residents.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {circleHitsRect,townBoundsBlocked} from '../physics.js';
import {createPropFactory} from '../prop-factory.js';
import {createTownActivities} from '../src/people/town-activities.js';
import {createSakuraShop} from '../src/people/sakura-shop.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';

function fixture(){
 const entity=new T.Group(),seat=new T.Object3D();entity.userData.name='Thuan';entity.position.set(STAFF_BENCH.stand[0],0,STAFF_BENCH.stand[1]);
 const routine=createStaffBenchRoutine({entity,seat});return {entity,seat,routine};
}
test('the bench, seat and standing point face west, away from the shop wall',()=>{
 const front=new T.Vector3(0,0,-1).applyAxisAngle(new T.Vector3(0,1,0),STAFF_BENCH.yaw);
 assert.ok(front.x<-.99);assert.ok(STAFF_BENCH.stand[0]<STAFF_BENCH.seat[0]);
 const parent=new T.Group(),colliders=[];
 const built=buildStaffBench({parent,colliders,factory:{bench(x,z,yaw){const object=new T.Group();object.position.set(x,0,z);object.rotation.y=yaw;return {object,collider:{w:1.95,d:.78}};}}});
 assert.equal(built.group.rotation.y,STAFF_BENCH.yaw);assert.equal(built.seat.userData.seat.yaw,STAFF_BENCH.yaw);assert.equal(colliders[0].w,.78);assert.equal(built.seat.userData.npcInteraction,false);
});
test('the full break is continuous, reserved, and ends clear of the bench',()=>{
 const {entity,seat,routine}=fixture(),phases=new Set();
 for(let frame=0;frame<30*60;frame++){
  const before=entity.position.clone(),yaw=entity.rotation.y;routine.update(1/60,frame<20*60);phases.add(routine.phase);
  assert.ok(entity.position.distanceTo(before)<.02,'No teleport onto or out of the seat');
  assert.ok(Math.abs(Math.atan2(Math.sin(entity.rotation.y-yaw),Math.cos(entity.rotation.y-yaw)))<=2.6/60+1e-8);
  if(routine.active)assert.equal(seat.userData.reservedBy,'Thuan');
 }
 for(const phase of ['approach','turn','sit','rest','sleep','wake','stand','leave','idle'])assert.ok(phases.has(phase),phase);
 assert.ok(Math.hypot(entity.position.x-STAFF_BENCH.stand[0],entity.position.z-STAFF_BENCH.stand[1])<.01);
 for(const key of ['seatHeight','chairBlend','socialPose','sleeping','napping','floorHeight','usingTownObject','staffBenchPhase'])assert.equal(entity.userData[key],undefined,key);
 assert.equal(seat.userData.reservedBy,undefined);
});
test('clock and rain interruptions at every phase still finish standing clear',()=>{
 for(const phase of ['approach','turn','sit','rest','sleep']){
  const {entity,routine}=fixture();for(let i=0;i<1500&&routine.phase!==phase;i++)routine.update(1/60,true);
  assert.equal(routine.phase,phase);
  for(let i=0;i<1000&&routine.active;i++)routine.update(1/60,false);
  assert.equal(routine.active,false,phase);assert.ok(Math.abs(entity.position.x-STAFF_BENCH.stand[0])<.01);assert.equal(entity.userData.seatHeight,undefined);
 }
});
test('she waits when the player or another reservation occupies the seat',()=>{
 const {entity,seat}=fixture();let occupied=true;const routine=createStaffBenchRoutine({entity,seat,isOccupied:()=>occupied});
 assert.equal(routine.update(.1,true),false);occupied=false;seat.userData.reservedBy='visitor';assert.equal(routine.update(.1,true),false);
 delete seat.userData.reservedBy;assert.equal(routine.update(.1,true),true);
});
test('she reaches the clear approach before taking control of the seat',()=>{
 const {entity,seat,routine}=fixture();
 // Within the former one-metre trigger, but still beside the bench rather than in front.
 entity.position.z+=.85;
 assert.equal(routine.update(1/60,true),false);
 assert.equal(seat.userData.reservedBy,undefined);
 assert.equal(entity.userData.usingTownObject,undefined);
 entity.position.set(STAFF_BENCH.stand[0],0,STAFF_BENCH.stand[1]);
 assert.equal(routine.update(1/60,true),true);
});
test('the rendered backrest faces the shop and leaves a clear standing point in the yard',()=>{
 installDOM();const parent=new T.Group(),colliders=[];
 const {group}=buildStaffBench({parent,colliders,factory:createPropFactory({shadows:false})});
 parent.updateMatrixWorld(true);
 const back=group.children.filter(o=>o.isMesh&&o.position.y>.7);
 assert.ok(back.length>0);
 for(const rail of back)assert.ok(rail.getWorldPosition(new T.Vector3()).x>STAFF_BENCH.seat[0],'The backrest stays on the shop side');
 const bounds=new T.Box3().setFromObject(group);
 assert.ok(bounds.max.x< -19.5,'Bench clears the shop wall and its rear fittings');
 assert.equal(colliders.some(c=>circleHitsRect(...STAFF_BENCH.stand,.32,c)),false);
});
test('the real schedule wakes and clears Thuan before morning navigation resumes',()=>{
 
 try{
  const {entity,seat}=fixture(),person={g:entity,profile:RESIDENTS.find(p=>p.name==='Thuan')};
  const world={people:[person],staffBench:{seat}};
  const ai=createCastAI({world,player:new T.Group(),state:()=>({inventory:[]}),paused:()=>false,collides:()=>false});
  for(let i=0;i<1200;i++)ai.update(1/60,875,false);
  assert.equal(entity.userData.sleeping,true);
  ai.update(1/60,594,false);assert.equal(entity.userData.staffBenchPhase,'wake');assert.ok(entity.userData.seatHeight);
  for(let i=0;i<500;i++)ai.update(1/60,594,false);
  assert.equal(entity.userData.staffBenchPhase,undefined);assert.equal(entity.userData.seatHeight,undefined);assert.equal(seat.userData.reservedBy,undefined);assert.equal(entity.userData.place,'market');
 }finally{}
});

test('the complete shop controller receives Thuan back at the till after her bench break',()=>{
 installDOM();
 try{
  const scene=new T.Scene(),player=new T.Group(),targets=[],state={inventory:[],sakura:restoreSakura()};
  const register=(o,label,fn,inside=false)=>{o.userData.hit={label,fn,inside};targets.push(o);};
  let minutes=830;
  const world=createTown({scene,sites:createBusinesses(),shadows:false,register,enter(){},onAction(){},getPlayerPosition:()=>player.position});
  const thuan=world.people.find(p=>p.profile.name==='Thuan');world.cat=null;
  const blocked=(x,z,r)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>circleHitsRect(x,z,r,c));
  const ledger=createResidentLedger(()=>state);
  const activities=createTownActivities({getTargets:()=>targets,collides:blocked,getPlayerPosition:()=>player.position,ledger,getState:()=>state});
  const ai=createCastAI({world,player,state:()=>state,paused:()=>false,collides:blocked,activities});
  const shop=createSakuraShop({world,scene,state,ledger,register,action(){},exit(){},getMinutes:()=>minutes,getPlayerPosition:()=>player.position,isInside:()=>false,onBorrow:activities.release});
  const phases=new Set(),till=new T.Vector3(...SAKURA_LAYOUT.staff);let returned=false,backAtTill=false;
  for(;minutes<1000;minutes+=1/60){
   const before=thuan.g.position.clone(),parent=thuan.g.parent,yaw=thuan.g.rotation.y,chair=thuan.g.userData.chairBlend;
   ai.update(1/60,minutes,false);shop.update(1/60);world.update(1/60,minutes,1,minutes);
   const data=thuan.g.userData;
   const dx=thuan.g.position.x-before.x,dz=thuan.g.position.z-before.z,distance=Math.hypot(dx,dz);
   // Room transfers change coordinate frames; sitting shifts weight over the seat.
   // Every ordinary footstep, including the shop exit and outdoor detours, faces ahead.
   if(thuan.g.parent===parent&&distance>.0001&&distance<.1&&!Number.isFinite(chair)&&!Number.isFinite(data.chairBlend)){
    const forward=(-Math.sin(thuan.g.rotation.y)*dx-Math.cos(thuan.g.rotation.y)*dz)/distance;
    assert.ok(forward>.93,`Thuan walks forwards during ${data.activity} at ${minutes}: ${forward}`);
    const turn=Math.abs(Math.atan2(Math.sin(thuan.g.rotation.y-yaw),Math.cos(thuan.g.rotation.y-yaw)));
    assert.ok(turn<=2.6/60+1e-8,'Walking turns remain continuous');
   }
   if(data.staffBenchPhase)phases.add(data.staffBenchPhase);
   if(!data.staffBenchPhase&&!data.indoors&&!data.usingTownObject)assert.equal(blocked(thuan.g.position.x,thuan.g.position.z,.3),false);
   if(minutes>930&&data.inMarket&&data.roomTransition)returned=true;
   if(returned&&data.inMarket&&!data.staffBenchPhase&&thuan.g.position.distanceTo(till)<.12)backAtTill=true;
  }
  for(const phase of ['sit','sleep','wake','stand','leave'])assert.ok(phases.has(phase),phase);
  assert.ok(returned,'She walks in through the shop entrance');
  assert.equal(thuan.g.userData.inMarket,true);
  // She reaches the till after the break. Not necessarily still there at 16:40: her afternoon at the shop is the
  // sakura-floor stand sequence (people/stand-sequences.js, cast.js 'the afternoon till'): the till, the cold drinks, the
  // till again and the west window, and by 16:39 she is on her way to the window.
  assert.ok(backAtTill,'She reaches the till');
  assert.equal(thuan.g.userData.staffBenchPhase,undefined);
  assert.equal(thuan.g.userData.usingTownObject,undefined);
  assert.equal(world.staffBench.seat.userData.reservedBy,undefined);
 }finally{}
});

test('she walks the actual yard route, takes her break, and returns through the shop door',()=>{
 installDOM();
 try{
  const world=createTown({scene:new T.Scene(),sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new T.Vector3()});
  const thuan=world.people.find(p=>p.profile.name==='Thuan');world.people=[thuan];world.cat=null;
  const blocked=(x,z,r)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>circleHitsRect(x,z,r,c));
  const ai=createCastAI({world,player:new T.Group(),state:()=>({inventory:[]}),paused:()=>false,collides:blocked});
  ai.update(1/30,839,false);const phases=new Set();
  for(let t=840;t<980;t+=1/30){
   ai.update(1/30,t,false);if(thuan.g.userData.staffBenchPhase)phases.add(thuan.g.userData.staffBenchPhase);
   if(!thuan.g.userData.staffBenchPhase&&!thuan.g.userData.indoors)assert.equal(blocked(thuan.g.position.x,thuan.g.position.z,.3),false,'Outdoor navigation never starts inside the bench');
  }
  for(const phase of ['sit','sleep','wake','stand','leave'])assert.ok(phases.has(phase),phase);
  assert.equal(thuan.g.userData.indoors,'market');assert.equal(world.staffBench.seat.userData.reservedBy,undefined);
 }finally{}
});
