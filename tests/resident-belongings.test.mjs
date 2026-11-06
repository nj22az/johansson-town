import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BELONGINGS,BELONGING_SOURCES} from '../src/people/belongings.js';
import {SUPPLIERS} from '../src/commerce/merchandising.js';
import {seeded,tellComic} from '../src/feed/storyteller.js';
const catalogue=JSON.parse(await readFile(new URL('../guide/residents.json',import.meta.url)));
const names=new Set(catalogue.map(r=>r.name));

test('every resident owns something, and only residents own things',()=>{
 for(const name of names)assert.ok(BELONGINGS[name]?.length,name+' owns nothing');
 for(const name of Object.keys(BELONGINGS))assert.ok(names.has(name),name+' is not in guide/residents.json');
});

test('every thing has a purpose, a real source and a home',()=>{
 for(const [name,things] of Object.entries(BELONGINGS)){
  const seen=new Set();
  for(const b of things){
   const what=name+'’s '+b.what;
   assert.match(b.what,/^[a-z0-9’]/,what+' is written to follow “my” and “the”');
   assert.doesNotMatch(b.what,/^(a|an|the|my|his|her)\s/,what+' carries no article');
   assert.ok(!seen.has(b.what),what+' is listed twice');seen.add(b.what);
   assert.ok(b.from in SUPPLIERS||BELONGING_SOURCES.includes(b.from)||(names.has(b.from)&&b.from!==name),what+' comes from nowhere real: '+b.from);
   assert.match(b.keeps,/^(in|on|under|behind|beside|against|over|by)\s/,what+' is kept somewhere, as a place phrase');
   assert.match(b.tale,/^[A-Z“].{10,}[.!?]$/,what+' has a whole sentence of a tale');
   assert.ok(b.tale.length<=60,what+'’s tale fits a comic caption without covering faces: '+b.tale.length+' characters');
   assert.equal(typeof b.canon,'boolean',what+' says whether the guide names it');
  }
 }
});

test('the guide names every canon thing',()=>{
 // A canon thing is one the guide already mentions (or its key word does).
 const key={'second notebook':'notebook','notebook of supplier names':'notebook','pad of bookmark slips':'slips','tool roll':'tools','pocket radio':'radio',
  'report book':'report','notebook of opening sentences':'opening sentences','crossword book':'crossword','1979 race pennant':'1979','aluminium delivery box':'aluminium delivery box',
  'bicycle bell':'bicycle bell','ratchet strap':'strap','red pencil':'pencil','net needle':'nets','little notebook':'notebook','offering tray':'rice, salt and incense','bait box':'bait'};
 // Their own entry, or another resident's that tells of them (the Harbour master's lunch is Mrs Sato's box).
 for(const r of catalogue)for(const b of BELONGINGS[r.name]||[])if(b.canon){
  const text=catalogue.filter(o=>o===r||JSON.stringify(o).includes(r.name)).map(o=>JSON.stringify(o)).join(' ').toLowerCase(),word=(key[b.what]||b.what).toLowerCase();
  assert.ok(text.includes(word),r.name+'’s '+b.what+' is marked canon but the guide never mentions “'+word+'”');
 }
});

test('a lost story loses the resident’s own thing and finds it where it lives',()=>{
 for(const r of catalogue)for(let i=0;i<12;i++){
  const story=tellComic(seeded('lost'+r.name+i),catalogue,{genre:'lost',who:r.name});
  const text=[story.title,...story.panels.map(p=>p.line)].join(' ');
  assert.ok(BELONGINGS[r.name].some(b=>text.includes(b.what)),r.name+'’s lost story is about one of their own things: '+text);
 }
});
