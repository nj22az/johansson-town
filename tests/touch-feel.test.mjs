import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotion,createAutoRun,swipeLook,steerYaw} from '../src/input/touch-feel.js';

test('walking eases in and out instead of jumping to speed and stopping dead',()=>{
 const m=createMotion();let v=m.update(0,1,1/60);
 assert.ok(v.y>0&&v.y<.3,'not full speed on the first frame');
 for(let i=0;i<60;i++)v=m.update(0,1,1/60);assert.ok(v.y>.98,'at speed within a second');
 for(let i=0;i<60;i++)v=m.update(0,0,1/60);assert.equal(v.y,0,'and comes to rest');
});
test('pushing the stick past about 85% runs after a moment, easing off walks again',()=>{
 const r=createAutoRun();
 assert.equal(r.update(.8,.1),false);assert.equal(r.update(.8,.5),false,'a firm walk is still a walk');
 assert.equal(r.update(.86,.1),false,'not on the first frame past the mark');assert.equal(r.update(.9,.1),true);
 assert.equal(r.update(.75,.1),true,'a little wobble keeps running');assert.equal(r.update(.6,.1),false);
 assert.equal(r.update(1,.1),false);r.reset();assert.equal(r.running,false);
});
test('a swipe turns the same on a phone and a tablet, and sideways swipes barely tilt',()=>{
 const phone=swipeLook(390,0,390),tablet=swipeLook(820,0,820);
 assert.ok(Math.abs(phone.yaw-tablet.yaw)<1e-9,'a full-width swipe is the same turn');
 assert.ok(Math.abs(phone.yaw)>3&&Math.abs(phone.yaw)<4);
 const sideways=swipeLook(100,20,390),upward=swipeLook(10,100,390);
 assert.ok(Math.abs(sideways.pitch)<Math.abs(upward.pitch)*.5);
});
test('the stick held to one side while walking turns the view that way',()=>{
 assert.ok(steerYaw({x:1,y:-1},.1)<0,'right turns right');assert.ok(steerYaw({x:-1,y:-.5},.1)>0);
 assert.equal(steerYaw({x:.1,y:-1},.1),0,'straight ahead is straight ahead');
 assert.equal(steerYaw({x:1,y:.8},.1),0,'not when backing up');
 assert.equal(steerYaw({x:1,y:-1},.1,{looking:true}),0,'the looking thumb wins');
});
