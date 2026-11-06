import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildIzakayaDevices} from '../src/world/interiors/izakaya-devices.js';
import {buildIzakayaInteractive,PINK_PHONE,KARAOKE} from '../src/world/interiors/izakaya-interactive.js';

test('detailed payphone and karaoke remain inside their existing floor envelopes',()=>{
 installDOM();const room=new THREE.Group(),group=buildIzakayaDevices(room,PINK_PHONE,KARAOKE);
 const [phone,karaoke]=group.userData.placements;
 assert.ok(phone.min[0]>=PINK_PHONE.x-.2-1e-6&&phone.max[0]<=PINK_PHONE.x+.2+1e-6);
 assert.ok(phone.min[2]>=PINK_PHONE.z-.13-1e-6&&phone.max[2]<=PINK_PHONE.z+.13+1e-6);
 assert.ok(phone.max[1]<1.3,'Phone stays inside its camera collider');
 assert.ok(karaoke.min[0]>=KARAOKE.x-KARAOKE.w/2-1e-6&&karaoke.max[0]<=KARAOKE.x+KARAOKE.w/2+1e-6);
 assert.ok(karaoke.min[2]>KARAOKE.z-.28&&karaoke.max[2]<=KARAOKE.z+KARAOKE.d/2+1e-6);
 assert.ok(karaoke.max[1]<=1.1);
 assert.equal(group.children.length,4,'Small device geometry batches plus one shared legend atlas');
 for(const mesh of group.children){const a=mesh.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));}
});

test('appliance replacement preserves actions, aligns the screen and shows the kept bottle',()=>{
 installDOM();const room=new THREE.Group(),anchors=[],colliders=[];
 const interactive=buildIzakayaInteractive(room,{anchor:(p,label)=>anchors.push(label),action:()=>{},collider:(...c)=>colliders.push(c)});
 for(const label of ['Use the pink telephone','Read the bottle-keep tags','Sing at the karaoke'])assert.ok(anchors.includes(label));
 const screen=room.getObjectByName('Minato karaoke screen');assert.equal(screen.rotation.y,Math.PI);
 assert.equal(screen.position.z,KARAOKE.z-.208,'Screen clears the front bezel and faces the same way as the player controls');
 const bottle=room.getObjectByName('Your bottle on the keep shelf');assert.equal(bottle.visible,false);interactive.setPlayerBottle(true);assert.equal(bottle.visible,true);
 assert.ok(bottle.children.some(o=>o.material.map),'Kept bottle has a legible personalized product label');
 assert.ok(colliders.some(c=>c[0]===PINK_PHONE.x&&c[4]===1.3));
});
