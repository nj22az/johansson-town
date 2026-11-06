import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js?snappy=1';
import {circleHitsRect} from '../physics.js?snappy=1';
import {HARBOUR_PARK_PATHS} from '../src/world/harbour-park-plan.js';

test('the removed Sakura viewing bench leaves no seat or collider and keeps the harbour poster board',()=>{
  installDOM();const labels=[];
  const world=createTown({scene:new THREE.Scene(),sites:[{id:'market',title:'Sakura Shōten',jp:'桜商店',side:-1,z:-28,color:0x9d7c7e,accent:'#a76680',line:'Thuan'}],mobile:true,shadows:false,register(object,label){labels.push(label);},onAction(){},enter(){},getPlayerPosition:()=>new THREE.Vector3()});
  for(const name of ['sakura-viewing-bench','sakura-bench-seat'])assert.equal(world.group.getObjectByName(name),undefined,name);
  assert.equal(world.sakuraBench,undefined);
  assert.ok(!world.colliders.some(c=>c.id==='sakura-bench'),'No invisible bench collider');
  for(const name of ['Minato harbour noticeboard (JW-NB rev A)','Sakura flyer on harbour notice board','Johansson woodland poster · harbour notice board'])assert.ok(world.group.getObjectByName(name),name+' remains');
  assert.ok(world.colliders.some(c=>c.x===5.5&&c.z===-33.2),'The retained noticeboard keeps its collider');
  assert.ok(!(world.details||[]).some(d=>d.id==='sakura-bench'),'Streaming cannot restore the deleted bench');
  assert.ok(!labels.includes('Sit and look at Sakura'),'No seat prompt remains at the former bench');
  assert.ok(labels.includes('Look at the harbour notice board'),'The woodland poster and flyer menu remain available');
  assert.ok(world.group.getObjectByName('prop:bench'),'Neighbourhood bench remains further north');
  const approach=HARBOUR_PARK_PATHS.find(r=>r.id==='park-approach');
  for(let i=1;i<approach.points.length;i++){
    const a=approach.points[i-1],b=approach.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    for(let t=0;t<=1;t+=.05)for(const side of [-1,0,1]){
      const edge=side*(approach.width/2-.34),x=a[0]+dx*t-dz/length*edge,z=a[1]+dz*t+dx/length*edge;
      assert.equal(world.colliders.some(c=>circleHitsRect(x,z,.32,c)),false,'Clear complete crossing approach at '+[x,z]);
    }
  }
});
