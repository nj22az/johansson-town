// All game actions use the official MCP tools and the visible normal UI.
// Run after the coordinated runtime build: node tools/mcp/sakura-consumption-audit.mjs [desktop|phone]
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {TourClient} from './tour-client.mjs';

const viewport=process.argv[2]||'desktop';assert.ok(['desktop','phone'].includes(viewport));
const client=new TourClient('sakura-consumption-'+viewport),report={viewport,normalControls:true,fixturePlacement:false,checks:[]};
const wallet=s=>Number(s.ui.wallet.replace(/[^\d]/g,''));
const check=()=>{assert.deepEqual(client.state.errors,[]);assert.deepEqual(client.state.invalidTransforms,[]);};
try{
 await client.connect();await client.call('start_session',{viewport,spawn:'sakura-bench',time:'12:00'});
 await client.call('press_control',{control:'interact',durationMs:16});await client.settle();
 if(client.state.view.thirdPerson)await client.call('press_control',{control:'view',durationMs:34});
 const startWallet=wallet(client.state);
 const walked=await client.call('follow_path',{points:[{x:-2,z:-20.5},{x:-2,z:-32.73},{x:-5.8,z:-32.73}],maxSeconds:30});
 assert.equal(walked.reached,true,'Walk from Sakura bench to the actual vending machine');assert.equal(client.state.game.room,null);
 await client.face(-7,-32.73);await client.call('press_control',{control:'interact',durationMs:16});
 assert.ok(client.state.ui.activity?.actions.some(a=>a.label==='Dockside Coffee · ¥120'),'The normal machine offers coffee');
 await client.call('choose_action',{label:'Dockside Coffee · ¥120'});
 assert.equal(wallet(client.state),startWallet-120,'Purchase pays the actual price once');
 await client.call('wait',{durationMs:1000});await client.shot('purchased-can-ready-first-person');
 // The explicit wait lets the normal offer/drop animation finish before drinking.
 await client.call('ui_control',{control:'town_menu'});await client.call('ui_control',{control:'bag'});await client.call('choose_action',{label:'Canned coffee'});
 assert.ok(client.state.ui.activity?.actions.some(a=>a.label==='Drink it'),'Owned drink has its normal bag action');
 await client.call('choose_action',{label:'Drink it'});
 if(client.state.ui.directoryOpen)await client.call('ui_control',{control:'close_directory'});
 // The purchase has already put this can in his hand. The bag action starts
 // its 850ms sip immediately; capture the lift before it finishes.
 await client.call('wait',{durationMs:350});
 await client.shot('drinking-first-person');check();
 // V is the real view control: this capture checks the same consumption's avatar pose.
 await client.call('press_control',{control:'view',durationMs:16});await client.call('wait',{durationMs:120});await client.shot('drinking-avatar');check();
 await client.call('wait',{durationMs:1800});await client.shot('consumption-complete');
 await client.call('ui_control',{control:'town_menu'});await client.call('ui_control',{control:'bag'});
 assert.ok(client.state.ui.activity?.body.includes('Empty can'),'Actual consumption leaves a recycling can');
 assert.ok(!client.state.ui.activity?.actions.some(a=>a.label==='Canned coffee'),'Consumed drink is absent from the bag');
 assert.equal(wallet(client.state),startWallet-120,'Consumption never charges twice');
 report.checks=['normal walking to vending','normal purchase','explicit wait before consumption','owned bag action','first-person and avatar pixels','empty container','single payment'];
 report.captureTiming={pickupMs:600,sipMs:850,firstPersonWaitAfterDrinkActionMs:350,avatarViewControlMs:16,avatarAdditionalWaitMs:120,expectedFirstPersonPhase:'mid-sip lift',expectedAvatarPhase:'mid-sip lift'};
 report.final=client.state;check();report.passed=true;
 console.log(`Normal MCP consumption ${viewport}: coffee bought, waited, drunk and recycled once`);
}catch(error){report.failure=error.message;throw error;}
finally{if(client.output)await writeFile(resolve(client.output,'report.json'),JSON.stringify(report,null,2)+'\n');await client.close();}
