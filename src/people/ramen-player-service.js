import * as THREE from '../../vendor/three.module.js';
import {createResidentProp} from './resident-props.js';
import {createDishProp,createDrinkProp,setPropPortion,updatePropPortion,disposeServing} from './izakaya-beer.js';
export const RAMEN_MENU=Object.freeze([{id:'ramen',name:'Shoyu ramen',cost:300},{id:'rice',name:'Onigiri',cost:120},{id:'bun',name:'Steamed pork bun',cost:150},{id:'tea',name:'Green tea',cost:120}]);
/** Drinks, and the glass each comes in (people/izakaya-beer.js). */
const DRINK_PROPS={tea:'oolong',beer:'bottle',mugicha:'mugicha',coffee:'coffee'};
/** How many mouthfuls a thing lasts you. */
const MOUTHFULS={ramen:6,gyoza:6,rice:4,bun:3,tea:4,mugicha:4,coffee:4,beer:6};
export function createRamenPlayerService({room,getSeat,getMinutes,getBalance,pay,say,menu=RAMEN_MENU,isOpen=null,title='Sato Ramen',server='The cook',closedLine='The ramen kitchen is closed. Please return after 09:00.',kitchen=null,onMouthful=()=>{},canOrder=()=>true,ticket=null}){
 let order=null,elapsed=0;const props=new Map();
 const open=()=>isOpen?isOpen(getMinutes()):getMinutes()%1440>=540&&getMinutes()%1440<1260;
 const kindOf=item=>item.prop||item.id;
 const makeProp=kind=>DRINK_PROPS[kind]?createDrinkProp(DRINK_PROPS[kind]):['ramen','gyoza','rice'].includes(kind)?createDishProp(kind):createResidentProp(kind);
 const clear=()=>{kitchen?.cancel('player');for(const p of props.values())p.visible=false;order=null;};
 function place(seat,kind){
  let prop=props.get(kind);if(!prop){prop=makeProp(kind);props.set(kind,prop);room.add(prop);}
  const forward=new THREE.Vector3(-Math.sin(seat.yaw),0,-Math.cos(seat.yaw));
  // On the seat's table (game.js carries `table` from the seat anchor into the park seat; it once dropped it, and the
  // bowl hung in the air at a counter's height beside a window table). Without a table, on the seat beside him.
  if(seat.table)prop.position.set(...seat.table);else{prop.position.set(...seat.position).addScaledVector(forward,.2);prop.position.y=(seat.surfaceY??.46)+.002;}
  if(prop.userData.consumable)setPropPortion(prop,1,{immediate:true});prop.visible=true;return prop;
 }
 function deliver(){
  if(!order||order.delivered)return;
  // A ticket from the machine pays for the dish it names (people/ramen-ticket.js).
  if(ticket?.use(order.item))order.ticket=true;
  else if(!pay(order.item.cost)){say('There is not enough yen for this order.',4);clear();return;}
  order.delivered=true;order.prop=place(order.seat,kindOf(order.item));
  say(kitchen?server+": Here you are. Your "+order.item.name.toLowerCase()+'.':'Your '+order.item.name.toLowerCase()+' is served. Enjoy your meal.',4);
 }
 return {menu,title,server,get order(){return order;},
  request(id){const item=menu.find(i=>i.id===id),seat=getSeat();if(!item||!seat||order)return false;
   if(!open()){say(closedLine,4);return false;}
   if(!ticket?.has(item)&&getBalance()<item.cost){say('You do not have enough yen.',3);return false;}
   const refusal=canOrder(item);if(refusal!==true){say(refusal,4);return false;}
   const kind=kindOf(item),total=MOUTHFULS[kind]||4;
   order={item,seat,delivered:false,left:total,total,cooking:false};elapsed=0;
   order.cooking=!!kitchen?.request({items:[kind],x:(seat.table||seat.position)[0],label:'your',tag:'player',onServed:deliver});
   say(ticket?.has(item)?server+' takes your ticket and begins preparing it.':server+' takes your order and begins preparing it.',4);return true;
  },
  /** A bowl already in front of you: the lunch you sit down to, not one you ordered (world/openings.js). */
  serveNow(id){
   const item=menu.find(i=>i.id===id),seat=getSeat();if(!item||!seat)return false;
   const total=MOUTHFULS[kindOf(item)]||4;order={item,seat,delivered:true,left:total,total,cooking:false};order.prop=place(seat,kindOf(item));return true;
  },
  update(dt){if(!order)return;if(getSeat()!==order.seat||!open()&&!order.delivered){clear();return;}
   if(order.prop)updatePropPortion(order.prop,dt);
   if(order.delivered||order.cooking)return;
   elapsed+=dt;if(elapsed<5)return;
   deliver();
  },
  /** One mouthful, or one sip. False with nothing in front of you. The last one clears the counter. */
  eat(){if(!order?.delivered||order.left<=0)return false;const item=order.item,kind=kindOf(item),drink=!!DRINK_PROPS[kind];
   const start=order.left/order.total;order.left--;const finish=order.left/order.total;
   if(order.prop?.userData.consumable)setPropPortion(order.prop,finish);
   onMouthful(item,{drink,kind:drink?DRINK_PROPS[kind]:kind,start,finish,left:order.left});
   if(order.left<=0){const done=order;setTimeout(()=>{if(order===done)clear();},1600);
    say(drink?'You finish the '+item.name.toLowerCase()+'.':'You finish the '+item.name.toLowerCase()+". Thank you for the meal.",4);}
   return true;},
  cancel:clear,dispose(){clear();for(const prop of props.values())disposeServing(prop);props.clear();}
 };
}
