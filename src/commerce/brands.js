import {PRODUCTS,PRINTS} from './products-data.js';
// Original fictional packaging for the 1997 town. Stable catalogue IDs/names
// remain the save-game and purchasing keys; brand copy is a presentation layer.
//
// Sakura's brands live with their products in data/studio/products.json (Johansson Studio edits them; the generated
// products-data.js is what World reads). This is the view the rest of World has always used.

/** Every label in the shelf atlas, products and printed matter, by its cell: [{key, cell, brand}]. */
const LABELS=[...PRODUCTS.map(p=>({key:p.cells.key||p.id,cell:p.cells.brand,brand:p.brand})),...PRINTS.map(p=>({key:p.key,cell:p.cell,brand:p.brand}))].sort((a,b)=>a.cell-b.cell);

/** The brand of each atlas key (a product's id, the bun's 'buns', or a print), in atlas order. */
export const STORE_BRANDS=Object.freeze(Object.fromEntries(LABELS.filter(l=>l.brand).map(({key,brand:b})=>[key,{name:b.name,jp:b.jp,line:b.line,paper:b.paper,ink:b.ink,accent:b.accent,symbol:b.symbol}])));

/** Every atlas key in cell order. */
export const BRAND_ATLAS_KEYS=Object.freeze(LABELS.map(l=>l.key));
/** The atlas cell of each key: its own, so adding or retiring a product never moves another's. */
export const ATLAS_CELLS=Object.freeze(Object.assign(Object.create(null),Object.fromEntries(LABELS.map(l=>[l.key,l.cell]))));
