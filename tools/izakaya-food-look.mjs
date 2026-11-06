// Capture natural Minato food/drink service in the actual game.
// node tools/izakaya-food-look.mjs <out-dir> --linux [--desktop] [--details]
// --source --before serves the recorded main sources; --first limits the overview run.
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const baseline=args.find(a=>a.startsWith('--baseline='))?.slice(11)||'8e234f1';
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/izakaya-food'));
await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm','.woff2':'font/woff2'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=args.includes('--before')&&['src/people/venue-service.js','src/people/izakaya-beer.js','src/people/resident-personalities.js','src/avatars/work-hands.js','src/people/body-collision.js','src/people/characters.js'].some(p=>file===resolve(root,p))?execFileSync('git',['show',baseline+':johansson-town/'+file.slice(root.length+1)],{cwd:root}):await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const only=(args[args.indexOf('--only')+1]||'').split(',').filter(Boolean),wanted=name=>!args.includes('--only')||only.some(o=>name.includes(o));
try{
 const context=await browser.newContext({viewport:args.includes('--desktop')?{width:1280,height:800}:{width:390,height:844},deviceScaleFactor:1,isMobile:!args.includes('--desktop'),hasTouch:!args.includes('--desktop'),serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'20:15',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 // --linux: the Linux edition's budgets (edition.js reads window.johanssonDesktop as the page loads): the full pour.
 if(args.includes('--linux'))await context.addInitScript(()=>{window.johanssonDesktop={offline:true,photo:true};});
 const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>console.warn('Page error:',e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:600000});
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(20*60+15);a.enter('izakaya');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(3000));

 const captureStyle=await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}#prompt{display:none!important}'});
 await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.renderFrozen=false;});
 const frames=[];
 if(args.includes('--details')){
  for(const name of ['drink-placement','drink-first','range','plating','collection','carry','food-placement','food-served']){
   if(!wanted(name))continue;
   const trace=await page.evaluate(name=>{
    const a=window.__JOHANSSON_AUDIT__,draw=a.render,states=[];a.render=()=>{};
    const snapshot=()=>{const t=a.world.people.find(p=>p.profile.name==='Thao').g;return {seconds:window.__foodCaptureTime||0,work:a.beerService.working,activity:t.userData.activity,thao:t.position.toArray(),customers:a.world.people.filter(p=>p.g.userData.inIzakaya&&p.profile.name!=='Thao').map(p=>({name:p.profile.name,meal:p.g.userData.mealState,held:p.g.userData.heldItem,activity:p.g.userData.activity})),accounts:JSON.parse(JSON.stringify(a.activities.state.residentLife))};};
    try{
     for(let i=0;i<1800;i++){
      const t=a.world.people.find(p=>p.profile.name==='Thao').g,w=a.beerService.working,r=a.activities.state.residentLife?.Nhung?.meals?.izakaya;
      const hit=name==='drink-placement'?w?.kind==='draft'&&w.phase==='placing':name==='drink-first'?r?.drinkDelivered&&!r.foodDelivered:name==='range'?w?.kind==='rice'&&w.step==='station'&&t.userData.activity.startsWith('preparing')&&w.close:name==='plating'?w?.kind==='rice'&&w.step==='plate'&&t.userData.activity.startsWith('plating'):name==='collection'?w?.step==='collect'&&t.userData.workHeld?.R?.userData.consumable==='food':name==='carry'?w?.kind==='rice'&&w.phase==='carrying'&&t.position.z>-.7:name==='food-placement'?w?.kind==='rice'&&w.phase==='placing':r?.foodDelivered;
      if(hit){a.step(['drink-placement','food-placement'].includes(name)?650:200);states.push(snapshot());return states;}
      a.setTime(1215);a.step(100);window.__foodCaptureTime=(window.__foodCaptureTime||0)+.1;
      if(i%10===0)states.push(snapshot());
     }
     throw Error('Capture beat never reached: '+name);
    }finally{a.render=draw;}
   },name);
   frames.push(...trace);await writeFile(resolve(out,'sequence.json'),JSON.stringify(frames,null,2));
   const cam=['range'].includes(name)?{pos:[2.15,1.85,-2.7],at:[1.38,1.1,-3.25]}:['plating','collection'].includes(name)?{pos:[-1.4,1.9,-2.55],at:[-2.3,1.0,-1.65]}:name==='carry'?{pos:[.6,1.7,1.4],at:[-1.8,.8,.55]}:{pos:[-2.4,2.1,-1.45],at:[-3.6,.9,-.4]};
   await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);
   await page.locator('#game').screenshot({path:resolve(out,name+'.png')});console.log('saved',name);
  }
 }else{
 for(let i=0;i<(args.includes('--probe')?3:args.includes('--first')?70:160);i++){
  const state=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,t=a.world.people.find(p=>p.profile.name==='Thao').g;
   return {accounts:a.activities.state.residentLife,work:a.beerService.working,thao:t.position.toArray(),customers:a.world.people.filter(p=>p.g.userData.inIzakaya&&p.profile.name!=='Thao').map(p=>({name:p.profile.name,position:p.g.position.toArray(),meal:p.g.userData.mealState,held:p.g.userData.heldItem,activity:p.g.userData.activity})),props:a.room.children.filter(o=>o.name.startsWith('Minato dish')||o.name.startsWith('Rack draft')).map(o=>({name:o.name,visible:o.visible,position:o.position.toArray()}))};});
  frames.push({seconds:i*1.5,...state});if(i===0)console.log(JSON.stringify(await page.evaluate(()=>({blocked:window.__JOHANSSON_AUDIT__.blocked,people:window.__JOHANSSON_AUDIT__.world.people.map(p=>({name:p.profile.name,pos:p.g.position.toArray(),visible:p.g.visible,u:p.g.userData.place,in:p.g.userData.indoors,transition:p.g.userData.roomTransition}))}))));
  if(i%20===0||state.work?.phase==='placing'&&frames.at(-2)?.work?.phase!=='placing'||state.work?.step==='collect'&&frames.at(-2)?.work?.step!=='collect'){
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-2.4,2.1,-1.45],at:[-3.6,.9,-.4]};a.render();});
   await page.locator('#game').screenshot({path:resolve(out,String(i).padStart(3,'0')+'.png')});
  }
  if(state.work?.phase==='placing'||state.work?.step==='plate'||state.work?.step==='collect'){
   const [x,,z]=state.thao;const cam=z>-.8?{pos:[x+1.05,1.6,z+.95],at:[x+.05,.85,z-.35]}:{pos:[x+1.0,1.65,z+.65],at:[x-.05,.95,z+.05]};
   await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);
   await page.locator('#game').screenshot({path:resolve(out,String(i).padStart(3,'0')+'-contact.png')});
  }
  if(i%10===0)await writeFile(resolve(out,'sequence.json'),JSON.stringify(frames,null,2));
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(1215);a.step(1500);});
 }
 await writeFile(resolve(out,'sequence.json'),JSON.stringify(frames,null,2));
 console.log('captured',frames.length,'steps');
 }
 await captureStyle.evaluate(e=>e.remove());
 await page.screenshot({path:resolve(out,'hud.png')});
}finally{await browser.close();server.close();}
