import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Photographs the town hall zone and the north end of the east beach (briefs/town-hall-zone.md, phase R) from the owner's
// four phone spots at a phone's size, plus two high looks. Built like police-station-photos.mjs: the real createTown
// scene, the town's own ground and sea, the cel and ink passes; no simulation, no streamed detail models, so it runs
// in a cloud session where the full game does not boot under swiftshader. Not a physical-device check.
//   node tools/town-hall-zone-photos.mjs <phase> [repo-root]
// `repo-root` is the checkout to photograph (a worktree of the commit before the change, for "before").
const phase=process.argv[2]||'after',root=resolve(process.argv[3]||'..'),out=resolve(`docs/qa/town-hall-zone/${phase}`);
await mkdir(out,{recursive:true});
const port=8700+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.setDefaultTimeout(1200000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/404-qa`);await page.setContent('<style>body{margin:0}canvas{display:block}</style><canvas id="photo"></canvas>');
 await page.evaluate(async()=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js');
  const {createTown}=await import(base+'src/world/town.js');
  const {createBusinesses}=await import(base+'src/world/businesses.js');
  const {createCelPass}=await import(base+'src/render/cel.js');
  const {createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const {clock:duskClock}=await import(base+'src/render/dusk.js');
  const {atmosphere}=await import(base+'src/render/atmosphere.js');
  const {tickOcean}=await import(base+'src/world/ocean.js');
  const scene=new T.Scene();
  const world=createTown({scene,sites:createBusinesses(),townMode:'peninsula',kitano:'distant',shadows:false,mobile:true,register(){},enter(){},onAction(){},getPlayerPosition:()=>new T.Vector3(30,0,30)});
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(390,844);renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const camera=new T.PerspectiveCamera(65,390/844,.15,400);
  const ambient=new T.HemisphereLight(0xdbe7f2,0x6b5f8c,1.15);scene.add(ambient);
  const bounce=new T.DirectionalLight(0x9db6e8,1.25);scene.add(bounce);
  const sun=new T.DirectionalLight(0xffdca8,2.3);sun.castShadow=true;scene.add(sun,sun.target);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:160});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;
  const cel=createCelPass();cel.apply(scene);
  const ink=createInkPipeline(renderer,{superScale:1,samples:2,preferHalfFloat:true,fxaa:true});ink.setCamera(camera);
  window.capture=({pos,at,m})=>{
   world.updateHours?.(m);tickOcean(12.5);
   const c=duskClock(m,{rain:false}),air=atmosphere(c.day,false,false,m);scene.background=new T.Color(air.sky);scene.fog=air.fog;
   ambient.intensity=air.ambient*1.35;ambient.color.set(c.skyFill);ambient.groundColor.set(c.groundFill);
   const fx=(pos[0]+at[0])/2,fz=(pos[2]+at[2])/2;
   sun.intensity=c.sunIntensity;sun.color.set(c.sun);sun.position.set(fx+c.sunDirection.x*60,c.sunDirection.y*60,fz+c.sunDirection.z*60);sun.target.position.set(fx,0,fz);sun.target.updateMatrixWorld();
   bounce.position.set(-c.sunDirection.x*30,16,-c.sunDirection.z*30);bounce.intensity=c.bounce;ink.setExposure(air.exposure*1.04);
   camera.position.set(...pos);camera.lookAt(...at);camera.updateMatrixWorld();cel.apply(scene);ink.render(()=>renderer.render(scene,camera));
  };
 });
 const NOON=12*60+20;
 const shots=[
  ['01-lane-end-beach',[43.6,1.7,33.5],[44.6,.2,18]],
  ['02-yard-by-car-park',[42.6,1.6,27.4],[35,1.1,30.5]],
  ['03-gate-forecourt',[20.5,1.7,21.5],[22.5,1.4,34]],
  ['04-monument',[19.2,1.7,25.6],[16.2,1.1,32.5]],
  ['05-beach-end-high',[53,11,20],[45,-.4,28.5]],
  ['06-yard-high',[27,40,20],[27,0,34.5]],
  ['07-row-from-car-park',[38.5,1.7,30.2],[25,2,37.5]],
  ['08-passage-to-seawall',[24.75,1.7,32.8],[24.75,1.2,44.5]],
  ['09-row-high',[27,14,22],[27,1.5,38]],
 ];
 for(const [name,pos,at] of shots.filter(s=>!process.env.PHOTO_ONLY||process.env.PHOTO_ONLY.split(',').includes(s[0]))){
  await page.evaluate(v=>window.capture(v),{pos,at,m:NOON});await page.locator('canvas').screenshot({path:`${out}/${name}.png`});console.log('wrote',name);
 }
 await writeFile(`${out}/report.json`,JSON.stringify({phase,viewport:[390,844],physicalDevice:false,scope:'Static createTown scene with cel and ink passes and the sea; no simulation or streamed detail models',errors},null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
