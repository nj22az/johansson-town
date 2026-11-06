import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSatoRamenDressing,SATO_1997_PRINTS,OKAMOCHI} from '../src/world/interiors/sato-ramen-dressing.js';
import {createRamenTicketMachine,hasRamenTicket,useRamenTicket} from '../src/people/ramen-ticket.js';
import {createRamenPlayerService} from '../src/people/ramen-player-service.js';
import {createRamenKitchen} from '../src/people/ramen-kitchen.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {SATO_MENU,SATO_COOK,satoRamenOpen} from '../src/world/sato-ramen-layout.js';

test('Sato Ramen’s 1997 prints and counter things are on its own walls, in a few draws, with the closed card out of hours',()=>{
 installDOM();
 const room=new THREE.Group(),colliders=[],anchors=[];
 const dressing=buildSatoRamenDressing(room,{collider:(x,z,w,d,h)=>colliders.push({x,z}),anchor:(p,label)=>anchors.push({p,label}),action(){}});
 for(const [cell,x,y,z] of SATO_1997_PRINTS){
  assert.ok(x>6.5&&x<11.45&&z>-6.3&&z<3.65,cell+' hangs inside the ramen shop');
  assert.ok(y>1.2&&y<3.2,cell+' above the counter and under the ceiling');
 }
 const draws=[];room.traverse(o=>{if(o.isMesh)draws.push(o);});
 assert.ok(draws.length<=4,'Prints, props and the two faces of the closed card: '+draws.map(o=>o.name).join(', '));
 assert.ok(colliders.some(c=>c.x===OKAMOCHI.x&&c.z===OKAMOCHI.z),'The okamochi is solid');
 for(const label of ['Ask about delivery','Add pepper to taste','Read the autograph boards'])assert.ok(anchors.some(a=>a.label===label),label);
 const card=room.getObjectByName('Sato Ramen closed');
 dressing.update(12*60);assert.equal(card.visible,false,'No closed card at lunch');
 dressing.update(14*60+30);assert.equal(card.visible,true,'The 準備中 card after two');
});

test('a ticket from the machine pays for that dish when you order it, once',()=>{
 let minutes=12*60;const state={yen:1000},shown=[];
 const machine=createRamenTicketMachine({state,getMinutes:()=>minutes,save(){},close(){},
  spend:n=>{if(state.yen<n)return false;state.yen-=n;return true;},
  show:(title,text,buttons=[])=>shown.push({title,text,buttons}),receipt:(title,text)=>shown.push({title,text,buttons:[]})});
 const miso=SATO_MENU.find(i=>i.id==='miso');
 machine.machine();shown.at(-1).buttons.find(([l])=>l.startsWith('Miso ramen'))[1]();
 assert.equal(state.yen,1000-miso.cost);assert.ok(hasRamenTicket(state,miso));
 machine.machine();assert.equal(shown.at(-1).buttons.length,0,'One ticket at a time');
 // Ordering: the ticket pays, the wallet is not touched again.
 const room=new THREE.Group(),seat={position:[8,0,-1.8],yaw:0};let charged=0;
 const service=createRamenPlayerService({room,menu:SATO_MENU,isOpen:satoRamenOpen,getSeat:()=>seat,getMinutes:()=>minutes,getBalance:()=>0,pay:()=>{charged++;return false;},say(){},
  ticket:{has:item=>hasRamenTicket(state,item),use:item=>useRamenTicket(state,item)}});
 assert.ok(service.request('miso'),'Ordered on the ticket, with an empty wallet');service.update(6);
 assert.equal(charged,0);assert.equal(service.order.delivered,true);assert.equal(state.ramenTicket,undefined,'The ticket is handed over');
 service.dispose();
 minutes=15*60;machine.machine();assert.equal(shown.at(-1).buttons.length,0,'The machine is off after lunch');
});

test('after lunch Mrs Sato stays on to wash up and wipe down, cloth or glass in hand',()=>{
 installDOM();
 const sato=RESIDENTS.find(p=>p.name==='Mrs Sato');
 for(const m of [14*60+5,14*60+55]){const plan=residentPlan(sato,m);assert.equal(plan.place,'ramen');assert.match(plan.activity,/washing up/);}
 const g=new THREE.Group();g.position.set(...SATO_COOK.position);g.userData={name:'Mrs Sato',inRamen:true};
 const kitchen=createRamenKitchen({getCook:()=>g,isAfterLunch:()=>true}),seen=new Set();
 for(let i=0;i<60*60;i++){kitchen.update(1/60);if(g.userData.tool)seen.add(g.userData.socialPose+':'+g.userData.tool);}
 assert.ok(seen.has('Wipe:cloth')&&seen.has('Polish:glass'),'Wiping and polishing: '+[...seen].join(', '));
 kitchen.dispose();assert.equal(g.userData.tool,undefined);
});
