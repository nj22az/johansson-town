import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_SEATS,ROCK_RING} from '../src/world/interiors/onsen.js';
import {ONSEN_ROCKS,rockGeometry,rockDetail} from '../src/world/interiors/onsen-rocks.js';
import {ONSEN_SEA_VIEW,ONSEN_HARBOUR} from '../src/world/interiors/onsen-night.js';
import {ONSEN_STEAM} from '../src/world/interiors/onsen-steam.js';

// The rock bath's geometry (shot plan 12a–12d): closed, smooth boulders, the water as a surface for the ink, and a sea
// view with no edge in sight from the water.
const build=()=>{const room=new THREE.Group();const layout=buildOnsenInterior({room,reg(){},action(){},exit(){}});room.updateMatrixWorld(true);return {room,layout};};
const rocksOf=room=>{const out=[];room.traverse(o=>{if(o.isMesh&&o.name==='Bath rock')out.push(o);});return out;};
const R=ONSEN_ROOM,P=R.pool;

test('every rock is one closed stone: indexed, no corner twice, every edge shared by exactly two faces, the same way round',()=>{
 const {room,layout}=build(),rocks=rocksOf(room);
 assert.equal(rocks.length,32,'thirty round the water and the two big ones');
 for(const [n,m] of rocks.entries()){const g=m.geometry,p=g.attributes.position,idx=g.index;
  assert.ok(idx,'rock '+n+' is indexed');
  for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]),'rock '+n+': no NaN or infinite corner');
  const nor=g.attributes.normal;for(let i=0;i<nor.array.length;i++)assert.ok(Number.isFinite(nor.array[i]),'rock '+n+': its normals are numbers');
  const seen=new Set();for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join();assert.ok(!seen.has(k),'rock '+n+': corner '+i+' is not a copy');seen.add(k);}
  // Each edge in both directions once: a closed surface with its faces all wound the same way.
  const edges=new Map();
  for(let f=0;f<idx.count;f+=3){const t=[idx.getX(f),idx.getX(f+1),idx.getX(f+2)];assert.ok(t[0]!==t[1]&&t[1]!==t[2]&&t[0]!==t[2],'rock '+n+': no degenerate face');
   for(let e=0;e<3;e++){const a=t[e],b=t[(e+1)%3],k=a+'>'+b;assert.ok(!edges.has(k),'rock '+n+': edge '+k+' used once in its direction');edges.set(k,true);}}
  for(const k of edges.keys()){const [a,b]=k.split('>');assert.ok(edges.has(b+'>'+a),'rock '+n+': edge '+k+' has a face on its other side');}
  // Euler: a closed surface without holes has V − E + F = 2.
  assert.equal(p.count-edges.size/2+idx.count/3,2,'rock '+n+' is a sphere, no holes');
  // Its normals face out, and it stays within its budget.
  const c=new THREE.Vector3(),v=new THREE.Vector3(),q=new THREE.Vector3();g.computeBoundingBox();g.boundingBox.getCenter(c);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).sub(c);q.fromBufferAttribute(nor,i);assert.ok(v.dot(q)>0,'rock '+n+': normal '+i+' faces out');}
  assert.ok(idx.count/3<=500,'rock '+n+': '+idx.count/3+' triangles');}
 const total=rocks.reduce((s,m)=>s+m.geometry.index.count/3,0);assert.ok(total<12000,'all the rocks: '+total+' triangles');
 layout.dispose();
});

test('the rocks keep their places, sizes, colours and turns, and the seeded sequence after them is where it was',()=>{
 // The room's sequence as it has always been drawn (onsen.js): 240 draws for a rock's shape, one for its colour, one for its
 // turn, then the next rock; the ring's sizes between them.
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const want=[],rock=(x,z,s,y=0)=>{for(let i=0;i<240;i++)rnd();const dark=!(rnd()>.5);want.push({x,y:y+s*.25,z,s,dark,turn:rnd()*6});};
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2,x=P.x+Math.cos(a)*(P.rx+.12),z=P.z+Math.sin(a)*(P.rz+.1);
  const sea=Math.sin(a)<-.2,door=Math.sin(a)>.6;rock(x,z,sea?.14+rnd()*.05:door?.2:.26+rnd()*.12,sea?-.04:.02);}
 rock(P.x+P.rx+.15,P.z+.2,.52,.05);rock(P.x-P.rx-.1,P.z-.3,.48,.05);
 const {room,layout}=build(),rocks=rocksOf(room);
 assert.equal(rocks.length,want.length);
 rocks.forEach((m,i)=>{const w=want[i];
  assert.deepEqual(m.position.toArray().map(v=>+v.toFixed(9)),[w.x,w.y,w.z].map(v=>+v.toFixed(9)),'rock '+i+' place');
  assert.equal(m.scale.x,w.s);assert.equal(m.scale.y,w.s);assert.equal(m.rotation.y,w.turn,'rock '+i+' turn');
  assert.equal(m.material.color.getHex(),w.dark?0x5b5750:0x77716a,'rock '+i+' colour');
  assert.equal(m.geometry.index.count/3,20*(rockDetail(w.s)+1)**2,'rock '+i+' cut by its size');});
 // A rock takes exactly its 240 draws.
 let n=0;rockGeometry(()=>{n++;return .5;});assert.equal(n,ONSEN_ROCKS.draws);
 // Its lumps stay in the old range, squashed the old way: no spike, no dent through the middle.
 for(const m of rocks){m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;
  for(const [lo,hi] of [[b.min.x,b.max.x],[b.min.z,b.max.z]])assert.ok(-lo>=.7&&-lo<=1.14&&hi>=.7&&hi<=1.14);
  assert.ok(b.max.y<=1.14*.62&&-b.min.y<=1.14*.62&&b.max.y>.4);}
 // The seats, their stands and the pool's collider are where they were.
 assert.deepEqual(ROCK_RING.map(id=>ONSEN_SEATS[id].position),[[.75,0,-6.45],[1.9,0,-6.85],[.45,0,-7.6],[-.55,0,-7.6],[-2,0,-6.85],[-.85,0,-6.55]]);
 assert.ok(layout.colliders.some(c=>c.x===P.x&&c.z===P.z&&Math.abs(c.w-(P.rx*2+.3))<1e-9&&Math.abs(c.d-(P.rz*2+.25))<1e-9&&c.height===.5),'the pool’s collider');
 layout.dispose();
});

test('the water is a surface for the ink: a copy of it writes depth and no colour, after the steam, out to the wall',()=>{
 const {room,layout}=build(),water=room.getObjectByName('Rock bath water'),ink=room.getObjectByName('Rock bath water surface (ink)');
 assert.ok(ink?.isMesh&&ink.parent===water,'it moves with the water');
 assert.equal(ink.geometry,water.geometry);
 const m=ink.material;assert.equal(m.colorWrite,false,'no colour');assert.equal(m.depthWrite,true);assert.equal(m.depthTest,true,'never over what stands out of the water');assert.ok(m.transparent,'drawn with the see-through things, last');
 assert.equal(water.material.depthWrite,false,'the water itself looks as it did');
 let latest=0;room.traverse(o=>{if(o!==ink&&o.isMesh&&o.material?.transparent)latest=Math.max(latest,o.renderOrder);});
 assert.ok(ink.renderOrder>latest,'after every see-through thing in the room, the steam ('+Math.max(...ONSEN_STEAM.fields.map(f=>f.renderOrder))+') too');
 // Out to the pool's wall (a 40-sided cylinder of radius rx, rz) and no further than a couple of centimetres past it.
 const s=new THREE.Vector3();ink.getWorldScale(s);
 assert.ok(s.x>=P.rx*Math.cos(Math.PI/40)&&s.x<=P.rx+.02,'across: '+s.x);assert.ok(s.y>=P.rz*Math.cos(Math.PI/40)&&s.y<=P.rz+.02,'along: '+s.y);
 assert.ok(Math.abs(ink.getWorldPosition(new THREE.Vector3()).y-P.water)<.01,'at the water line');
 assert.equal(ink.castShadow,false);let hits=[];ink.raycast(new THREE.Raycaster(new THREE.Vector3(P.x,2,P.z),new THREE.Vector3(0,-1,0)),hits);assert.equal(hits.length,0,'never in the way of a click');
 // Like the water, left out of the depth photographs (game.js depth(): colorWrite false is see-through).
 layout.dispose();
});

test('the sea view: flat where the harbour lights are, the horizon where it was, and no edge of it from the water or the wide views',()=>{
 const {room,layout}=build(),sea=room.getObjectByName('Umi-no-yu sea view'),S=ONSEN_SEA_VIEW,H=ONSEN_HARBOUR;
 assert.ok(sea?.isMesh);
 // Behind every harbour light, 15 cm, on the flat part; the horizon at y 4.8 (the painting's 0.46).
 for(const l of [...H.lights,H.mouth.green,H.mouth.red])assert.ok(Math.abs(l.x)+l.size<S.halfWidth,'light at '+l.x+' is on the flat part');
 assert.equal(S.z,H.z-.15);assert.equal(S.horizon,H.horizon);assert.ok(Math.abs(S.bottom+.46*S.paint-S.horizon)<1e-9);
 const ray=new THREE.Raycaster(),hits=[];
 for(const x of [-40,0,40]){ray.set(new THREE.Vector3(x,4.8,-6),new THREE.Vector3(0,0,-1));hits.length=0;sea.raycast(ray,hits);
  assert.ok(hits.length===1&&Math.abs(hits[0].point.z-S.z)<1e-6,'flat at '+x);
  const v=hits[0].uv.y;assert.ok(Math.abs(v-.46)<1e-6,'the horizon at '+x+': '+v);}
 // Every ray a lens in the water can send towards the sea, the sides and up into the sky meets something of the room: never
 // the room's own background past an edge of the backdrop. From each of the six ring seats at eye height, and from the
 // four finale cameras (shot plan 12a–12d), in every direction from 95° left to 95° right of the sea and 0–60° up.
 const solid=[];room.traverse(o=>{if(o.isMesh||o.isInstancedMesh)solid.push(o);});
 const meets=(from,dir)=>{ray.set(from,dir);ray.far=1000;return ray.intersectObjects(solid,false).length>0;};
 const eyes=[...ROCK_RING.map(id=>{const s=ONSEN_SEATS[id];return new THREE.Vector3(s.position[0],s.eyeY,s.position[2]);}),
  ...[[0,1.35,-3.7],[-.1,.16,-6.25],[1.25,.2,-6.15],[-1.55,.3,-5.85]].map(p=>new THREE.Vector3(...p))];
 const d=new THREE.Vector3();let rays=0;
 for(const eye of eyes)for(let yaw=-95;yaw<=95;yaw+=5)for(let up=0;up<=60;up+=4){const a=yaw*Math.PI/180,e=up*Math.PI/180;
  d.set(Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e));rays++;
  assert.ok(meets(eye,d),`from ${eye.toArray().map(v=>v.toFixed(2))} at ${yaw}° round, ${up}° up: the backdrop ends`);}
 assert.ok(rays>3000);
 // Its far edges are past any frame: its top more than 60° up from the water, its wings' ends behind the house's line.
 const b=new THREE.Box3().setFromObject(sea);assert.ok(b.max.y>=150&&b.max.z>=R.hall.bath,'top '+b.max.y+', wings to z '+b.max.z);
 // The night colour still darkens it with the sky (onsen.js tick), and it is drawn in flat colour, no light, no fog.
 layout.tick(0,1290);assert.ok(sea.material.color.r<.2);layout.tick(0,720);assert.ok(sea.material.color.r>.9);
 assert.ok(sea.material.isMeshBasicMaterial&&sea.material.fog===false);
 layout.dispose();
});
