import test from 'node:test';
import assert from 'node:assert/strict';
import {RESIDENTS,STREET_CAST,STREET_CAST_NAMES} from '../src/people/residents.js';

test('the published town has Thuan, Thao, the Front-Row staff, the harbour master, Officer Mori and Mrs Sato, and nobody else yet',()=>{
 assert.deepEqual(STREET_CAST_NAMES,['Thuan','Thao','Nhung','Chin','Tetsuo','Harbour master','Officer Mori','Mrs Sato']);
 assert.deepEqual(STREET_CAST.map(person=>person.name).sort(),['Chin','Harbour master','Mrs Sato','Nhung','Officer Mori','Tetsuo','Thao','Thuan']);
 assert.ok(!RESIDENTS.some(p=>p.name==='Reiko'||p.name==='Barfly'||p.name==='Bus driver'),'the retired walkers are gone (phase 4)');
 assert.ok(RESIDENTS.length>1,'resident definitions were deleted instead of being held back');
 assert.ok(RESIDENTS.some(person=>person.name==='Thao'),'Thao must remain available in the resident roster');
});
