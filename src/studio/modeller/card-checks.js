/**
 * The checks an asset's card must pass that need no 3D: the card is complete, its purpose (who, why, where), no real
 * brand names, its own id. A port, sentence for sentence, of the desktop Studio's townstudio/assets.py (card_problems,
 * card_text, brand_hits, card_checks), so Johansson Studio on the iPad, the johansson-studio tools and the desktop tool
 * say the same thing about the same card. The checks that need the built model are checks.js (a byte-for-byte copy of
 * the desktop's modeller/checks.js), and both read rules.json (a copy of the desktop's modeller/rules.json):
 * tests/asset-modeller.test.mjs holds the copies to the desktop's files whenever the studio repository is beside this one.
 *
 * Each check is {id, ok, detail}, in the words Studio shows.
 */
export const FORMAT=1;
export const ID_RE=/^[a-z0-9][a-z0-9-]{1,47}$/;
const MODEL_FILES=['model.js','model.glb'];
const num=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e6;
const point=v=>Array.isArray(v)&&v.length===3&&v.every(num);
const isInt=v=>Number.isInteger(v);

/** What is missing or malformed on the card, as sentences naming the field (an empty list: complete). */
export function cardProblems(card,rules,{assetId=null}={}){
 if(!card||typeof card!=='object'||Array.isArray(card))return ['The card must be a JSON object.'];
 const R=rules,out=[];
 if(card.format!==FORMAT)out.push(`format must be ${FORMAT}.`);
 const cid=card.id;
 if(typeof cid!=='string'||!ID_RE.test(cid))out.push('id must be lower-case letters, digits and dashes (2 to 48).');
 else if(assetId&&cid!==assetId)out.push(`id is '${cid}' but the folder is '${assetId}'.`);
 if(typeof card.name!=='string'||!card.name.trim()||card.name.length>60)out.push('name: what people call it, 1 to 60 characters.');
 if(!Object.hasOwn(R.kinds,card.kind))out.push('kind must be one of: '+Object.keys(R.kinds).join(', ')+'.');
 if(!(isInt(card.version)&&card.version>=1))out.push('version must be a whole number from 1 (raise it for every published change).');
 const p=card.purpose;
 if(!(p&&typeof p==='object'&&['for','why','where'].every(k=>typeof p[k]==='string')))out.push('purpose needs for, why and where (text).');
 const size=card.size;
 if(!(Array.isArray(size)&&size.length===3&&size.every(v=>num(v)&&v>0)))out.push('size must be [width, height, depth] in metres, all above 0.');
 if(!MODEL_FILES.includes(card.model))out.push('model must be "model.js" (a code recipe) or "model.glb".');
 const colours=card.colours??{};
 if(!colours||typeof colours!=='object'||Array.isArray(colours))out.push('colours must be {name: "#rrggbb"}.');
 else for(const [name,hex] of Object.entries(colours))if(!(typeof hex==='string'&&/^#[0-9a-fA-F]{6}$/.test(hex)))out.push(`colour '${name}' must be "#rrggbb".`);
 const cols=card.colliders??'auto';
 if(cols!=='auto'){
  if(!Array.isArray(cols)||!cols.length)out.push('colliders: "auto" (made from the model) or a list of boxes.');
  else cols.forEach((c,i)=>{if(!(c&&typeof c==='object'&&['x','z','w','d','height'].every(k=>num(c[k]))&&c.w>0&&c.d>0&&c.height>0&&num(c.minY??0)&&num(c.yaw??0)))
   out.push(`collider ${i+1} needs x, z, w, d, height (metres; w, d and height above 0).`);});
 }
 const seatIds=new Set();
 (card.seats||[]).forEach((s,i)=>{
  const ok=s&&typeof s==='object'&&typeof s.id==='string'&&s.id&&point(s.position)&&point(s.stand)&&num(s.yaw)&&num(s.surfaceY)&&typeof s.label==='string';
  if(!ok)out.push(`seat ${i+1} needs id, position [x,y,z], stand [x,y,z], yaw, surfaceY and label.`);
  else if(seatIds.has(s.id))out.push(`seat id '${s.id}' is used twice.`);
  else seatIds.add(s.id);
 });
 (card.spots||[]).forEach((s,i)=>{if(!(s&&typeof s==='object'&&typeof s.id==='string'&&s.id&&point(s.position)&&num(s.yaw??0)&&['stand','kneel','use'].includes(s.kind)))
  out.push(`spot ${i+1} needs id, kind (stand, kneel or use), position [x,y,z] and yaw.`);});
 const a=card.action;
 if(!(a&&typeof a==='object'&&R.actions.includes(a.kind)))out.push('action needs a kind: '+R.actions.join(', ')+'.');
 else if(a.kind!=='none'&&!(typeof a.label==='string'&&a.label.trim()))out.push('action needs a label: what the button says in World.');
 for(const [name,v] of Object.entries(card.anchors||{}))if(!(point(v)||(v&&typeof v==='object'&&point(v.min)&&point(v.max))))out.push(`anchor '${name}' must be [x,y,z] or {"min":[x,y,z],"max":[x,y,z]}.`);
 (card.keepClear||[]).forEach((k,i)=>{if(!(k&&typeof k==='object'&&point(k.min)&&point(k.max)&&k.min.every((v,j)=>v<k.max[j])))out.push(`keepClear box ${i+1} needs min and max corners [x,y,z], min below max.`);});
 const b=card.budget,kind=R.kinds[card.kind];
 if(!(b&&typeof b==='object'&&isInt(b.triangles)&&isInt(b.materials)&&b.triangles>0&&b.materials>0))out.push('budget needs triangles and materials (whole numbers).');
 else if(kind&&(b.triangles>kind.triangles||b.materials>kind.materials))out.push(`budget is above what a phone can afford for ${card.kind}: at most ${kind.triangles} triangles and ${kind.materials} materials.`);
 if(!(Array.isArray(card.tags??[])&&(card.tags??[]).every(t=>typeof t==='string')))out.push('tags must be a list of words.');
 return out;
}

/** Every word on the card that someone could read: what the brand check reads (with the recipe). */
export function cardText(card){
 const p=card.purpose||{},str=v=>v==null?'':String(v),list=v=>Array.isArray(v)?v:typeof v==='string'?[...v]:[];
 const parts=[card.name||'',card.notes||'',...['for','why','where'].map(k=>str(p[k])),str(card.action?.label),...list(card.tags).map(str),
  ...[...list(card.seats),...list(card.spots)].filter(s=>s&&typeof s==='object').map(s=>str(s.label)),
  ...Object.keys(card.colours||{}),...Object.keys(card.anchors||{})];
 return parts.filter(Boolean).join('\n');
}

const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/** Real brand names in the text (whole words, any case): rules.json's list and any `extra` (World's brand-rules.json). */
export function brandHits(text,rules,extra=[]){
 const low=String(text).toLowerCase(),list=[...new Set([...rules.brands,...extra].map(b=>String(b).toLowerCase()))];
 return list.filter(b=>new RegExp('(?<![a-z0-9])'+escape(b)+'(?![a-z0-9])').test(low)).sort();
}

/**
 * The checks that need no 3D: the card, the purpose, brand names, the id. `taken` maps ids World or Studio already use
 * to what uses them ('catalogue:johansson-studio' for World's catalogue entries that came from Studio, which this asset
 * may replace with a new version); `extraBrands` adds World's own brand list.
 */
export function cardChecks(card,rules,{recipe='',assetId=null,taken={},extraBrands=[]}={}){
 const out=[],problems=cardProblems(card,rules,{assetId});
 out.push({id:'card',ok:!problems.length,detail:problems.join(' ')||'Every field is there.'});
 const p=card&&typeof card.purpose==='object'&&card.purpose?card.purpose:{};
 const short=['for','why','where'].filter(k=>String(p[k]??'').split(/\s+/).filter(Boolean).length<rules.purposeWords);
 const say={for:'who it is for',why:'why they want it',where:'where it belongs'};
 out.push({id:'purpose',ok:!short.length,detail:short.length?'Say '+short.map(k=>say[k]).join(', ')+` (at least ${rules.purposeWords} words each).`:'Who it is for, why they want it and where it belongs are written down.'});
 const hits=brandHits(cardText(card||{})+'\n'+(recipe||''),rules,extraBrands);
 out.push({id:'brands',ok:!hits.length,detail:hits.length?'Real brand names: '+hits.join(', ')+'. Use a made-up maker, or none.':'None found.'});
 const cid=card?.id;let clash='';
 if(!(typeof cid==='string'&&ID_RE.test(cid)))clash='The id is not a plain name.';
 else if(assetId&&cid!==assetId)clash=`The card says '${cid}' but the folder is '${assetId}'.`;
 else{
  const used=Object.hasOwn(taken,cid)?taken[cid]:null;
  if(used&&!used.startsWith('catalogue:'))clash=`${used} already has a '${cid}'; choose another id.`;
  else if(used&&used!=='catalogue:johansson-studio')clash=`World's catalogue has a '${cid}' that did not come from Studio.`;
 }
 out.push({id:'id',ok:!clash,detail:clash||`${cid} is used by nothing else in Studio or World.`});
 return out;
}

/** The order and labels Studio shows the checks in (rules.json `checks`), with any check rules.json does not list last. */
export function orderChecks(checks,rules){
 const order=rules.checks.map(c=>c.id),label=Object.fromEntries(rules.checks.map(c=>[c.id,c.label]));
 return [...checks].sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):99)-(order.includes(b.id)?order.indexOf(b.id):99))
  .map(c=>({...c,label:label[c.id]||c.id}));
}

/** A name as an asset id: lower-case letters, digits and dashes (townstudio.assets.slugify). */
export const slugify=name=>String(name).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'asset';
