import {applyLook,readPath,LOOK_PATHS} from '../avatars/looks.js';
import {baseRecipe} from '../avatars/cast.js';
import {normalizeRecipe} from '../avatars/recipe.js';
import {recordSha256} from './sha256.js';
import {foldName,readField,ATLAS_CELLS} from './rules.js';

/**
 * Applying a change's steps to Studio's data, with no files, no DOM and no clock: the same function runs on the
 * iPad (to preview a draft), in the Node tools (to write it) and in the tests.
 *
 * applyOps({looks, products}, ops, {made, note}) returns {data, inverse, conflicts, results}:
 * - data: the new data (the input is never changed);
 * - inverse: steps that undo the applied ones, newest first (log.json keeps them; undo is stage 4). A product's new
 *   flavour, a new line and a retired line have none: a cell, once given, and a retired id are never taken back;
 * - conflicts: [{op, where, path, expected, found, wanted, sentence}] — any conflict means nothing should be written;
 * - results: per step, 'applied', 'unchanged' (World already has it) or 'conflict', with the fields it changes.
 * Steps are expected to have passed rules.js validateOp; a step this file does not know is a conflict.
 */
const same=(a,b)=>Object.is(a,b)||(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&recordSha256(a)===recordSha256(b));
const shown=v=>v===undefined?'not set':typeof v==='string'?`"${v}"`:JSON.stringify(v);
const ordered=set=>Object.fromEntries(LOOK_PATHS.filter(p=>Object.hasOwn(set,p)).map(p=>[p,set[p]]));
const sorted=map=>Object.fromEntries(Object.keys(map).sort().map(k=>[k,map[k]]));
/** A map's own entry only: a name like "constructor" is nobody, not a function every object has. */
const own=(map,key)=>map&&Object.hasOwn(map,key)?map[key]:undefined;

/** A resident's look as World draws it with a published look laid over it (and no device wardrobe). */
export function lookedRecipe(name,set){return set&&Object.keys(set).length?normalizeRecipe(applyLook(baseRecipe(name),set)):baseRecipe(name);}

/** The fields a step changes: each must find `was` (or already be the new value). */
function compare(current,set,was,{who,where}){
 const changes={},conflicts=[],diff=[];
 for(const [path,wanted] of Object.entries(set)){
  const found=readPath(current,path);
  if(same(found,wanted))continue;
  if(same(found,was[path])){changes[path]=wanted;diff.push({path,from:found,to:wanted});continue;}
  conflicts.push({where:`${where}.was.${path}`,path,expected:was[path],found,wanted,
   sentence:`${who}'s ${path} is now ${shown(found)}, not ${shown(was[path])} as this change expected; it was left as ${shown(found)}.`});
 }
 return {changes,conflicts,diff};
}

const handlers={
 'look.set'(data,op,{made,note,where}){
  const looks=data.looks.looks,entry=own(looks,op.name),current=lookedRecipe(op.name,entry?.set);
  const {changes,conflicts,diff}=compare(current,op.set,op.was,{who:op.name,where});
  if(conflicts.length)return {status:'conflict',conflicts};
  if(!diff.length)return {status:'unchanged',diff};
  // Fields that end up as World draws them anyway are left out, so a look holds only what Studio changed; each field
  // keeps the reason it was changed, so a later change to another field never loses it.
  const base=baseRecipe(op.name),merged={...(entry?.set||{}),...changes},reason=op.note||note;
  const notes={...(entry?.notes||{}),...Object.fromEntries(Object.keys(changes).map(path=>[path,reason]))};
  for(const path of Object.keys(merged))if(same(merged[path],readPath(base,path)))delete merged[path];
  if(Object.keys(merged).length)looks[op.name]={set:ordered(merged),notes:ordered(Object.fromEntries(Object.keys(merged).map(path=>[path,notes[path]||reason]))),made};
  else delete looks[op.name];
  data.looks.looks=sorted(looks);
  const back=Object.fromEntries(diff.map(d=>[d.path,d.from]));
  return {status:'applied',diff,inverse:{op:'look.set',name:op.name,set:back,was:ordered(changes)}};
 },
 'look.reset'(data,op,{where}){
  const looks=data.looks.looks,entry=own(looks,op.name);
  if(!entry)return {status:'unchanged',diff:[]};
  const have=entry.set||{},conflicts=[];
  for(const path of LOOK_PATHS.filter(p=>Object.hasOwn(have,p)||Object.hasOwn(op.was,p)))if(!same(have[path],op.was[path]))
   conflicts.push({where:`${where}.was.${path}`,path,expected:op.was[path],found:have[path],wanted:undefined,
    sentence:`${op.name}'s published look has ${path} ${shown(have[path])}, not ${shown(op.was[path])} as this change expected; the look was kept.`});
  if(conflicts.length)return {status:'conflict',conflicts};
  const base=baseRecipe(op.name),diff=Object.keys(have).map(path=>({path,from:have[path],to:readPath(base,path)}));
  delete looks[op.name];
  return {status:'applied',diff,inverse:{op:'look.set',name:op.name,set:{...have},was:Object.fromEntries(diff.map(d=>[d.path,d.to]))}};
 },
 'character.create'(data,op,{made,where}){
  const characters=data.looks.characters,c=op.character,record={name:c.name,recipe:normalizeRecipe({...c.recipe,name:c.name}),card:{role:c.card.role,why:c.card.why},made};
  const existing=own(characters,op.id);
  if(existing){
   const {made:_,...had}=existing,{made:__,...wanted}=record;
   if(same(had,wanted))return {status:'unchanged',diff:[]};
   return {status:'conflict',conflicts:[{where:`${where}.id`,path:'id',expected:undefined,found:op.id,wanted:op.id,sentence:`A Studio character with the id "${op.id}" already exists (${existing.name}); choose another id.`}]};
  }
  const namesake=Object.keys(characters).find(id=>foldName(characters[id].name)===foldName(c.name));
  if(namesake)return {status:'conflict',conflicts:[{where:`${where}.character.name`,path:'name',expected:undefined,found:characters[namesake].name,wanted:c.name,
   sentence:`A Studio character is already called ${characters[namesake].name} (id "${namesake}"); give the new one a name of their own.`}]};
  characters[op.id]=record;data.looks.characters=sorted(characters);
  return {status:'applied',diff:[{path:'character',from:undefined,to:c.name}],inverse:{op:'character.delete',id:op.id,was:recordSha256(record)}};
 },
 'character.set'(data,op,{made,where}){
  const record=own(data.looks.characters,op.id);
  if(!record)return {status:'conflict',conflicts:[{where:`${where}.id`,path:'id',expected:op.id,found:undefined,wanted:op.id,sentence:`There is no Studio character with the id "${op.id}".`}]};
  const {changes,conflicts,diff}=compare(record.recipe,op.set,op.was,{who:record.name,where});
  if(conflicts.length)return {status:'conflict',conflicts};
  if(!diff.length)return {status:'unchanged',diff};
  data.looks.characters[op.id]={...record,recipe:normalizeRecipe(applyLook(record.recipe,changes)),made};
  return {status:'applied',diff,inverse:{op:'character.set',id:op.id,set:Object.fromEntries(diff.map(d=>[d.path,d.from])),was:ordered(changes)}};
 },
 'character.delete'(data,op,{where}){
  const record=own(data.looks.characters,op.id);
  if(!record)return {status:'unchanged',diff:[]};
  if(recordSha256(record)!==op.was)return {status:'conflict',conflicts:[{where:`${where}.was`,path:'record',expected:op.was,found:recordSha256(record),wanted:undefined,
   sentence:`${record.name} has changed since this change was made; nothing was deleted. Look at them again first.`}]};
  delete data.looks.characters[op.id];
  return {status:'applied',diff:[{path:'character',from:record.name,to:undefined}],inverse:{op:'character.create',id:op.id,character:{name:record.name,recipe:record.recipe,card:record.card}}};
 },
};

// ─── Products (stage 2) ──────────────────────────────────────────────────────────────────────────────────────────
/** Fields where null is a value of its own (a counter line has no bag colour; non-food may list no ingredients). */
const NULLABLE=new Set(['bagColour','pack.back.ingredients']);
/** Sets a field by path; null takes an optional field away. A field that is not there reads as null. */
const writeField=(record,path,value)=>{const keys=path.split('.'),last=keys.pop();let at=record;for(const k of keys){if(!at[k]||typeof at[k]!=='object')at[k]={};at=at[k];}
 if(value===null&&!NULLABLE.has(path))delete at[last];else at[last]=value;};
const field=(record,path)=>readField(record,path)??null;
const productConflict=(where,path,sentence,extra={})=>({status:'conflict',conflicts:[{where,path,sentence,...extra}]});
/**
 * The lowest cells nobody uses: in the atlas's left half (labels, prints, price tags) or its right half (flavours).
 * The left half's first 32 cells lie under the painted sheets, which are laid in whole: a new line never gets one, or
 * an old painting would show on its packs until its own label arrived.
 */
const PAINTED_CELLS=32;
function freeCells(file,half,count){
 const used=new Set(half==='left'?[...file.products.flatMap(p=>[p.cells.brand,p.cells.price]),...file.prints.map(p=>p.cell)]:file.products.flatMap(p=>p.cells.flavours.map(f=>f.cell)));
 const out=[];for(let c=half==='left'?PAINTED_CELLS:0;c<ATLAS_CELLS&&out.length<count;c++)if(!used.has(c))out.push(c);
 return out.length===count?out:null;
}
/** Where a new line goes in the floor walk: after the last line of its zone. */
function insertAt(list,product){const i=list.map(p=>p.purpose?.zone).lastIndexOf(product.purpose?.zone);list.splice(i<0?list.length:i+1,0,product);}
/** A line's record kept in the retired list: enough for old saves to still know what they hold. */
const retiredRecord=(p,why,made)=>({id:p.id,inventoryName:p.inventoryName,name:p.name,text:p.text,...p.drink?{drink:p.drink}:{},why,retired:made});
const sortedLevels=levels=>[...levels].sort((a,b)=>a-b);

const productHandlers={
 'product.update'(data,op,{where}){
  const list=data.products.products,i=list.findIndex(p=>p.id===op.id);
  if(i<0)return productConflict(`${where}.id`,'id',data.products.retired.some(r=>r.id===op.id)?`${op.id} was retired; a retired line is not changed.`:`There is no product "${op.id}".`);
  const current=list[i],changes={},conflicts=[],diff=[];
  for(const [path,wanted] of Object.entries(op.set)){
   const found=field(current,path);
   if(same(found,wanted))continue;
   if(same(found,op.was[path]??null)){changes[path]=wanted;diff.push({path,from:found,to:wanted});continue;}
   conflicts.push({where:`${where}.was.${path}`,path,expected:op.was[path],found,wanted,
    sentence:`${current.name}'s ${path} is now ${shown(found)}, not ${shown(op.was[path])} as this change expected; it was left as it is.`});
  }
  if(conflicts.length)return {status:'conflict',conflicts};
  if(!diff.length)return {status:'unchanged',diff};
  const next=structuredClone(current);for(const [path,value] of Object.entries(changes))writeField(next,path,structuredClone(value));
  list[i]=next;
  return {status:'applied',diff,inverse:{op:'product.update',id:op.id,set:Object.fromEntries(diff.map(d=>[d.path,d.from])),was:structuredClone(changes)}};
 },
 'product.add'(data,op,{made,note,where}){
  const file=data.products,list=file.products,{mode,target,why}=op.place,line=target?list.find(p=>p.id===target):null;
  if(target&&!line)return productConflict(`${where}.place.target`,'target',`There is no product "${target}" on the floor.`);
  if(mode==='flavour'){
   const had=line.cells.flavours.find(f=>f.name===op.product.name);
   if(had)return had.hue===op.product.hue?{status:'unchanged',diff:[]}:productConflict(`${where}.product.name`,'name',`${line.name} already has a flavour called ${had.name}.`);
   const [cell]=freeCells(file,'right',1)||[];
   if(cell===undefined)return productConflict(`${where}.product`,'atlas','The label atlas has no room for another flavour; growing it is a code batch.');
   const i=list.indexOf(line),next=structuredClone(line);next.cells.flavours.push({name:op.product.name,hue:op.product.hue,cell});list[i]=next;
   return {status:'applied',diff:[{path:`${line.id}.flavour`,from:undefined,to:op.product.name}],inverse:null};
  }
  const p=structuredClone(op.product);
  if(list.some(x=>x.id===p.id))return list.find(x=>x.id===p.id)&&same({...list.find(x=>x.id===p.id),cells:undefined},{...p,cells:undefined})?{status:'unchanged',diff:[]}:productConflict(`${where}.product.id`,'id',`A product with the id "${p.id}" is already on the floor.`);
  if(file.retired.some(r=>r.id===p.id))return productConflict(`${where}.product.id`,'id',`"${p.id}" belonged to a retired line; a retired id is never used again.`);
  const onShelves=mode!=='replace'||line.cells.price!=null,cells=freeCells(file,'left',p.cells?.price===null||(mode==='replace'&&!onShelves)?1:2);
  if(!cells)return productConflict(`${where}.product`,'atlas','The label atlas has no room for another product (its left half is full); growing it (ATLAS_ROWS) is a code batch, not a Studio change.');
  p.cells={brand:cells[0],price:cells.length>1?cells[1]:null,flavours:[]};
  if(mode==='share'){
   const s=line.shelf,i=list.indexOf(line),host=structuredClone(line);
   if(s.fitting==='fridge'){
    if(s.levels.length<2)return productConflict(`${where}.place.target`,'share',`${line.name} has one shelf of the cold cabinet; it has none to share.`);
    const top=s.levels.at(-1);host.shelf={...s,levels:s.levels.slice(0,-1)};host.capacity=line.capacity/s.levels.length*(s.levels.length-1);
    p.shelf={fitting:'fridge',column:s.column,levels:[top]};
   }else if(['west','middle','east'].includes(s.fitting)){
    for(const other of list)if(other.shelf.fitting===s.fitting&&other.shelf.bay===s.bay&&other.shelf.order>s.order){const j=list.indexOf(other);list[j]={...structuredClone(other),shelf:{...other.shelf,order:other.shelf.order+1}};}
    p.shelf={fitting:s.fitting,bay:s.bay,order:s.order+1};
   }else return productConflict(`${where}.place.mode`,'share',`A ${s.fitting==='chiller'?'chiller deck':'steamer'} holds one line; replace ${line.name} instead (place.mode "replace").`);
   list[i]=host;
  }else if(mode==='replace'){
   const i=list.indexOf(line);p.shelf=structuredClone(line.shelf);
   list.splice(i,1);file.retired.push(retiredRecord(line,why||op.note||note,made));
  }
  insertAt(list,p);
  return {status:'applied',diff:[{path:p.id,from:mode==='replace'?line.id:undefined,to:p.name}],inverse:null};
 },
 'product.retire'(data,op,{made,where}){
  const file=data.products,list=file.products,i=list.findIndex(p=>p.id===op.id);
  if(i<0)return file.retired.some(r=>r.id===op.id)?{status:'unchanged',diff:[]}:productConflict(`${where}.id`,'id',`There is no product "${op.id}".`);
  const p=list[i];
  if(recordSha256(p)!==op.was)return productConflict(`${where}.was`,'record',`${p.name} has changed since this change was made; nothing was retired. Look at it again first.`,{expected:op.was,found:recordSha256(p)});
  const s=p.shelf,to=op.shelfTo?list.find(x=>x.id===op.shelfTo):null;
  if(op.shelfTo&&(!to||to===p))return productConflict(`${where}.shelfTo`,'shelfTo',`"${op.shelfTo}" is not another line on the floor.`);
  if(s.fitting==='fridge'){
   if(!to||to.shelf.fitting!=='fridge'||to.shelf.column!==s.column)return productConflict(`${where}.shelfTo`,'shelfTo',`${p.name}'s shelves in the cold cabinet must go to the other line in its column (column ${s.column}), so they do not stand empty.`);
   const j=list.indexOf(to),levels=sortedLevels([...to.shelf.levels,...s.levels]);
   list[j]={...structuredClone(to),shelf:{...to.shelf,levels},capacity:to.capacity/to.shelf.levels.length*levels.length};
  }else if(['west','middle','east'].includes(s.fitting)){
   if(to&&(to.shelf.fitting!==s.fitting||to.shelf.bay!==s.bay))return productConflict(`${where}.shelfTo`,'shelfTo',`${p.name}'s boards go to the lines left in its bay (${s.bay}); ${to.name} stands elsewhere.`);
   for(const other of list)if(other.shelf.fitting===s.fitting&&other.shelf.bay===s.bay&&other.shelf.order>s.order){const j=list.indexOf(other);list[j]={...structuredClone(other),shelf:{...other.shelf,order:other.shelf.order-1}};}
  }else return productConflict(`${where}.shelfTo`,'shelfTo',`A ${s.fitting==='chiller'?'chiller deck':'steamer'} holds one line, so it would stand empty; add the line that takes its place instead (product_add with place.mode "replace").`);
  list.splice(list.indexOf(p),1);file.retired.push(retiredRecord(p,op.why,made));
  return {status:'applied',diff:[{path:p.id,from:p.name,to:undefined}],inverse:null};
 },
};

export function applyOps(data,ops,{made='',note=''}={}){
 const next=structuredClone(data),inverse=[],conflicts=[],results=[];
 next.looks??={format:'johansson-looks',version:1,looks:{},characters:{}};next.looks.looks??={};next.looks.characters??={};
 ops.forEach((op,i)=>{
  const where=`ops[${i}]`,product=typeof op?.op==='string'&&Object.hasOwn(productHandlers,op.op)?productHandlers[op.op]:null;
  const handler=product||(typeof op?.op==='string'&&Object.hasOwn(handlers,op.op)?handlers[op.op]:null);
  const r=product&&!next.products?{status:'conflict',conflicts:[{where:`${where}.op`,path:'op',sentence:'There are no products to change here (data/studio/products.json).'}]}
   :handler?handler(next,op,{made,note,where}):{status:'conflict',conflicts:[{where:`${where}.op`,path:'op',sentence:`"${op?.op}" is not a step this Studio can apply.`}]};
  results.push({op:i,step:op?.op,status:r.status,diff:r.diff||[]});
  if(r.conflicts)conflicts.push(...r.conflicts.map(c=>({op:i,...c})));
  if(r.inverse)inverse.unshift(r.inverse);
 });
 return {data:next,inverse,conflicts,results};
}
