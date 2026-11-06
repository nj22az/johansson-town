import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {TownAuditSession} from '../tools/mcp/session.mjs';
const out=new URL('../docs/qa/izakaya-items/',import.meta.url);await mkdir(out,{recursive:true});
const views=[
 {name:'window-door',pos:[-1.1,1.75,3.4],at:[-3.0,1.55,6.24]},
 {name:'room',pos:[0,2.25,5.15],at:[-.8,1.1,-2.5]},
 {name:'table-food',pos:[-3.5,1.75,3.7],at:[-3.5,1.03,2.1]},
 {name:'koagari-food',pos:[4.35,1.55,1.5],at:[5.3,.82,.5]},
 {name:'fish-grill',pos:[-.1,2.0,-.9],at:[-.5,1.22,-2.9]},
 {name:'oden-cat-register',pos:[-1.9,1.75,-3.85],at:[-.6,1.18,-2.65]},
 {name:'cookware',pos:[1.3,1.7,-4.65],at:[1.6,.99,-5.95]},
 {name:'sink-prep',pos:[4.35,1.72,-4.6],at:[4.8,.92,-5.95]},
 {name:'backbar-radio',pos:[-2.8,2.3,-4.5],at:[-2.75,1.8,-6.1]},
 {name:'crates-lounge',pos:[-3.9,1.4,4.8],at:[-5.4,.52,5.65]},
 {name:'phone',pos:[3.42,1.24,5.59],at:[3.42,1.10,6.16]},
 {name:'karaoke',pos:[5.3,1.37,4.3],at:[5.86,.8,5.2]},
 {name:'tanuki',pos:[2.25,.92,4.8],at:[2.25,.45,5.78]},
 {name:'sato-kitchen',pos:[9.05,1.74,-4.55],at:[8.7,.99,-5.95]},
 {name:'sato-ticket-tv',pos:[8.6,1.8,1.3],at:[8.7,1.9,3.1]},
];
const report=[];
for(const viewport of ['desktop','phone']){
 const s=new TownAuditSession();try{
  await s.start({viewport,spawn:'izakaya',time:'20:30'});await s.page.waitForLoadState('networkidle');
  await s.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('Minato interior'));
  await s.input({control:'forward',durationMs:17});
  for(const view of viewport==='desktop'?views:views.filter(v=>['room','table-food','phone','karaoke','tanuki','cookware'].includes(v.name))){
   await s.page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},view);
   await s.page.screenshot({path:new URL(viewport+'-'+view.name+'.png',out).pathname});
  }
  const actual=await s.page.evaluate(()=>{
   const a=window.__JOHANSSON_AUDIT__,model=a.scene.getObjectByName('Minato interior'),meshes=[];
   model.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,triangles:(o.geometry.index?.count||o.geometry.attributes.position.count)/3});});
   return {meshes,draws:a.renderInfo,devices:a.scene.getObjectByName('Minato detailed devices')?.userData.placements};
  });
  const state=await s.observe();assert.deepEqual(state.invalidTransforms,[]);
  const cancellations=state.errors.filter(e=>e.type==='request'&&e.message.startsWith(s.preview.url)&&e.message.endsWith('net::ERR_ABORTED'));
  assert.deepEqual(state.errors.filter(e=>!cancellations.includes(e)),[]);
  assert.ok(actual.meshes.length<=8,'Room detail remains in shared material batches');
  assert.equal(actual.devices.length,2);
  report.push({viewport,actual,errors:state.errors,cancellations});console.log(viewport+' item views passed');
 }finally{await s.close();}
}
await writeFile(new URL('results.json',out),JSON.stringify(report,null,2)+'\n');
