import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
const {TREE_REBUILD,TREE_FAMILIES,treeDesignGeometry,treeBarkEnvelope,PALM_VARIANTS,FOREST_VARIANTS}=await import('../src/world/tree-designs.js');
const {standingHitsRect}=await import('../physics.js');
const {TREE_DESIGN_DATA}=await import('../src/world/tree-design-data.js');
const {buildTropicalIsland,tropicalPlantings,TROPIC_TRAILS,tropicHeight}=await import('../src/world/tropical-island.js');
const {airportWorld}=await import('../src/world/airport-ground.js');
const {SEA_LEVEL}=await import('../src/world/ocean.js');
const {HARBOUR_PARK_SEATS}=await import('../src/world/harbour-park-plan.js');

test('seven CAD families have finite, opaque indexed geometry at three progressively smaller LODs',()=>{
 assert.equal(TREE_REBUILD,true);assert.equal(TREE_FAMILIES.length,7);
 for(const family of TREE_FAMILIES){
  const spec=TREE_DESIGN_DATA.models[family];let previous=Infinity;
  for(const lod of ['near','mid','far']){
   const g=treeDesignGeometry(family,{lod}),n=g.attributes.normal,p=g.attributes.position,triangles=g.index.count/3;
   assert.ok(triangles<previous,family+' '+lod+' reduces triangle count');previous=triangles;
   assert.ok([...p.array,...n.array,...g.attributes.color.array].every(Number.isFinite));
   assert.ok([...g.index.array].every(i=>i<p.count));
   for(let i=0;i<n.count;i++)assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001,family+' normal');
   const size=g.boundingBox.getSize(new THREE.Vector3());
   assert.ok(Math.abs(size.x-spec.width)<.00001);assert.ok(Math.abs(size.y-spec.height)<.00001);assert.ok(Math.abs(size.z-spec.depth)<.00001);
   assert.ok(Math.abs(g.boundingBox.min.y)<.00001,'root sits on the authored ground');
  }
 }
});
test('every palm and forest variant retains its size and crown centre in the distant model',()=>{
 for(const [family,variants] of [['palm',PALM_VARIANTS],['broadleaf',FOREST_VARIANTS],['pandanus',[{}]],['banana',[{}]]])for(const options of variants){
  const near=treeDesignGeometry(family,options),far=treeDesignGeometry(family,{...options,lod:'far'}),a=near.boundingBox,b=far.boundingBox;
  const size=a.getSize(new THREE.Vector3()),other=b.getSize(new THREE.Vector3()),centre=a.getCenter(new THREE.Vector3()),next=b.getCenter(new THREE.Vector3());
  for(const axis of ['x','y','z']){assert.ok(Math.abs(other[axis]-size[axis])/size[axis]<.05,family+' '+axis+' silhouette size');assert.ok(Math.abs(centre[axis]-next[axis])/size[axis]<.05,family+' '+axis+' centre');}
  assert.ok(far.index.count<near.index.count*.45,family+' far mesh costs less than half');
 }
});
test('near and distant tropical trees use the same positions, variant partition and palm lean',()=>{
 const group=new THREE.Group(),tropic=buildTropicalIsland(group,{plants:false});tropic.addPlants();
 for(const [name,farName,total] of [['Coconut palms','palms',75],['Rainforest trees','trees',82],['Adan (pandanus)','pandanus',31],['Banana plants','bananas',34]]){
  const near=tropic.plants.children.filter(m=>m.name===name),far=tropic.farPlants.children.filter(m=>m.name==='Kitano-jima distant '+farName);
  assert.equal(near.length,far.length);assert.equal(near.reduce((a,m)=>a+m.count,0),total);
  near.forEach((mesh,i)=>{assert.equal(mesh.count,far[i].count);assert.deepEqual([...mesh.instanceMatrix.array],[...far[i].instanceMatrix.array],name+' matrices');});
 }
 tropic.lod(new THREE.Vector3(0,0,0));assert.equal(tropic.plants.visible,true);assert.equal(tropic.farPlants.visible,false);
 tropic.lod(new THREE.Vector3(0,0,170));assert.ok(tropic.plants.children.filter(m=>m.geometry?.userData.treeDesign).every(m=>m.geometry.userData.treeDesign.lod==='mid'),'approach uses the middle geometry');
 tropic.lod(new THREE.Vector3(0,0,20));assert.ok(tropic.plants.children.filter(m=>m.geometry?.userData.treeDesign).every(m=>m.geometry.userData.treeDesign.lod==='near'),'walking on the island restores the near geometry');
 tropic.lod(new THREE.Vector3(0,0,270));assert.equal(tropic.plants.visible,false);assert.equal(tropic.farPlants.visible,true);
 const P=tropicalPlantings();assert.deepEqual([P.palms.length,P.trees.length,P.pandanus.length,P.bananas.length],[75,82,31,34]);
});
test('trunk envelopes use bark and retain a positive standing footprint without making the crown solid',()=>{
 for(const family of TREE_FAMILIES){const b=treeBarkEnvelope(family),g=treeDesignGeometry(family),size=g.boundingBox.getSize(new THREE.Vector3());assert.ok(b);assert.ok(b.maxX>b.minX&&b.maxZ>b.minZ);assert.ok(b.maxX-b.minX<size.x&&b.maxZ-b.minZ<size.z);}
});
test('the accepted cherry builder and its seasonal geometry are unchanged',async()=>{
 const source=await readFile(new URL('../src/world/cherry-tree.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/tree-design|TREE_REBUILD/);
 const {buildCherryTree}=await import('../src/world/cherry-tree.js'),tree=buildCherryTree({scale:6.2});
 for(const season of ['leaf','bloom','turning','bare']){tree.setSeason(season);assert.equal(tree.season,season);}
});

test('full preview keeps the island populations and typed tropical trunks while retaining the cherry and town routes',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js'),{createBusinesses}=await import('../src/world/businesses.js');
 const town=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const trunks=town.colliders.filter(c=>c.treeFamily);assert.equal(trunks.length,222);
 for(const c of trunks){assert.ok(c.w>0&&c.d>0&&c.height>0&&Number.isFinite(c.yaw));assert.ok(!/rock/.test(c.id));}
 assert.equal(town.colliders.filter(c=>c.id==='Island hill rock').length,4);
 const cherry=town.colliders.find(c=>c.id==='harbour-cherry');assert.equal(cherry.w,1.12);assert.equal(cherry.d,1.12);
 assert.ok(town.park,'the same park is built');
 for(const trail of TROPIC_TRAILS)for(let i=1;i<trail.length;i++){
  const a=trail[i-1],b=trail[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25);
  for(let n=0;n<=steps;n++){const t=n/steps,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t,[x,z]=airportWorld(u,v),y=SEA_LEVEL+tropicHeight(u,v);
   assert.ok(!trunks.some(c=>standingHitsRect(x,z,.28,y,c)),'Kitano trail stays clear at '+[u,v]);
  }
 }
 const parkTrees=town.colliders.filter(c=>['harbour-cherry','gajumaru','gajumaru-roots','fukugi'].includes(c.id));
 for(const seat of HARBOUR_PARK_SEATS){const [x,z]=seat.stand;assert.ok(!parkTrees.some(c=>standingHitsRect(x,z,.28,0,c)),seat.id+' standing approach stays clear');}
});
