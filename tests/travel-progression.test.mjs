import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createActivities} from '../activities.js?snappy=1';
import {travelProgress} from '../src/progression/travel.js';
import {SAVE_KEY} from '../src/save.js';
import {installDOM} from './fixtures.mjs';
const make=()=>createActivities({say(){},onWeather(){},onTime(){}});

test('Tama quest and completed workshop escort unlock travel and survive reload',()=>{
 const dom=installDOM();const acts=make();assert.equal(travelProgress(acts.state).unlocked,false);
 acts.action('resident','Nhung');dom.button('About Tama');dom.button('I will look for Tama');assert.equal(acts.state.quest,1);
 // A catch uses the real inventory consumed by Tama's quest; fishing has its own timer test.
 acts.state.inventory.push('Taman');acts.action('cat');dom.button('Give Tama a fish');assert.equal(acts.state.quest,2);
 acts.action('resident','Nhung');dom.button('About Tama');assert.equal(acts.state.quest,3);assert.equal(travelProgress(acts.state).completed,1);
 for(const phase of [false,true,'walking']){acts.state.kenjiEscort=phase;acts.save();assert.equal(travelProgress(acts.state).unlocked,false,'An accepted or in-progress escort is insufficient');}
 acts.state.kenjiEscort='done';acts.save();assert.equal(travelProgress(acts.state).unlocked,true);assert.equal(acts.state.quickTravelNotified,true);
 const count=acts.state.notes.length;acts.save();assert.equal(acts.state.notes.length,count,'Unlock is recorded once');
 acts.save();const stored=dom.storage.get(SAVE_KEY);installDOM({[SAVE_KEY]:stored});const restored=make();assert.equal(travelProgress(restored.state).unlocked,true);assert.equal('cameraMode' in restored.state,false);assert.equal(restored.state.yen,1700);
});

test('old completed saves earn shortcuts, while flags and visits cannot bypass quests',()=>{
 for(const saved of [{quest:0,kenjiEscort:'done',quickTravelUnlocked:true,quickTravelNotified:true,visited:['office','market']},{quest:3,kenjiEscort:true}]){
  installDOM({[SAVE_KEY]:JSON.stringify(saved)});assert.equal(travelProgress(make().state).unlocked,false);
 }
 installDOM({'johansson-town-1988-v4':JSON.stringify({quest:3,kenjiEscort:'done',yen:400,inventory:['Green tea'],cameraMode:'third'})});const acts=make();assert.equal(travelProgress(acts.state).unlocked,true);assert.equal('cameraMode' in acts.state,false);assert.deepEqual(acts.state.inventory,['Green tea']);assert.equal(acts.state.yen,400);
});
