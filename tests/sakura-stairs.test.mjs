import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect} from '../physics.js';

/**
 * Sakura's inside stair is a climb you watch, not a flight anyone walks by hand (the owner, 27 October 2026: "The black part
 * should not be shown ... No the loading screen is walking up the stairs"; drawing SK-ST-001). Before it, a passage into darkness (the owner, 20 October 2026, on his iPhone:
 * "I don't want the stairs to be traversable it's too much errors when running up the stairs, I want the stairs to lead up
 * to a black hole and we disappear into there and when it loads we come up on the upper floor"). The shop and the office
 * storey are two rooms; sakura-stairs.js draws each end and says where the passage starts, goes and arrives; game.js
 * (takeSakuraStair) walks him into the dark, fades, and opens the other room.
 */
installDOM();globalThis.self=globalThis;
const {SAKURA_STAIR_PASSAGE:P,onSakuraStairFoot,onSakuraStairHead,buildSakuraStairFoot}=await import('../src/world/interiors/sakura-stairs.js');
const {SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
const {suppliedRoomBoundsBlocked}=await import('../src/world/supplied-rooms.js');
const {buildSakuraInterior}=await import('../src/world/interiors/sakura-interior.js');
const {buildSakuraOfficeRoom}=await import('../src/world/interiors/sakura-office-room.js');
const R=.28,GAME=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const inBox=([x,y,z],[x0,x1,z0,z1,y0,y1],pad=0)=>x>=x0-pad&&x<=x1+pad&&z>=z0-pad&&z<=z1+pad&&y>=y0-pad&&y<=y1+pad;

/** The shop as the game builds it (the market room), with its stair foot, its prompts and its colliders. */
async function shop(){
 const room=new THREE.Group(),prompts=[];let stair=null;
 const d=buildSakuraInterior({room,reg:(o,label,fn)=>prompts.push({o,label,fn}),action(){},exit(){},stair:dir=>{stair=dir;}});await d.ready();
 room.updateMatrixWorld(true);
 const colliders=[...d.layout.colliders];
 const blocked=(x,z)=>suppliedRoomBoundsBlocked(SAKURA_LAYOUT,x,z,R)||colliders.some(c=>standingHitsRect(x,z,R,0,c));
 return {room,prompts,colliders,blocked,taken:()=>stair};
}
/** The office storey as its own room, as game.js builds it (roomShell), unmerged so every piece keeps its name. */
function office(){
 const room=new THREE.Group(),prompts=[],colliders=[];
 const layout=buildSakuraOfficeRoom({room,reg:(o,label,fn)=>prompts.push({o,label,fn}),action(){},collider:(x,z,w,d,height=2.8,minY=0)=>colliders.push({x,z,w,d,height,minY}),downstairs(){},evacuate(){},merge:false});
 room.updateMatrixWorld(true);
 const b=layout.bounds,blocked=(x,z)=>x-R<b.minX||x+R>b.maxX||z-R<b.minZ||z+R>b.maxZ||colliders.some(c=>standingHitsRect(x,z,R,0,c));
 return {room,prompts,colliders,blocked,layout};
}
/** Every 0.05 m cell reachable at a normal player's radius from a start, on the room's one floor. */
function reach(blocked,[sx,sz],box){
 const s=.05,key=(i,j)=>i+','+j,seen=new Set([key(Math.round(sx/s),Math.round(sz/s))]),q=[[Math.round(sx/s),Math.round(sz/s)]];
 while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj,k=key(ni,nj),x=ni*s,z=nj*s;
  if(seen.has(k)||x<box.minX||x>box.maxX||z<box.minZ||z>box.maxZ||blocked(x,z))continue;seen.add(k);q.push([ni,nj]);}}
 return {has:(x,z)=>seen.has(key(Math.round(x/s),Math.round(z/s))),cells:()=>[...seen].map(k=>k.split(',').map(v=>v*s))};
}
/** The first thing a ray from `from` meets in the room: what the eye, or the lens behind him, sees that way. */
const caster=new THREE.Raycaster();
function sees(room,from,yaw,pitch){
 caster.set(new THREE.Vector3(...from),new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));caster.far=30;
 return caster.intersectObject(room,true).find(h=>h.object.visible!==false&&h.object.isMesh)||null;
}
const dark=h=>!!h?.object.material?.userData?.darkness;

/** Every mesh's material is lit and coloured: nothing black, nothing unlit standing in for a void. */
const blackMeshes=room=>{const out=[];room.traverse(o=>{if(!o.isMesh||o.visible===false)return;const m=[o.material].flat();if(m.some(x=>x?.userData?.darkness||x?.color&&x.color.getHex()===0&&!x.map))out.push(o.name);});return out;};
const {SAKURA_STAIR_CLIMB:C,SAKURA_STAIRWELL:W,toOffice,SAKURA_STAIR}=await import('../src/world/interiors/sakura-stairs.js');const SAKURA_STAIR_HEIGHT=SAKURA_STAIR.height;

test('the climb, as data: the whole stair walked in the storey he starts in, seen from its locked camera, each end clear',()=>{
 for(const dir of ['up','down']){
  const path=C[dir],len=path.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-path[i][0],p[1]-path[i][1],p[2]-path[i][2]),0),t=len/C.speed;
  assert.ok(t>=2.5&&t<=8,`${dir}: the climb takes ${t.toFixed(1)} s`);
  assert.ok(path.some(p=>Math.abs(p[1]-W.landing.y)<1e-9),`${dir}: round the turning landing`);
 }
 // Each walk ends on the turning landing, as he turns out of his camera's sight; the cut takes him to the other storey.
 for(const dir of ['up','down']){const e=C[dir].at(-1);assert.equal(e[1],W.landing.y);assert.ok(e[0]>W.landing.x0&&e[0]<W.landing.x1&&e[2]>W.landing.z0&&e[2]<W.landing.z1,`${dir} ends on the landing`);}
 const at=P.head.arrive.at,foot=P.foot.arrive.at;
 assert.ok(!onSakuraStairHead({x:at[0],y:at[1],z:at[2]}),'arriving upstairs he is not on the stair');
 assert.ok(!onSakuraStairFoot({x:foot[0],y:foot[1],z:foot[2]}),'arriving downstairs he is not on the stair');
 // Every point of the walk is on a tread, a landing or a floor: its height is a whole number of rises.
 for(const half of [C.up,C.down])for(const [x,y,z] of half)assert.ok(Math.abs(y/W.rise-Math.round(y/W.rise))<1e-6,`a step at ${x},${y},${z}`);
 // The cameras: below, at the stair's foot (the owner: "Camera should lock from below we just see him go up"); above.
 assert.ok(C.camera.shop.at[1]<W.landing.y,'the shop camera is below the turning landing');assert.ok(C.camera.office.at[1]>SAKURA_STAIR_HEIGHT,'the office camera is over the top landing');
 for(const c of Object.values(C.camera))assert.ok(c.follow>0&&c.follow<=.5,'locked: it turns only a little after him');
 assert.ok(C.cut>0&&C.cut<=.3,'the cut is a blink, not a loading screen');
});

test('the shop: the whole stairwell built, nothing black, the stair walkable only onto its first treads',async()=>{
 const {room,prompts,blocked,taken}=await shop(),names=[];room.traverse(o=>names.push(o.name));
 for(const n of ['Sakura stairwell wood','Sakura stairwell plaster','Sakura stairwell timber','Sakura stairwell ceiling'])assert.ok(names.includes(n),n);
 assert.deepEqual(blackMeshes(room),[],'nothing black');
 const go=prompts.find(p=>p.label==='Go upstairs');assert.ok(go,'a Go upstairs prompt');go.fn();assert.equal(taken(),'up');
 const r=reach(blocked,[-.2,-5.6],{minX:-6,maxX:1,minZ:-6.9,maxZ:-4});
 assert.ok(r.has(...[P.foot.arrive.at[0],P.foot.arrive.at[2]]),'the foot, where he arrives coming down, is reachable');
 assert.ok(r.cells().some(([x,z])=>onSakuraStairFoot({x,y:0,z})),'he can step onto the stair');
 const into=(x,z,b)=>Math.hypot(x-Math.max(b[0],Math.min(x,b[1])),z-Math.max(b[2],Math.min(z,b[3])))<R-.02;
 for(const [x,z] of r.cells())assert.ok(!P.foot.dark.some(b=>b[4]<1&&into(x,z,b)),`walked up the flights by hand at ${x.toFixed(2)},${z.toFixed(2)}`);
});

/** From each point, every way up and round: the first thing seen is built (never the sky), and inside the building. */
function looksClosed(room,points,inside){
 const bad=[];
 for(const p of points)for(let k=0;k<24;k++)for(const pitch of [-1.1,-.6,-.25,0,.3,.7,1.1]){
  const h=sees(room,p,k*Math.PI/12,pitch);
  if(!h){bad.push(`nothing from ${p} yaw ${k} pitch ${pitch}`);continue;}
  if(!inside(h.point))bad.push(`${h.object.name} at ${h.point.toArray().map(v=>v.toFixed(2))} from ${p}`);
 }
 return bad;
}
test('from the stockroom, the foot and the climb camera, the stairwell is closed: no sky, no void',async()=>{
 const {room}=await shop();
 const pts=[[-1.1,1.6,-4.6],[-.4,1.6,-5.6],[-2.2,1.2,-4.6],[...C.camera.shop.at],[W.landing.x0+.6,W.landing.y+1.5,-5.4],[-3.3,2.9,-6.15],[-2.2,5.4,-6.15]];
 const bad=looksClosed(room,pts,q=>q.x>-6.95&&q.x<6.95&&q.z>-6.95&&q.z<3.95&&q.y>-.25&&q.y<W.walls.ceiling+.2);
 assert.deepEqual(bad.slice(0,8),[],`${bad.length} views into nothing`);
});

test('the office: the stair head opens on the whole stair, nothing black, a rail, nobody walks out over the well',()=>{
 const {room,prompts,blocked,layout}=office(),names=[];room.traverse(o=>names.push(o.name));
 for(const n of ['Stair head newel post','Stair head handrail','Stair head bottom rail','Stair head baluster'])assert.ok(names.includes(n),n);
 // A balustrade, not a board: balusters with gaps under 110 mm (the owner circled the old solid board: "What's this wall or door?").
 const zs=[];room.traverse(o=>{if(o.name==='Stair head baluster')zs.push(o.position.z);});zs.sort((a,b)=>a-b);
 assert.ok(zs.length>=10);for(let i=1;i<zs.length;i++)assert.ok(zs[i]-zs[i-1]-.03<.11,'baluster gap');assert.ok(names.includes('Sakura stairwell wood'));
 assert.deepEqual(blackMeshes(room),[],'nothing black');
 assert.deepEqual(layout.spawn,[...P.head.arrive.at]);assert.equal(layout.yaw,P.head.arrive.yaw);
 assert.ok(prompts.some(p=>p.label==='Go downstairs'));
 const r=reach(blocked,[P.head.arrive.at[0],P.head.arrive.at[2]],{minX:-6.4,maxX:6.4,minZ:-6.2,maxZ:4.5});
 assert.ok(r.cells().some(([x,z])=>onSakuraStairHead({x,y:0,z})),'he can step onto the stair head');
 for(const [x,z] of r.cells())assert.ok(!P.head.dark.slice(0,2).some(b=>x>b[0]&&x<b[1]&&z>b[2]&&z<b[3]),`over the well at ${x.toFixed(2)},${z.toFixed(2)}`);
 // The hall, the stair head and the climb's camera (whose every view the climb uses; the landing below is seen from it).
 const pts=[[-1.2,1.6,-4.15],[-2.3,1.6,-5.0],toOffice(C.camera.office.at),[-1.0,1.6,-5.8]];
 const bad=looksClosed(room,pts,q=>q.x>-6.5&&q.x<6.5&&q.z>-6.3&&q.z<4.6&&q.y>-4.3&&q.y<3.0);
 assert.deepEqual(bad.slice(0,8),[],`${bad.length} views into nothing`);
});

test('game.js walks the climb in this storey from its locked camera, the other storey loading, then the cut',()=>{
 for(const s of ['function takeSakuraStair','function stepStairPassage','function finishStairPassage','function placeStairCamera','function placePassageView',
  'function checkSakuraStair','SAKURA_STAIR_CLIMB','await S.ready'])assert.ok(GAME.includes(s),s);
 for(const s of ['placeLandingLens','stairLens','sakuraBoundsAt','STAIR_LENS_EASE','storeys:','officeEntry','SAKURA_STAIR_PASSAGE.fade'])assert.ok(!GAME.includes(s),'gone: '+s);
 assert.match(GAME,/#exitRoomButton'\)\.onclick=\(\)=>\{if\(current\?\.id==='sakura-office'\)\{takeSakuraStair\('down'\)/);
});

test('the stairwell trim (SK-ST-002): strings, a continuous handrail on brackets, nosing, the campaign posters, no door in the stair, the fittings',async()=>{
 const {SAKURA_STAIR_TRIM:T,buildSakuraStairwell}=await import('../src/world/interiors/sakura-stairs.js');
 for(const storey of ['shop','office']){
  const root=new THREE.Group(),g=buildSakuraStairwell(root,{storey}),names=[];g.traverse(o=>{if(o.isMesh)names.push(o.name);});
  for(const k of ['string','rail','metal','nosing','red','lamp','glow','fitting'])assert.ok(names.includes('Sakura stairwell '+k),`${storey}: ${k}`);
  for(const p of ['1F','2F'])assert.ok(names.includes('Stair plate '+p),`${storey}: the ${p} plate`);
  // No door in the stair: the old cupboard door opened onto the well between the flights (the owner: "Why is there a door").
  assert.ok(!names.includes('Sakura stairwell door'),`${storey}: no door`);
  // The campaign posters (Pixar Thuan, SP-NK-001's print) on the walls, flat on their faces.
  const posters=names.filter(n=>n.startsWith('Stair poster'));assert.equal(posters.length,2,`${storey}: two posters`);
 }
 // One rail from the foot to the top landing, 850 mm over the nosing line, a hand's width off the wall.
 const path=T.rail.path;assert.ok(path.length>=6&&T.rail.off-T.rail.radius>=.04);
 for(let i=1;i<path.length;i++)assert.ok(Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1],path[i][2]-path[i-1][2])>0,'no zero-length piece');
 assert.equal(T.strings.length,4,'a string each side of each flight');
});
