// Actual browser interaction, deterministic contact evidence and real-time canvas capture.
// DRINKING_URL=http://127.0.0.1:5173/drinking-simulator/ CHROMIUM_EXECUTABLE=/tmp/chromium node tests/drinking-simulator.browser.mjs
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import os from 'node:os';

const out=new URL('../docs/qa/drinking/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/tmp/chromium',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={date:new Date().toISOString(),host:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,logicalCpuCount:os.cpus().length},
  browser:await browser.version(),graphics:'Chromium / ANGLE SwiftShader software rendering in a Linux container',
  limits:['Desktop and phone viewport sizes, not physical desktop/mobile GPUs.','No Safari, Firefox or physical iOS/Android tests performed.','Real-time videos use canvas.captureStream; they are not offline time-remapped renders.'],checks:[],fills:[],captures:[],recordings:[],errors:[]};
let page=await browser.newPage({viewport:{width:1100,height:800},deviceScaleFactor:1});
const trackErrors=page=>{
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()}: ${r.url()}`);});
};
trackErrors(page);
const capture=async name=>{await page.screenshot({path:new URL(name+'.png',out).pathname});report.captures.push(name+'.png');};
const pose=async(id,t,fill=1,camera='side')=>page.evaluate(({id,t,fill,camera})=>{
  const a=window.__DRINKING_LAB__;a.sim.reset();a.sim.selectDrink(id);a.view.setCamera(camera);
  return a.renderAt(t,{volume:a.sim.profile.startingVolumeMl*fill});
},{id,t,fill,camera});
try{
  await page.goto(process.env.DRINKING_URL||'http://127.0.0.1:5173/drinking-simulator/');await page.waitForFunction(()=>window.__READY__,null,{timeout:60000});
  assert.equal(await page.locator('#development').isVisible(),false,'development controls hidden initially');
  await capture('desktop-rest');
  await page.click('#sip');await page.keyboard.press('Space');
  assert.equal(await page.locator('#sip').isDisabled(),true);assert.equal(await page.locator('[data-drink="whiskey"]').isDisabled(),true);
  const before=await page.evaluate(()=>window.__DRINKING_LAB__.sim.cycleNumber);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>window.__DRINKING_LAB__.sim.cycleNumber),before);
  await page.click('#reset');assert.equal(await page.locator('#sip').isEnabled(),true);
  report.checks.push('Real UI gates repeated Space/sip and drink changes; Reset restores controls.');

  // Fault injection exercises real UI handlers and recorder lifecycle without
  // encoding a video. These checks are separate from the real captures below.
  report.recorderControls=await page.evaluate(async()=>{
    const a=window.__DRINKING_LAB__,canvas=a.view.renderer.domElement,$=id=>document.getElementById(id);
    const original={recorder:globalThis.MediaRecorder,capture:canvas.captureStream,timeout:globalThis.setTimeout,
      click:HTMLAnchorElement.prototype.click,speed:a.sim.speed};
    let mode='normal',stoppedTracks=0,downloads=0;const instances=[],checks=[];
    const check=(condition,message)=>{if(!condition)throw Error(message);};
    class FakeRecorder{
      static isTypeSupported(){return true;}
      constructor(){if(mode==='constructor')throw Error('Injected constructor failure.');this.state='inactive';instances.push(this);}
      start(){if(mode==='start')throw Error('Injected start failure.');this.state='recording';}
      stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['test recording'])});this.onstop?.();});}
    }
    const dispatch=(id,type)=>$(id).dispatchEvent(new Event(type,{bubbles:true}));
    const snapshot=()=>[a.sim.elapsed,a.sim.volume,a.sim.cycleNumber,a.sim.profile.id,a.sim.paused];
    const attackControls=()=>{
      const before=JSON.stringify(snapshot());
      $('speed').value='0.1';dispatch('speed','change');
      $('scrub').value='3.5';dispatch('scrub','input');
      for(const id of ['pause','sip','refill','record'])dispatch(id,'click');
      document.querySelector('[data-drink="whiskey"]').dispatchEvent(new Event('click'));
      document.querySelector('[data-fill="0.5"]').dispatchEvent(new Event('click'));
      window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));
      check(JSON.stringify(snapshot())===before,'Recording guards reject scrub, pause, repeated sip, fill and drink changes.');
      check(a.sim.speed===1&&$('speed').value==='1','Recording guards preserve normal speed.');
      check($('speed').disabled&&$('scrub').disabled&&$('pause').disabled,'Recording disables playback controls.');
    };
    const restored=()=>{
      check(a.sim.speed===.5&&$('speed').value==='0.5','Prior playback speed is restored.');
      check(!$('speed').disabled&&!$('scrub').disabled&&!$('pause').disabled,'Playback controls unlock after settlement.');
    };
    try{
      globalThis.MediaRecorder=FakeRecorder;
      canvas.captureStream=()=>{if(mode==='stream')throw Error('Injected stream failure.');return {getTracks:()=>[{stop(){stoppedTracks++;}}]};};
      HTMLAnchorElement.prototype.click=()=>{downloads++;};
      a.sim.reset();a.sim.speed=.5;a.render();
      let pending=a.record();attackControls();$('reset').click();
      let result=await pending;
      check(result.cancelled===true&&result.completed===false&&!result.blob,'Reset settles recording as cancelled without a video.');
      restored();check(stoppedTracks===1,'Reset stops the acquired stream.');checks.push('Reset cancellation and every UI recording gate.');

      for(mode of ['stream','constructor','start']){
        a.sim.reset();result=await a.record();
        check(result.completed===false&&result.error.includes('Injected'),'Synchronous capture failures settle as errors.');
        check(!a.sim.active,'Failed setup does not start a sip.');restored();
      }
      checks.push('Capture-stream, constructor and start exceptions restore controls and speed.');
      mode='normal';a.sim.reset();pending=a.record();
      const failed=instances.at(-1),lateStop=failed.onstop;
      failed.onerror({error:Error('Injected encoding failure.')});lateStop();result=await pending;
      check(result.completed===false&&result.error.includes('encoding')&&!result.blob,'Encoding errors cannot turn a later stop into a successful clip.');
      restored();$('reset').click();checks.push('Asynchronous encoding failure settles once without a download.');

      pending=a.record();instances.at(-1).stop();result=await pending;
      check(result.completed===false&&result.error.includes('did not complete'),'An early recorder stop is not reported as a completed sip.');
      restored();$('reset').click();
      globalThis.setTimeout=(callback,delay,...args)=>original.timeout.call(globalThis,callback,delay===30000?0:delay,...args);
      pending=a.record();result=await pending;globalThis.setTimeout=original.timeout;
      check(result.completed===false&&result.error.includes('timed out')&&!result.blob,'A timeout does not save a partial video. Returned: '+JSON.stringify(result));
      restored();$('reset').click();checks.push('Early stop and timeout never save incomplete footage.');

      pending=a.record({download:false});a.sim.update(a.duration+.1);
      check(!a.sim.active,'The sip has completed before its recording tail.');attackControls();
      result=await pending;
      check(result.completed===true&&result.blob.size>0&&result.filename==='beer-real-time.webm','Only a completed sip resolves with a video.');
      restored();check(downloads===0,'Cancelled and failed recordings never attempt a download.');
      checks.push('Post-sip recording tail rejects a second action and only success returns a video.');
      return {passed:true,checks,stoppedTracks};
    }finally{
      $('reset').click();globalThis.MediaRecorder=original.recorder;canvas.captureStream=original.capture;
      globalThis.setTimeout=original.timeout;HTMLAnchorElement.prototype.click=original.click;
      a.sim.speed=original.speed;a.render();
    }
  });

  for(const id of ['beer','whiskey','gintonic']){
    for(const fill of [1,.5,.04]){
      const d=await pose(id,3.5,fill);
      assert.ok(d.mouthError<1e-5);assert.ok(d.wristError<1e-5);assert.equal(d.reachClamped,false);assert.ok(d.flowValid);
      report.fills.push({drink:id,fill,volumeMl:d.volumeMl,consumedMl:d.consumedMl,tiltDegrees:d.tiltRadians*180/Math.PI,
        mouthErrorMm:d.mouthError*1000,wristErrorMm:d.wristError*1000,wristDeviationDegrees:d.wristDeviation,
        fingerMinClearanceMm:d.fingerMinClearance*1000,thumbMinClearanceMm:d.thumbMinClearance*1000});
      await capture(`${id}-${fill===1?'full':fill===.5?'half':'near-empty'}-sip`);
    }
    for(const [label,t,camera] of [['grip',1.20,'grip'],['mouth',3.5,'mouth'],['setdown',5.65,'setdown']]){
      await pose(id,t,1,camera);await capture(`${id}-${label}`);
    }
    // The oblique view reveals the opposing thumb and four fingers that can be
    // hidden behind the palm and forearm in the default side presentation.
    await pose(id,1.20,1,'orbit');
    await page.evaluate(()=>{
      const a=window.__DRINKING_LAB__,grip=a.sim.vessel.markers.grip.getWorldPosition(a.rig.mouth.position.clone());
      a.view.camera.position.copy(grip).add(grip.clone().set(.23,.14,.30));
      a.view.camera.lookAt(grip);a.render();
    });
    await capture(`${id}-grip-oblique`);
    // Real-time recording is driven by the ordinary requestAnimationFrame loop.
    await page.evaluate(id=>{const a=window.__DRINKING_LAB__;a.sim.reset();a.sim.selectDrink(id);a.view.setCamera('side');a.render();a.clearMetrics();},id);
    const recording=await page.evaluate(async()=>{
      const a=window.__DRINKING_LAB__,start=performance.now(),result=await a.record({download:false});
      if(!result.completed)throw Error(result.error||'The real-time capture was cancelled.');
      return {filename:result.filename,mimeType:result.mimeType,bytes:[...new Uint8Array(await result.blob.arrayBuffer())],elapsedMs:performance.now()-start,
        event:a.sim.lastEvent,performance:a.metrics()};
    });
    await writeFile(new URL(recording.filename,out),Buffer.from(recording.bytes));delete recording.bytes;report.recordings.push(recording);
    assert.equal(recording.event.drinkId,id);assert.ok(recording.event.volumeConsumedMl>0);
    console.log(`${id}: full/half/near-empty, closeups and real-time recording complete`);
  }

  // Five neighbouring rendered frames around each important physical transition.
  for(const [label,time] of [['grasp',1.2],['lip',2.6],['table',5.65]]){
    for(let frame=-2;frame<=2;frame++){
      await pose('beer',time+frame/60,1,label==='lip'?'mouth':label==='table'?'setdown':'grip');
      await capture(`transition-${label}-${frame+2}`);
    }
  }
  await pose('beer',0,1,'body');await capture('whole-body-support');

  // Reset acts immediately even if the animation was paused at an inspected phase.
  for(const time of [.6,3.4,5.3]){
    await pose('beer',time);await page.click('#reset');
    const state=await page.evaluate(()=>{const s=window.__DRINKING_LAB__.sim;return {active:s.active,paused:s.paused,phase:s.diagnostics.phase,volume:s.volume,base:s.diagnostics.baseError};});
    assert.deepEqual(state,{active:false,paused:false,phase:'IDLE',volume:400,base:0});
  }
  await page.click('#dev-toggle');await page.click('#sip');await page.click('#pause');
  const frozen=await page.evaluate(()=>{const s=window.__DRINKING_LAB__.sim;return [s.elapsed,s.volume];});
  await page.waitForTimeout(450);assert.deepEqual(await page.evaluate(()=>{const s=window.__DRINKING_LAB__.sim;return [s.elapsed,s.volume];}),frozen);
  await page.click('#reset');await page.click('#dev-close');report.checks.push('Pause holds clock and volume; reset works during reach, sip and set-down.');

  // A separate mobile context sends actual touch events; viewport resizing alone
  // does not exercise the touch input path.
  await page.close();
  const phoneContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  page=await phoneContext.newPage();trackErrors(page);
  await page.goto(process.env.DRINKING_URL||'http://127.0.0.1:5173/drinking-simulator/');await page.waitForFunction(()=>window.__READY__,null,{timeout:60000});
  await capture('phone-rest');
  await page.tap('[data-drink="gintonic"]');await page.tap('#sip');
  assert.equal(await page.locator('#sip').isDisabled(),true);await page.tap('#reset');
  assert.deepEqual(await page.evaluate(()=>{const s=window.__DRINKING_LAB__.sim;return [s.profile.id,s.active,s.paused,s.volume];}),['gintonic',false,false,260]);
  await pose('gintonic',3.5);await capture('phone-sip');
  const mobile=await page.evaluate(()=>{
    const a=window.__DRINKING_LAB__,points=[a.rig.mouth,a.rig.wrist,a.vessel?.markers?.rim||a.sim.vessel.markers.rim],rect=document.querySelector('#viewport').getBoundingClientRect();
    return {width:innerWidth,touchPoints:navigator.maxTouchPoints,coarsePointer:matchMedia('(pointer: coarse)').matches,overflow:document.documentElement.scrollWidth>innerWidth,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
      points:points.map(o=>{const p=o.getWorldPosition(a.rig.mouth.position.clone()).project(a.view.camera);return [p.x,p.y,p.z];})};
  });
  assert.ok(mobile.touchPoints>0);assert.equal(mobile.coarsePointer,true);
  assert.equal(mobile.overflow,false);for(const p of mobile.points)assert.ok(Math.abs(p[0])<.95&&Math.abs(p[1])<.95,'phone interaction remains framed');
  report.phone=mobile;report.checks.push('390×844 mobile context uses touch taps for selection, sip and reset; mouth, wrist and rim remain framed without horizontal overflow.');
  await page.tap('#reset');await page.evaluate(()=>window.__DRINKING_LAB__.clearMetrics());await page.tap('#sip');
  await page.waitForFunction(()=>!window.__DRINKING_LAB__.sim.active,null,{timeout:15000});report.phonePerformance=await page.evaluate(()=>window.__DRINKING_LAB__.metrics());
  assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;await page.screenshot({path:new URL('browser-failure.png',out).pathname});throw error;}
finally{await writeFile(new URL('browser-results.json',out),JSON.stringify(report,null,2)+'\n');await browser.close();}
