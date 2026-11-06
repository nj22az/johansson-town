import {CATALOG} from './catalog-data.js';

/**
 * The catalogue's cards without its models: what a page needs to know about an asset before it fetches one. Kept apart
 * from catalog.js (which brings the GLB loader and three.js scene code) so the game's boot can learn where the hat
 * models are (src/catalog/hat-models.js) without pulling the loader into its first chunk.
 */
/** The ids in the catalogue. */
export const catalogIds=()=>Object.keys(CATALOG);
/** An asset's card (catalog-data.js). */
export function catalogCard(id){
 const card=Object.hasOwn(CATALOG,id)?CATALOG[id]:null;
 if(!card)throw new Error(`No ${JSON.stringify(id)} in World's catalogue (assets/catalog/index.json): ${catalogIds().join(', ')}`);
 return card;
}
