import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {WEST_SHORE,westShorePath,westShoreRail,westShoreSolids,westShoreCovers,sweepProfile,buildWestShore} from '../src/world/west-shore.js';
import {NISHI} from '../src/world/okinawa/layout.js';
import {ISLAND_COAST} from '../src/world/island-plan.js';
import {COASTLINE} from '../src/world/island-coast.js';
import {onIslandLand} from '../src/world/coastal-ground.js';
import {neighbourhoodHeight} from '../src/world/neighbourhood-ground.js';
import {GROUND_LAYER} from '../src/world/ground-layers.js';
import {createKit} from '../src/world/okinawa/kit.js';

/**
 * The west-shore bank (west-shore.js): the ground north of the Nishi seawall ends at a coral-stone coping on the
 * coast line, pitched down to a strip of sand, with the town's chain bollards along the top, and the buried garden
 * ground that used to lie under the shore is gone.
 */
const S=WEST_SHORE,STEP=.24;

test('the bank runs from the quarter’s end to the coast’s corner, on the coast line, with a reason for every part',()=>{
 assert.equal(S.fromZ,NISHI.maxZ,'it begins where the quarter’s ground ends');
 assert.deepEqual([S.coast,S.cornerZ],ISLAND_COAST[1],'it ends at the coast’s north-west corner');
 assert.equal(S.edge-S.profile.coping.points.at(-1)[0],S.coast,'the coping’s outer edge is the coast line');
 const top=S.profile.coping.points[1][1],sand=S.profile.sand.points[0][1];
 assert.ok(top-sand>STEP,'the drop from the coping to the sand is more than a step, so there is a rail');
 for(const part of Object.values(S.profile))assert.ok(part.why.length>20,'each part says why');
 assert.ok(S.rail.why&&S.stones.why);
 assert.deepEqual(westShorePath(),[[S.edge,S.fromZ],[S.edge,S.cornerZ-.4],[S.returnToX,S.cornerZ-.4]]);
 const rail=westShoreRail();assert.equal(rail.length,6,'the rail turns the corner with the coping');
 assert.ok(rail[0]>S.edge&&rail[0]<S.edge+.4,'the posts stand on the verge inside the coping');
 for(const c of westShoreSolids())for(const [dx,dz] of [[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]])assert.ok(onIslandLand(c.x+dx*c.w,c.z+dz*c.d)||Math.abs(c.x+dx*c.w-S.coast)<.02,c.id+' stands on land');
 assert.ok(westShoreCovers(S.coast,50)&&westShoreCovers(S.coast-1,70)&&westShoreCovers(-38.5,S.cornerZ),'the coast line along the run and the return is the bank’s');
 assert.ok(!westShoreCovers(S.coast,20)&&!westShoreCovers(-30,S.cornerZ)&&!westShoreCovers(-38,50),'the seawall’s shore, the north shore beyond the end block and the verge are not');
});

test('the neighbourhood’s ground is level to the coping along the bank and slopes as before elsewhere',()=>{
 for(let z=S.level.minZ;z<=S.level.maxZ;z+=2.5)for(const x of [S.edge,-39,-38.5,-38,-37])assert.equal(neighbourhoodHeight(x,z),0,'level ground at '+[x,z]);
 assert.ok(neighbourhoodHeight(-39.5,S.level.maxZ+8)===null||neighbourhoodHeight(-39.5,S.level.maxZ+8)<0,'north of the corner the margin slopes');
 assert.ok(neighbourhoodHeight(-39.5,S.level.minZ-2)<0,'south of the quarter’s end the margin slopes as before (under the quarter’s own slabs)');
 assert.ok(neighbourhoodHeight(-41,50)<0,'beyond the coast line the margin still falls away');
});

test('a profile swept along a path with a corner keeps every face flat, outward and mitred',()=>{
 const g=sweepProfile([[0,0],[0,10],[5,10]],[[0,0],[0,1],[1,1],[2,0]],{caps:[[0,-1]]});
 const p=g.attributes.position,n=g.attributes.normal;let up=0,seaward=0;
 for(let i=0;i<p.count;i+=3){
  const ny=n.getY(i);if(p.getY(i)===1&&p.getY(i+1)===1&&p.getY(i+2)===1){assert.ok(ny>.99,'the top faces up');up++;}
  if(p.getY(i)===0&&Math.abs(p.getX(i)+2)<1e-6)seaward++;
 }
 assert.ok(up>=4&&seaward>0);
 // The mitred corner carries the outer edge round: at d 1 the corner vertex lies at (-1, 11).
 let corner=false;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)+1)<1e-6&&Math.abs(p.getZ(i)-11)<1e-6&&p.getY(i)===1)corner=true;
 assert.ok(corner,'the profile turns the corner on its mitre');
});

test('the bank itself is a few hundred triangles',()=>{
 installDOM();const kit=createKit();kit.surface('coral',{map:null,metres:1.6});kit.surface('sand',{map:null,metres:3.2});
 const colliders=[];buildWestShore(kit,c=>colliders.push(...[].concat(c)),{});
 const {meshes}=kit.finish(new THREE.Group(),'bank');
 const triangles=meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);
 assert.ok(triangles<500,'triangles: '+triangles);
 assert.deepEqual(colliders.map(c=>c.id),['west-shore-coping','west-shore-coping-return']);
});

test('in the town: the ground meets the coping, the chain stands on the verge, the walk is open, and nobody steps off',async()=>{
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js?west-shore');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const {routeAt,groundHeight,planHeight,setWalkSurface}=await import('../src/world/layout.js');
 const {createWalkSurface}=await import('../src/world/walk-surface.js');
 const labels=[];
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),
  mobile:false,shadows:false,register:(o,label,fn)=>labels.push({label,fn,o}),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 assert.equal(world.group.getObjectByName('Continuous neighbourhood garden ground'),undefined,'the buried garden ground mesh is gone');
 const surface=createWalkSurface({minX:-45,maxX:-30,minZ:25,maxZ:80,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 try{
  const blocked=(x,z,r=.32)=>!routeAt(x,z,r)||world.colliders.some(c=>circleHitsRect(x,z,r,c));
  // The drawn ground along the verge and the walk is the ground the game walks on.
  const surfaces=[];world.group.traverse(o=>{if(o.isMesh&&(/^Okinawan quarter:(matte|sand|coral)\||^West-shore |Compact neighbourhood ground/.test(o.name)||o.parent?.name==='Walks'||o.parent?.name==='Quarter ground'&&!o.userData.groundMarking))surfaces.push(o);});
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  for(let z=S.fromZ+.5;z<=S.cornerZ-.6;z+=1.3)for(const x of [-39.5,-39.2,-38.9,-38.5,-38,-37.5,-37,-36.5]){
   ray.set(new THREE.Vector3(x,2,z),down);const hit=ray.intersectObjects(surfaces,false)[0];
   assert.ok(hit,'drawn ground at '+[x,z]);assert.ok(Math.abs(hit.point.y-groundHeight(x,z))<.012,'walking height disagrees with the drawn ground at '+[x,z]+': '+hit.point.y+' / '+groundHeight(x,z));
   assert.equal(planHeight(x,z),0,'level ground at '+[x,z]);
  }
  // Across the bank from the verge to the water: the coping, the pitching and the sand strip, at the designed heights.
  for(const z of [31,45,60,S.cornerZ-.6]){
   const at=x=>{ray.set(new THREE.Vector3(x,2,z),down);return ray.intersectObjects(surfaces,false)[0];};
   assert.ok(Math.abs(at(S.coast+.2).point.y-.12)<.001,'the coping at z='+z);
   const face=at(S.coast-.35).point.y;assert.ok(face<0&&face>-.4,'the pitching at z='+z+': '+face);
   const toe=at(S.coast-1.3).point;assert.ok(toe.y>-.66&&toe.y<.2,'the sand strip or a stone on it at z='+z+': '+toe.y);
  }
  // The coping is solid and the coast's own stone and boulders are left off behind it.
  const coping=world.colliders.filter(c=>c.id?.startsWith('west-shore-coping'));assert.equal(coping.length,2);
  assert.ok(blocked(S.coast+.2,50,.2)&&blocked(-38.5,S.cornerZ-.2,.2),'the coping stops you');
  const rocks=world.group.getObjectByName('Rocky island shore'),m=new THREE.Matrix4(),p=new THREE.Vector3();
  for(let i=0;i<rocks.count;i++){rocks.getMatrixAt(i,m);p.setFromMatrixPosition(m);assert.ok(!westShoreCovers(p.x,p.z),'a boulder inside the bank at '+[p.x.toFixed(1),p.z.toFixed(1)]);}
  const wall=world.group.getObjectByName('Coastal retaining stone').geometry.attributes.position;
  for(let i=0;i<wall.count;i++)assert.ok(!(Math.abs(wall.getX(i)-S.coast)<1e-6&&wall.getZ(i)>S.fromZ+.3&&wall.getZ(i)<S.cornerZ-.01),'retaining stone drawn inside the bank at z='+wall.getZ(i));
  // The chain bollards: one every spacing along the verge, round the corner, none twice, none on the walk.
  const posts=world.colliders.filter(c=>c.id==='chain-bollard'&&c.z>S.fromZ&&c.x<-37);
  assert.ok(posts.length>=20,'posts along the bank: '+posts.length);
  assert.equal(new Set(posts.map(c=>c.x.toFixed(2)+','+c.z.toFixed(2))).size,posts.length,'no post stands twice');
  assert.ok(posts.some(c=>Math.abs(c.x-(S.returnToX-.1))<.01),'the rail ends at the end block');
  for(const c of posts)assert.ok(!routeAt(c.x,c.z,0)||routeAt(c.x,c.z,0).id!=='island-coast-walk','a post on the walk at '+[c.x,c.z]);
  // The coast walk and the verge beside it stay open the whole way, and the sea is still the sea.
  for(let z=S.fromZ+1;z<=75;z+=1.5){assert.ok(!blocked(-37,z),'the coast walk is blocked at z='+z);assert.ok(!blocked(-38.6,z,.2),'the verge is blocked at z='+z);}
  for(const z of [35,55,75])assert.ok(!routeAt(S.coast-.2,z,.32),'you can walk off the bank at z='+z);
  assert.ok(labels.some(l=>l.label==='Look over the bank'),'the bank can be looked over');
 }finally{setWalkSurface(null);}
});
