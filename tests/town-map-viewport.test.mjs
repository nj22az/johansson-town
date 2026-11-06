import test from 'node:test';
import assert from 'node:assert/strict';
import {MINATO_MAP_BOUNDS,townMapBounds} from '../src/world/map-viewport.js';

const world={minX:-80,maxX:420,minZ:-460,maxZ:300};
test('the default local map keeps Sakura, Harbour Park and Kitahama readable',()=>{
 const b=townMapBounds({player:{x:3,z:-20}},world);
 assert.deepEqual(b,MINATO_MAP_BOUNDS);
 for(const p of [{x:-5.5,z:-26.8},{x:23.4,z:-20.6},{x:59,z:94}])assert.ok(p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ);
 assert.ok(b.maxX-b.minX<120,'a distant island must not compress the local map');
});
test('a selected home and the complete walk fit inside the focused map',()=>{
 const route=[{x:3,z:-20},{x:2,z:66},{x:23.5,z:66},{x:23.5,z:86.8},{x:22.2,z:86.8}];
 const b=townMapBounds({player:route[0],target:route.at(-1),route},world);
 for(const p of route)assert.ok(p.x>=b.minX+10&&p.x<=b.maxX-10&&p.z>=b.minZ+10&&p.z<=b.maxZ-10);
});
test('ferry-leg view stays local while whole-world view remains explicit',()=>{
 const player={x:-5,z:-25},target={x:250,z:-280},route=[player,{x:0,z:-50}];
 const local=townMapBounds({player,target,route},world);assert.ok(local.maxX<100);
 assert.deepEqual(townMapBounds({mode:'world',player,target,route},world),world);
 const otherIsland=townMapBounds({player:target},world);assert.ok(otherIsland.minX>150&&otherIsland.maxZ<0);
});
