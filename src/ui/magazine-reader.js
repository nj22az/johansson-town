/**
 * 立ち読み: standing at Sakura's rack, reading.
 *
 * First the rack itself, every title's issue on sale today as a cover you can pick;
 * then the issue, one page at a time. Japanese magazines open from the right, so the
 * next page is to the left: ◀, a swipe to the right, or the left arrow key turn
 * forward. Pages come from magazine-art.js — drawn on canvas, or loaded as the images
 * tools/magazines/draw_pages.py prints.
 */
import {rackIssues} from '../world/interiors/magazine-issues.js';
import {drawCover,pagesFor} from '../world/interiors/magazine-art.js';
import {assetURL} from '../assets.js';
import {createPrintViewer} from './print-viewer.js';

const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};

export function createMagazineReader({date,buy=null}){
 const root=el('div','mag-reader'),{issues}=rackIssues(date);
 let view=null;
 function clearKeys(){view?.dispose();view=null;}

 function shelf(){
  clearKeys();root.replaceChildren();
  root.append(el('div','mag-hint','Today’s issues. Pick one up and read.'));
  const grid=el('div','mag-shelf');
  for(const {title,issue} of issues){
   const b=el('button','mag-cover');b.type='button';
   const c=el('canvas');c.width=160;c.height=220;drawCover(c.getContext('2d'),title,issue,160,220);
   b.append(c,el('span','mag-cover-name',title.name),el('span','mag-cover-issue',issue.dateLine));
   b.setAttribute('aria-label',`${title.name}, ${title.en}, ${issue.dateLine}: ${issue.head}`);
   b.onclick=()=>read(title,issue);grid.append(b);
  }
  root.append(grid);grid.querySelector('button')?.focus();
 }

 function read(title,issue){
  clearKeys();root.replaceChildren();
  const pages=pagesFor(title,issue);
  const head=el('div','mag-head');
  const back=el('button','mag-back','‹ Rack');back.type='button';back.onclick=shelf;
  head.append(back,el('span','mag-title',`${title.name} · ${issue.dateLine}`));
  // Reading at the rack is free; taking it home is ¥ at the till (activities.js).
  if(buy){const b=el('button','mag-buy',`Buy · ¥${title.price}`);b.type='button';
   b.onclick=()=>{const result=buy(title,issue);if(result?.ok){b.textContent='In your bag ✓';b.disabled=true;}else if(result?.message){b.textContent=result.message;}};
   head.append(b);}
  const artwork=pages.map((page,i)=>({...page,image:page.image?assetURL(page.image):undefined,
   title:i===0?`${title.name} · Cover`:`${title.name} · Page ${i+1}`,
   filename:`${title.id}-${issue.key}-page-${i+1}`,width:1200,height:1680}));
  view=createPrintViewer({title:`${title.name} · ${issue.dateLine}`,pages:artwork,rtl:true,historyClose:shelf});
  root.append(head,view.element);
  view.element.querySelector('.pv-stage')?.focus();
 }

 shelf();
 return {element:root,dispose(){clearKeys();}};
}
