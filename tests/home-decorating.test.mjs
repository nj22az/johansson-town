import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {HOME_CATALOGUE,homeFurnitureFactory,restoreHomeItems} from '../src/build/home-furniture.js';
import {createPlacements,footprint} from '../src/build/placements.js';
import {buildMayorHome,MAYOR_HOME_FLOOR} from '../src/world/interiors/town-hall.js';
import {restoreHomeDecor,setHomeDecor} from '../src/progression/home-decor.js';

installDOM();
const lookup=id=>HOME_CATALOGUE.find(f=>f.id===id)||null;
function home(){
 const room=new THREE.Group(),colliders=[];
 buildMayorHome({room,reg(){},action(){},collider:(x,z,w,d,height=2.8,minY=0)=>colliders.push({x,z,w,d,height,minY}),exit(){}});
 const group=room.getObjectByName('Mayor’s home');
 const placements=createPlacements({group,colliders,factory:homeFurnitureFactory(),walkable:MAYOR_HOME_FLOOR.walkable,heightAt:()=>0,doors:MAYOR_HOME_FLOOR.keepClear,lookup,needWhy:false});
 return {room,group,colliders,placements};
}

test('every home piece is real-sized, says what it is for, and its model fits the footprint it claims',()=>{
 const make=homeFurnitureFactory();
 for(const f of HOME_CATALOGUE){
  assert.ok(f.purpose.length>25,f.id);
  const {object}=make[f.id](0,0,0),size=new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  assert.ok(size.x<=f.size[0]+.06&&size.z<=f.size[1]+.06,f.id+' model '+size.toArray()+' within '+f.size);
  assert.ok(Math.abs(size.y-f.size[2])<.12,f.id+' height '+size.y+' is the claimed '+f.size[2]);
  assert.ok(new THREE.Box3().setFromObject(object).min.y>=-1e-6,f.id+' does not sink into the tatami');
 }
});

test('furniture goes on the open floor of the living room and the kitchen, never into a wall, the genkan or the existing furniture',()=>{
 const {placements}=home();
 assert.equal(placements.place({kind:'plant',x:-5.3,z:1.4}).ok,true,'a palm by the living room’s west wall');
 assert.match(placements.check({kind:'tansu',x:-1.1,z:2.5})[0],/ground/,'through the living room’s east wall');
 assert.match(placements.check({kind:'andon',x:.05,z:4.25})[0],/ground/,'in the genkan');
 assert.match(placements.check({kind:'side-table',x:-3.4,z:2.5})[0],/overlaps/,'on the low table');
 assert.match(placements.check({kind:'tansu',x:-1.6,z:2.25}).join(' '),/genkan|doorway|way to/,'in the hall’s doorway');
 assert.match(placements.check({kind:'cushion',x:-2.55,z:2.5}).join(' '),/way to/,'on a seat at the table');
 assert.match(placements.check({kind:'side-table',x:-3.8,z:-.7}).join(' '),/^$/,'by the dining table, on the kitchen’s open floor');
});

test('a rug lies on the floor under other furniture, and people walk over it',()=>{
 const {placements,colliders}=home(),n=colliders.length;
 assert.equal(placements.place({kind:'rug',x:-4.4,z:2}).ok,true);
 assert.equal(colliders.length,n,'the rug adds nothing to bump into');
 assert.equal(placements.place({kind:'side-table',x:-4.7,z:1.4}).ok,true,'a side table can stand on the rug');
});

test('arranged furniture is saved with the player, survives other decor choices, and bad saves are cleaned',()=>{
 const state={homeDecor:{wall:'harbour',items:[{id:'p1',kind:'plant',x:-5.3,z:1.4,yaw:0},{id:'p1',kind:'plant',x:0,z:0},{id:'p2',kind:'spaceship',x:0,z:0},{id:'p3',kind:'andon',x:'nope',z:0}]}};
 assert.deepEqual(restoreHomeItems(state.homeDecor.items).map(p=>p.id),['p1']);
 assert.equal(setHomeDecor(state,'textile','coral'),true);
 assert.deepEqual(state.homeDecor.items?.map(p=>p.id),['p1'],'changing the cushions keeps the furniture');
 assert.equal(restoreHomeDecor(state.homeDecor).wall,'harbour');
 const {placements}=home();assert.deepEqual(placements.load(restoreHomeItems(state.homeDecor.items).map(p=>({...p,note:''}))),[]);
});

test('the keep-clear squares sit on the open floor, so they protect real places',()=>{
 for(const [x,z,s] of MAYOR_HOME_FLOOR.keepClear)assert.ok(footprint({x,z,w:s,d:s}).some(([px,pz])=>MAYOR_HOME_FLOOR.walkable(px,pz))||MAYOR_HOME_FLOOR.walkable(x,z),[x,z].join());
});

test('indoors a piece must leave the 0.78 m way between the doors, the table and the television',async()=>{
 const {createPlacements:make}=await import('../src/build/placements.js'),{HOME_PASSAGE}=await import('../src/build/home-decorate.js');
 assert.equal(HOME_PASSAGE,.78,'the Japanese housing standard\'s 780 mm for the ways of daily life');
 const room=new THREE.Group(),colliders=[];
 buildMayorHome({room,reg(){},action(){},collider:(x,z,w,d,height=2.8,minY=0)=>colliders.push({x,z,w,d,height,minY}),exit(){}});
 const placements=make({group:room.getObjectByName('Mayor’s home'),colliders,factory:homeFurnitureFactory(),walkable:MAYOR_HOME_FLOOR.walkable,
  heightAt:()=>0,doors:MAYOR_HOME_FLOOR.keepClear,lookup,needWhy:false,passage:HOME_PASSAGE,passageOnLoad:false});
 // Rounded walking clearance fits the 0.81 m diagonal gap at the old spot.
 assert.deepEqual(placements.check({kind:'side-table',x:-1.9,z:1.4}),[],'the diagonal gap remains walkable');
 // Moving 0.1 m towards the low table reduces that gap to 0.73 m and blocks the way in from the hall.
 assert.match(placements.check({kind:'side-table',x:-2,z:1.4})[0],/less than 0\.78 m to walk past it/);
 // Against the west wall: out of everybody's way.
 assert.deepEqual(placements.check({kind:'side-table',x:-5.3,z:2.6}),[]);
 // A saved room where a side table already stands in the way is shown as it was, not hidden by the newer rule ...
 assert.deepEqual(placements.load([{id:'p1',kind:'side-table',x:-2,z:1.4,yaw:0,note:''}]),[]);
 // ... an Undo puts it back where it was ...
 assert.equal(placements.remove('p1'),true);assert.equal(placements.undo().ok,true);
 assert.equal(placements.list().length,1);
 // ... and moved anywhere, the rule applies again.
 assert.match(placements.move('p1',{x:-2,z:1.5}).problems[0],/0\.78 m/);
 assert.deepEqual(placements.move('p1',{x:-5.3,z:2.6}).ok,true);
 assert.equal(placements.move('p1',{x:-2,z:1.4}).ok,true,'its saved spot stays its own: it may go back there');
 // Turned there by float arithmetic (0.3 + 0.1 − 0.1 is not exactly 0.3), it is still its own spot.
 const turned=make({group:new THREE.Group(),colliders:colliders.filter(c=>!c.placementId),factory:homeFurnitureFactory(),walkable:MAYOR_HOME_FLOOR.walkable,
  heightAt:()=>0,doors:MAYOR_HOME_FLOOR.keepClear,lookup,needWhy:false,passage:HOME_PASSAGE,passageOnLoad:false});
 assert.deepEqual(turned.load([{id:'p7',kind:'side-table',x:-2,z:1.4,yaw:.3,note:''}]),[]);
 assert.equal(turned.move('p7',{yaw:(.3+.1)-.1}).ok,true);
});
