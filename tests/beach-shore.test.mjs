import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BEACH,BEACH_DRY_EDGE_X,beachProfile,gradedHeight,onBeach} from '../src/world/beach-layout.js';

// The owner's phone, 21 October 2026 (briefs/town-hall-zone.md D1): at the north end of the east beach a straight-edged
// slab of sand stood out into the sea, lifted by the Kitahama lawn's grade carried past the coastline.
const sand=(x,z)=>gradedHeight(x,z,beachProfile(x));

test('no sand stands above the sea past the water’s edge, anywhere on the east beach',()=>{
 const out=[];
 for(let z=BEACH.minZ;z<=BEACH.maxZ+1e-9;z+=.25)for(let x=BEACH_DRY_EDGE_X+.05;x<=BEACH.profile.at(-1)[0]+1e-9;x+=.1){
  if(!onBeach(x,z))continue;
  const y=sand(x,z);
  // The dry edge is where the profile is 25 mm over the water (beach-layout.js BEACH_DRY_EDGE_X).
  if(y>BEACH.waterY+.025)out.push(`(${x.toFixed(2)}, ${z.toFixed(2)}) at ${y.toFixed(3)}`);
 }
 assert.deepEqual(out,[],'sand above the water: '+out.slice(0,6).join('; '));
});

test('past the shore the sand is the beach’s own profile, so no grade ends in a step under the water',()=>{
 for(let z=BEACH.maxZ-6;z<=BEACH.maxZ+1e-9;z+=.25)for(let x=BEACH_DRY_EDGE_X+.05;x<=BEACH.profile.at(-1)[0];x+=.1)
  assert.ok(Math.abs(sand(x,z)-beachProfile(x))<1e-6,`a grade still lifts the sand at (${x.toFixed(2)}, ${z.toFixed(2)})`);
});

test('the north end of the beach falls smoothly into the sea, with no step along or across it',()=>{
 const H=.05;
 for(let z=BEACH.maxZ-6;z<=BEACH.maxZ+1e-9;z+=H)for(let x=42;x<=BEACH.profile.at(-1)[0]-H;x+=H){
  if(!onBeach(x,z)||!onBeach(x+H,z)||!onBeach(x,z+H))continue;
  const y=sand(x,z),dx=Math.abs(sand(x+H,z)-y),dz=z+H<=BEACH.maxZ?Math.abs(sand(x,z+H)-y):0;
  // The steepest honest fall is the lawn's corner at the lane's end (45.07, 29.3), where level sand meets the water in
  // the 0.6 m the beach has past the coastline, beside the coast's stone face: a short bank of about 1:1. A step is
  // far steeper (the slab's edge fell 0.4 m in one sample).
  assert.ok(dx<=H*1.05&&dz<=H*1.05,`a step in the sand at (${x.toFixed(2)}, ${z.toFixed(2)}): ${dx.toFixed(3)} across, ${dz.toFixed(3)} along`);
 }
});
