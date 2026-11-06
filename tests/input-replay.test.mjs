import test from 'node:test';
import assert from 'node:assert/strict';
import {REPLAY_VERSION,CHECK_EVERY,FRAME_LENGTH,encodeFrame,decodeFrame,createRecorder,recordingProblems,createPlayer} from '../src/input/replay.js';

const start={room:null,x:1,y:0,z:2,yaw:.5,pitch:0,minutes:600,weather:'sunny'};
const walk=(n,{dx=.05,dt=1/60}={})=>{const rec=createRecorder(start,{note:'test'});for(let i=0;i<n;i++)rec.add({f:1,s:0,yaw:.5,pitch:-.1,running:i%2===0,walking:false,x:1+dx*(i+1),z:2,dt,wander:0});return rec.finish();};

test('a frame keeps the move, the view, the flags, the place, the step and the wander',()=>{
 const f={f:.71234,s:-.3,yaw:1.2345678,pitch:-.25,running:true,walking:true,x:12.34567,z:-3.21,dt:1/60,wander:.0123};
 const a=encodeFrame(f);
 assert.equal(a.length,FRAME_LENGTH);
 const d=decodeFrame(a);
 assert.equal(d.f,.71234);assert.equal(d.yaw,1.234568);assert.equal(d.x,12.346);assert.equal(d.z,-3.21);
 assert.equal(d.running,true);assert.equal(d.walking,true);assert.equal(d.dt,.016666667);assert.equal(d.wander,.0123);
 assert.deepEqual(decodeFrame(encodeFrame({running:false,walking:true})).running,false);
});

test('a recording is plain JSON with its version, start and steps',()=>{
 const rec=walk(5);
 assert.equal(rec.version,REPLAY_VERSION);assert.equal(rec.note,'test');assert.deepEqual(rec.start,start);
 assert.equal(rec.frames.length,5);
 assert.deepEqual(JSON.parse(JSON.stringify(rec)),rec);
 assert.deepEqual(recordingProblems(rec),[]);
});

test('a finished or cancelled recorder takes no more steps',()=>{
 const r=createRecorder(start);r.add({});r.finish();r.add({});assert.equal(r.length,1);assert.equal(r.open,false);
 const c=createRecorder(start);c.cancel();c.add({});assert.equal(c.length,0);
});

test('damaged recordings are refused, in words',()=>{
 assert.deepEqual(recordingProblems(null),['That is not a recording.']);
 const rec=walk(3);
 assert.match(recordingProblems({...rec,version:99}).join(),/version 99/);
 assert.match(recordingProblems({...rec,start:{x:1}}).join(),/where it starts/);
 assert.match(recordingProblems({...rec,frames:[]}).join(),/no steps/);
 assert.match(recordingProblems({...rec,frames:[[1,2,3]]}).join(),/damaged/);
 assert.match(recordingProblems({...rec,frames:[[0,0,0,0,0,0,0,5,0]]}).join(),/damaged/,'a step longer than the game allows');
 assert.throws(()=>createPlayer({...rec,frames:[]}),/no steps/);
 assert.throws(()=>createPlayer(rec,{mode:'fast'}),/No replay mode/);
});

test('the player gives every step once, then null',()=>{
 const p=createPlayer(walk(3));
 assert.equal(p.next().x,1.05);p.next();p.next();
 assert.equal(p.next(),null);assert.equal(p.done,true);
});

test('drift is measured at each second and at the last step, and the worst is kept',()=>{
 const n=CHECK_EVERY*2+10,rec=walk(n),p=createPlayer(rec);
 for(let i=0;i<n;i++){const fr=p.next();const off=i===CHECK_EVERY-1?.2:i===n-1?.05:i===5?9:0;p.check(fr.x+off,fr.z);}
 const r=p.report();
 assert.equal(r.done,true);assert.equal(r.played,n);
 assert.deepEqual(r.drift,{worst:.2,at:CHECK_EVERY-1,last:.05},'a step between checkpoints is not measured');
});

test('a perfect playback reports no drift',()=>{
 const rec=walk(CHECK_EVERY+1),p=createPlayer(rec,{mode:'poses'});
 for(let fr;(fr=p.next());)p.check(fr.x,fr.z);
 assert.deepEqual(p.report().drift,{worst:0,at:-1,last:0});
 assert.equal(p.report().mode,'poses');
});
