import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {TownAuditSession} from '../tools/mcp/session.mjs';
const session=new TownAuditSession({launch:async options=>{
 const browser=await chromium.launch({...options,executablePath:process.env.CHROME,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const create=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await create(options);await context.route(/^https:/,route=>route.abort());return context;};return browser;
}});
await mkdir('output/resident-life',{recursive:true});
try{
 const state=await session.start({spawn:'sakura-bench',time:'12:00'});console.log('World started');assert.deepEqual(state.errors.filter(e=>e.type==='page'),[]);
 await session.input({control:'forward',durationMs:350});
 const menu=await session.ui({control:'town_menu'});assert.equal(menu.accepted,true);
 console.log('Town Book opened');
 assert.equal((await session.ui({control:'residents'})).accepted,true);assert.equal((await session.choose({label:'Chin'})).accepted,true);
 await session.page.getByLabel('Compare resident',{exact:true}).selectOption('Tetsuo',{timeout:10000});
 assert.match(await session.page.locator('#activityBody').textContent(),/Common ground/);
 await writeFile('output/resident-life/world-record.png',await session.screenshot());
 await session.ui({control:'close_activity'});
 const after=await session.input({control:'forward',durationMs:350});assert.equal(after.accepted,true);
 const final=await session.observe();assert.deepEqual(final.errors.filter(e=>e.type==='page'),[]);assert.deepEqual(final.invalidTransforms,[]);
 const localFailures=final.errors.filter(e=>e.type==='asset'||e.type==='request'&&!e.message.startsWith('https://fonts.googleapis.com/')&&!e.message.endsWith('net::ERR_ABORTED'));
 assert.deepEqual(localFailures,[]);
 console.log('Production World entry, Town Book record, comparison, return to movement and valid transforms passed. External font requests are blocked in this isolated test.');
}catch(error){
 if(session.page){console.log(JSON.stringify({buttons:await session.page.locator('button:visible').allTextContents(),state:await session.controlState()}));await writeFile('output/resident-life/world-failed.png',await session.screenshot());}
 throw error;
}finally{await session.close();}
