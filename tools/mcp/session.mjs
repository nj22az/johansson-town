import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {serveGame} from './static-server.mjs';
import {analyseGrid} from './navigation.mjs';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
/** index.html with its compiled entry points (runtime/) pointed back at the source modules they are built from. */
export const sourceIndex=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/\.\/runtime\/boot-[A-Za-z0-9_-]+\.js/g,'./src/boot.js').replace(/\.\/runtime\/audio-[A-Za-z0-9_-]+\.js/g,'./src/audio/town-audio.js')
 .replace(/\.\/runtime\/feed-[A-Za-z0-9_-]+\.js/g,'./src/feed/mount.js').replace(/\.\/runtime\/portraits-[A-Za-z0-9_-]+\.js/g,'./src/avatars/guide-portraits.js');
export class TownAuditSession{
 constructor({launch=options=>chromium.launch(options),serve=serveGame}={}){this.launch=launch;this.serve=serve;this.generation=0;this.stopping=false;this.page=null;this.history=[];this.errors=[];this.findings=[];this.closing=false;}
 async start({viewport='desktop',spawn='fish-auction',headless=true,time='12:00',source=false}={}){
  await this.close();if(this.stopping)throw Error('Test server is closing.');
  this.closing=false;this.errors=[];this.history=[];this.findings=[];const generation=this.generation;
  let preview,browser,context,page;const check=()=>{if(this.stopping||generation!==this.generation)throw Error('Test session startup was cancelled.');};
  try{
   preview=await this.serve(root);check();this.preview=preview;
   browser=await this.launch({headless,args:process.platform==='darwin'?['--use-angle=metal']:[]});check();this.browser=browser;
   context=await browser.newContext({viewport:viewport==='phone'?{width:390,height:844}:{width:1280,height:800},isMobile:viewport==='phone',hasTouch:viewport==='phone',serviceWorkers:'block'});check();this.context=context;
   await context.addInitScript(start=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start,speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};},time);check();
   page=await context.newPage();check();this.page=page;page.setDefaultTimeout(240000);
   const record=item=>{if(generation===this.generation&&!this.closing)this.errors.push(item);};
   page.on('pageerror',e=>record({type:'page',message:e.message}));
   page.on('console',m=>{if(m.type()==='error')record({type:'console',message:m.text()});});
   page.on('response',r=>{if(r.status()>=400)record({type:'asset',message:`${r.status()} ${r.url()}`});});
   page.on('requestfailed',r=>record({type:'request',message:`${r.url()} ${r.failure()?.errorText}`}));
   const url=new URL(preview.url);url.searchParams.set('audit','');url.searchParams.set('spawn',spawn);
   // source: the game straight from src/ (each module as it is on disk), so a change can be walked before runtime/ is
   // rebuilt. Only the page's own index.html is rewritten, and only in this private session; it is slower to start.
   // (A start may take minutes on a busy machine, from source or not, so it waits up to ten.)
   if(source)await page.route(u=>u.origin===url.origin&&u.pathname===url.pathname,async route=>{const r=await route.fetch();route.fulfill({response:r,body:sourceIndex(await r.text())});});
   await page.goto(url.href,{waitUntil:'domcontentloaded'});check();await page.locator('#enter').click({timeout:600000});check();
   await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&window.__JOHANSSON_AGENT_API__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:600000});check();
   await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.frozen=true;window.__JOHANSSON_AUDIT__.renderFrozen=false;window.__JOHANSSON_AUDIT__.step(0);});check();
   return await this.observe();
  }catch(error){
   await Promise.allSettled([browser?.close(),preview?.close()]);
   if(this.browser===browser)this.browser=null;if(this.preview===preview)this.preview=null;if(this.page===page)this.page=null;if(this.context===context)this.context=null;
   if(this.errors.length)error.message+='; browser evidence: '+JSON.stringify(this.errors.slice(-5));
   throw error;
  }
 }
 requirePage(){if(!this.page)throw Error('Start a test session first.');return this.page;}
 async observe(){
  const result=await this.requirePage().evaluate(()=>{
   const a=window.__JOHANSSON_AUDIT__,state=JSON.parse(window.render_game_to_text()),invalid=[];
   a.scene.updateMatrixWorld(true);a.scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))invalid.push(o.name||o.type);});
   const people=[...a.world.people,...(a.world.neighbours||[]).filter(g=>!a.world.people.some(p=>p.g===g)).map(g=>({g}))];
   const residents=people.map(p=>{const g=p.g,u=g.userData,position=g.getWorldPosition(g.position.clone()).toArray();let visible=true;for(let o=g;o;o=o.parent)if(!o.visible)visible=false;return {name:p.profile?.name||u.name||g.name,position,visible,parent:g.parent?.name,activity:u.activity,pose:u.socialPose,indoors:u.indoors,inVehicle:u.inVehicle,inBookshop:u.inBookshop,inMarket:u.inMarket,inWorkplace:u.inWorkplace};});
   const speechBubbles=[...document.querySelectorAll('#activity.conversation.rpg #activityBody,.neighbour-chat')].filter(e=>!e.hidden&&e.getClientRects().length&&!e.querySelector('.chat-input,.chat-log')).map(e=>{
    const line=e.matches('.neighbour-chat')?e.querySelector('span'):e.querySelector(document.querySelector('#activity').classList.contains('player-speaking')?'.rpg-own':'.rpg-line');
    return {kind:e.matches('.neighbour-chat')?'ambient':'conversation',side:e.dataset.balloonSide,tail:e.dataset.balloonTail,box:e.getBoundingClientRect().toJSON(),text:line?.textContent,fullText:line?.dataset.fullLine||line?.textContent,scrollable:e.dataset.balloonOverflow==='true',protectedActors:e.balloonActors||[]};
   });
   return {game:state,ui:window.__JOHANSSON_AGENT_API__.getState(),view:a.mouse,blocked:a.blocked,paused:a.paused,seated:a.seated,nearby:a.near(),sites:a.sites,targets:a.targets,roomNavigation:a.roomNavigation,homeDirectory:a.homeDirectory,walkingDirections:a.walkingDirections,landmarks:(a.world.landmarks||[]).map(s=>({id:s.id,title:s.title,x:s.x,z:s.z,door:s.door})),residents,speechBubbles,shop:a.shop,vehicles:a.world.traffic.snapshot(),ferry:{phase:a.world.ferry.phase,berth:a.world.ferry.berth,position:a.world.ferry.ferry.position.toArray(),yaw:a.world.ferry.ferry.rotation.y,destination:a.world.ferry.destination,progress:a.world.ferry.crossingProgress,loading:a.world.ferry.loadingVehicles,canLoad:a.world.ferry.canLoad,canUnload:a.world.ferry.canUnload,operation:a.world.ferry.operation,crew:a.ferryCrew,plant:a.world.ferry.plant?.readings(),completedVoyages:a.world.ferry.completedVoyages,view:(()=>{const e=document.getElementById('ferryOperations');return e&&!e.hidden?{open:e.open,box:e.getBoundingClientRect().toJSON(),text:e.innerText}:null;})()},playerClearance:a.navigation(state.player[0],state.player[2]),invalidTransforms:invalid};
  });return {...result,errors:this.errors.slice(-30),recentInputs:this.history.slice(-20)};
 }
 async controlState(){return this.requirePage().evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {game:JSON.parse(window.render_game_to_text()),view:a.mouse,blocked:a.blocked,paused:a.paused,seated:a.seated,ui:{activity:!document.querySelector('#activity').classList.contains('hidden')}};});}
 async input({control,durationMs=300,run=false,_compact=false}){
  const page=this.requirePage(),before=await (_compact?this.controlState():this.observe());
  const b=before.blocked,locked=before.paused||b.catchingUp||b.roomLoading||b.camera||b.inspector||b.viewer||b.photo||b.directory||b.hidden||!!before.game.island?.cinematic;
  if(locked&&!['interact','close','directory'].includes(control))return {accepted:false,reason:'Controls are blocked by the current game view or activity.',before};
  if(control==='close'&&b.viewer){await page.locator('.iv-close').click();return {accepted:true,before,after:await this.observe()};}
  if(control==='close'&&b.photo&&await page.locator('#photoStudio [data-close]').isVisible()){await page.locator('#photoStudio [data-close]').click();return {accepted:true,before,after:await this.observe()};}
  if(control==='close'&&before.ui.activity){await page.locator('#closeActivity').click();return {accepted:true,before,after:await this.observe()};}
  const codes={forward:'KeyW',backward:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',interact:'KeyE',close:'Escape',directory:'KeyQ',view:'KeyV'};const code=codes[control];
  if(run)await page.keyboard.down('ShiftLeft');
  await page.keyboard.down(code);
  try{await page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),durationMs);}finally{await page.keyboard.up(code);if(run)await page.keyboard.up('ShiftLeft');}
  await page.waitForTimeout(20);const after=await (_compact?this.controlState():this.observe());
  const coordinateFrameChanged=before.game.room!==after.game.room,displacement=coordinateFrameChanged?null:Math.hypot(...after.game.player.map((v,i)=>v-before.game.player[i]));
  this.history.push({control,durationMs,run,from:before.game.player,to:after.game.player,fromRoom:before.game.room,toRoom:after.game.room,displacement,coordinateFrameChanged});
  return {accepted:true,displacement,moved:!coordinateFrameChanged&&displacement>.01,coordinateFrameChanged,before,after};
 }
 async look({degrees=45,verticalDegrees=0,_compact=false}){
  const page=this.requirePage(),before=await (_compact?this.controlState():this.observe()),b=before.blocked;
  if(before.paused||b.catchingUp||b.roomLoading||b.camera||b.inspector||b.viewer||b.photo||b.directory||b.hidden||before.game.island?.cinematic)return {accepted:false,reason:'Camera controls are blocked.',before};
  const box=await page.locator('#game').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  let dx=-degrees*Math.PI/180/.0023,dy=verticalDegrees*Math.PI/180/.0018;
  for(let i=0;i<20&&(Math.abs(dx)>.1||Math.abs(dy)>.1);i++){
   const px=Math.max(-120,Math.min(120,dx)),py=Math.max(-100,Math.min(100,dy));
   await page.mouse.move(x,y);await page.mouse.down({button:'right'});await page.mouse.move(x+px,y+py);await page.mouse.up({button:'right'});dx-=px;dy-=py;
  }
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(17));
  this.history.push({control:'look',degrees,verticalDegrees});return {accepted:true,before,after:await (_compact?this.controlState():this.observe())};
 }
 async choose({label}){
  const page=this.requirePage(),buttons=await page.locator('#activityActions button:visible:not(:disabled), #activity .bag-tile:visible:not(:disabled), #activity .resident-list button:visible:not(:disabled)').all();
  const button=(await Promise.all(buttons.map(async b=>({b,text:(await b.textContent()).trim()})))).find(o=>o.text===label);
  if(!button)return {accepted:false,reason:'No enabled action with that exact label.',state:await this.observe()};
  await button.b.click();await page.waitForTimeout(70);this.history.push({control:'choose',label});return {accepted:true,state:await this.observe()};
 }
 /** Search and select the Town Book through its visible controls, exactly as a player does. */
 async directory({section='people',query='',action='search',id}={}){
  const page=this.requirePage();
  if(await page.locator('#directory').evaluate(e=>e.classList.contains('hidden')))await page.locator('#directoryButton').click();
  const details=page.locator('.menu-places');if(!await details.getAttribute('open')){
   if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
  }
  const tab=page.locator(`button[data-town-filter="${section}"]`);if(!await tab.isVisible())return {accepted:false,reason:'The searchable Town Book is unavailable.',state:await this.observe()};
  await tab.click();await page.locator('.town-search').fill(query);
  if(action!=='search'){
   const attribute={show_home:'data-show-home',find_person:'data-find-person',directions:'data-id',shortcut:'data-shortcut'}[action];
   const buttons=await page.locator(`.town-cards button[${attribute}]:visible:not(:disabled)`).all();
   let chosen=null;for(const b of buttons)if(await b.getAttribute(attribute)===id){chosen=b;break;}
   if(!chosen)return {accepted:false,reason:'No visible enabled Town Book action matches that id.',state:await this.observe()};
   await chosen.click();await page.waitForTimeout(70);
   if(action!=='shortcut')await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.walkingDirections?.status!=='searching',null,{timeout:120000});
  }
  this.history.push({control:'directory',section,query,action,id});
  const cards=await page.locator('.town-cards article').allTextContents();
  return {accepted:true,cards,state:await this.observe()};
 }
 async grid({x,z,width=12,depth=12,cell=.5,radius=.28}){
  const columns=Math.floor(width/cell)+1,rows=Math.floor(depth/cell)+1;if(columns*rows>4096)throw Error('Navigation grid exceeds 4096 cells; inspect a smaller region.');
  const minX=x-width/2,minZ=z-depth/2;
  const {cells,blockedEdges}=await this.requirePage().evaluate(async({minX,minZ,columns,rows,cell,radius})=>{
   const cells=[],a=window.__JOHANSSON_AUDIT__;for(let j=0;j<rows;j++)for(let i=0;i<columns;i++)cells.push(a.navigation(minX+i*cell,minZ+j*cell,radius));
   const {sampleGridEdges}=await import('/johansson-town/tools/mcp/navigation.mjs');
   return {cells,blockedEdges:sampleGridEdges(cells,columns,rows,(x,z)=>a.navigation(x,z,radius))};
  },{minX,minZ,columns,rows,cell,radius});
  const state=await this.observe(),p=state.game.player,startX=Math.round((p[0]-minX)/cell),startZ=Math.round((p[2]-minZ)/cell),startIndex=startX>=0&&startX<columns&&startZ>=0&&startZ<rows?startZ*columns+startX:-1;
  return {coordinates:state.game.coordinates,columns,rows,cell,radius,startIndex,blockedEdges,edgeProbeSpacing:.05,...analyseGrid(cells,columns,rows,startIndex,blockedEdges),note:'Static grid checks cell centers and every connecting segment at5cm spacing against standing clearance and steps. Residents are reported separately; actual walking still needs a controls test.'};
 }
 async walk({x,z,maxSeconds=20,tolerance=.3}){
  const before=await this.observe(),initialRoom=before.game.room;
  const steps=[];let spent=0,stalled=0;
  while(spent<maxSeconds){
   const s=await this.controlState();if(s.game.room!==initialRoom)return {reached:false,roomChanged:true,before,after:s,steps};const p=s.game.player,dx=x-p[0],dz=z-p[2],distance=Math.hypot(dx,dz);if(distance<tolerance)return {reached:true,before,after:await this.observe(),steps};
   const target=Math.atan2(-dx,-dz);let delta=target-s.view.yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
   const turn=Math.abs(delta)>.005?await this.look({degrees:delta*180/Math.PI,_compact:true}):{accepted:true};if(!turn.accepted)return {reached:false,reason:turn.reason,state:s,steps};
   const durationMs=Math.min(750,distance/3*1000),move=await this.input({control:'forward',durationMs,_compact:true});spent+=durationMs/1000;
   steps.push({from:p,to:move.after?.game.player,displacement:move.displacement,durationMs});
   if(!move.accepted)return {reached:false,reason:move.reason,state:s,steps};
   stalled=move.displacement<.015?stalled+1:0;if(stalled>=4)return {reached:false,reason:'Real movement stalled. Inspect the collision grid and screenshot before classifying this as a bug.',before,after:move.after,steps};
  }
  return {reached:false,reason:'Bounded walking budget exhausted.',before,after:await this.observe(),steps};
 }
 async follow({points,maxSeconds=120}){
  const before=await this.observe(),route=[];let budget=maxSeconds;
  for(const point of points){
   const current=await this.controlState();if(current.game.room!==before.game.room)return {reached:false,roomChanged:true,before,after:current,route,reason:'A doorway changed the coordinate frame.'};
   const result=await this.walk({...point,maxSeconds:Math.min(60,budget),tolerance:.12});route.push({point,...result});
   budget-=result.steps?.reduce((n,s)=>n+(s.durationMs||250)/1000,0)||0;
   if(!result.reached)return {reached:false,before,after:await this.observe(),route,reason:result.reason||'A doorway changed the coordinate frame.',roomChanged:result.roomChanged};
   if(budget<=0)return {reached:false,before,after:await this.observe(),route,reason:'Bounded route budget exhausted.'};
  }
  return {reached:true,before,after:await this.observe(),route};
 }
 async ui({control}){
  if(control==='ferry_operations'&&await this.requirePage().locator('#directory').evaluate(e=>e.classList.contains('hidden')))await this.requirePage().locator('#directoryButton').click();
  const selectors={exit_room:'#exitRoomButton',close_activity:'#closeActivity',close_directory:'#closeDirectory',town_menu:'#directoryButton',settings:'#directory .menu-settings > summary',map:'#directory .menu-map > summary',map_scope:'#mapScope',field_book:'#notebookButton',clock:'#timeButton',weather:'#weatherButton',moves:'#movesButton',bag:'#bagButton',residents:'#residentRecordsButton',ferry_operations:'#ferryOperationsButton',close_ferry_operations:'#closeFerryOperations',ferry_sequence:'#ferryProcedureToggle',ferry_crew:'#ferryCrewToggle',ferry_reports:'#ferryReportsToggle'};
  if(['settings','field_book','clock','weather','moves','bag','residents','ferry_operations'].includes(control)){
   const tools=this.requirePage().locator('#directory .menu-tools:not([open]) > summary');
   if(await tools.isVisible())await tools.click();
  }
  if(['clock','weather'].includes(control)){
   const settings=this.requirePage().locator('#directory .menu-settings:not([open]) > summary');
   if(await settings.isVisible())await settings.click();
  }
  const button=this.requirePage().locator(selectors[control]);
  if(!await button.isVisible()||!await button.isEnabled())return {accepted:false,reason:'This normal game button is not currently available.',state:await this.observe()};
  await button.click();await this.page.waitForTimeout(250);this.history.push({control:'ui',button:control});
  return {accepted:true,state:await this.observe()};
 }
 async screenshot(){await this.requirePage().evaluate(()=>window.__JOHANSSON_AUDIT__.render());return this.requirePage().screenshot({type:'png'});}
 async wait({durationMs=1000}){await this.requirePage().evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),durationMs);await this.page.waitForTimeout(50);this.history.push({control:'wait',durationMs});return this.observe();}
 async report({summary,expected,observed,reproduction}){
  const folder=resolve(root,'../output/mcp-audit');await mkdir(folder,{recursive:true});
  const id=`${Date.now()}-${this.findings.length+1}`,image=resolve(folder,`${id}.png`),file=resolve(folder,`${id}.json`);
  await writeFile(image,await this.screenshot());const finding={id,summary,expected,observed,reproduction,state:await this.observe(),history:[...this.history],image};
  await writeFile(file,JSON.stringify(finding,null,2)+'\n');this.findings.push({...finding,file});return {id,file,image};
 }
 async close(){this.generation++;this.closing=true;const browser=this.browser,preview=this.preview;this.page=this.browser=this.context=this.preview=null;try{await browser?.close();}finally{await preview?.close();}return {closed:true};}
}
