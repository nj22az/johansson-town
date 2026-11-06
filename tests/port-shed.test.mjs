import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildPortShed,PORT_SHED,SHED_PIER,tvProgramme} from '../src/world/port-shed.js';
import {fujitaBeer} from '../src/world/fujita-day.js';
import {shoeHeight,seatContactHeight} from './seating-contact.mjs';
import {updateAvatarActor} from '../src/avatars/actors.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';
installDOM();

test('the television picture is clear through its open bezel',()=>{
 const shed=buildPortShed({parent:new THREE.Group(),colliders:[],register(){},onAction(){}});
 try{
  const screen=shed.group.getObjectByName('Television screen');
  shed.group.updateMatrixWorld(true);
  const centre=screen.getWorldPosition(new THREE.Vector3());
  for(const [x,y] of [[0,0],[-.17,-.12],[.17,.12],[-.17,.12],[.17,-.12]]){
   const ray=new THREE.Raycaster(new THREE.Vector3(centre.x+x,centre.y+y,centre.z+.4),new THREE.Vector3(0,0,-1));
   const hit=ray.intersectObjects(shed.group.children,true)[0];
   assert.equal(hit?.object,screen,'the picture is the first visible surface');
  }
 }finally{shed.dispose();}
});

test('Mr Fujita’s shed: an evening of channels flipping and a glass in his hand after he signs off, nothing while he is the master on watch, the pier left open',()=>{
 const parent=new THREE.Group(),colliders=[],hits=[];
 const shed=buildPortShed({parent,colliders,register:(o,label,fn)=>hits.push({o,label,fn}),onAction(){}});
 assert.ok(hits.some(h=>h.label==='Talk to Mr Fujita'));assert.ok(hits.some(h=>h.label==='Watch the shed television'));
 assert.ok(['baseball','variety','drama','cooking','news'].includes(tvProgramme(23*60+40)));assert.equal(tvProgramme(2*60),'off');
 // On watch (06:05–23:15, ferry-crew.js FERRY_WORKING_DAY, to the last boat back from Kitano-jima): the set is off and nothing is open. Signed off: the first bottle.
 assert.equal(tvProgramme(15*60),'off');assert.equal(fujitaBeer(15*60).phase,'waiting');assert.equal(fujitaBeer(15*60).tipsy,0);
 shed.tick(.1,15*60);assert.ok(!['SitHold','SitPour'].includes(shed.fujita.userData.socialPose));assert.equal(shed.fujita.userData.heldItem,undefined);
 shed.tick(.1,23*60+40);assert.ok(['SitHold','SitPour'].includes(shed.fujita.userData.socialPose));assert.equal(shed.fujita.userData.heldItem,'bottle');
 assert.ok(shed.fujita.userData.heldPortion>=0&&shed.fujita.userData.heldPortion<=1,'his glass has a level');
 // At night he has put the glass down and gone aboard Shiosai.
 shed.tick(.1,3*60);assert.equal(shed.fujita.userData.heldItem,undefined);assert.notEqual(shed.fujita.userData.socialPose,'SitHold');
 assert.equal(tvProgramme(1440+35),'snow');shed.tick(.1,1440+35);
 // The empties: none when the van has been, the evening's by the time the set goes off.
 const empties=()=>shed.group.children.find(o=>o.name==='Empty Umineko bottles').count;
 shed.tick(.1,6*60+10);assert.equal(empties(),0);shed.tick(.1,23*60);assert.equal(empties(),0,'nothing before he signs off');shed.tick(.1,1440+44);assert.ok(empties()>=3,'the evening’s bottles round him');
 // The walk along the pier past the open front stays clear.
 // (along the platform, between its south and north rails: off its ends is the sea)
 for(let z=SHED_PIER.minZ+.45;z<=SHED_PIER.maxZ-.45;z+=.5){const x=PORT_SHED.x+PORT_SHED.depth/2+.65;assert.ok(!colliders.some(c=>standingHitsRect(x,z,.3,0,c)),'pier walk is open at z='+z);}// (overhead: the roof is the lens's collider, not a walker's)
 // He sits facing his set.
 assert.ok(PORT_SHED.tv[1]<PORT_SHED.chair[1],'the TV is in front of him (to the south, where he faces)');
 // It stands wholly on the pier's deck, not over the water.
 const P=SHED_PIER,hx=PORT_SHED.depth/2,hz=PORT_SHED.width/2;
 assert.ok(PORT_SHED.x-hx>=P.minX&&PORT_SHED.x+hx<=P.maxX&&PORT_SHED.z-hz>=P.minZ&&PORT_SHED.z+hz<=P.maxZ,'the shed is on the deck');
 // You can walk in through the end towards the quay, beside his chair.
 for(const z of [PORT_SHED.z+hz+.6,PORT_SHED.z+hz-.4,PORT_SHED.z+.5])assert.ok(!colliders.some(c=>standingHitsRect(PORT_SHED.x-.55,z,.25,0,c)),'the way in is open at z='+z);
 shed.dispose();
});


test('Fujita has connected visible calves and planted shoes while holding and sipping',()=>{
 const shed=buildPortShed({parent:new THREE.Group(),colliders:[],register(){},onAction(){}});
 try{
  const a=shed.actor.avatar,chair=new THREE.Box3().setFromObject(shed.fujita.parent.getObjectByName('Armchair seat'));
  const rest=new THREE.Box3().setFromObject(shed.fujita.parent.getObjectByName('Armchair footrest'));
  for(const phase of [0,1.2,2.4]){
   shed.fujita.userData.consumeElapsed=phase;
   for(let i=0;i<90;i++)updateAvatarActor(shed.actor,1/60,1000);
   assert.ok(Math.abs(shoeHeight(a)-rest.max.y)<.002,'Both shoes rest on the timber footstool');
   assert.ok(Math.abs(seatContactHeight(a)-chair.max.y)<.002,'His pelvis rests on the cushion');
   a.root.updateMatrixWorld(true);
   for(const side of ['L','R']){
    const knee=a.bones['knee'+side].getWorldPosition(new THREE.Vector3());
    assert.ok(knee.z<chair.min.z-.04,'The calf is beyond the upholstered front');
   }
  }
 }finally{shed.dispose();}
});
