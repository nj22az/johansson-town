import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_SEATS} from '../src/world/interiors/onsen.js';
import {ONSEN_STREET_DOOR,GENKAN_SPOTS,GENKAN_SPARE,GENKAN_STEP,GENKAN_SCENES,GENKAN_NOT_HERE,ONSEN_UMBRELLA,ONSEN_PORCH,doorRest,footwearOf,genkanLayout} from '../src/world/interiors/onsen-front.js';
import {ONSEN_SIGNS} from '../src/world/interiors/onsen-signs.js';
import {recipeFor} from '../src/avatars/cast.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';

const D=ONSEN_STREET_DOOR;
const build=(people=[])=>{const room=new THREE.Group(),hits=[],actions=[];let who=people;
 const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){},people:()=>who});
 return {room,hits,actions,layout,set people(v){who=v;}};};
/** Colliders that stand on the floor now (an empty place at the step is lifted out of reach). */
const solid=layout=>layout.colliders.filter(c=>(c.minY||0)<1);
const blocked=(layout,x,z,r=.3)=>solid(layout).some(c=>standingHitsRect(x,z,r,0,c));
const run=(b,seconds,minutes,dt=1/30)=>{const trace=[];for(let t=0;t<seconds;t+=dt){b.layout.tick(dt,minutes);trace.push(b.layout.streetDoor.amount);}return trace;};
const player=(x,z)=>({name:null,x,z});
const sliding=room=>room.getObjectByName('Street door sliding leaf'),fixed=room=>room.getObjectByName('Street door fixed leaf');

test('the street doors: two cedar leaves on two tracks between the jambs, outside where anybody walks',()=>{
 const {room}=build();
 const a=sliding(room),b=fixed(room);assert.ok(a&&b);
 assert.ok(Math.abs(a.position.z-b.position.z)-D.leaf.thick>.01,'the leaves pass each other on their own tracks');
 assert.ok(Math.min(a.position.z,b.position.z)-D.leaf.thick/2>ONSEN_ROOM.bounds.maxZ+.05,'beyond where the player and residents can stand');
 for(const name of ['Street door fixed leaf frosted glass','Street door sliding leaf frosted glass'])assert.ok(room.getObjectByName(name),name);
 assert.equal(ONSEN_SIGNS.doorGlass.jp,'ゆ');
 // The sliding leaf, at every opening, stays inside the jambs and over the fixed leaf when open.
 const box=new THREE.Box3();
 for(const amount of [0,.25,.5,.75,1]){const b2=build();b2.layout.streetDoor.set(amount);sliding(b2.room).updateMatrixWorld(true);box.setFromObject(sliding(b2.room));
  assert.ok(box.min.x>=D.minX-1e-6&&box.max.x<=D.maxX+1e-6,`inside the jambs at ${amount}: ${box.min.x.toFixed(3)}..${box.max.x.toFixed(3)}`);
  assert.ok(box.max.y<=D.head+1e-6&&box.min.y>=.02,'between the threshold and the head');}
 const open=build();open.layout.streetDoor.set(1);assert.ok(Math.abs(open.layout.streetDoor.gap-D.travel)<1e-6,'fully open leaves about a metre to walk through');
});

test('in opening hours it stands a hand’s span open; after ten it is shut; it opens for whoever comes to it, and never jumps',()=>{
 const b=build();
 assert.ok(Math.abs(doorRest(20*60)*D.travel-D.standing.metres)<1e-9&&doorRest(22*60+5)===0&&doorRest(9*60)===0);
 // You came in through it: open behind you, then it settles once you have stepped up.
 b.people=[player(0,3)];
 const settle=run(b,5,20*60);assert.ok(Math.abs(b.layout.streetDoor.gap-D.standing.metres)<.01,'standing open a hand’s span: '+b.layout.streetDoor.gap);
 b.people=[player(...[ONSEN_ROOM.spawn[0],ONSEN_ROOM.spawn[2]])];
 const opening=run(b,1.2,20*60);assert.ok(b.layout.streetDoor.amount>.95,'opens for somebody at the door');
 b.people=[player(0,2.5)];
 const closing=run(b,5,20*60+1);
 // Ten o'clock: Higa-san slides it shut and lifts the noren in.
 const tenpm=run(b,5,22*60+1);assert.ok(b.layout.streetDoor.amount<.01,'shut after ten');
 for(const trace of [settle,opening,closing,tenpm]){const steps=trace.map((a,i)=>i?Math.abs(a-trace[i-1]):0);assert.ok(Math.max(...steps)<.12,'no frame moves it more than an eighth');}
 b.people=[player(0,4.6)];run(b,1.2,22*60+30);assert.ok(b.layout.streetDoor.amount>.95,'it still opens to let you out after closing');
});

test('the noren is hung out in opening hours and lifted in over a second at closing, not snapped away',()=>{
 const b=build(),noren=b.room.getObjectByName('Umi-no-yu street noren');
 b.layout.tick(0,20*60);assert.ok(noren.visible&&noren.position.y<1e-6,'hung at eight in the evening');
 const ys=[];for(let t=0;t<2;t+=1/30){b.layout.tick(1/30,22*60+1);ys.push(noren.position.y);}
 assert.ok(!noren.visible,'in after ten');
 const steps=ys.map((y,i)=>i?y-ys[i-1]:y);assert.ok(Math.max(...steps)<ONSEN_PORCH.noren.lift/10,'lifted steadily');
});

test('the studio holds the door at any opening (panel 5b) and lets go again',()=>{
 const b=build([player(0,4.2)]);
 for(const v of [0,.5,1]){b.layout.streetDoor.set(v);run(b,1,20*60);assert.equal(b.layout.streetDoor.amount,v,'held at '+v);}
 b.layout.streetDoor.set(null);assert.equal(b.layout.streetDoor.held,false);
 run(b,1.5,20*60);assert.ok(b.layout.streetDoor.amount>.95,'let go, it opens for the person at it');
});

test('shoes at the step are whoever is past it, in what they actually wear, either side of the way up',()=>{
 for(const [name,s] of Object.entries(GENKAN_SPOTS)){
  assert.ok(s.why.length>40&&s.note,name+' has a reason and a line');
  assert.ok(Math.abs(s.x)-.16>=GENKAN_STEP.clear-1e-9,name+' leaves the middle metre clear');
  assert.ok(s.z-.14>GENKAN_STEP.z+.06,name+' on the stone, heels clear of the step edge');
 }
 for(const [name,why] of Object.entries(GENKAN_NOT_HERE))assert.ok(why.length>20,name);
 // The same kind and colours as the feet that walked in.
 for(const e of genkanLayout(GENKAN_SCENES.electrician.cast)){const r=recipeFor(e.name);assert.equal(e.kind,r.outfit.footwear,e.name);assert.equal(e.upper,r.outfit.shoes,e.name);}
 assert.equal(footwearOf({outfit:{footwear:'barefoot'}}),null,'nobody leaves bare feet at the door');
 assert.deepEqual(genkanLayout(['Miss Higa','Johansson']),[],'the bandai and the player leave none');
 assert.deepEqual(genkanLayout(['Visitor A','Visitor B']).map(e=>[e.x,e.z]),GENKAN_SPARE.slice(0,2).map(s=>[s.x,s.z]),'strangers take the spare places in order');

 const b=build();
 assert.deepEqual(b.layout.genkan.shown,[],'nobody in, nobody’s shoes');
 // Thuan comes in: not at the door, but once she is past the step.
 b.people=[player(0,4.2),{name:'Thuan',x:0,z:4.2}];b.layout.tick(1/30,20*60);assert.deepEqual(b.layout.genkan.shown,[]);
 b.people=[player(0,4.2),{name:'Thuan',x:.1,z:3.2}];b.layout.tick(1/30,20*60);assert.deepEqual(b.layout.genkan.shown.map(e=>e.name),['Thuan']);
 assert.ok(b.room.getObjectByName('Shoes · Thuan').visible);
 assert.ok(blocked(b.layout,GENKAN_SPOTS.Thuan.x,GENKAN_SPOTS.Thuan.z,.1),'nobody walks through her shoes');
 assert.ok(!blocked(b.layout,GENKAN_SPOTS.Tetsuo.x,GENKAN_SPOTS.Tetsuo.z,.1),'an empty place is not an invisible wall');
 b.people=[player(0,4.2)];b.layout.tick(1/30,20*60);assert.ok(!b.room.getObjectByName('Shoes · Thuan').visible,'gone with her');
});

test('the comic sets the cast at the step by scene, and the way in stays clear with everybody there',()=>{
 const b=build();
 assert.deepEqual(b.layout.genkan.stage('evening').map(e=>e.name),['Thuan','Nhung','Thao','Mr Fujita']);
 assert.ok(!b.layout.genkan.shown.some(e=>e.name==='Tetsuo'),'5b: his shoes are still on his feet');
 const all=b.layout.genkan.stage('electrician');assert.equal(all.length,5);
 b.people=[player(0,4.2)];b.layout.tick(1/30,20*60);assert.equal(b.layout.genkan.shown.length,5,'a staged scene holds');
 const panels=Object.values(GENKAN_SCENES).flatMap(s=>s.panels||[]);assert.equal(new Set(panels).size,panels.length,'each panel in one scene');
 // Spawn, the door, the way up the middle and every seat's stand stay clear with every place taken.
 b.layout.genkan.stage([...Object.keys(GENKAN_SPOTS),'Visitor A','Visitor B','Visitor C']);
 assert.ok(!blocked(b.layout,ONSEN_ROOM.spawn[0],ONSEN_ROOM.spawn[2],.35),'spawn');
 assert.ok(!blocked(b.layout,ONSEN_ROOM.exit[0],ONSEN_ROOM.exit[2],.3),'Step outside');
 for(let z=3.4;z<=4.55;z+=.05)for(const x of [-.15,0,.15])assert.ok(!blocked(b.layout,x,z,.3),`the way up at ${x},${z.toFixed(2)}`);
 for(const s of Object.values(ONSEN_SEATS))assert.ok(!blocked(b.layout,s.stand[0],s.stand[2],.25),s.id);
 // No shoe passes through another, the step edge or the floor.
 b.room.updateMatrixWorld(true);const shoes=[];b.room.traverse(o=>{if(o.name.startsWith('Shoes · ')&&o.visible)for(const c of o.children)shoes.push([o.name,new THREE.Box3().setFromObject(c)]);});
 assert.equal(shoes.length,16);
 for(const [name,box] of shoes){assert.ok(box.min.y>=.003&&box.min.y<.008,name+' sits on the genkan');assert.ok(box.min.z>GENKAN_STEP.z+.06,name+' clear of the step edge');}
 for(let i=0;i<shoes.length;i++)for(let j=i+1;j<shoes.length;j++)assert.ok(!shoes[i][1].intersectsBox(shoes[j][1])||shoes[i][1].clone().intersect(shoes[j][1]).getSize(new THREE.Vector3()).x<.003,shoes[i][0]+' and '+shoes[j][0]+' do not overlap');
 assert.throws(()=>b.layout.genkan.stage('party'),/No such genkan scene/);
 b.layout.genkan.stage(null);assert.deepEqual(b.layout.genkan.shown,[]);
});

test('the agarikamachi turns at x 3.0 towards the street wall: the shoes stay west of it, and the massage chair’s corner is hinoki',()=>{
 const {room}=build();room.updateMatrixWorld(true);
 const T=GENKAN_STEP.turn,h=GENKAN_STEP.width/2;assert.equal(T,3);
 // Every shoe spot and the umbrella stand are on the stone, clear of the turn.
 for(const s of [...Object.values(GENKAN_SPOTS),...GENKAN_SPARE])assert.ok(s.x+.2<T-h,'a shoe spot at x '+s.x+' is on the stone');
 assert.ok(ONSEN_UMBRELLA.stand.x+ONSEN_UMBRELLA.stand.r<T-h,'the umbrella stand is on the stone');
 // The step is one L: along z 3.6 from the west wall to the turn, then from there to the street wainscot, with no gap.
 const steps=[];room.traverse(o=>{if(o.isMesh&&o.name==='Genkan step')steps.push(new THREE.Box3().setFromObject(o));});
 assert.equal(steps.length,2);
 const along=steps.find(b=>b.max.x-b.min.x>1),across=steps.find(b=>b!==along);
 assert.ok(Math.abs(along.min.x+5)<1e-6&&Math.abs(along.max.x-(T+h))<1e-6&&Math.abs(along.min.z-(GENKAN_STEP.z-h))<1e-6);
 assert.ok(Math.abs(across.min.x-(T-h))<1e-6&&Math.abs(across.max.x-(T+h))<1e-6&&Math.abs(across.min.z-along.max.z)<1e-6,'the turn meets the long side');
 const wainscot=new THREE.Box3().setFromObject(room.getObjectByName('Lobby wainscot street east'));
 assert.ok(Math.abs(across.max.z-wainscot.min.z)<1e-6,'and runs to the street wainscot');
 for(const b of steps)assert.ok(Math.abs(b.min.y)<1e-6&&Math.abs(b.max.y-.05)<1e-6);
 // Nothing of the chair's corner (the body and its leg rest, x 4.08–4.81, z 3.10–4.00) or of its stand spot (r 0.28) is on the step.
 const corner=new THREE.Box3(new THREE.Vector3(4.08,0,3.1),new THREE.Vector3(4.81,.05,4));
 for(const b of steps)assert.ok(!b.intersectsBox(corner),'the chair’s corner is off the step');
 const [sx,,sz]=ONSEN_SEATS.massage.stand;
 for(const b of steps){const dx=Math.max(b.min.x-sx,0,sx-b.max.x),dz=Math.max(b.min.z-sz,0,sz-b.max.z);assert.ok(Math.hypot(dx,dz)>.28,'the chair’s stand spot is off the step');}
 // What is underfoot: hinoki east of the turn, the lobby's own boards carried on; the stone genkan west of it.
 const floors=[];room.traverse(o=>{if(o.isMesh&&/^(Umi-no-yu floor|Genkan arai-dashi)$/.test(o.name))floors.push(o);});
 const under=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,.5,z),new THREE.Vector3(0,-1,0)).intersectObjects(floors,false)[0];
 const lobbyBoards=under(0,2.5).object.material;
 for(const [x,z] of [[3.2,4.8],[4.45,3.8],[4.8,4.8],[3.4,3.7]]){const hit=under(x,z);assert.equal(hit.object.material,lobbyBoards,`hinoki at ${x}, ${z}`);
  // the boards carry straight on: the same texture coordinate as the lobby's plane would give there
  assert.ok(Math.abs(hit.uv.x-(x+5)/10)<1e-6&&Math.abs(hit.uv.y-(3.6-z)/4.8)<1e-6,'the boards carry on from the lobby’s');}
 // (the pebbles are a painted texture, so without a page the stone under them is what is hit)
 for(const [x,z] of [[2.8,4.4],[-4,4],[0,4.5]])assert.notEqual(under(x,z).object.material,lobbyBoards,`stone at ${x}, ${z}`);
});

test('Mr Fujita’s umbrella waits in the stand by the door, out of everybody’s way',()=>{
 const {room,layout,hits}=build(),U=ONSEN_UMBRELLA.stand;
 assert.ok(room.getObjectByName('Forgotten umbrella')&&room.getObjectByName('Lost-property tag'));
 assert.equal(ONSEN_SIGNS.lostProperty.jp,'忘れ物');
 assert.ok(blocked(layout,U.x,U.z,.05),'a stand you walk round');
 assert.ok(U.x-U.r>=D.maxX+.08,'beyond the jamb, clear of the door’s travel');
 assert.ok(Math.hypot(U.x-ONSEN_ROOM.exit[0],U.z-ONSEN_ROOM.exit[2])>.9&&Math.hypot(U.x-ONSEN_ROOM.spawn[0],U.z-ONSEN_ROOM.spawn[2])>.9);
 assert.ok(U.z+U.r<ONSEN_ROOM.bounds.maxZ+.01,'inside the room');
 const umbrella=hits.find(h=>h.label==='Look at the umbrella in the stand');assert.ok(umbrella);
 const box=new THREE.Box3().setFromObject(room.getObjectByName('Forgotten umbrella'));
 assert.ok(box.max.z<4.9,'it leans along the wall, not into it');
});

test('nothing at the front is rolled: two builds are identical',()=>{
 const dump=room=>{const out=[];room.getObjectByName('Umi-no-yu street front').traverse(o=>out.push(o.name+o.position.toArray().map(v=>v.toFixed(5)).join()));return out.join('|');};
 const a=build(),b=build();a.layout.genkan.stage('electrician');b.layout.genkan.stage('electrician');
 assert.equal(dump(a.room),dump(b.room));
});
