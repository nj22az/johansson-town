/* Build stamps this identifier; saved games remain in localStorage. */
const VERSION = '679ec43c86ed554d1ff9';
const PREFIX='johansson-town-';
const CACHE=PREFIX+VERSION;
const SCOPE=new URL('./',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.allSettled(['./','./manifest.webmanifest','./assets/icons/town-192.png','./assets/icons/town-512.png'].map(path=>c.add(new Request(new URL(path,SCOPE),{cache:'reload'}))));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=(await caches.keys()).filter(n=>n.startsWith(PREFIX));const keep=new Set([CACHE,...names.filter(n=>n!==CACHE).slice(-1)]);await Promise.all(names.filter(n=>!keep.has(n)).map(n=>caches.delete(n)));await self.clients.claim();})()));
async function remember(request,response){if(!response.ok||response.type==='opaque')return;try{const copy=response.clone();const cache=await caches.open(CACHE);await cache.put(request,copy);const keys=await cache.keys();if(keys.length>512){const removable=keys.find(key=>{const path=new URL(key.url).pathname;return key.url!==new URL('./',SCOPE).href&&!/\/manifest\.webmanifest$|\/assets\/(icons|food)\//.test(path);});if(removable)await cache.delete(removable);}}catch{/* A full device cache must never stop play. */}}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(SCOPE)||req.headers.has('range'))return;
 const immutable=/\/runtime\/[^/]+-[a-zA-Z0-9_-]+\.js$/.test(url.pathname);
 event.respondWith((async()=>{
  if(immutable){const hit=await caches.match(req);if(hit)return hit;}
  try{const response=await fetch(req,{cache:req.mode==='navigate'?'no-store':immutable?'default':'no-cache'});if(response.ok){event.waitUntil(remember(req,response));return response;}const hit=await caches.match(req);return hit||response;}
  catch{const hit=await caches.match(req);if(hit)return hit;if(req.mode==='navigate'){const home=await caches.match(new URL('./',SCOPE));if(home)return home;}return new Response('This part of the island needs a connection. Reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain'}});}
 })());
});
