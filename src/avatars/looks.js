import {DEFAULT_RECIPE,normalizeRecipe,PARTS,AGES,PATTERNS,BOTTOM_PATTERNS} from './recipe.js';

/**
 * Looks: what Johansson Studio may change about a resident, as a short list of fields laid over the recipe World
 * already draws them with (cast.js recipeFor). An empty overlay changes nothing.
 *
 * A field is named by its path in a normalised recipe, e.g. "outfit.hat" or "hair.colour". The list is worked out
 * from the recipe itself, so a field the maker gains is a field Studio can set. Left out on purpose:
 * - v and name: a look never renames anybody;
 * - profile: the gait and the voice are who somebody is, not how they look (the creator's decision 1, proposed);
 * - facial.style: it is worked out from the moustache and the beard (recipe.js facialHair).
 */
const LEFT_OUT=new Set(['v','name','profile','facial.style']);
const flatten=(value,prefix='')=>Object.entries(value).flatMap(([key,v])=>{const path=prefix?prefix+'.'+key:key;
 return v&&typeof v==='object'&&!Array.isArray(v)?flatten(v,path):[[path,v]];});
const DEFAULTS=flatten(normalizeRecipe(DEFAULT_RECIPE)).filter(([path])=>!LEFT_OUT.has(path)&&!LEFT_OUT.has(path.split('.')[0]));
export const LOOK_PATHS=Object.freeze(DEFAULTS.map(([path])=>path));

/** The words a field may take, for every field that is a word. Colours are #rrggbb; numbers run from 0 to 1. */
const WORDS={age:AGES,'body.proportion':['classic','rounded','studio'],'outfit.skirtCut':['classic','panel'],'body.silhouette':PARTS.silhouette,'head.form':PARTS.head,
 'hair.style':PARTS.hair,'eyes.style':PARTS.eyes,'brows.style':PARTS.brows,'nose.style':PARTS.nose,'mouth.style':PARTS.mouth,
 'glasses.style':PARTS.glasses,'facial.moustache':PARTS.moustache,'facial.beard':PARTS.beard,'facial.paint':PARTS.paint,'outfit.top':PARTS.top,
 'outfit.pattern':PATTERNS,'outfit.bottom':PARTS.bottom,'outfit.bottomPattern':BOTTOM_PATTERNS,
 'outfit.footwear':PARTS.footwear,'outfit.hat':PARTS.hat,'outfit.belt':PARTS.belt,'accessories.earrings':PARTS.earrings,'accessories.neckwear':PARTS.neckwear,
 'swim.bath':['towel','swimwear']};
const COLOUR=/^#[0-9a-f]{6}$/;
/** Numbers that are not 0 to 1: whole numbers in their own range (a shirt number, 0 for none). */
const RANGES={'outfit.number':{min:0,max:99,whole:true}};
/** What kind of value each field holds: {kind:'word',words}, {kind:'colour'}, {kind:'number',min:0,max:1} or {kind:'yes/no'}. */
export const LOOK_FIELDS=Object.freeze(Object.fromEntries(DEFAULTS.map(([path,value])=>[path,Object.freeze(
 typeof value==='boolean'?{kind:'yes/no'}:typeof value==='number'?{kind:'number',min:0,max:1,...RANGES[path]}:
 WORDS[path]?{kind:'word',words:Object.freeze([...WORDS[path]])}:COLOUR.test(value)?{kind:'colour'}:{kind:'unknown'})])));

/** The value at a path ("outfit.hat") in a recipe. */
export function readPath(recipe,path){let v=recipe;for(const key of path.split('.'))v=v==null?undefined:v[key];return v;}

/**
 * A recipe with a look's fields laid over it. Only LOOK_PATHS are read from `set`; anything else in it is ignored, so a
 * look can never change a name or a voice. The caller normalises the result (recipeFor does).
 */
export function applyLook(recipe,set={}){
 const out=structuredClone(recipe);
 for(const path of LOOK_PATHS){
  if(!set||!Object.hasOwn(set,path))continue;
  const keys=path.split('.'),last=keys.pop();let at=out;
  for(const key of keys){if(!at[key]||typeof at[key]!=='object')at[key]={};at=at[key];}
  at[last]=set[path];
 }
 return out;
}

/** The fields where two recipes differ, as [{path, from, to}], in LOOK_PATHS order. */
export function lookDiff(before,after){
 return LOOK_PATHS.flatMap(path=>{const from=readPath(before,path),to=readPath(after,path);return Object.is(from,to)?[]:[{path,from,to}];});
}
