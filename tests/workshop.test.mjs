import {recordSakuraSale} from '../src/commerce/sakura-economy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {SAVE_KEY} from '../src/save.js';
import {WORKSHOP_MODELS} from '../src/workshop/catalogue.js';
import {restoreWorkshop,startPrint,advancePrint,collectPrint,sellPrint,canSellAtSakura} from '../src/workshop/production.js';
import {loadWorkshopModel,makeWorkshopModel,printedItem} from '../src/workshop/models.js';
import {makeContentObject} from '../content-items.js';
import {createInspector} from '../inspect-3d.js';

const recipe=WORKSHOP_MODELS[0];
const initial=()=>({yen:1200,inventory:[],workshop:restoreWorkshop(null,[])});
function setup(saved){
 const dom=installDOM(saved?{[SAVE_KEY]:JSON.stringify(saved)}:{});let context={inside:'form3d'},minutes=600;
 const acts=createActivities({say(){},onWeather(){},onTime(value){if(value?.restore)minutes=value.restore;},getMinutes:()=>minutes,getSocialContext:()=>context});
 return {dom,acts,context:value=>context=value,time:value=>minutes=value,button:label=>document.querySelector('#activityActions').children.find(button=>button.textContent===label)};
}

test('all five models print, collect once, block duplicates and sell for the correct yen',()=>{
 for(const model of WORKSHOP_MODELS){
  const state=initial();assert.equal(startPrint(state,model.id).ok,true);assert.equal(state.yen,1200-model.material);
  assert.equal(startPrint(state,model.id).ok,false);assert.equal(collectPrint(state).ok,false);
  assert.equal(advancePrint(state,model.seconds),true);assert.equal(advancePrint(state,1),false);
  assert.equal(collectPrint(state).ok,true);assert.equal(collectPrint(state).ok,false);assert.deepEqual(state.inventory,[model.name]);
  assert.equal(startPrint(state,model.id).ok,false);assert.equal(state.yen,1200-model.material);
  recordSakuraSale(state,model.price);assert.equal(sellPrint(state,model.id).ok,true);assert.equal(sellPrint(state,model.id).ok,false);
  assert.deepEqual(state.inventory,[]);assert.equal(state.yen,1200-model.material+model.price);
  assert.equal(startPrint(state,model.id).ok,true,'a sold copy can be made again');
 }
});

test('insufficient funds and a full bag cannot lose currency or a completed print',()=>{
 const state=initial();state.yen=recipe.material-1;assert.equal(startPrint(state,recipe.id).ok,false);assert.equal(state.workshop.job,null);
 state.yen=1200;state.inventory=Array(100).fill('Taman');assert.equal(startPrint(state,recipe.id).ok,false);assert.equal(state.yen,1200);
 state.inventory.pop();assert.equal(startPrint(state,recipe.id).ok,true);state.inventory.push('Taman');advancePrint(state,100);
 assert.equal(collectPrint(state).ok,false);assert.equal(state.workshop.job.remaining,0);state.inventory.pop();assert.equal(collectPrint(state).ok,true);
 state.yen=999999;assert.equal(sellPrint(state,recipe.id).ok,false);assert.ok(state.inventory.includes(recipe.name));
});

test('old saves and mid-print reloads preserve unique models, ordinary stacks and paid progress',()=>{
 const save={yen:600,quest:3,inventory:[recipe.name,recipe.name,'Taman','Taman','Evening newspaper'],workshop:{selected:'unknown',job:{id:'unknown',remaining:1}}};
 const {acts}=setup(save);assert.deepEqual(acts.state.inventory,[recipe.name,'Taman','Taman','Evening newspaper']);assert.equal(acts.state.workshop.job,null);assert.equal(acts.state.quest,3);
 const model=WORKSHOP_MODELS[2];startPrint(acts.state,model.id);advancePrint(acts.state,3);acts.save();
 const reloaded=setup(JSON.parse(localStorage.getItem(SAVE_KEY)));assert.equal(reloaded.acts.state.workshop.job.remaining,model.seconds-3);assert.equal(reloaded.acts.state.yen,600-model.material);
 reloaded.acts.tick(model.seconds);reloaded.acts.save();const ready=setup(JSON.parse(localStorage.getItem(SAVE_KEY)));
 assert.equal(ready.acts.state.workshop.job.remaining,0);assert.equal(collectPrint(ready.acts.state).ok,true);
 for(const job of [{id:recipe.id,remaining:-1},{id:recipe.id,remaining:'0'},{id:'missing',remaining:0}])assert.equal(restoreWorkshop({job},[]).job,null);
});

test('actual activity buttons complete the workshop–Thuan loop and ignore stale double taps',()=>{
 const ui=setup();recordSakuraSale(ui.acts.state,150);ui.acts.action('workshop');
 ui.dom.button('Check with StepWise');assert.match(document.querySelector('#activityBody').firstChild.textContent,/120 − ¥40 = ¥80/);
 ui.dom.button('Use this pattern in Form 3D');const print=ui.button('Print model · ¥40');print.onclick();print.onclick();assert.equal(ui.acts.state.yen,1160);assert.equal(ui.acts.paused,false);
 ui.acts.tick(8);ui.acts.action('workshop');const collect=ui.button('Collect model');collect.onclick();collect.onclick();assert.deepEqual(ui.acts.state.inventory,[recipe.name]);
 ui.dom.button('Back to printer');assert.equal(ui.button('Print model · ¥40').disabled,true);
 ui.context({inside:'market',thuanAvailable:true});ui.acts.action('resident','Thuan');ui.dom.button('At the counter');ui.dom.button('The shop side of things');ui.dom.button('Sell items from my bag');
 const sell=ui.button('Sell '+recipe.name+' · +¥120');sell.onclick();sell.onclick();assert.equal(ui.acts.state.yen,1280);assert.deepEqual(ui.acts.state.inventory,[]);
 const persisted=JSON.parse(localStorage.getItem(SAVE_KEY));assert.equal(persisted.yen,1280);assert.deepEqual(persisted.inventory,[]);
 ui.context({inside:'form3d'});ui.acts.action('workshop');assert.equal(ui.button('Print model · ¥40').disabled,false);
});

test('only Thuan at Sakura during her working hours can buy a model, including stale offers',()=>{
 for(const context of [{inside:'izakaya',thuanAvailable:true},{inside:'form3d',thuanAvailable:true},{inside:'market',thuanAvailable:false}])assert.equal(canSellAtSakura(context,600),false);
 const available={inside:'market',thuanAvailable:true};for(const minute of [539,1200,180,1440+1200])assert.equal(canSellAtSakura(available,minute),false);
 for(const minute of [540,1199,1440+540])assert.equal(canSellAtSakura(available,minute),true);
 const ui=setup({yen:300,inventory:[recipe.name]});recordSakuraSale(ui.acts.state,150);ui.context(available);ui.acts.action('resident','Thuan');ui.dom.button('At the counter');ui.dom.button('The shop side of things');ui.dom.button('Sell items from my bag');const sell=ui.button('Sell '+recipe.name+' · +¥120');
 ui.time(1200);sell.onclick();assert.equal(ui.acts.state.yen,300);assert.deepEqual(ui.acts.state.inventory,[recipe.name]);
 ui.context({inside:'izakaya',thuanAvailable:true});ui.acts.action('workshop');assert.equal(ui.button('Print model · ¥40'),undefined);
});

test('the real tool pages open only on request and stop when the modal closes',()=>{
 const {acts,dom}=setup();acts.action('stepwise');assert.equal(document.querySelector('#activityBody').children.length,1);
 dom.button('Open StepWise calculator');const calculator=document.querySelector('#activityBody').lastChild;assert.equal(calculator.src,'/stepbuddy/');
 dom.button('Back to StepWise estimate');assert.equal(calculator.src,'about:blank');
 dom.button('Use this pattern in Form 3D');dom.button('Open Form 3D Studio');const studio=document.querySelector('#activityBody').lastChild;assert.equal(studio.src,'/form-3d-studio/');
 acts.close();assert.equal(studio.src,'about:blank');assert.equal(acts.paused,false);
});

test('all printed inventory items use bounded real Form 3D geometry and page-relative assets',async()=>{
 installDOM();const previous=globalThis.fetch,urls=[];globalThis.fetch=async url=>{urls.push(String(url));return new Response(await readFile(new URL('../assets/workshop/'+new URL(url).pathname.split('/').at(-1),import.meta.url)));};
 try{
  let bytes=0;
  for(const model of WORKSHOP_MODELS){
   const data=await loadWorkshopModel(model.id);bytes+=JSON.stringify(data).length;
   assert.equal(new URL(urls.at(-1)).pathname,'/johansson-town/assets/workshop/'+model.id+'.json');
   assert.equal(data.license,'MIT');assert.ok(data.solids.length);
   for(const solid of data.solids){assert.ok(solid.mesh.faces.length<=3000);assert.ok(solid.mesh.vertices.flat().every(Number.isFinite));assert.ok(solid.mesh.faces.flat().every(index=>index>=0&&index<solid.mesh.vertices.length));}
   const mesh=makeWorkshopModel(data,model.colour),size=new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());assert.ok(Math.abs(Math.max(size.x,size.y,size.z)-1.1)<.001);
   const object=makeContentObject(printedItem(model,data));assert.ok(object.getObjectByName('Form 3D · '+data.name));object.userData.reader.open();object.userData.reader.update(.1);
  }
  assert.ok(bytes<550000,'catalogue stays out of the initial download and under 550 kB in total');
 }finally{globalThis.fetch=previous;}
});

test('inventory model inspection uses its own depth buffer and restores the normal game view',async()=>{
 installDOM();const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),renders=[];
 const renderer={autoClear:true,getPixelRatio:()=>1,setPixelRatio(){},clearDepth(){this.cleared=true;},render(view){renders.push(view);}};
 const inspector=createInspector({scene,camera,renderer,canvas:document.createElement('canvas'),onInspect(){},resetInput(){}});
 const data=JSON.parse(await readFile(new URL('../assets/workshop/cable-ring.json',import.meta.url),'utf8'));
 inspector.open(printedItem(recipe,data));assert.equal(inspector.active,true);inspector.render(.1);
 assert.equal(renderer.cleared,true);assert.equal(renderer.autoClear,true);assert.equal(renders[0],scene);assert.notEqual(renders[1],scene);
 const model=renders[1].getObjectByName('Form 3D · '+data.name);assert.ok(model);model.traverse(object=>{if(object.isMesh)assert.equal(object.material.depthTest,true);});
 inspector.close();assert.equal(inspector.active,false);assert.equal(window.__JOHANSSON_INSPECTING__,false);
});
