import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createBeerService,IZAKAYA_PLAYER_SEATS} from '../src/people/izakaya-beer.js';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {CYCLE_DURATION,phaseStart} from '../src/drinking/cycle.js';
installDOM();

function fixture(seat=IZAKAYA_PLAYER_SEATS.counter2,name='Johansson'){
 const scene=new THREE.Scene(),room=new THREE.Group();scene.add(room);
 const actor=createAvatarJohansson({scene,recipe:recipeFor(name)});
 actor.root.position.set(...seat.position);actor.root.rotation.y=seat.yaw;
 const state={seated:true,seatHeight:seat.surfaceY,seatFront:seat.front,visible:true};
 for(let i=0;i<60;i++)actor.update(1/60,state);
 const service=createBeerService({room,getNao:()=>new THREE.Group()});service.place('draft',seat);
 return {scene,room,actor,state,service,dispose(){actor.cancelTableDrink();service.clear();actor.avatar.dispose();}};
}

/** Inspect the skinned mesh in the glass frame, independently of grip markers.
 * Include nondegenerate face centres as well as vertices; collapsed idle-finger
 * triangles are excluded. The draft body's authored outside radius is 45 mm.
 */
function renderedHandClearance(avatar,prop){
 const body=avatar.body,g=body.geometry,id=body.skeleton.bones.indexOf(avatar.bones.handR),points=new Map(),samples=[];
 avatar.root.updateWorldMatrix(true,true);prop.updateWorldMatrix(true,false);
 for(let i=0;i<g.attributes.position.count;i++){
  if(g.attributes.skinIndex.getX(i)!==id||g.attributes.skinWeight.getX(i)<.999)continue;
  const p=prop.worldToLocal(body.localToWorld(body.getVertexPosition(i,new THREE.Vector3())));
  points.set(i,p);samples.push(p);
 }
 const count=g.index?.count||g.attributes.position.count;
 for(let i=0;i<count;i+=3){
  const a=points.get(g.index?g.index.getX(i):i),b=points.get(g.index?g.index.getX(i+1):i+1),c=points.get(g.index?g.index.getX(i+2):i+2);
  if(!a||!b||!c||new THREE.Triangle(a,b,c).getArea()<1e-12)continue;
  samples.push(a.clone().add(b).add(c).multiplyScalar(1/3));
 }
 const besideBody=samples.filter(p=>p.y>.01&&p.y<.149);
 assert.ok(besideBody.length>50,'Rendered hand has enough samples beside the mug');
 return {clearance:Math.min(...besideBody.map(p=>Math.hypot(p.x,p.z)-.045)),bounds:new THREE.Box3().setFromPoints(samples)};
}

test('table sip reservation keeps one supported vessel and accounts only actual consumption',()=>{
 const f=fixture();try{
  const before=f.service.drink,lease=f.service.beginSip(),prop=lease.prop;
  assert.equal(f.service.beginSip(),null,'repeated commands cannot reserve the same drink');
  assert.equal(f.service.order('can',IZAKAYA_PLAYER_SEATS.counter2),false,'changing the drink is locked');
  assert.deepEqual(f.service.drink,before);assert.equal(prop.parent,f.room);
  assert.equal(f.room.children.filter(x=>x.userData.consumable==='drink').length,1);
  lease.cancel();assert.deepEqual(f.service.drink,before,'cancel before lip contact consumes nothing');
  const second=f.service.beginSip();second.consume(.4);const result=second.cancel();
  assert.ok(Math.abs(result.consumedPortion-.4)<1e-10);
  assert.ok(Math.abs(prop.userData.portion-(6-.4)/6)<1e-10,'partial sip remains consumed after interruption');
  assert.ok(Math.abs(result.alcohol-1/6*.4)<1e-10);
  assert.equal(second.consume(1),false,'stale reservations cannot alter the drink');
  const third=f.service.beginSip();f.service.clear();assert.equal(third.active,false);assert.equal(third.consume(1),false);
 }finally{f.dispose();}
});

test('all seven seats keep the delivered mug, wrist and lips coincident across the shared cycle',()=>{
 for(const seat of Object.values(IZAKAYA_PLAYER_SEATS)){
  const f=fixture(seat);try{
   const lease=f.service.beginSip(),prop=lease.prop,rest=prop.position.clone(),q=prop.quaternion.clone();let completed=null;
   assert.equal(f.actor.drinkFromTable(lease,{onComplete:r=>completed=r}),true);
   assert.equal(f.actor.drinkFromTable(lease),false);
   let previous=1,phases=new Set();
   for(let i=0;i<410&&f.actor.drinking;i++){
    f.actor.update(1/60,f.state);const d=f.actor.drinkingState;if(!d)continue;phases.add(d.id);
    assert.equal(prop.parent,f.room,seat.id+' has one authoritative room prop');
    assert.ok(d.wristError<.003,`${seat.id}/${d.id}: wrist error ${d.wristError}`);
    if(['PREPARE','REACH','GRASP','RELEASE','RETURN'].includes(d.id))assert.ok(prop.position.distanceTo(rest)<1e-9,seat.id+' base stays supported before grasp / after set-down');
    if(d.id==='SIP')assert.ok(d.rimError<1e-8,seat.id+' drinking rim stays at the measured mouth');
    const portion=prop.userData.portion;
    if(portion<previous-1e-10)assert.ok(d.id==='SIP'&&d.valid,seat.id+' consumption requires lip and fluid contact');
    previous=portion;
   }
   for(const phase of ['REACH','GRASP','LIFT','APPROACH','CONTACT','SIP','SWALLOW','RECOVER','SET_DOWN','RELEASE','RETURN'])assert.ok(phases.has(phase),phase);
   assert.ok(completed);assert.ok(Math.abs(completed.consumedPortion-1)<1e-8);assert.ok(completed.volumeConsumedMl>0);
   assert.ok(prop.position.distanceTo(rest)<1e-10);assert.ok(prop.quaternion.angleTo(q)<1e-7);
   assert.equal(f.service.drink.left,5);assert.equal(f.service.sipping,false);
  }finally{f.dispose();}
 }
});

test('cast proportions use the same phases without stretching, and low levels increase tilt',()=>{
 for(const name of ['Johansson','Thuan','Mr Fujita']){
  const f=fixture(IZAKAYA_PLAYER_SEATS.counter2,name);try{
   let firstTilt=0,lastTilt=0;
   for(let sip=0;sip<6;sip++){
    const lease=f.service.beginSip();assert.ok(lease);assert.equal(f.actor.drinkFromTable(lease),true);let tilt=0;
    for(let frame=0;frame<210&&f.actor.drinking;frame++){
     f.actor.update(1/30,f.state);const d=f.actor.drinkingState;if(!d)continue;
     assert.ok(d.wristError<.003,`${name}/${sip}/${d.id}: wrist error ${d.wristError}`);
     if(d.id==='SIP')tilt=Math.max(tilt,d.tilt);
    }
    if(!sip)firstTilt=tilt;lastTilt=tilt;
   }
   assert.ok(lastTilt>firstTilt+.5,name+' raises the last mouthful farther');
   assert.equal(f.service.drink.left,0);assert.equal(f.service.beginSip(),null,'empty glass remains on table and cannot sip');
  }finally{f.dispose();}
 }
});

test('rendered cast palms and thumbs clear the mug body while their clasps retain its handle',()=>{
 for(const name of ['Johansson','Thuan','Mr Fujita']){
  const f=fixture(IZAKAYA_PLAYER_SEATS.counter2,name);try{
   const lease=f.service.beginSip(),prop=lease.prop;f.actor.drinkFromTable(lease);let elapsed=0;
   for(const [phase,time] of [['GRASP',phaseStart('GRASP')+.2],['SIP',phaseStart('SIP')+.8],['SET_DOWN',phaseStart('SET_DOWN')+.3]]){
    while(elapsed<time-1e-10){const dt=Math.min(1/60,time-elapsed);f.actor.update(dt,f.state);elapsed+=dt;}
    assert.equal(f.actor.drinkingState.id,phase);
    const rendered=renderedHandClearance(f.actor.avatar,prop);
    assert.ok(rendered.clearance>=.0005,`${name}/${phase}: skin penetrates mug by ${-rendered.clearance} m`);
    assert.ok(rendered.bounds.containsPoint(new THREE.Vector3(prop.userData.grip.handle,prop.userData.grip.height,0)),`${name}/${phase}: handle remains inside the visible clasp`);
    assert.ok(f.actor.drinkingState.wristError<.003,`${name}/${phase}: corrected grip stays reachable`);
   }
  }finally{f.dispose();}
 }
});

test('pause, frame subdivisions and cancellation never consume out of contact or lose the table prop',()=>{
 for(const when of [phaseStart('REACH')+.35,phaseStart('SIP')+.7,phaseStart('SET_DOWN')+.3]){
  const f=fixture();try{
   const lease=f.service.beginSip(),prop=lease.prop,rest=prop.position.clone();f.actor.drinkFromTable(lease);
   for(let t=0;t<when;){const dt=Math.min(1/60,when-t);f.actor.update(dt,f.state);t+=dt;}
   const position=prop.position.clone(),volume=prop.userData.portion,phase=f.actor.drinkingState.id;
   for(let i=0;i<12;i++)f.actor.update(0,f.state);
   assert.equal(prop.userData.portion,volume);assert.equal(f.actor.drinkingState.id,phase);assert.ok(prop.position.distanceTo(position)<1e-8);
   f.actor.cancelTableDrink();assert.equal(f.actor.drinking,false);assert.equal(f.service.sipping,false);
   assert.equal(prop.parent,f.room);assert.ok(prop.position.distanceTo(rest)<1e-9);assert.equal(prop.userData.portion,volume);
   assert.ok(f.service.beginSip(),'cancel makes the remaining drink usable again');
  }finally{f.dispose();}
 }
 const consumed=[];
 for(const dt of [1/120,1/30,.23]){
  const f=fixture();try{
   const lease=f.service.beginSip();let done;f.actor.drinkFromTable(lease,{onComplete:r=>done=r});
   for(let t=0;t<CYCLE_DURATION+.3&&f.actor.drinking;t+=dt)f.actor.update(dt,f.state);
   assert.ok(done);consumed.push(done.volumeConsumedMl);
  }finally{f.dispose();}
 }
 assert.ok(Math.max(...consumed)-Math.min(...consumed)<1e-6,'consumption is frame-rate independent');
});

test('first-person arm shares original rig, restores its meshes and cancels safely on standing',()=>{
 const f=fixture();try{
  const original=[];f.actor.avatar.root.traverse(o=>{if(o.isMesh)original.push([o,o.visible]);});
  const prop=f.service.beginSip();f.actor.drinkFromTable(prop);
  f.actor.update(.4,{...f.state,visible:false,firstPersonDrinking:true});
  const arm=f.actor.avatar.root.getObjectByName('Drinking arm, first person');assert.ok(arm);assert.ok(arm.children.length);
  assert.equal(f.actor.root.visible,true);assert.ok(arm.children.every(o=>o.isSkinnedMesh&&o.skeleton===f.actor.avatar.body.skeleton));
  assert.ok(original.every(([o])=>!o.visible),'no camera-inside-head surface');
  for(let i=0;i<60;i++){f.actor.update(1/60,{...f.state,visible:false,firstPersonDrinking:true});assert.ok(f.actor.drinkingState.wristError<.003,'first-person masking does not invalidate seat support');}
  const portion=prop.prop.userData.portion;
  f.actor.update(0,{...f.state,visible:false,firstPersonDrinking:false});
  assert.equal(f.actor.root.visible,false,'opening an inspector hides the first-person arm');assert.equal(prop.prop.userData.portion,portion);
  f.actor.update(0,{...f.state,visible:true,firstPersonDrinking:false});
  assert.ok(original.every(([o,v])=>o.visible===v),'switching back restores the full cast model');
  f.actor.update(1/60,{...f.state,seated:false});
  assert.equal(f.actor.drinking,false);assert.equal(f.service.sipping,false);assert.equal(f.actor.avatar.root.getObjectByName('Drinking arm, first person'),undefined);
 }finally{f.dispose();}
});

test('explicit jump and pose commands cancel the lease before taking over the avatar',()=>{
 for(const action of [a=>a.jump(),a=>a.play('Wave'),a=>a.seat('Soak'),a=>a.stop()]){
  const f=fixture();try{
   const lease=f.service.beginSip(),rest=lease.prop.position.clone();f.actor.drinkFromTable(lease);
   f.actor.update(.7,f.state);action(f.actor);
   assert.equal(f.actor.drinking,false);assert.equal(f.service.sipping,false);assert.ok(lease.prop.position.distanceTo(rest)<1e-10);
  }finally{f.dispose();}
 }
});
