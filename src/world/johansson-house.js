import {JOHANSSON_HOUSE_CAD as CAD} from './johansson-house-cad.js';

/**
 * Johansson's house on Kitano-jima, as built: the creator's Final Rev F (johansson-house-cad.js, generated from
 * docs/johansson-house/cad-rev-f), with what it leaves open closed the way an architect would close it. Every such
 * departure is a finding below (HOUSE_FINDINGS), with what the drawing says, why it cannot stand, and what is built; the
 * design book (docs/johansson-house/README.md) lists them for the next revision. Nothing else moves: the walls, their
 * openings, the levels, the rooms' ids and names, the stair, the guards and the roof are the drawings'.
 *
 * Frame, as drawn: x east and y north from the south-west outside corner, z up from the ground floor's finished floor;
 * metres. The front (the genkan's door) is the south face; johansson-house-build.js turns the house to face the lane.
 */
const r3=v=>Math.round(v*1e4)/1e4;
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;};

export const HOUSE_LEVELS=Object.freeze(['B1','G0','L1']);
/** Where the house keeps its state in the game's save, as the drawings name it (Game_Integration.md: johansson.house.v2). */
export const HOUSE_SAVE=CAD.saveNamespace;
const slabOver={B1:'G0-SLAB',G0:'L1-SLAB',L1:'ROOF-DECK'};
/** Finished floors (the slabs' tops: Rev F has no floor offset) and the soffits of the slabs over them. */
export const HOUSE_FLOORS=freeze(Object.fromEntries(HOUSE_LEVELS.map(level=>[level,{
 floor:CAD.levels[level],
 soffit:Math.min(...CAD.boxes.filter(b=>b.kind==='slab'&&b.id.startsWith(slabOver[level])).map(b=>b.min[2])),
 name:{B1:'Basement',G0:'Ground floor',L1:'Upper floor'}[level],
}])));

// ---------------------------------------------------------------- the rooms

/** The game's short names for the drawings' rooms (the ids stay the drawings', for anything saved by id). */
const KEYS={
 'B1-ROOM-01':'b1-workshop','B1-ROOM-02':'b1-club','B1-ROOM-03':'b1-hall','B1-ROOM-04':'b1-boiler','B1-ROOM-05':'b1-sauna','B1-ROOM-06':'b1-storage',
 'G0-ROOM-01':'g0-living','G0-ROOM-02':'g0-kitchen','G0-ROOM-03':'g0-hall','G0-ROOM-04':'g0-sewing','G0-ROOM-05':'g0-genkan','G0-ROOM-06':'g0-wc','G0-ROOM-07':'g0-terrace',
 'L1-ROOM-01':'l1-bedroom','L1-ROOM-02':'l1-guest','L1-ROOM-03':'l1-hall','L1-ROOM-04':'l1-bathroom','L1-ROOM-05':'l1-study','L1-ROOM-06':'l1-linen',
};
/** What each room is for, in the house of a Swedish ship's electrician come ashore and his wife, a seamstress from Hội An. */
const PURPOSE={
 'b1-workshop':'Johansson’s bench, his meters and the parts drawers, and the board he wired to teach the island’s apprentices: the ship’s electrician’s workshop he kept when he came ashore.',
 'b1-club':'The reading club meets here: armchairs, the books, a bar; the high window on the lightwell lets in the day.',
 'b1-hall':'The foot of the stair, the basement’s distribution board, the preserves and the typhoon kit under the genkan.',
 'b1-boiler':'The water heater and the cold-water manifold, with its own door to the court and the garden stair (D-BEXT).',
 'b1-sauna':'A Swede’s sauna: the cedar cabin, the shower over the drain to the lift pump, the changing bench.',
 'b1-storage':'Shelves, the fishing gear and the spare roof tiles; through it, the club and the far store.',
 'g0-living':'The low table, the television and the window to the garden.',
 'g0-kitchen':'The kitchen along the west wall, the dining table under the north window.',
 'g0-hall':'The landing of the stair’s well and the way to the kitchen, the WC and the terrace.',
 'g0-sewing':'Thuan’s machine at the east window, her cutting table and her fabric.',
 'g0-genkan':'The front door, the stone floor where shoes come off, the boards and the meter, and the stair up and down.',
 'g0-wc':'The toilet, the washbasin, the washing machine and the utility sink.',
 'g0-terrace':'Boots, the garden tools and the door out to the covered terrace (D-TERRACE).',
 'l1-bedroom':'Johansson and Thuan’s room: the futons and the wardrobe.',
 'l1-guest':'For visitors, and for Thuan’s sisters when the last boat has gone.',
 'l1-hall':'The top of the stair, the upper floor’s board, and the suitcases under the window-less south wall.',
 'l1-bathroom':'The ofuro under the east window, the washing place, the changing room with the basin.',
 'l1-study':'The desk at the east window, the bookshelf, the town’s papers.',
 'l1-linen':'The linen and the airing rail under the landing window; the way to the guest room.',
};
export const HOUSE_ROOMS=freeze(CAD.rooms.map(r=>({id:r.id,key:KEYS[r.id],level:r.level,name:r.name,floor:r.floor,area:r.area,bounds:r.bounds,zones:r.zones,label:r.label,purpose:PURPOSE[KEYS[r.id]]})));
/** A room by its key ('g0-living') or its id ('G0-ROOM-01'). */
export const houseRoom=k=>HOUSE_ROOMS.find(r=>r.key===k||r.id===k)??null;
/** The room at (x, y) on a level, or null (inside a wall). */
export function roomAt(level,x,y){return HOUSE_ROOMS.find(r=>r.level===level&&r.zones.some(z=>x>=z[0]-1e-6&&x<=z[2]+1e-6&&y>=z[1]-1e-6&&y<=z[3]+1e-6))??null;}

// ---------------------------------------------------------------- the stair

/**
 * The drawings' stair: a dog-leg of two flights of seven treads (16 risers of 175 mm a storey, goings of 250 mm, 900 mm
 * wide either side of a 200 mm gap) and a landing 900 mm deep across the well's north end; the flight up from the ground
 * floor stands over the one up from the basement, 2.8 m above it. Up the west flight (A) northwards to the landing, up
 * the east flight (B) southwards to the next floor. `ramp` is the drawings' collision proxy through the nosings; the walk
 * carries it one going on at the foot of each flight, so feet go up evenly from the floor (house-walk.js).
 */
export const HOUSE_STAIR=freeze((()=>{
 const S=CAD.stair,[x0,y0,x1,y1]=S.footprint;
 const flights=[];
 for(const [from,to] of [['B1','G0'],['G0','L1']]){
  for(const f of ['A','B']){
   const ramp=CAD.ramps.find(r=>r.id===`RAMP-${from}-${f}`),xs=ramp.corners.map(c=>c[0]);
   const [a,,b]=ramp.corners,low=a[2]<b[2]?a:b,high=a[2]<b[2]?b:a;
   const dir=Math.sign(high[1]-low[1]),treads=CAD.treads.filter(t=>t.id.startsWith(`ST-${from}-${f}-`));
   flights.push({id:`${from}-${f}`,from,to,x:[Math.min(...xs),Math.max(...xs)],
    // The ramp from its low end (y, z) to its high end, and the walk's: one going further down at the foot.
    low:[low[1],low[2]],high:[high[1],high[2]],walkLow:[r3(low[1]-dir*S.tread),r3(low[2]-S.riser)],
    treads:treads.map(t=>({min:t.min,max:t.max}))});
  }
 }
 const landings=CAD.landings.map(l=>({id:l.id,level:l.id.replace('LANDING-',''),min:l.min,max:l.max}));
 return {footprint:S.footprint,well:[x0,y0,x1,y1],risers:S.risers,riser:S.riser,tread:S.tread,width:S.flightWidth,gap:S.centreGap,rise:S.rise,guard:S.guardHeight,headroom:S.headroom,flights,landings};
})());

// ---------------------------------------------------------------- the walls (finding RF1)

const box=(id,kind,level,min,max,extra={})=>({id,kind,level,min:min.map(r3),max:max.map(r3),...extra});
/** RF1: the genkan's north partition stops where the well's guards begin; between them, a head over a 2.1 m opening. */
const STAIR_OPENING=Object.freeze({level:'G0',x:[5.06,7.14],y:[3.44,3.56],head:2.1});
function coordinatedWalls(){
 const out=[];
 for(const b of CAD.boxes.filter(q=>q.kind==='wall')){
  const exterior=/-EXT-/.test(b.id);
  if(b.id==='G0-INT-ENTRY-00'){
   const [ox0,ox1]=STAIR_OPENING.x;
   out.push(box(b.id+'-W','partition','G0',b.min,[ox0,b.max[1],b.max[2]],{drawn:b.id}));
   out.push(box(b.id+'-HEAD','head','G0',[ox0,b.min[1],STAIR_OPENING.head],[ox1,b.max[1],b.max[2]],{drawn:b.id}));
   out.push(box(b.id+'-E','partition','G0',[ox1,b.min[1],b.min[2]],b.max,{drawn:b.id}));
   continue;
  }
  // A wall that starts over its floor is the head over an opening (or the wall over a window); one that stops under
  // its soffit, the wall under a window.
  const F=HOUSE_FLOORS[b.level],kind=b.min[2]>F.floor+.01?'head':b.max[2]<F.soffit-.01?'sill':exterior?'exterior':'partition';
  out.push(box(b.id,kind,b.level,b.min,b.max,b.pieces?{sleeves:b.pieces-1}:{}));
 }
 return out;
}
export const HOUSE_WALLS=freeze(coordinatedWalls());
/** The slabs and the foundation, as drawn (the well open in the ground and upper floors); the roof deck is the upper floor's ceiling. */
export const HOUSE_SLABS=freeze(CAD.boxes.filter(b=>b.kind==='slab').map(b=>box(b.id,b.id.startsWith('FOUNDATION')?'foundation':b.id.startsWith('ROOF')?'deck':'slab',b.level,b.min,b.max,b.pieces?{sleeves:b.pieces-1}:{})));

// ---------------------------------------------------------------- openings and the sliding doors

const FACE={north:10,south:0,west:0,east:12};
/** The openings in the outside walls (W- windows, D- doors), as drawn: heights over their own floor, `room` the room inside. */
export const HOUSE_OPENINGS=freeze(CAD.openings.filter(o=>o.side).map(o=>{
 const F=HOUSE_FLOORS[o.level].floor,mid=(o.from+o.to)/2;
 const inner=o.side==='south'?[mid,.4]:o.side==='north'?[mid,9.6]:o.side==='west'?[.4,mid]:[11.6,mid];
 return {...o,face:FACE[o.side],sill:r3(F+o.sill),head:r3(F+o.head),room:roomAt(o.level,...inner)?.key??null};
}));
/**
 * Where each sliding door's leaf runs (Rev F: 900 mm clear, timber, sliding, its collider gone from the passage only
 * when it is open): the face of the partition its track is on, and the way it slides open, clear of the door beside
 * it, the distribution boards and the sockets. D-G0-ENTRY-HALL has no leaf (finding RF1).
 */
const LEAVES={
 'D-B1-WEST-S':['e',-1],'D-B1-WEST-N':['e',1],'D-B1-EAST-S':['w',1],'D-B1-EAST-M':['w',1],'D-B1-EAST-N':['w',-1],'D-B1-HALL-N':['n',-1],
 'D-G0-WEST-S':['e',-1],'D-G0-WEST-N':['e',1],'D-G0-EAST-S':['e',1],'D-G0-EAST-M':['w',1],'D-G0-EAST-N':['w',1],'D-G0-ENTRY-HALL':null,
 'D-L1-WEST-S':['e',-1],'D-L1-WEST-N':['e',1],'D-L1-EAST-S':['w',1],'D-L1-EAST-M':['w',1],'D-L1-EAST-N':['w',-1],'D-L1-HALL-N':['n',-1],
};
/** A leaf: 950 mm (25 mm over each jamb), 2.08 m, 35 mm thick, its face 15 mm off the partition on its track. */
export const HOUSE_LEAF=Object.freeze({width:.95,height:2.08,thick:.035,off:.015});
/**
 * The doors between rooms: the opening in its partition (`axis` 'x': on the line x = at, running along y; 'y': on
 * y = at, along x), the rooms either side, and its leaf: `face` (+1 the side of greater x or y), `open` (+1 or −1, the
 * way it slides open), and the leaf's span along the line shut and open.
 */
export const HOUSE_DOORS=freeze(CAD.openings.filter(o=>o.axis).map(o=>{
 const F=HOUSE_FLOORS[o.level].floor,t=CAD.wallThickness.partition/2,mid=(o.from+o.to)/2;
 const side=d=>o.axis==='x'?roomAt(o.level,o.at+d,mid):roomAt(o.level,mid,o.at+d);
 const rooms=[side(-.3)?.key??null,side(.3)?.key??null],spec=LEAVES[o.id];
 let leaf=null;
 if(spec){
  const [f,dir]=spec,face=f==='e'||f==='n'?1:-1,L=HOUSE_LEAF,lap=(L.width-(o.to-o.from))/2;
  const shut=[r3(o.from-lap),r3(o.to+lap)],open=dir>0?[r3(o.to-.05),r3(o.to-.05+L.width)]:[r3(o.from+.05-L.width),r3(o.from+.05)];
  // The plane the leaf slides in: off the partition's face on its side.
  const plane=r3(o.at+face*(t+L.off+L.thick/2));
  leaf={face,open:dir,shut,parked:open,plane,bottom:F,top:r3(F+L.height)};
 }
 return {id:o.id,level:o.level,axis:o.axis,at:o.at,from:o.from,to:o.to,sill:r3(F+o.sill),head:r3(F+o.head),rooms,leaf};
}));

/**
 * The house's state as the save keeps it (under HOUSE_SAVE, schema 2, as Rev F's reference names it), read back: each
 * door's leaf open or shut by the door's id. Ids the house does not have and values that are not true or false are
 * dropped; another schema is not read (it would need a migration).
 */
export function restoreHouseState(raw){
 if(!raw||typeof raw!=='object'||raw.schema!==2)return undefined;
 const doors={};
 for(const d of HOUSE_DOORS)if(d.leaf&&typeof raw.doors?.[d.id]==='boolean')doors[d.id]=raw.doors[d.id];
 return {schema:2,doors};
}

// ---------------------------------------------------------------- guards and rails (findings RF2, RF3)

/**
 * The guards as drawn (posts 25–80 mm at 190–250 mm, 1.1 m, round the well on the ground and upper floors, along the
 * flights' outer sides and the landings' edges, beside the court and round the lightwell), and the two the drawings
 * leave out: RF2, the upper floor's edge over the foot of the flight below; RF3, the inner side of each upper flight,
 * over the lower one.
 */
export const HOUSE_GUARDS=freeze((()=>{
 const out=CAD.guards.map(g=>({id:g.id,min:g.min,max:g.max}));
 const S=HOUSE_STAIR,H=S.guard,post=.03;
 // RF2: on the upper floor, along y 3.70 from the well's west guard to the top of the flight up (x 5.06–6.2).
 for(let k=0,x=5.1;x<6.2-1e-6;k++,x=r3(x+.19))out.push({id:'RF2-GUARD-L1-S-'+k,min:[x,3.7,2.8],max:[r3(x+post),r3(3.7+post),r3(2.8+H)],added:'RF2'});
 // RF3: on each upper flight's inner string (x 6.17–6.2), the posts its outer edge has (GUARD-*-E), at the same nosings.
 for(const g of CAD.guards.filter(q=>/^GUARD-(B1|G0)-E-\d+$/.test(q.id)))out.push({id:g.id.replace('GUARD-','RF3-GUARD-').replace('-E-','-C-'),min:[r3(6.2-post),g.min[1],g.min[2]],max:[6.2,g.max[1],g.max[2]],added:'RF3'});
 return out;
})());
export const HOUSE_RAILS=freeze((()=>{
 const out=CAD.handrails.map(h=>({id:h.id,a:h.a,b:h.b,d:h.d}));
 out.push({id:'RF2-RAIL-L1-S',a:[5.08,3.7,3.9],b:[6.215,3.7,3.9],d:.04,added:'RF2'});
 for(const f of HOUSE_STAIR.flights.filter(q=>q.id.endsWith('-B')))out.push({id:`RF3-RAIL-${f.from}-B`,a:[6.185,f.low[0],r3(f.low[1]+HOUSE_STAIR.guard)],b:[6.185,f.high[0],r3(f.high[1]+HOUSE_STAIR.guard)],d:.04,added:'RF3'});
 return out;
})());

// ---------------------------------------------------------------- fittings and equipment (finding RF4)

/**
 * The room lights as drawn (one in each room, at its middle), and the sockets: drawn 350 mm out from the walls, built
 * on the nearest wall at the drawn height (RF4).
 */
export const HOUSE_FIXTURES=freeze(CAD.fixtures.map(f=>{
 const r=HOUSE_ROOMS.find(q=>q.id===f.room),light=/LIGHT$/.test(f.id);
 if(light)return {...f,kind:'light',room:r.key};
 const [x,y,z]=f.at,zone=r.zones.find(q=>x>q[0]&&x<q[2]&&y>q[1]&&y<q[3]);
 const d=[[x-zone[0],'w'],[zone[2]-x,'e'],[y-zone[1],'s'],[zone[3]-y,'n']].sort((a,b)=>a[0]-b[0])[0][1];
 const at=d==='w'?[zone[0],y,z]:d==='e'?[zone[2],y,z]:d==='s'?[x,zone[1],z]:[x,zone[3],z];
 return {...f,kind:'socket',room:r.key,drawnAt:f.at,at,wall:d};
}));
/** The equipment the drawings place (the boards, the water heater, the manifold, the pumps, the outdoor units). */
export const HOUSE_EQUIPMENT=CAD.equipment;

// ---------------------------------------------------------------- the site and the roof

/**
 * The site as drawn (assumed, not surveyed): the yard level with the ground floor, the terrace behind, the court
 * outside D-BEXT and the garden stair down to it, the lightwell outside W-B1, and the plot. Kitano-jima's kitano-1 is
 * 17 × 22 m round the house (RF8).
 */
export const HOUSE_SITE=freeze((()=>{
 const site=id=>CAD.boxes.find(b=>b.id===id);
 const X=CAD.site.externalStair,well=['LIGHTWELL-S','LIGHTWELL-N','LIGHTWELL-W'].map(site);
 return {
  grade:0,plot:CAD.site.plot,
  terrace:{min:site('TERRACE').min,max:site('TERRACE').max},
  court:{x:[X.bottomLanding[0],X.bottomLanding[2]],y:[X.bottomLanding[1],X.bottomLanding[3]],floor:site('COURT-FLOOR').max[2]},
  gardenStair:{...X,top:site('EXT-STAIR-TOP').max[2],treads:CAD.treads.filter(t=>t.id.startsWith('EXT-STAIR-'))},
  lightwell:{x:[site('LIGHTWELL-BASE').min[0],0],y:[site('LIGHTWELL-BASE').min[1],site('LIGHTWELL-BASE').max[1]],floor:site('LIGHTWELL-BASE').max[2],walls:well.map(b=>({id:b.id,min:b.min,max:b.max}))},
  boxes:CAD.boxes.filter(b=>b.kind==='site'),
 };
})());
export const HOUSE_ROOF=CAD.roof;

// ---------------------------------------------------------------- the findings

/** Where the house as built departs from Rev F, and why: the list for the next revision (docs/johansson-house/README.md). */
export const HOUSE_FINDINGS=freeze([
 {id:'RF1',title:'The genkan’s partition stands across the foot of the stair',
  drawn:'G0-INT-ENTRY-00, 4 960–7 300 × 3 440–3 560, floor to soffit, between the genkan and the stair hall. Both flights meet the ground floor at y 3 700 (the flight down from it, RAMP-B1-B, and the flight up, RAMP-G0-A), and the navigation’s vertical links STAIR-B1 and STAIR-G0 end at y 3 200, in the genkan.',
  problem:'The partition leaves 140 mm of floor in front of both flights: nobody can step off the stair onto the ground floor, or onto it, and the 0.25 m capsule cannot pass. The drawings’ own links say the stair opens into the genkan.',
  built:'The partition stops at the well’s guard lines (x 5 060 and 7 140): between them it is a head over a 2.1 m opening, the height of every door head, so the stair rises from the genkan. D-G0-ENTRY-HALL stays a 900 mm doorway, without a leaf: 160 mm of its partition is left, too little for a 950 mm leaf to slide over.'},
 {id:'RF2',title:'The upper floor’s edge over the foot of the flight is unguarded',
  drawn:'Guards round the upper floor’s well on its west, east and north sides (OPENING-GUARD-L1-*); none along y 3 700.',
  problem:'From x 5 060 to 6 200 the upper floor stops at y 3 700 over the flight up from the ground floor, its foot 2.6 m below: a fall.',
  built:'A guard as the drawn ones along y 3 700 from the west guard to the top of the flight (x 5 100–6 200): posts 30 mm at 190 mm, 1.1 m, the rail on them.'},
 {id:'RF3',title:'The inner side of each upper flight is unguarded',
  drawn:'Each flight up from the landing to the next floor (B, x 6 200–7 100) has a guard and rail on its outer side (x 7 110). The inner rail (x 6 100) is the lower flight’s, 1.1 m over its nosings.',
  problem:'The upper flight stands up to 2.2 m above the lower one beside it, across a 200 mm gap: an open drop along its whole inner edge.',
  built:'The posts the outer side has, at the same nosings and 1.1 m high, on the upper flight’s inner string (x 6 170–6 200), and a rail on them. The strings are closed: a string either side of every flight, 50 mm over the nosings, and a soffit under the treads.'},
 {id:'RF4',title:'The sockets stand off the walls',
  drawn:'Each dry room’s socket is drawn 350 mm out from the nearer wall (B1-ROOM-01-SOCKET at 550, 900 in a room whose wall is at x 200).',
  problem:'A socket is fixed to a wall.',
  built:'Each socket on the nearest wall, at the drawn position along it and the drawn height (350 mm over the floor).'},
 {id:'RF5',title:'The services are not built yet',
  drawn:'Pipes, ducts, cables and the flue on their routes (Route_Schedule.csv, the R_*_3D drawings, Johansson_House_Services.glb), through sleeves in walls and slabs (Penetration_Schedule.csv).',
  problem:'Open: they are the next batch, with the systems.',
  built:'The sleeves (40–250 mm) are filled until the services go through them; the equipment the drawings place (the boards, the water heater, the manifold, the lift pump, the outdoor units) is built and can be looked at.'},
 {id:'RF6',title:'The house’s systems are not running yet',
  drawn:'source/reference_sim.py: electrics (single-phase three-wire 100/200 V, 60 Hz), water, drainage, ventilation and cooling, faults and repairs, saved under johansson.house.v2.',
  problem:'Open: the next batch, with RF5.',
  built:'The sliding doors keep their state under johansson.house.v2 (game.js); they start open, where the reference starts them shut, because a house is lived in with its doors open.'},
 {id:'RF7',title:'The basement is under the sea’s level',
  drawn:'Basement floor −2 800; game construction layers of 200 mm concrete, membrane, protection board, perimeter drain; the court’s storm sump and pump.',
  problem:'On Kitano-jima the yard, level with the ground floor, is 1.3 m above the sea, so the basement floor and the court’s, 2.8 m under it, are 1.5 m below the sea (the lightwell’s, 1.8 m under it, 0.5 m below), in coral sand.',
  built:'As drawn. A builder would check the tanked box against flotation: open.'},
 {id:'RF8',title:'The plot round the house',
  drawn:'An assumed plot, −6 000 to 18 000 × −7 000 to 16 000, not surveyed.',
  problem:'Kitano-jima’s kitano-1 lies between the lane and the beach, its east side against rising ground.',
  built:'The plot is 17 × 22 m round the house: 2.5 m either side (the lightwell, 1.3 m, west; the outdoor units, 1.25 m, east), 7.5 m in front (the garden stair’s top landing is 6.25 m out), 4.5 m behind (the terrace, 2 m).'},
]);
