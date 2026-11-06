import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const {circleHitsRect,circleHitsCircle,roomBoundsBlocked,townBoundsBlocked,sweepFraction}=await import('../physics.js?snappy=1');

assert.equal(circleHitsRect(0,0,.28,{x:1,z:0,w:1,d:1}),false,'clear space must remain clear');
assert.equal(circleHitsRect(.3,0,.28,{x:1,z:0,w:1,d:1}),true,'inflated prop collision must stop the player');
assert.equal(circleHitsCircle(0,0,.28,.7,0,.35),false,'separated residents must not collide');
assert.equal(circleHitsCircle(0,0,.28,.5,0,.35),true,'resident overlap must be blocked');
assert.equal(roomBoundsBlocked(0,0,.28),false);
assert.equal(roomBoundsBlocked(5.5,0,.28),true,'room wall radius must be respected');
assert.equal(townBoundsBlocked(0,0,.28),false);
assert.equal(townBoundsBlocked(10,-42,.28),false,'harbour apron must remain accessible');
assert.equal(townBoundsBlocked(0,-61,.28),false,'outer harbour pier must be walkable');
assert.equal(townBoundsBlocked(3.7,-61,.28),false,'pier usable width must remain accessible');
assert.equal(townBoundsBlocked(4.0,-61,.28),true,'pier side must stop the player before the water');
assert.equal(townBoundsBlocked(0,-80,.28),false,'the lengthened pier must be walkable to its new end');
assert.equal(townBoundsBlocked(0,-87.2,.28),true,'pier end must stop the player before open water');
const sweep=sweepFraction({x:0,z:0},{x:5,z:0},x=>x>=2,.1);
assert.ok(sweep>.35&&sweep<.4,`camera sweep stopped at unexpected fraction ${sweep}`);

const webmcp=await readFile(resolve(root,'webmcp.js'),'utf8');
assert.match(webmcp,/document\.modelContext\|\|navigator\.modelContext/,'WebMCP must prefer the current document.modelContext API with legacy alias fallback');
assert.match(webmcp,/const TOOL_PREFIX='johansson_'/);
for(const tool of ['get_state','move','look','jump','interact','travel','choose_action','ui'])assert.ok(webmcp.includes("name:TOOL_PREFIX+'"+tool+"'"),`johansson_${tool} must be registered`);
assert.match(webmcp,/__JOHANSSON_AGENT_API__/,'compatible browser-agent bridges must have a bounded fallback API');
assert.doesNotMatch(webmcp,/\beval\s*\(|new Function\s*\(/,'WebMCP must not expose arbitrary JavaScript execution');

const npcWebmcp=await readFile(resolve(root,'webmcp-characters.js'),'utf8');
for(const tool of ['johansson_list_characters','johansson_control_npc'])assert.match(npcWebmcp,new RegExp(tool),`${tool} must be registered`);
assert.match(npcWebmcp,/Only town NPCs can be controlled directly/,'direct AI character control must exclude Johansson position writes');
assert.match(npcWebmcp,/minimum:\.1,maximum:4/,'NPC movement distance must be bounded in the tool schema');

console.log('Geometry and bounded WebMCP regression tests: PASS');
