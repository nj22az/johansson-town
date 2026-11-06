import {MINATO_COMPACT} from '../world/interiors/minato-compact-plan.js';
import {SHARED_DINING_BOUNDS,SHARED_DINING_SEAT_FRONT} from '../world/interiors/shared-dining-layout.js';
import {createRoomWalk} from './room-walk.js';
import {buildServingDish,buildServingDrink,buildServingBite} from './izakaya-serving-visuals.js';
import * as THREE from '../../vendor/three.module.js';
import {createBarRound} from './izakaya-bar.js';
import {createFoodRound,RESIDENT_RICE} from './izakaya-food.js';
import {BUDGET} from '../edition.js';

/**
 * Beer at Minato: order it at your table, Thao pours it and brings it over, you drink it
 * a sip at a time.
 *
 * Okinawa in 1997 drinks Orion. Minato keeps it three ways -- on draught in a frosted
 * mug, in the big brown 633 ml bottle with a small glass to pour into, and in the can --
 * and oolong tea for anyone who is not drinking.
 */
export const DRINKS=Object.freeze({
 draft:Object.freeze({id:'draft',jp:"Orion draught, medium mug",en:'Orion draught, a frosted mug',price:450,sips:6,alcohol:1,pour:4.2,line:"One Orion draught! Cold from the tap."}),
 bottle:Object.freeze({id:'bottle',jp:"Orion Large bottle",en:'Orion large bottle and a small glass',price:600,sips:8,alcohol:1.4,pour:2,line:"It's a big bottle. Pour for yourself -- or I pour the first one."}),
 can:Object.freeze({id:'can',jp:"Orion Can",en:'Orion can, 350 ml',price:300,sips:4,alcohol:.8,pour:1.2,line:"Still in the can? Straight from the can, then."}),
 awamori:Object.freeze({id:'awamori',jp:"Awamori on the rocks",en:'awamori on the rocks',price:250,sips:5,alcohol:1.6,pour:1.8,line:"Awamori. Slowly -- it is older than you think."}),
 sake:Object.freeze({id:'sake',jp:"Warm sake, one flask",en:'a flask of warm sake',price:220,sips:5,alcohol:1.3,pour:2.4,line:"Hot sake. Careful, the tokkuri is hot."}),
 oolong:Object.freeze({id:'oolong',jp:"Oolong tea",en:'Oolong tea over ice',price:150,sips:4,alcohol:0,pour:1.6,line:"Oolong tea. Plenty of ice."})
});
/**
 * The food on Minato's wall, each cooked where it would be: skewers and fish over the
 * charcoal at the counter, oden from its pot, the fryer, the range, or the prep bench
 * for the cold dishes. `cook` is how long Thao is at it; `bites` how long it lasts you.
 */
export const DISHES=Object.freeze({
 yakitori:Object.freeze({id:'yakitori',jp:"Assorted Yakitori",en:'a plate of yakitori',price:180,bites:4,station:'grill',cook:6,line:"Yakitori. Two tare, two salt."}),
 edamame:Object.freeze({id:'edamame',jp:"Edamame",en:'a bowl of edamame',price:120,bites:3,station:'prep',cook:2,line:"Edamame. Salted while they were hot."}),
 oden:Object.freeze({id:'oden',jp:"Oden",en:'a bowl of oden',price:260,bites:4,station:'oden',cook:3,line:"Oden. The daikon has been in since four."}),
 hiyayakko:Object.freeze({id:'hiyayakko',jp:"Cold tofu",en:'cold tofu with ginger',price:150,bites:3,station:'prep',cook:2,line:"It's cold tofu. Ginger and a little soy."}),
 dashimaki:Object.freeze({id:'dashimaki',jp:"Dashi-rolled egg",en:'a rolled dashi omelette',price:200,bites:3,station:'range',cook:5,line:"Dashi roll. Still warm in the middle."}),
 hokke:Object.freeze({id:'hokke',jp:"Grilled Atka mackerel",en:'grilled hokke',price:280,bites:4,station:'grill',cook:7,line:"It's Hokke. Lemon on the side."}),
 sashimi:Object.freeze({id:'sashimi',jp:"Assorted sashimi",en:'the sashimi plate',price:320,bites:4,station:'prep',cook:4,line:"Sashimi. Masaru brought the tuna this morning."}),
 agedashi:Object.freeze({id:'agedashi',jp:"Fried tofu",en:'agedashi tofu',price:180,bites:3,station:'fryer',cook:5,line:"It's fried. Mind the broth, it is hot."}),
 karaage:Object.freeze({id:'karaage',jp:"Fried chicken",en:'chicken karaage',price:220,bites:4,station:'fryer',cook:6,line:"It's fried chicken. Straight out of the oil."}),
 ochazuke:Object.freeze({id:'ochazuke',jp:"Ochazuke",en:'ochazuke to finish',price:180,bites:3,station:'range',cook:4,line:"Ochazuke. The way to end an evening."}),
});
export const MINATO_MENU=Object.freeze([...Object.values(DISHES),...Object.values(DRINKS)]);
export const menuItem=id=>DRINKS[id]||DISHES[id]||(id==='rice'?RESIDENT_RICE:null);
/** Where Thao stands to cook, measured from the same plan that builds the Blender room. */
export const KITCHEN_STATIONS=Object.freeze(MINATO_COMPACT.kitchenStations);
export const NAO_STATION=Object.freeze([...MINATO_COMPACT.staff.position]);

/**
 * Where the player can sit, and where Thao stands to serve that seat. `table` is the spot
 * on the table in front of the player; `serve` is Thao's floor spot beside it.
 */
const plan=MINATO_COMPACT,booth=plan.booth,S=plan.staff;
/**
 * Where Thao stands to set a drink down, and where it goes. Her arm is short (her shoulder is 0.93 m up and her
 * reach 0.4 m) and the counter and the worktop together are 1.2 m deep, so nothing is handed across them: she comes
 * round the end of the counter (`route`), steps in beside you (`close`) and sets it down within her reach. At the
 * counter that is beside the stool, between it and the next one (0.41 m apart); at the booth, at the table's nearer end.
 */
const COUNTER_EDGE=plan.counter.position[2]+plan.counter.depth/2;
const way=to=>[[S.endX,S.aisleZ],[S.endX,plan.counterStandZ],to];
const counterService=x=>({close:[x+.4,COUNTER_EDGE+.18],route:way([x+.4,plan.counterStandZ])});
function boothService(x,z){
 const right=x>=booth.position[0],end=booth.position[0]+(right?1:-1)*booth.tableWidth/2;
 return {spotX:end-(right?1:-1)*.25,close:[end+(right?1:-1)*.15,z],route:way([booth.standX[right?1:0],z])};
}
const boothSeat=(id,row,label)=>{
 const x=booth.seatX[1],z=booth.benchZ[row],topZ=booth.position[2]+(row===0?-1:1)*booth.tableDepth*.2,serveX=booth.standX[1];
 const drinkZ=booth.position[2]+(row===0?-1:1)*(booth.tableDepth/2-.07),service=boothService(x,drinkZ);
 return Object.freeze({id,label,position:[x,0,z],stand:[serveX,0,z],surfaceY:plan.seatHeight,eyeY:row===0?1.14:1.2,yaw:row===0?Math.PI:0,front:SHARED_DINING_SEAT_FRONT.bench,
  table:[service.spotX,booth.tableTop,drinkZ],dish:[x+(row===0?.15:-.15),booth.tableTop,topZ],serve:[serveX,0,topZ],
  route:service.route,close:service.close,
 });
};
export const IZAKAYA_PLAYER_SEATS=Object.freeze({
 table:boothSeat('table',0,'Sit at the table'),
 window:boothSeat('window',1,'Sit and enjoy the evening'),
 // The five counter stools, among the regulars.
 ...Object.fromEntries(plan.counterStools.map((x,i)=>['counter'+i,Object.freeze({id:'counter'+i,label:'Sit at the counter',counter:true,
  position:[x,0,plan.counterSeatZ],stand:[x,0,plan.counterStandZ],surfaceY:plan.seatHeight,eyeY:1.32,yaw:0,front:SHARED_DINING_SEAT_FRONT.stool,
  table:[x+.15,plan.counter.top,COUNTER_EDGE-.06],dish:[x-.12,plan.counter.top,plan.counter.position[2]+plan.counter.depth*.25],
  serve:[x+.4,0,COUNTER_EDGE+.18],...counterService(x)})])),
});

/** Thao's way to a resident's place, and the spot she can set their glass down on (IZAKAYA_PLAYER_SEATS). */
export function serviceFor(table,food=false){
 if(food){
  if(table[2]<booth.position[2]-booth.tableDepth){const x=plan.counterStools.reduce((a,b)=>Math.abs(b-table[0])<Math.abs(a-table[0])?b:a);
   return {table:[x-.15,plan.counter.top+.002,COUNTER_EDGE-.09],close:[x-(x===plan.counterStools[0]?.38:.4),COUNTER_EDGE+.18],route:way([x-(x===plan.counterStools[0]?.25:.4),plan.counterStandZ])};}
  const service=boothService(table[0],table[2]),right=table[0]>=booth.position[0],end=booth.position[0]+(right?1:-1)*booth.tableWidth/2;
  return {table:[end+(right?-.18:.18),booth.tableTop+.002,table[2]],route:service.route,close:service.close};
 }
 if(table[2]<booth.position[2]-booth.tableDepth){const x=plan.counterStools.reduce((a,b)=>Math.abs(b-table[0])<Math.abs(a-table[0])?b:a);return {table:[x+.15,plan.counter.top,COUNTER_EDGE-.06],...counterService(x)};}
 // Residents' authored table points are nearer the centre than the player's glass
 // slots. Use the same outer glass row so their meal and drink cannot occupy one spot.
 const z=booth.position[2]+Math.sign(table[2]-booth.position[2])*(booth.tableDepth/2-.07),service=boothService(table[0],z);return {table:[service.spotX,booth.tableTop,z],route:service.route,close:service.close};
}

/** A drink as a small prop: a mug with a head, a brown bottle and glass, a can, a tumbler. */
/**
 * A poured beer: the liquid empties from the top down, its head of foam stays a collar
 * on whatever is left (thinning a little) and goes when the glass is drained, and a few
 * bubbles keep rising from the bottom to the current level. Without this the whole
 * level, foam and all, was squashed flat.
 */
function pour(g,liquid,head,height,radius){
 const bottom=liquid.position.y-height/2,points=10,positions=new Float32Array(points*3),rise=[];
 for(let i=0;i<points;i++){const a=i*2.4,r=radius*(.25+.7*((i*37)%10)/10);positions[i*3]=liquid.position.x+Math.cos(a)*r;positions[i*3+1]=bottom+((i*0.31)%1)*height;positions[i*3+2]=Math.sin(a)*r;rise.push(.012+((i*13)%7)*.004);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const bubbles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xfff2c4,size:.0035,transparent:true,opacity:.8,depthWrite:false}));bubbles.name='Beer bubbles';
 // Decoration only: points catch any ray within a metre by default (three.js), so a glass's bubbles never stop one.
 bubbles.raycast=()=>{};
 g.add(bubbles);
 g.userData.pour={liquid,head,bottom,height,headHeight:head.geometry.parameters.height,bubbles,rise};
}
function settlePour(u,dt){
 const p=u.pour,left=u.portion,top=p.bottom+p.height*left;
 p.liquid.scale.y=Math.max(.001,left);p.liquid.position.y=p.bottom+p.height*left/2;
 p.head.visible=left>.03;p.head.scale.y=.55+.45*left;p.head.position.y=top+p.headHeight*p.head.scale.y/2;
 const pos=p.bubbles.geometry.attributes.position;p.bubbles.visible=left>.05;
 for(let i=0;i<pos.count;i++){let y=pos.getY(i)+p.rise[i]*dt*(left>.1?1:.3);if(y>top)y=p.bottom+(y-top)%Math.max(.005,top-p.bottom);pos.setY(i,y);}
 pos.needsUpdate=true;
}
export function createDrinkProp(kind,options={}){
 const {group,liquid,head,height,radius}=buildServingDrink(kind,options);
 group.userData.drinkKind=kind;
 group.userData.drinkSurface={liquid,head};
 if(head)pour(group,liquid,head,height,radius);
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 return group;
}

/** Real turned dishes and separate edible portions, visible from every seat. */
export function createDishProp(kind){
 const group=buildServingDish(kind);
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 return group;
}

/** Smooth liquid levels; remove food portions in sequence rather than flattening a dish. */
export function setPropPortion(prop,fraction,{immediate=false}={}){
 const value=THREE.MathUtils.clamp(Number(fraction)||0,0,1);
 prop.userData.targetPortion=value;
 if(immediate){prop.userData.portion=value;updatePropPortion(prop,0);}
}
export function updatePropPortion(prop,dt){
 const u=prop.userData,level=u.level;if(!level)return;
 const target=u.targetPortion??1,current=u.portion??1;
 u.portion=Math.abs(current-target)<.001?target:THREE.MathUtils.damp(current,target,7,Math.max(0,dt));
 level.visible=u.portion>0;
 // A table drinking performance owns the tilted free surface. The ordinary upright
 // portion animation must not squash its newly clipped geometry in the same frame.
 if(u.tableDrinkFluid){level.visible=false;u.tableDrinkFluid.update(u.portion);return;}
 if(u.consumable==='food'){
  const amount=level.children.length*u.portion;
  level.children.forEach((piece,i)=>{piece.visible=i<Math.ceil(amount);piece.scale.setScalar(Math.min(1,Math.max(0,amount-i)));});
 }else if(u.pour){
  // The glass empties from the top; anything else poured (the bottle) empties with it.
  level.scale.y=1;settlePour(u,dt);
  for(const piece of level.children)if(piece!==u.pour.liquid&&piece!==u.pour.head){piece.userData.baseY??=piece.position.y;piece.scale.y=Math.max(.001,u.portion);piece.position.y=piece.userData.baseY*u.portion;}
 }else level.scale.y=Math.max(.001,u.portion);
}
export function createBiteProp(kind){return buildServingBite(kind);}
export function disposeServing(prop){
 if(!prop)return;prop.removeFromParent();const materials=new Set();
 prop.traverse(o=>{if(o.isMesh||o.isSprite){if(o.isMesh)o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 materials.forEach(m=>m.dispose());
}

/**
 * @param {object} options
 * @param {THREE.Object3D} options.room
 * @param {()=>THREE.Object3D|null} options.getNao Thao's entity when she is working the room
 * @param {(x:number,z:number,r:number)=>boolean} options.blocked
 * @param {(text:string,seconds?:number)=>void} [options.say]
 */
export function createBeerService({room,getNao,blocked=()=>false,bounds=SHARED_DINING_BOUNDS,say=()=>{},bar=null,full=BUDGET.pouring}){
 // One queue owns Thao: player orders and residents' separately requested food and drinks.
 let order=null,waiting=null,drink=null,dish=null,served=0,sipLease=null;const queue=[];
 const radius=.3,walker=createRoomWalk((x,z,r)=>blocked(x,z,r),{bounds,smoothTurn:true,radius});
 let walkingPerson=null,stalled=0;
 function resetWalk(){walker.clear();walkingPerson=null;stalled=0;}
 function release(g){if(!g)return;for(const key of ['playerService','serviceRadius','heldItem','socialPose','carrying'])delete g.userData[key];}
 /**
  * The authored points say which side of the counter to use. Furniture still decides
  * how to reach each one: benches and a moved chair can block a straight approach.
  * Check the short final step too; room walkers normally stop 12 cm from their goal.
  */
 function clearSegment(fromX,fromZ,toX,toZ){
  const steps=Math.max(1,Math.ceil(Math.hypot(toX-fromX,toZ-fromZ)/.05));
  for(let i=1;i<=steps;i++)if(blocked(fromX+(toX-fromX)*i/steps,fromZ+(toZ-fromZ)*i/steps,radius))return false;
  return true;
 }
 function walk(g,points,dt){
  if(walkingPerson?.g!==g){resetWalk();walkingPerson={g,profile:{name:'Thao'}};}
  while(points.length){
   const [x,z]=points[0],dx=x-g.position.x,dz=z-g.position.z,d=Math.hypot(dx,dz);
   const beforeX=g.position.x,beforeZ=g.position.z;
   if(d<.12&&clearSegment(beforeX,beforeZ,x,z)){
    if(d<.01){g.position.x=x;g.position.z=z;points.shift();walker.forget(walkingPerson);stalled=0;continue;}
    const want=Math.atan2(-dx,-dz),turn=Math.atan2(Math.sin(want-g.rotation.y),Math.cos(want-g.rotation.y));
    g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,turn));
    if(Math.abs(turn)<.05){const step=Math.min(d,dt*.6);g.position.x+=dx/d*step;g.position.z+=dz/d*step;}
   }else{
    walker.move(walkingPerson,[x,g.position.y,z],dt);
    // A room can change after the route was planned. Never step through an obstacle
    // between two clear endpoints, including on a long simulation frame.
    if(!clearSegment(beforeX,beforeZ,g.position.x,g.position.z)){g.position.x=beforeX;g.position.z=beforeZ;walker.clear();}
   }
   if(Math.hypot(g.position.x-beforeX,g.position.z-beforeZ)<.0001){
    stalled+=dt;if(stalled>=2){walker.clear();stalled=0;}
   }else stalled=0;
   return false;
  }
  return true;
 }
 const clearProp=slot=>{if(slot){slot.prop.removeFromParent();slot.prop.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose?.();}});}};
 function clearDrink(){if(sipLease)sipLease.cancel();clearProp(drink);drink=null;}
 function clearDish(){clearProp(dish);dish=null;}
 const stepTo=(g,[x,z],dt)=>{const dx=x-g.position.x,dz=z-g.position.z,d=Math.hypot(dx,dz);if(d<.005){g.position.x=x;g.position.z=z;return true;}g.rotation.y=Math.atan2(-dx,-dz);const k=Math.min(1,dt*.5/d);g.position.x+=dx*k;g.position.z+=dz*k;return false;};
 const face=(g,x,z)=>{g.rotation.y=Math.atan2(-(x-g.position.x),-(z-g.position.z));};
 const station=()=>[NAO_STATION[0],NAO_STATION[2]];
 function serve(kind,seat,carried=null){
  // The glass she carried is the one on the table; only the opening scene's drink is already there (serveNow).
  if(DRINKS[kind]){clearDrink();const prop=carried||createDrinkProp(kind);if(!carried){prop.position.set(...seat.table);prop.rotation.y=seat.yaw||0;room.add(prop);}else setPropPortion(prop,1,{immediate:true});drink={kind,left:DRINKS[kind].sips,prop};}
  else{clearDish();const prop=carried||createDishProp(kind);if(!carried){prop.position.set(...(seat.dish||seat.table));room.add(prop);}dish={kind,left:menuItem(kind).bites,prop};}
  served++;
 }
 function eatFrom(slot,total){
  slot.left=Math.max(0,slot.left-1);setPropPortion(slot.prop,slot.left/total);
 }
 function beginSip(){
  if(sipLease||!drink||drink.left<=1e-8)return null;
  const slot=drink,spec=DRINKS[slot.kind],start=slot.left,amount=Math.min(1,start);let consumed=0,active=true;
  const result=()=>({kind:slot.kind,left:Math.max(0,Math.ceil(slot.left-1e-8)),alcohol:spec.alcohol/spec.sips*consumed,consumedPortion:consumed});
  const finish=()=>{if(!active)return result();active=false;if(sipLease===lease)sipLease=null;return result();};
  const lease={
   kind:slot.kind,prop:slot.prop,startFraction:start/spec.sips,endFraction:(start-amount)/spec.sips,
   get active(){return active&&drink===slot;},get consumedPortion(){return consumed;},
   /** Absolute fraction of this sip, only advanced by valid mouth/flow contact. */
   consume(progress){if(!lease.active)return false;const next=Math.max(consumed,amount*THREE.MathUtils.clamp(Number(progress)||0,0,1));consumed=next;slot.left=Math.max(0,start-consumed);setPropPortion(slot.prop,slot.left/spec.sips,{immediate:true});return true;},
   finish,cancel:finish,
  };
  sipLease=lease;return lease;
 }
 /** The next job: your order first, then the residents' food and drinks in request order. */
 function start(nao){
  if(order||!nao)return;const job=waiting||queue.shift();if(!job)return;if(job===waiting)waiting=null;
  resetWalk();const spec=menuItem(job.kind),dishOrder=!DRINKS[job.kind];
  order={...job,staff:nao,phase:dishOrder?'cooking':'making',timer:0,path:null};
  if(dishOrder)order.round=createFoodRound({kind:job.kind,spec,room,staff:nao,walk,cancelled:()=>!!order?.cancelled});
  else order.round=createBarRound({kind:job.kind,bar,room,staff:nao,walk,full,cancelled:()=>!!order?.cancelled});
  nao.userData.playerService=true;delete nao.userData.socialPose;
  nao.userData.activity=dishOrder?'cooking '+spec.en+' for you':'making '+spec.en.toLowerCase()+(job.player?' for you':'');
 }
 function finishRound(){order?.round?.finish();}
 /** She has gone (closing, the room rebuilt): what is in her hands goes back, and nobody waits. */
 function drop(staff){order?.round?.dispose();release(staff);resetWalk();if(order&&!order.player)order.onServed?.(null);order=null;waiting=null;for(const job of queue.splice(0))job.onServed?.(null);}
 return {
  /** Your drink or dish on its way, if any (waiting while she finishes someone else's). */
  get pending(){const mine=order?.player?order:waiting;return mine?{kind:mine.kind,phase:mine===order?order.phase:'waiting'}:null;},
  get drink(){return drink?{kind:drink.kind,left:Math.max(0,Math.ceil(drink.left-1e-8)),sips:DRINKS[drink.kind].sips}:null;},
  get sipping(){return !!sipLease;},
  beginSip,
  get dish(){return dish?{kind:dish.kind,left:dish.left,bites:menuItem(dish.kind).bites}:null;},
  get served(){return served;},
  /** What she is doing now, for tests and the audit: the job's kind, phase and the bar round's step. */
  get working(){return order?{kind:order.kind,phase:order.phase,step:order.round?.step||null,player:!!order.player,
   close:['making','cooking'].includes(order.phase)?!!order.round?.close:['stepping','placing','bowing','leaving'].includes(order.phase)}:null;},
  /**
   * Ask for a drink or a dish at this seat. False if Thao is not here or yours is already on its way. A drink she
   * makes from where it is kept (izakaya-bar.js); a dish she cooks at its station in the kitchen first.
   */
  order(kind,seat){
   const spec=menuItem(kind),nao=getNao();
   if(!spec||!seat||order?.player||waiting||sipLease||!nao||DRINKS[kind]&&!bar)return false;
   waiting={kind,seat:DRINKS[kind]||!IZAKAYA_PLAYER_SEATS[seat.id]?seat:{...seat,dish:null,...serviceFor(seat.dish||seat.table,true)},player:true};if(!order)start(nao);
   return true;
  },
  /**
   * A resident's drink or dish: `kind` a menu item (or resident rice), `table` where it goes, `onServed(prop)` with what she sets
   * down. False when she is not working the room. `tag` cancels it (they have gone).
   */
  request({kind,table,tag=null,onServed}){
   const nao=getNao();if(!menuItem(kind)||DRINKS[kind]&&!bar||!nao)return false;
   queue.push({kind,seat:serviceFor(table,!DRINKS[kind]),tag,onServed});if(!order)start(nao);return true;
  },
  cancel(tag){for(let i=queue.length-1;i>=0;i--)if(queue[i].tag===tag)queue.splice(i,1);if(order&&order.tag===tag)order.cancelled=true;},
  /** One sip. Returns what is left, or null with nothing on the table. */
  sip(){
   const sip=beginSip();if(!sip)return null;sip.consume(1);return sip.finish();
  },
  /** One mouthful of the dish. Returns what is left, or null with nothing on the plate. */
  bite(){
   if(!dish||dish.left<=0)return null;
   eatFrom(dish,menuItem(dish.kind).bites);const result={kind:dish.kind,left:dish.left};
   if(dish.left===0){const finished=dish;setTimeout(()=>{if(dish===finished)clearDish();},2500);}
   return result;
  },
  /** A drink already on the table at this seat -- the evening you walk into, not one you ordered. */
  serveNow(kind,seat){if(!menuItem(kind)||!seat?.table)return false;serve(kind,seat);return true;},
  update(dt){
   try{
   if(drink)updatePropPortion(drink.prop,dt);if(dish)updatePropPortion(dish.prop,dt);
   if(!order)return;
   const nao=getNao();
   if(!nao){drop(order.staff);return;}
   const spec=menuItem(order.kind),{seat}=order,u=nao.userData,glass=!!order.round;
   if(order.phase==='making'||order.phase==='cooking'){
    // The existing drinks round, or a food round using the fitted kitchen and plating pass.
    if(order.round.update(dt)){
     if(order.cancelled||!order.round.drink){finishRound();order.path=[station()];order.phase='returning';u.activity='back to the counter';return;}
     order.round.carry();order.path=seat.route.map(p=>[...p]);order.phase='carrying';u.activity=order.player?'bringing your '+(DRINKS[order.kind]?'drink':'meal'):'bringing '+(DRINKS[order.kind]?'a drink':'a meal')+' over';
    }
   }else if(order.phase==='carrying'){
    delete u.socialPose;
    const to=DRINKS[order.kind]?seat.table:(seat.dish||seat.table);
    if(walk(nao,order.path,dt)){if(seat.close)order.phase='stepping';else{face(nao,to[0],to[2]);order.phase='placing';order.timer=1.1;if(glass)order.round.placeAt(to);else u.socialPose='CarryIdle';}}
   }else if(order.phase==='stepping'){
    // In beside the place, a short straight step clear of the stools and the bench (the places are tested).
    const to=DRINKS[order.kind]?seat.table:(seat.dish||seat.table);
    if(stepTo(nao,seat.close,dt)){face(nao,to[0],to[2]);order.phase='placing';order.timer=1.1;if(glass)order.round.placeAt(to);else u.socialPose='CarryIdle';}
   }else if(order.phase==='leaving'){
    if(stepTo(nao,seat.route.at(-1),dt)){order.path=[...seat.route.slice(0,-1).reverse(),station()].map(p=>[...p]);order.phase='returning';u.activity='back to the counter';}
   }else if(order.phase==='placing'){
    if((order.timer-=dt)<=0){
     const to=DRINKS[order.kind]?seat.table:(seat.dish||seat.table),prop=glass?order.round.letGo(to):null;
     if(glass)finishRound();
     if(prop&&order.cancelled)disposeServing(prop);else if(order.player)serve(order.kind,seat,prop);else order.onServed?.(prop);
     delete u.heldItem;delete u.carrying;u.socialPose='Greet';
     if(order.player)say('Thao: '+spec.line,4);order.phase='bowing';order.timer=.9;
    }
   }else if(order.phase==='bowing'){
    if((order.timer-=dt)<=0){delete u.socialPose;if(seat.close){order.phase='leaving';return;}order.path=[...seat.route.slice(0,-1).reverse(),station()].map(p=>[...p]);order.phase='returning';u.activity='back to the counter';}
   }else if(order.phase==='returning'){
    delete u.socialPose;
    if(walk(nao,order.path,dt)){
     // Back at her station she tops up the rack from the glass washer, and takes the next order.
     nao.rotation.set(0,Math.PI,0);bar?.restock();release(nao);resetWalk();order=null;start(nao);
    }
   }
   }finally{if(order){const close=['making','cooking'].includes(order.phase)?order.round?.close:['stepping','placing','bowing','leaving'].includes(order.phase);order.staff.userData.serviceRadius=close?.13:.26;}}
  },
  /** Leaving the room: drop the order and anything on the table. */
  clear(){const nao=getNao()||order?.staff;if(order){order.round?.dispose();if(nao){nao.position.set(...NAO_STATION);nao.rotation.set(0,Math.PI,0);release(nao);}}resetWalk();order=null;waiting=null;queue.length=0;clearDrink();clearDish();},
  /** Only for tests and a room rebuild: put a served drink straight on the table. */
  place(kind,seat){serve(kind,seat);}
 };
}
