/** The resident bible's photo shoot: each article's photos rendered through the game's own photo
 * studio pieces (src/photo/sets.js set and film, studio.js poseStudioActor, the live avatars).
 * node tools/render-resident-shoot.mjs [Name …]   (Playwright and Chromium are authoring tools only)
 */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
const root=resolve(new URL('..',import.meta.url).pathname),require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright');}catch(error){playwright=require('/opt/node22/lib/node_modules/playwright');}
const only=new Set(process.argv.slice(2));
const catalogue=JSON.parse(await readFile(resolve(root,'guide/residents.json'),'utf8')).filter(r=>!only.size||only.has(r.name));
const server=createServer(async(req,res)=>{
 try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}
 catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await playwright.chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||(require('node:fs').existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:900,height:1200}});
 page.on('pageerror',e=>console.warn('page:',e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/guide/residents.json');
 let count=0;
 for(const resident of catalogue){
  const shots=await page.evaluate(async resident=>{
   const THREE=await import('/vendor/three.module.js');
   const {buildAvatar}=await import('/src/avatars/build.js');
   const {recipeFor}=await import('/src/avatars/cast.js');
   const {poseStudioActor}=await import('/src/photo/studio.js');
   const {createStudioSet,applyFilm}=await import('/src/photo/sets.js');
   const W=900,H=1200,canvas=document.createElement('canvas');
   const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.shadowMap.enabled=true;
   const out=[];
   for(const photo of resident.article.photos){
    const set=createStudioSet();set.set(photo.backdrop);const stage=new THREE.Group();set.scene.add(stage);set.place(stage);
    const names=[resident.name,...(photo.with?[photo.with]:[])],actors=[];
    names.forEach((name,i)=>{
     const avatar=buildAvatar(recipeFor(name),{shadows:true,faceSize:512}),holder=new THREE.Group();holder.add(avatar.root);avatar.root.rotation.y=0;stage.add(holder);
     // The holder places them; posing moves the avatar's own root.
     const x=names.length>1?(i?.46:-.46):0;holder.position.set(x,0,0);holder.rotation.y=names.length>1?(i?-.3:.3):0;
     const actor={avatar,pose:i?'Idle':photo.pose,expression:i?'smile':photo.expression};poseStudioActor(actor);actors.push(actor);
    });
    const h=Math.max(...actors.map(a=>a.avatar.height)),camera=new THREE.PerspectiveCamera(30,W/H,.05,60);
    const aim=h*.5;let dist=names.length>1?h*2.55:h*2.05,cx=0;
    if(names.length>1){set.scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(stage),size=bounds.getSize(new THREE.Vector3());cx=bounds.getCenter(new THREE.Vector3()).x;dist=Math.max(dist,size.x/(2*Math.tan(Math.PI/12)*(W/H))*1.12);}
    camera.position.set(cx+.15,aim+h*.12,dist);camera.lookAt(cx,aim,0);
    set.scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());renderer.render(set.scene,camera);
    const flat=document.createElement('canvas');flat.width=W;flat.height=H;const ctx=flat.getContext('2d');ctx.drawImage(canvas,0,0);
    if(photo.film&&photo.film!=='none'){const px=ctx.getImageData(0,0,W,H);applyFilm(px.data,photo.film);ctx.putImageData(px,0,0);}
    out.push({path:photo.file,data:flat.toDataURL('image/webp',.86).split(',')[1]});
    actors.forEach(a=>{a.avatar.root.parent?.removeFromParent();a.avatar.dispose();});set.dispose();renderer.renderLists.dispose();
   }
   renderer.dispose();renderer.forceContextLoss();return out;
  },resident);
  for(const s of shots){await mkdir(resolve(root,s.path,'..'),{recursive:true});await writeFile(resolve(root,s.path),Buffer.from(s.data,'base64'));count++;}
  console.log(resident.name,'·',shots.length,'photos');
 }
 console.log('Rendered',count,'photo-shoot pictures.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
