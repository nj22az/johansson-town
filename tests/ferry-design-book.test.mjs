import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build,hydrostatics,offsetsTable,breadthAt} from '../tools/ferry-drawings.mjs';
import {FERRY_SHIP,FERRY_GA,FERRY_LOADS} from '../src/world/ferry-ship.js';

test('the committed design book is drawn from the current data (node tools/ferry-drawings.mjs)',()=>{
 for(const [name,body] of Object.entries(build()))assert.equal(readFileSync(new URL('../docs/minato-maru/'+name,import.meta.url),'utf8'),body,'docs/minato-maru/'+name+' is stale: run node tools/ferry-drawings.mjs');
});

test('the hydrostatics behave like a ship’s: displacement grows with draft, LCB and LCF lie within the waterline, KM above KB',()=>{
 let last=null;
 for(const t of [1.0,1.3,1.6,1.9,2.2,2.5]){
  const h=hydrostatics(t);
  assert.ok(h.displacement>0&&(!last||h.displacement>last.displacement),'displacement at '+t);
  assert.ok(h.lcb>0&&h.lcb<FERRY_SHIP.length&&h.lcf>0&&h.lcf<FERRY_SHIP.length,'LCB/LCF at '+t);
  assert.ok(h.kb>0&&h.kb<t&&h.kmT>h.kb&&h.tpc>0,'KB, KM, TPC at '+t);
  assert.ok(h.cb>.3&&h.cb<.9&&h.cp>=h.cb-1e-9&&h.cwp>=h.cb-1e-9,'coefficients at '+t+': '+JSON.stringify([h.cb,h.cp,h.cwp]));
  last=h;
 }
 // The known gap between the loft and the particulars (README.md § findings) is recorded, not hidden: if the hull is
 // refaired or the particulars corrected, update this.
 const laden=hydrostatics(FERRY_SHIP.draft);
 assert.ok(Math.abs(laden.displacement-375)<40,'laden displacement from the loft changed: '+laden.displacement.toFixed(1)+' t; update README.md § findings and this test');
});

test('offsets are fair: half-breadths grow with height and never exceed the deck’s',()=>{
 for(let i=0;i<=20;i++){const z=i*FERRY_SHIP.length/20;let last=-1;for(const w of [.25,.5,1,1.5,1.9,2.5]){const b=breadthAt(z,w);assert.ok(b>=last-1e-6&&b<=FERRY_SHIP.beam/2+1e-6,`station ${i} WL ${w}: ${b}`);last=b;}}
 assert.match(offsetsTable(),/\| 10 \| 17\.25 \| 0 \|/);
});

test('every space of the general arrangement and every consumer of the load analysis is on its sheet',()=>{
 const files=build();
 for(const s of FERRY_GA)assert.ok(files['general-arrangement.svg'].includes('>'+s.id.replace(/-/g,' ')+'<'),s.id);
 for(const l of FERRY_LOADS)assert.ok(files['electrical-load.md'].includes('| '+l.name+' |'),l.name);
 assert.ok(files['electrical-one-line.svg'].includes('MAIN SWITCHBOARD')&&files['electrical-one-line.svg'].includes('EMERGENCY SWITCHBOARD'));
});
