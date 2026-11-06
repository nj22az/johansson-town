import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import {ONSEN_SIGNS} from './onsen-signs.js';
import {CHAIR} from './onsen-chair.js';

// The coin massage chair's right arm pad (onsen-chair.js, the card's right-arm-top anchor): its flat top, at 0.71.
const ARM=CHAIR.anchor('right-arm-top');

/**
 * Umi-no-yu's small things, each with a person who uses it and a reason it is where it is:
 *
 * - the straw jar on top of the milk cooler (who drinks bottled milk through a straw, and
 *   where Tetsuo finds his straws to explain the circuits);
 * - the uchiwa rack on the lobby wall by the tatami (summer fans for people cooling down
 *   after the bath; the giant Hārī fan Fujita takes to the noren);
 * - Miss Higa's rubber plant in the changing room, by the frosted bath door where the light
 *   from the bath hall's sea glass comes through, a step from the right-hand mirror's dryer;
 * - Miss Higa's account book, open on the bandai in front of her, with its pencil;
 * - the men's side's small vanity: one mirror on a wall shelf, a bottle of hair tonic and a comb sterilizer
 *   glowing blue (plugged into its own socket on the lobby circuit, onsen-electrics.js);
 * - Miss Higa's noren pole on two hooks on the wall behind her stool;
 * - the box of white extension cords on the bandai's floor, beside her stool;
 * - and, only when a story sets it (stage), three coffee milks on the massage chair's arm: Fujita's offering.
 *
 * Everything is data first (ONSEN_PROPS): where it stands, what it stands on, who it is
 * for and why, what it is made of in the period. The builder only draws the data, and
 * names every part, so the film can hide what a hand takes (HIDE by name) and the tests
 * can check that each thing rests on its surface and keeps out of the way.
 *
 * Light for phones: flat colours or one small canvas each, parts that never move merged
 * into one mesh per material. Room frame as in onsen.js: street door at +z, sea at -z,
 * metres, floor at y = 0.
 */
const plain=o=>Object.freeze(o);

/** Milk cooler top (onsen-lobby.js): the cabinet's 0.3 m lid box centred at y 1.45. */
const COOLER_TOP=1.6;
/** The lobby face of the wall between the lobby and the changing room (onsen.js: a 0.12 m wall centred on z 1.6). */
const LOBBY_WALL=1.66;
/** The same wall's face on the changing-room side. */
const CHANGING_WALL=1.54;

export const ONSEN_PROPS=Object.freeze({
 strawJar:plain({id:'straw-jar',name:'Straw jar',jp:'ストロー',
  at:Object.freeze([4.47,COOLER_TOP,2.45]),on:'Milk cooler top',r:.042,h:.11,
  for:'Children, who drink their fruit milk through a straw, and the old regulars with dentures; anyone who wants their coffee milk slowly.',
  why:'On the cooler’s lid, at the back corner by the wall: you take a bottle and a straw in one movement, and nobody knocks the jar over reaching for the door.',
  period:'A squat glass jar, the kind jam came in, full of striped plastic straws: by the 1980s Japanese straws were plastic, not paper (a box of them came in paper sleeves, which Miss Higa throws away). The thin ones for milk, a few thin stirrer straws from the coffee counter at Sakura Shōten, and two fat milkshake straws left over from a summer.',
  straws:Object.freeze([
   plain({kind:'thin',count:8,r:.0032,len:.21,stripe:'red',en:'Ordinary 6 mm straws, red-striped'}),
   plain({kind:'thinner',count:3,r:.0021,len:.18,stripe:'green',en:'Thin 4 mm stirrer straws, green-striped'}),
   plain({kind:'fat',count:2,r:.006,len:.23,stripe:'blue',en:'Fat 12 mm milkshake straws, blue-striped'}),
  ]),
  // Page 8 of "Fujita's Ten Minutes of Heaven": three thin (a dryer each, 12 A), one thinner (the chair, 2 A), one fat
  // (the main). They stand together in the jar as "Straws Tetsuo takes", so the film hides them in one word once he has them.
  takes:plain({thin:3,thinner:1,fat:1,group:'Straws Tetsuo takes',
   why:'Tetsuo shows the circuits with straws: a straw carries only so much, like a wire. The second fat straw stays in the jar.'})}),

 uchiwaRack:plain({id:'uchiwa-rack',name:'Uchiwa rack',jp:'うちわ差し',
  // The pocket: its back on the wall, its bottom above the wainscot rail (top at y 0.945).
  pocket:plain({x:1.23,y:1.02,wallZ:LOBBY_WALL,w:.3,h:.15,d:.07}),
  fan:plain({r:.115,handle:.16}),
  // Where each fan's handle stands on the pocket's floor (x), its lean in the wall's plane, and its distance off the wall.
  fans:Object.freeze([['goldfish',1.14,.24,.022],['asagao',1.2,.08,.032],['hanabi',1.26,-.08,.042],['sakura-ad',1.32,-.24,.052]].map(([id,x,lean,off])=>plain({id,x,lean,off}))),
  // The giant one rests on two pegs, its face against the wall.
  giant:plain({id:'harii',name:'Giant uchiwa',x:1.8,y:1.78,r:.23,handle:.3,off:.015,pegs:Object.freeze([-140,-40])}),
  for:'Bathers cooling down after a 42-degree bath: on the tatami, in the massage chair, standing with a coffee milk.',
  why:'On the lobby wall at the tatami’s end, above the wainscot, between the noren and the travel poster: in reach from the tatami and from the way out, and flat to the wall, so it is in nobody’s path and nobody sits under it.',
  period:'A bamboo wall pocket for fans (うちわ差し) was in every 1980s house and shop; in summer the bathhouse filled it with free fans: prints of goldfish, morning glories and fireworks, and the shops’ giveaway fans with their names on.'}),

 plant:plain({id:'rubber-plant',name:'Rubber plant',jp:'ゴムの木',
  at:Object.freeze([-1.19,0,-.9]),on:'Umi-no-yu floor',pot:plain({r0:.1,r1:.13,h:.26}),saucer:plain({r:.15,h:.02}),stem:.95,spread:.2,
  for:'Miss Higa, who has kept it alive for twelve years; and, one evening, Thuan.',
  why:'The changing room has no window to the street (it is the middle of the house), so the brightest place is beside the frosted bath door, where the light of the bath hall’s sea glass comes through. That puts it a step from the right-hand mirror’s dryer, out of the doorway and clear of the vanity and its mirrors.',
  period:'The rubber plant (インドゴムの木) in a glazed pot on a saucer was the houseplant of Shōwa homes, offices and bathhouses: it survives steam, neglect and the occasional hair dryer. The pot is Okinawan yachimun, green glaze from the Tsuboya kilns.'}),

 menVanity:plain({id:'men-vanity',name:'Men’s vanity',jp:'洗面台',
  // A mirror over a wall shelf on the men's side of the bandai wall, between the noren and the fan.
  wallZ:CHANGING_WALL,x:2.95,mirror:plain({w:.6,h:.75,y:1.42}),shelf:plain({w:.9,d:.2,y:1,t:.03}),
  tonic:plain({x:2.66,r:.03,h:.17,jp:'ヘアトニック',brand:'潮風',en:'Shiokaze hair tonic'}),
  sterilizer:plain({x:3.1,w:.2,h:.12,d:.1,jp:'くし消毒器',en:'Comb sterilizer'}),
  socket:plain({x:3.33,y:1.12,name:'Men’s vanity socket'}),
  for:'The men after the bath: a comb through the hair and a splash of tonic before they go back out to the lobby and the night game.',
  why:'On the men’s side of the bandai wall, beside the doorway and out of the walk from the noren to the baskets and the bath door: one mirror is enough for the men’s side (the women’s side has three, with the dryers). Its socket is a spur off the television’s through the wall, on the lobby circuit, like the fan’s, so the sterilizer never shares the dryers’ breaker.',
  period:'A Shōwa men’s changing room had a mirror, a big bottle of green hair tonic for anyone to use, and a small ultraviolet comb sterilizer (くし消毒器) with a blue window and the house combs standing in it. The tonic is an invented island brand, 潮風 (sea breeze).'}),

 norenPole:plain({id:'noren-pole',name:'Noren pole',jp:'暖簾掛け棒',
  // Along the west wall behind the stool, above the wainscot rail (top 0.945) and under the breaker board (bottom 1.2).
  wallX:-4.94,y:1,z0:1.75,len:1.45,r:.014,hooks:Object.freeze([1.95,3]),off:.04,nodes:Object.freeze([.22,.55,.88,1.21]),
  reach:plain({from:Object.freeze([-4.5,1.15,2.6]),arm:.75,why:'Her shoulder on the stool (onsen-electrics.js ONSEN_BOARD.keeper) to the pole on the wall behind her: she takes it down without standing up.'}),
  for:'Miss Higa: she hangs the street noren out with it at opening and lifts it in at ten, and from her stool she nudges the changing-room noren straight with it without looking up.',
  why:'On two brass hooks on the wall right behind her stool, along the wall above the wainscot rail and under the breaker board: in reach of her hand from the stool and of nobody else’s, and flat to the wall, so it is in nobody’s way.',
  period:'A length of madake bamboo with its nodes and a brass hook (鉤) bound on at the tip with wire: the noren pole every shop with a noren kept by the door. 1.45 m: from the step it reaches the rod over the street door, and it fits behind the bandai.'}),

 extensionCords:plain({id:'extension-cords',name:'Extension cord box',jp:'延長コード',
  // On the bandai's raised floor (top 0.35), at the street end beside her stool: under the counter's height, clear of her feet.
  at:Object.freeze([-4.46,.35,3.1]),on:'Bandai platform',box:plain({w:.52,d:.24,h:.12,t:.012}),
  cords:Object.freeze([1,2,3].map(n=>plain({n,metres:5,amps:15,volts:125,colour:0xf3f1ea,name:'Extension cord '+n,
   use:plain({from:'Vanity socket '+n,to:'Massage chair'})}))),
  for:'The house: the floor polisher at closing, the summer festival’s lanterns out on the porch, the New Year mochi machine on the tatami; and on page 10, the three dryers at the massage chair, each from its own mirror’s socket.',
  why:'Miss Higa keeps the bath’s odds where she sits, so nobody borrows them without asking: a box on the bandai’s floor, under the counter, at the street end beside her stool and clear of her feet. Three cords because the bath has three sockets that matter: the three mirrors.',
  period:'White two-core cords, 5 m each, with a moulded two-pin plug and a single socket on the end, rated 15 A 125 V on a paper tag: the cord every 1980s hardware shop sold. Each one carries one dryer (12 A) well inside its 15 A; a three-way reel with all three dryers on it would carry 36 A, which is why there are three.'}),

 offering:plain({id:'milk-offering',name:'Coffee milk offering',jp:'コーヒー牛乳',
  on:'Coin massage chair',z:ARM[2],top:ARM[1],xs:Object.freeze([4.33,4.45,4.57]),states:Object.freeze(['none','full','empty']),
  bottle:plain({r:.028,h:.133,neck:.021}),
  for:'Mr Fujita: three coffee milks lined up on the chair’s arm as an offering before his ten minutes (page 1); on page 10 Miss Higa pays his ¥300 back in three coffee milks, and in the last panel the three stand there empty, lined up like offerings.',
  why:'On the right arm’s flat vinyl pad, behind the coin box and in a row towards the backrest, so a sitter’s elbow does not knock them over and the coin slot stays free. Only there when a story puts them there (stage): nobody leaves milk on the chair otherwise.',
  period:'Glass 180 ml bottles of coffee milk (コーヒー牛乳) with paper caps, ¥100 each from the lobby cooler: drunk standing, hand on hip, after the bath. Empty, they keep a brown film at the bottom until they go back in the crate.'}),

 accountBook:plain({id:'account-book',name:'Account book',jp:ONSEN_SIGNS.ledger.jp,
  at:Object.freeze([-3.98,FURNITURE_HEIGHTS.serviceCounter,2.62]),on:'Bandai top',yaw:-.08,w:.19,d:.28,
  for:'Miss Higa, who does the day’s takings on the bandai every evening and never looks up from it.',
  why:'Open on the counter right in front of her stool, the top of the page away from her: within reach of her pencil and the ticket tray, under the andon’s light, and too low to come between her face and the people paying.',
  period:'A cloth-bound cash book (金銭出納帳) with columns for date, item, in, out and balance, written in pencil; a green-painted pencil sharpened with a knife.'}),
});

/** A small canvas texture, or null without a page (the room tests), when the plain colour stands in. */
function paint(w,h,draw){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext?.('2d');if(!ctx||!ctx.fillRect)return null;
 draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const GOTHIC='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const HAND='"Klee One","Hiragino Maru Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';

/** The fans' faces in one 512 x 256 atlas: the giant Hārī fan on the left half, the four hand fans in the right half's quarters. */
const FAN_CELLS={harii:[0,0,.5,1],goldfish:[.5,.5,.25,.5],asagao:[.75,.5,.25,.5],hanabi:[.5,0,.25,.5],'sakura-ad':[.75,0,.25,.5]};
function fanAtlas(){
 const S=ONSEN_SIGNS.uchiwa,sign=id=>S.find(s=>s.id===id);
 return paint(512,256,(ctx)=>{
  const face=(x0,y0,size,bg,draw)=>{const cx=x0+size/2,cy=y0+size/2,r=size/2-2;ctx.save();ctx.fillStyle=bg;ctx.fillRect(x0,y0,size,size);ctx.translate(cx,cy);draw(r);
   // The bamboo ribs show through the paper, and the rim is bound with a paper strip.
   ctx.strokeStyle='rgba(120,90,40,.22)';ctx.lineWidth=1;for(let i=0;i<24;i++){const a=Math.PI*(.15+.7*i/23);ctx.beginPath();ctx.moveTo(0,r*.86);ctx.lineTo(-Math.cos(a)*r,r*.86-Math.sin(a)*r*1.86);ctx.stroke();}
   ctx.strokeStyle='rgba(60,40,20,.55)';ctx.lineWidth=Math.max(3,size*.03);ctx.beginPath();ctx.arc(0,0,r-ctx.lineWidth/2,0,Math.PI*2);ctx.stroke();ctx.restore();};
  const text=(t,x,y,px,color,font=MINCHO)=>{ctx.fillStyle=color;ctx.font=`bold ${px}px ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x,y);};
  // Giant: red, a white sun, a dragon boat on the waves, ハーリー, and the sponsor's line.
  face(0,0,256,'#c8382e',r=>{ctx.fillStyle='#f6efe0';ctx.beginPath();ctx.arc(0,-r*.32,r*.36,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#1f3558';ctx.beginPath();ctx.moveTo(-r*.62,r*.1);ctx.quadraticCurveTo(0,r*.32,r*.62,r*.1);ctx.lineTo(r*.5,r*.02);ctx.lineTo(-r*.5,r*.02);ctx.closePath();ctx.fill();
   ctx.fillStyle='#f2c14e';ctx.beginPath();ctx.moveTo(r*.5,r*.02);ctx.lineTo(r*.72,-r*.16);ctx.lineTo(r*.62,r*.1);ctx.closePath();ctx.fill();
   for(let i=0;i<5;i++){ctx.fillStyle='#f6efe0';ctx.beginPath();ctx.arc(-r*.36+i*r*.17,-r*.02,r*.045,0,Math.PI*2);ctx.fill();}
   ctx.strokeStyle='#f6efe0';ctx.lineWidth=4;for(const y of [.24,.36]){ctx.beginPath();for(let x=-.7;x<=.7;x+=.05)ctx.lineTo(x*r,(y+Math.sin(x*14)*.025)*r);ctx.stroke();}
   const g=sign('harii');text(g.jp,0,-r*.32,r*.2,'#c8382e');text(g.sub,0,r*.58,r*.13,'#f6efe0',GOTHIC);});
  // Goldfish: two red fish and bubbles in pale water.
  face(256,0,128,'#cfe8ee',r=>{for(const [x,y,s,flip] of [[-.25,-.15,1,1],[.22,.22,.8,-1]]){ctx.save();ctx.translate(x*r,y*r);ctx.scale(flip*s,s);ctx.fillStyle='#e0452c';ctx.beginPath();ctx.ellipse(0,0,r*.24,r*.14,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(r*.18,0);ctx.lineTo(r*.42,-r*.16);ctx.lineTo(r*.38,r*.16);ctx.closePath();ctx.fill();ctx.fillStyle='#1d1d1d';ctx.beginPath();ctx.arc(-r*.13,-r*.03,r*.025,0,Math.PI*2);ctx.fill();ctx.restore();}
   ctx.strokeStyle='#8ab6c4';ctx.lineWidth=2;for(const [x,y,s] of [[-.5,-.5,.05],[-.42,-.62,.035],[.4,-.4,.04]]){ctx.beginPath();ctx.arc(x*r,y*r,s*r,0,Math.PI*2);ctx.stroke();}});
  // Morning glories: indigo and violet trumpets with pale throats, heart leaves.
  face(384,0,128,'#f6f1e4',r=>{ctx.fillStyle='#5f8a4a';for(const [x,y] of [[.35,.3],[-.4,.35],[.05,-.5]]){ctx.beginPath();ctx.ellipse(x*r,y*r,r*.16,r*.11,.6,0,Math.PI*2);ctx.fill();}
   for(const [x,y,c] of [[-.22,-.12,'#3b4fa8'],[.25,-.05,'#7a4aa8'],[-.02,.32,'#3b4fa8']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*r,y*r,r*.24,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f6f1e4';ctx.beginPath();ctx.arc(x*r,y*r,r*.08,0,Math.PI*2);ctx.fill();}});
  // Fireworks: three bursts over a dark harbour.
  face(256,128,128,'#1c2747',r=>{for(const [x,y,s,c] of [[-.25,-.25,.32,'#f2c14e'],[.3,-.05,.26,'#ee6a8a'],[-.05,.35,.22,'#9fe0e8']]){ctx.strokeStyle=c;ctx.lineWidth=2.5;for(let i=0;i<14;i++){const a=i/14*Math.PI*2;ctx.beginPath();ctx.moveTo((x+Math.cos(a)*s*.25)*r,(y+Math.sin(a)*s*.25)*r);ctx.lineTo((x+Math.cos(a)*s)*r,(y+Math.sin(a)*s)*r);ctx.stroke();}}});
  // Sakura Shōten's giveaway: cream, a red band, the shop's name and what it sells.
  face(384,128,128,'#f5ecd6',r=>{const g=sign('sakura-ad');ctx.fillStyle='#c8382e';ctx.fillRect(-r,-r*.34,r*2,r*.62);ctx.fillStyle='#f5ecd6';ctx.beginPath();ctx.arc(0,-r*.62,r*.16,0,Math.PI*2);ctx.fill();
   text(g.jp,0,-r*.03,r*.3,'#f5ecd6');text(g.sub,0,r*.5,r*.17,'#7a2a22',GOTHIC);});
 });
}

/** A fan's head: a disc of radius r with its bottom flattened where the handle joins, lying in the xy plane, its bottom edge at y 0. */
function fanHead(r,cell){
 const g=new THREE.CircleGeometry(r,18),p=g.attributes.position,uv=g.attributes.uv,flat=-.86*r;
 for(let i=0;i<p.count;i++){if(p.getY(i)<flat)p.setY(i,flat);p.setY(i,p.getY(i)-flat);}
 const [u0,v0,su,sv]=cell;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*su,v0+uv.getY(i)*sv);
 g.computeBoundingBox();return g;
}

/** Striped straws: one 128 x 128 canvas, a stripe colour per quarter (the straw's UVs pick its quarter). */
const STRIPES=['red','green','blue','plain'],STRIPE_HEX={red:'#d2382e',green:'#3f9a5a',blue:'#2f6fd0',plain:'#ffffff'};
function strawTexture(){
 const t=paint(128,128,(ctx)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,128,128);
  STRIPES.forEach((s,i)=>{ctx.fillStyle=STRIPE_HEX[s];for(let y=-32;y<128;y+=16){ctx.beginPath();ctx.moveTo(i*32,y);ctx.lineTo(i*32+32,y+12);ctx.lineTo(i*32+32,y+19);ctx.lineTo(i*32,y+7);ctx.closePath();ctx.fill();}});
  });
 if(t)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

/** The cash-book spread: two ruled pages, each with the five columns; the top of the page at the texture's top. */
const LEDGER_COLUMNS=[[0,.12],[.12,.55],[.55,.7],[.7,.85],[.85,1]];
function ledgerTexture(){
 const L=ONSEN_SIGNS.ledger;
 return paint(768,512,(ctx,w,h)=>{
  ctx.fillStyle='#f4eedd';ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(120,100,70,.2)';ctx.fillRect(w/2-8,0,16,h);
  const pw=w/2-40,cols=x0=>LEDGER_COLUMNS.map(([a,b])=>[x0+pw*a,x0+pw*b]);
  for(const x0 of [20,w/2+20]){
   ctx.strokeStyle='#8fa9c9';ctx.lineWidth=1.5;for(let y=104;y<h-20;y+=32){ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+pw,y);ctx.stroke();}
   ctx.strokeStyle='#d0675a';ctx.lineWidth=2;for(const [a] of cols(x0).slice(1)){ctx.beginPath();ctx.moveTo(a,64);ctx.lineTo(a,h-20);ctx.stroke();}
   ctx.beginPath();ctx.moveTo(x0,64);ctx.lineTo(x0+pw,64);ctx.moveTo(x0,100);ctx.lineTo(x0+pw,100);ctx.stroke();
   ctx.fillStyle='#b5463a';ctx.font=`bold 17px ${MINCHO}`;ctx.textAlign='center';ctx.textBaseline='middle';
   cols(x0).forEach(([a,b],i)=>ctx.fillText(L.columns[i],(a+b)/2,82));}
  ctx.fillStyle='#2b2520';ctx.font=`bold 30px ${MINCHO}`;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(L.jp,24,32);
  // Today's takings in pencil: baths, towels and milk in; the soap from Sakura Shōten out. The right-hand page is tomorrow's.
  ctx.fillStyle='#4a4a4e';
  L.rows.forEach((r,i)=>{const y=120+i*32;cols(20).forEach(([a,b],k)=>{if(!r[k])return;ctx.font=`${k===1?18:15}px ${HAND}`;ctx.textAlign=k===1?'left':'right';ctx.fillText(r[k],k===1?a+6:b-4,y);});});
 });
}

/** A fixed hash in [0, 1): the same glitter every time. */
const hash=(i,s=0)=>{let h=(i*374761393+s*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;};
/**
 * Page 5's paper war (ONSEN_SIGNS.paperWar), as sheets of paper: 'reserved' is Fujita's, black marker on the back of a
 * calendar page (the month's numbers faint through the paper, back to front); 'hairRights' the women's, glitter pen on
 * drawing paper, three dryers drawn like flowers. Null without a page (the room tests).
 */
export function paperWarTexture(kind){
 const W=ONSEN_SIGNS.paperWar;
 return paint(256,352,(ctx,w,h)=>{
  const text=(t,x,y,px,color,font=HAND)=>{ctx.fillStyle=color;ctx.font=`bold ${px}px ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x,y);};
  const fit=(t,y,max,px,color,font)=>{ctx.font=`bold ${px}px ${font||HAND}`;while(ctx.measureText(t).width>max&&px>8){px--;ctx.font=`bold ${px}px ${font||HAND}`;}text(t,w/2,y,px,color,font);};
  if(kind==='reserved'){const R=W.reserved;
   ctx.fillStyle='#f3efe2';ctx.fillRect(0,0,w,h);
   // The calendar's printed grid, seen through from the back: faint and mirrored.
   ctx.save();ctx.translate(w,0);ctx.scale(-1,1);ctx.globalAlpha=.1;ctx.strokeStyle='#5a5a5a';ctx.lineWidth=1;for(let r=0;r<6;r++)for(let c=0;c<7;c++)ctx.strokeRect(14+c*33,96+r*38,33,38);
   ctx.fillStyle='#b8342e';ctx.font=`bold 64px ${GOTHIC}`;ctx.textAlign='center';ctx.fillText('8',w/2,64);ctx.restore();
   // The perforation along the top where he tore it off.
   ctx.fillStyle='#d9d2bf';for(let x=4;x<w;x+=9)ctx.fillRect(x,4,4,3);
   text(R.jp,w/2,130,78,'#141414');fit(R.line,206,w-28,26,'#141414');fit(R.en,262,w-24,20,'#141414',GOTHIC);
   ctx.strokeStyle='#141414';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(30,290);ctx.lineTo(w-30,286);ctx.stroke();}
  else{const H=W.hairRights;
   ctx.fillStyle='#fbfaf6';ctx.fillRect(0,0,w,h);
   // Three dryers drawn like flowers, with their air in curls.
   for(const [x,y,c] of [[52,250,'#e05a8a'],[128,236,'#e0a83a'],[204,250,'#5ab0d8']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.fill();ctx.fillRect(x-4,y+12,8,26);
    ctx.strokeStyle=c;ctx.lineWidth=3;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x,y-30-k*12,6+k*3,Math.PI,Math.PI*2);ctx.stroke();}}
   fit(H.jp.slice(0,4),58,w-24,62,'#e05a8a');text(H.jp.slice(4),w/2,122,54,'#d29a2a');fit(H.line,172,w-24,24,'#c84a7a');fit(H.en,318,w-24,40,'#d29a2a',GOTHIC);
   // Glitter: gold and pink points where the pens went.
   for(let i=0;i<260;i++){const x=hash(i,3)*w,y=hash(i,4)*h;if(y>196&&y<290)continue;ctx.fillStyle=hash(i,5)>.5?'rgba(230,180,60,.8)':'rgba(230,110,160,.7)';ctx.fillRect(x,y,2,2);}}
  // Masking tape at the top corners, a little crooked.
  ctx.fillStyle='rgba(234,217,164,.85)';for(const [x,a] of [[22,-.3],[w-22,.3]]){ctx.save();ctx.translate(x,14);ctx.rotate(a);ctx.fillRect(-20,-7,40,14);ctx.restore();}
 });
}

/**
 * Builds the props into the room. `rect` adds a collider (only for what really blocks a walker), `anchor` a prompt.
 * Returns the group and, by id, the parts the film and the room switch.
 */
export function buildOnsenProps({room,rect,anchor=null,action=()=>{}}){
 const group=new THREE.Group();group.name='Umi-no-yu props';room.add(group);
 const add=(geometry,material,x,y,z,name,parent=group)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;m.castShadow=m.receiveShadow=true;m.userData.staticProp=true;parent.add(m);return m;};
 const node=(name,x,y,z,parent=group)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;};
 const std=(color,roughness=.7,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
 const bamboo=std(0xc2a466,.75),darkBamboo=std(0x7a5a32,.8),wood=std(0x8a6340,.7);

 // ---- The straw jar on the milk cooler's lid.
 const J=ONSEN_PROPS.strawJar,jar=node(J.name,...J.at);jar.userData.prop=J.id;
 const glass=std(0xd9eef0,.08,{transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide});
 const jarGlass=add(new THREE.CylinderGeometry(J.r*.9,J.r,J.h,16,1,true),glass,0,J.h/2,0,'Straw jar glass',jar);jarGlass.renderOrder=2;jarGlass.castShadow=false;
 const base=add(new THREE.CylinderGeometry(J.r*.99,J.r*.99,.006,16),std(0xc9e2e4,.1,{transparent:true,opacity:.6}),0,.003,0,'Straw jar base',jar);base.userData.restsOn=J.on;
 add(new THREE.TorusGeometry(J.r*.9,.003,4,16).rotateX(Math.PI/2),glass,0,J.h,0,'Straw jar rim',jar).castShadow=false;
 const strawTex=strawTexture(),strawMat=strawTex?new THREE.MeshStandardMaterial({map:strawTex,roughness:.45}):std(0xfbfaf4,.45);
 // Each straw leans out from near the middle of the jar's floor, so it stays inside the glass up to the rim.
 const straw=(s,i)=>{const a=i*2.39996+(s.kind==='fat'?1:s.kind==='thinner'?2:0),lean=.14+.16*((i*37)%5)/4,foot=.012+.01*((i*53)%7)/6;
  const g=new THREE.CylinderGeometry(s.r,s.r,s.len,8,1,true),uv=g.attributes.uv,q=STRIPES.indexOf(s.stripe);
  for(let k=0;k<uv.count;k++)uv.setXY(k,(q+uv.getX(k))/4,uv.getY(k)*s.len*4);
  g.translate(0,s.len/2,0).rotateX(lean).rotateY(a).translate(-Math.sin(a)*foot,.006,-Math.cos(a)*foot);return g;};
 const taken=node(J.takes.group,0,0,0,jar),rest=[];let k=0;
 for(const s of J.straws)for(let i=0;i<s.count;i++,k++){const g=straw(s,k);
  if(i<J.takes[s.kind]){const m=add(g,strawMat,0,0,0,`Straw ${s.kind} ${i+1}`,taken);m.userData.straw=s.kind;m.castShadow=false;}else rest.push(g);}
 const restMesh=add(mergeGeometries(rest,false),strawMat,0,0,0,'Straw jar straws',jar);restMesh.castShadow=false;rest.forEach(g=>g.dispose());

 // ---- The uchiwa rack on the lobby wall, by the tatami.
 const U=ONSEN_PROPS.uchiwaRack,P=U.pocket,rack=node(U.name,P.x,P.y,P.wallZ);rack.userData.prop=U.id;
 {const t=.01,parts=[
   new THREE.BoxGeometry(P.w,P.h+.06,t).translate(0,(P.h+.06)/2,t/2),                       // back board, a little taller, nailed to the wall
   new THREE.BoxGeometry(P.w,P.h,t).translate(0,P.h/2,P.d-t/2),                              // front
   new THREE.BoxGeometry(t,P.h,P.d-2*t).translate(-P.w/2+t/2,P.h/2,P.d/2),new THREE.BoxGeometry(t,P.h,P.d-2*t).translate(P.w/2-t/2,P.h/2,P.d/2),
   new THREE.BoxGeometry(P.w-2*t,t,P.d-2*t).translate(0,t/2,P.d/2)];                         // floor
  const pocket=add(mergeGeometries(parts,false),bamboo,0,0,0,'Uchiwa rack pocket',rack);pocket.userData.hangsOn='Noren wall east';parts.forEach(g=>g.dispose());
  // Two dark cane bindings across the front, the way a woven pocket is finished.
  const bands=[.03,P.h-.03].map(y=>new THREE.BoxGeometry(P.w+.004,.012,.004).translate(0,y,P.d+.002));
  add(mergeGeometries(bands,false),darkBamboo,0,0,0,'Uchiwa rack binding',rack).castShadow=false;bands.forEach(g=>g.dispose());}
 const atlas=fanAtlas(),paper=atlas?new THREE.MeshStandardMaterial({map:atlas,roughness:.85,side:THREE.DoubleSide}):std(0xf2e6c8,.85,{side:THREE.DoubleSide});
 // The four hand fans stand in the pocket, their handles on its floor, leaning apart so every face shows.
 const F=U.fan,heads=[],handles=[];
 for(const f of U.fans){const m=new THREE.Matrix4().makeRotationZ(f.lean).setPosition(f.x-P.x,.01+.009*Math.sin(Math.abs(f.lean)),f.off); // the leaning handle stands on its corner
  heads.push(fanHead(F.r,FAN_CELLS[f.id]).translate(0,F.handle,0).applyMatrix4(m));
  handles.push(new THREE.BoxGeometry(.018,F.handle+.03,.008).translate(0,(F.handle+.03)/2,0).applyMatrix4(m));}
 const fans=add(mergeGeometries(heads,false),paper,0,0,0,'Uchiwa',rack);fans.castShadow=false;fans.userData.fans=U.fans.map(f=>f.id);
 add(mergeGeometries(handles,false),bamboo,0,0,0,'Uchiwa handles',rack);heads.concat(handles).forEach(g=>g.dispose());
 // The giant Hārī fan, resting on two pegs with its face to the room: a group of its own, so the film can take it down.
 const G=U.giant,giant=node(G.name,G.x,G.y,P.wallZ+G.off);giant.userData.prop=G.id;
 const giantHead=fanHead(G.r,FAN_CELLS.harii).translate(0,-.86*G.r,0);
 add(giantHead,paper,0,0,0,'Giant uchiwa face',giant).castShadow=false;
 add(new THREE.BoxGeometry(.03,G.handle+.06,.012).translate(0,-.86*G.r-(G.handle-.06)/2,0),bamboo,0,0,0,'Giant uchiwa handle',giant);
 const pegs=G.pegs.map(deg=>{const a=deg*Math.PI/180;return new THREE.CylinderGeometry(.008,.008,.05,8).rotateX(Math.PI/2).translate(G.x+Math.cos(a)*G.r,G.y+Math.sin(a)*G.r-.0085,P.wallZ+.025);});
 const pegMesh=add(mergeGeometries(pegs,false),wood,0,0,0,'Uchiwa pegs');pegMesh.userData.hangsOn='Noren wall east';pegs.forEach(g=>g.dispose());
 if(anchor)anchor([P.x+.3,1.35,P.wallZ+.4],'Take an uchiwa',()=>action('inspect','Uchiwa',
  'You take the goldfish one and fan yourself. After forty-two degrees it is the best wind in the world. The giant Hārī fan on the pegs is for show, Higa-san says without looking up, and for emergencies.'));

 // ---- Miss Higa's rubber plant, by the frosted bath door.
 const Pl=ONSEN_PROPS.plant,plant=node(Pl.name,...Pl.at);plant.userData.prop=Pl.id;
 const glaze=std(0x35568c,.25),soil=std(0x3a2a1e,.95),leaf=std(0x2c5233,.3),stem=std(0x5e5a3a,.8);
 const S=Pl.saucer,Pt=Pl.pot;
 const saucer=add(new THREE.CylinderGeometry(S.r,S.r*.9,S.h,14),glaze,0,S.h/2,0,'Rubber plant saucer',plant);saucer.userData.restsOn=Pl.on;
 const potShape=[[0,0],[Pt.r0,0],[Pt.r0+.006,.02],[Pt.r1-.012,Pt.h-.035],[Pt.r1,Pt.h-.02],[Pt.r1,Pt.h],[Pt.r1-.012,Pt.h],[Pt.r1-.014,Pt.h-.03]].map(([x,y])=>new THREE.Vector2(x,y));
 const pot=add(new THREE.LatheGeometry(potShape,14),glaze,0,S.h,0,'Rubber plant pot',plant);pot.userData.restsOn='Rubber plant saucer';
 add(new THREE.CircleGeometry(Pt.r1-.014,14).rotateX(-Math.PI/2),soil,0,S.h+Pt.h-.025,0,'Rubber plant soil',plant).castShadow=false;
 const top=Pl.stem,lean=.04;
 add(new THREE.CylinderGeometry(.012,.017,top-S.h-Pt.h+.06,6).translate(0,(top-S.h-Pt.h+.06)/2,0).rotateZ(-lean),stem,0,S.h+Pt.h-.04,0,'Rubber plant stem',plant);
 // Big oval leaves up the stem, each on its own side (the golden angle), the lower ones flatter; turned so none reaches the wall.
 const leaves=[],stemAt=y=>new THREE.Vector3(Math.sin(lean)*(y-(S.h+Pt.h-.04)),y,0);
 for(let i=0;i<12;i++){const y=S.h+Pt.h+.16+i*(top-S.h-Pt.h-.2)/11,a=i*2.39996+.6,len=.08+.008*Math.sin(i*1.7)-.002*Math.max(0,i-8),pitch=-.12+i*.06,p=stemAt(y);
  leaves.push(new THREE.SphereGeometry(1,8,4).scale(len*.62,.008,len).translate(0,0,len*.85).rotateX(-pitch).rotateY(a).translate(p.x,p.y,p.z));}
 add(mergeGeometries(leaves,false),leaf,0,0,0,'Rubber plant leaves',plant);leaves.forEach(g=>g.dispose());
 // The new leaf comes out of a pink sheath at the tip, as a rubber plant's does.
 {const p=stemAt(top);add(new THREE.ConeGeometry(.012,.07,6),std(0xc0566a,.5),p.x,p.y+.03,p.z,'Rubber plant sheath',plant);}
 rect(Pl.at[0],Pl.at[2],2*S.r+.04,2*S.r+.04,top);
 if(anchor)anchor([Pl.at[0],1.1,Pl.at[2]],'Look at the rubber plant',()=>action('inspect','Rubber plant',
  'Higa-san’s rubber plant, twelve years old, in a green Tsuboya pot. It stands by the bath door for the light through the frosted glass. A card in the soil says, in her handwriting: please do not dry me.'));

 // ---- Miss Higa's account book, open on the bandai, the pencil on the right-hand page.
 const A=ONSEN_PROPS.accountBook,book=node(A.name,...A.at);book.rotation.y=A.yaw;book.userData.prop=A.id;
 // Spine along x (away from her), pages either side in z; u runs left to right for a reader facing +x (+z is her right).
 const cover=add(new THREE.BoxGeometry(A.w+.012,.006,A.d+.014),std(0x2b3346,.8),0,.003,0,'Account book cover',book);cover.userData.restsOn=A.on;
 const pages=add(new THREE.BoxGeometry(A.w,.008,A.d),std(0xf1ead6,.9),0,.006+.004,0,'Account book pages',book);pages.userData.restsOn='Account book cover';
 const sheet=ledgerTexture(),spread=add(new THREE.PlaneGeometry(A.d-.004,A.w-.004).rotateX(-Math.PI/2).rotateY(-Math.PI/2),sheet?new THREE.MeshStandardMaterial({map:sheet,roughness:.9}):std(0xf4eedd,.9),0,.0145,0,'Account book spread',book);
 spread.castShadow=false;spread.userData.restsOn='Account book pages';
 const pr=.0038,pencil=node('Account book pencil',.01,.0145+pr,A.d*.28,book);pencil.rotation.y=.5;
 const body=add(new THREE.CylinderGeometry(pr,pr,.15,6).rotateZ(Math.PI/2),std(0x2f6a45,.5),0,0,0,'Account book pencil body',pencil);body.userData.restsOn='Account book spread';
 add(new THREE.ConeGeometry(pr,.02,6).rotateZ(-Math.PI/2),std(0xd9b78a,.7),.085,0,0,'Account book pencil tip',pencil);
 // Page 5: a copy of HAIR RIGHTS lands on today's page (ONSEN_SIGNS.paperWar.flyer); she writes round it. Only when staged.
 {const tex=paperWarTexture('hairRights'),f=add(new THREE.PlaneGeometry(.1,.138).rotateX(-Math.PI/2).rotateY(Math.PI/2+.14),tex?new THREE.MeshStandardMaterial({map:tex,roughness:.9}):std(0xfbfaf6,.9),.004,.0151,-.07,'Hair rights flyer',book);
  f.castShadow=false;f.userData.restsOn='Account book spread';f.visible=false;}

 // ---- The men's vanity: mirror, shelf, tonic, comb sterilizer and its socket.
 const V=ONSEN_PROPS.menVanity,vanity=node(V.name,0,0,0);vanity.userData.prop=V.id;
 {const M=V.mirror,S=V.shelf,top=S.y,shelfZ=V.wallZ-S.d/2;
  const mir=add(new THREE.BoxGeometry(M.w,M.h,.02),std(0xcfd8da,.05,{metalness:.9}),V.x,M.y,V.wallZ-.01,'Men’s mirror',vanity);mir.userData.hangsOn='Noren wall east';
  add(new THREE.BoxGeometry(M.w+.04,M.h+.04,.012),wood,V.x,M.y,V.wallZ-.006,'Men’s mirror frame',vanity).userData.hangsOn='Noren wall east';
  const shelf=add(new THREE.BoxGeometry(S.w,S.t,S.d),wood,V.x,top-S.t/2,shelfZ,'Men’s vanity shelf',vanity);shelf.userData.hangsOn='Noren wall east';
  rect(V.x,shelfZ,S.w,S.d,top);// a hanging shelf at hip height: nobody walks through it
  for(const dx of [-.35,.35])add(new THREE.BoxGeometry(.03,.14,S.d-.02),wood,V.x+dx,top-S.t-.07,shelfZ+.01,'Men’s vanity bracket',vanity).userData.hangsOn='Noren wall east';
  // The tonic: a tall green bottle with a red cap and a paper label facing the room.
  const T=V.tonic,bottle=add(new THREE.CylinderGeometry(T.r*.9,T.r,T.h,14),std(0x3f8f5a,.15,{transparent:true,opacity:.85}),T.x,top+T.h/2,shelfZ,'Hair tonic bottle',vanity);bottle.userData.restsOn='Men’s vanity shelf';
  add(new THREE.CylinderGeometry(.016,.016,.03,10),std(0xb8342e,.5),T.x,top+T.h+.015,shelfZ,'Hair tonic cap',vanity).userData.restsOn='Hair tonic bottle';
  const tonicTex=paint(128,160,(ctx,w,h)=>{ctx.fillStyle='#f4efdf';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2f6a45';ctx.fillRect(0,0,w,22);ctx.fillRect(0,h-16,w,16);ctx.fillStyle='#1f3558';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font=`bold 40px ${MINCHO}`;ctx.fillText(T.brand,w/2,62);ctx.font=`bold 17px ${GOTHIC}`;ctx.fillText(T.jp,w/2,112);});
  const label=add(new THREE.PlaneGeometry(.042,.055),tonicTex?new THREE.MeshStandardMaterial({map:tonicTex,roughness:.8}):std(0xf4efdf,.8),T.x,top+T.h*.45,shelfZ-T.r*.96-.002,'Hair tonic label',vanity);label.rotation.y=Math.PI;label.castShadow=false;
  // The comb sterilizer: a cream box with a blue ultraviolet window, the combs standing in the light.
  const C=V.sterilizer,cz=shelfZ+.02;
  add(new THREE.BoxGeometry(C.w,C.h,C.d),std(0xe8e0cc,.5),C.x,top+C.h/2,cz,'Comb sterilizer',vanity).userData.restsOn='Men’s vanity shelf';
  const uv=paint(128,64,(ctx,w,h)=>{ctx.fillStyle='#9fdcff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2b3a52';for(let i=0;i<4;i++){const x=18+i*28;ctx.fillRect(x,14,20,6);for(let t=0;t<6;t++)ctx.fillRect(x+1+t*3.2,20,1.6,26);}});
  const lamp=add(new THREE.PlaneGeometry(C.w*.7,C.h*.5),new THREE.MeshStandardMaterial(uv?{map:uv,emissiveMap:uv,emissive:0x9fdcff,emissiveIntensity:1.1,roughness:.3}:{color:0x9fdcff,emissive:0x9fdcff,emissiveIntensity:1.1,roughness:.3}),C.x,top+C.h*.55,cz-C.d/2-.001,'Comb sterilizer lamp',vanity);lamp.rotation.y=Math.PI;lamp.castShadow=false;
  const tag=paint(128,32,(ctx,w,h)=>{ctx.fillStyle='#e8e0cc';ctx.fillRect(0,0,w,h);ctx.fillStyle='#3a3f3c';ctx.font=`bold 18px ${GOTHIC}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(C.jp,w/2,h/2);});
  const tg=add(new THREE.PlaneGeometry(C.w*.7,C.h*.17),tag?new THREE.MeshStandardMaterial({map:tag,roughness:.6}):std(0xe8e0cc,.6),C.x,top+C.h*.12,cz-C.d/2-.001,'Comb sterilizer tag',vanity);tg.rotation.y=Math.PI;tg.castShadow=false;
  // Its socket on the wall above the shelf's end, and the cord down the side of the box.
  const K=V.socket,sock=node(K.name,K.x,K.y,V.wallZ,vanity);sock.rotation.y=Math.PI;
  add(new THREE.BoxGeometry(.07,.11,.012),std(0xeeece4,.45),0,0,.006,K.name+' plate',sock);add(new THREE.BoxGeometry(.035,.04,.022),std(0xc9cbc4,.5),0,-.02,.023,K.name+' plug',sock);
  const pts=[[C.x+C.w/2,top+.03,cz],[C.x+C.w/2+.06,top+.02,cz+.03],[K.x-.004,top+.03,V.wallZ-.025],[K.x,top+.07,V.wallZ-.023],[K.x,K.y-.04,V.wallZ-.023]].map(p=>new THREE.Vector3(...p));
  const cord=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.0035,5),std(0xf2f0ea,.6),0,0,0,'Comb sterilizer cord',vanity);cord.castShadow=false;
  if(anchor)anchor([V.x,1.35,V.wallZ-.45],'Look in the men’s mirror',()=>action('inspect','The men’s mirror',
   'One mirror, a bottle of 潮風 hair tonic for anyone who wants it, and the comb sterilizer humming blue with the house combs standing in its light. You comb your hair. It is the best it has looked all week.'));}

 // ---- Miss Higa's noren pole on two hooks behind her stool.
 const NP=ONSEN_PROPS.norenPole,poleX=NP.wallX+NP.off,pole=node(NP.name,poleX,NP.y,NP.z0+NP.len/2);pole.userData.prop=NP.id;
 {const cane=add(new THREE.CylinderGeometry(NP.r,NP.r*1.1,NP.len,8,1,true).rotateX(Math.PI/2),bamboo,0,0,0,'Noren pole cane',pole);cane.userData.hangsOn='Noren pole hook';
  // The nodes: a ring a little proud of the cane every third of a metre.
  const rings=NP.nodes.map(t=>new THREE.CylinderGeometry(NP.r*1.18,NP.r*1.18,.012,8,1,true).rotateX(Math.PI/2).translate(0,0,-NP.len/2+t*NP.len/(NP.nodes.at(-1)+.24)));
  add(mergeGeometries(rings,false),darkBamboo,0,0,0,'Noren pole nodes',pole).castShadow=false;rings.forEach(g=>g.dispose());
  // The brass hook at the street end: a short shank and a crook turned up, bound on with wire.
  const brass=std(0xc9a24e,.35,{metalness:.7}),tip=NP.len/2;
  add(new THREE.CylinderGeometry(.005,.005,.08,6).rotateX(Math.PI/2),brass,0,0,tip+.03,'Noren pole hook shank',pole);
  add(new THREE.TorusGeometry(.022,.0045,4,8,Math.PI).rotateZ(-Math.PI/2).rotateY(-Math.PI/2),brass,0,.022,tip+.07,'Noren pole crook',pole);// a J: out along the cane, then up
  add(new THREE.CylinderGeometry(NP.r*1.15,NP.r*1.15,.03,8).rotateX(Math.PI/2),std(0x8a8a86,.4,{metalness:.6}),0,0,tip-.012,'Noren pole binding',pole);
  // Two hooks screwed to the wall: a back plate and an arm under the cane with its end turned up.
  const hooks=NP.hooks.map(z=>{const dz=z-pole.position.z,armY=-NP.r*1.1-.004;return [// the arm under the cane's thicker end
   new THREE.BoxGeometry(.006,.05,.02).translate(NP.wallX+.003-poleX,armY+.012,dz),
   new THREE.CylinderGeometry(.004,.004,NP.off+.024,6).rotateZ(Math.PI/2).translate((NP.off+.024)/2-NP.off,armY,dz),
   new THREE.CylinderGeometry(.004,.004,.022,6).translate(.024,armY+.011,dz)];}).flat();
  const hookMesh=add(mergeGeometries(hooks,false),brass,0,0,0,'Noren pole hook',pole);hookMesh.userData.hangsOn='Lobby wall west';hooks.forEach(g=>g.dispose());}

 // ---- The box of extension cords on the bandai's floor.
 const EC=ONSEN_PROPS.extensionCords,B=EC.box,ec=node(EC.name,...EC.at);ec.userData.prop=EC.id;
 {const crate=std(0x9a7448,.8),t=B.t,parts=[
   new THREE.BoxGeometry(B.w,t,B.d).translate(0,t/2,0),
   new THREE.BoxGeometry(B.w,B.h,t).translate(0,B.h/2,-B.d/2+t/2),new THREE.BoxGeometry(B.w,B.h,t).translate(0,B.h/2,B.d/2-t/2),
   new THREE.BoxGeometry(t,B.h,B.d-2*t).translate(-B.w/2+t/2,B.h/2,0),new THREE.BoxGeometry(t,B.h,B.d-2*t).translate(B.w/2-t/2,B.h/2,0)];
  const boxMesh=add(mergeGeometries(parts,false),crate,0,0,0,'Extension cord box crate',ec);boxMesh.userData.restsOn=EC.on;parts.forEach(g=>g.dispose());
  // Miss Higa's label on the box's front (the side that faces the counter), in marker: 延長コード.
  const label=paint(192,64,(ctx,w,h)=>{ctx.fillStyle='#ead9a4';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1b1a18';ctx.font=`bold 34px ${HAND}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(EC.jp,w/2,h/2+2);});
  const tag=add(new THREE.PlaneGeometry(.15,.05),label?new THREE.MeshStandardMaterial({map:label,roughness:.85}):std(0xead9a4,.85),0,B.h*.55,B.d/2+.0006,'Extension cord box label',ec);tag.castShadow=false;// on the street end, read from the genkan
  // Three coils side by side, each two loops of white cord, its plug and its socket end laid on top.
  const white=std(0xf3f1ea,.55),grey=std(0xd8d6ce,.5),metal=std(0xb8b8b0,.35,{metalness:.7}),R=.068,cr=.0048,floor=t;
  EC.cords.forEach((c,i)=>{const g=node(c.name,-B.w/2+t+.008+R+cr+i*(2*R+2*cr+.006),floor,0,ec);g.userData.cord=c.n;
   const loops=[0,1].map(k=>new THREE.TorusGeometry(R-k*.008,cr,4,14).rotateX(Math.PI/2).translate(k*.004,cr+k*2*cr,k*.003));
   const coil=add(mergeGeometries(loops,false),white,0,0,0,c.name+' coil',g);coil.userData.restsOn='Extension cord box crate';loops.forEach(l=>l.dispose());
   // The plug and the socket end lie across the top loop (radius R - 0.008, its centre a few millimetres off), each turned along it.
   const top=4*cr,a=.9+i*1.1,ring=R-.008,on=(ang,len)=>[.004+Math.cos(ang)*ring,top,.003+Math.sin(ang)*ring,len];
   const [px,,pz]=on(a),tx=-Math.sin(a),tz=Math.cos(a);// along the loop
   const plug=add(new THREE.BoxGeometry(.022,.016,.03),white,px,top+.008,pz,c.name+' plug',g);plug.rotation.y=-a;plug.userData.restsOn=c.name+' coil';
   for(const s of [-1,1])add(new THREE.BoxGeometry(.002,.006,.016),metal,px+tx*.023+Math.cos(a)*s*.006,top+.008,pz+tz*.023+Math.sin(a)*s*.006,c.name+' pin',g).rotation.y=-a;
   const [ex,,ez]=on(a+Math.PI*.8);
   const end=add(new THREE.BoxGeometry(.034,.022,.05),grey,ex,top+.011,ez,c.name+' socket',g);end.rotation.y=-(a+Math.PI*.8);end.userData.restsOn=c.name+' coil';});}

 // ---- Fujita's offering: three coffee milks on the massage chair's right arm (stage({offering})).
 const O=ONSEN_PROPS.offering,offering=node(O.name,0,O.top,O.z);offering.userData.prop=O.id;offering.visible=false;
 const Bt=O.bottle,profile=[[0,0],[Bt.r-.002,0],[Bt.r,.004],[Bt.r,.082],[Bt.r-.003,.098],[Bt.neck+.001,.114],[Bt.neck,.126],[Bt.neck+.0025,.128],[Bt.neck+.0025,Bt.h],[Bt.neck-.0015,Bt.h],[Bt.neck-.0015,Bt.h-.012]].map(([x,y])=>new THREE.Vector2(x,y));
 const full=std(0x9b6a3c,.28),empty=std(0xe6efee,.12,{transparent:true,opacity:.38,depthWrite:false,side:THREE.DoubleSide}),film=std(0x8a5a32,.5),capMat=std(0xd88a2a,.6);
 const bottleGeo=new THREE.LatheGeometry(profile,8),milks=O.xs.map((x,i)=>{const g=node('Coffee milk '+(i+1),x-0,0,0,offering);
  const body=add(bottleGeo,full,0,0,0,'Coffee milk '+(i+1)+' bottle',g);body.userData.restsOn=O.on;
  const cap=add(new THREE.CylinderGeometry(Bt.neck+.003,Bt.neck+.003,.006,8),capMat,0,Bt.h+.003,0,'Coffee milk '+(i+1)+' cap',g);cap.userData.on='Coffee milk '+(i+1)+' bottle';// pressed into the mouth, over the lip
  const dregs=add(new THREE.CylinderGeometry(Bt.r-.003,Bt.r-.003,.004,8),film,0,.004,0,'Coffee milk '+(i+1)+' dregs',g);dregs.visible=false;dregs.castShadow=false;
  return {g,body,cap,dregs};});
 let offered='none';
 /** Fujita's offering on the chair's arm: 'none' (the arm bare), 'full' (three unopened coffee milks), 'empty' (drunk, caps off). */
 const setOffering=state=>{if(!O.states.includes(state))throw new Error('The offering is '+O.states.join(', ')+': '+state);offered=state;offering.visible=state!=='none';
  for(const m of milks){m.body.material=state==='empty'?empty:full;m.body.castShadow=state!=='empty';m.cap.visible=state==='full';m.dregs.visible=state==='empty';}return offered;};

 /**
  * A story's props, set by name (the film and capture-room.mjs `onsen.props`): {offering}. Returns what is set now.
  */
 const flyer=book.getObjectByName('Hair rights flyer');
 const stage=(o={})=>{if(o.offering!==undefined)setOffering(o.offering);if(o.flyer!==undefined)flyer.visible=!!o.flyer;return {offering:offered,flyer:flyer.visible};};

 return {group,jar,taken,rack,giant,plant,book,vanity,pole,cords:ec,offering,stage,get offered(){return offered;},get flyer(){return flyer.visible;}};
}
