/**
 * The Town book opens on a home screen of eight big icon tiles: Camera, Map, People, Field book, Bag, Moves, Ferry and
 * Settings (the owner, 23 October 2026: "more icon based, too much tapping and looking for what I want", then yes to
 * folding fifteen tiles into these). Camera, Map and Settings are pages of their own with a back arrow; People is the
 * Map page's People list.
 *
 * The pages are <details>, so everything that opens one by its summary (webmcp.js, the MCP audit session, the layout
 * audits) still works: opening one shows its page, closing it (its header, or the book closing) goes home.
 * town-book.css draws both states from #directory[data-page].
 */
import {iconUrl} from './icons.js';

const PAGES=Object.freeze([['menu-camera','camera','camera'],['menu-places','map','map'],['menu-settings','settings','gear']]);

export function setupTownBookHome({doc=globalThis.document,onClose=()=>{}}={}){
 const directory=doc.getElementById('directory');
 if(!directory)return {home(){}};
 const pages=PAGES.map(([cls,page,icon])=>{
  const details=directory.querySelector('.'+cls);if(!details)return null;
  const summary=details.querySelector?.('summary');
  summary?.style?.setProperty?.('--icon',iconUrl(icon));
  summary?.style?.setProperty?.('--back',iconUrl('arrow-left'));
  return {details,page,summary};
 }).filter(Boolean);
 const show=page=>{if(directory.dataset)directory.dataset.page=page;};
 for(const {details,page} of pages){
  details.addEventListener?.('toggle',()=>{
   if(details.open){for(const other of pages)if(other.details!==details)other.details.open=false;show(page);directory.querySelector('.directory-card')?.scrollTo?.(0,0);}
   else if(!pages.some(p=>p.details.open))show('home');
  });
 }
 // Map shows places; People is the same page on its People list.
 const places=pages.find(p=>p.page==='map');
 const list=name=>directory.querySelector(`#directoryGrid [data-town-filter="${name}"]`)?.click();
 places?.summary?.addEventListener?.('click',()=>{if(!places.details.open)list('places');});
 doc.getElementById('peopleButton')?.addEventListener?.('click',()=>{if(!places)return;places.details.open=true;list('people');});
 function home(){for(const p of pages)p.details.open=false;show('home');}
 // A tap on the dimmed town around the book closes it, as the × does.
 directory.addEventListener?.('click',e=>{if(e.target===directory)onClose();});
 home();
 return {home};
}
