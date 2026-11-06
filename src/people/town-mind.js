import {personalityOf} from '../avatars/personality.js';
import {TOPICS} from './chat-lines.js';

/**
 * The neighbours' small talk, written by the town's language model (thuan-mind.js) when
 * the player has it running. Otherwise they keep to their written lines (chat-lines.js).
 *
 * A 1B model on the player's own device takes a few seconds to write a conversation, so
 * nobody waits for one: the writer looks ahead at pairs of neighbours who are near each
 * other and writes for them in the background, one at a time, and a chat that starts
 * takes a written-ahead conversation for that pair if there is one.
 *
 * Each speaker is described by who they are: age, work, the one-line personality in
 * profiles.js, and their island type (personality.js), so a Typhoon and a Quiet
 * craftsman do not sound alike.
 */

const SYSTEM=[
 'You write short, funny, warm conversations between neighbours in a small harbour town in Okinawa, Japan, in October 1997.',
 'Each person speaks exactly in their own personality. Small everyday things: the cat, the ferry, fish, food, gossip, the weather, the radio.',
 'Gentle humour, a twist or a punchline at the end. Family-friendly. No narration, no actions, no asterisks, no emoji.',
 'Every line is spoken dialogue under 16 words.',
 'Answer only as JSON: {"lines":[{"who":"A","text":"..."},{"who":"B","text":"..."},{"who":"A","text":"..."},{"who":"B","text":"..."}]}',
].join(' ');

/** Who someone is, in one line for the prompt. */
export function describe(person){
 const p=person.profile||{},type=personalityOf(p),bits=[person.name];
 if(person.age)bits.push(String(person.age));
 if(person.role)bits.push(person.role);
 return `${bits.join(', ')}. ${person.personality?person.personality+'. ':''}${type.name}: ${type.line}`;
}

const clockText=minutes=>{const m=((minutes%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};

/** The messages for one conversation. */
export function chatPrompt(a,b,{minutes=720,rain=false,place='the street',topic=null}={}){
 const lines=[`A is ${describe(a)}`,`B is ${describe(b)}`,`They meet on ${place} at ${clockText(minutes)}${rain?', in the rain':''}.`];
 if(a.gossip)lines.push(`A has news: "${a.gossip}"`);
 if(topic)lines.push(`Something to talk about: ${topic}.`);
 lines.push('Write their conversation, 4 lines, A first.');
 return [{role:'system',content:SYSTEM},{role:'user',content:lines.join('\n')}];
}

const BANNED=/\b(ai|assistant|language model|as an|json|http|www\.|kill|sex|drunk driving|stupid|idiot|hate you)\b|[*#<>{}\[\]]|\p{Extended_Pictographic}/iu;

/**
 * Whatever the model wrote, made safe to put in a speech bubble, or null.
 * @returns {{speakers:number[],lines:string[]}|null} speakers: 0 for A, 1 for B
 */
export function parseChat(raw,aName='A',bName='B'){
 let data=raw;
 if(typeof raw==='string'){
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');if(start<0||end<=start)return null;
  try{data=JSON.parse(raw.slice(start,end+1));}catch{try{data=JSON.parse(raw.slice(start,end+1).replace(/,\s*([}\]])/g,'$1'));}catch{return null;}}
 }
 const list=Array.isArray(data?.lines)?data.lines:Array.isArray(data)?data:null;if(!list)return null;
 const speakers=[],lines=[];
 for(const item of list.slice(0,6)){
  const who=String(item?.who??item?.speaker??'').trim().toLowerCase();
  const speaker=who==='a'||who===aName.toLowerCase()?0:who==='b'||who===bName.toLowerCase()?1:speakers.length%2;
  let text=String(item?.text??item?.line??'').replace(/\s+/g,' ').trim().replace(/^["'“”]+|["'“”]+$/g,'');
  // Models like to write the name in front: "Masaru: Hello!"
  text=text.replace(new RegExp(`^(${aName}|${bName}|A|B)\\s*[:：-]\\s*`,'i'),'');
  if(!text||text.length>140||BANNED.test(text))return null;
  speakers.push(speaker);lines.push(text);
 }
 if(lines.length<2||!speakers.includes(0)||!speakers.includes(1))return null;
 return {speakers,lines};
}

/**
 * @param {object} options
 * @param {{ready:boolean,complete:(messages:object[],opts?:object)=>Promise<string|null>}} options.mind
 */
export function createNeighbourWriter({mind,random=Math.random,perPair=2}={}){
 const cache=new Map();let busy=false,written=0,failures=0;
 const key=(a,b)=>[a.name,b.name].sort().join('|');
 return {
  get ready(){return !!mind?.ready;},
  get busy(){return busy;},
  get written(){return written;},
  /** Write a conversation for this pair in the background, if there is room for one. */
  prepare(a,b,context={}){
   if(!mind?.ready||busy||failures>6)return false;
   const k=key(a,b),list=cache.get(k)||[];if(list.length>=perPair)return false;
   const topic=TOPICS[Math.floor(random()*TOPICS.length)];
   busy=true;
   mind.complete(chatPrompt(a,b,{...context,topic:random()<.5?topic.open.easy.replace(/\{b\}/g,b.name):null})).then(raw=>{
    const chat=raw&&parseChat(raw,a.name,b.name);
    if(chat){list.push({first:a.name,...chat});cache.set(k,list);written++;failures=0;}else failures++;
   }).catch(()=>{failures++;}).finally(()=>{busy=false;});
   return true;
  },
  /** A conversation written ahead for this pair, turned to put `a` first, or null. */
  take(a,b){
   const list=cache.get(key(a,b));const chat=list?.shift();if(!chat)return null;
   const swap=chat.first!==a.name;
   return {topic:'llm',lines:chat.lines,speakers:chat.speakers.map(s=>swap?1-s:s),generated:true};
  },
  has(a,b){return !!cache.get(key(a,b))?.length;},
 };
}
