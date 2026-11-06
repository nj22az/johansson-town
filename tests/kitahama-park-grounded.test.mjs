import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {KITAHAMA} from '../src/world/kitahama-layout.js';
import {KITAHAMA_PARK,KITAHAMA_DRINKS} from '../src/world/okinawa/kitahama-quarter.js';

/**
 * The owner, 20 October 2026, from the Kitahama pocket park on his phone: the drinks machines stood loose on the lawn,
 * and "there are floating artefacts" (the sandpit, the fence's rail, the park's sign). Everything here stands on the
 * ground: a ray up from under the ground at each foot meets the thing itself before it is 2 cm above the ground, and the
 * machines stand with their backs to the Heights' wall, on the lane, not in the park.
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);
const meshes=[];world.group.traverse(o=>{if(o.isMesh&&o.visible!==false)meshes.push(o);});
const P=KITAHAMA.park,ground=KITAHAMA.y;
/** The height of the lowest surface over (x, z), seen from under the ground. */
function footAt(x,z){const ray=new THREE.Raycaster(new THREE.Vector3(x,ground-.5,z),new THREE.Vector3(0,1,0),0,4);const hit=ray.intersectObjects(meshes,false)[0];return hit?hit.point.y:Infinity;}

test('the park’s fence posts, sandpit and sign stand on the ground',()=>{
 const feet=[],F=KITAHAMA_PARK.fence;
 const run=(ax,az,bx,bz)=>{const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/F.spacing));for(let i=0;i<=n;i++)feet.push(['fence post',ax+(bx-ax)*i/n,az+(bz-az)*i/n]);};
 run(P.minX,P.minZ,P.maxX,P.minZ);run(P.minX,P.minZ,P.minX,P.maxZ);run(P.maxX,P.minZ,P.maxX,P.minZ+5.5);
 const S=KITAHAMA_PARK.sandpit;
 for(const [x,z] of [[S.x0,S.z0],[S.x1,S.z0],[S.x0,S.z1],[S.x1,S.z1]])feet.push(['sandpit kerb',P.minX+x+(x===S.x0?.05:-.05),P.maxZ-z+(z===S.z0?-.05:.05)]);
 feet.push(['sandpit sand',P.minX+(S.x0+S.x1)/2+.3,P.maxZ-(S.z0+S.z1)/2]);
 const G=KITAHAMA_PARK.sign;for(const dz of [-G.w/2+.04,G.w/2-.04])feet.push(['park sign post',P.maxX+G.out-.04,P.minZ+G.along+dz]);
 const floating=feet.map(([what,x,z])=>({what,x:+x.toFixed(2),z:+z.toFixed(2),foot:footAt(x,z)})).filter(f=>!(f.foot<=ground+.02));
 assert.deepEqual(floating,[]);
 assert.ok(feet.length>=20);
});

test('the drinks machines stand against the Heights’ wall on the lane, their bin beside them, none in the park',()=>{
 const machines=world.colliders.filter(c=>c.id==='vending'&&c.x>-36&&c.x<-4&&c.z>24&&c.z<50);
 assert.equal(machines.length,KITAHAMA_DRINKS.machines.length,'two machines on Fukugi Lane');
 const wall=world.colliders.find(c=>c.id==='block-wall'&&Math.abs(c.x+24)<.01&&c.z>42&&c.z<45);
 assert.ok(wall,'the Heights’ front wall north of house A’s gate');
 for(const m of machines){
  const back=m.x-m.w/2,face=wall.x+wall.w/2;
  assert.ok(back-face>=0&&back-face<.06,`a machine’s back is a cord’s width off the wall (${(back-face).toFixed(3)} m)`);
  assert.ok(m.z-m.d/2>=wall.z-wall.d/2-.01&&m.z+m.d/2<=wall.z+wall.d/2+.01,'along the wall, not past its end or in the gate');
  assert.ok(!(m.x>P.minX&&m.x<P.maxX&&m.z>P.minZ&&m.z<P.maxZ),'not in the park');
  assert.ok(footAt(m.x,m.z)<=ground+.06,'standing on its pad on the ground');
 }
 const bin=world.colliders.find(c=>c.id==='kitahama-can-bin');assert.ok(bin&&Math.abs(bin.x-machines[0].x)<.3,'the can bin at their end');
 assert.ok(footAt(bin.x,bin.z)<=ground+.02,'the bin on the ground');
 // The feed: from house A's front wall over the block wall to the machines' backs.
 const F=KITAHAMA_DRINKS.feed;assert.ok(F.why&&F.socket[0]<F.wallIn&&F.wallIn<F.wallOut);
 assert.ok(KITAHAMA_DRINKS.why.length>40);
});
