import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {addPlayer,readPlayers,slotKey,SAVE_KEY,PLAYERS_KEY} from '../src/save.js';

function setup(){
 const dom=installDOM(),storage=localStorage;let reloads=0;
 Object.defineProperty(storage,'length',{get:()=>dom.storage.size});
 storage.key=i=>[...dom.storage.keys()][i]??null;storage.removeItem=k=>dom.storage.delete(k);
 location.reload=()=>reloads++;
 globalThis.prompt=()=>null;
 const activities=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1002});
 const write=storage.setItem;
 return {dom,storage,activities,write,get reloads(){return reloads;},
  reject(when=()=>true){storage.setItem=(key,value)=>{if(when(key))throw Error('QuotaExceededError');return write(key,value);};},
  restore(){storage.setItem=write;},title:()=>dom.elements.get('#activityTitle').textContent,
  message:()=>dom.elements.get('#activityBody').children.map(p=>p.textContent).join(' ')};
}

test('Save now never confirms a rejected write or advances the successful save time',t=>{
 const s=setup(),before=JSON.parse(s.storage.getItem(SAVE_KEY)),last=s.activities.state.savedAt;
 t.mock.method(Date,'now',()=>last+60000);
 s.activities.state.yen=8123;s.reject();s.activities.players();s.dom.button('Save now');
 assert.equal(s.title(),'Progress not saved');assert.match(s.message(),/progress is still open/);
 assert.equal(s.activities.state.savedAt,last);assert.equal(s.activities.state.yen,8123);
 assert.deepEqual(JSON.parse(s.storage.getItem(SAVE_KEY)),before);
 assert.equal(s.dom.elements.get('#saveState').textContent,'SAVING UNAVAILABLE');
 assert.ok(s.dom.has('Try again')&&s.dom.has('Export save file')&&s.dom.has('Keep playing'));
 s.dom.button('Keep playing');assert.equal(s.activities.paused,false);assert.equal(s.reloads,0);
});

test('retry writes the live progress and only then confirms its actual save time',t=>{
 const s=setup(),last=s.activities.state.savedAt;
 t.mock.method(Date,'now',()=>last+60000);
 s.activities.state.yen=8123;s.reject();s.activities.players();s.dom.button('Save now');
 s.restore();s.dom.button('Try again');
 assert.equal(s.title(),'Saved');assert.equal(s.activities.state.savedAt,last+60000);
 const saved=JSON.parse(s.storage.getItem(SAVE_KEY));assert.equal(saved.yen,8123);assert.equal(saved.savedAt,last+60000);
});

test('switching waits for a successful save and retries the intended player once',()=>{
 const s=setup(),other=addPlayer(s.storage,'Nhung');
 s.storage.setItem(PLAYERS_KEY,JSON.stringify({...readPlayers(s.storage),active:'player-1'}));
 s.activities.state.yen=8123;s.reject();s.activities.players();
 s.dom.button(s.dom.labels().find(label=>label.startsWith('Switch to Nhung')));
 assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).active,'player-1');assert.equal(s.title(),'Progress not saved');
 s.restore();s.dom.button('Try again');
 assert.equal(s.reloads,1);assert.equal(readPlayers(s.storage).active,other);
 assert.equal(JSON.parse(s.storage.getItem(SAVE_KEY)).yen,8123);
});

test('a rejected player selection does not reload even when the current save succeeds',()=>{
 const s=setup();addPlayer(s.storage,'Nhung');
 s.storage.setItem(PLAYERS_KEY,JSON.stringify({...readPlayers(s.storage),active:'player-1'}));
 s.activities.state.yen=8123;s.reject(key=>key===PLAYERS_KEY);s.activities.players();
 s.dom.button(s.dom.labels().find(label=>label.startsWith('Switch to Nhung')));
 assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).active,'player-1');assert.equal(s.title(),'Player not changed');
 assert.equal(JSON.parse(s.storage.getItem(SAVE_KEY)).yen,8123);
});

test('new-player creation preserves the current live session when saving is unavailable',t=>{
 const s=setup();t.mock.method(globalThis,'prompt',()=> 'Another visitor');
 s.reject();s.activities.players();s.dom.button('New player');
 assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).players.length,1);assert.equal(s.title(),'Progress not saved');
});

test('new-player creation reports a failed roster write without reloading',t=>{
 const s=setup();t.mock.method(globalThis,'prompt',()=> 'Another visitor');
 s.reject(key=>key===PLAYERS_KEY);s.activities.players();s.dom.button('New player');
 assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).players.length,1);assert.equal(s.title(),'Player not created');
});

test('import cannot activate a slot whose progress failed to write',()=>{
 const s=setup(),before=readPlayers(s.storage);
 s.reject(key=>key.startsWith(SAVE_KEY+'@'));
 assert.equal(addPlayer(s.storage,'Imported',1000,{yen:72}),null);
 assert.deepEqual(readPlayers(s.storage),before);
});

test('an import whose roster write fails removes only its new inactive slot',()=>{
 const s=setup(),before=new Map(s.dom.storage);s.reject(key=>key===PLAYERS_KEY);
 assert.equal(addPlayer(s.storage,'Imported',1000,{yen:72}),null);
 assert.deepEqual(s.dom.storage,before);
});

test('successful import stores the supplied progress before selecting that player',()=>{
 const s=setup(),saved={yen:72,inventory:['Tea']};let activated=false;
 s.storage.setItem=(key,value)=>{
  if(key===PLAYERS_KEY){const roster=JSON.parse(value);assert.deepEqual(JSON.parse(s.storage.getItem(slotKey(roster.active))),saved);activated=true;}
  s.write(key,value);
 };
 const id=addPlayer(s.storage,'Imported',1000,saved);
 assert.ok(id);assert.equal(activated,true);assert.equal(readPlayers(s.storage).active,id);
 assert.deepEqual(JSON.parse(s.storage.getItem(slotKey(id))),saved);
});

test('leaving for another page is blocked until progress can be saved',()=>{
 const s=setup();let left=0;s.reject();
 assert.equal(s.activities.saveBeforeLeaving(()=>left++),false);assert.equal(left,0);
 s.restore();s.dom.button('Try again');assert.equal(left,1);
});

test('the recovery export contains unsaved progress even when local writes keep failing',t=>{
 const s=setup();let exported,clicked=0;
 const create=document.createElement;
 document.createElement=tag=>{const el=create(tag);if(tag==='a'){el.click=()=>clicked++;el.remove=()=>{};}return el;};
 t.mock.method(URL,'createObjectURL',blob=>{exported=blob;return 'blob:save-test';});
 t.mock.method(globalThis,'setTimeout',()=>0);
 s.activities.state.yen=8123;s.reject();s.activities.players();s.dom.button('Save now');s.dom.button('Export save file');
 assert.equal(clicked,1);assert.ok(exported instanceof Blob);assert.equal(s.reloads,0);
 return exported.text().then(text=>{const save=JSON.parse(text);assert.equal(save.state.yen,8123);assert.equal(save.game,'johansson-town');});
});

test('the in-game import keeps the current player if the imported slot cannot be saved',async()=>{
 const s=setup(),create=document.createElement;let input;
 document.createElement=tag=>{const el=create(tag);if(tag==='input'){input=el;el.click=()=>{};}return el;};
 s.activities.players();s.dom.button('Import save file');
 input.files=[{name:'friend.json',text:async()=>JSON.stringify({game:'johansson-world',player:'Friend',state:{yen:72}})}];
 s.reject(key=>key.startsWith(SAVE_KEY+'@'));await input.onchange();
 assert.equal(s.title(),'Import not saved');assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).active,'player-1');
 assert.equal(readPlayers(s.storage).players.length,1);
});

test('failed addPlayer returns no id and never changes the active roster',()=>{
 const s=setup();s.reject(key=>key===PLAYERS_KEY);
 assert.equal(addPlayer(s.storage,'Another visitor'),null);assert.equal(readPlayers(s.storage).active,'player-1');
});

test('title import leaves selection intact on storage failure and permits the same file to be retried',async()=>{
 const s=setup();document.getElementById=id=>document.querySelector('#'+id);
 const {createTitleMenu}=await import('../title-menu.js?save-feedback=1');createTitleMenu({launch(){}});
 const file=document.getElementById('titleImportFile');
 file.files=[{name:'friend.json',text:async()=>JSON.stringify({game:'johansson-town',player:'Friend',state:{yen:72}})}];
 file.value='friend.json';s.reject(key=>key.startsWith(SAVE_KEY+'@'));
 await file.listeners.change[0]();
 assert.equal(s.reloads,0);assert.equal(readPlayers(s.storage).active,'player-1');assert.equal(file.value,'');
 assert.match(document.getElementById('titlePlayerSummary').textContent,/could not save the imported player/);
 s.restore();file.value='friend.json';await file.listeners.change[0]();
 assert.equal(s.reloads,1);assert.notEqual(readPlayers(s.storage).active,'player-1');
 assert.equal(JSON.parse(s.storage.getItem(slotKey(readPlayers(s.storage).active))).yen,72);
});
