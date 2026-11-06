import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {ISLAND_OUTFITS,ISLAND_COSTUMES} from '../src/avatars/outfits.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {buildCityRestaurant} from '../src/world/interiors/city-restaurant.js';
import {buildBlueCoralShop,NAKAMURA_MENU} from '../src/world/blue-coral-shop.js';
import {circleHitsRect} from '../physics.js';
installDOM();
test('all original sets preserve identity and build finite animated clothing for both silhouettes',()=>{
 for(const set of [...ISLAND_OUTFITS,...ISLAND_COSTUMES])for(const silhouette of ['feminine','masculine']){
  const recipe=normalizeRecipe({name:'Dress rehearsal',body:{silhouette},hair:{style:'braids'},outfit:{...set.outfit,hat:'paperboat'}});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  const a=buildAvatar(recipe,{shadows:false});const motion=createAvatarAnimator(a);motion.play('Wave');
  for(let i=0;i<30;i++)motion.update(1/30,{seated:i>15,seatHeight:.48});
  assert.ok([...a.body.geometry.attributes.position.array].every(Number.isFinite),set.name);
  assert.equal(a.recipe.hair.style,'braids');assert.equal(a.recipe.outfit.hat,'paperboat');a.dispose();
 }
});
test('Thuan greets served food, presents her own plate and releases it before eating',()=>{
 const room=new THREE.Group(),r=buildCityRestaurant({room,reg(){},action(){}});
 r.dinner.serve({dish:'course'});assert.equal(r.dinner.state.presentation,'SitEnjoyFood');
 for(let i=0;i<110;i++)r.tick(.1);
 assert.equal(r.dinner.state.presentation,'SitPresentFood');const plate=room.getObjectByName('Thuan presents her actual dinner');assert.ok(plate);
 assert.ok(Number.isFinite(plate.position.y));
 assert.equal(r.dinner.eat(),true);assert.equal(r.dinner.state.presentation,null);assert.equal(plate.parent,null);
 for(let i=0;i<10;i++)r.tick(.1);
 assert.equal(r.dinner.state.eaten,1);
});
// Since 18 October 2026 one hours-aware menu at Nakamura's counter replaces the separate purchase points
// (docs/qa/iphone-colour-nakamura-2026-10-18.md: "One hours-aware menu replaces five overlapping purchase points"), and
// since 21 October the frontage owns the parasol's canopy and the roller shutter (#305, nakamura-dressing.js). Those are
// the only solids it adds: the canopy above head height, the shutter only while it is down.
test('Blue Coral retains its original frontage and menu while vacant, without an attendant or purchases',()=>{
 const world={colliders:[]},group=new THREE.Group(),anchors=[],actions=[];
 const shop=buildBlueCoralShop({world,group,register:(object,label,fn)=>anchors.push({object,label,fn}),onAction:(...args)=>actions.push(args)});
 assert.equal(shop.merged,true);assert.equal(shop.landmark.id,'nakamura');
 assert.deepEqual(world.colliders.map(c=>c.id).sort(),['nakamura-parasol-canopy','nakamura-shutter'],'No second shop or counter blocks the frontage');
 const canopy=world.colliders.find(c=>c.id==='nakamura-parasol-canopy'),shutter=world.colliders.find(c=>c.id==='nakamura-shutter');
 shop.update(12*60);assert.ok(canopy.minY>100,'the parasol is put away');assert.equal(shutter.minY,0,'the vacant counter remains shut at noon');
 assert.equal(anchors.some(a=>/attendant/i.test(a.label)),false);assert.ok(group.getObjectByName('Nakamura lettering (menu tags, cider tin, nameplate)'));
 assert.equal(anchors.filter(a=>/^Order at Nakamura/.test(a.label)).length,0,'no unstaffed purchase point');
 const notice=anchors.find(a=>a.label==='Read the dessert counter notice');assert.ok(notice);
 const scoop=NAKAMURA_MENU.find(p=>p.item==='Blue Coral ice cream');assert.ok(scoop);assert.equal(scoop.cost,150,'retain the original fitted menu for future facility work');
 for(const minutes of [10*60,12*60,19*60]){shop.update(minutes);notice.fn();assert.equal(actions.at(-1)[0],'read');assert.match(actions.at(-1)[1],/closed/);}
 shop.update(20*60);assert.equal(shutter.minY,0,'the shutter is down after hours');assert.ok(canopy.minY>100,'the parasol is put away');
});
