import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../../assets.js';
import {SAKURA_STREET_POSTER} from '../sakura-street-poster.js';
import {buildTradePosters} from './sakura-trade-posters.js';

/**
 * Sakura's inside stair is a passage, not a place to walk (the owner, 20 October 2026, on his iPhone: "I don't want the
 * stairs to be traversable it's too much errors when running up the stairs, I want the stairs to lead up to a black hole
 * and we disappear into there and when it loads we come up on the upper floor").
 *
 * So the shop and its office are two rooms. In the shop (the market room) the lower flight rises from the stockroom for
 * five treads and goes into darkness: everything of the stairwell beyond them is black, solid to the walk and to the lens.
 * Stepping onto the first tread (or "Go upstairs") walks him up into the dark while the picture fades to black, and the
 * office storey opens as its own room (interiors/sakura-office-room.js), the shop not loaded at all, with him at the stair
 * head in the hall facing up it. Coming down is the same from the stair head: four treads going down into the dark, and
 * he arrives at the stair's foot in the stockroom. game.js runs the walk, the fade and the change of room
 * (takeSakuraStair); this module is what is drawn at each end and where it starts, ends and arrives.
 *
 * The frames: the shop's (x along the frontage, z from the back room's wall to the window, y up from the shop floor) and
 * the office's (the same x, z from its back wall, y up from the office floor): z_office = z_shop - officeZ.
 */
export const SAKURA_STAIR=Object.freeze({height:4.01,officeZ:-.64,
 // The stair's footprint in the shop: the lower flight rises west from x -1.8 at z -5.15..-4.05.
 lower:Object.freeze({x0:-1.8,x1:-4.5,z0:-5.15,z1:-4.05}),
 bottom:Object.freeze([-1.25,0,-4.6])});

/** The stairwell's north wall, on the stair's side of the restroom partition (z -4.03), in the shop's frame. */
export const STAIR_NORTH=Object.freeze({z0:-4.07,z1:-4.03});

const TREAD=2.7/12,RISE=SAKURA_STAIR.height/24;

/**
 * The stairwell, whole (the owner, 27 October 2026: "The black part should not be shown it should be like a loading screen
 * when you up the stairs the loading starts for the top Floor"; "No the loading screen is walking up the stairs"). Drawing
 * SK-ST-001 rev A (docs/qa/sakura-surfaces/). In the shop's frame (x along the frontage, z from the street, y up from the
 * shop floor); the office storey draws the same stairwell in its own frame, `toOffice`.
 *
 * A dog-leg of 24 risers of RISE (167 mm) on goings of TREAD (225 mm): the lower flight rises west from the stockroom to
 * the turning landing, the upper flight east from it to the top landing at the office floor. Each flight stands on a
 * closed plaster carriage to the floor, so nothing is open beneath.
 * The well walls: west x -5.65, south z -6.70 (the office's stairwell back wall, carried down), north z -4.07.
 */
export const SAKURA_STAIRWELL=Object.freeze({
 rise:RISE,going:TREAD,risers:24,
 // Eleven treads each (the twelfth rise lands on the landing, the twenty-fourth on the top landing), as the office's
 // stair head has always drawn them: the tread i goings west of x -1.8 has its top at i rises (lower) or 24 - i (upper).
 lower:Object.freeze({x0:-1.8,x1:-1.8-11*TREAD,z0:-5.15,z1:-4.07}),
 landing:Object.freeze({x0:-5.65,x1:-1.8-11*TREAD,z0:-6.70,z1:-4.07,y:12*RISE}),
 upper:Object.freeze({x0:-1.8-11*TREAD,x1:-1.8,z0:-6.70,z1:-5.60}),
 top:Object.freeze({x0:-1.8,x1:-.6,z0:-6.70,z1:-6.14,y:SAKURA_STAIR.height}),
 walls:Object.freeze({west:-5.65,south:-6.70,north:-4.07,east:-.6,ceiling:SAKURA_STAIR.height+2.8,thick:.08}),
});
/**
 * The stairwell's trim (drawing SK-ST-002 rev A, after the owner's review of the climb frames, 27 October 2026: the walls
 * were blank planes, the step ends showed as a sawtooth and the cupboard door read as a loose board). Each piece is there
 * for a reason a builder would give:
 * - strings: a closed string each side of each flight, the treads housed in it, so no step end shows;
 * - the handrail: one continuous wall rail, a 40 mm tube on brackets 65 mm off the wall, 850 mm over the nosing line, from
 *   the foot round the landing to the top (a stair must have one; staff carry stock up it);
 * - skirting where the landings meet the walls (mops and boots); non-slip nosing on every tread (stock in both hands);
 * - the shop's campaign poster (Pixar Thuan, the one on Blue Coral's wall, SP-NK-001), pinned up twice where the climb
 *   sees it: on the wall between the flights at eye height, and straight ahead on the landing (the owner, 27 October 2026:
 *   "bring the posters from the town with the Pixar Thuan into the staircase ... on the walls"). The under-stair cupboard
 *   door that rev A put on that wall is gone ("Why is there a door in the staircase?"): it opened onto the 450 mm well
 *   between the flights, where nobody could reach it;
 * - 1F and 2F plates where each floor starts; the stair light and a switch at
 *   each end, so it can be lit from either; the fire alarm on the landing, the office's way out (evacuateSakuraOffice).
 * In the shop's frame. Strings and rails follow the nosing line (each tread's nose), `noseLine`.
 */
const K=RISE/TREAD,NOSE_OUT=.02;
// The nosing lines: lower flight rising west from its first nose (x -1.78 at one rise), upper rising east from its first
// nose over the landing (x -4.295 at thirteen rises).
const lowerLine=x=>RISE+(-1.8+NOSE_OUT-x)*K,upperLine=x=>13*RISE+(x-(-1.8-11*TREAD-NOSE_OUT))*K;
const string=(line,xa,xb,z0,z1,{above=.07,depth=.28}={})=>Object.freeze({x:Object.freeze([xa,xb]),z:Object.freeze([z0,z1]),
 top:Object.freeze([line(xa)+above,line(xb)+above]),bottom:Object.freeze([Math.max(0,line(xa)+above-depth),line(xb)+above-depth])});
const RAIL_H=.85,RAIL_OFF=.065,LZ=-4.07-RAIL_OFF,SZ=-6.70+RAIL_OFF,WX=-5.65+RAIL_OFF,Ly=12*RISE;
export const SAKURA_STAIR_TRIM=Object.freeze({
 lineSlope:K,
 // Treads stop at the strings' faces (SAKURA_STAIRWELL's flights are the strings' outer lines).
 strings:Object.freeze([
  // The lower strings run 20 mm past the first nose at the foot, as a string does (and off the carriage's end face).
  string(lowerLine,-1.76,-1.8-11*TREAD,-4.095,-4.07),string(lowerLine,-1.76,-1.8-11*TREAD,-5.175,-5.15),
  // The upper strings start 5 mm east of the flight's end (its carriage's face), the inner one 5 mm into its carriage.
  string(upperLine,-1.8-11*TREAD+.005,-1.8,-6.70,-6.675),string(upperLine,-1.8-11*TREAD+.005,-1.795,-5.605,-5.58),
 ]),
 treadZ:Object.freeze({lower:Object.freeze([-5.15,-4.095]),upper:Object.freeze([-6.675,-5.60])}),
 // [x0, x1, y0, y1, z0, z1]: the landing's north, west and south walls; the top landing's south and end walls.
 skirting:Object.freeze([[-5.635,-4.275,Ly,Ly+.09,-4.085,-4.07],[-5.65,-5.635,Ly,Ly+.09,-6.70,-4.07],[-5.635,-4.27,Ly,Ly+.09,-6.70,-6.685],
  // The top landing's end wall's face is at x -0.68 (the wall is 80 mm thick inside x -0.6).
  [-1.8,-.695,SAKURA_STAIR.height,SAKURA_STAIR.height+.09,-6.70,-6.685],[-.695,-.68,SAKURA_STAIR.height,SAKURA_STAIR.height+.09,-6.70,-6.145]].map(Object.freeze)),
 rail:Object.freeze({radius:.02,height:RAIL_H,off:RAIL_OFF,
  // The rail's centre line: up the lower flight on the north wall, round the landing on the west wall, up the upper flight
  // on the south wall (from one going before the landing's edge, on the flight's own line), over the top landing.
  path:Object.freeze([[-1.8,lowerLine(-1.8)+RAIL_H,LZ],[-1.8-11*TREAD,lowerLine(-1.8-11*TREAD)+RAIL_H,LZ],[WX,lowerLine(-1.8-11*TREAD)+RAIL_H,LZ],
   [WX,lowerLine(-1.8-11*TREAD)+RAIL_H,SZ],[-1.8-12*TREAD,upperLine(-1.8-12*TREAD)+RAIL_H,SZ],[-1.8,upperLine(-1.8)+RAIL_H,SZ],[-.95,upperLine(-1.8)+RAIL_H,SZ]].map(Object.freeze)),
  // The most a bracket may be from the next.
  bracketsEvery:1.0}),
 nosing:Object.freeze({depth:.035,height:.004,back:.012,end:.03}),
 // The posters (B2, 515 x 728 mm) on push pins: [x, y, z] of the centre on the wall's face, and which way it faces.
 posters:Object.freeze([
  Object.freeze({at:Object.freeze([-2.7,1.9,-5.60]),face:'+z',why:'Between the flights, at the eye of someone on the lower flight; the camera at the foot sees it.'}),
  Object.freeze({at:Object.freeze([-5.65,Ly+1.5,-4.65]),face:'+x',why:'On the landing’s back wall, straight ahead at the top of the lower flight.'}),
 ]),
 poster:Object.freeze({w:.515,h:.728,asset:SAKURA_STREET_POSTER.asset}),
 // The stair head's balustrade in the office hall (office frame): along the opening's east edge from the upper flight's
 // side to the store wall; 950 mm high, balusters 30 mm with gaps under 110 mm (a child's head does not pass).
 guard:Object.freeze({x:-2.05,z:Object.freeze([-4.91,-3.41]),height:.95,post:.09,top:Object.freeze([.06,.045]),bottom:Object.freeze([.045,.045,.05]),baluster:.03,gap:.1}),
 // Plates: [text, x, y, z, normal axis]; the alarm, light and switches likewise, each with the wall it is on.
 plates:Object.freeze([Object.freeze({text:'1F',sub:'売場',at:Object.freeze([-1.97,1.58,-4.07]),face:'-z'}),Object.freeze({text:'2F',sub:'事務所',at:Object.freeze([-.68,SAKURA_STAIR.height+1.5,-6.42]),face:'-x'})]),
 alarm:Object.freeze({at:Object.freeze([-5.65,Ly+1.45,-5.4]),face:'+x'}),
 light:Object.freeze({at:Object.freeze([-5.65,Ly+2.15,-5.4]),face:'+x'}),
 switches:Object.freeze([Object.freeze({at:Object.freeze([-1.6,1.2,-4.07]),face:'-z'}),Object.freeze({at:Object.freeze([-.68,SAKURA_STAIR.height+1.2,-6.25]),face:'-x'})]),
});
/** A point of the shop's frame in the office storey's. */
export const toOffice=([x,y,z])=>[x,y-SAKURA_STAIR.height,z-SAKURA_STAIR.officeZ];

/**
 * The climb: the walk up (or down) the whole stair is what he sees while the other storey opens (the owner, 27 October
 * 2026: "Camera should lock from below we just see him go up"). Going up, the shop's camera stands locked at the stair's
 * foot and turns only to keep him in sight as he climbs both flights out of it; going down, the office's stands locked
 * over the top landing. The whole stair is drawn in both storeys (buildSakuraStairwell), so the walk is the starting
 * storey's own; when it ends the picture cuts to him arriving at the other end. Paths in the shop's frame.
 */
// Up the lower flight on the line he arrives on at its foot (z -4.6), the upper on the office's stair-head line (office z -5.51).
// A camera at either end can see only its own flight: the walls between the flights hide the other. So the walk is the
// flight in view and the turn on the landing, and the cut comes as he turns out of sight (SK-ST-001 rev B).
const L=SAKURA_STAIRWELL,mid=(a,b)=>(a+b)/2,lz=-4.6,uz=-5.51+SAKURA_STAIR.officeZ,turnX=mid(L.landing.x0,L.landing.x1),turnZ=mid(lz,uz);
export const SAKURA_STAIR_CLIMB=Object.freeze({
 speed:1.2,cut:.18,
 up:Object.freeze([[-2.0,RISE,lz],[L.lower.x1+.1,L.landing.y,lz],[turnX,L.landing.y,lz],[turnX,L.landing.y,turnZ]].map(Object.freeze)),
 down:Object.freeze([[L.upper.x1-.1,SAKURA_STAIR.height,uz],[L.upper.x0+.1,L.landing.y,uz],[turnX,L.landing.y,uz],[turnX,L.landing.y,turnZ]].map(Object.freeze)),
 // The locked cameras (the owner: "Camera should lock from below we just see him go up"): in the shop low in the corner at
 // the stair's foot, looking up the lower flight; in the office high over the top landing, looking down the upper. Each
 // aims at its flight and turns only a little after him.
 camera:Object.freeze({
  shop:Object.freeze({at:Object.freeze([-.72,.95,-4.3]),aim:Object.freeze([-4.0,1.9,-4.75]),follow:.3}),
  office:Object.freeze({at:Object.freeze([-.72,SAKURA_STAIR.height+2.25,-6.45]),aim:Object.freeze([-4.0,L.landing.y+.6,-6.0]),follow:.3}),
 }),
});
/** A dark volume: [x0, x1, z0, z1, y0, y1]. */
const dark=(...v)=>Object.freeze(v);

export const SAKURA_STAIR_PASSAGE=Object.freeze({
 /** How long the walk into the dark takes, and how long the picture takes to go black. */
 seconds:1.1,fade:.7,
 /** The shop's end, in the shop's frame. */
 foot:Object.freeze({
  treads:5,
  // Stepping onto the first tread starts the passage; he can stand at the foot without starting it.
  trigger:Object.freeze({x:Object.freeze([-2.95,-1.92]),z:Object.freeze([-5.12,-4.08])}),
  // Up the first treads into the dark (from wherever he stepped on).
  walk:Object.freeze([Object.freeze([-2.08,RISE,-4.6]),Object.freeze([-2.9,4*RISE,-4.6])]),
  // Coming down he arrives at the foot, a step clear of the first tread, facing the stockroom.
  arrive:Object.freeze({at:Object.freeze([-1.12,0,-4.6]),yaw:-Math.PI/2}),
  prompt:Object.freeze([-1.55,1.1,-4.6]),
  // The black: the rest of the lower flight and the turning landing; the alcove south of the flight (under the upper
  // flight that was); the stairwell over the stockroom's ceiling opening. Out to the stockroom's walls (x -5.72, z -6.86), 5 mm clear of the north wall (z -4.07) so no two faces share a plane.
  dark:Object.freeze([dark(-5.71,-2.93,-6.85,-4.075,0,SAKURA_STAIR.height+2.8),dark(-2.93,-1.8,-6.85,-5.18,0,2.9),dark(-2.93,-.6,-6.85,-4.075,2.9,SAKURA_STAIR.height+2.8)]),
 }),
 /** The office's end, in the office's frame. */
 head:Object.freeze({
  treads:4,
  // The upper flight comes up from the west to the top landing's south end (x -1.8..-0.6), behind the hall.
  flight:Object.freeze({x0:-1.8,z0:-6.06,z1:-4.96}),
  trigger:Object.freeze({x:Object.freeze([-2.7,-1.9]),z:Object.freeze([-6.0,-5.0])}),
  walk:Object.freeze([Object.freeze([-1.95,0,-5.51]),Object.freeze([-2.62,-3*RISE,-5.51])]),
  // Going up he arrives at the stair head, on the top landing, facing up the hall.
  arrive:Object.freeze({at:Object.freeze([-1.2,0,-3.95]),yaw:Math.PI}),
  prompt:Object.freeze([-1.2,1.1,-5.25]),
  // The pit of the stairwell under the hall's hole, and under the four treads.
  dark:Object.freeze([dark(-5.65,-2.7,-6.06,-3.36,-4.2,-.03),dark(-2.7,-2.05,-4.96,-3.36,-4.2,-.03),dark(-2.7,-1.8,-6.06,-4.96,-4.2,-4*RISE-.1)]),
 }),
 why:'The owner’s decision of 20 October 2026 (AGENTS.md): the stair leads up into darkness and he comes up on the office floor; nobody walks it.',
});

/**
 * The whole stairwell (SAKURA_STAIRWELL, drawing SK-ST-001), the same pieces in either storey: `storey` 'shop' draws it in
 * the shop's frame with what closes it over the stockroom (the hall's floor, its walls, the stairwell ceiling), 'office'
 * in the office's frame with the stockroom floor at its foot. Treads sit on their closed carriages 30 mm down, the
 * landings on closed blocks: every piece starts where the next ends, no face in another's plane (SK-ZF rules).
 * One mesh per material. Returns the group.
 */
export function buildSakuraStairwell(parent,{storey='shop'}={}){
 const S=SAKURA_STAIRWELL,W=S.walls,H=SAKURA_STAIR.height,shop=storey==='shop',dy=shop?0:-H,dz=shop?0:-SAKURA_STAIR.officeZ;
 const group=new THREE.Group();group.name='Sakura stairwell';parent.add(group);
 const lists=new Map(),add=(key,g)=>{g.translate(0,dy,dz);(lists.get(key)??lists.set(key,[]).get(key)).push(g.index?g.toNonIndexed():g);};
 const span=(key,x0,x1,y0,y1,z0,z1)=>add(key,new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0).translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));
 const NOSE=.02,BOARD=.03;
 // A flight's carriage: its stepped side, extruded across the flight, from the floor to 30 mm under each tread.
 const carriage=(steps,z0,z1)=>{const sh=new THREE.Shape();sh.moveTo(steps[0][0],0);for(const [x0,x1,top] of steps){sh.lineTo(x0,top-BOARD);sh.lineTo(x1,top-BOARD);}sh.lineTo(steps.at(-1)[1],0);sh.closePath();
  add('plaster',new THREE.ExtrudeGeometry(sh,{depth:z1-z0,bevelEnabled:false}).translate(0,0,z0));};
 // Lower flight: tread i (1..11) i goings west of x -1.8, its top at i rises.
 const lower=[];for(let i=1;i<=11;i++){const x1=S.lower.x0-(i-1)*TREAD,x0=x1-TREAD;lower.push([x1,x0,i*RISE]);}
 carriage(lower,S.lower.z0,S.lower.z1);
 const TZ=SAKURA_STAIR_TRIM.treadZ;
 for(const [x1,x0,top] of lower)span('wood',x0,x1+NOSE,top-BOARD,top,TZ.lower[0],TZ.lower[1]);
 // Upper flight: tread i (1..11) i goings west of x -1.8, its top at 24 - i rises; its carriage closed to the floor.
 const upper=[];for(let i=11;i>=1;i--){const x1=S.upper.x1-(i-1)*TREAD,x0=x1-TREAD;upper.push([x0,x1,(24-i)*RISE]);}
 carriage(upper,S.upper.z0,S.upper.z1);
 for(const [x0,x1,top] of upper)span('wood',x0-NOSE,x1,top-BOARD,top,TZ.upper[0],TZ.upper[1]);
 // The turning landing on its block; the top landing on its block over the stockroom's ceiling.
 const Lg=S.landing;span('plaster',Lg.x0,Lg.x1,0,Lg.y-BOARD,Lg.z0,Lg.z1);span('wood',Lg.x0,Lg.x1,Lg.y-BOARD,Lg.y,Lg.z0,Lg.z1);
 const Tp=S.top,CEIL=2.98;span('plaster',Tp.x0,Tp.x1,CEIL,H-.12,Tp.z0,Tp.z1);
 if(shop)span('timber',Tp.x0,Tp.x1,H-.12,H,Tp.z0,Tp.z1);
 // The well walls, full height in the shop; in the office the north wall stops at its floor (the store wall goes on).
 const t=W.thick;
 if(shop){span('plaster',W.west-t,W.west,0,W.ceiling,W.south,W.north);span('plaster',W.west,W.east,0,W.ceiling,W.north,W.north+.04);}
 else{
  // In the office storey the walls meet its own: the north wall stops under the hall's floor east of the hole (x -2.05).
  // Its west wall runs to the ceiling: west of it, between it and the building's wall (office x -6.4), is a strip of the
  // office floor that is no room, and from the stair it showed as a slab floating on the landing's wall (SK-ST-002).
  span('plaster',W.west-t,W.west,0,W.ceiling,W.south,W.north);
  span('plaster',W.west,-2.05,0,H,W.north,W.north+.04);span('plaster',-2.05,W.east,0,H-.12,W.north,W.north+.04);
 }
 span('plaster',W.west-t,W.east,-.19,W.ceiling,W.south-t,W.south);
 // East, over the stockroom's ceiling and under the hall's floor, between the top landing's block and the north wall.
 span('plaster',W.east-t,W.east,CEIL,H-.12,Tp.z1,W.north);
 // The top landing's end wall, from the office floor to the stairwell ceiling.
 span('plaster',W.east-t,W.east,H,W.ceiling,W.south,Tp.z1);
 if(shop){
  // What the shop cannot see but must not look into: the hall's floor over the stockroom, the hall's back wall over the
  // top landing and the hole's rail line, closed; the stairwell ceiling.
  span('timber',-2.05,W.east,H-.12,H,Tp.z1,W.north);
  span('plaster',-2.05,W.east-t,H,W.ceiling,Tp.z1,Tp.z1+.08);
  span('plaster',-2.05-t,-2.05,H,W.ceiling,Tp.z1+.08,W.north);
  span('ceiling',W.west,-2.05-t,W.ceiling,W.ceiling+.12,W.south,W.north);span('ceiling',-2.05-t,W.east,W.ceiling,W.ceiling+.12,W.south,Tp.z1);
 }else{
  // The stockroom's floor at the stair's foot, seen from the office storey looking down the flights.
  span('floor',W.west,W.east,-.12,0,W.south,W.north);
 }
 buildStairTrim(add,span);
 const trade=buildTradePosters('stair');for(const g of trade.pins)add('red',g);
 const colour={plaster:0xece1ca,wood:0x8d7458,timber:0x947354,door:0xb08a5e,ceiling:0xf1eadb,floor:0xb4b1a8,string:0x7f6750,rail:0x8a6a48,
  metal:0xb9b6ae,nosing:0x5d625b,red:0xc23a2e,fitting:0xf2efe6,lamp:0xff5a44,glow:0xfff1d2};
 const lit={lamp:true,glow:true},shine={metal:{metalness:.6,roughness:.35},rail:{roughness:.55},red:{roughness:.45}};
 for(const [key,list] of lists){
  const material=lit[key]?new THREE.MeshBasicMaterial({color:colour[key],toneMapped:false}):new THREE.MeshStandardMaterial({color:colour[key],roughness:.88,...shine[key]});
  const m=new THREE.Mesh(mergeGeometries(list),material);list.forEach(g=>g.dispose());
  m.name='Sakura stairwell '+key;m.receiveShadow=true;group.add(m);
 }
 if(typeof document!=='undefined'&&document.createElement)group.add(...stairPlates(dy,dz),...stairPosters(dy,dz));
 // The brewers', distillers' and Asagao's posters up the flights and round the landing (SK-ST-003, sakura-trade-posters.js).
 if(trade.paper){trade.paper.position.set(0,dy,dz);group.add(trade.paper);}
 return group;
}

/** The trim (SAKURA_STAIR_TRIM, SK-ST-002): strings, rail and brackets, skirting, nosing, the posters' pins, the fittings. */
function buildStairTrim(add,span){
 const T=SAKURA_STAIR_TRIM,S=SAKURA_STAIRWELL;
 // Strings: their side profile between the nosing line's offsets, extruded across their thickness.
 for(const g of T.strings){
  const sh=new THREE.Shape(),[xa,xb]=g.x;sh.moveTo(xa,g.bottom[0]);sh.lineTo(xa,g.top[0]);sh.lineTo(xb,g.top[1]);sh.lineTo(xb,g.bottom[1]);
  // At the foot the string stands on the floor: its lower edge meets y 0 where the line crosses it.
  if(g.bottom[0]===0&&g.top[0]-.28<0){const x0=xa+(xa<xb?1:-1)*(.28-g.top[0])/T.lineSlope;sh.lineTo(x0,0);}
  sh.closePath();add('string',new THREE.ExtrudeGeometry(sh,{depth:g.z[1]-g.z[0],bevelEnabled:false}).translate(0,0,g.z[0]));
 }
 for(const [x0,x1,y0,y1,z0,z1] of T.skirting)span('string',x0,x1,y0,y1,z0,z1);
 // Non-slip nosing: a 4 mm strip set back 12 mm from each nose, 30 mm short of the strings.
 const N=T.nosing,tz=T.treadZ;
 for(let i=1;i<=11;i++){
  const nose=S.lower.x0-(i-1)*TREAD+NOSE_OUT,top=i*RISE;span('nosing',nose-N.back-N.depth,nose-N.back,top,top+N.height,tz.lower[0]+N.end,tz.lower[1]-N.end);
  const unose=S.upper.x1-i*TREAD-NOSE_OUT,utop=(24-i)*RISE;span('nosing',unose+N.back,unose+N.back+N.depth,utop,utop+N.height,tz.upper[0]+N.end,tz.upper[1]-N.end);
 }
 // The handrail: a tube along the path, a ball at each bend and end, a bracket from the wall about every metre.
 const R=T.rail,v=p=>new THREE.Vector3(...p),up=new THREE.Vector3(0,1,0);
 const tube=(a,b,r,key,seg=8)=>{const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,d.length(),seg,1,true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(key,g);};
 const pts=R.path.map(v);
 for(let i=1;i<pts.length;i++){
  tube(pts[i-1],pts[i],R.radius,'rail');
  const len=pts[i].distanceTo(pts[i-1]),n=Math.max(1,Math.ceil(len/R.bracketsEvery));
  for(let k=0;k<n;k++){
   const p=pts[i-1].clone().lerp(pts[i],(k+.5)/n),wall=wallBehind(p),stem=p.clone().addScaledVector(wall,R.off-.008);
   tube(p.clone().addScaledVector(new THREE.Vector3(0,-1,0),R.radius*.6),stem.clone().setY(p.y-R.radius*.6),.007,'metal',6);
   const rose=new THREE.CylinderGeometry(.03,.03,.008,10);rose.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,wall));
   rose.translate(...stem.clone().setY(p.y-R.radius*.6).addScaledVector(wall,.004).toArray());add('metal',rose);
  }
 }
 for(const p of pts){const g=new THREE.SphereGeometry(R.radius*1.04,8,6);g.translate(p.x,p.y,p.z);add('rail',g);}
 // The posters' push pins, one in each corner, 25 mm in (the paper itself is a decal, stairPosters).
 const Q=T.poster;
 for(const p of T.posters){const [x,y,z]=p.at,n=p.face[1]==='x'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1),along=p.face[1]==='x'?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);
  for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]]){const c=new THREE.Vector3(x,y,z).addScaledVector(along,a*(Q.w/2-.025)).add(new THREE.Vector3(0,b*(Q.h/2-.025),0));
   const head=new THREE.CylinderGeometry(.006,.006,.005,8);head.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,n));head.translate(...c.clone().addScaledVector(n,.0035).toArray());add('red',head);}}
 // The fittings, each a box out from its wall: [width, height, depth] along the wall, up, out.
 // `from`: how far out from the wall it starts (on the face of what it is mounted on, never in the same plane).
 const fit=(at,face,w,h,d,key,lift=0,from=0)=>{const [x,y,z]=at,sg=face[0]==='-'?-1:1,a=sg*from,b=sg*(from+d);
  if(face[1]==='x')span(key,x+Math.min(a,b),x+Math.max(a,b),y+lift-h/2,y+lift+h/2,z-w/2,z+w/2);else span(key,x-w/2,x+w/2,y+lift-h/2,y+lift+h/2,z+Math.min(a,b),z+Math.max(a,b));};
 // The fire alarm (a red lamp always lit, the bell, the push-button box) on the landing's west wall.
 const A=T.alarm;fit(A.at,A.face,.22,.34,.012,'red');fit(A.at,A.face,.05,.05,.02,'lamp',.13,.012);
 const bell=new THREE.CylinderGeometry(.075,.08,.045,14);bell.rotateZ(Math.PI/2).translate(A.at[0]+.012+.0225,A.at[1]+.01,A.at[2]);add('red',bell);
 fit(A.at,A.face,.1,.1,.04,'fitting',-.14,.012);fit(A.at,A.face,.05,.05,.012,'red',-.14,.052);
 // The stair light: a bracket fitting over the alarm, its glass lit.
 const L=T.light;fit(L.at,L.face,.32,.1,.025,'fitting');fit(L.at,L.face,.28,.07,.06,'glow',-.005,.025);
 // A switch at each end, the stair light's two-way pair.
 for(const sw of T.switches){fit(sw.at,sw.face,.07,.12,.01,'fitting');fit(sw.at,sw.face,.03,.05,.006,'metal',0,.01);}
 // The 1F and 2F plates' boards (their lettering is a decal, stairPlates).
 for(const p of T.plates)fit(p.at,p.face,.3,.2,.01,'fitting');
}
/** The direction from a rail point to the wall it is fixed to. */
function wallBehind(p){
 const W=SAKURA_STAIRWELL.walls,d=[[W.north-p.z,new THREE.Vector3(0,0,1)],[p.z-W.south,new THREE.Vector3(0,0,-1)],[p.x-W.west,new THREE.Vector3(-1,0,0)]];
 return d.reduce((a,b)=>b[0]<a[0]?b:a)[1];
}
/** The posters' paper: the campaign print (SP-NK-001's artwork) as a decal 1 mm off the wall, polygon offset. */
function stairPosters(dy,dz){
 const Q=SAKURA_STAIR_TRIM.poster,material=new THREE.MeshStandardMaterial({color:0xfff4de,roughness:.7,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
 if(globalThis.document?.baseURI){const t=new THREE.TextureLoader().load(assetURL(Q.asset));t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;material.map=t;material.color.set(0xffffff);}
 return SAKURA_STAIR_TRIM.posters.map((p,i)=>{
  const m=new THREE.Mesh(new THREE.PlaneGeometry(Q.w,Q.h),material),[x,y,z]=p.at;
  if(p.face==='+x'){m.position.set(x+.001,y+dy,z+dz);m.rotation.y=Math.PI/2;}else{m.position.set(x,y+dy,z+.001+dz);}
  m.name=`Stair poster ${i+1} · Sakura campaign`;return m;
 });
}
/** The 1F and 2F plates' lettering: decals on their boards (polygon offset, SK-ZF rules). */
function stairPlates(dy,dz){
 return SAKURA_STAIR_TRIM.plates.map(p=>{
  const c=document.createElement('canvas');c.width=192;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#f2efe6';g.fillRect(0,0,192,128);g.fillStyle='#2f6b5e';g.fillRect(0,0,192,10);
  g.fillStyle='#24302c';g.font='bold 64px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(p.text,96,60);
  g.font='22px sans-serif';g.fillText(p.sub,96,104);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.29,.19),new THREE.MeshStandardMaterial({map:t,roughness:.8,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));
  const [x,y,z]=p.at,out=.0105;
  if(p.face==='-x'){m.position.set(x-out,y+dy,z+dz);m.rotation.y=-Math.PI/2;}else{m.position.set(x,y+dy,z-out+dz);m.rotation.y=Math.PI;}
  m.name=`Stair plate ${p.text}`;return m;
 });
}

const inside=(p,{x,z})=>p.x>=x[0]&&p.x<=x[1]&&p.z>=z[0]&&p.z<=z[1];
/** Whether he has stepped onto the stair at the shop's end (shop frame), or at the office's end (office frame). */
export const onSakuraStairFoot=p=>inside(p,SAKURA_STAIR_PASSAGE.foot.trigger)&&Math.abs(p.y)<.5;
export const onSakuraStairHead=p=>inside(p,SAKURA_STAIR_PASSAGE.head.trigger)&&Math.abs(p.y)<.5;

// The passage's volumes are solid to the walk and the lens, and no longer drawn: the stairwell is built whole
// (buildSakuraStairwell) and nothing of it is black (the owner, 27 October 2026).
function addDark(group,boxes,solid,name,{over=null}={}){
 for(const [x0,x1,z0,z1,y0,y1] of boxes){
  // Solid to the walk and the lens; under a floor, up to `over` so nobody walks out over the pit.
  const top=over??y1;solid((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,top-y0,y0);
 }
}

/**
 * The shop's end of the stair: five treads of the lower flight rising from the stockroom into the dark, the under-stair
 * wall beside them, the stairwell's north wall against the restroom, the prompt. Returns its colliders (shop frame).
 */
export function buildSakuraStairFoot({room,reg=()=>{},go=()=>{}}){
 const group=new THREE.Group();group.name='Sakura internal stairwell';room.add(group);
 const F=SAKURA_STAIR_PASSAGE.foot,H=SAKURA_STAIR.height,colliders=[];
 const solid=(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY});
 // The stairwell, whole: both flights, the landings, its walls and ceiling (SK-ST-001). Its north wall keeps the lens out
 // of the toilet.
 buildSakuraStairwell(group,{storey:'shop'});
 solid(-3.15,-4.02,2.9,.06,3.05,0);
 for(const [x0,x1,y0] of [[-5.7,-4.6,0],[-4.6,-.6,2.9]])solid((x0+x1)/2,(STAIR_NORTH.z0+STAIR_NORTH.z1)/2,x1-x0,STAIR_NORTH.z1-STAIR_NORTH.z0,H-y0,y0);
 addDark(group,F.dark,solid,'Sakura stairwell darkness');
 const a=new THREE.Object3D();a.position.set(...F.prompt);a.name='Go upstairs';group.add(a);reg(a,'Go upstairs',()=>go('up'),true);
 return {colliders,group};
}

/**
 * The office's end of the stair (office frame): the top landing's last stretch behind the hall, its four treads going down
 * into the dark, the pit under the hall's hole, the stairwell's walls and ceiling, the rail along the hole. `box` is the
 * office builder's (its materials, its merging, its colliders).
 */
export function buildSakuraStairHead({room,box,collider=()=>{},reg=()=>{},go=()=>{}}){
 const P=SAKURA_STAIR_PASSAGE.head,f=P.flight,TIMBER=0x8a6a48,PLASTER=0xece1ca,WOOD=0x8d7458;
 // The top landing's south end, through the opening in the hall's back wall.
 box([-.6-f.x0,.12,-5.5-f.z0],[(f.x0-.6)/2,-.06,(f.z0-5.5)/2],0x947354,'Office timber floor');
 // The stairwell, whole, down to the stockroom (SK-ST-001), and its ceiling behind the hall; solid where its walls are.
 buildSakuraStairwell(room,{storey:'office'});
 box([-.6+5.65,.12,.56],[(-.6-5.65)/2,2.86,-5.78],0xf1eadb,'Stairwell ceiling');
 for(const [x,z,w,d] of [[(-.6-5.65)/2,-6.1,5.05,.08],[-.64,-5.78,.08,.56],[-5.69,-5.78,.08,.56]])collider(x,z,w,d,2.8);
 // The balustrade along the opening's edge, between the hall and the stairwell (SAKURA_STAIR_TRIM.guard; until rev B a
 // solid 1.5 m board, put up when the well was a black pit, and from the stair it read as a slab of wall).
 const Gd=SAKURA_STAIR_TRIM.guard,[gz0,gz1]=Gd.z,P2=Gd.post/2,run0=gz0+Gd.post,run1=gz1-Gd.post,len=run1-run0;
 collider(Gd.x,(gz0+gz1)/2,.08,gz1-gz0,Gd.height);
 for(const z of [gz0+P2,gz1-P2])box([Gd.post,Gd.height+.04,Gd.post],[Gd.x,(Gd.height+.04)/2,z],TIMBER,'Stair head newel post');
 box([Gd.top[0],Gd.top[1],len],[Gd.x,Gd.height-Gd.top[1]/2,(run0+run1)/2],TIMBER,'Stair head handrail');
 box([Gd.bottom[0],Gd.bottom[1],len],[Gd.x,Gd.bottom[2]+Gd.bottom[1]/2,(run0+run1)/2],TIMBER,'Stair head bottom rail');
 const n=Math.ceil((len+Gd.gap)/(Gd.baluster+Gd.gap))-1,pitch=len/(n+1),by0=Gd.bottom[2]+Gd.bottom[1],by1=Gd.height-Gd.top[1];
 for(let i=1;i<=n;i++)box([Gd.baluster,by1-by0,Gd.baluster],[Gd.x,(by0+by1)/2,run0+i*pitch],TIMBER,'Stair head baluster');
 const solid=(x,z,w,d,height,minY)=>collider(x,z,w,d,height,minY);
 // The pit is solid to a grown-up's height, so nobody walks out over it; under the treads it is only the dark.
 addDark(room,P.dark.slice(0,2),solid,'Sakura stairwell darkness',{over:1.5});addDark(room,P.dark.slice(2),solid,'Sakura stairwell darkness');
 const a=new THREE.Object3D();a.position.set(...P.prompt);a.name='Go downstairs';a.userData.npcInteraction=false;room.add(a);reg(a,'Go downstairs',()=>go('down'),true);
 return a;
}
