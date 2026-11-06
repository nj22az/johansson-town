#!/usr/bin/env node
/**
 * Johansson's house, drawn back from what the game builds (src/world/johansson-house.js): the plans of the three floors as
 * built, as SVG to look at and as DXF (millimetres, the layers of the creator's Rev F, and a layer for each thing the
 * game adds) to open over the creator's own sheets and make the next revision from, and the design book's README with
 * the rooms and the findings.
 *
 *   node tools/johansson-house-drawings.mjs           writes docs/johansson-house/
 *   node tools/johansson-house-drawings.mjs --check   exits 1 if a committed sheet differs from the data (CI)
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {JOHANSSON_HOUSE_CAD as CAD} from '../src/world/johansson-house-cad.js';
import {HOUSE_FLOORS,HOUSE_LEVELS,HOUSE_ROOMS,HOUSE_WALLS,HOUSE_DOORS,HOUSE_OPENINGS,HOUSE_SLABS,HOUSE_STAIR,HOUSE_GUARDS,HOUSE_FIXTURES,HOUSE_EQUIPMENT,HOUSE_SITE,HOUSE_ROOF,HOUSE_FINDINGS,HOUSE_SAVE} from '../src/world/johansson-house.js';

const OUT=join(dirname(fileURLToPath(import.meta.url)),'..','docs','johansson-house');
/** The plans cut 1 m over each floor, as the creator's do. */
const CUT=1;
const cut=level=>HOUSE_WALLS.filter(w=>w.level===level&&w.min[2]<=HOUSE_FLOORS[level].floor+CUT&&w.max[2]>=HOUSE_FLOORS[level].floor+CUT);
const f2=n=>Number(n.toFixed(2)),mm=n=>Math.round(n*1000);
const sep=n=>String(mm(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
/** Guards on a level: the posts standing on its floor, or on its flights. */
const guardsOn=level=>HOUSE_GUARDS.filter(g=>!/^(EXT|LIGHTWELL)-/.test(g.id)&&g.min[2]>=HOUSE_FLOORS[level].floor-.05&&g.min[2]<HOUSE_FLOORS[level].floor+2.75);

// ---------------------------------------------------------------- the plans as SVG

function planSvg(level){
 const S=50,M=90,W=12*S+2*M,H=10*S+2*M+70,X=x=>f2(M+x*S),Y=y=>f2(M+(10-y)*S);
 const out=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">`,
  `<rect width="${W}" height="${H}" fill="#fbfaf6"/>`];
 const rect=(x0,y0,x1,y1,a)=>out.push(`<rect x="${X(x0)}" y="${Y(y1)}" width="${f2((x1-x0)*S)}" height="${f2((y1-y0)*S)}" ${a}/>`);
 const line=(x0,y0,x1,y1,a)=>out.push(`<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1)}" y2="${Y(y1)}" ${a}/>`);
 const text=(x,y,s,a='')=>out.push(`<text x="${X(x)}" y="${Y(y)}" ${a}>${s}</text>`);
 const F=HOUSE_FLOORS[level].floor;
 // The rooms, their ids, names and floor areas (as drawn).
 for(const r of HOUSE_ROOMS.filter(q=>q.level===level)){
  for(const [x0,y0,x1,y1] of r.zones)rect(x0,y0,x1,y1,'fill="#ffffff" stroke="none"');
  // At the middle of its (first) part, at the height the creator's label is; a hall's clear of the stair.
  const z=r.zones[0],lx=(z[0]+z[2])/2,ly=r.key.endsWith('-hall')?(level==='G0'?7.3:2.6):r.label[1];
  // Over the room's light, which is at its middle.
  text(lx,ly+.62,r.name,'font-size="12" text-anchor="middle" fill="#222"');
  text(lx,ly+.3,`${r.id} · ${r.area} m²`,'font-size="9" text-anchor="middle" fill="#777"');
 }
 // The well, and the stair: each nosing of this floor's flights, the landing, the way up; the flights below dashed.
 const st=HOUSE_STAIR,[wx0,wy0,wx1,wy1]=st.well;
 if(level!=='B1')rect(wx0,wy0,wx1,wy1,'fill="#efece4" stroke="none"');
 for(const [from,dash] of [[level,''],[level==='L1'?'G0':null,' stroke-dasharray="4 3"']]){
  if(!from)continue;
  for(const f of st.flights.filter(q=>q.from===from))for(const t of f.treads){const y=f.high[0]>f.low[0]?t.min[1]:t.max[1];line(t.min[0],y,t.max[0],y,`stroke="#555" stroke-width="1"${dash}`);}
  const l=st.landings.find(q=>q.level===from);if(l)rect(l.min[0],l.min[1],l.max[0],l.max[1],`fill="none" stroke="#555" stroke-width="1"${dash}`);
 }
 const A=st.flights.find(f=>f.id===level+'-A'),B=st.flights.find(f=>f.id===level+'-B');
 if(A){
  const ax=(A.x[0]+A.x[1])/2,bx=(B.x[0]+B.x[1])/2,ly=(st.landings[0].min[1]+st.landings[0].max[1])/2;
  out.push(`<polyline points="${X(ax)},${Y(A.low[0]+.1)} ${X(ax)},${Y(ly)} ${X(bx)},${Y(ly)} ${X(bx)},${Y(B.high[0]+.3)}" fill="none" stroke="#b03a2e" stroke-width="1.5"/>`);
  out.push(`<polygon points="${X(bx-.12)},${Y(B.high[0]+.45)} ${X(bx+.12)},${Y(B.high[0]+.45)} ${X(bx)},${Y(B.high[0]+.2)}" fill="#b03a2e"/>`);
  text((A.x[0]+B.x[1])/2,A.low[0]-(level==='G0'?.55:.3),`UP ${st.risers}R × ${mm(st.riser)} / ${mm(st.tread)}`,'font-size="9" text-anchor="middle" fill="#b03a2e"');
 }
 // The guards: posts, and the added ones (RF2, RF3) in red.
 for(const g of guardsOn(level))rect(g.min[0],g.min[1],Math.max(g.max[0],g.min[0]+.03),Math.max(g.max[1],g.min[1]+.03),g.added?'fill="#b03a2e"':'fill="#555"');
 // Openings in the outside walls: a window two thin lines, a door the same, tagged.
 for(const o of HOUSE_OPENINGS.filter(q=>q.level===level)){
  const along=o.side==='south'||o.side==='north',f=o.face;
  for(const d of [.06,.14]){if(along)line(o.from,f+(o.side==='south'?d:-d),o.to,f+(o.side==='south'?d:-d),'stroke="#3a7ca5" stroke-width="1"');else line(f+(o.side==='west'?d:-d),o.from,f+(o.side==='west'?d:-d),o.to,'stroke="#3a7ca5" stroke-width="1"');}
  const lx=along?(o.from+o.to)/2:f+(o.side==='west'?-.35:.35),ly=along?f+(o.side==='south'?-.32:.32):(o.from+o.to)/2;
  text(lx,ly,o.id,'font-size="9" text-anchor="middle" fill="#3a7ca5"');
 }
 // The walls the plan cuts, outside walls darker.
 for(const w of cut(level))rect(w.min[0],w.min[1],w.max[0],w.max[1],/-EXT-/.test(w.id)?'fill="#2b2b2b"':'fill="#8a8a8a"');
 // RF1's opening, its head dashed over it.
 if(level==='G0'){const h=HOUSE_WALLS.find(w=>w.id==='G0-INT-ENTRY-00-HEAD');rect(h.min[0],h.min[1],h.max[0],h.max[1],'fill="none" stroke="#b03a2e" stroke-width="1" stroke-dasharray="3 2"');}
 // The sliding doors: each leaf shut across its opening, its track to where it parks dashed.
 for(const d of HOUSE_DOORS.filter(q=>q.level===level)){
  const L=d.leaf;
  if(!L){const [a,b]=[d.from,d.to];for(const e of [a,b]){if(d.axis==='x')line(d.at-.1,e,d.at+.1,e,'stroke="#2b2b2b"');else line(e,d.at-.1,e,d.at+.1,'stroke="#2b2b2b"');}continue;}
  const run=[Math.min(L.shut[0],L.parked[0]),Math.max(L.shut[1],L.parked[1])];
  if(d.axis==='x'){rect(L.plane-.02,L.shut[0],L.plane+.02,L.shut[1],'fill="#9a7650"');line(L.plane,run[0],L.plane,run[1],'stroke="#9a7650" stroke-width="1" stroke-dasharray="2 2"');}
  else{rect(L.shut[0],L.plane-.02,L.shut[1],L.plane+.02,'fill="#9a7650"');line(run[0],L.plane,run[1],L.plane,'stroke="#9a7650" stroke-width="1" stroke-dasharray="2 2"');}
  const [tx,ty]=d.axis==='x'?[d.at+(L.face>0?-.3:.3),(d.from+d.to)/2]:[(d.from+d.to)/2,d.at+(L.face>0?-.25:.25)];
  out.push(`<text x="${X(tx)}" y="${Y(ty)}" font-size="7" text-anchor="middle" fill="#7a5a3a"${d.axis==='x'?` transform="rotate(-90 ${X(tx)} ${Y(ty)})"`:''}>${d.id}</text>`);
 }
 // The fittings: a light at each room's middle, the sockets on their walls, the boards and the equipment.
 for(const f of HOUSE_FIXTURES.filter(q=>HOUSE_ROOMS.find(r=>r.key===q.room).level===level)){
  if(f.kind==='light')out.push(`<circle cx="${X(f.at[0])}" cy="${Y(f.at[1])}" r="5" fill="none" stroke="#c9a64a" stroke-width="1.2"/>`);
  else rect(f.at[0]-.06,f.at[1]-.06,f.at[0]+.06,f.at[1]+.06,'fill="#c9a64a"');
 }
 for(const e of HOUSE_EQUIPMENT.filter(q=>q.min[2]<F+2.7&&q.max[2]>F-.6&&q.min[0]<12&&q.min[1]>0))rect(e.min[0],e.min[1],e.max[0],e.max[1],'fill="none" stroke="#5b8c9b" stroke-width="1"');
 // Dimensions, the title, the scale and north.
 line(0,-.9,12,-.9,'stroke="#555"');text(6,-.82,'12 000','font-size="10" text-anchor="middle" fill="#555"');
 line(-.9,0,-.9,10,'stroke="#555"');out.push(`<text x="${X(-1.05)}" y="${Y(5)}" font-size="10" text-anchor="middle" fill="#555" transform="rotate(-90 ${X(-1.05)} ${Y(5)})">10 000</text>`);
 const Fl=HOUSE_FLOORS[level];
 out.push(`<text x="${M}" y="${H-46}" font-size="15" font-weight="bold" fill="#222">Johansson House · ${Fl.name} (${level}) · finished floor ${Fl.floor>0?'+':''}${sep(Fl.floor)}</text>`);
 out.push(`<text x="${M}" y="${H-28}" font-size="10" fill="#555">As built in Johansson World from Final Rev F (findings RF1–RF${HOUSE_FINDINGS.length}, README.md; red: added). Plan cut at ${mm(CUT)} mm. Millimetres. Game asset: not for construction.</text>`);
 out.push(`<line x1="${W-M-100}" y1="${H-40}" x2="${W-M}" y2="${H-40}" stroke="#222" stroke-width="2"/><text x="${W-M-50}" y="${H-46}" font-size="9" text-anchor="middle">2 m</text>`);
 out.push(`<text x="${W-M+40}" y="${M-20}" font-size="12" text-anchor="middle">N</text><polygon points="${W-M+34},${M-6} ${W-M+46},${M-6} ${W-M+40},${M-18}" fill="#222"/>`);
 out.push('</svg>');
 return out.join('\n')+'\n';
}

// ---------------------------------------------------------------- the plans as DXF (R12, millimetres)

function planDxf(level){
 const e=[];
 const pair=(c,v)=>e.push(String(c),String(v));
 const line=(layer,x0,y0,x1,y1)=>{pair(0,'LINE');pair(8,layer);pair(10,mm(x0));pair(20,mm(y0));pair(30,0);pair(11,mm(x1));pair(21,mm(y1));pair(31,0);};
 const box=(layer,x0,y0,x1,y1)=>{line(layer,x0,y0,x1,y0);line(layer,x1,y0,x1,y1);line(layer,x1,y1,x0,y1);line(layer,x0,y1,x0,y0);};
 const text=(layer,x,y,h,s)=>{pair(0,'TEXT');pair(8,layer);pair(10,mm(x));pair(20,mm(y));pair(30,0);pair(40,h);pair(1,s);};
 // The creator's layers: walls (cut at 1 m), openings and their tags, rooms, the stair.
 for(const w of cut(level))box('A-WALL',w.min[0],w.min[1],w.max[0],w.max[1]);
 for(const o of HOUSE_OPENINGS.filter(q=>q.level===level)){
  const along=o.side==='south'||o.side==='north';
  if(along)line('A-OPENING',o.from,o.face,o.to,o.face);else line('A-OPENING',o.face,o.from,o.face,o.to);
  text('A-TAGS',along?o.from:o.face,along?o.face:o.from,100,o.id);
 }
 for(const d of HOUSE_DOORS.filter(q=>q.level===level)){
  if(d.axis==='x')line('A-OPENING',d.at,d.from,d.at,d.to);else line('A-OPENING',d.from,d.at,d.to,d.at);
  text('A-TAGS',d.axis==='x'?d.at:d.from,d.axis==='x'?d.from:d.at,100,d.id);
  // The game's: each leaf shut, and the run it slides along.
  const L=d.leaf;if(!L)continue;
  if(d.axis==='x')box('A-DOOR-LEAF',L.plane-HOUSE_LEAF_T/2,L.shut[0],L.plane+HOUSE_LEAF_T/2,L.shut[1]);else box('A-DOOR-LEAF',L.shut[0],L.plane-HOUSE_LEAF_T/2,L.shut[1],L.plane+HOUSE_LEAF_T/2);
 }
 for(const r of HOUSE_ROOMS.filter(q=>q.level===level))text('A-ROOM',r.label[0],r.label[1],120,`${r.id} ${r.name}`);
 const st=HOUSE_STAIR;box('A-STAIR',...st.footprint);
 for(const f of st.flights.filter(q=>q.from===level))for(const t of f.treads){const y=f.high[0]>f.low[0]?t.min[1]:t.max[1];line('A-STAIR',t.min[0],y,t.max[0],y);}
 for(const l of st.landings.filter(q=>q.level===level))box('A-STAIR',l.min[0],l.min[1],l.max[0],l.max[1]);
 // The guards, those added in the findings on a layer of their own; the fittings and the equipment.
 for(const g of guardsOn(level))box(g.added?'A-GUARD-ADDED':'A-GUARD',g.min[0],g.min[1],g.max[0],g.max[1]);
 if(level==='G0'){const h=HOUSE_WALLS.find(w=>w.id==='G0-INT-ENTRY-00-HEAD');box('A-OPENING-ADDED',h.min[0],h.min[1],h.max[0],h.max[1]);}
 for(const f of HOUSE_FIXTURES.filter(q=>HOUSE_ROOMS.find(r=>r.key===q.room).level===level)){
  if(f.kind==='light')box('E-LIGHT',f.at[0]-.12,f.at[1]-.12,f.at[0]+.12,f.at[1]+.12);else box('E-SOCKET',f.at[0]-.035,f.at[1]-.035,f.at[0]+.035,f.at[1]+.035);
 }
 const F=HOUSE_FLOORS[level].floor;
 for(const q of HOUSE_EQUIPMENT.filter(q=>q.min[2]<F+2.7&&q.max[2]>F-.6))box('M-EQUIPMENT',q.min[0],q.min[1],q.max[0],q.max[1]);
 text('TITLE',0,11,250,`JOHANSSON HOUSE ${level}  AS BUILT IN JOHANSSON WORLD FROM FINAL REV F  |  1 unit = 1 mm`);
 return ['0','SECTION','2','ENTITIES',...e,'0','ENDSEC','0','EOF'].join('\n')+'\n';
}
const HOUSE_LEAF_T=.035;

// ---------------------------------------------------------------- the design book

function readme(){
 const L=HOUSE_FLOORS,S=HOUSE_STAIR,R=HOUSE_ROOF,X=HOUSE_SITE.gardenStair;
 const rooms=HOUSE_LEVELS.map(level=>HOUSE_ROOMS.filter(r=>r.level===level).map(r=>`| ${r.id} | ${r.name} | ${r.area} m² | ${r.purpose} |`).join('\n')).join('\n');
 const findings=HOUSE_FINDINGS.map(f=>`### ${f.id}. ${f.title}\n\n- **Drawn:** ${f.drawn}\n- **Problem:** ${f.problem}\n- **Built:** ${f.built}\n`).join('\n');
 const leaves=HOUSE_DOORS.filter(d=>d.leaf).length;
 return `# Johansson's house (ヨハンソン邸): the design book

The creator, 2026-10-13, with the drawings: *"Can you use these drawings and model Johansson’s house on the tropical island?"*
Three revisions came: Rev B (\`cad-rev-b/\`, a schematic set), Rev C (\`cad-rev-c/\`, three coordinated plans, the building
manifest and the shell) and the **Final Rev F** (\`cad-rev-f/\`, the coordinated game production reference: 21 DXF, the
drawing book, the architecture and services GLB, the building manifest (schema 2), the collision and navigation contract,
the schedules, the defect register, the validation record and the executable reference simulation of the house's
systems). **Rev F rules**; B and C are kept as the record. This folder is generated from what the game builds
(\`node tools/johansson-house-drawings.mjs\`; \`tests/johansson-house.test.mjs\` fails when a sheet is stale), so the house
in World, these drawings and the house in the stories are one house.

- **The drawings, read:** \`src/world/johansson-house-cad.js\`, generated from \`cad-rev-f/\` by
  \`node tools/johansson-house-import.mjs\`, which checks the package on the way in: every file against SHA256SUMS.txt,
  the collision contract against the manifest, each plan against the manifest cut 1 m over its floor, the schedules,
  the roof plan and the site plan. A wall or slab split round a service sleeve is one element there.
- **The house as built:** \`src/world/johansson-house.js\`: the drawings, and where they leave something open, the findings
  below. Nothing else departs from them.
- **Outside, in Kitano hamlet:** \`src/world/johansson-house-build.js\`, on plot \`kitano-1\` (\`kitano-hamlet-layout.js\`,
  \`kitano-hamlet.js\`), its front door the site \`mayor-home\`. The court and the lightwell are dug into the yard: the
  yard's slab and the island's ground are cut round them, the sea is not drawn in them (\`ocean.js\` \`setOceanPits\`:
  their floors are under its level), and the garden stair is a floor of the island that slopes through its nosings.
- **Inside:** \`src/world/interiors/johansson-house-interior.js\`, walked floor by floor with \`src/world/house-walk.js\`.
  The ${leaves} sliding doors keep their state by id in the save, under \`${HOUSE_SAVE}\`.

A new revision: put it in \`cad-rev-<x>/\`, point the importer's \`SOURCE\` at it, run the importer, and the tests say
which finding it settles and what no longer fits.

## Particulars

| | |
|---|---|
| Footprint | ${CAD.footprint[0]} × ${CAD.footprint[1]} m outside, walls ${mm(CAD.wallThickness.exterior)} mm, partitions ${mm(CAD.wallThickness.partition)} mm |
| Floors (finished, no offset) | Basement ${sep(L.B1.floor)}, ground ${mm(L.G0.floor)}, upper +${sep(L.L1.floor)} mm; 2 800 mm floor to floor, slabs 180 mm |
| Clear heights | Basement ${sep(L.B1.soffit-L.B1.floor)}, ground ${sep(L.G0.soffit-L.G0.floor)}, upper ${sep(L.L1.soffit-L.L1.floor)} mm (to the roof deck, the upper floor's ceiling) |
| Roof | Hipped, ${R.finish}: eaves +${sep(R.eaves)}, ridge +${sep(R.ridge)} (${f2(R.ridgeLine[1][0]-R.ridgeLine[0][0])} m long), overhang 400 mm; two sleeves for the vent and the flue |
| Stair | Dog-leg, ${S.risers} risers × ${mm(S.riser)} mm a storey, goings ${mm(S.tread)} mm, flights ${mm(S.width)} mm either side of a ${mm(S.gap)} mm gap, landing 900 mm; guards ${sep(S.guard)} mm; the flights stack 2.8 m apart |
| Doors | ${HOUSE_DOORS.length} between rooms, ${mm(.9)} mm clear, heads +2 100; ${leaves} timber sliding leaves (RF1: one without) |
| Site | Yard level with the ground floor, 1.3 m above the sea; terrace behind; the court outside D-BEXT ${sep(X.bottomLanding[2]-X.bottomLanding[0])} × ${sep(X.bottomLanding[3]-X.bottomLanding[1])} mm at ${sep(HOUSE_SITE.court.floor)}, the garden stair (${X.risers} × ${mm(X.riser)} mm, ${mm(X.clear)} mm wide) up to the yard; the lightwell outside W-B1 |
| Rooms | ${HOUSE_ROOMS.length}: ${HOUSE_LEVELS.map(l=>`${HOUSE_ROOMS.filter(r=>r.level===l).length} on ${l}`).join(', ')} |

## The sheets

| Sheet | File | What it is |
|---|---|---|
| B1 | \`plan-B1.svg\`, \`as-built-B1.dxf\` | Basement plan as built |
| G0 | \`plan-G0.svg\`, \`as-built-G0.dxf\` | Ground floor plan as built |
| L1 | \`plan-L1.svg\`, \`as-built-L1.dxf\` | Upper floor plan as built |

The DXF are in millimetres on Rev F's layers (A-WALL, A-OPENING, A-TAGS, A-ROOM, A-STAIR), with the game's own on layers of
their own (A-DOOR-LEAF, A-GUARD, A-GUARD-ADDED, A-OPENING-ADDED, E-LIGHT, E-SOCKET, M-EQUIPMENT), so they open over the
creator's sheets and show what was added.

## Rooms

| Id | Room | Area | What it is for |
|---|---|---|---|
${rooms}

## Findings

Where the house as built departs from Rev F, and why: for the next revision to settle.

${findings}
## Rev C's findings, and Rev F

Rev C's twelve findings (F1–F12, the record in git) were never sent; Rev F settles all but one on its own:
the stair is a stacked dog-leg in the stair halls, the rooms over and under the genkan are part of the halls, every room
has a door, the study's window is in the study, the walls run to the slabs, the doors have heads, the site, the court,
the garden stair and the lightwell are drawn, the roof is a hipped tile roof, and the kitchen's sill is 850 over the
floor. The basement under the sea's level stays open (RF7). The genkan is level with the hall (Rev F): shoes come off on
the stone at the door, and a timber strip marks where.

## Open

- The services (RF5) and the systems (RF6): the routes of the electrics, water, drainage, ventilation and cooling, the
  flue and the vent through the roof, the downpipes, the supply from the pole; the reference simulation's 31 cases in the
  game, the faults and repairs, the alarms. The equipment the drawings place is built.
- D-BEXT, the basement's door onto the court, is bolted from inside (the story: the typhoon season); the court and the
  garden stair are walked, the door is not yet a way in. The reference's flood alarm, which closes the basement's links,
  comes with the systems.
- Game_Integration.md's host acceptance: every room walked on the desktop and the phone, the frame rate under the
  town's load, the save surviving a reload (the doors' does).
`;
}

export function build(){
 const out={};
 for(const level of HOUSE_LEVELS){out[`plan-${level}.svg`]=planSvg(level);out[`as-built-${level}.dxf`]=planDxf(level);}
 out['README.md']=readme();
 return out;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const sheets=build();
 if(process.argv.includes('--check')){
  const stale=Object.entries(sheets).filter(([name,body])=>{try{return readFileSync(join(OUT,name),'utf8')!==body;}catch{return true;}}).map(([n])=>n);
  if(stale.length){console.error('stale: '+stale.join(', ')+': run node tools/johansson-house-drawings.mjs');process.exit(1);}
  console.log('docs/johansson-house matches the data');
 }else{for(const [name,body] of Object.entries(sheets))writeFileSync(join(OUT,name),body);console.log('wrote',Object.keys(sheets).join(', '));}
}
