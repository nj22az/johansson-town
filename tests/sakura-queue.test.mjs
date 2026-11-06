// Sakura's till queue (src/world/interiors/sakura-queue.js; docs/research/new-yokosuka-lessons.md C1, approved by the
// owner on 19 October 2026): two queue spots 1.0 m apart in the lane from the door, facing the till; a browsing spot in
// each aisle; the clerk's stand point 0.75 m behind the counter's front. Nobody shares a spot, nobody waits in the
// doorway, and the queue moves up.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {SAKURA_LAYOUT,SAKURA_SHELVES} from '../src/world/interiors/sakura-layout.js';
import {SAKURA_QUEUE,SAKURA_BROWSE,SAKURA_CLERK_POINT,SAKURA_COUNTER_FRONT,CLERK_BEHIND_FRONT,DOOR_PATH,inDoorPath,assignSakuraQueue,yawOf} from '../src/world/interiors/sakura-queue.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {RESIDENTS} from '../src/people/residents.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {createSakuraShop} from '../src/people/sakura-shop.js';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {hash01} from '../src/people/stand-points.js';

const L=SAKURA_LAYOUT,blocked=(x,z,r=.35)=>suppliedRoomBoundsBlocked(L,x,z,r)||L.colliders.some(c=>circleHitsRect(x,z,r,c));
const stands=[...new Map(Object.values(SAKURA_SHELVES).map(s=>[s.stand.join(),[s.stand[0],s.stand[2]]])).values()];
const guests=L.guestStands.map(g=>[g[0],g[2]]);
const far=(p,list,d)=>list.every(q=>Math.hypot(p[0]-q[0],p[1]-q[1])>=d);

test('the clerk stands 0.75 m behind the counter’s front; the counter’s front is its customer face',()=>{
 const counter=L.colliders.find(c=>circleHitsRect(4.8,1.0,.01,c));
 assert.ok(Math.abs(counter.x-counter.w/2-SAKURA_COUNTER_FRONT)<1e-9,'the counter’s customer face');
 assert.ok(Math.abs(SAKURA_CLERK_POINT[0]-SAKURA_COUNTER_FRONT-CLERK_BEHIND_FRONT)<1e-9&&CLERK_BEHIND_FRONT===.75);
 assert.deepEqual(L.staff,[...SAKURA_CLERK_POINT]);assert.equal(L.staffYaw,Math.PI/2,'facing the floor');
});

test('two queue spots, 1.0 m apart in the lane from the door, facing the till, clear of the shelves’ stands and the doorway',()=>{
 assert.equal(SAKURA_QUEUE.length,2);
 const [a,b]=SAKURA_QUEUE;assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-1)<.01,'1.0 m apart');
 const register=L.register;
 for(const s of SAKURA_QUEUE){
  assert.equal(blocked(s.x,s.z),false,s.id+' clear of the fittings');
  assert.equal(inDoorPath(s.x,s.z),false,s.id+' out of the doorway');
  assert.ok(far([s.x,s.z],stands,.75),s.id+' a body clear of every shelf’s stand point');
  assert.ok(far([s.x,s.z],guests,.75),s.id+' clear of the evening guests’ places');
  const to=[register[0]-s.x,register[2]-s.z],d=Math.hypot(...to);
  assert.ok((s.facing[0]*to[0]+s.facing[1]*to[1])/d>.9,s.id+' faces the till');
  assert.ok(s.why.length>20);
 }
 // The second spot is back along the lane toward the door.
 assert.ok(Math.hypot(b.x-0,b.z-DOOR_PATH.minZ)<Math.hypot(a.x-0,a.z-DOOR_PATH.minZ));
});

test('one browsing spot in each aisle, facing a shelf, clear of everything and reachable from the door',()=>{
 const walk=createRoomWalk((x,z,r)=>blocked(x,z,r),{bounds:L.bounds,radius:.35,smoothTurn:true});
 const xs=SAKURA_BROWSE.map(s=>s.x);assert.equal(new Set(xs.map(x=>Math.round(x))).size,SAKURA_BROWSE.length,'different aisles');
 for(const s of SAKURA_BROWSE){
  assert.equal(blocked(s.x,s.z),false,s.id);assert.equal(inDoorPath(s.x,s.z),false,s.id);
  assert.ok(far([s.x,s.z],stands,.75)&&far([s.x,s.z],guests,.75)&&far([s.x,s.z],SAKURA_QUEUE.map(q=>[q.x,q.z]),.75),s.id+' leaves room for the shelf’s own customers');
  // Facing a shelf: something solid within 1.5 m ahead.
  let ahead=false;for(let d=.4;d<=1.5;d+=.05)if(L.colliders.some(c=>circleHitsRect(s.x+s.facing[0]*d,s.z+s.facing[1]*d,.05,c)))ahead=true;assert.ok(ahead,s.id+' faces a shelf');
  const g=new T.Group();g.position.set(...L.entrance);let ok=false;for(let i=0;i<4000&&!ok;i++)ok=walk.move({g,profile:{name:'probe'}},[s.x,0,s.z],.05);assert.ok(ok,s.id+' reachable');
 }
});

test('the assignment: never two on one spot, first come first served, the one behind moves up, browsers come back',()=>{
 let seed=1;const rnd=()=>hash01('queue-test',seed++);
 for(let run=0;run<200;run++){
  const people=new Map();let clock=0,held=new Map(),order=[];
  for(let step=0;step<40;step++){
   clock+=1;
   const r=rnd();
   if(r<.45&&people.size<7){const id='p'+run+'-'+step;people.set(id,{id,phase:'queue',since:clock});order.push(id);}
   else if(r<.75){const payer=[...people.values()].find(p=>held.get(p.id)?.kind==='queue'&&held.get(p.id).index===0);if(payer)payer.phase=payer.phase==='queue'?'paid':'gone';}
   for(const [id,p] of people)if(p.phase==='gone')people.delete(id);
   const before=held;held=assignSakuraQueue([...people.values()].map(p=>({...p,held:before.get(p.id)||null})));
   const q=[...held.values()].filter(v=>v.kind==='queue').map(v=>v.index),b=[...held.values()].filter(v=>v.kind==='browse').map(v=>v.index);
   assert.equal(new Set(q).size,q.length,'no two on one queue spot');assert.equal(new Set(b).size,b.length,'no two on one aisle spot');
   // Order: whoever joined first among the waiting holds the lower spot.
   const waiting=[...people.values()].filter(p=>p.phase==='queue'&&held.get(p.id).kind==='queue').sort((x,y)=>x.since-y.since);
   for(let i=1;i<waiting.length;i++)assert.ok(held.get(waiting[i-1].id).index<held.get(waiting[i].id).index,'first come, first served');
   // Moving up: someone at the next spot is at the paying spot as soon as it is free.
   const front=[...before].find(([,v])=>v.kind==='queue'&&v.index===0)?.[0];
   if(front&&!people.has(front))for(const [id,v] of before)if(v.kind==='queue'&&v.index===1&&people.get(id)?.phase==='queue')assert.equal(held.get(id).index,0,'moves up when the one in front leaves');
   // Nobody browses while a queue spot is free: a browser comes back as soon as one is.
   if(q.length<SAKURA_QUEUE.length)assert.equal([...people.values()].some(p=>p.phase==='queue'&&held.get(p.id).kind!=='queue'),false,'a free spot is taken');
  }
 }
});

function fixture(names){
 installDOM();const scene=new T.Scene(),street=new T.Group();scene.add(street);
 const state={yen:1200,inventory:[],sakura:restoreSakura()},world={people:[]};let minutes=600;
 for(const name of ['Thuan',...names]){const profile=RESIDENTS.find(p=>p.name===name),g=new T.Group();g.userData={name,hit:{inside:false},indoors:name==='Thuan'?'market':null,visualReady:false};g.position.set(profile.work[0],0,profile.work[1]);street.add(g);world.people.push({profile,g});}
 const ledger=createResidentLedger(()=>state);
 const shop=createSakuraShop({world,scene,state,ledger,register:(o,label,fn,inside)=>{o.userData.hit={inside,fn,label};},action(){},exit(){},getMinutes:()=>minutes,getPlayerSeat:()=>null,getPlayerPosition:()=>new T.Vector3(50,0,50),isInside:()=>false,say(){}});
 const step=(seconds,check=()=>{})=>{for(let f=0;f<seconds*30;f++){minutes+=1/30;shop.update(1/30);check();}};
 return {state,world,ledger,shop,step,get minutes(){return minutes;}};
}

test('four customers with their goods at once: the queue fills, the fourth browses, each moves up and pays, nobody shares a spot or waits in the doorway',()=>{
 const names=['Harbour master','Tetsuo','Mrs Sato','Officer Mori'];
 const f=fixture(names),clerk=f.world.people[0].g,customers=f.world.people.slice(1);
 f.step(20);// Thuan in at her till first.
 const spots=[[2.6,-1.3],[0,-.4],[-2.8,.3],[-1.5,2.4]];
 customers.forEach((p,i)=>{
  f.shop.group.add(p.g);p.g.position.set(spots[i][0],0,spots[i][1]);p.g.visible=true;Object.assign(p.g.userData,{inMarket:true,indoors:'market',place:'market'});
  const account=f.ledger.account(p.profile.name,f.minutes);account.shopping={phase:'queue',started:f.minutes,queuedAt:f.minutes+i*.01,finished:false,item:'notebook',picked:true,paid:false,timer:0,position:[...spots[i].slice(0,1),0,spots[i][1]]};
 });
 const browsed=new Set(),paidOrder=[],still=new Map();let servedAtTill=0,lastClerk=null;
 // The fixture's clock runs a town minute a second: ten to half past twelve, before Thuan's lunch.
 f.step(150,()=>{
  for(const p of customers){
   const r=f.ledger.account(p.profile.name,f.minutes).shopping;
   if(r.finished&&p.g.userData.inMarket){paidOrder.push(p.profile.name);p.g.userData.inMarket=false;p.g.position.set(50,0,50);continue;}
   if(!p.g.userData.inMarket)continue;
   if(r.queueSpot?.kind==='browse')browsed.add(p.profile.name);
   const key=p.profile.name,last=still.get(key);
   if(last&&p.g.position.distanceTo(last.at)<1e-4){last.t+=1/30;if(last.t>1)assert.equal(inDoorPath(p.g.position.x,p.g.position.z),false,key+' waits in the doorway');}else still.set(key,{at:p.g.position.clone(),t:0});
  }
  const inside=customers.filter(p=>p.g.userData.inMarket);
  for(let i=0;i<inside.length;i++)for(let j=i+1;j<inside.length;j++){
   const a=inside[i].g.position,b=inside[j].g.position;assert.ok(a.distanceTo(b)>.55,'two customers never stand on one spot');
  }
  for(const s of SAKURA_QUEUE){const on=inside.filter(p=>Math.hypot(p.g.position.x-s.x,p.g.position.z-s.z)<.15);assert.ok(on.length<=1,'one on '+s.id);}
  if(clerk.userData.inMarket){
   assert.equal(blocked(clerk.position.x,clerk.position.z,.2),false,'the clerk is never in the counter: '+clerk.position.toArray().map(v=>v.toFixed(2)));
   assert.ok(!lastClerk||clerk.position.distanceTo(lastClerk)<.06,'the clerk walks, never jumps: '+lastClerk?.toArray().map(v=>v.toFixed(2))+' to '+clerk.position.toArray().map(v=>v.toFixed(2))+' '+f.shop.service.phase);lastClerk=clerk.position.clone();
  }
  for(const p of inside)assert.equal(blocked(p.g.position.x,p.g.position.z,.3),false,p.profile.name+' never inside a fitting');
  if(f.shop.service.phase==='checkout-pay'){assert.ok(Math.hypot(clerk.position.x-SAKURA_CLERK_POINT[0],clerk.position.z-SAKURA_CLERK_POINT[2])<.02,'the clerk serves from her stand point');servedAtTill++;}
 });
 assert.deepEqual(paidOrder,names,'served in the order they joined the queue');
 assert.ok(browsed.size>=2,'whoever found both spots taken browsed an aisle and came back');
 assert.ok(servedAtTill>0);
 assert.equal(f.state.sakura.journal.filter(r=>r.kind==='Sale').length,4,'four sales, once each');
});
