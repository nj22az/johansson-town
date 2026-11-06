import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {sakuraProductTemplate} from '../src/world/interiors/sakura-food-products.js';
import {shopProductTemplate} from '../src/commerce/shop-product.js';
import {SHOP_STOCK,restoreShopStock} from '../src/commerce/shop-stock.js';
import {PRODUCTS} from '../src/commerce/products-data.js';
import {HOT_SNACKS} from '../src/commerce/konbini.js';
import {packagingSlot,ATLAS_COLS,ATLAS_ROWS,ATLAS_SPAN} from '../src/world/interiors/store-advertising.js';
import {SAKURA_LAYOUT,SAKURA_TILL_CABINET,COPY_MACHINE} from '../src/world/interiors/sakura-layout.js';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {installDOM} from './fixtures.mjs';
import {buildSakuraCounterDetail,buildSakuraHotFood,drawSakuraDetailPrints,SAKURA_DETAIL_PRINTS} from '../src/world/interiors/sakura-counter-detail.js';
import {HOT_CASE} from '../src/world/interiors/sakura-cheer.js';
import {createNavigation} from '../src/people/navmesh.js';
import {circleHitsRect} from '../physics.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';

const REPLACED=new Set(['rice','bento','sandwich','bun','pudding','yogurt','noodles','coffee','beer']);
const material=new T.MeshBasicMaterial({side:T.DoubleSide}),ray=new T.Raycaster();
function mesh(geometry){const m=new T.Mesh(geometry,material);m.updateMatrixWorld(true);return m;}
function hit(geometry,origin,direction){ray.set(new T.Vector3(...origin),new T.Vector3(...direction));ray.near=0;ray.far=2;return ray.intersectObject(mesh(geometry),false)[0];}
function colourAt(geometry,origin,direction){const h=hit(geometry,origin,direction);assert.ok(h,'a visible food surface is missing at '+origin);return new T.Color().fromBufferAttribute(geometry.attributes.color,h.face.a);}
function nearColour(actual,hex,message){const wanted=new T.Color(hex);assert.ok(Math.hypot(actual.r-wanted.r,actual.g-wanted.g,actual.b-wanted.b)<.003,message);}
function faceCentre(geometry,i){const p=geometry.attributes.position;return new T.Vector3().fromBufferAttribute(p,i).add(new T.Vector3().fromBufferAttribute(p,i+1)).add(new T.Vector3().fromBufferAttribute(p,i+2)).multiplyScalar(1/3);}
function worldVertices(object){const result=[];object.updateMatrixWorld(true);object.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)result.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));}});return result;}

test('every stock identity keeps its exact placement envelope while food, wrappers and can tops stay inside it',()=>{
 // As many as Sakura's products (data/studio/products.json): Johansson Studio can add and retire lines.
 assert.equal(SHOP_STOCK.length,PRODUCTS.length);
 for(const {id} of SHOP_STOCK){
  const original=shopProductTemplate(id),next=sakuraProductTemplate(id);
  assert.equal(sakuraProductTemplate(id),next,id+' should reuse its template');
  assert.deepEqual(next.bounds.min.toArray(),original.bounds.min.toArray(),id+' changed the stock lift');
  assert.deepEqual(next.bounds.max.toArray(),original.bounds.max.toArray(),id+' changed shelf spacing');
  if(!REPLACED.has(id)){assert.equal(next,original,id+' unexpectedly replaced its packaging');continue;}
  assert.notEqual(next.body,original.body,id+' did not gain physical detail');
  for(const key of ['body','art','glass'])if(next[key]){
   const p=next[key].attributes.position;assert.ok(p.count>0,id+' '+key+' is empty');
   for(let i=0;i<p.count;i++)for(const axis of ['x','y','z']){
    const v=axis==='x'?p.getX(i):axis==='y'?p.getY(i):p.getZ(i);
    assert.ok(Number.isFinite(v)&&v>=original.bounds.min[axis]-1e-7&&v<=original.bounds.max[axis]+1e-7,id+' '+key+' oversteps '+axis+' at vertex '+i);
   }
   assert.ok(p.count/3<1600,id+' '+key+' is too dense for shelf instancing');
  }
 }
});

test('onigiri, compartment meals, layered sandwiches and steamed buns are recognizable from their actual surfaces',()=>{
 const rice=sakuraProductTemplate('rice').body;
 assert.ok(hit(rice,[0,.103,.2],[0,0,-1]),'the rice triangle needs a top');
 assert.equal(hit(rice,[.041,.103,.2],[0,0,-1]),undefined,'an onigiri must taper, rather than remain a box');
 nearColour(colourAt(rice,[.025,.050,.2],[0,0,-1]),0x293d2e,'the lower triangle needs visible nori');
 const bento=sakuraProductTemplate('bento').body;
 const white=colourAt(bento,[-.065,.2,-.04],[0,-1,0]);assert.ok(white.r>.65&&white.g>.65&&white.b>.5,'rice must remain visible beyond the sleeve');
 nearColour(colourAt(bento,[.040,.2,-.014],[0,-1,0]),0x9d6236,'the tray needs a separate grilled protein compartment');
 nearColour(colourAt(bento,[.065,.2,.024],[0,-1,0]),0xe6c359,'rolled egg must be visible');
 nearColour(colourAt(bento,[.031,.2,.036],[0,-1,0]),0x668643,'greens must be visible without removing the sleeve');
 const sandwich=sakuraProductTemplate('sandwich').body;
 nearColour(colourAt(sandwich,[.2,.04,0],[-1,0,0]),0xecd274,'the cut edge should expose egg');
 nearColour(colourAt(sandwich,[.2,.04,.011],[-1,0,0]),0x769451,'the cut edge should expose lettuce');
 nearColour(colourAt(sandwich,[.2,.04,.018],[-1,0,0]),0xb9834b,'bread needs a crust surrounding the filling');
 const bun=sakuraProductTemplate('bun').body,centre=hit(bun,[0,.2,0],[0,-1,0]),shoulder=hit(bun,[.045,.2,0],[0,-1,0]);
 assert.ok(centre&&shoulder&&centre.point.y-shoulder.point.y>.020,'the steamed bun must have a round raised dome');
});

test('dessert layers, sealed cup lids and recessed can pull rings remain visible',()=>{
 const pudding=sakuraProductTemplate('pudding').body;
 nearColour(colourAt(pudding,[0,.006,.2],[0,0,-1]),0x9b5529,'the caramel layer needs a distinct lower surface');
 nearColour(colourAt(pudding,[0,.016,.2],[0,0,-1]),0xf0d591,'custard should be visible above caramel');
 const yogurt=sakuraProductTemplate('yogurt').body;
 nearColour(colourAt(yogurt,[0,.05,.2],[0,0,-1]),0xf3f0df,'the yogurt cup needs a cream layer');
 for(const id of ['pudding','yogurt','noodles']){
  const t=sakuraProductTemplate(id),printed=hit(t.art,[0,.3,0],[0,-1,0]),lid=hit(t.body,[0,.3,0],[0,-1,0]);
  assert.ok(printed&&lid,id+' needs a physical lid and a top print');
  assert.ok(printed.point.y-lid.point.y>=.00045&&printed.point.y-lid.point.y<.002,id+' lid print will fight with or float above the foil');
 }
 for(const id of ['coffee','beer']){
  const body=sakuraProductTemplate(id).body;
  nearColour(colourAt(body,[0,.3,-.010],[0,-1,0]),0x505850,id+' needs a dark recessed opening');
  const ring=hit(body,[.006,.3,.006],[0,-1,0]),lid=hit(body,[.020,.3,0],[0,-1,0]);
  assert.ok(ring&&lid&&ring.point.y-lid.point.y>.0008,id+' needs a raised pull ring inside its rim');
 }
});

test('printed food labels use the original brand cell and sit off the underlying surface',()=>{
 for(const id of ['rice','bento','sandwich','bun','pudding','yogurt','noodles']){
  const {body,art}=sakuraProductTemplate(id),uv=art.attributes.uv,slot=packagingSlot(id),col=slot%ATLAS_COLS,row=Math.floor(slot/ATLAS_COLS);
  for(let i=0;i<uv.count;i++){
   assert.ok(uv.getX(i)>col/ATLAS_SPAN&&uv.getX(i)<(col+1)/ATLAS_SPAN,id+' samples a different brand column');
   assert.ok(uv.getY(i)>1-(row+1)/ATLAS_ROWS&&uv.getY(i)<1-row/ATLAS_ROWS,id+' samples a different brand row');
  }
  for(let i=0;i<art.attributes.position.count;i+=3){
   const centre=faceCentre(art,i),normal=new T.Vector3().fromBufferAttribute(art.attributes.normal,i).normalize();
   const support=hit(body,centre.clone().addScaledVector(normal,.002).toArray(),normal.clone().negate().toArray());
   assert.ok(support,id+' has unsupported label triangle '+i/3);
   const clearance=support.distance-.002;
   assert.ok(clearance>.0004&&clearance<.007,id+' label clips or floats at triangle '+i/3+': '+clearance);
  }
 }
 // The narrow meal sleeve reads along its long axis. Stretching the full atlas
 // across its short axis makes brand names tall and compressed despite valid UVs.
 const sleeve=sakuraProductTemplate('bento').art,p=sleeve.attributes.position,uv=sleeve.attributes.uv;
 let width=0,height=0;
 for(let a=0;a<p.count;a++)for(let b=a+1;b<p.count;b++){
  const distance=new T.Vector3().fromBufferAttribute(p,a).distanceTo(new T.Vector3().fromBufferAttribute(p,b));
  if(Math.abs(uv.getY(a)-uv.getY(b))<1e-7&&Math.abs(uv.getX(a)-uv.getX(b))>.01)width=Math.max(width,distance);
  if(Math.abs(uv.getX(a)-uv.getX(b))<1e-7&&Math.abs(uv.getY(a)-uv.getY(b))>.01)height=Math.max(height,distance);
 }
 assert.ok(width/height>1.6&&width/height<3.5,'the sleeve compresses the printed brand across the short axis');
});

test('actual full-width food and flavour displays stand on real boards, share stock hiding, and retain clear customer approaches',async()=>{
 installDOM();globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async input=>String(input).startsWith('blob:')?oldFetch(input):new Response(await readFile(new URL('../assets/'+new URL(input).pathname.split('/assets/')[1],import.meta.url)));
 let display;
 try{
  const room=new T.Group();display=buildSakuraInterior({room,reg(){},action(){},exit(){}});assert.ok(await display.ready());
  const stock=restoreShopStock();display.updateStock(stock);room.updateMatrixWorld(true);
  for(const name of ['Sakura shelf edges','Sakura corners','Sakura surfaces'])assert.ok(room.getObjectByName(name),name+' was lost during integration');
  assert.ok(display.officeDoor?.pivot,'the moving office door was lost during integration');
  const fixtures=[];
  for(const root of [room.getObjectByName('Sakura shōten interior'),display.refrigerator.group])root.traverse(o=>{if(o.isMesh&&!o.material.transparent)fixtures.push(o);});
  const blocked=(x,z,r=.35)=>suppliedRoomBoundsBlocked(SAKURA_LAYOUT,x,z,r)||SAKURA_LAYOUT.colliders.some(c=>circleHitsRect(x,z,r,c));
  const nav=createNavigation(blocked,{step:.2,radius:.35,heightAt:()=>0,bounds:SAKURA_LAYOUT.bounds});
  const from={x:SAKURA_LAYOUT.entrance[0],z:SAKURA_LAYOUT.entrance[2]},targets=new Map(),down=new T.Vector3(0,-1,0),matrix=new T.Matrix4(),paired=new T.Matrix4(),drawn=[],batches=[],glassMaterials=new Set();let extras=0;
  for(const spec of SHOP_STOCK){
   const goods=room.getObjectByName('Sakura '+spec.id+' goods'),packaging=room.getObjectByName('Sakura '+spec.id+' packaging'),wrapper=room.getObjectByName('Sakura '+spec.id+' clear wrapper'),template=sakuraProductTemplate(spec.id);
   assert.ok(goods&&packaging,spec.id+' is missing its actual display');
   const pair=[goods,packaging,...(wrapper?[wrapper]:[])],shift=packaging.geometry.attributes.atlasShift;
   assert.equal(packaging.material.name,'Sakura shelf packaging (flavours)');
   assert.ok(shift&&shift.isInstancedBufferAttribute&&shift.count===goods.count,spec.id+' lost its flavour attribute');
   assert.ok(goods.instanceColor&&goods.instanceColor.count===goods.count,spec.id+' lost its flavour body tint');
   assert.equal(!!wrapper,!!template.glass,spec.id+' lost its clear food wrapping');
   if(wrapper){glassMaterials.add(wrapper.material);assert.equal(wrapper.material.depthWrite,false);assert.equal(wrapper.material.transparent,true);}
   assert.ok(goods.count>=spec.capacity);extras+=goods.count-spec.capacity;
   const matrices=[];
   for(let slot=0;slot<goods.count;slot++){
    goods.getMatrixAt(slot,matrix);matrices.push(matrix.clone());assert.ok(Math.abs(matrix.determinant())>.9,spec.id+':'+slot+' is absent on a full shelf');
    for(const m of pair){assert.equal(m.count,goods.count);m.getMatrixAt(slot,paired);assert.deepEqual(paired.elements,matrix.elements,spec.id+':'+slot+' wrapper/art drifted from the food');}
    const bounds=template.bounds.clone().applyMatrix4(matrix),centre=bounds.getCenter(new T.Vector3());drawn.push({id:spec.id+':'+slot,bounds});
    for(const [x,z] of [[centre.x,centre.z],[bounds.min.x+.003,bounds.min.z+.003],[bounds.max.x-.003,bounds.max.z-.003],[bounds.min.x+.003,bounds.max.z-.003],[bounds.max.x-.003,bounds.min.z+.003]]){
     ray.set(new T.Vector3(x,bounds.min.y+.008,z),down);ray.near=0;ray.far=.026;
     assert.ok(ray.intersectObjects(fixtures,false).length,spec.id+':'+slot+' floats or overhangs a real board at '+[x,z]);
    }
    const u=packaging.geometry.attributes.uv,du=shift.getX(slot),dv=shift.getY(slot);
    for(let i=0;i<u.count;i++)assert.ok(u.getX(i)+du>0&&u.getX(i)+du<1&&u.getY(i)+dv>0&&u.getY(i)+dv<1,spec.id+':'+slot+' flavour print leaves the atlas');
    if(slot<spec.capacity){
     const key=spec.id+':'+slot,position=display.unitPositions.get(key),approach=display.unitApproaches.get(key),placed=new T.Vector3().setFromMatrixPosition(matrix);
     assert.ok(position&&approach,key+' loses its actual stock reach target');
     assert.ok(Math.hypot(position[0]-placed.x,position[2]-placed.z)<1e-6,key+' reach target differs from its drawn slot');
     targets.set(approach[0]+','+approach[2],{id:key,approach:{x:approach[0],z:approach[2]}});
    }
   }
   batches.push({spec,pair,matrices});
  }
  assert.ok(extras>0,'the upstream full-width decorative flavour facings were lost');assert.equal(glassMaterials.size,1,'food wrappers should share one material');
  assert.equal(display.unitPositions.size,SHOP_STOCK.reduce((n,s)=>n+s.capacity,0),'decorative flavours must not become sellable stock');
  const overlaps=[];
  for(let i=0;i<drawn.length;i++)for(let j=i+1;j<drawn.length;j++){
   const a=drawn[i].bounds,b=drawn[j].bounds;
   if(['x','y','z'].every(axis=>Math.min(a.max[axis],b.max[axis])-Math.max(a.min[axis],b.min[axis])>.003))overlaps.push(drawn[i].id+' / '+drawn[j].id);
  }
  assert.deepEqual(overlaps,[],'full-width decorative goods overlap sellable packs');
  for(const {id,approach} of targets.values()){
   assert.ok(!blocked(approach.x,approach.z,.35),id+' moves its customer into a fixture');
   const path=nav.path(from,approach),end=path.at(-1);assert.ok(end&&Math.hypot(end[0]-approach.x,end[1]-approach.z)<.25,id+' loses its actual shelf approach');
  }
  for(const s of Object.values(stock))s.shelf=0;display.updateStock(stock);
  for(const {spec,pair,matrices} of batches)for(const m of pair)for(let slot=0;slot<m.count;slot++){
   m.getMatrixAt(slot,matrix);
   if(slot<spec.capacity)assert.ok(Math.abs(matrix.determinant())<1e-9,spec.id+':'+slot+' leaves a sold-out food/label/wrapper visible');
   else assert.deepEqual(matrix.elements,matrices[slot].elements,spec.id+':'+slot+' decorative flavour disappeared with stock');
  }
 }finally{display?.dispose();globalThis.fetch=oldFetch;}
});

test('checkout equipment remains over existing furniture and both LCDs face the shopper without housing occlusion',()=>{
 const room=new T.Group(),equipment=buildSakuraCounterDetail(room),bodies=equipment.children.find(o=>o.name.endsWith(' bodies')),prints=equipment.children.find(o=>o.name.endsWith(' print'));
 assert.equal(equipment.children.length,3,'two shared detail draws plus the animated drawer');
 const cabinet=SAKURA_TILL_CABINET,copyCollider=SAKURA_LAYOUT.colliders.find(c=>Math.abs(c.x-COPY_MACHINE.x)<.01&&Math.abs(c.z-COPY_MACHINE.z)<.01);assert.ok(copyCollider);
 for(const p of worldVertices(bodies))assert.ok((p.x>=4.54-1e-6&&p.x<=5.06+1e-6&&p.z>=.08-1e-6&&p.z<=3.86+1e-6&&p.y>=FURNITURE_HEIGHTS.serviceCounter-1e-6)||(p.x>=cabinet.x0-1e-6&&p.x<=cabinet.x1+1e-6&&p.z>=cabinet.z0-1e-6&&p.z<=cabinet.z1+1e-6&&p.y>=cabinet.boards[1]-1e-6)||(p.x>=copyCollider.x-copyCollider.w/2-1e-6&&p.x<=copyCollider.x+copyCollider.w/2+1e-6&&p.z>=copyCollider.z-copyCollider.d/2-1e-6&&p.z<=copyCollider.z+copyCollider.d/2+1e-6&&p.y>=.5),'checkout equipment enters a walking aisle at '+p.toArray());
 equipment.updateMatrixWorld(true);
 for(const id of ['pos','customer']){
  const feature=equipment.userData.features.find(f=>f.id===id);assert.ok(feature);
  const [x,y,z]=feature.position;ray.set(new T.Vector3(3.9,y,z),new T.Vector3(1,0,0));ray.near=0;ray.far=2;
  const visible=ray.intersectObjects([bodies,prints],false)[0];assert.equal(visible?.object,prints,id+' LCD is hidden by its housing');
  assert.ok(Math.abs(visible.point.x-x)<.00001,id+' ray hit a different print');
  ray.set(new T.Vector3(x+.001,y,z),new T.Vector3(1,0,0));const support=ray.intersectObject(bodies,false)[0];
  assert.ok(support&&support.distance>=.0028&&support.distance<=.0032,id+' screen must stay 4 mm ahead of the housing');
 }
});

test('the hot case contains recognizable food on three occupied trays without new floor geometry',()=>{
 const room=new T.Group(),food=buildSakuraHotFood(room,HOT_CASE),body=food.children.find(o=>o.name.endsWith(' bodies'));assert.ok(body);
 assert.equal(food.children.length,2,'warmer food should stay two shared draws');
 const C=HOT_CASE;
 for(const p of worldVertices(body))assert.ok(p.x>=C.x-C.w/2-1e-6&&p.x<=C.x+C.w/2+1e-6&&p.z>=C.z-C.d/2-1e-6&&p.z<=C.z+C.d/2+1e-6&&p.y>=C.top&&p.y<=C.top+C.h,'warmer contents clip the case at '+p.toArray());
 for(const [i,level] of [C.top+.065,C.top+.165,C.top+.265].entries()){
  const hits=hit(body.geometry,[[C.x-.045,C.x-.07,C.x-.005][i],level+.080,C.z-.14],[0,-1,0]);assert.ok(hits&&hits.point.y>level+.012&&hits.point.y<level+.080,'tray '+i+' contains no food above its board');
 }
});

test('detail print content has separate bounded baselines and matches the actual hot-food offer',()=>{
 const calls=[],stack=[],offset=[0,0],ctx={fillStyle:'',font:'',textAlign:'',textBaseline:'',fillRect(){},save(){stack.push([...offset]);},restore(){offset.splice(0,2,...stack.pop());},translate(x,y){offset[0]+=x;offset[1]+=y;},fillText(text,x,y,width){calls.push({text,x:x+offset[0],y:y+offset[1],width,font:this.font});}};
 drawSakuraDetailPrints(ctx);assert.equal(calls.length,SAKURA_DETAIL_PRINTS.length*3);
 for(const [i,p] of SAKURA_DETAIL_PRINTS.entries()){
  const lines=calls.slice(i*3,i*3+3);assert.deepEqual(lines.map(l=>l.text),[p.title,p.line,p.foot]);
  assert.equal(new Set(lines.map(l=>l.y)).size,3,p.id+' overprints its copy');
  for(const l of lines)assert.ok(l.width<=226&&l.x%256===128&&l.y%128>12&&l.y%128<116,p.id+' print exceeds its cell gutter');
 }
 const hot=SAKURA_DETAIL_PRINTS.find(p=>p.id==='hot');assert.ok(hot.line.includes('Nikuman ¥'+HOT_SNACKS.find(s=>s.id==='nikuman').cost),'warmer price disagrees with its actual service offer');
 const categories=SAKURA_DETAIL_PRINTS.filter(p=>['rice','sandwich','dairy'].includes(p.id));assert.equal(categories.length,3);assert.ok(categories.every(p=>p.title&&p.line&&p.foot));
});
