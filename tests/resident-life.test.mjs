import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {RESIDENTS} from '../src/people/residents.js';
import {residentPersonality,createResidentLedger} from '../src/people/resident-personalities.js';
import {createVenueService} from '../src/people/venue-service.js';
import {createTownActivities,townAffordance} from '../src/people/town-activities.js';
import {createCastAI} from '../src/people/schedules.js';
import {createIzakayaGuests} from '../src/people/izakaya-guests.js';
import {createWorkplaceResidents} from '../src/people/workplace-residents.js';

function person(name,parent=new THREE.Group(),work){
 const source=RESIDENTS.find(p=>p.name===name),profile=work?{...source,work}:source,g=new THREE.Group();g.userData={name,hit:{inside:false},visualReady:true};g.position.set(profile.work[0],0,profile.work[1]);parent.add(g);return {g,profile};
}
function marker(parent,label,x=0,z=0,inside=false){const o=new THREE.Object3D();o.position.set(x,1,z);o.userData.hit={label,inside,fn:()=>{throw Error('NPC called player action');}};parent.add(o);return o;}
const step=(service,seconds)=>{for(let i=0;i<seconds*60;i++)service.update(1/60);};

test('Minato serves actual beer and meals; the officer chooses tea and payments survive re-entry',()=>{
 const room=new THREE.Group(),state={yen:600},ledger=createResidentLedger(()=>state),kenji=person('Chin'),driver=person('Officer Mori'),nao=person('Thao');
 for(const [i,p] of [kenji,driver].entries()){p.g.position.set(i*1.5,0,-1.42);p.g.userData.inIzakaya=true;p.g.userData.seatHeight=.71;}
 nao.g.userData.inIzakaya=true;
 const options={room,place:'izakaya',getCustomers:()=>[kenji,driver],getStaff:()=>nao.g,getMinutes:()=>1100,ledger};
 const service=createVenueService(options);let beer=false,tea=false,eating=false;
 for(let i=0;i<55*60;i++){service.update(1/60);beer||=kenji.g.userData.heldItem==='beer';tea||=driver.g.userData.heldItem==='tea';eating||=kenji.g.userData.heldItem==='yakitori';}
 assert.ok(beer&&tea&&eating);assert.ok(room.getObjectByName('Minato drink · draft'),'the beer is a real Minato glass on the counter');assert.equal(residentPersonality('Officer Mori').drink,'tea');assert.equal(state.yen,600);
 assert.equal(state.residentLife.Chin.purchases.length,1);assert.equal(state.residentLife.Chin.meals.izakaya.finished,true);service.dispose();assert.equal(room.children.length,0);assert.equal(kenji.g.userData.heldItem,undefined);
 const again=createVenueService(options);step(again,10);assert.equal(state.residentLife.Chin.purchases.length,1);again.dispose();
});

test('all appropriate public interaction classes are available without executing player callbacks',()=>{
 const root=new THREE.Group();
 for(const [label,kind] of [['Read evening papers','read'],['Use telephone','phone'],['Play Star Port','arcade'],['Tune street radio','radio'],['Inspect post box','post'],['Inspect recycling bins','recycle'],['Buy newspaper · ¥80','shop'],['Fish from the outer pier','fish'],['Sit on bench','seat'],['Operate winch','machine'],['Inspect bicycle','inspect']])assert.equal(townAffordance(marker(root,label)).kind,kind);
 for(const label of ['Talk to Nhung','Enter Sakura','Step outside','Take the folio','Travel to the harbour'])assert.equal(townAffordance(marker(root,label)),null);
 assert.equal(townAffordance(marker(root,'Buy newspaper · ¥80')).item,'paper');
 // Whole words: a door ("Visit …", which holds "sit") is not a seat, and Mr Fujita's houseboat
 // ("use") and a utility cabinet ("bin") are not machines or recycling for residents to use.
 for(const label of ['Visit Grandmother Gushiken’s home','Visit Thuan & Thao’s home','Visit Rainflower Florist','Come into Minato Izakaya','Mr Fujita’s houseboat','Complete the airport radio service','Ride Thuan’s bicycle'])assert.equal(townAffordance(marker(root,label)),null,label);
 for(const [label,kind] of [['Inspect utility cabinet','inspect'],['Look at the farmhouse','inspect'],['Look round House to let','inspect'],['Sit on the quay bench','seat'],['Cool off on the bench','seat']])assert.equal(townAffordance(marker(root,label)).kind,kind,label);
});

test('residents walk to objects, reserve them, use them, yield to the player and preserve schedules and escort quests',()=>{
 const root=new THREE.Group(),kenji=person('Chin',root,[-4,-5.5]),tetsuo=person('Tetsuo',root,[-4,-5.5]),paper=marker(root,'Read workshop notice',-5.9,-5.5),state={inventory:[],yen:1000};
 tetsuo.g.position.copy(kenji.g.position);const player=new THREE.Group();player.position.set(20,0,20);
 const activity=createTownActivities({getTargets:()=>[paper],collides:()=>false,getPlayerPosition:()=>player.position,getState:()=>state,ledger:createResidentLedger(()=>state)});
 // Tetsuo keeps the bench by day (Chin is the ferry's motorman until he signs off, social.js), so he is the one at work at five.
 const world={people:[tetsuo],homes:new Map()},ai=createCastAI({world,player,state:()=>state,paused:()=>false,collides:()=>false,activities:activity});
 let sawWalking=false,sawReading=false;
 for(let i=0;i<22*60;i++){ai.update(1/60,1025+i/60,false);sawWalking||=activity.stateFor(tetsuo)?.phase==='walking';sawReading||=tetsuo.g.userData.socialPose==='Read';}
 assert.ok(sawWalking&&sawReading);assert.equal(state.yen,1000);assert.ok(state.residentLife.Tetsuo.activities.length);
 activity.release(tetsuo,1047);tetsuo.g.position.copy(kenji.g.position);
 const base={place:'work',target:[-4,-5.5],activity:'working'};kenji.g.position.set(-4.4,0,-5.5);
 activity.plan(kenji,base,1040,false,.1);activity.plan(kenji,base,1060,false,.1);
 activity.plan(tetsuo,base,1040,false,.1);activity.plan(tetsuo,base,1060,false,.1);
 assert.notEqual(!!activity.stateFor(kenji),!!activity.stateFor(tetsuo),'A single object cannot have two owners');
 const owner=activity.stateFor(kenji)?kenji:tetsuo;player.position.copy(paper.position);activity.plan(owner,base,1060.1,false,.1);assert.equal(paper.userData.reservedBy,undefined);assert.equal(owner.g.userData.usingTownObject,undefined);
 player.position.set(20,0,20);state.kenjiEscort='walking';assert.equal(activity.plan(kenji,base,1100,false,.1),base);assert.equal(activity.stateFor(kenji),undefined);
 activity.dispose();assert.equal(paper.userData.reservedBy,undefined);
});

test('inaccessible objects time out and never hold a reservation or bill indefinitely',()=>{
 const root=new THREE.Group(),p=person('Chin',root,[-4,-5.5]),object=marker(root,'Buy canned tea · ¥120',-6.5,-5.5),state={};
 const activity=createTownActivities({getTargets:()=>[object],collides:()=>false,ledger:createResidentLedger(()=>state)}),base={place:'work',target:p.profile.work,activity:'working'};
 activity.plan(p,base,1000,false,.1);activity.plan(p,base,1010,false,.1);assert.ok(activity.stateFor(p));
 activity.plan(p,base,1050,false,.1);assert.equal(activity.stateFor(p),undefined);assert.equal(state.residentLife.Chin.purchases.length,0);assert.equal(object.userData.reservedBy,undefined);
});

test('izakaya arrivals keep existing chairs and workplace staff return to the same street actors',()=>{
 const street=new THREE.Group(),parent=new THREE.Group(),world={people:RESIDENTS.map(p=>person(p.name,street)),homes:new Map()};
 const guests=createIzakayaGuests({world,parent});guests.sync(1098);const before=new Map(world.people.filter(p=>p.g.userData.inIzakaya).map(p=>[p,p.g.position.clone()]));guests.sync(1112);
 for(const [p,position] of before)if(p.g.userData.inIzakaya)assert.ok(position.equals(p.g.position),'Existing guests are not shuffled by new arrivals');guests.restore();
 const desk=marker(parent,'Read repair ledger',-2,0,true),player=new THREE.Vector3(0,0,4),state={};
 // The workshop's daytime worker is Tetsuo (Chin is aboard the ferry by day, social.js).
 const kenji=world.people.find(p=>p.profile.name==='Tetsuo');kenji.profile={...kenji.profile,workSite:'form3d'};kenji.g.userData.indoors='work';
 const workers=createWorkplaceResidents({world,parent,getEntrance:()=>[0,0,4.5],getTargets:()=>[desk],collides:(x,z,r)=>Math.abs(x)+r>5||Math.abs(z)+r>5,getPlayerPosition:()=>player,getState:()=>state,ledger:createResidentLedger(()=>state)});
 workers.enter({id:'form3d',title:'Chin’s Workshop'},1025);assert.equal(kenji.g.parent,parent);let used=false;
 for(let i=0;i<30*60;i++){workers.update(1/60,1025+i/60,false);used||=kenji.g.userData.socialPose==='Read';assert.ok(Math.abs(kenji.g.position.x)<5&&Math.abs(kenji.g.position.z)<5);}
 assert.ok(used);workers.restore();assert.equal(kenji.g.parent,street);assert.equal(kenji.g.userData.inWorkplace,undefined);assert.equal(desk.userData.reservedBy,undefined);
});
