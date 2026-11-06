import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSuppliedRoom,SUPPLIED_ROOM_LAYOUTS,suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js?snappy=1';
import {circleHitsRect,townBoundsBlocked,sweepFraction} from '../physics.js?snappy=1';

function reachableFloor(layout){
  const radius=.28,step=.1,blocked=(x,z)=>suppliedRoomBoundsBlocked(layout,x,z,radius)||layout.colliders.some(c=>circleHitsRect(x,z,radius,c));
  const origin={x:layout.spawn[0],z:layout.spawn[2]},queue=[[0,0]],seen=new Set(['0,0']),points=[];
  assert.equal(blocked(origin.x,origin.z),false,'Entry spawn is clear');
  for(let head=0;head<queue.length;head++){
    const [i,j]=queue[head],x=origin.x+i*step,z=origin.z+j*step;points.push({x,z});
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const ni=i+di,nj=j+dj,key=ni+','+nj;if(seen.has(key))continue;seen.add(key);
      if(!blocked(origin.x+ni*step,origin.z+nj*step))queue.push([ni,nj]);
    }
  }
  return points;
}



test('the harbour office is an original room built in code, with its furniture on its colliders',()=>{
 installDOM();
 const layout=SUPPLIED_ROOM_LAYOUTS.office,room=new THREE.Group(),actions=[],colliders=[],calls=[];let exits=0;
 const built=buildSuppliedRoom({site:{id:'office',line:'14 September 1997'},room,
  reg:(object,label,fn,inside)=>actions.push({object,label,fn,inside}),
  collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),action:(...args)=>calls.push(args),exit:()=>exits++});
 assert.equal(built,layout);
 const shell=room.children.find(o=>o.userData.officeShell);assert.ok(shell,'Procedural shell, no supplied model');
 assert.ok(!room.children.some(o=>o.userData.sharedAsset),'Nothing loaded from a file');
 const bounds=new THREE.Box3().setFromObject(shell);
 assert.ok(Math.abs(bounds.min.y)<.01,'Floor at zero');assert.ok(bounds.max.y>2.65&&bounds.max.y<3.2,'Ceiling at human scale');
 assert.ok(bounds.min.x<layout.bounds.minX&&bounds.max.x>layout.bounds.maxX,'Walls enclose the walkable bounds');
 const points=reachableFloor(layout);assert.ok(points.length>500,'Connected usable floor area');
 for(const {object,label,fn,inside} of actions){
  assert.equal(inside,true);
  assert.ok(points.some(p=>Math.hypot(p.x-object.position.x,p.z-object.position.z)<1.65),'Walk close enough to use '+label);
  fn();
 }
 assert.equal(exits,1);assert.ok(calls.some(c=>c[0]==='office-records'));assert.ok(calls.some(c=>c[0]==='seat'));
 const blocked=(x,z)=>suppliedRoomBoundsBlocked(layout,x,z,.28)||layout.colliders.some(c=>circleHitsRect(x,z,.28,c));
 for(const pos of [[0,0],[-1.5,-1.05],[1.7,-1.15]])assert.equal(blocked(...pos),false,'Clear main aisle at '+pos);
});
