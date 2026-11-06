import {OPS,OP_NAMES,CHANGE_SCHEMA,ID_PATTERN} from './ops.js';
import {LOOK_PATHS,LOOK_FIELDS} from '../avatars/looks.js';
import {RESIDENT_NAMES,baseRecipe} from '../avatars/cast.js';
import {normalizeRecipe} from '../avatars/recipe.js';
import {PROFILES} from '../people/profiles.js';
import {RENAMED_RESIDENTS} from '../people/renamed.js';
import {sha256} from './sha256.js';
import {normalizeLabelSpec,labelWords,labelPictures,SYMBOLS,ARTS,PICTURE_FILE} from './label-spec.js';
import {ZONES,ZONE_OF_SHELF,SUPPLIERS} from '../commerce/merchandising.js';
import {AISLE_BAYS,AISLE_LEVELS,FRIDGE_LEVELS,FRIDGE_COLUMNS,CHILLED_BAYS,facingsFor} from '../world/interiors/sakura-layout.js';
import {ATLAS_COLS,ATLAS_ROWS} from '../world/interiors/store-advertising.js';
import {FRESH_LABELS} from '../commerce/fresh-labels.js';

/**
 * Johansson Studio's checks, shared by the Studio page, the Node tools (MCP and command line) and the tests. Every
 * check answers {ok, problems:[{where, rule, sentence}], warnings}, and every sentence says in plain words what is
 * wrong and what to do. Nothing that arrives in a change is ever run as code: texts are cleaned, words come from fixed
 * lists, colours are #rrggbb, and pictures must really be pictures.
 */
export const LIMITS=Object.freeze({bytes:8*1024*1024,ops:50,files:12,image:2*1024*1024,purposeWords:4,side:8192,pixels:40e6,
 text:Object.freeze({note:500,lookNote:300,name:24,role:60,why:300})});
const ID=new RegExp(ID_PATTERN);
const problem=(where,rule,sentence)=>({where,rule,sentence});
const quote=v=>typeof v==='string'?`"${v}"`:JSON.stringify(v);
export const result=(problems=[],warnings=[],extra={})=>({ok:!problems.length,problems,warnings,...extra});
const words=s=>String(s).trim().split(/\s+/).filter(Boolean).length;
const MADE=new RegExp(CHANGE_SCHEMA.properties.made.pattern);
const a=stage=>stage==='adult'||stage==='elder'?'an':'a';

/** A name as people type it: no accents, any case, single spaces ("koji" finds Kōji, "mr fujita" Mr Fujita). */
export const foldName=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
/** Names World draws that are not residents, so they have no look of their own to change. */
export const NOT_RESIDENTS=new Map([['Harbour visitor','Harbour visitor is a starting template in the maker (creator.js), not a resident of World, so there is no look of theirs to change.']]);
/** Names Studio keeps for itself: a character id may not be one of the names every JavaScript object already has. */
const RESERVED=new Set([...Object.getOwnPropertyNames(Object.prototype),'__proto__']);
const renamedTo=name=>Object.hasOwn(RENAMED_RESIDENTS,name)?` ${name} is now called ${RENAMED_RESIDENTS[name]} in World; move the look to ${RENAMED_RESIDENTS[name]}.`:'';

/**
 * A text from outside, made safe: NFKC (so full-width letters and look-alikes become plain ones), trimmed, with no
 * control characters and no "<", and no longer than `max`. Returns {text, problems}.
 */
export function cleanText(value,{where,max,min=1,label='This text'}){
 if(typeof value!=='string')return {text:'',problems:[problem(where,'text',`${label} must be words, not ${value===undefined?'missing':typeof value}.`)]};
 const text=value.normalize('NFKC').trim(),problems=[];
 if(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(text))problems.push(problem(where,'text',`${label} has an invisible control character in it; type it again as plain words.`));
 if(text.includes('<'))problems.push(problem(where,'text',`${label} may not contain "<".`));
 if([...text].length>max)problems.push(problem(where,'text',`${label} is ${[...text].length} characters long; keep it to ${max}.`));
 if([...text].length<min)problems.push(problem(where,'text',`${label} is empty.`));
 return {text,problems};
}

/**
 * The JSON Schema subset ops.js uses, checked with plain-word sentences: type, const, enum, pattern, min/maxLength,
 * minimum/maximum, properties, required, additionalProperties, propertyNames, min/maxProperties, items, min/maxItems.
 */
export function checkSchema(value,schema,where='change'){
 const out=[],types=[].concat(schema.type||[]);
 const typeOf=v=>v===null?'null':Array.isArray(v)?'array':Number.isInteger(v)?'integer':typeof v;
 if(types.length&&!types.some(t=>t===typeOf(value)||(t==='number'&&typeof value==='number'&&Number.isFinite(value)))){
  out.push(problem(where,'type',`${where} should be ${types.join(' or ')}, not ${typeOf(value)}.`));return out;}
 if('const' in schema&&value!==schema.const)out.push(problem(where,'value',`${where} must be ${quote(schema.const)}, not ${quote(value)}.`));
 if(schema.enum&&!schema.enum.includes(value))out.push(problem(where,'value',`${where} must be one of ${schema.enum.map(quote).join(', ')}, not ${quote(value)}.`));
 if(typeof value==='string'){
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))out.push(problem(where,'pattern',`${where} is not written the way it must be (${quote(value.slice(0,60))}).`));
  if(schema.maxLength!==undefined&&value.length>schema.maxLength)out.push(problem(where,'length',`${where} is too long (${value.length} characters; at most ${schema.maxLength}).`));
  if(schema.minLength!==undefined&&value.length<schema.minLength)out.push(problem(where,'length',`${where} is empty.`));
 }
 if(typeof value==='number'){
  if(!Number.isFinite(value))out.push(problem(where,'number',`${where} must be a real number.`));
  if(schema.minimum!==undefined&&value<schema.minimum)out.push(problem(where,'range',`${where} must be at least ${schema.minimum}.`));
  if(schema.maximum!==undefined&&value>schema.maximum)out.push(problem(where,'range',`${where} must be at most ${schema.maximum}.`));
 }
 if(Array.isArray(value)){
  if(schema.maxItems!==undefined&&value.length>schema.maxItems)out.push(problem(where,'limit',`${where} has ${value.length} entries; at most ${schema.maxItems} are allowed.`));
  if(schema.minItems!==undefined&&value.length<schema.minItems)out.push(problem(where,'limit',`${where} needs at least ${schema.minItems} ${schema.minItems===1?'entry':'entries'}.`));
  if(schema.items)value.slice(0,(schema.maxItems??value.length)+1).forEach((v,i)=>out.push(...checkSchema(v,schema.items,`${where}[${i}]`)));
 }
 if(value&&typeof value==='object'&&!Array.isArray(value)){
  const keys=Object.keys(value),props=schema.properties||{};
  for(const key of schema.required||[])if(!Object.hasOwn(value,key))out.push(problem(where,'missing',`${where} is missing "${key}".`));
  if(schema.maxProperties!==undefined&&keys.length>schema.maxProperties)out.push(problem(where,'limit',`${where} has ${keys.length} entries; at most ${schema.maxProperties} are allowed.`));
  if(schema.minProperties!==undefined&&keys.length<schema.minProperties)out.push(problem(where,'missing',`${where} is empty.`));
  for(const key of keys){
   if(schema.propertyNames?.pattern&&!new RegExp(schema.propertyNames.pattern).test(key)){out.push(problem(`${where}.${key}`,'unknown-key',`${where} has a name Studio does not accept: ${quote(key.slice(0,60))}.`));continue;}
   if(Object.hasOwn(props,key))out.push(...checkSchema(value[key],props[key],`${where}.${key}`));
   else if(schema.additionalProperties===false)out.push(problem(`${where}.${key}`,'unknown-key',`${where} has a field Studio does not know: ${quote(key.slice(0,60))}.`));
   else if(schema.additionalProperties&&typeof schema.additionalProperties==='object')out.push(...checkSchema(value[key],schema.additionalProperties,`${where}.${key}`));
  }
 }
 return out;
}

/**
 * One look field's value, checked: words from the maker's own lists, colours as #rrggbb (any case, stored lower
 * case), yes/no as true or false, numbers clamped to their range: 0..1, or a whole number 0..99 for the shirt number
 * (the clamp is reported, not refused).
 * Returns {value, clamped?, problem?}.
 */
export function lookValue(path,value,where=path){
 const field=Object.hasOwn(LOOK_FIELDS,path)?LOOK_FIELDS[path]:null;
 if(!field)return {problem:problem(where,'unknown-field',`"${path}" is not a part of a look Studio can change. The parts are listed by character_get with options:true.`)};
 if(field.kind==='word'){
  if(typeof value==='string'&&field.words.includes(value))return {value};
  return {problem:problem(where,'unknown-word',`${quote(value)} is not a choice for ${path}; choose one of: ${field.words.join(', ')}.`)};
 }
 if(field.kind==='colour'){
  if(typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value))return {value:value.toLowerCase()};
  return {problem:problem(where,'colour',`${path} must be a colour written #rrggbb, not ${quote(value)}.`)};
 }
 if(field.kind==='yes/no'){
  if(typeof value==='boolean')return {value};
  return {problem:problem(where,'yes/no',`${path} is yes or no (true or false), not ${quote(value)}.`)};
 }
 if(typeof value!=='number'||!Number.isFinite(value))return {problem:problem(where,'number',`${path} is a${field.whole?' whole':''} number from ${field.min} to ${field.max}, not ${quote(value)}.`)};
 const used=Math.min(field.max,Math.max(field.min,field.whole?Math.round(value):value));
 return used===value?{value}:{value:used,clamped:{path,given:value,used,min:field.min,max:field.max}};
}

/** A look's `set` (or `was`), checked field by field and put in LOOK_PATHS order. Returns {set, clamped, problems}. */
export function validateLookSet(set,{where='set',allowEmpty=false}={}){
 const problems=[],clamped=[],out={};
 if(!set||typeof set!=='object'||Array.isArray(set))return {set:{},clamped,problems:[problem(where,'type',`${where} must list fields and their values.`)]};
 const keys=Object.keys(set);
 if(!keys.length&&!allowEmpty)problems.push(problem(where,'missing',`${where} changes nothing; name at least one field.`));
 for(const key of keys){const r=lookValue(key,set[key],`${where}.${key}`);if(r.problem)problems.push(r.problem);else{out[key]=r.value;if(r.clamped)clamped.push(r.clamped);}}
 return {set:Object.fromEntries(LOOK_PATHS.filter(p=>Object.hasOwn(out,p)).map(p=>[p,out[p]])),clamped,problems};
}

const AGE_OF=new Map(PROFILES.map(p=>[p.name,p.age]));
/**
 * A look changes clothes, not years: every resident keeps the life stage World draws them at (from their age, where
 * their profile has one, else from cast.js), because their walk and their voice stay those of that stage.
 */
function ageProblems(name,set,where){
 if(!Object.hasOwn(set,'age')||!RESIDENT_NAMES.includes(name))return [];
 const stage=baseRecipe(name).age;
 if(set.age===stage)return [];
 const drawn=AGE_OF.has(name)?`${name} is ${AGE_OF.get(name)} in World, so is drawn as ${a(stage)} ${stage}`:`${name} is drawn as ${a(stage)} ${stage} in World`;
 return [problem(`${where}.age`,'age',`${drawn}; a look cannot make them ${a(set.age)} ${set.age}.`)];
}

/** A resident's name for a look: one World knows, and not a template. */
function residentProblems(name,where){
 if(NOT_RESIDENTS.has(name))return [problem(where,'name',NOT_RESIDENTS.get(name))];
 if(!RESIDENT_NAMES.includes(name))return [problem(where,'unknown-name',`${quote(name)} is not a resident World knows.${renamedTo(name)} character_list lists them; Studio-only characters change with character.set.`)];
 return [];
}

/** A Studio character's name: their own, not a resident's, not a name World used to have, and no real brand. */
function characterNameProblems(name,where,brands){
 const f=foldName(name),out=[];
 const resident=RESIDENT_NAMES.find(n=>foldName(n)===f),template=[...NOT_RESIDENTS.keys()].find(n=>foldName(n)===f);
 if(resident)out.push(problem(where,'name',`${resident} already lives in World; give a Studio character a name of their own, or change the resident's look instead.`));
 if(template)out.push(problem(where,'name',`${template} is a name World already uses (a template in the maker); give a Studio character a name of their own.`));
 const former=Object.keys(RENAMED_RESIDENTS).find(n=>foldName(n)===f);
 if(former)out.push(problem(where,'name',`${former} is the name World used to give ${RENAMED_RESIDENTS[former]}, and old saves and stories still read it as ${RENAMED_RESIDENTS[former]}; choose another name.`));
 return [...out,...brandProblems(name,where,brands)];
}

const sameKeys=(a,b)=>{const x=Object.keys(a).sort(),y=Object.keys(b).sort();return x.length===y.length&&x.every((k,i)=>k===y[i]);};

/** Real brand names in a label: a product, brand or label field, or a character's name or role. `rules` is data/studio/brand-rules.json. */
export function brandProblems(text,where,rules){
 if(!rules||typeof text!=='string')return [];
 const plain=text.normalize('NFKC').toLowerCase(),found=[];
 for(const brand of rules.brands||[]){
  const escaped=brand.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,'u').test(plain))found.push(brand);
 }
 for(const kana of rules.kana||[])if(plain.includes(kana.normalize('NFKC').toLowerCase()))found.push(kana);
 return found.map(b=>problem(where,'brand',`"${b}" is a real brand. Everything sold or labelled in Johansson World has a made-up name; choose one of the town's own.`));
}

/** The kind of picture some bytes are, from their first bytes: png, jpeg, webp, or null. */
export function pictureKind(bytes){
 const b=bytes,at=(i,...v)=>v.every((x,j)=>b[i+j]===x);
 if(b.length>=8&&at(0,0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return 'png';
 if(b.length>=3&&at(0,0xff,0xd8,0xff))return 'jpeg';
 if(b.length>=12&&at(0,0x52,0x49,0x46,0x46)&&at(8,0x57,0x45,0x42,0x50))return 'webp';
 return null;
}
export function decodeBase64(data){const bin=atob(data);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}

/**
 * The size a picture says it has, read from its header before anything decodes it: {width, height}, or null when the
 * header cannot be read. PNG (IHDR), JPEG (the first SOF segment) and WebP (VP8, VP8L, VP8X).
 */
export function pictureSize(bytes){
 const b=bytes,u16=i=>b[i]<<8|b[i+1],u16le=i=>b[i]|b[i+1]<<8,u24le=i=>b[i]|b[i+1]<<8|b[i+2]<<16,u32=i=>(b[i]<<24>>>0)+(b[i+1]<<16|b[i+2]<<8|b[i+3]);
 const at=(i,text)=>[...text].every((c,j)=>b[i+j]===c.charCodeAt(0));
 const kind=pictureKind(b);
 if(kind==='png')return b.length>=24&&at(12,'IHDR')?{width:u32(16),height:u32(20)}:null;
 if(kind==='jpeg'){
  for(let i=2;i+9<b.length;){
   if(b[i]!==0xff){i++;continue;}
   const marker=b[i+1];
   if(marker===0xff){i++;continue;}
   if(marker===0xd8||marker===0x01||(marker>=0xd0&&marker<=0xd7)){i+=2;continue;}
   if(marker===0xda||marker===0xd9)return null;
   if(marker>=0xc0&&marker<=0xcf&&![0xc4,0xc8,0xcc].includes(marker))return {width:u16(i+7),height:u16(i+5)};
   i+=2+u16(i+2);
  }
  return null;
 }
 if(kind==='webp'){
  if(at(12,'VP8 ')&&b.length>=30)return {width:u16le(26)&0x3fff,height:u16le(28)&0x3fff};
  if(at(12,'VP8L')&&b.length>=25){const bits=u16le(21)|u16le(23)<<16;return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
  if(at(12,'VP8X')&&b.length>=30)return {width:u24le(24)+1,height:u24le(27)+1};
 }
 return null;
}

/** A picture in a change file: really a PNG, JPEG or WebP, at most 2 MB and 8192 pixels a side, and the bytes its sha256 says. */
export function pictureProblems(name,file,where=`files.${name}`){
 let bytes;
 try{bytes=decodeBase64(file.data);}catch{return [problem(where,'picture',`${name} is not readable base64.`)];}
 const out=[];
 if(bytes.length>LIMITS.image)out.push(problem(where,'picture',`${name} is ${(bytes.length/1048576).toFixed(1)} MB; a picture may be at most 2 MB.`));
 const kind=pictureKind(bytes);
 if(!kind)out.push(problem(where,'picture',`${name} is not a PNG, JPEG or WebP picture.`));
 else if(!new RegExp(`\\.(${kind==='jpeg'?'jpe?g':kind})$`).test(name))out.push(problem(where,'picture',`${name} is really a ${kind.toUpperCase()} picture; its name must end in .${kind==='jpeg'?'jpg':kind}.`));
 if(kind)out.push(...sizeProblems(name,pictureSize(bytes),where));
 if(sha256(bytes)!==file.sha256)out.push(problem(where,'picture',`${name} does not match its checksum: it changed on the way. Save the change file again.`));
 return out;
}

/** A picture's size, checked before it is decoded: a small file may still claim to be enormous. */
export function sizeProblems(name,size,where=name){
 if(!size||!size.width||!size.height)return [problem(where,'picture',`${name} does not say how big it is; save it again as an ordinary PNG, JPEG or WebP.`)];
 if(Math.max(size.width,size.height)>LIMITS.side||size.width*size.height>LIMITS.pixels)
  return [problem(where,'picture',`${name} is ${size.width} × ${size.height} pixels; a picture may be at most ${LIMITS.side} pixels a side and ${LIMITS.pixels/1e6} million pixels in all.`)];
 return [];
}

/**
 * The pictures a change's steps use, by the names they have in its files: a designed label's baked picture
 * (label.picture) and the pictures its layers show before they are kept (a picture layer's file).
 */
export function picturesUsed(ops){
 const used=new Set(),label=l=>{if(l&&typeof l==='object'){if(typeof l.picture==='string')used.add(l.picture);for(const f of labelPictures(l.spec))if(typeof f==='string'&&!PICTURE_FILE.test(f))used.add(f);}};
 for(const op of ops||[]){
  if(op?.op==='product.update'&&op.set&&typeof op.set==='object')label(op.set.label);
  if(op?.op==='product.add'&&op.product&&typeof op.product==='object')label(op.product.label);
 }
 return used;
}

/**
 * A change file, checked before anything is read or written. `bytes` is the size of the file as received.
 * Returns {ok, problems, warnings, change}: `change` has its texts cleaned and its values normalised.
 */
export function validateChange(change,{bytes,brands}={}){
 const problems=[],warnings=[];
 if(!change||typeof change!=='object'||Array.isArray(change))return result([problem('change','type','This is not a Johansson Studio change file.')]);
 const size=bytes??new TextEncoder().encode(JSON.stringify(change)).length;
 if(size>LIMITS.bytes)problems.push(problem('change','limit',`This change file is ${(size/1048576).toFixed(1)} MB; a change may be at most 8 MB. Split it into smaller changes.`));
 problems.push(...checkSchema(change,CHANGE_SCHEMA,'change'));
 const out={...change};
 if(typeof change.note==='string'){
  const note=cleanText(change.note,{where:'change.note',max:LIMITS.text.note,label:'The note'});problems.push(...note.problems);out.note=note.text;
  if(!note.problems.length&&words(note.text)<LIMITS.purposeWords)problems.push(problem('change.note','purpose',`Say why in at least ${LIMITS.purposeWords} words; the note is how World remembers the reason for a change.`));
 }
 const ops=Array.isArray(change.ops)?change.ops.slice(0,LIMITS.ops+1):[];
 out.ops=ops.map((op,i)=>{const r=validateOp(op,i,{brands});problems.push(...r.problems);warnings.push(...r.warnings);return r.op;});
 const used=picturesUsed(out.ops),carried=change.files&&typeof change.files==='object'?change.files:{};
 for(const name of used)if(!Object.hasOwn(carried,name))problems.push(problem('change.files','picture',`A step uses the picture ${name}, which is not in the change's files.`));
 for(const [name,file] of Object.entries(carried)){
  if(!file||typeof file!=='object'||typeof file.data!=='string')continue;
  problems.push(...pictureProblems(name,file));
  if(!used.has(name))problems.push(problem(`files.${name}`,'unused',`No step in this change uses the picture ${name}; take it out of the file.`));
 }
 return result(problems,warnings,{change:out});
}

/** One step, checked against its schema and then for sense. `brands` is data/studio/brand-rules.json. Returns {op, problems, warnings}. */
export function validateOp(op,i,{brands}={}){
 const where=`ops[${i}]`,problems=[],warnings=[];
 if(!op||typeof op!=='object'||Array.isArray(op))return {op,problems:[problem(where,'type',`${where} is not a step.`)],warnings};
 const spec=typeof op.op==='string'&&Object.hasOwn(OPS,op.op)?OPS[op.op]:null;
 if(!spec)return {op,problems:[problem(`${where}.op`,'unknown-op',`${quote(String(op.op).slice(0,40))} is not a Studio step. The steps are: ${OP_NAMES.join(', ')}.`)],warnings};
 problems.push(...checkSchema(op,spec.schema,where));
 if(!spec.ready)problems.push(problem(`${where}.op`,'not-yet',`"${op.op}" is not switched on yet.`));
 if(problems.length)return {op,problems,warnings};
 if(op.op.startsWith('product.'))return validateProductOp(op,where,{brands});
 const out={...op};
 if(op.op.startsWith('look.'))problems.push(...residentProblems(op.name,`${where}.name`));
 if(op.op==='look.set'||op.op==='character.set'){
  const set=validateLookSet(op.set,{where:`${where}.set`}),was=validateLookSet(op.was,{where:`${where}.was`});
  problems.push(...set.problems,...was.problems);
  if(set.clamped.length)warnings.push(...set.clamped.map(c=>problem(`${where}.set.${c.path}`,'clamped',`${c.path} was ${c.given}; it runs from ${c.min??0} to ${c.max??1}, so ${c.used} is used.`)));
  if(!set.problems.length&&!was.problems.length&&!sameKeys(set.set,was.set))problems.push(problem(`${where}.was`,'was',`${where}.was must give today's value of every field the step changes, and only those.`));
  if(op.op==='look.set')problems.push(...ageProblems(op.name,set.set,`${where}.set`));
  out.set=set.set;out.was=was.set;
 }
 if(op.op==='look.reset'){const was=validateLookSet(op.was,{where:`${where}.was`,allowEmpty:true});problems.push(...was.problems);out.was=was.set;}
 if(op.note!==undefined){
  const note=cleanText(op.note,{where:`${where}.note`,max:LIMITS.text.lookNote,min:0,label:'The note'});problems.push(...note.problems);out.note=note.text;
  if(!note.problems.length&&note.text&&words(note.text)<LIMITS.purposeWords)problems.push(problem(`${where}.note`,'purpose',`Say why in at least ${LIMITS.purposeWords} words (or leave the step's note out, and the change's note is used).`));
 }
 if(op.op.startsWith('character.')){
  if(!ID.test(op.id))problems.push(problem(`${where}.id`,'id',`A character's id is 2 to 40 small letters, digits and hyphens, starting with a letter.`));
  else if(RESERVED.has(op.id))problems.push(problem(`${where}.id`,'id',`"${op.id}" is a word Studio keeps for itself; give the character another id.`));
 }
 if(op.op==='character.create'){
  const c=op.character,name=cleanText(c.name,{where:`${where}.character.name`,max:LIMITS.text.name,label:'The name'});
  const role=cleanText(c.card.role,{where:`${where}.character.card.role`,max:LIMITS.text.role,label:'The role'});
  const why=cleanText(c.card.why,{where:`${where}.character.card.why`,max:LIMITS.text.why,label:'Why they exist'});
  problems.push(...name.problems,...role.problems,...why.problems);
  if(!name.problems.length)problems.push(...characterNameProblems(name.text,`${where}.character.name`,brands));
  if(!role.problems.length)problems.push(...brandProblems(role.text,`${where}.character.card.role`,brands));
  if(!why.problems.length&&words(why.text)<LIMITS.purposeWords)problems.push(problem(`${where}.character.card.why`,'purpose',`Say who they are for and why they exist in at least ${LIMITS.purposeWords} words; nobody in Johansson World is random.`));
  out.character={name:name.text,recipe:normalizeRecipe({...c.recipe,name:name.text}),card:{role:role.text,why:why.text}};
 }
 return {op:out,problems,warnings};
}

/**
 * A whole looks file, checked (CI, publish_check, and the draft before it is published). Each published look keeps,
 * for every field it changes, the reason it was changed (`notes`) and when it last changed (`made`).
 */
export function validateLooks(file,{brands}={}){
 const problems=[],where='looks.json';
 if(!file||file.format!=='johansson-looks'||file.version!==1)return result([problem(where,'format','looks.json is not a Johansson looks file (format "johansson-looks", version 1).')]);
 for(const key of Object.keys(file))if(!['format','version','looks','characters'].includes(key))problems.push(problem(`${where}.${key}`,'unknown-key',`looks.json has a field Studio does not know: "${key}".`));
 for(const [name,look] of Object.entries(file.looks||{})){
  const at=`looks.${name}`;
  problems.push(...residentProblems(name,at));
  const set=validateLookSet(look?.set,{where:`${at}.set`});problems.push(...set.problems,...ageProblems(name,set.set,`${at}.set`));
  if(set.clamped.length)problems.push(problem(`${at}.set`,'range',`${at} has numbers outside their range.`));
  for(const key of Object.keys(look||{}))if(!['set','notes','made'].includes(key))problems.push(problem(`${at}.${key}`,'unknown-key',`${at} has a field Studio does not know: "${key}".`));
  const notes=look?.notes;
  if(!notes||typeof notes!=='object'||Array.isArray(notes))problems.push(problem(`${at}.notes`,'notes',`${at} must keep, for each field it changes, why it was changed (notes).`));
  else{
   for(const path of Object.keys(look?.set||{}))if(!Object.hasOwn(notes,path))problems.push(problem(`${at}.notes`,'notes',`${at} does not say why ${path} was changed.`));
   for(const [path,text] of Object.entries(notes)){
    if(!Object.hasOwn(look?.set||{},path)){problems.push(problem(`${at}.notes.${path}`,'notes',`${at} has a note for ${path}, which the look does not change.`));continue;}
    const note=cleanText(text,{where:`${at}.notes.${path}`,max:LIMITS.text.lookNote,label:`The note for ${path}`});problems.push(...note.problems);
    if(!note.problems.length&&words(note.text)<LIMITS.purposeWords)problems.push(problem(`${at}.notes.${path}`,'purpose',`The note for ${name}'s ${path} must say why in at least ${LIMITS.purposeWords} words.`));
   }
  }
  if(typeof look?.made!=='string'||!MADE.test(look.made))problems.push(problem(`${at}.made`,'made',`${at}.made must be the time the look last changed, written like 2026-10-11T09:14:00Z.`));
 }
 for(const [id,character] of Object.entries(file.characters||{})){
  const at=`characters.${id}`;
  if(!ID.test(id)||RESERVED.has(id))problems.push(problem(at,'id',`${quote(id)} is not a character id (2 to 40 small letters, digits and hyphens).`));
  for(const key of Object.keys(character||{}))if(!['name','recipe','card','made'].includes(key))problems.push(problem(`${at}.${key}`,'unknown-key',`${at} has a field Studio does not know: "${key}".`));
  if(typeof character?.made!=='string'||!MADE.test(character.made))problems.push(problem(`${at}.made`,'made',`${at}.made must be the time the character last changed, written like 2026-10-11T09:14:00Z.`));
  const r=validateOp({op:'character.create',id:ID.test(id)&&!RESERVED.has(id)?id:'x-invalid',character:{name:character?.name,recipe:character?.recipe,card:character?.card}},0,{brands});
  problems.push(...r.problems.map(p=>({...p,where:p.where.replace('ops[0].character',at)})));
 }
 const names=new Map();
 for(const [id,character] of Object.entries(file.characters||{})){const f=foldName(character?.name??'');
  if(names.has(f))problems.push(problem(`characters.${id}.name`,'name',`Two Studio characters are called ${character.name} (${names.get(f)} and ${id}); each needs a name of their own.`));else names.set(f,id);}
 return result(problems);
}

// ─── Products (stage 2): Sakura Shōten's lines, data/studio/products.json ────────────────────────────────────────────

/** The fields of a product a change may set, by path. Never its id, its inventoryName (old saves keep it) or its cells. */
export const PRODUCT_FIELDS=Object.freeze(['name','jp','price','unitCost','text','bagColour','mailOrder',
 'brand','brand.name','brand.jp','brand.line','brand.paper','brand.ink','brand.accent','brand.symbol',
 'pack','pack.shape','pack.size','pack.colour','pack.detail','pack.net','pack.flash','pack.tag','pack.art','pack.back','pack.back.ingredients','pack.back.unit','pack.back.recycle','pack.back.food',
 'label','purpose','purpose.zone','purpose.for','purpose.why','purpose.placed','shelf','capacity','supplier','drink','drink.alcohol','drink.container','drink.handColour']);
const LOCKED_FIELDS=Object.freeze({id:'A product\'s id is its save key: old saves and the shop\'s stock find it by its id, so it never changes.',
 inventoryName:'inventoryName is what old saves keep in the bag; it never changes.',shop:'A product belongs to Sakura Shōten; moving it to another shop is a code batch.',
 cells:'A product\'s atlas cells are its own and never move; a new flavour gets a cell of its own (product_add as "flavour").'});
export const PACK_SHAPES=Object.freeze(['bottle','can','cup','foil-cup','carton','tray','wedge','bag','box']);
const DETAILS=['marble','pages','tissue-slot'],UNITS=['bottle','pack','can','cup','bag','box','piece','serving'],RECYCLE=['PET','CAN','PLA','PAP'];
export const BAKED_ON=Object.freeze(['iPad Safari','Chromium']);
/** A baked label: labels/<product id>.r<revision>.webp (assets/graphics/labels/). */
export const LABEL_IMAGE=/^labels\/([a-z][a-z0-9-]{1,39})\.r([1-9][0-9]{0,3})\.webp$/;
/** Cells in each half of the label atlas (store-advertising.js): labels, prints and price tags on the left, flavours on the right. */
export const ATLAS_CELLS=ATLAS_COLS*ATLAS_ROWS;
/** How deep a line may stand: two deep in the fridge, the chiller and the steamer, three on a gondola board (as today). */
const MAX_ROWS={fridge:2,chiller:2,steamer:2,west:3,middle:3,east:3};
const MAX_COLUMNS={fridge:6,chiller:6,west:8,middle:8,east:8};
const GONDOLAS=['west','middle','east'];
const isHex=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/.test(v);
const own=(map,key)=>map&&Object.hasOwn(map,key)?map[key]:undefined;
export const readField=(record,path)=>path.split('.').reduce((v,k)=>v&&typeof v==='object'&&Object.hasOwn(v,k)?v[k]:undefined,record);

/** A text field of a product, cleaned and checked for real brands. `lines` allows a line break (the shelf card's text). */
function productText(value,where,{max,label,brands,min=1,lines=false,check=true}){
 const r=cleanText(lines&&typeof value==='string'?value.replace(/\n/g,' '):value,{where,max,min,label});
 const text=lines&&typeof value==='string'?value.normalize('NFKC').trim():r.text;
 return {text,problems:[...r.problems,...(check&&!r.problems.length?brandProblems(text,where,brands):[])]};
}

/**
 * How a line stands on its fitting: how many facings across (the widest even split, as sakura-layout.js faces them)
 * and how many deep. {columns, rows, perLevel} or a sentence saying why it cannot stand.
 */
export function standing(product,products){
 const s=product.shelf,cap=product.capacity;
 let levels;
 if(s.fitting==='fridge')levels=s.levels.length;
 else if(s.fitting==='chiller'||s.fitting==='steamer')levels=2;
 else{const n=products.filter(p=>p.shelf.fitting===s.fitting&&p.shelf.bay===s.bay).length;levels=Math.floor(AISLE_LEVELS.length/n)+(s.order<AISLE_LEVELS.length%n?1:0);}
 if(!levels)return {sentence:`${product.id} has no shelf of its own to stand on.`};
 const perLevel=cap/levels;
 if(!Number.isInteger(perLevel))return {sentence:`${product.id}'s ${cap} do not share out evenly over its ${levels} shelves; give it a capacity of ${Math.max(1,Math.round(perLevel))*levels}.`};
 const columns=s.fitting==='steamer'?3:facingsFor(perLevel,MAX_COLUMNS[s.fitting]),rows=perLevel/columns;
 if(!Number.isInteger(rows)||rows>MAX_ROWS[s.fitting])return {sentence:`${product.id} would stand ${Number.isInteger(rows)?rows:'unevenly'} deep (${perLevel} on each of its ${levels} shelves); at most ${MAX_ROWS[s.fitting]} deep fits the ${s.fitting==='fridge'?'cold cabinet':s.fitting}. A capacity of ${levels*MAX_ROWS[s.fitting]*Math.min(MAX_COLUMNS[s.fitting]||3,6)} or less fits.`};
 return {columns,rows,perLevel,levels};
}

/** One product record checked field by field (not against the others: validateProducts does that). */
export function validateProduct(p,{where=`products.${p?.id}`,brands,retired=[]}={}){
 const out=[],add=(at,rule,sentence)=>out.push(problem(at,rule,sentence));
 if(!p||typeof p!=='object'||Array.isArray(p))return [problem(where,'type','A product must be a record of its fields.')];
 const KEYS=['id','inventoryName','shop','name','jp','price','unitCost','text','bagColour','mailOrder','brand','pack','label','cells','purpose','shelf','capacity','supplier','drink'];
 for(const key of Object.keys(p))if(!KEYS.includes(key))add(`${where}.${key}`,'unknown-key',`A product has no field ${quote(key)}.`);
 if(typeof p.id!=='string'||!ID.test(p.id)||RESERVED.has(p.id)||p.id.endsWith('-picture'))add(`${where}.id`,'id','A product\'s id is 2 to 40 small letters, digits and hyphens, starting with a letter (and not ending in "-picture").');
 if(retired.some(r=>r.id===p.id))add(`${where}.id`,'id',`"${p.id}" belonged to a line that was retired; a retired id is never used again (old saves still mean that line by it).`);
 const inv=productText(p.inventoryName,`${where}.inventoryName`,{max:40,label:'The inventory name',brands});out.push(...inv.problems);
 if(p.shop!=='sakura')add(`${where}.shop`,'value','Only Sakura Shōten\'s products are in Studio so far (shop "sakura").');
 const name=productText(p.name,`${where}.name`,{max:40,label:'The name',brands});out.push(...name.problems);
 if(!name.problems.length&&!inv.problems.length&&name.text!==inv.text)
  add(`${where}.name`,'rename',`${p.inventoryName} is also the name old saves keep in the bag, and World still finds a bag's things by their names, so a product cannot be renamed yet (an open item: World reading the bag by product id). Change the words on the label instead.`);
 out.push(...productText(p.jp,`${where}.jp`,{max:40,label:'The second line on the shelf tag (jp)',brands}).problems);
 out.push(...productText(p.text,`${where}.text`,{max:300,label:'The shelf card\'s text',brands,lines:true}).problems);
 if(!Number.isInteger(p.price)||p.price<10||p.price>5000)add(`${where}.price`,'price',`A price is a whole number of yen from ¥10 to ¥5000, not ${quote(p.price)}.`);
 if(p.unitCost!==undefined&&(!Number.isInteger(p.unitCost)||p.unitCost<1||p.unitCost>=p.price))add(`${where}.unitCost`,'price','What Thuan pays for one (unitCost) is a whole number of yen below the shelf price.');
 if(p.bagColour!==null&&!isHex(p.bagColour))add(`${where}.bagColour`,'colour','bagColour is a colour written #rrggbb (small letters), or null for what is sold over the counter.');
 if(p.bagColour===null&&p.cells?.price!=null)add(`${where}.bagColour`,'colour','A line on the shelves needs a bag colour.');
 if(p.mailOrder!==undefined&&p.mailOrder!==true)add(`${where}.mailOrder`,'value','mailOrder is true for a line in Thuan\'s mail-order book, or left out.');
 const b=p.brand;
 if(!b||typeof b!=='object')add(`${where}.brand`,'missing','A product needs its brand: name, jp, line, paper, ink, accent and symbol.');
 else{
  for(const key of Object.keys(b))if(!['name','jp','line','paper','ink','accent','symbol'].includes(key))add(`${where}.brand.${key}`,'unknown-key',`A brand has no field ${quote(key)}.`);
  out.push(...productText(b.name,`${where}.brand.name`,{max:24,label:'The brand name',brands}).problems,...productText(b.jp,`${where}.brand.jp`,{max:24,label:'The brand\'s second name (jp)',brands}).problems,
   ...productText(b.line,`${where}.brand.line`,{max:40,label:'The line',brands}).problems);
  for(const c of ['paper','ink','accent'])if(!isHex(b[c]))add(`${where}.brand.${c}`,'colour',`The brand's ${c} is a colour written #rrggbb (small letters), not ${quote(b[c])}.`);
  if(!SYMBOLS.includes(b.symbol))add(`${where}.brand.symbol`,'unknown-word',`${quote(b.symbol)} is not an emblem; choose one of: ${SYMBOLS.join(', ')}.`);
 }
 const k=p.pack;
 if(!k||typeof k!=='object')add(`${where}.pack`,'missing','A product needs its pack: shape, size, net, flash, tag, art and back.');
 else{
  for(const key of Object.keys(k))if(!['shape','size','colour','detail','net','flash','tag','art','back','declared'].includes(key))add(`${where}.pack.${key}`,'unknown-key',`A pack has no field ${quote(key)}.`);
  if(!PACK_SHAPES.includes(k.shape))add(`${where}.pack.shape`,'unknown-word',`${quote(k.shape)} is not a pack the shelf can build; choose one of: ${PACK_SHAPES.join(', ')}.`);
  if(!Array.isArray(k.size)||k.size.length!==3||!k.size.every(n=>typeof n==='number'&&n>=.004&&n<=.5))add(`${where}.pack.size`,'size','A pack\'s size is [width, height, depth] in metres, each from 0.004 to 0.5.');
  if(k.shape==='bottle'&&!isHex(k.colour))add(`${where}.pack.colour`,'colour','A bottle needs its own tint (pack.colour, #rrggbb).');
  if(k.colour!==undefined&&!isHex(k.colour))add(`${where}.pack.colour`,'colour','pack.colour is a colour written #rrggbb.');
  if(k.detail!==undefined&&!DETAILS.includes(k.detail))add(`${where}.pack.detail`,'unknown-word',`${quote(k.detail)} is not a detail the shelf builds; choose one of: ${DETAILS.join(', ')}.`);
  for(const f of ['net','flash','tag'])out.push(...productText(k[f],`${where}.pack.${f}`,{max:40,min:0,label:`The pack's ${f}`,brands}).problems);
  if(!ARTS.includes(k.art))add(`${where}.pack.art`,'unknown-word',`${quote(k.art)} is not one of the packs' illustrations; choose one of: ${ARTS.join(', ')}.`);
  const back=k.back;
  if(!back||typeof back!=='object')add(`${where}.pack.back`,'missing','A pack needs its back panel: ingredients, unit, recycle and food.');
  else{
   if(back.ingredients!==null)out.push(...productText(back.ingredients,`${where}.pack.back.ingredients`,{max:200,label:'The ingredients',brands}).problems);
   if(!UNITS.includes(back.unit))add(`${where}.pack.back.unit`,'unknown-word',`The nutrition is given per ${UNITS.join(', ')}; not ${quote(back.unit)}.`);
   if(!RECYCLE.includes(back.recycle))add(`${where}.pack.back.recycle`,'unknown-word',`The recycling mark is one of ${RECYCLE.join(', ')}; not ${quote(back.recycle)}.`);
   if(typeof back.food!=='boolean')add(`${where}.pack.back.food`,'yes/no','back.food is true for food and drink, false for everything else.');
  }
 }
 const l=p.label,c=p.cells;
 if(!l||typeof l!=='object')add(`${where}.label`,'missing','A product needs its label: painted, fresh or designed.');
 else if(l.source==='painted'){
  for(const key of Object.keys(l))if(!['source','sheet','cell'].includes(key))add(`${where}.label.${key}`,'unknown-key',`A painted label has no field ${quote(key)}.`);
  if(![0,1].includes(l.sheet)||!Number.isInteger(l.cell)||l.cell<0||l.cell>15)add(`${where}.label`,'label','A painted label is a cell (0 to 15) of painted sheet 0 or 1.');
  else if(c&&l.sheet*16+l.cell!==c.brand)add(`${where}.label`,'label',`${p.id}'s painting is cell ${l.cell} of sheet ${l.sheet}, which lies under atlas cell ${l.sheet*16+l.cell}, not under its own cell ${c.brand}.`);
 }else if(l.source==='fresh'){
  if(Object.keys(l).length!==1)add(`${where}.label`,'unknown-key','A fresh label has only {source:"fresh"}.');
  if(!FRESH_LABELS.includes(p.id))add(`${where}.label`,'label',`Only ${FRESH_LABELS.join(', ')} have a printed fresh-food face (fresh-labels.js); give ${p.id} a designed label.`);
 }else if(l.source==='designed'){
  for(const key of Object.keys(l))if(!['source','spec','image','sha256','bakedOn'].includes(key))add(`${where}.label.${key}`,'unknown-key',`A designed label has no field ${quote(key)}.`);
  const r=normalizeLabelSpec(l.spec,{where:`${where}.label.spec`});out.push(...r.problems);
  if(r.spec)for(const word of labelWords(r.spec))out.push(...brandProblems(word,`${where}.label.spec`,brands));
  const image=typeof l.image==='string'?l.image.match(LABEL_IMAGE):null;
  if(!image||image[1]!==p.id)add(`${where}.label.image`,'label',`A designed label's picture is labels/${p.id}.r<n>.webp, baked from its design; not ${quote(l.image)}.`);
  if(typeof l.sha256!=='string'||!/^[0-9a-f]{64}$/.test(l.sha256))add(`${where}.label.sha256`,'label','A designed label keeps the sha256 of its baked picture.');
  if(!BAKED_ON.includes(l.bakedOn))add(`${where}.label.bakedOn`,'label',`bakedOn says where the picture was baked: ${BAKED_ON.join(' or ')}.`);
 }else add(`${where}.label.source`,'value',`A label is painted, fresh or designed, not ${quote(l.source)}.`);
 if(!c||typeof c!=='object')add(`${where}.cells`,'missing','A product needs its atlas cells.');
 else{
  for(const key of Object.keys(c))if(!['key','brand','price','flavours'].includes(key))add(`${where}.cells.${key}`,'unknown-key',`cells has no field ${quote(key)}.`);
  if(c.key!==undefined&&(typeof c.key!=='string'||!ID.test(c.key)))add(`${where}.cells.key`,'id','cells.key is the label\'s own name in the atlas (an id).');
  if(!Number.isInteger(c.brand))add(`${where}.cells.brand`,'cell','A product needs its own label cell.');
  if(c.price!==null&&!Number.isInteger(c.price))add(`${where}.cells.price`,'cell','cells.price is the shelf price tag\'s cell, or null for a line with no tag (sold over the counter).');
  if(!Array.isArray(c.flavours)||c.flavours.length>6)add(`${where}.cells.flavours`,'limit','A line has at most six flavours beside the original.');
  else c.flavours.forEach((f,i)=>{
   const at=`${where}.cells.flavours[${i}]`;
   out.push(...productText(f?.name,`${at}.name`,{max:24,label:'A flavour\'s name',brands}).problems);
   if(!Number.isInteger(f?.hue)||f.hue<-180||f.hue>180)add(`${at}.hue`,'range','A flavour\'s hue turn is a whole number of degrees from -180 to 180.');
   if(!Number.isInteger(f?.cell))add(`${at}.cell`,'cell','A flavour needs its own cell.');
  });
 }
 const u=p.purpose;
 if(!u||typeof u!=='object')add(`${where}.purpose`,'purpose','Nothing in Sakura is random: a product needs its purpose (zone, for, why, placed).');
 else{
  if(!Object.hasOwn(ZONES,u.zone))add(`${where}.purpose.zone`,'zone',`${quote(u.zone)} is not a part of the shop; the zones are ${Object.keys(ZONES).join(', ')}.`);
  if(!Array.isArray(u.for)||!u.for.length)add(`${where}.purpose.for`,'purpose',`Say who in town buys ${p.id}: at least one resident, by name.`);
  else{
   for(const n of u.for)if(!RESIDENT_NAMES.includes(n))add(`${where}.purpose.for`,'unknown-name',`${quote(n)} is not a resident of World.${typeof n==='string'?renamedTo(n):''}`);
   if(new Set(u.for).size!==u.for.length)add(`${where}.purpose.for`,'purpose','A resident is named twice in purpose.for.');
  }
  for(const f of ['why','placed']){
   const r=cleanText(u[f],{where:`${where}.purpose.${f}`,max:300,label:f==='why'?'Why it is stocked':'Why it stands where it does'});out.push(...r.problems);
   if(!r.problems.length&&words(r.text)<LIMITS.purposeWords)add(`${where}.purpose.${f}`,'purpose',f==='why'?`Say what the people who buy ${p.id} want it for, in at least ${LIMITS.purposeWords} words.`:`Say why ${p.id} stands where it does, in at least ${LIMITS.purposeWords} words.`);
  }
  if(p.shelf&&Object.hasOwn(ZONE_OF_SHELF,p.shelf.fitting)&&ZONE_OF_SHELF[p.shelf.fitting]!==u.zone)add(`${where}.purpose.zone`,'zone',`${p.id} stands in the ${p.shelf.fitting==='fridge'?'cold cabinet':p.shelf.fitting} (${ZONE_OF_SHELF[p.shelf.fitting]}), so its zone is ${ZONE_OF_SHELF[p.shelf.fitting]}, not ${u.zone}.`);
 }
 const s=p.shelf;
 if(!s||typeof s!=='object'||!Object.hasOwn(ZONE_OF_SHELF,s.fitting))add(`${where}.shelf`,'fitting',`A product needs its place: a fitting (${Object.keys(ZONE_OF_SHELF).join(', ')}) and where on it.`);
 else{
  const keys={fridge:['fitting','column','levels'],chiller:['fitting','bay','deck'],steamer:['fitting']}[s.fitting]||['fitting','bay','order'];
  for(const key of Object.keys(s))if(!keys.includes(key))add(`${where}.shelf.${key}`,'unknown-key',`A place on the ${s.fitting} has no field ${quote(key)}; it has ${keys.join(', ')}.`);
  if(s.fitting==='fridge'){
   if(!Number.isInteger(s.column)||s.column<0||s.column>=FRIDGE_COLUMNS)add(`${where}.shelf.column`,'fitting',`The cold cabinet has columns 0 to ${FRIDGE_COLUMNS-1} (3 is nearest the till).`);
   if(!Array.isArray(s.levels)||!s.levels.length||!s.levels.every((l,i)=>Number.isInteger(l)&&l>=0&&l<FRIDGE_LEVELS.length&&(!i||l===s.levels[i-1]+1)))
    add(`${where}.shelf.levels`,'fitting',`A line in the cold cabinet takes shelves next to each other, counted from 0 (the bottom) to ${FRIDGE_LEVELS.length-1}, e.g. [2,3,4].`);
  }else if(s.fitting==='chiller'){
   if(!Number.isInteger(s.bay)||s.bay<0||s.bay>=CHILLED_BAYS.length)add(`${where}.shelf.bay`,'fitting',`The chiller has bays 0 to ${CHILLED_BAYS.length-1}.`);
   if(!['upper','lower'].includes(s.deck))add(`${where}.shelf.deck`,'fitting','A chiller line is on the upper or the lower deck.');
  }else if(GONDOLAS.includes(s.fitting)){
   if(!Object.hasOwn(AISLE_BAYS,s.bay)||AISLE_BAYS[s.bay].site!==s.fitting)add(`${where}.shelf.bay`,'fitting',`The ${s.fitting} gondola's bays are ${Object.keys(AISLE_BAYS).filter(b=>AISLE_BAYS[b].site===s.fitting).join(', ')}.`);
   if(!Number.isInteger(s.order)||s.order<0)add(`${where}.shelf.order`,'fitting','order says which board the line takes in its bay: 0 is the lowest.');
  }
 }
 if(!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>60)add(`${where}.capacity`,'range','A line\'s capacity is how many the shelf holds when full: a whole number from 1 to 60.');
 if(!Object.hasOwn(SUPPLIERS,p.supplier))add(`${where}.supplier`,'supplier',`${quote(p.supplier)} supplies nothing in town; the suppliers are ${Object.keys(SUPPLIERS).join(', ')}.`);
 if(p.drink!==undefined){
  const d=p.drink;
  if(!d||typeof d!=='object'||typeof d.alcohol!=='boolean'||!['can','bottle'].includes(d.container)||!isHex(d.handColour)||Object.keys(d).some(k=>!['alcohol','container','handColour'].includes(k)))
   add(`${where}.drink`,'drink','A drink of its own is {alcohol: true or false, container: "can" or "bottle", handColour: #rrggbb}.');
  else if(d.alcohol&&p.supplier!=='sakura')add(`${where}.supplier`,'supplier','All the alcohol in town comes from Sakura Trading (supplier "sakura") since Higa Liquor closed (22 October 2026), Sakura\'s beer included.');
 }
 return out;
}

/**
 * The whole products file: every product, then what only the whole can say: ids, names and cells used once, every
 * shelf booked once and none left standing empty, every line standing at most as deep as its fitting allows, and the
 * room left in the atlas. Returns {ok, problems, warnings, room:{products, flavours}}.
 */
export function validateProducts(file,{brands}={}){
 const problems=[],warnings=[],where='products.json',add=(at,rule,sentence)=>problems.push(problem(at,rule,sentence));
 if(!file||file.format!=='johansson-products'||file.version!==1)return result([problem(where,'format','products.json is not a Johansson products file (format "johansson-products", version 1).')]);
 for(const key of Object.keys(file))if(!['format','version','products','prints','retired'].includes(key))add(`${where}.${key}`,'unknown-key',`products.json has a field Studio does not know: "${key}".`);
 const products=Array.isArray(file.products)?file.products:[],prints=Array.isArray(file.prints)?file.prints:[],retired=Array.isArray(file.retired)?file.retired:[];
 for(const p of products)problems.push(...validateProduct(p,{where:`products.${p?.id}`,brands,retired}));
 const seen=(list,key,what)=>{const m=new Map();for(const x of list){const v=key(x);if(v==null)continue;if(m.has(v))add(`products.${x.id||x.key}`,'twice',`${what} ${quote(v)} is used by both ${m.get(v)} and ${x.id||x.key}.`);else m.set(v,x.id||x.key);}};
 seen([...products,...retired],p=>p.id,'The id');seen([...products,...retired],p=>p.inventoryName,'The inventory name');
 const left=[...products.map(p=>({id:p.id,cell:p.cells?.brand})),...products.filter(p=>p.cells?.price!=null).map(p=>({id:p.id+' (price tag)',cell:p.cells.price})),...prints.map(p=>({id:p.key,cell:p.cell}))];
 const right=products.flatMap(p=>(p.cells?.flavours||[]).map(f=>({id:`${p.id} ${f.name}`,cell:f.cell})));
 for(const [half,cells] of [['left',left],['right',right]]){
  seen(cells,c=>c.cell,`The ${half} atlas cell`);
  for(const c of cells)if(!Number.isInteger(c.cell)||c.cell<0||c.cell>=ATLAS_CELLS)add(`products.${c.id}`,'atlas',`${c.id}'s cell ${quote(c.cell)} is outside the label atlas (cells 0 to ${ATLAS_CELLS-1}); growing the atlas (ATLAS_ROWS) is a code batch, not a Studio change.`);
 }
 seen(products.map(p=>({id:p.id,key:p.cells?.key||p.id})).concat(prints.map(p=>({id:p.key,key:p.key}))),x=>x.key,'The atlas name');
 for(const p of prints)if(!p||typeof p.key!=='string'||!Number.isInteger(p.cell)||typeof p.what!=='string')add(`prints.${p?.key}`,'print','A print is {key, cell, what, brand?, pack?}.');
 for(const r of retired){
  if(!r||!ID.test(r.id)||typeof r.inventoryName!=='string'||typeof r.why!=='string'||typeof r.retired!=='string')add(`retired.${r?.id}`,'retired','A retired line keeps {id, inventoryName, name, text, why, retired} (and its drink), so old saves still know it.');
 }
 const placed=products.filter(p=>p.shelf&&Object.hasOwn(ZONE_OF_SHELF,p.shelf.fitting));
 const fridge=new Map();
 for(const p of placed.filter(p=>p.shelf.fitting==='fridge'))for(const l of p.shelf.levels||[]){const k=`${p.shelf.column}:${l}`;if(fridge.has(k))add(`products.${p.id}.shelf`,'booked',`Shelf ${l} of the cold cabinet's column ${p.shelf.column} is booked twice: ${fridge.get(k)} and ${p.id}.`);else fridge.set(k,p.id);}
 for(let c=0;c<FRIDGE_COLUMNS;c++)for(let l=0;l<FRIDGE_LEVELS.length;l++)if(!fridge.has(`${c}:${l}`))add('products.shelf','empty',`Shelf ${l} of the cold cabinet's column ${c} would stand empty; give it to a line beside it.`);
 const chiller=new Map();
 for(const p of placed.filter(p=>p.shelf.fitting==='chiller')){const k=`${p.shelf.bay}:${p.shelf.deck}`;if(chiller.has(k))add(`products.${p.id}.shelf`,'booked',`The chiller's ${p.shelf.deck} deck in bay ${p.shelf.bay} is booked twice: ${chiller.get(k)} and ${p.id}.`);else chiller.set(k,p.id);}
 for(let b=0;b<CHILLED_BAYS.length;b++)for(const d of ['upper','lower'])if(!chiller.has(`${b}:${d}`))add('products.shelf','empty',`The chiller's ${d} deck in bay ${b} would stand empty.`);
 for(const [name,bay] of Object.entries(AISLE_BAYS)){
  const lines=placed.filter(p=>p.shelf.fitting===bay.site&&p.shelf.bay===name),orders=lines.map(p=>p.shelf.order).sort((a,b)=>a-b);
  if(!lines.length)add('products.shelf','empty',`The ${name} bay would stand empty.`);
  if(lines.length>AISLE_LEVELS.length)add(`products.shelf.${name}`,'booked',`The ${name} bay has ${AISLE_LEVELS.length} boards; ${lines.length} lines cannot share them.`);
  if(orders.some((o,i)=>o!==i))add(`products.shelf.${name}`,'booked',`The lines in the ${name} bay must be in order 0, 1, 2 … with none twice (${lines.map(p=>`${p.id} ${p.shelf.order}`).join(', ')}).`);
 }
 if(placed.filter(p=>p.shelf.fitting==='steamer').length>1)add('products.shelf','booked','The bun steamer holds one line.');
 for(const p of placed){const r=standing(p,placed);if(r.sentence)add(`products.${p.id}.capacity`,'standing',r.sentence);}
 const free=ATLAS_CELLS-new Set(left.map(c=>c.cell)).size,freeRight=ATLAS_CELLS-new Set(right.map(c=>c.cell)).size;
 if(free<4)warnings.push(problem(where,'atlas',`Only ${Math.floor(free/2)} more products fit in the label atlas; after that ATLAS_ROWS must grow (a code batch).`));
 return result(problems,warnings,{room:{products:Math.floor(free/2),flavours:freeRight}});
}

/** A product step, checked for sense before it is applied (the whole file is checked again afterwards). */
function validateProductOp(op,where,{brands}){
 const problems=[],warnings=[],out={...op},add=(at,rule,sentence)=>problems.push(problem(at,rule,sentence));
 if(op.note!==undefined){
  const note=cleanText(op.note,{where:`${where}.note`,max:LIMITS.text.lookNote,min:0,label:'The note'});problems.push(...note.problems);out.note=note.text;
  if(!note.problems.length&&note.text&&words(note.text)<LIMITS.purposeWords)add(`${where}.note`,'purpose',`Say why in at least ${LIMITS.purposeWords} words (or leave the step's note out).`);
 }
 if(op.op==='product.update'){
  const paths=Object.keys(op.set);
  for(const path of paths){
   const top=path.split('.')[0];
   if(Object.hasOwn(LOCKED_FIELDS,top))add(`${where}.set.${path}`,'locked',LOCKED_FIELDS[top]);
   else if(!PRODUCT_FIELDS.includes(path))add(`${where}.set.${path}`,'unknown-field',`"${path}" is not a field Studio can change. The fields are: ${PRODUCT_FIELDS.join(', ')}.`);
   if(paths.some(other=>other!==path&&other.startsWith(path+'.')))add(`${where}.set.${path}`,'overlap',`Set ${path} or a part of it, not both.`);
  }
  const was=Object.keys(op.was).sort(),set=[...paths].sort();
  if(was.length!==set.length||was.some((k,i)=>k!==set[i]))add(`${where}.was`,'was',`${where}.was must give today's value of every field the step changes, and only those.`);
  const label=op.set.label;
  if(label!==undefined){
   if(!label||typeof label!=='object')add(`${where}.set.label`,'label','A label is {source:"painted"|"fresh"|"designed", …}.');
   else if(label.source==='designed'){
    for(const key of Object.keys(label))if(!['source','spec','picture','image','sha256','bakedOn'].includes(key))add(`${where}.set.label.${key}`,'unknown-key',`A designed label has no field ${quote(key)}.`);
    const files=new Set([...picturesUsed([op])]);
    const r=normalizeLabelSpec(label.spec,{where:`${where}.set.label.spec`,pictures:f=>PICTURE_FILE.test(f)||files.has(f)});problems.push(...r.problems);
    if(r.spec){out.set={...op.set,label:{...label,spec:r.spec}};for(const word of labelWords(r.spec))problems.push(...brandProblems(word,`${where}.set.label`,brands));}
    if(r.clamped.length)warnings.push(...r.clamped.map(c=>problem(c.where,'clamped',`${c.where.split('.').pop()} was ${c.given}; ${c.used} is used.`)));
    if(label.picture===undefined&&label.image===undefined)add(`${where}.set.label`,'label','A designed label needs its baked picture (picture, a file of the change), or the tools bake it for you (product_update without one).');
    if(label.picture!==undefined&&!BAKED_ON.includes(label.bakedOn))add(`${where}.set.label.bakedOn`,'label',`bakedOn says where the picture was baked: ${BAKED_ON.join(' or ')}.`);
   }
  }
 }
 if(op.op==='product.add'){
  const {mode,target}=op.place;
  if(mode==='flavour'){
   const f=op.product;
   for(const key of Object.keys(f))if(!['name','hue'].includes(key))add(`${where}.product.${key}`,'unknown-key','A flavour is {name, hue}: its name on the ribbon and how far its pack turns in hue (degrees).');
   const name=productText(f.name,`${where}.product.name`,{max:24,label:'The flavour\'s name',brands});problems.push(...name.problems);
   if(!Number.isInteger(f.hue)||f.hue<-180||f.hue>180)add(`${where}.product.hue`,'range','A flavour\'s hue turn is a whole number of degrees from -180 to 180 (0 would look like the original).');
   else if(Math.abs(f.hue)<10)add(`${where}.product.hue`,'range','A flavour must look different from the original: turn its hue by at least 10 degrees.');
   if(!target)add(`${where}.place.target`,'missing','Say which line the flavour belongs to (place.target).');
   out.product={name:name.text,hue:f.hue};
  }else{
   if(['share','replace'].includes(mode)&&!target)add(`${where}.place.target`,'missing',`Say which line it ${mode==='share'?'shares a shelf with':'takes the place of'} (place.target).`);
   if(op.product.cells!==undefined)add(`${where}.product.cells`,'locked','A new line\'s cells are given to it when it is applied; leave cells out.');
   const label=op.product.label;
   if(label?.source==='designed'){
    const files=new Set([...picturesUsed([op])]);
    if(label.spec?.base==='painted')add(`${where}.product.label.spec.base`,'label','A new line has no painting to keep under its label; start it from paper (base "paper").');
    const r=normalizeLabelSpec(label.spec,{where:`${where}.product.label.spec`,pictures:f=>PICTURE_FILE.test(f)||files.has(f)});problems.push(...r.problems);
    if(r.spec){out.product={...op.product,label:{...label,spec:r.spec}};for(const word of labelWords(r.spec))problems.push(...brandProblems(word,`${where}.product.label`,brands));}
   }else if(label?.source!=='fresh')add(`${where}.product.label`,'label','A new line needs a designed label (with its baked picture), or a fresh one if fresh-labels.js draws it.');
  }
 }
 if(op.op==='product.retire'){
  const why=cleanText(op.why,{where:`${where}.why`,max:300,label:'Why it is retired'});problems.push(...why.problems);out.why=why.text;
  if(!why.problems.length&&words(why.text)<LIMITS.purposeWords)add(`${where}.why`,'purpose',`Say why the line goes, in at least ${LIMITS.purposeWords} words; the retired list keeps the reason.`);
 }
 return {op:out,problems,warnings};
}
