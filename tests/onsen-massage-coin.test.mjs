import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {buildOnsenInterior,ONSEN_SEATS} from '../src/world/interiors/onsen.js';
import {CHAIR_TIMER,stageScenario,resetAll,trip,switchOff,isRunning} from '../src/world/interiors/onsen-electrics.js';
import {CHAIR} from '../src/world/interiors/onsen-chair.js';
import {provideCatalog} from './catalog-fixture.mjs';
installDOM();
await provideCatalog('massage-chair');

// The coin massage chair in play (briefs/NEXT.md §5, batch D): seated in it, a ¥100 coin buys ten minutes on the coin timer,
// the LED counts them down, the 運転中 lamp lights and the rollers knead. With no power the coin comes back and nothing is
// charged. Standing up early leaves it running to 0:00: the coin is spent, as with a real coin timer.
function fixture(){
 installDOM();resetAll();stageScenario('rest');switchOff('massage-chair');
 const room=new THREE.Group(),layout=buildOnsenInterior({room,reg(){},action(){},exit(){}});
 let stood=0;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>21*60,getSocialContext:()=>({inside:'onsen'}),
  getMassageChair:()=>layout.massage,onStand:()=>{stood++;}});
 const buttons=()=>document.querySelector('#activityActions').children.map(b=>b.textContent);
 const press=label=>{const b=document.querySelector('#activityActions').children.find(b=>b.textContent===label);assert.ok(b,'a button '+label+' among '+buttons().join(' | '));b.onclick();};
 const text=()=>document.querySelector('#activityBody').children.map(n=>n.textContent).join(' ');
 return {room,layout,acts,buttons,press,text,get stood(){return stood;}};
}
const seconds=(layout,s)=>{for(let t=0;t<s;t+=.5)layout.tick(.5,21*60);};

test('its seat offers the coin: the card’s label, ¥100, and the menu a seated bather sees',()=>{
 assert.equal(ONSEN_SEATS.massage.label,'Sit in the massage chair (¥100)');
 assert.equal(ONSEN_SEATS.massage.label,CHAIR.seat('seat').label,'the card’s own label');
 assert.equal(CHAIR_TIMER.coin,100);
 const f=fixture();f.acts.action('massage-chair');
 assert.deepEqual(f.buttons(),['Put in a ¥100 coin','Keep sitting','Stand up']);
 f.layout.dispose();
});

test('a coin charges ¥100 and starts ten minutes on the LED; the lamp lights and the rollers knead',()=>{
 const f=fixture(),yen=f.acts.state.yen,rollers=f.room.getObjectByName('Massage chair rollers');
 const at=()=>rollers.children.map(l=>l.position.y.toFixed(4)).join();
 const still=at();seconds(f.layout,2);assert.equal(at(),still,'the rollers are still before the coin');
 f.acts.action('massage-chair');f.press('Put in a ¥100 coin');
 assert.equal(f.acts.state.yen,yen-100,'¥100 is spent');
 const t=f.layout.massage.state();assert.equal(t.running,true);assert.equal(t.reads,'10:00');assert.equal(t.lit,true);
 assert.match(f.text(),/hundred-yen coin/);assert.deepEqual(f.buttons(),['Keep sitting','Stand up']);
 seconds(f.layout,3);assert.equal(f.layout.massage.state().reads,'9:57','it counts down');assert.notEqual(at(),still,'the rollers knead');
 // Seated again later, the menu says how long is left and offers no second coin while it runs.
 f.acts.action('massage-chair');assert.match(f.text(),/9:57/);assert.deepEqual(f.buttons(),['Keep sitting','Stand up']);
 // The receipt is Umi-no-yu's.
 assert.ok(f.acts.state.documentArchive.records.some(d=>d.type==='Receipt'&&d.amount===100&&d.organisation==='Minato Onsen'),'a receipt for the coin');
 f.layout.dispose();
});

test('standing up early leaves it running to 0:00, and then it stops by itself',()=>{
 const f=fixture();f.acts.action('massage-chair');f.press('Put in a ¥100 coin');f.press('Stand up');
 assert.equal(f.stood,1,'the bather stands up');assert.equal(isRunning('massage-chair'),true,'the coin is spent: it keeps running');
 seconds(f.layout,CHAIR_TIMER.seconds-1);assert.equal(f.layout.massage.state().running,true);
 seconds(f.layout,2);const t=f.layout.massage.state();assert.equal(t.running,false);assert.equal(t.reads,'0:00');
 f.layout.dispose();
});

test('with no power the coin comes back and nothing is charged: the circuit’s breaker down, or the whole house dark',()=>{
 for(const [breaker,says] of [['changing-sockets',/changing-room circuit/],['contract',/whole house is dark/]]){
  const f=fixture(),yen=f.acts.state.yen;trip(breaker);
  f.acts.action('massage-chair');f.press('Put in a ¥100 coin');
  assert.equal(f.acts.state.yen,yen,'nothing is charged ('+breaker+')');assert.match(f.text(),says);assert.match(f.text(),/hands the coin back/);
  assert.equal(isRunning('massage-chair'),false);assert.deepEqual(f.buttons(),['Keep sitting','Stand up']);
  f.layout.dispose();resetAll();
 }
});

test('without enough yen nothing happens but the purse says so',()=>{
 const f=fixture();f.acts.state.yen=60;f.acts.action('massage-chair');f.press('Put in a ¥100 coin');
 assert.equal(f.acts.state.yen,60);assert.equal(isRunning('massage-chair'),false);
 f.layout.dispose();
});
