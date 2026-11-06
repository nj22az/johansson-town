import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {SAKURA_BAND_DESIGN as D,runLength,boards} from '../src/world/interiors/sakura-band.js';
import {buildSakuraBand,SAKURA_BAND} from '../src/world/interiors/sakura-cheer.js';
import {SAKURA_SHELL} from '../src/world/interiors/sakura-shell.js';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {measure} from '../tools/sakura-band-audit.mjs';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';

/** The owner (24 October 2026): "The banner is not good, I think it needs cad specific as it's ugly there." Drawings
 * SK-WB-001..003 rev A (docs/qa/sakura-wall-band/) and their data, sakura-band.js. */

test('each wall is lettered once, in its own words, every word inside its allotted width',()=>{
 installDOM();const calls=[];const real=globalThis.document.createElement.bind(globalThis.document);
 globalThis.document.createElement=tag=>{const el=real(tag);if(tag==='canvas'){const inner=el.getContext('2d');
  el.getContext=()=>new Proxy(inner,{get:(t,k)=>k==='fillText'?(s,x,y,max)=>calls.push({s,x,max}):typeof t[k]==='function'?t[k].bind(t):t[k],set:(t,k,v)=>{t[k]=v;return true;}});}return el;};
 try{buildSakuraBand(new THREE.Group());}finally{globalThis.document.createElement=real;}
 for(const run of D.runs){
  const L=runLength(run);
  for(const it of run.items.filter(i=>i.text)){
   const drawn=calls.filter(c=>c.s===it.text);
   assert.equal(drawn.length,1,`"${it.text}" lettered exactly once`);
   assert.equal(drawn[0].max,it.w,'and never wider than its width');
   assert.ok(it.u-it.w/2>=120&&it.u+it.w/2<=L-120,`"${it.text}" stays 120 mm inside its ${run.id} boards`);
  }
  for(const [a,b] of boards(run))assert.ok(b-a<=D.board.stock,'boards come in stock lengths');
 }
 assert.ok(!calls.some(c=>/^Sakura Shop$/.test(c.s)&&calls.filter(d=>d.s===c.s).length>1),'the name is not repeated round the room');
});

test('the band clears the ceiling beams, and nothing else on the walls reaches into it',()=>{
 assert.ok(D.cap.y1<=SAKURA_SHELL.ceiling*1000-160-10,'cap 10 mm under the beams (bottom 2820)');
 assert.equal(SAKURA_BAND.y0,D.bead.y0/1000,'the stripe hangs under the bead');
 installDOM();
 const room=new THREE.Group();buildSakuraInterior({room,reg(){},action(){},exit(){}});
 const res=measure(room);
 for(const [id,r] of Object.entries(res.runs)){
  assert.equal(r.boardFace,D.board.face,`${id}: the band's face stays 60 mm off the wall`);
  const intruders=Object.keys(r.inside).filter(k=>!k.startsWith('Sakura wall'));
  assert.deepEqual(intruders,[],`${id}: only the band and its stripe in the band's volume`);
 }
 // the band's own pieces do not flash against one another or the stripe
 const band=new THREE.Group();room.traverse(o=>{if(o.isMesh&&o.name.startsWith('Sakura wall'))band.add(o.clone());});
 assert.deepEqual(coplanarOverlaps(band,{tolerance:.002,minArea:.0004}),[]);
});
