// Real-game frames of Sakura's stair climb (drawing SK-ST-001): up from the stockroom to the hall and down again, a frame
// every 0.4 s of game time, the game's own camera. Run after build:runtime. Usage: node tools/sakura-climb-review.mjs [out-dir]
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2);
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/sakura-climb-review'));
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gz':'application/gzip','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=createServer(async(req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
  if(!file.startsWith(site+'/'))throw Error('outside');
  const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const report={frames:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(300000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(a.player.room)await a.leave();a.setTime(10002*1440+12*60+20);a.teleport(5.5,-31.25,0,0);a.step(60);});
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('market');a.camera=null;a.teleport(-.6,-4.6,-Math.PI/2);a.step(300);});
 const film=async(dir,count)=>{
  await page.evaluate(d=>{window.__JOHANSSON_AUDIT__.stair(d);},dir);
  for(let i=0;i<count;i++){
   await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(400));await page.waitForTimeout(120);
   const state=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.render();return {passage:a.passage,room:a.player.room||null};});
   const name=`${dir}-${String(i).padStart(2,'0')}`;await page.locator('#game').screenshot({path:resolve(out,name+'.png')});
   report.frames.push({name,...state});console.log(name,JSON.stringify(state));
   if(!state.passage&&i>2)break;
  }
 };
 await film('up',40);
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(800));await page.waitForTimeout(300);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(-1.2,-4.6,0);a.step(300);});
 await film('down',40);
}finally{
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();server.close();
}
