import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=process.env.DRINKING_BASE_URL||'http://127.0.0.1:5173',out=resolve('docs/qa/drinking-simulator/game');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage(),errors=[],frames=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(base+'/tools/drinking-game-preview.html');await page.waitForFunction(()=>window.__READY__);
 for(const [label,time] of [['rest',0],['grasp',1.18],['mouth',3.45],['setdown',5.6]]){
  const state=await page.evaluate(t=>window.setPhase(t),time);await page.screenshot({path:resolve(out,label+'.png')});frames.push({label,time,state});
 }
 await page.evaluate(()=>{window.setPhase(3.45);window.setView('first');});await page.screenshot({path:resolve(out,'first-person.png')});
 const gpu=await page.evaluate(()=>{const gl=review.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),userAgent:navigator.userAgent};});
 const report={browser:await browser.version(),gpu,errors,frames};await writeFile(resolve(out,'game-browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({browser:report.browser,gpu,errors,frames:frames.map(f=>({label:f.label,phase:f.state?.id,rimError:f.state?.rimError,wristError:f.state?.wristError}))}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
