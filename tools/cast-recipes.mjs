// Every active resident's look and World height, for the studio's Pixar clones (jojo 3d/cast/clone_recipe.py): the owner,
// 28 October 2026, "everyone should eventually be Pixar class so you can reuse the bodies of Thuan and Thao and then we need
// to make faces as you reuse Johansson". The retired (people/roster.js `gone`) are left out.
//   node tools/cast-recipes.mjs ../../jojo/3d/cast/clones/recipes.json
import {writeFileSync} from 'node:fs';
import {installDOM} from '../tests/fixtures.mjs';
installDOM();
const {CAST_RECIPES,NEIGHBOUR_RECIPES,recipeFor}=await import('../src/avatars/cast.js');
const {buildAvatar}=await import('../src/avatars/build.js');
const roster=await import('../src/people/roster.js');
const {PIXAR_BODIES}=await import('../src/avatars/pixar.js');
const retired=new Set((roster.RETIRED||[]).map(r=>r.name));
const out={};
for(const name of Object.keys({...CAST_RECIPES,...(NEIGHBOUR_RECIPES||{})})){
 if(retired.has(name))continue;
 const recipe=recipeFor(name),a=buildAvatar(recipe,{shadows:false});
 out[name]={height:+a.measure.H.toFixed(4),pixar:!!PIXAR_BODIES[name],recipe};a.dispose?.();
}
writeFileSync(process.argv[2],JSON.stringify(out,null,1)+'\n');
console.log(Object.keys(out).length,'residents;',Object.values(out).filter(r=>!r.pixar).length,'still cartoon');
