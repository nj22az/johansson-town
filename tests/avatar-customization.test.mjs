import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {longBraidPoints} from '../src/avatars/braid-path.js';
import {headProfile} from '../src/avatars/head-profile.js';
import {addFaceMorphs,FACE_MORPHS} from '../src/avatars/face-morphs.js';
installDOM();

test('new controls clamp, survive saving and preserve older recipes',()=>{
 const r=normalizeRecipe({...CAST_RECIPES.Thuan,hair:{style:'longbraids',length:4,volume:-2,tieColour:'#abcxyz'},head:{roundness:.67},glasses:{style:'round',enabled:false},accessories:{colour:'#112233',necklaceColour:'#abcdef'}});
 assert.equal(r.hair.length,1);assert.equal(r.hair.volume,0);assert.equal(r.hair.tieColour,'#f4f1ea');
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 const old=normalizeRecipe({hair:{style:'longbraids'},accessories:{colour:'#112233'}});
 assert.equal(old.hair.length,0);assert.equal(old.hair.volume,.5);assert.equal(old.glasses.enabled,true);assert.equal(old.accessories.necklaceColour,'#112233');
});
// (Thuan's own hair is her classic braids again; the long braids are built here on purpose.)
const LONG_BRAIDS={...CAST_RECIPES.Thuan.hair,style:'longbraids',length:.92,volume:.7};
test('braid length moves mesh and spring endpoints together at all body sizes',()=>{
 for(const age of ['child','teen','adult','elder'])for(const length of [0,.5,1]){
  const r=normalizeRecipe({...CAST_RECIPES.Thuan,age,hair:{...LONG_BRAIDS,length}}),m=measure(r),a=buildAvatar(r,{shadows:false});
  for(const side of [-1,1]){
   const points=longBraidPoints(m,side,r.hair),chain=a.springSetup.chains.find(c=>c.bones[0]==='braid'+(side===1?'L':'R')+'1');
   assert.deepEqual(chain.tip,points[2]);
   if(length===1)assert.ok(chain.tip[1]<m.hipY,'full length reaches below waist');
   for(const p of points)assert.ok(p.every(Number.isFinite));
  }
  a.dispose();
 }
});
test('braid volume changes visible geometry with a fixed vertex budget',()=>{
 const avatars=[0,1].map(volume=>buildAvatar({...CAST_RECIPES.Thuan,hair:{...LONG_BRAIDS,volume}},{shadows:false}));
 const [fine,full]=avatars.map(a=>a.body.geometry.attributes.position);
 assert.equal(fine.count,full.count);let moved=0;for(let i=0;i<fine.array.length;i++)if(Math.abs(fine.array[i]-full.array[i])>.0001)moved++;
 assert.ok(moved>1000);avatars.forEach(a=>a.dispose());
});
test('roundness smoothly softens oval proportion and export morphs are local and finite',()=>{
 const oval=headProfile({form:'oval',shape:.5,jaw:.5,cheeks:.5,roundness:0}),round=headProfile({form:'oval',shape:.5,jaw:.5,cheeks:.5,roundness:1});
 assert.ok(round.width>oval.width);assert.ok(round.height<oval.height);assert.ok(round.taper<oval.taper);
 const a=buildAvatar(CAST_RECIPES.Thuan,{shadows:false});addFaceMorphs(a.face.head,a.recipe,a.measure);
 assert.deepEqual(Object.keys(a.face.head.morphTargetDictionary),FACE_MORPHS);
 for(const attr of a.face.head.geometry.morphAttributes.position){assert.ok(attr.array.every(Number.isFinite));assert.ok(attr.array.some(v=>Math.abs(v)>.00001));}
 a.dispose();
});
