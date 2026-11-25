// The whole cast on one sheet (full body and face), built by the game's own avatar code: node tools/cast-sheet.mjs out.png
// (cast-variants: seven residents in the creator's proportions and a bigger-eyed trial, for judging a restyle.)
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
const server=createServer(async(q,r)=>{let body;try{const f=resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://x').pathname));body=await readFile(f);r.writeHead(200,{'content-type':T[extname(f)]||'application/octet-stream'});}catch{if(!r.headersSent)r.writeHead(404);}r.end(body);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
try{const p=await b.newPage({viewport:{width:1820,height:1000}});p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(/FAIL/.test(m.text()))console.log(m.text());});
 await p.goto(`http://127.0.0.1:${server.address().port}/tools/cast-joints.html?pixar=0${process.argv[3]?'&only='+encodeURIComponent(process.argv[3]):''}`);await p.waitForFunction(()=>window.__SHEET__?.done,null,{timeout:300000});
 const info=await p.evaluate(()=>window.__SHEET__);console.log(JSON.stringify(info));
 await p.locator('canvas').screenshot({path:process.argv[2]});
}finally{await b.close();server.close();}
