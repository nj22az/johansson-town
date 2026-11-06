import test from 'node:test';
import assert from 'node:assert/strict';
import {thuanHasCommutePriority,yieldAsideTarget,commuteCrowdRadii,residentCommitted} from '../src/people/thuan-commute-yield.js';

test('Thuan has commute priority on market and morning platform, not nap/evening bus',()=>{
 const g=place=>'market';
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'market'}},'town'),true);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'bus'}},'arriving'),true);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'bus'}},'town'),true);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'bus'}},'departing'),false);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'nap'}},'town'),false);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'stroll',character:{moving:true}}},'town'),true);
 assert.equal(thuanHasCommutePriority({visible:true,userData:{place:'market',inMarket:true}},'town'),false);
 assert.equal(thuanHasCommutePriority({visible:false,userData:{place:'market'}},'town'),false);
});

test('yield pushes a blocker beside Thuan forward path, not behind her',()=>{
 // Thuan facing -Z (yaw 0 in three.js look): forward is 0,-1
 const thuan=[0,0],yaw=0;
 const ahead=[0,-1];
 const aside=yieldAsideTarget(ahead,thuan,yaw);
 assert.ok(aside,'blocker ahead must yield');
 assert.ok(Math.abs(aside[0])>0.5,'yield moves sideways');
 const behind=[0,1.2];
 assert.equal(yieldAsideTarget(behind,thuan,yaw),null);
});

test('crowd radii give Thuan a wide bubble and a softer advance',()=>{
 assert.equal(commuteCrowdRadii(false,true),.95);
 assert.equal(commuteCrowdRadii(true,false),.42);
 assert.equal(commuteCrowdRadii(true,false,true),.78,'Thuan must route around a committed resident');
 assert.equal(commuteCrowdRadii(false,false),.61);
});

test('shopping and other authored activities hold right of way',()=>{
 assert.equal(residentCommitted({userData:{shopping:true}}),true,'Thao buying soda must not be displaced');
 assert.equal(residentCommitted({userData:{usingTownObject:true}}),true);
 assert.equal(residentCommitted({userData:{serving:true}}),true);
 assert.equal(residentCommitted({userData:{seatHeight:.55}}),true);
 assert.equal(residentCommitted({userData:{character:{moving:true}}}),false,'an ordinary walker may yield');
});
