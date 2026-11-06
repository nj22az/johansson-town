import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {createKit,paint} from './kit.js';
import {japaneseSign,signText} from './signs.js';
import {createShopGlass} from '../shop-glass.js';
import {YUNTAKU} from '../../commerce/higa-liquor.js';
import {KISSA,KISSA_NOTICE,KISSA_MENU,KISSA_RECORDS,kissaDay,createKissaClosing,inKissaHiga,kissaOnDuty,kissaOpen} from '../../commerce/kissa-higa.js';

/**
 * Higa Liquor (比嘉酒店), dressed as the 1990s island liquor shop it is (the owner, 21 October 2026: "I see the liquor
 * store looks abhorrent too … how can we bring them more life and interactivity"). It was a pink box with an open slot
 * in front: a counter a pace inside the pavement, two pots and a wall of bottles, open at midnight. A real 酒屋 of the
 * period is a shop you walk into through aluminium sliding doors under a canvas awning with the goods on its valance:
 * the beer case by the door, the 1.8-litre bottles up the wall, the awamori jars on the floor, the owner behind a
 * wooden counter at the back with the register and the delivery book, the crates of empties stacked outside for the
 * brewery's boat, and in the evening a bench out front where the regulars sit with a bottle (ゆんたく).
 *
 * Shut for good as a liquor shop since 22 October 2026 (the owner: "Sakura sells and supplies all alcohol … and the
 * building stands shut with a notice on it"; commerce/higa-liquor.js). Since 30 October 2026 the room is Kissa Higa
 * (喫茶ひが), Grandmother Higa's morning coffee shop (commerce/kissa-higa.js; briefs/higa-kissaten/): the shutter goes
 * up at ten to seven on weekdays and the doors slide open; the liquor fittings are gone; the counter serves coffee, with
 * a ledge and three stools in front of it, a table for two by the police-station wall and her husband's record player
 * on the Kitano Road wall. The drink stays Sakura's, and the bench out front is still sat on of an evening.
 * The record player, the bentwood chairs and the hand grinder are Meshy models (kissa-higa-props.js, the audit of
 * 30 October 2026 in art/kissaten/meshy/provenance.json); everything else is drawn here, in the kit.
 *
 * The shop-house frame (houses.js shopHouse) is used throughout: x along the frontage (+x towards the police station,
 * world +z), z out to Main Street (+z, world -x), y up from the street. The shop floor is deepened to the back of the
 * building's front half: the old 2.2 m slot becomes a room 5.75 m deep, the back of the ground floor the storeroom with
 * the stock room upstairs (nobody lives over the shop; the Higas live in Nishi-machi).
 *
 * Measured, not copied: New Yokosuka's Dobuita sweets shop (docs/research/new-yokosuka-lessons.md §3.2) is the same size
 * of shop-house, 5.47 × 7.29 m, with a 1.80 × 2.10 m double slider for its door and the shopkeeper's place at the back
 * facing it; Higa Liquor's doors are 1.84 × 2.10 m under a transom, its keeper behind a counter across the back. The
 * konbini there (§3.1) puts what sells first nearest the door, as the cold case is here. Everything drawn is the town's
 * own.
 */
export const HIGA_FRAME=Object.freeze({W:2.45,D:3.85,ground:3.3,H:6.1,open:2.07,back:-1.9,floor:.08,origin:Object.freeze([9.55,8.4])});
const {W,D,ground,H,open,back}=HIGA_FRAME;
/** A point of the shop-house's frame in the world (the frame turns a quarter: local +z is world -x). */
export const higaPoint=(x,z)=>[HIGA_FRAME.origin[0]-z,HIGA_FRAME.origin[1]+x];
/** The doorway, between the fixed panes: local x ±DOOR, the leaves 0.92 m each. */
const DOOR=.92,DOOR_H=2.18,PANE_Z=D-.4,LEAF_Z=D-.48;

const item=o=>Object.freeze({...o,at:Object.freeze(o.at)});
/**
 * Every new thing in, on and around the shop, by who it is for and why it is where it is. `at` is its middle in the
 * shop-house's frame; `build` says whether it is part of the building, the shop's fittings, a prop outside, or a thing
 * that follows the kissaten’s opening hours (commerce/kissa-higa.js).
 */
export const HIGA_DRESSING=Object.freeze([
 // The building.
 item({id:'shop-floor',side:'inside',at:[0,0,.97],build:'building',who:'Grandmother Higa and her customers',
  why:'The shop floor is a room now, 4.1 by 5.75 m: the old slot was a counter a pace in from the pavement, where nobody could choose a bottle without blocking the footway. The back of the ground floor stays the storeroom.',period:'A town 酒屋 of the seventies is a single room off the street, a concrete floor (土間) and the stock round the walls.'}),
 item({id:'sliding-doors',side:'front',at:[0,1.36,PANE_Z],build:'open-hours',who:'Grandmother Higa and her customers',
  why:'Aluminium-framed glass sliding doors across the front, two fixed panes and two leaves that slide behind them: open while Kissa Higa’s shutter is up, shut behind it the rest of the time.',period:'Aluminium shop sashes (アルミサッシ) replaced the timber front of every Japanese shop from the late sixties.'}),
 item({id:'shutter',side:'front',at:[0,1.5,D-.15],build:'open-hours',who:'Grandmother Higa',
  why:'The roller shutter goes up at ten to seven on weekdays, when she comes down to open Kissa Higa, and down at a quarter to ten, when she goes up to the bath (commerce/kissa-higa.js kissaShutterDown): down every evening and all weekend.',period:'Ribbed steel shutters closed every shop front on the island from the sixties.'}),
 item({id:'kissa-notice',side:'front',at:[-.55,1.45,D-.134],build:'open-hours',who:KISSA_NOTICE.who,
  why:KISSA_NOTICE.why+' A sheet of paper taped to the shutter at eye height: 喫茶ひが, the hours, the days, and お酒は さくら商店へ.',period:KISSA_NOTICE.period}),
 item({id:'awning',side:'front',at:[0,2.95,D+.48],build:'building',who:'the customers and the bench',
  why:'The canvas awning (テント) on its steel frame, re-covered in green for the kissaten, its valance lettered 喫茶 ひが · コーヒー · モーニング: the shade over the door, the crates and the bench, and the sign read from the pavement opposite.',period:'Lettered canvas awnings were the shop sign of every Japanese corner shop.'}),
 item({id:'slab-band',side:'all',at:[0,3.25,0],build:'building',who:'the building',why:'The first floor’s slab edge as a cast band round the flanks and the back, as on Nakamura’s: a concrete shop-house reads as two storeys.',period:'Okinawan RC shop-houses of 1965–80.'}),
 item({id:'coping',side:'all',at:[0,H+.53,0],build:'building',who:'the building',why:'The parapet’s concrete coping, the top edge every flat roof in Minato has.',period:'Typhoon-era concrete.'}),
 item({id:'window-hoods',side:'front and flanks',at:[0,5.56,D+.16],build:'building',who:'the stock room upstairs',why:'Concrete hoods over the upper windows, front and flanks, against the sun and the rain; no air conditioner, since nobody sits in a stock room.',period:'Every Okinawan concrete house carries them.'}),
 item({id:'flank-windows',side:'Kitano Road and police side',at:[-W,4.75,1.4],build:'building',who:'the stock room',why:'One window each side upstairs, so the stock room has a through draught, and on the ground floor a frosted window with a grille to the storeroom on Kitano Road.',period:'面格子 grilles on every ground-floor window.'}),
 item({id:'back-door',side:'back',at:[.7,1,-D],build:'building',who:'Grandmother Higa, Sakura Trading',why:'The storeroom’s steel door to the back lane, where Sakura Trading’s Monday order (the beans, the eggs, the butter) is carried in; a rain hood and a concrete step.',period:'A back door for the stock is how a shop is run.'}),
 // Services and signs outside.
 item({id:'meter-box',side:'Kitano Road',at:[-W-.08,1.8,3.1],build:'prop',who:'the power company’s meter reader',why:'One meter in a grey box near the front of the Kitano Road flank, read from the road, the conduit up to the eave where the line from the pole comes in.',period:'Okinawan meters are outside, at eye height.'}),
 item({id:'enamel-tin',side:'Kitano Road',at:[-W-.02,1.85,1.0],build:'prop',who:'the awamori distillery (南風), and the street',why:'The distillery’s enamel tin (ホーロー看板) on the Kitano Road flank, where everybody walking up to the bath passes it: left up since the shop stopped selling awamori, as old tins are, and Grandmother Higa will not have it taken down.',period:'Makers nailed enamel tins to the shops that sold their goods, and they outlive the trade.'}),
 item({id:'empties',side:'front',at:[-1.33,.45,4.11],build:'prop',who:'the brewery’s boat, and Kōji’s round',why:'Yellow crates of empty large bottles stacked by the door on the Kitano Road side: the bench’s returns, bought at Sakura and left here for Kōji to carry across to the crate yard when the round brings its empties back at half past eleven.',period:'Returnable large bottles in twenty-bottle crates, ¥5 back on each, were how beer was sold.'}),
 item({id:'bicycle',side:'front',at:[-2.08,.5,4.85],build:'prop',who:'Grandmother Higa',why:'The old black delivery bicycle, nose-in to the pier at the Kitano Road corner, clear of the door and the bench.',period:'The shopkeeper’s heavy carrier bicycle.'}),
 item({id:'yuntaku-bench',side:'front',at:[1.68,.22,4.23],build:'prop',who:'the evening regulars (YUNTAKU)',why:'A timber bench (縁台) against the police-station end of the front and two upturned beer crates for stools: where men still sit with a bottle of an evening, bought at Sakura since the shop shut.',period:'Benches in front of island shops, and talking on them (ゆんたく), are Okinawan evenings.'}),
 item({id:'a-board',side:'front',at:[-1.55,.33,D+.8],build:'open-hours',who:'people on Main Street',why:'A folding board (A看板) put out under the awning in the kissaten’s hours, beside the fixed pane and the empties on the Kitano Road side, clear of both door leaves and turned along the footway so it is read walking either way: 喫茶ひが, モーニング ¥300, toast and a boiled egg. Set out when she lifts the shutter and taken in when she pulls it down.',period:'Every kissaten put a board out in the morning.'}),
 // The kissaten inside.
 item({id:'counter',side:'inside',at:[-.84,.48,-.45],build:'fitting',who:'Grandmother Higa',why:'The old wooden counter across the back, facing the door, is the coffee counter: her worktop at 95 cm with the siphons, the kettle, the grinder, the register and her abacus. Its end is open on the police-station side so she can come round, and customers pay there.',period:'The keeper’s counter at the back, facing the door.'}),
 item({id:'ledge',side:'inside',at:[-1.16,.72,0],build:'fitting',who:'the regulars',why:'A ledge 74 cm high along the counter’s front, the izakaya’s counter height, paired with 46 cm stools as at the izakaya; it stops short of the register, where customers pay.',period:'A kissaten’s counter seats, at the height a short island grandmother can serve over.'}),
 item({id:'stools',side:'inside',at:[-1.12,.23,.44],build:'fitting',who:'the regulars (KISSA_REGULARS)',why:'Three round stools in red vinyl on chrome feet along the ledge: Ms Ganaha’s, Yui’s, and the one Tetsuo has before Officer Mori.',period:'Red vinyl and chrome, the seventies counter stool.'}),
 item({id:'siphons',side:'inside',at:[-1.33,1.1,-.45],build:'fitting',who:'Grandmother Higa',why:'Two glass siphons on spirit lamps on the worktop: the coffee is made a cup at a time, the water climbing into the top bowl and falling back dark. Their glass is the frontage’s; the lamps burn while the shop is open.',period:'The siphon was the kissaten’s showpiece from the sixties.'}),
 item({id:'kettle',side:'inside',at:[-1.86,1.05,-.5],build:'fitting',who:'Grandmother Higa',why:'A white enamel kettle with a gooseneck spout on a gas ring at the Kitano Road end of the worktop: the siphons’ water, poured hot so the lamps have less to do.',period:'An enamel kettle on a single gas ring.'}),
 item({id:'grinder',side:'inside',at:[-.95,1.05,-.42],build:'fitting',model:'meshy',who:'Grandmother Higa',why:'Her hand grinder, the beans ground a cup at a time as each order comes (kissa-higa-props.js; the Meshy model won the audit of 30 October 2026).',period:'A box mill with a brass bowl and a crank.'}),
 item({id:'fridge',side:'inside',at:[-1.65,.47,-.76],build:'fitting',who:'Grandmother Higa',why:'A small fridge-freezer under the worktop on her side: the milk, the butter, the eggs, and its own ice trays for the iced coffee.',period:'An under-counter fridge.'}),
 item({id:'cup-shelf',side:'inside',at:[-.75,1.3,-1.72],build:'fitting',who:'Grandmother Higa',why:'The dear-bottle shelf behind the counter now holds the white cups and saucers, and the tins of beans on top.',period:'The cups live behind the keeper.'}),
 item({id:'family-kusu',side:'inside',at:[-1.62,.6,-1.42],build:'fitting',who:'the Higa family',why:'The family kusu behind the counter on its stand, with a 非売品 (not for sale) card: never sold (commerce/higa-liquor.js HIGA_KUSU).',period:'Okinawan families’ kusu, kept for a wedding.'}),
 item({id:'record-player',side:'inside',at:[-1.86,.8,1.6],build:'fitting',model:'meshy',who:'Grandmother Higa',why:KISSA_RECORDS.whose+' The record player on its own cabinet on the Kitano Road wall, where the awamori jars stood, beside the ledge where she can reach it, and the box of 45s on the floor beside it.',period:'A teak-cased record player, and 45s in paper sleeves.'}),
 item({id:'table',side:'inside',at:[1.3,.36,2.1],build:'fitting',who:'whoever wants a table: the player, Ms Uezu on her weeks off',why:'A round table for two by the police-station wall, where the bottle shelves stood, with two bentwood chairs (kissa-higa-props.js; the Meshy chairs won the audit).',period:'Bentwood chairs at a small round table.'}),
 item({id:'bus-photo',side:'inside',at:[2.05,1.52,2.1],build:'fitting',who:'the Higa family',why:'A framed photograph over the table: the island bus on the coast road, her husband at the wheel. Regulars ask, and she tells them.',period:'A family photograph on a shop wall.'}),
 item({id:'paper-rack',side:'inside',at:[-2.0,1.1,2.75],build:'fitting',who:'the regulars',why:'A rack on the Kitano Road wall by the door, where the cold case stood: the week’s town paper (Nhung sets it at Front-Row on Thursday evenings) and two magazines.',period:'A kissaten keeps the paper for its customers.'}),
 item({id:'lights',side:'inside',at:[0,2.93,1.4],build:'open-hours',who:'the shop',why:'Two fluorescent fittings on the ceiling, on while Grandmother Higa is in: across the street, the lit front says it is open before the board does.',period:'Bare fluorescent tubes lit every shop of the period.'}),
]);

/** What a kissaten of the period might have had that is not here, and why. */
export const HIGA_LEFT_OUT=Object.freeze([
 {suggestion:'Tall bar stools at the worktop',why:'A resident on a 70 cm stool would sit with their feet in the air. The ledge at 74 cm with 46 cm stools is the izakaya’s pairing, where the town’s sitting poses fit.'},
 {suggestion:'A pink telephone for customers',why:'Minato already has the town’s pink telephone (people/izakaya-play.js); the shop’s own telephone went with the delivery book.'},
 {suggestion:'A cake case',why:'Nobody bakes on the island; the menu is the morning set and the coffee.'},
 {suggestion:'Alcohol on the menu',why:'The owner’s ruling of 22 October 2026 stands: all the drink is Sakura’s.'},
 {suggestion:'A cigarette counter and the red たばこ sign',why:'The shop never had a tobacco licence, and a sign for goods it never sold would be random.'},
 {suggestion:'A table fortune machine',why:'The Meshy attempt of 30 October 2026 came out an unreadable blob (art/kissaten/meshy/provenance.json), and nothing in the town’s data asks for one.'},
 {suggestion:'A point light in the shop',why:'Phone budget: the fluorescent tubes glow by their own material while it is open.'},
].map(Object.freeze));

const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif',GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
/** The shop's lettering on one 1024×512 sheet, so every card, poster, board and tin is one draw call. Regions in pixels. */
export const HIGA_ATLAS=Object.freeze({w:1024,h:512,valance:[0,0,1024,96],tin:[0,112,320,200],hours:[336,112,160,220],menu:[512,112,200,280],poster:[728,112,200,280],
 aboard:[0,330,128,180],kusu:[300,404,96,108],notice:[152,330,128,176],photo:[560,400,120,96]});
const ATLAS=HIGA_ATLAS;

function paintLettering(){
 return paint(ATLAS.w,ATLAS.h,ctx=>{
  ctx.textAlign='center';ctx.textBaseline='middle';
  // The awning's valance: the kissaten's name and what it serves, in cream on the green canvas.
  {const [x,y,w,h]=ATLAS.valance;ctx.fillStyle='#2f5d46';ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y,w,8);
   ctx.fillStyle='#f6ecd8';signText(ctx,'喫茶 ひが · コーヒー · モーニング',x+w/2,y+h/2+3,w-60,58,MINCHO);}
  // The distillery's enamel tin: cream, a blue band, 泡盛 南風 and the maker's line (left up since the shop shut).
  {const [x,y,w,h]=ATLAS.tin;ctx.fillStyle='#f1e6c8';ctx.fillRect(x,y,w,h);ctx.fillStyle='#24557d';ctx.fillRect(x,y+h-56,w,56);
   ctx.strokeStyle='#24557d';ctx.lineWidth=8;ctx.strokeRect(x+8,y+8,w-16,h-16);
   ctx.fillStyle='#24557d';signText(ctx,japaneseSign('Awamori South wind'),x+w/2,y+(h-56)/2+6,w-40,66,MINCHO);
   ctx.fillStyle='#fff6e0';signText(ctx,'琉球泡盛 · 特約店',x+w/2,y+h-28,w-40,26,GOTHIC);
   ctx.fillStyle='rgba(120,60,30,.5)';for(const [px,py] of [[16,16],[w-16,16],[16,h-16],[w-16,h-16]]){ctx.beginPath();ctx.arc(x+px,y+py,6,0,Math.PI*2);ctx.fill();}}
  // The hours card in the door's left pane, in her hand: the morning, the hours, the days.
  {const [x,y,w,h]=ATLAS.hours;ctx.fillStyle='#fbf7ea';ctx.fillRect(x,y,w,h);ctx.fillStyle='#b8302a';signText(ctx,'営業時間',x+w/2,y+30,w-20,30,GOTHIC);
   ctx.fillStyle='#2a2420';signText(ctx,'モーニング',x+w/2,y+78,w-16,24,GOTHIC);signText(ctx,'7:00〜9:30',x+w/2,y+112,w-16,26,GOTHIC);
   ctx.fillStyle='#2f5d46';signText(ctx,'月〜金',x+w/2,y+160,w-16,24,GOTHIC);ctx.fillStyle='#8a7f70';signText(ctx,'土日 休み',x+w/2,y+194,w-16,20,GOTHIC);}
  // The menu in the right pane, in her hand: three lines at one price.
  {const [x,y,w,h]=ATLAS.menu;ctx.fillStyle='#fbf3dc';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#2f5d46';ctx.lineWidth=6;ctx.strokeRect(x+8,y+8,w-16,h-16);
   ctx.fillStyle='#2f5d46';signText(ctx,'メニュー',x+w/2,y+40,w-30,30,MINCHO);
   KISSA_MENU.forEach((item,i)=>{const yy=y+96+i*58;ctx.fillStyle='#2a2420';signText(ctx,item.jp,x+w/2,yy,w-30,item.jp.length>5?20:24,GOTHIC);ctx.fillStyle='#b8302a';signText(ctx,'¥'+item.cost,x+w/2,yy+26,w-60,20,GOTHIC);});}
  // The coffee poster in the left pane: a steaming cup, 珈琲 and サイフォン, drawn by hand.
  {const [x,y,w,h]=ATLAS.poster;ctx.fillStyle='#5a3422';ctx.fillRect(x,y,w,h);ctx.fillStyle='#efe2c4';ctx.fillRect(x+12,y+12,w-24,h-24);
   ctx.fillStyle='#f8f6f0';ctx.strokeStyle='#5a3422';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x+w/2,y+h*.62,54,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(x+w/2-36,y+h*.45);ctx.lineTo(x+w/2-30,y+h*.6);ctx.lineTo(x+w/2+30,y+h*.6);ctx.lineTo(x+w/2+36,y+h*.45);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(x+w/2+44,y+h*.52,10,-Math.PI/2,Math.PI/2);ctx.stroke();
   ctx.strokeStyle='rgba(90,52,34,.6)';ctx.lineWidth=4;for(const dx of [-14,0,14]){ctx.beginPath();ctx.moveTo(x+w/2+dx,y+h*.4);ctx.quadraticCurveTo(x+w/2+dx+10,y+h*.33,x+w/2+dx,y+h*.26);ctx.stroke();}
   ctx.fillStyle='#5a3422';signText(ctx,'珈琲',x+w/2,y+50,w-50,44,MINCHO);ctx.fillStyle='#2f5d46';signText(ctx,'サイフォン',x+w/2,y+h-40,w-40,24,GOTHIC);}
  // The A-board: a dark green board in white chalk, read along the footway.
  {const [x,y,w,h]=ATLAS.aboard;ctx.fillStyle='#24453a';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#8a6641';ctx.lineWidth=8;ctx.strokeRect(x+4,y+4,w-8,h-8);
   ctx.fillStyle='#f4f0e2';signText(ctx,'喫茶ひが',x+w/2,y+30,w-20,22,MINCHO);signText(ctx,'モーニング',x+w/2,y+70,w-20,18,GOTHIC);
   ctx.fillStyle='#f2c75c';signText(ctx,'¥300',x+w/2,y+102,w-30,24,GOTHIC);ctx.fillStyle='#f4f0e2';signText(ctx,'トースト',x+w/2,y+136,w-24,15,GOTHIC);signText(ctx,'ゆでたまご付',x+w/2,y+158,w-20,14,GOTHIC);}
  // The kusu's card: 非売品, not for sale.
  {const [x,y,w,h]=ATLAS.kusu;ctx.fillStyle='#ffffff';ctx.fillRect(x,y,w,h);ctx.fillStyle='#b8302a';signText(ctx,'非売品',x+w/2,y+40,w-12,28,MINCHO);
   ctx.fillStyle='#2a2420';signText(ctx,'古酒',x+w/2,y+80,w-20,24,MINCHO);}
  // The paper on the shutter (KISSA_NOTICE): a sheet in her brush hand, the name, the hours, the days, and where the drink is.
  {const [x,y,w,h]=ATLAS.notice;ctx.fillStyle='#f8f4ea';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(120,110,100,.35)';ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,w-6,h-6);
   ctx.fillStyle='#1d1d1d';signText(ctx,KISSA_NOTICE.jp,x+w/2,y+26,w-14,22,MINCHO);
   KISSA_NOTICE.jpLines.forEach((l,i)=>{ctx.fillStyle=i===2?'#b8302a':'#2a2420';signText(ctx,l,x+w/2,y+62+i*32,w-12,i===2?16:15,MINCHO);});
   ctx.fillStyle='#2a2420';signText(ctx,'比嘉',x+w-26,y+h-18,40,14,MINCHO);}
  // The photograph over the table: the island bus on the coast road, in the browns of an old print.
  {const [x,y,w,h]=ATLAS.photo;ctx.fillStyle='#efe4cc';ctx.fillRect(x,y,w,h);const p=[x+6,y+6,w-12,h-12];
   const g=ctx.createLinearGradient(0,p[1],0,p[1]+p[3]);g.addColorStop(0,'#d9c8a4');g.addColorStop(.55,'#c7b08a');g.addColorStop(.56,'#8f7a5a');g.addColorStop(1,'#a8916c');ctx.fillStyle=g;ctx.fillRect(...p);
   ctx.fillStyle='#5f4a34';ctx.fillRect(p[0]+18,p[1]+30,64,30);ctx.fillStyle='#e7dcc4';for(let i=0;i<4;i++)ctx.fillRect(p[0]+24+i*14,p[1]+35,10,9);
   ctx.fillStyle='#2e2418';for(const cx of [p[0]+30,p[0]+70]){ctx.beginPath();ctx.arc(cx,p[1]+61,6,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='rgba(60,40,20,.25)';ctx.fillRect(p[0],p[1]+p[3]-6,p[2],6);}
 });
}
/** A quad of the lettering sheet: region `r` drawn w×h at `at`, facing +z turned by ry, in the shop-house's frame. */
function letteringQuad(r,w,h,at,ry=0){
 const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,[px,py,pw,ph]=r;
 const u0=px/ATLAS.w,u1=(px+pw)/ATLAS.w,v1=1-py/ATLAS.h,v0=1-(py+ph)/ATLAS.h;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)?u1:u0,uv.getY(i)?v1:v0);
 g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1)));
 return g;
}
/**
 * Where the lettering sits, each face 6 mm or more in front of the board or pane it is on (tests/no-z-fighting.test.mjs).
 * The cards in the door's fixed panes are 1 cm behind the glass, taped to its inside, read from the street. The frame is
 * the street's (y 0 the pavement); what is on the fittings is 8 cm up with the shop's floor (HIGA_FRAME.floor).
 */
export const HIGA_LETTERING=Object.freeze({
 // The paper on the shutter's face, 6 mm in front of its steel (read when the shutter is down).
 notice:Object.freeze({r:'notice',w:.3,h:.42,at:Object.freeze([-.55,1.45,D-.134]),ry:0}),
 valance:Object.freeze({r:'valance',w:4.56,h:.24,at:Object.freeze([0,2.735,D+.966]),ry:0}),
 tin:Object.freeze({r:'tin',w:.8,h:.5,at:Object.freeze([-W-.028,1.85,1.0]),ry:-Math.PI/2}),
 hours:Object.freeze({r:'hours',w:.22,h:.3,at:Object.freeze([-1.45,1.96,PANE_Z-.01]),ry:0}),
 menu:Object.freeze({r:'menu',w:.42,h:.58,at:Object.freeze([1.5,1.5,PANE_Z-.01]),ry:0}),
 poster:Object.freeze({r:'poster',w:.42,h:.58,at:Object.freeze([-1.5,1.43,PANE_Z-.01]),ry:0}),
 kusu:Object.freeze({r:'kusu',w:.13,h:.15,at:Object.freeze([-1.62,.42,-1.114]),ry:0}),
 // The photograph in its frame over the table (the frame is the fittings', 8 cm up with the floor), 6 mm off its board.
 photo:Object.freeze({r:'photo',w:.36,h:.27,at:Object.freeze([open-.031,1.6,2.1]),ry:-Math.PI/2}),
});

const ALU=0xb8bec0,TIMBER=0x8a6641,DARK=0x5d4431,CRATE=0xe8b62c,CRATE_DARK=0xc99a1e,BOTTLE=0x5a3416;

/**
 * Kissa Higa's fittings, drawn in the kit standing on the finished floor (houses.js shopInterior's fitted frame). Returns
 * their colliders. The record player, the two bentwood chairs and the grinder are Meshy models placed by
 * kissa-higa-props.js; their cabinet, the table and the chairs' solids are here, so nobody walks through a chair before it
 * has loaded.
 */
export function higaInterior(kit){
 const solids=[];
 // The coffee counter across the back, its end open on the police-station side (+x) so she comes round, and customers pay there.
 {const x0=-open,x1=.4,z0=-.75,z1=-.15;
  kit.block(x0,x1,0,.9,z0,z1,0x6e4b30);kit.block(x0-.02,x1+.02,.9,.95,z0-.02,z1+.03,0xb98c5a);
  for(let i=0;i<8;i++)kit.box(.02,.78,.012,x0+.18+i*.3,.47,z1+.006,0x5d3f28);
  // the register and her abacus, kept
  kit.box(.36,.2,.3,-.35,1.05,-.45,0xd9d2bf);kit.box(.3,.1,.1,-.35,1.2,-.52,0x3a4448,{rx:-.4});kit.box(.32,.04,.18,-.35,.97,-.33,0x9fa5a8);
  kit.box(.34,.025,.11,.08,.963,-.36,0x4a2f1e);for(let k=0;k<5;k++)kit.box(.3,.012,.012,.08,.98,-.4+k*.02,0x2b1d12);
  // the fridge-freezer's door on her side, under the Kitano Road end, 8 mm off the counter's back
  kit.box(.58,.78,.012,-1.65,.47,z0-.014,0xeef0ec);kit.box(.02,.26,.02,-1.39,.62,z0-.03,0xb8bec0,{finish:'metal'});
  solids.push(kit.rect(x0,x1+.02,z0-.04,z1+.012,1.0,'kissa-counter'));}
 // The customers' ledge at 74 cm along the counter's front, 2 mm off its face, on three brackets; it stops short of the
 // register, leaving the middle of the room clear to walk up to the counter's open end and pay.
 {const x0=-open,x1=-.32,z0=-.148,z1=.16;
  kit.block(x0,x1,.71,.74,z0,z1,0xb98c5a);
  for(const x of [x0+.14,(x0+x1)/2,x1-.12])kit.block(x-.02,x+.02,.5,.71,z0,z0+.2,0x5d3f28);
  solids.push(kit.rect(x0,x1,z0,z1,.75,'kissa-ledge'));}
 // The three stools (commerce/kissa-higa.js KISSA_SEATS): a chrome foot and column, a red vinyl seat whose top is 46 cm up.
 for(const x of [-1.66,-1.12,-.58]){const z=.44;
  kit.cyl(.16,.17,.025,x,.0125,z,0xc8cdd0,{segments:16,finish:'metal'});kit.cyl(.025,.025,.375,x,.2125,z,0xc8cdd0,{segments:8,finish:'metal'});
  kit.cyl(.17,.16,.06,x,.43,z,0xa3202a,{segments:16});
  solids.push(kit.rect(x-.17,x+.17,z-.17,z+.17,.47,'kissa-stool'));}
 // The worktop: the kettle on its gas ring at the Kitano Road end, two siphons on spirit lamps (their glass and flames are
 // the frontage's), the cups waiting upside down on a cloth and the sugar pot. The grinder is a model (kissa-higa-props.js).
 {const x=-1.86,z=-.5;kit.cyl(.08,.085,.035,x,.9675,z,0x3a3d40,{segments:14,finish:'metal'});
  kit.sphere(.07,x,1.04,z,0xf2f1ec,{sy:.85,detail:2,finish:'gloss'});kit.cyl(.045,.05,.012,x,1.096,z,0xf2f1ec,{segments:12});kit.cyl(.012,.012,.02,x,1.11,z,0x222222,{segments:8});
  kit.rod([x+.05,1.0,z],[x+.11,1.1,z],.006,0xf2f1ec);kit.rod([x+.11,1.1,z],[x+.14,1.115,z],.005,0xf2f1ec);
  kit.rod([x-.065,1.02,z],[x-.09,1.09,z],.008,0x222222);kit.rod([x-.09,1.09,z],[x-.04,1.105,z],.008,0x222222);}
 for(const x of SIPHON_X){const z=SIPHON_Z;
  kit.cyl(.055,.06,.01,x,.955,z,0xc8cdd0,{segments:14,finish:'metal'});kit.rod([x-.055,.96,z],[x-.055,1.28,z],.006,0xc8cdd0,{finish:'metal'});
  kit.rod([x-.055,1.14,z],[x-.012,1.14,z],.004,0xc8cdd0,{finish:'metal'});
  kit.cyl(.012,.012,.008,x,1.0,z,0x2a2a2a,{segments:8});
  // the coffee in the lower flask, inside its glass
  kit.sphere(.04,x,1.062,z,0x2a1a10,{sy:.55,detail:1});}
 kit.box(.2,.004,.15,-.68,.952,-.38,0xe8ecef);
 for(const [x,z] of [[-.73,-.41],[-.63,-.41],[-.73,-.34],[-.63,-.34]])kit.cyl(.03,.035,.06,x,.984,z,0xf4f2ec,{segments:10});
 kit.cyl(.035,.035,.06,-.62,.98,-.6,0xf4f2ec,{segments:10});kit.cyl(.01,.01,.015,-.62,1.017,-.6,0xb98c5a,{segments:6});
 // Behind the counter: the cup shelf on the back wall (the dear bottles' shelf), and the family kusu on its stand in the corner.
 {const x0=-1.2,x1=-.3,z0=back+.06,z1=back+.3,zc=(z0+z1)/2;
  kit.block(x0,x1,0,.6,z0,z1,0x6e4b30);for(const y of [1.0,1.45,1.9])kit.block(x0,x1,y-.02,y,z0,z1,0x8a6641);
  for(const x of [x0-.02,x1+.02])kit.box(.04,1.95,.24,x,.975,zc,0x5d3f28);
  for(const y of [1.0,1.45])for(let i=0;i<5;i++){const x=x0+.1+i*.175;kit.cyl(.06,.06,.012,x,y+.006,zc,0xf4f2ec,{segments:12});kit.cyl(.035,.03,.06,x,y+.042,zc,0xf4f2ec,{segments:10});}
  for(let i=0;i<3;i++)kit.cyl(.07,.07,.16,x0+.17+i*.28,1.98,zc,[0x8a5a2a,0x2f5d46,0xb8302a][i],{segments:12,finish:'gloss'});
  solids.push(kit.rect(x0-.04,x1+.04,back,z1+.02,2.3,'kissa-cup-shelf'));}
 {const x=-1.62,z=-1.42;
  kit.box(.62,.25,.62,x,.125,z,0x4a3324);kit.sphere(.27,x,.55,z,0x8a5a3c,{sy:1.15,detail:2});
  kit.cyl(.1,.13,.12,x,.88,z,0x8a5a3c,{segments:12});kit.cyl(.14,.14,.04,x,.96,z,0xa07a4a,{segments:12});
  for(const ry of [0,Math.PI/2])kit.box(.3,.012,.012,x,.985,z,0xcfc29a,{ry});
  kit.box(.11,.13,.006,x,.98,z+.135,0xf6f0e2);
  kit.box(.15,.17,.01,-1.62,.34,-1.125,0xe9e4d6);
  solids.push(kit.rect(x-.33,x+.33,z-.33,-1.07,1.0,'kissa-kusu'));}
 // The doorway to the storeroom, in the back wall at the counter's open end (its noren is the frontage's).
 kit.block(.8,1.5,0,1.9,back+.06,back+.08,0x2c2520);for(const x of [.78,1.52])kit.block(x-.03,x+.03,0,1.95,back+.06,back+.1,TIMBER);kit.block(.75,1.55,1.9,1.98,back+.06,back+.1,TIMBER);
 // The record player's cabinet on the Kitano Road wall, where the jars stood (the player is a model on top), and the
 // crate of 45s on the floor beside it.
 {const x0=-open+.02,x1=-1.66,z0=1.35,z1=1.85;kit.block(x0,x1,0,.62,z0,z1,0x6e4b30);
  for(const z of [z0+.125,z1-.125])kit.box(.006,.5,.22,x1+.003,.33,z,0x5d3f28);
  solids.push(kit.rect(-open,x1+.02,z0,z1,.95,'kissa-record-cabinet'));
  kit.block(-2.03,-1.75,0,.2,1.93,2.21,0x8a6641);
  // 45s: seven-inch sleeves, 18 cm square
  for(let i=0;i<8;i++)kit.box(.18,.18,.006,-1.89,.22,1.96+i*.03,[0xb8302a,0x2f5d46,0xe8dcc0,0x24557d][i%4],{rx:.14});
  solids.push(kit.rect(-2.05,-1.73,1.91,2.23,.38,'kissa-record-crate'));}
 // The paper rack on the Kitano Road wall by the door, where the cold case stood: the week's town paper and two magazines.
 {const z0=2.45,z1=3.05;kit.block(-open+.005,-1.95,.95,.98,z0,z1,0x6e4b30);kit.block(-1.965,-1.95,.98,1.1,z0,z1,0x6e4b30);
  kit.box(.012,.34,.26,-1.99,1.14,2.62,0xece6d6,{rz:-.2});kit.box(.012,.3,.2,-2.0,1.12,2.86,0xd88a3a,{rz:-.24});kit.box(.012,.3,.2,-2.01,1.12,2.98,0x5a8ab8,{rz:-.26});
  solids.push(kit.rect(-open,-1.94,z0,z1,1.6,'kissa-paper-rack'));}
 // The table for two by the police-station wall, its top at 72 cm, a sugar pot and a napkin holder on it; the two
 // bentwood chairs' solids (the chairs are models, kissa-higa-props.js KISSA_CHAIRS).
 {const x=1.3,z=2.1;kit.cyl(.32,.32,.03,x,.705,z,0x8a6641,{segments:20});kit.cyl(.03,.03,.68,x,.35,z,0x5d3f28,{segments:8});kit.cyl(.2,.22,.02,x,.01,z,0x5d3f28,{segments:16});
  kit.cyl(.03,.03,.05,x+.1,.745,z,0xf4f2ec,{segments:10});kit.box(.08,.06,.03,x-.1,.75,z,0xc8cdd0,{finish:'metal'});
  solids.push(kit.rect(x-.32,x+.32,z-.32,z+.32,.74,'kissa-table'));
  for(const c of KISSA_CHAIRS)solids.push(kit.rect(c.at[0]-.22,c.at[0]+.22,c.at[2]-.275,c.at[2]+.275,.9,'kissa-chair'));}
 // The bus photograph's frame over the table (its print is the lettering's), 4 mm off the wall.
 kit.box(.02,.34,.44,open-.014,1.52,2.1,0x5d3f28);
 return solids;
}
/** The siphons on the worktop, in the shop-house frame: x of each, and their z. */
const SIPHON_X=Object.freeze([-1.5,-1.17]),SIPHON_Z=-.45;
/**
 * The three Meshy models, where they stand in the shop-house frame (y from the finished floor), how big they are and which
 * way they face (ry about y; 0 faces Main Street, +z). kissa-higa-props.js places them.
 */
export const KISSA_MODELS=Object.freeze({
 'record-player':Object.freeze({file:'record-player.glb',size:Object.freeze({w:.42}),at:Object.freeze([-1.86,.62,1.6]),ry:Math.PI/2}),
 'hand-grinder':Object.freeze({file:'hand-grinder.glb',size:Object.freeze({h:.2}),at:Object.freeze([-.95,.95,-.42]),ry:0}),
 'bentwood-chair':Object.freeze({file:'bentwood-chair.glb',size:Object.freeze({h:.86})}),
});
/** The two bentwood chairs at the table: their seats are commerce/kissa-higa.js KISSA_SEATS chair-0 and chair-1. */
export const KISSA_CHAIRS=Object.freeze([Object.freeze({id:'chair-0',at:Object.freeze([1.3,0,1.5]),ry:0}),Object.freeze({id:'chair-1',at:Object.freeze([1.3,0,2.7]),ry:Math.PI})]);

/**
 * The building's own articulation and the props outside, drawn into the quarter's kit (one batch with the street).
 * Called from shopHouse inside its frame. Returns colliders.
 */
export function higaBuilding(kit,{trim=0x8a3b2e}={}){
 const solids=[],band=0xd8c4b8,hood=0xdacdc2,sill=0xc9bdb2;
 // The slab band and the coping, as on Nakamura's.
 kit.block(-W-.025,-W,3.17,3.33,-D,D,band);kit.block(W,W+.025,3.17,3.33,-D,D,band);kit.block(-W-.025,W+.025,3.17,3.33,-D-.025,-D,band);
 kit.block(-W-.03,W+.03,H+.5,H+.55,-D-.03,-D+.17,band);
 kit.block(-W-.03,-W+.17,H+.5,H+.55,-D+.17,D-.18,band);kit.block(W-.17,W+.03,H+.5,H+.55,-D+.17,D-.18,band);
 // Hoods over the two upper windows at the front (shopHouse's frames at ±W·.48).
 for(const x of [-W*.48,W*.48])kit.box(1.8,.08,.32,x,5.56,D+.16,hood);
 // The front: the aluminium sash's head, sill, mullions and kick plates (the panes and the leaves are the frontage's).
 kit.block(-open,open,DOOR_H,DOOR_H+.08,D-.53,D-.36,ALU,'metal');kit.block(-open,open,DOOR_H+.08,3.0,D-.46,D-.42,trim);
 kit.block(-open,open,.08,.1,D-.53,D-.36,ALU,'metal');
 for(const x of [-open+.025,-DOOR-.02,DOOR+.02,open-.025])kit.box(.05,DOOR_H-.1,.06,x,(DOOR_H+.1)/2,PANE_Z,ALU,{finish:'metal'});
 // The fixed panes are solid; the doorway between them is the leaves' (higaFrontage doorSolid).
 solids.push(kit.rect(-open,-DOOR,D-.45,D-.35,2.7,'higa-front-pane'),kit.rect(DOOR,open,D-.45,D-.35,2.7,'higa-front-pane'));
 for(const s of [-1,1])kit.block(s<0?-open+.05:DOOR+.045,s<0?-DOOR-.045:open-.05,.1,.45,D-.415,D-.385,ALU,'metal');
 // The canvas awning: two steel arms from the wall, the sloping canvas and its lettered valance.
 for(const x of [-2.15,2.15])kit.rod([x,3.12,D+.02],[x,2.86,D+.92],.018,0x5f6568);
 // Re-covered in green canvas for Kissa Higa (30 October 2026); the sugidama, the sake seller's sign, came down with it.
 kit.box(4.6,.025,.98,0,2.995,D+.47,0x346b4f,{rx:.27});kit.box(4.6,.26,.02,0,2.735,D+.95,0x2f5d46);
 kit.box(.06,.05,.05,-2.3,2.86,D+.94,0x5f6568);kit.box(.06,.05,.05,2.3,2.86,D+.94,0x5f6568);
 // The flanks: one upstairs window each side, and on Kitano Road the storeroom's grilled window, the meter and the tin.
 const sideWindow=(z,y,wz,hy,s)=>{const x=s*W;
  kit.box(.05,hy+.12,wz+.12,x+s*.025,y,z,ALU,{finish:'metal'});kit.box(.04,hy-.02,wz-.02,x+s*.04,y,z,0x5d7a84,{finish:'window'});
  kit.box(.05,hy-.02,.04,x+s*.065,y,z,ALU,{finish:'metal'});kit.box(.16,.06,wz+.2,x+s*.08,y-hy/2-.09,z,sill);kit.box(.32,.08,wz+.3,x+s*.16,y+hy/2+.1,z,hood);};
 sideWindow(1.4,4.75,1.2,1.1,-1);sideWindow(1.4,4.75,1.2,1.1,1);
 {const z=-2.9,y=1.55,blue=0x6d7477,x=-W;
  kit.box(.05,.9,1.0,x-.025,y,z,blue);kit.box(.04,.76,.86,x-.04,y,z,0xdfe6e4,{finish:'glow'});
  kit.box(.14,.05,1.08,x-.07,y-.475,z,sill);kit.box(.36,.08,1.2,x-.18,2.08,z,hood);
  for(let i=0;i<6;i++)kit.rod([x-.115,1.1,z-.42+i*.168],[x-.115,2.0,z-.42+i*.168],.012,0x8e979a);}
 {const z=3.1;kit.box(.16,.48,.36,-W-.08,1.8,z,0x9a958a);kit.cyl(.07,.07,.02,-W-.17,1.8,z,0x3a4448,{rz:Math.PI/2,segments:12});
  kit.rod([-W-.045,2.04,z],[-W-.045,6.0,z],.025,0x8e979a);kit.rod([-W-.045,6.0,z],[-W-.15,6.07,z],.025,0x8e979a);}
 {const T=HIGA_LETTERING.tin;kit.box(.02,.54,.84,-W-.01,T.at[1],T.at[2],0xf1e6c8);}
 // The back: the storeroom's steel door, its hood and step, and the stock room's window over it.
 {const x=.7;
  kit.box(1.0,2.1,.06,x,1.05,-D-.03,ALU,{finish:'metal'});kit.box(.86,2.0,.04,x,1.02,-D-.07,0x7b6f68);
  kit.box(.03,.18,.05,x+.33,1.0,-D-.115,0xd8dcdc,{finish:'metal'});
  kit.box(1.2,.08,.55,x,2.26,-D-.275,hood);kit.box(1.0,.15,.4,x,.075,-D-.2,0xc4c0b4);
  solids.push(kit.rect(x-.52,x+.52,-D-.42,-D,.5,'higa-back-step'));
  kit.box(1.32,1.22,.05,x,4.85,-D-.025,ALU,{finish:'metal'});kit.box(1.18,1.08,.04,x,4.85,-D-.04,0x5d7a84,{finish:'window'});
  kit.box(1.4,.06,.16,x,4.21,-D-.08,sill);kit.box(1.5,.08,.32,x,5.49,-D-.16,hood);}
 // The empties by the door on the Kitano Road side: yellow crates of large bottles, three and two high.
 {const crate=(x,y,z)=>{kit.box(.32,.29,.44,x,y+.145,z,CRATE);kit.box(.33,.04,.45,x,y+.275,z,CRATE_DARK);kit.box(.2,.06,.01,x,y+.18,z+.226,0xb8302a);};
  for(const [x,n] of [[-1.5,3],[-1.16,2]]){for(let i=0;i<n;i++)crate(x,i*.3,4.11);
   for(let a=0;a<2;a++)for(let b=0;b<4;b++)kit.cyl(.028,.028,.06,x-.075+a*.15,n*.3+.03,4.11-.165+b*.11,BOTTLE,{segments:6});}
  solids.push(kit.rect(-1.68,-.98,3.87,4.35,.95,'higa-empties'));}
 // The yuntaku bench and the two crate stools (commerce/higa-liquor.js YUNTAKU: the same numbers, in the world).
 {const B=YUNTAKU.bench,[bx0,bz0]=toLocal(B.x-B.depth/2,B.z0),[bx1,bz1]=toLocal(B.x+B.depth/2,B.z1);
  const x0=Math.min(bx0,bx1),x1=Math.max(bx0,bx1),z0=Math.min(bz0,bz1),z1=Math.max(bz0,bz1);
  // Four slats with 1 cm between them, the outer two flush with the bench's edges: the seat's `front` is where they end.
  for(let i=0;i<4;i++)kit.block(x0,x1,B.height-.035,B.height,z0+i*(z1-z0)/4+(i?.005:0),z0+(i+1)*(z1-z0)/4-(i<3?.005:0),0xa98257);
  kit.block(x0+.04,x1-.04,B.height-.08,B.height-.035,z0+.03,z1-.03,DARK);
  for(const x of [x0+.08,x1-.08])for(const z of [z0+.06,z1-.06])kit.box(.06,B.height-.08,.06,x,(B.height-.08)/2,z,DARK);
  solids.push(kit.rect(x0,x1,z0,z1,B.height+.04,'higa-bench'));
  for(const c of YUNTAKU.crates){const [x,z]=toLocal(c.x,c.z);
   kit.box(.45,.27,.36,x,.135,z,CRATE);kit.box(.46,.04,.37,x,.29,z,CRATE_DARK);for(const dx of [-.12,.12])kit.box(.12,.005,.26,x+dx,.312,z,0xc99a1e);
   solids.push(kit.rect(x-.23,x+.23,z-.19,z+.19,.33,'higa-crate-stool'));}}
 return solids;
}
/** A world point in the shop-house's frame (the inverse of higaPoint). */
const toLocal=(x,z)=>[z-HIGA_FRAME.origin[1],HIGA_FRAME.origin[0]-x];

/** The shutter's steel: ribbed slats in the trim's paint, the bottom rail and its lock darker (as Nakamura's). */
function shutterSteel(trim){
 const c=new THREE.Color(trim),hex=k=>'#'+c.clone().multiplyScalar(k).getHexString();
 return paint(128,512,(ctx,w,h)=>{
  ctx.fillStyle=hex(1);ctx.fillRect(0,0,w,h);
  const rail=14,slats=46,pitch=(h-rail)/slats;
  for(let i=0;i<slats;i++){const y=i*pitch;ctx.fillStyle=hex(1.18);ctx.fillRect(0,y+1,w,2);ctx.fillStyle=hex(.72);ctx.fillRect(0,y+pitch-2,w,2);}
  const g=ctx.createLinearGradient(0,h*.7,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(235,230,215,.18)');ctx.fillStyle=g;ctx.fillRect(0,h*.7,w,h*.3);
  ctx.fillStyle=hex(.55);ctx.fillRect(0,h-rail,w,rail);ctx.fillStyle='#c9cdcc';ctx.fillRect(w/2-5,h-rail+3,10,7);
 });
}
/** The storeroom's noren: plain indigo with the family crest's ring, the same both sides. */
function norenCloth(){
 return paint(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#24365a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1a2847';ctx.fillRect(0,0,w,14);
  ctx.strokeStyle='#e8e4d8';ctx.lineWidth=10;ctx.beginPath();ctx.arc(w/2,h*.45,48,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#e8e4d8';ctx.font=`bold 52px ${MINCHO}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('比',w/2,h*.46);
  ctx.fillStyle='#0e1424';ctx.fillRect(w/2-3,18,6,h-18);
 });
}

/**
 * The front, in its own group in the shop-house's frame: the glass (the two fixed panes and the siphons' glass, one
 * mesh), the two door leaves, the roller shutter with the kissaten's paper on it, the tubes and the spirit lamps' flames,
 * the storeroom's noren, the A-board and the lettering sheet. `update(minutes)` follows Kissa Higa's clock
 * (commerce/kissa-higa.js): the shutter rolls up and down, the doors slide open while it is up, the tubes light while
 * Grandmother Higa is in, the lamps burn and the board is out while it is open. It returns true when the way in or the A-board obstacle changes, so nearby routes can be searched again.
 */
export function higaFrontage({origin=HIGA_FRAME.origin,trim=0x8a3b2e,shadows=false,getOccupants=()=>[]}={}){
 const group=new THREE.Group();group.name='Kissa Higa frontage';group.position.set(origin[0],0,origin[1]);group.rotation.y=-Math.PI/2;
 group.userData.placeId='kissa-higa';
 const F=HIGA_FRAME.floor,sheet=paintLettering(),letters=new THREE.MeshStandardMaterial({map:sheet,roughness:.8});
 const {notice,...fixedLettering}=HIGA_LETTERING;
 const lettering=new THREE.Mesh(mergeGeometries(Object.values(fixedLettering).map(q=>letteringQuad(ATLAS[q.r],q.w,q.h,q.at,q.ry))),letters);
 lettering.name='Kissa Higa lettering (valance, tin, cards, poster, menu, photograph)';lettering.receiveShadow=true;group.add(lettering);
 // The paper taped to the shutter: its own quad, travelling with the slats and cropped at the roller box.
 const paper=new THREE.Mesh(letteringQuad(ATLAS[notice.r],notice.w,notice.h,notice.at,notice.ry),letters);paper.name='Kissa Higa notice';paper.receiveShadow=true;group.add(paper);
 const paperPositions=paper.geometry.attributes.position,paperUV=paper.geometry.attributes.uv,paperBaseY=Array.from({length:paperPositions.count},(_,i)=>paperPositions.getY(i));
 const v0=Math.min(...Array.from({length:paperUV.count},(_,i)=>paperUV.getY(i))),v1=Math.max(...Array.from({length:paperUV.count},(_,i)=>paperUV.getY(i)));
 // The glass: the two fixed panes (clear shop glass, drawn after the room), and the siphons' flasks, top bowls, tubes and
 // lamps in a glass that shows (a faint blue tint and its own sheen): in the clear shop glass the flasks vanished and the
 // coffee in them hung in the air.
 const glass=createShopGlass(),at=(g,x,y,z,ry=0)=>{g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1)));return g;};
 const panes=[at(new THREE.PlaneGeometry(open-DOOR-.1,DOOR_H-.47),-(open+DOOR)/2,(DOOR_H+.45)/2,PANE_Z),at(new THREE.PlaneGeometry(open-DOOR-.1,DOOR_H-.47),(open+DOOR)/2,(DOOR_H+.45)/2,PANE_Z)];
 const fixed=new THREE.Mesh(mergeGeometries(panes),glass);fixed.name='Kissa Higa glass';fixed.renderOrder=2;group.add(fixed);
 const bowl=[[.008,0],[.012,.02],[.042,.085],[.05,.14],[.05,.165]].map(([r,y])=>new THREE.Vector2(r,y)),parts=[];
 for(const x of SIPHON_X){const z=SIPHON_Z,y=F+.95;
  parts.push(at(new THREE.CylinderGeometry(.026,.03,.045,12),x,y+.0225,z),at(new THREE.SphereGeometry(.05,16,12),x,y+.125,z),
   at(new THREE.LatheGeometry(bowl,14),x,y+.185,z),at(new THREE.CylinderGeometry(.006,.006,.13,8),x,y+.16,z));}
 const siphonGlass=new THREE.MeshStandardMaterial({color:0xcfe8ef,roughness:.08,metalness:0,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide,emissive:0x6f8f99,emissiveIntensity:.15});
 const siphons=new THREE.Mesh(mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g)),siphonGlass);
 siphons.name='Kissa Higa siphon glass';siphons.renderOrder=2;group.add(siphons);
 // The two leaves: frame, glass and pull; slid shut, or open behind the fixed panes.
 const leaves=[];
 for(const s of [-1,1]){
  const leaf=new THREE.Group();leaf.name=`Kissa Higa door leaf (${s<0?'Kitano Road':'police station'} side)`;group.add(leaf);
  const k=createKit({shadows});
  k.box(DOOR,.06,.04,0,DOOR_H-.06,0,ALU,{finish:'metal'});k.box(DOOR,.12,.04,0,.17,0,ALU,{finish:'metal'});
  for(const x of [-DOOR/2+.025,DOOR/2-.025])k.box(.05,DOOR_H-.12,.04,x,(DOOR_H+.08)/2,0,ALU,{finish:'metal'});
  k.box(.03,.3,.05,-s*(DOOR/2-.09),1.1,0,0x8e979a,{finish:'metal'});
  k.finish(leaf,'Kissa Higa door frame');
  const g=new THREE.Mesh(new THREE.PlaneGeometry(DOOR-.1,DOOR_H-.33),glass);g.position.set(0,(DOOR_H+.2)/2,0);g.renderOrder=2;g.name='Kissa Higa door glass';leaf.add(g);
  leaves.push({leaf,s});
 }
 // The roller shutter, as Nakamura's, over the whole opening 15 cm behind the piers' faces. It rolls from the bottom: the
 // visible steel shortens from its head, the bottom rail rising, and the ribs keep their pitch (the map is cropped, not squashed).
 const opening={x0:-open,x1:open,foot:.08,head:ground+.02,z:D-.15},tall=opening.head-opening.foot;
 const steel=shutterSteel(trim);
 const shutter=new THREE.Mesh(new THREE.BoxGeometry(opening.x1-opening.x0+.06,tall,.02),new THREE.MeshStandardMaterial({map:steel,metalness:.3,roughness:.6}));
 shutter.name='Kissa Higa shutter';shutter.receiveShadow=true;group.add(shutter);
 // The lights: two fluorescent fittings (their white housings and the tubes); the spirit lamps' two small flames.
 const lamps=createKit({shadows:false});
 for(const x of [-.85,.85])for(const z of [.4,2.2]){lamps.box(.14,.05,1.24,x,2.975,z,0xf2f0ea);lamps.cyl(.017,.017,1.18,x,2.935,z,0xfafaf2,{rx:Math.PI/2,segments:6,finish:'tube'});}
 const lit=lamps.finish(group,'Kissa Higa lights').materials.tube;lit.emissive.setHex(0xf4f8ff);lit.emissiveIntensity=0;
 const flameMaterial=new THREE.MeshStandardMaterial({color:0x8ab8ff,emissive:0x4a7aff,emissiveIntensity:1.2,transparent:true,opacity:.85,depthWrite:false});
 const flames=new THREE.Group();flames.name='Kissa Higa spirit lamp flames';group.add(flames);
 for(const x of SIPHON_X){const f=new THREE.Mesh(new THREE.ConeGeometry(.007,.022,8),flameMaterial);f.position.set(x,F+.95+.045+.011,SIPHON_Z);flames.add(f);}
 // The storeroom's noren in the back doorway: cloth, the same picture both sides.
 const noren=new THREE.Mesh(new THREE.PlaneGeometry(.7,.9),new THREE.MeshStandardMaterial({map:norenCloth(),roughness:.95,side:THREE.DoubleSide}));
 noren.name='Kissa Higa storeroom noren';noren.position.set(1.15,F+1.45,back+.16);group.add(noren);
 // The A-board under the awning, turned along the footway: two boards leaning together, the chalk face on each (6 mm out).
 const aboard=new THREE.Group();aboard.name='Kissa Higa A-board';aboard.position.set(ABOARD.x,0,ABOARD.z);group.add(aboard);
 {const wood=new THREE.MeshStandardMaterial({color:0x6e4b30,roughness:.85}),tilt=.24,len=.66,face=letteringQuad(ATLAS.aboard,.3,.42,[0,0,0],0);
  for(const s of [-1,1]){const board=new THREE.Group();board.position.set(s*.075,len/2*Math.cos(tilt),0);board.rotation.z=s*tilt;aboard.add(board);
   const plank=new THREE.Mesh(new THREE.BoxGeometry(.018,len,.4),wood);plank.castShadow=shadows;board.add(plank);
   const chalk=new THREE.Mesh(face.clone(),letters);chalk.rotation.y=s*Math.PI/2;chalk.position.set(s*.0151,.03,0);board.add(chalk);}}
 group.updateMatrixWorld(true);
 const world=(x,z)=>new THREE.Vector3(x,0,z).applyMatrix4(group.matrixWorld);
 // The front's solids: the shutter down and the doors shut, both lifted out of reach while the way in is open (the
 // frame is a quarter turn: the front runs along world z); the A-board's while it is out.
 const front=world(0,opening.z),doorway=world(0,LEAF_Z),board=world(ABOARD.x,ABOARD.z);
 const shutterSolid={id:'higa-shutter',x:front.x,z:front.z,w:.1,d:opening.x1-opening.x0,height:ground-.42,minY:0};
 const doorSolid={id:'higa-doors',x:doorway.x,z:doorway.z,w:.12,d:DOOR*2,height:DOOR_H,minY:0};
 const aboardSolid={id:'kissa-a-board',x:board.x,z:board.z,w:.44,d:.34,height:.7,minY:1e3};
 let passage=null,boardOut=null;const closing=createKissaClosing();
 const update=minutes=>{
  const occupied=getOccupants().some(p=>p&&inKissaHiga(p)),down=closing.update(minutes,occupied),open=kissaOpen(minutes),pass=down<=.4;
  const m=((minutes%1440)+1440)%1440,boardVisible=kissaDay(minutes)&&m>=KISSA.shutterUp&&m<KISSA.shutterDown;
  shutter.visible=down>0;shutter.scale.y=Math.max(down,.001);shutter.position.set(0,opening.head-tall*down/2,opening.z);
  steel.repeat.set(1,Math.max(down,.001));steel.offset.set(0,0);
  shutterSolid.minY=pass?1e3:0;doorSolid.minY=pass?1e3:0;
  for(const {leaf,s} of leaves)leaf.position.set(s*(pass?DOOR*1.5:DOOR/2),0,LEAF_Z);
  lit.emissiveIntensity=down<1&&(occupied||kissaOnDuty(minutes)&&m>=KISSA.shutterUp+KISSA.roll&&m<KISSA.out)?1:0;
  flames.visible=open;aboard.visible=boardVisible;aboardSolid.minY=boardVisible?0:1e3;
  // The sheet travels up on its slats and is cropped at the shutter box, keeping its printed size.
  const lift=tall*(1-down),bottom=notice.at[1]+lift-notice.h/2;
  paper.visible=down>0&&bottom<opening.head;
  for(let i=0;i<paperPositions.count;i++){const y=Math.min(opening.head,paperBaseY[i]+lift);paperPositions.setY(i,y);paperUV.setY(i,v0+(v1-v0)*Math.max(0,Math.min(1,(y-bottom)/notice.h)));}
  paperPositions.needsUpdate=paperUV.needsUpdate=true;paper.geometry.computeBoundingSphere();
  const changed=passage!==null&&(passage!==pass||boardOut!==boardVisible);passage=pass;boardOut=boardVisible;return changed;
 };
 update(720);
 return {group,leaves:leaves.map(l=>l.leaf),shutter,lights:lit,noren,flames,aboard,paper,lettering,shutterSolid,doorSolid,aboardSolid,update,get closingHeld(){return closing.waiting;}};
}
/** The A-board's place, in the shop-house frame: under the awning beside the door on the Kitano Road side. */
const ABOARD=Object.freeze({x:-1.55,z:D+.8});
