import test from 'node:test';
import assert from 'node:assert/strict';
import {DISTANT_ISLANDS} from '../src/world/horizon.js';
import {ISLAND_COAST} from '../src/world/island-plan.js';
import {AIRPORT_ISLAND,AIRPORT_REACH} from '../src/world/airport-island.js';

// The distant islands are scenery out at sea. When the island grew south and the airport
// island east, four of them were left standing on land as odd blue hills.
const inside=(poly,x,z)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [ax,az]=poly[i],[bx,bz]=poly[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)c=!c;}return c;};
const segDist=(x,z,[ax,az],[bx,bz])=>{const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-ax-t*dx,z-az-t*dz);};
const coastDist=(x,z)=>Math.min(...ISLAND_COAST.map((p,i)=>segDist(x,z,p,ISLAND_COAST[(i+1)%ISLAND_COAST.length])));
test('every distant island is out at sea, clear of both coasts and in view',()=>{
 const A=AIRPORT_ISLAND,airportReach=AIRPORT_REACH+30;
 for(const [x,z,length] of DISTANT_ISLANDS){
  assert.ok(!inside(ISLAND_COAST,x,z)&&coastDist(x,z)>length+40,`the island at ${x},${z} is on or next to Johansson Island`);
  assert.ok(Math.hypot(x-A.x,z-A.z)>airportReach+length,`the island at ${x},${z} is on or next to the airport island`);
  assert.ok(Math.hypot(x,z)<470,`the island at ${x},${z} is beyond the camera`);
  assert.ok(x>-700&&x<700&&z>-1000&&z<400,`the island at ${x},${z} is off the edge of the sea`);
 }
});
