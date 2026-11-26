import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeFor,THUAN_REDRAWN} from '../src/avatars/cast.js';
import {THUAN_STUDIO_DESIGN} from '../src/avatars/thuan-studio-design.js';
// The owner, 26 November 2026: "redraw Thuan in Blender too", "The blender thuan is the inspiration", then "use Disney art design
// this is real life Thuan it should look like her but a cute cartoon". Her head is sculpted in Blender (head form 'gentle',
// tools/blender/build-thuan-head.py) and her face is drawn from her photograph. Those values are cast.js THUAN_REDRAWN;
// everything else is the Studio design, exactly.
const SCULPTED=Object.fromEntries(Object.entries(THUAN_REDRAWN).flatMap(([part,values])=>typeof values==='object'?Object.entries(values).map(([k,v])=>[part+'.'+k,v]):[]));
test('World and Studio retain the exact creator-approved Thuận appearance and her own identity',()=>{
 const r=recipeFor('Thuan');
 for(const [group,value] of Object.entries(THUAN_STUDIO_DESIGN)){
  if(value&&typeof value==='object')for(const [key,want] of Object.entries(value)){if(group==='body'&&key==='silhouette')continue;if(SCULPTED[group+'.'+key]!==undefined){assert.equal(r[group][key],SCULPTED[group+'.'+key],group+'.'+key);continue;}assert.deepEqual(r[group][key],want,group+'.'+key);}
  else if(THUAN_REDRAWN[group]!==undefined)assert.equal(r[group],THUAN_REDRAWN[group],group);
  else assert.deepEqual(r[group],value,group);
 }
 // Studio's unset 'neutral' silhouette resolves to hers, like every resident's (cast.js castSet): the bath, the swimwear
 // and the after-bath clothes read it.
 assert.equal(r.body.silhouette,'feminine');assert.equal(r.profile.month,3);assert.equal(r.profile.day,15);
});
