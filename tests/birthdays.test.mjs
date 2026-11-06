import test from 'node:test';
import assert from 'node:assert/strict';
import {BIRTHDAYS,birthdayOn,birthdaysOn} from '../src/people/birthdays.js';
import {greetingFor} from '../src/people/greetings.js';
import {realTownMinutes} from '../src/town-clock.js';
import {RESIDENTS} from '../src/people/residents.js';
import {recipeFor} from '../src/avatars/cast.js';
import {HAPPENINGS} from '../src/people/happenings.js';
import {tomorrowItems} from '../src/feed/evening-news.js';

const on=(month,day,h=12)=>realTownMinutes(new Date(2026,month-1,day,h,0));

test('the creator’s birthdays, and one for every resident, each on a day of its own',()=>{
 assert.equal(BIRTHDAYS.Johansson,'01-30','the creator, 2026-10-12');assert.equal(BIRTHDAYS.Thuan,'03-15','the creator, 2026-10-12');
 for(const r of RESIDENTS)assert.match(BIRTHDAYS[r.name]||'',/^\d\d-\d\d$/,r.name+' has a birthday');
 const dates=Object.values(BIRTHDAYS);assert.equal(new Set(dates).size,dates.length,'no two share a day');
 const festivals=new Set(HAPPENINGS.flatMap(h=>h.on.date?[h.on.date]:h.on.dates||[]));
 for(const [name,date] of Object.entries(BIRTHDAYS))assert.ok(!festivals.has(date),name+'’s birthday is not a festival day');
 assert.deepEqual([recipeFor('Thao').profile.month,recipeFor('Thao').profile.day],[10,24],'the profile (and Studio) shows the same date');
});

test('on a birthday they say so, on his everyone wishes him many happy returns, and the news says it the night before',()=>{
 assert.equal(birthdayOn('Thao',on(10,24)),true);assert.equal(birthdayOn('Thao',on(10,25)),false);
 assert.equal(birthdayOn('Nhung',on(3,14),{Nhung:'13-40'}),false,'a malformed date is no birthday');
 assert.equal(greetingFor({speaker:'Thao',temper:'dry',situation:{theirBirthday:true,hisBirthday:true}}).id,'birthday','their own comes first');
 const his=greetingFor({speaker:'Chin',temper:'sunny',playerName:'Johansson',situation:{hisBirthday:birthdayOn('Johansson',on(1,30))}});
 assert.equal(his.id,'hisBirthday');assert.match(his.text,/birthday/i);
 assert.deepEqual(birthdaysOn(on(1,30)),['Johansson']);
 assert.ok(tomorrowItems(on(1,29,19)).includes('Tomorrow is chief engineer Johansson’s birthday.'));
 assert.ok(tomorrowItems(on(10,23,19)).includes('Tomorrow is Thao’s birthday.'));
});
