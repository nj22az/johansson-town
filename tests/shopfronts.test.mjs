import {circleHitsRect} from '../physics.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {DOCK_WORKSHOP_PLOT} from '../src/world/dock-workshop-layout.js';
import {WEST_SHOPS,westShopDoor,WEST_FRONT} from '../src/world/west-shops.js';

async function island(){
 installDOM();globalThis.self=globalThis;
 
 const {createTown}=await import('../src/world/town.js?shopfronts');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const scene=new THREE.Scene(),entrances=[];
 const sites=createBusinesses();
 const world=createTown({scene,sites,mobile:false,shadows:false,
  register(object,label){if(/^Enter /.test(label)){const p=object.getWorldPosition(new THREE.Vector3());entrances.push({label,x:p.x,z:p.z});}},
  enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 scene.updateMatrixWorld(true);
 return {scene,world,sites,entrances};
}

test('every door opens onto a building',async()=>{
 const {scene,world,entrances}=await island();
 const [wx,,wz]=DOCK_WORKSHOP_PLOT.door;for(const z of [wz,wz+.6])assert.equal(world.colliders.some(c=>circleHitsRect(wx,z,.32,c)),false,'Workshop entrance and exit clear the yard wall');
 // What counts as a building: something with walls, standing on the ground.
 const walls=[];
 scene.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes?.position)return;
  if(!(o.layers.mask&1))return;for(let p=o;p;p=p.parent)if(!p.visible)return;
  const box=new THREE.Box3().setFromObject(o),size=box.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.x+size.y+size.z))return;
  if(size.y>2.4&&box.min.y<1&&Math.max(size.x,size.z)>2&&size.x<40&&size.z<40)walls.push(box);
 });
 assert.ok(walls.length>6,'Found no buildings to check the doors against');
 assert.deepEqual(entrances.map(e=>e.label).sort(),[
  'Enter Front-Row Books','Enter Dock Electrical & Repair Workshop','Enter Harbour Warehouse',
  'Enter Johansson Harbour Office','Enter Minato Port Terminal','Enter Sakura Shōten','Enter Minato Police Station',
 ].sort(),'Separate bookshop and dock workshop entrances, with other businesses retained');
 // Chin & Tetsuo Repairs offered a way in at 0.4,-6.7 -- out on the boardwalk beside a
 // lamp post, because that is where the old night-market alley put its door. A door has to be in a wall.
 const adrift=entrances.filter(e=>!walls.some(w=>
  e.x>w.min.x-3&&e.x<w.max.x+3&&e.z>w.min.z-3&&e.z<w.max.z+3))
  .map(e=>e.label+' at '+e.x.toFixed(1)+','+e.z.toFixed(1));
 assert.deepEqual(adrift,[],'Doors standing in the open air:\n  '+adrift.join('\n  '));
});

test('the shop staff stand at their own shop',async()=>{
 const {sites}=await island();
 const {RESIDENTS}=await import('../src/people/residents.js?shopfronts');
 // Nhung is the island doctor since 22 October 2026, her work the clinic (johansson-town/AGENTS.md, workplaces.js
 // WORK_SITES); Front-Row is unstaffed and Reiko retired in the cast consolidation (docs/CAST-CONSOLIDATION.md, roster.js
 // RETIRED `reiko`), so nobody keeps Front-Row's door. They were ['Nhung','frontrow'] and ['Reiko','frontrow'].
 assert.equal(RESIDENTS.some(p=>p.name==='Reiko'),false,'Reiko is retired');
 const clinic=sites.find(s=>s.id==='clinic');assert.ok(clinic,'the town hall has its clinic door');
 const doorOf=id=>id==='form3d'?DOCK_WORKSHOP_PLOT.door.filter((_,i)=>i!==1):id==='clinic'?[clinic.approachPosition[0],clinic.approachPosition[2]]:westShopDoor(id);
 for(const [name,id] of [['Nhung','clinic'],['Chin','form3d'],['Tetsuo','form3d']]){
  const work=RESIDENTS.find(p=>p.name===name)?.work,door=doorOf(id);
  assert.ok(work,name+' has nowhere to work');
  assert.ok(Math.hypot(work[0]-door[0],work[1]-door[1])<.6,name+' works at '+JSON.stringify(work)+', not at '+JSON.stringify(door));
 }
});

test('the west shops leave the pavement and the crossing alone',async()=>{
 const {routeAt}=await import('../src/world/layout.js?shopfronts');
 
 for(const [id,plot] of Object.entries(WEST_SHOPS)){
  // The doorstep is standable, and so is the pavement past the shop either way.
  const door=westShopDoor(id);
  assert.ok(routeAt(door[0],door[1],.32),id+' has a doorstep you cannot stand on');
  for(const dz of [-plot.width/2-1.2,plot.width/2+1.2])
   assert.ok(routeAt(door[0],plot.z+dz,.32),id+' blocks the pavement at its '+(dz<0?'south':'north')+' end');
  // And the building is behind the frontage line, not out in the street.
  assert.ok(WEST_FRONT<=-7.6,'The shop frontage has moved onto the carriageway');
 }
 // The crossing at z 5.1 still reaches the west kerb beside the bookshop.
 assert.ok(routeAt(-7.4,5.1,.32),'The shop crossing no longer reaches the west pavement');
});
