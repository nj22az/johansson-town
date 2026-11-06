import {chromium} from 'playwright';
import {serveGame} from './mcp/static-server.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL((process.env.AUDIT_OUTPUT||'../docs/qa/fujita-sofa-geometry/').replace(/\/?$/,'/'),import.meta.url);await mkdir(out,{recursive:true});
const server=await serveGame(new URL('..',import.meta.url).pathname);
const browser=await chromium.launch({headless:true,...(process.env.TOWN_AUDIT_CHROMIUM?{executablePath:process.env.TOWN_AUDIT_CHROMIUM}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const report={gameCommit:process.env.AUDIT_GAME_COMMIT,kind:'Isolated production geometry under diagnostic lighting; not the game renderer or physical iPhone',views:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1200,height:900},deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/geometry-audit.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0;background:#dce8eb}canvas{display:block}#label{position:fixed;left:15px;top:15px;padding:10px;background:white;font:16px sans-serif}</style><div id="label">Shiosai — production geometry / diagnostic lighting</div>'}));
 await page.goto(server.url+'geometry-audit.html');
 await page.evaluate(async()=>{
  const T=await import('./vendor/three.module.js'),{buildPortShed}=await import('./src/world/port-shed.js');
  const scene=new T.Scene();scene.background=new T.Color(0xb9ced5);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,900);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  document.body.append(renderer.domElement);
  const camera=new T.PerspectiveCamera(43,1200/900,.05,150);
  scene.add(new T.HemisphereLight(0xf6fafb,0x7a6e54,2.4));
  const sun=new T.DirectionalLight(0xfff1d5,2.4);sun.position.set(-48,12,-50);scene.add(sun);
  const group=new T.Group();scene.add(group);
  const shed=buildPortShed({parent:group,colliders:[],register(){},onAction(){}});
  if(!await shed.boat.ready)throw Error('Hull failed');
  const water=new T.Mesh(new T.PlaneGeometry(35,35),new T.MeshStandardMaterial({color:0x4d9ca3,roughness:.9}));water.rotation.x=-Math.PI/2;water.position.set(-38,-.5,-56);scene.add(water);
  window.fixture={scene,renderer,camera,shed,T,render(){scene.updateMatrixWorld(true);renderer.render(scene,camera);}};
 });
 const capture=async(name,pos,at,sleep)=>{
  const state=await page.evaluate(({name,pos,at,sleep})=>{
   const f=window.fixture;f.shed.tick(0,sleep?1410:900);for(let i=0;i<500;i++)f.shed.tick(.1,sleep?1410:900);
   f.camera.position.set(...pos);f.camera.lookAt(...at);f.camera.updateMatrixWorld();
   if(sleep)f.shed.boat.tick({sleeping:true});f.render();
   const p=f.shed.fujita.getWorldPosition(new f.T.Vector3());
   document.getElementById('label').textContent=name+' | isolated production geometry / diagnostic lighting';
   return {routine:f.shed.routine.state,resident:p.toArray(),drawCalls:f.renderer.info.render.calls};
  },{name,pos,at,sleep});
  await page.screenshot({path:new URL(name+'.png',out).pathname});report.views.push({name,...state});console.log(name,JSON.stringify(state));
 };
 await capture('01-exterior',[-46,5.8,-50],[-40.3,.7,-56.9],false);
 await capture('02-stern',[-44.8,4.1,-63.8],[-40.5,.5,-58],false);
 await capture('03-sofa-sleep-side',[-43.8,2.6,-55.4],[-41.1,.75,-58.1],true);
 await capture('04-sofa-sleep-overhead',[-40.5,6.2,-57.8],[-40.5,.3,-57.8],true);
 await capture('05-sofa-sleep-close',[-40.0,1.2,-57.55],[-41.1,.72,-58.4],true);
 await capture('06-cabin-aisle',[-39.95,1.65,-55.8],[-40.6,.9,-59],true);
 await capture('07-open-futon-cabinet',[-40.05,1.15,-56.6],[-41.44,.5,-56.37],true);
 report.passed=report.errors.length===0;
}catch(e){report.passed=false;report.failure=e.stack;process.exitCode=1;}
finally{await browser.close();await server.close();await writeFile(new URL('report.json',out),JSON.stringify(report,null,2));}
