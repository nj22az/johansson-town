import {readPlayers,DEFAULT_PLAYER} from './save.js';
import {restoreHomeDecor} from './progression/home-decor.js';

/**
 * What Johansson Studio hands to Johansson World.
 *
 * All customisation is done in Studio (avatar-creator/, the creator's rule of 2026-10-11:
 * "I want all customisation be in Johansson Studio"): how the islander looks, what the
 * residents wear, which outfit Thuan has on, and how the mayor's home is decorated and
 * furnished. World only shows the result. Studio and World are on the same site, so they
 * share the browser's storage. Studio writes these keys and World reads them when it starts,
 * and again whenever Studio changes them while World is open (the `storage` event).
 *
 *   the islander's look     avatars/actors.js playerRecipeKey, one for each saved game
 *   the residents' looks    avatars/wardrobe.js WARDROBE_KEY, one for the whole island
 *   home and Thuan's outfit STUDIO_KEY below, one for each saved game
 *
 * World copies the home and Thuan's outfit into its save as well (state.homeDecor and
 * state.thuanOutfit), so an exported save file carries them.
 */
export const STUDIO_KEY='johansson-town-studio';

/** Thuan's outfits: her own clothes (the look made for her in Studio) and the two sets she owns. */
export const THUAN_OUTFITS=Object.freeze([
 Object.freeze({id:'clothes',name:'Her own clothes',text:'Her everyday look, as it is made in Edit character.'}),
 Object.freeze({id:'sailor',name:'The harbour academy sailor set',text:'Navy with long sleeves, a red necktie, a pleated skirt and ankle boots. She wears it for evening classes or a day out.'}),
 Object.freeze({id:'nozomi',name:'The shopping-lane outfit',text:'What she wears for an afternoon on Rainflower Lane.'}),
]);

/** The key for the active saved game: the first player keeps the plain key, as with the islander's look. */
export function studioKey(storage=globalThis.localStorage){
 const id=readPlayers(storage).active;
 return id===DEFAULT_PLAYER.id?STUDIO_KEY:STUDIO_KEY+'@'+id;
}

/** Only what World understands: a home (cleaned the way World cleans its save) and a known outfit. */
export function cleanStudioChoices(raw){
 const out={};if(!raw||typeof raw!=='object')return out;
 if(raw.home&&typeof raw.home==='object')out.home=restoreHomeDecor(raw.home);
 if(THUAN_OUTFITS.some(o=>o.id===raw.thuanOutfit))out.thuanOutfit=raw.thuanOutfit;
 return out;
}

export function readStudioChoices(storage=globalThis.localStorage){
 try{return cleanStudioChoices(JSON.parse(storage?.getItem(studioKey(storage))));}catch{return {};}
}

/** Studio's side: merges a change into what is stored for the active saved game. Returns the stored choices, or null if storage refused. */
export function writeStudioChoices(change,storage=globalThis.localStorage){
 const next={...readStudioChoices(storage),...cleanStudioChoices(change)};
 try{storage.setItem(studioKey(storage),JSON.stringify(next));return next;}catch{return null;}
}

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** World's side: puts Studio's choices into the game state. Returns what changed, so only that is redrawn. */
export function applyStudioChoices(state,choices){
 const changed={home:false,thuan:false};
 if(choices?.home){const home=restoreHomeDecor(choices.home);if(!same(home,restoreHomeDecor(state.homeDecor))){state.homeDecor=home;changed.home=true;}}
 if(choices?.thuanOutfit&&choices.thuanOutfit!==state.thuanOutfit){state.thuanOutfit=choices.thuanOutfit;changed.thuan=true;}
 return changed;
}
