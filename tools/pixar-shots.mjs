// Photographs a Pixar body in the running game (src/avatars/pixar.js): boots World in a cloud session's software Chromium
// (Pixar bodies are drawn by default), finds the resident where the town has put her (in Sakura if she is not out in the
// street), and photographs her close (front, three-quarter, face, then the face as the town moves on) from the audit
// harness's lens; with --cartoon the same views with ?pixar=0, to compare.
//   node tools/pixar-shots.mjs [--name Thuan] [--time 12:20] [--cartoon] [--source] [--scenes] [out-dir]
// The built runtime by default (npm run build:runtime first); --source serves the source modules. Run it alone.
// --scenes (the player, Johansson): him in the game's own situations, each from several lenses: standing idle in four
// views, walking, World's gestures (the owner, 27 October 2026: "test him and see so he looks natural in the game, no
// twisted limbs or wrists"), and seated at the izakaya's counter, toasting and drinking (the stool against him).
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const SOURCE=args.includes('--source'),CARTOON=args.includes('--cartoon'),SCENES=args.includes('--scenes'),NAME=flag('--name')||'Thuan',TIME=flag('--time')||'12:20';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--name','--time','--part'].includes(args[i-1]))||resolve(root,'output/pixar-shots'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={name:NAME,cartoon:CARTOON,source:SOURCE,time:TIME,steps:[],errors:[],warnings:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name,Object.keys(extra).length?JSON.stringify(extra):'');};
try{
 const context=await browser.newContext({viewport:{width:900,height:900},serviceWorkers:'block'});
 await context.addInitScript(t=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:t,speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};},TIME);
 const page=await context.newPage();page.setDefaultTimeout(900000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')report.warnings.push(m.text().slice(0,300));});
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit${CARTOON?'&pixar=0':''}`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();step('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 // Her avatar, wherever the town has her: the scene reached from the player's own.
 const find=async()=>page.evaluate(name=>{
  let scene=window.__JOHANSSON_MODEL__?.avatar?.root;while(scene?.parent)scene=scene.parent;
  const found=[];scene?.traverse(o=>{if(o.name==='Shimanchu · '+name)found.push(o);});
  const shown=found.find(o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;})||found[0];
  if(!shown)return null;window.__PIXAR_SUBJECT__=shown;shown.updateWorldMatrix(true,true);
  const p=shown.getWorldPosition(new shown.position.constructor());let pixar=null;shown.traverse(o=>{if(o.name?.startsWith('Pixar '))pixar=(pixar||0)+1;});
  return {count:found.length,position:p.toArray().map(v=>+v.toFixed(2)),visible:found.map(o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true;}),pixarMeshes:pixar};
 },NAME);
 let where=await find();step('found '+NAME,{where});
 if(!where?.visible?.some(Boolean)){
  // Not out in the town now: at work, most of the day (Thuan in Sakura; Thao, who runs the izakaya, there from 16:00)
  const workplace={Thuan:'sakura',Thao:'izakaya'}[NAME]||'sakura';
  await page.evaluate(async r=>{await window.__JOHANSSON_AUDIT__.enter(r);},workplace);
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);where=await find();step('in '+workplace,{where});
 }
 // A lens in front of her, along her own facing: the body faces its root's +z (build.js).
 const lens=async(distance,height,turn=0,aim=null)=>page.evaluate(([d,h,t,a])=>{
  const o=window.__PIXAR_SUBJECT__;o.updateWorldMatrix(true,true);const e=o.matrixWorld.elements,p=[e[12],e[13],e[14]];
  const f=[e[8],e[10]],l=Math.hypot(...f),fx=f[0]/l,fz=f[1]/l,c=Math.cos(t),s=Math.sin(t),dx=fx*c-fz*s,dz=fx*s+fz*c;
  return {pos:[p[0]+dx*d,p[1]+h,p[2]+dz*d],at:[p[0],p[1]+(a??h),p[2]]};},[distance,height,turn,aim]);
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(true));
 if(SCENES){
  const stepGame=ms=>page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),ms);
  // (--part street|izakaya narrows a run to one half: the town's gestures, or the counter and the draught)
  const part=process.argv.includes('--part')?process.argv[process.argv.indexOf('--part')+1]:'all';
  // (the actor's play() returns nothing: a gesture it does not know falls back to a nod)
  const play=name=>page.evaluate(n=>{const m=window.__JOHANSSON_MODEL__;if(!m?.play)return false;m.play(n);return true;},name);
  const views=async(prefix,{d=2.4,h=1.0,aim=.85,turns={front:0,'three-quarter':.65,side:Math.PI/2,back:Math.PI}}={})=>{for(const [k,t] of Object.entries(turns))await shot(prefix+'-'+k,await lens(d,h,t,aim));};
  if(part==='all'||part==='street'){
  // standing idle, four views, and a closer look at the arms and hands
  await views('idle');await shot('idle-arms',await lens(1.5,1.05,.5,.95));
  // walking: the key held while the town steps on, photographed mid-stride twice; then back to the open spot he stood
  // on (the walk ended him by the arcade's pillar, which stood in every front view of the gestures, 27 October 2026)
  const spot=await page.evaluate(()=>{const p=window.__JOHANSSON_AUDIT__.player;return [p.position,p.yaw];});
  await page.keyboard.down('KeyW');await stepGame(450);await shot('walk-1',await lens(2.4,1.0,.65,.85));await stepGame(220);await shot('walk-2',await lens(2.4,1.0,Math.PI/2,.85));await stepGame(200);await shot('walk-3-front',await lens(2.4,1.0,0,.85));await page.keyboard.up('KeyW');await stepGame(900);
  await page.evaluate(([p,yaw])=>window.__JOHANSSON_AUDIT__.stand(p[0],p[1],p[2],yaw),spot);await stepGame(700);await find();
  // World's gestures, each a little way in, from the front and the side, and the hands close
  for(const [name,secs] of [['Wave',.9],['Think',1.2],['Bow',.8],['Point',.9],['Cheer',.9],['Stretch',1.1],['LookAround',1.3],['Shrug',.7],['HandsOnHips',1.3],['Drink',1.4],['Eat',1.4]]){
   const ok=await play(name);if(!ok){report.warnings.push('no gesture '+name);continue;}
   await stepGame(Math.round(secs*1000));
   await shot('gesture-'+name+'-front',await lens(2.2,1.0,.25,.9));await shot('gesture-'+name+'-side',await lens(2.2,1.0,Math.PI/2,.9));await shot('gesture-'+name+'-hands',await lens(1.4,1.15,.35,1.05));
   await stepGame(2600);
  }
  }
  if(part!=='street'){const sipOnly=part==='sip';   // (sip: straight to the draught, no seated views or gestures)
  // the izakaya: in, to the stand place before the middle counter stool, facing the counter; the seat taken by the game's
  // own interaction (E, then the seat's own button if a menu offers it), then toasting and drinking
  await page.evaluate(async()=>{await window.__JOHANSSON_AUDIT__.enter('izakaya');});
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);step('in the izakaya');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.stand(-1.9,0,.82,0));await stepGame(400);
  await page.keyboard.press('KeyE');await page.waitForTimeout(400);
  const seatButton=page.locator('#activityActions button',{hasText:'Sit at the counter'});
  if(await seatButton.count()){await seatButton.first().click();await page.waitForTimeout(300);}
  await stepGame(1500);
  const seatedAt=await page.evaluate(()=>({player:window.__JOHANSSON_AUDIT__.player,prompt:document.querySelector('#prompt')?.textContent}));step('seated?',seatedAt);report.izakaya=seatedAt;
  where=await find();
  // (the front and three-quarter lenses over the counter, from the barman's side: at his own height they stood inside it)
  const over={front:[1.15,1.45,.3,.95],'three-quarter':[1.5,1.35,.9,.85]};
  if(!sipOnly){for(const [k,[d,h,t,a]] of Object.entries(over))await shot('izakaya-seated-'+k,await lens(d,h,t,a));
  await views('izakaya-seated',{d:2.2,h:.95,aim:.7,turns:{side:Math.PI/2,back:Math.PI-.4}});
  await shot('izakaya-seated-lap',await lens(1.3,.95,.6,.65));}
  for(const [name,secs] of sipOnly?[]:[['SitToast',1.2],['SitDrink',1.3]]){if(!await play(name)){report.warnings.push('no gesture '+name);continue;}await stepGame(Math.round(secs*1000));
   await shot('izakaya-'+name+'-front',await lens(...over.front));await shot('izakaya-'+name+'-side',await lens(2.0,1.0,Math.PI/2,.8));await shot('izakaya-'+name+'-hands',await lens(1.2,1.1,.45,.95));await stepGame(2600);}
  // A draught served at his seat and drunk by the game's own performance (table-drink.js: reach, grasp, lift, the rim to
  // the lips, the sip, back down), photographed at its moments, with the performance's own errors in the report
  // (the owner, 27 October 2026: "test that he can drink beer in the izakaya")
  const served=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.serve('draft'));step('served a draught?',{served});
  if(served===true){await stepGame(600);const sipping=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.sip());step('sipping?',sipping);report.sip={started:sipping,moments:[]};
   if(sipping){let at=0;for(const [moment,t] of [['reach',.7],['grasp',1.1],['lift',1.45],['approach',1.95],['contact',2.45],['sip',3.2],['swallow',4.1],['recover',4.6],['set-down',5.3],['landed',5.9]]){
    await stepGame(Math.round((t-at)*1000));at=t;const d=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.drinking);
    // the hand against the jug, measured (the owner, 27 October 2026: "he is not holding the beer"): each finger's nearest
    // distance to the handle's bar (a hold has the bar a finger's radius off every finger, about 12 mm), fingertips inside
    // the glass's body (a fault), the jug's lean off upright (gravity: it hangs level in the hand but for the sip's tip),
    // and how far the wrist is from where the hold wants it
    const m={moment,phase:d?.id,rimError:d?.rimError,wristError:d?.wristError,valid:d?.valid};
    if(d?.fingers&&d.bar){const [a,b]=d.bar.map(v=>v),seg=(p,a,b)=>{const ab=b.map((x,i)=>x-a[i]),ap=p.map((x,i)=>x-a[i]),L=ab.reduce((s,x)=>s+x*x,0),t=Math.max(0,Math.min(1,ap.reduce((s,x,i)=>s+x*ab[i],0)/L));return Math.hypot(...p.map((x,i)=>x-(a[i]+ab[i]*t)));};
     m.fingerToBar={};for(const f of ['index','middle','ring','pinky']){const pts=[1,2,3].map(k=>d.fingers[f+'R'+k]).filter(Boolean);if(pts.length)m.fingerToBar[f]=+Math.min(...pts.map(p=>seg(p,a,b))).toFixed(3);}
     const up=d.glassUp,lean=Math.acos(Math.max(-1,Math.min(1,up[1])))*180/Math.PI;m.leanDeg=+lean.toFixed(1);m.tilt=+(d.tilt*180/Math.PI).toFixed(1);
     const axisBase=d.glassPosition,inside=[];for(const [n,p] of Object.entries(d.fingers)){const rel=p.map((x,i)=>x-axisBase[i]),y=rel[0]*up[0]+rel[1]*up[1]+rel[2]*up[2],radial=Math.hypot(...rel.map((x,i)=>x-up[i]*y));if(y>.012&&y<d.glassHeight&&radial<d.glassRadius-.004)inside.push(n);}
     // the fingertips (past the last joint by most of the last phalanx): how far inside the glass's wall each ends (a tip
     // against the wall, inside the handle, is a hold; a tip through the wall is in the beer)
     m.tipsThroughWall={};for(const f of ['index','middle','ring','pinky']){const j2=d.fingers[f+'R2'],j3=d.fingers[f+'R3'];if(!j2||!j3)continue;const tip=j3.map((x,i)=>x+(x-j2[i])*.85),rel=tip.map((x,i)=>x-axisBase[i]),y=rel[0]*up[0]+rel[1]*up[1]+rel[2]*up[2],radial=Math.hypot(...rel.map((x,i)=>x-up[i]*y));if(y>.012&&y<d.glassHeight)m.tipsThroughWall[f]=+(d.glassRadius-radial).toFixed(3);}
     m.fingersInsideGlass=inside;m.baseAboveRest=+(d.glassPosition[1]-d.restPosition[1]).toFixed(3);m.holdSpan=d.hold?.span;
     // the hand the right way up on the handle: the index knuckle above the pinky's (along the jug's up), the thumb's tip above the wrist
     const i1=d.fingers.indexR1,p1=d.fingers.pinkyR1,t3=d.fingers.thumbR3,w=d.wristPosition;if(i1&&p1)m.indexAbovePinky=+((i1[0]-p1[0])*up[0]+(i1[1]-p1[1])*up[1]+(i1[2]-p1[2])*up[2]).toFixed(3);if(t3&&w)m.thumbTipAboveWrist=+(t3[1]-w[1]).toFixed(3);}
    report.sip.moments.push(m);
    await shot('izakaya-sip-'+moment+'-front',await lens(...over.front));await shot('izakaya-sip-'+moment+'-side',await lens(1.6,1.05,Math.PI/2,.95));
    // (turn +pi/2 looks from his right, the handle side: 'right' is that, a little toward the front; the 'side' lens is his right square on)
    if(['contact','sip','grasp','lift','landed'].includes(moment)){await shot('izakaya-sip-'+moment+'-hands',await lens(.9,1.15,.5,1.05));await shot('izakaya-sip-'+moment+'-right',await lens(1.1,1.15,Math.PI/2-.35,1.0));}}
    await stepGame(2000);report.sip.end=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.drinking);}}
  }
  report.renderInfo=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderInfo);
 }else{
 await shot('full-front',await lens(2.6,1.0,0,.85));
 await shot('full-three-quarter',await lens(2.6,1.0,.65,.85));
 await shot('face',await lens(.75,1.42,.25,1.4));
 // Her eyes about: a moment of the town, then the face again (a blink or a glance may land)
 for(let i=0;i<4;i++){await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(700));await shot('face-'+(i+1),await lens(.75,1.42,.25,1.4));}
 report.renderInfo=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderInfo);
 }
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({steps:report.steps.length,errors:report.errors,warnings:report.warnings.slice(0,8)}));
if(report.errors.length)process.exit(1);
