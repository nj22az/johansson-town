import {MODEL_BYTES,optedIn,rememberOptIn} from './thuan-mind.js';

/**
 * The player's side of an unscripted conversation with Thuan.
 *
 * Deliberately opt-in and deliberately blunt about the cost: the model is roughly 672MB,
 * against a town that streams in under forty, so nothing downloads until the player has
 * read that and pressed the button. Her written dialogue stays the default and is what
 * the rest of the game uses; this is an extra.
 *
 * @typedef {import('./thuan-mind.js').ThuanReply} ThuanReply
 */

const megabytes=bytes=>Math.round(bytes/1048576);

/**
 * @param {object} options
 * @param {(title:string,text:string,buttons:Array)=>void} options.show the conversation modal
 * @param {() => void} options.close
 * @param {HTMLElement} options.body modal body, for the input and transcript
 * @param {ReturnType<import('./thuan-mind.js').createThuanMind>} options.mind
 * @param {{speak:(t:string)=>Promise<any>,cancel:()=>void,supported:boolean}} [options.voice]
 * @param {(reply:ThuanReply) => void} [options.onReply] hands expression and gesture to the scene
 * @param {() => string} [options.getContext] one line of town state for the prompt
 * @param {Document} [options.doc]
 */
export function createThuanChat({show,close,body,mind,voice=null,onReply=()=>{},getContext=()=>'',doc=globalThis.document}){
 const title='Thuan · Sakura Shōten';
 /** @type {{role:'you'|'thuan',text:string}[]} */
 const transcript=[];
 let busy=false;

 const el=(tag,className,text)=>{
  const node=doc.createElement(tag);
  if(className)node.className=className;
  if(text!=null)node.textContent=text;
  return node;
 };

 /** The offer. No bytes move until the player presses the button on this screen. */
 function offer(message){
  transcript.length=0;
  show(title,message||`Thuan can answer in her own words, but that needs a language model running on this device: about ${megabytes(MODEL_BYTES)}MB, downloaded once and then kept by your browser. Her written conversation does not need it. While it runs, the neighbours use it too, and make up their own small talk.`,
   [['Download and start',start],['Not now',close]]);
 }

 async function start(){
  show(title,'Starting…',[['Cancel',close]]);
  const status=el('p','chat-status','Checking this device for WebGPU…');
  body.append(status);
  const result=await mind.load();
  if(!result.ok){
   // Most often an older iOS, or a desktop with GPU acceleration switched off.
   offer(`Thuan cannot answer freely here. ${result.reason} Her written conversation still works.`);
   return;
  }
  render();
 }

 /** Sends whatever is in the box. Empty input is ignored rather than asked about. */
 async function send(question){
  const line=String(question||'').trim();
  if(!line||busy)return;
  busy=true;
  transcript.push({role:'you',text:line});
  render('Thinking…');
  const reply=await mind.ask(line,getContext());
  busy=false;
  if(!reply){
   transcript.push({role:'thuan',text:'…'});
   render('She did not follow that. Try asking it another way.');
   return;
  }
  transcript.push({role:'thuan',text:reply.dialogue});
  onReply(reply);
  render();
  voice?.speak?.(reply.dialogue);
 }

 /** Redraws the transcript and the input into the modal body. */
 function render(note=''){
  show(title,note||'Ask her something.',[['Leave the counter',()=>{voice?.cancel?.();close();}],
   // The model starts by itself on later visits once chosen; this is the way back.
   ...(optedIn()?[['Don’t start the model next visit',()=>{rememberOptIn(false);render('Next visit the town will use its written lines until you start the model again.');}]]:[])]);
  const log=el('div','chat-log');
  for(const entry of transcript.slice(-8)){
   const row=el('p','chat-line chat-'+entry.role);
   row.append(el('b',null,entry.role==='you'?'You':'Thuan'),el('span',null,entry.text));
   log.append(row);
  }
  body.append(log);

  const form=el('div','chat-input');
  const input=doc.createElement('input');
  input.type='text';input.placeholder='Ask Thuan…';input.setAttribute('aria-label','Ask Thuan a question');
  input.maxLength=200;input.disabled=busy;
  const ask=el('button',null,busy?'…':'Ask');
  ask.disabled=busy;
  const submit=()=>{const value=input.value;input.value='';send(value);};
  ask.onclick=submit;
  input.onkeydown=event=>{if(event.key==='Enter')submit();};
  form.append(input,ask);
  body.append(form);
  if(!busy)input.focus?.();
 }

 return {
  /** Entry point: shows the offer, or goes straight in if the model is already resident. */
  open(){
   if(mind.ready)render();
   else offer();
  },
  get transcript(){return transcript.slice();},
  send,
  reset(){transcript.length=0;mind.reset?.();}
 };
}
