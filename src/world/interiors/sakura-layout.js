import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import {MAGAZINE_RACK} from './sakura-magazine-rack.js';
import {shelfCapacity} from '../../commerce/shop-stock.js';
import {PRODUCTS} from '../../commerce/products-data.js';
import {JOHANSSON_TRUCKER} from '../../commerce/sakura-caps.js';
import {SMALL_OFFICE_COLLIDERS} from './sakura-small-office.js';
import {SAKURA_CLERK_POINT,SAKURA_CLERK_APPROACH,SAKURA_QUEUE,SAKURA_BROWSE,TILL_BODY} from './sakura-queue.js';
// Measured from the supplied convenience-store model, in metres at floor Y=0.
const rect=(x,z,w,d,height=2.9)=>({x,z,w,d,height});

/**
 * Room for the clerk.
 *
 * The stand points were authored with about 0.36m to the nearest shelf, which is under
 * half a metre of shoulder, apron and skirt: she stood inside the goods, and now that
 * the shop is visible through its own window you can watch her do it from the
 * pavement. Every stand point is pushed back off its shelf, and with the second
 * gondola gone the worst of them has 0.49m to the nearest fitting: the cold cabinets
 * and the bun warmer, which she reaches across rather than walks between. The gondola
 * itself gives her 0.55m.
 *
 * Her own width used to be stuck at 0.32 because the navigation raster was rasterised
 * at 0.32 no matter how wide the walker was, so anything broader was routed down gaps
 * it could not fit and gave up against its own collision check. The raster now takes
 * the walker's radius (see navmesh.js), so what is left to hold her back is the 0.49m
 * in front of the cold cabinets rather than the pathfinder.
 */
export const CLERK_CLEARANCE=.36;

/**
 * The shopfront that stands for this interior on the street, in metres.
 *
 * Measured off the supplied model rather than chosen: it spans x -6.86..6.87 and runs
 * back from its glazing at z 3.91 to z -6.93. A frontage smaller than that can only
 * show a shrunken copy of the shop through its own window.
 */
export const SAKURA_FRONT=Object.freeze({width:14.26,depth:11.0});

/**
 * The shop was modelled with one 6.6m gondola lying across the middle of the floor,
 * parallel to the window and two metres inside the door, so you walked in at the back
 * of a shelf and every aisle ran across your path rather than away from you.
 *
 * It is now three islands, each turned a quarter turn and stood across the floor:
 * the aisles run from the window to the cold cabinets, which is the line a customer
 * walks anyway, and the widest of them is on the door's own centre line, so you come in
 * looking down the shop instead of at the back of a shelf. They sit clear of the
 * magazine rack under the west window, which would otherwise close the far aisles off
 * from the front of the shop.
 *
 * Two of them are the halves of the run that faced the window. The third is one bay of
 * the run that lay behind it, kept back rather than dropped: the shop is twice the size
 * of a real konbini and the west end of the floor was bare without it.
 *
 * Products, stand points and colliders are all still authored in the run's own
 * coordinates and carried over by the same transform that carries its triangles, so
 * the shelving and what stands on it cannot drift apart (see rearrangeShelving in
 * sakura-interior.js).
 */
const QUARTER=Math.PI/2;
function island(from,centre,to){
 const [cx,cz]=centre,[tx,tz]=to;
 // A quarter turn about the island's own centre: (x,z) becomes (z,-x).
 return {from,yaw:QUARTER,
  place:(x,z)=>[+(tx+(z-cz)).toFixed(4),+(tz-(x-cx)).toFixed(4)],
  offset:[+(tx-cz).toFixed(4),+(tz+cx).toFixed(4)]};
}
/** The two runs as modelled, in the coordinates their triangles are still stored in. */
const FRONT_RUN={minY:-.1,maxY:1.6,minZ:.70,maxZ:1.96},BACK_RUN={minY:-.1,maxY:1.6,minZ:-1.80,maxZ:-.50};
/** Where each island came from and where it stands now, west to east. Measured spans. */
export const SHELF_ISLANDS={
 west:island({...BACK_RUN,minX:-2.55,maxX:-.485},[-1.50,-1.16],[-4.05,.6165]),
 middle:island({...FRONT_RUN,minX:-.465,maxX:2.20},[.832,1.3315],[-1.55,.33]),
 east:island({...FRONT_RUN,minX:-4.56,maxX:-.465},[-2.494,1.3315],[1.55,.05]),
};
/** The rest of the second gondola, which made the middle of the floor a corridor. */
export const REMOVED_SHELVING=[
 {minX:-3.25,maxX:2.25,minY:-.1,maxY:1.6,minZ:-1.85,maxZ:-.5},
 // The model's four-metre magazine gondola under the west window. One slim rack stands
 // there instead (sakura-magazine-rack.js).
 {minX:-6.8,maxX:-2.55,minY:-.1,maxY:1.6,minZ:3.0,maxZ:3.85},
];
/** The run's own colliders, moved with it. A quarter turn swaps width for depth. */
const turned=(id,r)=>{const [x,z]=SHELF_ISLANDS[id].place(r.x,r.z);return {x,z,w:r.d,d:r.w,height:r.height};};
const GONDOLA=[['east',rect(-2.494,1.3315,3.3,1.223,1.5)],['middle',rect(.832,1.3315,1.95,1.223,1.5)],['middle',rect(2.092,1.35,.57,1.2,1.55)],['west',rect(-1.50,-1.16,1.95,1.22,1.5)]];
/**
 * End caps on the front of the west and middle gondolas, facing the window: the first
 * thing you see down each aisle from the door. The east gondola has none -- its end is
 * the walk from the door to the till. The middle gondola's back end keeps its own.
 */
export const FRONT_ENDCAPS=Object.freeze([
 Object.freeze({id:'west-front',x:-4.05,z:1.7815,w:1.0,d:.42,levels:Object.freeze([.35,.82])}),
 Object.freeze({id:'middle-front',x:-1.55,z:1.515,w:1.0,d:.42,levels:Object.freeze([.35,.82])}),
]);
/** The cash corner on the back wall between the restroom and the drinks (sakura-corners.js). */
export const CASH_CORNER=Object.freeze({atm:Object.freeze({x:-2.66,z:-3.66,w:.58,d:.5,h:1.42}),film:Object.freeze({x:-3.42,z:-3.72,w:.44,d:.38,h:1.12})});
/** The copy machine by the east window, its fax on a table beside it. */
export const COPY_MACHINE=Object.freeze({x:2.1,z:3.5,w:.62,d:.56});
export const BASKET_STACK=Object.freeze({x:-1.84,z:3.48,w:.36,d:.42,height:.53});
export const SAKURA_LAYOUT={
 bounds:{minX:-6.8,maxX:6.8,minZ:-6.78,maxZ:3.88},
 floorPolygon:[[-6.8,3.88],[6.8,3.88],[6.8,-3.95],[5.7,-3.95],[5.7,-6.78],[-5.7,-6.78],[-5.7,-3.95],[-6.8,-3.95]],
 spawn:[0,0,3.2],entrance:[0,0,3.45],exit:[0,1.35,3.88],yaw:0,
 // Returning visitors in the evening (Nhung visiting her sister, a friend after work) stand at the customer side of the
 // counter and talk to Thuan across it: standing places, never the older store's removed chairs. Along the counter,
 // north of the till so the queue keeps its place, either side of the bun steamer (its buyers stand at 4.05, 2.45);
 // a third guest waits a step back between them.
 guestStands:[[4.1,0,1.75],[4.1,0,3.15],[3.3,0,2.45]],guestYaw:-Math.PI/2,guestActivity:'chatting with Thuan at the counter',
 // The glazing plane, in room coordinates. Both directions of the shop window use
 // it: the street seen from inside, and the real interior seen from the street.
 frontZ:3.91,
 clearance:CLERK_CLEARANCE,
 // The clerk's stand point is 0.75 m behind the counter's front (sakura-queue.js, New Yokosuka's konbini); a clerk-sized
 // walker is routed to `staffApproach` and steps the last 0.21 m forward (retail-clerk.js). The paying customer stands
 // at `checkout`, the first of the two queue spots; the queue and the browsing spots are sakura-queue.js's. `staffBody`
 // is her body's depth from its middle at the till: what has to be clear for a clerk already at work to be found there.
 staff:[...SAKURA_CLERK_POINT],staffApproach:[...SAKURA_CLERK_APPROACH],staffBody:TILL_BODY,staffYaw:Math.PI/2,checkout:[SAKURA_QUEUE[0].x,0,SAKURA_QUEUE[0].z],
 queue:SAKURA_QUEUE,browse:SAKURA_BROWSE,stockroom:[.7,0,-5.5],register:[4.88,FURNITURE_HEIGHTS.serviceCounter+.12,1.17],
 colliders:[
  ...GONDOLA.map(([id,r])=>turned(id,r)),
  rect(CASH_CORNER.atm.x,CASH_CORNER.atm.z,CASH_CORNER.atm.w,CASH_CORNER.atm.d,1.6),rect(CASH_CORNER.film.x,CASH_CORNER.film.z,CASH_CORNER.film.w,CASH_CORNER.film.d,1.2),
  ...(MAGAZINE_RACK.placed?[rect(MAGAZINE_RACK.x,MAGAZINE_RACK.z,MAGAZINE_RACK.width,MAGAZINE_RACK.depth,MAGAZINE_RACK.height)]:[]),rect(-5.17,-2.16,2.04,.61,1.5),
  rect(-6.4,.43,.9,4.03,2.25),rect(.4,-3.55,5.35,.8,2.3),
  rect(4.8,1.97,.52,3.78,FURNITURE_HEIGHTS.serviceCounter),rect(6.74,2.08,.18,3.48,2.0),
  rect(-.66,-3.99,7.82,.12),rect(5.62,-3.99,2.46,.12),
  // The restroom's east wall: two jambs either side of its doorway (z -3.66..-2.78).
  rect(-4.02,-3.81,.12,.31),rect(-4.02,-2.6,.12,.33),rect(-5.4,-2.48,2.82,.12),
  rect(4.60,-2.6,.12,2.7),rect(4.86,-1.17,.56,.12),rect(6.56,-1.17,.56,.12),
  rect(.36,-4.49,1.88,.86,2.3),rect(-6.26,-3.26,1.0,1.2,1.2),
  // The small office behind the till: Thuan's desk, the fridge with the TV on it, her chair (sakura-small-office.js).
  ...SMALL_OFFICE_COLLIDERS.map(({x,z,w,d,height})=>rect(x,z,w,d,height)),
  // Lived-in pieces (sakura-life.js): Jaga-bō on his plinth, the assistant manager, the
  // umbrella stand, the hand truck, crates and ladder in the back room.
  ...FRONT_ENDCAPS.map(E=>rect(E.x,E.z,E.w+.04,E.d+.04,1.5)),
  rect(COPY_MACHINE.x,COPY_MACHINE.z,COPY_MACHINE.w+.08,COPY_MACHINE.d+.08,1.1),rect(COPY_MACHINE.x+.56,COPY_MACHINE.z+.02,.44,.5,.9),
  // The cap tree by the east window, its base and the caps on it (sakura-cap-stand.js).
  (({x,z,w,d,height})=>rect(x,z,w,d,height))(JOHANSSON_TRUCKER.stand.collider),
  rect(-2.45,3.42,.72,.72,1.3),rect(-1.35,3.45,.42,.42,1.2),rect(1.2,3.55,.3,.3,1.0),
  rect(5.35,-5.0,.4,.6,1.1),rect(1.65,-6.35,.5,.4,.9),rect(3.6,-5.7,.45,.6,1.2),
  // The stocked back room (sakura-backroom.js BACKROOM): bottle crates and the daisha at the
  // west end, the cardboard bundle on the east wall, the extinguisher by the delivery door.
  // In the restroom (sakura-restroom.js): the pedestal basin on the south wall.
  rect(-5.18,-3.72,.66,.46,1.0),
  rect(.65,-6.52,.86,.36,.9),rect(-1.1,-6.1,.66,.96,1.1),rect(5.51,-5.67,.26,.74,.6),rect(4.66,-6.58,.28,.28,.6),
  // The Thuan figurine on her plinth in the east corner.
  rect(5.42,-6.42,.36,.36,1.2),
  rect(BASKET_STACK.x,BASKET_STACK.z,BASKET_STACK.w,BASKET_STACK.d,BASKET_STACK.height),
 ]
};
// Each stocked unit has a real position. Opposite sides of an aisle use opposite
// facings; the same product geometry is used on the shelf and in the hand.
// Shelf tops measured against the imported triangles, not the nominal shelf origin.
export const AISLE_LEVELS=[.3553,.6683,.9813,1.2943];
export const FRIDGE_LEVELS=[.34,.70,1.06,1.42,1.78];
export const SAKURA_SHELVES={};

/** How far back off its shelf every stand point is pushed. */
const STAND_BACK=.12;

/** Moves a stand point further from the shelf it serves, along the way it already faces. */
function standBack(x,z,stand){
 const dx=stand[0]-x,dz=stand[2]-z,d=Math.hypot(dx,dz);
 if(!d)return stand;
 return [+(stand[0]+dx/d*STAND_BACK).toFixed(4),stand[1],+(stand[2]+dz/d*STAND_BACK).toFixed(4)];
}

/**
 * One face of the one remaining gondola: three bays, each with a side facing the shop
 * front and a side facing the back room, four shelves apiece.
 *
 * The run that was taken out held eight of the twenty aisle products, and they moved
 * here rather than out of the shop. Twenty products over twenty-four shelves, so most
 * take one shelf each and the four heaviest lines spread over the bottom two — which
 * is where a konbini puts rice and washing powder anyway.
 */
/**
 * How many facings across a board: the widest even split of what the board holds that
 * fits the bay, so the units stand in full rows and never in a ragged part-row.
 */
export function facingsFor(perLevel,most){for(let n=Math.min(most,perLevel);n>1;n--)if(perLevel%n===0)return n;return 1;}

/** What a board of each island holds across, inside its uprights: three bays of 1.65 m on the east run, one of 1.95 on the others. */
const BAY_WIDTH={east:1.55,middle:1.85,west:1.85};
function bay(ids,site,x,z,yaw,stand){
 const on=SHELF_ISLANDS[site],[px,pz]=on.place(x,z),back=standBack(x,z,stand),[sx,sz]=on.place(back[0],back[2]);
 const facing=yaw+on.yaw,share=Math.floor(AISLE_LEVELS.length/ids.length),extra=AISLE_LEVELS.length%ids.length;
 let level=0;
 // Every board of the bay carries something: the boards are shared out, the first lines
 // (the heavier ones, low down) taking any left over.
 for(const [i,id] of ids.entries()){
  const take=share+(i<extra?1:0);
  SAKURA_SHELVES[id]={x:px+Math.sin(facing)*.14,z:pz+Math.cos(facing)*.14,levels:AISLE_LEVELS.slice(level,level+take),yaw:facing,stand:[sx,0,sz],spacing:.23,depth:.12,columns:facingsFor(shelfCapacity(id)/take,8),width:BAY_WIDTH[site],fitting:site};
  level+=take;
 }
}
/**
 * One category to a gondola, as a konbini lays its floor (docs/SAKURA-SHOP-PLAN.md):
 * the pantry on the west island beside the chiller, sweets on the middle one on the
 * door's own line, and daily goods on the long east island, nearest the till.
 *
 * Which line stands where is each product's `shelf` (data/studio/products.json): a gondola line names its bay and its
 * order on it (the first lines take the low boards). Today: the pantry's noodles, soups and curry on one face, the
 * bottles and tins on the other; the sweets' rice crackers low, crisps at a grown-up's eye and biscuits on top, with
 * chocolate and sweets low on the far face for children; daily goods' washing, paper and the bathroom, then batteries
 * and stationery.
 */
export const AISLE_BAYS=Object.freeze({
 'west-front':{site:'west',x:-1.50,z:-.93,yaw:0,stand:[-1.50,0,-.11]},
 'west-back':{site:'west',x:-1.50,z:-1.39,yaw:Math.PI,stand:[-1.50,0,-2.21]},
 'middle-front':{site:'middle',x:.832,z:1.56,yaw:0,stand:[.832,0,2.38]},
 'middle-back':{site:'middle',x:.832,z:1.10,yaw:Math.PI,stand:[.832,0,.28]},
 'east-front-1':{site:'east',x:-3.319,z:1.56,yaw:0,stand:[-3.319,0,2.38]},
 'east-front-2':{site:'east',x:-1.669,z:1.56,yaw:0,stand:[-1.669,0,2.38]},
 'east-back-1':{site:'east',x:-3.319,z:1.10,yaw:Math.PI,stand:[-3.319,0,.28]},
 'east-back-2':{site:'east',x:-1.669,z:1.10,yaw:Math.PI,stand:[-1.669,0,.28]},
});
const shelved=fitting=>PRODUCTS.filter(p=>p.shelf.fitting===fitting);
for(const [name,b] of Object.entries(AISLE_BAYS)){
 const lines=PRODUCTS.filter(p=>p.shelf.bay===name&&p.shelf.fitting===b.site).sort((x,y)=>x.shelf.order-y.shelf.order).map(p=>p.id);
 if(lines.length)bay(lines,b.site,b.x,b.z,b.yaw,b.stand);
}
/**
 * The cold cabinet at the back is the shop's magnet: drinks only, four columns of five
 * shelves, every shelf full. Fresh food has gone to the open chiller on the west wall,
 * where you reach it without opening a door. Beer is in the column nearest the till.
 * (A drink's `shelf` names its column and its shelves, counted from the bottom.)
 */
export const FRIDGE_COLUMNS=4;
for(let column=0;column<FRIDGE_COLUMNS;column++){
 const x=-1.60+column*1.33,stand=standBack(x,-3.48,[x,0,-2.78]);
 for(const {id,shelf:{levels}} of shelved('fridge').filter(p=>p.shelf.column===column).sort((a,b)=>a.shelf.levels[0]-b.shelf.levels[0])){
  const perLevel=shelfCapacity(id)/levels.length;
  SAKURA_SHELVES[id]={x,z:-3.48,levels:levels.map(l=>FRIDGE_LEVELS[l]),yaw:0,stand,spacing:.19,depth:.12,columns:facingsFor(perLevel,6),fridge:column,width:1.2,fitting:'fridge'};
 }
}
/**
 * The open chiller on the west wall (オープンケース), where the bun cabinet stood: four
 * stepped decks under a lit canopy, in three bays. Rice balls at eye level, the bento
 * under them; sandwiches over bread; pudding over yoghurt.
 */
export const CHILLER=Object.freeze({x0:-6.82,x1:-6.0,z0:-1.6,z1:2.45,levels:Object.freeze([.42,.76,1.1,1.44]),canopy:1.9});
/** The chiller's three bays along the wall: a fresh line's `shelf` names its bay and its deck (upper or lower). */
export const CHILLED_BAYS=Object.freeze([-.93,.43,1.79]);
for(const [index,z] of CHILLED_BAYS.entries()){
 const stand=standBack(-6.4,z,[-5.5,0,z]),L=CHILLER.levels,on=deck=>shelved('chiller').find(p=>p.shelf.bay===index&&p.shelf.deck===deck)?.id;
 for(const [id,levels,x] of [[on('upper'),[L[2],L[3]],-6.48],[on('lower'),[L[0],L[1]],-6.4]])
  if(id)SAKURA_SHELVES[id]={x,z,levels,yaw:Math.PI/2,stand,spacing:.2,depth:.13,columns:facingsFor(shelfCapacity(id)/levels.length,6),width:1.25,fitting:'chiller'};
}
/** The bun steamer on the counter, beside the hot case: two racks behind glass. */
export const BUN_STEAMER=Object.freeze({x:4.8,z:2.45,w:.38,d:.52,top:FURNITURE_HEIGHTS.serviceCounter,h:.44});
for(const {id} of shelved('steamer'))SAKURA_SHELVES[id]={x:BUN_STEAMER.x,z:BUN_STEAMER.z,levels:[BUN_STEAMER.top+.03,BUN_STEAMER.top+.23],columns:3,yaw:-Math.PI/2,stand:[4.05,0,BUN_STEAMER.z],spacing:.15,depth:.11,fitting:'steamer'};


/**
 * Fittings the model came with that nothing ever stood on: the wall shelf by the back
 * room and the end cap on the middle island. (The magazine rack under the west window
 * is its own piece now, in sakura-magazine-rack.js.)
 * Empty shelving reads as an unfinished shop.
 *
 * None of it is stock: the delivery cartons are the shop's own. So it is dressed here
 * rather than listed in SAKURA_SHELVES: it never depletes and never needs restocking.
 * Shelf heights and the depth each level actually has are measured off the model.
 */
function dressed(piece){
 if(!piece.island)return piece;
 const on=SHELF_ISLANDS[piece.island],[x,z]=on.place(piece.x,piece.z),[lx,lz]=on.place(piece.look[0],piece.look[2]);
 return {...piece,x,z,yaw:piece.yaw+on.yaw,look:[lx,piece.look[1],lz]};
}
export const SAKURA_DRESSING=[
 {id:'delivery',template:'stock',levels:[.088,.357,.670,.983,1.296],x:-5.165,z:-2.28,yaw:0,columns:5,rows:1,spacing:.365,depth:.25,
  look:[-5.165,1.44,-2.09],title:'Look over the delivery shelf',
  text:'Cartons off the morning van, waiting to be priced up and put out. Thuan works down them after closing.'},
 {id:'promotion',template:'curry',island:'middle',levels:[.202,.334,.805,.937],x:2.112,z:1.355,yaw:Math.PI/2,columns:5,rows:1,spacing:.18,depth:.05,
  look:[2.302,1.08,1.355],title:'Read the end-cap promotion',
  text:"Hinode Curry Roux — the month’s offer, stacked at the end of the aisle with a hand-lettered card."},
 // The front end caps (FRONT_ENDCAPS): this week's ramen offer, and the new crisps.
 {id:'ramen-week',template:'noodles',levels:[.35,.82],x:-4.05,z:1.80,yaw:0,columns:5,rows:2,spacing:.18,depth:.15,
  look:[-4.05,1.3,2.3],title:'Read the ramen-week card',
  text:'Ramen week: any two YUNAGI cups for ¥280. Thuan has written underneath, in smaller letters, that the kettle by the till is for customers.'},
 {id:'new-crisps',template:'chips',levels:[.35,.82],x:-1.55,z:1.54,yaw:0,columns:5,rows:2,spacing:.18,depth:.12,
  look:[-1.55,1.3,2.0],title:'Read the new-release card',
  text:'New: KOGANE lightly salted. Jaga-bō on the bag, Jaga-bō on the card, Jaga-bō by the window. The rep is very proud of him.'},
].map(dressed);

/**
 * Impulse props on the register wall behind Thuan. Dressing only — no new SKUs.
 * Eye / mid / low bands stay clear of her checkout yaw toward the customer side.
 * Ledger and service bell stay on the counter where sakura-interior places them.
 */
/** The low open cabinet behind the till, under the medicine shelf. Board tops in metres. */
/** The dark green tiles at the till, laid flush in the terrazzo: x and z in the room, from the front wall back. The shop
 * floor and its sheen are cut round them, so no two floors lie in one plane (sakura-shell.js floorWithout). */
export const SAKURA_TILL_FLOOR=Object.freeze([Object.freeze({x0:3.05,x1:4.54,z0:0,z1:3.56}),Object.freeze({x0:5.06,x1:6.67,z0:0,z1:3.56})]);
export const SAKURA_TILL_CABINET=Object.freeze({x0:6.24,x1:6.62,z0:.3,z1:1.85,boards:Object.freeze([.38,.72,.96])});
export const SAKURA_BACKBAR=Object.freeze([
  // Everything stands on a board of the till cabinet (SAKURA_TILL_CABINET): the top for
  // the small change-counter goods, the middle for the postcards, the bottom for the radio.
  {id:'ferry-tickets',band:'eye',x:6.42,y:.962,z:1.62,note:'Ferry punch cards'},
  {id:'phone-cards',band:'eye',x:6.42,y:.962,z:1.36,note:'Phone cards'},
  {id:'stamps',band:'eye',x:6.42,y:.961,z:1.1,note:'Sakura postage stamps'},
  {id:'gum',band:'eye',x:6.42,y:.98,z:.84,note:'Chewing gum'},
  {id:'matches',band:'eye',x:6.42,y:.967,z:.5,note:'Matches and lighter'},
  {id:'osusume',band:'mid',x:6.52,y:1.015,z:1.28,note:"Today's Recommendations"},
  {id:'postcard-stand',band:'mid',x:6.40,y:.77,z:.90,note:'Harbour postcard stand'},
  {id:'radio',band:'low',x:6.40,y:.42,z:.55,note:'Shop radio'},
  {id:'batteries',band:'low',x:6.40,y:.40,z:.84,note:'Spare batteries face-out'},
]);
