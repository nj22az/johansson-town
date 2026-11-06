/**
 * The Look picker: a strip along the foot of the screen, as in a camera app, with the town left in full view above
 * it. Each look is a small picture of the town as it is now, drawn in that look (render/look-previews.js), with a
 * one-word name; until a picture is ready the same little house stands in, drawn in each style (the owner,
 * 22 October 2026: "The menus are too text heavy, can they be more icon based?"; 29 October 2026: "shader picking is a
 * surprise I want to be able to choose from a menu like in the camera app you are making and see the results", "In
 * world the menu blocks the whole screen the camera app looks more sophisticated"). A tap draws the town in that look
 * at once and the strip stays open, so looks are compared on the town itself; ×, Escape or a tap on the town closes
 * it. While it is open it keeps every key and pointer from reaching the town, as the free camera does.
 */
import {svg as icon} from './icons.js';

const PALETTES={
 none:{sky:'#8fc9ef',ground:'#7fbf5a',wall:'#f4ead3',roof:'#d8342c',door:'#7a5236',sun:'#ffd447'},
 mono:{sky:'#c9c9c9',ground:'#7a7a7a',wall:'#efefef',roof:'#4a4a4a',door:'#2e2e2e',sun:'#ffffff'},
 sepia:{sky:'#e4cfa3',ground:'#8f6d42',wall:'#f3e6c8',roof:'#6e4a2a',door:'#4a321c',sun:'#fff3d4'},
 pocket:{sky:'#c8d48a',ground:'#3e6238',wall:'#829e4c',roof:'#183020',door:'#183020',sun:'#c8d48a'},
 snes:{sky:'#58a8f8',ground:'#38b838',wall:'#f8e8b8',roof:'#e83820',door:'#885028',sun:'#f8d838'},
 lines:{sky:'#faf8f2',ground:'#faf8f2',wall:'#faf8f2',roof:'#faf8f2',door:'#faf8f2',sun:'#faf8f2'},
 crt:{sky:'#7fb4d6',ground:'#6aa152',wall:'#e8dcc0',roof:'#c0392b',door:'#6a4a32',sun:'#f2cf55'},
 manga:{sky:'#f7f6f2',ground:'#f7f6f2',wall:'#f7f6f2',roof:'#141418',door:'#141418',sun:'#f7f6f2'},
 crayon:{sky:'#cfe6f5',ground:'#cfe8bf',wall:'#fbf3e2',roof:'#f2a99b',door:'#c9a184',sun:'#ffe9a0'},
 tilt:{sky:'#7cc4f5',ground:'#5fc24a',wall:'#fff1d0',roof:'#ec3b2a',door:'#7a4a2a',sun:'#ffd23f'},
 print:{sky:'#2e5c8a',ground:'#7d9a6a',wall:'#f1e6cc',roof:'#c8452e',door:'#2a2420',sun:'#f1e6cc'},
 watercolour:{sky:'#bcdcf0',ground:'#bfe0a8',wall:'#fbf4e6',roof:'#f08a7a',door:'#c49a7c',sun:'#ffe08a'},
 flat:{sky:'#6fc3ff',ground:'#7ed957',wall:'#fff6d8',roof:'#ff5a3c',door:'#8a5a2b',sun:'#ffd93b'},
 sketchbook:{sky:'#dce6df',ground:'#b9c6a1',wall:'#f5ead5',roof:'#c8a191',door:'#958778',sun:'#f2e6bd'},
 riso:{sky:'#cbe0da',ground:'#73a7a4',wall:'#fbefd5',roof:'#d8594f',door:'#274b58',sun:'#f3baa1'},
 pencilManga:{sky:'#fff',ground:'#eeece7',wall:'#fff',roof:'#646069',door:'#38353d',sun:'#fff'},
 brushOil:{sky:'#81a1c6',ground:'#648048',wall:'#e5bf95',roof:'#b55732',door:'#433a37',sun:'#f1cc6b'},
 stamp:{sky:'#fbf4df',ground:'#fbf4df',wall:'#fbf4df',roof:'#7d1729',door:'#7d1729',sun:'#fbf4df'},
 oil:{sky:'#5e8fc4',ground:'#4f8a3a',wall:'#e9d3a8',roof:'#a8321f',door:'#4a2c18',sun:'#f2b632'},
};

/** The little scene in one look, as an SVG string (48×48). Every swatch is the same house, so the style is the difference. */
export function lookSwatch(id,uid=id){
 const media={sketchbook:'crayon',pencilManga:'crayon',brushOil:'oil',riso:'print',stamp:'lines'}[id]||id;
 const p=PALETTES[id]||PALETTES.none,pixel=media==='pocket'||media==='snes';
 const ink=media==='lines'?'#2b2b33':media==='flat'?'#2b2121':media==='manga'||media==='print'?'#141418':media==='crayon'?'#6c6670':media==='watercolour'?'#9a8f88':null;
 const line=ink?` stroke="${ink}" stroke-width="${media==='flat'?2.6:media==='manga'||media==='print'?2:media==='crayon'||media==='watercolour'?1.2:1.5}" stroke-linejoin="round"${media==='watercolour'?' stroke-opacity=".55"':''}`:'';
 const defs=[],over=[];
 if(media==='manga'){
  defs.push(`<pattern id="d${uid}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="1.05" fill="#141418"/></pattern>`,
   `<pattern id="h${uid}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="3" fill="#141418"/></pattern>`);
  over.push(`<rect width="48" height="30" fill="url(#d${uid})"/>`,`<rect y="30" width="48" height="18" fill="url(#h${uid})"/>`);
 }
 if(media==='crayon'){
  defs.push(`<pattern id="c${uid}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="1.1" height="3.2" fill="#ffffff" opacity=".55"/></pattern>`);
 }
 if(media==='print'){
  // The printed sky: Prussian blue at the top, fading to paper at the horizon.
  defs.push(`<linearGradient id="b${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f3a5f"/><stop offset="1" stop-color="#f1e6cc"/></linearGradient>`);
  over.push(`<rect width="48" height="30" fill="url(#b${uid})"/>`);
 }
 if(media==='watercolour')defs.push(`<filter id="w${uid}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence baseFrequency=".08" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.5"/></filter>`);
 if(media==='oil')defs.push(`<pattern id="o${uid}" width="6" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><path d="M0 2h4" stroke="#fff" stroke-opacity=".28" stroke-width="1.4" stroke-linecap="round"/></pattern>`);
 if(media==='crt')defs.push(`<pattern id="s${uid}" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="1" fill="#000" opacity=".28"/></pattern>`);
 // The pixel looks get a stepped roof and a square sun, on whole pixels.
 const roof=pixel?`<path d="M12 22h24v-3h-3v-3h-3v-3h-3v-3h-6v3h-3v3h-3v3h-3z" fill="${p.roof}"/>`
  :`<path d="M11 22L24 10L37 22Z" fill="${p.roof}"${line}/>`;
 const sun=pixel?`<rect x="34" y="5" width="8" height="8" fill="${p.sun}"/>`:`<circle cx="38" cy="9" r="5" fill="${p.sun}"${line}/>`;
 const scene=[
  `<rect width="48" height="30" fill="${p.sky}"/>`,`<rect y="30" width="48" height="18" fill="${p.ground}"/>`,
  media==='lines'?'<path d="M0 30H48" stroke="#2b2b33" stroke-width="1.2"/>':'',
  ...over,sun,
  `<rect x="14" y="21" width="20" height="16" fill="${p.wall}"${line}/>`,roof,
  `<rect x="22" y="28" width="5" height="9" fill="${p.door}"${line}/>`,
  media==='crayon'?`<rect width="48" height="48" fill="url(#c${uid})"/>`:'',
  media==='oil'?`<rect width="48" height="48" fill="url(#o${uid})"/>`:'',
  // Tilt-shift: the top and bottom of the picture go soft.
  media==='tilt'?`<rect width="48" height="13" fill="#fff" opacity=".55"/><rect y="38" width="48" height="10" fill="#fff" opacity=".55"/>`:'',
  media==='crt'?`<rect width="48" height="48" fill="url(#s${uid})"/><rect x="1" y="1" width="46" height="46" rx="9" fill="none" stroke="#101418" stroke-width="3"/>`:'',
 ].join('');
 const body=media==='watercolour'?`<g filter="url(#w${uid})">${scene}</g>`:scene;
 return `<svg viewBox="0 0 48 48" aria-hidden="true"${pixel?' shape-rendering="crispEdges"':''}><defs>${defs.join('')}</defs>${body}</svg>`;
}

const STYLE=`
#lookPicker{position:fixed;inset:0;z-index:62;display:flex;align-items:flex-end;justify-content:center;pointer-events:auto}
#lookPicker[hidden]{display:none}
#lookPicker .look-sheet{width:min(760px,100%);margin:0 auto;padding:10px 0 max(12px,env(safe-area-inset-bottom));border-radius:22px 22px 0 0;
 background:rgba(28,28,30,.78);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);
 box-shadow:0 -10px 34px rgba(0,0,0,.28);color:#fff;font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",system-ui,sans-serif;animation:lookRise .32s cubic-bezier(.32,1.3,.5,1)}
@keyframes lookRise{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
#lookPicker .look-head{display:flex;align-items:center;gap:10px;margin:0 14px 8px}
#lookPicker .look-head>svg{flex:none;width:20px;height:20px;color:#ffd60a}
#lookPicker .look-name{flex:none;font-size:15px;font-weight:700;letter-spacing:-.01em}
#lookPicker .look-hint{flex:1;min-width:0;font-size:12px;font-weight:500;color:rgba(235,235,245,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lookPicker .look-close{flex:none;display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:rgba(118,118,128,.28);color:#fff}
#lookPicker .look-close svg{width:16px;height:16px}
#lookPicker .look-strip{display:flex;gap:10px;overflow-x:auto;padding:6px 14px 4px;scrollbar-width:none;overscroll-behavior-x:contain;touch-action:pan-x}
#lookPicker .look-strip::-webkit-scrollbar{display:none}
#lookPicker .look-strip button{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:66px;padding:0;border:0;background:none;color:rgba(235,235,245,.62);font:inherit;letter-spacing:0}
#lookPicker .look-face{position:relative;display:block;width:62px;height:62px;border-radius:14px;overflow:hidden;background:#1c1c1e;transition:transform .3s cubic-bezier(.32,1.3,.5,1),box-shadow .2s}
#lookPicker .look-face svg{display:block;width:100%;height:100%}
#lookPicker .look-face canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .35s}
#lookPicker .look-face canvas.drawn{opacity:1}
#lookPicker .look-strip button:active .look-face{transform:scale(.92)}
#lookPicker .look-strip button[aria-pressed="true"]{color:#ffd60a}
#lookPicker .look-strip button[aria-pressed="true"] .look-face{box-shadow:0 0 0 2px rgba(28,28,30,.9),0 0 0 4px #ffd60a}
#lookPicker .look-strip button span:last-child{max-width:66px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lookPicker .look-strip button:focus-visible{outline:none}
#lookPicker .look-strip button:not([aria-pressed="true"]):focus-visible .look-face{box-shadow:0 0 0 2px rgba(28,28,30,.9),0 0 0 4px rgba(255,255,255,.85)}
@media (prefers-reduced-motion:reduce){#lookPicker .look-sheet{animation:none}#lookPicker .look-face,#lookPicker .look-face canvas{transition:none}}
`;

/**
 * @param {object} o
 * @param {Record<string,{label:string,short?:string,hint?:string}>} o.looks the catalogue (render/looks.js LOOKS)
 * @param {()=>string[]} o.available the looks this device can draw, in order
 * @param {()=>string} o.current
 * @param {(id:string)=>void} o.choose
 * @param {{begin:()=>void,draw:(id:string,canvas:HTMLCanvasElement)=>boolean}} [o.previews] the town in each look
 */
export function createLookPicker({looks,available,current,choose,previews=null,doc=globalThis.document,win=globalThis,onOpen=()=>{},onClose=()=>{}}){
 let root=null,strip=null,open=false,focusBefore=null,queue=[],frame=0;
 function build(){
  const style=doc.createElement('style');style.textContent=STYLE;doc.head.append(style);
  root=doc.createElement('div');root.id='lookPicker';root.hidden=true;
  root.innerHTML=`<div class="look-sheet" role="dialog" aria-modal="true" aria-label="Look: how the town is drawn"><div class="look-head">${icon('camera')}<span class="look-name"></span><span class="look-hint"></span><button type="button" class="look-close" aria-label="Close">${icon('close')}</button></div><div class="look-strip" role="radiogroup" aria-label="Look"></div></div>`;
  strip=root.querySelector('.look-strip');
  root.querySelector('.look-close').onclick=close;
  // A tap on the town above the strip closes it; taps inside the strip do not.
  root.addEventListener('pointerdown',e=>{if(e.target===root){e.preventDefault();close();}});
  // Drags and taps on the strip are its own: the game's look-around listeners on the document never see them.
  const sheet=root.querySelector('.look-sheet');
  for(const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove','mousedown','mousemove','wheel'])sheet.addEventListener(type,e=>e.stopPropagation());
  doc.body.append(root);
 }
 function mark(){
  const now=current(),info=looks[now]||looks.none;
  root.querySelector('.look-name').textContent=info.label;
  root.querySelector('.look-hint').textContent=info.hint||'';
  for(const b of strip.children){const on=b.dataset.look===now;b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1;}
 }
 function render(){
  strip.replaceChildren(...available().map(id=>{
   const b=doc.createElement('button');b.type='button';b.dataset.look=id;b.setAttribute('role','radio');
   b.setAttribute('aria-label',looks[id].label);b.title=looks[id].hint||looks[id].label;
   b.innerHTML=`<span class="look-face">${lookSwatch(id,'p'+id)}<canvas aria-hidden="true"></canvas></span><span>${looks[id].short||looks[id].label}</span>`;
   b.onclick=()=>{choose(id);mark();};
   return b;
  }));
  mark();
 }
 // The live pictures, one a frame: the chosen look first, then outwards from it along the strip.
 function drawNext(){
  frame=0;
  if(!open||!previews)return;
  const id=queue.shift();if(!id)return;
  const canvas=strip.querySelector(`[data-look="${id}"] canvas`);
  if(canvas&&previews.draw(id,canvas))canvas.classList.add('drawn');
  else if(canvas){queue=[];return;}
  frame=win.requestAnimationFrame?.(drawNext)||0;
 }
 function startPreviews(){
  if(!previews)return;
  const ids=available(),at=Math.max(0,ids.indexOf(current()));
  queue=[...ids].sort((a,b)=>Math.abs(ids.indexOf(a)-at)-Math.abs(ids.indexOf(b)-at));
  previews.begin();
  // After the next frame of the town, so the picture drawn from is the one on the screen.
  frame=win.requestAnimationFrame?.(()=>{frame=win.requestAnimationFrame?.(drawNext)||0;})||0;
 }
 function show(){
  if(!root)build();
  if(open)return;
  open=true;focusBefore=doc.activeElement;doc.exitPointerLock?.();render();root.hidden=false;onOpen();
  const chosen=strip.querySelector('[aria-pressed="true"]')||strip.firstElementChild;
  chosen?.focus({preventScroll:true});chosen?.scrollIntoView?.({inline:'center',block:'nearest'});
  startPreviews();
 }
 function close(){
  if(!open)return;
  open=false;root.hidden=true;queue=[];if(frame)win.cancelAnimationFrame?.(frame);frame=0;onClose();
  if(focusBefore?.getClientRects?.().length)focusBefore.focus();
 }
 // Keys stay in the strip: Escape closes, arrows move between pictures, Enter/Space choose, the rest never reach the town.
 win.addEventListener('keydown',e=>{
  if(!open)return;
  e.stopImmediatePropagation();
  if(e.code==='Escape'){e.preventDefault();close();return;}
  const items=[...strip.children],at=items.indexOf(doc.activeElement);
  const step={ArrowRight:1,ArrowLeft:-1,ArrowDown:1,ArrowUp:-1}[e.code];
  if(step){e.preventDefault();const next=items[Math.max(0,Math.min(items.length-1,(at<0?0:at)+step))];next?.focus();next?.scrollIntoView?.({inline:'nearest',block:'nearest'});return;}
  if(!['Enter','Space','NumpadEnter','Tab'].includes(e.code))e.preventDefault();
 },true);
 for(const type of ['keyup','wheel'])win.addEventListener(type,e=>{if(open)e.stopImmediatePropagation();},true);
 return {show,close,get open(){return open;}};
}
