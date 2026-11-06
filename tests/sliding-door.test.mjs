import test from 'node:test';
import assert from 'node:assert/strict';
import {SLIDING_DOOR,doorState,stepDoor} from '../src/world/sliding-door.js';

const run=(state,seconds,near,trace)=>{for(let t=0;t<seconds;t+=1/30){stepDoor(state,1/30,near);trace?.push(state.amount);}return state;};

test('the sliding door glides open, holds, glides shut, and never jumps', () => {
 const s=doorState(),trace=[];
 run(s,1,true,trace);
 assert.ok(s.amount>.95,'open within a second');
 const opening=trace.slice();
 for(let i=1;i<opening.length;i++)assert.ok(opening[i]>=opening[i-1]-1e-9,'opening never goes back');
 const steps=trace.map((a,i)=>i?a-trace[i-1]:a);assert.ok(Math.max(...steps)<.12,'no frame moves it more than an eighth');
 assert.ok(steps[0]<.04,'it gets going, it does not snap');
 run(s,SLIDING_DOOR.hold-.2,false);assert.ok(s.amount>.95,'it holds a moment after they have gone');
 const closing=[];run(s,2.4,false,closing);
 assert.ok(s.amount<.03,'shut again');
 const c=closing.map((a,i)=>i?closing[i-1]-a:0);assert.ok(Math.max(...c)<.08,'it closes more slowly than it opens');
});

test('it reverses smoothly when somebody comes back while it is closing', () => {
 const s=run(doorState(),1,true);run(s,SLIDING_DOOR.hold+.5,false);
 const before=s.amount,trace=[];run(s,.6,true,trace);
 assert.ok(before<.9&&before>.1,'caught halfway');
 assert.ok(trace[trace.length-1]>before,'opening again');
 const steps=trace.map((a,i)=>Math.abs(i?a-trace[i-1]:a-before));assert.ok(Math.max(...steps)<.12,'no jump when it turns round');
});
