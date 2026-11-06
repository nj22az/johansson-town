import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {SATO_ROOM,SATO_COUNTER,SATO_LEDGE,SATO_GUEST_SEATS,SATO_COLLIDERS,SATO_MENU,SATO_COOK,SATO_LUNCH,satoRamenOpen} from '../src/world/sato-ramen-layout.js';
import {izakayaPlot,RAMEN_DOOR,SATO_RAMEN_DOOR,DINING} from '../src/world/dining-layout.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {createRamenPlayerService} from '../src/people/ramen-player-service.js';
import {circleHitsRect} from '../physics.js';
import {installDOM} from './fixtures.mjs';
import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import {MINATO_COMPACT} from '../src/world/interiors/minato-compact-plan.js';

const profile=name=>RESIDENTS.find(p=>p.name===name);

test('Sato Ramen serves lunch from eleven to two, and its door is on the alley corner',()=>{
 for(const m of [659,840,1000,1300])assert.equal(satoRamenOpen(m),false);
 for(const m of [660,720,839,1440+700])assert.equal(satoRamenOpen(m),true);
 try{izakayaPlot();assert.deepEqual(RAMEN_DOOR,[...SATO_RAMEN_DOOR]);}
 finally{}
});

test('Mrs Sato buys fish, cooks the lunch and walks home to Kitahama; the regulars come for lunch',()=>{
 try{
  izakayaPlot();
  const sato=profile('Mrs Sato');
  assert.equal(residentPlan(sato,520).place,'home','at home in Kitahama before the auction');
  assert.equal(residentPlan(sato,1000).place,'home','home again after the lunch service');
  assert.match(residentPlan(sato,570).activity,/fish/);
  for(const m of [640,700,800,835])assert.equal(residentPlan(sato,m).place,'ramen','in her kitchen at '+m);
  assert.notEqual(residentPlan(sato,1000).place,'ramen');
  for(const [name,[from,to]] of Object.entries(SATO_LUNCH)){
   const plan=residentPlan(profile(name),(from+to)/2);
   assert.equal(plan.place,'ramen',name+' has lunch at Sato Ramen');assert.deepEqual(plan.target,[...SATO_RAMEN_DOOR]);
   assert.notEqual(residentPlan(profile(name),to+30).place,'ramen',name+' goes back after lunch');
  }
 }finally{izakayaPlot();}
});

test('every stool can be reached and sat on, and the cook stands in the kitchen',()=>{
 const b=SATO_ROOM.bounds,blocked=(x,z,r=.28)=>x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r||SATO_COLLIDERS.some(c=>circleHitsRect(x,z,r,c));
 assert.equal(blocked(SATO_ROOM.spawn[0],SATO_ROOM.spawn[2]),false,'the door is clear');
 for(const seat of [...SATO_COUNTER,...SATO_LEDGE]){
  assert.equal(blocked(seat.stand[0],seat.stand[2]),false,'stand clear at '+seat.stand);
  assert.equal(seat.table[1],FURNITURE_HEIGHTS.serviceCounter,'Serving point rests on the shared counter surface');
  const dx=seat.table[0]-seat.position[0],dz=seat.table[2]-seat.position[2],forward=-Math.sin(seat.yaw)*dx-Math.cos(seat.yaw)*dz;
  assert.ok(forward>.3&&forward<.9,'The serving point sits within reach in front of the stool');
  assert.ok(Math.abs(Math.cos(seat.yaw)*dx-Math.sin(seat.yaw)*dz)<.000001,'The place setting stays aligned with its stool');
 }
 assert.ok(SATO_GUEST_SEATS.length>=5);
 // Behind the counter's kitchen edge and in front of the back line, in the compact plan the room is built from.
 const {ramenCounter,ramenPrep}=MINATO_COMPACT;
 assert.ok(SATO_COOK.position[2]<ramenCounter.position[2]-ramenCounter.depth/2&&SATO_COOK.position[2]>ramenPrep.position[2]+ramenPrep.depth/2,'Mrs Sato is behind the counter, on the kitchen side');
 assert.ok(SATO_COOK.position[0]>ramenCounter.position[0]-ramenCounter.width/2&&SATO_COOK.position[0]<ramenCounter.position[0]+ramenCounter.width/2,'Mrs Sato is along the counter');
});

test('ordering a bowl at the counter charges for it and sets it down in front of you',()=>{
 installDOM();
 const room=new THREE.Group(),said=[];let yen=1000,minutes=700;const seat={...SATO_COUNTER[1],ramenSeatId:1};
 const service=createRamenPlayerService({room,getSeat:()=>seat,getMinutes:()=>minutes,getBalance:()=>yen,pay:n=>{if(yen<n)return false;yen-=n;return true;},say:t=>said.push(t),
  menu:SATO_MENU,isOpen:satoRamenOpen,title:'Sato Ramen',server:'Mrs Sato'});
 assert.equal(service.request('miso'),true);assert.match(said.at(-1),/Mrs Sato/);
 for(let i=0;i<200;i++)service.update(1/30);
 assert.equal(service.order.delivered,true);assert.equal(yen,500);
 const bowl=room.children.find(o=>o.visible);assert.deepEqual(bowl.position.toArray(),seat.table);
 assert.equal(service.eat(),true);
 minutes=900;assert.equal(service.request('shoyu'),false,'closed after lunch');
 service.dispose();
});
