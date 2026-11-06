import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
test('controls, dialogue and entry page stay English while scenery carries Japanese',async()=>{
 // Inspect the script’s findings directly; some test hosts suppress child stdout.
 await promisify(execFile)(process.execPath,['scripts/english-inventory.mjs','--json'],{cwd:new URL('../',import.meta.url),maxBuffer:1024*1024});
 const findings=JSON.parse(await readFile('/tmp/town-english-inventory.json','utf8'));assert.deepEqual(findings,[]);
 const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->|\/\/[^\n]*/g,''),/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
});
