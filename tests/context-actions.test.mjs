import test from 'node:test';
import assert from 'node:assert/strict';
import {contextActions,createContextRail} from '../src/interact/context-actions.js';

const idle={playing:true,paused:false,seated:false,inside:false};
const primary=state=>contextActions({...idle,...state}).actions.filter(a=>a.primary);
const ids=state=>contextActions({...idle,...state}).actions.map(a=>a.id);

test('exploration offers a single named next action and no generic idle button',()=>{
 assert.deepEqual(ids({}),[]);
 assert.deepEqual(ids({targetLabel:'E · Talk to Thuan'}),['act']);
 assert.equal(primary({targetLabel:'E · Talk to Thuan'})[0].label,'Talk to Thuan');
 assert.deepEqual(ids({targetLabel:'Enter Sakura',enterLabel:'Enter Sakura'}),['enterBuildingButton']);
 assert.deepEqual(ids({targetLabel:'Come into Minato Izakaya',enterLabel:'Enter Minato Izakaya'}),['enterBuildingButton']);
 assert.deepEqual(ids({targetLabel:'Come into Sato Ramen',enterLabel:'Enter Sato Ramen'}),['enterBuildingButton']);
 assert.equal(primary({targetLabel:'Enter Sakura',enterLabel:'Enter Sakura'}).length,1);
 assert.deepEqual(ids({targetLabel:'Talk to Reiko',enterLabel:'Enter Front-Row Books'}),['act','enterBuildingButton']);
 assert.equal(primary({targetLabel:'Talk to Reiko',enterLabel:'Enter Front-Row Books'})[0].id,'act');
 assert.deepEqual(ids({inside:true,targetLabel:'Read the notice'}),['act','exitRoomButton']);
 assert.deepEqual(ids({inside:true,targetLabel:'Exit building'}),['exitRoomButton']);
 assert.deepEqual(ids({inside:true,canExit:false}),[]);
});

test('benches, meals, pending orders and held drinks show only usable choices',()=>{
 assert.deepEqual(ids({seated:true}),['standButton']);
 assert.deepEqual(ids({seated:true,table:true,canOrder:true}),['orderButton','standButton']);
 const dining={seated:true,table:true,canEat:true,canDrink:true,canOrder:true};
 assert.deepEqual(ids(dining),['eatButton','drink','orderButton','standButton']);
 assert.deepEqual(primary(dining).map(a=>a.id),['eatButton']);
 assert.equal(ids(dining).includes('act'),false,'A meal never offers a duplicate generic Context action');
 const pending=contextActions({...idle,seated:true,table:true,orderPending:true});
 assert.deepEqual(pending.actions.map(a=>a.id),['standButton']);assert.match(pending.status,/on its way/);
 assert.deepEqual(ids({heldDrink:true}),['drink']);
 assert.equal(primary({heldDrink:true})[0].key,'E','The primary shortcut follows the visible next action');
 assert.deepEqual(ids({targetLabel:'Inspect the clock',heldDrink:true}),['act','drink']);
 assert.deepEqual(ids({seated:true,table:true,canDrink:true}),['drink','standButton']);
});

test('a pressed action retains its meaning until release, and menus clear the rail',()=>{
 const previous=contextActions({...idle,targetLabel:'Talk to Thuan'}).actions;
 const held=contextActions({...idle,targetLabel:'Read a notice',pressed:['act'],previousActions:previous});
 assert.equal(held.actions.filter(a=>a.primary).length,1);assert.equal(held.actions[0].label,'Talk to Thuan');
 const lost=contextActions({...idle,pressed:['act'],previousActions:previous});assert.equal(lost.actions[0].id,'act');
 assert.equal(contextActions({...idle,previousActions:previous}).actions.length,0);
 for(const state of [{paused:true},{playing:false}]){
  assert.deepEqual(contextActions({...idle,...state,seated:true,table:true,canEat:true,pressed:['act'],previousActions:previous}),{actions:[],status:''});
 }
});

class Node{
 constructor(){this.children=[];this.attributes=new Map();this.classes=new Set();this.hidden=false;this.disabled=false;this.tabIndex=0;this.textContent='';this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name),contains:name=>this.classes.has(name)};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 setAttribute(name,value){this.attributes.set(name,value);}getAttribute(name){return this.attributes.get(name);}
 removeAttribute(name){this.attributes.delete(name);}
}
function fixture(){
 const elements=new Map(['contextActions','contextActionStatus','act','enterBuildingButton','exitRoomButton','standButton','orderButton','eatButton','drink'].map(id=>[id,new Node()]));
 const doc={querySelector:selector=>elements.get(selector.slice(1)),createElement:()=>new Node()};
 return {doc,get:id=>elements.get(id)};
}

test('the live rail hides and disables inactive controls and exposes full accessible labels',()=>{
 const {doc,get}=fixture(),calls=[],rail=createContextRail({doc,onAction:(id,event)=>calls.push({id,detail:event.detail})});
 rail.update({...idle,seated:true});
 assert.equal(get('standButton').hidden,false);assert.equal(get('standButton').disabled,false);assert.equal(get('standButton').tabIndex,0);
 assert.equal(get('standButton').getAttribute('aria-label'),'Stand up');assert.equal(get('standButton').classList.contains('context-primary'),true);
 assert.equal(get('standButton').getAttribute('aria-keyshortcuts'),'E');
 for(const id of ['act','enterBuildingButton','exitRoomButton','orderButton','eatButton','drink']){
  assert.equal(get(id).hidden,true,id);assert.equal(get(id).disabled,true,id);assert.equal(get(id).tabIndex,-1,id);assert.equal(get(id).getAttribute('aria-hidden'),'true',id);
 }
 get('standButton').onpointerdown({button:0,preventDefault(){},stopPropagation(){}});
 get('standButton').onclick({detail:1});assert.equal(calls.length,1,'A pointer press runs only once, despite its later synthetic click');
 get('standButton').onclick({detail:0});assert.equal(calls.length,2,'Keyboard activation remains available');
 rail.update({...idle,seated:true,table:true,canEat:true});
 assert.equal(get('eatButton').getAttribute('aria-keyshortcuts'),'E');
 assert.equal(get('standButton').getAttribute('aria-keyshortcuts'),undefined,'A secondary Stand button no longer advertises the primary shortcut');
 rail.update({...idle,targetLabel:'Read the harbour opening hours'});
 assert.equal(get('standButton').hidden,true);assert.equal(get('act').getAttribute('aria-label'),'Read the harbour opening hours');assert.equal(get('act').disabled,false);
 assert.equal(rail.activatePrimary(),true);assert.equal(calls.at(-1).id,'act');
 rail.update({...idle,paused:true,targetLabel:'Read the harbour opening hours'});
 assert.equal(get('contextActions').hidden,true);assert.equal(rail.activatePrimary(),false);
 get('act').onclick({detail:0});assert.equal(calls.length,3,'An unavailable action cannot execute through a stale keyboard focus');
});

test('door controls expose their transition completion to integration callers',async()=>{
 const {doc,get}=fixture(),completion=Promise.resolve('entered');
 const rail=createContextRail({doc,onAction:()=>completion});
 rail.update({...idle,targetLabel:'Enter Sakura',enterLabel:'Enter Sakura'});
 assert.equal(get('enterBuildingButton').onclick({detail:0}),completion);
 assert.equal(get('enterBuildingButton').onpointerdown({button:0}),completion);
 assert.equal(await get('enterBuildingButton').onclick({detail:0}),'entered');
});

test('pending delivery is announced once instead of repeatedly on each frame',()=>{
 const {doc,get}=fixture(),status=get('contextActionStatus');
 let value='',announcements=0;
 Object.defineProperty(status,'textContent',{get:()=>value,set:text=>{value=text;announcements++;}});
 const rail=createContextRail({doc}),waiting={...idle,seated:true,table:true,orderPending:true};
 rail.update(waiting);rail.update(waiting);rail.update(waiting);
 assert.equal(announcements,1);assert.equal(status.hidden,false);
 rail.update({...waiting,orderPending:false,canEat:true});
 assert.equal(status.hidden,true);assert.equal(value,'');
});

test('console action cycling stays selected until the nearby context changes',()=>{
 const {doc}=fixture(),calls=[],rail=createContextRail({doc,onAction:id=>calls.push(id)}),state={...idle,targetLabel:'Read the noticeboard',enterLabel:'Enter the waiting hall'};
 rail.update(state);assert.equal(rail.primary.id,'act');assert.equal(rail.cycle(1),true);assert.equal(rail.primary.id,'enterBuildingButton');rail.update(state);rail.activatePrimary();assert.equal(calls.at(-1),'enterBuildingButton');rail.cycle(-1);assert.equal(rail.primary.id,'act');rail.cycle(1);rail.update({...state,targetLabel:'Talk to the harbour master'});assert.equal(rail.primary.id,'act');rail.update({...idle});assert.equal(rail.cycle(1),false);
});

test('the last action fades out with its words on it, but can no longer be pressed or read',()=>{
 const {doc,get}=fixture(),calls=[],rail=createContextRail({doc,onAction:id=>calls.push(id)});
 rail.update({...idle,targetLabel:'Look at the fire escape'});
 rail.update({...idle});
 const act=get('act');
 assert.equal(get('contextActions').hidden,true,'the rail is hidden (quiet-hud.css fades it)');
 assert.equal(act.hidden,false,'the button keeps its face while the rail fades');
 assert.equal(act.getAttribute('aria-label'),'Look at the fire escape');
 assert.equal(act.disabled,true);assert.equal(act.tabIndex,-1);assert.equal(act.getAttribute('aria-hidden'),'true');
 act.onclick({detail:0});act.onpointerdown({button:0,preventDefault(){},stopPropagation(){}});
 assert.equal(calls.length,0,'a fading button does nothing');assert.equal(rail.activatePrimary(),false);
 rail.update({...idle,inside:true,canExit:true});
 assert.equal(act.hidden,true,'a new action takes the rail, and the old one is gone');assert.equal(get('exitRoomButton').hidden,false);
});
