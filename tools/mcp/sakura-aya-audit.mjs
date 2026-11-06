// Exact returning-customer scenario, through normal MCP controls only.
// node tools/mcp/sakura-aya-audit.mjs [desktop|phone] [18:35|19:13]
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {TourClient} from './tour-client.mjs';
import {MAGAZINE_RACK as R} from '../../src/world/interiors/sakura-magazine-rack.js';

const viewport=process.argv[2]||'desktop';assert.ok(['desktop','phone'].includes(viewport));
const start=process.argv[3]||'18:35';assert.ok(['18:35','19:13'].includes(start));
const departureCheck=start==='19:13',mode=departureCheck?'departure':'shopping';
const client=new TourClient('sakura-aya-'+viewport+'-'+mode),report={viewport,normalControls:true,fixturePlacement:false,start,mode,samples:[]};
const aya=()=>client.state.residents.find(p=>p.name==='Nhung');
const check=()=>{assert.deepEqual(client.state.errors,[]);assert.deepEqual(client.state.invalidTransforms,[]);};
try{
 await client.connect();await client.call('start_session',{viewport,spawn:'sakura-bench',time:start});
 await client.call('press_control',{control:'interact',durationMs:16});await client.settle();
 // Use the game's visible clock preference. No direct clock or NPC fixture edits.
 await client.call('ui_control',{control:'town_menu'});
 await client.call('ui_control',{control:'settings'});
 assert.equal((await client.call('ui_control',{control:'clock'})).accepted,true,'The normal clock button is available');
 const speedAction=client.state.ui.activity?.actions.find(a=>a.label.startsWith('Speed up · 4'));
 assert.ok(speedAction,'The visible clock menu offers 4× time');
 assert.equal((await client.call('choose_action',{label:speedAction.label})).accepted,true,'The normal speed choice is accepted');
 if(client.state.ui.directoryOpen)await client.call('ui_control',{control:'close_directory'});
 const site=client.state.sites.find(s=>s.id==='market');assert.ok(site,'Actual Sakura doorway exists');
 assert.equal((await client.enter(site)).entered,true,'Johansson walks through the normal Sakura doorway');
 if(client.state.view.thirdPerson)await client.call('press_control',{control:'view',durationMs:34});
 const walk=await client.navigate(-2.3,2.05,{inside:true,tolerance:.5});assert.equal(walk.reached,true,'Reach a clear view of the actual rack');
 await client.face(R.x,R.z);await client.shot('rack-and-header');
 let observed=false,departed=false,browsing=false,picked=false,paid=false;
 for(let second=0;second<(departureCheck?140:60);second++){
  await client.call('wait',{durationMs:1000});check();const person=aya();
  report.samples.push({second,minutes:client.state.game.minutes,aya:person,shop:client.state.shop});
  const customer=client.state.shop?.customers.find(c=>c.name==='Nhung');
  picked||=!!customer?.picked;paid||=!!customer?.paid;
  if(person?.inMarket&&person.visible){
   const [x,,z]=person.position,dx=Math.max(Math.abs(x-R.x)-R.width/2,0),dz=Math.max(Math.abs(z-R.z)-R.depth/2,0);
   assert.ok(Math.hypot(dx,dz)>=.35-1e-5,'Nhung’s body clears the real widened magazine rack');
   if(!observed){observed=true;await client.face(x,z);await client.shot('aya-evening-customer');}
   if(!browsing&&Math.abs(z-(R.z-R.depth/2-.45))<.3&&Math.abs(x-R.x)<1.2){browsing=true;await client.face(x,z);await client.shot('aya-clear-rack-browse');}
  }else if(observed){departed=true;await client.shot('aya-left-normally');break;}
 }
 assert.ok(observed,'The actual scheduled Nhung is visible during the authored evening stop');
 if(departureCheck)assert.ok(departed,'The actual customer walks out after 19:15');
 else{assert.ok(picked,'The actual customer claims a stocked item');assert.ok(paid,'The actual customer completes payment');}
 report.browsingObserved=browsing;report.departureObserved=departed;report.picked=picked;report.paid=paid;report.final=client.state;report.passed=true;
 console.log(`Normal MCP Nhung ${viewport} ${mode}: ${departureCheck?'departure observed':'stock pickup and payment observed'}; body clears the widened rack`);
}catch(error){report.failure=error.message;throw error;}
finally{if(client.output)await writeFile(resolve(client.output,'report.json'),JSON.stringify(report,null,2)+'\n');await client.close();}
