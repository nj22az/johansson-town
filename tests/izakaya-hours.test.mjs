import test from 'node:test';
import assert from 'node:assert/strict';
import {izakayaJob,closedGreeting,CLEANING_POSES} from '../src/people/izakaya-hours.js';
import {residentPlan,izakayaOpen} from '../src/people/social.js';
import {PROFILES} from '../src/people/profiles.js';
import {SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';

const profile=name=>PROFILES.find(p=>p.name===name);
test('Thao cleans after last orders; nobody lives in the bar and nobody is there while it is shut and dark (phase 4)',()=>{
 for(let m=0;m<1440;m+=10){
  assert.equal(izakayaJob('Barfly',m),null,'the retired regular has no job at '+m);
  const job=izakayaJob('Thao',m);
  if(job){assert.ok(!izakayaOpen(m),'cleaning is closed-hours work');assert.ok(CLEANING_POSES.includes(job.pose),job.pose+' is a cleaning pose');assert.equal(residentPlan(profile('Thao'),m).place,'izakaya','Thao is there for her job at '+m);}
  if(m>=240&&m<900)assert.notEqual(residentPlan(profile('Thao'),m).place,'izakaya','the bar is empty while it is shut, at '+m);
 }
});
test('Thao stays an hour after last orders to wipe the counter, then goes home to sleep',()=>{
 assert.equal(residentPlan(profile('Thao'),200).place,'izakaya');
 assert.match(residentPlan(profile('Thao'),200).activity,/wiping the counter/);
 assert.notEqual(residentPlan(profile('Thao'),300).place,'izakaya');
});
test('every cleaning station is on open floor, clear of the furniture',()=>{
 const hit=([x,,z])=>SHARED_DINING_COLLIDERS.some(c=>Math.abs(x-c.x)<c.w/2+.3&&Math.abs(z-c.z)<c.d/2+.3);
 for(let m=0;m<1440;m++)for(const n of ['Thao']){const job=izakayaJob(n,m);if(job)assert.equal(hit(job.at),false,n+' at '+job.at+' ('+job.activity+')');}
});
test('the line at the door says who is there',()=>{
 assert.match(closedGreeting(200),/Thao is wiping/);assert.match(closedGreeting(400),/closed until four/);assert.match(closedGreeting(930),/getting ready/);assert.doesNotMatch(closedGreeting(700),/Barfly/);
});
