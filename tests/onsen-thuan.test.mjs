import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {RESIDENTS} from '../src/people/residents.js';
import {residentPlan,thuanAtOnsen,onsenInvitationDay} from '../src/people/social.js';
import {createIndoorResidents} from '../src/people/indoor-residents.js';
import {ONSEN_DOOR} from '../src/world/onsen-layout.js';
import {ONSEN_ROOM,ONSEN_SEATS} from '../src/world/interiors/onsen.js';
import {installDOM} from './fixtures.mjs';

const thuan=RESIDENTS.find(p=>p.name==='Thuan');
const commuter={};

test('asked along, Thuan goes from locking up to Umi-no-yu, and still makes her bus',()=>{
 // 20:15 on day 1 (a Thursday: day 3 is a Saturday, and at the weekend she is home on Kitano-jima), the evening she said yes to.
 const evening=1*1440+1215,state={...commuter,onsenDate:1};
 assert.equal(residentPlan(thuan,evening,false,state).place,'onsen');
 assert.deepEqual(residentPlan(thuan,evening,false,state).target,ONSEN_DOOR);
 // Not asked, or asked for another evening: her usual hour.
 assert.notEqual(residentPlan(thuan,evening,false,commuter).place,'onsen');
 assert.notEqual(residentPlan(thuan,evening,false,{...commuter,onsenDate:0}).place,'onsen');
 // Never into her shift, and out in time for the last bus.
 assert.equal(thuanAtOnsen(thuan,1*1440+900,false,state),false);
 assert.equal(thuanAtOnsen(thuan,1*1440+1300,false,state),false);
 // Asking after her window has gone means tomorrow.
 assert.equal(onsenInvitationDay(thuan,1*1440+700,false,commuter),1);
 assert.equal(onsenInvitationDay(thuan,1*1440+1300,false,commuter),2);
});

test('the bath borrows Thuan into the rock pool in her swimwear (the shared bath is a swimwear zone) and gives her back dressed',()=>{
 const street=new THREE.Group(),scene=new THREE.Group();scene.add(street);
 const world={people:RESIDENTS.map((profile,i)=>{const g=new THREE.Group();g.userData.name=profile.name;g.userData.hit={inside:false};g.position.set(i,0,i+1);street.add(g);return {g,profile};})};
 const person=world.people.find(p=>p.profile.name==='Thuan'),g=person.g,state={...commuter,onsenDate:0};
 let playerSeat=null;
 const guests=createIndoorResidents({world,parent:scene,place:'onsen',layout:{entrance:ONSEN_ROOM.spawn},getState:()=>state,getPlayerSeat:()=>playerSeat});
 g.position.set(ONSEN_DOOR[0],0,ONSEN_DOOR[1]);g.userData.indoors='onsen';
 assert.deepEqual(guests.sync(1215),['Thuan']);
 assert.equal(g.parent,scene);assert.equal(g.userData.inOnsen,true);assert.equal(g.userData.outfit,'swim');
 assert.equal(g.userData.socialPose,'Soak');assert.equal(g.userData.seatHeight,ONSEN_SEATS.rockBeside.surfaceY);
 assert.deepEqual(g.position.toArray(),ONSEN_SEATS.rockBeside.position);
 guests.restore();
 assert.equal(g.parent,street);assert.equal(g.userData.inOnsen,undefined);assert.equal(g.userData.outfit,undefined);
 // With the player already in her usual corner, she takes the other side of the pool.
 playerSeat='rockBeside';g.position.set(ONSEN_DOOR[0],0,ONSEN_DOOR[1]);g.userData.indoors='onsen';
 guests.sync(1215);assert.deepEqual(g.position.toArray(),ONSEN_SEATS.rock.position);guests.restore();
 // Nobody else is sent to the bath.
 assert.ok(world.people.filter(p=>p!==person).every(p=>!p.g.userData.inOnsen));
});

test('the invitation survives a reload, so she is still expected at the bath',async()=>{
 const {SAVE_KEY}=await import('../src/save.js');
 installDOM({[SAVE_KEY]:JSON.stringify({yen:500,onsenDate:20719})});
 const {createActivities}=await import('../activities.js?onsen-date=1');
 const activities=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>20719*1440+700});
 assert.equal(activities.state.onsenDate,20719);
});
