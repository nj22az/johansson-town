import {readPlayers,switchPlayer,addPlayer,slotKey,SAVE_KEY,LEGACY_KEYS,PREV_SUFFIX} from './src/save.js';
import {heartsFor} from './src/people/friendship.js';

/**
 * The title screen's choices: EXPLORE with the active save, LOAD another save, start a NEW GAME, or import a save file.
 * There is no BUILD here: looks, wardrobes and the home are made in Johansson Studio (the link beside Install app; see
 * src/studio-handoff.js). The game reads the chosen mode from window.__JOHANSSON_MODE__ when it starts.
 */
const storage=globalThis.localStorage;
const $=id=>document.getElementById(id);

function savedState(id){
 for(const key of slotKey(id)===SAVE_KEY?[SAVE_KEY,SAVE_KEY+PREV_SUFFIX,...LEGACY_KEYS]:[slotKey(id),slotKey(id)+PREV_SUFFIX]){   // the previous copy when the save does not read (save.js)
  try{const value=JSON.parse(storage.getItem(key));if(value&&typeof value==='object'&&!Array.isArray(value))return value;}catch{}
 }
 return null;
}
const when=ms=>ms?new Date(ms).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
/** "¥3,400 · 4 friends · last played 6 Oct, 21:14", or null for a slot nobody has played yet. */
export function describeSave(state,lastPlayed){
 if(!state)return null;
 const friends=Object.values(state.friendship||{}).filter(f=>heartsFor(f?.points)>=1).length;
 const parts=['¥'+Number(state.yen??0).toLocaleString('en-GB'),friends===1?'1 friend':friends+' friends'];
 if(state.loops>0)parts.push('year '+(state.loops+1)+' of 1997');
 const last=lastPlayed||state.savedAt;if(last)parts.push('last played '+when(last));
 return parts.join(' · ');
}

export function createTitleMenu({launch}){
 const enter=$('enter'),dialog=$('titleSlots'),list=$('titleSlotList'),form=$('titleNewForm'),name=$('titleNewName');
 let opener=null;

 function refresh(){
  const roster=readPlayers(storage),me=roster.players.find(p=>p.id===roster.active),saved=savedState(me.id);
  $('titlePlayerName').textContent=me.name;
  $('titlePlayerSummary').textContent=saved?`¥${Number(saved.yen??1200).toLocaleString('en-GB')} · Continue your story`:'Your island story awaits';
  enter.querySelector('b').textContent=saved?'Continue':'Start Exploring';
  $('titleActionHint').textContent=saved?'Return to the island':'Welcome to the island';
 }
 function close(){dialog.classList.add('hidden');form.classList.add('hidden');(opener||enter).focus();}
 function open(newGame=false){
  opener=document.activeElement;
  const roster=readPlayers(storage);
  list.replaceChildren(...roster.players.sort((a,b)=>b.lastPlayed-a.lastPlayed).map(p=>{
   const li=document.createElement('li'),b=document.createElement('button');b.type='button';
   const text=describeSave(savedState(p.id),p.lastPlayed);
   b.innerHTML='<b></b><span></span>';b.querySelector('b').textContent=p.name+(p.id===roster.active?' · current':'');
   b.querySelector('span').textContent=text||'Not played yet';
   b.onclick=()=>{const previous=readPlayers(storage).active;if(!switchPlayer(storage,p.id))return;if(previous!==p.id)location.reload();else{refresh();close();}};
   li.append(b);return li;
  }));
  dialog.classList.remove('hidden');
  if(newGame){form.classList.remove('hidden');name.value='';name.focus();}
  else list.querySelector('button')?.focus();
 }

 // EXPLORE is the original START button.
 enter.addEventListener('click',()=>{if(!window.__JOHANSSON_MODE__)window.__JOHANSSON_MODE__='explore';},{capture:true});
 $('titleLoad').addEventListener('click',()=>open(false));
 $('titleNew').addEventListener('click',()=>{if(savedState(readPlayers(storage).active)&&!confirm('Begin a new story in a separate player slot? Your existing progress will stay saved.'))return;open(true);});
 $('titleSlotsClose').addEventListener('click',close);
 form.addEventListener('submit',e=>{e.preventDefault();const id=addPlayer(storage,name.value||'Visitor');if(readPlayers(storage).active!==id){$('titlePlayerSummary').textContent='Saving unavailable. Please check site storage.';return;}location.reload();});
 dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){const controls=[...dialog.querySelectorAll('button,input')].filter(el=>!el.hidden&&!el.closest('.hidden'));const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}if(e.key==='Escape'){e.stopPropagation();close();}});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 const file=$('titleImportFile');
 $('titleImport').addEventListener('click',()=>file.click());
 file.addEventListener('change',async()=>{
  const f=file.files?.[0];if(!f)return;
  try{
   const data=JSON.parse(await f.text());
   if(!['johansson-town','johansson-world'].includes(data?.game)||!data.state||typeof data.state!=='object'||Array.isArray(data.state))throw Error('not a save');
   const id=addPlayer(storage,data.player||f.name.replace(/\.json$/,''),Date.now(),data.state);
   if(!id){$('titlePlayerSummary').textContent='This device could not save the imported player. Your current player is unchanged.';return;}
   location.reload();
  }catch{$('titlePlayerSummary').textContent='That file is not a Johansson World save.';}
  finally{file.value='';}
 });
 refresh();
 return {refresh,open,close};
}
