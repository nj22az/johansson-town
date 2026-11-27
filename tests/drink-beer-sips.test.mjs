import test from 'node:test';
import {tableDrink,checkTableDrink} from './drink-beer-fixtures.mjs';

/**
 * Later sips of a glass of beer at Minato's counter, as animated in Blender (tools/blender/drink-beer.py: SIP, and LAST, the
 * last of the glass, which the game blends into SIP by how far over the beer left needs the glass: drink-beer.js
 * beerLastBlend). Before, a sip had only SIP's keys, made for a glass between 62% and 52% full; a glass emptier than that was
 * tipped by the wrist alone, which went up to 0.058 rad past what a wrist does (Christina, Tetsuo, a glass 60% to 45% full),
 * and Thao's small glass stepped 0.062 rad a frame; the last of a glass (to empty, the glass all but level) was further still.
 * Each body that drinks at the counter, each glass: the same checks as the first draught (tests/drink-beer-fixtures.mjs).
 */
const BODIES=['Nils Johansson','Thao','Mr Fujita','Sverker','Thuan','Tetsuo','Masaru','Christina'];
for(const vessel of ['mug','pint','glass'])test(`a later sip of the ${vessel} at the counter, and the last of it`,()=>{
 const report=[];
 for(const who of BODIES)report.push(checkTableDrink(`${who}, the ${vessel}, 60% to 45%`,tableDrink(who,vessel,{start:.6,end:.45})));
 for(const who of ['Nils Johansson','Thao','Sverker','Christina'])report.push(checkTableDrink(`${who}, the ${vessel}, the last of it`,tableDrink(who,vessel,{start:.2,end:0})));
 console.log(report.join('\n'));
});
