import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {GULLS,buildGulls} from '../src/world/gulls.js';
import {TAMA_SPRITE} from '../src/world/tama.js';

// The harbour's gulls (the owner, 27 November 2026: "Then make the seagull"): umineko over the east quay, each drawn on a
// layer of its own, flying, flapping and gliding with nothing jumping a frame, and the wingtip a beat behind the arm.
test('each gull has its own picture layer, none shared with another or with Tama',()=>{
 const layers=[...GULLS.layers,TAMA_SPRITE.layer];assert.equal(new Set(layers).size,layers.length);
 assert.ok(layers.every(l=>l>0&&l<31),'not the town\'s layer 0 nor the static props\' 31');
 const g=buildGulls({group:new THREE.Group()});assert.equal(g.birds.length,GULLS.count);
 g.birds.forEach((b,i)=>b.root.traverse(o=>{if(o.isMesh)assert.equal(o.layers.mask,1<<GULLS.layers[i],o.name);}));
 assert.ok(GULLS.why.length>30);
});

test('they fly over the harbour, flap in bursts and glide, the tip following the arm, nothing jumping a frame',()=>{
 const g=buildGulls({group:new THREE.Group()}),b=g.birds[0];let prev=null,flapping=0,gliding=0,lagSum=0;
 for(let f=0;f<60*30;f++){const t=f/60;g.update(t);
  const now={p:b.root.position.clone(),yaw:b.root.rotation.y,inner:b.wings[1].inner.rotation.z,outer:b.wings[1].outer.rotation.z};
  assert.ok(now.p.y>GULLS.height-GULLS.rise-.01,'above the roofs');
  if(prev){assert.ok(now.p.distanceTo(prev.p)<.12,`frame ${f}: moved ${now.p.distanceTo(prev.p)}`);
   assert.ok(Math.abs(now.inner-prev.inner)<.15,`frame ${f}: inner wing ${now.inner-prev.inner}`);
   assert.ok(Math.abs(now.outer-prev.outer)<.15,`frame ${f}: outer wing ${now.outer-prev.outer}`);
   if(Math.abs(now.inner-prev.inner)>.01)flapping++;else gliding++;
   lagSum+=Math.sign(now.inner-prev.inner)*(now.outer-prev.outer)<0?1:0;}
  prev=now;}
 assert.ok(flapping>60&&gliding>60,`flaps (${flapping}) and glides (${gliding})`);
 assert.ok(lagSum>20,'the outer wing turns back while the inner still goes: its beat comes later');
});
