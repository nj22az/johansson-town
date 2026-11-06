import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleText} from '../tools/johansson-house-import.mjs';
import {build as drawSheets} from '../tools/johansson-house-drawings.mjs';
import {JOHANSSON_HOUSE_CAD as CAD} from '../src/world/johansson-house-cad.js';
import {HOUSE_FLOORS,HOUSE_LEVELS,HOUSE_ROOMS,HOUSE_DOORS,HOUSE_LEAF,HOUSE_OPENINGS,HOUSE_WALLS,HOUSE_SLABS,HOUSE_STAIR,HOUSE_GUARDS,HOUSE_FIXTURES,HOUSE_EQUIPMENT,HOUSE_FINDINGS,HOUSE_SITE,HOUSE_SAVE,roomAt,houseRoom} from '../src/world/johansson-house.js';

const overlap=(a0,a1,b0,b1)=>Math.min(a1,b1)-Math.max(a0,b0);

test('the committed plans and as-built drawings are drawn from the current data (node tools/johansson-house-drawings.mjs)',()=>{
 for(const [name,body] of Object.entries(drawSheets()))assert.equal(readFileSync(new URL('../docs/johansson-house/'+name,import.meta.url),'utf8'),body,'docs/johansson-house/'+name+' is stale: run node tools/johansson-house-drawings.mjs');
});

test('the house data is imported from the committed drawings (node tools/johansson-house-import.mjs)',()=>{
 assert.equal(readFileSync(new URL('../src/world/johansson-house-cad.js',import.meta.url),'utf8'),moduleText(),'src/world/johansson-house-cad.js is stale: run node tools/johansson-house-import.mjs');
 assert.equal(CAD.revision,'F - coordinated game production reference');
 assert.equal(CAD.schema,2);assert.deepEqual(CAD.footprint,[12,10]);
 assert.equal(HOUSE_SAVE,'johansson.house.v2');
 // The floors are the drawings' datums, with no offset (Rev F), and every wall runs from its floor to the slab over it.
 assert.deepEqual(HOUSE_LEVELS.map(l=>HOUSE_FLOORS[l].floor),[-2.8,0,2.8]);
 for(const w of HOUSE_WALLS.filter(q=>q.kind==='exterior'||q.kind==='partition'))
  assert.ok(Math.abs(w.min[2]-HOUSE_FLOORS[w.level].floor)<1e-6&&Math.abs(w.max[2]-HOUSE_FLOORS[w.level].soffit)<1e-6,`${w.id} from ${w.min[2]} to ${w.max[2]}`);
});

test('the nineteen rooms keep the drawings’ ids and names',()=>{
 assert.equal(HOUSE_ROOMS.length,19);
 for(const r of CAD.rooms){const q=HOUSE_ROOMS.find(x=>x.id===r.id);assert.ok(q&&q.name===r.name&&q.level===r.level,r.id);assert.ok(q.purpose?.length>20,r.id+' has a purpose');}
 assert.equal(new Set(HOUSE_ROOMS.map(r=>r.key)).size,19);
 assert.equal(roomAt('G0',6,.5).key,'g0-genkan');assert.equal(roomAt('L1',9,8).key,'l1-linen');assert.equal(roomAt('B1',6,8).key,'b1-storage');
});

test('every room is reached from the front door, by its doors and the stair',()=>{
 const links=new Map(HOUSE_ROOMS.map(r=>[r.key,new Set()]));
 const join=(a,b)=>{if(a!==b){links.get(a).add(b);links.get(b).add(a);}};
 for(const d of HOUSE_DOORS){assert.ok(links.has(d.rooms[0])&&links.has(d.rooms[1]),d.id);join(...d.rooms);}
 // The flights rise from the genkan (RF1) and the halls, and arrive in the halls.
 join('b1-hall','g0-genkan');join('g0-genkan','l1-hall');
 const front=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY');
 assert.equal(front.room,'g0-genkan');
 const seen=new Set([front.room]),queue=[front.room];
 while(queue.length)for(const n of links.get(queue.shift()))if(!seen.has(n)){seen.add(n);queue.push(n);}
 assert.deepEqual(HOUSE_ROOMS.map(r=>r.key).filter(k=>!seen.has(k)),[],'rooms with no way in');
});

test('RF1: the genkan opens onto the foot of the stair, under a head as high as the doors’',()=>{
 const [w,head,e]=['G0-INT-ENTRY-00-W','G0-INT-ENTRY-00-HEAD','G0-INT-ENTRY-00-E'].map(id=>HOUSE_WALLS.find(q=>q.id===id));
 assert.equal(w.max[0],5.06);assert.equal(e.min[0],7.14);
 assert.deepEqual([head.min[0],head.max[0],head.min[2]],[5.06,7.14,2.1]);
 for(const f of HOUSE_STAIR.flights.filter(q=>q.id==='B1-B'||q.id==='G0-A'))
  assert.ok(f.x[0]>=w.max[0]&&f.x[1]<=e.min[0],f.id+' meets the ground floor inside the opening');
 assert.equal(HOUSE_DOORS.find(d=>d.id==='D-G0-ENTRY-HALL').leaf,null,'no wall left for the leaf');
});

test('doors: 900 mm clear under a 2.1 m head, nothing standing in them, each leaf over a wall of its own when open',()=>{
 for(const d of HOUSE_DOORS){
  const F=HOUSE_FLOORS[d.level].floor,i=d.axis==='x'?1:0,j=1-i;
  assert.ok(Math.abs(d.to-d.from-.9)<1e-6&&Math.abs(d.head-F-2.1)<1e-6,d.id);
  for(const w of HOUSE_WALLS.filter(q=>q.level===d.level)){
   const inIt=overlap(w.min[i],w.max[i],d.from+.01,d.to-.01)>0&&w.min[j]<=d.at+.01&&w.max[j]>=d.at-.01;
   if(inIt)assert.ok(w.min[2]>=d.head-1e-6,`${w.id} stands in ${d.id}`);
  }
  if(!d.leaf)continue;
  const L=d.leaf;
  assert.ok(Math.abs(L.shut[1]-L.shut[0]-HOUSE_LEAF.width)<1e-6&&L.shut[0]<d.from&&L.shut[1]>d.to,d.id+' covers its opening shut');
  // Open, the leaf stands over the partition (wall to the head behind it, past the jamb) along its whole run.
  const [a,b]=L.parked;
  assert.ok(a>=d.to-.05-1e-6||b<=d.from+.05+1e-6,d.id+' parks clear of its opening');
  const behind=HOUSE_WALLS.filter(w=>w.level===d.level&&w.kind==='partition'&&w.min[j]<=d.at+.01&&w.max[j]>=d.at-.01);
  for(let s=a+.06;s<b-.06;s+=.05)if(s>d.to||s<d.from)assert.ok(behind.some(w=>s>=w.min[i]-1e-6&&s<=w.max[i]+1e-6),`${d.id}'s leaf parks over nothing at ${s.toFixed(2)}`);
  // And over nothing else that is on that face: another leaf, a socket, a board.
  for(const o of HOUSE_DOORS.filter(q=>q!==d&&q.level===d.level&&q.leaf&&q.axis===d.axis&&Math.abs(q.at-d.at)<1e-6&&q.leaf.face===L.face))
   for(const span of [o.leaf.parked,o.leaf.shut])assert.ok(overlap(a,b,...span)<=1e-6,`${d.id} and ${o.id} park on each other`);
  const face=d.at+L.face*CAD.wallThickness.partition/2;
  for(const f of HOUSE_FIXTURES.filter(q=>q.kind==='socket'&&houseRoom(q.room).level===d.level))
   if(Math.abs(f.at[j]-face)<.01)assert.ok(f.at[i]<a||f.at[i]>b,`${d.id}'s leaf covers ${f.id}`);
  for(const e of HOUSE_EQUIPMENT.filter(q=>q.system==='electrical'&&q.min[2]>=F-.1&&q.max[2]<=HOUSE_FLOORS[d.level].soffit))
   if(d.axis==='x'&&L.face<0&&Math.abs(d.at-8.3)<1e-6)assert.ok(overlap(a,b,e.min[1],e.max[1])<=0,`${d.id}'s leaf covers ${e.id}`);
 }
 for(const o of HOUSE_OPENINGS.filter(o=>o.type==='door'))assert.ok(o.to-o.from>=.9&&o.head-o.sill>=2.1-1e-9,o.id);
});

test('the stair: 16 equal risers of 175 mm a storey, goings of 250 mm, flights 900 mm, stacked 2.8 m apart',()=>{
 const S=HOUSE_STAIR;
 assert.equal(S.risers,16);assert.equal(S.riser,.175);assert.equal(S.tread,.25);assert.equal(S.width,.9);
 for(const [from,to] of [['B1','G0'],['G0','L1']]){
  const A=S.flights.find(f=>f.id===from+'-A'),B=S.flights.find(f=>f.id===from+'-B'),landing=S.landings.find(l=>l.level===from);
  const tops=[HOUSE_FLOORS[from].floor,...A.treads.map(t=>t.max[2]),landing.max[2],...B.treads.map(t=>t.max[2]).sort((a,b)=>a-b),HOUSE_FLOORS[to].floor];
  assert.equal(tops.length,S.risers+1,from);
  for(let i=1;i<tops.length;i++)assert.ok(Math.abs(tops[i]-tops[i-1]-S.riser)<1e-6,`${from} riser ${i}: ${(tops[i]-tops[i-1]).toFixed(3)}`);
  for(const t of [...A.treads,...B.treads])assert.ok(Math.abs(t.max[1]-t.min[1]-S.tread)<1e-6&&Math.abs(t.max[0]-t.min[0]-S.width)<1e-6,'a tread');
  // The walk's slope is the flight's pitch, and its foot is the floor or landing it rises from.
  for(const f of [A,B]){const [y0,z0]=f.walkLow,[y1,z1]=f.high;assert.ok(Math.abs(Math.abs((z1-z0)/(y1-y0))-S.riser/S.tread)<1e-6,f.id);}
  assert.equal(A.walkLow[1],HOUSE_FLOORS[from].floor);assert.equal(B.walkLow[1],landing.max[2]);
 }
 for(const f of S.flights.filter(q=>q.from==='G0')){const below=S.flights.find(q=>q.id==='B1-'+f.id.slice(3));assert.deepEqual(f.treads.map(t=>Math.round((t.max[2]-2.8)*1000)),below.treads.map(t=>Math.round(t.max[2]*1000)));}
});

test('2 m of headroom over every tread and landing',()=>{
 const S=HOUSE_STAIR,SOFFIT=.36;
 // Overhead: the slabs, each flight's soffit (0.36 m under its nosings), and each landing's underside.
 const over=HOUSE_SLABS.map(s=>({x:[s.min[0],s.max[0]],y:[s.min[1],s.max[1]],z:()=>s.min[2]}));
 for(const f of S.flights){const [y0,z0]=f.low,[y1,z1]=f.high;over.push({x:f.x,y:[Math.min(y0,y1),Math.max(y0,y1)],z:y=>z0+(z1-z0)*(y-y0)/(y1-y0)-SOFFIT});}
 for(const l of S.landings)over.push({x:[l.min[0],l.max[0]],y:[l.min[1],l.max[1]],z:()=>l.min[2]});
 for(const t of [...S.flights.flatMap(f=>f.treads),...S.landings]){
  for(const px of [t.min[0]+.05,(t.min[0]+t.max[0])/2,t.max[0]-.05])for(const py of [t.min[1]+.02,t.max[1]-.02]){
   const above=over.filter(o=>px>o.x[0]&&px<o.x[1]&&py>o.y[0]&&py<o.y[1]).map(o=>o.z(py)).filter(z=>z>t.max[2]+.01);
   const clear=Math.min(...above)-t.max[2];
   assert.ok(clear>=S.headroom-1e-6,`tread at ${t.max[2]} (${px.toFixed(2)},${py.toFixed(2)}): ${clear.toFixed(2)} m`);
  }
 }
});

test('RF2 and RF3: every edge a floor or flight stops at over a drop is guarded',()=>{
 const S=HOUSE_STAIR,posts=HOUSE_GUARDS;
 /** The first gap of more than a post's spacing along a line (axis 'x': the line runs along x at y = at), or null. */
 const gapAlong=(axis,at,from,to,floor)=>{
  const i=axis==='x'?0:1,j=1-i;
  for(let s=from+.12;s<to-.12;s+=.1){
   const ok=posts.some(g=>g.min[i]<=s+.13&&g.max[i]>=s-.13&&g.min[j]<=at+.05&&g.max[j]>=at-.05&&g.min[2]<=floor+.05&&g.max[2]>=floor+1.05);
   if(!ok)return +s.toFixed(2);
  }
  return null;
 };
 // The upper floor round its well: west, east, north, and the south edge over the flight up (RF2).
 for(const [axis,at,from,to] of [['y',5.08,3.7,6.35],['y',7.12,3.7,6.35],['x',6.36,5.1,7.1],['x',3.71,5.1,6.2]])
  assert.equal(gapAlong(axis,at,from,to,2.8),null,`the upper floor's edge (${axis} at ${at}) is open`);
 // The inner side of each upper flight (RF3): a post at x 6.17–6.2 on every tread.
 for(const f of S.flights.filter(q=>q.id.endsWith('-B')))for(const t of f.treads)
  assert.ok(posts.some(g=>g.max[0]<=6.2+1e-6&&g.min[0]>=6.15&&g.min[1]>=t.min[1]-1e-6&&g.min[1]<=t.max[1]+1e-6),`${f.id} tread at ${t.max[2]} has no inner post`);
});

test('RF4: every socket is on a wall, at the drawn height; a light at every room’s middle',()=>{
 for(const f of HOUSE_FIXTURES){
  const r=houseRoom(f.room),z=r.zones.find(q=>f.at[0]>=q[0]-1e-6&&f.at[0]<=q[2]+1e-6&&f.at[1]>=q[1]-1e-6&&f.at[1]<=q[3]+1e-6);
  assert.ok(z,f.id+' in its room');
  if(f.kind!=='socket')continue;
  assert.ok([z[0],z[2]].includes(f.at[0])||[z[1],z[3]].includes(f.at[1]),f.id+' on a wall');
  assert.equal(f.at[2],f.drawnAt[2]);assert.ok(Math.hypot(f.at[0]-f.drawnAt[0],f.at[1]-f.drawnAt[1])<=.35+1e-6,f.id+' moved to the nearest wall');
 }
 assert.equal(HOUSE_FIXTURES.filter(f=>f.kind==='light').length,19);
});

test('every finding is written out',()=>{
 for(const f of HOUSE_FINDINGS)for(const k of ['title','drawn','problem','built'])assert.ok(f[k]?.length>8,`${f.id}.${k}`);
 assert.deepEqual(HOUSE_FINDINGS.map(f=>f.id),['RF1','RF2','RF3','RF4','RF5','RF6','RF7','RF8']);
});

test('the house stands on plot kitano-1, facing the gate, with the yard the drawings ask for round it', async()=>{
 const {KITANO_HAMLET,KITANO_HAMLET_FLOORS}=await import('../src/world/kitano-hamlet-layout.js');
 const {houseLocal}=await import('../src/world/johansson-house-build.js');
 const p=KITANO_HAMLET.plots.find(q=>q.id==='kitano-1'),cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;
 // A drawn point to the island: the house's frame, then the plot's (turned half round, the gate on the lane).
 const island=(x,y)=>{const [lx,,lz]=houseLocal(x,y,0);return [cx-lx,cz-(lz+p.front-5)];};
 // RF8: the house, the lightwell, the outdoor units, the garden stair's way onto its top landing and the terrace.
 const X=HOUSE_SITE.gardenStair,T=HOUSE_SITE.terrace,W=HOUSE_SITE.lightwell,U=HOUSE_EQUIPMENT.find(e=>e.id==='HVAC-EQ-OUTDOOR_UNITS');
 for(const [x,y] of [[0,0],[12,10],[W.x[0]-.15,W.y[0]-.1],[U.max[0],U.max[1]],[X.topLanding[0],X.topLanding[1]-.6],[T.max[0],T.max[1]]]){
  const [u,v]=island(x,y);assert.ok(u>p.minX+.2&&u<p.maxX-.2&&v>p.minZ+.2&&v<p.maxZ-.2,`${x},${y} within the plot's walls at ${u.toFixed(2)},${v.toFixed(2)}`);
 }
 // The ground floor is level with the yard (Rev F), and the yard is a floor of the island.
 assert.equal(HOUSE_SITE.grade,0);assert.ok(KITANO_HAMLET_FLOORS.some(f=>f.id==='kitano-yard-kitano-1'));
 // The front door is on the gate's side of the house: the drawings' south face looks at the lane.
 const front=island(6,0),back=island(6,10);
 assert.ok(front[1]<back[1]&&Math.abs(front[0]-cx)<.2);
});
