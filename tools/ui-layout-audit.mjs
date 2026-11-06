// Read-only normal UI review. No game placement, inventory or NPC fixture edits.
// node tools/ui-layout-audit.mjs [desktop|phone|landscape|compact]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveGame} from './mcp/static-server.mjs';

const mode=process.argv[2]||'desktop';assert.ok(['desktop','phone','landscape','compact'].includes(mode));
const touch=mode!=='desktop',viewport=mode==='desktop'?{width:1280,height:800}:mode==='phone'?{width:390,height:844}:mode==='compact'?{width:320,height:568}:{width:844,height:390};
const output=new URL('../../output/ui-layout-audit/'+mode+'/',import.meta.url);await mkdir(output,{recursive:true});
const report={mode,viewport,touch,normalUI:true,captures:[],errors:[]};let server,browser,page,closing=false;
async function capture(label){
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__?.step(0));await page.waitForTimeout(350);
 const layout=await page.evaluate(()=>{
  const visible=el=>el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const elements=[...document.querySelectorAll('#hud button,#directory button,#directory summary,#activity button,#activityTitle,#activityBody p,#mobile button,.placard,#clock,#prompt,#subtitle,.directory-foot')].filter(visible).map(el=>{
   const style=getComputedStyle(el),glyph=el.querySelector('.ui-icon'),text=el.querySelector('span:not(.sr-only),b');
   return {id:el.id,class:el.className,text:el.textContent.trim(),rect:rect(el),fontSize:style.fontSize,lineHeight:style.lineHeight,display:style.display,color:style.color,background:style.backgroundColor,opacity:style.opacity,borderRadius:style.borderRadius,boxShadow:style.boxShadow,overflowX:style.overflowX,overflowY:style.overflowY,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,glyph:glyph&&{rect:rect(glyph),width:getComputedStyle(glyph).width},label:text&&{rect:rect(text)},before:getComputedStyle(el,'::before').content,after:getComputedStyle(el,'::after').content};
  });
  // Only exposed hit targets count. Children clipped by scroll containers are
  // not simultaneous buttons at that pixel; raw DOM bounds falsely overlap them.
  const exposed=el=>{
   if(!visible(el))return null;let box=rect(el);box={...box,x:Math.max(0,box.x),y:Math.max(0,box.y),right:Math.min(innerWidth,box.right),bottom:Math.min(innerHeight,box.bottom)};
   for(let parent=el.parentElement;parent;parent=parent.parentElement){const style=getComputedStyle(parent),p=rect(parent);if(/auto|scroll|hidden|clip/.test(style.overflowX)){box.x=Math.max(box.x,p.x);box.right=Math.min(box.right,p.right);}if(/auto|scroll|hidden|clip/.test(style.overflowY)){box.y=Math.max(box.y,p.y);box.bottom=Math.min(box.bottom,p.bottom);}}
   const head=document.querySelector('#directory .directory-head');
   if(head&&visible(head)&&el.closest('.directory-card')&&!head.contains(el))box.y=Math.max(box.y,rect(head).bottom);
   return box.right>box.x+1&&box.bottom>box.y+1?box:null;
  };
  const buttons=[...document.querySelectorAll('button')].filter(el=>exposed(el)),overlaps=[];
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
   const a=buttons[i],b=buttons[j];if(a.contains(b)||b.contains(a))continue;const x=exposed(a),y=exposed(b),w=Math.min(x.right,y.right)-Math.max(x.x,y.x),h=Math.min(x.bottom,y.bottom)-Math.max(x.y,y.y);
   if(w>1&&h>1)overlaps.push({a:a.id||a.textContent.trim(),b:b.id||b.textContent.trim(),area:w*h});
  }
  return {width:innerWidth,height:innerHeight,coarse:matchMedia('(pointer:coarse)').matches,touchClass:document.documentElement.classList.contains('touch-controls'),elements,overlaps};
 });
 assert.equal(layout.coarse,touch,'The phone audit must actually exercise touch media queries');
 const file=new URL(label+'.png',output);await page.evaluate(()=>window.__JOHANSSON_AUDIT__?.render());await page.screenshot({path:file.pathname});
 report.captures.push({label,file:file.pathname,...layout});await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');console.log(`UI ${mode}: ${label}, ${layout.overlaps.length} overlapping button pairs`);
}
async function click(selector){const el=page.locator(selector);assert.ok(await el.isVisible(),selector+' is offered by the normal UI');if(touch)await el.tap();else await el.click();}
try{
 server=await serveGame(fileURLToPath(new URL('../',import.meta.url)));
 browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,deviceScaleFactor:1,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 page=await context.newPage();page.setDefaultTimeout(240000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('requestfailed',r=>{if(!closing)report.errors.push(r.url()+' '+r.failure()?.errorText);});
 const url=new URL(server.url);url.searchParams.set('audit','');url.searchParams.set('spawn','sakura-bench');await page.goto(url.href,{waitUntil:'domcontentloaded'});await page.waitForTimeout(3500);await capture('title');await click('[data-guide-open]');await capture('guide');await click('.guide-nav [data-guide-close]');await click('#enter');
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;a.step(0);});
 await capture('hud-seated');await click('#directoryButton');await capture('town-book');
 await click('.menu-settings>summary');await capture('settings');await click('#timeButton');assert.equal(await page.locator('#directory').isVisible(),false,'Child menus close the town book');await capture('clock-menu');await click('#closeActivity');await click('#directoryButton');
 await click('.menu-places>summary');await capture('places');await click('#notebookButton');await capture('field-book');await click('#closeActivity');
 if(await page.locator('#directory').isVisible())await click('#closeDirectory');
 await capture('hud-returned');assert.deepEqual(report.errors,[]);for(const c of report.captures)assert.deepEqual(c.overlaps,[],c.label+' has no exposed overlapping controls');report.passed=true;
}catch(error){report.failure=error.message;throw error;}
finally{await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');closing=true;await browser?.close();await server?.close();}
