// Presentation fixtures use the real activity UI; this is not an on-foot world tour.
// Camera and photo panels are opened through the normal Town book controls (the maker is Johansson Studio's now).
// node tools/ui-expanded-audit.mjs [desktop|phone|landscape|compact] [--url URL]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const mode=process.argv[2]||'desktop',sizes={desktop:[1280,800],phone:[390,844],landscape:[844,390],compact:[320,568]};
assert.ok(sizes[mode]);const [width,height]=sizes[mode],touch=mode!=='desktop';
const url=new URL(process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:'http://127.0.0.1:8767/johansson-town/');
url.searchParams.set('audit','');url.searchParams.set('spawn','sakura-bench');
const output=new URL('../../output/ui-expanded-audit/'+mode+'/',import.meta.url);await mkdir(output,{recursive:true});
const report={mode,viewport:{width,height},touch,url:url.href,controlledFixtures:['stocked inventory','dialogue content','magazine rack','office workbooks','document archive'],normalPanels:['camera controls','photo studio','character creator'],captures:[],checks:[],errors:[]};
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});let page,closing=false;
const save=()=>writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
function check(name,value,detail=null){report.checks.push({name,passed:!!value,detail});assert.ok(value,name+(detail?' · '+JSON.stringify(detail):''));}
async function click(locator){if(typeof locator==='string')locator=page.locator(locator);if(touch)await locator.tap();else await locator.click();}
async function capture(label){
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(0));
 const state=await page.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const paintedRect=e=>{const r=rect(e);r.x=Math.max(0,r.x);r.y=Math.max(0,r.y);r.right=Math.min(innerWidth,r.right);r.bottom=Math.min(innerHeight,r.bottom);
   for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),q=rect(p);if(/auto|scroll|hidden|clip/.test(s.overflowX)){r.x=Math.max(r.x,q.x);r.right=Math.min(r.right,q.right);}if(/auto|scroll|hidden|clip/.test(s.overflowY)){r.y=Math.max(r.y,q.y);r.bottom=Math.min(r.bottom,q.bottom);}}
   const tabs=document.querySelector('#photoStudio .photo-tabs');if(tabs&&e.closest('.photo-tools')&&!tabs.contains(e)&&tabs.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))r.y=Math.max(r.y,rect(tabs).bottom);
   r.width=Math.max(0,r.right-r.x);r.height=Math.max(0,r.bottom-r.y);return r;};
  const shown=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const inView=e=>{const r=paintedRect(e);return shown(e)&&r.width>0&&r.height>0;};
  const share=document.querySelector('.shm-share');const enabledSurface=e=>!share||!shown(share)||share.contains(e);
  const controls=[...document.querySelectorAll('#activity button,#activity input,#activity select,#cameraPanel button,#cameraPanel input,#photoStudio button,#photoStudio select,#photoStudio input,body>.shm button,body>.shm select,body>.shm input')].filter(e=>inView(e)&&enabledSurface(e)).map(e=>{
   const s=getComputedStyle(e);return {id:e.id,text:e.textContent.trim(),label:e.getAttribute('aria-label'),rect:rect(e),icons:e.querySelectorAll('svg.ui-icon').length,canvases:e.querySelectorAll('canvas').length,font:s.fontSize,color:s.color,background:s.backgroundColor,borderRadius:s.borderRadius,before:getComputedStyle(e,'::before').content,after:getComputedStyle(e,'::after').content};
  });
  const panels=[...document.querySelectorAll('#activity .activity-card,#cameraPanel .camera-card,#photoStudio,body>.shm')].filter(shown).map(e=>({selector:e.id||e.className,rect:rect(e),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth}));
  const overlaps=[];const buttons=[...document.querySelectorAll('#activity button,#cameraPanel button,#photoStudio button,body>.shm button')].filter(e=>inView(e)&&enabledSurface(e));
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=buttons[i],b=buttons[j];if(a.contains(b)||b.contains(a))continue;const x=paintedRect(a),y=paintedRect(b),w=Math.min(x.right,y.right)-Math.max(x.x,y.x),h=Math.min(x.bottom,y.bottom)-Math.max(x.y,y.y);if(w>1&&h>1)overlaps.push({a:a.getAttribute('aria-label')||a.textContent.trim(),b:b.getAttribute('aria-label')||b.textContent.trim(),area:w*h});}
  const lines=[...document.querySelectorAll('.rpg-line,.rpg-own')].filter(shown).map(e=>{const s=getComputedStyle(e);return {class:e.className,text:e.textContent,rect:rect(e),color:s.color,background:s.backgroundColor};});
  const selected=[...document.querySelectorAll('body>.shm [aria-selected=true],body>.shm [aria-pressed=true],body>.shm [aria-current=step]')].filter(inView).map(e=>({text:e.textContent,label:e.getAttribute('aria-label'),background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
  return {coarse:matchMedia('(pointer:coarse)').matches,modalClass:document.querySelector('#activity').className,focus:document.activeElement.id||document.activeElement.getAttribute('aria-label')||document.activeElement.textContent.trim().slice(0,80),controls,panels,overlaps,lines,selected,bodyOverflow:document.body.scrollWidth>innerWidth};
 });
 const file=new URL(label+'.png',output);await page.screenshot({path:file.pathname});report.captures.push({label,file:file.pathname,...state});await save();console.log(`Expanded UI ${mode}: ${label} (${state.overlaps.length} overlaps)`);
}
async function closeActivity(){await click('#closeActivity');await page.waitForFunction(()=>document.querySelector('#activity').classList.contains('hidden'));}
async function directory(){if(!await page.locator('#directory').isVisible())await click('#directoryButton');}

try{
 const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:1,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('requestfailed',r=>{if(!closing)report.errors.push(r.url()+' '+r.failure()?.errorText);});
 await page.goto(url.href,{waitUntil:'domcontentloaded'});await click('#enter');
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;a.step(0);});
 report.sourceHash=await page.evaluate(async()=>{const r=await(await fetch(new URL('./runtime/source.json',location.href))).json();return r.sha256;});
 report.uiStylesHash=await page.evaluate(async()=>{const css=await(await fetch(new URL('./line-ui.css',location.href))).arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',css))].map(n=>n.toString(16).padStart(2,'0')).join('');});
 check('Genuine pointer context',await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)===touch);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.activities.state.inventory=['Canned coffee','Canned coffee','Empty can','Nikuman bun','Pocket notebook'];a.step(0);});
 await directory();await click('#bagButton');await page.waitForTimeout(70);await capture('bag-stocked');
 check('Bag counts and product artwork survive icon decoration',await page.locator('.bag-tile').count()===4&&await page.getByRole('button',{name:'Canned coffee, 2',exact:true}).count()===1);
 check('Town book closes before child activity',!await page.locator('#directory').isVisible());
 await click(page.getByRole('button',{name:'Empty can',exact:true}));await capture('bag-empty-can');
 check('Empty can retains recycling meaning',/recycling|refund/.test(await page.locator('#activityBody').innerText()));
 await click(page.getByRole('button',{name:'Back to the bag',exact:true}));
 await click(page.getByRole('button',{name:'Nikuman bun',exact:true}));await capture('bag-nikuman');
 check('Nikuman offers the food action',await page.getByRole('button',{name:'Eat it',exact:true}).count()===1);
 await closeActivity();check('Child activity dismissal returns to Town book button',await page.evaluate(()=>document.activeElement.id)==='directoryButton');

 await page.evaluate(()=>{const acts=window.__JOHANSSON_AUDIT__.activities;acts.menu('Nhung · A quick conversation','The books and the evening paper are at our counter. Tama still prefers the window chair. We can take our time: there is room for a long line, and room for your reply.',[['Tell me something else',()=>acts.menu('Nhung · A quick conversation','I will put a copy aside for you. The next reply stays in this same conversation.',[['Close',acts.close]])],['Close',acts.close]]);});
 await capture('dialogue-incoming-listening');check('Incoming line enters listening phase',await page.locator('#activity').evaluate(e=>e.classList.contains('listening')));
 await page.keyboard.press('Space');await capture('dialogue-replies');
 await click(page.getByRole('button',{name:'Tell me something else',exact:true}));await capture('dialogue-player-reply');
 check('Player reply has its own speaking phase',await page.locator('#activity').evaluate(e=>e.classList.contains('player-speaking')));
 await page.keyboard.press('Space');await capture('dialogue-followup');
 await page.keyboard.press('Space');
 check('Reply advances to the next real modal line',(await page.locator('.rpg-line').innerText()).startsWith('I will put a copy'));
 await page.keyboard.press('Escape');check('Escape dismisses the conversation',!await page.locator('#activity').isVisible());

 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.action('magazine-rack'));await page.waitForTimeout(80);await capture('magazine-shelf');
 const shelf=await page.locator('.mag-cover').evaluateAll(es=>es.map(e=>({canvas:e.querySelectorAll('canvas').length,title:e.querySelector('.mag-cover-name')?.textContent,issue:e.querySelector('.mag-cover-issue')?.textContent,pixels:[...e.querySelector('canvas').getContext('2d').getImageData(0,0,160,220).data].some((v,i)=>i%4===3&&v>0)})));
 check('All magazine covers keep painted canvas, title and issue',shelf.length>2&&shelf.every(e=>e.canvas===1&&e.title&&e.issue&&e.pixels),shelf);
 await click(page.locator('.mag-cover').first());await page.waitForFunction(()=>document.querySelector('.mag-page')?.getAttribute('aria-label'));await capture('magazine-page-1');
 const first=await page.locator('.mag-count').innerText();await click(page.getByRole('button',{name:'Next page',exact:true}));await page.waitForTimeout(200);await capture('magazine-page-2');
 check('Next page advances the right-to-left magazine',(await page.locator('.mag-count').innerText())!==first);
 await page.keyboard.press('ArrowRight');check('Right arrow returns to the previous page',(await page.locator('.mag-count').innerText())===first);
 await click(page.locator('.mag-back'));check('Rack return restores the cover canvases',await page.locator('.mag-cover canvas').count()===shelf.length);await closeActivity();

 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.action('office-records'));await page.locator('.office-workbook table').waitFor();await capture('office-workbook');
 const caption=await page.locator('.office-workbook caption').innerText();await click(page.locator('.office-workbook-tabs button').nth(1));await page.waitForFunction(c=>document.querySelector('.office-workbook caption')?.textContent!==c,caption);await capture('office-workbook-second');
 check('Workbook tab changes the actual sheet',(await page.locator('.office-workbook caption').innerText())!==caption);
 await page.locator('.office-workbook td[tabindex]').first().focus();
 check('Workbook cells still expose their formula or input',(await page.locator('.office-workbook-formula').innerText()).length>0);await closeActivity();
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.action('document-archive'));await capture('document-register');
 const count=await page.locator('.archive-scroll tbody tr').count();await page.getByLabel('Search documents',{exact:true}).fill('unmatchable-audit-query');
 check('Archive search filters actual records',count>0&&await page.locator('.archive-scroll tbody tr').count()===0);await page.getByLabel('Search documents',{exact:true}).fill('');
 await click(page.locator('.archive-scroll tbody button').first());await capture('document-open');check('Document buttons retain actual paper contents',await page.locator('.archive-paper').count()===1);await closeActivity();

 await directory();await click('#cameraButton');await capture('camera-controls');
 const range=page.locator('#cameraPanel input[type=range]').first();const value=await range.inputValue();await range.focus();await page.keyboard.press('ArrowRight');
 check('Camera range remains functional',(await range.inputValue())!==value);await page.keyboard.press('Escape');check('Escape closes camera settings',!await page.locator('#cameraPanel').isVisible());
 await directory();await click('#photoButton');await page.locator('#photoStudio').waitFor({state:'visible'});await capture('photo-camera');
 await click(page.getByRole('button',{name:'Capture panel',exact:true}));await page.waitForFunction(()=>document.querySelectorAll('.photo-film figure').length===1);
 await click(page.locator('[data-tab="film"]'));await capture('photo-film');
 await page.locator('.photo-film').scrollIntoViewIfNeeded();await capture('photo-film-actions');
 check('Photo capture creates a real saved panel',await page.locator('.photo-film a').count()>0);
 await click(page.getByRole('button',{name:'Return to town',exact:true}));check('Photo dismissal restores the town',!await page.locator('#photoStudio').isVisible());
 await directory();if(!await page.locator('.menu-places').evaluate(e=>e.open))await click('.menu-places>summary');
 // Looks, wardrobes and the home are made in Johansson Studio; the Town book only links there (src/studio-handoff.js).
 check('The Town book sends you to Johansson Studio and has no maker of its own',await page.getByRole('button',{name:/Johansson Studio/}).count()===1&&await page.getByRole('button',{name:/Make your islander|Resident wardrobes/}).count()===0);
 check('No JavaScript or resource errors',report.errors.length===0,report.errors);report.passed=true;await save();
}catch(error){report.failure=error.message;await save();throw error;}
finally{closing=true;await browser.close();await save();}
