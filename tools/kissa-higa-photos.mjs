import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Photographs Kissa Higa in the old Higa Liquor (commerce/kissa-higa.js, briefs/higa-kissaten/) from fixed spots at
// 900 x 600: the street and the room open at 07:40 on a weekday, the shutter halfway up at 06:50:04.5, the shut front at noon
// and on a Saturday morning. Built like fish-market-photos.mjs: the real createTown scene, the town's own ground, the cel
// and ink passes, no simulation and no residents; the three Meshy models are placed directly (kissa-higa-props.js), not
// streamed (the page's base is the game's, so assets/ resolves as it does in the game). It runs in a cloud session under
// swiftshader. Not a physical-device check.
//   node tools/kissa-higa-photos.mjs <phase> [repo-root]
const phase=process.argv[2]||'after',root=resolve(process.argv[3]||'..'),out=resolve(`docs/qa/kissa-higa/${phase}`);
await mkdir(out,{recursive:true});
const port=8700+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:900,height:600},deviceScaleFactor:1});page.setDefaultTimeout(1200000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/Kissa Higa/.test(m.text()))errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${port}/404-qa`);await page.setContent(`<base href="http://127.0.0.1:${port}/johansson-town/"><style>body{margin:0}canvas{display:block}</style><canvas id="photo"></canvas>`);
 const report=await page.evaluate(async()=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js');
  const {createTown}=await import(base+'src/world/town.js');
  const {createBusinesses}=await import(base+'src/world/businesses.js');
  const {createCelPass}=await import(base+'src/render/cel.js');
  const {createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const {clock:duskClock}=await import(base+'src/render/dusk.js');
  const {atmosphere}=await import(base+'src/render/atmosphere.js');
  const {tickOcean}=await import(base+'src/world/ocean.js');
  const {HIGA_FRAME}=await import(base+'src/world/okinawa/higa-liquor-dressing.js');
  const {placeKissaPropsNow}=await import(base+'src/world/okinawa/kissa-higa-props.js');
  const scene=new T.Scene();
  const world=createTown({scene,sites:createBusinesses(),townMode:'peninsula',kitano:'distant',shadows:false,mobile:true,register(){},enter(){},onAction(){},getPlayerPosition:()=>new T.Vector3(30,0,30)});
  let holder=null;scene.traverse(o=>{if(o.name==='Kissa Higa models')holder=o;});
  const models=await placeKissaPropsNow(holder);
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(900,600);renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const camera=new T.PerspectiveCamera(50,900/600,.05,400);
  const ambient=new T.HemisphereLight(0xdbe7f2,0x6b5f8c,1.15);scene.add(ambient);
  const bounce=new T.DirectionalLight(0x9db6e8,1.25);scene.add(bounce);
  const sun=new T.DirectionalLight(0xffdca8,2.3);sun.castShadow=true;scene.add(sun,sun.target);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:160});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;
  const cel=createCelPass();cel.apply(scene);
  const ink=createInkPipeline(renderer,{superScale:1,samples:2,preferHalfFloat:true,fxaa:true});ink.setCamera(camera);
  // Lenses are given in the shop-house frame (x along the front, y up, z out to the street): world x = 9.55 - z, z = 8.4 + x.
  const local=(x,y,z)=>[HIGA_FRAME.origin[0]-z,y,HIGA_FRAME.origin[1]+x];
  window.capture=({pos,at,m})=>{
   world.updateHours?.(m);tickOcean(12.5);
   const c=duskClock(m,{rain:false}),air=atmosphere(c.day,false,false,m%1440);scene.background=new T.Color(air.sky);scene.fog=air.fog;
   ambient.intensity=air.ambient*1.35;ambient.color.set(c.skyFill);ambient.groundColor.set(c.groundFill);
   const P=local(...pos),A=local(...at),fx=(P[0]+A[0])/2,fz=(P[2]+A[2])/2;
   sun.intensity=c.sunIntensity;sun.color.set(c.sun);sun.position.set(fx+c.sunDirection.x*60,c.sunDirection.y*60,fz+c.sunDirection.z*60);sun.target.position.set(fx,0,fz);sun.target.updateMatrixWorld();
   bounce.position.set(-c.sunDirection.x*30,16,-c.sunDirection.z*30);bounce.intensity=c.bounce;ink.setExposure(air.exposure*1.04);
   camera.position.set(...P);camera.lookAt(...A);camera.updateMatrixWorld();cel.apply(scene);ink.render(()=>renderer.render(scene,camera));
  };
  return {models};
 });
 // Town days: day 0 (1 January 1970) is a Thursday. Day 5 is a Tuesday, day 2 a Saturday.
 const at=(day,h,mm=0)=>day*1440+h*60+mm,TUE=5,SAT=2;
 const shots=[
  ['01-street-open-0740',[.2,1.6,8.2],[-.2,1.4,1.0],at(TUE,7,40)],
  ['02-room-from-door-0740',[.9,1.55,3.1],[-.8,.8,-.3],at(TUE,7,40)],
  ['03-counter-0740',[-.85,1.3,.95],[-1.1,1.0,-.4],at(TUE,7,40)],
  ['04-table-records-0740',[-1.0,1.4,2.7],[1.2,.7,1.4],at(TUE,7,40)],
  ['05-records-close-0740',[-.9,1.25,1.7],[-1.86,.85,1.6],at(TUE,7,40)],
  ['06-shutter-rising-0650',[.2,1.6,8.2],[-.2,1.4,1.0],at(TUE,6,50)+.075],
  ['07-street-shut-1200',[.2,1.6,8.2],[-.2,1.4,1.0],at(TUE,12,0)],
  ['08-notice-close-1200',[-.4,1.5,5.0],[-.55,1.4,3.7],at(TUE,12,0)],
  ['09-saturday-0740',[.2,1.6,8.2],[-.2,1.4,1.0],at(SAT,7,40)],
  ['10-a-board-0740',[-2.2,1.2,5.6],[-1.55,.4,4.65],at(TUE,7,40)],
 ];
 for(const [name,pos,look,m] of shots.filter(s=>!process.env.PHOTO_ONLY||process.env.PHOTO_ONLY.split(',').includes(s[0]))){
  await page.evaluate(v=>window.capture(v),{pos,at:look,m});await page.locator('canvas').screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:86});console.log('wrote',name);
 }
 await writeFile(`${out}/report.json`,JSON.stringify({phase,viewport:[900,600],physicalDevice:false,meshyModels:report.models,
  scope:'Kissa Higa; static createTown scene with cel and ink passes; no simulation and no residents; the Meshy models placed directly',errors},null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
