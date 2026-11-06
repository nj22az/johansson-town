import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {createFutonRoutine,buildTatamiHome} from '../src/world/interiors/tatami-home.js';
import {TATAMI_HOME_LAYOUT,TATAMI_HOME_OWNER} from '../src/world/interiors/tatami-home-layout.js';
import {RESIDENTS} from '../src/people/residents.js';
import {sleepHours,homeLayoutFor} from '../src/people/home-life.js';
import {circleHitsRect} from '../physics.js';
const profile=RESIDENTS.find(p=>p.name===TATAMI_HOME_OWNER);
test('futon follows bedtime, overnight, waking and storage across midnight and revisits',()=>{
 const {sleep,wake}=sleepHours(profile),r=createFutonRoutine(profile);
 assert.equal(r.update(0,wake+60).phase,'stored');
 assert.equal(r.update(.9,sleep-10).phase,'unfolding');
 assert.equal(r.update(.9,sleep-9).phase,'laid out');
 assert.equal(r.update(1,3*60).phase,'laid out');
 assert.equal(r.update(1,wake+5).phase,'laid out');
 assert.equal(r.update(.9,wake+16).phase,'folding away');
 assert.equal(r.update(.9,wake+17).phase,'stored');
 assert.equal(createFutonRoutine(profile).update(0,3*60).phase,'laid out');
 assert.equal(createFutonRoutine(profile).update(0,wake+60).phase,'stored');
 assert.equal(r.update(-5,wake+60).amount,0);
});
test('Blender room carries actual cupboard bedding and a movable fan, with no embedded foreign assets',async()=>{
 const data=readFileSync(new URL('../assets/models/tatami-home/tatami-home.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
 for(const name of ['LaidFuton','StoredFuton','FanRotor','FutonCupboardDoor','Room_straw','Room_green'])assert.ok(gltf.scene.getObjectByName(name),name);
 const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());assert.equal(json.images,undefined);assert.ok(json.meshes.length<40,'furnishings batched for mobile');
});
test('loaded tatami room closes the rear fusuma aperture behind its existing paper and rail',async t=>{
 const data=readFileSync(new URL('../assets/models/tatami-home/tatami-home.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
 const probes=[-2.45,-1.75,-.8,.2,.9].map(x=>new THREE.Raycaster(new THREE.Vector3(x,2.36,-1.7),new THREE.Vector3(0,0,-1),0,5));
 gltf.scene.updateMatrixWorld(true);
 for(const ray of probes)assert.equal(ray.intersectObject(gltf.scene,true).length,0,'original paper and rail leave an exposed 20 mm sky aperture');
 t.mock.method(GLTFLoader.prototype,'loadAsync',async()=>gltf);
 const documentDescriptor=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'http://localhost/johansson-town/'}});
 t.after(()=>{if(documentDescriptor)Object.defineProperty(globalThis,'document',documentDescriptor);else delete globalThis.document;});
 const room=new THREE.Group(),home=buildTatamiHome({profile,room,box:(s,p,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...s),new THREE.MeshBasicMaterial({color:c}));m.position.fromArray(p);parent.add(m);return m;},collider(){},reg(){},action(){},exit(){}});
 assert.equal(await home.ready,true);room.updateMatrixWorld(true);
 const header=room.getObjectByName('Rear fusuma header backing'),bounds=new THREE.Box3().setFromObject(header);
 assert.ok(bounds.min.y<2.35&&bounds.max.y>2.37,'header overlaps both edges of the aperture');
 assert.ok(bounds.max.z<-3,'header is recessed behind the opaque paper and dark rail');
 for(const ray of probes)assert.equal(ray.intersectObject(gltf.scene,true)[0]?.object,header,'backing occludes every rear aperture probe');
 for(const y of [2.34,2.38]){
  const hit=new THREE.Raycaster(new THREE.Vector3(.2,y,-1.7),new THREE.Vector3(0,0,-1)).intersectObject(gltf.scene,true)[0];
  assert.ok(hit&&hit.object!==header,'existing panel and rail stay in front of the new backing');
  assert.ok(bounds.max.z-hit.point.z<-.015,'visible front surfaces have at least 15 mm depth separation');
 }
 home.dispose();
});
test('entry, bedside and tea cushion remain accessible and inspection describes current bedding',()=>{
 const room=new THREE.Group(),colliders=[],actions=[],prompts=[];
 const home=buildTatamiHome({profile,room,box:(s,p,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...s),new THREE.MeshBasicMaterial({color:c}));m.position.fromArray(p);parent.add(m);return m;},collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),reg:(o,label,fn)=>prompts.push({label,fn}),action:(...a)=>actions.push(a),exit(){}});
 assert.deepEqual(homeLayoutFor(TATAMI_HOME_OWNER),TATAMI_HOME_LAYOUT);
 for(const p of [home.spawn,home.door,home.tableStand,home.bedside])assert.ok(!colliders.some(c=>circleHitsRect(p[0],p[2],.32,c)),String(p));
 home.tick(0,3*60);assert.equal(home.snapshot().futon.phase,'laid out');assert.equal(room.getObjectByName('LaidFuton').visible,true);
 const inspect=prompts.find(p=>p.label==='Inspect the futon cupboard');inspect.fn();assert.match(actions.at(-1)[2],/laid out/);
 home.tick(0,sleepHours(profile).wake+60);home.prepareBedding({g:new THREE.Group()},{move:()=>true},2);home.tick(2,sleepHours(profile).wake+60);assert.equal(home.snapshot().futon.phase,'stored');assert.equal(room.getObjectByName('LaidFuton').visible,false);
 home.dispose();
});
test('Mrs Sato walks to the cupboard to prepare bedding, then folds it before breakfast',async()=>{
 const {createHomeResidents}=await import('../src/people/home-residents.js');
 const street=new THREE.Group(),room=new THREE.Group(),g=new THREE.Group();street.add(g);g.position.set(profile.home[0],0,profile.home[1]);g.userData={name:profile.name,hit:{inside:false},indoors:'home'};
 const rects=[];const home=buildTatamiHome({profile,room,box:(s,p,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...s),new THREE.MeshBasicMaterial({color:c}));m.position.fromArray(p);parent.add(m);return m;},collider:(x,z,w,d)=>rects.push({x,z,w,d}),reg(){},action(){},exit(){}});
 const bounds=home.bounds,blocked=(x,z,r=.32)=>x<bounds.minX+r||x>bounds.maxX-r||z<bounds.minZ+r||z>bounds.maxZ-r||rects.some(c=>circleHitsRect(x,z,r,c));
 const actors=createHomeResidents({world:{people:[{profile,g}]},parent:room,collides:blocked});const {sleep,wake}=sleepHours(profile);
 home.tick(0,sleep-30);actors.enter({homeOwner:profile.name,homeLayouts:{[profile.name]:home}},sleep-30);
 let cupboardVisit=false;
 for(let i=0;i<900;i++){home.tick(1/30,sleep-10);actors.update(1/30,sleep-10);cupboardVisit ||= Math.hypot(g.position.x-2.05,g.position.z+1.4)<.2;assert.ok(!blocked(g.position.x,g.position.z),'bedding work stays on walkable floor');}
 assert.ok(cupboardVisit,'takes bedding from cupboard');assert.equal(home.snapshot().futon.phase,'laid out');assert.equal(home.snapshot().beddingActivity,null);
 for(let i=0;i<900;i++){home.tick(1/30,wake+16);actors.update(1/30,wake+16);}
 assert.equal(home.snapshot().futon.phase,'stored');assert.equal(home.snapshot().beddingActivity,null);
 actors.restore();home.dispose();
});
