import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Photographs the east-quay fish auction and ice plant (docs/research/japanese-miniature-scenes.md, the fish market
// rework) from five fixed spots at 900 x 600, so a rework has its before and after from the same lenses. Built like
// town-hall-zone-photos.mjs: the real createTown scene, the town's own ground and sea, the cel and ink passes; no
// simulation, no streamed detail models, so it runs in a cloud session under swiftshader. Not a physical-device check.
//   node tools/fish-market-photos.mjs <phase> [repo-root]
const phase=process.argv[2]||'after',root=resolve(process.argv[3]||'..'),out=resolve(`docs/qa/fish-market/${phase}`);
await mkdir(out,{recursive:true});
const port=8700+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});page.setDefaultTimeout(1200000);
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
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(900,600);renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const camera=new T.PerspectiveCamera(50,900/600,.15,400);
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
 // The shed is x 20.8..29.2, z -46.8..-40.6; the ice plant x 31.8..36.2; the lawn gate x 19..21.65 (okinawa/layout.js).
 const shots=[
  ['01-high-from-lawn',[12,13,-28],[26,1,-44]],
  ['02-gate-eye',[19.8,1.6,-39.2],[25,1,-44]],
  // From 30 October 2026 the sale counter stands where this lens stood; it looks from the walk beside the counter instead.
  ['03-crates-close',[25,2.1,-40.2],[25.3,.3,-43.4]],
  ['04-from-sea',[27,5,-60],[28,2,-43]],
  ['05-high-iso',[42,16,-26],[28,1,-45]],
  // The sale counter is open 07:00-09:00 on Kōji's weeks ashore (fish-market.js fishCounterOpen): photographed at 07:40.
  ['06-counter-open',[22.6,1.6,-38.3],[22.2,.95,-41.2],7*60+40],
  ['07-wash-corner',[25.6,1.7,-45.2],[22,.5,-46.4]],
  ['08-scale-and-bell',[25.8,1.7,-44.6],[28.4,1,-46.2]],
  ['09-quay-edge',[37.6,1.7,-46.6],[40,0,-49.8]],
 ];
 for(const [name,pos,at,m=NOON] of shots.filter(s=>!process.env.PHOTO_ONLY||process.env.PHOTO_ONLY.split(',').includes(s[0]))){
  await page.evaluate(v=>window.capture(v),{pos,at,m});await page.locator('canvas').screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:86});console.log('wrote',name);
 }
 await writeFile(`${out}/report.json`,JSON.stringify({phase,viewport:[900,600],physicalDevice:false,scope:'East-quay fish auction; static createTown scene with cel and ink passes and the sea; no simulation or streamed detail models',errors},null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
