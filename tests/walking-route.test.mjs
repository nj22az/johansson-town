import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkingRoute} from '../src/navigation/walking-route.js';

const flat=()=>({blocked:false,y:0});
function complete(route,budget=37){
 let calls=0;
 while(route.status==='searching'&&calls++<100000)route.step(budget);
 assert.notEqual(route.status,'searching','the bounded search terminates');
 return route;
}
function clearPath(path,sample){
 assert.ok(path.length);
 for(let i=0;i<path.length;i++){
  assert.equal(sample(path[i].x,path[i].z).blocked,false,'every waypoint is standable');
  if(!i)continue;
  const a=path[i-1],b=path[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.04));
  let y=sample(a.x,a.z).y;
  for(let k=1;k<=n;k++){
   const t=k/n,s=sample(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
   assert.equal(s.blocked,false,'the entire returned segment is clear');
   assert.ok(Math.abs(s.y-y)<=.240000001,'the entire returned segment is stepable');y=s.y;
  }
 }
}

test('work is incremental and exact off-grid endpoints retain their sampled heights',()=>{
 let probes=0;
 const start={x:.07,z:.08},goal={x:4.23,z:3.76};
 const sample=(x,z)=>{probes++;return {blocked:false,y:.1*x+.05*z};};
 const route=createWalkingRoute({start,goal,sample});
 assert.equal(probes,0,'constructing a route does not probe the world');
 assert.equal(route.step(0),'searching');assert.equal(probes,0);
 for(let i=0;i<20;i++){
  const before=probes;route.step(1);assert.ok(probes-before<=1,'one work unit makes at most one sample call');
 }
 complete(route);
 assert.equal(route.status,'found');assert.equal(route.reason,'goal-reached');
 assert.deepEqual(route.path[0],{...start,y:.1*start.x+.05*start.z});
 assert.deepEqual(route.path.at(-1),{...goal,y:.1*goal.x+.05*goal.z});
 clearPath(route.path,sample);
 const settled=probes;assert.equal(route.step(),'found');assert.equal(probes,settled,'finished routes do no more work');
});

test('a real wall forces a detour and simplification cannot replace it with a blocked straight line',()=>{
 const sample=(x,z)=>({blocked:x>=1.6&&x<=2.4&&z>=-2&&z<=2,y:0});
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:4,z:0},sample,bounds:{minX:-1,maxX:5,minZ:-3,maxZ:3}}));
 assert.equal(route.status,'found');assert.ok(route.path.length>2);
 assert.ok(route.path.some(p=>Math.abs(p.z)>2),'the walk goes around a visible wall end');
 clearPath(route.path,sample);
});

test('a free destination inside a sealed room is unreachable, not silently snapped outside',()=>{
 const sample=(x,z)=>({blocked:(x>=.8&&x<=1.2||x>=2.8&&x<=3.2)&&Math.abs(z)<=1.2||
  (z>=.8&&z<=1.2||z>=-1.2&&z<=-.8)&&x>=.8&&x<=3.2,y:0});
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:2,z:0},sample,bounds:{minX:-1,maxX:4,minZ:-2,maxZ:2}}));
 assert.equal(route.status,'unreachable');assert.equal(route.reason,'no-route');assert.deepEqual(route.path,[]);
});

test('an obstructed destination may end at an honest approach within one metre',()=>{
 const goal={x:2,z:0},sample=(x,z)=>({blocked:x>=1.8&&x<=2.2,y:0});
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal,sample,bounds:{minX:-1,maxX:3,minZ:-2,maxZ:2}}));
 assert.equal(route.status,'found');assert.equal(route.reason,'goal-approach');
 const end=route.path.at(-1);
 assert.ok(Math.hypot(end.x-goal.x,end.z-goal.z)<=1.000000001);
 assert.notDeepEqual({x:end.x,z:end.z},goal,'the blocked goal is never appended as an invented final step');
 clearPath(route.path,sample);
 const solid=(x,z)=>({blocked:Math.hypot(x-3,z)<1.25,y:0});
 const enclosed=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:3,z:0},sample:solid,bounds:{minX:-1,maxX:5,minZ:-2,maxZ:2}}));
 assert.equal(enclosed.status,'unreachable');assert.equal(enclosed.reason,'no-goal-approach');
});

test('diagonal grid corners cannot bypass either blocked cardinal neighbour',()=>{
 const sample=(x,z)=>({blocked:Math.hypot(x-1,z)<.2||Math.hypot(x,z-1)<.2,y:0});
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:1,z:1},sample,cell:1,bounds:{minX:0,maxX:1,minZ:0,maxZ:1}}));
 assert.equal(route.status,'unreachable');assert.deepEqual(route.path,[]);
});

test('start-grid and grid-goal joins probe the wall between the points',()=>{
 const sample=(x,z)=>({blocked:x>=.09&&x<=.17,y:0});
 for(const [start,goal] of [[{x:.24,z:0},{x:0,z:0}],[{x:0,z:0},{x:.24,z:0}]]){
  const route=complete(createWalkingRoute({start,goal,sample,bounds:{minX:-1,maxX:1,minZ:-1,maxZ:1}}));
  assert.equal(route.status,'unreachable','rounding an endpoint must not cross a thin wall');
 }
});

test('small successive height changes are walkable but a 25 cm step is not',()=>{
 const bounds={minX:-1,maxX:5,minZ:-1,maxZ:1},start={x:0,z:0},goal={x:4,z:0};
 const ramp=(x,z)=>({blocked:false,y:x*.4});
 const route=complete(createWalkingRoute({start,goal,sample:ramp,bounds}));
 assert.equal(route.status,'found');assert.equal(route.path.at(-1).y,1.6);clearPath(route.path,ramp);
 for(const [height,expected] of [[.24,'found'],[.25,'unreachable']]){
  const sample=(x,z)=>({blocked:false,y:x>=2?height:0});
  const step=complete(createWalkingRoute({start,goal,sample,bounds}));
  assert.equal(step.status,expected,`${height} m step`);
  if(expected==='found')clearPath(step.path,sample);
 }
});

test('supplied bounds, automatic margin and the visit limit are enforced',()=>{
 const sample=(x,z)=>({blocked:x>=1.6&&x<=2.4&&Math.abs(z)<=2,y:0});
 const start={x:0,z:0},goal={x:4,z:0};
 const narrow=complete(createWalkingRoute({start,goal,sample,bounds:{minX:-1,maxX:5,minZ:-1,maxZ:1}}));
 assert.equal(narrow.status,'unreachable');
 const wider=complete(createWalkingRoute({start,goal,sample,margin:3}));assert.equal(wider.status,'found');
 const limited=complete(createWalkingRoute({start,goal:{x:20,z:0},sample:flat,maxVisited:3}));
 assert.equal(limited.reason,'search-limit');assert.equal(limited.visited,3);
 const outside=complete(createWalkingRoute({start,goal,sample:flat,bounds:{minX:0,maxX:3,minZ:-1,maxZ:1}}));
 assert.equal(outside.reason,'outside-bounds');
});

test('surface costs survive simplification instead of being cut across by a straight shortcut',()=>{
 const sample=(x,z)=>({blocked:false,y:0,cost:x>=1&&x<=3&&Math.abs(z)<.75?20:1});
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:4,z:0},sample,bounds:{minX:-1,maxX:5,minZ:-2,maxZ:2}}));
 assert.equal(route.status,'found');assert.ok(route.path.some(p=>Math.abs(p.z)>=.75));
 assert.ok(route.path.length>2,'the cheap detour is retained');clearPath(route.path,sample);
});

test('blocked starts and non-finite ground heights fail without inventing a route',()=>{
 const blocked=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:2,z:0},sample:()=>({blocked:true,y:0})}));
 assert.equal(blocked.reason,'start-blocked');
 const missing=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:2,z:0},sample:()=>({blocked:false,y:NaN})}));
 assert.equal(missing.reason,'start-blocked');assert.deepEqual(missing.path,[]);
});

test('routes around the reproduced onsen and Nishi posts survive component movement',()=>{
 for(const [start,goal,post] of [
  [{x:11.5,z:-19},{x:17.5,z:-22},{x:15.35,z:-20.45,w:.2,d:.2}],
  [{x:-23.5,z:-11.5},{x:-24,z:-9.5},{x:-23.2,z:-11.2,w:.14,d:.14}],
 ]){
  const sample=(x,z)=>{
   const dx=Math.max(0,Math.abs(x-post.x)-post.w/2),dz=Math.max(0,Math.abs(z-post.z)-post.d/2);
   return {blocked:dx*dx+dz*dz<.28*.28,y:0};
  };
  const route=complete(createWalkingRoute({start,goal,sample,margin:2}));
  assert.equal(route.status,'found');clearPath(route.path,sample);
  let position=route.path[0];
  for(const b of route.path.slice(1)){
   const a={...position},count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.04);
   for(let i=1;i<=count;i++){
    const x=a.x+(b.x-a.x)*i/count,z=a.z+(b.z-a.z)*i/count;
    assert.equal(sample(x,position.z).blocked,false,'the X component clears the real post');
    assert.equal(sample(x,z).blocked,false,'the Z component clears the real post');
    position={x,z};
   }
  }
 }
});

test('a distant off-grid goal does not flood an unobstructed field before arrival',()=>{
 const route=complete(createWalkingRoute({start:{x:0,z:0},goal:{x:120.2,z:80.1},sample:flat}),600);
 assert.equal(route.status,'found');
 assert.ok(route.visited<600,`the near-direct walk expanded ${route.visited} nodes`);
 assert.deepEqual(route.path.at(-1),{x:120.2,z:80.1,y:0});
});
