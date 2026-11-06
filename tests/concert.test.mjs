import test from 'node:test';
import assert from 'node:assert/strict';
import {SONGS,STYLES,cleanSong,cleanConcert,scoreFor,cueAt,singingPart} from '../src/music/songs.js';
import {createConcertAudio} from '../src/music/audio.js';
import {createIzakayaPlay} from '../src/people/izakaya-play.js';
import {openYear} from '../src/progression/year-loop.js';

test('each arrangement has a finite, pitched score with every lyric word in order and a complete final bow',()=>{
 for(const style of Object.keys(STYLES))for(const song of SONGS){
  const s=scoreFor({...song,style});assert.ok(Math.abs(s.duration-40*60/STYLES[style].bpm)<1e-10);
  assert.equal(cueAt(s,0).count,4);assert.equal(cueAt(s,s.beat*3.99).count,1);
  assert.equal(cueAt(s,s.beat*4).phase,'singing');assert.equal(cueAt(s,s.beat*4).line,0);
  assert.equal(cueAt(s,s.beat*36).phase,'bow');assert.equal(cueAt(s,s.duration).phase,'finished');
  for(let i=0;i<4;i++)assert.deepEqual(s.words.filter(w=>w.line===i).map(w=>w.text),song.lines[i].split(' '));
  for(const v of s.syllables){assert.ok(v.start>=4*s.beat&&v.start+v.duration<=36*s.beat);assert.ok(v.duration>0&&Number.isFinite(v.note));}
  for(let count=1;count<=4;count++)for(let line=0;line<4;line++)assert.equal(Array.from({length:count},(_,i)=>singingPart(line,i,count)).filter(Boolean).length,line===3?count:1);
 }
});

test('untrusted or old song saves are bounded, deduplicated and do not replace the original song templates',()=>{
 const raw={song:{title:'X'.repeat(100),style:'__proto__',lines:['a\n b',null,'x'.repeat(90),'<img onerror=alert(1)>']},cast:['Thuan','Thuan','Johansson',null,...Array(5).fill('Chin')],completed:Infinity};
 const d=cleanConcert(raw);assert.equal(d.song.title.length,48);assert.equal(d.song.style,'ballad');assert.equal(d.song.lines[0],'a b');assert.equal(d.song.lines[2].length,64);assert.equal(d.song.lines[3],'<img onerror=alert(1)>','plain text, never HTML');
 assert.deepEqual(d.cast,['Thuan','Johansson','Chin']);assert.equal(d.completed,0);d.song.lines[0]='changed';assert.notEqual(SONGS[0].lines[0],'changed');
 assert.equal(cleanSong(null).lines.length,4);assert.equal(cleanConcert(null).song.lines.length,4);
 const next=openYear({loopYear:2025,concert:d},new Date('2026-01-02')).saved;assert.deepEqual(next.concert,d);assert.notEqual(next.concert,d,'song survives the yearly loop as a copy');
});

test('Minato opens the stage only during business hours and does not charge just for opening the song book',()=>{
 let calls=0,closed=0,charges=0,minutes=600;
 const play=createIzakayaPlay({state:{},getMinutes:()=>minutes,onKaraoke:()=>calls++,close:()=>closed++,spend:()=>charges++,receipt(){},show(){}});
 play.karaoke();assert.equal(calls,0);minutes=20*60;play.karaoke();assert.equal(calls,1);assert.equal(closed,1);assert.equal(charges,0);
});

function audioHarness({defer=false}={}){
 const nodes=[],waits=[];let ctx;
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}});
 const node=()=>{const n={connect(next){return next;},disconnect(){this.disconnected=true;},gain:param(),frequency:param(),Q:param(),start(at){this.started=at;},stop(at){this.stopped=at??0;}};nodes.push(n);return n;};
 class Context{
  constructor(){ctx=this;this.currentTime=0;this.state='running';this.sampleRate=8000;this.destination={};}
  createOscillator(){return node();}createGain(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}
  createBuffer(ch,len){return {getChannelData(){return new Float32Array(len);}};}
  resume(){return defer?new Promise(resolve=>waits.push(resolve)):Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 }
 return {audio:createConcertAudio({Context}),nodes,waits,get ctx(){return ctx;}};
}
test('the sound scheduler plays a bounded lookahead, includes pitched vocals, and stops all sources on exit',async()=>{
 for(const style of Object.keys(STYLES)){
  const h=audioHarness(),score=scoreFor({...SONGS[0],style});await h.audio.start(score,[{body:{silhouette:'masculine'}},{body:{silhouette:'feminine'}}]);
  h.audio.update();const first=h.nodes.filter(n=>n.started!==undefined);assert.ok(first.length>0);assert.ok(first.every(n=>n.started<=h.ctx.currentTime+.45));
  const before=h.nodes.length;h.ctx.currentTime=4*score.beat+.11;h.audio.update();assert.ok(h.nodes.length>before+10,'accompaniment and formant voices scheduled');
  const playing=h.nodes.filter(n=>n.started!==undefined);h.audio.mute(true);h.audio.stop();assert.equal(h.audio.running,false);assert.ok(playing.every(n=>n.stopped===0&&n.disconnected));
  const ended=h.nodes.length;h.ctx.currentTime+=30;h.audio.update();assert.equal(h.nodes.length,ended,'no queued music after exit');h.audio.dispose();
 }
});
test('a cancelled audio unlock cannot resurrect the song or overwrite a newer performance',async()=>{
 const h=audioHarness({defer:true}),s=scoreFor(SONGS[0]);const old=h.audio.start(s,[{}]);h.audio.stop();h.waits.shift()();assert.equal(await old,false);assert.equal(h.audio.running,false);
 const a=h.audio.start(s,[{}]),b=h.audio.start(scoreFor(SONGS[1]),[{}]);h.waits.shift()();assert.equal(await a,false);h.waits.shift()();assert.equal(await b,true);h.audio.stop();
});
