import {WORLD_ROOM_TOOLS} from './world-rooms.mjs';
/**
 * Johansson Studio's tools: one table used by the MCP server (server.mjs) and the command line (cli.mjs), so the
 * same work gets done when the MCP connection is not there. Each tool has a JSON Schema input (zod's fromJSONSchema
 * turns it into the server's input), and its work loads only when it is first called: World's code and the core on
 * the first call, Chromium only for a render.
 *
 * Write tools are dry runs unless called with dryRun:false. A change the creator says yes to goes into Studio's draft
 * (data/studio/draft, which git ignores); publish_draft writes the draft into World's data, and only when the creator
 * says "update World". None of them commits or pushes.
 */
import {ASSET_TOOLS} from './assets.mjs';
import {MODEL_TOOLS} from './models.mjs';
import {FILM_PIPELINE_TOOLS} from './film-pipeline.mjs';
import {WORLD_LIBRARY_TOOLS} from './world-library.mjs';
import {COMIC_EFFECTS_TOOLS} from './comic-effects.mjs';
import {SCENE_TOOLS} from './scenes.mjs';
import {ROOM_TOOLS} from './rooms.mjs';

const NAME={type:'string',minLength:1,maxLength:40,description:'A resident\'s name as World writes it (e.g. "Mr Fujita", "Kōji"; accents and capitals may be left out), or a Studio character\'s id or name.'};
const SET={type:'object',minProperties:1,maxProperties:80,propertyNames:{pattern:'^[a-z][a-zA-Z]*(\\.[a-z][a-zA-Z]*)?$'},additionalProperties:{type:['string','number','boolean']},
 description:'Fields to change, by path: {"outfit.hat":"captain","hair.colour":"#9a9a96"}. character_get with options:true lists every path and its choices.'};
const NOTE={type:'string',minLength:1,maxLength:500,description:'Why, in at least four words. It is kept with each field it changes and in the change log.'};
const DRY={type:'boolean',default:true,description:'true (the default) only reports what would change; false writes it (to Studio\'s draft, never to git).'};
const object=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});

let core;
/** World's code and Studio's core, loaded on the first call. */
async function load(){
 core??=Promise.all([import('../../src/avatars/cast.js'),import('../../src/avatars/looks.js'),import('../../src/avatars/recipe.js'),import('../../src/avatars/personality.js'),
  import('../../src/studio/change.js'),import('../../src/studio/rules.js'),import('../../src/studio/sha256.js'),import('./apply.mjs'),import('./repo.mjs'),import('../../src/studio/label-spec.js')])
  .then(([cast,looks,recipe,personality,change,rules,sha,apply,repo,label])=>({cast,looks,recipe,personality,change,rules,sha,apply,repo,label}));
 return core;
}

/** A file of World's code (always the real checkout, also when a test points the data elsewhere). */
async function codeFile(path){const [{readFile},{resolve},c]=await Promise.all([import('node:fs/promises'),import('node:path'),load()]);return readFile(resolve(c.repo.CODE_ROOT,path),'utf8');}
const slug=s=>String(s).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);
const stamp=(made,what)=>`${made.slice(0,19).replace(/:/g,'-')}Z-${slug(what).replace(/^[^a-z0-9]+/,'')||'change'}`;
const withoutProfile=({profile,...rest})=>rest;
const own=(map,key)=>map&&Object.hasOwn(map,key)?map[key]:null;
const sentenceList=list=>[...new Set((list||[]).map(p=>p?.sentence??p))];
const clampSentence=c=>`${c.path} was ${c.given}; it runs from ${c.min??0} to ${c.max??1}, so ${c.used} is used.`;
const REFUSED='Nothing was written. Fix the problems above and call again.';

/** Everything about the people Studio knows: the published data with the draft laid over it, read fresh each call. */
async function people(ctx){
 const c=await load(),data=await c.apply.readData(ctx.repo),{looks,published}=data;
 let guide=[];try{guide=JSON.parse(await codeFile('johansson-town/guide/residents.json'));}catch{}
 const {PROFILES}=await import('../../src/people/profiles.js');
 const {homeForResident,secondaryHomesFor}=await import('../../src/people/island-households.js');
 const residence=h=>h?{id:h.home,address:h.address,residents:[...h.residents],unit:h.unit,island:h.island,entranceSiteId:h.entranceSiteId}:null;
 const roles=new Map([...PROFILES.map(p=>[p.name,p.role]),...guide.map(g=>[g.name,g.role])]);
 const groupOf=name=>Object.entries(c.cast.RESIDENT_GROUPS).find(([,names])=>names.includes(name))?.[0];
 const sha=v=>c.sha.recordSha256(v??null);
 const resident=name=>{const look=own(looks.looks,name),was=own(published.looks,name);
  return {kind:'resident',name,group:groupOf(name),look,publishedLook:was,unpublished:sha(look?.set)!==sha(was?.set),recipe:c.change.lookedRecipe(name,look?.set),role:roles.get(name)||'',
   home:residence(homeForResident(name)),secondaryHomes:secondaryHomesFor(name).map(residence)};};
 const studio=id=>{const r=looks.characters[id],was=own(published.characters,id);
  return {kind:'studio',id,name:r.name,group:'studio',record:r,unpublished:!was||sha(was)!==sha(r),recipe:r.recipe,role:r.card?.role||''};};
 /** A resident by name, or a Studio character by id or name; failing that, the one person whose name matches without accents or capitals. */
 function find(name){
  if(c.cast.RESIDENT_NAMES.includes(name))return resident(name);
  if(Object.hasOwn(looks.characters,name))return studio(name);
  const named=Object.keys(looks.characters).find(k=>looks.characters[k].name===name);if(named)return studio(named);
  const f=c.rules.foldName(name);
  const matches=[...c.cast.RESIDENT_NAMES.filter(n=>c.rules.foldName(n)===f).map(resident),
   ...Object.keys(looks.characters).filter(k=>k===f||c.rules.foldName(looks.characters[k].name)===f).map(studio)];
  if(matches.length>1)throw Error(`Several people match ${JSON.stringify(name)}: ${matches.map(m=>m.id?`${m.name} (id ${m.id})`:m.name).join(', ')}. Give the exact name or id.`);
  return matches[0]||null;
 }
 /** Nobody by that name: say so, and why when it is a name World uses for something else. */
 function unknown(name){
  const template=[...c.rules.NOT_RESIDENTS.keys()].find(n=>c.rules.foldName(n)===c.rules.foldName(name));
  return Error(template?c.rules.NOT_RESIDENTS.get(template):`Nobody called ${JSON.stringify(name)} lives in World or in Studio. character_list lists everybody.`);
 }
 return {c,data,looks,published,find,unknown,roles,groupOf,resident,studio};
}

/**
 * Make a change file for some steps (its id from the time, what it is about and the steps), then dry-run or apply it.
 * `files` are its pictures ({name: bytes}); they are redrawn as WebP in headless Studio before anything keeps them.
 */
async function change(ctx,{ops,note,dryRun,what,files={}}){
 const c=await load(),made=new Date().toISOString(),{fingerprint}=await c.apply.readData(ctx.repo);
 const id=`${stamp(made,what)}-${c.sha.recordSha256(ops).slice(0,6)}`,names=Object.keys(files);
 const carried=Object.fromEntries(names.map(n=>[n,{sha256:c.sha.sha256(files[n]),data:Buffer.from(files[n]).toString('base64')}]));
 const file={format:'johansson-studio-change',version:1,id,made,by:'claude',note,base:{looks:fingerprint.looks,...fingerprint.products?{products:fingerprint.products}:{}},ops,...names.length?{files:carried}:{}};
 const r=await c.apply.applyChange(file,{dryRun,repo:ctx.repo,uniqueId:true,page:names.length?await ctx.page():null});
 // The change as it was sent, its pictures named by checksum only (their bytes are in the draft once applied).
 return {...r,change:{...file,id:r.id||id,...names.length?{files:Object.fromEntries(names.map(n=>[n,{sha256:carried[n].sha256}]))}:{}}};
}
function report(r,extra={}){
 return {ok:r.ok,applied:r.applied,dryRun:r.dryRun,...extra,results:r.results,problems:sentenceList(r.problems),conflicts:sentenceList(r.conflicts),
  warnings:sentenceList(r.warnings),writes:r.writes,nothing:r.nothing,change:r.change,
  next:!r.ok?REFUSED:r.dryRun?'A dry run: nothing was written. Show the creator, and call again with dryRun:false when they say yes.':
   r.applied?'Added to Studio\'s draft (data/studio/draft, outside git): the tools and portraits show it now. World and Studio on the iPad show it once the creator says "update World" (publish_draft).':undefined};
}

// ─── Products and labels (stage 2): Sakura Shōten's lines, data/studio/products.json ─────────────────────────────
const PRODUCT_ID={type:'string',minLength:1,maxLength:40,description:'A product\'s id, its save key (e.g. "beer"), or its name ("Umineko lager"); product_list lists them.'};
const PRODUCT_SET={type:'object',minProperties:1,maxProperties:20,propertyNames:{pattern:'^[a-z][a-zA-Z]*(\\.[a-z][a-zA-Z]*){0,2}$'},
 description:'Fields to change, by path: {"price":240}, {"brand.ink":"#2a4a38"}, {"purpose.why":"…"}, {"label":{"source":"designed","spec":{"v":1,"base":"paper","layers":[…]}}}. null takes an optional field away. A designed label with no picture is baked in headless Studio and returned to look at. product_get lists the fields; avatar-creator/docs/STUDIO-MCP.md describes a label design.'};
const SPEC={type:'object',description:'A label design: {"v":1,"base":"paper"|"painted","layers":[…]} (src/studio/label-spec.js).'};
const VIEW={enum:['front','back','turn','shelf','flat','cell'],default:'front',description:'front or back (the pack picked up), turn (four sides), shelf (the line and its flavours on a shelf), flat (the label unrolled, the part facing you marked), cell (its 256×128 shelf cell and its flavours).'};
/** The known findings about a product that wait for the creator (avatar-creator/docs/STUDIO-MCP.md, "Findings"). */
const FINDINGS={
 beer:['The can in the hand is blue (drink.handColour #2d6b9a) while the can on the shelf is gold: fixing it is a visible batch of its own.',
  'Its back panel says "Nutrition (per bottle)" (pack.back.unit "bottle") on a can, as the coffee\'s does.',
  'The 350 ml can is 94 × 135 mm in World; a real one is 66 × 122 mm (decision 6: game scale on purpose?).',
  'Retiring it waits for the creator: friendship.js (gift likes), game.js (drinking it), the bars’ drink lines and more name it (product_get references).'],
 tea:['The poster beside the tea advertises GOLDEN MILK TEA, not NAGI (store-advertising.js POSTER_SPECS).'],
 coffee:['The poster beside the coffee advertises NIGHT SHIFT, not PORT 88 (store-advertising.js POSTER_SPECS).'],
 biscuit:['The poster beside the biscuits advertises STICK BITES, not KOMOREBI (store-advertising.js POSTER_SPECS).'],
};
const ZONE_WORDS={west:'pantry',middle:'sweets',east:'daily goods'};
/** Where a line stands, in words. */
function whereWords(p){
 const s=p.shelf;
 if(s.fitting==='fridge')return `the cold cabinet, column ${s.column} (${['the first, by the door side','the second','the third','the last, nearest the till'][s.column]}), shelves ${s.levels.join(', ')} counted from 0 at the bottom`;
 if(s.fitting==='chiller')return `the open chiller, bay ${s.bay}, ${s.deck} deck`;
 if(s.fitting==='steamer')return 'the bun steamer on the counter';
 return `the ${ZONE_WORDS[s.fitting]} gondola, bay ${s.bay}, line ${s.order+1} from the lowest board`;
}
/** Sakura's products as the tools see them: the published data with the draft laid over it, read fresh each call. */
async function shop(ctx){
 const c=await load(),data=await c.apply.readData(ctx.repo);
 if(!data.products)throw Error('There is no data/studio/products.json in this checkout.');
 const list=data.products.products,brands=await ctx.repo.readJSON(c.repo.PATHS.brands);
 const find=id=>{const f=c.rules.foldName(id);return list.find(p=>p.id===id)||list.find(p=>c.rules.foldName(p.name)===f||c.rules.foldName(p.inventoryName)===f)||null;};
 const unknown=id=>{const r=data.products.retired.find(x=>x.id===id||x.name===id);return Error(r?`${r.name} was retired (${r.why}); a retired line is not changed.`:`There is no product ${JSON.stringify(id)} in Sakura. product_list lists them.`);};
 const published=new Map((data.publishedProducts?.products||[]).map(p=>[p.id,p]));
 const unpublished=p=>!published.has(p.id)||c.sha.recordSha256(published.get(p.id))!==c.sha.recordSha256(p);
 return {c,data,list,find,unknown,brands,published,unpublished};
}
/** The bytes of the pictures a label's layers show: kept in assets/graphics/labels/, or held in the draft. */
async function layerBytes(ctx,spec,data){
 const c=await load(),out={},held=new Map(data.draft.flatMap(r=>Object.entries(r.files||{})));
 for(const file of c.label.labelPictures(spec)){
  if(out[file])continue;const path=c.apply.labelPath('labels/'+file);
  out[file]=await ctx.repo.read(path,null).catch(()=>held.has(path)?Buffer.from(held.get(path).data,'base64'):null);
  if(!out[file])throw Error(`The label uses the picture ${file}, which is neither kept nor in the draft.`);
 }
 return out;
}
/** A designed label's baked picture as it stands now: kept in the repository, or held in the draft (null if neither). */
async function labelBytes(ctx,product,data){
 if(product.label.source!=='designed')return null;
 const c=await load(),path=c.apply.labelPath(product.label.image),held=data.draft.flatMap(r=>Object.entries(r.files||{})).find(([p])=>p===path);
 return await ctx.repo.read(path,null).catch(()=>held?Buffer.from(held[1].data,'base64'):null);
}
/** Bake a label design for a product in headless Studio: {spec, png} or {problems}. */
async function bake(ctx,product,spec,data,{pictures={}}={}){
 const c=await load(),known=new Set(Object.keys(pictures));
 const r=c.label.normalizeLabelSpec(spec,{pictures:f=>c.label.PICTURE_FILE.test(f)||known.has(f)});
 if(r.problems.length)return {problems:sentenceList(r.problems)};
 const kept=await layerBytes(ctx,{layers:r.spec.layers.filter(l=>l.type!=='picture'||!known.has(l.file))},data);
 const png=await (await ctx.page()).bakeLabel(product,r.spec,{pictures:{...kept,...pictures}});
 return {spec:r.spec,png,clamped:r.clamped.map(x=>`${x.where.split('.').slice(-1)[0]} was ${x.given}; ${x.used} is used.`)};
}
/** A picture for the creator to look at, kept under output/studio-mcp/ (git ignores it). */
async function keepPicture(ctx,folder,name,png){const c=await load(),path=`${c.repo.PATHS.output}/${folder}/${slug(name)}-${Date.now().toString(36)}.png`;await ctx.repo.write(path,png);return path;}
function reportProduct(r,extra={},picture=null){
 const out={ok:r.ok,applied:r.applied,dryRun:r.dryRun,...extra,results:r.results,problems:sentenceList(r.problems),conflicts:sentenceList(r.conflicts),warnings:sentenceList(r.warnings),
  writes:r.writes,pictures:r.pictures?.map(p=>`${p.path} (${p.width} × ${p.height}, from ${p.from})`),nothing:r.nothing,change:r.change,
  next:!r.ok?REFUSED:r.dryRun?'A dry run: nothing was written. Show the creator (render_product draws it), and call again with dryRun:false when they say yes.':
   r.applied?'Added to Studio\'s draft (data/studio/draft, outside git): product_get, product_list and render_product show it now. World shows it once the creator says "update World" (publish_draft).':undefined};
 return picture?{image:picture.toString('base64'),mimeType:'image/png',data:out}:out;
}

const PRODUCT_TOOLS=[
 {name:'product_list',readOnly:true,description:'List Sakura Shōten\'s products: id, name, brand and line, price, zone, where it stands, its label (painted, fresh or designed), its flavours, and whether a change to it is still only in Studio\'s draft. Filter by zone or by part of a name. Also says how many more products and flavours fit in the label atlas.',
  input:object({shop:{enum:['sakura'],default:'sakura'},zone:{enum:['drinks','fresh','pantry','sweets','daily','counter']},query:{type:'string',maxLength:40,description:'Part of an id, a name or a brand (accents and capitals may be left out).'},includeRetired:{type:'boolean',default:false}}),
  async run({zone,query,includeRetired=false},ctx){
   const {c,data,list,brands,unpublished}=await shop(ctx),q=query==null?null:c.rules.foldName(query);
   const rows=list.filter(p=>(!zone||p.purpose.zone===zone)&&(!q||c.rules.foldName([p.id,p.name,p.brand.name,p.brand.jp,p.brand.line].join(' ')).includes(q)))
    .map(p=>({id:p.id,name:p.name,brand:`${p.brand.name} · ${p.brand.line}`,price:p.price,zone:p.purpose.zone,where:whereWords(p),label:p.label.source,flavours:p.cells.flavours.map(f=>f.name),unpublished:unpublished(p)}));
   const {room}=c.rules.validateProducts(data.products,{brands});
   return {count:rows.length,products:rows,...includeRetired?{retired:data.products.retired.map(r=>({id:r.id,name:r.name,why:r.why,retired:r.retired}))}:{},
    room:`${room?.products??0} more products and ${room?.flavours??0} more flavours fit in the label atlas.`};
  }},
 {name:'product_get',readOnly:true,description:'One product: its whole record (brand, pack, label, cells, purpose, shelf, supplier, drink), where it stands in words, what is published and what is only in the draft, the fields a change may set, the known findings about it, and where World still names it: code as file:line, tests, trade accounts, and other drawings its label does not reach (backroom crates, posters, the can in the hand). Retiring it is refused while code, tests or accounts name it.',
  input:object({id:PRODUCT_ID},['id']),
  async run({id},ctx){
   const {c,find,unknown,published,unpublished}=await shop(ctx),p=find(id);if(!p)throw unknown(id);
   const {productReferences}=await import('./references.mjs'),refs=await productReferences(p),at=r=>`${r.file}:${r.line} ${r.text}`;
   return {id:p.id,name:p.name,where:whereWords(p),product:p,unpublished:unpublished(p),published:unpublished(p)?published.get(p.id)??null:undefined,
    cells:{label:p.cells.brand,priceTag:p.cells.price,flavours:p.cells.flavours.map(f=>`${f.name}: cell ${f.cell} of the right half, hue ${f.hue>0?'+':''}${f.hue}°`)},
    fields:c.rules.PRODUCT_FIELDS,findings:FINDINGS[p.id]||[],
    references:{code:refs.code.map(at),tests:refs.tests.map(at),accounts:refs.accounts.map(a=>`${a.name} (from ${a.supplier}): ${a.lines.join('; ')}`),drawings:refs.drawings.map(at)},
    retire:refs.blocking?`Refused while ${refs.code.length} code lines, ${refs.tests.length} test lines and ${refs.accounts.length} trade accounts name it; each needs the creator's choice first.`:'Possible: nothing in World\'s code names it. Its shelf must go to a line beside it (shelfTo).'};
  }},
 {name:'product_update',destructive:true,description:'Change fields of a product by path: its label, price, words, brand colours, purpose or shelf (never its id, its inventoryName or its atlas cells). A designed label (label.source "designed" with a spec) is baked in headless Studio and the picture is returned to show the creator; changing a brand colour bakes a designed label again so it follows. Dry run by default; with dryRun:false the change goes into Studio\'s draft, and World shows it once the creator says "update World".',
  input:object({id:PRODUCT_ID,set:PRODUCT_SET,note:NOTE,dryRun:DRY},['id','set','note']),
  async run({id,set,note,dryRun=true},ctx){
   const {c,data,find,unknown}=await shop(ctx),p=find(id);if(!p)throw unknown(id);
   let label=set.label,png=null,clamped=[];
   if(!label&&p.label.source==='designed'&&Object.keys(set).some(k=>k==='brand'||k.startsWith('brand.')))label={source:'designed',spec:p.label.spec};
   const files={};
   if(label?.source==='designed'&&label.picture===undefined&&label.image===undefined){
    // Baked with the other fields of this change already in place, so new brand colours are in the picture.
    const draft=structuredClone(p);for(const [path,value] of Object.entries(set))if(path!=='label'){const keys=path.split('.'),last=keys.pop();let at=draft;for(const k of keys)at=at[k]??={};at[last]=value;}
    const baked=await bake(ctx,draft,label.spec,data);
    if(baked.problems)return {ok:false,applied:false,dryRun,id:p.id,problems:baked.problems,next:REFUSED};
    png=baked.png;clamped=baked.clamped;files[`${p.id}.label.png`]=png;
    label={source:'designed',spec:baked.spec,picture:`${p.id}.label.png`,bakedOn:'Chromium'};
   }
   const finalSet=label?{...set,label}:set;
   const was=Object.fromEntries(Object.keys(finalSet).map(k=>[k,c.rules.readField(p,k)??null]));
   const r=await change(ctx,{ops:[{op:'product.update',id:p.id,set:finalSet,was,note}],note,dryRun,what:`${p.id} product`,files});
   const path=png?await keepPicture(ctx,'labels',`${p.id}-label`,png):undefined;
   return reportProduct(r,{id:p.id,name:p.name,product:r.products?.products.find(x=>x.id===p.id),diff:r.results?.flatMap(x=>x.diff)||[],clamped,baked:path},png);
  }},
 {name:'product_label_picture',destructive:true,description:'Make a product\'s label from a picture (a photo or a drawing from the creator): it is cut to the label\'s 2:1 (the centre, or crop {x,y,w,h} as fractions), redrawn in headless Studio (only its pixels are kept: no EXIF, no location) and baked as a designed label. words lists every word printed on the picture, which the real-brand check reads. Returns the baked label. Dry run by default.',
  input:object({id:PRODUCT_ID,image:{type:'string',minLength:8,maxLength:2900000,pattern:'^[A-Za-z0-9+/]*={0,2}$',description:'The picture as base64 (PNG, JPEG or WebP, at most 2 MB).'},
   words:{type:'array',maxItems:40,items:{type:'string',minLength:1,maxLength:60},description:'Every word printed on the picture (an empty list if none).'},
   crop:object({x:{type:'number',minimum:0,maximum:1},y:{type:'number',minimum:0,maximum:1},w:{type:'number',minimum:.01,maximum:1},h:{type:'number',minimum:.01,maximum:1}},['x','y','w','h']),
   note:NOTE,dryRun:DRY},['id','image','words','note']),
  async run({id,image,words,crop,note,dryRun=true},ctx){
   const {c,data,find,unknown}=await shop(ctx),p=find(id);if(!p)throw unknown(id);
   const bytes=Buffer.from(image,'base64'),checked=c.rules.pictureProblems('the picture',{data:image,sha256:c.sha.sha256(bytes)}).filter(x=>!/must end in/.test(x.sentence));
   if(checked.length)return {ok:false,applied:false,dryRun,id:p.id,problems:sentenceList(checked),next:REFUSED};
   if(crop&&(crop.x+crop.w>1.0001||crop.y+crop.h>1.0001))return {ok:false,applied:false,dryRun,id:p.id,problems:['The crop runs off the picture: x + w and y + h must be at most 1.'],next:REFUSED};
   const cut=await (await ctx.page()).cropPicture(bytes,{crop:crop||null,aspect:2}),photo=`${p.id}.photo.png`;
   const spec={v:1,base:'paper',layers:[{type:'picture',file:photo,x:.5,y:.5,w:1,h:1,words}]};
   const baked=await bake(ctx,p,spec,data,{pictures:{[photo]:cut}});
   if(baked.problems)return {ok:false,applied:false,dryRun,id:p.id,problems:baked.problems,next:REFUSED};
   const label={source:'designed',spec:baked.spec,picture:`${p.id}.label.png`,bakedOn:'Chromium'};
   const r=await change(ctx,{ops:[{op:'product.update',id:p.id,set:{label},was:{label:p.label},note}],note,dryRun,what:`${p.id} picture`,files:{[photo]:cut,[`${p.id}.label.png`]:baked.png}});
   const path=await keepPicture(ctx,'labels',`${p.id}-picture-label`,baked.png);
   return reportProduct(r,{id:p.id,name:p.name,baked:path},baked.png);
  }},
 {name:'product_add',description:'Add to Sakura: a flavour of a line (as "flavour": product {name, hue}; one more cell in the label atlas, the cheapest), or a new line (as "product": the record, started from another product with from) that shares a line\'s shelf (place.mode "share"), takes the place of a line it retires (replace) or stands on free shelf (free, with product.shelf). A new line needs its purpose (who it is for, why, why there) and gets a designed label: its own, or one redrawn from its brand, baked and returned. Dry run by default.',
  input:object({from:PRODUCT_ID,as:{enum:['flavour','product']},product:{type:'object',description:'A flavour: {name, hue}. A line: {id, name, jp, price, text, brand, purpose, …} (anything left out comes from `from`; label is a design {v:1,…} or left out to redraw from the brand).'},
   place:object({mode:{enum:['flavour','share','replace','free']},target:{type:'string',pattern:'^[a-z][a-z0-9-]{1,39}$'},why:{type:'string',maxLength:300,description:'For replace: why the old line goes.'}},['mode']),note:NOTE,dryRun:DRY},['as','product','place','note']),
  async run({from,as,product,place,note,dryRun=true},ctx){
   const {c,data,find,unknown}=await shop(ctx),source=from?find(from):null;if(from&&!source)throw unknown(from);
   if(as==='flavour'){
    const line=find(place.target||from||'');if(!line)throw Error('Say which line the flavour belongs to (place.target or from).');
    const r=await change(ctx,{ops:[{op:'product.add',product:{name:product.name,hue:product.hue},place:{mode:'flavour',target:line.id}}],note,dryRun,what:`${line.id} flavour`});
    return reportProduct(r,{line:line.id,flavour:product.name,product:r.products?.products.find(x=>x.id===line.id)});
   }
   if(place.mode==='flavour')throw Error('A new line is placed by sharing a shelf (share), replacing a line (replace) or on free shelf (free).');
   const target=place.target?find(place.target):null;if(place.target&&!target)throw unknown(place.target);
   const base=structuredClone(source||target||{});
   const record={id:product.id,inventoryName:product.name,shop:'sakura',name:product.name,jp:product.jp??base.jp,price:product.price??base.price,
    text:product.text??'',bagColour:product.bagColour??product.brand?.paper??base.bagColour??null,brand:{...base.brand,...product.brand},
    pack:{...base.pack,...product.pack,back:{...base.pack?.back,...product.pack?.back}},purpose:product.purpose,
    ...place.mode==='free'?{shelf:product.shelf}:{},capacity:product.capacity??(place.mode==='share'&&target?.shelf.fitting==='fridge'?target.capacity/target.shelf.levels.length:base.capacity??24),
    supplier:product.supplier??base.supplier??'sakura',...product.drink?{drink:product.drink}:{}};
   if(record.pack){delete record.pack.declared;}
   const files={},designed=product.label?.layers?product.label:product.label?.spec;
   const spec=designed||c.label.brandSpec({...record,pack:record.pack||{}});
   const baked=await bake(ctx,{...record,cells:{brand:-1,flavours:[]}},spec,data);
   if(baked.problems)return {ok:false,applied:false,dryRun,problems:baked.problems,next:REFUSED};
   files[`${record.id}.label.png`]=baked.png;record.label={source:'designed',spec:baked.spec,picture:`${record.id}.label.png`,bakedOn:'Chromium'};
   const r=await change(ctx,{ops:[{op:'product.add',product:record,place:{mode:place.mode,...target?{target:target.id}:{},...place.why?{why:place.why}:{}}}],note,dryRun,what:`${record.id||'new'} add`,files});
   const path=await keepPicture(ctx,'labels',`${record.id||'new'}-label`,baked.png);
   return reportProduct(r,{id:record.id,name:record.name,product:r.products?.products.find(x=>x.id===record.id),baked:path},baked.png);
  }},
 {name:'product_retire',destructive:true,description:'Take a product off sale: its record moves to the retired list (old saves still know it, its id is never used again) and its shelf goes to shelfTo, a line beside it (the other line in its cold-cabinet column, or a line in its gondola bay). Refused, with every reference listed, while World\'s code, tests or trade accounts still name it: "delete the beer" waits for the creator\'s choices about its stories. Dry run by default.',
  input:object({id:PRODUCT_ID,why:{type:'string',minLength:1,maxLength:300,description:'Why it goes, in at least four words.'},shelfTo:{type:'string',pattern:'^[a-z][a-z0-9-]{1,39}$'},dryRun:DRY},['id','why']),
  async run({id,why,shelfTo,dryRun=true},ctx){
   const {c,find,unknown}=await shop(ctx),p=find(id);if(!p)throw unknown(id);
   const r=await change(ctx,{ops:[{op:'product.retire',id:p.id,why,...shelfTo?{shelfTo}:{},was:c.sha.recordSha256(p)}],note:why,dryRun,what:`${p.id} retire`});
   return reportProduct(r,{id:p.id,name:p.name});
  }},
 {name:'render_product',idempotent:true,image:true,description:'A PNG of a product drawn in headless Johansson Studio by World\'s own code (the iPad\'s, at its viewport): a product by id (as Studio has it now, draft included) or a draft record. Views: front, back, turn, shelf, flat, cell. Also saved under output/studio-mcp/products/ (git ignores it).',
  input:object({id:PRODUCT_ID,draft:{type:'object',description:'A whole product record (e.g. product_get\'s product with changes); a designed label in it with a spec and no picture is baked first.'},view:VIEW,
   size:{type:'integer',minimum:128,maximum:1024,default:512},background:{type:'string',pattern:'^(#[0-9a-fA-F]{6}|transparent)$',default:'#f3ede2'}}),
  async run({id,draft,view='front',size=512,background='#f3ede2'},ctx){
   if(!id===!draft)throw Error('Give either an id or a draft.');
   const {data,find,unknown}=await shop(ctx);let product=id?find(id):draft,label=null;if(!product)throw unknown(id);
   if(draft){
    const c=await load(),problems=c.rules.validateProduct({...draft,label:draft.label?.source==='designed'&&!draft.label.image?{...draft.label,image:`labels/${draft.id}.r1.webp`,sha256:'0'.repeat(64),bakedOn:'Chromium'}:draft.label},{brands:await ctx.repo.readJSON(c.repo.PATHS.brands)});
    if(problems.length)return {error:'This draft is not a product World could draw.',problems:sentenceList(problems)};
    if(draft.label?.source==='designed'&&!draft.label.image){const baked=await bake(ctx,draft,draft.label.spec,data);if(baked.problems)return {error:'The label design cannot be drawn.',problems:baked.problems};label=baked.png;}
   }
   label??=await labelBytes(ctx,product,data);
   const png=await (await ctx.page()).renderProduct(product,{view,size,background,labelImage:label});
   const path=await keepPicture(ctx,'products',`${product.id}-${view}-${size}`,png);
   return {image:png.toString('base64'),mimeType:'image/png',data:{id:product.id,name:product.name,view,size,path}};
  }},
];

export const TOOLS=[
 {name:'studio_workflow_info',readOnly:true,description:'Start here: discover the shared Johansson Studio editing, GLB, room, comic and existing-film workflows, server responsibilities, portable files and creator approval boundary. Does not read private files or write anything.',input:object({}),
  async run(){return {
   editor:'avatar-creator/ (the same page can be served by the desktop Town Studio local server)',
   server:'johansson-studio: node johansson-town/tools/studio/server.mjs, working directory = website repository root',
   models:['model_inspect','model_prepare','model_snap'],
   rooms:['room_create','room_open','room_get','room_import_model','room_edit','room_check','room_render','room_export'],
   worldRooms:{supported:['dock-workshop'],tools:['world_room_open','world_room_check','world_room_publish','world_room_rollback']},
   assets:['asset_list','asset_export','asset_draft','asset_publish','world_asset_list','world_asset_get'],
   comics:['scene_classroom_example','scene_render','comic_render','comic_effects_info','comic_after_effects'],
   film:{tools:['film_pipeline_info','scene_export_film'],engine:'nj22az/jojo/remotion',desktopServer:'town-studio owns desktop status, get_latest, film scripts and explicitly confirmed deployment; do not duplicate its renderer.'},
   exchange:'Browser IndexedDB and MCP drafts are separate. Exchange .room.json explicitly. GLB exports contain static geometry; editable room files retain IDs, reusable assets and native bindings.',
   approval:'Preview and validate first. Only after creator approval call the relevant publish tool with dryRun:false. This writes local data only. Build runtime, validate, review the exact diff and deploy separately. Never infer approval from a successful check.',
   guide:'avatar-creator/docs/STUDIO-WORKFLOW.md',limits:['Static self-contained GLB only; rigs, animation and unsupported compression are refused.','World publication is implemented only for the Dock Workshop adapter.','Physical Safari and native desktop Qt acceptance remain required.']
  };}},
 {name:'character_list',readOnly:true,description:'List the people Studio can draw: World\'s cast, its neighbours, the ferry\'s crew and the port clerk (by the names World calls them: Mac, Ms Ganaha), the townsfolk (drawn from their name and personality), and Studio-only characters. Says whose look Studio has changed, and which changes are still only in Studio\'s draft (unpublished).',
  input:object({group:{enum:['cast','neighbour','crew','townsfolk','studio']},query:{type:'string',maxLength:40,description:'Part of a name or role (accents and capitals may be left out).'}}),
  async run({group,query},ctx){
   const {c,looks,resident,studio}=await people(ctx),q=query===undefined?null:c.rules.foldName(query);
   const all=[...c.cast.RESIDENT_NAMES.map(resident),...Object.keys(looks.characters).map(studio)]
    .map(p=>({name:p.name,...p.id?{id:p.id}:{},group:p.group,role:p.role,home:p.home||null,secondaryHomes:p.secondaryHomes||[],edited:p.kind==='studio'||!!p.look,unpublished:p.unpublished}));
   const list=all.filter(p=>(!group||p.group===group)&&(!q||c.rules.foldName(p.name+' '+p.role).includes(q)));
   return {count:list.length,characters:list};
  }},
 {name:'character_get',readOnly:true,description:'One person\'s recipe as Studio draws them now (World\'s drawing with any Studio look, drafted or published; never this device\'s private wardrobe), their Studio look (fields and why), what is published, where the look comes from, and their profile (gait and voice, which a look never changes). options:true adds every field a look may set, with its choices.',
  input:object({name:NAME,options:{type:'boolean',default:false}},['name']),
  async run({name,options},ctx){
   const {c,find,unknown}=await people(ctx),who=find(name);if(!who)throw unknown(name);
   const source=who.kind==='studio'?'a Studio-only character (data/studio/looks.json); World does not place them yet':
    {cast:'drawn in src/avatars/cast.js (CAST_RECIPES)',neighbour:'drawn in src/avatars/cast.js (NEIGHBOUR_RECIPES)',crew:'drawn in src/avatars/cast.js (CREW_LOOKS), by the name the live cast uses',townsfolk:'made from their name and personality (cast.js baseRecipe)'}[who.group];
   const {profile,...recipe}=who.recipe;
   return {name:who.name,id:who.id,group:who.group,role:who.role,home:who.home||null,secondaryHomes:who.secondaryHomes||[],source,look:who.kind==='resident'?who.look:null,
    published:who.kind==='resident'?who.publishedLook:undefined,unpublished:who.unpublished,card:who.record?.card,recipe,profile,
    note:'profile (gait and voice) is read-only: a look changes how somebody looks, not who they are. A resident keeps the life stage World draws them at.',
    options:options?c.looks.LOOK_FIELDS:undefined};
  }},
 {name:'character_update',destructive:true,description:'Change fields of a resident\'s look or of a Studio-only character. Numbers outside their range (0..1; the shirt number 0..99) are clamped and reported. Dry run by default; with dryRun:false the change goes into Studio\'s draft, and World shows it once the creator says "update World".',
  input:object({name:NAME,set:SET,note:NOTE,dryRun:DRY},['name','set','note']),
  async run({name,set,note,dryRun=true},ctx){
   const {c,find,unknown}=await people(ctx),who=find(name);if(!who)throw unknown(name);
   const checked=c.rules.validateLookSet(set);
   if(checked.problems.length)return {ok:false,applied:false,dryRun,name:who.name,problems:sentenceList(checked.problems),next:REFUSED};
   const was=Object.fromEntries(Object.keys(checked.set).map(p=>[p,c.looks.readPath(who.recipe,p)]));
   const op=who.kind==='resident'?{op:'look.set',name:who.name,set:checked.set,was,note}:{op:'character.set',id:who.id,set:checked.set,was};
   const r=await change(ctx,{ops:[op],note,dryRun,what:`${who.id||who.name} look`});
   const after=r.looks&&(who.kind==='resident'?c.change.lookedRecipe(who.name,own(r.looks.looks,who.name)?.set):own(r.looks.characters,who.id)?.recipe);
   return report(r,{name:who.name,recipe:after?withoutProfile(after):undefined,diff:r.results?.flatMap(x=>x.diff)||[],clamped:checked.clamped.map(clampSentence)});
  }},
 {name:'character_create',description:'Add a Studio-only character, starting from how a resident or Studio character looks (from) or from the plain default, with some fields set. They get a profile of their own (from their name), never the profile of the person they start from. World does not place them: a World resident needs a home, a routine and a personality (an open decision for the creator). Dry run by default.',
  input:object({name:{type:'string',minLength:1,maxLength:24},id:{type:'string',pattern:'^[a-z][a-z0-9-]{1,39}$'},from:NAME,set:{...SET,minProperties:0},
   card:object({role:{type:'string',minLength:1,maxLength:60},why:{type:'string',minLength:1,maxLength:300,description:'Who they are for and why they exist, in at least four words.'}},['role','why']),note:{...NOTE,description:'Why, in at least four words (defaults to the card\'s why).'},dryRun:DRY},['name','card']),
  async run({name,id,from,set={},card,note,dryRun=true},ctx){
   const {c,find,unknown}=await people(ctx);let start=c.recipe.DEFAULT_RECIPE;
   if(from){const who=find(from);if(!who)throw unknown(from);start=who.recipe;}
   const checked=c.rules.validateLookSet(set,{allowEmpty:true});
   if(checked.problems.length)return {ok:false,applied:false,dryRun,problems:sentenceList(checked.problems),next:REFUSED};
   // How `from` looks, with the fields set; a profile (dials, voice) of their own, from their name, until the creator
   // decides how a new character gets a personality (decision 5).
   const {profile:_,...look}=start;
   const recipe=c.recipe.normalizeRecipe(c.personality.withTownDials(c.recipe.normalizeRecipe(c.looks.applyLook({...look,name},checked.set)),name));
   // A name in kana or kanji has no letters for an id: it gets one from its fingerprint.
   const cid=id||(/^[a-z][a-z0-9-]{1,39}$/.test(slug(name))?slug(name):'character-'+c.sha.sha256(name).slice(0,8));
   const r=await change(ctx,{ops:[{op:'character.create',id:cid,character:{name,recipe,card}}],note:note||card.why,dryRun,what:`${cid} new`});
   return report(r,{id:cid,name,clamped:checked.clamped.map(clampSentence)});
  }},
 {name:'character_reset',destructive:true,description:'Take a resident\'s Studio look away, so World draws them as it did before. A resident can never be deleted. Dry run by default; with dryRun:false the reset goes into Studio\'s draft.',
  input:object({name:NAME,note:{...NOTE,description:'Why, in at least four words (optional).'},dryRun:DRY},['name']),
  async run({name,note,dryRun=true},ctx){
   const {find,unknown}=await people(ctx),who=find(name);if(!who)throw unknown(name);
   if(who.kind!=='resident')throw Error(`${who.name} is a Studio-only character; character_delete removes them.`);
   if(!who.look)return {ok:true,applied:false,dryRun,nothing:`${who.name} has no Studio look: World already draws them as cast.js does.`};
   const r=await change(ctx,{ops:[{op:'look.reset',name:who.name,was:who.look.set}],note:note||`Reset ${who.name}'s look to how World draws them.`,dryRun,what:`${who.name} reset`});
   return report(r,{name:who.name});
  }},
 {name:'character_delete',destructive:true,description:'Delete a Studio-only character. Residents of World are never deleted (character_reset gives back their World look). Dry run by default; with dryRun:false the deletion goes into Studio\'s draft.',
  input:object({id:{type:'string',minLength:1,maxLength:40,description:'The Studio character\'s id (or name).'},note:{...NOTE,description:'Why, in at least four words (optional).'},dryRun:DRY},['id']),
  async run({id,note,dryRun=true},ctx){
   const {c,find,unknown}=await people(ctx),who=find(id);if(!who)throw unknown(id);
   if(who.kind==='resident')throw Error(`${who.name} lives in Johansson World and can never be deleted; character_reset takes away a Studio look.`);
   const r=await change(ctx,{ops:[{op:'character.delete',id:who.id,was:c.sha.recordSha256(who.record)}],note:note||`Delete the Studio character ${who.name}.`,dryRun,what:`${who.id} delete`});
   return report(r,{id:who.id,name:who.name});
  }},
 {name:'render_portrait',idempotent:true,image:true,description:'A PNG portrait drawn in headless Johansson Studio (the iPad\'s own code, at its 1024x1366 viewport): a person by name (as Studio draws them now, draft included) or a recipe. Also saved under output/studio-mcp/portraits/ (git ignores it).',
  input:object({name:NAME,recipe:{type:'object',description:'A recipe instead of a name, e.g. a draft from character_get.'},view:{enum:['front','quarter','left','right','back'],default:'front'},
   expression:{type:'string',maxLength:30,default:'smile'},pose:{type:'string',maxLength:40,default:'Idle'},framing:{enum:['full','face'],default:'full'},
   size:{type:'integer',minimum:128,maximum:1024,default:512},background:{type:'string',pattern:'^(#[0-9a-fA-F]{6}|transparent)$',default:'#f3ede2'}}),
  async run({name,recipe,view='front',expression='smile',pose='Idle',framing='full',size=512,background='#f3ede2'},ctx){
   if(!name===!recipe)throw Error('Give either a name or a recipe.');
   // The Build scene's own lists, checked before Chromium starts.
   const {KNOWN_POSES,KNOWN_EXPRESSIONS}=await import('../../../avatar-creator/scene-catalogue.mjs');
   if(!KNOWN_POSES.has(pose))throw Error(`Unknown pose "${pose}". Poses: ${[...KNOWN_POSES].join(', ')}.`);
   if(!KNOWN_EXPRESSIONS.has(expression))throw Error(`Unknown expression "${expression}". Expressions: ${[...KNOWN_EXPRESSIONS].join(', ')}.`);
   const {c,find,unknown}=await people(ctx);let who=null;
   if(name){who=find(name);if(!who)throw unknown(name);}
   const drawn=c.recipe.normalizeRecipe(who?who.recipe:recipe),page=await ctx.page();
   const png=await page.renderPortrait(drawn,{view,expression,pose,framing,size,background});
   const path=`${c.repo.PATHS.output}/portraits/${[slug(who?.name||drawn.name)||'recipe',...[view,framing,pose,expression,size].map(slug)].join('-')}.png`;
   await ctx.repo.write(path,png);
   return {image:png.toString('base64'),mimeType:'image/png',data:{name:who?.name||drawn.name||'(recipe)',view,expression,pose,framing,size,path}};
  }},
 {name:'validate',readOnly:true,description:'Check Studio\'s published data (looks, products and their label pictures), the draft, the brand rules and the known real-brand uses in World, or a change file, and say in plain words what is wrong.',
  input:object({target:{enum:['all','looks','products','draft','brands','change'],default:'all'},change:{type:'object',description:'A change file to check (target change).'}}),
  async run({target='all',change:file},ctx){
   const c=await load(),out={},brands=await ctx.repo.readJSON(c.repo.PATHS.brands);
   if(target==='change'){if(!file)throw Error('Give the change file as change.');const r=c.rules.validateChange(file,{brands});return {ok:r.ok,problems:sentenceList(r.problems),warnings:sentenceList(r.warnings)};}
   if(target==='all'||target==='looks'){
    const looks=c.rules.validateLooks(await ctx.repo.readJSON(c.repo.PATHS.looks),{brands}),{check}=await import('./build-data.mjs'),fresh=await check(ctx.repo);
    out.looks={ok:looks.ok&&fresh.ok,problems:[...sentenceList(looks.problems),...fresh.stale.map(p=>`${p} does not match its data: run node johansson-town/tools/studio/build-data.mjs.`)]};
   }
   if(target==='all'||target==='products'){
    const products=await ctx.repo.readJSON(c.repo.PATHS.products).catch(()=>null);
    if(products){
     const v=c.rules.validateProducts(products,{brands}),missing=[];
     for(const f of c.apply.labelFiles(products)){const bytes=await ctx.repo.read(c.apply.labelPath(f.image),null).catch(()=>null);
      if(!bytes)missing.push(`${f.id}'s label needs ${f.image}, which is not in assets/graphics/.`);else if(f.sha256&&c.sha.sha256(bytes)!==f.sha256)missing.push(`${f.image} is not the picture ${f.id}'s label was baked as.`);}
     out.products={ok:v.ok&&!missing.length,problems:[...sentenceList(v.problems),...missing],warnings:sentenceList(v.warnings),room:v.room};
    }
   }
   if(target==='all'||target==='draft'){
    const d=await c.apply.readData(ctx.repo),whole=c.rules.validateLooks(d.looks,{brands}),goods=d.products?c.rules.validateProducts(d.products,{brands}):{problems:[]};
    out.draft={ok:!d.stale.length&&whole.ok&&!goods.problems.length,changes:d.draft.length,problems:[...d.stale.map(s=>`The drafted change ${s.id} ("${s.note}") no longer fits: ${s.sentences.join(' ')}`),...sentenceList(whole.problems),...sentenceList(goods.problems)]};
   }
   if(target==='all'||target==='brands')out.brands=await brandReport(ctx);
   return {ok:Object.values(out).every(r=>r.ok),...out};
  }},
 {name:'publish_draft',destructive:true,description:'Publish Studio\'s draft into World\'s data, only when the creator says "update World": the changes they said yes to are written to data/studio/looks.json, World\'s generated modules and the change log (nothing is committed or pushed). Dry run by default: lists the drafted changes and who they change.',
  input:object({dryRun:DRY}),
  async run({dryRun=true},ctx){
   const c=await load(),r=await c.apply.publishDraft({dryRun,repo:ctx.repo}),looksChanged=r.writes?.includes(c.repo.PATHS.looksModule);
   return {...r,problems:sentenceList(r.problems),
    next:!r.ok?'Nothing was written. Take out the drafted changes that no longer fit (discard_draft), then try again.':r.nothing?undefined:
     r.dryRun?'A dry run: nothing was written. Show the creator; only when they say "update World", call again with dryRun:false.':
     `Written to World's data (not committed). Next${looksChanged?': node johansson-town/tools/render-resident-guide.mjs (the guide portraits),':':'} (cd johansson-town && npm run build:runtime), then publish_check, and follow its next steps.`};
  }},
 {name:'discard_draft',destructive:true,description:'Take changes out of Studio\'s draft before they are published: by id (as publish_draft lists them) or all. Dry run by default.',
  input:object({ids:{type:'array',minItems:1,maxItems:50,items:{type:'string',minLength:1,maxLength:64}},all:{type:'boolean',default:false},dryRun:DRY}),
  async run({ids=[],all=false,dryRun=true},ctx){
   const c=await load(),r=await c.apply.discardDraft({ids,all,dryRun,repo:ctx.repo});
   return {...r,problems:sentenceList(r.problems),next:!r.ok?REFUSED:r.dryRun?'A dry run: nothing was written. Call again with dryRun:false to take them out.':undefined};
  }},
 {name:'publish_check',readOnly:true,description:'Is Studio\'s work ready to publish to World? Reports: generated modules fresh, data valid, the draft published, the Studio tests, the runtime build current, the guide portraits current, main merged into the branch, and the files to commit. It never commits or pushes; publishing happens only when the creator says "update World".',
  input:object({tests:{type:'boolean',default:true,description:'Run the Studio tests (about a minute).'}}),
  async run({tests=true},ctx,{signal}={}){return publishCheck(ctx,{tests,signal});}},
 ...PRODUCT_TOOLS,
 ...ASSET_TOOLS,
 ...MODEL_TOOLS,
 ...SCENE_TOOLS,...COMIC_EFFECTS_TOOLS,...ROOM_TOOLS,...WORLD_ROOM_TOOLS,...WORLD_LIBRARY_TOOLS,...FILM_PIPELINE_TOOLS,
];
export const TOOL_BY_NAME=Object.freeze(Object.fromEntries(TOOLS.map(t=>[t.name,t])));

/** What a tool works with: the repository (data root) and, made on first use, the headless Studio page. */
export async function context(){
 const {openRepo}=await import('./repo.mjs');let page=null;
 return {repo:openRepo(),page:async()=>page??=new (await import('./page.mjs')).StudioPage(),close:async()=>{await page?.close();page=null;}};
}

/** An error's first line in plain words (a Playwright error carries the page's stack trace after it). */
const plain=e=>String(e?.message??e).split('\n')[0].replace(/^page\.evaluate: (Error: )?/,'');
/** Run a tool on arguments that already match its input. Errors come back as {error, problems}, never thrown. */
export async function callTool(name,args,ctx,{signal}={}){
 const tool=Object.hasOwn(TOOL_BY_NAME,name)?TOOL_BY_NAME[name]:null;
 if(!tool)return {error:`There is no tool called ${JSON.stringify(name)}. Tools: ${TOOLS.map(t=>t.name).join(', ')}.`};
 try{return await tool.run(args,ctx,{signal});}catch(e){return {error:plain(e),problems:e.problems?.map(p=>p.sentence??p)};}
}

/** The known real-brand uses in World's code: each is found by its words (`match`); `line` is only where it was. */
async function brandReport(ctx){
 const c=await load(),rules=await ctx.repo.readJSON(c.repo.PATHS.brands),warnings=[];
 for(const issue of rules.knownIssues){
  const lines=(await codeFile('johansson-town/'+issue.file).catch(()=>'')).split('\n'),at=lines.findIndex(l=>l.includes(issue.match));
  warnings.push(at>=0?`Known: ${issue.file}:${at+1} — ${issue.note} (waiting for the creator's choice of a fictional name).`
   :`${issue.file} no longer has ${JSON.stringify(issue.match)}; it was fixed or rewritten. Update knownIssues in data/studio/brand-rules.json.`);
 }
 const problems=[];
 if(!rules.brands.includes('orion'))problems.push('brand-rules.json must list "orion".');
 if(rules.brands.includes('asahi'))problems.push('brand-rules.json lists "asahi", which is a street name here (jojo\'s brandsWhy).');
 return {ok:!problems.length,problems,warnings};
}

/** Files an "update World" commits: Studio's data and modules, and what is rebuilt from them (guide portraits, runtime). */
const PUBLISHED=/^johansson-town\/(data\/studio\/|src\/avatars\/looks-data\.js|src\/studio\/characters-data\.js|src\/commerce\/products-data\.js|src\/world\/interiors\/workshop-publication\.js|assets\/graphics\/labels\/|guide\/|resident-guide\.js|runtime\/|index\.html|creator\/index\.html|sw\.js)/;

/** The publish_check report: every item {check, ok, detail}, and whether all of them pass. */
async function publishCheck(ctx,{tests,signal}){
 const c=await load(),{execFile}=await import('node:child_process'),{promisify}=await import('node:util'),run=promisify(execFile);
 const {resolve}=await import('node:path'),{readFile,stat}=await import('node:fs/promises'),code=c.repo.CODE_ROOT,town=resolve(code,'johansson-town');
 const git=async(...args)=>(await run('git',args,{cwd:code,maxBuffer:4e6,signal})).stdout;
 const items=[],add=(check,ok,detail)=>items.push({check,ok,detail});
 const {check}=await import('./build-data.mjs'),fresh=await check(ctx.repo);
 add('generated modules',fresh.ok,fresh.ok?'looks-data.js, characters-data.js and products-data.js match their data.':`Out of date: ${fresh.stale.join(', ')}. Run node johansson-town/tools/studio/build-data.mjs.`);
 const brandRules=await ctx.repo.readJSON(c.repo.PATHS.brands);
 const looks=c.rules.validateLooks(await ctx.repo.readJSON(c.repo.PATHS.looks),{brands:brandRules}),brands=await brandReport(ctx);
 const goods=(await TOOL_BY_NAME.validate.run({target:'products'},ctx)).products||{ok:true,problems:[]};
 add('data',looks.ok&&brands.ok&&goods.ok,[...sentenceList(looks.problems),...goods.problems,...brands.problems].join(' ')||`looks.json and products.json are valid, with every label picture in place. ${brands.warnings.length} known real-brand uses in World wait for the creator (validate target:"brands").`);
 const d=await c.apply.readData(ctx.repo),n=d.draft.length;
 add('draft',!n,!n?'Studio\'s draft is empty: everything the creator said yes to is in World\'s data.':
  `${n} change${n===1?'':'s'} the creator said yes to ${n===1?'is':'are'} still only in Studio's draft${d.stale.length?` (${d.stale.length} no longer fit: discard_draft)`:''}; publish_draft writes ${n===1?'it':'them'} into World's data.`);
 if(tests){
  const files=['tests/looks-data.test.mjs','tests/studio-apply.test.mjs','tests/studio-data.test.mjs','tests/studio-mcp.test.mjs','tests/resident-guide.test.mjs',
   'tests/products-data.test.mjs','tests/products-move.test.mjs','tests/label-spec.test.mjs','tests/sakura-merchandising.test.mjs','tests/shop-display.test.mjs'];
  const {NODE_TEST_CONTEXT,...env}=process.env;
  const r=await run(process.execPath,['--test',...files],{cwd:town,env,timeout:180000,maxBuffer:2e7,signal}).then(x=>({out:x.stdout,ok:true}),e=>({out:String(e.stdout||e.message),ok:false}));
  const count=k=>Number(r.out.match(new RegExp(`^# ${k} (\\d+)`,'m'))?.[1]??NaN);
  add('tests',r.ok&&count('fail')===0,`${count('pass')} passed, ${count('fail')} failed (${files.join(', ')}).`);
 }
 const {runtimeSourceHash}=await import('../../scripts/runtime-source.mjs');
 const recorded=JSON.parse(await readFile(resolve(town,'runtime/source.json'),'utf8')).sha256,current=await runtimeSourceHash(town);
 add('runtime build',recorded===current,recorded===current?'runtime/ matches the source.':'runtime/ is older than the source: run (cd johansson-town && npm run build:runtime) before publishing.');
 const manifest=JSON.parse(await readFile(resolve(town,'guide/portraits.json'),'utf8')),{createHash}=await import('node:crypto'),hash=createHash('sha256');
 for(const path of manifest.sourceFiles)hash.update(path+'\0').update(await readFile(resolve(town,path))).update('\0');
 const portraits=hash.digest('hex')===manifest.sha256;
 add('guide portraits',portraits,portraits?'The resident guide\'s portraits match the avatar source.':'The guide portraits are older than the avatar source or the looks: run node johansson-town/tools/render-resident-guide.mjs.');
 try{
  const main=(await git('rev-parse','--verify','origin/main')).trim(),merged=await run('git',['merge-base','--is-ancestor',main,'HEAD'],{cwd:code,signal}).then(()=>true,()=>false);
  const fetched=await stat(resolve(code,'.git/FETCH_HEAD')).then(s=>s.mtime.toISOString(),()=>'never');
  add('main merged',merged,merged?`origin/main (as last fetched, ${fetched}) is merged into this branch.`:`origin/main (as last fetched, ${fetched}) has commits this branch does not: git fetch origin main, then merge it before pushing.`);
 }catch(e){add('main merged',false,`Could not read origin/main: ${plain(e)}`);}
 const dirty=(await git('status','--porcelain','--untracked-files=all','--','johansson-town','avatar-creator','.mcp.json')).split('\n').filter(Boolean).map(l=>l.slice(3));
 const own=dirty.filter(p=>PUBLISHED.test(p));
 add('uncommitted',!own.length,own.length?`To commit with Studio's change: ${own.join(', ')}.`:'Studio\'s data and what is built from it are committed.');
 return {ready:items.every(i=>i.ok),items,otherUncommitted:dirty.filter(p=>!own.includes(p)),
  next:'Only when the creator says "update World": (1) publish_draft, a dry run to show them, then dryRun:false; (2) if it wrote src/avatars/looks-data.js, node johansson-town/tools/render-resident-guide.mjs; (3) if it wrote src/commerce/products-data.js, walk to the shelf it changed (node johansson-town/tools/studio/cabinet-walk.mjs <label> --source for the cold cabinet) and look; (4) (cd johansson-town && npm run build:runtime); (5) publish_check again; (6) commit the files "uncommitted" lists (git add those paths only, never -A); (7) git fetch origin main and merge it into the branch; (8) push the branch and check the johansson-town-live.yml run (gh api repos/nj22az/nj22az.github.io/actions/workflows/johansson-town-live.yml/runs?per_page=3). It is live only after that run succeeds.'};
}
