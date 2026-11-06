import {GOODS,ALCOHOL,BAR_SOFT,GROCERIES} from './goods.js';
import {MERCHANDISING,TRADE_ACCOUNTS} from '../commerce/merchandising.js';

/**
 * The town's economy, a day at a time. Nothing appears by itself: every unit on a shelf came
 * off the ferry because somebody ordered it, and every unit sold or poured is gone until it is
 * ordered again.
 *
 * The chain:
 *   mainland wholesalers --ferry--> Sakura (konbini and trade depot)
 *   Sakura --on account--> Minato (kegs, bottles and the rest), Sato Ramen (bottles), Umi-no-yu, offices
 *   Sakura --retail--> the town, the drink over its counter since Higa Liquor closed (22 October 2026)
 *   Minato pours by the measure: a bottle is opened and drained ml by ml.
 *
 * Money: households (everyone who lives here, as one purse) earn public wages and the fish
 * the island sells to the mainland, spend at the shops, and receive what the owners draw;
 * businesses pay their suppliers on delivery, pay their overheads, and the owner takes
 * whatever the till holds above its float. Tourists bring money in. Money leaves with every
 * ferry order and the overheads that go to the mainland.
 *
 * It goes up and down — summer beer, winter sake, tourist weeks, typhoons that stop the ferry
 * — and comes back to balance over a year, because nobody spends money they do not have:
 * a household with less buys less, one with more buys more, and owners draw only the surplus.
 */
export const ECONOMY_VERSION=1;
const BAR=Object.keys({...ALCOHOL,...BAR_SOFT}).filter(id=>GOODS[id].measure?.minato);

/**
 * Sakura's trade price for drink to the bars: about a tenth under retail, never under cost plus a tenth (a keg has no
 * shelf price). It was Higa Liquor's until the shop closed and Sakura took the trade (22 October 2026).
 */
export const barTrade=id=>{const g=GOODS[id],floor=g.trade*1.1;return Math.round(Math.max(floor,g.retail?g.retail*.9:g.trade*1.15)/5)*5;};

/** Who keeps what, and how much they keep in hand (days of an average day's use). */
export const BUSINESSES=Object.freeze({
 sakura:{name:'Sakura Shōten',owner:'Thuan',float:150000,draw:.35,overhead:{town:1700,mainland:1100},cover:6},
 minato:{name:'Minato Izakaya',owner:'Thao',float:30000,overhead:{town:2800,mainland:1800},cover:7,supplier:'sakura',goods:[...Object.keys(ALCOHOL).filter(id=>GOODS[id].measure?.minato),...Object.keys(BAR_SOFT)]},
 sato:{name:'Sato Ramen',owner:'Mrs Sato',float:15000,overhead:{town:1500,mainland:900},cover:7,supplier:'sakura',goods:['beer-bottle']},
 onsen:{name:'Umi-no-yu',owner:'Grandmother Higa',float:15000,overhead:{town:2600,mainland:1400},cover:7,goods:['milk','soda','soap','detergent']},
});

const SEASON={nights:[.85,.82,.95,1,1.1,1,1.15,1.25,1.05,1,.92,1.1],beer:[.65,.7,.85,1,1.15,1.3,1.5,1.55,1.3,1.05,.8,.7],sake:[1.5,1.4,1.1,.9,.75,.6,.55,.55,.7,.95,1.2,1.45],tourists:[.4,.45,.8,.9,1.6,.9,1.5,1.8,1,.8,.5,.6],fish:[.8,.85,1,1.1,1.15,1.1,1.05,1,1.1,1.15,1,.9]};
const PUBLIC_WAGES=30000,EXPORT_BASE=26000,HOUSEHOLD_TARGET=900000;
/** What households spend off the island in a day (fuel, bills, clothes, the mail-order catalogue), at their usual means. */
const MAINLAND_LIVING=16000;
/** Where the households' purse settles in a normal year, so a new town starts there. */
const HOUSEHOLD_START=1200000;

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
/** A whole number of units from an expected rate: the rate's floor, plus one with the fraction's chance. */
const draw=(rate,r)=>Math.max(0,Math.floor(rate)+(r()<rate%1?1:0));

/** A new town: shelves stocked for a week, every till at its float. */
export function createEconomy({day=0}={}){
 const s={v:ECONOMY_VERSION,day,households:{cash:HOUSEHOLD_START},biz:{},orders:[],usage:{},typhoon:0,year:newYear(),ledger:[]};
 for(const [id,b] of Object.entries(BUSINESSES))s.biz[id]={cash:b.float,stock:{},open:{},sales:0,costs:0};
 // Opening stock, as if the last week's ferries had come in: so the first day is not a famine.
 for(const id of Object.keys(GROCERIES))s.biz.sakura.stock[id]=12;
 // The drink: the wholesale buffer and what was Higa Liquor's counter stock, in the one stock room now.
 for(const id of Object.keys(ALCOHOL))s.biz.sakura.stock[id]=id==='beer-keg'?8:14;
 for(const id of Object.keys(BAR_SOFT))s.biz.sakura.stock[id]=4;
 for(const id of BUSINESSES.minato.goods)s.biz.minato.stock[id]=id==='beer-keg'?3:4;
 s.biz.sato.stock['beer-bottle']=12;for(const id of BUSINESSES.onsen.goods)s.biz.onsen.stock[id]=12;
 return s;
}
function newYear(){return {lowest:{},imports:0,freight:0,exports:0,wages:0,tourists:0,drawings:0,overheadsOut:0,days:0,typhoonDays:0,stockouts:0,demand:0,monthly:Array.from({length:12},()=>({minato:0,sakura:0,households:0}))};}

const month=date=>date.getUTCMonth();
/** Sell up to n units of a good from a business's stock; returns what was sold. */
/** Counts demand for a good at a business today (what was asked for, sold or not). */
function use(s,biz,id,n){const k=biz+':'+id;s.today[k]=(s.today[k]||0)+n;}
function sell(s,biz,id,n){const have=s.biz[biz].stock[id]|0,sold=Math.min(have,n);s.biz[biz].stock[id]=have-sold;use(s,biz,id,n);if(sold<n)s.year.stockouts+=n-sold;s.year.demand+=n;return sold;}
function pay(s,from,to,amount){
 if(amount<=0)return;
 if(from==='households')s.households.cash-=amount;else if(from)s.biz[from].cash-=amount;
 if(to==='households')s.households.cash+=amount;else if(to)s.biz[to].cash+=amount;
}
/** Average daily use of a good by a business over the last fortnight. */
function averageUse(s,biz,id){const last=(s.usage[biz+':'+id]||[]).slice(-14);return last.length?last.reduce((a,b)=>a+b,0)/Math.max(7,last.length):0;}

/**
 * One day in town.
 * @param {Date} date the calendar day (the town keeps 1997's calendar; any year works)
 * @returns the day's events: ferry, typhoon, deliveries, sales
 */
export function simulateDay(s,date){
 const r=rng(s.day*7919+13),m=month(date),dow=date.getUTCDay(),events=[];s.today={};
 s.year.days++;
 // Typhoon season: now and then the ferry does not run, and nobody goes out.
 if(s.typhoon>0)s.typhoon--;else if(m>=6&&m<=9&&r()<.025)s.typhoon=1+Math.floor(r()*2);
 const storm=s.typhoon>0;if(storm){s.year.typhoonDays++;events.push({kind:'typhoon'});}
 // Morning: yesterday's orders come in. The ferry brings Sakura's; Sakura delivers the town's.
 const due=s.orders.filter(o=>o.due<=s.day&&!(storm&&o.from==='ferry'));
 s.orders=s.orders.filter(o=>!due.includes(o));
 for(const o of due){
  if(o.from==='ferry'){
   s.biz.sakura.stock[o.good]=(s.biz.sakura.stock[o.good]|0)+o.qty;
   const g=GOODS[o.good],cost=g.wholesale*o.qty,freight=g.freight*o.qty;pay(s,'sakura',null,cost+freight);s.biz.sakura.costs+=cost+freight;s.year.imports+=cost;s.year.freight+=freight;
   events.push({kind:'ferry',good:o.good,qty:o.qty});
  }else{
   const got=Math.min(o.qty,s.biz[o.from].stock[o.good]|0);if(!got){s.orders.push({...o,due:s.day+1});continue;}
   s.biz[o.from].stock[o.good]-=got;s.biz[o.to].stock[o.good]=(s.biz[o.to].stock[o.good]|0)+got;use(s,o.from,o.good,got);
   const price=(ALCOHOL[o.good]?barTrade(o.good):GOODS[o.good].trade)*got;pay(s,o.to,o.from,price);s.biz[o.from].sales+=price;s.biz[o.to].costs+=price;
   events.push({kind:'delivery',from:o.from,to:o.to,good:o.good,qty:got});
   if(got<o.qty)s.orders.push({...o,qty:o.qty-got,due:s.day+1});
  }
 }
 // Money in from outside: public wages, the fish the island sells to the mainland, tourists.
 const weekend=dow===5||dow===6,festival=(m===7&&date.getUTCDate()>=12&&date.getUTCDate()<=16)||(m===4&&date.getUTCDate()<=5);
 const exports=storm?0:Math.round(EXPORT_BASE*SEASON.fish[m]*(.85+r()*.3));
 pay(s,null,'households',PUBLIC_WAGES+exports);s.year.wages+=PUBLIC_WAGES;s.year.exports+=exports;
 const tourists=storm?0:SEASON.tourists[m]*(weekend?1.4:1)*(festival?1.8:1);
 // People spend what they have: a little less when money is short, a little more when it is not.
 const spend=Math.max(.7,Math.min(1.3,Math.sqrt(Math.max(.01,s.households.cash)/HOUSEHOLD_TARGET)))*(storm?.45:1);
 const take=(biz,id,rate,price,payer='households')=>{const n=sell(s,biz,id,draw(rate,r));if(n){pay(s,payer,biz,n*price);s.biz[biz].sales+=n*price;}return n;};
 // Sakura's shelves: each line sells to the people it is stocked for.
 for(const [id,mer] of Object.entries(MERCHANDISING)){
  const g=GROCERIES[id];if(!g)continue;
  const season=id==='beer'?SEASON.beer[m]:['water','cola','soda','orange','tea'].includes(id)?SEASON.beer[m]**.6:1;
  const n=take('sakura',id,mer.for.length*.55*season*spend,g.retail);
  if(tourists&&['water','tea','rice','postcard','sandwich'].includes(id)){const t=sell(s,'sakura',id,draw(tourists*.8,r));if(t){s.biz.sakura.cash+=t*g.retail;s.biz.sakura.sales+=t*g.retail;s.year.tourists+=t*g.retail;}}
  s.year.monthly[m].sakura+=n*g.retail;
 }
 // The drink over Sakura's counter (Higa Liquor's until it closed): a can for tonight, a bottle for a visit, sake when
 // it is cold.
 for(const [id,rate] of [['beer-can',14*SEASON.beer[m]],['beer-bottle',4*SEASON.beer[m]],['awamori-720',1.6],['sake-1800',.8*SEASON.sake[m]],['shochu-1800',.6]]){
  const n=take('sakura',id,rate*spend*(weekend?1.3:1),GOODS[id].retail);s.year.monthly[m].sakura+=n*GOODS[id].retail;
 }
 // Minato: tables of an evening, two or three drinks each, poured from real bottles.
 const covers=draw((weekend?26:15)*SEASON.nights[m]*spend*(1+tourists*.25)*(festival?1.4:1)*(storm?.3:1),r);
 const mix=[['beer-keg',.4*SEASON.beer[m]],['beer-bottle',.12],['awamori-720',.16],['sake-1800',.08*SEASON.sake[m]],['shochu-1800',.1],['oolong-2000',.14]];
 const total=mix.reduce((t,[,w])=>t+w,0);let night=0;
 for(let c=0;c<covers;c++){
  const drinks=2+(r()<.45?1:0)+(r()<.15?1:0);
  for(let k=0;k<drinks;k++){
   let pick=r()*total,id=mix[0][0];for(const [g,w] of mix){if((pick-=w)<=0){id=g;break;}}
   const price=pour(s,'minato',id);if(price){pay(s,'households','minato',price);s.biz.minato.sales+=price;night+=price;}
  }
  // Food: about as much again as the drinks; the fish and the vegetables are bought in town.
  const food=Math.round(600+r()*500);pay(s,'households','minato',food);s.biz.minato.sales+=food;night+=food;pay(s,'minato','households',Math.round(food*.36));
 }
 s.year.monthly[m].minato+=night;
 // Sato Ramen at lunch: bowls, and a bottle for the ones not going back to work.
 if(dow!==3&&!storm){const bowls=draw(34*spend,r);pay(s,'households','sato',bowls*650);s.biz.sato.sales+=bowls*650;pay(s,'sato','households',Math.round(bowls*650*.33));take('sato','beer-bottle',bowls*.08,600);}
 // Umi-no-yu: the bath, and a bottle of milk after it.
 if(!storm){const bathers=draw(42*spend*(SEASON.sake[m]**.5),r);pay(s,'households','onsen',bathers*290);s.biz.onsen.sales+=bathers*290;
  for(const [id,share] of [['milk',.3],['soda',.08]])take('onsen',id,bathers*share,id==='milk'?120:100);
  for(const id of ['soap','detergent'])sell(s,'onsen',id,draw(.3,r));}
 // Afternoon: everyone checks their shelves and orders what will run out before the next delivery.
 reorder(s);
 // Evening: overheads, then the owner takes what the till holds above its float.
 for(const [id,b] of Object.entries(BUSINESSES)){
  const biz=s.biz[id];pay(s,id,'households',b.overhead.town);pay(s,id,null,b.overhead.mainland);s.year.overheadsOut+=b.overhead.mainland;
  // A till running dry is topped up from the owner's own savings: a shop never owes the ferry.
  if(biz.cash<b.float*.15){const put=Math.round(b.float*.25-biz.cash);s.year.capital=(s.year.capital||0)+put;pay(s,'households',id,put);}
  // A supplier keeps working capital for the ferry's bills; a bar or a bath can take more of the week.
  const surplus=biz.cash-b.float;if(surplus>0){const take=Math.round(surplus*(b.draw??.6));pay(s,id,'households',take);s.year.drawings+=take;}
 }
 // The rest of the household budget goes to the mainland: more when there is more to spend.
 const living=Math.round(MAINLAND_LIVING*Math.max(.2,s.households.cash/HOUSEHOLD_TARGET));pay(s,'households',null,living);s.year.living=(s.year.living||0)+living;
 s.year.monthly[m].households=s.households.cash;
 for(const [id,b] of Object.entries(s.biz))s.year.lowest[id]=Math.min(s.year.lowest[id]??Infinity,b.cash);
 // Each good's demand today, kept for a month, for the orders.
 for(const k of new Set([...Object.keys(s.usage),...Object.keys(s.today)])){(s.usage[k]??=[]).push(s.today[k]||0);if(s.usage[k].length>28)s.usage[k].shift();}
 delete s.today;
 s.day++;return events;
}

/** Pours one measure at the bar, opening a new bottle when the open one runs dry. Returns the price, or 0 when there is none. */
export function pour(s,biz,id){
 const g=GOODS[id],m=g.measure?.[biz==='minato'?'minato':biz];if(!m)return 0;
 const b=s.biz[biz];
 if(!(b.open[id]>=m.ml)){use(s,biz,id,1);if(!(b.stock[id]>0)){s.year.stockouts++;return 0;}b.stock[id]--;b.open[id]=(b.open[id]||0)+g.ml;}
 b.open[id]-=m.ml;s.year.demand++;return m.price;
}

/** Orders for tomorrow: every business tops itself up to its cover, from its supplier; Sakura from the ferry. */
function reorder(s){
 const pending=(to,id)=>s.orders.filter(o=>o.to===to&&o.good===id).reduce((t,o)=>t+o.qty,0);
 for(const [id,b] of Object.entries(BUSINESSES)){
  if(id==='sakura')continue;
  for(const good of b.goods||[]){
   const use=averageUse(s,id,good),want=Math.ceil(use*b.cover)+1,have=(s.biz[id].stock[good]|0)+pending(id,good);
   const from='sakura',priceOf=g=>ALCOHOL[g]?barTrade(g):GOODS[g].trade;
   if(have<want*.6){
    // Only what the till can pay for on delivery.
    const price=priceOf(good),owed=s.orders.filter(o=>o.to===id&&o.from!=='ferry').reduce((t,o)=>t+o.qty*priceOf(o.good),0);
    const qty=Math.min(want-have,Math.floor(Math.max(0,s.biz[id].cash-owed)/price));
    if(qty>0)s.orders.push({from,to:id,good,qty,due:s.day+1});
   }
  }
 }
 // Sakura orders for her shelves and for everything the town has asked her for, never more than
 // the till can pay for when the ferry comes in.
 let committed=s.orders.filter(o=>o.from==='ferry').reduce((t,o)=>t+o.qty*(GOODS[o.good].wholesale+GOODS[o.good].freight),0);
 for(const good of Object.keys(GOODS)){
  const want=Math.ceil(averageUse(s,'sakura',good)*BUSINESSES.sakura.cover)+2,have=(s.biz.sakura.stock[good]|0)+pending('sakura',good);
  if(have<want*.65){const g=GOODS[good],afford=Math.floor(Math.max(0,s.biz.sakura.cash-committed)/(g.wholesale+g.freight)),qty=Math.min(want-have,afford);if(qty>0){s.orders.push({from:'ferry',to:'sakura',good,qty,due:s.day+1});committed+=qty*(g.wholesale+g.freight);}}
 }
}

/** Starts a new year's books, keeping the town as it is. */
export function closeYear(s){const y=s.year;s.year=newYear();return y;}
/** Sakura's trade accounts, for the businesses not yet trading in this model. */
export const OTHER_ACCOUNTS=Object.keys(TRADE_ACCOUNTS).filter(id=>!['izakaya','ramen','onsen'].includes(id));
