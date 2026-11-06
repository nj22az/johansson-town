import {PRODUCTS} from './products-data.js';
/**
 * Prices are late 1997's, tax included -- consumption tax went to five per cent that
 * April, which is when a can of cola became ¥120 and a rice ball stopped being ¥100.
 *
 * Sakura's catalogue: every line a shopper takes off a shelf, in the order of the shelf price tags. The products live
 * in data/studio/products.json; this is the view World has always read. `name` is the name that goes in the bag and
 * stays the same for saved games; the counter's bun has no shelf price tag and is not in the catalogue.
 */
const item=p=>({id:p.id,jp:p.jp,name:p.inventoryName,cost:p.price,color:parseInt(p.bagColour.slice(1),16),text:p.text,brand:p.brand.name,brandJp:p.brand.jp});

export const GROCERY_ITEMS=Object.freeze(PRODUCTS.filter(p=>p.cells.price!=null).sort((a,b)=>a.cells.price-b.cells.price).map(item));

/** The first eight lines, the ones in Thuan's mail-order book. */
export const STORE_ITEMS=Object.freeze(GROCERY_ITEMS.filter(i=>PRODUCTS.find(p=>p.id===i.id).mailOrder));
