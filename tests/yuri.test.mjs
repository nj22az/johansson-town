import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js?snappy=1';

test('Thuan holds a conversation rather than presenting a directory',()=>{
 const dom=installDOM(),options={say(){},onWeather(){},onTime(){},getMinutes:()=>1002};
 const acts=createActivities(options),yen=acts.state.yen;
 let greetings=0;window.__JOHANSSON_CHARACTER_CONTROL__={gesture(name){assert.equal(name,'Thuan');greetings++;}};
 const body=()=>document.querySelector('#activityBody').firstChild.textContent;
 const smallTalk=()=>dom.labels().filter(l=>
  !['Talk with Thuan','Ask her something','At the counter','See you soon, Thuan'].includes(l)
  &&!/^Pay for /.test(l)&&!/Umi-no-yu/.test(l));

 acts.action('resident','Thuan');
 assert.match(body(),/I am Thuan/);
 // Few enough to read at a glance. She used to offer fourteen at once, which is a menu.
 assert.ok(dom.labels().length<=7,'Too much at once: '+JSON.stringify(dom.labels()));
 const first=smallTalk();
 assert.equal(first.length,2,'Two things to talk about, not the whole list');

 // Each one is a real reply, and leads back to her rather than to a dead end.
 dom.button(first[0]);
 assert.ok(body().length>20,'She answers properly');
 assert.ok(dom.has('Tell me something else'));
 dom.button('Tell me something else');
 assert.match(body(),/You are back/);

 // And what she offers moves on, so stopping by again is not the same conversation.
 const second=smallTalk();
 assert.equal(second.length,2);
 assert.deepEqual(second.filter(l=>first.includes(l)),[],
  'The same two topics came round again: '+JSON.stringify({first,second}));

 assert.equal(greetings,1,'Changing topics must not keep waving');
 assert.equal(acts.state.yen,yen,'Talking is free');
 acts.close();

 const restored=createActivities(options);restored.action('resident','Thuan');
 assert.match(body(),/You are back/);
 assert.equal(greetings,2,'A new conversation can greet again');
 restored.close();
 delete window.__JOHANSSON_CHARACTER_CONTROL__;
});

test('the shop paperwork is folded away behind one reply',()=>{
 const dom=installDOM(),acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1002});
 acts.action('resident','Thuan');
 assert.ok(!dom.has('Read the shop ledger'),'The ledger is not a conversation topic');
 dom.button('At the counter');
 assert.ok(dom.has('My stamp card'),'the counter has her stamp card');
 assert.ok(!dom.has('Read the shop ledger'),'the ledger is still one more step away');
 dom.button('The shop side of things');
 assert.ok(dom.has('Read the shop ledger'));
 assert.ok(dom.has('Sell items from my bag'));
 dom.button('Back to Thuan');
 assert.ok(dom.has('Talk with Thuan'),'and it comes back to her');
 acts.close();
});


test('at the counter she sells hot snacks and recommends something from the shelves',()=>{
 const dom=installDOM(),acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600,getSocialContext:()=>({inside:'market',thuanAvailable:true})});
 const yen=acts.state.yen,bag=acts.state.inventory.length;
 acts.action('resident','Thuan');dom.button('At the counter');
 assert.ok(dom.has('Hot snacks from the case'));
 dom.button('Hot snacks from the case');
 const snack=dom.labels().find(l=>/Nikuman/.test(l));assert.ok(snack,'the steamer has buns');
 dom.button(snack);
 assert.equal(acts.state.yen,yen-120);
 assert.equal(acts.state.inventory.length,bag+1);
 assert.ok(acts.state.inventory.includes('Nikuman bun'));
 dom.button('Back to Thuan');dom.button('At the counter');dom.button('What do you recommend?');
 const into=dom.labels().find(l=>/^Into the basket/.test(l));assert.ok(into,'she offers her pick');
 dom.button(into);
 assert.equal(acts.state.konbini.basket.length,1);
 acts.close();
});
