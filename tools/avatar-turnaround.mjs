// A resident's head from six sides on one sheet (front, three-quarter, side, back three-quarter, back, from above), to
// judge hair, beard and head shape without booting the town: the game's own buildAvatar and its ink pipeline, in a
// cloud session's software Chromium.
//   node tools/avatar-turnaround.mjs [--name Johansson] [--look flat] [--body] [--views front,side] [--set eyes.style=almond;eyes.size=.6] [out.png]
// --expressions smile,laugh,sad (or `all`): the face from the front in each expression instead of the six views.
// --cast: every resident's face on one sheet (three-quarter), in the order of the cast.
// --set tries values on the resident's recipe without editing it (a design pass); --views keeps only those views.
// --body frames the whole figure instead of the head; --feet the legs and feet; --focus h,d a height (a share of the
// head's) from a distance (the same). Default out: output/turnaround-<name>.png
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const NAME=flag('--name')||'Johansson',LOOK=flag('--look')||'none',BODY=args.includes('--body'),FEET=args.includes('--feet')?'.13,1.15':flag('--focus')||'',CAST=args.includes('--cast'),SET=flag('--set')||'',VIEWS=flag('--views')||'',FACES=flag('--expressions')||'';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--name','--look','--set','--views','--expressions','--focus'].includes(args[i-1]))||resolve(root,'output/turnaround-'+NAME.toLowerCase().replace(/\W+/g,'-')+'.png'));
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
 const data=await page.evaluate(async([name,look,body,set,only,faces,feet,cast])=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js'),{buildAvatar}=await import(base+'src/avatars/build.js'),{recipeFor}=await import(base+'src/avatars/cast.js'),{createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  if(cast){
   const names=(await (await fetch(base+'guide/residents.json')).json()).map(r=>r.name),F=300,cols=6;
   const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(F,F);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
   const pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});pipeline.setLook(look);
   const sheet=document.createElement('canvas');sheet.width=F*cols;sheet.height=F*Math.ceil(names.length/cols);const ctx=sheet.getContext('2d'),camera=new T.PerspectiveCamera(28,1,.05,60);
   names.forEach((n,i)=>{const scene=new T.Scene();scene.background=new T.Color('#cfe3ee');const a=buildAvatar(recipeFor(n),{shadows:false});a.root.rotation.y=0;a.paintFace({expression:'neutral',blink:0,talk:0});scene.add(a.root);
    scene.add(new T.HemisphereLight(0xffffff,0xd8cdbd,2.4));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(2,5,4);scene.add(sun);scene.updateMatrixWorld(true);
    const m=a.measure,R=m.Rh,target=new T.Vector3(0,m.headCentre-R*.1,0),d=R*6.6;camera.position.set(Math.sin(.5)*d,target.y+R*.3,Math.cos(.5)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    pipeline.setCamera(camera);pipeline.render(r=>r.render(scene,camera));ctx.drawImage(renderer.domElement,(i%cols)*F,Math.floor(i/cols)*F,F,F);ctx.fillStyle='#253b3d';ctx.font='16px sans-serif';ctx.fillText(n,(i%cols)*F+8,Math.floor(i/cols)*F+20);a.dispose();});
   return sheet.toDataURL('image/png');
  }
  const S=520,renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(S,S);
  const scene=new T.Scene();scene.background=new T.Color('#cfe3ee');
  const recipe=JSON.parse(JSON.stringify(recipeFor(name)));
  for(const pair of set.split(';').filter(Boolean)){const [path,raw]=pair.split('='),keys=path.split('.');let o=recipe;for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=raw==='true'?true:raw==='false'?false:isNaN(+raw)?raw:+raw;}
  const avatar=buildAvatar(recipe,{shadows:false});avatar.root.rotation.y=0;avatar.paintFace({expression:'neutral',blink:0,talk:0});scene.add(avatar.root);
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  scene.add(new T.HemisphereLight(0xffffff,0xd8cdbd,2.4));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(2,5,4);scene.add(sun);
  scene.updateMatrixWorld(true);
  const m=avatar.measure,headY=m.headCentre??1.2,R=m.Rh??.2,camera=new T.PerspectiveCamera(28,1,.05,60);
  const pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});pipeline.setLook(look);
  if(faces){
   const {EXPRESSION_NAMES}=await import(base+'src/avatars/face.js'),list=faces==='all'?EXPRESSION_NAMES:faces.split(','),cols=Math.min(6,list.length),F=360;
   renderer.setSize(F,F);const sheet=document.createElement('canvas');sheet.width=F*cols;sheet.height=F*Math.ceil(list.length/cols);const ctx=sheet.getContext('2d');
   const target=new T.Vector3(0,headY-R*.12,0),d=R*5.4;camera.position.set(Math.sin(.28)*d,target.y+R*.25,Math.cos(.28)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();pipeline.setCamera(camera);
   list.forEach((e,i)=>{avatar.paintFace({expression:e,blink:0,talk:e==='laugh'||e==='shock'?1:0,look:[0,0]});scene.updateMatrixWorld(true);pipeline.render(r=>r.render(scene,camera));
    ctx.drawImage(renderer.domElement,(i%cols)*F,Math.floor(i/cols)*F,F,F);ctx.fillStyle='#253b3d';ctx.font='17px sans-serif';ctx.fillText(e,(i%cols)*F+10,Math.floor(i/cols)*F+24);});
   return sheet.toDataURL('image/png');
  }
  const all=[['front',0,0],['three-quarter',.7,.05],['side',Math.PI/2,0],['back three-quarter',2.4,.05],['back',Math.PI,0],['above',.5,.9]];
  const views=only?all.filter(v=>only.split(',').includes(v[0])):all,cols=Math.min(3,views.length);
  const sheet=document.createElement('canvas');sheet.width=S*cols;sheet.height=S*Math.ceil(views.length/cols);const ctx=sheet.getContext('2d');
  views.forEach(([label,yaw,pitch],i)=>{
   const [fy,fd]=feet?feet.split(',').map(Number):[];
   const target=feet?new T.Vector3(0,headY*fy,0):body?new T.Vector3(0,headY*.55,0):new T.Vector3(0,headY,0),d=feet?headY*fd:body?headY*3.4:R*7.2;
   camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   pipeline.setCamera(camera);pipeline.render(r=>r.render(scene,camera));
   ctx.drawImage(renderer.domElement,(i%cols)*S,Math.floor(i/cols)*S,S,S);ctx.fillStyle='#253b3d';ctx.font='18px sans-serif';ctx.fillText(label,(i%cols)*S+12,Math.floor(i/cols)*S+26);});
  return sheet.toDataURL('image/png');
 },[NAME,LOOK,BODY,SET,VIEWS,FACES,FEET,CAST]);
 await writeFile(out,Buffer.from(data.split(',')[1],'base64'));console.log('wrote',out);
}catch(e){errors.push(String(e?.stack||e));}
finally{await browser.close();server.close();}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
