// Photographs Umi-no-yu's coin massage chair in the running game, from the views the chair work needs (briefs/NEXT.md §5;
// the creator, 2026-10-10: "The chair needs to be clearer in the comic it's a bit blurry we don't see what Fujita is
// wanting to sit on"): the lobby wide by evening and at night, the chair close from both sides, the coin box, the blackout,
// residents and Fujita in it, the player in it from the game's own camera, the colliders from above, the floor at its foot,
// the offering, a phone held upright, and the chair in Johansson Studio's Build scene.
//
//   node tools/chair-look.mjs [out-dir] [--source] [--before=<git rev>] [--only=regex] [--seating=dir]
//
// --source serves the source tree (src/boot.js) instead of the built runtime, so a change can be looked at before the
// runtime is rebuilt (the residents are posed with the town's own avatar modules, which needs the source tree).
// --before=<rev> serves the chair batch's own files (BATCH) as they were at that revision and everything else as it is
// now: the same views of the room before the change, beside other work in progress.
// --seating=dir also runs tools/seating-audit.mjs on the chair against the same server (sit, stand, walk away).
// Writes 960 × 675 JPEGs (the phone view 390 × 844), and report.json: each view's renderInfo (one render's draw calls and
// triangles) and what the chair itself costs (its meshes and the room's parts on it: draws and triangles).
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/chair-look'));
await mkdir(out,{recursive:true});
const SOURCE=args.includes('--source'),ONLY=flag('only')?new RegExp(flag('only')):null,SEATING=flag('seating'),BEFORE=flag('before');
// The files the chair batch changed (site paths): with --before they are served as they were at that revision.
const BATCH=['johansson-town/src/world/interiors/onsen.js','johansson-town/src/world/interiors/onsen-electrics.js','johansson-town/src/world/interiors/onsen-props.js','johansson-town/src/game.js','avatar-creator/scene-world.js'];
const atRevision=rel=>BEFORE&&BATCH.includes(rel)?execFileSync('git',['show',BEFORE+':'+rel],{cwd:site,maxBuffer:64<<20}):null;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.wasm':'application/wasm','.hdr':'application/octet-stream'};
/** The page, pointed at the source graph rather than the hashed runtime chunks. */
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
// A bare page with Johansson Studio's base (avatar-creator/index.html), for its Build scene's world (scene-world.js).
const STUDIO_PAGE='<!doctype html><meta charset="utf-8"><base href="/johansson-town/"><canvas id="c" width="960" height="675"></canvas>';
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 if(path==='/__chair-look-studio.html'){res.writeHead(200,{'content-type':'text/html'});res.end(STUDIO_PAGE);return;}
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=atRevision(file.slice(site.length+1))??await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;

// The chair as the room has had it (onsen.js before the catalogue): its footprint, drawn red on the collider view.
const OLD_RECT={x:4.505,z:3.55,w:.61,d:.9};
const MARKS={sit:[4.25,3.55],stand:[3.4,3.55],coin:[3.72,3.3]};
const WIDE=[[-1,1.55,4.55],[4.4,.7,3.45]],LEFT=[[3.15,1.25,4.45],[4.45,.62,3.6]],RIGHT=[[3.3,1.05,2.8],[4.3,.62,3.35]];
const EVENING=18*60+30,NIGHT=21*60+30,NOON=12*60;
const sitAt={at:[4.25,0,3.55],yaw:Math.PI/2,seatHeight:.5};
/** The views (the plan's §7). `power` stages the electrics' moment, `timer` holds the coin timer, `props` the story's props. */
const SHOTS=[
 {name:'01-lobby-wide',minutes:EVENING,power:'rest',cam:WIDE},
 {name:'02-lobby-wide-night',minutes:NIGHT,power:'quiet',cam:WIDE},
 {name:'03-chair-front-left',minutes:EVENING,power:'rest',cam:LEFT},
 {name:'04-chair-front-right',minutes:NIGHT,power:'quiet',timer:'9:58',cam:RIGHT},
 {name:'05-coin-box',minutes:NIGHT,power:'last-straw',cam:[[3.72,.78,3.02],[4.205,.62,3.15]]},
 {name:'06-blackout',minutes:NIGHT,power:'blackout',cam:RIGHT},
 {name:'07a-fujita-sit',minutes:NIGHT,power:'quiet',cam:[[2.85,.85,3.35],[4.35,.95,3.55]],people:[{who:'Mr Fujita',outfit:'afterbath',pose:'Sit',...sitAt}]},
 {name:'07b-fujita-uncurl',minutes:NIGHT,power:'last-straw',cam:[[2.85,.85,3.35],[4.35,.95,3.55]],people:[{who:'Mr Fujita',outfit:'afterbath',pose:'ChairUncurl',uncurl:.45,...sitAt}]},
 {name:'07c-fujita-frozen',minutes:NIGHT,power:'restored',cam:[[2.85,.85,3.35],[4.35,.95,3.55]],people:[{who:'Mr Fujita',outfit:'afterbath',pose:'FrozenAbsurd',...sitAt}]},
 {name:'07d-fujita-side',minutes:NIGHT,power:'quiet',cam:[[3.55,1.05,4.6],[4.4,.75,3.6]],people:[{who:'Mr Fujita',outfit:'afterbath',pose:'ChairUncurl',uncurl:.45,...sitAt}]},
 {name:'08a-harbour-master',minutes:NIGHT,power:'quiet',cam:LEFT,people:[{who:'Harbour master',outfit:'afterbath',pose:'Sit',...sitAt}]},
 {name:'08b-fumiko',minutes:NIGHT,power:'quiet',cam:LEFT,people:[{who:'Fumiko',outfit:'afterbath',pose:'Sit',...sitAt}]},
 {name:'08c-fumiko-side',minutes:NIGHT,power:'quiet',cam:RIGHT,people:[{who:'Fumiko',outfit:'afterbath',pose:'Sit',...sitAt}]},
 {name:'09-player-seated',minutes:NIGHT,power:'quiet',player:true},
 {name:'09b-player-coin',minutes:NIGHT,power:'rest',player:true,coin:true},
 {name:'10-colliders-top',minutes:NOON,power:'rest',cam:[[3.9,5.5,3.0],[3.9,0,3.01]],hide:['Lobby ceiling'],overlay:true},
 {name:'11-floor-at-chair',minutes:NOON,power:'rest',cam:[[3.2,.14,3.62],[4.6,.03,3.6]]},
 {name:'12a-offering-full',minutes:NIGHT,power:'quiet',props:{offering:'full'},cam:RIGHT},
 {name:'12b-offering-empty',minutes:NIGHT,power:'quiet',props:{offering:'empty'},cam:[[3.75,1.2,2.75],[4.45,.72,3.15]]},
 {name:'13-phone-portrait',minutes:EVENING,power:'rest',cam:WIDE,size:[390,844]},
 {name:'14-studio-build-scene',studio:true,cam:LEFT},
 // The ground at the chair's end of the lobby (the agarikamachi turns at x 3.0): the genkan from the street door, and the
 // turn from above, the stone west of it and the lobby's hinoki carried on to the street wall east of it.
 {name:'15-genkan-from-door',minutes:EVENING,power:'rest',cam:[[-.2,1.62,4.8],[3.2,.1,3.75]]},
 {name:'16-genkan-turn-above',minutes:NOON,power:'rest',cam:[[2.2,2.3,4.55],[3.7,0,4.0]],hide:['Lobby ceiling']},
];
const wanted=s=>!ONLY||ONLY.test(s.name);
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={source:SOURCE,before:BEFORE||null,shots:[]};
try{
 const context=await browser.newContext({viewport:{width:960,height:675},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'18:30',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);
 page.on('pageerror',e=>console.warn('Page error:',e.message));
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.warn('['+m.type()+']',m.text().slice(0,300));});
 const town=SHOTS.filter(s=>!s.studio).some(wanted);
 if(town){
  await page.goto(`${origin}/johansson-town/?audit&visual-audit`);
  await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:900000});
  await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);
  const t0=Date.now();
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('onsen');});
  await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.layout?.power&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  // The room says when everything it waits for is in (the catalogue's models): `ready`, where it has one.
  const ready=await page.evaluate(async()=>{const r=window.__JOHANSSON_AUDIT__.layout.ready;return r?await r:'(no ready)';});
  console.log('in Umi-no-yu after',((Date.now()-t0)/1000).toFixed(1),'s; ready:',ready);
  await page.waitForTimeout(1500);
 }
 let size=[960,675];
 const resize=async s=>{if(s[0]===size[0]&&s[1]===size[1])return;await page.setViewportSize({width:s[0],height:s[1]});size=s;
  await page.waitForFunction(([w,h])=>{let c=null;window.__JOHANSSON_AUDIT__.scene.traverse(o=>{if(!c&&o.isPerspectiveCamera)c=o;});return c&&Math.abs(c.aspect-w/h)<1e-3;},s);};
 const save=async name=>{await page.waitForTimeout(400);await page.locator(size[0]===960?'#game':'#game').screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:86});};
 for(const s of SHOTS){
  if(!wanted(s))continue;
  if(s.studio){
   // Johansson Studio's Build scene builds World's room with World's code (avatar-creator/scene-world.js): the chair as it
   // shows there, lit and cel-shaded the way the Studio does it, and the seat key a scene saves its sitter by.
   const st=await context.newPage();st.on('pageerror',e=>console.warn('Studio page error:',e.message));
   await st.goto(`${origin}/__chair-look-studio.html`);
   const info=await st.evaluate(async([pos,at])=>{
    const THREE=await import('/johansson-town/vendor/three.module.js'),{buildSceneWorld}=await import('/avatar-creator/scene-world.js');
    const views=await (await fetch('/johansson-town/assets/images/feed/views.json')).json();
    const w=await buildSceneWorld('onsen',views);
    const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});renderer.setSize(960,675,false);renderer.shadowMap.enabled=true;
    const cam=w.camera.clone();cam.aspect=960/675;cam.position.set(...pos);cam.lookAt(...at);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
    renderer.render(w.scene,cam);
    let chair=null;w.scene.traverse(o=>{if(o.name==='Coin massage chair'&&!o.isMesh)chair=o;});
    return {seats:w.seats.map(x=>x.id),chair:!!chair,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
   },s.cam);
   await st.locator('#c').screenshot({path:resolve(out,s.name+'.jpg'),type:'jpeg',quality:86});await st.close();
   console.log(s.name,JSON.stringify(info));report.shots.push({name:s.name,...info});continue;
  }
  await resize(s.size||[960,675]);
  const info=await page.evaluate(async s=>{
   const a=window.__JOHANSSON_AUDIT__,THREE=await import('/johansson-town/vendor/three.module.js');
   // Whatever an earlier view set up goes first: its cast, its overlay, what it hid, the player out of the chair.
   for(const c of window.__chairCast||[]){c.holder.removeFromParent();c.avatar.dispose?.();}window.__chairCast=[];
   window.__chairOverlay?.removeFromParent();window.__chairOverlay=null;
   for(const o of window.__chairHidden||[])o.visible=true;window.__chairHidden=[];
   // Standing up: from the massage chair the action opens its coin menu, whose Stand up button stands.
   const standUp=()=>{if(!a.seated)return;a.interact();[...document.querySelectorAll('#activityActions button')].find(b=>b.textContent==='Stand up')?.click();};
   standUp();
   a.setTime(s.minutes);a.layout.power.stage(s.power);a.layout.power.chairTimer(s.timer??null);
   if(s.timer)a.layout.power.chairTimer(s.timer);
   a.layout.props.stage({offering:'none',...(s.props||{})});
   a.step(300);
   // The town's own people stay out of these photographs: Miss Higa on the bandai is part of the room; the bathers and the
   // player are not (the player only where the view is his).
   const hide=o=>{if(o&&o.visible){o.visible=false;window.__chairHidden.push(o);}};
   for(const p of a.world.people||[])hide(p.g);
   for(const h of [a.hands,a.hands?.group,a.hands?.root])if(h?.isObject3D)hide(h);
   if(!s.player)hide(a.johansson?.root);
   for(const name of s.hide||[])hide(a.room.getObjectByName(name));
   // The residents in the chair: World's own avatars, in their after-bath clothes, posed by World's own animator.
   if(s.people){
    const [{buildAvatar},{recipeFor},{createAvatarAnimator}]=await Promise.all([import('/johansson-town/src/avatars/build.js'),import('/johansson-town/src/avatars/cast.js'),import('/johansson-town/src/avatars/animate.js')]);
    for(const p of s.people){
     const avatar=buildAvatar(recipeFor(p.who),{shadows:true,faceSize:256});avatar.wear(p.outfit);
     const holder=new THREE.Group();holder.name='Chair look: '+p.who;holder.position.set(...p.at);holder.rotation.y=p.yaw;holder.add(avatar.root);a.room.add(holder);
     let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
     const animator=createAvatarAnimator(avatar,{random});
     const state={speed:0,seated:true,seatHeight:p.seatHeight,pose:p.pose,...(Number.isFinite(p.uncurl)?{uncurl:p.uncurl}:{})};
     for(let i=0;i<240;i++){animator.update(1/60,state);avatar.springs?.update(1/60);}
     window.__chairCast.push({holder,avatar});
    }
   }
   // The player sits in it by the room's own prompt (the game's own seating), and is looked at from in front and to the
   // side as tools/seating-audit.mjs looks at a seated player.
   if(s.player){
    const used=a.use('Sit in the massage chair (¥100)');a.step(600);
    // The coin from the seat (batch D): the action opens the chair's menu, a ¥100 coin goes in, and the LED counts down.
    let coin=null;
    if(s.coin){const press=label=>[...document.querySelectorAll('#activityActions button')].find(b=>b.textContent===label)?.click();
     const before=a.layout.power.chairTimer().reads;a.interact();const menu=[...document.querySelectorAll('#activityActions button')].map(b=>b.textContent);
     press('Put in a ¥100 coin');const said=document.querySelector('#activityBody')?.textContent;press('Keep sitting');a.step(3000);
     coin={before,menu,said,after:a.layout.power.chairTimer(),prompt:document.querySelector('#prompt')?.textContent};}
    if(a.johansson?.root){a.johansson.root.visible=true;window.__chairHidden=window.__chairHidden.filter(o=>o!==a.johansson.root);}
    a.camera=s.coin?{pos:[3.45,1.05,2.85],at:[4.2,.75,3.4]}:{pos:[2.55,1.3,4.15],at:[4.25,.8,3.55]};a.renderer.info.reset();a.render();
    return {used,seat:a.seat,coin,info:a.renderInfo,chair:chairCost()};
   }
   // The colliders from above: the old chair's rectangle red, the chair's own (from its card) cyan, the rest of the room's
   // yellow; the sit mark green, the stand spot (the player's 0.28 m) blue, the film's coin mark magenta; and walking
   // probes of the nook by the cooler (green where a body fits, red where it does not).
   const probes=[];
   // What the chair costs a phone, as drawn: its meshes and the room's own parts on it (not its socket or raceway).
   function chairCost(){let draws=0,triangles=0;a.room.traverse(o=>{if(!o.isMesh)return;let mine=false;
     for(let p=o;p;p=p.parent){if(!p.visible)return;if(/^(Massage chair|Coin massage chair|Catalogue asset massage-chair)/.test(p.name)&&!/socket|raceway/i.test(p.name))mine=true;}
     if(!mine)return;draws++;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3;});return {draws,triangles};}
   if(s.overlay){
    const g=new THREE.Group();g.name='Chair look overlay';g.renderOrder=999;window.__chairOverlay=g;a.room.add(g);
    const line=(pts,color,y=.03)=>{const geo=new THREE.BufferGeometry().setFromPoints(pts.map(([x,z])=>new THREE.Vector3(x,y,z)));
     const l=new THREE.LineLoop(geo,new THREE.LineBasicMaterial({color,depthTest:false,transparent:true}));l.renderOrder=999;g.add(l);};
    const rect=(c,color,y)=>{const co=Math.cos(c.yaw||0),si=Math.sin(c.yaw||0),corner=(u,v)=>[c.x+u*co+v*si,c.z-u*si+v*co];
     line([corner(-c.w/2,-c.d/2),corner(c.w/2,-c.d/2),corner(c.w/2,c.d/2),corner(-c.w/2,c.d/2)],color,y);};
    const ring=([x,z],r,color)=>{const pts=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;pts.push([x+Math.cos(t)*r,z+Math.sin(t)*r]);}line(pts,color,.04);};
    for(const c of a.layout.colliders){if(c.x<2.4||c.z<1.5||c.only)continue;rect(c,c.asset?0x00e5ff:0xffd23f,.035);}
    rect(s.OLD_RECT,0xff2a2a,.05);
    ring(s.MARKS.sit,.05,0x22dd44);ring(s.MARKS.stand,.28,0x2a6bff);ring(s.MARKS.coin,.05,0xff2ad4);ring(s.MARKS.coin,.25,0xff2ad4);
    for(const [x,z] of [[3.75,2.9],[3.9,2.88],[4.0,2.95],[3.8,3.0],[4.62,2.9],[4.62,2.86],[3.4,3.55],[3.72,3.3],[3.95,3.55]]){
     const n=a.navigation(x,z,.28),ok=!n.staticBlocked;probes.push({x,z,ok,solids:n.solids.length});
     const m=new THREE.Mesh(new THREE.CircleGeometry(.03,12),new THREE.MeshBasicMaterial({color:ok?0x22dd44:0xff2a2a,depthTest:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.06,z);m.renderOrder=1000;g.add(m);}
   }
   a.camera={pos:s.cam[0],at:s.cam[1]};a.renderer.info.reset();a.render();
   return {info:a.renderInfo,chair:chairCost(),probes,timer:a.layout.power.chairTimer(),offering:a.layout.props.state.offering};
  },{...s,OLD_RECT,MARKS});
  await save(s.name);
  console.log(s.name,JSON.stringify(info));report.shots.push({name:s.name,...info});
  if(s.player)await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;if(a.seated){a.interact();[...document.querySelectorAll('#activityActions button')].find(b=>b.textContent==='Stand up')?.click();}});
 }
 // The colliders the room ends up with near the chair, and what the card put there.
 if(town)report.colliders=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.layout.colliders.filter(c=>c.x>3.6&&c.z>2.6&&c.z<4.3).map(c=>({...c})));
 if(SEATING){
  await new Promise((done,fail)=>{const child=spawn(process.execPath,[resolve(root,'tools/seating-audit.mjs'),'--url',`${origin}/johansson-town/`,'--mode','rooms','--rooms','onsen','--labels','massage','--output',resolve(SEATING)],{stdio:'inherit'});
   child.on('exit',code=>code===0?done():fail(Error('seating audit exited '+code)));});
 }
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close();}
