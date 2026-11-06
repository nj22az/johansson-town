import {assetURL} from '../assets.js';
import {BEACH_CORNER} from '../world/beach-layout.js';
import {ambience} from './soundscape.js';
import {naturalNightCall} from './night-texture.js';
let ctx=null,master=null,enabled=true,buffers=new Map(),loops=new Map(),lastTrain=-1,speech=null,speechRequest=0;
export function unlockTownAudio(){
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
  if(!ctx){ctx=new Context();master=ctx.createGain();master.gain.value=.38;master.connect(ctx.destination);}
  if(!document.hidden)ctx.resume().catch(()=>{});

}
const pendingAudio=new Map();
function loadSound(name){
 if(buffers.has(name))return Promise.resolve(true);
 if(pendingAudio.has(name))return pendingAudio.get(name);
 const task=(async()=>{try{const response=await fetch(assetURL('audio/'+name+'.wav'));if(!response.ok)throw Error(name);buffers.set(name,await ctx.decodeAudioData(await response.arrayBuffer()));return true;}catch{return false;}})();
 pendingAudio.set(name,task);return task;
}
function voice(name,loop=false){if(!ctx)return null;if(!buffers.has(name)){void loadSound(name);return null;}const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner();source.buffer=buffers.get(name);source.loop=loop;gain.gain.value=0;source.connect(gain).connect(pan).connect(master);source.start();return {source,gain,pan};}
/**
 * The shore at the beach corner, synthesised: there is no recording of it, and a loop
 * would repeat. Brown noise through a low-pass is the sea; its level follows a swell
 * that builds, breaks and slides back about every nine seconds, the filter opening as
 * the wave breaks. Over it, now and then: sandpipers' peeps, a tern's call, and the
 * slap of a fish coming down. All of it rises as you near the corner (beach-corner.js)
 * and is fullest when you are sitting in one of its chairs.
 */
let shore=null;
function startShore(){
 const len=ctx.sampleRate*4,buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);
 let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.2;}
 const sea=ctx.createBufferSource();sea.buffer=buffer;sea.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;
 const swell=ctx.createGain();swell.gain.value=0;const out=ctx.createGain();out.gain.value=0;
 sea.connect(filter).connect(swell).connect(out).connect(master);sea.start();
 return {sea,filter,swell,out,level:0,nextBird:ctx.currentTime+2,nextSplash:ctx.currentTime+9};
}
function shoreNote(at,from,to,length,level,type='sine'){
 const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;
 osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+length);
 env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(level,at+.012);env.gain.exponentialRampToValueAtTime(.0001,at+length);
 osc.connect(env).connect(shore.out);osc.start(at);osc.stop(at+length+.02);
}
function shoreSplash(at){
 const len=Math.floor(ctx.sampleRate*.25),b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(len*.18));
 const src=ctx.createBufferSource(),band=ctx.createBiquadFilter(),env=ctx.createGain();src.buffer=b;band.type='bandpass';band.frequency.value=1400;band.Q.value=.8;env.gain.value=.35;
 src.connect(band).connect(env).connect(shore.out);src.start(at);
 for(let k=0;k<3;k++)shoreNote(at+.12+k*.07+Math.random()*.05,1800+Math.random()*900,1100,.06,.05);
}
function updateShore(player,{inside,paused,relax}){
 const d=Math.hypot(player.x-BEACH_CORNER.x,player.z-BEACH_CORNER.z),near=Math.max(0,1-d/BEACH_CORNER.radius);
 const level=paused||inside?0:relax?.85:near*near*.6;
 if(!shore){if(level<=0)return;shore=startShore();}
 const t=ctx.currentTime;shore.out.gain.setTargetAtTime(level,t,.4);if(level<=0)return;
 // The swell: build for six seconds, break, then slide back.
 const phase=(t%9)/9,build=phase<.66?phase/.66:1-(phase-.66)/.34;
 shore.swell.gain.setTargetAtTime(.25+build*build*.75,t,.25);shore.filter.frequency.setTargetAtTime(380+(phase>.6&&phase<.75?1400:build*500),t,.2);
 if(t>shore.nextBird){
  if(Math.random()<.6){for(let k=0;k<2+Math.floor(Math.random()*3);k++)shoreNote(t+k*.13,3600+Math.random()*500,3000,.08,.07);}
  else shoreNote(t,1500,900,.42,.05,'sawtooth');
  shore.nextBird=t+3+Math.random()*7;
 }
 if(t>shore.nextSplash){shoreSplash(t);shore.nextSplash=t+12+Math.random()*16;}
}
/**
 * The living soundscape (soundscape.js decides the levels; this plays them). Two cicada
 * species are the one recording at two pitches -- the big kumazemi slower and deeper in the
 * morning, the aburazemi quicker in the afternoon -- and the other layers use noise or synthesis: the rain, sparse low croaks, irregular night-insect rustles, the morning birds, the higurashi's falling evening call and the harbour
 * gulls. Each layer has its own gain and moves with a slow time constant, so the morning
 * fades into the afternoon rather than switching.
 */
let scape=null;
const LOOPED=Object.freeze({kumazemi:['cicadas',.82,.3],aburazemi:['cicadas',1.14,.24]});
const SYNTH_LEVEL=Object.freeze({frogs:.1,crickets:.08,birds:.1,higurashi:.09,gulls:.1,rain:.3});
function startScape(){
 const bus={};for(const name of Object.keys(SYNTH_LEVEL)){bus[name]=ctx.createGain();bus[name].gain.value=0;bus[name].connect(master);}
 // Rain: white noise, hiss on top and a soft roar under it.
 const len=ctx.sampleRate*3,buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
 const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;
 const hiss=ctx.createBiquadFilter();hiss.type='highpass';hiss.frequency.value=900;const roar=ctx.createBiquadFilter();roar.type='lowpass';roar.frequency.value=380;
 const roarGain=ctx.createGain();roarGain.gain.value=1.6;
 rain.connect(hiss).connect(bus.rain);rain.connect(roar).connect(roarGain).connect(bus.rain);rain.start();
 const t=ctx.currentTime;
 return {bus,loops:{},next:{frogs:t+5,crickets:t+4,birds:t,higurashi:t+2,gulls:t+4},level:{},whistleFree:0};
}
function note(out,at,from,to,length,level,type='sine'){
 const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;
 osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),at+length);
 env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(level,at+Math.min(.015,length/3));env.gain.exponentialRampToValueAtTime(.0001,at+length);
 osc.connect(env).connect(out);osc.start(at);osc.stop(at+length+.02);
}
const CALLS={
 // Filtered, irregular air and insect rustles, never a pure electronic tone.
 frogs(out,t){return naturalNightCall(ctx,out,t,'frogs');},
 crickets(out,t){return naturalNightCall(ctx,out,t);},
 // A bulbul's three notes, or a white-eye's thin trill.
 birds(out,t){if(Math.random()<.6){for(let k=0;k<3;k++){const f=1700+Math.random()*1500;note(out,t+k*.17,f,f*(.8+Math.random()*.5),.14,.45);}}else for(let k=0;k<6;k++)note(out,t+k*.05,4200+Math.random()*500,3900,.04,.3);return .7+Math.random()*2.6;},
 // Kana-kana-kana: a falling, slowing run.
 higurashi(out,t){const n=10+Math.floor(Math.random()*5);for(let k=0;k<n;k++){const f=4300-k*45,gap=.07+k*.006;note(out,t+k*gap,f,f*.9,.05,.5*(1-k/(n+2)));}return 4+Math.random()*6;},
 // A herring gull's call over the water.
 gulls(out,t){for(let k=0;k<1+Math.floor(Math.random()*3);k++)note(out,t+k*.42,1250+Math.random()*200,640,.34,.35,'sawtooth');return 5+Math.random()*10;},
};
/**
 * The Minato Maru's whistle: an air whistle of about 350 Hz, the pitch the collision rules give a
 * ship of 20 to 75 metres (COLREGs Annex III: 250–700 Hz), not a liner's 110 Hz. A prolonged blast
 * is five seconds (leaving the berth, passing the breakwater's end); 'astern' is three short blasts of
 * a second each (Rule 34(a): my engines are going astern). `at` is when it starts (AudioContext time).
 */
const WHISTLE=Object.freeze({hz:350,prolonged:5,short:1,gap:1});
function shipWhistle(kind,distance,pan,at){
 const level=.3*Math.max(.12,1-distance/320),t=Math.max(ctx.currentTime+.05,at||0);
 const out=ctx.createGain();out.gain.value=level;const band=ctx.createBiquadFilter();band.type='lowpass';band.frequency.value=2600;
 const panner=ctx.createStereoPanner();panner.pan.value=pan;out.connect(band).connect(panner).connect(master);
 const blasts=kind==='astern'?[0,1,2].map(i=>[i*(WHISTLE.short+WHISTLE.gap),WHISTLE.short]):[[0,WHISTLE.prolonged]];
 for(const [start,length] of blasts){const a=t+start;
  // Two reeds a few hertz apart, as an air whistle sounds: a slow beat under the note.
  for(const [f,g] of [[WHISTLE.hz,.5],[WHISTLE.hz*1.008,.32],[WHISTLE.hz*2,.12]]){const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sawtooth';osc.frequency.value=f;
   env.gain.setValueAtTime(0,a);env.gain.linearRampToValueAtTime(g,a+.12);env.gain.setValueAtTime(g,a+length-.18);env.gain.linearRampToValueAtTime(0,a+length);osc.connect(env).connect(out);osc.start(a);osc.stop(a+length+.05);}
 }
 const last=blasts.at(-1);return t+last[0]+last[1];
}
/** Her engines, by what she is doing (ferry.js audio): the loop's level and how fast it runs. */
const ENGINE=Object.freeze({off:[0,.85],generators:[.06,.78],idle:[.12,.82],manoeuvring:[.2,.95],sea:[.27,1.12],emergency:[.08,.8]});
function updateScape(player,{minutes,rain,inside,paused,ferry}){
 // Gulls want the water: the harbour is to the south of the town, past z = -35.
 const harbour=Math.max(0,Math.min(1,(-player.z-25)/25));
 const mix=paused?Object.fromEntries(Object.keys(SYNTH_LEVEL).concat(Object.keys(LOOPED)).map(k=>[k,0])):ambience({minutes,rain,inside,harbour});
 if(!scape){if(!Object.values(mix).some(v=>v>.01))return;scape=startScape();}
 const t=ctx.currentTime;
 for(const [layer,[file,rate,base]] of Object.entries(LOOPED)){
  const level=(mix[layer]||0)*base;
  if(!scape.loops[layer]&&level>.005){
   if(!buffers.has(file)){void loadSound(file);continue;}
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers.get(file);source.loop=true;source.playbackRate.value=rate;gain.gain.value=0;
   source.connect(gain).connect(master);source.start(0,Math.random()*source.buffer.duration);scape.loops[layer]={source,gain};
  }
  scape.loops[layer]?.gain.gain.setTargetAtTime(level,t,4);
 }
 for(const [layer,base] of Object.entries(SYNTH_LEVEL)){
  const level=(mix[layer]||0)*base;scape.level[layer]=level;
  scape.bus[layer].gain.setTargetAtTime(level,t,layer==='rain'?2:4);
  if(CALLS[layer]&&level>.004&&t>=scape.next[layer])scape.next[layer]=t+CALLS[layer](scape.bus[layer],t+.02);
 }
 // Her whistle: every signal she sounds, in order, from where she was when she sounded it. The
 // first time the town hears her it only takes note of the count, so loading a game is quiet.
 if(ferry?.whistle&&!paused){
  const w=ferry.whistle;if(scape.whistleCount===undefined||w.count<scape.whistleCount)scape.whistleCount=w.count;
  while(scape.whistleCount<w.count){
   scape.whistleCount++;const signal=w.log?.find(e=>e.n===scape.whistleCount)||w;
   const dx=signal.x-player.x,dz=signal.z-player.z,d=Math.hypot(dx,dz);
   scape.whistleFree=shipWhistle(signal.kind,d,Math.max(-.8,Math.min(.8,dx/Math.max(d,1)*.6)),scape.whistleFree)+.8;
  }
 }
}
export const townAudio={
  stopSpeech(){speechRequest++;if(speech){try{speech.source.stop();}catch{}speech=null;}},
  async speak(id){
    this.stopSpeech();if(!enabled||!ctx||!id||!/^[a-z0-9-]+$/.test(id))return;
    const request=speechRequest,key='voice/'+id;
    try{
      if(!buffers.has(key)){const response=await fetch(assetURL('audio/voices/'+id+'.wav'));if(!response.ok)return;buffers.set(key,await ctx.decodeAudioData(await response.arrayBuffer()));}
      if(request!==speechRequest||!enabled||document.hidden)return;
      speech=voice(key);if(speech)speech.gain.gain.value=.9;
    }catch{/* The written dialogue remains available if audio cannot load. */}
  },
  setEnabled(value){enabled=value;if(!value)this.stopSpeech();unlockTownAudio();if(master)master.gain.setTargetAtTime(value?.38:0,ctx.currentTime,.1);},
  play(name,volume=.5){if(!enabled||!ctx)return;if(!buffers.has(name)){void loadSound(name).then(ready=>{if(ready)this.play(name,volume);});return;}const v=voice(name);if(v)v.gain.gain.value=volume;},
  // There is no grass recording, so the lawn borrows the stone one at about half the
  // level rather than sounding like a pavement.
  step(surface){this.play('steps-'+(surface==='asphalt'?'asphalt':surface==='wood'||surface==='timber'?'wood':'stone'),surface==='grass'?.13:.27);},
  update({player,yaw=0,minutes=1002,rain=false,inside=false,station=0,paused=false,relax=false,ferry=null}){if(!ctx)return;if(enabled)updateShore(player,{inside,paused,relax});const night=minutes%1440>=1140||minutes%1440<360;
    void night;
    // The engine is hers: it is where she is, idling alongside, louder and quicker under way, and quiet at night on shore power.
    const [engineLevel,engineRate]=ENGINE[ferry?.engines]||ENGINE.off;
    const sources=[['water',0,-54,.5,95],['engine',ferry?.x??6,ferry?.z??-42,engineLevel,40],['radio-'+station,-4,-15,.36,22]];
    loops.get('engine')?.source.playbackRate.setTargetAtTime(engineRate,ctx.currentTime,1.5);
    if(enabled)updateScape(player,{minutes,rain,inside,paused,ferry});
    for(const name of ['radio-0','radio-1','radio-2'])if(name!=='radio-'+station&&loops.has(name))loops.get(name).gain.gain.setTargetAtTime(0,ctx.currentTime,.12);
    for(const [name,x,z,volume,range] of sources){if(!loops.has(name)&&!paused&&volume>0&&Math.hypot(x-player.x,z-player.z)<range){const v=voice(name,true);if(v)loops.set(name,v);}const v=loops.get(name);if(!v)continue;const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz),gain=paused?0:volume*Math.max(0,1-d/range)*(inside?.24:1);v.gain.gain.setTargetAtTime(gain,ctx.currentTime,.2);v.pan.pan.setTargetAtTime(Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(d,1))),ctx.currentTime,.2);}
    const train=Math.floor(minutes/8);if(train!==lastTrain){if(lastTrain>=0&&!paused)this.play('train',.16);lastTrain=train;}
  },
  /**
   * A tune on struck bells, synthesised: each note a few inharmonic partials with a hard
   * strike and a long decay, the way a school's chime sounds through a horn speaker.
   * @param {Array<[number,number]>} notes [frequency Hz, start seconds]
   */
  bells(notes,volume=.5){
    if(!enabled||!ctx||ctx.state!=='running')return;
    const out=ctx.createGain();out.gain.value=volume*.55;
    // A horn speaker has no bass and not much top.
    const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=1100;band.Q.value=.55;
    out.connect(band).connect(master);
    const t0=ctx.currentTime+.05;
    for(const [f,at] of notes)for(const [ratio,level,decay] of [[1,1,2.6],[2.76,.32,1.1],[5.4,.12,.5],[.5,.18,3.2]]){
      const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.value=f*ratio;
      env.gain.setValueAtTime(0,t0+at);env.gain.linearRampToValueAtTime(level,t0+at+.008);env.gain.exponentialRampToValueAtTime(.0005,t0+at+decay);
      osc.connect(env).connect(out);osc.start(t0+at);osc.stop(t0+at+decay+.05);
    }
  },
  /** A dialogue voice blip: one short soft note (dialogue-box.js picks it per speaker). */
  blip(freq,type='sine',volume=.06,{vibrato=0}={}){
    if(!enabled||!ctx||ctx.state!=='running')return;
    const t=ctx.currentTime,osc=ctx.createOscillator(),env=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,t);
    if(vibrato>0){const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=5;depth.gain.value=freq*.015*Math.min(1,vibrato);lfo.connect(depth).connect(osc.frequency);lfo.start(t);lfo.stop(t+.07);lfo.onended=()=>{lfo.disconnect();depth.disconnect();};}
    env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(volume,t+.006);env.gain.exponentialRampToValueAtTime(.0001,t+.06);
    osc.connect(env).connect(master);osc.start(t);osc.stop(t+.07);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  },
  get enabled(){return enabled;}
};

if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(ctx){if(document.hidden){townAudio.stopSpeech();ctx.suspend().catch(()=>{});}else if(enabled)ctx.resume().catch(()=>{});}});
