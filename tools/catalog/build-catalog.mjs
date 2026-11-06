// Johansson World's asset catalogue as a module (briefs/NEXT.md §5: "build assets in studio and assemble them in world").
//
// Johansson Studio publishes each asset into assets/catalog/<id>/ (model.glb, asset.json, hero.png) and lists it in
// assets/catalog/index.json (python3 -m townstudio.assets publish <id> --site <this repo>). World builds its rooms in one
// go, without a fetch (the game, Johansson Studio's Build scene and the film's staging check, room-colliders.mjs, all
// build them synchronously), so the cards are compiled here into src/catalog/catalog-data.js, which src/catalog/catalog.js
// imports. Only the model itself is downloaded, when a place needs it.
//
//   node tools/catalog/build-catalog.mjs           write src/catalog/catalog-data.js from assets/catalog
//   node tools/catalog/build-catalog.mjs --check   exit 1 if catalog-data.js is not what assets/catalog makes
//                                                  (tests/catalog.test.mjs runs the same check in CI)
//
// Kept for each asset: what it is and its purpose (who it is for, why, where), its size and colours, its colliders,
// seats, standing spots, action and anchors, its parts, the model's path and the first 12 hex digits of its sha256 (the
// model's URL carries it, so a cached old model never meets a new card), the hero, what Studio measured and the budget.
// Left out: keepClear (59 boxes of Studio's own verification; tests read them from asset.json) and the list of checks.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const TOWN=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const OUTPUT='src/catalog/catalog-data.js';
const FORMAT=1,FROM='johansson-studio',ID=/^[a-z0-9][a-z0-9-]{1,47}$/;

const exists=async path=>{try{await stat(path);return true;}catch{return false;}};
const refuse=(id,why)=>{throw new Error(`assets/catalog: ${id?id+': ':''}${why}`);};

/** The cards in assets/catalog, checked against the index and compiled to what World keeps of them, by id. */
export async function readCatalog(town=TOWN){
 const dir=resolve(town,'assets/catalog'),index=JSON.parse(await readFile(resolve(dir,'index.json'),'utf8'));
 if(index.format!==FORMAT)refuse(null,`index.json is format ${index.format}, World reads format ${FORMAT}`);
 const out={},seen=new Set();
 for(const e of [...index.assets].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){
  const id=e.id;
  if(typeof id!=='string'||!ID.test(id))refuse(null,`${JSON.stringify(id)} is not an asset id`);
  if(seen.has(id))refuse(id,'listed twice in index.json');seen.add(id);
  if(e.from!==FROM)refuse(id,`came from ${JSON.stringify(e.from)}, not from Johansson Studio`);
  if(!await exists(resolve(dir,id)))refuse(id,'listed in index.json but its folder is missing');
  if(e.card!==id+'/asset.json'||e.model!==id+'/model.glb')refuse(id,'its card and model are not in its own folder');
  const card=JSON.parse(await readFile(resolve(dir,e.card),'utf8'));
  if(card.format!==FORMAT)refuse(id,`its card is format ${card.format}, World reads format ${FORMAT}`);
  if(card.id!==id)refuse(id,`its card is for ${JSON.stringify(card.id)}`);
  if(card.version!==e.version)refuse(id,`index.json says version ${e.version}, its card version ${card.version}`);
  if(card.source?.from!==FROM)refuse(id,'its card was not exported by Johansson Studio');
  const failed=(card.checks||[]).filter(c=>!c.ok).map(c=>c.id);
  if(!card.checks?.length||failed.length)refuse(id,`it did not pass Studio's checks (${failed.join(', ')||'none recorded'})`);
  if(card.model!=='model.glb')refuse(id,'its card does not name its model.glb');
  const glb=await readFile(resolve(dir,e.model));
  if(glb.readUInt32LE(0)!==0x46546c67)refuse(id,'model.glb is not a binary glTF');
  const {purpose,size,colours,tags,checked,colliders,seats,spots,action,anchors,parts,measured,budget}=card;
  out[id]={id,name:card.name,kind:card.kind,version:card.version,
   purpose:{for:purpose.for,why:purpose.why,where:purpose.where},size,colours,tags,checked,
   colliders,seats:seats||[],spots:spots||[],action:action||null,anchors:anchors||{},
   parts:(parts||[]).map(p=>({name:p.name,loose:!!p.loose,note:p.note||''})),
   model:e.model,modelSha:createHash('sha256').update(glb).digest('hex').slice(0,12),hero:e.hero||null,
   measured,budget,published:e.published||null};
 }
 return out;
}

/** JSON with one key a line, and a list of plain values (a point, a size, the tags) kept on its own line. */
// (Only the line breaks JSON.stringify put in are taken out: a string in the JSON never holds a raw line break.)
const pretty=value=>JSON.stringify(value,null,1).replace(/\[(\n[^\[\]{}]*?)\n\s*\]/g,(_,list)=>'['+list.replace(/\n\s*/g,'')+']');

/** The module's text: the catalogue, frozen all the way down. */
export async function catalogSource(town=TOWN){
 const cards=await readCatalog(town);
 return `// Generated from assets/catalog by tools/catalog/build-catalog.mjs: do not edit. Change the asset in Johansson Studio,
// publish it (python3 -m townstudio.assets publish <id> --site <this repo>), then run node tools/catalog/build-catalog.mjs.
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
/** Johansson World's asset catalogue, by id (src/catalog/catalog.js places them). */
export const CATALOG=freeze(${pretty(cards)});
`;
}

async function main(){
 const target=resolve(TOWN,OUTPUT),text=await catalogSource();
 if(process.argv.includes('--check')){
  const now=await exists(target)?await readFile(target,'utf8'):null;
  if(now!==text){console.error(`${OUTPUT} is not what assets/catalog makes: run node tools/catalog/build-catalog.mjs`);process.exit(1);}
  console.log(`${OUTPUT} matches assets/catalog`);return;
 }
 await writeFile(target,text);
 console.log(`Wrote ${OUTPUT}: ${Object.keys(await readCatalog()).join(', ')}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
