#!/usr/bin/env node
/**
 * Johansson Studio's changes: adding a change file to Studio's draft, publishing the draft into World's data, and
 * taking changes out of the draft. Nothing here commits or pushes ("update World", avatar-creator/docs/STUDIO-MCP.md).
 *
 * The draft (data/studio/draft/pending.json, which git ignores) holds the changes the creator has said yes to and not
 * yet published. Studio's tools show everybody as the published data with the draft laid over it. Only publishDraft
 * writes World's files (data/studio/looks.json, the generated modules, data/studio/log.json), and only when the creator
 * says "update World", so a change can never reach World through somebody else's commit.
 *
 *   node johansson-town/tools/studio/apply.mjs change.json           a dry run: what would change, nothing written
 *   node johansson-town/tools/studio/apply.mjs change.json --write   add it to the draft
 * Adding a change (1) validates it, (2) redraws its pictures as WebP in Chromium and gives each its place in
 * assets/graphics/labels/ (only their pixels are kept: no EXIF, no location), (3) refuses to retire a line World's code
 * still names, (4) checks every step's `was` against the draft and the whole of Sakura's products afterwards, and (5)
 * adds it to the draft with its pictures, all in one step under Studio's write lock (repo.mjs). A change with pictures
 * needs Chromium (the tools' headless Studio page; the command line starts one).
 */
import {fileURLToPath} from 'node:url';
import {readFile,stat,readdir} from 'node:fs/promises';
import {openRepo,PATHS,serial,jsonText} from './repo.mjs';
import {looksModule,charactersModule,productsModule} from './build-data.mjs';
import {validateChange,validateLooks,validateProducts,decodeBase64,pictureKind,pictureSize,LIMITS,LABEL_IMAGE} from '../../src/studio/rules.js';
import {applyOps} from '../../src/studio/change.js';
import {CHANGE_FORMAT,CHANGE_VERSION} from '../../src/studio/ops.js';
import {sha256,recordSha256} from '../../src/studio/sha256.js';
import {PICTURE_FILE,labelPictures} from '../../src/studio/label-spec.js';

const DRAFT_FORMAT='johansson-studio-draft';
const emptyDraft=()=>({format:DRAFT_FORMAT,version:1,changes:[]});
const problem=(where,rule,sentence)=>({where,rule,sentence});
const refuse=(problems,extra={})=>({ok:false,applied:false,problems,...extra});
const asChange=r=>({format:CHANGE_FORMAT,version:CHANGE_VERSION,id:r.id,made:r.made,by:r.by,note:r.note,ops:r.ops});
const own=(map,key)=>map&&Object.hasOwn(map,key)?map[key]:undefined;

/** The real-brand rules every name and label is checked against. */
const readBrands=repo=>repo.readJSON(PATHS.brands);
/** The draft: the changes said yes to and not yet published, oldest first. */
async function readDraft(repo){
 if(!await repo.exists(PATHS.draft))return emptyDraft();
 const draft=await repo.readJSON(PATHS.draft);
 if(draft?.format!==DRAFT_FORMAT||draft.version!==1||!Array.isArray(draft.changes))
  throw Error(`${PATHS.draft} is not a Johansson Studio draft. Move it aside; the changes in it would have to be made again.`);
 return draft;
}

/**
 * The published looks with the draft's changes laid over them, in order. A drafted change that no longer fits (its
 * `was` no longer matches, or it fails today's checks) is left out and reported in `stale`; it is never half applied.
 */
function replay(published,records,{brands}){
 const steps=[],stale=[];let data={looks:published.looks,products:published.products};
 for(const record of records){
  const checked=validateChange(asChange(record),{brands});
  if(!checked.ok){stale.push({id:record.id,note:record.note,sentences:checked.problems.map(p=>p.sentence)});continue;}
  const r=applyOps(data,checked.change.ops,{made:record.made,note:record.note});
  if(r.conflicts.length){stale.push({id:record.id,note:record.note,sentences:r.conflicts.map(c=>c.sentence)});continue;}
  const whole=r.data.products?validateProducts(r.data.products,{brands}):{ok:true};
  if(!whole.ok){stale.push({id:record.id,note:record.note,sentences:whole.problems.map(p=>p.sentence)});continue;}
  const after={looks:r.data.looks,products:r.data.products??null};
  steps.push({record,ops:checked.change.ops,before:data,after,inverse:r.inverse,results:r.results});
  data=after;
 }
 return {looks:data.looks,products:data.products,steps,stale};
}
const staleSentence=s=>`The drafted change ${s.id} ("${s.note}") no longer fits today's data: ${s.sentences.join(' ')} Take it out with discard_draft, then make it again if it is still wanted.`;

/**
 * Studio's data as the tools see it: {published, looks (the published looks with the draft laid over them), draft
 * (the drafted changes), stale (drafted changes that no longer fit), fingerprint:{published, looks}}.
 */
export async function readData(repo=openRepo()){
 const text=await repo.read(PATHS.looks),published=JSON.parse(text),draft=await readDraft(repo);
 const productsText=await repo.read(PATHS.products).catch(()=>null),publishedProducts=productsText?JSON.parse(productsText):null;
 const {looks,products,stale}=replay({looks:published,products:publishedProducts},draft.changes,{brands:await readBrands(repo)});
 return {published,looks,publishedProducts,products,draft:draft.changes,stale,
  fingerprint:{published:sha256(text),looks:sha256(jsonText(looks)),publishedProducts:productsText?sha256(productsText):null,products:products?sha256(jsonText(products)):null}};
}

/** A label picture's path in the repository, from its path under assets/graphics. */
export const labelPath=image=>`johansson-town/assets/graphics/${image}`;
/** Every label picture a products file uses: [{image (under assets/graphics), sha256 (null for a picture layer's), id}]. */
export function labelFiles(products){
 const out=[];
 for(const p of products?.products||[])if(p.label?.source==='designed'){
  out.push({image:p.label.image,sha256:p.label.sha256,id:p.id});
  for(const file of labelPictures(p.label.spec))out.push({image:`labels/${file}`,sha256:null,id:p.id});
 }
 return out;
}

/**
 * The pictures of a change, made ready to keep: each is decoded and drawn again as WebP in Chromium (only its pixels
 * survive), and given the next free revision of its name in assets/graphics/labels/ (<id>.r<n>.webp for a baked label,
 * <id>-picture.r<n>.webp for a picture a label shows). The steps are rewritten to name their pictures by those paths.
 * Returns {ops, files:{path:{sha256, data}}, made:[{path, width, height}]} or throws a sentence.
 */
async function preparePictures(change,{repo,page,now}){
 const files=change.files||{},names=Object.keys(files);
 if(!names.length)return {ops:change.ops,files:{}};
 if(!page)throw Error('This change has pictures, and pictures are redrawn in Chromium before they are kept; run it through the johansson-studio tools or apply.mjs, which start one.');
 const taken=new Set(),onDisk=await readdir(repo.abs('johansson-town/assets/graphics/labels')).catch(()=>[]);
 for(const f of onDisk)taken.add(`labels/${f}`);
 for(const data of [now.publishedProducts,now.products])for(const f of labelFiles(data))taken.add(f.image);
 for(const record of now.draft)for(const path of Object.keys(record.files||{}))taken.add(path.replace('johansson-town/assets/graphics/',''));
 const next=stem=>{let n=1;while(taken.has(`labels/${stem}.r${n}.webp`))n++;const image=`labels/${stem}.r${n}.webp`;taken.add(image);return image;};
 const out={},made=[],cache=new Map();
 async function keep(name,stem,{label}){
  if(cache.has(name+':'+stem))return cache.get(name+':'+stem);
  const bytes=decodeBase64(files[name].data),size=pictureSize(bytes);
  if(label&&size&&Math.abs(size.width/size.height-2)>.02)throw Error(`${name} is ${size.width} × ${size.height} pixels; a baked label is twice as wide as it is high (1024 × 512).`);
  const webp=await page.reencodeWebp(bytes,{maxSide:label?1024:2048});
  const image=next(stem),path=labelPath(image),sum=sha256(webp.bytes);
  out[path]={sha256:sum,data:webp.bytes.toString('base64')};made.push({path,width:webp.width,height:webp.height,from:name,kind:pictureKind(bytes)});
  const r={image,sha256:sum};cache.set(name+':'+stem,r);return r;
 }
 async function label(l,id){
  if(!l||l.source!=='designed')return l;
  const spec=structuredClone(l.spec);
  for(const layer of spec.layers)if(layer.type==='picture'&&Object.hasOwn(files,layer.file)&&!PICTURE_FILE.test(layer.file))layer.file=(await keep(layer.file,`${id}-picture`,{label:false})).image.slice('labels/'.length);
  if(l.picture===undefined)return {...l,spec};
  const {image,sha256:sum}=await keep(l.picture,id,{label:true});
  return {source:'designed',spec,image,sha256:sum,bakedOn:l.bakedOn};
 }
 const ops=[];
 for(const op of change.ops){
  if(op.op==='product.update'&&op.set.label)ops.push({...op,set:{...op.set,label:await label(op.set.label,op.id)}});
  else if(op.op==='product.add'&&op.product.label)ops.push({...op,product:{...op.product,label:await label(op.product.label,op.product.id)}});
  else ops.push(op);
 }
 return {ops,files:out,made};
}

/** Retiring a line (or replacing it) is refused while World's code, tests or trade accounts still name it. */
async function retireBlocks(ops,products){
 const out=[],{productReferences,referenceSentences}=await import('./references.mjs');
 for(const [i,op] of ops.entries()){
  const id=op.op==='product.retire'?op.id:op.op==='product.add'&&op.place?.mode==='replace'?op.place.target:null;
  const product=id&&products?.products.find(p=>p.id===id);if(!product)continue;
  const refs=await productReferences(product);
  if(refs.blocking)out.push(problem(`ops[${i}]`,'references',`${product.name} cannot be retired yet. ${referenceSentences(product,refs).join(' ')} Each needs the creator's choice first (they are part of stories and saves); changing them is a code batch.`));
 }
 return out;
}

/** An id no other change uses: the same id with -2, -3 … (kept within the change id's 40 letters). */
function freeId(id,used){
 const at=id.indexOf('Z-')+2,stem=id.slice(0,at),slug=id.slice(at);
 for(let n=2;;n++){const tail=`-${n}`,candidate=stem+slug.slice(0,40-tail.length)+tail;if(!used.has(candidate))return candidate;}
}

/**
 * Check a change and, unless dryRun, add it to the draft. Returns {ok, applied, dryRun, id, problems, warnings,
 * conflicts, results, writes, looks (the data as it is, or would be, afterwards)}. A conflict or a problem writes
 * nothing. An id is used once (World's log and the draft): with uniqueId (the tools, which make their own ids) a used
 * id gets -2, -3 …; a change file that reuses one is refused when it is applied (a dry run only warns).
 */
export function applyChange(change,{dryRun=true,repo=openRepo(),bytes,uniqueId=false,page=null}={}){
 return serial(()=>repo.locked(async()=>{
  const brands=await readBrands(repo),checked=validateChange(change,{bytes,brands});
  if(!checked.ok)return refuse(checked.problems,{warnings:checked.warnings,dryRun});
  const ready=checked.change,now=await readData(repo),warnings=[...checked.warnings];
  if(ready.base?.looks&&![now.fingerprint.looks,now.fingerprint.published].includes(ready.base.looks))
   warnings.push(problem('change.base.looks','base','The looks have changed since this change was made; each step was checked on its own against today\'s looks.'));
  if(ready.base?.products&&![now.fingerprint.products,now.fingerprint.publishedProducts].includes(ready.base.products))
   warnings.push(problem('change.base.products','base','Sakura\'s products have changed since this change was made; each step was checked on its own against today\'s products.'));
  if(now.stale.length)warnings.push(...now.stale.map(s=>problem(`draft.${s.id}`,'stale',staleSentence(s))));
  const blocked=await retireBlocks(ready.ops,now.products);
  if(blocked.length)return refuse(blocked,{dryRun,warnings});
  let prepared;
  try{prepared=await preparePictures(ready,{repo,page,now});}catch(e){return refuse([problem('change.files','picture',String(e.message||e).split('\n')[0])],{dryRun,warnings});}
  const {data,conflicts,results}=applyOps({looks:now.looks,products:now.products},prepared.ops,{made:ready.made,note:ready.note});
  const diff=results.map(r=>({...r,...describe(prepared.ops[r.op])}));
  if(conflicts.length)return {ok:false,applied:false,dryRun,problems:[],conflicts,warnings,results:diff};
  if(data.products){
   const whole=validateProducts(data.products,{brands});
   if(!whole.ok)return refuse(whole.problems,{dryRun,warnings,results:diff});
   warnings.push(...whole.warnings);
  }
  const changed=results.some(r=>r.status==='applied');
  const base={ok:true,dryRun,id:ready.id,problems:[],conflicts:[],warnings,results:diff,writes:changed?[PATHS.draft]:[],looks:data.looks,products:data.products,
   ops:prepared.ops,pictures:prepared.made,files:prepared.files,
   nothing:!changed?'Nothing to change: Studio already has all of this.':undefined};
  if(!changed)return {...base,applied:false};
  const log=await repo.readJSON(PATHS.log),used=new Map([...log.changes,...now.draft].map(c=>[c.id,c]));
  let id=ready.id;
  if(used.has(id)){
   if(uniqueId)id=freeId(id,used);
   else{
    const sentence=`Another change already used the id ${id} (${used.get(id).note}). Give this change an id of its own.`;
    if(!dryRun)return refuse([problem('change.id','id',sentence)],{dryRun,warnings});
    warnings.push(problem('change.id','id',`${sentence} Applied as it is, it would be refused.`));
   }
  }
  if(dryRun)return {...base,id,applied:false};
  const draft=await readDraft(repo);
  draft.changes.push({id,made:ready.made,by:ready.by,note:ready.note,applied:new Date().toISOString(),sha256:recordSha256(prepared.ops),ops:prepared.ops,
   ...Object.keys(prepared.files).length?{files:prepared.files}:{}});
  await repo.write(PATHS.draft,jsonText(draft));
  return {...base,id,applied:true};
 }));
}

/** Who a draft changes, against the published data: residents' fields, and Studio characters added, changed or deleted. */
export function draftSummary(published,looks){
 const out=[],names=new Set([...Object.keys(published.looks||{}),...Object.keys(looks.looks||{})]);
 for(const name of [...names].sort()){
  const was=own(published.looks,name)?.set||{},now=own(looks.looks,name)?.set||{};
  const fields=[...new Set([...Object.keys(was),...Object.keys(now)])].filter(p=>!Object.is(was[p],now[p]))
   .map(path=>({path,from:Object.hasOwn(was,path)?was[path]:'as World draws them',to:Object.hasOwn(now,path)?now[path]:'as World draws them'}));
  if(fields.length)out.push({name,kind:'resident',fields});
 }
 const ids=new Set([...Object.keys(published.characters||{}),...Object.keys(looks.characters||{})]);
 for(const id of [...ids].sort()){
  const was=own(published.characters,id),now=own(looks.characters,id);
  if(!was)out.push({id,name:now.name,kind:'studio',what:'added'});
  else if(!now)out.push({id,name:was.name,kind:'studio',what:'deleted'});
  else if(recordSha256(was)!==recordSha256(now))out.push({id,name:now.name,kind:'studio',what:'changed'});
 }
 return out;
}

/**
 * Publish the draft into World's data, only when the creator says "update World": the drafted changes are laid over
 * the published looks in order, checked as a whole, and written in one step: src/avatars/looks-data.js,
 * src/studio/characters-data.js, data/studio/looks.json, data/studio/log.json (each change with the steps that undo
 * it) and an empty draft. A drafted change that no longer fits stops it, and nothing is written. Dry run by default.
 */
export function publishDraft({dryRun=true,repo=openRepo()}={}){
 return serial(()=>repo.locked(async()=>{
  const text=await repo.read(PATHS.looks),published=JSON.parse(text),draft=await readDraft(repo),log=await repo.readJSON(PATHS.log),brands=await readBrands(repo);
  const productsText=await repo.read(PATHS.products).catch(()=>null),publishedProducts=productsText?JSON.parse(productsText):null;
  // A change World's log already has was published by a publish that stopped before it emptied the draft.
  const done=new Set(log.changes.map(c=>c.id)),records=draft.changes.filter(c=>!done.has(c.id));
  const {looks,products,steps,stale}=replay({looks:published,products:publishedProducts},records,{brands});
  if(stale.length)return refuse(stale.map(s=>problem(`draft.${s.id}`,'stale',staleSentence(s))),{dryRun,stale:stale.map(s=>s.id)});
  const whole=validateLooks(looks,{brands});
  if(!whole.ok)return refuse(whole.problems,{dryRun});
  if(products){const all=validateProducts(products,{brands});if(!all.ok)return refuse(all.problems,{dryRun});}
  const looksText=jsonText(looks),productsOut=products?jsonText(products):null,at=new Date().toISOString();
  const fingerprints=d=>({looks:sha256(jsonText(d.looks)),...d.products?{products:sha256(jsonText(d.products))}:{}});
  const entries=steps.filter(s=>s.results.some(r=>r.status==='applied')).map(s=>({id:s.record.id,made:s.record.made,by:s.record.by,note:s.record.note,
   applied:s.record.applied,published:at,sha256:s.record.sha256,before:fingerprints(s.before),after:fingerprints(s.after),
   ops:s.ops,inverse:s.inverse,results:s.results.map(({op,status})=>({op,status}))}));
  const files=[];
  for(const [path,content] of [[PATHS.looksModule,looksModule(looksText)],[PATHS.charactersModule,charactersModule(looksText)],[PATHS.looks,looksText],
   ...productsOut!==null?[[PATHS.productsModule,productsModule(productsOut)],[PATHS.products,productsOut]]:[]])
   if(await repo.read(path).catch(()=>null)!==content)files.push([path,content]);
  // Every label picture the published products use: already in the repository, or held in the draft until now.
  const held=new Map(records.flatMap(r=>Object.entries(r.files||{}))),pictures=[];
  for(const f of labelFiles(products)){
   const path=labelPath(f.image),disk=await repo.read(path,null).catch(()=>null);
   if(disk){if(f.sha256&&sha256(disk)!==f.sha256)return refuse([problem(path,'picture',`${path} is not the picture ${f.id}'s label was baked as (its sha256 differs); bake the label again.`)],{dryRun});continue;}
   const file=held.get(path),bytes=file?Buffer.from(file.data,'base64'):null;
   if(!bytes)return refuse([problem(path,'picture',`${f.id}'s label needs ${path}, which is neither in the repository nor in the draft; bake the label again.`)],{dryRun});
   if(sha256(bytes)!==file.sha256||(f.sha256&&f.sha256!==file.sha256))return refuse([problem(path,'picture',`The draft's copy of ${path} does not match its checksum; bake the label again.`)],{dryRun});
   if(!files.some(([p])=>p===path)){files.push([path,bytes]);pictures.push(path);}
  }
  if(entries.length)files.push([PATHS.log,jsonText({...log,changes:[...log.changes,...entries]})]);
  if(draft.changes.length)files.push([PATHS.draft,jsonText(emptyDraft())]);
  const result={ok:true,dryRun,problems:[],changes:entries.map(e=>({id:e.id,made:e.made,by:e.by,note:e.note})),people:draftSummary(published,looks),
   products:productSummary(publishedProducts,products),pictures,
   writes:files.map(([path])=>path),nothing:!draft.changes.length?'The draft is empty: World already has everything the creator said yes to.':undefined};
  if(dryRun||!files.length)return {...result,applied:false};
  await repo.writeAll(files);
  return {...result,applied:true};
 }));
}

/** Take drafted changes out (by id, or all of them) before they are published. Dry run by default. */
export function discardDraft({ids=[],all=false,dryRun=true,repo=openRepo()}={}){
 return serial(()=>repo.locked(async()=>{
  if(!all&&!ids.length)return refuse([problem('ids','missing','Name the drafted changes to take out (ids, as publish_draft lists them), or all:true.')],{dryRun});
  const draft=await readDraft(repo),unknown=ids.filter(id=>!draft.changes.some(c=>c.id===id));
  if(unknown.length)return refuse(unknown.map(id=>problem('ids','unknown',`There is no drafted change ${id}; publish_draft (a dry run) lists the drafted changes.`)),{dryRun});
  const gone=draft.changes.filter(c=>all||ids.includes(c.id)),kept=draft.changes.filter(c=>!gone.includes(c));
  const {stale}=replay({looks:await repo.readJSON(PATHS.looks),products:await repo.readJSON(PATHS.products).catch(()=>null)},kept,{brands:await readBrands(repo)});
  const result={ok:true,dryRun,problems:[],discarded:gone.map(c=>({id:c.id,note:c.note})),kept:kept.length,writes:gone.length?[PATHS.draft]:[],
   warnings:stale.map(s=>staleSentence(s))};
  if(dryRun||!gone.length)return {...result,applied:false};
  await repo.write(PATHS.draft,jsonText({...draft,changes:kept}));
  return {...result,applied:true};
 }));
}

/** A step in a few words, for the plain-words results. */
function describe(op){
 const who=op.name||op.id||op.product?.id||op.place?.target;
 const flavour=op.op==='product.add'&&op.place?.mode==='flavour';
 return {who:flavour?`${op.place.target} (${op.product.name})`:who,what:{'look.set':'look changed','look.reset':'look reset to how World draws them','character.create':'Studio character added',
  'character.set':'Studio character changed','character.delete':'Studio character deleted','product.update':'product changed',
  'product.add':flavour?'flavour added':`product added (${op.place?.mode})`,'product.retire':'product retired'}[op.op]||op.op};
}

/** What a draft does to Sakura's products against the published ones: lines changed (and which fields), added, retired. */
export function productSummary(published,products){
 if(!published||!products)return [];
 const out=[],before=new Map(published.products.map(p=>[p.id,p])),after=new Map(products.products.map(p=>[p.id,p]));
 for(const [id,p] of after){
  const was=before.get(id);
  if(!was){out.push({id,name:p.name,what:'added'});continue;}
  const fields=Object.keys({...was,...p}).filter(k=>recordSha256(was[k]??null)!==recordSha256(p[k]??null));
  if(fields.length)out.push({id,name:p.name,what:'changed',fields});
 }
 for(const r of products.retired)if(!published.retired.some(x=>x.id===r.id))out.push({id:r.id,name:r.name,what:'retired',why:r.why});
 return out;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const file=process.argv.slice(2).find(a=>!a.startsWith('--'));
 if(!file){console.error('Usage: node johansson-town/tools/studio/apply.mjs change.json [--write]');process.exit(2);}
 const size=(await stat(file).catch(()=>null))?.size;
 if(size===undefined){console.error(`There is no file ${file}.`);process.exit(2);}
 if(size>LIMITS.bytes){console.error(`${file} is ${(size/1048576).toFixed(1)} MB; a change may be at most 8 MB. Split it into smaller changes.`);process.exit(1);}
 const text=await readFile(file,'utf8');let change;
 try{change=JSON.parse(text);}catch{console.error(`${file} is not JSON.`);process.exit(1);}
 // Pictures are redrawn in Chromium before they are kept (page.mjs reencodeWebp).
 const page=change?.files&&Object.keys(change.files).length?new (await import('./page.mjs')).StudioPage():null;
 try{
  const r=await applyChange(change,{dryRun:!process.argv.includes('--write'),bytes:Buffer.byteLength(text),page});
  const {looks:_,products:__,files:___,...shown}=r;
  console.log(JSON.stringify(shown,null,1));
  if(!r.ok)process.exitCode=1;
 }finally{await page?.close();}
}
