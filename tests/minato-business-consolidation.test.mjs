import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildBlueCoralShop,dessertShopOpen,NAKAMURA_MENU} from '../src/world/blue-coral-shop.js';
import {NEIGHBOURS,createNeighbours} from '../src/people/neighbours.js';
import {kitahamaHomeFor} from '../src/world/kitahama-layout.js';
import {HARBOUR_PARK_STUDY,NAKAMURA_DESSERTS} from '../src/world/harbour-park-plan.js';
import {circleHitsRect} from '../physics.js';

test('the Rainflower pavilion is gone (phase 4, addendum 3): no builder, no florist body, and a saved destination at it lands at Sakura',async()=>{
 await assert.rejects(import('../src/world/flower-shop.js'));
 const {HARBOUR_PARK_ALIASES,FORMER_FLORIST}=await import('../src/world/harbour-park-plan.js');
 assert.equal(HARBOUR_PARK_ALIASES['rainflower-florist'],'market');assert.equal(HARBOUR_PARK_ALIASES['rainflower-lane'],'market');assert.ok(FORMER_FLORIST.removed);
 assert.equal(NEIGHBOURS.find(n=>n.name==='Mrs Kinjō'),undefined);
});

// The owner, 31 October 2026 (AGENTS.md): "remove the ice cream family now ... we need to build facilities before we
// populate them". Mrs Nakamura and Mai are retired; the dessert counter and Blue Coral are kept, vacant and closed until a
// later decision staffs them, with nobody put in to fill the vacancy and nothing sold through an absent keeper; the former
// home is no longer a resident address. The counter keeps the preserved Blue Coral items and soda on its one menu and its
// hours (nakamura-dressing.test.mjs holds the fittings' day and night when it is staffed).
test('Nakamura keeps the preserved Blue Coral items and soda on one hours-aware menu, vacant and shut until it has a keeper',()=>{
 installDOM();const world={group:new THREE.Group(),colliders:[]},prompts=[],actions=[];
 const shop=buildBlueCoralShop({world,register:(object,label,run)=>prompts.push({object,label,run}),onAction:(...args)=>actions.push(args)});
 assert.equal(prompts.length,2);assert.equal(shop.merged,true);
 assert.deepEqual(NAKAMURA_MENU.map(p=>[p.item,p.cost]),[['Zenzai',250],['Sata andagi',120],['Blue Coral ice cream',150],['Green tea',120],['Cold island soda',100]],'the preserved menu');
 assert.deepEqual([NAKAMURA_DESSERTS.open,NAKAMURA_DESSERTS.close],[600,1140],'and its hours, for when it has a keeper');
 assert.equal(NAKAMURA_DESSERTS.staffed,false);assert.equal(NAKAMURA_DESSERTS.owner,null);
 // Shut by day as by night: the shutter down and solid, the bench parasol furled out of anyone's way (nakamura-dressing.js).
 assert.deepEqual(world.colliders.map(c=>c.id),['nakamura-parasol-canopy','nakamura-shutter']);
 assert.ok(world.landmarks.some(p=>p.id==='nakamura'),'the facility stays on the map');assert.equal(world.landmarks.some(p=>p.id==='home-nakamura'),false,'its flat is no address');
 for(const m of [0,599,600,720,1139,1140]){
  shop.update(m);assert.equal(dessertShopOpen(m),false,'no keeper at '+m);assert.equal(shop.isOpen(),false);
  assert.equal(world.colliders[1].minY,0,'the shutter is down at '+m);assert.ok(world.colliders[0].minY>1.9,'the canopy is clear of heads at '+m);
  for(const p of prompts){p.run();assert.equal(actions.at(-1)[0],'read','nothing is sold through an absent keeper at '+m);}
 }
 assert.match(actions.find(a=>a[1]==='Nakamura is closed')[2],/closed until it has a keeper/);
 assert.equal(NEIGHBOURS.some(n=>['Mrs Nakamura','Mai'].includes(n.name)),false,'no retired keeper behind the counter');
});

test('Vy and Riku have their canonical homes, scheduled school absences and real park destinations',async()=>{
 installDOM();const attached=[],neighbours=createNeighbours({parent:new THREE.Group(),characters:{attach:(g,look,height)=>attached.push({name:g.name,look,height})}});
 // The two pupils keep the cast's canonical day (neighbours.js NEIGHBOURS, canonical-day.js): school at noon, where the
 // classroom owns them, and Vy's homework bench in Harbour Park at twenty past four.
 const {canonicalDay}=await import('../src/people/canonical-day.js');
 for(const name of ['Vy','Riku']){const person=neighbours.people.find(p=>p.spec.name===name);assert.ok(person.spec.canonical);assert.deepEqual(person.spec.home,kitahamaHomeFor(name).door);assert.equal(canonicalDay(name,720).school,true,name+' is at school at noon');}
 neighbours.update(.016,720);for(const name of ['Vy','Riku']){const g=neighbours.people.find(p=>p.spec.name===name).g;assert.equal(g.visible,false,name+' is in the classroom, not the street');assert.equal(g.userData.place,'school');}
 const vy=neighbours.people.find(p=>p.spec.name==='Vy');for(let i=0;i<400;i++)neighbours.update(.25,980);
 assert.deepEqual(canonicalDay('Vy',980).target,HARBOUR_PARK_STUDY[0],'Vy’s homework bench is the park study bench');assert.equal(vy.g.userData.place,'park');assert.equal(vy.g.visible,true);
 const riku=attached.find(p=>p.name==='Riku');assert.equal(riku.look,'Riku');assert.equal(riku.height,1.32);assert.equal(NEIGHBOURS.find(n=>n.name==='Riku').walk,undefined,'A nine-year-old is not the adult cargo-route worker');
});

test('the original Nakamura zenzai and sata-andagi prompts obey the same shared-counter hours',async()=>{
 installDOM();const {buildOkinawaQuarters}=await import('../src/world/okinawa/quarters.js');
 const world={group:new THREE.Group(),colliders:[],minutes:720},prompts=[],actions=[];
 buildOkinawaQuarters(world,{register:(object,label,run)=>prompts.push({label,run}),onAction:(...args)=>actions.push(args)});
 const orders=prompts.filter(p=>['Buy a zenzai','Buy sata andagi'].includes(p.label));assert.equal(orders.length,0,'The unified counter owns orders; no overlapping legacy prompts');
 for(const [minutes,kind] of [[599,'read'],[600,'buy'],[1139,'buy'],[1140,'read']]){world.minutes=minutes;for(const p of orders){p.run();assert.equal(actions.at(-1)[0],kind,p.label+' at '+minutes);}}
});
