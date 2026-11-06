import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {productsModule} from '../tools/studio/build-data.mjs';
import {PRODUCTS,PRODUCT_BY_ID,PRINTS,RETIRED,FINGERPRINT} from '../src/commerce/products-data.js';
import {recordSha256} from '../src/studio/sha256.js';
import {ATLAS_COLS,ATLAS_ROWS} from '../src/world/interiors/store-advertising.js';

// Sakura's products as data (data/studio/products.json) and the module World reads them from.
const text=await readFile(new URL('../data/studio/products.json',import.meta.url),'utf8'),data=JSON.parse(text);

test('products-data.js is generated from products.json, written the way the tools write it',async()=>{
 assert.equal(await readFile(new URL('../src/commerce/products-data.js',import.meta.url),'utf8'),productsModule(text),'Run node johansson-town/tools/studio/build-data.mjs');
 assert.equal(text,JSON.stringify(data,null,2)+'\n');
 assert.equal(data.format,'johansson-products');assert.equal(data.version,1);
 assert.equal(FINGERPRINT,recordSha256({products:data.products,prints:data.prints,retired:data.retired}));
 assert.deepEqual(PRODUCTS.map(p=>p.id),data.products.map(p=>p.id));assert.equal(PRINTS.length,data.prints.length);assert.deepEqual(RETIRED,data.retired);
 assert.ok(Object.isFrozen(PRODUCTS)&&Object.isFrozen(PRODUCTS[0].brand)&&Object.isFrozen(PRODUCTS[0].cells.flavours));
 assert.equal(PRODUCT_BY_ID.constructor,undefined,'an id like "constructor" is no product');assert.equal(PRODUCT_BY_ID.beer.name,'Umineko lager');
});

test('every product has its own cells: a label and a price tag in the left half, each flavour in the right',()=>{
 const left=new Map(),right=new Map(),cells=ATLAS_COLS*ATLAS_ROWS;
 const take=(map,cell,who)=>{assert.ok(Number.isInteger(cell)&&cell>=0&&cell<cells,`${who}'s cell ${cell} is outside the atlas`);assert.ok(!map.has(cell),`${who} and ${map.get(cell)} share cell ${cell}`);map.set(cell,who);};
 for(const p of PRODUCTS){
  take(left,p.cells.brand,p.id);
  if(p.cells.price!=null)take(left,p.cells.price,p.id+' (price)');
  for(const f of p.cells.flavours)take(right,f.cell,`${p.id} ${f.name}`);
 }
 for(const p of PRINTS)take(left,p.cell,p.key);
 assert.ok(new Set([...PRODUCTS.map(p=>p.id),...RETIRED.map(r=>r.id)]).size===PRODUCTS.length+RETIRED.length,'a retired id is never used again');
 const free=cells-left.size;assert.ok(free>=0);
 // Today 71 of the left half's 80 cells are used: four more products fit before ATLAS_ROWS has to grow (a code batch).
 assert.equal(Math.floor(free/2),4);
});

test('a painted label is its own cell of the painted sheet it is laid in with',()=>{
 for(const p of PRODUCTS){
  if(p.label.source!=='painted')continue;
  assert.ok([0,1].includes(p.label.sheet)&&Number.isInteger(p.label.cell)&&p.label.cell>=0&&p.label.cell<16,p.id);
  assert.equal(p.label.sheet*16+p.label.cell,p.cells.brand,`${p.id}'s painting lies under its own atlas cell`);
 }
 assert.deepEqual(PRODUCTS.filter(p=>p.label.source==='fresh').map(p=>p.id).sort(),['bento','pudding','sandwich']);
});
