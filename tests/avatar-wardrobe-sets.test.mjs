import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {surface} from './body-contact.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {ISLAND_OUTFITS,ISLAND_COSTUMES} from '../src/avatars/outfits.js';
import {residentRecipe,saveResidentRecipe} from '../src/avatars/wardrobe.js';
import {bicycleRiderFit} from '../src/world/bicycle-fit.js';
installDOM();

/** Batch 1 of the Minato Machi wardrobe plan (2026-10-11): eight sets made only from parts that already exist. */
const BATCH_1=['shop-counter-smock','morning-boats','post-round','ramen-kitchen','cold-store','gateball-afternoon','haarii-crew','walk-to-school'];
const SETS=[...ISLAND_OUTFITS,...ISLAND_COSTUMES],set=id=>SETS.find(s=>s.id===id);
/** An adult (Thuan), a child and an elder, feminine and masculine, slim and broad. */
const BODIES={
 Thuan:CAST_RECIPES.Thuan,
 child:normalizeRecipe({...CAST_RECIPES.Johansson,name:'Child',age:'child',body:{...CAST_RECIPES.Johansson.body,build:.35}}),
 elder:normalizeRecipe({...CAST_RECIPES['Mrs Sato'],age:'elder',body:{...CAST_RECIPES['Mrs Sato'].body,build:.76}}),
};
const dressed=(body,outfit)=>normalizeRecipe({...body,outfit:{...body.outfit,...outfit}});
const baseLayer=body=>normalizeRecipe({...body,outfit:{...body.outfit,top:'tank',bottom:'underwear',footwear:'barefoot',hat:'none'},accessories:{...body.accessories,earrings:'none',neckwear:'none',pin:false}});
const vertices=r=>{const a=buildAvatar(r,{shadows:false,faceSize:64}),n=a.body.geometry.attributes.position.count;a.dispose();return n;};
function draws(a){let meshes=0,ink=0;const face=o=>{for(let p=o;p;p=p.parent)if(p.name==='Face objects')return true;return false;};
 // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
 // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
 // eyes to one draw. The body and the head are still the two draws counted here.
 a.root.traverse(o=>{if(o.isMesh&&o.visible&&!face(o)&&o!==a.eyes3d?.mesh)(o.userData.outline?ink++:meshes++);});return [meshes,ink];}

test('each batch-1 set stays at two draws and two ink shells, and its hat comes off without a third draw',()=>{
 for(const id of BATCH_1)for(const [who,body] of Object.entries(BODIES)){
  const a=buildAvatar(dressed(body,set(id).outfit),{shadows:false,faceSize:64});
  assert.deepEqual(draws(a),[2,2],`${id} on ${who}`);
  assert.ok(a.hasHat,`${id} puts on its hat`);a.setHat(false);assert.deepEqual(draws(a),[2,2],`${id} on ${who}, hat off`);a.dispose();
 }
});

test('the vertex budget: a set adds 10k vertices or fewer over the base layer, on Thuan and on a child',()=>{
 // Measured 2026-10-11 and over the budget before batch 1; they may not grow. The lantern is the plan's recorded
 // exception (its sphere hides the pendant); the harbour polo is the contrast polo's modelled collar on the pleated skirt.
 const OVER={'lantern-sprite':20500,'harbour-polo':11100};
 for(const body of [BODIES.Thuan,BODIES.child]){
  const base=vertices(baseLayer(body));
  for(const s of SETS){const extra=vertices(dressed(baseLayer(body),s.outfit))-base;assert.ok(extra<=(OVER[s.id]??10000),`${s.id} adds ${extra}`);}
 }
});

test('a set survives the share code, a Studio design file and a resident’s saved wardrobe',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
 for(const s of SETS){
  const r=dressed(BODIES.Thuan,s.outfit);
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r,s.id+' share code');
  const file=JSON.parse(JSON.stringify({format:'nj-avatar-studio',version:1,recipe:r}));assert.deepEqual(normalizeRecipe(file.recipe),r,s.id+' design file');
  saveResidentRecipe('Thuan',r,storage);assert.deepEqual(residentRecipe('Thuan',storage).outfit,r.outfit,s.id+' saved wardrobe');
 }
});

/**
 * Every move a set must survive: walk, run, sit on a chair, a low stool and the floor, bow, wave, both arms up (cheer and
 * the kachāshī) and the bicycle. Every drawn point stays finite and above the floor, and no point of the dressed body
 * jumps between two frames further than the same body in its base layer does in that move (the clothes never pop).
 */
const MOVES=[['walk',{speed:1.2}],['run',{speed:3.4}],['chair',{seated:true,seatHeight:.45}],['stool',{seated:true,seatHeight:.3}],['floor',{seated:true,seatHeight:0}],
 ['Bow',{}],['Wave',{}],['Cheer',{}],['Kachashi',{}],['bicycle',{riding:true}]];
function rehearse(recipe,label){
 const a=buildAvatar(recipe,{shadows:false,faceSize:64}),motion=createAvatarAnimator(a),fit=bicycleRiderFit(a.measure),out={};
 for(const [move,state] of MOVES){
  motion.stop();if(/^[A-Z]/.test(move))motion.play(move);
  let before=null,jump=0,low=Infinity;
  for(let frame=0;frame<36;frame++){
   motion.update(1/30,{...state,bicycleFit:fit,ridePhase:frame/24});a.root.updateMatrixWorld(true);
   const points=surface(a,{stride:41}).map(x=>x.p);
   for(const p of points){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z),`${label}: ${move} at ${frame}`);low=Math.min(low,p.y);}
   if(before&&frame>2)for(let i=0;i<points.length;i++)jump=Math.max(jump,points[i].distanceTo(before[i]));
   before=points;
  }
  out[move]={jump,low};
 }
 a.dispose();return out;
}
test('each batch-1 set walks, runs, sits, bows, waves, raises both arms and rides a bicycle without popping',()=>{
 for(const who of ['Thuan','child']){
  const bare=rehearse(baseLayer(BODIES[who]),who+' in the base layer');
  for(const id of BATCH_1){
   const worn=rehearse(dressed(BODIES[who],set(id).outfit),`${id} on ${who}`);
   for(const [move] of MOVES){
    assert.ok(worn[move].low>-.01,`${id} on ${who}: ${move} goes below the floor (${worn[move].low.toFixed(3)})`);
    assert.ok(worn[move].jump<=bare[move].jump+.03,`${id} on ${who}: ${move} pops ${worn[move].jump.toFixed(3)} m in a frame (bare ${bare[move].jump.toFixed(3)})`);
   }
  }
 }
});

test('every set still changes into the bath and the lobby clothes, one body at a time',()=>{
 // Whatever set they come in wearing, the bath and the lobby draw one body. The after-bath clothes are made from the set
 // (her house dress is a washed pastel of her top, never paper-white #ffffff), so every set is tried in them, on a woman
 // and a man; swimwear and the towel do not use the set's clothes (and cost seconds each), so batch 1's sets try those.
 const shown=a=>{let n=0;a.root.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&!o.userData.outline)n++;});return n;};
 for(const s of SETS)for(const who of ['Thuan','Tetsuo']){
  const a=buildAvatar(dressed(CAST_RECIPES[who],s.outfit),{shadows:false,faceSize:64});
  for(const m of [...(BATCH_1.includes(s.id)&&who==='Thuan'?['swim','towel']:[]),'afterbath','clothes']){
   assert.equal(a.wear(m),m,`${s.id} on ${who}: ${m}`);
   // The authored panel cut is a declared additional cloth material/mesh; bath
   // transitions must hide it as well as the everyday body, never leave it on.
   const expected=1+(m==='clothes'&&a.skirt?1:0);
   assert.equal(shown(a),expected,`${s.id} on ${who} in ${m}: one body plus declared garment`);
   if(a.skirt)assert.equal(a.skirt.visible,m==='clothes',`${s.id}: no everyday skirt left on in ${m}`);
   const dress=a.root.getObjectByProperty('name','Shimanchu after the bath · house dress')?.userData.afterbath.dress;
   if(m==='afterbath'&&who==='Thuan')assert.ok(dress&&dress!=='#ffffff',`${s.id}: house dress ${dress}`);
  }
  a.dispose();
 }
});
