import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDetailStream} from '../src/world/detail-stream.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('only nearby details load, one at a time, and walking away does not fetch distant districts',async()=>{
 const calls=[];let finish;const stream=createDetailStream();
 stream.add({id:'shop',x:0,z:0,load:()=>{calls.push('shop');return new Promise(resolve=>finish=resolve);}});
 stream.add({id:'port',x:0,z:-70,load:()=>{calls.push('port');return true;}});
 stream.update({x:0,z:0});await tick();stream.update({x:0,z:-70});assert.deepEqual(calls,['shop']);
 finish(true);await tick();stream.update({x:0,z:0});await tick();assert.deepEqual(calls,['shop']);
 stream.update({x:0,z:-70});await tick();assert.deepEqual(calls,['shop','port']);assert.deepEqual(stream.stats.loaded,['shop','port']);
});
test('stalled detail releases the queue and keeps fallback status',async()=>{
 const stream=createDetailStream({timeoutMs:5});stream.add({id:'bad',x:0,z:0,load:()=>new Promise(()=>{})});stream.add({id:'good',x:1,z:0,load:()=>true});
 stream.update({x:0,z:0});await new Promise(resolve=>setTimeout(resolve,10));stream.update({x:0,z:0});await tick();assert.deepEqual(stream.stats.failed,['bad']);assert.deepEqual(stream.stats.loaded,['good']);
});

test('visible residents have priority, failed requests retry with a bound, and look-ahead loads the next frontage',async()=>{
 let time=0,tries=0;const calls=[],stream=createDetailStream({now:()=>time,retryMs:10,maxAttempts:2});
 stream.add({id:'scenery',x:0,z:0,load:()=>{calls.push('scenery');return true;}});
 stream.add({id:'Thuan',priority:0,x:2,z:0,load:()=>{calls.push('Thuan');return ++tries>1;}});
 stream.add({id:'next-shop',priority:1,x:0,z:-48,radius:35,load:()=>{calls.push('next-shop');return true;}});
 stream.update({x:0,z:0});await tick();assert.deepEqual(calls,['Thuan']);
 stream.update({x:0,z:0});await tick();assert.deepEqual(calls,['Thuan','scenery']);
 time=10;stream.update({x:0,z:0});await tick();assert.equal(tries,2);assert.deepEqual(stream.stats.failed,[]);
 stream.update({x:0,z:0},{x:0,z:-1});await tick();assert.equal(calls.at(-1),'next-shop');
 let failures=0;stream.add({id:'offline',x:0,z:0,load:()=>{failures++;return false;}});
 for(let i=0;i<5;i++){time+=100;stream.update({x:0,z:0});await tick();}assert.equal(failures,2);
});

test('late success updates the live model and removes a timeout without a duplicate request',async()=>{
 let finish,loads=0,changed=0;const stream=createDetailStream({timeoutMs:5,retryMs:0,onChange:()=>changed++});
 const entry=stream.add({id:'slow',x:0,z:0,load:()=>{loads++;return new Promise(resolve=>finish=resolve);}});
 stream.update({x:0,z:0});await new Promise(resolve=>setTimeout(resolve,10));stream.update({x:0,z:0});assert.equal(loads,1);
 finish(true);await tick();assert.equal(entry.status,'ready');assert.deepEqual(stream.stats.failed,[]);assert.equal(changed,1);
});

test('desktop preload overlaps two jobs, bounds pending decodes, and looks further ahead',async()=>{
 const done=[],calls=[],stream=createDetailStream({lookAhead:32,radiusScale:1.8,maxConcurrent:2,maxPending:2,timeoutMs:5});
 for(let i=0;i<4;i++)stream.add({id:'detail-'+i,x:60+i,z:0,radius:20,load:()=>{calls.push(i);return new Promise(resolve=>done.push(resolve));}});
 stream.update({x:0,z:0},{x:1,z:0});stream.update({x:0,z:0},{x:1,z:0});stream.update({x:0,z:0},{x:1,z:0});await tick();assert.deepEqual(calls,[0,1]);
 await new Promise(resolve=>setTimeout(resolve,10));stream.update({x:0,z:0},{x:1,z:0});await tick();assert.deepEqual(calls,[0,1]);
 done.forEach(resolve=>resolve(true));await tick();stream.update({x:0,z:0},{x:1,z:0});await tick();assert.deepEqual(calls,[0,1,2]);done.at(-1)(true);await tick();
});

test('constrained startup leaves optional fallbacks in place without fetching or holding the arrival camera',async()=>{
 let calls=0,changes=0;const stream=createDetailStream({enabled:false,onChange:()=>changes++});
 stream.add({id:'large-building',x:0,z:0,radius:100,load:()=>{calls++;return true;}});
 for(let i=0;i<10;i++)stream.update({x:0,z:0});await tick();
 assert.equal(calls,0);assert.equal(changes,0);assert.equal(stream.stats.active,null);assert.equal(stream.stats.enabled,false);assert.equal(stream.pendingNear({x:0,z:0}),false);
});

test('a phone loads only the required nearby shop window and retains the optional scenery cap',async()=>{
 const calls=[],stream=createDetailStream({enabled:false});
 stream.add({id:'scenery',x:0,z:0,load:()=>{calls.push('scenery');return true;}});
 stream.add({id:'Sakura window',requiredNearby:true,x:0,z:0,radius:18,load:()=>{calls.push('Sakura');return true;}});
 stream.update({x:40,z:0});await tick();assert.deepEqual(calls,[]);
 stream.update({x:10,z:0});await tick();assert.deepEqual(calls,['Sakura']);
 stream.update({x:0,z:0});await tick();assert.deepEqual(calls,['Sakura']);
});
