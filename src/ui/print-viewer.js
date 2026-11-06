import {createReaderHistory} from './reader-history.js';
/** A print held up to read: the original page, outside the World's lighting and Looks. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createPrintTransform(){
 let zoom=1,x=0,y=0,width=1,height=1,viewportWidth=1,viewportHeight=1,scale=1;
 function constrain(){x=clamp(x,-Math.max(0,(width*scale*zoom-viewportWidth)/2),Math.max(0,(width*scale*zoom-viewportWidth)/2));y=clamp(y,-Math.max(0,(height*scale*zoom-viewportHeight)/2),Math.max(0,(height*scale*zoom-viewportHeight)/2));}
 const api={
  fit(iw,ih,vw,vh){width=Math.max(1,iw||1);height=Math.max(1,ih||1);viewportWidth=Math.max(1,vw||1);viewportHeight=Math.max(1,vh||1);scale=Math.min(viewportWidth/width,viewportHeight/height);constrain();return api.state;},
  setZoom(value,ax=0,ay=0){const next=clamp(Number.isFinite(value)?value:1,1,8),ratio=next/zoom;x=ax-(ax-x)*ratio;y=ay-(ay-y)*ratio;zoom=next;constrain();return api.state;},
  panTo(nx,ny){x=Number.isFinite(nx)?nx:0;y=Number.isFinite(ny)?ny:0;constrain();return api.state;},
  reset(){zoom=1;x=y=0;return api.state;},
  get state(){return {zoom,x,y,fit:scale,width,height,viewportWidth,viewportHeight};},
 };return api;
}

const CSS=`
.print-viewer{display:flex;flex-direction:column;gap:10px;min-width:0;color:#202b28;font:400 14px/1.4 var(--line-font,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)}
.pv-head,.pv-tools,.pv-pages{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
.pv-head{justify-content:space-between}.pv-title{font-size:16px;font-weight:700;overflow-wrap:anywhere;flex:1;min-width:120px}
.pv-pages[hidden]{display:none}
.print-viewer button{min-height:44px;min-width:44px;padding:7px 13px;border:1px solid #cbd4cf;border-radius:8px;background:#fff;color:#202b28;font-family:inherit;font-size:14px;font-weight:600;line-height:1.3;cursor:pointer;letter-spacing:normal;text-shadow:none}
.print-viewer button:disabled{opacity:.4;cursor:default}.print-viewer button:hover:not(:disabled){background:#edf2ef}
.print-viewer button:focus-visible,.pv-stage:focus-visible{outline:3px solid var(--line-green,#16805c);outline-offset:2px}
.pv-stage{position:relative;overflow:hidden;isolation:isolate;flex:none;width:100%;height:clamp(200px,56dvh,720px);box-sizing:border-box;background:#dce3de;border:1px solid #c4cec7;border-radius:8px;touch-action:none;overscroll-behavior:contain;cursor:grab;user-select:none;-webkit-user-select:none}
.pv-stage:active{cursor:grabbing}
.pv-stage .pv-media{display:block!important;position:absolute!important;inset:auto!important;left:0!important;top:0!important;margin:0!important;max-width:none!important;max-height:none!important;border-radius:0!important;transform-origin:0 0;box-shadow:0 5px 22px #14271d40;pointer-events:none;user-select:none;-webkit-user-drag:none;transition:none!important;animation:none!important}
.pv-zoom{min-width:48px;font-variant-numeric:tabular-nums;text-align:center}.pv-count{min-width:70px;text-align:center;font-variant-numeric:tabular-nums}
.pv-status{font-size:12px;color:#59665e;text-align:center;min-height:17px;margin:0!important}.pv-help{font-size:12px;color:#59665e;text-align:center;margin:0!important}
#activity.print-view .activity-card{width:min(1180px,100%);max-height:calc(100dvh - 24px)}
#activity.print-view #activityBody{overflow:visible;padding:0;background:none}
#activity.print-view #activityActions:empty{display:none}
#activity.print-view .pv-stage{height:clamp(180px,calc(100dvh - 300px),760px)}
@media(max-width:600px){.pv-tools{gap:6px}.print-viewer button{padding:6px 10px}.pv-help{font-size:11px}#activity.print-view .activity-card{padding:12px}#activity.print-view .pv-stage{height:clamp(180px,calc(100dvh - 400px),680px)}}
@media(max-height:520px){#activity.print-view .pv-stage,.pv-stage{height:clamp(140px,45dvh,260px)}.pv-help{display:none}}
`;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const filename=(value,extension)=>String(value||'johansson-world-print').replace(/\.[a-z0-9]{2,5}$/i,'').replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,100)+extension;
/** pages: {image: same-origin original URL} or {draw(ctx,w,h),width,height}. */
export function createPrintViewer({title='',pages=[],index=0,rtl=false,onClose=null,historyClose=onClose}={}){
 if(!document.getElementById?.('printViewerStyle')){const style=el('style');style.id='printViewerStyle';style.textContent=CSS;document.head?.append(style);}
 const root=el('div','print-viewer'),head=el('div','pv-head'),name=el('div','pv-title',title),stage=el('div','pv-stage'),tools=el('div','pv-tools'),nav=el('div','pv-pages');
 const zoomLabel=el('span','pv-zoom','100%'),count=el('span','pv-count'),status=el('p','pv-status'),help=el('p','pv-help','Pinch or scroll to zoom · drag to explore · double-tap to enlarge');
 stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','Artwork. Pinch or scroll to zoom; drag to explore.');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');count.setAttribute('aria-live','polite');
 const button=(parent,cls,label,fn)=>{const b=el('button',cls,label);b.type='button';b.onclick=fn;parent.append(b);return b;};
 if(onClose)button(head,'pv-back','‹ Back',onClose);head.append(name);
 const model=createPrintTransform();let pageIndex=0,media=null,ready=false,disposed=false,token=0,downloadTimer=0;
 const pointers=new Map(),urls=new Set();let drag=null,pinch=null,lastTap=null,lastTouchZoom=-1000;
 const disposeHistory=createReaderHistory(historyClose);
 const zoomOut=button(tools,'pv-zoom-out','−',()=>zoom(model.state.zoom/1.5)),zoomIn=button(tools,'pv-zoom-in','+',()=>zoom(model.state.zoom*1.5));
 zoomOut.setAttribute('aria-label','Zoom out');zoomIn.setAttribute('aria-label','Zoom in');tools.append(zoomLabel);
 button(tools,'pv-fit','Fit page',()=>{model.reset();paint();});
 const download=button(tools,'pv-download','Download image',saveImage);
 const prev=button(nav,'pv-prev',rtl?'Previous ▶':'‹ Previous',()=>setPage(pageIndex-1));nav.append(count);
 const next=button(nav,'pv-next',rtl?'◀ Next':'Next ›',()=>setPage(pageIndex+1));
 nav.hidden=pages.length<2;root.append(head,stage,tools,nav,status,help);
 function paint(){
  const s=model.state;if(media){media.style.width=s.width+'px';media.style.height=s.height+'px';media.style.transform=`translate3d(${(s.viewportWidth-s.width*s.fit*s.zoom)/2+s.x}px,${(s.viewportHeight-s.height*s.fit*s.zoom)/2+s.y}px,0) scale(${s.fit*s.zoom})`;}
  zoomLabel.textContent=Math.round(s.zoom*100)+'%';zoomOut.disabled=!ready||s.zoom<=1;zoomIn.disabled=!ready||s.zoom>=8;download.disabled=!ready;
  stage.setAttribute('aria-label',`${pages[pageIndex]?.title||title||'Artwork'}, ${Math.round(s.zoom*100)} percent. Drag to explore.`);
 }
 function resize(){if(disposed)return;const r=stage.getBoundingClientRect();const s=model.state;model.fit(s.width,s.height,stage.clientWidth||r.width||600,stage.clientHeight||r.height||500);paint();}
 function zoom(value,x=0,y=0){if(!ready)return;model.setZoom(value,x,y);paint();}
 function release(){for(const id of pointers.keys())try{if(stage.hasPointerCapture?.(id))stage.releasePointerCapture(id);}catch{}pointers.clear();drag=pinch=null;}
 function setPage(value){
  if(disposed||!pages.length)return;const n=clamp(Math.trunc(value)||0,0,pages.length-1);pageIndex=n;const page=pages[n],mine=++token;
  release();lastTap=null;ready=false;model.reset();name.textContent=page.title||title;count.textContent=`${n+1} / ${pages.length}`;prev.disabled=n===0;next.disabled=n===pages.length-1;
  stage.replaceChildren();status.textContent='Loading artwork…';
  const complete=(w,h)=>{if(disposed||mine!==token)return;model.fit(w,h,model.state.viewportWidth,model.state.viewportHeight);ready=true;status.textContent='';stage.setAttribute('aria-busy','false');resize();};
  const fail=()=>{if(disposed||mine!==token)return;ready=false;status.textContent='This image could not be loaded. Turn the page or reopen it to try again.';stage.setAttribute('aria-busy','false');paint();};
  stage.setAttribute('aria-busy','true');
  if(page.image){
   media=el('img','pv-media');media.alt=page.title||title||'Johansson World artwork';media.draggable=false;
   const image=media;image.onload=()=>complete(image.naturalWidth||page.width||1200,image.naturalHeight||page.height||1680);image.onerror=fail;stage.append(image);image.src=page.image;
  }else if(page.draw){
   media=el('canvas','pv-media');media.width=page.width||1200;media.height=page.height||1680;media.setAttribute('role','img');media.setAttribute('aria-label',page.title||title||'Johansson World printed page');stage.append(media);
   try{page.draw(media.getContext('2d'),media.width,media.height);complete(media.width,media.height);}catch{fail();}
  }else{media=null;fail();}
  paint();
 }
 function triggerDownload(href,name){const a=el('a');a.href=href;a.download=name;a.rel='noopener';root.append(a);a.click();a.remove();status.textContent='Image ready to save.';}
 function saveImage(){
  if(!ready||disposed)return;const page=pages[pageIndex],mine=token;
  if(page.image){const extension=new URL(page.image,document.baseURI||location.href).pathname.match(/\.[a-z0-9]{2,5}$/i)?.[0]||'.png';triggerDownload(page.image,filename(page.filename||page.title||title,extension));return;}
  try{media.toBlob(blob=>{if(!blob||disposed||mine!==token)return;const href=URL.createObjectURL(blob);urls.add(href);triggerDownload(href,filename(page.filename||page.title||title,'.png'));downloadTimer=setTimeout(()=>{URL.revokeObjectURL(href);urls.delete(href);},30000);},'image/png');}
  catch{status.textContent='This browser could not save the image. Try another page or browser.';}
 }
 const point=e=>{const r=stage.getBoundingClientRect();return [e.clientX-r.left-(stage.clientWidth||r.width)/2,e.clientY-r.top-(stage.clientHeight||r.height)/2];};
 const stop=e=>{e.preventDefault();e.stopPropagation();};
 const beginDrag=()=>{const [id,p]=[...pointers.entries()][0]||[];drag=p?{id,x:p[0],y:p[1],startX:p[0],startY:p[1],panX:model.state.x,panY:model.state.y,swipe:true}:null;};
 const down=e=>{if(!ready||e.button>0)return;stop(e);pointers.set(e.pointerId,[e.clientX,e.clientY]);stage.setPointerCapture?.(e.pointerId);
  if(pointers.size===1)beginDrag();else if(pointers.size===2){lastTap=null;const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1])||1,x:(a[0]+b[0])/2,y:(a[1]+b[1])/2};drag=null;}
 };
 const move=e=>{if(!pointers.has(e.pointerId))return;stop(e);pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch&&pointers.size>=2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1])||1,x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,[ax,ay]=point({clientX:pinch.x,clientY:pinch.y});model.setZoom(model.state.zoom*distance/pinch.distance,ax,ay);model.panTo(model.state.x+x-pinch.x,model.state.y+y-pinch.y);pinch={distance,x,y};paint();}
  else if(drag){model.panTo(drag.panX+e.clientX-drag.x,drag.panY+e.clientY-drag.y);paint();}
 };
 const up=e=>{if(!pointers.has(e.pointerId))return;stop(e);const wasPinch=!!pinch,old=drag;pointers.delete(e.pointerId);try{if(stage.hasPointerCapture?.(e.pointerId))stage.releasePointerCapture(e.pointerId);}catch{}
  pinch=null;drag=null;if(pointers.size){beginDrag();if(drag)drag.swipe=false;}
  else if(e.type==='pointerup'&&!wasPinch&&old?.swipe){const dx=e.clientX-old.startX,dy=e.clientY-old.startY;
   if(model.state.zoom===1&&Math.abs(dx)>55&&Math.abs(dy)<Math.abs(dx)*.55){lastTap=null;setPage(pageIndex+(dx>0?(rtl?1:-1):(rtl?-1:1)));}
   else if(e.pointerType==='touch'&&Math.hypot(dx,dy)<8){const now=performance.now();if(lastTap&&now-lastTap.time<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<28){const [x,y]=point(e);zoom(model.state.zoom>1?1:2.5,x,y);lastTouchZoom=now;lastTap=null;}else lastTap={time:now,x:e.clientX,y:e.clientY};}
  }
 };
 const wheel=e=>{stop(e);const [x,y]=point(e);zoom(model.state.zoom*Math.exp(-clamp(e.deltaY,-300,300)*.0025),x,y);};
 const dbl=e=>{stop(e);if(performance.now()-lastTouchZoom<500)return;const [x,y]=point(e);zoom(model.state.zoom>1?1:2.5,x,y);};
 stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('lostpointercapture',up);stage.addEventListener('wheel',wheel,{passive:false});stage.addEventListener('dblclick',dbl);
 const key=e=>{if(e.key==='Tab'||e.key==='Escape')return;const s=model.state;
  if(['+','=','-','0','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key)){stop(e);
   if(e.key==='+'||e.key==='=')zoom(s.zoom*1.5);else if(e.key==='-')zoom(s.zoom/1.5);else if(e.key==='0'||e.key==='Home'){model.reset();paint();}
   else if(e.key==='PageUp')setPage(pageIndex-1);else if(e.key==='PageDown')setPage(pageIndex+1);
   else if(s.zoom>1){model.panTo(s.x+(e.key==='ArrowLeft'?70:e.key==='ArrowRight'?-70:0),s.y+(e.key==='ArrowUp'?70:e.key==='ArrowDown'?-70:0));paint();}
   else if(e.key==='ArrowLeft'||e.key==='ArrowRight')setPage(pageIndex+(e.key==='ArrowLeft'?(rtl?1:-1):(rtl?-1:1)));
  }
 };
 root.addEventListener('keydown',key);
 // Pointer gestures never reach the World's canvas controls, including taps on toolbar buttons.
 const isolate=e=>e.stopPropagation();for(const type of ['pointerdown','pointermove','pointerup','click','dblclick','contextmenu'])root.addEventListener(type,isolate);
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(stage);globalThis.addEventListener?.('resize',resize);
 setPage(index);
 return {element:root,setPage,transform:model,get pageIndex(){return pageIndex;},dispose(){if(disposed)return;disposed=true;token++;disposeHistory();release();observer?.disconnect();globalThis.removeEventListener?.('resize',resize);clearTimeout(downloadTimer);for(const href of urls)URL.revokeObjectURL(href);urls.clear();if(media){media.onload=media.onerror=null;}root.removeEventListener('keydown',key);for(const [type,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['wheel',wheel],['dblclick',dbl]])stage.removeEventListener(type,fn);for(const type of ['pointerdown','pointermove','pointerup','click','dblclick','contextmenu'])root.removeEventListener(type,isolate);}};
}
