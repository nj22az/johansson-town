// Actual built-game review of the ferry office frontage, at matching cameras before and after.
// TOWN_CHROMIUM_PATH=/path/to/chrome node tools/ferry-office-frontage-photos.mjs <output> [--before]
// --before serves the reviewed base's entry page and its retained published runtime chunks.
// TOWN_FRONTAGE_BEFORE_REF may override the original review base while those chunks remain available.
// Run alone: the whole game uses software WebGL on cloud hosts.
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),before=args.includes('--before');
const baselineRef=before?(process.env.TOWN_FRONTAGE_BEFORE_REF||'7356f64ad017afa2e38e41403ecbcd3fd83b1e09'):null;
const baselineIndex=before?execFileSync('git',['show',`${baselineRef}:johansson-town/index.html`],{cwd:site}):null;
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/ferry-office-frontage'));await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
 if(!file.startsWith(site+'/'))throw Error('outside');
 const body=baselineIndex&&file===resolve(root,'index.html')?baselineIndex:await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),report={before,baselineRef,builtRuntime:true,physicalDevice:false,errors:[],screenshots:[]};
const log=message=>console.log(((Date.now()-t0)/1000).toFixed(1)+'s '+message);
try{
 const context=await browser.newContext({viewport:{width:1008,height:1536},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(240000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit&spawn=sakura-bench&cinematic=off`);log('Page loaded');
 await page.locator('#enter:not([disabled])').waitFor();log('Island ready');await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);log('Playing');
 report.opening=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {player:a.player,seated:a.seated,stability:window.__JOHANSSON_STABILITY__};});
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.renderFrozen=false;a.teleport(3.5,-29,1.9);a.setTime(294*1440+720);});
 if(before)await page.waitForFunction(()=>window.__JOHANSSON_STREAMING__?.loaded.includes('sakura-bench'));
 await page.waitForFunction(()=>!window.__JOHANSSON_STREAMING__?.active);log('Frontage details ready');
 const cleanView=await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 report.frontage=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,labels=[];a.scene.traverse(o=>{if(o.userData.hit)labels.push(o.userData.hit.label);});
  return {bench:!!a.scene.getObjectByName('sakura-viewing-bench'),seat:!!a.scene.getObjectByName('sakura-bench-seat'),flyer:!!a.scene.getObjectByName('Sakura flyer on harbour notice board'),sitPrompt:labels.includes('Sit and look at Sakura'),boardPrompt:labels.some(l=>l.includes('harbour notice board'))};
 });
 const shot=async(name,viewport,camera)=>{
  await page.setViewportSize(viewport);
  await page.waitForTimeout(200);
  await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.renderFrozen=true;a.render();},camera);
  await page.waitForTimeout(300);
  const picture=await page.locator('#game').screenshot({path:resolve(out,name+'.png')}),pixels=PNG.sync.read(picture).data,colours=new Set();
  for(let i=0;i<pixels.length&&colours.size<32;i+=128)colours.add(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]);
  if(colours.size<32)throw Error('Blank screenshot after viewport resize: '+name);
  await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.renderFrozen=false;});
  report.screenshots.push({name,viewport,camera});log('Photographed '+name);
 };
 await shot('frontage-portrait',{width:1008,height:1536},{pos:[1.8,3.2,-26.2],at:[10.7,2.4,-38]});
 await shot('frontage-desktop',{width:1440,height:900},{pos:[2.8,3.4,-27],at:[10.7,2.25,-37.8]});
 await shot('door-phone',{width:390,height:844},{pos:[11.1,2.2,-32.5],at:[13.3,2,-38.4]});
 if(['bench','seat','sitPrompt'].some(key=>report.frontage[key]!==before))throw Error('Bench removal state does not match the requested before/after capture');
 if(!report.frontage.flyer||!report.frontage.boardPrompt)throw Error('The retained harbour notice board or flyer is missing');
 if(!report.opening.stability?.ok)throw Error('Built-game stability check failed');
 if(!before&&report.opening.seated)throw Error('Legacy bench opening is still seated');
 if(!before){
  await cleanView.evaluate(element=>element.remove());
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.activities.close();a.camera=null;a.teleport(5.5,-31.25,0,0);a.step(100);a.interact();});
  await page.getByRole('button',{name:'Look',exact:true}).waitFor();
  await page.getByRole('button',{name:'Look',exact:true}).click();
  await page.locator('#activity iframe[aria-busy="false"]').waitFor();
  await page.frameLocator('#activity iframe').locator('canvas').waitFor();
  report.viewer={opened:await page.locator('#activity iframe').count()===1};
  if(!report.viewer.opened)throw Error('Look did not open the retained woodland viewer');
  await page.locator('#closeActivity').click();
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.activities.paused);
  report.viewer.returned=await page.locator('#activity iframe').count()===0;
  if(!report.viewer.returned)throw Error('Woodland viewer did not return to the game');
  log('Retained woodland poster opens and returns to World');
 }
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
if(report.errors.length)throw Error(report.errors.join('\n'));
