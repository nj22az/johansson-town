// Measures what the published page fetches before the Enter button and before the town runs (docs/LOADING.md):
//   node tools/measure-load.mjs [site root]
// Bytes per file from the first request; the timings are the headless browser's, not a phone's.
import {chromium} from '/opt/node-tools/node_modules/playwright/index.mjs';
import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';
const site=process.argv[2]||new URL('../..',import.meta.url).pathname.replace(/\/$/,'');const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const body=await readFile(resolve(site,'.'+(path.endsWith('/')?path+'index.html':path)));const fp=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));res.writeHead(200,{'content-type':TYPES[extname(fp)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:430,height:900},serviceWorkers:'block'});const page=await context.newPage();page.setDefaultTimeout(300000);
const bytes={};page.on('response',async r=>{try{const b=await r.body();const u=new URL(r.url()).pathname;bytes[u]=b.length;}catch{}});
const t0=Date.now();await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/`,{waitUntil:'commit',timeout:120000});
await page.waitForSelector('#enter:not([disabled])',{timeout:300000});const tEnter=Date.now()-t0;
const jsBefore=Object.entries(bytes).filter(([u])=>u.endsWith('.js')).reduce((s,[,b])=>s+b,0);
await page.locator('#enter').click();await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__,null,{timeout:300000});const tRun=Date.now()-t0;
const total=Object.values(bytes).reduce((s,b)=>s+b,0);const js=Object.entries(bytes).filter(([u])=>u.endsWith('.js'));
console.log("NONRUNTIME",Object.entries(bytes).filter(([u])=>u.endsWith(".js")&&!u.includes("/runtime/")).map(([u,b])=>u.replace("/johansson-town/","")+" "+Math.round(b/1024)+"K").join(", "));console.log("ASSETS",Object.entries(bytes).filter(([u])=>!u.endsWith(".js")).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([u,b])=>u.split("/").slice(-2).join("/")+" "+Math.round(b/1024)+"K").join(", "));console.log(JSON.stringify({enterReadyMs:tEnter,runningMs:tRun,jsBeforeEnterKB:Math.round(jsBefore/1024),totalKB:Math.round(total/1024),files:Object.keys(bytes).length,bigJs:js.sort((a,b)=>b[1]-a[1]).slice(0,8).map(([u,b])=>u.split('/').pop()+' '+Math.round(b/1024)+'K')}));
await browser.close();server.close();
