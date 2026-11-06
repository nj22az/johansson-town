// Grounded Minato check: the public MCP server, camera/keyboard controls and UI only.
// No scene, player, clock, calendar, actor or room fixture writes.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {TourClient} from './tour-client.mjs';
import {getFutureCalendarDate} from '../../src/world/interiors/future-calendar.js';

const tour=new TourClient('izakaya-polish'),report={normalControls:true,fixturePlacement:false,start:'20:30',walks:[],checks:[],warnings:[]};
const save=async()=>writeFile(resolve(tour.output,'report.json'),JSON.stringify(report,null,2)+'\n');
const clean=()=>{
 // Preserve request/asset evidence, but complete the control test even if a legacy
 // display asset request is aborted during startup.
 report.observedErrors=tour.state.errors;
 assert.deepEqual(tour.state.invalidTransforms,[],'No invalid actual scene transforms');
};
const walk=async(label,x,z,tolerance=.55)=>{
 const result=await tour.navigate(x,z,{inside:true,tolerance});
 report.walks.push({label,goal:[x,z],...result,player:tour.state.game.player});
 console.log(JSON.stringify({walk:label,reached:result.reached,player:tour.state.game.player,room:tour.state.game.room}));
 await save();return result.reached;
};
const closeActivity=async()=>{
 if(tour.state.ui.activity)await tour.call('press_control',{control:'close',durationMs:16});
};

try{
 await tour.connect();await tour.call('start_session',{spawn:'izakaya',time:'20:30'});await tour.settle();
 assert.equal(tour.state.game.room,'izakaya','The real isolated opening is Minato');
 report.initial={player:tour.state.game.player,seated:tour.state.seated,calendar:tour.state.game.calendar};
 const stand=await tour.call('press_control',{control:'forward',durationMs:300});
 assert.equal(stand.accepted,true);assert.equal(tour.state.seated,false,'Normal W input stands from the opening counter seat');
 report.checks.push('normal forward control stands from counter');
 if(tour.state.view.thirdPerson)await tour.call('press_control',{control:'view',durationMs:34});
 const b=tour.state.roomNavigation.bounds,width=b.maxX-b.minX,depth=b.maxZ-b.minZ;
 const grid=await tour.call('inspect_navigation',{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,width,depth,cell:.4,radius:.28});
 report.navigation={bounds:b,width,depth,cell:grid.cell,columns:grid.columns,rows:grid.rows,cells:grid.cells.length,components:grid.components,reachableCells:grid.cells.filter(c=>c.reachable).length};
 assert.ok(grid.cells.length<=4096,'The full shared dining grid fits the public tool budget');
 report.checks.push('full shared dining navigation grid');clean();
 await tour.shot('counter-after-standing');

 assert.ok(await walk('lounge aisle',-3.8,4.55),'Walk to the actual lounge aisle');
 await tour.face(-5.4,4.6);await tour.call('look',{degrees:0,verticalDegrees:10});await tour.shot('lounge');
 // The seat, small table and empty crates occupy -5,5.35. Approach from their
 // clear eastern edge; the actual wall calendar remains within interaction range.
 assert.ok(await walk('calendar approach',-4.35,5.7),'Walk to a standing-clear spot beside the lounge');
 const target=tour.state.targets.find(t=>t.label==='Read Future Calendar');assert.ok(target,'Actual calendar target is registered');
 await tour.face(target.position[0],target.position[2]);await tour.call('look',{degrees:0,verticalDegrees:-10});
 await tour.shot('calendar-on-wall');await tour.call('press_control',{control:'interact',durationMs:16});
 report.calendar={target,actual:tour.state.game.calendar,expected:getFutureCalendarDate(new Date()),activity:tour.state.ui.activity,player:tour.state.game.player};
 await tour.shot('calendar-dialogue');
 assert.equal(report.calendar.activity?.title,'Future Calendar','The normal interaction opens the calendar');
 assert.ok(report.calendar.activity.body.includes(report.calendar.expected.dateLabel),'Dialogue has today’s complete real civil date');
 assert.ok(report.calendar.activity.body.includes('Europe/Stockholm'),'Dialogue names the real civil-date timezone');
 assert.equal(report.calendar.actual.dateKey,report.calendar.expected.dateKey,'Rendered game calendar uses today’s real date');
 report.checks.push('calendar date, full date dialogue and Stockholm timezone');
 await closeActivity();clean();

 assert.ok(await walk('middle dining aisle',0,4.4),'Return through the lounge/dining aisle');
 assert.ok(await walk('front of counter',0,-.35),'Cross the normal customer aisle');
 assert.ok(await walk('counter east passage',3.88,-1.1),'Walk around the end of the counter');
 assert.ok(await walk('shared kitchen aisle',4.35,-3.95),'Reach the existing staff aisle');
 await tour.face(4,-5.95);await tour.call('look',{degrees:0,verticalDegrees:12});await tour.shot('shared-kitchen');
 assert.ok(await walk('Sato shared kitchen',7.1,-4.25),'Use the actual shared kitchen opening');
 await tour.face(8.3,-5.9);await tour.call('look',{degrees:0,verticalDegrees:12});await tour.shot('sato-kitchen');
 report.checks.push('customer aisle, counter end and shared kitchen crossing');clean();

 assert.ok(await walk('return from kitchen',4,-.5),'Return through the counter end');
 if(await walk('table seat approach',3.3,.25)){
  await tour.face(3.3,.9);await tour.call('press_control',{control:'interact',durationMs:16});
  report.table={seated:tour.state.seated,player:tour.state.game.player};
  if(tour.state.seated){
   await tour.call('press_control',{control:'interact',durationMs:16});
   const orderAction=tour.state.ui.activity?.actions.find(a=>a.label==='Order a drink…');
   if(orderAction){
    await tour.call('choose_action',{label:orderAction.label});
    const draft=tour.state.ui.activity.actions.find(a=>a.label==='Orion draught, medium mug · ¥450');
    if(draft){
     await tour.call('choose_action',{label:draft.label});report.table.ordered=draft.label;
     for(let attempt=0;attempt<6;attempt++){
      await tour.call('wait',{durationMs:6000});await tour.call('press_control',{control:'interact',durationMs:16});
      const drink=tour.state.ui.activity?.actions.find(a=>a.label==='Cheers · Kanpai, and drink');
      if(drink){report.table.served=tour.state.ui.activity;await tour.call('choose_action',{label:drink.label});report.table.drank=true;await tour.call('wait',{durationMs:500});break;}
      await closeActivity();
     }
    }
   }
   await closeActivity();await tour.shot('dining-seat');
   await tour.call('press_control',{control:'forward',durationMs:300});
   report.checks.push('normal dining seat');
   if(report.table.drank)report.checks.push('normal order, service and drink action');
   else report.warnings.push('Optional order/drink did not complete in the bounded menu probe.');
  }else{report.warnings.push('The optional table seat was unavailable.');await closeActivity();}
 }

 assert.ok(await walk('door approach',0,5.65),'Walk back to the actual exit doorway');
 await tour.face(0,6.2);await tour.call('press_control',{control:'forward',durationMs:650});await tour.settle();
 if(tour.state.game.room==='izakaya'){
  report.exitButton=await tour.call('ui_control',{control:'exit_room'});await tour.settle();
 }
 assert.equal(tour.state.game.room,null,'Leave through the reachable normal doorway');
 await tour.shot('returned-outside');clean();report.checks.push('normal walk back and return outside');
 report.final={room:tour.state.game.room,player:tour.state.game.player,errors:tour.state.errors,invalidTransforms:tour.state.invalidTransforms};
 report.passed=true;report.runtimeClean=tour.state.errors.length===0;
 console.log(JSON.stringify({passed:true,checks:report.checks,calls:tour.log.length,captures:tour.captures.length,errors:tour.state.errors.length,invalidTransforms:tour.state.invalidTransforms.length,calendar:report.calendar.actual}));
}catch(error){report.failure=error.message;report.final=tour.state;console.error(error);process.exitCode=1;}
finally{report.calls=tour.log.length;report.captures=tour.captures.length;await save();await tour.close();}
