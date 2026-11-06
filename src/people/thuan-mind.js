/**
 * In-browser language model for Thuan, via WebLLM on WebGPU.
 *
 * Everything runs on the player's own device: a static host has no backend to call, and
 * a local HTTP endpoint would be blocked as mixed content from an HTTPS page. The cost
 * is the download. Llama-3.2-1B-Instruct-q4f16_1-MLC is roughly 672MB of weights, about
 * eighteen times the entire town, so nothing here starts until the player asks for it
 * and the scripted dialogue remains the default.
 *
 * @typedef {'neutral'|'smile'|'concern'|'surprise'|'happy'|'sad'|'angry'|'shy'} ThuanExpression
 * @typedef {'idle'|'wave'|'point'} ThuanGesture
 * @typedef {object} ThuanReply
 * @property {string} dialogue
 * @property {ThuanExpression} expression
 * @property {ThuanGesture} gesture
 */

export const MODEL_ID='Llama-3.2-1B-Instruct-q4f16_1-MLC';
export const MODEL_BYTES=672*1024*1024;
const WEB_LLM_URL='https://esm.run/@mlc-ai/web-llm';

const EXPRESSIONS=['neutral','smile','concern','surprise','happy','sad','angry','shy'];
const GESTURES=['idle','wave','point'];

/** Kept short: every token of this is paid for on a 1B model's context. */
export const SYSTEM_PROMPT=[
 'You are Thuan, who keeps Sakura Shoten, a small convenience store in a Japanese harbour town in 1997.',
 'You are Vietnamese, from Nam Phuoc. You are dry, practical and brief. You never gush.',
 'You keep the till and the plants. You name the plants. The stubborn one by the door is the assistant manager.',
 'Reply with ONE or TWO short sentences of spoken dialogue. Never narrate actions or use asterisks.',
 'Answer only as JSON: {"dialogue":string,"expression":"neutral"|"smile"|"happy"|"sad"|"angry"|"shy"|"concern"|"surprise","gesture":"idle"|"wave"|"point"}'
].join(' ');

/**
 * Is WebGPU actually usable here? The property can exist while no adapter is available,
 * which is common on older iOS and on machines with GPU acceleration disabled.
 * @returns {Promise<{ok:boolean,reason?:string}>}
 */
export async function detectWebGPU(navigatorRef=globalThis.navigator){
 if(!navigatorRef?.gpu)return {ok:false,reason:'This browser has no WebGPU. Thuan will use her written lines.'};
 try{
  const adapter=await navigatorRef.gpu.requestAdapter();
  if(!adapter)return {ok:false,reason:'WebGPU is present but no graphics adapter answered.'};
  return {ok:true};
 }catch(error){
  return {ok:false,reason:'WebGPU could not start: '+(error?.message||error)};
 }
}

/**
 * Coerces whatever the model returned into the documented shape. A 1B model will
 * occasionally wrap JSON in prose, emit a trailing comma, or invent an expression;
 * none of that should reach the face controller.
 * @param {string|object} raw
 * @returns {ThuanReply|null}
 */
export function parseReply(raw){
 let data=raw;
 if(typeof raw==='string'){
  const text=raw.trim();
  const start=text.indexOf('{'),end=text.lastIndexOf('}');
  if(start<0||end<=start)return null;
  try{data=JSON.parse(text.slice(start,end+1));}
  catch{
   try{data=JSON.parse(text.slice(start,end+1).replace(/,\s*([}\]])/g,'$1'));}
   catch{return null;}
  }
 }
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const dialogue=String(data.dialogue??'').replace(/\s+/g,' ').replace(/^["']|["']$/g,'').trim();
 if(!dialogue)return null;
 return {
  dialogue:dialogue.slice(0,300),
  expression:EXPRESSIONS.includes(data.expression)?data.expression:'neutral',
  gesture:GESTURES.includes(data.gesture)?data.gesture:'idle'
 };
}

/** The player said yes to the model once; the browser keeps the weights, so next time
 * the town can bring it up by itself (see startMindIfChosen). */
export const MIND_OPT_IN_KEY='johansson-town-mind';
export function rememberOptIn(on,storage=globalThis.localStorage){try{on?storage?.setItem(MIND_OPT_IN_KEY,'1'):storage?.removeItem(MIND_OPT_IN_KEY);}catch{}}
export function optedIn(storage=globalThis.localStorage){try{return storage?.getItem(MIND_OPT_IN_KEY)==='1';}catch{return false;}}

let shared=null;
/** The one model the whole town shares: Thuan's chat and the neighbours' small talk. */
export function sharedMind(options){return shared||(shared=createThuanMind(options));}
/**
 * If the player has turned the model on before, start it quietly once the town is up.
 * Never the first download: that is only ever the player's choice (thuan-chat.js).
 */
export function startMindIfChosen({delay=12000,mind=sharedMind()}={}){
 if(!optedIn())return null;
 return new Promise(resolve=>setTimeout(()=>resolve(mind.load()),delay));
}

/**
 * @param {object} [options]
 * @param {(status:{stage:string,progress:number,text:string})=>void} [options.onProgress]
 * @param {() => Promise<any>} [options.loadWebLLM] injectable for tests
 * @param {string} [options.model]
 * @param {Navigator} [options.navigatorRef] injectable: navigator is read-only under test
 */
export function createThuanMind({onProgress=()=>{},loadWebLLM=()=>import(/* @vite-ignore */ WEB_LLM_URL),model=MODEL_ID,navigatorRef=undefined}={}){
 let engine=null,loading=null,failed=null,queue=Promise.resolve();
 const history=[];
 // One model, one request at a time: Thuan and the neighbours (town-mind.js) take turns.
 const run=job=>{const next=queue.then(job,job);queue=next.catch(()=>{});return next;};

 const report=(stage,progress,text)=>{try{onProgress({stage,progress,text});}catch{}};

 /**
  * Downloads and starts the model. Safe to call repeatedly: the same promise is
  * returned while a load is in flight.
  * @returns {Promise<{ok:boolean,reason?:string}>}
  */
 function load(){
  if(engine)return Promise.resolve({ok:true});
  if(loading)return loading;
  loading=(async()=>{
   const gpu=await detectWebGPU(navigatorRef??globalThis.navigator);
   if(!gpu.ok){failed=gpu.reason;report('unavailable',0,gpu.reason);return {ok:false,reason:gpu.reason};}
   report('downloading',0,'Fetching Thuan’s voice model…');
   try{
    const webllm=await loadWebLLM();
    const create=webllm.CreateMLCEngine||webllm.default?.CreateMLCEngine;
    if(typeof create!=='function')throw new Error('WebLLM did not expose CreateMLCEngine');
    engine=await create(model,{initProgressCallback:info=>{
     const progress=typeof info?.progress==='number'?info.progress:0;
     report(progress>=1?'ready':'downloading',progress,info?.text||'Loading…');
    }});
    report('ready',1,'Thuan is listening.');
    rememberOptIn(true);
    return {ok:true};
   }catch(error){
    failed=error?.message||String(error);
    report('error',0,'Thuan’s voice model could not start: '+failed);
    return {ok:false,reason:failed};
   }finally{loading=null;}
  })();
  return loading;
 }

 /**
  * @param {string} question what the player said
  * @param {string} [context] one line of town state, e.g. "It is 19:40 and the shop is closing."
  * @returns {Promise<ThuanReply|null>} null when the model is unavailable or unusable
  */
 async function ask(question,context=''){
  const line=String(question||'').trim();
  if(!line)return null;
  if(!engine){
   const started=await load();
   if(!started.ok)return null;
  }
  const messages=[
   {role:'system',content:SYSTEM_PROMPT+(context?' '+context:'')},
   ...history.slice(-6),
   {role:'user',content:line}
  ];
  try{
   const response=await run(()=>engine.chat.completions.create({
    messages,temperature:.7,max_tokens:160,
    response_format:{type:'json_object'}
   }));
   const reply=parseReply(response?.choices?.[0]?.message?.content??'');
   if(!reply)return null;
   history.push({role:'user',content:line},{role:'assistant',content:JSON.stringify(reply)});
   if(history.length>12)history.splice(0,history.length-12);
   return reply;
  }catch(error){
   failed=error?.message||String(error);
   return null;
  }
 }

 return {
  get ready(){return !!engine;},
  get error(){return failed;},
  get downloadBytes(){return MODEL_BYTES;},
  load,ask,
  /**
   * A raw JSON completion for the rest of the town (town-mind.js). Never starts the
   * download: null unless the player has already brought the model up.
   * @param {{role:string,content:string}[]} messages
   * @returns {Promise<string|null>}
   */
  async complete(messages,{temperature=.9,max_tokens=220}={}){
   if(!engine)return null;
   try{
    const response=await run(()=>engine.chat.completions.create({messages,temperature,max_tokens,response_format:{type:'json_object'}}));
    return response?.choices?.[0]?.message?.content??null;
   }catch(error){failed=error?.message||String(error);return null;}
  },
  reset(){history.length=0;},
  async dispose(){
   history.length=0;
   const current=engine;engine=null;
   try{await current?.unload?.();}catch{}
  }
 };
}
