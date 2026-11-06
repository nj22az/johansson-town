import test from 'node:test';
import assert from 'node:assert/strict';
import {Element} from './fixtures.mjs';
import {residentCards} from '../src/people/home-directory.js';
import {renderTownDirectory} from '../src/ui/town-directory.js';

function container(){
 class Node extends Element{constructor(tag){super();this.tagName=tag;this.attributes={};}prepend(...items){this.children.unshift(...items);}setAttribute(name,value){this.attributes[name]=value;}}
 const doc={createElement(tag){const e=new Node(tag);e.ownerDocument=doc;return e;}};return doc.createElement('div');
}
const nodes=root=>[root,...root.children.flatMap(nodes)];
const find=(root,predicate)=>nodes(root).find(predicate);
const all=(root,predicate)=>nodes(root).filter(predicate);
const tab=(root,id)=>find(root,n=>n.tagName==='button'&&n.dataset.townFilter===id);
const search=root=>find(root,n=>n.tagName==='input');
const text=root=>[root.textContent||'',...root.children.map(text)].join(' ');

test('Places, Homes and all 23 People stay searchable; Show home and Find person call different targets',()=>{
 const root=container(),calls=[],places=[{id:'market',title:'Sakura Shōten',line:'Groceries',x:-5.5,y:0,z:-28.5},
  {id:'home-kitahama-3',title:'Kōji’s home',isResidence:true,x:37.65,z:67.3}];
 const cards=residentCards({sites:places,minutes:600}),api=renderTownDirectory(root,{cards,places,progress:{unlocked:false},
  onShowHome:(...args)=>calls.push(['home',...args]),onFindPerson:(...args)=>calls.push(['person',...args]),onPlace:p=>calls.push(['place',p])});
 assert.equal(root.dataset.townFilter,'places');assert.equal(all(root,n=>n.dataset.placeId).length,1);
 const direction=find(root,n=>n.dataset.id==='market');assert.equal(direction.dataset.travel,'locked');direction.onclick();assert.equal(calls.at(-1)[0],'place');
 assert.equal(all(root,n=>n.dataset.shortcut).length,0);
 // The 12 households' homes, Kai's rented house and the four cabins aboard: no removed house and no retired flat (phase 4;
 // the doctor's flat went with Dr Kakazu on 22 October 2026).
 tab(root,'homes').onclick();assert.equal(all(root,n=>n.dataset.homeId).length,17);
 const family=find(root,n=>n.dataset.homeId==='kitahama-1');for(const name of ['Thao','Chin','Vy'])assert.ok(text(family).includes(name));assert.ok(!text(family).includes('Thuan'),'Thuan’s weekday room is gone');
 search(root).value='koji';search(root).oninput();assert.equal(all(root,n=>n.dataset.homeId).length,1);
 find(root,n=>n.dataset.showHome==='kitahama-3').onclick();assert.equal(calls.at(-1)[1].homeId,'kitahama-3');assert.equal(calls.at(-1)[3].id,'kitahama-3');
 api.refresh(cards);assert.equal(search(root).value,'koji');assert.equal(root.dataset.townFilter,'homes');assert.equal(all(root,n=>n.dataset.homeId).length,1);
 search(root).value='';search(root).oninput();tab(root,'people').onclick();assert.equal(all(root,n=>n.dataset.personId).length,23);
 for(const name of ['Reiko','Barfly','Postman Tōma','Bus driver','Dr Kakazu','Mrs Nakamura','Mai'])assert.equal(find(root,n=>n.dataset.personId===name),undefined,name+' is retired and has no card');
 const thuan=find(root,n=>n.dataset.personId==='Thuan');assert.ok(text(thuan).includes('Home'));assert.ok(text(thuan).includes('Current location'));assert.ok(text(thuan).includes('Kitano hamlet'));
 find(thuan,n=>n.dataset.showHome==='kitano-1').onclick();assert.equal(calls.at(-1)[1].homeId,'kitano-1');
 find(thuan,n=>n.dataset.findPerson==='Thuan').onclick();assert.equal(calls.at(-1)[0],'person');assert.equal(calls.at(-1)[1].id,'market');
 api.destroy();assert.equal(root.children.length,0);assert.equal(root.dataset.townFilter,'people');
});

test('unlocked shortcuts are separate on places and homes and preserve an explicitly selected secondary home',()=>{
 const root=container(),calls=[],cards=residentCards();
 const api=renderTownDirectory(root,{cards,places:[{id:'park',title:'Harbour Park',x:0,z:0}],progress:{unlocked:true},onShortcut:p=>calls.push(p),onShowHome(){}});
 const shortcut=find(root,n=>n.dataset.shortcut==='park');assert.equal(shortcut.dataset.travel,'ready');shortcut.onclick();assert.equal(calls.at(-1).id,'park');
 tab(root,'homes').onclick();const family=find(root,n=>n.dataset.homeId==='kitahama-1');
 const show=find(family,n=>n.dataset.showHome);assert.equal(show.dataset.id,'resident-home-thuan');assert.equal(show.dataset.travel,'locked');
 find(family,n=>n.dataset.shortcut==='resident-home-thuan').onclick();assert.equal(calls.at(-1).homeId,'kitahama-1');
 tab(root,'people').onclick();assert.equal(all(root,n=>n.dataset.shortcut).length,0);
 api.destroy();
});

test('the Studio action remains available from the Town Book',()=>{
 const root=container();let opened=0;
 const api=renderTownDirectory(root,{onStudio:()=>opened++});
 const studio=find(root,n=>n.tagName==='button'&&n.textContent==='Open Studio');
 assert.ok(studio);studio.onclick();assert.equal(opened,1);api.destroy();
});

test('resident records appear only for supported people and never advertise a travel target',()=>{
 const root=container(),calls=[],cards=residentCards().filter(c=>['Chin','Riku'].includes(c.name));
 let api=renderTownDirectory(root,{cards,canRecord:name=>name==='Chin',onRecord:(...args)=>calls.push(args)});
 tab(root,'people').onclick();assert.equal(all(root,n=>n.dataset.personId).length,2);
 const records=all(root,n=>n.dataset.residentRecord);assert.equal(records.length,1);
 const record=records[0];assert.equal(record.dataset.residentRecord,'Chin');assert.equal(record.textContent,'Resident record');
 assert.equal(record.dataset.id,undefined);assert.equal(record.dataset.travel,undefined);assert.ok(!record.disabled);
 assert.equal(all(find(root,n=>n.dataset.personId==='Riku'),n=>n.dataset.residentRecord).length,0);
 record.onclick();assert.equal(calls[0][0],'Chin');assert.equal(calls[0][1],cards.find(c=>c.name==='Chin'));
 api.destroy();
 api=renderTownDirectory(root,{cards,onRecord:()=>{throw new Error('Unsupported records must stay hidden');}});
 assert.equal(all(root,n=>n.dataset.residentRecord).length,0);api.destroy();
 api=renderTownDirectory(root,{cards,canRecord:()=>true});assert.equal(all(root,n=>n.dataset.residentRecord).length,0);api.destroy();
});

test('Play as appears for playable residents, marks who you are, and is never a travel target',()=>{
 const root=container(),calls=[],cards=residentCards().filter(c=>['Johansson','Thuan','Riku'].includes(c.name));
 let active='Johansson';
 const api=renderTownDirectory(root,{cards,canPlayAs:name=>name!=='Riku',playing:name=>name===active,onPlayAs:(...args)=>calls.push(args)});
 tab(root,'people').onclick();
 const plays=all(root,n=>n.dataset.playAs);assert.deepEqual(plays.map(n=>n.dataset.playAs),['Johansson','Thuan']);
 const johansson=plays[0],thuan=plays[1];
 assert.equal(johansson.textContent,'Playing now');assert.ok(johansson.disabled);
 assert.equal(thuan.textContent,'Play as Thuan');assert.ok(!thuan.disabled);
 assert.equal(thuan.dataset.id,undefined);assert.equal(thuan.dataset.travel,undefined);
 thuan.onclick();assert.equal(calls[0][0],'Thuan');assert.equal(calls[0][1],cards.find(c=>c.name==='Thuan'));
 active='Thuan';api.refresh(cards);
 assert.equal(find(root,n=>n.dataset.playAs==='Thuan').textContent,'Playing now');
 assert.equal(find(root,n=>n.dataset.playAs==='Johansson').textContent,'Play as Johansson');
 api.destroy();
});
