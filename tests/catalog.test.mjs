import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CATALOG} from '../src/catalog/catalog-data.js';
import {catalogCard,catalogIds,assetPlacement,placeAsset,loadAsset,assetLoaded,provideAsset,snapYaw} from '../src/catalog/catalog.js';
import {catalogSource,OUTPUT} from '../tools/catalog/build-catalog.mjs';
import {parseCatalogModel,provideCatalog} from './catalog-fixture.mjs';
import {circleHitsRect} from '../physics.js';
installDOM();

// World's asset catalogue (briefs/NEXT.md §5; the creator, 2026-10-10: "I would like to build assets in studio and assemble
// them in world"): what Johansson Studio publishes into assets/catalog, compiled into catalog-data.js and placed by id.
const dir=new URL('../assets/catalog/',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,dir),'utf8'));
const meshes=root=>{const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
const triangles=m=>(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3;
const near=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;

test('loadAsset without a page resolves false and fetches nothing (the room tests and the film build rooms in Node)',async()=>{
 const before=globalThis.fetch;let asked=0;globalThis.fetch=async()=>{asked++;throw new Error('no fetch here');};
 try{assert.equal(assetLoaded('massage-chair'),false);assert.equal(await loadAsset('massage-chair'),false);assert.equal(asked,0);}
 finally{globalThis.fetch=before;}
 assert.throws(()=>loadAsset('jet-ski'),/No "jet-ski" in World's catalogue/);
});

test('a place built before its model arrives is filled in when it comes, and told so before anything draws it',async()=>{
 // As a host that builds without waiting does (Johansson Studio's Build scene): the room first, the model after.
 const scene=await parseCatalogModel('massage-chair');assert.equal(assetLoaded('massage-chair'),false);
 const room=new THREE.Group(),seen=[];
 const chair=placeAsset('massage-chair',{parent:room,x:4.505,z:3.55,yaw:-Math.PI/2,omit:['Massage chair cord'],onModel:copy=>seen.push(meshes(copy).length)});
 assert.equal(chair.loaded,false);assert.equal(chair.object.children.length,0,'nothing drawn yet');
 assert.equal(chair.colliders.length,2,'its colliders and seat are there at once, from the card');assert.deepEqual(chair.seat('seat').position,[4.25,0,3.55]);
 provideAsset('massage-chair',scene);
 assert.equal(chair.loaded,true);assert.deepEqual(seen,[11],'onModel saw the copy as it went in (13 meshes less the cord\'s 2)');
 assert.equal(await chair.ready,true);assert.equal(chair.part('Massage chair cord'),null);
 // One that is taken away before its model comes is never filled in.
 chair.dispose();assert.equal(room.children.length,0);
 assert.equal(Object.isFrozen(CATALOG['massage-chair'].colliders[0]),true,'a place cannot change a card');
});

test('catalog-data.js is what assets/catalog makes (node tools/catalog/build-catalog.mjs)',async()=>{
 assert.equal(await readFile(new URL('../'+OUTPUT,import.meta.url),'utf8'),await catalogSource(),
  'catalog-data.js is out of date: run node tools/catalog/build-catalog.mjs');
});

test('the index, the folders and the cards agree, and every asset says who it is for, why, and where',async()=>{
 const index=await json('index.json');assert.equal(index.format,1);
 const folders=(await readdir(dir,{withFileTypes:true})).filter(d=>d.isDirectory()).map(d=>d.name).sort();
 assert.deepEqual(index.assets.map(e=>e.id).sort(),folders,'every folder is listed, every entry has its folder');
 assert.deepEqual(catalogIds().sort(),folders);
 for(const e of index.assets){
  const card=await json(e.card),C=catalogCard(e.id);
  assert.equal(e.from,'johansson-studio',e.id+' came from Johansson Studio');assert.equal(card.source.from,'johansson-studio');
  assert.equal(card.format,1);assert.equal(card.id,e.id);assert.equal(card.version,e.version);assert.equal(C.version,e.version);
  for(const f of [e.model,e.card,e.hero].filter(Boolean))assert.ok((await stat(new URL(f,dir))).size>0,f);
  const sha=createHash('sha256').update(await readFile(new URL(e.model,dir))).digest('hex').slice(0,12);
  assert.equal(C.modelSha,sha,e.id+': the model on disk is the one the card was compiled with');
  for(const k of ['for','why','where'])assert.ok(C.purpose[k].length>40,e.id+' purpose.'+k);
  assert.ok(card.checks.every(c=>c.ok),e.id+' passed every one of Studio\'s checks: '+card.checks.filter(c=>!c.ok).map(c=>c.id));
  assert.ok(card.checks.some(c=>c.id==='brands'&&c.ok),e.id+': no real brands');
  assert.ok(C.measured.triangles<=C.budget.triangles&&C.measured.materials<=C.budget.materials,e.id+' within its phone budget');
 }
});

test('the massage chair\'s model as World loads it: its parts by Studio\'s names, its measured size, standing on the floor',async()=>{
 const card=catalogCard('massage-chair'),scene=await parseCatalogModel('massage-chair');
 // GLTFLoader's names before World puts Studio's back.
 const raw=[];scene.traverse(o=>raw.push(o.name));assert.ok(raw.includes('Massage_chair_back'));
 provideAsset('massage-chair',scene);assert.ok(assetLoaded('massage-chair'));
 const chair=placeAsset('massage-chair');assert.equal(chair.loaded,true);assert.equal(await chair.ready,true);
 const names=new Set();chair.object.traverse(o=>names.add(o.name));
 for(const p of card.parts)assert.ok(names.has(p.name),p.name);
 assert.ok(![...names].some(n=>/_/.test(n)),'no GLTFLoader names left: '+[...names].filter(n=>/_/.test(n)));
 const all=meshes(chair.object);
 assert.equal(all.length,card.measured.meshes);
 assert.equal(all.reduce((s,m)=>s+triangles(m),0),card.measured.triangles);
 assert.equal(new Set(all.map(m=>m.material)).size,card.measured.materials);
 chair.object.updateMatrixWorld(true);
 const whole=new THREE.Box3().setFromObject(chair.object);assert.ok(whole.min.y>-.001,'nothing below the floor: '+whole.min.y);
 // The body: everything but the loose parts (the cord on the floor), as Studio measured it.
 const loose=card.parts.filter(p=>p.loose).map(p=>chair.part(p.name)),body=new THREE.Box3();
 for(const m of all){let free=false;for(let p=m;p;p=p.parent)if(loose.includes(p))free=true;if(!free)body.expandByObject(m);}
 for(const [k,i] of [['x',0],['y',1],['z',2]]){assert.ok(near(body.min[k],card.measured.body.min[i],1e-3),'body min '+k+' '+body.min[k]);assert.ok(near(body.max[k],card.measured.body.max[i],1e-3),'body max '+k+' '+body.max[k]);}
 chair.dispose();
});

test('assetPlacement: the card in a place\'s frame at yaw 0, ±π/2 and π, and at an odd angle',()=>{
 const card=catalogCard('massage-chair');
 assert.equal(snapYaw(3.1416),Math.PI);assert.equal(snapYaw(-1.5708),-Math.PI/2);assert.equal(snapYaw(-Math.PI),Math.PI);assert.equal(snapYaw(.3),.3);assert.ok(near(snapYaw(.3+2*Math.PI),.3,1e-12));
 const at=(yaw)=>assetPlacement('massage-chair',{x:4.505,z:3.55,yaw});
 // The onsen's: a quarter turn clockwise (yaw -π/2): room x = 4.505 - z, room z = 3.55 + x.
 const q=at(-1.5708);
 assert.equal(q.yaw,-Math.PI/2);assert.deepEqual(q.facing,[-1,0,0]);
 assert.deepEqual(q.toPlace([.1,.2,.3]),[4.205,.2,3.65]);
 assert.deepEqual(q.colliders.map(({x,z,w,d,height,minY,yaw})=>({x,z,w,d,height,minY,yaw})),[
  {x:4.505,z:3.55,w:.61,d:.9,height:1.14,minY:0,yaw:undefined},{x:4.14,z:3.55,w:.12,d:.43,height:.33,minY:0,yaw:undefined}]);
 assert.deepEqual(q.colliders.map(c=>[c.asset,c.part]),[['massage-chair','body'],['massage-chair','leg rest']]);
 const seat=q.seat('seat');
 assert.deepEqual([seat.position,seat.stand,seat.yaw,seat.surfaceY,seat.eyeY],[[4.25,0,3.55],[3.4,0,3.55],Math.PI/2,.5,1.12]);
 assert.deepEqual(q.spot('coin').position,[3.72,0,3.3]);
 assert.deepEqual(q.anchor('timer-display'),[4.2045,.616,3.139]);assert.throws(()=>q.anchor('cup-holder'),/no anchor "cup-holder"/);
 // Square to the room, unturned and turned round: the same box, its sides swapped only at a quarter turn.
 const zero=at(0),half=at(Math.PI),back=at(Math.PI/2);
 assert.deepEqual(zero.colliders.map(c=>[c.w,c.d]),[[.9,.61],[.43,.12]]);assert.deepEqual(half.colliders.map(c=>[c.w,c.d]),[[.9,.61],[.43,.12]]);
 assert.deepEqual(back.colliders.map(c=>[c.w,c.d]),[[.61,.9],[.12,.43]]);
 assert.deepEqual(zero.facing,[0,0,1]);assert.deepEqual(half.facing,[0,0,-1]);assert.deepEqual(back.facing,[1,0,0]);
 assert.deepEqual(half.colliders[1].x,4.505);assert.ok(near(half.colliders[1].z,3.55-.365));
 assert.equal(zero.seat('seat').yaw,Math.PI);assert.equal(half.seat('seat').yaw,0);
 // At an odd angle the boxes turn with it, and a point of the leg rest stays inside its box (physics.js reads the yaw).
 const odd=at(.3),leg=odd.colliders[1];assert.ok(near(leg.yaw,.3));assert.deepEqual([leg.w,leg.d],[.43,.12]);
 const [px,,pz]=odd.toPlace([.2,0,.42]);assert.ok(circleHitsRect(px,pz,0,leg),'a corner of the leg rest is in its box');
 const [ox,,oz]=odd.toPlace([.25,0,.42]);assert.ok(!circleHitsRect(ox,oz,0,leg),'and a point past its side is not');
 assert.ok(card.colliders.every(c=>c.height>0));
 assert.throws(()=>assetPlacement('jet-ski'),/No "jet-ski"/);
});

test('placeAsset: a copy of its own (materials), the same geometry and textures, what a place draws itself left out',async()=>{
 await provideCatalog('massage-chair');
 const omit=['Massage chair lamp','Massage chair timer display','Massage chair rollers','Massage chair cord'];
 const room=new THREE.Group(),a=placeAsset('massage-chair',{parent:room,x:4.505,z:3.55,yaw:-Math.PI/2,omit}),b=placeAsset('massage-chair',{parent:room});
 assert.equal(await a.ready,true);assert.equal(a.object.parent,room);assert.equal(a.object.userData.sharedAsset,true);
 for(const name of omit)assert.equal(a.part(name),null,name+' left out');for(const name of omit)assert.ok(b.part(name),name+' kept in the other');
 assert.equal(meshes(a.object).length,8,'the rest of the chair: 8 meshes');
 assert.equal(meshes(a.object).reduce((s,m)=>s+triangles(m),0),5924);
 assert.ok(a.part('Coin box price')&&a.part('Massage chair coin box'),'the coin box and its price stay');
 const by=(p,name)=>meshes(p.object).find(m=>m.name===name);
 assert.equal(by(a,'Massage chair back').geometry,by(b,'Massage chair back').geometry,'one geometry for both');
 assert.notEqual(by(a,'Massage chair back').material,by(b,'Massage chair back').material,'each its own materials');
 assert.equal(by(a,'Coin box price').material.map,by(b,'Coin box price').material.map,'one texture for both');
 assert.equal(by(a,'Coin box price').material.map.userData.sharedAsset,true);
 // glTF keeps no shadows: solid parts cast and take them, printed labels only take them, the glow neither.
 for(const m of meshes(b.object)){const glow=m.material.isMeshBasicMaterial,printed=!!m.material.map;
  assert.deepEqual([m.castShadow,m.receiveShadow],[!glow&&!printed,!glow],m.name);}
 assert.ok(meshes(b.object).some(m=>m.material.isMeshBasicMaterial),'the running lamp is the unlit glow');
 // Where it stands, turned to face the lobby: from the foot box's front (x 4.08) to the back's (4.81), z 3.1–4.0, as its colliders say.
 room.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(a.object);
 assert.ok(near(box.min.x,4.08,1e-3)&&near(box.max.x,4.81,1e-3)&&near(box.min.z,3.1,1e-3)&&near(box.max.z,4,1e-3)&&near(box.min.y,0,1e-3)&&near(box.max.y,1.14,1e-3),
  'x 4.08–4.81, z 3.1–4.0: '+[box.min.x,box.max.x,box.min.z,box.max.z,box.min.y,box.max.y]);
 for(const c of a.colliders){const b=box.clone().intersect(new THREE.Box3(new THREE.Vector3(c.x-c.w/2,0,c.z-c.d/2),new THREE.Vector3(c.x+c.w/2,c.height,c.z+c.d/2)));assert.ok(!b.isEmpty(),c.part);}
 assert.throws(()=>placeAsset('massage-chair',{omit:['Massage chair ashtray']}),/no part or piece "Massage chair ashtray"/);
 // dispose frees this copy's materials (and only this copy's).
 const freed=new Set();for(const m of meshes(a.object))m.material.addEventListener('dispose',()=>freed.add(m.material));
 const kept=by(b,'Massage chair back').material;let keptFreed=false;kept.addEventListener('dispose',()=>{keptFreed=true;});
 a.dispose();assert.equal(a.object.parent,null);assert.equal(freed.size,4,'its four materials freed (matte, metal and the two printed labels)');assert.equal(keptFreed,false);
 b.dispose();
});

