// Run against the compiled town served from the repository root.
// Baselines change only with --update-baselines, after reviewing the captured views.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {comparePng,comparisonReport} from './visual-compare.mjs';
import {homeViews,homeEntranceView} from './visual-home-views.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const update=args.includes('--update-baselines');
const url=new URL(option('--url','http://127.0.0.1:8766/johansson-town/'));
url.searchParams.set('audit','');url.searchParams.set('visual-audit','');
const out=resolve(option('--output',resolve(root,'../output/visual-audit')));
const base=resolve(option('--baselines',resolve(root,'tests/visual-baselines')));
const selected=option('--viewport','all');
assert.ok(['all','desktop','phone'].includes(selected),'--viewport must be all, desktop or phone');
const filter=option('--scene',null);
const views=[{name:'desktop',width:1280,height:800},{name:'phone',width:390,height:844}].filter(v=>selected==='all'||selected===v.name);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const environment={browser:browser.version(),platform:process.platform,arch:process.arch,backend:'metal'};
const profile=`${environment.platform}-${environment.arch}-chromium-${environment.browser.split('.')[0]}-${environment.backend}`;
const baselineDir=resolve(base,profile);
const report={mode:update?'update':'compare',environment,url:url.href,baselines:baselineDir,views:[],errors:[],console:[]};
const candidates=[];
let failure=null;

async function settle(page){
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__.active);
 await page.waitForLoadState('networkidle',{timeout:120000});
 await page.waitForFunction(()=>!window.__JOHANSSON_STREAMING__.active);
 await page.evaluate(async()=>{await document.fonts.ready;window.__JOHANSSON_AUDIT__.render();});
}

try{
 for(const viewport of views){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.name==='phone',deviceScaleFactor:1,timezoneId:'Europe/Stockholm',locale:'en-GB',serviceWorkers:'block'});
  // A new save, fixed calendar and seeded procedural props make each fixture repeatable.
  await context.addInitScript(()=>{
   const NativeDate=Date,fixed=NativeDate.parse('2026-10-03T10:00:00Z');
   class AuditDate extends NativeDate{constructor(...values){super(...(values.length?values:[fixed]));}static now(){return fixed;}}
   window.Date=AuditDate;
   let seed=422197;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));
   Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};
  });
  const page=await context.newPage();page.setDefaultTimeout(120000);
  const asset=url=>new URL(url).pathname.includes('/johansson-town/assets/');
  page.on('requestfailed',request=>{if(asset(request.url()))report.errors.push({viewport:viewport.name,type:'asset',message:request.url()+': '+request.failure()?.errorText});});
  page.on('response',response=>{if(response.status()>=400&&asset(response.url()))report.errors.push({viewport:viewport.name,type:'asset',message:response.status()+' '+response.url()});});
  page.on('pageerror',e=>report.errors.push({viewport:viewport.name,type:'page',message:e.message}));
  page.on('console',m=>{if(m.type()==='error'){const item={viewport:viewport.name,type:'console',message:m.text()};report.console.push(item);if(/WebGL|framebuffer|shader|NaN|INVALID_|stability checks failed/i.test(item.message))report.errors.push(item);}});
  await page.goto(url.href,{waitUntil:'domcontentloaded'});
  await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:240000});
  await page.addStyleTag({content:'#hud,#activity,#directory,#cameraPanel,#touchControls,#touch-ui{visibility:hidden!important}'});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;if(!a.frozen)throw Error('Visual audit requires a frozen town');a.setTime(720);});
  await settle(page);
  const gpu=await page.evaluate(()=>{const gl=window.__JOHANSSON_AUDIT__.renderer.getContext(),extension=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:gl.getParameter(extension?.UNMASKED_VENDOR_WEBGL??gl.VENDOR),renderer:gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL??gl.RENDERER),version:gl.getParameter(gl.VERSION),maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE)};});
  if(environment.gpu)assert.deepEqual(gpu,environment.gpu,'Both viewports use the same GPU');
  else{
   environment.gpu=gpu;
   if(!update){const recorded=JSON.parse(await readFile(resolve(baselineDir,'environment.json'),'utf8'));assert.deepEqual(recorded,environment,'Browser/GPU/environment changed; review new baselines before updating them');}
  }
  console.log('Visual audit ready:',viewport.name);

  const capture=async label=>{
   if(filter&&!label.includes(filter))return;
   await settle(page);
   const state=await page.evaluate(()=>{
    const a=window.__JOHANSSON_AUDIT__,invalid=[],loadErrors=[];a.scene.updateMatrixWorld(true);
    a.scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))invalid.push(o.name||o.type);if(o.userData.loadError){let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(visible)loadErrors.push({name:o.name||o.type,error:String(o.userData.loadError)});}});
    const look=window.__JOHANSSON_LOOK__,lights=Object.fromEntries(Object.entries(look.lights).map(([name,l])=>[name,{intensity:l.intensity,color:l.color.getHex(),position:l.position.toArray()}]));
    return {game:JSON.parse(window.render_game_to_text()),invalid,loadErrors,draws:a.renderer.info.render.calls,dpr:a.renderer.getPixelRatio(),ink:look.ink,lighting:{lights,grade:look.state,exposure:a.renderer.toneMappingExposure},streaming:structuredClone(window.__JOHANSSON_STREAMING__)};
   });
   assert.deepEqual(state.invalid,[],'Invalid scene transforms: '+label);assert.ok(state.draws>0,'Empty render: '+label);assert.equal(state.ink,true,'Postprocessing unavailable: '+label);
   assert.deepEqual(state.loadErrors,[],'Visible asset unavailable: '+label);
   assert.deepEqual(state.streaming.failed,[],'Missing streamed detail: '+label);
   const file=`${viewport.name}-${label}.png`,actualPath=resolve(out,file),baselinePath=resolve(baselineDir,file),diffPath=resolve(out,`${viewport.name}-${label}-diff.png`);
   const actual=await page.locator('#game').screenshot({path:actualPath,animations:'disabled'});
   const image=PNG.sync.read(actual),colours=new Set();let transparent=0;
   for(let i=0;i<image.data.length;i+=4){const p=image.data;if(p[i+3]<250)transparent++;colours.add((p[i]<<16)|(p[i+1]<<8)|p[i+2]);}
   assert.ok(colours.size>32&&transparent===0,'Blank or transparent canvas: '+label);
   const repeated=await page.locator('#game').screenshot({animations:'disabled'});
   const stability=comparePng(repeated,actual,{threshold:0,includeAA:true,maxDiffPixels:0,maxDiffRatio:0});
   if(!stability.passed){await writeFile(resolve(out,`${viewport.name}-${label}-repeat.png`),repeated);await writeFile(resolve(out,`${viewport.name}-${label}-unstable.png`),stability.diffPNG);report.unstable={viewport:viewport.name,label,...comparisonReport(stability)};}
   assert.equal(stability.passed,true,'Capture still changing: '+label+'; wait for its assets or fix the freeze hook');
   let result;
   if(update){candidates.push({baselinePath,actual});result={passed:true,status:'baseline-candidate',artifacts:{actual:actualPath,baseline:baselinePath}};}
   else{
    let baseline=null;try{baseline=await readFile(baselinePath);}catch(error){if(error.code!=='ENOENT')throw error;}
    result=comparePng(actual,baseline,{threshold:.05,includeAA:true,maxDiffPixels:0,maxDiffRatio:0,actualPath,baselinePath,diffPath});
    if(result.diffPNG)await writeFile(diffPath,result.diffPNG);
   }
   report.views.push({viewport:viewport.name,label,state,...comparisonReport(result)});
   console.log(result.passed?'PASS':'FAIL',viewport.name,label,result.metrics?.diffPixels??'');
  };

  const outdoors=[
   await page.evaluate(async()=>{const {shoppingLanePoint}=await import('/johansson-town/src/world/shopping-lane-plan.js');const at=shoppingLanePoint(90,112),cam=shoppingLanePoint(91,125),look=shoppingLanePoint(90,99);return {label:'rainflower',at,pos:[cam[0],3.2,cam[1]],look:[look[0],1.1,look[1]]};}),
   {label:'garden',at:[-23.4,40.6],pos:[-25,5,48],look:[-23.4,1,40.6]},
   {label:'harbour-window',at:[-3,-28],pos:[-2,2.2,-21],look:[-11,1.2,-28]},
   await page.evaluate(async()=>{const {airportWorld}=await import('/johansson-town/src/world/airport-ground.js');const at=airportWorld(-18,37),cam=airportWorld(-32,90),look=airportWorld(-7,58);return {label:'airport-junction',at,pos:[cam[0],22,cam[1]],look:[look[0],1.1,look[1]]};})
  ];
  for(const minutes of [720,1260]){
   await page.evaluate(minutes=>window.__JOHANSSON_AUDIT__.setTime(minutes),minutes);
   for(const view of outdoors){
    await page.evaluate(({at,pos,look})=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(...at);a.camera={pos,at:look};a.render();},view);
    await capture(`${view.label}-${minutes===720?'day':'night'}`);
   }
  }
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.setTime(720));
  const homes=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.sites.filter(s=>/home/.test(s.id)));
  assert.equal(homes.length,15,'Every accessible home belongs to the visual suite');
  for(const home of homes){
   const entrance=homeEntranceView(home.id);
   await page.evaluate(async ({id,camera})=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter(id);a.camera=camera;a.render();},{id:home.id,camera:entrance});
   assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).room),home.id);
   await capture(home.id);
   const secondary=homeViews(home.id);
   assert.equal(secondary.length,1,'Every home has a view of its household belongings');
   for(const view of secondary){
    await page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},view);
    await capture(`${home.id}-${view.name}`);
   }
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();});
  }
  // Leaving the last home can start exterior detail loads. Finish them before
  // closing the page so our own cleanup does not cancel and misreport an asset.
  await settle(page);
  if(args.includes('--diagnostics')){
   const capture=await page.evaluate(async()=>{const g=window.__JOHANSSON_GRAPHICS__;if(!g)throw Error('Graphics inspector is missing');const frame=await g.capture({quick:true,full:false,timeoutMs:30000});return {commands:frame.commands?.length??0,stats:g.stats};});
   assert.ok(capture.commands>0,'Spector captures actual WebGL commands');report.graphics=capture;
   assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.frozen),true,'Inspector retains frozen audit mode');
  }
  await context.close();
 }
 assert.ok(report.views.length,'No scenes matched --scene');
 assert.deepEqual(report.errors,[],'Browser or graphics errors');
 assert.ok(report.views.every(view=>view.passed),'Visual changes detected; inspect the actual and diff images');
 if(update){
  await mkdir(baselineDir,{recursive:true});
  for(const candidate of candidates)await writeFile(candidate.baselinePath,candidate.actual);
  await writeFile(resolve(baselineDir,'environment.json'),JSON.stringify(environment,null,2)+'\n');
  for(const view of report.views)view.status='baseline-written';
 }
}catch(error){failure=error;report.failure=error.message;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
if(failure)throw failure;
console.log(`${report.views.length} views passed. Report: ${resolve(out,'report.json')}`);
