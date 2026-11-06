import test from 'node:test';
import assert from 'node:assert/strict';
import {VENDING_PRODUCTS,DRINKABLE,emptyFor,EMPTY_CAN,CAN_REFUND} from '../src/commerce/vending-catalogue.js';
import {SAKURA_SPECIALS,SPECIAL_BY_NAME,specialsOpen} from '../src/commerce/sakura-specials.js';
import {installDOM} from './fixtures.mjs';
import {createVendingMachine} from '../src/world/vending.js';

test('the machine sells cold and hot cans, and every can is drinkable and leaves an empty',()=>{
 assert.ok(VENDING_PRODUCTS.length>=6);
 assert.ok(VENDING_PRODUCTS.some(p=>p.hot)&&VENDING_PRODUCTS.some(p=>!p.hot));
 // Saved games keep their first two drinks.
 for(const name of ['Green tea','Canned coffee'])assert.ok(VENDING_PRODUCTS.some(p=>p.inventoryName===name));
 for(const p of VENDING_PRODUCTS){assert.ok(DRINKABLE.has(p.inventoryName));assert.equal(emptyFor(p.inventoryName),EMPTY_CAN);assert.ok(p.price>0);}
 assert.ok(CAN_REFUND>0&&CAN_REFUND<VENDING_PRODUCTS[0].price);
});

test('the specials board lists food and drinks with prices, served in shop hours',()=>{
 const names=SAKURA_SPECIALS.map(s=>s.name);
 assert.ok(names.includes('Karaage'));assert.ok(names.includes('Iced coffee'));
 assert.ok(SAKURA_SPECIALS.some(s=>s.kind==='food')&&SAKURA_SPECIALS.some(s=>s.kind==='drink'));
 for(const s of SAKURA_SPECIALS){assert.equal(SPECIAL_BY_NAME[s.name],s);assert.ok(s.jp&&s.price>0);}
 assert.equal(specialsOpen(8*60),false);assert.equal(specialsOpen(12*60),true);assert.equal(specialsOpen(21*60),false);
});

test('the vending machine is a full machine with a can display, not a placeholder',()=>{
 installDOM();const g=createVendingMachine();
 const names=g.userData.parts;
 for(const part of ['Vending cabinet','Vending glass','Vending money panel','Take-out pocket','Coin return lever'])assert.ok(names.includes(part),part);
 assert.ok(names.filter(n=>n==='can').length>=12,'a full display of cans');
 // And it is drawn as a handful of meshes, not a hundred.
 let meshes=0;g.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes<=12,meshes+' meshes');
});
