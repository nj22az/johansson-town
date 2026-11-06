import {SAKURA_FONT,refreshSakuraPrint} from './sakura-print.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {SAKURA_ISLANDS} from './sakura-shell.js';
import {CASH_CORNER,FRONT_ENDCAPS} from './sakura-layout.js';
export {CASH_CORNER};

/**
 * The corners that make Sakura read as a konbini from across the floor.
 *
 * - Aisle cards on the boards at both ends of every gondola, so each aisle says what
 *   it holds before you walk down it.
 * - Posters on the inside of the front windows, facing the shop.
 * - The cash corner on the back wall, between the restroom and the drinks: a Harbour
 *   Bank cash machine under a lit header, and the photo counter's film drop beside it
 *   -- a 1997 konbini developed your holiday film; it did not yet make you coffee.
 *
 * Boxes are merged into one vertex-coloured mesh, and every print comes from one canvas.
 */
const MARU=SAKURA_FONT;

// The print sheet: one canvas, cells by name, each [x,y,w,h] in pixels.
const SHEET={w:2048,h:1024};
const CELLS={
 aisleWest:[0,0,1024,224],aisleMiddle:[1024,0,1024,224],aisleEast:[0,224,1024,224],
 posterLottery:[1024,224,256,360],posterIce:[1280,224,256,360],posterParcel:[1536,224,256,360],posterSummer:[1792,224,256,360],
 endRamen:[1280,600,768,170],endCurry:[256,704,768,170],endCrisps:[1280,790,768,170],
 atmHeader:[0,448,512,128],atmScreen:[512,448,256,192],atmFace:[768,448,256,256],film:[1024,584,256,360],keypad:[0,576,256,256],
};
function sheet(){
 const c=document.createElement('canvas');c.width=SHEET.w;c.height=SHEET.h;
 const draw=ctx=>{
 const at=(name,draw)=>{const [x,y,w,h]=CELLS[name];ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();draw(ctx,w,h);ctx.restore();};
 const text=(s,x,y,size,colour,weight=900)=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${MARU}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y,1000);};
 // Aisle cards: Sakura's stripe along the top, the aisle in Japanese, English under it.
 const aisle=(name,jp,en,colour)=>at(name,(c,w,h)=>{
  c.fillStyle='#fffaf0';c.fillRect(0,0,w,h);
  [['#d7263d',0],['#f08a24',14],['#ffcf3f',28]].forEach(([col,y])=>{c.fillStyle=col;c.fillRect(0,y,w,14);});
  c.fillStyle=colour;c.fillRect(0,h-16,w,16);
  c.fillStyle=colour;c.font=`900 84px ${MARU}`;c.textAlign='center';c.textBaseline='middle';c.fillText(jp,w/2,104,w-60);
  c.fillStyle='#3b3f55';c.font=`800 38px ${MARU}`;c.fillText(en,w/2,170,w-60);
 });
 aisle('aisleWest',"カップ麺・食品",'NOODLES · PANTRY','#c0392b');
 aisle('aisleMiddle',"お菓子",'SNACKS · SWEETS','#e67e22');
 aisle('aisleEast',"日用品",'DAILY GOODS','#2a8fcc');
 // The end-cap headers: the month's pick, as the chains letter them, with the offer.
 const pick=(name,offer,colour)=>at(name,(c,w,h)=>{
  c.fillStyle='#fffaf0';c.fillRect(0,0,w,h);c.fillStyle=colour;c.fillRect(0,0,w,58);
  c.fillStyle='#ffffff';c.font=`900 40px ${MARU}`;c.textAlign='center';c.textBaseline='middle';c.fillText("今月のイチ押し！",w/2,30,w-40);
  c.fillStyle=colour;c.font=`900 50px ${MARU}`;c.fillText(offer,w/2,104,w-40);
  c.fillStyle='#3b3f55';c.font=`800 24px ${MARU}`;c.fillText('PICK OF THE MONTH',w/2,148,w-40);
 });
 pick('endRamen','YUNAGI · 2 for ¥280','#c0392b');
 pick('endCrisps','KOGANE · New flavour','#e67e22');
 pick('endCurry','HINODE curry · ¥50 off','#b8860b');
 // Window posters: four fictional ads of the season.
 const poster=(name,bg,draw)=>at(name,(c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);draw(c,w,h);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=6;c.strokeRect(6,6,w-12,h-12);});
 poster('posterLottery','#c8102e',(c,w,h)=>{
  c.fillStyle='#ffd23f';c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?40:92;c.lineTo(w/2+Math.cos(a)*r,130+Math.sin(a)*r);}c.fill();
  text("宝くじ",w/2,250,58,'#ffffff');text('AUTUMN JUMBO',w/2,300,26,'#ffd23f',800);text('1st prize ¥100,000,000',w/2,334,18,'#ffffff',700);
 });
 // Sakura is the town's supplier (commerce/merchandising.js): the window says so.
 poster('posterIce','#f4f0e4',(c,w,h)=>{
  c.fillStyle='#a76680';c.fillRect(0,0,w,92);text("配達",w/2,48,52,'#ffffff');
  c.fillStyle='#c79a5b';for(const [x,y] of [[-60,170],[0,170],[60,170],[-30,120],[30,120]])c.fillRect(w/2+x-26,y,52,44);
  text('BUSINESS ORDERS',w/2,276,24,'#a76680',800);text('Delivered every morning',w/2,308,18,'#3b3f55',700);
 });
 poster('posterParcel','#f4f0e4',(c,w,h)=>{
  c.fillStyle='#2f6b3a';c.fillRect(0,0,w,92);text("宅配便",w/2,48,52,'#ffffff');
  c.fillStyle='#c79a5b';c.fillRect(w/2-70,140,140,110);c.fillStyle='#a37a44';c.fillRect(w/2-70,186,140,14);
  text('PARCELS SENT HERE',w/2,290,22,'#2f6b3a',800);text('Mainland by next ferry',w/2,322,18,'#3b3f55',700);
 });
 poster('posterSummer','#f7c948',(c,w,h)=>{
  c.fillStyle='#e8553e';c.beginPath();c.arc(w/2,150,70,0,Math.PI*2);c.fill();
  c.fillStyle='#2a8fcc';for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,250+i*14);c.bezierCurveTo(w*.3,236+i*14,w*.6,264+i*14,w,250+i*14);c.lineTo(w,262+i*14);c.bezierCurveTo(w*.6,276+i*14,w*.3,248+i*14,0,262+i*14);c.fill();}
  text("お月見",w/2,52,48,'#8a2c1d');text('MOON VIEWING DUMPLINGS',w/2,330,18,'#8a2c1d',800);
 });
 // The cash machine's prints.
 at('atmHeader',(c,w,h)=>{c.fillStyle='#1f5aa6';c.fillRect(0,0,w,h);c.fillStyle='#ffffff';c.font=`900 72px ${MARU}`;c.textAlign='left';c.textBaseline='middle';c.fillText('ATM',24,66);c.font=`800 28px ${MARU}`;c.fillText('HARBOUR BANK',210,48);c.fillStyle='#bfe0ff';c.font=`700 22px ${MARU}`;c.fillText('Cash · 8:00–21:00',210,88);});
 at('atmScreen',(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2d7fbf');g.addColorStop(1,'#1d4f8a');c.fillStyle=g;c.fillRect(0,0,w,h);text('Welcome',w/2,52,32,'#ffffff',800);c.fillStyle='#ffffff';c.fillRect(30,92,w-60,34);c.fillRect(30,140,w-60,34);text('Withdraw',w/2,109,20,'#1d4f8a',800);text('Balance',w/2,157,20,'#1d4f8a',800);});
 at('atmFace',(c,w,h)=>{c.fillStyle='#d8dde2';c.fillRect(0,0,w,h);c.fillStyle='#3a3f44';c.fillRect(40,40,176,14);c.fillStyle='#6a7076';c.fillRect(40,170,176,30);text('CARD',w/2,26,20,'#3a3f44',800);text('CASH',w/2,150,20,'#3a3f44',800);});
 at('keypad',(c,w,h)=>{c.fillStyle='#b9c0c6';c.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let k=0;k<3;k++){c.fillStyle=r===3&&k===2?'#3a9a4a':r===3&&k===0?'#d9433a':'#f4f6f8';c.fillRect(24+k*72,20+r*58,60,46);}text('1  2  3',w/2,43,26,'#3a3f44',800);});
 at('film',(c,w,h)=>{c.fillStyle='#f2b705';c.fillRect(0,0,w,h);c.fillStyle='#d7263d';c.fillRect(0,0,w,78);text("写真プリント",w/2,40,34,'#ffffff');text('PHOTO PRINTS',w/2,118,26,'#3b2a1a',800);c.fillStyle='#3b2a1a';c.fillRect(48,160,160,22);text('Film in here',w/2,215,20,'#3b2a1a',700);text('Prints in 3 days',w/2,250,20,'#3b2a1a',700);text('24 shots ¥680',w/2,300,26,'#c8102e',900);});
 };
 draw(c.getContext('2d'));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 refreshSakuraPrint(t,draw,'カップ麺・食品お菓子日用品今月のイチ押し！宝くじ配達宅配便お月見写真プリントABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789¥');return t;
}
/** A plane carrying one cell of the sheet. */
function printed(name,w,h){
 const [x,y,cw,ch]=CELLS[name],g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*cw)/SHEET.w,1-(y+(1-uv.getY(i))*ch)/SHEET.h);
 return g;
}
function coloured(geometry,hex){
 const c=new THREE.Color(hex),a=new Float32Array(geometry.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);geometry.setAttribute('color',new THREE.BufferAttribute(a,3));geometry.deleteAttribute('uv');return geometry;
}
const place=(g,x,y,z,yaw=0)=>{g.rotateY(yaw);g.translate(x,y,z);return g;};

export function buildSakuraCorners(room,{anchor,action}={}){
 const prints=[],solids=[];
 const box=(w,h,d,x,y,z,hex,yaw=0)=>solids.push(coloured(place(new THREE.BoxGeometry(w,h,d),x,y,z,yaw),hex));
 // Aisle cards over the cream boards at both ends of each gondola (sakura-shell.js buildIsland).
 for(const [id,cell] of [['west','aisleWest'],['middle','aisleMiddle'],['east','aisleEast']]){
  const R=SAKURA_ISLANDS[id],z0=R.z-R.d/2,z1=R.z+R.d/2;
  // Not where an end cap stands against the gondola: its own back board covers the end.
  const capped=z=>[SAKURA_ISLANDS.endcap,...FRONT_ENDCAPS].some(E=>Math.abs(R.x-E.x)<E.w/2+.1&&Math.abs(z-E.z)<E.d/2+.25);
  if(!capped(z1))prints.push(place(printed(cell,R.w-.12,.25),R.x,1.23,z1+.06,0));
  if(!capped(z0))prints.push(place(printed(cell,R.w-.12,.25),R.x,1.23,z0-.06,Math.PI));
 }
 // The end caps' header boards (sakura-shell.js buildFrontEndcaps), lettered.
 for(const [E,cell] of [[FRONT_ENDCAPS[0],'endRamen'],[FRONT_ENDCAPS[1],'endCrisps']])prints.push(place(printed(cell,E.w-.16,.24),E.x,1.34,E.z-E.d/2+.064,0));
 {const E=SAKURA_ISLANDS.endcap;prints.push(place(printed('endCurry',E.w-.16,.26),E.x,1.36,E.z+E.d/2-.064,Math.PI));}
 // Window posters, taped inside the glass and facing the shop, clear of the magazine rack.
 const glass=3.86;
 for(const [cell,x,y] of [['posterLottery',-1.75,1.62],['posterIce',1.45,1.6],['posterParcel',2.45,1.62],['posterSummer',-6.25,1.66]]){
  prints.push(place(printed(cell,.5,.7),x,y,glass,Math.PI));
  // A plain back, which is what the street sees of a poster taped up inside.
  box(.5,.7,.004,x,y,glass+.004,0xf4f1ea);
 }
 // The cash machine: a steel body with a hooded screen, the card slot, keypad and cash
 // drawer below it, under a lit header. Face to the shop (+z).
 const A=CASH_CORNER.atm,front=A.z+A.d/2;
 box(A.w,A.h,A.d,A.x,A.h/2,A.z,0xc4cbd1);
 box(A.w+.02,.06,A.d+.02,A.x,.03,A.z,0x5b6268);
 box(A.w,.22,.12,A.x,A.h+.11,A.z-A.d/2+.06,0x1f5aa6);
 box(A.w-.08,.04,.2,A.x,1.36,front+.07,0x8e979e);
 box(.03,.22,.2,A.x-A.w/2+.05,1.25,front+.07,0x8e979e);box(.03,.22,.2,A.x+A.w/2-.05,1.25,front+.07,0x8e979e);
 // The shelf for your bag and the counter where the keypad sits, sloping to you.
 box(A.w,.03,.14,A.x,.95,front+.07,0x9aa2a8);// from the machine's face, not 2 cm into it with its sides flush
 prints.push(place(printed('atmHeader',A.w,.2),A.x,A.h+.11,A.z-A.d/2+.121,0));
 {const g=printed('atmScreen',.36,.26);g.rotateX(-.25);prints.push(place(g,A.x,1.2,front+.03,0));}
 {const g=printed('keypad',.22,.16);g.rotateX(-Math.PI/2+.35);prints.push(place(g,A.x+.12,.975,front+.07,0));}
 prints.push(place(printed('atmFace',.2,.2),A.x-.14,.82,front+.002,0));
 // The film drop: a yellow box on legs with its slot and the price on the front.
 const F=CASH_CORNER.film,ff=F.z+F.d/2;
 box(F.w,F.h-.3,F.d,F.x,.3+(F.h-.3)/2,F.z,0xf2b705);
 for(const sx of [-1,1])for(const sz of [-1,1])box(.03,.3,.03,F.x+sx*(F.w/2-.04),.15,F.z+sz*(F.d/2-.04),0x5b6268);
 prints.push(place(printed('film',F.w-.04,F.h-.36),F.x,.3+(F.h-.3)/2,ff+.002,0));
 // At the low till, customer side x < 4.54; the register is shifted south of the clerk.
 // The scanner, change tray and receipt feed belong to sakura-counter-detail.js.
 // Gum and mints on the customer's lip in front of the register: a low tray of small packs.
 box(.06,.025,.4,4.565,FURNITURE_HEIGHTS.serviceCounter+.012,.74,0xe9e4d8);
 [0x2aa36b,0xf0c419,0xe8553e,0x3b7dd8,0xf2f2f2,0x8e44ad,0x2aa36b,0xe8553e].forEach((hex,i)=>box(.045,.03,.042,4.565,FURNITURE_HEIGHTS.serviceCounter+.035,.57+i*.048,hex));
 const group=new THREE.Group();group.name='Sakura corners';room.add(group);
 const signs=new THREE.Mesh(mergeGeometries(prints),new THREE.MeshBasicMaterial({map:sheet(),toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));signs.name='Sakura aisle cards, window posters and cash corner prints';group.add(signs);
 const body=new THREE.Mesh(mergeGeometries(solids),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.1}));body.name='Sakura cash corner';group.add(body);
 [...prints,...solids].forEach(g=>g.dispose());
 if(anchor&&action){
  anchor([A.x,1.25,front+.45],'Use the Harbour Bank cash machine',()=>action('inspect','Harbour Bank · Cash machine',"Harbour Bank's cash machine, new this year. Thuan says the old folks still queue at the post office counter instead, out of habit, and the machine mostly pays the ferry crews on a Friday."));
  anchor([F.x,1.0,ff+.4],'Read the photo-print drop',()=>action('inspect','Photo prints · Film drop','Drop a roll of film in the slot and the prints come back on the Wednesday ferry, three days later. Twenty-four shots for ¥680. The envelope has a little window so you can check they are yours.'));
 }
 return group;
}
