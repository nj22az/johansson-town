// The hands, close up, in the game's own shader: a resident's hand at rest from six sides, and the poses where hands touch
// something (the pair poses, the funny poses, sitting), each as the whole figure and a close-up of every hand, played on the
// game's own animator to the still Johansson Studio shoots (STILL_AT), as tests/pair-poses.test.mjs plays them.
//   node tools/hand-shots.mjs [--name Thao] [--grip 0..1] [--shape hook] [out.png]   the hand at rest (or closed so far), six views
//   node tools/hand-shots.mjs --pairs Shove,Fight,Hug,BackToBack [--who "Thuan,Nils Johansson"] [out.png]
//   node tools/hand-shots.mjs --poses Facepalm,Huff,Scold [--name Thao] [out.png]
//   node tools/hand-shots.mjs --sit chair,floor [--name Thao] [--outfit afterbath] [out.png]
//   node tools/hand-shots.mjs --hold draft,can,bottle [--name Johansson] [out.png]     a drink in the hand, held and at the lips
//   node tools/hand-shots.mjs --drive car,"kei truck" [--name Johansson] [out.png]      both hands on the steering wheel
//   node tools/hand-shots.mjs --beer pint[:resident] [--name Johansson] [out.png]   a glass of beer taken off Minato's counter, drunk and set down (:resident, as a resident at the venue)
//       (drink-beer.js createBeerTableDrink): its key moments from the front, the three-quarter and the side, strips of 8
//       consecutive frames over the lift, the gulp and the set-down, and the game's third-person camera indoors
//   node tools/hand-shots.mjs --ride 0,.25 [--name Thuan] [out.png]                     on a bicycle, at those turns of the crank
//   node tools/hand-shots.mjs --can 0,1,3.45 [--name Johansson] [--seated] [--bought "Kame lager"] [out.png]     a bought can opened and drunk (drink-can.js), at those seconds
//       (--bought: the can as the machine sells it, printed and sized as itself, commerce/bought-can.js; else the izakaya's can):
//       front, three-quarter, side, a close view, and from where the game's own third-person camera stands (game.js
//       placeThirdPerson: behind him and over his right shoulder, outdoors 3.2 m back and indoors 2.2 m)
//   node tools/hand-shots.mjs --moves Walk,Talk,Nod,Wave,Eat,SitEat [--name Johansson] [out-dir]
//       each move as the game's animator plays it (the walk: a resident's walk coming to a stop): front and three-quarter at
//       its key moments, and strips of 8 consecutive frames over where it leaves the stance (and comes back to it), so a pop
//       shows. One sheet a move: <out-dir>/<move>-<name>.png (default out-dir: output/hands-moves). With --wind, a strip more:
//       every third frame from the move's start to 0.35 s, over its wind-up and into its action, in motion order. With
//       --strip 0.7:2,1.1 more strips: 8 frames from those seconds, every 2nd (or every one) frame (a landing, an impact).
//       --fixed: the strips' camera stays where the chest was as the move began, so a jump's height and a landing's drop show.
// --set outfit.pattern=none;outfit.topColour=#7fb0d8 tries values on every resident's recipe without editing it, as
//       avatar-turnaround.mjs does (a garment's plain block-in, before its print).
// Software Chromium (TOWN_CHROMIUM_PATH, or /opt/pw-browsers/chromium). Default out: output/hands-<what>.png
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const BEER=flag('--beer')||'',BOUGHT=flag('--bought')||'',SET=flag('--set')||'',MOVES=flag('--moves')||'',WIND=args.includes('--wind'),STRIPS=flag('--strip')||'',FIXED=args.includes('--fixed'),CAN=flag('--can')||'',SEATED=args.includes('--seated'),RIDE=flag('--ride')||'',DRIVE=flag('--drive')||'',HOLD=flag('--hold')||'',OUTFIT=flag('--outfit')||'clothes',NAME=flag('--name')||'Thao',PAIRS=flag('--pairs')||'',POSES=flag('--poses')||'',SIT=flag('--sit')||'',WHO=flag('--who')||'Thuan,Nils Johansson',GRIP=flag('--grip'),SHAPE=flag('--shape')||'close';
const what=BEER?'beer':MOVES?'moves':PAIRS?'pairs':POSES?'poses':SIT?'sit':HOLD?'hold':DRIVE?'drive':RIDE?'ride':CAN?'can':'rest';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--name','--pairs','--poses','--sit','--who','--grip','--outfit','--hold','--drive','--ride','--shape','--can','--moves','--bought','--set','--strip','--beer'].includes(args[i-1]))||resolve(root,MOVES?'output/hands-moves':`output/hands-${what}.png`));
await mkdir(MOVES?out:dirname(out),{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary'};
// (the Town is this checkout, at /johansson-town/, wherever it is: a worktree's parent is not the Office site)
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),town=path.startsWith('/johansson-town/'),file=town?resolve(root,'.'+path.slice('/johansson-town'.length)):resolve(site,'.'+path);if(!file.startsWith(town?root:site))throw Error('outside');
 if(path==='/blank')return res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><base href="/johansson-town/"><title>hands</title>');
 const body=await readFile(file);res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+(m.location()?.url?' ('+m.location().url+')':''));});
 await page.goto(`http://127.0.0.1:${server.address().port}/blank`);
 const data=await page.evaluate(async([name,pairs,poses,sit,who,grip,outfit,hold,drive,ride,shape,can,seated,moves,bought,WIND,set,STRIPS,FIXED,beer])=>{
  const base='/johansson-town/',T=await import(base+'vendor/three.module.js'),{buildAvatar}=await import(base+'src/avatars/build.js'),cast=await import(base+'src/avatars/cast.js');
  // (--set: values tried on the recipe, path=value pairs)
  const recipeFor=who=>{const r=JSON.parse(JSON.stringify(cast.recipeFor(who)));for(const pair of set.split(';').filter(Boolean)){const [path,raw]=pair.split('='),keys=path.split('.');let o=r;for(const k of keys.slice(0,-1))o=o[k]??={};o[keys.at(-1)]=raw==='true'?true:raw==='false'?false:isNaN(+raw)?raw:+raw;}return r;};
  const {createAvatarAnimator,GESTURES,STILL_AT,playPair}=await import(base+'src/avatars/animate.js'),{createInkPipeline}=await import(base+'src/render/ink-pipeline.js');
  const S=360,renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:true});renderer.setSize(S,S);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const pipeline=createInkPipeline(renderer,{superScale:1,samples:0,fxaa:true});pipeline.setLook('none');
  const camera=new T.PerspectiveCamera(28,1,.02,60),tiles=[];
  const scene=()=>{const s=new T.Scene();s.background=new T.Color('#cfe3ee');s.add(new T.HemisphereLight(0xffffff,0xd8cdbd,2.4));const sun=new T.DirectionalLight(0xffffff,2.2);sun.position.set(2,5,4);s.add(sun);
   const floor=new T.Mesh(new T.CircleGeometry(2.2,40),new T.MeshStandardMaterial({color:0xc9cfbd}));floor.rotation.x=-Math.PI/2;floor.position.y=-.001;s.add(floor);return s;};
  const shoot=(sc,target,yaw,pitch,d,label)=>{camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*d,target.y+Math.sin(pitch)*d,target.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   sc.updateMatrixWorld(true);pipeline.setCamera(camera);pipeline.render(r=>r.render(sc,camera));const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d').drawImage(renderer.domElement,0,0);tiles.push({c,label});};
  // (from a place, looking at a point: the game's own camera, which is not on a circle round what it looks at)
  const shootFrom=(sc,from,target,label)=>{camera.position.copy(from);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
   sc.updateMatrixWorld(true);pipeline.setCamera(camera);pipeline.render(r=>r.render(sc,camera));const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d').drawImage(renderer.domElement,0,0);tiles.push({c,label});};
  const body=(who,sc)=>{const a=buildAvatar(recipeFor(who),{shadows:false});a.wear?.(outfit);const holder=new T.Group();holder.add(a.root);sc.add(holder);
   const anim=createAvatarAnimator(a,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})()});
   const step=(n=1,state={})=>{for(let i=0;i<n;i++){anim.update(1/60,state);a.springs?.update(1/60);}holder.updateMatrixWorld(true);};return {a,anim,holder,step};};
  const handAt=(a,side)=>{const m=a.measure;return a.bones['hand'+side].localToWorld(new T.Vector3(0,-m.hand*.8,0));};
  // the angle round the figure a camera looks from, in the world: yaw of the figure's front plus `turn`
  const frontYaw=a=>{const q=a.root.getWorldQuaternion(new T.Quaternion()),f=new T.Vector3(0,0,1).applyQuaternion(q);return Math.atan2(f.x,f.z);};
  const closeups=(sc,a,label,views=[[.5,.25],[-.5,.25]])=>{const m=a.measure;for(const side of ['L','R']){const h=handAt(a,side),y=frontYaw(a);for(const [turn,pitch] of views)shoot(sc,h,y+turn,pitch,m.hand*9,`${label} · ${side}`);}};
  if(moves){
   // each move played as the audit plays it (tools/animation-audit.mjs): a seeded random, the idle's clock from 0, the props
   // the game puts in the hands, seated where the move is a seated one; the walk a resident's 1.25 m/s, damped as actors.js
   // damps it, for 3 s, then stopping
   const izakaya=await import(base+'src/people/izakaya-beer.js'),files=[];
   for(const move of moves.split(',')){
    tiles.length=0;
    const sc=scene(),a=buildAvatar(recipeFor(name),{shadows:false});a.wear?.(outfit);const holder=new T.Group();holder.add(a.root);sc.add(holder);
    const anim=createAvatarAnimator(a,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})(),initialTime:0});
    const seated=move.startsWith('Sit'),walk=move==='Walk',base0=seated?{seated:true,seatHeight:.45,seatFront:.2}:{};
    if(seated){const seat=new T.Mesh(new T.BoxGeometry(.5,.04,.42),new T.MeshStandardMaterial({color:0x8a6a4a}));seat.position.set(0,.43,-.06);sc.add(seat);}
    if(/Eat$/.test(move)){const R=izakaya.createBiteProp('rice'),L=izakaya.createDishProp('rice');a.bones.handR.add(R);a.bones.handL.add(L);base0.heldProp=R;}
    if(/Drink$/.test(move)){const R=izakaya.createDrinkProp('draft',{held:true});a.bones.handR.add(R);base0.heldProp=R;}
    let speed=0;const state=f=>{if(!walk)return base0;speed=T.MathUtils.damp(speed,f>=0&&f<180?1.25:0,20,1/60);return speed>0?{...base0,speed}:base0;};
    // (the swinging hems and hair as the game swings them: springs.js)
    const tick=f=>{anim.update(1/60,state(f));a.springs?.update(1/60);holder.updateMatrixWorld(true);};
    for(let f=-60;f<-1;f++)tick(f);
    const d=walk?3:GESTURES[move],held=d===Infinity;
    // the key moments (seconds from the move's start) and where the strips start (frames): the walk's stop is where the damped
    // speed falls under 0.08 m/s, 3.14 s
    const keys=walk?[2.5,3.1,3.2,3.6]:held?[0,.15,.5,1.6]:[0,.15,Math.min(d*.43,d-.3),d-.12,d+.3];
    const strips=(walk?[[186,'the stop']]:held?[[-1,'leaving the stance']]:[[-1,'leaving the stance'],[Math.round(d*60)-3,'coming back']]).map(x=>[...x,1]);
    // (--wind: and every third frame from the move's start to 0.35 s, over its wind-up and into its action)
    if(WIND&&!walk)strips.push([0,'every 3rd frame over the wind-up',3]);
    for(const x of STRIPS.split(',').filter(Boolean)){const [at,k=1]=x.split(':').map(Number);strips.push([Math.round(at*60),`${k>1?'every '+k+'th frame ':''}from ${at} s`,k]);}
    const inStrip=(f,[s0,,k])=>f>=s0&&f<s0+8*k&&(f-s0)%k===0;
    const want=new Map();for(const k of keys)want.set(Math.round(k*60),'key');for(const [s0,,k] of strips)for(let i=0;i<8;i++)if(!want.has(s0+i*k))want.set(s0+i*k,'strip');
    const last=Math.max(...want.keys()),key=[],strip=new Map();let fixedAt=null;
    for(let f=-1;f<=last;f++){if(f===0&&!walk)anim.play(move);tick(f);if(!want.has(f))continue;
     const c=a.bones.chest.getWorldPosition(new T.Vector3()),y=frontYaw(a),at=(f/60).toFixed(3)+' s';if(f<=0||!fixedAt)fixedAt=c.clone();const sc0=FIXED?fixedAt:c;
     if(keys.some(k=>Math.round(k*60)===f)){const whole=c.clone().add(new T.Vector3(0,.12*a.measure.k,0));for(const [turn,label] of [[0,'front'],[-.8,'three-quarter']]){shoot(sc,whole,y+turn,.1,3.6,`${move} ${at} · ${label}`);key.push({f,label,tile:tiles.pop()});}}
     for(const st of strips)if(inStrip(f,st)){const [s0]=st;shoot(sc,sc0.clone().add(new T.Vector3(0,FIXED?.05:-.12,0)),y-.8,.15,FIXED?3.6:1.9,`frame ${f} · ${at}`);(strip.get(s0)||strip.set(s0,[]).get(s0)).push(tiles.pop());}
    }
    // rows: the key moments from the front, from three-quarters, then each strip of 8 frames
    const rows=[key.filter(k=>k.label==='front').map(k=>k.tile),key.filter(k=>k.label!=='front').map(k=>k.tile),...strips.map(([s0])=>strip.get(s0)||[])];
    const sheet=document.createElement('canvas');sheet.width=S*8;sheet.height=S*rows.length+28*strips.length;const ctx=sheet.getContext('2d');ctx.fillStyle='#f4f1ea';ctx.fillRect(0,0,sheet.width,sheet.height);
    let yy=0;rows.forEach((row,r)=>{if(r>=2){ctx.fillStyle='#253b3d';ctx.font='bold 18px sans-serif';ctx.fillText(`${name} · ${move} · ${strips[r-2][2]>1?'8 frames':'8 consecutive frames'}, ${strips[r-2][1]}`,8,yy+20);yy+=28;}
     row.forEach(({c,label},i)=>{ctx.drawImage(c,i*S,yy);ctx.fillStyle='#253b3d';ctx.font='15px sans-serif';ctx.fillText(label,i*S+8,yy+20);});yy+=S;});
    files.push([`${move}-${name.replace(/\s+/g,'')}.png`,sheet.toDataURL('image/png')]);a.dispose();
   }
   return {files};
  }else if(pairs){
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
  }else if(beer){
   // a glass of beer off Minato's counter (drink-beer.js), seated on a counter stool as game.js seats a body (the holder at the
   // seat, the body forward on the stool as far as its shins need), the glass where Thao sets one down, turned to the drinker:
   // Johansson's (createBeerTableDrink), or with --resident a resident's at the venue (the animator's 'Drink' pose, the glass in
   // the hand standing where it stands: venue-service.js drinkRest)
   const {createDrinkProp,setPropPortion,IZAKAYA_PLAYER_SEATS}=await import(base+'src/people/izakaya-beer.js'),{MINATO_COMPACT}=await import(base+'src/world/interiors/minato-compact-plan.js');
   const {createBeerTableDrink,beerParts,BEER_MOTIONS,restTurn,beerPlan,beerPlanAt,beerStyleOf}=await import(base+'src/avatars/drink-beer.js');
   const seat=IZAKAYA_PLAYER_SEATS.counter2,C=MINATO_COMPACT.counter,kind={mug:'draft',pint:'pint',glass:'bottle'}[beer.split(':')[0]],resident=beer.endsWith(':resident');
   const sc=scene(),P=body(name,sc),state={seated:true,seatHeight:seat.surfaceY,seatFront:seat.front};P.holder.position.set(...seat.position);P.holder.rotation.set(0,seat.yaw,0);P.step(90,{...state,pose:'Sit'});
   const counter=new T.Mesh(new T.BoxGeometry(1.6,.06,C.depth),new T.MeshStandardMaterial({color:0xb08a5a}));counter.position.set(seat.position[0],C.top-.03,C.position[2]);sc.add(counter);
   const stool=new T.Mesh(new T.CylinderGeometry(.17,.17,.04,24),new T.MeshStandardMaterial({color:0x4a3a2a}));stool.position.set(seat.position[0],seat.surfaceY-.03,seat.position[2]);sc.add(stool);
   const prop=createDrinkProp(kind,{held:true}),M=BEER_MOTIONS[beer.split(':')[0]],B=beerParts(M),y=frontYaw(P.a),m=P.a.measure;let tick;
   if(resident){
    P.a.bones.handR.add(prop);setPropPortion(prop,1,{immediate:true});const plan=beerPlan(prop,beerStyleOf(P.a.recipe?.name),{counter:true,first:true});let e=0;
    tick=()=>{if(e>plan.duration+.3)return null;P.step(1,{...state,heldProp:prop,pose:'Drink',consumeElapsed:Math.min(e,plan.duration),drinkRest:seat.table,drinkFirst:true});e+=1/60;return beerPlanAt(plan,Math.min(e,plan.duration));};
   }else{
    sc.add(prop);prop.position.set(...seat.table);prop.quaternion.copy(restTurn(P.a.root));
    let consumed=0;const lease={prop,kind,startFraction:1,endFraction:.6,get consumedPortion(){return consumed;},consume(p){consumed=.4*p;setPropPortion(prop,1-consumed,{immediate:true});},finish:()=>({}),cancel:()=>({})};
    const drink=createBeerTableDrink(P.a,lease);tick=()=>{if(!drink.active)return null;P.step(1,state);drink.update(1/60);P.holder.updateMatrixWorld(true);return drink.diagnostics;};
   }
   const keys=[['take',.62,'the hand dips'],['take',1.42,'on the glass'],['first',.45,'anticipation'],['first',.95,'the lift'],['first',1.42,'contact'],['first',2.6,'the gulp'],['first',3.35,'off the lip'],['first',3.65,'kaa!'],['first',4.55,'the wipe'],['first',5.25,'set-down: up first'],['first',5.96,'the tap'],['let',.75,'let go']];
   const strips=[['first',.75,'lift'],['first',2.2,'gulp'],['first',5.86,'set-down'],['let',.3,'let go']],done=new Set();let strip=null;
   const aimAt=()=>{const c=P.a.bones.chest.getWorldPosition(new T.Vector3()),hd=P.a.bones.head.getWorldPosition(new T.Vector3());return hd.lerp(c,.45);};
   for(let i=0;i<60*30;i++){const d=tick();if(d===null)break;if(!d)continue;P.holder.updateMatrixWorld(true);const rel=d.t-B[d.part][0];
    for(const [part,at,label] of keys)if(part===d.part&&rel>=at&&!done.has(label)){done.add(label);for(const [turn,v] of [[0,'front'],[-.8,'three-quarter'],[-Math.PI/2,'side']])shoot(sc,aimAt(),y+turn,.12,2.3,`${label} · ${v}`);
     if(label==='kaa!'){const q=P.a.root.getWorldQuaternion(new T.Quaternion()),fwd=new T.Vector3(0,0,1).applyQuaternion(q),right=new T.Vector3(-1,0,0).applyQuaternion(q),pivot=P.a.root.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,m.H+.14,0)).addScaledVector(right,m.Rh*m.headSX+.26);
      shootFrom(sc,pivot.clone().addScaledVector(fwd,-2.2).add(new T.Vector3(0,.11,0)),P.a.bones.chest.getWorldPosition(new T.Vector3()),'kaa! · the game camera, indoors');}}
    for(const [part,at,label] of strips)if(part===d.part&&rel>=at&&!done.has('strip '+label)){done.add('strip '+label);strip={label,n:0};}
    if(strip&&strip.n<8){shoot(sc,aimAt(),y-.8,.12,2.3,`${strip.label} ${strip.n+1}/8`);strip.n++;}}
   P.a.dispose();
  }else if(can){
   // a bought can, sealed, opened and drunk as animated in Blender (actors.js drinkBought: the DrinkCan move)
   const {createDrinkProp}=await import(base+'src/people/izakaya-beer.js'),{CAN_PARTS}=await import(base+'src/avatars/drink-can.js');
   for(const at of can.split(',').map(Number)){
    let prop;if(bought){const {createBoughtCan}=await import(base+'src/commerce/bought-can.js'),{vendingArtLoaded}=await import(base+'src/world/vending.js');prop=createBoughtCan(bought);await vendingArtLoaded();}
    else prop=createDrinkProp('can',{held:true,sealed:true});
    const sc=scene(),P=body(name,sc);P.a.bones.handR.add(prop);
    const state={heldProp:prop,seated,seatHeight:.45};
    if(seated){const seat=new T.Mesh(new T.BoxGeometry(.5,.04,.42),new T.MeshStandardMaterial({color:0x8a6a4a}));seat.position.set(0,.43,-.06);sc.add(seat);}
    P.step(30,state);P.anim.play('DrinkCan');P.step(Math.round(at*60),state);
    const c=P.a.bones.chest.getWorldPosition(new T.Vector3()),y=frontYaw(P.a),hd=P.a.bones.head.getWorldPosition(new T.Vector3()),m=P.a.measure;
    const aim=hd.clone().add(new T.Vector3(0,(m.headCentre-m.headY)*.2,0)).lerp(c,.35);
    for(const [turn,label] of [[0,'front'],[-.8,'three-quarter'],[-Math.PI/2,'side']])shoot(sc,aim,y+turn,.1,2.1,`${at.toFixed(2)} s · ${label}`);
    // (close: the can's top and the hands opening it; the mouth and the can at it, from his left, the side the arm is not)
    const opening=at<CAN_PARTS.drink[0],near=opening?prop.localToWorld(new T.Vector3(0,.1,0)):P.a.bones.head.localToWorld(new T.Vector3(0,(m.headCentre-m.headY)*.35,m.Rh*.8));
    shoot(sc,near,y+(opening?-.5:.9),opening?.35:.05,m.hand*(opening?6:11),`${at.toFixed(2)} s · close`);
    // (a bought can: its print close up in his hand, from in front of it, and from the side away from the palm)
    if(bought){const mid=prop.localToWorld(new T.Vector3(0,prop.userData.rimHeight*.5,0));for(const [turn,label] of [[0,'front'],[-.9,'his right']])shoot(sc,mid,y+turn,.12,m.hand*7,`${at.toFixed(2)} s · the can, ${label}`);}
    // (and from the game's camera (game.js placeThirdPerson): its pivot above his head and to his right (actors.js lens: eye,
    // side), the lens `back` metres behind it along his facing, tipped down by the game's pitch, -0.05; looking at his chest,
    // which turns the lens, not where it stands: what his body hides from it is the same)
    const lens={eye:m.H+.14,side:m.Rh*m.headSX+.26},q=P.a.root.getWorldQuaternion(new T.Quaternion()),fwd=new T.Vector3(0,0,1).applyQuaternion(q),right=new T.Vector3(-1,0,0).applyQuaternion(q);
    for(const [back,where] of [[3.2,'outdoors'],[2.2,'indoors']]){const pivot=P.a.root.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,lens.eye,0)).addScaledVector(right,lens.side);
     const pitch=-.05,from=pivot.clone().addScaledVector(fwd,-back*Math.cos(pitch)).add(new T.Vector3(0,-Math.sin(pitch)*back,0));
     shootFrom(sc,from,c.clone().lerp(prop.getWorldPosition(new T.Vector3()),.5),`${at.toFixed(2)} s · game camera, ${where}`);}
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
 },[NAME,PAIRS,POSES,SIT,WHO,GRIP,OUTFIT,HOLD,DRIVE,RIDE,SHAPE,CAN,SEATED,MOVES,BOUGHT,WIND,SET,STRIPS,FIXED,BEER]);
 if(data.files)for(const [file,url] of data.files){const path=resolve(out,file);await writeFile(path,Buffer.from(url.split(',')[1],'base64'));console.log('wrote',path);}
 else{await writeFile(out,Buffer.from(data.split(',')[1],'base64'));console.log('wrote',out);}
}catch(e){errors.push(String(e?.stack||e));}
finally{await browser.close();server.close();}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
