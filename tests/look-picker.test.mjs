import test from 'node:test';
import assert from 'node:assert/strict';
import {lookSwatch} from '../src/ui/look-picker.js';
import {LOOKS} from '../src/render/looks.js';

test('every look has its own little picture and a one-word name',()=>{
 const pictures=new Set();
 for(const id of Object.keys(LOOKS)){
  const svg=lookSwatch(id);
  assert.match(svg,/^<svg viewBox="0 0 48 48"/,id);
  pictures.add(svg);
  assert.ok(LOOKS[id].short&&LOOKS[id].short.length<=8,`${id} has a short name`);
 }
 assert.equal(pictures.size,Object.keys(LOOKS).length,'no two looks share a picture');
});

test('two pictures of the same look on one page do not share pattern ids',()=>{
 const a=lookSwatch('manga','picker'),b=lookSwatch('manga','free');
 const ids=s=>[...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ids(a).length>0);
 for(const id of ids(a))assert.ok(!ids(b).includes(id),id);
});
