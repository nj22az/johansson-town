// Real-game photographs of Sakura for its surface audit (no faces fighting: drawing SK-ZF rev A). Run after build:runtime.
// Each view is shot twice, the camera 4 mm apart: a face that flickers between two layers changes between the two frames
// in a speckled band, and the band is measured. Usage: node tools/sakura-surface-review.mjs [--tag before|after] [out-dir]
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),tagAt=args.indexOf('--tag'),tag=tagAt>=0?args[tagAt+1]:'after';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&(tagAt<0||i!==tagAt+1))||resolve(root,'output/sakura-surface-review'));
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
const report={tag,physicalDevice:false,views:[],errors:[]};
// Shop views: the floor at a low, grazing angle (where layers of a floor fight first), the aisles, the shelves close, the till.
const SHOP=[['floor-till',[1.2,.55,2.9],[4.6,0,-1.5]],['floor-aisle',[-5.6,.45,3.1],[-1,0,-3.5]],['aisles',[0.3,1.62,3.2],[0.3,1.1,-3.9]],
 ['shelves-west',[-2.8,1.3,2.2],[-4.4,.8,-.6]],['shelves-east',[0,1.3,2.4],[1.6,.8,-.5]],['chiller',[-4.8,1.5,2.6],[-6.8,1,-.5]],
 ['cooler',[0,1.5,-1.2],[1.5,1.1,-3.9]],['till',[2.4,1.6,1.6],[5.6,1,-1.4]],['back-room',[0.4,1.5,-4.2],[0.6,.5,-6.6]],
 // The stockroom and the stair's foot (SK-ZF-004/005).
 ['stockroom-crates',[1.6,1.3,-5.2],[.65,.35,-6.5]],['stockroom-rack',[.4,1.4,-5.9],[.4,1.1,-4.5]],['stockroom-east',[1.5,1.6,-5.0],[5.0,.6,-5.9]],
 ['stockroom-daisha',[.3,1.5,-5.4],[-1.1,.6,-6.1]],['stair-foot',[.2,1.55,-4.6],[-2.6,1.2,-4.6]],['stair-foot-up',[-.9,1.1,-4.9],[-3.2,3.0,-5.0]]];
const OFFICE=[['office',null,null]];
const diffBand=(a,b)=>{const A=PNG.sync.read(a),B=PNG.sync.read(b);let n=0;for(let i=0;i<A.data.length;i+=4){const d=Math.abs(A.data[i]-B.data[i])+Math.abs(A.data[i+1]-B.data[i+1])+Math.abs(A.data[i+2]-B.data[i+2]);if(d>90)n++;}return n/(A.width*A.height);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(300000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(a.player.room)await a.leave();if(a.seated)a.interact();a.setTime(10002*1440+12*60+20);a.teleport(5.5,-31.25,0,0);a.step(60);});
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('market');a.teleport(5.6,3.3,Math.PI);a.step(60);});
 const shoot=async(name,pos,at)=>{
  const shots=[];
  for(const dx of [0,.004]){
   await page.evaluate(([pos,at])=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},[[pos[0]+dx,pos[1],pos[2]],at]);
   shots.push(await page.locator('#game').screenshot());
  }
  await writeFile(resolve(out,`${tag}-${name}.png`),shots[0]);
  const changed=diffBand(shots[0],shots[1]);report.views.push({name,pos,at,changedFraction:+changed.toFixed(5)});console.log(name,changed.toFixed(5));
 };
 for(const [name,pos,at] of SHOP)await shoot(name,pos,at);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.leave();await a.enterInside('sakura-office');a.step(30);});
 // Upstairs the game's own camera, which follows the player round the office, the hall and the rest room.
 await shoot('office-hall',[-1.2,1.6,-1.5],[-1.2,1.0,-5.5]);
 // The stair head from the hall, down into the stairwell; the stores and the futon cupboard (office frame).
 await shoot('stair-head',[-1.0,1.7,-4.2],[-2.6,-.6,-5.6]);await shoot('stair-head-well',[-2.3,1.8,-4.4],[-4.5,0,-5.6]);
 await shoot('upper-store',[-2.4,1.6,-1.0],[-5.0,1.0,1.0]);await shoot('futon-cupboard',[-1.0,1.5,3.2],[-2.6,1.0,3.5]);
}finally{
 await writeFile(resolve(out,`${tag}-report.json`),JSON.stringify(report,null,2)+'\n');
 await browser.close();server.close();
}
