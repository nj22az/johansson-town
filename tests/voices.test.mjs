import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VOICE_LINES} from '../src/people/voice-lines.js';
import {DIALOGUE} from '../src/people/schedules.js?snappy=1';

test('published voice topics have matching subtitles and real local WAVs',async()=>{
 assert.equal(VOICE_LINES.length,3);
 for(const clip of VOICE_LINES){
  const row=DIALOGUE[clip.resident].find(row=>row[0]===clip.topic);
  // A later rewrite of a resident's lines must not silently drop the wiring:
  // an unreachable clip would play audio under a subtitle that disagrees with it.
  assert.ok(row,clip.id+' still reaches a '+clip.resident+' line');
  assert.equal(row[1],clip.en);assert.equal(row[3],null,'Japanese recordings must not play under English subtitles');
  const wav=await readFile(new URL('../assets/audio/voices/'+clip.id+'.wav',import.meta.url));
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');assert.ok(wav.length>100000);
 }
 // Retired with Chin's rewrite; the clip stays on disk with its provenance.
 assert.ok(!VOICE_LINES.some(clip=>clip.id==='kenji-game'));
 assert.ok(DIALOGUE.Chin.every(row=>!row[3]),'no recording contradicts Chin\u2019s rewritten lines');
});

test('delayed speech cannot play after close, replacement, mute or hidden page',async()=>{
 const started=[],pending=new Map(),handlers={};
 const node=()=>({connect(next){return next;},disconnect(){},gain:{value:0,setTargetAtTime(){}},pan:{value:0,setTargetAtTime(){}}});
 class Context{
  currentTime=0;destination={};
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
  createGain(){return node();}createStereoPanner(){return node();}
  createBufferSource(){return {...node(),start(){started.push(this);},stop(){this.stopped=true;}};}
  decodeAudioData(data){return Promise.resolve(data);}
 }
 globalThis.document={hidden:false,baseURI:'https://example.test/johansson-town/',addEventListener(name,fn){handlers[name]=fn;}};
 globalThis.window={AudioContext:Context};
 globalThis.fetch=url=>{
  assert.equal(new URL(url).origin,'https://example.test');
  if(url.includes('/voices/'))return new Promise(resolve=>pending.set(url.split('/').at(-1).replace('.wav',''),resolve));
  return Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 };
 const {townAudio,unlockTownAudio}=await import('../src/audio/town-audio.js?snappy=1');unlockTownAudio();
 const finish=id=>pending.get(id)({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 let waiting=townAudio.speak('aiko-greeting');townAudio.stopSpeech();finish('aiko-greeting');await waiting;assert.equal(started.length,0);
 const old=townAudio.speak('aiko-cat'),current=townAudio.speak('kenji-game');finish('kenji-game');await current;finish('aiko-cat');await old;assert.equal(started.length,1);
 townAudio.setEnabled(false);assert.ok(started[0].stopped);await townAudio.speak('aiko-greeting');assert.equal(started.length,1);
 townAudio.setEnabled(true);waiting=townAudio.speak('aiko-chair');document.hidden=true;handlers.visibilitychange();finish('aiko-chair');await waiting;assert.equal(started.length,1);
 document.hidden=false;await townAudio.speak('aiko-greeting');assert.equal(started.length,2);townAudio.stopSpeech();assert.ok(started[1].stopped);
 waiting=townAudio.speak('missing');pending.get('missing')({ok:false});await waiting;assert.equal(started.length,2);
});
