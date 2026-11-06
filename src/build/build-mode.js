import * as THREE from '../../vendor/three.module.js';
import {catalogueEntry} from './catalogue.js';

/**
 * Build mode: the town held still, a camera that orbits a point, and the mouse to place, pick, move and turn props.
 *
 *   drag            orbit            shift + drag   pan            wheel   zoom
 *   click           place the chosen piece (or pick one already placed)
 *   R / shift + R   turn by 15°      Delete         remove the picked piece      Esc   stop placing / let go
 *   Ctrl/⌘ + Z      undo             Shift + Ctrl/⌘ + Z, Ctrl + Y   redo
 *
 * A see-through preview of the piece follows the mouse: green where it can stand, red where it cannot, with the
 * reasons in status(). Runs with ?audit&build; the Town Studio app drives it through window.__JOHANSSON_BUILDER__.
 */
const STEP=Math.PI/12;
const GOOD=new THREE.Color(0x3fae7a),BAD=new THREE.Color(0xd2493b),PICKED=0xffc94a;

/**
 * stage: how build mode holds the game still and points its camera: {hold(), release(), show(pos,at)}. Without one it
 * uses the audit hooks (?audit). keep: page elements to leave visible (the decorating bar).
 */
export function createBuildMode({canvas,camera,group,placements,factory,heightAt,getAudit,getStart,lookup=catalogueEntry,stage=null,keep=()=>[],limits={min:3,max:80,start:24}}){
 stage=stage||{
  hold(){const A=getAudit?.();if(!A)throw Error('Build mode needs ?audit as well as ?build.');this.was=A.frozen;A.frozen=true;A.renderFrozen=false;},
  release(){const A=getAudit?.();if(A){A.camera=null;A.frozen=!!this.was;}},
  show(pos,at){const A=getAudit?.();if(A){A.camera={pos,at};A.step?.(0);}},
 };
 let active=false,kind=null,note='',yaw=0,picked=null,hover=null,ghost=null,box=null,result=null;
 // From above and to the side, high enough to clear the two-storey roofs of Main Street.
 const view={x:0,z:0,azimuth:Math.PI*.75,elevation:1.05,distance:limits.start};
 let hidden=[];
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();

 function applyView(){
  if(!active)return;
  const y=heightAt(view.x,view.z),r=view.distance*Math.cos(view.elevation);
  stage.show([view.x+Math.sin(view.azimuth)*r,y+view.distance*Math.sin(view.elevation),view.z+Math.cos(view.azimuth)*r],[view.x,y+.4,view.z]);
 }
 /** Where the mouse meets the ground: the ray against a level plane, settled on the real ground height. */
 function groundAt(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  ndc.set((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height)*2+1);
  camera.updateMatrixWorld();ray.setFromCamera(ndc,camera);
  let y=0,hit=null;
  for(let i=0;i<3;i++){const t=(y-ray.ray.origin.y)/ray.ray.direction.y;if(!(t>0))return null;hit=ray.ray.at(t,new THREE.Vector3());y=heightAt(hit.x,hit.z);}
  return hit&&{x:hit.x,z:hit.z};
 }
 function pickedAt(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  ndc.set((clientX-r.left)/r.width*2-1,-((clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
  const objects=group.children.filter(o=>o.userData.placement);
  for(const h of ray.intersectObjects(objects,true)){let o=h.object;while(o&&!o.userData.placement)o=o.parent;if(o)return o.userData.placement;}
  return null;
 }

 function dropGhost(){if(ghost){ghost.removeFromParent();ghost.traverse(o=>{if(o.isMesh)o.material.dispose();});ghost=null;}}
 function makeGhost(){
  dropGhost();if(!kind)return;
  const e=lookup(kind);ghost=factory[e.make](0,0,0).object;ghost.name='build-preview';
  ghost.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshBasicMaterial({color:GOOD,transparent:true,opacity:.5,depthWrite:false});o.castShadow=false;o.receiveShadow=false;o.raycast=()=>{};}});
  ghost.visible=false;group.add(ghost);
 }
 function showGhost(at){
  if(!ghost)return;
  if(!at){ghost.visible=false;hover=null;return;}
  const target=picked?{...entryOf(picked),x:at.x,z:at.z,yaw}:{kind,x:at.x,z:at.z,yaw,note:note||'(why here?)'};
  const problems=placements.check(target);
  ghost.position.set(at.x,heightAt(at.x,at.z),at.z);ghost.rotation.y=yaw;ghost.visible=true;
  ghost.traverse(o=>{if(o.isMesh)o.material.color.copy(problems.length?BAD:GOOD);});
  hover={x:+at.x.toFixed(2),z:+at.z.toFixed(2),ok:!problems.length,problems};
 }
 function outline(){
  if(box){box.removeFromParent();box.geometry.dispose();box.material.dispose();box=null;}
  const o=picked&&group.children.find(c=>c.userData.placement===picked);
  if(o){box=new THREE.BoxHelper(o,PICKED);box.name='build-picked';group.add(box);}
 }
 const entryOf=id=>placements.list().find(p=>p.id===id)||placements.held().find(p=>p.id===id);
 /** After an undo or redo the picked piece may be gone or somewhere else: let go of it or follow it. */
 function afterHistory(){if(picked&&!entryOf(picked))pick(null);else if(picked)pick(picked);if(hover)showGhost(hover);applyView();}
 function pick(id){
  picked=id;outline();
  const p=id&&entryOf(id);
  if(p){kind=p.kind;yaw=p.yaw;makeGhost();}else{kind=null;dropGhost();}
  applyView();
 }

 // Pointer: a press that does not travel is a click; one that does orbits (or pans with shift).
 let press=null,last=null;
 const down=e=>{if(!active||e.button!==0)return;press={x:e.clientX,y:e.clientY,moved:false};last=press;canvas.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopImmediatePropagation();};
 let hoverAt=null,hoverFrame=0;
 const nextFrame=globalThis.requestAnimationFrame?f=>globalThis.requestAnimationFrame(f):f=>setTimeout(f,16);
 const move=e=>{
  if(!active)return;
  if(press){
   const dx=e.clientX-last.x,dy=e.clientY-last.y;last={x:e.clientX,y:e.clientY};
   if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>4)press.moved=true;
   if(press.moved){
    if(e.shiftKey){const s=view.distance*.0016,c=Math.cos(view.azimuth),n=Math.sin(view.azimuth);view.x+=(-dx*c-dy*n)*s;view.z+=(dx*n-dy*c)*s;}
    else{view.azimuth-=dx*.006;view.elevation=Math.min(1.45,Math.max(.12,view.elevation+dy*.004));}
    applyView();
   }
   e.stopPropagation();return;
  }
  // The ghost's check (with the walkway's) runs once a frame at most, for where the pointer is now: a pointer reports
  // up to 120 moves a second on an iPad, and a frame shows only the last one.
  hoverAt={x:e.clientX,y:e.clientY};
  if(!hoverFrame)hoverFrame=nextFrame(()=>{hoverFrame=0;if(!active||press||!hoverAt)return;showGhost(groundAt(hoverAt.x,hoverAt.y));applyView();});
 };
 const up=e=>{
  if(!active||!press)return;const click=!press.moved;press=null;e.stopPropagation();
  if(!click)return;
  const at=groundAt(e.clientX,e.clientY);
  if(picked&&at){const r=result=placements.move(picked,{x:at.x,z:at.z,yaw});if(r.ok)pick(r.id);else showGhost(at);return;}
  if(kind&&at){result=placements.place({kind,x:at.x,z:at.z,yaw,note});showGhost(at);applyView();return;}
  const id=pickedAt(e.clientX,e.clientY);if(id)pick(id);
 };
 const wheel=e=>{if(!active)return;view.distance=Math.min(limits.max,Math.max(limits.min,view.distance*Math.exp(e.deltaY*.0012)));applyView();e.preventDefault();e.stopPropagation();};
 // While building, no key reaches the game (E would make Johansson stand up, W walk him off).
 const key=e=>{
  if(!active||e.target?.tagName==='INPUT')return;
  e.stopPropagation();
  if(e.type!=='keydown'||e.repeat)return;   // one press, one turn: the release and the key's auto-repeat do nothing
  const mod=e.ctrlKey||e.metaKey,k=String(e.key).toLowerCase();
  if(mod&&k==='z'){(e.shiftKey?api.redo:api.undo)();e.preventDefault();return;}
  if(mod&&k==='y'){api.redo();e.preventDefault();return;}
  if(mod)return;   // other shortcuts (copy, reload) are the browser's
  if(e.key==='r'||e.key==='R'){api.turn(e.shiftKey?-1:1);e.preventDefault();}
  else if(e.key==='Delete'&&picked){api.remove(picked);e.preventDefault();}
  else if(e.key==='Escape')api.choose(null);
 };
 // The click that follows a press is the builder's too, never the game's "walk there".
 const click=e=>{if(active&&e.target===canvas){e.stopPropagation();e.preventDefault();}};
 const cancel=()=>{press=null;};
 const LISTEN=[['pointercancel',()=>cancel],['pointerdown',()=>down],['pointermove',()=>move],['pointerup',()=>up],['wheel',()=>wheel],['click',()=>click]];

 const api={
  /** Hold the town still and take over the mouse. */
  enter(){
   if(active)return api.status();
   stage.hold();active=true;
   const s=getStart?.();if(s){view.x=s.x;view.z=s.z;}
   for(const [t,f] of LISTEN)canvas.addEventListener(t,f(),{capture:true,passive:false});
   window.addEventListener('keydown',key,true);window.addEventListener('keyup',key,true);
   // The game's prompts, clock and menus stay out of the builder's view.
   const kept=keep();
   hidden=[...document.body.children].filter(el=>el!==canvas&&!el.contains(canvas)&&!kept.includes(el)&&el.style.visibility!=='hidden');
   for(const el of hidden)el.style.visibility='hidden';
   applyView();return api.status();
  },
  leave(){
   if(!active)return;active=false;pick(null);dropGhost();
   for(const [t,f] of LISTEN)canvas.removeEventListener(t,f(),{capture:true});
   window.removeEventListener('keydown',key,true);window.removeEventListener('keyup',key,true);
   for(const el of hidden)el.style.visibility='';hidden=[];
   stage.release();
  },
  /** The piece to place next (a catalogue id), or null to stop placing. */
  choose(id,why){
   if(id&&!lookup(id))throw Error('No '+id+' in the catalogue.');
   picked=null;outline();kind=id;if(why!==undefined)note=String(why);yaw=0;makeGhost();applyView();return api.status();
  },
  why(text){note=String(text||'');return api.status();},
  turn(dir=1){
   yaw=((yaw+dir*STEP)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
   if(picked){const r=placements.move(picked,{yaw},{merge:'turn'});if(!r.ok)yaw=((yaw-dir*STEP)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);else pick(r.id);}
   if(ghost){ghost.rotation.y=yaw;if(hover)showGhost(hover);}
   applyView();return api.status();
  },
  pick,
  remove(id){const ok=placements.remove(id);if(picked===id)pick(null);applyView();return ok;},
  /** Takes back the last place, move or remove (placements.undo); says why when it cannot. */
  undo(){result={...placements.undo(),undo:true,at:Date.now()};afterHistory();return api.status();},
  /** Does again what undo took back. */
  redo(){result={...placements.redo(),redo:true,at:Date.now()};afterHistory();return api.status();},
  /** Fly to a point (or a placed piece). */
  look(x,z,distance){view.x=x;view.z=z;if(distance)view.distance=distance;applyView();},
  orbit(dAzimuth=0,dElevation=0,zoom=1){view.azimuth+=dAzimuth;view.elevation=Math.min(1.45,Math.max(.12,view.elevation+dElevation));view.distance=Math.min(limits.max,Math.max(limits.min,view.distance*zoom));applyView();},
  status(){const h=placements.history?.()||{undo:0,redo:0};return {active,kind,why:note,yaw:+yaw.toFixed(4),picked,hover,result,view:{...view},count:placements.list().length,held:placements.held().length,undo:h.undo,redo:h.redo};},
 };
 return api;
}
