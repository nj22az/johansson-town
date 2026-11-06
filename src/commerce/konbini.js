import {GROCERY_ITEMS} from './catalogue.js';
import {takeShopStock,returnShopStock,SOLD_OUT} from './shop-stock.js';
import {recordSakuraSale,shopEntry} from './sakura-economy.js';
import {sakuraTillOpen,SAKURA_HOURS_TEXT,SAKURA_DAYS_TEXT} from './sakura-rota.js';
import {ALCOHOL} from '../economy/goods.js';

/**
 * The counter ritual at Sakura Shōten.
 *
 * Buying used to be one button on a shelf: tap, money gone, item in bag. A konbini does
 * not work like that. You pick things up, you carry them to the counter, and the clerk
 * rings them through — asking whether to warm anything, whether you want a bag, whether
 * you have your card. That exchange is the thing worth having, so it is what this is.
 *
 * The shape of the ritual is borrowed from Yorimichi by emaxsaun (MIT), and adapted to
 * 1997. Its IC card and QR payments have no place here: Suica is four years away, so
 * the counter takes cash and counts out change. Carrier bags were free in Japan until
 * 2020, so Thuan asks about a bag but never charges for one, and the point card is the
 * paper stamp card a 1997 shop would actually have kept under the till.
 *
 * Consumption tax went from three per cent to five on 1 April 1997, and the till prints
 * its share of the total the way a shop pricing tax-inclusive did: as a line underneath
 * saying how much of what you paid was tax, rather than as something added on top.
 *
 * @typedef {object} BasketLine
 * @property {string} id
 * @property {string} name
 * @property {string} jp
 * @property {number} cost   unit price in yen
 * @property {number} count
 * @typedef {object} Receipt
 * @property {number} minute
 * @property {BasketLine[]} lines
 * @property {number} total
 * @property {number} tendered
 * @property {number} change
 * @property {string[]} warmed
 * @property {boolean} bag
 * @property {number} stampsEarned
 * @property {number} stampsAfter
 * @property {string|null} gift  item given for a completed card
 */

const BY_ID=new Map(GROCERY_ITEMS.map(item=>[item.id,item]));

/** Things a konbini microwave would take. Thuan only offers when one is in the basket. */
export const WARMABLE=Object.freeze(['rice','noodles','curry','bread','soup']);
/** One stamp per this much spent, rounded down over the whole visit. */
export const STAMP_PER_YEN=300;
export const CARD_STAMPS=10;
/** What a filled card is worth: she puts one of these on the counter and says nothing. */
export const CARD_GIFT='tea';
const BASKET_LIMIT=12;
/** Notes and coins a 1997 wallet would actually hand over. The two-thousand note is three years off. */
const DENOMINATIONS=[500,1000,5000,10000];

export const konbiniItem=id=>BY_ID.get(id)||null;

export function defaultKonbini(){
 return {basket:[],stamps:0,cards:0,tried:[],visits:0,ownBag:false,lastReceipt:null};
}

/** Only known shapes survive a load; a hand-edited save cannot mint stamps or items. */
export function restoreKonbini(saved){
 const state=defaultKonbini();
 if(!saved||typeof saved!=='object'||Array.isArray(saved))return state;
 if(Array.isArray(saved.basket))state.basket=saved.basket.filter(id=>BY_ID.has(id)).slice(0,BASKET_LIMIT);
 if(Array.isArray(saved.tried))state.tried=[...new Set(saved.tried.filter(id=>BY_ID.has(id)))].slice(0,200);
 for(const key of ['stamps','cards','visits']){
  const value=saved[key];
  if(Number.isFinite(value))state[key]=Math.max(0,Math.min(9999,Math.trunc(value)));
 }
 state.stamps=Math.min(state.stamps,CARD_STAMPS-1);   // a full card is redeemed, never stored full
 state.ownBag=saved.ownBag===true;
 return state;
}

const shelf=(state,id)=>state.sakura?.stock?.[id]?.shelf||0;

/**
 * @returns {{ok:boolean,message:string}}
 */
export function addToBasket(state,item){
 const spec=typeof item==='string'?BY_ID.get(item):item&&BY_ID.get(item.id);
 if(!spec)return {ok:false,message:'Sakura does not carry that.'};
 const konbini=state.konbini;
 if(konbini.basket.length>=BASKET_LIMIT)return {ok:false,message:'The basket is full. Take it to the counter.'};
 const held=konbini.basket.filter(id=>id===spec.id).length;
 if(held>=shelf(state,spec.id))return {ok:false,message:'Thuan: '+SOLD_OUT};
 konbini.basket.push(spec.id);
 return {ok:true,message:spec.name+' is in your basket.'};
}

export function removeFromBasket(state,id){
 const index=state.konbini.basket.indexOf(id);
 if(index<0)return false;
 state.konbini.basket.splice(index,1);
 return true;
}

export function clearBasket(state){state.konbini.basket.length=0;}

/** The basket grouped for a counter display, in the order things were picked up. */
export function basketLines(state){
 /** @type {BasketLine[]} */
 const lines=[];
 for(const id of state.konbini.basket){
  const spec=BY_ID.get(id);if(!spec)continue;
  const line=lines.find(l=>l.id===id);
  if(line)line.count++;
  else lines.push({id,name:spec.name,jp:spec.jp,cost:spec.cost,count:1});
 }
 return lines;
}

export const basketTotal=state=>basketLines(state).reduce((sum,line)=>sum+line.cost*line.count,0);

/** Which items in the basket she would offer to warm. */
export const warmableInBasket=state=>basketLines(state).filter(line=>WARMABLE.includes(line.id));

/** The smallest note that covers the total: what you would actually put on the counter. */
export function tenderFor(total){
 return DENOMINATIONS.find(note=>note>=total)??Math.ceil(total/10000)*10000;
}

/**
 * What the counter would say before anything is paid. Pure: safe to call while the
 * player is still deciding about the bag.
 */
export function checkoutQuote(state,{warm=false,bag=true}={}){
 const lines=basketLines(state),total=basketTotal(state);
 const stampsEarned=Math.floor(total/STAMP_PER_YEN);
 const stampsAfter=state.konbini.stamps+stampsEarned;
 return {
  lines,total,
  tendered:tenderFor(total),
  change:tenderFor(total)-total,
  warmed:warm?warmableInBasket(state).map(line=>line.name):[],
  bag,stampsEarned,
  cardFull:stampsAfter>=CARD_STAMPS,
  stampsAfter:stampsAfter%CARD_STAMPS
 };
}

/** True while Sakura's posted hours say the till is open (commerce/sakura-rota.js: 09:00–20:00, then the restock and the shutter). */
export const sakuraHoursOpen=sakuraTillOpen;
/** Till message when the clerk on shift is away from the counter for a bit (Thuan's afternoon walk and nap). */
export const SAKURA_AWAY_MESSAGE='Whoever is on the till is away from the counter for a bit. Try again when they are back.';
/**
 * Rings the basket through. Either the whole basket goes, or nothing does: a claim that
 * cannot be met puts every earlier claim back on the shelf.
 * @param {boolean} [thuanAvailable=true] When false, refuse mid-hours checkout (clerk not at counter).
 * @returns {{ok:true,receipt:Receipt}|{ok:false,message:string}}
 */
export function checkout(state,{warm=false,bag=true}={},minutes=0,thuanAvailable=true){
 const konbini=state.konbini;
 const m=((minutes%1440)+1440)%1440;
 const lines=basketLines(state),total=basketTotal(state);
 if(!lines.length)return {ok:false,message:'Your basket is empty.'};
 if(!sakuraHoursOpen(minutes))return {ok:false,message:'The till is closed. Sakura is open '+SAKURA_HOURS_TEXT+', '+SAKURA_DAYS_TEXT+'.'};
 if(thuanAvailable===false)return {ok:false,message:SAKURA_AWAY_MESSAGE};
 if(state.yen<total)return {ok:false,message:'You do not have enough yen for all of that.'};
 if(state.inventory.length+konbini.basket.length>100)return {ok:false,message:'Your bag is full.'};

 const claims=[];
 for(const id of konbini.basket){
  const claim=takeShopStock(state,id);
  if(!claim){for(const held of claims)returnShopStock(state,held.claim);return {ok:false,message:'Thuan: '+SOLD_OUT};}
  claims.push({id,claim});
 }

 const quote=checkoutQuote(state,{warm,bag});
 state.yen-=total;
 for(const {id,claim} of claims){
  const spec=BY_ID.get(id);
  state.inventory.push(spec.name);
  recordSakuraSale(state,spec.cost,null,{minute:minutes,item:spec.name,buyer:'Johansson',unitCost:claim.unitCost});
  if(!konbini.tried.includes(id))konbini.tried.push(id);
 }

 // A filled card is spent at once: she takes it back and puts a tea on the counter.
 let gift=null;
 const stampsAfter=konbini.stamps+quote.stampsEarned;
 if(stampsAfter>=CARD_STAMPS){
  const giftClaim=takeShopStock(state,CARD_GIFT);
  if(giftClaim){
   const spec=BY_ID.get(CARD_GIFT);
   gift=spec.name;
   state.inventory.push(spec.name);
   if(!konbini.tried.includes(CARD_GIFT))konbini.tried.push(CARD_GIFT);
   // Given away, not sold: it earns nothing and costs the shop what it cost to stock.
   shopEntry(state,{minute:minutes,kind:'Stamp card',item:spec.name,buyer:'Johansson',quantity:1,cost:giftClaim.unitCost});
   state.sakura.profit-=giftClaim.unitCost;
   konbini.cards++;
  }
 }

 konbini.stamps=stampsAfter%CARD_STAMPS;
 konbini.visits++;
 konbini.ownBag=!bag;
 /** @type {Receipt} */
 const receipt={
  minute:m,lines,total,
  tendered:quote.tendered,change:quote.change,
  warmed:quote.warmed,bag,
  stampsEarned:quote.stampsEarned,stampsAfter:konbini.stamps,gift
 };
 konbini.lastReceipt=receipt;
 clearBasket(state);
 return {ok:true,receipt};
}

/** The receipt as Thuan's till would print it. */
export function receiptText(receipt){
 if(!receipt)return '';
 const yen=n=>'¥'+n.toLocaleString('en-GB');
 const minute=Math.floor(((receipt.minute%1440)+1440)%1440);
 const clock=String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
 const rows=receipt.lines.map(line=>
  `${line.name}${line.count>1?' ×'+line.count:''}   ${yen(line.cost*line.count)}`);
 const tail=[
  '',
  `TOTAL        ${yen(receipt.total)}`,
  `(Includes consumption tax 5%      ${yen(Math.floor(receipt.total*5/105))})`,
  `CASH TENDERED      ${yen(receipt.tendered)}`,
  `CHANGE    ${yen(receipt.change)}`
 ];
 if(receipt.warmed.length)tail.push('',`WARMED · ${receipt.warmed.join(', ')}`);
 if(!receipt.bag)tail.push("Decline bag · own bag");
 if(receipt.stampsEarned)tail.push('',`Stamp +${receipt.stampsEarned} (${receipt.stampsAfter}/${CARD_STAMPS})`);
 if(receipt.gift)tail.push(`Stamp card completed · ${receipt.gift}, on the house`);
 return ["SAKURA SHOP",`1997 · ${clock}`,'','—————————————',...rows,...tail,'',"Thank you very much"].join('\n');
}
/**
 * The hot-snack case beside the till: fried chicken, steamed buns, an American dog and
 * a cup of oden, made in the shop and sold from behind the counter rather than off a
 * shelf. Thuan tongs one into a paper sleeve; there is no basket step and no stock book
 * line beyond the sale itself.
 */
export const HOT_SNACKS=Object.freeze([
 {id:'karaage',jp:"Fried chicken",name:'Karaage bites',cost:180,unitCost:70,line:'Five pieces, hot from the fryer. Careful — the first one is always too hot.'},
 {id:'nikuman',jp:"Meat bun",name:'Nikuman bun',cost:120,unitCost:45,line:'A steamed pork bun from the steamer. She wraps it in thin paper so you can hold it.'},
 {id:'amedog',jp:"Corn dog",name:'American dog',cost:130,unitCost:50,line:'Corn-batter sausage on a stick. Ketchup and mustard in one little snap pack.'},
 {id:'oden',jp:"Oden",name:'Oden cup',cost:200,unitCost:80,line:'Daikon, egg and a fish cake from the pot, with a ladle of broth and a dab of karashi.'},
]);
const HOT_BY_ID=new Map(HOT_SNACKS.map(s=>[s.id,s]));
/**
 * The bottles over the counter (the owner, 22 October 2026: Higa Liquor has closed, and Sakura sells all the alcohol): what
 * Grandmother Higa's counter sold, kept in the stock room behind the till and handed over by whoever has it, at the
 * Higas' prices, and rung in at what they cost Sakura to land (economy/goods.js, by the millilitre). The cans of lager
 * stay in the cold cabinet's column nearest the till (products-data.js beer).
 */
const landedPerMl=(id,ml)=>Math.round((ALCOHOL[id].wholesale+ALCOHOL[id].freight)*ml/ALCOHOL[id].ml);
export const SAKURA_BOTTLES=Object.freeze([
 Object.freeze({id:'awamori-mini',name:'Awamori miniature (180 ml)',cost:600,unitCost:landedPerMl('awamori-720',180),item:'Awamori miniature',text:'A little 180 ml bottle of island awamori, 30 per cent, wrapped in newspaper the way the Higas wrapped them. Keep it for a guest, Thuan says.'}),
 Object.freeze({id:'umineko-large',name:'Umineko lager, large bottle',cost:330,unitCost:landedPerMl('beer-bottle',633),item:'Umineko lager',text:'A large returnable bottle from the stock room, ¥5 back on the empty. Bring the bottle back, Thuan says; they go back to the depot.'}),
 Object.freeze({id:'sake-cup',name:'One-cup sake',cost:220,unitCost:landedPerMl('sake-1800',180),item:'One-cup sake',text:'A glass cup of sake with a ring-pull lid, the kind a man takes to the bench outside the old liquor shop.'}),
]);

/** Buys one hot snack at the counter: cash, straight into the bag, rung into the till. */
export function buyHotSnack(state,id,minutes=0,thuanAvailable=true){
 const snack=HOT_BY_ID.get(id);
 if(!snack)return {ok:false,message:'That is not in the hot case today.'};
 if(!sakuraHoursOpen(minutes))return {ok:false,message:'The hot case is switched off. Sakura is open '+SAKURA_HOURS_TEXT+', '+SAKURA_DAYS_TEXT+'.'};
 if(thuanAvailable===false)return {ok:false,message:SAKURA_AWAY_MESSAGE};
 if(state.yen<snack.cost)return {ok:false,message:'You do not have enough yen for that.'};
 if(state.inventory.length>=100)return {ok:false,message:'Your bag is full.'};
 state.yen-=snack.cost;
 state.inventory.push(snack.name);
 recordSakuraSale(state,snack.cost,null,{minute:minutes,item:snack.name,buyer:'Johansson',unitCost:snack.unitCost});
 return {ok:true,snack,message:snack.line};
}

/**
 * What Thuan would put in your hand: something on the shelf you have not tried yet,
 * or failing that anything in stock. Deterministic for the day, so asking twice in a
 * row does not reroll her opinion.
 */
export function thuanRecommends(state,day=0){
 const stocked=GROCERY_ITEMS.filter(item=>shelf(state,item.id)>0);
 if(!stocked.length)return null;
 const fresh=stocked.filter(item=>!state.konbini.tried.includes(item.id));
 const pool=fresh.length?fresh:stocked;
 return pool[((day%pool.length)+pool.length)%pool.length];
}
