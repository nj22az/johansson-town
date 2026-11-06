#!/usr/bin/env node
/**
 * Close-ups of residents' rigged eyes (src/avatars/eyes3d.js) in the game's own renderer: the town's ink pipeline, cel
 * shading and outlines, in headless Chromium (software GL in a cloud session, so judge shapes and lines, not speed).
 *
 *   node tools/eyes3d-sheet.mjs [names] [out-directory]
 *   node tools/eyes3d-sheet.mjs Thuan,Johansson,Tetsuo,Thao,Fujita,Vy output/eyes3d
 *
 * One sheet per resident: the painted eyes of today, then the rigged eyes at rest, looking about, through a blink, from
 * the side and in the expressions they draw. TOWN_CHROMIUM_PATH points at another Chromium.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {serveGame} from './mcp/static-server.mjs';

const require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright');}catch{playwright=createRequire(new URL('../../steam-deck/package.json',import.meta.url))('playwright');}
const names=(process.argv[2]||'Thuan,Johansson,Tetsuo,Thao,Fujita,Vy').split(',').map(s=>s.trim()).filter(Boolean);
const out=resolve(process.argv[3]||'output/eyes3d');mkdirSync(out,{recursive:true});

// [label, face state, turn of the body (radians, + to his left), painted (today's eyes) or rigged]
const CELLS=[
 ['painted today',{expression:'neutral'},0,false],
 ['rigged',{expression:'neutral'},0,true],
 ['look left',{expression:'neutral',look:[-1,0]},0,true],
 ['look right',{expression:'neutral',look:[1,0]},0,true],
 ['look up',{expression:'neutral',look:[0,-1]},0,true],
 ['look down',{expression:'neutral',look:[.3,.8]},0,true],
 ['blink 0.5',{expression:'neutral',blink:.5},0,true],
 ['blink 1',{expression:'neutral',blink:1},0,true],
 ['three-quarter',{expression:'neutral',look:[.4,0]},.62,true],
 ['side',{expression:'neutral'},1.15,true],
 ['smile',{expression:'smile'},0,true],
 ['happy',{expression:'happy'},0,true],
 ['angry',{expression:'angry'},0,true],
 ['sad',{expression:'sad'},0,true],
 ['surprised',{expression:'surprised'},0,true],
 ['worried',{expression:'worried'},0,true],
 ['shy',{expression:'shy'},0,true],
 ['shock',{expression:'shock'},0,true],
 ['daze',{expression:'daze'},0,true],
 ['dry',{expression:'dry'},0,true],
 ['sleep',{expression:'sleep'},0,true],
 ['dizzy (painted)',{expression:'dizzy'},0,true],
];

const server=await serveGame(resolve(new URL('..',import.meta.url).pathname));
const browser=await playwright.chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(server.url+'src/avatars/face.js');
 for(const name of names){
  const result=await page.evaluate(async({name,cells})=>{
   const T=await import('/johansson-town/vendor/three.module.js'),{buildAvatar}=await import('/johansson-town/src/avatars/build.js'),{recipeFor}=await import('/johansson-town/src/avatars/cast.js'),{createInkPipeline}=await import('/johansson-town/src/render/ink-pipeline.js');
   const size=300,cols=6,rows=Math.ceil(cells.length/cols),renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(size,size);
   const scene=new T.Scene();scene.background=new T.Color('#c9d6cf');
   const fill=new T.HemisphereLight(0xffffff,0x887766,1.5),sun=new T.DirectionalLight(0xffffff,2);sun.position.set(2,5,4);scene.add(fill,sun);
   const camera=new T.PerspectiveCamera(22,1,.05,50),pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});
   const sheet=document.createElement('canvas');sheet.width=cols*size;sheet.height=rows*(size+22);const g=sheet.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,sheet.width,sheet.height);
   const avatars={painted:buildAvatar(recipeFor(name),{shadows:false,eyes3d:false}),rigged:buildAvatar(recipeFor(name),{shadows:false,eyes3d:true})};
   const report={name,triangles:avatars.rigged.eyes3d.mesh.geometry.index.count/3,cells:[]};
   for(const a of Object.values(avatars)){a.root.rotation.y=0;scene.add(a.root);}
   cells.forEach(([label,state,turn,rigged],i)=>{
    const a=rigged?avatars.rigged:avatars.painted,other=rigged?avatars.painted:avatars.rigged;
    a.root.visible=true;other.root.visible=false;a.root.rotation.y=turn;
    a.paintFace({blink:0,talk:0,look:[0,0],gaze:null,blinkLeft:undefined,blinkRight:undefined,...state});
    scene.updateMatrixWorld(true);
    const head=new T.Vector3();a.face.head.getWorldPosition(head);
    camera.position.set(head.x,head.y+.02,head.z+1.55);camera.lookAt(head.x,head.y-.01,head.z);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    pipeline.setCamera?.(camera);pipeline.render(r=>r.render(scene,camera));
    const x=(i%cols)*size,y=Math.floor(i/cols)*(size+22);g.drawImage(renderer.domElement,x,y);
    g.fillStyle='#222';g.font='15px sans-serif';g.fillText(label,x+8,y+size+16);
    report.cells.push({label,eyes3dShowing:rigged?a.eyes3d.showing:false});
   });
   for(const a of Object.values(avatars))a.dispose();pipeline.dispose();renderer.dispose();renderer.forceContextLoss();
   return {report,png:sheet.toDataURL('image/png')};
  },{name,cells:CELLS});
  writeFileSync(resolve(out,name+'.png'),Buffer.from(result.png.split(',')[1],'base64'));
  writeFileSync(resolve(out,name+'.json'),JSON.stringify(result.report,null,1)+'\n');
  console.log(name,'eyes',result.report.triangles,'triangles ->',resolve(out,name+'.png'));
 }
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
}finally{await browser.close();await server.close();}
