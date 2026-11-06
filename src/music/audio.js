/** Original genre arrangements and foreground electronic singing. No external audio service. */
import {singingPart} from './songs.js';
const freq=n=>440*2**((n-69)/12);
const FORMANTS={a:[800,1150,2900],e:[450,1900,2600],i:[300,2200,3000],o:[450,800,2800],u:[325,700,2500],y:[300,2200,3000]};
export const VOICE_PROFILES=Object.freeze({
 crooner:{shift:-12,formant:.84,vibrato:5.2,depth:.012,level:.20},
 alto:{shift:0,formant:1.10,vibrato:5.8,depth:.008,level:.18},
 belt:{shift:-5,formant:.96,vibrato:6.3,depth:.015,level:.23},
 chip:{shift:12,formant:1.35,vibrato:7,depth:.006,level:.16}
});
export function createConcertAudio({Context=globalThis.AudioContext||globalThis.webkitAudioContext,liveLyrics=null}={}){
 let ctx=null,out=null,band=null,vocals=null,mix=null,score=null,origin=0,nextBeat=0,nextVoice=0,cast=[],on=false,muted=false,generation=0,lastCheer=-Infinity;
 const sources=new Set();
 function source(node,at,duration){sources.add(node);node.onended=()=>{sources.delete(node);node.disconnect();};node.start(at);node.stop(at+duration);return node;}
 function envelope(at,duration,level,bus=band,sustain=false){
  const g=ctx.createGain();g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(Math.max(.0002,level),at+.012);
  if(sustain)g.gain.setValueAtTime(Math.max(.0002,level)*.85,at+Math.max(.016,duration*.70));
  g.gain.exponentialRampToValueAtTime(.0001,at+Math.max(.035,duration));g.connect(bus);return g;
 }
 function tone(at,n,d,level,type='sine',slide=null){const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq(n),at);if(slide!==null)o.frequency.exponentialRampToValueAtTime(freq(slide),at+d);o.connect(envelope(at,d,level));source(o,at,d+.03);}
 function noise(at,d,level,high=1800,bus=band){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*d),ctx.sampleRate),v=b.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=(Math.random()*2-1);const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=high;s.connect(f).connect(envelope(at,d,level,bus));source(s,at,d+.03);}
 function voice(s,index,shout=false){
  const chosen=score.song.voice==='cast'?(cast[index]?.body?.silhouette==='feminine'?'alto':score.song.style==='rock'?'belt':'crooner'):score.song.voice,
   p=VOICE_PROFILES[chosen]||VOICE_PROFILES.crooner,at=origin+s.start,d=Math.max(.06,s.duration),formants=FORMANTS[s.vowel]||FORMANTS.a,
   pitch=freq(s.note+p.shift),active=s.line===3?cast.length:1,level=p.level/Math.sqrt(active)*(shout?.65:1),o=ctx.createOscillator();o.type='sawtooth';
  o.frequency.setValueAtTime(pitch*(score.song.style==='enka'?.94:.985),at);o.frequency.exponentialRampToValueAtTime(pitch,at+Math.min(.08,d*.2));
  const g=envelope(at,d,level,vocals,true);
  for(let k=0;k<3;k++){const filter=ctx.createBiquadFilter(),gain=ctx.createGain();filter.type='bandpass';filter.frequency.value=formants[k]*p.formant;filter.Q.value=3.2+k*.4;gain.gain.value=[1.5,.9,.4][k];o.connect(filter).connect(gain).connect(g);}
  // A voiced fundamental and vibrato preserve a clear register beneath the vowels.
  const fundamental=ctx.createOscillator();fundamental.type='sine';fundamental.frequency.value=pitch;fundamental.connect(envelope(at,d,level*.28,vocals,true));source(fundamental,at,d+.03);
  const vibrato=ctx.createOscillator(),depth=ctx.createGain();vibrato.frequency.value=p.vibrato;depth.gain.value=pitch*p.depth*(score.song.style==='enka'?1.7:1);vibrato.connect(depth);depth.connect(o.frequency);depth.connect(fundamental.frequency);source(vibrato,at,d+.03);source(o,at,d+.03);
  const consonant=(letters,time)=>{if(!letters)return;
   if(/[sfhxz]|sh|ch|th/.test(letters))noise(time,Math.min(.07,d*.23),.065/Math.sqrt(active),/sh|ch/.test(letters)?2300:4500,vocals);
   else if(/[ptkbdg]/.test(letters))noise(time,.022,.07/Math.sqrt(active),1000,vocals);
  };
  consonant(s.onset,at);consonant(s.coda,at+d*.79);
 }
 function chant(at){for(let i=0;i<cast.length;i++)voice({start:at-origin,duration:.20,note:score.style.base+7,line:3,vowel:'e',onset:'h',coda:'h'},i,true);}
 function percussion(b,at){
  if(b<4){tone(at,84,.055,.055);return;}
  if(b>=36){if(b===36)for(let i=0;i<15;i++)noise(at+i*.075,.10,.09,900);return;}
  const style=score.song.style,bar=Math.floor((b-4)/4),root=score.style.base+[0,5,7,0][bar%4]-24,step=b%4,B=score.beat;
  if(style==='ballad'||style==='enka'){
   if(step===0)tone(at,38,.19,.15,'sine',17);
   if(step===2)noise(at,.15,.055,1300);
   tone(at,root,step%2?B*.8:B*1.7,.13,'triangle');
   for(let k=0;k<2;k++)tone(at+B*k/2,root+24+[0,7,style==='enka'?15:16,19][(b*2+k)%4],B*.9,style==='enka'?.12:.10,style==='enka'?'triangle':'sine');
   if(step===0)for(const n of [12,style==='enka'?15:16,19])tone(at,root+n,B*3.7,.045,'sine');
  }else if(style==='rock'){
   if(step===0||step===2)tone(at,38,.17,.22,'sine',17);
   if(step===1||step===3)noise(at,.11,.17,950);
   for(let k=0;k<2;k++){const t=at+k*B/2;noise(t,.04,.045,6000);for(const n of [12,19,24])tone(t,root+n,B*.42,.05,'sawtooth');}
   tone(at,root+(step===3?7:0),B*.8,.17,'triangle');
  }else if(style==='disco'||style==='eurobeat'){
   tone(at,38,.14,.20,'sine',16);if(step%2)noise(at,.1,.13,1100);
   noise(at,.035,.035,7500);noise(at+B/2,.10,.055,6000);
   for(let k=0;k<(style==='eurobeat'?4:2);k++){
    const t=at+B*k/(style==='eurobeat'?4:2),n=root+(k%2?12:0);tone(t,n,B*.25,.13,'triangle');
    if(style==='eurobeat')tone(t,root+36+[0,7,12,7][k],B*.22,.035,'sawtooth');
   }
   if(step%2===0)for(const n of [24,28,31])tone(at+B/2,root+n,B*.4,.045,style==='eurobeat'?'sawtooth':'square');
  }else{
   if(step===0||step===2)tone(at,38,.16,.18,'sine',16);if(step===1||step===3)noise(at,.12,.09,1200);
   noise(at,.035,.03,6500);tone(at,root+(step%2?12:0),B*.72,.15,'triangle');
   if(step===0||step===2)for(const n of [24,28,31,35])tone(at,root+n,B*1.5,.035,'triangle');
   tone(at+B*.75,root+24+(step%2?7:4),B*.22,.055,'sine');
  }
  if(b===11||b===19||b===27)chant(at+B*.72);
 }
 function stop(){generation++;on=false;for(const node of sources){try{node.stop();}catch{}node.disconnect();}sources.clear();for(const node of [band,vocals,mix,out])node?.disconnect();out=band=vocals=mix=null;score=null;}
 return {
  async start(next,recipes,{silent=false}={}){
   stop();const token=generation;score=next;cast=recipes.length?recipes:[{}];muted=silent;if(!Context)return false;
   ctx??=new Context();out=ctx.createGain();out.gain.value=muted?0:.72;out.connect(ctx.destination);
   band=ctx.createGain();band.gain.value=.48;vocals=ctx.createGain();vocals.gain.value=1.4;
   mix=ctx.createDynamicsCompressor?.();if(mix){mix.threshold.value=-16;mix.knee.value=18;mix.ratio.value=4;mix.attack.value=.008;mix.release.value=.18;mix.connect(out);}
   band.connect(mix||out);vocals.connect(mix||out);
   try{await ctx.resume();}catch{if(token===generation)stop();return false;}
   if(token!==generation||!score||ctx.state!=='running')return false;
   origin=ctx.currentTime+.10;nextBeat=0;nextVoice=0;lastCheer=-Infinity;on=true;return true;
  },
  update(){if(!on||!score||ctx.state!=='running')return;const edge=ctx.currentTime+.45;
   liveLyrics?.update(Math.max(0,ctx.currentTime-origin));
   while(nextBeat<40&&origin+nextBeat*score.beat<edge){const at=origin+nextBeat*score.beat;if(at>=ctx.currentTime-.05)percussion(nextBeat,at);nextBeat++;}
   while(nextVoice<score.syllables.length&&origin+score.syllables[nextVoice].start<edge){const s=score.syllables[nextVoice++];if(origin+s.start<ctx.currentTime-.05||liveLyrics?.source==='live-text')continue;for(let i=0;i<cast.length;i++)if(singingPart(s.line,i,cast.length))voice(s,i);}
  },
  cheer(){if(!on||!score||ctx.currentTime-lastCheer<score.beat*2)return false;lastCheer=ctx.currentTime;chant(ctx.currentTime+.025);noise(ctx.currentTime+.025,.12,.10,1000);return true;},
  get elapsed(){return on?Math.max(0,ctx.currentTime-origin):0;},
  get running(){return on&&ctx?.state==='running';},
  mute(value){muted=!!value;if(out)out.gain.setTargetAtTime(muted?0:.72,ctx.currentTime,.025);},
  stop,dispose(){stop();void ctx?.close().catch(()=>{});ctx=null;},
 };
}
