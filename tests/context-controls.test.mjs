import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {controlVisibility} from '../src/interact/control-visibility.js';

test('idle exploration hides unused controls; movement, targets and held drinks reveal only relevant actions',()=>{
 const idle={playing:true,paused:false,seated:false,inside:false,moving:false,running:false,canDrink:false,hasTarget:false};
 assert.deepEqual(controlVisibility(idle),{mobile:true,act:false,drink:false,run:false,jump:false,bagButton:false});
 assert.equal(controlVisibility({...idle,hasItems:true}).bagButton,true,'The bag appears once something is in it');
 assert.equal(controlVisibility({...idle,hasItems:true,paused:true}).bagButton,false,'and steps away behind a menu');
 const walking=controlVisibility({...idle,moving:true});assert.ok(walking.run&&walking.jump&&!walking.act);
 assert.equal(controlVisibility({...idle,hasTarget:true}).act,true);
 assert.equal(controlVisibility({...idle,canDrink:true}).drink,true);
 assert.equal(controlVisibility({...idle,running:true}).run,true,'Running toggle remains reachable when stopping');
 assert.equal(controlVisibility({...idle,moving:true,inside:true}).jump,false);
 const seated=controlVisibility({...idle,seated:true,moving:true});assert.ok(seated.act&&!seated.run&&!seated.jump);
 assert.ok(Object.values(controlVisibility({...idle,paused:true,moving:true,canDrink:true,hasTarget:true})).every(v=>!v));
 assert.ok(Object.values(controlVisibility({...idle,playing:false})).every(v=>!v));
});

test('a control under a finger stays on screen until the touch ends',()=>{
 const idle={playing:true,paused:false,seated:false,inside:false,moving:false,running:false,canDrink:false,hasTarget:false};
 // Each of these would be hidden by its own rule; the press is what keeps it up.
 assert.equal(controlVisibility({...idle,pressed:['act']}).act,true,'Action held while its target is lost');
 assert.equal(controlVisibility({...idle,pressed:['run']}).run,true,'Run held after coming to a stop');
 assert.equal(controlVisibility({...idle,inside:true,pressed:['jump']}).jump,true,'Jump held on stepping indoors');
 assert.equal(controlVisibility({...idle,pressed:['drink']}).drink,true,'Drink held as the can empties');
 assert.equal(controlVisibility({...idle,seated:true,pressed:['run']}).run,true,'Run held while sitting down');
 // One press never reveals the others.
 const one=controlVisibility({...idle,pressed:['run']});
 assert.deepEqual(one,{mobile:true,act:false,drink:false,run:true,jump:false,bagButton:false});
 // Opening a modal takes the controls away regardless of what is held.
 const held=['act','run','jump','drink'];
 assert.ok(Object.values(controlVisibility({...idle,paused:true,pressed:held})).every(v=>!v),'A modal clears held controls');
 assert.ok(Object.values(controlVisibility({...idle,playing:false,pressed:held})).every(v=>!v),'Controls stay away before play begins');
});

test('contextual buttons fade instead of being removed from under the thumb',async()=>{
 const css=await readFile(new URL('../context-controls.css',import.meta.url),'utf8');
 // display:none would collapse the button mid-tap and shift what sits under the thumb.
 assert.match(css,/#act\.control-off[^}]*opacity:0/,'Hidden controls fade rather than collapse');
 assert.match(css,/#act\.control-off[^}]*pointer-events:none/,'A faded control cannot swallow a tap');
 assert.doesNotMatch(css,/\.control-off\{[^}]*display:none/,'control-off never removes layout');
 assert.doesNotMatch(css,/controls-idle/,'The stick hides itself now, so there is no idle state to dim');
 const markup=await readFile(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['act','run','jump','drink'])
  assert.match(markup,new RegExp('id="'+id+'" class="control-off"'),id+' starts faded, not display:none');
});

test('the whole touch pad leaves when play stops, and comes back with it',()=>{
 const idle={playing:true,paused:false,seated:false,inside:false,moving:false,running:false,canDrink:false,hasTarget:false};
 assert.equal(controlVisibility(idle).mobile,true);
 assert.equal(controlVisibility({...idle,playing:false}).mobile,false);
 assert.equal(controlVisibility({...idle,paused:true}).mobile,false,'a menu takes the pad with it');
 // The stick itself no longer needs a dimmed state: it draws nothing between touches.
 // See tests/virtual-joystick.test.mjs.
});
