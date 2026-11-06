import * as THREE from '../../../vendor/three.module.js';
import {assetURL} from '../../assets.js';

/**
 * The trade posters on Sakura's staff walls, and the drink stock in the office hall (drawing SK-ST-003 rev A). The owner,
 * 27 October 2026: "Put more advertisement posters on the walls in the hallway and stair case this is the interior of the
 * Sakura and not available to the customers so we can have many interesting things on the walls here like a fake beer
 * brand and make up ads and liquor ads etc and I want liquor and beer boxes in the hallway outside the office".
 *
 * Why they are here. Since Higa Liquor closed (the owner, 22 October 2026) Sakura sells all the island's drink and supplies
 * Minato, Sato Ramen, the Coral Bay Bar and Mr Fujita's shed (commerce/trade-round.js). The brewers' and distillers' reps
 * send a campaign poster with every season's order, more than the shop floor has room for, and the spares go up where
 * the staff pass: the stair and the hall. Asagao's rep, the cosmetics house, left two in September, hoping Thuan will
 * take a counter of their lipsticks; she has not said yes (a story the storyteller may use). Every poster carries the
 * line Japanese drink advertising must: お酒は二十歳になってから (drinking from twenty).
 *
 * The cases: Sakura now takes the island's year-end gift orders (お歳暮) that Higa used to, and the Coral Bay Bar's December
 * order is in. The gift sets and the spirits are worth the most of anything Sakura holds, so they wait dry, upstairs by the
 * office and its safe, not in the Quay Warehouse depot, until Kōji's round or the customer's collection. They stand along
 * the hall's walls off the walking line, under the posters for what they are.
 *
 * Brands: UMINEKO is the town's lager (commerce products, `beer`: Draft, Dry, Black). The rest are this drawing's, fictional:
 * KITANO 12 (a pure malt, named for Kitano-jima), SHIMAKAZE awamori, MINATO-TSURU junmai sake, NAMI SOUR (a can chūhai)
 * and ASAGAO cosmetics.
 */

/** The nine poster designs (B2 paper, 515 x 728 mm), each with who sent it. */
export const SAKURA_TRADE_POSTERS=Object.freeze([
 {id:'umineko-draft',brand:'UMINEKO',kind:'beer',why:'The brewery’s autumn poster for the town’s lager, Sakura’s best-selling drink.'},
 {id:'umineko-black',brand:'UMINEKO',kind:'beer',why:'The same brewery’s black lager, new this autumn: the rep wants it in Minato’s fridge.'},
 {id:'umineko-gift',brand:'UMINEKO',kind:'gift',why:'The year-end gift set: Sakura takes the orders now, so the poster says 承ります (orders taken here).'},
 {id:'kitano-12',brand:'KITANO 12',kind:'whisky',why:'A pure malt for the Coral Bay Bar’s shelf and the gift orders; the distiller’s poster came with the case.'},
 {id:'shimakaze',brand:'SHIMAKAZE',kind:'awamori',why:'The island’s awamori: Minato and Mr Fujita’s shed take it, and Grandmother Higa still asks after it.'},
 {id:'minato-tsuru',brand:'MINATO-TSURU',kind:'sake',why:'Junmai sake for Sato Ramen and the New Year: the brewer’s winter poster.'},
 {id:'nami-sour',brand:'NAMI SOUR',kind:'chuhai',why:'A lemon can chūhai, the young drinkers’ choice; it came with a sample case.'},
 {id:'asagao-rouge',brand:'ASAGAO',kind:'cosmetics',why:'Asagao’s autumn lipstick campaign: the rep hopes Thuan will take a counter of them.'},
 {id:'asagao-uv',brand:'ASAGAO',kind:'cosmetics',why:'Asagao’s summer UV milk, left with the lipstick poster; it is October, so it is off the shop’s wall and up here.'},
].map(Object.freeze));

/**
 * Where each hangs: stair/stockroom use the shop frame, hall/office the upstairs frame. `at` is the centre on the
 * wall's face, `face` the way it looks. Optional `lookAt` is the clear standing/interaction point in front of furniture.
 * SK-ST-004 rev B records the two selected office prints and three stockroom prints, with measured clearances. The stair's step up the flights, each
 * 120 mm over the handrail at its higher edge (the rail climbs across a poster's width), as posters along a stair hang; the hall's at eye height, clear of doors, switches and the cabinet.
 */
export const SAKURA_POSTER_WALLS=Object.freeze([
 {id:'nami-sour',room:'stair',at:[-2.9,2.53,-4.07],face:'-z',wall:'lower flight, north wall'},
 {id:'umineko-draft',room:'stair',at:[-3.75,3.17,-4.07],face:'-z',wall:'lower flight, north wall'},
 {id:'shimakaze',room:'stair',at:[-5.65,3.5,-6.2],face:'+x',wall:'landing, west wall'},
 {id:'minato-tsuru',room:'stair',at:[-5.0,3.5,-6.70],face:'+z',wall:'landing, south wall'},
 {id:'kitano-12',room:'stair',at:[-3.55,4.25,-6.70],face:'+z',wall:'upper flight, south wall'},
 {id:'umineko-black',room:'stair',at:[-2.55,4.99,-6.70],face:'+z',wall:'upper flight, south wall'},
 {id:'asagao-rouge',room:'hall',at:[-2.0,1.5,-2.455],face:'+x',wall:'hall, west wall by the store door'},
 {id:'umineko-gift',room:'hall',at:[-2.0,1.5,-.15],face:'+x',wall:'hall, west wall, over the gift sets'},
 {id:'asagao-uv',room:'hall',at:[-2.0,1.5,.85],face:'+x',wall:'hall, west wall, over the spirits'},
 {id:'umineko-draft',room:'hall',at:[.7,1.55,-3.95],face:'-x',wall:'hall, east wall, over the shoe cabinet'},
 {id:'kitano-12',room:'office',at:[5.15,2.3,4.49],face:'-z',lookAt:[5.15,1.5,3.2],wall:'office, front wall above the filing cabinet',who:'Thuan',why:'The distiller’s gift campaign over the order files, clear of the archive tube and the harbour calendar.'},
 {id:'umineko-black',room:'office',at:[1.18,2.3,4.49],face:'-z',lookAt:[1.18,1.5,3.25],wall:'office, front wall above the ledger shelf',who:'Thuan',why:'Selected with KITANO 12 by the owner’s two-poster brief, 31 October 2026: the brewery’s harbour-at-dusk campaign balances the amber whisky print across the street window, above the order binders and near its sample cases in the hall.'},
 {id:'minato-tsuru',room:'stockroom',at:[-.1,1.78,-6.86],face:'+z',lookAt:[-.1,1.5,-5.4],wall:'ground stockroom, rear wall east of the stairwell',who:'shop staff',why:'The brewer’s winter campaign over the low stock cartons, seen while checking the incoming sake order.'},
 {id:'nami-sour',room:'stockroom',at:[1.6,2.08,-6.86],face:'+z',lookAt:[1.6,1.5,-5.4],wall:'ground stockroom, rear wall above the cola standee',who:'shop staff',why:'The sample-case promotion joins the old campaign stand-ups, with its paper kept above their silhouettes.'},
 {id:'asagao-uv',room:'stockroom',at:[2.35,2.08,-6.86],face:'+z',lookAt:[2.35,1.5,-5.4],wall:'ground stockroom, rear wall above Jaga-bō',who:'shop staff',why:'Last summer’s UV campaign is stored on the wall above the retired standee, clear of the delivery door.'},
].map(p=>Object.freeze({...p,at:Object.freeze(p.at),...(p.lookAt?{lookAt:Object.freeze(p.lookAt)}:{})})));
export const POSTER_SIZE=Object.freeze({w:.515,h:.728});

/**
 * The cases in the hall (office frame): along the west wall from the store door to the rest room, and one stack by the
 * office door on the east. `size` is [depth from the wall, height, width along it]; `stack` how many high. Hand-stacked:
 * each case sits a few millimetres off the one under it and turned a degree, as people stack them (`shift`).
 */
export const SAKURA_HALL_STOCK=Object.freeze([
 {print:'umineko-gift',size:[.27,.13,.41],at:[-2.0,-.34],face:'+x',stack:5,colour:0xf1ebdf,why:'Umineko year-end gift sets (24 cans), five ordered so far, under their poster.'},
 {print:'shimakaze-case',size:[.225,.41,.33],at:[-2.0,.06],face:'+x',stack:2,colour:0xc49a6c,why:'Shimakaze awamori, six 1.8 L bottles a case: the Coral Bay Bar’s December order and Minato’s.'},
 {print:'shimakaze-case',size:[.225,.41,.33],at:[-2.0,.41],face:'+x',stack:2,colour:0xc49a6c,why:'The second of the bar’s awamori cases.'},
 {print:'tsuru-case',size:[.225,.41,.33],at:[-2.0,.77],face:'+x',stack:2,colour:0xc49a6c,why:'Minato-Tsuru junmai, six 1.8 L: Sato Ramen’s New Year sake.'},
 {print:'kitano-case',size:[.25,.30,.32],at:[-2.0,1.11],face:'+x',stack:2,colour:0xc49a6c,why:'Kitano 12, twelve 700 ml a case: the whisky gift orders, kept by the safe.'},
 {print:'umineko-case',size:[.26,.125,.39],at:[-2.0,1.478],face:'+x',stack:6,colour:0xc49a6c,why:'Umineko lager, 24 cans a case: the shop’s weekend top-up, carried up when the stockroom filled.'},
 {print:'black-case',size:[.26,.125,.39],at:[.7,.27],face:'-x',stack:5,colour:0x3b3a36,why:'Umineko Black, five cases the brewery sent on sale-or-return, by the office door until Thuan decides where they go.'},
].map(s=>Object.freeze({...s,size:Object.freeze(s.size),at:Object.freeze(s.at)})));
const CASE_PRINTS=['umineko-gift','shimakaze-case','tsuru-case','kitano-case','umineko-case','black-case'];

const JP_SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif',JP_SANS='"Hiragino Sans","Yu Gothic","Noto Sans CJK JP",sans-serif',LATIN='"Futura","Avenir Next","Helvetica Neue",sans-serif';
const PW=1000,PH=1414,COLS=3,CELL=[360,509];

/** The nine adult-model Artlist campaigns; sake and UV received footer-only ChatGPT copy cleanup at native resolution. */
export const SAKURA_TRADE_ART=Object.freeze(Object.fromEntries(SAKURA_TRADE_POSTERS.map(({id})=>[id,Object.freeze({
 image:`graphics/sakura-trade/${id}-models-r1.webp`,preview:`graphics/sakura-trade/${id}-models-r1-small.webp`,
})])));
const posterTitle=id=>({'umineko-draft':'UMINEKO Draft','umineko-black':'UMINEKO Black','umineko-gift':'UMINEKO gift sets','kitano-12':'KITANO 12 pure malt',shimakaze:'SHIMAKAZE awamori','minato-tsuru':'MINATO-TSURU sake','nami-sour':'NAMI SOUR lemon','asagao-rouge':'ASAGAO Coral Bay Red','asagao-uv':'ASAGAO UV Milk'})[id];
/** The original, unlit artwork for inspection and downloads, never an enlarged crop of the wall atlas. */
export function tradePosterPages(){return SAKURA_TRADE_POSTERS.map(p=>({
 title:posterTitle(p.id),filename:'sakura-'+p.id,width:PW,height:PH,
 ...(SAKURA_TRADE_ART[p.id]?{image:assetURL(SAKURA_TRADE_ART[p.id].image)}:{draw(g,w,h){g.save();g.scale(w/PW,h/PH);DESIGNS[p.id](g);g.restore();}}),
 }));}

/** Text scaled down to fit `max` wide. */
function text(g,s,x,y,{size=60,font=LATIN,weight='bold',colour='#222',align='center',max=900,spacing=0}={}){
 g.font=`${weight} ${size}px ${font}`;g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=colour;
 if('letterSpacing' in g)g.letterSpacing=`${spacing}px`;
 const w=g.measureText(s).width;if(w>max){g.font=`${weight} ${Math.floor(size*max/w)}px ${font}`;}
 g.fillText(s,x,y);if('letterSpacing' in g)g.letterSpacing='0px';
}
/** Vertical Japanese, one character under another. */
function vtext(g,s,x,y,{size=90,font=JP_SERIF,colour='#222',gap=1.08}={}){
 g.font=`bold ${size}px ${font}`;g.textAlign='center';g.textBaseline='top';g.fillStyle=colour;[...s].forEach((c,i)=>g.fillText(c,x,y+i*size*gap));
}
const lin=(g,x0,y0,x1,y1,stops)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([t,c])=>gr.addColorStop(t,c));return gr;};
const rad=(g,x,y,r0,r1,stops)=>{const gr=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach(([t,c])=>gr.addColorStop(t,c));return gr;};
function roundRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
/** The drinking-age line every drink poster in Japan carries, and the poster's small print. */
function legal(g,colour,y=1388){text(g,'お酒は二十歳になってから。飲酒運転は法律で禁止されています。',PW/2,y,{size:22,font:JP_SANS,weight:'normal',colour,max:900});}
function gull(g,x,y,s,colour){g.strokeStyle=colour;g.lineWidth=s*.16;g.lineCap='round';g.beginPath();g.moveTo(x-s,y);g.quadraticCurveTo(x-s*.5,y-s*.55,x,y);g.quadraticCurveTo(x+s*.5,y-s*.55,x+s,y);g.stroke();}
function bubbles(g,x0,x1,y0,y1,n,seed){let s=seed;const r=()=>(s=(s*9301+49297)%233280)/233280;g.fillStyle='rgba(255,250,225,.55)';for(let i=0;i<n;i++){g.beginPath();g.arc(x0+r()*(x1-x0),y0+r()*(y1-y0),2+r()*5,0,7);g.fill();}}

/** A tall glass of beer: `top` the rim's y, `beer` and `foam` colours. */
function beerGlass(g,cx,top,{w=300,h=620,beer=['#f6c84a','#d9871c'],foam='#fffaf0',seed=3}={}){
 const b=top+h,tw=w/2,bw=w*.36;
 g.save();g.beginPath();g.moveTo(cx-tw,top);g.lineTo(cx+tw,top);g.lineTo(cx+bw,b);g.quadraticCurveTo(cx,b+26,cx-bw,b);g.closePath();g.clip();
 g.fillStyle=lin(g,0,top,0,b,[[0,beer[0]],[1,beer[1]]]);g.fillRect(cx-tw,top,w,h+30);
 bubbles(g,cx-tw*.8,cx+tw*.8,top+120,b-20,70,seed);
 g.fillStyle='rgba(255,255,255,.28)';g.fillRect(cx-tw*.62,top,w*.1,h);
 g.restore();
 // The foam's head: a run of soft domes over the rim.
 g.fillStyle=foam;g.beginPath();g.moveTo(cx-tw-6,top+70);for(let i=0;i<=6;i++){const x=cx-tw-6+(w+12)*i/6;g.quadraticCurveTo(x-(w+12)/12,top-50-(i%2)*18,x,top+10);}g.lineTo(cx+tw+6,top+100);g.lineTo(cx-tw-6,top+100);g.closePath();g.fill();
 g.strokeStyle='rgba(60,40,10,.35)';g.lineWidth=5;g.beginPath();g.moveTo(cx-tw,top+40);g.lineTo(cx-bw,b);g.quadraticCurveTo(cx,b+26,cx+bw,b);g.lineTo(cx+tw,top+40);g.stroke();
}
function can(g,cx,y,w,h,{body='#d8dde0',band='#f5d33c',print='LEMON',ink='#1f4d2e'}={}){
 g.fillStyle=lin(g,cx-w/2,0,cx+w/2,0,[[0,'#9aa1a6'],[.25,body],[.55,'#ffffff'],[.8,body],[1,'#8f969b']]);roundRect(g,cx-w/2,y,w,h,18);g.fill();
 g.fillStyle=band;g.fillRect(cx-w/2,y+h*.3,w,h*.4);
 g.fillStyle='#b9bfc3';g.fillRect(cx-w/2+8,y-12,w-16,16);
 text(g,print,cx,y+h*.55,{size:w*.22,colour:ink,max:w*.9});
}

const DESIGNS={
 'umineko-draft'(g){
  g.fillStyle=lin(g,0,0,0,PH,[[0,'#78c1e3'],[.62,'#e8f5fa'],[.63,'#2f7fa6'],[1,'#1f5f80']]);g.fillRect(0,0,PW,PH);
  g.fillStyle=rad(g,760,330,10,220,[[0,'rgba(255,248,214,.95)'],[1,'rgba(255,248,214,0)']]);g.fillRect(0,0,PW,PH);
  gull(g,250,300,70,'#ffffff');gull(g,390,250,44,'#ffffff');gull(g,760,520,36,'#ffffff');
  beerGlass(g,PW/2,470,{w:330,h:600,seed:5});
  text(g,'UMINEKO',PW/2,190,{size:150,font:LATIN,colour:'#38523d',spacing:8});
  text(g,'DRAFT · 生ビール',PW/2,262,{size:52,font:JP_SANS,colour:'#9f5433'});
  g.fillStyle='#eddda0';g.fillRect(0,1150,PW,264);
  text(g,'港町のラガー、秋の味。',PW/2,1232,{size:66,font:JP_SERIF,colour:'#38523d'});
  text(g,'The harbour town lager · 350 ml ¥220',PW/2,1300,{size:34,colour:'#5b6b4e',weight:'normal'});
  legal(g,'#5b6b4e',1360);
 },
 'umineko-black'(g){
  g.fillStyle=lin(g,0,0,0,PH,[[0,'#10151f'],[1,'#273246']]);g.fillRect(0,0,PW,PH);
  for(let i=0;i<40;i++){g.fillStyle=`rgba(255,214,140,${.25+.5*((i*37)%10)/10})`;g.beginPath();g.arc((i*197)%PW,620+((i*83)%120),3,0,7);g.fill();}
  g.fillStyle='#c9a24a';g.fillRect(0,690,PW,4);
  beerGlass(g,PW/2,430,{w:320,h:600,beer:['#3a1d0e','#1a0b05'],foam:'#e9d2a8',seed:9});
  text(g,'UMINEKO',PW/2,180,{size:140,colour:'#c9a24a',spacing:8});
  text(g,'BLACK',PW/2,260,{size:70,colour:'#efe4c8',spacing:30});
  vtext(g,'夜の港に',860,400,{size:62,colour:'#efe4c8'});vtext(g,'黒',860,720,{size:96,colour:'#c9a24a'});
  text(g,'黒ラガー  新発売',PW/2,1190,{size:64,font:JP_SANS,colour:'#c9a24a'});
  text(g,'Black lager, new this autumn · 350 ml ¥240',PW/2,1260,{size:32,colour:'#b9b2a0',weight:'normal'});
  legal(g,'#8f8a7c',1360);
 },
 'umineko-gift'(g){
  g.fillStyle='#a51c24';g.fillRect(0,0,PW,PH);
  g.strokeStyle='#d9b45a';g.lineWidth=10;g.strokeRect(36,36,PW-72,PH-72);
  // The gift box in its noshi paper with the red and gold cord.
  g.fillStyle='#f6f1e6';g.fillRect(190,520,620,400);g.fillStyle='#ffffff';g.fillRect(420,520,160,400);
  g.strokeStyle='#c8202a';g.lineWidth=12;g.beginPath();g.moveTo(190,720);g.lineTo(810,720);g.stroke();g.strokeStyle='#d9b45a';g.lineWidth=6;g.beginPath();g.moveTo(190,734);g.lineTo(810,734);g.stroke();
  g.strokeStyle='#c8202a';g.lineWidth=10;for(const s of [-1,1]){g.beginPath();g.moveTo(500,720);g.bezierCurveTo(500+s*90,640,500+s*150,700,500+s*60,760);g.stroke();}
  vtext(g,'御歳暮',500,540,{size:48,colour:'#2b2622'});
  text(g,'お歳暮は、',PW/2,240,{size:96,font:JP_SERIF,colour:'#f6e7c0'});
  text(g,'ウミネコで。',PW/2,360,{size:96,font:JP_SERIF,colour:'#f6e7c0'});
  text(g,'UMINEKO 350 ml × 24  ギフトセット  ¥5,500',PW/2,1040,{size:44,font:JP_SANS,colour:'#f6e7c0'});
  g.fillStyle='#f6e7c0';g.fillRect(250,1100,500,110);text(g,'ご注文承ります',PW/2,1178,{size:64,font:JP_SANS,colour:'#a51c24'});
  text(g,'Year-end gift sets: order here · さくら商店',PW/2,1270,{size:32,colour:'#f6e7c0',weight:'normal'});
  legal(g,'#e9c9a0',1340);
 },
 'kitano-12'(g){
  g.fillStyle='#120c08';g.fillRect(0,0,PW,PH);
  g.fillStyle=rad(g,PW/2,640,40,620,[[0,'rgba(196,120,48,.55)'],[1,'rgba(196,120,48,0)']]);g.fillRect(0,0,PW,PH);
  // The bottle behind, then the rocks glass with its ice.
  g.fillStyle='#2a1a0e';roundRect(g,600,300,190,600,30);g.fill();g.fillRect(660,190,70,130);g.fillStyle='#d8c79a';g.fillRect(620,560,150,180);
  text(g,'KITANO',695,630,{size:34,colour:'#3a2a18'});text(g,'12',695,700,{size:56,colour:'#3a2a18'});
  g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.moveTo(240,620);g.lineTo(560,620);g.lineTo(540,930);g.lineTo(260,930);g.closePath();g.fill();
  g.fillStyle=lin(g,0,760,0,920,[[0,'#d88a2c'],[1,'#8a4a14']]);g.beginPath();g.moveTo(252,760);g.lineTo(548,760);g.lineTo(540,920);g.lineTo(260,920);g.closePath();g.fill();
  for(const [x,y,s,a] of [[330,700,110,.2],[440,725,95,-.25],[380,790,80,.5]]){g.save();g.translate(x,y);g.rotate(a);g.fillStyle='rgba(235,245,250,.55)';roundRect(g,-s/2,-s/2,s,s,14);g.fill();g.fillStyle='rgba(255,255,255,.8)';g.fillRect(-s/2+10,-s/2+10,s*.25,6);g.restore();}
  g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=4;g.beginPath();g.moveTo(240,620);g.lineTo(260,930);g.lineTo(540,930);g.lineTo(560,620);g.stroke();
  text(g,'時は、北の島で熟す。',PW/2,210,{size:70,font:JP_SERIF,colour:'#e8c98a'});
  text(g,'KITANO 12',PW/2,1120,{size:110,colour:'#e8c98a',spacing:10});
  text(g,'PURE MALT WHISKY · 12 YEARS · 700 ml',PW/2,1185,{size:34,colour:'#bfa577',weight:'normal',spacing:4});
  legal(g,'#8f7a58',1360);
 },
 shimakaze(g){
  g.fillStyle='#f3ead6';g.fillRect(0,0,PW,PH);
  // Seigaiha waves along the foot, in the island's indigo.
  g.fillStyle='#2b3f6c';g.fillRect(0,1060,PW,354);g.strokeStyle='#f3ead6';g.lineWidth=5;
  for(let row=0;row<5;row++)for(let i=-1;i<12;i++){const x=i*100+(row%2)*50,y=1080+row*60;for(const r of [46,32,18]){g.beginPath();g.arc(x,y,r,Math.PI,0);g.stroke();}}
  // The clay jar.
  g.fillStyle=lin(g,330,0,670,0,[[0,'#5e3a22'],[.4,'#9c6a3e'],[1,'#4a2c18']]);g.beginPath();g.moveTo(420,420);g.bezierCurveTo(250,520,260,900,380,980);g.lineTo(620,980);g.bezierCurveTo(740,900,750,520,580,420);g.closePath();g.fill();
  g.fillStyle='#4a2c18';g.fillRect(430,370,140,60);g.fillStyle='#e8ddc4';g.fillRect(400,560,200,240);
  vtext(g,'島風',500,580,{size:86,colour:'#2b3f6c'});
  // A hibiscus.
  g.fillStyle='#c8202a';for(let i=0;i<5;i++){g.save();g.translate(790,440);g.rotate(i*1.2566);g.beginPath();g.ellipse(0,-58,40,60,0,0,7);g.fill();g.restore();}g.fillStyle='#f3c34a';g.beginPath();g.arc(790,440,14,0,7);g.fill();
  vtext(g,'泡盛',150,180,{size:120,colour:'#2b3f6c'});vtext(g,'古酒',150,470,{size:80,colour:'#8a5a32'});
  text(g,'SHIMAKAZE AWAMORI · 30° · 1.8 L',PW/2,1015,{size:36,colour:'#2b3f6c',spacing:3});
  g.fillStyle='#2b3f6c';g.fillRect(0,1190,PW,90);text(g,'島の風で、ゆっくり眠らせました。',PW/2,1252,{size:52,font:JP_SERIF,colour:'#f3ead6'});
  legal(g,'#c9d2e6',1360);
 },
 'minato-tsuru'(g){
  g.fillStyle='#fbf8f1';g.fillRect(0,0,PW,PH);
  g.fillStyle='#c8202a';g.beginPath();g.arc(560,470,250,0,7);g.fill();
  // A white crane in flight across the sun: wings up with black tips, the neck reaching forward, the legs trailing.
  const crane=(x,y)=>{g.save();g.translate(x,y);g.fillStyle='#ffffff';g.strokeStyle='#22201d';g.lineWidth=5;
   for(const s of [-1,1]){g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(s*60,-120,s*170,-200);g.lineTo(s*150,-120);g.quadraticCurveTo(s*90,-40,s*30,20);g.closePath();g.fill();g.stroke();
    g.fillStyle='#22201d';g.beginPath();g.moveTo(s*170,-200);g.lineTo(s*150,-120);g.lineTo(s*135,-150);g.closePath();g.fill();g.fillStyle='#ffffff';}
   g.beginPath();g.ellipse(0,10,70,26,-.25,0,7);g.fill();g.stroke();
   g.strokeStyle='#22201d';g.lineWidth=9;g.beginPath();g.moveTo(-50,25);g.quadraticCurveTo(-130,10,-190,-30);g.stroke();
   g.fillStyle='#c8202a';g.beginPath();g.arc(-192,-34,10,0,7);g.fill();
   g.lineWidth=5;g.beginPath();g.moveTo(60,20);g.lineTo(170,60);g.moveTo(60,28);g.lineTo(165,72);g.stroke();g.restore();};
  crane(600,560);
  // The isshōbin.
  g.fillStyle=lin(g,690,0,860,0,[[0,'#1d4a2c'],[.5,'#3d7a50'],[1,'#163a22']]);roundRect(g,700,760,150,470,28);g.fill();g.fillRect(745,640,60,140);
  g.fillStyle='#fbf8f1';g.fillRect(715,880,120,230);vtext(g,'港鶴',775,895,{size:62,colour:'#22201d'});
  vtext(g,'港鶴',200,180,{size:190,colour:'#22201d',gap:1.02});
  vtext(g,'純米酒',360,820,{size:72,colour:'#c8202a'});
  text(g,'MINATO-TSURU  JUNMAI  1.8 L',PW/2,1290,{size:40,colour:'#22201d',spacing:4});
  legal(g,'#6d6860',1360);
 },
 'nami-sour'(g){
  g.fillStyle=lin(g,0,0,PW,PH,[[0,'#fff3a6'],[1,'#f6c935']]);g.fillRect(0,0,PW,PH);
  g.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<9;i++){g.beginPath();g.arc(120+i*100,1000+Math.sin(i)*40,30+i%3*14,0,7);g.fill();}
  // A lemon slice.
  g.fillStyle='#f2d22c';g.beginPath();g.arc(250,520,170,0,7);g.fill();g.fillStyle='#fff7c2';g.beginPath();g.arc(250,520,145,0,7);g.fill();
  g.strokeStyle='#f2d22c';g.lineWidth=10;for(let i=0;i<8;i++){g.beginPath();g.moveTo(250,520);g.lineTo(250+Math.cos(i*.785)*145,520+Math.sin(i*.785)*145);g.stroke();}
  can(g,660,360,250,520,{print:'NAMI',band:'#2f9bd3',ink:'#ffffff'});
  text(g,'NAMI SOUR',PW/2,190,{size:130,colour:'#1f6fa3',spacing:6});
  text(g,'レモンサワー · 焼酎ハイボール',PW/2,265,{size:50,font:JP_SANS,colour:'#c0392b'});
  text(g,'しゅわっと、波が来た。',PW/2,1140,{size:72,font:JP_SERIF,colour:'#1f6fa3'});
  text(g,'Lemon sour · 350 ml ¥180',PW/2,1215,{size:36,colour:'#7a5a12',weight:'normal'});
  legal(g,'#7a5a12',1360);
 },
 'asagao-rouge'(g){
  g.fillStyle=lin(g,0,0,0,PH,[[0,'#f7d6d0'],[1,'#e07a6c']]);g.fillRect(0,0,PW,PH);
  // The lips, drawn as a print of them.
  g.fillStyle='#d8343c';g.beginPath();g.moveTo(220,560);g.bezierCurveTo(330,420,430,470,500,500);g.bezierCurveTo(570,470,670,420,780,560);g.bezierCurveTo(660,700,340,700,220,560);g.fill();
  g.strokeStyle='#9e1f2a';g.lineWidth=6;g.beginPath();g.moveTo(240,560);g.quadraticCurveTo(500,600,760,560);g.stroke();
  g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(420,620,70,14,-.1,0,7);g.fill();
  // The lipstick in its gold case.
  g.save();g.translate(720,980);g.rotate(-.35);g.fillStyle=lin(g,-60,0,60,0,[[0,'#8a6a2c'],[.5,'#f1d58a'],[1,'#7a5a24']]);g.fillRect(-60,-40,120,260);
  g.fillStyle='#d8343c';g.beginPath();g.moveTo(-44,-40);g.lineTo(-44,-170);g.lineTo(44,-220);g.lineTo(44,-40);g.closePath();g.fill();g.restore();
  text(g,'秋は、珊瑚色。',PW/2,230,{size:100,font:JP_SERIF,colour:'#8e1d29'});
  text(g,'ASAGAO',300,1120,{size:110,colour:'#ffffff',spacing:18});
  text(g,'Coral Bay Red · 口紅 ¥1,800',300,1190,{size:38,font:JP_SANS,colour:'#fff3ef',weight:'normal'});
  text(g,'ASAGAO COSMETICS · AUTUMN 1986',PW/2,1360,{size:26,colour:'#fff3ef',weight:'normal',spacing:6});
 },
 'asagao-uv'(g){
  g.fillStyle=lin(g,0,0,0,PH,[[0,'#bfe8ef'],[1,'#ffffff']]);g.fillRect(0,0,PW,PH);
  g.fillStyle='#ffd25a';g.beginPath();g.arc(760,300,150,0,7);g.fill();g.strokeStyle='#ffd25a';g.lineWidth=14;for(let i=0;i<12;i++){g.beginPath();g.moveTo(760+Math.cos(i*.52)*175,300+Math.sin(i*.52)*175);g.lineTo(760+Math.cos(i*.52)*215,300+Math.sin(i*.52)*215);g.stroke();}
  g.strokeStyle='#5fb6c8';g.lineWidth=8;for(let k=0;k<4;k++){g.beginPath();for(let x=0;x<=PW;x+=20)g.lineTo(x,1010+k*40+Math.sin(x/60+k)*12);g.stroke();}
  // The milk bottle.
  g.fillStyle=lin(g,360,0,640,0,[[0,'#e6eef0'],[.5,'#ffffff'],[1,'#cfdde1']]);roundRect(g,380,520,240,420,60);g.fill();g.fillStyle='#2f9bb3';roundRect(g,430,430,140,110,16);g.fill();
  text(g,'UV',500,720,{size:110,colour:'#2f9bb3'});text(g,'MILK',500,800,{size:60,colour:'#2f9bb3',spacing:10});
  text(g,'日焼けしない夏。',PW/2,250,{size:86,font:JP_SERIF,colour:'#20707f'});
  text(g,'ASAGAO UV MILK · SPF 20 · ¥1,200',PW/2,1240,{size:40,colour:'#20707f',spacing:3});
  text(g,'ASAGAO COSMETICS · SUMMER 1986',PW/2,1360,{size:26,colour:'#20707f',weight:'normal',spacing:6});
 },
};

/** The printed fronts of the cases, each drawn to its face's proportions. */
const CASES={
 'umineko-gift'(g,w,h){g.fillStyle='#f6f1e6';g.fillRect(0,0,w,h);g.fillStyle='#ffffff';g.fillRect(w*.38,0,w*.24,h);g.fillStyle='#c8202a';g.fillRect(0,h*.46,w,h*.08);text(g,'御歳暮',w/2,h*.4,{size:h*.3,font:JP_SERIF,colour:'#2b2622',max:w*.22});text(g,'UMINEKO',w*.18,h*.78,{size:h*.18,colour:'#38523d',max:w*.3});text(g,'24缶',w*.82,h*.78,{size:h*.2,font:JP_SANS,colour:'#38523d',max:w*.3});},
 'shimakaze-case'(g,w,h){g.fillStyle='#c49a6c';g.fillRect(0,0,w,h);g.strokeStyle='#2b3f6c';g.lineWidth=w*.03;g.strokeRect(w*.06,h*.05,w*.88,h*.9);vtext(g,'島風',w*.35,h*.12,{size:w*.24,colour:'#2b3f6c'});vtext(g,'泡盛',w*.68,h*.12,{size:w*.18,colour:'#2b3f6c'});text(g,'1.8L × 6',w/2,h*.9,{size:w*.12,colour:'#2b3f6c'});text(g,'ワレモノ',w/2,h*.78,{size:w*.09,font:JP_SANS,colour:'#c8202a'});},
 'tsuru-case'(g,w,h){g.fillStyle='#c49a6c';g.fillRect(0,0,w,h);g.fillStyle='#c8202a';g.beginPath();g.arc(w/2,h*.3,w*.22,0,7);g.fill();vtext(g,'港鶴',w*.5,h*.12,{size:w*.2,colour:'#22201d'});text(g,'純米 1.8L × 6',w/2,h*.9,{size:w*.11,font:JP_SANS,colour:'#22201d'});text(g,'ワレモノ',w/2,h*.78,{size:w*.09,font:JP_SANS,colour:'#c8202a'});},
 'kitano-case'(g,w,h){g.fillStyle='#3a2616';g.fillRect(0,0,w,h);text(g,'KITANO 12',w/2,h*.45,{size:h*.2,colour:'#e8c98a',max:w*.86});text(g,'PURE MALT · 700ml × 12',w/2,h*.65,{size:h*.08,colour:'#bfa577',max:w*.86,weight:'normal'});text(g,'ワレモノ注意',w/2,h*.88,{size:h*.08,font:JP_SANS,colour:'#e8c98a'});},
 'umineko-case'(g,w,h){g.fillStyle='#eddda0';g.fillRect(0,0,w,h);g.fillStyle='#38523d';g.fillRect(0,h*.78,w,h*.22);text(g,'UMINEKO',w*.3,h*.62,{size:h*.42,colour:'#38523d',max:w*.5});gull(g,w*.78,h*.36,h*.16,'#9f5433');text(g,'生 350ml × 24',w*.8,h*.68,{size:h*.16,font:JP_SANS,colour:'#9f5433',max:w*.32});},
 'black-case'(g,w,h){g.fillStyle='#24231f';g.fillRect(0,0,w,h);g.fillStyle='#c9a24a';g.fillRect(0,h*.82,w,h*.06);text(g,'UMINEKO BLACK',w*.36,h*.6,{size:h*.34,colour:'#c9a24a',max:w*.62});text(g,'黒 350ml × 24',w*.86,h*.6,{size:h*.14,font:JP_SANS,colour:'#efe4c8',max:w*.24});},
};

let posterTexture=null,caseTexture=null,posterReadiness=null,posterPrepared=false;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
// These module-cached atlases outlive any one room. The persistent shop and both storeys borrow their paint;
// clearRoom may dispose each room's material/geometry, but must leave these shared GPU textures alive.
const tex=c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.sharedAsset=true;return t;};
/** The nine designs on one sheet, three by three (one texture, one draw for every poster in a room). */
function posterSheet(){
 if(posterTexture)return posterTexture;
 const c=canvas(CELL[0]*COLS,CELL[1]*3),g=c.getContext('2d');
 SAKURA_TRADE_POSTERS.forEach((p,i)=>{g.save();g.translate((i%COLS)*CELL[0],Math.floor(i/COLS)*CELL[1]);g.scale(CELL[0]/PW,CELL[1]/PH);g.beginPath();g.rect(0,0,PW,PH);g.clip();DESIGNS[p.id](g);g.restore();});
 posterTexture=tex(c);
 // Small previews keep wall decoration cheap. The full original is loaded only when a player looks at that print.
 // Contain the 3:4 image inside B2 paper: no stretched lettering or cropped brand names.
 const loads=[];
 if(globalThis.Image)SAKURA_TRADE_POSTERS.forEach((p,i)=>{const art=SAKURA_TRADE_ART[p.id];if(!art)return;
  loads.push(new Promise(resolve=>{const image=new Image();let done=false;
   const finish=()=>{if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;resolve();};
   // A failed/offline image keeps its complete canvas design. Late responses after the deadline never swap art in view.
   const timer=setTimeout(finish,12000);
   image.onload=()=>{if(done)return;const x=(i%COLS)*CELL[0],y=Math.floor(i/COLS)*CELL[1],s=Math.min(CELL[0]/image.naturalWidth,CELL[1]/image.naturalHeight),w=image.naturalWidth*s,h=image.naturalHeight*s;
    g.fillStyle='#f3ecd8';g.fillRect(x,y,...CELL);g.drawImage(image,x+(CELL[0]-w)/2,y+(CELL[1]-h)/2,w,h);posterTexture.needsUpdate=true;finish();};
   image.onerror=finish;image.src=assetURL(art.preview);
  }));
 });
 posterReadiness=Promise.all(loads).then(()=>{posterPrepared=true;return true;});
 return posterTexture;
}
/** Room loading waits for previews before opening: no canvas-to-new-print swap in front of the player. */
export function preloadTradePosters(){posterSheet();return posterReadiness;}
export const tradePostersReady=()=>posterPrepared;
const CASE_CELL=256;
/** The case fronts, each in a 256 px square cell at its face's proportions. */
function caseSheet(){
 if(caseTexture)return caseTexture;
 const c=canvas(CASE_CELL*CASE_PRINTS.length,CASE_CELL),g=c.getContext('2d');
 CASE_PRINTS.forEach((id,i)=>{const r=caseRect(id);g.save();g.translate(i*CASE_CELL+r.x,r.y);g.beginPath();g.rect(0,0,r.w,r.h);g.clip();CASES[id](g,r.w,r.h);g.restore();});
 return caseTexture=tex(c);
}
function caseRect(id){const s=SAKURA_HALL_STOCK.find(c=>c.print===id),aspect=s.size[2]/s.size[1];
 const w=aspect>=1?CASE_CELL:CASE_CELL*aspect,h=aspect>=1?CASE_CELL/aspect:CASE_CELL;return {x:(CASE_CELL-w)/2,y:(CASE_CELL-h)/2,w,h};}

/** A plane's UVs moved into a region of a sheet ([u0, v0, u1, v1], v up). */
function into(g,[u0,v0,u1,v1]){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));return g;}
const posterUV=id=>{const i=SAKURA_TRADE_POSTERS.findIndex(p=>p.id===id),c=i%COLS,r=Math.floor(i/COLS);return [c/COLS,1-(r+1)/3,(c+1)/COLS,1-r/3];};
const caseUV=id=>{const i=CASE_PRINTS.indexOf(id),r=caseRect(id),W=CASE_CELL*CASE_PRINTS.length;return [(i*CASE_CELL+r.x)/W,1-(r.y+r.h)/CASE_CELL,(i*CASE_CELL+r.x+r.w)/W,1-r.y/CASE_CELL];};
/** A plane turned to face `face` ('+x', '-x', '+z', '-z'), its centre at `at`. */
function placed(g,face,[x,y,z]){
 const yaw={'+z':0,'-z':Math.PI,'+x':Math.PI/2,'-x':-Math.PI/2}[face];g.rotateY(yaw);g.translate(x,y,z);return g;
}
const out=face=>({'+z':[0,0,1],'-z':[0,0,-1],'+x':[1,0,0],'-x':[-1,0,0]})[face];
const decal=map=>new THREE.MeshStandardMaterial({map,roughness:.75,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});

/**
 * The posters of one room ('stair' or 'hall'), moved by `shift` (the office storey's frame for the stair). Returns the
 * paper, one mesh on the sheet (or null without a page), and the push pins' geometry for the caller's red plastic.
 */
export function buildTradePosters(room,{shift=[0,0,0],parent=null,register=null,onView=null}={}){
 const {w,h}=POSTER_SIZE,papers=[],pins=[];
 for(const p of SAKURA_POSTER_WALLS.filter(p=>p.room===room)){
  const n=out(p.face),at=[p.at[0]+shift[0]+n[0]*.001,p.at[1]+shift[1],p.at[2]+shift[2]+n[2]*.001];
  papers.push(placed(into(new THREE.PlaneGeometry(w,h),posterUV(p.id)),p.face,at));
  if(parent&&register&&onView){const anchor=new THREE.Object3D(),look=p.lookAt?.map((v,i)=>v+shift[i])||at;anchor.position.set(...look);anchor.name='Look at '+posterTitle(p.id)+' poster';anchor.userData.npcInteraction=false;parent.add(anchor);register(anchor,anchor.name,()=>onView(p.id),true);}
  for(const [a,b] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
   const head=new THREE.CylinderGeometry(.006,.006,.005,8);head.rotateX(Math.PI/2);head.translate(a*(w/2-.025),b*(h/2-.025),.0035);
   pins.push(placed(head,p.face,at));
  }
 }
 let paper=null;
 if(papers.length&&typeof document!=='undefined'&&document.createElement){
  paper=new THREE.Mesh(mergeAll(papers),decal(posterSheet()));paper.name=`Sakura trade posters · ${room}`;
 }else papers.forEach(g=>g.dispose());
 return {paper,pins};
}

/** Mount an atlas batch and one merged pin mesh; six new prints never become separate draw calls per sheet/pin. */
export function mountTradePosters(room,{parent,register,onView}){
 const {paper,pins}=buildTradePosters(room,{parent,register,onView});if(paper)parent.add(paper);
 if(pins.length){const mesh=new THREE.Mesh(mergeAll(pins),new THREE.MeshStandardMaterial({color:0xc23a2e,roughness:.83}));mesh.name=`Sakura poster pins · ${room}`;parent.add(mesh);}
}

/**
 * The hall's cases (office frame): cardboard by the office builder's `box` (merged with its other plain pieces), the
 * printed fronts as one decal mesh, each stack solid to the walk (`collider`).
 */
export function buildSakuraHallStock({room,box,collider}){
 const fronts=[];
 for(const s of SAKURA_HALL_STOCK){
  const [d,h,w]=s.size,[wx,z]=s.at,sg=s.face==='+x'?1:-1,x=wx+sg*d/2;
  for(let k=0;k<s.stack;k++){
   // Hand-stacked: a few millimetres out and along, a degree turned, never two cases in one plane.
   const dx=sg*(.004+.006*((k*7)%3)),dz=.008*(((k*5)%3)-1),yaw=.017*(((k*3)%3)-1),y=k*(h+.002)+h/2+.002;
   const m=box([d,h,w],[x+dx,y,z+dz],s.colour,'Hall stock case');m.rotation.y=yaw;
   const g=into(new THREE.PlaneGeometry(w*.98,h*.96),caseUV(s.print));g.rotateY(sg>0?Math.PI/2:-Math.PI/2);g.translate(sg*(d/2+.001),0,0);g.rotateY(yaw);g.translate(x+dx,y,z+dz);fronts.push(g);
  }
  collider(x,z,d+.03,w+.03,s.stack*(h+.002)+.01);
 }
 if(typeof document!=='undefined'&&document.createElement){const m=new THREE.Mesh(mergeAll(fronts),decal(caseSheet()));m.name='Hall stock case prints';room.add(m);}
}

function mergeAll(list){
 let n=0,idx=0;for(const g of list){n+=g.attributes.position.count;idx+=g.index?g.index.count:g.attributes.position.count;}
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),index=new Uint32Array(idx);let o=0,io=0;
 for(const g of list){const c=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  const ix=g.index?g.index.array:[...Array(c).keys()];for(let i=0;i<ix.length;i++)index[io+i]=ix[i]+o;io+=ix.length;o+=c;g.dispose();}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(pos,3));m.setAttribute('normal',new THREE.BufferAttribute(nor,3));m.setAttribute('uv',new THREE.BufferAttribute(uv,2));m.setIndex(new THREE.BufferAttribute(index,1));return m;
}
