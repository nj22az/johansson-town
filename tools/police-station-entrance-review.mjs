import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const stage=process.env.SHOT_STAGE||'after',out=`docs/qa/police-station/entrance-review/${stage}`;await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8770','--bind','127.0.0.1','--directory','..'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true,executablePath:'/tmp/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],pending=new Set();
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});page.setDefaultTimeout(180000);
 // Before uses the actual preceding compiled page and graph, not current source labelled as old.
 if(stage==='before')await page.route(url=>url.pathname==='/johansson-town/'||url.pathname.startsWith('/johansson-town/runtime/'),route=>{
  const u=new URL(route.request().url()),path=u.pathname==='/johansson-town/'?'johansson-town/index.html':u.pathname.slice(1);
  route.fulfill({contentType:path.endsWith('.html')?'text/html':'text/javascript',body:execFileSync('git',['show','63074d0:'+path])});
 });
 page.on('pageerror',e=>{errors.push(e.message);console.log('JS ERROR',e.message);});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,250));});page.on('request',r=>pending.add(r.url()));for(const ev of ['requestfinished','requestfailed'])page.on(ev,r=>pending.delete(r.url()));
 await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'09:30',speed:1}));Element.prototype.requestFullscreen=async()=>{};
 // Bound the software GPU's queue during loading; the game and its graphics stay intact.
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>setTimeout(()=>raf(fn),200);
 });
 await page.goto('http://127.0.0.1:8770/johansson-town/?audit&spawn=sakura-bench',{waitUntil:'domcontentloaded'});
 let ready=false;
 for(let i=0;i<24;i++){await page.waitForTimeout(5000);const state=await page.evaluate(()=>({running:!!window.__JOHANSSON_RUNNING__,audit:!!window.__JOHANSSON_AUDIT__,loading:window.__JOHANSSON_LOADING__?.snapshot(),disabled:document.querySelector('#enter')?.disabled,fatal:document.querySelector('#fatal')?.textContent}));console.log('LOAD',JSON.stringify(state));if(state.disabled===false){ready=true;break;}}
 if(!ready){await page.screenshot({path:out+'/loading.png'});await writeFile(out+'/failure.json',JSON.stringify({errors,pending:[...pending]},null,2));throw Error('Start did not become enabled');}
 await page.locator('#enter').click({timeout:30000});
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 console.log('RUNNING');
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;a.teleport(4,20.3);a.setTime(570);});
 await page.addStyleTag({content:'#hud,#activity,#directory,#cameraPanel,#mobile,#contextControls,#standButton{visibility:hidden!important}'});
 const report={stage,errors,physicalDevice:false,views:[]};
 for(const [name,pos,at] of [['front',[-.6,1.85,20.3],[5.7,1.95,20.3]],['angle',[.2,2.05,23.4],[5.5,1.9,20.3]]]){
  const state=await page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();const p=a.world.policeStation;let triangles=0,groups=0;p.group.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;groups+=Array.isArray(o.material)?o.geometry.groups.length:1;});return {triangles,groups,graphics:window.__JOHANSSON_LOOK__.state};},{pos,at});
  await page.locator('#game').screenshot({path:out+'/'+name+'.png'});report.views.push({name,pos,at,...state});
 }
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('CAPTURED',stage);
}finally{await browser.close();server.kill();}
