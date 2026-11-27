import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createBoughtCan} from '../src/commerce/bought-can.js';
import {OPEN_CAN} from '../src/avatars/open-can.js';
import {handHold} from '../src/avatars/build.js';
import {VENDING_PRODUCTS} from '../src/commerce/vending-catalogue.js';
installDOM();

/**
 * A can he bought (the owner, 27 November 2026: "Can they still drink beer or anything from the vending machines?", and
 * "A can needs to be opened also, removing the tab"): in his right hand, sealed; the left hand's fingers go to the ring
 * of its pull tab, the tab comes off in them and goes into his shirt pocket, the opening shows, he drinks, and the empty
 * can is put away. Standing and seated, for two bodies.
 */
for(const [who,seated] of [['Nils Johansson',false],['Nils Johansson',true],['Thao',false]])test(`${who}${seated?', seated,':''} opens a bought can, tab off and pocketed, then drinks it`,()=>{
 const scene=new THREE.Scene(),actor=createAvatarJohansson({scene,recipe:recipeFor(who)});
 const state=seated?{visible:true,seated:true,seatHeight:.45,seatFront:.2}:{visible:true};
 for(let i=0;i<40;i++)actor.update(1/60,state);
 const can=createBoughtCan('Green tea'),S=can.userData.sealed;
 assert.ok(S&&S.tab.parent===can&&!S.opening.visible,'sold sealed: the tab on, the opening covered');
 actor.drinkBought(can,{seated});
 const a=actor.avatar,hand=a.bones.handL,hollow=new THREE.Vector3(...handHold(a.measure,.0017).at);
 assert.equal(can.parent,a.bones.handR,'the can in his right hand');assert.equal(can.userData.bought,'Green tea');
 let t=0,onRing=Infinity,offAt=null,closed=1,pocket=null;
 for(let i=0;i<Math.round(OPEN_CAN.duration*60)+3;i++){
  actor.update(1/60,state);t+=1/60;a.root.updateWorldMatrix(true,true);
  const fingers=hand.localToWorld(hollow.clone());
  // the fingers on the ring while they take it and lift it
  if(t>=OPEN_CAN.take[1]&&t<OPEN_CAN.off-.02&&S.tab.parent===can)onRing=Math.min(onRing,fingers.distanceTo(S.tab.localToWorld(S.ring.clone())));
  if(offAt===null&&S.tab.parent===hand)offAt=t;
  if(t>OPEN_CAN.take[1]&&t<OPEN_CAN.drop-.05)closed=Math.min(closed,a.gripOf('L'));
  // at the pocket, just before it goes in
  if(t>OPEN_CAN.drop-.04&&t<OPEN_CAN.drop&&S.tab.parent===hand)pocket=fingers.distanceTo(a.bones.chest.localToWorld(S.pocket.clone()));
 }
 assert.ok(onRing<.012,`the fingers on the ring as they lift it (${(onRing*1000).toFixed(1)} mm off)`);
 assert.ok(offAt!==null&&Math.abs(offAt-OPEN_CAN.off)<.05,`the tab comes off in the left hand at ${OPEN_CAN.off} s (${offAt})`);
 assert.ok(closed>=OPEN_CAN.closed*.9,`the fingers stay closed on the tab until the pocket (${closed.toFixed(2)})`);
 assert.ok(pocket!==null&&pocket<.03,`the tab at his shirt pocket when it goes in (${pocket===null?'never':(pocket*1000).toFixed(0)+' mm'})`);
 assert.ok(S.done&&!S.tab.parent&&S.opening.visible,'the tab gone (in his pocket), the opening shown');
 assert.equal(actor.bought,'drink','then he drinks it');
 assert.equal(can.parent,a.bones.handR,'still in his right hand to drink');
 for(let i=0;i<3*60&&actor.bought;i++)actor.update(1/60,state);
 assert.equal(actor.bought,null,'and the empty can is put away');
 let left=null;a.root.traverse(o=>{if(o.userData?.bought)left=o;});assert.equal(left,null,'nothing of it left in his hands');
 a.dispose();
});

test('another move before the can is open: it is opened all the same and put away, the tab never left in his hand',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene(),recipe:recipeFor('Nils Johansson')}),state={visible:true};
 for(let i=0;i<20;i++)actor.update(1/60,state);
 const can=createBoughtCan('Canned coffee'),S=can.userData.sealed;actor.drinkBought(can);
 for(let i=0;i<Math.round((OPEN_CAN.off+.1)*60);i++)actor.update(1/60,state);
 assert.equal(S.tab.parent,actor.avatar.bones.handL,'the tab in his fingers');
 actor.play('Wave');
 assert.ok(S.done&&!S.tab.parent,'the tab put away with the can');assert.equal(actor.bought,null);
 actor.avatar.dispose();
});

test('every can the machines sell is printed as itself in his hand, at the size of the column it comes from',()=>{
 for(const p of VENDING_PRODUCTS){
  const can=createBoughtCan(p.inventoryName),print=can.getObjectByName('Printed can · '+p.brand);
  assert.ok(print,`${p.inventoryName}: the machine's print`);assert.ok(!can.getObjectByName('Printed serving product label'),`${p.inventoryName}: not the izakaya's beer label`);
  assert.ok(can.userData.sealed,`${p.inventoryName}: sold sealed`);
 }
 const small=createBoughtCan('Canned coffee'),big=createBoughtCan('Green tea');
 assert.ok(small.userData.grip.radius<big.userData.grip.radius&&small.userData.rimHeight<big.userData.rimHeight,'the 190 g coffee is the smaller can, and held and drunk as one');
 const beer=createBoughtCan('Umineko lager');assert.ok(beer.getObjectByName('Printed can · UMINEKO'),'Sakura’s lager in its own label');
});
