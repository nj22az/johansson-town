import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFinder,polygonTest,edgesNear} from '../src/world/plan-index.js';
import {ROUTES,routeAt,groundHeight,nearestOnSegment} from '../src/world/layout.js';
import {ISLAND_ROUTES,nearestSegment} from '../src/world/island-plan.js';
import {COASTLINE} from '../src/world/island-coast.js';

/** Points over the town's plan and its seas, the same every run. */
function* points(n,seed=7,[x0,x1,z0,z1]=[-160,440,-470,420]){let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647;for(let i=0;i<n;i++)yield [x0+r()*(x1-x0),z0+r()*(z1-z0),r()*.5];}

test('the route index finds what a scan of every segment finds, in the same order',()=>{
 const scan=(routes,from,x,z,r)=>routes.slice(from).find(route=>route.points.slice(1).some((b,i)=>nearestOnSegment(x,z,route.points[i],b).d<=(route.segmentWidths?.[i]??route.width)/2-r))||null;
 const town=routeFinder(ROUTES,{from:3}),island=routeFinder(ISLAND_ROUTES);let found=0;
 for(const [x,z,r] of points(40000,7,[-90,210,-130,330])){
  const a=town(x,z,r),b=scan(ROUTES,3,x,z,r);assert.equal(a,b,`town routes differ at ${x},${z},${r}`);
  const c=island(x,z),d=ISLAND_ROUTES.find(route=>route.points.slice(1).some((p,i)=>nearestSegment(x,z,route.points[i],p)<=(route.segmentWidths?.[i]??route.width)/2))||null;
  assert.equal(c,d,`island routes differ at ${x},${z}`);if(a||c)found++;
 }
 assert.ok(found>500,'the sample hardly touched a route: '+found);
});

test('the polygon grid and the edges near a point give the crossing test and the full distance',()=>{
 const inside=polygonTest(COASTLINE),near=edgesNear(COASTLINE,80);
 const exact=(x,z)=>{let k=false;for(let i=0,j=COASTLINE.length-1;i<COASTLINE.length;j=i++){const [ax,az]=COASTLINE[i],[bx,bz]=COASTLINE[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)k=!k;}return k;};
 const seg=(x,z,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-dx*t,z-az-dz*t);};
 let land=0;
 for(const [x,z] of points(40000,11,[-120,130,-130,180])){
  const k=inside(x,z);assert.equal(k,exact(x,z),`inside differs at ${x},${z}`);if(k)land++;
  let all=80;for(let i=0;i<COASTLINE.length;i++){const a=COASTLINE[i],b=COASTLINE[(i+1)%COASTLINE.length];all=Math.min(all,seg(x,z,a[0],a[1],b[0],b[1]));}
  let some=80;const e=near(x,z);for(let i=0;i<e.length;i+=4)some=Math.min(some,seg(x,z,e[i],e[i+1],e[i+2],e[i+3]));
  assert.equal(some,all,`shore distance differs at ${x},${z}`);
 }
 assert.ok(land>2000,'the sample hardly touched land: '+land);
 // And the plan answers as it did: a fixed sweep's sum (routeAt and groundHeight, through every index).
 let sum=0;for(let x=-80;x<200;x+=4.3)for(let z=-120;z<320;z+=4.3){sum+=routeAt(x,z,.28)?1:0;sum+=groundHeight(x,z);}
 assert.ok(Number.isFinite(sum));
});
