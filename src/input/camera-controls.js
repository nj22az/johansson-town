export const CAMERA_DEFAULTS=Object.freeze({sensitivity:1,invertY:false,fov:65,deadzone:.16,bob:true});
const KEY='johansson-town-camera-v1';
export function cameraSettings(saved={}){
 const bounded=(key,min,max)=>typeof saved?.[key]==='number'&&Number.isFinite(saved[key])?Math.max(min,Math.min(max,saved[key])):CAMERA_DEFAULTS[key];
 return {sensitivity:bounded('sensitivity',.3,2.5),invertY:saved?.invertY===true,fov:bounded('fov',45,85),deadzone:bounded('deadzone',.05,.35),bob:saved?.bob!==false};
}

export function createCameraControls({onChange,onCentre,onOpen,onClose}){
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
 let settings=cameraSettings(saved),opened=false,focusBefore=null;
 const panel=document.createElement('section');panel.id='cameraPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','cameraTitle');
 panel.innerHTML=`<div class="camera-card"><header><h2 id="cameraTitle">Camera & controls</h2><button type="button" data-close>Done</button></header>
 <p id="controllerStatus" aria-live="polite">Connect a controller, then press a button to wake it.</p>
 <label>Look sensitivity <output data-value="sensitivity"></output><input type="range" name="sensitivity" min="0.3" max="2.5" step="0.1"></label>
 <label>Field of view <output data-value="fov"></output><input type="range" name="fov" min="45" max="85" step="1"></label>
 <label>Stick dead zone <output data-value="deadzone"></output><input type="range" name="deadzone" min="0.05" max="0.35" step="0.01"></label>
 <label class="camera-check"><input type="checkbox" name="invertY"> Invert vertical look</label>
 <label class="camera-check"><input type="checkbox" name="bob"> Walking camera motion</label>
 <div class="camera-actions"><button type="button" data-centre>Centre view</button><button type="button" data-reset>Reset settings</button></div>
 <dl><dt>Left stick</dt><dd>Walk · D-pad in menus</dd><dt>Right stick</dt><dd>Look · click to level the camera</dd><dt>A / Cross</dt><dd>Interact or select</dd><dt>B / Circle</dt><dd>Back</dd><dt>X / Square</dt><dd>Drink</dd><dt>Y / Triangle</dt><dd>Inventory</dd><dt>LB / L1 · RB / R1</dt><dd>Hold to run · jump</dd><dt>RT / R2</dt><dd>Hold to look closer</dd><dt>Menu / Options</dt><dd>Town book</dd></dl>
 <p class="camera-help">Mouse: left click to walk or interact. Hold right click and drag to look. Touch: MOVE and LOOK sticks, or swipe the view. Keyboard: C settings · Home centre · I/J/K/L look. In object inspection, right stick rotates; triggers zoom.</p></div>`;
 document.body.append(panel);
 const inputs=[...panel.querySelectorAll('input')];
 function sync(){for(const input of inputs){const key=input.name;if(input.type==='checkbox')input.checked=settings[key];else{input.value=String(settings[key]);const output=panel.querySelector(`[data-value="${key}"]`);output.textContent=key==='fov'?settings[key]+'°':key==='deadzone'?Math.round(settings[key]*100)+'%':settings[key].toFixed(1)+'×';}}}
 function commit(){settings=cameraSettings(settings);try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}sync();onChange(settings);}
 for(const input of inputs)input.addEventListener('input',()=>{settings[input.name]=input.type==='checkbox'?input.checked:Number(input.value);commit();});
 function close(){if(!opened)return;opened=false;panel.hidden=true;document.documentElement.classList.remove('camera-controls-open');onClose();focusBefore?.focus?.();}
 panel.querySelector('[data-close]').onclick=close;
 panel.querySelector('[data-centre]').onclick=()=>{onCentre();close();};
 panel.querySelector('[data-reset]').onclick=()=>{settings={...CAMERA_DEFAULTS};commit();};
 panel.addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();e.stopPropagation();close();}
  if(e.key==='Tab'){const items=focusableControls(panel),i=items.indexOf(document.activeElement);e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length]?.focus();}
 });
 window.addEventListener?.('johansson-controller-settings',()=>{if(!window.johanssonDesktop)return;try{settings=cameraSettings(JSON.parse(localStorage.getItem(KEY)));sync();onChange(settings);}catch{}});
 sync();return {panel,get active(){return opened;},get settings(){return settings;},close,
  open(){if(opened)return;focusBefore=document.activeElement;opened=true;panel.hidden=false;document.exitPointerLock?.();document.documentElement.classList.add('camera-controls-open');onOpen();panel.querySelector('[data-close]').focus();},
  status(connected){const text=connected?'Controller connected · left stick walks, right stick looks.':'Connect a controller, then press a button to wake it.';const label=panel.querySelector('#controllerStatus');if(label.textContent!==text)label.textContent=text;},
 };
}

export function focusableControls(root){return [...root.querySelectorAll('button,input,select,summary,a[href]')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length>0);}
export function navigateControls(root,direction){
 if(!direction)return;const items=focusableControls(root);if(!items.length)return;
 const selected=document.activeElement,index=items.indexOf(selected);
 if(index>=0&&(direction==='left'||direction==='right')&&selected.type==='range'){
  const step=Number(selected.step)||1;selected.value=String(Math.max(Number(selected.min),Math.min(Number(selected.max),Number(selected.value)+(direction==='right'?step:-step))));selected.dispatchEvent(new Event('input',{bubbles:true}));return;
 }
 const next=items[index<0?0:(index+(direction==='up'||direction==='left'?-1:1)+items.length)%items.length];next.focus();next.scrollIntoView?.({block:'nearest'});
}
