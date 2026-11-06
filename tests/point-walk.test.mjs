import test from 'node:test';
import assert from 'node:assert/strict';
import {createPointWalk} from '../src/input/point-walk.js';
const obstacle=(x,z,r)=>Math.abs(x)<.6+r&&Math.abs(z)<1.4+r;
test('mouse walking goes around an obstacle and respects ordinary clearance',()=>{
 const walking=createPointWalk({blocked:obstacle,heightAt:()=>0}),p={x:-2,z:0};let arrived=0;
 assert.ok(walking.walk(p,{x:2,z:0},{onArrival:()=>arrived++}));
 for(let i=0;i<600&&walking.active;i++){const d=walking.direction(p,1/60,null);if(d){p.x+=d.x*d.strength*3/60;p.z+=d.z*d.strength*3/60;assert.equal(obstacle(p.x,p.z,.28),false);}}
 assert.equal(arrived,1);assert.ok(Math.hypot(p.x-2,p.z)<.13);
});
test('a wall across the route cannot be crossed, and a changed room cancels a route',()=>{
 const walking=createPointWalk({blocked:x=>Math.abs(x)<1,heightAt:()=>0});assert.equal(walking.walk({x:-2,z:0},{x:2,z:0}),false);
 const open=createPointWalk({blocked:()=>false,heightAt:()=>0});assert.ok(open.walk({x:0,z:0},{x:3,z:0},{space:'home'}));assert.equal(open.direction({x:0,z:0},.1,'street'),null);assert.equal(open.active,false);
});
test('manual cancellation and a blocked resident stop the queued destination',()=>{
 const walking=createPointWalk({blocked:()=>false,heightAt:()=>0});let arrived=false;walking.walk({x:0,z:0},{x:3,z:0},{onArrival:()=>arrived=true});for(let i=0;i<100;i++)walking.direction({x:0,z:0},1/60,null);assert.equal(walking.active,false);assert.equal(arrived,false);
 walking.walk({x:0,z:0},{x:3,z:0});walking.cancel();assert.equal(walking.destination,null);
});
