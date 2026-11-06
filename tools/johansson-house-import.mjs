#!/usr/bin/env node
/**
 * Johansson's house, read from the creator's CAD (docs/johansson-house/cad-rev-f, Final Rev F: the building manifest,
 * schema 2, with its collision and navigation contract, the coordinated plans, the roof and site drawings and the room
 * and opening schedules) into src/world/johansson-house-cad.js, the data the game builds the house from.
 *
 *   node tools/johansson-house-import.mjs           writes src/world/johansson-house-cad.js
 *   node tools/johansson-house-import.mjs --check   exits 1 if the committed module differs from the drawings (CI)
 *
 * The package is checked on the way in, or the import stops and says where: every file against its SHA-256 in
 * SHA256SUMS.txt; the collision contract against the manifest (each solid and guard a box of it, each ramp over its
 * treads' nosings); each plan against the manifest (its walls are the wall pieces cut 1 m over that floor, its openings
 * and tags the openings, its room labels the rooms, inside them; the stair's outline and nosings the stair's); the
 * schedules against the manifest; the roof plan against the roof; the site plan against the site. A wall or slab the
 * manifest splits round a service sleeve is one box here, with the sleeves counted (the services are their own batch).
 * A new revision is a new folder and a new SOURCE below; what the game does with the drawings (and where it departs from
 * them, with the reason) is src/world/johansson-house.js and docs/johansson-house/README.md.
 *
 * Frame, as drawn: x east and y north from the south-west outside corner, z up from the ground floor's finished floor;
 * metres (the GLBs' (x, z, −y) is not used: the game turns the house itself).
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {readDxf} from './dxf.mjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE='docs/johansson-house/cad-rev-f';
const PLANS=Object.freeze({B1:'A_B1_Coordinated.dxf',G0:'A_G0_Coordinated.dxf',L1:'A_L1_Coordinated.dxf'});
const OUT='src/world/johansson-house-cad.js';
/** Millimetres to metres, to the tenth of a millimetre the manifest carries (8 077.5). */
const m=v=>Math.round(v*10)/10000;
const fail=msg=>{throw new Error(msg);};
const read=f=>readFileSync(join(ROOT,SOURCE,f),'utf8');

/** A CSV with quoted fields (the schedules), as objects by header. */
function csv(text){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(q){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;continue;}
  if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;
 }
 if(cell||row.length){row.push(cell);rows.push(row);}
 const [head,...body]=rows.filter(r=>r.length>1||r[0]);
 return body.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rectOf=points=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
const levelOf=id=>(id.match(/^(B1|G0|L1)-/)||[])[1]??(/^ROOF/.test(id)?'roof':/^FOUNDATION/.test(id)?'foundation':'site');

export function importHouse(){
 // Every file is the one the creator sent.
 for(const line of read('SHA256SUMS.txt').split('\n').filter(Boolean)){
  const [hash,file]=line.trim().split(/\s+\*?/);
  if(createHash('sha256').update(readFileSync(join(ROOT,SOURCE,file))).digest('hex')!==hash)fail(`${SOURCE}/${file} differs from its SHA-256 in SHA256SUMS.txt`);
 }
 const M=JSON.parse(read('building_manifest.json')),C=JSON.parse(read('collision.json'));
 if(M.units!=='mm'||M.schema_version!==2)fail('manifest: not schema 2 in millimetres');
 const geometry=M.geometry,byId=new Map(geometry.map(g=>[g.id,g]));
 if(byId.size!==geometry.length)fail('manifest: geometry ids are not unique');

 // ------------------------------------------------ the collision contract is the manifest's boxes
 for(const [list,what] of [[C.solids,'solid'],[C.guards,'guard']])for(const s of list){
  const g=byId.get(s.id);
  if(!g||!same(g.bounds_mm,s.bounds_mm)||!g.collision)fail(`collision.json: ${what} ${s.id} is not a collision box of the manifest`);
 }
 const solidIds=new Set(C.solids.map(s=>s.id));
 for(const g of geometry)if(g.collision&&['wall','slab','site'].includes(g.kind)!==solidIds.has(g.id))fail(`collision.json: ${g.id} (${g.kind}) is ${solidIds.has(g.id)?'':'not '}a solid`);
 if(C.guards.length!==geometry.filter(g=>g.kind==='guard').length)fail('collision.json: the guards are not the manifest’s');

 // ------------------------------------------------ walls, slabs and site: one box per element, its service sleeves filled
 const groups=new Map();
 for(const g of geometry)if(['wall','slab','site'].includes(g.kind)){
  const id=g.id.replace(/-P\d{3}$/,'');if(!groups.has(id))groups.set(id,{id,kind:g.kind,pieces:[]});
  const e=groups.get(id);if(e.kind!==g.kind)fail(`manifest: ${id} mixes ${e.kind} and ${g.kind}`);e.pieces.push(g.bounds_mm);
 }
 const boxes=[...groups.values()].map(({id,kind,pieces})=>{
  const lo=[0,1,2].map(i=>Math.min(...pieces.map(b=>b[i]))),hi=[3,4,5].map(i=>Math.max(...pieces.map(b=>b[i])));
  // What the pieces leave of their box is sleeves for pipes, ducts and cables: none of it more than 250 mm across.
  const xs=[...new Set(pieces.flatMap(b=>[b[0],b[3]]))].sort((a,b)=>a-b),ys=[...new Set(pieces.flatMap(b=>[b[1],b[4]]))].sort((a,b)=>a-b),zs=[...new Set(pieces.flatMap(b=>[b[2],b[5]]))].sort((a,b)=>a-b);
  for(let i=0;i+1<xs.length;i++)for(let j=0;j+1<ys.length;j++)for(let k=0;k+1<zs.length;k++){
   const c=[(xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2,(zs[k]+zs[k+1])/2];
   if(pieces.some(b=>b[0]<=c[0]&&c[0]<=b[3]&&b[1]<=c[1]&&c[1]<=b[4]&&b[2]<=c[2]&&c[2]<=b[5]))continue;
   const across=[xs[i+1]-xs[i],ys[j+1]-ys[j],zs[k+1]-zs[k]].sort((a,b)=>a-b)[1];
   if(across>250)fail(`manifest: ${id} has a gap ${across} mm across between its pieces, more than a sleeve`);
  }
  const out={id,kind,level:levelOf(id),min:lo.map(m),max:hi.map(m)};
  if(pieces.length>1)out.pieces=pieces.length;
  return out;
 });

 // ------------------------------------------------ the plans are the manifest cut 1 m over each floor
 const rooms=[],planned={};
 const levels=M.levels_mm;
 for(const [level,file] of Object.entries(PLANS)){
  const ents=readDxf(read(file)),F=levels[level];
  const key=r=>r.map(v=>Math.round(v*10)/10).join(',');
  const drawn=new Set(ents.filter(e=>e.layer==='A-WALL'&&e.type==='LWPOLYLINE').map(e=>key(rectOf(e.points))));
  const cut=new Set(geometry.filter(g=>g.kind==='wall'&&levelOf(g.id)===level&&g.bounds_mm[2]<=F+1000&&g.bounds_mm[5]>=F+1000).map(g=>key([g.bounds_mm[0],g.bounds_mm[1],g.bounds_mm[3],g.bounds_mm[4]])));
  for(const r of drawn)if(!cut.has(r))fail(`${file}: wall ${r} is not a wall of the manifest cut 1 m over ${level}`);
  for(const r of cut)if(!drawn.has(r))fail(`manifest: the ${level} wall ${r} is not drawn in ${file}`);
  // Openings: each a cut line in the plan, tagged with its id at its start.
  const lines=ents.filter(e=>e.layer==='A-OPENING'&&e.type==='LINE').map(e=>key([e.a[0],e.a[1],e.b[0],e.b[1]]));
  const tags=new Map(ents.filter(e=>e.layer==='A-TAGS').map(e=>[e.text,e.a]));
  for(const o of M.openings[level]){
   const W=M.footprint_mm[0],D=M.footprint_mm[1];
   const line=o.side==='south'?[o.start_mm,0,o.end_mm,0]:o.side==='north'?[o.start_mm,D,o.end_mm,D]:o.side==='west'?[0,o.start_mm,0,o.end_mm]:o.side==='east'?[W,o.start_mm,W,o.end_mm]
    :o.axis==='x'?[o.position_mm,o.start_mm,o.position_mm,o.end_mm]:[o.start_mm,o.position_mm,o.end_mm,o.position_mm];
   if(!lines.includes(key(line)))fail(`${file}: ${o.id} is not cut at ${key(line)}`);
   const t=tags.get(o.id);if(!t||Math.abs(t[0]-line[0])>1||Math.abs(t[1]-line[1])>1)fail(`${file}: ${o.id} is not tagged at its start`);
  }
  if(lines.length!==M.openings[level].length||tags.size!==M.openings[level].length)fail(`${file}: openings drawn are not the manifest’s`);
  // Rooms: each labelled with its id and name, inside it.
  for(const r of M.rooms[level]){
   const label=ents.find(e=>e.layer==='A-ROOM'&&e.text===`${r.id} ${r.name}`);
   if(!label)fail(`${file}: no label for ${r.id} ${r.name}`);
   if(!r.zones_mm.some(z=>label.a[0]>z[0]&&label.a[0]<z[2]&&label.a[1]>z[1]&&label.a[1]<z[3]))fail(`${file}: ${r.id}’s label is outside it`);
   rooms.push({id:r.id,level,name:r.name,floor:m(r.floor_z_mm),area:r.area_m2,bounds:r.bounds_mm.map(m),zones:r.zones_mm.map(z=>z.map(m)),label:[m(label.a[0]),m(label.a[1])]});
  }
  // The stair: its outline, and a nosing line at every tread of both flights.
  const S=M.stair,outline=ents.find(e=>e.layer==='A-STAIR'&&e.type==='LWPOLYLINE');
  if(!outline||key(rectOf(outline.points))!==key(S.footprint_mm))fail(`${file}: the stair outline is not the manifest’s`);
  const nosings=ents.filter(e=>e.layer==='A-STAIR'&&e.type==='LINE').map(e=>key([e.a[0],e.a[1],e.b[0],e.b[1]])).sort();
  const want=[];for(let k=0;k<S.risers_per_storey/2;k++){const y=S.footprint_mm[1]+k*S.tread_mm,x0=S.footprint_mm[0],x2=S.footprint_mm[2],w=S.flight_width_mm;want.push(key([x0,y,x0+w,y]),key([x2-w,y,x2,y]));}
  if(!same(nosings,want.sort()))fail(`${file}: the stair’s nosings are not 16 treads of ${S.tread_mm} mm`);
  planned[level]=file;
 }
 // ------------------------------------------------ the schedules are the manifest's
 const roomRows=csv(read('Room_Schedule.csv'));
 for(const r of rooms){
  const row=roomRows.find(x=>x.id===r.id);
  if(!row||row.name!==r.name||row.level!==r.level||Number(row.floor_z_mm)!==Math.round(r.floor*1000)||Number(row.area_m2)!==r.area||!same(JSON.parse(row.bounds_mm).map(m),r.bounds))fail(`Room_Schedule.csv: ${r.id} is not the manifest’s`);
 }
 if(roomRows.length!==rooms.length)fail('Room_Schedule.csv: rooms are not the manifest’s');
 const openingRows=csv(read('Opening_Schedule.csv'));
 const openings=Object.entries(M.openings).flatMap(([level,list])=>list.map(o=>{
  const row=openingRows.find(x=>x.id===o.id);
  if(!row||row.level!==level||Number(row.start_mm)!==o.start_mm||Number(row.end_mm)!==o.end_mm||Number(row.sill_mm)!==o.sill_mm||Number(row.head_mm)!==o.head_mm||row.type!==o.type)fail(`Opening_Schedule.csv: ${o.id} is not the manifest’s`);
  const out={id:o.id,level,type:o.type};
  if(o.side)out.side=o.side;else{out.axis=o.axis;out.at=m(o.position_mm);out.clear=m(o.clear_width_mm);out.sliding=/^sliding/.test(o.operation);}
  Object.assign(out,{from:m(o.start_mm),to:m(o.end_mm),sill:m(o.sill_mm),head:m(o.head_mm)});
  return out;
 }));
 if(openingRows.length!==openings.length)fail('Opening_Schedule.csv: openings are not the manifest’s');

 // ------------------------------------------------ the stair: treads, landings and the ramps the walk uses
 const pick=kind=>geometry.filter(g=>g.kind===kind);
 const boxOf=g=>({id:g.id,min:g.bounds_mm.slice(0,3).map(m),max:g.bounds_mm.slice(3).map(m)});
 const treads=pick('stair').map(boxOf);
 const ramps=C.stair_proxies.filter(p=>p.corners_mm).map(p=>({id:p.id,corners:p.corners_mm.map(c=>c.map(m))}));
 const landings=C.stair_proxies.filter(p=>p.bounds_mm).map(p=>({id:p.id,min:p.bounds_mm.slice(0,3).map(m),max:p.bounds_mm.slice(3).map(m)}));
 // Each ramp runs from the first nosing over its flight's foot to the last nosing, the treads' tops on it.
 for(const r of ramps){
  const [lv,f]=r.id.replace('RAMP-','').split('-'),steps=treads.filter(t=>t.id.startsWith(`ST-${lv}-${f}-`));
  if(steps.length!==M.stair.risers_per_storey/2-1)fail(`collision.json: ${r.id} has ${steps.length} treads under it`);
  const xs=r.corners.map(c=>c[0]),ys=r.corners.map(c=>c[1]);
  for(const t of steps){
   if(t.min[0]<Math.min(...xs)-1e-6||t.max[0]>Math.max(...xs)+1e-6)fail(`collision.json: ${r.id} is not over ${t.id}`);
   // The ramp's height over the tread's nosing (its edge down the flight) is the tread's top.
   const [a,b]=[r.corners[0],r.corners[2]],nosing=a[2]<b[2]?t.min[1]:t.max[1];
   const z=a[2]+(b[2]-a[2])*(nosing-a[1])/(b[1]-a[1]);
   if(Math.abs(z-t.max[2])>.002)fail(`collision.json: ${r.id} is ${Math.round((z-t.max[2])*1000)} mm off ${t.id}’s nosing`);
  }
 }
 const X=C.external_stair_proxy;
 const site=M.site,ext=site.external_stair;
 const externalStair={risers:ext.risers,riser:m(ext.riser_mm),tread:m(ext.tread_mm),clear:m(ext.clear_width_mm),bottomLanding:ext.bottom_landing_mm.map(m),topLanding:ext.top_landing_mm.map(m),ramp:X.corners_mm.map(c=>c.map(m)),landing:X.bottom_landing_mm.map(m)};

 // ------------------------------------------------ the roof and the site, against their drawings
 const R=M.roof,roofPlan=readDxf(read('A104_Roof.dxf'));
 const eaves=roofPlan.find(e=>e.layer==='A-ROOF');
 if(!eaves||!same(rectOf(eaves.points),R.bounds_mm))fail('A104_Roof.dxf: the eaves are not the manifest’s');
 const hips=roofPlan.filter(e=>e.layer==='A-HIP-RIDGE').map(e=>[e.a,e.b].map(p=>p.slice(0,2).join(':')).sort().join('>')).sort();
 const [r0,r1]=R.ridge_xy_mm,[bx0,by0,bx1,by1]=R.bounds_mm;
 const wantHips=[[[bx0,by0],r0],[[bx0,by1],r0],[[bx1,by0],r1],[[bx1,by1],r1],[r0,r1]].map(l=>l.map(p=>p.join(':')).sort().join('>')).sort();
 if(!same(hips,wantHips))fail('A104_Roof.dxf: the hips and ridge are not the manifest’s');
 const sleevesDrawn=roofPlan.filter(e=>e.layer==='A-ROOF-SLEEVE').map(e=>rectOf(e.points).join(',')).sort();
 if(!same(sleevesDrawn,R.sleeve_apertures_mm.map(s=>s.join(',')).sort()))fail('A104_Roof.dxf: the roof sleeves are not the manifest’s');
 const sitePlan=readDxf(read('C101_Site_Utilities.dxf')),siteRect=layer=>rectOf(sitePlan.find(e=>e.layer===layer)?.points??fail('C101: no '+layer));
 if(!same(siteRect('C-PLOT-ASSUMED'),site.assumed_plot_mm))fail('C101_Site_Utilities.dxf: the plot is not the manifest’s');
 if(!same(siteRect('C-HOUSE'),[0,0,...M.footprint_mm]))fail('C101_Site_Utilities.dxf: the house is not the footprint');
 if(!same(siteRect('C-STAIR'),[ext.top_landing_mm[0],ext.top_landing_mm[1],ext.bottom_landing_mm[2],ext.bottom_landing_mm[3]]))fail('C101_Site_Utilities.dxf: the garden stair is not the manifest’s');
 const well=siteRect('C-LIGHTWELL'),wallsOfWell=boxes.filter(b=>/^LIGHTWELL-[SNW]$/.test(b.id));
 if(Math.min(...wallsOfWell.map(b=>b.min[0]))!==m(well[0])||Math.min(...wallsOfWell.map(b=>b.min[1]))!==m(well[1])||Math.max(...wallsOfWell.map(b=>b.max[1]))!==m(well[3]))fail('C101_Site_Utilities.dxf: the lightwell is not its walls');

 const S=M.stair;
 return {
  source:SOURCE,revision:M.revision,project:M.project,schema:M.schema_version,purpose:M.purpose,setting:M.setting,
  footprint:M.footprint_mm.map(m),levels:Object.fromEntries(Object.entries(levels).map(([k,v])=>[k,m(v)])),
  wallThickness:{exterior:m(M.wall_thickness_mm.exterior),partition:m(M.wall_thickness_mm.partition)},
  capsule:{radius:m(M.integration.player_capsule.radius_mm),height:m(M.integration.player_capsule.standing_height_mm),step:m(M.integration.player_capsule.max_step_mm),slope:M.integration.player_capsule.slope_deg},
  saveNamespace:M.integration.save_namespace,
  stair:{footprint:S.footprint_mm.map(m),risers:S.risers_per_storey,riser:m(S.riser_mm),tread:m(S.tread_mm),flightWidth:m(S.flight_width_mm),landingDepth:m(S.landing_depth_mm),centreGap:m(S.centre_gap_mm),rise:m(S.rise_mm),walkwayClear:m(S.walkway_clear_mm),guardHeight:m(S.guard_height_mm),headroom:m(S.headroom_target_mm)},
  roof:{finish:R.finish,eaves:m(R.eaves_z_mm),ridge:m(R.ridge_z_mm),deckTop:m(R.structural_roof_deck_top_mm),bounds:R.bounds_mm.map(m),ridgeLine:R.ridge_xy_mm.map(p=>p.map(m)),sleeves:R.sleeve_apertures_mm.map(s=>s.map(m)),
   vertices:R.mesh_vertices_mm.map(v=>v.map(m)),triangles:R.mesh_triangles},
  site:{plot:site.assumed_plot_mm.map(m),surveyed:site.surveyed,basement:site.basement,lightwell:site.lightwell,externalStair},
  plans:planned,
  rooms,openings,boxes,treads,ramps,landings,
  guards:pick('guard').map(boxOf),
  handrails:M.handrails.map(h=>({id:h.id,a:h.a_mm.map(m),b:h.b_mm.map(m),d:m(h.diameter_mm)})),
  doors:pick('door').map(boxOf),glass:pick('glass').map(boxOf),roofBoots:pick('roof_boot').map(boxOf),
  fixtures:M.electrical_fixtures.map(f=>({id:f.id,type:f.type,room:f.room_id,at:f.point_mm.map(m),circuit:f.circuit})),
  equipment:M.equipment.map(e=>({id:e.id,node:e.node,system:e.system,min:e.bounds_mm.slice(0,3).map(m),max:e.bounds_mm.slice(3).map(m),approach:e.interaction_mm.map(m)})),
  nav:{doors:M.navigation.door_connections.map(d=>({id:d.id,level:d.level,at:d.point_mm.map(m),clear:m(d.clear_width_mm)})),links:M.navigation.vertical_links.map(l=>({id:l.id,path:l.path_mm.map(p=>p.map(m))}))},
 };
}

/** The data as a module, deeply frozen, one entry a line where it helps a diff. */
export function moduleText(data=importHouse()){
 const json=v=>JSON.stringify(v);
 const LISTS=['rooms','openings','boxes','treads','ramps','landings','guards','handrails','doors','glass','roofBoots','fixtures','equipment'];
 const list=(name,items)=>` ${name}:[\n${items.map(i=>'  '+json(i)).join(',\n')}\n ],`;
 const {roof,...rest}=data,{vertices,triangles,...roofHead}=roof;
 const head=Object.entries(rest).filter(([k])=>!LISTS.includes(k));
 return `/**
 * Johansson's house as the creator drew it: ${data.revision} (${data.source}). Generated by
 * tools/johansson-house-import.mjs from the manifest, the collision contract, the plans and the schedules; do not edit by
 * hand, import a new revision instead. Frame: x east, y north from the south-west outside corner, z up from the ground
 * floor's finished floor; metres. What the game builds from this, and where it departs from it, is johansson-house.js.
 */
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;};
export const JOHANSSON_HOUSE_CAD=freeze({
${head.map(([k,v])=>` ${k}:${json(v)},`).join('\n')}
 roof:{
${Object.entries(roofHead).map(([k,v])=>`  ${k}:${json(v)},`).join('\n')}
  vertices:${json(vertices)},
  triangles:${json(triangles)},
 },
${LISTS.map(k=>list(k,data[k])).join('\n')}
});
`;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const text=moduleText(),path=join(ROOT,OUT);
 if(process.argv.includes('--check')){
  let now='';try{now=readFileSync(path,'utf8');}catch{}
  if(now!==text){console.error(OUT+' is stale: run node tools/johansson-house-import.mjs');process.exit(1);}
  console.log(OUT+' matches '+SOURCE);
 }else{writeFileSync(path,text);console.log('wrote '+OUT);}
}
