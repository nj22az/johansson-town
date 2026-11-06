import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink,readdir,copyFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openRepo,writable,defaultRoot,CODE_ROOT,PATHS,jsonText} from '../tools/studio/repo.mjs';
import {applyChange,publishDraft,discardDraft,readData} from '../tools/studio/apply.mjs';
import {looksModule,charactersModule} from '../tools/studio/build-data.mjs';
import {validateChange,validateLooks,brandProblems,pictureProblems,pictureSize,sizeProblems} from '../src/studio/rules.js';
import {applyOps} from '../src/studio/change.js';
import {baseRecipe,RESIDENT_GROUPS} from '../src/avatars/cast.js';
import {sha256,recordSha256} from '../src/studio/sha256.js';

// Every write here goes to a throwaway copy of Studio's data, never to the checkout.
const town=fileURLToPath(new URL('../',import.meta.url)),run=promisify(execFile);
const EMPTY={format:'johansson-looks',version:1,looks:{},characters:{}};
const LOG={format:'johansson-studio-log',version:1,changes:[]};
/** A throwaway data root: Studio's data, its brand rules and World's generated modules. */
async function makeRoot(prefix,looks=EMPTY){
 const root=await mkdtemp(join(tmpdir(),prefix)),text=jsonText(looks);
 for(const folder of ['data/studio','src/avatars','src/studio'])await mkdir(resolve(root,'johansson-town',folder),{recursive:true});
 await writeFile(resolve(root,PATHS.looks),text);await writeFile(resolve(root,PATHS.log),jsonText(LOG));
 await copyFile(resolve(town,'data/studio/brand-rules.json'),resolve(root,PATHS.brands));
 await writeFile(resolve(root,PATHS.looksModule),looksModule(text));await writeFile(resolve(root,PATHS.charactersModule),charactersModule(text));
 return root;
}
let root,repo,original;
before(async()=>{root=await makeRoot('studio-apply-');repo=openRepo(root);original=jsonText(EMPTY);});
after(()=>rm(root,{recursive:true,force:true}));

let n=0;
const change=(ops,extra={})=>({format:'johansson-studio-change',version:1,id:`2026-10-12T09-14Z-test-${++n}`,made:'2026-10-12T09:14:00Z',by:'claude',note:'A test of the Studio change file.',ops,...extra});
const fujita=baseRecipe('Mr Fujita');
const captain={op:'look.set',name:'Mr Fujita',set:{'outfit.hat':'captain'},was:{'outfit.hat':fujita.outfit.hat}};
const card={role:'Visiting cousin',why:'Thao\'s cousin from Naha, for the summer festival stories.'};
async function snapshot(at=root){
 const out={};
 async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())await scan(p);else out[p.slice(at.length)]=e.isSymbolicLink()?'link':await readFile(p,'utf8');}}
 await scan(at);return out;
}
const read=(path,at=root)=>readFile(resolve(at,path),'utf8');
const sentences=r=>[...(r.problems||[]),...(r.conflicts||[])].map(p=>p.sentence).join(' ');
const draftChanges=async(at=root)=>JSON.parse(await read(PATHS.draft,at).catch(()=>'{"changes":[]}')).changes;

test('a dry run writes nothing; yes puts it in the draft only; publishing writes World\'s data; reset and publish give the same bytes back',async()=>{
 const before=await snapshot();
 const dry=await applyChange(change([captain]),{repo});
 assert.equal(dry.ok,true,sentences(dry));assert.equal(dry.applied,false);assert.deepEqual(dry.writes,[PATHS.draft]);
 assert.deepEqual(await snapshot(),before,'a dry run must not touch a file');
 const done=await applyChange(change([captain],{note:'He skippered the old ferry once.'}),{repo,dryRun:false});
 assert.equal(done.applied,true,sentences(done));
 assert.equal(await read(PATHS.looks),original,'a change the creator said yes to stays out of World\'s data (and out of git)');
 assert.equal(await read(PATHS.looksModule),before['/'+PATHS.looksModule],'World\'s module is untouched until publishing');
 assert.equal((await draftChanges()).length,1);
 const seen=await readData(repo);
 assert.deepEqual(seen.looks.looks['Mr Fujita'],{set:{'outfit.hat':'captain'},notes:{'outfit.hat':'He skippered the old ferry once.'},made:'2026-10-12T09:14:00Z'});
 // The same steps again change nothing (Studio already has them).
 const again=await applyChange(change([captain]),{repo,dryRun:false});assert.equal(again.applied,false);assert.match(again.nothing,/already/);
 const preview=await publishDraft({repo});
 assert.equal(preview.ok,true,sentences(preview));assert.equal(preview.applied,false);
 assert.deepEqual(preview.people,[{name:'Mr Fujita',kind:'resident',fields:[{path:'outfit.hat',from:'as World draws them',to:'captain'}]}]);
 assert.deepEqual(preview.writes,[PATHS.looksModule,PATHS.looks,PATHS.log,PATHS.draft],'only the module that changes is written');
 const published=await publishDraft({repo,dryRun:false});assert.equal(published.applied,true,sentences(published));
 const looksText=await read(PATHS.looks),log=JSON.parse(await read(PATHS.log));
 assert.deepEqual(JSON.parse(looksText).looks['Mr Fujita'].set,{'outfit.hat':'captain'});
 assert.equal(await read(PATHS.looksModule),looksModule(looksText));assert.equal(await read(PATHS.charactersModule),charactersModule(looksText));
 assert.equal(log.changes.length,1);assert.equal(log.changes[0].id,done.id);assert.ok(log.changes[0].published);
 assert.deepEqual(log.changes[0].inverse,[{op:'look.set',name:'Mr Fujita',set:{'outfit.hat':fujita.outfit.hat},was:{'outfit.hat':'captain'}}]);
 assert.deepEqual(await draftChanges(),[],'the draft is empty once published');
 const reset=await applyChange(change([{op:'look.reset',name:'Mr Fujita',was:{'outfit.hat':'captain'}}]),{repo,dryRun:false});
 assert.equal(reset.applied,true,sentences(reset));
 assert.equal((await publishDraft({repo,dryRun:false})).applied,true);
 assert.equal(await read(PATHS.looks),original,'apply then reset gives back the same bytes');
 const after=JSON.parse(await read(PATHS.log));assert.equal(after.changes.length,2);assert.equal(after.changes[1].after.looks,sha256(original));
 assert.equal((await publishDraft({repo})).nothing.includes('draft is empty'),true);
});

test('each field keeps the reason it was changed, and loses it when it goes back to how World draws it',()=>{
 const data={looks:structuredClone(EMPTY)};
 const one=applyOps(data,[captain],{made:'m1',note:'He skippered the old ferry once.'}).data;
 const two=applyOps(one,[{op:'look.set',name:'Mr Fujita',set:{'hair.colour':'#9a9a96'},was:{'hair.colour':fujita.hair.colour},note:'Grey from forty years at sea.'}],{made:'m2',note:'Another change of his.'}).data;
 assert.deepEqual(two.looks.looks['Mr Fujita'].notes,{'hair.colour':'Grey from forty years at sea.','outfit.hat':'He skippered the old ferry once.'});
 const three=applyOps(two,[{op:'look.set',name:'Mr Fujita',set:{'outfit.hat':fujita.outfit.hat},was:{'outfit.hat':'captain'}}],{made:'m3',note:'The hat goes back again.'}).data;
 assert.deepEqual(three.looks.looks['Mr Fujita'],{set:{'hair.colour':'#9a9a96'},notes:{'hair.colour':'Grey from forty years at sea.'},made:'m3'});
 assert.deepEqual(data.looks.looks,{},'applyOps never changes its input');
});

test('a stale `was` is a conflict, reported field by field, and nothing is overwritten',async()=>{
 const before=await snapshot();
 const r=await applyChange(change([{op:'look.set',name:'Mr Fujita',set:{'outfit.hat':'captain','hair.colour':'#3a2618'},was:{'outfit.hat':'cap','hair.colour':fujita.hair.colour}}]),{repo,dryRun:false});
 assert.equal(r.ok,false);assert.equal(r.conflicts.length,1);assert.equal(r.conflicts[0].path,'outfit.hat');
 assert.match(r.conflicts[0].sentence,/Mr Fujita's outfit\.hat is now "none", not "cap"/);
 assert.deepEqual(await snapshot(),before);
});

test('refuses unknown keys and steps, names that are nobody, ages, real brands, and changes over the limits, in plain words',async()=>{
 const before=await snapshot(),age=name=>({op:'look.set',name,set:{age:'child'},was:{age:baseRecipe(name).age}});
 const create=(character,id='newcomer')=>({op:'character.create',id,character:{recipe:{},card,...character}});
 const cases=[
  [change([captain],{extra:1}),/field Studio does not know: "extra"/],
  [change([{...captain,colour:'red'}]),/field Studio does not know: "colour"/],
  [change([{op:'look.delete',name:'Mr Fujita'}]),/"look.delete" is not a Studio step/],
  ...['constructor','__proto__','toString','hasOwnProperty'].map(op=>[change([{op,name:'Mr Fujita'}]),/is not a Studio step/]),
  [change([{...captain,name:'Mr Nobody'}]),/"Mr Nobody" is not a resident World knows/],
  [change([{...captain,name:'Yuri'}]),/Yuri is now called Thuan/],
  [change([{...captain,name:'Harbour visitor'}]),/starting template in the maker/],
  [change([{...captain,set:{'outfit.tophat':'x'},was:{'outfit.tophat':'none'}}]),/not a part of a look/],
  ...['constructor','valueOf'].map(path=>[change([{...captain,set:{[path]:.5},was:{[path]:.5}}]),/not a part of a look/]),
  [change([{...captain,set:{'outfit.hat':'tophat'}}]),/"tophat" is not a choice for outfit.hat/],
  [change([{...captain,set:{'hair.colour':'red'},was:{'hair.colour':fujita.hair.colour}}]),/colour written #rrggbb/],
  [change([age('Mr Fujita')]),/Mr Fujita is 73 in World, so is drawn as an elder; a look cannot make them a child/],
  ...['Grandmother Higa','Thuan','Nhung','Johansson'].map(name=>[change([age(name)]),new RegExp(`${name} is (\\d+ in World, so is )?drawn as an (adult|elder)( in World)?; a look cannot make them a child`)]),
  [change([{...captain,was:{}}]),/was is empty/],
  [change([{...captain,was:{'hair.colour':fujita.hair.colour}}]),/was must give today's value/],
  [change([{...captain,note:'hat'}]),/at least 4 words/],
  [change([create({name:'Orion Girl'})]),/"orion" is a real brand/],
  [change([create({name:'Sora',card:{role:'Orion beer rep',why:card.why}})]),/"orion" is a real brand/],
  [change([create({name:'Aya'})]),/Aya is the name World used to give Nhung/],
  [change([create({name:'thao'})]),/Thao already lives in World/],
  [change([create({name:'harbour visitor'})]),/Harbour visitor is a name World already uses/],
  [change([create({name:'Sora'},'constructor')]),/"constructor" is a word Studio keeps for itself/],
  // Products are switched on in stage 2; this throwaway root has no products.json, so there is nothing to change.
  [change([{op:'product.update',id:'beer',set:{price:300},was:{price:220}}]),/no products to change here/],
  [change(Array.from({length:51},()=>captain)),/at most 50/],
  [change([captain],{note:'ok'}),/at least 4 words/],
  [change([captain],{note:'A <script> in the note here'}),/may not contain "<"/],
  [change([captain],{note:'A bell \u0007 in the note here'}),/control character/],
  [change([captain],{id:'../../etc/passwd'}),/id is not written the way it must be/],
  [{...change([captain]),format:'something-else'},/format must be/],
 ];
 for(const [file,expected] of cases){const r=await applyChange(file,{repo,dryRun:false});assert.equal(r.ok,false,String(expected));assert.match(sentences(r),expected);}
 // A step with a name every object has is plain "not a step", never a crash, also in validate (target change).
 for(const op of ['constructor','__proto__','toString'])assert.match(validateChange(change([{op}])).problems[0].sentence,/is not a Studio step/);
 assert.deepEqual(await snapshot(),before,'a refused change writes nothing');
});

test('an id is used once: a change file that reuses one is refused when applied (a dry run warns); the tools get the next free one',async()=>{
 const hat=(to,from)=>({op:'look.set',name:'Mrs Sato',set:{'outfit.hat':to},was:{'outfit.hat':from}}),sato=baseRecipe('Mrs Sato').outfit.hat;
 const first=await applyChange(change([hat('straw',sato)],{id:'2026-10-12T09-15Z-mrs-sato'}),{repo,dryRun:false});
 assert.equal(first.applied,true,sentences(first));
 const reused=change([hat('cap','straw')],{id:'2026-10-12T09-15Z-mrs-sato'});
 const dry=await applyChange(reused,{repo});
 assert.equal(dry.ok,true);assert.match(dry.warnings.map(w=>w.sentence).join(' '),/already used the id 2026-10-12T09-15Z-mrs-sato.*would be refused/);
 const refused=await applyChange(reused,{repo,dryRun:false});assert.equal(refused.ok,false);assert.match(sentences(refused),/Give this change an id of its own/);
 const next=await applyChange(reused,{repo,dryRun:false,uniqueId:true});
 assert.equal(next.applied,true,sentences(next));assert.equal(next.id,'2026-10-12T09-15Z-mrs-sato-2');
 assert.deepEqual((await draftChanges()).map(c=>c.id),['2026-10-12T09-15Z-mrs-sato','2026-10-12T09-15Z-mrs-sato-2']);
 const back=await applyChange(change([hat(sato,'cap')]),{repo,dryRun:false});assert.equal(back.applied,true);
 assert.equal((await publishDraft({repo,dryRun:false})).applied,true);
 assert.equal(await read(PATHS.looks),original);
});

test('names every object has are nobody: "constructor" is never a character, and deleting it changes nothing',async()=>{
 const data={looks:structuredClone(EMPTY)};
 const gone=applyOps(data,[{op:'character.delete',id:'constructor',was:sha256('null')}]);
 assert.equal(gone.results[0].status,'unchanged');assert.deepEqual(gone.data,{looks:EMPTY});
 assert.equal(applyOps(data,[{op:'character.set',id:'constructor',set:{'hair.style':'bob'},was:{'hair.style':'crop'}}]).results[0].status,'conflict');
 assert.equal(applyOps(data,[{op:'look.reset',name:'constructor',was:{}}]).results[0].status,'unchanged');
 assert.equal(applyOps(data,[{op:'hasOwnProperty'}]).results[0].status,'conflict');
 const before=await snapshot();
 const r=await applyChange(change([{op:'character.delete',id:'constructor',was:sha256('null')}]),{repo,dryRun:false});
 assert.equal(r.ok,false);assert.match(sentences(r),/keeps for itself/);assert.deepEqual(await snapshot(),before);
});

test('a picture must really be a picture, of a sane size, match its checksum and be used by a step',()=>{
 const png=(w=1,h=1)=>{const b=new Uint8Array(33);b.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,0x49,0x48,0x44,0x52]);new DataView(b.buffer).setUint32(16,w);new DataView(b.buffer).setUint32(20,h);return b;};
 const b64=bytes=>Buffer.from(bytes).toString('base64'),one=png();
 assert.deepEqual(pictureProblems('beer.label.png',{sha256:sha256(one),data:b64(one)}),[]);
 assert.match(pictureProblems('beer.label.png',{sha256:sha256(one),data:b64(Buffer.from('#!/bin/sh\nrm -rf /'))})[0].sentence,/not a PNG, JPEG or WebP/);
 assert.match(pictureProblems('beer.label.png',{sha256:'0'.repeat(64),data:b64(one)})[0].sentence,/does not match its checksum/);
 assert.match(pictureProblems('beer.label.jpg',{sha256:sha256(one),data:b64(one)})[0].sentence,/really a PNG/);
 // A tiny file may claim to be enormous: the header is read before anything decodes it.
 const huge=png(30000,30000);assert.match(pictureProblems('beer.label.png',{sha256:sha256(huge),data:b64(huge)}).map(p=>p.sentence).join(' '),/30000 × 30000 pixels; a picture may be at most 8192/);
 assert.deepEqual(pictureSize(png(640,480)),{width:640,height:480});
 const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xe0,0,16,...Array(14).fill(0),0xff,0xc0,0,17,8,0x01,0xe0,0x02,0x80,3,...Array(9).fill(0)]);
 assert.deepEqual(pictureSize(jpeg),{width:640,height:480});
 const riff=(chunk,body)=>Uint8Array.from([...Buffer.from('RIFF'),0,0,0,0,...Buffer.from('WEBP'),...Buffer.from(chunk),0,0,0,0,...body]);
 assert.deepEqual(pictureSize(riff('VP8X',[0,0,0,0,0x7f,0x02,0,0xdf,0x01,0])),{width:640,height:480});
 assert.deepEqual(pictureSize(riff('VP8 ',[0,0,0,0x9d,0x01,0x2a,0x80,0x02,0xe0,0x01])),{width:640,height:480});
 const bits=(639)|(479<<14);assert.deepEqual(pictureSize(riff('VP8L',[0x2f,bits&255,bits>>8&255,bits>>16&255,bits>>>24])),{width:640,height:480});
 assert.match(sizeProblems('x.webp',{width:8000,height:8000})[0].sentence,/40 million pixels/);assert.match(sizeProblems('x.png',null)[0].sentence,/does not say how big/);
 const r=validateChange(change([captain],{files:{'beer.label.png':{sha256:sha256(one),data:b64(one)}}}));
 assert.match(r.problems.map(p=>p.sentence).join(' '),/No step in this change uses the picture/);
 assert.equal(validateChange(change([captain],{files:{'../beer.png':{sha256:sha256(one),data:b64(one)}}})).ok,false);
});

test('writes go only to Studio\'s own files, never through a path that climbs out, and all of a step or none of it',async()=>{
 for(const ok of [PATHS.looks,PATHS.log,PATHS.draft,PATHS.looksModule,PATHS.charactersModule,PATHS.productsModule,'johansson-town/assets/graphics/labels/beer.r2.webp','output/studio-mcp/portraits/mr-fujita-front-full-512.png'])assert.ok(writable(ok),ok);
 for(const bad of ['.mcp.json','.claude/settings.json','.github/workflows/johansson-town-live.yml','johansson-town/src/avatars/cast.js','johansson-town/data/studio/../../src/game.js',PATHS.lock,'johansson-town/data/studio/draft/other.json',
  '../outside.json','/etc/passwd','output/studio-mcp/../../x.png','johansson-town/assets/graphics/labels/Beer.r1.webp','johansson-town/assets/graphics/labels/beer.webp','output/studio-mcp/.hidden/x.png','johansson-town\\data\\studio\\looks.json'])
  assert.equal(writable(bad),false,bad);
 await assert.rejects(repo.write('johansson-town/data/studio/../../../../outside.json','x'),/may not write/);
 await assert.rejects(repo.write('.mcp.json','{}'),/may not write/);
 const before=await snapshot();
 await assert.rejects(repo.writeAll([[PATHS.looks,'changed'],['.mcp.json','{}']]),/may not write/);
 // The second file fails after the first is already written to its temporary file: neither target changes.
 await assert.rejects(repo.writeAll([[PATHS.looks,'changed'],[PATHS.log,12345]]));
 assert.deepEqual(await snapshot(),before,'no target changed and no temporary file is left');
});

test('a symbolic link anywhere on the way is refused, and nothing is written through it',async()=>{
 const outside=await mkdtemp(join(tmpdir(),'studio-outside-')),target=resolve(outside,'looks.json');
 try{
  // The data file itself is a link.
  await writeFile(target,original);const looks=resolve(root,PATHS.looks),kept=await readFile(looks,'utf8');
  await rm(looks);await symlink(target,looks);
  await assert.rejects(applyChange(change([captain]),{repo,dryRun:false}),/link/);
  assert.equal(await readFile(target,'utf8'),original,'the file behind the link is untouched');
  await rm(looks);await writeFile(looks,kept);
  // A folder on the way (src/avatars) is a link: publishing is refused before any file is written, so no half change.
  assert.equal((await applyChange(change([captain]),{repo,dryRun:false})).applied,true);
  const draft=await read(PATHS.draft),log=await read(PATHS.log);
  const avatars=resolve(root,'johansson-town/src/avatars'),moved=resolve(outside,'avatars');
  await mkdir(moved);await copyFile(resolve(avatars,'looks-data.js'),resolve(moved,'looks-data.js'));await rm(avatars,{recursive:true});await symlink(moved,avatars);
  await assert.rejects(publishDraft({repo,dryRun:false}),/link/);
  assert.equal(await readFile(looks,'utf8'),kept,'looks.json was not written either');
  assert.equal(await read(PATHS.log),log);assert.equal(await read(PATHS.draft),draft,'the draft keeps the change');
  await rm(avatars);await mkdir(avatars);await copyFile(resolve(moved,'looks-data.js'),resolve(avatars,'looks-data.js'));
  assert.equal((await discardDraft({all:true,repo,dryRun:false})).applied,true);
 }finally{await rm(outside,{recursive:true,force:true});}
});

test('Studio characters: created, changed and deleted; names are their own; a resident is never deleted',async()=>{
 const created=await applyChange(change([{op:'character.create',id:'sora',character:{name:'Sora',recipe:{hair:{style:'bob'}},card}}]),{repo,dryRun:false});
 assert.equal(created.applied,true,sentences(created));
 const twin=await applyChange(change([{op:'character.create',id:'sora-two',character:{name:'sora',recipe:{},card}}]),{repo,dryRun:false});
 assert.equal(twin.ok,false);assert.match(sentences(twin),/already called Sora \(id "sora"\)/);
 let looks=(await readData(repo)).looks;
 assert.equal(looks.characters.sora.recipe.hair.style,'bob');assert.equal(looks.characters.sora.recipe.name,'Sora');
 const changed=await applyChange(change([{op:'character.set',id:'sora',set:{'hair.style':'pigtails'},was:{'hair.style':'bob'}}]),{repo,dryRun:false});
 assert.equal(changed.applied,true,sentences(changed));
 assert.equal((await publishDraft({repo,dryRun:false})).applied,true);
 const module=await read(PATHS.charactersModule);assert.match(module,/"name": "Sora"/);
 assert.equal(await read(PATHS.looksModule),looksModule(original),'a Studio character never touches World\'s looks module (or the guide portraits)');
 looks=(await readData(repo)).looks;
 const stale=await applyChange(change([{op:'character.delete',id:'sora',was:'0'.repeat(64)}]),{repo,dryRun:false});
 assert.equal(stale.ok,false);assert.match(sentences(stale),/Sora has changed since/);
 const gone=await applyChange(change([{op:'character.delete',id:'sora',was:recordSha256(looks.characters.sora)}]),{repo,dryRun:false});
 assert.equal(gone.applied,true,sentences(gone));
 assert.equal((await publishDraft({repo,dryRun:false})).applied,true);
 assert.equal(await read(PATHS.looks),original);
 for(const bad of [{op:'character.create',id:'fujita',character:{name:'Mr Fujita',recipe:{},card}},{op:'character.create',id:'sora',character:{name:'Sora',recipe:{},card:{role:'x',why:'too short'}}},{op:'character.delete',id:'Mr Fujita',was:'0'.repeat(64)}]){
  const r=await applyChange(change([bad]),{repo,dryRun:false});assert.equal(r.ok,false,JSON.stringify(bad));
 }
});

test('discarding: a drafted change can be taken out, and one that no longer fits stops publishing until it is',async()=>{
 const sato=baseRecipe('Mrs Sato').outfit.hat;
 await applyChange(change([{op:'look.set',name:'Mrs Sato',set:{'outfit.hat':'straw'},was:{'outfit.hat':sato}}]),{repo,dryRun:false});
 await applyChange(change([{op:'look.set',name:'Mrs Sato',set:{'outfit.hat':'cap'},was:{'outfit.hat':'straw'}}]),{repo,dryRun:false});
 const [first,second]=await draftChanges();
 const dry=await discardDraft({ids:[first.id],repo});
 assert.equal(dry.applied,false);assert.match(dry.warnings.join(' '),new RegExp(`${second.id}.*no longer fits`));
 assert.equal((await discardDraft({ids:[first.id],repo,dryRun:false})).applied,true);
 const blocked=await publishDraft({repo,dryRun:false});
 assert.equal(blocked.ok,false);assert.deepEqual(blocked.stale,[second.id]);assert.match(sentences(blocked),/discard_draft/);
 assert.equal(await read(PATHS.looks),original,'nothing was published');
 assert.equal((await discardDraft({ids:['nobody'],repo})).ok,false);
 assert.equal((await discardDraft({all:true,repo,dryRun:false})).applied,true);
 assert.deepEqual(await draftChanges(),[]);
});

test('the published looks file is checked whole: notes for every field, dates, ages and names',()=>{
 const look=(extra={})=>({format:'johansson-looks',version:1,characters:{},looks:{'Mr Fujita':{set:{'outfit.hat':'captain'},notes:{'outfit.hat':'He skippered the old ferry once.'},made:'2026-10-12T09:14:00Z',...extra}}});
 assert.equal(validateLooks(look()).ok,true,validateLooks(look()).problems.map(p=>p.sentence).join(' '));
 const words=extra=>validateLooks(look(extra)).problems.map(p=>p.sentence).join(' ');
 assert.match(words({notes:{'outfit.hat':'<script>alert(1)</script>'}}),/may not contain "<"/);
 assert.match(words({notes:{'outfit.hat':'Hat.'}}),/at least 4 words/);
 assert.match(words({notes:{}}),/does not say why outfit\.hat was changed/);
 assert.match(words({made:'yesterday'}),/made must be the time/);
 assert.match(words({note:'The old single note.'}),/field Studio does not know: "note"/);
 const thuan={format:'johansson-looks',version:1,characters:{},looks:{Thuan:{set:{age:'child'},notes:{age:'She looks younger in this one.'},made:'2026-10-12T09:14:00Z'}}};
 assert.match(validateLooks(thuan).problems.map(p=>p.sentence).join(' '),/Thuan is drawn as an adult/);
});

test('a writer waits while another process is filling in a newly created lock',async()=>{
 const at=await makeRoot('studio-empty-lock-'),lock=resolve(at,PATHS.lock);
 let writer,entered=false;
 try{
  // This is the interval between exclusive creation and writing the owner's token.
  await writeFile(lock,'',{flag:'wx'});
  writer=openRepo(at).locked(async()=>{entered=true;});
  await new Promise(r=>setTimeout(r,150));
  assert.equal(entered,false,'a fresh empty lock still belongs to its creator');
  await rm(lock);
  await writer;
  assert.equal(entered,true,'the waiting writer proceeds after the owner releases');
 }finally{await rm(lock,{force:true});await writer;await rm(at,{recursive:true,force:true});}
});

test('eight writers in eight processes at once: every change and every log entry is kept (the write lock)',{timeout:240000},async()=>{
 const at=await makeRoot('studio-lock-'),cli=resolve(town,'tools/studio/cli.mjs'),env={...process.env,JOHANSSON_STUDIO_ROOT:at};
 try{
  const names=RESIDENT_GROUPS.townsfolk.filter(name=>baseRecipe(name).outfit.hat!=='captain').slice(0,8);assert.equal(names.length,8);
  // The command line's dry run writes nothing.
  const before=await snapshot(at);
  const dry=JSON.parse((await run(process.execPath,[cli,'character_update',JSON.stringify({name:names[0],set:{'outfit.hat':'captain'},note:'A dry run from the command line.'})],{env,cwd:CODE_ROOT})).stdout);
  assert.equal(dry.ok,true);assert.equal(dry.dryRun,true);assert.deepEqual(await snapshot(at),before);
  // A lock left behind by a process that has ended is taken over.
  const ended=(await run(process.execPath,['-e','console.log(process.pid)'])).stdout.trim();
  await writeFile(resolve(at,PATHS.lock),`${ended} ${Date.now()} left-behind\n`);
  const outs=await Promise.all(names.map(name=>run(process.execPath,[cli,'character_update',JSON.stringify({name,set:{'outfit.hat':'captain'},note:`${name} wears a captain's hat for the regatta.`,dryRun:false})],{env,cwd:CODE_ROOT,timeout:200000})));
  for(const out of outs){const r=JSON.parse(out.stdout);assert.equal(r.applied,true,out.stdout);}
  const drafted=await draftChanges(at);
  assert.equal(drafted.length,8,'every writer\'s change is in the draft');assert.equal(new Set(drafted.map(c=>c.id)).size,8);
  const published=await publishDraft({repo:openRepo(at),dryRun:false});assert.equal(published.applied,true,sentences(published));
  assert.deepEqual(Object.keys(JSON.parse(await read(PATHS.looks,at)).looks).sort(),[...names].sort());
  assert.equal(JSON.parse(await read(PATHS.log,at)).changes.length,8);
  assert.equal(await readFile(resolve(at,PATHS.lock)).catch(()=>null),null,'the lock is gone afterwards');
 }finally{await rm(at,{recursive:true,force:true});}
});

test('the data root moves only inside a test run, and real brands are refused in product fields',()=>{
 const saved={...process.env};
 try{
  process.env.JOHANSSON_STUDIO_ROOT=root;assert.equal(defaultRoot(),resolve(root));
  delete process.env.NODE_TEST_CONTEXT;assert.equal(defaultRoot(),CODE_ROOT,'outside node --test the variable is ignored');
 }finally{process.env=saved;}
 const rules={brands:['orion','coca-cola','orion beer'],kana:['オリオン']};
 for(const bad of ['Orion lager','ORION','Ｏｒｉｏｎ draught','オリオンビール','Coca-Cola'])assert.ok(brandProblems(bad,'product.name',rules).length,bad);
 for(const ok of ['Umineko lager','Morioka soba','Asahi Street','Lorionne'])assert.deepEqual(brandProblems(ok,'product.name',rules),[],ok);
});

// ─── Products (stage 2) ───────────────────────────────────────────────────────────────────────────────────────────
const {productsModule}=await import('../tools/studio/build-data.mjs');
const {validateProducts}=await import('../src/studio/rules.js');
/** A throwaway root that also holds Sakura's products, as they are published today. */
async function makeShop(prefix){
 const at=await makeRoot(prefix),text=await readFile(resolve(town,'data/studio/products.json'),'utf8');
 await mkdir(resolve(at,'johansson-town/src/commerce'),{recursive:true});
 await writeFile(resolve(at,PATHS.products),text);await writeFile(resolve(at,PATHS.productsModule),productsModule(text));
 return {at,repo:openRepo(at),text};
}
const shopData=async at=>JSON.parse(await read(PATHS.products,at));
const product=(file,id)=>file.products.find(p=>p.id===id);
const png1=()=>{const b=new Uint8Array(33);b.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,0x49,0x48,0x44,0x52]);new DataView(b.buffer).setUint32(16,2);new DataView(b.buffer).setUint32(20,1);return b;};

test('products: a price goes to the draft, publishes into products.json and its module, and back again is byte-identical',async()=>{
 const {at,repo:shopRepo,text}=await makeShop('studio-shop-');
 try{
  const up=await applyChange(change([{op:'product.update',id:'beer',set:{price:240},was:{price:220},note:'The new excise on beer this autumn.'}]),{repo:shopRepo,dryRun:false});
  assert.equal(up.applied,true,sentences(up));
  assert.equal(await read(PATHS.products,at),text,'a yes goes to the draft, not to World\'s data');
  assert.equal(product((await readData(shopRepo)).products,'beer').price,240,'the tools see the draft');
  const preview=await publishDraft({repo:shopRepo});
  assert.deepEqual(preview.products,[{id:'beer',name:'Umineko lager',what:'changed',fields:['price']}]);
  assert.deepEqual(preview.writes,[PATHS.productsModule,PATHS.products,PATHS.log,PATHS.draft]);
  assert.equal((await publishDraft({repo:shopRepo,dryRun:false})).applied,true);
  const published=await read(PATHS.products,at);
  assert.equal(product(JSON.parse(published),'beer').price,240);assert.equal(await read(PATHS.productsModule,at),productsModule(published));
  const log=JSON.parse(await read(PATHS.log,at));assert.ok(log.changes[0].before.products&&log.changes[0].after.products);
  assert.deepEqual(log.changes[0].inverse,[{op:'product.update',id:'beer',set:{price:220},was:{price:240}}]);
  const back=await applyChange(change([{op:'product.update',id:'beer',set:{price:220},was:{price:240}}]),{repo:shopRepo,dryRun:false});
  assert.equal(back.applied,true,sentences(back));assert.equal((await publishDraft({repo:shopRepo,dryRun:false})).applied,true);
  assert.equal(await read(PATHS.products,at),text,'apply then undo gives back the same bytes');
  assert.equal(await read(PATHS.productsModule,at),productsModule(text));
 }finally{await rm(at,{recursive:true,force:true});}
});

test('products: refused in plain words, and nothing written: real brands, an empty purpose, a double-booked shelf, the locked fields, the beer\'s retirement, bad pictures',async()=>{
 const {at,repo:shopRepo}=await makeShop('studio-shop-refused-');
 try{
  const beer=product(await shopData(at),'beer'),one=png1(),b64=bytes=>Buffer.from(bytes).toString('base64');
  const update=(set,was=Object.fromEntries(Object.keys(set).map(k=>[k,k.split('.').reduce((v,x)=>v?.[x],beer)??null])))=>({op:'product.update',id:'beer',set,was});
  const designed=(spec,picture='beer.label.png')=>({label:{source:'designed',spec,picture,bakedOn:'Chromium'}});
  const words=text=>({v:1,base:'paper',layers:[{type:'text',text,font:'gothic',x:.5,y:.5,size:.2,colour:'ink'}]});
  const before=await snapshot(at);
  const cases=[
   [change([update({'brand.line':'Orion lager'})]),/"orion" is a real brand/],
   [change([update({'pack.flash':'オリオン'})]),/"オリオン" is a real brand/],
   [change([update(designed(words('Orion lager')))],{files:{'beer.label.png':{sha256:sha256(one),data:b64(one)}}}),/"orion" is a real brand/],
   [change([update(designed({v:1,base:'paper',layers:[{type:'picture',file:'beer.photo.png',x:.5,y:.5,w:1,h:1,words:['オリオン 生']}]}))],
    {files:{'beer.label.png':{sha256:sha256(one),data:b64(one)},'beer.photo.png':{sha256:sha256(one),data:b64(one)}}}),/"オリオン" is a real brand/],
   [change([update({'purpose.for':[]})]),/at least one resident/],
   [change([update({'purpose.why':''})]),/is empty/],
   [change([update({'purpose.for':['Mr Nobody']})]),/"Mr Nobody" is not a resident/],
   [change([update({'purpose.placed':'By the till.'})]),/why beer stands where it does, in at least 4 words/],
   [change([update({shelf:{fitting:'fridge',column:3,levels:[0,1,2,3]}})]),/Shelf 3 of the cold cabinet's column 3 is booked twice: milk and beer/],
   [change([update({shelf:{fitting:'fridge',column:3,levels:[0,1]}})]),/Shelf 2 of the cold cabinet's column 3 would stand empty/],
   [change([update({capacity:25})]),/beer's 25 do not share out evenly over its 3 shelves/],
   [change([update({capacity:48})]),/beer would stand 4 deep .*at most 2 deep fits the cold cabinet/],
   [change([update({price:9})]),/from ¥10 to ¥5000/],[change([update({price:220.5})]),/from ¥10 to ¥5000/],
   // Sakura Trading is the town's one supplier since Higa Liquor closed (22 October 2026): the beer cannot go back to the Higas.
   [change([update({supplier:'higa-saketen'})]),/"higa-saketen" supplies nothing in town; the suppliers are sakura/],
   [change([update({name:'Umineko Gold'})]),/cannot be renamed yet/],
   [change([update({id:'lager'},{id:'beer'})]),/save key/],
   [change([update({inventoryName:'Lager'},{inventoryName:'Umineko lager'})]),/what old saves keep in the bag/],
   [change([update({'cells.brand':71},{'cells.brand':10})]),/atlas cells are its own/],
   [change([update({'brand.colour':'#ffffff'},{'brand.colour':null})]),/not a field Studio can change/],
   [change([update({brand:{...beer.brand,ink:'#000000'},'brand.ink':'#000000'})]),/Set brand or a part of it, not both/],
   [change([{op:'product.retire',id:'beer',why:'The creator wants a new beer instead.',shelfTo:'milk',was:recordSha256(beer)}]),/Umineko lager cannot be retired yet.*game\.js:\d+.*friendship\.js:\d+/],
   [change([update(designed(words('UMINEKO')))],{files:{'beer.label.png':{sha256:sha256(one),data:b64(Buffer.from('#!/bin/sh\nrm -rf /'))}}}),/not a PNG, JPEG or WebP picture/],
   [change([update(designed(words('UMINEKO')))],{files:{'beer.label.png':{sha256:'0'.repeat(64),data:b64(one)}}}),/does not match its checksum/],
   [change([update(designed(words('UMINEKO')))]),/uses the picture beer\.label\.png, which is not in the change's files/],
   [change([{op:'product.add',product:{name:'Lemon',hue:3},place:{mode:'flavour',target:'beer'}}]),/at least 10 degrees/],
   [change([{op:'product.add',product:{name:'Orion Dry',hue:40},place:{mode:'flavour',target:'beer'}}]),/"orion" is a real brand/],
   [change([{op:'product.add',product:{name:'Dry',hue:40},place:{mode:'flavour',target:'beer'}}]),/already has a flavour called Dry/],
   [change([{op:'product.update',id:'nothing',set:{price:200},was:{price:100}}]),/There is no product "nothing"/],
  ];
  for(const [file,expected] of cases){const r=await applyChange(file,{repo:shopRepo,dryRun:false});assert.equal(r.ok,false,String(expected));assert.match(sentences(r),expected);}
  assert.deepEqual(await snapshot(at),before,'a refused change writes nothing');
 }finally{await rm(at,{recursive:true,force:true});}
});

test('products: a flavour gets its own cell, a new line shares a bay and gets cells off the painted sheets, and a line nothing names can retire',async()=>{
 const {at,repo:shopRepo}=await makeShop('studio-shop-add-');
 try{
  const lemon=await applyChange(change([{op:'product.add',product:{name:'Lemon',hue:60},place:{mode:'flavour',target:'beer'}}]),{repo:shopRepo,dryRun:false});
  assert.equal(lemon.applied,true,sentences(lemon));
  const used=new Set((await shopData(at)).products.flatMap(p=>p.cells.flavours.map(f=>f.cell)));
  const beer=product((await readData(shopRepo)).products,'beer');
  assert.deepEqual(beer.cells.flavours.at(-1),{name:'Lemon',hue:60,cell:Math.min(...Array.from({length:80},(_,c)=>c).filter(c=>!used.has(c)))});
  // A new line beside the batteries, with a designed label whose picture is already baked (the tools bake it in Chromium).
  const spec={v:1,base:'paper',layers:[{type:'text',text:'KAZEMARU',font:'gothic',x:.5,y:.5,size:.2,colour:'ink'}]};
  const mints={id:'mints',inventoryName:'Harbour mints',shop:'sakura',name:'Harbour mints',jp:'Mints',price:100,text:'KAZEMARU · Harbour mints',bagColour:'#d9eef0',
   brand:{name:'KAZEMARU',jp:'Kazemaru',line:'Peppermints',paper:'#d9eef0',ink:'#1f4f6b',accent:'#5fa8c4',symbol:'wave'},
   pack:{shape:'box',size:[.06,.09,.02],net:'30g',flash:'Strong',tag:'For the ferry',art:'candy',back:{ingredients:'Sugar, peppermint oil',unit:'pack',recycle:'PLA',food:true}},
   label:{source:'designed',spec,image:'labels/mints.r1.webp',sha256:'a'.repeat(64),bakedOn:'Chromium'},
   purpose:{zone:'daily',for:['Nhung','Harbour master'],why:'Peppermints for a long shift at the wheel or on the quay.',placed:'Beside the batteries, by the till, where a driver pays.'},
   capacity:24,supplier:'sakura'};
  const added=await applyChange(change([{op:'product.add',product:mints,place:{mode:'share',target:'battery'}}]),{repo:shopRepo,dryRun:false});
  assert.equal(added.applied,true,sentences(added));
  let data=(await readData(shopRepo)).products;
  const m=product(data,'mints');assert.deepEqual([m.cells.brand,m.cells.price],[71,72],'a new line never gets a cell under the painted sheets (0 to 31)');
  assert.deepEqual(m.shelf,{fitting:'east',bay:'east-back-1',order:1});assert.equal(product(data,'notebook').shelf.order,2,'the line above moves up a board');
  assert.ok(data.products.findIndex(p=>p.id==='mints')>data.products.findIndex(p=>p.id==='postcard')-1,'in the floor walk with the daily goods');
  assert.equal(validateProducts(data,{brands:JSON.parse(await read(PATHS.brands,at))}).ok,true);
  // Its label picture is not baked here, so publishing it is refused, in words, until it is.
  const blocked=await publishDraft({repo:shopRepo,dryRun:false});assert.equal(blocked.ok,false);assert.match(sentences(blocked),/mints's label needs .*labels\/mints\.r1\.webp/);
  // Nothing in World names the new line: it can retire, and its board goes back to the line beside it.
  const retired=await applyChange(change([{op:'product.retire',id:'mints',why:'The trial of peppermints is over now.',was:recordSha256(m)}]),{repo:shopRepo,dryRun:false});
  assert.equal(retired.applied,true,sentences(retired));
  data=(await readData(shopRepo)).products;
  assert.equal(product(data,'mints'),undefined);assert.equal(product(data,'notebook').shelf.order,1);
  assert.deepEqual(data.retired.map(r=>[r.id,r.inventoryName,r.why]),[['mints','Harbour mints','The trial of peppermints is over now.']]);
  const again=await applyChange(change([{op:'product.add',product:mints,place:{mode:'share',target:'battery'}}]),{repo:shopRepo,dryRun:false});
  assert.equal(again.ok,false);assert.match(sentences(again),/retired id is never used again/);
 }finally{await rm(at,{recursive:true,force:true});}
});
