import test from 'node:test';
import assert from 'node:assert/strict';
import {WEATHERS,rollWeather,nextWeather,readWeather,writeWeather,WEATHER_KEY} from '../src/world/weather.js';

function seeded(seed=7){return ()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};}
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('the weather roll favours fine days but brings all three',()=>{
 const rand=seeded(),counts={sunny:0,cloudy:0,rain:0};for(let i=0;i<4000;i++)counts[rollWeather(rand)]++;
 for(const w of WEATHERS)assert.ok(counts[w]>300,w+' comes up');
 assert.ok(counts.sunny>counts.cloudy&&counts.cloudy>counts.rain,JSON.stringify(counts));
});
test('the weather turns gently: a blue sky never goes straight to rain',()=>{
 const rand=seeded(3);for(let i=0;i<2000;i++)assert.notEqual(nextWeather('sunny',rand),'rain');
 const seen=new Set();let w='sunny';for(let i=0;i<500;i++){w=nextWeather(w,rand);seen.add(w);}
 assert.deepEqual([...seen].sort(),[...WEATHERS].sort(),'every weather turns up over a long stretch');
});
test('the shared weather record survives a round trip and falls back on junk',()=>{
 const store=memory();assert.deepEqual(readWeather(store),{mode:'random',weather:'sunny'});
 writeWeather({mode:'fixed',weather:'rain'},store);assert.deepEqual(readWeather(store),{mode:'fixed',weather:'rain'});
 store.setItem(WEATHER_KEY,'{not json');assert.deepEqual(readWeather(store),{mode:'random',weather:'sunny'});
 store.setItem(WEATHER_KEY,JSON.stringify({mode:'random',weather:'snow'}));assert.equal(readWeather(store).weather,'sunny');
});

test('a change of weather at night does not bring the sun out',async()=>{
 const {weatherLine}=await import('../src/world/weather.js');
 assert.match(weatherLine('sunny',12*60),/sun comes out/);
 for(const m of [23*60+31,2*60,19*60])assert.doesNotMatch(weatherLine('sunny',m),/sun/,String(m));
 assert.match(weatherLine('cloudy',1440*3+23*60),/stars/);
 assert.equal(weatherLine('rain',23*60),weatherLine('rain',12*60));
});
