import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_DOOR,MARKET_THRESHOLD,SHOP_ADDRESSES} from '../src/world/town-grid.js';

test('market threshold sits on the street door approach, not Thuan work stand-off',()=>{
 assert.equal(SHOP_ADDRESSES.market.z,-28.5);
 assert.deepEqual(MARKET_DOOR,[-5.5,-28.5]);
 assert.deepEqual(MARKET_THRESHOLD,[-6.3,-28.5]);
 assert.ok(MARKET_THRESHOLD[0]<MARKET_DOOR[0],'threshold is further onto the pavement for side=-1');
});
