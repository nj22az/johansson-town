import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_INTERIOR,FERRY_ENGINE_ROOM,FERRY_MACHINERY_SPACES} from '../src/world/ferry-interior.js';
import {FERRY_PIPING} from '../src/world/ferry-piping.js';
import {pipeSegments,pipeRadius,PIPE_LANES} from '../src/world/ferry-pipe-routes.js';

const MACHINERY=new Set(['engine-room','aux-room','workshop','engine-store','er-double-bottom','control-booth']);
const SKIP=new Set(['exhaust','hydraulics']);
const A=FERRY_INTERIOR.anchors,R=FERRY_INTERIOR.pipes;

test('every machine, tank stub and penetration of the piping diagrams in the machinery spaces has an anchor; every line between two of them is routed (6r-1)',()=>{
 for(const s of FERRY_PIPING){if(SKIP.has(s.id))continue;
  for(const n of s.nodes){if(!MACHINERY.has(n.where)||n.kind==='sensor'||n.kind==='drum')continue;assert.ok(A[s.id+'/'+n.id],'anchor for '+s.id+'/'+n.id+' ('+n.label+')');}
  for(const l of s.lines){if(!(l.dn>0))continue;const a=A[s.id+'/'+l.from],b=A[s.id+'/'+l.to];if(!(a&&b))continue;
   const r=R.find(r=>r.system===s.id&&r.from===l.from&&r.to===l.to);assert.ok(r,'routed: '+s.id+' '+l.from+'→'+l.to);
   assert.deepEqual(r.points[0],a.pos,'starts at its anchor');assert.deepEqual(r.points[r.points.length-1],b.pos,'ends at its anchor');assert.equal(r.dn,l.dn);}}
 assert.ok(R.length>=150,'routes: '+R.length);
 // A line whose end is out of the machinery spaces (the bunker station, the steering-gear room, the CO₂ room, the filling connection) is not routed: it ends at a penetration or is drawn on its own deck later.
 const unrouted=FERRY_PIPING.flatMap(s=>SKIP.has(s.id)?[]:s.lines.filter(l=>l.dn>0&&!(A[s.id+'/'+l.from]&&A[s.id+'/'+l.to])).map(l=>s.id+':'+l.from+'>'+l.to));
 assert.ok(unrouted.length<=9&&unrouted.every(u=>/bunker|efchest|efp|iso|co2rel|co2b|fill/.test(u)),'only lines to other decks are unrouted: '+unrouted.join(' '));
});

test('every routed run is orthogonal, in its system’s colour and bore, and stays out of the machines, the plates and the bulkheads except at its ends',()=>{
 const solids=FERRY_INTERIOR.boxes.filter(b=>b.solid&&b.name&&!/side|deckhead|bulkhead|trunk|casing|partition|escape/.test(b.name));
 const lo=(b,k)=>Math.min(b.a[k],b.b[k]),hi=(b,k)=>Math.max(b.a[k],b.b[k]);
 const inside=(p,b,m)=>p[0]>lo(b,0)+m&&p[0]<hi(b,0)-m&&p[1]>lo(b,1)+m&&p[1]<hi(b,1)-m&&p[2]>lo(b,2)+m&&p[2]<hi(b,2)-m;
 const ER=FERRY_ENGINE_ROOM;let hits=[];
 for(const r of R){
  for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];const axes=[0,1,2].filter(k=>Math.abs(a[k]-b[k])>1e-6);assert.equal(axes.length,1,r.system+' '+r.from+'→'+r.to+' segment '+i+' is axis-aligned');}
  // Sample the run's middle (not its first and last metre, which enter the machines it joins) against the solids.
  const pts=[];for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])/.1));for(let j=0;j<=n;j++)pts.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,a[2]+(b[2]-a[2])*j/n]);}
  const ends=[r.points[0],r.points[r.points.length-1]];
  for(const p of pts){if(ends.some(e=>Math.hypot(p[0]-e[0],p[1]-e[1],p[2]-e[2])<.6))continue;
   const hit=solids.find(b=>inside(p,b,.02));if(hit)hits.push(r.system+' '+r.from+'→'+r.to+' through '+hit.name+' at '+p.map(n=>n.toFixed(2)));
   assert.ok(p[1]>=ER.floor-.22&&p[1]<=ER.deckhead+.01,r.system+' '+r.from+'→'+r.to+' inside the space’s height');}
 }
 assert.deepEqual([...new Set(hits)].slice(0,12),[],'runs through machines');
 for(const sg of pipeSegments(R))assert.ok(pipeRadius(sg.dn)>=.012&&pipeRadius(sg.dn)<=.1,'a sensible radius for DN '+sg.dn);
 // No run in the walkways at body height: a point between 5 cm and 1.75 m over the plates, over a floor a person can stand
 // on and not over a machine (its footprint and 0.3 m round it), away from the linings and bulkheads, is a pipe in the way.
 const floors=FERRY_INTERIOR.floors.filter(f=>['engine-room','aux-room','workshop'].includes(f.id));
 const allSolids=FERRY_INTERIOR.boxes.filter(b=>b.solid&&!/side|deckhead|bulkhead|plates/.test(b.name||''));
 const overMachine=(x,z)=>allSolids.some(b=>x>lo(b,0)-.3&&x<hi(b,0)+.3&&z>lo(b,2)-.3&&z<hi(b,2)+.3);
 const nearWall=(x,z)=>Math.abs(x)>ER.side-.45||[ER.aft,ER.fore,FERRY_MACHINERY_SPACES.auxFore,FERRY_MACHINERY_SPACES.storeFore].some(zb=>Math.abs(z-zb)<.4);
 const inWay=[];
 for(const r of R){const ends=[r.points[0],r.points[r.points.length-1]];
  for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])/.1));
   for(let j=0;j<=n;j++){const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n,a[2]+(b[2]-a[2])*j/n];const h=p[1]-ER.floor;if(h<.05||h>1.75)continue;
    if(ends.some(e=>Math.hypot(p[0]-e[0],p[1]-e[1],p[2]-e[2])<.6))continue;if(!floors.some(f=>p[0]>=f.x[0]&&p[0]<=f.x[1]&&p[2]>=f.z[0]&&p[2]<=f.z[1]&&(!f.inside||f.inside(p[0],p[2],.28))))continue;
    if(overMachine(p[0],p[2])||nearWall(p[0],p[2]))continue;inWay.push(r.system+' '+r.from+'→'+r.to+' at '+p.map(n=>n.toFixed(2))+' ('+h.toFixed(2)+' m up)');}}}
 assert.deepEqual([...new Set(inWay.map(s=>s.replace(/ at .*$/,'')))],[],'pipes in the walkways at body height: '+inWay.slice(0,6).join('; '));
 // A bulkhead is crossed straight through (a penetration), never run along inside its plating.
 for(const r of R)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];for(const zb of [ER.fore+.03,FERRY_MACHINERY_SPACES.auxFore+.03])if(Math.abs(a[2]-b[2])<1e-6&&Math.abs(a[2]-zb)<.05)assert.fail(r.system+' '+r.from+'→'+r.to+' runs inside the bulkhead at z '+zb.toFixed(2));}
 // The lanes: a system's overhead run is at its own height and distance from the lining, so no two systems share a line.
 const seen=new Map();for(const [id,l] of Object.entries(PIPE_LANES)){if(l.skip||l.local)continue;const k=(l.low?'low':'high')+l.k;assert.ok(!seen.has(k),id+' shares a lane with '+seen.get(k));seen.set(k,id);}
 // The painted runs are gone: no bar in the engine room is a hand-drawn main along the lining at the old lane spacing.
 assert.ok(FERRY_INTERIOR.bars.some(b=>b.hex===0x8a6a3a&&Math.abs(b.a[1]-(ER.deckhead-.1))<1e-6),'the fuel lane is drawn from the data');
 assert.ok(FERRY_MACHINERY_SPACES.storeFore>ER.fore);
});
