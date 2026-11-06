/**
 * Puts the town's icons on its buttons. The game rewrites some of these labels as it
 * goes ("1st person" / "3rd person"), so the top rail wears its icon as a CSS mask and
 * keeps its text for screen readers (and for wide screens with a mouse). The thumb
 * buttons carry inline SVG. The bag is made here: it only exists on screen when there is
 * something in it.
 */
import {svg,iconUrl} from './icons.js';

const RAIL=Object.freeze({directoryButton:'book',exitRoomButton:'exit',enterBuildingButton:'door'});
/** The town book's tiles carry their icon in data-icon. */

export function dressHud({doc=globalThis.document,onBag=()=>{}}={}){
 for(const [id,icon] of Object.entries(RAIL)){
  const el=doc.querySelector('#'+id);if(!el)continue;
  el.classList.add('icon-btn');el.style?.setProperty?.('--icon',iconUrl(icon));
 }
 for(const tile of doc.querySelectorAll?.('.app-tile[data-icon]')||[])tile.style?.setProperty?.('--icon',iconUrl(tile.dataset.icon));
 const drink=doc.querySelector('#drink');
 if(drink)drink.innerHTML=`${svg('cup')}<b>Drink</b>`;
 const jump=doc.querySelector('#jump');
 if(jump)jump.innerHTML=`<span class="jump-glyph">${svg('jump')}</span><b class="jump-label">Jump</b>`;
 let bag=doc.querySelector('#bagButton');
 if(!bag){
  bag=doc.createElement('button');bag.id='bagButton';bag.type='button';bag.hidden=true;
  bag.className='icon-btn bag-button app-tile control-off';bag.setAttribute('aria-label','Bag');
  bag.innerHTML=`${svg('bag')}<b class="bag-label">Bag</b><span class="bag-count" aria-hidden="true"></span>`;
  bag.addEventListener('click',()=>onBag());
  (doc.querySelector('#townControls')||doc.body).append(bag);
 }
 let shown=-1;
 return {
  bag,
  /** How many things are in the bag: the badge, and the button's name for a reader. */
  count(n){
   if(n===shown)return;shown=n;
   const badge=bag.querySelector('.bag-count');if(badge){badge.textContent=n>99?'99+':n>0?String(n):'';badge.hidden=n<=0;}bag.hidden=n<=0;
   bag.setAttribute('aria-label',n?`Bag · ${n} thing${n===1?'':'s'}`:'Bag');
  }
 };
}

/** The run toggle's face: the runner, and whether it is on. */
export function runButtonFace(running){
 return `${svg('run')}<b>Run</b>`;
}
