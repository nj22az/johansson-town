#!/usr/bin/env node
/**
 * Review sheets of a Pixar body (src/avatars/pixar.js) in the game's own renderer (the town's ink pipeline), in headless
 * Chromium (software GL in a cloud session: judge shapes and lines, not speed).
 *
 *   node tools/pixar-sheet.mjs [name] [out-directory]        (default: Thuan, output/pixar)
 *
 * Two sheets: `<name>-eyes.png`, her rigged eyes close (at rest, looking about, through a blink, the feelings, turned),
 * and `<name>-body.png`, the whole body turned round and in a few of World's moves. TOWN_CHROMIUM_PATH points at
 * another Chromium.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {serveGame} from './mcp/static-server.mjs';

const require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright');}catch{playwright=createRequire(new URL('../../steam-deck/package.json',import.meta.url))('playwright');}
const argv=process.argv.slice(2),opt=k=>{const i=argv.indexOf(k);return i<0?null:argv.splice(i,2)[1];};
// --cells a,b,c: only these face cells (their labels, or any expression of the painter's by name), --size: a cell's pixels,
// --tag: a suffix for the files (a before and after kept side by side)
const only=opt('--cells'),cellSize=+(opt('--size')||320),tag=opt('--tag')||'',frame=opt('--frame')||'face';
// --turn r: every face cell's body turned by r more radians (3.14: his back, in the chest and hips frames)
const turnBy=+(opt('--turn')||0);
// --motion from:to[:seconds]: the face going from one feeling to the next on its springs, a frame every 50 ms (a clock of
// the tool's own, so the frames are the same every run)
const motion=opt('--motion');
// --body a,b: only these body cells (their labels), and no face cells unless --cells asks for some; --seat h: the seat
// height (metres) the seated cells sit him on
const bodyOnly=opt('--body');
// --pose move:seconds: every face cell's body in this gesture (animate.js) so many seconds in (Wave:0.9), for the close
// frames: --frame neck looks at the neck and collar from 0.6 m, --frame at:<bone>[:metres[:up]] at any bone where the pose put it
const pose=opt('--pose');
// --undressed: the body without its clothes (its underwear), as ?pixarClothes=0 shows it
const undressed=argv.includes('--undressed');if(undressed)argv.splice(argv.indexOf('--undressed'),1);
// --grip: both hands closed (a Pixar body's gripL/gripR morph targets, pixar.js grip), for --frame hand
const grip=argv.includes('--grip');if(grip)argv.splice(argv.indexOf('--grip'),1);
// --hold: the right hand turned as table-drink.js holds a jug (its HOLD_Q), to look at the hand in that turn: use with --grip
const hold=argv.includes('--hold');if(hold)argv.splice(argv.indexOf('--hold'),1);
// --face '{"eyes":{"style":"cat"}}': the recipe's face parts changed for this sheet (a clone's face follows its recipe)
const faceParts=JSON.parse(opt('--face')||'null');
const name=argv[0]||'Thuan',out=resolve(argv[1]||'output/pixar');mkdirSync(out,{recursive:true});

// [label, face state, turn of the body (radians, + to her left)]
const EYES=[
 ['at rest',{expression:'neutral'},0],
 ['look left',{expression:'neutral',look:[-1,0]},0],
 ['look right',{expression:'neutral',look:[1,0]},0],
 ['look up',{expression:'neutral',look:[0,-1]},0],
 ['look down',{expression:'neutral',look:[0,1]},0],
 ['blink 0.5',{expression:'neutral',blink:.5},0],
 ['blink 1',{expression:'neutral',blink:1},0],
 ['wink (left)',{expression:'neutral',blinkLeft:1,blinkRight:0},0],
 ['three-quarter',{expression:'neutral',look:[.4,0]},.62],
 ['side',{expression:'neutral'},1.2],
 ['back three-quarter',{expression:'neutral'},2.4],
 ['back',{expression:'neutral'},Math.PI],
 ['smile',{expression:'smile'},0],
 ['happy',{expression:'happy'},0],
 ['angry',{expression:'angry'},0],
 ['sad',{expression:'sad'},0],
 ['surprised',{expression:'surprised'},0],
 ['worried',{expression:'worried'},0],
 ['shy',{expression:'shy'},0],
 ['shock',{expression:'shock'},0],
 ['daze',{expression:'daze'},0],
 ['sleep',{expression:'sleep'},0],
 ['talking',{expression:'neutral',talk:1},0],
 ['grin',{expression:'happy',talk:0},0],
 ['laugh',{expression:'laugh'},0],
 ['grumpy',{expression:'grumpy'},0],
 ['wink',{expression:'wink'},0],
 ['kiss',{expression:'kiss'},0],
 ['smug',{expression:'smug'},0],
 ['pain',{expression:'pain'},0],
 ['scared',{expression:'scared'},0],
 ['cartoon today',{expression:'neutral'},0,true],
];
// [label, turn, move (animate.js gesture) or null, seconds into it]
if(only){const want=only.split(','),known=new Map(EYES.map(c=>[c[0],c]));EYES.splice(0,EYES.length,...want.map(w=>known.get(w)||[w,{expression:w},0]));}
if(motion){const [from,to,secs=.8]=motion.split(':');EYES.splice(0,EYES.length,[from,{expression:from},0,false,0],
 ...Array.from({length:Math.round(+secs*20)},(_,i)=>[`${to} +${(i+1)*50} ms`,{expression:to},0,false,50]));}
// (a sixth element: the animator's state for the cell, a pose of World's or a seat: --body "interact,sit drink")
const SEAT=+(opt('--seat')||.46);   // a stool's seat height (metres) for the seated cells: the izakaya's counter stools by default
const BODY=[['front',0],['three-quarter',.7],['side',Math.PI/2],['back',Math.PI],['walking',.5,'walk',.4],['wave',0,'Wave',.9],['wave later',.35,'Wave',1.15],['think',.35,'Think',1.2],
 ['interact',.35,null,1.5,false,{pose:'Interact'}],['counter idle',.35,null,1.5,false,{pose:'CounterIdle'}],['drink',.35,'Drink',1.6],['eat',.35,'Eat',1.6],
 ['sit drink',.5,'SitDrink',1.4,false,{seated:true,seatHeight:SEAT}],['sit toast',.5,'SitToast',1.4,false,{seated:true,seatHeight:SEAT}],['sit',.5,null,1,false,{seated:true,seatHeight:SEAT}],
 ['cartoon today',0,null,0,true]];

const server=await serveGame(resolve(new URL('..',import.meta.url).pathname));
const browser=await playwright.chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(server.url+'src/avatars/face.js?pixar='+name.toLowerCase());
 const result=await page.evaluate(async({faceParts,name,undressed,grip,hold,eyes,body,cellSize,frame,moving,turnBy,pose,SEAT})=>{
  const T=await import('/johansson-town/vendor/three.module.js'),{buildAvatar}=await import('/johansson-town/src/avatars/build.js'),{recipeFor}=await import('/johansson-town/src/avatars/cast.js');
  const {createInkPipeline}=await import('/johansson-town/src/render/ink-pipeline.js'),{loadPixarBodies}=await import('/johansson-town/src/avatars/pixar.js'),{createAvatarAnimator:createAnimator}=await import('/johansson-town/src/avatars/animate.js');
  // assets/ resolve against the page (assets.js): the game's folder, as on its own page
  const base=document.createElement('base');base.href='/johansson-town/';document.head.append(base);
  const got=await loadPixarBodies();if(!got.includes(name))throw new Error('no Pixar body for '+name);
  const scene=new T.Scene();scene.background=new T.Color('#c9d6cf');
  const fill=new T.HemisphereLight(0xffffff,0x887766,1.5),sun=new T.DirectionalLight(0xffffff,2);sun.position.set(2,5,4);scene.add(fill,sun);
  const own=recipeFor(name),recipe=faceParts?{...own,...Object.fromEntries(Object.entries(faceParts).map(([k,v])=>[k,{...own[k],...v}]))}:own;
  const pixar=buildAvatar(recipe,{shadows:false}),cartoon=buildAvatar(recipe,{shadows:false,pixar:null});
  if(undressed)pixar.pixar?.dress(false);
  for(const a of [pixar,cartoon]){a.root.rotation.y=0;scene.add(a.root);}
  pixar.pixar.smooth=moving;   // each cell its feeling at once (the game eases between them), unless it is a motion strip
  let clock=1000;if(moving)performance.now=()=>clock;
  const report={name,triangles:0,cells:[]};pixar.root.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry.index)report.triangles+=o.geometry.index.count/3;});
  const sheet=(cells,size,cols,draw)=>{
   const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(size[0],size[1]);
   const camera=new T.PerspectiveCamera(22,size[0]/size[1],.05,50),pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});
   const rows=Math.ceil(cells.length/cols),c=document.createElement('canvas');c.width=cols*size[0];c.height=rows*(size[1]+22);
   const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
   cells.forEach((cell,i)=>{draw(cell,camera);scene.updateMatrixWorld(true);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    pipeline.setCamera?.(camera);pipeline.render(r=>r.render(scene,camera));
    const x=(i%cols)*size[0],y=Math.floor(i/cols)*(size[1]+22);g.drawImage(renderer.domElement,x,y);
    g.fillStyle='#222';g.font='15px sans-serif';g.fillText(cell[0],x+8,y+size[1]+16);});
   pipeline.dispose();renderer.dispose();renderer.forceContextLoss();return c.toDataURL('image/png');
  };
  const show=a=>{pixar.root.visible=a===pixar;cartoon.root.visible=a===cartoon;};
  const headAt=a=>{a.root.updateMatrixWorld(true);return a.bones.head.getWorldPosition(new T.Vector3());};
  const animFace=createAnimator(pixar);
  const eyesPng=!eyes.length?null:sheet(eyes,[cellSize,cellSize],Math.min(6,Math.max(1,Math.floor(1920/cellSize))),(cell,camera)=>{const [label,state,turn,old]=cell;
   const a=old?cartoon:pixar;show(a);a.root.rotation.y=turn+turnBy;if(moving)clock+=cell[4]||0;
   for(const b of Object.values(a.bones))b.rotation.set(0,0,0);
   // (--pose Wave:0.9 a gesture; --pose pose:Interact:1.5 one of World's poses; --pose seat:SitDrink:1.3 a seated gesture
   // on the stool; --pose idle:0.5 the stance alone)
   if(pose&&!old){const parts=pose.split(':'),kind=['pose','seat','idle'].includes(parts[0])?parts.shift():'gesture',move=parts[0],secs=parts[1]||'.9';a.root.position.set(0,0,0);
    const state=kind==='pose'?{pose:move}:kind==='seat'?{seated:true,seatHeight:SEAT}:{};
    if(kind==='gesture'||kind==='seat')animFace.play?.(move);
    for(let k=0;k<Math.round(+secs*60);k++)animFace.update(1/60,state);if(!state.seated)a.root.position.set(0,0,0);}
   a.paintFace({blink:0,talk:0,look:[0,0],gaze:null,blinkLeft:undefined,blinkRight:undefined,...state});
   if(grip&&!old){a.pixar?.grip?.('L',1);a.pixar?.grip?.('R',1);}
   if(hold&&!old){a.bones.handR.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(-1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,1,0)));a.root.updateMatrixWorld(true);}
   // (a Pixar body's face at its own eyes' height, a little below: its card says where they are)
   const h=headAt(a),eyeY=a.pixar?.card?.eyes?.centres?.[0]?.[1],up=old?a.measure.headCentre-a.measure.headY:eyeY!=null?eyeY-a.pixar.card.rest.head[1]-.012:.075;
   // (--frame mouth: close on the mouth, a little below the eyes; --frame eyes: close on the eyes; --frame nose; --frame
   // chest: his shoulders, arms and trunk to the waist; --frame hips: from the waist to the knees)
   if(frame==='hand'&&!old){a.root.updateMatrixWorld(true);const q=a.bones.handL.getWorldPosition(new T.Vector3()),t=turn||0;camera.position.set(q.x+Math.sin(t)*.42,q.y-.02,q.z+Math.cos(t)*.42);camera.lookAt(q.x,q.y-.04,q.z);}
   // (--frame at:<bone>[:metres[:up]]: close on any bone of the body where the pose has put it, from so far (0.6 m) and so
   // much above it (0.02 m); the cell's turn (and --turn) walks the camera round the bone instead of turning the body:
   // at:shoulderR for the shoulder of the waving arm, at:elbowL for the other)
   else if(frame.startsWith('at:')&&!old){const [,bone,dist='.6',up_='.02']=frame.split(':');const t=a.root.rotation.y,d=+dist;a.root.rotation.y=0;a.root.updateMatrixWorld(true);const q=a.bones[bone].getWorldPosition(new T.Vector3());camera.position.set(q.x+Math.sin(t)*d,q.y+ +up_,q.z+Math.cos(t)*d);camera.lookAt(q.x,q.y,q.z);}
   else if(frame==='nose'&&!old){const c=a.pixar?.card?.eyes?.centres,y=(c?.[0]?.[1]??h.y+up)-.05,x=c?(c[0][0]+c[1][0])/2:0,t=turn||0;camera.position.set(h.x+x+Math.sin(t)*.5,y+.02,h.z+Math.cos(t)*.5);camera.lookAt(h.x+x,y,h.z+.06);}
   else if(frame==='eyes'&&!old){const c=a.pixar?.card?.eyes?.centres,y=c?.[0]?.[1]??h.y+up,x=c?(c[0][0]+c[1][0])/2:h.x;camera.position.set(h.x+x,y+.005,h.z+.42);camera.lookAt(h.x+x,y,h.z);}
   else if((frame==='chest'||frame==='hips')&&!old){const dy=frame==='hips'?.74:.36;camera.position.set(h.x,h.y-dy+.04,h.z+1.25);camera.lookAt(h.x,h.y-dy,h.z);}
   else if(frame==='neck'&&!old){const y=h.y-.1,t=turn||0;camera.position.set(h.x+Math.sin(t)*.6,y+.03,h.z+Math.cos(t)*.6);camera.lookAt(h.x,y,h.z);}
   else if(frame==='mouth'&&!old){const y=a.pixar.card?.eyes?.centres?.[0]?.[1]??h.y+up,my=y-.085;camera.position.set(h.x,my+.01,h.z+.42);camera.lookAt(h.x,my,h.z);}
   else{camera.position.set(h.x,h.y+up+.01,h.z+(old?1.55:.95));camera.lookAt(h.x,h.y+up,h.z);}
   report.cells.push({label,showing:a.pixar?a.pixar.eyes.showing:null});
  });
  const anim=createAnimator(pixar),animOld=createAnimator(cartoon);
  const {fitAvatarHeldProp}=await import('/johansson-town/src/avatars/consume.js'),{createDrinkProp}=await import('/johansson-town/src/people/izakaya-beer.js'),{levelHeldDrink}=await import('/johansson-town/src/avatars/table-drink.js');
  let prop=null;
  const bodyPng=!body.length?null:sheet(body,[300,520],8,([label,turn,move,t,old,state={}],camera)=>{
   const a=old?cartoon:pixar,an=old?animOld:anim;show(a);a.root.rotation.y=turn;a.root.position.set(0,0,0);
   for(const b of Object.values(a.bones))b.rotation.set(0,0,0);
   // (a drinking cell holds a draught glass, as the game puts one in the hand at a table (game.js): without it the drink
   // arm's empty fist rammed his chin, the owner, 28 October 2026, "Sit drink is still not right")
   const drinking=!old&&['Drink','SitDrink','SitToast'].includes(move);
   if(drinking&&!prop){prop=createDrinkProp('draft',{held:true});a.bones.handR.add(prop);if(a.pixar?.holdPoint)levelHeldDrink(prop);}
   if(prop)prop.visible=drinking;
   if(move==='walk'){for(let k=0;k<Math.round(t*60)+30;k++)an.update(1/60,{speed:1.4});}
   else if(drinking){an.play?.(move);for(let k=0;k<Math.round(t*60);k++){an.update(1/60,{...state,heldProp:prop});fitAvatarHeldProp(a,prop,an.consumption?.lift||0);}}
   else if(move){an.play?.(move);for(let k=0;k<Math.round(t*60);k++)an.update(1/60,state);}
   else for(let k=0;k<Math.max(30,Math.round((t||0)*60));k++)an.update(1/60,state);
   // (seated, the animator lowers him onto the seat: he stays where it puts him, the stool imagined)
   if(!state.seated)a.root.position.set(0,0,0);
   camera.position.set(0,.95,5.6);camera.lookAt(0,.82,0);
  });
  pixar.dispose();cartoon.dispose();
  return {report,eyesPng,bodyPng};
 },{faceParts,name,undressed,grip,hold,eyes:bodyOnly&&!only?[]:EYES,body:bodyOnly?BODY.filter(c=>bodyOnly.split(',').includes(c[0])):only||motion?[]:BODY,cellSize,frame,moving:!!motion,turnBy,pose,SEAT});
 if(result.eyesPng)writeFileSync(resolve(out,name+tag+'-eyes.png'),Buffer.from(result.eyesPng.split(',')[1],'base64'));
 if(result.bodyPng)writeFileSync(resolve(out,name+tag+'-body.png'),Buffer.from(result.bodyPng.split(',')[1],'base64'));
 writeFileSync(resolve(out,name+tag+'.json'),JSON.stringify(result.report,null,1)+'\n');
 console.log(name,result.report.triangles,'triangles ->',out);
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
}finally{await browser.close();await server.close();}
