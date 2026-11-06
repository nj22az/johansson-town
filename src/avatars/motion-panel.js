import {normalizeMotion,waveMotion} from './motion.js';

/** Shared by the in-game avatar creator and standalone Johansson Studio. */
export function createMotionPanel({onLoad,onPlay,onStop,onExport,onImport}){
 const root=document.createElement('details');root.className='shm-motion';
 root.style.cssText='position:absolute;right:8px;bottom:8px;z-index:4;max-width:calc(100% - 16px);font-size:12px';
 const summary=document.createElement('summary');summary.textContent='Body animation';summary.style.cssText='cursor:pointer;min-height:44px;display:flex;align-items:center;padding:0 12px;background:#fffffff2;border:1px solid var(--line-border,#d5c6ac);border-radius:10px;box-sizing:border-box';root.append(summary);
 const body=document.createElement('div');body.style.cssText='display:none;position:absolute;right:0;bottom:calc(100% + 6px);width:min(270px,calc(100vw - 48px));max-height:min(340px,45dvh);overflow:auto;gap:8px;padding:12px;background:#fff;border:1px solid var(--line-border,#d5c6ac);border-radius:12px;box-shadow:0 6px 24px #20344422;box-sizing:border-box';root.append(body);
 root.ontoggle=()=>{body.style.display=root.open?'grid':'none';if(root.open)body.style.maxHeight=Math.max(100,Math.min(340,root.parentElement.clientHeight-64))+'px';};
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();root.open=false;summary.focus();}});
 const closeOutside=e=>{if(!root.contains(e.target))root.open=false;};document.addEventListener('pointerdown',closeOutside);
 const status=document.createElement('p');status.className='shm-note';status.setAttribute('role','status');
 const hint=document.createElement('p');hint.className='shm-note';hint.textContent='Try a wave or open a Johansson motion or animated GLB. Motion plays in place and keeps your character’s proportions.';
 let motion=null,disposed=false,busy=false,request=0,source=null;
 const controls=[];
 const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
 function button(label,action,needsMotion=false){const b=document.createElement('button');b.type='button';b.className='shm-pill';b.textContent=label;b.onclick=async()=>{if(busy)return;busy=true;update();try{await action();}catch(e){if(!disposed)status.textContent=e.message||'Unable to open this animation.';}finally{busy=false;update();}};controls.push([b,needsMotion]);row.append(b);return b;}
 function update(){for(const [b,needs] of controls)b.disabled=busy||needs&&!motion;}
 const file=document.createElement('input');file.type='file';file.accept='.glb,.json';file.hidden=true;
 const clips=document.createElement('select');clips.className='shm-select';clips.setAttribute('aria-label','Animation clip');clips.hidden=true;
 const loop=document.createElement('input');loop.type='checkbox';loop.checked=true;const loopLabel=document.createElement('label');loopLabel.append(loop,' Loop animation');
 function accept(value){motion=normalizeMotion(value);onLoad(motion);onPlay(loop.checked);status.textContent=motion.name+' · '+motion.times.at(-1).toFixed(1)+' seconds. Playing.';update();}
 function clearSource(){source?.dispose();source=null;clips.replaceChildren();clips.hidden=true;}
 function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 button('Try wave',()=>{clearSource();accept(waveMotion());});
 button('Open animation',()=>file.click());
 button('Play',()=>{onPlay(loop.checked);status.textContent='Playing '+motion.name+'.';},true);
 button('Stop',()=>{onStop();status.textContent='Animation stopped.';},true);
 button('Save motion',()=>download(JSON.stringify(motion),'application/json',safeName()+'.motion.json'),true);
 button('Export animated GLB',async()=>{const data=await onExport(motion);if(!disposed)download(data,'model/gltf-binary',safeName()+'.glb');},true);
 function safeName(){return motion.name.replace(/[^a-z0-9_-]/gi,'-')||'motion';}
 file.onchange=async()=>{
  const selected=file.files[0];file.value='';if(!selected||busy)return;
  const id=++request;busy=true;update();status.textContent='Opening animation…';
  try{
   if(selected.size>32*1024*1024)throw Error('Choose a file smaller than 32 MB.');
   if(/\.glb$/i.test(selected.name)){
    const result=await onImport(await selected.arrayBuffer());
    if(disposed||id!==request){result.dispose();return;}
    clearSource();source=result;
    clips.replaceChildren(...result.names.map((name,i)=>new Option(name,String(i))));clips.hidden=result.names.length<2;
    accept(result.motion(0));
   }else{if(selected.size>2e6)throw Error('Choose a motion JSON file smaller than 2 MB.');const next=normalizeMotion(JSON.parse(await selected.text()));if(disposed||id!==request)return;clearSource();accept(next);}
  }catch(e){if(!disposed)status.textContent=e.message||'Unable to open this animation.';}
  finally{busy=false;update();}
 };
 clips.onchange=()=>{try{accept(source.motion(Number(clips.value)));}catch(e){status.textContent=e.message;}};
 body.append(hint,row,file,clips,loopLabel,status);update();
 return {root,dispose(){disposed=true;request++;clearSource();document.removeEventListener('pointerdown',closeOutside);root.remove();}};
}
