import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createSpawnScene,clearArrivalLens} from '../src/render/spawn-scene.js';

function fixture(blocked=()=>false){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(65,1.6,.15,480);
 camera.position.set(0,1.8,3);
 const events=[],actor={root:new THREE.Group(),lens:{head:1.1},play:name=>events.push(name),stop:()=>events.push('stop'),lookAt:()=>{},express:()=>{}};
 const arrival=createSpawnScene({scene,camera,getActor:()=>actor,blocked,ground:()=>0,onActive:active=>events.push(active)});
 return {scene,camera,actor,arrival,events};
}
test('arrival changes the camera without relocating Johansson, flies a gull and returns to the gameplay lens',()=>{
 const {scene,camera,actor,arrival,events}=fixture();actor.root.position.set(32,1,-4);
 const position=actor.root.position.clone();arrival.start({id:'seawall',yaw:-Math.PI/2});
 arrival.update(.1);assert.equal(camera.fov,48);assert.ok(events.includes('Think'));
 assert.deepEqual(actor.root.position,position);
 for(let i=0;i<10;i++)arrival.update(.1);
 assert.equal(arrival.snapshot().bird,true);assert.equal(scene.getObjectByName('Arrival gull').visible,true);
 for(let i=0;i<50;i++){camera.position.set(32,2.8,-1);camera.quaternion.identity();arrival.update(.1);}
 assert.equal(arrival.active,false);assert.equal(camera.fov,65);assert.equal(arrival.snapshot().reason,'complete');
 assert.equal(scene.getObjectByName('Arrival gull').visible,false);
});
test('movement cancellation is immediate and restores the chosen first-person lens',()=>{
 const {arrival,camera,events}=fixture();camera.fov=74;
 arrival.start({id:'pier'});arrival.update(.1);arrival.cancel();
 assert.equal(arrival.active,false);assert.equal(camera.fov,74);assert.equal(events.at(-1),false);
 assert.equal(arrival.snapshot().reason,'input');
});
test('arrival lenses reject walls between a clear endpoint and Johansson, plus raised ground',()=>{
 const target=new THREE.Vector3(0,1.2,0),lens=new THREE.Vector3(0,2,4);
 assert.equal(clearArrivalLens(target,lens,{blocked:(x,z)=>z>1.3&&z<1.7}),false);
 assert.equal(clearArrivalLens(target,lens,{ground:()=>3}),false);
 assert.equal(clearArrivalLens(target,lens,{ground:()=>0}),true);
});
test('streamed obstructions, another travel view and interaction stop an arrival safely',()=>{
 let wall=false;const {arrival,camera}=fixture(()=>wall);
 arrival.start({id:'park-bench'});arrival.update(.1);wall=true;arrival.update(.1);
 assert.equal(arrival.active,false);assert.equal(arrival.snapshot().reason,'obstruction');assert.equal(camera.fov,65);
 wall=false;arrival.start({id:'ferry'});arrival.update(.1,{unavailable:true});
 assert.equal(arrival.snapshot().reason,'other-view');
 arrival.start({id:'ramen',inside:true});arrival.update(.1,{paused:true});
 assert.equal(arrival.snapshot().reason,'interaction');
});
test('a docks opening shows the harbour for its establishing shot only, ignores input then, then comes down to him',()=>{
 // The creator, 2026-10-19: loading felt clunky and seemed to start again after START. The shot no longer waits on
 // streaming: at most its establishing seconds over the harbour, then down to him while the rest streams in.
 const {camera,actor,arrival}=fixture();actor.root.position.set(-2.6,.1,-70.4);camera.fov=65;let loading=true;
 arrival.start({id:'landing-sign',yaw:-.89,establish:true,hold:()=>loading});
 const heights=[];for(let i=0;i<15;i++){arrival.update(.1);heights.push(camera.position.y);}
 assert.equal(arrival.holding,true);assert.equal(arrival.snapshot().establishing,true);
 assert.ok(Math.min(...heights)>actor.root.position.y+8,'the harbour is seen from high up');
 arrival.cancel('input');arrival.update(.1,{paused:true});assert.equal(arrival.active,true,'input ended the establishing shot');
 // Still loading, and yet down to him, his shot, and back to the game's lens.
 let came=false;for(let i=0;i<150&&arrival.active;i++){arrival.update(.1);if(camera.position.distanceTo(actor.root.position)<6)came=true;}
 assert.equal(loading,true);assert.equal(arrival.active,false);assert.equal(arrival.snapshot().reason,'complete');assert.ok(came,'the lens never came down to him');assert.equal(camera.fov,65);
 // With nothing to load it is just as short.
 arrival.start({id:'pier',yaw:-.94,establish:true,hold:()=>false});let t=0;while(arrival.active&&t<20){arrival.update(.1);t+=.1;}
 assert.ok(t<11,'an opening with nothing to wait for took '+t.toFixed(1)+' s');
 // On a slow line he is not kept standing past the establishing shot.
 arrival.start({id:'pier',yaw:-.94,establish:true,hold:()=>true});for(let i=0;i<25;i++)arrival.update(.1);assert.equal(arrival.holding,false);
 // A placement still ends it at once, loading or not.
 loading=true;arrival.start({id:'pier',establish:true,hold:()=>loading});arrival.update(.1);arrival.cancel('placement');assert.equal(arrival.active,false);
});
