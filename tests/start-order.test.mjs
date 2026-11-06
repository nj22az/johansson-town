import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// A saved game restores its clock through activities' onTime() while the activities are
// being created. Anything onTime reads must already be declared by then, or a returning
// player gets "Cannot access … before initialization" on Press Start (a fresh game never
// takes that path, so only saved games broke).
test('the clock state onTime reads is declared before the activities restore a saved game',async()=>{
 const src=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const created=src.indexOf('activities=createActivities(');
 assert.ok(created>0);
 for(const name of ['followRealClock','minutes','timePreset']){
  const declared=src.search(new RegExp('(let|const|var)\\s+[^;]*\\b'+name+'\\s*='));
  assert.ok(declared>=0&&declared<created,name+' is declared before createActivities');
 }
});
