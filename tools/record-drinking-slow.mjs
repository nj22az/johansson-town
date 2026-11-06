// Real browser playback at quarter speed, plus a network-free standalone check.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const out=new URL('../docs/qa/drinking/',import.meta.url);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/tmp/chromium',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report={date:new Date().toISOString(),browser:await browser.version(),errors,
  note:'Quarter-speed video is captured from actual browser playback. It is not a time-remapped copy of the normal-speed recording.'};
try{
  await page.goto(process.env.DRINKING_URL||'http://127.0.0.1:5175/drinking-simulator/');
  await page.waitForFunction(()=>window.__READY__,null,{timeout:60000});
  report.desktopWithoutRecording=await page.evaluate(async()=>{
    const a=window.__DRINKING_LAB__;a.sim.reset();a.clearMetrics();
    const done=new Promise(resolve=>a.sim.addEventListener('sipCompleted',resolve,{once:true}));
    a.sim.sip();await done;return a.metrics();
  });
  await page.setViewportSize({width:960,height:760});
  const recording=await page.evaluate(async()=>{
    const a=window.__DRINKING_LAB__;a.sim.reset();a.sim.speed=.25;a.view.setCamera('side');a.render();
    const stream=a.view.renderer.domElement.captureStream(30),chunks=[];
    const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
    const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:4500000});
    const start=performance.now();
    return new Promise((resolve,reject)=>{
      let timeout,tail;
      const cleanup=()=>{clearTimeout(timeout);clearTimeout(tail);stream.getTracks().forEach(track=>track.stop());a.sim.speed=1;};
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=e=>{cleanup();reject(e.error||Error('Slow-motion recording failed.'));};
      recorder.onstop=async()=>{
        const elapsedMs=performance.now()-start;cleanup();
        if(!a.sim.lastEvent){reject(Error('Slow-motion cycle did not complete.'));return;}
        const blob=new Blob(chunks,{type:'video/webm'});
        resolve({filename:'beer-quarter-speed.webm',mimeType,elapsedMs,playbackSpeed:.25,event:a.sim.lastEvent,
          bytes:[...new Uint8Array(await blob.arrayBuffer())]});
      };
      a.sim.addEventListener('sipCompleted',()=>{tail=setTimeout(()=>recorder.stop(),350);},{once:true});
      timeout=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},45000);
      recorder.start(250);a.sim.sip();
    });
  });
  await writeFile(new URL(recording.filename,out),Buffer.from(recording.bytes));delete recording.bytes;report.recording=recording;
  assert.ok(recording.elapsedMs>26000&&recording.elapsedMs<30000);
  assert.equal(recording.event.volumeConsumedMl,42);
  const network=[];
  await page.route(/^https?:/,route=>{network.push(route.request().url());return route.abort();});
  await page.goto(new URL('../drinking-simulator/standalone.html',import.meta.url).href);
  await page.waitForFunction(()=>window.__READY__,null,{timeout:60000});
  report.offline=await page.evaluate(()=>{
    const a=window.__DRINKING_LAB__,results=[];
    for(const id of ['beer','whiskey','gintonic']){
      a.sim.reset();a.sim.selectDrink(id);a.sim.sip();a.sim.update(7);
      results.push({drink:id,active:a.sim.active,event:a.sim.lastEvent});
    }
    return {url:location.protocol,results};
  });
  assert.deepEqual(network,[]);assert.equal(report.offline.url,'file:');
  for(const r of report.offline.results){assert.equal(r.active,false);assert.ok(r.event.volumeConsumedMl>0);}
  assert.deepEqual(errors,[]);report.passed=true;
  console.log('Quarter-speed real-time capture, unrecorded desktop measurement and offline HTML passed.');
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await writeFile(new URL('slow-motion-results.json',out),JSON.stringify(report,null,2)+'\n');await browser.close();}
