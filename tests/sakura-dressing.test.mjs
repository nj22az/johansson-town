import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {seasonFor,createWindowDecorations,buildMedicineShelf,WALL_POSTERS,MEDICINE_SHELF,MEDICINES} from '../src/world/interiors/sakura-dressing.js';
import {createActivities} from '../activities.js?snappy=1';

test('the window decorations follow the real calendar, every month',()=>{
 installDOM();
 const at=(m,d=10)=>seasonFor(new Date(2026,m-1,d)).id;
 assert.equal(at(1),'new-year');assert.equal(at(4),'sakura');assert.equal(at(5),'koinobori');assert.equal(at(6),'tsuyu');
 assert.equal(at(7),'tanabata');assert.equal(at(9),'tsukimi');assert.equal(at(10),'aki');assert.equal(at(12),'winter');
 const room=new THREE.Group(),decor=createWindowDecorations(room);
 decor.refresh(new Date(2026,4,5));assert.equal(decor.season,'koinobori');
 const papers=[];decor.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')papers.push(o);});
 assert.ok(papers.length>=10,'Only '+papers.length+' decorations hanging');
 for(const p of papers){const w=p.getWorldPosition(new THREE.Vector3());assert.ok(w.y>1.9&&w.y<2.9,'A decoration hangs in the way at '+w.y.toFixed(2));}
 decor.refresh(new Date(2026,11,20));assert.equal(decor.season,'winter');
});

test('the posters are on walls, not on the glazing, and the medicine shelf is stocked',()=>{
 installDOM();
 // Off the glazing (z 3.91): a poster facing the room keeps well back; one on a side wall ends before the window.
 for(const p of WALL_POSTERS){
  const side=Math.abs(Math.sin(p.yaw))>.9,front=side?p.position[2]+p.size[0]/2:p.position[2];
  assert.ok(side?front<3.88:front<3,'A poster is back on the front window: '+p.id);
 }
 const sale=WALL_POSTERS.find(p=>p.id==='sale');
 assert.deepEqual([sale.size,sale.position],[[.5,.7],[-6.78,1.5,3.3]],'The sale poster moved: the Shorts draw it at this spot');
 const room=new THREE.Group(),shelf=buildMedicineShelf(room);
 const box=new THREE.Box3().setFromObject(shelf.boxes);
 assert.ok(box.min.x>=MEDICINE_SHELF.front-.01&&box.max.x<=MEDICINE_SHELF.back+.01,'Medicine sticks out of its shelf');
 assert.ok(box.min.z>=MEDICINE_SHELF.minZ-.01&&box.max.z<=MEDICINE_SHELF.maxZ+.01,'Medicine runs off the end of the board');
 assert.ok(shelf.boxes.geometry.attributes.position.count>24*40,'The shelf is nearly empty');
});

test('medicine is asked for over the counter during opening hours',()=>{
 const dom=installDOM();let minutes=10*60;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes,getSocialContext:()=>({})});
 const yen=acts.state.yen,kaze=MEDICINES.find(m=>m.id==='nodo');
 acts.action('sakura-medicine');dom.button(`${kaze.jp}${kaze.sub?' '+kaze.sub:''} · ¥${kaze.price.toLocaleString('en-GB')}`);
 assert.equal(acts.state.yen,yen-kaze.price);assert.ok(acts.state.inventory.includes(kaze.en));
 minutes=22*60;acts.action('sakura-medicine');assert.match(document.querySelector('#activityBody').firstChild.textContent,/closed/);
});

test('everything on show behind the counter is for sale: every medicine box and the till goods',()=>{
 const dom=installDOM();const minutes=10*60;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes,getSocialContext:()=>({})});
 acts.state.yen=100000;
 acts.action('sakura-medicine');
 const labels=[...document.querySelector('#activityActions').children].map(b=>b.textContent);
 for(const m of MEDICINES)assert.ok(labels.some(l=>l.startsWith(m.jp)&&l.endsWith('¥'+m.price.toLocaleString('en-GB'))),m.id+' is on the shelf but not for sale');
 const taio=MEDICINES.find(m=>m.id==='taionkei'),before=acts.state.yen;
 dom.button(`${taio.jp}${taio.sub?' '+taio.sub:''} · ¥${taio.price.toLocaleString('en-GB')}`);
 assert.equal(acts.state.yen,before-taio.price);assert.ok(acts.state.inventory.includes(taio.en));
 acts.action('sakura-counter-goods');
 const counter=[...document.querySelector('#activityActions').children].map(b=>b.textContent);
 for(const jp of ['Telephone card','Stamp','Ferry ticket','Gum','Match'])assert.ok(counter.some(l=>l.startsWith(jp)),jp+' cannot be bought at the till');
 const y=acts.state.yen;dom.button(counter.find(l=>l.startsWith('Stamp')));
 assert.equal(acts.state.yen,y-80);assert.ok(acts.state.inventory.includes('80-yen stamp'));
});

test('the medicine cabinet clears the wall rather than flickering on its inner face',async()=>{
 const {SAKURA_SHELL}=await import('../src/world/interiors/sakura-shell.js');
 const wallFace=SAKURA_SHELL.eastX-.04;
 assert.ok(wallFace-(MEDICINE_SHELF.back+.03)>=.05,'The cabinet back must clear the plaster by five centimetres');
 const room=new THREE.Group();installDOM();const shelf=buildMedicineShelf(room);
 const bounds=new THREE.Box3().setFromObject(shelf.boxes);
 assert.ok(bounds.max.x<wallFace-.05,'Medicine packaging must clear the wall');
 assert.ok(bounds.min.z>=MEDICINE_SHELF.minZ&&bounds.max.z<=MEDICINE_SHELF.maxZ,'All facings fit the shortened display');
});
