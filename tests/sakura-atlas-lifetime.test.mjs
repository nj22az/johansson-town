import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildSakuraOfficeRoom} from '../src/world/interiors/sakura-office-room.js';
import {mountTradePosters} from '../src/world/interiors/sakura-trade-posters.js';

const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const start=source.indexOf('function clearRoom('),end=source.indexOf('\nfunction roomShell(',start);
assert.ok(start>=0&&end>start,'exercise the actual room cleanup');
const clear=source.slice(start,end),noop=()=>{},service={restore:noop,cancel:noop,hide:noop};
function clearActualRoom(room){
 const context={room,johansson:null,townSections:{invalidate:noop},shopStreetView:{dispose:noop},indoorCeilings:null,
  activeRoomLayout:null,sakuraShop:{hide:noop},showShopThroughWindow:noop,izakayaTV:null,
  storeService:null,ramenPlayerService:null,venueService:null,beerService:null,workplaceResidents:service,
  bookshopCustomers:service,neighbourChats:service,chatBubble:service,izakayaGuests:service,
  onsenGuests:service,hideRamen:noop,homeGuests:service,roomColliders:[],interactables:[],boxCache:new Map()};
 vm.runInNewContext(clear+'\nclearRoom();',context);
 assert.equal(room.children.length,0,'the closed office still releases all its objects');
}

test('repeated office cleanup preserves the live shop atlas while releasing each office’s own resources',()=>{
 installDOM();
 const storefront=new THREE.Group();
 mountTradePosters('stockroom',{parent:storefront,register:noop,onView:noop});
 const livePaper=storefront.getObjectByName('Sakura trade posters · stockroom'),poster=livePaper.material.map;
 const disposed={poster:0,cases:0};poster.addEventListener('dispose',()=>disposed.poster++);
 let cases=null;
 for(let visit=0;visit<5;visit++){
  const office=new THREE.Group();buildSakuraOfficeRoom({room:office,reg:noop,action:noop,collider:noop});
  const paper=office.getObjectByName('Sakura trade posters · office'),hall=office.getObjectByName('Sakura trade posters · hall');
  assert.equal(paper.material.map,poster);assert.equal(hall.material.map,poster,'both storeys borrow one atlas');
  const stock=office.getObjectByName('Hall stock case prints');
  if(!cases){cases=stock.material.map;cases.addEventListener('dispose',()=>disposed.cases++);}
  assert.equal(stock.material.map,cases,'case artwork is cached across visits');
  // Shared paint does not make the room’s materials/geometry shared: those must still be disposed.
  const owned={paperMaterial:0,paperGeometry:0,texture:0};
  paper.material.addEventListener('dispose',()=>owned.paperMaterial++);
  paper.geometry.addEventListener('dispose',()=>owned.paperGeometry++);
  const texture=new THREE.Texture();texture.addEventListener('dispose',()=>owned.texture++);
  office.add(new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshStandardMaterial({map:texture})));
  clearActualRoom(office);
  assert.deepEqual(disposed,{poster:0,cases:0},'room cleanup must not evict cached paint used by persistent Sakura');
  assert.deepEqual(owned,{paperMaterial:1,paperGeometry:1,texture:1},'room-owned allocations are still released');
  assert.equal(livePaper.material.map,poster);assert.equal(livePaper.parent,storefront,'the live storefront survives');
 }
});
