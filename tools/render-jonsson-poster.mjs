// Renders the Jonsson exhibition poster for Chin's wall in the dock workshop (src/workshop/chin-wall.js JONSSON_POSTER)
// from the figure itself (assets/models/owned/Jonsson.glb, its "Work" pose), and writes
// assets/graphics/workshop/jonsson-poster.webp.
//   node tools/render-jonsson-poster.mjs
// TOWN_CHROMIUM_PATH picks the browser (for example /opt/pw-browsers/chromium); swiftshader is enough.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JONSSON_POSTER} from '../src/workshop/chin-wall.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{if(req.url==='/blank.html'){res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><meta charset="utf-8"><title>poster</title>');return;}try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=resolve(root,'.'+(path));if(!file.startsWith(root))throw Error('outside');
 const body=await readFile(file);res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();page.on('pageerror',e=>console.warn('Page error:',e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/blank.html`);
const data=await page.evaluate(async P=>{
 const THREE=await import('/vendor/three.module.js'),{GLTFLoader}=await import('/vendor/GLTFLoader.js');
 const W=1024,H=1448,photo=document.createElement('canvas');photo.width=840;photo.height=900;
 const renderer=new THREE.WebGLRenderer({canvas:photo,antialias:true,preserveDrawingBuffer:true});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene();scene.background=new THREE.Color(P.ink);
 const g=await new GLTFLoader().loadAsync('/assets/models/owned/Jonsson.glb'),model=g.scene;scene.add(model);
 // The sculpture as photographed for the fair: its working pose, held at one moment, under a key light and a rim light.
 const clip=g.animations.find(a=>a.name==='Work');if(clip){const mixer=new THREE.AnimationMixer(model);mixer.clipAction(clip).play();mixer.setTime(clip.duration*.35);}
 model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
 const camera=new THREE.PerspectiveCamera(30,photo.width/photo.height,.01,100),dist=Math.max(size.x,size.y,size.z)*2.2;
 camera.position.set(centre.x+dist*.55,centre.y+size.y*.25,centre.z+dist*.85);camera.lookAt(centre);
 scene.add(new THREE.HemisphereLight(0xfff1dc,0x30383a,1.1));const key=new THREE.DirectionalLight(0xffe2b8,2.6);key.position.set(centre.x+3,centre.y+4,centre.z+3);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9fd2e0,1.8);rim.position.set(centre.x-3,centre.y+2,centre.z-3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(Math.max(size.x,size.z)*1.4,48),new THREE.MeshStandardMaterial({color:0x2a3436,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=box.min.y;scene.add(floor);
 renderer.render(scene,camera);
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 x.fillStyle=P.paper;x.fillRect(0,0,W,H);x.drawImage(photo,92,92);
 x.fillStyle=P.accent;x.fillRect(92,1010,840,10);
 x.textAlign='center';x.fillStyle=P.ink;x.font='bold 168px Georgia,serif';x.fillText(P.title,W/2,1180,840);
 x.font='italic 56px Georgia,serif';x.fillText(P.sub,W/2,1252,840);
 x.fillStyle=P.accent;x.font='bold 52px "Noto Sans CJK JP","Noto Sans JP",sans-serif';x.fillText(P.jp,W/2,1326,840);
 x.fillStyle=P.ink;x.font='32px sans-serif';x.fillText(P.by+' · '+P.dates,W/2,1388,880);
 return c.toDataURL('image/webp',.86);
},JONSSON_POSTER);
const out=resolve(root,'assets/graphics/workshop');await mkdir(out,{recursive:true});
await writeFile(resolve(out,JONSSON_POSTER.file),Buffer.from(data.split(',')[1],'base64'));
console.log('wrote',resolve(out,JONSSON_POSTER.file));
await browser.close();server.close();
