// Proof that a stylesheet cleanup changed nothing a visitor sees on the title screen: every computed style of every
// element of #start (and its ::before and ::after), at six screen sizes, in each of the screen's states, in this
// checkout and in an earlier revision of it, side by side in the same browser.
//
//   node tools/title-style-proof.mjs [rev]            compare the working tree with rev (default origin/main)
//   node tools/title-style-proof.mjs --dead a.css …   list the declarations of those sheets that no state uses
//       PROOF_ONLY='logo|splash'   examine only rules whose selector matches (default: every title rule)
//       PROOF_QUICK=1              three sizes, not six (a first look; delete nothing on it)
//       PROOF_STILL=1              the first pass only (see below)
//
// Why it exists (9 and 10 November 2026): the title is drawn by title-screen.css and line-ui.css, which come last and
// override an older, toy-coloured title in landing.css and base.css. Pocket Camera's brand was first copied from
// those overridden rules, and came out wrong; they were then deleted. A stylesheet cannot say which of its rules
// still decides anything. The browser can: take a declaration away and see whether any computed value moves.
//
// The comparison is of base styles: running animations are cancelled before reading, so a value caught mid-flight
// cannot differ by timing; the animation properties themselves (name, duration, delay) are compared as written.
// Custom properties are not compared: they are not drawn (what reads one shows the change in a real property), the
// game sets some of them as it runs, and a cleanup may delete one on purpose. The two sites' own addresses are
// taken out of url() values.
// States: the title as it loads, booting (#start.booting), the guide open (#start.guide-open), every [hidden] part
// shown, and reduced motion. Not covered: :hover, :focus and :active. Do not delete a rule for those on this proof.
//
// Two passes. The first is the page as written: the game's scripts are kept from loading, so both sides stand still
// in the same state, and every reading must be equal. (With the scripts running, two pages loading side by side are
// never at the same step: the Start button's progress, the loader's words and the town feed differ by the moment.)
// The second lets the game load fully on both sides, at a phone's size and a desktop's, with the same clock and the
// same dice, and compares the title and the guide as a visitor then sees them.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..'),name=root.slice(site.length+1);
const args=process.argv.slice(2),dead=args[0]==='--dead',rev=dead?null:(args[0]||'origin/main'),sheets=dead?args.slice(1):[];
if(dead&&!sheets.length){console.error('--dead needs the stylesheets to examine, e.g. landing.css base.css');process.exit(2);}
const git=(...a)=>execFileSync('git',a,{cwd:root,maxBuffer:1<<28});
// Files that differ between rev and the working tree: the earlier site serves those from rev, everything else from disk.
const changed=rev?new Set(git('diff','--name-only',rev,'--').toString().split('\n').filter(Boolean)):new Set();
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const serve=earlier=>new Promise(done=>{const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
  if(!file.startsWith(site))throw Error('outside');
  const rel=file.startsWith(root+'/')?file.slice(root.length+1):null;
  const body=earlier&&rel&&changed.has(rel)?git('show',`${rev}:${rel}`):await readFile(file);
  res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}});server.listen(0,'127.0.0.1',()=>done(server));});
const ALL_SIZES=[[390,664,true],[375,560,true],[740,360,true],[820,1180,true],[1180,820,true],[1440,900,false]];
const SIZES=process.env.PROOF_QUICK?[ALL_SIZES[0],ALL_SIZES[2],ALL_SIZES[5]]:ALL_SIZES,ONLY=process.env.PROOF_ONLY||'logo|title|splash|#start';
const STATES=['title','booting','guide','unhidden','reduced'];
// Runs in the page: put #start in a state, then read every computed style under it.
const enter=state=>{const start=document.getElementById('start');
 start.classList.remove('booting','guide-open');
 for(const el of start.querySelectorAll('[data-proof-unhidden]')){el.hidden=true;el.removeAttribute('data-proof-unhidden');}
 if(state==='booting')start.classList.add('booting');
 if(state==='guide')start.classList.add('guide-open');
 if(state==='unhidden')for(const el of start.querySelectorAll('[hidden]')){el.hidden=false;el.setAttribute('data-proof-unhidden','');}
};
const snapshot=()=>{const start=document.getElementById('start'),boxes={};
 for(const a of document.getAnimations())try{a.cancel();}catch{}
 const path=el=>{const parts=[];for(let e=el;e&&e!==start.parentElement;e=e.parentElement){const same=[...e.parentElement.children].filter(c=>c.tagName===e.tagName);parts.unshift(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(same.length>1?`:${same.indexOf(e)+1}`:''));}return parts.join('>');};
 const first=getComputedStyle(start),names=[];for(let i=0;i<first.length;i++)if(!first[i].startsWith('--'))names.push(first[i]);
 for(const el of [start,...start.querySelectorAll('*')])for(const pseudo of ['','::before','::after']){
  const s=getComputedStyle(el,pseudo||undefined);if(pseudo&&s.content==='none')continue;
  // The box's own words come first (the same words must be on both sides for their boxes to measure the same).
  let line=pseudo?'':[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');
  for(const name of names)line+='\u0001'+s.getPropertyValue(name).replace(/https?:\/\/127\.0\.0\.1:\d+/g,'');
  boxes[path(el)+pseudo]=line;
 }
 return {names:['(its words)',...names],boxes};
};
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const open=async(server,[width,height,touch],reduced,live=false)=>{
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:touch,hasTouch:touch,reducedMotion:reduced?'reduce':'no-preference'});
 // The same moment and the same dice on both sides: the title shows a clock, the day's weather and a fact drawn by lot.
 if(live)await context.clock.setFixedTime(new Date('2026-11-10T03:00:00Z'));else await context.clock.install({time:new Date('2026-11-10T03:00:00Z')});
 await context.addInitScript(()=>{let seed=20261110;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
 const page=await context.newPage();
 // The fonts' hosts are not needed to compare styles. In the first pass no script file is fetched (the page's own
 // inline scripts still run): the title stands as it is written.
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 if(!live)await page.route(/\.m?js(\?|$)/,r=>r.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/${name}/`,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#titleLogo .logo-main',{timeout:30000});await page.waitForLoadState('load').catch(()=>{});
 if(live)await page.waitForFunction(()=>{const b=document.getElementById('enter');return b&&!b.disabled&&!b.classList.contains('loading');},null,{timeout:240000});
 else{await context.clock.runFor(3200);await context.clock.pauseAt(new Date('2026-11-10T03:00:10Z'));}
 return {context,page};
};
let failures=0,readings=0;
try{
 if(!dead){
  const now=await serve(false),then=await serve(true);
  console.log(`title styles: the working tree against ${rev} (${changed.size} changed file${changed.size===1?'':'s'}: ${[...changed].slice(0,8).join(', ')}${changed.size>8?', …':''})`);
  const compare=async(size,reduced,live,states)=>{
   const [a,b]=await Promise.all([open(then,size,reduced,live),open(now,size,reduced,live)]);
   for(const state of states){
    const label=`${size[0]}×${size[1]} ${state}${live?' (the game loaded)':''}`,st=state==='reduced'?'title':state;
    await a.page.evaluate(enter,st);await b.page.evaluate(enter,st);
    const [before,after]=await Promise.all([a.page.evaluate(snapshot),b.page.evaluate(snapshot)]);
    const keys=new Set([...Object.keys(before.boxes),...Object.keys(after.boxes)]);let differences=0;
    for(const key of keys){
     const x=before.boxes[key],y=after.boxes[key];if(x===y)continue;
     if(x===undefined||y===undefined){differences++;if(differences<=12)console.log(`  ${label}: ${key} is only in ${x===undefined?'the working tree':rev}`);continue;}
     const xs=x.split('\u0001'),ys=y.split('\u0001');
     for(let i=0;i<xs.length;i++)if(xs[i]!==ys[i]){differences++;if(differences<=12)console.log(`  ${label}: ${key} { ${before.names[i]}: ${xs[i]} → ${ys[i]} }`);}
    }
    console.log(`${differences?'DIFFERENT':'same     '} ${label}: ${keys.size} boxes${differences?`, ${differences} value${differences===1?'':'s'} moved`:''}`);
    failures+=differences;readings++;
   }
   await a.context.close();await b.context.close();
  };
  for(const size of SIZES)for(const reduced of [false,true])await compare(size,reduced,false,reduced?['reduced']:STATES.filter(s=>s!=='reduced'));
  if(!process.env.PROOF_STILL)for(const size of [ALL_SIZES[0],ALL_SIZES[5]])await compare(size,false,true,['title','guide']);
  now.close();then.close();
 }else{
  // Dead declarations: take each one away in turn, in every state at every size; one that never moves a value is dead.
  const server=await serve(false),alive=new Map(),all=new Map();
  for(const size of SIZES)for(const reduced of [false,true]){
   const {context,page}=await open(server,size,reduced);
   for(const state of reduced?['reduced']:STATES.filter(s=>s!=='reduced')){
    await page.evaluate(enter,reduced?'title':state);
    const result=await page.evaluate(({sheets,only})=>{
     const start=document.getElementById('start'),found=[];
     for(const a of document.getAnimations())try{a.cancel();}catch{}
     // What a declaration can move is the computed style of the boxes its selector matches: those are read with and
     // without it. A custom property is not examined (it can move anything below, wherever var() reads it, and #start
     // holds over a thousand boxes): it is dead when no declaration that is left reads it, which a search shows.
     const read=(boxes,pseudos)=>{let out='';for(const el of boxes)for(const pseudo of pseudos){const s=getComputedStyle(el,pseudo||undefined);for(let i=0;i<s.length;i++)out+=s.getPropertyValue(s[i])+';';out+='|';}return out;};
     const split=text=>{const out=[];let depth=0,quote='',cur='';for(const ch of text){if(quote){cur+=ch;if(ch===quote)quote='';continue;}if(ch==='"'||ch==="'"){quote=ch;cur+=ch;continue;}if(ch==='(')depth++;if(ch===')')depth--;if(ch===';'&&!depth){if(cur.trim())out.push(cur.trim());cur='';continue;}cur+=ch;}if(cur.trim())out.push(cur.trim());return out;};
     const walk=(rules,where,sheet)=>{for(const rule of rules){
      if(rule.cssRules&&!rule.style){walk(rule.cssRules,`${where}${rule.conditionText?`@${rule.constructor.name.replace(/^CSS|Rule$/g,'').toLowerCase()} ${rule.conditionText} `:''}`,sheet);continue;}
      if(!rule.style||!rule.selectorText)continue;
      if(!new RegExp(only).test(rule.selectorText))continue;
      let matched=[];try{matched=[...document.querySelectorAll(rule.selectorText.replace(/::?(before|after|placeholder|marker|selection|first-line|first-letter)/g,''))].filter(el=>el===start||start.contains(el));}catch{}
      const pseudos=['','::before','::after'];
      // Each declaration as it is written (a shorthand whole), taken out of the rule's text and put back: removing a
      // longhand of a shorthand that reads var() cannot be undone through the style object.
      const saved=rule.style.cssText,written=split(saved);
      for(let i=0;i<written.length;i++){
       const prop=written[i].slice(0,written[i].indexOf(':')).trim();if(prop.startsWith('--'))continue;
       const before=read(matched,pseudos);rule.style.cssText=written.filter((_,j)=>j!==i).join(';');
       const moved=read(matched,pseudos)!==before;rule.style.cssText=saved;
       found.push([`${sheet} ${where}${rule.selectorText} { ${prop} }`,moved]);
      }
      if(rule.cssRules?.length)walk(rule.cssRules,`${where}${rule.selectorText} `,sheet);
     }};
     for(const sheet of document.styleSheets){const file=(sheet.href||'').split('/').pop().split('?')[0];if(sheets.includes(file))walk(sheet.cssRules,'',file);}
     return found;
    },{sheets,only:ONLY});
    for(const [key,moved] of result){all.set(key,(all.get(key)||0)+1);if(moved)alive.set(key,(alive.get(key)||0)+1);}
    console.error(`read ${size[0]}×${size[1]} ${state}: ${result.length} declarations, ${result.filter(r=>r[1]).length} decide something`);
   }
   await context.close();
  }
  for(const key of all.keys())if(!alive.has(key))console.log(key);
  console.error(`${all.size-alive.size} of ${all.size} declarations decide nothing in any state read (not read: :hover, :focus, :active)`);
  server.close();
 }
}finally{await browser.close();}
if(failures){console.error(`${failures} computed value${failures===1?'':'s'} differ from ${rev}`);process.exit(1);}
if(!dead)console.log(`the title screen computes the same styles as ${rev}, in ${readings} readings`);
