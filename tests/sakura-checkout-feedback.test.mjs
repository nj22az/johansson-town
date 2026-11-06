import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createCheckoutFeedback} from '../src/world/interiors/sakura-checkout.js';
import {buildSakuraCounterDetail} from '../src/world/interiors/sakura-counter-detail.js';
import {buildSakuraBaskets} from '../src/world/interiors/sakura-baskets.js';
import {BASKET_STACK as S,SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';
import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import {SAKURA_TALKERS} from '../src/world/interiors/sakura-shelf-edge.js';
import {refreshSakuraPrint} from '../src/world/interiors/sakura-print.js';
import {restoreSakura,recordSakuraSale} from '../src/commerce/sakura-economy.js';
import {installDOM} from './fixtures.mjs';

test('only new committed sales ring; saved/outside sales never replay and exiting closes the drawer',()=>{
 const drawer=new T.Object3D();drawer.position.x=4.84;let sale={revenue:198},rings=0;
 const feedback=createCheckoutFeedback({drawer,getSale:()=>sale,onSale:()=>rings++});
 feedback.update(.1,true);assert.equal(rings,0);assert.equal(drawer.position.x,4.84);
 sale={revenue:198};feedback.update(.1,true);assert.equal(rings,1);assert.ok(drawer.position.x>4.84);
 for(let i=0;i<20;i++)feedback.update(.1,true);
 assert.equal(rings,1);assert.equal(drawer.position.x,4.84);
 sale={revenue:100};feedback.update(.1,false);feedback.update(.1,true);assert.equal(rings,1);
 sale={revenue:150};feedback.update(.2,true);assert.equal(rings,2);
 feedback.update(0,false);feedback.update(0,true);assert.equal(drawer.position.x,4.84);assert.equal(rings,2);
});

test('drawer moves equally at 30 and 120 Hz and stays within the counter throughout',()=>{
 installDOM();
 function fixture(){const equipment=buildSakuraCounterDetail(new T.Group()),drawer=equipment.getObjectByName('Sakura cash drawer');let sale;
  const feedback=createCheckoutFeedback({drawer,getSale:()=>sale});sale={revenue:198};return {drawer,feedback};}
 const a=fixture(),b=fixture();
 for(let i=0;i<12;i++)a.feedback.update(1/30,true);
 for(let i=0;i<48;i++)b.feedback.update(1/120,true);
 assert.ok(Math.abs(a.drawer.position.x-b.drawer.position.x)<1e-8);
 for(let i=0;i<120;i++){
  a.feedback.update(1/120,true);const bounds=new T.Box3().setFromObject(a.drawer);
  assert.ok(bounds.min.x>=4.54&&bounds.max.x<=5.06&&bounds.min.z>=.08&&bounds.max.z<=3.86);
  assert.ok(bounds.min.y>=FURNITURE_HEIGHTS.serviceCounter);
 }
});

test('one-draw nested baskets stand on the floor with a collider clear of doorway and other fittings',()=>{
 const mesh=buildSakuraBaskets(new T.Group()),bounds=new T.Box3().setFromObject(mesh);
 assert.ok(Math.abs(bounds.min.y)<1e-6&&bounds.max.y<=S.height);
 assert.ok(bounds.min.x>=S.x-S.w/2-1e-6&&bounds.max.x<=S.x+S.w/2+1e-6);
 assert.ok(bounds.min.z>=S.z-S.d/2-1e-6&&bounds.max.z<=S.z+S.d/2+1e-6);
 assert.ok(bounds.max.x<-.95-.35);
 const collider=SAKURA_LAYOUT.colliders.find(c=>c.x===S.x&&c.z===S.z);assert.ok(collider);
 for(const c of SAKURA_LAYOUT.colliders.filter(c=>c!==collider))assert.ok(Math.abs(c.x-S.x)>=(c.w+S.w)/2||Math.abs(c.z-S.z)>=(c.d+S.d)/2,'basket stack overlaps an existing fitting');
 assert.ok(mesh.isMesh&&!mesh.children.length);assert.equal(mesh.castShadow,false);
 assert.ok(SAKURA_TALKERS.every(([jp,en])=>jp&&en&&!/off|sale|limited|new/i.test(en)));
});

test('late web fonts repaint the same texture; disposed prints cannot be revived',async()=>{
 const previous=globalThis.document,pending=[],requests=[];let draws=0;
 globalThis.document={fonts:{load:(font,sample)=>{requests.push({font,sample});return new Promise(done=>pending.push(done));}}};
 try{
  const canvas={getContext:()=>({})},texture=new T.CanvasTexture(canvas);
  refreshSakuraPrint(texture,()=>draws++,'食品¥198');assert.equal(draws,0);
  for(const done of pending)done([]);await new Promise(done=>setImmediate(done));
  assert.equal(requests.length,3);assert.ok(requests.every(r=>r.sample==='食品¥198'));assert.equal(draws,1);assert.equal(texture.image,canvas);
  pending.length=0;refreshSakuraPrint(texture,()=>draws++,'食品');texture.dispose();
  for(const done of pending)done([]);await new Promise(done=>setImmediate(done));assert.equal(draws,1);
 }finally{globalThis.document=previous;}
});

// Exercise the real sale writer rather than assuming a HUD total means payment succeeded.
test('real sales at the till ceiling still ring, duplicate receipts do not, and feedback cannot change money',()=>{
 const state={sakura:restoreSakura()},drawer=new T.Object3D();let rings=0;
 const feedback=createCheckoutFeedback({drawer,getSale:()=>state.sakura.journal.findLast(r=>r.kind==='Sale'),onSale:()=>rings++});
 state.sakura.cash=999999;state.sakura.sales=999999;
 assert.equal(recordSakuraSale(state,198,'paid-once',{item:'Tea',minute:600}),true);
 const committed=JSON.stringify(state);feedback.update(.1,true);assert.equal(rings,1);assert.equal(JSON.stringify(state),committed);
 assert.equal(recordSakuraSale(state,198,'paid-once',{item:'Tea',minute:600}),false);
 feedback.update(.1,true);assert.equal(rings,1);
 assert.equal(recordSakuraSale(state,150,'paid-again',{item:'Rice',minute:601}),true);
 feedback.update(.1,true);assert.equal(rings,2);
});
