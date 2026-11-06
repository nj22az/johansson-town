/**
 * Johansson Studio's assets for the johansson-studio tools (tools.mjs): what is in World's catalogue and Studio's
 * draft, an asset's files exported by the iPad's own code in headless Studio, and the hand-off from the iPad.
 *
 * An iPad cannot push to git. "Make model" (avatar-creator/model.js) saves a package for an asset whose checks all pass
 * (src/studio/modeller/export.js assetPackage: its resolved card, its GLB and its hero render, each with its sha256);
 * asset_draft checks it again and keeps it in data/studio/draft/assets/<id>/ (outside git), and asset_publish, only when
 * the creator says "update World", copies it into World's catalogue (assets/catalog/<id>/, index.json) and compiles
 * src/catalog/catalog-data.js, the same files and rules as the desktop Studio's publish (townstudio/assets.py
 * publish_to_world): every check passed, a new version for a changed asset, and nothing replaces an entry that did not
 * come from Studio.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const ID=/^[a-z0-9][a-z0-9-]{1,47}$/,DRAFT='johansson-town/data/studio/draft/assets',CATALOG='johansson-town/assets/catalog',FILES=['model.glb','asset.json','hero.png'];
const LIMIT=24*1024*1024;
const object=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});
const DRY={type:'boolean',default:true,description:'true (the default) only reports what would change; false writes it.'};

let modules;
const load=()=>modules??=Promise.all([import('../../src/studio/modeller/card-checks.js'),import('../../src/studio/modeller/export.js'),import('../../src/studio/sha256.js'),
 import('../../src/studio/prop-registry.js'),import('../catalog/build-catalog.mjs')]).then(([cards,exp,sha,registry,catalog])=>({cards,exp,sha,registry,catalog}));
const rules=async()=>JSON.parse(await readFile(new URL('../../src/studio/modeller/rules.json',import.meta.url),'utf8'));
const today=()=>new Date().toISOString().slice(0,10);

async function catalogIndex(repo){return repo.readJSON(CATALOG+'/index.json').catch(()=>({format:1,assets:[]}));}
async function draftIds(repo){
 const {readdir}=await import('node:fs/promises');
 return (await readdir(repo.abs(DRAFT),{withFileTypes:true}).catch(()=>[])).filter(d=>d.isDirectory()&&ID.test(d.name)).map(d=>d.name).sort();
}
async function draftCard(repo,id){return repo.readJSON(`${DRAFT}/${id}/asset.json`).catch(()=>null);}

/** Ids World and Studio already use, by what (card-checks.js cardChecks `taken`). */
async function taken(repo,self){
 const {registry}=await load(),out={},code=async f=>readFile(repo.abs('johansson-town/'+f),'utf8').catch(()=>'');
 for(const [f,what] of [['src/build/catalogue.js','World’s build catalogue'],['src/build/home-furniture.js','World’s home furniture']])
  for(const m of (await code(f)).matchAll(/\{\s*id\s*:\s*'([a-z0-9-]+)'/g))out[m[1]]=what;
 // a prop World builds in code may move into the catalogue under its own id (Studio offers it so)
 for(const e of registry.PROP_REGISTRY)if(e.id!==self)out[e.id]=`World’s code (${e.source})`;
 for(const e of (await catalogIndex(repo)).assets)out[e.id]='catalogue:'+(e.from||'');
 return out;
}

/** A package, checked: {ok, problems, card, files: {name: bytes}}. */
async function checkPackage(repo,pkg){
 const {cards,exp,sha}=await load(),R=await rules(),problems=[],files={};
 if(!pkg||pkg.format!==exp.PACKAGE_FORMAT||pkg.version!==1)return {ok:false,problems:[`This is not a Studio asset package (format "${exp.PACKAGE_FORMAT}", version 1).`]};
 const card=pkg.card;
 if(!card||!ID.test(card.id||'')||pkg.id!==card.id)problems.push('The package’s id and its card’s id must be the same plain name.');
 for(const [name,f] of Object.entries(pkg.files||{})){
  if(!['model.glb','hero.png'].includes(name)){problems.push(`The package holds ${name}; it may hold only model.glb and hero.png.`);continue;}
  const bytes=Buffer.from(String(f.data||''),'base64');
  if(bytes.length>LIMIT)problems.push(`${name} is over 24 MB.`);
  if(sha.sha256(bytes)!==f.sha256)problems.push(`${name} is not the file the package names (its sha256 differs).`);
  files[name]=bytes;
 }
 if(!files['model.glb'])problems.push('The package has no model.glb.');
 else{
  try{const gltf=exp.glbJson(new Uint8Array(files['model.glb'])),node=(gltf.nodes||[]).find(n=>n.extras?.asset===card?.name);
   if(!node)problems.push(`model.glb has no node marked as the asset "${card?.name}" (World places it by that node).`);
   else if(node.translation||node.rotation||node.scale||node.matrix)problems.push('The asset’s node in model.glb is not at the file’s origin.');}
  catch(e){problems.push('model.glb: '+e.message);}
 }
 if(files['hero.png']&&files['hero.png'].subarray(1,4).toString()!=='PNG')problems.push('hero.png is not a PNG.');
 const again=cards.cardChecks(card||{},R,{assetId:card?.id,taken:await taken(repo,card?.id),extraBrands:(await repo.readJSON('johansson-town/data/studio/brand-rules.json').catch(()=>({brands:[]}))).brands});
 for(const c of again)if(!c.ok)problems.push(`${c.id}: ${c.detail}`);
 const ran=new Set((card?.checks||[]).map(c=>c.id)),failed=(card?.checks||[]).filter(c=>!c.ok).map(c=>c.id),missing=R.checks.map(c=>c.id).filter(id=>!ran.has(id));
 if(failed.length)problems.push(`It did not pass Studio’s checks: ${failed.join(', ')}.`);
 if(missing.length)problems.push(`Studio did not run every check on it: ${missing.join(', ')} missing.`);
 if(card?.model!=='model.glb')problems.push('Its card must name model.glb.');
 return {ok:!problems.length,problems,card,files};
}

export const ASSET_TOOLS=[
 {name:'asset_list',readOnly:true,description:'List Johansson World\'s assets as Studio\'s "Make model" sees them: what is in World\'s catalogue (assets/catalog, published), what is waiting in Studio\'s draft (made in Studio, not yet in World), and the props World builds in its own code that Studio can open and export (the prop registry).',
  input:object({}),
  async run(_,ctx){
   const {registry}=await load(),index=await catalogIndex(ctx.repo),draft=[];
   for(const id of await draftIds(ctx.repo)){const c=await draftCard(ctx.repo,id);if(c)draft.push({id,name:c.name,kind:c.kind,version:c.version,maker:c.maker?.maker||null,inWorld:index.assets.find(e=>e.id===id)?.version??null});}
   return {catalogue:index.assets.map(e=>({id:e.id,name:e.name,kind:e.kind,version:e.version,published:e.published})),draft,
    registry:registry.PROP_REGISTRY.map(e=>({id:e.id,name:e.name,kind:e.kind,source:e.source})),
    next:draft.length?'The draft reaches World only when the creator says "update World" (asset_publish).':undefined};
  }},
 {name:'asset_export',idempotent:true,description:'Export an asset\'s files exactly as Studio saves them on the iPad, drawn by its own code in headless Studio: the GLB for World, the STL for 3D printing (millimetres, z up, with whether it is watertight), a transparent PNG and the asset card, named by id and version, into output/studio-mcp/assets/ (git ignores it). key is "catalogue:<id>", "registry:<id>" (asset_list lists them) or "lathe" with a Lathe design (params and card). Also returns the checks.',
  input:object({key:{type:'string',pattern:'^(catalogue|registry):[a-z0-9][a-z0-9-]{1,47}$|^lathe$'},params:{type:'object',description:'A Lathe design\'s parameters (key "lathe").'},card:{type:'object',description:'The asset card for key "lathe" (name, purpose, kind…).'},
   png:{type:'boolean',default:true}},['key']),
  async run({key,params,card,png=true},ctx){
   const page=await ctx.page(),r=await page.evaluate(([k,p,c,g])=>window.__JOHANSSON_STUDIO__.exportAsset({key:k,params:p,card:c,png:g}),[key,params||null,card||null,png]);
   const {exp}=await load(),out=[],c=r.card;
   const keep=async(ext,b64)=>{const path=`output/studio-mcp/assets/${exp.assetFileName(c,ext)}`;await ctx.repo.write(path,Buffer.from(b64,'base64'));out.push(path);};
   await keep('glb',r.glb);await keep('stl',r.stl);if(r.png)await keep('png',r.png);
   await keep('asset.json',Buffer.from(JSON.stringify(r.resolved,null,1)+'\n').toString('base64'));
   return {id:c.id,version:c.version,files:out,checks:r.checks.map(x=>`${x.ok?'PASS':'FAIL'}  ${x.label}: ${x.detail}`),allPass:r.ok,print:r.print,triangles:r.triangles};
  }},
 {name:'asset_draft',destructive:true,description:'Keep an asset made in Studio on the iPad in Studio\'s draft: give the package the creator saved with "Send to World\'s draft" (a .studio-asset.json file, by path, or its contents). It is checked again (every check passed, the files are what the package names, the GLB\'s asset node, the id free in World) and kept in data/studio/draft/assets/<id>/, outside git. World changes only when the creator says "update World" (asset_publish). Dry run by default.',
  input:object({file:{type:'string',maxLength:4096,description:'A path to the package file.'},package:{type:'object',description:'The package itself.'},dryRun:DRY}),
  async run({file,package:given,dryRun=true},ctx){
   if(!file===!given)throw Error('Give either file or package.');
   const pkg=given||JSON.parse(await readFile(resolve(file),'utf8'));
   const checked=await checkPackage(ctx.repo,pkg);
   if(!checked.ok)return {ok:false,applied:false,dryRun,problems:checked.problems,next:'Nothing was written. Fix the asset in Studio and send it again.'};
   const index=await catalogIndex(ctx.repo),live=index.assets.find(e=>e.id===checked.card.id),{sha}=await load();
   // as the desktop's export writes it (townstudio/assets.py write_export): its model, its hero and where it came from
   const c={...checked.card,model:'model.glb',hero:checked.files['hero.png']?'hero.png':null,
    source:{from:'johansson-studio',made:'Make model ('+(pkg.by||'ipad')+')',files:Object.fromEntries(Object.entries(checked.files).map(([n,b])=>[n,sha.sha256(b)]))}};
   if(live&&live.version>=c.version)return {ok:false,applied:false,dryRun,problems:[`World already has version ${live.version} of ${c.id}: a changed asset needs a higher version (Studio raises it by itself).`]};
   const dir=`${DRAFT}/${c.id}`,writes=[[`${dir}/asset.json`,JSON.stringify(c,null,1)+'\n'],[`${dir}/model.glb`,checked.files['model.glb']],...checked.files['hero.png']?[[`${dir}/hero.png`,checked.files['hero.png']]]:[],
    [`${dir}/package.json`,JSON.stringify({id:c.id,version:c.version,made:pkg.made,by:pkg.by,drafted:new Date().toISOString(),sha256:Object.fromEntries(Object.entries(pkg.files).map(([n,f])=>[n,f.sha256]))},null,1)+'\n']];
   const summary={id:c.id,name:c.name,kind:c.kind,version:c.version,replaces:live?`World’s version ${live.version}`:null,maker:c.maker?.maker||null,files:writes.map(w=>w[0])};
   if(dryRun)return {ok:true,applied:false,dryRun,...summary,next:'A dry run: nothing was written. Call again with dryRun:false to keep it in Studio\'s draft.'};
   await ctx.repo.locked(()=>ctx.repo.writeAll(writes));
   return {ok:true,applied:true,dryRun,...summary,next:'Kept in Studio\'s draft (outside git). It reaches World only when the creator says "update World" (asset_publish).'};
  }},
 {name:'asset_publish',destructive:true,description:'Only when the creator says "update World": copy a drafted asset into World\'s catalogue (assets/catalog/<id>/: model.glb, asset.json, hero.png), list it in index.json and compile src/catalog/catalog-data.js, as the desktop Studio\'s publish does. Refused, changing nothing, unless every check passed and its version is new to World. Nothing is committed or pushed. Dry run by default.',
  input:object({id:{type:'string',pattern:'^[a-z0-9][a-z0-9-]{1,47}$'},dryRun:DRY},['id']),
  async run({id,dryRun=true},ctx){
   const card=await draftCard(ctx.repo,id);if(!card)throw Error(`There is no ${id} in Studio's draft (asset_list lists it).`);
   const {catalog}=await load(),index=await catalogIndex(ctx.repo),live=index.assets.find(e=>e.id===id);
   const failed=(card.checks||[]).filter(c=>!c.ok).map(c=>c.id);
   if(!card.checks?.length||failed.length)return {ok:false,dryRun,problems:[`${id} did not pass every check (${failed.join(', ')||'none recorded'}).`]};
   if(live&&live.from!=='johansson-studio')return {ok:false,dryRun,problems:[`World’s catalogue already has a ${id} that did not come from Studio.`]};
   if(live&&live.version>=card.version)return {ok:false,dryRun,problems:[`World has version ${live.version} of ${id}; this draft is version ${card.version}.`]};
   const src=`${DRAFT}/${id}`,dest=`${CATALOG}/${id}`,files=[];
   for(const f of FILES)if(await ctx.repo.exists(`${src}/${f}`))files.push(f);
   const entry={id,name:card.name,kind:card.kind,version:card.version,model:`${id}/model.glb`,card:`${id}/asset.json`,hero:files.includes('hero.png')?`${id}/hero.png`:null,
    tags:card.tags||[],from:'johansson-studio',published:today()};
   const writes=[...files.map(f=>`${dest}/${f}`),`${CATALOG}/index.json`,'johansson-town/src/catalog/catalog-data.js'];
   if(dryRun)return {ok:true,dryRun,entry,writes,replaces:live?`version ${live.version}`:null,next:'A dry run: nothing was written. Only when the creator says "update World", call again with dryRun:false; then (cd johansson-town && npm run build:runtime) if a place uses it, and publish_check.'};
   await ctx.repo.locked(async()=>{
    const copies=[];for(const f of files)copies.push([`${dest}/${f}`,await ctx.repo.read(`${src}/${f}`,null)]);
    const assets=[...index.assets.filter(e=>e.id!==id),entry].sort((a,b)=>a.id<b.id?-1:1);
    await ctx.repo.writeAll([...copies,[`${CATALOG}/index.json`,JSON.stringify({...index,format:1,assets},null,1)+'\n']]);
    await ctx.repo.write('johansson-town/src/catalog/catalog-data.js',await catalog.catalogSource(ctx.repo.abs('johansson-town')));
    for(const f of [...files,'package.json'])await ctx.repo.remove(`${src}/${f}`);
   });
   return {ok:true,dryRun,entry,writes,next:'Written to World\'s catalogue (not committed). Run node johansson-town/tools/catalog/build-catalog.mjs --check and the catalogue tests, then publish_check and commit those files.'};
  }},
];
