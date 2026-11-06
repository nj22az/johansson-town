import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {recipeFor} from '../src/avatars/cast.js';

installDOM();

// Real shared avatar geometry, controller and animator; only the DOM/canvas is the
// repository's Node fixture. Browser rendering is checked separately.
function player(t){
 const random=Math.random;Math.random=()=>.5;
 t.after(()=>{Math.random=random;});
 const actor=createAvatarJohansson({scene:new THREE.Scene(),recipe:recipeFor('Johansson')});
 t.after(()=>{actor.root.removeFromParent();actor.avatar.dispose();});
 return actor;
}

test('greeting nod uses an open-eyed smile rather than content',t=>{
 const actor=player(t);
 actor.play('Nod');
 assert.equal(actor.expression,'smile','GREETING_EYES_REGRESSION: a conversation nod must not select closed-eye content');
 actor.update(.05,{visible:true});
 assert.equal(actor.avatar.faceState.expression,'smile');
 assert.equal(actor.avatar.faceState.blink,0);
});

test('repeated greetings keep the smile and its original expiry',t=>{
 const actor=player(t),recipe=JSON.stringify(actor.avatar.recipe);
 for(let greeting=0;greeting<3;greeting++){
  actor.play('Nod');assert.equal(actor.expression,'smile');
  for(let frame=0;frame<64;frame++)actor.update(.025,{visible:true});
  assert.equal(actor.expression,'smile','The existing 1.7-second expression duration is retained');
  for(let frame=0;frame<12;frame++)actor.update(.025,{visible:true});
  assert.equal(actor.expression,'neutral','The greeting returns to neutral');
 }
 assert.equal(JSON.stringify(actor.avatar.recipe),recipe,'No appearance or save recipe changes');
});

test('speech still moves the mouth and a natural blink reopens',t=>{
 const actor=player(t);actor.play('Nod');actor.speak(6);
 let blink=false,reopened=false,mouth=false;
 for(let frame=0;frame<240;frame++){
  actor.update(.025,{visible:true});
  const face=actor.avatar.faceState;
  if(face.blink>.5)blink=true;else if(blink)reopened=true;
  if(face.talk>.5)mouth=true;
  assert.notEqual(face.expression,'content','Speaking must not force the closed-eye greeting');
 }
 assert.ok(mouth,'Speech still animates the mouth');
 assert.ok(blink,'Ordinary blinking remains enabled');
 assert.ok(reopened,'A blink does not leave the eyes shut');
});

test('authored closed-eye gestures and sleeping remain unchanged',t=>{
 const actor=player(t);
 for(const [gesture,expression] of [['Bow','content'],['Stretch','content'],['Wave','happy'],['Laugh','laugh']]){
  actor.play(gesture);assert.equal(actor.expression,expression,gesture);
 }
 actor.play('Nod');actor.update(.05,{visible:true,sleeping:true});
 assert.equal(actor.avatar.faceState.expression,'sleep');
 actor.express('neutral');actor.update(.05,{visible:true,sleeping:false});
 assert.equal(actor.avatar.faceState.expression,'neutral');
});
