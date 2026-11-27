// Photographs Johansson opening and drinking what he bought, in the running game, as the third-person view shows it (the
// owner, 27 November 2026, of the new hands: "Can they still drink beer or anything from the vending machines?", and "A
// can needs to be opened also, removing the tab"): each can bought into the bag (the audit's buy, as a machine's pocket
// gives it), then drunk as R drinks it (sip), as animated in Blender (avatars/drink-can.js): the tab pulled off and
// pocketed, then the drink; shot at each moment from his right, his left, his front or close on the can (a few: each is
// about a minute in software rendering), with where the can is against his hand and his lips in the report.
//   node tools/vending-drink-shots.mjs [--source] [--drinks "Umineko lager,Canned coffee"] [out-dir]
// The built runtime by default (npm run build:runtime first); --source serves the source modules. Run it alone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const SOURCE=args.includes('--source'),DRINKS=(flag('--drinks')||'Umineko lager').split(',');
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--drinks'].includes(args[i-1]))||resolve(root,'output/vending-drink'));await mkdir(out,{recursive:true});
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
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={source:SOURCE,drinks:[],steps:[],errors:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name,Object.keys(extra).length?JSON.stringify(extra):'');};
try{
 const context=await browser.newContext({viewport:{width:720,height:720},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 const stepGame=ms=>page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),ms);
 // A lens round him at his right hand's height: `turn` from his front, toward his right (the drinking hand).
 const lens=(distance,height,turn)=>page.evaluate(([d,h,t])=>{
  const o=window.__JOHANSSON_MODEL__.avatar.root;o.updateWorldMatrix(true,true);const e=o.matrixWorld.elements,p=[e[12],e[13],e[14]];
  const f=[e[8],e[10]],l=Math.hypot(...f),fx=f[0]/l,fz=f[1]/l,c=Math.cos(t),s=Math.sin(t),dx=fx*c-fz*s,dz=fx*s+fz*c;
  return {pos:[p[0]+dx*d,p[1]+h,p[2]+dz*d],at:[p[0],p[1]+h,p[2]]};},[distance,height,turn]);
 // Where the can is: its middle against the hand's bone, its rim against his head; whether its tab is on it, in his left
 // hand or gone, and the opening shown.
 const measure=()=>page.evaluate(()=>{
  const a=window.__JOHANSSON_MODEL__.avatar,root=a.root;let can=null;root.traverse(o=>{if(o.userData?.bought)can=o;});if(!can)return {can:null,third:window.__JOHANSSON_AUDIT__.mouse.thirdPerson,stage:window.__JOHANSSON_MODEL__.bought,move:window.__JOHANSSON_MODEL__.move,held:window.__JOHANSSON_AUDIT__.held};
  root.updateWorldMatrix(true,true);const V=can.position.constructor,mid=new V(0,.062,0),rim=new V(0,can.userData.rimHeight||.124,0);
  can.localToWorld(mid);can.localToWorld(rim);const hand=a.bones.handR.getWorldPosition(new V()),head=a.bones.head.getWorldPosition(new V());
  const S=can.userData.sealed,tab=!S?'none':S.done?'pocketed':S.tab.parent===a.bones.handL?'in his left hand':'on the can';
  return {can:can.userData.bought,stage:window.__JOHANSSON_MODEL__.bought,move:window.__JOHANSSON_MODEL__.move,tab,opening:!!S?.opening.visible,
   fromHand:+mid.distanceTo(hand).toFixed(3),rimToHead:+rim.distanceTo(head).toFixed(3)};});
 // A lens close on the can's top, from his front-left, above.
 const onCan=()=>page.evaluate(()=>{const a=window.__JOHANSSON_MODEL__.avatar;let can=null;a.root.traverse(o=>{if(o.userData?.bought)can=o;});if(!can)return null;
  const V=can.position.constructor,top=can.localToWorld(new V(0,.09,0)),e=a.root.matrixWorld.elements,f=new V(e[8],0,e[10]).normalize(),l=new V(e[0],0,e[2]).normalize();
  return {pos:top.clone().addScaledVector(f,.34).addScaledVector(l,.18).add(new V(0,.2,0)).toArray(),at:top.toArray()};});
 const tiles=[];
 const shoot=async(label,cam)=>{if(!cam)return;await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);
  await page.waitForTimeout(200);const png=await page.locator('#game').screenshot();tiles.push({label,png});};
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(true));
 for(const name of DRINKS){
  await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
  await page.evaluate(n=>window.__JOHANSSON_AUDIT__.buy(n),name);await stepGame(800);
  const sipped=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.sip());step('bought and drinking '+name,{sipped});
  const moments=[];
  // (the moments of the drink as animated in Blender, avatars/drink-can.js: the forefinger on the ring, the tab to the
  // pocket, the rim on the lip, deep with the head back, the last of it; seconds into it, each step from the last)
  for(const [ms,when,views] of [[900,'the forefinger on the ring',['can','front']],[1050,'the tab to his pocket',['front']],[1500,'the rim on his lip',['right','left']],
   [1350,'deep, the head back',['right','left']],[2300,'the last of it',['left']]]){
   await stepGame(ms);const m=await measure();moments.push({when,...m});step(name+' · '+when,m);
   for(const v of views)await shoot(`${name} · ${when} · ${v}`,v==='can'?await onCan():v==='right'?await lens(1.0,1.4,1.2):v==='left'?await lens(.9,1.45,-.9):await lens(1.0,1.45,.35));
  }
  await stepGame(2500);const after=await measure();step(name+' · after',after);
  report.drinks.push({name,sipped,moments,after});
 }
 // The sheet: three views a row, a row a moment.
 const sheet=await page.evaluate(async t=>{const S=360,c=document.createElement('canvas');c.width=S*3;c.height=S*Math.ceil(t.length/3);const x=c.getContext('2d');x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<t.length;i++){const img=new Image();img.src='data:image/png;base64,'+t[i].png;await img.decode();x.drawImage(img,(i%3)*S,Math.floor(i/3)*S,S,S);
   x.fillStyle='rgba(255,255,255,.85)';x.fillRect((i%3)*S,Math.floor(i/3)*S,S,22);x.fillStyle='#111';x.font='14px sans-serif';x.fillText(t[i].label,(i%3)*S+6,Math.floor(i/3)*S+16);}
  return c.toDataURL('image/jpeg',.86).split(',')[1];},tiles.map(t=>({label:t.label,png:t.png.toString('base64')})));
 await writeFile(resolve(out,'vending-drink.jpg'),Buffer.from(sheet,'base64'));step('sheet written');
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
