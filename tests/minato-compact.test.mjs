import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {MINATO_COMPACT as P} from '../src/world/interiors/minato-compact-plan.js';
import {MINATO,SATO_ANNEX} from '../src/world/minato-facade.js';
import {SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {standingHitsRect} from '../physics.js';
import {createIndoorCeilings} from '../src/render/indoor-camera.js';

const near=(actual,expected,message,tolerance=.003)=>assert.ok(Math.abs(actual-expected)<tolerance,`${message}: ${actual}, expected ${expected}`);
const layout={bounds:P.bounds,floorPolygon:P.floorPolygon};
const blocked=(x,z,r)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>standingHitsRect(x,z,r,0,c));
const named=(root,name)=>{let found;root.traverse(o=>{if(o.name===name||o.userData.name===name)found=o;});return found;};
let modelPromise;
function model(){
 return modelPromise??=(async()=>{
  const bytes=await readFile(new URL('../assets/models/izakaya/minato-interior-compact.glb',import.meta.url));
  const previous={self:globalThis.self,bitmap:globalThis.createImageBitmap};
  globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
  try{const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');scene.updateMatrixWorld(true);return scene;}
  finally{globalThis.self=previous.self;globalThis.createImageBitmap=previous.bitmap;}
 })();
}

test('Blender and runtime consume one plan with matching exterior widths and depths',async()=>{
 const source=JSON.parse(await readFile(new URL('../art/izakaya/compact/plan.json',import.meta.url),'utf8'));
 assert.deepEqual(P,source,'Regenerate the runtime plan after editing the Blender source plan');
 near(P.main.maxX-P.main.minX+2*P.wallThickness,MINATO.width,'Main exterior width');
 near(P.main.maxZ-P.main.minZ+2*P.wallThickness,MINATO.depth,'Main exterior depth');
 near(P.ramen.maxX-P.ramen.minX+2*P.wallThickness,SATO_ANNEX.x1-SATO_ANNEX.x0,'Annex exterior width');
 near(P.ramen.maxZ-P.ramen.minZ+2*P.wallThickness,SATO_ANNEX.depth,'Annex exterior depth');
 near(P.ramen.minX-P.main.maxX,P.connection.width,'Shared party-wall thickness');
 near(SATO_ANNEX.x0,MINATO.centreX+MINATO.width/2,'The annex actually meets the main building');
 assert.equal(P.entrance.position[0],0);assert.equal(P.ramenEntrance.position[0],SATO_ANNEX.door,'Existing street entrance stays aligned');
});

test('the compact export retains human-scale furniture instead of uniformly shrinking the room',async()=>{
 const root=await model(),cabinet=named(root,'Minato walnut back bar'),counter=named(root,'Minato walnut counter');
 assert.ok(cabinet&&counter,'Both logical pieces survive the Blender export');
 const cabinetSize=new THREE.Box3().setFromObject(cabinet).getSize(new THREE.Vector3());
 near(cabinetSize.x,3.39,'The retained cabinet has its original width',.012);
 near(cabinetSize.y,2.641,'The retained cabinet has its original height',.012);
 const counterBox=new THREE.Box3().setFromObject(counter);
 near(counterBox.max.x-counterBox.min.x,P.counter.width,'Re-authored counter length',.012);
 near(counterBox.max.y,P.counter.top,'Serving surface height');
 near(P.seatHeight,.46,'Full-size seats');
 near(P.counterSeatZ-(P.counter.position[2]+P.counter.depth/2),.42,'Comfortable seat centre to counter edge');
});

test('the actual exported model has floor and overhead enclosure along both businesses’ walkable routes',async()=>{
 const root=await model(),floorMeshes=[];
 root.traverse(o=>{if(o.isMesh&&/Cedar floor|Quarry tile|Dark grout/i.test(o.userData.name||o.name))floorMeshes.push(o);});
 assert.ok(floorMeshes.length>=2,'Authored floor materials survive batching');
 const ceilings=createIndoorCeilings(root),ray=new THREE.Raycaster();let samples=0;
 for(let x=P.bounds.minX+.35;x<P.bounds.maxX-.3;x+=.4)for(let z=P.bounds.minZ+.35;z<P.bounds.maxZ-.3;z+=.4){
  if(blocked(x,z,.3))continue;
  ray.set(new THREE.Vector3(x,.12,z),new THREE.Vector3(0,-1,0));ray.far=.2;
  const hit=ray.intersectObjects(floorMeshes,false)[0];
  assert.ok(hit&&hit.point.y>=.009&&hit.point.y<=P.floorY+.003,`Continuous floor beneath ${x.toFixed(2)},${z.toFixed(2)}, including board joints`);
  const height=ceilings.heightAt(x,z);
  assert.ok(Number.isFinite(height)&&height>=2.15&&height<=P.ceilingY+.003,`Physical camera enclosure at ${x.toFixed(2)},${z.toFixed(2)}: ${height}`);
  samples++;
 }
 assert.ok(samples>=60,'Check the complete shared room, not only its entrance');
});

test('recorded desktop and phone keyboard walks remain clear after the final collision corrections',async()=>{
 const report=JSON.parse(await readFile(new URL('../docs/qa/minato-compact/browser-results.json',import.meta.url),'utf8'));
 let segments=0,samples=0;
 assert.deepEqual(report.viewports.map(v=>v.viewport).sort(),['desktop','phone']);
 for(const viewport of report.viewports){
  assert.equal(viewport.passed,true,'The source trail is a completed browser walkthrough');
  for(const walk of viewport.walks)for(const step of walk.steps){
   segments++;const a=step.from,b=step.to,n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.05));
   for(let k=0;k<=n;k++){
    const x=a[0]+(b[0]-a[0])*k/n,z=a[2]+(b[2]-a[2])*k/n;samples++;
    assert.equal(blocked(x,z,.28),false,`${viewport.viewport}: ${walk.label} at ${x.toFixed(3)}, ${z.toFixed(3)}`);
   }
  }
 }
 assert.ok(segments>=20&&samples>=500,'Replay every recorded segment at 5 cm spacing with the game’s player radius');
});
