import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createVenueService} from '../src/people/venue-service.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {createHands} from '../src/interact/hands.js';
import {DRUNK,LIMIT,MAX_TIPSY,wantsAnother,soberUp,drink} from '../src/people/drunk.js';

function person(name){const profile=RESIDENTS.find(p=>p.name===name),g=new THREE.Group();g.userData={name,hit:{inside:false},visualReady:true};return {g,profile};}

test('one drunk scale: drinks add up, the limit stops the next one, an hour sobers by one',()=>{
 assert.ok(wantsAnother(0,1)&&wantsAnother(2,1));
 assert.ok(!wantsAnother(2.6,1),'past drunk nobody orders another');
 assert.equal(drink(3.8,1),MAX_TIPSY);assert.equal(soberUp(2.5,60),1.5);assert.equal(soberUp(.5,120),0);
});

test('a drunk avatar sways off its line while walking; a sober one walks straight',()=>{
 installDOM();
 const drift=tipsy=>{const a=buildAvatar(CAST_RECIPES.Johansson),anim=createAvatarAnimator(a);let max=0,roll=0;
  for(let i=0;i<600;i++){anim.update(1/60,{speed:1.4,tipsy});max=Math.max(max,Math.abs(a.root.position.x));roll=Math.max(roll,Math.abs(a.bones.hips.rotation.z));}
  return {max,roll};};
 const sober=drift(0),drunk=drift(3);
 assert.equal(sober.max,0);assert.ok(drunk.max>.04,'the body drifts side to side');assert.ok(drunk.roll>sober.roll+.05,'the hips roll');
});

test('beer drinkers at Minato order rounds until drunk, then stop before the limit',()=>{
 const room=new THREE.Group(),state={yen:5000},ledger=createResidentLedger(()=>state),kenji=person('Chin'),nao=person('Thao');
 kenji.g.position.set(0,0,-1.42);kenji.g.userData.inIzakaya=true;kenji.g.userData.seatHeight=.71;nao.g.userData.inIzakaya=true;
 let minutes=1100,peak=0;const service=createVenueService({room,place:'izakaya',getCustomers:()=>[kenji],getStaff:()=>nao.g,getMinutes:()=>minutes,ledger});
 // A town minute a second: every round comes and goes inside the test.
 for(let i=0;i<60*300;i++){service.update(1/60);minutes+=1/60;peak=Math.max(peak,kenji.g.userData.tipsy||0);}
 const record=state.residentLife.Chin.meals.izakaya;
 assert.ok(record.rounds>=3,'more than one beer');assert.equal(record.finished,true);
 assert.ok(peak>=DRUNK,'properly drunk');assert.ok(peak<MAX_TIPSY,'but stopped before the floor');
 assert.ok(!wantsAnother(kenji.g.userData.tipsy,1));assert.equal(state.residentLife.Chin.purchases.length,record.rounds,'every round is paid for');
 // Tomorrow's first visit, still drunk: green tea, not another beer.
 const tomorrow={yen:5000},fresh=createResidentLedger(()=>tomorrow);const next=createVenueService({room,place:'izakaya',getCustomers:()=>[kenji],getStaff:()=>nao.g,getMinutes:()=>minutes,ledger:fresh});next.update(1/60);
 assert.equal(fresh.account('Chin',minutes).meals.izakaya.drink,'tea');next.dispose();service.dispose();
});

// The Barfly retired in phase 4 of the consolidation (src/people/roster.js: gone('barfly', … to:['fuji'], "the izakaya’s
// regulars and gossip, from the residents themselves"); Minato's beer now comes only from Thao. The regular who drinks
// at Minato is a resident: Chin, served by Thao, his evening running on the town clock (rounds every 20 town minutes).
test('a regular at Minato drinks himself drunk and then rests with an empty glass',()=>{
 const room=new THREE.Group(),regular=person('Chin'),nao=person('Thao');regular.g.userData.inIzakaya=true;regular.g.userData.seatHeight=.71;nao.g.userData.inIzakaya=true;
 let minutes=1200;const service=createVenueService({room,place:'izakaya',getCustomers:()=>[regular],getStaff:()=>nao.g,getMinutes:()=>minutes});
 let peak=0;for(let i=0;i<60*400;i++){service.update(1/60);minutes+=1/60;peak=Math.max(peak,regular.g.userData.tipsy||0);}
 const data=regular.g.userData;
 assert.ok(data.socialPose==='Sit'&&!data.heldItem&&data.mealState==='finished','he rests at the counter with nothing in his hand');
 assert.ok(peak>=DRUNK&&peak<=LIMIT,'drunk, never past the limit');service.dispose();
});

test('the first-person sip runs on the avatar clock and tips further as the glass empties',()=>{
 installDOM();const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const hands=createHands({scene,camera,say(){},consume:()=>true});
 const peakTilt=(start)=>{hands.sip('draft',start,Math.max(0,start-.17));let tilt=0,steps=0,prop=null;
  while(true){hands.update(1/60);steps++;prop=camera.children[0].children.find(c=>c.userData.consumable);if(!prop)break;tilt=Math.max(tilt,prop.rotation.x);}
  return {tilt,seconds:steps/60};};
 const full=peakTilt(1),last=peakTilt(.17);
 assert.ok(Math.abs(full.seconds-2.4)<.05,'same 2.4 s as every avatar');
 assert.ok(last.tilt>full.tilt+.1,'the last mouthful tips further');
});
