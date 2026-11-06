import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {STUDIO_KEY,THUAN_OUTFITS,studioKey,cleanStudioChoices,readStudioChoices,writeStudioChoices,applyStudioChoices} from '../src/studio-handoff.js';
import {restoreHomeDecor} from '../src/progression/home-decor.js';
import {addPlayer,switchPlayer,DEFAULT_PLAYER} from '../src/save.js';
import {createActivities} from '../activities.js';
import {buildMayorHome,MAYOR_HOME_FLOOR} from '../src/world/interiors/town-hall.js';
import {showHomeFurniture} from '../src/build/home-decorate.js';
import {createHomeCustomization} from '../src/world/interiors/home-customization.js';

test('each saved game has its own Studio choices, under the same pattern as its look',()=>{
 installDOM();
 assert.equal(studioKey(localStorage),STUDIO_KEY,'the first player keeps the plain key');
 const id=addPlayer(localStorage,'Second neighbour');
 assert.equal(studioKey(localStorage),STUDIO_KEY+'@'+id);
 writeStudioChoices({thuanOutfit:'sailor'},localStorage);
 switchPlayer(localStorage,DEFAULT_PLAYER.id);
 assert.deepEqual(readStudioChoices(localStorage),{},'another saved game is not dressed by this one');
});

test('only what World understands is kept, and a change merges with what is stored',()=>{
 installDOM();
 assert.deepEqual(cleanStudioChoices({thuanOutfit:'swimsuit',home:'cream',extra:1}),{});
 assert.deepEqual(cleanStudioChoices({home:{wall:'harbour',textile:'nope',keepsake:'cat',items:[{id:'p1',kind:'tansu',x:0,z:0},{id:'p2',kind:'spaceship',x:0,z:0}]}}),
  {home:{wall:'harbour',textile:'indigo',keepsake:'cat',items:[{id:'p1',kind:'tansu',x:0,z:0,yaw:0}]}});
 writeStudioChoices({home:{wall:'garden'}},localStorage);
 writeStudioChoices({thuanOutfit:'nozomi'},localStorage);
 assert.deepEqual(readStudioChoices(localStorage),{home:restoreHomeDecor({wall:'garden'}),thuanOutfit:'nozomi'});
 localStorage.setItem(STUDIO_KEY,'{not json');assert.deepEqual(readStudioChoices(localStorage),{});
 assert.deepEqual(THUAN_OUTFITS.map(o=>o.id),['clothes','sailor','nozomi'],'the outfits island/play.js has always known');
});

test('World takes Studio’s choices into the game, and says what changed',()=>{
 const state={homeDecor:restoreHomeDecor(),thuanOutfit:'clothes'};
 assert.deepEqual(applyStudioChoices(state,{}),{home:false,thuan:false});
 assert.deepEqual(applyStudioChoices(state,{home:restoreHomeDecor()}),{home:false,thuan:false},'the same home is no change');
 assert.deepEqual(applyStudioChoices(state,{home:{wall:'harbour'},thuanOutfit:'sailor'}),{home:true,thuan:true});
 assert.equal(state.homeDecor.wall,'harbour');assert.equal(state.thuanOutfit,'sailor');
});

test('a saved game opens with the home and outfit chosen in Studio, and its save carries them',()=>{
 installDOM();
 writeStudioChoices({home:{wall:'garden',textile:'coral'},thuanOutfit:'sailor'},localStorage);
 const activities=createActivities({say(){},onTime(){},onWeather(){}});
 assert.equal(activities.state.homeDecor.wall,'garden');assert.equal(activities.state.homeDecor.textile,'coral');
 assert.equal(activities.state.thuanOutfit,'sailor');
 activities.save();
 const saved=JSON.parse(localStorage.getItem('johansson-town-1988-v5'));
 assert.equal(saved.homeDecor.wall,'garden');assert.equal(saved.thuanOutfit,'sailor');
});

test('World shows the furniture Studio arranged, and follows a later arrangement',()=>{
 installDOM();
 const room=new THREE.Group(),colliders=[];
 buildMayorHome({room,reg(){},action(){},collider:(x,z,w,d,height,minY)=>colliders.push({x,z,w,d,height,minY})});
 const group=room.getObjectByName('Mayor’s home');
 const state={homeDecor:restoreHomeDecor({items:[{id:'p1',kind:'andon',x:-5,z:1.7,yaw:0}]})};
 const furniture=showHomeFurniture({group,colliders,state,floor:MAYOR_HOME_FLOOR.walkable,keepClear:MAYOR_HOME_FLOOR.keepClear});
 assert.deepEqual(furniture.skipped,[],'the lamp stands where Studio put it');
 assert.deepEqual(furniture.placements.list().map(p=>p.kind),['andon']);
 state.homeDecor=restoreHomeDecor({items:[{id:'p4',kind:'rug',x:-4.4,z:2,yaw:0}]});
 furniture.reload();
 assert.deepEqual(furniture.placements.list().map(p=>p.id+':'+p.kind),['p4:rug'],'the old lamp is gone and the rug is down');
 assert.equal(group.children.filter(o=>o.userData.placement).length,1,'nothing is left behind in the room');
 // The shelf goes on the ground floor's own group (the house has three: johansson-house-interior.js).
 const floor=group.getObjectByName('House G0'),before=floor.children.length,all=group.children.length;createHomeCustomization({room,state});
 assert.deepEqual(floor.children.slice(before).map(o=>o.name),['Earned keepsake shelf'],'World adds the shelf, and no Decorate your home point');
 assert.equal(group.children.length,all,'nothing else is added to the home');
});
