import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FLYER_ITEM,FLYER_PAPER,FLYER_PRODUCTS,collectSakuraFlyer} from '../src/commerce/sakura-flyer.js';
import {fileDocument,restoreArchive} from '../src/office/archive.js';
test('Printed shop flyer matches actual shelf prices and enters the document register once',()=>{
 const print=readFileSync(new URL('../assets/papers/sakura-flyer.svg',import.meta.url),'utf8');
 for(const product of FLYER_PRODUCTS){assert.ok(print.includes('¥'+product.cost));assert.ok(FLYER_PAPER.text.includes(product.name+' · ¥'+product.cost));}
 const state={};restoreArchive(state);fileDocument(state,FLYER_PAPER,100);fileDocument(state,FLYER_PAPER,101);
 assert.equal(state.documentArchive.records.filter(r=>r.source===FLYER_PAPER.source).length,1);
});
test('Free flyer remains a single bag keepsake, and a full bag is respected',()=>{
 const state={inventory:[]};assert.equal(collectSakuraFlyer(state),true);assert.equal(collectSakuraFlyer(state),false);assert.deepEqual(state.inventory,[FLYER_ITEM]);
 const full={inventory:Array(100).fill('Green tea')};assert.equal(collectSakuraFlyer(full),false);assert.equal(full.inventory.length,100);
});
