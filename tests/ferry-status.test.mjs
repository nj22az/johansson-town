import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {statusReport} from '../tools/ferry-status.mjs';
import {FERRY_SHIP,FERRY_MACHINERY} from '../src/world/ferry-ship.js';
import {JOHANSSON_MARINE} from '../src/world/johansson-marine.js';

test('the committed status report is generated from the current data (node tools/ferry-status.mjs) and carries the particulars',()=>{
 const md=statusReport();
 assert.equal(readFileSync(new URL('../docs/minato-maru/STATUS.md',import.meta.url),'utf8'),md,'docs/minato-maru/STATUS.md is stale: run node tools/ferry-status.mjs');
 for(const s of [FERRY_SHIP.name,String(FERRY_SHIP.grossTons),FERRY_MACHINERY.mains.kW+' kW',JOHANSSON_MARINE.catalogue.main.model,'## 8. Open findings'])assert.ok(md.includes(s),'the report says '+s);
 for(const c of Object.values(JOHANSSON_MARINE.catalogue))assert.ok(md.includes(c.model),c.model+' in the equipment list');
 assert.match(md,/\| running \| /,'the plant at 14:00 has machines running');
});
