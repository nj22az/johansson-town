/** Browser verification of the real install/update worker, using an isolated local server. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=resolve(new URL('..',import.meta.url).pathname),require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright');}catch{playwright=require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));}
let revision=1;
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!path.startsWith('/johansson-town/')){res.writeHead(404).end();return;}path=path.slice('/johansson-town/'.length)||'index.html';const file=resolve(root,path);if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}let data=await readFile(file);if(path==='sw.js'&&revision>1)data=Buffer.from(data.toString().replace(/const VERSION = '[^']*';/,"const VERSION = 'browser-update-check';"));res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.css':'text/css','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await playwright.chromium.launch({headless:true});const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const url='http://127.0.0.1:'+server.address().port+'/johansson-town/';
 await page.goto(url);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await page.reload();
 await page.evaluate(async()=>{localStorage.setItem('release-progress-sentinel','saved');for(const path of ['./manifest.webmanifest','./assets/food/island-icecream.png','./assets/icons/town-192.png','./assets/icons/town-512.png']){const r=await fetch(path);if(!r.ok)throw Error(path+' '+r.status);await r.arrayBuffer();}});
 await page.waitForFunction(async()=>!!await caches.match(new URL('./assets/food/island-icecream.png',location.href).href));
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('#start').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('release-progress-sentinel')),'saved');
 const offlineFood=await page.evaluate(async()=>{const r=await fetch('./assets/food/island-icecream.png');return {ok:r.ok,status:r.status,bytes:(await r.arrayBuffer()).byteLength,controller:!!navigator.serviceWorker.controller,keys:await caches.keys(),url:location.href,cached:!!await caches.match(new URL('./assets/food/island-icecream.png',location.href).href)};});assert.ok(offlineFood.ok&&offlineFood.bytes>10000);
 await context.setOffline(false);revision=2;await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});await page.waitForSelector('#townUpdate',{timeout:30000});
 await page.locator('#townUpdate').click();await page.waitForLoadState('domcontentloaded');assert.equal(await page.evaluate(()=>localStorage.getItem('release-progress-sentinel')),'saved');assert.deepEqual(errors,[]);
 console.log('Home Screen manifest, cached landing/food offline, automatic update prompt, reopen and saved storage passed.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
