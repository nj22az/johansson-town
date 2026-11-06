import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_SEATS} from '../src/world/interiors/onsen.js';
import {circleHitsRect} from '../physics.js';

const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});return {room,hits,actions,layout};};
// Who walks: everyone, the player too, through either side (the creator, 2026-10-11: Johansson goes anywhere).
const blocked=(layout,x,z,r=.3,who='player')=>layout.colliders.some(c=>(!c.only||c.only===who)&&circleHitsRect(x,z,r,c));

test('Umi-no-yu is a room you walk through: bandai, lockers, washing places, two baths, the door',()=>{
 const {hits,layout}=build();
 const labels=hits.map(h=>h.label);
 for(const label of ['Pay at the bandai · ¥300','Change at the baskets','Women’s side','Wash at the tap','Get into the indoor bath','Get into the rock bath','Buy coffee milk · ¥100','Step outside'])assert.ok(labels.includes(label),label);
 assert.ok(!blocked(layout,...[ONSEN_ROOM.spawn[0],ONSEN_ROOM.spawn[2]]),'you arrive in the clear');
 // A walk from the door to the rock bath through the men's side (the player's), and through the women's (a resident's).
 assert.ok(!blocked(layout,0,4.2,.25),'in through the middle metre of the genkan step');
 for(const z of [3,1.6,0,-1.2,-2.5,-4.4,-4.75])assert.ok(!blocked(layout,.45,z,.25),'the men\'s way through is open at z='+z);
 for(const z of [3,1.6,0,-1.2,-2.5,-4.4,-4.75])assert.ok(!blocked(layout,-.45,z,.25,'resident'),'the women\'s way through is open at z='+z);
 for(const z of [3,1.6,0,-1.2,-2.5,-4.4,-4.75])assert.ok(!blocked(layout,-.45,z,.25),'the player may walk the women\'s side too at z='+z);
});

test('every seat can be reached, and the baths put you in the water up to the chest',()=>{
 const {hits,layout}=build();
 for(const spec of Object.values(ONSEN_SEATS)){
  assert.ok(!blocked(layout,spec.stand[0],spec.stand[2],.25),spec.id+' stand point is clear');
  assert.ok(hits.some(h=>h.o.userData.seat?.id===spec.id),spec.id+' has a prompt');
 }
 for(const id of ['indoor','rock']){
  const s=ONSEN_SEATS[id],water=id==='indoor'?ONSEN_ROOM.tub.water:ONSEN_ROOM.pool.water;
  assert.ok(s.soak&&s.surfaceY<0,'sits below the floor, in the pool');
  assert.ok(s.eyeY>water&&s.eyeY-water<.45,id+': eyes just above the water');
 }
});

test('the rock bath lights its lantern and steams more after dark',()=>{
 const {room,layout}=build();
 layout.tick(.1,12*60);let lantern=null;room.traverse(o=>{if(o.name==='Lantern light')lantern=o;});
 const day=lantern.material.emissiveIntensity;layout.tick(.1,21*60+30);
 assert.ok(lantern.material.emissiveIntensity>day+.5);
});

test('Higa-san at the bandai is a Shimanchu like everyone else, up where she can see over the counter',async()=>{
 const {installDOM}=await import('./fixtures.mjs');installDOM();
 const {room,layout}=build();layout.tick(1/30,720);
 const attendant=room.getObjectByName('Umi-no-yu attendant');
 assert.ok(attendant.getObjectByName('Shimanchu body'),'built from her recipe, not a placeholder figure');
 const head=new THREE.Vector3();attendant.getObjectByName('head')?.getWorldPosition(head);
 assert.ok(head.y>1.1,'her head is above the bandai top at '+head.y.toFixed(2));
 // The price board is on the counter's front, under the top, so it never hides her face from the genkan or the lobby.
 room.updateMatrixWorld(true);
 const fee=room.getObjectByName('Fee sign');assert.ok(fee,'the price board is named, for the film');
 const sign=new THREE.Box3().setFromObject(fee),top=new THREE.Box3().setFromObject(room.getObjectByName('Bandai top')),base=new THREE.Box3().setFromObject(room.getObjectByName('Bandai counter'));
 assert.ok(sign.max.y<top.min.y,'under the counter top: '+sign.max.y.toFixed(3));
 assert.ok(sign.min.x>=base.max.x&&sign.min.x-base.max.x<.02,'on the counter’s front face');
 assert.ok(new THREE.Vector3(0,0,-1).applyQuaternion(fee.getWorldQuaternion(new THREE.Quaternion())).x<-.99||new THREE.Vector3(0,0,1).applyQuaternion(fee.getWorldQuaternion(new THREE.Quaternion())).x>.99,'facing the lobby (+x)');
 const ray=new THREE.Raycaster();
 for(const eye of [[-1.4,1.5,4.3],[0,1.5,4.2],[.6,1.25,2.7],[-2.55,1.35,3.85]]){const from=new THREE.Vector3(...eye),to=head.clone().sub(from);
  ray.set(from,to.clone().normalize());ray.far=to.length();assert.ok(!ray.intersectObject(fee,false).length,'the price board is not between '+eye+' and her face');}
 // The phone's handset is a part of its own, so a film can take it off the hook (hide it while she holds hers).
 const phone=room.getObjectByName('Push-button phone'),handset=room.getObjectByName('Push-button phone handset');
 assert.ok(handset&&handset.parent===phone,'the handset sits on the phone');
 layout.dispose?.();
});
