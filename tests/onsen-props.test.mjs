import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_SEATS} from '../src/world/interiors/onsen.js';
import {ONSEN_PROPS} from '../src/world/interiors/onsen-props.js';
import {ONSEN_SIGNS} from '../src/world/interiors/onsen-signs.js';
import {MASSAGE_CHAIR} from '../src/world/interiors/onsen-electrics.js';
import {LOBBY} from '../src/world/interiors/onsen-lobby.js';
import {FEED_PLACES} from '../src/feed/places.js';
import {circleHitsRect} from '../physics.js';
import {provideCatalog} from './catalog-fixture.mjs';
// The massage chair's model in hand (World's catalogue), so the offering finds the arm pad it stands on.
await provideCatalog('massage-chair');

// The props "Fujita's Ten Minutes of Heaven" needs: the straw jar, the uchiwa rack, Miss Higa's rubber plant, her account book.
const build=()=>{const room=new THREE.Group(),hits=[];const layout=buildOnsenInterior({room,reg:(o,label)=>hits.push({o,label}),action(){},exit(){}});room.updateMatrixWorld(true);return {room,hits,layout};};
const meshes=root=>{const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
const box=o=>new THREE.Box3().setFromObject(o);
const MIRRORS=[-3.9,-2.95,-2];

test('every prop is in the room, named, and says who it is for and why it is there',()=>{
 const {room,hits,layout}=build();
 for(const p of Object.values(ONSEN_PROPS)){
  const g=room.getObjectByName(p.name);assert.ok(g,p.name+' is in the room');assert.equal(g.userData.prop,p.id);
  assert.ok(p.for.length>20&&p.why.length>40&&p.period.length>40,p.id+' has its reasons and its period');
  assert.ok(meshes(g).every(m=>m.name),p.name+': every part is named');
 }
 for(const name of ['Straws Tetsuo takes','Straw jar straws','Giant uchiwa','Uchiwa','Account book pencil','Rubber plant leaves'])assert.ok(room.getObjectByName(name),name);
 // Tetsuo's straws (page 8): three thin, one thinner, one fat, standing in the jar as one group the film can hide.
 const taken=meshes(room.getObjectByName('Straws Tetsuo takes')).map(m=>m.userData.straw).sort();
 assert.deepEqual(taken,['fat','thin','thin','thin','thinner']);
 const {thin,thinner,fat}=Object.fromEntries(ONSEN_PROPS.strawJar.straws.map(s=>[s.kind,s]));
 assert.ok(thinner.r<thin.r&&thin.r<fat.r,'thinner < thin < fat');
 // Uchiwa prints come from the signs file, each one with a reason; the giant one is the Hārī fan.
 assert.deepEqual(ONSEN_PROPS.uchiwaRack.fans.map(f=>f.id).concat(ONSEN_PROPS.uchiwaRack.giant.id).sort(),ONSEN_SIGNS.uchiwa.map(s=>s.id).sort());
 assert.ok(ONSEN_SIGNS.uchiwa.every(s=>s.why.length>30));assert.equal(ONSEN_SIGNS.uchiwa.find(s=>s.giant).id,'harii');
 // Miss Higa's sums add up, at the prices on the board (¥300 a bath, ¥100 a towel or a milk).
 const yen=v=>+String(v).replace(/,/g,'')||0;let balance=0;
 for(const r of ONSEN_SIGNS.ledger.rows){balance+=yen(r[2])-yen(r[3]);assert.equal(balance,yen(r[4]),'balance after '+r[1]);}
 const [baths,towels,milk]=ONSEN_SIGNS.ledger.rows;assert.equal(yen(baths[2]),38*300);assert.equal(yen(towels[2]),6*100);assert.equal(yen(milk[2]),21*100);
 // The crossword gag is cut: no crossword, and the old closed ledger is replaced by the open account book.
 room.traverse(o=>{assert.ok(!/crossword/i.test(o.name),o.name);assert.notEqual(o.name,'Bandai ledger');});
 for(const label of ['Take an uchiwa','Look at the rubber plant'])assert.ok(hits.some(h=>h.label===label),label);
 // Light for phones.
 let tris=0;for(const p of Object.values(ONSEN_PROPS))for(const m of meshes(room.getObjectByName(p.name))){const g=m.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3;}
 assert.ok(tris<4000,'all the props in '+tris+' triangles');
 layout.dispose();
});

test('the props sit on their surfaces and clip nothing',()=>{
 const {room,layout}=build(),all=meshes(room),ray=new THREE.Raycaster();
 const propOf=o=>{for(let p=o;p;p=p.parent)if(p.userData.prop)return p;return null;};
 const ours=all.filter(m=>propOf(m));
 assert.ok(ours.length>=20,'parts: '+ours.length);
 for(const m of ours.filter(m=>m.userData.restsOn)){
  const b=box(m),c=b.getCenter(new THREE.Vector3());ray.set(new THREE.Vector3(c.x,b.min.y+.001,c.z),new THREE.Vector3(0,-1,0));ray.far=.02;
  const hit=ray.intersectObjects(all.filter(o=>o!==m),false)[0];
  assert.ok(hit,m.name+' rests on something');assert.ok(hit.distance<.004,m.name+' sits on '+hit.object.name+' with a gap of '+hit.distance.toFixed(4));
  assert.equal(hit.object.name,m.userData.restsOn,m.name+' rests on '+m.userData.restsOn);
 }
 // Hung things touch the wall they hang on, and nothing floats off it.
 for(const name of ['Uchiwa rack pocket','Uchiwa pegs'])assert.ok(Math.abs(box(room.getObjectByName(name)).min.z-1.66)<.002,name+' is on the lobby wall');
 const giant=box(room.getObjectByName('Giant uchiwa')),pegs=box(room.getObjectByName('Uchiwa pegs'));
 assert.ok(giant.min.z-1.66<.012,'the giant fan leans on the wall');
 assert.ok(Math.abs(pegs.max.y-(ONSEN_PROPS.uchiwaRack.giant.y+Math.sin(-40*Math.PI/180)*ONSEN_PROPS.uchiwaRack.giant.r))<.005,'its rim rests on the pegs');
 // The fans stand in the pocket: handles inside it, faces above it.
 const pocket=box(room.getObjectByName('Uchiwa rack pocket')),P=ONSEN_PROPS.uchiwaRack.pocket,inner=pocket.clone().expandByScalar(-.0099);inner.max.y=P.y+P.h;
 const inside=(name,test)=>{const m=room.getObjectByName(name),p=m.geometry.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);test(v);}};
 inside('Uchiwa handles',v=>{if(v.y<=P.y+P.h)assert.ok(inner.containsPoint(v)||v.y>=inner.max.y-1e-6,'a handle passes through the pocket at '+v.toArray().map(n=>n.toFixed(3)));});
 inside('Uchiwa',v=>assert.ok(v.y>P.y+P.h&&v.z>pocket.min.z+.009&&v.z<pocket.max.z-.009,'a fan face dips into the pocket or off its line at '+v.toArray().map(n=>n.toFixed(3))));
 // Straws stay inside the glass up to its rim.
 const J=ONSEN_PROPS.strawJar;
 for(const m of meshes(room.getObjectByName(J.name)).filter(m=>/^Straw/.test(m.name)&&m.name!=='Straw jar glass'&&m.name!=='Straw jar rim'&&m.name!=='Straw jar base')){
  const p=m.geometry.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(v.y<=J.h)assert.ok(Math.hypot(v.x,v.z)<J.r*(1-.1*v.y/J.h)-.002,m.name+' passes through the glass at y '+v.y.toFixed(3));}
 }
 // Nothing else passes through a prop, apart from its own parts, what it stands on and the wall it hangs on.
 for(const m of ours){
  const own=propOf(m),b=box(m).expandByScalar(-.002);if(b.isEmpty())continue;
  for(const o of all){
   if(propOf(o)===own||o.name===m.userData.restsOn||o.name===m.userData.hangsOn||/floor|paving|ceiling|sea view/i.test(o.name))continue;
   if(own.name==='Giant uchiwa'&&o.name==='Uchiwa pegs'||m.name==='Uchiwa pegs'&&propOf(o)?.name==='Giant uchiwa')continue;
   if(m.name==='Uchiwa pegs'&&o.name==='Noren wall east')continue;
   const ob=box(o);if(ob.isEmpty())continue;
   assert.ok(!b.intersectsBox(ob),`${m.name} (${own.name}) clips ${o.name||o.type}`);
  }
 }
 layout.dispose();
});

test('the props keep the ways, the seats, the mirrors and the people clear',()=>{
 const {room,layout}=build();
 const blocked=(x,z,r=.25)=>layout.colliders.some(c=>c.only!=='player'&&circleHitsRect(x,z,r,c));
 // Through each noren, across its changing room and out to its bath door; and from the women's bath door to the mirrors.
 for(const [x,z] of [[-.45,1.4],[-.45,.4],[-.3,-.6],[-.45,-1.2],[.45,1.4],[.45,.4],[.45,-1.2],[-2,-.33],[-2.95,-.33],[-3.9,-.33],[-1.2,-.45]])assert.ok(!blocked(x,z),`open at ${x}, ${z}`);
 // Only the plant pot is new under foot: it stands on the floor where a walker would really hit it.
 const P=ONSEN_PROPS.plant;assert.ok(blocked(P.at[0],P.at[2],.05),'the pot is solid');
 // The rubber plant: out of the bath doorway (x -0.8..0.8), off the vanity, in front of no mirror, a dryer's reach from the right-hand one.
 const plant=box(room.getObjectByName(P.name)),counter=box(room.getObjectByName('Dressing counter'));
 assert.ok(plant.max.x<-.85&&plant.min.x>counter.max.x+.03,'between the vanity and the bath door: '+plant.min.x.toFixed(2)+'..'+plant.max.x.toFixed(2));
 for(const mx of MIRRORS)assert.ok(plant.min.x>mx+.35||plant.max.x<mx-.35,'clear of the mirror at '+mx);
 assert.ok(plant.min.z>-1.14,'clear of the wall');
 const dryer=box(room.getObjectByName('Hair dryer 3')).getCenter(new THREE.Vector3());
 assert.ok(Math.hypot(dryer.x-P.at[0],dryer.z-P.at[2])<.9,'a dryer’s reach from the right-hand mirror');
 // The uchiwa rack: flat to the lobby wall above the wainscot, beside the noren, over no seat or the koagari.
 const rack=box(room.getObjectByName('Uchiwa rack')).union(box(room.getObjectByName('Giant uchiwa'))).union(box(room.getObjectByName('Uchiwa pegs')));
 assert.ok(rack.max.z<1.78&&rack.min.y>.945,'flat to the wall, above the wainscot rail');
 assert.ok(rack.min.x>.95,'clear of the noren and its doorway (x < 0.9)');
 const K=LOBBY.koagari;assert.ok(rack.max.z<K.z-K.d/2,'not over the tatami');
 assert.ok(rack.max.x<MASSAGE_CHAIR.front||rack.min.z>4,'nowhere near the massage chair');
 const poster=box(room.getObjectByName('Travel poster'));assert.ok(rack.max.x<poster.min.x-.1,'beside the travel poster, not over it');
 const seat=ONSEN_SEATS.tatami;assert.ok(Math.hypot(1.4-seat.position[0],1.7-seat.position[2])<1.5,'in reach of the tatami');
 // The straw jar: on the cooler's lid, behind its sign, in reach of anyone standing at the cooler.
 const jar=box(room.getObjectByName('Straw jar')),lid=box(room.getObjectByName('Milk cooler top'));
 assert.ok(jar.min.x>lid.min.x&&jar.max.x<lid.max.x&&jar.min.z>lid.min.z&&jar.max.z<lid.max.z,'on the lid');
 assert.ok(jar.max.y<1.9,'in reach: top at '+jar.max.y.toFixed(2));
 // The account book: under Miss Higa's hand on the bandai, below her line of sight to the lobby.
 const book=box(room.getObjectByName('Account book')),top=box(room.getObjectByName('Bandai top'));
 assert.ok(book.min.x>top.min.x&&book.max.x<top.max.x&&book.min.z>top.min.z&&book.max.z<top.max.z,'on the bandai top');
 assert.ok(Math.hypot(book.getCenter(new THREE.Vector3()).x+4.5,book.getCenter(new THREE.Vector3()).z-2.6)<.6,'within her reach');
 assert.ok(book.max.y<.83,'flat on the counter');
 for(const name of ['Ticket tray','Andon base','Push-button phone','Desk bell'])assert.ok(!book.intersectsBox(box(room.getObjectByName(name))),'clear of the '+name);
 layout.dispose();
});

test('the storyteller knows the new props',()=>{
 const onsen=FEED_PLACES.find(p=>p.id==='onsen');
 for(const thing of ['the straw jar on the milk fridge','the uchiwa rack','the giant Hārī fan','Miss Higa’s rubber plant','Miss Higa’s account book'])assert.ok(onsen.things.includes(thing),thing);
 assert.ok(onsen.doing.includes('fanning themselves with an uchiwa'));
});
