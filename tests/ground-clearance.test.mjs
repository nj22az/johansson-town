import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {GROUND_LAYER} from '../src/world/ground-layers.js';

/**
 * Two flat surfaces drawn in the same plane flicker against each other wherever they
 * overlap. A desktop card hides most of it; a phone shows sheets of flashing texture,
 * which is how the harbour came back from one. GROUND_LAYER sets the spacing -- this
 * measures whether the town actually keeps to it.
 */
const CLEARANCE=.015,TOLERATED=1;
const CENTRAL={minX:-45,maxX:45,minZ:-70,maxZ:45};
const ISLAND={minX:-130,maxX:380,minZ:-190,maxZ:245};

/** Every upward-facing, depth-writing facet the camera can see, sampled on a lattice. */
function contestedSurfaces(scene,{bounds=CENTRAL,step=.25}={}){
 scene.updateMatrixWorld(true);
 const columns=new Map(),v=new THREE.Vector3(),local=new THREE.Matrix4(),world=new THREE.Matrix4();
 const label=o=>{let name=o.name;for(let p=o.parent;!name&&p;p=p.parent)name=p.name;return name||o.geometry.type;};
 scene.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes?.position)return;
  if(!(o.layers.mask&1))return;                                  // batched away, not drawn
  for(let p=o;p;p=p.parent)if(!p.visible)return;
  const material=o.material;
  if(!material||Array.isArray(material))return;
  if(material.colorWrite===false||material.depthWrite===false)return;
  if(material.polygonOffset)return;                              // a decal, offset on purpose
  if(material.transparent&&material.opacity<1)return;
  const geometry=o.geometry,position=geometry.attributes.position,index=geometry.index;
  const count=index?index.count:position.count;
  const matrices=[];
  if(o.isInstancedMesh)for(let i=0;i<o.count;i++){o.getMatrixAt(i,local);matrices.push(world.multiplyMatrices(o.matrixWorld,local).clone());}
  else matrices.push(o.matrixWorld);
  const name=label(o);
  for(const matrix of matrices)for(let i=0;i<count;i+=3){
   const xs=[],ys=[],zs=[];
   for(let k=0;k<3;k++){const at=index?index.getX(i+k):i+k;v.fromBufferAttribute(position,at).applyMatrix4(matrix);xs.push(v.x);ys.push(v.y);zs.push(v.z);}
   if(Math.max(...ys)-Math.min(...ys)>.004)continue;              // not a flat surface
   const y=(Math.max(...ys)+Math.min(...ys))/2;
   if(y<-2||y>14)continue;
   const [x1,x2,x3]=xs,[z1,z2,z3]=zs;
   if(Math.max(...xs)<bounds.minX||Math.min(...xs)>bounds.maxX||Math.max(...zs)<bounds.minZ||Math.min(...zs)>bounds.maxZ)continue;
   // A downward face under a slab is back-face culled and never contends with it.
   if(material.side!==THREE.DoubleSide&&(x2-x1)*(z3-z1)-(z2-z1)*(x3-x1)>=0)continue;
   const denominator=(z2-z3)*(x1-x3)+(x3-x2)*(z1-z3);if(!denominator)continue;
   // Sampled off the lattice lines, so two patches that merely share an edge do not
   // read as one lying on the other.
   // Clamp the lattice, not the whole triangle. Otherwise large terrain triangles
   // crossing an audit boundary vanish from the check, hiding an island of overlap.
   for(let ix=Math.max(Math.ceil(bounds.minX/step),Math.ceil(Math.min(...xs)/step));ix<=Math.min(Math.floor(bounds.maxX/step),Math.floor(Math.max(...xs)/step));ix++)
   for(let iz=Math.max(Math.ceil(bounds.minZ/step),Math.ceil(Math.min(...zs)/step));iz<=Math.min(Math.floor(bounds.maxZ/step),Math.floor(Math.max(...zs)/step));iz++){
    const x=(ix+.37)*step,z=(iz+.37)*step;
    const a=((z2-z3)*(x-x3)+(x3-x2)*(z-z3))/denominator,b=((z3-z1)*(x-x3)+(x1-x3)*(z-z3))/denominator;
    if(a<0||b<0||a+b>1)continue;
    const key=ix*100000+iz;let list=columns.get(key);if(!list)columns.set(key,list=[]);
    list.push({name,y,x,z});
   }
  }
 });
 const found=new Map();
 for(const list of columns.values()){
  list.sort((p,q)=>p.y-q.y);
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const gap=list[j].y-list[i].y;if(gap>=CLEARANCE)break;
   if(list[i].name===list[j].name)continue;
   const id=[list[i].name,list[j].name].sort().join(' over ');
   const entry=found.get(id)||{columns:0,gap:Infinity,sample:[list[i].x,list[i].y,list[i].z]};
   entry.columns++;entry.gap=Math.min(entry.gap,gap);found.set(id,entry);
  }
 }
 return [...found].map(([id,e])=>({id,area:e.columns*step*step,gap:e.gap,sample:e.sample})).filter(e=>e.area>=TOLERATED).sort((a,b)=>b.area-a.area);
}

test('the ground layers are named rather than guessed',()=>{
 assert.ok(GROUND_LAYER.lane-GROUND_LAYER.grass>=CLEARANCE,'Paved routes clear planted ground');
 assert.ok(GROUND_LAYER.apron-GROUND_LAYER.lane>=CLEARANCE,'A surface of its own clears the routes');
});

test('no two outdoor surfaces share a plane',async()=>{
 installDOM();globalThis.self=globalThis;

 const {createTown}=await import('../src/world/town.js?ground-clearance');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const scene=new THREE.Scene();
 createTown({scene,sites:createBusinesses(),townMode:'peninsula',
  mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 for(const options of [{bounds:CENTRAL,step:.25},{bounds:ISLAND,step:.5}]){
  const contested=contestedSurfaces(scene,options);
  assert.deepEqual(contested,[],'Surfaces within 15mm of one another over more than a square metre:\n'+
   contested.map(e=>'  '+(e.gap*1000).toFixed(1)+'mm over '+e.area.toFixed(1)+' m²  '+e.id+' near '+e.sample.map(v=>v.toFixed(2)).join(', ')).join('\n'));
 }
});
