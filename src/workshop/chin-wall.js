import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {createLabelAtlas} from './tetsuo-bench.js';

/**
 * Chin's west wall in the Dock Electrical & Repair Workshop (compact-shops.js, DOCK_WORKSHOP_ROOM, 8.4 × 7 m): the
 * mechanical half of "Chin & Tetsuo Repairs". Tetsuo's electrical corner is the back-right (tetsuo-bench.js); Chin is
 * the ferry's motorman and the town's mechanic between watches (cast.js), so his wall is a 1997 Okinawan small-town
 * boat mechanic's: a shadow board of spanners and sockets, a parts shelf of labelled bins of outboard spares, Kōji's
 * sabani outboard on a stand in its test tank, the job board, Sakura Trading's calendar, the extinguisher by the door,
 * and the poster of the chief's sculpture "Jonsson" that used to kneel on the floor here (the owner, 20 October 2026:
 * "Maybe the Johnson mechanical statue should go; maybe he can be used for a poster in the workshop").
 *
 * Every piece is data first (CHIN_KIT): what it is, who it belongs to, why it is there and why it stands where it does,
 * its period and the Japanese label the real thing carried; every prompt and description is English.
 *
 * Editions (edition.js): nothing here is machinery. On the web and on Linux alike each piece is a display with one read
 * prompt; the outboard is drawn mid-service and stays so.
 *
 * Budget: no lights, no animation. Everything is fixed, so it is merged after it is built: one draw for the painted
 * parts, one for the metal, and one for everything printed (the boards, the calendar, the poster and the labels share a
 * canvas), against the one the kneeling figure took.
 *
 * Room coordinates: the west wall's face is x = −4.2, the back wall's z = −3.5, the door is at x = 0 on z = +3.5.
 */
export const CHIN_WALL=Object.freeze({
 wall:-4.2,
 shelf:Object.freeze({x:-4.0,z:-2.33,width:.9,depth:.4,height:1.5}),
 toolBoard:Object.freeze({z:-1.1,y:1.475,width:1.2,height:.95}),
 calendar:Object.freeze({z:-.17,y:1.66,width:.36,height:.52}),
 whiteboard:Object.freeze({z:.65,y:1.5,width:1.0,height:.7}),
 poster:Object.freeze({z:1.7,y:1.45,width:.6,height:.85}),
 outboard:Object.freeze({x:-3.73,z:2.47,width:.9,depth:.93,height:1.45,tank:Object.freeze({x:-3.58,z:2.55,r:.23,height:.6})}),
 extinguisher:Object.freeze({x:-4.02,z:3.2}),
 why:'Chin’s half of the room is the west wall, left of the door as you come in: the board and the bins at the back, by his fabrication bench, the job board and the calendar where he reads them from the bench, and the outboard on its stand in the front corner, where a boat’s owner can see his motor from the doorway and the fumes of a run-up go out of the open door. The floor in the middle stays clear for carrying a motor in.',
});

/** The jobs on the board, in Chin’s hand: residents’ boats and the town’s things, October 1997. */
export const CHIN_JOBS=Object.freeze([
 Object.freeze({date:'10/14',job:'Kōji’s sabani: tiller throttle cable',done:true}),
 Object.freeze({date:'10/17',job:'Minato Maru rescue boat 15 hp: run-up aboard',done:true}),
 Object.freeze({date:'10/18',job:'Kōji’s sabani outboard: impeller, plugs, gear oil',done:false,now:true}),
 Object.freeze({date:'10/23',job:'Fuji’s houseboat: ladder hinge, shackles',done:false}),
 Object.freeze({date:'10/25',job:'Vy’s bicycle: chain (no charge)',done:false}),
 Object.freeze({date:'10/27',job:'Sakura Trading depot trolley: wheel',done:false}),
]);

/** The poster that replaced the figure on the floor (assets/graphics/workshop, rendered by tools/render-jonsson-poster.mjs). */
export const JONSSON_POSTER=Object.freeze({
 file:'jonsson-poster.webp',title:'JONSSON',sub:'The Engine Mender',
 jp:'港町 秋の手づくり展',dates:'18–26 October 1997 · Port Terminal hall · free',by:'A sculpture by N. Johansson',
 paper:'#efe6cf',ink:'#1f2a2c',accent:'#b8432f',
});

const plain=o=>Object.freeze(o);
/** The kit. `where` is the room position of its read prompt; `owner` is whose it is. `jp` is the label it carried. */
export const CHIN_KIT=Object.freeze([
 plain({id:'board',mesh:'Chin’s tool board',en:'Tool board',jp:'工具 使ったら戻す',owner:'Chin',where:[-3.95,1.45,-1.1],
  prompt:'Look at the tool board',
  why:'Every spanner and socket hangs over its own painted outline, so a missing one shows from the bench. One outline is empty: the 13 mm went aboard in Chin’s overalls this morning and comes back with him at 22:20.',
  period:'A plywood shadow board painted dark green with the outlines in white, on the wall above the floor; combination spanners 8 to 22 mm, a 3/8 inch socket rail, a ratchet and a plug spanner, the Japanese mechanic’s set of the 1980s.'}),
 plain({id:'shelf',mesh:'Outboard parts shelf',en:'Parts shelf',jp:'部品',owner:'Chin',where:[-3.7,1.1,-2.33],
  prompt:'Look at the parts shelf',
  why:'The spares the town’s outboards eat, in labelled bins: water-pump impellers, spark plugs, shear pins, zinc anodes, gaskets and O-rings, fuel filters, and gear oil on the floor shelf. Next to his bench, so a sabani can be back on the water the same evening.',
  period:'A grey bolted steel shelf with stacking plastic bins, each with a handwritten label in katakana, as every small marine engine shop had.'}),
 plain({id:'calendar',mesh:'Sakura Trading calendar',en:'Sakura Trading calendar',jp:'さくら商事 平成9年',owner:'workshop',where:[-3.95,1.6,-.17],
  prompt:'Look at the calendar',
  why:'Sakura Trading’s calendar: the workshop buys its shop goods from Thuan’s depot on account, and the depot gives every account customer one at New Year. Chin pencils the ferry’s refit days and the boats’ jobs on it, beside the job board.',
  period:'A one-month wall calendar of 1997, October showing, with the supplier’s name in red across the top, the kind every Japanese supplier handed out to its customers.'}),
 plain({id:'whiteboard',mesh:'Job whiteboard',en:'Job board',jp:'作業予定',owner:'Chin',where:[-3.95,1.5,.65],
  prompt:'Read the job board',
  why:'What is in, what is next and what is done, in Chin’s hand, so Tetsuo can answer an owner while Chin is aboard. The ticks are the jobs collected; Kōji’s outboard is the one on the stand.',
  period:'A small aluminium-framed whiteboard with a tray of markers, the shop’s job list in English and the dates the Japanese way, month and day.'}),
 plain({id:'poster',mesh:'Jonsson poster',en:'Jonsson poster',jp:'港町 秋の手づくり展',owner:'Chin',where:[-3.95,1.45,1.7],
  prompt:'Look at the Jonsson poster',
  why:'The chief’s sculpture of a mechanic kneeling at his engine, Jonsson, knelt on this floor until the workshop needed the room; it is shown at the Port Terminal hall for the town’s autumn craft fair, and Chin put its poster up where it stood. He says Jonsson is the only mechanic in town who never asks for overtime.',
  period:'A B2 exhibition poster printed in Naha for the town’s craft fair: a photograph of the sculpture on a dark ground, the title in English and the fair in Japanese, pinned at the corners.'}),
 plain({id:'outboard',mesh:'Outboard on the test stand',en:'Outboard on the stand',jp:'南風 15馬力',owner:'Chin',where:[-3.4,1.15,2.47],
  prompt:'Look at the outboard on the stand',
  why:'Kōji’s sabani outboard, in for its service: clamped to the stand’s transom with its leg in the test tank so it can be run without the boat. The old impeller lies on the stand with its vanes set and one torn; the new one, plugs and fresh gear oil go in, then a run-up in the tank before Kōji takes it back to the west quay.',
  period:'An invented Nanpū 15, a two-stroke 15 hp short-shaft outboard with a tiller, the motor of half the island’s small boats; a blue plastic drum of fresh water for the tank and a red portable fuel tank.'}),
 plain({id:'extinguisher',mesh:'Fire extinguisher',en:'Fire extinguisher',jp:'消火器',owner:'workshop',where:[-3.8,.8,3.2],
  prompt:'Look at the fire extinguisher',
  why:'Petrol, two-stroke oil and solder in one room: the extinguisher stands by the door, the way out of any fire, beside the outboard and its fuel tank, with the red sign above it so it is found in smoke.',
  period:'A red 10-type ABC dry-powder extinguisher on its floor stand, with the 消火器 sign on the wall above, as the fire code wanted in every workshop.'}),
]);
export const CHIN_KIT_BY_ID=Object.freeze(Object.fromEntries(CHIN_KIT.map(k=>[k.id,k])));

/** The solids the wall adds, room coordinates, `w` along x and `d` along z. The boards and the poster are flat on the wall. */
export const CHIN_COLLIDERS=Object.freeze([
 plain({id:'shelf',x:CHIN_WALL.shelf.x,z:CHIN_WALL.shelf.z,w:CHIN_WALL.shelf.depth+.03,d:CHIN_WALL.shelf.width+.03,height:CHIN_WALL.shelf.height}),
 plain({id:'outboard',x:CHIN_WALL.outboard.x,z:CHIN_WALL.outboard.z,w:CHIN_WALL.outboard.width,d:CHIN_WALL.outboard.depth,height:CHIN_WALL.outboard.height}),
 plain({id:'extinguisher',x:CHIN_WALL.extinguisher.x,z:CHIN_WALL.extinguisher.z,w:.24,d:.24,height:.62}),
]);

/** One read line per piece, the same on the web and on Linux. */
export function chinKitText(id){const k=CHIN_KIT_BY_ID[id];return k?k.why+'\n\n'+k.period:'';}

// ---- Painting: one canvas for the tool board's outlines, the job board and the calendar ------------------------------

const SPANNERS=Object.freeze([8,10,12,13,14,17,19,22]),MISSING=13,SOCKETS=Object.freeze([8,10,12,13,14,17,19]);
function paintBoards(c){
 const x=c.getContext('2d');
 // Tool board, 0..600 × 0..475 (1.2 × 0.95 m at 500 px/m): dark green, white outlines.
 x.fillStyle='#2f4a3a';x.fillRect(0,0,600,475);x.strokeStyle='#e9ecdf';x.fillStyle='#e9ecdf';x.lineWidth=3;
 SPANNERS.forEach((s,i)=>{const px=40+i*58,len=110+s*4;x.strokeRect(px-6,60,12,len);x.beginPath();x.arc(px,56,10+s*.5,0,Math.PI*2);x.stroke();x.strokeRect(px-10-s/2,54+len,20+s,20);
  x.font='bold 18px sans-serif';x.textAlign='center';x.fillText(String(s),px,34);});
 x.strokeRect(30,330,420,22);SOCKETS.forEach((s,i)=>{x.beginPath();x.arc(60+i*56,341,10+s*.6,0,Math.PI*2);x.stroke();});
 x.strokeRect(498,240,24,170);x.beginPath();x.arc(510,232,22,0,Math.PI*2);x.stroke();
 x.strokeRect(540,240,16,150);x.strokeRect(566,250,14,140);
 x.font='bold 26px sans-serif';x.textAlign='left';x.fillText('使ったら戻す',30,440);
 // Job board, 0..600 × 500..920 (1.0 × 0.7 m at 600 px/m): white, marker writing.
 x.fillStyle='#f6f7f3';x.fillRect(0,500,600,420);
 x.fillStyle='#1d3f8f';x.font='bold 40px sans-serif';x.fillText('JOBS — CHIN',24,552);x.font='22px sans-serif';x.fillStyle='#b8302a';x.fillText('Chin aboard 06:05–23:15 · ask Tetsuo',300,552,290);
 CHIN_JOBS.forEach((j,i)=>{const y=600+i*52;x.fillStyle=j.now?'#b8302a':'#1e2224';x.font=(j.now?'bold ':'')+'26px sans-serif';x.fillText(j.date,24,y);x.fillText(j.job,104,y,440);
  if(j.done){x.strokeStyle='#1e7a3a';x.lineWidth=5;x.beginPath();x.moveTo(556,y-12);x.lineTo(566,y);x.lineTo(588,y-26);x.stroke();}
  if(j.now){x.font='bold 18px sans-serif';x.fillText('ON THE STAND',470,y+22);}});
 // Calendar, 620..1000 × 0..550 (0.36 × 0.52 m at about 1055 px/m): Sakura Trading's October 1997.
 const cx=620,cw=380;x.fillStyle='#fbf8ef';x.fillRect(cx,0,cw,550);x.fillStyle='#c0392b';x.fillRect(cx,0,cw,92);
 x.fillStyle='#fffaf0';x.textAlign='center';x.font='bold 40px sans-serif';x.fillText('さくら商事',cx+cw/2,48);x.font='bold 22px sans-serif';x.fillText('SAKURA TRADING · MINATO',cx+cw/2,80);
 x.fillStyle='#2a2a28';x.font='bold 64px sans-serif';x.fillText('10',cx+80,170);x.font='bold 24px sans-serif';x.fillText('OCTOBER 1997',cx+250,140);x.font='20px sans-serif';x.fillText('平成9年 10月',cx+250,172);
 const days=['日','月','火','水','木','金','土'];days.forEach((d,i)=>{x.fillStyle=i===0?'#c0392b':i===6?'#1d4f9a':'#2a2a28';x.font='bold 22px sans-serif';x.fillText(d,cx+30+i*52,222);});
 // 1 October 1997 was a Wednesday.
 for(let d=1;d<=31;d++){const k=d+2,col=k%7,row=Math.floor(k/7);x.fillStyle=col===0?'#c0392b':col===6?'#1d4f9a':'#2a2a28';x.font='24px sans-serif';x.fillText(String(d),cx+30+col*52,268+row*52);
  if(d===18){x.strokeStyle='#5a5a58';x.lineWidth=2;x.beginPath();x.arc(cx+30+col*52,260+row*52,20,0,Math.PI*2);x.stroke();}}
 x.fillStyle='#5a5a58';x.font='italic 18px sans-serif';x.fillText('ferry refit? ask Fuji',cx+cw/2,535);
}

/** Where everything printed lives on the wall's one canvas (2048 × 1024): the boards, the poster, the labels. */
const PRINT=Object.freeze({width:2048,height:1024,poster:Object.freeze([1024,0,512,724]),labels:Object.freeze([1540,0,508,1024])});

/** The printed poster, drawn while the photographed one loads (and for good where it cannot, as in node's tests). */
function paintPosterFallback(c,[ox,oy]){
 const P=JONSSON_POSTER,x=c.getContext('2d');x.save();x.translate(ox,oy);
 x.fillStyle=P.paper;x.fillRect(0,0,512,724);x.fillStyle=P.ink;x.fillRect(28,28,456,470);
 // The figure's silhouette: a mechanic kneeling at his engine.
 x.fillStyle='#d9c9a3';x.beginPath();x.arc(200,190,30,0,Math.PI*2);x.fill();x.fillRect(170,222,70,120);x.fillRect(150,342,110,40);x.fillRect(236,250,90,22);
 x.fillStyle='#8c8f86';x.fillRect(300,280,130,120);x.fillRect(320,250,40,30);
 x.textAlign='center';x.fillStyle=P.accent;x.font='bold 82px serif';x.fillText(P.title,256,580,460);
 x.fillStyle=P.ink;x.font='italic 28px serif';x.fillText(P.sub,256,618,460);x.font='bold 26px sans-serif';x.fillText(P.jp,256,660,460);
 x.font='17px sans-serif';x.fillText(P.dates,256,694,470);x.restore();
}

/**
 * Builds the wall into the room.
 * @param {{room:THREE.Object3D,collider:Function,reg:Function,action:Function}} options
 */
export function buildChinWall({room,collider,reg,action}){
 const W=CHIN_WALL,face=W.wall,group=new THREE.Group();group.name='Chin’s mechanical wall';room.add(group);
 const disposables=[],palette=new Map();
 const flat=(c,{metal=0}={})=>{const k=c+'/'+metal;if(!palette.has(k))palette.set(k,new THREE.MeshStandardMaterial({color:c,roughness:metal?.4:.72,metalness:metal}));return palette.get(k);};
 const mesh=(name,geometry,material,pos,parent=group,rot)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...pos);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 const box=(name,size,pos,c,parent,rot,metal=0)=>mesh(name,new THREE.BoxGeometry(...size),flat(c,{metal}),pos,parent,rot);
 const cyl=(name,r1,r2,h,pos,c,parent,rot,seg=14,metal=0)=>mesh(name,new THREE.CylinderGeometry(r1,r2,h,seg),flat(c,{metal}),pos,parent,rot);
 const steel=(name,size,pos,c=0x9aa3a0,parent)=>box(name,size,pos,c,parent,null,.5);
 // One canvas, one texture, one material for everything printed: the boards' painting, the poster and the labels.
 const print=document.createElement('canvas');print.width=PRINT.width;print.height=PRINT.height;
 paintBoards(print);paintPosterFallback(print,PRINT.poster);
 const atlas=createLabelAtlas(PRINT.width,{canvas:print,area:PRINT.labels}),boardMat=atlas.material;boardMat.name='Chin’s wall prints';disposables.push(atlas.texture,atlas.material);
 const ON_WALL=[0,Math.PI/2,0];
 function plate(name,lines,size,pos,opts={},rot=ON_WALL,parent=group){const g=atlas.label(lines,size,opts);if(!g)return null;return mesh(name,g,atlas.material,pos,parent,rot);}
 /** A plane on the wall showing one region of the print canvas, in its pixels. */
 function painted(name,[w,h],pos,[px,py,pw,ph],parent=group){
  const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(px+uv.getX(i)*pw)/PRINT.width,1-(py+(1-uv.getY(i))*ph)/PRINT.height);
  return mesh(name,g,boardMat,pos,parent,ON_WALL);
 }

 // ---- The parts shelf by Chin's bench -------------------------------------------------------------------------------
 const S=W.shelf,shelf=new THREE.Group();shelf.name=CHIN_KIT_BY_ID.shelf.mesh;group.add(shelf);
 const sx0=S.x-S.depth/2,sx1=S.x+S.depth/2,sz0=S.z-S.width/2,sz1=S.z+S.width/2;
 for(const x of [sx0+.02,sx1-.02])for(const z of [sz0+.02,sz1-.02])steel('Shelf post (angle steel)',[.035,S.height,.035],[x,S.height/2,z],0xb9c0bd,shelf);
 for(const y of [.1,.55,1.0,1.45])steel('Shelf deck',[S.depth,.02,S.width],[S.x,y,S.z],0xb9c0bd,shelf);
 const BINS=[['インペラー 15馬力','impellers'],['プラグ B7HS','spark plugs'],['シアピン','shear pins'],['亜鉛 アノード','zinc anodes'],
  ['ガスケット','gaskets'],['Oリング','O-rings'],['燃料フィルター','fuel filters'],['スターターロープ','starter cord']];
 BINS.forEach(([jp],i)=>{const y=i<4?.56:1.01,z=sz0+.12+(i%4)*.22,colour=i<4?0x2f6fb8:0xd9822b;
  box('Parts bin',[.3,.15,.2],[S.x+.03,y+.075,z],colour,shelf);
  plate('Bin label',[jp],[.15,.04],[S.x+.181,y+.1,z],{bg:'#f4f0e2',scale:1100},ON_WALL,shelf);});
 for(let i=0;i<3;i++)cyl('Gear oil bottle',.045,.045,.2,[S.x+.05,.21,sz0+.15+i*.12],0x1d3f6b,shelf,null,12);
 plate('Gear oil label',['ギヤオイル'],[.12,.035],[S.x+.1,.21,sz0+.39],{bg:'#e8c24a',scale:1100},ON_WALL,shelf);
 box('Impeller boxes',[.28,.12,.5],[S.x,1.52,S.z],0xe9e2cc,shelf);
 collider(...['x','z','w','d','height'].map(k=>CHIN_COLLIDERS[0][k]));

 // ---- The tool board: spanners and sockets over their outlines -------------------------------------------------------
 const T=W.toolBoard,board=new THREE.Group();board.name=CHIN_KIT_BY_ID.board.mesh;group.add(board);
 box('Tool board batten',[.03,.05,T.width],[face+.015,T.y+T.height/2-.08,T.z],0x6b4f36,board);box('Tool board batten',[.03,.05,T.width],[face+.015,T.y-T.height/2+.08,T.z],0x6b4f36,board);
 painted('Tool board (painted outlines)',[T.width,T.height],[face+.032,T.y,T.z],[0,0,600,475],board);
 // Canvas pixel to wall position: 500 px per metre from the board's top-left (z grows with px, y falls with py).
 // Seen from the room (looking west), right is −z, so the canvas runs from the board's +z edge.
 const at=(px,py,d=.04)=>[face+d,T.y+T.height/2-py/500,T.z+T.width/2-px/500];
 SPANNERS.forEach((s,i)=>{if(s===MISSING)return;const px=40+i*58,len=110+s*4,[x,y,z]=at(px,60+len/2,.045),[,yt]=at(px,56),[,yb]=at(px,64+len);
  steel('Combination spanner '+s+' mm',[.008,len/500,.016+s*.0006],[x,y,z],0xc8ccc9,board);
  cyl('Spanner ring end',(10+s*.5)/500,(10+s*.5)/500,.008,[x,yt,z],0xc8ccc9,board,[0,0,Math.PI/2],12,.5);
  box('Spanner open end',[.008,.034,(16+s)/500],[x,yb,z],0xc8ccc9,board,null,.5);});
 {const [x,y,z]=at(240,341,.045);steel('Socket rail',[.012,.04,.84],[x,y,z],0xb03a2e,board);}
 SOCKETS.forEach((s,i)=>{const [x,y,z]=at(60+i*56,341,.06);cyl('Socket '+s+' mm',(8+s*.5)/500,(8+s*.5)/500,.04,[x,y,z],0xd2d6d3,board,[0,0,Math.PI/2],12,.5);});
 {const [x,y,z]=at(510,320,.05);steel('Ratchet handle',[.012,.34,.045],[x,y,z],0x8f9592,board);const [,yh]=at(510,232);cyl('Ratchet head',.044,.044,.02,[x,yh,z],0xc8ccc9,board,[0,0,Math.PI/2],14,.5);}
 {const [x,y,z]=at(548,315,.05);steel('Plug spanner',[.012,.3,.03],[x,y,z],0xc8ccc9,board);const [x2,y2,z2]=at(573,320,.05);box('Screwdriver handle',[.03,.12,.028],[x2,y2+.08,z2],0xd8b13a,board);steel('Screwdriver blade',[.006,.16,.006],[x2,y2-.06,z2],0x9aa3a0,board);}

 // ---- The calendar and the job board ---------------------------------------------------------------------------------
 const C=W.calendar,calendar=new THREE.Group();calendar.name=CHIN_KIT_BY_ID.calendar.mesh;group.add(calendar);
 painted('Calendar page',[C.width,C.height],[face+.006,C.y,C.z],[620,0,380,550],calendar);cyl('Calendar nail',.005,.005,.03,[face+.015,C.y+C.height/2+.02,C.z],0x77706a,calendar,[0,0,Math.PI/2],6,.5);
 const B=W.whiteboard,wb=new THREE.Group();wb.name=CHIN_KIT_BY_ID.whiteboard.mesh;group.add(wb);
 painted('Whiteboard surface',[B.width,B.height],[face+.022,B.y,B.z],[0,500,600,420],wb);
 for(const s of [-1,1]){steel('Whiteboard frame',[.03,.025,B.width+.05],[face+.018,B.y+s*(B.height/2+.012),B.z],0xc5cbc8,wb);steel('Whiteboard frame',[.03,B.height,.025],[face+.018,B.y,B.z+s*(B.width/2+.012)],0xc5cbc8,wb);}
 steel('Marker tray',[.07,.02,.7],[face+.045,B.y-B.height/2-.035,B.z],0xc5cbc8,wb);
 [[0x1d3f8f,-.2],[0xb8302a,-.05],[0x1e2224,.12]].forEach(([c,dz])=>cyl('Marker',.009,.009,.13,[face+.05,B.y-B.height/2-.016,B.z+dz],c,wb,[Math.PI/2,0,0],8));

 // ---- The poster where the figure knelt ------------------------------------------------------------------------------
 const P=W.poster,poster=new THREE.Group();poster.name=CHIN_KIT_BY_ID.poster.mesh;group.add(poster);
 painted('Poster print',[P.width,P.height],[face+.008,P.y,P.z],PRINT.poster,poster);
 for(const dy of [-1,1])for(const dz of [-1,1])cyl('Drawing pin',.008,.008,.006,[face+.012,P.y+dy*(P.height/2-.02),P.z+dz*(P.width/2-.02)],0xc0392b,poster,[0,0,Math.PI/2],8);
 // The photographed poster replaces the drawn one on the same canvas when it arrives.
 if(globalThis.document?.baseURI&&typeof Image!=='undefined'){const img=new Image();img.decoding='async';
  img.onload=()=>{if(!disposables.length)return;const [px,py,pw,ph]=PRINT.poster;print.getContext('2d').drawImage(img,px,py,pw,ph);atlas.texture.needsUpdate=true;};
  img.onerror=()=>console.warn('Jonsson poster unavailable; keeping the printed panel.');img.src=assetURL('graphics/workshop/'+JONSSON_POSTER.file);}

 // ---- The outboard on its stand, its leg in the test tank -----------------------------------------------------------
 const O=W.outboard,tank=O.tank,motor=new THREE.Group();motor.name=CHIN_KIT_BY_ID.outboard.mesh;group.add(motor);
 const legX=tank.x,transomX=-3.88,z0=tank.z,rounded=(m,sx,sy,sz)=>{m.scale.set(sx,sy,sz);return m;};
 for(const dz of [-.36,.36]){steel('Stand foot (angle steel)',[.86,.04,.05],[O.x,.02,z0+dz],0x4f6f8a,motor);steel('Stand upright',[.05,1.0,.05],[transomX-.06,.52,z0+dz],0x4f6f8a,motor);
  steel('Stand brace',[.04,.04,.5],[transomX+.06,.45,z0+dz*.5],0x4f6f8a,motor);}
 steel('Stand cross bar',[.05,.05,.77],[transomX-.06,.2,z0],0x4f6f8a,motor);
 box('Transom board (plywood)',[.05,.38,.55],[transomX,.84,z0],0x9c7a52,motor);
 // The test tank: a blue drum of fresh water, its rolled rim, the leg standing in it.
 // Open at the top: the water stands just under the rolled rim.
 mesh('Test tank (blue drum)',new THREE.CylinderGeometry(tank.r,tank.r-.015,tank.height,22,1,true),flat(0x2c62a8),[tank.x,tank.height/2,tank.z],motor);
 mesh('Tank rim',new THREE.TorusGeometry(tank.r,.012,6,22),flat(0x22508c),[tank.x,tank.height,tank.z],motor,[Math.PI/2,0,0]);
 cyl('Tank water',tank.r-.003,tank.r-.003,.01,[tank.x,tank.height-.02,tank.z],0x3a5d6a,motor,null,22);
 // The motor: clamp bracket over the transom, swivel bracket to the midsection, the leg down into the water, the power
 // head under its rounded cowl above.
 box('Clamp bracket',[.1,.2,.17],[transomX+.05,.96,z0],0x2a2d30,motor);
 for(const dz of [-.05,.05])cyl('Transom clamp screw',.012,.012,.14,[transomX-.06,.86,z0+dz],0xc8ccc9,motor,[0,0,Math.PI/2],8,.5);
 box('Swivel bracket',[legX-transomX-.12,.1,.1],[(transomX+.1+legX-.02)/2,.97,z0],0x2a2d30,motor);
 box('Drive shaft housing (leg)',[.07,.56,.07],[legX,.73,z0],0x26292c,motor);
 rounded(cyl('Gearcase',.045,.045,.24,[legX+.02,.36,z0],0x26292c,motor,[0,0,Math.PI/2],12),1,1,1);box('Skeg',[.05,.12,.02],[legX+.05,.26,z0],0x26292c,motor);
 box('Anti-ventilation plate',[.24,.012,.17],[legX+.04,.46,z0],0x26292c,motor);
 const prop=new THREE.Group();prop.position.set(legX+.15,.36,z0);motor.add(prop);
 for(let i=0;i<3;i++)box('Propeller blade',[.01,.1,.05],[0,0,0],0x3a3d40,prop,[i*Math.PI*2/3,0,.3]).geometry.translate(0,.05,0);
 box('Midsection (lower cowl)',[.3,.12,.22],[legX,1.06,z0],0x2a2d30,motor);
 rounded(cyl('Cowling band',.152,.152,.03,[legX,1.135,z0],0xe8e4d8,motor,null,18),1.25,1,.9);
 rounded(cyl('Cowling (upper)',.15,.155,.24,[legX,1.27,z0],0x2b4a6b,motor,null,18),1.25,1,.9);
 rounded(mesh('Cowling top',new THREE.SphereGeometry(.15,18,8,0,Math.PI*2,0,Math.PI/2),flat(0x2b4a6b),[legX,1.39,z0],motor),1.25,.4,.9);
 for(const s of [-1,1])plate('Cowling decal',['NANPU 15','南風 15馬力'],[.2,.07],[legX,1.27,z0+s*.142],{bg:'#2b4a6b',fg:'#f4efe0',scale:1100},[0,s>0?0:Math.PI,0],motor);
 // The tiller points forward, over the transom, as it would into the boat; the starter cord's handle is on the front.
 box('Tiller arm',[.4,.035,.04],[legX-.24,1.07,z0+.12],0x2a2d30,motor);cyl('Tiller grip (throttle)',.022,.022,.12,[legX-.46,1.07,z0+.12],0x1c1d1f,motor,[0,0,Math.PI/2],10);
 cyl('Starter handle',.018,.018,.09,[legX-.2,1.22,z0-.05],0xe8e4d8,motor,[Math.PI/2,0,0],8);
 cyl('Old impeller (vanes set, one torn)',.04,.04,.03,[transomX,1.045,z0+.2],0x1c1d1f,motor,null,10);
 box('Spark plugs, out',[.03,.02,.06],[transomX,1.04,z0-.2],0xc8ccc9,motor);
 // The fuel tank beside the stand, its line drooping to the motor's connector.
 box('Portable fuel tank (12 L)',[.3,.24,.22],[-3.45,.12,2.12],0xc0392b,motor);cyl('Fuel tank cap',.03,.03,.02,[-3.5,.25,2.06],0x1c1d1f,motor,null,10);
 {// Off the tank's connector, down to the floor, up beside the drum to the motor's connector.
  const pts=[new THREE.Vector3(-3.42,.2,2.235),new THREE.Vector3(-3.48,.03,2.27),new THREE.Vector3(-3.62,.05,2.27),new THREE.Vector3(-3.64,.9,2.27),new THREE.Vector3(legX-.04,1.03,z0-.12)];
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=a.distanceTo(b),line=cyl('Fuel line',.007,.007,len,[0,0,0],0x1c1d1f,motor,null,6);line.position.copy(a).add(b).multiplyScalar(.5);line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());}
  cyl('Primer bulb',.022,.022,.07,[0,0,0],0x1c1d1f,motor,null,8).position.copy(pts[2]).lerp(pts[3],.4);}
 collider(...['x','z','w','d','height'].map(k=>CHIN_COLLIDERS[1][k]));

 // ---- The extinguisher by the door -----------------------------------------------------------------------------------
 const E=W.extinguisher,ext=new THREE.Group();ext.name=CHIN_KIT_BY_ID.extinguisher.mesh;group.add(ext);
 box('Extinguisher stand',[.22,.04,.22],[E.x,.02,E.z],0xb02a22,ext);
 cyl('Extinguisher cylinder',.085,.085,.48,[E.x,.28,E.z],0xc8261e,ext,null,16);cyl('Extinguisher shoulder',.085,.05,.05,[E.x,.545,E.z],0xc8261e,ext,null,16);
 box('Extinguisher valve and handle',[.1,.06,.04],[E.x,.6,E.z],0x2a2a28,ext);box('Extinguisher hose',[.02,.3,.02],[E.x+.09,.42,E.z],0x1c1d1f,ext);
 plate('Extinguisher label',['消火器','ABC 10型'],[.11,.12],[E.x+.087,.3,E.z],{bg:'#f4efe0',fg:'#b02a22',scale:900},ON_WALL,ext);
 plate('Extinguisher sign',['消火器'],[.3,.12],[face+.005,1.6,E.z],{bg:'#c8261e',fg:'#ffffff',scale:900},ON_WALL,ext);
 collider(...['x','z','w','d','height'].map(k=>CHIN_COLLIDERS[2][k]));

 bake();

 // ---- Prompts: one read line each, on every edition --------------------------------------------------------------------
 const anchors=new Map();
 for(const k of CHIN_KIT){
  const o=new THREE.Object3D();o.name='Prompt: '+k.en;o.position.set(...k.where);o.userData.workers=['Chin'];o.userData.reach=2;o.userData.facing=.8;o.userData.chinKit=k.id;group.add(o);
  reg(o,k.prompt,()=>action('inspect',k.en,chinKitText(k.id)),true);anchors.set(k.id,o);
 }

 /** Everything fixed is merged by material: vertex colours for the painted and the metal parts, one each for the prints. */
 function bake(){
  group.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert(),flats=new Set(palette.values()),batches=new Map(),drop=[];
  group.traverse(o=>{if(!o.isMesh)return;const m=o.material,kind=flats.has(m)?(m.metalness>0?'metal':'matte'):null,key=kind||m.uuid;
   const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
   if(kind){g.deleteAttribute('uv');const n=g.attributes.position.count,rgb=new Float32Array(n*3);for(let i=0;i<n;i++)m.color.toArray(rgb,i*3);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));}
   if(!batches.has(key))batches.set(key,{kind,material:m,parts:[]});batches.get(key).parts.push(g);drop.push(o);});
  for(const o of drop){o.parent.remove(o);o.geometry.dispose();}
  for(const [key,b] of batches){
   const material=b.kind?new THREE.MeshStandardMaterial({vertexColors:true,roughness:b.kind==='metal'?.4:.72,metalness:b.kind==='metal'?.4:0}):b.material;
   const merged=new THREE.Mesh(mergeGeometries(b.parts,false),material);b.parts.forEach(g=>g.dispose());
   merged.name='Chin’s wall, merged '+(b.kind||material.name||key.slice(0,8));
   // On the wall, or low on the floor by it: the boards and prints cast nothing; the shelf and the motor do.
   merged.castShadow=!!b.kind;merged.receiveShadow=true;group.add(merged);
   if(b.kind)disposables.push(material);
  }
  for(const m of flats)m.dispose();
 }

 return {
  group,anchors,colliders:CHIN_COLLIDERS,
  dispose(){for(const d of disposables)d.dispose?.();disposables.length=0;group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});},
 };
}
