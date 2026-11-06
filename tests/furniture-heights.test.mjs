import {readFile} from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {IZAKAYA_PLAYER_SEATS} from '../src/people/izakaya-beer.js';
import {SATO_COUNTER,SATO_LEDGE,SATO_CORNER} from '../src/world/sato-ramen-layout.js';
import {MINATO_COMPACT} from '../src/world/interiors/minato-compact-plan.js';
import {buildOfficeShell,buildOfficeWorkplace} from '../src/world/interiors/office-workplace.js';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {buildPortHall} from '../src/world/interiors/port-hall.js';
import {buildOnsenInterior} from '../src/world/interiors/onsen.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {SAKURA_LAYOUT,BUN_STEAMER,SAKURA_SHELVES} from '../src/world/interiors/sakura-layout.js';
import {SAKURA_COUNTER} from '../src/world/interiors/sakura-shell.js';
import {SAKURA_EQUIPMENT} from '../src/world/interiors/sakura-counter-detail.js';
import {FURNITURE_HEIGHTS,TILL_TOP} from '../src/world/furniture-standards.js';
import {measure} from '../src/avatars/build.js';
import {CAST_RECIPES,NEIGHBOUR_RECIPES} from '../src/avatars/cast.js';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';

async function shop(){
 installDOM();
 const room=new THREE.Group(),display=buildSakuraInterior({room,reg(){},action(){},exit(){}});
 await display.ready();room.updateMatrixWorld(true);return {room,display};
}
const bounds=(room,pattern)=>{const b=new THREE.Box3();room.traverse(o=>{if(o.isMesh&&pattern.test(o.name))b.union(new THREE.Box3().setFromObject(o));});return b;};

// Use the actual actor proportions, including maker extremes, to guard against solving
// visibility by raising the clerk or shrinking their head when someone covers the till.
test('the lowered checkout leaves every adult cast face visible from the customer floor',async()=>{
 const {room,display}=await shop(),fixtures=[];
 room.traverse(o=>{if(o.isMesh&&!(Array.isArray(o.material)?o.material:o.material?[o.material]:[]).some(m=>m.transparent))fixtures.push(o);});
 const recipes=Object.values({...CAST_RECIPES,...NEIGHBOUR_RECIPES}).filter(r=>['adult','elder'].includes(r.age));
 for(const age of ['adult','elder'])for(const proportion of ['classic','rounded'])for(const form of PARTS.head)
  recipes.push(normalizeRecipe({name:'Custom '+age+' '+proportion+' '+form,age,body:{height:0,proportion},head:{size:1,form}}));
 const shortest=Math.min(...recipes.map(r=>measure(r).headCentre)),[cx,cy,cz]=SAKURA_LAYOUT.checkout,[sx,sy,sz]=SAKURA_LAYOUT.staff;
 assert.equal(cy,0);assert.equal(sy,0);
 const ray=new THREE.Raycaster(),from=new THREE.Vector3(cx,cy+shortest,cz);
 for(const recipe of recipes){
  const target=new THREE.Vector3(sx,sy+measure(recipe).headCentre,sz),direction=target.clone().sub(from);
  ray.set(from,direction.clone().normalize());ray.far=direction.length()-.001;
  const blocked=ray.intersectObjects(fixtures,false);assert.equal(blocked.length,0,recipe.name+' is hidden behind '+blocked[0]?.object.name);
 }
 for(const recipe of Object.values({...CAST_RECIPES,...NEIGHBOUR_RECIPES}).filter(r=>['adult','elder'].includes(r.age)))
  assert.ok(measure(recipe).shoulderY>FURNITURE_HEIGHTS.serviceCounter,recipe.name+' shoulders are behind the counter');
 display.dispose();
});

test('the counter, its collider, mounted goods and low till share their physical support heights',async()=>{
 const {room,display}=await shop(),counter=room.getObjectByName('sakura-counter');assert.ok(counter);
 const ray=new THREE.Raycaster(new THREE.Vector3(4.8,2,.75),new THREE.Vector3(0,-1,0));
 const support=ray.intersectObject(counter,true)[0];assert.ok(support);
 assert.ok(Math.abs(support.point.y-FURNITURE_HEIGHTS.serviceCounter)<1e-6);
 assert.ok(Math.abs(SAKURA_COUNTER.top-support.point.y)<1e-6);
 const collider=SAKURA_LAYOUT.colliders.find(c=>c.x===4.8&&c.z===1.97);assert.equal(collider.height,SAKURA_COUNTER.top);
 const equipment=room.getObjectByName('Sakura checkout equipment'),R=SAKURA_EQUIPMENT.register,register=[];
 equipment.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){
  const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
  if(v.x>=R.minX-.02&&v.x<=R.maxX+.02&&v.z>=R.minZ-.02&&v.z<=R.maxZ+.02)register.push(v);
 }}});
 assert.ok(register.length>100,'the real register geometry is missing');
 assert.ok(Math.abs(Math.min(...register.map(v=>v.y))-SAKURA_COUNTER.top)<1e-6,'the till floats');
 assert.ok(Math.max(...register.map(v=>v.y))<=TILL_TOP+1e-6,'the till exceeds the shared equipment height');
 assert.equal(BUN_STEAMER.top,SAKURA_COUNTER.top);
 assert.deepEqual(SAKURA_SHELVES.bun.levels,[BUN_STEAMER.top+.03,BUN_STEAMER.top+.23]);
 for(const [pattern,lift] of [[/^Charity box$/ ,0],[/^Sakura hot case$/,0],[/^Sakura oden pot$/,0],[/shop flyer/,.015]]){
  const b=bounds(room,pattern);assert.ok(!b.isEmpty(),pattern+' geometry is missing');
  assert.ok(Math.abs(b.min.y-(SAKURA_COUNTER.top+lift))<.001,pattern+' lost its counter support');
 }
 const cat=room.getObjectByName('Maneki_neko_Colorful');assert.equal(cat.position.y,SAKURA_COUNTER.top);
 display.dispose();
});

test('all exported Minato and ramen dining places meet their seat and tabletop surfaces',async()=>{
 // The fitted room this runtime loads (src/world/izakaya.js reads minato-interior-compact.glb, built from
 // art/izakaya/compact/plan.json); its new counter surface is tested with the full three-piece assembly in
 // izakaya-backbar.test.mjs. The compact export carries textures, so the loader needs a browser's self and bitmaps.
 const bytes=await readFile(new URL('../assets/models/izakaya/minato-interior-compact.glb',import.meta.url));
 const previous={self:globalThis.self,bitmap:globalThis.createImageBitmap};
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:4,height:4,close(){}});
 let root;try{root=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;}
 finally{globalThis.self=previous.self;globalThis.createImageBitmap=previous.bitmap;}
 root.updateMatrixWorld(true);
 const places=[...Object.values(IZAKAYA_PLAYER_SEATS),...SATO_COUNTER,...SATO_LEDGE,...SATO_CORNER];
 for(const seat of places){
  const [x,,z]=seat.position,actual=surface(root,x,z,seat.surfaceY+.02);
  assert.ok(Math.abs(actual-seat.surfaceY)<.002,'Seat floats at '+[x,z]+': '+actual);
 }
 // The booth table, the izakaya counter, the ramen counter and the ramen ledge, where the plan puts them.
 const {booth,counter,ramenCounter,ramenLedge}=MINATO_COMPACT;
 for(const [x,z,y] of [[booth.position[0],booth.position[2],FURNITURE_HEIGHTS.table],[booth.position[0]-booth.tableWidth/2+.1,booth.position[2],FURNITURE_HEIGHTS.table],[booth.position[0]+booth.tableWidth/2-.1,booth.position[2],FURNITURE_HEIGHTS.table],
  [counter.position[0],counter.position[2],FURNITURE_HEIGHTS.serviceCounter],[ramenCounter.position[0],ramenCounter.position[2],FURNITURE_HEIGHTS.serviceCounter],[ramenLedge.position[0],ramenLedge.position[2],FURNITURE_HEIGHTS.serviceCounter]])
  assert.ok(Math.abs(surface(root,x,z,y+.018)-y)<.002,'Dining surface differs from props and reach targets at '+[x,z]);
 // A covering resident keeps their face above the complete fitted counter, shelves and pots.
 const cast=Object.values({...CAST_RECIPES,...NEIGHBOUR_RECIPES}).filter(r=>['adult','elder'].includes(r.age)),shortest=Math.min(...cast.map(r=>measure(r).headCentre));
 // From the guests' side of each counter to where the cook works: Thao at the grill, Mrs Sato at her pots.
 const {kitchenStations,counterStandZ,ramenStaff,ramenStandZ}=MINATO_COMPACT;
 for(const [cx,cz,sx,sz] of [[kitchenStations.grill[0],counterStandZ,kitchenStations.grill[0],kitchenStations.grill[2]],[ramenStaff.pots[0],ramenStandZ,ramenStaff.pots[0],ramenStaff.pots[1]]])for(const recipe of cast){
  const from=new THREE.Vector3(cx,shortest,cz),to=new THREE.Vector3(sx,measure(recipe).headCentre,sz),dir=to.clone().sub(from),ray=new THREE.Raycaster(from,dir.clone().normalize(),0,dir.length()-.001);
  assert.equal(ray.intersectObject(root,true).filter(h=>!h.object.material.transparent).length,0,'A covering resident is hidden behind the dining counter');
 }
});

function surface(root,x,z,from){
 const ray=new THREE.Raycaster(new THREE.Vector3(x,from,z),new THREE.Vector3(0,-1,0));
 const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const found=ray.intersectObjects(meshes,false).find(h=>!h.object.material?.transparent);assert.ok(found,'Missing physical furniture at '+[x,z]);return found.point.y;
}

test('authored office, bookshop, bath and ticket desks keep props and colliders on shared surfaces',()=>{
 installDOM();
 const args=room=>({room,reg(){},action(){},collider(){},exit(){}});
 const office=new THREE.Group();buildOfficeShell(office);buildOfficeWorkplace(args(office));office.updateMatrixWorld(true);
 for(const [x,z] of [[.7,-2.7],[-.9,.8]])assert.ok(Math.abs(surface(office,x,z,FURNITURE_HEIGHTS.table+.02)-FURNITURE_HEIGHTS.table)<.002);
 const bookshop=new THREE.Group();buildCompactShop({...args(bookshop),site:{id:'frontrow',title:'Bookshop',bookshop:true}});bookshop.updateMatrixWorld(true);
 for(const [x,z,y] of [[-2.55,2.12,FURNITURE_HEIGHTS.serviceCounter],[2.15,.4,FURNITURE_HEIGHTS.table],[-2.55,-2.6,FURNITURE_HEIGHTS.table]])
  assert.ok(Math.abs(surface(bookshop,x,z,y+.02)-y)<.002);
 const hall=new THREE.Group(),hallLayout=buildPortHall(args(hall));hall.updateMatrixWorld(true);
 assert.ok(Math.abs(surface(hall,.6,hallLayout.bounds.minZ+.55,FURNITURE_HEIGHTS.serviceCounter+.02)-FURNITURE_HEIGHTS.serviceCounter)<.002);
 const bath=new THREE.Group(),display=buildOnsenInterior(args(bath));bath.updateMatrixWorld(true);
 assert.ok(Math.abs(surface(bath,-4.05,2.9,FURNITURE_HEIGHTS.serviceCounter+.02)-FURNITURE_HEIGHTS.serviceCounter)<.002);display.dispose?.();
});
