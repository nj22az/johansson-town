import {SHOP_STOCK} from '../commerce/shop-stock.js';

/**
 * Everything that is bought and sold in town, with its price at every step, in 1997 yen
 * (consumption tax at five per cent since April, included in every retail price).
 *
 * Nothing is made on the island except fish and the bath's hot water: goods come over on the
 * ferry from the main island's wholesalers. The ladder, with 1997's real margins:
 *
 *   wholesale   what the mainland wholesaler charges Sakura
 *   freight     the ferry's charge to bring one unit over (about four per cent of its value,
 *               more for heavy glass)
 *   trade       Sakura's price to the town's businesses on account: landed cost plus a fifth,
 *               or plus eight per cent on alcohol, the floor under the bars' price (town-economy.js barTrade)
 *   retail      the shelf price — Sakura's, the drink over its counter since Higa Liquor closed
 *   measure     how a bar sells it: `ml` per measure and `price` per measure (Minato)
 *
 * A konbini's gross margin is about thirty per cent, a liquor store's about a quarter (the
 * licence keeps it there), and a bar sells a bottle by the glass at three to four times what
 * it paid. Units are what moves: a can, a bottle, a keg.
 */
const landed=g=>g.wholesale+g.freight;
const tradeOf=(g,mark=1.2)=>Math.round(landed(g)*mark/5)*5;

/** Alcohol: Sakura brings it over and sells it to the town over its counter and to the bars on its round (Higa Liquor's trade until the shop closed, 22 October 2026). */
export const ALCOHOL=Object.freeze({
 'beer-can':{name:'Umineko lager, 350 ml can',unit:'can',ml:350,wholesale:168,freight:6,retail:220},
 'beer-bottle':{name:'Umineko lager, 633 ml bottle',unit:'bottle',ml:633,wholesale:250,freight:10,retail:330,measure:{minato:{ml:633,price:600,name:'large bottle'}}},
 'beer-keg':{name:'Umineko draught, 10 l keg',unit:'keg',ml:10000,wholesale:4200,freight:250,retail:null,measure:{minato:{ml:350,price:450,name:'mug of draught'}}},
 'awamori-720':{name:'Awamori, 720 ml, 30%',unit:'bottle',ml:720,wholesale:980,freight:40,retail:1600,measure:{minato:{ml:60,price:450,name:'awamori on the rocks'}}},
 'awamori-1800':{name:'Awamori, 1.8 l isshōbin',unit:'bottle',ml:1800,wholesale:2050,freight:90,retail:3300,measure:{minato:{ml:1800,price:5000,name:'bottle for the keep'}}},
 'sake-1800':{name:'Sake, 1.8 l',unit:'bottle',ml:1800,wholesale:1450,freight:90,retail:2200,measure:{minato:{ml:180,price:600,name:'flask of warm sake'}}},
 'shochu-1800':{name:'Shōchū, 1.8 l, 25%',unit:'bottle',ml:1800,wholesale:1300,freight:90,retail:1980,measure:{minato:{ml:60,price:400,name:'shōchū highball'}}},
});
/** Soft drinks the bar pours from big bottles bought from Sakura. */
export const BAR_SOFT=Object.freeze({
 'oolong-2000':{name:'Oolong tea, 2 l',unit:'bottle',ml:2000,wholesale:250,freight:12,retail:330,measure:{minato:{ml:250,price:300,name:'oolong tea'}}},
});

// Alcohol goes through Sakura as a wholesaler on a thin cut; the licensed shop keeps the margin.
for(const g of Object.values(ALCOHOL))g.trade=tradeOf(g,1.08);
for(const g of Object.values(BAR_SOFT))g.trade=tradeOf(g);

/** Sakura's own lines: the shelf price is the catalogue's; a konbini buys at about seventy per cent of it. */
export const GROCERIES=Object.freeze(Object.fromEntries(SHOP_STOCK.map(item=>{
 const wholesale=Math.round(item.cost*.7),freight=Math.max(1,Math.round(wholesale*.04)),g={name:item.name,unit:'unit',wholesale,freight,retail:item.cost,shop:item.id};
 g.trade=tradeOf(g);return [item.id,g];
})));

export const GOODS=Object.freeze({...GROCERIES,...ALCOHOL,...BAR_SOFT});
export const goodOf=id=>GOODS[id]||null;
/** What one measure costs the bar, and what it earns. */
export function measureMargin(id,bar='minato',paid=null){
 const g=GOODS[id],m=g?.measure?.[bar];if(!m)return null;
 const per=Math.floor(g.ml/m.ml),cost=(paid??g.retail??g.trade)/per;
 return {measures:per,price:m.price,cost:Math.round(cost),margin:m.price-Math.round(cost),bottle:per*m.price};
}
