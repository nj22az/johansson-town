import {createColliderGrid} from '../src/world/collider-grid.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {planHeight,setWalkSurface} from '../src/world/layout.js';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {CAST} from '../src/people/cast.js';
import {canonicalDestination,canonicalStreetRoute} from '../src/people/canonical-day.js';
import {activeResidentHome} from '../src/people/home-directory.js';
import {groundHeight} from '../src/world/layout.js';
import {standingHitsRect,townBoundsBlocked,canStepBetween} from '../physics.js';
import {createNavigation} from '../src/people/navmesh.js';
installDOM();globalThis.self=globalThis;
const sites=createBusinesses(),world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const surface=createWalkSurface({minX:-45,maxX:50,minZ:-72,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
const grid=createColliderGrid(world.colliders);
const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
const nav=createNavigation(blocked,{step:.5});
let failures=0;
for(const p of CAST.filter(p=>!['Johansson','Thuan','Mr Fujita'].includes(p.name))){
 const h=activeResidentHome(p.name,{sites,landmarks:world.landmarks}).target,to=canonicalDestination(p.name,p.work);
 if(!to){console.log('NO TARGET',p.name,p.work);failures++;continue;}
 const at=[h.x,h.z],hit=world.colliders.filter(c=>standingHitsRect(to[0],to[1],.32,groundHeight(...to),c));
 const route=canonicalStreetRoute(nav,p.name,{x:at[0],z:at[1]},to);
 const arrived=route.length&&Math.hypot(route.at(-1)[0]-to[0],route.at(-1)[1]-to[1])<.4;
 if(arrived){let [x,z]=at;for(const [tx,tz] of route){const n=Math.max(1,Math.ceil(Math.hypot(tx-x,tz-z)/.07)),ax=x,az=z;for(let i=1;i<=n;i++){const px=ax+(tx-ax)*i/n,pz=az+(tz-az)*i/n;if(blocked(px,pz,.3)||!canStepBetween(groundHeight(x,z),groundHeight(px,pz)))throw Error(p.name+' obstructed route at '+[px,pz]);x=px;z=pz;}}}
 console.log(arrived?'OK':'BLOCKED',p.name,at,'->',to,route.length,hit.map(c=>c.id));if(!arrived)failures++;
}
process.exitCode=failures?1:0;
