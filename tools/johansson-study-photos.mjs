import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Photographs the study in Johansson's house on Kitano-jima (briefs/town-hall-zone.md, phase M: the mayor's office's
// computer and the Merry Moose moved there) at a phone's size: the house builder alone, lit as a room, with the cel and
// ink passes. Not the full game and not a physical device.
//   node tools/johansson-study-photos.mjs [out-dir]
const out=resolve(process.argv[2]||'docs/qa/town-hall-zone/study');await mkdir(out,{recursive:true});
const port=8700+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',resolve('..')],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.setDefaultTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/404-qa`);// The base is the game's, so its assets (the Merry Moose's model) resolve as they do in the game (assets.js assetURL).
 await page.setContent('<base href="/johansson-town/"><style>body{margin:0}canvas{display:block}</style><canvas></canvas>');
 await page.evaluate(async()=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js');
  const {buildJohanssonHouse,roomPoint,HOUSE_STOREY_FLOOR}=await import(base+'src/world/interiors/johansson-house-interior.js');
  const {createCelPass}=await import(base+'src/render/cel.js');
  const {createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const scene=new T.Scene();scene.background=new T.Color(0x9cc8e6);
  const room=new T.Group();scene.add(room);
  const layout=buildJohanssonHouse({room,reg(){},action(){},collider(){}});layout.showStorey('L1');
  await Promise.all(layout.owned.map(p=>p.ready));
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(390,844);renderer.setPixelRatio(1);
  const camera=new T.PerspectiveCamera(70,390/844,.05,60);
  scene.add(new T.AmbientLight(0xffffff,.35));
  const cel=createCelPass();cel.apply(scene);
  const ink=createInkPipeline(renderer,{superScale:1,samples:2,preferHalfFloat:true,fxaa:true});ink.setCamera(camera);ink.setExposure(1.05);
  const F=HOUSE_STOREY_FLOOR.L1;
  window.capture=({pos,at})=>{camera.position.set(...roomPoint(pos[0],pos[1],F+pos[2]));camera.lookAt(...roomPoint(at[0],at[1],F+at[2]));camera.updateMatrixWorld();cel.apply(scene);ink.render(()=>renderer.render(scene,camera));};
 });
 // Drawn coordinates of the study (x 8.36–11.8, y 3.56–7.04): from the door, at the desk, and the moose's corner.
 for(const [name,pos,at] of [['01-study-from-door',[8.6,4.2,1.55],[11.4,6.2,.8]],['02-desk-and-computer',[10.2,5.0,1.45],[11.6,5.25,.8]],['03-merry-moose',[10.6,5.4,1.45],[8.75,6.65,.7]]]){
  await page.evaluate(v=>window.capture(v),{pos,at});await page.locator('canvas').screenshot({path:`${out}/${name}.png`});console.log('wrote',name);
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
