import {CAVE_ACTIVE} from '../src/world/coyote-tunnel.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildCoyoteTunnel,TUNNEL,CAVE_MOUTH,hillHeight} from '../src/world/coyote-tunnel.js';
import {circleHitsRect} from '../physics.js';

test('the tunnel is gone: a low sea cave in a smaller wooded headland',{skip:!CAVE_ACTIVE&&'the cave is paused (CAVE_ACTIVE)'},()=>{
 installDOM();
 const parent=new THREE.Group(),colliders=[],anchors=[];
 const cave=buildCoyoteTunnel({parent,colliders,register:(o,label,fn)=>anchors.push({o,label,fn}),onAction:(...a)=>anchors.called=a});
 parent.updateMatrixWorld(true);
 // Less dramatic: a hill about nine metres high rather than eighteen, and a mouth a
 // person walks into rather than a two-lane road tunnel.
 const top=Math.max(...[0,6,12,18,24].map(dz=>hillHeight(TUNNEL.x,TUNNEL.z+dz)));
 assert.ok(top>6&&top<11,'The headland is not a modest hill: '+top.toFixed(1));
 assert.ok(TUNNEL.bore.half*2<3.2&&TUNNEL.bore.spring+TUNNEL.bore.half<3,'The cave mouth is still a road tunnel');
 assert.ok(hillHeight(TUNNEL.x,TUNNEL.z+70)<0,'The hill ends in mid-air rather than running into the sea');
 // Nothing of the old tunnel is left: no portal, no bore, no sodium lamps, no sign.
 let names=[];parent.traverse(o=>names.push(o.name));
 assert.ok(!names.some(n=>/Minato Tunnel|No pedestrians|bore|sodium/i.test(n)),'Tunnel pieces remain: '+names.filter(n=>/Tunnel|pedestrian/i.test(n)));
 assert.ok(names.includes('Shimenawa')&&names.includes('Sea cave sign')&&names.includes('Stone lantern'));
 // You can walk into the mouth, a couple of metres, and no further.
 const blocked=(x,z)=>colliders.some(c=>circleHitsRect(x,z,.32,c));
 for(const z of [CAVE_MOUTH.z-2,CAVE_MOUTH.z,TUNNEL.z,CAVE_MOUTH.inside])assert.equal(blocked(TUNNEL.x,z),false,'You cannot walk into the cave at z='+z);
 assert.ok(blocked(TUNNEL.x,CAVE_MOUTH.inside+1.2),'The cave has no end');
 for(const dx of [-2.6,2.6])assert.ok(blocked(TUNNEL.x+dx,TUNNEL.z),'You can walk through the rock beside the mouth');
 // Going in is the dungeon.
 const enter=anchors.find(a=>/sea cave/i.test(a.label)&&!/sign/i.test(a.label));
 assert.ok(enter,'Nothing offers to take you into the cave');enter.fn();assert.deepEqual(anchors.called,['dungeon']);
 // And the lantern lights at dusk.
 cave.update(.1);assert.ok(cave.mouth.glow.emissiveIntensity>0);cave.update(1);assert.equal(cave.mouth.glow.emissiveIntensity,0);
});

test('the mouth knows when it has been walked into',{skip:!CAVE_ACTIVE&&'the cave is paused (CAVE_ACTIVE)'},()=>{
 installDOM();
 const {splat}=buildCoyoteTunnel({parent:new THREE.Group(),colliders:[]});
 assert.equal(splat(TUNNEL.x,CAVE_MOUTH.z),true,'Walking into the mouth is not reaching it');
 assert.equal(splat(TUNNEL.x,TUNNEL.z-4),false,'The path in front of it counts as the mouth');
 assert.equal(splat(TUNNEL.x-TUNNEL.width,TUNNEL.z+TUNNEL.depth/2),false,'Open ground beside the hill counts as the mouth');
});

test('the path up to the cave is walkable gravel, into the mouth',{skip:!CAVE_ACTIVE&&'the cave is paused (CAVE_ACTIVE)'},async()=>{
 
 try{
  const {routeAt,groundHeight}=await import('../src/world/layout.js');
  for(const z of [30,34,38,CAVE_MOUTH.inside])assert.equal(routeAt(TUNNEL.x,z,.3)?.id,'cave-path','No path at z='+z);
  assert.equal(groundHeight(TUNNEL.x,CAVE_MOUTH.inside),0,'The cave floor is not at the path');
 }finally{}
});
