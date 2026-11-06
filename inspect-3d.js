import * as THREE from './vendor/three.module.js';
import {makeContentObject} from './content-items.js';
import {ITEMS} from './content-data.js';

export function createInspector({scene,camera,renderer,canvas,onInspect,onReturn=()=>{},onLink,onContact,resetInput}){
  let held=null,item=null,saved=null,drag=null,zoom=1.9,pan=new THREE.Vector2(),idle=0;
  // Every finger on the glass, so two of them pinch to zoom instead of fighting over the drag.
  const touches=new Map();let pinch=null;
  const overlayCamera=new THREE.PerspectiveCamera(40,camera.aspect,.01,240);
  const modelScene=new THREE.Scene();modelScene.add(new THREE.HemisphereLight(0xfff2dd,0x48575c,1.8));
  const tray=new THREE.Group();scene.add(tray);tray.visible=false;
  const light=new THREE.PointLight(0xffeed1,4,5);light.position.set(0,1,2);tray.add(light);
  const caption=document.createElement('section');caption.id='inspect-caption';caption.hidden=true;caption.setAttribute('aria-label','Object inspection controls');
  const title=document.createElement('span');title.setAttribute('aria-live','polite');caption.append(title);
  // Orbit controls stay in their own leading group; action buttons never interleave with them.
  const rotate=document.createElement('div');rotate.className='inspect-rotate';caption.append(rotate);
  const actions=document.createElement('div');actions.className='inspect-actions';caption.append(actions);
  document.body.append(caption);
  const button=(parent,label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b;};
  button(rotate,'↶',()=>held.rotation.y-=.2);button(rotate,'↷',()=>held.rotation.y+=.2);button(rotate,'−',()=>zoom=Math.min(3.5,zoom+.15));button(rotate,'+',()=>zoom=Math.max(.6,zoom-.15));
  const pageBack=button(actions,'← Page',()=>held?.userData.reader.next(-1));const pageNext=button(actions,'Page →',()=>held?.userData.reader.next(1));
  const flipBtn=button(actions,'FLIP / OPEN',()=>held?.userData.reader.flip());const resetBtn=button(actions,'RESET',reset);
  const secondary=button(actions,'CLOSE',close);
  const volume=button(actions,'NEXT VOLUME',()=>{const books=ITEMS.filter(i=>i.kind==='book');open(books[(books.findIndex(i=>i.id===item.id)+1)%books.length]);});
  const buyBtn=button(actions,'Buy',()=>{const buy=item?.onBuy;close();buy?.();});
  const talkBtn=button(actions,'Talk to Thuan',()=>{const talk=item?.onTalk;close();talk?.();});
  const putBackBtn=button(actions,'Put back',close);
  buyBtn.hidden=talkBtn.hidden=putBackBtn.hidden=true;
  function reset(){if(!held)return;held.rotation.set(0,0,0);zoom=item?.kind==='shop-good'?1.35:1.9;pan.set(0,0);held.userData.reader.open();}
  function close(){if(!held)return;const shop=item?.kind==='shop-good';onReturn(item);tray.remove(held);scene.add(tray);if(!shop)held.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material])){m?.map?.dispose();m?.dispose();}});held=null;item=null;tray.visible=false;caption.hidden=true;renderer.setPixelRatio(saved.dpr);document.documentElement.classList.remove('inspecting');window.__JOHANSSON_INSPECTING__=false;resetInput();saved.focus?.focus?.();}
  function open(data){if(held)close();saved={dpr:renderer.getPixelRatio(),focus:document.activeElement};document.exitPointerLock?.();resetInput();item=data;held=makeContentObject(item);held.traverse(o=>{if(o.isMesh){o.renderOrder=1000;for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.depthTest=item.kind==='printed-model';m.depthWrite=item.kind==='printed-model';}}});(item.kind==='printed-model'?modelScene:scene).add(tray);tray.add(held);const shop=item.kind==='shop-good';volume.hidden=item.kind!=='book';pageBack.hidden=pageNext.hidden=flipBtn.hidden=shop||item.kind==='printed-model';resetBtn.hidden=shop;secondary.hidden=shop;buyBtn.hidden=!shop;putBackBtn.hidden=!shop;talkBtn.hidden=!shop||!(item.canTalk?.());tray.position.copy(camera.position);tray.quaternion.copy(camera.quaternion);overlayCamera.position.copy(camera.position);overlayCamera.quaternion.copy(camera.quaternion);tray.visible=true;caption.hidden=false;document.documentElement.classList.add('inspecting');window.__JOHANSSON_INSPECTING__=true;renderer.setPixelRatio(Math.max(.8,saved.dpr-.35));reset();onInspect(item);(shop?putBackBtn:secondary).focus();}
  function stop(e){e.preventDefault();e.stopImmediatePropagation();}
  function focusable(){return [...rotate.children,...actions.children].filter(b=>!b.hidden);}
  canvas.addEventListener('pointerdown',e=>{if(!held)return;stop(e);idle=0;touches.set(e.pointerId,[e.clientX,e.clientY]);if(touches.size===2){const [a,b]=[...touches.values()];pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1])||1,zoom};drag=null;return;}if(touches.size>2)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,pan:e.button===2||e.altKey};canvas.setPointerCapture(e.pointerId);},{capture:true});
  canvas.addEventListener('pointermove',e=>{if(!held)return;if(touches.has(e.pointerId))touches.set(e.pointerId,[e.clientX,e.clientY]);if(pinch&&touches.size>=2){stop(e);idle=0;const [a,b]=[...touches.values()];zoom=THREE.MathUtils.clamp(pinch.zoom*pinch.distance/(Math.hypot(a[0]-b[0],a[1]-b[1])||1),.6,3.5);return;}if(!drag)return;stop(e);idle=0;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.pan){pan.x+=dx*.002;pan.y-=dy*.002;}else{held.rotation.y+=dx*.008;held.rotation.x+=dy*.008;}drag.x=e.clientX;drag.y=e.clientY;},{capture:true});
  canvas.addEventListener('pointerup',e=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;if(!held)return;stop(e);if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6){if(e.clientX>innerWidth*.7)held.userData.reader.next(1);else if(e.clientX<innerWidth*.3)held.userData.reader.next(-1);}drag=null;},{capture:true});
  canvas.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);pinch=null;drag=null;});
  for(const name of ['click','contextmenu','touchstart','touchmove','touchend'])canvas.addEventListener(name,e=>{if(held)stop(e);},{capture:true,passive:false});
  canvas.addEventListener('wheel',e=>{if(!held)return;stop(e);idle=0;zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.002,.6,3.5);},{capture:true,passive:false});
  // Q tap puts back / closes. Shift+Q zooms out; E zooms in. I/J/K/L orbit while arrows turn pages.
  document.addEventListener('keydown',e=>{if(!held)return;if(e.key==='Tab'){const buttons=focusable();const n=buttons.indexOf(document.activeElement);stop(e);buttons[(n+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}stop(e);switch(e.code){case 'Escape':close();break;case 'KeyQ':if(e.shiftKey)zoom=Math.min(3.5,zoom+.12);else close();break;case 'KeyE':zoom=Math.max(.8,zoom-.12);break;case 'KeyR':reset();break;case 'KeyF':held.userData.reader.flip();break;case 'ArrowLeft':held.userData.reader.next(-1);break;case 'ArrowRight':held.userData.reader.next(1);break;case 'KeyJ':held.rotation.y-=.12;break;case 'KeyL':held.rotation.y+=.12;break;case 'KeyI':held.rotation.x-=.12;break;case 'KeyK':held.rotation.x+=.12;break;}},{capture:true});
  return {open,close,
  // The ink pass linearises depth against the camera actually in use, and this view
  // has its own clip planes.
  camera:overlayCamera,
  control(input,dt){if(!held)return;held.rotation.y+=input.x*dt*2;held.rotation.x+=input.y*dt*2;zoom=THREE.MathUtils.clamp(zoom+input.zoom*dt*1.2,.8,3.5);if(input.reset)reset();},get active(){return !!held;},render(dt){if(!held)return;overlayCamera.aspect=camera.aspect;overlayCamera.updateProjectionMatrix();// A shop good left alone turns slowly on the tray, like a product on a display stand.
    idle+=dt;if(item.kind==='shop-good'&&!drag&&!pinch&&idle>1.2)held.rotation.y+=dt*.45;
    held.position.set(pan.x,pan.y,-zoom);light.position.set(0,1,-zoom+1);held.userData.reader.update(dt);if(item.kind==='shop-good'){title.textContent=(item.caption||item.title)+(item.liftLine?'\n"'+item.liftLine+'"':'')+'\nDrag to turn · pinch or scroll to zoom';}else title.textContent=item.title+(item.kind==='printed-model'?' · Form 3D':' · '+held.userData.reader.page+'/'+item.pages.length)+' · Drag rotate · Right-drag pan · IJKL orbit · E / Shift+Q zoom · Q close';renderer.render(scene,overlayCamera);if(item.kind==='printed-model'){const autoClear=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth?.();renderer.render(modelScene,overlayCamera);renderer.autoClear=autoClear;}}};
}
