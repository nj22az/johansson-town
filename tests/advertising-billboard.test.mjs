import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createIzakayaTV,shuffledPlaylist} from '../src/world/advertising-billboard.js';
import {installDOM,Element} from './fixtures.mjs';
class Video extends Element{
 constructor(){super();this.paused=true;this.loads=0;this.plays=0;}
 load(){this.loads++;}play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}
 emit(name){for(const fn of this.listeners[name]||[])fn();}
}
test('CRT requests video only inside Minato and pauses outside, behind the screen and on hidden pages',async()=>{
 installDOM();document.hidden=false;const video=new Video(),parent=new THREE.Group(),camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.set(0,0,5);camera.lookAt(0,0,0);
 const board=createIzakayaTV({parent,position:[0,0,0],yaw:0,video,clips:[{file:'video/one.mp4',aspect:1}]});
 assert.equal(board.group.name,'Minato CRT television');assert.ok(new THREE.Box3().setFromObject(board.group).getSize(new THREE.Vector3()).x<1.1);assert.equal(board.screen.geometry.parameters.width/board.screen.geometry.parameters.height,4/3);assert.equal(video.loads,0);assert.equal(video.muted,true);assert.equal(video.playsInline,true);
 board.update({camera,active:false});assert.equal(video.loads,0);
 board.update({camera,active:true});await Promise.resolve();assert.equal(video.loads,1);assert.equal(video.paused,false);assert.equal(video.loop,true);assert.equal(board.screen.scale.x,.75,'Square video is pillarboxed inside the 4:3 tube');
 board.update({camera,active:false});assert.equal(video.paused,true);
 board.update({camera,active:true});await Promise.resolve();assert.equal(video.loads,1,'Resume uses the same decoded clip');
 camera.position.z=-5;camera.lookAt(0,0,0);board.update({camera,active:true});assert.equal(video.paused,true);
 camera.position.z=5;camera.lookAt(0,0,10);board.update({camera,active:true});assert.equal(video.paused,true,'Off-screen screen pauses');
 camera.lookAt(0,0,0);document.hidden=true;board.update({camera,active:true});assert.equal(video.paused,true);
 board.dispose();assert.equal(parent.children.length,0);
});
test('multi-clip cycles shuffle without adjacent repeat; failed media cannot retry forever',async()=>{
 for(let previous=0;previous<4;previous++){
  const list=shuffledPlaylist(4,previous,()=>.25);assert.deepEqual([...list].sort(),[0,1,2,3]);assert.notEqual(list[0],previous);
 }
 installDOM();document.hidden=false;const video=new Video(),camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.z=5;camera.lookAt(0,0,0);
 const board=createIzakayaTV({parent:new THREE.Group(),position:[0,0,0],yaw:0,video,clips:[{file:'a.mp4'},{file:'b.mp4'}]});
 board.update({camera,active:true});assert.equal(video.loop,false);const first=video.src;video.emit('ended');assert.notEqual(video.src,first);
 video.emit('error');video.emit('error');const loads=video.loads;board.update({camera,active:true});assert.equal(video.loads,loads);board.dispose();
});
