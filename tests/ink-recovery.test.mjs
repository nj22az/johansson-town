import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInkRecovery} from '../src/render/ink-recovery.js';

/** A clock we control, because the whole policy is about waiting. */
function fake(options){let t=0;const r=createInkRecovery({...options,now:()=>t});return {r,tick:ms=>{t+=ms;}};}

test('one bad frame costs seconds, not the session',()=>{
 const {r,tick}=fake({retries:4,cooldown:1000});
 assert.equal(r.ready(),true,'The ink cannot be built at all');
 assert.equal(r.failures,0);

 assert.equal(r.failed(),true,'A first failure gave up immediately');
 assert.equal(r.ready(),false,'It retried in the same frame it failed');
 tick(999);assert.equal(r.ready(),false);
 tick(1);assert.equal(r.ready(),true,'It never came back');
 assert.equal(r.retrying,true);
 assert.equal(r.exhausted,false);
});

test('a driver that keeps refusing is asked less and less, then left alone',()=>{
 const {r,tick}=fake({retries:3,cooldown:1000});
 // The wait lengthens with each failure, so a broken driver is not hammered.
 const waits=[];
 for(let i=1;i<=3;i++){
  assert.equal(r.failed(),true,'Gave up at attempt '+i);
  let waited=0;while(!r.ready()&&waited<20000){tick(100);waited+=100;}
  waits.push(waited);
 }
 assert.deepEqual(waits,[1000,2000,3000],'The cooling-off does not lengthen');

 // Past the retry count it stops asking, whatever the clock says.
 assert.equal(r.failed(),false,'It kept promising retries it will not make');
 assert.equal(r.exhausted,true);
 assert.equal(r.retrying,false,'It still claims to be retrying');
 tick(1e6);
 assert.equal(r.ready(),false,'An exhausted driver is asked again anyway');
});

test('a restored context is tried again at once',()=>{
 const {r,tick}=fake({retries:2,cooldown:5000});
 r.failed();r.failed();r.failed();
 assert.equal(r.exhausted,true);
 // The targets that died went with the old context; the new one deserves a go.
 r.restored();
 assert.equal(r.failures,0);
 assert.equal(r.exhausted,false);
 assert.equal(r.ready(),true,'A restored context still has to serve its cooling-off');
});

test('the good case never waits',()=>{
 const {r}=fake({});
 for(let i=0;i<100;i++)assert.equal(r.ready(),true);
 assert.equal(r.failures,0);
 assert.equal(r.retrying,false);
 assert.equal(r.exhausted,false);
});
