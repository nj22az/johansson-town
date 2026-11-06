import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {satoRamenOpen} from '../sato-ramen-layout.js';

/**
 * Sato Ramen in October 1997, the things that make a lunch counter somebody's.
 *
 * - On the walls: Umineko Beer's poster, the harbour's Hārī boat race, the noodle
 *   maker's calendar at October, three autograph boards (shikishi) from people who ate
 *   here, and Mrs Sato's own note that she shuts on Wednesdays.
 * - On the counter: a condiment set at every pair of stools (white pepper, garlic,
 *   chilli oil, pickled ginger) and a tissue box at each end; the day's bowl on a stand.
 * - Behind it: bowls stacked on the back line.
 * - By the door: the aluminium delivery box (okamochi) she takes to the harbour office.
 * - Closed (outside 11:00-14:00): the 準備中 card in the doorway.
 *
 * Room frame of the shared interior: the shop is x 6.54 (west wall) to 11.4 (east wall),
 * front wall z 3.6; the counter's customer ledge is at the shared service height (z -2.1..-2.4).
 */
const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
export const OKAMOCHI=Object.freeze({x:10.95,z:3.18,w:.46,d:.3,h:.46});
/** [cell, x, y, z, yaw, width, height] */
export const SATO_1997_PRINTS=Object.freeze([
 ['beer',6.55,2.05,-.75,Math.PI/2,.5,.72],
 ['shikishi0',6.55,2.15,.75,Math.PI/2,.27,.3],['shikishi1',6.55,2.15,1.15,Math.PI/2,.27,.3],['shikishi2',6.55,2.15,1.55,Math.PI/2,.27,.3],
 ['hari',11.39,2.05,-.9,-Math.PI/2,.5,.72],
 ['calendar',11.39,2.05,1.2,-Math.PI/2,.46,.66],
 ['note',10.62,1.55,3.59,Math.PI,.26,.2],
]);
const SHEET={w:1024,h:1024},P=[300,430];
const CELLS={beer:[0,0,...P],hari:[300,0,...P],calendar:[600,0,...P],shikishi0:[0,440,256,284],shikishi1:[256,440,256,284],shikishi2:[512,440,256,284],note:[768,440,256,200],board:[0,740,512,200],closed:[512,740,512,256]};

function sheet(){
 const c=document.createElement('canvas');c.width=SHEET.w;c.height=SHEET.h;const ctx=c.getContext('2d');
 const at=(name,draw)=>{const [x,y,w,h]=CELLS[name];ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();draw(ctx,w,h);ctx.restore();};
 const write=(c,s,x,y,size,colour,font=GOTHIC,weight=900,max=280)=>{c.fillStyle=colour;c.font=`${weight} ${size}px ${font}`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y,max);};
 const fade=(c,w,h)=>{c.fillStyle='rgba(255,248,230,.12)';c.fillRect(0,0,w,h);};
 at('beer',(c,w,h)=>{c.fillStyle='#c8102e';c.fillRect(0,0,w,h);c.fillStyle='#f4f1e6';c.fillRect(100,110,100,200);c.fillStyle='#c8102e';c.fillRect(100,150,100,46);c.fillStyle='#8a9aa3';c.fillRect(100,104,100,10);
  write(c,'UMINEKO',150,173,24,'#ffffff');write(c,"乾杯！",w/2,52,46,'#ffffff',MINCHO);write(c,'UMINEKO BEER · ICE COLD',w/2,350,19,'#ffffff',GOTHIC,800);write(c,'Drinking is for adults',w/2,392,14,'#ffd8d8',GOTHIC,700);fade(c,w,h);});
 at('hari',(c,w,h)=>{c.fillStyle='#1d5a8a';c.fillRect(0,0,w,h);c.fillStyle='#4fa3d9';c.fillRect(0,250,w,180);
  // A dragon boat with its rowers.
  c.fillStyle='#c8102e';c.beginPath();c.moveTo(30,250);c.lineTo(270,250);c.lineTo(250,285);c.lineTo(50,285);c.closePath();c.fill();c.fillStyle='#ffd23f';c.beginPath();c.arc(262,238,16,0,Math.PI*2);c.fill();
  c.fillStyle='#1a1a1a';for(let i=0;i<7;i++){c.beginPath();c.arc(70+i*28,238,8,0,Math.PI*2);c.fill();}
  write(c,"ハーリー",w/2,58,52,'#ffffff');write(c,'HARBOUR HĀRĪ BOAT RACE',w/2,330,20,'#ffffff',GOTHIC,900);write(c,'Minato quay · Sun 12 Oct 1997',w/2,364,17,'#ffffff',GOTHIC,700);write(c,'Teams by street · lunch at Sato',w/2,394,15,'#ffd23f',GOTHIC,700);fade(c,w,h);});
 at('calendar',(c,w,h)=>{c.fillStyle='#fbf7ee';c.fillRect(0,0,w,h);c.fillStyle='#e8c879';c.fillRect(0,0,w,140);
  c.strokeStyle='#8a5a22';c.lineWidth=5;for(let i=0;i<6;i++){c.beginPath();c.moveTo(40,40+i*16);c.bezierCurveTo(110,20+i*16,190,60+i*16,260,40+i*16);c.stroke();}
  write(c,"島袋製麺所",w/2,118,26,'#5a3b22',MINCHO);write(c,'OCTOBER 1997',w/2,168,22,'#5a3b22');
  ['S','M','T','W','T','F','S'].forEach((d,i)=>write(c,d,26+i*41,198,15,i===0?'#c8102e':'#555',GOTHIC,800));
  for(let d=1;d<=31;d++){const k=d+2,col=k%7,row=Math.floor(k/7);write(c,String(d),26+col*41,226+row*34,16,col===0?'#c8102e':col===3?'#8a8a8a':'#2a2a2a',GOTHIC,700);}fade(c,w,h);});
 [['A. Kinjō','Okinawa TV'],['The Seagulls','1996 squad'],['K. Shima','enka']].forEach(([who,what],i)=>at('shikishi'+i,(c,w,h)=>{
  c.fillStyle='#c9a24a';c.fillRect(0,0,w,h);c.fillStyle='#fbf6e8';c.fillRect(10,10,w-20,h-20);
  // A big loopy signature in brush, and the dedication.
  c.strokeStyle='#1a1a1a';c.lineWidth=7;c.lineCap='round';c.beginPath();for(let k=0;k<5;k++){const x0=40+k*36;c.moveTo(x0,120);c.bezierCurveTo(x0+30,40,x0+10,190,x0+40,110);}c.stroke();
  write(c,"佐藤さんへ",w/2,40,26,'#c8102e',MINCHO,700);write(c,who,w/2,212,22,'#1a1a1a',GOTHIC,800);write(c,what,w/2,244,16,'#555',GOTHIC,700);}));
 at('note',(c,w,h)=>{c.fillStyle='#fffdf4';c.fillRect(0,0,w,h);c.fillStyle='#2a2a2a';c.font=`700 34px ${MINCHO}`;c.textAlign='center';c.textBaseline='middle';c.fillText("水曜定休",w/2,70);c.font='italic 700 24px serif';c.fillText('Closed Wednesdays',w/2,130);c.font='italic 18px serif';c.fillText('— Sato',w/2+60,170);});
 at('board',(c,w,h)=>{c.fillStyle='#2f3b33';c.fillRect(0,0,w,h);c.strokeStyle='#8a5a32';c.lineWidth=12;c.strokeRect(6,6,w-12,h-12);write(c,"本日のおすすめ",w/2,52,40,'#ffffff',MINCHO,700,480);write(c,"味噌らーめん ¥500",w/2,112,40,'#ffd27a',MINCHO,700,480);write(c,"Today: miso ramen, with corn",w/2,164,22,'#e8f0e8',GOTHIC,700,480);});
 at('closed',(c,w,h)=>{c.fillStyle='#f6efdc';c.fillRect(0,0,w,h);c.strokeStyle='#5a3b22';c.lineWidth=10;c.strokeRect(6,6,w-12,h-12);write(c,"準備中",w/2,104,96,'#2a2018',MINCHO,700,480);write(c,'CLOSED · LUNCH 11:00–14:00',w/2,196,30,'#2a2018',GOTHIC,800,480);});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function printed(name,w,h){
 const [x,y,cw,ch]=CELLS[name],g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*cw)/SHEET.w,1-(y+(1-uv.getY(i))*ch)/SHEET.h);
 return g;
}
function coloured(g,hex){
 const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(a,3));if(g.attributes.uv)g.deleteAttribute('uv');return g;
}
const at=(g,x,y,z,yaw=0)=>{g.rotateY(yaw);g.translate(x,y,z);return g;};

export function buildSatoRamenDressing(room,{anchor,action,collider,layout={}}={}){
 const prints=[],solids=[];
 const box=(w,h,d,x,y,z,hex)=>solids.push(coloured(new THREE.BoxGeometry(w,h,d).translate(x,y,z),hex));
 const cyl=(r,h,x,y,z,hex,rTop=r,seg=10)=>solids.push(coloured(new THREE.CylinderGeometry(rTop,r,h,seg).translate(x,y,z),hex));
 for(const [cell,x,y,z,yaw,w,h] of layout.prints||SATO_1997_PRINTS){
  const out=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(.012);
  prints.push(at(printed(cell,w,h),x+out.x,y,z+out.z,yaw));
 }
 // The condiments, one set between each pair of stools, and a tissue box at each end.
 for(const [x,z] of layout.condiments||[7.45,8.15,8.85,9.55].map(x=>[x,-2.25])){
  cyl(.018,.075,x-.09,FURNITURE_HEIGHTS.serviceCounter+.0375,z,0xf4f1ea,.014);cyl(.02,.005,x-.09,FURNITURE_HEIGHTS.serviceCounter+.078,z,0x9aa0a6);
  cyl(.022,.06,x-.03,FURNITURE_HEIGHTS.serviceCounter+.03,z,0xe9dcc0);
  cyl(.018,.08,x+.03,FURNITURE_HEIGHTS.serviceCounter+.04,z,0xb8321e,.012);
  cyl(.026,.05,x+.09,FURNITURE_HEIGHTS.serviceCounter+.025,z,0xf2a7b4);cyl(.027,.012,x+.09,FURNITURE_HEIGHTS.serviceCounter+.056,z,0xc8102e);
 }
 for(const [x,z] of layout.tissues||[6.85,10.0].map(x=>[x,-2.22]))box(.18,.07,.1,x,FURNITURE_HEIGHTS.serviceCounter+.035,z,0xf2f2ee);
 // The day's bowl, on a little easel at the counter's end.
 {const [x,z]=layout.board||[9.86,-2.1],g=printed('board',.42,.17);g.rotateX(-.25);prints.push(at(g,x,FURNITURE_HEIGHTS.serviceCounter+.11,z,0));box(.02,.18,.02,x,FURNITURE_HEIGHTS.serviceCounter+.08,z-.06,0x5a3b22);}
 // Bowls stacked on the back line, ready for the pass.
 for(const [x,n] of layout.bowls||[[9.9,5],[10.25,4]])for(let k=0;k<n;k++){cyl(.075,.05,x,.897+.025+k*.045,-5.6,0xf4efe6,.09,14);cyl(.091,.006,x,.897+.05+k*.045,-5.6,0xc8102e,.091,14);}
 // The okamochi by the door: an aluminium box with a sliding front and a handle on top.
 const O=layout.okamochi||OKAMOCHI,base=O.y||0;
 box(O.w,O.h,O.d,O.x,base+O.h/2,O.z,0xc9ced2);box(O.w-.04,O.h-.08,.004,O.x,base+O.h/2,O.z-O.d/2-.002,0xb4babf);
 box(.04,.12,.04,O.x-O.w*.30,base+O.h+.06,O.z,0x9aa0a6);box(.04,.12,.04,O.x+O.w*.30,base+O.h+.06,O.z,0x9aa0a6);box(O.w*.60-.04,.03,.04,O.x,base+O.h+.105,O.z,0x9aa0a6);
 if(collider)collider(O.x,O.z,O.w,O.d,.6);
 const group=new THREE.Group();group.name='Sato Ramen 1997 dressing';room.add(group);
 const texture=sheet();
 const posters=new THREE.Mesh(mergeGeometries(prints),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));posters.name='Sato Ramen posters and boards';group.add(posters);
 const props=new THREE.Mesh(mergeGeometries(solids),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45}));props.name='Sato Ramen counter things';group.add(props);
 [...prints,...solids].forEach(g=>g.dispose());
 // Closed: the card hangs in the doorway (the door is at x 9.75 in the front wall).
 const closed=new THREE.Group();closed.name='Sato Ramen closed';group.add(closed);
 if(layout.closed!==false)for(const yaw of [0,Math.PI]){const card=new THREE.Mesh(printed('closed',.5,.25),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));card.position.set(9.75,2.25,3.55+(yaw?.004:-.004));card.rotation.y=yaw;closed.add(card);}
 if(anchor&&action){
  const a=layout.approaches||{};
  anchor(a.autographs||[7.2,1.8,1.15],'Read the autograph boards',()=>action('inspect','Autograph boards','Three shikishi signed to Mrs Sato: a TV presenter from Okinawa TV who came for the Hārī, the 1996 Seagulls squad, and Kayoko Shima, who sang at the harbour hall and had two bowls. Mrs Sato says the singer left a tip in the shape of a crane.'));
  anchor(a.hari||[10.9,1.8,-.9],'Read the Hārī poster',()=>action('inspect','Harbour Hārī boat race','Sunday the 12th. Each street puts a boat in. Sato Ramen feeds the crews afterwards, which Mrs Sato says is how she always wins.'));
  anchor(a.calendar||[10.9,1.8,1.2],'Read the noodle maker’s calendar',()=>action('inspect','Shimabukuro Noodle Works calendar','October 1997. Every Wednesday is crossed through in pencil: she shuts on Wednesdays to make the week’s stock.'));
  anchor(a.beer||[7.1,1.6,-.75],'Read the Umineko poster',()=>action('inspect','Umineko Beer · Kanpai!','A bottle of beer with lunch is ¥400. Mrs Sato serves one per customer before one o’clock and pretends not to count after.'));
  anchor(a.pepper||[9.4,1.3,-1.6],'Add pepper to taste',()=>action('inspect','White pepper','You shake in the white pepper. Mrs Sato watches, says nothing, and slides the garlic over too.'));
  anchor(a.delivery||[O.x-.5,.9,O.z-.5],'Ask about delivery',()=>action('inspect','Okamochi · delivery box','The aluminium box with the sliding front. At noon Mrs Sato carries two bowls in it across to the harbour office, walking very fast and very level. She delivers to the harbour only: “Anywhere else, they can walk.”'));
  anchor(a.today||[9.86,1.4,-1.6],'Read today’s recommendation',()=>action('inspect','Today’s bowl','Miso ramen with butter and corn, ¥500. Mrs Sato’s autumn bowl, on the board from October until the mornings warm up again.'));
 }
 let last=null;
 return {update(minutes){const open=satoRamenOpen(minutes);if(open===last)return;last=open;closed.visible=!open;}};
}
