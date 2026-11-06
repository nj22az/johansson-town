import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {createRamenKitchen} from '../src/people/ramen-kitchen.js';
import {createVenueService,MEALS} from '../src/people/venue-service.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {createRamenPlayerService} from '../src/people/ramen-player-service.js';
import {createDrinkProp} from '../src/people/izakaya-beer.js';
import {SATO_COOK,SATO_COUNTER,SATO_GUEST_SEATS,SATO_KITCHEN,SATO_MENU,SATO_LUNCH_DRINK} from '../src/world/sato-ramen-layout.js';

function cook(){const g=new THREE.Group();g.position.set(...SATO_COOK.position);g.userData={name:'Mrs Sato',inRamen:true};return g;}
function guest(name,seatIndex){const g=new THREE.Group(),seat=SATO_GUEST_SEATS[seatIndex];g.position.set(...seat.position);g.rotation.y=seat.yaw;g.userData={name,inRamen:true,seatHeight:seat.height,ramenSeat:seatIndex,hit:{inside:true}};g.visible=true;return {g,profile:RESIDENTS.find(p=>p.name===name)};}
const insideKitchen=g=>g.position.z<=SATO_KITCHEN.passZ+.01&&g.position.z>=SATO_KITCHEN.boiler[1]-.01&&g.position.x>=SATO_KITCHEN.minX-.1&&g.position.x<=SATO_KITCHEN.maxX+.1;

test('Mrs Sato cooks a bowl at the boiler, the pots and the toppings, and carries it to the pass',()=>{
 installDOM();const sato=cook(),kitchen=createRamenKitchen({getCook:()=>sato});let served=false,carried=false;const jobs=new Set();
 assert.ok(kitchen.request({items:['ramen','coffee'],x:SATO_COUNTER[2].table[0],onServed:()=>{served=true;}}));
 for(let i=0;i<60*40&&!served;i++){kitchen.update(1/60);assert.ok(insideKitchen(sato),'she stays in the kitchen aisle');if(sato.userData.socialPose==='Use')jobs.add(sato.userData.activity);carried||=!!sato.getObjectByName('Mrs Sato carrying');}
 assert.ok(served);assert.ok(carried,'the bowl and cup are in her hands on the way over');
 for(const job of [/noodles/,/soup/,/chashu/,/coffee/])assert.ok([...jobs].some(j=>job.test(j)),'she does '+job);
 assert.ok(Math.abs(sato.position.x-SATO_COUNTER[2].table[0])<.05&&Math.abs(sato.position.z-SATO_KITCHEN.passZ)<.05,'set down across from the stool');
 assert.equal(sato.getObjectByName('Mrs Sato carrying'),undefined,'and her hands are empty after');
 kitchen.dispose();
});

test('between orders she keeps working round the kitchen',()=>{
 const sato=cook(),kitchen=createRamenKitchen({getCook:()=>sato}),jobs=new Set();let working=0;
 for(let i=0;i<60*90;i++){kitchen.update(1/60);if(sato.userData.socialPose==='Use'){working++;jobs.add(sato.userData.activity);}assert.ok(insideKitchen(sato));}
 assert.ok(jobs.size>=4,'several jobs: '+[...jobs].join(', '));assert.ok(working>60*30,'mostly busy');
});

test('the regulars wait for Mrs Sato, eat a slow bowl with their own drink, and she refills it',()=>{
 installDOM();
 const room=new THREE.Group(),state={yen:0},ledger=createResidentLedger(()=>state),sato=cook(),tetsuo=guest('Tetsuo',0),kitchen=createRamenKitchen({getCook:()=>sato});
 const service=createVenueService({room,place:'ramen',getCustomers:()=>[tetsuo],getMinutes:()=>720,ledger,staffName:'Mrs Sato',kitchen,meal:MEALS.lunch,drinkFor:n=>SATO_LUNCH_DRINK[n],tableFor:p=>SATO_GUEST_SEATS[p.g.userData.ramenSeat].table});
 const seen=new Set();let deliveredAt=null,finishedAt=null,refilled=false;
 for(let i=0;i<60*400;i++){
  service.update(1/60);kitchen.update(1/60);const u=tetsuo.g.userData,t=i/60;
  if(u.heldItem)seen.add(u.socialPose+':'+u.heldItem);
  const rec=state.residentLife.Tetsuo.meals.ramen;
  if(deliveredAt==null&&rec.delivered)deliveredAt=t;if(finishedAt==null&&rec.finished)finishedAt=t;
  if(u.mealState==='lingering'&&/refill/.test(u.activity||''))refilled=true;
 }
 assert.ok(deliveredAt>8,'not before she has cooked it');
 assert.ok(seen.has('Eat:ramen')&&seen.has('Drink:coffee'),'eats ramen and drinks his coffee: '+[...seen]);
 assert.ok(finishedAt-deliveredAt>100,'a slow bowl, not a gulp');
 assert.ok(refilled,'asks for, and gets, a refill');
 const bowl=room.children.find(o=>o.name==='Minato dish · ramen');assert.ok(Math.abs(bowl.position.y-SATO_GUEST_SEATS[0].table[1])<.01,'the bowl sits on the counter top');
 service.dispose();kitchen.dispose();
});

test('your order is cooked and carried by Mrs Sato, then eaten a mouthful at a time',()=>{
 installDOM();
 const room=new THREE.Group(),sato=cook(),kitchen=createRamenKitchen({getCook:()=>sato}),seatIndex=SATO_COUNTER.length-1,seat={...SATO_COUNTER[seatIndex],ramenSeatId:seatIndex},bites=[];let yen=1000;
 const service=createRamenPlayerService({room,getSeat:()=>seat,getMinutes:()=>720,getBalance:()=>yen,pay:n=>{yen-=n;return true;},say(){},menu:SATO_MENU,isOpen:()=>true,server:'Mrs Sato',kitchen,onMouthful:(item,m)=>bites.push(m)});
 assert.ok(service.request('coffee'));
 for(let i=0;i<60*6;i++){service.update(1/60);kitchen.update(1/60);}
 for(let i=0;i<60*30&&!service.order.delivered;i++){service.update(1/60);kitchen.update(1/60);}
 assert.ok(service.order.delivered);assert.equal(yen,800);
 while(service.eat()){}
 assert.equal(bites.length,4);assert.ok(bites.every(b=>b.drink&&b.kind==='coffee'));assert.deepEqual(bites.map(b=>b.left),[3,2,1,0]);
 service.dispose();kitchen.dispose();
});

test('coffee and cold barley tea are on the menu and come in their own cups',()=>{
 installDOM();
 for(const id of ['coffee','mugicha'])assert.ok(SATO_MENU.some(i=>i.id===id));
 assert.ok(createDrinkProp('coffee').userData.rimHeight<.1);assert.equal(createDrinkProp('mugicha').userData.consumable,'drink');
});
