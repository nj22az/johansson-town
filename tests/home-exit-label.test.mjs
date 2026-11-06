import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildIslandHomes} from '../src/world/island-homes.js';
import {RESIDENTS} from '../src/people/residents.js';
import {buildResidentHome} from '../src/world/interiors/resident-home.js';
import {homeExitLabel} from '../src/world/interiors/home-exit-label.js';
import {TATAMI_HOME_LAYOUT} from '../src/world/interiors/tatami-home-layout.js';
import {installDOM} from './fixtures.mjs';

test('Mrs Sato’s actual registered home exit names the Kitahama landing outside',()=>{
 installDOM();
 const sites=[];buildIslandHomes({group:new THREE.Group()},{sites});
 const site=sites.find(s=>s.homeOwner==='Mrs Sato'),profile=RESIDENTS.find(p=>p.name==='Mrs Sato');
 assert.equal(site.plot,'kitahama-2');assert.match(profile.homeAddress,/Kitahama/);
 const prompts=[],room=new THREE.Group(),exit=()=>{};
 const home=buildResidentHome({site,profile,room,box:(s,p,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...s),new THREE.MeshBasicMaterial({color:c}));m.position.fromArray(p);parent.add(m);return m;},collider(){},action(){},reg:(o,label,fn)=>prompts.push({o,label,fn}),exit});
 const prompt=prompts.find(p=>p.fn===exit);
 assert.equal(prompt.label,'Exit to Kitahama');
 assert.deepEqual(prompt.o.position.toArray(),TATAMI_HOME_LAYOUT.exit,'Only the wording changes');
 home.dispose();
});

test('home exit labels follow relocated site metadata before legacy addresses',()=>{
 for(const plot of ['kitahama-1','kitahama-5','kitahama-12'])assert.equal(homeExitLabel({plot},{homeAddress:'3 Main Street'}),'Exit to Kitahama');
 for(const id of ['resident-home-kenji'])assert.equal(homeExitLabel({id},{homeAddress:'1 Main Street'}),'Exit to Front-Row yard');
 assert.equal(homeExitLabel(null,RESIDENTS.find(p=>p.name==='Mrs Sato')),'Exit to Kitahama');
 assert.equal(homeExitLabel(null,{homeAddress:'4 Main Street'}),'Exit to Main Street');
 assert.equal(homeExitLabel(null,{homeAddress:'Workplace room'}),'Exit to the street');
});
