import {GROCERY_ITEMS} from './catalogue.js';
import {STAMP_PER_YEN,CARD_STAMPS,CARD_GIFT} from './konbini.js';
export const FLYER_ITEM='Sakura shop flyer';
export const FLYER_PATH='./assets/papers/sakura-flyer.svg';
export const FLYER_PRODUCTS=['rice','tea','chips'].map(id=>GROCERY_ITEMS.find(item=>item.id===id));
const gift=GROCERY_ITEMS.find(item=>item.id===CARD_GIFT);
export const FLYER_PAPER=Object.freeze({type:'Flyer',title:'Sakura Shop · Thuan’s neighbourhood flyer',organisation:'Sakura Shop',author:'Thuan',source:'flyer:sakura-shop-1997',text:[
 'SAKURA SHOP — Your little island convenience store',
 '1997 neighbourhood edition · Prepared by Thuan',
 // Shut on Saturdays since Nhung became the island doctor (the owner, 22 October 2026; sakura-rota.js).
 'Open Sunday to Friday 9:00–20:30, purchases until 20:00. Closed Saturdays. Cash only. All prices include tax.',
 ...FLYER_PRODUCTS.map(item=>item.name+' · ¥'+item.cost),
 'One stamp per ¥'+STAMP_PER_YEN+' spent in a visit. Collect '+CARD_STAMPS+' stamps for a free '+gift.name.toLowerCase()+'.',
 'Find us on Main Street, beside the harbour approach. The map is a neighbourhood sketch; Main Street runs north and the harbour is south.',
 'Meet Jaga-bo, our KOGANE potato-crisp mascot. Drop in and say hello to Thuan!',
 'Free copies at Sakura’s counter and the harbour notice board. Community Hall keeps a filed copy for one year.'
].join('\n')});
/** A keepsake: rereading the flyer never produces duplicate inventory entries. */
export function collectSakuraFlyer(state){
 if(state.inventory.includes(FLYER_ITEM))return false;
 if(state.inventory.length>=100)return false;
 state.inventory.push(FLYER_ITEM);return true;
}
