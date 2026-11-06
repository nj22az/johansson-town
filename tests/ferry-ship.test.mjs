import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_GA,FERRY_ACCESS,FERRY_CAR_PLACES,FERRY_TRUCK_PLAN,FERRY_MACHINERY,FERRY_ELECTRICS,FERRY_LOADS,FERRY_CONDITIONS,FERRY_SUPPLY,
 FERRY_SAFETY,FERRY_MANNING,FERRY_SCENARIOS,ferryDemand,ferrySupplyKW,thrusterMayStart,preferenceShed,motorAmps,gaSpace,toShip,rollPeriod} from '../src/world/ferry-ship.js';
import {buildFerryModel,halfBreadth,keelY,WL,FERRY_RAMP,FERRY_HULL,FERRY_DECKS,FERRY_WALK,GANGWAY_Z} from '../src/world/ferry-model.js';
import {FERRY_CREW,FERRY_SHORE,FERRY_WATCH,crewFor,crewDoing,crewOnDuty,deckHandFor,FERRY_PEOPLE} from '../src/people/ferry-crew.js';
import {ISLAND_HOUSEHOLDS} from '../src/people/island-households.js';
import {VEHICLE_SIZE} from '../src/world/road-vehicles.js';

const near=(a,b,tol)=>Math.abs(a-b)<=tol;

test('the bigger Minato Maru: a 199-ton class island car ferry whose numbers agree with each other',()=>{
 const S=FERRY_SHIP;
 assert.equal(S.name,'Minato Maru');assert.equal(S.length,34.5);assert.equal(S.beam,8.4);assert.equal(S.grossTons,199);
 assert.ok(near(S.depth,S.draft+S.freeboard,1e-9),'depth is draft plus freeboard');
 assert.ok(S.length/S.beam>3.5&&S.length/S.beam<4.5,'a ferry’s proportions');assert.ok(S.lengthBP<S.length);
 // Displacement from her block coefficient in sea water, and what she can carry.
 assert.ok(near(S.blockCoefficient*S.lengthBP*S.beam*S.draft*1.025,S.displacement,S.displacement*.02));
 assert.equal(S.deadweight,S.displacement-S.lightship);
 assert.equal(S.passengers+S.crew,FERRY_SAFETY.persons);
 // Heights: the car deck 1.1 m above the water; the masthead light at least 6 m and one breadth above the hull (COLREGs Annex I).
 const H=FERRY_HEIGHTS;assert.ok(near(H.carDeck-S.draft,S.freeboard,1e-9));
 assert.ok(H.mastheadLight-H.carDeck>=Math.max(6,S.beam));assert.ok(H.carDeck<H.passengerDeck&&H.passengerDeck<H.bridgeDeck&&H.bridgeDeck<H.compassDeck&&H.compassDeck<H.mastTop);
 assert.ok(H.passengerDeck-H.carDeck-.2>=S.vehicleMix.clearHeight,'4.2 m clear under the passenger deck');
 // The model's frame: her midships at the waterline.
 assert.deepEqual(toShip([0,S.draft,S.length/2]),[0,0,0]);
 assert.ok(rollPeriod()>5&&rollPeriod()<7,'a small stiff ferry rolls in five to seven seconds');
});

test('her general arrangement: every space inside her hull, none on top of another, each with a reason and its ways out',()=>{
 const S=FERRY_SHIP,ids=new Set(FERRY_GA.map(s=>s.id));assert.equal(ids.size,FERRY_GA.length,'unique spaces');
 for(const s of FERRY_GA){
  assert.ok(s.what.length>10,s.id+' says what is in it');
  assert.ok(s.z[0]<s.z[1]&&s.x[0]<s.x[1]&&s.y[0]<s.y[1],s.id);
  if(!s.opening)assert.ok(s.z[0]>=0&&s.z[1]<=S.length,s.id+' inside her length');
  assert.ok(Math.abs(s.x[0])<=S.beam/2&&Math.abs(s.x[1])<=S.beam/2,s.id+' inside her breadth');
  for(const e of s.exits||[])assert.ok(ids.has(e)||e in FERRY_ACCESS,s.id+': exit '+e);
 }
 // Spaces that overlap must be one inside the other (the control booth in the engine room), or on different levels.
 const overlap=(a,b)=>Math.min(a.z[1],b.z[1])-Math.max(a.z[0],b.z[0])>.01&&Math.min(a.x[1],b.x[1])-Math.max(a.x[0],b.x[0])>.01&&Math.min(a.y[1],b.y[1])-Math.max(a.y[0],b.y[0])>.01;
 for(const a of FERRY_GA)for(const b of FERRY_GA)if(a.id<b.id&&overlap(a,b))assert.ok(a.within===b.id||b.within===a.id,`${a.id} and ${b.id} overlap`);
 // Where people work, sit or sleep there are two ways out, or one into a space that has two.
 for(const s of FERRY_GA.filter(s=>s.exits&&!s.unmanned)){const two=s.exits.length>=2||s.exits.some(e=>(gaSpace(e)?.exits||[]).length>=2);assert.ok(two,s.id+' has two ways out');}
 for(const id of ['engine-room','saloon','carpet-room','lobby','car-deck','wheelhouse','open-deck'])assert.ok(gaSpace(id).exits.length>=2,id);
 // A hundred passengers have a place: 36 in the carpet room, 42 seats, 22 on the open deck.
 assert.equal(FERRY_GA.reduce((n,s)=>n+(s.seats||0),0),S.passengers);
 // The engine room's way in is from the car deck's casings, not from a passenger space; its second way out too.
 assert.deepEqual(gaSpace('engine-room').exits,['er-stair-p','er-escape-s']);
 // The emergency generator and the fire-control station open to the open deck only.
 for(const id of ['eg-room','co2-room'])assert.deepEqual(gaSpace(id).exits,['open-deck']);
});

test('six cars on her car deck, or a truck and two cars, lashed half a metre apart, clear of the casings and the walkway',()=>{
 const deck=gaSpace('car-deck'),solids=['casing-p','casing-s','foyer','bow-house-p','bow-house-s','aft-mooring','lower-lobby'].map(gaSpace);
 const longest=Math.max(...Object.values(VEHICLE_SIZE).map(v=>v.length)),widest=Math.max(...Object.values(VEHICLE_SIZE).map(v=>v.width));
 assert.equal(FERRY_CAR_PLACES.length,FERRY_SHIP.vehicles);
 const box=v=>({x:[v.x-v.width/2,v.x+v.width/2],z:[v.z-v.length/2,v.z+v.length/2]});
 const hits=(a,b,gap=0)=>Math.min(a.x[1],b.x[1])-Math.max(a.x[0],b.x[0])>-gap&&Math.min(a.z[1],b.z[1])-Math.max(a.z[0],b.z[0])>-gap;
 for(const plan of [FERRY_CAR_PLACES,[...FERRY_TRUCK_PLAN.trucks,...FERRY_TRUCK_PLAN.cars]]){
  for(const v of plan){
   const b=box(v);if(plan===FERRY_CAR_PLACES)assert.ok(v.length>=longest&&v.width>=widest,'every place takes the town’s longest and widest vehicle');
   assert.ok(b.z[0]>=deck.z[0]&&b.z[1]<=30&&b.x[0]>=deck.x[0]-1e-9&&b.x[1]<=deck.x[1]+1e-9,'a place on the car deck at '+v.z);
   for(const s of solids)assert.ok(!hits(b,s),`a place at ${v.x},${v.z} runs into ${s.id}`);
  }
  for(let i=0;i<plan.length;i++)for(let j=i+1;j<plan.length;j++)assert.ok(!hits(box(plan[i]),box(plan[j]),.5),`places ${i} and ${j} are less than half a metre apart`);
 }
 assert.equal(FERRY_TRUCK_PLAN.trucks.length,1);assert.equal(FERRY_TRUCK_PLAN.cars.length,2);
 // The ramp: 4.4 m clear between the bow houses, wide enough for an 8-tonne truck with room each side.
 const ramp=gaSpace('ramp');assert.ok(near(ramp.x[1]-ramp.x[0],4.4,1e-9));assert.ok(ramp.x[1]-ramp.x[0]>=FERRY_TRUCK_PLAN.trucks[0].width+1.5);
});

test('her machinery and system planning budgets are internally consistent, not class approval',()=>{
 const S=FERRY_SHIP,M=FERRY_MACHINERY;
 // The bilge main: d = 25 + 1.68·√(L(B+D)) mm.
 assert.ok(M.bilge.main>=25+1.68*Math.sqrt(S.lengthBP*(S.beam+S.depth)));
 // Fixed CO₂: 40 % of the engine room's gross volume at 0.56 m³ a kilogram.
 assert.ok(M.co2.bottles*M.co2.kg>=.4*M.co2.grossVolume/.56);
 // Two steering pumps, two fire pumps and an emergency fire pump outside the engine room.
 assert.equal(M.steering.pumps,2);assert.equal(M.fireMain.pumps,2);assert.equal(FERRY_LOADS.find(l=>l.id==='fire-emergency').where,'steering-gear');
 // Fuel: explicit duty estimate; 90% usable storage, no unproved sixteen-day claim.
 assert.ok(near(M.tanks.fuelStorage.reduce((a,b)=>a+b,0),M.tanks.fuel,1e-9));
 assert.ok(near(M.fuelPerDay,20*M.fuelPerCrossing,1e-6));
 assert.ok(M.tanks.fuel*1000*.9/M.fuelPerDay>9&&M.tanks.fuel*1000*.9/M.fuelPerDay<10);
 // The screws turn at engine speed through the gears; two of them, 1.45 m, fixed pitch.
 assert.ok(near(M.mains.rpm/M.gears.ratio,M.propellers.rpm,1e-9));assert.equal(M.propellers.count,2);
 // The engines' firing note at full speed: six cylinders, four-stroke.
 assert.ok(near(M.mains.rpm/60*M.mains.cylinders/2,M.mains.firing.full,1e-9));
});

test('her switchboard: one generator at sea, both for the berth, shore power at night, the emergency generator in a blackout',()=>{
 const E=FERRY_ELECTRICS;
 assert.equal(E.generators.kW,E.generators.kVA*E.generators.pf);
 // The load analysis's totals (briefs/ferry-audit.md §3.4), rounded as the brief rounded them, and since 2026-10-13 the
 // lane signals at the ramp (0.18 kW on the lighting board at sea, arriving and loading).
 // The electrical workshop (2026-10-14) adds its test panel at night on shore power (0.6 kW) and 0.1 kW of lighting.
 const brief={sea:40.2,arrival:110.1,loading:46.0,night:11.0,blackout:9.9},lighting={sea:12.3,arrival:14.3,loading:14.9,night:6};
 for(const c of FERRY_CONDITIONS){assert.ok(near(ferryDemand(c),brief[c],.15),c+' '+ferryDemand(c).toFixed(1));if(c in lighting)assert.ok(near(ferryDemand(c,{board:'LB'}),lighting[c],.15),c+' lighting');}
 // How each condition is carried, and how hard.
 const use=c=>ferryDemand(c)/ferrySupplyKW(c);
 assert.ok(near(use('sea'),.40,.01)&&near(use('arrival'),.55,.01)&&near(use('loading'),.46,.01)&&near(use('night'),.275,.01)&&near(use('blackout'),.31,.01));
 for(const c of FERRY_CONDITIONS)assert.ok(use(c)<=.85,c);
 // Arriving on one generator she would be at 110 %: hence No.2 on the board before the breakwater, and the thruster's interlock.
 assert.ok(ferryDemand('arrival')>E.generators.kW);assert.equal(FERRY_SUPPLY.arrival.generators,2);
 assert.equal(thrusterMayStart(1),false);assert.equal(thrusterMayStart(2),true);
 // With one generator the preference trip sheds the saloon's air conditioning, the kiosk and the vending machines first, enough to save it.
 assert.ok(near(preferenceShed('arrival',1),14.4,.05));assert.ok(ferryDemand('arrival',{shedFrom:1})<E.generators.kW);
 // In a blackout only the emergency board is fed, within the emergency generator.
 assert.ok(FERRY_LOADS.every(l=>l.board==='ESB'||l.draw.blackout===0));assert.ok(ferryDemand('blackout')<E.emergency.kW);
 // Shore power never runs with the generators; at night it carries a quarter of its 40 kW.
 assert.equal(FERRY_SUPPLY.night.shore,true);assert.ok(ferryDemand('night')<E.shore.kW*.3);
 // The thruster's current: 122 A at full load, a third of its direct-on-line start through its star-delta starter, within two generators.
 const thruster=FERRY_LOADS.find(l=>l.id==='thruster');assert.ok(near(motorAmps(75,.93,.87),thruster.amps,.5));
 assert.ok(thruster.amps*6.5/3<=E.generators.amps*2);
 // The lighting transformer (one of two 30 kVA) carries 44–54 % at a power factor of 0.9.
 for(const c of ['sea','arrival','loading']){const kva=ferryDemand(c,{board:'LB'})/.9/E.transformers.lighting.kVA;assert.ok(kva>.4&&kva<.56,c+' '+kva.toFixed(2));}
 // Every load says where it is and why; essential loads are on the emergency board.
 for(const l of FERRY_LOADS){assert.ok(gaSpace(l.where),l.id+' is somewhere on board');assert.ok(['MSB','LB','ESB'].includes(l.board));for(const c of FERRY_CONDITIONS)assert.ok(l.draw[c]>=0&&l.draw[c]<=l.count*l.kW+.05,l.id+' '+c);}
 for(const id of ['steer-2','fire-emergency','nav-lights','emergency-light'])assert.equal(FERRY_LOADS.find(l=>l.id===id).board,'ESB',id);
 for(const id of ['saloon-ac','kiosk','vending'])assert.equal(FERRY_LOADS.find(l=>l.id===id).trip,1,id);
 for(const id of ['range','water-heater','galley-appliances'])assert.equal(FERRY_LOADS.find(l=>l.id===id).trip,2,id);
});

test('lifesaving and fire appliances for 108 persons',()=>{
 const F=FERRY_SAFETY,S=FERRY_SHIP;
 assert.ok(F.liferafts.count*F.liferafts.persons>=F.persons,'liferafts for everyone aboard');assert.equal(F.liferafts.where.length,F.liferafts.count);
 for(const w of F.liferafts.where)assert.ok(gaSpace(w),w);
 assert.ok(F.lifeJackets.adult>=F.persons);assert.ok(F.lifeJackets.child>=S.passengers*.1,'children’s jackets for a tenth of the passengers');
 assert.equal(F.lifebuoys.count,8,'eight lifebuoys for a ship under 60 m');
 assert.ok(gaSpace(F.muster.A)&&gaSpace(F.muster.B));assert.ok(gaSpace(F.rescueBoat.where));
});

test('the crew: eight posts by her safe manning, named islanders and Johansson as chief engineer',()=>{
 const posts=new Set(FERRY_MANNING.map(m=>m.post));assert.equal(FERRY_MANNING.length,FERRY_SHIP.crew);
 for(const c of FERRY_CREW)assert.ok(posts.has(c.post),c.post+' is a post of her manning');
 const living=new Map(ISLAND_HOUSEHOLDS.flatMap(h=>h.members.map(m=>[m.name,h])));
 assert.deepEqual(FERRY_CREW.map(c=>c.post),FERRY_MANNING.map(c=>c.post));
 assert.equal(FERRY_CREW.filter(c=>c.new).length,0,'existing villagers keep the crew posts');assert.equal(crewFor('chief'),'Johansson');
 for(const c of FERRY_CREW){assert.ok(c.why.length>60,c.name+' has a reason');assert.ok(c.lives,c.name+' lives somewhere');}
 for(const name of ['Mac','Chin','Ms Uezu','Kōji','Ms Ganaha','Mr Fujita','Ryo','Ren','Aya','Jun','Kai'])assert.ok(living.has(name),name+' is on the island');
 assert.equal(living.get('Mac').members.find(m=>m.name==='Mac').primaryHome,'kitahama-flat-3');
 for(const name of ['Ms Uezu','Chin','Kōji','Mr Fujita','Ryo','Ren','Aya','Jun'])assert.match(living.get(name).members.find(m=>m.name===name).purpose,/ferry|Minato Maru/);
 // The four who live aboard sleep in her cabins (island-households.js), quarters that are not shore households.
 for(const [name,cabin] of [['Ryo','ferry-officer-cabin'],['Ren','ferry-crew-cabin'],['Aya','ferry-crew-cabin'],['Jun','ferry-crew-cabin']]){const h=living.get(name);assert.equal(h.home,cabin,name);assert.ok(h.aboard&&h.quarters,name+' sleeps aboard');}
 assert.equal(living.get('Kai').home,'kitano-2');assert.ok(living.get('Kai').quarters,'the Shiroma house is supporting accommodation');
 for(const minutes of [0,7*1440]){const names=crewOnDuty(minutes).map(c=>c.name);assert.equal(new Set(names).size,names.length);}
 assert.ok(FERRY_PEOPLE.length>=8);
});

test('the bosun works a week on and a week off, and the legacy rota lookup still resolves her relief',()=>{
 assert.equal(deckHandFor(0),'Ms Uezu');assert.equal(deckHandFor(6*1440+1439),'Ms Uezu');
 assert.equal(deckHandFor(7*1440),'Kōji');assert.equal(deckHandFor(14*1440),'Ms Uezu');
 // The roster's holders (people/roster.js SHIP_POSTS, SHORE_ROLES), under the names the live cast uses today.
 assert.equal(crewFor('master'),'Mr Fujita');assert.equal(crewFor('linesman'),'Harbour master');assert.equal(crewFor('oiler'),'Chin');assert.equal(crewFor('motorman'),'Chin');
 assert.equal(crewFor('airport-linesman'),'Kai');assert.equal(crewFor('relief-engineer'),'Mac');assert.equal(crewFor('deck'),'Ren');assert.equal(crewFor('purser'),'Aya');assert.equal(crewFor('cook'),'Jun');assert.equal(crewFor('mate'),'Ryo');
});

test('every phase of a call has the right people at their stations',()=>{
 for(const phase of ['arriving','waiting','reversing','swinging','leaving','crossing']){
  const posts=new Set(Object.keys(FERRY_WATCH[phase]));
  for(const {post:p} of FERRY_MANNING)assert.ok(posts.has(p),phase+' has the '+p);
  for(const d of crewDoing(phase))assert.ok(d.name&&d.where&&d.doing.length>15,phase+' '+d.post);
 }
 for(const phase of ['arriving','reversing']){const w=FERRY_WATCH[phase];assert.equal(w.deck[0],'bow');assert.equal(w.bosun[0],'stern');assert.equal(w.oiler[0],'engine-room');assert.equal(w.linesman[0],'quay');}
 assert.equal(FERRY_WATCH.night.chief[0],'mess','the chief lives aboard');
 assert.throws(()=>crewDoing('dancing'));
});

test('the scenarios: real posts of her manning, in real places on board',()=>{
 const posts=new Set(FERRY_MANNING.map(m=>m.post));
 for(const s of FERRY_SCENARIOS){assert.ok(s.steps.length>=2&&s.cause.length>40,s.id);for(const [post,where,what] of s.steps){assert.ok(posts.has(post),s.id+': '+post);assert.ok(where==='quay'||gaSpace(where),s.id+': '+where);assert.ok(what.length>20);}}
 // The blackout comes at the breakwater, and the emergency generator takes the load within 45 seconds.
 const b=FERRY_SCENARIOS.find(s=>s.id==='blackout');assert.match(b.title,/breakwater/);assert.ok(b.steps.some(([,where,what])=>where==='eg-room'&&/45 seconds/.test(what)));
});

test('the hull as drawn is the ship as designed: 34.5 × 8.4 m, closed, faired, her decks at their heights, and light enough for a phone',()=>{
 const ferry=buildFerryModel();let tris=0,meshes=0;
 ferry.traverse(o=>{if(o.isMesh){meshes++;const g=o.geometry;tris+=(g.index?g.index.count:g.getAttribute('position').count)/3;}});
 // With her interiors walked (batches 6b, 6c): the lobby, the saloon, the crew's rooms, the engine room.
 assert.ok(meshes<40,meshes+' meshes');assert.ok(tris<100000,tris+' triangles'); // 60 000 until the engine room was built from the photographs (6o-2, 6o-3), 66 000 until the rooms forward of it (6q-1), 70 000 until the pipes were routed from the diagrams (6r-1, 172 runs): one merged mesh, still light for a phone
 // Her particulars, from the data.
 for(const k of ['length','beam','depth','draft','freeboard'])assert.equal(FERRY_HULL[k],FERRY_SHIP[k],k);
 assert.ok(Math.abs(FERRY_HULL.depth-(FERRY_HULL.draft+FERRY_HULL.freeboard))<.05,'depth is draft plus freeboard');
 assert.equal(halfBreadth(0),FERRY_HULL.beam/2);assert.ok(halfBreadth(FERRY_HULL.length/2)<halfBreadth(0)*.95);
 assert.ok(Math.abs(keelY(0)-(WL-FERRY_HULL.draft))<1e-9,'the keel is at her draft');
 assert.ok(keelY(16)>keelY(0)+.8&&keelY(-16)>keelY(0)+1.5,'forefoot and counter rise');
 // Her decks where the general arrangement puts them (heights above the keel, less the draft).
 const at=y=>y-FERRY_SHIP.draft;
 assert.ok(Math.abs(FERRY_DECKS.car.y-at(FERRY_HEIGHTS.carDeck))<1e-9&&Math.abs(FERRY_DECKS.upper.y-at(FERRY_HEIGHTS.passengerDeck))<1e-9&&Math.abs(FERRY_DECKS.bridge.y-at(FERRY_HEIGHTS.bridgeDeck))<1e-9);
 const box=new THREE.Box3().setFromObject(ferry);
 assert.ok(Math.abs(box.max.y-at(FERRY_HEIGHTS.mastTop))<.3,'her mast top at '+box.max.y.toFixed(2));
 assert.ok(Math.abs(ferry.getObjectByName('Masthead light').position.y-at(FERRY_HEIGHTS.mastheadLight))<.05,'the masthead light 15 m above the keel');
 // Six car places in two lanes between the casings, forward of the lower lobby.
 assert.equal(FERRY_DECKS.car.slots.length,FERRY_SHIP.vehicles);
 const laneEdge=Math.max(...FERRY_DECKS.car.lanes.map(Math.abs))+FERRY_DECKS.car.laneWidth/2;
 assert.ok(laneEdge<=FERRY_HULL.beam/2-FERRY_DECKS.car.walkway+1e-9,'lanes stop at the casings');
 for(const [x,z] of FERRY_DECKS.car.slots){assert.ok(z+VEHICLE_SIZE.car.length/2<FERRY_DECKS.car.fore&&z-VEHICLE_SIZE.car.length/2>FERRY_DECKS.car.aft);assert.ok(Math.abs(x)+VEHICLE_SIZE.car.width/2<laneEdge);}
 assert.ok(FERRY_RAMP.clear>=2.5+1.5,'the ramp takes an 8-tonne truck with room each side');
 // The screws: inside the hull's breadth, above the keel line, under the counter.
 for(const s of ferry.userData.screws){const r=FERRY_HULL.screw/2;
  assert.ok(s.position.y-r>keelY(0)-.1,'screw below the keel line');
  assert.ok(s.position.y+r<keelY(s.position.z)-.1,'screw tip within 0.1 m of the counter');
  assert.ok(Math.abs(s.position.x)+r<halfBreadth(s.position.z)-.3,'screw sticks out beyond the hull’s side');
  assert.ok(Math.abs(s.position.x)>r+.15,'the two screws are too close to the skeg');}
 assert.ok(ferry.getObjectByName('Radar scanner'));assert.ok(ferry.getObjectByName('Ferry bow ramp'));assert.ok(ferry.getObjectByName('Ferry ramp flap'));
 for(const n of ['Masthead light','Port sidelight','Starboard sidelight','Stern light'])assert.ok(ferry.getObjectByName(n),n);
 assert.ok(ferry.getObjectByName('Port sidelight').position.x>0&&ferry.getObjectByName('Starboard sidelight').position.x<0);
 ferry.userData.lights(true);assert.equal(ferry.getObjectByName('Port sidelight').material.color.getHex(),0xff3a2a);
 const rams=[];ferry.traverse(o=>{if(o.name==='Ramp ram'&&o.geometry.parameters.radiusTop<.06)rams.push(o);});
 ferry.userData.setRamp(0);const up=rams[0].scale.y;ferry.userData.setRamp(1);const down=rams[0].scale.y;assert.notEqual(up,down);
 ferry.traverse(o=>{if(o.isMesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i+=97)assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)),o.name);}});
 ferry.userData.setRamp(0);const shut=new THREE.Box3().setFromObject(ferry);assert.ok(shut.max.z-shut.min.z<FERRY_HULL.length+.6,'raised, the ramp closes the bow');
 // The gangway door is on her port side, the side she lies to at Minato.
 assert.ok(GANGWAY_Z>-FERRY_HULL.length/2&&ferry.userData.gangway.position.x>0);
});

test('the decks a person walks on are drawn floors at their heights, with headroom',()=>{
 const ferry=buildFerryModel();ferry.updateMatrixWorld(true);
 const meshes=[];ferry.traverse(o=>{if(o.isMesh&&!/windows|markings|screw/.test(o.name))meshes.push(o);});
 const ray=new THREE.Raycaster();
 for(const w of FERRY_WALK)for(const fx of [.2,.5,.8])for(const fz of [.2,.5,.8]){
  const x=w.x[0]+(w.x[1]-w.x[0])*fx,z=w.z[0]+(w.z[1]-w.z[0])*fz;
  ray.set(new THREE.Vector3(x,w.y+.5,z),new THREE.Vector3(0,-1,0));ray.far=1;
  // A bench or a coil may stand on it; the floor must be under them.
  const hits=ray.intersectObjects(meshes,false);
  assert.ok(hits.some(h=>Math.abs(h.point.y-w.y)<.06),`${w.id}: no floor at ${x.toFixed(2)},${z.toFixed(2)} (hits ${hits.map(h=>h.point.y.toFixed(3))})`);
  // Two metres of headroom over it, unless something stands on it there (a bench, a funnel).
  const standing=hits.some(h=>h.point.y>w.y+.06);
  if(!standing){ray.set(new THREE.Vector3(x,w.y+.1,z),new THREE.Vector3(0,1,0));ray.far=1.9;const over=ray.intersectObjects(meshes,false)[0];assert.ok(!over,`${w.id}: ${over?.object.name} ${(over?.point.y-w.y).toFixed(2)} m over the deck at ${x.toFixed(2)},${z.toFixed(2)}`);}
 }
});

