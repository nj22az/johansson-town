import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {DRINK_PROFILES,innerRadiusAtY} from '../src/drinking/profiles.js';
import {solveFill,volumeAtPlane,requiredTilt,liquidReachesRim,clippedBandGeometry} from '../src/drinking/liquid.js';
import {createVessel} from '../src/drinking/vessel.js';

const close=(a,b,tolerance,label)=>assert.ok(Math.abs(a-b)<=tolerance,`${label}: ${a} vs ${b}`);
function meshVolume(positions){
 let v=0;
 for(let i=0;i<positions.length;i+=9){
  const ax=positions[i],ay=positions[i+1],az=positions[i+2],bx=positions[i+3],by=positions[i+4],bz=positions[i+5],cx=positions[i+6],cy=positions[i+7],cz=positions[i+8];
  v+=ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx);
 }
 return v/6*1e6;
}
function bounded(profile,p){
 assert.ok(p.y>=profile.interiorBottom-1e-8&&p.y<=profile.interiorTop+1e-8,'liquid stays between interior base and opening');
 assert.ok(Math.hypot(p.x,p.z)<=innerRadiusAtY(profile,p.y)+1e-8,'liquid stays inside the tapered wall');
}

test('full, half and nearly empty liquid volumes remain closed and conserved at every drinking tilt',()=>{
 for(const profile of Object.values(DRINK_PROFILES)){
  assert.ok(profile.startingVolumeMl<profile.capacityMl,'the starting pour fits the actual vessel');
  for(const fraction of [1,.5,.025]){
   const volume=profile.startingVolumeMl*fraction,required=requiredTilt(profile,volume);
   for(const tilt of [0,required*.5,required]){
    const normal=new THREE.Vector3(Math.sin(tilt),Math.cos(tilt),0),s=solveFill(profile,volume,normal);
    close(s.enclosedVolumeMl,volume,.0002,'solver volume');
    close(meshVolume([...s.sidePositions,...s.capPositions]),volume,.0002,'rendered enclosed volume');
    for(const point of s.vertices)bounded(profile,point);
    for(const point of s.cap){bounded(profile,point);close(normal.dot(point),s.offset,1e-8,'free-surface plane');}
   }
  }
 }
});

test('flow requires the calculated fill-dependent tilt and reaches the actual inner edge',()=>{
 for(const profile of Object.values(DRINK_PROFILES)){
  const volumes=[profile.startingVolumeMl,profile.startingVolumeMl*.5,profile.startingVolumeMl*.025,1];let previous=0;
  for(const volume of volumes){
   const tilt=requiredTilt(profile,volume);assert.ok(tilt>previous,'lower fill requires more tilt');previous=tilt;
   const normal=new THREE.Vector3(Math.sin(tilt),Math.cos(tilt),0),edge=new THREE.Vector3(...profile.liquidRimContact);
   close(volumeAtPlane(profile,normal,normal.dot(edge)),volume,.025,'edge capacity');
   assert.ok(liquidReachesRim(profile,solveFill(profile,volume,normal)),'liquid reaches the drinking edge');
   const under=new THREE.Vector3(Math.sin(tilt-.04),Math.cos(tilt-.04),0);
   assert.equal(liquidReachesRim(profile,solveFill(profile,volume,under)),false,'insufficient tilt cannot consume');
  }
  close(requiredTilt(profile,0),Math.PI/2,1e-12,'empty limit');
 }
});

test('arbitrary world orientation gives a horizontal cap, repeatable seeks and bounded foam',()=>{
 for(const profile of Object.values(DRINK_PROFILES)){
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.13,.17,.71)),normal=new THREE.Vector3(0,1,0).applyQuaternion(q.clone().invert());
  const s=solveFill(profile,profile.startingVolumeMl*.5,normal),again=solveFill(profile,profile.startingVolumeMl*.5,normal);
  assert.deepEqual(s.sidePositions,again.sidePositions,'no mutation accumulates in rest vertices');
  for(const p of s.cap)close(p.clone().applyQuaternion(q).y,s.offset,1e-8,'world horizontal');
  if(profile.hasFoam){
   const foam=clippedBandGeometry(profile,normal,s.offset+.00005,s.offset+.006);
   assert.ok(meshVolume(foam)>0,'foam is a real closed band');
   close(meshVolume(foam),volumeAtPlane(profile,normal,s.offset+.006)-volumeAtPlane(profile,normal,s.offset+.00005),.0002,'closed foam band volume');
   for(let i=0;i<foam.length;i+=3)bounded(profile,new THREE.Vector3(...foam.slice(i,i+3)));
  }
 }
});

test('liquid clamps, glass markers preserve metre scale, and ice remains enclosed after emptying',()=>{
 for(const profile of Object.values(DRINK_PROFILES)){
  const vessel=createVessel(profile),q=new THREE.Quaternion();
  assert.equal(vessel.markers.base.position.length(),0);
  assert.deepEqual(vessel.markers.rim.position.toArray(),profile.rimContact);
  assert.deepEqual(vessel.markers.grip.position.toArray(),profile.grip.position);
  close(vessel.update(-10).volumeMl,0,0,'empty clamp');
  close(vessel.update(profile.capacityMl+10).volumeMl,profile.capacityMl,0,'capacity clamp');
  for(const tilt of [0,.8,1.55]){
   vessel.root.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),tilt);
   const s=vessel.update(0,0);assert.equal(vessel.liquid.body.visible,false);assert.equal(s.volumeMl,0);
   if(vessel.liquid.ice){
    assert.equal(vessel.liquid.ice.children.length,3);
    for(const cube of vessel.liquid.ice.children){
     assert.ok(cube.visible,'ice persists in the empty glass');
     cube.getWorldQuaternion(q);
     for(const x of [-.007,.007])for(const y of [-.007,.007])for(const z of [-.007,.007]){
      const point=new THREE.Vector3(x,y,z).applyQuaternion(cube.quaternion).add(cube.position);bounded(profile,point);
     }
    }
   }
  }
  vessel.dispose();
 }
});
