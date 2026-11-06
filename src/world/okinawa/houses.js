import {stairFlight,stairLanding} from './stairs.js';
import {rng} from './kit.js';
import {fishAt} from './fish.js';
import {wallAd,WALL_ADS} from './signs.js';
import {broadleaf} from './trees.js';
import {TREE_REBUILD} from '../tree-designs.js';
import {nakamuraBuilding} from './nakamura-dressing.js';
import {higaInterior,higaBuilding,HIGA_FRAME} from './higa-liquor-dressing.js';
import {laundryInterior,laundryBuilding,LAUNDRY_FRAME} from './coin-laundry-dressing.js';

/**
 * The buildings and gardens of an Okinawan harbour town, made with the kit.
 *
 * Every maker works in the kit's current local frame: the building stands centred on
 * the origin with its front looking along +z, and the caller turns it to face the street
 * with kit.at(). Each returns the collider rectangles it wants, already in world space.
 *
 * What makes them read as Okinawa rather than Japan in general, from the reference
 * photographs of Taketomi, Tonaki and the older streets of Naha:
 *   - red tile roofs, low and hipped, with the joints and ridges pointed in white lime;
 *   - a shisa on the ridge, looking down the path to the gate;
 *   - pale coral stone walls round the plot and a hinpun screen inside the gate, so the
 *     house is never seen straight on from the street;
 *   - fukugi trees along the boundary as a windbreak, hibiscus by the gate;
 *   - and, beside them, the flat-roofed concrete house of the seventies with a black
 *     water tank on the roof and an outside stair up to it.
 */
export const OKINAWA_COLOURS=Object.freeze({
 roof:0xc4553a,roofDeep:0xa8452f,lime:0xf3eee2,plaster:0xece3cf,timber:0x5d4431,timberLight:0x8a6641,
 stone:0xd8cfb3,concrete:0xdcd7cb,tank:0x2b2d2f,steel:0x8e979a,glass:0x5d7a84,leaf:0x2f5d35,leafLight:0x3f7440,
 hibiscus:0xd9303b,bougainvillea:0xc4307c,terracotta:0xb8643c,
});
const C=OKINAWA_COLOURS;

/** A shisa: the lion-dog that guards the house, sitting on the ridge or a gatepost. */
export function shisa(kit,x,y,z,ry=0,scale=1){
 kit.at(x,z,ry,()=>{
  const s=scale,col=C.terracotta,deep=0x9a4f2e;
  kit.box(.34*s,.06*s,.4*s,0,y+.03*s,0,0xcfc5ae);                      // its little plinth
  kit.box(.26*s,.3*s,.28*s,0,y+.2*s,-.02*s,col,{rx:-.25});             // haunches and chest
  for(const side of [-1,1])kit.box(.06*s,.2*s,.07*s,side*.08*s,y+.14*s,.13*s,col); // forelegs
  kit.sphere(.15*s,0,y+.42*s,.08*s,col,{sy:.92,detail:2});            // head
  kit.sphere(.17*s,0,y+.43*s,.02*s,deep,{sz:.7,detail:2});             // the curled mane behind it
  for(const side of [-1,1])kit.sphere(.05*s,side*.1*s,y+.53*s,.06*s,deep,{detail:1}); // ears
  kit.box(.12*s,.06*s,.06*s,0,y+.42*s,.22*s,deep);                     // the broad nose
  kit.box(.16*s,.05*s,.06*s,0,y+.36*s,.21*s,0x6d3620);                 // the open mouth
  for(const side of [-1,1])kit.sphere(.035*s,side*.06*s,y+.47*s,.2*s,0x2b1e16); // eyes
  kit.sphere(.07*s,0,y+.3*s,-.17*s,deep,{sx:.8,sy:1.6});               // tail, flame-shaped
 });
}

/**
 * A red-tile house: raised floor, timber front of sliding doors behind a deep verandah
 * (the amahaji), plaster sides, and a hipped roof in pointed tile.
 */
export function redTileHouse(kit,{w=8.4,d=6.8,seed=1,wall=C.plaster}={}){
 const r=rng(seed),W=w/2,D=d/2,floor=.45,eaves=2.85,front=D-1.1,deckBottom=floor-.04;
 kit.block(-W,W,0,floor,-D,front,C.stone,'coral');                  // house footing
 // The veranda's support stops at the timber underside. The old full-height
 // footing penetrated the deck, drawing stone and timber on the same 4 cm-high
 // front and side faces; those faces flashed as the camera moved past Higa.
 kit.block(-W,W,0,deckBottom,front,D,C.stone,'coral');
 kit.block(-W+.05,W-.05,floor,eaves,-D+.05,front,wall,'plaster');               // the house body
 // The verandah deck in front of the doors, and the posts that carry the eave.
 kit.block(-W,W,deckBottom,floor+.02,front,D,C.timberLight);
 for(let i=0;i<=4;i++){const x=-W+.12+i*(w-.24)/4;kit.box(.14,eaves-floor,.14,x,(floor+eaves)/2,D-.12,C.timber);}
 kit.box(w,.18,.16,0,eaves-.09,D-.12,C.timber);                        // the beam over them
 // The front: sliding doors, a timber rail at knee height and paper-and-glass above it.
 kit.block(-W+.05,W-.05,floor,floor+.55,front,front+.04,C.timberLight);
 // Glass sliding doors (garasu-do) above the rail, with the room behind them.
 kit.block(-W+.05,W-.05,floor+.55,eaves-.25,front+.005,front+.03,C.glass,'window');
 for(let i=0;i<=6;i++){const x=-W+.1+i*(w-.2)/6;kit.box(.07,eaves-floor-.25,.05,x,(floor+eaves-.25)/2,front+.04,C.timber);}
 kit.box(w-.1,.06,.05,0,floor+1.5,front+.04,C.timber);
 kit.box(w-.1,.22,.06,0,eaves-.14,front+.04,C.timber);
 // A small window high on each side, and the back.
 for(const side of [-1,1])kit.box(.05,.7,1.1,side*(W-.03),1.95,-D*.3,C.glass,{finish:'window'});
 kit.box(1.4,.7,.05,W*.3,1.95,-D+.03,C.glass,{finish:'window'});
 // The roof, and the white lime along its ridge and down its four hips.
 const roofH=1.55,over=.55,Wr=W+over,Dr=D+over,ridge=Math.max(Wr,Dr)*.35,long=Wr>=Dr;
 kit.hipRoof(w,d,roofH,0,eaves,0,C.roof,{overhang:over,ridgeFrac:.35,finish:'tile'});
 const top=long?[[-ridge,eaves+roofH+.03,0],[ridge,eaves+roofH+.03,0]]:[[0,eaves+roofH+.03,-ridge],[0,eaves+roofH+.03,ridge]];
 kit.rod(top[0],top[1],.085,C.lime,{segments:6});
 for(const [cx,cz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
  const end=long?top[cx<0?0:1]:top[cz<0?0:1];
  kit.rod([cx*Wr,eaves+.04,cz*Dr],end,.06,C.lime,{segments:5});
 }
 kit.box(w+over*2+.04,.07,.07,0,eaves+.02,D+over,C.lime);             // the eave line in front
 shisa(kit,0,eaves+roofH+.06,long?0:ridge*.6,0,1.1);
 // The water jar at the corner, and something drying on the verandah.
 kit.cyl(.26,.2,.55,W+.35,.28,-D+.6,0x6a4a36,{finish:'gloss',segments:10});
 kit.sphere(.27,W+.35,.5,-D+.6,0x6a4a36,{sy:.5,finish:'gloss'});
 if(r.next()>.4)kit.box(.5,.12,.35,-W*.5,floor+.06,D-.5,0x3a6e8f);
 return [kit.rect(-W-.1,W+.1,-D-.1,D-.05,eaves+roofH,'okinawa-house')];
}

/**
 * The concrete house of the seventies: two storeys, flat roof, an outside stair up the
 * side to the roof, a black water tank on it and flower-block screens on the balcony.
 */
export function concreteHouse(kit,{w=7.6,d=7,colour=C.concrete,seed=2}={}){
 const r=rng(seed),W=w/2,D=d/2,storey=2.8,H=storey*2;
 kit.block(-W,W,0,H,-D,D,colour,'plaster');
 kit.block(-W-.02,W+.02,0,.35,-D-.02,D+.02,0xb9b3a6);                // a darker plinth
 kit.block(-W-.12,W+.12,H-.01,H+.1,-D-.12,D+.12,0xc8c2b5);               // roof slab lip
 for(const [x0,x1,z0,z1] of [[-W,W,-D,-D+.14],[-W,W,D-.14,D],[-W,-W+.14,-D,D],[W-.14,W,-D,D-1.0]])kit.block(x0,x1,H+.1,H+.55,z0,z1,colour,'plaster');
 // Ground floor: aluminium sliding windows either side of a door under a thin concrete
 // canopy. The openings are laid out from the house's own width, left to right with a
 // pier of wall between each, so a narrow plot's house cannot put a window over its door.
 const window=(x0,x1,y,ht)=>{
  const wd=x1-x0,x=(x0+x1)/2;if(wd<.5)return;
  kit.box(wd+.12,ht+.12,.06,x,y,D+.03,0xb8bec0,{finish:'metal'});
  kit.box(wd,ht,.05,x,y,D+.05,C.glass,{finish:'window'});
  if(wd>.8)kit.box(.04,ht,.06,x,y,D+.08,0xb8bec0,{finish:'metal'});
 };
 // A run between two x's, at most `most` wide, kept centred in its bay.
 const bay=(x0,x1,most)=>{const extra=Math.max(0,x1-x0-most)/2;return [x0+extra,x1-extra];};
 const [doorW,doorH]=[.91,2.0],doorX=W*.2,pier=.35,edge=.45;
 window(...bay(-W+edge,doorX-doorW/2-pier,2.4),1.45,1.2);
 window(...bay(doorX+doorW/2+pier,W-edge,1.1),1.45,1.2);
 // The door: an aluminium frame, a panel with a strip of frosted glass, a handle.
 kit.box(doorW+.12,doorH+.06,.06,doorX,doorH/2+.03,D+.03,0xb8bec0,{finish:'metal'});
 kit.box(doorW,doorH,.05,doorX,doorH/2,D+.05,0x7b8a8e);
 kit.box(.22,1.1,.02,doorX-.2,1.25,D+.085,0xc9d6d8);
 kit.box(.04,.22,.05,doorX+.33,1.0,D+.1,0xd8dcdc,{finish:'metal'});
 kit.box(doorW+.55,.1,.9,doorX,doorH+.25,D+.45,0xc8c2b5);
 // Upper floor: a balcony with a flower-block screen, the Okinawan answer to sun and typhoons.
 kit.block(-W,doorX,storey,storey+.12,D,D+1.1,0xc8c2b5);
 kit.block(-W,doorX,storey+.12,storey+1.05,D+.95,D+1.1,colour,'hana');
 kit.block(-W,-W+.12,storey+.12,storey+1.05,D,D+1.1,colour,'hana');
 // A glass door out to the balcony, and a window beside it over the front door.
 window(...bay(-W+edge,doorX-pier,2.4),storey+1.1,2.0);
 window(...bay(doorX+pier,W-edge,1.1),storey+1.4,1.1);
 // Two ordinary flights share a turn landing, fitting inside the side-yard strip.
 const rails=[],solid=c=>rails.push(c),length=4.16,bottom=D-1.0,turn=bottom-length,mid=(H+.1)/2;
 stairFlight(kit,solid,{id:'house-stair-lower',x:W+2.15,z:bottom,width:1.3,length,height:mid,direction:-1});
 stairLanding(kit,{id:'house-turn',x0:W+.2,x1:W+2.8,z0:turn-1.0,z1:turn,y:mid},solid);
 stairFlight(kit,solid,{id:'house-stair-upper',x:W+.85,z:turn,width:1.3,length,height:mid,base:mid});
 stairLanding(kit,{id:'house-roof-landing',x0:W-.3,x1:W+1.5,z0:bottom,z1:bottom+.99,y:H+.12},solid);
 kit.level(-W+.15,W-.15,-D+.15,D-.15,H+.1,'house-roof');
 // Guard the outer edge of both landings, leaving the flight ends open.
 for(const [x0,x1,z0,z1,y] of [[W+.2,W+2.8,turn-1.0,turn-.95,mid],[W+2.75,W+2.8,turn-1.0,turn,mid],[W+1.44,W+1.49,bottom,bottom+1.0,H+.1]]){
  kit.block(x0,x1,y,y+1,z0,z1,0x788386);solid({...kit.rect(x0,x1,z0,z1,1,'house-landing-rail'),minY:kit.point(0,y,0).y});
 }
 // On the roof: the tank on its frame, a TV aerial, washing.
 kit.at(-W*.35,-D*.3,0,()=>{
  for(const [x,z] of [[-.45,-.45],[.45,-.45],[.45,.45],[-.45,.45]])kit.box(.07,.9,.07,x,H+.55,z,C.steel,{finish:'metal'});
  kit.box(1.1,.08,1.1,0,H+1.02,0,C.steel,{finish:'metal'});
  kit.cyl(.62,.62,1.3,0,H+1.71,0,C.tank,{segments:14,finish:'gloss'});
  kit.cyl(.2,.2,.1,0,H+2.41,0,C.tank,{segments:10});
 });
 kit.rod([W*.5,H+.1,-D*.4],[W*.5,H+2.6,-D*.4],.025,C.steel);
 for(const y of [H+2.1,H+2.4])kit.rod([W*.5-.6,y,-D*.4],[W*.5+.6,y,-D*.4],.015,C.steel);
 // An air conditioner hung on the wall, and its drip stain.
 kit.box(.8,.55,.3,-W-.18,1.8,-D*.2,0xe2e0d8,{ry:Math.PI/2});
 kit.box(.04,1.2,.2,-W-.01,1.0,-D*.2,0xa9a397);
 if(r.next()>.5)kit.box(.03,1.6,.18,W-.6,H-1,D+.01,0xaaa496);
 return [kit.rect(-W-.02,W+.02,-D-.02,D+.02,H+.1,'okinawa-house'),...rails,
 ...[[-W,W,-D,-D+.14],[-W,W,D-.14,D],[-W,-W+.14,-D,D],[W-.14,W,-D,bottom],[W-.14,W,bottom+1.0,D]].filter(([a,b,c,d])=>d>c).map(([a,b,c,d])=>({...kit.rect(a,b,c,d,.5,'house-parapet'),minY:kit.point(0,H+.1,0).y})),
 {...kit.rect(-W*.35-.65,-W*.35+.65,-D*.3-.65,-D*.3+.65,2.5,'house-tank'),minY:kit.point(0,H+.1,0).y}];
}

/**
 * A two-storey shop-house facing the street: an open shopfront under a painted fascia
 * and an awning, a tall board on the corner, windows above and a tank on the roof.
 * `stock` fills the shop with shelves of colour; `sign` and `upright` are textures.
 */
export function shopHouse(kit,{w=6.4,d=7.4,colour=0xe9dfc4,trim=0x3f7f86,sign,upright,awning=true,seed=3,interior='shelves',occupied=true,stock=[0xd9b04a,0x5f8fb8,0xc0543e,0x6ea05a,0xe8e2d0]}={}){
 // Kissa Higa (the old Higa Liquor) and the coin laundry are rooms you walk into (higa-liquor-dressing.js, coin-laundry-dressing.js): their
 // shop floor runs back to the storeroom; every other shop-house keeps the 2.2 m slot.
 const r=rng(seed),W=w/2,D=d/2,ground=3.3,H=6.1,open=W-.38,back=interior==='kissaten'?HIGA_FRAME.back:interior==='laundry'?LAUNDRY_FRAME.back:D-2.2;
 // The body, stopping short of the front so the shop floor is a real room.
 if(interior==='zenzai'){
  // An independent stairwell inside the retained footprint, beside the counter.
  kit.block(-W,1.03,0,H,-D,back,colour,'plaster');
  kit.block(1.03,W,0,H,-D,-2.85,colour,'plaster');
  kit.block(W-.2,W,0,H,-2.85,back,colour,'plaster');
  kit.block(1.03,1.12,0,ground-.01,-2.85,D,colour,'plaster');
 }else kit.block(-W,W,0,H,-D,back,colour,'plaster');
 kit.block(-W,-open,0,ground,back,D,colour,'plaster');kit.block(open,W,0,ground,back,D,colour,'plaster');
 kit.block(-W,W,ground,H,back,D,colour,'plaster');
 const fitted=interior==='kissaten'||interior==='zenzai'||interior==='laundry',floor=.08;
 if(fitted){
  // The foundation belongs under the walls, not across the open shop floor. The
  // old 30 cm plinth buried the 8 cm tiles and was too tall for the walking surface.
  kit.block(-W-.02,W+.02,0,.3,-D-.02,back,0xb3ad9f);
  // Its inner ends stop inside the piers: flush with the piers' faces they flashed in the shop's opening.
  kit.block(-W-.02,-open-.02,0,.3,back,D+.02,0xb3ad9f);
  kit.block(open+.02,W+.02,0,.3,back,D+.02,0xb3ad9f);
 }else kit.block(-W-.02,W+.02,0,.3,-D-.02,D+.02,0xb3ad9f);
 // A vacant facility keeps its fitted surfaces but has no artificial room light at dusk.
 const roomFinish=occupied?'glow':'matte',windowFinish=occupied?'window':'matte';
 kit.block(-open,open,fitted?0:.02,floor,back,fitted?D+.02:D-.05,0x9d9486);
 kit.block(-open,interior==='zenzai'?1.03:open,floor,ground-.3,back,back+.06,0xefe6d2,roomFinish);
 kit.block(-open,open,ground-.3,ground,back,D-.3,0xd8d2c4,roomFinish);
 let furniture;
 // Draw and collide fittings in the same local frame, standing on the finished
 // floor. Other shop-house interiors retain their existing layout.
 if(fitted)kit.at(0,0,0,()=>{furniture=shopInterior(kit,interior,{open,back,D,r,stock});},floor);
 else furniture=shopInterior(kit,interior,{open,back,D,r,stock});
 if(interior==='zenzai'){
  const rails=[];
  stairFlight(kit,c=>rails.push(c),{id:'nakamura-home-stair',x:1.65,z:3.25,width:1.1,length:5.2,height:3.22,base:floor,axis:'z',direction:-1});
  stairLanding(kit,{id:'nakamura-home-landing',x0:1.1,x1:2.2,z0:-2.8,z1:-1.95,y:ground},c=>rails.push(c));
  // Open ground-floor residential door, framed and separate from the food counter.
  for(const x of [1.12,2.18])kit.box(.07,2.15,.12,x,1.155,D+.02,trim);
  kit.box(1.13,.08,.12,1.65,2.25,D+.02,trim);
  kit.box(.06,2.04,.93,2.14,1.1,D-.455,0x416d72);
  kit.box(1.05,2,.08,1.65,ground+1,-2.8,0x416d72);
  furniture.push(kit.rect(1.13,W+.05,-D-.05,-2.85,H+.6,'nakamura-stair-rear'),kit.rect(W-.2,W+.05,-2.85,back,H+.6,'nakamura-stair-side'),kit.rect(1.03,1.12,-2.85,D,ground,'nakamura-stair-partition'),...rails);

  // Nakamura's slab band, coping, hoods, side and back windows, services and plants (nakamura-dressing.js).
  furniture.push(...nakamuraBuilding(kit,{trim,occupied}));
 }
 // Their bands, hoods, flank windows, sashes and (Higa's) awning, crates, bench and stools.
 if(interior==='kissaten')furniture.push(...higaBuilding(kit,{trim}));
 if(interior==='laundry')furniture.push(...laundryBuilding(kit,{trim}));
 // The rolled-up shutter's box over the opening, and the fascia board above it.
 kit.block(-open,open,ground-.42,ground-.08,D-.35,D-.05,0x8e9699,'metal');
 kit.block(-W,W,ground,ground+.1,D,D+.08,trim);
 if(sign)kit.sign(sign,w-.2,.72,0,ground+.5,D+.1,{name:'shop fascia'});
 if(awning){
  kit.box(w-.3,.07,1.35,0,ground-.35,D+.62,trim,{rx:.16});
  for(let i=0;i<Math.floor(w/.5);i++)kit.box(.24,.075,1.36,-W+.35+i*.5,ground-.34,D+.62,0xf2ede0,{rx:.16});
 }
 // Upstairs: two windows with their frames, a sill each, and a wall-hung air conditioner.
 for(const x of [-W*.48,W*.48]){
  kit.box(1.7,1.25,.06,x,ground+1.55,D+.03,0xb8bec0,{finish:'metal'});
  kit.box(1.56,1.12,.05,x,ground+1.55,D+.05,C.glass,{finish:windowFinish});
  kit.box(.04,1.12,.06,x,ground+1.55,D+.07,0xb8bec0,{finish:'metal'});
  kit.box(1.8,.07,.18,x,ground+.9,D+.08,0xc9c2b4);
 }
 // (Nakamura's hangs lower, between the windows under their hoods: nakamura-dressing.js.)
 // (Nakamura's hangs lower; Higa Liquor's and the laundry's upper floors are stores, with no cooler, and their windows have hoods.)
 if(!['zenzai','kissaten','laundry'].includes(interior))kit.box(.72,.5,.26,0,ground+2.25,D+.14,0xe2e0d8);
 // The tall board stands off the front corner, square to it, so it reads from up and
 // down the street.
 if(upright){
  kit.sign(upright,.6,2.2,W-.32,ground+2.5,D+.48,{ry:Math.PI/2,depth:.08,name:'shop upright',both:true});
  for(const y of [ground+1.4,ground+3.2])kit.box(.05,.05,.5,W-.32,y,D+.22,C.steel);
 }
 // Roof: parapet, tank, aerial; rust runs down the front from the parapet's fixings.
 for(const [x0,x1,z0,z1] of [[-W,W,-D,-D+.14],[-W,W,D-.14,D],[-W,-W+.14,-D,D],[W-.14,W,-D,D]])kit.block(x0,x1,H,H+.5,z0,z1,colour,'plaster');
 kit.block(-W-.04,W+.04,H+.5,H+.58,D-.18,D+.04,trim);
 kit.cyl(.5,.5,1.1,-W*.4,H+1.2,-D*.4,C.tank,{segments:12,finish:'gloss'});
 kit.box(1,.65,1,-W*.4,H+.33,-D*.4,C.steel,{finish:'metal'});
 kit.rod([W*.5,H,-D*.5],[W*.5,H+2.3,-D*.5],.022,C.steel);
 kit.rod([W*.5-.5,H+2.0,-D*.5],[W*.5+.5,H+2.0,-D*.5],.014,C.steel);
 for(const x of [-W+.5,W-.9])if(r.next()>.3)kit.box(.05,1.2+r.next(),.02,x,H-.8,D+.01,0x9d8f78);
 // The side walls. A blank flank was the largest empty shape in any street view; a real
 // one has a drainpipe at the back corner, a small frosted window to the stairs, a dark
 // band of mould under the parapet and, often, an old painted advertisement.
 for(const side of [-1,1]){
  const x=side*(W+.03);
  kit.rod([side*(W+.08),0,-D+.25],[side*(W+.08),H+.45,-D+.25],.05,0x9aa3a0);
  kit.box(.05,.66,.56,x,ground+1.7,-D*.55,0xb8bec0,{finish:'metal'});
  kit.box(.05,.56,.46,x+side*.01,ground+1.7,-D*.55,0xc9d6d8,{finish:roomFinish});
  kit.box(.02,.28,d-.3,side*(W+.004),H-.12,0,0xbdb4a2);
 }
 const adSide=r.next()>.5?1:-1,ad=WALL_ADS[Math.floor(r.next()*WALL_ADS.length)%WALL_ADS.length];
 // About every other shop-house. Each advert is its own board, named as a sign so the
 // quarter's batch budget (tests/okinawa-quarters.test.mjs) counts it with the signs.
 const wantsAd=r.next()<.5;
 if(wantsAd&&typeof document!=='undefined'&&document.createElement)try{
  kit.sign(wallAd(ad,seed),Math.min(2.6,d*.38),Math.min(3.4,(H-ground)*1.1),adSide*(W+.035),ground+1.55,D*.18,{ry:adSide*Math.PI/2,depth:.02,edge:colour,name:'painted wall advert sign'});
 }catch{}
 return [kit.rect(-W-.05,interior==='zenzai'?1.03:W+.05,-D-.05,back+.02,H+.6,'shop-house'),kit.rect(-W-.05,-open,back,D,ground,'shop-house'),kit.rect(open,W+.05,back,D,ground,'shop-house'),...furniture];
}

/**
 * A run of coral stone wall from (x0,z0) to (x1,z1), along x or along z, in stones of
 * slightly different heights, with openings. Returns the solid runs as colliders.
 */
export function coralWall(kit,x0,z0,x1,z1,{height=1.35,thickness=.45,gaps=[],seed=4,flowers=false}={}){
 const r=rng(seed),alongX=Math.abs(x1-x0)>=Math.abs(z1-z0);
 const a=alongX?Math.min(x0,x1):Math.min(z0,z1),b=alongX?Math.max(x0,x1):Math.max(z0,z1),fixed=alongX?z0:x0;
 const runs=[];let start=a;
 const cuts=[...gaps].sort((p,q)=>p[0]-q[0]);
 for(const [g0,g1] of cuts){if(g0>start)runs.push([start,Math.min(g0,b)]);start=Math.max(start,g1);}
 if(start<b)runs.push([start,b]);
 const tints=[0xffffff,0xf4efe2,0xe8e2d2,0xfbf6ea];
 const out=[];
 for(const [s0,s1] of runs){
  const len=s1-s0,n=Math.max(1,Math.round(len/.62));
  for(let i=0;i<n;i++){
   const u0=s0+i*len/n,u1=s0+(i+1)*len/n,h=height+(r.next()-.5)*.14,mid=(u0+u1)/2;
   // Neighbouring stones alternate 2 cm in thickness, so their overlapping faces are never in one plane.
   const t=thickness+(i%2)*.02,[x,z]=alongX?[mid,fixed]:[fixed,mid],[w,d]=alongX?[u1-u0+.02,t]:[t,u1-u0+.02];
   kit.box(w,h,d,x,h/2,z,r.pick(tints),{finish:'coral'});
   // The rounded capping stones.
   kit.box(alongX?w*.9:thickness*.8,.12,alongX?thickness*.8:d*.9,x,h+.03,z,r.pick(tints),{finish:'coral',ry:(r.next()-.5)*.1});
   // Bougainvillea spilling over the top: leaves, then small bracts of colour on them.
   if(flowers&&r.next()>.7){
    kit.sphere(.26,x,h+.14,z,0x3f6b3a,{sx:1.4,sy:.55,sz:1.2,detail:0});
    for(let k=0;k<5;k++)kit.sphere(.09+r.next()*.05,x+(r.next()-.5)*.6,h+.2+r.next()*.12,z+(r.next()-.5)*.5,k%3?C.bougainvillea:0xe0559a,{detail:0});
   }
  }
  // The end stones of an opening stand a little proud, like gateposts.
  for(const u of [s0,s1]){const [x,z]=alongX?[u,fixed]:[fixed,u];kit.box(thickness+.1,height+.18,thickness+.1,x,(height+.18)/2,z,0xf4efe2,{finish:'coral'});}
  const [cx,cz]=alongX?[(s0+s1)/2,fixed]:[fixed,(s0+s1)/2],[cw,cd]=alongX?[len+.1,thickness+.1]:[thickness+.1,len+.1];
  out.push(kit.rect(cx-cw/2,cx+cw/2,cz-cd/2,cz+cd/2,height+.2,'coral-wall'));
 }
 return out;
}

/**
 * The wall a house built in the eighties or nineties got instead of coral: concrete
 * block, rendered and painted, with a band of hana-burokku flower blocks along the top
 * so the breeze gets through, and a coping. Same signature and colliders as coralWall,
 * and a handful of boxes per run rather than a stone at a time.
 */
export function blockWall(kit,x0,z0,x1,z1,{height=1.35,thickness=.2,gaps=[],colour=0xe4ddcc}={}){
 const alongX=Math.abs(x1-x0)>=Math.abs(z1-z0);
 const a=alongX?Math.min(x0,x1):Math.min(z0,z1),b=alongX?Math.max(x0,x1):Math.max(z0,z1),fixed=alongX?z0:x0;
 const runs=[];let start=a;
 for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>start)runs.push([start,Math.min(g0,b)]);start=Math.max(start,g1);}
 if(start<b)runs.push([start,b]);
 const out=[],band=.42,base=height-band-.06;
 for(const [s0,s1] of runs){
  const len=s1-s0,mid=(s0+s1)/2,[x,z]=alongX?[mid,fixed]:[fixed,mid],[w,d]=alongX?[len,thickness]:[thickness,len];
  kit.box(w,base,d,x,base/2,z,colour);
  kit.box(w,band,d*.9,x,base+band/2,z,colour,{finish:'hana'});
  kit.box(alongX?w+.04:thickness+.08,.06,alongX?thickness+.08:d+.04,x,base+band+.03,z,0xcfc8b6);
  for(const u of [s0,s1]){const [px,pz]=alongX?[u,fixed]:[fixed,u];kit.box(thickness+.12,height+.12,thickness+.12,px,(height+.12)/2,pz,0xd8d1bf);}
  const [cw,cd]=alongX?[len+.1,thickness+.1]:[thickness+.1,len+.1];
  out.push(kit.rect(x-cw/2,x+cw/2,z-cd/2,z+cd/2,height+.2,'block-wall'));
 }
 return out;
}

/** The hinpun: a free-standing screen of stone inside the gate. */
export function hinpun(kit,x,z,w=2.4,{alongX=true}={}){
 const [bw,bd]=alongX?[w,.42]:[.42,w];
 kit.box(bw,1.55,bd,x,.78,z,0xf2ecde,{finish:'coral'});
 kit.box(bw+.1,.1,bd+.1,x,1.6,z,0xe6dfcd,{finish:'coral'});
 kit.sphere(.3,x,1.85,z,C.leafLight,{sx:alongX?2.5:1,sz:alongX?1:2.5,sy:.7});
 return [kit.rect(x-bw/2-.05,x+bw/2+.05,z-bd/2-.05,z+bd/2+.05,1.7,'hinpun')];
}

/** A fukugi: tall, narrow and dense, planted in rows as a windbreak. */
export function fukugi(kit,x,z,{h=5.5,seed=5}={}){
 if(TREE_REBUILD)return broadleaf(kit,x,z,{h,form:'column',seed,name:'fukugi'});
 broadleaf(kit,x,z,{h,form:'column',seed});
 return kit.rect(x-.22,x+.22,z-.22,z+.22,h,'fukugi');
}

/** A gajumaru (banyan): a knot of trunks, hanging roots and a broad, low canopy. */
export function gajumaru(kit,x,z,{seed=6,size=1}={}){
 if(TREE_REBUILD)return broadleaf(kit,x,z,{h:6.4*size,form:'spread',seed,name:'gajumaru',rootLimit:.8*size});
 const r=rng(seed),s=size;
 for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2+r.next(),rad=(.35+r.next()*.3)*s;
  kit.rod([x+Math.cos(a)*rad,0,z+Math.sin(a)*rad],[x+Math.cos(a)*.15,3.2*s,z+Math.sin(a)*.15],.16*s,0x6e5f4c,{segments:6});
 }
 for(let i=0;i<9;i++){
  const a=r.next()*Math.PI*2,rad=(1+r.next()*1.6)*s;
  kit.rod([x+Math.cos(a)*rad,3.4*s,z+Math.sin(a)*rad],[x+Math.cos(a)*rad*1.05,0,z+Math.sin(a)*rad*1.05],.035,0x7a6a56,{segments:4});
 }
 broadleaf(kit,x,z,{h:6.4*s,form:'spread',seed});
 return kit.rect(x-.8*s,x+.8*s,z-.8*s,z+.8*s,5,'gajumaru');
}

/** A hibiscus bush with its red flowers out. */
export function hibiscus(kit,x,z,{size=.6,seed=7,flower=C.hibiscus}={}){
 const r=rng(seed);
 kit.sphere(size,x,size*.85,z,0x4b7a3f,{sy:.95});
 kit.sphere(size*.7,x+size*.45,size*.6,z-size*.2,0x55864a,{sy:.9});
 for(let i=0;i<9;i++){
  const a=r.next()*Math.PI*2,b=r.next()*1.2;
  kit.sphere(.075,x+Math.cos(a)*Math.cos(b)*size*1.02,size*.85+Math.sin(b)*size*.95,z+Math.sin(a)*Math.cos(b)*size*1.02,flower,{detail:0});
 }
}

/** A banana plant: a green trunk and its long, torn leaves. */
export function banana(kit,x,z,{seed=8}={}){
 const r=rng(seed);
 kit.cyl(.09,.13,2.1,x,1.05,z,0x6f7d3e,{segments:7});
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI*2+r.next()*.4;
  kit.box(.42,.02,1.7,x+Math.cos(a)*.75,2.15+r.next()*.25,z+Math.sin(a)*.75,i%2?0x4c7d34:0x588c3c,{ry:-a+Math.PI/2,rx:.4+i*.02,finish:"thin"});
 }
}

/** A pot plant by a door. */
export function potPlant(kit,x,z,{seed=9,size=.35}={}){
 const r=rng(seed);
 kit.cyl(size*.8,size*.6,size*1.2,x,size*.6,z,C.terracotta,{segments:9});
 kit.sphere(size,x,size*1.55,z,r.pick([0x4f7d3e,0x3f6b3a,0x5b8a45]));
 if(r.next()>.5)kit.sphere(.06,x+size*.5,size*1.8,z,C.hibiscus,{detail:0});
}

/**
 * What is inside the shopfront, seen from the pavement: each trade has its own furniture,
 * because a fish shop that looks like a general store is a general store.
 */
function shopInterior(kit,kind,{open,back,D,r,stock}){
 const furniture=[],fitted=kind==='kissaten'||kind==='zenzai';
 const shelves=(levels=4,colours=stock,tall=false)=>{
  let top=0;
  for(let level=0;level<levels;level++){
   const y=.4+level*.62;
   kit.box(open*2-.3,.04,.42,0,y,back+.28,0xb9b0a0);
   top=Math.max(top,y+.02);
   const spacing=tall?.18:.32,columns=tall?Math.floor((open*2-.42)/spacing)+1:Math.floor(open*2/spacing);
   for(let i=0;i<columns;i++){
    // Centre the bottles within the shelf, rather than letting the last one
    // overhang its end and run into the side wall.
    const x=tall?(i-(columns-1)/2)*spacing:-open+.3+i*spacing;
    if(tall){const h=.3+r.next()*.1;kit.cyl(.055,.06,h,x,y+.2,back+.28,r.pick(colours),{segments:6,finish:'glow'});top=Math.max(top,y+.2+h/2);}
    else kit.box(.24,.26+r.next()*.14,.28,x,y+.17,back+.28,r.pick(colours),{finish:'glow'});
   }
  }
  if(fitted)furniture.push(kit.rect(-open+.15,open-.15,back+.07,back+.49,top,'liquor-shelves'));
 };
 const counter=(x,width,colour=0x7d6a55)=>{
  kit.box(width,.95,.6,x,.48,back+1.2,colour);kit.box(width+.06,.05,.66,x,.98,back+1.2,0xcfc5b3);
  if(fitted)furniture.push(kit.rect(x-(width+.06)/2,x+(width+.06)/2,back+.87,back+1.53,1.005,'liquor-counter'));
 };
 if(kind==='zenzai'){
  // A proper work counter, with a clear staff passage on the stairwell side.
  kit.box(2.2,.95,.62,-.9,.475,D-.9,0x297f86);
  kit.box(2.2,.06,.7,-.9,.98,D-.9,0xe9d9b9);
  furniture.push(kit.rect(-2.0,.2,D-1.25,D-.55,1.01,'zenzai-counter'));
  for(let i=0;i<6;i++)kit.box(.045,.75,.025,-1.88+i*.34,.5,D-.575,0x23636b);
  // Syrups, stacked bowls, a hand-cranked ice shaver and a tray of andagi.
  kit.box(2.8,.06,.32,-.6,1.85,back+.24,0x84644a);
  for(let i=0;i<6;i++){
   const x=-1.7+i*.38;
   kit.cyl(.065,.07,.28,x,2.02,back+.24,[0xb74532,0xd7a53d,0x687e45][i%3],{segments:8});
   kit.cyl(.035,.035,.08,x,2.2,back+.24,0xe9dfc9,{segments:6});
  }
  kit.box(.4,.06,.34,-1.55,1.04,D-.9,0xd4ddda);
  for(const x of [-1.7,-1.4])kit.box(.055,.42,.12,x,1.25,D-.9,0xb64236);
  kit.cyl(.18,.18,.09,-1.55,1.5,D-.9,0xd4ddda,{segments:12});
  kit.rod([-1.55,1.55,D-.9],[-1.25,1.55,D-.9],.025,0x485d60);
  for(const x of [-.95,-.65])for(let i=0;i<3;i++)kit.cyl(.1,.075,.045,x,1.04+i*.045,D-.9,0xe5edf0,{segments:8});
  kit.box(.55,.04,.38,-.14,1.04,D-.9,0x9a6944);
  for(let i=0;i<6;i++)kit.sphere(.075,-.31+(i%3)*.16,1.12,D-1+(i>2?.18:0),0xbd7838,{detail:1});
  // A compact teal freezer beside the shaver, with visible island flavours.
  const displayX=-.18,displayZ=D-.9;
  kit.box(.55,.32,.5,displayX,1.19,displayZ,0x369d9b);
  kit.box(.58,.04,.54,displayX,1.37,displayZ,0xe8e5d3);
  for(const [i,colour] of [0xe7d5a3,0xa28cba,0xeeb2b9].entries())kit.sphere(.07,displayX+(i-1)*.16,1.42,displayZ,colour,{sy:.7,detail:1});
  kit.box(.6,.03,.54,displayX,1.61,displayZ,0x369d9b);
  for(const x of [displayX-.28,displayX+.28])kit.box(.025,.23,.5,x,1.49,displayZ,0x369d9b);
  // Its collider is the drawn freezer, up to its lid (1.625), standing on the counter's footprint: a hand or a held cone
  // at 1.3 m meets the case, not the counter's 1.01 top (tests/nakamura-display.test.mjs).
  furniture.push(kit.rect(displayX-.3,displayX+.3,displayZ-.27,displayZ+.27,1.625,'ice-cream-display'));
 }else if(kind==='post'){
  // The counter with its glass screen and brass scale, the wall of pigeonholes behind,
  // the form rack, and the round red post box out on the pavement.
  counter(0,open*1.6,0x6d5a48);
  kit.box(open*1.6,.5,.03,0,1.25,back+.95,0xcfe6ea,{finish:'gloss'});
  kit.box(.3,.1,.25,-open*.4,1.06,back+1.2,0xc9a64a);
  for(let row=0;row<5;row++)for(let col=0;col<Math.floor(open*2/.3);col++)kit.box(.26,.22,.05,-open+.3+col*.3,1.1+row*.26,back+.12,row%2?0xd8cfb8:0xe6dcc4);
  kit.box(.5,1.2,.25,-open+.4,.6,D-1.2,0x8a6a4a);
  kit.cyl(.22,.22,1.1,open+.25,.55,D+.35,0xc8102e,{segments:14});kit.sphere(.22,open+.25,1.1,D+.35,0xc8102e,{sy:.5});
  kit.box(.32,.04,.06,open+.25,.9,D+.58,0x2b2b2b);
 }else if(kind==='fish'){
  // A sloped counter of crushed ice with the day's fish laid on it, out to the street.
  kit.box(open*2-.2,.85,1.1,0,.43,D-.9,0xb8bec0,{finish:'metal'});
  kit.box(open*2-.3,.08,1.05,0,.9,D-.9,0xeef4f4,{rx:-.18});
  // The fish Yonamine Fresh Fish sold (fish.js; the shop is closed, cast.js PLACES), laid along the ice in turn, each kind in a pair front and back as a fishmonger
  // lays them. (r is still drawn once a fish, so everything after the counter stays where it was.)
  // (Not the suku: the fry come a few days a year and go into jars. Not the sēika: a squid lies in its own tray.)
  const fish=fishAt('yonamine').filter(f=>f.id!=='suku'&&f.id!=='seika');
  for(let i=0;i<Math.floor(open*2/.42);i++)for(let row=0;row<2;row++){
   r.next();kit.sphere(.1,-open+.35+i*.42,.98+row*.08,D-.65-row*.4,fish[i%fish.length].colour,{sx:2.3,sy:.6,finish:'gloss'});}
  kit.box(1.4,1.1,.5,-open*.5,.55,back+.4,0xf1efe8);kit.box(.5,.3,.3,open*.5,1.1,back+.5,0x2f6fb8);
  counter(open*.45,1.2,0x6a7a80);
 }else if(kind==='sweets'){
  // A glass case of andagi and chinsuko, and the fryer at the back.
  shelves(2,[0xd9a45a,0xc0843a,0xe8d8b0]);
  kit.box(open*1.3,.9,.6,-open*.2,.45,back+1.3,0xd8d2c4);
  kit.box(open*1.3,.4,.58,-open*.2,1.1,back+1.3,0xcfe3e6,{finish:'gloss'});
  for(let i=0;i<9;i++)kit.sphere(.06,-open*.2-open*.55+i*open*.14,.98,back+1.3+(i%2?.1:-.1),0xb8762e,{detail:1});
  kit.box(.9,.9,.6,open*.6,.45,back+.4,0x9aa0a4,{finish:'metal'});
 }else if(kind==='laundry'){
  // The coin laundry's machines, bench, board, manga, change machine, powder box and folding counter (coin-laundry-dressing.js).
  furniture.push(...laundryInterior(kit));
 }else if(kind==='kissaten'){
  // Kissa Higa's counter and ledge, stools, siphons, cup shelf, record cabinet, table and the family kusu (higa-liquor-dressing.js).
  furniture.push(...higaInterior(kit));
 }else{
  shelves();
  counter(-open*.3,open*1.1);
 }
 return furniture;
}
