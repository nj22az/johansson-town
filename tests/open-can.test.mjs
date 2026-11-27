import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createBoughtCan} from '../src/commerce/bought-can.js';
import {DRINK_CAN,CAN_PARTS} from '../src/avatars/drink-can.js';
import {HAND,handPoint} from '../src/avatars/build.js';
import {pocketSpot} from '../src/avatars/story-props.js';
import {VENDING_PRODUCTS} from '../src/commerce/vending-catalogue.js';
installDOM();

/**
 * A can he bought (the owner, 27 November 2026: "Can they still drink beer or anything from the vending machines?", "A
 * can needs to be opened also, removing the tab", "You need to animate the beer drinking in blender and bring it to the
 * game after"): in his right hand, sealed; the left forefinger hooked under the ring of its pull tab, the ring lifted, the
 * tab torn off in it and put into his shirt pocket, the opening shown; he drinks it down; the empty can is put away. As
 * animated in Blender (tools/blender/drink-can.py, src/avatars/drink-can.js). Standing and seated, for two bodies.
 */
const at=name=>DRINK_CAN.events.find(e=>e.name===name).t;
for(const [who,seated] of [['Nils Johansson',false],['Nils Johansson',true],['Thao',false]])test(`${who}${seated?', seated,':''} opens a bought can, tab off and pocketed, then drinks it`,()=>{
 const scene=new THREE.Scene(),actor=createAvatarJohansson({scene,recipe:recipeFor(who)});
 const state=seated?{visible:true,seated:true,seatHeight:.45,seatFront:.2}:{visible:true};
 for(let i=0;i<40;i++)actor.update(1/60,state);
 const can=createBoughtCan('Green tea'),S=can.userData.sealed;
 assert.ok(S&&S.tab.parent!==null&&!S.opening.visible,'sold sealed: the tab on, the opening covered');
 actor.drinkBought(can,{seated});
 const a=actor.avatar,hand=a.bones.handL,hookAt=new THREE.Vector3(...handPoint(a.measure,'L',HAND.hookAt));
 assert.equal(can.parent,a.bones.handR,'the can in his right hand');assert.equal(can.userData.bought,'Green tea');
 let t=0,onRing=0,ringFrames=0,offAt=null,hooked=1,pocket=null;const off=at('tabOff'),pocketed=at('tabPocketed');
 const P=pocketSpot(a).position;
 for(let i=0;i<Math.round(pocketed*60)+6;i++){
  actor.update(1/60,state);t+=1/60;a.root.updateWorldMatrix(true,true);
  const cue=actor.canCue,hook=hand.localToWorld(hookAt.clone());
  // the hooked forefinger on the ring while it lifts it
  if(S.tab.parent&&!S.off&&cue?.ring>.99&&cue.w>.99){onRing=Math.max(onRing,hook.distanceTo(S.tab.localToWorld(S.ring.clone())));ringFrames++;}
  if(offAt===null&&S.tab.parent===hand)offAt=t;
  if(S.tab.parent===hand&&t<pocketed-.05){hooked=Math.min(hooked,a.gripShapeOf('L')==='hook'?a.gripOf('L'):0);
   pocket=hook.distanceTo(a.bones.chest.localToWorld(P.clone()));}
 }
 assert.ok(ringFrames>10&&onRing<.003,`the hooked forefinger on the ring as it lifts it, ${ringFrames} frames (${(onRing*1000).toFixed(1)} mm off)`);
 assert.ok(offAt!==null&&Math.abs(offAt-off)<.04,`the tab comes off in the left hand at ${off} s (${offAt?.toFixed(2)})`);
 assert.ok(hooked>.9,`the forefinger hooked on the tab until the pocket (${hooked.toFixed(2)})`);
 assert.ok(pocket!==null&&pocket<.04,`the tab at his shirt pocket as it goes in (${pocket===null?'never':(pocket*1000).toFixed(0)+' mm'})`);
 assert.ok(S.done&&!S.tab.parent&&S.opening.visible,'the tab gone (in his pocket), the opening shown');
 assert.equal(actor.bought,'drink','then he drinks it');
 assert.equal(can.parent,a.bones.handR,'still in his right hand to drink');
 for(let i=0;i<Math.round((CAN_PARTS.open[1]-t+.5)*60)&&actor.bought;i++)actor.update(1/60,state);
 assert.equal(actor.bought,null,'and the empty can is put away');
 let left=null;a.root.traverse(o=>{if(o.userData?.bought)left=o;});assert.equal(left,null,'nothing of it left in his hands');
 a.dispose();
});

test('another move before the can is open: it is opened all the same and put away, the tab never left in his hand',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene(),recipe:recipeFor('Nils Johansson')}),state={visible:true};
 for(let i=0;i<20;i++)actor.update(1/60,state);
 const can=createBoughtCan('Canned coffee'),S=can.userData.sealed;actor.drinkBought(can);
 for(let i=0;i<Math.round((at('tabOff')+.1)*60);i++)actor.update(1/60,state);
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
