import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {lookTargetsNear} from '../src/ui/look-viewer.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {createActivities} from '../activities.js';
import {installDOM} from './fixtures.mjs';

// The owner, 28 November 2026: "When looking at something it should show an enlarged view like the item viewer in Sakura
// ... when I look at the poster in the workshop now it only shows text". A Look shows the thing itself: the meshes round
// the prompt, not the wall it hangs on nor what stands across the room.
test('a Look picks the thing at the prompt: the poster and its pins, not the wall, not the bench across the room',()=>{
 const room=new THREE.Group(),mat=new THREE.MeshBasicMaterial();
 const wall=new THREE.Mesh(new THREE.BoxGeometry(6,3,.1),mat);wall.name='Wall';wall.position.set(0,1.5,-.05);
 const poster=new THREE.Group();poster.name='Poster';poster.position.set(.5,1.6,.01);
 const print=new THREE.Mesh(new THREE.PlaneGeometry(.6,.85),mat);print.name='Poster print';poster.add(print);
 for(const [x,y] of [[-.28,.4],[.28,.4],[-.28,-.4],[.28,-.4]]){const pin=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.006),mat);pin.name='Drawing pin';pin.position.set(x,y,.004);poster.add(pin);}
 const bench=new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,.6),mat);bench.name='Bench';bench.position.set(.5,.45,3);
 // (a prompt's point stands a hand in front of what it is for: the workshop poster's 5 cm, Umi-no-yu's boiler 20 cm)
 const anchor=new THREE.Object3D();anchor.position.set(.5,1.6,.25);
 room.add(wall,poster,bench,anchor);
 const names=lookTargetsNear(room,anchor.getWorldPosition(new THREE.Vector3()),{anchor}).map(m=>m.name).sort();
 assert.deepEqual(names,['Drawing pin','Drawing pin','Drawing pin','Drawing pin','Poster print']);
});

test('a Look goes to the viewer when it can show the thing, and to the words alone when it cannot',()=>{
 installDOM();const seen=[];let show=true;
 const a=createActivities({say(){},onLook:(name,detail)=>{seen.push([name,detail]);return show;}});
 a.action('inspect','The Jonsson poster','A print of a Jonsson outboard.');
 assert.deepEqual(seen,[['The Jonsson poster','A print of a Jonsson outboard.']]);
 assert.equal(a.paused,false,'no text card over the viewer');
 show=false;a.action('inspect','A blank wall','Nothing to hold up.');
 assert.equal(seen.length,2);assert.equal(a.paused,true,'the words, when there is nothing to show');
});

// The workshop's wall is merged after it is built (chin-wall.js bake): its poster is a few triangles in one big mesh of
// prints. A Look cuts out the part at the prompt.
test('in a merged wall, a Look cuts out the poster\'s own triangles, not the far board in the same mesh',()=>{
 const room=new THREE.Group(),map=new THREE.Texture(),mat=new THREE.MeshBasicMaterial({map});
 const poster=new THREE.PlaneGeometry(.6,.85).translate(.5,1.6,0),board=new THREE.PlaneGeometry(1.2,.8).translate(3,1.5,0);
 const merged=new THREE.Mesh(mergeGeometries([poster,board],false),mat);merged.name='Wall, merged prints';room.add(merged);
 const anchor=new THREE.Object3D();anchor.position.set(.5,1.6,.05);room.add(anchor);
 const found=lookTargetsNear(room,anchor.getWorldPosition(new THREE.Vector3()),{anchor});
 assert.equal(found.length,1);assert.equal(found[0].userData.cutOut,true);
 const box=new THREE.Box3().setFromBufferAttribute(found[0].geometry.attributes.position);
 assert.ok(Math.abs(box.min.x-.2)<1e-6&&Math.abs(box.max.x-.8)<1e-6,'only the poster: '+box.min.x+'..'+box.max.x);
});
