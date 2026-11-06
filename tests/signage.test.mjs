import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {STAFF_BENCH,STAFF_YARD_ROUTE} from '../src/world/staff-bench.js';

async function island(){
 installDOM();globalThis.self=globalThis;
 
 const {createTown}=await import('../src/world/town.js?signage');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const scene=new THREE.Scene();
 const world=createTown({scene,sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),
  mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 scene.updateMatrixWorld(true);
 return {scene,world};
}

/** Every upright panel above head height, and every solid that could be holding one up. */
function signage(scene){
 const panels=[],solids=[],local=new THREE.Matrix4(),world=new THREE.Matrix4();
 scene.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes?.position)return;
  if(!(o.layers.mask&1))return;                                  // batched away, not drawn
  for(let p=o;p;p=p.parent)if(!p.visible)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  const boxes=[];
  if(o.isInstancedMesh)for(let i=0;i<o.count;i++){o.getMatrixAt(i,local);boxes.push(o.geometry.boundingBox.clone().applyMatrix4(world.multiplyMatrices(o.matrixWorld,local)));}
  else boxes.push(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
  for(const box of boxes){
   const size=box.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.x+size.y+size.z))continue;
   const board=o.geometry.type==='PlaneGeometry'&&Math.min(size.x,size.z)<.08
    &&size.y>.2&&size.y<1.6&&Math.max(size.x,size.z)>.4&&box.min.y>1.2;
   if(board)panels.push({name:o.name||o.parent?.name||o.geometry.type,box});
   else if(size.y>.25)solids.push(box);
  }
 });
 return {panels,solids};
}

test('no sign hangs in the air',async()=>{
 const {scene}=await island();
 const {panels,solids}=signage(scene);
 assert.ok(panels.length>10,'Found the town signage at all');
 // A sign is held up by something: the post under it, the gantry it hangs from, or the
 // wall it is bolted to. That something has to start below the board and reach its
 // lower edge, within a metre and a half of it -- an overhead cable passing seven
 // metres up is not holding anything. Nothing like that, and the board is standing on
 // air, which is what the board across the bus road and the one over the quay did.
 const floating=panels.filter(({box})=>{
  const reach=new THREE.Box3(new THREE.Vector3(box.min.x-1.5,-50,box.min.z-1.5),
                             new THREE.Vector3(box.max.x+1.5,50,box.max.z+1.5));
  return !solids.some(s=>s.intersectsBox(reach)&&s.min.y<box.min.y-.1&&s.max.y>=box.min.y-.2);
 }).map(({name,box})=>{const c=box.getCenter(new THREE.Vector3());
  return name+' at '+c.x.toFixed(1)+','+c.y.toFixed(1)+','+c.z.toFixed(1);});
 assert.deepEqual(floating,[],'Signs with nothing holding them up:\n  '+floating.join('\n  '));
});

test('the path round the back goes to the bench and nowhere else',async()=>{
 const {routeAt}=await import('../src/world/layout.js?signage-path');
 
 // Every metre of it is ground you can stand on, from the pavement to the bench.
 for(let i=1;i<STAFF_YARD_ROUTE.points.length;i++){
  const [ax,az]=STAFF_YARD_ROUTE.points[i-1],[bx,bz]=STAFF_YARD_ROUTE.points[i];
  for(let t=0;t<=1;t+=.02)assert.ok(routeAt(ax+(bx-ax)*t,az+(bz-az)*t,.32),'The staff path is blocked partway along');
 }
 const [head]=STAFF_YARD_ROUTE.points,end=STAFF_YARD_ROUTE.points.at(-1);
 assert.ok(head[0]>-9&&head[1]>-20,'The path starts at the street, not in the middle of the yard');
 assert.equal(end[1],STAFF_BENCH.z,'The path ends level with the bench');
 assert.ok(Math.hypot(end[0]-STAFF_BENCH.stand[0],end[1]-STAFF_BENCH.stand[1])<1.2,'The bench is at the end of the path');
 // A cul-de-sac: the paving stops at the bench. The yard is still open ground beyond
 // it -- it is a yard -- but the path itself goes nowhere else.
 assert.equal(STAFF_YARD_ROUTE.points.length,3,'The staff path grew another leg');
 assert.notEqual(routeAt(end[0],STAFF_BENCH.z-3.2,.32)?.id,'staff-yard','The path runs on past the bench instead of stopping at it');
 assert.equal(routeAt(end[0],STAFF_BENCH.z-.8,.32)?.id,'staff-yard','The paving does not reach the bench');
});
