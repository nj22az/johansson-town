import {PRODUCTS} from './products-data.js';
/**
 * The other flavours of each line on Sakura's shelves.
 *
 * A konbini shelf is never one pack repeated: the same maker's line stands in three or
 * four flavours side by side, each a different colour. These are presentation only --
 * the catalogue item is still the one you buy -- so they live beside the brands rather
 * than in the catalogue. Each entry is [flavour, hue turn in degrees] off the line's own
 * pack (store-advertising.js paints the variant from the original).
 *
 * They live with their line in data/studio/products.json, each with its own cell in the atlas's right half; this is
 * the view World has always read, in the order of those cells.
 */
export const FLAVOURS=Object.freeze(Object.fromEntries(PRODUCTS.filter(p=>p.cells.flavours.length)
 .sort((a,b)=>a.cells.flavours[0].cell-b.cells.flavours[0].cell).map(p=>[p.id,p.cells.flavours.map(f=>[f.name,f.hue])])));

/** How many packs (the original and its flavours) a line shows. */
export const flavourCount=id=>1+(FLAVOURS[id]?.length||0);
