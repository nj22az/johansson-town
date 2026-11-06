import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {decodeImage,readImage,validateEdit} from './policy.mjs';

const repository=fileURLToPath(new URL('../../../',import.meta.url));
/** One isolated, temporary Camera album. Never attaches to a personal browser or grants camera permission. */
export class CameraSession{
 constructor({root=repository,inputRoot=process.env.CAMERA_MCP_INPUT_DIR,launch,serve}={}){
  this.root=root;this.inputRoot=inputRoot;this.launch=launch;this.serve=serve;this.errors=[];this.generation=0;
 }
 requirePage(){if(!this.page)throw Error('Call camera_open first.');return this.page;}
 async open({headless=true}={}){
  if(this.page)throw Error('A session is already open. Export its photos and close it explicitly first.');
  const generation=++this.generation;let preview,browser;
  const check=()=>{if(this.generation!==generation)throw Error('Camera session startup was cancelled.');};
  try{
   const serve=this.serve||(await import('./preview.mjs')).serveCamera;
   preview=await serve({root:this.root});check();this.preview=preview;
   const launch=this.launch||((options)=>import('playwright').then(({chromium})=>chromium.launch(options)));
   browser=await launch({headless,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});check();this.browser=browser;
   this.context=await this.browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});check();
   const origin=new URL(this.preview.url).origin;
   // App scripts and approved image bytes stay local. No page can submit an image to an outside service.
   await this.context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await this.context.addInitScript(()=>{
    if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Hardware camera is not exposed by Camera MCP.','NotAllowedError');};
    localStorage.setItem('office-pocket-camera',JSON.stringify({sound:false,printer:false}));
   });
   this.page=await this.context.newPage();check();this.page.setDefaultTimeout(30000);this.errors=[];
   this.page.on('pageerror',error=>{this.errors.push(error.message);if(this.errors.length>20)this.errors.shift();});
   await this.page.goto(new URL('camera/',this.preview.url).href,{waitUntil:'domcontentloaded'});
   await this.page.waitForFunction(()=>!!window.pocketCamera,null,{timeout:60000});check();
   if(!await this.page.evaluate(()=>!!window.pocketCamera.engine&&!window.pocketCamera.engine.lost()))throw Error('Camera needs a working WebGL 2 renderer.');
   return {...await this.state(),albumLifetime:'Temporary: export photos before closing. This is not the phone or personal-browser album.',inputDirectory:this.inputRoot||null};
  }catch(error){await Promise.allSettled([browser?.close(),preview?.close()]);await this.close();throw error;}
 }
 async state(){
  const state=await this.requirePage().evaluate(()=>{
   const {state:s,engine}=window.pocketCamera,e=s.edit;
   return {mode:s.mode,webgl:!!engine&&!engine.lost(),editing:e?{width:e.width,height:e.height,recipe:JSON.parse(JSON.stringify(e.recipe)),saving:!!e.saving}:null,albumCount:s.shots.length};
  });return {...state,errors:[...this.errors]};
 }
 async catalog(){return this.requirePage().evaluate(async()=>{
  const [{LOOKS,LOOK_NAMES,PAPERS},{FRAMES}]=await Promise.all([import('/camera/looks-gl.js?v=20261103face1'),import('/camera/frames.js?v=20261029f')]);
  return {looks:LOOK_NAMES.map(id=>({id,label:LOOKS[id].label})),papers:PAPERS.map(({id,label})=>({id,label})),frames:FRAMES.map(({id,label})=>({id,label})),adjustments:['light','contrast','colour','warmth','pattern','detail'],crop:'x/y/w/h are fractions of the original image, not screen pixels.'};
 });}
 async requireEditor(){
  if(!await this.requirePage().evaluate(()=>window.pocketCamera.state.mode==='editor'&&!!window.pocketCamera.state.edit&&!window.pocketCamera.state.edit.saving&&!window.pocketCamera.engine.lost()))throw Error('Import or open a photo first; the editor and WebGL renderer must be ready.');
 }
 async checkDiscard(discard){if(!discard&&await this.requirePage().evaluate(()=>!!window.pocketCamera.state.edit))throw Error('An edit is open. Save it first or explicitly pass discard:true.');}
 async importImage({path,data,name='imported-photo',discard=false}){
  this.requirePage();await this.checkDiscard(discard);
  if((path!==undefined)===(data!==undefined))throw Error('Supply exactly one of path or data.');
  const image=path!==undefined?await readImage(this.inputRoot,path):decodeImage(data);
  await this.page.evaluate(async({data,mimeType,name})=>{
   const app=window.pocketCamera,before=app.state.edit;
   await app.editFile(new File([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],name,{type:mimeType}));
   if(!app.state.edit||app.state.edit===before)throw Error('Camera could not decode this image. The previous edit was preserved.');
  },{data:image.bytes.toString('base64'),mimeType:image.mimeType,name:image.name||name});
  return this.state();
 }
 async edit(patch){
  await this.requireEditor();validateEdit(patch,await this.catalog());
  await this.page.evaluate(patch=>{
   const app=window.pocketCamera,e=app.state.edit,$=id=>document.getElementById(id);
   const input=(id,value)=>{const element=$(id);element.value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));};
   if(patch.layers){e.recipe.layers=structuredClone(patch.layers);e.active=0;}
   $('tabLooks').click();input('amount',e.recipe.layers[e.active].amount*100);
   if(patch.adjust){$('tabAdjust').click();for(const [key,value] of Object.entries(patch.adjust)){e.adjust=key;input('adjustSlider',value*100);}}
   if(patch.enhance!==undefined){$('tabAdjust').click();input('enhanceStrength',patch.enhance*100);}
   if(patch.crop){e.recipe.crop=structuredClone(patch.crop);$('tabCrop').click();}
   for(const field of ['frame','paper'])if(patch[field]!==undefined){
    $('tabFrame').click();const box=$(field==='frame'?'frameChoices':'paperChoices');
    const button=[...box.querySelectorAll('button')].find(b=>b.dataset[field]===patch[field]);
    if(!button)throw Error(`Camera no longer offers ${field}: ${patch[field]}`);button.click();
   }
   $('tabLooks').click();$('enhanceStrength').dispatchEvent(new Event('change',{bubbles:true}));app.editStickers.select(null);
  },patch);
  await this.settle();return this.state();
 }
 async settle(){await this.requirePage().evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
 async previewImage(){
  await this.requireEditor();await this.page.locator('#tabLooks').click();
  await this.page.evaluate(()=>window.pocketCamera.editStickers.select(null));await this.settle();
  return {image:(await this.page.locator('#editFrame').screenshot({type:'png',animations:'disabled'})).toString('base64'),mimeType:'image/png',data:{kind:'Editor preview; use Save then Export for the final JPEG.',...await this.state()}};
 }
 async album(){return this.requirePage().evaluate(async()=>{
  const {listShots}=await import('/camera/album.js?v=20261102fun1');
  return (await listShots()).slice(0,200).map(s=>({id:s.id,width:s.width,height:s.height,created:s.created,taken:s.taken,bytes:s.photo?.size,mimeType:s.photo?.type,recipe:s.recipe}));
 });}
 async openPhoto({id,discard=false}){
  await this.checkDiscard(discard);
  if(!(await this.album()).some(s=>s.id===id))throw Error('Photo is not in this MCP session album.');
  await this.page.evaluate(id=>{
   document.getElementById('roll').click();
   const button=[...document.querySelectorAll('#grid button')].find(b=>b.dataset.id===id);
   if(!button)throw Error('Photo is not available in the album controls.');button.click();
  },id);
  await this.page.waitForFunction(id=>window.pocketCamera.state.mode==='viewer'&&window.pocketCamera.state.viewing?.id===id,id);
  await this.page.locator('#editPhoto').click();await this.page.waitForFunction(()=>window.pocketCamera.state.mode==='editor');
  return this.state();
 }
 async save({confirm=false}={}){
  if(!confirm)throw Error('Saving creates a new photo in the session album. Pass confirm:true after the user requests a save.');
  await this.requireEditor();
  await this.page.evaluate(()=>{window.pocketCamera.state.edit.shotId=null;}); // Always a copy; preserve the previous photo.
  await this.page.locator('#saveEdit').click();
  await this.page.waitForFunction(()=>!window.pocketCamera.state.edit?.saving,null,{timeout:60000});
  if(await this.page.evaluate(()=>!!window.pocketCamera.state.edit))throw Error('The app did not save the photo; the edit remains open.');
  const shot=await this.page.evaluate(()=>{const s=window.pocketCamera.state.viewing;return s?{id:s.id,width:s.width,height:s.height,created:s.created,taken:s.taken,bytes:s.photo.size,mimeType:s.photo.type,recipe:s.recipe}:null;});
  if(!shot)throw Error('The app returned no saved photo.');return shot;
 }
 async exportPhoto({id,confirm=false}){
  if(!confirm)throw Error('Export writes the selected photo to a local file. Pass confirm:true after the user requests an export.');
  const photo=await this.requirePage().evaluate(async id=>{
   const {getShot}=await import('/camera/album.js?v=20261102fun1'),shot=await getShot(id);
   if(!shot)throw Error('Photo is not in this MCP session album.');
   const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Could not read saved image.'));r.readAsDataURL(shot.photo);});
   return {data,mimeType:shot.photo.type,width:shot.width,height:shot.height};
  },id);
  const bytes=Buffer.from(photo.data,'base64');
  if(!this.outputRoot)this.outputRoot=await mkdtemp(join(tmpdir(),'johansson-camera-exports-'));
  const extension=photo.mimeType==='image/png'?'png':'jpg',path=join(this.outputRoot,`pocket-camera-${randomUUID()}.${extension}`);
  await writeFile(path,bytes,{flag:'wx',mode:0o600});
  return {id,path,bytes:bytes.length,mimeType:photo.mimeType,width:photo.width,height:photo.height,sha256:createHash('sha256').update(bytes).digest('hex'),note:'Exact saved image bytes. Export survives session close; the OS may clean temporary files.'};
 }
 async close(){
  this.generation++;const browser=this.browser,preview=this.preview;this.browser=null;this.preview=null;this.page=null;this.context=null;
  await Promise.allSettled([browser?.close(),preview?.close()]);
  return {closed:true,exportsDirectory:this.outputRoot||null,albumLifetime:'The temporary session album is closed. Existing exported files were not removed.'};
 }
}
