import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';

// The detail pass (October 2026) fills Sakura's shelves with flavours and its corners
// with fittings. It may only spend so much: before it began the shop built 783 draws
// and 255k triangles. Full shelves are instanced flavours, so they cost triangles,
// not draws; everything new is merged or instanced. The faithful source displays
// retain 124,972 painted triangles: reduced scan UVs visibly fractured both props.
// Fully loaded measurement is 435,172 triangles, leaving <15k headroom at450k.
// owned-display-lod.test exercises real async loaded geometry, not just this fixture.
const MOST_DRAWS=783+30,MOST_TRIANGLES=450000;

test('the shop interior keeps within its draw and triangle budget',async()=>{
 installDOM();
 const room=new THREE.Group(),display=buildSakuraInterior({room,reg(){},action(){},exit(){}});
 await display.ready?.();
 let draws=0,triangles=0;
 room.traverse(o=>{
  if(!o.isMesh||!o.visible)return;
  draws+=Array.isArray(o.material)?o.material.length:1;
  const g=o.geometry,t=(g.index?g.index.count:g.attributes.position.count)/3;
  triangles+=t*(o.isInstancedMesh?o.count:1);
 });
 assert.ok(draws<=MOST_DRAWS,`${draws} draws, budget ${MOST_DRAWS}`);
 assert.ok(triangles<=MOST_TRIANGLES,`${Math.round(triangles)} triangles, budget ${MOST_TRIANGLES}`);
});

test('every board shows its line in more than one flavour, and the extra facings are never stock',async()=>{
 installDOM();
 const room=new THREE.Group(),display=buildSakuraInterior({room,reg(){},action(){},exit(){}});
 const chips=room.getObjectByName('Sakura chips packaging');
 const shifts=new Set();for(let i=0;i<chips.count;i++)shifts.add(chips.geometry.attributes.atlasShift.getX(i).toFixed(4));
 assert.ok(shifts.size>=3,'Crisps stand in several flavours');
 // Selling out a line empties only its stock slots; the display facings stay.
 const stock=Object.fromEntries([...room.children].filter(o=>o.isInstancedMesh&&/ goods$/.test(o.name)).map(o=>[o.name.replace(/^Sakura | goods$/g,''),{shelf:0}]));
 display.updateStock(stock);
 const goods=room.getObjectByName('Sakura chips goods'),m=new THREE.Matrix4(),p=new THREE.Vector3();
 let shown=0;for(let i=0;i<goods.count;i++){goods.getMatrixAt(i,m);p.setFromMatrixScale(m);if(p.x>0)shown++;}
 assert.ok(shown>0&&shown===goods.count-24,'Only the 24 stocked crisps go when they sell out');
});
