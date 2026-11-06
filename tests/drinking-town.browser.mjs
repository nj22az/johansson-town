// Actual compiled-town integration: normal Drink / R / V / W inputs, read-only
// actor diagnostics, and deterministic audit stepping. No production state setters.
// npm run build:runtime && node tests/drinking-town.browser.mjs
// CHROMIUM_EXECUTABLE defaults to /tmp/chromium; this capture uses SwiftShader.
import assert from 'node:assert/strict';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {TownAuditSession} from '../tools/mcp/session.mjs';
import {CYCLE_DURATION, DRINK_PHASES, phaseStart} from '../src/drinking/cycle.js';

const out = new URL('../docs/qa/drinking-simulator/town/', import.meta.url);
await mkdir(out, {recursive:true});
const report = {
  compiled:true, softwareGPU:true, viewport:{width:1280,height:800},
  notes:[
    'Actual compiled Johansson World opening at Minato Izakaya, 20:30.',
    'Normal UI/keyboard inputs start actions; audit step advances elapsed time and camera only changes inspection framing.',
    'Linux headless Chromium with SwiftShader software rendering. No FPS, physical-phone, Safari or Firefox claim.',
    'The existing game cast retains mitten hands. The separate mannequin lab supplies articulated finger evidence.',
  ], checks:[], captures:[], samples:[], events:[],
};
report.runtime = JSON.parse(await readFile(new URL('../runtime/source.json',import.meta.url),'utf8'));
const session = new TownAuditSession({launch:async options => {
  const browser = await chromium.launch({...options,
    executablePath:process.env.CHROMIUM_EXECUTABLE || '/tmp/chromium',
    args:[...(options.args||[]),'--disable-dev-shm-usage','--no-sandbox',
      '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  });
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async options => {
    const context = await newContext(options);
    await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
    return context;
  };
  return browser;
}});
let propId, rest, parentId, elapsed = 0;
const distance = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
const snapshot = label => session.page.evaluate(({label,propId})=>{
  const a=window.__JOHANSSON_AUDIT__,actor=a.johansson,avatar=actor?.avatar;
  const prop=propId ? a.scene.getObjectByProperty('uuid',propId) :
    a.room.children.find(o=>o.userData.drinkKind==='draft'&&o.userData.consumable==='drink');
  const held=[];avatar?.root.traverse(o=>{if(o.userData.consumable==='drink')held.push(o.uuid);});
  const arm=avatar?.root.getObjectByName('Drinking arm, first person');
  const drink=document.querySelector('#drink');
  const phase=actor?.drinkingState||null;
  let meshGrip=null;
  if(prop&&avatar&&['GRASP','SIP','SET_DOWN'].includes(phase?.id)){
    const body=avatar.body,g=body.geometry,bone=body.skeleton.bones.indexOf(avatar.bones.handR);
    const vertices=new Map(),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
    const shell=prop.getObjectByName('Hollow draft glass'),box=shell.geometry.boundingBox;
    const radius=Math.max(Math.abs(box.min.z),Math.abs(box.max.z))*shell.scale.z;
    let closest=Infinity,samples=0;
    const inspect=p=>{if(p.y>.01&&p.y<.149){closest=Math.min(closest,Math.hypot(p.x,p.z)-radius);samples++;}};
    for(let i=0;i<g.attributes.position.count;i++){
      if(g.attributes.skinIndex.getX(i)!==bone||g.attributes.skinWeight.getX(i)<.999)continue;
      const p=prop.worldToLocal(body.localToWorld(body.getVertexPosition(i,prop.position.clone().set(0,0,0))));
      vertices.set(i,p);inspect(p);
      p.toArray().forEach((v,k)=>{bounds.min[k]=Math.min(bounds.min[k],v);bounds.max[k]=Math.max(bounds.max[k],v);});
    }
    const count=g.index?.count||g.attributes.position.count;
    for(let i=0;i<count;i+=3){
      const a=vertices.get(g.index?g.index.getX(i):i),b=vertices.get(g.index?g.index.getX(i+1):i+1),c=vertices.get(g.index?g.index.getX(i+2):i+2);
      if(!a||!b||!c||a.clone().sub(b).cross(c.clone().sub(b)).lengthSq()<1e-24)continue;
      inspect(a.clone().add(b).add(c).multiplyScalar(1/3));
    }
    const handle=[prop.userData.grip.handle,prop.userData.grip.height,0];
    meshGrip={clearanceMm:closest*1000,samples,
      handleInsideClasp:handle.every((v,k)=>v>=bounds.min[k]&&v<=bounds.max[k])};
  }
  const failures=[],invalid=[];
  a.scene.traverse(o=>{
    if(!o.matrixWorld.elements.every(Number.isFinite))invalid.push(o.name||o.type);
    if(o.userData.loadError)failures.push(o.name||o.type);
  });
  return {
    label, room:JSON.parse(window.render_game_to_text()).room,seated:a.seated,
    seat:a.seat,thirdPerson:a.mouse.thirdPerson,beer:a.beer,
    drinking:actor?.drinking||false,phase,meshGrip,
    rootVisible:actor?.root.visible??false,bodyVisible:avatar?.body.visible??false,
    arm:arm?{visible:arm.visible,meshes:arm.children.length}:null,held,
    prop:prop?{
      uuid:prop.uuid,parent:prop.parent?.uuid,position:prop.position.toArray(),
      world:prop.getWorldPosition(prop.position.clone()).toArray(),quaternion:prop.quaternion.toArray(),
      portion:prop.userData.portion??1,
      volumeMl:prop.userData.tableDrinkFluid ?
        prop.userData.tableDrinkFluid.startingVolumeMl*(prop.userData.portion??1) : null,
      visible:prop.visible,
    }:null,
    directDrinks:a.room.children.filter(o=>o.userData.consumable==='drink').map(o=>o.uuid),
    ui:{drinkHidden:drink.hidden,drinkDisabled:drink.disabled},
    failures,invalid,
  };
},{label,propId});
const sample = async label => {const state=await snapshot(label);report.samples.push(state);return state;};
const checkProp = state => {
  assert.ok(state.prop,'Delivered table prop still exists: '+state.label);
  assert.equal(state.prop.uuid,propId,'The same delivered prop is authoritative');
  assert.equal(state.prop.parent,parentId,'No attachment switch or copied table prop');
  assert.equal(state.directDrinks.filter(id=>id===propId).length,1,'One delivered table prop');
  assert.deepEqual(state.held,[],'No duplicate drinking prop is attached to the avatar');
  assert.deepEqual(state.failures,[],'No model load failure');
  assert.deepEqual(state.invalid,[],'No invalid scene transforms');
  if(state.phase){
    assert.ok(state.phase.wristError<.003,'Wrist remains in contact: '+state.label);
    if(state.phase.id==='SIP')assert.ok(state.phase.rimError<.002,'Rim remains at lips');
    if(['PREPARE','REACH','GRASP','RELEASE','RETURN'].includes(state.phase.id))
      assert.ok(distance(state.prop.position,rest.position)<1e-8,'Glass rests on the table before grasp / after set-down');
  }
  if(state.meshGrip){
    assert.ok(state.meshGrip.samples>50,'Inspect the actual rendered hand beside the mug');
    assert.ok(state.meshGrip.clearanceMm>=.5,'Rendered mitten clears the mug body: '+state.label);
    assert.equal(state.meshGrip.handleInsideClasp,true,'The corrected visible hand retains its handle grip');
  }
};
const capture = async (name,view=null) => {
  await session.page.evaluate(view=>{const a=window.__JOHANSSON_AUDIT__;a.camera=view;a.render();},view);
  const file=name+'.png';
  await session.page.screenshot({path:new URL(file,out).pathname,timeout:60000});
  report.captures.push({file,camera:view||'normal game camera'});
};
const stepTo = async (time,label) => {
  assert.ok(time>=elapsed-1e-8,'Test advances forwards through the action');
  await session.page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),(time-elapsed)*1000);
  elapsed=time;const state=await sample(label);checkProp(state);return state;
};
const setView = async third => {
  await session.page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
  if((await snapshot('view')).thirdPerson!==third)await session.page.keyboard.press('KeyV');
  await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(34));
  assert.equal((await snapshot('view')).thirdPerson,third,'V selects the requested game view');
};

try {
  console.log('town drinking: starting compiled izakaya opening');
  let startupTimer;
  try {
    await Promise.race([
      (async()=>{
        await session.start({viewport:'desktop',spawn:'izakaya',time:'20:30',source:false});
        await session.page.waitForFunction(()=>{
          const a=window.__JOHANSSON_AUDIT__;
          return a.roomNavigation?.id==='izakaya'&&!a.blocked.roomLoading&&a.seated&&a.beer?.drink?.kind==='draft';
        },null,{timeout:240000});
      })(),
      new Promise((_,reject)=>{startupTimer=setTimeout(()=>reject(Error('Bounded compiled startup exceeded 240 seconds')),240000);}),
    ]);
  } finally {clearTimeout(startupTimer);}
  const page=session.page;page.setDefaultTimeout(60000);
  report.browser=await session.browser.version();
  report.environment=await page.evaluate(()=>{
    const gl=window.__JOHANSSON_AUDIT__.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {userAgent:navigator.userAgent,platform:navigator.platform,
      gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      runtimeScripts:performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\/runtime\/.+\.js/.test(n)),
    };
  });
  assert.ok(report.environment.runtimeScripts.length>0,'Browser loaded compiled runtime modules');
  assert.deepEqual(await page.evaluate(()=>fetch('./runtime/source.json').then(r=>r.json())),report.runtime,'Compiled package matches this checkout');
  await page.exposeFunction('__recordTownSip',detail=>report.events.push(detail));
  await page.evaluate(()=>window.addEventListener('sipCompleted',event=>window.__recordTownSip(event.detail)));
  await page.keyboard.press('KeyV'); // Explicit normal input dismisses the opening camera even when already in third person.
  await setView(true);
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(600));
  const initial=await sample('delivered');
  assert.equal(initial.room,'izakaya');assert.equal(initial.seated,true);
  assert.equal(initial.beer.drink.kind,'draft');assert.equal(initial.beer.drink.left,6);
  assert.ok(initial.prop,'Opening delivered a draft beer');
  propId=initial.prop.uuid;parentId=initial.prop.parent;rest=initial.prop;checkProp(initial);
  const player=initial.seat.position;
  const inspection={pos:[player[0]+1.40,1.45,player[2]-.95],at:[player[0]-.05,1.04,player[2]-.23]};
  await capture('third-person-rest');
  report.checks.push('compiled opening is seated with one actual delivered draft beer');

  // A complete third-person cycle begun with the actual context-rail button.
  await page.locator('#drink').click();elapsed=0;
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(0));
  assert.equal((await sample('button-start')).drinking,true,'Drink button starts the shared table action');
  let previous=1;
  for(const phase of DRINK_PHASES){
    const time=phaseStart(phase.id)+phase.duration*.60;
    const state=await stepTo(time,'third-'+phase.id);
    assert.equal(state.phase?.id,phase.id,'Compiled action uses each shared phase');
    if(phase.index<7)assert.equal(state.prop.portion,previous,'No liquid consumed before SIP');
    if(phase.id==='SIP'){
      assert.ok(state.phase.valid,'Actual glass/lip/liquid contact permits flow');
      assert.ok(state.prop.portion<1&&state.prop.portion>5/6,'Consumption is gradual during SIP');
      await capture('third-person-mouth',inspection);
    }
    if(phase.id==='REACH'){
      const before=state.phase.elapsed;
      await page.keyboard.press('KeyR');
      assert.equal((await snapshot('repeated-R')).phase.elapsed,before,'Repeated R cannot restart the action');
    }
    if(phase.id==='GRASP')await capture('third-person-grasp',inspection);
    if(phase.id==='RELEASE'){
      assert.ok(distance(state.prop.position,rest.position)<1e-8,'Glass reaches its exact table marker before release');
      await capture('third-person-setdown',inspection);
    }
    previous=state.prop.portion;
  }
  let done=await stepTo(CYCLE_DURATION+.05,'third-complete');
  assert.equal(done.drinking,false);assert.equal(done.beer.drink.left,5);
  assert.ok(Math.abs(done.prop.portion-5/6)<1e-8);assert.ok(distance(done.prop.position,rest.position)<1e-8);
  report.checks.push('Drink button: all 12 phases, same prop, held/lip/table constraints, rendered-hand clearance, valid gradual consumption and repeat gating');

  // A second complete action from the player's eyes, using the R keyboard equivalent.
  await setView(false);await page.keyboard.press('KeyR');elapsed=0;
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(0));
  assert.equal((await snapshot('R-start')).drinking,true,'R starts a consecutive sip');
  let first=await stepTo(phaseStart('GRASP')+.15,'first-GRASP');
  assert.ok(first.arm?.visible&&first.arm.meshes>0,'The actual skinned near arm is visible');
  assert.equal(first.bodyVisible,false,'First-person view excludes the camera-inside-head body');
  await capture('first-person-grasp');
  first=await stepTo(phaseStart('SIP')+.80,'first-SIP');
  assert.equal(first.phase.id,'SIP');assert.ok(first.phase.valid);assert.ok(first.arm?.visible);
  await capture('first-person-mouth');
  first=await stepTo(phaseStart('RELEASE')+.08,'first-RELEASE');
  assert.ok(distance(first.prop.position,rest.position)<1e-8);
  done=await stepTo(CYCLE_DURATION+.05,'first-complete');
  assert.equal(done.drinking,false);assert.equal(done.beer.drink.left,4);assert.equal(done.arm,null,'Transient first-person arm buffers are released');
  assert.ok(Math.abs(done.prop.portion-4/6)<1e-8);
  await page.waitForTimeout(50);
  assert.equal(report.events.length,2,'Exactly one sipCompleted event for each completed cycle');
  assert.ok(report.events.every(e=>e.drinkId==='beer'&&e.source==='izakaya'&&e.volumeConsumedMl>0));
  assert.ok(Math.abs(report.events[0].volumeConsumedMl-report.events[1].volumeConsumedMl)<1e-6);
  report.checks.push('R: consecutive complete sip in first person, same real arm/glass, cleanup and actual-volume events');

  // Standing cancels a partially swallowed third sip, keeping only actual consumption.
  await setView(true);await page.keyboard.press('KeyR');elapsed=0;
  const partial=await stepTo(phaseStart('SIP')+.75,'before-standing');
  assert.ok(partial.prop.portion<4/6&&partial.prop.portion>3/6);
  const stood=await session.input({control:'forward',durationMs:34});
  assert.equal(stood.accepted,true);
  const cancelled=await sample('standing-cancel');checkProp(cancelled);
  assert.equal(cancelled.seated,false);assert.equal(cancelled.drinking,false);
  assert.ok(distance(cancelled.prop.position,rest.position)<1e-8,'Standing restores the supported table glass');
  assert.equal(cancelled.prop.portion,partial.prop.portion,'Standing preserves the actually swallowed fraction');
  assert.equal(cancelled.arm,null);assert.equal(report.events.length,2,'Cancellation is not a completed sip');
  await capture('standing-cancel',inspection);
  report.checks.push('normal W standing cancels safely, supports the original glass, preserves partial consumption and removes arm view');

  await session.observe();
  // The room opening cancels street-model streaming when it moves indoors. As in
  // minato-compact.browser.mjs, cancellation is evidence, not a load error. Keep
  // HTTP failures, shader/page errors and actual model loadError flags failing.
  report.cancelledRequests=session.errors.filter(e=>e.type==='request'&&/\/assets\/models\/\S+ net::ERR_ABORTED$/.test(e.message));
  report.errors=session.errors.filter(e=>!report.cancelledRequests.includes(e));
  assert.deepEqual(report.errors,[],'No browser, console, shader, HTTP or failed-request errors');
  report.checks.push('no browser/load errors or invalid transforms');
  await rm(new URL('failure.png',out),{force:true});
  report.passed=true;console.log('town drinking: '+report.checks.length+' check groups passed');
} catch(error) {
  report.passed=false;report.failure=error.message;report.errors=session.errors;
  console.error(error);process.exitCode=1;
  if(session.page)try {
    report.failureState=await session.observe();
    await session.page.screenshot({path:new URL('failure.png',out).pathname,timeout:30000});
  } catch(diagnostic) {report.diagnosticFailure=diagnostic.message;}
} finally {
  try {await writeFile(new URL('browser-results.json',out),JSON.stringify(report,null,2)+'\n');}
  finally {await session.close();}
}
