import test from 'node:test';
import assert from 'node:assert/strict';
import {ambience,LAYERS} from '../src/audio/soundscape.js';
import {realTownMinutes} from '../src/town-clock.js';

const at=(month,day,h,m=0)=>realTownMinutes(new Date(2026,month-1,day,h,m));

test('a summer day: kumazemi in the morning, aburazemi in the afternoon, higurashi at dusk, crickets at night',()=>{
 const morning=ambience({minutes:at(7,25,8)}),afternoon=ambience({minutes:at(7,25,14)}),dusk=ambience({minutes:at(7,25,18,40)}),night=ambience({minutes:at(7,25,23)});
 assert.ok(morning.kumazemi>.8&&morning.kumazemi>morning.aburazemi);
 assert.ok(afternoon.aburazemi>.8&&afternoon.kumazemi<.05);
 assert.ok(dusk.higurashi>.5&&dusk.higurashi>dusk.aburazemi);
 assert.ok(night.crickets>.8&&night.kumazemi===0&&night.aburazemi===0);
 assert.ok(morning.birds>.4);
});

test('the seasons change the air: no cicadas in winter, frogs in the rainy season',()=>{
 assert.equal(ambience({minutes:at(1,15,8)}).kumazemi,0);assert.equal(ambience({minutes:at(1,15,14)}).aburazemi,0);
 assert.ok(ambience({minutes:at(6,1,22)}).frogs>.8,'rainy-season nights are frogs');
 assert.ok(ambience({minutes:at(10,20,22)}).crickets>ambience({minutes:at(10,20,22)}).frogs,'autumn nights are crickets');
});

test('rain quiets the insects and birds, wakes the frogs and is heard itself; walls muffle everything',()=>{
 const dry=ambience({minutes:at(8,1,22)}),wet=ambience({minutes:at(8,1,22),rain:true});
 assert.ok(wet.crickets<dry.crickets*.3&&wet.frogs>dry.frogs&&wet.rain===1&&dry.rain===0);
 const inside=ambience({minutes:at(8,1,9),inside:true}),outside=ambience({minutes:at(8,1,9)});
 assert.ok(inside.kumazemi<outside.kumazemi*.3);
 assert.ok(ambience({minutes:at(8,1,12),harbour:1}).gulls>ambience({minutes:at(8,1,12),harbour:0}).gulls);
});

test('levels drift with the minutes, never step',()=>{
 let last=ambience({minutes:at(8,1,0)});
 for(let m=1;m<1440;m++){const now=ambience({minutes:at(8,1,0)+m});for(const l of LAYERS)assert.ok(Math.abs(now[l]-last[l])<.06,l+' jumps at minute '+m);last=now;}
});

test('neither edition schedules the retired gecko tones',()=>{
 assert.equal(LAYERS.includes('geckos'),false);
 for(const month of [1,4,7,10])for(const hour of [0,5,12,20,23]){const mix=ambience({minutes:at(month,17,hour)});assert.equal(mix.geckos,undefined);}
});
