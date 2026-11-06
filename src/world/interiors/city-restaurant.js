import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {buildAvatar} from '../../avatars/build.js';
import {createAvatarAnimator} from '../../avatars/animate.js';
import {normalizeRecipe} from '../../avatars/recipe.js';
import {recipeFor} from '../../avatars/cast.js';
import {CITY_RESTAURANT,DINNER_TALK} from './city-dinner.js';
export {CITY_RESTAURANT,DINNER_MENU,DINNER_TALK} from './city-dinner.js';

/**
 * レストラン 星空 (Hoshizora), on the top floor of a hotel off Kokusai-dōri in Naha: the
 * place Johansson takes Thuan when they go over to the big city on the evening ferry.
 *
 * It is a scene, not a room you walk about in. The camera is fixed (`fixedCamera`), the
 * way a Tomodachi-style game frames an outing: the table for two by the window, the two
 * of them side on, Naha's lights behind. What happens is chosen from the dinner menu
 * (activities.js, 'city-dinner'): order, eat, raise a glass, talk, take the last boat
 * home. Everything is drawn here; the uploaded restaurant model was a reference only.
 */
const SKY_W=2048,SKY_H=640;
/** Naha at night through the window: the hills, the hotel towers, the harbour and its lights. */
function paintSkyline(ctx){
 const sky=ctx.createLinearGradient(0,0,0,SKY_H);
 sky.addColorStop(0,'#0b1030');sky.addColorStop(.55,'#24245a');sky.addColorStop(.78,'#5a3a6a');sky.addColorStop(1,'#1a1830');
 ctx.fillStyle=sky;ctx.fillRect(0,0,SKY_W,SKY_H);
 let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<160;i++){ctx.fillStyle=`rgba(255,255,240,${.3+rnd()*.6})`;ctx.fillRect(rnd()*SKY_W,rnd()*SKY_H*.45,2,2);}
 ctx.fillStyle='#f7f0c8';ctx.beginPath();ctx.arc(SKY_W*.82,SKY_H*.16,26,0,Math.PI*2);ctx.fill();
 // Far hills, then the city in three depths, nearer ones bigger and brighter.
 ctx.fillStyle='#1b1a3a';ctx.beginPath();ctx.moveTo(0,SKY_H*.62);
 for(let x=0;x<=SKY_W;x+=64)ctx.lineTo(x,SKY_H*(.56+Math.sin(x*.004)*.04+Math.sin(x*.013)*.015));ctx.lineTo(SKY_W,SKY_H);ctx.lineTo(0,SKY_H);ctx.fill();
 for(const [base,hMax,wMax,shade,lit] of [[.7,.16,60,'#24264a',.35],[.78,.24,90,'#1c1d3a',.5],[.9,.36,130,'#141528',.65]]){
  let x=-20;
  while(x<SKY_W){
   const w=30+rnd()*wMax,h=SKY_H*(.05+rnd()*hMax),top=SKY_H*base-h;
   ctx.fillStyle=shade;ctx.fillRect(x,top,w,SKY_H-top);
   for(let wy=top+6;wy<SKY_H*base;wy+=9)for(let wx=x+4;wx<x+w-4;wx+=8)if(rnd()<lit){ctx.fillStyle=rnd()<.8?'#ffd98a':'#bfe6ff';ctx.fillRect(wx,wy,4,5);}
   if(rnd()<.12){ctx.fillStyle='#ff3a3a';ctx.fillRect(x+w/2-2,top-6,4,4);}
   x+=w+rnd()*8;
  }
 }
 // Neon on the near blocks: the signs of Kokusai-dōri.
 const neon=[["Hotel",'#ff6ab0'],["Karaoke",'#6af0ff'],["Steak",'#ffd24a'],['A&W','#ff8a3a'],["Naha",'#9aff8a'],["Pachinko",'#ff5a5a']];
 ctx.font='bold 34px "Hiragino Kaku Gothic ProN","Noto Sans CJK JP",sans-serif';ctx.textBaseline='middle';
 neon.forEach(([t,c],i)=>{const x=120+i*320+rnd()*80,y=SKY_H*(.62+rnd()*.12);ctx.shadowColor=c;ctx.shadowBlur=16;ctx.fillStyle=c;ctx.fillText(t,x,y);});
 ctx.shadowBlur=0;
 // The harbour along the bottom: dark water, the line of quay lights and a ferry.
 ctx.fillStyle='#0a0d1e';ctx.fillRect(0,SKY_H*.9,SKY_W,SKY_H*.1);
 for(let x=0;x<SKY_W;x+=14){ctx.fillStyle='#ffcf7a';ctx.fillRect(x,SKY_H*.9,5,3);ctx.fillStyle='rgba(255,207,122,.25)';ctx.fillRect(x+1,SKY_H*.91,3,18);}
 ctx.fillStyle='#e8e8ee';ctx.fillRect(SKY_W*.3,SKY_H*.875,160,16);ctx.fillRect(SKY_W*.3+100,SKY_H*.86,50,12);
 for(let i=0;i<10;i++){ctx.fillStyle='#ffe9a8';ctx.fillRect(SKY_W*.3+8+i*15,SKY_H*.88,6,5);}
}

function texture(w,h,paint){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

const WAITER_RECIPE={name:'Waiter',age:'adult',body:{height:.6,build:.4,skin:'#e3b48e'},head:{size:.44,shape:.5,form:'oval'},
 hair:{style:'sidepart',colour:'#14100c'},eyes:{style:'narrow',colour:'#2a1d16'},brows:{style:'straight',colour:'#14100c'},mouth:{style:'small'},
 outfit:{top:'jacket',topColour:'#f4f1ea',bottom:'trousers',bottomColour:'#1c1c1c',shoes:'#1c1c1c',accent:'#2a2a2a'},accessories:{neckwear:'none'}};

/**
 * Builds the restaurant into `room`. `johansson` is the player's recipe. Returns the
 * room layout plus `dinner`: what the dinner menu asks of the scene.
 */
export function buildCityRestaurant({room,reg,action,collider=()=>{},johansson=null}){
 const group=new THREE.Group();group.name='Restaurant Hoshizora';room.add(group);
 const mats=new Map(),mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.7,...o}));return mats.get(k);};
 const box=(size,pos,c,name,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c,o):c);m.position.set(...pos);m.receiveShadow=true;if(name)m.name=name;group.add(m);return m;};
 const cyl=(rt,rb,h,pos,c,name,seg=20)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),typeof c==='number'?mat(c):c);m.position.set(...pos);m.receiveShadow=true;if(name)m.name=name;group.add(m);return m;};
 const page=typeof document!=='undefined'&&!!document.createElement;
 const W=7.2,D=5.2,H=2.9,hw=W/2,hd=D/2,wood=0x3a2418,brass=0xc9a24a,red=0xb3303a;
 // Floor, ceiling, walls: dark walnut panelling, a deep red carpet, a coffered ceiling.
 box([W,.04,D],[0,-.02,0],0x5a1d24,'Carpet');
 box([W,.04,D],[0,H+.02,0],0x1c120d,'Ceiling');
 for(let x=-hw+.9;x<hw;x+=1.8)box([.08,.1,D],[x,H-.05,0],wood);
 for(const s of [-1,1]){box([.06,H,D],[s*(hw+.03),H/2,0],wood,'Panelling');for(let z=-hd+.6;z<hd;z+=1.2)box([.02,H-.6,.04],[s*(hw-.01),H/2,z],0x2a1810);}
 box([W,H,.06],[0,H/2,hd+.03],wood,'Back wall');
 // The window: the whole far wall, brass mullions and Naha behind it.
 const view=new THREE.Mesh(new THREE.PlaneGeometry(W,2.4),page?new THREE.MeshBasicMaterial({map:texture(SKY_W,SKY_H,paintSkyline),toneMapped:false}):new THREE.MeshBasicMaterial({color:0x24245a}));
 view.position.set(0,1.5,-hd-.4);view.name='Naha at night';view.userData.keepBasic=true;group.add(view);
 box([W,.3,.08],[0,.15,-hd],wood,'Window sill');box([W,.18,.08],[0,H-.09,-hd],wood);
 for(let x=-hw;x<=hw+.01;x+=1.2)box([.05,H-.3,.06],[x,H/2+.06,-hd],brass,'Mullion',{metalness:.6,roughness:.35});
 // The red handrail in front of the glass on its brass posts.
 box([W-.2,.07,.08],[0,.95,-hd+.3],red,'Handrail');for(let x=-hw+.4;x<hw;x+=1.4)box([.04,.95,.04],[x,.47,-hd+.3],brass,null,{metalness:.6,roughness:.35});
 // Brass wall lamps, each with a little pool of warm light.
 for(const s of [-1,1])for(const z of [-1.4,.6]){
  box([.1,.22,.12],[s*(hw-.08),1.9,z],brass,'Wall lamp',{metalness:.6,roughness:.35});
  cyl(.1,.06,.16,[s*(hw-.18),2.02,z],new THREE.MeshBasicMaterial({color:0xffd9a0}),'Lamp shade',10);
  const l=new THREE.PointLight(0xffc27a,.9,4,2);l.position.set(s*(hw-.4),2,z);group.add(l);
 }
 // A pendant over their table.
 cyl(.02,.02,.7,[0,H-.35,-.45],brass);cyl(.12,.26,.18,[0,H-.75,-.45],brass,'Pendant');
 const pendant=new THREE.PointLight(0xffd6a0,1.4,4.5,2);pendant.position.set(0,H-.95,-.45);group.add(pendant);
 group.add(new THREE.HemisphereLight(0x8a7aa8,0x3a1d18,.55));

 // The table for two: a round top under a white cloth, set for dinner.
 const T=[0,-.45],top=FURNITURE_HEIGHTS.table-.015;
 cyl(.5,.5,.03,[T[0],top,T[1]],0xf6f3ec,'Tablecloth',28);cyl(.52,.56,.3,[T[0],top-.16,T[1]],0xf2eee4,null,28);
 cyl(.05,.05,.44,[T[0],.22,T[1]],0x2a2a2a);cyl(.25,.28,.04,[T[0],.02,T[1]],0x2a2a2a);
 collider(T[0],T[1],1.05,1.05,.8);
 // The candle in its red glass, a hibiscus in a bud vase.
 cyl(.045,.04,.09,[T[0]+.05,top+.06,T[1]-.12],new THREE.MeshStandardMaterial({color:0xd8303a,transparent:true,opacity:.8,roughness:.2}),'Candle glass',12);
 const flame=cyl(.012,.0,.04,[T[0]+.05,top+.13,T[1]-.12],new THREE.MeshBasicMaterial({color:0xffd27a}),'Flame',6);
 const candle=new THREE.PointLight(0xffa24a,.8,2.2,2);candle.position.set(T[0]+.05,top+.25,T[1]-.12);group.add(candle);
 cyl(.02,.03,.16,[T[0]-.08,top+.09,T[1]-.2],new THREE.MeshStandardMaterial({color:0xcfe6ea,transparent:true,opacity:.6,roughness:.1}),'Bud vase',10);
 const flower=new THREE.Mesh(new THREE.IcosahedronGeometry(.04,0),mat(0xe0303a));flower.position.set(T[0]-.08,top+.2,T[1]-.2);flower.scale.set(1.3,.6,1.3);group.add(flower);
 // Two places, one either side: plate, napkin, cutlery, glass.
 const places=[-1,1].map(side=>{
  const x=T[0]+side*.3,z=T[1]+.02;
  cyl(.13,.11,.02,[x,top+.025,z],0xffffff,'Plate',24);
  box([.03,.008,.2],[x+side*.17,top+.02,z],0xc8c8cc,'Knife',{metalness:.7,roughness:.3});box([.03,.008,.18],[x-side*.17,top+.02,z],0xc8c8cc,'Fork',{metalness:.7,roughness:.3});
  box([.1,.05,.1],[x+side*.02,top+.05,z-.2],0xb3303a,'Napkin');
  const glass=new THREE.Group();glass.position.set(x-side*.06,top+.015,z-.2);group.add(glass);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.035,.025,.07,12),new THREE.MeshStandardMaterial({color:0xdfeff2,transparent:true,opacity:.45,roughness:.08}));bowl.position.y=.1;glass.add(bowl);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.07,6),bowl.material);stem.position.y=.035;glass.add(stem);
  const fill=new THREE.Mesh(new THREE.CylinderGeometry(.03,.024,.04,12),mat(0x6a1020,{roughness:.2}));fill.position.y=.09;fill.visible=false;glass.add(fill);
  // The food, hidden until it comes: one set of plates for the course, one for the steak.
  const course=new THREE.Group();course.position.set(x,top+.04,z);course.visible=false;group.add(course);
  for(const [dx,dz,c,s] of [[-.04,-.03,0x7a3a1c,.035],[.04,-.02,0x7a3a1c,.035],[0,.05,0x5aa24a,.03],[.05,.05,0xf2d0b0,.025]]){const b=new THREE.Mesh(new THREE.BoxGeometry(s*1.6,s,s*1.6),mat(c));b.position.set(dx,.02,dz);course.add(b);}
  const steak=new THREE.Group();steak.position.set(x,top+.04,z);steak.visible=false;group.add(steak);
  {const iron=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.02,16),mat(0x2a2a2a,{roughness:.5}));steak.add(iron);
   const meat=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,.08),mat(0x6a3018));meat.position.set(-.02,.025,0);steak.add(meat);
   const rice=new THREE.Mesh(new THREE.IcosahedronGeometry(.04,0),mat(0xf0e2b0));rice.position.set(.06,.03,.03);rice.scale.y=.6;steak.add(rice);
   const corn=new THREE.Mesh(new THREE.BoxGeometry(.04,.015,.04),mat(0xf2c83a));corn.position.set(.05,.02,-.05);steak.add(corn);}
  return {course,steak,fill};
 });
 // The chairs: dark wood with red seats, turned a little toward the room.
 const seats=[[-.68,-.4,Math.PI/2-.35],[.68,-.4,-Math.PI/2+.35]];
 for(const [x,z,ry] of seats){
  const chair=new THREE.Group();chair.position.set(x,0,z);chair.rotation.y=ry;group.add(chair);
  const add=(size,pos,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...pos);chair.add(m);};
  add([.46,.08,.44],[0,.44,0],red);add([.46,.62,.06],[0,.78,-.22],wood);for(const [dx,dz] of [[-.2,-.19],[.2,-.19],[.2,.19],[-.2,.19]])add([.04,.42,.04],[dx,.21,dz],wood);
 }
 // The other tables, set and candle-lit, and the piano in the corner.
 for(const [x,z] of [[-2.5,-1.2],[2.5,-1.2],[-2.3,.9]]){
  cyl(.42,.42,.03,[x,top,z],0xf6f3ec,'Table',24);cyl(.44,.48,.28,[x,top-.15,z],0xf2eee4,null,24);
  cyl(.035,.03,.07,[x,top+.05,z],new THREE.MeshStandardMaterial({color:0xd8303a,transparent:true,opacity:.8}),null,10);
  for(const s of [-1,1])box([.42,.08,.4],[x+s*.6,.44,z],red);
  collider(x,z,1.9,1,.8);
 }
 box([1.5,.95,.6],[2.4,.48,1.5],0x0d0d0f,'Piano',{roughness:.25});box([1.5,.05,.25],[2.4,.97,1.3],0xf4f1ea);box([1.5,.06,.04],[2.4,.94,1.17],0x111111);
 collider(2.4,1.5,1.6,.7,1);

 // The people: the two of them at the table, and the waiter by the piano.
 const people=[];
 const seat=(recipe,[x,z,ry],seatHeight)=>{
  if(!page||!recipe)return null;
  const avatar=buildAvatar(normalizeRecipe(recipe),{shadows:true,faceSize:128});
  const holder=new THREE.Group();holder.position.set(x,0,z);holder.rotation.y=ry;avatar.root.rotation.y=0;holder.add(avatar.root);group.add(holder);
  const person={avatar,animator:createAvatarAnimator(avatar),holder,seatHeight,seated:seatHeight!=null,expression:'smile',talking:0};people.push(person);return person;
 };
 const him=seat(johansson||recipeFor('Johansson'),seats[0],.48);
 const her=seat(recipeFor('Thuan'),seats[1],.48);
 const waiter=seat(WAITER_RECIPE,[1.8,-1.05,-Math.PI/2+.4],null);
 const headOf=p=>p?new THREE.Vector3().setFromMatrixPosition(p.holder.matrixWorld).add(new THREE.Vector3(0,1.15,0)):null;

 // The dinner: what has been ordered and what the scene should be doing.
 const state={dish:null,drink:null,eaten:0,talks:0,toasts:0,presentation:null};
 let dinnerTime=0,nextPresentation=Infinity,presentationUntil=0,presentationPlate=null;
 const clearPresentation=()=>{presentationPlate?.removeFromParent();presentationPlate=null;state.presentation=null;if(state.dish)places[1][state.dish==='course'?'course':'steak'].visible=true;};
 const present=gesture=>{if(!her||!state.dish)return;clearPresentation();state.presentation=gesture;presentationUntil=dinnerTime+(gesture==='SitEnjoyFood'?3.8:4.2);her.animator.play(gesture);her.expression='smile';if(gesture==='SitPresentFood'){const source=places[1][state.dish==='course'?'course':'steak'];presentationPlate=source.clone();presentationPlate.position.set(0,0,0);presentationPlate.name='Thuan presents her actual dinner';presentationPlate.visible=true;if(state.dish==='course'){const plate=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.02,24),mat(0xffffff));presentationPlate.add(plate);}group.add(presentationPlate);source.visible=false;}};
 const play=(p,g)=>p?.animator.play(g);
 const dinner={
  state,
  serve(item){
   if(item.dish){clearPresentation();state.dish=item.dish;state.eaten=0;places.forEach(pl=>{pl.course.visible=item.dish==='course';pl.steak.visible=item.dish==='steak';pl.course.scale.setScalar(1);pl.steak.scale.setScalar(1);});}
   if(item.drink){state.drink=item.drink;places.forEach(pl=>{pl.fill.visible=true;pl.fill.material=mat(item.drink==='wine'?0x6a1020:0xe8d8a0,{roughness:.2});});}
   play(waiter,'Bow');if(item.dish){present('SitEnjoyFood');nextPresentation=dinnerTime+10;}else if(her)her.expression='smile';
  },
  eat(){
   if(!state.dish)return false;clearPresentation();nextPresentation=dinnerTime+30;
   state.eaten=Math.min(3,state.eaten+1);const k=1-state.eaten/3*.85;
   places.forEach(pl=>{(state.dish==='course'?pl.course:pl.steak).scale.setScalar(k);});
   play(him,'SitEat');setTimeout(()=>play(her,'SitEat'),500);
   if(state.eaten>=3){state.dish=null;setTimeout(()=>places.forEach(pl=>{pl.course.visible=false;pl.steak.visible=false;}),2400);}
   return true;
  },
  toast(){
   if(!state.drink)return false;clearPresentation();nextPresentation=dinnerTime+25;state.toasts++;
   play(him,'SitToast');play(her,'SitToast');if(her)her.expression='laugh';return true;
  },
  talk(){
   const line=DINNER_TALK[state.talks%DINNER_TALK.length];state.talks++;
   if(her){her.talking=4;if(state.dish&&state.talks%3===0){present('SitEnjoyFood');nextPresentation=dinnerTime+30;}else setTimeout(()=>play(her,state.talks%2?'Laugh':'Nod'),1800);}
   if(him)him.talking=2;return line;
  },
 };
 let time=0;
 const tick=(dt)=>{
  dt=Math.min(.1,dt||0);time+=dt;dinnerTime+=dt;
  if(state.presentation&&dinnerTime>=presentationUntil)clearPresentation();
  if(state.dish&&!state.presentation&&dinnerTime>=nextPresentation&&!her?.animator.gesture){present('SitPresentFood');nextPresentation=dinnerTime+45;}
  candle.intensity=.75+Math.sin(time*13)*.06+Math.sin(time*7.3)*.05;flame.scale.y=1+Math.sin(time*11)*.15;
  group.updateMatrixWorld();
  const a=headOf(him),b=headOf(her);
  for(const p of people){
   p.talking=Math.max(0,p.talking-dt);
   p.animator.update(dt,{speed:0,seated:p.seated,seatHeight:p.seatHeight??undefined,expression:p.expression,talking:p.talking>0,
    gaze:p===her&&state.presentation?new THREE.Vector3(0,1.5,2.35):p===him?b:a});
  }
  if(presentationPlate&&her){her.holder.updateMatrixWorld(true);const left=her.avatar.bones.handL.getWorldPosition(new THREE.Vector3()),right=her.avatar.bones.handR.getWorldPosition(new THREE.Vector3());presentationPlate.position.copy(group.worldToLocal(left.add(right).multiplyScalar(.5))).add(new THREE.Vector3(0,.04,0));}
 };
 tick(0);
 // One thing to do from where you sit: the dinner itself.
 const anchor=new THREE.Object3D();anchor.position.set(0,1,.25);group.add(anchor);
 reg(anchor,'Dinner with Thuan',()=>action('city-dinner',CITY_RESTAURANT.title,dinner),true);
 const shot={pos:[0,1.5,2.35],at:[0,.95,-.75]};
 return {
  bounds:{minX:-.3,maxX:.3,minZ:.6,maxZ:1.2},spawn:[0,0,.9],exit:[0,1.1,hd-.04],yaw:0,
  fixedCamera:shot,restaurant:true,dinner,tick,noDoorway:true,
 };
}
