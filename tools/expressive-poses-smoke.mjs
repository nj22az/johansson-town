import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {serveGame} from './mcp/static-server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.env.CONCERT_QA_OUTPUT||'../output/expressive-poses-qa');await mkdir(out,{recursive:true});
const server=await serveGame(root),browser=await chromium.launch({headless:true,...(process.env.CONCERT_BROWSER?{executablePath:process.env.CONCERT_BROWSER}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/poses-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));await page.goto(new URL('poses-fixture',server.url).href);
 const result=await page.evaluate(async()=>{
  const base=location.pathname.replace(/poses-fixture$/,''),THREE=await import(base+'vendor/three.module.js'),{buildAvatar}=await import(base+'src/avatars/build.js'),{recipeFor}=await import(base+'src/avatars/cast.js'),{createAvatarAnimator}=await import(base+'src/avatars/animate.js'),{EXPRESSIVE_POSES}=await import(base+'src/avatars/expressive-poses.js');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e1d0');scene.add(new THREE.HemisphereLight(0xfff5de,0x596b6d,2.4));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,5,4);scene.add(key);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.3,32),new THREE.MeshStandardMaterial({color:0xc6cdbb}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(34,400/370,.1,30);camera.position.set(1.5,1.4,4.4);camera.lookAt(0,.9,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(400,370);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1260;const c=sheet.getContext('2d');c.fillStyle='#12343b';c.fillRect(0,0,1200,1260);const checked=[];
  let index=0;
  for(const [name,p]of Object.entries(EXPRESSIVE_POSES)){
   const person=index%2?'Johansson':'Thuan',avatar=buildAvatar(recipeFor(person),{faceSize:256}),animator=createAvatarAnimator(avatar);scene.add(avatar.root);avatar.root.rotation.y=.1;animator.play(name);
   for(let frame=0;frame<75;frame++)animator.update(1/60,{expression:p.face});avatar.paintFace({expression:p.face,blink:0,talk:0,look:[0,0]});avatar.root.updateMatrixWorld(true);
   let invalid=0;avatar.root.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))invalid++;});if(invalid)throw Error(name+' contains an invalid transform');
   renderer.render(scene,camera);const x=index%3*400,y=Math.floor(index/3)*420;c.drawImage(renderer.domElement,x,y);c.fillStyle='#fff2d4';c.font='600 20px sans-serif';c.textAlign='center';c.fillText(p.label,x+200,y+397);c.fillStyle='#d9c9a9';c.font='12px sans-serif';c.fillText(person+' · '+p.face,x+200,y+415);
   checked.push({name,person,expression:p.face,invalid});scene.remove(avatar.root);avatar.dispose();index++;
  }
  renderer.dispose();floor.geometry.dispose();floor.material.dispose();return {png:sheet.toDataURL('image/png').split(',')[1],checked};
 });
 if(errors.length)throw Error(JSON.stringify(errors));await writeFile(resolve(out,'expressive-poses.png'),Buffer.from(result.png,'base64'));await writeFile(resolve(out,'report.json'),JSON.stringify({scope:'Actual shared avatar builder, animator and face painter, rendered in Chromium; not a device performance test',poses:result.checked,errors},null,2)+'\n');console.log(JSON.stringify({poses:result.checked.length,errors}));
}finally{await browser.close();await server.close();}
