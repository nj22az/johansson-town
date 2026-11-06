import {installDOM} from './fixtures.mjs';
installDOM();
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {IZAKAYA_POSTERS,hangIzakayaPosters} from '../src/world/interiors/izakaya-posters.js';

test('Minato hangs four inspectable posters',()=>{
 const room=new THREE.Group(),hits=[],calls=[];
 const posters=hangIzakayaPosters({
  room,
  reg:(o,label,fn,inside)=>hits.push({o,label,fn,inside}),
  action:(...a)=>calls.push(a),
 });
 assert.equal(IZAKAYA_POSTERS.length,4);
 assert.equal(posters.children.length,4);
 for(const poster of posters.children){
  const height=poster.geometry.parameters.height;
  assert.ok(poster.position.y+height/2<2.805,'The entire print clears the picture rail');
  assert.ok(poster.position.y-height/2>1.05,'The print clears the timber dado');
 }
 assert.equal(hits.length,4);
 for(const spec of IZAKAYA_POSTERS){
  const hit=hits.find(h=>h.label==='Read '+spec.title);
  assert.ok(hit);assert.equal(hit.inside,true);hit.fn();
  if(spec.id==='yakitori')assert.ok(spec.position[2]+.54<3.29,'The print clears the west sconce');
 }
 assert.equal(calls.length,4);
 assert.equal(calls[0][0],'inspect');
});

test('Minato poster files are present as webp',async()=>{
 for(const spec of IZAKAYA_POSTERS){
  const bytes=await readFile(new URL('../assets/graphics/izakaya/'+spec.file,import.meta.url));
  assert.ok(bytes.length>20000,spec.file);
  assert.equal(bytes[0],0x52);assert.equal(bytes[1],0x49);assert.equal(bytes[2],0x46);assert.equal(bytes[3],0x46);
 }
});

test('Sakura portrait keeps its full aspect and clears the west-wall fixtures',()=>{
 const spec=IZAKAYA_POSTERS.find(p=>p.id==='sakura');
 assert.ok(Math.abs(spec.size[0]/spec.size[1]-.75)<1e-12);
 assert.ok(spec.position[2]-spec.size[0]/2>-4.55,'Clears the west speaker');
 assert.ok(spec.position[2]+spec.size[0]/2<-3.48,'Clears the next post and bottle shelf');
});
