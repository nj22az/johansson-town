import * as THREE from '../../vendor/three.module.js';
import {paint} from './okinawa/kit.js';
import {AIRPORT_ISLAND,AIRPORT_JETTY} from './airport-island.js';
import {airportWorld,airportSurface} from './airport-ground.js';
import {AIRPORT_FERRY} from './airport-ferry.js';
import {OUTER_PIER} from './layout.js';
import {MINATO_BERTH} from './minato-berth.js';
import {FERRY_BERTH} from './ferry.js';

/**
 * The quick crossing (the creator, 2026-10-13: "Include a quick travel point at the docks to travel to the island and
 * back"; "quick crossing should be free it's only Johansson who can do it, npcs need to go by ferry"). At each end of the
 * Minato Maru's run her landing sign (のりば) stands where her passengers go aboard. The residents read it and take her;
 * Johansson alone can cross from it to the sign at the other end, free and at once (island/play.js quickCrossing),
 * arriving beside it on its walking side and facing inland.
 *
 * Minato: on the outer pier, 0.7 m north of her gangway's rail and 0.65 m in from the berthing face, between the bitts of
 * her forward spring (z −62) and after spring (z −77), so no line leads across it; the queue forms south of the gangway
 * (ferry.js queueSpot) and the walk to it passes on the sign's land side. Her bow ramp lands at the pier's root, far off.
 * Kitano-jima: in the place of the jetty's north rail stanchion at its shore end (u −49), so nothing new stands on the
 * jetty: the cars' lane (v 31) and her ramp on the west face keep their room.
 *
 * Its board, both faces alike: the destination (北野島行 / 港町行), フェリーのりば, and her name and the crossing's
 * minutes, which are the ship's own (AIRPORT_FERRY.duration).
 */
/** The gangway's north rail on the pier (ferry-model.js: its rails 0.68 m either side of its middle). */
const GANGWAY_RAIL=FERRY_BERTH.gangwayZ+.68;
export const QUICK_CROSSING=Object.freeze({
 town:{id:'quick-crossing-minato',to:'airport',jp:'北野島行',at:Object.freeze([MINATO_BERTH.bitts[0].x+.2,GANGWAY_RAIL+.72]),ground:OUTER_PIER.height,yaw:0,side:[.45,0],facing:Math.PI,label:'Quick crossing to Kitano-jima'},
 // Its foot is on the cargo court's asphalt, laid over the jetty's shore end (airport-ground.js AIRPORT_CARGO_SURFACE).
 airport:{id:'quick-crossing-kitano',to:'town',jp:'港町行',at:Object.freeze(airportWorld(-49,AIRPORT_JETTY.maxZ-.12)),ground:airportSurface(...airportWorld(-49,AIRPORT_JETTY.maxZ-.12)).y,yaw:AIRPORT_ISLAND.yaw,side:[0,-.45],facing:AIRPORT_ISLAND.yaw-Math.PI/2,label:'Quick crossing to Minato'},
});
// `side` is where the prompt is and where he stands on arriving, in the sign's own frame (turned by `yaw`): off the pier's
// berthing face at Minato, on the jetty's side of the rail at Kitano-jima. `facing` is his heading there: up the pier to
// its root, and along the jetty to the shore.
for(const q of Object.values(QUICK_CROSSING)){
 const c=Math.cos(q.yaw),s=Math.sin(q.yaw),[x,z]=q.side;
 q.stand=Object.freeze([q.at[0]+c*x+s*z,q.at[1]-s*x+c*z]);q.side=Object.freeze(q.side);Object.freeze(q);
}
/**
 * The sign: a galvanised pole and a double-faced sign box on its top, the pole's head inside the box; the box's foot is
 * over a tall man's head (2.0 m), 0.8 × 0.56 m, 0.15 m deep.
 */
export const QUICK_SIGN=Object.freeze({pole:.06,height:2.5,board:Object.freeze({w:.8,h:.56,depth:.15,bottom:2.0})});

/** The board's face: white enamel, a navy band with the destination, then フェリーのりば and her name and minutes. */
function face(jp){
 return paint(512,360,(ctx,w,h)=>{
  ctx.fillStyle='#f4f1e8';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#24406b';ctx.fillRect(0,0,w,h*.46);
  ctx.strokeStyle='#24406b';ctx.lineWidth=10;ctx.strokeRect(5,5,w-10,h-10);
  const font='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#ffffff';ctx.font=`bold 112px ${font}`;ctx.fillText(jp,w/2,h*.24,w-50);
  ctx.fillStyle='#24406b';ctx.font=`bold 64px ${font}`;ctx.fillText('フェリーのりば',w/2,h*.62,w-50);
  ctx.font=`bold 34px ${font}`;ctx.fillText('みなと丸 · 所要'+AIRPORT_FERRY.duration+'分',w/2,h*.85,w-60);
 });
}

/**
 * The same board two minutes before the Minato Maru sails from beside it (the owner, 21 October 2026; ferry-timetable.js):
 * a red band with 出港, then DEPARTING with her time and where she goes, so whoever is on the pier or her gangway knows
 * she will not wait.
 */
function departingFace(time,jp){
 return paint(512,360,(ctx,w,h)=>{
  ctx.fillStyle='#f4f1e8';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#b8302a';ctx.fillRect(0,0,w,h*.46);
  ctx.strokeStyle='#b8302a';ctx.lineWidth=10;ctx.strokeRect(5,5,w-10,h-10);
  const font='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#ffffff';ctx.font=`bold 120px ${font}`;ctx.fillText('出港',w/2,h*.24,w-50);
  ctx.fillStyle='#b8302a';ctx.font=`bold 60px ${font}`;ctx.fillText('DEPARTING '+time,w/2,h*.62,w-50);
  ctx.fillStyle='#24406b';ctx.font=`bold 38px ${font}`;ctx.fillText('みなと丸 · '+jp,w/2,h*.85,w-60);
 });
}

/**
 * Both signs, with their prompts. `onUse(destination)` is called with where the sign's crossing goes ('airport' from
 * Minato, 'town' from Kitano-jima). Each pole is a collider; the board is above a walker's head.
 */
export function buildQuickCrossings({parent,colliders=null,register=()=>{},onUse=()=>{}}){
 const S=QUICK_SIGN,B=S.board,steel=new THREE.MeshStandardMaterial({color:0x9aa0a3,metalness:.5,roughness:.45});
 const edge=new THREE.MeshStandardMaterial({color:0x24406b,roughness:.6}),anchors=[],boards={};
 for(const [from,q] of Object.entries(QUICK_CROSSING)){
  const g=new THREE.Group();g.name='Landing sign (のりば) · '+q.jp;g.position.set(q.at[0],q.ground,q.at[1]);g.rotation.y=q.yaw;parent.add(g);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(S.pole,S.pole,S.height,12),steel);pole.position.y=S.height/2;pole.name='Landing sign pole';g.add(pole);
  // The box: the same face on both sides, read along the pier at Minato and across the jetty at Kitano-jima.
  // Without a page to paint on (the tests, the tools) the box is plain enamel.
  const map=typeof document==='undefined'?null:face(q.jp),front=new THREE.MeshStandardMaterial({map,color:map?0xffffff:0xf4f1e8,roughness:.55});
  const board=new THREE.Mesh(new THREE.BoxGeometry(B.w,B.h,B.depth),[edge,edge,edge,edge,front,front]);
  // Its face changes (出港 before she sails, setDeparting below), so the board is never merged into the static batch.
  board.position.set(0,B.bottom+B.h/2,0);board.name='Landing sign board';board.userData.dynamicProp=true;g.add(board);
  boards[from]={board,map,shown:null};
  for(const o of [pole,board])o.castShadow=o.receiveShadow=true;
  if(colliders)colliders.push({id:q.id,x:q.at[0],z:q.at[1],w:.16,d:.16,height:S.height});
  // The prompt beside the pole at hand height, on the walking side.
  const a=new THREE.Object3D();a.position.set(q.side[0],1,q.side[1]);g.add(a);
  register(a,q.label,()=>onUse(q.to));anchors.push(a);
 }
 /**
  * `setDeparting(from, time)`: the board at `from` ('town' or 'airport') reads 出港 · DEPARTING `time`; with no time it
  * is her landing sign again. `departing(from)` is what it reads now, for the tests.
  */
 anchors.setDeparting=(from,time=null)=>{
  const b=boards[from];if(!b||b.shown===time)return;b.shown=time;
  if(typeof document==='undefined')return;
  // The faces as drawn now: the cel look (render/cel.js) swaps in its own materials, copying the map.
  const faces=[...new Set([b.board.material[4],b.board.material[5]])],old=faces[0].map,next=time?departingFace(time,QUICK_CROSSING[from].jp):b.map;
  for(const m of faces){m.map=next;m.needsUpdate=true;}
  if(old&&old!==b.map&&old!==next)old.dispose();
 };
 anchors.departing=from=>boards[from]?.shown??null;
 return anchors;
}
