import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {homeEntranceView,homeViews} from '../tools/visual-home-views.mjs';
import {buildYardHomeInterior} from '../src/world/interiors/yard-home.js';
import {buildFamilyHome} from '../src/world/interiors/family-home.js';
import {buildMayorHome} from '../src/world/interiors/town-hall.js';
import {createHomeCustomization} from '../src/world/interiors/home-customization.js';

test('new staff and Thuan home camera fixtures are inside their real plans and clear of partition faces',()=>{
 installDOM();
 for(const [id,owner] of [['resident-home-kenji','Tetsuo'],['resident-home-thuan','Thuan']]){
  const room=new THREE.Group(),colliders=[];
  const args={room,reg(){},action(){},collider(x,z,w,d,height){colliders.push({x,z,w,d,height});}};
  const layout=id==='resident-home-thuan'?buildFamilyHome({...args,kind:'red-tile',residents:['Thuan','Thao','Chin']}):buildYardHomeInterior({...args,site:{id,homeOwner:owner}});
  room.updateMatrixWorld(true);const ray=new THREE.Raycaster(),walls=[];
  room.traverse(o=>{if(o.isMesh&&new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()).y>1.8)walls.push(o);});
  for(const view of [homeEntranceView(id),...homeViews(id,layout)]){
   const [x,y,z]=view.pos,b=layout.bounds;
   assert.ok(x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ,id+' camera is inside its actual shell');
   assert.ok(y<2.45,id+' camera stays below its ceiling');
   assert.ok(!colliders.some(c=>c.height>=y&&Math.abs(x-c.x)<c.w/2+.05&&Math.abs(z-c.z)<c.d/2+.05),id+' camera is not in a wall or tall cabinet');
   const origin=new THREE.Vector3(...view.pos),direction=new THREE.Vector3(...view.at).sub(origin).normalize();ray.set(origin,direction);
   const hit=ray.intersectObjects(walls,false)[0];assert.ok(!hit||hit.distance>.8,id+' view does not stare into a nearby partition');
  }
 }
});

test('the Mayor keepsake fixture sees the actual postcard in the main room',()=>{
 installDOM();const room=new THREE.Group(),colliders=[];
 const layout=buildMayorHome({room,reg(){},action(){},collider(x,z,w,d,height,minY=0){if(minY+height>.01&&minY<2)colliders.push({x,z,w,d,height});}});
 createHomeCustomization({room,state:{},menu(){},save(){},close(){},reg(){}});room.updateMatrixWorld(true);
 const view=homeViews('mayor-home',layout)[0],[x,y,z]=view.pos;
 assert.ok(!colliders.some(c=>c.height>=y&&Math.abs(x-c.x)<c.w/2+.05&&Math.abs(z-c.z)<c.d/2+.05),'Camera is clear of the bathroom partitions');
 const meshes=[];room.traverse(o=>{if(o.isMesh){let visible=true;for(let p=o;p;p=p.parent)visible&&=p.visible;if(visible)meshes.push(o);}});
 const origin=new THREE.Vector3(...view.pos),direction=new THREE.Vector3(...view.at).sub(origin).normalize(),ray=new THREE.Raycaster(origin,direction);
 const hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit&&/postcard/i.test(hit.object.name),'The keepsake is the first visible surface, not its old bathroom wall');
});
