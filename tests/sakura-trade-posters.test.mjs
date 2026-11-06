import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {existsSync,readFileSync} from 'node:fs';

// Sakura's staff walls (drawing SK-ST-003): the brewers', distillers' and Asagao's posters up the stair and in the hall,
// and the drink stock outside the office (the owner, 27 October 2026: "Put more advertisement posters on the walls in the
// hallway and stair case ... I want liquor and beer boxes in the hallway outside the office").
installDOM();
const {SAKURA_TRADE_POSTERS:D,SAKURA_POSTER_WALLS:P,POSTER_SIZE:S,SAKURA_HALL_STOCK:K,buildTradePosters,SAKURA_TRADE_ART,tradePosterPages}=await import('../src/world/interiors/sakura-trade-posters.js');
const {SAKURA_STAIR_TRIM:T,SAKURA_STAIRWELL:W}=await import('../src/world/interiors/sakura-stairs.js');
const {buildSakuraOfficeRoom,SAKURA_UPSTAIRS:U}=await import('../src/world/interiors/sakura-office-room.js');

test('every poster and every case has its reason, and every design hangs somewhere',()=>{
 for(const d of D)assert.ok(d.why&&d.brand,d.id);
 for(const k of K)assert.ok(k.why,k.print);
 for(const d of D)assert.ok(P.some(p=>p.id===d.id),`${d.id} hangs`);
 for(const p of P)assert.ok(D.some(d=>d.id===p.id),`${p.id} is a design`);
 for(const p of P.filter(p=>p.room==='office'||p.room==='stockroom'))assert.ok(p.who&&p.why&&p.lookAt,`${p.room}/${p.id} records purpose and access`);
});

/** Distance from a point to the handrail's centre line. */
function toRail(q){
 let best=9;const path=T.rail.path;
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],ab=b.map((v,k)=>v-a[k]),t=Math.max(0,Math.min(1,ab.reduce((s,v,k)=>s+(q[k]-a[k])*v,0)/ab.reduce((s,v)=>s+v*v,0)));
  best=Math.min(best,Math.hypot(...q.map((v,k)=>v-(a[k]+t*ab[k]))));}
 return best;
}
const corners=p=>{const [x,y,z]=p.at,h=S.h/2,w=S.w/2;return p.face[1]==='x'?[[x,y-h,z-w],[x,y-h,z+w],[x,y+h,z-w],[x,y+h,z+w]]:[[x-w,y-h,z],[x+w,y-h,z],[x-w,y+h,z],[x+w,y+h,z]];};

test('the stair posters hang clear of the handrail, inside the stairwell, none over another',()=>{
 const stair=P.filter(p=>p.room==='stair'),Wl=W.walls;
 for(const p of stair){
  for(const c of corners(p))assert.ok(toRail(c)>=.1,`${p.id}: a corner ${toRail(c).toFixed(3)} m from the rail`);
  // The bottom edge above the rail: the rail climbs, so both bottom corners are tested against the rail under them.
  const [l,r]=corners(p);for(const c of [l,r])assert.ok(toRail(c)>=.1);
  const [x,y,z]=p.at;assert.ok(x>=Wl.west-1e-9&&x<=Wl.east&&z>=Wl.south-1e-9&&z<=Wl.north+1e-9&&y+S.h/2<Wl.ceiling,p.id);
 }
 for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j];if(a.room!==b.room||a.face!==b.face||a.at[a.face[1]==='x'?0:2]!==b.at[b.face[1]==='x'?0:2])continue;
  const along=a.face[1]==='x'?2:0,apart=Math.abs(a.at[along]-b.at[along])>=S.w+.05||Math.abs(a.at[1]-b.at[1])>=S.h+.05;assert.ok(apart,`${a.id} and ${b.id} overlap`);}
 // Clear of the fittings already on the walls: the plates, the alarm, the light, the switches, Thuan's posters.
 const fittings=[...T.plates.map(p=>p.at),T.alarm.at,T.light.at,...T.switches.map(s=>s.at),...T.posters.map(p=>p.at)];
 for(const p of stair)for(const f of fittings){const [x,y,z]=p.at,along=p.face[1]==='x'?Math.abs(z-f[2]):Math.abs(x-f[0]),across=p.face[1]==='x'?Math.abs(x-f[0]):Math.abs(z-f[2]);
  if(across>.05)continue;assert.ok(along>S.w/2+.12||Math.abs(y-f[1])>S.h/2+.15,`${p.id} clear of a fitting at ${f}`);}
});

test('the hall: posters on its walls clear of the doors; the cases off the walking line, clear of every door',()=>{
 const hall=P.filter(p=>p.room==='hall'),H=U.hall;
 const doors=[{x:-2.0,z:[-1.6,-.7]},{x:.7,z:[-2.3,-1.4]},{x:.7,z:[.65,1.55]}];
 for(const p of hall){const [x,,z]=p.at;assert.ok(x>=H.minX-.06&&x<=H.maxX&&z-S.w/2>=H.minZ&&z+S.w/2<=H.maxZ,p.id);
  for(const d of doors)if(Math.abs(d.x-x)<.1)assert.ok(z+S.w/2<=d.z[0]||z-S.w/2>=d.z[1],`${p.id} clear of the door at ${d.z}`);}
 for(const k of K){const [x,z]=k.at,w=k.size[2]/2+.02;
  for(const d of doors)if(Math.abs(d.x-x)<.1)assert.ok(z+w<=d.z[0]||z-w>=d.z[1],`${k.print} clear of the door at ${d.z}`);
  assert.ok(z-w>=H.minZ&&z+w<=H.maxZ,`${k.print} in the hall`);}
 // Between the west stacks and the lockers on the east a 1.2 m way stays clear.
 const west=Math.max(...K.filter(k=>k.face==='+x').map(k=>k.at[0]+k.size[0]+.03)),east=.2;
 assert.ok(east-west>=1.2,`${(east-west).toFixed(2)} m clear`);
 // Stacks along the west wall do not touch (hand-stacked, a degree turned).
 const along=K.filter(k=>k.face==='+x').map(k=>[k.at[1]-k.size[2]/2,k.at[1]+k.size[2]/2]).sort((a,b)=>a[0]-b[0]);
 for(let i=1;i<along.length;i++)assert.ok(along[i][0]-along[i-1][1]>=.012,'a gap between stacks');
});

test('built: one paper mesh per room, four pins a poster, the cases solid and printed',()=>{
 const stair=buildTradePosters('stair'),hall=buildTradePosters('hall');
 assert.ok(stair.paper&&hall.paper);assert.equal(stair.pins.length,4*P.filter(p=>p.room==='stair').length);
 const room=new THREE.Group(),solids=[];buildSakuraOfficeRoom({room,reg(){},action(){},collider:(...a)=>solids.push(a)});
 const names=[];room.traverse(o=>names.push(o.name));
 assert.ok(names.includes('Sakura trade posters · hall')&&names.includes('Hall stock case prints'));
 for(const k of K)assert.ok(solids.some(([x,z])=>Math.abs(x-(k.at[0]+(k.face==='+x'?1:-1)*k.size[0]/2))<1e-6&&Math.abs(z-k.at[1])<1e-6),`${k.print} is solid`);
});

test('the reader has every approved model campaign as a complete source image',()=>{
 const pages=tradePosterPages();assert.equal(pages.length,D.length);
 assert.deepEqual(Object.keys(SAKURA_TRADE_ART).sort(),D.map(p=>p.id).sort());
 assert.equal(pages.filter(p=>p.image).length,9);
 assert.equal(pages.filter(p=>p.draw).length,0,'the corrected sake and UV revisions replace the interim designs');
 assert.ok(Object.values(SAKURA_TRADE_ART).every(art=>art.image.endsWith('-models-r1.webp')&&art.preview.endsWith('-models-r1-small.webp')),'full and preview images share one revision');
 for(const [id,art] of Object.entries(SAKURA_TRADE_ART)){
  const page=pages[D.findIndex(p=>p.id===id)];assert.ok(page.image.endsWith(art.image));
  for(const path of [art.image,art.preview]){const url=new URL('../assets/'+path,import.meta.url);assert.ok(existsSync(url),path);const bytes=readFileSync(url);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 }
});

test('each hall print has its own look prompt opening that campaign in the supplier collection',()=>{
 const parent=new THREE.Group(),registered=[],opened=[];
 buildTradePosters('hall',{parent,register:(object,label,fn)=>registered.push({object,label,fn}),onView:id=>opened.push(id)});
 const placements=P.filter(p=>p.room==='hall');assert.equal(registered.length,placements.length);
 registered.forEach((entry,i)=>{assert.equal(entry.object.parent,parent);assert.equal(entry.object.userData.npcInteraction,false);assert.match(entry.label,/Look at .* poster/);entry.fn();assert.equal(opened[i],placements[i].id);});
});
