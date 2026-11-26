// A resident as the game's generator builds them, exported as a GLB (src/avatars/export.js: T-pose, the painted neutral
// face baked, hair, beard and clothes), for a review in Blender (tools/blender/build-johansson-head.py --sheet).
//   node tools/export-avatar-glb.mjs [--name Johansson] out.glb
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),i=args.indexOf('--name'),NAME=i>=0?args[i+1]:'Johansson';
const out=resolve(args.find((a,k)=>!a.startsWith('--')&&args[k-1]!=='--name')||resolve(root,'output/'+NAME.toLowerCase()+'.glb'));await mkdir(dirname(out),{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 if(path==='/blank')return res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>export</title>');
 const file=resolve(site,'.'+path);if(!file.startsWith(site))throw Error('outside');const body=await readFile(file);
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
let failed=null;
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/blank`);
 const b64=await page.evaluate(async name=>{
  const base='/johansson-town/',{exportAvatarGLB}=await import(base+'src/avatars/export.js'),{recipeFor}=await import(base+'src/avatars/cast.js');
  const bytes=new Uint8Array(await exportAvatarGLB(recipeFor(name),{faceSize:512}));let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);
 },NAME);
 if(errors.length)throw new Error(errors.join('\n'));
 await writeFile(out,Buffer.from(b64,'base64'));console.log('wrote',out);
}catch(e){failed=e;}
finally{await browser.close();server.close();}
if(failed){console.error(failed);process.exit(1);}
