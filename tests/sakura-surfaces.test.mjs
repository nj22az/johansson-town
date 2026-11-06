import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {auditSakuraSurfaces,SURFACE_RULES} from '../tools/sakura-surface-audit.mjs';
import {SAKURA_FLOOR_INSETS,TUBE_RUNS} from '../src/world/interiors/sakura-shell.js';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {sakuraProductTemplate} from '../src/world/interiors/sakura-food-products.js';
import {shopProductMaterials} from '../src/commerce/shop-product.js';
import {SHOP_STOCK} from '../src/commerce/shop-stock.js';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';

/**
 * Sakura without a face fighting another (the owner, 26 October 2026: "there is much Z fighting on the floor and every
 * where now, I want it to be impeccable"). Drawings SK-ZF rev A (docs/qa/sakura-surfaces/): on main there were 239 pairs
 * of faces in one plane over 33 m² on the shop floor (the till's tiles laid 6 mm over the terrazzo over 11 m², product
 * prints 1 mm off their packs, rails flush with boards), and decals in one plane with each other (the office rug in the
 * floor's sheen). The rule: every course starts where the last ends; a print is a decal (polygon offset) on what it is
 * printed on; a floor laid into another is cut into it, not laid over it.
 */
const where=f=>`${f.a} | ${f.b}: ${f.area} m² ${f.gapMm} mm apart at ${f.at.join(', ')} facing ${f.normal.join(', ')}`;
const report=await auditSakuraSurfaces();

for(const [name,room] of [['the shop, its back rooms and the small office',report.shop],['the upstairs office, kitchenette and rest room',report.office]]){
 test(`${name}: no two faces within ${SURFACE_RULES.tolerance*1000} mm of one plane, decals included`,()=>{
  assert.deepEqual(room.surfaces.map(where),[]);
 });
 test(`${name}: no floor layer within ${SURFACE_RULES.floorTolerance*1000} mm of another`,()=>{
  assert.deepEqual(room.floors.map(where),[]);
 });
}

test('the till tiles and the restroom mosaic are laid flush in the terrazzo, which is cut round them',async()=>{
 const level=name=>report.shop.finishes.filter(f=>f.name===name).map(f=>f.level);
 for(const name of ['sakura-floor','Sakura till floor','Restroom mosaic floor'])assert.deepEqual([...new Set(level(name))],[0],name+' is at floor level');
 const room=new THREE.Group();await buildSakuraInterior({room,reg(){},action(){},exit(){}}).ready?.();
 const floor=room.getObjectByName('sakura-floor').geometry.attributes.position;
 for(let i=0;i<floor.count;i+=3){
  const x=(floor.getX(i)+floor.getX(i+1)+floor.getX(i+2))/3,z=(floor.getZ(i)+floor.getZ(i+1)+floor.getZ(i+2))/3;
  assert.ok(!SAKURA_FLOOR_INSETS.some(h=>x>h.x0&&x<h.x1&&z>h.z0&&z<h.z1),`terrazzo under an inset at ${x.toFixed(2)}, ${z.toFixed(2)}`);
 }
});

test('every pack on the shelves is built without two of its own faces in one plane',()=>{
 const [body,label]=shopProductMaterials(),glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.3});
 const found=[];
 for(const {id} of SHOP_STOCK){
  const t=sakuraProductTemplate(id),g=new THREE.Group();
  g.add(new THREE.Mesh(t.body,body),new THREE.Mesh(t.art,label));if(t.glass)g.add(new THREE.Mesh(t.glass,glass));
  // A pack is seen by the hundred, so even a fingertip's worth (1 cm²) counts.
  for(const f of coplanarOverlaps(g,{tolerance:.002,minArea:1e-4,keepIdentical:true}))found.push(`${id}: ${(f.area*1e4).toFixed(1)} cm² ${(f.gap*1000).toFixed(2)} mm`);
 }
 assert.deepEqual(found,[]);
});

test('the ceiling tubes end within their runs, never through a wall',async()=>{
 const room=new THREE.Group();await buildSakuraInterior({room,reg(){},action(){},exit(){}}).ready?.();
 const tubes=room.getObjectByName('sakura-light');tubes.updateMatrixWorld(true);
 const p=tubes.geometry.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i).applyMatrix4(tubes.matrixWorld);
  if(v.y<2.5)continue;// the counter's two bare tubes under the canopy
  const run=TUBE_RUNS.find(([x])=>Math.abs(v.x-x)<=.031);
  assert.ok(run,`a tube at x ${v.x.toFixed(3)} belongs to no run`);
  assert.ok(v.z>=run[1]-1e-6&&v.z<=run[2]+1e-6,`a tube on x ${run[0]} reaches z ${v.z.toFixed(3)}, outside its run ${run[1]}..${run[2]}`);
 }
});

// The stockroom and the staircase to the stricter rules of SK-ZF-004/005 (the owner, 27 October 2026: "audit the storage
// room and the stair case, Cad it first remove all Z fighting").
for(const [zone,{close,wide}] of Object.entries(report.zones)){
 test(`${zone}: no two faces within 2 mm of one plane over 0.1 cm², even of one colour`,()=>assert.deepEqual(close.map(where),[]));
 test(`${zone}: nothing within 10 mm of another face over 0.05 m² but a decal or clear glazing`,()=>assert.deepEqual(wide.map(where),[]));
}
