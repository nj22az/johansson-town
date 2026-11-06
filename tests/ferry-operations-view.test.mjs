import test from 'node:test';
import assert from 'node:assert/strict';
import {Element} from './fixtures.mjs';
import {ferryOperationSummary,createFerryOperationsView,FERRY_COMMAND_DUTIES} from '../src/ui/ferry-operations-view.js';

test('a held departure reports the real incomplete conditions regardless of elapsed time',()=>{
 const run={berth:'town',destination:'airport',operation:{id:1,stage:'standby',label:'Receiving readiness reports',elapsed:9999,blocking:['Shore power remains connected','Ramp locks not confirmed'],
  plant:{stage:'starting-generators',ready:false},ramp:{down:0,locked:false},gangway:{out:false},lines:[{id:'head',status:'fast'}],tasks:[{id:'deck-report',complete:false}]}};
 const before=JSON.stringify(run),s=ferryOperationSummary(run);
 assert.equal(s.active,true);assert.equal(s.label,'Receiving readiness reports');
 assert.match(s.detail,/Shore power remains connected/);assert.match(s.detail,/Ramp locks not confirmed/);
 assert.deepEqual(s.checks.find(c=>c[0]==='Ramp'),['Ramp','Checking locks']);
 assert.deepEqual(s.checks.find(c=>c[0]==='Moorings'),['Moorings','0 of 1 lines recovered']);
 assert.equal(JSON.stringify(run),before);
});

test('task, vehicle, line and radio displays come from the actual operation snapshot',()=>{
 const s=ferryOperationSummary({operation:{stage:'let-go',tasks:[{complete:true},{complete:false}],vehicleSummary:{aboard:2,secured:1,driversClear:1},lines:[{status:'coiled'},{status:'heaving'}],
  history:[{sequence:1,speaker:'Chief officer',text:'Hold departure. One car remains unsecured.'}],phaseProgress:.4}});
 assert.equal(s.detail,'1 of 2 assigned tasks complete');assert.equal(s.progress,.4);
 assert.match(s.report,/Chief officer: Hold departure/);
 assert.deepEqual(s.checks.find(c=>c[0]==='Vehicles'),['Vehicles','1 of 2 secured · drivers still on vehicle deck']);
 assert.deepEqual(s.checks.find(c=>c[0]==='Moorings'),['Moorings','1 of 2 lines recovered']);
 assert.equal(Object.keys(FERRY_COMMAND_DUTIES).length,8);
});

test('arriving shows lines made fast and does not advertise a partly rigged gangway as open',()=>{
 const s=ferryOperationSummary({operation:{stage:'opening-access',lines:[{status:'fast'},{status:'fast'}],gangway:{out:.5}}});
 assert.deepEqual(s.checks.find(c=>c[0]==='Moorings'),['Moorings','2 of 2 lines fast']);
 assert.deepEqual(s.checks.find(c=>c[0]==='Passenger access'),['Passenger access','Moving · access closed']);
});

test('opening, reading and closing the crew view cannot request or advance a sailing',()=>{
 class Node extends Element{constructor(tag){super();this.tagName=tag;}remove(){this.removed=true;}}
 const doc={createElement(tag){const n=new Node(tag);n.ownerDocument=doc;return n;}},parent=doc.createElement('div');
 const run={berth:'airport',beginCrossing(){throw Error('The read-only view must not request a crossing');},update(){throw Error('The view must not advance the controller');}};
 const api=createFerryOperationsView({parent,run,getCrew:()=>[{post:'master',title:'Master',name:'Bus driver'}],getProcedure:()=>({standby:{label:'Readiness reports',seconds:10}})});
 api.update({visible:false});assert.equal(api.element.hidden,true);
 api.open();assert.equal(api.element.hidden,false);assert.equal(api.element.open,true);
 const all=n=>[n,...n.children.flatMap(all)];const texts=all(api.element).map(n=>n.textContent||'').join(' ');
 assert.match(texts,/Master · Bus driver/);assert.match(texts,/Readiness reports/);assert.match(texts,/A cold start/);
 api.close();api.update({visible:true});assert.equal(api.element.hidden,true);
 run.operation={id:2,stage:'prepare',label:'Preparing the ship'};api.update({visible:true});assert.equal(api.element.hidden,false);
 api.destroy();assert.equal(api.element.removed,true);
});
