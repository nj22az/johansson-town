import {normalizeRecipe,encodeRecipe,decodeRecipe} from './recipe.js';
import {formerNames} from '../people/renamed.js';
export const WARDROBE_KEY='johansson-town-resident-wardrobes';
export const APPEARANCE_REVISION_KEY='johansson-town-resident-appearance-revisions';
const REVISIONS={Vy:1};
function revisionMap(storage){try{return JSON.parse(storage?.getItem(APPEARANCE_REVISION_KEY)||'{}')||{};}catch{return {};}}
/** Adopt an owner-approved default once, preserving the resident's voice and
 * personality. Later deliberate wardrobe edits remain theirs. */
export function adoptResidentAppearance(name,canonical,storage=globalThis.localStorage){
 const saved=residentRecipe(name,storage),revision=REVISIONS[name];
 if(!revision)return saved||canonical;
 const versions=revisionMap(storage);if(versions[name]>=revision)return saved||canonical;
 const next=normalizeRecipe({...canonical,...(saved?{profile:saved.profile}:{})});
 try{if(saved){const entries=JSON.parse(storage?.getItem(WARDROBE_KEY)||'{}')||{};entries[name]=encodeRecipe(next);storage?.setItem(WARDROBE_KEY,JSON.stringify(entries));}versions[name]=revision;storage?.setItem(APPEARANCE_REVISION_KEY,JSON.stringify(versions));}catch{}
 return next;
}
export function residentRecipe(name,storage=globalThis.localStorage){
 // A look saved before a resident was renamed is still theirs (people/renamed.js).
 try{const entries=JSON.parse(storage?.getItem(WARDROBE_KEY)||'{}');const code=entries[name]||formerNames(name).map(old=>entries[old]).find(Boolean);
  const r=decodeRecipe(code||'');return r&&r.name!==name?{...r,name}:r;}catch{return null;}
}
export function saveResidentRecipe(name,recipe,storage=globalThis.localStorage){
 const r=normalizeRecipe({...recipe,name});let entries={};try{entries=JSON.parse(storage?.getItem(WARDROBE_KEY)||'{}')||{};}catch{}
 entries[name]=encodeRecipe(r);storage?.setItem(WARDROBE_KEY,JSON.stringify(entries));
 if(REVISIONS[name]){const versions=revisionMap(storage);versions[name]=REVISIONS[name];storage?.setItem(APPEARANCE_REVISION_KEY,JSON.stringify(versions));}
 globalThis.dispatchEvent?.(new Event('johansson-appearance-change'));return r;
}
