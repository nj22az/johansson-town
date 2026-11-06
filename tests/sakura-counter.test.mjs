import {SAKURA_EQUIPMENT} from '../src/world/interiors/sakura-counter-detail.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {OFFICE_DOOR} from '../src/world/interiors/sakura-life.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';

function shop(){
 installDOM();
 const room=new THREE.Group(),display=buildSakuraInterior({room,reg(){},action(){},exit(){}});
 room.updateMatrixWorld(true);
 return {room,display};
}
const footprint=(room,pattern)=>{
 const box=new THREE.Box3();
 room.traverse(o=>{if(o.isMesh&&pattern.test(o.name))box.union(new THREE.Box3().setFromObject(o));});
 return box;
};
const overlapXZ=(a,b)=>a.min.x<b.max.x&&a.max.x>b.min.x&&a.min.z<b.max.z&&a.max.z>b.min.z;

test('the counter pieces stand apart: lucky cat, register, hot case, steamer, flyers, oden and charity box',()=>{
 const {room}=shop();
 const R=SAKURA_EQUIPMENT.register;
 const pieces={
  register:new THREE.Box3(new THREE.Vector3(R.minX,R.minY,R.minZ),new THREE.Vector3(R.maxX,R.maxY,R.maxZ)),
  'hot case':footprint(room,/^Sakura hot case/),
  steamer:footprint(room,/^Sakura bun steamer|^Sakura bun /),
  flyers:footprint(room,/shop flyer/),
  oden:footprint(room,/^Sakura oden (pot|broth|card)/),
  charity:footprint(room,/^Charity box/),
 };
 // The cat is a loaded model; its holder stands where it was placed, about 0.14 m across.
 const cat=room.getObjectByName('Maneki_neko_Colorful');assert.ok(cat,'The lucky cat is on the counter');
 const p=cat.getWorldPosition(new THREE.Vector3());
 pieces.cat=new THREE.Box3(new THREE.Vector3(p.x-.07,p.y,p.z-.07),new THREE.Vector3(p.x+.07,p.y+.23,p.z+.07));
 const names=Object.keys(pieces);
 for(const n of names)assert.ok(!pieces[n].isEmpty(),n+' was found');
 for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)
  assert.equal(overlapXZ(pieces[names[i]],pieces[names[j]]),false,`${names[i]} and ${names[j]} clip into each other`);
});

test('the office has a framed, panelled door that swings into the office for whoever comes near and closes after',()=>{
 const {room,display}=shop();
 const door=display.officeDoor;assert.ok(door,'The office door is built');
 assert.ok(room.getObjectByName('Sakura office door'));
 const handles=[];door.pivot.traverse(o=>{if(/handle/.test(o.name))handles.push(o);});assert.ok(handles.length>=2,'A handle on each side');
 assert.equal(door.angle,0,'Shut while nobody is near');
 const outside=[OFFICE_DOOR.hingeX+.55,OFFICE_DOOR.z+.9];
 for(let i=0;i<60;i++)door.update(1/30,[outside]);
 assert.ok(door.angle>1.3,'Open as someone walks up');
 // It swings into the office (towards -z), never out over the shop floor.
 door.pivot.updateMatrixWorld(true);
 const leaf=new THREE.Box3().setFromObject(room.getObjectByName('Sakura office door leaf'));
 assert.ok(leaf.max.z<=OFFICE_DOOR.z+.05,'The open leaf stays on the office side');
 assert.ok(leaf.min.x>4.66,'and clear of the office west wall');
 for(let i=0;i<120;i++)door.update(1/30,[[0,2]]);
 assert.equal(door.angle,0,'Shut again once they have gone');
});
// The wall band's own checks moved to sakura-wall-band.test.mjs (drawings SK-WB rev A).
