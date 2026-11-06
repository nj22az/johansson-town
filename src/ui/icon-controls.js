import {svg,actionFor,itemIcon} from './icons.js';

/** Shared semantic icons. The full label remains visible for ambiguous choices. */
export function controlIcon(label=''){
 const value=String(label).trim();
 const choices=[
  [/^(close|cancel|done|dismiss|×)(\b|$)/i,'close'],
  [/^(back|previous)(\b|$)|^‹\s*Rack/i,'arrow-left'],
  [/^Return\s*▶$/i,'arrow-right'],
  [/^(return|leave|exit)(\b|$)/i,'exit'],
  [/^(remove|delete|discard|let go)(\b|$)/i,'trash'],
  [/^(capture|photo)|png|comic|album/i,'camera'],
  [/^(save|download|export)|records|register|ledger|credits/i,'page'],
  [/clock|^(real time|speed up|slow down|set to \d\d:)|\b[124]×\b/i,'clock'],
  [/weather|clear sky|rain/i,'sun'],
  [/^(location|place|travel|visit|map|directions)(\b|$)/i,'map'],
  [/^(wardrobe|clothes|outfit|shirt|trousers|skirt|hat|hair)(\b|$)/i,'shirt'],
  [/^(settings|controls|options)(\b|$)/i,'gear'],
  [/^(add|choose|select)(\b|$)/i,'plus'],
  [/^◀\s*Next/i,'arrow-left'],
  [/^(continue|next)(\b|$)/i,'arrow-right'],
  [/^(start|enter)(\b|$)/i,'door'],
  [/^check in|boarding|cabin bag|ticket/i,'page'],
  [/^ask|say |talk|chat|greet/i,'talk'],
 ];
 for(const [pattern,icon] of choices)if(pattern.test(value))return icon;
 const action=actionFor(value);
 if(action.icon!=='eye')return action.icon;
 const item=itemIcon(value);return item==='box'?'eye':item;
}

const BUTTON_ICONS=Object.freeze({viewButton:'eye',timeButton:'clock',weatherButton:'sun',lookButton:'star',soundButton:'music',fullscreenButton:'screen',closeActivity:'close',closeDirectory:'close'});
const TARGETS='#activity button,#directory button,.shm-pill,.shm-next,.shm-save,.shm-pages button,#photoStudio button,#cameraPanel button,#qte button,.modal-card button';

/** Add one icon without removing artwork, labels, focus, or child event listeners. */
export function decorateControl(button){
 if(button.querySelector('svg')||button.classList.contains('icon-btn')||button.dataset.icon)return;
 // A thumbnail is already the button's visual signifier. Its canvas must survive.
 if(button.querySelector('canvas,img,picture'))return;
 const label=button.textContent.trim();if(!label)return;
 const doc=button.ownerDocument;
 const wrapper=doc.createElement('span');wrapper.innerHTML=svg(BUTTON_ICONS[button.id]||controlIcon(label));
 const glyph=wrapper.firstElementChild;
 const structured=button.children.length>1||button.matches('.dir-item');
 if(!button.children.length){
  const text=doc.createElement('span');text.className='ui-control-label';
  while(button.firstChild)text.append(button.firstChild);
  button.append(text);
 }else if(!structured&&button.children.length===1){
  button.firstElementChild.classList.add('ui-control-label');
 }
 if(label==='×'){
  const text=button.querySelector('.ui-control-label')||button.firstElementChild;
  if(text)text.classList.add('sr-only');
 }
 button.prepend(glyph);button.classList.add('icon-control');
 if(structured)button.classList.add('ui-card-control');
 if(!button.title)button.title=button.getAttribute('aria-label')||label;
}

export function installIconControls(root=globalThis.document.body){
 const apply=(nodes=[root])=>{
  const buttons=new Set();
  for(const node of nodes){
   if(node?.nodeType!==1)continue;
   if(node.matches?.(TARGETS))buttons.add(node);
   for(const button of node.querySelectorAll(TARGETS))buttons.add(button);
  }
  for(const button of buttons)decorateControl(button);
 };
 apply();
 const Observer=root.ownerDocument?.defaultView?.MutationObserver||globalThis.MutationObserver;
 const observer=new Observer(records=>apply(records.flatMap(record=>{
  const element=record.target.nodeType===1?record.target:record.target.parentElement;
  return [element?.closest?.('button'),...record.addedNodes];
 }).filter(Boolean)));
 observer.observe(root,{subtree:true,childList:true,characterData:true});
 return ()=>observer.disconnect();
}
