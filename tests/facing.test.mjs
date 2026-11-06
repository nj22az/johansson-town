import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createFacing,occupied,faceYaw,turnToward,offBy,alignedStep,forwardOnly,travelError,travelYaw,FORWARD_ONLY_ANGLE,OCCUPIED_POSES} from '../src/people/facing.js';

const person=(x,z,data={})=>{
 const g=new THREE.Group();g.position.set(x,0,z);g.userData={...data};
 return {g,profile:{name:data.name||'Someone'}};
};
const world=people=>({people});
const at=(x,z)=>new THREE.Vector3(x,0,z);

test('someone mid-task answers over their shoulder, someone free does not',()=>{
 assert.equal(occupied({}),false);
 assert.equal(occupied({},true),true,'walking counts as occupied');
 for(const socialPose of OCCUPIED_POSES)assert.equal(occupied({socialPose}),true,socialPose);
 for(const key of ['carrying','restocking','shopReach','sleeping','roomTransition','usingTownObject'])
  assert.equal(occupied({[key]:true}),true,key);
 assert.equal(occupied({socialPose:'Idle_Neutral'}),false,'standing about is not a task');
});

test('facing a point uses the same convention the town walks in',()=>{
 // Walking from the origin toward -z means facing yaw 0.
 assert.ok(Math.abs(faceYaw({x:0,z:0},{x:0,z:-1}))<1e-9);
 assert.ok(Math.abs(faceYaw({x:0,z:0},{x:0,z:1})-Math.PI)<1e-9);
 // Facing -x is +pi/2, the same value schedules.js derives from a step in that direction.
 assert.ok(Math.abs(faceYaw({x:0,z:0},{x:-1,z:0})-Math.PI/2)<1e-9);
 assert.ok(Math.abs(faceYaw({x:0,z:0},{x:1,z:0})+Math.PI/2)<1e-9);
});

test('a turn takes the short way round and settles',()=>{
 // From just under a half turn, the short way is forwards, not back through zero.
 const start=3.0,target=-3.0;
 const next=turnToward(start,target,1/60,6);
 assert.ok(next>start,'crossing pi goes on round rather than unwinding');
 let angle=0;
 for(let i=0;i<240;i++)angle=turnToward(angle,1.2,1/60,6);
 assert.ok(Math.abs(angle-1.2)<.01,'and it arrives');
 assert.equal(turnToward(1,2,0,6),1,'no time, no turn');
});

test('being spoken to turns a free person all the way round',()=>{
 const her=person(0,0,{name:'Thuan',playerConversation:true});
 her.g.rotation.y=Math.PI;                       // her back to you
 const pass=createFacing({world:world([her]),getPlayerPosition:()=>at(0,-3)});
 for(let i=0;i<180;i++)pass.update(1/60);
 assert.ok(offBy(her.g,at(0,-3))<.06,'she ends up facing you');
 assert.deepEqual(her.g.userData.lookTarget?.length,3,'and her head is pointed at you');
 assert.equal(her.g.userData.lookSource,'facing');
});

test('someone mid-task keeps their body where it was and only looks',()=>{
 const her=person(0,0,{name:'Thuan',playerConversation:true,restocking:true});
 her.g.rotation.y=Math.PI;
 const pass=createFacing({world:world([her]),getPlayerPosition:()=>at(0,-3)});
 for(let i=0;i<180;i++)pass.update(1/60);
 assert.equal(her.g.rotation.y,Math.PI,'the shelf does not stock itself');
 assert.deepEqual(her.g.userData.lookTarget,[0,1.66,-3],'but she looks at you');
 assert.equal(pass.stats.turning,0);
 assert.equal(pass.stats.addressed,1);
});

test('speaking to a walking Thuan cannot turn her body away from her route',()=>{
 const her=person(0,0,{name:'Thuan',playerConversation:true,character:{moving:true}});
 const pass=createFacing({world:world([her]),getPlayerPosition:()=>at(0,3)});
 for(let i=0;i<60;i++)pass.update(1/60);
 assert.equal(her.g.rotation.y,0,'The active gait owns her body direction');
 assert.equal(pass.stats.turning,0);
 assert.deepEqual(her.g.userData.lookTarget,[0,1.66,3],'She can still acknowledge the speaker with her gaze');
});

test('standing near someone earns a glance, not a pirouette',()=>{
 const him=person(0,0,{name:'Chin'});
 him.g.rotation.y=Math.PI;
 const pass=createFacing({world:world([him]),getPlayerPosition:()=>at(0,-1.4)});
 for(let i=0;i<120;i++)pass.update(1/60);
 assert.equal(him.g.rotation.y,Math.PI,'nobody spins round because you walked past');
 assert.ok(him.g.userData.lookTarget,'they do look over');
 assert.equal(pass.stats.turning,0);
});

test('walking away is noticed: the look is dropped again',()=>{
 const him=person(0,0,{name:'Chin'});
 const pass=createFacing({world:world([him]),getPlayerPosition:()=>at(0,-1.4)});
 pass.update(1/60);
 assert.ok(him.g.userData.facingPlayer);
 const gone=createFacing({world:world([him]),getPlayerPosition:()=>at(0,-40)});
 gone.update(1/60);
 assert.equal(him.g.userData.facingPlayer,undefined);
 assert.equal(him.g.userData.lookTarget,undefined,'and they stop staring at where you were');
});

test('a look put there by the shop counter is left alone',()=>{
 const her=person(0,0,{name:'Thuan',lookTarget:[1,1.5,1],lookSource:'shop'});
 const pass=createFacing({world:world([her]),getPlayerPosition:()=>at(0,-40)});
 pass.update(1/60);
 assert.deepEqual(her.g.userData.lookTarget,[1,1.5,1],'the shop pass owns that one');
});

test('a far-off crowd costs nothing and nobody moves',()=>{
 const crowd=Array.from({length:40},(_,i)=>person(i*3+8,i*3+8,{name:'N'+i}));
 const before=crowd.map(p=>p.g.rotation.y);
 const pass=createFacing({world:world(crowd),getPlayerPosition:()=>at(0,0)});
 pass.update(1/60);
 assert.deepEqual(crowd.map(p=>p.g.rotation.y),before);
 assert.equal(pass.stats.addressed,0);
});

test('nobody outruns their own turn',()=>{
 // Full pace facing forward, nothing facing backward, cosine in between. Travelling
 // at speed toward somewhere you have not turned to face is what reads as walking
 // backwards, and it is what room-walk used to do on every corner.
 assert.equal(alignedStep(0),1);
 assert.ok(Math.abs(alignedStep(Math.PI/3)-.5)<1e-9);
 assert.ok(alignedStep(Math.PI/2)<1e-9,'square on is a standstill');
 assert.equal(alignedStep(Math.PI),0);
 assert.equal(alignedStep(-Math.PI),0,'and it does not care which way round');
 assert.equal(alignedStep(4*Math.PI),0,'nor about angles past half a turn');
 assert.ok(alignedStep(.2)>.97,'a small correction barely slows you');
});

test('Thuan forward-only travel rejects sideways and backward translation',()=>{
 assert.ok(Math.abs(travelYaw(0,-1))<1e-12);
 assert.equal(forwardOnly(0,0,-1),true);
 assert.equal(forwardOnly(Math.PI,0,-1),false,'backward travel is forbidden');
 assert.equal(forwardOnly(Math.PI/2,0,-1),false,'sideways travel is forbidden');
 assert.equal(forwardOnly(FORWARD_ONLY_ANGLE*.9,0,-1),true);
 assert.equal(forwardOnly(FORWARD_ONLY_ANGLE*1.1,0,-1),false);
 assert.ok(Math.abs(travelError(Math.PI,0,-1))>3,'a reverse step reports a half-turn error');
});
