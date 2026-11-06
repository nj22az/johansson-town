import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {OPENINGS} from '../src/world/openings.js';
import {createSpawnScene} from '../src/render/spawn-scene.js';
import {circleHitsRect} from '../physics.js';

/**
 * Every opening with a stand mark (world/openings.js) stands him clear of everything solid, and its arrival shot
 * (render/spawn-scene.js) never puts the lens inside anything: the fish-auction opening's lens began 9 m up over the
 * auction shed and came down through its roof, between two purlins (the creator, 2026-10-19, on his phone: "I spawned
 * in a beam"). The town is built as the game builds it; the lens is tested against the world's colliders, as the game
 * tests it, and against the meshes themselves, so a roof or a beam nobody made solid is still caught.
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
const {routeAt,groundHeight}=await import('../src/world/layout.js');
const scene=new THREE.Scene();
const world=createTown({scene,sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
scene.updateMatrixWorld(true);
const EYE=1.7,HEAD=1.41,BODY={radius:.3,from:.1,to:1.8},LENS_RADIUS=.18;
const span=c=>{const bottom=c.minY||0;return [bottom,Number.isFinite(c.height)?bottom+c.height:Infinity];};
const fixed=()=>world.colliders.filter(c=>!c.moving&&!c.only&&Math.abs(c.x)<1e5);
/** The colliders a point (with a radius) is inside: the vertical span contains it and the footprint does. */
const containing=(p,r=0)=>fixed().filter(c=>{const [bottom,top]=span(c);return bottom<=p.y&&top>=p.y&&circleHitsRect(p.x,p.z,r,c);});
/** The lens's own test (game.js cameraBlocked): off the walkable ground (over the water, over a building), or in a collider. */
const lensBlocked=(x,z,y,r)=>!routeAt(x,z,r)||fixed().some(c=>{const [bottom,top]=span(c);return bottom<y+.12&&top>y-.12&&circleHitsRect(x,z,r,c);});
const describe=c=>`${c.id||'collider'} at ${c.x.toFixed(1)},${c.z.toFixed(1)} (${c.w}×${c.d}, y ${span(c).map(v=>Number.isFinite(v)?v.toFixed(2):'∞').join('–')})`;

// The meshes, with their world boxes, for the raycasts; a lens is tested only against those near it.
const meshes=[];scene.traverse(o=>{if(!o.isMesh||o.name==='Arrival gull')return;for(let p=o;p;p=p.parent)if(!p.visible)return;const box=new THREE.Box3().setFromObject(o);if(Number.isFinite(box.min.x))meshes.push({mesh:o,box});});
const ray=new THREE.Raycaster();
const DIRS={'+x':[1,0,0],'-x':[-1,0,0],'+y':[0,1,0],'-y':[0,-1,0],'+z':[0,0,1],'-z':[0,0,-1]};
/** The nearest mesh along a direction from a point, within `far`. */
function nearest(from,dir,far){
 ray.set(from,dir);ray.far=far;const reach=new THREE.Box3(from.clone().addScalar(-far),from.clone().addScalar(far));
 let best=null;
 for(const {mesh,box} of meshes){
  if(!box.intersectsBox(reach))continue;
  for(const h of ray.intersectObject(mesh,false))if(h.distance>1e-4&&(!best||h.distance<best.distance))best={distance:h.distance,name:mesh.name||mesh.type};
 }
 return best;
}
/** What is within `near` of a point in the six directions (and `facing`), or nothing. */
function crowding(p,near,facing){
 const out=[];
 for(const [k,d] of Object.entries(DIRS)){const h=nearest(p,new THREE.Vector3(...d),k==='-y'?near*.6:near);if(h)out.push(`${k} ${h.name} ${h.distance.toFixed(2)} m`);}
 if(Number.isFinite(facing)){const h=nearest(p,new THREE.Vector3(-Math.sin(facing),0,-Math.cos(facing)),near);if(h)out.push(`ahead ${h.name} ${h.distance.toFixed(2)} m`);}
 return out;
}

const standing=OPENINGS.filter(o=>Array.isArray(o.stand));
test('every stand mark is on the docks with the eye and the body clear of every solid',()=>{
 assert.ok(standing.length>=8);
 for(const o of standing){
  const [x,z]=o.stand,y=groundHeight(x,z),eye=new THREE.Vector3(x,y+EYE,z);
  assert.ok(routeAt(x,z,BODY.radius),`${o.id}: not on walkable ground`);
  const inEye=containing(eye);assert.deepEqual(inEye.map(describe),[],`${o.id}: the eye at ${eye.y.toFixed(2)} m is inside ${inEye.map(describe)}`);
  const onBody=fixed().filter(c=>{const [bottom,top]=span(c);return bottom<y+BODY.to&&top>y+BODY.from&&circleHitsRect(x,z,BODY.radius,c);});
  assert.deepEqual(onBody.map(describe),[],`${o.id}: the body is in ${onBody.map(describe)}`);
  const close=crowding(eye,.35,o.facing);assert.deepEqual(close,[],`${o.id}: ${close.join('; ')} at the eye`);
 }
});

test('every arrival shot keeps the lens out of every solid, from its first frame to the handover',()=>{
 const camera=new THREE.PerspectiveCamera(65,390/844,.15,480);
 for(const o of standing){
  const [x,z]=o.stand,y=groundHeight(x,z);
  const actor={root:new THREE.Group(),lens:{head:HEAD},play(){},stop(){},lookAt(){},express(){}};actor.root.position.set(x,y,z);
  camera.position.set(x,y+EYE,z);camera.fov=65;
  const arrival=createSpawnScene({scene,camera,getActor:()=>actor,blocked:lensBlocked,ground:groundHeight});
  arrival.start({id:o.id,yaw:o.facing,establish:!!o.docks,hold:()=>false});
  const faults=[];let t=0,last=null;
  for(;arrival.active&&t<20;t+=.05){
   arrival.update(.05);if(!arrival.active)break;
   const p=camera.position.clone(),at=`${o.id} at ${t.toFixed(2)} s (${p.toArray().map(v=>v.toFixed(2))})`;
   const inside=containing(p,LENS_RADIUS);if(inside.length)faults.push(`${at}: inside ${inside.map(describe).join(', ')}`);
   const close=crowding(p,.3);if(close.length)faults.push(`${at}: ${close.join('; ')}`);
   if(last){const step=p.clone().sub(last),length=step.length();if(length>1e-3){const h=nearest(last,step.normalize(),length);if(h)faults.push(`${at}: moved through ${h.name}`);}}
   last=p;
  }
  const {reason}=arrival.snapshot();arrival.cancel('placement');
  assert.equal(reason,'complete',`${o.id}: the shot ended early (${reason})`);
  assert.deepEqual(faults.slice(0,4),[],faults.join('\n'));
 }
});
