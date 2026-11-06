import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

test('actual fitted Minato releases private bar geometry on every room exit and preserves cached model buffers',async()=>{
 installDOM();
 const previous={fetch:globalThis.fetch,self:globalThis.self,bitmap:globalThis.createImageBitmap};
 globalThis.self=globalThis;
 // Load the actual fitted GLB and retain its real geometry, materials and texture
 // objects. Texture pixels and uploaded resource counts are checked by WebKit.
 globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
 globalThis.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url);
  if(url.protocol==='blob:')return previous.fetch(input,options);
  assert.ok(url.pathname.startsWith('/johansson-town/assets/models/izakaya/'));
  const bytes=await readFile(new URL('../assets/models/izakaya/'+url.pathname.split('/').at(-1),import.meta.url));
  return new Response(bytes,{headers:{'Content-Type':'model/gltf-binary'}});
 };
 try{
  const api=await import('../src/world/izakaya.js'),{minatoAssets}=await import('../src/world/interiors/minato-asset-cache.js');
  await api.preloadIzakaya(['interior']);assert.equal(api.izakayaReady('interior'),true);
  const base=new Map(),baseMaterials=new Set();let baseDisposals=0,materialDisposals=0;
  minatoAssets.get('interior').traverse(o=>{
   if(!o.isMesh)return;
   if(!base.has(o.geometry)){
    base.set(o.geometry,{attributes:{...o.geometry.attributes},morphAttributes:{...o.geometry.morphAttributes},index:o.geometry.index,indices:[...o.geometry.index.array]});
    o.geometry.addEventListener('dispose',()=>baseDisposals++);
   }
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(!baseMaterials.has(m)){
    baseMaterials.add(m);m.addEventListener('dispose',()=>materialDisposals++);
   }
  });
  const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8'),start=source.indexOf('function clearRoom('),end=source.indexOf('\nfunction roomShell(',start);
  assert.ok(start>=0&&end>start);const clear=source.slice(start,end),noop=()=>{},service={restore:noop,cancel:noop,hide:noop};
  for(let visit=0;visit<3;visit++){
   const room=new THREE.Group(),layout=api.buildIzakayaRoom({room,reg:noop,collider:noop,action:noop,exit:noop,
    exploration:{state:{},show:noop,save:noop,close:noop}}),privateIndices=[],copies=new Map();
   const model=room.getObjectByName('Minato interior');assert.ok(model,'Use the imported fitted model, not the fallback shell');
   model.traverse(o=>{
    if(!o.isMesh||base.has(o.geometry))return;
    const geometry=o.geometry,original=[...base.keys()].find(g=>g.attributes.position===geometry.attributes.position);
    assert.ok(original,'The per-room wrapper borrows cached vertex buffers');
    assert.notEqual(geometry.index,original.index,'Its edited index belongs to this visit');
    const record={mesh:o,geometry,original,disposed:0};
    geometry.addEventListener('dispose',()=>{
     record.disposed++;
     assert.deepEqual(Object.keys(geometry.attributes),[],'Do not delete borrowed GPU vertex buffers during geometry disposal');
     assert.deepEqual(geometry.morphAttributes,{},'Borrowed morph buffers are detached too');
    });privateIndices.push(record);
   });
   assert.ok(privateIndices.length,'Exercise the room-private geometry that formerly escaped the shared-model cleanup');
   for(const piece of [layout.bar.door.piece,layout.bar.bottle.piece])piece.traverse(o=>{
    if(!o.isMesh||copies.has(o.geometry))return;
    const record={name:o.name,disposed:0};o.geometry.addEventListener('dispose',()=>record.disposed++);copies.set(o.geometry,record);
   });
   assert.ok(copies.size,'Extracted door and bottle triangles are owned by the live bar');
   // The door may be open and the bottle in Thao's hand when the player leaves.
   // Both must clean up even if the later generic room traversal cannot see them.
   if(visit%2)layout.bar.doorOpen=.5;
   const held=new THREE.Group();held.attach(layout.bar.bottle.piece);
   const c={room,johansson:null,townSections:{invalidate:noop},shopStreetView:{dispose:noop},indoorCeilings:null,
    activeRoomLayout:layout,sakuraShop:{hide:noop},showShopThroughWindow:noop,izakayaTV:layout.television,
    storeService:null,ramenPlayerService:null,venueService:null,beerService:null,workplaceResidents:service,
    bookshopCustomers:service,neighbourChats:service,chatBubble:service,izakayaGuests:service,
    onsenGuests:service,hideRamen:noop,homeGuests:service,roomColliders:[],interactables:[],boxCache:new Map()};
   vm.runInNewContext(clear+'\nclearRoom();',c);
   assert.equal(room.children.length,0);assert.equal(held.children.length,0);
   for(const p of privateIndices){assert.equal(p.disposed,1,p.mesh.name+' releases its private wrapper');assert.equal(p.mesh.geometry,p.original,'Restore the cached source on the retired clone');}
   for(const p of copies.values())assert.equal(p.disposed,1,p.name+' releases its extracted triangles');
   // Service cancellation runs after layout disposal in clearRoom. Returning its
   // held bottle must not reattach disposed meshes or allocate another resource.
   layout.bar.bottle.home();layout.bar.doorOpen=0;layout.bar.dispose();layout.bar.dispose();
   assert.equal(room.children.length,0);assert.equal(layout.bar.group.children.includes(layout.bar.bottle.piece),false);
   for(const p of privateIndices)assert.equal(p.disposed,1,'Private cleanup is idempotent');
   for(const p of copies.values())assert.equal(p.disposed,1,'Extracted cleanup is idempotent');
   assert.equal(baseDisposals,0);assert.equal(materialDisposals,0,'The fitted model owns the borrowed materials');
   for(const [geometry,record] of base){
    assert.deepEqual(geometry.attributes,record.attributes);assert.deepEqual(geometry.morphAttributes,record.morphAttributes);assert.equal(geometry.index,record.index);
    assert.deepEqual([...geometry.index.array],record.indices,'Lifting and disposal never edit the cached model');
   }
  }
 }finally{globalThis.fetch=previous.fetch;globalThis.self=previous.self;globalThis.createImageBitmap=previous.bitmap;}
});
