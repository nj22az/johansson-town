import test from 'node:test';
import assert from 'node:assert/strict';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {homeRoutine} from '../src/people/home-life.js';
import {residentPersonality} from '../src/people/resident-personalities.js';
import {satoRamenOpen} from '../src/world/sato-ramen-layout.js';
const thuan=RESIDENTS.find(p=>p.name==='Thuan');
test('Thuan is home on Kitano-jima until the morning boat, then walks to work and takes a noodle lunch',()=>{
 // Her home is across the water (docs/CAST-CONSOLIDATION.md addendum 4): before the 08:30 boat she is away, at home there.
 for(const m of [440,450,470,495]){assert.equal(residentPlan(thuan,m).place,'away');assert.match(residentPlan(thuan,m).activity,/Kitano-jima/);}
 assert.equal(homeRoutine(thuan,440).id,'sleep');
 assert.match(residentPlan(thuan,520).activity,/arriving/);
 assert.equal(residentPlan(thuan,540).place,'doorstep','she sweeps before opening the shop');
 assert.equal(residentPlan(thuan,780).place,'ramen');
 assert.ok(satoRamenOpen(780));
 assert.equal(residentPlan(thuan,830).place,'market');
 assert.equal(residentPersonality('Thuan').drink,'tea','her ordinary daytime drink stays tea');
});
test('saved clock keeps beer evenings stable over reload, rain and consecutive days',()=>{
 for(let day=0;day<4;day++){
  const m=day*1440+1260;
  // Absolute day 0 is Thursday 1 January 1970; days 2 and 3 are Saturday and Sunday.
  // The weekend follows those real weekdays, rather than remapping the date to 1997.
  // On her nights off Minato she waits at the terminal for the 22:00 boat home (she lives on Kitano-jima, addendum 4).
  assert.equal(residentPlan(thuan,m,false,{}).place,day>=2?'away':day%2===0?'izakaya':'bus');
  assert.deepEqual(residentPlan(thuan,m,false,JSON.parse(JSON.stringify({}))),residentPlan(thuan,m,false,{}));
  assert.equal(residentPlan(thuan,m,true,{}).place,day>=2?'away':'bus');
 }
});

test('Thuan serves waiting customers before leaving for lunch',()=>{
 const state={residentLife:{Reiko:{day:0,shopping:{started:779,finished:false}}}};
 assert.equal(residentPlan(thuan,780,false,state).place,'market');
 state.residentLife.Reiko.shopping.finished=true;
 assert.equal(residentPlan(thuan,782,false,state).place,'ramen');
});
