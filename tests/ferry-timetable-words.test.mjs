import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HARBOUR_LINE,serviceTime} from '../src/people/commuter-schedule.js';
import {FERRY_TIMETABLE,ferryTimetableText} from '../src/world/ferry-timetable.js';
import {PORT_TIMETABLE_POSTER} from '../src/world/port-building.js';
import {sakuraDeparturesBoard} from '../src/world/interiors/sakura-office-dressing.js';
import {nextBoatLine} from '../src/people/ganaha.js';
import {TOWN_PAPERS} from '../src/office/town-papers.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const short=t=>t.replace(/^0/,'');

test('every timetable in town tells the same service: her timetable, which does not wait, with the commuter boats at the Harbour Line’s times',()=>{
 const out=FERRY_TIMETABLE.filter(s=>s.from==='town').map(s=>serviceTime(s.departs)),back=FERRY_TIMETABLE.filter(s=>s.from==='airport').map(s=>serviceTime(s.departs));
 // The harbour office on the telephone and the Harbour Line receipt: every sailing.
 const office=ferryTimetableText(8*60);
 assert.match(office,/Minato Maru/);assert.match(office,/does not wait/);assert.doesNotMatch(office,/on request/i);
 for(const t of [...out,...back])assert.ok(office.includes(t),'the harbour office reads '+t);
 // The poster under the canopy, the hall's notice and the window clerk: no crossing on request anywhere.
 const poster=PORT_TIMETABLE_POSTER.join(' ');for(const t of out)assert.ok(poster.includes(short(t)),'the poster lists '+t);
 for(const s of HARBOUR_LINE){const [h,m]=serviceTime(s).split(':');assert.ok(poster.includes(Number(h)+':'+m),'the poster lists the commuter boat in at '+serviceTime(s));}
 const notice=TOWN_PAPERS.find(p=>p.title==='Ferry departures').text;for(const t of [...out,...back])assert.ok(notice.includes(t),'the hall notice lists '+t);
 for(const text of [poster,notice,nextBoatLine(10*60),nextBoatLine(16*60),source('src/people/izakaya-play.js'),source('src/island/play.js'),source('src/world/interiors/port-hall.js')])assert.doesNotMatch(text,/on request|Request departure/i);
 assert.match(nextBoatLine(10*60),/does not wait/);assert.match(nextBoatLine(10*60),/14:45/);
 // Sakura's whiteboard: the three calls, the first boat out and the last back.
 const board=sakuraDeparturesBoard();assert.equal(board.ferry.first.out,out[0]);assert.equal(board.ferry.last.out,back.at(-1));
 assert.ok(board.english.includes(out[0])&&board.english.includes(back.at(-1)));
 assert.match(source('src/island/play.js'),/Passengers ride the upper deck/);assert.doesNotMatch(source('src/island/play.js'),/share the open deck/);
});

test('Vy lives on Minato and school absence is scheduled without a fictitious ferry commute',()=>{
 const vy=NEIGHBOURS.find(n=>n.name==='Vy');assert.ok(vy);
 for(const role of [vy.role,...vy.routine.map(r=>r.role)])assert.doesNotMatch(role,/\b(bus|ferry)\b/,'Vy: '+role);
 assert.ok(vy.routine.some(r=>r.away&&r.role==='at school'));
 assert.ok(vy.routine.some(r=>r.home&&/1 Kitahama/.test(r.role)));
});

test('Okinawa runs at 60 hertz: the power house’s needles and the ferry’s shore supply agree',async()=>{
 assert.doesNotMatch(source('src/world/school.js'),/50 cycles/);assert.match(source('src/world/school.js'),/60 cycles/);
 const {FERRY_ELECTRICS}=await import('../src/world/ferry-ship.js');
 for(const part of [FERRY_ELECTRICS,FERRY_ELECTRICS.generators,FERRY_ELECTRICS.emergency,FERRY_ELECTRICS.shore])assert.equal(part.hz,60);
});
