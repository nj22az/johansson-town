// Writes docs/cast-roster.json from src/people/roster.js, the way the roster test expects it. Run after editing the roster.
import {writeFile} from 'node:fs/promises';
import {rosterDocument} from '../src/people/roster.js';
const out=new URL('../docs/cast-roster.json',import.meta.url);
await writeFile(out,JSON.stringify(rosterDocument(),null,1)+'\n');
console.log('wrote',out.pathname);
