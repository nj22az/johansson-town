import {GROCERY_ITEMS} from './catalogue.js';
import {PRODUCTS,PRODUCT_BY_ID} from './products-data.js';

/**
 * How many of a line the shelf holds when it is full. A konbini faces everything out, two
 * deep: twenty-four of a line fills its share of a gondola, a fridge column or the
 * chiller. The bun steamer holds a dozen. (Each product's capacity, data/studio/products.json.)
 */
export const shelfCapacity=id=>PRODUCT_BY_ID[id]?.capacity??24;
/**
 * Everything Sakura stocks: the catalogue, then what Thuan sells over the counter (the bun). Bought in at 55% of the
 * shelf price unless a product says otherwise (the bun's own price from the bakery).
 */
const unitCost=p=>p.unitCost??Math.ceil(p.price*55/100);
export const SHOP_STOCK=Object.freeze([...GROCERY_ITEMS.map(item=>({...item,capacity:shelfCapacity(item.id),unitCost:unitCost(PRODUCT_BY_ID[item.id])})),
 ...PRODUCTS.filter(p=>p.cells.price==null).map(p=>({id:p.id,name:p.inventoryName,cost:p.price,unitCost:unitCost(p),capacity:p.capacity}))].map(Object.freeze));
export const stockSpec=id=>SHOP_STOCK.find(item=>item.id===id);
const count=(n,max,fallback=0)=>Number.isSafeInteger(n)&&n>=0?Math.min(n,max):fallback;
export function restoreShopStock(saved){return Object.fromEntries(SHOP_STOCK.map(item=>[item.id,{shelf:count(saved?.[item.id]?.shelf,item.capacity,saved?.[item.id]?0:item.capacity),reserve:count(saved?.[item.id]?.reserve,60,saved?.[item.id]?0:item.capacity*2)}]));}
export function takeShopStock(state,id){
 const stock=state.sakura.stock[id],spec=stockSpec(id);if(!stock?.shelf||!spec)return null;
 const slot=--stock.shelf;return {item:id,slot,unitCost:spec.unitCost};
}
export function returnShopStock(state,claim){
 if(!claim)return;const spec=stockSpec(claim.item),stock=state.sakura.stock[claim.item];if(!spec||!stock)return;
 if(stock.shelf<spec.capacity)stock.shelf++;else stock.reserve++;
}
export function restockItem(state,id,quantity){
 const stock=state.sakura.stock[id],spec=stockSpec(id);if(!stock||!spec)return 0;
 const moved=Math.min(Math.max(0,Math.floor(quantity)),stock.reserve,spec.capacity-stock.shelf);stock.reserve-=moved;stock.shelf+=moved;return moved;
}
export function depletedShelf(state){return SHOP_STOCK.find(item=>{const stock=state.sakura.stock[item.id];return stock.reserve>0&&stock.shelf<item.capacity;});}
// Closing work belongs to the trading day that just ended, including work saved
// after midnight. Never replenish shelves during the 09:00–20:00 trading hours.
export function closingDay(minutes){const day=Math.floor(minutes/1440),m=((minutes%1440)+1440)%1440;return m>=1200?day:m<540?day-1:null;}
// Thuan starts making the next stock run visible shortly before closing, but
// shelves remain untouched until the trading day has ended.
export function closingPreparationOpen(minutes){const m=((minutes%1440)+1440)%1440;return m>=1170&&m<1200;}
export function closingStockPending(state,minutes){const day=closingDay(minutes);return day!==null&&day>=0&&(state?.sakura?.restockedDay??-1)<day;}
export function closingPreparationPending(state,minutes){const day=Math.floor(minutes/1440);return closingPreparationOpen(minutes)&&day>=0&&(state?.sakura?.restockedDay??-1)<day;}
export const SOLD_OUT='Sorry, we’ve sold out. Please come back tomorrow.';

const STORAGE_WON_KEY='johansson-town:storage-won';
/** What a boss seen off in Thuan's stockroom drops (thuans-storage/src/game.js). */
export const BOSS_YEN=200;

/** True when any shelf can take units from its reserve. */
export function shelvesNeedRestock(state){
 return SHOP_STOCK.some(item=>{const stock=state?.sakura?.stock?.[item.id];return !!stock&&stock.reserve>0&&stock.shelf<item.capacity;});
}

/**
 * Fill every shelf from its reserve and, when a closing restock is pending,
 * mark that trading day complete. Safe to call twice: a second pass moves
 * nothing and leaves restockedDay unchanged.
 */
export function applyStorageRestock(state,minutes){
 if(!state?.sakura?.stock)return {moved:0,dayMarked:false};
 let moved=0;
 for(const item of SHOP_STOCK){
  const count=restockItem(state,item.id,item.capacity);
  if(count){
   moved+=count;
   const shop=state.sakura;
   if(Array.isArray(shop.journal)){
    shop.journal.push({minute:minutes|0,kind:'Restocked',item:item.name,buyer:'Thuan',quantity:count,revenue:0,cost:0,profit:0,cash:shop.cash|0});
    shop.journal=shop.journal.slice(-400);
   }
  }
 }
 const day=closingDay(minutes);
 let dayMarked=false;
 if(day!==null&&day>=0&&(state.sakura.restockedDay??-1)<day){
  state.sakura.restockedDay=day;dayMarked=true;
 }
 return {moved,dayMarked};
}

/** Player-specific hand-off key; the unscoped key is the original player's legacy result. */
export const storageWonKey=player=>player?STORAGE_WON_KEY+':'+player:STORAGE_WON_KEY;
/** Read a result; retain it until acknowledgement when applying it to a town save. */
export function consumeStorageWonHandshake(expectedPlayer=null,{retain=false}={}){
 let raw=null,key=storageWonKey(expectedPlayer);
 try{raw=localStorage.getItem(key);if(!raw){key=STORAGE_WON_KEY;raw=localStorage.getItem(key);}}catch{return null;}
 if(!raw)return null;
 try{
  const payload=JSON.parse(raw);
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
  const player=typeof payload.player==='string'?payload.player:'player-1';
  if(expectedPlayer&&player!==expectedPlayer)return null;
  if(!retain){try{localStorage.removeItem(key);}catch{return null;}}
  // The night's boss, from the sea cave: who was in the suit, and whether Thuan saw them off.
  const boss=payload.boss&&typeof payload.boss==='object'&&typeof payload.boss.who==='string'&&typeof payload.boss.animal==='string'
   ?{who:payload.boss.who.slice(0,40),animal:payload.boss.animal.slice(0,20),defeated:payload.boss.defeated===true}:null;
  const outcome={
   day:Number.isSafeInteger(payload.day)&&payload.day>=0?payload.day:null,
   player,
   assisted:payload.assisted===true,
   boss,
   // Cave coins come only from a boss seen off, and never more than one drops.
   yen:boss?.defeated&&Number.isSafeInteger(payload.yen)&&payload.yen>0?Math.min(payload.yen,BOSS_YEN):0,
   t:Number.isFinite(payload.t)?payload.t:Date.now(),
  };
  Object.defineProperty(outcome,'_pending',{value:{key,raw}});
  return outcome;
 }catch{return null;}
}

export {STORAGE_WON_KEY};

/** Acknowledge only the exact pending result, after the town save is durable. */
export function acknowledgeStorageOutcome(outcome){
 const pending=outcome?._pending;if(!pending)return false;
 try{if(localStorage.getItem(pending.key)!==pending.raw)return false;localStorage.removeItem(pending.key);return true;}catch{return false;}
}
/** Restock and pay one boss outcome once in the receiving player's save slot. */
export function applyStorageOutcome(state,minutes,outcome,expectedPlayer='player-1'){
 const shop=state?.sakura,day=outcome?.day;
 const savedMinutes=Number.isFinite(state?.minutes)?state.minutes:minutes;
 if(!shop||!Number.isSafeInteger(day)||day<0||outcome.player!==expectedPlayer||day>Math.floor(Math.max(minutes,savedMinutes)/1440)||day<=(shop.storageOutcomeDay??-1))return {applied:false,moved:0,dayMarked:false,yen:0};
 // A late return marks its own closing day, never a newer night. Do not
 // refill shelves again when that day has already been automatically restocked.
 const result=(shop.restockedDay??-1)>=day?{moved:0,dayMarked:false}:applyStorageRestock(state,day*1440+1200);
 const yen=outcome.boss?.defeated&&Number.isSafeInteger(outcome.yen)?Math.max(0,Math.min(BOSS_YEN,outcome.yen)):0;
 state.yen=(state.yen||0)+yen;shop.storageOutcomeDay=day;
 return {...result,applied:true,yen};
}

/**
 * The web edition's shelves (edition.js `trade` off; the owner, 19 October 2026: "The shop restocks even if she doesn't
 * order anything; she has a magical supply", and "it can be back next day: if you buy all the coffee in one day, they
 * will have more tomorrow"). Nothing is ordered, delivered or counted in a back room: what the player takes stays gone
 * for the rest of that trading day (the shelf counts in the save), and every shelf is full again when the shop next
 * opens at 9:00. Returns true when it refilled them.
 */
export const openingDay=minutes=>{const day=Math.floor(minutes/1440),m=((minutes%1440)+1440)%1440;return m>=540?day:day-1;};
export function webShelves(state,minutes){
 const shop=state?.sakura;if(!shop||!Number.isFinite(minutes))return false;
 const day=openingDay(minutes);if(shop.shelvesDay===day)return false;
 shop.stock=restoreShopStock(null);shop.shelvesDay=day;return true;
}
