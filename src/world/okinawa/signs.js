import {paint} from './kit.js';

/**
 * Hand-painted signs, drawn on canvases the way Sakura Crossing's textures.js draws its
 * plates: flat colour, a thick painted border, the name in big characters and a line of
 * small print. Okinawan shop signs of the nineties were sign-painter work, so each one
 * is a little off-square and none of them match.
 */
const SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const SANS='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';


export const SIGN_JAPANESE=Object.freeze({"Kissa Higa":"喫茶ひが","Coffee":"珈琲","Police box":"交番","Higa empty-bottle yard":"比嘉酒店 空き瓶置場","Coin laundry wall":"コインランドリー","Minato Harbour Park":"港公園","Fumoto": "麓", "Fumoto Co-op Store": "麓共同売店", "Ishigantō": "石敢當", "Telephone": "公衆電話", "Minato Port Terminal": "港湾ターミナル", "Departures": "出航案内", "Mainland ferry": "本土行きフェリー", "Airport ferry": "空港フェリー", "Evening boat to Naha": "那覇行き夕方便", "Tickets": "きっぷ", "Timetable": "時刻表", "Port warehouse": "港倉庫", "Sakura Shop": "さくら商店", "Sakura": "桜", "Fisheries cooperative": "漁業協同組合", "Ryukyu Cider": "琉球サイダー", "Mosquito coil": "蚊取り線香", "Security camera": "防犯カメラ", "Ferry Terminal": "フェリー乗り場", "Warehouse ←": "港倉庫 ←", "Telephone": "公衆電話", "Ice": "氷", "Ice making": "製氷", "Ice cream": "アイスクリーム", "Cold drinks": "冷たい飲み物", "Blue Coral": "ブルーコーラル", "Big catch": "大漁", "Tide table": "潮見表", "Johansson Shopping Street": "ヨハンソン商店街", "Island sandals": "島ぞうり", "Awamori South wind": "泡盛 南風", "Deigo Life Insurance": "でいご生命", "Minato Bank": "港銀行", "Harbour Travel": "みなと旅行", "Rainflower Florist": "雨花生花店", "Pocket Grocer": "まちの食品店", "Town Tailor": "町の仕立屋", "Secondhand Records": "中古レコード", "Blue Coral Ice Cream": "ブルーコーラル", "RAINFLOWER LANE": "雨花通り", "Welcome back": "おかえりなさい", "Izakaya Minato": "居酒屋みなと", "Ramen Sato": "らーめん佐藤", "Minato": "みなと", "Bookstore": "本屋", "Books": "本", "Repair": "修理", "Dock Electrical Workshop": "港の電気工房", "Maegeru Shobo/Printing": "前原書房・印刷", "Port Affairs and Technology Office": "港務技術事務所", "Ryukyu cuisine/Awamori": "琉球料理・泡盛", "Izakaya": "居酒屋", "Yakitori": "焼鳥", "Alcohol": "酒", "Oden": "おでん", "Assorted Yakitori": "焼鳥盛合せ", "Edamame": "枝豆", "Cold tofu": "冷奴", "Dashi-rolled egg": "だし巻き卵", "Grilled Atka mackerel": "ほっけ焼き", "Assorted sashimi": "刺身盛合せ", "Fried tofu": "揚げ出し豆腐", "Fried chicken": "唐揚げ", "Ochazuke": "お茶漬け", "Draft beer": "生ビール", "Bottled beer": "瓶ビール", "Awamori": "泡盛", "Sake": "日本酒", "Oolong tea": "烏龍茶", "Canned beer": "缶ビール", "Front-Row Books": "前原書房", "Police station": "警察署", "Minato Police Station": "港警察署", "Okinawa Prefectural Police": "沖縄県警察", "Okinawa Prefectural Police Minato Station": "沖縄県港警察署", "Reception": "受付", "Holding room": "保護室", "Toilet": "お手洗い", "Staff only": "関係者以外立入禁止", "Lost property": "落とし物", "Police vehicles only": "警察車両専用", "Police": "警察", "Emergency": "緊急", "Monthly parking": "月極駐車場", "Kitahama youth association": "北浜自治会", "Beware of habu": "ハブに注意", "Hinode Curry": "日の出カレー", "Kamejirushi Soy Sauce": "亀印醤油", "Hoshimaru Batteries": "星丸乾電池", "We deliver": "配達いたします", "Sakura Shop · Telephone 2-1103": "さくら商店　電話 2-1103", "Nakamura Zenzai": "中村ぜんざい", "Higa Liquor Store": "比嘉酒店", "Coin laundry": "コインランドリー", "Zenzai": "ぜんざい", "Nakamura": "中村", "Sata andagi": "アンダギー", "Blue Coral ice cream": "アイスクリーム", "Green tea": "お茶", "Cold island soda": "サイダー", "Minato Town Hall": "港町役場", "Minato Town Hall · Community Centre": "港町役場・公民館", "Entrance": "玄関", "Warehouse": "倉庫", "Classroom": "教室", "Community Kitchen": "調理室", "Meeting room": "会議室", "Clinic": "診療所", "Doctor’s residence": "医師住宅", "Minato Power Station": "港町発電所", "Minato Elementary School": "港小学校", "Minato Elementary and Junior High School": "港小中学校", "Minato Community Hall": "港町公民館", "Minato Clinic": "港町診療所"});
export const japaneseSign=text=>SIGN_JAPANESE[text]||text;
/** Fit lettering by measured width rather than squeezing long words. */
export function signText(ctx,text,x,y,maxWidth,size,font=SANS){
 let fitted=size;ctx.font=`bold ${fitted}px ${font}`;
 while(fitted>10&&ctx.measureText(text).width>maxWidth){fitted--;ctx.font=`bold ${fitted}px ${font}`;}
 ctx.fillText(text,x,y,maxWidth);return fitted;
}

/** The long board over a shopfront. */
export function fascia({jp,en,bg='#f3ead2',ink='#23313a',accent='#b8432f',mark=''}={}){
 jp=japaneseSign(jp);mark=japaneseSign(mark);
 return paint(1024,192,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  // Sun and salt: a paler band along the top edge, and a few rust runs from the fixings.
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(0,0,w,h*.22);
  ctx.fillStyle='rgba(120,70,40,.22)';for(const x of [40,w-44])ctx.fillRect(x,8,5,h*.55);
  ctx.strokeStyle=accent;ctx.lineWidth=12;ctx.strokeRect(10,10,w-20,h-20);
  ctx.fillStyle=ink;ctx.textBaseline='middle';ctx.textAlign='center';
  const left=mark?120:0;
  if(mark){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(96,h/2,58,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=bg;ctx.font=`bold 70px ${SANS}`;signText(ctx,mark,96,h/2+3,100,70);ctx.fillStyle=ink;}
  ctx.font=`bold ${Math.min(104,Math.floor((w-left-80)/Math.max(1,[...jp].length)*.92))}px ${SERIF}`;
  signText(ctx,jp,(w+left)/2,h*.44,w-left-80,104,SERIF);
  if(en){ctx.font=`bold 26px ${SANS}`;ctx.fillStyle=accent;signText(ctx,en.toUpperCase(),(w+left)/2,h*.84,w-left-80,26);}
 });
}

/** A tall board on the corner of a building, read from up the street. */
export function vertical({jp,bg='#b8432f',ink='#fff6e0'}={}){
 jp=japaneseSign(jp);
 return paint(128,512,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.strokeRect(8,8,w-16,h-16);
  const chars=[...jp],size=Math.min(96,Math.floor((h-60)/chars.length*.9));
  ctx.fillStyle=ink;ctx.font=`bold ${size}px ${SERIF}`;ctx.textAlign='center';ctx.textBaseline='middle';
  chars.forEach((c,i)=>ctx.fillText(c,w/2,30+(i+.5)*(h-60)/chars.length));
 });
}

/** A family's name on a small wooden plate by the gate (表札). */
export function nameplate(family,romaji){
 return paint(256,128,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#c9a877');g.addColorStop(1,'#b8925f');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(90,60,30,.35)';ctx.lineWidth=2;
  for(let y=14;y<h;y+=17){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.3,y+4,w*.6,y-4,w,y+2);ctx.stroke();}
  ctx.fillStyle='#2a1e14';ctx.textAlign='center';ctx.textBaseline='middle';
  signText(ctx,family,w/2,h*.4,w-20,48,SERIF);
  signText(ctx,romaji.toUpperCase(),w/2,h*.8,w-20,25,SANS);
 });
}

/** The shaved-ice flag: 氷 in red on white over blue waves. */
export function iceFlag(){
 return paint(128,384,(ctx,w,h)=>{
  ctx.fillStyle='#fbf8f0';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#2f6fb8';
  for(let i=0;i<4;i++){const y=h*.72+i*18;ctx.beginPath();ctx.moveTo(0,y);
   for(let x=0;x<=w;x+=16)ctx.quadraticCurveTo(x+8,y-12,x+16,y);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();}
  ctx.fillStyle='#d42a2a';ctx.font=`bold 104px ${SERIF}`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText("氷",w/2,h*.32);
  ctx.fillStyle='#2f6fb8';ctx.font=`bold 26px ${SANS}`;signText(ctx,"SHAVED ICE",w/2,h*.56,w-12,19);
 });
}

/** A poster or notice: a coloured sheet with a headline, pinned to a wall. */
export function poster({title,lines=[],bg='#f4e7c4',ink='#2b2b2b',band='#d0572f'}={}){
 return paint(256,360,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=band;ctx.fillRect(0,0,w,70);
  ctx.fillStyle='#fff';ctx.font=`bold 40px ${SANS}`;ctx.textAlign='center';ctx.textBaseline='middle';signText(ctx,japaneseSign(title),w/2,36,w-24,40);
  ctx.fillStyle=ink;ctx.font=`bold 24px ${SANS}`;
  lines.forEach((line,i)=>signText(ctx,line,w/2,112+i*40,w-28,24));
 });
}

/**
 * Coral stone as it is laid in Okinawan walls: irregular blocks, dry-fitted, in pale
 * greys and creams with dark shadowed joints and a fine pitted face.
 */
export function coralStone(){
 return paint(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#6f6858';ctx.fillRect(0,0,w,h);                       // the joints
  let seed=7;const r=()=>(seed=seed*16807%2147483647)/2147483647;
  const rows=5,rowH=h/rows;
  for(let row=0;row<rows;row++){
   let x=-r()*30;
   while(x<w){
    const bw=34+r()*38,y0=row*rowH+2+r()*3,y1=(row+1)*rowH-2-r()*3;
    const t=196+Math.floor(r()*36),warm=Math.floor(r()*10);
    ctx.fillStyle=`rgb(${t+warm},${t+warm-4},${t-18})`;
    // An irregular polygon, so the courses are rough rather than bricklaid.
    ctx.beginPath();
    ctx.moveTo(x+2+r()*4,y0+r()*4);ctx.lineTo(x+bw-2-r()*4,y0+r()*3);
    ctx.lineTo(x+bw-1-r()*3,(y0+y1)/2+(r()-.5)*6);ctx.lineTo(x+bw-3-r()*4,y1-r()*3);
    ctx.lineTo(x+3+r()*4,y1-r()*4);ctx.lineTo(x+1+r()*3,(y0+y1)/2+(r()-.5)*6);ctx.closePath();ctx.fill();
    // Light from above: a paler top edge and a darker foot to every stone.
    ctx.fillStyle='rgba(255,255,245,.25)';ctx.fillRect(x+4,y0+2,bw-8,3);
    ctx.fillStyle='rgba(60,50,35,.18)';ctx.fillRect(x+4,y1-5,bw-8,4);
    // The fine pits of old coral.
    for(let i=0;i<9;i++){ctx.fillStyle=`rgba(90,82,66,${.2+r()*.25})`;ctx.fillRect(x+4+r()*(bw-8),y0+4+r()*(y1-y0-8),1+r()*2,1+r()*2);}
    x+=bw;
   }
  }
 });
}

/** Red pantiles in rows, with the white lime pointing between them. */
export function roofTile(){
 return paint(128,128,(ctx,w,h)=>{
  ctx.fillStyle='#f0ebe0';ctx.fillRect(0,0,w,h);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x=col*32+(row%2)*16,y=row*32;
   ctx.fillStyle=(row+col)%3?'#cf6446':'#c05a3e';
   ctx.beginPath();ctx.ellipse(x+16,y+17,14,13,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(255,220,190,.35)';ctx.beginPath();ctx.ellipse(x+12,y+12,6,4,-.4,0,Math.PI*2);ctx.fill();
   if(x+16>w){ctx.fillStyle=(row+col)%3?'#cf6446':'#c05a3e';ctx.beginPath();ctx.ellipse(x+16-w,y+17,14,13,0,0,Math.PI*2);ctx.fill();}
  }
 });
}

/** Flower blocks (hana-burokku): a grid of pierced concrete blocks. */
export function flowerBlock(){
 return paint(128,128,(ctx,w,h)=>{
  ctx.fillStyle='#e6e0d2';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#bdb5a4';ctx.lineWidth=3;ctx.strokeRect(1,1,w-2,h-2);
  ctx.fillStyle='#4a4a44';
  for(const [x,y] of [[32,32],[96,32],[32,96],[96,96]]){
   ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#e6e0d2';
  for(const [x,y] of [[32,32],[96,32],[32,96],[96,96]]){ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();}
 });
}

/** Packed sand and crushed coral: the ground of a yard or lane. */
export function coralSand(){
 return paint(256,256,(ctx,w,h)=>{
  // Near-white and near-neutral: the ground palette (render/ground-palette.js) sets the
  // tone, so the same grit reads as bleached coral, beach sand or grove gravel.
  ctx.fillStyle='#f1ede4';ctx.fillRect(0,0,w,h);
  let seed=11;const r=()=>(seed=seed*16807%2147483647)/2147483647;
  for(let i=0;i<1400;i++){const t=218+Math.floor(r()*36);ctx.fillStyle=`rgba(${t},${t-3},${t-10},.8)`;ctx.fillRect(r()*w,r()*h,1+r()*3,1+r()*3);}
  for(let i=0;i<120;i++){ctx.fillStyle='rgba(150,142,126,.3)';ctx.beginPath();ctx.arc(r()*w,r()*h,1+r()*2,0,Math.PI*2);ctx.fill();}
 });
}

/** A painted wall advert for island ice cream, the kind every shop side wall had. */
export function iceMural(){
 return paint(1024,300,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2d7fb8');g.addColorStop(1,'#1f5f94');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(90+i*170,h+40,120,0,Math.PI*2);ctx.fill();}
  // The cone and three scoops.
  ctx.fillStyle='#d9a45a';ctx.beginPath();ctx.moveTo(110,150);ctx.lineTo(190,150);ctx.lineTo(150,285);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#a8763a';ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(118+i*16,150);ctx.lineTo(150,280);ctx.stroke();}
  for(const [x,y,c] of [[130,135,'#f6efe0'],[172,132,'#e98aa6'],[151,95,'#8a5a3c']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,34,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.font='bold 92px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';signText(ctx,"ブルーコーラル",250,105,w-275,82);
  ctx.font='bold 54px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';ctx.fillText("アイスクリーム",254,190);
  ctx.fillStyle='#ffd45a';ctx.font='bold 30px sans-serif';ctx.fillText('BLUE CORAL ICE CREAM · OKINAWA · SINCE 1963',254,256);
  ctx.strokeStyle='#f3ead2';ctx.lineWidth=10;ctx.strokeRect(8,8,w-16,h-16);
 });
}

/** An enamel tin advert, rusting at the corners. */
export function enamel({jp,en,bg='#f1e6c8',ink='#b8302a'}={}){
 jp=japaneseSign(jp);
 return paint(256,384,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=ink;ctx.lineWidth=10;ctx.strokeRect(12,12,w-24,h-24);
  const chars=[...jp],size=Math.min(84,Math.floor((h-110)/chars.length*.92));
  ctx.fillStyle=ink;ctx.font=`bold ${size}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  chars.forEach((c,i)=>ctx.fillText(c,w/2,40+(i+.5)*(h-110)/chars.length));
  ctx.font='bold 20px sans-serif';signText(ctx,en.toUpperCase(),w/2,h-44,w-40,20);
  ctx.fillStyle='rgba(120,60,30,.55)';for(const [x,y] of [[16,16],[w-26,20],[20,h-28],[w-30,h-24]]){ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();}
 });
}

/**
 * A cotton banner (横断幕) for a shop's own notice, tied to the wall at its four corners: the notice in big brush
 * letters, a line of small print under it, a coloured band along the top and the bottom, the eyelets in the corners.
 */
export function clothBanner({jp,sub='',en='',bg='#f6f1e3',ink='#b8302a',band='#23417a'}={}){
 jp=japaneseSign(jp);sub=japaneseSign(sub);
 return paint(1024,256,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=band;ctx.fillRect(0,0,w,18);ctx.fillRect(0,h-18,w,18);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
  signText(ctx,jp,w/2,h*.42,w-140,118,SERIF);
  ctx.fillStyle=band;if(sub)signText(ctx,sub,w/2,h*.76,w-200,34);
  if(en){ctx.font=`bold 20px ${SANS}`;ctx.fillText(en.toUpperCase(),w/2,h*.9);}
  // Folds from being tied up tight, and the eyelets.
  ctx.fillStyle='rgba(90,70,40,.08)';for(const x of [w*.27,w*.52,w*.78])ctx.fillRect(x,18,6,h-36);
  ctx.fillStyle='#8a8f92';for(const [x,y] of [[22,32],[w-22,32],[22,h-32],[w-22,h-32]]){ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}
 });
}

/** A tairyō-bata, the big-catch flag a boat flies coming home: loud colours, a crane. */
export function catchFlag(seed=0){
 const palettes=[['#d8342c','#f4d23c','#1f5fa8'],['#1f5fa8','#f4f0e4','#d8342c'],['#f4d23c','#d8342c','#2a8a5a']];
 const [a,b,c]=palettes[seed%palettes.length];
 return paint(384,256,(ctx,w,h)=>{
  ctx.fillStyle=a;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=b;ctx.beginPath();ctx.arc(w*.72,h*.42,70,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=c;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,h*.7+i*18);for(let x=0;x<=w;x+=24)ctx.quadraticCurveTo(x+12,h*.62+i*18,x+24,h*.7+i*18);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();}
  ctx.fillStyle='#fff';ctx.font='bold 76px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText("大漁",w*.34,h*.4);
 });
}

/**
 * A painted wall advertisement, the kind sign-writers put on the blank side of a
 * shop-house in the sixties and seventies and nobody painted over: a big panel of
 * colour, the product in huge characters, a slogan, and twenty years of sun. Reds fade
 * first, so the whole panel drifts toward cyan and chalk; the paint flakes at the
 * edges. Every brand here is invented.
 */
export const WALL_ADS=Object.freeze([
 {jp:"Ryukyu Cider",en:'RYUKYU CIDER',line:"It's cold",bg:'#2f6f9f',ink:'#fff6e0',accent:'#e0b23c'},
 {jp:"Minato Bank",en:'MINATO BANK',line:"With the port",bg:'#e9e1cc',ink:'#1f4e6b',accent:'#c8432f'},
 {jp:"Island sandals",en:'SHIMA ZORI',line:"Easy to wear",bg:'#c8432f',ink:'#fff6e0',accent:'#f2d36b'},
 {jp:"Awamori South wind",en:'AWAMORI HAEE',line:"Island sake",bg:'#1f3a34',ink:'#f3ead2',accent:'#d9a441'},
 {jp:"Deigo Life Insurance",en:'DEIGO LIFE',line:"Family peace of mind",bg:'#f1e6c8',ink:'#b8302a',accent:'#3f7f86'},
]);
export function wallAd({jp,en,line='',bg,ink,accent}=WALL_ADS[0],seed=1){
 return paint(512,704,(ctx,w,h)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=accent;ctx.lineWidth=18;ctx.strokeRect(22,22,w-44,h-44);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
  const chars=[...japaneseSign(jp)].filter(c=>c!==' '),size=Math.min(150,Math.floor((h-260)/chars.length));
  ctx.font=`bold ${size}px ${SERIF}`;
  chars.forEach((c,i)=>ctx.fillText(c,w/2,90+size*.55+i*size));
  ctx.font=`bold 34px ${SANS}`;ctx.fillStyle=accent;signText(ctx,line,w/2,h-118,w-72,34);
  ctx.font=`bold 30px ${SANS}`;ctx.fillStyle=ink;signText(ctx,en,w/2,h-64,w-72,30);
  // Twenty years of sun: a chalky wash, stronger toward the top, that pulls every
  // colour toward cyan-white; then flaking at the edges where the render shows through.
  const fade=ctx.createLinearGradient(0,0,0,h);fade.addColorStop(0,'rgba(214,236,236,.42)');fade.addColorStop(1,'rgba(214,236,236,.16)');
  ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);
  let s=seed*9301+49297;const r=()=>(s=(s*9301+49297)%233280)/233280;
  ctx.fillStyle='rgba(226,220,204,.85)';
  for(let i=0;i<46;i++){const edge=r()<.5,x=edge?(r()<.5?r()*40:w-r()*40):r()*w,y=edge?r()*h:(r()<.5?r()*36:h-r()*36);ctx.beginPath();ctx.ellipse(x,y,6+r()*18,4+r()*10,r()*3,0,Math.PI*2);ctx.fill();}
 });
}
