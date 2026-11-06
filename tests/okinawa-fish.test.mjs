// The town's fish (src/world/okinawa/fish.js): one list the auction, the Yonamine counter (the shop stands, closed) and the
// storyteller all read, so a fish is named the same way everywhere and nothing on the ice is picked at random.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FISH,fishAt,fishById,aFish} from '../src/world/okinawa/fish.js';
import {GENRES} from '../src/feed/stories.js';

const PLACES=['auction','yonamine','pier','izakaya'],LIVES=['reef','inshore','offshore','deep'];

test('every fish is whole: names, kana, how it is caught and eaten, who deals in it, its colour', () => {
 assert.equal(new Set(FISH.map(f=>f.id)).size,FISH.length,'ids are unique');
 assert.equal(new Set(FISH.map(f=>f.name)).size,FISH.length,'names are unique');
 for(const f of FISH){
  assert.match(f.id,/^[a-z]+$/,f.id);
  assert.match(f.kana,/^[゠-ヿ]+$/,f.id+' kana');
  assert.match(f.standard,/[゠-ヿ]/,f.id+' standard name');
  for(const k of ['name','english','caught','eaten'])assert.ok(f[k]?.length>2,f.id+' '+k);
  assert.ok(LIVES.includes(f.lives),f.id+' lives');
  assert.ok(f.by.length&&f.by.every(p=>PLACES.includes(p)),f.id+' by');
  assert.ok(Number.isInteger(f.colour)&&f.colour>0&&f.colour<=0xffffff,f.id+' colour');
 }
 assert.ok(Object.isFrozen(FISH));
});

test('every place has fish, and the pier only gives what an angler on a pier can catch', () => {
 for(const p of PLACES)assert.ok(fishAt(p).length>=2,p);
 for(const f of fishAt('pier'))assert.ok(['inshore','reef'].includes(f.lives),f.id+' from the pier');
 assert.equal(fishAt('pier').some(f=>f.id==='maguro'),false);
 assert.equal(fishById('nope'),null);
});

test('a or an, with the long vowels', () => {
 assert.equal(aFish(fishById('egwa')),'an ēgwā');
 assert.equal(aFish(fishById('abasa')),'an abasā');
 assert.equal(aFish(fishById('irabucha')),'an irabuchā');
 assert.equal(aFish(fishById('taman')),'a taman');
});

test('the catch story brags about pier fish, and the old spellings are gone from the town', () => {
 const fish=GENRES.find(g=>g.id==='catch').bind.fish;
 assert.deepEqual(fish,fishAt('pier').filter(f=>f.id!=='mijun').map(f=>f.name),'the story brags about every pier fish but the mijun');
 const quay=readFileSync(new URL('../src/world/okinawa/quarters.js',import.meta.url),'utf8');
 const people=readFileSync(new URL('../src/people/neighbours.js',import.meta.url),'utf8');
 // The quay's price list is on the fish auction's own noticeboard, built by auction-board.js for the quay
 // (briefs/HANDOFF-AUCTION-BOARD-2026-10-25.md); quarters.js only places it. It used to be written in quarters.js.
 const board=readFileSync(new URL('../src/world/auction-board.js',import.meta.url),'utf8');
 assert.ok(quay.includes('buildAuctionBoard('),'the quay still puts up the auction board');
 for(const old of ['Irabuchar','Irabu-chā','"Seika','cuttlefish'])assert.equal((quay+board+people).includes(old),false,old);
 assert.ok(board.includes('Irabuchā ¥1,200')&&board.includes('Sēika ¥1,500'));
});

test('what lies on the ice is what is really there', () => {
 const houses=readFileSync(new URL('../src/world/okinawa/houses.js',import.meta.url),'utf8');
 const quay=readFileSync(new URL('../src/world/okinawa/quarters.js',import.meta.url),'utf8');
 const market=readFileSync(new URL('../src/world/fish-market.js',import.meta.url),'utf8');
 // Yonamine's counter: no seasonal fry and no squid in the row of fish; the auction's boxes (fish-market.js since
 // 30 October 2026): no tuna and no squid, and the inspect text says those went first.
 assert.match(houses,/fishAt\('yonamine'\)\.filter\(f=>f\.id!=='suku'&&f\.id!=='seika'\)/);
 assert.match(market,/fishAt\('auction'\)\.filter\(f=>f\.id!=='maguro'&&f\.id!=='seika'\)/);
 assert.match(quay,/The maguro went first, and so did the sēika/);
 assert.equal(fishById('kachu').kana,'カチュー','small kana where the word has them');
});

test('the catch story reads right with every pier fish', async () => {
 const {expand,seeded}=await import('../src/feed/storyteller.js');
 for(const f of fishAt('pier'))assert.equal(expand('I caught {a $fish} last night.',{vars:{fish:f.name}},seeded(f.id)),`I caught ${aFish(f)} last night.`);
});

test('the long vowels draw right: Figtree supplies ā ē ī ō ū, which LINE Seed JP draws with the bar beside the letter', () => {
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('index.html'),subset=decodeURIComponent(page.match(/family=Figtree[^"]*text=([^&"]+)/)?.[1]||'');
 for(const c of 'āēīōūĀĒĪŌŪ')assert.ok(subset.includes(c),'the Figtree subset has '+c);
 assert.ok(page.indexOf('family=Figtree')>page.indexOf('family=LINE+Seed+JP'),'loaded beside LINE Seed JP');
 assert.match(read('line-ui.css'),/--line-font:Figtree,"LINE Seed JP",/);
 assert.match(read('src/feed/comic.js'),/const FONT='Figtree,"LINE Seed JP",/);
 for(const f of FISH)for(const c of f.name.normalize('NFC'))if(c.charCodeAt(0)>0x7f)assert.ok(subset.includes(c),`${f.name}: ${c} is drawn by Figtree`);
});
