// Diagnostic fixtures: ablate ink and shadow state at the same real shop window.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const phone=process.argv[2]==='phone';
const out=new URL('../../output/clipping-diagnosis'+(phone?'-phone':'')+'/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),errors=[];
try{
 const page=await browser.newPage({viewport:phone?{width:390,height:844}:{width:1280,height:800},serviceWorkers:'block'});page.setDefaultTimeout(240000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 await page.goto('http://127.0.0.1:8767/johansson-town/?audit&spawn=sakura-bench');await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;await a.enter('market');a.teleport(-4.299972112706223,2.539972503880652,3.1415517035909692);a.camera={pos:[-4.299972112706223,1.7,2.539972503880652],at:[-4.3,1.7+Math.tan(.08)*3.8,6.3]};a.step(50);});
 for(const mode of (process.env.TOWN_CLIP_DEEP?['normal','no-ink','no-shadows']:['normal','no-ink','no-shadows','front-side'])){
  await page.evaluate(mode=>{const a=window.__JOHANSSON_AUDIT__;if(mode==='no-ink')window.__JOHANSSON_LOOK__.tune({uStrength:0});if(mode==='no-shadows'){a.renderer.shadowMap.enabled=false;a.scene.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});}if(mode==='front-side')a.scene.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.side=0;m.needsUpdate=true;}}});a.render();},mode);
  await page.screenshot({path:new URL(mode+'.png',out).pathname});console.log('Captured '+mode);
 }
 await writeFile(new URL('report.json',out),JSON.stringify({errors,state:await page.evaluate(()=>JSON.parse(window.render_game_to_text()))},null,2));
 if(process.env.TOWN_CLIP_DEEP){
  const data=await page.evaluate(async()=>{
   const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js');
   const town=a.scene.children.find(o=>o.isGroup&&o!==a.room),shop=town.getObjectByName('Sakura glass storefront');
   if(!shop)throw Error('Missing live frontage');
   const frontage={position:shop.localToWorld(new T.Vector3(0,.18,.02)).toArray(),yaw:shop.rotation.y,interiorZ:a.layout?.frontZ??3.91};
   const camera=new T.PerspectiveCamera(65,1280/800,.15,480);camera.position.set(...a.camera.pos);camera.lookAt(...a.camera.at);camera.updateMatrixWorld(true);
   let text=await(await fetch('/johansson-town/src/render/shop-street-view.js')).text();
   text=text.replace("'../../vendor/three.module.js'",JSON.stringify(location.origin+'/johansson-town/vendor/three.module.js')).replace("'./shop-street-batches.js'",JSON.stringify(location.origin+'/johansson-town/src/render/shop-street-batches.js')).replace('createWindowBatch(o)','createWindowBatch(o,{minIndices:Infinity})');
   const url=URL.createObjectURL(new Blob([text],{type:'text/javascript'})),{createShopStreetView,mapShopCamera}=await import(url);URL.revokeObjectURL(url);
   const view=createShopStreetView(),exteriorCamera=new T.PerspectiveCamera();mapShopCamera(camera,exteriorCamera,frontage);
   const ray=new T.Raycaster(),hits={};town.updateWorldMatrix(true,true);
   for(const [label,x,y]of[['drum',350,170],['awning',350,275],['valance',800,362],['post',505,250]]){
    ray.setFromCamera(new T.Vector2(x/1280*2-1,1-y/800*2),exteriorCamera);
    hits[label]=ray.intersectObject(town,true).filter(h=>h.distance<9).slice(0,20).map(h=>({name:h.object.name,parent:h.object.parent.name,distance:h.distance,point:h.point.toArray(),face:h.faceIndex,normal:h.face?.normal.toArray(),material:h.object.material?.name}));
   }
   window.__CLIP_DEEP_DRAW__=()=>view.render({renderer:a.renderer,scene:a.scene,camera,town,room:a.room,frontage});
   window.__CLIP_DEEP_DRAW__();return {frontage,hits,groups:town.children.map(o=>({name:o.name,visible:o.visible}))};
  });
  await writeFile(new URL('geometry-probes.json',out),JSON.stringify(data,null,2));await page.screenshot({path:new URL('unbatched-direct.png',out).pathname});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.scene.traverse(o=>{if(o.isMesh&&(o.userData.clearWindow||o.material?.userData?.windowInterior))o.visible=false;});window.__CLIP_DEEP_DRAW__();});
  await page.screenshot({path:new URL('no-glass-direct.png',out).pathname});
  await page.evaluate(async()=>{
   const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js'),town=a.scene.children.find(o=>o.isGroup&&o!==a.room),shop=town.getObjectByName('Sakura glass storefront');
   const frontage={position:shop.localToWorld(new T.Vector3(0,.18,.02)).toArray(),yaw:shop.rotation.y,interiorZ:3.91};
   const camera=new T.PerspectiveCamera(65,1280/800,.15,480);camera.position.set(...a.camera.pos);camera.lookAt(...a.camera.at);camera.updateMatrixWorld(true);
   a.scene.traverse(o=>{if(o.isMesh&&o.userData.clearWindow)o.visible=true;});
   let text=await(await fetch('/johansson-town/src/render/shop-street-view.js')).text();
   text=text.replace("'../../vendor/three.module.js'",JSON.stringify(location.origin+'/johansson-town/vendor/three.module.js')).replace("'./shop-street-batches.js'",JSON.stringify(location.origin+'/johansson-town/src/render/shop-street-batches.js')).replace('createWindowBatch(o)','createWindowBatch(o,{minIndices:Infinity})').replace('const plane=mapShopCamera(camera,exteriorCamera,frontage);','const plane=mapShopCamera(camera,exteriorCamera,frontage);plane.constant-=.13;');
   const url=URL.createObjectURL(new Blob([text],{type:'text/javascript'})),{createShopStreetView}=await import(url);URL.revokeObjectURL(url);
   createShopStreetView().render({renderer:a.renderer,scene:a.scene,camera,town,room:a.room,frontage});
  });await page.screenshot({path:new URL('offset-direct.png',out).pathname});
 }
}finally{await browser.close();}
