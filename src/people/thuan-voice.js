/**
 * Speech for Thuan, through the browser's own synthesiser.
 *
 * `speechSynthesis` costs nothing to ship and needs no network or licence, which is the
 * whole reason it is here rather than a hosted voice. It is also quirky: voices arrive
 * asynchronously, iOS will not speak without a user gesture, and an utterance that is
 * never spoken never fires `end`. Every one of those is handled, because a conversation
 * that silently never resolves would hang the dialogue that is waiting on it.
 *
 * @typedef {object} VoicePreference
 * @property {string[]} [langs] BCP-47 prefixes in order of preference
 * @property {string[]} [names] substrings matched against voice names
 */

const DEFAULT_PREFERENCE=Object.freeze({
 // Thuan is Vietnamese, keeping a shop in a Japanese harbour town, speaking English.
 langs:['vi','ja','en-GB','en'],
 names:['Linh','Mai','Kyoko','O-ren',"Google Japanese",'Samantha','Female','Karen','Martha']
});

/** Scores a voice: language first, then a known-good name, then anything female. */
function scoreVoice(voice,preference){
 const lang=(voice.lang||'').toLowerCase(),name=(voice.name||'').toLowerCase();
 let score=0;
 const langIndex=preference.langs.findIndex(prefix=>lang.startsWith(prefix.toLowerCase()));
 if(langIndex>=0)score+=(preference.langs.length-langIndex)*10;
 const nameIndex=preference.names.findIndex(part=>name.includes(part.toLowerCase()));
 if(nameIndex>=0)score+=(preference.names.length-nameIndex)*2;
 if(/female|woman/.test(name))score+=3;
 if(voice.localService)score+=1;   // local voices start instantly; remote ones stall
 return score;
}

/**
 * @param {SpeechSynthesisVoice[]} voices
 * @param {VoicePreference} [preference]
 */
export function selectVoice(voices,preference=DEFAULT_PREFERENCE){
 const usable=(voices||[]).filter(v=>v&&typeof v.name==='string');
 if(!usable.length)return null;
 return usable.map(voice=>({voice,score:scoreVoice(voice,preference)}))
  .sort((a,b)=>b.score-a.score)[0].voice;
}

/**
 * @param {object} options
 * @param {{setSpeaking:(v:boolean|number)=>void}} [options.face] driven while speech runs
 * @param {SpeechSynthesis} [options.synth]
 * @param {VoicePreference} [options.preference]
 * @param {number} [options.maxChars] longer lines are spoken truncated rather than forever
 */
export function createThuanVoice({face=null,synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,preference=DEFAULT_PREFERENCE,maxChars=320}={}){
 const supported=!!(synth&&typeof synth.speak==='function'&&typeof Utterance==='function');
 let voice=null,active=null,muted=false;

 function refreshVoice(){
  if(!supported)return null;
  try{voice=selectVoice(synth.getVoices?.()||[],preference);}catch{voice=null;}
  return voice;
 }
 if(supported){
  refreshVoice();
  // Chrome populates the list asynchronously and fires this once it has.
  if('onvoiceschanged' in synth)synth.addEventListener?.('voiceschanged',refreshVoice);
 }

 function stopFace(){face?.setSpeaking?.(false);}

 /**
  * Speaks a line. Always resolves: on success, on error, on an empty line, and when
  * speech is unsupported or muted, so a caller can await it without risk of hanging.
  * @param {string} text
  * @returns {Promise<{spoken:boolean,reason?:string}>}
  */
 function speak(text,{rate=.98,pitch=1.06,volume=1,preference:linePreference=null,onBoundary=null,onStart=null,timeout=null}={}){
  const line=String(text||'').trim();
  cancel();
  if(!line)return Promise.resolve({spoken:false,reason:'empty'});
  if(!supported)return Promise.resolve({spoken:false,reason:'unsupported'});
  if(muted)return Promise.resolve({spoken:false,reason:'muted'});

  return new Promise(resolve=>{
   const utterance=new Utterance(line.slice(0,maxChars));
   if(!voice)refreshVoice();
   let chosen=voice;try{if(linePreference)chosen=selectVoice(synth.getVoices?.()||[],linePreference);}catch{}
   if(chosen){utterance.voice=chosen;utterance.lang=chosen.lang;}
   utterance.rate=Math.max(.5,Math.min(2.5,Number(rate)||.98));utterance.pitch=Math.max(.1,Math.min(2,Number(pitch)||1.06));utterance.volume=Math.max(0,Math.min(1,volume));
   let settled=false;
   const finish=result=>{
    if(settled)return;
    settled=true;
    if(active?.utterance===utterance)clearTimeout(active.timer);
    if(active?.utterance===utterance)active=null;
    stopFace();
    resolve(result);
   };
   utterance.onstart=()=>{if(settled)return;face?.setSpeaking?.(true);onStart?.();};
   utterance.onboundary=event=>{if(!settled)onBoundary?.(event);};
   utterance.onend=()=>finish({spoken:true});
   utterance.onerror=event=>finish({spoken:false,reason:event?.error||'error'});
   active={utterance,finish};
   try{
    // iOS refuses to speak outside a user gesture and fires nothing at all. Give up
    // after a bound proportional to the line so the caller is never left waiting.
    const bound=timeout??2000+line.length*110;
    active.timer=setTimeout(()=>cancel('timeout'),bound);
    synth.speak(utterance);
   }catch(error){finish({spoken:false,reason:String(error?.message||error)});}
  });
 }

 /**
  * Stops any line in progress and settles its promise. With nothing in flight this is
  * a no-op: telling the face to stop speaking when it never started would stutter it.
  */
 function cancel(reason='cancelled'){
  const pending=active;
  if(pending?.timer)clearTimeout(pending.timer);
  active=null;
  if(supported){try{synth.cancel();}catch{}}
  pending?.finish?.({spoken:false,reason});   // finish() releases the face
 }

 return {
  get supported(){return supported;},
  get speaking(){return !!active;},
  get voice(){return voice;},
  set muted(value){muted=!!value;if(muted)cancel();},
  get muted(){return muted;},
  speak,cancel,refreshVoice,
  dispose(){
   if(active)cancel();
   if(supported&&'onvoiceschanged' in synth)synth.removeEventListener?.('voiceschanged',refreshVoice);
  }
 };
}
