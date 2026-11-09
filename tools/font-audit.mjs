// Which typefaces really draw the island's words, asked of the browser itself (the platform fonts of each element,
// glyph by glyph), on the title screen at a phone's size.
//   node tools/font-audit.mjs [out-dir]
// The rule (line-ui.css): LINE Seed JP draws every interface word; Figtree draws ā ē ī ō ū and their capitals, and
// nothing else. Until 9 November 2026 Google's `text=` subset of Figtree also declared the plain vowels, so the title
// read JoHaNSSoN WoRLD: six letters of LINE Seed JP ExtraBold and three of Figtree, in one word. A stylesheet cannot
// show that; only the drawn glyphs can. The check fails when a word mixes faces, when a plain vowel is Figtree's, or
// when a long vowel is not.
// Needs the fonts' hosts (fonts.googleapis.com, fonts.gstatic.com): without them LINE Seed JP never loads and the
// check says so instead of passing on a system font.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..'),name=root.slice(site.length+1);
const out=resolve(process.argv[2]||resolve(root,'output/font-audit'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const report={viewport:[390,664],physicalDevice:false,elements:{},failures:[]};
try{
 const context=await browser.newContext({viewport:{width:390,height:664},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}/${name}/`);
 await page.waitForSelector('#titleLogo .logo-main',{timeout:30000});
 // The long vowels, in the interface's own list and weight, beside the title's words.
 const LONG='āēīōūĀĒĪŌŪ',PROBE='Sakura Shōten, Kōji, Ōshiro, Kitano-jima';
 await page.evaluate(([long,probe])=>{
  const add=(id,text,weight)=>{const p=document.createElement('p');p.id=id;p.textContent=text;p.style.cssText=`position:fixed;left:0;top:0;opacity:.01;pointer-events:none;font-weight:${weight}`;document.body.append(p);};
  add('fontAuditLong',long,700);add('fontAuditProbe',probe,400);
 },[LONG,PROBE]);
 await page.evaluate(async()=>{await Promise.all(['400','700','800'].map(w=>document.fonts.load(`${w} 20px Figtree,"LINE Seed JP"`,'JOHANSSON WORLD āēīōūĀĒĪŌŪ Aa')));await document.fonts.ready;});
 await page.waitForTimeout(600);
 const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root:doc}=await cdp.send('DOM.getDocument');
 const drawn=async selector=>{const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector});if(!nodeId)return null;
  const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});return fonts.map(f=>({family:f.familyName,web:f.isCustomFont,glyphs:f.glyphCount}));};
 const text=selector=>page.evaluate(s=>document.querySelector(s)?.textContent.trim()??null,selector);
 const longIn=s=>[...s].filter(c=>LONG.includes(c)).length;
 const fail=message=>report.failures.push(message);
 for(const [key,selector] of Object.entries({wordmark:'#titleLogo .logo-main',world:'#titleLogo .logo-town',tag:'.title-tag',stamp:'.title-wip',player:'#titlePlayerName',load:'#titleLoad',long:'#fontAuditLong',probe:'#fontAuditProbe'})){
  const words=await text(selector),faces=await drawn(selector);
  if(!faces||words===null){fail(`${key}: ${selector} is not on the title screen`);continue;}
  report.elements[key]={text:words,faces};
  const figtree=faces.filter(f=>/^Figtree/.test(f.family)).reduce((n,f)=>n+f.glyphs,0),seed=faces.filter(f=>/^LINE Seed JP/.test(f.family));
  const other=faces.filter(f=>!/^Figtree|^LINE Seed JP/.test(f.family));
  if(other.length)fail(`${key}: drawn in part by ${other.map(f=>f.family).join(', ')} (LINE Seed JP did not load, or a letter is missing from it)`);
  if(figtree!==longIn(words))fail(`${key}: "${words}" has ${longIn(words)} long vowel${longIn(words)===1?'':'s'} and ${figtree} glyph${figtree===1?'':'s'} from Figtree`);
  if(key!=='long'&&!seed.length)fail(`${key}: no glyph from LINE Seed JP`);
  if(key==='long'&&seed.length)fail(`long: a long vowel is LINE Seed JP's, with its bar beside the letter`);
 }
 const logo=await page.locator('#titleLogo').boundingBox();
 if(logo)await page.screenshot({path:resolve(out,'title-wordmark.png'),clip:{x:Math.max(0,logo.x-20),y:Math.max(0,logo.y-12),width:Math.min(390,logo.width+40),height:logo.height+24}});
 await page.screenshot({path:resolve(out,'title-phone.png')});
}catch(error){report.failures.push(String(error.message||error).split('\n')[0]);}
finally{await browser.close();server.close();}
report.passed=report.failures.length===0;
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1)+'\n');
for(const [key,e] of Object.entries(report.elements))console.log(key.padEnd(9),JSON.stringify(e.text).slice(0,44).padEnd(46),e.faces.map(f=>`${f.family} ×${f.glyphs}`).join(' + '));
for(const f of report.failures)console.log('FAIL',f);
console.log(report.passed?'font audit: one face a word, Figtree for the long vowels only':'font audit failed');
process.exit(report.passed?0:1);
