// A sparse, breathy night texture. No pitched oscillators or repeating beep loop.
const noiseBuffers=new WeakMap();
export function naturalNightCall(ctx,out,at,kind='insects'){
 let buffer=noiseBuffers.get(ctx);
 if(!buffer){buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;noiseBuffers.set(ctx,buffer);}
 const frog=kind==='frogs',source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
 source.buffer=buffer;source.playbackRate.value=.8+Math.random()*.4;
 filter.type=frog?'lowpass':'bandpass';filter.frequency.value=frog?260+Math.random()*120:2100+Math.random()*900;filter.Q.value=.45;
 const length=frog?.22+Math.random()*.18:.3+Math.random()*.4;
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(frog?.35:.18,at+length*.3);gain.gain.linearRampToValueAtTime(0,at+length);
 source.connect(filter).connect(gain).connect(out);source.start(at,Math.random()*.15);source.stop(at+length+.02);
 source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 return frog?2+Math.random()*5:8+Math.random()*16;
}
