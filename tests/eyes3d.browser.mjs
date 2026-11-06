import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {resolve} from 'node:path';
import {serveGame} from '../tools/mcp/static-server.mjs';
// The rigged eyes in the town's real renderer (ink pipeline, cel shading, outlines), software GL.
// EYES_BROWSER_TEST=1 [TOWN_CHROMIUM_PATH=/path/to/chromium] node --test tests/eyes3d.browser.mjs
// Close-ups to look at: node tools/eyes3d-sheet.mjs
const require=createRequire(import.meta.url);
const playwright=(()=>{try{return require('playwright');}catch{return createRequire(new URL('../../steam-deck/package.json',import.meta.url))('playwright');}})();

test('the rigged eyes draw the eyes and change nothing else on the face',{skip:!process.env.EYES_BROWSER_TEST,timeout:240000},async()=>{
 const server=await serveGame(resolve(new URL('..',import.meta.url).pathname));let browser;
 try{
  browser=await playwright.chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if((m.type()==='error'||/shader|program/i.test(m.text()))&&!m.location().url?.endsWith('/favicon.ico'))errors.push(m.text());});
  await page.goto(server.url+'src/avatars/face.js');
  const rows=await page.evaluate(async()=>{
   const T=await import('/johansson-town/vendor/three.module.js'),{buildAvatar}=await import('/johansson-town/src/avatars/build.js'),{recipeFor}=await import('/johansson-town/src/avatars/cast.js');
   const {createInkPipeline}=await import('/johansson-town/src/render/ink-pipeline.js'),{faceLayout}=await import('/johansson-town/src/avatars/face.js'),{faceObjectPoint}=await import('/johansson-town/src/avatars/face-objects.js'),{eyeShape}=await import('/johansson-town/src/avatars/eyes3d.js');
   const size=480,renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(size,size);
   const scene=new T.Scene();scene.background=new T.Color('#c9d6cf');const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(2,5,4);scene.add(new T.HemisphereLight(0xffffff,0x887766,1.5),sun);
   const camera=new T.PerspectiveCamera(14,1,.05,50),pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true}),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=canvas.height=size;
   const shot=()=>{pipeline.render(r=>r.render(scene,camera));ctx.drawImage(renderer.domElement,0,0);return ctx.getImageData(0,0,size,size).data;};
   const out=[];
   for(const name of ['Thuan','Johansson','Tetsuo','Thao','Fujita','Vy'])for(const turn of [0,.55]){
    const a=buildAvatar(recipeFor(name),{shadows:false,eyes3d:true});a.root.rotation.y=turn;scene.add(a.root);
    a.paintFace({expression:'neutral',blink:0,look:[0,0]});scene.updateMatrixWorld(true);
    const head=new T.Vector3();a.face.head.getWorldPosition(head);camera.position.set(head.x,head.y+.02,head.z+1.6);camera.lookAt(head.x,head.y-.01,head.z);camera.updateProjectionMatrix();camera.updateMatrixWorld();pipeline.setCamera(camera);
    a.eyes3d.mesh.visible=false;const without=shot();a.eyes3d.mesh.visible=true;const withEyes=shot();
    // Where each eye may draw at rest (its shape, the lash above, the flick out, the soft line below), on screen.
    const L=faceLayout(a.recipe),s=eyeShape(a.recipe.eyes.style,'open'),boxes=[-1,1].map(side=>{
     const ang=-side*L.eyeTilt,pts=[];
     for(const x of [-s.rx-2,0,s.rx+s.flick+2])for(const y of [-s.ry-3,0,s.ry+s.lash+3]){
      const X=x*side*L.eyeS*L.eyeW,Y=-y*L.eyeS,u=128+side*L.spread+Math.cos(ang)*X-Math.sin(ang)*Y,v=L.eyeY+Math.sin(ang)*X+Math.cos(ang)*Y;
      const p=a.eyes3d.mesh.localToWorld(faceObjectPoint(a.measure,u,v,.02)).project(camera);pts.push([(p.x*.5+.5)*size,(.5-p.y*.5)*size]);}
     return [Math.min(...pts.map(p=>p[0]))-3,Math.min(...pts.map(p=>p[1]))-3,Math.max(...pts.map(p=>p[0]))+3,Math.max(...pts.map(p=>p[1]))+3];});
    let inside=0,outside=0;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
     const j=(y*size+x)*4,d=Math.abs(withEyes[j]-without[j])+Math.abs(withEyes[j+1]-without[j+1])+Math.abs(withEyes[j+2]-without[j+2]);if(d<=6)continue;
     if(boxes.some(([x0,y0,x1,y1])=>x>=x0&&x<=x1&&y>=y0&&y<=y1))inside++;else outside++;}
    out.push({name,turn,inside,outside,triangles:a.eyes3d.mesh.geometry.index.count/3});
    scene.remove(a.root);a.dispose();
   }
   pipeline.dispose();renderer.dispose();renderer.forceContextLoss();return out;
  });
  console.log(JSON.stringify(rows));
  assert.deepEqual(errors,[]);
  for(const r of rows){
   assert.ok(r.inside>200,`${r.name} (${r.turn}): the eyes are drawn (${r.inside} pixels)`);
   assert.equal(r.outside,0,`${r.name} (${r.turn}): nothing outside the eyes changes`);
  }
 }finally{await browser?.close();await server.close();}
});
