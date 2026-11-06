/**
 * Where World still names a product outside its record in data/studio/products.json: the places a retire would leave
 * talking about a line Sakura no longer sells, and the other drawings of it that its label does not reach.
 *
 * - code: its inventory name ("Umineko lager") anywhere in World's code, and its id as a quoted word ('beer') in the
 *   code that handles Sakura's stock; each as file:line with the line itself;
 * - tests: the same, in World's tests (retiring it would break them);
 * - accounts: the trade accounts (merchandising.js ACCOUNTS) whose lines name it, their shelf lines or their named drink
 *   (`alcohol`, Sakura Trading's since Higa Liquor closed);
 * - drawings: its brand's own words (UMINEKO, Umineko, 海猫) in code that draws something of its own, a crate, a
 *   bottle or a poster, which a new label does not change.
 * A retire is refused while there is any code, test or account reference: those need the creator's choice first
 * (decision 4), and their fix is a code batch. Drawings are listed, never blocking.
 */
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {CODE_ROOT} from './repo.mjs';

const TOWN='johansson-town';
/** World's code that handles Sakura's stock by id. */
const STOCK_CODE=/^johansson-town\/(src\/commerce\/|src\/world\/interiors\/(sakura|store-advertising|item-viewer|shelf-flavours|stockroom)|src\/people\/(shop-retail|sakura-shop|thuan-gifts|resident-personalities)|src\/economy\/|src\/game\.js|activities\.js)/;
/** What is read: World's source (src/ and the modules beside index.html) and its tests, not builds or tools. */
const SOURCE=/^johansson-town\/(src\/.+\.js|[a-z0-9-]+\.js|tests\/[a-z0-9-]+\.(test|browser)\.mjs)$/;
/** Generated, or naming illustrations rather than products (the packs' art), or Studio's own code and tests (they name
 * products as examples): never a reference. */
const SKIP=/^johansson-town\/(src\/commerce\/products-data\.js|src\/studio\/|sw\.js|tests\/(studio-|products-|label-spec))/,NOT_IDS=/^johansson-town\/src\/commerce\/(packaging-art|label-art)\.js$/;
/** Brand words that are also the shop's own name or a common word: never taken as a drawing of one line. */
const SHARED=new Set(['sakura','minato','komugi','asamori','shiofumi']);
/** The kanji a brand is also written in on things World draws (crates, bottles, posters). */
const KANJI={UMINEKO:['海猫']};

let cache=null;
async function files(root){
 if(cache?.root===root)return cache.files;
 const out=[];
 async function scan(dir,deep){for(const e of await readdir(resolve(root,dir),{withFileTypes:true}).catch(()=>[])){const p=`${dir}/${e.name}`;
  if(e.isDirectory()){if(deep)await scan(p,true);}else if(SOURCE.test(p)&&!SKIP.test(p))out.push(p);}}
 await scan(TOWN,false);await scan(`${TOWN}/src`,true);await scan(`${TOWN}/tests`,false);
 const read=await Promise.all(out.map(async path=>({path,lines:(await readFile(resolve(root,path),'utf8')).split('\n')})));
 cache={root,files:read};return read;
}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/** Every place World names this product, by kind. */
export async function productReferences(product,{root=CODE_ROOT}={}){
 const code=[],tests=[],drawings=[],name=product.inventoryName;
 const idWord=new RegExp(`(['"\`])${escape(product.id)}\\1`);
 const brandWords=[product.brand?.name,product.brand?.jp].filter(w=>w&&!SHARED.has(w.toLowerCase())).map(w=>new RegExp(`(^|[^A-Za-z])${escape(w)}([^A-Za-z]|$)`,'i'));
 const kanji=KANJI[product.brand?.name]||[];
 for(const {path,lines} of await files(root)){
  const test=path.startsWith(`${TOWN}/tests/`);
  lines.forEach((line,i)=>{
   if(/^\s*(\/\/|\/?\*)/.test(line))return;
   const at={file:path.replace(`${TOWN}/`,''),line:i+1,text:line.trim().slice(0,160)};
   if(line.includes(name)||(STOCK_CODE.test(path)&&!NOT_IDS.test(path)||test)&&idWord.test(line)){(test?tests:code).push(at);return;}
   if(!test&&(brandWords.some(r=>r.test(line))||kanji.some(k=>line.includes(k))))drawings.push(at);
  });
 }
 const {ACCOUNTS}=await import('../../src/commerce/merchandising.js'),accounts=[];
 for(const [supplier,list] of Object.entries(ACCOUNTS))for(const [site,a] of Object.entries(list)){
  const named=[...a.lines,...(a.alcohol||[])].filter(l=>l===product.id||l.includes(name)||(product.brand?.jp&&l.includes(product.brand.jp)));
  if(named.length)accounts.push({supplier,site,name:a.name,lines:named});
 }
 return {code,tests,accounts,drawings,blocking:code.length+tests.length+accounts.length};
}

/** The references as plain sentences, for a refused retire. */
export function referenceSentences(product,refs,{limit=40}={}){
 const out=[],list=[...refs.code.map(r=>`${r.file}:${r.line}`),...refs.tests.map(r=>`${r.file}:${r.line} (a test)`)];
 if(list.length)out.push(`World's code still names ${product.name}: ${list.slice(0,limit).join(', ')}${list.length>limit?` and ${list.length-limit} more`:''}.`);
 for(const a of refs.accounts)out.push(`${a.name} still orders it from ${a.supplier} (${a.lines.join('; ')}).`);
 return out;
}
