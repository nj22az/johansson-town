// Photographs the izakaya television's YouTube overlay in the running game (world/izakaya-tv-youtube.js), in software
// Chromium: from the set, the counter and the door, in first person and third, with Johansson's body in front of the
// screen and clear of it, and in a drawn look. Each shot reports what the set decided (shown, or why not), the overlay's
// opacity, and where the browser put the page against the screen's corners projected by three.js.
//   node tools/tv-overlay-shots.mjs [--runtime] [--youtube] [out-dir]
// By default the source modules are served and YouTube is replaced by a stand-in (an IFrame API that loads a local test
// grid, /tv-test/): the grid's red rim must sit on the tube's rim, inside the bezel. --youtube uses the real YouTube
// (www.youtube.com/iframe_api, youtube-nocookie.com embeds, the owner's uploads playlist) and reports what loaded.
// --runtime serves the built runtime instead (npm run build:runtime first). About two minutes; run it alone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),RUNTIME=args.includes('--runtime'),YOUTUBE=args.includes('--youtube');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/tv-overlay'+(YOUTUBE?'-youtube':'')));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm','.mp4':'video/mp4','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
// The stand-in: the IFrame API's calls the set uses, on a page that draws a 640 × 480 grid with a red rim.
const STUB=`(()=>{const log=window.__tvStub={calls:[]};
const PLAYLIST=['ozpLFCdrAfk','dM5hSYHX2wU'];
class Player{constructor(el,o){this.el=el;this.o=o;this.muted=true;const u=new URL(el.src,location.href);this.list=u.searchParams.get('list');this.video=this.list?PLAYLIST[0]:u.pathname.split('/').pop();
 setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady({target:this}),60);}
 fire(s){log.calls.push(['state',s]);this.o.events&&this.o.events.onStateChange&&this.o.events.onStateChange({data:s,target:this});}
 getPlaylist(){return this.list?PLAYLIST.slice():null;}
 cueVideoById(id){log.calls.push(['cue',id]);this.video=id;this.el.src='/tv-test/embed/'+id;setTimeout(()=>this.fire(5),30);}
 loadVideoById(id){this.cueVideoById(id);setTimeout(()=>this.fire(1),60);}
 playVideo(){log.calls.push(['play',this.video]);setTimeout(()=>this.fire(1),40);}
 pauseVideo(){log.calls.push(['pause']);setTimeout(()=>this.fire(2),10);}
 stopVideo(){log.calls.push(['stop']);}mute(){this.muted=true;log.calls.push(['mute']);}unMute(){this.muted=false;log.calls.push(['unMute']);}
 isMuted(){return this.muted;}setVolume(v){log.calls.push(['volume',v]);}getVideoData(){return {video_id:this.video};}
 destroy(){log.calls.push(['destroy']);this.el.remove();}}
window.YT={Player};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),20);})();`;
const GRID=id=>`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;overflow:hidden}
body{background:#0e2a3a;background-image:linear-gradient(#ffffff40 1px,transparent 1px),linear-gradient(90deg,#ffffff40 1px,transparent 1px);background-size:40px 40px;
box-shadow:inset 0 0 0 6px #ff2d2d;font:700 34px/1.2 sans-serif;color:#fff;display:grid;place-items:center;text-align:center}
b{position:fixed;font-size:22px;color:#ffe04a}i{font-style:normal;font-size:18px;color:#bfe8ff}</style>
<b style="left:12px;top:10px">TL</b><b style="right:12px;top:10px">TR</b><b style="left:12px;bottom:10px">BL</b><b style="right:12px;bottom:10px">BR</b>
<div>TEST GRID 640 × 480<br><i>${id.replace(/[^\w-]/g,'')}</i></div>`;
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 if(path==='/tv-test/iframe_api.js'){res.writeHead(200,{'content-type':'text/javascript'});return res.end(STUB);}
 if(path.startsWith('/tv-test/embed/')){res.writeHead(200,{'content-type':'text/html'});return res.end(GRID(path.split('/').pop()));}
 const file=path.startsWith('/johansson-town/')?resolve(root,'.'+path.slice('/johansson-town'.length)+(path.endsWith('/')?'index.html':'')):resolve(site,'.'+path);
 if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(!RUNTIME&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={runtime:RUNTIME,youtube:YOUTUBE,viewport:[1180,820],shots:[],steps:[],errors:[],console:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name,Object.keys(extra).length?JSON.stringify(extra):'');};
try{
 const context=await browser.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'19:20',speed:1}));localStorage.setItem('johansson-town-view','first');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{const t=m.text();if(/youtube|tv|iframe|YT/i.test(t))report.console.push(t.slice(0,300));});
 const query=YOUTUBE?'?audit&visual-audit':'?audit&visual-audit&tv-api=/tv-test/iframe_api.js&tv-embed=/tv-test/embed/&tv-watch=/tv-test/embed/';
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/${query}`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 // A clean picture: the HUD in photo mode and out of sight; the canvas and the set's page stay.
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(true));
 const clean=await page.addStyleTag({content:'body>*:not(#game):not(.tv-youtube){visibility:hidden!important}'});
 await page.evaluate(async()=>{await window.__JOHANSSON_AUDIT__.enter('izakaya');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);step('in the izakaya');
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(1500));
 // Wait for the player (the stand-in at once; YouTube as it loads).
 await page.waitForFunction(()=>{const t=window.__JOHANSSON_AUDIT__.television;return t&&['ready','failed'].includes(t.phase);},null,{timeout:YOUTUBE?60000:20000}).catch(()=>{});
 // The room's sight-line tree is built a few milliseconds a frame from the moment the set is on.
 await page.waitForFunction(()=>{const t=window.__JOHANSSON_AUDIT__.television;return !!t&&(t.youtube===false||t.sightReady||t.phase==='failed');},null,{timeout:120000}).catch(()=>{});
 step('the set',await page.evaluate(()=>window.__JOHANSSON_AUDIT__.television));
 // Where the browser drew the page, against the tube's corners projected by three.js from the same camera.
 const measure=()=>page.evaluate(()=>{
  let scene=window.__JOHANSSON_MODEL__.avatar.root;while(scene.parent)scene=scene.parent;
  let face=null,camera=null;const lens=window.__JOHANSSON_AUDIT__.lens.position;
  scene.traverse(o=>{if(o.name==='CRT YouTube face')face=o;if(o.isPerspectiveCamera&&Math.hypot(o.position.x-lens[0],o.position.y-lens[1],o.position.z-lens[2])<1e-6)camera=o;});
  const page=document.querySelector('.tv-youtube>div');if(!face||!camera||!page)return null;
  face.updateWorldMatrix(true,false);camera.updateMatrixWorld();
  const V=face.position.constructor,W=innerWidth,H=innerHeight;
  const corners=[[-.3,.225],[.3,.225],[.3,-.225],[-.3,-.225]].map(([x,y])=>{const p=new V(x,y,0).applyMatrix4(face.matrixWorld).project(camera);return [(p.x+1)/2*W,(1-p.y)/2*H];});
  const r=page.getBoundingClientRect(),xs=corners.map(c=>c[0]),ys=corners.map(c=>c[1]);
  const projected={left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};
  return {corners:corners.map(c=>c.map(v=>+v.toFixed(1))),projected:Object.fromEntries(Object.entries(projected).map(([k,v])=>[k,+v.toFixed(1)])),
   drawn:{left:+r.left.toFixed(1),top:+r.top.toFixed(1),right:+r.right.toFixed(1),bottom:+r.bottom.toFixed(1)},
   worst:+Math.max(Math.abs(r.left-projected.left),Math.abs(r.top-projected.top),Math.abs(r.right-projected.right),Math.abs(r.bottom-projected.bottom)).toFixed(2)};
 });
 const tiles=[];
 const shoot=async(label,{pos,at:target,stand=null,look='none',view='first',wait=900})=>{
  await page.evaluate(async({stand,look,view})=>{
   const a=window.__JOHANSSON_AUDIT__;window.__JOHANSSON_LOOK__.setStyle(look);
   if((view==='third')!==a.mouse.thirdPerson)document.querySelector('#viewButton').click();
   // A second and a half after placing him: the arrival's shot of him (spawn-scene.js) has handed the lens back.
   if(stand)a.stand(...stand);a.camera=null;a.step(1500);
  },{stand,look,view});
  await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},{pos,at:target});
  await page.waitForTimeout(wait);
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());
  const png=await page.screenshot();await writeFile(resolve(out,label.replace(/[^\w]+/g,'-').toLowerCase()+'.png'),png);
  const tv=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.television),placement=await measure();
  report.shots.push({label,view,look,camera:{pos,at:target},decision:tv?.decision,opacity:tv?.opacity,video:tv?.video,bodies:tv?.bodies,prompt:tv?.prompt,controls:tv?.controls,cost:{placeMs:tv?.placeMs,sightMs:tv?.sightMs,coverMs:tv?.coverMs,treeTriangles:tv?.triangles,treeBuildMs:tv?.buildMs},johanssonDrawn:await page.evaluate(()=>window.__JOHANSSON_MODEL__.root.visible),placement});
  step('shot '+label,{decision:tv?.decision?.reason,by:tv?.decision?.by,opacity:tv?.opacity,worst:placement?.worst});
  // What is on screen: the player only once it shows (it fades in once the video moves).
  const what=tv?.opacity>0?'player':tv?.decision?.show?'still: cleared to show, the video not playing':'still: '+tv?.decision?.reason+(tv?.decision?.by?' ('+tv.decision.by+')':'');
  tiles.push({label:label+' · '+what,png});
 };
 const TV=[-3.507,2.1,.716];
 // First person, his eyes (1.7 m standing, a stool's 1.32 m seated): a step from the set, the counter, the door.
 await shoot('first person at the set',{pos:[-2.45,1.7,.95],at:TV,stand:[-2.45,0,.95,Math.PI/2]});
 await shoot('first person at the set, looking across',{pos:[-2.55,1.7,1.25],at:[-3.3,1.9,.45],stand:[-2.55,0,1.25,Math.PI/2]});
 await shoot('first person from the counter',{pos:[-1.9,1.32,-.18],at:TV,stand:[-1.9,0,-.18,Math.PI/2]});
 await shoot('first person from the door',{pos:[0,1.7,2.88],at:TV,stand:[0,0,2.88,Math.PI/2]});
 await shoot('first person at the set, woodblock look',{pos:[-2.45,1.7,.95],at:TV,stand:[-2.45,0,.95,Math.PI/2],look:'print'});
 // Third person: the lens behind him, his head in front of the screen; then the lens beside him with the screen clear.
 await shoot('third person, beside him',{pos:[-2.5,1.8,1.05],at:TV,stand:[-2.85,0,1.75,Math.PI/2],view:'third'});
 await shoot('third person from the counter',{pos:[-1.5,1.9,-.9],at:TV,stand:[-2.2,0,-.25,Math.PI/2],view:'third'});
 // Portrait (an iPad held upright: the same 65° up and down over more pixels, so the set is big enough from further).
 await page.setViewportSize({width:820,height:1180});report.portrait=[820,1180];await page.waitForTimeout(500);
 await shoot('portrait, third person, his head in front',{pos:[-2,1.3,.72],at:TV,stand:[-2.75,0,.72,Math.PI/2],view:'third'});
 await shoot('portrait, third person, his shoulder at a corner',{pos:[-1.75,1.55,.95],at:TV,stand:[-2.55,0,1.12,Math.PI/2],view:'third'});
 await shoot('portrait, third person, clear of him',{pos:[-1.85,1.6,.15],at:TV,stand:[-2.6,0,1.45,Math.PI/2],view:'third'});
 await shoot('portrait, first person from the counter',{pos:[-2.7,1.32,-.18],at:TV,stand:[-2.7,0,-.18,Math.PI/2]});
 // With the HUD: the prompt and the rail's TV button at the set (landscape again).
 await page.setViewportSize({width:1180,height:820});await page.waitForTimeout(500);
 await clean.evaluate(el=>el.remove());await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(false));
 await shoot('with the HUD, at the set',{pos:[-2.45,1.7,.95],at:TV,stand:[-2.45,0,.95,Math.PI/2]});
 // The rail is laid out before the frame places the set: one more step brings it up to date.
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(50));
 report.rail=await page.evaluate(()=>[...document.querySelectorAll('#contextActions>button')].filter(b=>!b.hidden).map(b=>b.querySelector('.context-label')?.textContent.trim()||b.textContent.trim()));
 step('rail',{rail:report.rail});
 // "Watch on the TV": the same video in YouTube's own player, over the game; closing it gives the game back.
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-2.45,1.7,.95],at:[-3.507,2.1,.716]};a.render();});
 // force: a real press, without Playwright's wait for two steady animation frames (each takes seconds in software).
 if(await page.locator('#tvButton:not([hidden])').count()===0)step('no TV button: the set has no YouTube video (it fell back to its film)');
 else await page.locator('#tvButton:not([hidden])').click({timeout:20000,force:true}).catch(async error=>report.errors.push('no TV button: '+error.message.split('\n')[0]+' '+JSON.stringify(await page.evaluate(()=>{const b=document.querySelector('#tvButton'),r=b.getBoundingClientRect(),s=getComputedStyle(b),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {hidden:b.hidden,cls:b.className,rect:[r.left,r.top,r.width,r.height],opacity:s.opacity,visibility:s.visibility,pe:s.pointerEvents,top:top&&(top.id||top.className)};}))));
 await page.waitForTimeout(1500);
 const viewer=await page.evaluate(()=>{const f=document.querySelector('#activity .youtube-viewer');if(!f)return null;const r=f.getBoundingClientRect();const b=document.querySelector('#activityActions button')?.getBoundingClientRect();return {src:f.src,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),allInView:r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth&&(!b||b.top>=r.bottom),paused:window.__JOHANSSON_AUDIT__.blocked};});
 if(viewer){const png=await page.screenshot();await writeFile(resolve(out,'watch-on-the-tv.png'),png);tiles.push({label:'Watch on the TV · '+viewer.width+' × '+viewer.height+' px',png});}
 await page.evaluate(()=>document.querySelector('#closeActivity')?.click());await page.waitForTimeout(300);
 report.viewer={...viewer,closed:await page.evaluate(()=>!document.querySelector('#activity .youtube-viewer')&&document.querySelector('#activity').classList.contains('hidden'))};
 step('watch on the TV',report.viewer);
 if(!YOUTUBE){
  // Listening: the stand-in records the calls the set makes.
  const listened=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-2.45,1.7,.95],at:[-3.507,2.1,.716]};a.render();return a.televisionListen();});
  step('listen',{unmuted:listened,calls:await page.evaluate(()=>window.__tvStub.calls.slice(-6))});
 }
 report.stub=await page.evaluate(()=>window.__tvStub?.calls.slice(0,40)||null);
 report.final=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.television);step('the set at the end',{phase:report.final?.phase,failure:report.final?.failure,errors:report.final?.errors,states:report.final?.states});
 // A sheet of the shots, two a row.
 const sheet=await page.evaluate(async t=>{const w=590,h=410,c=document.createElement('canvas');c.width=w*2;c.height=h*Math.ceil(t.length/2);const x=c.getContext('2d');x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<t.length;i++){const img=new Image();img.src='data:image/png;base64,'+t[i].png;await img.decode();const k=Math.min(w/img.width,(h-22)/img.height),dw=img.width*k,dh=img.height*k;x.drawImage(img,(i%2)*w+(w-dw)/2,Math.floor(i/2)*h+22+(h-22-dh)/2,dw,dh);
   x.fillStyle='rgba(255,255,255,.88)';x.fillRect((i%2)*w,Math.floor(i/2)*h,w,22);x.fillStyle='#111';x.font='14px sans-serif';x.fillText(t[i].label,(i%2)*w+6,Math.floor(i/2)*h+16);}
  return c.toDataURL('image/jpeg',.85).split(',')[1];},tiles.map(t=>({label:t.label,png:t.png.toString('base64')})));
 await writeFile(resolve(out,'sheet.jpg'),Buffer.from(sheet,'base64'));step('sheet written');
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({shots:report.shots.length,errors:report.errors}));
