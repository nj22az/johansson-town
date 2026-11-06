/**
 * The outfits that residents' own looks and the engine are built from. They change portraits, so this file is in the
 * portrait hash (tools/render-resident-guide.mjs sourceFiles); the wardrobe sets in outfits.js, which change with every
 * new set, are not. outfits.js re-exports everything here.
 */

/** Thuan’s own long-sleeved island sailor set. */
export const THUAN_SAILOR_OUTFIT=Object.freeze({top:'sailorlong',topColour:'#283760',bottom:'pleatedskirt',bottomColour:'#283760',footwear:'boots',shoes:'#30292b',accent:'#c64951',pattern:'none',hat:'none'});
/** Photo-inspired clothing, shared independently of the character's appearance. */
export const HARBOUR_POLO_OUTFIT=Object.freeze({top:'contrastpolo',topColour:'#202d50',accent:'#f2eee5',bottom:'pleatedskirt',bottomColour:'#d9cfba',footwear:'shoes',shoes:'#eee9df',pattern:'none',hat:'none'});

/**
 * After the bath (build.js wear('afterbath')): what a town bath's regulars wore in its shared lobby in the 1980s and 90s,
 * cooling off with a coffee milk, in the massage chair or in front of the night game. Grown-ups only: children keep their
 * clothes, as they do behind the noren (wearsBathTowel). Bare feet: the shoes are in the getabako at the genkan.
 * - men: a white cotton running vest (ランニングシャツ), long light-beige cotton drawers to below the knee (ステテコ), and
 *   one of the bath's tenugui round the neck, both ends on the chest (Umi-no-yu sells them at the bandai, printed with
 *   the navy band its towels carry, so they come back);
 * - women: her own house dress (アッパッパ), loose, short-sleeved, to the knee, in a pastel of what she likes to wear
 *   (houseDressColour), and the bath's towel wound into a turban over the hair while it dries.
 */
export const AFTERBATH=Object.freeze({
 men:Object.freeze({top:'running',topColour:'#f7f4ec',bottom:'suteteko',bottomColour:'#e4d8bd',footwear:'barefoot',hat:'none',pattern:'none'}),
 women:Object.freeze({top:'housedress',bottom:'housedress',footwear:'barefoot',hat:'none',pattern:'none'}),
});
const mixHex=(a,b,f)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-f)+parseInt(b.slice(i,i+2),16)*f).toString(16).padStart(2,'0')).join('');
/** Near-white tops (a white tee) give no colour of her own: then the accent she wears with it does. */
const pale=hex=>[1,3,5].every(i=>parseInt(hex.slice(i,i+2),16)>215);
/**
 * Her house dress: a pastel of the top she usually wears (Thuan's yellow, Nhung's sage, Miss Higa's green), or of its
 * accent when that top is white (Thao's tee, with her blue shorts and ties), washed out as a much-laundered cotton is.
 */
export function houseDressColour(recipe){
 const o=recipe.outfit,base=pale(o.topColour)?o.accent:o.topColour,cloth='#fbf8f1';
 // At least 55% of the way to the cloth's white, further for a dark top (Thuan's navy), so it always reads as a pastel.
 const mean=hex=>[1,3,5].reduce((sum,i)=>sum+parseInt(hex.slice(i,i+2),16),0)/3;
 const wash=Math.min(.85,Math.max(.55,(190-mean(base))/(mean(cloth)-mean(base))));
 return mixHex(base,cloth,wash);
}
