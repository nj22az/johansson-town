import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {buyHotSnack,HOT_SNACKS} from '../src/commerce/konbini.js';
import {GROCERY_ITEMS} from '../src/commerce/catalogue.js';

function fixture(){
 const dom=installDOM(),body=document.querySelector('#activityBody'),snacks=[],drinks=[];
 // The shared DOM fixture does not implement prepend, used by the bag's actual
 // food portrait. Keep that small extension local to this activity body.
 body.prepend=(...children)=>body.children.unshift(...children);
 let acts;
 acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600,
  getSocialContext:()=>({inside:'market',thuanAvailable:true}),
  onSnack(item){
   assert.equal(acts.paused,false,'the bag closes before handing food to the game');
   snacks.push(item);const index=acts.state.inventory.indexOf(item);
   if(index<0)return false;
   acts.state.inventory.splice(index,1);acts.save();return true;
  },
  onDrink(item){drinks.push(item);return true;},
 });
 const tile=item=>{
  const grid=body.children.find(n=>n.className==='bag-grid');assert.ok(grid,'the real bag grid should be open');
  const button=grid.children.find(n=>n.children.some(c=>c.className==='bag-name'&&c.textContent===item));
  assert.ok(button,'the bag needs a tile for '+item);return button;
 };
 return {dom,acts,snacks,drinks,body,tile};
}
const text=node=>[node.textContent||'',...node.children.map(text)].join(' ');
const accounting=state=>({yen:state.yen,sakura:structuredClone(state.sakura)});

test('purchased nikuman is usable from its actual bag tile, consumes one at a time, and stale menu clicks cannot consume another',()=>{
 const f=fixture(),snack=HOT_SNACKS.find(s=>s.id==='nikuman');
 for(let i=0;i<2;i++)assert.equal(buyHotSnack(f.acts.state,snack.id,600,true).ok,true);
 assert.equal(f.acts.state.yen,1200-snack.cost*2);assert.deepEqual(f.acts.state.inventory,[snack.name,snack.name]);
 const paid=accounting(f.acts.state);
 f.acts.bag();const originalTile=f.tile(snack.name);originalTile.onclick();
 assert.equal(document.querySelector('#activityTitle').textContent,snack.name);
 assert.ok(text(f.body).includes(snack.line),'the selected item explains the real hot snack');
 const eat=document.querySelector('#activityActions').children.find(b=>b.textContent==='Eat it');
 assert.ok(eat&&!eat.disabled,'a purchased nikuman must offer an enabled Eat it action');
 eat.onclick();assert.deepEqual(f.snacks,[snack.name]);assert.deepEqual(f.acts.state.inventory,[snack.name]);
 assert.deepEqual(accounting(f.acts.state),paid,'eating is not another purchase or stock movement');
 eat.onclick();assert.deepEqual(f.snacks,[snack.name],'the retired modal action must not dispatch again');
 assert.deepEqual(f.acts.state.inventory,[snack.name]);
 f.acts.bag();f.tile(snack.name).onclick();f.dom.button('Eat it');
 assert.deepEqual(f.snacks,[snack.name,snack.name]);assert.deepEqual(f.acts.state.inventory,[]);
 assert.deepEqual(accounting(f.acts.state),paid);
 f.acts.bag();assert.match(text(f.body),/Your bag is empty/);assert.ok(!f.dom.has('Eat it'));
 originalTile.onclick();assert.ok(!f.dom.has('Eat it'),'a stale bag tile cannot offer food no longer carried');
 assert.deepEqual(f.snacks,[snack.name,snack.name]);f.acts.close();
});

test('each hot-case service item reaches the existing snack callback from the real bag menu',()=>{
 for(const snack of HOT_SNACKS){
  const f=fixture();assert.equal(buyHotSnack(f.acts.state,snack.id,600,true).ok,true);
  const paid=accounting(f.acts.state);f.acts.bag();f.tile(snack.name).onclick();
  assert.ok(f.dom.has('Eat it'),snack.name+' has no eat action');f.dom.button('Eat it');
  assert.deepEqual(f.snacks,[snack.name]);assert.deepEqual(f.acts.state.inventory,[]);
  assert.deepEqual(accounting(f.acts.state),paid);f.acts.close();
 }
});

test('paper goods are never edible and the existing drink action stays available',()=>{
 const f=fixture(),paper=GROCERY_ITEMS.find(i=>i.id==='notebook'),tea=GROCERY_ITEMS.find(i=>i.id==='tea');
 f.acts.state.inventory.push(paper.name,tea.name);const before=accounting(f.acts.state);
 f.acts.bag();f.tile(paper.name).onclick();assert.ok(!f.dom.has('Eat it'));assert.ok(!f.dom.has('Drink it'));
 assert.deepEqual(f.snacks,[]);assert.deepEqual(f.drinks,[]);assert.deepEqual(accounting(f.acts.state),before);
 f.dom.button('Back to the bag');f.tile(tea.name).onclick();assert.ok(f.dom.has('Drink it'));assert.ok(!f.dom.has('Eat it'));
 f.dom.button('Drink it');assert.deepEqual(f.drinks,[tea.name]);assert.deepEqual(f.snacks,[]);assert.equal(f.acts.paused,false);
 assert.deepEqual(accounting(f.acts.state),before);f.acts.close();
});
