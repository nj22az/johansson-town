#!/usr/bin/env node
/**
 * Pixel baselines for Sakura Shōten's products, drawn by World's own code in headless Chromium: the shelf's label
 * atlas (every cell, with the painted sheets laid in and the flavours painted from them), the cold cabinet as the
 * shop builds it, and the Umineko can picked up (item-viewer.js), front and back. A move of the products into data
 * (stage 2) must leave every one of them pixel-identical.
 *
 *   node johansson-town/tools/studio/baselines.mjs --save before-2a     capture and keep them (output/studio-mcp/baselines/)
 *   node johansson-town/tools/studio/baselines.mjs --compare before-2a  capture again and say which pixels differ
 *
 * Each picture is fingerprinted from its raw pixels (sha256 of the RGBA bytes read back from the canvas), and a small
 * PNG of it is kept beside the fingerprints for a person to look at. The baselines hold only on the machine that took
 * them (fonts and the GPU path differ between machines), so they are kept with the scratch output, not in git.
 */
import {fileURLToPath} from 'node:url';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {serveGame} from '../mcp/static-server.mjs';

const code=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const PAGE='/johansson-town/__studio-baselines__.html';
const out=name=>resolve(code,'output/studio-mcp/baselines',name);

/** Everything a baseline draws, run inside the page: [{name, width, height, sha256, png}]. */
async function draw(){
 const T=await import('./vendor/three.module.js');
 const wait=async(test,ms=60000)=>{const end=performance.now()+ms;while(!test()){if(performance.now()>end)throw Error('Timed out waiting for the pictures to load');await new Promise(r=>setTimeout(r,50));}};
 const settle=()=>new Promise(r=>setTimeout(r,600));
 const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
 const small=(source,width)=>{const c=document.createElement('canvas');c.width=width;c.height=Math.round(source.height*width/source.width);c.getContext('2d').drawImage(source,0,0,c.width,c.height);return c.toDataURL('image/png');};
 const shots=[];
 // 1. The label atlas, once both painted sheets have been laid in (and the flavours painted from them).
 const advertising=await import('./src/world/interiors/store-advertising.js');
 const material=advertising.getLabelMaterial(),atlas=material.map.image;
 await wait(()=>material.map.version>=3);await settle();
 const pixels=atlas.getContext('2d').getImageData(0,0,atlas.width,atlas.height).data;
 shots.push({name:'atlas',width:atlas.width,height:atlas.height,sha256:await sha(pixels),png:small(atlas,512)});
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
 async function shoot(name,scene,camera,width,height){
  renderer.setSize(width,height,false);renderer.render(scene,camera);
  const gl=renderer.getContext(),bytes=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
  shots.push({name,width,height,sha256:await sha(bytes),png:renderer.domElement.toDataURL('image/png')});
 }
 // 2. The cold cabinet, as the shop builds it (sakura-interior.js), seen from the aisle in front of it.
 const {buildSakuraInterior}=await import('./src/world/interiors/sakura-interior.js');
 const room=new T.Group(),scene=new T.Scene();scene.background=new T.Color(0xf3ede2);scene.add(room);
 buildSakuraInterior({room,reg:()=>{},action:()=>{},exit:()=>{}});
 scene.add(new T.HemisphereLight(0xfff6e6,0x5a5048,1.8));const sun=new T.DirectionalLight(0xffffff,1.6);sun.position.set(1,3,2);scene.add(sun);
 await settle();await wait(()=>material.map.version>=3);await settle();
 const cabinet=new T.PerspectiveCamera(45,640/400,.05,30);cabinet.position.set(.4,1.25,-1.15);cabinet.lookAt(.4,1.05,-3.5);
 await shoot('cold-cabinet',scene,cabinet,640,400);
 const beerShelf=new T.PerspectiveCamera(30,1,.05,30);beerShelf.position.set(2.39,1.45,-2.55);beerShelf.lookAt(2.39,1.4,-3.5);
 await shoot('beer-column',scene,beerShelf,384,384);
 // 3. The can picked up (item-viewer.js), with the item viewer's own lights, front and turned over.
 const {buildPack}=await import('./src/world/interiors/item-viewer.js');
 const held=new T.Scene();held.background=new T.Color(0x6a625a);
 held.add(new T.HemisphereLight(0xfff6e6,0x5a5048,1.6));const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(.6,1,1.4);held.add(key);
 const rim=new T.DirectionalLight(0xfff0d0,1.2);rim.position.set(-1,.4,-1);held.add(rim);
 const pack=buildPack('beer',renderer),pivot=new T.Group();pivot.add(pack);held.add(pivot);
 let label=null;pack.traverse(o=>{if(o.isMesh&&o.material.map&&o.material.map.isCanvasTexture&&!label)label=o.material.map;});
 await wait(()=>label&&label.version>=2);await settle();
 const r=pack.userData.radius,camera=new T.PerspectiveCamera(28,1,.01,10),fit=r/Math.tan(28*Math.PI/360)*1.35;
 camera.position.set(0,-r*.18,fit);camera.lookAt(0,-r*.18,0);
 pivot.rotation.set(.12,0,0);await shoot('beer-front',held,camera,384,384);
 pivot.rotation.set(.12,Math.PI,0);await shoot('beer-back',held,camera,384,384);
 renderer.dispose();
 return shots;
}

export async function capture(){
 const {chromium}=await import('playwright');
 const preview=await serveGame({root:code,mounts:['johansson-town']});
 const browser=await chromium.launch({headless:true,args:[...process.getuid?.()===0?['--no-sandbox']:[],'--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const origin=new URL(preview.url).origin;
  await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();
   if(new URL(url).pathname===PAGE)return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><title>baselines</title><body></body>'});return route.continue();});
  await page.goto(origin+PAGE);
  const shots=await page.evaluate(draw);
  if(errors.length)console.warn('Page errors:',errors.join('; '));
  return {browser:browser.version(),shots};
 }finally{await browser.close();await preview.close();}
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const save=process.argv.indexOf('--save'),compare=process.argv.indexOf('--compare');
 const name=process.argv[(save>=0?save:compare)+1];
 if((save<0&&compare<0)||!/^[a-z0-9][a-z0-9.-]{0,40}$/.test(name||'')){console.error('Usage: baselines.mjs --save <name> | --compare <name>');process.exit(2);}
 const {browser,shots}=await capture(),folder=out(save>=0?name:`${name}.now`);
 await mkdir(folder,{recursive:true});
 for(const s of shots)await writeFile(resolve(folder,s.name+'.png'),Buffer.from(s.png.split(',')[1],'base64'));
 const record={browser,taken:new Date().toISOString(),shots:shots.map(({png,...s})=>s)};
 await writeFile(resolve(folder,'baselines.json'),JSON.stringify(record,null,1)+'\n');
 if(save>=0){console.log(record.shots.map(s=>`${s.name.padEnd(12)} ${s.width}x${s.height} ${s.sha256}`).join('\n'));console.log(`Saved in ${folder}`);}
 else{
  const was=JSON.parse(await readFile(resolve(out(name),'baselines.json'),'utf8')),results=record.shots.map(s=>{const b=was.shots.find(x=>x.name===s.name);return {name:s.name,same:!!b&&b.sha256===s.sha256};});
  for(const r of results)console.log(`${r.name.padEnd(12)} ${r.same?'pixel-identical':'DIFFERENT'}`);
  if(was.browser!==browser)console.log(`(taken with Chromium ${was.browser}; now ${browser})`);
  if(results.some(r=>!r.same))process.exitCode=1;
 }
}
