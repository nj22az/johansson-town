/**
 * Headless Johansson Studio for the tools: the real Studio page, served from this checkout on a private loopback
 * address (only /johansson-town/ and /avatar-creator/), opened with ?agent at the iPad's viewport (1024x1366, at
 * twice the pixels), so a render is what the creator sees. Nothing outside the loopback address is fetched.
 * Playwright and Chromium load only here, and only when a render is asked for. Chromium keeps its sandbox unless this
 * runs as root (where it cannot start with one), and a page that crashed is started afresh on the next call.
 */
import {serveGame} from '../mcp/static-server.mjs';
import {CODE_ROOT} from './repo.mjs';
import {pictureKind,pictureSize,sizeProblems} from '../../src/studio/rules.js';

export const IPAD=Object.freeze({width:1024,height:1366,deviceScaleFactor:2});

export class StudioPage{
 constructor(){this.starting=null;this.closed=false;}
 async start(){
  this.starting??=(async()=>{
   const {chromium}=await import('playwright');
   const preview=await serveGame({root:CODE_ROOT,mounts:['johansson-town','avatar-creator']});
   let browser;
   try{
    browser=await chromium.launch({headless:true,...process.env.TOWN_CHROMIUM_PATH?{executablePath:process.env.TOWN_CHROMIUM_PATH}:{},args:[...process.getuid?.()===0?['--no-sandbox']:[],'--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await browser.newContext({viewport:{width:IPAD.width,height:IPAD.height},deviceScaleFactor:IPAD.deviceScaleFactor,hasTouch:true,serviceWorkers:'block'});
    const local=new URL(preview.url).origin;
    await context.route('**/*',route=>route.request().url().startsWith(local+'/')?route.continue():route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('crash',()=>{this.broken=true;});browser.on('disconnected',()=>{this.broken=true;});
    await page.goto(new URL('avatar-creator/?agent',preview.url).href);
    await page.waitForFunction(()=>window.__JOHANSSON_STUDIO__?.ready===true,null,{timeout:120000}).catch(e=>{throw Error(`Johansson Studio did not start in the headless page${errors.length?': '+errors.join('; '):''} (${e.message.split('\n')[0]})`);});
    Object.assign(this,{preview,browser,context,page,errors,broken:false});
    return this;
   }catch(e){await browser?.close().catch(()=>{});await preview.close();this.starting=null;throw e;}
  })();
  return this.starting;
 }
 /** Run something in the page; if the page or the browser died meanwhile, the next call starts them afresh. */
 async evaluate(work,args){
  await this.start();
  try{return await this.page.evaluate(work,args);}
  catch(e){if(this.broken||this.page.isClosed()){const old=this.starting;this.starting=null;await old?.then(s=>Promise.all([s.browser?.close(),s.preview?.close()])).catch(()=>{});}throw e;}
 }
 /** A portrait as PNG bytes (studio-api.js renderPortrait). */
 async renderPortrait(recipe,options){
  const url=await this.evaluate(([r,o])=>window.__JOHANSSON_STUDIO__.renderPortrait(r,o),[recipe,options]);
  return Buffer.from(url.slice(url.indexOf(',')+1),'base64');
 }
 /**
  * A picture made safe to keep: decoded in Chromium and drawn again as WebP, so only its pixels survive (no EXIF,
  * so no camera or GPS location, and nothing else hidden in the file). Orientation is applied first; the longest
  * side is at most maxSide. Returns {bytes, width, height}. Used by apply.mjs for label pictures (stage 2).
  */
 async reencodeWebp(bytes,{maxSide=2048,quality=.92}={}){
  // Its size is read from its header first: a small file may claim to be enormous, and decoding it would take
  // gigabytes (or crash the page).
  const input=Uint8Array.from(bytes),problems=pictureKind(input)?sizeProblems('The picture',pictureSize(input)):[{sentence:'The picture is not a PNG, JPEG or WebP picture.'}];
  if(problems.length)throw Error(problems[0].sentence);
  const [data,width,height]=await this.evaluate(async([b64,maxSide,quality])=>{
   const raw=atob(b64),input=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)input[i]=raw.charCodeAt(i);
   const bitmap=await createImageBitmap(new Blob([input]),{imageOrientation:'from-image'});
   const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)),canvas=new OffscreenCanvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale)));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const out=new Uint8Array(await (await canvas.convertToBlob({type:'image/webp',quality})).arrayBuffer());
   let text='';for(let i=0;i<out.length;i+=0x8000)text+=String.fromCharCode(...out.subarray(i,i+0x8000));
   return [btoa(text),canvas.width,canvas.height];
  },[Buffer.from(bytes).toString('base64'),maxSide,quality]);
  const out=Buffer.from(data,'base64');
  if(out.subarray(0,4).toString()!=='RIFF'||out.subarray(8,12).toString()!=='WEBP')throw Error('Chromium did not make a WebP picture.');
  return {bytes:out,width,height};
 }
 /** A data URL's bytes. */
 static bytes(url){return Buffer.from(url.slice(url.indexOf(',')+1),'base64');}
 /** Pictures for the page: file → data URL. */
 static urls(pictures={}){return Object.fromEntries(Object.entries(pictures).map(([file,bytes])=>[file,`data:${/\.webp$/.test(file)?'image/webp':/\.jpe?g$/.test(file)?'image/jpeg':'image/png'};base64,${Buffer.from(bytes).toString('base64')}`]));}
 /** A designed label baked by label-art.js in the page, 1024×512, as PNG bytes. `pictures`: a picture layer's file → its bytes. */
 async bakeLabel(product,spec,{pictures}={}){
  return StudioPage.bytes(await this.evaluate(([p,s,o])=>window.__JOHANSSON_STUDIO__.bakeLabel(p,s,o),[product,spec,{pictures:StudioPage.urls(pictures)}]));
 }
 /** A picture cut to a shape (2:1 by default) as PNG bytes; its size is checked before anything decodes it. */
 async cropPicture(bytes,{crop=null,aspect=2,maxSide=2048}={}){
  const input=Uint8Array.from(bytes),problems=pictureKind(input)?sizeProblems('The picture',pictureSize(input)):[{sentence:'The picture is not a PNG, JPEG or WebP picture.'}];
  if(problems.length)throw Error(problems[0].sentence);
  const kind=pictureKind(input),url=`data:image/${kind};base64,${Buffer.from(bytes).toString('base64')}`;
  return StudioPage.bytes(await this.evaluate(([u,o])=>window.__JOHANSSON_STUDIO__.cropPicture(u,o),[url,{crop,aspect,maxSide}]));
 }
 /** A product drawn by World's own code (studio-api.js renderProduct), as PNG bytes. `labelImage`: a draft's baked label (bytes). */
 async renderProduct(product,{view='front',size=512,background='#f3ede2',labelImage=null}={}){
  const label=labelImage?`data:image/${pictureKind(Uint8Array.from(labelImage))||'png'};base64,${Buffer.from(labelImage).toString('base64')}`:null;
  return StudioPage.bytes(await this.evaluate(([p,o])=>window.__JOHANSSON_STUDIO__.renderProduct(p,o),[product,{view,size,background,labelImage:label}]));
 }
 async close(){
  this.closed=true;const started=this.starting;this.starting=null;
  if(!started)return;
  try{const self=await started;await self.browser?.close();await self.preview?.close();}catch{}
 }
}
