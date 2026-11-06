import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivities} from '../activities.js?lifecycle=1';
import {installDOM,Element} from './fixtures.mjs';

test('a new activity calls onOpen once; nested menus retain the opener and reject stale actions',()=>{
 const dom=installDOM(),opener=new Element();opener.focus();
 let opens=0,staleRuns=0;
 const acts=createActivities({say(){},onWeather(){},onTime(){},onOpen(){opens++;document.body.classList.remove('town-menu-open');}});
 document.body.classList.add('town-menu-open');
 acts.menu('First menu','Pick a child',[['Open child',()=>acts.menu('Child menu','Updated in the same modal',[['Done',acts.close]])],['Old action',()=>staleRuns++]]);
 assert.equal(opens,1);assert.equal(document.body.classList.contains('town-menu-open'),false);
 const stale=document.querySelector('#activityActions').children[1];
 dom.button('Open child');assert.equal(document.querySelector('#activityTitle').textContent,'Child menu');
 assert.equal(opens,1,'A child update does not close/reset the parent UI again');
 stale.onclick();assert.equal(staleRuns,0,'An action from the replaced menu cannot still run');
 dom.button('Done');assert.equal(acts.paused,false);assert.equal(document.activeElement,opener,'Closing restores the initiating focus');
 const next=new Element();next.focus();acts.menu('Next menu','A fresh opening');assert.equal(opens,2);
 acts.close();assert.equal(document.activeElement,next);
});

test('dialogue replies and switching to the field book do not reopen the activity',()=>{
 const dom=installDOM(),opener=new Element();opener.focus();let opens=0;
 const acts=createActivities({say(){},onWeather(){},onTime(){},onOpen(){opens++;}});
 acts.action('resident','Thuan');assert.equal(opens,1);assert.equal(document.body.classList.contains('conversation-open'),true);
 dom.button('I like your hair');assert.equal(opens,1);assert.equal(document.body.classList.contains('conversation-open'),true);
 acts.inventory();assert.equal(opens,1);assert.equal(document.body.classList.contains('conversation-open'),false);
 acts.close();assert.equal(document.activeElement,opener);
 acts.action('resident','Nhung');assert.equal(opens,2);dom.button('About Tama');assert.equal(opens,2);
 acts.close();assert.equal(document.activeElement,opener);
});
