import test from 'node:test';
import {inTillPocket} from '../src/people/retail-clerk.js';
import {TILL_BODY} from '../src/world/interiors/sakura-queue.js';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {residentPlan} from '../src/people/social.js';
import {createSakuraShop} from '../src/people/sakura-shop.js';
import {restoreSakura,recordSakuraSale} from '../src/commerce/sakura-economy.js';
import {stockSpec} from '../src/commerce/shop-stock.js';
import {MAGAZINE_RACK} from '../src/world/interiors/sakura-magazine-rack.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';

// Her evening errand starts when surgery ends at 17:00 (clinic-hours.js, commuter-schedule.js Nhung.finish).
const DT=1/60,EVENING=1025;
const CHAT='chatting with Thuan at the counter';
function fixture({finished=false,player=null}={}){
 installDOM();const scene=new THREE.Scene(),street=new THREE.Group();scene.add(street);
 const state={yen:1200,inventory:[],sakura:restoreSakura(),residentLife:{}},world={people:[]};
 let minutes=EVENING,playerPosition=player&&new THREE.Vector3(...player);
 const door=RESIDENTS.find(p=>p.name==='Thuan').work;
 for(const name of ['Thuan','Nhung']){
  const profile=RESIDENTS.find(p=>p.name===name),g=new THREE.Group();
  g.userData={name,hit:{inside:false},justArrived:name==='Nhung',visualReady:false,...(name==='Thuan'?{indoors:'market'}:{})};
  g.position.set(door[0],0,door[1]);street.add(g);world.people.push({profile,g});
 }
 const ledger=createResidentLedger(()=>state);
 if(finished){
  const item=stockSpec('tea'),account=ledger.account('Nhung',minutes);
  ledger.purchase('Nhung',minutes,'shop-goods',item.id,item.cost);state.sakura.stock.tea.shelf--;
  recordSakuraSale(state,item.cost,'goods-0-Nhung',{minute:minutes-30,item:item.name,buyer:'Nhung',unitCost:item.unitCost});
  account.shopping={phase:'finished',started:minutes-30,finished:true,item:'tea',picked:true,paid:true,timer:0,position:[3.9,0,.85]};
 }
 const shop=createSakuraShop({world,scene,state,ledger,register(o,label,fn,inside){o.userData.hit={inside,fn,label};},action(){},exit(){},getMinutes:()=>minutes,getPlayerPosition:()=>playerPosition,isInside:()=>!!playerPosition});
 shop.group.visible=true;
 return {shop,state,world,ledger,aya:world.people[1],clerk:world.people[0],get minutes(){return minutes;},get player(){return playerPosition;},setMinutes(value){minutes=value;},step(){minutes+=DT/60;shop.update(DT);},dispose(){shop.display.dispose();}};
}
function assertClear(f,p,radius){
 if(!p.g.userData.inMarket)return;
 const {x,z}=p.g.position;
 // At the till the clerk stands 0.75 m behind the counter's front (sakura-queue.js, C1): her body, not her clearance circle.
 if(inTillPocket(p.g,f.shop.layout))radius=TILL_BODY;
 assert.equal(f.shop.blocked(x,z,radius),false,p.profile.name+' intersects another actual shop fitting');
 if(f.player)assert.ok(Math.hypot(x-f.player.x,z-f.player.z)>=radius+.28-1e-6,p.profile.name+' overlaps Johansson');
 for(const other of f.world.people)if(other!==p&&other.g.visible&&other.g.userData.inMarket)assert.ok(p.g.position.distanceTo(other.g.position)>=radius+(other===f.clerk?.36:.35)-1e-6,p.profile.name+' overlaps '+other.profile.name);
}
function stepClear(f){
 const inside=f.aya.g.userData.inMarket,before=f.aya.g.position.clone();f.step();
 if(inside&&f.aya.g.userData.inMarket)assert.ok(f.aya.g.position.distanceTo(before)<=DT+1e-6,'Nhung recovers by walking, without jumping through a fitting');
 assertClear(f,f.aya,.35);assertClear(f,f.clerk,.36);
}
function walkUntil(f,condition,seconds=300){
 for(let i=0;i<seconds/DT;i++){stepClear(f);if(condition())return;}
 assert.fail('Nhung did not finish her real evening route within '+seconds+' seconds: '+f.aya.g.position.toArray()+' '+f.aya.g.userData.activity);
}
function leaveEvening(f){
 // Her visit to Thuan at the counter runs an hour after surgery ends (social.js AFTER_WORK); then supper at home.
 f.setMinutes(1082);assert.notEqual(residentPlan(f.aya.profile,f.minutes,false,f.state).place,'market');
 walkUntil(f,()=>!f.aya.g.userData.inMarket);assert.notEqual(f.aya.g.parent,f.shop.group,'Nhung crosses the real exit and returns to her street parent');
}

test('Nhung buys during her real evening errand at 60 Hz, claims at the shelf, and walks out after the errand',()=>{
 const f=fixture();try{
  assert.equal(residentPlan(f.aya.profile,EVENING,false,f.state).place,'market');
  let seenClaim=false;const phases=new Set();
  walkUntil(f,()=>{
   const record=f.state.residentLife.Nhung?.shopping;if(!record)return false;phases.add(record.phase);
   if(record.picked&&!seenClaim){
    const spec=stockSpec(record.item),at=f.shop.display.unitApproaches.get(record.item+':'+(spec.capacity-1));
    assert.ok(f.aya.g.position.distanceTo(new THREE.Vector3(...at))<.13,'The actual Nhung reaches the stock approach before claiming her item');seenClaim=true;
   }
   return record.finished;
  });
  assert.ok(seenClaim);assert.ok(phases.has('pickup'));assert.ok(phases.has('queue'));assert.ok(phases.has('paid'));
  assert.equal(f.state.sakura.journal.filter(r=>r.kind==='Sale').length,1);
  assert.equal(f.ledger.account('Nhung',f.minutes).purchases.filter(p=>p.id==='shop-goods').length,1);
  leaveEvening(f);
 }finally{f.dispose();}
});

test('Nhung returns after a finished purchase and chats with Thuan at the counter, clear of Johansson, without buying twice',()=>{
 // Johansson stands under the west window, where the magazine rack stood before it was taken out.
 const f=fixture({finished:true,player:[MAGAZINE_RACK.x,0,MAGAZINE_RACK.z-.45]});
 try{
  const stock=JSON.stringify(f.state.sakura.stock),sales=f.state.sakura.sales;
  assert.equal(residentPlan(f.aya.profile,EVENING,false,f.state).place,'market');
  walkUntil(f,()=>f.aya.g.userData.activity===CHAT);
  assert.ok(SAKURA_LAYOUT.guestStands.some(p=>f.aya.g.position.distanceTo(new THREE.Vector3(...p))<.13));
  assert.equal(f.aya.g.userData.seatHeight,undefined,'The returning guest never sits on a removed chair');
  for(let i=0;i<5/DT;i++)stepClear(f);
  assert.equal(JSON.stringify(f.state.sakura.stock),stock);assert.equal(f.state.sakura.sales,sales);
  assert.equal(f.ledger.account('Nhung',f.minutes).purchases.length,1);leaveEvening(f);
 }finally{f.dispose();}
});

test('an evening guest waits when all real standing spots are occupied, then walks in when one clears',()=>{
 const stands=SAKURA_LAYOUT.guestStands,f=fixture({finished:true,player:stands[1]});
 try{
  const blockers=[];
  for(const [i,name] of [[0,'Chin'],[2,'Tetsuo']]){
   const g=new THREE.Group();g.position.set(...stands[i]);g.userData={name,inMarket:true,hit:{inside:true}};
   f.shop.group.add(g);const p={profile:RESIDENTS.find(p=>p.name===name),g};f.world.people.push(p);blockers.push(p);
  }
  for(let i=0;i<2/DT;i++){stepClear(f);assert.equal(!!f.aya.g.userData.inMarket,false,'Every occupied standing spot must defer borrowing instead of using a legacy chair');}
  blockers[0].g.visible=false;delete blockers[0].g.userData.inMarket;
  walkUntil(f,()=>f.aya.g.userData.activity===CHAT);leaveEvening(f);
  assert.equal(f.ledger.account('Nhung',f.minutes).purchases.length,1);
 }finally{f.dispose();}
});

test('with the magazine rack taken out, there is no rack to read and every guest stand is clear counter-side floor',()=>{
 const f=fixture();try{
  assert.equal(MAGAZINE_RACK.placed,false);
  let anchor;f.shop.group.traverse(o=>{if(o.userData.hit?.label==='Read the magazines')anchor=o;});
  assert.equal(anchor,undefined,'No reading interaction is offered for a rack that is not in the shop');
  assert.equal(f.shop.blocked(MAGAZINE_RACK.x,MAGAZINE_RACK.z,.35),false,'The floor under the west window is free');
  for(const p of SAKURA_LAYOUT.guestStands)assert.equal(f.shop.blocked(p[0],p[2],.35),false,'Guest stand '+p+' must be on usable floor');
  assert.equal(SAKURA_LAYOUT.guestActivity,CHAT);
 }finally{f.dispose();}
});
