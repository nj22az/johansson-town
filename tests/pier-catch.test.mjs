// The pier's catch (src/world/okinawa/fish.js, activities.js): what bites depends on the light, the harbour master
// pays what the fish is worth, Tama gets the least of the bag, and old saves' "Sea bream" is a taman.
import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {fishAt,fishItem,pierFishOfItem,pierCatch,lightAt,LEGACY_CATCH} from '../src/world/okinawa/fish.js';
import {sakuraOffer} from '../src/commerce/sakura-economy.js';
import {giftReaction} from '../src/people/thuan-gifts.js';

const share=(minutes)=>{const n={};for(let i=0;i<1000;i++){const f=pierCatch(minutes,i/1000);n[f.id]=(n[f.id]||0)+1;}return n;};

test('the light of the day decides what bites', () => {
 assert.deepEqual([0,300,420,600,1020,1140,1439].map(lightAt),['night','twilight','day','day','twilight','night','night']);
 const noon=share(720),night=share(1320),dusk=share(1080);
 assert.equal(noon.tachinuiyu,undefined,'cutlassfish feed at night only');
 assert.ok(night.taman>noon.taman*3,'taman bite after dark');
 assert.ok(noon.mijun>night.mijun*3,'mijun shoal by day');
 assert.ok(dusk.gara>noon.gara*2,'gāra hunt at the change of light');
 for(const f of fishAt('pier')){
  assert.ok(f.bites&&['day','twilight','night'].every(k=>Number.isInteger(f.bites[k])&&f.bites[k]>=0),f.id+' bites');
  assert.ok(Number.isInteger(f.pierPrice)&&f.pierPrice>0,f.id+' price');
 }
 for(const r of [0,.5,.999999,1,-1,2])assert.ok(pierCatch(720,r),'any roll lands a fish');
});

test('a bag item names its fish, old saves keep their catch, and Thuan and Sakura know the fish', () => {
 for(const f of fishAt('pier'))assert.equal(pierFishOfItem(fishItem(f)),f);
 assert.equal(fishItem(fishAt('pier').find(f=>f.id==='egwa')),'Ēgwā');
 assert.equal(pierFishOfItem('Green tea'),null);
 assert.equal(LEGACY_CATCH['Sea bream'],'Taman');assert.equal(LEGACY_CATCH.Mackerel,'Taman');
 assert.equal(sakuraOffer('Taman').price,Math.floor(320*2/3));
 assert.match(giftReaction('Taman').text,/A whole taman/);assert.match(giftReaction('Mijun').text,/bait/);
 const icons=readFileSync(new URL('../src/ui/icons.js',import.meta.url),'utf8');
 for(const f of fishAt('pier'))assert.ok(icons.includes(f.name),'the bag icon knows '+f.name);
});

test('fishing at night lands a pier fish; the harbour master buys the best, Tama gets the least', () => {
 const dom=installDOM({});let minutes=22*60;
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes});
 let first;mock.timers.enable({apis:['setInterval']});
 const random=mock.method(Math,'random',()=>0);   // the bite comes at 2 s; the fish is the first that bites at night
 try{
  acts.action('fishing');dom.button('Cast line');mock.timers.tick(2100);dom.button('Reel in');
  first=pierCatch(minutes,0);
  assert.deepEqual(acts.state.inventory,[fishItem(first)],'the catch is in the bag');
  minutes=12*60;random.mock.mockImplementation(()=>.99);
  acts.action('fishing');dom.button('Cast line');mock.timers.tick(5000);   // a bite at 4.475 s
  dom.button('Reel in');
 }finally{mock.timers.reset();random.mock.restore();}
 assert.equal(acts.state.fish,2);
 assert.equal(acts.state.inventory.length,2,'the second catch is still the waterlogged page');assert.match(acts.state.inventory[1],/^Waterlogged page/);
 acts.state.inventory.push('Taman','Mijun');
 const yen=acts.state.yen;acts.action('resident','Harbour master');dom.button('Sell a catch');
 assert.deepEqual(dom.labels().filter(l=>/^Sell/.test(l)),['Sell your taman · +¥320',`Sell your ${first.name} · +¥${first.pierPrice}`,'Sell your mijun · +¥60'],'each kind offered, dearest first: the player chooses');
 dom.button('Sell your taman · +¥320');
 assert.equal(acts.state.yen,yen+320);assert.ok(!acts.state.inventory.includes('Taman'));
 acts.state.inventory.push('Taman');acts.state.quest=1;acts.action('cat');dom.button('Give Tama a fish');
 assert.equal(acts.state.quest,2);assert.ok(acts.state.inventory.includes('Taman')&&!acts.state.inventory.includes('Mijun'),'Tama gets the mijun');
});
