import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';
import {ADVERTISING_CLIPS,shuffledPlaylist} from './advertising-billboard.js';
import {createScreenOcclusion} from './tv-occlusion.js';

/**
 * The owner's YouTube videos on Minato's television (the owner, 27 November 2026: "I want to change the video in the
 * izikaya to embedded YouTube videos from my channel", "Can't the embed option be used? So it plays a random video of
 * mine? And we can choose if we want to listen").
 *
 * A YouTube player cannot be painted onto a 3D surface: it is a web page of its own. So the real embedded player (the
 * IFrame Player API) is laid over the canvas, turned and sized every frame so that it sits exactly on the set's tube
 * (tvOverlayMatrix: the camera's projection and the screen's world matrix as one CSS matrix3d). Nothing the game draws
 * can pass in front of a page laid over it, so it shows only while the screen is in clear view (tvOverlayDecision,
 * tv-occlusion.js); otherwise the tube shows a still (the video's thumbnail, or the old advert's poster, or a quiet test
 * card) and the player is paused. It is silent until the player chooses "Listen to the TV".
 *
 * The rules YouTube sets for an embedded player, kept here:
 * - YouTube API Services, Required Minimum Functionality
 *   (https://developers.google.com/youtube/terms/required-minimum-functionality): the player's viewport is at least
 *   200 × 200 px; it does not play automatically until it is visible with more than half of it on screen (here: all
 *   of it, unobstructed); nothing is drawn over it (the HUD's pieces are checked, quadCovered) and its look is not
 *   changed (no CSS filter, no overlay: the placement only positions it; the fade is its own opacity, nothing on top).
 * - Views (https://support.google.com/youtube/answer/171780): a muted, automatically started embed does not count as a
 *   view; a view counts when the viewer starts playback in the player. "Watch on the TV" therefore opens the same video
 *   in an ordinary player with YouTube's own controls (activities.js youtubeViewer), where the viewer presses play.
 *   "Listen to the TV" only unmutes this ambient player: it does not count as a view.
 */

/**
 * The videos, in one place. `videos`: video IDs (a Short's is the part after /shorts/). `uploads`: the channel's uploads
 * playlist, its channel ID with UC replaced by UU (uploadsPlaylist); when set, the TV plays a random one of everything
 * uploaded, Shorts included, new uploads too, and `videos` is the list it falls back to.
 */
export const TV_YOUTUBE=Object.freeze({videos:Object.freeze(['ozpLFCdrAfk']),uploads:'UUechhQjAeM3xkuRDXof1CmA'});
/** A channel ID (UC…) as its uploads playlist (UU…). */
export const uploadsPlaylist=channel=>/^UC[\w-]{22}$/.test(channel||'')?'UU'+channel.slice(2):null;

/** The size of the YouTube page in CSS px before it is placed (4:3, like the tube; YouTube letterboxes inside it). */
export const TV_ELEMENT=Object.freeze({width:640,height:480});
/** The tube's face, metres, in the set's frame (advertising-billboard.js: the screen at (-0.066, 0, 0.273)). */
export const TV_FACE=Object.freeze({width:.60,height:.45,position:Object.freeze([-.066,0,.273])});
/**
 * When the player may show. A threshold to come on and a looser one to stay on, so it does not flicker at the edge.
 * minPixels is YouTube's 200 × 200 (Required Minimum Functionality, above).
 */
export const TV_GATES=Object.freeze({minPixels:200,showPixels:208,maxDistance:4.3,showDistance:4,minFacing:.36,showFacing:.42,showEdge:6});
/**
 * The cross-fade between the still and the player, from the timing scale of the animation guideline
 * (docs/ANIMATION-STANDARD.md, the game's screens; timing-calibration: "Normal 200-300ms", "Fast 100-200ms"): the
 * picture arrives over 250 ms easing out and leaves over 150 ms easing in. Opacity only, also with reduced motion.
 */
export const TV_FADE=Object.freeze({in:250,out:150});
/** How loud the TV is once listened to, of YouTube's 100 (Safari on iPad ignores it: its hardware buttons set it). */
export const TV_VOLUME=45;
/** Reasons the player stops showing that mean he has walked away (or the set went off): the sound is muted again. */
export const WALKED_AWAY=Object.freeze(['off','distance','facing','size','look','reduced-motion','room']);

/**
 * Where the API, the players and the stills come from. Only with ?audit may a test point them at its own pages
 * (same-origin paths only): ?tv-api=/x/iframe_api.js, ?tv-embed=/x/embed/, ?tv-watch=/x/watch/, ?tv-youtube=0.
 */
export function tvSources(search=globalThis.location?.search||''){
 const q=new URLSearchParams(search),audit=q.has('audit'),local=k=>{const v=audit?q.get(k):null;return v&&/^\/(?!\/)/.test(v)?v:null;};
 return {api:local('tv-api')||'https://www.youtube.com/iframe_api',embed:local('tv-embed')||'https://www.youtube-nocookie.com/embed/',
  watch:local('tv-watch')||'https://www.youtube.com/embed/',thumbnail:id=>'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg',
  enabled:!(audit&&q.get('tv-youtube')==='0')};
}

/** Picks the next video at random with the town's shuffle (shuffledPlaylist): every one once a round, never one twice in a row. */
export function createVideoPicker({random=Math.random,previous=null}={}){
 let order=[],list=[],last=previous;
 return {
  next(ids,avoid=new Set()){
   const usable=[...new Set(ids)].filter(id=>!avoid.has(id));if(!usable.length)return null;
   if(usable.join()!==list.join()){list=usable;order=[];}
   if(!order.length)order=shuffledPlaylist(list.length,list.indexOf(last),random);
   let id=list[order.shift()];
   if(id===last&&list.length>1){if(!order.length)order=shuffledPlaylist(list.length,list.indexOf(last),random);id=list[order.shift()];}
   last=id;return id;
  },
  get last(){return last;},
 };
}
/** The last video the set showed this visit to the town, so that coming back in does not show the same one again. */
let lastShown=null;

const _m=new THREE.Matrix4(),_e=new THREE.Matrix4(),_s=new THREE.Matrix4();
/**
 * The CSS matrix that lays an element of `element` px over the screen: element px → the face's plane (metres, y up,
 * centred) → the world (`face`, the face's world matrix) → the camera → its projection → CSS px of the viewport, whose
 * top left is the canvas's. As matrix3d (column-major, as three.js keeps it) with transform-origin 0 0, the browser's
 * divide by w gives the perspective. Every factor is invertible, so the element is drawn.
 */
export function tvOverlayMatrix({camera,face,width=TV_FACE.width,height=TV_FACE.height,element=TV_ELEMENT,viewport,out=new THREE.Matrix4()}){
 _e.set(width/element.width,0,0,-width/2, 0,-height/element.height,0,height/2, 0,0,1,0, 0,0,0,1);
 _s.set(viewport.width/2,0,0,viewport.width/2, 0,-viewport.height/2,0,viewport.height/2, 0,0,1,0, 0,0,0,1);
 _m.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(face).multiply(_e);
 return out.multiplyMatrices(_s,_m);
}
export const cssMatrix3d=m=>'matrix3d('+Array.from(m.elements??m,v=>Number.isFinite(v)?+v.toPrecision(12):0).join(',')+')';
/** The element's corners (top left, top right, bottom right, bottom left) where `matrix` puts them: CSS px and w. */
export function overlayCorners(matrix,element=TV_ELEMENT){
 const e=matrix.elements??matrix;
 return [[0,0],[element.width,0],[element.width,element.height],[0,element.height]].map(([u,v])=>{
  const x=e[0]*u+e[4]*v+e[12],y=e[1]*u+e[5]*v+e[13],w=e[3]*u+e[7]*v+e[15];
  return {x:x/w,y:y/w,w};
 });
}

/** Whether any of `rects` (DOM rects, CSS px) overlaps the corners' box. */
export function quadCovered(corners,rects=[]){
 if(!corners?.length)return false;
 const x0=Math.min(...corners.map(c=>c.x)),x1=Math.max(...corners.map(c=>c.x)),y0=Math.min(...corners.map(c=>c.y)),y1=Math.max(...corners.map(c=>c.y));
 return rects.some(r=>r.width>0&&r.height>0&&r.left<x1&&r.left+r.width>x0&&r.top<y1&&r.top+r.height>y0);
}

const span=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
/**
 * Whether the player shows (pure). In order: the set is on (in Minato, in its hours), nothing has the screen (a menu,
 * a card, the photo studio), the look is Natural (the drawn looks filter the canvas and cannot filter a YouTube page,
 * so with any other look the tube shows the still and the picture matches), reduced motion is off (then no video
 * starts by itself), the player is loaded, near enough, facing the camera, in front of it and all on screen, at least
 * YouTube's 200 × 200 px, with nothing between and nothing of the HUD over it. `showing`: whether it shows now (the
 * looser thresholds, so it does not flicker).
 */
export function tvOverlayDecision({showing=false,active=false,paused=false,look='none',reducedMotion=false,ready=false,
 distance=Infinity,facing=-1,corners=null,viewport=null,occluded=false,covered=false,gates=TV_GATES}={}){
 const hide=reason=>({show:false,reason});
 if(!active)return hide('off');
 if(paused)return hide('paused');
 if(look&&look!=='none')return hide('look');
 if(reducedMotion)return hide('reduced-motion');
 if(!ready)return hide('loading');
 if(!(distance<=(showing?gates.maxDistance:gates.showDistance)))return hide('distance');
 if(!(facing>=(showing?gates.minFacing:gates.showFacing)))return hide('facing');
 if(!corners||corners.length!==4||corners.some(c=>!(c.w>0)||!Number.isFinite(c.x)||!Number.isFinite(c.y)))return hide('behind');
 const edge=showing?0:gates.showEdge;
 if(!viewport||corners.some(c=>c.x<edge||c.y<edge||c.x>viewport.width-edge||c.y>viewport.height-edge))return hide('viewport');
 const [a,b,c,d]=corners,wide=Math.min(span(a,b),span(d,c)),tall=Math.min(span(a,d),span(b,c)),least=showing?gates.minPixels:gates.showPixels;
 if(wide<least||tall<least)return hide('size');
 if(occluded)return hide('occluded');
 if(covered)return hide('covered');
 return {show:true,reason:'clear'};
}

/** The HUD's pieces that can lie over the screen (quiet-hud.css; neighbour-chats.js's bubbles). */
export const HUD_PIECES='#hud .topbar,#hud #directoryButton,#hud #waypoint,#hud #prompt,#hud #contextActions>*,#hud #subtitle,#hud .timecard,#hud #ferryOperations,#mobile #stick,#mobile #act,#mobile button,.neighbour-chat,#jump';
function hudRects(doc,win){
 const rects=[];
 for(const el of doc.querySelectorAll?.(HUD_PIECES)||[]){
  if(el.hidden)continue;const r=el.getBoundingClientRect?.();if(!r||r.width<1||r.height<1)continue;
  let opacity=1,shown=true;for(let p=el;p&&p.nodeType===1;p=p.parentElement){const s=win.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'){shown=false;break;}opacity*=+s.opacity;if(opacity<.02)break;}
  if(shown&&opacity>=.02)rects.push({left:r.left,top:r.top,width:r.width,height:r.height});
 }
 return rects;
}

/**
 * A timeout that counts only the time the page was free to run: checked every second, a check that comes late (the
 * page busy building a room, as on entering Minato) counts at most 1.5 s. A slow device is not taken for an unreachable
 * YouTube. Returns its cancel.
 */
export function patientTimeout(ms,fn,{now=()=>globalThis.performance?.now?.()??Date.now(),schedule=setTimeout,cancel=clearTimeout}={}){
 let spent=0,last=now(),id=null;
 const tick=()=>{const t=now();spent+=Math.min(1500,Math.max(0,t-last));last=t;if(spent>=ms){id=null;fn();}else id=schedule(tick,1000);};
 id=schedule(tick,1000);return ()=>{if(id!==null)cancel(id);id=null;};
}
// The IFrame Player API, loaded once for the page; a failure lets a later visit try again.
let apiLoad=null;
function loadAPI(src,win,doc,timeout=10000){
 if(win.YT?.Player)return Promise.resolve(win.YT);
 if(apiLoad?.src===src)return apiLoad.promise;
 const promise=new Promise((resolve,reject)=>{
  const stop=patientTimeout(timeout,()=>reject(new Error('YouTube API timed out')));
  const previous=win.onYouTubeIframeAPIReady;
  win.onYouTubeIframeAPIReady=()=>{stop();try{previous?.();}catch{}win.YT?.Player?resolve(win.YT):reject(new Error('YouTube API without a player'));};
  const script=doc.createElement('script');script.src=src;script.async=true;script.onerror=()=>{stop();reject(new Error('YouTube API unreachable'));};
  doc.head.append(script);
 }).catch(error=>{apiLoad=null;throw error;});
 apiLoad={src,promise};return promise;
}

const PLAYER_VARS=Object.freeze({enablejsapi:1,playsinline:1,controls:0,rel:0,iv_load_policy:3,disablekb:1,mute:1,autoplay:0,fs:0});
function embedURL(base,{video=null,list=null},origin){
 const q=new URLSearchParams(Object.entries(PLAYER_VARS).map(([k,v])=>[k,String(v)]));if(origin)q.set('origin',origin);
 if(list){q.set('list',list);q.set('listType','playlist');}
 return base+(list?'videoseries':encodeURIComponent(video))+'?'+q;
}
/** A quiet test card for the tube when neither a thumbnail nor the poster can be had. */
function testCard(doc){
 const c=doc.createElement?.('canvas');if(!c?.getContext)return null;c.width=256;c.height=192;const x=c.getContext('2d');if(!x)return null;
 x.fillStyle='#22302e';x.fillRect(0,0,256,192);
 ['#8e8f86','#a39a6e','#6f9690','#6f8a6a','#8c6f7c','#8a6160','#5e6e86'].forEach((colour,i)=>{x.fillStyle=colour;x.fillRect(16+i*32,22,32,104);});
 x.fillStyle='#1a2422';x.fillRect(16,134,224,34);x.fillStyle='#b9b4a1';x.font='600 18px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('ミナト  TV',128,151);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const ease={out:t=>1-(1-t)**3,in:t=>t**3};
const shownNow=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};

/**
 * Puts the YouTube player on a television made by createIzakayaTV. The set keeps its old film for when YouTube cannot
 * be had (offline, unreachable, refused): then it plays video/izakaya-ad.mp4 exactly as before (tv.hold(false)).
 * The game calls place() on every frame it draws, after the camera is final and before the draw, so the page moves
 * with the picture; a frame drawn without place() hides it at once (the watchdog), so it never lags or floats.
 */
export function attachYouTube(tv,{config=TV_YOUTUBE,sources=tvSources(),random=Math.random,doc=globalThis.document,win=globalThis.window,
 now=()=>globalThis.performance?.now?.()??Date.now(),reducedMotion=null,onListening=()=>{},onWatch=()=>{}}={}){
 if(!sources.enabled||!doc?.createElement||!win||!tv?.hold)return tv;
 const motion=reducedMotion?null:win.matchMedia?.('(prefers-reduced-motion: reduce)');reducedMotion??=()=>!!motion?.matches;
 const videos=[...(config.videos||[])].filter(Boolean),uploads=config.uploads||null;
 if(!videos.length&&!uploads)return tv;
 tv.hold(true);
 const face=new THREE.Object3D();face.name='CRT YouTube face';face.position.set(...TV_FACE.position);tv.group.add(face);
 const picker=createVideoPicker({random,previous:lastShown}),failed=new Set(),stills=new Map(),timers=new Set(),stops=new Set();
 let phase='idle',player=null,host=null,wrap=null,frame=null,ids=[],current=null,fromUploads=!!uploads;
 let playing=false,started=false,askedAt=0,opacity=0,fade=null,target=false,muted=true,listening=false,disposed=false;
 let active=false,paused=false,decision={show:false,reason:'off'},placed=false,coverAt=-Infinity,cover=[];
 let occlusion=null,poster=null,card=null,lastCamera=null,lastAt=0,still=null,seen=[],placeMs=0,sightMs=0,coverMs=0;
 const bodiesSeen=new WeakMap(),matrix=new THREE.Matrix4(),errors=[],states=[];
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
 // ----- the still on the tube
 function showStill(texture,aspect=4/3){
  if(disposed||!texture)return;still=texture;tv.material.map=texture;tv.material.color.set(0xffffff);tv.material.needsUpdate=true;
  const tube=4/3;tv.screen.scale.set(Math.min(1,aspect/tube),Math.min(1,tube/aspect),1);
 }
 function showPoster(){
  const clip=ADVERTISING_CLIPS[0];
  if(poster)return showStill(poster,clip?.aspect||1);
  if(!clip?.poster){card??=testCard(doc);return showStill(card);}
  poster=new THREE.TextureLoader().load(assetURL(clip.poster),t=>{if(!stills.has(current)||stills.get(current)===null)showStill(t,clip.aspect||1);},undefined,()=>{poster=null;card??=testCard(doc);if(still!==stills.get(current))showStill(card);});
  poster.colorSpace=THREE.SRGBColorSpace;
 }
 function showThumbnail(id){
  if(!id)return showPoster();
  if(stills.has(id)){const t=stills.get(id);return t?showStill(t):showPoster();}
  stills.set(id,null);showPoster();
  // i.ytimg.com answers with Access-Control-Allow-Origin: *, so the thumbnail can be a texture (hqdefault is 4:3).
  const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');
  const t=loader.load(sources.thumbnail(id),()=>{if(disposed)return t.dispose();stills.set(id,t);if(current===id)showStill(t);},undefined,()=>{t.dispose();stills.set(id,null);});
  t.colorSpace=THREE.SRGBColorSpace;
 }
 // ----- the page
 function fail(reason){
  if(phase==='failed'||disposed)return;phase='failed';
  try{player?.destroy?.();}catch{}player=null;host?.remove?.();host=wrap=frame=null;fade=null;opacity=0;target=false;playing=false;
  setListening(false);tv.hold(false);
  tv.youtube.failure=reason;
 }
 function start(){
  if(phase!=='idle')return;phase='loading';
  if(win.navigator?.onLine===false)return fail('offline');
  loadAPI(sources.api,win,doc).then(YT=>{if(disposed||phase!=='loading')return;build(YT);},error=>fail(error.message));
 }
 function build(YT){
  host=doc.createElement('div');host.className='tv-youtube';host.setAttribute('aria-hidden','true');
  host.style.cssText='position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:5;pointer-events:none;contain:layout style';
  wrap=doc.createElement('div');
  wrap.style.cssText=`position:absolute;left:0;top:0;width:${TV_ELEMENT.width}px;height:${TV_ELEMENT.height}px;transform-origin:0 0;opacity:0;visibility:hidden;pointer-events:none;background:#000;will-change:transform,opacity`;
  frame=doc.createElement('iframe');frame.title='Minato television';frame.tabIndex=-1;
  frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  frame.style.cssText='display:block;width:100%;height:100%;border:0;pointer-events:none';
  if(!uploads){current=picker.next(videos,failed);lastShown=current;showThumbnail(current);}
  frame.src=embedURL(sources.embed,uploads?{list:uploads}:{video:current},win.location?.origin);
  // Straight after the canvas: over the picture and its vignette (#ink), under the room fade, the HUD and every card.
  wrap.append(frame);host.append(wrap);const canvas=doc.querySelector?.('#game');if(canvas?.after)canvas.after(host);else doc.body.append(host);
  const ready=patientTimeout(12000,()=>{if(phase==='loading'&&!disposed)fail('YouTube player did not start');});stops.add(ready);
  player=new YT.Player(frame,{events:{
   onReady:()=>{ready();stops.delete(ready);if(disposed)return;try{player.mute();}catch{}
    if(uploads)readPlaylist(0);else phase='ready';},
   onStateChange:event=>stateChange(event?.data),
   onError:event=>playerError(event?.data),
  }});
 }
 // The uploads playlist's IDs, once the player has it (a few tries: it arrives after onReady).
 function readPlaylist(tries){
  if(disposed||phase!=='loading')return;
  const list=(()=>{try{return player.getPlaylist?.()||[];}catch{return [];}})().filter(id=>typeof id==='string'&&id);
  if(list.length){ids=list;fromUploads=true;}
  else if(tries<16)return void later(()=>readPlaylist(tries+1),300);
  else{ids=videos;fromUploads=false;}
  if(!ids.length)return fail('no videos');
  choose(false);phase='ready';
 }
 function choose(play){
  const id=picker.next(fromUploads?ids:videos,failed);
  if(!id){if(fromUploads&&videos.length){fromUploads=false;return choose(play);}return fail('no video would play');}
  current=id;lastShown=id;started=false;showThumbnail(id);
  try{if(play)player.loadVideoById(id);else player.cueVideoById(id);}catch{fail('player refused the video');}
  if(play){askedAt=now();playing=true;}
 }
 function stateChange(state){
  if(disposed||!player)return;states.push(state);if(states.length>20)states.shift();
  if(state===1){started=true;if(!target&&opacity<=0){try{player.pauseVideo();}catch{}playing=false;}}
  // Cued after it was asked to play (a new video, the playlist arriving): ask again.
  else if(state===5&&target&&playing){try{player.playVideo();}catch{}askedAt=now();}
  else if(state===0){started=false;choose(target);}
  // Paused by the browser while it should be playing (Safari refusing sound without a tap): quiet again and carry on.
  else if(state===2&&playing&&target&&started){if(!muted){muted=true;try{player.mute();player.playVideo();}catch{}setListening(false);}}
 }
 function playerError(code){
  if(disposed)return;errors.push([current,code]);
  // 2 bad value, 5 HTML5 error, 100 gone or private, 101 and 150 not to be embedded, 153 no referrer: skip it.
  if(current)failed.add(current);
  if(phase==='loading'&&uploads&&!ids.length){fromUploads=false;ids=videos;phase='ready';}
  const left=(fromUploads?ids:videos).filter(id=>!failed.has(id));
  if(!left.length&&!(fromUploads&&videos.some(id=>!failed.has(id))))return fail('YouTube refused every video ('+code+')');
  phase='ready';choose(target);
 }
 // ----- sound
 function setListening(on){on=!!on;if(on===listening)return;listening=on;try{onListening(on);}catch{}}
 function mute(){if(muted)return;muted=true;try{player?.mute();}catch{}setListening(false);}
 // Safari lets sound start only inside the tap itself; the rail answers on pointerdown, so the release unmutes again.
 const regesture=()=>{if(!muted&&player){try{player.unMute();}catch{}}};
 const releaseEvents=['pointerup','touchend','click','keyup'];
 function armRelease(){for(const name of releaseEvents)doc.addEventListener(name,onRelease,{capture:true,passive:true});}
 function onRelease(){for(const name of releaseEvents)doc.removeEventListener(name,onRelease,{capture:true});regesture();}
 // ----- placing and fading
 function setOpacity(value){
  opacity=value;if(!wrap)return;
  wrap.style.opacity=String(+value.toFixed(3));wrap.style.visibility=value>0?'visible':'hidden';
 }
 function hideNow(){fade=null;setOpacity(0);if(playing&&player){try{player.pauseVideo();}catch{}playing=false;}setListening(false);}
 function fadeTo(to,t){
  if(fade?.to===to||(!fade&&opacity===to))return;
  const length=(to>opacity?TV_FADE.in:TV_FADE.out)*Math.abs(to-opacity);
  fade={from:opacity,to,start:t,length:Math.max(1,length),curve:to>opacity?ease.out:ease.in};
 }
 function stepFade(t){
  if(!fade)return;const k=Math.min(1,(t-fade.start)/fade.length);setOpacity(fade.from+(fade.to-fade.from)*fade.curve(k));if(k>=1)fade=null;
 }
 // A frame drawn without place(): the page must not stay where the last frame put it.
 function watchdog(){
  if(disposed||!host)return;
  if(!placed&&opacity>0)hideNow();
  placed=false;win.requestAnimationFrame?.(watchdog);
 }
 const capsule=(object,t)=>{
  object.updateWorldMatrix?.(true,false);const base=new THREE.Vector3().setFromMatrixPosition(object.matrixWorld),scale=Math.abs(object.matrixWorld.elements[5])||1;
  const seen=bodiesSeen.get(object),velocity=seen&&t>seen.t?base.clone().sub(seen.at).divideScalar(Math.max(.001,(t-seen.t)/1000)):new THREE.Vector3();
  bodiesSeen.set(object,{at:base.clone(),t});if(velocity.length()>4)velocity.set(0,0,0);
  return {base,height:(object.userData?.bodyHeight||1.8)*scale,radius:.34,velocity,name:object.userData?.name||object.name||'body'};
 };
 const points=[];for(const y of [-.21,0,.21])for(const x of [-.285,0,.285])points.push(new THREE.Vector3(x,y,0));
 const centre=new THREE.Vector3(),normal=new THREE.Vector3(),toward=new THREE.Vector3(),targets=points.map(()=>new THREE.Vector3()),ahead=new THREE.Vector3(),moved=new THREE.Vector3();
 /**
  * One frame's placing. camera: the one about to draw the frame (null: another camera has the canvas: hide at once);
  * active: the set is on; paused: something has the screen; look: the chosen look; viewport: the canvas's CSS size;
  * bodies: the residents' roots; self: Johansson's (a body like theirs, unless the lens is in his head: then what of
  * him is drawn is the arm bringing a drink up, and the page hides); others: roots whose meshes block (the camera, for
  * the can he holds in first person).
  */
 function place(options={}){
  const t0=globalThis.performance?.now?.()??0,result=placeNow(options);placeMs=(globalThis.performance?.now?.()??0)-t0;return result;
 }
 function placeNow({camera=null,active:on=active,paused:hold=paused,look='none',viewport=null,bodies=[],others=[],self=null}={}){
  if(disposed)return decision;placed=true;
  active=on;paused=hold;
  if(phase==='failed')return decision={show:false,reason:'fallback'};
  if(active&&phase==='idle')start();
  if(!camera||!viewport){decision={show:false,reason:'camera'};hideNow();return decision;}
  const t=now();
  camera.updateMatrixWorld();face.updateWorldMatrix(true,false);
  tvOverlayMatrix({camera,face:face.matrixWorld,viewport,out:matrix});
  const corners=overlayCorners(matrix);
  centre.setFromMatrixPosition(face.matrixWorld);normal.setFromMatrixColumn(face.matrixWorld,2).normalize();
  camera.getWorldPosition(toward);const lens=toward.clone();toward.sub(centre);const distance=toward.length(),facing=distance>0?normal.dot(toward)/distance:-1;
  const state={showing:target,active,paused,look,reducedMotion:reducedMotion(),ready:phase==='ready',distance,facing,corners,viewport};
  // Whether the lens is in a body's head (that person's own eyes, first person): that body is not in the way of the view.
  const inside=c=>Math.hypot(lens.x-c.base.x,lens.z-c.base.z)<.22&&lens.y>c.base.y+c.height*.6&&lens.y<c.base.y+c.height+.15;
  decision=tvOverlayDecision(state);
  // The room's sight-line tree is built from the moment the set is on, a few milliseconds a frame (about a sixth of the
  // frame, at least 3 ms), so it is ready long before anybody reaches the set and never stalls a frame.
  if(active){
   occlusion??=createScreenOcclusion({root:tv.group.parent,exclude:tv.group,centre:centre.clone(),reach:TV_GATES.maxDistance+.5});
   if(!occlusion.ready)occlusion.prepare(Math.min(50,Math.max(3,(t-(lastAt||t))*.15)));
  }
  let hard=false;
  if(decision.show&&!occlusion?.ready)decision={show:false,reason:'loading'};
  if(decision.show){
   // Johansson: with the lens in his head (first person) what of him is drawn is his arm bringing a drink up, close
   // in front of the lens; otherwise (third person, his arrival's shot) he is a body like anybody else's.
   const me=self&&shownNow(self)?capsule(self,t):null,lensInMe=me&&inside(me);
   if(lensInMe){decision={show:false,reason:'occluded',by:'self: his first-person arm'};hard=opacity>0;}
   else{
    points.forEach((p,i)=>targets[i].copy(p).applyMatrix4(face.matrixWorld));
    const capsules=bodies.filter(b=>b&&b!==self).map(b=>capsule(b,t)).filter(c=>!inside(c));if(me)capsules.push(me);seen=capsules;
    const layers=camera.layers;
    const q0=globalThis.performance?.now?.()??0;
    const blocker=occlusion.blocked({origin:lens,targets,bodies:capsules,others,layers});hard=!!blocker;
    // A little early and a little ahead: people a few centimetres wider and where they will be in a fifth of a
    // second, the lens where it is going, so the picture has faded before anything reaches it.
    let soft=null;
    if(!hard){
     moved.copy(lens).sub(lastCamera||lens).divideScalar(Math.max(.001,(t-(lastAt||t))/1000||1));if(!lastCamera||moved.length()>6)moved.set(0,0,0);
     ahead.copy(lens).addScaledVector(moved,.2);
     const predicted=capsules.map(c=>({base:c.base.clone().addScaledVector(c.velocity,.2),height:c.height,radius:c.radius,name:c.name}));
     soft=occlusion.blocked({origin:ahead,targets,bodies:[...capsules,...predicted],extra:.12,others,layers});
    }else soft=blocker;
    sightMs=(globalThis.performance?.now?.()??0)-q0;
    if(soft)decision={show:false,reason:'occluded',by:soft.kind+': '+soft.name};
    else{
     if(t-coverAt>120){const c0=globalThis.performance?.now?.()??0;cover=hudRects(doc,win);coverAt=t;coverMs=(globalThis.performance?.now?.()??0)-c0;}
     if(quadCovered(corners,cover))decision={show:false,reason:'covered'};
    }
   }
  }
  lastCamera=(lastCamera||new THREE.Vector3()).copy(lens);lastAt=t;
  if(!decision.show&&WALKED_AWAY.includes(decision.reason))mute();
  target=decision.show;
  if(wrap){
   wrap.style.transform=cssMatrix3d(matrix);
   if(hard||decision.reason==='behind')hideNow();
   else if(target){
    // Asked, and not started two seconds later: ask again (a command can be lost while the player is still loading).
    if(player&&(!playing||!started&&t-askedAt>2000)){try{player.playVideo();}catch{}playing=true;askedAt=t;}
    // Fade in once the picture moves, never over YouTube's loading screen or its play button (which cannot be pressed
    // here): where it does not start by itself (Safari in Low Power Mode) the still stays, and "Watch on the TV" works.
    if(started)fadeTo(1,t);
   }else fadeTo(0,t);
   stepFade(t);
   if(!target&&opacity<=0&&playing){try{player.pauseVideo();}catch{}playing=false;}
   if(host&&!host.dataset.watch){host.dataset.watch='1';win.requestAnimationFrame?.(watchdog);}
  }
  setListening(!muted&&playing&&opacity>0);
  return decision;
 }
 const base={update:tv.update,dispose:tv.dispose};
 tv.update=(options={})=>{
  // The game's own pause (a card opening) hides the page at once; place() does the rest.
  // A card over the game keeps the sound chosen; the set going off (out of its hours) mutes it.
  if(phase!=='failed'){active=!!options.active;paused=!!options.paused;if(paused||!active)hideNow();if(!active&&!paused)mute();}
  return base.update(options);
 };
 tv.place=place;
 tv.youtube={
  get phase(){return phase;},get video(){return current;},get ids(){return fromUploads?[...ids]:[...videos];},get fromUploads(){return fromUploads;},
  get muted(){return muted;},get listening(){return listening;},get opacity(){return opacity;},get decision(){return decision;},
  get transform(){return wrap?.style.transform||null;},get element(){return wrap;},failure:null,
  get triangles(){return occlusion?.triangles??0;},get buildMs(){return occlusion?.buildMs??0;},get sightReady(){return !!occlusion?.ready;},get placeMs(){return placeMs;},get sightMs(){return sightMs;},get coverMs(){return coverMs;},get errors(){return errors.slice(-20);},get states(){return states.slice();},
  get bodies(){return seen.map(c=>({name:c.name,at:c.base.toArray().map(v=>+v.toFixed(2)),height:+c.height.toFixed(2)}));},
 };
 /** What the set offers: listen or mute while it plays in view; watch the video in a proper player while YouTube is had. */
 tv.controls=()=>{
  if(phase==='failed'||!active)return null;
  const live=phase==='ready'&&target&&opacity>0;
  return {listen:live?(muted?'Listen to the TV':'Mute the TV'):null,watch:current&&phase==='ready'?'Watch on the TV':null};
 };
 /** Listen or mute, inside the tap that asked (call it from the tap's own handler). Not a view: see the rules above. */
 tv.toggleListen=()=>{
  if(!player||phase!=='ready')return false;
  if(muted){muted=false;try{player.unMute();player.setVolume?.(TV_VOLUME);if(!playing&&target){player.playVideo();playing=true;}}catch{}armRelease();}
  else mute();
  setListening(!muted&&playing&&opacity>0);return !muted;
 };
 /** The video in an ordinary player with YouTube's controls, where the viewer starts it (a view counts). */
 tv.watchURL=()=>current?sources.watch+encodeURIComponent(current)+'?'+new URLSearchParams({playsinline:'1',rel:'0',autoplay:'0'}):null;
 tv.watch=()=>{const url=tv.watchURL();if(!url)return false;mute();onWatch(url,current);return true;};
 /** The set's prompt: listen or mute while it plays in view, otherwise watch it properly. False when it has neither. */
 tv.interact=()=>{const c=tv.controls();if(c?.listen){tv.toggleListen();return true;}if(c?.watch)return tv.watch();return false;};
 tv.promptLabel=()=>{const c=tv.controls();return c?.listen||c?.watch||null;};
 tv.dispose=()=>{
  if(disposed)return;mute();disposed=true;
  for(const id of timers)clearTimeout(id);timers.clear();for(const stop of stops)stop();stops.clear();onRelease();
  try{player?.stopVideo?.();}catch{}try{player?.destroy?.();}catch{}player=null;host?.remove?.();host=wrap=frame=null;setListening(false);
  occlusion?.dispose();for(const t of stills.values())t?.dispose?.();stills.clear();poster?.dispose();card?.dispose();face.removeFromParent();
  base.dispose();
 };
 showPoster();
 return tv;
}
