import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {
 buildStreetLamps,STREET_LAMP_PLACEMENTS,placementsClearOfInfrastructure,
 placementsClearOfShopDoors,DOOR_KEEP_CLEAR,
 LAMP_BASE_GLOW,LAMP_GLOW_SCALE,LAMP_EMISSIVE,POLE_HEIGHT,LAMP_POOL_RADIUS,
} from '../src/world/street-lamps.js';
import {lanternGlow} from '../src/render/dusk.js';
import {SHOP_CROSSING_Z} from '../src/world/main-road.js';
import {BOOKSHOP_WORKSHOP_PLOT} from '../src/world/bookshop-workshop-layout.js';

const at=(h,m=0)=>h*60+m;

test('two west-corner poles clear of Sakura south storefront',()=>{
 assert.equal(STREET_LAMP_PLACEMENTS.length,2);
 assert.ok(STREET_LAMP_PLACEMENTS.every(p=>p.side==='west'));
 assert.ok(placementsClearOfInfrastructure());
 assert.ok(placementsClearOfShopDoors());
 // Regression: never plant on quay-facing Sakura south opening / warehouse sign
 assert.ok(!STREET_LAMP_PLACEMENTS.some(p=>Math.abs(p.z+34)<2&&Math.abs(p.x+7.3)<0.5));
 // Sakura facade band ≈ [-33.93, -19.67] — no west lamp on the shop face
 assert.ok(!STREET_LAMP_PLACEMENTS.some(p=>p.side==='west'&&p.z>=-33.93&&p.z<=-19.67));
 assert.ok(!STREET_LAMP_PLACEMENTS.some(p=>Math.abs(p.z+35)<1.2&&Math.abs(p.x+7.3)<0.4));
 for(const p of STREET_LAMP_PLACEMENTS){
  assert.ok(Math.abs(p.z-SHOP_CROSSING_Z)>=1.2);
  // On the west footway, kerb side: clear of the facades (-7.8) and of their signs.
  assert.ok(p.x>-7.45);
  assert.ok(p.x<-5.3);
 }
 assert.deepEqual(
  STREET_LAMP_PLACEMENTS.map(p=>({x:p.x,z:p.z})),
  [{x:-5.6,z:-15.0},{x:-5.45,z:-3.05}]
 );
});

test('poles sit at corners, not in door leaves',()=>{
 assert.ok(DOOR_KEEP_CLEAR.some(z=>z.id==='frontrow'));
 assert.ok(DOOR_KEEP_CLEAR.some(z=>z.id==='market'&&z.x===-5.5&&z.z===-26.8));
 assert.ok(placementsClearOfShopDoors());
 assert.ok(!STREET_LAMP_PLACEMENTS.some(p=>Math.abs(p.z-BOOKSHOP_WORKSHOP_PLOT.z)<1.2));
 assert.ok(!STREET_LAMP_PLACEMENTS.some(p=>Math.abs(p.z+26.8)<1.2));
});

test('buildStreetLamps adds visible poles, colliders, and zero PointLights',()=>{
 const parent=new THREE.Group(),colliders=[];
 const lamps=buildStreetLamps({parent,colliders,shadows:true,mobile:false});
 assert.equal(lamps.count,2);
 assert.equal(lamps.heads.length,2);
 assert.equal(lamps.pointLights,0);
 assert.equal(colliders.length,2);
 let points=0;
 lamps.group.traverse(o=>{if(o.isPointLight)points++;});
 assert.equal(points,0);
 assert.equal(POLE_HEIGHT,4.2);
});

test('milk-glass heads track lanternGlow',()=>{
 const lamps=buildStreetLamps({parent:new THREE.Group()});
 for(const minutes of [at(12),at(20)]){
  const glow=lanternGlow(minutes);
  lamps.update(glow);
  const expected=LAMP_BASE_GLOW+glow*LAMP_GLOW_SCALE;
  for(const head of lamps.heads){
   assert.equal(head.material.emissive.getHex(),LAMP_EMISSIVE);
   assert.ok(Math.abs(head.material.emissiveIntensity-expected)<1e-9);
  }
 }
});

test('every street lamp throws a pool on the footway under its head and wears a halo, lit with the head',()=>{
 const lamps=buildStreetLamps({parent:new THREE.Group()});
 const pools=lamps.glow.pools.group.children,halos=lamps.glow.halos.group.children;
 assert.equal(pools.length,lamps.count);assert.equal(halos.length,lamps.count);
 lamps.group.updateMatrixWorld(true);
 for(const [i,head] of lamps.heads.entries()){
  const h=head.getWorldPosition(new THREE.Vector3()),pool=pools[i],halo=halos[i];
  assert.ok(pool.userData.lightPool&&Math.abs(pool.position.x-h.x)<.01&&Math.abs(pool.position.z-h.z)<.01,'the pool lies under the head, not at the foot of the pole');
  assert.ok(pool.position.y<.1&&pool.position.y>0,'a decal a few centimetres over the footway');
  assert.ok(pool.geometry.parameters.radius>=LAMP_POOL_RADIUS-1e-9,'about three metres across the footway');
  assert.ok(halo.isSprite&&halo.position.distanceTo(h)<.01,'the halo sits on the head');
  assert.equal(halo.material.blending,THREE.AdditiveBlending);assert.equal(pool.material.blending,THREE.AdditiveBlending);
 }
 let points=0;lamps.group.traverse(o=>{if(o.isPointLight)points++;});assert.equal(points,0,'no light of their own');
 lamps.update(0);assert.equal(lamps.glow.pools.group.visible,false);assert.equal(lamps.glow.halos.group.visible,false);
 lamps.update(1);assert.ok(lamps.glow.pools.group.visible&&lamps.glow.halos.group.visible);
 const full=lamps.glow.pools.material.opacity;assert.ok(full>0&&lamps.glow.halos.material.opacity>0);
 const half=lanternGlow(at(17,15));assert.ok(half>0&&half<1);
 lamps.update(half);assert.ok(lamps.glow.pools.material.opacity>0&&lamps.glow.pools.material.opacity<full,'fades in with the lanterns');
});

test('harbour wires street lamps without PointLights',async()=>{
 const src=await readFile(new URL('../src/world/harbour.js',import.meta.url),'utf8');
 assert.match(src,/buildStreetLamps/);
 const mod=await readFile(new URL('../src/world/street-lamps.js',import.meta.url),'utf8');
 assert.doesNotMatch(mod,/new THREE\.PointLight/);
});
