import {createPlacements} from './placements.js';
import {createBuildMode} from './build-mode.js';
import * as THREE from '../../vendor/three.module.js';
import {HOME_CATALOGUE,homeFurnitureFactory,restoreHomeItems} from './home-furniture.js';

/**
 * Arranging furniture in Johansson's own rooms: the builder's rules and mouse, inside the home, saved with this player
 * (state.homeDecor.items). The room is seen from above like a dollhouse, the ceiling lifted off while you work. This
 * runs in Johansson Studio (avatar-creator/home.js), which hands the result to World (src/studio-handoff.js).
 *
 * floor(x,z): true on the open floor of the main room (not the WC or the bath); keepClear: [[x,z,size]] squares kept
 * free (the genkan, and in front of the wardrobe, the bookshelf, the futon and the doors). A piece must also leave a
 * 0.78 m way between them (HOME_PASSAGE below); pieces already saved keep their spot.
 */
const lookup=id=>HOME_CATALOGUE.find(f=>f.id===id)||null;
/**
 * The clear width a piece must leave on the ways of daily life at home: Japan's Housing Performance Indication Standard
 * (住宅性能表示基準, elderly-care grade 3) asks 780 mm (750 mm past a pillar); a 3-shaku (910 mm) grid corridor gives it.
 * Kept here, not imported, so Studio on an iPad never pairs this file with an older cached placements.js that lacks it.
 */
export const HOME_PASSAGE=.78;

/**
 * The furniture as it was arranged in Johansson Studio, standing in World's copy of the home. World only shows it:
 * arranging is Studio's (src/studio-handoff.js). reload() puts it back after Studio changes it while World is open.
 */
export function showHomeFurniture({group,colliders,state,floor,keepClear}){
 const placements=createPlacements({group,colliders,factory:homeFurnitureFactory(),walkable:floor,heightAt:()=>0,doors:keepClear,lookup,needWhy:false,passage:HOME_PASSAGE,passageOnLoad:false});
 const load=()=>placements.load(restoreHomeItems(state.homeDecor?.items).map(p=>({...p,note:''})));
 let skipped=load();
 return {placements,get skipped(){return skipped;},reload(){for(const p of [...placements.list(),...placements.held()])placements.remove(p.id);skipped=load();return skipped;}};
}

export function createHomeDecorating({group,colliders,state,save,canvas,camera,floor,keepClear,stage,ceilingAbove=2.5,onClose=()=>{}}){
 const factory=homeFurnitureFactory();
 let persist=false;
 const placements=createPlacements({group,colliders,factory,walkable:floor,heightAt:()=>0,doors:keepClear,lookup,needWhy:false,passage:HOME_PASSAGE,passageOnLoad:false,
  offGround:'Part of it is outside the open floor (a wall, the genkan step, the WC or the bath).',
  onChange:()=>{if(!persist)return;state.homeDecor={...(state.homeDecor||{}),items:placements.list().map(({id,kind,x,z,yaw})=>({id,kind,x:+x.toFixed(3),z:+z.toFixed(3),yaw:+yaw.toFixed(4)}))};save();}});
 const skipped=placements.load(restoreHomeItems(state.homeDecor?.items).map(p=>({...p,note:''})));persist=true;
 let bar=null,ceiling=[];
 const mode=createBuildMode({canvas,camera,group,placements,factory,heightAt:()=>0,lookup,stage,keep:()=>bar?[bar]:[],
  // The furniture tool's view starts over the middle of the floor it furnishes.
  limits:{min:2.5,max:10,start:7},getStart:()=>{let n=0,x=0,z=0;for(let i=-6;i<=6;i+=.5)for(let j=-5;j<=5;j+=.5)if(floor(i,j)){x+=i;z+=j;n++;}return n?{x:x/n,z:z/n}:{x:0,z:0};}});

 function makeBar(){
  const el=document.createElement('div');el.id='decorBar';el.setAttribute('role','toolbar');el.setAttribute('aria-label','Arrange furniture');
  el.style.cssText='position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;gap:8px;'
   +'max-width:min(920px,calc(100vw - 32px));padding:12px 14px;background:#fff;color:#000;border:1px solid #e5e5e5;border-radius:12px;box-shadow:0 2px 8px #00000014;font:700 14px/1.4 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",Arial,sans-serif';
  const row=(cls)=>{const r=document.createElement('div');r.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center';if(cls)r.className=cls;el.append(r);return r;};
  const btn=(parent,label,fn,title='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;
   b.style.cssText='font:inherit;min-height:40px;padding:8px 12px;border-radius:8px;border:1px solid #e5e5e5;background:#f7f8f9;color:inherit;cursor:pointer';b.onclick=fn;parent.append(b);return b;};
  const pieces=row();
  const buttons=HOME_CATALOGUE.map(f=>{const b=btn(pieces,f.name,()=>{mode.choose(f.id);mark();},f.purpose);b.dataset.id=f.id;return b;});
  const tools=row();tools.style.flexWrap='nowrap';
  btn(tools,'Turn ⟲',()=>mode.turn(-1),'R');btn(tools,'Turn ⟳',()=>mode.turn(1),'Shift R');
  btn(tools,'Remove',()=>{const id=mode.status().picked;if(id)mode.remove(id);},'Delete');
  const undoBtn=btn(tools,'Undo',()=>mode.undo(),'Ctrl Z');
  const redoBtn=btn(tools,'Redo',()=>mode.redo(),'Shift Ctrl Z');
  btn(tools,'Stop',()=>{mode.choose(null);mark();},'Esc');
  const spacer=document.createElement('span');spacer.style.flex='1';tools.append(spacer);
  const done=btn(tools,'Done',close);
  const status=document.createElement('div');status.style.cssText='font-weight:400;color:#666;min-height:1.4em';el.append(status);done.style.background='#06c755';done.style.color='#fff';done.style.borderColor='#06c755';
  function mark(){const k=mode.status().kind;for(const b of buttons){const on=b.dataset.id===k;b.style.background=on?'#06c755':'#f7f8f9';b.style.borderColor=on?'#06c755':'#e5e5e5';b.style.color=on?'#fff':'inherit';}}
  const tick=()=>{if(!bar)return;const s=mode.status();
   undoBtn.disabled=!s.undo;undoBtn.style.opacity=s.undo?'1':'.45';redoBtn.disabled=!s.redo;redoBtn.style.opacity=s.redo?'1':'.45';
   const said=(s.result?.undo||s.result?.redo)&&Date.now()-s.result.at<3000?(s.result.ok?s.result.undid:s.result.problems[0]):null;   // for three seconds
   status.textContent=said?said:s.picked?'Click to move it · R turns it · Remove takes it away':s.hover&&!s.hover.ok?s.hover.problems[0]:s.kind?'Click on the floor to place it':'Choose a piece, or click one in the room to move it';
   mark();requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
  return el;
 }
 function liftCeiling(on){
  if(on){ceiling=[];group.traverse(o=>{if(o.isMesh&&o.visible){o.updateWorldMatrix(true,false);const y=o.getWorldPosition(new THREE.Vector3()).y;if(y>ceilingAbove){ceiling.push(o);o.visible=false;}}});}
  else{ceiling.forEach(o=>o.visible=true);ceiling=[];}
 }
 function open(){
  if(bar)return;
  bar=makeBar();document.body.append(bar);liftCeiling(true);mode.enter();
 }
 function close(){
  if(!bar)return;
  mode.leave();liftCeiling(false);bar.remove();bar=null;onClose();
 }
 return {open,close,get open_(){return !!bar;},placements,mode,skipped,status:()=>mode.status()};
}
