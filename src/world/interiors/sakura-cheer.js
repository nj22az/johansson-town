import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {buildSakuraHotFood} from './sakura-counter-detail.js';
import {SAKURA_BAND_DESIGN,runLength,boards,alongRun} from './sakura-band.js';
import {SAKURA_TILL_FLOOR} from './sakura-layout.js';

/**
 * The cheerful half of a real konbini, and Thuan's back office.
 *
 * - A hot-snack case on the counter where the ledger used to lie: warm glass, golden
 *   karaage, steamed buns and American dogs, and an oden pot at the end of the counter.
 * - Bunting and hanging POP cards over the aisles, a welcome mat at the door and floor
 *   stickers that walk you to the till.
 * - The ledger is on Thuan's desk in the small office behind the till (sakura-small-office.js).
 *
 * Every piece is plain geometry and small canvas signs, built once when the shop is.
 */
const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';

function sign(width,height,draw){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
// Centred lettering that never runs off its card: fillText narrows anything wider than the room either side of x.
const signText=(ctx,text,x,y,size,colour,weight='bold')=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${MARU}`;ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.canvas?.width;ctx.fillText(text,x,y,...(w?[Math.max(8,2*Math.min(x,w-x)-16)]:[]));};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...extra});
function add(room,geometry,material,x,y,z,name){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;room.add(m);return m;}
function card(room,texture,w,h,x,y,z,yaw=0,name='Sakura POP',side=THREE.DoubleSide){
 const m=add(room,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side,toneMapped:false}),x,y,z,name);m.rotation.y=yaw;return m;
}

/** The glass hot case and the oden pot on the counter. The customer stands at x < 4.54. */
export const HOT_CASE=Object.freeze({x:4.82,z:1.7,w:.4,d:.52,h:.36,top:FURNITURE_HEIGHTS.serviceCounter});
export const ODEN_POT=Object.freeze({x:4.8,z:3.2});
function buildHotCase(room,anchor,action){
 const C=HOT_CASE,y0=C.top,cx=C.x,cz=C.z;
 const frame=mat(0xe3e7dd),steel=mat(0xc9ced2,{metalness:.4,roughness:.35});
 // Base, back and roof in red; glass front and sides; a warm lit floor inside.
 add(room,new THREE.BoxGeometry(C.w,.05,C.d),frame,cx,y0+.025,cz,'Sakura hot case');
 add(room,new THREE.BoxGeometry(C.w+.02,.05,C.d+.02),frame,cx,y0+C.h,cz,'Sakura hot case');
 add(room,new THREE.BoxGeometry(.02,C.h,C.d),frame,cx+C.w/2,y0+C.h/2,cz,'Sakura hot case');
 const glass=new THREE.MeshStandardMaterial({color:0xfff3d6,transparent:true,opacity:.22,roughness:.05,depthWrite:false});
 add(room,new THREE.BoxGeometry(.012,C.h-.05,C.d),glass,cx-C.w/2,y0+C.h/2,cz,'Sakura hot case glass');
 for(const s of [-1,1])add(room,new THREE.BoxGeometry(C.w,C.h-.05,.012),glass,cx,y0+C.h/2,cz+s*C.d/2,'Sakura hot case glass');
 const warm=new THREE.MeshStandardMaterial({color:0xffc46b,emissive:0xff9a3c,emissiveIntensity:.55});
 add(room,new THREE.BoxGeometry(C.w-.04,.01,C.d-.04),warm,cx,y0+.055,cz,'Sakura hot case tray');
 add(room,new THREE.BoxGeometry(C.w-.04,.008,C.d-.04),new THREE.MeshStandardMaterial({color:0xfff2c8,emissive:0xffd89a,emissiveIntensity:.9}),cx,y0+C.h-.03,cz,'Sakura hot case lamp');
 // Three occupied racks share one geometry/material batch instead of a draw per snack.
 buildSakuraHotFood(room,C);
 // A header card facing the customer.
 const header=sign(512,128,(ctx,w,h)=>{ctx.fillStyle='#d7263d';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffe28a';ctx.fillRect(0,h-14,w,14);signText(ctx,"Hot snack",w/2,h*.42,58,'#ffffff');signText(ctx,"HOT SNACKS · Hot!",w/2,h*.8,24,'#ffe28a');});
 card(room,header,C.d,C.d/4,cx-C.w/2-.012,y0+C.h+.07,cz,-Math.PI/2,'Sakura hot case header');
 anchor([cx-.3,y0+.25,cz],'Buy hot snacks from the case',()=>action('sakura-hot-snacks'));
 // Oden: a square steel pot with a lid half off and a ladle.
 const O=ODEN_POT;
 add(room,new THREE.BoxGeometry(.32,.12,.32),steel,O.x,y0+.06,O.z,'Sakura oden pot');
 add(room,new THREE.BoxGeometry(.28,.01,.28),mat(0xc98a3a,{emissive:0x5a3210,emissiveIntensity:.3}),O.x,y0+.11,O.z,'Sakura oden broth');
 for(const [dx,dz,c] of [[-.07,-.07,0xf4f0e2],[.06,-.05,0xf7e7a0],[-.05,.07,0xd8b88a],[.07,.07,0xf4f0e2]])add(room,new THREE.SphereGeometry(.035,10,6),mat(c),O.x+dx,y0+.12,O.z+dz,'Sakura oden');
 const ladle=add(room,new THREE.CylinderGeometry(.006,.006,.3,6),steel,O.x+.1,y0+.22,O.z,'Sakura oden ladle');ladle.rotation.z=-.6;
 const oden=sign(256,128,(ctx,w,h)=>{ctx.fillStyle='#fff7df';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d7263d';ctx.lineWidth=10;ctx.strokeRect(5,5,w-10,h-10);signText(ctx,"Oden",w/2,h*.45,56,'#d7263d');signText(ctx,"1Ko ¥70〜",w/2,h*.8,24,'#5a3a1a');});
 card(room,oden,.22,.11,O.x-.17,y0+.2,O.z,-Math.PI/2,'Sakura oden card');
}

/** Bunting, hanging POP cards, the welcome mat and floor stickers to the till. */
function buildCheer(room){
 const colours=[0xff6b6b,0xffc93c,0x5ec8f2,0x7ccc4a,0xf06ba8,0x9b7bf0];
 const flag=new THREE.BufferGeometry();flag.setAttribute('position',new THREE.Float32BufferAttribute([-.09,0,0,.09,0,0,0,-.17,0],3));flag.computeVertexNormals();
 const flagMats=colours.map(c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,toneMapped:false}));
 const string=new THREE.MeshBasicMaterial({color:0xfff6e0});
 // No bunting: one promotion band and a card at each end cap say more than flags across
 // the whole ceiling did (docs/SAKURA-SHOP-PLAN.md).
 // Round POP cards hanging on threads over the islands: sale, new, oden, stamp card.
 // One card, over what it is about: the new crisps. The till canopy already says oden.
 const pops=[["New release!",'NEW',0xf06ba8,-1.55,1.9]];
 for(const [jp,en,colour,x,z] of pops){
  const hex='#'+colour.toString(16).padStart(6,'0');
  // Lettered to fit inside the white disc, with the corners left clear.
  const tex=sign(256,256,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle=hex;ctx.beginPath();ctx.arc(w/2,h/2,w/2-4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(w/2,h/2,w/2-22,0,Math.PI*2);ctx.fill();
   const fit=(s,size,room)=>{ctx.font=`bold ${size}px ${MARU}`;while(size>14&&ctx.measureText(s).width>room){size-=1;ctx.font=`bold ${size}px ${MARU}`;}return size;};
   signText(ctx,jp,w/2,h*.45,fit(jp,54,w-80),hex);signText(ctx,en,w/2,h*.68,fit(en,30,w-110),'#3b3f55');});
  // Hung high enough to clear a grown-up's eye line: at 2.05 m they sat in your face.
  // Back to back, facing up and down the aisle: crossed cards cut through each other's
  // lettering, and a double-sided one reads backwards from behind.
  for(const [yaw,dz] of [[0,.004],[Math.PI,-.004]])card(room,tex,.36,.36,x,2.27,z+dz,yaw,'Sakura hanging POP',THREE.FrontSide).material.alphaTest=.5;
  add(room,new THREE.CylinderGeometry(.003,.003,.5,4),string,x,2.7,z,'Sakura POP thread');
 }
 // Welcome mat inside the door, and paw-print stickers from the door to the till.
 const matTex=sign(512,256,(ctx,w,h)=>{ctx.fillStyle='#2a8fcc';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ffffff';ctx.lineWidth=12;ctx.strokeRect(14,14,w-28,h-28);signText(ctx,"Welcome",w/2,h*.45,62,'#ffffff');signText(ctx,'SAKURA SHOP',w/2,h*.75,30,'#ffe28a');});
 const welcome=add(room,new THREE.PlaneGeometry(1.5,.75),new THREE.MeshStandardMaterial({map:matTex,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),0,.010,3.35,'Sakura welcome mat');welcome.rotation.x=-Math.PI/2;
 const paw=sign(128,128,(ctx,w,h)=>{ctx.fillStyle='#f06ba8';ctx.beginPath();ctx.ellipse(w/2,h*.62,26,22,0,0,Math.PI*2);ctx.fill();for(const [dx,dy] of [[-30,-14],[-11,-30],[11,-30],[30,-14]]){ctx.beginPath();ctx.arc(w/2+dx,h*.5+dy,10,0,Math.PI*2);ctx.fill();}});
 const pawMat=new THREE.MeshStandardMaterial({map:paw,transparent:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,depthWrite:false});
 const steps=[[1.1,2.7],[1.6,2.3],[2.1,1.95],[2.6,1.6],[3.1,1.3],[3.6,1.05]];
 steps.forEach(([x,z],i)=>{const m=add(room,new THREE.PlaneGeometry(.2,.2),pawMat,x+(i%2?.08:-.08),.007,z,'Sakura floor sticker');m.rotation.set(-Math.PI/2,0,Math.atan2(3.6-1.1,1.05-2.7)+Math.PI);});
 const tillTex=sign(256,96,(ctx,w,h)=>{ctx.fillStyle='#ffc93c';ctx.fillRect(0,0,w,h);
  // Sized to the sticker: at a fixed 54 px the words ran off both ends.
  const label="Cash register ▶";let size=54;ctx.font=`bold ${size}px ${MARU}`;while(size>18&&ctx.measureText(label).width>w-24){size-=2;ctx.font=`bold ${size}px ${MARU}`;}
  signText(ctx,label,w/2,h/2,size,'#3b3f55');});
 const till=add(room,new THREE.PlaneGeometry(.5,.19),new THREE.MeshStandardMaterial({map:tillTex,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),3.95,.007,.85,'Sakura till sticker');till.rotation.set(-Math.PI/2,0,-Math.PI/2);
}

// The small office behind the till is its own module now (sakura-small-office.js, sakura-small-office-build.js).

export function buildSakuraCheer(room,{anchor,action}){
 buildHotCase(room,anchor,action);
 buildCheer(room);
}

/**
 * The wall band (sakura-band.js, drawings SK-WB-001..003 rev A): its heights and runs in metres for the stripe under
 * it (sakura-surfaces.js), and the counter's customer face. `y0` is the bead's bottom, under which the stripe hangs.
 */
const BD=SAKURA_BAND_DESIGN,mm=v=>v/1000;
export const SAKURA_BAND=Object.freeze({y0:mm(BD.bead.y0),y1:mm(BD.cap.y1),runs:Object.freeze(BD.runs.map(r=>Object.freeze(
 r.wall==='x'?{x:r.at,z0:Math.min(r.from,r.to),z1:Math.max(r.from,r.to),yaw:r.yaw}:{z:r.at,x0:Math.min(r.from,r.to),x1:Math.max(r.from,r.to),yaw:r.yaw}))),
 counter:{x:4.52,z0:.1,z1:3.52,y0:.08,y1:FURNITURE_HEIGHTS.serviceCounter-.08}});

/** One run's signwritten face: its planed boards, their joints, and its own lettering, laid out for this wall. */
function bandFace(run){
 const L=runLength(run),H=BD.board.y1-BD.board.y0,k=Math.min(.58,4096/L),C=BD.colours;
 return sign(Math.round(L*k),Math.round(H*k),(ctx,w,h)=>{
  ctx.scale(k,k);
  ctx.fillStyle=C.board;ctx.fillRect(0,0,L,H);
  for(let y=4;y<H;y+=9){ctx.strokeStyle=(y/9)%2<1?'rgba(185,138,82,.45)':'rgba(255,240,210,.25)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(L*.3,y-2,L*.6,y+3,L,y+1);ctx.stroke();}
  ctx.fillStyle='#6e4c2c';for(const [a] of boards(run).slice(1))ctx.fillRect(a-BD.board.joint/2,0,BD.board.joint,H);
  for(const it of run.items){
   if(it.text){ctx.fillStyle=C.ink;ctx.font=`bold ${it.size}px ${MARU}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(it.text,it.u,H/2+4,it.w);}
   else if(it.kind==='crest'){
    const r=it.size/2,cx=it.u,cy=H/2;
    ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=C.cream;ctx.beginPath();ctx.arc(cx,cy,r*.86,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f2a6b8';for(let q=0;q<5;q++){const a=q*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*.3,cy-r*.12+Math.sin(a)*r*.3,r*.17,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f2c21a';ctx.beginPath();ctx.arc(cx,cy-r*.12,r*.1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=C.red;ctx.font=`bold ${Math.round(r*.36)}px ${MARU}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Sakura',cx,cy+r*.5,r*1.4);
   }else if(it.kind==='leaf'){
    ctx.fillStyle='#5c8046';
    for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(it.u+sx*6,H/2);ctx.quadraticCurveTo(it.u+sx*36,H/2-40,it.u+sx*66,H/2+10);ctx.quadraticCurveTo(it.u+sx*30,H/2+16,it.u+sx*6,H/2);ctx.fill();}
   }
  }
 });
}

/**
 * The band in wood: on each wall, a stripe rail and the board (one solid each, from the wall to the board's face, its face
 * signwritten), a bead between them and a cap on top. Seen from inside the shop, no word repeats and none is cut.
 */
function buildBand(room){
 const C=BD.colours,wood=new THREE.MeshStandardMaterial({color:C.board,roughness:.75}),cap=new THREE.MeshStandardMaterial({color:C.cap,roughness:.6});
 for(const run of BD.runs){
  const L=mm(runLength(run)),mid=alongRun(run,runLength(run)/2),wallFace=run.wall==='x'?(run.at<0?-6.86:6.86):-3.99;
  // Out from the wall: the run's own normal (into the shop).
  const out=run.wall==='x'?(run.at<0?1:-1):1;
  const piece=(name,y0,y1,depth,face)=>{
   const g=new THREE.BoxGeometry(L,mm(y1-y0),mm(depth)),mats=face?[wood,wood,wood,wood,face,wood]:cap;
   const m=new THREE.Mesh(g,mats);m.name=name;m.rotation.y=run.yaw;
   const n=wallFace+out*mm(depth)/2;
   if(run.wall==='x')m.position.set(n,mm(y0+y1)/2,mid.z);else m.position.set(mid.x,mm(y0+y1)/2,n);
   room.add(m);return m;
  };
  const faceMat=new THREE.MeshBasicMaterial({map:bandFace(run),toneMapped:false});
  piece('Sakura wall band',BD.board.y0,BD.board.y1,BD.board.face,faceMat);
  piece('Sakura wall band stripe rail',BD.stripe.y0,BD.bead.y0,BD.board.face,wood);
  piece('Sakura wall band bead',BD.bead.y0,BD.bead.y1,BD.board.face+BD.bead.project);
  piece('Sakura wall band cap',BD.cap.y0,BD.cap.y1,BD.board.face+BD.cap.project);
 }
}
export function buildSakuraBand(room){
 buildBand(room);
 // The shop's crest now rides on the till canopy, once, rather than on the counter too.
 buildTillCanopy(room);buildCigaretteRack(room);buildTillFloor(room);
}

/**
 * The till canopy: a hung fascia the length of the counter, white with the konbini's
 * yellow-orange-red stripes and Sakura's round crest in the middle, the way every till
 * in 1997 had its chain's band over it. Tubes underneath (sakura-shell.js buildTubes).
 */
// It stops short of the shop window (the glass is at local z 3.61); it used to run
// 0.37 m out through the pane, a shelf floating over the street.
export const TILL_CANOPY=Object.freeze({x0:4.25,x1:5.25,y0:2.18,y1:2.5,z0:-.02,z1:3.45});
function buildTillCanopy(room){
 const T=TILL_CANOPY,len=T.z1-T.z0,h=T.y1-T.y0;
 const face=sign(2048,Math.round(2048*h/len),(ctx,w,H)=>{
  ctx.fillStyle='#fbf8f0';ctx.fillRect(0,0,w,H);
  const band=H*.17;
  [['#f2c21a',H-band*3],['#f08a1c',H-band*2],['#d7263d',H-band]].forEach(([c,y])=>{ctx.fillStyle=c;ctx.fillRect(0,y,w,band);});
  ctx.fillStyle='#d7263d';ctx.fillRect(0,0,w,H*.05);
  const textY=(H-band*3)*.55;
  signText(ctx,'Tobacco · Stamps · Ferry tickets',w*.2,textY,Math.round(H*.24),'#3a2a1e');
  signText(ctx,'Hot snacks · Oden',w*.8,textY,Math.round(H*.24),'#3a2a1e');
  // The crest: a round badge breaking over the stripes, as the chains' logos did.
  const cx=w/2,cy=H*.5,r=H*.47;
  ctx.fillStyle='#d7263d';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fbf8f0';ctx.beginPath();ctx.arc(cx,cy,r*.86,0,Math.PI*2);ctx.fill();
  // Five petals round a gold heart.
  ctx.fillStyle='#f2a6b8';for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*.3,cy-r*.12+Math.sin(a)*r*.3,r*.2,r*.13,a,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#f2c21a';ctx.beginPath();ctx.arc(cx,cy-r*.12,r*.1,0,Math.PI*2);ctx.fill();
  signText(ctx,'Sakura',cx,cy+r*.5,Math.round(r*.4),'#d7263d');
  signText(ctx,'SAKURA SHOP',cx-w*.11,H*.14+band*.1,Math.round(H*.1),'#fbf8f0');
 });
 const plain=new THREE.MeshStandardMaterial({color:0xf3eee2,roughness:.8});
 const front=new THREE.MeshBasicMaterial({map:face,toneMapped:false});
 // BoxGeometry faces: +x, -x, +y, -y, +z, -z. The customer side is -x.
 const box=add(room,new THREE.BoxGeometry(T.x1-T.x0,h,len),[plain,front,plain,plain,plain,plain],(T.x0+T.x1)/2,(T.y0+T.y1)/2,(T.z0+T.z1)/2,'Sakura till canopy');
 return box;
}

/**
 * Cigarettes behind the till, over the medicine boards: a glass-fronted case of packs in
 * rows, every brand in its own colours, the way a konbini sells them from behind the
 * counter. Drawn on one board, so it costs one draw.
 */
function buildCigaretteRack(room){
 // Its top stays under the wall band's stripe (sakura-band.js wallClear 2470).
 const z0=.6,z1=3.5,y0=2.14,y1=2.43,x=6.8;
 const packs=['#f4f1ea|#1e3c8c','#ffffff|#c8102e','#1d1d1d|#d4af37','#f4f1ea|#2e7d32','#2a4a8a|#f4f1ea','#f2e6c8|#7a3b1a','#e8e8e8|#5b6dc1','#c8102e|#ffffff','#f4f1ea|#e07a10','#0f5132|#f4f1ea','#ffffff|#3a7fc0','#3b2b6a|#e8d48a'];
 const tex=sign(2048,256,(ctx,w,H)=>{
  ctx.fillStyle='#ece6d8';ctx.fillRect(0,0,w,H);
  const rows=2,cols=34,pw=w/cols,ph=H/rows;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const [bg,fg]=packs[(c*7+r*5)%packs.length].split('|'),x0=c*pw+pw*.14,y0=r*ph+ph*.1,ww=pw*.72,hh=ph*.62;
   ctx.fillStyle=bg;ctx.fillRect(x0,y0,ww,hh);ctx.fillStyle=fg;ctx.fillRect(x0,y0+hh*.36,ww,hh*.2);ctx.fillRect(x0+ww*.3,y0+hh*.08,ww*.4,hh*.16);
   ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.strokeRect(x0,y0,ww,hh);
   // The price strip under each column.
   ctx.fillStyle='#fffdf4';ctx.fillRect(x0,y0+hh+ph*.06,ww,ph*.16);ctx.fillStyle='#2a2a2a';ctx.font=`bold ${Math.round(ph*.12)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(['220','250','230','240','270','300'][(c+r)%6],x0+ww/2,y0+hh+ph*.14);
  }
 });
 const board=add(room,new THREE.PlaneGeometry(z1-z0,y1-y0),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}),x,(y0+y1)/2,(z0+z1)/2,'Sakura cigarette rack');
 board.rotation.y=-Math.PI/2;
 const frame=mat(0x6f553b);
 add(room,new THREE.BoxGeometry(.16,.03,z1-z0+.06),frame,x-.06,y0-.015,(z0+z1)/2,'Sakura cigarette rack');
 add(room,new THREE.BoxGeometry(.16,.03,z1-z0+.06),frame,x-.06,y1+.015,(z0+z1)/2,'Sakura cigarette rack');
 add(room,new THREE.BoxGeometry(.01,y1-y0,z1-z0),new THREE.MeshStandardMaterial({color:0xeef6f6,transparent:true,opacity:.18,roughness:.05,depthWrite:false}),x-.13,(y0+y1)/2,(z0+z1)/2,'Sakura cigarette rack glass');
}

/** Dark green tiles at the till, in front of the counter and behind it, as in a konbini. */
function buildTillFloor(room){
 const tile=.3,tex=sign(256,256,(ctx,w,H)=>{
  ctx.fillStyle='#1f4a3c';ctx.fillRect(0,0,w,H);
  for(const [x,y,c] of [[0,0,'#24564a'],[128,128,'#24564a'],[128,0,'#1c4337'],[0,128,'#1c4337']]){ctx.fillStyle=c;ctx.fillRect(x+4,y+4,120,120);}
  ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(10,10,40,6);ctx.fillRect(138,138,40,6);
 });
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 // Flush in the floor (y 0), which is cut round them: laid 6 mm above it, the two floors fought over 11 m².
 for(const {x0,x1,z0,z1} of SAKURA_TILL_FLOOR){
  const t=tex.clone();t.needsUpdate=true;t.repeat.set((x1-x0)/(tile*2),(z1-z0)/(tile*2));
  const floor=add(room,new THREE.PlaneGeometry(x1-x0,z1-z0),new THREE.MeshStandardMaterial({map:t,roughness:.35}),(x0+x1)/2,0,(z0+z1)/2,'Sakura till floor');
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
 }
}
