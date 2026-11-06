import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// The ?visual-audit harness freezes the frame loop to draw only what a harness asks for. Before START it must still draw
// the title: the title's first frame is what marks the island drawn and opens START (game.js islandDrawn). Frozen, it
// never drew, and every ?visual-audit tool (render-feed-backdrops.mjs among them) waited at 97%, "Drawing the island",
// for ever in a cloud session (21 October 2026; tools/cloud-boot-smoke.mjs boots the whole game to check it).
test('the frozen audit loop still draws the title until START, so the island is marked drawn',async()=>{
 const src=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const loop=src.slice(src.indexOf('function loop(){'),src.indexOf('function renderTitle('));
 const frozen=loop.slice(loop.indexOf('__JOHANSSON_AUDIT__?.frozen'));
 assert.ok(frozen.length>0,'the frame loop has its frozen branch');
 const before=frozen.slice(0,frozen.indexOf('return;}')+8);
 assert.match(before,/if\(!started\)\{renderTitle\([^)]*\);return;\}/,'before START the frozen loop draws the title and returns');
 assert.match(src.slice(src.indexOf('function renderTitle(')),/islandDrawn\(\)/,'the title’s first frame marks the island drawn');
});
