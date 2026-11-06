// GPU smoke checks for the compiled desktop and bounded iPhone effect paths.
// Serve the repository root on 8765. Screenshots are evidence, not device benchmarks.
import assert from 'node:assert/strict';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
const out=resolve('docs/qa/iphone-full-effects');await mkdir(out,{recursive:true});
const report={physicalDevice:false,views:[],engines:[]};
const mobileUA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let failed;
const reference=resolve('tools/ink-reference.js');
await writeFile(reference,execFileSync('git',['show','a42fad65dc19c577f7f9b5707be152618aa92180:johansson-town/src/render/ink-pipeline.js'],{encoding:'utf8'}).replace('../../vendor/three.module.js','../vendor/three.module.js'));
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[],env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'}});
  try{
   const probe=await browser.newPage();await probe.goto('http://127.0.0.1:8765/johansson-town/');
   const webgl=await probe.evaluate(()=>!!document.createElement('canvas').getContext('webgl2'));await probe.close();
   if(!webgl){report.engines.push({engine,status:'unavailable',reason:'Runner does not provide WebGL2'});console.log(engine,'WebGL2 unavailable');continue;}
   report.engines.push({engine,status:'tested'});
   const parityPage=await browser.newPage();await parityPage.goto('http://127.0.0.1:8765/johansson-town/');
   const parity=await parityPage.evaluate(async()=>{
    const THREE=await import('/johansson-town/vendor/three.module.js');
    const old=await import('/johansson-town/tools/ink-reference.js');
    const now=await import('/johansson-town/src/render/ink-pipeline.js');
    const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(320,240);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x86cff2);
    scene.add(new THREE.HemisphereLight(0xeef5ff,0x8a82b0,1));
    const sun=new THREE.DirectionalLight(0xfff0da,2.5);sun.position.set(-3,5,2);scene.add(sun);
    const boxes=[];for(const [x,c] of [[-1,0xf0b178],[1,0x6599ab]]){const b=new THREE.Mesh(new THREE.BoxGeometry(1.4,2,1.4),new THREE.MeshToonMaterial({color:c}));b.position.x=x;scene.add(b);boxes.push(b);}
    const camera=new THREE.PerspectiveCamera(45,4/3,.1,50);camera.position.set(4,3,7);camera.lookAt(0,0,0);
    const gl=renderer.getContext(),results=[];
    for(const hdr of [false,true])for(const ink of [false,true])for(const grade of [false,true])for(const fxaa of [false,true]){
     const frames=[];
     for(const factory of [old.createInkPipeline,now.createInkPipeline]){
      const pipeline=factory(renderer,{superScale:1,samples:0,preferHalfFloat:hdr,fxaa});Object.assign(pipeline.state,{ink,grade});pipeline.setCamera(camera);pipeline.setExposure(.9);
      pipeline.render(()=>renderer.render(scene,camera));const data=new Uint8Array(320*240*4);gl.readPixels(0,0,320,240,gl.RGBA,gl.UNSIGNED_BYTE,data);frames.push(data);pipeline.dispose();
     }
     let total=0,max=0;for(let i=0;i<frames[0].length;i++){const difference=Math.abs(frames[0][i]-frames[1][i]);total+=difference;max=Math.max(max,difference);}
     results.push({hdr,ink,grade,fxaa,mean:total/frames[0].length,max});
    }
    for(const b of boxes){b.geometry.dispose();b.material.dispose();}renderer.dispose();
    return results;
   });
   for(const comparison of parity)assert.ok(comparison.mean<1,engine+' fused shader differs from reference: '+JSON.stringify(comparison));
   report.engines.at(-1).referenceComparisons=parity;await parityPage.close();console.log(engine,'16 GPU reference comparisons passed');
   for(const phone of engine==='chromium'?[true,false]:[true]){
    const name=engine+(phone?'-iphone':'-desktop');
    const context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:phone?3:1,hasTouch:phone,isMobile:phone,...(phone?{userAgent:mobileUA}:{})});
    const page=await context.newPage();page.setDefaultTimeout(180000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/WebGL|framebuffer|shader|INVALID_/i.test(m.text()))errors.push(m.text());});
    await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
    await page.goto('http://127.0.0.1:8765/johansson-town/?audit&visual-audit&spawn=sakura-bench');
    await page.locator('#enter').click();
    await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,null,{timeout:240000});
    await page.addStyleTag({content:'#hud,#activity,#directory,#cameraPanel,#mobile{visibility:hidden!important}'});
    await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.setTime(720);a.teleport(-3,-28);a.camera={pos:[-2,2.2,-21],at:[-11,1.2,-28]};a.render();});
    const capture=async label=>{
     await page.waitForTimeout(400);
     const state=await page.evaluate(()=>{
      const a=window.__JOHANSSON_AUDIT__,r=a.renderer,look=window.__JOHANSSON_LOOK__,buffer={x:r.domElement.width,y:r.domElement.height};
      const gl=r.getContext();a.render();
      return {ink:look.ink,effects:look.state,buffer:[buffer.x,buffer.y],shadows:r.shadowMap.enabled,shadowSize:look.lights.sun.shadow.mapSize.toArray(),safe:window.__JOHANSSON_SAFE_GRAPHICS__,streaming:window.__JOHANSSON_STREAMING__,gpuError:gl.getError()};
     });
     assert.equal(state.ink,true);assert.equal(state.effects.ink,true);assert.equal(state.effects.grade,true);assert.equal(state.effects.fxaa,true);assert.equal(state.shadows,true);assert.equal(state.gpuError,0);
     if(phone){assert.ok(state.buffer[0]*state.buffer[1]<=650001);assert.deepEqual(state.shadowSize,[512,512]);assert.equal(state.effects.samples,0);}
     const image=await page.locator('#game').screenshot({path:resolve(out,name+'-'+label+'.png')});
     const png=PNG.sync.read(image),colours=new Set();for(let i=0;i<png.data.length;i+=4)colours.add((png.data[i]<<16)|(png.data[i+1]<<8)|png.data[i+2]);
     assert.ok(colours.size>64,'Canvas must contain the rendered town');
     report.views.push({name,label,...state,colours:colours.size});console.log('Captured',name,label);
    };
    await capture('street');
    if(phone){await page.setViewportSize({width:844,height:390});await capture('landscape');}
    await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[0,38,30],at:[0,0,-10]};a.render();});await capture('overhead');
    await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('market');a.setTime(1260);a.camera={pos:[0,1.8,4],at:[0,1.1,-4]};a.render();});
    await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await capture('sakura-night');
    const retained=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;window.__retainedTown=a;return a.player;});
    const loss=await page.evaluate(()=>{const gl=window.__JOHANSSON_AUDIT__.renderer.getContext();window.__loss=gl.getExtension('WEBGL_lose_context');if(window.__loss){window.__loss.loseContext();return true;}return false;});
    if(loss){
     await page.waitForFunction(()=>!document.querySelector('#fatal').classList.contains('hidden'));
     await page.waitForTimeout(250);await page.evaluate(()=>window.__loss.restoreContext());
     await page.waitForFunction(()=>document.querySelector('#fatal').classList.contains('hidden')&&window.__JOHANSSON_LOOK__.ink);
     assert.deepEqual(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player),retained);
     assert.equal(await page.evaluate(()=>window.__retainedTown===window.__JOHANSSON_AUDIT__),true);await capture('restored');
    }
    // Context-loss warnings are expected; shader/framebuffer errors and JS exceptions are not.
    assert.deepEqual(errors,[],name+' browser errors');
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.ok(report.engines.some(x=>x.status==='tested'),'At least one engine must supply a GPU');
}catch(error){failed=error;report.failure=error.stack;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await unlink(reference);}
if(failed)throw failed;
