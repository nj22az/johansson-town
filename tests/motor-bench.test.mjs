import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {installDOM} from './fixtures.mjs';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {createBusinesses} from '../src/world/businesses.js';
import {DOCK_WORKSHOP,DOCK_WORKSHOP_ROOM} from '../src/world/dock-workshop-layout.js';
import {MOTOR_BENCH,MOTOR_LINKS,MOTOR_NOTE} from '../src/workshop/motor-bench.js';
import {createActivities} from '../activities.js';

const props=new URL('../assets/models/props/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');

test('the pump motor display is the packed site model: true size, one quantised mesh, within budget',async()=>{
 installDOM();
 const bytes=await readFile(new URL('motor-90l-display.glb',props)),report=JSON.parse(await readFile(new URL('motor-90l-display-provenance.json',props),'utf8'));
 assert.equal(sha(bytes),report.sha256);assert.equal(bytes.length,report.bytes);assert.ok(bytes.length<600_000,'Smaller than half a megabyte or so');
 for(const [file,hash] of Object.entries(report.sourceSha256))assert.equal(sha(await readFile(new URL('../../'+file,import.meta.url))),hash,file+' changed: rerun tools/pack-motor-90l.mjs');
 const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');g.scene.updateMatrixWorld(true);
 const meshes=[];g.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
 assert.equal(meshes.length,1,'One draw call');assert.ok(meshes[0].geometry.attributes.color);
 assert.equal(meshes[0].geometry.index.count/3,report.triangles);assert.ok(report.triangles<16000);
 const size=new THREE.Box3().setFromObject(g.scene).getSize(new THREE.Vector3()),box=new THREE.Box3().setFromObject(g.scene);
 // IEC 90L: shaft tip to cowl 343 mm, feet 90 mm below the axis, terminal box on top.
 assert.ok(Math.abs(size.x-.3425)<.002&&size.y>.23&&size.y<.26&&size.z>.18&&size.z<.21,size.toArray().join());
 assert.ok(Math.abs(box.min.y)<.001,'Feet stand on y = 0');
 for(const hidden of ['core','winding','rotor','bearingDE','tboard'])assert.ok(report.omitted.includes(hidden),hidden+' is inside the closed motor');
});

test('the Dock Electrical Workshop has the motor on a steel test bench, clear of the walking route',()=>{
 installDOM();
 const site={...createBusinesses().find(s=>s.id==='form3d'),...DOCK_WORKSHOP},room=new THREE.Group(),blocks=[],anchors=[],actions=[];
 const layout=buildCompactShop({site,room,reg:(o,label,fn)=>anchors.push({o,label,fn}),collider:(x,z,w,d,h)=>blocks.push({x,z,w,d,h}),action:(...a)=>actions.push(a),exit(){}});
 try{
  const bench=room.getObjectByName('Steel motor test bench'),motor=room.getObjectByName('IEC 90L pump motor');
  assert.ok(bench&&motor);assert.equal(motor.scale.x,MOTOR_BENCH.scale);assert.ok(Math.abs(motor.position.y-MOTOR_BENCH.top)<.02);
  const block=blocks.find(b=>b.x===MOTOR_BENCH.x&&b.z===MOTOR_BENCH.z);assert.ok(block,'The bench is solid');
  const {minX,maxX,minZ,maxZ}=DOCK_WORKSHOP_ROOM.bounds,half=MOTOR_BENCH.width/2;
  assert.ok(MOTOR_BENCH.x+half<maxX&&MOTOR_BENCH.x-half>minX&&MOTOR_BENCH.z+MOTOR_BENCH.depth/2<maxZ&&MOTOR_BENCH.z-MOTOR_BENCH.depth/2>minZ);
  // The bench keeps the door-to-back-bench aisle open (the door is at x = 0).
  assert.ok(MOTOR_BENCH.x-MOTOR_BENCH.width/2>DOCK_WORKSHOP_ROOM.doorX+.9);
  const look=anchors.find(a=>a.label==='Look at the pump motor');assert.ok(look);assert.deepEqual(look.o.userData.workers,['Tetsuo']);
  look.fn();const [kind,title,text]=actions.at(-1);assert.equal(kind,'motor-bench');assert.match(title,/motor/i);
  for(const fact of ['1.5 kW','four poles','230 V delta','400 V star','bilge pump'])assert.ok(text.includes(fact),fact);
  assert.deepEqual(MOTOR_LINKS,{stripDown:'/motor-90l/',routine:'/motor-90l/workshop/'});
 }finally{layout.workshop?.dispose?.();layout.dispose?.();}
});

test('looking at the motor offers the full strip-down and Erik’s routine in a new tab',()=>{
 const dom=installDOM(),opened=[];globalThis.window.open=(...args)=>opened.push(args);
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1030,getSocialContext:()=>({inside:'form3d'})});
 acts.action('motor-bench','Pump motor on the test bench',MOTOR_NOTE);
 assert.deepEqual(dom.labels(),['See the full strip-down','Watch Erik’s routine','Close']);
 dom.button('See the full strip-down');dom.button('Watch Erik’s routine');
 assert.deepEqual(opened.map(a=>a[0]),[MOTOR_LINKS.stripDown,MOTOR_LINKS.routine]);assert.ok(opened.every(a=>a[1]==='_blank'));
 dom.button('Close');
});
