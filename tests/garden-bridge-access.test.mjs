import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {COAST_BOUNDS} from '../src/world/island-coast.js';
import {HARBOUR_PARK_PATHS,HARBOUR_PARK_SEATS} from '../src/world/harbour-park-plan.js';
import {ONSEN_APPROACH,onsenPoint} from '../src/world/onsen-layout.js';
import {COAST_ROAD} from '../src/world/island-plan.js';
import {onIslandLand} from '../src/world/coastal-ground.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {groundHeight,planHeight,setWalkSurface} from '../src/world/layout.js';
import {townBoundsBlocked,standingHitsRect,canStepBetween} from '../physics.js';

test('Harbour Park walks, footbath, benches and outer-island trails connect on real supported floors with ordinary collision',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const world=createTown({scene:new THREE.Scene(),sites:[],townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){}});
 // Match the live game's terrain sampling origin and dimensions.
 const surface=createWalkSurface({minX:COAST_BOUNDS.minX-2,maxX:COAST_BOUNDS.maxX+2,minZ:COAST_BOUNDS.minZ-2,maxZ:COAST_BOUNDS.maxZ+2,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const bins=new Map();for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.4;for(let i=Math.floor((c.x-reach)/4);i<=Math.floor((c.x+reach)/4);i++)for(let j=Math.floor((c.z-reach)/4);j<=Math.floor((c.z+reach)/4);j++){const key=i+','+j;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(c);}}
 world.group.updateMatrixWorld(true);const floors=[];world.group.traverse(o=>{if(!o.isMesh||o.material?.transparent)return;for(let p=o;p;p=p.parent)if(!p.visible||p.userData.dynamicProp)return;floors.push({mesh:o,bounds:new THREE.Box3().setFromObject(o)});});
 const ray=new THREE.Raycaster();
 function walk(points,label,{land=false}={}){
  let [x,z]=points[0];
  for(const [tx,tz] of points.slice(1)){
   const sx=x,sz=z,n=Math.ceil(Math.hypot(tx-x,tz-z)/.04);
   for(let k=1;k<=n;k++)for(const [px,pz] of [[sx+(tx-sx)*k/n,z],[sx+(tx-sx)*k/n,sz+(tz-sz)*k/n]]){
    if(land)for(let i=0;i<8;i++){const a=i*Math.PI/4;assert.ok(onIslandLand(px+Math.cos(a)*.32,pz+Math.sin(a)*.32),label+' leaves actual land at '+[px,pz]);}
    const y=groundHeight(px,pz);assert.ok(canStepBetween(groundHeight(x,z),y),label+' height cliff at '+[px,pz]);
    assert.equal(townBoundsBlocked(px,pz,.32),false,label+' bounds at '+[px,pz]);
    assert.equal((bins.get(Math.floor(px/4)+','+Math.floor(pz/4))||[]).some(c=>standingHitsRect(px,pz,.32,y,c)),false,label+' solid at '+[px,pz]);
    if(k%5===0||k===n){ray.set(new THREE.Vector3(px,y+.24,pz),new THREE.Vector3(0,-1,0));const candidates=floors.filter(({bounds:b})=>px>=b.min.x&&px<=b.max.x&&pz>=b.min.z&&pz<=b.max.z&&b.min.y<=y+.24&&b.max.y>=y-.06).map(o=>o.mesh);assert.ok(ray.intersectObjects(candidates,false).some(h=>Math.abs(h.point.y-y)<.06),label+' missing drawn floor at '+[px,pz]);}
    x=px;z=pz;
   }
  }
 }
 const coast=world.group.getObjectByName('island-coastal-road');
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
 world.group.traverse(mesh=>{if(mesh.name!=='Edge line (外側線)'||mesh.parent.name!=='Road standards')return;for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);
  ray.set(position.clone().add(new THREE.Vector3(0,.05,0)),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(coast,false)[0];assert.ok(hit,'edge paint missing asphalt beneath it at '+position.toArray());
  assert.ok(position.y-hit.point.y>.004&&position.y-hit.point.y<.012,'edge paint must clear the actual asphalt cap at '+position.toArray());
 }});
 try{
  for(const route of HARBOUR_PARK_PATHS)walk(route.points,route.id);
  const loop=HARBOUR_PARK_PATHS.find(r=>r.id==='garden-pond-loop');walk([...loop.points].reverse(),'pond circuit reverse');
  walk([[22,-34.2],HARBOUR_PARK_SEATS[1].stand],'pond circuit to bench stand');
  walk([[6,-20.8],[9.6,-21.8],[9.4,-24.8],[9,-29.8],HARBOUR_PARK_SEATS[0].stand],'crossing to cherry bench stand');
  walk([[12,-22.4],ONSEN_APPROACH],'park to bathhouse porch');
  walk([[12,-22.4],[13.4,-22.4],[13.4,-18.7],onsenPoint(1.9,8.5)],'park to footbath seat approach');
  // (No walk up the mountain trail to Aoba Radio and its roof lookout: the owner, 18 October 2026, AGENTS.md "Keep Minato
  // a compact urban port town. Do not restore rural districts"; the main island now ends at the urban blocks
  // (island-plan.js ISLAND_COAST), no route runs north of z 95, and buildAobaRadio (aoba-radio.js) is built by nothing.)
  walk([[53,66],...COAST_ROAD],'Kitahama street through the full coastal road and back to Nishi',{land:true});
  walk([...COAST_ROAD.slice(0,4)].reverse().concat([[53,66]]),'coastal road return to the Kitahama street',{land:true});
 }finally{setWalkSurface(null);}
});
