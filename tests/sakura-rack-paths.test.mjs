import test from 'node:test';
import {inTillPocket} from '../src/people/retail-clerk.js';
import {TILL_BODY} from '../src/world/interiors/sakura-queue.js';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {createResidentLedger,restoreResidentLife} from '../src/people/resident-personalities.js';
import {marketVisitsForDay} from '../src/people/market-visits.js';
import {createSakuraShop} from '../src/people/sakura-shop.js';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {stockSpec} from '../src/commerce/shop-stock.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';
import {MAGAZINE_RACK} from '../src/world/interiors/sakura-magazine-rack.js';
// The magazine rack is taken out (MAGAZINE_RACK.placed false); its old spot under the west window is open floor, and
// these routes check that shoppers still walk it and detour around Johansson standing there.
const RACK_POSITION=[MAGAZINE_RACK.x,0,MAGAZINE_RACK.z];
const READER_POSITION=[MAGAZINE_RACK.x,0,MAGAZINE_RACK.z-MAGAZINE_RACK.depth/2-.44];

const DT=1/60;
// The shopper is a live resident whose errand that day really takes him to Sakura (people/social.js residentPlan):
// Reiko, who these routes were first written for, retired in the cast consolidation (AGENTS.md, phase 4).
const SHOPPER='Harbour master';
const START=marketVisitsForDay(0)[SHOPPER][0]+5;

function savedVisit(item,{phase='browse',position=SAKURA_LAYOUT.entrance,picked=false}={}){
 const state={yen:1200,inventory:[],sakura:restoreSakura(),residentLife:{[SHOPPER]:{day:0,yen:2400,purchases:[],activities:[],meals:{},shopping:{phase,started:START,finished:false,item,picked,paid:false,timer:0,position:[...position]}}}};
 if(picked)state.sakura.stock[item].shelf--;
 return state;
}

function fixture({state=savedVisit('pudding'),playerPosition=null,customer=true,minutes=START}={}){
 installDOM();const scene=new THREE.Scene(),street=new THREE.Group();scene.add(street);
 const world={people:[]};let time=minutes,player=playerPosition?new THREE.Vector3(...playerPosition):null;
 for(const name of customer?['Thuan',SHOPPER]:['Thuan']){
  const profile=RESIDENTS.find(p=>p.name===name),g=new THREE.Group();
  g.userData={name,hit:{inside:false},indoors:'market',justArrived:name===SHOPPER,visualReady:false};g.visible=false;
  g.position.set(profile.work[0],0,profile.work[1]);street.add(g);world.people.push({profile,g});
 }
 const ledger=createResidentLedger(()=>state);
 const shop=createSakuraShop({world,scene,state,ledger,register(o,label,fn,inside){o.userData.hit={inside,fn,label};},action(){},exit(){},getMinutes:()=>time,getPlayerPosition:()=>player||new THREE.Vector3(5,0,5),isInside:()=>!!player});
 shop.group.visible=true;
 return {state,world,ledger,shop,count:world.people.length,customer:world.people.find(p=>p.profile.name===SHOPPER),clerk:world.people[0],get minutes(){return time;},get player(){return player;},setPlayer(position){player=new THREE.Vector3(...position);},clearPlayer(){player=null;},step(dt=DT){time+=dt/60;shop.update(dt);}};
}

function assertClear(f,person,radius){
 const g=person.g;if(!g.userData.inMarket)return;
 // At the till the clerk stands 0.75 m behind the counter's front (sakura-queue.js, C1): her body is what clears it there.
 if(inTillPocket(g,f.shop.layout))radius=TILL_BODY;
 assert.equal(f.shop.blocked(g.position.x,g.position.z,radius),false,person.profile.name+' intersects a fitting at '+g.position.toArray()+' during '+g.userData.activity);
 if(f.player)assert.ok(g.position.distanceTo(f.player)>=radius+.28-1e-6,person.profile.name+' overlaps Johansson at '+g.position.toArray());
 for(const other of f.world.people){if(other===person||!other.g.userData.inMarket)continue;assert.ok(g.position.distanceTo(other.g.position)>=.7-1e-6,person.profile.name+' overlaps '+other.profile.name);}
}

function finishVisit(f,{beforeStep=()=>{},afterStep=()=>{}}={}){
 const phases=new Set();let completed=false,elapsed=0;
 for(let frame=0;frame<300/DT;frame++){
  elapsed=frame*DT;beforeStep(elapsed);
  const inside=!!f.customer.g.userData.inMarket,before=f.customer.g.position.clone();f.step();
  const record=f.state.residentLife[SHOPPER].shopping;phases.add(record.phase);
  if(inside&&f.customer.g.userData.inMarket)assert.ok(before.distanceTo(f.customer.g.position)<=DT+1e-6,'The shopper walks between stops without jumping past obstacles');
  assertClear(f,f.customer,.35);assertClear(f,f.clerk,.36);
  afterStep(elapsed,record);
  if(record.finished&&!f.customer.g.userData.inMarket){completed=true;break;}
 }
 assert.ok(completed,'The shopper pays and leaves within five minutes');
 assert.ok(phases.has('queue'));assert.ok(phases.has('paid'));assert.ok(phases.has('finished'));
 assert.equal(f.world.people.length,f.count,'The visit borrows the existing resident');
 const record=f.state.residentLife[SHOPPER].shopping,spec=stockSpec(record.item);
 assert.equal(record.paid,true);assert.equal(f.state.sakura.sales,spec.cost);assert.equal(f.state.sakura.journal.filter(r=>r.kind==='Sale').length,1);
 assert.equal(f.ledger.account(SHOPPER,f.minutes).purchases.filter(p=>p.id==='shop-goods').length,1);
 assert.equal(f.state.sakura.stock[record.item].shelf,spec.capacity-1,'One item leaves its visible shelf');
 return {phases,elapsed};
}

test('a saved shopper saved under the west window resumes from clear floor and finishes her real visit',()=>{
 const state=savedVisit('notebook',{position:RACK_POSITION});state.residentLife=restoreResidentLife(JSON.parse(JSON.stringify(state.residentLife)));
 const f=fixture({state});f.step(0);
 assert.equal(f.customer.g.userData.inMarket,true);assertClear(f,f.customer,.35);
 const {phases}=finishVisit(f);assert.ok(phases.has('browse'));assert.ok(phases.has('pickup'));
});

test('an unpicked saved pickup returns to its shelf before taking stock when Johansson occupied its saved spot',()=>{
 const item='pudding',capacity=stockSpec(item).capacity,state=savedVisit(item,{phase:'pickup'}),f=fixture({state});
 const approach=f.shop.display.unitApproaches.get(item+':'+(capacity-1));assert.ok(approach,'Use the actual last stocked pudding’s standing approach');
 state.residentLife[SHOPPER].shopping.position=[...approach];state.residentLife[SHOPPER].shopping.timer=1.2;
 state.residentLife=restoreResidentLife(JSON.parse(JSON.stringify(state.residentLife)));f.setPlayer(approach);f.step(0);
 assertClear(f,f.customer,.35);assert.ok(f.customer.g.position.distanceTo(f.player)>1,'The saved pickup is relocated clear of Johansson');
 let cleared=false,observedPickup=false;
 finishVisit(f,{beforeStep(elapsed){
  if(elapsed<5)assert.equal(state.sakura.stock[item].shelf,capacity,'An occupied saved shelf cannot be picked remotely from the entrance');
  if(elapsed>=5&&!cleared){f.clearPlayer();cleared=true;}
 },afterStep(elapsed,record){if(!observedPickup&&state.sakura.stock[item].shelf<capacity){
  assert.ok(cleared,'The original pickup approach clears before stock leaves its shelf');
  assert.ok(f.customer.g.position.distanceTo(new THREE.Vector3(...approach))<.13,'The real shopper walks back within reaching distance before claiming the pudding');
  assert.equal(record.picked,true);observedPickup=true;
 }}});
 assert.ok(observedPickup,'Observe the actual shelf claim before the single payment and exit');
});

for(const item of ['pudding','yogurt'])test('the '+item+' shopper detours around Johansson under the west window and returns to the till',()=>{
 const f=fixture({state:savedVisit(item),playerPosition:READER_POSITION});f.step(0);
 const {phases}=finishVisit(f);assert.ok(phases.has('browse'));assert.ok(phases.has('pickup'));
 assert.deepEqual(f.player.toArray(),READER_POSITION,'Johansson stays under the window throughout the complete shopping route');
});

test('a shopper replans when Johansson enters her existing route under the west window',()=>{
 const f=fixture({state:savedVisit('pudding')}),initial=new THREE.Vector3(...SAKURA_LAYOUT.entrance);f.step(0);let appeared=false;
 const {phases}=finishVisit(f,{beforeStep(elapsed){if(elapsed>=1&&!appeared){
  assert.equal(f.customer.g.userData.inMarket,true);assert.equal(f.state.residentLife[SHOPPER].shopping.phase,'browse');
  assert.ok(f.customer.g.position.distanceTo(initial)>.05,'The shopper has started walking her unobstructed route');
  f.setPlayer(READER_POSITION);assert.equal(f.shop.blocked(f.player.x,f.player.z,.28),false,'Johansson steps onto clear floor under the window');
  assert.ok(f.customer.g.position.distanceTo(f.player)>=.63,'The new obstruction starts clear of the walking customer');appeared=true;
 }}});
 assert.ok(appeared);assert.ok(phases.has('pickup'));assert.deepEqual(f.player.toArray(),READER_POSITION,'The shopper yields and detours while Johansson remains still');
});

test('a customer defers an occupied Sakura entrance, then walks through the complete visit after it clears',()=>{
 const f=fixture({playerPosition:[0,0,3.45]});
 for(let frame=0;frame<5/DT;frame++){f.step();assert.equal(f.customer.g.userData.inMarket,undefined,'The customer waits outside instead of appearing inside Johansson');}
 f.clearPlayer();const {phases}=finishVisit(f);assert.ok(phases.has('browse'));assert.ok(phases.has('pickup'));
});

for(const item of ['pudding','yogurt','bento'])test('a picked '+item+' claim survives reload and is charged once without losing another shelf item',()=>{
 const saved=savedVisit(item,{phase:'queue',position:SAKURA_LAYOUT.checkout,picked:true});
 const state=JSON.parse(JSON.stringify(saved));state.sakura=restoreSakura(state.sakura);state.residentLife=restoreResidentLife(state.residentLife);
 assert.equal(state.residentLife[SHOPPER].shopping?.item,item);assert.equal(state.residentLife[SHOPPER].shopping?.picked,true);assert.equal(state.residentLife[SHOPPER].shopping?.paid,false);
 const f=fixture({state});f.step(0);finishVisit(f);
 assert.equal(f.ledger.account(SHOPPER,f.minutes).yen,2400-stockSpec(item).cost);
 const reloaded=JSON.parse(JSON.stringify(state));reloaded.sakura=restoreSakura(reloaded.sakura);reloaded.residentLife=restoreResidentLife(reloaded.residentLife);
 const resumed=fixture({state:reloaded,minutes:f.minutes});for(let frame=0;frame<30/DT;frame++)resumed.step();
 assert.equal(resumed.state.sakura.sales,stockSpec(item).cost);assert.equal(resumed.state.sakura.journal.filter(r=>r.kind==='Sale').length,1);
 assert.equal(resumed.state.sakura.stock[item].shelf,stockSpec(item).capacity-1,'Reload neither returns the paid item nor takes a replacement');
 assert.equal(resumed.ledger.account(SHOPPER,resumed.minutes).purchases.filter(p=>p.id==='shop-goods').length,1);
});

test('Thuan completes a closing chiller restock and exits at her actual body clearance',()=>{
 const state={yen:1200,inventory:[],sakura:restoreSakura()};state.sakura.stock.pudding.shelf=0;state.sakura.stock.pudding.reserve=2;
 const f=fixture({state,customer:false,minutes:1200}),phases=new Set();f.step(0);let completed=false;
 for(let frame=0;frame<300/DT;frame++){
  const inside=!!f.clerk.g.userData.inMarket,before=f.clerk.g.position.clone();f.step();phases.add(f.shop.service.phase);assertClear(f,f.clerk,.36);
  if(inside&&f.clerk.g.userData.inMarket)assert.ok(before.distanceTo(f.clerk.g.position)<=DT+1e-6,'The clerk walks her restock and exit routes');
  if(f.state.sakura.restockedDay===0&&!f.clerk.g.userData.inMarket){completed=true;break;}
 }
 assert.ok(completed,'Thuan replenishes the chiller and walks out after her closing shift');
 for(const phase of ['stock-fetch','stock-collect','stock-carry','stock-place','return'])assert.ok(phases.has(phase),'Observe '+phase);
 assert.equal(f.state.sakura.stock.pudding.shelf,2);assert.equal(f.state.sakura.stock.pudding.reserve,0);assert.equal(f.state.sakura.journal.filter(r=>r.kind==='Restocked').length,1);
});

test('Thuan detours around Johansson under the west window while returning from a closing chiller restock',()=>{
 const state={yen:1200,inventory:[],sakura:restoreSakura()};state.sakura.stock.pudding.shelf=0;state.sakura.stock.pudding.reserve=2;
 const f=fixture({state,customer:false,minutes:1200,playerPosition:READER_POSITION}),phases=new Set();f.step(0);let completed=false;
 for(let frame=0;frame<300/DT;frame++){
  const inside=!!f.clerk.g.userData.inMarket,before=f.clerk.g.position.clone();f.step();phases.add(f.shop.service.phase);assertClear(f,f.clerk,.36);
  if(inside&&f.clerk.g.userData.inMarket)assert.ok(before.distanceTo(f.clerk.g.position)<=DT+1e-6,'The clerk walks around the reader instead of skipping past him');
  if(f.state.sakura.restockedDay===0&&!f.clerk.g.userData.inMarket){completed=true;break;}
 }
 assert.ok(completed,'Thuan places the stock, returns to the till and exits despite the occupied window floor');
 assert.ok(phases.has('stock-place'));assert.ok(phases.has('return'));assert.equal(f.state.sakura.stock.pudding.shelf,2);assert.equal(f.state.sakura.stock.pudding.reserve,0);
 assert.equal(f.state.sakura.journal.filter(r=>r.kind==='Restocked').length,1);assert.deepEqual(f.player.toArray(),READER_POSITION);
});
