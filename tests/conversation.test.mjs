import test from 'node:test';
import assert from 'node:assert/strict';
import {conversationViewport} from '../src/conversation-layout.js';
import {createActivities} from '../activities.js?snappy=1';
import {installDOM} from './fixtures.mjs';

test('conversation reserves a separate scene area on phones, tablets and desktop',()=>{
 for(const [width,height] of [[390,844],[844,390],[1024,768],[1440,900]]){
  const view=conversationViewport(width,height,true);
  // Talking no longer takes the view away: the line is a bubble on the speaker and
  // the replies are a strip along the bottom, so the scene keeps the whole screen.
  assert.deepEqual(view,{width,height},'A conversation never shrinks the town');
  assert.deepEqual(conversationViewport(width,height,false),{width,height});
 }
});
test('Thuan topics and resident quest replies retain bubbles; notebook and close restore the scene',()=>{
 const dom=installDOM(),speakers=[];
 const acts=createActivities({say(){},onWeather(){},onTime(){},onConversation:name=>speakers.push(name)});
 const modal=document.querySelector('#activity');
 acts.action('resident','Thuan');assert.equal(speakers.at(-1),'Thuan');assert.ok(modal.classList.contains('conversation'));
 dom.button('I like your hair');assert.equal(speakers.at(-1),'Thuan');
 acts.close();assert.equal(speakers.at(-1),null);assert.ok(!document.body.classList.contains('conversation-open'));
 acts.action('resident','Nhung');dom.button('About Tama');assert.equal(speakers.at(-1),'Nhung');
 assert.ok(modal.classList.contains('conversation'));
 acts.inventory();assert.equal(speakers.at(-1),null);assert.ok(!modal.classList.contains('conversation'));acts.close();
});
