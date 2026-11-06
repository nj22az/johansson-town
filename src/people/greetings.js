/**
 * The first thing a resident says when Johansson walks up: chosen for the moment.
 *
 * Learned from the Animal Crossing games (docs/ANIMAL-CROSSING-STUDY.md): every
 * personality has its own greeting for each situation (the first meeting, not having
 * seen you for a week or a month, rain, snow, being indoors, a bad mood, their
 * birthday), and the most specific situation that is true wins. A greeting that notices
 * the moment ("you're soaked!", "where have you been?") makes a resident feel alive
 * before the conversation has started, and it costs one line.
 *
 * The situations here are the town's: Okinawa has typhoons, not snow. There is no "first
 * meeting": Johansson has lived here since 1979 and everybody knows him. The birthday
 * line is only used when a resident has a real birthday (pass `theirBirthday` for those). The lines are
 * written for the four temperaments (people/chat-lines.js) and use the cues of
 * dialogue/markup.js, so each one has its own timing and face.
 *
 * Pure: the caller says what is true now; this says which line, and why.
 */
import {renderLine,seedOf} from '../dialogue/markup.js';

const G=(sunny,dramatic,easy,dry)=>Object.freeze({sunny:Object.freeze(sunny),dramatic:Object.freeze(dramatic),easy:Object.freeze(easy),dry:Object.freeze(dry)});

/**
 * Most specific first. `when` reads the situation; the first true one is used.
 * Every situation has two lines per temperament, picked by the day so a resident does
 * not repeat themselves on consecutive days.
 */
export const SITUATIONS=Object.freeze([
 {id:'birthday',why:'It is the resident’s own birthday.',when:s=>s.theirBirthday,
  lines:G(['{face:happy}It’s my birthday!{p} You remembered!{p:2} Did you? You did, right?','{face:happy}Guess who’s a year older today!{p} Me! It’s me!'],
   ['{face:smug}Today,{p} {name},{p} I was born.{p:2} The sea was calm that day, they say.','{face:smug}My birthday.{p:2} Another year braved.'],
   ['{face:smile}Oh,{p} it’s my birthday.{p} Nearly forgot myself.','{face:smile}Birthday today.{p} Taking it easy.{p} More than usual.'],
   ['{face:neutral}It is my birthday.{p} I am telling you so it is on record.','{face:neutral}Another birthday.{p} The count is correct,{p} I checked.'])},
 {id:'hisBirthday',why:'It is Johansson’s birthday (30 January).',when:s=>s.hisBirthday,
  lines:G(['{face:happy}Happy birthday,{p} {name}!{p} The whole island knows.{p} I may have told them.','{face:happy}It’s your birthday!{p} Happy birthday!{p:2} Do you feel older?{p} You look the same!'],
   ['{face:smug}Happy birthday,{p} {name}.{p:2} Another year of keeping this island in order.','{face:smile}Your birthday,{p} {name}.{p} The sea is calm in your honour.{p} Mostly.'],
   ['{face:smile}Hey,{p} happy birthday.{p} Take it easy today,{p} OK?','{face:smile}Birthday,{p} huh?{p} Happy birthday,{p} {name}.'],
   ['{face:neutral}Happy birthday,{p} {name}.{p} I have it written down.','{face:neutral}Many happy returns of the day,{p} {name}.{p} Do not work too hard.'])},
 {id:'away30',why:'Johansson has not played for thirty days or more (by the real calendar).',when:s=>s.daysAway>=30,
  lines:G(['{face:surprised}{big}{name}!{/big}{p} A whole month!{p} I thought you’d moved away!','{face:surprised}You’re back!{p} You’re really back!{p:2} Don’t do that again!'],
   ['{face:sad}A month,{p} {name}.{p:2} A whole month.{p} The tide came in and out sixty times.','{face:sad}I had given you up for lost at sea.{p:2} And yet,{p} here you are.'],
   ['{face:surprised}Whoa,{p} long time.{p} Thought you’d gone for good.','{face:smile}Hey,{p} stranger.{p} A month,{p} huh?{p} Welcome back.'],
   ['{face:neutral}Thirty-one days.{p} Not that I counted.{p:2} I counted.','{face:neutral}You have been away a month.{p} The town has managed.{p} Barely.'])},
 {id:'away7',why:'Johansson has not played for a week or more.',when:s=>s.daysAway>=7,
  lines:G(['{face:happy}There you are!{p} I missed you this week!','{face:happy}Hey!{p} Where’ve you been?{p} Tell me everything!'],
   ['{face:sad}A week without a word,{p} {name}.{p} I wrote a poem about it.','{face:surprised}You live!{p:2} I had my doubts.'],
   ['{face:smile}Hey,{p} haven’t seen you all week.{p} You good?','{face:smile}Oh,{p} you’re around again.{p} Nice.'],
   ['{face:neutral}You were away a week.{p} Was it a good week?','{face:neutral}Seven days.{p} Welcome back.'])},
 {id:'typhoon',why:'A typhoon warning is up.',when:s=>s.weather==='typhoon',
  lines:G(['{face:surprised}You’re out in this?!{p} Get inside,{p} silly!','{face:surprised}The wind nearly took my hat!{p} And me!'],
   ['{face:surprised}The sea is angry today,{p} {name}.{p:2} Do not go near it.','{face:surprised}Hear that?{p} That is the sky shouting.'],
   ['{face:neutral}Storm’s coming.{p} I’m heading in.{p} You should too.','{face:neutral}Windy,{p} huh.{p} Good day for staying in.'],
   ['{face:neutral}Typhoon warning.{p} You should not be out.{p} Neither should I.','{face:neutral}A typhoon warning.{p} I have filled the bath and found the torch.{p} Have you?'])},
 {id:'rain',why:'It is raining.',when:s=>s.weather==='rain',
  lines:G(['{face:happy}Rain!{p} I love how the street smells!','{face:smile}Look at the puddles!{p} Don’t jump in them.{p} Or do!'],
   ['{face:sad}Rain again.{p:2} The sky is crying for someone.','{face:sad}My washing.{p:2} My poor washing.'],
   ['{face:smile}Rainy day.{p} Good for a nap.','{face:smile}Rain’s nice,{p} right?{p} Makes everything slow down.'],
   ['{face:neutral}It is raining.{p} You have no umbrella.{p} I note this.','{face:neutral}Rain.{p} Expected.{p} I brought an umbrella.'])},
 {id:'late',why:'It is after ten at night.',when:s=>s.hour>=22||s.hour<5,
  lines:G(['{face:surprised}You’re up late too?{p} Night walks are the best!','{face:smile}Shh!{p} Everyone’s asleep!{p} Isn’t it exciting?'],
   ['{face:neutral}The night has a secret,{p} {name}.{p:2} I have not found it yet.','{face:neutral}Only cats and poets are out at this hour.{p} Which are you?'],
   ['{face:drowsy}Mm.{p} Late,{p} huh.{p} Can’t sleep either?','{face:drowsy}Yawn.{p:2} Oh,{p} hey.'],
   ['{face:neutral}It is late.{p} You should be asleep.{p} So should I.','{face:neutral}Good evening.{p} Technically,{p} good morning.'])},
 {id:'morning',why:'It is early morning, before eight.',when:s=>s.hour>=5&&s.hour<8,
  lines:G(['{face:happy}Morning!{p} You’re up early too!','{face:happy}Good morning,{p} {name}!{p} What a day!'],
   ['{face:smug}Dawn,{p} {name}.{p} The best hour.{p} The sea is still deciding.','{face:smile}You rise with the sun.{p} I respect that.'],
   ['{face:drowsy}Morning.{p} Too early.{p} Way too early.','{face:drowsy}Mm.{p} Coffee first.{p} Then talking.'],
   ['{face:neutral}Good morning.{p} You are early.{p} Good.','{face:neutral}Morning.{p} The bus is due in four minutes.'])},
 {id:'usual',why:'Nothing in particular: an ordinary hello.',when:()=>true,
  lines:G(['{face:happy}Hi,{p} {name}!{p} {catch}','{face:smile}Oh,{p} {name}!{p} Good to see you!'],
   ['{face:smug}{name}.{p} You find me in the middle of something important.','{face:smile}Ah,{p} {name}.{p} I was just thinking about you.{p} Sort of.'],
   ['{face:smile}Hey,{p} {name}.','{face:smile}Oh,{p} hi.{p} What’s up?'],
   ['{face:neutral}Good day,{p} {name}.','{face:neutral}{name}.{p} Hello.'])},
]);

/** Whole days between two real timestamps (a negative or missing time is zero days). */
export function daysBetween(then,now=Date.now()){
 return Number.isFinite(then)&&then>0&&Number.isFinite(now)?Math.max(0,Math.floor((now-then)/86400000)):0;
}

/**
 * The greeting for this moment. `situation` is
 * {theirBirthday, hisBirthday, daysAway, weather:'sunny'|'cloudy'|'rain'|'typhoon', hour}.
 * Returns {id, why, source, ...rendered line} (see markup.js renderLine).
 */
export function greetingFor({speaker,temper='easy',situation={},playerName='Johansson',catchphrase='',day=0}){
 const s={daysAway:0,hour:12,...situation};
 const found=SITUATIONS.find(x=>x.when(s));
 const lines=found.lines[temper]||found.lines.easy;
 const source=lines[seedOf(speaker,found.id,day)%lines.length];
 // An empty catchphrase must not leave "Hi, Johansson! " with a dangling space.
 const rendered=renderLine(source,{name:playerName,speaker,catchphrase,seed:seedOf(speaker,day)});
 return {id:found.id,why:found.why,source,...rendered,text:rendered.text.trim()};
}

/** The longest line a resident says on the web edition (edition.js `conversations` off). */
export const SHORT_GREETING=35;
/**
 * One short line for the web edition (the owner, 19 October 2026: "simple behaviour for the NPCs on web … and not too
 * much dialogue"): the first sentence of the greeting this moment would get, when it fits in SHORT_GREETING
 * characters, or a plain greeting for the hour. Pure, like greetingFor.
 */
export function shortGreeting(options={}){
 const full=greetingFor(options),first=full.text.split('\n')[0].match(/^.*?[.!?…](?=\s|$)/)?.[0]?.trim()||full.text.split('\n')[0].trim();
 if(first&&first.length<=SHORT_GREETING)return {id:full.id,text:first,face:full.faces?.[0]?.face||null};
 const h=options.situation?.hour??12,part=h<11?'Good morning':h<17?'Good afternoon':'Good evening',name=options.playerName||'Johansson';
 const text=(part+', '+name+'.').length<=SHORT_GREETING?part+', '+name+'.':part+'!';
 return {id:full.id,text,face:null};
}
