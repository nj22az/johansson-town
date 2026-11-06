import {createDrinkingScene} from '../src/drinking/scene.js';
import {createMannequin} from '../src/drinking/mannequin.js';
import {DrinkingSimulation} from '../src/drinking/simulation.js';
import {CYCLE_DURATION} from '../src/drinking/cycle.js';

const $=id=>document.getElementById(id),view=createDrinkingScene($('viewport'));
const phaseLabels={IDLE:'At rest',PREPARE:'Preparing',REACH:'Reaching',GRASP:'Taking hold',LIFT:'Lifting',APPROACH:'Approaching',CONTACT:'At the lips',SIP:'Taking a sip',SWALLOW:'Swallowing',RECOVER:'Moving away',SET_DOWN:'Setting down',RELEASE:'Releasing',RETURN:'Returning to rest'};
let sim,rig,recording=false,cancelRecording=null,scrubVolume,inspection=false,previous=performance.now(),lastUi=0;
const timings=[],cpuTimes=[];

function announce(text){$('announcement').textContent=text;}
function ui(){
  const d=sim.diagnostics,p=sim.profile,busy=sim.active,empty=sim.volume<=.0001;
  $('phase').textContent=phaseLabels[d.phase];
  $('instruction').textContent=empty?'Empty glass — refill to continue.':'A shared, sober drinking motion.';
  $('drink-name').textContent=p.name;
  $('volume').textContent=`${sim.volume<1&&sim.volume>0?sim.volume.toFixed(1):Math.round(sim.volume)} ml`;
  $('volume-bar').max=p.startingVolumeMl;$('volume-bar').value=sim.volume;
  $('sip').disabled=busy||empty||recording;$('refill').disabled=busy||recording;
  $('pause').disabled=recording;$('pause').textContent=sim.paused?'Resume':'Pause';
  $('speed').disabled=recording;$('speed').value=String(sim.speed);$('scrub').disabled=recording;
  $('record').disabled=busy||empty||recording;
  $('record').textContent=recording?'Recording…':'Record one sip';
  $('time-label').textContent=`${(sim.elapsed||0).toFixed(2)} s`;
  if(document.activeElement!==$('scrub'))$('scrub').value=sim.elapsed||0;
  document.querySelectorAll('[data-drink]').forEach(button=>{button.disabled=busy||recording;button.setAttribute('aria-pressed',button.dataset.drink===p.id);});
  document.querySelectorAll('[data-fill]').forEach(button=>button.disabled=busy||recording);
  if(!$('development').hidden){
    const fps=timings.length?1000/(timings.reduce((a,b)=>a+b,0)/timings.length):0;
    const fields=[['Phase',d.phase],['Glass controller',d.controller],['Liquid',`${sim.volume.toFixed(2)} ml`],['Glass tilt',`${(d.tiltRadians*180/Math.PI).toFixed(1)}°`],['Lip error',`${(d.mouthError*1000).toFixed(3)} mm`],['Wrist error',`${((d.wristError||0)*1000).toFixed(3)} mm`],['Flow',d.flowValid?'Contact + liquid at rim':'Closed'],['Measured frame rate',fps?`${fps.toFixed(1)} fps`:'Measuring…'],['Last sip',sim.lastEvent?`${sim.lastEvent.volumeConsumedMl.toFixed(2)} ml`:'—']];
    $('telemetry').replaceChildren(...fields.flatMap(([key,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;return [dt,dd];}));
  }
}
function draw(){view.render(rig,sim);}
function clearInspection(){inspection=false;scrubVolume=undefined;}
function reset(){cancelRecording?.();clearInspection();sim.reset();draw();ui();announce('Character and drink reset.');}
function sip(){if(recording)return;if(sim.sip()){clearInspection();ui();announce('Taking a sip.');}}
function toggleDev(open=!$('development').hidden){$('development').hidden=!open;$('dev-toggle').setAttribute('aria-expanded',String(open));ui();}

async function recordSip({download=true}={}){
  const unavailable=message=>{if(!recording)$('record-status').textContent=message;return {completed:false,error:message};};
  if(recording||sim.active||sim.volume<=.0001)return unavailable('Record at rest with liquid in the glass.');
  const formats=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
  const mimeType=formats.find(m=>globalThis.MediaRecorder?.isTypeSupported?.(m));
  if(!mimeType||!view.renderer.domElement.captureStream)return unavailable('Canvas recording is not supported in this browser.');
  const priorSpeed=sim.speed,drink={id:sim.profile.id,name:sim.profile.name};
  recording=true;sim.speed=1;
  $('record-status').textContent='Recording the real-time canvas at normal speed…';ui();
  return new Promise(resolve=>{
    let stream,recorder,timeout,tail,settled=false,completed=false;
    const chunks=[];
    // Every exit, including a synchronous constructor/start failure, owns the
    // same cleanup. Cancellation resolves explicitly and never saves a clip.
    const finish=(result,message)=>{
      if(settled)return;settled=true;
      clearTimeout(timeout);clearTimeout(tail);sim.removeEventListener('sipCompleted',done);
      if(recorder){
        recorder.ondataavailable=recorder.onerror=recorder.onstop=null;
        if(recorder.state!=='inactive'){try{recorder.stop();}catch{/* Already stopped by the browser. */}}
      }
      stream?.getTracks().forEach(track=>track.stop());
      recording=false;cancelRecording=null;sim.speed=priorSpeed;
      $('record-status').textContent=message;ui();resolve(result);
    };
    const fail=error=>{const message=error?.message||String(error);finish({completed:false,error:message},`Recording failed: ${message} No video saved.`);};
    const done=()=>{
      completed=true;
      tail=setTimeout(()=>{
        try{if(recorder.state!=='recording')throw Error('The recorder stopped before capture finished.');recorder.stop();}
        catch(error){fail(error);}
      },300);
    };
    cancelRecording=()=>finish({completed:false,cancelled:true},'Recording cancelled. No video saved.');
    try{
      stream=view.renderer.domElement.captureStream(30);
      recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:5000000});
      recorder.ondataavailable=event=>{if(!settled&&event.data.size)chunks.push(event.data);};
      recorder.onerror=event=>fail(event.error||Error('The browser could not encode the recording.'));
      recorder.onstop=()=>{
        if(settled)return;
        if(!completed){fail(Error('The drinking cycle did not complete.'));return;}
        try{
          const blob=new Blob(chunks,{type:mimeType.split(';')[0]});
          if(!blob.size)throw Error('The browser returned an empty recording.');
          const extension=mimeType.startsWith('video/mp4')?'mp4':'webm',filename=`${drink.id}-real-time.${extension}`;
          if(download){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
          finish({completed:true,blob,filename,mimeType},`Captured ${drink.name.toLowerCase()} at normal playback speed.`);
        }catch(error){fail(error);}
      };
      sim.addEventListener('sipCompleted',done,{once:true});
      timeout=setTimeout(()=>fail(Error('Capture timed out before a complete sip was saved.')),30000);
      recorder.start(200);
      if(settled)return;
      if(!sim.sip())throw Error('A new drinking cycle could not start.');
      clearInspection();
    }catch(error){fail(error);}
  });
}

try{
  rig=await createMannequin();view.scene.add(rig.root);sim=new DrinkingSimulation({scene:view.scene,rig});
  $('loading').hidden=true;$('reset').disabled=false;ui();draw();
  $('sip').addEventListener('click',sip);
  $('reset').addEventListener('click',reset);
  $('refill').addEventListener('click',()=>{if(recording)return;if(sim.refill()){clearInspection();draw();ui();announce('Drink refilled.');}});
  document.querySelectorAll('[data-drink]').forEach(button=>button.addEventListener('click',()=>{if(recording)return;if(sim.selectDrink(button.dataset.drink)){clearInspection();draw();ui();announce(`${sim.profile.name} selected.`);}}));
  document.querySelectorAll('[data-fill]').forEach(button=>button.addEventListener('click',()=>{if(recording)return;if(sim.setVolume(sim.profile.startingVolumeMl*Number(button.dataset.fill))){clearInspection();scrubVolume=sim.volume;draw();ui();}}));
  $('dev-toggle').addEventListener('click',()=>toggleDev($('development').hidden));$('dev-close').addEventListener('click',()=>toggleDev(false));
  $('pause').addEventListener('click',()=>{if(recording)return;sim.paused=!sim.paused;previous=performance.now();ui();});
  $('speed').addEventListener('change',()=>{if(recording){$('speed').value=String(sim.speed);return;}sim.speed=Number($('speed').value);});
  $('camera').addEventListener('change',()=>{view.setCamera($('camera').value);draw();});
  $('markers').addEventListener('change',()=>{view.debug.visible=$('markers').checked;draw();});
  $('scrub').addEventListener('input',()=>{
    if(recording){$('scrub').value=sim.elapsed;return;}
    if(!inspection){scrubVolume=sim.active?sim.startVolume:sim.volume;inspection=true;}
    sim.renderAt(Number($('scrub').value),{volume:scrubVolume});draw();ui();
  });
  $('record').addEventListener('click',()=>{if(!recording)recordSip().catch(error=>{$('record-status').textContent=error.message;});});
  window.addEventListener('keydown',event=>{
    if(event.code==='Space'&&!event.repeat&&!['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)){
      event.preventDefault();sip();
    }
    if(event.code==='Escape'&&!$('development').hidden)toggleDev(false);
  });
  sim.addEventListener('sipCompleted',event=>{
    window.dispatchEvent(new CustomEvent('sipCompleted',{detail:event.detail}));
    announce(sim.volume<=.0001?'The glass is empty. Refill to continue.':`Sip complete. ${Math.round(sim.volume)} millilitres remaining.`);ui();
  });
  document.addEventListener('visibilitychange',()=>{previous=performance.now();});

  // Inspection and automation use the same rig, clock, state and renderer as UI.
  window.__DRINKING_LAB__={sim,rig,view,
    renderAt(t,options){sim.renderAt(t,options);draw();ui();return sim.diagnostics;},
    render(){draw();ui();},record:recordSip,
    metrics(){const sorted=timings.slice().sort((a,b)=>a-b),cpu=cpuTimes.slice().sort((a,b)=>a-b);const gl=view.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {
      browser:navigator.userAgent,platform:navigator.platform,hardwareConcurrency:navigator.hardwareConcurrency,
      gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      width:view.renderer.domElement.width,height:view.renderer.domElement.height,dpr:view.renderer.getPixelRatio(),
      samples:sorted.length,meanFrameMs:sorted.reduce((a,b)=>a+b,0)/Math.max(1,sorted.length),p95FrameMs:sorted[Math.floor(sorted.length*.95)],
      medianCpuMs:cpu[Math.floor(cpu.length*.5)],p95CpuMs:cpu[Math.floor(cpu.length*.95)],
      drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles,
      geometries:view.renderer.info.memory.geometries,textures:view.renderer.info.memory.textures};},
    clearMetrics(){timings.length=0;cpuTimes.length=0;},duration:CYCLE_DURATION,
  };
  window.__READY__=true;
  function animate(now){
    requestAnimationFrame(animate);const dt=Math.max(0,(now-previous)/1000);previous=now;
    if(document.hidden)return;
    if(dt>0&&dt<2){timings.push(dt*1000);if(timings.length>600)timings.shift();}
    const start=performance.now();sim.update(dt);draw();cpuTimes.push(performance.now()-start);if(cpuTimes.length>600)cpuTimes.shift();
    if(now-lastUi>100){ui();lastUi=now;}
  }
  previous=performance.now();requestAnimationFrame(animate);
}catch(error){$('loading').textContent=`The drinking study could not start: ${error.message}`;console.error(error);}
