import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {createKit,paint,rng} from './kit.js';
import {japaneseSign,signText,iceFlag} from './signs.js';
import {windowGlow} from '../../render/dusk.js';

/**
 * Nakamura Zenzai, dressed as a 1990s Okinawan shop-house that a family has kept for thirty years (the owner, 21 October
 * 2026: "the ice cream shop looks abhorrent as it is"). The building was a cream box: three blank flanks, an English
 * fascia, an English menu behind the syrups and nothing that said a family lived upstairs. A reinforced-concrete
 * shop-house of the seventies reads by its slab: the floor's edge shows as a band round the walls, every window has a
 * concrete hood (庇) against the rain and the sun, the parapet has a coping, and the services are on the outside: the
 * meters by the street, the gas cylinders and the air conditioner's outdoor unit at the back.
 *
 * Everything here works in the shop-house's own frame (houses.js shopHouse): x along the frontage, +x the stair and the
 * family's door (world +z, towards the drinks machines), z out to the street (+z is Main Street, world -x), y up from the
 * plan's datum; nakamura-plan.js nakamuraPoint turns a point of it into the world. `at` below is that frame.
 *
 * Studied, not copied: the diorama the owner pasted (21 October 2026) suggested most of these; what was left out and
 * why is NAKAMURA_LEFT_OUT. New Yokosuka's Dobuita shop-houses (docs/research/new-yokosuka.md) are the measure for the
 * services on a shop's flank: one meter box by the front at eye height, the conduit up to the eave, crates at the back.
 */

/** The shop-house's frame, as shopHouse builds it for Nakamura's plot (w 4.9, d 7.7). */
export const NAKAMURA_FRAME=Object.freeze({W:2.45,D:3.85,ground:3.3,H:6.1,back:1.65,open:2.07});
const {W,D,ground,H,back}=NAKAMURA_FRAME;

/**
 * What hangs out, lights up or is put up while the counter is open (blue-coral-shop.js dessertShopOpen, 10:00–19:00),
 * so the street can tell from across the road whether Mrs Nakamura is serving.
 */
export const NAKAMURA_OPEN_SIGNS=Object.freeze({
 noren:'hung under the shutter box when the counter opens and taken in when it closes, as a shop does: the noren out means open',
 lanterns:'lit from dusk while the counter is open (17:00–19:00 as the light goes); dark by day and once she has closed',
 parasol:'put up in the table beside the bench when the counter opens and taken in at closing, so it never stands out in the night wind',
 flag:'the 氷 flag on its pole is put out on the pavement with the noren and taken in with it',
 shutter:'the roller shutter rolls up as she comes down at ten and comes down over the counter once she has stepped out at seven',
});

/**
 * When the shutter moves, in town minutes: it rolls up over the first `roll` after opening (she is on her way down the
 * stair), and comes down over `roll` once `after` has passed since closing, by which time she has walked out of the
 * counter (nakamura-plan.js NAKAMURA_GO_HOME). A tenth of a town minute or so is a few seconds at the town clock's
 * speeds (town-clock.js CLOCK_SPEEDS), the time a hand-pulled shutter takes.
 */
export const NAKAMURA_SHUTTER=Object.freeze({roll:.15,after:.25});
/** How far down the shutter is at `minutes`: 0 up (hidden in its box), 1 down to the floor. */
export function nakamuraShutterDown(minutes,{open,close,staffed},{roll,after}=NAKAMURA_SHUTTER){
 if(staffed===false)return 1;
 const m=((minutes%1440)+1440)%1440;
 if(m>=open&&m<open+roll)return 1-(m-open)/roll;
 if(m>=open&&m<close+after)return 0;
 if(m>=close+after&&m<close+after+roll)return (m-close-after)/roll;
 return 1;
}

const item=o=>Object.freeze({...o,at:Object.freeze(o.at)});
/**
 * Every new thing on and around the building, by who it is for and why it is where it is. `at` is its middle in the
 * shop-house's frame; `build` says whether it is part of the building, a prop on the ground, or a thing that follows the
 * opening hours (NAKAMURA_OPEN_SIGNS).
 */
export const NAKAMURA_DRESSING=Object.freeze([
 // The building itself.
 item({id:'slab-band',side:'all',at:[0,3.25,0],build:'building',who:'the building',
  why:'The first floor’s slab edge, shown round the flanks and the back as a cast band: what makes a seventies concrete shop-house read as two storeys instead of a cream box.',period:'Okinawan RC shop-houses of 1965–80 show the slab edge; render over it came later.'}),
 item({id:'coping',side:'all',at:[0,H+.53,0],build:'building',who:'the building',
  why:'A concrete coping on the parapet, the top edge every flat roof in Minato has, so the roof line is not a knife edge.',period:'Standard on flat-roofed concrete houses after the 1950s typhoon rebuilding.'}),
 item({id:'window-hoods',side:'front',at:[0,5.56,D+.16],build:'building',who:'Mrs Nakamura and Mai (the flat upstairs)',
  why:'Concrete hoods (庇) over the two upper windows, against the summer sun and the typhoon rain: the flat’s front room faces west into the afternoon.',period:'Every Okinawan concrete house carries them; a window without one is a mainland window.'}),
 item({id:'flower-boxes',side:'front',at:[0,4.34,D+.17],build:'building',who:'Mrs Nakamura',
  why:'Periwinkles in a box on each upper sill: the one sign from the street that a family lives over the shop.',period:'Nichinichisō (Madagascar periwinkle) flowers all year in Okinawa and needs nothing but water.'}),
 item({id:'front-air-conditioner',side:'front',at:[0,4.85,D+.15],build:'building',who:'the front room upstairs',
  why:'The outdoor unit of the front room’s cooler, between the windows on two angle brackets, its fan behind a grille; it hung higher before, where the hoods now are.',period:'A wall-hung split unit, as every Okinawan flat had by 1990.'}),
 item({id:'front-room-side-windows',side:'left and right',at:[-W,4.85,1.5],build:'building',who:'Mrs Nakamura (the front room)',
  why:'The front room is the corner room of the flat: one side window over Harbour Park, the flat’s best view, and one up Main Street over the drinks machines; aluminium sashes, sills and hoods.',period:'Aluminium sashes replaced timber in the seventies.'}),
 item({id:'kitchen-window',side:'left',at:[-W,1.55,-.35],build:'building',who:'Mrs Nakamura (the kitchen)',
  why:'The kitchen behind the counter, where the beans simmer and the andagi fry, has a frosted window to the park: blue frame, a steel grille because it is on the ground floor beside a public lawn, and a hood over it.',period:'面格子 grilles on ground-floor windows are universal in Japan.'}),
 item({id:'stair-window',side:'right',at:[W,2.75,.2],build:'building',who:'the family’s stair',
  why:'A small frosted window half-way up the stair to the flat, where the steps pass the side wall; it glows at night like the one at the stair head.',period:'A stairwell light, not a view.'}),
 item({id:'back-window',side:'back',at:[-.9,4.85,-D],build:'building',who:'Mai (the back room)',
  why:'Mai’s room is the back of the flat, over the kitchen; its window looks out over the back of the park to the sea bath.',period:'Same sash as the front.'}),
 item({id:'kitchen-door',side:'back',at:[-.9,1.0,-D],build:'building',who:'Mrs Nakamura',
  why:'The kitchen’s service door, where the ice blocks, the beans and the gas come in and the rubbish goes out, never through the customers at the counter; a steel door with a frosted strip, a rain hood and a concrete step.',period:'A back door for deliveries is how a food shop is run.'}),
 item({id:'transom',side:'front',at:[1.6,2.58,D-.045],build:'building',who:'the family door',
  why:'A timber board over the family’s door, filling the space between its frame and the shutter box, with the family’s nameplate (表札) on it.',period:'A Japanese house shows its family name by the door.'}),
 // Services on the walls.
 item({id:'meter-box',side:'right',at:[W+.08,1.8,2.62],build:'prop',who:'the power company’s meter reader',
  why:'Two meters in one grey box, the shop’s and the flat’s (two contracts), near the front of the side wall where the reader can see them from the footway each month; the conduit runs up to the eave where the line from the pole comes in.',period:'Okinawan meters are outside, at eye height, by the street.'}),
 item({id:'back-air-conditioner',side:'back',at:[1.35,4.4,-D-.16],build:'prop',who:'Mai (the back room)',
  why:'The outdoor unit of Mai’s cooler on wall brackets beside her window; the back of the building is where the noise is least.',period:'One unit a room, as split units were sold.'}),
 item({id:'gas-cylinders',side:'back',at:[-2.0,.65,-D-.25],build:'prop',who:'Mrs Nakamura (the kitchen)',
  why:'Two LP gas cylinders for the bean pot and the andagi fryer, chained to the back wall, piped in to the kitchen beside the door, in a slatted timber hutch that keeps the sun off them: the law says a cylinder stays under 40 °C. The dealer swaps the empty one for a full one.',period:'Minato has no town gas; every kitchen on the island runs on cylinders.'}),
 item({id:'bottle-crates',side:'right',at:[W+.22,.45,-2.95],build:'prop',who:'Sakura’s depot (Sakura Trading)',
  why:'Blue crates of empty soda and tea bottles at the back corner, waiting for Sakura’s depot to take them back with the next delivery of full ones; the cold drinks on her menu come by the returnable bottle.',period:'Returnable bottles and their deposit crates were still the rule for island soda in the nineties.'}),
 item({id:'enamel-cider',side:'right',at:[W+.02,1.75,.9],build:'prop',who:'Ryukyu Cider’s bottler',
  why:'The bottler’s enamel tin (ホーロー看板), nailed up the year she first stocked the cider: the soda in her ice case is theirs. It faces the drinks machines and the lawn, where the thirsty are.',period:'Enamel tins went up on every shop that stocked a maker’s goods (okinawa/old-town.js SAKURA_WALL_ADS has Sakura’s).'}),
 // Plants and the customers' corner.
 item({id:'bougainvillea',side:'left',at:[-W-.22,.45,1.2],build:'prop',who:'Mrs Nakamura',
  why:'A concrete trough of bougainvillea along the park side, trained up the wall on wires and left to spread: the flank that faces the bench and the lawn is the one her customers look at while they eat.',period:'Bougainvillea is the Okinawan wall plant; it wants sun and drought.'}),
 item({id:'hibiscus',side:'right',at:[W+.32,.45,3.35],build:'prop',who:'Mai',
  why:'A potted red hibiscus round the corner from the family door, out of the queue’s way; Mai waters it on her way in, and it says “home” beside a shop.',period:'Hibiscus (akabanā) by the door is the Okinawan front-door plant.'}),
 item({id:'bench-table',side:'park',at:[-4.55,.3,2.25],build:'prop',who:'Mrs Nakamura’s customers on the bench',
  why:'A small timber table at the shop end of the dessert bench, for the glass bowl of zenzai while you eat, with a hole for the parasol.',period:'A sweet shop’s bench (縁台) has its tray table.'}),
 // What follows the hours.
 item({id:'noren',side:'front',at:[-.52,2.65,D-.2],build:'open-hours',who:'Mrs Nakamura',
  why:'A half-length indigo noren with ぜんざい across its panels under the shutter box, short enough that the menu tags show under it from the counter: hung out when she opens, taken in at seven.',period:'A noren out is a shop open, everywhere in Japan.'}),
 item({id:'lanterns',side:'front',at:[-.63,2.5,D+.3],build:'open-hours',who:'Mrs Nakamura',
  why:'Two red paper lanterns (赤提灯) under the awning either side of the counter, lit as the light goes while she is still serving; no lamp of their own, they glow.',period:'Red chōchin hang outside sweet shops and eating houses alike.'}),
 item({id:'parasol',side:'park',at:[-4.55,2.2,2.25],build:'open-hours',who:'Mrs Nakamura’s customers on the bench',
  why:'A red parasol (野点傘) in the bench table: the lawn has no tree by the bench, and the afternoon sun comes straight down Main Street.',period:'The red parasol and bench are the sweet shop’s sign in summer.'}),
 item({id:'ice-flag',side:'front',at:[1.88,1.85,D+.35],build:'open-hours',who:'people coming down Main Street',
  why:'The 氷 flag on its pole at the kerb, read from up the street: shaved ice is on. It goes out with the noren and comes in with it, so it never says “ice” over a shut counter.',period:'The kakigōri flag (氷旗) has stood outside every shaved-ice counter in Japan since the Meiji era.'}),
 item({id:'shutter',side:'front',at:[-.52,1.5,D-.15],build:'open-hours',who:'Mrs Nakamura (the shop at night)',
  why:'A roller shutter (シャッター) of ribbed steel, painted the trim’s teal, that rolls down out of the box over the counter opening at closing: the counter, its ice case and its light are shut away, and the street can see from across the road that she is closed. The family’s door and the flat’s windows are not behind it.',period:'Ribbed steel roller shutters, hand-pulled with a hook, closed every Okinawan shop-house front from the sixties on.'}),
]);

/** What the diorama suggested that is not here, and why (nothing random, everything with a purpose). */
export const NAKAMURA_LEFT_OUT=Object.freeze([
 {suggestion:'A-frame chalkboard with the day’s special',why:'Mrs Nakamura has no day’s special: her menu is the five things in NAKAMURA_MENU, and the half-metre apron in front of the counter is where the queue stands. The menu is a row of wooden tags (木札) on the back wall instead, in Japanese, from the same data.'},
 {suggestion:'Cedar slatted screen on the park wall',why:'It would hide nothing and shade nothing; the bougainvillea does that wall’s work.'},
 {suggestion:'Timber hood over a side window',why:'The building is concrete; its hoods are cast concrete like every other window’s.'},
 {suggestion:'Twin air-conditioner units at the back',why:'One room is at the back (Mai’s); the front room’s unit is on the front, between the windows. The shop counter is open to the street and has no cooler.'},
 {suggestion:'Roof safety rail by the water tank',why:'The 50 cm parapet is the roof’s guard, and nobody goes up there but the tank man.'},
 {suggestion:'A retro zenzai poster on the side wall',why:'A shop does not advertise itself on its own flank to a lawn; the maker’s enamel tin is what went up on a shop’s wall.'},
 {suggestion:'The diorama’s “NAKAMURA · ZENZAI & BLUE CORAL” sign and menu',why:'The game already names the shop (中村ぜんざい on the fascia, NAKAMURA_DESSERTS) and its menu and prices (NAKAMURA_MENU); its guesses are not used.'},
 {suggestion:'A point light in each lantern',why:'Phone budget: the lanterns glow by their own material on the town’s evening clock.'},
].map(Object.freeze));

/** Kanji numerals, as a menu tag writes a price: 250 is 二五〇円. */
export const kanjiPrice=yen=>[...String(yen)].map(d=>'〇一二三四五六七八九'[+d]).join('')+'円';
/** The hours as the tags' end board writes them: 10:00–19:00 is 十時〜十九時 on a tag; we write the figures. */
const hoursTag=(open,close)=>`${open/60|0}時〜${close/60|0}時`;

const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif',GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';

/**
 * The shop's lettering on one picture, so the menu tags, the cider tin and the nameplate are one draw call, not three
 * boards of six faces each. Regions are in canvas pixels of a 1024×512 sheet.
 */
const ATLAS=Object.freeze({w:1024,h:512,menu:[0,0,1024,256],tin:[0,272,320,200],plate:[352,272,256,128]});

function paintLettering(menu,{open,close,staffed}){
 return paint(ATLAS.w,ATLAS.h,(ctx)=>{
  // The menu: wooden tags hung in a row, each a name written down it and the price under it, and the hours at the end.
  {const [x0,y0,w,h]=ATLAS.menu;ctx.fillStyle='#6e4f33';ctx.fillRect(x0,y0,w,h);
   const tags=[...menu.map(p=>({name:japaneseSign(p.item),price:kanjiPrice(p.cost)})),{name:staffed===false?'休業中':'営業',price:staffed===false?'CLOSED':hoursTag(open,close),hours:true}];
   const gap=10,tw=(w-gap*(tags.length+1))/tags.length;
   tags.forEach((t,i)=>{
    const x=x0+gap+i*(tw+gap),y=y0+12,th=h-24;
    ctx.fillStyle=t.hours?'#2f5f6a':'#e9d7b0';ctx.fillRect(x,y,tw,th);
    ctx.fillStyle='rgba(120,80,40,.18)';for(let k=0;k<5;k++)ctx.fillRect(x,y+18+k*44,tw,2);
    ctx.fillStyle=t.hours?'#f4ead2':'#2a1e14';ctx.textAlign='center';ctx.textBaseline='middle';
    const chars=[...t.name],size=Math.min(40,Math.floor((th*.64)/chars.length));
    ctx.font=`bold ${size}px ${MINCHO}`;chars.forEach((c,k)=>ctx.fillText(c,x+tw/2,y+12+(k+.5)*(th*.64)/chars.length));
    ctx.fillStyle=t.hours?'#f4ead2':'#9a2a22';signText(ctx,t.price,x+tw/2,y+th-30,tw-10,26,GOTHIC);
   });}
  // Ryukyu Cider's enamel tin, a landscape one: cream with a red border and band, the brand across it.
  {const [x0,y0,w,h]=ATLAS.tin;ctx.fillStyle='#f1e6c8';ctx.fillRect(x0,y0,w,h);ctx.fillStyle='#2f6f9f';ctx.fillRect(x0,y0+h-58,w,58);
   ctx.strokeStyle='#b8302a';ctx.lineWidth=8;ctx.strokeRect(x0+8,y0+8,w-16,h-16);
   ctx.fillStyle='#b8302a';ctx.textAlign='center';ctx.textBaseline='middle';signText(ctx,japaneseSign('Ryukyu Cider'),x0+w/2,y0+(h-58)/2+6,w-44,64,MINCHO);
   ctx.fillStyle='#fff6e0';signText(ctx,'RYUKYU CIDER',x0+w/2,y0+h-30,w-50,22,GOTHIC);
   ctx.fillStyle='rgba(120,60,30,.5)';for(const [x,y] of [[16,16],[w-16,16],[16,h-16],[w-16,h-16]]){ctx.beginPath();ctx.arc(x0+x,y0+y,6,0,Math.PI*2);ctx.fill();}}
  // The family's nameplate (表札): cypress, the name in brush letters, the romaji small under it.
  {const [x0,y0,w,h]=ATLAS.plate;ctx.fillStyle='#d8bb8a';ctx.fillRect(x0,y0,w,h);ctx.strokeStyle='rgba(90,60,30,.3)';ctx.lineWidth=2;
   for(let y=y0+14;y<y0+h;y+=17){ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+w,y+3);ctx.stroke();}
   ctx.fillStyle='#2a1e14';ctx.textAlign='center';ctx.textBaseline='middle';signText(ctx,staffed===false?'空室':japaneseSign('Nakamura'),x0+w/2,y0+h*.42,w-30,64,MINCHO);
   signText(ctx,staffed===false?'VACANT':'NAKAMURA',x0+w/2,y0+h*.82,w-40,20,GOTHIC);}
 });
}

/** A quad of the lettering sheet: region `r` drawn w×h at `at`, facing +z turned by ry, in the shop-house's frame. */
function letteringQuad(r,w,h,at,ry){
 const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,[px,py,pw,ph]=r;
 const u0=px/ATLAS.w,u1=(px+pw)/ATLAS.w,v1=1-py/ATLAS.h,v0=1-(py+ph)/ATLAS.h;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)?u1:u0,uv.getY(i)?v1:v0);
 g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1)));
 return g;
}

/** Where the lettering sits: each a board drawn by nakamuraBuilding, with its face 6 mm in front of the board's. */
export const NAKAMURA_LETTERING=Object.freeze({
 menu:Object.freeze({w:2.44,h:.62,at:Object.freeze([-.5,2.62,back+.096]),ry:0,board:Object.freeze({w:2.5,h:.68,d:.03,at:Object.freeze([-.5,2.62,back+.075])})}),
 tin:Object.freeze({w:.8,h:.5,at:Object.freeze([W+.026,1.75,.9]),ry:Math.PI/2,board:Object.freeze({w:.02,h:.54,d:.84,at:Object.freeze([W+.01,1.75,.9])})}),
 plate:Object.freeze({w:.4,h:.2,at:Object.freeze([1.6,2.58,D-.004]),ry:0,board:Object.freeze({w:.44,h:.23,d:.02,at:Object.freeze([1.6,2.58,D-.02])})}),
});

/**
 * The building's own articulation and the static props, drawn into the quarter's kit (one batch with the rest of the
 * street, so none of it is a draw call of its own). Called from shopHouse inside its frame. Returns colliders.
 */
export function nakamuraBuilding(kit,{trim=0x3f7f86,occupied=true}={}){
 const windowFinish=occupied?'window':'matte',lightFinish=occupied?'glow':'matte';
 const solids=[],band=0xd2c9b2,hood=0xd8d2c4,sill=0xc9c2b4,alu=0xb8bec0,glass=0x5d7a84,frost=0xdfe6e4,timber=0x8a6641,dark=0x5d4431;
 // The slab band at the first floor, on the flanks and the back (the fascia's trim is the front's).
 kit.block(-W-.025,-W,3.17,3.33,-D,D,band);kit.block(W,W+.025,3.17,3.33,-D,D,band);kit.block(-W-.025,W+.025,3.17,3.33,-D-.025,-D,band);
 // The coping on the parapet (the front's teal lip is shopHouse's).
 kit.block(-W-.03,W+.03,H+.5,H+.55,-D-.03,-D+.17,band);
 kit.block(-W-.03,-W+.17,H+.5,H+.55,-D+.17,D-.18,band);kit.block(W-.17,W+.03,H+.5,H+.55,-D+.17,D-.18,band);
 // Front: hoods over the upper windows (shopHouse's frames at ±W·.48), clear of the upright's board at x 2.09.
 for(const x of [-W*.48,W*.48]){
  kit.box(1.8,.08,.32,x,5.56,D+.16,hood);
  // The flower box on the sill, its periwinkles and their flowers.
  kit.box(1.5,.2,.2,x,4.335,D+.17,trim);
  for(let i=0;i<5;i++){const px=x-.6+i*.3;kit.sphere(.12,px,4.5,D+.17,i%2?0x4b7a3f:0x3f6b3a,{sy:.75,detail:0});
   for(const [dx,dz,c] of [[-.06,.06,0xe0559a],[.07,.02,0xf4f0f2]])kit.sphere(.035,px+dx,4.59,D+.17+dz,c,{detail:0});}
 }
 // The front room's outdoor unit between the windows, on angle brackets, its fan behind a grille.
 kit.box(.6,.44,.24,0,4.85,D+.15,0xe2e0d8);
 for(const x of [-.22,.22])kit.box(.04,.04,.27,x,4.61,D+.135,alu,{finish:'metal'});
 kit.cyl(.15,.15,.02,.08,4.85,D+.285,0x5f6568,{rx:Math.PI/2,segments:14});
 for(const rz of [.5,-.5])kit.box(.26,.03,.01,.08,4.85,D+.3,0x9aa0a4,{rz});
 kit.rod([-.3,4.7,D+.15],[-.36,4.7,D+.15],.018,0xd8d4c8);kit.rod([-.36,4.7,D+.15],[-.36,4.7,D+.01],.018,0xd8d4c8);
 // The transom over the family door and the nameplate's board (its name is the lettering's).
 kit.block(1.155,2.07,2.29,2.875,D-.07,D-.03,trim);
 const P=NAKAMURA_LETTERING.plate.board;kit.box(P.w,P.h,P.d,...P.at,0x9a7a52);
 // The menu tags' board on the shop's back wall, over the syrup shelf (the tags are the lettering's).
 const M=NAKAMURA_LETTERING.menu.board;kit.box(M.w,M.h,M.d,...M.at,0x5a3f28);
 // The lanterns' hooks and caps: the paper is lit (nakamuraFrontage), the black lacquered rims and cords are not.
 for(const x of LANTERN_X){
  kit.rod([x,2.965,D+.3],[x,2.73,D+.3],.008,0x2b2622);
  kit.cyl(.095,.095,.04,x,2.71,D+.3,0x2b2622,{segments:12});kit.cyl(.095,.095,.03,x,2.275,D+.3,0x2b2622,{segments:12});
 }

 // Left flank (park side): the front room's window, the kitchen window, the bougainvillea.
 const sideWindow=(x,z,y,wz,hy,s)=>{ // s: -1 the left flank, +1 the right
  kit.box(.05,hy+.12,wz+.12,x+s*.025,y,z,alu,{finish:'metal'});
  kit.box(.04,hy-.02,wz-.02,x+s*.04,y,z,glass,{finish:windowFinish});
  kit.box(.05,hy-.02,.04,x+s*.065,y,z,alu,{finish:'metal'});
  kit.box(.16,.06,wz+.2,x+s*.08,y-hy/2-.09,z,sill);
  kit.box(.32,.08,wz+.3,x+s*.16,y+hy/2+.1,z,hood);
 };
 sideWindow(-W,1.5,4.85,1.2,1.1,-1);
 // The front room is the corner room: its other window looks up Main Street over the drinks machines.
 sideWindow(W,1.5,4.85,1.2,1.1,1);
 {const z=-.35,y=1.55,blue=0x2f6f9a;
  kit.box(.05,1.0,1.22,-W-.025,y,z,blue);kit.box(.04,.86,1.08,-W-.04,y,z,frost,{finish:lightFinish});kit.box(.05,.86,.04,-W-.065,y,z,blue);
  kit.box(.14,.05,1.3,-W-.07,y-.525,z,sill);kit.box(.36,.08,1.4,-W-.18,2.14,z,hood);
  for(let i=0;i<7;i++)kit.rod([-W-.115,1.07,z-.51+i*.17],[-W-.115,2.03,z-.51+i*.17],.012,0x8e979a);
  for(const yy of [1.12,1.98])kit.box(.03,.03,1.16,-W-.115,yy,z,0x8e979a,{finish:'metal'});
 }
 {const x0=-W-.43,x1=-W-.03,z0=-.92,z1=3.32;
  kit.block(x0,x1,0,.45,z0,z1,0xcfc8b8);kit.block(x0+.05,x1-.05,.45,.47,z0+.05,z1-.05,0x6b4a32);
  const leaf=[0x3f6b3a,0x4b7a3f,0x55864a],flower=[0xc4307c,0xe0559a,0xb02a6e];
  for(let i=0;i<8;i++){const z=z0+.3+i*(z1-z0-.6)/7,x=(x0+x1)/2;
   kit.sphere(.25,x,.64,z,leaf[i%3],{sx:.85,sy:.75,sz:1.15,detail:1});
   for(let k=0;k<5;k++)kit.sphere(.065,x+(k%2?.13:-.12),.68+(k>1?.13:0),z+(k-2)*.11,flower[(i+k)%3],{detail:0});}
  // Trained up the wall on wires and left to spread, as bougainvillea is grown on a hot wall: a fan of leaves close to the
  // plaster, thick at the trough and thinning upwards, the bracts all over its outside. Clear of the kitchen window
  // (z < .3) and well under the slab band.
  const r=rng(31);
  for(const [y,z0r,z1r,n] of [[.82,.95,3.15,5],[1.22,1.05,3.05,4],[1.6,1.3,2.85,3],[1.95,1.6,2.55,2]])
   for(let i=0;i<n;i++){const z=z0r+(n>1?i*(z1r-z0r)/(n-1):0)+(r.next()-.5)*.14,yy=y+(r.next()-.5)*.12,sz=.3+r.next()*.12,sy=.26+r.next()*.08;
    kit.sphere(1,-W-.12,yy,z,leaf[i%3],{sx:.2,sy,sz,detail:1});
    for(let k=0;k<3;k++)kit.sphere(.065,-W-.27,yy+(k-1)*sy*.5,z+(k%2?.6:-.5)*sz*.6,flower[(k+i)%3],{detail:0});}
  // To the shop-house's own collider (houses.js: the wall plus 5 cm), which already holds the 3 cm behind the trough: the
  // trough's solid meets the building's, it does not run into it.
  solids.push(kit.rect(x0-.02,-W-.05,z0-.02,z1+.02,.95,'nakamura-planter'));
 }

 // Right flank (the drinks machines' side): the stair window, the meters, the cider tin, the crates, the hibiscus.
 {kit.box(.05,.68,.58,W+.025,2.75,.2,alu,{finish:'metal'});kit.box(.04,.56,.46,W+.04,2.75,.2,0xc9d6d8,{finish:lightFinish});
  kit.box(.24,.06,.7,W+.12,3.12,.2,hood);}
 {const z=2.62;kit.box(.16,.48,.36,W+.08,1.8,z,0x9a958a);
  for(const y of [1.92,1.68])kit.cyl(.07,.07,.02,W+.17,y,z,0x3a4448,{rz:Math.PI/2,segments:12});
  kit.rod([W+.045,2.04,z],[W+.045,6.0,z],.025,0x8e979a);kit.rod([W+.045,6.0,z],[W+.15,6.07,z],.025,0x8e979a);}
 {const T=NAKAMURA_LETTERING.tin.board;kit.box(T.w,T.h,T.d,...T.at,0xf1e6c8);}
 {const crate=(x,y,z,c)=>{kit.box(.3,.3,.45,x,y+.15,z,c);kit.box(.01,.06,.16,x+.155,y+.2,z,0x1f3f66);};
  const stacks=[[W+.2,-3.2,3],[W+.22,-2.7,2]];
  for(const [x,z,n] of stacks){for(let i=0;i<n;i++)crate(x,i*.3,z,i%2?0x3a78c0:0x2f6fb8);
   for(let a=0;a<2;a++)for(let b=0;b<4;b++)kit.cyl(.025,.025,.04,x-.07+a*.14,n*.3+.02,z-.165+b*.11,0xc8b46a,{segments:6});}
  solids.push(kit.rect(W,W+.4,-3.45,-2.45,1.0,'nakamura-crates'));}
 {const x=W+.32,z=3.35;kit.cyl(.2,.15,.36,x,.18,z,0xb8643c,{segments:10});kit.cyl(.18,.18,.02,x,.36,z,0x5a3e2a,{segments:10});
  kit.sphere(.27,x,.64,z,0x4b7a3f,{sy:.9,detail:1});kit.sphere(.18,x+.12,.82,z-.08,0x55864a,{detail:1});
  for(const [dx,dy,dz] of [[.2,.7,.1],[-.15,.78,.15],[.05,.9,-.18],[-.2,.6,-.1],[.15,.92,.05],[-.05,.66,.24],[.24,.82,-.12]])kit.sphere(.06,x+dx,dy,z+dz,0xd9303b,{detail:0});
  solids.push(kit.rect(x-.24,x+.24,z-.24,z+.24,.95,'nakamura-hibiscus'));}

 // Back: the kitchen door with its hood and step, Mai's window, her cooler's outdoor unit, the gas.
 {const x=-.9;
  kit.box(1.0,2.1,.06,x,1.05,-D-.03,alu,{finish:'metal'});kit.box(.86,2.0,.04,x,1.02,-D-.07,0x7b8f8a);
  kit.box(.2,.9,.02,x-.2,1.45,-D-.1,0xc9d6d8,{finish:lightFinish});kit.box(.03,.18,.05,x+.33,1.0,-D-.115,0xd8dcdc,{finish:'metal'});
  kit.box(1.2,.08,.55,x,2.26,-D-.275,hood);kit.box(1.0,.15,.4,x,.075,-D-.2,0xc4c0b4);
  solids.push(kit.rect(x-.52,x+.52,-D-.42,-D,.5,'nakamura-back-step'));
  kit.box(1.32,1.22,.05,x,4.85,-D-.025,alu,{finish:'metal'});kit.box(1.18,1.08,.04,x,4.85,-D-.04,glass,{finish:windowFinish});
  kit.box(.04,1.08,.05,x,4.85,-D-.065,alu,{finish:'metal'});kit.box(1.4,.06,.16,x,4.21,-D-.08,sill);kit.box(1.5,.08,.32,x,5.49,-D-.16,hood);}
 {const x=1.35,y=4.4;kit.box(.7,.44,.26,x,y,-D-.16,0xe2e0d8);
  for(const dx of [-.28,.28]){kit.box(.04,.04,.3,x+dx,y-.24,-D-.15,alu,{finish:'metal'});kit.rod([x+dx,y-.24,-D-.28],[x+dx,y-.5,-D-.01],.015,alu);}
  kit.cyl(.15,.15,.02,x-.08,y,-D-.3,0x5f6568,{rx:Math.PI/2,segments:14});for(const rz of [.5,-.5])kit.box(.26,.03,.01,x-.08,y,-D-.315,0x9aa0a4,{rz});
  kit.rod([x+.35,y-.05,-D-.12],[x+.5,y-.05,-D-.12],.018,0xd8d4c8);kit.rod([x+.5,y-.05,-D-.12],[x+.5,y-.05,-D-.005],.018,0xd8d4c8);}
 {const cx=-2.0,cz=-D-.26,top=1.34;
  for(const dx of [-.21,.21]){kit.cyl(.17,.17,1.0,cx+dx,.5,cz,0x9aa2a6,{segments:10,finish:'metal'});kit.sphere(.17,cx+dx,1.0,cz,0x9aa2a6,{sy:.45,detail:1,finish:'metal'});
   kit.cyl(.04,.04,.1,cx+dx,1.12,cz,0x3c4448,{segments:6});kit.rod([cx+dx,1.17,cz],[cx,1.22,-D-.06],.012,0xb07a45);}
  kit.box(.75,.025,.02,cx,.85,cz-.18,0x4a4a4a);
  kit.rod([cx,1.22,-D-.06],[-1.48,1.22,-D-.06],.014,0xb07a45);kit.rod([-1.48,1.22,-D-.06],[-1.48,1.22,-D-.005],.014,0xb07a45);
  // The hutch: slats on three sides on corner posts, a lid sloped to shed the rain.
  const x0=cx-.45,x1=cx+.45,z0=-D-.52,z1=-D-.02;
  for(const [px,pz] of [[x0+.03,z0+.03],[x1-.03,z0+.03],[x0+.03,z1-.03],[x1-.03,z1-.03]])kit.box(.05,1.28,.05,px,.64,pz,dark);
  for(let i=0;i<7;i++)kit.box(.07,1.18,.02,x0+.1+i*.117,.62,z0+.015,timber);
  for(const px of [x0+.015,x1-.015])for(let i=0;i<3;i++)kit.box(.02,1.18,.07,px,.62,z0+.12+i*.13,timber);
  kit.box(.98,.04,.6,cx,top,(z0+z1)/2,dark,{rx:-.1});
  solids.push(kit.rect(x0-.02,x1+.02,z0-.02,-D,1.4,'nakamura-gas'));}

 // The table at the shop end of the dessert bench (world 7.3, −17.6; quarters.js buildEastRow), with the parasol's socket.
 {const [x,,z]=NAKAMURA_TABLE;
  kit.box(.52,.04,.52,x,.6,z,timber);for(const [dx,dz] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])kit.box(.05,.58,.05,x+dx,.29,z+dz,dark);
  kit.box(.4,.03,.4,x,.2,z,dark);
  solids.push(kit.rect(x-.28,x+.28,z-.28,z+.28,.65,'nakamura-bench-table'));}
 return solids;
}

/** The lanterns hang either side of the counter: over the left pier and over the partition by the family door. */
const LANTERN_X=Object.freeze([-2.26,1.0]);
/** The bench table and the parasol in it, in the shop-house's frame: world (7.3, −16.25), at the bench's shop end. */
export const NAKAMURA_TABLE=Object.freeze([-4.55,0,2.25]);
/** The parasol's canopy: the camera stays out of it, people walk under it. */
export const NAKAMURA_PARASOL=Object.freeze({radius:1.0,rim:2.02,top:2.38});

/** The shutter's steel: ribbed slats a few centimetres deep, in the trim's paint, the bottom rail and its lock darker. */
function shutterSteel(trim){
 const c=new THREE.Color(trim),hex=k=>'#'+c.clone().multiplyScalar(k).getHexString();
 return paint(128,512,(ctx,w,h)=>{
  ctx.fillStyle=hex(1);ctx.fillRect(0,0,w,h);
  const rail=14,slats=46,pitch=(h-rail)/slats;
  for(let i=0;i<slats;i++){const y=i*pitch;
   ctx.fillStyle=hex(1.18);ctx.fillRect(0,y+1,w,2);ctx.fillStyle=hex(.72);ctx.fillRect(0,y+pitch-2,w,2);}
  // Salt and hands: the paint is worn paler where the shutter is pulled, low in the middle.
  const g=ctx.createLinearGradient(0,h*.7,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(235,230,215,.18)');ctx.fillStyle=g;ctx.fillRect(0,h*.7,w,h*.3);
  ctx.fillStyle=hex(.55);ctx.fillRect(0,h-rail,w,rail);
  ctx.fillStyle='#c9cdcc';ctx.fillRect(w/2-5,h-rail+3,10,7);
 });
}

/** The noren: indigo cotton in four panels, ぜんざい one letter to a panel, the family's 中村 small on the last. */
function norenCloth(){
 return paint(1024,160,(ctx,w,h)=>{
  ctx.fillStyle='#22345a';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#1a2847';ctx.fillRect(0,0,w,16);
  const panels=4,chars=[...japaneseSign('Zenzai')];
  ctx.fillStyle='#e8e4d8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 96px ${MINCHO}`;
  for(let i=0;i<panels;i++){const x=(i+.5)*w/panels;if(chars[i])ctx.fillText(chars[i],x,h*.56);}
  ctx.font=`bold 24px ${MINCHO}`;ctx.fillText(japaneseSign('Nakamura'),w-44,h-24);
  // The slits between the panels: where the cloth parts, the dark of the shop shows.
  ctx.fillStyle='#0e1424';for(let i=1;i<panels;i++)ctx.fillRect(i*w/panels-3,22,6,h-22);
 });
}

/**
 * What follows the hours, in its own small group in the shop-house's frame: the noren, the lit lantern paper, the
 * parasol, the ice flag and the shutter, and the lettering sheet (which does not move, but is one picture of its own).
 */
export function nakamuraFrontage({menu,hours,shadows=false,origin=[9.55,-11.7],trim=0x3f7f86}){
 const group=new THREE.Group();group.name='Nakamura frontage';group.position.set(origin[0],0,origin[1]);group.rotation.y=-Math.PI/2;
 // The lettering: menu tags, cider tin, nameplate.
 const L=NAKAMURA_LETTERING,sheet=paintLettering(menu,hours);
 const lettering=new THREE.Mesh(mergeGeometries([letteringQuad(ATLAS.menu,L.menu.w,L.menu.h,L.menu.at,L.menu.ry),letteringQuad(ATLAS.tin,L.tin.w,L.tin.h,L.tin.at,L.tin.ry),letteringQuad(ATLAS.plate,L.plate.w,L.plate.h,L.plate.at,L.plate.ry)]),
  new THREE.MeshStandardMaterial({map:sheet,roughness:.8}));
 lettering.name='Nakamura lettering (menu tags, cider tin, nameplate)';lettering.receiveShadow=true;group.add(lettering);
 // The noren: dyed cloth, the same picture from both sides as cloth is (tests/sign-backs.test.mjs).
 const noren=new THREE.Mesh(new THREE.PlaneGeometry(2.9,.45),new THREE.MeshStandardMaterial({map:norenCloth(),roughness:.95,side:THREE.DoubleSide}));
 noren.name='Nakamura noren';noren.position.set(-.52,2.65,D-.2);group.add(noren);
 // The lanterns' paper: its own material, lit on the clock (no light of their own).
 // The kits draw in the world's frame (their batches are by 32 m cell of the world), so they finish into `world`.
 const world=new THREE.Group();world.name='Nakamura frontage (lamps and parasol)';
 const lamps=createKit({shadows:false});
 lamps.at(origin[0],origin[1],-Math.PI/2,()=>{for(const x of LANTERN_X){lamps.sphere(.165,x,2.49,D+.3,0xc8352e,{sy:1.32,detail:2,finish:'lantern'});for(const y of [2.38,2.6])lamps.cyl(.162,.162,.012,x,y,D+.3,0xa82a24,{segments:14,finish:'lantern'});}});
 const lit=lamps.finish(world,'Nakamura lanterns').materials.lantern;lit.emissive.setHex(0xff6a3a);lit.emissiveIntensity=0;
 // The parasol in the bench table: a bamboo pole, the red canopy, the white ring under it.
 const shade=createKit({shadows}),[tx,,tz]=NAKAMURA_TABLE,R=NAKAMURA_PARASOL;
 shade.at(origin[0],origin[1],-Math.PI/2,()=>{
  shade.rod([tx,.25,tz],[tx,R.top+.06,tz],.022,0x7a5a3a,{segments:6});
  shade.cyl(.05,R.radius,R.top-R.rim,tx,(R.top+R.rim)/2,tz,0xc0302a,{segments:16});
  shade.cyl(.3,.3,.015,tx,R.rim+.08,tz,0xefe8d8,{segments:14});
  shade.cyl(.04,.04,.06,tx,R.top+.02,tz,0x2b2622,{segments:6});
 });
 const parasol=new THREE.Group();parasol.name='Nakamura parasol';world.add(parasol);shade.finish(parasol,'Nakamura parasol');
 // The ice flag on its pole at the kerb, by the family door: put out and taken in with the noren.
 const pole=createKit({shadows});
 pole.at(origin[0],origin[1],-Math.PI/2,()=>{
  pole.cyl(.03,.03,2.6,2.1,1.3,D+.35,0x9aa0a4,{segments:6});
  pole.sign(iceFlag(),.42,1.3,1.88,1.85,D+.35,{ry:Math.PI/2,depth:.015,name:'ice flag',both:true});
  pole.rod([2.1,2.52,D+.35],[1.65,2.52,D+.35],.015,0x9aa0a4);
 });
 const flag=new THREE.Group();flag.name='Nakamura ice flag';world.add(flag);pole.finish(flag,'Nakamura ice flag');
 // The roller shutter: ribbed steel in the trim's colour, running in the box over the opening (shopHouse's, z D-.35 to
 // D-.05), 15 cm behind the piers' faces. Down, its foot is in the floor, its ends in the pier and the partition and its
 // head in the wall over the box, so it also closes the slot between the box and the wall where the counter's lit ceiling
 // showed; rolling up, it slides into the box and the wall (by the box's underside when it is all the way up), and it is hidden.
 const opening={x0:-NAKAMURA_FRAME.open,x1:1.03,foot:.06,head:ground+.02,z:D-.15},tall=opening.head-opening.foot,travel=ground-.42-opening.foot;
 const shutter=new THREE.Mesh(new THREE.BoxGeometry(opening.x1-opening.x0+.06,tall,.02),new THREE.MeshStandardMaterial({map:shutterSteel(trim),metalness:.3,roughness:.6}));
 shutter.name='Nakamura shutter';shutter.receiveShadow=true;shutter.position.set((opening.x0+opening.x1)/2,opening.foot+tall/2,opening.z);group.add(shutter);
 group.updateMatrixWorld(true);
 const centre=new THREE.Vector3(tx,0,tz).applyMatrix4(group.matrixWorld);
 // Camera only: its rim is above anyone's head (physics.js standingHitsRect reads 1.82 m), so people pass under it.
 const canopy={id:'nakamura-parasol-canopy',x:centre.x,z:centre.z,w:R.radius*1.5,d:R.radius*1.5,minY:R.rim,height:R.top-R.rim};
 // Nobody walks through it once it is down past their shoulders (the frame is a quarter turn: the opening runs along z).
 const door=new THREE.Vector3((opening.x0+opening.x1)/2,0,opening.z).applyMatrix4(group.matrixWorld);
 const shutterSolid={id:'nakamura-shutter',x:door.x,z:door.z,w:.1,d:opening.x1-opening.x0,height:ground-.42,minY:1e3};
 let shown=null,lowered=null;
 const update=(minutes,open)=>{
  if(hours.staffed===false)open=false;
  const glow=open?windowGlow(minutes):0;lit.emissiveIntensity=glow*.85;
  const down=nakamuraShutterDown(minutes,hours);
  if(down!==lowered){lowered=down;shutter.visible=down>0;shutter.position.y=opening.foot+tall/2+(1-down)*travel;shutterSolid.minY=down>.4?0:1e3;}
  if(shown===open)return;shown=open;noren.visible=open;parasol.visible=open;flag.visible=open;canopy.minY=open?R.rim:1e3;
 };
 return {group,world,noren,parasol,flag,shutter,lanterns:lit,canopy,shutterSolid,update};
}
