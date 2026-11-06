import {SONGS,STYLES,VOICES,PERFORMANCES,SONG_PRICE,cleanSong,cleanConcert,scoreFor,cueAt} from './songs.js';
import {createConcertAudio} from './audio.js';
import {createConcertStage} from './stage.js';
import {CONCERT_CSS} from './styles.js';
import {createLiveLyrics} from './live-lyrics.js';

/** The physical Minato machine opens this set. World keeps its renderer and resumes at the same place on exit. */
export function createConcert({renderer,getCast,getDraft,saveDraft,pay,onFinish=()=>{},soundEnabled=()=>true,onOpen=()=>{},onClose=()=>{}}){
 const ui=document.createElement('section');ui.id='concert';ui.hidden=true;ui.setAttribute('role','dialog');ui.setAttribute('aria-modal','true');ui.setAttribute('aria-labelledby','concertTitle');
 const style=document.createElement('style');style.textContent=CONCERT_CSS;document.head.append(style);
 ui.innerHTML=`<header><div><h2 id="concertTitle">Minato karaoke</h2><p>One microphone. The whole town.</p></div><button type="button" data-close>Return to Minato</button></header>
 <div class="concert-main"><div class="concert-view"><div class="concert-screen"><span class="concert-badge">LASERDISC KARAOKE · 1997</span><span class="concert-count" aria-hidden="true"></span></div><div class="concert-lyrics"><p class="concert-line">Your evening at Minato</p><p class="concert-next">Choose your song and take the stage.</p><div class="concert-progress" role="progressbar" aria-label="Song progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div></div>
 <form class="concert-tools"><h3>Tonight’s performance</h3><p class="concert-copy">Choose a song and the people who will sing it. Groups trade verses and sing the last line together.</p><label>Song<select name="song" aria-label="Song"></select></label><label>Arrangement<select name="style" aria-label="Arrangement"></select></label><label>Character voice<select name="voice" aria-label="Character voice"></select></label><label>Stage energy<select name="performance" aria-label="Stage energy"></select></label><label>Performers<select name="size" aria-label="Number of performers"><option value="1">Solo</option><option value="2">Duet</option><option value="3">Trio</option><option value="4">Quartet</option></select></label><fieldset><legend>On stage</legend></fieldset><details open><summary>Write your own song</summary><label>Title<input name="title" maxlength="48" autocomplete="off"></label><div data-lyrics></div><button type="button" data-test-voice>Test voice</button><button type="button" class="concert-reset" data-reset>Restore this song</button></details><p class="concert-note">Write four short lines, choose your music and press Perform. Your device speaks your words live while the cast dances. Go wild adds silly routines. This is rhythmic text-to-speech; available voices vary by device. Your song is saved with your town.</p></form></div>
 <footer><p class="concert-status" role="status" aria-live="polite">Choose your song.</p><button type="button" data-mute aria-pressed="false">Sound on</button><button type="button" data-camera aria-pressed="false">Camera: auto</button><button type="button" data-cheer hidden>Cheer!</button><button type="button" data-edit hidden>Back to songs</button><button type="button" class="concert-primary" data-play>Perform · ¥100</button></footer>`;
 document.body.append(ui);
 const $=q=>ui.querySelector(q),field=n=>$(`[name="${n}"]`),screen=$('.concert-screen'),line=$('.concert-line'),next=$('.concert-next'),status=$('.concert-status'),button=$('[data-play]'),canvas=renderer.domElement;
 const liveLyrics=createLiveLyrics(),audio=createConcertAudio({liveLyrics}),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
 let stage=null,opened=false,busy=false,playing=false,finished=false,paid=false,muted=false,view='auto',score=null,roster=[],draft=null,home=null,focusBefore=null,request=0,lastCue='',startTime=0,lastProgress=-1,silentClock=false,cheerUntil=0,lastCheer=-Infinity;
 let currentKey='';
 for(const song of SONGS)field('song').add(new Option(song.title,song.id));
 for(const [id,s] of Object.entries(STYLES))field('style').add(new Option(s.label,id));
 for(const [id,label] of Object.entries(VOICES))field('voice').add(new Option(label,id));
 for(const [id,label] of Object.entries(PERFORMANCES))field('performance').add(new Option(label,id));
 for(let i=0;i<4;i++){
  const label=document.createElement('label');label.textContent=i?'Singer '+(i+1):'Lead singer';
  const select=document.createElement('select');select.name='cast'+i;select.setAttribute('aria-label',label.textContent);label.append(select);$('fieldset').append(label);
  const lyric=document.createElement('label');lyric.textContent='Line '+(i+1);const input=document.createElement('input');input.name='line'+i;input.maxLength=64;input.autocomplete='off';lyric.append(input);$('[data-lyrics]').append(lyric);
 }
 const announce=text=>status.textContent=text;
 function persist(){const saved=saveDraft({song:cleanSong(draft.song),cast:[...draft.cast],completed:draft.completed});if(saved===false)announce('Saving is unavailable. Keep this page open to retain your song.');return saved;}
 function syncSong(){field('song').value=draft.song.id;field('style').value=draft.song.style;field('voice').value=draft.song.voice;field('performance').value=draft.song.performance;field('title').value=draft.song.title;draft.song.lines.forEach((l,i)=>field('line'+i).value=l);}
 function flushEdits(){draft.song=cleanSong({...draft.song,title:field('title').value,lines:Array.from({length:4},(_,i)=>field('line'+i).value)});}
 function castList(){
  const size=Math.min(Number(field('size').value),roster.length);
  draft.cast=draft.cast.filter(n=>roster.some(r=>r.name===n));
  for(const r of roster)if(draft.cast.length<size&&!draft.cast.includes(r.name))draft.cast.push(r.name);
  draft.cast.length=size;
  for(let i=0;i<4;i++){const select=field('cast'+i);select.parentElement.hidden=i>=size;select.replaceChildren(...roster.map(r=>new Option(r.name,r.name)));select.value=draft.cast[i]||roster[0].name;}
  const key=draft.cast.join('|');if(key!==currentKey){stage.cast(draft.cast.map(n=>roster.find(r=>r.name===n)));currentKey=key;}
 }
 function setup(){
  liveLyrics.stop();
  playing=false;finished=false;cheerUntil=0;lastCheer=-Infinity;$('[data-cheer]').hidden=true;audio.stop();ui.classList.remove('concert-show');button.textContent=paid?'Perform again':'Perform · ¥'+SONG_PRICE;button.disabled=false;$('[data-edit]').hidden=true;
  $('.concert-count').textContent='';$('.concert-badge').textContent='LASERDISC KARAOKE · 1997';line.textContent=draft.song.title;next.textContent=STYLES[draft.song.style].label+' · '+draft.cast.join(' & ');progress(0);
 }
 function progress(amount){const percent=Math.max(0,Math.min(100,Math.round(amount*100)));if(percent===lastProgress)return;lastProgress=percent;$('.concert-progress').setAttribute('aria-valuenow',String(percent));$('.concert-progress i').style.width=percent+'%';}
 function stop(message='Stopped. Choose a song when you are ready.'){
  request++;busy=false;setup();announce(message);button.focus();
 }
 function complete(){
  liveLyrics.stop();
  playing=false;finished=true;$('[data-cheer]').hidden=true;audio.stop();draft.completed++;persist();onFinish(draft.song.title,draft.cast);
  line.textContent='Thank you, Minato!';next.textContent=draft.cast.join(' · ');$('.concert-count').textContent='';$('.concert-badge').textContent='THE FINAL BOW';progress(1);
  button.textContent='Encore';$('[data-edit]').hidden=false;announce('The room applauds. Encore, or choose another song.');button.focus();
 }
 async function perform(){
  if(busy)return;if(playing){stop();return;}
  // Keep the cast and score immutable for this take. Editing happens between performances.
  flushEdits();syncSong();score=scoreFor(draft.song);persist();const token=++request;busy=true;button.disabled=true;announce('Finding the disc…');
  liveLyrics.arm(score,draft.cast.map(n=>roster.find(r=>r.name===n).recipe),{silent:muted});
  try{
   const audible=await audio.start(score,draft.cast.map(n=>roster.find(r=>r.name===n).recipe),{silent:muted});
   if(!opened||request!==token)return;
   if(!audible&&!muted){audio.stop();liveLyrics.stop();announce('Sound could not start. Try again, or switch sound off for a silent performance.');return;}
   if(!paid&&!pay(SONG_PRICE)){audio.stop();liveLyrics.stop();announce('A song costs ¥100. Your wallet has too few yen.');return;}
   paid=true;playing=true;finished=false;silentClock=!audible;startTime=performance.now()+100;lastCue='';
   ui.classList.add('concert-show');$('[data-edit]').hidden=true;$('[data-cheer]').hidden=false;cheerUntil=0;lastCheer=-Infinity;button.textContent='Stop';
   announce(audible?(liveLyrics.notice||'Four beats, then your words go live!'):'Audio is unavailable. The stage and lyrics will play silently.');
   button.focus();
  }catch(error){audio.stop();liveLyrics.stop();announce('The disc could not start. Please try again.');console.warn('Concert start failed',error);}
  finally{if(request===token){busy=false;button.disabled=false;}}
 }
 function cue(seconds){
  const c=cueAt(score,seconds),spoken=liveLyrics.cue;if(c.phase==='singing'&&spoken?.line===c.line&&spoken.word>=0)c.word=spoken.word;
  const key=[c.phase,c.line,c.word,c.count].join('|');
  if(key!==lastCue){lastCue=key;
   $('.concert-count').textContent=c.phase==='count-in'?String(c.count):'';
   if(c.phase==='count-in'){line.textContent=draft.song.title;next.textContent='Get ready · '+draft.cast.join(' & ');}
   if(c.phase==='singing'){
    line.replaceChildren(...draft.song.lines[c.line].split(/\s+/).map((text,i)=>{const span=document.createElement('span');span.textContent=text;span.className=i<c.word?'sung':i===c.word?'current':'';return span;}));
    next.textContent=c.line<3?'Next: '+draft.song.lines[c.line+1]:'Together · the final chorus';
    $('.concert-badge').textContent=c.line===3?'ALL TOGETHER':draft.cast[c.line%draft.cast.length]+' · VERSE '+(c.line+1);
   }
   if(c.phase==='bow'){line.textContent='Take a bow';next.textContent='Thank you for the music.';$('.concert-badge').textContent='MINATO · LIVE';}
  }
  progress(seconds/score.duration);return c;
 }
 function render(){
  if(!opened||!stage)return;
  if(document.hidden)return;
  if(playing&&!silentClock&&!audio.running){stop('Audio was interrupted. Press Perform again to restart.');}
  const rect=screen.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
  const size=renderer.getSize({set(x,y){this.x=x;this.y=y;return this;}});
  if(size.x!==width||size.y!==height)renderer.setSize(width,height,false);
  canvas.style.width=width+'px';canvas.style.height=height+'px';
  stage.camera.aspect=width/height;stage.camera.updateProjectionMatrix();
  // A portrait screen needs a wider lens so a quartet stays inside its frame.
  stage.camera.fov=width/height<.9?60:42;stage.camera.updateProjectionMatrix();
  const t=playing?(silentClock?Math.max(0,(performance.now()-startTime)/1000):audio.elapsed):finished?score.duration-score.beat*.05:0;
  if(playing)audio.update();const c=playing?cue(t):finished?{phase:'bow',line:-1,word:-1}:null;
  if(c?.phase==='finished'){complete();}
  if(playing&&liveLyrics.notice&&status.textContent!==liveLyrics.notice)announce(liveLyrics.notice);
  stage.frame(t,c,score,{view,reduced:!!reduced?.matches,cheering:playing&&t<cheerUntil,vocalCue:playing?liveLyrics.cue:null});
  renderer.setRenderTarget(null);renderer.render(stage.scene,stage.camera);
 }
 function open(){
  if(opened)return;draft=cleanConcert(getDraft());roster=getCast().filter(r=>r?.name&&r.recipe);
  if(!roster.length)return;focusBefore=document.activeElement;opened=true;paid=false;muted=!soundEnabled();currentKey='';
  stage=createConcertStage();home={parent:canvas.parentNode,next:canvas.nextSibling,style:canvas.style.cssText};
  try{onOpen();document.exitPointerLock?.();document.documentElement.classList.add('concert-open');ui.hidden=false;screen.prepend(canvas);canvas.style.cssText='position:absolute;inset:0;display:block';
   field('size').value=String(Math.max(1,Math.min(4,draft.cast.length)));syncSong();castList();score=scoreFor(draft.song);setup();syncMute();announce('¥100 for this session, including encores. Choose your song.');render();field('song').focus();
  }catch(error){close();throw error;}
 }
 function close(){
  if(!opened)return;request++;opened=false;playing=false;busy=false;audio.stop();liveLyrics.stop();flushEdits();persist();
  ui.hidden=true;document.documentElement.classList.remove('concert-open');
  if(home){home.parent.insertBefore(canvas,home.next?.parentNode===home.parent?home.next:null);canvas.style.cssText=home.style;home=null;}
  stage?.dispose();stage=null;onClose();if(focusBefore?.isConnected)focusBefore.focus();
 }
 function syncMute(){$('[data-mute]').textContent=muted?'Sound off':'Sound on';$('[data-mute]').setAttribute('aria-pressed',String(muted));audio.mute(muted);liveLyrics.mute(muted);}
 function cheer(){if(!playing)return;const t=silentClock?Math.max(0,(performance.now()-startTime)/1000):audio.elapsed;if(t-lastCheer<score.beat*2)return;lastCheer=t;cheerUntil=t+score.beat*4;audio.cheer();announce('Hey! The room joins in. H or Cheer! adds another response.');}
 $('[data-cheer]').onclick=cheer;
 $('[data-play]').onclick=perform;$('[data-close]').onclick=close;$('[data-edit]').onclick=()=>stop('Choose your next song. Encores are included.');
 $('[data-mute]').onclick=()=>{muted=!muted;syncMute();};
 $('[data-camera]').onclick=()=>{view=view==='auto'?'wide':'auto';$('[data-camera]').textContent='Camera: '+view;$('[data-camera]').setAttribute('aria-pressed',String(view==='wide'));};
 $('[data-test-voice]').onclick=async()=>{
  if(playing||busy)return;if(muted){announce('Switch sound on before testing your voice.');return;}flushEdits();persist();const token=++request;announce('Testing your device’s text voice…');
  const result=await liveLyrics.test(draft.song.lines[0],draft.song.voice,roster.find(r=>r.name===draft.cast[0])?.recipe);
  if(opened&&token===request)announce(result.spoken?'Voice ready. Your edited words will be spoken live.':liveLyrics.notice||'Voice test stopped.');
 };
 $('[data-reset]').onclick=()=>{draft.song=cleanSong(SONGS.find(s=>s.id===draft.song.id));syncSong();persist();setup();announce('The original title, words and arrangement are restored.');};
 $('form').onsubmit=e=>e.preventDefault();
 $('form').onchange=e=>{
  if(!opened||playing||busy)return;const name=e.target.name;
  if(name==='song'){draft.song=cleanSong(SONGS.find(s=>s.id===e.target.value));syncSong();}
  if(name==='style')draft.song.style=e.target.value;
  if(name==='voice')draft.song.voice=e.target.value;
  if(name==='performance')draft.song.performance=e.target.value;
  if(name==='size')castList();
  if(name.startsWith('cast')){const i=Number(name.slice(4)),old=draft.cast[i],duplicate=draft.cast.indexOf(e.target.value);draft.cast[i]=e.target.value;if(duplicate>=0&&duplicate!==i)draft.cast[duplicate]=old;castList();}
  if(name==='title')draft.song.title=e.target.value;
  if(name.startsWith('line'))draft.song.lines[Number(name.slice(4))]=e.target.value;
  score=scoreFor(draft.song);persist();setup();
 };
 const keydown=e=>{
  if(!opened)return;e.stopImmediatePropagation();
  if(playing&&e.code==='KeyH'){e.preventDefault();cheer();return;}
  if(e.key==='Escape'){e.preventDefault();close();}
  if(e.key==='Tab'){const all=[...ui.querySelectorAll('button,input,select,summary')].filter(o=>!o.disabled&&o.getClientRects().length),index=all.indexOf(document.activeElement);e.preventDefault();all[(index+(e.shiftKey?-1:1)+all.length)%all.length]?.focus();}
 };
 document.addEventListener('keydown',keydown,true);
 const hidden=()=>{if(opened&&document.hidden){flushEdits();persist();stop('Performance paused while you were away. Press Perform again to restart.');}};
 document.addEventListener('visibilitychange',hidden);const pagehide=()=>{if(opened)stop('Press Perform again to restart.');};window.addEventListener('pagehide',pagehide);
 return {open,close,render,get active(){return opened;},get panel(){return ui;},get playing(){return playing;},snapshot(){return {active:opened,playing,busy,finished,paid,song:score?.song,cast:draft?.cast,elapsed:playing?(silentClock?(performance.now()-startTime)/1000:audio.elapsed):0,phase:playing?cueAt(score,silentClock?(performance.now()-startTime)/1000:audio.elapsed).phase:finished?'finished':'setup',sound:!muted,vocalSource:liveLyrics.source,vocalNotice:liveLyrics.notice,vocalCue:liveLyrics.cue};},dispose(){close();liveLyrics.dispose();audio.dispose();ui.remove();style.remove();document.removeEventListener('keydown',keydown,true);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pagehide);}};
}
