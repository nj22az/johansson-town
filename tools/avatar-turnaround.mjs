// A resident's head from six sides on one sheet (front, three-quarter, side, back three-quarter, back, from above), to
// judge hair, beard and head shape without booting the town: the game's own buildAvatar and its ink pipeline, in a
// cloud session's software Chromium.
//   node tools/avatar-turnaround.mjs [--name Johansson] [--look flat] [--body] [out.png]
// --body frames the whole figure instead of the head. Default out: output/turnaround-<name>.png
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const NAME=flag('--name')||'Johansson',LOOK=flag('--look')||'none',BODY=args.includes('--body');
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--name','--look'].includes(args[i-1]))||resolve(root,'output/turnaround-'+NAME.toLowerCase().replace(/\W+/g,'-')+'.png'));
await mkdir(dirname(out),{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+path);if(!file.startsWith(site))throw Error('outside');
 if(path==='/blank')return res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>turnaround</title>');
 const body=await readFile(file);res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
let errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/blank`);
 const data=await page.evaluate(async([name,look,body])=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js'),{buildAvatar}=await import(base+'src/avatars/build.js'),{recipeFor}=await import(base+'src/avatars/cast.js'),{createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const S=520,renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(S,S);
  const scene=new T.Scene();scene.background=new T.Color('#cfe3ee');
  const avatar=buildAvatar(recipeFor(name),{shadows:false});avatar.root.rotation.y=0;avatar.paintFace({expression:'neutral',blink:0,talk:0});scene.add(avatar.root);
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  scene.add(new T.HemisphereLight(0xffffff,0xd8cdbd,2.4));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(2,5,4);scene.add(sun);
  scene.updateMatrixWorld(true);
  const m=avatar.measure,headY=m.headCentre??1.2,R=m.Rh??.2,camera=new T.PerspectiveCamera(28,1,.05,60);
  const pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});pipeline.setLook(look);
  const sheet=document.createElement('canvas');sheet.width=S*3;sheet.height=S*2;const ctx=sheet.getContext('2d');
  const views=[['front',0,0],['three-quarter',.7,.05],['side',Math.PI/2,0],['back three-quarter',2.4,.05],['back',Math.PI,0],['above',.5,.9]];
  views.forEach(([label,yaw,pitch],i)=>{
   const target=body?new T.Vector3(0,headY*.55,0):new T.Vector3(0,headY,0),d=body?headY*3.4:R*7.2;
   camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   pipeline.setCamera(camera);pipeline.render(r=>r.render(scene,camera));
   ctx.drawImage(renderer.domElement,(i%3)*S,Math.floor(i/3)*S,S,S);ctx.fillStyle='#253b3d';ctx.font='18px sans-serif';ctx.fillText(label,(i%3)*S+12,Math.floor(i/3)*S+26);});
  return sheet.toDataURL('image/png');
 },[NAME,LOOK,BODY]);
 await writeFile(out,Buffer.from(data.split(',')[1],'base64'));console.log('wrote',out);
}catch(e){errors.push(String(e?.stack||e));}
finally{await browser.close();server.close();}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
