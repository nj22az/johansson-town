import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createIslandBusinesses} from '../src/world/businesses.js';
import {createTown} from '../src/world/town.js';
import {assignWorkplaces} from '../src/people/workplaces.js';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {createBookshopCustomers} from '../src/people/bookshop-customers.js';
import {bookshopVisitPlan,BOOKSHOP_VISITS} from '../src/people/bookshop-visits.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {residentPlan} from '../src/people/social.js';
import {ACTIVE_RESIDENT_NAMES} from '../src/people/residents.js';
import {circleHitsRect} from '../physics.js';

// Since 22 October 2026 (the owner) Nhung is the island doctor and Sakura sells the books and the stationery: Front-Row's
// shop floor is unstaffed, the paper is printed at its back bench in the evening, and nobody browses there
// (bookshop-visits.js). The visits and the customers they brought in, tested here until then, are gone with it.
test('nobody browses at Front-Row any more: the visits leave every plan as it was',()=>{
 assert.deepEqual(Object.keys(BOOKSHOP_VISITS),[]);
 const work={place:'work',target:[0,0]};
 for(const name of ['Mrs Sato','Thao','Tetsuo','Harbour master','Nhung'])for(let m=0;m<7*1440;m+=15)assert.equal(bookshopVisitPlan({name},m,work),work,name+' at '+m);
});

test('over a week no resident’s plan takes them into the bookshop, and the customer service borrows nobody',()=>{
 installDOM();const sites=createIslandBusinesses(),scene=new THREE.Scene(),world=createTown({scene,sites,mobile:true,shadows:false,register(o,label,fn,inside){o.userData.hit={label,fn,inside};},enter(){},onAction(){}});assignWorkplaces(world,sites);
 const state={},ledger=createResidentLedger(()=>state);
 for(const person of world.people.filter(p=>ACTIVE_RESIDENT_NAMES.includes(p.profile.name)))for(let m=0;m<7*1440;m+=10)assert.notEqual(residentPlan(person.profile,m,false,state).place,'bookshop',person.profile.name+' at '+m);
 const room=new THREE.Group(),colliders=[];scene.add(room);const layout=buildCompactShop({site:sites.find(s=>s.id==='frontrow'),room,reg(){},collider:(x,z,w,d)=>colliders.push({x,z,w,d}),action(){},exit(){}});
 const service=createBookshopCustomers({world,parent:scene,getLayout:()=>layout,getPlayerPosition:()=>null,collides:(x,z,r=.3)=>colliders.some(c=>circleHitsRect(x,z,r,c)),getState:()=>state,ledger});
 service.enter(sites.find(s=>s.id==='frontrow'),600);
 for(let m=600;m<1200;m+=5){service.update(.1,m);assert.equal(world.people.filter(p=>p.g.userData.inBookshop).length,0,'nobody browsing at '+m);}
 assert.equal(state.bookshop?.sales?.length||0,0,'no sales at the old counter');
 service.restore();
});
