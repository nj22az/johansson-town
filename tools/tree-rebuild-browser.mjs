// Real compiled World, not a substitute scene. CI captures are software-browser evidence, not device acceptance.
import {chromium} from 'playwright';
import {serveGame} from './mcp/static-server.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=new URL('../',import.meta.url).pathname,out=resolve(root,'output/tree-rebuild');await mkdir(out,{recursive:true});
const server=await serveGame(root),report={productionDefault:true,physicalDevice:false,errors:[],captures:[],trees:[]};let browser;
try{
 browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.clear();localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(server.url+'?audit&visual-audit');await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 console.log('Production trees: compiled World playing');
 const views=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__;a.renderFrozen=false;a.world.kitano.ensure();a.setTime(10003*1440+12*60);
  const island=a.world.airportIsland.group,plants=a.world.airportIsland.tropic.plantings;
  // Existing Three vectors are obtained from the scene, so the capture does not import a second engine.
  const world=(x,y,z)=>island.localToWorld(island.position.clone().set(x,y,z)).toArray();
  const pick=(list,height,name)=>{const p=list[Math.floor(list.length/3)];return {name,pos:world(p.u+7,p.y+2,p.v+10),at:world(p.u,p.y+height,p.v),player:world(p.u+5,p.y,p.v+8)};};
  return [{name:'park-gajumaru',pos:[29,1.8,-1],at:[24.4,3,-6.3],player:[29,0,-1]},
   {name:'school-fukugi',pos:[9,1.8,28],at:[12.95,3,31],player:[9,0,28]},
   {name:'retained-cherry',pos:[17,1.8,-27],at:[12,3,-29.8],player:[17,0,-27]},
   pick(plants.palms,5,'kitano-palm'),pick(plants.trees,4,'kitano-broadleaf'),pick(plants.pandanus,2,'kitano-pandanus'),pick(plants.bananas,1.8,'kitano-banana')];
 });
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['phone-width',{width:390,height:844}]]){
  await page.setViewportSize(viewport);
  for(const v of views){
   await page.evaluate(v=>{const a=window.__JOHANSSON_AUDIT__;a.stand(...v.player);a.camera={pos:v.pos,at:v.at};a.world.airportIsland.tropic.lod(a.world.airportIsland.group.position.clone().set(...v.player));a.step(0);},v);
   await page.waitForTimeout(250);const file=device+'-'+v.name+'.png';await page.locator('#game').screenshot({path:resolve(out,file)});report.captures.push(file);console.log('Captured '+file);
  }
 }
 report.trees=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return a.world.airportIsland.tropic.plants.children.filter(m=>m.geometry?.userData.treeDesign).map(m=>({name:m.name,count:m.count,design:m.geometry.userData.treeDesign,triangles:m.geometry.index.count/3}));});
 if(report.trees.reduce((n,t)=>n+t.count,0)!==222)throw Error('The compiled game did not build all 222 tropical CAD trees');
 if(report.errors.length)throw Error(report.errors.join('\n'));
 console.log('Production trees compiled-game acceptance passed');
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();await server.close();}
