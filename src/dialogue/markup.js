/**
 * Inline cues for a spoken line: timing, faces, emphasis and fill-ins written into the
 * text itself, so a writer directs the delivery where the words are.
 *
 * Learned from how the Animal Crossing games store dialogue (docs/ANIMAL-CROSSING-STUDY.md):
 * a typical line carries about three timed pauses, two expression changes and one name or
 * word substitution, all embedded in the string. A line without them reads flat however
 * good the words are. The syntax here is the town's own.
 *
 *   {p} {p:3}          a pause of one (or three) beats; `|` still means one beat
 *   {face:laugh}       the speaker's face from here on (a mood the town maps to a face)
 *   {big}…{/big}       said louder: the box can shake or enlarge this span
 *   {name}             the player's name (`&` still works)
 *   {me}               the speaker's name
 *   {catch}            the speaker's catchphrase, if they have one
 *   {town}             Minato Machi
 *   {pool:food}        one word from a pool, picked by the seed: the same line on the
 *                      same day always picks the same word
 *   {any:a/b/c}        one of a few inline choices, picked the same way
 *
 * Pure: no DOM and no timers. The result's `pauses` has the shape dialogue-engine.js
 * already gives the box, so a marked-up line drops into the existing typewriter.
 */

export const TOWN_NAME='Minato Machi';

/**
 * Word pools for {pool:…}. Every word belongs to the town in October 1997: things you
 * can buy at Sakura or Minato, eat at Sato Ramen, or see from the quay.
 */
export const POOLS=Object.freeze({
 food:Object.freeze(['goya champuru','a plum rice ball','Sato’s shio ramen','sata andagi','a steamed pork bun','grilled sea bream','taco rice','soki soba']),
 drink:Object.freeze(['canned coffee','green tea','a ramune','Umineko lager','jasmine tea','cold barley tea','Asamori milk']),
 sweet:Object.freeze(['brown-sugar candy','a Blue Coral ice cream','sata andagi','beni-imo tart','a melon bun']),
 weather:Object.freeze(['the trade wind','the rainy season','a typhoon warning','sea mist','a red sunset']),
 place:Object.freeze(['the quay','Sakura Shōten','the ferry pier','Rainflower Lane','Umi-no-yu','Minato izakaya','Front-Row Books']),
 thing:Object.freeze(['a stapler','a paper fan','a sanshin string','a fishing float','a cassette tape','a bus ticket','an umbrella']),
});

const clampSeed=s=>Number.isFinite(s)?s>>>0:0;
/** The same small hash the town uses for stable picks (a string to a 32-bit seed). */
export function seedOf(...parts){
 let h=2166136261>>>0;
 for(const c of parts.join('|')){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0;}
 return h;
}
const pickWith=(list,seed,salt)=>list.length?list[seedOf(seed,salt)%list.length]:'';

const TAG=/\{(\/?)([a-z]+)(?::([^}]*))?\}/g;

/**
 * Turns a marked-up line into what the box shows.
 * Returns {text, pauses:{index:beats}, faces:[{at,face}], spans:[{from,to,style}], unknown:[tag]}.
 */
export function renderLine(source,{name='',speaker='',catchphrase='',seed=0,pools=POOLS}={}){
 const pauses={},faces=[],spans=[],unknown=[],open=[];
 let text='',i=0,picks=0;
 const s=String(source??'');
 const addPause=n=>{pauses[text.length]=(pauses[text.length]||0)+n;};
 // `|` and `&` are the engine's own marks; keep them working inside marked-up lines.
 // A beat written between two spaces ("It takes ||| longer") must not leave two spaces behind.
 let afterBeat=false;
 const plain=chunk=>{for(const ch of chunk){
  if(ch==='|'){addPause(1);afterBeat=true;continue;}
  if(ch===' '&&afterBeat&&text.endsWith(' '))continue;
  afterBeat=false;text+=ch==='&'?name:ch;
 }};
 for(const m of s.matchAll(TAG)){
  plain(s.slice(i,m.index));i=m.index+m[0].length;
  const [,close,tag,arg]=m;
  if(tag==='p'){const n=arg==null?1:Math.max(1,Math.min(9,Math.trunc(Number(arg))||1));addPause(n);afterBeat=true;}
  else if(tag==='face'&&arg)faces.push({at:text.length,face:arg});
  else if(tag==='big'&&!close)open.push(text.length);
  else if(tag==='big'&&close&&open.length)spans.push({from:open.pop(),to:text.length,style:'big'});
  else if(tag==='name')text+=name;
  else if(tag==='me')text+=speaker;
  else if(tag==='catch')text+=catchphrase;
  else if(tag==='town')text+=TOWN_NAME;
  else if(tag==='pool'&&pools[arg])text+=pickWith(pools[arg],clampSeed(seed),arg+picks++);
  else if(tag==='any'&&arg)text+=pickWith(arg.split('/'),clampSeed(seed),'any'+picks++);
  else unknown.push(m[0]);
 }
 plain(s.slice(i));
 // An unclosed {big} runs to the end of the line rather than being lost.
 while(open.length)spans.push({from:open.pop(),to:text.length,style:'big'});
 return {text,pauses,faces,spans,unknown};
}

/** The face showing at a given character, for a box that changes face as it types. */
export function faceAt(faces,index,fallback=null){
 let face=fallback;for(const f of faces)if(f.at<=index)face=f.face;return face;
}

/**
 * The house rules for a written line, as warnings (an empty list means it passes).
 * The numbers come from the study: a line is about a hundred characters, rarely over
 * two hundred, and it breathes (a long line with no pause reads as a wall).
 */
export function lintLine(source,options={}){
 const out=[],r=renderLine(source,options);
 if(r.unknown.length)out.push('unknown cue '+r.unknown.join(' '));
 if(r.text.length>220)out.push(`long line (${r.text.length} characters; keep under 220)`);
 const beats=Object.values(r.pauses).reduce((a,b)=>a+b,0);
 if(r.text.length>120&&!beats)out.push('a long line with no pause');
 if(/\{|\}/.test(r.text))out.push('a stray brace');
 return out;
}
