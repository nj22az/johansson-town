import {PRODUCTS,RETIRED} from './products-data.js';
import {DRINKABLE,EMPTY_CAN} from './vending-catalogue.js';
import {SPECIAL_BY_NAME} from './sakura-specials.js';
import {HOT_SNACKS} from './konbini.js';
import {pierFishOfItem} from '../world/okinawa/fish.js';
import {printedModels} from '../workshop/catalogue.js';
import {itemIcon} from '../ui/icons.js';

export const BAG_CATEGORIES=Object.freeze([
 ['all','All'],['food','Food'],['drinks','Drinks'],['clothes','Clothing'],['hats','Hats'],['furnishings','Furnishings'],['goods','Useful objects'],['reading','Reading'],['collectibles','Collectibles'],['recycling','Recycling'],
].map(([id,label])=>Object.freeze({id,label})));
const products=new Map([...RETIRED,...PRODUCTS].map(p=>[p.inventoryName,p]));
const hot=new Set(HOT_SNACKS.map(p=>p.name));

/** Classify actual bag items; stable saved names are never changed or deduplicated. */
export function bagCategory(item){
 if(item===EMPTY_CAN||/^(Returnable glass bottle|Metal parts|Scrap metal)$/.test(item))return 'recycling';
 if(DRINKABLE.has(item)||SPECIAL_BY_NAME[item]?.kind==='drink')return 'drinks';
 if(pierFishOfItem(item)||hot.has(item)||SPECIAL_BY_NAME[item]?.kind==='food')return 'food';
 const product=products.get(item);
 if(product){
  if(product.drink||product.purpose?.zone==='drinks')return 'drinks';
  if(['fresh','pantry','sweets','counter'].includes(product.purpose?.zone))return 'food';
  return itemIcon(item)==='page'?'reading':'goods';
 }
 if(printedModels([item]).length)return 'collectibles';
 const icon=itemIcon(item);
 if(icon==='page'||/recipe card|flyer|book|magazine/i.test(item))return 'reading';
 if(icon==='food'||icon==='fish')return 'food';
 if(icon==='soap'||item==='Ice'||/medicine|battery|batteries|torch/i.test(item))return 'goods';
 // Reserved categories work for carried clothing/furnishings without manufacturing ownership in Studio's creative catalogue.
 if(/\bhat\b|\bcap\b/i.test(item))return 'hats';
 if(/shirt|trousers|skirt|dress|jacket/i.test(item))return 'clothes';
 if(/chair|table|cushion|furnishing/i.test(item))return 'furnishings';
 return 'collectibles';
}

export function bagEntries(inventory=[],{category='all',query=''}={}){
 const counts=new Map();for(const item of inventory)if(typeof item==='string')counts.set(item,(counts.get(item)||0)+1);
 const needle=query.trim().toLocaleLowerCase();
 return [...counts].map(([item,count])=>({item,count,category:bagCategory(item)})).filter(e=>(category==='all'||category===e.category)&&e.item.toLocaleLowerCase().includes(needle));
}
