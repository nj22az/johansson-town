// Binds the ported dialogue engine to the town: which flags a condition can read, and
// what an action is allowed to change. Kept apart from the modal so both can be tested.
import {createDialogue,END_DIALOG_ID} from './dialogue-engine.js';

// Durable story flags. Saved with the rest of the state, so a condition written against
// one of these keeps its answer across a reload.
export const STORY_FLAGS=Object.freeze({
 met_thuan:false,bought_from_sakura:false,sold_model:false,sold_form_day:-1,inspected_plant:false,
 has_letter:false,helped_ledger:false,sat_after_close:false,helped_close:false,
 heard_nam_phuoc:false,rain_awning:false,talks_today:0,last_talk_day:-1,
 gifts_given:0,gifts_today:0,gift_day:-1});

export const defaultStory=()=>({...STORY_FLAGS});

// Only known flags survive a load, and only as the type they were declared with: a save
// edited by hand cannot introduce new keys or flip a counter into a string.
export function restoreStory(saved){
 const story=defaultStory();
 if(!saved||typeof saved!=='object'||Array.isArray(saved))return story;
 for(const [key,fallback] of Object.entries(STORY_FLAGS)){
  const value=saved[key];
  if(typeof fallback==='boolean'&&typeof value==='boolean')story[key]=value;
  if(typeof fallback==='number'&&Number.isFinite(value))story[key]=Math.max(-1,Math.min(999,Math.trunc(value)));
 }
 return story;
}

// Thuan's own conversations are the ones that wear her patience thin, so only those count.
export function countTalk(story,minutes){
 const day=Math.floor(minutes/1440);
 if(story.last_talk_day!==day){story.last_talk_day=day;story.talks_today=0;}
 story.talks_today=Math.min(999,story.talks_today+1);
 return story.talks_today;
}

// The flags a condition can read, plus a little context about where and when we are, so a
// line can be written for the last hour of trading or for standing in the shop.
export function dialogueVariables({story,minutes=0,place='street',rain=false}){
 const m=((minutes%1440)+1440)%1440;
 return {...story,place,rain,
  hour:Math.floor(m/60),
  shop_open:m>=540&&m<1200,
  last_hour:m>=1140&&m<1200,
  after_close:m>=1200||m<540};
}

// "set <key> <value>" writes a known flag; "note <text>" adds a journal note. Anything
// else is ignored rather than thrown, so a typo in the script cannot end a conversation.
export function dialogueAction({story,note=()=>{}}){
 return act=>{
  const parts=String(act).trim().split(/\s+/);
  const command=parts[0]?.toLowerCase();
  if(command==='set'&&parts.length>=3){
   const key=parts[1],raw=parts.slice(2).join(' ');
   if(!Object.hasOwn(STORY_FLAGS,key))return;
   const fallback=STORY_FLAGS[key];
   if(typeof fallback==='boolean')story[key]=raw==='true';
   else if(Number.isFinite(Number(raw)))story[key]=Number(raw);
   return;
  }
  if(command==='note'&&parts.length>1)note(parts.slice(1).join(' '));
 };
}

export function createTownDialogue({script,state,note,getMinutes=()=>0,getPlace=()=>'street',getRain=()=>false,playerName='Johansson'}){
 state.story=restoreStory(state.story);
 return createDialogue({script,playerName,
  variables:()=>dialogueVariables({story:state.story,minutes:getMinutes(),place:getPlace(),rain:getRain()}),
  execute:dialogueAction({story:state.story,note})});
}

export {END_DIALOG_ID};
