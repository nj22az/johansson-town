import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json')('playwright');
const root=new URL('..',import.meta.url).pathname.replace(/\/$/,''),out=root+'/docs/qa/braids-skirt';await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<body>Town entry</body>');return;}if(path.endsWith('/'))path+='index.html';res.setHeader('Content-Type',path.endsWith('.html')?'text/html':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':'application/octet-stream');res.end(await readFile(root+path));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(5173,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CREATOR_CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const results=[];
try{for(const [width,height] of [[1280,800],[390,844]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/creator/');await page.getByRole('textbox',{name:'Name',exact:true}).waitFor();await page.locator('.shm-dots button').first().click();await page.getByRole('button',{name:'Thuận · original',exact:true}).click();
 await page.locator('.shm-dots button').nth(1).click();await page.getByRole('tab',{name:'Hair',exact:true}).click();
 await page.getByRole('button',{name:'Twin braids · Thuan',exact:true}).click();await page.getByRole('button',{name:'Original Thuận braids',exact:true}).click();
 await page.locator('.shm-dots button').nth(3).click();await page.getByRole('button',{name:'Walk the town as them',exact:true}).click();
 await page.goto('http://127.0.0.1:5173/creator/');await page.reload();await page.getByRole('textbox',{name:'Name',exact:true}).waitFor();
 const saved=await page.evaluate(async()=>{const {playerRecipe}=await import('/src/avatars/actors.js');return playerRecipe();});assert.equal(saved.hair.style,'braids');assert.equal(saved.hair.tieColour,'#f4d23c');assert.equal(saved.head.form,'heart');assert.equal(saved.head.roundness,0);assert.equal(saved.glasses.enabled,true);assert.equal(saved.eyes.style,'lashes');assert.equal(saved.accessories.earrings,'none');assert.equal(saved.accessories.neckwear,'none');
 if(width===1280){await page.setViewportSize({width:1260,height:1260});await page.goto('http://127.0.0.1:5173/tools/thuan-pose-sheet.html?version=original');await page.waitForFunction(()=>window.__READY__);await page.screenshot({path:out+'/thuan-original-sheet.jpg',type:'jpeg',quality:90});}
 assert.deepEqual(errors,[]);results.push({width,height,originalPreset:true,hairSelection:true,saveReload:true,originalFace:true,pageErrors:errors});await context.close();
}await writeFile(out+'/original-results.json',JSON.stringify({results},null,2)+'\n');console.log('PASS',JSON.stringify(results));}finally{await browser.close();server.close();}
