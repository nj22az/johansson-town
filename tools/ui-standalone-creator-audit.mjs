// Actual standalone creator controls and pixels across four viewport sizes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import {serveGame} from './mcp/static-server.mjs';

const output=fileURLToPath(new URL('../../output/ui-standalone-creator/',import.meta.url));
const server=await serveGame(fileURLToPath(new URL('../',import.meta.url)));
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
const report={url:new URL('creator/index.html',server.url).href,captures:[],checks:[],errors:[]};
const check=(name,passed,detail=null)=>{report.checks.push({name,passed,detail});assert.ok(passed,name+' '+JSON.stringify(detail));};
await mkdir(output,{recursive:true});
try{
 for(const [mode,width,height] of [['desktop',1280,800],['phone',390,844],['compact',320,568],['landscape',844,390]]){
  const touch=mode!=='desktop';
  const context=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(60000);
  page.on('pageerror',e=>report.errors.push(mode+': '+e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(mode+': '+m.text());});
  await page.goto(report.url,{waitUntil:'domcontentloaded'});await page.locator('body>.shm').waitFor();
  const click=async locator=>touch?locator.tap():locator.click();
  const capture=async label=>{
   await page.waitForTimeout(350);
   const state=await page.locator('body>.shm').evaluate(root=>{
    const r=e=>{const a=e.getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height,right:a.right,bottom:a.bottom};};
    const foot=root.querySelector('.shm-foot');
    return {step:root.dataset.step,background:getComputedStyle(root).backgroundColor,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,bodyPanel:{clientWidth:root.querySelector('.shm-body').clientWidth,scrollWidth:root.querySelector('.shm-body').scrollWidth,scrollLeft:root.querySelector('.shm-body').scrollLeft},footer:{rect:r(foot),scrollWidth:foot.scrollWidth,clientWidth:foot.clientWidth,buttons:[...foot.querySelectorAll('button')].map(e=>({label:e.getAttribute('aria-label')||e.textContent,rect:r(e),icon:e.querySelectorAll('.ui-icon').length,color:getComputedStyle(e).backgroundColor}))}};
   });
   await page.screenshot({path:output+'/'+mode+'-'+label+'.png'});report.captures.push({mode,label,...state});
   check(mode+' '+label+' footer stays within viewport',state.footer.buttons.every(e=>e.rect.x>=-1&&e.rect.right<=width+1&&e.rect.bottom<=height+1),state.footer);
   check(mode+' '+label+' footer touch targets are 44px',state.footer.buttons.every(e=>e.rect.w>=43.9&&e.rect.h>=43.9),state.footer);
   const b=state.footer.buttons;let overlap=false;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const a=b[i].rect,c=b[j].rect;if(Math.min(a.right,c.right)-Math.max(a.x,c.x)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.y,c.y)>1)overlap=true;}
   check(mode+' '+label+' footer siblings do not overlap',!overlap,state.footer);
   return state;
  };
  check(mode+' shared LINE theme loads',await page.locator('body>.shm').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(247, 248, 249)');
  await click(page.getByRole('button',{name:'Step 2: Make them',exact:true}));await capture('appearance');
  check(mode+' standalone icon decoration loads',await page.locator('.shm-next svg.ui-icon').count()===1);
  await click(page.getByRole('button',{name:'Share',exact:true}));await page.waitForTimeout(350);
  const share=await page.locator('.shm-share>div').evaluate(panel=>{const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};return {panel:rect(panel),heading:rect(panel.querySelector('h3')),scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,scrollTop:panel.scrollTop};});
  await page.screenshot({path:output+'/'+mode+'-share.png'});report.captures.push({mode,label:'share',...share});
  check(mode+' share heading initially stays within its painted panel',share.heading.top>=Math.max(0,share.panel.top)+1&&share.heading.bottom<=Math.min(height,share.panel.bottom)-1,share);
  check(mode+' share panel stays within viewport',share.panel.top>=0&&share.panel.bottom<=height+1,share);
  await page.getByRole('button',{name:'Done',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:output+'/'+mode+'-share-done.png'});
  const done=await page.getByRole('button',{name:'Done',exact:true}).boundingBox();check(mode+' share Done remains reachable',done&&done.y>=0&&done.y+done.height<=height+1,done);
  await page.keyboard.press('Escape');
  await click(page.getByRole('button',{name:'Step 3: Who are they?',exact:true}));
  await click(page.getByRole('button',{name:'Pace 8 of 8',exact:true}));const profile=await capture('profile');
  check(mode+' profile stays horizontally grounded',profile.bodyPanel.scrollWidth<=profile.bodyPanel.clientWidth+1&&Math.abs(profile.bodyPanel.scrollLeft)<1,profile.bodyPanel);
  check(mode+' selected personality remains green',await page.getByRole('button',{name:'Pace 8 of 8',exact:true}).evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(6, 199, 85)');
  await click(page.getByRole('button',{name:'Step 4: Say hello',exact:true}));await capture('save');
  check(mode+' full destination label retained',await page.locator('.shm-save').innerText()==='Walk the town as them');
  await context.close();
 }
 check('No console/resource errors',report.errors.length===0,report.errors);
 report.passed=true;
}catch(error){report.failure=String(error.stack||error);report.passed=false;process.exitCode=1;}
finally{await browser.close();await server.close();await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,failure:report.failure,output},null,2));}
