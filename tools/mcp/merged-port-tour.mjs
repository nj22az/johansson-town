// A normal walking/menu tour through the official MCP stdio client.
// No fixture, teleport, direct action, or browser evaluation path is used here.
import {TourClient} from './tour-client.mjs';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const tour=new TourClient('merged-port');
const coverage={rooms:[],journeys:[],walks:[],findings:[]};
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const normalWalk=async(x,z,options={})=>{
 let result=await tour.navigate(x,z,options);
 // A40cm sampled grid cannot place a precise counter approach between cells.
 // Confirm that last short segment with the same real controls, not a fixture.
 const p=tour.state.game.player;
 if(!result.reached&&Math.hypot(p[0]-x,p[2]-z)<.75){const last=await tour.call('follow_path',{points:[{x,z}],maxSeconds:8});result={...result,reached:last.reached,lastSegment:last};}
 coverage.walks.push({destination:[x,z],...result});
 assert(result.reached,`Normal walking did not reach ${x},${z}: ${result.reason||'coordinate frame changed'}`);
 return result;
};
async function sailTo(destination,label){
 const states=[];let photographed=false;
 for(let i=0;i<90;i++){
  const s=await tour.call('wait',{durationMs:1000});
  states.push({minutes:s.game.minutes,room:s.game.room,island:s.game.island,ferry:s.ferry,vehicles:s.vehicles});
  if(s.game.island.crossing?.destination===destination&&s.game.island.crossing.progress>.24&&s.game.island.crossing.progress<.8&&!photographed){await tour.shot(label+'-crossing');photographed=true;}
  if(s.game.island.location===destination&&!s.game.island.crossing){await tour.shot(label+'-landed');coverage.journeys.push({destination,states,photographed});return;}
 }
 throw Error(`The normal ${destination} ferry request did not finish within90 simulated seconds.`);
}

try{
 await tour.connect();await tour.call('start_session',{spawn:'pier',time:'09:00',viewport:'desktop',headless:true});await tour.settle();
 const liveTerminal=tour.state.sites.find(s=>s.id==='ferry-terminal')||tour.state.landmarks.find(s=>s.id==='ferry-terminal');
 const entry=tour.state.targets.find(t=>t.label==='Enter '+liveTerminal?.title);
 const terminal=liveTerminal?.door?{...liveTerminal,entryFacing:liveTerminal.entryFacing??Math.atan2(liveTerminal.door[0]-entry.position[0],liveTerminal.door[2]-entry.position[2])}:null;
 assert(terminal?.door,'The live town must expose the actual waiting-hall doorway.');
 await tour.face(terminal.door[0],terminal.door[2]);await tour.shot('01-port-exterior');
 const entered=await tour.enter(terminal);assert(entered.entered,'The actual Port Terminal door did not enter its waiting hall.');
 coverage.rooms.push({id:terminal.id,title:terminal.title,entry:entered});await tour.shot('02-waiting-hall-entrance');
 if(tour.state.view.thirdPerson)await tour.call('press_control',{control:'view',durationMs:34});
 await normalWalk(-3.5,.1,{inside:true,tolerance:.3});await tour.face(-4.5,.1);await tour.shot('03-waiting-hall-pier-window');
 await normalWalk(.35,-1.65,{inside:true,tolerance:.22});await tour.face(-.4,-2.15);await tour.shot('04-waiting-hall-counter');
 const ticket=tour.state.targets.find(t=>t.label==='Buy a ticket: Airport ferry');
 assert(ticket,'The waiting hall must expose exactly its current airport-ferry ticket interaction.');
 await normalWalk(ticket.position[0],ticket.position[2]+.20,{inside:true,tolerance:.10});await tour.face(ticket.position[0],ticket.position[2]);
 await tour.call('press_control',{control:'interact',durationMs:34});await tour.shot('05-shared-ticket-menu');
 // Read the actual visible labels rather than assuming an obsolete timetable.
 const labels=JSON.stringify(tour.state.ui);
 assert(labels.includes('Buy return ticket'),'The actual waiting-hall interaction did not open the shared ferry ticket menu.');
 await tour.call('choose_action',{label:'Buy return ticket · ¥400'});
 await tour.call('choose_action',{label:'Board the local ferry'});
 await tour.call('wait',{durationMs:1000});
 assert(tour.state.game.room===null,'Boarding from the waiting hall must close its room at the actual pier.');
 await tour.shot('06-waiting-hall-to-pier');await sailTo('airport','07-outbound');
 const landing=tour.state.game.player.slice();await normalWalk(landing[0]+.8,landing[2],{tolerance:.3});await tour.shot('08-airport-pier-walk');
 const returnTarget=tour.state.targets.find(t=>/ferry/i.test(t.label)&&/Minato|return/i.test(t.label));
 assert(returnTarget,'The airport pier must expose a normal return-ferry anchor.');
 await normalWalk(returnTarget.position[0],returnTarget.position[2],{tolerance:.75});await tour.face(returnTarget.position[0],returnTarget.position[2]);
 await tour.call('press_control',{control:'interact',durationMs:34});await tour.shot('09-airport-return-menu');
 assert(JSON.stringify(tour.state.ui).includes('Board the local ferry'),'The normal airport interaction must accept the existing return ticket.');
 await tour.call('choose_action',{label:'Board the local ferry'});await sailTo('town','10-return');
 assert(!tour.state.errors.length&&!tour.state.invalidTransforms.length,'The actual tour reported browser errors or invalid transforms.');
 coverage.completed=true;coverage.finalState=tour.state;
}catch(error){
 coverage.completed=false;coverage.error=error.message;coverage.finalState=tour.state;
 if(tour.connected){try{await tour.shot('failure');coverage.findings.push(await tour.call('report_finding',{summary:'Post-merge port/ferry normal tour could not complete',expected:'Walk through the actual waiting hall, buy a ticket, board its shared ferry, and return normally.',observed:error.message,reproduction:['Start the pier opening at09:00.','Follow the saved official MCP calls in output/mcp-merged-port-tour/actions.json.']}));}catch(captureError){coverage.captureError=captureError.message;}}
 process.exitCode=1;
}finally{
 await writeFile(resolve(tour.output,'coverage.json'),JSON.stringify(coverage,null,2));await tour.close();
 console.log(JSON.stringify({completed:coverage.completed,error:coverage.error,output:tour.output,rooms:coverage.rooms.map(r=>r.id),journeys:coverage.journeys.map(j=>j.destination)}));
}
