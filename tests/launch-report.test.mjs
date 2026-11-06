import test from 'node:test';
import assert from 'node:assert/strict';
import {createLaunchReport,readLaunchReport,LAUNCH_REPORT_KEY} from '../src/render/launch-report.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};
test('a restart retains the last completed stage while keeping the report bounded',()=>{
 const s=storage(),first=createLaunchReport({storage:s,now:()=>100});first.stage('Rendering first gameplay frame');
 const next=createLaunchReport({storage:s,now:()=>200});assert.equal(next.snapshot().previousStage,'Rendering first gameplay frame');
 for(let i=0;i<50;i++)next.stage('frame '+i);const saved=readLaunchReport(s);assert.equal(saved.events.length,16);assert.equal(saved.events.at(-1).stage,'frame 49');
});
test('errors are recorded locally and corrupted or denied storage never blocks rendering',()=>{
 const s=storage(),handlers=new Map(),events={addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)};
 s.setItem(LAUNCH_REPORT_KEY,'{"events":{}}');const report=createLaunchReport({storage:s,events});handlers.get('error')({message:'driver failure'});assert.equal(readLaunchReport(s).events.at(-1).stage,'Error: driver failure');report.dispose();assert.equal(handlers.size,0);
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('full');}};assert.doesNotThrow(()=>createLaunchReport({storage:denied}).stage('Playing'));
});
