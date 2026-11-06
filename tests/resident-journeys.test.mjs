import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {createNeighbours,NEIGHBOURS} from '../src/people/neighbours.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {activeResidentHome} from '../src/people/home-directory.js';
import {createColliderGrid} from '../src/world/collider-grid.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {groundHeight,planHeight,setWalkSurface} from '../src/world/layout.js';
import {standingHitsRect,townBoundsBlocked} from '../physics.js';

installDOM();globalThis.self=globalThis;
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
// The surface reaches the terminal quay (z −73.4), where the commuters land off the boat (social.js transitStop).
const surface=createWalkSurface({minX:-45,maxX:50,minZ:-78,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
const grid=createColliderGrid(world.colliders),blocked=(x,z,r=.3)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
for(const spec of NEIGHBOURS)test(spec.name+' completes authored street journeys, sleeps and leaves next morning with town hidden',()=>{
 const parent=new THREE.Group();parent.visible=false;
 const system=createNeighbours({parent,blocked,register(o){o.userData.hit={inside:false};}});
 const person=system.people.find(p=>p.spec.name===spec.name);system.people.splice(0,system.people.length,person);
 const home=activeResidentHome(spec.name).target;person.g.position.set(home.x,groundHeight(home.x,home.z),home.z);person.initialised=true;
 let key=null;
 for(let m=0;m<=1440+720;m+=15){
  const plan=canonicalDay(spec.name,m),next=plan.place+':'+plan.target.join(',');if(next===key)continue;key=next;
  let arrived=false;
  // Hold each destination long enough to assess the actual route independently
  // of time compression. The postman's working round is tested separately.
  for(let i=0;i<9000;i++){
   const before=person.g.position.clone();system.update(.1,m);
   assert.ok(person.g.position.distanceTo(before)<.24,spec.name+' moves continuously');
   // A home up an indoor stair (neighbours.js STAIR_HOMES) is reached upstairs, not at the doorway at its foot.
   const reached=spec.stair&&plan.place==='home'?person.g.userData.indoors==='home':Math.hypot(person.g.position.x-plan.target[0],person.g.position.z-plan.target[1])<.35;
   if(reached){arrived=true;break;}
   if(spec.walk&&plan.place==='main-street'){arrived=true;break;}
  }
  assert.ok(arrived,spec.name+' cannot reach '+plan.place+' at '+m+'; position '+person.g.position.toArray()+' target '+plan.target);
  if(plan.place==='home'){assert.equal(person.g.visible,false);assert.equal(person.g.userData.indoors,'home');if(plan.rest==='sleep')assert.equal(person.g.userData.sleeping,true);}
 }
 setWalkSurface(surface);
});

import {WORLD_CAST} from '../src/people/residents.js';
import {createCastAI} from '../src/people/schedules.js';
import {residentPlan} from '../src/people/social.js';
for(const profile of WORLD_CAST.filter(p=>p.name!=='Barfly'))test(profile.name+' reaches home and daily indoor destinations against runtime street colliders',()=>{
 const parent=new THREE.Group();parent.visible=false;const g=new THREE.Group();g.userData={name:profile.name,hit:{inside:false}};parent.add(g);
 const person={g,profile},state={inventory:[],residentLocations:{[profile.name]:{position:profile.home,indoors:'home'}}};
 // This is the exact predicate used by game.js for the main schedule controller.
 const runtimeBlocked=(x,z,r)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
 const system=createCastAI({world:{people:[person],homes:new Map()},player:new THREE.Vector3(100,0,100),state:()=>state,paused:()=>false,collides:runtimeBlocked});
 let key=null;
 for(let m=0;m<=1440+720;m+=15){
  const plan=residentPlan(profile,m,false,state,false),next=plan.place+':'+plan.target.join(',');if(next===key)continue;key=next;
  const indoor=['home','bookshop','izakaya','ramen','market','onsen'].includes(plan.place)||plan.place==='work'&&profile.workSite;
  for(let i=0;i<9000;i++){
   system.update(.1,m,false);
   if(!indoor||g.userData.indoors===plan.place)break;
  }
  if(indoor)assert.equal(g.userData.indoors,plan.place,profile.name+' cannot reach '+plan.place+' at '+m+'; position '+g.position.toArray()+' target '+plan.target);
 }
});

test('main residents complete simultaneous home/work changes while their town is hidden',()=>{
 const parent=new THREE.Group();parent.visible=false;
 const people=WORLD_CAST.filter(p=>p.name!=='Barfly').map(profile=>{const g=new THREE.Group();g.userData={name:profile.name,hit:{inside:false}};parent.add(g);return {g,profile};});
 const state={inventory:[],residentLocations:Object.fromEntries(people.map(p=>[p.profile.name,{position:p.profile.home,indoors:'home'}]))};
 const system=createCastAI({world:{people,homes:new Map()},player:{position:new THREE.Vector3(100,0,100)},state:()=>state,paused:()=>false,collides:(x,z,r)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c))});
 for(const m of [720,1260,145,620,2160]){
  const expected=people.map(p=>({p,plan:residentPlan(p.profile,m,false,state)})).filter(({p,plan})=>['home','bookshop','izakaya','ramen','market','onsen'].includes(plan.place)||plan.place==='work'&&p.profile.workSite);
  let arrived=false;
  for(let i=0;i<9000;i++){system.update(.1,m,false);if(expected.every(({p,plan})=>p.g.userData.indoors===plan.place)){arrived=true;break;}}
  assert.ok(arrived,'Unfinished journeys at '+m+': '+expected.filter(({p,plan})=>p.g.userData.indoors!==plan.place).map(({p,plan})=>p.profile.name+' to '+plan.place+' at '+p.g.position.toArray()).join('; '));
 }
});
