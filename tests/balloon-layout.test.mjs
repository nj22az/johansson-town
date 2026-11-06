import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {layoutBalloon,overlapArea,balloonTail} from '../src/dialogue/balloon-layout.js';
import {projectBalloonPerson} from '../src/dialogue/world-balloon.js';
import {portraitConversationShot} from '../src/dialogue/conversation-framing.js';

test('the Higa verandah composition uses a side gap and keeps both characters clear',()=>{
 const face={left:875,top:230,width:225,height:190,weight:80},body={left:845,top:230,width:275,height:540,weight:2};
 const player={left:0,top:245,width:365,height:360,weight:80};
 const box=layoutBalloon({viewport:{left:12,top:12,width:1512,height:852},anchor:{x:987,y:325},face,obstacles:[face,body,player],sizes:[{width:360,height:240},{width:304,height:285},{width:216,height:365}]});
 assert.ok(['left','right'].includes(box.side));
 for(const actor of [face,body,player])assert.equal(overlapArea(box,actor),0);
 assert.ok(box.top>=12&&box.top+box.height<=864);assert.ok(box.width<=360);
 const tail=balloonTail(box,{x:987,y:325});assert.equal(tail.edge,box.side==='right'?'left':'right');
});

test('phone wrapping fits a narrow side without entering the replies area or face',()=>{
 const face={left:242,top:220,width:112,height:112,weight:80},body={left:238,top:220,width:120,height:340,weight:2};
 const viewport={left:12,top:24,width:366,height:508};
 const box=layoutBalloon({viewport,anchor:{x:298,y:276},face,obstacles:[face,body],sizes:[{width:248,height:192},{width:192,height:245},{width:164,height:290}]});
 assert.equal(box.side,'left');assert.ok(box.width<=216);assert.equal(overlapArea(box,face),0);assert.equal(overlapArea(box,body),0);
 assert.ok(box.left>=12&&box.left+box.width<=378&&box.top>=24&&box.top+box.height<=532);
});

test('a nearly stationary speaker cannot make the bubble shimmer or change side',()=>{
 const input={viewport:{left:12,top:12,width:1000,height:600},anchor:{x:660,y:240},face:{left:610,top:190,width:100,height:100,weight:80},sizes:[{width:300,height:180}]};
 const first=layoutBalloon({...input,obstacles:[input.face]});
 const moved=layoutBalloon({...input,anchor:{x:660.6,y:240.5},face:{...input.face,left:610.6,top:190.5},obstacles:[{...input.face,left:610.6,top:190.5}],previous:first});
 assert.equal(moved.side,first.side);assert.equal(moved.left,first.left);assert.equal(moved.top,first.top);
});

test('an exceptional long line scrolls in clear space without covering either face',()=>{
 const face={left:96,top:350,width:104,height:104,weight:80},other={left:184,top:385,width:134,height:134,weight:80};
 const box=layoutBalloon({viewport:{left:12,top:12,width:366,height:597},anchor:{x:148,y:402},face,obstacles:[face,other],sizes:[{width:248,height:460},{width:192,height:600},{width:366,height:380,fallback:true}]});
 assert.equal(box.overflow,true);assert.equal(overlapArea(box,face),0);assert.equal(overlapArea(box,other),0);assert.ok(box.height>=120&&box.top+box.height<face.top);
 const shorter=layoutBalloon({viewport:{left:12,top:12,width:366,height:597},anchor:{x:148,y:402},face,obstacles:[face,other],sizes:[{width:248,height:354},{width:192,height:454},{width:366,height:280,fallback:true}]});
 assert.equal(shorter.width,366);assert.ok(!shorter.overflow);assert.equal(overlapArea(shorter,face),0);assert.equal(overlapArea(shorter,other),0);
});

test('a new obstruction or smaller viewport can change the chosen side safely',()=>{
 const face={left:450,top:180,width:100,height:100,weight:80},input={viewport:{left:12,top:12,width:988,height:580},anchor:{x:500,y:230},face,sizes:[{width:260,height:180}]};
 const first=layoutBalloon({...input,obstacles:[face]});
 const obstacle={left:first.left-10,top:12,width:first.width+20,height:580,weight:100};
 const next=layoutBalloon({...input,obstacles:[face,obstacle],previous:first});
 assert.equal(overlapArea(next,face),0);assert.equal(overlapArea(next,obstacle),0);assert.notEqual(next.side,first.side);
 const small=layoutBalloon({...input,viewport:{left:12,top:12,width:280,height:180},anchor:{x:200,y:90},sizes:[{width:248,height:700},{width:164,height:1000}]});
 assert.equal(small.overflow,true);assert.ok(small.height<=180&&small.width<=280);
});

test('world head projection protects scaled faces and rejects a speaker behind the camera',()=>{
 const camera=new THREE.PerspectiveCamera(60,390/844,.1,50);camera.position.set(0,1.5,0);camera.updateMatrixWorld();
 const rect={left:0,top:0,width:390,height:844},head=new THREE.Vector3(.5,1.5,-3),feet=new THREE.Vector3(.5,0,-3);
 const person=projectBalloonPerson(camera,rect,head,feet,.36);
 assert.ok(person.face.width>100);assert.ok(person.body.height>person.face.height);assert.ok(person.anchor.x>195);
 camera.rotation.y=Math.PI;camera.updateMatrixWorld();assert.equal(projectBalloonPerson(camera,rect,head,feet),null);
});

test('a portrait conversation keeps both Higa and Johansson inside the scene',()=>{
 const player=new THREE.Vector3(-29.8,1.6,-22.06),speaker=new THREE.Vector3(-29.8,2.04,-20.7),mid=player.clone().lerp(speaker,.5);
 const shot=portraitConversationShot({player,speaker,aspect:390/844});
 assert.ok(shot);assert.equal(shot.zoom,1,'An open courtyard needs no lens change');
 const camera=new THREE.PerspectiveCamera(65,390/844,.15,640);camera.position.copy(mid).add(shot.positionOffset);camera.lookAt(mid.clone().add(shot.lookOffset));camera.setViewOffset(390,844,0,84,390,844);camera.updateMatrixWorld();
 for(const [head,foot,radius] of [[speaker,new THREE.Vector3(-29.8,.47,-20.7),.4],[player,new THREE.Vector3(-29.8,.02,-22.06),.48]]){
  const person=projectBalloonPerson(camera,{left:0,top:0,width:390,height:844},head,foot,radius);
  assert.ok(person.face.left>=12&&person.face.left+person.face.width<=378,'The entire head stays on screen');
  assert.ok(person.face.top>12&&person.face.top+person.face.height<620,'Faces stay above the replies');
 }
});

test('portrait framing rejects blocked lenses and sightlines rather than crossing a wall',()=>{
 const player=new THREE.Vector3(0,1.6,0),speaker=new THREE.Vector3(0,1.9,1.4),mid=player.clone().lerp(speaker,.5);
 const blocked=p=>p.x>0,clear=(from,to)=>to.z<.4;
 const shot=portraitConversationShot({player,speaker,aspect:390/844,blocked,clear});
 const lens=mid.clone().add(shot.positionOffset);assert.ok(!blocked(lens)&&clear(player,lens)&&clear(speaker,lens));assert.ok(lens.x<0);
 assert.equal(portraitConversationShot({player,speaker,aspect:390/844,blocked:()=>true}),null);
 assert.equal(portraitConversationShot({player,speaker,aspect:1280/800}),null,'Wide-screen shots remain unchanged');
});
