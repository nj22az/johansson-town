// Serve johansson-town on port 5173, then run with CODEX_PRIMARY_RUNTIME_NODE_MODULES
// and CREATOR_CHROME set. Uses real WebGL Chromium and CDP touch input on phones.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.CREATOR_CHROME,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const [width,height] of [[1280,800],[390,844],[320,568],[844,390]]){
  const touch=width<=760||height<=500;
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/creator-drag-review.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body></body>'}));
  await page.goto('http://127.0.0.1:5173/creator-drag-review.html');
  await page.evaluate(async()=>{const THREE=await import('/vendor/three.module.js');THREE.Scene.prototype.onBeforeRender=function(renderer,scene,camera){if(!renderer.getRenderTarget())window.creatorPreview={scene,camera,renderer};};const {openCreator}=await import('/src/avatars/creator.js');window.maker=openCreator();});
  const cdp=touch?await page.context().newCDPSession(page):null;
  const sendTouch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
  async function select(feature){
   if(touch)await page.getByRole('combobox',{name:'Appearance category',exact:true}).selectOption(feature);
   else await page.getByRole('tab',{name:feature[0].toUpperCase()+feature.slice(1),exact:true}).click();
   await page.getByRole('tab',{name:'Adjust',exact:true}).click();
  }
  async function featurePoint(feature,side){
   // Project the rendered head geometry/UVs, independently of creator hit testing.
   // Nearest vertex is within the deliberately generous feature touch target.
   return page.evaluate(async({feature,side})=>{
    const THREE=await import('/vendor/three.module.js');
    const {faceLayout}=await import('/src/avatars/face.js');
    const r=window.maker.recipe,l=faceLayout(r),{scene,camera}=window.creatorPreview,head=scene.getObjectByName('Shimanchu head');
    const x=feature==='eyes'?128+side*l.spread:feature==='brows'?128+side*l.browSpread:l[feature+'X'];
    const y=feature==='eyes'?l.eyeY:feature==='brows'?l.browY:l[feature+'Y'];
    const g=head.geometry,uv=g.attributes.uv;let index=0,best=Infinity;
    for(let i=0;i<uv.count;i++){const d=(uv.getX(i)-x/256)**2+(uv.getY(i)-(1-y/256))**2;if(d<best){best=d;index=i;}}
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const p=new THREE.Vector3().fromBufferAttribute(g.attributes.position,index);head.localToWorld(p);
    const rect=document.querySelector('.shm-stage>canvas').getBoundingClientRect();
    p.project(camera);
    return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
   },{feature,side});
  }
  for(const feature of ['eyes','brows','nose','mouth']){
   await select(feature);await page.evaluate(()=>new Promise(resolve=>{let frames=0;function settled(){if(++frames>=45)resolve();else requestAnimationFrame(settled);}requestAnimationFrame(settled);}));
   for(const side of feature==='eyes'||feature==='brows'?[-1,1]:[1]){
    const before=await page.evaluate(()=>window.maker.recipe);
    const geometry=await page.evaluate(()=>window.creatorPreview.scene.getObjectByName('Shimanchu head').geometry.uuid);
    const drawCalls=await page.evaluate(()=>window.creatorPreview.renderer.info.render.calls);
    const p=await featurePoint(feature,side),dx=side*12,dy=-9;
    if(touch)await sendTouch('touchStart',p.x,p.y);else {await page.mouse.move(p.x,p.y);await page.mouse.down();}
    for(let i=1;i<=6;i++){
     if(touch)await sendTouch('touchMove',p.x+dx*i/6,p.y+dy*i/6);else await page.mouse.move(p.x+dx*i/6,p.y+dy*i/6);
     await page.waitForTimeout(25);
    }
    assert.equal(await page.evaluate(()=>window.creatorPreview.scene.getObjectByName('Shimanchu head').geometry.uuid),geometry,'drag repaints the face without rebuilding geometry');
    assert.equal(await page.evaluate(()=>window.creatorPreview.renderer.info.render.calls),drawCalls,'drag does not add preview draw calls');
    if(touch)await sendTouch('touchEnd');else await page.mouse.up();
    const after=await page.evaluate(()=>window.maker.recipe),horizontal=['eyes','brows'].includes(feature)?'spacing':'x';
    assert.ok(after[feature][horizontal]>before[feature][horizontal],`${width} ${feature} horizontal drag`);
    assert.ok(after[feature].height>before[feature].height,`${width} ${feature} vertical drag`);
    const expected=structuredClone(before);expected[feature][horizontal]=after[feature][horizontal];expected[feature].height=after[feature].height;
    assert.deepEqual(after,expected,'only the two placement fields change');
    for(const meter of await page.locator('.shm-meter[data-at]').all()){
     const at=await meter.getAttribute('data-at'),[section,field]=at.split('.');
     assert.equal(await meter.locator('.on').count(),Math.round(after[section][field]*16),'adjustment indicator follows drag');
    }
    await page.getByRole('button',{name:'Undo',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.maker.recipe),before,'one undo restores the whole gesture');
    assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isDisabled(),true,'no extra drag history');
    await page.waitForTimeout(100);
   }
  }
  // Cancellation restores the snapshot; a stationary tap adds no undo entry.
  const p=await featurePoint('mouth',1),before=await page.evaluate(()=>window.maker.recipe);
  if(touch){
   await sendTouch('touchStart',p.x,p.y);await sendTouch('touchMove',p.x+10,p.y-8);await sendTouch('touchCancel');
   assert.deepEqual(await page.evaluate(()=>window.maker.recipe),before);
   await sendTouch('touchStart',p.x,p.y);await sendTouch('touchEnd');
  }else{
   await page.evaluate(()=>document.querySelector('.shm-stage>canvas').addEventListener('pointerdown',e=>window.dragPointer=e.pointerId,{once:true}));
   await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+10,p.y-8);
   await page.evaluate(()=>document.querySelector('.shm-stage>canvas').dispatchEvent(new PointerEvent('pointercancel',{pointerId:window.dragPointer})));
   await page.mouse.up();assert.deepEqual(await page.evaluate(()=>window.maker.recipe),before,'mouse cancellation restores the gesture');
   await page.mouse.click(p.x,p.y);
  }
  assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Move right',exact:true}).focus();await page.keyboard.press('Enter');
  assert.ok((await page.evaluate(()=>window.maker.recipe.mouth.x))>before.mouth.x,'keyboard adjustment remains usable');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.maker.recipe),before);
  assert.equal(await page.evaluate(()=>document.querySelector('.shm').scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.maker.close());await page.close();
  console.log(`Face drag, single undo, keyboard and layout passed: ${width}x${height} (${touch?'touch':'mouse'})`);
 }
}finally{await browser.close();}
