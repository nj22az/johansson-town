import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivities} from '../activities.js?title-save=1';
import {installDOM} from './fixtures.mjs';
import {SAVE_KEY} from '../src/save.js';

test('title preview cannot create or overwrite a save; saving resumes when play begins',()=>{
 installDOM();
 const original=JSON.stringify({yen:273,minutes:720,inventory:['Tea'],visited:[]});
 localStorage.setItem(SAVE_KEY,original);
 globalThis.__JOHANSSON_TITLE_PREVIEW__=true;
 try {
  const activities=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>730});
  activities.state.yen=274;
  assert.equal(activities.save(),false);
  assert.equal(localStorage.getItem(SAVE_KEY),original);
  globalThis.__JOHANSSON_TITLE_PREVIEW__=false;
  assert.equal(activities.save(),true);
  assert.equal(JSON.parse(localStorage.getItem(SAVE_KEY)).yen,274);
 }finally{delete globalThis.__JOHANSSON_TITLE_PREVIEW__;}
});
