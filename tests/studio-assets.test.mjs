// The johansson-studio asset tools (tools/studio/assets.mjs) on a throwaway copy of World's catalogue: a package from
// Studio's "Make model" is refused unless every check ran and passed and its files are what it names; a good one is
// kept in the draft (dry run first); asset_list shows it; asset_publish refuses until it is new to World and then
// writes the catalogue, its index and catalog-data.js exactly as tools/catalog/build-catalog.mjs would.
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openRepo} from '../tools/studio/repo.mjs';
import {callTool} from '../tools/studio/tools.mjs';
import {assetPackage} from '../src/studio/modeller/export.js';
import {sha256} from '../src/studio/sha256.js';
import {catalogSource} from '../tools/catalog/build-catalog.mjs';

const town=fileURLToPath(new URL('../',import.meta.url));
let root,ctx;
before(async()=>{
 root=await mkdtemp(join(tmpdir(),'studio-assets-'));
 await mkdir(resolve(root,'johansson-town/data/studio'),{recursive:true});await mkdir(resolve(root,'johansson-town/src/catalog'),{recursive:true});
 await cp(resolve(town,'assets/catalog'),resolve(root,'johansson-town/assets/catalog'),{recursive:true});
 await cp(resolve(town,'data/studio/brand-rules.json'),resolve(root,'johansson-town/data/studio/brand-rules.json'));
 ctx={repo:openRepo(root),page:async()=>{throw Error('no page in this test');},close:async()=>{}};
});
after(async()=>{await rm(root,{recursive:true,force:true});});

/** The massage chair as Studio would send a new version of it. */
async function chairPackage({version=2,roles=true,tamper=false}={}){
 const dir=resolve(town,'assets/catalog/massage-chair'),card=JSON.parse(await readFile(resolve(dir,'asset.json'),'utf8'));
 card.version=version;if(roles)card.checks=[...card.checks,{id:'roles',ok:true,detail:'8 part(s).'}];
 const glb=new Uint8Array(await readFile(resolve(dir,'model.glb'))),hero=new Uint8Array(await readFile(resolve(dir,'hero.png')));
 const pkg=assetPackage({card,glb,hero,by:'ipad',sha:sha256});
 if(tamper)pkg.files['model.glb'].sha256='0'.repeat(64);
 return pkg;
}

test('a package is refused unless every check ran and passed, its files are what it names, and it is new to World',async()=>{
 let r=await callTool('asset_draft',{package:await chairPackage({roles:false})},ctx);
 assert.equal(r.ok,false);assert.match(r.problems.join(' '),/did not run every check on it: roles missing/);
 r=await callTool('asset_draft',{package:await chairPackage({tamper:true})},ctx);
 assert.match(r.problems.join(' '),/model\.glb is not the file the package names/);
 r=await callTool('asset_draft',{package:await chairPackage({version:1})},ctx);
 assert.match(r.problems.join(' '),/World already has version 1 of massage-chair/);
 r=await callTool('asset_draft',{package:{format:'something'}},ctx);assert.match(r.problems[0],/not a Studio asset package/);
});

test('a good package is kept in the draft (a dry run first), listed, and published only when asked',async()=>{
 const pkg=await chairPackage();
 let r=await callTool('asset_draft',{package:pkg},ctx);
 assert.equal(r.ok,true);assert.equal(r.applied,false);assert.equal(r.replaces,'World’s version 1');
 assert.equal((await callTool('asset_list',{},ctx)).draft.length,0,'a dry run writes nothing');
 r=await callTool('asset_draft',{package:pkg,dryRun:false},ctx);assert.equal(r.applied,true);
 const list=await callTool('asset_list',{},ctx);
 assert.deepEqual(list.draft,[{id:'massage-chair',name:'Coin massage chair',kind:'furniture',version:2,maker:null,inWorld:1}]);
 assert.ok(list.registry.some(e=>e.id==='vending-machine'));
 const drafted=JSON.parse(await readFile(resolve(root,'johansson-town/data/studio/draft/assets/massage-chair/asset.json'),'utf8'));
 assert.equal(drafted.source.from,'johansson-studio');assert.equal(drafted.hero,'hero.png');
 const before=await readFile(resolve(root,'johansson-town/assets/catalog/index.json'),'utf8');
 r=await callTool('asset_publish',{id:'massage-chair'},ctx);
 assert.equal(r.ok,true);assert.equal(r.dryRun,true);assert.equal(await readFile(resolve(root,'johansson-town/assets/catalog/index.json'),'utf8'),before,'a dry run changes nothing');
 r=await callTool('asset_publish',{id:'massage-chair',dryRun:false},ctx);assert.equal(r.ok,true,JSON.stringify(r));
 const index=JSON.parse(await readFile(resolve(root,'johansson-town/assets/catalog/index.json'),'utf8'));
 assert.equal(index.assets.find(e=>e.id==='massage-chair').version,2);
 assert.equal(await readFile(resolve(root,'johansson-town/src/catalog/catalog-data.js'),'utf8'),await catalogSource(resolve(root,'johansson-town')));
 assert.equal((await callTool('asset_list',{},ctx)).draft.length,0,'published assets leave the draft');
 r=await callTool('asset_publish',{id:'massage-chair'},ctx);assert.match(r.error,/no massage-chair in Studio's draft/);
});
