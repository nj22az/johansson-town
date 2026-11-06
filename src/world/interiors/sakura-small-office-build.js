import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {BUDGET} from '../../edition.js';
import {HARBOUR_LINE,BUS_DWELL,CROSSING_MINUTES,serviceTime} from '../../people/commuter-schedule.js';
import {sakuraPaperwork,yen} from '../../commerce/paperwork.js';
import {sakuraOpenAt} from '../../commerce/sakura-rota.js';
import {createShopProduct} from '../../commerce/shop-product.js';
import {drawJagabo} from './sakura-life.js';
import {SAKURA_SMALL_OFFICE as SMALL_OFFICE,SMALL_OFFICE_ITEM as I,SMALL_OFFICE_FRIDGE,SMALL_OFFICE_NOTES,SMALL_OFFICE_PHOTOS,SMALL_OFFICE_CALENDAR,SMALL_OFFICE_ROTA,
 SMALL_OFFICE_CHANNELS,OCTOBER_NORMALS,smallOfficeText} from './sakura-small-office.js';

/**
 * Builds Sakura's small office (the data and the reasons are sakura-small-office.js) into the shop's room.
 *
 * Draws: everything fixed is merged after it is built, one mesh for the painted parts (vertex colours) and one for
 * everything printed (the cork board, the calendar, the rota, the ledger's pages, the clock's dial, the rug and the
 * switch share one canvas). What moves keeps its own few meshes: the fridge door and what is behind it (drawn only
 * while it is open), the chair's seat, the lamp's bulb and its pool of light, the TV's screen, the clock's hands and
 * the fairy lights' two circuits. No lights: the lamp's warm pool is painted, the room keeps the shop's lighting.
 */
const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const HAND='"Comic Sans MS","Chalkboard SE","Marker Felt",'+MARU;
const canPaint=()=>typeof document!=='undefined'&&typeof document.createElement==='function';

/** Where everything printed lives on the room's one canvas (2048 × 1024 px). */
export const SMALL_OFFICE_PRINT=Object.freeze({width:2048,height:1024,
 cork:Object.freeze([0,0,768,512]),calendar:Object.freeze([780,0,320,460]),rota:Object.freeze([1110,0,300,400]),
 dial:Object.freeze([1420,0,256,256]),rug:Object.freeze([1690,0,340,340]),ledger:Object.freeze([0,520,600,420]),
 switchFace:Object.freeze([620,520,70,120]),plate:Object.freeze([700,520,256,96])});

/** The ferry board as the community channel shows it, from the town's timetable. */
export function ferryBoardLines(minutes=null){
 const m=Number.isFinite(minutes)?((minutes%1440)+1440)%1440:null,next=m==null?null:HARBOUR_LINE.find(s=>s+BUS_DWELL>m)??HARBOUR_LINE[0];
 return HARBOUR_LINE.map(s=>({time:serviceTime(s),text:'Minato Maru from Kitano-jima',status:m==null?'alongside '+BUS_DWELL+' min':m>=s&&m<s+BUS_DWELL?'ALONGSIDE':s===next?'NEXT':m>s+BUS_DWELL?'arrived':'',next:s===next}));
}
const fit=(ctx,text,size,maxWidth,weight='bold',family=MARU)=>{let s=size;ctx.font=`${weight} ${s}px ${family}`;while(s>8&&ctx.measureText(text).width>maxWidth){s-=1;ctx.font=`${weight} ${s}px ${family}`;}return s;};
const write=(ctx,text,x,y,size,colour,{align='center',weight='bold',family=MARU,max=Infinity}={})=>{ctx.fillStyle=colour;ctx.textAlign=align;ctx.textBaseline='middle';fit(ctx,text,size,max,weight,family);ctx.fillText(text,x,y);};

// ---- the printed canvas -----------------------------------------------------------------------------------------------
function paintCork(ctx,[x0,y0,w,h]){
 ctx.save();ctx.translate(x0,y0);
 ctx.fillStyle='#c19560';ctx.fillRect(0,0,w,h);
 // Cork grain: a fixed lattice of flecks, never a random draw.
 for(let i=0;i<900;i++){const fx=(i*97)%w,fy=(i*61+((i*i)%37))%h;ctx.fillStyle=i%3?'rgba(110,70,35,.16)':'rgba(240,215,170,.18)';ctx.fillRect(fx,fy,3,2);}
 const pin=(px,py,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(px-2,py-2,2,0,Math.PI*2);ctx.fill();};
 const photo=(px,py,turn,draw,caption)=>{ctx.save();ctx.translate(px,py);ctx.rotate(turn);ctx.fillStyle='#ffffff';ctx.fillRect(-72,-84,144,176);draw(-62,-74,124,124);write(ctx,caption,0,72,19,'#3b3f55',{max:130});ctx.restore();pin(px,py-78,'#d7263d');};
 const [sisters,jaga,plant]=SMALL_OFFICE_PHOTOS;
 photo(108,124,-.1,(x,y,pw,ph)=>{ctx.fillStyle='#86cff2';ctx.fillRect(x,y,pw,ph);ctx.fillStyle='#2a8fcc';ctx.fillRect(x,y+82,pw,42);ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(x+98,y+24,15,0,Math.PI*2);ctx.fill();
  for(const [dx,hair] of [[44,'#1c1714'],[80,'#2b1d16']]){ctx.fillStyle='#f3cfae';ctx.beginPath();ctx.arc(x+dx,y+62,15,0,Math.PI*2);ctx.fill();ctx.fillStyle=hair;ctx.beginPath();ctx.arc(x+dx,y+57,16,Math.PI,0);ctx.fill();ctx.fillStyle=dx<60?'#f06ba8':'#7ccc4a';ctx.fillRect(x+dx-14,y+78,28,30);}},sisters.caption);
 photo(286,118,.07,(x,y,pw,ph)=>{ctx.fillStyle='#fff7df';ctx.fillRect(x,y,pw,ph);drawJagabo(ctx,x+62,y+64,.45);},jaga.caption);
 photo(462,140,-.05,(x,y,pw,ph)=>{ctx.fillStyle='#f4ead2';ctx.fillRect(x,y,pw,ph);ctx.fillStyle='#b8693a';ctx.fillRect(x+44,y+88,36,32);ctx.fillStyle='#3f8f46';for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(x+62+Math.cos(i*.9)*24,y+50+Math.sin(i*.9)*20,18,9,i*.9,0,Math.PI*2);ctx.fill();}},plant.caption);
 // The notes, each a square of its colour with the line in a felt-tip hand, wrapped to fit.
 const spots=[[642,108,.08],[620,300,-.07],[200,388,.05],[420,394,-.09]];
 SMALL_OFFICE_NOTES.forEach((n,i)=>{const [px,py,turn]=spots[i];ctx.save();ctx.translate(px,py);ctx.rotate(turn);ctx.fillStyle=n.colour;ctx.fillRect(-92,-74,184,148);ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(-92,-74,184,14);
  ctx.fillStyle='#2b2f45';ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`bold 21px ${HAND}`;
  const words=n.text.split(' '),lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>164&&line){lines.push(line);line=w;}else line=t;}lines.push(line);
  lines.slice(0,5).forEach((l,k)=>ctx.fillText(l,-82,-54+k*25,166));ctx.restore();pin(px,py-66,['#2a8fcc','#ffc93c','#7ccc4a','#f06ba8'][i]);});
 ctx.strokeStyle='#8a6236';ctx.lineWidth=6;ctx.strokeRect(3,3,w-6,h-6);
 ctx.restore();
}
function paintCalendar(ctx,[x0,y0,w,h]){
 const C=SMALL_OFFICE_CALENDAR;ctx.save();ctx.translate(x0,y0);
 ctx.fillStyle='#fbf8ef';ctx.fillRect(0,0,w,h);ctx.fillStyle='#c0392b';ctx.fillRect(0,0,w,78);
 write(ctx,'さくら商事',w/2,30,34,'#fffaf0');write(ctx,'SAKURA TRADING · MINATO',w/2,62,17,'#fffaf0',{max:w-20});
 write(ctx,String(C.month),62,128,58,'#2a2a28');write(ctx,'OCTOBER '+C.year,200,114,22,'#2a2a28');write(ctx,C.era+' '+C.month+'月',200,142,18,'#2a2a28');
 const cell=w/7,top=194;['日','月','火','水','木','金','土'].forEach((d,i)=>write(ctx,d,cell*(i+.5),top-20,18,i===0?'#c0392b':i===6?'#1d4f9a':'#2a2a28'));
 for(let d=1;d<=C.days;d++){const k=d+C.firstWeekday-1,col=k%7,row=Math.floor(k/7),cx=cell*(col+.5),cy=top+16+row*48;
  write(ctx,String(d),cx,cy,20,col===0?'#c0392b':col===6?'#1d4f9a':'#2a2a28',{weight:'normal'});
  // A day can carry two marks (the last Friday's drink round and the month's payments): both are written.
  const marks=C.marks.filter(m=>m.day===d);
  if(marks.length){ctx.strokeStyle='#d7263d';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,15,0,Math.PI*2);ctx.stroke();write(ctx,marks.map(m=>m.text).join(' · '),cx,cy+22,12,'#d7263d',{family:HAND,max:cell-4});}}
 ctx.restore();
}
function paintRota(ctx,[x0,y0,w,h]){
 ctx.save();ctx.translate(x0,y0);ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#2a8fcc';ctx.fillRect(0,0,w,56);write(ctx,'勤務表 · Rota',w/2,22,24,'#ffffff');write(ctx,'Sakura Shōten · October 1997',w/2,45,14,'#e6f3fb',{max:w-16});
 SMALL_OFFICE_ROTA.forEach((r,i)=>{const y=86+i*42;ctx.fillStyle=i>=5?'#fde7ef':'#eef6fb';ctx.fillRect(12,y-18,w-24,36);
  write(ctx,r.day,46,y,20,i>=5?'#b8302a':'#2a2a28',{});write(ctx,r.who,138,y,22,'#2a2a28');write(ctx,r.hours,238,y,17,'#3b3f55',{max:110,weight:'normal'});});
 write(ctx,'Shutter down 20:30',w/2,h-16,15,'#6b6f7a',{weight:'normal'});
 ctx.restore();
}
function paintDial(ctx,[x0,y0,w]){
 ctx.save();ctx.translate(x0,y0);const c=w/2;
 ctx.fillStyle='#fff7df';ctx.fillRect(0,0,w,w);
 ctx.fillStyle='#3b3f55';for(let k=0;k<12;k++){const a=k/12*Math.PI*2;ctx.save();ctx.translate(c+Math.sin(a)*c*.82,c-Math.cos(a)*c*.82);ctx.rotate(a);ctx.fillRect(-3,-(k%3?7:13),6,k%3?14:26);ctx.restore();}
 for(const [n,a] of [[12,0],[3,Math.PI/2],[6,Math.PI],[9,Math.PI*1.5]])write(ctx,String(n),c+Math.sin(a)*c*.6,c-Math.cos(a)*c*.6,30,'#3b3f55');
 // A cat's face: two eyes over the centre, a nose and whiskers.
 ctx.fillStyle='#3b3f55';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(c+s*30,c-30,7,10,0,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#f06ba8';ctx.beginPath();ctx.moveTo(c-7,c+22);ctx.lineTo(c+7,c+22);ctx.lineTo(c,c+31);ctx.fill();
 ctx.strokeStyle='#3b3f55';ctx.lineWidth=2;for(const s of [-1,1])for(const d of [-6,4]){ctx.beginPath();ctx.moveTo(c+s*16,c+28+d*.3);ctx.lineTo(c+s*52,c+24+d);ctx.stroke();}
 ctx.restore();
}
function paintRug(ctx,[x0,y0,w]){
 ctx.save();ctx.translate(x0,y0);const c=w/2,rings=['#fff7df','#a6e57c','#9fd6f0','#ffe28a','#ff9dc6','#f4a259'];
 ctx.fillStyle='#f4a259';ctx.fillRect(0,0,w,w);
 for(let r=rings.length;r>0;r--){ctx.fillStyle=rings[r-1];ctx.beginPath();ctx.arc(c,c,c*r/rings.length,0,Math.PI*2);ctx.fill();}
 // The braid: a dashed stitch round every ring.
 ctx.strokeStyle='rgba(80,50,30,.22)';ctx.lineWidth=3;ctx.setLineDash?.([6,6]);for(let r=1;r<=rings.length;r++){ctx.beginPath();ctx.arc(c,c,c*r/rings.length-3,0,Math.PI*2);ctx.stroke();}ctx.setLineDash?.([]);
 ctx.restore();
}
function paintLedger(ctx,[x0,y0,w,h]){
 const z=sakuraPaperwork().find(p=>p.id==='till-roll');ctx.save();ctx.translate(x0,y0);
 for(const [px,title] of [[0,'売上帳'],[w/2,'10月17日 (金)']]){
  ctx.fillStyle='#fbf6e6';ctx.fillRect(px,0,w/2,h);ctx.strokeStyle='#d98c8c';ctx.lineWidth=1.5;
  for(let y=58;y<h-10;y+=22){ctx.beginPath();ctx.moveTo(px+14,y);ctx.lineTo(px+w/2-14,y);ctx.stroke();}
  for(const cx of [px+190,px+232]){ctx.beginPath();ctx.moveTo(cx,40);ctx.lineTo(cx,h-12);ctx.stroke();}
  write(ctx,title,px+w/4,24,24,'#7a2a2a');
 }
 const rows=z.rows.slice(0,14);rows.forEach(([name,qty,,amount],i)=>{const y=58+i*22-7;
  write(ctx,name,18,y,15,'#2b3a6a',{align:'left',family:HAND,weight:'normal',max:166});write(ctx,String(qty),212,y,15,'#2b3a6a',{family:HAND,weight:'normal'});write(ctx,String(amount),290,y,15,'#2b3a6a',{align:'right',family:HAND,weight:'normal'});});
 const T=z.totals;[['Takings',yen(T.total)],['Tax inside (5%)',yen(T.tax)],['Customers',String(T.customers)],['Float',yen(T.float)],['Drawer',yen(T.drawer)]].forEach(([k,v],i)=>{const y=58+i*30-6;
  write(ctx,k,w/2+18,y,17,'#2b3a6a',{align:'left',family:HAND,weight:'normal'});write(ctx,v,w-18,y,17,'#2b3a6a',{align:'right',family:HAND});});
 write(ctx,'Drawer counted ✓ T.',w*.75,h-40,17,'#b8302a',{family:HAND});
 // The gutter's shadow.
 const g=ctx.createLinearGradient(w/2-20,0,w/2+20,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,'rgba(0,0,0,.18)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(w/2-20,0,40,h);
 ctx.restore();
}
function paintSwitch(ctx,[x0,y0,w,h]){
 ctx.save();ctx.translate(x0,y0);ctx.fillStyle='#f4f1e8';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c9c4b6';ctx.lineWidth=3;ctx.strokeRect(10,14,w-20,h-28);
 ctx.fillStyle='#e9e5d8';ctx.fillRect(14,18,w-28,h-36);ctx.fillStyle='#d6d1c2';ctx.fillRect(14,h/2,w-28,h/2-18);
 ctx.fillStyle='#4fd17a';ctx.fillRect(w/2-4,26,8,4);write(ctx,'照明',w/2,h-8,10,'#6b6f7a');
 ctx.restore();
}
function paintPlate(ctx,[x0,y0,w,h]){
 ctx.save();ctx.translate(x0,y0);ctx.fillStyle='#3b3f55';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ffc93c';ctx.lineWidth=3;ctx.strokeRect(5,5,w-10,h-10);
 write(ctx,'事務所 · Office',w/2,h*.4,32,'#ffffff',{max:w-24});write(ctx,'STAFF ONLY',w/2,h*.76,18,'#ffc93c');ctx.restore();
}
function paintPrints(canvas){
 const ctx=canvas.getContext('2d'),P=SMALL_OFFICE_PRINT;
 paintCork(ctx,P.cork);paintCalendar(ctx,P.calendar);paintRota(ctx,P.rota);paintDial(ctx,P.dial);paintRug(ctx,P.rug);paintLedger(ctx,P.ledger);paintSwitch(ctx,P.switchFace);paintPlate(ctx,P.plate);
}

// ---- the TV ------------------------------------------------------------------------------------------------------------
/** Paints one channel (or the set switched off) on the TV's own 256 × 192 canvas. */
export function paintChannel(ctx,id,{minutes=null,rain=false,blink=true}={}){
 const w=256,h=192;ctx.save();
 if(id==='off'){ctx.fillStyle='#1d2422';ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.ellipse(70,50,60,26,-.4,0,Math.PI*2);ctx.fill();ctx.restore();return;}
 if(id==='ferry'){
  ctx.fillStyle='#0f2a5c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f2c21a';ctx.fillRect(0,0,w,30);
  write(ctx,'入港案内  ARRIVALS',w/2,16,17,'#0f2a5c');write(ctx,'Minato Maru · from Kitano-jima',w/2,44,13,'#cfe2ff',{max:w-16});
  ferryBoardLines(minutes).forEach((l,i)=>{const y=74+i*30;if(l.next){ctx.fillStyle='#24508f';ctx.fillRect(8,y-13,w-16,26);}
   write(ctx,l.time,52,y,22,l.next?'#ffe28a':'#ffffff',{family:'monospace'});write(ctx,l.status||'·',176,y,14,l.status==='ALONGSIDE'?'#7cf09a':l.next?'#ffe28a':'#9fb5d8',{max:140});});
  write(ctx,'Crossing '+CROSSING_MINUTES+' min · alongside '+BUS_DWELL+' min',w/2,h-26,12,'#cfe2ff',{max:w-12});
  write(ctx,'港町有線 12ch',w/2,h-10,11,'#8fa6c8');
 }else if(id==='weather'){
  ctx.fillStyle='#2f78b8';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1d4f86';ctx.fillRect(0,0,w,28);write(ctx,'天気予報  WEATHER',w/2,15,16,'#ffffff');
  // The main island, long and thin from north-east to south-west, and the small islands west of it.
  ctx.fillStyle='#7cc46a';ctx.beginPath();ctx.moveTo(150,40);ctx.quadraticCurveTo(178,60,160,96);ctx.quadraticCurveTo(140,140,104,158);ctx.quadraticCurveTo(96,150,112,128);ctx.quadraticCurveTo(132,96,138,58);ctx.closePath();ctx.fill();
  for(const [x,y,r] of [[70,96,7],[58,120,5],[84,140,4]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  const ix=200,iy=74;
  if(rain){ctx.fillStyle='#e8eef4';for(const [dx,dy,r] of [[-14,0,14],[2,-8,17],[18,2,13]]){ctx.beginPath();ctx.arc(ix+dx,iy+dy,r,0,Math.PI*2);ctx.fill();}ctx.strokeStyle='#bfe0ff';ctx.lineWidth=3;for(const dx of [-14,0,14]){ctx.beginPath();ctx.moveTo(ix+dx,iy+18);ctx.lineTo(ix+dx-5,iy+32);ctx.stroke();}}
  else{ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(ix,iy,16,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffd23f';ctx.lineWidth=3;for(let k=0;k<8;k++){const a=k/8*Math.PI*2;ctx.beginPath();ctx.moveTo(ix+Math.cos(a)*21,iy+Math.sin(a)*21);ctx.lineTo(ix+Math.cos(a)*29,iy+Math.sin(a)*29);ctx.stroke();}}
  write(ctx,rain?'Rain':'Fine',ix,iy+46,16,'#ffffff');
  write(ctx,OCTOBER_NORMALS.high+'°',ix-18,iy+72,20,'#ffb3a0');write(ctx,OCTOBER_NORMALS.low+'°',ix+20,iy+72,20,'#bfe0ff');
  write(ctx,'Ferries: normal service',w/2,h-12,12,'#ffffff',{max:w-12});
 }else if(id==='game'){
  const C=SMALL_OFFICE_CHANNELS.find(c=>c.id==='game');
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#ff9a76');sky.addColorStop(.55,'#ffd3a5');sky.addColorStop(.56,'#3a8fc8');sky.addColorStop(1,'#1f5f94');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#8c8c86';ctx.fillRect(0,128,w,16);ctx.fillStyle='#6f6f6a';for(let x=0;x<w;x+=16)ctx.fillRect(x,128,2,16);
  // The cat, mid-dash along the harbour wall, and the fish it is after.
  ctx.fillStyle='#f2a65a';ctx.fillRect(60,108,30,16);ctx.fillRect(84,98,14,14);ctx.fillRect(84,92,4,6);ctx.fillRect(94,92,4,6);ctx.fillRect(52,104,10,4);
  ctx.fillStyle='#2a2a28';ctx.fillRect(92,102,3,3);ctx.fillStyle='#bfe0ff';ctx.fillRect(150,108,18,8);ctx.fillRect(166,106,6,12);
  write(ctx,C.title,w/2,40,30,'#ffffff',{max:w-16});write(ctx,C.sub,w/2,66,14,'#7a3a1a');
  if(blink)write(ctx,'PRESS START',w/2,166,16,'#ffe28a',{family:'monospace'});
  write(ctx,C.maker,w/2,184,10,'#d8e8f8');
 }
 // Scan lines over every picture: a CRT's.
 ctx.fillStyle='rgba(0,0,0,.14)';for(let y=0;y<h;y+=3)ctx.fillRect(0,y,w,1);
 ctx.restore();
}

// ---- building ----------------------------------------------------------------------------------------------------------
/**
 * @param {THREE.Object3D} room the shop's room group
 * @param {{anchor:Function,action:Function,budget?:object}} options anchor(position,label,fn) registers a prompt
 */
export function buildSakuraSmallOffice(room,{anchor=()=>null,action=()=>{},budget=BUDGET}={}){
 const working=!!budget.machinery,group=new THREE.Group();group.name='Sakura small office';group.userData.edition=working?'linux':'web';room.add(group);
 const palette=new Map(),disposables=[];
 const flat=c=>{if(!palette.has(c))palette.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.75}));return palette.get(c);};
 const mesh=(name,geometry,material,pos,parent=group,rot)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...pos);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 const box=(name,size,pos,c,parent,rot)=>mesh(name,new THREE.BoxGeometry(...size),flat(c),pos,parent,rot);
 const cyl=(name,r1,r2,h,pos,c,parent,rot,seg=16)=>mesh(name,new THREE.CylinderGeometry(r1,r2,h,seg),flat(c),pos,parent,rot);
 const sphere=(name,r,pos,c,parent,scale)=>{const m=mesh(name,new THREE.SphereGeometry(r,12,8),flat(c),pos,parent);if(scale)m.scale.set(...scale);return m;};

 // One canvas for everything printed.
 const P=SMALL_OFFICE_PRINT;let printMat;
 {const canvas=canPaint()?document.createElement('canvas'):null;
  if(canvas){canvas.width=P.width;canvas.height=P.height;paintPrints(canvas);}
  const texture=canvas?new THREE.CanvasTexture(canvas):null;if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;disposables.push(texture);}
  printMat=new THREE.MeshStandardMaterial({map:texture,color:texture?0xffffff:0xe8e0cc,roughness:.9,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});printMat.name='Sakura small office prints';disposables.push(printMat);}
 /** A geometry's UVs squeezed into a region of the canvas. */
 const region=(geometry,[px,py,pw,ph])=>{const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(px+uv.getX(i)*pw)/P.width,1-(py+(1-uv.getY(i))*ph)/P.height);return geometry;};
 /** A print on a wall: yaw turns its face (0 faces +z). */
 const print=(name,[w,h],area,pos,yaw=0,parent=group)=>{const m=mesh(name,region(new THREE.PlaneGeometry(w,h),area),printMat,pos,parent);m.rotation.y=yaw;return m;};

 // ---- the desk, against the east wall, its pedestal at the back ----
 const D=I.desk,[dx,,dz]=D.at,[dw,dh,dd]=D.size,STEEL=0xb7bcb3,LINO=0x8fae94,TRIM=0x596059;
 box('Sakura office desk',[dw,.03,dd],[dx,dh-.015,dz],LINO);
 box('Sakura office desk',[dw+.02,.022,dd+.02],[dx,dh-.041,dz],TRIM);
 const ped={x:dx+.03,z:dz-dd/2+.21,w:dw-.08,d:.4,h:dh-.06};
 box('Sakura office desk',[ped.w,ped.h,ped.d],[ped.x,ped.h/2+.01,ped.z],STEEL);
 [.13,.33,.53].forEach((y,i)=>{box('Sakura office desk drawer',[.012,i===2?.14:.18,ped.d-.04],[ped.x-ped.w/2-.006,y+(i===2?.02:0),ped.z],0xc9cdc4);box('Sakura office desk handle',[.016,.022,.13],[ped.x-ped.w/2-.016,y+(i===2?.07:.06),ped.z],TRIM);});
 box('Sakura office desk',[dw-.08,dh-.06,.02],[dx+.03,(dh-.06)/2+.01,dz+dd/2-.02],STEEL);
 box('Sakura office desk',[.02,.36,dd-.44],[dx+dw/2-.03,dh-.25,dz+.2],STEEL);

 // ---- the sales ledger, open, a pencil in the gutter ----
 const L=I.ledger,[lx,ly,lz]=L.at,top=ly;
 box('Sakura sales ledger',[.31,.012,.43],[lx,top+.006,lz],0x3f6b4f);
 box('Sakura sales ledger',[.29,.006,.41],[lx,top+.015,lz],0xf3ecd8);
 {const g=region(new THREE.PlaneGeometry(.41,.29),P.ledger);g.rotateX(-Math.PI/2);g.rotateY(-Math.PI/2);mesh('Sakura ledger pages',g,printMat,[lx,top+.0195,lz]);}
 cyl('Sakura pencil',.0045,.0045,.17,[lx-.02,top+.024,lz+.012],0xffc93c,group,[0,0,Math.PI/2],6);
 cyl('Sakura pencil',.0046,.0046,.012,[lx+.071,top+.024,lz+.012],0xf07a8a,group,[0,0,Math.PI/2],6);

 // ---- the lamp: base, stem, gooseneck, shade; its bulb and pool switch ----
 const LA=I.lamp,[ax,ay,az]=LA.at,GREEN=0x3f8f5a,head=new THREE.Vector3(lx+.04,ay+.36,lz+.03);
 cyl('Sakura desk lamp',.065,.07,.025,[ax,ay+.0125,az],GREEN);
 cyl('Sakura desk lamp',.01,.01,.2,[ax,ay+.125,az],0x2f4a3a);
 {const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(ax,ay+.22,az),new THREE.Vector3(ax-.02,ay+.34,az-.04),new THREE.Vector3(ax-.12,ay+.42,az-.12),new THREE.Vector3(head.x+.05,head.y+.06,head.z+.03),new THREE.Vector3(head.x,head.y+.035,head.z)]);
  mesh('Sakura desk lamp',new THREE.TubeGeometry(curve,24,.009,6),flat(0x2f4a3a),[0,0,0]);}
 const shade=mesh('Sakura desk lamp shade',new THREE.ConeGeometry(.07,.1,18,1,true),new THREE.MeshStandardMaterial({color:GREEN,roughness:.6,side:THREE.DoubleSide}),[head.x,head.y,head.z]);shade.rotation.z=-.25;shade.userData.keep=true;disposables.push(shade.material);
 const bulbMat=new THREE.MeshStandardMaterial({color:0xf3efe2,emissive:0xffd890,emissiveIntensity:1.3,roughness:.4});disposables.push(bulbMat);
 const bulb=mesh('Sakura desk lamp bulb',new THREE.SphereGeometry(.026,10,6),bulbMat,[head.x+.01,head.y-.035,head.z]);bulb.userData.keep=true;
 let poolTex=null;
 if(canPaint()){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(255,214,140,1)');g.addColorStop(.55,'rgba(255,190,110,.45)');g.addColorStop(1,'rgba(255,170,90,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);poolTex=new THREE.CanvasTexture(c);poolTex.colorSpace=THREE.SRGBColorSpace;disposables.push(poolTex);}
 const poolMat=new THREE.MeshBasicMaterial({map:poolTex,color:0xffc27a,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});disposables.push(poolMat);
 const pool=mesh('Sakura desk lamp pool',new THREE.PlaneGeometry(.6,.6),poolMat,[lx+.02,top+.031,lz+.02],group,[-Math.PI/2,0,0]);pool.userData.keep=true;pool.renderOrder=3;

 // ---- the things on the desk ----
 const M=I.mug.at;cyl('Sakura mug',.038,.034,.095,[M[0],M[1]+.0475,M[2]],0xf06ba8);cyl('Sakura mug tea',.032,.032,.004,[M[0],M[1]+.097,M[2]],0x8a5a2b);
 mesh('Sakura mug',new THREE.TorusGeometry(.022,.007,6,12,Math.PI),flat(0xf06ba8),[M[0]+.04,M[1]+.05,M[2]],group,[0,0,-Math.PI/2]);
 const T=I.tray.at;[[0xd7263d,.0],[0xffc93c,.075],[0x2a8fcc,.15]].forEach(([c,y])=>{box('Sakura letter tray',[.25,.012,.33],[T[0],T[1]+y+.006,T[2]],c);box('Sakura letter tray',[.25,.04,.012],[T[0],T[1]+y+.02,T[2]-.16],c);box('Sakura letter tray',[.012,.035,.33],[T[0]+.12,T[1]+y+.018,T[2]],c);
  box('Sakura letter tray papers',[.21,.006,.29],[T[0]-.01,T[1]+y+.015,T[2]],0xfbf8ef);});
 for(const [ox,oz] of [[-.11,-.15],[.11,-.15],[-.11,.15],[.11,.15]])box('Sakura letter tray post',[.012,.138,.012],[T[0]+ox,T[1]+.081,T[2]+oz],0x9aa0a6);
 {const pl=I.plush.at,body=sphere('Plush Jaga-bo',.055,[pl[0],pl[1]+.065,pl[2]],0xe8b95c,group,[1,1.2,.9]);void body;
  for(const [oz,oy,r] of [[-.02,.085,.016],[.022,.09,.011]]){sphere('Plush Jaga-bo eye',r,[pl[0]-.048,pl[1]+oy,pl[2]+oz],0xffffff);sphere('Plush Jaga-bo eye',r*.5,[pl[0]-.06,pl[1]+oy-.003,pl[2]+oz],0x1a1a1a);}}
 {const C=I.cactus.at;cyl('Sakura office cactus',.035,.03,.055,[C[0],C[1]+.0275,C[2]],0xf06ba8);mesh('Sakura office cactus',new THREE.CapsuleGeometry(.021,.05,4,8),flat(0x57a52f),[C[0],C[1]+.09,C[2]]);
  mesh('Sakura office cactus',new THREE.CapsuleGeometry(.011,.025,3,6),flat(0x57a52f),[C[0]+.024,C[1]+.1,C[2]],group,[0,0,-.7]);}
 {const R=I.remote.at;box('Sakura TV remote',[.05,.018,.16],[R[0],R[1]+.009,R[2]],0x6b6f7a);box('Sakura TV remote',[.014,.004,.014],[R[0],R[1]+.02,R[2]-.06],0xd7263d);}

 // ---- the chair: a static base, the seat and back swivel ----
 const CH=I.chair,[cx,,cz]=CH.at,seatY=CH.seat;
 for(let k=0;k<5;k++){const a=k/5*Math.PI*2+.3,leg=box('Sakura office chair base',[.26,.03,.035],[cx+Math.cos(a)*.13,.07,cz-Math.sin(a)*.13],0x3b3f45);leg.rotation.y=a;
  sphere('Sakura office chair castor',.024,[cx+Math.cos(a)*.25,.024,cz-Math.sin(a)*.25],0x2a2a2a);}
 cyl('Sakura office chair base',.022,.022,seatY-.12,[cx,.08+(seatY-.12)/2,cz],0x9aa0a6,group,null,10);
 const swivel=new THREE.Group();swivel.name='Sakura office chair seat';swivel.position.set(cx,0,cz);swivel.rotation.y=Math.PI/2;swivel.userData.live=true;swivel.userData.rest=Math.PI/2;group.add(swivel);
 const BLUE=0x7cc3e8;
 box('Sakura office chair',[.46,.07,.44],[0,seatY-.035,0],BLUE,swivel);box('Sakura office chair',[.36,.03,.34],[0,seatY-.085,0],0x3b3f45,swivel);
 box('Sakura office chair',[.04,.24,.03],[0,seatY+.06,-.235],0x3b3f45,swivel,[-.08,0,0]);
 box('Sakura office chair',[.42,.36,.07],[0,seatY+.29,-.25],BLUE,swivel,[-.1,0,0]);

 // ---- the rug, under the castors ----
 {const R=I.rug,g=region(new THREE.CircleGeometry(R.size[0]/2,40),P.rug);mesh('Sakura office rug',g,printMat,[R.at[0],.010,R.at[2]],group,[-Math.PI/2,0,0]);/* 10 mm: a rug's pile, clear of the floor's sheen (4 mm) */}

 // ---- the fridge: hollow, so its door opens on a lit inside ----
 const F=I.fridge,[fx,,fz]=F.at,[fw,fh,fd]=F.size,WHITE=0xeef1ef,x0=fx-fw/2,z1=fz+fd/2;
 box('Sakura office fridge',[fw,.04,fd-.03],[fx,.02,fz-.015],0x4a4f52);
 // The sides and the back stop under the top (it lies on them): run up into it, their tops shared its plane.
 box('Sakura office fridge',[.03,fh-.07,fd-.03],[x0+.015,(fh+.01)/2,fz-.015],WHITE);box('Sakura office fridge',[.03,fh-.07,fd-.03],[fx+fw/2-.015,(fh+.01)/2,fz-.015],WHITE);
 box('Sakura office fridge',[fw,.03,fd-.03],[fx,fh-.015,fz-.015],WHITE);box('Sakura office fridge',[fw-.06,.03,fd-.03],[fx,.055,fz-.015],0xdfe7e8);
 box('Sakura office fridge',[fw-.06,fh-.10,.03],[fx,(fh+.04)/2,fz-fd/2+.015],0xdfe7e8);
 box('Sakura office fridge freezer',[fw-.08,.14,.3],[fx,fh-.11,fz-.07],0xcfd8db);box('Sakura office fridge freezer',[fw-.1,.012,.006],[fx,fh-.13,fz+.081],0x9aa6aa);
 box('Sakura office fridge shelf',[fw-.07,.012,fd-.12],[fx,.42,fz-.03],0xd9e1e2);
 const door=new THREE.Group();door.name='Sakura office fridge door';door.position.set(x0+.005,0,z1-.03+.0175);door.userData.live=true;group.add(door);
 box('Sakura office fridge door',[fw-.01,fh-.05,.035],[(fw-.01)/2,(fh+.05)/2,0],WHITE,door);
 box('Sakura office fridge door',[fw-.07,fh-.14,.012],[(fw-.01)/2,(fh+.05)/2,-.022],0xdfe7e8,door);
 box('Sakura office fridge handle',[.022,.2,.022],[fw-.045,.6,.024],0x9aa6aa,door);
 for(const [mx,my,c] of [[.12,.7,0xf06b9a],[.24,.5,0xffc93c],[.1,.36,0x5ec8f2]])cyl('Fridge magnet',.022,.022,.01,[mx,my,.022],c,door,[Math.PI/2,0,0],12);
 const contents=new THREE.Group();contents.name='Sakura office fridge contents';contents.userData.live=true;contents.visible=false;group.add(contents);
 {const shelfY=.426,floorY=.07;let n=0;
  for(const f of SMALL_OFFICE_FRIDGE)for(let k=0;k<f.count;k++){
   if(f.id==='bento'){box('Sakura office lunch box',[.2,.07,.13],[fx-.04,shelfY+.035,fz-.06],0x2c3e7a,contents);sphere('Sakura office lunch box knot',.022,[fx-.04,shelfY+.075,fz+.0],0x2c3e7a,contents,[1.4,.7,1]);continue;}
   const p=createShopProduct(f.id),size=new THREE.Box3().setFromObject(p).getSize(new THREE.Vector3()),s=Math.min(1,.3/Math.max(.01,size.y));
   const low=new THREE.Box3().setFromObject(p).min.y;p.scale.setScalar(s);p.position.set(x0+.1+n*.12,floorY-low*s+.001,fz-.08);p.name='Sakura office fridge '+f.id;contents.add(p);n++;}}

 // ---- the TV on the fridge, turned to the desk and the door; the console on top ----
 const TV=I.tv,tv=new THREE.Group();tv.name='Sakura office TV';tv.position.set(TV.at[0],TV.at[1],TV.at[2]);tv.rotation.y=TV.yaw;group.add(tv);
 const [tw,th,td]=TV.size,NAVY=0x2f3a5a;
 for(const sx of [-1,1])for(const sz of [-1,1])box('Sakura office TV foot',[.04,.01,.04],[sx*(tw/2-.05),.005,sz*(td/2-.05)],0x1c1f26,tv);
 box('Sakura office TV',[tw,th,td-.02],[0,.01+th/2,-.01],NAVY,tv);
 box('Sakura office TV',[tw-.02,th-.02,.012],[0,.01+th/2,td/2-.014],0x232a40,tv);
 box('Sakura office TV bezel',[.27,.205,.008],[0,.185,td/2-.004],0x15181f,tv);
 for(let k=0;k<4;k++)box('Sakura office TV button',[.022,.012,.006],[-.09+k*.032,.045,td/2-.004],k===0?0xd7263d:0x8a93a8,tv);
 box('Sakura office TV grille',[.06,.03,.004],[.11,.045,td/2-.006],0x15181f,tv);
 for(const s of [-1,1]){const rod=cyl('Sakura office TV aerial',.004,.003,.32,[s*.06,.01+th+.14,-.08],0x9aa0a6,tv,[0,0,s*-.45],6);void rod;}
 const screenCanvas=canPaint()?document.createElement('canvas'):null;if(screenCanvas){screenCanvas.width=256;screenCanvas.height=192;}
 const screenTex=screenCanvas?new THREE.CanvasTexture(screenCanvas):null;if(screenTex){screenTex.colorSpace=THREE.SRGBColorSpace;disposables.push(screenTex);}
 const screenMat=new THREE.MeshBasicMaterial({map:screenTex,color:screenTex?0xffffff:0x1d2422,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});disposables.push(screenMat);
 const screen=mesh('Sakura office TV screen',new THREE.PlaneGeometry(.25,.185),screenMat,[0,.185,td/2+.002],tv);screen.userData.keep=true;
 const CO=I.console;box('Sakura office console',[.24,.06,.18],[0,.01+th+.03,-.02],0xc9ccd0,tv);box('Sakura office console',[.08,.008,.05],[-.05,.01+th+.064,0],0x8a8f96,tv);
 box('Sakura office console button',[.025,.01,.025],[.07,.01+th+.065,.03],0xd7263d,tv);box('Sakura office console pad',[.11,.022,.05],[.02,.01+th+.071,.06],0x8a8f96,tv,[0,.3,0]);void CO;

 // ---- on the walls: the clock, the fairy lights, the cork board, the calendar and rota, the switch ----
 const CL=I.clock,[kx,ky,kz]=CL.at,NAVYC=0x3b3f55;
 cyl('Sakura cat clock',.15,.15,.04,[kx,ky,kz+.02],NAVYC,group,[Math.PI/2,0,0],32);
 for(const s of [-1,1]){const ear=mesh('Sakura cat clock ear',new THREE.ConeGeometry(.055,.09,4),flat(NAVYC),[kx+s*.09,ky+.15,kz+.02]);ear.rotation.z=s*-.35;ear.scale.z=.35;}
 {const g=region(new THREE.CircleGeometry(.13,40),P.dial);mesh('Sakura cat clock dial',g,printMat,[kx,ky,kz+.044]);}
 cyl('Sakura cat clock',.01,.01,.008,[kx,ky,kz+.056],0xf06ba8,group,[Math.PI/2,0,0],10);
 const hands=new THREE.Group();hands.name='Sakura cat clock hands';hands.position.set(kx,ky,kz+.048);hands.userData.live=true;group.add(hands);
 const hand=(len,width,z)=>{const g=new THREE.BoxGeometry(width,len,.003);g.translate(0,len/2-.012,z);const m=new THREE.Mesh(g,flat(0x2b2f45));m.name='Sakura cat clock hand';hands.add(m);return m;};
 const hourHand=hand(.075,.012,0),minuteHand=hand(.108,.008,.004);
 // Fairy lights: three swags along the back wall, the bulbs on two circuits.
 const FA=I.fairy,pins=[4.78,5.43,6.08,6.72],wireY=2.5,wireZ=-3.945,points=[];
 for(let k=0;k<pins.length-1;k++)for(let t=0;t<=1.0001;t+=.1){if(k&&t===0)continue;points.push(new THREE.Vector3(pins[k]+(pins[k+1]-pins[k])*t,wireY-Math.sin(t*Math.PI)*.1,wireZ));}
 mesh('Sakura fairy lights wire',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),60,.003,4),flat(0x2f4a33),[0,0,0]);
 const bulbColours=[0xff6b6b,0xffc93c,0x5ec8f2,0x7ccc4a,0xf06ba8],circuits=[[],[]];
 points.forEach((p,i)=>{if(i===0||i===points.length-1)return;const g=new THREE.SphereGeometry(.017,6,4);g.translate(p.x,p.y-.02,p.z+.016);const c=new THREE.Color(bulbColours[i%5]),n=g.attributes.position.count,rgb=new Float32Array(n*3);for(let j=0;j<n;j++)c.toArray(rgb,j*3);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));circuits[i%2].push(g);});
 const fairy=circuits.map((parts,k)=>{const mat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});disposables.push(mat);const m=new THREE.Mesh(mergeGeometries(parts,false),mat);parts.forEach(g=>g.dispose());m.name='Sakura fairy lights circuit '+(k?'B':'A');m.userData.keep=true;group.add(m);return m;});
 void FA;
 // Cork board on the west wall, facing the desk.
 const CB=I.corkboard,[bx,by,bz]=CB.at;box('Sakura office cork board',[.03,.62,.92],[bx-.005,by,bz],0xc9a46a);print('Sakura office cork board print',[.88,.58],P.cork,[bx+.014,by,bz],Math.PI/2);
 // The calendar and the rota above the desk, on the east wall.
 const CA=I.calendar,RO=I.rota;
 box('Sakura office calendar',[.004,.47,.33],[CA.at[0]-.002,CA.at[1],CA.at[2]],0xf6f1e4);print('Sakura office calendar print',[.32,.46],P.calendar,[CA.at[0]-.008,CA.at[1],CA.at[2]],-Math.PI/2);
 box('Sakura shift rota',[.004,.41,.31],[RO.at[0]-.002,RO.at[1],RO.at[2]],0xf6f1e4);print('Sakura shift rota print',[.3,.4],P.rota,[RO.at[0]-.008,RO.at[1],RO.at[2]],-Math.PI/2);
 const SW=I.switch;box('Sakura office light switch',[.075,.125,.008],[SW.at[0],SW.at[1],SW.at[2]-.004],0xe9e5d8);print('Sakura office light switch face',[.07,.12],P.switchFace,[SW.at[0],SW.at[1],SW.at[2]-.012],Math.PI);

 // The plate over the door, on the shop side: outside the office's group, which is not drawn from the street.
 {const R=SMALL_OFFICE.room.door,mx=(R.from+R.to)/2,plate=new THREE.Group();plate.name='Sakura office door plate';room.add(plate);
  box('Sakura office door plate',[.37,.145,.012],[mx,2.44,R.z+.046],0x2b2f40,plate);print('Sakura office door plate print',[.36,.135],P.plate,[mx,2.44,R.z+.056],0,plate);
  plate.userData.live=true;bake(plate);}
 bake(group);bake(swivel);bake(door);
 for(const m of palette.values())m.dispose();

 // ---- what it does ----------------------------------------------------------------------------------------------------
 const state={lamp:true,fridge:false,channel:SMALL_OFFICE_CHANNELS[0].id,tv:true,fairy:true,rain:false,minutes:null,open:null,spin:0};
 let doorAngle=0,spinFrom=0,spinTime=0,lastBlink=-1,lastSlot=null;
 const DOOR_OPEN=-1.4;
 const drawScreen=(blink=true)=>{if(!screenCanvas)return;paintChannel(screenCanvas.getContext('2d'),state.tv?state.channel:'off',{minutes:state.minutes,rain:state.rain,blink});screenTex.needsUpdate=true;};
 const showLamp=()=>{bulbMat.emissiveIntensity=state.lamp?1.3:0;pool.visible=state.lamp;};
 showLamp();drawScreen();
 const prompts=new Map();
 const say=(key,label)=>{const o=prompts.get(key);if(o?.userData?.hit)o.userData.hit.label=label;};
 const read=(id,extra='')=>()=>action('inspect',I[id].name,smallOfficeText(id)+(extra?'\n\n'+extra:''));
 const fridgeLine=()=>'Inside: '+SMALL_OFFICE_FRIDGE.map(f=>(f.count>1?f.count+' × ':'')+f.name).join(', ')+'.';
 const boardLine=()=>'On the ferry board: '+ferryBoardLines().map(l=>l.time).join(', ')+', the Minato Maru in from Kitano-jima, '+CROSSING_MINUTES+' minutes across.';
 const api={
  group,state,edition:working?'linux':'web',
  toggleLamp(){state.lamp=!state.lamp;showLamp();say('lamp',state.lamp?'Switch off the desk lamp':'Switch on the desk lamp');return state.lamp;},
  toggleFridge(){state.fridge=!state.fridge;say('fridge',state.fridge?'Close the mini fridge':'Open the mini fridge');return state.fridge;},
  nextChannel(){if(!state.tv)state.tv=true;else{const i=SMALL_OFFICE_CHANNELS.findIndex(c=>c.id===state.channel);state.channel=SMALL_OFFICE_CHANNELS[(i+1)%SMALL_OFFICE_CHANNELS.length].id;}drawScreen();return state.channel;},
  spinChair(){spinFrom=swivel.rotation.y;spinTime=0;state.spin=1.6;},
  setWeather(rain){rain=!!rain;if(rain===state.rain)return;state.rain=rain;if(state.channel==='weather')drawScreen();},
  /** The shop's hours: Thuan switches it all off when she locks up, and on when she opens. */
  setHours(minutes){const open=sakuraOpenAt(minutes);if(open===state.open)return;state.open=open;state.lamp=open;state.tv=open;state.fairy=open;if(!open){state.fridge=false;state.channel=SMALL_OFFICE_CHANNELS[0].id;}showLamp();drawScreen();
   say('lamp',state.lamp?'Switch off the desk lamp':'Switch on the desk lamp');say('fridge','Open the mini fridge');},
  tick(time,minutes,dt=1/60){
   if(Number.isFinite(minutes)){
    const m=((minutes%1440)+1440)%1440;hourHand.rotation.z=-((m%720)/720)*Math.PI*2;minuteHand.rotation.z=-((m%60)/60)*Math.PI*2;
    const slot=Math.floor(m/5);if(slot!==lastSlot){lastSlot=slot;state.minutes=m;if(state.channel==='ferry'&&state.tv)drawScreen();}
   }
   // The fridge door eases open and shut; what is inside is drawn only while it is open.
   const target=state.fridge?DOOR_OPEN:0;doorAngle+=(target-doorAngle)*Math.min(1,dt*(state.fridge?5:7));if(Math.abs(target-doorAngle)<.002)doorAngle=target;door.rotation.y=doorAngle;contents.visible=doorAngle<-.05;
   // A spin: two whole turns, slowing, and back at rest facing the desk.
   if(state.spin>0){spinTime+=dt;const t=Math.min(1,spinTime/state.spin),e=1-Math.pow(1-t,3);swivel.rotation.y=spinFrom+e*Math.PI*4;if(t>=1){state.spin=0;swivel.rotation.y=swivel.userData.rest;}}
   // The flasher: the two circuits take turns, softly.
   const a=state.fairy?.55+.45*Math.sin(time*1.7):.12,b=state.fairy?.55-.45*Math.sin(time*1.7):.12;fairy[0].material.color.setScalar(a);fairy[1].material.color.setScalar(b);
   if(state.tv&&state.channel==='game'){const blink=Math.floor(time*1.6)%2;if(blink!==lastBlink){lastBlink=blink;drawScreen(!!blink);}}
  },
  dispose(){for(const d of disposables)d.dispose?.();group.traverse(o=>{if(o.isMesh&&!o.parent?.userData?.sharedAsset)o.geometry?.dispose();});},
 };
 // The film and the audit switch it through the group (the same calls the prompts make).
 group.userData.smallOffice=api;
 // ---- prompts ----
 const reach=(o,r=1.8)=>{if(o){o.userData.reach=r;o.userData.facing=.5;o.userData.smallOffice=true;}return o;};
 const add=(key,at,label,fn,r)=>{const o=reach(anchor(at,label,fn),r);if(o)prompts.set(key,o);return o;};
 add('ledger',[lx-.38,top+.34,lz],'Read Sakura sales ledger',()=>action('shop-ledger'),2);
 if(working){
  add('lamp',[ax-.12,ay+.45,az-.05],'Switch off the desk lamp',()=>api.toggleLamp());
  add('fridge',[fx+.02,.62,z1+.12],'Open the mini fridge',()=>api.toggleFridge());
  add('tv',[TV.at[0]+.05,TV.at[1]+.2,TV.at[2]+.2],'Change the TV channel',()=>api.nextChannel());
  add('chair',[cx,.75,cz+.25],'Spin the swivel chair',()=>api.spinChair());
 }else{
  add('lamp',[ax-.12,ay+.45,az-.05],'Look at the desk lamp',read('lamp'));
  add('fridge',[fx+.02,.62,z1+.12],'Look at the mini fridge',read('fridge',fridgeLine()));
  add('tv',[TV.at[0]+.05,TV.at[1]+.2,TV.at[2]+.2],'Look at the small TV',read('tv',boardLine()));
  add('chair',[cx,.75,cz+.25],'Look at the swivel chair',read('chair'));
 }
 add('corkboard',[bx+.2,by,bz],'Read the cork board',()=>action('inspect',I.corkboard.name,smallOfficeText('corkboard')+'\n\n'+SMALL_OFFICE_NOTES.map(n=>'“'+n.text+'” ('+n.by+')').join('\n')));
 add('calendar',[CA.at[0]-.2,CA.at[1],CA.at[2]],'Look at the calendar',read('calendar','Marked: '+SMALL_OFFICE_CALENDAR.marks.map(m=>m.day+' ('+m.why+')').join('; ')+'.'));
 add('rota',[RO.at[0]-.2,RO.at[1],RO.at[2]],'Read the staff rota',read('rota',SMALL_OFFICE_ROTA.map(r=>r.day+' '+r.who+' '+r.hours).join(' · ')));
 add('clock',[kx,ky,kz+.3],'Look at the cat clock',read('clock'),2.4);
 add('switch',[SW.at[0],SW.at[1],SW.at[2]-.15],'Look at the light switch',read('switch'),1.4);
 return api;

 /** Merges a group's fixed meshes: the flat-coloured ones into one vertex-coloured mesh, the prints into one. */
 function bake(root){
  root.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),flats=new Set(palette.values()),batches=new Map(),drop=[];
  root.traverse(o=>{
   if(!o.isMesh||o.userData.keep)return;
   for(let a=o.parent;a&&a!==root;a=a.parent)if(a.userData.live)return;
   const m=o.material,kind=flats.has(m)?'matte':m===printMat?'print':null;if(!kind)return;
   const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
   if(kind==='matte'){g.deleteAttribute('uv');const n=g.attributes.position.count,rgb=new Float32Array(n*3);for(let i=0;i<n;i++)m.color.toArray(rgb,i*3);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));}
   if(!batches.has(kind))batches.set(kind,[]);batches.get(kind).push(g);drop.push(o);
  });
  for(const o of drop){o.parent.remove(o);o.geometry.dispose();}
  for(const [kind,parts] of batches){
   const material=kind==='matte'?new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75}):printMat;if(kind==='matte')disposables.push(material);
   const merged=new THREE.Mesh(mergeGeometries(parts.map(p=>p.index?p.toNonIndexed():p),false),material);parts.forEach(p=>p.dispose());
   merged.name=root.name+(kind==='matte'?'':' prints');merged.castShadow=false;merged.receiveShadow=true;root.add(merged);
  }
 }
}
