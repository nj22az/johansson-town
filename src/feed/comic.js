import * as THREE from '../../vendor/three.module.js';
import {buildAvatar} from '../avatars/build.js';
import {loadHatModels} from '../catalog/hat-models.js';
import {createAvatarAnimator,GESTURES} from '../avatars/animate.js';
import {recipeFor} from '../avatars/cast.js';
import {drawBackground,drawFaceFx,drawSfx} from './manga-fx.js';
import {feedPlace} from './places.js';
import {buildServingDrink} from '../people/izakaya-serving-visuals.js';
import {fitAvatarHeldProp,poseAvatarConsumption} from '../avatars/consume.js';

/**
 * Draws the storyteller's comics in the browser, as a Sunday funny page: rounded panels in a
 * grid. Every panel is shot inside the real place, in 3D: the room or street is built from the
 * game's own builders (src/scene/scene-world.js, the same 3D locations Johansson Studio uses),
 * the residents (live avatar recipes, posed by the photo studio's animator) stand on its floor,
 * clear of its furniture by its own colliders, and one render draws them together, with the
 * room's light and real shadows, so a counter in front hides them and nothing passes through
 * them. The camera views captured by tools/render-feed-backdrops.mjs (views.json) frame each
 * shot. If a place cannot be built, the panel falls back to the captured picture and its depth.
 * Bubbles, marks and sound effects go on top.
 */
const PAGE=1080,GAP=18,RADIUS=22,INK='#111';
const FONT='Figtree,"LINE Seed JP","Noto Sans JP","Hiragino Sans",system-ui,sans-serif';
const VIEW_W=1600,VIEW_H=1200;
let renderer=null,views=null;const images=new Map();

export function releaseComicRenderer(){renderer?.dispose();renderer?.forceContextLoss();renderer=null;}

/**
 * The real place in 3D. The island (every street) is built once and kept, as Studio keeps it;
 * a room is built for its strip and disposed after.
 */
let townData=null;
async function buildPlace(place,base){
 const views=await placeViews(base);if(!views[place])return null;
 const {buildSceneWorld}=await import('../scene/scene-world.js');
 const world=await buildSceneWorld(place,views,townData);townData=world.townData||townData;
 // The Minato Maru lies alongside the town berth, as she was when the views were captured (a
 // fresh island has her out at sea): the ferry's own panels, the pier and the harbour show her.
 if(world.townData)world.townData.world?.ferry?.parkAt?.('town');
 // The room's floor takes the residents' shadows (a street's already does).
 if(!world.townData)for(const m of world.meshes)m.receiveShadow=true;
 await texturesLoaded(world.scene);return world;
}

/**
 * Waits for the place's textures: a prop whose picture is still on its way draws black. Each
 * map that has no image yet is waited for (it gets one when it loads), at most `limit` ms.
 */
async function texturesLoaded(scene,limit=20000){
 const end=performance.now()+limit,waiting=()=>{let n=0;scene.traverse(o=>{if(!o.isMesh||!o.visible)return;for(const m of [].concat(o.material||[]))for(const k of ['map','emissiveMap','alphaMap'])if(m?.[k]&&!m[k].image)n++;});return n;};
 while(waiting()&&performance.now()<end)await new Promise(r=>setTimeout(r,100));
 if(waiting())console.warn('Comic set: some textures did not load in time');
}
function context(w,h){
 if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
 renderer.setSize(w,h,false);return renderer;
}
const load=url=>{if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Missing comic set: '+url));img.src=url;}));return images.get(url);};
async function placeViews(base){views??=fetch(base+'assets/images/feed/views.json').then(r=>r.ok?r.json():{}).catch(()=>({}));return views;}

/** Poses a resident: a gesture, standing or (with a seat height) seated, the legs kept on the seat (and, with the seat's
 *  front edge, the shins hanging in front of it: animate.js seatFront). */
function pose(avatar,name,expression,seatHeight=null,seatFront){
 const animator=createAvatarAnimator(avatar),duration=GESTURES[name],time=Number.isFinite(duration)?duration*.43:.7,seated=name==='Sit'||seatHeight!=null;
 if(duration)animator.play(name);
 const steps=Math.max(1,Math.ceil(time/.025));
 for(let i=0;i<steps;i++)animator.update(time/steps,{expression,seated,seatHeight:seatHeight??.48,seatFront});
 avatar.paintFace({expression,blink:0,talk:0,look:[0,0]});
}

/** Wraps at spaces; a word longer than the line is broken only as a last resort. */
function wrap(ctx,text,maxW,maxLines){
 const lines=[];let line='';
 for(const word of String(text).split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width<=maxW||!line){line=next;continue;}lines.push(line);line=word;}
 if(line)lines.push(line);
 if(lines.length>maxLines){const kept=lines.slice(0,maxLines);kept[maxLines-1]=kept[maxLines-1].replace(/\s*\S*$/,'')+'…';return kept;}
 return lines;
}
/** A speech bubble with its tail on the speaker, or a narration box when nobody speaks. */
function bubble(ctx,text,w,h,{x,y,maxW,tx=null,ty=null}){
 if(!text)return;
 const size=w<420?19:22;ctx.font=`700 ${size}px ${FONT}`;
 const lh=size*1.32,lines=wrap(ctx,text,maxW,4),bw=Math.max(...lines.map(l=>ctx.measureText(l).width))+32,bh=lines.length*lh+22;
 const left=Math.max(10,Math.min(w-bw-10,x-bw/2)),top=Math.max(10,y);
 ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.fillStyle='#fff';
 ctx.beginPath();ctx.roundRect(left,top,bw,bh,tx==null?8:22);ctx.fill();ctx.stroke();
 if(tx!=null&&ty>top+bh+8){
  const bx=Math.max(left+24,Math.min(left+bw-24,tx)),by=top+bh,tipY=Math.min(ty,by+52);
  ctx.beginPath();ctx.moveTo(bx-12,by-2);ctx.lineTo(tx,tipY);ctx.lineTo(bx+12,by-2);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(bx-12,by);ctx.lineTo(tx,tipY);ctx.lineTo(bx+12,by);ctx.stroke();
 }
 ctx.fillStyle=INK;ctx.textBaseline='middle';ctx.textAlign='left';
 lines.forEach((line,i)=>ctx.fillText(line,left+16,top+11+lh/2+i*lh));
}

/**
 * The Sunday page: establishing shots and stares take a whole row, the rest share rows of two,
 * or three when a run of panels is odd.
 */
export function pageLayout(panels){
 const full=p=>p.shot==='wide'||p.shot==='eyes';
 const rows=[];let run=[];
 const flush=()=>{while(run.length){const n=run.length===3||run.length===5?3:run.length===1?1:2;rows.push(run.splice(0,n));}};
 panels.forEach((p,i)=>{if(full(p)){flush();rows.push([i]);}else run.push(i);});flush();
 const cells=[];let y=GAP;
 for(const row of rows){
  const one=panels[row[0]],h=row.length===1?(one.shot==='eyes'?240:410):row.length===2?440:360,w=(PAGE-GAP*(row.length+1))/row.length;
  row.forEach((index,k)=>cells[index]={x:Math.round(GAP+k*(w+GAP)),y,w:Math.round(w),h});
  y+=h+GAP;
 }
 return {width:PAGE,height:y,cells};
}

/** Draws the room's depth (and nothing else) so the residents are hidden behind what is in front of them. */
function depthPass(r,camera,depthTex,data){
 const view=camera.view;
 const m=new THREE.ShaderMaterial({uniforms:{tex:{value:depthTex},far:{value:data.depthFar},near:{value:camera.near},cfar:{value:camera.far},
   offset:{value:new THREE.Vector4(view.offsetX/view.fullWidth,1-(view.offsetY+view.height)/view.fullHeight,view.width/view.fullWidth,view.height/view.fullHeight)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D tex;uniform float far,near,cfar;uniform vec4 offset;varying vec2 vUv;void main(){vec2 uv=offset.xy+vUv*offset.zw;vec4 c=texture2D(tex,uv);float z=(c.r*255.*256.+c.g*255.)/65535.*far;gl_FragDepth=z>=far*.999?1.:clamp((1./near-1./z)/(1./near-1./cfar),0.,1.);gl_FragColor=vec4(0.);}',
  // The test stays on, always passing: with it off, WebGL writes no depth at all.
  colorWrite:false,depthWrite:true,depthTest:true,depthFunc:THREE.AlwaysDepth});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),m),scene=new THREE.Scene();quad.frustumCulled=false;scene.add(quad);
 r.render(scene,new THREE.Camera());quad.geometry.dispose();m.dispose();
}

/**
 * Where the residents stand or sit in a place, once per strip so every panel agrees. Standing:
 * open floor a conversation apart near the middle of the pushed-in view. Sitting: the game's
 * own seats (a stool at the counter, the bench, the sofa), only those a sitter faces the
 * camera from, two a conversation apart; with one seat free the other resident stands by.
 * A seated mark is the seat's floor point with {height, yaw}; a standing one has seat null.
 */
export function blocking(set,count,seed,sitting=false,clear=null){
 // Seated, the reference is the wide view, which the seats are captured from; standing, the
 // pushed-in view most panels use. A panel whose own view loses someone falls back to a view
 // that has everyone (drawSetPanel).
 if(sitting&&set.wide){const marks=arrange(set,set.wide,count,seed,true,clear);if(marks.length>=count&&marks.some(m=>m.seat))return marks;}
 return arrange(set,set.push||set.wide,count,seed,false,clear);
}

function arrange(set,view,count,seed,sitting,clear){
 let s=seed;const rand=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const camera=sceneCamera(view),cam=camera.position;
 const onScreen=(x,y,z)=>{const q=new THREE.Vector3(x,y,z).project(camera);return q.z<1&&Math.abs(q.x)<.8&&q.y>-1&&q.y<.6?q:null;};
 const stands=[],keys=new Set();
 for(const v of Object.values(set))for(const a of v.spots?.stand||[]){const key=Math.round(a[0]/.4)+','+Math.round(a[2]/.4);if(keys.has(key))continue;keys.add(key);
  const q=onScreen(a[0],a[1],a[2]),d=Math.hypot(a[0]-cam.x,a[2]-cam.z);if(q&&d>2&&d<6&&(!clear||clear(a[0],a[1],a[2])))stands.push({x:a[0],y:a[1],z:a[2],sx:(q.x+1)/2,d});}
 const seats=[];keys.clear();
 if(sitting)for(const v of Object.values(set))for(const t of v.seats||[]){
  const [x,y,z]=t.position,key=x.toFixed(2)+','+z.toFixed(2),height=t.surfaceY-y;if(keys.has(key))continue;keys.add(key);
  // A chair, stool, bench or sofa; not a floor cushion, nor a seat on a counter.
  if(!(height>.3&&height<.8))continue;
  // Far enough off to see the whole sitter, and facing the camera at least half-way: no backs
  // of heads, no profile filling the panel.
  const d=Math.hypot(cam.x-x,cam.z-z),q=onScreen(x,t.surfaceY,z);if(!q||d<2.2)continue;
  const face=(-Math.sin(t.yaw)*(cam.x-x)-Math.cos(t.yaw)*(cam.z-z))/(d||1);
  if(face<.3)continue;
  seats.push({x,y,z,sx:(q.x+1)/2,d,face,seat:{height,yaw:t.yaw,front:t.front}});
 }
 const good=a=>Math.abs(a.d-3.2)+Math.abs(a.sx-.5)*2-(a.seat?a.face*.6:0);
 stands.sort((a,b)=>good(a)-good(b));seats.sort((a,b)=>good(a)-good(b));
 const pick=[];
 if(seats.length){
  // Two seats a conversation apart: neighbours along a counter or bench, or across a table.
  const pairs=[];
  for(const a of seats.slice(0,10))for(const b of seats){const d=Math.hypot(a.x-b.x,a.z-b.z);if(a!==b&&d>.55&&d<2.2&&Math.abs(a.sx-b.sx)>.08)pairs.push([a,b,good(a)+good(b)+Math.abs(d-1)*.5]);}
  pairs.sort((p,q)=>p[2]-q[2]);
  if(count>1&&pairs.length){const [a,b]=pairs[Math.floor(rand()*Math.min(2,pairs.length))];pick.push(...(a.sx<b.sx?[a,b]:[b,a]));}
  else pick.push(seats[Math.floor(rand()*Math.min(2,seats.length))]);
 }
 // Never closer than a person's width to anyone; near a seat, close enough to be talking to it.
 const apart=spot=>pick.every(p=>Math.hypot(p.x-spot.x,p.z-spot.z)>.6);
 const near=pick.length?1.8:2.4;
 const fits=(spot,min)=>pick.every(p=>{const d=Math.hypot(p.x-spot.x,p.z-spot.z);return d>min&&d<near&&Math.abs(p.sx-spot.sx)>.13&&Math.abs(p.d-spot.d)<1.2;});
 for(const min of [1,.8,.6])for(const spot of stands){if(pick.length>=count)break;if(fits(spot,min))pick.push(spot);}
 // No spot a conversation apart in the ideal band: the nearest open spot to the people already
 // placed, about an arm's length beyond a person's width, not the best-framed spot anywhere.
 // Side by side on screen first (one behind the other hides a face), then the nearest.
 const gap=spot=>pick.length?Math.min(...pick.map(p=>Math.abs(Math.hypot(p.x-spot.x,p.z-spot.z)-1.2)+(Math.abs(p.sx-spot.sx)<.12?10:0))):0;
 for(const spot of [...stands].sort((a,b)=>gap(a)-gap(b))){if(pick.length>=count)break;if(apart(spot))pick.push(spot);}
 return pick.map(p=>({x:p.x,y:p.y,z:p.z,seat:p.seat||null}));
}

const VIEWS={wide:'wide',medium:'push',close:'push',low:'low',high:'high',dutch:'push','close-thing':'push'};

function sceneCamera(data){
 const c=new THREE.PerspectiveCamera(data.camera.fov,data.camera.aspect,.1,200);
 c.position.fromArray(data.camera.position);c.quaternion.fromArray(data.camera.quaternion);c.updateMatrixWorld(true);return c;
}

/** Renders a strip ({panels, place}) as one Sunday-page image; returns a data URL. */
export async function renderComic({panels,place,props={},sitting=false},{base='./',quality=.86}={}){
 // The lettering is set in the interface face; wait for it so the first page is not in a fallback.
 try{await Promise.all(['700 22px','800 40px'].map(f=>document.fonts?.load(f+' Figtree,"LINE Seed JP"','āēīōū Aa')));}catch{}
 // The hats from World's catalogue (Johansson's trucker cap) before anyone is built, so they wear them and not the stand-in.
 await loadHatModels();
 const set=(await placeViews(base))[place];
 const layout=pageLayout(panels);
 const page=document.createElement('canvas');page.width=layout.width;page.height=layout.height;
 const out=page.getContext('2d');out.fillStyle='#fff';out.fillRect(0,0,page.width,page.height);
 const names=[...new Set(panels.flatMap(p=>p.actors.map(a=>a.name)))];
 const cast=new Map(names.map(name=>{const avatar=buildAvatar(recipeFor(name),{shadows:true,faceSize:512}),holder=new THREE.Group();holder.add(avatar.root);avatar.root.rotation.y=0;return [name,{avatar,holder}];}));
 const seed=[...place+names.join()].reduce((a,c)=>(a*31+c.charCodeAt(0))%2147483647,7)||7;
 // Everyone keeps their spot for the whole strip; a resident who walks in late gets one of their own.
 let world=null;
 if(set)try{world=await buildPlace(place,base);}catch(error){console.warn('Comic set',place,'drawn from its picture:',error.message);}
 // Standing spots only where a whole person fits: the place's own colliders when it is built
 // (arms out, so a little wider than a body), else every captured view's depth.
 // and, in the 3D place, where the main view sees them whole: not behind a ring of stones or a
 // quay block from the knees down.
 const seenAt=world&&set?(x,y,z)=>{const view=set.push||set.wide;return inSightOf(view,world,[{mark:{x,y:world.floor(x,z),z,seat:null}}]);}:null;
 const clear=world?(x,y,z)=>!world.blocked(x,z,.32)&&seenAt(x,y,z):roomToStand(set?await Promise.all(Object.entries(set).map(async([name,view])=>({view,px:pixelsOf(await load(`${base}assets/images/feed/${place}-${name}-depth.webp`))}))):[]);
 const marks=set?blocking(set,names.length,seed,sitting,clear)?.map(m=>world&&!m.seat?{...m,y:world.floor(m.x,m.z)}:m):null,markOf=new Map(names.map((n,j)=>[n,marks?.[j]??null]));
 try{
  for(const [i,p] of panels.entries()){
   const cell=layout.cells[i],w=cell.w,h=cell.h;
   const panel=document.createElement('canvas');panel.width=w;panel.height=h;const ctx=panel.getContext('2d');
   const shot=p.shot||'medium',scene=new THREE.Scene();
   const actors=p.actors.map(a=>({...a,...cast.get(a.name),mark:markOf.get(a.name),drink:props[a.name]||null}));
   if(world&&shot!=='eyes'&&actors.every(a=>a.mark))drawWorldPanel({ctx,w,h,set,world,p,shot,actors,i,minutes:feedPlace(place)?.shot?.time??720});
   else if(set&&shot!=='eyes'&&actors.every(a=>a.mark))await drawSetPanel({ctx,w,h,set,p,shot,actors,scene,base,place,i});
   else await drawStudioPanel({ctx,w,h,p,shot,actors,scene,base,place,i});
   // A rounded panel with an ink border, set into the page.
   out.save();out.beginPath();out.roundRect(cell.x,cell.y,w,h,RADIUS);out.clip();out.drawImage(panel,cell.x,cell.y);out.restore();
   out.lineWidth=4;out.strokeStyle=INK;out.beginPath();out.roundRect(cell.x+2,cell.y+2,w-4,h-4,RADIUS-2);out.stroke();
  }
 }finally{
  for(const c of cast.values()){c.holder.removeFromParent();c.avatar.body.skeleton.dispose();c.avatar.dispose();}
  if(world&&!world.townData)world.dispose();
  renderer?.renderLists.dispose();
 }
 return page.toDataURL('image/webp',quality);
}

const depthPixels=new WeakMap();
function pixelsOf(depthImg){
 let px=depthPixels.get(depthImg);
 if(!px){const c=document.createElement('canvas');c.width=depthImg.width;c.height=depthImg.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(depthImg,0,0);px={w:c.width,h:c.height,data:g.getImageData(0,0,c.width,c.height).data};depthPixels.set(depthImg,px);}
 return px;
}

/**
 * Room for a whole person at a standing spot: nothing in the room (a table edge, a sofa, a
 * shelf, a hull) passes through the body or its reach. Every captured view of the place is
 * asked: points round a body-sized column (BODY m across the shoulders, from the knees to the
 * crown) are projected into the view, and if the room's surface at that pixel lies inside the
 * column's depth there, something is where the person would be. Above knee height, so the
 * floor behind the feet never counts.
 */
const BODY=.36,REACH=.12;
export function roomToStand(depths){
 return (x,y,z)=>{
  for(const {view,px} of depths){
   const camera=sceneCamera(view),far=view.camera.depthFar,c=new THREE.Vector3(x,y+.9,z);
   const centre=-c.clone().applyMatrix4(camera.matrixWorldInverse).z;
   for(const up of [.45,.75,1.05,1.35,1.6])for(let k=0;k<12;k++){
    const a=k/12*Math.PI*2,r=BODY+REACH,v=new THREE.Vector3(x+Math.cos(a)*r*(k%2?.6:1),y+up,z+Math.sin(a)*r*(k%2?.6:1)),q=v.clone().project(camera);
    if(!(q.z<1&&Math.abs(q.x)<1&&Math.abs(q.y)<1))continue;
    const i=(Math.min(px.h-1,Math.round((1-q.y)/2*px.h))*px.w+Math.min(px.w-1,Math.round((q.x+1)/2*px.w)))*4,scene=(px.data[i]*256+px.data[i+1])/65535*far;
    if(scene>=far*.999)continue;
    // The room's surface sits inside the column (between its near and far side, with the reach).
    if(scene>centre-r&&scene<centre+r)return false;
   }
  }
  return true;
 };
}
/**
 * Whether a view shows everyone: each resident inside the picture, head and body not hidden
 * behind the room (a quay block, a counter, a tabletop seen from below). Read from the view's
 * captured depth: a point is in sight when nothing in the room is nearer the camera.
 */
async function inSight(view,depthImg,actors){
 const px=pixelsOf(depthImg);
 const camera=sceneCamera(view),far=view.camera.depthFar;
 const seen=v=>{const q=v.clone().project(camera);if(!(q.z<1&&Math.abs(q.x)<.92&&q.y>-1.02&&q.y<.95))return null;
  const x=Math.min(px.w-1,Math.round((q.x+1)/2*px.w)),y=Math.min(px.h-1,Math.round((1-q.y)/2*px.h)),i=(y*px.w+x)*4;
  const scene=(px.data[i]*256+px.data[i+1])/65535*far,depth=-v.clone().applyMatrix4(camera.matrixWorldInverse).z;
  return scene>=far*.999||scene>depth-.12;};
 return actors.every(a=>{
  // Heights of the crown, then what must show: the face and chest, and standing, the knees
  // too (someone sitting at a table is fine with their legs under it; someone standing is not
  // to be cut off at the waist by a quay block).
  const m=a.mark,[crown,...shown]=m.seat?[1.25,1.05,m.seat.height+.38]:[1.55,1.4,1,.5];
  // In the picture from feet to crown, and those parts in sight.
  if(seen(new THREE.Vector3(m.x,m.y,m.z))===null||seen(new THREE.Vector3(m.x,m.y+crown,m.z))===null)return false;
  return shown.every(up=>seen(new THREE.Vector3(m.x,m.y+up,m.z)));
 });
}

/** A panel inside the captured room: backdrop, depth, residents on their spots, then the lettering. */
async function drawSetPanel({ctx,w,h,set,p,shot,actors,scene,base,place,i}){
 // The shot's own view if everyone is in it and in sight; else the nearest view where they are.
 const wanted=set[VIEWS[shot]]?VIEWS[shot]:set.push?'push':'wide';
 let viewName=wanted;
 for(const name of [...new Set([wanted,'push','wide','high','low'])])if(set[name]&&await inSight(set[name],await load(`${base}assets/images/feed/${place}-${name}-depth.webp`),actors)){viewName=name;break;}
 const data=set[viewName];
 const [img,depthImg]=await Promise.all([load(`${base}assets/images/feed/${place}-${viewName}.webp`),load(`${base}assets/images/feed/${place}-${viewName}-depth.webp`)]);
 const camera=sceneCamera(data),show=shot!=='close-thing';
 // Stage the residents on their marks, turned towards the camera and a little towards each other.
 for(const a of actors){
  // Someone on a seat stays on it: the animator keeps the legs on the seat for any gesture.
  a.at=a.mark;a.seated=!!a.mark.seat;
 }
 for(const a of actors){
  const at=a.at;a.holder.position.set(at.x,at.y,at.z);
  const others=actors.filter(b=>b!==a),toCam=Math.atan2(camera.position.x-at.x,camera.position.z-at.z);
  const toOther=others.length?Math.atan2(others.reduce((t,b)=>t+b.at.x,0)/others.length-at.x,others.reduce((t,b)=>t+b.at.z,0)/others.length-at.z):toCam;
  const wrap=v=>Math.atan2(Math.sin(v),Math.cos(v)),clamp=(v,m)=>Math.max(-m,Math.min(m,v));
  if(a.seated){
   // The way the seat faces (the game's yaw; these avatars face +Z, the game's -Z), swivelled
   // a little: towards the camera for a close-up, towards the other person otherwise.
   const ahead=a.mark.seat.yaw+Math.PI,want=shot==='close'&&a.name===p.focus||!others.length?toCam:toOther;
   a.holder.rotation.y=ahead+clamp(wrap(want-ahead),.35);
   pose(a.avatar,a.pose&&a.pose!=='Idle'?a.pose:'Sit',a.expression,a.mark.seat.height,a.mark.seat.front);
  }else{
   // In conversation they face each other, opened a little to the camera, as on a stage.
   // A close-up is on a face, so its subject turns to the camera; the rest face each other.
   const turn=others.length?wrap(toOther-toCam):0,facing=shot==='close'&&a.name===p.focus?.3:.78;
   a.holder.rotation.y=others.length?toCam+clamp(turn*facing,1.15):toCam;
   pose(a.avatar,a.pose,a.expression);
  }
  if(show)scene.add(a.holder);
 }
 scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());
 holdDrinks(actors,i);
 scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());
 // Frame the panel round the residents (or the focus) inside the captured view: each shot
 // wants the people a certain size in the panel, whatever the view's distance.
 const heads=actors.map(headOf),focus=heads[Math.max(0,actors.findIndex(a=>a.name===p.focus))];
 const px=v=>{const q=v.clone().project(camera);return [(q.x+1)/2*VIEW_W,(1-q.y)/2*VIEW_H];};
 const feet=actors.map(a=>px(new THREE.Vector3(a.at.x,a.at.y,a.at.z))),crowns=heads.map(hd=>px(hd.top));
 const tall=Math.max(40,...actors.map((a,j)=>feet[j][1]-crowns[j][1])),faceH=Math.max(20,px(focus.top.clone().setY(focus.top.y-focus.size))[1]-px(focus.top)[1]);
 let ch={wide:tall/.38,medium:tall/.72,low:tall/.66,high:tall/.62,dutch:tall/.72,close:faceH/.48,'close-thing':VIEW_H/2.6}[shot]||tall/.7;
 const left=Math.min(...crowns.map(c=>c[0])),right=Math.max(...crowns.map(c=>c[0]));
 // Everyone in the picture: a shot of two people standing apart widens until both fit, a
 // shoulder's width either side, rather than cutting one of them off at the panel's edge.
 if(shot!=='close'&&shot!=='close-thing'&&actors.length>1)ch=Math.max(ch,(right-left+tall*.7)*h/w);
 ch=Math.min(VIEW_H,Math.max(VIEW_H/4.2,ch));let cw=ch*w/h;if(cw>VIEW_W){cw=VIEW_W;ch=cw*h/w;}
 let cx=VIEW_W*(.3+((i*37)%40)/100),cy=VIEW_H*.5;
 if(shot==='close'){const c=px(focus.centre);cx=c[0];cy=c[1]+ch*.12;}
 else if(shot!=='close-thing'){cx=(left+right)/2;const top=Math.min(...crowns.map(c=>c[1])),bottom=Math.max(...feet.map(f=>f[1]));cy=shot==='wide'?(top+bottom)/2+ch*.05:top+ch*.5-ch*.2;}
 const ox=Math.max(0,Math.min(VIEW_W-cw,cx-cw/2)),oy=Math.max(0,Math.min(VIEW_H-ch,cy-ch/2));
 camera.setViewOffset(VIEW_W,VIEW_H,ox,oy,cw,ch);camera.updateProjectionMatrix();
 // The backdrop: the same part of the captured picture, softened for close shots.
 const layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d');
 const k=img.width/VIEW_W;if(shot==='close')lc.filter='blur(3px)';lc.drawImage(img,ox*k,oy*k,cw*k,ch*k,0,0,w,h);lc.filter='none';
 // Light the residents in the colour of the room.
 const tone=averageColour(lc,w,h);
 scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(.7+tone[0]*.55,.7+tone[1]*.55,.7+tone[2]*.55),0x6a5a48,2.1));
 const key=new THREE.DirectionalLight(0xfff2e0,2.2);key.position.copy(camera.position).add(new THREE.Vector3(1.5,2.5,0));key.target.position.set(actors.reduce((t,a)=>t+a.at.x,0)/actors.length,0,actors.reduce((t,a)=>t+a.at.z,0)/actors.length);scene.add(key,key.target);
 const tops=show?heads.map(hd=>toPanel(hd,camera,w,h)):[];
 if(p.bg)drawBackground(lc,p.bg,w,h,[tops.reduce((t,v)=>t+v.x,0)/(tops.length||1)||w/2,(tops[0]?.y??h*.3)+(tops[0]?.s??60)*.6],i*7919+31);
 if(show){
  // A soft shadow where each resident stands on the floor (a seat carries the rest).
  for(const a of actors){
   if(a.seated)continue;
   const f=new THREE.Vector3(a.at.x,a.at.y+.01,a.at.z).project(camera),g2=new THREE.Vector3(a.at.x+.32,a.at.y+.01,a.at.z).project(camera);
   const fx=(f.x+1)/2*w,fy=(1-f.y)/2*h,size=Math.max(10,Math.abs((g2.x-f.x)/2*w));
   if(fy>0&&fy<h*1.15){const g=lc.createRadialGradient(fx,fy,0,fx,fy,size);g.addColorStop(0,'rgba(0,0,0,.38)');g.addColorStop(1,'rgba(0,0,0,0)');lc.fillStyle=g;lc.beginPath();lc.ellipse(fx,fy,size,size*.35,0,0,Math.PI*2);lc.fill();}
  }
  const r=context(w,h);r.setClearColor(0,0);r.clear();
  const depthTex=new THREE.Texture(depthImg);depthTex.needsUpdate=true;depthTex.minFilter=depthTex.magFilter=THREE.NearestFilter;depthTex.generateMipmaps=false;depthTex.colorSpace=THREE.NoColorSpace;
  depthPass(r,camera,depthTex,data.camera);depthTex.dispose();
  r.render(scene,camera);lc.drawImage(r.domElement,0,0,w,h);
 }
 // A Dutch angle tips the whole picture; the lettering stays level.
 const tilt=shot==='dutch'?(i%2?1:-1)*.16:0;
 if(tilt){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(tilt);ctx.scale(1.3,1.3);ctx.drawImage(layer,-w/2,-h/2);ctx.restore();}
 else ctx.drawImage(layer,0,0);
 const tipped=v=>{if(!tilt)return v;const dx=(v.x-w/2)*1.3,dy=(v.y-h/2)*1.3,c=Math.cos(tilt),s=Math.sin(tilt);return {x:w/2+dx*c-dy*s,y:h/2+dx*s+dy*c,s:v.s*1.3};};
 letter(ctx,w,h,p,actors,tops.map(tipped),i);
 scene.clear();
}

/** Whether every resident is in this view and in sight of its camera, asked of the 3D place itself. */
function inSightOf(view,world,actors){
 const camera=sceneCamera(view),ray=new THREE.Raycaster();
 const seen=v=>{const q=v.clone().project(camera);if(!(q.z<1&&Math.abs(q.x)<.92&&q.y>-1.02&&q.y<.95))return false;
  const to=v.clone().sub(camera.position),d=to.length();ray.set(camera.position,to.normalize());ray.near=.05;ray.far=d-.12;
  return !ray.intersectObjects(world.meshes,false).some(h=>h.object.visible&&h.object.material?.depthWrite!==false);};
 return actors.every(a=>{
  // As inSight: the crown and feet in the picture, the face and chest (and standing, the knees) in sight.
  const m=a.mark,[crown,...shown]=m.seat?[1.25,1.05,m.seat.height+.38]:[1.55,1.4,1,.5];
  const v=up=>new THREE.Vector3(m.x,m.y+up,m.z),inFrame=up=>{const q=v(up).project(camera);return q.z<1&&Math.abs(q.x)<.92&&q.y>-1.02&&q.y<.95;};
  return inFrame(0)&&inFrame(crown)&&shown.every(up=>seen(v(up)));
 });
}

/** Turns and poses the residents on their marks, facing each other and opened to the camera. */
function stage(actors,camera,p){
 for(const a of actors){a.at=a.mark;a.seated=!!a.mark.seat;}
 for(const a of actors){
  const at=a.at;a.holder.position.set(at.x,at.y,at.z);
  const others=actors.filter(b=>b!==a),toCam=Math.atan2(camera.position.x-at.x,camera.position.z-at.z);
  const toOther=others.length?Math.atan2(others.reduce((t,b)=>t+b.at.x,0)/others.length-at.x,others.reduce((t,b)=>t+b.at.z,0)/others.length-at.z):toCam;
  const wrap=v=>Math.atan2(Math.sin(v),Math.cos(v)),clamp=(v,m)=>Math.max(-m,Math.min(m,v));
  if(a.seated){
   const ahead=a.mark.seat.yaw+Math.PI,want=p.shot==='close'&&a.name===p.focus||!others.length?toCam:toOther;
   a.holder.rotation.y=ahead+clamp(wrap(want-ahead),.35);
   pose(a.avatar,a.pose&&a.pose!=='Idle'?a.pose:'Sit',a.expression,a.mark.seat.height,a.mark.seat.front);
  }else{
   const turn=others.length?wrap(toOther-toCam):0,facing=p.shot==='close'&&a.name===p.focus?.3:.78;
   a.holder.rotation.y=others.length?toCam+clamp(turn*facing,1.15):toCam;
   pose(a.avatar,a.pose,a.expression);
  }
 }
}

/** Where the panel looks inside the view: each shot wants the people a certain size in the panel. */
function frame({camera,actors,p,shot,w,h,i}){
 const heads=actors.map(headOf),focus=heads[Math.max(0,actors.findIndex(a=>a.name===p.focus))];
 const px=v=>{const q=v.clone().project(camera);return [(q.x+1)/2*VIEW_W,(1-q.y)/2*VIEW_H];};
 const feet=actors.map(a=>px(new THREE.Vector3(a.at.x,a.at.y,a.at.z))),crowns=heads.map(hd=>px(hd.top));
 const tall=Math.max(40,...actors.map((a,j)=>feet[j][1]-crowns[j][1])),faceH=Math.max(20,px(focus.top.clone().setY(focus.top.y-focus.size))[1]-px(focus.top)[1]);
 let ch={wide:tall/.38,medium:tall/.72,low:tall/.66,high:tall/.62,dutch:tall/.72,close:faceH/.48,'close-thing':VIEW_H/2.6}[shot]||tall/.7;
 const left=Math.min(...crowns.map(c=>c[0])),right=Math.max(...crowns.map(c=>c[0]));
 // Everyone in the picture: a shot of two people standing apart widens until both fit, a
 // shoulder's width either side, rather than cutting one of them off at the panel's edge.
 if(shot!=='close'&&shot!=='close-thing'&&actors.length>1)ch=Math.max(ch,(right-left+tall*.7)*h/w);
 ch=Math.min(VIEW_H,Math.max(VIEW_H/4.2,ch));let cw=ch*w/h;if(cw>VIEW_W){cw=VIEW_W;ch=cw*h/w;}
 let cx=VIEW_W*(.3+((i*37)%40)/100),cy=VIEW_H*.5;
 if(shot==='close'){const c=px(focus.centre);cx=c[0];cy=c[1]+ch*.12;}
 else if(shot!=='close-thing'){cx=(left+right)/2;const top=Math.min(...crowns.map(c=>c[1])),bottom=Math.max(...feet.map(f=>f[1]));cy=shot==='wide'?(top+bottom)/2+ch*.05:top+ch*.5-ch*.2;}
 const ox=Math.max(0,Math.min(VIEW_W-cw,cx-cw/2)),oy=Math.max(0,Math.min(VIEW_H-ch,cy-ch/2));
 camera.setViewOffset(VIEW_W,VIEW_H,ox,oy,cw,ch);camera.updateProjectionMatrix();
 return heads;
}

/**
 * A panel shot in the real place in 3D: the residents added to the room's own scene on their
 * marks, one render with the room's light and shadows, then the lettering.
 */
function drawWorldPanel({ctx,w,h,set,world,p,shot,actors,i,minutes}){
 const wanted=set[VIEWS[shot]]?VIEWS[shot]:set.push?'push':'wide';
 let viewName=wanted;
 for(const name of [...new Set([wanted,'push','wide','high','low'])])if(set[name]&&inSightOf(set[name],world,actors)){viewName=name;break;}
 const camera=sceneCamera(set[viewName]),show=shot!=='close-thing';camera.near=.05;camera.updateProjectionMatrix();
 stage(actors,camera,{...p,shot});
 for(const a of actors){a.holder.removeFromParent();if(show)world.scene.add(a.holder);}
 world.scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());
 holdDrinks(actors,i);
 world.scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());
 const heads=frame({camera,actors,p,shot,w,h,i});
 // The sun (or the room's key light) over the residents, so their shadows fall on this floor.
 const mid=new THREE.Vector3(actors.reduce((t,a)=>t+a.at.x,0)/actors.length,actors.reduce((t,a)=>t+a.at.y,0)/actors.length,actors.reduce((t,a)=>t+a.at.z,0)/actors.length);
 if(world.sun){world.sun.position.set(mid.x+5,mid.y+10,mid.z+6);world.sun.target.position.copy(mid);world.sun.target.updateMatrixWorld();world.sun.shadow.needsUpdate=true;}
 // The place's hour (places.js shot.time): the pier at six in the evening, the harbour at four.
 world.setClock?.(minutes,camera);
 const r=context(w,h);r.setClearColor(0,1);r.clear();r.render(world.scene,camera);
 const layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d');lc.drawImage(r.domElement,0,0,w,h);
 const tops=show?heads.map(hd=>toPanel(hd,camera,w,h)):[];
 if(p.bg){
  // Background marks (speed lines, a mood) go behind the residents: draw them on the picture,
  // then the residents again on top, hidden where the room's own depth is in front of them.
  drawBackground(lc,p.bg,w,h,[tops.reduce((t,v)=>t+v.x,0)/(tops.length||1)||w/2,(tops[0]?.y??h*.3)+(tops[0]?.s??60)*.6],i*7919+31);
  if(show){
   const background=world.scene.background,depthOnly=new THREE.MeshBasicMaterial({colorWrite:false});
   r.setClearColor(0,0);r.clear();world.scene.background=null;
   for(const a of actors)a.holder.visible=false;world.scene.overrideMaterial=depthOnly;r.render(world.scene,camera);world.scene.overrideMaterial=null;
   for(const a of actors)a.holder.visible=true;const room=world.meshes.filter(m=>m.visible);for(const m of room)m.visible=false;
   r.render(world.scene,camera);for(const m of room)m.visible=true;world.scene.background=background;depthOnly.dispose();
   lc.drawImage(r.domElement,0,0,w,h);
  }
 }
 for(const a of actors)a.holder.removeFromParent();
 // A Dutch angle tips the whole picture; the lettering stays level.
 const tilt=shot==='dutch'?(i%2?1:-1)*.16:0;
 if(tilt){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(tilt);ctx.scale(1.3,1.3);ctx.drawImage(layer,-w/2,-h/2);ctx.restore();}
 else ctx.drawImage(layer,0,0);
 const tipped=v=>{if(!tilt)return v;const dx=(v.x-w/2)*1.3,dy=(v.y-h/2)*1.3,c=Math.cos(tilt),s=Math.sin(tilt);return {x:w/2+dx*c-dy*s,y:h/2+dx*s+dy*c,s:v.s*1.3};};
 letter(ctx,w,h,p,actors,tops.map(tipped),i);
}

/** The stare, and any place without a captured set: the residents alone, the room blurred behind. */
async function drawStudioPanel({ctx,w,h,p,shot,actors,scene,base,place,i}){
 const img=await load(`${base}assets/images/feed/${place}.webp`).catch(()=>null);
 actors.forEach((a,j)=>{const solo=actors.length===1;a.holder.position.set(solo?.05:j?.5:-.5,0,0);a.holder.rotation.y=solo||shot==='eyes'?0:j?-.32:.32;pose(a.avatar,a.pose,a.expression);scene.add(a.holder);});
 scene.updateMatrixWorld(true);actors.forEach(a=>a.avatar.body.skeleton.update());
 const heads=actors.map(headOf),fh=heads[Math.max(0,actors.findIndex(a=>a.name===p.focus))],tall=Math.max(...actors.map(a=>a.avatar.height));
 const camera=new THREE.PerspectiveCamera(30,w/h,.05,60);
 if(shot==='eyes'){const y=fh.centre.y-fh.size*.13;camera.position.set(fh.centre.x,y,fh.centre.z+fh.front+fh.size*.95);camera.lookAt(fh.centre.x,y,fh.centre.z);}
 else{camera.position.set(0,tall*.7,tall*(actors.length>1?2.15:1.8));camera.lookAt(0,tall*.7,0);}
 camera.updateMatrixWorld(true);
 ctx.fillStyle='#222';ctx.fillRect(0,0,w,h);
 if(img){ctx.filter=shot==='eyes'?'blur(8px)':'none';const sw=img.width/1.3,sh=Math.min(img.height,sw*h/w);ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)*.45,sw,sh,0,0,w,h);ctx.filter='none';}
 scene.add(new THREE.HemisphereLight(0xffffff,0x8a8070,2.2));const key=new THREE.DirectionalLight(0xfff4e6,2.4);key.position.set(1.5,3,4);scene.add(key);
 const r=context(w,h);r.setClearColor(0,0);r.clear();r.render(scene,camera);ctx.drawImage(r.domElement,0,0,w,h);
 if(shot==='eyes'){
  // A thin strip of eyes between black bars, the line lettered in the bar.
  const bar=h*.22;ctx.fillStyle=INK;ctx.fillRect(0,0,w,bar);ctx.fillRect(0,h-bar,w,bar);
  ctx.fillStyle='#fff';ctx.font=`900 28px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.say?'“'+p.line+'”':p.line,w/2,h-bar/2,w*.9);
  if(p.sfx&&p.sfx!=='…')drawSfx(ctx,p.sfx,w,h*.7,i);
 }else letter(ctx,w,h,p,actors,heads.map(hd=>toPanel(hd,camera,w,h)),i);
 scene.clear();
}

/**
 * A drink in the hand that is not busy: the right, unless the right is pointing or waving.
 * On a quiet beat (standing about, listening) the glass goes up to the lips instead.
 */
function holdDrinks(actors,i){
 for(const a of actors){
  a.prop?.removeFromParent();a.prop=null;if(!a.drink)continue;
  const busyRight=['Point','Wave','Peace','Heart','Coy'].includes(a.pose),quiet=['Idle','Think','Sit','Shrug'].includes(a.pose)&&(i+a.name.length)%3===0;
  const side=busyRight?'L':'R',prop=buildServingDrink(a.drink,{held:true}).group;a.avatar.bones['hand'+side].add(prop);a.prop=prop;
  const lift=quiet&&side==='R'?.95:0;
  if(lift){a.avatar.root.updateMatrixWorld(true);poseAvatarConsumption(a.avatar,lift,false,prop);a.avatar.root.updateMatrixWorld(true);}
  fitAvatarHeldProp(a.avatar,prop,lift,side);
 }
}

/** The head of a posed avatar: an ellipsoid round headCentre, measured from the head bone. */
function headOf(a){
 const bone=a.avatar.bones?.head,m=a.avatar.measure;
 if(bone&&m){const R=m.Rh*(m.headSY||1),centre=bone.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),up=new THREE.Vector3(0,1,0).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()));return {centre,top:centre.clone().addScaledVector(up,R),size:R*2,front:m.Rh};}
 const top=a.holder.localToWorld(new THREE.Vector3(0,a.avatar.height,0));return {centre:top.clone().setY(top.y-a.avatar.height*.15),top,size:a.avatar.height*.3,front:a.avatar.height*.15};
}
function toPanel(hd,camera,w,h){
 const t=hd.top.clone().project(camera),c=hd.top.clone().setY(hd.top.y-hd.size).project(camera);
 const x=(t.x+1)/2*w,y=(1-t.y)/2*h,chin=(1-c.y)/2*h;return {x,y,s:Math.min(150,Math.max(24,chin-y))};
}
function averageColour(ctx,w,h){
 const d=ctx.getImageData(0,0,w,h).data;let r=0,g=0,b=0,n=0;for(let i=0;i<d.length;i+=4*97){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
 return [r/n/255,g/n/255,b/n/255];
}
/** Marks, sound effects and the bubble. */
function letter(ctx,w,h,p,actors,tops,i){
 (p.fx||[]).forEach((kind,j)=>tops[j]&&drawFaceFx(ctx,kind,tops[j].x,tops[j].y,tops[j].s,i+j));
 const xs=tops.flatMap(t=>[t.x-t.s,t.x+t.s]);drawSfx(ctx,p.sfx,w,h,i,{avoid:xs.length?[Math.min(...xs),Math.max(...xs)]:null});
 const speaker=actors.findIndex(a=>a.name===p.say);
 if(speaker>=0&&tops[speaker]){const {x,y}=tops[speaker];bubble(ctx,p.line,w,h,{x:Math.max(150,Math.min(w-150,x+(x<w/2?50:-50))),y:12,maxW:w*.72,tx:x,ty:y-8});}
 else bubble(ctx,p.line,w,h,{x:w/2,y:12,maxW:w*.84});
}
