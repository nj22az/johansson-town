import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivities} from '../activities.js?pocket=1';
import {installDOM} from './fixtures.mjs';
import {packShades,PHOTO_W,PHOTO_H,ALBUM_SLOTS} from '../src/photo/pocket-album.js';
import {eveningNews} from '../src/feed/evening-news.js';
import {diaryPage} from '../src/progression/diary.js';
import {openYear} from '../src/progression/year-loop.js';

// Day 3 of the local days since 1970 is Sunday 4 January 1970: the device calendar keeps real weekdays and no longer
// projects them into 1997, when 4 January was a Saturday (the owner, 26 October 2026; johansson-town/AGENTS.md).
const minutes=3*1440+12*60+40;
const shot=(people=['Thao'],place={id:'izakaya',title:'Minato Izakaya'})=>({w:PHOTO_W,h:PHOTO_H,shades:packShades(new Uint8Array(PHOTO_W*PHOTO_H).fill(2)),palette:'green',day:3,minutes:12*60+40,place,people,note:''});
const make=saved=>{const dom=installDOM(saved);const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes});return {dom,acts};};

test('a kept photo is saved with the player, comes back after a reload, and the Field book opens the album',()=>{
 const {dom,acts}=make();
 const r=acts.keepPhoto(shot());
 assert.equal(r.ok,true);assert.equal(r.text,'Kept: Thao · Minato Izakaya · Sunday 4 January, 12:40.');
 assert.equal(acts.album.length,1);acts.save();
 const again=make(Object.fromEntries(dom.storage));
 assert.deepEqual(again.acts.album.map(p=>[p.id,p.people,p.place.title]),[['ph1',['Thao'],'Minato Izakaya']]);
 again.acts.inventory();again.dom.button('Pocket album');
 assert.equal(document.querySelector('#activityTitle').textContent,'Pocket album');
 assert.ok(again.dom.has('Field book')&&again.dom.has('Back to town'));
});

test('the first photo of a resident is a diary moment and an Evening News item; a full album says so',()=>{
 const {acts}=make();
 acts.keepPhoto(shot());acts.keepPhoto(shot(['Thao']));
 const state=acts.state;
 assert.match(diaryPage(state,minutes),/Took a photo of Thao at Minato Izakaya with my Pocket Gentleman camera\. My first photo of Thao\./);
 const news=eveningNews(state,minutes);
 assert.ok(news.items.includes('Thao was photographed by the mayor at Minato Izakaya today. The mayor has a Pocket Gentleman camera.'),JSON.stringify(news.items));
 assert.equal(news.items.filter(t=>/photographed/.test(t)).length,1,'a second photo of her is not news again');
 for(let i=acts.album.length;i<ALBUM_SLOTS;i++)assert.equal(acts.keepPhoto(shot([],null)).ok,true);
 const full=acts.keepPhoto(shot());assert.equal(full.ok,false);assert.match(full.text,/album is full: 30 photos/);
 assert.equal(acts.letGoPhoto('ph2'),true);assert.equal(acts.keepPhoto(shot()).ok,true);
});

test('a new year keeps the album, as it keeps the decorating',()=>{
 const saved={loopYear:2025,loops:0,minutes,pocketAlbum:[{...shot(),id:'ph1'}],yen:10};
 const {saved:next,turned}=openYear(saved,new Date('2026-02-01T12:00:00'));
 assert.equal(turned,true);assert.equal(next.pocketAlbum.length,1);
});

test('a photo number is never given twice, and letting go of a photo does not make the next one news again',()=>{
 const {dom,acts}=make();
 assert.equal(acts.keepPhoto(shot()).photo.id,'ph1');
 acts.letGoPhoto('ph1');
 const next=acts.keepPhoto(shot());
 assert.equal(next.photo.id,'ph2','the number let go of is not reused (the diary knows each photo by it)');
 const moments=Object.values(acts.state.diary.moments).flat().filter(m=>m.id?.startsWith('photo:'));
 assert.deepEqual(moments.map(m=>[m.id,m.kind]),[['photo:ph1','discovery'],['photo:ph2','note']],'Thao is not "first" again');
 acts.save();const again=make(Object.fromEntries(dom.storage));
 assert.equal(again.acts.keepPhoto(shot()).photo.id,'ph3','the count survives a reload');
 assert.ok(again.acts.state.pocketSeen.includes('Thao'));
});
