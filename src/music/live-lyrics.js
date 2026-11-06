/** Immediate lyric speech through the same browser TTS helper as Thuan's dialogue. */
import {createThuanVoice} from '../people/thuan-voice.js';
const LOW={langs:['en-GB','en'],names:['Daniel','Arthur','George','David','Alex','Male']};
const HIGH={langs:['en-GB','en'],names:['Serena','Martha','Samantha','Karen','Female']};
const dial=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):.5;
export function lyricDelivery(score,line,recipe){
 const female=recipe?.body?.silhouette==='feminine',profile=score.song.voice,
  pitch=({crooner:.65,alto:1.3,belt:.9,chip:1.85})[profile]??((female?1.15:.85)+(dial(recipe?.profile?.pitch)-.5)*.4),
  syllables=score.syllables.filter(s=>s.line===line).length;
 return {pitch:Math.min(2,pitch+(score.style.melody[line*2%8]||0)*.015),rate:Math.max(.6,Math.min(2.2,syllables*.24/(score.beat*7)*(.9+dial(recipe?.profile?.speed)*.2))),
  preference:profile==='alto'||profile==='chip'||profile==='cast'&&female?HIGH:LOW};
}
export function createLiveLyrics({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
 let score=null,cast=[],line=-1,singer=0,word=-1,speaking=false,started=false,requestedAt=null,muted=false,failed=false,owned=false,revision=0;
 const voice=createThuanVoice({synth,Utterance,maxChars:64,face:{setSpeaking(v){speaking=!!v;}}});
 const failure='Live text voice is unavailable on this device. Electronic voice fallback selected. Try Test voice before your next take.';
 function cancel(){if(owned)voice.cancel();speaking=false;requestedAt=null;word=-1;}
 function stop(){revision++;cancel();score=null;line=-1;}
 function arm(next,recipes,{silent=false}={}){
  stop();score=next;cast=recipes.length?recipes:[{}];muted=silent;failed=!voice.supported;
  // Called directly by Perform's click, before any awaited audio unlock.
  // A silent utterance primes gesture-gated mobile speech; unsupported engines fall back.
  if(voice.supported&&!muted){owned=true;try{const prime=new Utterance(' ');prime.volume=0;synth.speak(prime);}catch{failed=true;}}
 }
 function update(seconds){
  if(!score)return;
  const beat=seconds/score.beat,next=beat<4?-1:beat>=36?4:Math.floor((beat-4)/8);
  if(next===line){
   if(requestedAt!==null&&(!started&&seconds-requestedAt>Math.min(1.5,score.beat*3)||beat-(4+line*8)>=7.6)){
    const blocked=!started;cancel();if(blocked)failed=true;
   }
   return;
  }
  revision++;cancel();line=next;started=false;
  if(line<0||line>3||muted||failed)return;
  // Missed phrases never queue and burst later after a suspended tab.
  if(beat-(4+line*8)>1)return;
  singer=line%cast.length;const token=revision,words=[...score.song.lines[line].matchAll(/\S+/g)];
  owned=true;requestedAt=seconds;
  void voice.speak(score.song.lines[line],{...lyricDelivery(score,line,cast[singer]),timeout:score.beat*7600,
   onStart(){if(token===revision){started=true;word=-1;}},
   onBoundary(event){if(token!==revision||event.name&&event.name!=='word')return;const index=Number(event.charIndex);if(!Number.isFinite(index))return;word=Math.max(0,words.findLastIndex(w=>w.index<=index));}
  }).then(result=>{if(token!==revision)return;requestedAt=null;if(!result.spoken&&result.reason!=='cancelled')failed=true;});
 }
 async function test(text,profile='cast',recipe={}){
  stop();failed=!voice.supported;if(failed)return {spoken:false,reason:'unsupported'};
  owned=true;const token=revision;
  const result=await voice.speak(text,{...lyricDelivery({song:{voice:profile},style:{melody:[]},syllables:[],beat:1},0,recipe),rate:1});
  if(token===revision)failed=!result.spoken;return result;
 }
 return {arm,update,stop,test,get supported(){return voice.supported;},get source(){return failed?'electronic':'live-text';},get notice(){return failed?failure:'';},
  get cue(){return score&&!failed?{line,singer,word,speaking}:null;},
  mute(value){muted=!!value;if(muted){revision++;cancel();}},
  dispose(){stop();voice.dispose();}
 };
}
