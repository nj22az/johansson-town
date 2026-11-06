import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createIslandBusinesses} from '../src/world/businesses.js';
import {standingHitsRect} from '../physics.js';
import {TOWN_WALK_PLOTS,plotCircuit} from '../src/world/architecture-plan.js';
import {SHED_CIRCUIT} from '../src/world/fujita-layout.js';
import {COAST_WALK,COAST_ROAD} from '../src/world/island-plan.js';
import {COASTLINE,COAST_BOUNDS} from '../src/world/island-coast.js';
import {groundHeight,planHeight,setWalkSurface,routeAt} from '../src/world/layout.js';
import {onIslandLand} from '../src/world/coastal-ground.js';
import {createWalkSurface} from '../src/world/walk-surface.js';

// This deliberately builds the live catalogue: an empty sites array omits Sakura
// and Front-Row, so an entrance-only test can pass through missing buildings.
test('every registered building has a clear complete circuit connected to Main Street',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const surface=createWalkSurface({...COAST_BOUNDS,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const bins=new Map(),key=(x,z)=>Math.floor(x/4)+','+Math.floor(z/4);
 for(const c of world.colliders){const r=Math.hypot(c.w||0,c.d||0)/2+1.3;for(let x=Math.floor((c.x-r)/4);x<=Math.floor((c.x+r)/4);x++)for(let z=Math.floor((c.z-r)/4);z<=Math.floor((c.z+r)/4);z++){const k=x+','+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(c);}}
 const hits=(x,z,r)=>{const y=groundHeight(x,z);return (bins.get(key(x,z))||[]).filter(c=>standingHitsRect(x,z,r,y,c));};
 const loops=[...TOWN_WALK_PLOTS.map(p=>({id:p.id,points:plotCircuit(p),radius:.95,land:true})),{id:'Fujita timber circuit',points:SHED_CIRCUIT,radius:.32},{id:'coastal circuit',points:COAST_WALK,radius:1.2,land:true}];
 try{
  assert.ok(world.colliders.some(c=>Math.abs(c.x+12.95)<.1&&Math.abs(c.z+27.3)<.1&&c.w>10),'Sakura exists in the test scene');
  assert.ok(world.colliders.some(c=>c.id?.startsWith('west-shop:frontrow')),'Front-Row exists in the test scene');
  assert.ok(COAST_BOUNDS.maxZ<=95,'rural land is removed, not hidden');
  for(const [x,z] of [[40,158],[66,198],[132,190],[-54,204],[-38,117],[42,86]]){
   assert.equal(onIslandLand(x,z),false,'retired district is sea: '+[x,z]);
   assert.equal(routeAt(x,z,.32),null,'retired district has no active ground: '+[x,z]);
  }
  const retired=/Fumoto|Hoshizaki|Aoba|Utaki banyan|Lighthouse|Honesty stand|cane-field|farmhouse|field-shed/i;
  world.group.traverse(o=>assert.equal(retired.test(o.name),false,'retired scenery: '+o.name));
  assert.equal(world.colliders.some(c=>retired.test(c.id||'')),false,'no phantom rural colliders');
  assert.equal(world.landmarks.some(l=>l.z>95&&l.x<80),false,'no retired map targets');
  const targets=[],failures=[];
  for(const loop of loops){
   assert.deepEqual(loop.points[0],loop.points.at(-1),loop.id+' closes');
   targets.push({id:loop.id,point:loop.points[0]});
   for(let i=1;i<loop.points.length;i++){
    const a=loop.points[i-1],b=loop.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);let prior=null;
    for(let j=0;j<=n;j++){
     const t=j/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=groundHeight(x,z),where=`${loop.id}: ${x.toFixed(2)},${z.toFixed(2)}`;
     if(!routeAt(x,z,.32))failures.push(where+' no ground');
     const blocked=hits(x,z,loop.radius);if(blocked.length)failures.push(where+' blocked by '+blocked.map(c=>c.id||'street fixture').join(','));
     if(prior!==null&&Math.abs(y-prior)>.24)failures.push(where+' floor step '+Math.abs(y-prior).toFixed(3));prior=y;
     if(loop.land)for(let k=0;k<8;k++)if(!onIslandLand(x+Math.cos(k*Math.PI/4)*loop.radius,z+Math.sin(k*Math.PI/4)*loop.radius)){failures.push(where+' outside shoreline');break;}
    }
   }
  }
  // The carriageway must fit the shore too; a clear pedestrian centreline cannot
  // excuse half a road extending into the sea. Its first approach is 2.6m, then 5m.
  for(let i=1;i<COAST_ROAD.length;i++){
   const a=COAST_ROAD[i-1],b=COAST_ROAD[i],radius=i===1?1.3:2.5,n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25);
   for(let j=0;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;
    if(hits(x,z,radius).length)failures.push(`coastal road ${x.toFixed(2)},${z.toFixed(2)} obstructed`);
    for(let k=0;k<8;k++)if(!onIslandLand(x+Math.cos(k*Math.PI/4)*radius,z+Math.sin(k*Math.PI/4)*radius)){failures.push(`coastal road ${x.toFixed(2)},${z.toFixed(2)} outside shore`);break;}
   }
  }
  assert.deepEqual([...new Set(failures)].slice(0,35),[],'full circuits and their reserved clear width');
  // Flood the actual scene at player-navigation resolution, testing midpoints too.
  // This verifies connectivity, rather than independently checking isolated loops.
  const cell=.5,minX=-64,minZ=-61,nx=451,nz=590,size=nx*nz,seen=new Uint8Array(size),known=new Uint8Array(size),heights=new Float32Array(size),queue=new Int32Array(size);
  const sample=k=>{if(known[k])return known[k]===1;const x=minX+k%nx*cell,z=minZ+Math.floor(k/nx)*cell,y=groundHeight(x,z);heights[k]=y;known[k]=routeAt(x,z,.32)&&!hits(x,z,.32).length?1:2;return known[k]===1;};
  const start=Math.round((18.5-minZ)/cell)*nx+Math.round((1.9-minX)/cell);assert.ok(sample(start));seen[start]=1;queue[0]=start;let tail=1;
  for(let at=0;at<tail;at++){
   const k=queue[at],ix=k%nx,iz=Math.floor(k/nx);
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(ix+dx<0||ix+dx>=nx||iz+dz<0||iz+dz>=nz)continue;const q=k+dx+dz*nx;if(seen[q]||!sample(q)||Math.abs(heights[q]-heights[k])>.24)continue;
    const x=minX+(ix+dx/2)*cell,z=minZ+(iz+dz/2)*cell;if(!routeAt(x,z,.32)||hits(x,z,.32).length)continue;
    seen[q]=1;queue[tail++]=q;
   }
  }
  for(const {id,point:[x,z]} of targets){let reachable=false;const ix=Math.round((x-minX)/cell),iz=Math.round((z-minZ)/cell);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(seen[(iz+dz)*nx+ix+dx])reachable=true;assert.ok(reachable,id+' circuit connects to Main Street');}
  const area=Math.abs(COASTLINE.reduce((n,p,i)=>{const q=COASTLINE[(i+1)%COASTLINE.length];return n+p[0]*q[1]-q[0]*p[1];},0))/2;
  assert.ok(area<12000,'shoreline is limited to the compact urban island');
 }finally{setWalkSurface(null);}
});
