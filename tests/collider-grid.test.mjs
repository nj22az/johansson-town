import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {createColliderGrid} from '../src/world/collider-grid.js';

test('the collider grid answers exactly as checking every collider does, however the list changes',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js?collider-grid');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const list=world.colliders,grid=createColliderGrid(list);
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const check=label=>{grid.refresh();for(let k=0;k<4000;k++){const x=rnd()*120-60,z=rnd()*120-70,r=.1+rnd()*1.5,hit=c=>circleHitsRect(x,z,r,c);
  assert.equal(grid.some(x,z,r,hit),list.some(hit),`${label}: disagree at ${x.toFixed(2)},${z.toFixed(2)} r=${r.toFixed(2)}`);}};
 check('as built');
 // Something drives off and parks elsewhere; something new is put down; something is taken away.
 const moved=list.find(c=>c.id==='parked-vehicle')??list[0];moved.x+=13;moved.z-=7;check('a collider moved');
 list.push({id:'new crate',x:3,z:-30,w:2,d:1.4,yaw:.6,height:1});check('a collider added');
 list.splice(list.findIndex(c=>c.id==='new crate'),1);check('a collider removed');
 // Taken away in the middle of a frame (mounting the bicycle): seen at once, no refresh needed.
 const gone=list.splice(5,1)[0],x=gone.x,z=gone.z;assert.equal(grid.some(x,z,.1,c=>c===gone),false,'a removed collider is not found');list.splice(5,0,gone);
});

test('a collider without a centre is ignored rather than making every query rebuild the grid',()=>{
 const list=[{x:0,z:0,w:1,d:1},{minX:2,maxX:3,minZ:0,maxZ:1}],grid=createColliderGrid(list);
 grid.refresh();const before=grid.near(0,0,.5).length;
 let rebuilt=0;const original=Map;globalThis.Map=class extends original{constructor(...a){super(...a);rebuilt++;}};
 try{for(let i=0;i<50;i++)grid.near(0,0,.5);}finally{globalThis.Map=original;}
 assert.equal(before,1);assert.equal(rebuilt,0,'the grid rebuilt on a plain query');
});
