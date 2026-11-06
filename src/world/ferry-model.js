import {FERRY_H1_ENABLED,FERRY_H1} from './ferry-engine-room-plan.js';
import {pipePreviewSegments} from './ferry-pipe-routes.js';
import * as THREE from '../../vendor/three.module.js';
import {releaseAfterUpload} from '../render/canvas-release.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {FERRY_SHIP,FERRY_HEIGHTS,FERRY_CAR_PLACES,FERRY_MACHINERY} from './ferry-ship.js';
import {drawSafetyPlan,canvasPen} from './ferry-safety-plan.js';
import {FERRY_INTERIOR,FERRY_HOUSE,FERRY_ENGINE_ROOM,FERRY_STAIRS,FERRY_CREW_STAIR} from './ferry-interior.js';
import {buildFerryBridge} from './ferry-bridge.js';
import {liveValue} from './ferry-plant-controls.js';
import {paintNameBoard,paintLaneBoards} from './ferry-boards.js';

/**
 * The Minato Maru (みなと丸) as she is built: drawn from her data (ferry-ship.js FERRY_SHIP, FERRY_HEIGHTS,
 * FERRY_GA), 34.5 × 8.4 m, floating at her laden draft of 1.9 m (docs/FERRY-AUDIT.md §6, batch 5).
 *
 * Model frame, metres: +z forward, origin amidships (17.25 m from the transom), +x the port side, y up from
 * the laden waterline. A shipyard point (z from the transom, y above the keel) is at z − 17.25, y − 1.9:
 * ferry-ship.js toShip(). Static parts are merged by material into a handful of meshes.
 */
const SH=FERRY_SHIP,H=FERRY_HEIGHTS;
const L=SH.length,HALF=L/2,BEAM=SH.beam,HB=BEAM/2,DRAFT=SH.draft;
/** Shipyard z (from the transom) and height above the keel, to the model's frame. */
const Z=zy=>zy-HALF,Y=yk=>yk-DRAFT;

export const FERRY_HULL=Object.freeze({
 length:L,lengthBP:SH.lengthBP,beam:BEAM,depth:SH.depth,draft:DRAFT,
 /** The car deck above the waterline, laden: depth less draft. */
 freeboard:SH.freeboard,
 /** The model's origin is on her laden waterline. */
 origin:0,
 /** Metacentric height loaded (her roll period: ferry-ship.js rollPeriod). */
 gm:SH.gm,
 /** Her screws: four-bladed, 1.45 m. */
 screw:FERRY_MACHINERY.propellers.diameter,
});
export const WL=0;
const KEEL=-DRAFT,CAR=Y(H.carDeck),PASS=Y(H.passengerDeck),BRIDGE=Y(H.bridgeDeck),COMPASS=Y(H.compassDeck),BULWARK=1.05;

/**
 * The casings either side of the car deck, from the car deck up under the passenger deck (shipyard z 3–20),
 * 2.75 m out from the centreline to her side (1.3 m wide: batch 6f). The port one has a passage through it at the
 * gangway gate, the gangway door in her side, open aft into the foyer at the foot of stair P (the way aboard from the pier).
 */
const CAS0=Z(3),CAS1=Z(20),CAS_TOP=PASS-.25;
/** The bow houses either side of the ramp (shipyard z 30 to the stem), 2.4 m high. */
const BH0=Z(30),BH1=HALF-.05,BH_TOP=CAR+2.4;
/** The bow ramp: a 4 m leaf, 4.6 m over its girders and 4.4 m clear, and a 2 m flap, 3.6 m wide, that lies flat on the landing. */
export const FERRY_RAMP=Object.freeze({width:4.6,clear:4.4,leaf:4,flap:2,flapWidth:3.6,length:6});
/** The gangway gate in the port bulwark, in front of the gangway door in the port casing (shipyard z 13.3–14.7, 1.4 m wide: batch 6f). */
export const GATE=Object.freeze({z:-3.25,from:-3.95,to:-2.55});
/** The gangway door, where the gangway runs out to the pier. */
export const GANGWAY_Z=GATE.z;
export const FERRY_CASINGS=Object.freeze({inner:2.75,aft:CAS0,fore:CAS1,top:CAS_TOP,
 /** The passage through the port casing behind the gate: 1.4 m wide (the gate's opening), 2.2 m high, open aft into the foyer at the foot of stair P. */
 passage:Object.freeze({from:GATE.from,to:GATE.to,height:2.2}),
 bowHouses:Object.freeze({inner:2.25,aft:BH0,fore:BH1,top:BH_TOP})});
/** The gangway: 2 m of aluminium plank with hand rails. */
export const GANGWAY_LENGTH=FERRY_H1_ENABLED?FERRY_H1.gangwayLength:2;

/**
 * The car deck's working fittings, as the creator's photographs of a working road ferry show them (2026-10-13): the
 * vehicle barrier across the lanes at the bow, the lane-signal posts on the bow houses with the ramp floodlights, the
 * car deck's four hydrants on the fire main (ferry-piping.js hCar1–4) with their hose boxes, and the red walkways
 * outboard of the lanes forward of the casings. Model frame; the walk (ferry-walk.js) and the safety plan read them.
 */
export const FERRY_DECK_FITTINGS=Object.freeze({
 /** Two leaves, red and white, hinged at the bow houses' inner faces 0.7 m aft of them (clear of the forward cars'
  * noses at 28.7 m and the forecastle ladders): shut across the lanes at sea and while the ramp moves; with the ramp
  * down each lifts outboard about its foot, like a level-crossing gate, and stands on the walkway. */
 barrier:Object.freeze({z:Z(29.3),pivot:2.2,leaf:2.15,height:.9,foot:.08}),
 /** A post on each bow house's top at its aft inner corner: a board each way (aft to the deck, forward to the quay),
  * three lamps over each board's lanes, and a 500 W floodlight each way (the four ramp floodlights of FERRY_LOADS'
  * `floodlights`). Lane 1 is the starboard lane, lane 2 the port, the truck's lane the centreline (FERRY_TRUCK_PLAN). */
 signals:Object.freeze({x:2.62,z:BH0+.32,height:2.6,board:Object.freeze([1.0,.72]),boardY:1.2}),
 /** The car deck's hydrants: aft on the casings' inner faces beside the hose boxes, forward on the bulwark at the walkway. */
 hydrants:Object.freeze([
  Object.freeze({id:'hCar1',side:1,zy:15.8,on:'casing'}),Object.freeze({id:'hCar2',side:-1,zy:15.8,on:'casing'}),
  Object.freeze({id:'hCar3',side:1,zy:24,on:'bulwark'}),Object.freeze({id:'hCar4',side:-1,zy:24,on:'bulwark'})]),
 /** The red walkways: from the casings' forward ends to the bow houses, between the lane line and the bulwark. */
 walkway:Object.freeze({from:Z(20.2),to:BH0,inner:2.76}),
});

/** Where things are on her, along her (z) and up (y), model frame. */
export const FERRY_DECKS=Object.freeze({
 /** The car deck: from the aft mooring station to the bow houses, two lanes of 2.75 m between the casings. */
 car:Object.freeze({y:CAR,fore:Z(30),aft:Z(12.6),lanes:Object.freeze([1.375,-1.375]),laneWidth:2.75,
  /** The six car places (ferry-ship.js FERRY_CAR_PLACES), nose to the ramp: [x, z]. */
  slots:Object.freeze(FERRY_CAR_PLACES.map(p=>Object.freeze([p.x,Z(p.z)]))),
  /** Covered by the passenger deck from the transom to 23 m; open forward of it. */
  open:false,
  /** The casings either side, 1 m wide: the lanes stop at them. */
  walkway:HB-2.75,bulwark:BULWARK}),
 /** The passenger deckhouse on the passenger deck: lobby, toilets, carpet room, saloon. */
 saloon:Object.freeze({fore:Z(23),aft:Z(6),width:6.8,lobbyWidth:8.2,height:BRIDGE-PASS}),
 /** The aft mooring station on the car deck. */
 stern:Object.freeze({fore:Z(2.5),aft:-HALF}),
 /** The passenger deck: the open deck aft, the side walkways, over the car deck from the transom to 23 m. */
 upper:Object.freeze({y:PASS,fore:Z(23),aft:-HALF}),
 wheelhouse:Object.freeze({fore:Z(23),aft:Z(19.5),width:6,height:COMPASS-BRIDGE}),
 bridge:Object.freeze({y:BRIDGE}),compass:Object.freeze({y:COMPASS}),
 /** Where a passenger rides a crossing: the open deck aft, between the benches. */
 passenger:Object.freeze([0,PASS,Z(1.8)]),
});

/**
 * The decks a person walks on outside (model frame): a rectangle each and its floor. Every floor a person walks on,
 * inside and out, with its edges, is in ferry-interior.js and ferry-walk.js; these are the open decks under the sky.
 */
export const FERRY_WALK=Object.freeze([
 ['car-deck-foyer',[2.9,3.9],[Z(12.7),Z(14.6)],CAR],
 ['lower-lobby',[-1.6,1.6],[Z(4),Z(11.6)],CAR],
 ['car-deck-port-lane',[.1,2.6],[Z(20.5),Z(29.5)],CAR],
 ['car-deck-starboard-lane',[-2.6,-.1],[Z(20.5),Z(29.5)],CAR],
 ['aft-mooring',[-3.6,3.6],[Z(.5),Z(2.4)],CAR],
 ['open-deck',[-3.7,3.7],[Z(.4),Z(4)],PASS],
 ['bridge-deck-aft',[-2.5,2.5],[Z(4.85),Z(5.95)],BRIDGE],
 ['walkway-p',[3.5,4.05],[Z(9.6),Z(17.5)],PASS],
 ['walkway-s',[-4.05,-3.5],[Z(9.6),Z(17.5)],PASS],
 ['bridge-deck-p',[3.05,4.0],[Z(6.2),Z(9.4)],BRIDGE],
 ['bridge-deck-s',[-4.0,-3.05],[Z(6.2),Z(9.4)],BRIDGE],
 ['wing-p',[3.05,4.0],[Z(19.6),Z(22.9)],BRIDGE],
 ['wing-s',[-4.0,-3.05],[Z(19.6),Z(22.9)],BRIDGE],
 ['compass-deck',[-2.9,2.9],[Z(19.6),Z(22.9)],COMPASS],
].map(([id,x,z,y])=>Object.freeze({id,x:Object.freeze(x),z:Object.freeze(z),y})));

/** The sheer: the deck edge rises toward the bow, a little toward the stern. */
export const sheer=z=>z>0?.3*(z/HALF)**2:.1*(z/HALF)**2;
export const deckEdge=z=>CAR-.06+sheer(z);
export const bulwarkTop=z=>deckEdge(z)+BULWARK;
/** Half-breadth at the deck: a long parallel body, drawn in a little toward the blunt bow and the transom. */
const FWD=Z(28.5),AFT=Z(1.5);
export const halfBreadth=z=>z>FWD?HB-.32*((z-FWD)/(HALF-FWD))**2:z<AFT?HB-.12*((AFT-z)/(HALF+AFT))**2:HB;
/** The keel line: a spoon forefoot under the bow, and a counter rising aft over the screws. */
const FOREFOOT=Z(25.5),COUNTER=Z(10.5),COUNTER_TOP=Z(4);
export function keelY(z){
 if(z>FOREFOOT)return KEEL+1.75*((z-FOREFOOT)/(HALF-FOREFOOT))**2;
 if(z<COUNTER){const t=Math.min(1,(COUNTER-z)/(COUNTER-COUNTER_TOP)),s=t*t*(3-2*t);let y=KEEL+1.85*s;if(z<COUNTER_TOP)y+=.1*((COUNTER_TOP-z)/(COUNTER_TOP+HALF));return y;}
 return KEEL;
}
/** How full the section is: boxy amidships (a small bilge radius), rounder at the ends. */
const fullness=z=>z>Z(24)?7-4.2*((z-Z(24))/(HALF-Z(24))):z<Z(9)?7-2.5*((Z(9)-z)/(Z(9)+HALF)):7;
const narrowing=z=>z>Z(26)?.12*((z-Z(26))/(HALF-Z(26)))**2:0;
/** A point on the section at z, for θ from 0 (the keel, on the centreline) to π/2 (the deck edge). */
export function sectionPoint(z,theta){
 const n=fullness(z),k=keelY(z),top=deckEdge(z),hb=halfBreadth(z);
 const sn=Math.sin(theta),cs=Math.cos(theta);
 const y=k+(top-k)*(1-Math.pow(Math.max(0,cs),2/n));
 const x=hb*Math.pow(Math.max(0,sn),2/n)*(1-narrowing(z)*Math.max(0,Math.min(1,(top-y)/(top-k))));
 return [x,y];
}
/** The hull's half-breadth at a height y and station z (for marks that sit on the plating). */
export function hullX(y,z){
 const k=keelY(z),top=deckEdge(z);if(y>=top)return halfBreadth(z);if(y<=k)return 0;
 let a=0,b=Math.PI/2;for(let i=0;i<40;i++){const m=(a+b)/2;if(sectionPoint(z,m)[1]<y)a=m;else b=m;}
 return sectionPoint(z,(a+b)/2)[0];
}

const ANTIFOULING=0x8e3a30,TEAL=0x2f6f74,WHITE=0xeeeae0,DECKGREEN=0x6f7d6c,BULWARK_IN=0xdedbd0,DECKHEAD=0xc9c7bd,
 STEEL=0x7d8586,DARK=0x2a2f31,BRONZE=0xb08a4a,ORANGE=0xe0702a,RED=0xc2412f,YELLOW=0xe0b93a,ZINC=0xb9bcb8,TEAK=0x8d6f4c,
 DOOR=0x5d6b6a,CANVAS=0xe9e4d4;
/** Paint on the hull, by height: red-brown antifouling up to the boot line, white topsides, the teal sheer band, white bulwarks. */
const BOOT=WL+.1,BAND=.42;
const bandColour=(y,z)=>y<BOOT?ANTIFOULING:y<deckEdge(z)-BAND?WHITE:y<deckEdge(z)-.02?TEAL:WHITE;

/** The hull shell: an indexed loft of sections, each split exactly at the paint lines. */
function hullShell(){
 const stations=[];for(let z=-HALF;z<=HALF+1e-6;z+=.5)stations.push(+z.toFixed(3));
 const thetas=[];for(let i=0;i<=24;i++){const u=i/24;thetas.push(Math.PI/2*(u<.5?2*u*u:1-2*(1-u)*(1-u)));}
 const sectionRows=z=>{
  const solve=y=>{let a=0,b=Math.PI/2;for(let i=0;i<40;i++){const m=(a+b)/2;if(sectionPoint(z,m)[1]<y)a=m;else b=m;}return (a+b)/2;};
  const marks=[BOOT,deckEdge(z)-BAND,deckEdge(z)-.02].filter(y=>y>keelY(z)+.01).map(y=>({t:solve(y),dup:true}));
  const rows=[...thetas.map(t=>({t})),...marks].sort((a,b)=>a.t-b.t);
  const out=[];for(const r of rows){const [x,y]=sectionPoint(z,r.t);out.push({x,y,c:bandColour(y-.001,z)});if(r.dup)out.push({x,y,c:bandColour(y+.001,z)});}
  out.push({x:halfBreadth(z),y:bulwarkTop(z),c:WHITE});
  return out;
 };
 const pos=[],col=[],idx=[],c=new THREE.Color();let per=0;
 for(const z of stations){
  const rows=sectionRows(z);per=rows.length*2;
  for(const side of [1,-1]){const list=side===1?[...rows].reverse():rows;for(const r of list){pos.push(r.x*side,r.y,z);c.setHex(r.c);col.push(c.r,c.g,c.b);}}
 }
 // The port bulwark is open at the gangway gate: no plating between those two stations.
 for(let i=0;i<stations.length-1;i++)for(let j=0;j<per-1;j++){if(j===0&&stations[i]>=GATE.from-1e-6&&stations[i+1]<=GATE.to+1e-6)continue;const a=i*per+j,b=a+1,d=a+per,e=d+1;idx.push(a,d,b,b,d,e);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 const mid=Math.floor(stations.length/2)*per+Math.floor(per/4),n=g.getAttribute('normal');
 if(n.getX(mid)<0){for(let k=0;k<idx.length;k+=3){const t=idx[k];idx[k]=idx[k+1];idx[k+1]=t;}g.setIndex(idx);g.computeVertexNormals();}
 // The ends: the transom full height; the bow plated up to the car deck only, where the ramp closes it.
 const ends=[];
 for(const [z,full,facing] of [[-HALF,true,-1],[HALF,false,1]]){
  const rows=sectionRows(z).filter(r=>full||r.y<=CAR-.02+1e-6),p=[],cc=[];
  const put=(q,hex)=>{p.push(q[0],q[1],z);c.setHex(hex);cc.push(c.r,c.g,c.b);};
  for(let k=0;k<rows.length-1;k++){
   const a=rows[k],b=rows[k+1];if(Math.abs(a.y-b.y)<1e-6&&Math.abs(a.x-b.x)<1e-6)continue;
   const hex=a.c===b.c?a.c:b.c,quad=[[a.x,a.y],[-a.x,a.y],[b.x,b.y],[-a.x,a.y],[-b.x,b.y],[b.x,b.y]];
   for(let t=0;t<6;t+=3){
    const tri=quad.slice(t,t+3),[[x0,y0],[x1,y1],[x2,y2]]=tri,cz=(x1-x0)*(y2-y0)-(y1-y0)*(x2-x0);
    if(Math.abs(cz)<1e-10)continue;
    if(Math.sign(cz)!==facing)tri.reverse();
    for(const q of tri)put(q,hex);
   }
  }
  const e=new THREE.BufferGeometry();e.setAttribute('position',new THREE.Float32BufferAttribute(p,3));e.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));e.computeVertexNormals();
  ends.push(e);
 }
 return [g.toNonIndexed(),...ends];
}

/** The car deck's plating and the inside of the bulwarks, following the hull's breadth. */
function deckAndBulwarks(){
 const p=[],cc=[],c=new THREE.Color(),A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3();
 const tri=(a,b,d,toward,hex)=>{A.set(...a);B.set(...b).sub(A);C.set(...d).sub(A);const n=B.cross(C);const list=n.dot(toward)>=0?[a,b,d]:[a,d,b];c.setHex(hex);for(const q of list){p.push(...q);cc.push(c.r,c.g,c.b);}};
 const up=new THREE.Vector3(0,1,0);
 for(let z=-HALF;z<HALF-1e-6;z+=.5){
  const z2=z+.5,w1=halfBreadth(z)-.07,w2=halfBreadth(z2)-.07;
  // Open over the engine room's hatch in casing P (ferry-interior.js FERRY_ENGINE_ROOM.hatch).
  const H=FERRY_ENGINE_ROOM.hatch,open=z>=H.z[0]-1e-6&&z2<=H.z[1]+1e-6,p1=open?H.x[0]:w1,p2=open?H.x[0]:w2;
  tri([-w1,CAR,z],[p1,CAR,z],[-w2,CAR,z2],up,DECKGREEN);tri([p1,CAR,z],[p2,CAR,z2],[-w2,CAR,z2],up,DECKGREEN);
  for(const side of [1,-1]){
   if(side===1&&z>=GATE.from-1e-6&&z2<=GATE.to+1e-6)continue;
   const inward=new THREE.Vector3(-side,0,0),a=[side*w1,CAR,z],b=[side*w1,bulwarkTop(z)-.02,z],d=[side*w2,CAR,z2],e=[side*w2,bulwarkTop(z2)-.02,z2];
   tri(a,b,d,inward,BULWARK_IN);tri(b,e,d,inward,BULWARK_IN);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));g.computeVertexNormals();return g;
}

/**
 * A plate (ferry-interior.js plates): by `kind`, a maker's plate or label (lines of text on a plate), a `dial` (a round
 * gauge with ticks, a red zone, the needle at `value` 0–1 and the label under the pivot), `chequer` (floor plates:
 * raised diamonds, a seam every 0.6 m) or `grating` (bars over the red bilge). Texts are drawn on a canvas once;
 * patterns repeat across the plane.
 */
function plateMesh(pl,{deferred=false}={}){
 if(typeof document==='undefined')return null;
 // The canvas has the plate's own proportions (a 0.76 × 0.03 m label gets a 25 : 1 canvas), so no lettering is stretched.
 const kind=pl.kind||'text',c=document.createElement('canvas');let H=Math.max(64,Math.round(512*pl.h/pl.w)),W=Math.min(2048,Math.max(64,Math.round(H*pl.w/pl.h))),repeat=null;
 if(kind==='dial')W=H=pl.live?384:256;if(kind==='chequer'||kind==='grating'){W=H=256;repeat=[pl.w/.6,pl.h/.6];}if(kind==='safety-plan'||kind==='alarms'||kind==='readout'||kind==='scope'){W=1024;H=Math.round(1024*pl.h/pl.w);}
 c.width=W;c.height=H;const x=c.getContext('2d');
 const still=ctx=>drawPlate(ctx,W,H,pl,pl.kind==='alarms'?[]:pl.kind==='readout'?pl.lines:pl.value);
 if(pl.live||!deferred)still(x);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 if(repeat){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(repeat[0],repeat[1]);}
 if(!pl.live)releaseAfterUpload(tex,still,{width:W,height:H,deferred});
 const flat=repeat!==null,mat=new THREE.MeshStandardMaterial({map:tex,roughness:flat?.62:.5,metalness:flat?.35:.3,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 const geo=kind==='dial'?new THREE.CircleGeometry(pl.w/2,24):new THREE.PlaneGeometry(pl.w,pl.h);
 const mesh=new THREE.Mesh(geo,mat);
 mesh.position.set(...pl.pos);mesh.rotation.order='YXZ';mesh.rotation.y=pl.rotY;mesh.rotation.x=pl.rotX||0;mesh.name=pl.name;mesh.userData.plate=kind;
 // A live plate (a dial of the plant, the alarm matrix) is redrawn when its reading changes (6r-2, ferry.js readPlant).
 if(pl.live){let last=null;mesh.userData.live={key:pl.live,show(v){const k=Array.isArray(v)?v.join('|'):Math.round(v*1000);if(k===last)return false;last=k;drawPlate(x,W,H,pl,v);tex.needsUpdate=true;return true;}};}
 return mesh;
}
/** Sets a font of `size` px at most, shrunk until `text` measures no wider than `maxW` (nothing bleeds over its lamp or dial). */
function fitFont(x,text,size,maxW,family='sans-serif',weight='bold '){x.font=weight+size+'px '+family;const w=x.measureText(text).width;if(w>maxW){size=Math.max(6,Math.floor(size*maxW/w));x.font=weight+size+'px '+family;}return size;}
/** Wraps `text` by words into lines no wider than `maxW` at `size` px bold (a word wider than the lamp stays whole on its own line). */
function wrapWords(x,text,maxW,size){x.font='bold '+size+'px sans-serif';const out=[];let line='';for(const w of text.split(' ')){const t=line?line+' '+w:w;if(line&&x.measureText(t).width>maxW){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;}
/** Draws a plate's face on its canvas: `value` is a dial's needle (0–1) or the alarm matrix's lit names. */
function drawPlate(x,W,H,pl,value){
 const kind=pl.kind||'text';
 if(kind==='text'){
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);x.strokeStyle=pl.fg;x.lineWidth=4;x.strokeRect(6,6,W-12,H-12);
  x.fillStyle=pl.fg;x.textAlign='center';x.textBaseline='middle';
  const n=pl.lines.length,rowH=(H-20)/n;
  pl.lines.forEach((line,i)=>{const big=i===0||n===1;fitFont(x,line,Math.round(rowH*.72),W-24,'sans-serif',big?'bold ':'');x.fillText(line,W/2,10+rowH*(i+.5));});
 }else if(kind==='dial'){
  // A gauge a chief can read from the door: a numbered scale when the dial has a range, big lettering, the reading written under the pivot.
  const cx=W/2,cy=H/2,R=W*.46,a0=Math.PI*.75,a1=Math.PI*2.25,ang=f=>a0+(a1-a0)*Math.max(0,Math.min(1,f));
  x.fillStyle='#1c1f21';x.beginPath();x.arc(cx,cy,W/2,0,Math.PI*2);x.fill();                       // the bezel
  x.fillStyle=pl.bg;x.beginPath();x.arc(cx,cy,R,0,Math.PI*2);x.fill();                             // the face
  if(pl.red){x.strokeStyle='#c2412f';x.lineWidth=W*.06;x.beginPath();x.arc(cx,cy,R*.84,ang(pl.red[0]),ang(pl.red[1]));x.stroke();}
  x.strokeStyle=pl.fg;for(let i=0;i<=20;i++){const a=ang(i/20),big=i%5===0;x.lineWidth=big?W*.018:W*.008;
   x.beginPath();x.moveTo(cx+Math.cos(a)*R*.92,cy+Math.sin(a)*R*.92);x.lineTo(cx+Math.cos(a)*R*(big?.74:.82),cy+Math.sin(a)*R*(big?.74:.82));x.stroke();}
  x.fillStyle=pl.fg;x.textAlign='center';x.textBaseline='middle';
  if(pl.range){const [lo,hi]=pl.range;x.font='bold '+Math.round(W*.085)+'px sans-serif';for(let i=0;i<=4;i++){const a=ang(i/4),n=lo+(hi-lo)*i/4;x.fillText(String(Math.round(n*10)/10),cx+Math.cos(a)*R*.58,cy+Math.sin(a)*R*.58);}}
  if(pl.lines[0]){fitFont(x,pl.lines[0],Math.round(W*.12),R*1.1);x.fillText(pl.lines[0],cx,cy+R*.4);}
  if(pl.lines[1]){fitFont(x,pl.lines[1],Math.round(W*.095),R*.9,'sans-serif','');x.fillText(pl.lines[1],cx,cy-R*.36);}
  const v=value??0,a=ang(v);
  if(pl.range){const n=pl.range[0]+(pl.range[1]-pl.range[0])*Math.max(0,Math.min(1,v));x.fillStyle='#101416';x.fillRect(cx-R*.3,cy+R*.6,R*.6,R*.2);x.fillStyle='#9fe3a8';x.font='bold '+Math.round(W*.09)+'px monospace';x.fillText((pl.range[1]-pl.range[0]>20?Math.round(n):Math.round(n*10)/10)+'',cx,cy+R*.7);}
  x.strokeStyle='#c2412f';x.lineWidth=W*.022;x.beginPath();x.moveTo(cx-Math.cos(a)*R*.12,cy-Math.sin(a)*R*.12);x.lineTo(cx+Math.cos(a)*R*.88,cy+Math.sin(a)*R*.88);x.stroke();
  x.fillStyle='#1c1f21';x.beginPath();x.arc(cx,cy,W*.045,0,Math.PI*2);x.fill();
 }else if(kind==='alarms'){
  // 4 rows of 8 lamps with their names, red the first sixteen and amber the rest, lit by the plant's readings.
  const lit=new Set(value||[]),cols=8,rows=Math.ceil(pl.lines.length/cols),cw=W/cols,rh=H/rows,size=Math.round(rh*.27);
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);
  pl.lines.forEach((name,j)=>{const r=Math.floor(j/cols),c=j%cols,px=c*cw,py=r*rh,on=lit.has(name),amber=j>=16;
   x.fillStyle='#15181a';x.fillRect(px+2,py+2,cw-4,rh-4);x.fillStyle=on?(amber?'#e0b93a':'#d9442f'):(amber?'#5a4a1a':'#4a1f1a');x.fillRect(px+5,py+5,cw-10,rh-10);
   // Every lamp's name wrapped by words to its lamp at one shared size (compact, and all the same to read); only a single
   // word too long for a lamp (TELEGRAPH, SEPARATOR) is set a little smaller.
   const rows=wrapWords(x,name,cw-18,size);x.fillStyle=on?'#1c1f21':'#d8d2c0';x.textAlign='center';x.textBaseline='middle';
   const fit=Math.min(...rows.map(t=>fitFont(x,t,size,cw-18)));x.font='bold '+fit+'px sans-serif';
   rows.forEach((t,i)=>x.fillText(t,px+cw/2,py+rh/2+(i-(rows.length-1)/2)*fit*1.08));});
 }else if(kind==='readout'){
  // The readout strip: green lettering on a dark panel, two lines, every reading written out.
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);x.strokeStyle='#3a4244';x.lineWidth=4;x.strokeRect(2,2,W-4,H-4);
  const rows=value||pl.lines;x.fillStyle=pl.fg;x.textAlign='left';x.textBaseline='middle';
  const size=Math.min(...rows.map(t=>fitFont(x,t,Math.round(H/rows.length*.72),W-24,'monospace')));x.font='bold '+size+'px monospace';   // one size for every line
  rows.forEach((t,i)=>x.fillText(t,12,H*(i+.5)/rows.length));
 }else if(kind==='scope'){
  // A cathode-ray oscilloscope: the graticule, CH1 a 60 Hz sine over two cycles, CH2 a smaller one a third of a cycle on.
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);x.strokeStyle='rgba(74,222,128,.25)';x.lineWidth=2;
  for(let i=0;i<=10;i++){x.beginPath();x.moveTo(i*W/10,0);x.lineTo(i*W/10,H);x.stroke();}for(let j=0;j<=8;j++){x.beginPath();x.moveTo(0,j*H/8);x.lineTo(W,j*H/8);x.stroke();}
  for(const [amp,phase,col] of [[.34,0,pl.fg],[.22,2.094,'#38bdf8']]){x.strokeStyle=col;x.lineWidth=6;x.beginPath();for(let i=0;i<=200;i++){const t=i/200,y=H/2-Math.sin(t*Math.PI*4+phase)*H*amp;i?x.lineTo(t*W,y):x.moveTo(0,y);}x.stroke();}
  x.fillStyle=pl.fg;x.textAlign='left';x.textBaseline='top';x.font='bold '+Math.round(H*.08)+'px monospace';pl.lines.forEach((t,i)=>x.fillText(t,14,10+i*H*.09));
 }else if(kind==='safety-plan'){
  drawSafetyPlan(canvasPen(x),W,H,pl.here);x.strokeStyle='#1d2326';x.lineWidth=6;x.setLineDash([]);x.strokeRect(3,3,W-6,H-6);
 }else if(kind==='chequer'){
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);const n=8,s=W/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const px=i*s+s/2,py=j*s+s/2,along=(i+j)%2===0;x.save();x.translate(px,py);x.rotate(along?Math.PI/4:-Math.PI/4);
   x.fillStyle=pl.fg;x.fillRect(-s*.1,-s*.34,s*.2,s*.68);x.fillStyle='#bfc4c6';x.fillRect(-s*.1,-s*.34,s*.2,s*.08);x.restore();}
  x.strokeStyle='#5e6467';x.lineWidth=5;x.strokeRect(2,2,W-4,H-4);                                 // the plate's edge, a seam every tile
 }else if(kind==='grating'){
  x.fillStyle=pl.bg;x.fillRect(0,0,W,H);x.fillStyle=pl.fg;const n=12,s=W/n;for(let i=0;i<n;i++)x.fillRect(i*s,0,s*.55,H);
  x.fillStyle='#4a5053';for(let j=0;j<4;j++)x.fillRect(0,j*H/4+H/8-3,W,6);
 }
}

/** Collects static parts by material and merges them. */
/**
 * Under globalThis.__KIT_TRACE__ (tools/z-fighting.mjs and the tests that call it) every piece the kit merges remembers
 * the source line that made it, so a finding names it: the interior's boxes carry theirs from ferry-interior.js
 * (`where`, passed through __KIT_WHERE__), the rest the first line outside the kit.
 */
const stackWhere=()=>{for(const l of (new Error().stack||'').split('\n').slice(2)){if(/at (?:Object\.)?(add|box|block|cyl|bar|prep|stackWhere) /.test(l))continue;const m=l.match(/([\w.-]+\.js):(\d+)/);if(m)return m[1]+':'+m[2];}return null;};
function createKit(shadows){
 const groups=new Map();const c=new THREE.Color();
 const prep=(geo,hex)=>{let g=geo.index?geo.toNonIndexed():geo;g.deleteAttribute('uv');g.deleteAttribute('uv1');
  if(!g.getAttribute('color')){const n=g.getAttribute('position').count,a=new Float32Array(n*3);c.setHex(hex);for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));}
  return g;};
 const add=(cls,geo,hex=WHITE,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>{
  const m=new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot,'YXZ')),new THREE.Vector3(...scale));
  const g=prep(geo,hex);g.applyMatrix4(m);if(globalThis.__KIT_TRACE__)g.userData.where=globalThis.__KIT_WHERE__||stackWhere();(groups.get(cls)||groups.set(cls,[]).get(cls)).push(g);return g;};
 const box=(cls,size,pos,hex,rot)=>add(cls,new THREE.BoxGeometry(...size),hex,pos,rot);
 /** A box between two corners [x0,y0,z0]–[x1,y1,z1]. */
 /** A box between two corners [x0,y0,z0]–[x1,y1,z1]. Paint thinner than 2 cm is a decal (a floor covering, a painted
  * stripe, a sign) lying on another face: it is drawn with a depth offset so a phone, which cannot tell a few
  * millimetres apart at a few metres, never flickers between the two (the creator, 2026-10-12: "I don't want flashing
  * graphics like that"). */
 const block=(cls,a,b,hex)=>{const size=[Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]),Math.abs(b[2]-a[2])];return box(cls==='paint'&&Math.min(...size)<=.02?'decal':cls,size,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],hex);};
 const cyl=(cls,rt,rb,h,pos,hex,rot,seg=12)=>add(cls,new THREE.CylinderGeometry(rt,rb,h,seg),hex,pos,rot);
 const bar=(cls,a,b,r,hex,seg=6)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),len=A.distanceTo(B);const g=new THREE.CylinderGeometry(r,r,len,seg);g.translate(0,len/2,0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize()));g.translate(...a);return add(cls,g,hex);};
 const materials={
  paint:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.58,metalness:.05}),
  metal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.55}),
  rubber:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),
  decal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.58,metalness:.05,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}),
 };
 const finish=parent=>{
  for(const [cls,list] of groups){const mesh=new THREE.Mesh(mergeGeometries(list,false),materials[cls]||materials.paint);mesh.name='Minato Maru '+cls;mesh.castShadow=mesh.receiveShadow=!!shadows;
   if(globalThis.__KIT_TRACE__){let at=0;mesh.userData.kitSources=list.map(g=>{const r={start:at,count:g.attributes.position.count,where:g.userData.where};at+=r.count;return r;});}
   parent.add(mesh);}
 };
 return {add,box,block,cyl,bar,finish,materials};
}

/** Painted words and marks: name, port of registry, draft marks, load line, signs, the funnels' anchor. */
function markings(){
 const W=1024,H2=512,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;
 if(!canvas)return null;
 canvas.width=W;canvas.height=H2;const x=canvas.getContext('2d');x.clearRect(0,0,W,H2);
 const cell=(i,j,w,h)=>[i*W/4,j*H2/4,w*W/4,h*H2/4];
 // Row 0 left: the name on the bow, teal on the white topsides.
 x.fillStyle='#24585c';x.textAlign='center';x.textBaseline='middle';
 x.font='bold 66px "Hiragino Sans","Noto Sans JP",sans-serif';x.fillText('みなと丸',W*.25,H2*.09);
 x.font='bold 40px sans-serif';x.fillText('MINATO MARU',W*.25,H2*.19);
 // Row 0 right: the transom: name and port of registry.
 x.font='bold 54px "Hiragino Sans","Noto Sans JP",sans-serif';x.fillText('みなと丸',W*.75,H2*.08);
 x.font='bold 34px sans-serif';x.fillText('MINATO',W*.75,H2*.19);
 // Rows 2–3, first cell: the draft marks, every 0.2 m from 1.2 to 2.4 m; white on the antifouling, teal above the boot line.
 {const [dx,dy,dw,dh]=cell(0,2,1,2);x.textAlign='left';x.textBaseline='bottom';x.font='bold 30px sans-serif';
  for(let k=0;k<=6;k++){const m=1.2+k*.2,y=dy+dh-(k/6.4)*dh;x.fillStyle=m-DRAFT<BOOT-WL-1e-6?'#f4f1e8':'#24585c';x.fillText(Math.abs(m-Math.round(m))<1e-6?m.toFixed(0)+'M':String(Math.round(m*10)%10),dx+8,y);}}
 // The load line mark (満載喫水線標): a ring with a bar through it, J G either side, teal on white.
 {const [lx,ly]=cell(1,2,1,2);x.strokeStyle='#24585c';x.lineWidth=7;x.beginPath();x.arc(lx+128,ly+120,58,0,Math.PI*2);x.stroke();
  x.fillStyle='#24585c';x.fillRect(lx+40,ly+116,176,9);x.font='bold 38px sans-serif';x.textBaseline='middle';x.textAlign='left';x.fillText('J',lx+70,ly+72);x.fillText('G',lx+166,ly+72);}
 // The bow-thruster mark.
 {const [tx,ty]=cell(2,2,1,2);x.strokeStyle='#24585c';x.lineWidth=6;x.strokeRect(tx+40,ty+70,90,90);x.beginPath();x.moveTo(tx+60,ty+115);x.lineTo(tx+110,ty+115);x.moveTo(tx+60,ty+115);x.lineTo(tx+74,ty+100);x.moveTo(tx+60,ty+115);x.lineTo(tx+74,ty+130);x.moveTo(tx+110,ty+115);x.lineTo(tx+96,ty+100);x.moveTo(tx+110,ty+115);x.lineTo(tx+96,ty+130);x.stroke();}
 // The life-jacket and muster signs.
 {const [sx,sy]=cell(3,2,1,2);x.textAlign='center';x.textBaseline='alphabetic';x.fillStyle='#1f7a4a';x.fillRect(sx+10,sy+20,236,90);x.fillStyle='#fff';x.font='bold 36px "Hiragino Sans","Noto Sans JP",sans-serif';x.fillText('救命胴衣',sx+128,sy+62);x.font='bold 22px sans-serif';x.fillText('LIFE JACKETS',sx+128,sy+96);
  x.fillStyle='#e0702a';x.fillRect(sx+10,sy+140,236,90);x.fillStyle='#fff';x.font='bold 36px "Hiragino Sans","Noto Sans JP",sans-serif';x.fillText('集合場所',sx+128,sy+182);x.font='bold 22px sans-serif';x.fillText('MUSTER STATION',sx+128,sy+216);}
 // Row 1, cells 1–2: her name board (a white board with a teal border) for the bridge house, its two names laid out
 // from their measured widths (ferry-boards.js).
 paintNameBoard(x,cell(1,1,2,1));
 // Row 1, cell 3: the door signs, three strips (engine room, red; crew only, teal; wheelhouse, teal).
 {const [sx,sy,sw,sh]=cell(3,1,1,1),strip=(k,bg)=>{const y=sy+8+k*40;x.fillStyle=bg;x.fillRect(sx+6,y,sw-12,34);x.fillStyle='#f4f1e8';x.textAlign='center';x.textBaseline='middle';return y+17;};
  const jp=()=>{x.font='bold 19px "Hiragino Sans","Noto Sans JP",sans-serif';return sx+sw*.3;},en=()=>{x.font='bold 13px sans-serif';return sx+sw*.72;};let y;
  y=strip(0,'#b03a2a');x.fillText('機関室',jp(),y);x.fillText('ENGINE ROOM',en(),y);
  y=strip(1,'#24585c');x.fillText('乗組員専用',jp(),y);x.fillText('CREW ONLY',en(),y);
  y=strip(2,'#24585c');x.fillText('操舵室',jp(),y);x.fillText('WHEELHOUSE',en(),y);}
 // Row 1, first cell: the town's anchor, white, for the funnels.
 {const [ax,ay]=cell(0,1,1,1),cx=ax+128,cy=ay+66;x.strokeStyle='#f4f1e8';x.fillStyle='#f4f1e8';x.lineWidth=9;x.lineCap='round';
  x.beginPath();x.arc(cx,cy-38,11,0,Math.PI*2);x.stroke();x.beginPath();x.moveTo(cx,cy-27);x.lineTo(cx,cy+40);x.moveTo(cx-24,cy-14);x.lineTo(cx+24,cy-14);x.stroke();
  x.beginPath();x.arc(cx,cy+8,34,Math.PI*.15,Math.PI*.85);x.stroke();}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 return {tex,cell:(i,j,w,h)=>[i/4,1-(j+h)/4,w/4,h/4]};
}

/**
 * The signs on the car deck (Japanese, as aboard; plates like ferry-interior.js's, drawn by plateMesh): 非常口 over the
 * engine room's escape door and 前に物を置かないでください (keep the way in front clear) on it; 消火ホース on the hose
 * boxes forward (FERRY_DECK_FITTINGS.hydrants).
 */
export const FERRY_DECK_SIGNS=Object.freeze([
  {name:'Emergency exit sign',lines:['非常口','EMERGENCY EXIT'],bg:'#1f7a4a',fg:'#f4f1e8',w:.6,h:.24,pos:[-2.705,CAR+2.15,Z(6.5)],rotY:Math.PI/2},
  {name:'Keep clear sign',lines:['前に物を置かないでください','KEEP CLEAR'],bg:'#f4f1e8',fg:'#1d2326',w:.5,h:.2,pos:[-2.705,CAR+1.45,Z(6.5)],rotY:Math.PI/2},
  ...FERRY_DECK_FITTINGS.hydrants.filter(h=>h.on==='bulwark').map(h=>{const z=Z(h.zy)+.775,x=h.side*(halfBreadth(z)-.305);
   return {name:'Fire hose sign',lines:['消火ホース','FIRE HOSE'],bg:'#f4f1e8',fg:'#b03a2a',w:.5,h:.24,pos:[x,CAR+1.2,z],rotY:h.side>0?-Math.PI/2:Math.PI/2};})]);

/** The ferry, whole. Returns the group with its moving parts in userData. */
export function buildFerryModel({shadows=false}={}){
 const ferry=new THREE.Group();ferry.name='Minato Maru';
 const kit=createKit(shadows),glass=[];
 /** A guard rail from a to b ([x, z]) on a deck at height y: two rails and a stanchion every 1.2 m or less. */
 const rail=(a,b,y=PASS,hex=WHITE)=>{for(const h of [.5,1.05])kit.bar('paint',[a[0],y+h,a[1]],[b[0],y+h,b[1]],.025,hex,5);
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/1.2));for(let i=0;i<=n;i++){const f=i/n;kit.bar('paint',[a[0]+(b[0]-a[0])*f,y,a[1]+(b[1]-a[1])*f],[a[0]+(b[0]-a[0])*f,y+1.05,a[1]+(b[1]-a[1])*f],.025,hex,5);}};
 const win=(size,pos,rot)=>glass.push([size,pos,rot]);
 // ---- The hull and the car deck.
 for(const g of hullShell())kit.add('paint',g);
 kit.add('paint',deckAndBulwarks());
 // The rubbing strake (fender belt) along the sheer, and the bulwark's cap rail.
 for(const side of [1,-1]){
  for(let z=-HALF+.25;z<HALF-.2;z+=1){const z2=Math.min(HALF-.2,z+1);
   kit.bar('rubber',[side*(halfBreadth(z)+.06),deckEdge(z)-.14,z],[side*(halfBreadth(z2)+.06),deckEdge(z2)-.14,z2],.1,DARK,6);
   if(side===1&&z2>GATE.from&&z<GATE.to){for(const [a,b] of [[z,GATE.from],[GATE.to,z2]])if(b-a>.05)kit.bar('paint',[side*(halfBreadth(a)-.03),bulwarkTop(a)+.02,a],[side*(halfBreadth(b)-.03),bulwarkTop(b)+.02,b],.05,TEAL,5);}
   else kit.bar('paint',[side*(halfBreadth(z)-.03),bulwarkTop(z)+.02,z],[side*(halfBreadth(z2)-.03),bulwarkTop(z2)+.02,z2],.05,TEAL,5);}
  // Freeing ports in the bulwark of the open car deck forward, and the scuppers along the casings.
  for(let zy=21;zy<29.6;zy+=1.7){const z=Z(zy);kit.box('paint',[.03,.22,.6],[side*(halfBreadth(z)-.06),CAR+.135,z],DARK);}   // its foot 2.5 cm up, clear of the deck plane
 }
 for(const z of [GATE.from,GATE.to])kit.box('paint',[.12,BULWARK+.04,.08],[halfBreadth(z)-.05,CAR+BULWARK/2,z],WHITE);
 // ---- Under the water: keel bar, skeg, bilge keels, shafts, brackets, screws, rudders, thruster tunnel, anodes, sea chests.
 kit.box('paint',[.2,.14,Z(25)-Z(9)],[0,KEEL+.03,(Z(25)+Z(9))/2],ANTIFOULING);
 {const skeg=new THREE.Shape();skeg.moveTo(Z(10.5),KEEL+.05);skeg.lineTo(Z(3.6),KEEL+.02);skeg.lineTo(Z(3.6),keelY(Z(3.6))+.02);skeg.lineTo(Z(8),keelY(Z(8))+.1);skeg.closePath();
  const g=new THREE.ExtrudeGeometry(skeg,{depth:.18,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(.09,0,0);kit.add('paint',g,ANTIFOULING);}
 const SX=1.6,SY=-1.0,SZ=Z(3.2),R=FERRY_HULL.screw/2;
 for(const side of [1,-1]){
  for(let zy=11;zy<23;zy+=1.5){const t=Math.PI/2*.4,[x,y]=sectionPoint(Z(zy),t),[x2,y2]=sectionPoint(Z(zy+1.5),t);kit.bar('paint',[side*(x+.12),y-.1,Z(zy)],[side*(x2+.12),y2-.1,Z(zy+1.5)],.06,ANTIFOULING,4);}
  const sx=side*SX;
  kit.bar('metal',[sx,SY+.18,Z(7.5)],[sx,SY,SZ+.25],.075,STEEL,8);
  kit.cyl('metal',.18,.18,.6,[sx,SY+.14,Z(7.3)],STEEL,[Math.PI/2,0,0]);
  for(const k of [-1,1])kit.bar('paint',[sx,SY,SZ+.7],[sx+k*.7,keelY(SZ+.9)+.25,SZ+.95],.05,ANTIFOULING,5);
  kit.cyl('metal',.13,.13,.4,[sx,SY,SZ+.7],STEEL,[Math.PI/2,0,0]);
  kit.box('paint',[.11,1.25,.95],[sx,SY+.05,Z(1.7)],ANTIFOULING);kit.cyl('metal',.07,.07,.6,[sx,keelY(Z(1.7))-.1,Z(1.6)],STEEL);
  for(const zz of [Z(1.9),Z(1.4)])kit.box('metal',[.14,.09,.18],[sx,SY+.25,zz],ZINC);
  kit.box('metal',[.07,.12,.36],[side*(hullX(-.8,Z(8))+.03),-.8,Z(8)],ZINC);
  kit.box('paint',[.03,.3,.7],[side*(hullX(-1.4,Z(13))+.012),-1.4,Z(13)],DARK);
 }
 const screws=[];
 for(const side of [1,-1]){
  const screw=new THREE.Group();screw.position.set(side*SX,SY,SZ);screw.name='Minato Maru '+(side>0?'port':'starboard')+' screw';
  const bronze=new THREE.MeshStandardMaterial({color:BRONZE,roughness:.32,metalness:.85,side:THREE.DoubleSide});
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,.45,10),bronze);hub.rotation.x=Math.PI/2;screw.add(hub);
  const s=R/.53,blade=new THREE.Shape();blade.moveTo(0,0);blade.quadraticCurveTo(.2*s,.18*s,.12*s,.5*s);blade.quadraticCurveTo(-.05*s,.53*s,-.12*s,.4*s);blade.quadraticCurveTo(-.14*s,.15*s,0,0);
  const bladeGeo=new THREE.ShapeGeometry(blade,6);
  for(let b=0;b<4;b++){const holder=new THREE.Group();holder.rotation.z=b*Math.PI/2;const m=new THREE.Mesh(bladeGeo,bronze);m.rotation.set(0,side*.5,0);m.position.y=.1;holder.add(m);screw.add(holder);}
  // The hub and blades rotate as one: retain their geometry with one draw call per screw.
  screw.updateMatrixWorld(true);const parts=[];screw.traverse(o=>{if(o.isMesh){const g=o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().copy(screw.matrixWorld).invert().multiply(o.matrixWorld));parts.push(g.index?g.toNonIndexed():g);}});
  screw.clear();screw.add(new THREE.Mesh(mergeGeometries(parts,false),bronze));for(const g of parts)g.dispose();hub.geometry.dispose();bladeGeo.dispose();
  screw.userData.hand=side;ferry.add(screw);screws.push(screw);
 }
 // The bow-thruster tunnel, 0.9 m, through the forefoot.
 {const r=.45,y=-.95,z=Z(29),w=hullX(y,z);const tube=new THREE.CylinderGeometry(r,r,2*w,16,1,true);tube.rotateZ(Math.PI/2);kit.add('paint',tube,DARK,[0,y,z]);
  for(const side of [1,-1])for(let k=-1;k<=1;k++)kit.box('metal',[.02,.05,.8],[side*(w-.01),y+k*.22,z],STEEL);}

 // ---- The car deck: lanes and their numbers' bars, lashing sockets, the casings, the walkway.
 const deckFore=Z(30),deckAft=Z(12.6);
 kit.box('paint',[.12,.012,deckFore-deckAft-.05],[0,CAR+.007,(deckFore+deckAft+.05)/2],YELLOW);   // from clear of the lower lobby's wall
 for(const x of [2.7,-2.7])kit.box('paint',[.1,.012,Z(30)-Z(20.2)],[x,CAR+.007,(Z(30)+Z(20.2))/2],WHITE);
 for(const p of FERRY_DECKS.car.slots)kit.box('paint',[1.4,.012,.1],[p[0],CAR+.007,p[1]+2.6],WHITE);   // each place's stop bar, at the nose
 for(let zy=13.8;zy<29.9;zy+=2.3)for(const x of [-2.3,-1.0,1.0,2.3])kit.cyl('metal',.06,.06,.02,[x,CAR+.01,Z(zy)],DARK,[0,0,0],8);
 // The casings, port and starboard, from the car deck up to the passenger deck: plated, white, with their doors.
 const casTop=CAS_TOP,PSG=FERRY_CASINGS.passage;
 for(const side of [1,-1]){
  // The port casing is cut through at the gate: the passage from the gangway door, open aft into the foyer at the foot
  // of stair P, its deckhead 2.2 m up. (The casings' blocks, their stairwells, the foyer and the passage's deckhead are in
  // ferry-interior.js, which the walk reads too.)
  if(side>0){
   kit.block('paint',[2.77,CAR+PSG.height-.004,FERRY_STAIRS.foot],[HB-.05,CAR+PSG.height,PSG.to],DECKHEAD);
   // The shore-power box on the foyer's inboard wall (the gangway door hooks back along the passage's forward wall):
   // the 440 V connection the cable from the pier plugs into.
   kit.block('paint',[2.81,CAR+1.2,Z(12.7)],[2.99,CAR+1.8,Z(13.2)],0x8d9a98);kit.block('metal',[2.99,CAR+1.25,Z(12.82)],[3.05,CAR+1.45,Z(13.08)],DARK);
   // A deckhead light over the passage.
   kit.block('paint',[3.5,CAR+PSG.height-.06,GATE.z-.25],[3.8,CAR+PSG.height-.01,GATE.z+.25],0xf3efe2);}
  // Doors onto the car deck: the engine room's escape (starboard), the store. (The stairs' and the engine room's
  // doors stand open: ferry-interior.js.)
  for(const [zy,w] of side>0?[]:[[6.5,.7],[8.5,.9]])kit.box('paint',[.04,2,w],[side*2.73,CAR+1,Z(zy)],DOOR);
 }
 // The gangway door's frame in the port casing's side, behind the gate in the bulwark (its leaf moves: below).
 kit.box('metal',[.06,.06,GATE.to-GATE.from+.02],[HB,CAR+2.03,GATE.z],STEEL);
 // The aft mooring station: capstan, two pairs of bitts, closed fairleads at the quarters.
 kit.cyl('metal',.26,.3,.5,[0,CAR+.25,Z(1.2)],DARK);kit.cyl('metal',.2,.2,.1,[0,CAR+.55,Z(1.2)],STEEL);
 for(const side of [1,-1]){const x=side*2.9;for(const dz of [-.26,.26])kit.cyl('metal',.13,.13,.5,[x,CAR+.25,Z(1.6)+dz],DARK);
  kit.box('metal',[.5,.28,.14],[side*1.9,bulwarkTop(-HALF)-.35,-HALF+.08],DARK);}
 // The bow houses either side of the ramp: windlass, ramp power pack, paint store; on their tops the
 // forward mooring station: a windlass drum and bitts each side, fairleads at the bow.
 const bhTop=BH_TOP;
 for(const side of [1,-1]){
  kit.block('paint',[side*2.25,CAR,BH0],[side*(halfBreadth(BH1)-.04),bhTop,BH1],WHITE);
  kit.block('paint',[side*2.22,bhTop,BH0],[side*(halfBreadth(BH1)-.02),bhTop+.06,BH1],DECKGREEN);
  kit.box('paint',[.04,1.9,.8],[side*2.23,CAR+.95,Z(31)],DOOR);
  kit.cyl('metal',.26,.26,.5,[side*3.0,bhTop+.35,Z(32.4)],DARK,[0,0,Math.PI/2]);
  for(const dz of [-.25,.25])kit.cyl('metal',.12,.12,.45,[side*3.1,bhTop+.25,Z(33.6)+dz],DARK);
  kit.box('metal',[.5,.26,.14],[side*3.0,bhTop+.2,HALF-.1],DARK);
  // A side chock on the forward corner of each bow house's top, overhanging the deck edge outboard of the rail and
  // between its stanchions: the lead for a line to a quay alongside (the head line and forward spring at Minato,
  // ferry.js FERRY_MOORING.fairleads.fwd), so the rope never bends in the air over the deck edge.
  kit.box('metal',[.18,.2,.3],[side*3.89,bhTop+.16,Z(34.15)],DARK);
  // Rails round the forecastle top, and a ladder up its aft face from the car deck (the gap in the aft rail).
  {const xo=side*(halfBreadth(BH1)-.1),xi=side*2.3,za=BH0+.05,zf=BH1-.05,xl=side*3.4;
   rail([xo,za],[xo,zf],bhTop+.06);rail([xi,za],[xi,zf],bhTop+.06);rail([xi,zf],[xo,zf],bhTop+.06);
   rail([xi,za],[xl-side*.35,za],bhTop+.06);
   for(const k of [-.25,.25])kit.bar('metal',[xl+k,CAR,BH0-.12],[xl+k,bhTop+.95,BH0-.12],.025,STEEL);
   for(let y=CAR+.3;y<bhTop;y+=.3)kit.bar('metal',[xl-.25,y,BH0-.12],[xl+.25,y,BH0-.12],.02,STEEL);}
 }
 // The ramp's rams pivot on the bow houses' inner faces.
 for(const side of [1,-1])kit.box('paint',[.3,.5,.5],[side*2.38,CAR+2.15,Z(32.8)],TEAL);
 // An anchor in its pocket on each bow, the cable up through the hawse to the windlass.
 for(const side of [1,-1]){const z=Z(33),y=.45,ax=side*(hullX(y,z)+.06);
  kit.box('paint',[.06,.8,.75],[ax-side*.04,y,z],DARK);kit.box('metal',[.1,.75,.12],[ax+side*.03,y+.06,z],DARK);
  kit.box('metal',[.14,.14,.42],[ax+side*.04,y-.32,z],DARK);for(const k of [-1,1])kit.add('metal',new THREE.ConeGeometry(.08,.38,4),DARK,[ax+side*.04,y-.2,z+k*.2]);}

 // ---- The car deck's working fittings (FERRY_DECK_FITTINGS, from the creator's photographs of a working road ferry).
 const DF=FERRY_DECK_FITTINGS,HYD_RED=0xc8322a,BRASS=0xc9a24a,WALKRED=0xa8443a,SIGNBLUE=0x1f4f9e,PIPE=0xcfd3d4,SOOT=0x3a3a38;
 // The red walkways outboard of the lanes, a hand's breadth inside the bulwark, followed plate by plate as she narrows.
 for(const side of [1,-1]){const pts=[[DF.walkway.inner,DF.walkway.from],[DF.walkway.inner,DF.walkway.to]];
  for(let z=DF.walkway.to;z>=DF.walkway.from-1e-6;z-=z>FWD?.5:z-DF.walkway.from||1)pts.push([halfBreadth(z)-.12,z]);
  const sh=new THREE.Shape(pts.map(([x,z])=>new THREE.Vector2(side*x,-z)));const g=new THREE.ShapeGeometry(sh);g.rotateX(-Math.PI/2);g.translate(0,CAR+.008,0);kit.add('decal',g,WALKRED);}
 // The hydrants: a red standpipe off the fire main, the valve with its handwheel on top, the brass instantaneous
 // coupling turned inboard with its cap on a chain; the hose box beside each forward one (the aft ones' boxes are
 // the casings', ferry-interior.js).
 const hydrant=(x,z,[dx,dz])=>{
  kit.cyl('paint',.05,.05,.62,[x,CAR+.31,z],HYD_RED,[0,0,0],8);kit.cyl('paint',.09,.09,.18,[x,CAR+.7,z],HYD_RED,[0,0,0],8);
  kit.cyl('metal',.016,.016,.14,[x,CAR+.86,z],STEEL,[0,0,0],6);kit.cyl('paint',.11,.11,.025,[x,CAR+.93,z],HYD_RED,[0,0,0],10);
  const at=d=>[x+dx*d,CAR+.66,z+dz*d];
  kit.bar('paint',at(0),at(.16),.045,HYD_RED,8);kit.bar('metal',at(.16),at(.27),.06,BRASS,8);
  // The cap's chain, hanging from the coupling to the valve body.
  {const p=at(.22);kit.bar('metal',[p[0],p[1]-.05,p[2]],[p[0]-dx*.18,p[1]-.14,p[2]-dz*.18],.006,STEEL,3);}};
 for(const h of DF.hydrants){const z=Z(h.zy),s=h.side;
  // Aft, on the casing's face: the coupling turned aft along the casing, clear of a car's mirror in the lane.
  if(h.on==='casing')hydrant(s*(FERRY_CASINGS.inner-.1),z,[0,-1]);
  else{const x=s*(halfBreadth(z)-.2);hydrant(x,z,[-s,0]);
   kit.block('paint',[s*(halfBreadth(z+.8)-.08),CAR+.75,z+.45],[s*(halfBreadth(z+.8)-.3),CAR+1.45,z+1.1],HYD_RED);}}
 // The vehicle barrier's posts, at the bow houses' corners (the leaves move: below).
 for(const side of [1,-1])kit.block('paint',[side*DF.barrier.pivot,CAR,DF.barrier.z-.06],[side*(DF.barrier.pivot+.12),CAR+1.1,DF.barrier.z+.06],0xf2efe6);
 // The lane-signal posts on the bow houses: a galvanised post, the floodlights at its head, a board each way under
 // three lamp housings (the boards and lamps themselves: below, so the lamps can change).
 const SG=DF.signals;
 for(const side of [1,-1]){const x=side*SG.x,z=SG.z,y0=BH_TOP+.06;
  kit.cyl('metal',.055,.065,SG.height,[x,y0+SG.height/2,z],ZINC,[0,0,0],8);kit.block('metal',[x-.18,y0,z-.18],[x+.18,y0+.03,z+.18],ZINC);
  for(const f of [-1,1]){
   // The floodlight: a flat housing on a yoke, tilted down over the deck (aft) or the ramp and the quay (forward).
   const fl=new THREE.BoxGeometry(.42,.32,.12);kit.add('paint',fl,0x5b6164,[x,y0+SG.height-.02,z+f*.3],[f*.45,0,0]);
   // The lamp housings over the board: three black hoods, one over each lane.
   kit.block('paint',[x-.47,y0+SG.boardY+SG.board[1]+.04,z+f*.09],[x+.47,y0+SG.boardY+SG.board[1]+.32,z+f*.2],0x1b1d1e);
   // The board's body (its face, with the lanes, is drawn below).
   kit.block('paint',[x-SG.board[0]/2,y0+SG.boardY,z+f*.12],[x+SG.board[0]/2,y0+SG.boardY+SG.board[1],z+f*.16],0x2a2f31);}
 }

 // ---- The passenger deck over the car deck (its slab, cut open over the stairs, is in ferry-interior.js), pillars at
 // its open ends.
 const PD0=-HALF,PD1=Z(23);
 kit.box('paint',[BEAM-.02,.07,.06],[0,PASS-.045,PD1+.02],TEAL);   // its top 1 cm under the deck's
 for(const side of [1,-1])for(const z of [Z(.3),Z(22.7)])kit.cyl('paint',.11,.11,casTop-CAR,[side*3.75,(CAR+casTop)/2,z],WHITE);
 // Lights under the deckhead over the lanes.
 for(let zy=5;zy<22;zy+=4)for(const x of [-1.55,1.55])kit.box('paint',[.2,.05,1.2],[x,PASS-.28,Z(zy)],0xf3efe2);
 // Rails round the passenger deck: the stern, the open deck's sides, the walkways and their forward ends.
 const rw=HB-.08;
 rail([rw,PD0+.1],[-rw,PD0+.1]);rail([rw,PD0+.1],[rw,PD1-.05]);rail([-rw,PD0+.1],[-rw,PD1-.05]);
 rail([rw,PD1-.05],[FERRY_HOUSE.half+.02,PD1-.05]);rail([-(FERRY_HOUSE.half+.02),PD1-.05],[-rw,PD1-.05]);

 // ---- The houses, casings, stairs, ladders and everything inside them: ferry-interior.js, drawn here as it is walked.
 const SAL=FERRY_DECKS.saloon,DH0=SAL.aft,DH1=SAL.fore,dw=SAL.width/2,dhTop=BRIDGE-.25;
 const h1Point=p=>p[2]+HALF>=6.35&&p[2]+HALF<=26.06&&p[1]+DRAFT>=.65&&p[1]+DRAFT<=3.62;
 const h1Kit=FERRY_H1_ENABLED?createKit(shadows):null,h1Root=FERRY_H1_ENABLED?new THREE.Group():null;
 const previewStart=FERRY_H1_ENABLED?FERRY_INTERIOR.bars.length-pipePreviewSegments(FERRY_INTERIOR.pipes).length:Infinity;
 for(const b of FERRY_INTERIOR.boxes)if(b.draw!==false){globalThis.__KIT_WHERE__=b.where;(h1Kit&&(h1Point(b.a)||h1Point(b.b))?h1Kit:kit).block(b.cls,b.a,b.b,b.hex);}
 globalThis.__KIT_WHERE__=undefined;
 for(const [index,r]of FERRY_INTERIOR.bars.entries()){
  const h1=h1Kit&&(h1Point(r.a)||h1Point(r.b));if(h1&&index>=previewStart)continue;
  (h1?h1Kit:kit).bar(r.cls,r.a,r.b,r.r,r.hex,r.r>.2?14:6);
 }
 for(const c of FERRY_INTERIOR.cyls){const h1=h1Kit&&h1Point(c.pos);if(h1&&['pipe bend','penetration'].includes(c.name))continue;(h1?h1Kit:kit).cyl(c.cls,c.rt,c.rb,c.h,c.pos,c.hex,c.rot,c.seg);}
 if(h1Root){
  h1Root.name='Engine room H1 / CAD';ferry.add(h1Root);const fallback=new THREE.Group();h1Root.add(fallback);h1Kit.finish(fallback);
  const state={loaded:false,pending:null,error:null,group:h1Root,ensure(){return this.pending??=import('./ferry-engine-room-asset.js').then(m=>m.loadFerryEngineRoomH1(h1Root,fallback,this)).catch(error=>{this.error=String(error?.message||error);return false;});}};
  ferry.userData.engineRoomH1=state;
  // Two nearest CAD fixtures light the room. A constant active count limits phone shader cost.
  state.lights=FERRY_H1.luminaires.map(([X,P])=>{const light=new THREE.PointLight(0xffe4b4,2.2,7,2);light.position.set(P,Y([9.5,12.5,24.4].includes(X)?3.5:3.38),Z(X));light.visible=false;h1Root.add(light);return light;});
  state.illuminate=p=>{let first=null,second=null,d1=Infinity,d2=Infinity;for(const light of state.lights){const d=light.position.distanceToSquared(p);if(d<d1){second=first;d2=d1;first=light;d1=d;}else if(d<d2){second=light;d2=d;}}for(const light of state.lights)light.visible=light===first||light===second;};h1Root.visible=false;
 }
 // Maker's plates and labels (johansson-marine.js): lettering on a plate, drawn as its own small textured plane.
 // The engine room's plates lie wholly below the car deck, where nothing outside the hull sees them: game.js draws
 // them (and first uploads their pictures) only with the camera aboard (updateBelowDeck), not every frame she is in view.
 const belowDeck=new THREE.Group();belowDeck.name='Engine room plates';ferry.add(belowDeck);
 ferry.userData.belowDeck={plates:belowDeck,halfBeam:HB,halfLength:HALF,carDeck:CAR};
 const livePlates=[];for(const pl of FERRY_INTERIOR.plates){if(FERRY_H1_ENABLED&&['chequer','grating'].includes(pl.kind)&&h1Point(pl.pos))continue;const hidden=pl.pos[1]+Math.max(pl.w,pl.h)/2<CAR,m=plateMesh(pl,{deferred:hidden});if(m){(hidden?belowDeck:ferry).add(m);if(m.userData.live)livePlates.push(m.userData.live);}}
 /** Shows the plant's readings (ferry-plant.js readings()) on every live dial and the alarm matrix; returns how many were redrawn. */
 const bridgeEquipment=buildFerryBridge(ferry,kit,{floor:BRIDGE,fore:FERRY_HOUSE.fore,aft:FERRY_HOUSE.wheelhouseAft});
 ferry.userData.bridgeEquipment=bridgeEquipment;
 ferry.userData.readPlant=readings=>{bridgeEquipment.readPlant(readings);ferry.userData.bridgePowered=readings.board.live;ferry.userData.setNavigationSupply?.(readings.board.live||readings.board.emergency);let n=0;for(const l of livePlates)if(l.show(liveValue(readings,l.key)))n++;return n;};
 ferry.userData.livePlates=livePlates;
 for(const g of FERRY_INTERIOR.glass){win(g.size,g.pos,g.rot);
  // Each pane in an anodised frame, 5 cm, standing 1 cm proud of the plating: no window is a hole in a flat wall.
  const [sx,sy,sz]=g.size,alongX=sx>sz,w=alongX?sx:sz,t=.05,d=(alongX?sz:sx)+.02;
  for(const [u,v,uw,vh] of [[-w/2-t/2,0,t,sy+2*t],[w/2+t/2,0,t,sy+2*t],[0,sy/2+t/2,w,t],[0,-sy/2-t/2,w,t]])
   kit.box('metal',alongX?[uw,vh,d]:[d,vh,uw],[g.pos[0]+(alongX?u:0),g.pos[1]+v,g.pos[2]+(alongX?0:u)],0x3a4244,g.rot);}
 // The ship's flag (日の丸) on the stern staff, flying aft.
 kit.box('paint',[.02,.42,.64],[0,PASS+3.0,-HALF+.42],0xf6f3ea);kit.cyl('paint',.13,.13,.03,[0,PASS+3.0,-HALF+.42],0xc8302a,[0,0,Math.PI/2],20);
 // The bulwark's stiffeners inside the car deck, a flat bar every 1.25 m, as a plated bulwark has.
 for(const side of [1,-1])for(let z=-HALF+.6;z<HALF-1.2;z+=1.25){if(side>0&&z>GATE.from-.3&&z<GATE.to+.3)continue;const x=side*(halfBreadth(z)-.1);kit.box('paint',[.06,bulwarkTop(z)-CAR-.08,.12],[x,(CAR+bulwarkTop(z))/2-.02,z],BULWARK_IN);}
 // The teal band under the deckhouse's forward eave.
 kit.block('paint',[-(dw+.06),dhTop-.1,DH1+.04],[dw+.06,dhTop+.02,DH1+.08],TEAL);

 // ---- The open deck aft: benches under an awning, the funnels at its forward corners, the liferaft (port) and
 // the rescue boat under its davit (starboard), the flagstaff; forward of the benches a platform and two ladders
 // up to the bridge deck's aft end, where the emergency-generator and CO₂ rooms open.
 // Two benches a side, 2.1 m, with a 1.1 m aisle between them down the middle (a person needs 0.56 m).
 for(const zy of [1,2.6])for(const x of [-1.6,1.6]){
  kit.box('paint',[2.1,.06,.45],[x,PASS+.45,Z(zy)],TEAK);kit.box('paint',[2.1,.4,.06],[x,PASS+.68,Z(zy)-.21],TEAK);
  for(const dx of [-.9,.9])kit.box('metal',[.06,.42,.42],[x+dx,PASS+.21,Z(zy)],STEEL);}
 kit.box('paint',[.45,.06,1.2],[3.45,PASS+.45,Z(2.7)],TEAK);for(const dz of [-.5,.5])kit.box('metal',[.4,.42,.06],[3.45,PASS+.21,Z(2.7)+dz],STEEL);
 {const a0=Z(.4),a1=Z(3.4),ay=PASS+2.35;for(const x of [-2.35,2.35])for(const z of [a0,a1])kit.bar('metal',[x,PASS,z],[x,ay,z],.035,STEEL,6);
  kit.block('paint',[-2.5,ay,a0-.1],[2.5,ay+.04,a1+.1],CANVAS);kit.box('paint',[5,.18,.02],[0,ay-.08,a0-.11],TEAL);}
 const FZ=Z(4.9),FY0=PASS,FY1=Y(H.funnelTop);
 for(const side of [1,-1]){
  const f=new THREE.CylinderGeometry(.44,.5,FY1-FY0,16);f.scale(1,1,2);kit.add('paint',f,TEAL,[side*3.35,(FY0+FY1)/2,FZ]);
  const cap=new THREE.CylinderGeometry(.46,.46,.25,16);cap.scale(1,1,2);kit.add('paint',cap,DARK,[side*3.35,FY1-.12,FZ]);
  // Two exhausts a funnel (its main engine's and its generator's, ferry-piping.js 8.10): stainless pipes standing
  // a metre clear of the cap, sooted at the lip, as the creator's photographs show them.
  for(const dz of [-.35,.35]){kit.cyl('metal',.1,.1,1.15,[side*3.35,FY1+.42,FZ+dz],0xcfd3d4,[0,0,0],8);kit.cyl('metal',.104,.104,.14,[side*3.35,FY1+.93,FZ+dz],0x3a3a38,[0,0,0],8);}
 }
 kit.cyl('paint',.3,.3,1.1,[3.55,PASS+.55,Z(1.1)],WHITE,[Math.PI/2,0,0]);kit.box('metal',[.5,.25,1.04],[3.55,PASS+.15,Z(1.1)],STEEL);   // the cradle 3 cm short of the canister's ends
 {const boat=new THREE.SphereGeometry(1,12,8);boat.scale(.6,.35,1.8);kit.add('paint',boat,ORANGE,[-3.17,PASS+.72,Z(2.4)]);
  kit.box('paint',[.95,.08,2.9],[-3.17,PASS+1.0,Z(2.4)],0xf2efe6);for(const dz of [-1.1,1.1])kit.box('metal',[.85,.42,.15],[-3.17,PASS+.21,Z(2.4)+dz],STEEL);
  kit.bar('metal',[-3.9,PASS,Z(.45)],[-3.9,PASS+3.2,Z(.45)],.08,STEEL,8);kit.bar('metal',[-3.9,PASS+3.2,Z(.45)],[-3.3,PASS+3.35,Z(1.5)],.06,STEEL,8);}
 kit.bar('paint',[0,PASS,-HALF+.15],[0,PASS+3.4,-HALF+.05],.03,WHITE);
 for(const x of [1.3,-1.3])kit.add('paint',new THREE.TorusGeometry(.32,.07,8,18),ORANGE,[x,PASS+.78,-HALF+.04]);
 for(const side of [1,-1])kit.add('paint',new THREE.TorusGeometry(.32,.07,8,18),ORANGE,[side*(rw+.04),PASS+.8,Z(9.5)],[0,Math.PI/2,0]);
 const PF0=DH0-1.2;
 kit.block('paint',[-2.6,BRIDGE-.12,PF0],[2.6,BRIDGE,DH0],WHITE);kit.block('paint',[-2.55,BRIDGE+.001,PF0+.05],[2.55,BRIDGE+.006,DH0],DECKGREEN);
 for(const x of [-2.5,2.5])kit.cyl('paint',.07,.07,BRIDGE-PASS,[x,(PASS+BRIDGE)/2,PF0+.1],WHITE);
 for(const side of [1,-1]){const x=side*1.15,z0=PF0-1.5,z1=PF0+.02;
  for(const k of [-.28,.28])kit.bar('metal',[x+k,PASS,z0],[x+k,BRIDGE,z1],.03,STEEL);
  for(let s2=1;s2<10;s2++){const f=s2/10;kit.box('metal',[.56,.03,.16],[x,PASS+(BRIDGE-PASS)*f,z0+(z1-z0)*f],STEEL);}
  for(const k of [-.28,.28])kit.bar('paint',[x+k,PASS+.9,z0],[x+k,BRIDGE+.9,z1],.02,YELLOW);}
 rail([2.55,PF0+.05],[1.5,PF0+.05],BRIDGE);rail([-1.5,PF0+.05],[-2.55,PF0+.05],BRIDGE);rail([.8,PF0+.05],[-.8,PF0+.05],BRIDGE);
 rail([2.55,PF0+.05],[2.55,DH0],BRIDGE);rail([-2.55,PF0+.05],[-2.55,DH0],BRIDGE);

 // ---- The bridge deck: the house (crew's rooms, the corridor, the wheelhouse forward), its ledges and wings.
 const BH=3,WH=FERRY_DECKS.wheelhouse,hTop=COMPASS-.2;
 kit.block('paint',[-(BH+.08),hTop,DH0-.05],[BH+.08,COMPASS,DH1+.12],WHITE);
 kit.block('paint',[-(BH+.1),hTop-.12,DH1+.08],[BH+.1,hTop+.02,DH1+.16],TEAL);                    // the visor over the windows
 // The wings' floor out to her sides, and its deck paint: both cut round the crew stair's well (ferry-interior.js
 // FERRY_CREW_STAIR; they closed it over, and the flight ran up into them).
 {const C=FERRY_CREW_STAIR,cut=(y0,y1,x,z0,z1,col)=>{for(const [a,b] of [[[-x,y0,z0],[C.x[0],y1,z1]],[[C.x[1],y0,z0],[x,y1,z1]],[[C.x[0],y0,C.well[1]],[C.x[1],y1,z1]]])kit.block('paint',a,b,col);};
  cut(BRIDGE-.12,BRIDGE,HB-.06,WH.aft,DH1,WHITE);cut(BRIDGE+.001,BRIDGE+.006,HB-.1,WH.aft+.05,DH1-.05,DECKGREEN);}
 // The ledges' deck paint, outside the house (inside, the rooms' floors: ferry-interior.js).
 {const LW=FERRY_HOUSE.lobbyHalf,LB1=FERRY_HOUSE.lobbyFore,BH2=FERRY_HOUSE.bridgeHalf;
  for(const s of [1,-1]){kit.block('paint',[Math.min(s*BH2,s*(LW+.04)),BRIDGE+.001,DH0],[Math.max(s*BH2,s*(LW+.04)),BRIDGE+.005,LB1],DECKGREEN);
   kit.block('paint',[Math.min(s*BH2,s*(dw+.04)),BRIDGE+.001,LB1],[Math.max(s*BH2,s*(dw+.04)),BRIDGE+.005,WH.aft],DECKGREEN);}}
 for(const side of [1,-1]){
  // (The house's windows, the wheelhouse and its wing doors: ferry-interior.js.)
  // The wing: a solid dodger at her side, its console where the master berths her.
  kit.block('paint',[side*(HB-.1),BRIDGE,WH.aft],[side*(HB-.04),BRIDGE+1.1,DH1],WHITE);
  kit.block('paint',[side*(BH+.05),BRIDGE+1.05,DH1-.04],[side*(HB-.04),BRIDGE+1.1,DH1],WHITE);
  kit.box('metal',[.14,1,.14],[side*(HB-.45),BRIDGE+.5,DH1-.5],STEEL);kit.box('metal',[.34,.2,.3],[side*(HB-.45),BRIDGE+1.08,DH1-.5],DARK);
  // Rails on the bridge deck's ledges beside the house.
  // Over the lobby (full breadth) they run at her sides, and step in where the house narrows.
  {const lw=FERRY_HOUSE.lobbyHalf-.02,LB1=FERRY_HOUSE.lobbyFore;
   rail([side*lw,DH0+.05],[side*lw,LB1],BRIDGE);rail([side*lw,LB1],[side*(dw-.02),LB1],BRIDGE);rail([side*(dw-.02),LB1],[side*(dw-.02),WH.aft-.05],BRIDGE);}
 }
 // (The EG room's and the CO₂ room's doors, open: ferry-interior.js.)
 // ---- The compass deck on the wheelhouse top: rails, the standard compass, the mast and what it carries.
 rail([BH-.05,WH.aft],[BH-.05,DH1],COMPASS);rail([-(BH-.05),WH.aft],[-(BH-.05),DH1],COMPASS);rail([BH-.05,DH1],[-(BH-.05),DH1],COMPASS);
 kit.cyl('paint',.22,.28,1.0,[0,COMPASS+.5,Z(22.2)],WHITE);kit.add('paint',new THREE.SphereGeometry(.22,10,6,0,Math.PI*2,0,Math.PI/2),0x9fb3b6,[0,COMPASS+1,Z(22.2)]);
 const mastZ=Z(20.8),mastTop=Y(H.mastTop),masthead=Y(H.mastheadLight);
 kit.bar('paint',[0,COMPASS,mastZ],[0,mastTop,mastZ],.09,WHITE,8);
 kit.box('paint',[1.3,.07,1.0],[0,COMPASS+2.1,mastZ],WHITE);for(const k of [-.6,.6])kit.bar('paint',[k,COMPASS+2.1,mastZ-.45],[k,COMPASS+2.8,mastZ-.45],.02,WHITE,4);
 kit.bar('paint',[-1.4,masthead-.6,mastZ],[1.4,masthead-.6,mastZ],.035,WHITE,5);
 kit.cyl('metal',.06,.13,.4,[.3,COMPASS+3.1,mastZ+.15],STEEL,[Math.PI/2.4,0,0]);                     // the whistle
 for(const x of [-1.2,1.2])kit.bar('paint',[x,COMPASS+.05,mastZ-1.2],[x,COMPASS+3.2,mastZ-1.2],.014,WHITE,4);   // VHF whips
 kit.cyl('paint',.13,.13,.14,[.8,COMPASS+.17,mastZ-.9],WHITE);kit.add('paint',new THREE.SphereGeometry(.13,10,6,0,Math.PI*2,0,Math.PI/2),WHITE,[.8,COMPASS+.24,mastZ-.9]); // GPS
 kit.cyl('metal',.16,.2,.28,[-1.6,COMPASS+.3,Z(22)],STEEL);kit.cyl('metal',.14,.14,.2,[-1.6,COMPASS+.52,Z(22)],0xdedad0,[Math.PI/2,0,0]); // searchlight
 const radar=new THREE.Group();radar.name='Radar scanner';radar.position.set(0,COMPASS+2.32,mastZ);
 {const m=new THREE.Mesh(new THREE.BoxGeometry(1.8,.14,.18),new THREE.MeshStandardMaterial({color:0xeeeae0,roughness:.5}));radar.add(m);const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.18,8),new THREE.MeshStandardMaterial({color:DARK,roughness:.6}));p.position.y=-.15;radar.add(p);}
 ferry.add(radar);
 // ---- The glass: one mesh, lit from inside at night.
 // See-through, so the saloon's windows look out over the bow and the harbour shows in the wheelhouse's.
 const glassMat=new THREE.MeshStandardMaterial({color:0x2d4a55,roughness:.15,metalness:.2,emissive:0xf0d8a0,emissiveIntensity:0,transparent:true,opacity:.38,depthWrite:false});
 {const parts=glass.map(([size,pos,rot=[0,0,0]])=>{const g=new THREE.BoxGeometry(...size).toNonIndexed();g.deleteAttribute('uv');g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(1,1,1)));return g;});
  const mesh=new THREE.Mesh(mergeGeometries(parts,false),glassMat);mesh.name='Minato Maru windows';ferry.add(mesh);}
 // ---- Navigation lights (COLREG): masthead white at 15 m above the keel, sidelights at the wings' ends (red to
 // port, green to starboard), the stern light on the stern rail.
 const lamp=(colour,pos,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.13,.16,.13),new THREE.MeshBasicMaterial({color:0x333333}));m.position.set(...pos);m.name=name;m.userData.on=colour;ferry.add(m);return m;};
 const navLights=[lamp(0xfff6d8,[0,masthead,mastZ+.12],'Masthead light'),lamp(0xff3a2a,[HB-.02,BRIDGE+1.3,DH1-.25],'Port sidelight'),bridgeEquipment.navigationFeeder.lamp,lamp(0xfff6d8,[0,PASS+1.2,-HALF+.08],'Stern light')];
 // Port retains its original sector screen; the native starboard housing owns
 // its screens, so no second black board intersects that replacement.
 kit.box('paint',[.03,.3,.7],[(HB-.12),BRIDGE+1.3,DH1-.55],0x111111);
 // ---- Painted words and marks.
 const marks=markings();
 if(marks){
  const mat=new THREE.MeshBasicMaterial({map:marks.tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const decal=(cell,w,h,pos,rotY)=>{const g=new THREE.PlaneGeometry(w,h);const uv=g.getAttribute('uv'),[u0,v0,uw2,vh]=marks.cell(...cell);for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*uw2,v0+uv.getY(i)*vh);g.rotateY(rotY);g.translate(...pos);return g;};
  const pieces=[];
  for(const side of [1,-1]){
   const rot=side>0?Math.PI/2:-Math.PI/2;
   pieces.push(decal([0,0,2,1],3.6,.9,[side*(hullX(.55,Z(27))+.015),.55,Z(27)],rot));
   for(const z of [Z(31.5),Z(2.8)]){const x=Math.max(hullX(-.75,z),hullX(.55,z))+.015;pieces.push(decal([0,2,1,2],.34,1.35,[side*x,-.1,z],rot));}
   pieces.push(decal([1,2,1,2],.62,.62,[side*(hullX(.42,0)+.014),.42,0],rot));
   pieces.push(decal([2,2,1,2],.45,.45,[side*(hullX(.2,Z(29))+.014),.2,Z(29)],rot));
   pieces.push(decal([3,2,1,1],.8,.4,[side*(dw+.03),PASS+2.2,DH0+1.9],rot));
   // The wheelhouse's wing doors: 操舵室 over each.
   pieces.push(decal([3,1+88/128,1,34/128],.9,.28,[side*(3+.045),BRIDGE+2.1,Z(20.0)],rot));
   pieces.push(decal([1,1,2,1],1.6,.4,[side*(3+.09),BRIDGE+2.25,DH0+3.2],rot));                      // her name board on each side of the bridge house
   pieces.push(decal([0,1,1,1],.7,.7,[side*3.35+side*.46,Y(H.funnelTop)-1.3,FZ],rot));             // the anchor on each funnel
  }
  pieces.push(decal([2,0,2,1],2.6,.75,[0,.55,-HALF-.013],Math.PI));
  pieces.push(decal([1,1,2,1],2.0,.5,[0,BRIDGE+2.3,DH1+.17],0));                                    // and over the wheelhouse windows
  // 機関室 ENGINE ROOM over the casing door on the car deck (the way down), 乗組員専用 CREW ONLY over the crew's door aft.
  pieces.push(decal([3,1,1,.3],1.0,.3,[2.75-.035,CAR+2.3,Z(6.85)],-Math.PI/2));
  pieces.push(decal([3,1.3,1,.3],.9,.28,[0,BRIDGE+2.12,DH0-.015],Math.PI));
  pieces.push(decal([3,3,1,1],.8,.4,[2.2,PASS+2.0,DH0-.03],Math.PI));
  const mesh=new THREE.Mesh(mergeGeometries(pieces,false),mat);mesh.name='Minato Maru markings';mesh.renderOrder=2;ferry.add(mesh);
 }
 kit.finish(ferry);

 // ---- The vehicle barrier: two leaves, each a red-and-white framed gate of white pickets, hinged at its foot on the
 // post; shut across the lanes, it lifts outboard about the post to stand upright on the walkway.
 const BAR=FERRY_DECK_FITTINGS.barrier,barrierLeaves=[];
 for(const side of [1,-1]){
  const leaf=new THREE.Group();leaf.name='Vehicle barrier '+(side>0?'port':'starboard');leaf.position.set(side*BAR.pivot,CAR+BAR.foot,BAR.z);ferry.add(leaf);
  const k=createKit(shadows),L=BAR.leaf,Hh=BAR.height,n=Math.round(L/.3);
  for(let i=0;i<n;i++){const a=-side*i*L/n,b=-side*(i+1)*L/n,hex=i%2?0xf2efe6:0xc8322a;
   k.block('paint',[a,Hh-.07,-.03],[b,Hh,.03],hex);k.block('paint',[a,0,-.03],[b,.07,.03],hex);}
  for(const x of [0,-side*L])k.block('paint',[x-.035,0,-.03],[x+.035,Hh,.03],0xc8322a);
  for(let x=.3;x<L-.1;x+=.3)k.block('paint',[-side*x-.02,.07,-.02],[-side*x+.02,Hh-.07,.02],0xf2efe6);
  k.finish(leaf);barrierLeaves.push({leaf,side});
 }
 /** 0 shut across the lanes, 1 lifted upright on the walkway. */
 const setBarrier=open=>{for(const {leaf,side} of barrierLeaves)leaf.rotation.z=-side*Math.PI/2*open;};
 // ---- The lane signals: the boards (lane 2, the truck's centre lane, lane 1, arrows ahead), the lamps over them
 // (red, or green when the ramp is down), and the floodlights' lenses, lit after dark.
 const signalLamps=[],floodLenses=[];
 const laneBoards=()=>{
  if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=512;c.height=736;
  paintLaneBoards(c.getContext('2d'));   // both faces, laid out in ferry-boards.js
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
 // One mesh for the twelve lamps (they always show the same aspect), one for the four lenses, one for the boards each way.
 const lampGeos=[],lensGeos=[];
 for(const side of [1,-1])for(const f of [-1,1]){
  const x=side*SG.x,y0=BH_TOP+.06;
  // Aft, the board faces the deck (drivers going forward and off); forward it faces the quay (drivers coming aboard).
  for(const k of [-1,0,1]){const g=new THREE.CircleGeometry(.09,8);if(f<0)g.rotateY(Math.PI);g.translate(x+k*.32,y0+SG.boardY+SG.board[1]+.17,SG.z+f*.212);lampGeos.push(g);}   // 12 mm proud of the hood
  const l=new THREE.PlaneGeometry(.36,.24);l.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.45,f>0?0:Math.PI,0,'YXZ')));
  l.translate(x,y0+SG.height-.02-.029,SG.z+f*(.3+.059));lensGeos.push(l);
 }
 const signalLamp=new THREE.Mesh(mergeGeometries(lampGeos,false),new THREE.MeshBasicMaterial({color:0x5a1410}));signalLamp.name='Lane signal lamps';ferry.add(signalLamp);signalLamps.push(signalLamp);
 const flood=new THREE.Mesh(mergeGeometries(lensGeos,false),new THREE.MeshStandardMaterial({color:0xd9dcd6,emissive:0xfff2d0,emissiveIntensity:0,roughness:.3}));flood.name='Ramp floodlights';ferry.add(flood);floodLenses.push(flood);
 {const faces=[];for(const side of [1,-1])for(const f of [-1,1]){const g=new THREE.PlaneGeometry(SG.board[0],SG.board[1]),uv=g.getAttribute('uv');
   for(let i=0;i<uv.count;i++)uv.setY(i,f>0?uv.getY(i)/2:.5+uv.getY(i)/2);if(f<0)g.rotateY(Math.PI);
   g.translate(side*SG.x,BH_TOP+.06+SG.boardY+SG.board[1]/2,SG.z+f*.168);faces.push(g);}   // 8 mm proud of the board's body
  const tex=laneBoards(),board=new THREE.Mesh(mergeGeometries(faces,false),new THREE.MeshStandardMaterial({color:tex?0xffffff:0x1f4f9e,map:tex,roughness:.5}));
  board.name='Lane signal boards';ferry.add(board);}
 /** Green when the ramp is down on its landing; red at sea and while it moves. */
 const setSignals=go=>{for(const l of signalLamps)l.material.color.setHex(go?0x38e070:0xff3424);};
 // ---- The deck's signs (FERRY_DECK_SIGNS).
 for(const pl of FERRY_DECK_SIGNS){const m=plateMesh(pl);if(m)ferry.add(m);}

 // ---- The bow ramp on its hinge at the stem: the 4 m leaf and the 2 m flap, and the two rams.
 const RAMP=FERRY_RAMP,ramp=new THREE.Group();ramp.name='Ferry bow ramp';ramp.position.set(0,CAR-.01,HALF-.05);ferry.add(ramp);
 const flap=new THREE.Group();flap.name='Ferry ramp flap';flap.position.set(0,0,RAMP.leaf);ramp.add(flap);
 {const k2=createKit(shadows);
  // A side profile (along the leaf, up), extruded athwartships across [x0, x1] of the leaf.
  const across=(pts,x0,x1)=>{const g=new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([z,y])=>new THREE.Vector2(z,y))),{depth:x1-x0,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(x1,0,0);return g;};
  // The deck plate, 4.4 m clear between the girders; its underside eases up to the flap's thickness over the last
  // 0.3 m, so the toe rests on its edge on the landing instead of digging into it.
  const L=RAMP.leaf,toe=[[L,-.05],[L-.3,-.07]];
  k2.add('paint',across([[0,.07],[L,.07],...toe,[0,-.07]],-RAMP.clear/2,RAMP.clear/2),DECKGREEN);
  for(let i=0;i<11;i++)k2.box('metal',[RAMP.clear-.1,.04,.05],[0,.08,.25+i*.35],STEEL);
  // The side girders, 0.5 m deep where they carry the leaf from the hinge and tapered over its last 2 m to the plate's
  // own depth at the toe, as ramp girders are built: laid on a landing, no part of the leaf is below it (3 November 2026,
  // docs/minato-maru/exterior problem 4: square girders ended 0.28 m inside the Kitano-jima pier).
  for(const side of [1,-1]){const x=side*RAMP.width/2,xi=side*RAMP.clear/2;
   k2.add('paint',across([[0,.09],[L,.09],...toe,[L-2,-.41],[0,-.41]],Math.min(x,xi),Math.max(x,xi)),TEAL);}
  k2.cyl('metal',.1,.1,RAMP.width+.04,[0,0,0],STEEL,[0,0,Math.PI/2]);k2.finish(ramp);}   // the pin's ends 2 cm proud of the girders
 {const k3=createKit(shadows),FW=RAMP.flapWidth;k3.box('paint',[FW,.1,RAMP.flap],[0,0,RAMP.flap/2],DECKGREEN);
  for(let i=0;i<5;i++)k3.box('metal',[FW-.2,.04,.05],[0,.06,.2+i*.38],STEEL);
  k3.box('paint',[FW-.01,.12,.14],[0,.02,RAMP.flap-.05],YELLOW);
  // The flap's hinge pin, flush with its underside, so the flap lies on the landing without the pin sinking into it.
  k3.cyl('metal',.05,.05,FW+.04,[0,0,0],STEEL,[0,0,Math.PI/2]);k3.finish(flap);}
 const rams=[];
 const ramMat=new THREE.MeshStandardMaterial({color:0x58646a,roughness:.4,metalness:.6}),rodMat=new THREE.MeshStandardMaterial({color:0xd8dcdc,roughness:.18,metalness:.9});
 for(const side of [1,-1]){
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,1,10),ramMat),rod=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,8),rodMat);
  barrel.name=rod.name='Ramp ram';ferry.add(barrel,rod);rams.push({side,barrel,rod,pivot:new THREE.Vector3(side*2.38,CAR+2.15,Z(32.8)),pin:new THREE.Vector3(side*(RAMP.width/2-.1),.12,1.6)});
 }
 const up=new THREE.Vector3(0,1,0),tmp=new THREE.Vector3(),q=new THREE.Quaternion();
 const placeRams=()=>{ramp.updateMatrix();for(const r of rams){const pin=r.pin.clone().applyMatrix4(ramp.matrix),dir=tmp.copy(pin).sub(r.pivot),len=dir.length();dir.normalize();q.setFromUnitVectors(up,dir);
  const bl=Math.min(1.5,len*.6);r.barrel.scale.set(1,bl,1);r.barrel.quaternion.copy(q);r.barrel.position.copy(r.pivot).addScaledVector(dir,bl/2);
  const rl=len-bl*.55;r.rod.scale.set(1,rl,1);r.rod.quaternion.copy(q);r.rod.position.copy(pin).addScaledVector(dir,-rl/2);}};
 ferry.userData.ramp=ramp;ferry.userData.flap=flap;
 const rampControl=new THREE.Group();rampControl.name='Bow ramp local hydraulic control';rampControl.position.set(3.22,CAR,11.35);ferry.add(rampControl);
 {const controls=createKit(shadows);controls.box('paint',[.18,.85,.20],[0,.425,0],0x58646a);controls.box('paint',[.40,.32,.36],[0,.99,0],0x5b7776);
  for(const [z,hex] of [[-.095,0x4d9567],[.095,0xa53f36]])controls.add('paint',new THREE.SphereGeometry(.035,8,6),hex,[-.205,1.04,z]);controls.finish(rampControl);}
 ferry.userData.rampControl=rampControl;
 const lockingPins=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.055,.42,8),rodMat,2);lockingPins.name='Port and starboard ramp locking pins';ferry.add(lockingPins);
 const pinMatrix=new THREE.Matrix4(),pinRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2),pinScale=new THREE.Vector3(1,1,1);
 ferry.userData.setRampLocked=locked=>{if(ferry.userData.rampLocked===!!locked)return;ferry.userData.rampLocked=!!locked;
  [1,-1].forEach((side,i)=>{pinMatrix.compose(new THREE.Vector3(side*(locked?2.16:2.48),CAR+2.2,HALF+.06),pinRotation,pinScale);lockingPins.setMatrixAt(i,pinMatrix);});lockingPins.instanceMatrix.needsUpdate=true;lockingPins.computeBoundingSphere();};
 ferry.userData.setRampLocked(false);
 /** 0 raised (the leaf closes the bow, the flap folded back against it), 1 down at `slope` (radians below level), the flap in line. */
 ferry.userData.setRamp=(down,slope=.13)=>{ramp.rotation.x=-1.52*(1-down)+slope*down;flap.rotation.x=(1-down)*3.0;placeRams();setBarrier(down>=1?1:0);setSignals(down>=1);};
 /**
  * Down on its landing: the leaf's end rests on the landing (`landingY`, world) and the flap lies flat
  * on it, worked out from where the hinge is now, so the ramp stays on the quay as she heaves, rolls
  * and pitches.
  */
 ferry.userData.restRamp=landingY=>{
  ferry.updateMatrixWorld(true);const e=ferry.matrixWorld.elements,Lf=RAMP.leaf,hy=ramp.position.y,hz=ramp.position.z;
  const K=landingY+.05-(e[5]*hy+e[9]*hz+e[13]),Rr=Math.hypot(e[5],e[9]);
  const a=Math.acos(Math.max(-1,Math.min(1,K/(Lf*Rr))))-Math.atan2(e[5],e[9]);
  ramp.rotation.x=a;flap.rotation.x=Math.atan2(e[9],e[5])-a;placeRams();
  // Down on the landing: the barrier lifts and the lanes go green.
  setBarrier(1);setSignals(true);
 };
 ferry.userData.setRamp(0);
 ferry.userData.deckY=CAR;
 ferry.userData.passengerDeck=FERRY_DECKS.passenger;
 // ---- The gangway, run out from the port casing's door to the pier while she is boarding.
 const gangway=new THREE.Group();gangway.name='Ferry gangway';gangway.visible=false;ferry.add(gangway);
 {const k4=createKit(shadows),G=GANGWAY_LENGTH;k4.box('paint',[G,.06,1.4],[G/2,0,0],0x9aa3a2);for(let i=0;i<(FERRY_H1_ENABLED?16:8);i++)k4.box('metal',[.04,.03,1.36],[.15+i*.25,.045,0],STEEL);
  for(const dz of [-.68,.68]){k4.box('metal',[G,.04,.04],[G/2,.9,dz],WHITE);for(const x of [.1,G/2,G-.1])k4.box('metal',[.03,.9,.03],[x,.45,dz],WHITE);}k4.finish(gangway);}
 gangway.position.set(halfBreadth(GANGWAY_Z)-.05,CAR,GANGWAY_Z);gangway.rotation.z=-.2;
 ferry.userData.gangway=gangway;
 ferry.userData.setGangway=out=>{const n=Math.max(0,Math.min(1,Number(out)||0));ferry.userData.gangwayOut=n;gangway.rotation.z=-.2*n+(Math.PI/2)*(1-n);};
 /** Its foot rests on the pier (`pierY`, world) as she moves, the way the ramp rests on the quay. */
 ferry.userData.restGangway=(pierY,length=GANGWAY_LENGTH)=>{
  ferry.updateMatrixWorld(true);const e=ferry.matrixWorld.elements,g=gangway.position;
  if(FERRY_H1_ENABLED){const head=e[1]*g.x+e[5]*g.y+e[9]*g.z+e[13],A=length*e[1]+.03*e[5],B=length*e[5]-.03*e[1];gangway.rotation.z=Math.atan2(B,A)-Math.acos(Math.max(-1,Math.min(1,(pierY-head)/Math.hypot(A,B))));return;}
  const K=pierY+.03-(e[1]*g.x+e[5]*g.y+e[9]*g.z+e[13]),Rg=Math.hypot(e[1],e[5]);
  gangway.rotation.z=Math.atan2(e[5],e[1])-Math.acos(Math.max(-1,Math.min(1,K/(length*Rg))));
 };
 // The gate leaf, hinged on its forward post: shut across the opening at sea; alongside it swings out and lies hooked back
 // flat against the bulwark's outside, forward of the gate (a 1.34 m leaf would not fit inside the passage).
 const gate=new THREE.Group();gate.name='Gangway gate';gate.position.set(halfBreadth(GATE.to)-.1,CAR,GATE.to-.025);ferry.add(gate);
 {const k5=createKit(shadows);k5.box('paint',[.04,BULWARK-.06,GATE.to-GATE.from-.06],[0,BULWARK/2,-(GATE.to-GATE.from)/2],WHITE);k5.box('paint',[.05,.06,GATE.to-GATE.from-.07],[0,BULWARK-.05,-(GATE.to-GATE.from)/2],TEAL);k5.finish(gate);}
 ferry.userData.gate=gate;
 // The gangway door, hinged at its forward jamb: shut flush with her side at sea; alongside it is hooked back against the
 // passage's forward wall (its aft side is open into the foyer), so the way from the gangway to the stair is clear.
 const door=new THREE.Group();door.name='Gangway door';door.position.set(HB-.04,CAR,GATE.to-.03);ferry.add(door);
 {const k6=createKit(shadows);k6.box('paint',[.04,1.96,1.3],[0,.99,-.66],DOOR);k6.box('metal',[.05,.04,.14],[-.03,1.02,-1.2],STEEL);k6.finish(door);}
 ferry.userData.gangwayDoor=door;
 ferry.userData.setGate=open=>{const n=Math.max(0,Math.min(1,Number(open)||0));gate.rotation.y=n*Math.PI;gate.position.x=halfBreadth(GATE.to)-.1+n*.14;door.rotation.y=n*Math.PI/2;};
 ferry.userData.setGate(false);
 // ---- Moving parts: screws turn and the radar sweeps while she is under way.
 ferry.userData.screws=screws;ferry.userData.radar=radar;
 ferry.userData.underway=(dt,speed,readings)=>{
  for(const s of screws){
   const id=s.userData.hand>0?'mainP':'mainS',order=readings?.telegraph?.[id]||'STOP',engine=readings?.engines?.[id];
   // The reverse gear disengages at STOP; the engine can idle without driving its screw.
   const rpm=readings?(engine?.state==='running'&&order!=='STOP'?(engine.rpm*FERRY_MACHINERY.mains.rpm/FERRY_MACHINERY.gears.ratio)*(order.includes('ASTERN')?-1:1):0):speed*18*60/(2*Math.PI);
   s.rotation.z+=s.userData.hand*dt*rpm*2*Math.PI/60;
  }
  const powered=readings?.board?.live??speed>0;radar.rotation.y+=dt*(powered?2.6:0);bridgeEquipment.update(dt,{yaw:ferry.rotation.y,rain:ferry.userData.bridgeRain||false,powered});
 };
 let navigationCommand=false,navigationSupply=true;
 const applyNavigationLights=()=>{const on=navigationCommand&&navigationSupply;bridgeEquipment.navigationFeeder.setLights(on,navigationCommand);for(const l of navLights)if(l!==bridgeEquipment.navigationFeeder.lamp)l.material.color.setHex(on?l.userData.on:0x333333);};
 ferry.userData.setNavigationSupply=on=>{navigationSupply=!!on;applyNavigationLights();};
 ferry.userData.setNavigationLights=on=>{navigationCommand=!!on;applyNavigationLights();};
 ferry.userData.setCabinLights=level=>{glassMat.emissiveIntensity=.55*Math.max(0,Math.min(1,level));};
 /** The ramp floodlights (FERRY_LOADS `floodlights`), lit with the deck lights after dark. */
 ferry.userData.setFloodlights=on=>{for(const l of floodLenses)l.material.emissiveIntensity=on?1.2:0;};
 ferry.userData.lights=on=>{ferry.userData.setCabinLights(on?1:0);ferry.userData.setNavigationLights(on);ferry.userData.setFloodlights(on);};
 ferry.userData.setBarrier=setBarrier;ferry.userData.setSignals=setSignals;
 ferry.userData.model='Minato Maru';
 return ferry;
}
