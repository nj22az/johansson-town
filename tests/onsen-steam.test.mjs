import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_SEATS,ROCK_RING} from '../src/world/interiors/onsen.js';
import {ONSEN_STEAM,steamAt,steamDensity,puffCount,puffAtlas,puffReach,steamClearance} from '../src/world/interiors/onsen-steam.js';
import {ONSEN_PORCH} from '../src/world/interiors/onsen-front.js';
import {stageScenario,resetAll} from '../src/world/interiors/onsen-electrics.js';
import {FEED_PLACES} from '../src/feed/places.js';

// The atmosphere batch (shot plan B5): the night steam over the rock bath, the bath hall's 湯気, the porch haze at dusk.
const build=()=>{const room=new THREE.Group();const layout=buildOnsenInterior({room,reg(){},action(){},exit(){}});room.updateMatrixWorld(true);return {room,layout};};
const R=ONSEN_ROOM,field=id=>ONSEN_STEAM.fields.find(f=>f.id===id);
const NIGHT=1290,DUSK=1170,NOON=720;
// What a field puts on screen: each puff's opacity times its area.
const cover=puffs=>puffs.reduce((s,p)=>s+p.alpha*p.r*p.r,0);

test('the steam is data: three fields, each saying what it is, why it is there and what lights it',()=>{
 assert.deepEqual(ONSEN_STEAM.fields.map(f=>f.id),['rock','indoor','porch']);
 for(const f of ONSEN_STEAM.fields){
  assert.ok(f.name&&f.jp&&f.why.length>80&&f.period.length>40,f.id+' says what it is and why');
  assert.ok(f.breeze.why.length>30,f.id+': its air');
  for(const l of f.layers)assert.ok(l.count>0&&l.life>3&&l.why.length>20,f.id+' '+l.name);
  assert.ok(f.lights.length>0&&f.lights.length<=3,f.id+' is lit by up to three lamps');}
 // A phone's budget: one draw per field, about a hundred small quads, no light of its own.
 const quads=ONSEN_STEAM.fields.reduce((n,f)=>n+puffCount(f),0);
 assert.ok(quads<=110,'quads: '+quads);
 const t=puffAtlas();assert.ok(t.image.width<=128&&t.image.height<=128,'one small texture');
 // The puff shapes are clear at every tile's edge: no hard sprite edge.
 const {data,width}=t.image;
 for(let i=0;i<width;i++)for(const [x,y] of [[i,0],[0,i],[i,63],[63,i],[i,64],[64,i],[i,127],[127,i]])assert.equal(data[(y*width+x)*4+3],0,'edge pixel '+x+','+y);
});

test('the room builds it: three named meshes, one draw each, lit by lamps that exist, and no new lights',()=>{
 resetAll();stageScenario('restored');const {room,layout}=build();
 const group=room.getObjectByName('Umi-no-yu steam');
 assert.ok(group&&group.userData.dynamicProp,'never baked into the static batches or a depth photograph');
 for(const f of ONSEN_STEAM.fields){const m=room.getObjectByName(f.name);
  assert.ok(m?.isMesh&&m.geometry.isInstancedBufferGeometry&&m.geometry.instanceCount===puffCount(f),f.name);
  assert.equal(m.material.depthWrite,false,f.name+' writes no depth');assert.ok(m.material.transparent);
  for(const l of f.lights)assert.ok(room.getObjectByName(l.name)?.isLight,f.name+' is lit by '+l.name);}
 let lights=0;group.traverse(o=>{if(o.isLight)lights++;});assert.equal(lights,0,'the steam brings no light of its own');
 // The old sprites are gone.
 let sprites=0;room.traverse(o=>{if(o.isSprite)sprites++;});assert.equal(sprites,0);
 assert.equal(room.getObjectByName('Steam'),undefined);
 layout.dispose();
});

test('the steam is deterministic: the same moment always looks the same',()=>{
 for(const f of ONSEN_STEAM.fields)for(const minutes of [NOON,DUSK,NIGHT,NIGHT+.5])
  assert.deepEqual(steamAt(f,R,minutes*60,0),steamAt(f,R,minutes*60,0),f.id+' at '+minutes);
 // Two rooms built apart, ticked differently, set to the same minute: the same steam, puff for puff.
 resetAll();stageScenario('restored');
 const a=build(),b=build();
 a.layout.tick(0,NIGHT-3);for(let i=0;i<90;i++)a.layout.tick(1/30,NIGHT);a.layout.tick(0,NIGHT);
 b.layout.tick(0,NIGHT);
 for(const f of ONSEN_STEAM.fields){
  assert.deepEqual(a.layout.steam.puffs(f.id),b.layout.steam.puffs(f.id),f.id);
  const ma=a.room.getObjectByName(f.name).geometry.attributes,mb=b.room.getObjectByName(f.name).geometry.attributes;
  assert.deepEqual([...ma.puff.array],[...mb.puff.array]);assert.deepEqual([...ma.look.array],[...mb.look.array]);}
 assert.equal(b.layout.steam.clock,NIGHT*60,'its clock is the town’s, in seconds');
 // In play it runs on in real seconds from there.
 b.layout.tick(.5,NIGHT);assert.ok(Math.abs(b.layout.steam.clock-(NIGHT*60+.5))<1e-6);
 a.layout.dispose();b.layout.dispose();
});

test('on the real clock too: decades of town minutes, the same steam for the same moment, as thick and as smooth',()=>{
 // The game's clock is local minutes since 1970 (town-clock.js): about thirty million.
 const today=Math.floor(29_600_000/1440)*1440+NIGHT,rock=field('rock');
 assert.deepEqual(steamAt(rock,R,today*60,0),steamAt(rock,R,today*60,0));
 let before=steamAt(rock,R,today*60,0),total=0;
 for(let k=1;k<=120;k++){const now=steamAt(rock,R,today*60+k/30,0);
  now.forEach((p,i)=>{const q=before[i];if(Math.hypot(p.x-q.x,p.y-q.y)>.03)assert.ok(p.alpha<.005&&q.alpha<.005);else assert.ok(Math.abs(p.alpha-q.alpha)<.016);});
  total+=cover(now);before=now;}
 assert.ok(total/120>.5*cover(steamAt(rock,R,NIGHT*60,0)),'as thick as on the photographs’ clock');
});

test('nothing in it animates randomly',()=>{
 const src=readFileSync(new URL('../src/world/interiors/onsen-steam.js',import.meta.url),'utf8');
 assert.ok(!/Math\.random|performance\.now|Date\.now|new Date/.test(src),'no dice and no wall clock');
 // The room's own steam code is gone with its seeded rolls: the steam only reads the clock.
 const room=readFileSync(new URL('../src/world/interiors/onsen.js',import.meta.url),'utf8');
 assert.ok(!/SpriteMaterial|puffTexture/.test(room));
});

test('it moves smoothly: no puff jumps, pops in or out between one frame and the next',()=>{
 for(const f of ONSEN_STEAM.fields){
  let before=steamAt(f,R,NIGHT*60,0),moved=0;const change=before.map(()=>0);
  for(let k=1;k<=60*30;k++){const s=NIGHT*60+k/30,now=steamAt(f,R,s,0);
   now.forEach((p,i)=>{const q=before[i],step=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
    // A new life starts where the last ended, both clear: only then may a puff be somewhere else.
    if(step>.03){assert.ok(p.alpha<.005&&q.alpha<.005,f.id+' puff '+i+' jumped '+step.toFixed(3)+' m while showing, at '+s);return;}
    moved=Math.max(moved,step);
    // It fades in and out over many frames, and its fading never jerks (the change from frame to frame changes slowly).
    const d=p.alpha-q.alpha;assert.ok(Math.abs(d)<.016,f.id+' puff '+i+' flickered at '+s);
    assert.ok(Math.abs(d-change[i])<.01,f.id+' puff '+i+' jerked at '+s);change[i]=d;
    assert.ok(Math.abs(p.r-q.r)<.012,f.id+' puff '+i+' popped at '+s);
    assert.ok(Math.abs(p.spin-q.spin)<.01,f.id+' puff '+i+' spun');});
   before=now;}
  assert.ok(moved>0,f.id+' moves');}
 // Thirty seconds on it is a different picture, as thick.
 const r=field('rock'),a=steamAt(r,R,NIGHT*60,0),b=steamAt(r,R,NIGHT*60+30,0);
 assert.ok(a.some((p,i)=>Math.hypot(p.x-b[i].x,p.y-b[i].y)>.2));
 assert.ok(Math.abs(cover(a)-cover(b))<.5*cover(a));
});

test('denser at night: the rock bath steams thickest in the cool of the night, a few wisps by day',()=>{
 const rock=field('rock'),indoor=field('indoor'),porch=field('porch');
 // Over a minute, so one moment's arrangement does not decide it.
 const mean=(f,day)=>{let s=0;for(let k=0;k<60;k++)s+=cover(steamAt(f,R,NIGHT*60+k,day));return s/60;};
 assert.ok(mean(rock,0)>2*mean(rock,1),'rock bath: night '+mean(rock,0).toFixed(3)+' against day '+mean(rock,1).toFixed(3));
 assert.ok(mean(rock,1)>0,'a few wisps by day');
 assert.ok(steamDensity(rock,0)>steamDensity(rock,.5)&&steamDensity(rock,.5)>steamDensity(rock,1));
 // The bath hall is warm and damp whatever the hour: lighter than the rock bath at night, a little thicker after dark.
 assert.ok(mean(indoor,0)>mean(indoor,1)&&mean(indoor,0)<mean(rock,0));
 // The porch haze is an evening thing: nothing by day, there at dusk (8a at 19:30).
 assert.equal(mean(porch,1),0);assert.ok(mean(porch,.167)>.8*mean(porch,0));
 resetAll();stageScenario('evening');const {room,layout}=build();
 layout.tick(0,NOON);assert.equal(room.getObjectByName('Porch haze').visible,false,'no haze at noon');
 layout.tick(0,DUSK);assert.ok(room.getObjectByName('Porch haze').visible,'haze at dusk');
 layout.dispose();
});

test('lit by the lamps: the hall’s glow and the lantern on the rock bath’s steam after dark, and nothing when they are out',()=>{
 resetAll();stageScenario('restored');let {room,layout}=build();
 layout.tick(0,NIGHT);
 const [glow,lantern]=layout.steam.lamps('rock'),[porch]=layout.steam.lamps('porch');
 assert.ok(glow.r>1&&lantern.r>1,'the warm glass and the lantern light it');
 assert.ok(glow.r>glow.b&&lantern.r>lantern.b,'warm');
 assert.ok(porch.b>=porch.r,'the porch lamp is cool white');
 // The steam is lit where the lamps are: the shader's own uniforms carry them where they hang.
 const U=room.getObjectByName('Rock bath steam').material.uniforms;
 assert.deepEqual(U.lampAt.value[1].toArray().map(v=>+v.toFixed(2)),[-4.05,.74,-8.05]);
 // By day the glass is no brighter than the sky, and the lantern's photocell has it off.
 layout.tick(0,NOON);const [g2,l2]=layout.steam.lamps('rock');assert.equal(g2.r,0);assert.equal(l2.r,0);
 layout.dispose();
 // With the house isolated every lamp is out: the steam keeps only the night's own dim light.
 resetAll();stageScenario('isolated');({room,layout}=build());layout.tick(0,NIGHT);layout.realUpdate();
 for(const f of ONSEN_STEAM.fields)for(const c of layout.steam.lamps(f.id))assert.equal(c.r+c.g+c.b,0,f.id);
 layout.dispose();resetAll();
});

test('clear of everything: off the water, and thinned to nothing before it meets a rock, a wall, the eave or the porch',()=>{
 const P=R.pool,T=R.tub,W=R.walls;
 // The reach in the data covers the texture's own edge and the depth push.
 const {data,width}=puffAtlas().image;let edge=0;
 for(let y=0;y<width;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>0)edge=Math.max(edge,2*Math.hypot((x%64+.5)/64-.5,(y%64+.5)/64-.5));
 assert.ok(Math.hypot(edge,ONSEN_STEAM.push)<=ONSEN_STEAM.reach+1e-3,'reach '+ONSEN_STEAM.reach+' covers the texture ('+edge.toFixed(3)+') and the push');
 for(const f of ONSEN_STEAM.fields)for(const b of f.clear)assert.ok(b.length===7&&b[0]<b[1]&&b[2]<b[3]&&b[4]<b[5]&&b[6].length>5,f.id+': '+b[6]);
 let shown=0;
 for(let k=0;k<240;k++){const s=NIGHT*60+k*1.7;
  for(const f of ONSEN_STEAM.fields)for(const p of steamAt(f,R,s,f.id==='porch'?.1:0)){
   const room=steamClearance(f,R,p)/puffReach(p);
   // Within two fifths of its reach of anything solid it is not drawn at all; it thins out from 1.2 of it.
   if(room<.4)assert.equal(p.alpha,0,f.id+' puff drawn against '+room.toFixed(2));
   if(p.alpha>0)shown++;}
  for(const p of steamAt(field('rock'),R,s,0)){
   // Off the water: its body is above the surface, however it is turned.
   assert.ok(p.y-.85*p.r*Math.sqrt(p.stretch)>=P.water-1e-9,'rock puff in the water');
   assert.ok(p.z<R.hall.bath&&Math.abs(p.x)<W.maxX,'rock puff in the building or past the fence');}
  for(const p of steamAt(field('indoor'),R,s,0)){
   assert.ok(p.y-.85*p.r>=T.water-1e-9,'indoor puff in the water');
   if(p.alpha>0)assert.ok(p.y+puffReach(p)*.5<W.height,'indoor puff in the ceiling');}
  for(const p of steamAt(field('porch'),R,s,.1))if(p.alpha>0)assert.ok(p.z>ONSEN_PORCH.sill.z1,'porch haze inside the door');}
 assert.ok(shown>240*60,'most of it is drawn: '+shown);
});

test('the faces in the ring stay clear: the steam is born thin at the water and thickens above the heads',()=>{
 // Heads of six bathers soaking at the ROCK_RING seats: about .2–.5 m above the water.
 const heads=ROCK_RING.map(id=>ONSEN_SEATS[id].position);
 assert.equal(heads.length,6);
 const rock=field('rock');let low=0,high=0;
 for(let k=0;k<120;k++)for(const p of steamAt(rock,R,NIGHT*60+k*2,0)){
  const atFaces=p.y<R.pool.water+.6;(atFaces?(low+=p.alpha*p.r*p.r):(high+=p.alpha*p.r*p.r));
  // Nothing thick sits on a face: a puff over a seat at face height is a thin one.
  for(const [x,,z] of heads)if(Math.hypot(p.x-x,p.z-z)<.25&&atFaces)assert.ok(p.alpha<.3,'thick steam on a face at '+x+','+z);}
 assert.ok(high>2*low,'most of the steam is above the faces');
 // And each puff is drawn at the depth of its far side, so a head inside one hides it instead of being cut by it.
 assert.ok(ONSEN_STEAM.push>0&&ONSEN_STEAM.push<=1&&ONSEN_STEAM.near>0);
});

test('the storyteller knows the steam',()=>{
 const onsen=FEED_PLACES.find(p=>p.id==='onsen');
 assert.ok(onsen.things.includes('the steam over the rock bath'));
});
