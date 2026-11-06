import {STORE_BRANDS} from './brands.js';
import {PRODUCTS,PRODUCT_BY_ID} from './products-data.js';
import {drawJagabo} from '../world/interiors/sakura-life.js';

/**
 * Packaging you can read: the front and back of every line Sakura sells, drawn large.
 *
 * On the shelf a pack is a thumbnail in a shared atlas, which is right for forty of them
 * across an aisle and wrong for one held up to the eye. Picked up (item-viewer.js), each
 * line gets its own pack drawn here at full size: the brand's wordmark and its Japanese
 * name, the line, an illustration of what is inside, the net weight and a flash or two on
 * the front; on the back the ingredients, a nutrition panel, the maker's address on the
 * island, a JAN barcode and the recycling mark. All of it is drawn, nothing is fetched,
 * and every brand is fictional (brands.js).
 */
export const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
export const GOTHIC='"Hiragino Kaku Gothic ProN","Noto Sans CJK JP","Yu Gothic",sans-serif';

/**
 * What each line is, as a pack: its shape and size in metres, its weight, its flash and what the illustration shows
 * (data/studio/products.json; a few packs list a shape or size here that the shelf does not build, kept as they were
 * in pack.declared until the creator decides: see avatar-creator/docs/STUDIO-MCP.md).
 */
export const PACKS=Object.freeze(Object.fromEntries(PRODUCTS.filter(p=>p.cells.price!=null).sort((a,b)=>a.cells.price-b.cells.price).concat(PRODUCTS.filter(p=>p.cells.price==null))
 .map(({id,pack:k})=>[id,{shape:k.declared?.shape??k.shape,size:[...(k.declared?.size??k.size)],net:k.net,flash:k.flash,art:k.art,tag:k.tag}])));

const brandFor=id=>STORE_BRANDS[id==='bun'?'buns':id]||STORE_BRANDS.stock;

function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function text(ctx,s,x,y,size,colour,{font=MARU,weight='bold',align='center',base='middle',stroke=null,strokeWidth=0,maxWidth}={}){
 ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline=base;
 if(stroke){ctx.lineJoin='round';ctx.strokeStyle=stroke;ctx.lineWidth=strokeWidth;ctx.strokeText(s,x,y,maxWidth);}
 ctx.fillStyle=colour;ctx.fillText(s,x,y,maxWidth);
}
const circle=(ctx,x,y,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
const ellipse=(ctx,x,y,rx,ry,a,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,a,0,Math.PI*2);ctx.fill();};
/** A deterministic random source, so a pack is drawn the same way every time. */
function rng(seed){let a=seed>>>0||1;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const seedOf=id=>[...id].reduce((n,c)=>n*31+c.charCodeAt(0),7);

/** A starburst flash: 新発売, 増量, the flavour. */
function burst(ctx,x,y,r,fill,label,colour='#fff',size=r*.42){
 ctx.fillStyle=fill;ctx.beginPath();
 for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,rr=i%2?r*.78:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}
 ctx.closePath();ctx.fill();
 const lines=String(label).split('\n');lines.forEach((l,i)=>text(ctx,l,x,y+(i-(lines.length-1)/2)*size*1.1,size,colour));
}

/** The illustration of what is inside, in a square of side s centred on x,y. */
function illustrate(ctx,art,x,y,s,brand,id){
 const R=rng(seedOf(id));ctx.save();ctx.translate(x,y);
 const u=s/2;
 const bowl=(fill,rim,inside)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(0,u*.1,u*.85,u*.25,0,0,Math.PI);ctx.lineTo(-u*.85,u*.1);ctx.bezierCurveTo(-u*.8,u*.85,u*.8,u*.85,u*.85,u*.1);ctx.fill();ellipse(ctx,0,u*.1,u*.85,u*.25,0,rim);ellipse(ctx,0,u*.1,u*.76,u*.2,0,inside);};
 switch(art){
  case 'chips':{
   for(let i=0;i<9;i++){const a=R()*Math.PI,px=(R()-.5)*u*1.3,py=(R()-.3)*u*.9,r=u*(.3+R()*.14);
    ellipse(ctx,px,py,r,r*.78,a,'#e9b44c');ellipse(ctx,px-r*.12,py-r*.12,r*.72,r*.52,a,'#f6d27a');
    for(let k=0;k<3;k++)circle(ctx,px+(R()-.5)*r,py+(R()-.5)*r*.6,r*.05,'#c98a2c');}
   break;}
  case 'crackers':{
   for(let i=0;i<5;i++){const px=(i%3-1)*u*.62,py=(Math.floor(i/3)-.4)*u*.7,r=u*.34;circle(ctx,px,py,r,'#a8672e');circle(ctx,px-r*.1,py-r*.1,r*.86,'#c98443');
    ctx.fillStyle='#16241c';ctx.fillRect(px-r*.9,py-r*.22,r*1.8,r*.44);for(let k=0;k<6;k++)circle(ctx,px+(R()-.5)*r*1.2,py+(R()-.5)*r*1.2,r*.04,'#7b4a22');}
   break;}
  case 'biscuit':{
   for(let i=0;i<4;i++){const px=(i%2-.5)*u*.9,py=(Math.floor(i/2)-.5)*u*.9,w=u*.78;ctx.save();ctx.translate(px,py);ctx.rotate((R()-.5)*.3);
    ctx.fillStyle='#d8a050';ctx.fillRect(-w/2,-w/2,w,w);ctx.fillStyle='#e9bd6d';ctx.fillRect(-w/2+6,-w/2+6,w-12,w-12);
    for(let a=0;a<3;a++)for(let b=0;b<3;b++)circle(ctx,(a-1)*w*.26,(b-1)*w*.26,w*.035,'#b37a35');ctx.restore();}
   break;}
  case 'chocolate':{
   ctx.fillStyle='#4a1f14';ctx.fillRect(-u*.95,-u*.6,u*1.9,u*1.2);
   for(let a=0;a<6;a++)for(let b=0;b<3;b++){ctx.fillStyle='#6a2e1d';ctx.fillRect(-u*.9+a*u*.3,-u*.55+b*u*.37,u*.27,u*.33);ctx.fillStyle='#7d3a25';ctx.fillRect(-u*.88+a*u*.3,-u*.53+b*u*.37,u*.2,u*.06);}
   ctx.fillStyle='#e9d9a8';ctx.beginPath();ctx.moveTo(u*.95,-u*.6);ctx.lineTo(u*.2,-u*.6);ctx.lineTo(u*.95,u*.3);ctx.fill();
   break;}
  case 'candy':{
   const cols=['#e8414a','#f6a623','#7cc242','#9b5bd4','#f7d23e'];
   for(let i=0;i<7;i++){const px=(R()-.5)*u*1.4,py=(R()-.5)*u*1.1,r=u*.2,c=cols[i%cols.length];
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(px-r*1.9,py-r*.6);ctx.lineTo(px-r,py);ctx.lineTo(px-r*1.9,py+r*.6);ctx.fill();ctx.beginPath();ctx.moveTo(px+r*1.9,py-r*.6);ctx.lineTo(px+r,py);ctx.lineTo(px+r*1.9,py+r*.6);ctx.fill();
    circle(ctx,px,py,r,c);circle(ctx,px-r*.35,py-r*.35,r*.25,'rgba(255,255,255,.7)');}
   break;}
  case 'curry':{
   ellipse(ctx,0,u*.15,u*.95,u*.52,0,'#f4f1e6');ellipse(ctx,0,u*.12,u*.85,u*.44,0,'#ffffff');
   ctx.fillStyle='#fbfaf3';ctx.beginPath();ctx.ellipse(-u*.28,u*.05,u*.42,u*.3,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#8a4a1a';ctx.beginPath();ctx.ellipse(u*.25,u*.15,u*.55,u*.3,0,0,Math.PI*2);ctx.fill();
   for(let i=0;i<7;i++){const px=u*(.05+R()*.5),py=u*(.05+R()*.2);ctx.fillStyle=i%3?'#e98a2c':'#e8d8a0';ctx.fillRect(px,py,u*.11,u*.09);}
   ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=u*.03;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-u*.1+i*u*.2,-u*.25);ctx.bezierCurveTo(-u*.2+i*u*.2,-u*.45,u*0+i*u*.2,-u*.55,-u*.1+i*u*.2,-u*.75);ctx.stroke();}
   break;}
  case 'noodles':{
   bowl('#b8322a','#f3e3c3','#d79a4e');
   ctx.strokeStyle='#f2d38a';ctx.lineWidth=u*.035;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(-u*.6,u*.05+i*u*.03);ctx.bezierCurveTo(-u*.2,-u*.05+i*u*.03,u*.1,u*.2+i*u*.02,u*.6,u*.05+i*u*.03);ctx.stroke();}
   ellipse(ctx,-u*.3,0,u*.17,u*.11,0,'#fff');ellipse(ctx,-u*.3,0,u*.08,u*.06,0,'#f3b223');
   circle(ctx,u*.32,0,u*.12,'#fdf7f2');ctx.strokeStyle='#e86a8a';ctx.lineWidth=u*.025;ctx.beginPath();ctx.arc(u*.32,0,u*.06,0,Math.PI*1.6);ctx.stroke();
   ctx.fillStyle='#173222';ctx.fillRect(u*.02,-u*.42,u*.18,u*.42);
   ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=u*.03;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-u*.2+i*u*.2,-u*.2);ctx.bezierCurveTo(-u*.3+i*u*.2,-u*.4,-u*.1+i*u*.2,-u*.5,-u*.2+i*u*.2,-u*.7);ctx.stroke();}
   break;}
  case 'soup':{
   bowl('#5a2a1a','#2a140b','#b9783c');
   for(let i=0;i<6;i++){ctx.fillStyle='#f8f4e6';ctx.fillRect((R()-.5)*u*1.0,(R()-.2)*u*.2,u*.12,u*.12);}
   for(let i=0;i<8;i++)circle(ctx,(R()-.5)*u*1.1,u*(R()*.25),u*.03,'#5fae3a');
   break;}
  case 'tuna':{
   ctx.fillStyle='#4d7f99';ctx.beginPath();ctx.ellipse(0,0,u*.8,u*.3,0,0,Math.PI*2);ctx.fill();
   ctx.beginPath();ctx.moveTo(u*.7,0);ctx.lineTo(u*1.0,-u*.32);ctx.lineTo(u*1.0,u*.32);ctx.fill();
   ctx.fillStyle='#c8d9e0';ctx.beginPath();ctx.ellipse(-u*.05,u*.1,u*.65,u*.14,0,0,Math.PI);ctx.fill();
   circle(ctx,-u*.55,-u*.06,u*.06,'#fff');circle(ctx,-u*.55,-u*.06,u*.03,'#111');
   ctx.fillStyle='#e8a8a0';ctx.fillRect(-u*.7,u*.45,u*1.4,u*.22);ctx.fillStyle='#f2c8b8';for(let i=0;i<6;i++)ctx.fillRect(-u*.65+i*u*.23,u*.48,u*.14,u*.16);
   break;}
  case 'peaches':{
   for(const [px,py] of [[-u*.32,u*.1],[u*.32,u*.05]]){circle(ctx,px,py,u*.38,'#f5b28c');circle(ctx,px-u*.08,py-u*.08,u*.3,'#fbd0ae');circle(ctx,px,py+u*.02,u*.11,'#d9785a');}
   ctx.fillStyle='#4f8a3c';ctx.beginPath();ctx.ellipse(-u*.05,-u*.48,u*.24,u*.09,-.5,0,Math.PI*2);ctx.fill();
   break;}
  case 'soy':{
   ctx.fillStyle='#5a2016';ctx.beginPath();ctx.moveTo(0,-u*.8);ctx.bezierCurveTo(u*.55,-u*.1,u*.5,u*.6,0,u*.6);ctx.bezierCurveTo(-u*.5,u*.6,-u*.55,-u*.1,0,-u*.8);ctx.fill();
   ellipse(ctx,-u*.15,u*.05,u*.08,u*.18,.3,'rgba(255,255,255,.35)');
   // The turtle of 亀じるし.
   ctx.translate(0,u*.95);ellipse(ctx,0,0,u*.36,u*.2,0,'#3b6b3a');circle(ctx,u*.42,-u*.02,u*.1,'#3b6b3a');for(const sx of [-1,1])for(const sy of [-1,1])ellipse(ctx,sx*u*.25,sy*u*.18,u*.07,u*.05,0,'#3b6b3a');
   ctx.strokeStyle='#cfe1b0';ctx.lineWidth=u*.02;ctx.beginPath();ctx.ellipse(0,0,u*.2,u*.1,0,0,Math.PI*2);ctx.stroke();
   break;}
  case 'rice':{
   ctx.fillStyle='#fbfaf4';ctx.beginPath();ctx.moveTo(0,-u*.75);ctx.quadraticCurveTo(u*.85,u*.55,u*.6,u*.62);ctx.lineTo(-u*.6,u*.62);ctx.quadraticCurveTo(-u*.85,u*.55,0,-u*.75);ctx.fill();
   ctx.fillStyle='#14251a';ctx.fillRect(-u*.5,u*.08,u*1.0,u*.54);
   circle(ctx,0,-u*.12,u*.17,'#b8303c');circle(ctx,-u*.05,-u*.17,u*.05,'#e66a76');
   for(let i=0;i<20;i++)ellipse(ctx,(R()-.5)*u*.8,(R()-.6)*u*.6,u*.03,u*.018,R()*3,'#eceadf');
   break;}
  case 'bun':{
   ellipse(ctx,0,u*.15,u*.8,u*.55,0,'#f6efe2');ellipse(ctx,-u*.15,0,u*.5,u*.32,0,'#fffaf0');
   ctx.strokeStyle='#e5d6bb';ctx.lineWidth=u*.03;for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ctx.beginPath();ctx.moveTo(0,-u*.25);ctx.quadraticCurveTo(Math.cos(a)*u*.3,-u*.1+Math.sin(a)*u*.15,Math.cos(a)*u*.55,u*.05+Math.sin(a)*u*.3);ctx.stroke();}
   ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=u*.035;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-u*.25+i*u*.25,-u*.45);ctx.bezierCurveTo(-u*.35+i*u*.25,-u*.6,-u*.15+i*u*.25,-u*.7,-u*.25+i*u*.25,-u*.88);ctx.stroke();}
   break;}
  case 'bread':{
   for(let i=0;i<3;i++){const px=(i-1)*u*.36,py=u*.05;ctx.fillStyle='#c98a43';ctx.beginPath();ctx.roundRect(px-u*.36,py-u*.55,u*.72,u*1.0,[u*.3,u*.3,u*.05,u*.05]);ctx.fill();
    ctx.fillStyle='#fbf2dc';ctx.beginPath();ctx.roundRect(px-u*.3,py-u*.48,u*.6,u*.9,[u*.25,u*.25,u*.04,u*.04]);ctx.fill();}
   break;}
  case 'tea':{
   for(let i=0;i<5;i++){ctx.save();ctx.rotate(-.9+i*.45);ellipse(ctx,0,-u*.5,u*.16,u*.42,0,i%2?'#4f8a3c':'#6aa84f');ctx.strokeStyle='#2f5a24';ctx.lineWidth=u*.02;ctx.beginPath();ctx.moveTo(0,-u*.1);ctx.lineTo(0,-u*.85);ctx.stroke();ctx.restore();}
   ellipse(ctx,0,u*.45,u*.42,u*.12,0,'#d9e8c8');ctx.fillStyle='#e9e4d2';ctx.beginPath();ctx.moveTo(-u*.42,u*.45);ctx.lineTo(-u*.32,u*.85);ctx.lineTo(u*.32,u*.85);ctx.lineTo(u*.42,u*.45);ctx.fill();ellipse(ctx,0,u*.45,u*.36,u*.09,0,'#8fbf5a');
   break;}
  case 'coffee':{
   for(let i=0;i<7;i++){const px=(R()-.5)*u*1.3,py=(R()-.2)*u*.8,a=R()*3;ellipse(ctx,px,py,u*.18,u*.12,a,'#5a3220');ctx.strokeStyle='#2c160b';ctx.lineWidth=u*.025;ctx.beginPath();ctx.ellipse(px,py,u*.12,u*.02,a,0,Math.PI*2);ctx.stroke();}
   drawGull(ctx,0,-u*.55,u*.5,brand.ink);
   break;}
  case 'beer':{
   for(const sx of [-1,1]){ctx.save();ctx.translate(sx*u*.45,u*.2);ctx.rotate(sx*.25);ctx.strokeStyle='#b88a2c';ctx.lineWidth=u*.03;ctx.beginPath();ctx.moveTo(0,u*.6);ctx.lineTo(0,-u*.5);ctx.stroke();for(let k=0;k<6;k++){ellipse(ctx,-u*.07,-u*.4+k*u*.13,u*.07,u*.11,-.5,'#e8bb52');ellipse(ctx,u*.07,-u*.34+k*u*.13,u*.07,u*.11,.5,'#e8bb52');}ctx.restore();}
   drawGull(ctx,0,-u*.25,u*.7,brand.ink);
   break;}
  case 'cola':case 'soda':case 'water':case 'orange':{
   const liquid={cola:'#3a1a12',soda:'#bfe6e8',water:'#bfe2ea',orange:'#f39a2c'}[art];
   ctx.fillStyle=liquid;ctx.beginPath();ctx.moveTo(-u*.9,u*.2);for(let i=0;i<=12;i++)ctx.lineTo(-u*.9+i*u*.15,u*.2+Math.sin(i*1.3)*u*.1);ctx.lineTo(u*.9,u*.9);ctx.lineTo(-u*.9,u*.9);ctx.fill();
   for(let i=0;i<14;i++){const r=u*(.03+R()*.07);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=u*.015;ctx.beginPath();ctx.arc((R()-.5)*u*1.6,(R()-.6)*u*1.3,r,0,Math.PI*2);ctx.stroke();}
   if(art==='orange')for(const [px,py] of [[-u*.3,-u*.3],[u*.35,-u*.35]]){circle(ctx,px,py,u*.3,'#f28a1c');circle(ctx,px-u*.08,py-u*.08,u*.2,'#f7a83e');ellipse(ctx,px+u*.05,py-u*.3,u*.1,u*.05,-.4,'#4f8a3c');}
   if(art==='soda'){circle(ctx,0,-u*.3,u*.22,'rgba(160,220,225,.9)');circle(ctx,-u*.07,-u*.37,u*.07,'#fff');}
   break;}
  case 'milk':{
   ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-u*.35,-u*.5);ctx.lineTo(u*.35,-u*.5);ctx.lineTo(u*.28,u*.7);ctx.lineTo(-u*.28,u*.7);ctx.fill();
   ctx.strokeStyle='#9fc1d6';ctx.lineWidth=u*.03;ctx.stroke();ellipse(ctx,0,-u*.5,u*.35,u*.08,0,'#f7fbff');
   // A Holstein patch or two on the cow beside it.
   ellipse(ctx,u*.62,u*.25,u*.28,u*.2,0,'#fff');ellipse(ctx,u*.68,u*.2,u*.1,u*.07,.3,'#222');ellipse(ctx,u*.52,u*.32,u*.06,u*.05,0,'#222');ellipse(ctx,u*.82,u*.33,u*.08,u*.06,0,'#f2b6b6');
   break;}
  case 'yogurt':case 'pudding':{
   if(art==='pudding'){ctx.fillStyle='#f7d77a';ctx.beginPath();ctx.moveTo(-u*.45,-u*.2);ctx.lineTo(u*.45,-u*.2);ctx.lineTo(u*.65,u*.55);ctx.lineTo(-u*.65,u*.55);ctx.fill();ctx.fillStyle='#8a4a1a';ctx.beginPath();ctx.moveTo(-u*.45,-u*.2);ctx.lineTo(u*.45,-u*.2);ctx.lineTo(u*.38,-u*.38);ctx.lineTo(-u*.38,-u*.38);ctx.fill();ellipse(ctx,0,-u*.38,u*.38,u*.08,0,'#6b3612');ellipse(ctx,0,u*.6,u*.85,u*.12,0,'#f5f1e8');}
   else{ellipse(ctx,0,u*.25,u*.7,u*.35,0,'#fbfbf6');ellipse(ctx,0,u*.15,u*.55,u*.22,0,'#ffffff');for(let i=0;i<5;i++)circle(ctx,(R()-.5)*u*.8,u*(.05+R()*.15),u*.08,'#c43b5a');}
   break;}
  case 'bento':{
   ctx.fillStyle='#1d1d1d';ctx.fillRect(-u*.95,-u*.65,u*1.9,u*1.3);
   const cell=(x0,y0,w,h,draw)=>{ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();draw(x0,y0,w,h);ctx.restore();};
   cell(-u*.9,-u*.6,u*.9,u*1.2,(x0,y0,w,h)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(x0,y0,w,h);for(let i=0;i<30;i++)ellipse(ctx,x0+R()*w,y0+R()*h,u*.025,u*.015,R()*3,'#ecebe2');circle(ctx,x0+w/2,y0+h/2,u*.09,'#b8303c');ctx.fillStyle='#222';for(let k=0;k<12;k++)circle(ctx,x0+R()*w,y0+R()*h,u*.012,'#222');});
   cell(u*.05,-u*.6,u*.85,u*.55,(x0,y0,w,h)=>{ctx.fillStyle='#e8a04a';ctx.fillRect(x0,y0,w,h);for(let i=0;i<3;i++)ellipse(ctx,x0+w*(.25+i*.25),y0+h*.5,w*.14,h*.32,R(),'#c26a24');});
   cell(u*.05,0,u*.42,u*.6,(x0,y0,w,h)=>{ctx.fillStyle='#f3cf4a';ctx.fillRect(x0,y0,w,h);ctx.strokeStyle='#e9b832';ctx.lineWidth=u*.02;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x0,y0+h*(i+.5)/4);ctx.lineTo(x0+w,y0+h*(i+.5)/4);ctx.stroke();}});
   cell(u*.52,0,u*.38,u*.6,(x0,y0,w,h)=>{ctx.fillStyle='#4f8a3c';ctx.fillRect(x0,y0,w,h);for(let i=0;i<4;i++)circle(ctx,x0+R()*w,y0+R()*h,u*.07,'#e8622c');});
   ctx.strokeStyle='#2a2a2a';ctx.lineWidth=u*.03;ctx.strokeRect(-u*.92,-u*.62,u*1.84,u*1.24);
   break;}
  case 'sandwich':{
   ctx.fillStyle='#f6ecd2';ctx.beginPath();ctx.moveTo(-u*.85,u*.55);ctx.lineTo(u*.85,u*.55);ctx.lineTo(0,-u*.7);ctx.fill();
   ctx.fillStyle='#f4d24a';ctx.beginPath();ctx.moveTo(-u*.7,u*.5);ctx.lineTo(u*.7,u*.5);ctx.lineTo(0,-u*.5);ctx.fill();
   for(let i=0;i<12;i++)circle(ctx,(R()-.5)*u*.8,u*(.1+R()*.35),u*.04,'#fbf3c8');
   ctx.strokeStyle='#d8b878';ctx.lineWidth=u*.05;ctx.beginPath();ctx.moveTo(-u*.85,u*.55);ctx.lineTo(u*.85,u*.55);ctx.lineTo(0,-u*.7);ctx.closePath();ctx.stroke();
   break;}
  case 'soap':{
   ctx.fillStyle='#f8c8cf';ctx.beginPath();ctx.roundRect(-u*.6,-u*.3,u*1.2,u*.6,u*.25);ctx.fill();
   for(let i=0;i<8;i++){ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=u*.02;ctx.beginPath();ctx.arc((R()-.5)*u*1.6,(R()-.9)*u*.8,u*(.05+R()*.12),0,Math.PI*2);ctx.stroke();}
   drawFlower(ctx,u*.65,u*.5,u*.28,'#f4a6b8');
   break;}
  case 'detergent':{
   ctx.strokeStyle='#3a7fc0';ctx.lineWidth=u*.14;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,u*.6,Math.PI*.2,Math.PI*1.6);ctx.stroke();
   ctx.strokeStyle='#f39a2c';ctx.lineWidth=u*.08;ctx.beginPath();ctx.arc(0,0,u*.38,Math.PI*1.1,Math.PI*2.4);ctx.stroke();
   for(let i=0;i<10;i++){const r=u*(.05+R()*.1);ctx.fillStyle='rgba(180,220,245,.8)';ctx.beginPath();ctx.arc((R()-.5)*u*1.6,(R()-.5)*u*1.4,r,0,Math.PI*2);ctx.fill();circle(ctx,0,0,0,'#fff');}
   break;}
  case 'tissues':{
   for(let i=0;i<3;i++)drawFlower(ctx,(i-1)*u*.55,(i%2?-.15:.15)*u,u*.32,['#f4a6b8','#c8e0b8','#f7d77a'][i]);
   break;}
  case 'toothpaste':{
   ctx.fillStyle='#e8eef5';ctx.fillRect(-u*.9,-u*.12,u*1.2,u*.24);ctx.fillStyle='#2a6bb8';ctx.fillRect(u*.3,-u*.08,u*.6,u*.16);
   ctx.fillStyle='#fff';for(let i=0;i<10;i++)ctx.fillRect(-u*.85+i*u*.11,-u*.38,u*.06,u*.26);
   ctx.fillStyle='#f6f9fc';ctx.beginPath();ctx.ellipse(-u*.35,-u*.45,u*.42,u*.12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6ac7c0';ctx.lineWidth=u*.04;ctx.beginPath();ctx.moveTo(-u*.75,-u*.45);ctx.bezierCurveTo(-u*.5,-u*.55,-u*.2,-u*.35,u*.05,-u*.45);ctx.stroke();
   break;}
  case 'battery':{
   for(let i=0;i<4;i++){const px=(i-1.5)*u*.36;ctx.fillStyle='#1d2d44';ctx.fillRect(px-u*.14,-u*.7,u*.28,u*1.3);ctx.fillStyle='#e8b23a';ctx.fillRect(px-u*.14,-u*.7,u*.28,u*.38);ctx.fillStyle='#c9ced2';ctx.fillRect(px-u*.06,-u*.8,u*.12,u*.1);text(ctx,'+',px,-u*.5,u*.2,'#1d2d44');}
   ctx.fillStyle='#f6d24a';ctx.beginPath();ctx.moveTo(u*.1,-u*.2);ctx.lineTo(-u*.25,u*.25);ctx.lineTo(0,u*.25);ctx.lineTo(-u*.15,u*.75);ctx.lineTo(u*.3,u*.1);ctx.lineTo(u*.05,u*.1);ctx.closePath();ctx.fill();
   break;}
  case 'notebook':{
   ctx.fillStyle='#fbf8ef';ctx.fillRect(-u*.7,-u*.8,u*1.4,u*1.6);ctx.strokeStyle='#9cb8d0';ctx.lineWidth=u*.012;for(let i=1;i<14;i++){ctx.beginPath();ctx.moveTo(-u*.65,-u*.8+i*u*.115);ctx.lineTo(u*.65,-u*.8+i*u*.115);ctx.stroke();}
   ctx.strokeStyle='#e88a8a';ctx.beginPath();ctx.moveTo(-u*.45,-u*.8);ctx.lineTo(-u*.45,u*.8);ctx.stroke();
   drawWave(ctx,0,u*.4,u*1.2,brand.accent);
   break;}
  case 'postcard':{
   const g=ctx.createLinearGradient(0,-u,0,u);g.addColorStop(0,'#f6c88a');g.addColorStop(.5,'#f3a07a');g.addColorStop(.55,'#3a8fb0');g.addColorStop(1,'#1f5f86');ctx.fillStyle=g;ctx.fillRect(-u,-u*.7,u*2,u*1.4);
   circle(ctx,u*.4,-u*.05,u*.2,'#fbe3b0');ctx.fillStyle='#4a5a50';ctx.beginPath();ctx.moveTo(-u,u*.05);ctx.lineTo(-u*.3,-u*.25);ctx.lineTo(u*.1,u*.05);ctx.fill();
   ctx.fillStyle='#e8e2d0';ctx.fillRect(-u*.85,u*.15,u*1.0,u*.08);ctx.fillStyle='#f6f2e6';ctx.fillRect(u*.1,-u*.15,u*.08,u*.35);ctx.fillStyle='#d7263d';ctx.fillRect(u*.1,-u*.22,u*.08,u*.08);
   drawGull(ctx,-u*.4,-u*.45,u*.35,'#2a2a2a');
   break;}
  default:circle(ctx,0,0,u*.6,brand.accent);
 }
 ctx.restore();
}
/** One of the packs' illustrations in a square of side s centred on x,y (label-art.js draws them in a designed label). */
export function drawArt(ctx,art,x,y,s,brand){illustrate(ctx,art,x,y,s,brand,art);}
function drawGull(ctx,x,y,s,colour){ctx.save();ctx.strokeStyle=colour;ctx.lineWidth=s*.09;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-s*.5,y);ctx.quadraticCurveTo(x-s*.25,y-s*.3,x,y);ctx.quadraticCurveTo(x+s*.25,y-s*.3,x+s*.5,y);ctx.stroke();ctx.restore();}
function drawWave(ctx,x,y,w,colour){ctx.save();ctx.strokeStyle=colour;ctx.lineWidth=w*.05;ctx.lineCap='round';for(let r=0;r<2;r++){ctx.beginPath();for(let i=0;i<=24;i++){const t=i/24;ctx.lineTo(x-w/2+t*w,y+r*w*.1+Math.sin(t*Math.PI*4)*w*.05);}ctx.stroke();}ctx.restore();}
function drawFlower(ctx,x,y,r,colour){for(let k=0;k<5;k++){const a=k/5*Math.PI*2-Math.PI/2;ellipse(ctx,x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,r*.42,r*.3,a,colour);}circle(ctx,x,y,r*.2,'#f6d24a');}
/** A brand's emblem (gull, wave, flower, star, leaf, rice or the sun), size s, centred on x,y. */
export function drawSymbol(ctx,symbol,x,y,s,colour){
 if(symbol==='gull')return drawGull(ctx,x,y,s,colour);
 if(symbol==='wave')return drawWave(ctx,x,y,s,colour);
 if(symbol==='flower')return drawFlower(ctx,x,y,s*.5,colour);
 if(symbol==='star'){ctx.fillStyle=colour;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?s*.2:s*.5;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();return;}
 if(symbol==='leaf'){ellipse(ctx,x,y,s*.18,s*.45,.6,colour);return;}
 if(symbol==='rice'){ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(x,y-s*.45);ctx.lineTo(x+s*.45,y+s*.35);ctx.lineTo(x-s*.45,y+s*.35);ctx.fill();return;}
 // The sun: a disc and its rays.
 ctx.save();ctx.strokeStyle=colour;ctx.lineWidth=s*.06;ctx.lineCap='round';
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*.3,y+Math.sin(a)*s*.3);ctx.lineTo(x+Math.cos(a)*s*.46,y+Math.sin(a)*s*.46);ctx.stroke();}
 ctx.restore();circle(ctx,x,y,s*.22,colour);
}

/** The JAN barcode: 13 digits under 95 modules, as on every pack since the eighties. */
function barcode(ctx,x,y,w,h,id){
 const digits=('49'+String(seedOf(id)).padStart(10,'0')).slice(0,12);
 let sum=0;[...digits].forEach((d,i)=>sum+=+d*(i%2?3:1));const code=digits+((10-sum%10)%10);
 ctx.fillStyle='#fff';ctx.fillRect(x-w*.06,y-h*.08,w*1.12,h*1.3);
 const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
 const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
 const R=L.map(p=>[...p].map(b=>b==='1'?'0':'1').join(''));
 const parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'][+code[0]];
 let bits='101';for(let i=1;i<7;i++)bits+=(parity[i-1]==='L'?L:G)[+code[i]];bits+='01010';for(let i=7;i<13;i++)bits+=R[+code[i]];bits+='101';
 const m=w/bits.length;ctx.fillStyle='#111';
 [...bits].forEach((b,i)=>{if(b==='1'){const guard=i<3||(i>=45&&i<50)||i>=92;ctx.fillRect(x+i*m,y,m*1.02,h*(guard?1:.88));}});
 text(ctx,code[0]+' '+code.slice(1,7)+' '+code.slice(7),x+w/2,y+h*1.05,h*.16,'#111',{font:GOTHIC,weight:'normal'});
}

/** The front of a pack, w×h pixels. */
export function drawFront(id,w=1024,h=1024){
 const brand=brandFor(id),pack=PACKS[id]||{net:'',flash:'',art:id,tag:''};
 const c=canvas(w,h),ctx=c.getContext('2d'),m=Math.min(w,h);
 // The paper, with a faint sheen down it like printed film.
 ctx.fillStyle=brand.paper;ctx.fillRect(0,0,w,h);
 const sheen=ctx.createLinearGradient(0,0,w,0);sheen.addColorStop(0,'rgba(255,255,255,0)');sheen.addColorStop(.35,'rgba(255,255,255,.18)');sheen.addColorStop(.5,'rgba(255,255,255,0)');ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
 // The brand's band across the top and a thin rule at the foot.
 ctx.fillStyle=brand.ink;ctx.fillRect(0,0,w,h*.2);ctx.fillStyle=brand.accent;ctx.fillRect(0,h*.2,w,h*.022);ctx.fillRect(0,h*.965,w,h*.035);
 drawSymbol(ctx,brand.symbol,w*.1,h*.1,m*.12,brand.paper);
 text(ctx,brand.name,w*.55,h*.075,Math.round(m*.1),brand.paper,{font:GOTHIC,maxWidth:w*.78});
 if(brand.jp&&brand.jp.replace(/\s/g,'').toLowerCase()!==brand.name.replace(/\s/g,'').toLowerCase())text(ctx,brand.jp,w*.55,h*.155,Math.round(m*.055),brand.paper,{maxWidth:w*.78});
 // The line's name, big, in the brand's ink with a white keyline, as a printed pack has it.
 text(ctx,brand.line,w*.5,h*.31,Math.round(m*.11),brand.ink,{stroke:'#ffffff',strokeWidth:m*.022,maxWidth:w*.92});
 // What is inside, framed in a window like a photograph on the pack.
 const ix=w*.5,iy=h*.64,is=Math.min(w*.8,h*.5);
 ctx.save();ctx.beginPath();ctx.roundRect(ix-is*.6,iy-is*.5,is*1.2,is,m*.04);
 // A sunlit backdrop behind the food, like the photograph on a real pack.
 const glow=ctx.createRadialGradient(ix,iy-is*.1,is*.05,ix,iy,is*.75);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.55,'rgba(255,246,220,.75)');glow.addColorStop(1,brand.accent+'88');
 ctx.fillStyle=glow;ctx.fill();ctx.clip();
 ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=is*.03;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(ix+Math.cos(a)*is,iy+Math.sin(a)*is);ctx.stroke();}
 illustrate(ctx,pack.art,ix,iy,is*.92,brand,id);ctx.restore();
 if(id==='chips')drawJagabo(ctx,w*.82,h*.78,m*.0016);
 // The flash, the tag line and the weight.
 // Two words go on two lines; the flash is a badge, not a sentence.
 if(pack.flash){const words=pack.flash.split(' '),label=words.length>1?words.slice(0,Math.ceil(words.length/2)).join(' ')+'\n'+words.slice(Math.ceil(words.length/2)).join(' '):pack.flash;
  burst(ctx,w*.17,h*.44,m*.13,brand.accent,label,'#fff',m*Math.min(.04,.3/Math.max(...label.split('\n').map(l=>l.length))));}
 if(pack.tag)text(ctx,pack.tag,w*.5,h*.405,Math.round(m*.045),brand.ink,{maxWidth:w*.6});
 text(ctx,'Net '+pack.net,w*.96,h*.935,Math.round(m*.04),brand.ink,{align:'right',font:GOTHIC});
 return c;
}

/** What the back panel lists as the ingredients (or the contents, for what is not food). */
export const INGREDIENTS=Object.freeze(Object.fromEntries(PRODUCTS.filter(p=>p.pack.back.ingredients!=null).map(p=>[p.id,p.pack.back.ingredients])));
/**
 * What a pack's back panel prints: whether it is food (ingredients, nutrition, a best-before date), the unit its
 * nutrition is given per, its recycling mark, and its ingredients. Anything that is not a product prints as packaging.
 */
export function backPanel(id){
 const back=PRODUCT_BY_ID[id]?.pack.back;
 return back?{food:back.food,unit:back.unit,recycle:back.recycle,ingredients:back.ingredients??undefined}:{food:false,unit:'pack',recycle:'PLA',ingredients:undefined};
}

/**
 * The back: ingredients, nutrition, maker, barcode, recycling mark. `target` is a product's id, or a product record
 * (Johansson Studio's draft of a new line, which World's data does not have yet).
 */
export function drawBack(target,w=1024,h=1024){
 const draft=target&&typeof target==='object'?target:null,id=draft?draft.id:target;
 const brand=draft?draft.brand:brandFor(id),pack=draft?draft.pack:PACKS[id]||{net:''};
 const c=canvas(w,h),ctx=c.getContext('2d'),m=Math.min(w,h),pad=w*.07;
 ctx.fillStyle=brand.paper;ctx.fillRect(0,0,w,h);ctx.fillStyle=brand.ink;ctx.fillRect(0,0,w,h*.1);
 text(ctx,brand.name+' · '+brand.line,w/2,h*.05,Math.round(m*.042),brand.paper,{maxWidth:w*.9});
 // The panel every pack carries, in a ruled white box.
 const bx=pad,by=h*.14,bw=w-pad*2,bh=h*.5;
 text(ctx,'一括表示',bx,by-h*.018,Math.round(m*.026),brand.ink,{align:'left',font:GOTHIC});
 ctx.fillStyle='#fffdf7';ctx.fillRect(bx,by,bw,bh);ctx.strokeStyle='#2a2a2a';ctx.lineWidth=m*.004;ctx.strokeRect(bx,by,bw,bh);
 const back=draft?{...draft.pack.back,ingredients:draft.pack.back.ingredients??undefined}:backPanel(id),food=back.food,rows=[['名称|Product',brand.line],[food?'原材料名|Ingredients':'品名|Contents',back.ingredients||'—'],['内容量|Net',pack.net],[food?'賞味期限|Best before':'製造|Made',food?'See base':'1997'],['保存方法|Storage',food?'Keep cool, dry and out of the sun':'Keep out of reach of children'],['製造者|Maker',brand.name+' Co. · 1-'+(seedOf(id)%40+1)+' Harbour Town, Okinawa']];
 const rh=bh/rows.length,col=bw*.24,fs=Math.round(m*.032);
 rows.forEach(([k,v],i)=>{const y=by+i*rh;if(i){ctx.beginPath();ctx.moveTo(bx,y);ctx.lineTo(bx+bw,y);ctx.stroke();}
  // The key in Japanese as printed, with the English under it in small type.
  const [jp,en]=k.split('|');text(ctx,jp,bx+col/2,y+rh*.4,fs,'#2a2a2a',{font:GOTHIC,maxWidth:col*.92});text(ctx,en,bx+col/2,y+rh*.75,Math.round(fs*.62),'#6a6258',{font:GOTHIC,weight:'normal',maxWidth:col*.92});
  // Long ingredient lists wrap onto a second line.
  ctx.font=`normal ${fs}px ${GOTHIC}`;const max=bw-col-pad*.4;let line=v,rest='';
  // Wrap at a space, so a word is never cut in two.
  while(ctx.measureText(line).width>max&&line.includes(' ')){const at=line.lastIndexOf(' ');rest=line.slice(at+1)+(rest?' '+rest:'');line=line.slice(0,at);}
  text(ctx,line,bx+col+pad*.2,y+rh*(rest?.33:.5),fs,'#2a2a2a',{font:GOTHIC,weight:'normal',align:'left'});
  if(rest)text(ctx,rest,bx+col+pad*.2,y+rh*.7,fs,'#2a2a2a',{font:GOTHIC,weight:'normal',align:'left',maxWidth:max});
 });
 ctx.beginPath();ctx.moveTo(bx+col,by);ctx.lineTo(bx+col,by+bh);ctx.stroke();
 // A nutrition line for food, and a care line for everything else.
 const ny=by+bh+h*.04;
 if(food){
  const R=rng(seedOf(id)+3),kcal=Math.round(40+R()*480);
  text(ctx,'Nutrition (per '+back.unit+')',bx,ny,Math.round(m*.03),brand.ink,{align:'left',font:GOTHIC});
  text(ctx,`Energy ${kcal}kcal · Protein ${(R()*12).toFixed(1)}g · Fat ${(R()*25).toFixed(1)}g · Carbohydrate ${(R()*60).toFixed(1)}g · Sodium ${Math.round(R()*900)}mg`,bx,ny+h*.045,Math.round(m*.026),'#2a2a2a',{align:'left',font:GOTHIC,weight:'normal',maxWidth:bw});
 }else text(ctx,'Read the directions carefully before use.',bx,ny,Math.round(m*.03),brand.ink,{align:'left',font:GOTHIC});
 // The barcode, the recycling mark and the customer line.
 barcode(ctx,w-pad-w*.36,h*.78,w*.36,h*.12,id);
 const rx=pad+m*.07,ry=h*.86;ctx.strokeStyle=brand.ink;ctx.lineWidth=m*.008;ctx.beginPath();ctx.moveTo(rx,ry-m*.06);ctx.lineTo(rx+m*.06,ry+m*.04);ctx.lineTo(rx-m*.06,ry+m*.04);ctx.closePath();ctx.stroke();
 text(ctx,back.recycle,rx,ry+m*.012,Math.round(m*.03),brand.ink,{font:GOTHIC});
 text(ctx,'Customer line 0120-'+String(100+seedOf(id)%900)+'-'+String(1000+seedOf(id)%9000),pad,h*.95,Math.round(m*.026),'#2a2a2a',{align:'left',font:GOTHIC,weight:'normal'});
 return c;
}

/** A side panel: the brand's colour with its name running up it. */
export function drawSide(id,w=256,h=1024){
 const brand=brandFor(id),c=canvas(w,h),ctx=c.getContext('2d');
 ctx.fillStyle=brand.ink;ctx.fillRect(0,0,w,h);ctx.fillStyle=brand.accent;ctx.fillRect(0,h*.82,w,h*.03);
 ctx.save();ctx.translate(w/2,h*.45);ctx.rotate(-Math.PI/2);text(ctx,brand.name,0,0,Math.round(w*.42),brand.paper,{font:GOTHIC,maxWidth:h*.7});ctx.restore();
 drawSymbol(ctx,brand.symbol,w/2,h*.92,w*.5,brand.paper);
 return c;
}
