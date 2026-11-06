import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createRoadNetwork,createTraffic,makeLane} from '../src/world/road-network.js';
import {createTownTraffic} from '../src/world/town-traffic.js';
import {createColliderGrid} from '../src/world/collider-grid.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';

function fixture(){
 const traffic=createTraffic(),g=new THREE.Group();
 const solid={id:'parked-vehicle',moving:true,x:1e6,z:1e6,w:1.48,d:3.4,height:2,yaw:0};
 const v=traffic.add({id:'test-kei',g,solid,width:1.48,length:3.4});
 const net=createRoadNetwork();net.add(makeLane('test',[[0,0,0],[0,0,20]],{speed:2}));
 return {traffic,v,grid:createColliderGrid([solid]),path:net.path(['test'])};
}
const hit=(grid,x,z,y=0,r=.28)=>grid.some(x,z,r,c=>standingHitsRect(x,z,r,y,c));
const follows=v=>{assert.equal(v.solid.x,v.g.position.x);assert.equal(v.solid.z,v.g.position.z);assert.equal(v.solid.yaw,v.g.rotation.y);};

test('a parked car blocks pedestrians on all four sides at every heading',()=>{
 const {traffic,v,grid}=fixture();
 for(const yaw of [0,Math.PI/4,Math.PI/2,Math.PI]){
  traffic.park(v,{x:12,y:0,z:-5,yaw});grid.refresh();follows(v);
  const toWorld=(x,z)=>[12+Math.cos(yaw)*x+Math.sin(yaw)*z,-5-Math.sin(yaw)*x+Math.cos(yaw)*z];
  assert.equal(hit(grid,12,-5),true);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const half=dx?v.width/2:v.length/2;
   assert.equal(hit(grid,...toWorld(dx*(half+.27),dz*(half+.27))),true,'body contact blocks');
   assert.equal(hit(grid,...toWorld(dx*(half+.31),dz*(half+.31))),false,'clear pavement stays clear');
  }
 }
});

test('the collider follows forward and reversing cars and leaves no wall in their old bay',()=>{
 for(const reverse of [false,true]){
  const {traffic,v,grid,path}=fixture();traffic.park(v,{x:12,y:0,z:-5,yaw:0});grid.refresh();
  traffic.drive(v,path,{reverse});follows(v);assert.equal(hit(grid,12,-5),false);
  for(let frame=0;frame<360;frame++){
   traffic.update(1/60);follows(v);
   assert.equal(hit(grid,v.g.position.x,v.g.position.z),true,'moving body blocks without waiting for grid.refresh');
  }
  assert.ok(v.s>5);traffic.finish(v);follows(v);assert.equal(hit(grid,0,20),true);
 }
});

test('held cars remain solid; hidden cars release their footprint and visible cars recover it',()=>{
 const {traffic,v,grid,path}=fixture();traffic.drive(v,path);grid.refresh();v.hold=true;
 traffic.update(.1);assert.equal(v.speed,0);assert.equal(hit(grid,0,0),true);
 v.g.visible=false;traffic.update(0);assert.equal(hit(grid,0,0),false);
 v.g.visible=true;traffic.update(0);assert.equal(hit(grid,0,0),true);
});

test('a car on a raised deck blocks that deck, not pedestrians underneath it',()=>{
 const {traffic,v,grid}=fixture();traffic.park(v,{x:0,y:4,z:0,yaw:0});grid.refresh();
 assert.equal(v.solid.minY,4);assert.equal(hit(grid,0,0,4),true);assert.equal(hit(grid,0,0,0),false);
 assert.equal(hit(grid,0,0,6.1),false);
 // Ferry attachment can move the root between road trips.
 v.g.position.set(30,5,40);v.g.rotation.y=.8;traffic.update(0);follows(v);
 assert.equal(hit(grid,30,40,5),true);assert.equal(hit(grid,0,0,4),false);
});

test('the dynamic broad phase follows a collider between cells in the same frame',()=>{
 const c={x:0,z:0,w:2,d:4,moving:true},grid=createColliderGrid([c]);grid.refresh();
 assert.ok(grid.near(0,0,.3).includes(c));c.x=25;c.z=-13;
 assert.ok(grid.near(25,-13,.3).includes(c));assert.ok(!grid.near(0,0,.3).includes(c));
 c.x=c.z=1e6;assert.ok(!grid.near(25,-13,.3).includes(c));
 c.x=40;c.z=42;assert.ok(grid.near(40,42,.3).includes(c));
});

test('moving traffic does not rebuild the town static collider grid every frame',()=>{
 const car={x:0,z:0,w:2,d:4,moving:true},wall={x:5,z:5,w:2,d:2};
 const grid=createColliderGrid([car,wall]);grid.refresh();
 const OriginalMap=globalThis.Map;let rebuilds=0;
 globalThis.Map=class extends OriginalMap{constructor(...args){super(...args);rebuilds++;}};
 try{for(let i=0;i<40;i++){car.x=i;car.yaw=i*.1;grid.refresh();assert.ok(grid.near(i,0,.3).includes(car));}}finally{globalThis.Map=OriginalMap;}
 assert.equal(rebuilds,0);
});

test('Tetsuo keeps a solid kei truck throughout his actual town departure',()=>{
 installDOM();const parent=new THREE.Group(),g=new THREE.Group(),colliders=[];parent.add(g);g.position.set(-30,0,30);
 const people=[{g,profile:{name:'Tetsuo'}}],cars=createTownTraffic({parent,colliders,people:()=>people}),v=cars.islanders[0];
 const grid=createColliderGrid(colliders);grid.refresh();const old=v.g.position.clone();
 assert.equal(hit(grid,old.x,old.z,old.y),true);cars.update(1/60,4*1440+7*60+19);assert.ok(v.trip);
 assert.equal(g.userData.inVehicle,v.id);
 for(let i=0;i<400;i++){cars.update(1/60,4*1440+7*60+19);follows(v);assert.equal(hit(grid,v.g.position.x,v.g.position.z,v.g.position.y),true);}
 assert.ok(v.g.position.distanceTo(old)>3,'the truck actually left the bay');
 cars.reconcileAbsent();follows(v);assert.equal(g.userData.inVehicle,undefined);assert.equal(hit(grid,old.x,old.z,old.y),true);
});

test('the actual prompt selector excludes a driver but still offers ordinary conversations and car inspection',()=>{
 const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const interaction=source.slice(source.indexOf('function interaction(){'),source.indexOf('function standUp(){'));
 assert.ok(interaction.startsWith('function interaction(){'));
 const prompt={textContent:'',classList:{add(){},remove(){}}},g=new THREE.Group();g.position.set(0,1,0);g.userData.hit={label:'Talk to Tetsuo',fn(){}};
 const context={THREE,pocket:null,seated:false,current:null,active:null,player:{position:new THREE.Vector3(0,0,2)},yaw:0,touch:true,interactables:[g],welcomeAtCounter(){},$:()=>prompt};
 g.userData.inVehicle='owned-car-1';runInNewContext(interaction+'; interaction();',context);assert.equal(context.active,null,'a seated driver must not receive a street conversation');
 delete g.userData.inVehicle;runInNewContext('interaction();',context);assert.equal(context.active.label,'Talk to Tetsuo');
 g.userData.hit.label='Inspect Tetsuo’s kei truck';runInNewContext('interaction();',context);assert.equal(context.active.label,'Inspect Tetsuo’s kei truck');
});

test('clicking a seated driver cannot open a conversation or walk into the cab',()=>{
 const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const start=source.indexOf("canvas.addEventListener('click',event=>{");
 const end=source.indexOf("document.addEventListener('mousemove'",start);
 const handler=source.slice(start,end);assert.ok(start>0&&end>start);
 const driver=new THREE.Group();let talked=0,walked=0,clicked;
 driver.userData.hit={label:'Talk to Tetsuo',fn(){talked++;}};driver.userData.inVehicle='owned-car-1';
 const mesh=new THREE.Object3D();driver.add(mesh);
 class Raycaster{setFromCamera(){}intersectObjects(){return [{object:mesh,distance:1,point:new THREE.Vector3()}];}}
 const ctx={ferryExploreActive:()=>false,THREE:{...THREE,Raycaster},canvas:{addEventListener(type,fn){clicked=fn;},getBoundingClientRect(){return {left:0,top:0,width:500,height:500};}},controlsAllowed:()=>true,touchSticks:{suppressClick:()=>false},spawnScene:null,pocket:null,seated:false,current:null,active:null,yaw:0,scene:{children:[]},player:{position:new THREE.Vector3()},camera:{position:new THREE.Vector3()},interactables:[driver],pointWalk:{cancel(){},walk(){walked++;return true;}}};
 runInNewContext(handler,ctx);clicked({button:0,clientX:250,clientY:250});
 assert.equal(talked,0);assert.equal(walked,0);
 delete driver.userData.inVehicle;clicked({button:0,clientX:250,clientY:250});assert.equal(talked,1,'ordinary walking resident remains clickable');
});
