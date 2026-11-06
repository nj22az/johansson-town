import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {PATHS,jsonText} from '../tools/studio/repo.mjs';
import {looksModule,charactersModule,productsModule} from '../tools/studio/build-data.mjs';
import {TOOLS} from '../tools/studio/tools.mjs';
import {serveGame} from '../tools/mcp/static-server.mjs';
import {normalizeRecipe,DEFAULT_RECIPE} from '../src/avatars/recipe.js';

// Outside node --test the server ignores JOHANSSON_STUDIO_ROOT (repo.mjs), so these calls would change the real data.
if(!process.env.NODE_TEST_CONTEXT)throw Error('Run this with node --test: outside it the server ignores JOHANSSON_STUDIO_ROOT and would write the real Studio data.');

// The real johansson-studio server over stdio, pointed (as only a test can) at a throwaway copy of Studio's data. The
// copy holds one Studio character, Sentinel, so the first test proves the server reads the copy, not the checkout.
// Every tool is called except render_portrait, which needs Chromium (tools/studio/smoke.mjs covers it).
const town=fileURLToPath(new URL('../',import.meta.url));
const SENTINEL={name:'Sentinel',recipe:normalizeRecipe({...DEFAULT_RECIPE,name:'Sentinel'}),card:{role:'Test sentinel',why:'Proves the server reads the throwaway copy of the data.'},made:'2026-10-12T09:14:00Z'};
let root,client,original,startup,productsText;
before(async()=>{
 root=await mkdtemp(join(tmpdir(),'studio-mcp-'));
 for(const folder of ['data/studio','src/avatars','src/studio'])await mkdir(resolve(root,'johansson-town',folder),{recursive:true});
 original=jsonText({format:'johansson-looks',version:1,looks:{},characters:{sentinel:SENTINEL}});
 await writeFile(resolve(root,PATHS.looks),original);await writeFile(resolve(root,PATHS.looksModule),looksModule(original));await writeFile(resolve(root,PATHS.charactersModule),charactersModule(original));
 await writeFile(resolve(root,PATHS.log),jsonText({format:'johansson-studio-log',version:1,changes:[]}));
 await copyFile(resolve(town,'data/studio/brand-rules.json'),resolve(root,PATHS.brands));
 // Sakura's products as published today, so the product tools work on the copy too.
 productsText=await readFile(resolve(town,'data/studio/products.json'),'utf8');await mkdir(resolve(root,'johansson-town/src/commerce'),{recursive:true});
 await writeFile(resolve(root,PATHS.products),productsText);await writeFile(resolve(root,PATHS.productsModule),productsModule(productsText));
 client=new Client({name:'studio-mcp-test',version:'1'});
 const transport=new StdioClientTransport({command:process.execPath,args:[resolve(town,'tools/studio/server.mjs')],cwd:resolve(town,'..'),env:{...process.env,JOHANSSON_STUDIO_ROOT:root},stderr:'pipe'});
 const t=performance.now();await client.connect(transport);startup=performance.now()-t;
});
after(async()=>{await client?.close();await rm(root,{recursive:true,force:true});});

const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args},{timeout:120000});return {error:!!r.isError,data:JSON.parse(r.content[0].text)};};
const looks=()=>readFile(resolve(root,PATHS.looks),'utf8');

test('workflow discovery routes agents to registered tools and preserves creator approval',async()=>{
 const before=await looks(),r=await call('studio_workflow_info');assert.equal(r.error,false);
 const registered=new Set((await client.listTools()).tools.map(t=>t.name));
 for(const name of [...r.data.models,...r.data.rooms,...r.data.assets,...r.data.comics,...r.data.worldRooms.tools,...r.data.film.tools])assert.ok(registered.has(name),name);
 assert.match(r.data.approval,/Only after creator approval/);assert.equal(await looks(),before);
 assert.equal((await client.callTool({name:'studio_workflow_info',arguments:{publish:true}})).isError,true);
});

test('model snapping is available through the real MCP protocol with strict schemas and no writes',async()=>{
 const before=await looks();
 const grid=await call('model_snap',{mode:'grid',position:[.123,0,.27],step:.05});assert.equal(grid.error,false);assert.deepEqual(grid.data.position,[.1,0,.25]);
 const joined=await call('model_snap',{mode:'connector',source:{point:[0,0,0],normal:[0,-1,0],up:[0,0,1]},target:{point:[1,0,2],normal:[0,1,0],up:[0,0,1]}});
 assert.equal(joined.error,false);assert.deepEqual(joined.data.position,[1,0,2]);assert.equal(joined.data.ground,false);
 assert.equal((await client.callTool({name:'model_snap',arguments:{mode:'grid',position:[0,0]}})).isError,true);
 assert.equal(await looks(),before);
});

test('portable rooms cross the real MCP boundary with dry runs, stale-edit rejection and explicit file exchange',async()=>{
 const original=await looks();
 assert.equal((await call('room_create',{id:'protocol-room',title:'Protocol'})).data.dryRun,true);
 assert.equal((await call('room_get',{id:'protocol-room'})).error,true);
 assert.equal((await call('room_create',{id:'protocol-room',title:'Protocol',dryRun:false})).error,false);
 const edited=await call('room_edit',{id:'protocol-room',expectedRevision:0,commands:[{op:'title',title:'Changed'}],dryRun:false});assert.equal(edited.data.project.revision,1);
 assert.equal((await call('room_edit',{id:'protocol-room',expectedRevision:0,commands:[{op:'title',title:'Stale'}],dryRun:false})).error,true);
 const file=await call('room_export',{id:'protocol-room'});assert.equal(file.error,false);
 const opened=await call('room_open',{id:'copied-room',file:file.data.path,dryRun:false});assert.equal(opened.error,false);assert.equal(opened.data.project.title,'Changed');assert.equal(opened.data.project.revision,0);
 assert.equal((await call('room_open',{id:'copied-room',file:file.data.path,dryRun:false})).error,true);
 assert.equal((await call('room_open',{id:'escape',file:'../outside.room.json',dryRun:false})).error,true);
 assert.equal(await looks(),original);
});

test('World purpose and existing-film tools are available through MCP without a second renderer',async()=>{
 const before=await looks(),info=await call('film_pipeline_info');assert.equal(info.error,false);assert.equal(info.data.pipeline,'nj22az/jojo/remotion');
 const found=await call('world_asset_list',{query:'registry:j-coffee-can'});assert.equal(found.data.total,1);
 const got=await call('world_asset_get',{id:'registry:j-coffee-can'});assert.ok(got.data.asset.purpose.why);
 const dry=await call('world_asset_review',{id:'registry:j-coffee-can',expectedRevision:0,set:{decision:'keep'}});assert.equal(dry.data.dryRun,true);
 const applied=await call('world_asset_review',{id:'registry:j-coffee-can',expectedRevision:0,set:{decision:'keep',note:'Coffee for the quay crew'},dryRun:false});assert.equal(applied.error,false);assert.equal(applied.data.revision,1);
 assert.equal((await call('world_asset_review',{id:'registry:j-coffee-can',expectedRevision:0,set:{decision:'remove'},dryRun:false})).error,true);
 assert.equal((await call('scene_export_film',{file:'../outside.json'})).error,true);assert.equal(await looks(),before);
});

test('native World room tools expose strict revision and floating-compatible draft boundaries',async()=>{
 const list=(await client.listTools()).tools;for(const name of ['world_room_open','world_room_check','world_room_publish','world_room_rollback'])assert.ok(list.some(t=>t.name===name));
 for(const args of [{id:'x',expectedWorldRevision:0,note:'Missing project revision'},{id:'x',expectedWorldRevision:0,expectedProjectRevision:0,note:'Do not bypass the checks',skipChecks:true}])assert.equal((await client.callTool({name:'world_room_publish',arguments:args})).isError,true);
 assert.equal((await client.callTool({name:'world_room_open',arguments:{room:'sakura',id:'wrong-room'}})).isError,true);
 const p=await call('world_room_publish',{id:'missing-room',expectedWorldRevision:0,expectedProjectRevision:0,note:'Refuse a missing room project',dryRun:false});assert.equal(p.error,true);
});

test('the server answers initialize quickly, reads the throwaway copy, and lists every tool with honest hints',async()=>{
 assert.ok(startup<5000,`initialize took ${Math.round(startup)} ms`);
 const studio=await call('character_list',{group:'studio'});
 assert.deepEqual(studio.data.characters.map(c=>c.name),['Sentinel'],'the server reads the copy, so nothing here can reach the real data');
 const {tools}=await client.listTools(),hints=Object.fromEntries(tools.map(t=>[t.name,t.annotations]));
 assert.deepEqual(tools.map(t=>t.name).sort(),TOOLS.map(t=>t.name).sort());
 for(const t of tools){assert.equal(t.inputSchema.type,'object',t.name);assert.ok(t.description.length>40,t.name);}
 for(const name of ['character_list','character_get','validate','publish_check','product_list','product_get'])assert.equal(hints[name].readOnlyHint,true,name);
 for(const name of ['character_update','character_reset','character_delete','publish_draft','discard_draft','product_update','product_label_picture','product_retire'])assert.deepEqual([hints[name].readOnlyHint,hints[name].destructiveHint],[false,true],name);
 for(const name of ['character_create','product_add'])assert.deepEqual([hints[name].readOnlyHint,hints[name].destructiveHint],[false,false],`${name} only adds`);
 for(const name of ['render_portrait','render_product'])assert.deepEqual([hints[name].readOnlyHint,hints[name].idempotentHint],[false,true],`${name} saves a file`);
});

test('look, change with a dry run, say yes (the draft), publish, then reset and publish: looks.json is byte-identical again',async()=>{
 const list=await call('character_list',{group:'townsfolk'});
 assert.ok(list.data.characters.some(c=>c.name==='Mr Fujita'&&c.role&&!c.edited));
 const got=await call('character_get',{name:'mr fujita',options:true});
 assert.equal(got.data.name,'Mr Fujita','accents and capitals may be left out');
 assert.equal(got.data.source.includes('baseRecipe'),true);assert.equal(got.data.look,null);
 assert.ok(got.data.options['outfit.hat'].words.includes('captain'));assert.ok(got.data.profile&&!got.data.recipe.profile);
 const dry=await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'captain','body.height':1.4},note:'He skippered the old ferry once.'});
 assert.equal(dry.data.ok,true,JSON.stringify(dry.data.problems));assert.equal(dry.data.applied,false);
 assert.equal(dry.data.recipe.outfit.hat,'captain');assert.equal(dry.data.clamped.length,1);
 assert.equal(await looks(),original,'a dry run writes nothing');
 const done=await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'captain'},note:'He skippered the old ferry once.',dryRun:false});
 assert.equal(done.data.applied,true,JSON.stringify(done.data));assert.match(done.data.next,/draft/);
 assert.equal(await looks(),original,'yes puts the change in Studio\'s draft, never straight into World\'s data');
 const drafted=await call('character_get',{name:'Mr Fujita'});
 assert.equal(drafted.data.look.set['outfit.hat'],'captain');assert.equal(drafted.data.published,null);assert.equal(drafted.data.unpublished,true);
 assert.equal((await call('character_list',{query:'fujita'})).data.characters[0].unpublished,true);
 const preview=await call('publish_draft');
 assert.equal(preview.data.applied,false);assert.equal(preview.data.changes.length,1);assert.equal(preview.data.people[0].name,'Mr Fujita');
 assert.equal(await looks(),original);
 const published=await call('publish_draft',{dryRun:false});
 assert.equal(published.data.applied,true,JSON.stringify(published.data));assert.match(published.data.next,/render-resident-guide/);
 assert.equal(JSON.parse(await looks()).looks['Mr Fujita'].set['outfit.hat'],'captain');
 assert.equal((await call('character_get',{name:'Mr Fujita'})).data.unpublished,false);
 assert.equal((await call('character_reset',{name:'Mr Fujita',dryRun:false})).data.applied,true);
 assert.equal((await call('publish_draft',{dryRun:false})).data.applied,true);
 assert.equal(await looks(),original);
 assert.equal((await call('character_reset',{name:'Mr Fujita'})).data.nothing.includes('no Studio look'),true);
});

test('two changes to one person at once both apply, each with its own id and its own reason',async()=>{
 const [hat,hair]=await Promise.all([
  call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'captain'},note:'He skippered the old ferry once.',dryRun:false}),
  call('character_update',{name:'Mr Fujita',set:{'hair.colour':'#9a9a96'},note:'Grey from forty years at sea.',dryRun:false})]);
 assert.equal(hat.data.applied,true,JSON.stringify(hat.data));assert.equal(hair.data.applied,true,JSON.stringify(hair.data));
 assert.notEqual(hat.data.change.id,hair.data.change.id);
 const look=(await call('character_get',{name:'Mr Fujita'})).data.look;
 assert.deepEqual(look.set,{'hair.colour':'#9a9a96','outfit.hat':'captain'});
 assert.deepEqual(look.notes,{'hair.colour':'Grey from forty years at sea.','outfit.hat':'He skippered the old ferry once.'});
 // A dry run right after is never refused over its id.
 assert.equal((await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'cap'},note:'Trying another hat on him.'})).data.ok,true);
 const discarded=await call('discard_draft',{all:true,dryRun:false});
 assert.equal(discarded.data.applied,true);assert.equal(discarded.data.discarded.length,2);
 assert.equal((await call('character_get',{name:'Mr Fujita'})).data.look,null);
});

test('Studio-only characters have a profile of their own; a resident can never be deleted; problems come back in words',async()=>{
 const thao=(await call('character_get',{name:'Thao'})).data;
 const made=await call('character_create',{name:'Sora',from:'Thao',set:{'hair.style':'bob','body.height':3},card:{role:'Visiting cousin',why:'Thao\'s cousin from Naha, for the summer festival stories.'},dryRun:false});
 assert.equal(made.data.applied,true,JSON.stringify(made.data));assert.equal(made.data.id,'sora');assert.equal(made.data.clamped.length,1);
 const sora=(await call('character_get',{name:'sora'})).data;
 assert.equal(sora.recipe.hair.style,'bob');assert.equal(sora.recipe.body.height,1);assert.equal(sora.recipe.outfit.top,thao.recipe.outfit.top,'she starts from how Thao looks');
 assert.ok(['pace','talk','show','outlook'].some(k=>sora.profile[k]!==thao.profile[k]),'but not from who Thao is: her dials are her own');
 if(thao.profile.catchphrase)assert.notEqual(sora.profile.catchphrase,thao.profile.catchphrase);
 assert.equal((await call('character_update',{name:'Sora',set:{'outfit.top':'sailor'},note:'Her school uniform for the festival.',dryRun:false})).data.applied,true);
 const resident=await call('character_delete',{id:'Mr Fujita'});
 assert.equal(resident.error,true);assert.match(resident.data.error,/can never be deleted/);
 const wrong=await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'tophat'},note:'Trying a hat that is not there.'});
 assert.equal(wrong.data.ok,false);assert.match(wrong.data.problems.join(' '),/not a choice for outfit\.hat/);
 const readOnly=await call('character_update',{name:'Mr Fujita',set:{'profile.pitch':1},note:'Trying to change his voice.'});
 assert.deepEqual(readOnly.data.problems,['"profile.pitch" is not a part of a look Studio can change. The parts are listed by character_get with options:true.']);
 const twice=await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'captain'},note:'A <b>bold</b> hat for him.'});
 assert.equal(twice.data.problems.filter(p=>/may not contain "</.test(p)).length,1,'a sentence is said once');
 assert.match((await call('character_get',{name:'Harbour visitor'})).data.error,/template in the maker/);
 assert.equal((await call('character_get',{name:'Nobody at all'})).error,true);
 assert.equal((await call('character_list',{query:'koji'})).data.characters[0].name,'Kōji');
 assert.match((await call('character_create',{name:'Aya',card:{role:'Visiting cousin',why:'Another cousin for the festival.'}})).data.problems.join(' '),/used to give Nhung/);
 assert.equal((await call('character_delete',{id:'sora',dryRun:false})).data.applied,true);
 assert.equal((await call('publish_draft',{dryRun:false})).data.applied,true);
 assert.equal(await looks(),original);
});

test('render_portrait refuses an unknown pose in words, before any browser starts',async()=>{
 const r=await call('render_portrait',{name:'Mr Fujita',pose:'Moonwalk'});
 assert.equal(r.error,true);assert.match(r.data.error,/^Unknown pose "Moonwalk"\. Poses: Idle, /);assert.doesNotMatch(r.data.error,/\n|at Object/);
 assert.match((await call('render_portrait',{name:'Mr Fujita',expression:'smug-ish'})).data.error,/^Unknown expression "smug-ish"\. Expressions: /);
});

test('validate and publish_check report in plain words',async()=>{
 const v=await call('validate',{});
 assert.equal(v.data.looks.ok,true,JSON.stringify(v.data.looks));assert.equal(v.data.draft.ok,true,JSON.stringify(v.data.draft));
 assert.ok(v.data.brands.warnings.some(w=>/izakaya-beer\.js:\d+ — Minato's draught/.test(w)),'the known Orion uses are found by their words');
 const c=await call('validate',{target:'change',change:{format:'johansson-studio-change',version:1,id:'x',made:'y',by:'ipad',note:'n',ops:[{op:'constructor'}]}});
 assert.equal(c.data.ok,false);assert.ok(c.data.problems.length>=3);assert.ok(c.data.problems.some(p=>/is not a Studio step/.test(p)));
 const brand=await call('validate',{target:'change',change:{format:'johansson-studio-change',version:1,id:'2026-10-12T09-14Z-x',made:'2026-10-12T09:14:00Z',by:'claude',note:'A promoter for the festival.',
  ops:[{op:'character.create',id:'promoter',character:{name:'Kana',recipe:{},card:{role:'Orion beer promoter',why:'She hands out samples at the festival.'}}}]}});
 assert.match(brand.data.problems.join(' '),/"orion" is a real brand/);
 const p=await call('publish_check',{tests:false});
 assert.deepEqual(p.data.items.map(i=>i.check),['generated modules','data','draft','runtime build','guide portraits','main merged','uncommitted']);
 assert.equal(p.data.items.find(i=>i.check==='draft').ok,true);
 assert.match(p.data.next,/update World.*publish_draft.*render-resident-guide.*build:runtime.*never -A/);
});

test('the headless page\'s server serves only World and Studio, never a path that climbs out',async()=>{
 const server=await serveGame({root:resolve(town,'..'),mounts:['johansson-town','avatar-creator']});
 try{
  const status=async path=>(await fetch(new URL(path,server.url))).status;
  assert.equal(await status('avatar-creator/index.html'),200);
  for(const path of ['johansson-town/%2e%2e%2f.mcp.json','avatar-creator/..%2f.git/config','johansson-town/%2e%2e%2f%2e%2e%2fetc/passwd'])assert.equal(await status(path),403,path);
  for(const path of ['.mcp.json','johansson-town-x/index.html','.git/config'])assert.equal(await status(path),404,path);
 }finally{await server.close();}
});

test('products: list, get with its references, change a price (dry run, draft, publish, and back), add a flavour, and refusals in words',async()=>{
 const products=()=>readFile(resolve(root,PATHS.products),'utf8');
 const list=await call('product_list',{zone:'drinks'});
 assert.equal(list.data.count,8);assert.match(list.data.room,/^4 more products and 30 more flavours fit/);
 const beerRow=list.data.products.find(p=>p.id==='beer');
 assert.deepEqual([beerRow.brand,beerRow.label,beerRow.flavours,beerRow.unpublished],['UMINEKO · Beer','painted',['Dry','Black'],false]);
 assert.match(beerRow.where,/cold cabinet, column 3 .*nearest the till.*shelves 0, 1, 2/);
 assert.equal((await call('product_list',{query:'umineko'})).data.products[0].id,'beer');
 const got=await call('product_get',{id:'Umineko lager'});
 assert.equal(got.data.id,'beer','a product is found by its name too');
 assert.ok(got.data.references.code.some(r=>/^src\/game\.js:\d+ /.test(r))&&got.data.references.code.some(r=>/^src\/people\/friendship\.js:\d+ /.test(r)),'the literals the plan names');
 assert.ok(got.data.references.accounts.some(a=>/^Sato Ramen \(from sakura\): Umineko lager/.test(a)),'the bars’ drink is Sakura Trading’s since Higa Liquor closed');
 assert.ok(got.data.references.drawings.some(r=>/sakura-backroom\.js/.test(r)),'the backroom crates its label does not reach');
 assert.match(got.data.retire,/^Refused while \d+ code lines/);assert.ok(got.data.findings.some(f=>/blue/.test(f)));
 const dry=await call('product_update',{id:'beer',set:{price:240},note:'The new excise on beer this autumn.'});
 assert.equal(dry.data.ok,true,JSON.stringify(dry.data.problems));assert.equal(dry.data.applied,false);assert.equal(dry.data.product.price,240);
 assert.equal(await products(),productsText,'a dry run writes nothing');
 assert.equal((await call('product_update',{id:'beer',set:{price:240},note:'The new excise on beer this autumn.',dryRun:false})).data.applied,true);
 assert.equal((await call('product_get',{id:'beer'})).data.unpublished,true);assert.equal(await products(),productsText,'yes goes to the draft');
 const preview=await call('publish_draft');assert.deepEqual(preview.data.products,[{id:'beer',name:'Umineko lager',what:'changed',fields:['price']}]);
 assert.equal((await call('publish_draft',{dryRun:false})).data.applied,true);
 assert.equal(JSON.parse(await products()).products.find(p=>p.id==='beer').price,240);
 assert.equal((await call('product_update',{id:'beer',set:{price:220},note:'Back to the old price again.',dryRun:false})).data.applied,true);
 assert.equal((await call('publish_draft',{dryRun:false})).data.applied,true);assert.equal(await products(),productsText);
 const lemon=await call('product_add',{as:'flavour',from:'beer',product:{name:'Lemon',hue:60},place:{mode:'flavour'},note:'A lemon shandy for the summer festival.',dryRun:false});
 assert.equal(lemon.data.applied,true,JSON.stringify(lemon.data.problems));assert.deepEqual(lemon.data.product.cells.flavours.map(f=>f.name),['Dry','Black','Lemon']);
 assert.deepEqual((await call('product_get',{id:'beer'})).data.cells.flavours.at(-1),'Lemon: cell 50 of the right half, hue +60°','the lowest free cell of the right half');
 const retire=await call('product_retire',{id:'beer',why:'The creator wants a different beer.',shelfTo:'milk'});
 assert.equal(retire.data.ok,false);assert.match(retire.data.problems.join(' '),/cannot be retired yet.*friendship\.js:\d+/);
 const brand=await call('product_update',{id:'beer',set:{'brand.line':'Orion lager'},note:'Trying a real brand on the can.'});
 assert.match(brand.data.problems.join(' '),/"orion" is a real brand/);
 const locked=await call('product_update',{id:'beer',set:{inventoryName:'Lager'},note:'Trying to rename the save key.'});
 assert.match(locked.data.problems.join(' '),/what old saves keep in the bag/);
 // The tools that draw are refused in words before any browser starts (tools/studio/smoke.mjs draws with them).
 assert.match((await call('render_product',{})).data.error,/either an id or a draft/);
 const notPicture=await call('product_label_picture',{id:'beer',image:Buffer.from('#!/bin/sh\nrm -rf /').toString('base64'),words:[],note:'A picture that is not one.'});
 assert.match(notPicture.data.problems.join(' '),/not a PNG, JPEG or WebP/);
 const v=await call('validate',{target:'products'});assert.equal(v.data.products.ok,true,JSON.stringify(v.data.products));
 assert.equal((await call('discard_draft',{all:true,dryRun:false})).data.applied,true);assert.equal(await products(),productsText);
});
