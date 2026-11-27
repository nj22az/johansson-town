import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createIzakayaTV} from '../src/world/advertising-billboard.js';
import {TV_YOUTUBE,TV_ELEMENT,TV_FACE,TV_GATES,TV_FADE,TV_VOLUME,uploadsPlaylist,createVideoPicker,tvOverlayMatrix,cssMatrix3d,overlayCorners,
 tvOverlayDecision,quadCovered,tvSources,patientTimeout,attachYouTube} from '../src/world/izakaya-tv-youtube.js';
import {buildTriangleTree,createScreenOcclusion,segmentDistance} from '../src/world/tv-occlusion.js';
import {contextActions} from '../src/interact/context-actions.js';
import {installDOM,Element} from './fixtures.mjs';

// The owner's YouTube videos on Minato's television (27 November 2026). See world/izakaya-tv-youtube.js.

const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};

test('the videos are configured in one place: the uploads playlist, with the Short as the fallback list',()=>{
 assert.deepEqual([...TV_YOUTUBE.videos],['ozpLFCdrAfk']);
 assert.equal(TV_YOUTUBE.uploads,'UUechhQjAeM3xkuRDXof1CmA');
 assert.equal(uploadsPlaylist('UCechhQjAeM3xkuRDXof1CmA'),TV_YOUTUBE.uploads,'a channel ID becomes its uploads playlist');
 assert.equal(uploadsPlaylist('not a channel'),null);
 // Only an audit run may point the set at other pages, and only at this site's own paths.
 assert.equal(tvSources('?tv-api=/x/api.js').api,'https://www.youtube.com/iframe_api');
 assert.equal(tvSources('?audit&tv-api=/x/api.js').api,'/x/api.js');
 assert.equal(tvSources('?audit&tv-api=//evil.example/api.js').api,'https://www.youtube.com/iframe_api');
 assert.equal(tvSources('?audit&tv-embed=https://evil.example/').embed,'https://www.youtube-nocookie.com/embed/');
 assert.equal(tvSources('?audit&tv-youtube=0').enabled,false);
});

test('a random video each time: seeded, never the same one twice in a row, every one once a round',()=>{
 for(const seed of [1,7,42,1234]){
  const pick=createVideoPicker({random:seeded(seed)}),ids=['a','b','c','d'],seen=[];
  for(let i=0;i<200;i++)seen.push(pick.next(ids));
  for(let i=1;i<seen.length;i++)assert.notEqual(seen[i],seen[i-1],'seed '+seed+' repeated at '+i);
  for(let r=0;r<50;r++)assert.deepEqual(seen.slice(r*4,r*4+4).sort(),ids,'seed '+seed+': round '+r+' shows each once');
 }
 // The same seed, the same order.
 const a=createVideoPicker({random:seeded(9)}),b=createVideoPicker({random:seeded(9)});
 assert.deepEqual(Array.from({length:12},()=>a.next(['x','y','z'])),Array.from({length:12},()=>b.next(['x','y','z'])));
 // One video: always that one. A failed video is passed over. The last one shown is not shown first next time.
 const one=createVideoPicker({random:seeded(3)});for(let i=0;i<5;i++)assert.equal(one.next(['ozpLFCdrAfk']),'ozpLFCdrAfk');
 const skip=createVideoPicker({random:seeded(5)});for(let i=0;i<20;i++)assert.notEqual(skip.next(['p','q','r'],new Set(['q'])),'q');
 for(let s=0;s<30;s++){const next=createVideoPicker({random:seeded(s),previous:'b'});assert.notEqual(next.next(['a','b','c']),'b');}
 // The uploads playlist arriving after the fallback list: the new list is used, still without a repeat.
 const mode=createVideoPicker({random:seeded(11)}),first=mode.next(['ozpLFCdrAfk']);
 const uploads=['ozpLFCdrAfk','dM5hSYHX2wU','RNQ7FRAx0cI'];
 for(let i=0,last=first;i<30;i++){const id=mode.next(uploads);assert.ok(uploads.includes(id));assert.notEqual(id,last);last=id;}
});

// A set at the origin facing +z, and its face (the tube's rim) as the overlay uses it.
function setUp(){
 const room=new THREE.Group(),face=new THREE.Object3D();
 const set=new THREE.Group();room.add(set);face.position.set(...TV_FACE.position);set.add(face);room.updateWorldMatrix(true,true);
 return {room,set,face};
}
const viewport={width:1180,height:820};
function cameraAt(pos,at,aspect=viewport.width/viewport.height){const c=new THREE.PerspectiveCamera(65,aspect,.05,60);c.position.set(...pos);c.lookAt(...at);c.updateMatrixWorld();return c;}
function projectedCorners(camera,face,vp=viewport){
 return [[-1,1],[1,1],[1,-1],[-1,-1]].map(([sx,sy])=>{const p=new THREE.Vector3(sx*TV_FACE.width/2,sy*TV_FACE.height/2,0).applyMatrix4(face.matrixWorld).project(camera);return {x:(p.x+1)/2*vp.width,y:(1-p.y)/2*vp.height};});
}
/** What the browser does with `transform: matrix3d(...)` and transform-origin 0 0 on an element at the viewport's top left. */
function cssCorners(transform,element=TV_ELEMENT){
 const m=transform.match(/^matrix3d\(([^)]+)\)$/)[1].split(',').map(Number);assert.equal(m.length,16);
 return [[0,0],[element.width,0],[element.width,element.height],[0,element.height]].map(([u,v])=>{
  const x=m[0]*u+m[4]*v+m[12],y=m[1]*u+m[5]*v+m[13],w=m[3]*u+m[7]*v+m[15];return {x:x/w,y:y/w};
 });
}

test('the page\'s CSS transform puts its corners on the screen\'s projected corners, within a pixel, from several poses',()=>{
 const {face}=setUp(),centre=new THREE.Vector3(...TV_FACE.position);
 const poses=[[[0,0,1.2],centre],[[.7,.3,1.1],centre],[[-.6,-.4,.9],[.1,.1,.2]],[[.2,-.5,2.4],[0,.3,0]],[[-1.1,.2,.6],centre]];
 for(const vp of [viewport,{width:820,height:1180},{width:1600,height:1000}])for(const [pos,at] of poses){
  const camera=cameraAt(pos,at.toArray?at.toArray():at,vp.width/vp.height),matrix=tvOverlayMatrix({camera,face:face.matrixWorld,viewport:vp});
  const expected=projectedCorners(camera,face,vp),drawn=cssCorners(cssMatrix3d(matrix)),fromMatrix=overlayCorners(matrix);
  for(let i=0;i<4;i++){
   assert.ok(Math.hypot(drawn[i].x-expected[i].x,drawn[i].y-expected[i].y)<1,`corner ${i} from ${pos} in ${vp.width}×${vp.height}: ${JSON.stringify(drawn[i])} against ${JSON.stringify(expected[i])}`);
   assert.ok(Math.hypot(fromMatrix[i].x-expected[i].x,fromMatrix[i].y-expected[i].y)<1);assert.ok(fromMatrix[i].w>0);
  }
  // Every factor is invertible, so the browser draws the element.
  assert.notEqual(matrix.determinant(),0);
 }
});

test('the decision: shown only on, Natural, near, facing, in view, at least 200 × 200 px, clear and uncovered',()=>{
 const {face}=setUp(),near=cameraAt([0,0,1.1],[-.066,0,.273]),matrix=tvOverlayMatrix({camera:near,face:face.matrixWorld,viewport});
 const corners=overlayCorners(matrix),base={active:true,paused:false,look:'none',ready:true,distance:.83,facing:.99,corners,viewport,occluded:false,covered:false};
 assert.deepEqual(tvOverlayDecision(base),{show:true,reason:'clear'});
 const hidden=(change,reason,message)=>assert.equal(tvOverlayDecision({...base,...change}).reason,reason,message);
 hidden({active:false},'off','another room, or out of the set\'s hours');
 hidden({paused:true},'paused','a card or menu has the screen');
 hidden({look:'print'},'look','the woodblock look cannot filter a YouTube page: the tube shows the still');
 hidden({look:'pocket'},'look');
 hidden({reducedMotion:true},'reduced-motion');
 hidden({ready:false},'loading');
 hidden({distance:4.5},'distance');
 hidden({facing:.2},'facing','seen from too far round the side, or from behind');
 hidden({occluded:true},'occluded','anything between the lens and a corner or the middle');
 hidden({covered:true},'covered','a piece of the HUD over it (YouTube: nothing drawn over the player)');
 hidden({corners:corners.map((c,i)=>i===2?{...c,w:-1}:c)},'behind');
 hidden({corners:corners.map((c,i)=>i===1?{...c,x:viewport.width+3}:c)},'viewport','a corner off the screen');
 hidden({corners:corners.map((c,i)=>i===0?{...c,y:-2}:c)},'viewport');
 // YouTube's 200 × 200 px (Required Minimum Functionality), on both sides of the quad.
 const square=(w,h)=>[{x:100,y:100,w:1},{x:100+w,y:100,w:1},{x:100+w,y:100+h,w:1},{x:100,y:100+h,w:1}];
 hidden({corners:square(300,199)},'size');hidden({corners:square(199,300)},'size');
 assert.equal(tvOverlayDecision({...base,corners:square(210,210)}).show,true);
 assert.equal(tvOverlayDecision({...base,corners:square(204,204)}).reason,'size','coming on needs a little more than the minimum');
 assert.equal(tvOverlayDecision({...base,showing:true,corners:square(201,201)}).show,true,'staying on needs only the minimum');
 assert.equal(tvOverlayDecision({...base,showing:true,corners:square(199,250)}).reason,'size','never below it');
 // A perspective quad: the shorter of each pair of opposite sides counts.
 const keystone=[{x:100,y:100,w:1},{x:400,y:150,w:1},{x:400,y:330,w:1},{x:100,y:400,w:1}];
 assert.equal(tvOverlayDecision({...base,corners:keystone}).reason,'size','its right side is only 180 px');
 // Hysteresis on distance and facing, so it does not flicker at the edge.
 assert.equal(tvOverlayDecision({...base,distance:4.1}).reason,'distance');
 assert.equal(tvOverlayDecision({...base,showing:true,distance:4.1}).show,true);
 assert.equal(tvOverlayDecision({...base,facing:.4}).reason,'facing');
 assert.equal(tvOverlayDecision({...base,showing:true,facing:.4}).show,true);
 // From across the room the set is small: the still.
 const far=cameraAt([0,.2,3.4],[-.066,0,.273]),farCorners=overlayCorners(tvOverlayMatrix({camera:far,face:face.matrixWorld,viewport}));
 assert.equal(tvOverlayDecision({...base,distance:3.1,corners:farCorners}).reason,'size');
 // The HUD's rectangles against the quad's box.
 assert.equal(quadCovered(corners,[{left:0,top:0,width:40,height:40}]),false);
 const box=corners.reduce((b,c)=>({x:Math.min(b.x,c.x),y:Math.min(b.y,c.y)}),{x:Infinity,y:Infinity});
 assert.equal(quadCovered(corners,[{left:box.x-10,top:box.y-10,width:30,height:30}]),true);
});

test('sight lines: the room\'s triangles in a tree, any corner or the middle blocked, people as capsules',()=>{
 // The tree against brute force, on random triangles and segments.
 const random=seeded(77),n=600,positions=new Float32Array(n*9),owners=new Uint32Array(n);
 for(let i=0;i<n;i++){const cx=random()*8-4,cy=random()*3,cz=random()*8-4;for(let v=0;v<3;v++){positions[i*9+v*3]=cx+random()*.6-.3;positions[i*9+v*3+1]=cy+random()*.6-.3;positions[i*9+v*3+2]=cz+random()*.6-.3;}owners[i]=i;}
 const tree=buildTriangleTree(positions,owners),raycaster=new THREE.Raycaster(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 for(let k=0;k<150;k++){
  const o=new THREE.Vector3(random()*8-4,random()*3,random()*8-4),t=new THREE.Vector3(random()*8-4,random()*3,random()*8-4),d=t.clone().sub(o),len=d.length();
  raycaster.set(o,d.clone().normalize());raycaster.near=0.001;raycaster.far=len;const hits=raycaster.intersectObject(mesh).filter(h=>h.distance>.001&&h.distance<len-1e-4);
  assert.equal(tree.anyHit(o.x,o.y,o.z,d.x,d.y,d.z,.001/len,1-1e-4/len,()=>true)>=0,hits.length>0,'segment '+k);
 }
 assert.ok(Math.abs(segmentDistance(new THREE.Vector3(0,0,0),new THREE.Vector3(1,0,0),new THREE.Vector3(.5,1,-1),new THREE.Vector3(.5,1,1))-1)<1e-9);
 // A room: the set on its wall, a lamp hanging by it.
 const {room,set,face}=setUp(),lens=new THREE.Vector3(-.066,.1,1.4);
 const targets=[];for(const y of [-.21,0,.21])for(const x of [-.285,0,.285])targets.push(new THREE.Vector3(x,y,0).applyMatrix4(face.matrixWorld));
 const wall=new THREE.Mesh(new THREE.BoxGeometry(6,3,.1),new THREE.MeshStandardMaterial());wall.position.set(0,0,-.4);room.add(wall);
 const bezel=new THREE.Mesh(new THREE.BoxGeometry(.8,.56,.035),new THREE.MeshStandardMaterial());bezel.position.z=.247;set.add(bezel);
 const lamp=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),new THREE.MeshStandardMaterial());room.add(lamp);
 // Just on the line to the top-left corner, clear of every other.
 const tl=targets[6];lamp.position.copy(lens).lerp(tl,.5);room.updateWorldMatrix(true,true);
 const sight=createScreenOcclusion({root:room,exclude:set,centre:new THREE.Vector3(...TV_FACE.position),reach:4.8});
 assert.equal(sight.blocked({origin:lens,targets})?.kind,'room','one corner blocked is blocked');
 assert.equal(sight.blocked({origin:lens,targets:targets.filter(t=>t!==tl)}),null,'the wall behind the set and its own bezel do not block');
 lamp.visible=false;assert.equal(sight.blocked({origin:lens,targets}),null,'what is not drawn does not block');
 lamp.visible=true;lamp.material.transparent=true;lamp.material.opacity=.1;assert.equal(sight.blocked({origin:lens,targets}),null,'clear glass does not block');
 lamp.material.opacity=1;lamp.position.x+=1;room.updateWorldMatrix(true,true);assert.equal(sight.blocked({origin:lens,targets}),null,'moved away: the tree knows it moved');
 lamp.position.copy(lens).lerp(targets[4],.6);room.updateWorldMatrix(true,true);assert.equal(sight.blocked({origin:lens,targets})?.kind,'object','moved into the middle line: it blocks again, raycast on its own');
 room.remove(lamp);const glass=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),new THREE.MeshStandardMaterial());glass.position.copy(lens).lerp(targets[0],.3);room.add(glass);room.updateWorldMatrix(true,true);
 assert.equal(sight.blocked({origin:lens,targets})?.kind,'object','something put down later is seen too');
 room.remove(glass);room.updateWorldMatrix(true,true);
 // People: a capsule from the feet up.
 const person={base:new THREE.Vector3(-.066,-1.7,.8),height:1.8,radius:.34,name:'Thao'};
 assert.equal(sight.blocked({origin:lens,targets,bodies:[person]})?.kind,'body','her head is in the way');
 person.base.y=-2;assert.equal(sight.blocked({origin:lens,targets,bodies:[person]}),null,'lower down she is not');
 assert.equal(sight.blocked({origin:lens,targets,bodies:[person],extra:.2})?.kind,'body','the early warning is a little wider');
 // Held things hang off the camera.
 const camera=cameraAt(lens.toArray(),TV_FACE.position),can=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.15),new THREE.MeshStandardMaterial());
 camera.add(can);can.position.set(0,0,-.3);camera.updateMatrixWorld(true);
 assert.equal(sight.blocked({origin:lens,targets,others:[camera]})?.kind,'object','a can held up in front of the lens');
 assert.ok(sight.triangles>0&&sight.triangles<200);
});

test('patient timeouts count only the time the page was free',()=>{
 let t=0,queue=[];const schedule=(fn,ms)=>{queue.push([fn,ms]);return queue.length;},run=step=>{t+=step;const [fn]=queue.shift();fn();};
 let fired=0;patientTimeout(10000,()=>fired++,{now:()=>t,schedule,cancel(){}});
 run(30000);assert.equal(fired,0,'thirty seconds of a busy page count as a second and a half');
 for(let i=0;i<8;i++)run(1000);assert.equal(fired,0);run(1000);assert.equal(fired,1);
});

// ----- the set with a fake IFrame Player API
class Video extends Element{constructor(){super();this.paused=true;this.loads=0;}load(){this.loads++;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
class Page extends Element{remove(){this.removed=true;}}
function fakeYouTube({playlist=null}={}){
 const players=[];
 class Player{
  constructor(frame,options){this.frame=frame;this.options=options;this.calls=[];this.muted=true;const u=new URL(frame.src,'https://nj22az.github.io/');this.list=u.searchParams.get('list');this.url=u;players.push(this);}
  ready(){this.options.events.onReady({target:this});}
  state(s){this.options.events.onStateChange({data:s,target:this});}
  error(code){this.options.events.onError({data:code,target:this});}
  getPlaylist(){return this.list?playlist:null;}
  cueVideoById(id){this.calls.push(['cue',id]);this.video=id;}loadVideoById(id){this.calls.push(['load',id]);this.video=id;}
  playVideo(){this.calls.push(['play']);}pauseVideo(){this.calls.push(['pause']);}stopVideo(){this.calls.push(['stop']);}destroy(){this.calls.push(['destroy']);}
  mute(){this.muted=true;this.calls.push(['mute']);}unMute(){this.muted=false;this.calls.push(['unMute']);}setVolume(v){this.calls.push(['volume',v]);}
 }
 return {Player,players};
}
function page({YT=null,online=true,scriptFails=false}={}){
 const frames=[];let rafs=[];const head=new Page();
 const doc={createElement:tag=>{const e=new Page();e.tag=tag;if(tag==='iframe')frames.push(e);return e;},querySelector:()=>null,querySelectorAll:()=>[],head,body:new Page(),
  addEventListener(){},removeEventListener(){}};
 head.append=(...items)=>{for(const s of items)if(s.tag==='script'&&scriptFails)queueMicrotask(()=>s.onerror?.());};
 const win={YT:YT?{Player:YT.Player}:undefined,navigator:{onLine:online},location:{origin:'https://nj22az.github.io'},matchMedia:()=>({matches:false}),
  requestAnimationFrame:fn=>rafs.push(fn),getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1'})};
 return {doc,win,frames,frame:()=>{const list=rafs;rafs=[];list.forEach(fn=>fn());}};
}
const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
function televisionIn(world){
 installDOM();document.hidden=false;
 const room=new THREE.Group(),tv=createIzakayaTV({parent:room,position:[0,0,0],yaw:0,video:new Video()});room.updateWorldMatrix(true,true);
 return {room,tv,...world};
}

test('on the set: muted, plays only in clear view, fades in once moving, listens in the tap, pauses and re-mutes away',async()=>{
 const yt=fakeYouTube(),p=page({YT:yt}),{tv}=televisionIn(p);let clock=0;const listening=[],watched=[];
 attachYouTube(tv,{config:{videos:['ozpLFCdrAfk'],uploads:null},sources:tvSources('?audit&tv-embed=/tv-test/embed/'),doc:p.doc,win:p.win,now:()=>clock,random:seeded(2),
  onListening:on=>listening.push(on),onWatch:url=>watched.push(url)});
 assert.equal(tv.video.loads,0,'the old film is not loaded while YouTube has the set');
 const near=cameraAt([-.066,0,1.1],[-.066,0,.273]),far=cameraAt([-.066,.4,3.6],[-.066,0,.273]),go=(camera,extra={})=>tv.place({camera,active:true,paused:false,look:'none',viewport,...extra});
 go(near);await settle();
 const player=yt.players[0];assert.ok(player,'the player is made on the first frame the set is on');
 const src=player.url;assert.equal(src.pathname,'/tv-test/embed/ozpLFCdrAfk');
 for(const [k,v] of Object.entries({playsinline:'1',controls:'0',rel:'0',iv_load_policy:'3',disablekb:'1',mute:'1',autoplay:'0',enablejsapi:'1'}))assert.equal(src.searchParams.get(k),v,k);
 const frame=p.frames[0];assert.match(frame.style.cssText,/pointer-events:none/);
 player.ready();assert.equal(tv.youtube.phase,'ready');assert.deepEqual(player.calls.slice(0,1),[['mute']]);
 assert.equal(go(far).reason,'size','from across the room: the still');assert.ok(!player.calls.some(c=>c[0]==='play'),'nothing plays unseen');
 assert.deepEqual(go(near),{show:true,reason:'clear'});assert.ok(player.calls.some(c=>c[0]==='play'),'in clear view it plays');
 assert.equal(tv.youtube.opacity,0,'not shown over YouTube\'s loading screen');
 player.state(1);clock+=16;go(near);clock+=TV_FADE.in+10;go(near);assert.equal(tv.youtube.opacity,1,'faded in');
 // Where it is drawn: the page's transform against the face's projected corners.
 const face=tv.group.getObjectByName('CRT YouTube face');face.updateWorldMatrix(true,false);
 const drawn=cssCorners(tv.youtube.transform),expected=projectedCorners(near,face);
 for(let i=0;i<4;i++)assert.ok(Math.hypot(drawn[i].x-expected[i].x,drawn[i].y-expected[i].y)<1);
 assert.deepEqual(tv.controls(),{listen:'Listen to the TV',watch:'Watch on the TV'});assert.equal(tv.promptLabel(),'Listen to the TV');
 // Listening: unmute and the volume, inside the tap; the town's sound is told.
 assert.equal(tv.interact(),true);assert.ok(player.calls.some(c=>c[0]==='unMute'));assert.ok(player.calls.some(c=>c[0]==='volume'&&c[1]===TV_VOLUME));
 assert.equal(tv.youtube.muted,false);assert.equal(listening.at(-1),true);assert.equal(tv.promptLabel(),'Mute the TV');
 // A card opening over the game (activities' onOpen) hides and pauses it, and keeps the sound chosen.
 tv.update({camera:near,active:false,paused:true});assert.equal(tv.youtube.opacity,0);assert.equal(tv.youtube.muted,false);
 go(near);player.state(1);clock+=TV_FADE.in+10;go(near);assert.equal(tv.youtube.opacity,1);
 // A resident walking in front: the picture goes at once (hard) and the sound stays chosen.
 const thao=new THREE.Group();thao.position.set(-.066,-1.85,.75);thao.userData.name='Thao';thao.updateMatrixWorld();
 assert.equal(go(near,{bodies:[thao]}).reason,'occluded');assert.equal(tv.youtube.opacity,0);assert.equal(tv.youtube.muted,false);
 assert.ok(player.calls.at(-1)[0]==='pause','paused, not just hidden');
 // Back in view, and then he walks away: it fades, then pauses, and the sound is muted again.
 thao.position.y=-4;thao.updateMatrixWorld();clock+=16;go(near,{bodies:[thao]});player.state(1);clock+=TV_FADE.in+10;go(near,{bodies:[thao]});assert.equal(tv.youtube.opacity,1);
 clock+=16;assert.equal(go(far).reason,'size');assert.equal(tv.youtube.muted,true,'walking away re-mutes');assert.equal(listening.at(-1),false);
 clock+=TV_FADE.out+10;go(far);assert.equal(tv.youtube.opacity,0);assert.equal(player.calls.at(-1)[0],'pause');
 // Another look, or a card over the game: the still.
 assert.equal(go(near,{look:'manga'}).reason,'look');assert.equal(go(near,{paused:true}).reason,'paused');
 // A frame drawn without placing it (another camera has the canvas): hidden at once.
 go(near);player.state(1);clock+=TV_FADE.in+10;go(near);assert.equal(tv.youtube.opacity,1);
 p.frame();p.frame();assert.equal(tv.youtube.opacity,0,'the watchdog hides a page the frame did not place');
 assert.equal(go(null).reason,'camera');
 // Watching properly: the same video in YouTube's own player.
 assert.equal(tv.watch(),true);assert.equal(watched[0],'https://www.youtube.com/embed/ozpLFCdrAfk?playsinline=1&rel=0&autoplay=0');
 // Leaving: stopped and destroyed, the page gone, the sound released.
 const host=p.doc.body.children[0];tv.dispose();
 assert.ok(player.calls.some(c=>c[0]==='stop')&&player.calls.some(c=>c[0]==='destroy'));assert.equal(host.removed,true);assert.equal(listening.at(-1),false);
});

test('the uploads playlist: a random one of all of them, the next random one when it ends, the list when it fails',async()=>{
 const playlist=['ozpLFCdrAfk','dM5hSYHX2wU','RNQ7FRAx0cI','EtsFSLWByIo'],yt=fakeYouTube({playlist}),p=page({YT:yt}),{tv}=televisionIn(p);let clock=0;
 attachYouTube(tv,{config:TV_YOUTUBE,sources:tvSources(''),doc:p.doc,win:p.win,now:()=>clock,random:seeded(4)});
 const near=cameraAt([-.066,0,1.1],[-.066,0,.273]),go=()=>tv.place({camera:near,active:true,look:'none',viewport});
 go();await settle();const player=yt.players[0];
 assert.equal(player.url.pathname,'/embed/videoseries');assert.equal(player.url.searchParams.get('list'),TV_YOUTUBE.uploads);
 assert.equal(player.url.host,'www.youtube-nocookie.com');
 player.ready();assert.equal(tv.youtube.phase,'ready');assert.equal(tv.youtube.fromUploads,true);assert.deepEqual(tv.youtube.ids,playlist);
 const first=tv.youtube.video;assert.ok(playlist.includes(first));assert.deepEqual(player.calls.find(c=>c[0]==='cue'),['cue',first]);
 go();player.state(1);
 const shown=[first];for(let i=0;i<9;i++){player.state(0);shown.push(tv.youtube.video);go();}
 for(let i=1;i<shown.length;i++)assert.notEqual(shown[i],shown[i-1],'never the same twice in a row');
 assert.equal(player.calls.at(-1)[0]==='load'||player.calls.some(c=>c[0]==='load'),true,'in view, the next one loads and plays');
 // Videos that will not play embedded are skipped; when none will, the set goes back to its own film.
 for(let i=0;i<8&&tv.youtube.phase!=='failed';i++)player.error(150);
 assert.equal(tv.youtube.phase,'failed');assert.match(tv.youtube.failure,/150/);
 tv.update({camera:near,active:true});await settle();assert.equal(tv.video.loads,1,'the local video/izakaya-ad.mp4 plays as before');
 assert.equal(tv.controls(),null);tv.dispose();
});

test('fallbacks: offline, the API unreachable, or a playlist that never arrives',async()=>{
 const near=cameraAt([-.066,0,1.1],[-.066,0,.273]);
 {const p=page({online:false}),{tv}=televisionIn(p);attachYouTube(tv,{doc:p.doc,win:p.win,sources:tvSources('')});
  tv.place({camera:near,active:true,look:'none',viewport});assert.equal(tv.youtube.failure,'offline');
  tv.update({camera:near,active:true});await settle();assert.equal(tv.video.loads,1);tv.dispose();}
 {const p=page({scriptFails:true}),{tv}=televisionIn(p);attachYouTube(tv,{doc:p.doc,win:p.win,sources:tvSources('')});
  tv.place({camera:near,active:true,look:'none',viewport});await settle();assert.equal(tv.youtube.phase,'failed');assert.match(tv.youtube.failure,/unreachable/);
  tv.update({camera:near,active:true});await settle();assert.equal(tv.video.loads,1);tv.dispose();}
 // ?tv-youtube=0 in an audit leaves the set as it was.
 {const p=page(),{tv}=televisionIn(p);attachYouTube(tv,{doc:p.doc,win:p.win,sources:tvSources('?audit&tv-youtube=0')});assert.equal(tv.place,undefined);tv.dispose();}
});

test('the rail offers the other TV choice beside the prompt',()=>{
 const standing=contextActions({playing:true,targetLabel:'Listen to the TV',tvLabel:'Watch on the TV',inside:true,canExit:false});
 assert.deepEqual(standing.actions.map(a=>[a.id,a.label,a.primary]),[['act','Listen to the TV',true],['tvButton','Watch on the TV',false]]);
 const seated=contextActions({playing:true,seated:true,table:true,canOrder:true,tvLabel:'Mute the TV'});
 assert.ok(seated.actions.some(a=>a.id==='tvButton'&&a.label==='Mute the TV'&&!a.primary));
 assert.ok(!contextActions({playing:true,targetLabel:'Sit at the counter',inside:true}).actions.some(a=>a.id==='tvButton'));
});
