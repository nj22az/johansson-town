// Real-game photographs of Sakura's office hall and stairwell walls (drawing SK-ST-003): the trade posters and the drink
// stock outside the office. Run after build:runtime. Usage: node tools/sakura-hall-review.mjs [out-dir]
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const out=resolve(process.argv[2]||resolve(root,'output/sakura-hall-review'));await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
 if(!file.startsWith(site+'/'))throw Error('outside');const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));localStorage.setItem('johansson-town-view','third');});
 const page=await context.newPage();page.setDefaultTimeout(300000);
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(a.player.room)await a.leave();a.setTime(10002*1440+12*60+20);a.teleport(5.5,-31.25,0,0);a.step(60);await a.enter('market');a.step(300);});
 // [name, room, eye, target] in the room's own frame (shop or office).
 const shots=[['stair-foot','market',[-.9,1.6,-4.4],[-4.2,2.6,-4.9]],['stair-landing','market',[-3.0,3.6,-5.4],[-5.6,3.4,-5.4]],['stair-upper','market',[-4.6,3.9,-6.0],[-2.4,4.6,-6.7]],
  ['hall-north','sakura-office',[-.6,1.6,-4.6],[-.6,1.0,1.6]],['hall-stock','sakura-office',[.2,1.55,-1.6],[-1.6,.6,1.0]],['hall-office-door','sakura-office',[-1.4,1.5,-1.2],[.6,.5,.6]],['hall-west','sakura-office',[-.2,1.5,-1.0],[-2.0,1.4,-2.0]]];
 for(const [name,room,eye,at] of shots){
  await page.evaluate(async([room])=>{const a=window.__JOHANSSON_AUDIT__;if(a.player.room!==room){if(room==='sakura-office'){a.teleport(-.6,-4.6,-Math.PI/2);a.step(100);a.stair('up');for(let i=0;i<60&&(a.passage||a.player.room!=='sakura-office');i++){a.step(400);await new Promise(r=>setTimeout(r,80));}}}a.step(800);},[room]);
  await page.evaluate(([eye,at])=>{const a=window.__JOHANSSON_AUDIT__;let G=null;a.scene.traverse(o=>{if(o.name==='Sakura stairwell')G=o;});const M=G.parent.matrixWorld;
   const w=p=>{const e=M.elements,[x,y,z]=p;return [e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];};
   a.camera={pos:w(eye),at:w(at)};a.render();},[eye,at]);
  await page.waitForTimeout(400);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});console.log(name);
 }
}finally{await browser.close();server.close();}
