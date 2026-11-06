import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLoadingProgress,STARTUP_STEPS} from '../loading-progress.js';

test('completed work moves the bar; the island must be drawn before START, the first gameplay frame finishes it',async()=>{
 const p=createLoadingProgress(),seen=[];
 assert.equal(p.snapshot().percent,0);assert.equal(p.snapshot().ready,false);
 for(const [id] of STARTUP_STEPS.slice(0,-1)){
  p.start(id);const running=p.snapshot();
  assert.ok(running.target>running.percent,'a running step lets the bar glide');
  p.complete(id);p.complete(id);const after=p.snapshot();
  assert.ok(running.target<after.percent||after.percent===100,'the glide never reaches the end of a step that has not finished');
  seen.push(after.percent);
 }
 assert.deepEqual(seen,[...seen].sort((a,b)=>a-b),'never backwards');
 let ready=false;p.ready.then(()=>{ready=true;});await Promise.resolve();assert.equal(ready,false);
 assert.equal(p.snapshot().ready,true,'drawn once: START may be offered');assert.equal(p.snapshot().percent,100);
 p.start('frame');assert.equal(p.snapshot().label,'Entering the island');
 p.complete('frame');await p.ready;assert.equal(ready,true);assert.equal(p.snapshot().label,'Island ready');
});

test('out-of-order controls/code completion and a growing file queue cannot inflate task progress',()=>{
 const p=createLoadingProgress();p.complete('code');p.complete('controls');
 const percent=p.snapshot().percent;p.fileProgress('accessories',1,3,0);p.fileProgress('scene',3,7,1);
 assert.deepEqual(p.snapshot().assets,{completed:4,total:10,failed:1});assert.equal(p.snapshot().percent,percent);
 p.fileProgress('scene',4,12,1);
 assert.deepEqual(p.snapshot().assets,{completed:5,total:15,failed:1});assert.equal(p.snapshot().percent,percent);
 assert.throws(()=>p.complete('imaginary'),/Unknown loading step/);
});

test('a failed load remains incomplete and rejects readiness instead of filling the bar',async()=>{
 const p=createLoadingProgress();p.complete('controls');p.fail(Error('download interrupted'));p.complete('frame');
 await assert.rejects(p.ready,/download interrupted/);
 assert.equal(p.snapshot().completed,1);assert.equal(p.snapshot().label,'Loading failed');
 assert.equal(p.snapshot().error,'download interrupted');
});

test('file tracking preserves existing loading-manager hooks and records fallback failures',()=>{
 const calls=[],manager={onStart(...a){calls.push(['start',...a]);},onProgress(...a){calls.push(['progress',...a]);},onError(url){calls.push(['error',url]);}};
 const p=createLoadingProgress();p.watch(manager);
 manager.onStart('tree',0,2);manager.onError('tree');manager.onProgress('tree',1,2);manager.onProgress('bench',2,2);
 assert.deepEqual(p.snapshot().assets,{completed:2,total:2,failed:1});assert.equal(calls.length,4);
 assert.equal(p.snapshot().completed,0,'finished files do not pretend that scene construction is finished');
});

test('published loader: one bar, START held until the island is drawn, no timers in the progress model',async()=>{
 const root=new URL('../',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
 assert.match(html,/role="progressbar"/);assert.match(html,/await progress.ready/);
 assert.match(html,/<button id="enter"[^>]*class="loading" disabled>/,'START is the bar until the island is ready');
 assert.match(html,/progress.snapshot\(\).ready\)progress.start\('frame'\)/);
 assert.doesNotMatch(await readFile(new URL('loading-progress.js',root),'utf8'),/setInterval|setTimeout|Date\.now|performance\.now/);
});
