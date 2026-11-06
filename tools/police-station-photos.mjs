import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';
// Focused model photos: the real station builder, the real generated ground and the town's cel/ink passes.
// Deliberately no unrelated shops, actors or full-game loading. Not an FPS or physical-device benchmark.
const phase=process.argv[2]||'before',out=`docs/qa/police-station/${phase}`;await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1','--directory','..'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.setDefaultTimeout(120000);
 if(phase==='before')await page.route('**/src/world/police-station.js',route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','bb006df:johansson-town/src/world/police-station.js'],{encoding:'utf8'})}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/404-qa');await page.setContent('<style>body{margin:0}canvas{display:block}</style><canvas id="photo"></canvas>');
 await page.evaluate(async()=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js');
  const {createTown}=await import(base+'src/world/town.js');
  const {createBusinesses}=await import(base+'src/world/businesses.js');
  const {createCelPass}=await import(base+'src/render/cel.js');
  const {createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const {clock:duskClock}=await import(base+'src/render/dusk.js');
  const {atmosphere}=await import(base+'src/render/atmosphere.js');
  const scene=new T.Scene();
  const world=createTown({scene,sites:createBusinesses(),townMode:'peninsula',kitano:'distant',shadows:false,mobile:true,register(){},enter(){},onAction(){},getPlayerPosition:()=>new T.Vector3(4,0,20)}),station=world.policeStation;
  station.group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(390,844);renderer.setPixelRatio(1);renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const camera=new T.PerspectiveCamera(65,390/844,.15,100);
  const ambient=new T.HemisphereLight(0xdbe7f2,0x6b5f8c,1.15);scene.add(ambient);
  const bounce=new T.DirectionalLight(0x9db6e8,1.25);bounce.position.set(26,16,-22);scene.add(bounce);
  const up=new T.DirectionalLight(0xc9b9e0,.35);up.position.set(4,-18,6);scene.add(up);
  const sun=new T.DirectionalLight(0xffdca8,2.3);sun.position.set(-28,38,18);sun.castShadow=true;sun.target.position.set(8,0,20);scene.add(sun,sun.target);
  Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:.5,far:100});sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.035;
  const cel=createCelPass();cel.apply(scene);
  const ink=createInkPipeline(renderer,{superScale:1,samples:2,preferHalfFloat:true,fxaa:true});ink.setCamera(camera);ink.setExposure(1.04);
  const stationStats=()=>{let batches=0,drawCalls=0,triangles=0;station.group.traverse(o=>{if(!o.isMesh)return;batches++;const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3;drawCalls+=Array.isArray(o.material)?g.groups.length:1;});return {batches,drawCalls,triangles};};
  window.captureStation=({pos,at,m,rain})=>{
   station.dressing?.setRain(rain);station.update(m);world.setRain(rain);world.updateHours(m);
   const c=duskClock(m,{rain}),air=atmosphere(c.day,rain,false,m);scene.background=new T.Color(air.sky);scene.fog=air.fog;
   ambient.intensity=air.ambient*1.35;ambient.color.set(c.skyFill);ambient.groundColor.set(c.groundFill);
   sun.intensity=c.sunIntensity;sun.color.set(c.sun);sun.position.set(8+c.sunDirection.x*60,c.sunDirection.y*60,20+c.sunDirection.z*60);sun.target.position.set(8,0,20);sun.target.updateMatrixWorld();bounce.position.set(-c.sunDirection.x*30,16,-c.sunDirection.z*30);bounce.intensity=c.bounce;ink.setExposure(air.exposure*1.04);
   camera.position.set(...pos);camera.lookAt(...at);camera.updateMatrixWorld();cel.apply(scene);renderer.info.reset();ink.render(()=>renderer.render(scene,camera));
   return {renderCalls:renderer.info.render.calls,renderTriangles:renderer.info.render.triangles,station:stationStats(),futon:station.dressing?.futon.visible??false,patrolCard:station.dressing?.card.visible??false};
  };
 });
 const shots=[['street',[-7,3.8,24],[8,3.2,19],570,false],['south',[5,3.8,38],[9,3.2,20],570,false],['north',[4,3.8,-1],[9,3.2,18],570,false],['back',[28,4,18],[10,3.5,18],570,false],['dusk',[-7,3.8,24],[8,3.2,19],1110,false],['rainy-morning',[5,3.8,38],[9,3.2,20],570,true],['patrol',[-7,3.8,24],[8,3.2,19],1275,false]];
 const report={phase,baseline:'bb006df',viewport:[390,844],physicalDevice:false,scope:'Static createTown scene with cel and ink passes; station sun shadows; no simulation or streamed detail models',errors,shots:[]};
 for(const [name,pos,at,m,rain] of shots.filter(s=>!process.env.PHOTO_ONLY||process.env.PHOTO_ONLY.split(',').includes(s[0]))){const stats=await page.evaluate(v=>window.captureStation(v),{pos,at,m,rain});await page.locator('canvas').screenshot({path:`${out}/${name}.png`});report.shots.push({name,pos,at,minutes:m,rain,...stats});console.log(name,JSON.stringify(stats));}
 if(process.env.PHOTO_ONLY){const prior=JSON.parse(await readFile(`${out}/report.json`,'utf8'));report.shots=prior.shots.map(s=>report.shots.find(n=>n.name===s.name)||s);}
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
