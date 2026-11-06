import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {RESIDENTS} from '../src/people/residents.js';
import {createNeighbours} from '../src/people/neighbours.js';
import {relationshipKey,restoreRelationships} from '../src/people/relationships.js';
import {createNeighbourChats,clearChatLine,createChatBubble} from '../src/people/neighbour-chats.js';
import {installDOM} from './fixtures.mjs';
function setup(names=['Chin','Tetsuo'],options={}){
 const scene=new THREE.Scene(),world={people:names.map((name,i)=>{const profile=RESIDENTS.find(p=>p.name===name),g=new THREE.Group();g.userData.name=name;g.position.set(i*1.5,0,-4);scene.add(g);return {g,profile};})};
 return {scene,world,chats:createNeighbourChats({world,observer:()=>new THREE.Vector3(),...options})};
}
test('nearby friends take turns, face each other, then release their schedules and cool down',()=>{
 const {world,chats}=setup();const before=world.people.map(p=>p.g.position.clone());chats.update(2,1002);
 assert.ok(chats.current);assert.match(chats.current.text,/radio/);assert.equal(chats.current.speaker.profile.name,'Chin');
 assert.equal(world.people[0].g.userData.chat.speaking,true);assert.equal(world.people[1].g.userData.chat.speaking,false);
 chats.update(4.1,1006);assert.equal(chats.current.speaker.profile.name,'Tetsuo');assert.match(chats.current.text,/music/);
 world.people.forEach((p,i)=>assert.ok(p.g.position.equals(before[i]),'Ambient gestures never move actors towards the player'));
 chats.update(8,1014);assert.equal(chats.current,null);for(const p of world.people){assert.equal(p.g.userData.chatHold,undefined);assert.equal(p.g.userData.chat,undefined);}
 chats.update(10,1024);assert.equal(chats.current,null,'No immediate repeated exchange');
});
test('player intervention and streaming cancel an exchange without stale talking flags',()=>{
 const {world,chats}=setup();chats.update(2,1002);world.people[0].g.userData.facePlayerUntil=performance.now()+1000;chats.update(.1,1002);assert.equal(chats.current,null);
 for(const p of world.people)assert.equal(p.g.userData.chat,undefined);
 const next=setup();next.chats.update(2,1002);next.world.people[1].g.visible=false;next.chats.update(.1,1002);assert.equal(next.chats.current,null);
});
test('work, vehicles, the controlled resident and other authored interactions take priority over small talk',()=>{
 for(const flag of ['playerControlled','playerConversation','inVehicle','ferryPassenger','aboardFerry','ferryCrew','ferryShoreTask','onWatch','boarding','playing','restocking','shopReach','shopping','serving','usingTownObject','sleeping','waking','roomTransition']){
  const {world,chats}=setup();world.people[0].g.userData[flag]=true;chats.update(2,1002);
  assert.equal(chats.current,null,flag+' prevents an exchange');
  const active=setup();active.chats.update(2,1002);assert.ok(active.chats.current);
  active.world.people[0].g.userData[flag]=true;active.chats.update(.1,1002);
  assert.equal(active.chats.current,null,flag+' interrupts an exchange');
  for(const p of active.world.people){assert.equal(p.g.userData.chatHold,undefined);assert.equal(p.g.userData.lookSource,undefined);}
 }
});
test('residents converse at normal distance in the same room and release when separated or crowded',()=>{
 for(const distance of [.4,4]){
  const {world,chats}=setup();world.people[1].g.position.x=distance;chats.update(2,1002);assert.equal(chats.current,null);
  const active=setup();active.chats.update(2,1002);active.world.people[1].g.position.x=distance;active.chats.update(.1,1002);
  assert.equal(active.chats.current,null);assert.equal(active.world.people[0].g.userData.chatHold,undefined);
 }
 const separate=setup();const room=new THREE.Group();separate.scene.add(room);room.add(separate.world.people[1].g);
 separate.chats.update(2,1002);assert.equal(separate.chats.current,null,'no conversation between separate rooms');
 const hidden=setup(undefined,{blocked:()=>true});hidden.chats.update(2,1002);assert.equal(hidden.chats.current,null,'no conversation through a wall');
 const far=setup();far.scene.position.set(100,0,100);far.chats.update(2,1002);assert.equal(far.chats.current,null,'use world coordinates for the observer radius');
});
test('only one local pair talks at a time, with no model required, and a changed routine releases both',()=>{
 const {world,chats}=setup(['Thuan','Nhung','Tetsuo','Mrs Sato'],{random:()=>0});
 world.people.forEach((p,i)=>p.g.position.set(i*.95,0,-4));chats.update(2,1002);
 assert.ok(chats.current);assert.equal(chats.current.generated,false);
 assert.equal(world.people.filter(p=>p.g.userData.chatHold).length,2);
 chats.update(.1,180);assert.equal(chats.current,null,'bedtime supersedes a chat');
 assert.equal(world.people.filter(p=>p.g.userData.chatHold).length,0);
});
test('Vy joins the same exchanges as scheduled residents and the completed encounter survives saving',()=>{
 installDOM();const fixture=setup(['Tetsuo']),state={},neighbours=createNeighbours({parent:fixture.scene});
 const vy=neighbours.people.find(p=>p.profile.name==='Vy');vy.g.position.set(1.5,0,-4);
 fixture.world.homeNeighbours=[vy];
 const chats=createNeighbourChats({world:fixture.world,observer:()=>new THREE.Vector3(),state:()=>state,random:()=>0});
 chats.update(2,1002);assert.deepEqual(new Set(chats.current.pair.map(p=>p.profile.name)),new Set(['Tetsuo','Vy']));
 chats.update(30,1002);assert.equal(chats.current,null);
 const key=relationshipKey('Tetsuo','Vy');assert.ok(key);assert.equal(state.relationships[key].totals.chat,1);
 assert.deepEqual(restoreRelationships(JSON.parse(JSON.stringify(state.relationships))),state.relationships);
});
test('canonical neighbours pause their route and facing while chatting, then resume walking',()=>{
 installDOM();const neighbours=createNeighbours({parent:new THREE.Group()}),minutes=10003*1440+1002;
 neighbours.update(0,minutes);const vy=neighbours.people.find(p=>p.profile.name==='Vy'),g=vy.g;
 // A real canonical route, paused mid-leg, with the conversation owning her facing.
 vy.path=[[g.position.x+3,g.position.z]];g.rotation.y=.72;g.userData.chatHold=true;
 const before=g.position.clone();neighbours.update(.2,minutes);
 assert.ok(g.position.equals(before));assert.equal(g.rotation.y,.72);assert.equal(g.userData.walking,false);
 delete g.userData.chatHold;neighbours.update(.2,minutes);assert.ok(g.position.distanceTo(before)>.05);
});
test('ambient bubble follows its speaker and hides behind walls or off screen',()=>{
 installDOM();const camera=new THREE.PerspectiveCamera(65,1,0.1,50);camera.position.set(0,1.7,0);camera.updateMatrixWorld(true);
 const canvas={getBoundingClientRect:()=>({left:0,top:0,width:800,height:800})};const {chats}=setup();chats.update(2,1002);
 let occluded=false;const ui=createChatBubble({camera,canvas,target:g=>g.position.clone().add(new THREE.Vector3(0,1.4,0)),blocked:()=>occluded});
 const bubble=document.body.lastChild;ui.render(chats.current);assert.equal(bubble.hidden,false);assert.equal(bubble.firstChild.textContent,'Chin');
 occluded=true;ui.render(chats.current);assert.equal(bubble.hidden,true);occluded=false;camera.rotation.y=Math.PI;camera.updateMatrixWorld(true);ui.render(chats.current);assert.equal(bubble.hidden,true);
 ui.hide();assert.equal(bubble.hidden,true);
});
