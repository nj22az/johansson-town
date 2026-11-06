import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildMayorHome,buildCommunityKitchen} from '../src/world/interiors/town-hall.js';
import {createHomeCustomization,HOME_CUSTOMIZATION_PLACEMENT} from '../src/world/interiors/home-customization.js';
import {createNavigation} from '../src/people/navmesh.js';
import {circleHitsRect} from '../physics.js';
import {restoreHomeDecor,setHomeDecor,unlockedHomeKeepsakes} from '../src/progression/home-decor.js';
import {createActivities} from '../activities.js';
import {slotKey,addPlayer,DEFAULT_PLAYER} from '../src/save.js';

test('home choices survive saving and player switching; earned decorations cannot be equipped early',()=>{
 const ui=installDOM();let activities=createActivities({say(){},onTime(){},onWeather(){}}),state=activities.state;
 assert.deepEqual(unlockedHomeKeepsakes(state).map(i=>i.id),['postcard']);
 assert.equal(setHomeDecor(state,'keepsake','cat'),false);
 assert.equal(setHomeDecor(state,'wall','harbour'),true);assert.equal(setHomeDecor(state,'textile','leaf'),true);
 state.quest=3;state.fish=1;state.kenjiEscort='done';assert.equal(setHomeDecor(state,'keepsake','cat'),true);activities.save();
 const saved=localStorage.getItem(slotKey(DEFAULT_PLAYER.id));activities=createActivities({say(){},onTime(){},onWeather(){}});
 assert.deepEqual(activities.state.homeDecor,{wall:'harbour',textile:'leaf',keepsake:'cat'});
 addPlayer(localStorage,'Second neighbour');
 activities=createActivities({say(){},onTime(){},onWeather(){}});assert.deepEqual(activities.state.homeDecor,restoreHomeDecor());
 assert.deepEqual(JSON.parse(localStorage.getItem(slotKey(DEFAULT_PLAYER.id))).homeDecor,JSON.parse(saved).homeDecor,'Creating a player retains the first player’s room');
 assert.deepEqual(restoreHomeDecor({wall:'invalid',textile:null,keepsake:'script'}),restoreHomeDecor());
});

test('physical decoration changes only the player room and keeps clear of the doorway',()=>{
 installDOM();const room=new THREE.Group(),office=new THREE.Group(),hits=[];
 buildMayorHome({room,reg(){},action(){}});buildCommunityKitchen({room:office,reg(){},action(){}});
 const officeColours=[];office.traverse(o=>{if(o.isMesh)officeColours.push(o.material.color.getHex());});
 const state={homeDecor:restoreHomeDecor(),quest:0,fish:0},menus=[];let saves=0;
 const decor=createHomeCustomization({room,state,reg:(o,label,fn)=>hits.push({o,label,fn}),menu:(...a)=>menus.push(a),close(){},save(){saves++;}});
 hits[0].fn();menus.at(-1)[2].find(([label])=>label==='Wall colour')[1]();menus.at(-1)[2].find(([label])=>label==='Garden green')[1]();
 assert.equal(saves,1);assert.equal(decor.snapshot().wall,'garden');
 const linings=[];room.getObjectByName('Mayor’s home').traverse(o=>{if(o.isMesh&&o.name==='Upper wall')linings.push(o);});
 assert.ok(linings.length>=6,'The living room’s walls are lined over the dado');
 for(const m of linings)assert.equal(m.material.color.getHex(),0xdde5cb,'The selected colour is on every wall of the living room, over the window too');
 const after=[];office.traverse(o=>{if(o.isMesh)after.push(o.material.color.getHex());});assert.deepEqual(after,officeColours,'Shared shell materials are never recoloured');
 assert.equal(room.getObjectByName('Tama clay cat').visible,false);
 state.quest=3;assert.equal(setHomeDecor(state,'keepsake','cat'),true);decor.snapshot();assert.equal(room.getObjectByName('Tama clay cat').visible,true);assert.equal(room.getObjectByName('Swedish harbour postcard').visible,false);
 const shelf=new THREE.Box3().setFromObject(room.getObjectByName('Earned keepsake shelf'));
 assert.ok(shelf.min.x>-5.8&&shelf.max.x<-5.3&&shelf.min.z>3.3&&shelf.max.z<4.3,'Every keepsake stays on the living room’s west wall, between the window’s corner and the photograph');
});

test('the keepsake display faces the living room and its control can be walked to from the front door',()=>{
 installDOM();const room=new THREE.Group(),all=[],hits=[];
 const layout=buildMayorHome({room,reg(){},action(){},collider:(x,z,w,d,height=2.8,minY=0)=>all.push({x,z,w,d,height,minY})});
 // The ground floor's walls and furniture: the storeys over and under it are not in the way.
 const colliders=all.filter(c=>c.minY+c.height>.01&&c.minY<2);
 createHomeCustomization({room,state:{homeDecor:restoreHomeDecor()},reg:(o,label)=>hits.push({o,label}),menu(){},close(){},save(){}});
 room.updateMatrixWorld(true);
 const anchor=hits.find(h=>h.label==='Decorate your home').o;
 assert.deepEqual(anchor.position.toArray(),HOME_CUSTOMIZATION_PLACEMENT.anchor);
 // The player's own radius (game.js PLAYER_RADIUS): the house's doorways are the drawings' 0.8 m.
 const bounds=layout.bounds,blocked=(x,z,r=.28)=>x<bounds.minX+r||x>bounds.maxX-r||z<bounds.minZ+r||z>bounds.maxZ-r||colliders.some(c=>circleHitsRect(x,z,r,c));
 assert.equal(blocked(anchor.position.x,anchor.position.z),false,'A full player body fits at the decoration control');
 // Walked as he walks it, at his own radius: the route from the front door to the control and back is clear all the way
 // (every 5 cm of it), through the drawings' 0.8 m doorways, and keeps out of the east rooms.
 const nav=createNavigation(blocked,{step:.1,heightAt:()=>0,bounds,radius:.28});
 const door=[layout.spawn[0],layout.spawn[2]],control=[anchor.position.x,anchor.position.z];
 for(const [from,to] of [[door,control],[control,door]]){
  const route=[from,...nav.path({x:from[0],z:from[1]},{x:to[0],z:to[1]})];
  assert.ok(route.length>2&&Math.hypot(route.at(-1)[0]-to[0],route.at(-1)[1]-to[1])<.15,'Reach the decoration control and return through the normal doorways');
  for(let i=1;i<route.length;i++){const [ax,az]=route[i-1],[bx,bz]=route[i],n=Math.ceil(Math.hypot(bx-ax,bz-az)/.05);
   for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;assert.equal(blocked(x,z),false,'The doorway-to-control path clears all room furniture and partitions');assert.ok(x<1.3,'The route keeps out of the sewing studio and the WC');}}
 }
 const ray=new THREE.Raycaster(new THREE.Vector3(anchor.position.x,1.44,anchor.position.z),new THREE.Vector3(-1,0,0));
 const visible=ray.intersectObjects(room.children,true).filter(h=>h.object.visible&&h.object.isMesh);
 assert.equal(visible[0]?.object.name,'Postcard sea','The postcard artwork is in front of its frame and faces the accessible main room');
});
