import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 clock,daylight,duskAmount,windowGlow,lanternGlow,fluorescent,
 periodLabel,sunColor,skyColor,gradeWarmth,morningAmount,decalLight,poolGlow,PALETTE,
} from '../src/render/dusk.js';
import {atmosphere} from '../src/render/atmosphere.js';

const at=(h,m=0)=>h*60+m;

test('daylight envelope is unchanged at the old knots',()=>{
 assert.equal(daylight(at(12)),1);
 assert.equal(daylight(at(7)),1);
 assert.equal(daylight(at(17)),1);
 assert.equal(daylight(at(20)),0);
 assert.equal(daylight(at(5)),0);
 assert.ok(Math.abs(daylight(at(18,30))-0.5)<1e-9);
});

test('dusk peaks at lantern hour and is gone by night',()=>{
 assert.equal(duskAmount(at(16,59)),0);
 assert.ok(duskAmount(at(17,30))>0.2);
 assert.equal(duskAmount(at(18,30)),1);
 assert.equal(duskAmount(at(19,30)),1);
 assert.ok(duskAmount(at(20,15))<1);
 assert.equal(duskAmount(at(20,30)),0);
 assert.equal(duskAmount(at(22)),0);
});

test('windows ease on instead of snapping at 18:00',()=>{
 assert.equal(windowGlow(at(16)),0);
 assert.ok(windowGlow(at(17,30))>0.2&&windowGlow(at(17,30))<1);
 assert.equal(windowGlow(at(18)),1);
 assert.equal(windowGlow(at(2)),1);
 assert.ok(windowGlow(at(6))<1);
});

test('paper lanterns lead the windows',()=>{
 assert.ok(lanternGlow(at(17,30))>windowGlow(at(17,30)));
 assert.equal(lanternGlow(at(17,30)),1);
 assert.equal(lanternGlow(at(18)),1);
 assert.equal(lanternGlow(at(16)),0);
});

test('Sakura fluorescent stays cold, on into the evening, and does not follow dusk',()=>{
 assert.equal(fluorescent(at(12)),1);
 assert.equal(fluorescent(at(18,30)),1);
 assert.equal(fluorescent(at(20,43)),1,'still lit after closing while the till is cashed up');
 assert.equal(fluorescent(at(23)),.6,'the night light over the till once the shop is shut (sakura-rota.js: nobody keeps a night counter)');
 assert.equal(fluorescent(at(2)),.6);assert.equal(fluorescent(at(8,15)),.6,'before the clerk’s boat');assert.equal(fluorescent(at(8,30)),1);
 assert.notEqual(PALETTE.sakuraTube,PALETTE.lanternPaper);
 assert.notEqual(PALETTE.sakuraTube,PALETTE.sunDusk);
});

test('period labels follow the sun: morning, midday, afternoon, evening, night',()=>{
 assert.equal(periodLabel(at(6)),'MORNING');
 assert.equal(periodLabel(at(7,30)),'MORNING');
 assert.equal(periodLabel(at(12)),'MIDDAY');
 assert.equal(periodLabel(at(16,42)),'AFTERNOON');
 assert.equal(periodLabel(at(17,30)),'EVENING');
 assert.equal(periodLabel(at(18,30)),'EVENING');
 assert.equal(periodLabel(at(20,30)),'NIGHT');
 assert.equal(periodLabel(at(21)),'NIGHT');
 assert.equal(periodLabel(at(3)),'NIGHT');
 for(const label of [periodLabel(at(4,59)),periodLabel(at(10,29)),periodLabel(at(13,59)),periodLabel(at(19,59))])assert.ok(['NIGHT','MORNING','MIDDAY','AFTERNOON','EVENING'].includes(label));
});

test('the morning grade is its own: cool gold at seven, gone by half past eight, never at dusk',()=>{
 assert.equal(morningAmount(at(5)),0);
 assert.equal(morningAmount(at(7)),1);
 assert.ok(morningAmount(at(8))>0&&morningAmount(at(8))<1);
 assert.equal(morningAmount(at(8,30)),0);
 assert.equal(morningAmount(at(17,40)),0);
 const seven=clock(at(7)),evening=clock(at(18,30)),noon=clock(at(12));
 assert.equal(seven.morning,1);assert.equal(evening.morning,0);assert.equal(noon.morning,0);
 assert.equal(seven.sun,PALETTE.sunMorning);assert.notEqual(seven.sun,clock(at(17,40)).sun);
 assert.ok(seven.gradeWarmth>noon.gradeWarmth&&seven.gradeWarmth<evening.gradeWarmth,'warmer than noon, not as warm as the apricot evening');
 // Cooler than the evening: more blue in the sun, the sky and the fill.
 const blue=hex=>(hex&255)/((hex>>16)&255);
 assert.ok(blue(seven.sun)>blue(evening.sun)&&blue(seven.sun)>blue(clock(at(17,40)).sun));assert.ok(blue(seven.sky)>blue(evening.sky));assert.ok(blue(seven.skyFill)>blue(evening.skyFill));
});

test('a lamp\'s pool shows as the daylight goes, not the moment the lamp comes on',()=>{
 assert.equal(poolGlow(at(12)),0);
 assert.equal(lanternGlow(at(17,40)),1);assert.ok(poolGlow(at(17,40))<.15,'barely there in the golden hour');
 assert.ok(poolGlow(at(18,30))>.3&&poolGlow(at(18,30))<.5);
 assert.equal(poolGlow(at(20)),1);assert.equal(poolGlow(at(23)),1);
 assert.ok(poolGlow(at(5,30))<lanternGlow(at(5,30)));assert.equal(poolGlow(at(6,30)),0);
});

test('road paint is dimmed with the night and full by day',()=>{
 assert.ok(Math.abs(decalLight(at(12))-1)<1e-9);
 assert.ok(decalLight(at(22))<.35&&decalLight(at(22))>.2);
 assert.ok(decalLight(at(17,40))>decalLight(at(20,30)));
 assert.equal(clock(at(22)).decal,decalLight(at(22)));
});

test('sun goes apricot at dusk and cool at night, never a second light',()=>{
 assert.equal(sunColor(at(12)),PALETTE.sunDay);
 assert.equal(sunColor(at(18,30)),PALETTE.sunDusk);
 assert.equal(sunColor(at(22)),PALETTE.sunNight);
});

test('sky is apricot then violet, rain stays grey',()=>{
 assert.equal(skyColor(at(12)),PALETTE.skyDay);
 assert.equal(skyColor(at(18,30)),PALETTE.skyDuskApricot);
 assert.equal(skyColor(at(20)),PALETTE.skyDuskViolet);
 assert.equal(skyColor(at(22)),PALETTE.skyNight);
 assert.equal(skyColor(at(18,30),true),PALETTE.skyRain);
});

test('grade warmth rises only at dusk and never touches ink',()=>{
 assert.ok(Math.abs(gradeWarmth(at(12))-0.05)<1e-9);
 assert.ok(gradeWarmth(at(18,30))>0.1);
 assert.ok(Math.abs(gradeWarmth(at(22))-0.05)<1e-9);
});

test('clock is fogless and does not invent point lights',()=>{
 const dusk=clock(at(18,30));
 assert.equal(dusk.fog,null);
 assert.equal(dusk.period,'EVENING');
 assert.equal(dusk.fluorescent,1);
 assert.equal(dusk.lanternGlow,1);
 assert.ok(!('pointLights' in dusk));
 assert.ok(dusk.ambient>clock(at(22)).ambient);
});

test('atmosphere(day) keeps the old three-stop sky for existing callers',()=>{
 const noon=atmosphere(1,false,false);
 assert.equal(noon.sky,0xb8dce9);
 assert.equal(noon.fog,null);
 assert.ok(atmosphere(1,false,true).ambient>=1);
 const dusk=atmosphere(0.5,false,false,at(18,30));
 assert.equal(dusk.sky,PALETTE.skyDuskApricot);
 assert.equal(dusk.fog,null);
});

test('town wiring drives windows, lanterns and nameplates from the clock',async()=>{
 const files={
  town:await readFile(new URL('../src/world/town.js',import.meta.url),'utf8'),
  izakaya:await readFile(new URL('../src/world/izakaya.js',import.meta.url),'utf8'),
  facade:await readFile(new URL('../src/world/minato-facade.js',import.meta.url),'utf8'),
  harbour:await readFile(new URL('../src/world/harbour.js',import.meta.url),'utf8'),
  game:await readFile(new URL('../src/game.js',import.meta.url),'utf8'),
 };
 assert.match(files.town,/windowGlow/);
 assert.doesNotMatch(files.town,/>=1080/);
 assert.match(files.izakaya,/lanternGlow/);
 assert.match(files.facade,/lanternI/);
 assert.match(files.harbour,/lanternGlow/);
 assert.match(files.game,/duskClock/);
 assert.match(files.game,/uWarmth:c\.gradeWarmth/);
 assert.doesNotMatch(files.game,/new THREE\.PointLight/);
});

test('all dusk colours reach night without a jump at 20:30',()=>{
 for(const key of ['sky','sun','skyFill','groundFill']){
  const before=clock(at(20,30)-.001)[key],after=clock(at(20,30))[key];
  for(const shift of [0,8,16])assert.ok(Math.abs(((before>>shift)&255)-((after>>shift)&255))<=1,key+' must fade into night');
  const start=clock(at(20))[key],middle=clock(at(20,15))[key],end=clock(at(20,30))[key];
  assert.notEqual(middle,start,key+' must not stay stuck at dusk');
  assert.notEqual(middle,end,key+' must not snap early to night');
 }
 for(const minutes of [0,300,420,1020,1110,1200,1230,1440]){
  for(const key of ['sky','sun','skyFill','groundFill']){
   const a=clock(minutes-.001)[key],b=clock(minutes+.001)[key];
   for(const shift of [0,8,16])assert.ok(Math.abs(((a>>shift)&255)-((b>>shift)&255))<=1,key+' at '+minutes);
  }
 }
});
