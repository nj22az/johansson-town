/**
 * Covers and pages for the magazines on Sakura's rack, drawn on canvas.
 *
 * Every cover takes the issue on sale (magazine-issues.js): its headline, number and
 * date are printed on it and its accent colour shifts with the issue, so the rack looks
 * different from one week to the next. The same functions draw the covers into the
 * rack's texture atlas and, larger, into the reader.
 *
 * Inside pages are drawn here too, a few per title: contents, listings, maps, charts,
 * tables. The manga chapters and the gag 4-koma in 週刊少年ハヤブサ, and the poster in
 * 月刊セルアニメ, are
 * drawn by tools/magazines/draw_pages.py and loaded as images; pagesFor() says which.
 */
import {MANGA_PAGES,WEEKDAYS,shortDate} from './magazine-issues.js';

const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const hash=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};

/** Drawing helpers, scaled so the art is authored at 320 x 440 whatever the canvas. */
function pen(ctx,w,h){
 const k=w/320;ctx.save();ctx.scale(k,h/440);
 const t=(s,x,y,size,colour,weight=900,align='center')=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${MARU}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);};
 const fit=(s,x,y,size,colour,max,weight=900,align='center')=>{ctx.font=`${weight} ${size}px ${MARU}`;const m=ctx.measureText(s).width;t(s,x,y,m>max?size*max/m:size,colour,weight,align);};
 const block=(s,x,y,size,colour,max,maxLines=2,weight=800)=>{
  const words=String(s).trim().split(/\s+/);let rows,font=size;
  do{
   ctx.font=`${weight} ${font}px ${MARU}`;rows=[];let line='';
   for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width<=max)line=next;
    else{if(line)rows.push(line);line='';for(const char of word){if(line&&ctx.measureText(line+char).width>max){rows.push(line);line='';}line+=char;}}
   }
   if(line)rows.push(line);if(rows.length>maxLines)font*=.9;
  }while(rows.length>maxLines&&font>.01);
  const gap=font*1.1;rows.forEach((line,i)=>t(line,x,y+(i-(rows.length-1)/2)*gap,font,colour,weight,'left'));
 };
 const rect=(x,y,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh);};
 const ink=(lw=5,c='#17141a')=>{ctx.lineWidth=lw;ctx.strokeStyle=c;};
 const lines=(x,y,ww,rows,gap=11,c='#6e695f',seed=1)=>{for(let r=0;r<rows;r++)rect(x,y+r*gap,ww*(r===rows-1?.55:.9+hash(r,seed)*.1),4,c);};
 const barcode=(x,y,seed)=>{rect(x,y,92,40,'#fff');ctx.fillStyle='#111';let bx=x+6;for(let i=0;i<24&&bx<x+86;i++){const b=hash(i,seed)>.5?3:1.5;ctx.fillRect(bx,y+4,b,26);bx+=b+2;}};
 const done=()=>ctx.restore();
 return {ctx,t,fit,block,rect,ink,lines,barcode,done};
}
/** One accent per issue: the base colour turned round the hue wheel a little each time. */
function accent(hex,variant,turn=38){
 const n=parseInt(hex.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;
 let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
 return `hsl(${(h+variant*turn+360)%360},${Math.round(s*100)}%,${Math.round(l*100)}%)`;
}

// =================================================================== covers
export function drawCover(ctx,title,issue,w=320,h=440){
 const p=pen(ctx,w,h),{t,fit,rect,ink,barcode}=p,v=issue.variant,W=320,H=440;
 const price=(colour='#fff')=>t('¥'+title.price,W-16,H-24,22,colour,800,'right');
 const number=(x,y,colour)=>t(issue.dateLine,x,y,15,colour,800,'left');
 switch(title.kind){
 case 'shonen':{
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,accent('#f8862b',v,24));g.addColorStop(.5,accent('#e8432f',v,24));g.addColorStop(1,'#5a1414');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2,250);ctx.fillStyle='rgba(255,240,150,.28)';for(let a=0;a<24;a++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,400,a*Math.PI/12,a*Math.PI/12+.13);ctx.fill();}ctx.restore();
  // The serial's hero; his pose changes with the chapter.
  ctx.save();ctx.translate(W/2,0);if(v%2)ctx.scale(-1,1);
  ctx.fillStyle='#ffe066';ctx.beginPath();const sp=[[0,180],[-40,95],[-20,170],[-80,130],[-42,200],[-90,215],[-30,235],[30,220],[90,235],[30,200],[82,130],[20,170],[40,95]];ctx.moveTo(...sp[0]);for(const q of sp)ctx.lineTo(...q);ctx.closePath();ctx.fill();ink();ctx.stroke();
  rect(-38,218,76,92,'#ffe2c4');ctx.strokeRect(-38,218,76,92);
  ctx.fillStyle='#17141a';ctx.beginPath();ctx.moveTo(-28,245);ctx.lineTo(-6,256);ctx.lineTo(-28,260);ctx.fill();ctx.beginPath();ctx.moveTo(28,245);ctx.lineTo(6,256);ctx.lineTo(28,260);ctx.fill();
  if(v>=2){ctx.strokeStyle='#3bc4f2';ctx.lineWidth=6;ctx.strokeRect(-110,150,220,190);}
  ctx.restore();
  rect(10,12,W-20,74,'#ffd93b');ink(5);ctx.strokeRect(10,12,W-20,74);t("Boy Hayabusa",W/2,50,42,'#17141a');
  rect(14,94,150,26,'#d42a2a');t(`Weekly ${issue.number}Issue`,89,107,17,'#fff',800);
  fit(issue.sub,W/2,342,30,'#fff',W-30);rect(0,362,W,44,'#1b78c4');fit(issue.head,W/2,384,22,'#fff',W-24,800);
  barcode(14,H-46,1);price();break;}
 case 'games':{
  rect(0,0,W,H,'#10162e');ctx.strokeStyle=accent('#19b8d4',v,50);ctx.lineWidth=2;
  for(let y=200;y<H;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let x=-W;x<W*2;x+=40){ctx.beginPath();ctx.moveTo(W/2,170);ctx.lineTo(x,H);ctx.stroke();}
  rect(0,0,W,84,accent('#ec4899',v,30));t('PLAY★WAVE',W/2,44,40,'#fff');number(14,100,'#9fe8f7');
  ctx.save();ctx.translate(W/2,215);ctx.rotate((v-1.5)*.12);ctx.fillStyle=accent('#3bc4f2',v,70);ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(74,-14);ctx.lineTo(46,62);ctx.lineTo(-46,62);ctx.lineTo(-74,-14);ctx.closePath();ctx.fill();ink(5);ctx.stroke();
  ctx.fillStyle='#ffe066';ctx.beginPath();ctx.arc(-24,-4,11,0,Math.PI*2);ctx.arc(24,-4,11,0,Math.PI*2);ctx.fill();ctx.restore();
  fit(issue.head,W/2,330,30,'#ffe066',W-24);rect(0,360,W,36,'#10b981');fit(issue.sub,W/2,378,19,'#fff',W-24,800);
  barcode(14,H-46,2);price();break;}
 case 'guide':{
  rect(0,0,W,H,accent('#fde66b',v,30));rect(0,12,W,76,'#d7263d');t("Walking around the island",W/2,50,46,'#fff');t('OKINAWA · '+issue.dateLine,W/2,104,17,'#7a1c1c',800);
  rect(24,122,W-48,170,['#4fb7e8','#e9a24b','#3c8d4f','#7a6fb0'][v]);rect(24,232,W-48,60,'#ffffff');rect(24,262,W-48,30,'#2a8fcc');
  if(v===2){ctx.fillStyle='#24603a';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(40+i*40,200,30,0,Math.PI*2);ctx.fill();}}
  else{ctx.fillStyle='#c0392b';ctx.beginPath();ctx.moveTo(90,190);ctx.quadraticCurveTo(160,140,230,190);ctx.lineTo(220,200);ctx.lineTo(100,200);ctx.closePath();ctx.fill();rect(110,200,14,40,'#8a2a1c');rect(196,200,14,40,'#8a2a1c');}
  ink(4);ctx.strokeRect(24,122,W-48,170);
  fit(issue.head,W/2,322,24,'#17141a',W-24);rect(0,342,W,40,'#9b59b6');fit('★ '+issue.sub+' ★',W/2,362,20,'#fff',W-24,800);
  barcode(14,H-46,3);price('#17141a');break;}
 case 'fashion':{
  rect(0,0,W,H,accent('#f2557a',v,25));ctx.fillStyle='rgba(255,255,255,.22)';for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(hash(i,3+v)*W,hash(i,4)*H,10+hash(i,5)*8,0,Math.PI*2);ctx.fill();}
  ctx.lineWidth=7;ctx.strokeStyle='#17141a';ctx.font=`900 46px ${MARU}`;ctx.textAlign='center';ctx.strokeText('GAL ISLAND',W/2,58);t('GAL ISLAND',W/2,58,46,'#ffe066');
  for(const [x,y,r,hair] of [[30,100,-.06,'#6b3a2a'],[170,118,.05,['#c9822e','#2b1d16','#e0b04a','#8a4a2a'][v]]]){ctx.save();ctx.translate(x,y);ctx.rotate(r);rect(0,0,120,160,'#fff');rect(8,8,104,120,'#fbcfe8');ctx.fillStyle=hair;ctx.beginPath();ctx.arc(60,62,30,Math.PI,0);ctx.fill();ctx.fillStyle='#ffd8bf';ctx.beginPath();ctx.arc(60,72,22,0,Math.PI*2);ctx.fill();t('♡',60,145,20,'#f2557a');ctx.restore();}
  rect(0,300,W,48,'#ffe066');fit(issue.head,W/2,324,26,'#17141a',W-24);fit(issue.sub,W/2,374,20,'#fff',W-24,800);t(issue.dateLine,W-16,96,14,'#fff',800,'right');
  barcode(14,H-46,4);price();break;}
 case 'sport':{
  const g=ctx.createRadialGradient(W/2,230,20,W/2,230,280);g.addColorStop(0,accent('#f98a2b',v,20));g.addColorStop(.6,'#b8231d');g.addColorStop(1,'#1c1917');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  t("Combat Fight",W/2,48,40,'#fff');t(`Weekly ${issue.number}Issue`,16,90,16,'#ffe066',800,'left');
  ctx.fillStyle='#120d0c';ctx.beginPath();ctx.arc(W/2,180,52,0,Math.PI*2);ctx.fill();rect(W/2-70,226,140,100,'#120d0c');
  if(v%2){rect(W/2-120,200,60,26,'#120d0c');rect(W/2+60,200,60,26,'#120d0c');}else{rect(W/2-120,236,60,26,'#120d0c');rect(W/2+60,236,60,26,'#120d0c');}
  if(v===3){ctx.fillStyle='#d42a2a';ctx.beginPath();ctx.arc(W/2,180,52,Math.PI*1.1,Math.PI*1.9);ctx.fill();}
  fit(issue.head,W/2,346,30,'#ffe066',W-24);fit(issue.sub,W/2,384,19,'#fff',W-24,800);
  barcode(14,H-46,5);price();break;}
 case 'anime':{
  rect(0,0,W,H,accent('#2e2a7a',v,40));ctx.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<6;i++)ctx.fillRect(0,110+i*48,W,22);
  t("Monthly",36,30,18,'#7fe3f5',800);t("Cell animation",W/2,58,40,'#7fe3f5');t(issue.dateLine,W-16,92,15,'#e2e8f0',800,'right');
  ctx.fillStyle=accent('#9b5de5',v,60);ctx.beginPath();ctx.moveTo(W/2,104);ctx.lineTo(W/2+62,206);ctx.lineTo(W/2+40,296);ctx.lineTo(W/2-40,296);ctx.lineTo(W/2-62,206);ctx.closePath();ctx.fill();ink(5);ctx.stroke();
  rect(W/2-10,170,20,48,'#5ef08a');ctx.fillStyle='#ffe066';ctx.beginPath();ctx.moveTo(W/2,104);ctx.lineTo(W/2-8,78);ctx.lineTo(W/2+8,78);ctx.fill();
  fit(issue.head,W/2,330,28,'#ffe066',W-24);fit(issue.sub,W/2,370,18,'#e2e8f0',W-24,800);
  barcode(14,H-46,6);price();break;}
 case 'tv':{
  rect(0,0,W,H,'#ffffff');rect(0,0,W,80,accent('#2a8fcc',v,45));t("TV Island",W/2,42,40,'#fff');t(`Weekly ${issue.number}Issue`,16,98,15,'#2a8fcc',800,'left');
  ctx.fillStyle=accent('#ffd93b',v,30);ctx.beginPath();ctx.arc(W/2,200,78,0,Math.PI*2);ctx.fill();rect(W/2-50,170,100,66,'#17141a');rect(W/2-42,178,84,50,['#7fd1f0','#f7a8c4','#a6e57c','#ffd27a'][v]);
  ctx.strokeStyle='#17141a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W/2-20,170);ctx.lineTo(W/2-40,138);ctx.moveTo(W/2+20,170);ctx.lineTo(W/2+40,138);ctx.stroke();
  t(`${shortDate(issue.saleDate)} → ${issue.until} Program list`,W/2,286,19,'#d7263d');fit(issue.head,W/2,330,24,'#17141a',W-24);fit(issue.sub,W/2,372,18,'#555',W-24,800);
  barcode(14,H-46,7);price('#17141a');break;}
 case 'umikaze':case 'hoshizora':case 'katsuo':{
  const look={umikaze:['#d7e5ec','#20496b','#3d7fa6',"Sea breeze","Monthly Sea breeze"],hoshizora:['#2b3a5c','#f2e2b0','#c58a3a',"Starzora","Weekly Starry sky"],katsuo:['#f0e3c4','#2f5c45','#b5622f',"Bonito","Fishing and the sea"]}[title.kind];
  const [paper,inkC,base,jp,line]=look,acc=accent(base,v,35);rect(0,0,W,H,paper);
  t(line,W/2,56,42,inkC);t(jp+' · '+issue.dateLine,W/2,100,17,acc,800);rect(24,124,W-48,190,acc);
  if(title.kind==='hoshizora'){ctx.fillStyle='#f2e2b0';for(let i=0;i<30;i++){ctx.beginPath();ctx.arc(30+hash(i,8+v)*(W-60),130+hash(i,9)*170,1.5+hash(i,1)*2.5,0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.arc(80+v*45,170,24,0,Math.PI*2);ctx.fill();}
  else if(title.kind==='umikaze'){rect(150,150,20,110,'#ffffff');rect(150,170,20,16,'#d7263d');rect(150,210,20,16,'#d7263d');rect(24,260,W-48,54,'#20496b');if(v===1){ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(40+i*22,130);ctx.lineTo(30+i*22,160);ctx.stroke();}}}
  else {rect(24,250,W-48,64,'#2f5c45');ctx.fillStyle='#d9e2e8';ctx.beginPath();ctx.ellipse(160,200,70,22,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(220,200);ctx.lineTo(250,180);ctx.lineTo(250,220);ctx.fill();}
  fit(issue.head,W/2,344,22,inkC,W-24,800);fit(issue.sub,W/2,374,16,acc,W-24,800);barcode(14,H-46,8);price(inkC);break;}
 case 'paper':{
  rect(0,0,W,H,'#ebe7d9');rect(14,14,W-28,70,title.colour);fit(title.name,W/2,40,32,'#fff',W-40);fit(title.edition,W/2,68,12,'#fff',W-40,800);
  t(issue.dateLine,W/2,100,15,'#3a3530',700);
  ctx.fillStyle=title.id==='shimaspo'?'#d7263d':'#17141a';fit(issue.head,W/2,148,36,ctx.fillStyle,W-24);t(issue.sub,W/2,192,22,'#3a3530');
  rect(18,216,140,108,'#a8a296');ctx.fillStyle='#57524a';for(let c=0;c<6;c++)for(let y=220;y<322;y+=12)ctx.fillRect(170+c*22,y,16,6);
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,H-6);ctx.lineTo(W,H-6);ctx.stroke();
  for(let y=340;y<H-16;y+=12)rect(18,y,W-36,5,'#6e695f');break;}
 }
 ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);
 p.done();
}

/** The PORT 88 canned-coffee advertisement every magazine carries on its back cover. */
export function drawBackAd(ctx,w=320,h=440){
 const {t,rect,done}=pen(ctx,w,h);
 rect(0,0,320,440,'#322823');rect(0,350,320,90,'#bd4826');rect(130,90,60,170,'#f5e5c1');rect(130,150,60,50,'#bd4826');
 t('PORT 88',160,320,40,'#f5e5c1');t("One in the morning at the port.",160,394,22,'#f5e5c1',800);done();
}

// ==================================================================== pages
function page(ctx,w,h,draw){const p=pen(ctx,w,h);p.rect(0,0,320,440,'#fbf8ee');draw(p);p.done();}
const header=(p,title,label,colour='#2b2b2b')=>{p.rect(0,0,320,34,colour);p.fit(label,14,12,16,'#fff',292,900,'left');p.fit(title.name,306,27,9,'#fff',292,700,'right');};
const footer=(p,n)=>p.t(String(n),160,428,11,'#888',700);

function contents(title,issue,colour){
 return ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,'CONTENTS',colour);
  const items=[issue.head,issue.sub,...title.subs.filter(s=>s!==issue.sub).slice(0,3),"Reader's page","Next issue preview"];
  items.forEach((s,i)=>{p.rect(18,52+i*44,6,30,colour);p.block(s,40,67+i*44,16,'#2b2b2b',224);p.t(String(4+i*6),300,67+i*44,15,colour,800,'right');});
  p.t(title.en,160,400,12,'#777',700);footer(p,3);});
}
function tvListings(title,issue){
 const channels=["Shima TV","Southwest Broadcasting","MinatoTV","NHKOkinawa"];
 const shows=["News","Serial drama","Quiz!","Historical drama","Professional baseball","Anime","Song program","Movie theater","Weather forecast","Cooking time","Comedy","Document"];
 return [0,1,2,3].map(d=>ctx=>(w,h)=>page(ctx,w,h,p=>{
  const day=new Date(issue.saleDate.getFullYear(),issue.saleDate.getMonth(),issue.saleDate.getDate()+d*2);
  header(p,title,`${shortDate(day)}(${WEEKDAYS[day.getDay()]}) Program list`,'#2a8fcc');
  channels.forEach((c,ci)=>{p.rect(10+ci*76,42,72,22,['#2a8fcc','#d7263d','#3c8d4f','#555'][ci]);p.t(c,46+ci*76,53,12,'#fff',800);});
  for(let hr=0;hr<11;hr++){p.t(String(17+hr>23?17+hr-24:17+hr),6,82+hr*30,10,'#999',700,'left');
   channels.forEach((c,ci)=>{const s=shows[Math.floor(hash(hr*7+ci*13,day.getDate()+d)*shows.length)];p.rect(10+ci*76,70+hr*30,72,27,hr%2?'#f2efe4':'#fff');p.fit(s,46+ci*76,83+hr*30,11,'#2b2b2b',66,700);});}
  footer(p,6+d);}));
}
function games(title,issue){
 return [
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Strategy! "+issue.head,'#ec4899');
   for(let i=0;i<4;i++){const x=16+(i%2)*150,y=48+Math.floor(i/2)*150;p.rect(x,y,138,100,'#10162e');p.ctx.fillStyle=['#3bc4f2','#ffe066','#5ef08a','#f2557a'][i];
    for(let b=0;b<6;b++)p.ctx.fillRect(x+10+hash(b,i)*100,y+20+hash(b,i+5)*60,18,14);p.lines(x,y+108,138,3,10,'#6e695f',i);}
   p.rect(16,350,288,60,'#fff3c4');p.t("Hidden command: ↑↑↓↓←→←→ B A",160,380,15,'#d7263d',900);footer(p,8);}),
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"New software Release calendar",'#10162e');
   ["AdventureRPG Minato Quest","Fighting Street Shisa","Lace Tropical Circuit","Puzzle Habu and Mongoose","Baseball Fighting Koshien","Shooting Sea of Stars"].forEach((g,i)=>{const d=new Date(issue.saleDate.getFullYear(),issue.saleDate.getMonth(),issue.saleDate.getDate()+7+i*5);
    p.rect(16,48+i*58,288,50,i%2?'#eef4fb':'#fff');p.t(shortDate(d),24,73+i*58,14,'#ec4899',900,'left');p.fit(g,190,66+i*58,15,'#2b2b2b',190,800);p.t('¥'+(5800+i*400).toLocaleString(),296,86+i*58,11,'#666',700,'right');});footer(p,12);}),
 ];
}
function guide(title,issue){
 return [
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,'MAP · '+issue.sub,'#d7263d');
   p.rect(16,46,288,300,'#9fd6f0');p.ctx.fillStyle='#e9dfb8';p.ctx.beginPath();p.ctx.moveTo(150,60);p.ctx.bezierCurveTo(230,90,200,180,230,260);p.ctx.bezierCurveTo(240,320,170,340,120,320);p.ctx.bezierCurveTo(70,250,110,180,90,120);p.ctx.closePath();p.ctx.fill();
   [["Minato",150,290],["Kokusai Street",170,240],["Shuri",190,200],["Yanbaru",160,90],["Airport",110,300]].forEach(([n,x,y],i)=>{p.ctx.fillStyle='#d7263d';p.ctx.beginPath();p.ctx.arc(x,y,6,0,Math.PI*2);p.ctx.fill();p.t(n,x+10,y,12,'#2b2b2b',800,'left');});
   p.lines(16,360,288,4,12,'#6e695f',3);footer(p,10);}),
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Recommended stores",'#9b59b6');
   ["Sakura Shop — Convenience store in front of the port","Sato Ramen — Night11Until the hour","Minato Izakaya — Awamori100Seed","Port Bakery — Morning6From time","Bookstore — Old maps available"].forEach((s,i)=>{p.rect(16,46+i*72,80,62,['#ffc93c','#f2557a','#3bc4f2','#a6e57c','#c9a0dc'][i]);p.fit(s,206,62+i*72,14,'#2b2b2b',200,800);p.lines(104,74+i*72,200,2,10,'#8a857a',i);});footer(p,14);}),
 ];
}
function fashion(title,issue){
 return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Purikura notebook Big reveal",'#f2557a');
  for(let i=0;i<12;i++){const x=16+(i%3)*98,y=46+Math.floor(i/3)*90;p.rect(x,y,90,82,'#fff');p.rect(x+4,y+4,82,60,['#fbcfe8','#bae6fd','#fde68a','#bbf7d0'][(i+issue.variant)%4]);
   p.ctx.fillStyle='#6b3a2a';p.ctx.beginPath();p.ctx.arc(x+45,y+34,16,Math.PI,0);p.ctx.fill();p.ctx.fillStyle='#ffd8bf';p.ctx.beginPath();p.ctx.arc(x+45,y+40,12,0,Math.PI*2);p.ctx.fill();p.t(["Friends","Chovelig",'♡LOVE',"See you soon"][i%4],x+45,y+73,10,'#f2557a',900);}
  footer(p,9);}),
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Pager code Quick reference table",'#9b59b6');
   [['0840',"Good morning"],['14106',"I love you"],['724106',"What are you doing?"],['3341',"Lonely"],['49',"Urgent"],['0833',"Good night"],['8181',"Bye-bye"]].forEach(([c,m],i)=>{p.rect(30,48+i*50,100,40,'#2b2b2b');p.t(c,80,68+i*50,20,'#5ef08a',900);p.t(m,150,68+i*50,18,'#2b2b2b',800,'left');});footer(p,11);})];
}
function sport(title,issue){
 return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Match results "+shortDate(issue.saleDate),'#b8231d');
  ["Hub Shimada","Shisa Kinjo","Mongoose Higa","Fuun Teruya","Storm of Miyagi","MaskedX"].forEach((n,i)=>{const r=hash(i,issue.number)>.5;p.rect(16,48+i*56,288,48,i%2?'#f6eee6':'#fff');p.t(n,26,72+i*56,15,'#2b2b2b',800,'left');p.t(r?"○ Victory":"● Negative",220,72+i*56,15,r?'#b8231d':'#555',900);p.t(`${8+Math.floor(hash(i,3)*20)}min${Math.floor(hash(i,4)*59)}sec`,296,72+i*56,12,'#666',700,'right');});footer(p,7);}),
  ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Tour schedule",'#1c1917');
   ["Naha Civic Gymnasium","Ginowan Seaside Park","Okinawa City Gymnasium","Nago 21Century Forest","Stone wall General gymnasium","Miyako Civic Hall"].forEach((s,i)=>{const d=new Date(issue.saleDate.getFullYear(),issue.saleDate.getMonth(),issue.saleDate.getDate()+3+i*4);p.t(`${shortDate(d)}(${WEEKDAYS[d.getDay()]})`,24,60+i*56,15,'#b8231d',900,'left');p.t(s,24,82+i*56,15,'#2b2b2b',800,'left');p.t('18:30',296,70+i*56,14,'#666',700,'right');});footer(p,15);})];
}
function anime(title,issue){
 return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"New autumn program Broadcast list",'#2e2a7a');
  ["Mobile Sea God Minato","Stardust Academy","Hayabusa Fuunji","Our summer vacation","Magical Girl Goya","Spaceship Shisa"].forEach((s,i)=>{p.rect(16,46+i*60,70,52,['#9b5de5','#f2557a','#ffb703','#3bc4f2','#5ef08a','#ef476f'][i]);p.fit(s,196,62+i*60,15,'#2b2b2b',200,800);p.t(`Weekly${WEEKDAYS[(i+1)%7]}Day of the week ${17+i%3}:00`,196,84+i*60,12,'#666',700);});footer(p,5);})];
}
function sea(title,issue){
 if(title.kind==='katsuo')return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Tide chart "+issue.dateLine,'#2f5c45');
  p.ctx.strokeStyle='#2a8fcc';p.ctx.lineWidth=3;p.ctx.beginPath();for(let x=0;x<=288;x+=4){const y=150-Math.sin((x/288)*Math.PI*4+issue.variant)*60;x?p.ctx.lineTo(16+x,y):p.ctx.moveTo(16,y);}p.ctx.stroke();
  for(let d=0;d<7;d++){p.rect(16,240+d*24,288,20,d%2?'#eef3ea':'#fff');p.t(`${d+1}Day High tide ${5+d}:${(d*13%60).toString().padStart(2,'0')} Low tide ${11+d}:${(d*29%60).toString().padStart(2,'0')}`,24,250+d*24,12,'#2b2b2b',700,'left');}footer(p,4);})];
 if(title.kind==='hoshizora')return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"This week's starry sky",'#2b3a5c');
  p.rect(16,44,288,288,'#14203b');p.ctx.strokeStyle='#33446b';p.ctx.lineWidth=1;p.ctx.beginPath();p.ctx.arc(160,188,140,0,Math.PI*2);p.ctx.stroke();
  for(let i=0;i<70;i++){p.ctx.fillStyle='#f2e2b0';p.ctx.beginPath();p.ctx.arc(30+hash(i,issue.number)*260,58+hash(i,2)*260,hash(i,3)*2.2+.6,0,Math.PI*2);p.ctx.fill();}
  p.ctx.strokeStyle='#c58a3a';p.ctx.lineWidth=1.5;p.ctx.beginPath();[[90,120],[130,140],[160,110],[200,150],[240,130]].forEach(([x,y],i)=>i?p.ctx.lineTo(x,y):p.ctx.moveTo(x,y));p.ctx.stroke();
  p.t("Pegasus · Southern sky 21h",160,352,15,'#2b3a5c',800);p.lines(16,372,288,3,12,'#6e695f',5);footer(p,6);})];
 return [ctx=>(w,h)=>page(ctx,w,h,p=>{header(p,title,"Port town sketch",'#20496b');
  p.rect(16,46,288,200,'#d7e5ec');p.rect(16,190,288,56,'#3d7fa6');p.rect(150,90,18,100,'#fff');p.rect(150,110,18,14,'#d7263d');
  p.lines(16,262,288,12,12,'#6e695f',9);footer(p,12);})];
}
function newspaperPage(title,issue){
 return [ctx=>(w,h)=>page(ctx,w,h,p=>{p.rect(0,0,320,440,'#ebe7d9');header(p,title,"2Face · Region",title.colour);
  for(let c=0;c<3;c++){p.fit(title.heads[(issue.variant+c+1)%title.heads.length],16+c*98+46,56,14,'#17141a',90,900);p.lines(16+c*98,72,92,24,13,'#57524a',c+issue.variant);}
  p.rect(16,394,288,30,'#fff');p.t("Advertisement · Sakura Shop Every morning6From time",160,409,13,'#d7263d',800);})];
}

/**
 * The pages of one issue, in reading order. Each is either {draw(ctx,w,h)} or
 * {image:'magazines/…png'} for the pages drawn by tools/magazines/draw_pages.py.
 */
export function pagesFor(title,issue){
 const out=[{draw:(ctx,w,h)=>drawCover(ctx,title,issue,w,h)}];
 const add=fns=>fns.forEach(fn=>out.push({draw:(ctx,w,h)=>fn(ctx)(w,h)}));
 const colours={shonen:'#d42a2a',games:'#ec4899',guide:'#d7263d',fashion:'#f2557a',sport:'#b8231d',anime:'#2e2a7a',tv:'#2a8fcc',umikaze:'#20496b',hoshizora:'#2b3a5c',katsuo:'#2f5c45'};
 if(title.kind==='paper'){add(newspaperPage(title,issue));return out;}
 add([contents(title,issue,colours[title.kind])]);
 if(title.kind==='shonen')for(let n=1;n<=MANGA_PAGES;n++)out.push({image:`magazines/hayabusa-ch${issue.chapter+1}-p${n}.png`});
 // サクラ商店4コマ: two gag strips a week, after the serial.
 if(title.kind==='shonen')out.push({image:`magazines/hayabusa-gag-${issue.chapter+1}.png`});
 if(title.kind==='games')add(games(title,issue));
 if(title.kind==='guide')add(guide(title,issue));
 if(title.kind==='fashion')add(fashion(title,issue));
 if(title.kind==='sport')add(sport(title,issue));
 if(title.kind==='anime'){out.push({image:`magazines/celanime-poster-${issue.variant+1}.png`});add(anime(title,issue));}
 if(title.kind==='tv')add(tvListings(title,issue));
 if(['umikaze','hoshizora','katsuo'].includes(title.kind))add(sea(title,issue));
 out.push({draw:(ctx,w,h)=>drawBackAd(ctx,w,h)});
 return out;
}
