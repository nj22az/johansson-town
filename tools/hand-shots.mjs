// The hands, close up, in the game's own shader: a resident's hand at rest from six sides, and the poses where hands touch
// something (the pair poses, the funny poses, sitting), each as the whole figure and a close-up of every hand, played on the
// game's own animator to the still Johansson Studio shoots (STILL_AT), as tests/pair-poses.test.mjs plays them.
//   node tools/hand-shots.mjs [--name Thao] [--grip 0..1] [--shape hook] [out.png]   the hand at rest (or closed so far), six views
//   node tools/hand-shots.mjs --pairs Shove,Fight,Hug,BackToBack [--who "Thuan,Nils Johansson"] [out.png]
//   node tools/hand-shots.mjs --poses Facepalm,Huff,Scold [--name Thao] [out.png]
//   node tools/hand-shots.mjs --sit chair,floor [--name Thao] [--outfit afterbath] [out.png]
//   node tools/hand-shots.mjs --hold draft,can,bottle [--name Johansson] [out.png]     a drink in the hand, held and at the lips
//   node tools/hand-shots.mjs --drive car,"kei truck" [--name Johansson] [out.png]      both hands on the steering wheel
//   node tools/hand-shots.mjs --ride 0,.25 [--name Thuan] [out.png]                     on a bicycle, at those turns of the crank
//   node tools/hand-shots.mjs --can 0,1,3.45 [--name Johansson] [--seated] [out.png]     a bought can opened and drunk (drink-can.js), at those seconds
// Software Chromium (TOWN_CHROMIUM_PATH, or /opt/pw-browsers/chromium). Default out: output/hands-<what>.png
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const CAN=flag('--can')||'',SEATED=args.includes('--seated'),RIDE=flag('--ride')||'',DRIVE=flag('--drive')||'',HOLD=flag('--hold')||'',OUTFIT=flag('--outfit')||'clothes',NAME=flag('--name')||'Thao',PAIRS=flag('--pairs')||'',POSES=flag('--poses')||'',SIT=flag('--sit')||'',WHO=flag('--who')||'Thuan,Nils Johansson',GRIP=flag('--grip'),SHAPE=flag('--shape')||'close';
const what=PAIRS?'pairs':POSES?'poses':SIT?'sit':HOLD?'hold':DRIVE?'drive':RIDE?'ride':CAN?'can':'rest';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--name','--pairs','--poses','--sit','--who','--grip','--outfit','--hold','--drive','--ride','--shape','--can'].includes(args[i-1]))||resolve(root,`output/hands-${what}.png`));
await mkdir(dirname(out),{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+path);if(!file.startsWith(site))throw Error('outside');
 if(path==='/blank')return res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>hands</title>');
 const body=await readFile(file);res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/blank`);
 const data=await page.evaluate(async([name,pairs,poses,sit,who,grip,outfit,hold,drive,ride,shape,can,seated])=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js'),{buildAvatar}=await import(base+'src/avatars/build.js'),{recipeFor}=await import(base+'src/avatars/cast.js');
  const {createAvatarAnimator,GESTURES,STILL_AT,playPair}=await import(base+'src/avatars/animate.js'),{createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const S=360,renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(S,S);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});pipeline.setLook('none');
  const camera=new T.PerspectiveCamera(28,1,.02,60),tiles=[];
  const scene=()=>{const s=new T.Scene();s.background=new T.Color('#cfe3ee');s.add(new T.HemisphereLight(0xffffff,0xd8cdbd,2.4));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(2,5,4);s.add(sun);
   const floor=new T.Mesh(new T.CircleGeometry(2.2,40),new T.MeshStandardMaterial({color:0xc9cfbd}));floor.rotation.x=-Math.PI/2;floor.position.y=-.001;s.add(floor);return s;};
  const shoot=(sc,target,yaw,pitch,d,label)=>{camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   sc.updateMatrixWorld(true);pipeline.setCamera(camera);pipeline.render(r=>r.render(sc,camera));const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d').drawImage(renderer.domElement,0,0);tiles.push({c,label});};
  const body=(who,sc)=>{const a=buildAvatar(recipeFor(who),{shadows:false});a.wear?.(outfit);const holder=new T.Group();holder.add(a.root);sc.add(holder);
   const anim=createAvatarAnimator(a,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})()});
   const step=(n=1,state={})=>{for(let i=0;i<n;i++){anim.update(1/60,state);a.springs?.update(1/60);}holder.updateMatrixWorld(true);};return {a,anim,holder,step};};
  const handAt=(a,side)=>{const m=a.measure;return a.bones['hand'+side].localToWorld(new T.Vector3(0,-m.hand*.8,0));};
  // the angle round the figure a camera looks from, in the world: yaw of the figure's front plus `turn`
  const frontYaw=a=>{const q=a.root.getWorldQuaternion(new T.Quaternion()),f=new T.Vector3(0,0,1).applyQuaternion(q);return Math.atan2(f.x,f.z);};
  const closeups=(sc,a,label,views=[[.5,.25],[-.5,.25]])=>{const m=a.measure;for(const side of ['L','R']){const h=handAt(a,side),y=frontYaw(a);for(const [turn,pitch] of views)shoot(sc,h,y+turn,pitch,m.hand*9,`${label} · ${side}`);}};
  if(pairs){
   const [nameA,nameB]=who.split(',');
   for(const pair of pairs.split(',')){
    const sc=scene(),A=body(nameA,sc),B=body(nameB,sc);A.step(20);B.step(20);
    playPair(A.anim,B.anim,pair);const n=Math.round(GESTURES[pair+':A']*STILL_AT*60);A.step(n);B.step(n);
    A.a.paintFace?.({expression:'neutral',blink:0,talk:0});B.a.paintFace?.({expression:'neutral',blink:0,talk:0});
    const mid=A.a.bones.chest.getWorldPosition(new T.Vector3()).add(B.a.bones.chest.getWorldPosition(new T.Vector3())).multiplyScalar(.5),y=frontYaw(A.a);
    shoot(sc,mid,y+.6,.12,3.4,pair);shoot(sc,mid,y-.9,.12,3.4,pair);
    // (each hand from outside the two bodies: across the line between them, from the hand's side of it, and either side of that)
    const line=B.a.bones.chest.getWorldPosition(new T.Vector3()).sub(A.a.bones.chest.getWorldPosition(new T.Vector3())).setY(0).normalize(),across=new T.Vector3(line.z,0,-line.x);
    for(const [P,who] of [[A,nameA],[B,nameB]])for(const side of ['L','R']){const h=handAt(P.a,side),out=across.clone().multiplyScalar(Math.sign(h.clone().sub(mid).dot(across))||1),yy=Math.atan2(out.x,out.z);
     for(const turn of [0,.7,-.7])shoot(sc,h,yy+turn,.35,P.a.measure.hand*11,`${pair} · ${who} ${side}`);}
    A.a.dispose();B.a.dispose();
   }
  }else if(poses){
   for(const pose of poses.split(',')){
    const sc=scene(),P=body(name,sc);P.step(20);P.anim.play(pose);P.step(Math.round((Number.isFinite(GESTURES[pose])?GESTURES[pose]*STILL_AT:1.2)*60));
    const c=P.a.bones.chest.getWorldPosition(new T.Vector3()),y=frontYaw(P.a);shoot(sc,c,y+.5,.1,2.6,pose);shoot(sc,c,y-.9,.1,2.6,pose);
    closeups(sc,P.a,pose,[[.7,.2],[-.6,.2],[2.6,.2]]);P.a.dispose();
   }
  }else if(hold){
   // a drink in the right hand (people/izakaya-beer.js), held between sips and at the lips (consume.js fitAvatarHeldProp)
   const {createDrinkProp}=await import(base+'src/people/izakaya-beer.js'),{fitAvatarHeldProp}=await import(base+'src/avatars/consume.js');
   for(const kind of hold.split(',')){for(const lift of [0,1]){
    const sc=scene(),P=body(name,sc),prop=createDrinkProp(kind);P.a.bones.handR.add(prop);const state={pose:'DrinkStanding',heldProp:prop,consumeElapsed:lift?1.2:0};
    P.step(60,state);fitAvatarHeldProp(P.a,prop,lift);P.holder.updateMatrixWorld(true);
    const h=handAt(P.a,'R'),y=frontYaw(P.a);for(const turn of [-1.2,-.4,.6,2.2])shoot(sc,h,y+turn,.2,P.a.measure.hand*10,`${kind} ${lift?'at the lips':'held'} · grip ${P.a.gripOf?.('R')}`);P.a.dispose();}}
  }else if(can){
   // a bought can, sealed, opened and drunk as animated in Blender (actors.js drinkBought: the DrinkCan move)
   const {createDrinkProp}=await import(base+'src/people/izakaya-beer.js');
   for(const at of can.split(',').map(Number)){
    const sc=scene(),P=body(name,sc),prop=createDrinkProp('can',{held:true,sealed:true});P.a.bones.handR.add(prop);
    const state={heldProp:prop,seated,seatHeight:.45};
    if(seated){const seat=new T.Mesh(new T.BoxGeometry(.5,.04,.42),new T.MeshStandardMaterial({color:0x8a6a4a}));seat.position.set(0,.43,-.06);sc.add(seat);}
    P.step(30,state);P.anim.play('DrinkCan');P.step(Math.round(at*60),state);
    const c=P.a.bones.chest.getWorldPosition(new T.Vector3()),y=frontYaw(P.a),hd=P.a.bones.head.getWorldPosition(new T.Vector3()),m=P.a.measure;
    const aim=hd.clone().add(new T.Vector3(0,(m.headCentre-m.headY)*.2,0)).lerp(c,.35);
    for(const [turn,label] of [[0,'front'],[-.8,'three-quarter'],[-Math.PI/2,'side']])shoot(sc,aim,y+turn,.1,2.1,`${at.toFixed(2)} s · ${label}`);
    // (close: the can's top and the hands opening it; the mouth and the can at it, from his left, the side the arm is not)
    const near=at<2.4?prop.localToWorld(new T.Vector3(0,.1,0)):P.a.bones.head.localToWorld(new T.Vector3(0,(m.headCentre-m.headY)*.35,m.Rh*.8));
    shoot(sc,near,y+(at<2.4?-.5:.9),at<2.4?.35:.05,m.hand*(at<2.4?6:11),`${at.toFixed(2)} s · close`);
    P.a.dispose();
   }
  }else if(ride){
   // on the town's bicycle (world/bicycle.js), as tests/bicycle-rider.test.mjs rides it
   const {buildBicycle}=await import(base+'src/world/bicycle.js'),{bicycleRiderFit}=await import(base+'src/world/bicycle-fit.js');
   for(const phase of ride.split(',').map(Number)){
    const sc=scene(),entity=new T.Group();sc.add(entity);const P=body(name,sc),bike=buildBicycle({animated:true});sc.remove(P.holder);entity.add(P.holder,bike.object);
    const fit=bicycleRiderFit(P.a.measure);bike.setRiderFit(fit);P.step(120,{riding:true,ridePhase:phase,bicycleFit:fit});bike.animateRide(phase,true);sc.updateMatrixWorld(true);
    const y=frontYaw(P.a),c=P.a.bones.chest.getWorldPosition(new T.Vector3());shoot(sc,c,y+1.2,.2,2.6,'ride '+phase);
    for(const side of ['L','R']){const h=handAt(P.a,side),o=side==='L'?1:-1;for(const [turn,pitch] of [[0,.3],[o*1.4,.2],[o*.4,1.2]])shoot(sc,h,y+turn,pitch,P.a.measure.hand*9,`ride ${phase} · ${side} · grip ${P.a.gripOf?.(side)}`);}
    P.a.dispose();
   }
  }else if(drive){
   // in the driver's seat, both hands on the wheel at nine and three (consume.js gripWheel, as actors.js drives a body)
   const {buildVehicle}=await import(base+'src/world/road-vehicles.js'),{gripWheel}=await import(base+'src/avatars/consume.js');
   for(const kind of drive.split(',')){
    const sc=scene(),v=buildVehicle(kind,'#d8342c'),seat=v.userData.driverSeat,wheel=v.userData.steeringWheel;v.visible=true;sc.add(v);
    const P=body(name,sc);sc.remove(P.holder);v.add(P.holder);P.holder.position.set(seat.x,0,seat.z);P.holder.rotation.set(0,Math.PI,0);
    P.step(60,{seated:true,seatHeight:seat.y,driving:true,pose:'Sit',floorHeight:.22});gripWheel(P.a,v,wheel,1.3);sc.updateMatrixWorld(true);
    const y=frontYaw(P.a),c=P.a.bones.chest.getWorldPosition(new T.Vector3());shoot(sc,c,y+.9,.3,2.4,kind);
    for(const side of ['L','R']){const h=handAt(P.a,side);for(const [turn,pitch] of [[0,.3],[side==='L'?1.3:-1.3,.2],[side==='L'?-.5:.5,1.1]])shoot(sc,h,y+turn,pitch,P.a.measure.hand*9,`${kind} · ${side} · grip ${P.a.gripOf?.(side)}`);}
    P.a.dispose();
   }
  }else if(sit){
   for(const kind of sit.split(',')){
    const sc=scene(),P=body(name,sc),h=kind==='floor'?0:kind==='cushion'?.075:kind==='stool'?.62:.45,state={seated:true,seatHeight:h};
    if(h>0){const seat=new T.Mesh(new T.BoxGeometry(.5,.04,.42),new T.MeshStandardMaterial({color:0x8a6a4a}));seat.position.set(0,h-.02,-.06);sc.add(seat);}
    P.step(90,state);const c=P.a.bones.hips.getWorldPosition(new T.Vector3()),y=frontYaw(P.a);shoot(sc,c,y+.5,.25,2.2,'sit '+kind);
    closeups(sc,P.a,'sit '+kind,[[1.2,.5],[-.3,.6]]);P.a.dispose();
   }
  }else{
   const sc=scene(),P=body(name,sc);P.step(30);
   if(grip){P.a.grip?.('L',+grip,shape);P.a.grip?.('R',+grip,shape);}
   const m=P.a.measure,y=frontYaw(P.a);
   for(const side of ['L','R']){const h=handAt(P.a,side),o=side==='L'?1:-1;
    for(const [turn,pitch,label] of [[0,.1,'front'],[o*.8,.1,'three-quarter'],[o*Math.PI/2,.05,'outside (back of the hand)'],[-o*1.2,.1,'inside (palm)'],[Math.PI,.1,'behind'],[o*.5,.95,'above']])
     shoot(sc,h,y+turn,pitch,m.hand*(label==='above'?11:8),`${name} ${side} · ${label}`);}
   const c=P.a.bones.chest.getWorldPosition(new T.Vector3());shoot(sc,c.clone().setY(c.y*.75),y+.3,.72,3.6,`${name} · game camera`);
   P.a.dispose();
  }
  const cols=Math.min(6,tiles.length),sheet=document.createElement('canvas');sheet.width=S*cols;sheet.height=S*Math.ceil(tiles.length/cols);const ctx=sheet.getContext('2d');
  tiles.forEach(({c,label},i)=>{ctx.drawImage(c,(i%cols)*S,Math.floor(i/cols)*S);ctx.fillStyle='#253b3d';ctx.font='15px sans-serif';ctx.fillText(label,(i%cols)*S+8,Math.floor(i/cols)*S+20);});
  return sheet.toDataURL('image/png');
 },[NAME,PAIRS,POSES,SIT,WHO,GRIP,OUTFIT,HOLD,DRIVE,RIDE,SHAPE,CAN,SEATED]);
 await writeFile(out,Buffer.from(data.split(',')[1],'base64'));console.log('wrote',out);
}catch(e){errors.push(String(e?.stack||e));}
finally{await browser.close();server.close();}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
