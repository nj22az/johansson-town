import test from 'node:test';
import assert from 'node:assert/strict';
import {surface} from './body-contact.mjs';
import {installDOM} from './fixtures.mjs';
import {recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {longFringeGeometry} from '../src/avatars/long-fringe.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {paintGarment,GARMENT,SLEEVED_LONG,SHIRT_SLEEVES} from '../src/avatars/garment.js';
import {labelFor} from '../src/avatars/wardrobe-catalogue.js';
installDOM();

test('Vy is an editable child preset; hair and clothes survive sharing',()=>{
 const r=recipeFor('Vy');assert.equal(r.age,'child');assert.equal(r.hair.style,'longfringe');assert.equal(r.outfit.top,'stripedvest');assert.equal(r.outfit.skirtCut,'panel');assert.equal(r.body.proportion,'studio');assert.equal(r.head.form,'sculpted');
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 assert.equal(normalizeRecipe({hair:{style:'bob'}}).hair.style,'bob');
 assert.equal(labelFor('top','stripedvest'),'Striped tee & vest');
 assert.ok(SLEEVED_LONG.includes(r.outfit.top)&&SHIRT_SLEEVES.includes(r.outfit.top));
});

test('loose hair length and volume change a bounded closed shell at every life stage',()=>{
 for(const age of ['child','teen','adult','elder']){
  const geometries=[0,1].map(length=>{const r=normalizeRecipe({...recipeFor('Vy'),age,hair:{...recipeFor('Vy').hair,length,volume:length}});return longFringeGeometry(r,measure(r));});
  for(const g of geometries){assert.ok(g.index.count/3<4000);assert.ok(g.attributes.position.array.every(Number.isFinite));g.computeBoundingBox();}
  assert.ok(geometries[1].boundingBox.min.y<geometries[0].boundingBox.min.y);
  assert.ok(geometries[1].boundingBox.max.x>geometries[0].boundingBox.max.x);
  geometries.forEach(g=>g.dispose());
 }
});

test('Vy uses the shared hair springs and remains finite through walks, runs and seated poses',()=>{
 const a=buildAvatar(recipeFor('Vy'),{shadows:false,faceSize:64}),anim=createAvatarAnimator(a);
 assert.ok(a.springSetup.chains.some(c=>c.kind==='hair'));
 assert.ok(a.body.geometry.attributes.position.count<150000);
 for(const [pose,state] of [['Idle',{}],['walk',{walking:true,speed:.8}],['run',{walking:true,running:true,speed:1.4}],['sit',{seated:true}],['Wave',{}],['Bow',{}]]){
  anim.stop();if(/^[A-Z]/.test(pose))anim.play(pose);
  for(let i=0;i<60;i++)anim.update(1/60,state);
  a.root.updateMatrixWorld(true);
  for(const {p} of surface(a,{stride:31}))assert.ok([p.x,p.y,p.z].every(Number.isFinite),pose);
 }
 a.dispose();
});

test('striped vest paints stripes inside the sleeve UV band and keeps cuffs',()=>{
 const r=recipeFor('Vy'),m=measure(r),rects=[],ctx=document.createElement('canvas').getContext('2d');
 ctx.fillRect=(...args)=>rects.push({colour:ctx.fillStyle,args});
 const marks=paintGarment(ctx,r,m,()=>1);
 assert.ok(marks.includes('striped sleeves')&&marks.includes('striped undershirt')&&marks.includes('cuffs'));
 const lo=(1-GARMENT.SLEEVE.v1)*GARMENT.height,hi=(1-GARMENT.SLEEVE.v0)*GARMENT.height;
 assert.equal(rects.filter(x=>x.colour===r.outfit.topColour&&x.args[1]>=lo&&x.args[1]<hi).length,9);
});
