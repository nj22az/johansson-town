import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {installDOM} from './fixtures.mjs';
import {createShopGlass,prepareIzakayaGlass} from '../src/world/shop-glass.js';
import {DINING,restaurantPoint,restaurantApproach,izakayaPlot,IZAKAYA_DOOR} from '../src/world/dining-layout.js';
import {SAKURA_FRONT} from '../src/world/interiors/sakura-layout.js';
import {buildStorefront} from '../src/world/storefront.js';
import {RESIDENTS} from '../src/people/residents.js';
import {MAIN_ROAD} from '../src/world/main-road.js';
import {WEST_SHOPS} from '../src/world/west-shops.js';

function assertGlass(material,maxOpacity=.06){
 assert.equal(material.color.getHex(),0xffffff);
 assert.equal(material.transparent,true);
 assert.ok(material.opacity>0&&material.opacity<=maxOpacity);
 assert.equal(material.depthWrite,false);
 assert.equal(material.side,THREE.DoubleSide);
 assert.equal(material.toneMapped,false);
 assert.equal(material.map,null);
}

test('shop glass is neutral, translucent and does not hide the room',()=>{
 assertGlass(createShopGlass());
});

test('only the measured izakaya panes become glass; walls and neon keep their materials',async()=>{
 installDOM();
 const beforeSelf=globalThis.self,beforeBitmap=globalThis.createImageBitmap;
 globalThis.self=globalThis;
 globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});
 try{
  const bytes=await readFile(new URL('../assets/models/izakaya/minato-benmaher-exterior.glb',import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let building;scene.traverse(o=>{if(o.isMesh&&o.material.name==='BenMaher building PBR')building=o;});
  assert.ok(building);
  const originalMaterial=building.material,originalIndex=building.geometry.index.count;
  assert.equal(prepareIzakayaGlass(scene),10);
  const panes=scene.getObjectByName('Minato clear window panes');
  assert.ok(panes);assertGlass(panes.material);
  assert.equal(panes.geometry.index.count,30);
  assert.equal(building.geometry.index.count,originalIndex-30);
  assert.equal(building.material,originalMaterial);
  assert.equal(building.material.transparent,false);
  assert.equal(panes.castShadow,false);
  assert.equal(panes.receiveShadow,false);
  const count=scene.children.length;
  assert.equal(prepareIzakayaGlass(scene),10);
  assert.equal(scene.children.length,count,'Repeated preparation must not duplicate glass');
 }finally{globalThis.self=beforeSelf;globalThis.createImageBitmap=beforeBitmap;}
});

test('an unexpected izakaya asset is not made transparent',()=>{
 const scene=new THREE.Group();
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({name:'BenMaher building PBR'}));
 scene.add(mesh);const geometry=mesh.geometry;
 assert.equal(prepareIzakayaGlass(scene),0);
 assert.equal(mesh.geometry,geometry);
 assert.equal(scene.children.length,1);
 assert.equal(mesh.material.transparent,false);
});

test('Sakura keeps its full-size frontage and lightly hazed, see-through street glazing',()=>{
 installDOM();
 const parent=new THREE.Group(),site={id:'market',side:-1,z:-28,title:'Sakura'};
 const facade=buildStorefront({parent,site,label(){},register(){},enter(){},placement:{x:-7.45,z:-28,yaw:Math.PI/2,scale:1}});
 assert.deepEqual(facade.scale.toArray(),[1,1,1]);
 const panes=facade.children.filter(o=>o.userData.clearWindow);
 assert.equal(panes.length,3);panes.forEach(o=>{assertGlass(o.material,.15);assert.equal(o.material.opacity,.12);});
});


test('on the island Minato leaves a passage beside the bookshop and clears the konbini',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../assets/models/izakaya/benmaher-manifest.json',import.meta.url)));
 const corners=key=>[manifest.bounds.min[0],manifest.bounds.max[0]]
  .flatMap(x=>[manifest.bounds.min[2],manifest.bounds.max[2]].map(z=>restaurantPoint('izakaya',x,z)[key]));
 try{
  izakayaPlot();
  const northGable=Math.max(...corners(1)),southGable=Math.min(...corners(1)),eastFace=Math.max(...corners(0));
  // Include the outer corner posts (.24 m beyond the nominal footprint).
  const books=WEST_SHOPS.frontrow,booksSouthWall=books.z-books.width/2-.24;
  assert.ok(northGable<booksSouthWall,'Minato is inside the bookshop');
  const passageWidth=booksSouthWall-northGable;
  assert.ok(passageWidth>=3&&passageWidth<3.5,'Keep the three-metre passage to the west yard');
  // and clear of the fourteen-metre konbini it used to stand inside.
  assert.ok(southGable>-26.8+SAKURA_FRONT.width/2,'Minato is inside the konbini');
  // and still set back off the footway rather than standing on it.
  assert.ok(eastFace<MAIN_ROAD.pavementWest,'Minato stands on the pavement');

  // Everything that holds the door holds the same array, so it moved with the plot.
  assert.equal(IZAKAYA_DOOR[1],izakayaPlot().z);
  assert.deepEqual(RESIDENTS.find(p=>p.name==='Thao').work,IZAKAYA_DOOR);
  assert.deepEqual(RESIDENTS.find(p=>p.name==='Thuan').evening,restaurantApproach('izakaya'));
 }finally{}
});
