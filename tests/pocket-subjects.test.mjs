import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {peopleInPhoto,placeOfPhoto,inFrame,FAR} from '../src/photo/pocket-subjects.js';

// A lens at eye height looking down -z, on a 16:9 screen.
function lens(){const c=new THREE.PerspectiveCamera(60,16/9,.05,500);c.position.set(0,1.6,0);c.lookAt(0,1.6,-10);c.updateMatrixWorld(true);return c;}
const at=(name,x,z,o={})=>({name,position:new THREE.Vector3(x,0,z),height:1.6,visible:true,...o});

test('a person in front, in the middle and near enough is in the photo; the biggest first',()=>{
 const camera=lens();
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[at('Far',0,-8),at('Near',.3,-3)]}),['Near','Far']);
});

test('the camera keeps only the middle of a wide screen: someone at its side is left out',()=>{
 const camera=lens(),side=at('Side',4.6,-5);
 // On the screen they are visible (inside the 16:9 view) ...
 const p=side.position.clone();p.y=1.5;p.project(camera);assert.ok(Math.abs(p.x)<1,'on screen');
 // ... but outside the 128x112 frame cut from its middle.
 assert.ok(Math.abs(inFrame(camera,new THREE.Vector3(4.6,1.5,-5),16/9).x)>1);
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[side]}),[]);
});

test('behind the lens, too far, too small, hidden or behind a wall: not in the photo',()=>{
 const camera=lens();
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[at('Behind',0,4)]}),[]);
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[at('Far away',0,-(FAR+2))]}),[]);
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[at('Hidden',0,-3,{visible:false})]}),[]);
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,people:[at('Child',0,-15,{height:.6})]}),[],'a speck in the distance');
 const wall=(from,to)=>to.z<-2;   // a wall at z = -2
 assert.deepEqual(peopleInPhoto({camera,screenAspect:16/9,blocked:wall,people:[at('Behind the wall',0,-5),at('In front',0,-1.5)]}),['In front']);
});

test('someone sitting low is found by their head as posed, not a standing height',()=>{
 // A phone held upright (the frame is cut from the middle of a tall screen); a resident soaking in the onsen, 1.5 m
 // away, the head at 0.6 m and the lens aimed at it.
 const camera=new THREE.PerspectiveCamera(60,9/16,.05,500);camera.position.set(0,1.6,0);camera.lookAt(0,.6,-1.5);camera.updateMatrixWorld(true);
 const soaking={name:'Reiko',position:new THREE.Vector3(0,.1,-1.5),height:1.6,visible:true};
 assert.deepEqual(peopleInPhoto({camera,screenAspect:9/16,people:[{...soaking,head:new THREE.Vector3(0,.6,-1.5)}]}),['Reiko']);
 assert.deepEqual(peopleInPhoto({camera,screenAspect:9/16,people:[soaking]}),[],'a standing height would put her head above the frame');
});

test('at most eight people, the biggest kept',()=>{
 const camera=lens(),crowd=Array.from({length:12},(_,i)=>at('P'+i,(i%4-1.5)*.6,-3-Math.floor(i/4)*1.5));
 const names=peopleInPhoto({camera,screenAspect:16/9,people:crowd});
 assert.equal(names.length,8);assert.ok(names.slice(0,4).every(n=>['P0','P1','P2','P3'].includes(n)),'the nearest row first');
});

test('the place: the room inside; outdoors the nearest named place ahead, or one right beside the photographer',()=>{
 const camera=lens(),places=[{id:'pier',title:'The pier',x:0,z:-20},{id:'shop',title:'Sakura Shōten',x:0,z:-10},{id:'back',title:'Behind',x:0,z:12}];
 assert.deepEqual(placeOfPhoto({room:{id:'ramen',title:'Sato Ramen'},places,camera}),{id:'ramen',title:'Sato Ramen',at:'at Sato Ramen'});
 assert.deepEqual(placeOfPhoto({room:null,places,camera}),{id:'shop',title:'Sakura Shōten',at:'at Sakura Shōten'});
 assert.deepEqual(placeOfPhoto({room:null,places:[{id:'main',title:'Main shopping street',at:'on the main shopping street',x:0,z:-6}],camera}).at,'on the main shopping street');
 assert.equal(placeOfPhoto({room:null,places:[places[2]],camera}),null,'behind him, 12 m away');
 assert.deepEqual(placeOfPhoto({room:null,places:[{id:'door',title:'Door',x:0,z:5}],camera}),{id:'door',title:'Door',at:'at Door'},'right beside him');
 // Places whose name is not a shop's own get their own words.
 assert.equal(placeOfPhoto({room:{id:'mayor-home',title:'Mayor’s House'},places,camera}).at,'at home');
 assert.equal(placeOfPhoto({room:{id:'school',title:'Minato Elementary School'},places,camera}).at,'in the school classroom');
 assert.equal(placeOfPhoto({room:{id:'home-k7',title:'House to let'},places,camera}).at,'in the house to let');
 assert.equal(placeOfPhoto({room:{id:'resident-home-thao',title:'Thao’s home'},places,camera}).at,'at Thao’s home');
 assert.equal(placeOfPhoto({room:null,places:[{id:'far',title:'Far',x:0,z:-40}],camera}),null);
});

test('why someone is not in the photo is said in words',async()=>{
 const {explainPerson}=await import('../src/photo/pocket-subjects.js');
 const camera=lens(),why=(p,blocked)=>explainPerson({camera,person:p,screenAspect:16/9,blocked}).why;
 assert.equal(why(at('A',0,-3)),'');
 assert.equal(why(at('B',0,4)),'behind the lens');
 assert.equal(why(at('C',4.6,-5)),'head outside the frame');
 assert.equal(why(at('D',0,-(FAR+2))),'too far');
 assert.equal(why(at('E',0,-15,{height:.6})),'too small in the frame');
 assert.equal(why(at('F',0,-5),()=>true),'something between');
 assert.equal(why(at('G',0,-3,{visible:false})),'not shown');
});
