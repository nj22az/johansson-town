// Self-hosts the actual source and CSS; CHROME points to an installed Chromium.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(new URL('../..',import.meta.url).pathname),out=resolve(root,'johansson-town/output/resident-life');
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://local').pathname);let data,type='text/html';
  if(path==='/__creator')data='<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0">';
  else if(path==='/__activities'){
   data=(await readFile(resolve(root,'johansson-town/index.html'),'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'').replace('<head>','<head><base href="/johansson-town/">');
  }else{const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('path');data=await readFile(file);type=mime[extname(file)]||'application/octet-stream';}
  res.writeHead(200,{'content-type':type});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let checks=0;
try{
 for(const [width,height] of (process.env.STUDIO_ONLY?[]:[[390,844],[820,1180],[1280,800],[844,390]])){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/__creator');
  await page.evaluate(async()=>{
   const {openCreator}=await import('/johansson-town/src/avatars/creator.js');
   const {normalizeRecipe}=await import('/johansson-town/src/avatars/recipe.js');
   window.voiceSamples=[];window.maker=openCreator({recipe:normalizeRecipe({name:'Acceptance visitor'}),startAt:'profile',voice:(...args)=>voiceSamples.push(args)});
  });
  const before=await page.evaluate(()=>structuredClone(maker.recipe));
  await page.getByText('Choose their personality with four questions',{exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Apply answers',exact:true}).isEnabled(),false);
  for(let i=0;i<4;i++)await page.locator('.shm-questions input[value="1"]').nth(i).check();
  await page.getByRole('button',{name:'Apply answers',exact:true}).click();
  assert.equal(await page.locator('.shm-type strong').textContent(),'Typhoon');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>maker.recipe.profile),before.profile);
  await page.getByLabel('Voice timbre',{exact:true}).selectOption('triangle');
  await page.getByRole('button',{name:'More vibrato',exact:true}).click();
  await page.getByRole('button',{name:'Hear them',exact:true}).click();await page.waitForTimeout(150);
  assert.ok(await page.evaluate(()=>voiceSamples.some(v=>v[1]==='triangle'&&v[3].vibrato>0)));
  await page.getByText('The sixteen island personalities',{exact:true}).click();
  assert.equal(await page.locator('.personality-reference article').count(),16);
  assert.equal(await page.evaluate(()=>document.querySelector('.shm').scrollWidth>innerWidth),false);
  await page.screenshot({path:out+'/personality-'+width+'.png'});
  await page.evaluate(()=>maker.goTo('look'));
  await page.getByRole('tab',{name:'Top',exact:true}).click();
  await page.getByRole('button',{name:'All',exact:true}).click();
  const scroll=await page.evaluate(()=>{const b=document.querySelector('.shm-body');b.scrollTop=180;return b.scrollTop;});
  await page.getByRole('tab',{name:'Hats & bows',exact:true}).click();
  await page.getByRole('tab',{name:'Top',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.querySelector('.shm-body').scrollTop),scroll);
  assert.equal(await page.getByText('Currently wearing',{exact:true}).count(),1);
  await page.screenshot({path:out+'/wardrobe-'+width+'.png'});
  assert.deepEqual(errors,[]);await page.close();checks++;

  const bag=await browser.newPage({viewport:{width,height}}),bagErrors=[];bag.on('pageerror',e=>bagErrors.push(e.message));
  await bag.route(/^https:/,route=>route.abort());await bag.goto(base+'/__activities',{waitUntil:'domcontentloaded'});
  await bag.addStyleTag({content:'body>*:not(#activity){display:none!important}'});
  await bag.evaluate(async()=>{
   const {createActivities}=await import('/johansson-town/activities.js');
   window.activities=createActivities({say:()=>{},onWeather:()=>{},onTime:()=>{}});
   const {PRODUCTS}=await import('/johansson-town/src/commerce/products-data.js');
   activities.state.inventory=[...PRODUCTS.map(p=>p.inventoryName),'Green tea','Empty can','Unknown souvenir'];activities.bag();
  });
  await bag.getByLabel('Bag category',{exact:true}).selectOption('drinks');
  await bag.getByLabel('Search your bag',{exact:true}).fill('tea');
  await bag.getByRole('button',{name:'Green tea, 2',exact:true}).click();
  await bag.getByRole('button',{name:'Back to the bag',exact:true}).click();
  assert.equal(await bag.getByLabel('Bag category',{exact:true}).inputValue(),'drinks');assert.equal(await bag.getByLabel('Search your bag',{exact:true}).inputValue(),'tea');
  assert.equal(await bag.evaluate(()=>document.activeElement?.dataset.item),'Green tea');
  await bag.getByLabel('Search your bag',{exact:true}).fill('no such item');assert.match(await bag.locator('.bag-status').textContent(),/No items match/);
  await bag.getByLabel('Search your bag',{exact:true}).fill('');await bag.getByLabel('Bag category',{exact:true}).selectOption('all');
  await bag.screenshot({path:out+'/bag-'+width+'.png'});
  await bag.evaluate(async()=>{
   const {rememberEncounter}=await import('/johansson-town/src/people/relationships.js');
   rememberEncounter(activities.state,'Chin','Tetsuo',{minutes:1000});activities.residentRecord('Chin','Tetsuo');
  });
  assert.match(await bag.locator('#activityBody').textContent(),/Talked on the street/);
  assert.match(await bag.locator('#activityBody').textContent(),/Radio/);
  await bag.screenshot({path:out+'/resident-record-'+width+'.png'});
  assert.equal(await bag.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await bag.evaluate(()=>{activities.state.inventory=[];activities.bag();});assert.match(await bag.locator('.bag-status').textContent(),/Your bag is empty/);
  assert.deepEqual(bagErrors,[]);await bag.close();checks++;
 }
 for(const [width,height] of [[390,844],[820,1180],[1280,800],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)console.log('Studio asset',r.status(),r.url());});
  await page.route(/^https:/,route=>route.abort());await page.goto(base+'/avatar-creator/index.html',{waitUntil:'domcontentloaded'});
  try{await page.getByRole('region',{name:'Johansson Studio',exact:true}).waitFor({timeout:60000});}catch(error){console.log(JSON.stringify({errors,text:await page.locator('body').innerText()}));await page.screenshot({path:out+'/studio-failed.png'});throw error;}
  await page.getByRole('button',{name:'Personality & voice',exact:true}).click();
  await page.getByText('Choose their personality with four questions',{exact:true}).click();
  await page.screenshot({path:out+'/studio-questions-'+width+'.png'});
  for(let i=0;i<4;i++)await page.locator('.shm-questions input[value="1"]').nth(i).check();await page.getByRole('button',{name:'Apply answers',exact:true}).click();assert.equal(await page.locator('.shm-type strong').textContent(),'Typhoon');await page.getByRole('button',{name:'Undo',exact:true}).click();assert.notEqual(await page.locator('.shm-type strong').textContent(),'Typhoon');
  await page.getByLabel('Voice timbre',{exact:true}).selectOption('triangle');
  await page.getByRole('button',{name:'More vibrato',exact:true}).click();
  await page.getByRole('button',{name:'Hear them',exact:true}).click();await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>document.querySelector('.shm').scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByRole('tab',{name:'Top',exact:true}).waitFor();assert.deepEqual(errors,[]);await page.close();checks++;
 }
 console.log(`Passed ${checks} interface scenarios across phone, tablet, desktop and landscape; captures in ${out}`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
