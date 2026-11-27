import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {installDOM} from './fixtures.mjs';

/*
 * No real brand anywhere in the World (the owner, 27 November 2026: "Yes, no real brand only fictional brands that fit into
 * the Jansson world and if you can't make up a good one just use the Johansson name as a brand"; AGENTS.md).
 *
 * Every piece of text the player or the storyteller can meet is read: the strings and template text of src/ (comments are
 * not read: they are for us, and they quote the owner, the research and the sources), the JSON of src/, data/ and guide/,
 * and the root content files (the game's scripts, index.html, the manifest). Each is searched, with word boundaries, for
 * the real brands in data/studio/brand-rules.json: `brands` and `kana` everywhere, and `contextual` (brands that are also
 * a street, a city, a god, an era or a surname here) everywhere their ordinary sense below does not explain them.
 *
 * A use that is not a brand is let through only by a reason written here: SENSES for the ordinary meanings of a word,
 * ALLOWED for a particular place in a particular file. A new hit fails with the file and the words around it: give the
 * thing one of the town's own names (Umineko, Kame, Shimakaze, Shima TV, the Shisa Drive-In ...) or the Johansson name.
 */
const town=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const RULES=JSON.parse(await readFile(resolve(town,'data/studio/brand-rules.json'),'utf8'));

/**
 * The ordinary senses of a listed word: an occurrence these explain is not a brand (each is blanked out and the word looked
 * for again). Every contextual word has some; a word the Studio refuses outright may have them too (the night sky's Orion).
 */
const SENSES=Object.freeze({
 orion:[/\bOrion(?:’s|'s)? (?:belt|Belt|the [Hh]unter|constellation|rising|rises|overhead|in the (?:east|south|west))\b/,/\b(?:constellation|stars|belt) of Orion\b/],
 asahi:[/\bAsahi[- ](?:dōri|dori|Street|street|Lane|lane|Road|road)\b/,/\bAsahi-dōri\b/],
 sapporo:[/\b(?:in|from|to|of) Sapporo\b/,/\bSapporo[- ]style\b/],
 kirin:[/\bkirin\b(?! (?:beer|lager))/],                                   // the beast, in small letters
 ebisu:[/\bEbisu(?:-sama| shrine| the god|,? (?:the )?god)\b/,/\bgod Ebisu\b/],
 meiji:[/\bMeiji (?:era|period|Restoration|shrine|Shrine|road|Road)\b/],
 lotte:[/\b(?:Miss|Ms|Mrs|aunt|Aunt) Lotte\b/],
 morinaga:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer)\.? Morinaga\b/,/\bMorinaga-(?:san|sensei|kun|chan)\b/],
 honda:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Honda\b/,/\bHonda-(?:san|sensei|kun|chan)\b/],
 suzuki:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Suzuki\b/,/\bSuzuki-(?:san|sensei|kun|chan)\b/,/\bsuzuki\b/],
 toyota:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Toyota\b/,/\bToyota-(?:san|sensei|kun|chan)\b/,/\b(?:in|from|to) Toyota\b/],
 kawasaki:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Kawasaki\b/,/\bKawasaki-(?:san|sensei|kun|chan)\b/,/\b(?:in|from|to) Kawasaki\b/],
 kubota:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Kubota\b/,/\bKubota-(?:san|sensei|kun|chan)\b/],
 mizuno:[/\b(?:Mr|Mrs|Ms|Miss|Dr|Officer|Captain)\.? Mizuno\b/,/\bMizuno-(?:san|sensei|kun|chan)\b/],
 subaru:[/\bSubaru,? (?:the )?Pleiades\b/,/\bPleiades\b/],
 seiko:[/\b(?:Mrs|Ms|Miss|aunt|Aunt|Auntie)\.? Seiko\b/,/\bSeiko-(?:san|chan)\b/],
 zuisen:[/\bZuisen(?:-mon| [Gg]ate)\b/],
 zanpa:[/\bCape Zanpa\b/,/\bZanpa[- ]misaki\b/],
 puma:[/\bpumas?\b/],                                                     // the animal, in small letters
 sprite:[/\bsprites?\b/,/\bTHREE\.Sprite\b/,/\bSpriteMaterial\b/],          // a fairy, or the graphics term
 excel:[/\bexcel(?:s|led|ling)?\b/],                                     // the verb, in small letters
 tulip:[/\btulips?\b(?! (?:pork|luncheon))/],                            // the flower
 aeon:[/\baeons?\b/],                                                    // the word
});

/**
 * Particular uses that are not brands in the World, each with its reason. `file` is the file (from the Town's root),
 * `context` what the piece of text must say for the hit to pass. Every entry must still be needed (a test below).
 */
const ALLOWED=Object.freeze([
 {term:'*',file:'data/studio/brand-rules.json',why:'The list itself: every brand is written in it once.'},
 {term:'*',file:'src/studio/modeller/rules.json',why:'jojo\'s brand list for the modeller (its `brands`), copied: the list itself.'},
 {term:'zuisen',file:'src/world/interiors/izakaya-dressing.js',context:/^Zuisen awamori$/,why:'RENAMED_KEEP: a bottle kept in a game saved before 27 November 2026 is read under its old name and renamed Shimakaze.'},
 {term:'kumesen',file:'src/world/interiors/izakaya-dressing.js',context:/^Kumesen awamori$/,why:'RENAMED_KEEP: the old name of Mr Higa\'s bottle, for the same saves.'},
 {term:'yanmar',file:'src/world/ferry-machinery-design.js',why:'The ferry\'s engineering references (its sources, a comparison engine): research data never shown in the game; the engine fitted is the fictional Johansson Marine JM6-160.'},
 {term:'mitsubishi',file:'src/world/ferry-machinery-design.js',why:'The same engineering references: an alternative engine looked at and not chosen.'},
 {term:'google',file:'src/people/thuan-voice.js',context:/^Google Japanese$/,why:'The name of a speech voice the browser may offer, matched so Thuan\'s voice can be chosen: never shown.'},
 {term:'shopify',file:'activities.js',why:'The real-money shop: an order paid in real money must name who takes the payment; it is outside the World and says so ("Real-world order").'},
 {term:'shopify',file:'src/commerce/shopify.js',why:'The real-money shop\'s connection to its payment service (a request header).'},
 {term:'ikea',file:'activities.js',context:/LACK side table and IVAR pine cabinet: IKEA/,why:'The credits: the furniture models\' makers are credited by name, as their terms ask. In the World they are a side table and a pine cabinet.'},
 {term:'ipad',file:'src/studio/ops.js',context:/^ipad$/,why:'Johansson Studio\'s change files record which device made them (by: ipad or claude): the creator\'s bookkeeping, never in the World.'},
 {term:'ipad',file:'src/studio/modeller/export.js',context:/^ipad$/,why:'The same record on an asset package from the modeller.'},
 {term:'ipad',file:'src/studio/rules.js',context:/^iPad Safari$/,why:'Where a designed label was baked (the creator\'s tablet or Chromium): Studio\'s bookkeeping.'},
 {term:'iphone',file:'index.html',why:'The install help names the player\'s own device (Add to Home Screen): outside the World.'},
 {term:'ipad',file:'index.html',why:'The install help, as above.'},
]);

// The files whose text the World shows: src/, data/, guide/ and the root content files (not the build's plumbing).
const SKIP_DIR=/(^|\/)(node_modules|sculpts)(\/|$)/;
const ROOT_PLUMBING=new Set(['vite.config.js','sw.js']);
async function filesUnder(dir,exts){
 const out=[];
 for(const e of await readdir(resolve(town,dir),{withFileTypes:true})){
  const path=dir+'/'+e.name;if(SKIP_DIR.test(path))continue;
  if(e.isDirectory())out.push(...await filesUnder(path,exts));else if(exts.includes(extname(e.name)))out.push(path);
 }
 return out;
}
async function worldFiles(){
 const root=(await readdir(town,{withFileTypes:true})).filter(e=>e.isFile()&&(/\.(js|html)$/.test(e.name)||e.name==='manifest.webmanifest')&&!ROOT_PLUMBING.has(e.name)).map(e=>e.name);
 return [...await filesUnder('src',['.js','.mjs','.json']),...await filesUnder('data',['.json']),...await filesUnder('guide',['.json','.mjs']),...root,'creator/index.html'];
}

/** The strings and template text of a script, without its comments or regular expressions. */
export function jsStrings(src){
 const out=[];let i=0,prev='';const n=src.length;
 const regexMayStart=()=>prev===''||/[(,=:[!&|?{};+\-*%<>~^]$/.test(prev)||/^(return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(prev);
 const quoted=q=>{let s='';i++;while(i<n&&src[i]!==q&&src[i]!=='\n'){if(src[i]==='\\'){s+=src[i+1]??'';i+=2;continue;}s+=src[i++];}i++;return s;};
 const template=()=>{let s='';i++;
  while(i<n&&src[i]!=='`'){
   if(src[i]==='\\'){s+=src[i+1]??'';i+=2;continue;}
   if(src[i]==='$'&&src[i+1]==='{'){out.push(s);s='';i+=2;let depth=1;
    while(i<n&&depth){const c=src[i];
     if(c==='\''||c==='"'){out.push(quoted(c));continue;}
     if(c==='`'){template();continue;}
     if(c==='{')depth++;else if(c==='}')depth--;
     i++;}
    continue;}
   s+=src[i++];}
  out.push(s);i++;};
 while(i<n){const c=src[i];
  if(c==='/'&&src[i+1]==='/'){while(i<n&&src[i]!=='\n')i++;continue;}
  if(c==='/'&&src[i+1]==='*'){const e=src.indexOf('*/',i+2);i=e<0?n:e+2;continue;}
  if(c==='\''||c==='"'){out.push(quoted(c));prev='x';continue;}
  if(c==='`'){template();prev='x';continue;}
  if(c==='/'&&regexMayStart()){i++;let cls=false;while(i<n&&src[i]!=='\n'){const d=src[i];if(d==='\\'){i+=2;continue;}if(d==='[')cls=true;else if(d===']')cls=false;else if(d==='/'&&!cls)break;i++;}i++;while(/[a-z]/i.test(src[i]||''))i++;prev='x';continue;}
  if(/\s/.test(c)){i++;continue;}
  if(/[\w$]/.test(c)){let w='';while(i<n&&/[\w$]/.test(src[i]))w+=src[i++];prev=w;continue;}
  prev=c;i++;}
 return out;
}
/** Every string value in a JSON document (not its keys). */
function jsonStrings(value,out=[]){
 if(typeof value==='string')out.push(value);
 else if(Array.isArray(value))for(const v of value)jsonStrings(v,out);
 else if(value&&typeof value==='object')for(const v of Object.values(value))jsonStrings(v,out);
 return out;
}
/** A page's words: its markup and attributes, and its scripts' strings; not its comments or styles. */
function htmlStrings(src){
 const out=[];
 const page=src.replace(/<!--[\s\S]*?-->/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
  .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi,(_,code)=>{out.push(...jsStrings(code));return '';});
 out.push(page);return out;
}
async function piecesOf(file){
 const text=await readFile(resolve(town,file),'utf8');
 if(file.endsWith('.json')||file.endsWith('.webmanifest'))return jsonStrings(JSON.parse(text));
 if(file.endsWith('.html'))return htmlStrings(text);
 return jsStrings(text);
}
// Not words: measured tables and pictures carried as text (base64, packed numbers), and a module's path (an import).
const encoded=s=>s.length>=160&&!/\s/.test(s)||/^\.{1,2}\/[\w./-]+\.m?js$/.test(s);
// A style sheet in a template string carries its own comments (/* … */): for us, like the script's.
const uncommented=s=>s.includes('/*')?s.replace(/\/\*[\s\S]*?\*\//g,' '):s;

const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const wordRe=w=>new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w.normalize('NFKC').toLowerCase())}($|[^\\p{L}\\p{N}])`,'u');
const TERMS=[...RULES.brands.map(b=>({term:b,re:wordRe(b)})),...Object.keys(RULES.contextual).map(b=>({term:b,re:wordRe(b),contextual:true}))];
/** The real brands one piece of text names, as [{term, around}], before any allowance. */
export function brandsIn(piece){
 const plain=piece.normalize('NFKC').toLowerCase(),hits=[];
 for(const {term,re,contextual} of TERMS){
  // (a contextual word is looked for again once its ordinary senses are blanked out: "Mr Honda's Honda" still names the maker)
  const text=SENSES[term]&&re.test(plain)?SENSES[term].reduce((t,s)=>t.replace(new RegExp(s.source,s.flags.includes('g')?s.flags:s.flags+'g'),m=>' '.repeat(m.length)),piece).normalize('NFKC').toLowerCase():plain;
  const m=re.exec(text);if(!m)continue;
  hits.push({term,around:piece.slice(Math.max(0,m.index-50),m.index+term.length+60)});
 }
 for(const kana of RULES.kana){const k=kana.normalize('NFKC').toLowerCase(),at=plain.indexOf(k);if(at>=0)hits.push({term:kana,around:piece.slice(Math.max(0,at-30),at+k.length+30)});}
 return hits;
}
const allowance=(file,term,piece)=>ALLOWED.find(a=>a.file===file&&(a.term==='*'||a.term===term)&&(!a.context||a.context.test(piece)));

test('the guard\'s list and its reasons are in order',()=>{
 assert.equal(RULES.version,2);assert.match(RULES.about,/27 November 2026/);
 for(const word of Object.keys(RULES.contextual)){
  assert.ok(!RULES.brands.includes(word),`${word} is contextual, so the Studio does not refuse it outright`);
  assert.ok(SENSES[word]?.length,`${word}: its ordinary senses are written in SENSES`);
  assert.ok(RULES.contextual[word].length>20,`${word}: why it is contextual`);
 }
 for(const a of ALLOWED)assert.ok(a.why.length>12&&a.file,`${a.term} in ${a.file}: an allowance says where and why`);
 assert.deepEqual(RULES.knownIssues,[],'World has no known real-brand use left to warn about');
 assert.ok(!RULES.brands.includes('asahi'),'Asahi is a street here: contextual, never refused outright');
});

test('the matcher finds brands by whole words and lets their ordinary senses through',()=>{
 const terms=s=>brandsIn(s).map(h=>h.term);
 for(const [text,want] of [['One Orion draught! Cold from the tap.','orion'],['ORION','orion'],['Ｏｒｉｏｎ lager','orion'],['A&W root beer in the frosted mug','a&w'],
  ['add a whole tin of Spam!','spam'],['NHK Okinawa · Typhoon information','nhk'],['Asahi beer, ice cold','asahi beer'],['Asahi on draught','asahi'],
  ['the postman’s Super Cub','super cub'],['my niece’s Tamagotchi','tamagotchi'],['a can of Sprite','sprite'],['Mr Honda’s Honda','honda'],['オリオンビール','オリオン'],
  ['Wrapped in the Ryūkyū Shimpō.','ryūkyū shimpō'],['A Johansson Washlet','washlet'],['Orion beer under Orion’s belt','orion']])
  assert.ok(terms(text).includes(want),`${JSON.stringify(text)} names ${want}`);
 for(const text of ['Umineko draught, medium mug','Kame island lager','Orionids','Lorionne','sonya','A drink on Asahi-dōri','a sprite in the cel shader',
  'Mr Honda waves','Since the Meiji era','Orion’s belt over the harbour','Orion rising in the east','the Zuisen gate at Shuri','tulips in a bucket','new THREE.Sprite(material)','She will excel at it','a giraffe, a kirin'])
  assert.deepEqual(terms(text),[],JSON.stringify(text));
});

test('a string\'s text is read, its comments and regular expressions are not',()=>{
 assert.deepEqual(jsStrings("const a='Orion'; // Asahi beer\n/* Kirin lager */ const b=`x ${'Spam'} y`,c=/Pepsi/i.test(z),d=1/2/3;"),['Orion','x ','Spam',' y']);
 assert.deepEqual(jsStrings('return /a\\/b/.test(s)?"one":\'two\''),['one','two']);
});

test('no real brand in the World: not on products, signs, menus, posters, machines, in dialogue, the storyteller or the guide',async()=>{
 const found=[],used=new Set(),files=await worldFiles();let read=0;
 assert.ok(files.length>600&&files.includes('src/people/chat-lines.js')&&files.includes('guide/residents.json')&&files.includes('activities.js'),`the World's files are found (${files.length})`);
 for(const file of files){
  for(const raw of await piecesOf(file)){
   if(encoded(raw))continue;const piece=uncommented(raw);read++;
   for(const hit of brandsIn(piece)){
    const a=allowance(file,hit.term,piece);
    if(a)used.add(a);else found.push(`${file}: "${hit.term}" in …${hit.around.replace(/\s+/g,' ')}…`);
   }
  }
 }
 assert.ok(read>50000,`the World's text is read (${read} pieces)`);
 assert.deepEqual(found,[],'Real brands in the World (the owner, 27 November 2026). Give each one of the town\'s own names, or the Johansson name; '
  +'if it is not a brand here, add its sense to SENSES or its place to ALLOWED with the reason.\n'+found.join('\n'));
 const stale=ALLOWED.filter(a=>!used.has(a)).map(a=>`${a.term} in ${a.file}`);
 assert.deepEqual(stale,[],'These allowances are no longer needed; take them out');
});

test('Minato pours the town\'s own lager, the one Sakura supplies it, from the town\'s brewer',async()=>{
 installDOM();
 const {DRINKS,MINATO_BEER}=await import('../src/people/izakaya-beer.js');
 const {ALCOHOL}=await import('../src/economy/goods.js');
 const {ACCOUNTS}=await import('../src/commerce/merchandising.js');
 assert.equal(MINATO_BEER.brand,'Umineko');assert.match(MINATO_BEER.brewer,/^Johansson Brewery/);assert.ok(MINATO_BEER.who&&MINATO_BEER.why);
 for(const id of ['draft','bottle','can'])for(const key of ['jp','en'])assert.match(DRINKS[id][key],/^Umineko /,`${id}.${key}`);
 assert.match(DRINKS.draft.line,/Umineko/);
 assert.ok(ACCOUNTS.sakura.izakaya.alcohol.some(l=>l.startsWith(MINATO_BEER.brand)),'Sakura\'s account with Minato sends the same beer');
 // (the economy prices Minato's mug and large bottle from these: economy/goods.js)
 assert.ok(ALCOHOL['beer-keg'].name.startsWith(MINATO_BEER.brand)&&ALCOHOL['beer-keg'].measure.minato.price===DRINKS.draft.price,'the keg the mug is poured and priced from');
 assert.ok(ALCOHOL['beer-bottle'].name.startsWith(MINATO_BEER.brand)&&ALCOHOL['beer-bottle'].measure.minato.price===DRINKS.bottle.price,'the large bottle');
});

test('a bottle kept at Minato in an old save keeps its pours under the awamori\'s own name',async()=>{
 const {createIzakayaPlay}=await import('../src/people/izakaya-play.js');
 const {BOTTLE_KEEP,RENAMED_KEEP,KEEP_DRINK}=await import('../src/world/interiors/izakaya-dressing.js');
 const names=new Set(BOTTLE_KEEP.map(b=>b.drink));
 assert.ok(names.has(KEEP_DRINK));for(const now of Object.values(RENAMED_KEEP))assert.ok(names.has(now),now);
 for(const [was,now] of Object.entries(RENAMED_KEEP)){
  const state={yen:0,izakayaBottle:{drink:was,poured:7,since:0}},shown=[];
  createIzakayaPlay({state,getMinutes:()=>20*60,save(){},close(){},say(){},note(){},spend:()=>false,show:(title,text,buttons)=>shown.push({title,text,buttons}),receipt(){}}).bottleKeep();
  assert.deepEqual(state.izakayaBottle,{drink:now,poured:7,since:0},was);
  assert.match(shown.at(-1).text,new RegExp(`You — ${now} \\(7 poured so far\\)`));assert.ok(!brandsIn(shown.at(-1).text).length,shown.at(-1).text);
 }
});
