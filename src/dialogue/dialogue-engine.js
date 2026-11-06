// Branching dialogue, ported from the Godot Open Dialogue System by Tina Qin
// (QueenChristina), https://github.com/QueenChristina/gd_dialog, MIT licensed.
// The GDScript is a Godot scene tree; this is a plain state machine with no DOM and
// no timers, so the town can drive it from the existing conversation modal and the
// rules can be tested on their own. The data format and its semantics are kept.

import {renderLine} from './markup.js';

export const END_DIALOG_ID='end';
// `|` is a beat of silence and `&` the player's name (read by dialogue/markup.js).

// Strips the special characters and records where the pauses were. The original counts
// pause positions against Godot's bbcode-stripped text; building the printable string
// as we walk it gives the same indices without needing a rich-text label. The town's line
// cues (dialogue/markup.js: {p}, {face:…}, {big}…) are read the same way, so a scripted
// line can be directed like any other; `|` and `&` keep their meaning.
export function printable(text,playerName=''){
 const r=renderLine(text,{name:playerName});
 return r.faces.length?{text:r.text,pauses:r.pauses,faces:r.faces}:{text:r.text,pauses:r.pauses};
}

// "equal"/"is"/"==", "not"/"!=", "less"/"<", "greater"/">". Ordered comparisons cast to
// number, as in the original; anything else compares as a string.
export function compare(a,operator,b){
 const op=String(operator).toLowerCase();
 if(['equal','equals','is','=='].includes(op))return String(a)===String(b);
 if(['not_equal','not','!='].includes(op))return String(a)!==String(b);
 if(['less','<'].includes(op))return Number(a)<Number(b);
 if(['greater','>'].includes(op))return Number(a)>Number(b);
 return false;
}

// "data <key> <operator> <value>". An unset key compares as false, so a condition can be
// written before the flag it reads exists.
export function conditionMet(condition,variables={}){
 const parts=String(condition).trim().split(/\s+/);
 if(parts.length<4)return false;
 const [source,key,operator,...rest]=parts;
 if(source.toLowerCase()!=='data')return false;
 const value=Object.hasOwn(variables,key)?variables[key]:false;
 return compare(value,operator,rest.join(' '));
}

export function createDialogue({script,variables=()=>({}),execute=()=>{},playerName=''}){
 let node=null,page=0,ended=true,lastId=null;
 const met=condition=>conditionMet(condition,variables());
 const run=list=>{for(const act of list||[])execute(act);};

 // The default next id is the last entry and must be a plain string. Conditional entries
 // are read left to right with increasing precedence, so a later match wins.
 const resolveNext=raw=>{
  if(raw==null)return END_DIALOG_ID;
  if(typeof raw==='string')return raw;
  let next=raw[raw.length-1];
  for(const entry of raw.slice(0,-1))if(entry&&typeof entry==='object'&&met(entry.if))next=entry.id;
  return typeof next==='string'?next:next?.id||END_DIALOG_ID;
 };

 function enter(id){
  lastId=id;
  if(id===END_DIALOG_ID||!script[id]){node=null;page=0;ended=true;return view();}
  const raw=script[id];
  const choices=(raw.choices||[]).filter(c=>!c.show_only_if||met(c.show_only_if));
  node={id,speaker:raw.name||'',icon:raw.icon||'none',voice:raw.voice||'default',mood:typeof raw.mood==='string'?raw.mood:null,
   texts:Array.isArray(raw.text)?raw.text:[raw.text],choices,
   // next is unused when a node offers choices, exactly as in the original.
   next:raw.choices?END_DIALOG_ID:resolveNext(raw.next)};
  page=0;ended=false;
  run(raw.action);
  return view();
 }

 function view(){
  if(ended||!node)return {done:true,id:lastId,speaker:'',mood:null,text:'',pauses:{},choices:[],page:0,pages:0,atLastPage:true,endsHere:true};
  const {text,pauses,faces}=printable(node.texts[page],playerName);
  const atLastPage=page===node.texts.length-1;
  // mood: how the speaker's face should look for this node (the town maps it to a face).
  return {done:false,id:node.id,speaker:node.speaker,icon:node.icon,voice:node.voice,mood:node.mood,
   text,pauses,faces,page,pages:node.texts.length,atLastPage,
   // Whether reading on closes the conversation, so a caller can label its own button
   // honestly instead of promising a goodbye that leads into another node.
   endsHere:atLastPage&&!node.choices.length&&node.next===END_DIALOG_ID,
   // Choices only belong to the end of a node, so earlier pages read as plain text.
   choices:atLastPage?node.choices.map((c,index)=>({text:c.text,index})):[]};
 }

 return {
  start:id=>enter(id),
  view,
  // Turn the page, or leave for the next node once the last page is read. A node with
  // choices waits here: the player has to pick one.
  advance(){
   if(ended||!node)return view();
   if(page<node.texts.length-1){page+=1;return view();}
   if(node.choices.length)return view();
   return enter(node.next);
  },
  choose(index){
   if(ended||!node)return view();
   const choice=node.choices[index];
   if(!choice)return view();
   run(choice.action);
   return enter(choice.next||END_DIALOG_ID);
  }
 };
}
