import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveLyrics,lyricDelivery} from '../src/music/live-lyrics.js';
import {createThuanVoice} from '../src/people/thuan-voice.js';
import {SONGS,STYLES,scoreFor} from '../src/music/songs.js';
import {performanceAt} from '../src/music/show.js';
function browser(){
 const spoken=[];let cancels=0;
 class Utterance{constructor(text){this.text=text;}}
 const synth={getVoices:()=>[{name:'Daniel',lang:'en-GB',localService:true},{name:'Serena',lang:'en-GB',localService:true}],
  speak(u){spoken.push(u);},cancel(){cancels++;}};
 return {synth,Utterance,spoken,get cancels(){return cancels;}};
}
const cast=[{body:{silhouette:'masculine'}},{body:{silhouette:'feminine'}}];
test('typed lyrics are spoken live once per verse, with distinct cast voices and actual word boundaries',()=>{
 const b=browser(),live=createLiveLyrics(b),s=scoreFor({...SONGS[0],lines:['My banana runs the harbour','Thuan dances on the moon','The captain lost his trousers','We all demand another tune']});
 live.arm(s,cast);assert.equal(b.spoken[0].volume,0,'gesture primer is silent');
 live.update(3*s.beat);assert.equal(b.spoken.length,1);
 live.update(4*s.beat);let u=b.spoken.at(-1);assert.equal(u.text,s.song.lines[0]);assert.equal(u.voice.name,'Daniel');u.onstart();u.onboundary({name:'word',charIndex:3});assert.deepEqual(live.cue,{line:0,singer:0,word:1,speaking:true});
 live.update(5*s.beat);assert.equal(b.spoken.length,2,'never queues the same line twice');
 const old=u;live.update(12*s.beat);u=b.spoken.at(-1);assert.equal(u.voice.name,'Serena');assert.equal(u.text,s.song.lines[1]);
 old.onstart();old.onboundary({name:'word',charIndex:12});assert.equal(live.cue.speaking,false,'late events from a cancelled verse are ignored');
 u.onstart();assert.equal(live.cue.singer,1);live.stop();assert.equal(live.cue,null);assert.ok(b.cancels>=2);live.dispose();
});
test('mute, stop, phrase deadlines and replacement prevent delayed browser speech',async()=>{
 const b=browser(),live=createLiveLyrics(b),s=scoreFor(SONGS[0]);
 live.arm(s,cast);live.update(4*s.beat);const cancelled=b.spoken.at(-1);live.mute(true);cancelled.onstart();assert.equal(live.cue.speaking,false);
 const count=b.spoken.length;live.update(12*s.beat);assert.equal(b.spoken.length,count);live.mute(false);live.update(13*s.beat);assert.equal(b.spoken.length,count,'unmute does not replay a partial verse');
 live.update(20*s.beat);assert.equal(b.spoken.at(-1).text,s.song.lines[2]);
 live.update(20*s.beat+1.6);assert.equal(live.source,'electronic','a voice that never starts becomes an explicit fallback');assert.match(live.notice,/unavailable/);
 live.stop();live.update(28*s.beat);assert.equal(live.cue,null);
 live.arm(s,cast);live.update(5.5*s.beat);assert.equal(live.cue.speaking,false,'missed lines do not queue on a late frame');live.dispose();
 await Promise.resolve();
});
test('empty/device-unavailable speech is safe and the shared dialogue helper remains backward compatible',async()=>{
 const missing=createLiveLyrics({synth:null,Utterance:null});missing.arm(scoreFor(SONGS[0]),cast);assert.equal(missing.source,'electronic');assert.equal((await missing.test('Hello')).reason,'unsupported');missing.dispose();
 const b=browser(),voice=createThuanVoice(b);assert.equal((await voice.speak('')).reason,'empty');
 const pending=voice.speak('Welcome to the shop.');const u=b.spoken.at(-1);assert.equal(u.rate,.98);assert.equal(u.pitch,1.06);u.onstart();assert.equal(voice.speaking,true);u.onend();assert.deepEqual(await pending,{spoken:true});assert.equal(voice.speaking,false);
 const timed=voice.speak('Hello',{timeout:1});assert.equal((await timed).reason,'timeout');voice.dispose();
});
test('all styles bound speech speed/pitch and wild performances include grounded silly routines',()=>{
 const moves=new Set();
 for(const style of Object.keys(STYLES)){
  const s=scoreFor({...SONGS[0],style,performance:'wild'});
  for(let line=0;line<4;line++)for(const recipe of cast){const d=lyricDelivery(s,line,recipe);assert.ok(d.rate>=.6&&d.rate<=2.2);assert.ok(d.pitch>0&&d.pitch<=2);}
  for(let beat=4;beat<36;beat+=.5)for(let i=0;i<4;i++)moves.add(performanceAt(s,beat*s.beat,i,4).move);
  const calm=performanceAt(s,9*s.beat,0,4,{reduced:true});assert.equal(calm.move,'Sing');assert.equal(calm.step,0);assert.equal(calm.turn,0);
 }
 for(const move of ['ChickenDance','JellyWobble','DramaFinish'])assert.ok(moves.has(move));
});
