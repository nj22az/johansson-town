import assert from 'node:assert/strict';
import {ITEMS} from '../content-data.js';
import {DIALOGUE} from '../src/people/schedules.js?snappy=1';
import {makeContentObject} from '../content-items.js';
import {createContentItems} from '../content-items.js';
import {createTown} from '../src/world/town.js?snappy=1';
import {STREET_CAST,WORLD_CAST} from '../src/people/residents.js';
import {createCharacters} from '../src/people/characters.js?snappy=1';
import {createActivities} from '../activities.js?snappy=1';
import {createInspector} from '../inspect-3d.js';
import * as THREE from '../vendor/three.module.js';
class Element{
 constructor(){this.children=[];this.dataset={};this.hidden=false;this.style={};this.listeners={};this.classList={add(){},remove(){},contains(){return true;},toggle(){}};}
 append(...items){this.children.push(...items);}appendChild(e){this.append(e);}replaceChildren(){this.children=[];}querySelector(){return null;}remove(){}focus(){}setAttribute(){}querySelectorAll(){return this.children;}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}get firstChild(){return this.children[0];}get lastChild(){return this.children.at(-1);}
 getContext(){const gradient=()=>({addColorStop(){}});return new Proxy({fillRect(){},strokeRect(){},fillText(){},measureText(s){return {width:s.length*17};},createLinearGradient:gradient,createRadialGradient:gradient,createConicGradient:gradient,createPattern:()=>({setTransform(){}})},{get:(o,k)=>o[k]||(()=>{})});}
}
const elements=new Map();globalThis.document={createElement:()=>new Element(),querySelector:s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);},addEventListener(){},exitPointerLock(){},activeElement:new Element(),documentElement:new Element(),body:new Element()};
globalThis.window={open:()=>null};globalThis.location={href:'https://nj22az.github.io/johansson-town/'};
const storage=new Map([['johansson-town-1988-v3',JSON.stringify({yen:888,quest:1,inventory:['Mackerel'],visited:['office']})]]);
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
globalThis.innerWidth=1024;
document.createElementNS=()=>new Element();
navigator.vibrate=()=>{};
assert.equal(new Set(ITEMS.map(i=>i.id)).size,ITEMS.length);
assert.equal(ITEMS.filter(i=>i.kind==='book').length,6);
for(const item of ITEMS){const g=makeContentObject(item);assert.ok(g.children.length>0);g.userData.reader.open();g.userData.reader.next(999);assert.equal(g.userData.reader.page,item.pages.length);g.userData.reader.next(-999);assert.equal(g.userData.reader.page,1);g.userData.reader.flip();g.userData.reader.update(.1);g.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.position.count>0);});}
const acts=createActivities({say(){},onWeather(){},onTime(){}});
assert.equal(acts.state.yen,888);assert.equal(acts.state.quest,1);assert.ok(storage.has('johansson-town-1988-v3'),'migration preserves v3');
for(const id of ['book','cv','keychain','bligh'])acts.inspectItem(ITEMS.find(i=>i.id===id));
acts.inspectItem(ITEMS.find(i=>i.id==='book'));assert.equal(acts.state.inspectedIds.length,4);
assert.equal(JSON.parse(storage.get('johansson-town-1988-v5')).inspectedIds.length,4);
acts.openURL('https://example.com/');assert.ok(!acts.state.notes.includes('https://example.com/'));
for(const name of Object.keys(DIALOGUE).filter(name=>name!=='Thuan')){const lines=[];for(let i=0;i<8;i++){acts.action('resident',name);const text=document.querySelector('#activityBody').firstChild.textContent;assert.ok(!lines.slice(-3).includes(text),name+' repeated within three lines');lines.push(text);}assert.ok(lines.length>=6);}
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();let dpr=2;const renderer={getPixelRatio:()=>dpr,setPixelRatio:n=>dpr=n,render(){}};
const inspector=createInspector({scene,camera,renderer,canvas:new Element(),onInspect:i=>acts.inspectItem(i),onLink(){},onContact(){},resetInput(){}});
inspector.open(ITEMS[0]);assert.equal(inspector.active,true);assert.ok(dpr<2);inspector.render(.016);inspector.close();assert.equal(inspector.active,false);assert.equal(dpr,2);
console.log('Office checks passed: 18 mesh items, pages, v3 migration, deduplication, callbacks, blocked links, temporary inspector and DPR restoration.');
const anchors=[];
const world=createTown({scene,sites:[],mobile:true,shadows:false,register:(o,label,fn)=>anchors.push({o,label,fn}),onAction(){},enter(){},getPlayerPosition:()=>new THREE.Vector3()});
const characters=createCharacters({mobile:true,shadows:false});world.people.forEach(p=>characters.attach(p.g,p.g.userData.name));
assert.equal(world.people.length,WORLD_CAST.length);assert.equal(characters.actors.length,WORLD_CAST.length,'Every resident is a Shimanchu from the first frame');
createContentItems({group:world.group,register:(o,label,fn)=>anchors.push({o,label,fn}),colliders:world.colliders,onInspect(){},onRead(){}});
world.update(.016,1,1);world.beats.update(.016,1,1000);characters.update(.016);
for(const id of ['keychain','cv'])assert.ok(anchors.some(a=>a.label==='Lift '+ITEMS.find(i=>i.id===id).title),id+' stays inspectable');
console.log('Combined world construction passed: twenty-two local residents, working pier, content anchors and living props.');
