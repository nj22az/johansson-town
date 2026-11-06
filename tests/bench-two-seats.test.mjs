import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {benchSeat,freeSlot,SLOT} from '../src/world/seat-slots.js';
import {createTownActivities} from '../src/people/town-activities.js';
import {RESIDENTS} from '../src/people/residents.js';
import {surface,core,intrusion,clearance} from './body-contact.mjs';
installDOM();

/**
 * Two on one bench (the owner, 21 October 2026: "two people should be able to sit together on a bench"). A bench's seat has a
 * place for each sitter (seat-slots.js): two, or more on a long bench, each with its own mark, standing point and facing.
 * Two residents sit side by side on it, each in a place of their own; a resident sits down beside the player, and the player
 * beside a resident, and neither gets up for it; and two bodies seated in neighbouring places, whoever they are, do not go
 * into each other.
 */
const BENCH=benchSeat({id:'test-bench',position:[2,0,3],stand:[2,0,3.9],surfaceY:.46,eyeY:1.2,yaw:Math.PI,pitch:0},{length:1.6,front:.225});

test('a bench has two places, or more by its length, side by side along it, each with its mark, stand and facing',()=>{
 for(const [length,n] of [[1.2,2],[1.4,2],[1.6,2],[1.8,2],[2.08,2],[2.3,3],[3,4]])assert.equal(benchSeat({position:[0,0,0],stand:[0,0,1],yaw:0},{length,front:.2}).slots.length,n,length+' m');
 const [a,b]=BENCH.slots,face=new THREE.Vector3(-Math.sin(BENCH.yaw),0,-Math.cos(BENCH.yaw));
 const along=new THREE.Vector3(b.position[0]-a.position[0],0,b.position[2]-a.position[2]);
 assert.ok(Math.abs(along.length()-SLOT.width)<1e-9,'one sitter’s width apart');
 assert.ok(Math.abs(along.dot(face))<1e-9,'along the bench, across the way it faces');
 for(const s of BENCH.slots){
  assert.equal(s.yaw,BENCH.yaw);assert.equal(s.front,BENCH.front);
  // the place is on the bench (within its length), and its stand is where the bench's is, beside it
  assert.ok(Math.hypot(s.position[0]-BENCH.position[0],s.position[2]-BENCH.position[2])<=1.6/2-.2);
  assert.ok(Math.abs(Math.hypot(s.stand[0]-s.position[0],s.stand[2]-s.position[2])-.9)<1e-9);
 }
 // the free place nearest whoever sits down, and none when the bench is full
 const [x,z]=BENCH.slots[1].position.filter((_,i)=>i!==1);
 assert.equal(freeSlot(BENCH,x,z).slot,1);assert.equal(freeSlot(BENCH,x,z,s=>s.slot===1).slot,0);assert.equal(freeSlot(BENCH,x,z,()=>true),null);
});

function fixture(){
 const parent=new THREE.Group(),bench=new THREE.Object3D();bench.position.set(2,1,3);bench.userData={hit:{label:'Sit on the bench'},seat:BENCH};parent.add(bench);
 const person=name=>{const g=new THREE.Group();g.userData.name=name;g.position.set(2,0,5);parent.add(g);return {g,profile:RESIDENTS.find(p=>p.name===name)};};
 return {parent,bench,person};
}
const base={place:'park',target:[2,5],activity:'resting in the park'};
/** Plan until they sit (the first plan only schedules their first look round). */
function seat(activities,p,from=1000){let m=from;for(;m<from+100&&p.g.userData.socialPose!=='Sit';m+=10){activities.plan(p,base,m,false,0);const use=activities.stateFor(p);if(use?.phase==='walking')p.g.position.set(use.target[0],0,use.target[1]);}return m;}

test('two residents sit side by side on one bench, each in a place of their own',()=>{
 const {bench,person}=fixture(),a=person('Tetsuo'),b=person('Thao'),c=person('Mrs Sato');
 const activities=createTownActivities({getTargets:()=>[bench],collides:()=>false});
 seat(activities,a);seat(activities,b);
 for(const p of [a,b])assert.equal(p.g.userData.socialPose,'Sit',p.profile.name+' sits on the bench');
 const places=[a,b].map(p=>BENCH.slots.findIndex(s=>Math.hypot(s.position[0]-p.g.position.x,s.position[2]-p.g.position.z)<1e-9));
 assert.ok(places.every(i=>i>=0)&&places[0]!==places[1],'in two different places: '+places);
 assert.equal(a.g.userData.seatFront,BENCH.front,'the seat’s front edge goes to the body');
 assert.deepEqual(Object.values(bench.userData.slotsTaken).sort(),['Tetsuo','Thao']);
 // the bench is full: a third finds no place on it
 seat(activities,c);assert.notEqual(c.g.userData.socialPose,'Sit');
 activities.release(a,1200);assert.equal(bench.userData.slotsTaken[places[0]],undefined,'a place is free again once its sitter stands up');
 assert.deepEqual(a.g.position.toArray(),BENCH.slots[places[0]].stand,'up onto the place’s own standing point');
 activities.dispose();
});

test('a resident sits down beside the player, and the player sitting down beside them does not get them up',()=>{
 const {bench,person}=fixture(),a=person('Tetsuo');let player=new THREE.Vector3(...BENCH.slots[0].position);
 const activities=createTownActivities({getTargets:()=>[bench],collides:()=>false,getPlayerPosition:()=>player});
 let m=seat(activities,a);
 assert.equal(a.g.userData.socialPose,'Sit');assert.ok(Math.hypot(a.g.position.x-BENCH.slots[1].position[0],a.g.position.z-BENCH.slots[1].position[2])<1e-9,'the place beside the player');
 activities.plan(a,base,m+1,false,1);assert.equal(a.g.userData.socialPose,'Sit','still sitting beside the player');
 activities.release(a,m+2);
 // the other way round: the resident first, then the player into the other place
 player=new THREE.Vector3(9,0,9);const b=person('Thao');m=seat(activities,b,m+40);const mine=BENCH.slots.findIndex(s=>Math.hypot(s.position[0]-b.g.position.x,s.position[2]-b.g.position.z)<1e-9);
 assert.ok(mine>=0);player=new THREE.Vector3(...BENCH.slots[1-mine].position);
 activities.plan(b,base,m+1,false,1);assert.equal(b.g.userData.socialPose,'Sit','the player sat down beside them: they stay');
 // and somebody walking into their very place is the one place they get up from (as before)
 player=new THREE.Vector3(...BENCH.slots[mine].position);activities.plan(b,base,m+2,false,1);assert.notEqual(b.g.userData.socialPose,'Sit');
 activities.dispose();
});

function seeded(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function sitAt(who,outfit,slot,parent){
 const avatar=buildAvatar(recipeFor(who),{shadows:false});avatar.wear(outfit);
 const holder=new THREE.Group();holder.position.set(...slot.position);holder.rotation.y=slot.yaw;holder.add(avatar.root);parent.add(holder);
 const rand=seeded(),own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
 const animator=own(()=>createAvatarAnimator(avatar,{random:rand}));
 for(let i=0;i<90;i++){own(()=>animator.update(1/60,{seated:true,seatHeight:BENCH.surfaceY,seatFront:slot.front}));avatar.springs?.update(1/60);}
 parent.updateMatrixWorld(true);return avatar;
}

test('two bodies on neighbouring places do not touch: broad and slim, a skirt beside a dress, a child beside a grown-up',()=>{
 const PAIRS=[[['Jun','clothes'],['Officer Mori','clothes']],[['Kai','clothes'],['Jun','clothes']],[['Yoshiko','clothes'],['Mr Fujita','clothes']],[['Vy','clothes'],['Thao','afterbath']],[['Grandmother Higa','clothes'],['Kōji','clothes']],[['Mai','clothes'],['Ms Ganaha','clothes']],[['Johansson','clothes'],['Thuan','clothes']]];
 for(const [[a,wa],[b,wb]] of PAIRS){
  const parent=new THREE.Group(),A=sitAt(a,wa,BENCH.slots[0],parent),B=sitAt(b,wb,BENCH.slots[1],parent);
  const ab=intrusion(surface(A),core(B)),ba=intrusion(surface(B),core(A)),into=Math.max(ab.depth,ba.depth);
  assert.equal(into,0,`${a} and ${b}: ${(into*1000).toFixed(1)} mm into each other (${ab.bone||''} ${ba.bone||''})`);
  // apart: the drawn surface of each (its clothes, its mittens on its lap) clear of the other's body
  const gap=Math.min(clearance(surface(A),core(B)),clearance(surface(B),core(A)));
  assert.ok(gap>.005,`${a} and ${b}: ${(gap*1000).toFixed(1)} mm apart`);
  A.dispose();B.dispose();
 }
});
