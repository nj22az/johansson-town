import {PRODUCTS,RETIRED} from './products-data.js';
import {LAGER_ALCOHOL,wantsAnother} from '../people/drunk.js';
// What the town's drinks machines sell: a 1997 Okinawan line-up under the town's own brands. inventoryName is what goes
// in the bag and stays stable for saved games. `container` decides what is left in your pocket when it is finished;
// `hot` drinks sit behind a red button. Every can says who presses it (`for`, the cast's names, and `who`), why they
// want it (`why`) and why it stands in the column it does (`placed`, vending.js VENDING_COLUMNS).
//
// Beer since 27 November 2026 (the owner: "replace the generic teas and coffe we need the vending machine to sell beer
// and you need to use Disney art style and draw them in Python"): the three beers below took the places of Harbour Tea,
// Dockside and Sanpin (RETIRED_VENDING keeps those drinkable). Their cans' prints are drawn by tools/draw-vending-cans.py
// (`art`: the wrap-around print, the front at its middle), each with a mascot of its own; the soft drinks keep the prints
// vending.js paints. The brewer is a Johansson company (Johansson is this universe's Acme): Johansson Brewery, Nago.
//
// `abv` is the can's strength (%); `alcohol` what it adds on the town's one drunkenness scale (people/drunk.js): a 350 ml
// can of lager is LAGER_ALCOHOL, as Sakura's Umineko and Minato's can are, and the rest in proportion to their beer.
const beerUnits=(ml,abv)=>Math.round(LAGER_ALCOHOL*(ml/350)*(abv/5)*100)/100;
export const VENDING_PRODUCTS=Object.freeze([
 // ---- the beer, the top row
 {id:'kame-lager',brand:'KAME',subtitle:'Island lager',mark:'亀',color:'#1f8a86',price:220,inventoryName:'Kame lager',container:'can',size:350,abv:5,
  art:{file:'graphics/vending/kame-lager.webp',width:1024,height:518,mascot:'Kame, a sea turtle sat back on the tide line at sunset, a towel round his neck, one flipper up: "otsukare", the day done.'},
  for:['Tetsuo','Erik','Johansson'],
  who:'Tetsuo and Erik on the bench outside Sakura of an evening; Johansson on the walk home; anybody of age on a Saturday, when Sakura is shut',
  why:'The everyday can, at Sakura’s own counter price for a can of lager (¥220), so the machine is never the dearer way to buy it; and on Saturdays, when Sakura is shut (土曜定休), it is the only can in town.',
  placed:'The top row’s first three columns, at a grown-up’s eye: the can most people want is the first one they see, and the beer stands up where the children’s own drinks are not (they are in the bottom row, at their height).'},
 {id:'jugon-draft',brand:'JUGON',subtitle:'Big draft',mark:'生',color:'#1c2b55',price:280,inventoryName:'Jugon big draft',container:'can',size:500,abv:5,
  art:{file:'graphics/vending/jugon-draft.webp',width:1024,height:714,mascot:'Jugon, a dugong leaping clean out of the evening sea, laughing, stretched long from fluke to snout.'},
  for:['Ryo','Ren','Chin','Jun'],
  who:'the Minato Maru’s crew coming ashore off the last boat at 22:20: Ryo, Ren, Chin and Jun',
  why:'A long day wants a long can: the crew are off the last sailing at 22:20 with forty minutes before the machines’ beer stops at eleven, and the 500 ml long can at ¥280 is the most beer their coins buy.',
  placed:'The top row’s middle three columns: a column holds 18 long cans to 25 of the 350 ml, so the long can takes three to last the late rush off the boat.'},
 {id:'tako-black',brand:'TAKO',subtitle:'Black lager',mark:'黒',color:'#1f1714',price:240,inventoryName:'Tako black',container:'can',size:350,abv:5.5,
  art:{file:'graphics/vending/tako-black.webp',width:1024,height:518,mascot:'Tako, an octopus in a skipper’s cap, squashed down wide on the sea floor, winking, one arm curled up to tell a tale.'},
  for:['Sverker','Erik','Johansson'],
  who:'the older men who sip a beer slowly and want one that tastes of something: Sverker, Erik, Johansson',
  why:'A dark lager for a long talk on the quay: ¥20 dearer than the everyday can for its roasted malt, and slower to sell.',
  placed:'The top row’s last two columns: it sells slower than the lager, so two columns are enough, at the end of the beer by the soft drinks.'},
 // ---- the soft drinks and the coffee, the bottom row
 // J-Coffee: the island's own black coffee in a 350 ml can (world/halloween-props.js buildJCoffeeCan draws it). For the
 // men on the quay before a shift and after one (Fujita, the harbour crew, Officer Mori on a night watch): strong and
 // unsweetened, a big can for the price of a small one, so it is the one they press; ¥120 like the rest.
 {id:'j-coffee',brand:'J-COFFEE',subtitle:'Black coffee',mark:'J',color:'#141414',price:120,inventoryName:'J-Coffee',container:'can',size:350,
  for:['Mr Fujita','Officer Mori','Kōji'],
  who:'the quay crew, early and late; Fujita; Officer Mori on watch',why:'Strong and unsweetened, and a full 350 ml for ¥120: the working man’s can at the port.',
  placed:'The bottom row’s first two columns, at hand height under the coin slot, where a working hand reaches without looking; it sells out first at night, when the beer has stopped.'},
 {id:'shikuwasa',brand:'SHIKUWASA',subtitle:'Citrus soda',mark:'柑',color:'#7bb342',price:120,inventoryName:'Shikuwasa soda',container:'can',size:350,
  for:['Vy','Riku','Miss Higa'],
  who:'Vy and Riku after school; Miss Higa on a hot afternoon at the bath',why:'The island’s own sharp little citrus as a cold soda: the children’s can, and the cheapest cold thing on the street.',
  placed:'The bottom row, at a child’s hand and eye: the drinks the children buy are the ones they can see and reach, under the beer.'},
 {id:'ryukyu-cola',brand:'RYUKYU COLA',subtitle:'Cola',mark:'C',color:'#b3262e',price:120,inventoryName:'Ryukyu cola',container:'can',size:350,
  for:['Riku','Ren','Kai'],
  who:'Riku, and the young deck hand Ren on his break; Kai waiting for the boat',why:'Sugar and fizz, cold: for whoever is not drinking beer and wants something sweeter than coffee.',
  placed:'The bottom row, beside the shikuwasa: the sweet cold drinks together, at the children’s height.'},
 {id:'corn-soup',brand:'CORN SOUP',subtitle:'Hot · creamy',mark:'温',color:'#e8b030',price:120,inventoryName:'Hot corn soup',container:'can',hot:true,size:190,
  for:['Christina','Ms Ganaha','Riku'],
  who:'Christina on a cold morning; Ms Ganaha before the ticket window; Riku on a wet day',why:'Hot and filling, the one warm thing a machine sells on a winter morning or a wet evening; the corn at the bottom of the can is the prize.',
  placed:'The right end of the bottom row, where a machine keeps its warm columns behind red buttons.'},
].map(p=>Object.freeze({...p,...(p.abv?{alcohol:beerUnits(p.size,p.abv)}:{}),label:p.buttonLabel||`${p.brand[0]+p.brand.slice(1).toLowerCase()} · ${p.subtitle}${p.hot?' (hot)':''} · ¥${p.price}`})));

/**
 * The machines' drinks that are no longer sold (the owner, 27 November 2026: "replace the generic teas and coffe"), kept
 * so that a can bought before still drinks, leaves its empty and is printed as itself in his hand: their names are in
 * saved bags (Green tea and Canned coffee were the machines' first two). As products-data.js RETIRED does for Sakura's.
 */
export const RETIRED_VENDING=Object.freeze([
 {id:'harbour-tea',brand:'HARBOUR TEA',subtitle:'Green tea',mark:'茶',color:'#366451',price:120,inventoryName:'Green tea',container:'can',size:350},
 {id:'dockside-coffee',brand:'DOCKSIDE',subtitle:'Canned coffee',mark:'珈',color:'#784632',price:120,inventoryName:'Canned coffee',container:'can',size:190},
 {id:'sanpin',brand:'SANPIN',subtitle:'Jasmine tea',mark:'花',color:'#c9a33a',price:120,inventoryName:'Sanpin jasmine tea',container:'can',size:350},
].map(p=>Object.freeze({...p,retired:'2026-11-27',why:'Replaced by beer at the owner’s word: the generic teas and coffee gave way to Kame, Jugon and Tako.'})));
/** Every machine can there has been, sold or retired: for the bag, the hand and an old save. */
export const ALL_VENDING=Object.freeze([...VENDING_PRODUCTS,...RETIRED_VENDING]);
/** A machine's can by its name in the bag (sold or retired), or null. */
export const vendingProductOf=name=>ALL_VENDING.find(p=>p.inventoryName===name)||null;

export const VENDING_AD=Object.freeze({brand:'MINATO DRINKS',tagline:'A break at the port',background:'#244b4a',foreground:'#f4e8cb'});

/**
 * Who puts the beer in the machines (merchandising.js: "Sakura sells all the alcohol" since Higa Liquor closed). Japan has
 * licensed nobody to sell alcohol from machines alone since 1973 (National Tax Agency, 酒類の概況: 自動販売機のみの酒類
 * 小売業免許は付与しない, 昭和48年～): a beer machine is a licensed shop's. Sakura holds the island's only licence, so the
 * beer in Minato Drinks' machines is Sakura's: Sakura Trading buys the cans in with the rest of its beer and Minato
 * Drinks' van loads them at the depot in the Quay Warehouse on its morning round; Sakura takes the beer's takings, the
 * bottler the soft drinks'. The machine's sticker names Sakura as the seller (販売管理者).
 */
export const VENDING_BEER_STOCK=Object.freeze({supplier:'sakura',seller:'Sakura Shōten',licence:'酒類小売業免許 (retail liquor licence)',
 restock:'Every morning with the soft drinks: the van loads the beer at Sakura Trading’s depot in the Quay Warehouse before its round (VENDING_MACHINE.operator).',
 why:'No licence to sell alcohol from machines alone has been granted in Japan since 1973, so a beer machine is a licensed shop’s; Sakura holds the island’s only one since Higa Liquor closed, and sells and supplies all its alcohol.'});

/** Japan's drinking age, under the Minors' Drinking Prohibition Act of 1922 (未成年者飲酒禁止法): twenty. */
export const DRINKING_AGE=20;

/**
 * The machines' beer stops at night (the rule checked on 27 November 2026): since 1977 the National Tax Agency has told
 * the trade to sell no alcohol from vending machines from 23:00 to 05:00 (自動販売機による酒類の深夜販売（23時00分～翌日
 * 5時00分まで）の自粛指導, 昭和52年～), and since 1989 every alcohol machine carries its stop hours (販売停止時間) with the
 * warning to minors; the trade's own association resolved in May 1995 to take the outdoor ones away by May 2000, so in
 * 1997 they still stand. Through those hours the beer buttons are dark (販売中止) and the soft drinks still sell. The rule
 * is every alcohol machine's: the Port Terminal's, indoors, keeps it too, and also stops whenever its hall is shut.
 */
export const VENDING_BEER_HOURS=Object.freeze({stop:23*60,start:5*60,
 rule:'No alcohol from a vending machine from 23:00 to 05:00; the beer buttons read 販売中止 and the soft drinks still sell.',
 sources:Object.freeze(['National Tax Agency, 酒類の概況 (the alcohol situation), the measures for vending machines: https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2009/pdf/11.pdf',
  'Brewers Association of Japan, “The Law Prohibiting Minors from Drinking”: https://brewers.or.jp/english/99-alcohl.html'])});
const minute=m=>((Math.floor(m)%1440)+1440)%1440;
/** Whether a machine's beer is on sale at this town minute: not 23:00–05:00; indoors also only while its room is open. */
export function beerOnSale(minutes,{open=true}={}){const m=minute(minutes);return !!open&&m>=VENDING_BEER_HOURS.start&&m<VENDING_BEER_HOURS.stop;}

/**
 * Why a machine will not sell this can now, or null if it will: beer at night (販売中止), and beer to anybody under twenty.
 * `age` null is the player as Johansson (a grown man); a resident with no recorded age never gets a beer (residentVendingChoice).
 */
export function vendingRefusal(product,{minutes=720,open=true,age=null}={}){
 if(!product?.alcohol)return null;
 if(!beerOnSale(minutes,{open}))return '販売中止. The beer buttons are dark from eleven at night to five in the morning; the soft drinks still sell.';
 if(age!==null&&!(age>=DRINKING_AGE))return 'お酒は20歳になってから. The beer is for grown-ups.';
 return null;
}

/**
 * What a resident presses at a drinks machine (people/town-activities.js): a beer only for a grown-up (DRINKING_AGE, by
 * their recorded age; none recorded, none) in their own evening, while the machine sells it and they have room for it
 * (drunk.js wantsAnother), and then the beer that names them (`for`); otherwise their own soft drink or coffee, and if
 * none names them, the J-Coffee for a grown-up and the shikuwasa for a child. Never random.
 */
export function residentVendingChoice({name,age=null,place='stroll',minutes=720,open=true,tipsy=0}={}){
 const adult=Number.isFinite(age)&&age>=DRINKING_AGE;
 if(adult&&place==='evening'&&beerOnSale(minutes,{open})){
  const beer=VENDING_PRODUCTS.find(p=>p.alcohol&&p.for.includes(name));
  if(beer&&wantsAnother(tipsy,beer.alcohol))return beer;
 }
 const own=VENDING_PRODUCTS.find(p=>!p.alcohol&&!p.hot&&p.for.includes(name));
 if(own&&(adult||own.id!=='j-coffee'))return own;
 return VENDING_PRODUCTS.find(p=>p.id===(adult?'j-coffee':'shikuwasa'));
}
/** Who would plausibly press this can (the storyteller's and the tests' view, as merchandising.js buyersOf). */
export const vendingBuyersOf=id=>VENDING_PRODUCTS.find(p=>p.id===id)?.for||[];
/** The machine cans that name this resident. */
export const vendingLinesFor=name=>VENDING_PRODUCTS.filter(p=>p.for.includes(name)).map(p=>p.id);

/**
 * Everything you can drink from your bag, and what it leaves you holding: the machines' cans (and those retired since),
 * and Sakura's products that are drinks of their own (`drink` in data/studio/products.json: Sakura's beer), and the drinks
 * of lines retired since, so a can bought before still drinks.
 */
const SHOP_DRINKS=[...PRODUCTS,...RETIRED].filter(p=>p.drink);
const shopDrink=name=>SHOP_DRINKS.find(p=>p.inventoryName===name);
export const EMPTY_CAN='Empty can';
export const DRINKABLE=Object.freeze(new Set([...ALL_VENDING.map(p=>p.inventoryName),...SHOP_DRINKS.map(p=>p.inventoryName)]));
export const emptyFor=name=>{const p=vendingProductOf(name)||shopDrink(name)?.drink;return p?.container==='bottle'?'Returnable glass bottle':EMPTY_CAN;};
/** The can's colour in your hand. */
export const canColour=name=>{const p=vendingProductOf(name),own=shopDrink(name);return p?parseInt(p.color.slice(1),16):own?parseInt(own.drink.handColour.slice(1),16):0x91734e;};
/** What a drink from the bag adds on the drunkenness scale (people/drunk.js): a machine's beer its own, Sakura's lager
 *  LAGER_ALCOHOL, anything else nothing. game.js counts a machine beer as it counts Sakura's can. */
export const alcoholOf=name=>{const p=vendingProductOf(name);if(p)return p.alcohol||0;return shopDrink(name)?.drink?.alcohol?LAGER_ALCOHOL:0;};
/** What Thuan gives back for each empty can in the recycling box by the door. */
export const CAN_REFUND=10;
