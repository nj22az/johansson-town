/** Original image-generated food cutouts, shared by the bag, displays and serving props. */
export const FOOD_ART=Object.freeze(Object.fromEntries(['icecream','ramen','onigiri','curry','gyoza'].map(id=>[id,`./assets/food/island-${id}.webp`])));
export function foodArtForItem(name){
 const n=String(name).toLowerCase();
 if(/ice cream/.test(n))return FOOD_ART.icecream;
 if(/rice ball|onigiri/.test(n))return FOOD_ART.onigiri;
 if(/ramen/.test(n))return FOOD_ART.ramen;
 if(/gyoza|dumpling/.test(n))return FOOD_ART.gyoza;
 if(/curry/.test(n)&&!/pack|box|pouch/.test(n))return FOOD_ART.curry;
 return null;
}
