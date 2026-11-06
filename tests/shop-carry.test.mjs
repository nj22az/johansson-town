import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';

test('one item is carried in the hand, more go in a basket, and paying empties the hand',async()=>{
 installDOM();
 const {createShopCarry}=await import('../src/interact/shop-carry.js');
 const held=[];const holder={hold(prop){held.push(prop);}};
 const carry=createShopCarry({holder:()=>holder});
 carry.sync([],true);assert.equal(held.length,0,'nothing to carry');
 carry.sync(['tea'],true);assert.equal(carry.holding,'item');assert.match(held.at(-1).name,/Carried tea/);
 carry.sync(['tea'],true);assert.equal(held.length,1,'no rebuild while nothing changed');
 carry.sync(['tea','rice'],true);assert.equal(carry.holding,'basket');assert.equal(held.at(-1).name,'Sakura basket');
 let products=0;held.at(-1).traverse(o=>{if(/^Branded /.test(o.name))products++;});assert.equal(products,2,'what is in it shows over the rim');
 carry.sync(['tea','rice'],false);assert.equal(held.at(-1),null,'outside the shop the hand is empty');
 carry.sync(['tea','rice'],true);carry.sync([],true);assert.equal(held.at(-1),null,'paid: the basket goes');
 assert.equal(carry.holding,null);
});
