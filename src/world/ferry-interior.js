import {FERRY_H1_ENABLED,FERRY_H1} from './ferry-engine-room-plan.js';
import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_ELECTRICS} from './ferry-ship.js';
import {JOHANSSON_MARINE,makerPlate,WORDMARK} from './johansson-marine.js';
import {FERRY_PIPING} from './ferry-piping.js';
import {routePipes,routePipePreview,pipePreviewSegments,pipePreviewBends,pipeRadius} from './ferry-pipe-routes.js';
import {PLANT_ALARMS} from './ferry-plant.js';

/**
 * The Minato Maru's houses and casings as she is walked (ferry batch 6b; docs/FERRY-AUDIT.md): one list of what is
 * built, read by the model (ferry-model.js draws it) and by the walk (ferry-walk.js stands people on its floors and
 * stops them at its walls), so what you see and where you can go never disagree.
 *
 * The way up from the car deck: the walkway beside casing P to stair P's door (casing P, shipyard z 11.3–12.3), the
 * stair rising aft at 48° in the casing to the lobby (z 6–9.5, full breadth), whose stair heads P and S are its wings.
 * From the lobby: aft through its door to the open deck and up its two ladders to the bridge deck's aft platform;
 * forward along the corridor between the toilets, up two steps into the passenger benches, down two into the saloon. From the
 * saloon's cross passage (z 16.5–17.6) the side doors give onto the walkways, and at the walkways' forward ends a
 * ladder rises to each bridge wing, whose door opens into the wheelhouse.
 *
 * Model frame (ferry-model.js): +z forward, +x to port, y up from her laden waterline. Every box is [x0,y0,z0]–[x1,y1,z1].
 */
const SH=FERRY_SHIP,H=FERRY_HEIGHTS,HALF=SH.length/2,HB=SH.beam/2;
const Z=zy=>zy-HALF,Y=yk=>yk-SH.draft;
/** Generator sets relocated into the existing auxiliary machinery room, 2.65 m forward of their former crowded site. */
const GENERATOR_SHIFT=2.65,GZ=zy=>Z(zy+GENERATOR_SHIFT);
const CAR=Y(H.carDeck),PASS=Y(H.passengerDeck),BRIDGE=Y(H.bridgeDeck),COMPASS=Y(H.compassDeck);
const WHITE=0xeeeae0,CREAM=0xece4d2,TEAL=0x2f6f74,DOOR=0x5d6b6a,DARK=0x2a2f31,STEEL=0x7d8586,DECKGREEN=0x6f7d6c,
 VINYL=0xc8c0aa,CARPET=0x6f8a63,SALOON=0x5d7189,MOQUETTE=0x3e5d85,TEAK=0x8d6f4c,ORANGE=0xe0702a,YELLOW=0xe0b93a,RED=0xc2412f;

/** Wall thickness, and the heights inside the passenger deckhouse. */
const T=.08,CEIL=BRIDGE-.25;
/**
 * The plan. The lobby (z 6–9.5) is the deckhouse's full breadth, out to her sides (x ±4.1), its wings the stair heads;
 * forward of it the house is 6.8 m wide (x ±3.4) with a 0.7 m walkway each side to the rail.
 */
export const FERRY_HOUSE=Object.freeze({
 aft:Z(6),lobbyFore:Z(9.5),toiletsFore:Z(11.5),carpetFore:Z(16.5),fore:Z(23),
 lobbyHalf:HB-.1,half:3.4,ceiling:CEIL,
 /** The saloon's cross passage at its aft end, where its side doors open onto the walkways. */
 crossFore:Z(17.6),sideDoor:Z(17.05),
 /** The corridor between the toilets, and the carpet room's steps (two of 0.15 m). */
 corridor:.6,carpet:.3,
 /** The bridge house (crew's rooms aft of the wheelhouse), and the wheelhouse. */
 bridgeHalf:3,wheelhouseAft:Z(19.5),houseTop:COMPASS-.2,
 /** The open deck's platform under the bridge deck's aft end, and its two ladders. */
 platformAft:Z(6)-1.2,ladderX:1.15,
});
const F=FERRY_HOUSE,LW=F.lobbyHalf,DW=F.half,DH0=F.aft,DH1=F.fore,LB1=F.lobbyFore,TB1=F.toiletsFore,CR1=F.carpetFore;
const BH=F.bridgeHalf,WH0=F.wheelhouseAft,PF0=F.platformAft;
/** The casings (car deck to the passenger deck), and stair P's and S's place in them. */
const CAS0=Z(3),CAS1=Z(20),CAS_IN=2.75,CAS_OUT=HB-.03,CAS_TOP=PASS-.25;
export const FERRY_STAIRS=Object.freeze({
 /** The flight: its foot on the car deck at z 11.3, its head at the lobby floor at z 7.4; 22 risers of 0.2 m; 1.2 m clear (batch 6f). */
 foot:Z(11.3),head:Z(7.4),x:Object.freeze([CAS_IN+.06,HB-.09]),risers:22,
 /** The door in the casing's inboard face (1.2 m), and the casing's end forward of the stair's foot (starboard; to port the
  * foyer runs on to the gangway passage). */
 door:Object.freeze([Z(11.35),Z(12.55)]),wellFore:Z(12.6),
 /** The well's opening in the passenger deck: the flight's head to where the stair passes under the deck with headroom. */
 opening:Object.freeze([Z(7.4),Z(9.4)]),
});
const S=FERRY_STAIRS;
/**
 * The engine room (ferry batch 6c): shipyard z 8.5–14, floor plates 0.9 m over the keel, 1.9 m clear under the car deck.
 * (The general arrangement gave it z 5–14; the hull's counter rises aft of z 10.5, and at z 8 the bottom is already
 * above the floor plates' level, so its after end is at 8.5, the shafts running aft from there under the fresh-water
 * tanks.) Its way in is the casing P door at z 6.6–7.4 and a ladder down through a hatch in the car deck.
 */
export const FERRY_ENGINE_ROOM=Object.freeze({aft:Z(8.5),fore:Z(14),floor:Y(.9),deckhead:CAR-(FERRY_H1_ENABLED?.4:.2),side:3.98,
 entrance:Object.freeze((FERRY_H1_ENABLED?FERRY_H1.ladder.entrance:[6.25,7.4]).map(Z)),door:Object.freeze((FERRY_H1_ENABLED?FERRY_H1.ladder.door:[6.3,7.4]).map(Z)),
 /** The ladder: its head on the car deck at z 7.0, its foot on the floor plates at z 8.6; the hatch it goes down. */
 ladder:Object.freeze({x:Object.freeze(FERRY_H1_ENABLED?[...FERRY_H1.ladder.bounds]:[3.2,3.95]),head:Z(FERRY_H1_ENABLED?6.4:7),foot:Z(8.6)}),hatch:Object.freeze({x:Object.freeze([3.15,HB-.07]),z:Object.freeze([Z(FERRY_H1_ENABLED?6.4:7),Z(9)])}),
});
const ER=FERRY_ENGINE_ROOM;
/**
 * The machinery spaces forward of the engine room (batch 6q; the creator, 2026-10-13: "The engine room should be several
 * levels and have many rooms"): through the watertight sliding door at Fr 28 the auxiliary machinery room (z 14–19), then
 * through the door at Fr 38 the workshop to port and the engine store to starboard (z 19–22.5), all on the floor plates.
 */
export const FERRY_MACHINERY_SPACES=Object.freeze({auxFore:Z(19),storeFore:Z(22.5),ewFore:Z(26),wtDoor:Object.freeze({w:.8,h:FERRY_H1_ENABLED?2.1:1.9}),door38:Object.freeze({w:.75,h:FERRY_H1_ENABLED?2.1:1.85}),
 /** The door at Fr 45, the workshop's forward bulkhead to the electrical workshop: between the store's mesh and the bench. */
 door45:Object.freeze({x:.25,w:.7,h:FERRY_H1_ENABLED?2.1:1.85}),partition:-.5,partitionAft:Z(20.1)});
const MS=FERRY_MACHINERY_SPACES,WT_W=MS.wtDoor.w,WT_H=MS.wtDoor.h;
/** Model-linked arrangement review data. Clearances are measured/reserved values, never OEM overhaul minima. */
export const FERRY_ENGINEERING_ARRANGEMENT=Object.freeze({
 status:'concept-requires-redesign',datum:'metres above keel / forward of transom; port-positive transverse',
 engineRoom:Object.freeze({aft:8.5,fore:14,breadth:ER.side*2,floorAboveKeel:ER.floor+SH.draft,deckheadAboveKeel:ER.deckhead+SH.draft,nominalHeadroom:ER.deckhead-ER.floor}),
 engineRailEnvelope:Object.freeze({longitudinal:Object.freeze([9.3,12.4]),port:Object.freeze([.65,2.45]),starboard:Object.freeze([-2.45,-.65]),railHeight:.95}),
 centralAisle:Object.freeze({width:1.30,clearBetweenRails:1.30-.04,verification:'game collision envelope only'}),
 mainForwardServiceBand:Object.freeze({longitudinal:Object.freeze([13.0,14.0]),width:1.0,verification:'clear after genset relocation; supplier overhaul procedure unverified'}),
 auxiliaryGeneratorAccess:Object.freeze({centreAisle:1.0,sideAisle:1.035,verification:'model footprint clearance, not supplier minimum'}),
 generatorEnvelope:Object.freeze({room:'aux-room',longitudinal:Object.freeze([15.2,16.05]),port:Object.freeze([.55,2.4]),starboard:Object.freeze([-2.4,-.55]),bedHeight:.2}),
 primaryLadder:Object.freeze({width:FERRY_H1_ENABLED?.8:.75,head:FERRY_H1_ENABLED?6.4:7,foot:8.6,verification:'model walk tested; real escape compliance unresolved'}),
 escape:Object.freeze({location:'aft starboard',ladderWidth:.4,verification:'decorative ladder; no complete protected trunk/hatch/operating arrangement verified'}),
 removal:Object.freeze({verification:'unresolved: no engineered removable hatch, lifting beam, rigging or machinery-to-weather removal route'}),
 overheadService:Object.freeze({verification:FERRY_H1_ENABLED?'H1: 2.4 m working envelope reserved; complete service routing and OEM overhaul clearances unresolved':'unresolved: 1.9 m nominal room height is not a demonstrated engine-overhaul clearance'}),
});
/** The floors below the car deck, where the engines are heard: whoever stands on one wears ear defenders (game.js). */
export const BELOW_DECK_FLOORS=Object.freeze(['er-ladder','er-ladder-foot','engine-room','control-booth','aux-room','workshop','electrical-workshop']);

/** The gangway passage through casing P (ferry-model.js GATE): 1.4 m wide, and the foyer from it aft to the foot of stair P. */
const GATE_FROM=Z(13.3),GATE_TO=Z(14.7);
/** The ladder from each walkway up to its bridge wing: its foot on the walkway, its head on the wing's aft edge. */
export const FERRY_WING_LADDER=Object.freeze({x:3.75,foot:F.crossFore,head:WH0});
/**
 * The crew stair to the wheelhouse (the owner, 3 November 2026: "We need an interior stair case to the bridge as well").
 * A straight flight, 0.8 m clear, 13 risers of 0.2 m at 45°, up the starboard side of the saloon from its cross passage,
 * behind a door marked 乗組員専用 (crew only), into the wheelhouse's aft starboard corner beside the wing door, so the
 * watch reaches the bridge without going out on deck in the rain. Under the bridge deck it is a trunk (x −2.04 to the
 * house side, shipyard z 17.6–20.35); its well through the bridge deck starts where a person on the flight needs the
 * headroom, walled off from the master's cabin and railed in the wheelhouse.
 */
export const FERRY_CREW_STAIR=Object.freeze({
 x:Object.freeze([-2.92,-2.12]),wall:-2.04,outer:-(DW-T),
 door:Object.freeze({z:Z(17.6),x:Object.freeze([-2.88,-2.16]),h:2.1}),   // 2.1 m: the first riser is just behind it
 foot:Z(17.75),head:Z(20.35),risers:13,
 /** The well opens 0.2 m forward of the foot (a person on the flight passes under its aft edge with 0.16 m to spare) and
  * ends a going short of the head: the bridge deck's edge is the last step. */
 well:Object.freeze([Z(17.95),Z(20.15)]),
});
const CS=FERRY_CREW_STAIR;
/** The wing doors in the wheelhouse's sides: to port as built; to starboard 0.85 m further forward, at the crew stair's head. */
const WING_DOOR=Object.freeze({p:Object.freeze([Z(19.6),Z(20.4)]),s:Object.freeze([Z(20.45),Z(21.25)])});
/**
 * The saloon's seats (the owner, 3 November 2026: "the accommodation needs to be more cosy and comfortable, it should be
 * fun to sit there and do nothing"). Reclining moquette seats, 0.7 m a place with wooden arms and white head covers,
 * five rows at 0.88 m facing the bow windows, a 0.9 m aisle; two a row to starboard beside the crew stair's trunk. The
 * seven rows of three at 0.85 m before them did not fit (the front row stood 0.25 m out through the forward wall).
 */
export const FERRY_SALOON=Object.freeze({
 aisle:.45,rows:Object.freeze([17.72,18.6,19.48,20.36,21.24].map(Z)),depth:.6,seat:.45,back:1.05,
 /** The seats a row on side s (+1 port, −1 starboard): [x from, x to, places]. */
 row(k,s){const z0=this.rows[k],beside=s<0&&z0+this.depth<=CS.head+1e-6&&z0>=CS.door.z-1e-6;
  return beside?[this.aisle,-CS.wall-.06,2]:[this.aisle,DW-T-.06,4];},
});
const SAL_ROWS=FERRY_SALOON;
/** The seats aboard that anyone may take, in her frame: `position` on the floor under the seat, `surface` its height. */
export const FERRY_PASSENGER_SEATS=Object.freeze([
 (()=>{const z0=SAL_ROWS.rows[4],w=(DW-T-.06-SAL_ROWS.aisle)/4;return {id:'bow-windows',label:'Sit by the bow windows',title:'The bow windows',
  text:'The front row. Over the ledge and through the six windows the car deck runs out to the ramp, and past it the sea comes at her and folds away.',
  anchor:[SAL_ROWS.aisle+w/2,PASS+.9,z0+.3],position:[SAL_ROWS.aisle+w/2,PASS,z0+.33],stand:[0,PASS,z0+.3],surface:.45,yaw:Math.PI,eyeY:1.15};})(),
 (()=>{const z0=SAL_ROWS.rows[1],w=(DW-T-.06-SAL_ROWS.aisle)/4;return {id:'window-seat',label:'Take the window seat',title:'The window seat',
  text:'Port side, by the curtains. The islands go by at the speed of a bicycle.',
  anchor:[SAL_ROWS.aisle+.25,PASS+.9,z0+.3],position:[DW-T-.06-w/2,PASS,z0+.33],stand:[0,PASS,z0+.3],surface:.45,yaw:Math.PI,eyeY:1.15};})(),
 {id:'carpet-cushion',label:'Sit on a bench',title:'The passenger benches',
  text:'A plain bench on the raised floor. Shoes off on the shelf if you like. The engines hum, and the crossing is twenty-two minutes.',
  anchor:[2.0,PASS+F.carpet+.75,Z(14.4)],position:[2.0,PASS+F.carpet,Z(14.4)],stand:[.5,PASS+F.carpet,Z(14.4)],surface:.38,yaw:-Math.PI/2,eyeY:1.15},
].map(p=>Object.freeze({...p,anchor:Object.freeze(p.anchor),position:Object.freeze(p.position),stand:Object.freeze(p.stand)})));

const sorted=(a,b)=>a<b?[a,b]:[b,a];
/**
 * Everything, built once: `boxes` ({a, b, hex, cls, solid, camera}), `bars` ({a, b, r, hex}), `glass` ({size, pos, rot})
 * and `floors` ({id, x, z, y | [y at z0, y at z1], inside(x, z, r)}). `solid` boxes stop people; `camera` boxes stop the lens.
 * A floor holds a person whose centre is over it and `inside` agrees; where one floor's `inside` keeps a person's
 * radius off a wall, the next floor (a doorway's sill) reaches back that far, so a doorway is never a gap.
 */
export const FERRY_INTERIOR=(()=>{
 const boxes=[],bars=[],glass=[],floors=[],cyls=[],plates=[],pipes=[];
 let routeAudit=null,routeAuditCache=null;
 // Under globalThis.__KIT_TRACE__ each box remembers the line that made it (tools/z-fighting.mjs names it in a finding).
 const whereFrom=()=>{for(const l of (new Error().stack||'').split('\n').slice(2)){if(/at (?:Object\.)?(box|deco|put|wall|whereFrom) /.test(l))continue;const m=l.match(/([\w.-]+\.js):(\d+)/);if(m)return m[1]+':'+m[2];}return null;};
 const box=(a,b,hex,o={})=>{boxes.push(Object.freeze({a:Object.freeze(a),b:Object.freeze(b),hex,cls:o.cls||'paint',solid:o.solid!==false,camera:o.camera??o.solid!==false,draw:o.draw!==false,name:o.name||null,...(globalThis.__KIT_TRACE__?{where:whereFrom()}:{})}));};
 const deco=(a,b,hex,o={})=>box(a,b,hex,{...o,solid:false,camera:false});
 const bar=(a,b,r,hex,cls='metal')=>bars.push(Object.freeze({a:Object.freeze(a),b:Object.freeze(b),r,hex,cls}));
 const pane=(size,pos,rot=[0,0,0])=>glass.push(Object.freeze({size:Object.freeze(size),pos:Object.freeze(pos),rot:Object.freeze(rot)}));
 const floor=(id,x,z,y,inside=null)=>floors.push(Object.freeze({id,x:Object.freeze(x),z:Object.freeze(z),y,inside}));
 /** A cylinder (radius top, radius bottom, height) at pos, turned by rot (Euler YXZ): scenery only, never a solid. */
 const cyl=(rt,rb,h,pos,hex,o={})=>cyls.push(Object.freeze({rt,rb,h,pos:Object.freeze(pos),rot:Object.freeze(o.rot||[0,0,0]),hex,cls:o.cls||'metal',seg:o.seg||14,name:o.name||null}));
 /**
  * A maker's plate or a label: lines of text on a plate w × h metres at pos, facing +z turned by rotY (and tipped by
  * rotX: −π/2 lies flat, face up). `kind` 'dial' is a round gauge (lines: [label, unit], value 0–1, red: [from, to]),
  * 'chequer' and 'grating' repeating floor patterns, 'alarms' the console's matrix (ferry-model.js plateMesh). `live` names the
  * plant reading the plate shows (ferry-plant-controls.js liveValue): the model redraws it as the plant changes (6r-2).
  */
 const plate=(lines,w,h,pos,rotY,o={})=>plates.push(Object.freeze({lines:Object.freeze(lines),w,h,pos:Object.freeze(pos),rotY,rotX:o.rotX||0,kind:o.kind||'text',value:o.value??null,red:o.red?Object.freeze(o.red):null,here:o.here?Object.freeze(o.here):null,bg:o.bg||'#dcd8c8',fg:o.fg||'#1d2326',name:o.name||'maker’s plate',live:o.live||null,range:o.range?Object.freeze(o.range):null}));
 /** The fire control and safety plan posted on a wall (ferry-safety-plan.js), 0.9 × 0.54 m, marked YOU ARE HERE at `here` {deck, z, x} in the yard's frame. */
 const safetyPlan=(pos,rotY,here,where)=>plate([],.9,.54,pos,rotY,{kind:'safety-plan',here,name:'safety plan: '+where});
 /** A round gauge d metres across at pos, facing +z turned by rotY: the needle at value 0–1, a red zone from `red`. */
 /** `range` [lo, hi] numbers the scale and writes the reading under the pivot (the creator, 2026-10-13: the console "needs to be easier to read and more detailed"). */
 const dial=(label,unit,value,d,pos,rotY,o={})=>plate([label,unit],d,d,pos,rotY,{...o,kind:'dial',value,bg:o.bg||'#f1ede2',name:o.name||'gauge: '+label});
 /** Floor plates (chequer) or a grating over the bilge, flat on the floor at y, over x0–x1 × z0–z1. */
 const floorPlate=(kind,x0,x1,z0,z1,y,o={})=>plate([],Math.abs(x1-x0),Math.abs(z1-z0),[(x0+x1)/2,y,(z0+z1)/2],0,{...o,kind,rotX:-Math.PI/2,bg:o.bg||(kind==='chequer'?'#8f969a':'#7a2a1e'),fg:o.fg||(kind==='chequer'?'#a6adb0':'#3b4144'),name:o.name||(kind==='chequer'?'floor plates':'grating')});
 /**
  * A wall along x (at z between t0 and t1) or along z (at x between t0 and t1), from s0 to s1 and y0 to y1, with
  * openings {s0, s1, y0, y1, glass}: doors and windows are holes in it, glazed where they are windows.
  */
 function wall(along,s0,s1,t0,t1,y0,y1,openings0=[],hex=WHITE){
  // Each opening is cut 4 mm larger than drawn all round: the window frames and door jambs are fitted to its drawn edges,
  // so the reveals lie hidden inside them instead of in their faces' planes, where they fought (the owner, 3 November
  // 2026: "there is lots of z-fighting in the whole ferry"). The glass keeps the drawn size, inside its frame.
  const R=.004,openings=openings0.map(o=>({...o,s0:o.s0-R,s1:o.s1+R,y0:o.y0>y0+1e-6?o.y0-R:o.y0,y1:o.y1<y1-1e-6?o.y1+R:o.y1,drawn:o}));
  const cuts=[...new Set([s0,s1,...openings.flatMap(o=>[o.s0,o.s1])])].filter(c=>c>=s0&&c<=s1).sort((a,b)=>a-b);
  const put=(a0,a1,b0,b1)=>{if(a1-a0<1e-4||b1-b0<1e-4)return;along==='x'?box([a0,b0,t0],[a1,b1,t1],hex):box([t0,b0,a0],[t1,b1,a1],hex);};
  for(let i=0;i<cuts.length-1;i++){
   const c0=cuts[i],c1=cuts[i+1],o=openings.find(o=>o.s0<=c0+1e-6&&o.s1>=c1-1e-6);
   if(!o){put(c0,c1,y0,y1);continue;}
   put(c0,c1,y0,o.y0);put(c0,c1,o.y1,y1);
   if(o.glass){const d=o.drawn,a0=Math.max(c0,d.s0),a1=Math.min(c1,d.s1),m=(a0+a1)/2,t=(t0+t1)/2,h=d.y1-d.y0;pane(along==='x'?[a1-a0,h,.03]:[.03,h,a1-a0],along==='x'?[m,d.y0+h/2,t]:[t,d.y0+h/2,m]);}
  }
 }
 const win=(c,w=.92,y=PASS+1.55,h=.75)=>({s0:c-w/2,s1:c+w/2,y0:y-h/2,y1:y+h/2,glass:true});
 /** A doorway `w` wide centred at `c`, from below the floor at `y` to `h` over it. */
 const doorAt=(c,w,y,h=2)=>({s0:c-w/2,s1:c+w/2,y0:y-1,y1:y+h});
 /** x0 to x1 from the centreline on side `s` (+1 port, −1 starboard), smaller first. */
 const S2=(s,x0,x1)=>sorted(s*x0,s*x1);

 // ---- The casings, car deck to the passenger deck's underside: stair P and S hollow in them, the gangway passage
 // through P. The rest is solid (uptakes, the engine-room entrances, stores, the changing room).
 for(const s of [1,-1]){
  const X=sorted(s*CAS_IN,s*CAS_OUT),pieces=s>0?[[CAS0,ER.entrance[0]],[GATE_TO,CAS1]]:[[CAS0,S.head],[S.wellFore,CAS1]];
  for(const [z0,z1] of pieces)box([X[0],CAR,z0],[X[1],CAS_TOP,z1],WHITE,{name:'casing'});
  // The stairwell's walls: inboard, with the stair's door; outboard against her side.
  wall('z',S.head,s>0?GATE_TO:S.wellFore,...sorted(s*CAS_IN,s*(CAS_IN+.06)),CAR,CAS_TOP,[doorAt((S.door[0]+S.door[1])/2,S.door[1]-S.door[0],CAR)]);
  box([Math.min(s*(CAS_OUT-.06),s*CAS_OUT),CAR,S.head],[Math.max(s*(CAS_OUT-.06),s*CAS_OUT),CAS_TOP,s>0?GATE_FROM:S.wellFore],WHITE);
  // The door's frame in teal, and its leaf hooked back against the casing's face, aft of it.
  const fx=sorted(s*(CAS_IN-.04),s*(CAS_IN+.02));
  for(const z of S.door)deco([fx[0],CAR-.01,z-.04],[fx[1],CAR+2,z+.04],TEAL);   // 1 cm into the deck, below the walls' feet
  deco([fx[0],CAR+1.96,S.door[0]],[fx[1],CAR+2.04,S.door[1]],TEAL);
  box([Math.min(s*(CAS_IN-.06),s*(CAS_IN-.02)),CAR+.02,S.door[0]-.9],[Math.max(s*(CAS_IN-.06),s*(CAS_IN-.02)),CAR+1.98,S.door[0]-.05],DOOR,{name:'stair door leaf'});
  // A sign over the door: 客室 / Passenger saloon, up.
  deco([Math.min(s*(CAS_IN-.03),s*(CAS_IN-.01)),CAR+2.12,S.door[0]+.05],[Math.max(s*(CAS_IN-.03),s*(CAS_IN-.01)),CAR+2.42,S.door[1]-.05],0x24585c);
  // The flight: treads and risers, its stringers, and a hand rail on each side.
  const dz=(S.foot-S.head)/S.risers,dy=(PASS-CAR)/S.risers,[x0,x1]=sorted(s*S.x[0],s*S.x[1]);
  for(let i=0;i<S.risers;i++){const y=CAR+(i+1)*dy,z=S.foot-(i+1)*dz;deco([x0+.02,y-.04,z],[x1-.02,y,z+dz+.02],0x9aa3a2,{cls:'metal'});deco([x0+.02,y-dy,z+dz-.02],[x1-.02,y-.04,z+dz],0x7d8586,{cls:'metal'});}
  // (The outboard rail 0.12 m in from the flight's edge: at its head it ran up inside the lobby's side wall.)
  // (The stringers run 8.5 cm under the line of the treads' inner corners, so they carry the treads and never show
  // through them: on that line each step had a dark stub of stringer standing up at its back.)
  const sd=.085,sk=(PASS-CAR)/(S.foot-S.head);
  for(const [xs,xr] of [[s*(S.x[0]+.03),s*(S.x[0]+.03)],[s*(S.x[1]-.03),s*(S.x[1]-.12)]]){bar([xs,CAR,S.foot-sd/sk],[xs,PASS-sd,S.head],.05,DARK);bar([xr,CAR+.9,S.foot+.1],[xr,PASS+.9,S.head],.022,YELLOW,'paint');}
  // The walking line runs half a riser over the line of the nosings, so the feet are never more than half a riser
  // off a tread.
  floor('stair-'+(s>0?'p':'s'),[x0,x1],[S.head,S.foot],[PASS+dy/2,CAR+dy/2],(x,z,r)=>Math.abs(x-(x0+x1)/2)<=(x1-x0)/2-r+.02);
 }
 // The gangway passage's and the foyer's deckhead, 2.2 m up, from forward of the stair's door to the passage's forward
 // wall (casing P's block forward of it is that wall; the stairwell's walls are the foyer's; over the stair's foot the
 // well is open to the casing's top).
 box([CAS_IN,CAR+2.2,S.wellFore],[CAS_OUT,CAS_TOP,GATE_TO],WHITE,{name:'passage deckhead'});

 // ---- The lower lobby (batch 6f): the car deck's level aft of the lanes, z 2.5–12.6 between the casings, under a
 // 2.5 m deckhead hung from the passenger deck. Its aft bulkhead (full breadth, a crew door to the mooring station),
 // its forward bulkhead (between the casings, two sliding fire doors onto the lanes, their leaves parked outboard),
 // the drivers' benches along the casings between the doors, the bicycle rack and the baggage shelf aft, the drink
 // machine and the safety plan forward, lifejacket lockers. The stairs' doors and the engine room's door open into it.
 {const LL0=Z(2.5),LL1=Z(12.6),TOP=CAR+2.5;
  wall('x',-(HB-.1),HB-.1,LL0-.04,LL0+.04,CAR,PASS-.02,[doorAt(0,1.0,CAR)]);
  for(const x of [-.54,.54])deco([x-.04,CAR-.01,LL0-.06],[x+.04,CAR+2.02,LL0+.06],TEAL);
  box([.56,CAR+.02,LL0+.04],[1.5,CAR+1.98,LL0+.08],DOOR,{name:'mooring door leaf'});
  wall('x',-CAS_IN,CAS_IN,LL1-.04,LL1+.04,CAR,PASS-.02,[doorAt(1.0,1.1,CAR),doorAt(-1.0,1.1,CAR)]);
  for(const s of [1,-1]){
   for(const x of [s*.41,s*1.59])deco([x-.04,CAR-.01,LL1-.06],[x+.04,CAR+2.06,LL1+.06],TEAL);
   deco([Math.min(s*.41,s*1.59),CAR+2.02,LL1-.06],[Math.max(s*.41,s*1.59),CAR+2.08,LL1+.06],TEAL);
   // The sliding leaf, parked outboard of its opening on the lobby side, on its track.
   box([Math.min(s*1.56,s*2.74),CAR+.03,LL1-.14],[Math.max(s*1.56,s*2.74),CAR+2.0,LL1-.08],DOOR,{name:'fire door leaf'});
   deco([Math.min(s*.4,s*2.73),CAR+2.1,LL1-.16],[Math.max(s*.4,s*2.73),CAR+2.16,LL1-.06],STEEL);
   // A bench along each casing between its doors (port: aft of the engine room's door and forward of it; starboard:
   // aft of the escape door and forward of the store's).
   for(const [z0,z1] of s>0?(FERRY_H1_ENABLED?FERRY_H1.portLobbyBenches.map(p=>p.map(Z)):[[Z(3.2),Z(6.0)],[Z(7.7),Z(11.0)]]):[[Z(3.2),Z(6.0)],[Z(9.2),Z(11.0)]]){
    box([Math.min(s*(CAS_IN-.5),s*(CAS_IN-.06)),CAR,z0],[Math.max(s*(CAS_IN-.5),s*(CAS_IN-.06)),CAR+.45,z1],TEAK,{name:'drivers’ bench'});
    deco([Math.min(s*(CAS_IN-.14),s*(CAS_IN-.06)),CAR+.45,z0],[Math.max(s*(CAS_IN-.14),s*(CAS_IN-.06)),CAR+.95,z1],TEAK);
    for(const z of [z0+.1,z1-.1])deco([Math.min(s*(CAS_IN-.46),s*(CAS_IN-.1)),CAR-.01,z-.03],[Math.max(s*(CAS_IN-.46),s*(CAS_IN-.1)),CAR+.42,z+.03],STEEL);}
  }
  // The deckhead, hung 2.5 m up, its light panels; the floor's vinyl.
  box([-CAS_IN,TOP,LL0],[CAS_IN,TOP+.2,LL1],0xd8d6cc,{solid:false,camera:true,name:'lower lobby deckhead'});
  for(const z of [Z(4),Z(7),Z(10)])for(const x of [-1.3,1.3])deco([x-.35,TOP-.03,z-.2],[x+.35,TOP,z+.2],0xf6f1e2);
  deco([-CAS_IN,CAR+.003,LL0+.06],[CAS_IN,CAR+.008,LL1-.06],VINYL);
  // The bicycle rack at the aft bulkhead, port of the crew door: two islanders' bicycles ride free.
  box([1.6,CAR,LL0+.1],[2.55,CAR+.05,LL0+.4],STEEL,{camera:false,name:'bicycle rack'});
  for(const x of [1.85,2.3]){deco([x-.03,CAR+.05,LL0+.12],[x+.03,CAR+.95,LL0+.18],STEEL);deco([x-.2,CAR+.3,LL0+.1],[x+.2,CAR+.34,LL0+1.7],0x3a4a6a);
   for(const z of [LL0+.4,LL0+1.4])bar([x,CAR+.3,z],[x,CAR+.3,z+.02],.3,DARK);}
  // The baggage shelf at the aft bulkhead, starboard, and the lifejacket lockers over it.
  box([-2.5,CAR,LL0+.1],[-.7,CAR+.9,LL0+.5],0x8a7356,{name:'baggage shelf'});deco([-2.5,CAR+1.4,LL0+.1],[-.7,CAR+2.0,LL0+.4],ORANGE);
  deco([-2.4,CAR+1.6,LL0+.4],[-.8,CAR+1.8,LL0+.41],0xf6f1e2);
  // The drink machine and the safety plan on the forward bulkhead, between the fire doors.
  box([-.25,CAR,LL1-.75],[.3,CAR+1.8,LL1-.08],RED,{name:'drink machine'});deco([-.2,CAR+.9,LL1-.77],[.25,CAR+1.5,LL1-.75],0xdfe8ee);
  safetyPlan([0,CAR+2.12,LL1-.085],Math.PI,{deck:'car',z:12.3,x:0},'lower lobby');
  // Lights in the way down: the engine room's sign is lit from the lobby's deckhead too.
  deco([CAS_IN-.5,TOP-.03,Z(6.85)-.2],[CAS_IN-.1,TOP,Z(6.85)+.2],0xf6f1e2);
 }
 // ---- The passenger deck: its slab over the car deck, cut open over the two stairs.
 {const y0=PASS-.25,PD0=-HALF,PD1=DH1,O=S.opening,xin=CAS_IN,xo=HB-.02;
  const slab=(x0,x1,z0,z1)=>{box([x0,y0,z0],[x1,PASS,z1],WHITE,{solid:false,camera:true,name:'passenger deck'});deco([x0+.04,y0-.005,z0+.03],[x1-.04,y0,z1-.03],0xc9c7bd);};
  slab(-xin,xin,PD0,PD1);
  for(const s of [1,-1]){const X=sorted(s*xin,s*xo);slab(X[0],X[1],PD0,O[0]);slab(X[0],X[1],O[1],PD1);}
  // The open deck's planking colour, and the walkways'.
  deco([-(HB-.1),PASS,PD0+.05],[HB-.1,PASS+.005,DH0],DECKGREEN);
  for(const s of [1,-1]){const X=sorted(s*DW,s*(HB-.1));deco([X[0],PASS,LB1],[X[1],PASS+.005,PD1-.05],DECKGREEN);}
 }

 // ---- The passenger deckhouse: lobby (full breadth), toilets, carpet room, saloon.
 const top=CEIL;
 // Aft wall: the lobby's double door onto the open deck in the middle, a window either side.
 wall('x',-LW,LW,DH0-T/2,DH0+T/2,PASS,top,[{s0:-.6,s1:.6,y0:PASS-1,y1:PASS+2},win(-2.4,.85),win(2.4,.85)]);
 for(const s of [1,-1]){
  const X=sorted(s*(LW-T),s*LW),XH=sorted(s*(DW-T),s*DW);
  // The lobby's sides at her sides, a window over each stair; the step in to the house's sides at z 9.5.
  wall('z',DH0,LB1,...X,PASS,top,[win(Z(6.85)),win(Z(8.7))]);
  wall('x',...sorted(s*DW,s*LW),LB1-T/2,LB1+T/2,PASS,top);
  // The house's sides, windows all along, the saloon's side door onto the walkway.
  const wins=[];for(let z=LB1+.7;z<DH1-.5;z+=1.15){if(Math.abs(z-F.sideDoor)<.95||(z>TB1-.1&&z<TB1+.1))continue;wins.push(win(z));}
  wall('z',LB1,DH1,...XH,PASS,top,[{s0:F.sideDoor-.42,s1:F.sideDoor+.42,y0:PASS-1,y1:PASS+2},...wins]);
  // The side door's leaf, hooked back against the house aft of it, outside.
  box([Math.min(s*DW,s*(DW+.04)),PASS+.02,F.sideDoor-.42-.86],[Math.max(s*DW,s*(DW+.04)),PASS+1.96,F.sideDoor-.44],DOOR,{name:'saloon side door'});
 }
 // The forward wall over the car deck: six windows looking over the bow.
 wall('x',-DW,DW,DH1-T,DH1,PASS,top,[...[0,1,2,3,4,5].map(i=>win(-2.85+i*1.14,.95,PASS+1.5,.85))]);
 // The deckhead: the bridge deck's underside over the house, and its lights.
 box([-(LW+.05),top,DH0-.05],[LW+.05,BRIDGE,LB1],WHITE,{solid:false,camera:true,name:'deckhouse top'});
 // (Cut round the crew stair's well, FERRY_CREW_STAIR.)
 for(const [a,b] of [[[-(DW+.05),top,LB1],[DW+.05,BRIDGE,CS.well[0]]],[[-(DW+.05),top,CS.well[0]],[CS.x[0],BRIDGE,CS.well[1]]],[[CS.x[1],top,CS.well[0]],[DW+.05,BRIDGE,CS.well[1]]],[[-(DW+.05),top,CS.well[1]],[DW+.05,BRIDGE,DH1+.05]]])
  box(a,b,WHITE,{solid:false,camera:true,name:'deckhouse top'});
 for(const [x,z] of [[0,Z(7.7)],[-2.2,Z(7.7)],[2.2,Z(7.7)],[0,Z(10.5)],[-1.8,Z(13.2)],[1.8,Z(13.2)],[-1.8,Z(15.2)],[1.8,Z(15.2)],[-1.2,Z(18.6)],[1.8,Z(18.6)],[-1.8,Z(21.2)],[1.8,Z(21.2)]])deco([x-.5,top-.04,z-.12],[x+.5,top,z+.12],0xf6f1e2);

 // The lobby: vinyl floor; the stair wells' rails; the purser's window (starboard) and the vending corner (port)
 // against the toilets' aft faces; a bench either side of the aft door; the timetable and fares on the aft wall.
 deco([-(LW-T),PASS+.003,DH0+T/2],[LW-T,PASS+.008,LB1-T/2],VINYL);
 for(const s of [1,-1]){
  const xr=s*(CAS_IN-.02);bar([xr,PASS,S.opening[0]],[xr,PASS+1.05,S.opening[0]],.025,WHITE,'paint');
  for(const h of [.5,1.05])bar([xr,PASS+h,S.opening[0]],[xr,PASS+h,LB1-T/2],.025,WHITE,'paint');
  box([Math.min(xr-.03,xr+.03),PASS,S.opening[0]],[Math.max(xr-.03,xr+.03),PASS+1.08,LB1-T/2],WHITE,{camera:false,name:'stair well rail'});
  deco([Math.min(xr-.03,xr+.03),PASS+.02,S.opening[0]],[Math.max(xr-.03,xr+.03),PASS+.06,LB1-T/2],WHITE);
  // A bench along the aft wall.
  const bx=sorted(s*.95,s*2.75);box([bx[0],PASS,DH0+T/2],[bx[1],PASS+.45,DH0+.5],TEAK,{name:'lobby bench'});deco([bx[0],PASS+.45,DH0+T/2],[bx[1],PASS+.95,DH0+.12],TEAK);
 }
 // Purser's window: a counter with a glazed hatch and its sign.
 // (The counter and the drink machines stand inboard of stair S's and P's rails: they stood 0.3 m out over the wells.)
 box([-2.66,PASS,LB1-.55],[-1.95,PASS+1.05,LB1-T/2],0x8a7356,{name:'purser counter'});deco([-2.68,PASS+1.05,LB1-.6],[-1.93,PASS+1.09,LB1-T/2],0xb89a6e);
 pane([.62,.8,.02],[-2.305,PASS+1.55,LB1-T/2-.02]);deco([-2.66,PASS+2.0,LB1-T/2-.03],[-1.95,PASS+2.25,LB1-T/2],0x24585c);
 // Vending corner: two drink machines and the hot-water dispenser for cup noodles.
 box([1.8,PASS,LB1-.75],[2.21,PASS+1.8,LB1-T/2],RED,{name:'drink machine'});box([2.25,PASS,LB1-.75],[2.66,PASS+1.8,LB1-T/2],0x2f5e9a,{name:'drink machine'});
 for(const x of [2.005,2.455]){deco([x-.16,PASS+.9,LB1-.77],[x+.16,PASS+1.5,LB1-.75],0xdfe8ee);deco([x-.13,PASS+.25,LB1-.77],[x+.13,PASS+.4,LB1-.75],DARK);}
 deco([-1.5,PASS+1.3,DH0+T/2],[1.5,PASS+1.95,DH0+T/2+.03],0xf4f0e2);deco([-1.45,PASS+1.88,DH0+T/2+.03],[1.45,PASS+1.95,DH0+T/2+.04],TEAL);
 floor('lobby',[-(LW-T/2),LW-T/2],[DH0,LB1],PASS,(x,z,r)=>{
  if(Math.abs(x)>LW-T-r||z<DH0+T/2+r||z>LB1-T/2-r)return false;
  // The stair wells, behind their rails; the flight's head joins the lobby at z 7.4.
  if(Math.abs(x)>CAS_IN-.05-r&&z>S.opening[0]+.03)return false;
  return true;
 });

 // The toilets either side of the corridor: men's to port (a WC, two urinals, a basin), women's to starboard (two
 // WCs, a basin), tiled, sea-water flushing; their doors from the lobby, hooked open.
 for(const s of [1,-1]){
  const sd=s>0?'p':'s',X=sorted(s*F.corridor,s*(DW-T)),D=sorted(s*1.05,s*1.8);
  // Walls: on the lobby (with the door), on the corridor, on the carpet room.
  wall('x',X[0],X[1],LB1-T/2,LB1+T/2,PASS,top,[{s0:D[0],s1:D[1],y0:PASS-1,y1:PASS+1.95}],CREAM);
  wall('z',LB1,TB1,...sorted(s*F.corridor,s*(F.corridor+T)),PASS,top,[],CREAM);
  wall('x',X[0],X[1],TB1-T/2,TB1+T/2,PASS,top,[],CREAM);
  deco([s*1.425-.12,PASS+2.05,LB1-T/2-.03],[s*1.425+.12,PASS+2.29,LB1-T/2],s>0?0x2f5e9a:RED);
  // The door, hooked back flat against the wall inside, outboard of its jamb.
  deco([Math.min(s*1.8,s*2.55),PASS+.02,LB1+T/2],[Math.max(s*1.8,s*2.55),PASS+1.93,LB1+T/2+.04],DOOR);
  deco([X[0],PASS+.003,LB1+T/2],[X[1],PASS+.008,TB1-T/2],0xd9dfe0);
  deco([Math.min(s*(DW-T-.01),s*(DW-T)),PASS,LB1+T/2],[Math.max(s*(DW-T-.01),s*(DW-T)),PASS+1.4,TB1-T/2],0xe6eef0);
  // The basin on the corridor's wall, its mirror over it.
  box([Math.min(s*(F.corridor+T),s*(F.corridor+T+.45)),PASS+.7,Z(10.6)-.25],[Math.max(s*(F.corridor+T),s*(F.corridor+T+.45)),PASS+.85,Z(10.6)+.25],0xf4f4f0,{name:'basin'});
  deco([Math.min(s*(F.corridor+T),s*(F.corridor+T+.02)),PASS+1.2,Z(10.6)-.25],[Math.max(s*(F.corridor+T),s*(F.corridor+T+.02)),PASS+1.75,Z(10.6)+.25],0xbfd6dc);
  // WC cubicles against her side: one (men's), two (women's); their partitions and doors.
  const cub=s>0?[[Z(10.2),TB1-T/2]]:[[LB1+T/2+.05,Z(10.5)],[Z(10.5),TB1-T/2]];
  for(const [z0,z1] of cub){
   const P=sorted(s*2.2,s*(DW-T));
   box([P[0],PASS,z0],[P[1],PASS+2.0,z0+.04],0x9fb5b8,{name:'cubicle partition'});
   box([Math.min(s*2.2,s*2.24),PASS,z0],[Math.max(s*2.2,s*2.24),PASS+2.0,z0+.25],0x9fb5b8,{name:'cubicle partition'});
   box([Math.min(s*2.2,s*2.24),PASS+.15,z0+.3],[Math.max(s*2.2,s*2.24),PASS+1.95,z1-.05],0x7e9fa4,{name:'cubicle door'});
   const w=(z0+z1)/2;box([Math.min(s*(DW-T-.6),s*(DW-T-.15)),PASS,w-.2],[Math.max(s*(DW-T-.6),s*(DW-T-.15)),PASS+.42,w+.2],0xf4f4f0,{name:'WC'});
   box([Math.min(s*(DW-T-.2),s*(DW-T)),PASS+.4,w-.22],[Math.max(s*(DW-T-.2),s*(DW-T)),PASS+.85,w+.22],0xf4f4f0,{name:'cistern'});
  }
  if(s>0)for(const x of [1.2,1.75])box([x-.18,PASS+.45,TB1-T/2-.3],[x+.18,PASS+1.1,TB1-T/2],0xf4f4f0,{name:'urinal'});
  // The floor inside, from the doorway: round the basin and up to the cubicles' doors.
  floor('toilet-'+sd,sorted(s*(F.corridor+T),s*(DW-T)),[LB1-.4,TB1-T/2],PASS,(x,z,r)=>{
   const a=Math.abs(x);if(a<F.corridor+T+r||a>2.2-r)return false;
   if(z<LB1+T/2+r)return Math.abs(a-1.425)<=.375-r+.06;
   if(z>TB1-T/2-r)return false;
   return true;
  });
 }
 deco([-F.corridor,PASS+.003,LB1-T/2],[F.corridor,PASS+.008,TB1+T/2],VINYL);
 floor('corridor',[-F.corridor,F.corridor],[LB1-.5,TB1+.16],PASS,(x,z,r)=>Math.abs(x)<=F.corridor-r+.08);

 // The old carpet room, now plain seating: a platform 0.3 m up, two steps at each end of the middle, the shoe
 // shelves at the aft step, life-jacket lockers along the sides, and a television over the forward door.
 {const P=F.carpet,c0=TB1+T/2,c1=CR1-T/2,st=.15;
  box([-(DW-T),PASS,c0+2*st],[DW-T,PASS+P,c1-2*st],CARPET,{solid:false,camera:false,name:'carpet platform'});
  for(const [z0,z1] of [[c0+st,c0+2*st],[c1-2*st,c1-st]])deco([-F.corridor,PASS,z0],[F.corridor,PASS+P/2,z1],0x8a7356);
  for(const s of [1,-1]){
   const X=sorted(s*(F.corridor+.05),s*(DW-T));
   box([X[0],PASS,c0],[X[1],PASS+P,c0+2*st],0x8a7356,{name:'shoe shelf'});box([X[0],PASS+P,c0],[X[1],PASS+P+.15,c0+.3],0x8a7356,{name:'shoe shelf'});
   const L=sorted(s*(DW-T-.45),s*(DW-T));box([L[0],PASS+P,Z(12.6)],[L[1],PASS+P+1.0,Z(14.4)],ORANGE,{name:'life-jacket locker'});
  }
  box([-.45,top-.55,c1-.4],[.45,top-.05,c1],DARK,{solid:false,camera:true,name:'television'});
  // Simple benches (12 November 2026): a small ferry does not keep a lie-down cabin. Two a side, clear of the
  // aisle, the life-jacket lockers and the reading rack. One place is FERRY_PASSENGER_SEATS' carpet-cushion.
   // Slatted wooden benches, the small-ferry pattern in the Chisum's photograph note E7
   // (nj22az/nj22az.github.io ferry/yard/reference/owner-photographs-2026-11-11.md). The seat stays open between the slats.
   {const y0=PASS+P,bench=(x0,x1,z0,z1)=>{
    box([x0,y0,z0],[x1,y0+.38,z1],TEAK,{name:'passenger bench'});
    for(let i=0;i<4;i++){const z=z0+.08+i*((z1-z0-.2)/3);deco([x0+.04,y0+.384,z],[x1-.04,y0+.42,z+.04],0x6f5a40);}
    deco([x0,y0+.424,z1-.08],[x1,y0+.84,z1],TEAK);
   };
   bench(1.55,2.45,Z(12.4),Z(13.5));bench(1.55,2.45,Z(14.15),Z(15.35));
   bench(-2.45,-1.55,Z(12.4),Z(13.5));bench(-2.45,-1.55,Z(14.15),Z(15.55));}
  // The reading rack against the forward partition, to port of the doorway, facing the cushions from the platform's
  // edge: the town paper (printed at Front-Row) and manga and paperbacks from Sakura, which sells the island's books.
  // Read them aboard, leave them aboard.
  {const z1=c1,z0=z1-.26,y0=PASS;box([1.0,y0,z0],[2.1,y0+P+1.0,z1],TEAK,{name:'reading rack'});
   const spines=[0xc94f3d,0x3f6fa0,0xe0b93a,0x4f8f5f,0xf0ece0,0x8a4f8f,0xd9822b];
   // Three shelves inside the rack's 1.0 m over the carpet, the books standing on them.
   for(const [k,y] of [[0,y0+P+.12],[1,y0+P+.42],[2,y0+P+.72]]){deco([1.02,y-.02,z0-.01],[2.08,y,z0],0x6f5a40);
    for(let i=0;i<9;i++)deco([1.06+i*.112,y,z0-.012],[1.06+i*.112+.085,y+.22-.04*(i%3===k?1:0),z0+.005],spines[(i+k*3)%spines.length]);}
   plate(['ご自由にどうぞ','PLEASE READ'],.5,.13,[1.55,y0+P+1.12,z1-.005],Math.PI,{name:'reading rack sign',bg:'#24585c',fg:'#f4f1e8'});}
  floor('carpet-step-aft',[-F.corridor,F.corridor],[c0+st,c0+2*st],PASS+P/2,(x,z,r)=>Math.abs(x)<=F.corridor-r+.08);
  floor('carpet-step-fore',[-F.corridor,F.corridor],[c1-2*st,c1-st],PASS+P/2,(x,z,r)=>Math.abs(x)<=F.corridor-r+.08);
  floor('carpet-room',[-(DW-T),DW-T],[c0+2*st,c1-2*st],PASS+P,(x,z,r)=>Math.abs(x)<=DW-T-r&&(Math.abs(x)<=F.corridor+.05||z>c0+2*st+r-.05)&&(Math.abs(x)<=F.corridor+.05||z<c1-2*st-r+.05));
  // The floor at the deck's level in the doorways, between the toilets' faces and the first step, and the last step and the saloon.
  floor('carpet-door-aft',[-F.corridor,F.corridor],[TB1-.1,c0+st+.02],PASS,(x,z,r)=>Math.abs(x)<=F.corridor-r+.08);
  floor('carpet-door-fore',[-F.corridor,F.corridor],[c1-st-.02,CR1+.1],PASS,(x,z,r)=>Math.abs(x)<=F.corridor-r+.08);
 }
 // The partition between the carpet room and the saloon, its doorway in the middle.
 wall('x',-DW+T,DW-T,CR1-T/2,CR1+T/2,PASS,top,[{s0:-F.corridor,s1:F.corridor,y0:PASS-1,y1:PASS+2}],CREAM);

 // The saloon (FERRY_SALOON): a warm rose-brown carpet; five rows of reclining seats in terracotta moquette facing the
 // bow, each place with its cushion, a wooden arm each side and a white head cover; a teak ledge under the six bow
 // windows for a cup and an elbow; curtains tied back at the side windows; muster station A's sign on the forward wall.
 const MOQ=0x9a4f3c,CUSHION=0xad5d47,COVER=0xf2ede0,CURTAIN=0xe9dcc0;
 deco([-(DW-T),PASS+.003,CR1+T/2],[DW-T,PASS+.008,DH1-T],0x7a5548);
 SAL_ROWS.rows.forEach((z0,k)=>{
  for(const s of [1,-1]){const [a,b,n]=SAL_ROWS.row(k,s),X=sorted(s*a,s*b),w=(X[1]-X[0])/n;
   box([X[0],PASS,z0],[X[1],PASS+SAL_ROWS.seat,z0+SAL_ROWS.depth],MOQ,{name:'saloon seats'});
   deco([X[0],PASS+SAL_ROWS.seat,z0],[X[1],PASS+SAL_ROWS.back,z0+.12],MOQ);
   for(let i=0;i<n;i++){const x0=X[0]+i*w,cx=x0+w/2;
    deco([x0+.06,PASS+SAL_ROWS.seat,z0+.13],[x0+w-.06,PASS+SAL_ROWS.seat+.05,z0+SAL_ROWS.depth-.03],CUSHION);
    deco([cx-.21,PASS+.84,z0-.006],[cx+.21,PASS+SAL_ROWS.back+.02,z0+.126],COVER);}
   for(let i=0;i<=n;i++){const xb=Math.min(X[1]-.03,Math.max(X[0]+.03,X[0]+i*w));deco([xb-.03,PASS+SAL_ROWS.seat,z0+.12],[xb+.03,PASS+.64,z0+SAL_ROWS.depth-.02],TEAK);}
  }});
 deco([-.9,PASS+1.95,DH1-T-.02],[.9,PASS+2.25,DH1-T],0x2a7a4a);
 deco([-(DW-T),PASS+.95,DH1-T-.2],[DW-T,PASS+.99,DH1-T],TEAK,{name:'bow window ledge'});
 // Curtains, cream, tied back either side of each side window the seats look through (not those in the stair's trunk).
 for(let z=LB1+.7;z<DH1-.5;z+=1.15){if(z<CR1+.3||Math.abs(z-F.sideDoor)<.95)continue;
  for(const s of [1,-1]){if(s<0&&z>CS.door.z-.5&&z<CS.head+.5)continue;const X=sorted(s*(DW-T-.045),s*(DW-T-.005));
   for(const [c0,c1] of [[z-.58,z-.42],[z+.42,z+.58]]){deco([X[0],PASS+1.12,c0],[X[1],PASS+2.02,c1],CURTAIN);deco([Math.min(s*(DW-T-.055),s*(DW-T-.009)),PASS+1.42,c0-.01],[Math.max(s*(DW-T-.055),s*(DW-T-.009)),PASS+1.47,c1+.01],0xb08a4a);}
   deco([Math.min(s*(DW-T-.07),s*(DW-T-.013)),PASS+1.95,z-.62],[Math.max(s*(DW-T-.07),s*(DW-T-.013)),PASS+2.08,z+.62],CURTAIN);}}
 // A pothos from Sakura in the forward port corner (Sakura has dressed the town's rooms with flowers since Mrs Kinjō retired).
 cyl(.17,.13,.36,[DW-T-.3,PASS+.18,DH1-T-.42],0xb5653a,{cls:'paint',seg:12,name:'plant pot'});
 cyl(.27,.2,.42,[DW-T-.3,PASS+.57,DH1-T-.42],0x4f7f3f,{cls:'paint',seg:9,name:'pothos'});cyl(.16,.22,.22,[DW-T-.38,PASS+.86,DH1-T-.5],0x5f9548,{cls:'paint',seg:8,name:'pothos'});
 floor('saloon',[-(DW-T),DW-T],[CR1-.1,DH1-T],PASS,(x,z,r)=>{
  if(Math.abs(x)>DW-T-r||z>DH1-T-r)return false;
  // The seats: the aisle between them and the cross passage aft of them are the floor.
  if(Math.abs(x)>SAL_ROWS.aisle-r+.08&&z>F.crossFore-r)return false;
  // The partition's doorway.
  if(z<CR1+T/2+r&&Math.abs(x)>F.corridor-r+.08)return false;
  return true;
 });
 // ---- The crew stair (FERRY_CREW_STAIR): its trunk in the saloon's starboard side, the door from the cross passage
 // with its sign, the flight with its stringers and rails, the well through the bridge deck (the master's cabin and the
 // wheelhouse close it above: the bridge deck, below).
 {const [x0,x1]=CS.x,xc=(x0+x1)/2,dz=(CS.head-CS.foot)/CS.risers,dy=(BRIDGE-PASS)/CS.risers,O=CS.outer,D=CS.door;
  wall('z',D.z-.04,CS.head,CS.wall-.08,CS.wall,PASS,top,[],CREAM);
  wall('x',O,CS.wall,D.z-.04,D.z+.04,PASS,top,[doorAt((D.x[0]+D.x[1])/2,D.x[1]-D.x[0],PASS,D.h)],CREAM);
  wall('x',O,CS.wall,CS.head-.08,CS.head,PASS,top,[],CREAM);
  // The doorway: its teal frame, an indigo noren across its head (above anyone's head: 1.92 m), the sign over it. It
  // stands open, as stair P's and S's do; a leaf hooked back would stand in the cross passage to the side door.
  for(const x of D.x)deco([x-.04,PASS,D.z-.06],[x+.04,PASS+D.h,D.z-.04],TEAL);deco([D.x[0]-.04,PASS+D.h,D.z-.06],[D.x[1]+.04,PASS+D.h+.06,D.z-.04],TEAL);
  for(let i=0;i<3;i++){const w=(D.x[1]-D.x[0]-.04)/3,x0=D.x[0]+.02+i*w;deco([x0+.01,PASS+1.93,D.z-.075],[x0+w-.01,PASS+D.h,D.z-.065],0x2c3f6b,{name:'noren'});}
  // On the trunk's face to the saloon, over the seats beside it: a framed chart of the crossing, Minato to Kitano-jima,
  // with her track, for passengers to follow where they are.
  {const x=CS.wall,z0=Z(18.25),z1=Z(19.85),y0=PASS+1.3,y1=PASS+2.02,f=[x,x+.03];
   // (Each layer stands in a plane of its own, 4 mm or more from the next.)
   deco([f[0],y0,z0],[f[1],y1,z1],TEAK,{name:'crossing chart frame'});deco([x+.004,y0+.05,z0+.05],[x+.035,y1-.05,z1-.05],0x7fa9c9,{name:'crossing chart'});
   deco([x+.008,y0+.08,z0+.08],[x+.04,y0+.3,z0+.42],0xe8dcb6);deco([x+.012,y0+.12,z0+.12],[x+.045,y0+.22,z0+.3],0x7f9f5f);   // Minato, its harbour
   deco([x+.008,y1-.32,z1-.5],[x+.04,y1-.09,z1-.09],0xe8dcb6);deco([x+.012,y1-.26,z1-.42],[x+.045,y1-.14,z1-.17],0x7f9f5f);  // Kitano-jima
   for(let k=0;k<6;k++){const t=(k+.5)/6;deco([x+.016,y0+.3+t*(y1-y0-.65)-.012,z0+.45+t*(z1-z0-1.0)-.04],[x+.049,y0+.3+t*(y1-y0-.65)+.012,z0+.45+t*(z1-z0-1.0)+.04],0xf4f2ec);}
   plate(['みなと ⇄ 北野島','MINATO – KITANO-JIMA · 22 MIN'],.62,.09,[x+.045,y0-.07,(z0+z1)/2],Math.PI/2,{name:'crossing chart label',bg:'#f4f1e8',fg:'#24585c'});}
  plate(['乗組員専用','CREW ONLY · 操舵室 WHEELHOUSE'],.66,.17,[(D.x[0]+D.x[1])/2,PASS+D.h+.12,D.z-.045],Math.PI,{name:'crew stair sign',bg:'#24585c',fg:'#f4f1e8'});
  // The flight, as stair P's and S's: treads with their nosings, risers, stringers and a rail each side at 0.9 m.
  // (The last tread is the bridge deck's edge itself; the treads stop short of the stringers' faces.)
  for(let i=0;i<CS.risers;i++){const y=PASS+(i+1)*dy,z=CS.foot+i*dz;if(i<CS.risers-1){deco([x0+.025,y-.04,z],[x1-.025,y,z+dz+.02],0x9aa3a2,{cls:'metal'});deco([x0+.025,y-dy,z-.02],[x1-.025,y-.04,z],0x7d8586,{cls:'metal'});}
   deco([x0+.03,y-.005,z-.025],[x1-.03,y+.003,z+.03],YELLOW);}
  // Stringers under the treads' ends, rails 0.08 m in from the trunk's walls: nothing touches the walls.
  // (8 cm under the line of the treads' inner corners: on it, each step showed a dark stub of stringer at its back.)
  {const sd=.08,sk=(BRIDGE-PASS)/(CS.head-CS.foot);
  for(const [xs,xr] of [[x0+.06,x0+.08],[x1-.06,x1-.08]]){bar([xs,PASS,CS.foot+sd/sk],[xs,BRIDGE-sd,CS.head],.045,DARK);bar([xr,PASS+.9,CS.foot-.1],[xr,BRIDGE+.9,CS.head],.022,YELLOW,'paint');}}
  deco([xc-.2,top-.04,D.z+.3],[xc+.2,top,D.z+.6],0xf6f1e2);
  // Floors: through the door, the flight (half a riser over the nosings, as stair P's), its head joins the wheelhouse.
  floor('crew-stair-door',[D.x[0],D.x[1]],[D.z-.5,CS.foot+.03],PASS,(x,z,r)=>Math.abs(x-(D.x[0]+D.x[1])/2)<=(D.x[1]-D.x[0])/2-r+.06);
  floor('crew-stair',[x0,x1],[CS.foot,CS.head],[PASS+dy/2,BRIDGE+dy/2],(x,z,r)=>Math.abs(x-xc)<=(x1-x0)/2-r+.02);
 }
 // The side doors' sills, from the saloon's cross passage out to the walkways.
 for(const s of [1,-1])floor('side-door-'+(s>0?'p':'s'),sorted(s*(DW-T-.5),s*(DW+.45)),[F.sideDoor-.42,F.sideDoor+.42],PASS,(x,z,r)=>Math.abs(z-F.sideDoor)<=.42-r+.06);

 // Grab rails along the house's sides and the lobby's, at 1.0 m, as every ship's deckhouse carries; the fire-hose boxes on
 // the casings' faces by the car deck's hydrants; the muster-station A sign by the saloon's forward door.
 for(const s of [1,-1]){
  bar([s*(DW+.07),PASS+1.0,LB1+.3],[s*(DW+.07),PASS+1.0,DH1-.3],.018,STEEL);for(let z=LB1+.4;z<DH1-.3;z+=1.5)bar([s*(DW),PASS+1.0,z],[s*(DW+.07),PASS+1.0,z],.016,STEEL);
  bar([s*(LW+.07),PASS+1.0,DH0+.3],[s*(LW+.07),PASS+1.0,LB1-.2],.018,STEEL);for(const z of [DH0+.4,LB1-.3])bar([s*LW,PASS+1.0,z],[s*(LW+.07),PASS+1.0,z],.016,STEEL);
  // (Above the drivers' benches' backs; to port the aft one aft of the engine-room door's leaf, hooked back aft of the
  // door: it stood across the leaf.)
  for(const zy of s>0?[4.0,16.5]:[5,16.5]){const X=sorted(s*(CAS_IN-.22),s*(CAS_IN-.02));box([X[0],CAR+1.0,Z(zy)-.3],[X[1],CAR+1.7,Z(zy)+.3],RED,{camera:false,name:'fire-hose box'});deco([Math.min(s*(CAS_IN-.23),s*(CAS_IN-.22)),CAR+1.1,Z(zy)-.22],[Math.max(s*(CAS_IN-.23),s*(CAS_IN-.22)),CAR+1.6,Z(zy)+.22],0xf4f1e8);}
 }
 // ---- The walkways either side of the house, the rail at her side; the ladder up to the bridge wing at their
 // forward ends; the liferafts in their cradles outboard of the rail.
 for(const s of [1,-1]){
  const X=sorted(s*DW,s*(HB-.08)),L=FERRY_WING_LADDER;
  floor('walkway-'+(s>0?'p':'s'),X,[LB1,L.foot+.02],PASS,(x,z,r)=>Math.abs(x)>=DW+r-.02&&Math.abs(x)<=HB-.1-r+.04&&z>=LB1+T/2+r);
  // The ladder: steep (53°), its stringers and treads, hand rails to the wing.
  const lx=s*L.x,rise=BRIDGE-PASS,run=L.head-L.foot,n=13;
  for(const k of [-.29,.29])bar([lx+k,PASS,L.foot],[lx+k,BRIDGE,L.head],.03,STEEL);
  for(let i=1;i<n;i++){const f=i/n;deco([lx-.28,PASS+rise*f-.03,L.foot+run*f-.08],[lx+.28,PASS+rise*f,L.foot+run*f+.08],STEEL,{cls:'metal'});}
  for(const k of [-.29,.29])bar([lx+k,PASS+.9,L.foot],[lx+k,BRIDGE+.9,L.head],.02,YELLOW,'paint');
  floor('wing-ladder-'+(s>0?'p':'s'),[lx-.29,lx+.29],[L.foot,L.head],[PASS,BRIDGE],(x,z,r)=>Math.abs(x-lx)<=.12);
  for(const zy of [12,14.5]){const lz=Z(zy);bar([s*(HB+.12),PASS+.55,lz-.55],[s*(HB+.12),PASS+.55,lz+.55],.28,WHITE,'paint');
   const X=sorted(s*(HB-.1),s*(HB+.38));for(const dz of [-.4,.4])deco([X[0],PASS+.24,lz+dz-.04],[X[1],PASS+.32,lz+dz+.04],STEEL,{cls:'metal'});}
 }

 // ---- The open deck aft: benches under the awning, the funnels, the liferaft (port), the rescue boat and its davit
 // (starboard), the platform under the bridge deck's aft end and its two ladders.
 {const top=PASS+2.35;
  for(const zy of [1,2.6])for(const x of [-1.6,1.6])box([x-1.05,PASS,Z(zy)-.23],[x+1.05,PASS+.9,Z(zy)+.23],TEAK,{camera:false,solid:true,name:'open-deck bench',draw:false});
  box([3.22,PASS,Z(2.7)-.6],[3.68,PASS+.5,Z(2.7)+.6],TEAK,{camera:false,name:'side bench',draw:false});
  for(const x of [-2.35,2.35])for(const z of [Z(.4),Z(3.4)])box([x-.05,PASS,z-.05],[x+.05,top,z+.05],STEEL,{camera:false,name:'awning post',draw:false});
  box([-2.5,top,Z(.4)-.1],[2.5,top+.04,Z(3.4)+.1],0xe9e4d4,{solid:false,camera:true,name:'awning',draw:false});
  // The funnels are drawn by the model (round); here, the space they take.
  const FZ=Z(4.9);for(const s of [1,-1])box([Math.min(s*2.85,s*3.85),PASS,FZ-1],[Math.max(s*2.85,s*3.85),Y(H.funnelTop),FZ+1],TEAL,{name:'funnel',draw:false});
  box([3.25,PASS,Z(.55)],[3.85,PASS+.85,Z(1.65)],WHITE,{name:'liferaft',draw:false});
  box([-3.8,PASS,Z(.6)],[-2.55,PASS+1.05,Z(4.2)],ORANGE,{name:'rescue boat',draw:false});
  box([-4.0,PASS,Z(.45)-.1],[-3.8,PASS+3.3,Z(.45)+.1],STEEL,{name:'davit',draw:false});
  box([-.05,PASS,-HALF+.1],[.05,PASS+3.4,-HALF+.2],WHITE,{camera:false,name:'flagstaff',draw:false});
  for(const x of [-2.5,2.5])box([x-.07,PASS,PF0+.03],[x+.07,BRIDGE,PF0+.17],WHITE,{camera:false,name:'platform pillar',draw:false});
  box([-2.6,BRIDGE-.12,PF0],[2.6,BRIDGE,DH0],WHITE,{solid:false,camera:true,name:'bridge deck aft platform',draw:false});
  const LX=F.ladderX;
  floor('open-deck',[-(HB-.1),HB-.1],[-HALF+.1,DH0],PASS,(x,z,r)=>{
   if(Math.abs(x)>HB-.12-r||z<-HALF+.16+r||z>DH0-T/2-r&&Math.abs(x)>.6-r+.08)return false;
   // Under the ladders: their feet are where you step on.
   if(Math.abs(Math.abs(x)-LX)<.3+r&&z>PF0-1.4&&z<PF0+.25)return false;
   return true;
  });
  floor('lobby-door',[-.6,.6],[DH0-.5,DH0+.5],PASS,(x,z,r)=>Math.abs(x)<=.6-r+.08);
  for(const s of [1,-1]){const lx=s*LX;floor('platform-ladder-'+(s>0?'p':'s'),[lx-.28,lx+.28],[PF0-1.5,PF0+.02],[PASS,BRIDGE],(x,z,r)=>Math.abs(x-lx)<=.12);}
  floor('bridge-deck-aft',[-2.55,2.55],[PF0,DH0],BRIDGE,(x,z,r)=>{
   if(Math.abs(x)>2.55-r||z>DH0-.05-r)return false;
   if(z<PF0+.08+r&&Math.abs(Math.abs(x)-LX)>.3)return false;
   return true;
  });
 }

 // ---- The bridge deck: the crew's rooms aft (ferry batch 6c, below), the wheelhouse forward, the wings.
 // The house's deckhead (the compass deck's underside), for the lens: it stays in the rooms.
 box([-F.bridgeHalf,F.houseTop,DH0],[F.bridgeHalf,F.houseTop+.2,DH1],WHITE,{solid:false,camera:true,draw:false,name:'bridge house top'});
 for(const s of [1,-1]){
  const X=sorted(s*(BH-T),s*BH),WD=WING_DOOR[s>0?'p':'s'];
  // The wheelhouse's sides: the wing door (open, hooked back forward of it, inside) and two windows; to starboard the
  // door is forward of the crew stair's head and a narrow window lights the stair.
  wall('z',WH0,DH1,...X,BRIDGE,F.houseTop,[{s0:WD[0],s1:WD[1],y0:BRIDGE-1,y1:BRIDGE+1.95},...(s>0?[win(Z(21.1),1.0,BRIDGE+1.4,.85),win(Z(22.2),.9,BRIDGE+1.4,.85)]:[win(Z(19.95),.6,BRIDGE+1.45,.7),win(Z(22.4),.5,BRIDGE+1.4,.85)])]);
  box([Math.min(s*(BH-T-.04),s*(BH-T)),BRIDGE+.02,WD[1]+.05],[Math.max(s*(BH-T-.04),s*(BH-T)),BRIDGE+1.92,WD[1]+.8],DOOR,{name:'wing door'});
  // The wing: dodger at her side, its console, the sidelight's screen.
  {const X=sorted(s*(HB-.1),s*(HB-.04));box([X[0],BRIDGE,WH0],[X[1],BRIDGE+1.1,DH1],WHITE,{name:'dodger',draw:false});}
  box([Math.min(s*(HB-.62),s*(HB-.28)),BRIDGE,DH1-.65],[Math.max(s*(HB-.62),s*(HB-.28)),BRIDGE+1.18,DH1-.35],STEEL,{name:'wing console',draw:false});
  floor('wing-'+(s>0?'p':'s'),sorted(s*(BH-.1),s*(HB-.1)),[WH0-.05,DH1-.04],BRIDGE,(x,z,r)=>{
   const a=Math.abs(x);if(a>HB-.1-r||z>DH1-.06-r)return false;
   // Aft, the wing ends at the ledge and the ladder's head.
   if(z<WH0+r&&Math.abs(a-FERRY_WING_LADDER.x)>.15)return false;
   // Into the wheelhouse only through the door.
   if(a<BH+r&&(z<WD[0]+r-.06||z>WD[1]-r+.06))return false;
   return true;
  });
 }
 // The wheelhouse's aft wall (the crew house's face) and forward wall with five raked windows.
 wall('x',-BH,BH,DH1-T,DH1,BRIDGE,F.houseTop,[...[0,1,2,3,4].map(i=>win(-2.36+i*1.18,1.05,BRIDGE+1.45,.95))]);
 // (The linoleum stops at the crew stair's well.)
 deco([CS.wall,BRIDGE+.007,WH0+T/2],[BH-T,BRIDGE+.012,DH1-T],0x8a6f55);deco([-(BH-T),BRIDGE+.007,CS.well[1]],[CS.wall,BRIDGE+.012,DH1-T],0x8a6f55);
 // Inside: the console under the windows (radar, the engine and thruster levers, VHF, the telephone), the steering
 // stand, the master's chair, the chart table aft to starboard, the door to the crew's corridor (open, aft).
 // Batch 6e: the magnetic compass periscope, the telegraph's lever box, the VHF handset, the radar hood, the window
 // wipers, the clock, barometer and fire-detection panel on the aft bulkhead, the navigation-lights panel, the PA
 // microphone, the binoculars and the log on the sill, the chart-table lamp, the deckhead lights.
 box([-2.75,BRIDGE,DH1-.7],[2.75,BRIDGE+1.0,DH1-T],0x52796f,{name:'wheelhouse console'});
 deco([1.4,BRIDGE+1.0,DH1-.55],[1.9,BRIDGE+1.18,DH1-.25],DARK);
 box([-.25,BRIDGE,DH1-1.5],[.25,BRIDGE+.95,DH1-1.0],0x5c6466,{name:'steering stand'});
 bar([0,BRIDGE+.95,DH1-1.25],[0,F.houseTop-.05,DH1-1.25],.04,0xb08a4a);deco([-.08,BRIDGE+1.5,DH1-1.4],[.08,BRIDGE+1.62,DH1-1.25],0xb08a4a);
 deco([-.12,BRIDGE+.75,DH1-1.52],[.12,BRIDGE+.9,DH1-1.5],0xf0ece0);
 deco([1.3,BRIDGE+1.0,DH1-.5],[1.75,BRIDGE+1.25,DH1-.28],DARK);bar([1.52,BRIDGE+1.25,DH1-.4],[1.52,BRIDGE+1.33,DH1-.4],.045,DARK);bar([1.52,BRIDGE+1.1,DH1-.27],[1.52,BRIDGE+1.2,DH1-.22],.02,DARK);
 bar([2.1,BRIDGE+1.0,DH1-.4],[2.1,BRIDGE+1.28,DH1-.45],.012,STEEL);bar([2.1,BRIDGE+1.28,DH1-.45],[2.1,BRIDGE+1.32,DH1-.45],.035,DARK);
 // Navigation-light enclosure and controls are supplied by ferry-bridge-lantern.js.
 for(const kx of [-2.5,-2.1,-1.7])bar([kx,BRIDGE+1.0,DH1-.2],[kx,BRIDGE+1.0,DH1-.18],.06,0xf0ece0);
 deco([-2.9,BRIDGE+1.0,DH1-T-.12],[2.9,BRIDGE+1.03,DH1-T],0xd8d2c0);
 bar([-2.1,BRIDGE+1.03,DH1-.24],[-1.75,BRIDGE+1.03,DH1-.24],.045,DARK);bar([-2.1,BRIDGE+1.03,DH1-.17],[-1.75,BRIDGE+1.03,DH1-.17],.045,DARK);
 bar([1.4,BRIDGE+1.9,WH0+T/2],[1.4,BRIDGE+1.9,WH0+T/2+.05],.17,0xf4f1e8);bar([1.4,BRIDGE+1.9,WH0+T/2+.05],[1.4,BRIDGE+1.9,WH0+T/2+.06],.14,DARK);
 bar([1.95,BRIDGE+1.9,WH0+T/2],[1.95,BRIDGE+1.9,WH0+T/2+.05],.12,0xb08a4a);
 deco([-1.7,BRIDGE+1.55,WH0+T/2],[-.9,BRIDGE+2.05,WH0+T/2+.06],RED);for(let i=0;i<6;i++)deco([-1.62+i*.12,BRIDGE+1.9,WH0+T/2+.06],[-1.55+i*.12,BRIDGE+1.95,WH0+T/2+.07],0x2aff70);
 deco([2.3,BRIDGE+1.4,WH0+T/2],[2.85,BRIDGE+1.95,WH0+T/2+.02],0xf4f1e8);
 for(const kx of [-1.5,1.5])deco([kx-.35,F.houseTop-.06,WH0+1.6],[kx+.35,F.houseTop,WH0+1.9],0xf6f1e2);
 deco([-.3,F.houseTop-.2,DH1-.4],[.3,F.houseTop,DH1-.105],DARK);
 bar([0,F.houseTop,DH1-.9],[0,BRIDGE+1.9,DH1-.9],.006,0xd9cfa8,'paint');deco([-.03,BRIDGE+1.82,DH1-.93],[.03,BRIDGE+1.9,DH1-.87],TEAK);
 box([.75,BRIDGE,DH1-1.75],[1.25,BRIDGE+1.15,DH1-1.25],0x4a3f36,{name:'master’s chair',draw:false});
 // The chart table on the aft bulkhead under the fire-detection panel, between the crew stair's rail and the corridor's
 // door, clear of both wing doors' ways in (3 November 2026: it stood to starboard in front of the wing door, where the
 // crew stair now arrives).
 box([-1.95,BRIDGE,WH0+T/2],[-1.0,BRIDGE+.95,WH0+.64],TEAK,{name:'chart table'});
 bar([-1.75,BRIDGE+.97,WH0+.3],[-1.75,BRIDGE+1.0,WH0+.3],.03,DARK);
 bar([-1.05,BRIDGE+.95,WH0+.15],[-1.05,BRIDGE+1.35,WH0+.15],.012,STEEL);
 for(let i=0;i<3;i++)deco([-1.9,BRIDGE+.15+i*.25,WH0+.64],[-1.05,BRIDGE+.35+i*.25,WH0+.645],0x6f5a40);deco([-1.9,BRIDGE+.95,WH0+.1],[-1.05,BRIDGE+.96,WH0+.6],0xe8e2cc);
 // The crew stair's well at the wheelhouse's aft starboard corner: a rail along its inboard side, open forward where the
 // flight arrives beside the wing door.
 {const Y=[.5,1.0],E=CS.well[1];box([CS.wall-.06,BRIDGE,WH0+T/2],[CS.wall,BRIDGE+1.0,E],WHITE,{camera:false,draw:false,name:'crew stair rail'});
  for(const h of Y)bar([CS.wall-.03,BRIDGE+h,WH0+T/2],[CS.wall-.03,BRIDGE+h,E],.025,WHITE,'paint');
  for(const z of [WH0+T/2+.03,E-.03])bar([CS.wall-.03,BRIDGE,z],[CS.wall-.03,BRIDGE+1.0,z],.025,WHITE,'paint');}
 // (The door aft to the crew's corridor stands open: the crew house, below.)
 floor('wheelhouse',[-(BH-T),BH-T],[WH0,DH1-T],BRIDGE,(x,z,r)=>Math.abs(x)<=BH-T-r&&z>=WH0+T/2+r&&z<=DH1-T-r&&!(x<CS.wall+r&&z<CS.head-.03));
 floor('wing-door-p',[BH-T-.5,BH+.3],WING_DOOR.p,BRIDGE,(x,z,r)=>z>=WING_DOOR.p[0]+r-.06&&z<=WING_DOOR.p[1]-r+.06);
 floor('wing-door-s',[-(BH+.3),-(BH-T-.5)],WING_DOOR.s,BRIDGE,(x,z,r)=>z>=WING_DOOR.s[0]+r-.06&&z<=WING_DOOR.s[1]-r+.06);


 // ---- The crew house on the bridge deck (shipyard z 6–19.5, 6 m wide): aft, the emergency-generator room (port)
 // and the CO₂ room (starboard), each opening only aft onto the bridge deck's platform; between them the crew's own
 // door from the platform (they come up the open deck's ladders) into the corridor down the middle to the wheelhouse.
 // To port the old cabins are one lounge, open from a single doorway (12 November 2026). To starboard: a sitting
 // alcove, the WC, and the pantry opening into the skipper's corner. (The general arrangement had a crew stair down
 // to the lobby; there was no room for one there that a passenger would not walk into. Since 3 November 2026 the crew
 // stair comes up from the saloon, behind its crew-only door, into the wheelhouse: FERRY_CREW_STAIR. The platform's
 // ladders and the wing ladders stay.)
 {const HT=F.houseTop,ceil=HT-.08,CW=.45;
  const rooms=[
   // [side, from, to, id]. Port is one lounge; starboard keeps the WC as its own room.
   [1,Z(9),Z(11.5),'crew-cabin'],[-1,Z(9),Z(11.5),'mate-cabin'],
   [1,Z(11.5),Z(14),'deckhand-cabin'],[-1,Z(11.5),Z(14),'crew-wc'],
   [1,Z(14),Z(16.5),'mess'],[-1,Z(14),Z(16.5),'galley'],
   [1,Z(16.5),WH0,'chief-cabin'],[-1,Z(16.5),WH0,'master-cabin'],
  ];
  const doorZ=(a,b)=>a+.55;
  // A bulkhead stays only around the WC. Everywhere else the old cabin walls are gone.
  const bulkhead=(s,z)=>s<0&&(Math.abs(z-Z(11.5))<1e-4||Math.abs(z-Z(14))<1e-4);
  const joinedAft=(s,z0)=>s>0?z0>Z(9)+.01:Math.abs(z0-Z(16.5))<1e-4;
  const joinedFore=(s,z1)=>s>0?z1<WH0-.01:Math.abs(z1-Z(16.5))<1e-4;
  // The house's outer walls: aft (the two rooms' doors), the sides with a square port in each room.
  wall('x',-BH,BH,DH0,DH0+T,BRIDGE,HT,[doorAt(1.6,.8,BRIDGE,1.92),doorAt(-1.6,.8,BRIDGE,1.92),doorAt(0,.8,BRIDGE,1.92)]);
  deco([-.4,BRIDGE+1.95,DH0-.02],[.4,BRIDGE+2.1,DH0],0xb03a2a);
  // (To starboard the master's cabin's port moves aft clear of the stair's trunk, and a second lights the stair.)
  for(const s of [1,-1])wall('z',DH0,WH0,...sorted(s*(BH-T),s*BH),BRIDGE,HT,(s>0?[10.2,12.7,15.2,17.9]:[10.2,12.7,15.2,17.6,18.85]).map(zy=>win(Z(zy),.5,BRIDGE+1.45,.5)));
  // The wheelhouse's aft wall, with the door to the corridor (open, hooked back against it in the wheelhouse).
  wall('x',-BH,BH,WH0-T/2,WH0+T/2,BRIDGE,HT,[doorAt(0,.8,BRIDGE,1.92),{s0:CS.x[0],s1:CS.x[1],y0:BRIDGE-1,y1:BRIDGE+1.5}]);
  // The crew stair's trunk through the master's cabin's outboard forward corner (its well: FERRY_CREW_STAIR).
  wall('z',CS.well[0]-.04,WH0-T/2,CS.wall-.08,CS.wall,BRIDGE,HT,[],CREAM);wall('x',CS.x[0],CS.wall-.08,CS.well[0]-.04,CS.well[0]+.04,BRIDGE,HT,[],CREAM);
  deco([CS.x[0]+.2,ceil-.04,CS.well[0]+.4],[CS.x[1]-.2,ceil,CS.well[0]+.7],0xf6f1e2);
  deco([.42,BRIDGE+.02,WH0+T/2],[1.2,BRIDGE+1.92,WH0+T/2+.04],DOOR);
  // The EG and CO₂ rooms' forward walls and inner walls; the corridor's walls with a door into each room.
  wall('x',-BH,-CW,Z(9)-T/2,Z(9)+T/2,BRIDGE,HT);wall('x',CW,BH,Z(9)-T/2,Z(9)+T/2,BRIDGE,HT);
  for(const s of [1,-1]){
   wall('z',DH0+T,Z(9)-T/2,...sorted(s*CW,s*(CW+T)),BRIDGE,HT);   // (to the cross wall's face, not into its end)
   // Port: one opening into the lounge. Starboard: a door to each room, as before.
   const doors=s>0?[doorAt(Z(14.25),Z(18.8)-Z(9.7),BRIDGE,1.92)]:rooms.filter(r=>r[0]===s).map(r=>doorAt(doorZ(r[1],r[2]),.7,BRIDGE,1.92));
   wall('z',Z(9)+T/2,WH0,...sorted(s*CW,s*(CW+T)),BRIDGE,HT,doors,CREAM);
   for(const r of rooms.filter(r=>r[0]===s).slice(1))if(bulkhead(s,r[1]))wall('x',...sorted(s*(CW+T),s*(BH-T)),r[1]-T/2,r[1]+T/2,BRIDGE,HT,[],CREAM);
  }
  // Floors: the corridor, linoleum; the rooms.
  deco([-CW,BRIDGE+.003,DH0+T],[CW,BRIDGE+.008,WH0],0x8a6f55);
  floor('crew-corridor',[-CW,CW],[DH0-.45,WH0+.4],BRIDGE,(x,z,r)=>Math.abs(x)<=CW-r+.1&&(z<WH0-T/2-r||Math.abs(x)<=.4-r+.08));
  const room=(s,z0,z1,id,doorAt0)=>{
   const X=sorted(s*(CW+T),s*(BH-T));
   // Dark blue carpet in the lounge (the Chisum wardroom note, A1). The WC and the pantry keep their own floors.
   const col=id==='crew-wc'?0xd9dfe0:id==='galley'?0xc9c2ae:0x24324a;
   const zA=joinedAft(s,z0)?z0:z0+T/2,zB=joinedFore(s,z1)?z1-.002:z1-T/2;
   // (The master's corner stops at the crew stair's trunk. A 2 mm gap at an open join keeps the floors from fighting.)
   if(id==='master-cabin'){deco([CS.wall,BRIDGE+.003,zA],[X[1],BRIDGE+.008,zB],col);deco([X[0],BRIDGE+.003,zA],[CS.wall,BRIDGE+.008,CS.well[0]-.04],col);}
   else deco([X[0],BRIDGE+.003,zA],[X[1],BRIDGE+.008,zB],col);
   const loungeDoor=s>0;
   floor(id,sorted(s*(CW-.35),s*(BH-T)),[z0,z1],BRIDGE,(x,z,r)=>{const a=Math.abs(x);
    if(a<CW+T+r)return a>CW-.35&&(loungeDoor?z>=z0+r-.05&&z<=z1-r+.05:Math.abs(z-doorAt0)<=.35-r+.06);
    if(id==='master-cabin'&&x<CS.wall+r&&z>CS.well[0]-.04-r)return false;   // the crew stair's trunk
    const zLo=joinedAft(s,z0)?z0-r:z0+T/2+r,zHi=joinedFore(s,z1)?z1+r:z1-T/2-r;
    return a<=BH-T-r&&z>=zLo&&z<=zHi;});
  };
  for(const [s,z0,z1,id] of rooms)room(s,z0,z1,id,doorZ(z0,z1));
  // The emergency-generator and CO₂ rooms, from the platform aft.
  for(const s of [1,-1]){const id=s>0?'eg-room':'co2-room',X=sorted(s*(CW+T),s*(BH-T));
   deco([X[0],BRIDGE+.003,DH0+T],[X[1],BRIDGE+.008,Z(9)-T/2],0x8c9193);
   floor(id,X,[DH0-.45,Z(9)],BRIDGE,(x,z,r)=>{const a=Math.abs(x);if(z<DH0+T+r)return Math.abs(a-1.6)<=.4-r+.06;return a>=CW+T+r&&a<=BH-T-r&&z<=Z(9)-T/2-r;});}

  // Emergency-generator room: the 40 kVA set on its bed (engine, radiator forward, alternator aft), the emergency
  // switchboard on the forward wall, the 24 V batteries in their box, the 60 L day tank, louvres in the aft wall.
  {box([1.25,BRIDGE,Z(6.9)],[2.55,BRIDGE+.95,Z(8.3)],0x5f7f6a,{name:'emergency generator'});
   deco([1.4,BRIDGE+.95,Z(7.2)],[2.4,BRIDGE+1.05,Z(8.0)],0x3f5a4a);bar([1.9,BRIDGE+.6,Z(8.3)],[1.9,BRIDGE+.6,Z(8.6)],.28,0x2f4f8f);
   box([.6,BRIDGE,Z(8.6)],[2.9,BRIDGE+1.9,Z(9)-T/2],0x9aa3a2,{name:'emergency switchboard'});for(let i=0;i<5;i++)deco([.7+i*.45,BRIDGE+1.0,Z(8.6)-.02],[1.0+i*.45,BRIDGE+1.6,Z(8.6)],0x3a4244);
   box([2.4,BRIDGE,Z(6.15)],[2.9,BRIDGE+.6,Z(6.8)],0x3a4244,{name:'battery box'});box([.6,BRIDGE+1.3,Z(6.15)],[1.0,BRIDGE+1.9,Z(6.6)],0x8a6a3a,{name:'day tank'});
   for(let i=0;i<4;i++)deco([2.1,BRIDGE+1.2+i*.12,DH0-.01],[2.8,BRIDGE+1.25+i*.12,DH0],DARK);}
  // CO₂ room and fire-control station: four 45 kg bottles in their rack, the release cabinet, the remote fan stops and
  // quick-closing valves, two firemen's outfits in their locker.
  {for(let i=0;i<4;i++)bar([-2.6+i*.3,BRIDGE,Z(8.6)],[-2.6+i*.3,BRIDGE+1.45,Z(8.6)],.12,RED);
   box([-2.8,BRIDGE,Z(8.4)],[-1.55,BRIDGE+1.5,Z(9)-T/2],RED,{draw:false,name:'CO₂ bottles'});deco([-2.8,BRIDGE+1.1,Z(8.85)],[-1.55,BRIDGE+1.15,Z(8.9)],DARK);
   box([-1.2,BRIDGE+.9,Z(9)-T/2-.2],[-.6,BRIDGE+1.7,Z(9)-T/2],RED,{name:'CO₂ release cabinet'});
   box([-2.95,BRIDGE,Z(6.2)],[-2.35,BRIDGE+1.9,Z(7.2)],0x9aa3a2,{name:'firemen’s outfit locker'});
   box([-1.1,BRIDGE+1.0,DH0+T],[-.6,BRIDGE+1.6,DH0+T+.15],0xd8d2c0,{name:'fan stops'});}

  // The lounge, scaled down from the Chisum's crew-lounge notes (nj22az/nj22az.github.io
  // ferry/yard/reference/owner-photographs-2026-11-11.md, A1 and C5): tan leather settees, a wardroom
  // table, a short bookshelf, a ship's clock, a brass lamp, a letter rack and one framed print. No bunks,
  // and the Chisum herself is not aboard.
  const LEATHER=0xc4a06a,BUTTON=0x8d6a3e;
  const bench=(x0,x1,z0,z1,name='crew lounge bench')=>{
   box([x0,BRIDGE,z0],[x1,BRIDGE+.42,z1],LEATHER,{name});
   deco([x0,BRIDGE+.424,z1-.1],[x1,BRIDGE+.78,z1],LEATHER);
   for(let i=0;i<3;i++)deco([x0+.08,BRIDGE+.5,z0+.12+i*(z1-z0-.3)/2],[x0+.14,BRIDGE+.56,z0+.18+i*(z1-z0-.3)/2],BUTTON);
  };
  bench(2.15,2.82,Z(9.4),Z(11.15));bench(2.15,2.82,Z(12.4),Z(13.7));
  bench(2.15,2.82,Z(17.55),Z(18.85));
  bench(-2.82,-2.2,Z(9.45),Z(11.05));
  {const xt=1.35,zt=Z(10.55);box([xt-.04,BRIDGE,zt-.04],[xt+.04,BRIDGE+.7,zt+.04],0xc5c8c6,{name:'lounge table'});
   box([xt-.28,BRIDGE+.7,zt-.28],[xt+.28,BRIDGE+.74,zt+.28],TEAK,{name:'lounge table'});}
  {const spines=[0xc94f3d,0x3f6fa0,0xe0b93a,0x4f8f5f,0xf0ece0,0x8a4f8f];
   box([.62,BRIDGE,Z(9.12)],[1.05,BRIDGE+1.45,Z(9.42)],TEAK,{name:'crew lounge bookshelf'});
   for(const [k,y] of [[0,.28],[1,.62],[2,.96]]){deco([.64,BRIDGE+y,Z(9.12)-.012],[1.03,BRIDGE+y+.02,Z(9.16)],0x6f5a40);
    for(let i=0;i<4;i++)deco([.66+i*.09,BRIDGE+y+.02,Z(9.1)],[.66+i*.09+.07,BRIDGE+y+.2,Z(9.118)],spines[(i+k)%spines.length]);}}
  plate(['SHIP’S CLOCK'],.18,.18,[2.86,BRIDGE+1.45,Z(10.3)],-Math.PI/2,{name:'ship’s clock',bg:'#f4f1e8',fg:'#1f2224'});
  deco([2.84,BRIDGE+1.25,Z(12.05)],[2.9,BRIDGE+1.7,Z(12.35)],0x6f5a40,{name:'framed print'});
  deco([2.86,BRIDGE+1.32,Z(12.1)],[2.905,BRIDGE+1.62,Z(12.3)],0x7fa9c9);
  for(let i=0;i<4;i++)deco([2.7,BRIDGE+1.15+i*.08,Z(11.35)],[2.88,BRIDGE+1.18+i*.08,Z(11.85)],TEAK,{name:'letter rack'});
  bar([2.55,BRIDGE+1.7,Z(13.2)],[2.55,BRIDGE+1.95,Z(13.2)],.012,0xb08a4a,'paint');
  deco([2.48,BRIDGE+1.9,Z(13.12)],[2.62,BRIDGE+1.98,Z(13.28)],0xe0b93a,{name:'brass lamp'});
  plate(['乗組員休憩室','CREW LOUNGE'],.86,.18,[CW-.02,BRIDGE+2.12,Z(14.2)],-Math.PI/2,{name:'crew lounge sign',bg:'#24585c',fg:'#f4f1e8'});
  const desk=(s,z0,z1)=>{const X=S2(s,BH-T-.55,BH-T);box([X[0],BRIDGE+.72,z0],[X[1],BRIDGE+.77,z1],TEAK,{name:'desk'});box([X[0],BRIDGE,z0],[X[1],BRIDGE+.72,z0+.4],TEAK,{name:'desk'});};
  // Crew WC and shower: the WC, the basin, the shower tray and its curtain.
  deco([-(BH-T),BRIDGE+.009,Z(11.5)+.1],[-(BH-T-.9),BRIDGE+.02,Z(11.5)+1.0],0xe6eef0);deco([-(BH-T-.9),BRIDGE+1.95,Z(11.5)+.1],[-(BH-T-.92),BRIDGE+1.97,Z(11.5)+1.0],STEEL);
  box([-(BH-T),BRIDGE,Z(13.4)-.2],[-(BH-T-.55),BRIDGE+.42,Z(13.4)+.2],0xf4f4f0,{name:'WC'});box([-(CW+T+.45),BRIDGE+.7,Z(12.9)-.25],[-(CW+T),BRIDGE+.85,Z(12.9)+.25],0xf4f4f0,{name:'basin'});
  // Mess room: a table for six with benches, the television, the kettle, the duty board and the muster list.
  box([1.35,BRIDGE,Z(15.0)],[2.35,BRIDGE+.72,Z(16.2)],TEAK,{name:'mess table'});
  for(const x of [[1.08,1.28],[2.42,2.62]])box([x[0],BRIDGE,Z(15.0)],[x[1],BRIDGE+.42,Z(16.2)],0x8a7356,{name:'mess bench'});
  box([BH-T-.14,BRIDGE+1.25,Z(15.35)],[BH-T-.04,BRIDGE+1.65,Z(15.95)],DARK,{camera:false,name:'mess television'});
  box([BH-T-.5,BRIDGE,Z(14)+T/2+.05],[BH-T,BRIDGE+.9,Z(14)+.7],0xd8d2c0,{name:'sideboard'});bar([2.55,BRIDGE+.9,Z(14.35)],[2.55,BRIDGE+1.1,Z(14.35)],.07,STEEL);
  deco([BH-T-.06,BRIDGE+1.15,Z(14.15)],[BH-T-.02,BRIDGE+1.75,Z(14.7)],0xf4f0e2);
  // Galley: the three-plate range and its hood, the rice cooker, the fridge-freezer, the sink, the provision locker.
  box([-(BH-T),BRIDGE,Z(14.2)],[-(BH-T-.6),BRIDGE+.9,Z(15.0)],0x9aa3a2,{name:'range'});box([-(BH-T),BRIDGE+1.55,Z(14.2)],[-(BH-T-.6),BRIDGE+1.9,Z(15.0)],STEEL,{camera:false,name:'hood'});
  box([-(BH-T),BRIDGE,Z(15.0)],[-(BH-T-.6),BRIDGE+.9,Z(15.9)],0xc8c8c0,{name:'sink'});bar([-(BH-T-.3),BRIDGE+.9,Z(15.45)],[-(BH-T-.3),BRIDGE+1.1,Z(15.45)],.09,0xf0ece0);
  box([-(BH-T),BRIDGE,Z(15.9)],[-(BH-T-.65),BRIDGE+1.75,Z(16.5)-T/2],0xe8e6dc,{name:'fridge-freezer'});
  // Keep the locker aft of the doorway's turning space: its former .55 m end
  // left only a centimetre between the door jamb and an adult's clearance.
  box([-(CW+T+.6),BRIDGE,Z(14)+T/2+.05],[-(CW+T),BRIDGE+1.9,Z(14)+.30],0xb9b3a0,{name:'provision locker'});
  // The engineer's writing table, forward in the lounge, and the skipper's papers: a desk and the safe, no bunk.
  desk(1,Z(16.6),Z(17.35));
  desk(-1,Z(16.6),Z(17.5));
  box([-(BH-T-.02),BRIDGE,Z(17.15)],[-(BH-T-.47),BRIDGE+.55,Z(17.55)],DARK,{name:'safe'});
  box([CS.wall+.04,BRIDGE,WH0-T/2-.55],[CS.wall+.6,BRIDGE+1.9,WH0-T/2-.03],0xb9b3a0,{name:'locker'});
  for(const [s,z0,z1] of rooms)if(s<0)deco([Math.min(s*(CW+T),s*(CW+T+.01)),BRIDGE+2.0,doorZ(z0,z1)-.15],[Math.max(s*(CW+T),s*(CW+T+.01)),BRIDGE+2.12,doorZ(z0,z1)+.15],0xf4f0e2);
  // A grab rail down each side of the corridor, at 0.95 m: a ship's corridor in a seaway.
  for(const s of [1,-1])bar([s*(CW-.03),BRIDGE+.95,Z(9.3)],[s*(CW-.03),BRIDGE+.95,WH0-.3],.016,STEEL);
  // Ceiling lights down the corridor.
  for(let z=Z(10);z<WH0-.5;z+=2)deco([-.2,ceil-.04,z-.15],[.2,ceil,z+.15],0xf6f1e2);
 }

 /** The KKS tag of a node on the piping diagrams (ferry-piping.js), so the plate on the machine and the drawing agree. */
 const tagOf=(system,id)=>{const n=FERRY_PIPING.find(s=>s.id===system)?.nodes.find(n=>n.id===id);if(!n)throw new RangeError('no piping node '+system+'/'+id);return n.tag;};
 /** Where a pipe meets a thing (ferry-pipe-routes.js): keyed 'system/node' as on the piping diagrams. */
 const anchors={};const anchor=(sys,id,pos,dir,o={})=>{anchors[sys+'/'+id]=Object.freeze({pos:Object.freeze(pos),dir,local:!!o.local,penetration:!!o.penetration,off:o.off??.25});};
 /** A penetration: a pipe leaves the space here through a deck, a bulkhead or the tank top; drawn as its flange. */
 const pen=(sys,id,pos,dir)=>{anchor(sys,id,pos,dir,{penetration:true});const v=dir==='up'||dir==='down';cyl(.05,.05,.02,pos,0x9ea4a6,{rot:v?[0,0,0]:dir==='fwd'||dir==='aft'?[Math.PI/2,0,0]:[0,0,Math.PI/2],seg:8,name:'penetration'});};
 /** A KKS tag plate (black, engraved white) on a machine, facing +z turned by rotY (the creator, 2026-10-13: "Use correct KKS codes"). */
 const tagPlate=(tag,pos,rotY,o={})=>plate([tag],o.w||.16,.035,pos,rotY,{bg:'#1f2224',fg:'#e8e2cc',name:'KKS tag'});
 /** A motor-driven pump on its bed against a lining at x0, facing side s (+1 the pump looks to port), with its plates and its tag. */
 const pumpSet=(key,serial,hex,label,x0,s,z,tag,sys=null,node=null)=>{const y0=ER.floor,y1=ER.deckhead,L=JOHANSSON_MARINE.livery;if(sys)anchor(sys,node,[x0+s*.1,y0+.5,z],'up');
  box([Math.min(x0,x0+s*.5),y0,z-.125],[Math.max(x0,x0+s*.5),y0+.55,z+.125],hex,{draw:false,name:label.toLowerCase()+' pump'});deco([Math.min(x0+s*.02,x0+s*.48),y0+.03,z-.12],[Math.max(x0+s*.02,x0+s*.48),y0+.12,z+.12],0x3a3f41);
  cyl(.1,.1,.14,[x0+s*.1,y0+.3,z],hex,{rot:[0,0,Math.PI/2],seg:14,cls:'paint',name:'pump casing'});cyl(.04,.04,.1,[x0+s*.1,y0+.44,z],hex,{seg:10,cls:'paint',name:'pump branch'});
  cyl(.05,.05,.06,[x0+s*.2,y0+.3,z],0xe0b93a,{rot:[0,0,Math.PI/2],seg:10,cls:'paint',name:'coupling guard'});cyl(.09,.09,.24,[x0+s*.35,y0+.3,z],L.alternator,{rot:[0,0,Math.PI/2],seg:14,name:'pump motor'});
  plate(makerPlate(key,serial),.14,.065,[x0+s*.35,y0+.2,z+.091],0,{name:'maker’s plate: '+label.toLowerCase()+' pump'});plate([label],.2,.04,[x0+s*.25,y0+.09,z+.121],0,{bg:'#f1ede2',name:'label: '+label.toLowerCase()});
  if(tag)tagPlate(tag,[x0+s*.25,y0+.52,z+.126],0);};
 // ---- The engine room (FERRY_ENGINE_ROOM): in by the casing P door and down the ladder through the car deck; the
 // two main engines with their reverse-reduction gearboxes aft and turbochargers forward, the shafts aft through the
 // bulkhead; the two generators relocated forward into the auxiliary room, athwartships; the control booth aft to starboard with the main switchboard;
 // pumps, the air compressor and its bottles, the purifier, the service tank, the workbench, the escape ladder.
 {const y0=ER.floor,y1=ER.deckhead,a=ER.aft,f=ER.fore,W=ER.side,G=0x8fa39a,GD=0x5f7f6a;
  // The entrance in casing P: its walls, the door frame and the door hooked back aft along the casing's face.
  box([CAS_OUT-.06,CAR,ER.entrance[0]],[CAS_OUT,CAS_TOP,S.head],WHITE,{name:'casing'});
  wall('z',ER.entrance[0],S.head,CAS_IN,CAS_IN+.06,CAR,CAS_TOP,[doorAt((ER.door[0]+ER.door[1])/2,ER.door[1]-ER.door[0],CAR)]);
  for(const z of ER.door)deco([CAS_IN-.04,CAR-.01,z-.04],[CAS_IN+.02,CAR+2,z+.04],TEAL);
  box([CAS_IN-.06,CAR+.02,ER.door[0]-.85],[CAS_IN-.02,CAR+1.98,ER.door[0]-.05],DOOR,{name:'engine room door'});
  // The way down is marked as on any ship: yellow-and-black hazard stripes on the walkway at the door, a lit sign over
  // the door (the 機関室 ENGINE ROOM decal: ferry-model.js), ear defenders on their hook and the escape sign inside.
  for(let i=0;i<5;i++)deco([CAS_IN-.5+i*.1,CAR+.004,ER.door[0]-.02],[CAS_IN-.42+i*.1,CAR+.008,ER.door[1]+.02],i%2?DARK:YELLOW);
  deco([CAS_IN-.16,CAR+2.46,ER.door[0]-.04],[CAS_IN+.03,CAR+2.52,ER.door[1]+.04],0x3a4244);
  deco([CAS_IN-.15,CAR+2.44,ER.door[0]-.02],[CAS_IN-.02,CAR+2.46,ER.door[1]+.02],0xf6f1e2);
  deco([CAS_IN+.03,CAR+1.5,ER.entrance[0]+.1],[CAS_IN+.2,CAR+1.75,ER.entrance[0]+.3],0xe0b93a);
  deco([CAS_OUT-.08,CAR+1.6,ER.entrance[0]+.2],[CAS_OUT-.06,CAR+1.9,ER.entrance[0]+.6],0x1f7a4a);
  // The hatch's coaming round the opening in the car deck, and the ladder's rails over it.
  const L=ER.ladder;
  for(const x of [L.x[0]-.05,L.x[1]+.03])deco([x,CAR,ER.hatch.z[0]+.4],[x+.02,CAR+.15,ER.hatch.z[1]],0x3a4244);
  bar([L.x[0]-.03,CAR,ER.hatch.z[0]+.35],[L.x[0]-.03,CAR+1.0,ER.hatch.z[0]+.35],.025,YELLOW,'paint');
  bar([L.x[0]-.03,CAR+1.0,ER.hatch.z[0]+.35],[L.x[0]-.03,CAR+1.0,ER.hatch.z[1]-.1],.025,YELLOW,'paint');
  // The ladder trunk under the car deck, from the hatch to the engine room's aft bulkhead.
  for(const x of [L.x[0]-.06,L.x[1]+.03])box([x,y0,L.head],[x+.04,y1,a],WHITE,{name:'ladder trunk'});
  box([L.x[0]-.06,y1,L.head],[L.x[1]+.07,CAR-.02,L.head+.04],WHITE,{solid:false,camera:true,name:'ladder trunk'});
  {const n=FERRY_H1_ENABLED?FERRY_H1.ladder.risers:10,rise=CAR-y0,run=L.foot-L.head;for(let i=1;i<n;i++){const fr=i/n;deco([L.x[0]+.03,CAR-rise*fr-.03,L.head+run*fr-.07],[L.x[1]-.03,CAR-rise*fr,L.head+run*fr+.07],STEEL,{cls:'metal'});}
   for(const x of [L.x[0]+.02,L.x[1]-.02]){bar([x,CAR,L.head],[x,y0,L.foot],.03,STEEL);bar([x,CAR+.9,L.head],[x,y0+.9,L.foot],.02,YELLOW,'paint');}}
  // The ladder's own volume keeps the lens out (batch 6f): at its foot the camera stood under the rungs looking up through them.
  box([L.x[0]-.06,y0,L.head-.1],[L.x[1]+.07,CAR,L.foot+.1],STEEL,{solid:false,camera:true,draw:false,name:'ladder volume'});
  // The ladder is walked anywhere across its width (the creator, 2026-10-12, could not get down on a phone).
  floor('er-ladder',[L.x[0],L.x[1]],[L.head,L.foot],[CAR,y0],(x,z,r)=>Math.abs(x-(L.x[0]+L.x[1])/2)<=.34);
  floor('er-ladder-foot',[L.x[0],L.x[1]],[L.foot-.05,L.foot+.4],y0,(x,z,r)=>Math.abs(x-(L.x[0]+L.x[1])/2)<=.34);
  floor('er-entrance',[CAS_IN-.4,L.x[1]],[ER.entrance[0],L.head+.05],CAR,(x,z,r)=>x>=CAS_IN-.4&&x<=CAS_OUT-.06-r&&z>=ER.entrance[0]+r&&(x>=CAS_IN+.06+r||(z>=ER.door[0]+r-.06&&z<=ER.door[1]-r+.06)||x<CAS_IN-.05));
  // The space: lining along her sides, the bulkheads fore and aft (the ladder comes through the aft one), the deckhead
  // under the car deck, the chequered floor plates.
  for(const s of [1,-1])box([Math.min(s*W,s*(W+.06)),y0-.1,a],[Math.max(s*W,s*(W+.06)),y1,f],0xe8e6dc,{name:'engine room side'});
  wall('x',-W,W,a-.06,a,y0-.1,y1,[{s0:L.x[0]-.06,s1:L.x[1]+.07,y0:y0-1,y1:y1+1}],0xe8e6dc);
  // The forward bulkhead (Fr 28) with the watertight sliding door on the centreline to the auxiliary machinery room (6q).
  wall('x',-W,W,f,f+.06,y0-.1,y1,[doorAt(0,WT_W,y0,WT_H)],0xe8e6dc);
  box([-W,y1,a],[W,CAR-.02,f],0xd8d6cc,{solid:false,camera:true,name:'engine room deckhead'});
  if(FERRY_H1_ENABLED){
   // CAD H1: real open grating, supported at the same +900 working level.
   for(const [x0,x1,z0,z1]of [[-W,W,a,Z(9.3)],[-W,W,Z(12.4),f],[-W,-.63,Z(9.3),Z(12.4)],[.63,W,Z(9.3),Z(12.4)]])box([x0,y0-.06,z0],[x1,y0,z1],0x8c9193,{solid:false,camera:false,name:'floor plates'});
   box([-W,Y(.68),a],[W,Y(.7),f],0x7a2a1e,{solid:false,camera:false,name:'tank top'});
   for(let z=Z(9.3);z<Z(12.4);z+=.05)deco([-.63,y0-.03,z],[.63,y0,z+.006],STEEL,{cls:'metal',name:'bearing grating bar'});
   for(const x of [-.63,-.21,.21,.63])deco([x-.008,y0-.05,Z(9.3)],[x+.008,y0-.03,Z(12.4)],STEEL,{cls:'metal',name:'grating support'});
  }else box([-W,y0-.06,a],[W,y0,f],0x8c9193,{solid:false,camera:false,name:'floor plates'});
  // Chequer plate (the photographs: raised diamonds, a seam at every plate), everywhere but the booth's own floor.
  floorPlate('chequer',-2.35,W,a,f,y0+.002);floorPlate('chequer',-W,-2.35,Z(10.9)+T/2,f,y0+.002);
  // Gratings over the bilge (the creator's photographs, 2026-10-12, "upper grating": the walkway between the engines is
  // open grating with the red bilge under it): the aisle between the rails, and the strips inside each engine's rails.
  floorPlate('grating',-.63,.63,Z(9.3),Z(12.4),y0+.006);for(const s of [1,-1]){floorPlate('grating',s*.67,s*1.02,Z(9.3),Z(12.4),y0+.006);floorPlate('grating',s*2.08,s*2.43,Z(9.3),Z(12.4),y0+.006);}
  // Lights in their guards, and the fire main's hydrant.
  for(const [x,z] of [[0,Z(9.5)],[0,Z(12.5)],[2.9,Z(11)],[-2.9,Z(12.6)]])deco([x-.15,y1-.08,z-.15],[x+.15,y1,z+.15],0xf6f1e2);
  // Bulkhead lights in their wire cages along her sides (the photographs: a caged lamp over every machine).
  for(const s of [1,-1])for(const z of [Z(9.4),Z(11.4),Z(13.2)]){const x=s*(W-.1);
   deco([Math.min(x,x-s*.1),y1-.55,z-.07],[Math.max(x,x-s*.1),y1-.35,z+.07],0xd8d2c0);cyl(.045,.045,.14,[x-s*.14,y1-.45,z],0xfff6dc,{rot:[0,0,Math.PI/2],seg:10,name:'bulkhead lamp'});
   for(const dz of [-.06,.06])bar([x-s*.1,y1-.52,z+dz],[x-s*.2,y1-.45,z+dz],.004,0x9a9ea0);bar([x-s*.1,y1-.38,z-.06],[x-s*.2,y1-.45,z-.06],.004,0x9a9ea0);bar([x-s*.1,y1-.38,z+.06],[x-s*.2,y1-.45,z+.06],.004,0x9a9ea0);
   bar([x-s*.2,y1-.45,z-.06],[x-s*.2,y1-.45,z+.06],.004,0x9a9ea0);}
  box([W-.25,y0,Z(13.6)],[W,y0+.9,Z(13.8)],RED,{name:'hydrant'});tagPlate(tagOf('fire','hER'),[W-.251,y0+.95,Z(13.7)],-Math.PI/2);

  // Inside, the engine room's own sign, the fire alarm bell and the CO₂ alarm (red and yellow), the first-aid box,
  // the escape-route sign over the escape ladder.
  deco([-W+.02,y0+1.5,Z(9.1)],[-W+.04,y0+1.8,Z(9.9)],0xb03a2a);
  bar([-W+.3,y1-.35,Z(9.1)],[-W+.3,y1-.2,Z(9.1)],.1,RED,'paint');bar([-W+.6,y1-.35,Z(9.1)],[-W+.6,y1-.2,Z(9.1)],.1,YELLOW,'paint');
  deco([W-.02,y0+1.4,Z(9.9)],[W,y0+1.7,Z(10.3)],0xf4f1e8);deco([W-.025,y0+1.5,Z(10.03)],[W-.02,y0+1.6,Z(10.17)],RED);deco([W-.025,y0+1.52,Z(9.95)],[W-.02,y0+1.58,Z(10.25)],RED);
  deco([-W+.1,y1-.3,a+.2],[-W+.6,y1-.15,a+.22],0x1f7a4a);
  // The main engines: Johansson Marine JM6-160 (johansson-marine.js), built like the marine diesels of their day
  // (the creator, 2026-10-12: "real machines similar to Volvo", branded Johansson). Each: the bedplate; the block in
  // the house green with the sump below and the crankcase doors along the inboard side; six cylinder heads under
  // six black rocker covers with the oil filler on No.1; the fuel rail and injection pumps inboard with a line to
  // each head; the exhaust manifold outboard in silver lagging with a branch from each head to the turbocharger
  // forward (turbine and compressor housings, the air filter drum, the charge-air cooler), and the exhaust up to
  // the casing; the flywheel housing aft, the coupling guard and the JR-30 gearbox with its output flange; the
  // lube-oil filters and the cooling-water pumps on the forward end; the gauge board and local control stand aft;
  // the maker's plate on the block. Numbers from FERRY_MACHINERY through the catalogue.
  {const L=JOHANSSON_MARINE.livery,GRN=L.green,GRND=L.greenDark,COV=L.cover,LAG=L.lagging,CAST=L.cast;
   const E0=Z(9.7),E1=Z(11.95),heads=6,pitch=(E1-E0-.5)/heads;
   for(const s of [1,-1]){const cx=s*1.55,X=S2(s,1.1,2.0),out=s*.45,inb=-s*.45;
    const name=s>0?'main engine, port':'main engine, starboard';
    box([X[0]-.08,y0,Z(9.0)],[X[1]+.08,y0+.22,E1+.05],0x3a3f41,{name:'main engine bedplate'});
    box([X[0]+.08,y0+.22,E0],[X[1]-.08,y0+.55,E1],GRND,{name:'main engine sump'});
    box([X[0],y0+.55,E0],[X[1],y0+1.12,E1],GRN,{name:'main engine'});
    for(let i=0;i<heads;i++){const dz=E0+.25+i*pitch+pitch/2;
     if(s<0&&i===3&&!FERRY_H1_ENABLED){                                                                                                     // No.4 door is off the starboard engine (the photographs: the cams and the red inside)
      cyl(.09,.09,.006,[cx+inb*1.012,y0+.82,dz],0x7a2a1e,{rot:[0,0,Math.PI/2],seg:12,cls:'paint',name:'crankcase opening'});cyl(.1,.1,.006,[cx+inb*1.003,y0+.82,dz],0x15181a,{rot:[0,0,Math.PI/2],seg:12,name:'crankcase opening'});
      cyl(.03,.03,.05,[cx+inb*1.05,y0+.86,dz-.03],0xb8bcbe,{rot:[0,0,Math.PI/2],seg:8,name:'camshaft'});cyl(.03,.03,.05,[cx+inb*1.05,y0+.86,dz+.03],0xb8bcbe,{rot:[0,0,Math.PI/2],seg:8,name:'camshaft'});
      cyl(.02,.045,.05,[cx+inb*1.05,y0+.86,dz],0xb8bcbe,{rot:[0,0,Math.PI/2],seg:8,name:'cam lobe'});cyl(.04,.04,.03,[cx+inb*1.04,y0+.76,dz],0x8d9492,{rot:[0,0,Math.PI/2],seg:8,name:'crank web'});
      deco([cx+inb*1.3-.18,y0+.001,dz-.16],[cx+inb*1.3+.18,y0+.01,dz+.16],0xd8d2c0);cyl(.09,.09,.015,[cx+inb*1.3,y0+.02,dz],GRND,{seg:8,name:'crankcase door'});   // the door on a rag on the plates
      for(let k=0;k<6;k++)cyl(.008,.008,.04,[cx+inb*1.3+.12,y0+.03,dz-.1+k*.04],0x8d9492,{rot:[Math.PI/2,0,0],seg:6,name:'door bolt'});
     }else cyl(.09,.09,.015,[cx+inb*1.0,y0+.82,dz],GRND,{rot:[0,0,Math.PI/2],seg:8,name:'crankcase door'});}
    for(let i=0;i<heads;i++){const z0=E0+.25+i*pitch+.03,z1=z0+pitch-.06;
     deco([cx-.3,y0+1.12,z0],[cx+.3,y0+1.3,z1],GRN);
     deco([cx-.24,y0+1.3,z0+.02],[cx+.24,y0+1.44,z1-.02],COV);cyl(.1,.1,z1-z0-.06,[cx,y0+1.44,(z0+z1)/2],COV,{rot:[Math.PI/2,0,0],seg:10});
     for(const k of [-.17,.17])bar([cx+k,y0+1.445,z0+.03],[cx+k,y0+1.445,z1-.03],.008,0x2c3033);                        // the cover's cast ribs
     cyl(.055,.055,.012,[cx+inb*.38,y0+1.125,(z0+z1)/2],0x2a2d2f,{seg:6,name:'sensor box'});                              // a sensor box on each head, cabled along the block
     bar([cx+inb*.6,y0+1.2,(z0+z1)/2],[cx+inb*.1,y0+1.36,(z0+z1)/2],.012,0xd8d4c4);
     bar([cx+out*.5,y0+1.22,(z0+z1)/2],[cx+out*.95,y0+1.3,(z0+z1)/2],.045,LAG);}
    cyl(.045,.045,.05,[cx+.1,y0+1.49,E0+.3],0xe0b93a,{seg:10,name:'oil filler'});
    bar([cx+inb*.38,y0+1.125,E0+.25],[cx+inb*.38,y0+1.125,E1-.2],.006,0x2a2d2f);                                             // the sensor cable
    plate([WORDMARK],.22,.05,[cx+inb*.245,y0+1.37,E0+.25+2*pitch+pitch/2],s>0?-Math.PI/2:Math.PI/2,{bg:'#c9ccc8',fg:'#1f2224',name:'badge'});  // the silver badge on the cover
    // The shutdown and reset box on the block's inboard face (the red mushroom, the reset button, the alarm lamp)
    deco([cx+inb*.45-.11,y0+.9,E0+.4],[cx+inb*.45+.11,y0+1.06,E0+.62],0x6b7375);
    cyl(.025,.025,.02,[cx+inb*.57,y0+1.0,E0+.46],L.red,{rot:[0,0,s*Math.PI/2],seg:10,name:'shutdown button'});cyl(.012,.012,.02,[cx+inb*.57,y0+1.0,E0+.53],0x2f8f4f,{rot:[0,0,s*Math.PI/2],seg:8,name:'reset button'});cyl(.01,.01,.02,[cx+inb*.57,y0+1.0,E0+.58],0xe0b93a,{rot:[0,0,s*Math.PI/2],seg:6,name:'alarm lamp'});
    plate(['SHUTDOWN','RESET'],.1,.04,[cx+inb*.562,y0+.93,E0+.51],s>0?-Math.PI/2:Math.PI/2,{bg:'#f1ede2',name:'label: shutdown'});
    bar([cx+inb*.62,y0+1.2,E0+.2],[cx+inb*.62,y0+1.2,E1-.2],.02,0xd8d4c4);
    deco([cx+inb*.75-.08,y0+.85,E0+.3],[cx+inb*.75+.08,y0+1.15,E1-.3],COV);
    for(const k of [0,.2]){cyl(.07,.07,.26,[cx+inb*.72,y0+.72,E0+.1+k],0xf0ece0,{seg:12,name:'fuel filter'});
     plate(['FUEL FILTER','CHG 12 MAR 94'],.09,.04,[cx+inb*.792,y0+.72,E0+.1+k],s>0?-Math.PI/2:Math.PI/2,{bg:'#f6f3ea',name:'label: fuel filter'});          // dated, as the photographs show them
     bar([cx+inb*.72,y0+.86,E0+.1+k],[cx+inb*.72,y0+.92,E0+.1+k],.012,0x9a9ea0);bar([cx+inb*.72,y0+.92,E0+.1+k],[cx+inb*.5,y0+1.0,E0+.3+k],.012,0x9a9ea0);}   // braided hoses to the pump block
    bar([cx+out*.95,y0+1.3,E0+.2],[cx+out*.95,y0+1.3,E1+.1],.085,LAG,'paint');
    for(let z=E0+.35;z<E1;z+=.36)cyl(.092,.092,.025,[cx+out*.95,y0+1.3,z],0x9ea4a6,{rot:[Math.PI/2,0,0],seg:8,name:'lagging band'});  // the quilted blanket's stainless bands
    bar([cx+out*.95,y0+1.3,E1+.1],[cx+out*.6,y0+1.45,E1+.35],.085,LAG,'paint');
    cyl(.17,.17,.26,[cx+out*.6,y0+1.45,E1+.42],CAST,{rot:[Math.PI/2,0,0],seg:16,name:'turbocharger turbine'});
    cyl(.2,.2,.2,[cx+out*.6,y0+1.45,E1+.64],CAST,{rot:[Math.PI/2,0,0],seg:16,name:'turbocharger compressor'});
    cyl(.16,.16,.3,[cx+out*.6,y0+1.45,E1+.9],COV,{rot:[Math.PI/2,0,0],seg:16,name:'air filter'});cyl(.165,.165,.04,[cx+out*.6,y0+1.45,E1+.78],LAG,{rot:[Math.PI/2,0,0],seg:16});
    deco([cx-.3,y0+.9,E1+.02],[cx+.3,y0+1.3,E1+.32],GRN);bar([cx+out*.6,y0+1.45,E1+.5],[cx+out*.2,y0+1.3,E1+.2],.06,CAST);
    bar([cx+out*.6,y0+1.62,E1+.42],[cx+out*.6,y1-.15,E1+.42],.14,LAG,'paint');bar([cx+out*.6,y1-.15,E1+.42],[cx+out*.6,y1-.15,a+.05],.14,LAG,'paint');
    cyl(.15,.15,.03,[cx+out*.6,y0+1.75,E1+.42],0x9ea4a6,{seg:8,name:'lagging band'});for(let z=E1+.1;z>a+.3;z-=.5)cyl(.15,.15,.03,[cx+out*.6,y1-.15,z],0x9ea4a6,{rot:[Math.PI/2,0,0],seg:8,name:'lagging band'});
    cyl(.1,.1,.18,[cx-.25,y0+.75,E1+.12],CAST,{rot:[Math.PI/2,0,0],seg:12,name:'cooling-water pump'});cyl(.09,.09,.16,[cx+.25,y0+.7,E1+.12],CAST,{rot:[Math.PI/2,0,0],seg:12,name:'sea-water pump'});
    for(const k of [-.14,.14]){cyl(.075,.075,.3,[cx+k,y0+.45,E1+.1],0xf0ece0,{seg:12,name:'lube-oil filter'});plate(['LO FILTER','CHG 8 FEB 94'],.09,.04,[cx+k,y0+.45,E1+.1+.077],0,{bg:'#f6f3ea',name:'label: lube-oil filter'});
     bar([cx+k,y0+.6,E1+.1],[cx+k,y0+.68,E1+.1],.012,0x9a9ea0);bar([cx+k,y0+.68,E1+.1],[cx+k*.6,y0+.78,E1-.02],.012,0x9a9ea0);}
    deco([cx-.32,y0+.3,E1+.2],[cx+.32,y0+.6,E1+.26],COV);
    cyl(.42,.42,.22,[cx,y0+.6,E0-.11],COV,{rot:[Math.PI/2,0,0],seg:20,name:'flywheel housing'});
    cyl(.2,.2,.14,[cx,y0+.6,E0-.29],0xe0b93a,{rot:[Math.PI/2,0,0],seg:14,name:'coupling guard'});
    box([X[0]+.12,y0+.22,Z(9.0)],[X[1]-.12,y0+.98,E0-.36],GRN,{name:'gearbox'});cyl(.3,.3,.06,[cx,y0+.6,Z(9.0)-.03],GRND,{rot:[Math.PI/2,0,0],seg:20,name:'gearbox cover'});
    deco([cx-.14,y0+.98,Z(9.15)],[cx+.14,y0+1.08,Z(9.45)],COV);cyl(.12,.12,.1,[cx,y0+.6,Z(9.0)-.1],CAST,{rot:[Math.PI/2,0,0],seg:12,name:'output flange'});
    bar([cx,y0+.6,a],[cx,y0+.6,Z(9.0)-.14],.055,0xb0b4b4);
    deco([cx+inb*1.1-.26,y0+.95,E0+.05],[cx+inb*1.1+.26,y0+1.3,E0+.08],0xf0ece0);
    // The gauge board (the photographs: a board of round dials): lube-oil pressure, cooling water, fuel pressure, exhaust temperature, charge air.
    const eid=s>0?'mainP':'mainS';
    dial('LO PRESS','bar',.55,.1,[cx+inb*1.1-.17,y0+1.2,E0+.044],Math.PI,{red:[0,.2],live:eid+'.loPress',range:[0,6]});dial('WATER','°C',.62,.1,[cx+inb*1.1-.055,y0+1.2,E0+.044],Math.PI,{red:[.85,1],live:eid+'.water',range:[0,100]});
    dial('FUEL','bar',.5,.1,[cx+inb*1.1+.055,y0+1.2,E0+.044],Math.PI,{live:eid+'.fuel',range:[0,10]});dial('EXHAUST','°C',.45,.1,[cx+inb*1.1+.17,y0+1.2,E0+.044],Math.PI,{red:[.85,1],live:eid+'.exhaust',range:[0,600]});
    dial('CHARGE AIR','bar',.4,.08,[cx+inb*1.1-.11,y0+1.05,E0+.044],Math.PI,{live:eid+'.chargeAir',range:[0,3]});dial('LO TEMP','°C',.5,.08,[cx+inb*1.1+.11,y0+1.05,E0+.044],Math.PI,{red:[.9,1],live:eid+'.loTemp',range:[0,100]});
    bar([cx+inb*1.1,y0+.22,E0+.06],[cx+inb*1.1,y0+.95,E0+.06],.02,DARK);
    deco([cx+inb*1.2-.16,y0+.9,Z(9.1)],[cx+inb*1.2+.16,y0+1.05,Z(9.4)],COV);bar([cx+inb*1.2,y0+.22,Z(9.25)],[cx+inb*1.2,y0+.9,Z(9.25)],.04,COV);
    cyl(.07,.07,.02,[cx+inb*1.2,y0+1.06,Z(9.25)],0xf0ece0,{seg:14,name:'tachometer'});cyl(.025,.025,.03,[cx+inb*1.2+.1,y0+1.07,Z(9.15)],L.red,{seg:10,name:'stop button'});bar([cx+inb*1.2-.1,y0+1.05,Z(9.35)],[cx+inb*1.2-.1,y0+1.25,Z(9.45)],.012,DARK);
    dial('RPM','×100',.0,.13,[cx+inb*1.2,y0+1.071,Z(9.25)],0,{rotX:-Math.PI/2,red:[.9,1],name:'gauge: tachometer',live:eid+'.rpm',range:[0,10]});
    // The start panel on the stand's face: the key switch, the green start and the hour meter (the photographs' start panels)
    cyl(.018,.018,.03,[cx+inb*1.2+.1,y0+1.07,Z(9.35)],0x2f8f4f,{seg:10,name:'start button'});cyl(.012,.012,.03,[cx+inb*1.2+.1,y0+1.07,Z(9.42)],0x1f2224,{seg:8,name:'key switch'});
    plate(['HOURS','08421.6'],.09,.035,[cx+inb*1.2-.08,y0+1.025,Z(9.1)-.001],Math.PI,{bg:'#1f2224',fg:'#e8e2cc',name:'hour meter'});
    plate(['LOCAL CONTROL','JM6-160 · '+(s>0?'PORT':'STBD')],.26,.05,[cx+inb*1.2,y0+.975,Z(9.1)-.001],Math.PI,{bg:'#f1ede2',name:'label: local control'});
    plate(makerPlate('main',s>0?1:2),.36,.16,[cx+inb*.46,y0+.9,E0+.9],s>0?-Math.PI/2:Math.PI/2,{name:'maker’s plate: '+name});tagPlate(tagOf('fuel',s>0?'fuel-mainP':'fuel-mainS').replace(/ .*$/,''),[cx+inb*.46,y0+1.03,E0+.9],s>0?-Math.PI/2:Math.PI/2);tagPlate(tagOf('lube',s>0?'bear-mainP':'bear-mainS').replace(/XJA10 BR001/,'XJK10 MG001'),[cx+inb*1.2,y0+.5,Z(9.1)-.001],Math.PI);
    plate([WORDMARK],.9,.08,[cx+out*.25,y0+1.38,(E0+E1)/2],s>0?Math.PI/2:-Math.PI/2,{bg:'#1f2224',fg:'#dcd8c8',name:'wordmark'});
   }
   // The generator sets: Johansson Marine JG-125, athwartships in the existing auxiliary room; a four-cylinder engine inboard
   // (heads, covers, manifold and a small turbo), the alternator outboard in the works' blue with its cooling ribs
   // and terminal box, on a common bed, and the maker's plate on the bed.
   for(const s of [1,-1]){const X=S2(s,.55,2.4),zc=GZ(12.975),ex=S2(s,.6,1.75);
    box([X[0],y0,GZ(12.55)],[X[1],y0+.2,GZ(13.4)],0x3a3f41,{name:'generator bed'});
    box([ex[0],y0+.2,GZ(12.7)],[ex[1],y0+.52,GZ(13.25)],GRND,{name:'generator sump'});box([ex[0],y0+.52,GZ(12.65)],[ex[1],y0+.95,GZ(13.3)],GRN,{name:'generator engine'});
    for(let i=0;i<4;i++){const x0=Math.min(ex[0],ex[1])+.12+i*.26;deco([x0,y0+.95,zc-.2],[x0+.2,y0+1.08,zc+.2],GRN);deco([x0+.02,y0+1.08,zc-.16],[x0+.18,y0+1.18,zc+.16],COV);}
    bar([ex[0],y0+1.05,zc+.28],[ex[1],y0+1.05,zc+.28],.05,LAG,'paint');cyl(.11,.11,.16,[s*1.7,y0+1.05,zc+.28],CAST,{rot:[0,0,Math.PI/2],seg:14,name:'generator turbocharger'});
    bar([s*1.75,y0+1.1,zc+.28],[s*1.75,y1-.15,zc+.28],.09,LAG,'paint');
    cyl(.32,.32,.6,[s*2.05,y0+.6,zc],L.alternator,{rot:[0,0,Math.PI/2],seg:18,name:'alternator'});for(const k of [-.2,-.1,0,.1,.2])cyl(.335,.335,.02,[s*(2.05+k),y0+.6,zc],0x1f2f52,{rot:[0,0,Math.PI/2],seg:18});
    deco([s*2.05-.1,y0+.92,zc-.12],[s*2.05+.1,y0+1.08,zc+.12],COV);
    // The louvred end bell outboard (the photographs' alternators breathe through louvres), and the set's own panel
    cyl(.3,.3,.08,[s*2.39,y0+.6,zc],0x1f2f52,{rot:[0,0,Math.PI/2],seg:18,name:'alternator end bell'});for(const k of [-.18,-.09,0,.09,.18])deco([s*2.43-.005,y0+.6+k-.015,zc-.22],[s*2.43+.005,y0+.6+k+.015,zc+.22],0x15223d);
    deco([s*.6-.1,y0+.95,GZ(12.55)+.06],[s*.6+.1,y0+1.25,GZ(12.55)+.09],0x6b7375);dial('RPM','×100',.6,.09,[s*.6,y0+1.15,GZ(12.55)+.059],Math.PI,{red:[.92,1],live:(s>0?'gen1':'gen2')+'.rpm',range:[0,30]});
    cyl(.012,.012,.02,[s*.6-.05,y0+1.02,GZ(12.55)+.06],0x2f8f4f,{rot:[Math.PI/2,0,0],seg:8,name:'start button'});cyl(.012,.012,.02,[s*.6+.05,y0+1.02,GZ(12.55)+.06],L.red,{rot:[Math.PI/2,0,0],seg:8,name:'stop button'});
    plate(makerPlate('genset',s>0?1:2),.3,.14,[s*1.2,y0+.42,GZ(12.55)-.005],Math.PI,{name:'maker’s plate: generator No.'+(s>0?1:2)});tagPlate(tagOf('fuel',s>0?'fuel-gen1':'fuel-gen2').replace(/ .*$/,'')+' · '+(s>0?'13':'14')+'MKA10 AG001',[s*1.2,y0+.53,GZ(12.55)-.005],Math.PI,{w:.3});
   }
  }
  // Port, along her side: the air compressor and the two 150 L starting-air bottles by the ladder's foot, the
  // workbench with its vice, the fuel purifier, the oily-water separator.
  // (The bottles stand against the aft bulkhead, side by side, so the way forward from the ladder's foot is clear.)
  bar([2.3,y0,Z(8.75)],[2.3,y0+1.3,Z(8.75)],.2,0x4f8fb0);bar([2.75,y0,Z(8.75)],[2.75,y0+1.3,Z(8.75)],.2,0x4f8fb0);
  box([2.08,y0,a],[2.97,y0+1.3,Z(8.97)],0x4f8fb0,{draw:false,name:'air bottles'});
  box([2.7,y0,Z(8.97)],[3.1,y0+.6,Z(9.3)],0x5f6a6c,{draw:false,name:'air compressor'});   // outboard of the port engine's local stand
  {const L=JOHANSSON_MARINE.livery,cx=2.9,cz=Z(9.13);                                                             // the JC-30: a two-stage V compressor on its motor, the flywheel aft
   deco([2.7,y0,Z(8.97)],[3.1,y0+.1,Z(9.3)],0x3a3f41);deco([2.78,y0+.1,Z(9.02)],[3.02,y0+.4,Z(9.25)],L.green);
   cyl(.055,.055,.22,[cx-.1,y0+.5,cz],L.cover,{rot:[0,0,.45],seg:10,name:'compressor cylinder'});cyl(.045,.045,.2,[cx+.1,y0+.5,cz],L.cover,{rot:[0,0,-.45],seg:10,name:'compressor cylinder'});
   cyl(.16,.16,.04,[cx,y0+.3,Z(8.99)],L.cover,{rot:[Math.PI/2,0,0],seg:16,name:'compressor flywheel'});cyl(.09,.09,.26,[cx,y0+.25,Z(9.43)],L.alternator,{rot:[Math.PI/2,0,0],seg:14,name:'compressor motor'});
   anchor('air','c1',[cx,y0+.62,cz],'up');                                                                                   // the delivery line to the bottles is routed from the diagram
   dial('AIR','bar',.72,.07,[cx,y0+.46,Z(9.265)],0,{red:[0,.5],live:'air0',range:[0,30]});plate(makerPlate('compressor'),.18,.08,[cx,y0+.25,Z(9.255)],0,{name:'maker’s plate: compressor'});tagPlate(tagOf('air','c1'),[cx,y0+.57,Z(9.3)+.001],0);
   for(const [x,id] of [[2.3,'b1'],[2.75,'b2']]){anchor('air',id,[x,y0+1.3,Z(8.75)],'fwd');anchor('air',id==='b1'?'sv1':'sv2',[x,y0+1.52,Z(8.95)],'up',{local:true});anchor('air',id==='b1'?'dr1':'dr2',[x,y0+.05,Z(8.95)],'fwd',{local:true});
    cyl(.02,.02,.06,[x,y0+1.52,Z(8.95)],0xb8a060,{seg:6,name:'safety valve'});cyl(.012,.012,.04,[x,y0+.05,Z(8.95)],0xb8a060,{rot:[Math.PI/2,0,0],seg:6,name:'drain cock'});
    dial('BOTTLE','bar',.7,.06,[x,y0+1.42,Z(8.75)-.03],Math.PI,{live:id==='b1'?'air0':'air1',range:[0,30]});bar([x,y0+1.3,Z(8.75)],[x,y0+1.42,Z(8.75)],.03,0xb0b4b4);plate(['STARTING AIR','150 L · 30 bar'],.16,.06,[x,y0+.9,Z(8.75)+.2],0,{bg:'#f1ede2',name:'label: air bottle'});tagPlate(tagOf('air',id),[x,y0+1.0,Z(8.75)+.2],0);}
  }
  // The workbench: a top on four legs (so the spare under it shows), its vice, and the bench's box for the walk.
  box([W-.35,y0,Z(10.0)],[W,y0+.9,Z(11.5)],0x8a7356,{draw:false,name:'workbench'});deco([W-.35,y0+.8,Z(10.0)],[W,y0+.9,Z(11.5)],0x8a7356);deco([W-.32,y0+.9,Z(10.2)],[W-.2,y0+1.05,Z(10.45)],STEEL);
  for(const [x,z] of [[W-.31,Z(10.04)],[W-.04,Z(10.04)],[W-.31,Z(11.46)],[W-.04,Z(11.46)]])bar([x,y0,z],[x,y0+.8,z],.025,0x5a4a36);deco([W-.33,y0+.3,Z(10.02)],[W-.02,y0+.33,Z(11.48)],0x5a4a36);
  // The spare clutch pack for the JR-30 (the photographs: the plates on their hub, slung on a pallet), on a pallet
  // under the bench's aft end with its tag (the ladder's foot and the way forward past the bench stay clear).
  for(const k of [0,.12,.24])deco([W-.34,y0+.1,Z(10.06)+k],[W-.02,y0+.12,Z(10.11)+k],0xb08a5a);deco([W-.34,y0,Z(10.06)],[W-.02,y0+.1,Z(10.35)],0x9a7a4a);
  cyl(.11,.11,.2,[W-.18,y0+.23,Z(10.2)],0xb8bcbe,{rot:[0,0,Math.PI/2],seg:14,name:'clutch pack'});for(const k of [-.07,-.035,0,.035,.07])cyl(.125,.125,.012,[W-.18+k,y0+.23,Z(10.2)],0x6f7476,{rot:[0,0,Math.PI/2],seg:14,name:'clutch plate'});
  plate(['SPARE · JR-30','CLUTCH PACK AHEAD'],.1,.04,[W-.18,y0+.16,Z(10.06)-.001],Math.PI,{bg:'#f6f3ea',name:'label: spare clutch'});
  box([W-.5,y0,Z(11.7)],[W,y0+1.1,Z(12.3)],0x9aa3a2,{draw:false,name:'fuel purifier'});
  {const L=JOHANSSON_MARINE.livery,cx=W-.27,cz=Z(12.0);                                                            // the JF-1 purifier: the frame, the bowl under its hood, the motor outboard
   deco([W-.5,y0,Z(11.75)],[W-.04,y0+.55,Z(12.25)],0x7d8586);cyl(.2,.2,.3,[cx,y0+.7,cz],L.cast,{seg:18,name:'purifier bowl'});cyl(.21,.17,.14,[cx,y0+.92,cz],L.green,{seg:18,name:'purifier hood'});
   cyl(.07,.07,.3,[W-.12,y0+.3,cz],L.alternator,{seg:12,name:'purifier motor'});bar([cx-.2,y0+.9,cz],[cx-.35,y0+1.6,cz],.02,0x8a6a3a,'paint');bar([cx,y0+.99,cz],[cx,y0+1.2,cz],.02,0x8a6a3a,'paint');
   plate(makerPlate('purifier'),.2,.09,[W-.51,y0+.3,cz],-Math.PI/2,{name:'maker’s plate: purifier'});tagPlate(tagOf('fuel','purifier'),[W-.51,y0+.17,cz],-Math.PI/2);dial('BOWL','rpm',.65,.07,[W-.51,y0+.48,cz-.12],-Math.PI/2);
  }
  box([W-.55,y0,Z(12.65)],[W,y0+1.0,Z(13.3)],0x6f8a7f,{draw:false,name:'oily-water separator'});
  {const L=JOHANSSON_MARINE.livery,cx=W-.3,cz=Z(13.05);                                                            // the JO-15 separator: the vessel on legs, its sight glass, the 15 ppm monitor
   cyl(.26,.26,.8,[cx,y0+.55,cz],0x6f8a7f,{seg:18,cls:'paint',name:'separator vessel'});cyl(.27,.27,.03,[cx,y0+.2,cz],0x5e7a6e,{seg:18,cls:'paint'});cyl(.27,.27,.03,[cx,y0+.9,cz],0x5e7a6e,{seg:18,cls:'paint'});
   for(const [dx,dz] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])bar([cx+dx,y0,cz+dz],[cx+dx,y0+.15,cz+dz],.02,0x3a3f41);
   bar([cx-.27,y0+.3,cz],[cx-.27,y0+.8,cz],.015,0xdfe8ee);deco([cx-.14,y0+.98,cz-.07],[cx+.14,y0+1.12,cz+.07],0x9aa3a2);cyl(.01,.01,.02,[cx-.06,y0+1.05,cz-.075],0x2f8f4f,{rot:[Math.PI/2,0,0],seg:8,name:'monitor lamp'});
   plate(makerPlate('separator'),.2,.09,[W-.57,y0+.5,cz],-Math.PI/2,{name:'maker’s plate: separator'});tagPlate(tagOf('bilge','ows'),[W-.57,y0+.37,cz],-Math.PI/2);plate(['15 ppm','BILGE MONITOR'],.12,.05,[cx,y0+1.05,cz-.071],Math.PI,{bg:'#f1ede2',name:'label: bilge monitor'});
  }
  // Starboard: the control booth aft (2.4 × 2.0 m, glazed towards the engines), the pumps along her side (two fire
  // pumps, the general-service pump, the bilge pump, the sanitary pump, the hydrophore set), the fuel service tank
  // in the forward corner.
  {const B0=Z(8.6),B1=Z(10.9),BI=-2.35;
   wall('x',-W,BI,B1-T/2,B1+T/2,y0,y1,[doorAt(-2.95,.7,y0,FERRY_H1_ENABLED?FERRY_H1.boothDoorHeight:1.85)],0xd8d2c0);
   wall('z',a,B1,BI-T/2,BI+T/2,y0,y1,[{s0:Z(9.2),s1:Z(10.5),y0:y0+1.0,y1:y0+1.7,glass:true}],0xd8d2c0);
   deco([-W,y0+.003,a],[BI,y0+.008,B1],0x7d7a6c);
   // The main switchboard, Johansson Marine JE-440 (the photographs: a board of round meters, lamps and handles),
   // five panels across its face: generator No.1, the synchronising panel, generator No.2, the 440 V feeders with
   // the earth lamps (an IT system: three lamps, all alight when nothing is earthed) and the insulation meter, and
   // the 105 V lighting panel. In port No.1 carries the ship: its meters read, No.2's stand at zero.
   box([-W+.02,y0,a+.02],[BI-.1,y0+1.85,a+.4],0x9aa3a2,{name:'main switchboard'});tagPlate('10BRA10 GS001',[-W+.3,y0+1.9,a+.401],0);
   {const L=JOHANSSON_MARINE.livery,F=a+.401,x0=-W+.02,pw=(BI-.1-x0)/5,PANELS=['GENERATOR No.1','SYNCHRONISING','GENERATOR No.2','440 V FEEDERS','105 V LIGHTING'];
    deco([x0,y0+1.72,a+.39],[BI-.1,y0+1.85,a+.405],0x3a4244);                                                       // the name strip over the panels
    PANELS.forEach((name,i)=>{const px=x0+pw*i,cx=px+pw/2;deco([px+.005,y0+.05,a+.39],[px+pw-.005,y0+1.72,a+.4],0x8f9a99);
     plate([name],pw-.03,.06,[cx,y0+1.785,F+.005],0,{bg:'#3a4244',fg:'#e8e2cc',name:'label: '+name.toLowerCase()});
     const gen=i===0||i===2,on=i===0;
     if(gen){const v=on?.78:0,A=on?.3:0,kW=on?.35:0,hz=on?.5:0;
      const gid=i===0?'gen1':'gen2';
      dial('kW','0–150',kW,.11,[cx-.07,y0+1.5,F],0,{live:gid+'.kW',range:[0,150]});dial('A','0–250',A,.11,[cx+.07,y0+1.5,F],0,{red:[.85,1],live:gid+'.A',range:[0,250]});dial('V','0–500',v,.11,[cx-.07,y0+1.32,F],0,{live:gid+'.V',range:[0,500]});dial('Hz','55–65',hz,.11,[cx+.07,y0+1.32,F],0,{live:gid+'.Hz',range:[55,65]});
      deco([cx-.09,y0+.75,a+.4],[cx+.09,y0+1.05,F+.01],0x1f2224);deco([cx-.02,y0+.78,F+.01],[cx+.02,on?y0+1.02:y0+.9,F+.02],0xe8e2cc);   // the breaker in its frame; the handle up when closed
      plate(['ACB','200 A'],.12,.04,[cx,y0+1.1,F+.005],0,{bg:'#f1ede2',name:'label: breaker'});
      cyl(.012,.012,.02,[cx-.06,y0+1.18,F],on?0x2f8f4f:0x1e4a2b,{rot:[Math.PI/2,0,0],seg:8,name:'breaker lamp'});cyl(.012,.012,.02,[cx+.06,y0+1.18,F],on?0x5a1f1a:L.red,{rot:[Math.PI/2,0,0],seg:8,name:'breaker lamp'});
      cyl(.02,.02,.03,[cx-.06,y0+.55,F],0x1f2224,{rot:[Math.PI/2,0,0],seg:8,name:'governor switch'});cyl(.02,.02,.03,[cx+.06,y0+.55,F],0x1f2224,{rot:[Math.PI/2,0,0],seg:8,name:'selector switch'});
      plate(['GOVERNOR','RAISE · LOWER'],.11,.035,[cx-.06,y0+.47,F+.005],0,{bg:'#f1ede2',name:'label: governor'});plate(['AMMETER','R · S · T'],.11,.035,[cx+.06,y0+.47,F+.005],0,{bg:'#f1ede2',name:'label: ammeter switch'});
     }else if(i===1){
      dial('SYNCHROSCOPE','SLOW · FAST',.5,.16,[cx,y0+1.45,F],0,{bg:'#e9e4d6'});dial('V','BUS',.78,.09,[cx-.08,y0+1.2,F],0);dial('V','INCOMING',0,.09,[cx+.08,y0+1.2,F],0);
      for(const k of [-.07,0,.07])cyl(.012,.012,.02,[cx+k,y0+1.04,F],0x3b3326,{rot:[Math.PI/2,0,0],seg:8,name:'synchronising lamp'});
      plate(['SYNCHRONISING LAMPS'],.2,.03,[cx,y0+.98,F+.005],0,{bg:'#f1ede2',name:'label: synchronising lamps'});
      cyl(.02,.02,.03,[cx,y0+.8,F],0x1f2224,{rot:[Math.PI/2,0,0],seg:8,name:'synchroscope switch'});plate(['SYNCHROSCOPE','OFF · 1 · 2'],.12,.035,[cx,y0+.7,F+.005],0,{bg:'#f1ede2',name:'label: synchroscope switch'});
      plate(makerPlate('switchboard'),.22,.1,[cx,y0+.35,F+.005],0,{name:'maker’s plate: main switchboard'});
     }else if(i===3){
      for(const k of [-.07,0,.07])cyl(.016,.016,.02,[cx+k,y0+1.55,F],0xf3dc8a,{rot:[Math.PI/2,0,0],seg:8,name:'earth lamp'});
      plate(['EARTH LAMPS','R · S · T'],.2,.04,[cx,y0+1.47,F+.005],0,{bg:'#f1ede2',name:'label: earth lamps'});
      dial('INSULATION','MΩ',.8,.11,[cx,y0+1.28,F],0,{red:[0,.15]});cyl(.02,.02,.03,[cx,y0+1.12,F],0x1f2224,{rot:[Math.PI/2,0,0],seg:8,name:'earth test switch'});
      ['STEERING 1','FIRE PUMP 1','FIRE PUMP 2','BOW THRUSTER','RAMP PACK','GALLEY','WINDLASS','ER PUMPS'].forEach((f,j)=>{const r=Math.floor(j/2),c=j%2,bx=cx+(c?.06:-.06),by=y0+.95-r*.17;
       deco([bx-.03,by-.03,a+.4],[bx+.03,by+.05,F+.008],0x1f2224);deco([bx-.008,by-.01,F+.008],[bx+.008,by+.04,F+.014],0xe8e2cc);
       plate([f],.1,.025,[bx,by-.05,F+.005],0,{bg:'#f1ede2',name:'label: feeder '+f.toLowerCase()});});
     }else{
      dial('V','0–150',.7,.1,[cx-.06,y0+1.5,F],0);dial('A','0–100',.4,.1,[cx+.06,y0+1.5,F],0);
      plate(['LIGHTING','TRANSFORMER 440/105 V'],.22,.04,[cx,y0+1.35,F+.005],0,{bg:'#f1ede2',name:'label: lighting transformer'});
      ['ER LIGHTS','CAR DECK','PASSENGER DECK','BRIDGE','NAV LIGHTS','GALLEY','CABINS','SHORE SUPPLY'].forEach((f,j)=>{const r=Math.floor(j/2),c=j%2,bx=cx+(c?.06:-.06),by=y0+1.2-r*.17;
       deco([bx-.03,by-.03,a+.4],[bx+.03,by+.05,F+.008],0x1f2224);deco([bx-.008,by-.01,F+.008],[bx+.008,by+.04,F+.014],0xe8e2cc);
       plate([f],.1,.025,[bx,by-.05,F+.005],0,{bg:'#f1ede2',name:'label: feeder '+f.toLowerCase()});});
      cyl(.012,.012,.02,[cx,y0+.5,F],0x2f8f4f,{rot:[Math.PI/2,0,0],seg:8,name:'shore lamp'});plate(['SHORE','CONNECTED'],.1,.035,[cx,y0+.42,F+.005],0,{bg:'#f1ede2',name:'label: shore'});
     }});
   }
   // The engine control console (the creator's photographs, 2026-10-12, of an engine control room: a mint-green desk
   // console with a raised panel of dials, the alarm matrix of red and amber squares, the telegraph levers, the
   // telephone, a grab rail along the front, the clock and the fire plan over it): the log desk's top, the panel
   // along her side with the shaft rpm dials, lube-oil and water dials for each engine, the 4 × 8 alarm matrix with
   // one amber lamp lit (FUEL LEVEL, the service tank wants topping up), the two telegraph levers at STOP, the
   // handset on its cradle, the log, the pen, the mug.
   const MINT=0xa9c4b0;
   box([-W+.02,y0,Z(9.6)],[-W+.6,y0+.78,Z(10.6)],MINT,{name:'engine panel and log desk'});deco([-W+.05,y0+.78,Z(9.65)],[-W+.58,y0+.8,Z(10.55)],0xe8e2cc);
   bar([-W+.62,y0+.7,Z(9.62)],[-W+.62,y0+.7,Z(10.58)],.015,0x1f2224);                                                  // the grab rail along the front
   deco([-W+.1,y0+.802,Z(9.7)],[-W+.42,y0+.815,Z(10.0)],0x2f4a7a);deco([-W+.12,y0+.815,Z(9.73)],[-W+.4,y0+.82,Z(9.97)],0xf6f3ea);        // the engine-room log, open
   bar([-W+.2,y0+.82,Z(10.05)],[-W+.35,y0+.82,Z(10.09)],.004,0x1f2224);cyl(.035,.03,.08,[-W+.15,y0+.84,Z(10.5)],0xf1ede2,{seg:12,cls:'paint',name:'coffee mug'});
   deco([-W+.02,y0+.78,Z(9.6)],[-W+.3,y0+1.5,Z(10.6)],MINT);tagPlate('10CMA10 GS001',[-W+.301,y0+1.54,Z(10.1)],Math.PI/2);                                   // the raised panel, and its tag
   const PF=-W+.301;
   dial('RPM PORT','×100',0,.13,[PF,y0+1.41,Z(9.74)],Math.PI/2,{red:[.9,1],live:'mainP.rpm',range:[0,10]});dial('RPM STBD','×100',0,.13,[PF,y0+1.41,Z(10.46)],Math.PI/2,{red:[.9,1],live:'mainS.rpm',range:[0,10]});
   dial('LO PRESS P','bar',.55,.1,[PF,y0+1.41,Z(9.92)],Math.PI/2,{red:[0,.2],live:'mainP.loPress',range:[0,6]});dial('WATER P','°C',.6,.1,[PF,y0+1.41,Z(10.04)],Math.PI/2,{red:[.85,1],live:'mainP.water',range:[0,100]});dial('WATER S','°C',.6,.1,[PF,y0+1.41,Z(10.16)],Math.PI/2,{red:[.85,1],live:'mainS.water',range:[0,100]});dial('LO PRESS S','bar',.55,.1,[PF,y0+1.41,Z(10.28)],Math.PI/2,{red:[0,.2],live:'mainS.loPress',range:[0,6]});
   // The readout strip under the dials: every reading written out (the engines, the board, the air, the tanks), live.
   plate(['','','',''],.78,.11,[PF+.004,y0+1.285,Z(10.1)],Math.PI/2,{kind:'readout',live:'readout',bg:'#101416',fg:'#9fe3a8',name:'console readout'});
   // The alarm matrix: 4 × 8 lamps (PLANT_ALARMS, red the first sixteen, amber the rest), lit from the plant's readings (6r-2).
   plate(PLANT_ALARMS,.78,.22,[PF+.004,y0+1.105,Z(10.1)],Math.PI/2,{kind:'alarms',live:'alarms',bg:'#2a2d2f',name:'alarm matrix'});
   plate(['ALARMS · press to acknowledge'],.76,.03,[PF+.003,y0+.965,Z(10.1)],Math.PI/2,{bg:'#f1ede2',name:'label: engine alarms'});
   for(const [z,lab] of [[Z(9.85),'PORT'],[Z(10.35),'STBD']]){deco([-W+.32,y0+.8,z-.06],[-W+.46,y0+.86,z+.06],0x1f2224);bar([-W+.39,y0+.86,z],[-W+.39,y0+1.0,z],.008,0x1f2224);cyl(.018,.018,.02,[-W+.39,y0+1.0,z],0x1f2224,{seg:8,name:'telegraph lever'});
    plate(['AHEAD · STOP · ASTERN',lab],.12,.03,[-W+.39,y0+.861,z],0,{rotX:-Math.PI/2,bg:'#f1ede2',name:'label: telegraph '+lab.toLowerCase()});}
   deco([-W+.46,y0+.8,Z(10.5)-.06],[-W+.56,y0+.84,Z(10.5)+.06],0x1f2224);bar([-W+.51,y0+.84,Z(10.44)],[-W+.51,y0+.84,Z(10.56)],.02,0x1f2224);  // the telephone and its handset
   cyl(.07,.07,.02,[-W+.03,y0+1.75,Z(10.1)],0xf6f3ea,{rot:[0,0,Math.PI/2],seg:14,name:'clock'});deco([-W+.035,y0+1.74,Z(10.1)-.002],[-W+.042,y0+1.8,Z(10.1)+.002],DARK);deco([-W+.035,y0+1.75-.002,Z(10.1)],[-W+.042,y0+1.75+.002,Z(10.14)],DARK);
   safetyPlan([-W+.031,y0+1.62,Z(9.95)],Math.PI/2,{deck:'hold',z:9.95,x:-3.5},'control booth');
   bar([-3.1,y0,Z(10.0)],[-3.1,y0+.45,Z(10.0)],.2,0x3a4244);box([-3.3,y0,Z(10.0)-.2],[-2.9,y0+.45,Z(10.0)+.2],0x3a4244,{draw:false,name:'booth chair'});
   floor('control-booth',[-W,BI],[a,B1+.4],y0,(x,z,r)=>{if(z>B1-T/2-r)return Math.abs(x+2.95)<=.35-r+.06;return x>=(z<Z(9.55)?-W+.15:-W+.5)+r&&x<=BI-T/2-r&&z>=a+.4+r;});   // the strip in front of the switchboard is clear to the lining (the desk is forward of it): the generator panels are worked from it (6r-2)
  }
  {const L=JOHANSSON_MARINE.livery,PUMPS=[['firePump',1,RED,'FIRE & GS No.1',tagOf('fire','fp1'),['fire','fp1']],['firePump',2,RED,'FIRE & BILGE No.2',tagOf('fire','fp2'),['fire','fp2'],['bilge','fbp']],['gsPump',1,0x3f8a5a,'GENERAL SERVICE',tagOf('seawater','gs'),['seawater','gs'],['bilge','gs2']],['bilgePump',1,0x4f7fb0,'BILGE',tagOf('bilge','bp'),null,['bilge','bp']],['sanitaryPump',1,0x4f7fb0,'SANITARY No.1',tagOf('sewage','sp1'),['sewage','sp1']],['hydrophore',1,0x4f7fb0,'HYDROPHORE No.1',tagOf('freshwater','hp1'),['freshwater','hp1']]];
   deco([-W,y0,Z(10.95)],[-W+.55,y0+.03,Z(12.6)],0x3a3f41);                                                        // the drip tray under the row
   PUMPS.forEach(([key,serial,hex,label,tag,top,suction],i)=>{const z=Z(11.0)+i*.27+.125;tagPlate(tag,[-W+.25,y0+.52,z+.126],0);
    if(top)anchor(top[0],top[1],[-W+.1,y0+.5,z],'up');if(suction)anchor(suction[0],suction[1],[-W+.5,y0+.25,z],'port');     // the delivery leaves the top, the suction comes in low from inboard
    box([-W,y0,z-.125],[-W+.5,y0+.55,z+.125],hex,{draw:false,name:'pump'});deco([-W+.02,y0+.03,z-.12],[-W+.48,y0+.12,z+.12],0x3a3f41);
    cyl(.1,.1,.14,[-W+.1,y0+.3,z],hex,{rot:[0,0,Math.PI/2],seg:14,cls:'paint',name:'pump casing'});cyl(.04,.04,.1,[-W+.1,y0+.44,z],hex,{seg:10,cls:'paint',name:'pump branch'});
    cyl(.05,.05,.06,[-W+.2,y0+.3,z],0xe0b93a,{rot:[0,0,Math.PI/2],seg:10,cls:'paint',name:'coupling guard'});
    cyl(.09,.09,.24,[-W+.35,y0+.3,z],L.alternator,{rot:[0,0,Math.PI/2],seg:14,name:'pump motor'});deco([-W+.3,y0+.39,z-.04],[-W+.4,y0+.46,z+.04],L.cover);
    bar([-W+.1,y0+.6,z],[-W+.1,y0+.66,z],.045,0x9ea4a6);                                                              // the delivery's flange
    plate(makerPlate(key,serial),.14,.065,[-W+.35,y0+.2,z+.091],0,{name:'maker’s plate: '+label.toLowerCase()});plate([label],.2,.04,[-W+.25,y0+.09,z+.121],0,{bg:'#f1ede2',name:'label: '+label.toLowerCase()});});
  }
  // The fuel service tank (1.6 m³) in the forward starboard corner, its gauge glass and quick-closing valve.
  // The 1.6 m³ service tank: 0.75 × 1.38 m on the plates, 1.55 m high, so the pipe lanes under the deckhead pass over it.
  box([-W,y0,Z(12.62)],[-(W-.75),y0+1.55,f],0x8a6a3a,{name:'fuel service tank'});tagPlate(tagOf('fuel','service'),[-(W-.75)-.001,y0+1.2,Z(13.3)],Math.PI/2);deco([-(W-.76),y0+.2,Z(13.0)],[-(W-.77),y0+1.4,Z(13.05)],0xdfe8ee);
  // (The pipe runs along her sides overhead are routed from the piping diagrams: the anchors below, ferry-pipe-routes.js.)
  // The escape ladder in the aft starboard corner, up the trunk into casing S (its hatch closed above).
  for(const x of [-W+.15,-W+.55])bar([x,y0,a+.12],[x,y1,a+.12],.025,STEEL);for(let yy=y0+.3;yy<y1;yy+=.3)bar([-W+.15,yy,a+.12],[-W+.55,yy,a+.12],.018,STEEL);
  // Hand rails round each main engine on stanchions, 0.4 m off its block (yellow: a thing you hold in a seaway and never
  // step over), and the cable trays along the deckhead from the switchboard to the generators and the pumps.
  for(const s of [1,-1]){const X=S2(s,.65,2.45),z0=Z(9.3),z1=Z(12.4);
   const posts=[[X[0],z0],[X[1],z0],[X[0],z1],[X[1],z1],[X[0],(z0+z1)/2],[X[1],(z0+z1)/2]];
   if(FERRY_H1_ENABLED){const ix=s*.65;for(let i=posts.length-1;i>=0;i--)if(Math.abs(posts[i][0]-ix)<.001&&posts[i][1]>Z(FERRY_H1.serviceOpening.from)&&posts[i][1]<Z(FERRY_H1.serviceOpening.to))posts.splice(i,1);posts.push([ix,Z(FERRY_H1.serviceOpening.from)],[ix,Z(FERRY_H1.serviceOpening.to)]);}
   for(const [px,pz] of posts)bar([px,y0,pz],[px,y0+.95,pz],.02,YELLOW,'paint');
   for(const h of [.5,.95]){for(const rx of X){if(FERRY_H1_ENABLED&&Math.abs(rx-s*.65)<.001){bar([rx,y0+h,z0],[rx,y0+h,Z(FERRY_H1.serviceOpening.from)],.018,YELLOW,'paint');bar([rx,y0+h,Z(FERRY_H1.serviceOpening.to)],[rx,y0+h,z1],.018,YELLOW,'paint');}else bar([rx,y0+h,z0],[rx,y0+h,z1],.018,YELLOW,'paint');}bar([X[0],y0+h,z0],[X[1],y0+h,z0],.018,YELLOW,'paint');bar([X[0],y0+h,z1],[X[1],y0+h,z1],.018,YELLOW,'paint');}
   for(const rx of X){const runs=FERRY_H1_ENABLED&&Math.abs(rx-s*.65)<.001?[[z0-.02,Z(FERRY_H1.serviceOpening.from)+.02],[Z(FERRY_H1.serviceOpening.to)-.02,z1+.02]]:[[z0-.02,z1+.02]];for(const [ra,rb]of runs)box([rx-.02,y0,ra],[rx+.02,y0+.95,rb],YELLOW,{draw:false,camera:false,name:'engine rail'});}
   box([X[0],y0,z0-.02],[X[1],y0+.95,z0+.02],YELLOW,{draw:false,camera:false,name:'engine rail'});box([X[0],y0,z1-.02],[X[1],y0+.95,z1+.02],YELLOW,{draw:false,camera:false,name:'engine rail'});
   deco([s*2.6-.15,y1-.3,a+.2],[s*2.6+.15,y1-.22,f-.2],0x8c9193,{cls:'metal'});for(let z=a+.6;z<f;z+=.5)deco([s*2.6-.16,y1-(FERRY_H1_ENABLED?.28:.32),z-.01],[s*2.6+.16,y1-.2,z+.01],0x6f7476,{cls:'metal'});
  }
  // What a watchkeeper works with. The sea chests, low against her sides forward, their suction valves and strainers
  // (the cooling and fire pumps draw through them); each main engine's local control stand at its gearbox, for
  // when the bridge control fails; the fuel lines from the service tank to the engines; the shaft seals where the
  // shafts leave through the aft bulkhead; two 200 L lubricating-oil drums; the tool board; the extinguishers; the
  // CO₂ nozzles overhead; the sounding pipes to the double bottom's tanks; the telephone to the bridge in the booth.
  for(const s of [1,-1]){
   // The sea chests are under the floor plates against her sides (a hatch in the plates over each); both strainers
   // stand in the port forward corner, the starboard chest's suction crossing under the plates, so the walkway along
   // the forward bulkhead stays clear (ferry-walk.test.mjs walks it).
   const x=s*(W-.35);deco([Math.min(x-.25,x+.25),y0+.004,Z(13.3)],[Math.max(x-.25,x+.25),y0+.012,Z(13.7)],0x6f7476,{cls:'metal'});deco([Math.min(x-.22,x+.22),y0+.012,Z(13.33)],[Math.max(x-.22,x+.22),y0+.016,Z(13.67)],0x8c9193,{cls:'metal'});
   // The sea-water strainer (the photographs: a round bolted cover over the basket, and what the basket catches):
   // the housing, its cover on eight studs, the suction valve's handwheel, the drain cock.
   {const sx=3.5,sz=s>0?Z(13.5):Z(13.82);cyl(.16,.16,.42,[sx,y0+.21,sz],0x2f6f74,{seg:14,cls:'paint',name:'strainer housing'});cyl(.19,.19,.03,[sx,y0+.435,sz],0x2f6f74,{seg:14,cls:'paint',name:'strainer cover'});
    for(let k=0;k<8;k++){const a=k*Math.PI/4;cyl(.012,.012,.035,[sx+Math.cos(a)*.17,y0+.465,sz+Math.sin(a)*.17],0xb8a060,{seg:6,name:'strainer stud'});}
    anchor('seawater',s>0?'strP':'strS',[sx,y0+.21,sz],'stbd',{local:true});anchor('seawater',s>0?'chestP':'chestS',[s>0?W-.35:-(W-.35),y0+.03,Z(13.5)],'up',{local:true});cyl(.05,.05,.02,[sx,y0+.52,sz],RED,{seg:10,name:'strainer handwheel'});bar([sx,y0+.45,sz],[sx,y0+.52,sz],.01,DARK);
    cyl(.012,.012,.06,[sx-.17,y0+.06,sz],0xb8a060,{rot:[0,0,Math.PI/2],seg:6,name:'strainer drain cock'});
    if(s>0)box([3.3,y0,Z(13.32)],[3.7,y0+.5,f],0x2f6f74,{draw:false,name:'sea-water strainer'});
    plate([s>0?'SEA CHEST P':'SEA CHEST S','STRAINER · basket Mondays'],.12,.05,[sx-.161,y0+.3,sz],-Math.PI/2,{bg:'#f1ede2',name:'label: strainer'});tagPlate(tagOf('seawater',s>0?'strP':'strS'),[sx-.161,y0+.37,sz],-Math.PI/2);}
   const cx=s*1.55;box([cx+s*.55-.15,y0,Z(9.15)],[cx+s*.55+.15,y0+1.05,Z(9.45)],0x9aa3a2,{name:'local control stand'});
   bar([cx+s*.55,y0+1.05,Z(9.3)],[cx+s*.55,y0+1.3,Z(9.4)],.015,RED);
   bar([cx,y0+.45,a+.02],[cx,y0+.45,a+.12],.11,0x6f7476);
   // The fuel line to this engine: along the deckhead from the service tank's run, forward of the generator, down by
   // the turbo end inboard to a quick-closing valve, then aft along the block's inboard edge to the pump block.
   {const inb=-s*.45,out=s*.45,E0=Z(9.7),E1=Z(11.95),fx=cx+inb*.75,id=s>0?'mainP':'mainS';
    anchor('fuel','fuel-'+id,[fx,y0+1.15,E0+.3],'up');cyl(.03,.03,.05,[fx,y0+1.45,E0+.3],JOHANSSON_MARINE.livery.red,{rot:[0,0,Math.PI/2],seg:10,name:'fuel valve handwheel'});
    anchor('lube','sump-'+id,[cx+inb*1.0,y0+.4,E0+.6],inb>0?'port':'stbd',{local:true,off:.12});anchor('lube','lop-'+id,[cx,y0+.3,E1+.25],'fwd',{local:true,off:.12});anchor('lube','lof-'+id,[cx+.14,y0+.6,E1+.25],'fwd',{local:true,off:.12});
    anchor('lube','loc-'+id,[cx+out*.9,y0+.7,E1-.4],out>0?'port':'stbd',{local:true});anchor('lube','bear-'+id,[cx,y0+1.12,E0+1.2],'up',{local:true});
    // The electric priming pump at the engine's forward inboard foot (the load lube-priming), and its tag.
    anchor('lube','prime-'+id,[cx+inb*.6,y0+.3,E1+.35],'up',{local:true});cyl(.06,.06,.16,[cx+inb*.6,y0+.12,E1+.35],JOHANSSON_MARINE.livery.alternator,{rot:[0,0,Math.PI/2],seg:10,name:'priming pump motor'});cyl(.07,.07,.08,[cx+inb*.72,y0+.12,E1+.35],JOHANSSON_MARINE.livery.green,{rot:[0,0,Math.PI/2],seg:10,cls:'paint',name:'priming pump'});
    tagPlate(tagOf('lube','prime-'+id),[cx+inb*.6,y0+.22,E1+.42],0);
    anchor('jacket','exp-'+id,[cx+out*.3,y0+1.55,E1+.1],'up',{local:true});anchor('jacket','jwp-'+id,[cx-.25,y0+.75,E1+.21],'fwd',{local:true});anchor('jacket','blk-'+id,[cx,y0+1.12,(E0+E1)/2],'up',{local:true});
    anchor('jacket','thermo-'+id,[cx+out*.2,y0+1.5,E1-.1],'up',{local:true});anchor('jacket','jwc2-'+id,[cx+out*.95,y0+.9,E1-.3],out>0?'port':'stbd',{local:true});
    anchor('seawater','swp-'+id,[cx+.25,y0+.7,E1+.2],'fwd',{local:true});anchor('seawater','cac-'+id,[cx+out*.3,y0+1.1,E1+.32],'fwd',{local:true});anchor('seawater','jwc-'+id,[cx+out*.95,y0+.9,E1-.3],out>0?'port':'stbd',{local:true});
    anchor('air','start-'+id,[cx+inb*.3,y0+1.3,E0+.5],'up');}
   for(const z of [Z(9.5),Z(12.4)])bar([s*.9,y1-.02,z],[s*.9,y1-.15,z],.03,0xb03a2a);
   bar([s*(W-.08),y0,Z(10.8)],[s*(W-.08),y1,Z(10.8)],.025,0x7d8586);bar([s*(W-.08),y0,Z(12.0)],[s*(W-.08),y1,Z(12.0)],.025,0x7d8586);
  }
  // The fuel service tank's line: up from its top, across under the deckhead at Z 13.6 to both engines' drops (above).
  anchor('fuel','service',[-(W-.75),y0+1.3,Z(13.1)],'port');anchor('fuel','overflow',[-(W-.75),y0+1.5,Z(12.8)],'port');anchor('fuel','qcv',[-(W-.9),y0+1.50,Z(13.6)],'up',{off:.12});anchor('fuel','return',[.5,y1-.4,Z(13.0)],'up');
  cyl(.03,.03,.05,[-(W-.9),y0+1.50,Z(13.6)+.03],RED,{rot:[Math.PI/2,0,0],seg:10,name:'quick-closing valve'});
  // Hangers from the deckhead to the overhead runs along her sides, and a flange pair in each run (the photographs' pipework)
  for(const s of [1,-1])for(let z=a+.5;z<f-.2;z+=1.2){deco([Math.min(s*(W-.02),s*(W-.5)),y1-.06,z-.015],[Math.max(s*(W-.02),s*(W-.5)),y1-.03,z+.015],0x6f7476,{cls:'metal'});
   for(const k of [0,1,2,3])bar([s*(W-.14-k*.12),y1-.03,z],[s*(W-.14-k*.12),y1-.1,z],.006,0x6f7476);}
  for(const s of [1,-1])for(const k of [0,1,2,3])for(const z of [Z(10.2),Z(12.6)])cyl(.045,.045,.02,[s*(W-.14-k*.12),y1-.1,z],0x9ea4a6,{rot:[Math.PI/2,0,0],seg:6,name:'flange'});
  // (The 200 L lubricating-oil drums are stowed in casing P's store, not down here: the walkway along the forward
  // bulkhead is the only way round the engines and stays clear.)
  deco([1.0,y0+.9,f-.02],[2.2,y0+1.6,f],0xd8d2c0);for(let i=0;i<6;i++)deco([1.1+i*.18,y0+1.1,f-.04],[1.14+i*.18,y0+1.45,f-.02],STEEL);
  for(const [x,z] of [[3.0,Z(9.6)],[-2.2,Z(11.2)],[.9,Z(13.85)]]){bar([x,y0,z],[x,y0+.55,z],.08,RED,'paint');}
  for(let z=a+.8;z<f-.4;z+=1.1)for(const x of [-.9,.9])bar([x,y1,z],[x,y1-.1,z],.02,0xb8b8b8);
  for(const x of [-1.0,1.0])bar([x,y0,Z(8.75)],[x,y0+.5,Z(8.75)],.025,0x6f7476);
  deco([-2.75,y0+1.2,a+.4],[-2.6,y0+1.45,a+.48],DARK);
  // The floor: the plates, round the engines, the generators and what stands on them.
  floor('engine-room',[-W,W],[a,f+.1],y0,(x,z,r)=>Math.abs(x)<=W-r&&z>=a+r&&(z<=f-r||Math.abs(x)<=WT_W/2-r+.06)&&!(x<-2.35+r&&z<Z(10.9)+r));
 }
 // ---- Forward of the engine room (batch 6q): the auxiliary machinery room, the workshop and the engine store, on the
 // same floor plates, each its own room with its own door, so the way below is a line of rooms and not one box:
 // ER → the watertight sliding door at Fr 28 → the aux room → the door at Fr 38 → the workshop (port, with the passage)
 // → the opening in the mesh partition → the store (starboard). Linings, deckhead and plates as in the engine room.
 {const y0=ER.floor,y1=ER.deckhead,f=ER.fore,W=ER.side,A1=MS.auxFore,F1=MS.storeFore,PX=MS.partition,PZ=MS.partitionAft,L=JOHANSSON_MARINE.livery;
  const caged=(s,z)=>{const x=s*(W-.1);deco([Math.min(x,x-s*.1),y1-.55,z-.07],[Math.max(x,x-s*.1),y1-.35,z+.07],0xd8d2c0);cyl(.045,.045,.14,[x-s*.14,y1-.45,z],0xfff6dc,{rot:[0,0,Math.PI/2],seg:10,name:'bulkhead lamp'});
   for(const dz of [-.06,.06])bar([x-s*.1,y1-.52,z+dz],[x-s*.2,y1-.45,z+dz],.004,0x9a9ea0);bar([x-s*.2,y1-.45,z-.06],[x-s*.2,y1-.45,z+.06],.004,0x9a9ea0);};
  // The spaces: linings, the deckhead, the plates, the bulkhead at Fr 38 with its door, the forward bulkhead at Fr 45.
  for(const s of [1,-1])box([Math.min(s*W,s*(W+.06)),y0-.1,f],[Math.max(s*W,s*(W+.06)),y1,F1+.06],0xe8e6dc,{name:'machinery space side'});
  box([-W,y1,f],[W,CAR-.02,F1+.06],0xd8d6cc,{solid:false,camera:true,name:'machinery space deckhead'});
  // The car deck's plating over the deckhead: without a caster above it the sun striped the deckhead's underside with
  // shadow acne. (Its top 12 mm under the car deck's: at 5 mm the two flashed from the quay, 100 m off.)
  deco([-W,CAR-.03,f],[W,CAR-.012,F1+.06],0xd8d6cc);
  box([-W,y0-.06,f],[W,y0,F1+.06],0x8c9193,{solid:false,camera:false,name:'floor plates'});
  floorPlate('chequer',-W,W,f+.06,A1,y0+.002);floorPlate('chequer',-W,W,A1+.06,F1,y0+.002);
  wall('x',-W,W,A1,A1+.06,y0-.1,y1,[doorAt(0,MS.door38.w,y0,MS.door38.h)],0xe8e6dc);
  wall('x',-W,W,F1,F1+.06,y0-.1,y1,[doorAt(MS.door45.x,MS.door45.w,y0,MS.door45.h)],0xe8e6dc);                                   // Fr 45, with the door to the electrical workshop
  // The watertight door at Fr 28 (seen from the aux room: its leaf slid open to port in its frame, the hand pump and
  // lever beside it, the notice over it) and the hinged door at Fr 38, hooked back against the workshop's bulkhead.
  for(const x of [-WT_W/2,WT_W/2])deco([x-.05,y0,f-.02],[x+.05,y0+WT_H+.05,f+.08],TEAL);deco([-WT_W/2-.05,y0+WT_H-.05,f-.02],[WT_W/2+.05,y0+WT_H,f+.08],TEAL);
  box([WT_W/2+.06,y0+.02,f+.07],[WT_W/2+.06+WT_W,y0+WT_H,f+.11],STEEL,{name:'watertight door leaf'});for(const k of [.3,.9,1.5])deco([WT_W/2+.08,y0+k,f+.11],[WT_W/2+.04+WT_W,y0+k+.05,f+.125],0x6a7274);   // the leaf's stiffeners
  deco([-.75,y0+.8,f+.06],[-.55,y0+1.25,f+.2],0x6b7375);bar([-.65,y0+1.25,f+.13],[-.65,y0+1.6,f+.3],.012,0x1f2224);                                                           // the hand pump and its lever
  plate(['WATERTIGHT DOOR · 水密戸','KEEP CLOSED AT SEA'],.6,.08,[-1.1,y0+1.55,f+.061],0,{bg:'#f1ede2',name:'label: watertight door'});
  plate(['OPEN · CLOSE','hand pump · 30 strokes'],.16,.06,[-.65,y0+.72,f+.061],0,{bg:'#f1ede2',name:'label: door pump'});
  for(const x of [-MS.door38.w/2,MS.door38.w/2])deco([x-.04,y0,A1-.02],[x+.04,y0+MS.door38.h,A1+.08],TEAL);deco([-MS.door38.w/2-.04,y0+MS.door38.h,A1-.02],[MS.door38.w/2+.04,y0+MS.door38.h+.04,A1+.08],TEAL);
  box([MS.door38.w/2+.05,y0+.02,A1+.06],[MS.door38.w/2+.05+MS.door38.w,y0+MS.door38.h-.02,A1+.1],DOOR,{name:'workshop door leaf'});
  deco([-1.25,y0+1.50,A1-.025],[-.65,y0+1.75,A1-.005],0x24585c);                                                                                                                  // the sign over it: 工作室 WORKSHOP
  // Lights in their cages and the fire-detection heads, the pipe runs along both sides (sea water, fresh water, the
  // fire main), the ballast line to port, the hangers, the cable tray, the frames showing in the workshop and the store.
  for(const s of [1,-1])for(const z of [Z(15.3),Z(17.6),Z(20.0),Z(21.9)])caged(s,z);
  for(const [x,z] of [[0,Z(16.5)],[1.5,Z(20.8)],[-2,Z(21.2)]])cyl(.05,.05,.03,[x,y1-.015,z],0xf6f1e2,{seg:10,name:'detector head'});
  for(const s of [1,-1])for(let z=f+.6;z<F1-.2;z+=1.2)deco([Math.min(s*(W-.02),s*(W-.5)),y1-.06,z-.015],[Math.max(s*(W-.02),s*(W-.5)),y1-.03,z+.015],0x6f7476,{cls:'metal'});
  deco([-2.75,y1-.3,f+.06],[-2.45,y1-.22,F1-.1],0x8c9193,{cls:'metal'});
  for(const s of [1,-1])for(let z=A1+.3;z<F1-.1;z+=.5)deco([Math.min(s*(W-.01),s*(W-.12)),y0,z-.04],[Math.max(s*(W-.01),s*(W-.12)),y1-.6,z+.04],0xd8d6cc);
  // Extinguishers by each door, the escape sign and the room signs.
  for(const [x,z] of [[1.0,f+.25],[.9,A1+.25]])bar([x,y0,z],[x,y0+.55,z],.08,RED,'paint');
  deco([-W+.1,y1-.3,Z(18.2)],[-W+.6,y1-.15,Z(18.22)],0x1f7a4a);
  plate(['AUXILIARY MACHINERY ROOM','補機室 · Fr 28–38'],.7,.1,[-1.6,y0+1.75,f+.061],0,{bg:'#f1ede2',name:'label: aux room'});
  plate(['ENGINE STORE · 機関部倉庫'],.6,.08,[PX-.001,y0+1.75,(PZ+F1)/2],-Math.PI/2,{bg:'#f1ede2',name:'label: engine store'});

  // ---- The auxiliary machinery room. Starboard: the ballast and bilge manifold (six valves on a header, the lines
  // to the tanks under the plates) and the ballast pump; the sounding pipes capped on the plates; the escape trunk
  // in the forward corner. Port: the sewage holding tank and its discharge pump.
  {const x0=-W,hz=Z(14.5),hz1=Z(16.3);
   box([x0,y0,hz],[x0+.5,y0+.9,hz1],0x3f8a5a,{draw:false,name:'ballast manifold'});
   bar([x0+.3,y0+.5,hz],[x0+.3,y0+.5,hz1],.06,0x3f8a5a,'paint');bar([x0+.3,y0+.5,hz],[x0+.3,y0-.05,hz],.06,0x3f8a5a,'paint');
   ['BALLAST P','BALLAST S','AFT PEAK','BILGE ER','BILGE AUX','OVERBOARD'].forEach((name,i)=>{const z=hz+.15+i*.3;
    cyl(.075,.075,.14,[x0+.3,y0+.5,z],0x3f8a5a,{rot:[0,0,Math.PI/2],seg:10,cls:'paint',name:'ballast valve'});bar([x0+.3,y0+.57,z],[x0+.3,y0+.8,z],.012,0x9a9ea0);
    cyl(.07,.07,.02,[x0+.3,y0+.81,z],L.red,{seg:12,name:'valve handwheel'});bar([x0+.3,y0+.2,z],[x0+.3,y0-.05,z],.04,0x3f8a5a,'paint');
    plate([name],.22,.04,[x0+.041,y0+1.05,z],Math.PI/2,{bg:'#f1ede2',name:'label: valve '+name.toLowerCase()});});
   plate(['BALLAST & BILGE MANIFOLD','sea suction below · pump forward'],.5,.08,[x0+.041,y0+1.3,(hz+hz1)/2],Math.PI/2,{bg:'#f1ede2',name:'label: manifold'});
   pumpSet('gsPump',2,0x3f8a5a,'BALLAST',x0,1,Z(16.85),tagOf('bilge','balp'));anchor('bilge','balp',[x0+.5,y0+.25,Z(16.85)],'port');anchor('bilge','manifold',[x0+.3,y0+.5,hz1+.1],'fwd');tagPlate(tagOf('bilge','manifold'),[x0+.041,y0+1.42,(hz+hz1)/2],Math.PI/2);
   for(const [x,name] of [[-3.2,'SOUNDING · BALLAST S'],[1.8,'SOUNDING · BALLAST P']]){cyl(.04,.04,.14,[x,y0+.07,Z(17.8)],0xb8a060,{seg:8,name:'sounding cap'});plate([name],.16,.03,[x,y0+.141,Z(17.8)],0,{rotX:-Math.PI/2,bg:'#f1ede2',name:'label: sounding'});}
   // The escape trunk: its wall, the ladder up to the hatch into casing S (shut above), the sign.
   box([x0,y0,Z(18.4)],[x0+.7,y1,Z(18.44)],0xe8e6dc,{name:'escape trunk'});
   for(const x of [x0+.15,x0+.55])bar([x,y0,Z(18.8)],[x,y1,Z(18.8)],.025,STEEL);for(let yy=y0+.3;yy<y1;yy+=.3)bar([x0+.15,yy,Z(18.8)],[x0+.55,yy,Z(18.8)],.018,STEEL);
   deco([x0+.02,y1-.03,Z(18.46)],[x0+.68,y1-.01,A1-.02],0x3a4244);
   // The sewage holding tank, its manhole, sight glass and vent, and the discharge pump with its line up to the deck connection.
   box([W-1.6,y0,Z(16.9)],[W,y0+1.7,Z(18.5)],0x7a756a,{name:'sewage holding tank'});cyl(.22,.22,.06,[W-.8,y0+1.73,Z(17.7)],0x5f5a52,{seg:14,name:'manhole cover'});
   deco([W-1.61,y0+.3,Z(17.6)],[W-1.6,y0+1.5,Z(17.65)],0xdfe8ee);bar([W-.3,y0+1.7,Z(18.3)],[W-.3,y1-.02,Z(18.3)],.03,0x9a9ea0);
   plate(['SEWAGE HOLDING TANK','4 m³ · pumped ashore at Minato'],.6,.1,[W-1.601,y0+1.0,Z(17.7)],-Math.PI/2,{bg:'#f1ede2',name:'label: sewage tank'});
   pumpSet('sewagePump',1,0x7a756a,'SEWAGE DISCHARGE No.1',W,-1,Z(16.45),tagOf('sewage','dp1'),'sewage','dp1');anchor('sewage','htank',[W-.8,y0+1.72,Z(17.0)],'up');tagPlate(tagOf('sewage','htank'),[W-1.601,y0+1.2,Z(17.7)],-Math.PI/2);
   // The standby machines (D10, the creator: "redundant motors so you can alternate"): along the port side a row of pumps
   // No.2 (and the two fuel transfer pumps, whose storage tanks are under the engine room's plates next door), the
   // second starting-air compressor in the starboard aft corner; each with its maker's plate and its KKS tag.
   pumpSet('transferPump',1,0x8a6a3a,'FUEL TRANSFER No.1',W,-1,Z(14.2),tagOf('fuel','tp1'),'fuel','tp1');pumpSet('transferPump',2,0x8a6a3a,'FUEL TRANSFER No.2',W,-1,Z(14.55),tagOf('fuel','tp2'),'fuel','tp2');
   pumpSet('hydrophore',2,0x4f7fb0,'HYDROPHORE No.2',W,-1,Z(15.0),tagOf('freshwater','hp2'),'freshwater','hp2');pumpSet('sanitaryPump',2,0x4f7fb0,'SANITARY No.2',W,-1,Z(15.4),tagOf('sewage','sp2'),'sewage','sp2');
   pumpSet('sewagePump',2,0x7a756a,'SEWAGE DISCHARGE No.2',W,-1,Z(15.85),tagOf('sewage','dp2'),'sewage','dp2');
   {const cx=x0+.2,cz=Z(14.25);box([x0,y0,Z(14.08)],[x0+.4,y0+.6,Z(14.42)],0x5f6a6c,{draw:false,name:'air compressor No.2'});
    deco([x0,y0,Z(14.08)],[x0+.4,y0+.1,Z(14.42)],0x3a3f41);deco([x0+.08,y0+.1,Z(14.13)],[x0+.32,y0+.4,Z(14.37)],L.green);
    cyl(.055,.055,.22,[cx-.1,y0+.5,cz],L.cover,{rot:[0,0,.45],seg:10,name:'compressor cylinder'});cyl(.045,.045,.2,[cx+.1,y0+.5,cz],L.cover,{rot:[0,0,-.45],seg:10,name:'compressor cylinder'});
    cyl(.16,.16,.04,[cx,y0+.3,Z(14.1)],L.cover,{rot:[Math.PI/2,0,0],seg:16,name:'compressor flywheel'});cyl(.09,.09,.26,[cx,y0+.25,Z(14.55)],L.alternator,{rot:[Math.PI/2,0,0],seg:14,name:'compressor motor'});
    anchor('air','c2',[cx,y0+.62,cz],'up');
    dial('AIR','bar',.72,.07,[cx,y0+.46,Z(14.38)+.002],0,{red:[0,.5],live:'air1',range:[0,30]});plate(makerPlate('compressor',2),.18,.08,[cx,y0+.25,Z(14.42)+.001],0,{name:'maker’s plate: compressor No.2'});tagPlate(tagOf('air','c2'),[cx,y0+.57,Z(14.42)+.001],0);}
  }
  // ---- The workshop (port): the bench along the forward bulkhead with its vice, grinder and the wiped bearing shell;
  // the JL-400 lathe along her side; the pedestal drill by the door; the welding set; the tool board; a stool.
  {const bx0=.9;
   box([bx0,y0,F1-.6],[W,y0+.85,F1],0x8a7356,{draw:false,name:'workshop bench'});deco([bx0,y0+.8,F1-.6],[W,y0+.85,F1],0x8a7356);
   for(const [x,z] of [[bx0+.04,F1-.56],[W-.04,F1-.56],[bx0+.04,F1-.04],[W-.04,F1-.04]])bar([x,y0,z],[x,y0+.8,z],.025,0x5a4a36);deco([bx0+.02,y0+.3,F1-.58],[W-.02,y0+.33,F1-.02],0x5a4a36);
   deco([2.5,y0+.85,F1-.5],[2.7,y0+1.02,F1-.25],STEEL);                                                                                                                    // the vice
   cyl(.1,.1,.03,[3.35,y0+1.0,F1-.3],0x6f7476,{rot:[0,0,Math.PI/2],seg:14,name:'grinding wheel'});cyl(.1,.1,.03,[3.65,y0+1.0,F1-.3],0x6f7476,{rot:[0,0,Math.PI/2],seg:14,name:'grinding wheel'});
   cyl(.08,.08,.22,[3.5,y0+1.0,F1-.3],L.alternator,{rot:[0,0,Math.PI/2],seg:12,name:'grinder motor'});deco([3.42,y0+.85,F1-.36],[3.58,y0+.93,F1-.24],0x3a3f41);
   cyl(.09,.09,.09,[1.6,y0+.895,F1-.3],0xb8bcbe,{rot:[0,0,Math.PI/2],seg:14,name:'wiped bearing shell'});deco([1.56,y0+.94,F1-.34],[1.64,y0+.95,F1-.26],0x3b3326);
   plate(['WIPED · STBD No.3 MAIN BEARING','12 APR 94 · keep for the surveyor'],.22,.05,[1.6,y0+.88,F1-.39],Math.PI,{bg:'#f6f3ea',name:'label: wiped bearing'});
   deco([2.0,y0+.85,F1-.5],[2.4,y0+1.0,F1-.2],L.red);                                                                                                                      // the toolbox
   box([W-.8,y0,Z(19.45)],[W,y0+1.3,Z(21.0)],L.green,{draw:false,name:'lathe'});
   for(const z of [Z(19.5),Z(20.55)])deco([W-.7,y0,z],[W-.1,y0+.75,z+.4],L.cover);deco([W-.75,y0+.75,Z(19.45)],[W-.05,y0+.95,Z(21.0)],L.green);   // the cabinets and the bed
   deco([W-.75,y0+.95,Z(19.45)],[W-.05,y0+1.3,Z(19.9)],L.green);cyl(.09,.09,.08,[W-.4,y0+1.12,Z(19.94)],0xb8bcbe,{rot:[Math.PI/2,0,0],seg:14,name:'lathe chuck'});    // the headstock and chuck
   deco([W-.55,y0+.95,Z(20.75)],[W-.25,y0+1.15,Z(21.0)],L.green);cyl(.03,.03,.3,[W-.4,y0+1.12,Z(20.6)],0xb8bcbe,{rot:[Math.PI/2,0,0],seg:8,name:'tailstock quill'});   // the tailstock
   deco([W-.7,y0+.95,Z(20.1)],[W-.1,y0+1.1,Z(20.4)],L.cover);bar([W-.08,y0+.9,Z(19.9)],[W-.08,y0+.9,Z(21.0)],.012,0x9a9ea0);                                                // the carriage and the leadscrew
   deco([W-.73,y0+.74,Z(19.47)],[W-.07,y0+.76,Z(20.98)],0x3a3f41);
   plate(['JOHANSSON MACHINE TOOLS','JL-400 · centre lathe · 400 mm · Hiroshima'],.3,.08,[W-.4,y0+.62,Z(20.95)+.001],0,{name:'maker’s plate: lathe'});
   {const dx=2.55;                                                                                                   // the drill, between the door's leaf and the lathe, off the way to the bench
   box([dx-.3,y0,Z(19.5)],[dx+.3,y0+1.7,Z(20.1)],0x3a3f41,{draw:false,name:'pedestal drill'});deco([dx-.25,y0,Z(19.55)],[dx+.25,y0+.08,Z(20.05)],0x3a3f41);
   bar([dx,y0+.08,Z(19.8)],[dx,y0+1.65,Z(19.8)],.04,L.green,'paint');deco([dx-.2,y0+.9,Z(19.6)],[dx+.2,y0+.95,Z(20.0)],0x6f7476);
   deco([dx-.2,y0+1.45,Z(19.55)],[dx+.2,y0+1.7,Z(20.05)],L.green);cyl(.03,.03,.3,[dx,y0+1.3,Z(19.8)],0xb8bcbe,{seg:8,name:'drill quill'});cyl(.07,.07,.2,[dx,y0+1.6,Z(20.2)],L.alternator,{seg:12,name:'drill motor'});
   plate(['JOHANSSON MACHINE TOOLS','JD-13 · pedestal drill'],.2,.06,[dx,y0+1.2,Z(19.5)-.001],Math.PI,{name:'maker’s plate: drill'});}
   box([W-.5,y0,Z(21.2)],[W,y0+.8,Z(21.7)],0xd0652a,{name:'welding set'});deco([W-.45,y0+.5,Z(21.21)],[W-.05,y0+.75,Z(21.19)],0x3a3f41);bar([W-.25,y0+.8,Z(21.45)],[W-.9,y0+.05,Z(21.9)],.012,0x1f2224);
   plate(['JOHANSSON WELDING','JW-250 · 250 A'],.2,.06,[W-.25,y0+.3,Z(21.2)-.001],Math.PI,{name:'maker’s plate: welding set'});
   deco([1.6,y0+1.0,A1+.07],[3.0,y0+1.7,A1+.09],0xd8d2c0);for(let i=0;i<7;i++)deco([1.7+i*.18,y0+1.15,A1+.09],[1.74+i*.18,y0+1.55,A1+.11],STEEL);                       // the tool board
   box([2.0,y0,Z(21.0)],[2.4,y0+.5,Z(21.4)],0x3a4244,{draw:false,name:'stool'});bar([2.2,y0,Z(21.2)],[2.2,y0+.45,Z(21.2)],.03,0x3a4244);cyl(.18,.18,.03,[2.2,y0+.47,Z(21.2)],0x3a4244,{seg:12,name:'stool seat'});
  }
  // ---- The store (starboard): the mesh partition with its opening by the door, the spares racks along her side,
  // the oil drums on their rack with the drip tray, the rag bin, the chain block on the deckhead.
  {box([PX-.02,y0,PZ],[PX+.02,y1-.3,F1],STEEL,{draw:false,name:'store partition'});                                   // welded mesh on a frame: posts, rails and the wires
   for(const z of [PZ,PZ+.64,PZ+1.28,PZ+1.92,F1-.02])bar([PX,y0,z],[PX,y1-.3,z],.015,0x6f7476);for(const yy of [y0+.02,y1-.32])bar([PX,yy,PZ],[PX,yy,F1],.015,0x6f7476);
   for(let yy=y0+.2;yy<y1-.35;yy+=.2)bar([PX,yy,PZ],[PX,yy,F1],.004,0x8c9193);for(let z=PZ+.16;z<F1;z+=.16)bar([PX,y0+.02,z],[PX,y1-.32,z],.004,0x8c9193);
   box([-W,y0,Z(20.0)],[-W+.5,y0+1.6,Z(22.4)],STEEL,{draw:false,name:'spares rack'});
   for(const z of [Z(20.0),Z(21.2),Z(22.4)])for(const x of [-W+.04,-W+.46])bar([x,y0,z],[x,y0+1.6,z],.015,0x6f7476);
   for(const yy of [y0+.05,y0+.55,y0+1.05,y0+1.55])deco([-W,yy,Z(20.0)],[-W+.5,yy+.03,Z(22.4)],0x6f7476);
   ['FILTERS','GASKETS & SEALS','INJECTORS','BEARINGS','V-BELTS','LAMPS','HOSES','PAINT · touch-up'].forEach((name,i)=>{const r=i%2,c=Math.floor(i/2),z0=Z(20.1)+c*.58,yy=y0+.08+r*.5;
    deco([-W+.06,yy,z0],[-W+.44,yy+.36,z0+.5],i%3?0xb08a5a:0x9aa3a2);plate([name],.4,.05,[-W+.441,yy+.2,z0+.25],Math.PI/2,{bg:'#f6f3ea',name:'label: spares '+name.toLowerCase()});});
   box([-2.9,y0,F1-.75],[-.9,y0+.9,F1],0x6f7476,{draw:false,name:'oil drums'});deco([-2.9,y0,F1-.75],[-.9,y0+.06,F1],0x3a3f41);
   for(const x of [-2.4,-1.4]){cyl(.29,.29,.88,[x,y0+.5,F1-.37],0x2f4a7a,{rot:[0,0,Math.PI/2],seg:18,cls:'paint',name:'oil drum'});for(const k of [-.28,.28])cyl(.3,.3,.03,[x+k,y0+.5,F1-.37],0x1f2f52,{rot:[0,0,Math.PI/2],seg:18});
    cyl(.025,.025,.08,[x-.44,y0+.3,F1-.37],0xb8a060,{rot:[0,0,Math.PI/2],seg:8,name:'drum tap'});plate(['LUBRICATING OIL · SAE 40','200 L'],.3,.06,[x-.46,y0+.6,F1-.37],-Math.PI/2,{bg:'#f1ede2',name:'label: oil drum'});}
   for(const [x,z] of [[-2.85,F1-.7],[-.95,F1-.7],[-2.85,F1-.05],[-.95,F1-.05]])bar([x,y0+.06,z],[x,y0+.3,z],.02,0x3a3f41);
   cyl(.22,.22,.6,[-.8,y0+.3,Z(20.3)],0x3a4244,{seg:12,cls:'paint',name:'rag bin'});plate(['OILY RAGS','lid on'],.16,.05,[-.8,y0+.4,Z(20.3)-.221],Math.PI,{bg:'#f1ede2',name:'label: rag bin'});
   bar([-1.8,y1,Z(20.8)],[-1.8,y1-.5,Z(20.8)],.012,0x3a3f41);cyl(.08,.08,.18,[-1.8,y1-.6,Z(20.8)],0x3a3f41,{seg:10,name:'chain block'});bar([-1.8,y1-.7,Z(20.8)],[-1.8,y1-.95,Z(20.8)],.012,0x3a3f41);
  }
  // ---- The electrical workshop, Fr 45–52 (the creator's diorama, built to the hold's 1.9 m and to her own electrics):
  // the bench along the forward bulkhead with the meters and the scope, the tool board over it, the 440 V test panel
  // to starboard on its insulating mat, a motor in for its test, the shore cable's drum, the escape trunk, the cable tray.
  {const F2=MS.ewFore,D=MS.door45,E=FERRY_ELECTRICS,BENCH=0x8c5a32,FRAME=0x2b5b6c,DRAWER=0x3a6f82;
   for(const s of [1,-1])box([Math.min(s*W,s*(W+.06)),y0-.1,F1],[Math.max(s*W,s*(W+.06)),y1,F2+.06],0xe8e6dc,{name:'electrical workshop side'});
   box([-W,y1,F1],[W,CAR-.02,F2+.06],0xd8d6cc,{solid:false,camera:true,name:'electrical workshop deckhead'});deco([-W,CAR-.03,F1],[W,CAR-.012,F2+.06],0xd8d6cc);
   box([-W,y0-.06,F1+.06],[W,y0,F2],0x8c9193,{solid:false,camera:false,name:'floor plates'});floorPlate('chequer',-W,W,F1+.06,F2,y0+.002);
   box([-W,y0-.1,F2],[W,y1,F2+.06],0xe8e6dc,{name:'electrical workshop forward bulkhead'});
   deco([-.3,y0+.35,F2-.01],[.3,y0+.8,F2],0x9aa0a2);for(const [x,yy] of [[-.26,.39],[.26,.39],[-.26,.76],[.26,.76]])cyl(.012,.012,.02,[x,y0+yy,F2-.012],0x5e6467,{rot:[Math.PI/2,0,0],seg:6});   // the manhole to the void, bolted
   plate(['VOID · 空所','manhole · enter with a permit'],.36,.07,[0,y0+.9,F2-.002],Math.PI,{bg:'#f1ede2',name:'label: void manhole'});
   // The door at Fr 45: its frame, the leaf hooked back against the bulkhead on this side, the sign over it.
   for(const x of [D.x-D.w/2,D.x+D.w/2])deco([x-.04,y0,F1-.02],[x+.04,y0+D.h,F1+.08],TEAL);deco([D.x-D.w/2-.04,y0+D.h,F1-.02],[D.x+D.w/2+.04,y0+D.h+.04,F1+.08],TEAL);
   box([D.x+D.w/2+.05,y0+.02,F1+.06],[D.x+D.w/2+.05+D.w,y0+D.h-.02,F1+.1],DOOR,{name:'electrical workshop door leaf'});
   plate(['電気工作室','ELECTRICAL WORKSHOP'],.5,.12,[D.x,y0+D.h+.18,F1-.002],Math.PI,{bg:'#24585c',fg:'#f6f3ea',name:'sign: electrical workshop'});
   // Insulating rubber mats, where a man stands at the bench and at the panel.
   deco([.5,y0+.002,F2-1.75],[3.9,y0+.022,F2-.82],0x1e293b);deco([-3.9,y0+.002,F2-1.55],[-1.9,y0+.022,F2-.62],0x1e293b);
   // The bench: a beech top on a blue-green steel frame, the four-drawer pedestal at its port end, the shelf under it.
   const bz0=F2-.8,bz1=F2,bx0=.5,bx1=3.9,top=y0+.88;
   box([bx0,y0,bz0],[bx1,top+.06,bz1],BENCH,{draw:false,name:'electrical bench'});deco([bx0,top,bz0],[bx1,top+.06,bz1],BENCH);
   deco([bx0,y0,bz0+.04],[bx0+.06,top,bz1-.02],FRAME);deco([bx0,y0+.16,bz0+.06],[bx1-.9,y0+.2,bz1-.04],FRAME);
   deco([bx1-.88,y0,bz0+.02],[bx1,top,bz1],FRAME);for(let d=0;d<4;d++){deco([bx1-.84,y0+.06+d*.2,bz0-.005],[bx1-.04,y0+.22+d*.2,bz0+.02],DRAWER);deco([bx1-.58,y0+.13+d*.2,bz0-.02],[bx1-.3,y0+.15+d*.2,bz0],0xcbd5e1);}
   deco([1.2,y0+.2,bz0+.15],[1.8,y0+.48,bz0+.5],L.red,{name:'toolbox'});
   deco([.9,top+.06,bz0+.08],[2.4,top+.075,bz1-.12],0x1f4d3d);                                                                 // the green anti-static mat
   // On the mat: a 440 V contactor from the steering-gear starter, out for new contacts, and the meters on it.
   deco([1.35,top+.075,bz0+.22],[1.75,top+.2,bz0+.48],0x2a2e30,{name:'contactor (steering-gear starter)'});deco([1.42,top+.2,bz0+.26],[1.68,top+.24,bz0+.44],0xd97706);
   plate(['JOHANSSON DENKI','JC-40 · 440 V AC · coil 105 V'],.16,.05,[1.55,top+.14,bz0+.219],Math.PI,{name:'maker’s plate: contactor'});
   deco([1.95,top+.075,bz0+.2],[2.2,top+.12,bz0+.45],0xfacc15,{name:'digital multimeter'});
   plate([`AUTO  V~  ${E.hz}.0 Hz  TRUE RMS`,` ${E.volts-4}.2  V AC`],.2,.11,[2.075,top+.141,bz0+.34],Math.PI,{kind:'readout',rotX:-Math.PI/2+.35,bg:'#9eab88',fg:'#0f172a',name:'multimeter display'});   // tilted to whoever stands at the bench
   // The leads from the meter's jacks lie down on the mat and climb the contactor's front to the probes on the contactor's line terminals.
   for(const [jx,mx,px,pz,c] of [[2.0,1.86,1.62,bz0+.3,0xef4444],[2.1,1.9,1.48,bz0+.38,0x1e293b]]){
    const jack=[jx,top+.1,bz0+.2],mat=[mx,top+.081,bz0+.14],foot=[px+.06,top+.081,bz0+.19],rise=[px+.06,top+.27,bz0+.19],probe=[px,top+.25,pz];
    bar(jack,mat,.006,c);bar(mat,foot,.006,c);bar(foot,rise,.006,c);bar(rise,probe,.011,c);}
   deco([.6,top+.075,bz0+.12],[.9,top+.21,bz0+.48],0x1e293b,{name:'insulation tester'});
   plate(['MΩ  500 V','∞ ──── 0'],.24,.16,[.75,top+.215,bz0+.3],0,{rotX:-Math.PI/2,bg:'#f8fafc',name:'insulation tester scale'});
   deco([2.45,top+.06,bz0+.15],[2.6,top+.11,bz0+.42],0xeab308,{name:'clamp meter'});cyl(.07,.07,.03,[2.52,top+.12,bz0+.1],0xdc2626,{rot:[Math.PI/2,0,0],seg:14,name:'clamp meter jaws'});
   deco([3.05,top+.06,bz0+.5],[3.27,top+.21,bz0+.76],0xfacc15,{name:'soldering station'});bar([3.0,top+.06,bz0+.4],[2.85,top+.22,bz0+.35],.018,0x94a3b8);cyl(.04,.04,.07,[2.7,top+.1,bz0+.62],0x38bdf8,{rot:[0,0,Math.PI/2],seg:10,name:'solder reel'});
   deco([3.45,top+.06,bz0+.12],[3.75,top+.22,bz0+.4],0x3b82f6,{name:'vice'});cyl(.09,.09,.06,[3.6,top+.28,bz0+.26],0xd97706,{seg:16,name:'stator in the vice (bilge pump motor, rewound)'});
   cyl(.033,.033,.11,[3.8,top+.11,bz0+.6],0x7a4a20,{seg:10,name:'J-Coffee can'});
   // The shelf on posts at the bench's back: the oscilloscope and the bench supply.
   for(const x of [2.55,3.85])deco([x,top+.06,bz1-.46],[x+.04,top+.52,bz1-.04],FRAME);deco([2.55,top+.52,bz1-.46],[3.89,top+.56,bz1-.04],FRAME);
   box([2.62,top+.56,bz1-.44],[3.22,top+.86,bz1-.06],0xd6d3c4,{draw:false,name:'oscilloscope'});deco([2.62,top+.56,bz1-.44],[3.22,top+.86,bz1-.06],0xd6d3c4);
   plate([`CH1 100 V/DIV  ${E.hz} Hz`,'CH2 shore 200 V'],.26,.2,[2.8,top+.71,bz1-.445],Math.PI,{kind:'scope',bg:'#041f14',fg:'#4ade80',name:'oscilloscope screen'});
   for(let r=0;r<2;r++)for(let c=0;c<3;c++)cyl(.02,.02,.025,[3.0+c*.07,top+.66+r*.1,bz1-.455],c===2?0xef4444:0x475569,{rot:[Math.PI/2,0,0],seg:10});
   deco([3.3,top+.56,bz1-.42],[3.82,top+.8,bz1-.08],0x334155,{name:'bench supply'});plate([' 24.0 V',' 1.8 A'],.2,.09,[3.56,top+.68,bz1-.425],Math.PI,{kind:'readout',bg:'#090d16',fg:'#ef4444',name:'bench supply display'});
   plate(['JOHANSSON DENKI · JS-20 · 20 MHz'],.3,.03,[2.92,top+.58,bz1-.445],Math.PI,{name:'maker’s plate: oscilloscope'});
   // The magnifier lamp clamped to the bench, over the mat.
   bar([1.0,top+.06,bz1-.1],[1.1,top+.62,bz1-.25],.012,0xe2e8f0);bar([1.1,top+.62,bz1-.25],[1.45,top+.68,bz0+.35],.012,0xe2e8f0);cyl(.12,.14,.05,[1.5,top+.64,bz0+.32],0x38bdf8,{seg:16,name:'magnifier lamp'});
   // The tool board over the bench: insulated screwdrivers, pliers and strippers, spanners, the rolls of wire and tape.
   const pb=F2-.012;deco([.6,top+.4,pb-.02],[2.5,top+.98,pb],0x334155,{name:'tool board'});
   for(let i=0;i<4;i++){cyl(.018,.016,.12,[.75+i*.12,top+.82,pb-.04],i%2?0xfacc15:0xdc2626,{seg:8});bar([.75+i*.12,top+.76,pb-.04],[.75+i*.12,top+.58-i*.02,pb-.04],.005,0xe2e8f0);}
   for(const [i,c] of [0xef4444,0x3b82f6,0xf97316].entries()){bar([1.35+i*.17,top+.86,pb-.04],[1.33+i*.17,top+.68,pb-.04],.01,c);bar([1.39+i*.17,top+.86,pb-.04],[1.41+i*.17,top+.68,pb-.04],.01,c);deco([1.33+i*.17,top+.86,pb-.05],[1.41+i*.17,top+.92,pb-.03],0x94a3b8);}
   for(let i=0;i<4;i++)deco([1.95+i*.12,top+.6+i*.03,pb-.05],[1.98+i*.12,top+.9,pb-.03],0xcbd5e1);
   for(const [i,c] of [0xef4444,0x22c55e,0x3b82f6,0xfacc15,0x0f172a].entries())cyl(.045,.045,.03,[.75+i*.13,top+.5,pb-.04],c,{rot:[Math.PI/2,0,0],seg:12,name:'roll of wire'});
   // The 440 V test panel to starboard: a marine-green cubicle, fed from the main board; test sockets and its insulation meter.
   const px0=-3.95,px1=-2.15,pz0=F2-.55;
   box([px0,y0,pz0],[px1,y0+1.84,F2],L.green,{name:'test panel'});
   deco([px0+.04,y0+1.0,pz0-.01],[px1-.04,y0+1.78,pz0],L.greenDark);
   dial('INSULATION','MΩ',.92,.16,[px0+.35,y0+1.5,pz0-.012],Math.PI,{red:[0,.1]});dial('BUS','V',.78,.16,[px0+.75,y0+1.5,pz0-.012],Math.PI,{range:[0,600]});
   for(const [i,c] of [0x22c55e,0xf8fafc,0xf8fafc,0xf8fafc].entries())cyl(.022,.022,.02,[px0+1.1+i*.12,y0+1.55,pz0-.012],c,{rot:[Math.PI/2,0,0],seg:10,name:i?'earth lamp':'supply lamp'});
   for(const [i,[lbl,c]] of [['440 V 3φ',0x1e293b],['105 V',0xf8fafc],['24 V DC',0xdc2626]].entries()){deco([px0+.2+i*.52,y0+.75,pz0-.04],[px0+.5+i*.52,y0+.95,pz0],c,{name:'test socket '+lbl});plate([lbl],.28,.05,[px0+.35+i*.52,y0+.68,pz0-.001],Math.PI,{bg:'#f1ede2',name:'label: test socket '+lbl});}
   plate(['感電注意 440V','DANGER OF ELECTRIC SHOCK'],.5,.18,[px0+.9,y0+.35,pz0-.001],Math.PI,{bg:'#facc15',fg:'#111827',name:'sign: 440 V'});
   plate(['JOHANSSON MARINE · JE-440T','test panel · 440 V 60 Hz · IT'],.36,.07,[px0+.9,y0+1.86-.1,pz0-.001],Math.PI,{name:'maker’s plate: test panel'});
   // A motor in for its insulation test: the ballast pump's, on a pallet, its terminal box open and the tester's leads on it.
   box([-3.6,y0,F1+.35],[-2.6,y0+.12,F1+1.25],0x9a6b3e,{name:'pallet'});
   cyl(.24,.24,.55,[-3.1,y0+.38,F1+.8],L.alternator,{rot:[0,0,Math.PI/2],seg:16,name:'ballast pump motor, 3.7 kW'});deco([-3.2,y0+.6,F1+.68],[-3.0,y0+.72,F1+.9],L.green);cyl(.04,.04,.18,[-2.75,y0+.38,F1+.8],0xe2e8f0,{rot:[0,0,Math.PI/2],seg:10});
   plate(['JOHANSSON MARINE · JM-37','3.7 kW · 440 V · 60 Hz · IP44'],.22,.06,[-3.1,y0+.38,F1+.53],Math.PI,{name:'maker’s plate: ballast pump motor'});
   // The spare shore-power cable on its drum, port aft.
   cyl(.46,.46,.05,[3.3,y0+.03,F1+.75],0xa16207,{seg:18});cyl(.46,.46,.05,[3.3,y0+.55,F1+.75],0xa16207,{seg:18});cyl(.36,.36,.47,[3.3,y0+.3,F1+.75],0xf97316,{seg:16,name:'shore cable on its drum'});
   box([2.84,y0,F1+.29],[3.76,y0+.58,F1+1.21],0xa16207,{draw:false,name:'cable drum'});
   // A stool at the bench.
   box([1.55,y0,F2-1.35],[1.95,y0+.6,F2-.95],0x1e293b,{draw:false,name:'stool'});bar([1.75,y0,F2-1.15],[1.75,y0+.56,F2-1.15],.03,0x94a3b8);cyl(.2,.2,.05,[1.75,y0+.58,F2-1.15],0x1e293b,{seg:14,name:'stool seat'});
   // The escape trunk in the starboard side, its dogged door with the red handwheel facing inboard.
   const tz0=Z(24.6),tz1=Z(25.2);box([-W,y0,tz0-.06],[-W+.7,y1,tz1+.06],0xc8d6d0,{name:'escape trunk'});
   deco([-W+.7,y0+.05,tz0],[-W+.74,y0+1.75,tz1],0x94a3b8);cyl(.14,.14,.025,[-W+.76,y0+1.0,(tz0+tz1)/2],0xdc2626,{rot:[0,0,Math.PI/2],seg:16,name:'escape door handwheel'});
   for(const yy of [.3,1.0,1.6])deco([-W+.74,y0+yy,tz1-.06],[-W+.78,y0+yy+.08,tz1-.02],0x5e6467);
   plate(['非常脱出口','EMERGENCY ESCAPE ↑ car deck'],.42,.1,[-W+.75,y0+1.6,(tz0+tz1)/2],Math.PI/2,{bg:'#15803d',fg:'#ffffff',name:'sign: emergency escape'});
   // Overhead: the thruster's cable in its tray to starboard, the lamps in their cages, the machinery alarm beacon.
   deco([-3.7,y1-.14,F1],[-3.15,y1-.1,F2+.06],0x64748b,{name:'cable tray'});for(const x of [-3.6,-3.42,-3.25])cyl(.025,.025,F2-F1,[x,y1-.08,(F1+F2)/2],0x0f172a,{rot:[Math.PI/2,0,0],seg:8,name:x===-3.42?'thruster cable':'cable'});
   caged(1,Z(23.5));caged(-1,Z(23.2));caged(1,Z(25.4));
   for(const x of [-1,1.6])deco([x-.6,y1-.08,Z(24.4)-.12],[x+.6,y1-.01,Z(24.4)+.12],0xe2e8f0,{name:'fluorescent fitting'});
   cyl(.07,.07,.1,[0,y1-.08,Z(25.3)],0xef4444,{seg:12,name:'machinery alarm beacon'});
   plate(['安全第一','SAFETY FIRST'],.44,.2,[-1.4,y0+1.45,F1+.062],0,{bg:'#15803d',fg:'#ffffff',name:'sign: safety first'});
   plate(['DG No.2 · AVR · wiring','JOHANSSON MARINE · 1994'],.5,.3,[W-.01,y0+1.35,Z(24.1)],-Math.PI/2,{bg:'#1e3a8a',fg:'#93c5fd',name:'diagram: DG2 AVR'});
  }
  // The floors: the aux room, reaching back through the watertight door and forward through the door at Fr 38; the
  // workshop and the store as one floor (the partition stands on it), reaching back through that door.
  floor('aux-room',[-W,W],[f-.4,A1+.1],y0,(x,z,r)=>{if(z<f+.06+r)return Math.abs(x)<=WT_W/2-r+.06;if(z>A1-r)return Math.abs(x)<=MS.door38.w/2-r+.06;return Math.abs(x)<=W-r;});
  floor('workshop',[-W,W],[A1-.4,F1+.1],y0,(x,z,r)=>{if(z<A1+.06+r)return Math.abs(x)<=MS.door38.w/2-r+.06;if(z>F1-r)return Math.abs(x-MS.door45.x)<=MS.door45.w/2-r+.06;return Math.abs(x)<=W-r;});
  floor('electrical-workshop',[-W,W],[F1-.4,MS.ewFore],y0,(x,z,r)=>{if(z<F1+.06+r)return Math.abs(x-MS.door45.x)<=MS.door45.w/2-r+.06;return Math.abs(x)<=W-r&&z<=MS.ewFore-r;});
 }
 // H1-03: five new fluorescent fittings; four retained main/electrical fittings are above.
 if(FERRY_H1_ENABLED)for(const [X,Y]of FERRY_H1.luminaires){if([9.5,12.5,24.4].includes(X))continue;deco([Y-.1,3.4-SH.draft,Z(X)-.3],[Y+.1,3.45-SH.draft,Z(X)+.3],0xf6f1e2,{name:'H1 fluorescent fitting'});}
 // ---- The pipes, from the diagrams (6r-1). The anchors the machines did not set themselves: the tanks under the plates
 // (a flanged stub on the tank top, under the gratings), the sea-water crossover, the overboards, the bilge wells, the
 // risers and deck connections that leave the space (a penetration flange), the hydrophore's pressure tank; then every
 // diagram line is either accepted in engineeringPipes or retained as an issue. The game also retains unverified illustrative paths.
 {const y0=ER.floor,y1=ER.deckhead,a=ER.aft,f=ER.fore,W=ER.side,F1=MS.storeFore,L=JOHANSSON_MARINE.livery;
  // A tank's stub: a flanged fitting on the plates, its pipe dropping through them to the lane under the plates.
  const stub=(sys,id,x,z)=>{anchor(sys,id,[x,y0+.02,z],'down',{off:.16});cyl(.05,.05,.04,[x,y0+.02,z],0x9ea4a6,{seg:8,name:'tank-top flange'});};
  stub('fuel','storeP',2.25,Z(12.3));stub('fuel','storeS',-2.25,Z(12.3));anchor('fuel','vP',[2.25,y0+.35,Z(12.3)],'up');anchor('fuel','vS',[-2.25,y0+.35,Z(12.3)],'up');
  for(const [x,z] of [[2.25,Z(12.3)],[-2.25,Z(12.3)]])cyl(.03,.03,.02,[x,y0+.38,z],L.red,{seg:8,name:'valve handwheel'});
  anchor('fuel','purifier',[W-.27,y0+1.0,Z(12.0)],'up');stub('fuel','sludge',W-1.0,Z(13.0));stub('lube','lostore',0,Z(9.4));
  anchor('seawater','cross',[3.0,y0+.3,Z(13.6)],'stbd');for(const sys of ['bilge','fire','sewage'])anchor(sys,sys==='bilge'?'chest':sys==='fire'?'fchest':'schest',[3.0,y0+.3,Z(13.6)],'stbd');
  deco([2.85,y0+.1,Z(13.5)],[3.15,y0+.5,Z(13.7)],0x3f8a5a);                                                                                     // the crossover's valve chest
  anchor('seawater','obP',[W-.03,y0+.6,Z(11.5)],'stbd');anchor('seawater','obS',[-(W-.03),y0+.6,Z(11.5)],'port');anchor('bilge','ob',[W-.03,y0+.6,Z(12.45)],'stbd');anchor('sewage','ob2',[W-.03,y0+.5,Z(16.2)],'stbd');
  for(const [x,y,z] of [[W-.03,y0+.6,Z(11.5)],[-(W-.03),y0+.6,Z(11.5)],[W-.03,y0+.6,Z(12.45)],[W-.03,y0+.5,Z(16.2)]]){const vx=x>0?x-.14:x+.14;bar([vx,y,z],[vx,y+.1,z],.01,0x3a3f41);cyl(.04,.04,.02,[vx,y+.11,z],L.red,{seg:8,name:'overboard valve'});}
  stub('bilge','wellERP',1.2,Z(8.75));stub('bilge','wellERS',-1.2,Z(8.75));stub('bilge','wellAux',-3.5,Z(18.0));pen('bilge','wellShaft',[-2.5,y0+.2,a+.03],'fwd');pen('bilge','wellSG',[-2.1,y0+.2,a+.03],'fwd');
  anchor('bilge','emerg',[1.3,y0+.3,Z(12.2)],'up');cyl(.03,.03,.02,[1.3,y0+.42,Z(12.2)],L.red,{seg:8,name:'emergency suction valve'});
  anchor('bilge','ows',[W-.55,y0+.5,Z(13.05)],'stbd',{local:true});anchor('bilge','ppm',[W-.55,y0+1.05,Z(13.05)],'stbd',{local:true});stub('bilge','hold',W-1.2,Z(13.1));pen('bilge','shoreB',[W-1.0,y1,Z(13.1)],'down');
  stub('bilge','balP',2.0,Z(16.5));stub('bilge','balS',-2.0,Z(16.5));pen('bilge','aftpk',[-3.0,y0+.2,a+.03],'fwd');pen('bilge','forepk',[-3.0,y0+.2,F1-.03],'aft');
  for(const id of ['hER','hCar1','hCar2','hCar3','hCar4','hPassP','hPassS','hBridge','isc','wash'])if(id!=='hER')anchor('fire',id,[-(W-.3),y1,Z(9.4)],'down');
  pen('fire','main',[-(W-.3),y1,Z(9.4)],'down');anchor('fire','hER',[W-.25,y0+.9,Z(13.7)],'stbd');                                                 // the riser up casing S: the main's other hydrants hang off it
  pen('fire','co2v',[0,y1,Z(9.5)],'down');anchor('fire','co2n',[0,y1-.1,Z(11.0)],'up');
  anchor('air','dist',[1.0,y1-.3,a+.15],'fwd');anchor('air','pr',[2.5,y0+1.5,Z(8.85)],'up',{local:true});cyl(.03,.03,.04,[2.5,y0+1.5,Z(8.85)],0x2a2d2f,{seg:6,name:'pressure switch'});
  anchor('air','red',[W-.3,y0+1.5,Z(9.8)],'stbd');deco([W-.4,y0+1.4,Z(9.7)],[W-.2,y0+1.6,Z(9.9)],0x6b7375);anchor('air','svc',[W-.1,y0+1.4,Z(21.0)],'stbd');
  pen('freshwater','fwP',[2.0,y0+.6,a+.03],'fwd');pen('freshwater','fwS',[-2.0,y0+.6,a+.03],'fwd');anchors['freshwater/fwS']=Object.freeze({...anchors['freshwater/fwS'],off:.5});   // clear of the switchboard's face before it turns
  // The hydrophore's 300 L pressure tank in the aux room's starboard side, with its pressure switch.
  box([-W,y0,Z(17.3)],[-W+.6,y0+1.2,Z(17.9)],0x4f7fb0,{draw:false,name:'pressure tank'});cyl(.28,.28,1.0,[-W+.3,y0+.6,Z(17.6)],0x4f7fb0,{seg:16,cls:'paint',name:'pressure tank'});cyl(.29,.29,.04,[-W+.3,y0+.12,Z(17.6)],0x3a4a7a,{seg:16,cls:'paint'});cyl(.29,.29,.04,[-W+.3,y0+1.08,Z(17.6)],0x3a4a7a,{seg:16,cls:'paint'});
  tagPlate(tagOf('freshwater','ptank'),[-W+.3,y0+.7,Z(17.6)+.281],0);plate(['HYDROPHORE TANK','300 L · 0.25–0.35 MPa'],.3,.07,[-W+.3,y0+.55,Z(17.6)+.281],0,{bg:'#f1ede2',name:'label: pressure tank'});
  anchor('freshwater','ptank',[-W+.3,y0+1.12,Z(17.6)],'up');anchor('freshwater','psw',[-W+.3,y0+1.3,Z(17.9)],'up',{local:true});cyl(.03,.03,.04,[-W+.3,y0+1.3,Z(17.9)],0x2a2d2f,{seg:6,name:'pressure switch'});
  for(const id of ['galley','toilets','heater'])anchor('freshwater',id,[W-.3,y1,Z(14.5)],'down');pen('freshwater','galley',[W-.3,y1,Z(14.5)],'down');anchor('freshwater','expfill',[1.0,y0+1.2,f-.05],'aft');
  pen('sewage','flush',[-(W-.3),y1,Z(14.5)],'down');pen('sewage','deck',[W-.6,y1,Z(16.0)],'down');
  for(const s of [1,-1]){const X=S2(s,.55,2.4),zc=GZ(12.975),id=s>0?'gen1':'gen2';                                                              // the generator sets' own circuits
   anchor('fuel','fuel-'+id,[s*.75,y0+1.1,GZ(12.65)],'up');anchor('lube','sump-'+id,[s*1.0,y0+.4,GZ(12.65)],'aft',{local:true});anchor('lube','lop-'+id,[s*1.4,y0+.5,GZ(12.63)],'aft',{local:true});
   anchor('lube','lof-'+id,[s*1.2,y0+.7,GZ(12.63)],'aft',{local:true});anchor('lube','loc-'+id,[s*1.6,y0+.6,GZ(13.32)],'fwd',{local:true});anchor('lube','bear-'+id,[s*1.1,y0+1.1,zc],'up',{local:true});
   anchor('jacket','exp-'+id,[s*.9,y0+1.3,zc],'up',{local:true});anchor('jacket','jwp-'+id,[s*1.3,y0+.6,GZ(13.32)],'fwd',{local:true});anchor('jacket','blk-'+id,[s*1.1,y0+1.0,zc+.1],'up',{local:true});
   anchor('jacket','thermo-'+id,[s*1.4,y0+1.15,zc+.2],'up',{local:true});anchor('jacket','jwc2-'+id,[s*1.6,y0+.5,GZ(12.63)],'aft',{local:true});
   anchor('seawater','swp-'+id,[s*1.5,y0+.5,GZ(13.33)],'fwd',{local:true});anchor('seawater','cac-'+id,[s*1.7,y0+1.0,zc+.28],'up',{local:true});anchor('seawater','jwc-'+id,[s*1.6,y0+.5,GZ(12.63)],'aft',{local:true});
   anchor('air','start-'+id,[s*.7,y0+1.15,zc-.25],'up');}
  // Route and draw.
  const solids=boxes.filter(b=>b.solid&&b.name&&!/side|deckhead|bulkhead|trunk|casing|partition|escape|plates/.test(b.name));
  // Exact, radius-expanded equipment checks replace the old point-only/shrunken-box test. Terminal stubs alone
  // may enter their own equipment. Unresolved routes remain in the issue register and are not drawn as connected pipes.
  // Keep the bounded engineering audit lazy: drawings/tests inspect it, gameplay does not pay its startup cost.
  routeAudit=()=>{if(!routeAuditCache){const routes=routePipes(FERRY_PIPING,anchors,{y0,y1,W,z0:a,z1:F1,crossings:[f-.22,MS.auxFore-.22,F1-.22],obstacles:solids});routeAuditCache=Object.freeze({routes,issues:routes.issues});}return routeAuditCache;};
  // Retain the game's illustrative pipes while CAD/export uses engineeringPipes only. No preview is a validated spool.
  const previewClear=p=>!solids.some(b=>p.every((v,k)=>v>Math.min(b.a[k],b.b[k])+.02&&v<Math.max(b.a[k],b.b[k])-.02));
  const preview=routePipePreview(FERRY_PIPING,anchors,{y0,y1,W,crossings:[f-.22,MS.auxFore-.22,F1-.22],previewClear});
  for(const sg of pipePreviewSegments(preview)){bar(sg.a,sg.b,pipeRadius(sg.dn),parseInt(sg.colour.slice(1),16),'paint');
   for(const zb of [f+.03,MS.auxFore+.03])if(Math.abs(sg.a[0]-sg.b[0])<1e-6&&(sg.a[2]-zb)*(sg.b[2]-zb)<0){const r=pipeRadius(sg.dn);cyl(r+.03,r+.03,.05,[sg.a[0],sg.a[1],zb],0x9ea4a6,{rot:[Math.PI/2,0,0],seg:8,name:'penetration'});}}   // the bulkhead penetration piece
  for(const b of pipePreviewBends(preview)){const r=pipeRadius(b.dn)*1.3;cyl(r,r,r*2,b.p,parseInt(b.colour.slice(1),16),{seg:6,cls:'paint',name:'pipe bend'});}
  pipes.push(...preview);
 }
 return Object.freeze({boxes:Object.freeze(boxes),bars:Object.freeze(bars),glass:Object.freeze(glass),floors:Object.freeze(floors),cyls:Object.freeze(cyls),plates:Object.freeze(plates),pipes:Object.freeze(pipes),get engineeringPipes(){return routeAudit().routes;},get pipeRouteIssues(){return routeAudit().issues;},anchors:Object.freeze(anchors)});
})();

/** Where the car deck is no floor: under the flights of stair P and S, inside the casings (up to the foot, where the stair takes over). */
export function underStair(x,z,r=0){
 if(Math.abs(x)>CAS_IN-r&&z>S.head-r&&z<S.foot)return true;
 // The engine room's hatch in casing P, where its ladder goes down.
 return x>ER.hatch.x[0]-r&&z>ER.hatch.z[0]-r+.05&&z<ER.hatch.z[1];
}
export const FERRY_CASING_LIMITS=Object.freeze({aft:CAS0,fore:CAS1,inner:CAS_IN,outer:CAS_OUT,top:CAS_TOP});

