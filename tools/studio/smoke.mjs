#!/usr/bin/env node
/**
 * Smoke test for the johansson-studio MCP server, with a real MCP client over stdio and real Chromium:
 *   node --test johansson-town/tools/studio/smoke.mjs        (npm run studio:smoke in johansson-town)
 * 1. Against this checkout: initialize in under 2 s, every tool listed, the read tools and dry runs called (the data
 *    files must not change by a byte), and three portraits rendered in headless Studio (the same recipe twice gives
 *    the same pixels). The renders are deleted afterwards.
 * 2. A picture with a location hidden in it comes back from Chromium as a WebP with only its pixels; one that claims
 *    to be 30000 pixels wide is refused before anything decodes it.
 * 3. Against a throwaway copy of the data (only under node --test): apply a look (it goes to the draft only), publish
 *    it, reset it, publish again, and looks.json is byte-identical again.
 * 4. Against a throwaway copy of Sakura's products (only under node --test): the beer gets a designed label (baked in
 *    headless Studio), a picture label (its hidden location gone), a flavour and a new line; publishing writes only
 *    Studio's allowlisted files; and World's own label atlas, drawn with the published data in Chromium, differs from
 *    today's only inside the beer's cell and its two flavour cells.
 */
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,copyFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {CODE_ROOT,PATHS,jsonText} from './repo.mjs';
import {looksModule,charactersModule} from './build-data.mjs';

const server=fileURLToPath(new URL('./server.mjs',import.meta.url));
const clients=[],made=[];
after(async()=>{for(const c of clients)await c.close().catch(()=>{});for(const p of made)await unlink(p).catch(()=>{});});
async function connect(env={}){
 const client=new Client({name:'johansson-studio-smoke',version:'1'});clients.push(client);
 const {JOHANSSON_STUDIO_ROOT,...rest}=process.env;
 const transport=new StdioClientTransport({command:process.execPath,args:[server],cwd:CODE_ROOT,env:{...rest,...env},stderr:'inherit'});
 const t=performance.now();await client.connect(transport);return {client,ms:performance.now()-t};
}
const callWith=client=>async(name,args={})=>{const r=await client.callTool({name,arguments:args},{timeout:240000});return r;};
const json=r=>JSON.parse(r.content.find(c=>c.type==='text').text);
const files=()=>Promise.all([PATHS.looks,PATHS.log,PATHS.looksModule,PATHS.charactersModule,PATHS.draft].map(p=>readFile(resolve(CODE_ROOT,p),'utf8').catch(()=>null)));

test('this checkout: fast start, every tool, nothing written, portraits from headless Studio',async()=>{
 const before=await files(),{client,ms}=await connect();
 assert.ok(ms<2000,`initialize took ${Math.round(ms)} ms (must be under 2 s)`);
 const {tools}=await client.listTools();
 assert.deepEqual(tools.map(t=>t.name).sort(),['character_create','character_delete','character_get','character_list','character_reset','character_update','discard_draft',
  'product_add','product_get','product_label_picture','product_list','product_retire','product_update','publish_check','publish_draft','render_portrait','render_product','validate']);
 const call=callWith(client);
 const {RESIDENT_NAMES}=await import('../../src/avatars/cast.js');
 assert.ok(json(await call('character_list')).count>=RESIDENT_NAMES.length);
 assert.equal(json(await call('character_get',{name:'Mr Fujita'})).name,'Mr Fujita');
 assert.equal(json(await call('character_update',{name:'Mr Fujita',set:{'outfit.hat':'captain'},note:'A dry run from the smoke test.'})).dryRun,true);
 assert.equal(json(await call('character_create',{name:'Smoke',card:{role:'Test',why:'Only a dry run of the smoke test.'}})).dryRun,true);
 assert.equal((await call('character_delete',{id:'Mr Fujita'})).isError,true);
 assert.equal(json(await call('validate',{target:'looks'})).ok,true);
 assert.ok(json(await call('publish_check',{tests:false})).items.length>=7);
 assert.equal(json(await call('publish_draft')).dryRun,true);
 const portraits=[];
 for(const args of [{name:'Mr Fujita',size:256},{name:'Thuan',view:'quarter',framing:'face',size:256},{name:'Mr Fujita',size:256},{recipe:{name:'Draft',hair:{style:'afro'}},view:'left',pose:'Wave',expression:'happy',size:256}]){
  const r=await call('render_portrait',args);assert.notEqual(r.isError,true,JSON.stringify(r.content));
  const image=r.content.find(c=>c.type==='image'),data=json(r),png=Buffer.from(image.data,'base64');
  assert.equal(image.mimeType,'image/png');assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);
  made.push(resolve(CODE_ROOT,data.path));portraits.push(png);
 }
 assert.ok(portraits[0].equals(portraits[2]),'the same recipe and options give the same pixels');
 // Every view of a product, drawn by World's own code in headless Studio.
 for(const [view,w,h] of [['front',256,256],['back',256,256],['turn',1024,256],['shelf',256,256],['flat',1024,512],['cell',768,128]]){
  const r=await call('render_product',{id:'beer',view,size:256});assert.notEqual(r.isError,true,JSON.stringify(r.content));
  const png=Buffer.from(r.content.find(c=>c.type==='image').data,'base64'),data=json(r);
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[w,h],view);made.push(resolve(CODE_ROOT,data.path));
 }
 assert.ok(!portraits[0].equals(portraits[1]));
 assert.deepEqual(await files(),before,'reading, dry runs and renders never change Studio\'s data');
});

test('a picture is re-encoded to WebP in Chromium, and what was hidden in it (a GPS note) is gone',async()=>{
 const {StudioPage}=await import('./page.mjs'),{crc32}=await import('node:zlib'),page=new StudioPage();
 try{
  const png=await page.renderPortrait({name:'Smoke'},{size:128});
  // A tEXt chunk after IHDR, the way a phone or an editor leaves a location in a PNG.
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),out=Buffer.alloc(body.length+8);out.writeUInt32BE(data.length,0);body.copy(out,4);out.writeUInt32BE(crc32(body)>>>0,body.length+4);return out;};
  const hidden=Buffer.concat([png.subarray(0,33),chunk('tEXt',Buffer.from('GPSLatitude\u000026.2124 N, 127.6792 E')),png.subarray(33)]);
  assert.ok(hidden.includes('GPSLatitude'));
  const {bytes,width,height}=await page.reencodeWebp(hidden,{maxSide:64});
  assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.deepEqual([width,height],[64,64]);
  assert.ok(!bytes.includes('GPSLatitude'),'only the pixels survive');
  const huge=Buffer.from(png);huge.writeUInt32BE(30000,16);huge.writeUInt32BE(30000,20);
  await assert.rejects(page.reencodeWebp(huge),/30000 × 30000 pixels/);
 }finally{await page.close();}
});

test('a throwaway copy: apply a look, reset it, and looks.json is byte-identical',{skip:!process.env.NODE_TEST_CONTEXT&&'run with node --test to point the server at a throwaway copy'},async()=>{
 const root=await mkdtemp(join(tmpdir(),'studio-smoke-'));
 try{
  await mkdir(resolve(root,'johansson-town/data/studio'),{recursive:true});await mkdir(resolve(root,'johansson-town/src/avatars'),{recursive:true});
  const original=await readFile(resolve(CODE_ROOT,PATHS.looks),'utf8');
  await mkdir(resolve(root,'johansson-town/src/studio'),{recursive:true});
  await writeFile(resolve(root,PATHS.looks),original);await writeFile(resolve(root,PATHS.looksModule),looksModule(original));await writeFile(resolve(root,PATHS.charactersModule),charactersModule(original));
  await writeFile(resolve(root,PATHS.log),jsonText({format:'johansson-studio-log',version:1,changes:[]}));await copyFile(resolve(CODE_ROOT,PATHS.brands),resolve(root,PATHS.brands));
  const {client}=await connect({JOHANSSON_STUDIO_ROOT:root}),call=callWith(client);
  const name=json(await call('character_list',{group:'townsfolk'})).characters.find(c=>!c.edited).name;
  const done=json(await call('character_update',{name,set:{'outfit.hat':'captain'},note:'Applied by the smoke test, then reset.',dryRun:false}));
  assert.equal(done.applied,true,JSON.stringify(done));
  assert.equal(await readFile(resolve(root,PATHS.looks),'utf8'),original,'yes goes to the draft, not to World\'s data');
  assert.equal(json(await call('publish_draft',{dryRun:false})).applied,true);
  assert.notEqual(await readFile(resolve(root,PATHS.looks),'utf8'),original);
  assert.equal(json(await call('character_reset',{name,dryRun:false})).applied,true);
  assert.equal(json(await call('publish_draft',{dryRun:false})).applied,true);
  assert.equal(await readFile(resolve(root,PATHS.looks),'utf8'),original);
  assert.equal(JSON.parse(await readFile(resolve(root,PATHS.log),'utf8')).changes.length,2);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('a throwaway copy of the products: a designed label for the beer changes only its cell and its flavours\' cells',{skip:!process.env.NODE_TEST_CONTEXT&&'run with node --test to point the server at a throwaway copy',timeout:1800000},async()=>{
 const {productsModule}=await import('./build-data.mjs'),{readdir}=await import('node:fs/promises');
 const root=await mkdtemp(join(tmpdir(),'studio-smoke-shop-'));
 try{
  for(const folder of ['data/studio','src/avatars','src/studio','src/commerce'])await mkdir(resolve(root,'johansson-town',folder),{recursive:true});
  const looks=await readFile(resolve(CODE_ROOT,PATHS.looks),'utf8'),products=await readFile(resolve(CODE_ROOT,PATHS.products),'utf8');
  await writeFile(resolve(root,PATHS.looks),looks);await writeFile(resolve(root,PATHS.looksModule),looksModule(looks));await writeFile(resolve(root,PATHS.charactersModule),charactersModule(looks));
  await writeFile(resolve(root,PATHS.products),products);await writeFile(resolve(root,PATHS.productsModule),productsModule(products));
  await writeFile(resolve(root,PATHS.log),jsonText({format:'johansson-studio-log',version:1,changes:[]}));await copyFile(resolve(CODE_ROOT,PATHS.brands),resolve(root,PATHS.brands));
  // Pictures to look at go to the data root's own output/studio-mcp (git ignores it); everything else is compared.
  const list=async()=>{const out=[];async function scan(d){for(const e of await readdir(d,{withFileTypes:true})){const p=resolve(d,e.name);if(e.isDirectory())await scan(p);else out.push(p.slice(root.length+1));}}await scan(root);return out.filter(p=>!p.startsWith('output/')).sort();};
  const before=await list(),{client}=await connect({JOHANSSON_STUDIO_ROOT:root}),call=callWith(client);
  // The design: the brand's own band and wordmark, in a deep navy, with the illustration; the painting stays under.
  const spec={v:1,base:'painted',layers:[{type:'band',y:0,h:.24,colour:'#1f3352'},{type:'text',text:'UMINEKO',font:'gothic',x:.5,y:.12,size:.15,colour:'paper',weight:'bold',align:'center',maxWidth:.3},
   {type:'shape',shape:'roundel',x:.33,y:.55,w:.13,h:.26,colour:'accent'},{type:'text',text:'Autumn',font:'maru',x:.33,y:.55,size:.055,colour:'#ffffff',align:'center',maxWidth:.1}]};
  const dry=await call('product_update',{id:'beer',set:{label:{source:'designed',spec}},note:'An autumn label for the harbour festival.'});
  assert.notEqual(dry.isError,true,JSON.stringify(dry.content));
  const baked=Buffer.from(dry.content.find(c=>c.type==='image').data,'base64');assert.deepEqual([baked.readUInt32BE(16),baked.readUInt32BE(20)],[1024,512],'the label is baked at 1024 × 512');
  assert.equal(json(dry).dryRun,true);assert.deepEqual(await list(),before,'a dry run writes nothing but a picture to look at');
  assert.match(json(dry).baked,/^output\/studio-mcp\/labels\/beer-label-/);
  const yes=json(await call('product_update',{id:'beer',set:{label:{source:'designed',spec}},note:'An autumn label for the harbour festival.',dryRun:false}));
  assert.equal(yes.applied,true,JSON.stringify(yes));
  assert.deepEqual(await list(),[...before,PATHS.draft].sort(),'yes writes only the draft');
  const label=JSON.parse(await readFile(resolve(root,PATHS.draft),'utf8')).changes[0].ops[0].set.label;
  assert.match(label.image,/^labels\/beer\.r1\.webp$/);assert.equal(label.bakedOn,'Chromium');
  // A picture label with a location hidden in it: only its pixels are kept.
  const {crc32}=await import('node:zlib'),{PNG}=await import('pngjs'),photo=new PNG({width:800,height:400});
  for(let i=0;i<photo.data.length;i+=4){photo.data[i]=i/4%800/4|0;photo.data[i+1]=120;photo.data[i+2]=200;photo.data[i+3]=255;}
  const plain=PNG.sync.write(photo),chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),o=Buffer.alloc(body.length+8);o.writeUInt32BE(data.length,0);body.copy(o,4);o.writeUInt32BE(crc32(body)>>>0,body.length+4);return o;};
  const hidden=Buffer.concat([plain.subarray(0,33),chunk('tEXt',Buffer.from('GPSLatitude\u000026.2124 N, 127.6792 E')),plain.subarray(33)]);
  const picture=await call('product_label_picture',{id:'water',image:hidden.toString('base64'),words:['Mizunowa','Spring water'],note:'The creator\'s photo of the spring above the harbour.',dryRun:false});
  assert.notEqual(picture.isError,true,JSON.stringify(picture.content));assert.equal(json(picture).applied,true,JSON.stringify(json(picture)));
  const refused=json(await call('product_label_picture',{id:'water',image:plain.toString('base64'),words:['ORION'],note:'A picture that says a real brand.'}));
  assert.match(refused.problems.join(' '),/"orion" is a real brand/);
  const flavour=json(await call('product_add',{as:'flavour',from:'beer',product:{name:'Lemon',hue:60},place:{mode:'flavour'},note:'A lemon shandy for the summer festival.',dryRun:false}));
  assert.equal(flavour.applied,true,JSON.stringify(flavour));
  const mints=await call('product_add',{as:'product',from:'candy',product:{id:'mints',name:'Harbour mints',jp:'Mints',price:100,text:'KAZEMARU · Harbour mints',
   brand:{name:'KAZEMARU',jp:'Kazemaru',line:'Peppermints',paper:'#d9eef0',ink:'#1f4f6b',accent:'#5fa8c4',symbol:'wave'},pack:{shape:'box',size:[.06,.09,.02],net:'30g',flash:'Strong',tag:'For the ferry',art:'candy'},
   purpose:{zone:'daily',for:['Bus driver','Harbour master'],why:'Peppermints for a long shift at the wheel or on the quay.',placed:'Beside the batteries, by the till, where a driver pays.'}},
   place:{mode:'share',target:'battery'},note:'Peppermints for the drivers and the harbour master.',dryRun:false});
  assert.notEqual(mints.isError,true,JSON.stringify(mints.content));assert.equal(json(mints).applied,true,JSON.stringify(json(mints)));
  const shelf=await call('render_product',{id:'beer',view:'shelf',size:256});assert.notEqual(shelf.isError,true,JSON.stringify(shelf.content));
  const retire=json(await call('product_retire',{id:'beer',why:'The creator wants a different beer.',shelfTo:'milk'}));
  assert.match(retire.problems.join(' '),/cannot be retired yet/);
  const published=json(await call('publish_draft',{dryRun:false}));
  assert.equal(published.applied,true,JSON.stringify(published));
  const after=await list(),added=after.filter(p=>!before.includes(p)),{writable}=await import('./repo.mjs');
  assert.deepEqual(added,['johansson-town/assets/graphics/labels/beer.r1.webp','johansson-town/assets/graphics/labels/mints.r1.webp','johansson-town/assets/graphics/labels/water-picture.r1.webp','johansson-town/assets/graphics/labels/water.r1.webp',PATHS.draft].sort());
  for(const path of after.filter(p=>p!==PATHS.lock))assert.ok(before.includes(path)||writable(path),`${path} is on Studio's allowlist`);
  const kept=await readFile(resolve(root,'johansson-town/assets/graphics/labels/water-picture.r1.webp'));
  assert.equal(kept.subarray(8,12).toString(),'WEBP');assert.ok(!kept.includes('GPSLatitude'),'no location reaches the repository');
  const data=JSON.parse(await readFile(resolve(root,PATHS.products),'utf8'));
  assert.equal(await readFile(resolve(root,PATHS.productsModule),'utf8'),productsModule(jsonText(data)));
  // The acceptance: World's own atlas with only the beer's new label (and its flavours) against today's, pixel by pixel.
  const one=JSON.parse(products);one.products[one.products.findIndex(p=>p.id==='beer')]=data.products.find(p=>p.id==='beer');
  one.products.find(p=>p.id==='beer').cells.flavours=JSON.parse(products).products.find(p=>p.id==='beer').cells.flavours;
  const {atlasDifference}=await import('./label-acceptance.mjs');
  const diff=await atlasDifference({products:jsonText(one),labels:resolve(root,'johansson-town/assets/graphics/labels')});
  assert.ok(diff.cells.length,'the beer\'s cell changed');
  assert.deepEqual(diff.cells.map(c=>`${c.half}:${c.cell}`).sort(),['left:10','right:27','right:28'],`only the beer's cell and its flavours' cells differ (${JSON.stringify(diff.cells)})`);
 }finally{await rm(root,{recursive:true,force:true});}
});
