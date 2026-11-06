// Read-only diagnostics: originals/LODs under identical live Sakura lighting.
// node tools/owned-display-comparison.mjs [cat|thuan|both] [existing-game-url]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {ownedDisplayView} from './owned-display-views.mjs';
const kind=process.argv[2]||'both',base=process.argv[3]||'http://127.0.0.1:8767/johansson-town/';
assert.ok(['cat','thuan','both'].includes(kind));
const out=new URL('../../output/owned-display-comparison/',import.meta.url);await mkdir(out,{recursive:true});
const report={kind,url:base,cases:[],errors:[]};let browser,page;
try{
 browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.clear();localStorage.setItem('johansson-town-clock',JSON.stringify({start:'11:50',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const url=new URL(base);url.searchParams.set('audit','');url.searchParams.set('visual-audit','');
 await page.goto(url.href,{waitUntil:'domcontentloaded'});await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;await a.enter('market');a.step(0);document.querySelector('#hud').style.visibility='hidden';});
 for(const spec of [
  {id:'cat',holder:'Maneki_neko_Colorful',source:'assets/models/owned/Maneki_neko_Colorful.glb',lod:'assets/models/owned/maneki-neko-display.glb'},
  {id:'thuan',holder:'thuanFigurine',source:'assets/figurines/thuan/thuan-realistic.glb',lod:'assets/figurines/thuan/thuan-display.glb'},
 ].filter(s=>kind==='both'||s.id===kind)){
  const bounds=await page.evaluate(async holderName=>{
   const a=window.__JOHANSSON_AUDIT__,T=await import('./vendor/three.module.js');let holder;
   a.scene.traverse(o=>{if(o.name===holderName&&o.userData.ready)holder=o;});if(!holder)throw Error('Display missing '+holderName);
   holder.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(holder);
   window.__DISPLAY_DIAGNOSTIC__={holder,children:[...holder.children],scale:holder.scale.clone(),height:b.max.y-b.min.y,model:null};
   return {min:b.min.toArray(),max:b.max.toArray()};
  },spec.holder);
  const view=ownedDisplayView(spec.holder,bounds);
  for(const geometry of ['source','lod']){
   await page.evaluate(async({path,view})=>{
    const a=window.__JOHANSSON_AUDIT__,d=window.__DISPLAY_DIAGNOSTIC__,T=await import('./vendor/three.module.js'),{GLTFLoader}=await import('./vendor/GLTFLoader.js');
    d.model?.removeFromParent();for(const child of d.children)child.visible=false;d.holder.scale.setScalar(1);
    const g=await new GLTFLoader().loadAsync(new URL(path,location.href).href),model=g.scene;model.updateWorldMatrix(true,true);
    const b=new T.Box3().setFromObject(model),centre=b.getCenter(new T.Vector3()),scale=d.height/(b.max.y-b.min.y);
    const wrapper=new T.Group();model.position.set(-centre.x,-b.min.y,-centre.z);wrapper.scale.setScalar(scale);wrapper.add(model);d.holder.add(wrapper);d.model=wrapper;
    d.meshes=[];wrapper.traverse(o=>{if(o.isMesh){d.meshes.push(o);o.userData.originalMaterial=o.material;o.castShadow=o.receiveShadow=true;}});
    a.camera=view;a.step(0);
   },{path:spec[geometry],view});
   for(const mode of ['basic','physical','cel','cel-ink','cel-ink-no-receive','cel-ink-no-shadow','physical-ink-no-shadow']){
    const data=await page.evaluate(async({mode,view})=>{
     const a=window.__JOHANSSON_AUDIT__,d=window.__DISPLAY_DIAGNOSTIC__,T=await import('./vendor/three.module.js'),{celFrom}=await import('./src/render/cel.js');
     for(const mesh of d.meshes){
      const source=mesh.userData.originalMaterial;
      const convert=m=>{
       if(mode==='basic')return new T.MeshBasicMaterial({map:m.map,color:m.color,side:m.side});
       if(mode.startsWith('physical')){m.userData.keepPhysical=true;m.userData.keepPhysicalStrict=true;return m;}
       return celFrom(m,{bands:3});
      };
      mesh.material=Array.isArray(source)?source.map(convert):convert(source);
      mesh.receiveShadow=!mode.includes('no-receive')&&!mode.includes('no-shadow');mesh.castShadow=!mode.includes('no-shadow');
     }
     a.renderer.shadowMap.needsUpdate=true;a.camera=view;
     if(mode.includes('ink'))a.render();
     else{
      const camera=new T.PerspectiveCamera(65,1280/800,.15,480);camera.position.set(...view.pos);camera.lookAt(...view.at);camera.updateMatrixWorld();
      const previous=a.renderer.toneMapping,exposure=a.renderer.toneMappingExposure;
      a.renderer.setRenderTarget(null);a.renderer.toneMapping=mode==='basic'?T.NoToneMapping:T.AgXToneMapping;a.renderer.toneMappingExposure=1;
      a.renderer.clear();a.renderer.render(a.scene,camera);a.renderer.toneMapping=previous;a.renderer.toneMappingExposure=exposure;
     }
     return {mode,meshes:d.meshes.length,triangles:d.meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),materials:d.meshes.flatMap(m=>(Array.isArray(m.material)?m.material:[m.material]).map(q=>({type:q.type,map:!!q.map,flatten:q.userData.flatten?.value,receiveShadow:m.receiveShadow,castShadow:m.castShadow}))),view};
    },{mode,view});
    const name=`${spec.id}-${geometry}-${mode}.png`;await page.screenshot({path:new URL(name,out).pathname});report.cases.push({...data,kind:spec.id,geometry,file:name});
   }
  }
  await page.evaluate(()=>{const d=window.__DISPLAY_DIAGNOSTIC__;d.model.removeFromParent();d.holder.scale.copy(d.scale);for(const c of d.children)c.visible=true;delete window.__DISPLAY_DIAGNOSTIC__;});
 }
 assert.deepEqual(report.errors,[]);console.log('Display comparison captured '+report.cases.length+' actual light/material cases.');
}catch(e){report.failure=e.message;throw e;}
finally{await writeFile(new URL('report.json',out),JSON.stringify(report,null,2)+'\n');await browser?.close();}
