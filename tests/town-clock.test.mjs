import test from 'node:test';
import assert from 'node:assert/strict';
import {realTownMinutes,townCalendar,clockCatchUp,townClockLine} from '../src/town-clock.js';
import {readPlayers,addPlayer,switchPlayer,renamePlayer,readSave,slotKey,SAVE_KEY,DEFAULT_PLAYER} from '../src/save.js';
import {installDOM} from './fixtures.mjs';

test('the town clock and calendar follow the device’s actual date and weekday',()=>{
 const now=new Date(2026,8,23,14,7,30);
 const m=realTownMinutes(now);
 assert.equal(Math.floor(((m%1440)+1440)%1440),14*60+7,'The hour and minute are not the local ones');
 assert.equal(Math.floor(realTownMinutes(new Date(2026,8,24,0,0,1))/1440)-Math.floor(m/1440),1,'The day does not turn over at local midnight');
 const cal=townCalendar(now);
 assert.equal(cal.date.getFullYear(),2026);assert.equal(cal.date.getMonth(),8);assert.equal(cal.date.getDate(),23);
 assert.equal(cal.weekday,now.getDay(),'The weekday follows the device');
 assert.equal(townCalendar(new Date(2028,1,29)).date.getDate(),29,'Leap days are retained');
 assert.match(townClockLine(now),/^14:07 · .*2026$/);
});

test('coming back fast-forwards up to a day; older or old-format saves open at now',()=>{
 const now=new Date(2026,8,23,12,0),real=realTownMinutes(now);
 assert.deepEqual(clockCatchUp(real-90,now),{start:real-90,fastForward:90});
 assert.deepEqual(clockCatchUp(real-3000,now),{start:real,fastForward:0});
 assert.deepEqual(clockCatchUp(1002,now),{start:real,fastForward:0},'A save from the old fast clock');
 assert.deepEqual(clockCatchUp(undefined,now),{start:real,fastForward:0});
 assert.deepEqual(clockCatchUp(real-2,now),{start:real,fastForward:0},'Two minutes is not worth replaying');
});

test('local players each keep their own save; the first keeps the original slot',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 store.set(SAVE_KEY,JSON.stringify({yen:500,visited:[]}));
 assert.equal(readPlayers(storage).active,DEFAULT_PLAYER.id);
 assert.equal(readSave(storage).yen,500,'Existing progress is not the first player’s');
 const id=addPlayer(storage,'Nils <b>');
 assert.equal(readPlayers(storage).active,id);assert.equal(readPlayers(storage).players.find(p=>p.id===id).name,'Nils b');
 assert.equal(readSave(storage),null,'A new player starts with somebody else’s progress');
 store.set(slotKey(id),JSON.stringify({yen:42,visited:[]}));assert.equal(readSave(storage).yen,42);
 assert.ok(renamePlayer(storage,'Nils'));assert.equal(readPlayers(storage).players.find(p=>p.id===id).name,'Nils');
 assert.ok(switchPlayer(storage,DEFAULT_PLAYER.id));assert.equal(readSave(storage).yen,500);
 assert.equal(switchPlayer(storage,'nobody'),false);
});

test('activities save into the active player’s slot and offer the player menu',async()=>{
 const dom=installDOM();
 const {createActivities}=await import('../activities.js?players=1');
 addPlayer(localStorage,'Nhung');
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1002,getSocialContext:()=>({})});
 acts.state.yen=777;acts.save();
 const slot=slotKey(readPlayers(localStorage).active);
 assert.notEqual(slot,SAVE_KEY);assert.equal(JSON.parse(localStorage.getItem(slot)).yen,777);
 acts.players();assert.ok(dom.has('Save now'));assert.ok(dom.labels().some(l=>l.startsWith('Switch to Visitor')));
 assert.ok(dom.has('Export save file')&&dom.has('Import save file')&&dom.has('New player'));
});

test('the clock can be set: a start time, where you left off, and a faster speed',async()=>{
 const {readClockSetting,writeClockSetting,startingMinutes,createClock,townCalendarAt}=await import('../src/town-clock.js');
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 assert.deepEqual(readClockSetting(storage),{start:'real',speed:1},'Real time is the default');
 assert.deepEqual(writeClockSetting(storage,{start:'real',speed:4}),{start:'real',speed:1},'Real time cannot be sped up');
 assert.deepEqual(writeClockSetting(storage,{start:'18:30',speed:4}),{start:'18:30',speed:4});
 assert.deepEqual(readClockSetting(storage),{start:'18:30',speed:4});
 assert.deepEqual(writeClockSetting(storage,{start:'18:30',speed:60}),{start:'18:30',speed:1},'60× is not offered: it is unplayable');
 assert.deepEqual(writeClockSetting(storage,{start:'25:00',speed:7}),{start:'real',speed:1},'Nonsense falls back to real time');
 const now=new Date(2026,8,23,9,15),real=realTownMinutes(now),today=Math.floor(real/1440)*1440;
 assert.equal(startingMinutes({start:'18:30',speed:1},undefined,now),today+1110);
 assert.equal(startingMinutes({start:'saved',speed:1},real-400,now),real-400,'Where I left off');
 assert.equal(startingMinutes({start:'saved',speed:1},1002,now),today+1002,'An old save keeps its time of day');
 let t=0;const clock=createClock({start:'06:00',speed:4},today+360,()=>t);
 t=15*60000;assert.equal(clock.target(),today+420,'Four times: an hour in fifteen minutes');
 clock.set(today+1439,2);t+=60000*2;assert.equal(townCalendarAt(clock.target()).date.getDate(),24,'A fast clock turns the date over');
 clock.real();assert.equal(clock.mode,'real');assert.equal(clock.speed,1);
});

test('time spent on something moves the town on, in real time as well',async()=>{
 const {createClock,realTownMinutes}=await import('../src/town-clock.js');
 let t=Date.UTC(2026,8,23,3,0);const clock=createClock({start:'real',speed:1},0,()=>t);
 const before=clock.target();clock.pass(40);
 assert.equal(Math.round(clock.target()-before),40,'A forty-minute bath did not move the town on');
 t+=60000;assert.equal(Math.round(clock.target()-realTownMinutes(new Date(t))),40,'The town does not stay ahead of the real clock');
 clock.ahead=0;assert.equal(Math.round(clock.target()-realTownMinutes(new Date(t))),0);
 const set=createClock({start:'12:00',speed:2},720,()=>t);set.pass(30);assert.equal(set.target(),750);
});
