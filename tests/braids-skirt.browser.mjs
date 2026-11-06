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
 await page.goto('http://127.0.0.1:5173/creator/');await page.getByRole('textbox',{name:'Name',exact:true}).waitFor();
 const reference=await page.evaluate(async()=>{const {recipeFor}=await import('/src/avatars/cast.js'),{encodeRecipe}=await import('/src/avatars/recipe.js');const r=recipeFor('Thuan');return {r,code:encodeRecipe(r)};});
 await page.goto('http://127.0.0.1:5173/creator/?r='+reference.code);await page.locator('.shm-dots button').nth(1).click();await page.getByRole('tab',{name:'Hair',exact:true}).click();
 await page.getByRole('button',{name:'Original Thuận braids',exact:true}).click();await page.getByRole('button',{name:'Twin braids · Thuan',exact:true}).click();
 console.log('selected',width,errors,await page.locator('.shm').count());
 await page.getByRole('tab',{name:'Adjust',exact:true}).click();
 await page.getByRole('slider',{name:'Braid length',exact:true}).fill('0.78');
 await page.getByRole('slider',{name:'Braid volume',exact:true}).fill('0.85');
 await page.waitForTimeout(500);await page.screenshot({path:out+'/creator-'+width+'.jpg',type:'jpeg',quality:85});
 await page.getByRole('tab',{name:'Face',exact:true}).click();await page.getByRole('tab',{name:'Adjust',exact:true}).click();
 await page.getByRole('slider',{name:'Face roundness',exact:true}).fill('0.4');await page.getByRole('slider',{name:'Face roundness',exact:true}).fill(String(reference.r.head.roundness));
 await page.getByRole('tab',{name:'Glasses & beard',exact:true}).click();await page.getByRole('tab',{name:'Style',exact:true}).click();
 const glasses=page.getByRole('button',{name:'Wear glasses',exact:true});await glasses.click();assert.equal(await glasses.getAttribute('aria-pressed'),'true');await glasses.click();assert.equal(await glasses.getAttribute('aria-pressed'),'false');
 if(width===1280){
  await page.getByRole('tab',{name:'Body',exact:true}).click();
  await page.getByRole('combobox',{name:'Preview expression',exact:true}).selectOption('excited');await page.getByRole('combobox',{name:'Preview expression',exact:true}).selectOption('neutral');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export T-pose (.glb)',exact:true}).click();const download=await downloadPromise;
  await download.saveAs(out+'/thuan-tpose.glb');
  const data=await readFile(out+'/thuan-tpose.glb');assert.equal(data.readUInt32LE(0),0x46546c67);
  const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
  assert.ok(gltf.nodes.some(n=>n.name==='Braid L'&&Number.isInteger(n.skin)));assert.ok(gltf.nodes.some(n=>n.name==='Braid R'&&Number.isInteger(n.skin)));
  const head=gltf.meshes[gltf.nodes.find(n=>n.name==='Shimanchu head').mesh];assert.deepEqual(head.extras.targetNames,['smile','shy','surprised','blink']);assert.equal(head.primitives[0].targets.length,4);
  const root=gltf.nodes.find(n=>n.extras?.recipe);assert.equal(root.extras.pose,'T-pose');assert.ok(root.extras.faceExpressions.blink.startsWith('data:image/png;base64,'));
  for(const side of ['L','R'])assert.ok(Math.abs(gltf.nodes.find(n=>n.name==='shoulder'+side).rotation[2])>.7);
 }
 await page.locator('.shm-dots button').nth(3).click();await page.getByRole('button',{name:'Walk the town as them',exact:true}).click();
 await page.goto('http://127.0.0.1:5173/creator/');await page.reload();await page.getByRole('textbox',{name:'Name',exact:true}).waitFor();
 const saved=await page.evaluate(async()=>{const {playerRecipe}=await import('/src/avatars/actors.js');return playerRecipe();});assert.equal(saved.hair.style,'longbraids');assert.equal(saved.hair.length,.78);assert.equal(saved.hair.volume,.85);assert.equal(saved.glasses.enabled,false);assert.deepEqual(saved.head,reference.r.head);assert.deepEqual(saved.outfit,reference.r.outfit);
 for(const pose of ['walk','sit','wave']){await page.goto('http://127.0.0.1:5173/tools/avatar-preview.html?who=Thuan&pose='+pose);await page.waitForFunction(()=>window.__READY__);await page.waitForTimeout(250);}
 if(width===1280){await page.setViewportSize({width:1260,height:1260});await page.goto('http://127.0.0.1:5173/tools/thuan-pose-sheet.html');await page.waitForFunction(()=>window.__READY__);await page.screenshot({path:out+'/thuan-pleats-sheet.jpg',type:'jpeg',quality:90});}
 assert.deepEqual(errors,[]);results.push({width,height,touch:width===390,hairSelection:true,braidParametersSaved:true,faceRoundness:true,glassesToggle:true,tposeExport:width===1280,saveReload:true,headAndOutfitPreserved:true,poses:['walk','sit','wave'],pageErrors:errors});await context.close();
}await writeFile(out+'/results.json',JSON.stringify({results},null,2)+'\n');console.log('PASS',JSON.stringify(results));}finally{await browser.close();server.close();}
