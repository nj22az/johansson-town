import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {decoratorEnabled,LIVE_HOSTS} from '../src/features.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
async function sources(dir){
 const out=[];
 for(const entry of await readdir(new URL('../'+dir,import.meta.url),{withFileTypes:true})){
  const path=dir+'/'+entry.name;
  if(entry.isDirectory())out.push(...await sources(path));else if(entry.name.endsWith('.js'))out.push([path,await read(path)]);
 }
 return out;
}

test('the ?build town builder is off on the live site and on everywhere else',()=>{
 for(const hostname of LIVE_HOSTS)assert.equal(decoratorEnabled({hostname}),false,hostname);
 assert.equal(decoratorEnabled({hostname:'NJ22AZ.GITHUB.IO'}),false);
 for(const hostname of ['localhost','127.0.0.1',''])assert.equal(decoratorEnabled({hostname}),true,hostname||'(file)');
 assert.equal(decoratorEnabled(undefined),true,'tests and tools without a location');
});

// The creator, 2026-10-11: "I want all customisation be in Johansson Studio". World shows what Studio made
// (src/studio-handoff.js) and offers no way to change it.
test('World has no maker, wardrobes, outfits, decorating or building: those are made in Johansson Studio',async()=>{
 const game=await read('src/game.js'),title=await read('title-menu.js'),html=await read('index.html');
 assert.match(game,/decoratorEnabled\(\)&&new URLSearchParams\(location\.search\)\.has\('build'\)/,'the ?build town builder only for the Town Studio app');
 assert.doesNotMatch(html,/id="enterBuild"|<b>BUILD<\/b>/,'no BUILD on the title screen, not even while the page loads');
 assert.doesNotMatch(title,/enterBuild|'build'/,'the title menu has no build mode');
 assert.doesNotMatch(game,/__JOHANSSON_MODE__==='build'|startBuildMode/,'the game never starts in a build mode');
 assert.doesNotMatch(game,/openCreator|Make your islander|Resident wardrobes|createHomeDecorating/,'no maker, wardrobes or arranging in the game');
 assert.match(game,/createHomeCustomization\(\{room,state:activities\.state\}\)/,'the home is dressed as Studio left it, with no Decorate your home');
 // Leaving for Studio goes through the guarded save (docs/EXPERIENCE-IMPLEMENTATION.md: "Leaving for Johansson Studio
 // uses the same guard"): Studio opens only once the save is written. It used to be a bare activities.save() first.
 assert.match(game,/onStudio:\(\)=>activities\.saveBeforeLeaving\(\(\)=>\{location\.href=new URL\('\.\.\/avatar-creator\//,'the Town Book saves progress and opens Johansson Studio');
 for(const [path,code] of await sources('src'))assert.doesNotMatch(code,/thuan-wardrobe|openMaker/,path+' offers no wardrobe or mirror maker');
 const creatorPage=await read('creator/index.html');
 assert.match(creatorPage,/location\.replace/,'the old maker address forwards to Studio');
 assert.doesNotMatch(creatorPage,/openCreator|savePlayerRecipe/,'the old maker address is not a maker any more');
 assert.doesNotMatch(html,/const items = /,'the title menu reads its buttons each time');
 // The creator, 2026-10-12: the photo studio's wardrobe and ?avatar= links go to Studio as well.
 const photo=await read('src/photo/studio.js');
 assert.doesNotMatch(photo,/<summary>Wardrobe<\/summary>|name="wearSet"|data-own-clothes/,'no wardrobe in the photo studio');
 assert.doesNotMatch(game,/importRecipeFromURL/,'World does not take a look from a link');
 assert.match(html,/get\('avatar'\);if\(c\)location\.replace\('\/avatar-creator\/\?r='/,'a shared ?avatar= link opens in Studio');
});
