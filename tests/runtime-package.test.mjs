import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {runtimeSourceHash} from '../scripts/runtime-source.mjs';

test('published runtime matches the current source rather than an older build',async()=>{
 const root=new URL('../',import.meta.url).pathname;
 const recorded=JSON.parse(await readFile(new URL('../runtime/source.json',import.meta.url),'utf8'));
 assert.equal(recorded.sha256,await runtimeSourceHash(root),'Run npm run build:runtime with every source change');
});

test('published page uses one compiled audio/boot graph with local hashed dependencies',async()=>{
 const base=new URL('../runtime/',import.meta.url),manifest=JSON.parse(await readFile(new URL('.vite/manifest.json',base),'utf8'));
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const boot=manifest['src/boot.js'],audio=Object.values(manifest).find(entry=>entry.isEntry&&entry.name==='audio');
 assert.ok(html.includes("import('./runtime/"+boot.file+"')"));assert.ok(html.includes("from './runtime/"+audio.file+"'"));
 assert.ok(html.includes('data-town-runtime href="./runtime/'+boot.file+'"'));
 assert.doesNotMatch(html,/import\(['"]\.\/src\/boot/);
 for(const entry of Object.values(manifest)){
  await access(new URL(entry.file,base));
  for(const key of [...entry.imports||[],...entry.dynamicImports||[]])assert.ok(manifest[key],'Missing compiled dependency '+key);
  const code=await readFile(new URL(entry.file,base),'utf8');assert.doesNotMatch(code,/(?:from\s*|import\()['"][^'"]*\/src\//,'No raw source imports in published chunks');
 }
 // Guide rendering, the town feed's comics and opt-in Spector are lazy; Vite shares a preload
 // helper and the avatar code the guide and the feed both use. The comics are shot in the real
 // 3D places (src/scene/scene-world.js), so the room builders the game and the comics share are
 // split out as their own lazy chunks.
 // The title menu is an entry too (docs/LOADING.md): it once imported the source tree straight from index.html, so
 // the title screen fetched unminified three.js and sixty modules. Built, it shares the game's chunks (the residents,
 // their personalities, the save) and a few more entries are split out for it.
 // Karaoke is lazy; its shared songs, actor helpers and icons add four entries.
 // The world, photo targets and lazy town feed share one small harbour-park-plan data chunk.
 // Its canonical place/path constants add one entry to the bounded graph.
 // The shop and the comic interiors now share the existing house-walk helper for the office stairs.
 assert.ok(Object.keys(manifest).length<=36,'Bound the compiled graph including optional diagnostics: '+Object.keys(manifest).length);
 const titleMenu=manifest['title-menu.js'];assert.ok(titleMenu?.isEntry&&html.includes("from './runtime/"+titleMenu.file+"'"),'the title menu loads from the runtime');
 assert.doesNotMatch(html,/from ['"]\.\/title-menu\.js['"]/,'the title menu is never imported from source');
 const portraits=manifest['src/avatars/guide-portraits.js'];assert.ok(portraits&&html.includes(portraits.file));assert.ok(!html.includes('data-town-runtime href="./runtime/'+portraits.file+'"'),'guide rendering stays lazy');
 const audioCode=await readFile(new URL(audio.file,base),'utf8');assert.match(audioCode,/unlockTownAudio/,'Title screen retains its audio unlock export');
 const game=Object.values(manifest).find(entry=>entry.src?.startsWith('src/game.js'));
 const dependencies=entry=>{const result=new Set([entry.file]);for(const key of entry.imports||[])for(const file of dependencies(manifest[key]))result.add(file);return result;};
 const gameFiles=dependencies(game),audioFiles=dependencies(audio),contexts=[];
 const treeData=Object.values(manifest).find(entry=>entry.src==='src/world/tree-design-data.js');
 assert.ok(treeData?.isDynamicEntry,'CAD tree geometry has its own cached chunk');
 assert.ok(!gameFiles.has(treeData.file),'CAD tree data stays out of the static game preload graph');
 const concert=manifest['src/music/concert.js'];assert.ok(concert?.isDynamicEntry,'Karaoke loads only when the machine is used');assert.ok(!gameFiles.has(concert.file),'The concert adds no eager rendering or audio code');
 assert.ok(!html.includes('data-town-runtime href="./runtime/'+concert.file+'"'),'No concert preload on the title screen');
 const graphics=Object.values(manifest).find(entry=>entry.name==='spector.bundle');
 assert.ok(graphics?.isDynamicEntry,'Graphics inspection stays in a separate lazy chunk');
 assert.ok(!gameFiles.has(graphics.file),'Normal gameplay never imports Spector eagerly');
 assert.ok(!html.includes('data-town-runtime href="./runtime/'+graphics.file+'"'),'The title screen never preloads Spector');
 for(const file of new Set([...gameFiles,...audioFiles]))if(/(?:window\.)?AudioContext/.test(await readFile(new URL(file,base),'utf8')))contexts.push(file);
 assert.equal(contexts.length,1,'One audio implementation in the entry graph');
 assert.ok(gameFiles.has(contexts[0])&&audioFiles.has(contexts[0]),'Game and title share one audio context');
});

test('every stylesheet link carries a hash of the file it points at',async()=>{
 const {createHash}=await import('node:crypto');
 for(const page of ['index.html','creator/index.html']){
 const pageUrl=new URL('../'+page,import.meta.url),html=await readFile(pageUrl,'utf8');
 const links=[...html.matchAll(/href="((?:\.\/|\.\.\/)?[\w/-]+\.css)(\?[^"]*)?"/g)];
 assert.ok(links.length>=(page==='index.html'?5:2),'The page still links its stylesheets');
 for(const [,file,query] of links){
  const css=await readFile(new URL(file,pageUrl));
  const hash=createHash('sha256').update(css).digest('hex').slice(0,8);
  // A hand-written version string goes stale the moment someone edits the stylesheet
  // and forgets it, which serves new markup with old CSS out of the browser cache.
  assert.equal(query,'?h='+hash,file+' is cached under the wrong key; run npm run build:runtime');
 }
 }
});

test('delivered chunks contain no retired combat handlers, menus, damage simulation or rewards',async()=>{
 const {readdir}=await import('node:fs/promises');
 for(const name of await readdir(new URL('../runtime/',import.meta.url))){
  if(!name.endsWith('.js'))continue;
  const code=await readFile(new URL('../runtime/'+name,import.meta.url),'utf8');
  for(const marker of ['festivalHUD','festival-active','johansson-festival-menu','Watch the exhibition','Annual Harbour Tournament','personal-quarrel\',','nearFoe','Johansson’s fists','Go down to floor B','Golden Ladle and ¥400'])assert.equal(code.includes(marker),false,name+' still ships '+marker);
 }
});
