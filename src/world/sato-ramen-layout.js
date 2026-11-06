import {SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR,SHARED_DINING_COLLIDERS,SHARED_DINING_SEAT_FRONT} from './interiors/shared-dining-layout.js';
import {MINATO_COMPACT as P} from './interiors/minato-compact-plan.js';
/**
 * Sato Ramen: the corner shop on Minato's alley flank, open at lunch while Minato is shut.
 * Mrs Sato cooks it from the east end of Minato's own kitchen line. Coordinates are the
 * room frame of the measured compact plan: its door is at the front (+z), with the
 * kitchen behind the counter (-z) and an open passage to Minato on the west.
 */
export const SATO_RAMEN=Object.freeze({id:'ramen',title:'Sato Ramen',jp:"らーめん佐藤",open:660,close:840});
/** 11:00 to 14:00: a lunch counter. */
export const satoRamenOpen=minutes=>{const m=((minutes%1440)+1440)%1440;return m>=SATO_RAMEN.open&&m<SATO_RAMEN.close;};

export const SATO_ROOM=Object.freeze({
 bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR,
 spawn:Object.freeze([...P.ramenEntrance.spawn]),exit:Object.freeze([...P.ramenEntrance.exit]),yaw:0,
});
/** Three chrome stools at the counter and two at the wall ledge. */
export const SATO_COUNTER=Object.freeze(P.ramenStools.map(x=>Object.freeze({position:[x,0,P.ramenSeatZ],height:P.seatHeight,surfaceY:P.seatHeight,yaw:0,front:SHARED_DINING_SEAT_FRONT.stool,stand:[x,0,P.ramenStandZ],table:[x,P.ramenCounter.top,P.ramenCounter.position[2]+.15]})));
export const SATO_LEDGE=Object.freeze(P.ramenLedge.seatZ.map(z=>Object.freeze({position:[P.ramenLedge.seatX,0,z],height:P.seatHeight,surfaceY:P.seatHeight,yaw:-Math.PI/2,front:SHARED_DINING_SEAT_FRONT.stool,stand:[P.ramenLedge.standX,0,z],table:[P.ramenLedge.position[0]-.05,P.ramenLedge.top,z]})));
export const SATO_CORNER=Object.freeze([]);
/**
 * Where the lunch regulars sit: every other stool first, so there is room for you, then
 * one more stool, and the ledge last -- Mrs Sato serves the counter across it.
 */
export const SATO_GUEST_SEATS=Object.freeze([SATO_COUNTER[0],SATO_COUNTER[2],SATO_COUNTER[1],...SATO_LEDGE]);
export const SATO_COOK=Object.freeze({position:Object.freeze([...P.ramenStaff.position]),yaw:0});
/**
 * Where she works, on the floor of the measured kitchen aisle: the prep board,
 * the noodle boiler, the stock pots and the topping tray along the back line (facing it,
 * yaw 0), the coffee urn and barley-tea jug on the back counter, and the pass, where a
 * bowl goes over the counter to a stool (facing the room, yaw π).
 */
export const SATO_KITCHEN=Object.freeze({
 prep:Object.freeze([...P.ramenStaff.prep]),boiler:Object.freeze([...P.ramenStaff.boiler]),pots:Object.freeze([...P.ramenStaff.pots]),toppings:Object.freeze([...P.ramenStaff.toppings]),
 drinks:Object.freeze([...P.ramenStaff.drinks]),aisleZ:P.ramenStaff.aisleZ,passZ:P.ramenStaff.passZ,minX:P.ramenStaff.minX,maxX:P.ramenStaff.maxX,
});
export const SATO_COLLIDERS=Object.freeze(SHARED_DINING_COLLIDERS);
/**
 * What the ticket machine sells, at 1997 lunch prices. `prop` is what arrives on the
 * counter (people/resident-props.js, or the dish props in people/izakaya-beer.js).
 */
export const SATO_MENU=Object.freeze([
 {id:'shoyu',name:'Shoyu ramen',jp:"醤油らーめん",cost:450,prop:'ramen'},
 {id:'miso',name:'Miso ramen',jp:"味噌らーめん",cost:500,prop:'ramen'},
 {id:'shio',name:'Shio ramen',jp:"塩らーめん",cost:450,prop:'ramen'},
 {id:'chashu',name:'Chashu-men',jp:"チャーシュー麺",cost:650,prop:'ramen'},
 {id:'gyoza',name:'Gyoza, six',jp:"餃子",cost:250,prop:'gyoza'},
 {id:'rice',name:'A bowl of rice',jp:"ご飯",cost:100,prop:'rice'},
 {id:'beer',name:'Orion, a bottle',jp:"瓶ビール",cost:400,prop:'beer'},
 {id:'tea',name:'Oolong tea',jp:"烏龍茶",cost:120,prop:'tea'},
 {id:'mugicha',name:'Cold barley tea',jp:"冷たい麦茶",cost:100,prop:'mugicha'},
 {id:'coffee',name:'Hot coffee',jp:"珈琲",cost:200,prop:'coffee'},
].map(item=>Object.freeze(item)));
/**
 * Lunch at Sato Ramen for the people who live and work on the street, in minutes. Each
 * visit is inside the lunch hours; the shift workers take it as their lunch break.
 */
export const SATO_LUNCH=Object.freeze({
 // Chin sleeps through lunch after Sakura's night shift (sakura-rota.js) and has no slot.
 Thuan:Object.freeze([780,830]),Nhung:Object.freeze([745,790]),
 Tetsuo:Object.freeze([700,745]),'Harbour master':Object.freeze([720,765]),
});
/** What each regular drinks with lunch: a hot coffee or a glass of cold barley tea. */
export const SATO_LUNCH_DRINK=Object.freeze({Thuan:'mugicha',Nhung:'mugicha',Tetsuo:'coffee','Harbour master':'coffee'});
