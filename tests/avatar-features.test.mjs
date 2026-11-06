import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,PARTS} from '../src/avatars/recipe.js';
import {faceLayout} from '../src/avatars/face.js';
import {buildAvatar,buildHatProp,measure} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {installDOM} from './fixtures.mjs';
installDOM();
test('old recipes gain neutral controls; new facial settings and accessories survive sharing',()=>{
 const old=normalizeRecipe({v:1,eyes:{size:.7},outfit:{hat:'captain'}});
 assert.equal(old.eyes.width,.5);assert.equal(old.nose.x,.5);assert.equal(old.accessories.earrings,'none');assert.equal(old.outfit.hat,'captain');
 const r=normalizeRecipe({eyes:{width:1,spacing:.8,height:.2},nose:{x:.3},mouth:{width:.9,x:.8},accessories:{earrings:'hoops',neckwear:'scarf',pin:true,colour:'#d8342c'},outfit:{hat:'beanie'}});
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 assert.equal(normalizeRecipe({eyes:{width:9},accessories:{earrings:'invalid'}}).eyes.width,1);
});
test('features move independently and larger wider eyes leave head proportions unchanged',()=>{
 const r=normalizeRecipe(),base=faceLayout(r),eyes=faceLayout(normalizeRecipe({...r,eyes:{...r.eyes,height:1,width:1,size:1}}));
 assert.ok(eyes.eyeY<base.eyeY);assert.ok(eyes.eyeS>base.eyeS);assert.ok(eyes.eyeW>base.eyeW);
 assert.equal(eyes.noseY,base.noseY);assert.equal(eyes.mouthY,base.mouthY);assert.equal(eyes.browY,base.browY);
 const mouth=faceLayout(normalizeRecipe({...r,mouth:{...r.mouth,x:1,height:0}}));assert.ok(mouth.mouthX>base.mouthX);assert.ok(mouth.mouthY>base.mouthY);assert.equal(mouth.eyeY,base.eyeY);
 assert.equal(measure(r).Rh,measure({...r,eyes:{width:1,size:1}}).Rh);
});
test('all hats and accessories remain in the two-draw skinned avatar through poses and swimwear',()=>{
 for(const hat of PARTS.hat)for(const earrings of PARTS.earrings){
  const a=buildAvatar({...CAST_RECIPES.Thuan,outfit:{...CAST_RECIPES.Thuan.outfit,hat},accessories:{earrings,neckwear:hat==='none'?'pendant':'scarf',pin:true}},{shadows:false});
  const anim=createAvatarAnimator(a);anim.play('Wave');anim.update(.1,{speed:1});a.root.updateMatrixWorld(true);
  // (Glasses and facial hair are head-bound face objects with their own meshes, not hats or accessories: not counted.)
  const faceObject=o=>{for(let p=o;p;p=p.parent)if(p.name==='Face objects')return true;return false;};
  // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
  // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
  // eyes to one draw. The body and the head are still the two draws counted here.
  let draws=0,lines=0;a.root.traverse(o=>{if(o.isMesh&&o.visible&&!faceObject(o)&&o!==a.eyes3d?.mesh)(o.userData.outline?lines++:draws++);});assert.equal(draws,2);assert.equal(lines,2,"body and head each carry one ink shell");
  for(const v of a.body.geometry.attributes.position.array)assert.ok(Number.isFinite(v));
  a.wear('swim');assert.equal(a.body.visible,false);a.wear('clothes');assert.equal(a.body.visible,true);a.dispose();
 }
});
test('a hat comes off without a third draw call, and the copy on the peg is the same hat',()=>{
 const recipe=CAST_RECIPES['Officer Mori'],a=buildAvatar(recipe,{shadows:false});
 assert.ok(a.hasHat&&a.hatOn);const whole=a.body.geometry.attributes.position.count;
 a.setHat(false);assert.equal(a.hatOn,false);assert.ok(a.body.geometry.drawRange.count<whole,'the hat is no longer drawn');
 // (The rigged eyes are their own draw, as in the test above.)
 let draws=0,lines=0;a.root.traverse(o=>{if(o.isMesh&&o.visible&&o!==a.eyes3d?.mesh)(o.userData.outline?lines++:draws++);});assert.equal(draws,2);assert.equal(lines,2,"body and head each carry one ink shell");
 a.setHat(true);assert.equal(a.hatOn,true);
 const prop=buildHatProp(recipe);assert.ok(prop?.isMesh&&!prop.isSkinnedMesh);
 assert.equal(prop.geometry.attributes.position.count,whole-a.body.geometry.drawRange.start-(a.setHat(false),a.body.geometry.drawRange.count),'the peg holds the hat that came off');
 assert.equal(buildHatProp(CAST_RECIPES.Reiko),null,'no hat, nothing to hang up');a.dispose();
});
test('moustache and beard are separate, and older one-style facial hair still reads',()=>{
 for(const [style,moustache,beard] of [['walrus','walrus','none'],['goatee','none','goatee'],['none','none','none']]){
  const r=normalizeRecipe({facial:{style,colour:'#dedbd3'}});
  assert.equal(r.facial.moustache,moustache);assert.equal(r.facial.beard,beard);assert.equal(r.facial.style,style);
 }
 const both=normalizeRecipe({facial:{style:'walrus',moustache:'handlebar',beard:'chinstrap',size:.8,height:.2}});
 assert.equal(both.facial.moustache,'handlebar');assert.equal(both.facial.beard,'chinstrap');assert.equal(both.facial.style,'chinstrap','style names the beard for older readers');
 const r=normalizeRecipe({facial:{moustache:'pencil',beard:'stubble'},glasses:{style:'round',size:.9,height:.1},mole:true,moleSpot:{x:.2,height:.8,size:1}});
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 assert.equal(normalizeRecipe({facial:{moustache:'nonsense'}}).facial.moustache,'none');
});
test('glasses, whiskers and the beauty spot move and size on their own',()=>{
 const r=normalizeRecipe({mole:true}),base=faceLayout(r);
 // The default spot is where the fixed one always was, so nobody's face changes.
 assert.ok(Math.abs(base.moleX-(128+base.spread*.9))<1);assert.ok(Math.abs(base.moleY-(base.mouthY-6))<1);
 assert.equal(base.glassY,base.eyeY);assert.equal(base.glassS,1);assert.equal(base.facialS,1);assert.ok(Math.abs(base.facialDY)<1e-9);
 const moved=faceLayout(normalizeRecipe({...r,glasses:{style:'round',size:1,height:1},facial:{moustache:'moustache',size:1,height:1},moleSpot:{x:0,height:1,size:1}}));
 assert.ok(moved.glassY<base.glassY&&moved.glassS>base.glassS);assert.equal(moved.eyeY,base.eyeY,'the eyes stay put');
 assert.ok(moved.facialDY<0&&moved.facialS>base.facialS);
 assert.ok(moved.moleX<base.moleX&&moved.moleY<base.moleY&&moved.moleR>base.moleR);
});
test('every face part and hairstyle builds',()=>{
 const r=CAST_RECIPES.Thuan;
 for(const [section,list] of [['eyes',PARTS.eyes],['brows',PARTS.brows],['nose',PARTS.nose],['mouth',PARTS.mouth]])for(const style of list){
  const a=buildAvatar({...r,[section]:{...r[section],style}},{shadows:false,faceSize:128});a.dispose();
 }
 for(const moustache of PARTS.moustache)for(const beard of PARTS.beard){const a=buildAvatar({...r,facial:{moustache,beard,colour:'#3a2618'}},{shadows:false,faceSize:128});a.dispose();}
 const counts=new Set();
 for(const style of PARTS.hair){
  const a=buildAvatar({...r,hair:{...r.hair,style},outfit:{...r.outfit,hat:'none'}},{shadows:false,faceSize:128});
  for(const v of a.body.geometry.attributes.position.array)assert.ok(Number.isFinite(v),style);
  counts.add(style+':'+a.body.geometry.attributes.position.count);a.dispose();
 }
 assert.equal(counts.size,PARTS.hair.length);
});
