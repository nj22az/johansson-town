/**
 * Minato Elementary & Junior High School (港小中学校), as laid out on the ground.
 *
 * A small combined school of the kind a rural Okinawan port kept in 1997: one
 * two-storey reinforced-concrete block from the early seventies, an open breezeway
 * along its field side, a coral-sand sports ground in front, and the sea behind it on
 * two sides, held off by a seawall and a bank of tetrapods. It stands south of the east
 * lawn, through a gate in the windbreak, at the foot of the tunnel headland.
 *
 * Everything that has to agree -- the Blender model (tools/blender/build-school.py),
 * the walkable ground, the colliders, the map -- reads its measurements from here.
 * World metres; +z runs away from the harbour.
 */
export const SCHOOL=Object.freeze({
 id:'school-grounds',surface:'stone',
 /** The yard you can walk on, wall to wall. */
 minX:12.4,maxX:40.6,minZ:24.6,maxZ:45.1,
 /** The classroom block: field face (north), sea face (south). */
 // One storey since October 2026: the town hall is a single concrete building, not the
 // old two-storey school (school.js buildTownHall).
 building:Object.freeze({minX:14.5,maxX:39.5,minZ:36.5,maxZ:44.5,floor:.15,storey:3.3,roof:3.45,parapet:4.05}),
 /** The open breezeway along the field face, under the upper corridor. */
 corridor:Object.freeze({minZ:34.1,maxZ:36.5}),
 /** Column lines along the breezeway, one per structural bay. */
 bays:7,
 /** The stair tower over the entrance, with the clock. */
 tower:Object.freeze({minX:18.4,maxX:22.6,minZ:36.5,maxZ:40.5,top:9.9}),
 /** The entrance (shōkōguchi) in the field face, lined up on the gate. */
 genkan:Object.freeze({x:20.5,half:.95,z:36.5}),
 /** The sports ground. */
 field:Object.freeze({minX:13.2,maxX:39.8,minZ:28.8,maxZ:33.3}),
 /** The gate through the windbreak from the lawn. */
 gate:Object.freeze({x:20.5,half:1.75,z:24.6}),
 /** Sea on two sides: the seawall's inner faces. */
 seawall:Object.freeze({east:41,south:45.1,height:1.05}),
 /** The perimeter wall against the headland. */
 westWall:12,
 bikeShed:Object.freeze({minX:34,maxX:37.1,minZ:25.3,maxZ:28}),
 wash:Object.freeze({x:37.1,z:33.55,w:2.8,d:.7}),
 bars:Object.freeze({x:38.3,z:32.5,w:2.6}),
 flagpole:Object.freeze({x:30.5,z:32.8}),
 sandpit:Object.freeze({minX:35.8,maxX:39.4,minZ:29.6,maxZ:31.6}),
 /**
  * Since the school became the town hall (港町役場 · 公民館): the island's power house,
  * built on the west end of the old sports ground, the car park where the sandpit and
  * the iron bars were, and a concrete canopy over the entrance.
  */
 powerHouse:Object.freeze({minX:25.2,maxX:30.5,minZ:24.4,maxZ:29.8,height:3.6,door:Object.freeze([31.2,27.1]),
  // The day tank stands inside the compound's fence, north of the house (it stood on the playground, 15 m off).
  tank:Object.freeze([27.2,31.05]),
  /** The fenced compound (港町発電所): the house, its apron and the tank; a gate in the east fence at the steel doors. */
  compound:Object.freeze({minX:24.6,maxX:31.8,minZ:24.6,maxZ:31.9,gate:Object.freeze([25.8,28.4]),height:1.5})}),
 parking:Object.freeze({minX:31,maxX:39.6,minZ:28.9,maxZ:32.4}),
 canopy:Object.freeze({minX:18.8,maxX:22.2,minZ:31.9,maxZ:34.1,height:3.0}),
});
const B=SCHOOL.building;
/**
 * The campus split into its own buildings (briefs/town-hall-zone.md, phase S; the owner, 21 October 2026: "Could this zone
 * be subdivided into individual structures"), on the old block's line (z 36.5–44.5) with a 1.5 m passage between each
 * through to Kitahama's north lane behind (kitahama-layout.js northLane, from z 44.5): the school with its entrance and clock tower, the Community Hall (the kitchen, the register, the meeting
 * room), and the clinic with the doctor's flat. Every door stands where it stood, so the rooms and the routines are the
 * same. Each has its own veranda, roof, parapet, colour and name.
 */
export const TOWN_HALL_BUILDINGS=Object.freeze([
 {id:'school',name:'Minato Elementary School',sign:'Minato Elementary School',minX:B.minX,maxX:24.0,wall:0xece5d2,columns:[B.minX,18.07,21.64,24.0]},
 {id:'community-hall',name:'Minato Community Hall',sign:'Minato Community Hall',minX:25.5,maxX:31.5,wall:0xe3eadb,columns:[25.5,28.5,31.5]},
 {id:'clinic',name:'Minato Clinic',sign:'Minato Clinic',minX:33.0,maxX:B.maxX,wall:0xf3f1ea,columns:[33.0,36.25,B.maxX]},
].map(b=>Object.freeze({...b,columns:Object.freeze(b.columns)})));
/** The passages between the buildings, from the breezeway through to the lane behind. */
export const TOWN_HALL_PASSAGES=Object.freeze(TOWN_HALL_BUILDINGS.slice(1).map((b,i)=>Object.freeze({minX:TOWN_HALL_BUILDINGS[i].maxX,maxX:b.minX,minZ:SCHOOL.corridor.minZ,maxZ:SCHOOL.seawall.south})));
/** x of each column line along the breezeway, west to east. */
export const SCHOOL_COLUMNS=Object.freeze(Array.from({length:SCHOOL.bays+1},(_,i)=>+(B.minX+i*(B.maxX-B.minX)/SCHOOL.bays).toFixed(4)));

/** Fukugi, planted close as a windbreak along the headland wall and the field's east side. */
export const FUKUGI=Object.freeze([
 ...Array.from({length:8},(_,i)=>[12.95,26.9+i*2.45]),
 ...Array.from({length:4},(_,i)=>[40.05,26.2+i*2.55]),
 // Only the corner trees fit beside the shortened hall. The 0.6 m rear strip
 // cannot hold a 0.7 m trunk without intersecting the building or the boundary.
 [13.4,44.7],[40.1,44.7],
].map(p=>Object.freeze(p)));

export function schoolAt(x,z,r=0){
 return x>=SCHOOL.minX+r&&x<=SCHOOL.maxX-r&&z>=SCHOOL.minZ&&z<=SCHOOL.maxZ-r;
}

/** Everything on the campus that stops you. */
export function schoolColliders(){
 const list=[];
 const add=(id,x0,x1,z0,z1,height)=>list.push({id,x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,height});
 for(const b of TOWN_HALL_BUILDINGS){
  add('school-block',b.minX,b.maxX,B.minZ,B.maxZ,B.parapet);list.at(-1).building=b.id;
  for(const x of b.columns)add('school-column',x-.2,x+.2,SCHOOL.corridor.minZ,SCHOOL.corridor.minZ+.4,B.roof);
 }
 const w=SCHOOL.wash;add('school-wash-station',w.x-w.w/2,w.x+w.w/2,w.z-w.d/2,w.z+w.d/2,1.1);
 // The shed's solid holds the bicycles parked under it; each bicycle has its own collider too (school.js).
 const s=SCHOOL.bikeShed;add('school-bike-shed',s.minX,s.maxX,s.minZ+.9,s.maxZ,2.3);list.at(-1).holds='bicycles';
 const g=SCHOOL.gate;for(const side of [-1,1])add('school-gatepost',g.x+side*g.half-.35,g.x+side*g.half+.35,g.z-.35,g.z+.35,2.3);
 add('school-flagpole',SCHOOL.flagpole.x-.15,SCHOOL.flagpole.x+.15,SCHOOL.flagpole.z-.15,SCHOOL.flagpole.z+.15,9);
 // The iron bars went with the school; the power house, its fuel tank, the canopy's two columns stand there now.
 const ph=SCHOOL.powerHouse;add('town-hall-power-house',ph.minX,ph.maxX,ph.minZ,ph.maxZ,ph.height);
 add('town-hall-fuel-tank',ph.tank[0]-1.6,ph.tank[0]+1.6,ph.tank[1]-.7,ph.tank[1]+.7,1.6);
 // The compound's hana-block fence, with its gate in the east side at the doors.
 const k=ph.compound,T=.1;
 add('power-compound-fence',k.minX-T,k.minX+T,k.minZ,k.maxZ,k.height);add('power-compound-fence',k.minX,k.maxX,k.maxZ-T,k.maxZ+T,k.height);
 // On the south the house's own wall is the boundary (it stands to z 24.4): the fence closes the two corners beside it.
 add('power-compound-fence',k.minX,ph.minX,k.minZ-T,k.minZ+T,k.height);add('power-compound-fence',ph.maxX,k.maxX,k.minZ-T,k.minZ+T,k.height);
 add('power-compound-fence',k.maxX-T,k.maxX+T,k.minZ,k.gate[0],k.height);add('power-compound-fence',k.maxX-T,k.maxX+T,k.gate[1],k.maxZ,k.height);
 const c=SCHOOL.canopy;for(const x of [c.minX+.2,c.maxX-.2])add('town-hall-canopy-column',x-.15,x+.15,c.minZ+.05,c.minZ+.35,c.height);
 for(const [x,z] of FUKUGI)add('school-fukugi',x-.35,x+.35,z-.35,z+.35,6);
 return list;
}
