import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {createBeerService,serviceFor,createDishProp,createDrinkProp,DISHES,IZAKAYA_PLAYER_SEATS,NAO_STATION}=await import('../src/people/izakaya-beer.js');
const {MINATO_FOOD,foodSolids}=await import('../src/people/izakaya-food.js');
const {buildMinatoBar,MINATO_BAR}=await import('../src/world/interiors/minato-bar.js');
const {SHARED_DINING_COLLIDERS,SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR}=await import('../src/world/interiors/shared-dining-layout.js');
const {separateBodies}=await import('../src/people/body-collision.js');
const {standingHitsRect}=await import('../physics.js');
const {suppliedRoomBoundsBlocked}=await import('../src/world/supplied-rooms.js');
const {createAvatarActor,updateAvatarActor}=await import('../src/avatars/actors.js');
const {createVenueService}=await import('../src/people/venue-service.js');
const {createResidentLedger,restoreResidentLife}=await import('../src/people/resident-personalities.js');
const layout={bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR};
const blocked=(x,z,r)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>standingHitsRect(x,z,r,0,c));
blocked.closeUp=(x,z,r)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>c.id==='minato-stool'?Math.hypot(x-c.x,z-c.z)<.195+r:standingHitsRect(x,z,r,0,c));
function fixture(){const room=new THREE.Group(),thao=new THREE.Group();room.add(thao);thao.position.set(...NAO_STATION);thao.rotation.y=Math.PI;thao.userData.inIzakaya=true;
 const bar=buildMinatoBar(room),service=createBeerService({room,getNao:()=>thao,bar,blocked});return {room,thao,service};}
function run(f,each=()=>{},seconds=180){for(let i=0;i<seconds*30&&f.service.working;i++){f.service.update(1/30);each(i);}}
for(const kind of [...Object.keys(DISHES),'rice'])test(kind+' is prepared, plated, collected and delivered with real hand contact',()=>{
 const f=fixture(),actor=createAvatarActor(f.thao,'Thao'),steps=new Set(),bad=[],gaps=[];let picked=null,served=null;
 f.service.request({kind,table:IZAKAYA_PLAYER_SEATS.counter2.table,tag:'guest',onServed:p=>served=p});
 const solids=foodSolids().map(([a,b])=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b)));
 run(f,i=>{updateAvatarActor(actor,1/30,i*1000/30);const w=f.service.working;if(w?.step)steps.add(w.step);
  if(w&&(w.close?blocked.closeUp:blocked)(f.thao.position.x,f.thao.position.z,w.close?.13:.3))bad.push(['body',w]);
  const prop=f.thao.userData.workHeld?.R;
  if(prop?.userData.consumable==='food'&&!picked){picked=prop;const hand=actor.avatar.bones.handR,m=actor.avatar.measure,palm=hand.localToWorld(new THREE.Vector3(0,-m.hand*.55,0)),at=prop.getWorldPosition(new THREE.Vector3());gaps.push(Math.abs(Math.hypot(palm.x-at.x,palm.z-at.z)-(prop.userData.workGrip.radius+m.hand*.7)));}
  const A=actor.avatar,joints=['shoulderR','elbowR','handR'].map(b=>A.bones[b].getWorldPosition(new THREE.Vector3()));
  for(let j=0;j<2;j++)for(let t=0;t<=1;t+=.25){const point=joints[j].clone().lerp(joints[j+1],t);for(const solid of solids)if(solid.distanceToPoint(point)<A.measure.armR-.005)bad.push(['arm',w,point.toArray()]);}
  if(prop){const box=new THREE.Box3().setFromObject(prop).expandByScalar(-.005);for(const solid of solids)if(solid.intersectsBox(box))bad.push(['dish',w,box.min.toArray()]);}
 });
 assert.ok(steps.has('station')&&steps.has('plate')&&steps.has('collect'),'all preparation beats');assert.equal(served,picked,'the same dish reaches the customer');
 assert.ok(gaps[0]<.01,'palm on dish rim: '+gaps[0]);assert.deepEqual(bad.slice(0,4),[]);assert.equal(f.service.working,null,'Thao returns');
 assert.equal(served.userData.portion,1);assert.equal(served.position.y,IZAKAYA_PLAYER_SEATS.counter2.table[1]+.002);
});

test('a resident drinks first, waits for food, pays once, and only eats after placement',()=>{
 const f=fixture(),state={},ledger=createResidentLedger(()=>state),p={profile:{name:'Chin'},g:new THREE.Group()};p.g.userData={inIzakaya:true,seatHeight:.46};f.room.add(p.g);p.g.position.set(-1.9,0,-.18);
 const venue=createVenueService({room:f.room,place:'izakaya',bar:()=>f.service,getCustomers:()=>[p],getStaff:()=>f.thao,getMinutes:()=>1140,tableFor:()=>[-1.9,.78,-.775],ledger});
 let drinkFirst=false,sippedBeforeFood=false,ate=false;
 for(let i=0;i<30*240;i++){venue.update(1/30);f.service.update(1/30);const body={x:f.thao.position.x,z:f.thao.position.z,radius:f.thao.userData.serviceRadius};separateBodies([body,{x:p.g.position.x,z:p.g.position.z,fixed:true}]);f.thao.position.x=body.x;f.thao.position.z=body.z;const r=state.residentLife.Chin.meals.izakaya;
  if(r.drinkDelivered&&!r.foodDelivered){drinkFirst=true;assert.equal(f.room.children.some(o=>o.name==='Minato dish · yakitori'&&o.visible&&o.position.z>-.9),false);if(p.g.userData.heldItem==='beer')sippedBeforeFood=true;assert.notEqual(p.g.userData.heldItem,'yakitori');}
  if(p.g.userData.heldItem==='yakitori'){assert.equal(r.foodDelivered,true);ate=true;}
 }
 const r=state.residentLife.Chin.meals.izakaya;assert.ok(drinkFirst&&sippedBeforeFood&&ate);assert.equal(r.finished,true);assert.equal(state.residentLife.Chin.purchases.length,1);assert.equal(state.residentLife.Chin.purchases[0].cost,360);
 venue.dispose();f.service.clear();
});

test('leaving cancels preparation and an already carried plate without a callback or stranded hands',()=>{
 for(const phase of ['cooking','carrying','placing']){const f=fixture();let served=false;
  f.service.request({kind:'yakitori',table:IZAKAYA_PLAYER_SEATS.table.table,tag:'gone',onServed:()=>served=true});
  for(let i=0;i<30*120&&f.service.working?.phase!==phase;i++)f.service.update(1/30);
  f.service.cancel('gone');run(f);assert.equal(served,false,phase);assert.equal(f.thao.userData.workHeld,undefined);assert.equal(f.room.getObjectByName('Minato dish · yakitori'),undefined);}
});

test('partial food/drink delivery survives save restoration, without marking both delivered',()=>{
 const life=restoreResidentLife({Chin:{day:0,yen:2040,meals:{izakaya:{item:'yakitori',drink:'beer',delivered:false,drinkDelivered:true,foodDelivered:false,paid:true,eaten:0,sipped:12,drunk:.25}}}});
 assert.equal(life.Chin.meals.izakaya.foodDelivered,false);assert.equal(life.Chin.meals.izakaya.drinkDelivered,true);assert.equal(life.Chin.meals.izakaya.sipped,12);
});

for(const seat of Object.values(IZAKAYA_PLAYER_SEATS))test('a wide plate reaches '+seat.id+' without entering its furniture',()=>{
 const f=fixture(),actor=createAvatarActor(f.thao,'Thao');let served;
 const solids=foodSolids().map(([a,b])=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b))),bad=[];
 f.service.request({kind:'yakitori',table:seat.dish||seat.table,onServed:p=>served=p});
 run(f,i=>{updateAvatarActor(actor,1/30,i*1000/30);const prop=f.thao.userData.workHeld?.R;if(!prop||prop.userData.consumable!=='food')return;
  const box=new THREE.Box3().setFromObject(prop).expandByScalar(-.005);for(const solid of solids)if(solid.intersectsBox(box))bad.push([f.service.working,box.min.toArray()]);});
 assert.ok(served,seat.id);assert.deepEqual(bad.slice(0,3),[]);assert.equal(f.service.working,null);
});

test('cancellation while working close to the cooker backs Thao out before the return walk',()=>{
 const f=fixture();let served=false;
 f.service.request({kind:'rice',table:IZAKAYA_PLAYER_SEATS.counter2.table,tag:'gone',onServed:()=>served=true});
 for(let i=0;i<3000;i++){f.service.update(1/30);if(f.service.working?.step==='station'&&f.thao.userData.activity.startsWith('preparing')&&f.service.working.close)break;}
 f.service.cancel('gone');run(f);assert.equal(served,false);assert.equal(f.service.working,null);assert.equal(f.thao.userData.serviceRadius,undefined);
});

test('a resident meal and drink have separate supported places at all four booth seats',()=>{
 const props=[];
 for(const x of [-2.85,-2.15])for(const z of [2.25,2.55]){
  const food=serviceFor([x,.72,z],true),drink=serviceFor([x,.72,z]);
  const mug=createDrinkProp('draft');mug.position.set(...drink.table);props.push(mug);
  // Sashimi has the deepest plate; yakitori the widest. Neither may meet the glass.
  for(const kind of ['sashimi','yakitori','rice']){const dish=createDishProp(kind);dish.position.set(...food.table);
   const a=new THREE.Box3().setFromObject(dish),b=new THREE.Box3().setFromObject(mug);
   assert.equal(a.intersectsBox(b),false,kind+' at '+[x,z]);assert.ok(a.min.z>=2.025&&a.max.z<=2.775,'supported by the table');}
 }
 for(let i=0;i<props.length;i++)for(let j=i+1;j<props.length;j++)assert.equal(new THREE.Box3().setFromObject(props[i]).intersectsBox(new THREE.Box3().setFromObject(props[j])),false);
});
