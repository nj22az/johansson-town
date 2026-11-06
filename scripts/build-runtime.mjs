import './build-town-papers.mjs';
import {build} from 'vite';
import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,relative} from 'node:path';
import {runtimeSourceHash} from './runtime-source.mjs';
const root=resolve(new URL('..',import.meta.url).pathname);
// The manifest from the build before this one. Its files are kept alongside the new
// ones, so a page still holding the old index.html (Pages caches it for minutes) can
// finish loading; everything older is pruned below.
const manifestPath=resolve(root,'runtime/.vite/manifest.json');
const previousManifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{};
// configFile:false means vite.config.js is not read, so base has to be set here too.
// Without it the build defaults to '/', and the preload helper asks for every chunk
// at the site root: each dynamic import 404s its hint and loads unprefetched.
await build({configFile:false,root,publicDir:false,base:'./',build:{target:'es2022',outDir:'runtime',emptyOutDir:false,minify:'esbuild',manifest:true,rollupOptions:{input:{portraits:resolve(root,'src/avatars/guide-portraits.js'),feed:resolve(root,'src/feed/mount.js'),boot:resolve(root,'src/boot.js'),audio:resolve(root,'src/audio/town-audio.js')+'?snappy=1','title-menu':resolve(root,'title-menu.js')},preserveEntrySignatures:'strict',output:{manualChunks(id){
 // World and the native workshop scene use these same builders. Keep them together rather than adding
 // one request each for the prop loader, content objects, printed products and the printer model helper.
 const file=id.split('?')[0];if(['content-items.js','src/world/interiors/compact-shops.js','src/world/interiors/workshop-props.js','src/world/interiors/business-content.js','src/workshop/models.js','src/commerce/shop-product.js'].some(path=>file===resolve(root,path)))return 'compact-shops';
 },entryFileNames:'[name]-[hash].js',chunkFileNames:'[name]-[hash].js',assetFileNames:'[name]-[hash][extname]'}}}});
const manifest=JSON.parse(await readFile(resolve(root,'runtime/.vite/manifest.json'),'utf8'));
const boot=manifest['src/boot.js'].file,audio=Object.values(manifest).find(entry=>entry.isEntry&&entry.name==='audio').file;
// The title menu (saves, friendship hearts) imported the source tree straight from index.html: save.js pulls the
// residents, who pull the town's layouts, the ferry, the ocean and three.js, so the title screen fetched 1.3 MB of
// unminified three.js and sixty source modules one after another, and the game then fetched three.js again inside
// its own chunk. Built as an entry it shares the game's chunks and is minified.
const titleMenu=manifest['title-menu.js'].file;
const portraits=manifest['src/avatars/guide-portraits.js'].file,feed=manifest['src/feed/mount.js'].file;
let html=await readFile(resolve(root,'index.html'),'utf8');
html=html.replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,`window.JOHANSSON_PORTRAIT_MODULE="./runtime/${portraits}"`);
html=html.replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,`window.JOHANSSON_FEED_MODULE="./runtime/${feed}"`);
html=html.replace(/from ['"]\.\/(?:src\/audio\/town-audio\.js(?:\?[^'"]*)?|runtime\/audio-[^'"]+)['"]/g,`from './runtime/${audio}'`);
html=html.replace(/import\(['"]\.\/(?:src\/boot\.js(?:\?[^'"]*)?|runtime\/boot-[^'"]+)['"]\)/g,`import('./runtime/${boot}')`);
// Fetch the compiled boot graph while the title screen is visible. This does not
// execute the game, unlock sound, or start model downloads before Enter Town.
html=html.replace(/from ['"]\.\/(?:title-menu\.js|runtime\/title-menu-[^'"]+)['"]/g,`from './runtime/${titleMenu}'`);
html=html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'');
// Preload the modules the entry gate will need, not just boot. game.js was imported
// only after the street assets settled, so its chunk started downloading when the gate
// was nearly over and the player waited through it serially. Preloading fetches it
// alongside the assets without executing it, so the import resolves from cache.
const preloadEntries=['title-menu.js','src/boot.js','touch-ui.js?ui=controls-3','src/game.js?snappy=1'];
const preloadFiles=[...new Set(preloadEntries.flatMap(name=>{
 const entry=manifest[name];
 return entry?[entry.file,...(entry.imports||[]).map(dep=>manifest[dep]?.file).filter(Boolean)]:[];
}))];
const preloadLinks=preloadFiles.map(file=>`<link rel="modulepreload" data-town-runtime href="./runtime/${file}">`).join('\n');
html=html.replace('</head>',`${preloadLinks}\n</head>`);
for(const file of ['resident-guide.js','landing.js']){const hash=createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex').slice(0,8);html=html.replace(new RegExp('src="\\./'+file.replace('.','\\.')+'(?:\\?[^" ]*)?"','g'),`src="./${file}?h=${hash}"`);}
// The loader's own modules, imported by index.html itself: stamped too, so new markup never meets a cached old
// loader (a START button that would never unlock).
for(const file of ['loading-progress.js','loading-facts.js']){const hash=createHash('sha256').update(readFileSync(resolve(root,file))).digest('hex').slice(0,8);html=html.replace(new RegExp("from '\\./"+file.replace('.','\\.')+"(?:\\?[^']*)?'",'g'),`from './${file}?h=${hash}'`);}
// Stamp every local stylesheet with a hash of its contents. These links carried
// hand-written query strings, so editing a stylesheet without remembering to bump its
// version served the old file from cache: new markup with stale CSS. The hash means
// the link changes exactly when the file does, and never when it does not.
const cssHashes=[];
const stampStylesheets=(source,page)=>source.replace(/href="((?:\.\/|\.\.\/)?[\w/-]+\.css)(\?[^"]*)?"/g,(match,file)=>{
 const path=resolve(dirname(resolve(root,page)),file);
 if(!existsSync(path))return match;
 const hash=createHash('sha256').update(readFileSync(path)).digest('hex').slice(0,8);
 cssHashes.push(relative(root,path)+' '+hash);
 return `href="${file}?h=${hash}"`;
});
html=stampStylesheets(html,'index.html');
await writeFile(resolve(root,'index.html'),html);
const creatorPath=resolve(root,'creator/index.html');
if(existsSync(creatorPath))await writeFile(creatorPath,stampStylesheets(await readFile(creatorPath,'utf8'),'creator/index.html'));
// Prune: every hashed chunk that neither this build nor the previous one lists. With
// emptyOutDir off (the runtime folder also holds source.json), nothing else ever
// removes them, and each rebuild used to leave another 1.6 MB game chunk behind.
const keep=new Set(['source.json',...[manifest,previousManifest].flatMap(m=>Object.values(m).flatMap(entry=>[entry.file,...(entry.css||[]),...(entry.assets||[])]))]);
let pruned=0;for(const name of await readdir(resolve(root,'runtime'))){if(name.startsWith('.')||keep.has(name))continue;await unlink(resolve(root,'runtime',name));pruned++;}
if(pruned)console.log('Pruned stale runtime chunks:',pruned);
await writeFile(resolve(root,'runtime/source.json'),JSON.stringify({sha256:await runtimeSourceHash(root)},null,2)+'\n');
console.log('Stylesheet hashes:',cssHashes.join(', '));
console.log('Published runtime entry points:',boot,audio,'files:',(await readdir(resolve(root,'runtime'))).filter(f=>f.endsWith('.js')).length);

const swPath=resolve(root,'sw.js');if(existsSync(swPath)){const release=createHash('sha256').update(await runtimeSourceHash(root));for(const path of new Set(['index.html','creator/index.html','manifest.webmanifest',...cssHashes.map(item=>item.split(' ')[0]),...(await readdir(resolve(root,'assets/food'))).map(name=>'assets/food/'+name),...(await readdir(resolve(root,'assets/icons'))).map(name=>'assets/icons/'+name)]))release.update(path).update(await readFile(resolve(root,path)));const version=release.digest('hex').slice(0,20);await writeFile(swPath,(await readFile(swPath,'utf8')).replace(/const VERSION = '[^']*';/,`const VERSION = '${version}';`));}
