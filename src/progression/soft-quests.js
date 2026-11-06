/** Soft daily nudges: calendar dayKey (Europe/Stockholm) only. Diegetic town day stays separate. */
export const SOFT_QUEST_POOL=Object.freeze(['notice','form3_sell','quay_before_press']);
const SALT='jt-soft-v1';

export function stockholmDayKey(date=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}

/** Diegetic day int for talks_today / schedules / sold_form_day silence — not soft-quest rolls. */
export function townDay(minutes){
 const n=Number(minutes);
 return Number.isFinite(n)?Math.floor(n/1440):0;
}

function hash32(text){
 let h=2166136261>>>0;
 for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}

/** Deterministic 1–2 ids from the fixed pool for a calendar dayKey. */
export function pickDailyQuests(dayKey){
 const h=hash32(String(dayKey)+SALT);
 const count=1+(h&1);
 const pool=[...SOFT_QUEST_POOL];
 let seed=h;
 for(let i=pool.length-1;i>0;i--){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const j=seed%(i+1);
  const tmp=pool[i];pool[i]=pool[j];pool[j]=tmp;
 }
 return pool.slice(0,count);
}

function normalizeDone(raw){
 if(Array.isArray(raw)){
  const out={};
  for(const id of raw)if(SOFT_QUEST_POOL.includes(id))out[id]=true;
  return out;
 }
 if(raw&&typeof raw==='object'){
  const out={};
  for(const id of SOFT_QUEST_POOL)if(raw[id])out[id]=true;
  return out;
 }
 return {};
}

function normalizeQuests(raw){
 if(!Array.isArray(raw))return null;
 const ids=raw.filter(id=>SOFT_QUEST_POOL.includes(id));
 return ids.length?ids:null;
}

/** On load / mid-day: keep picks when lastDayKey matches Stockholm today; else reroll. */
export function ensureDailyQuests(state,now=new Date()){
 const today=stockholmDayKey(now);
 const kept=state.lastDayKey===today?normalizeQuests(state.dailyQuests):null;
 if(kept){state.lastDayKey=today;state.dailyQuests=kept;state.dailyDone=normalizeDone(state.dailyDone);return state;}
 state.lastDayKey=today;
 state.dailyQuests=pickDailyQuests(today);
 state.dailyDone={};
 return state;
}

export function hasDailyQuest(state,id){
 return Array.isArray(state?.dailyQuests)&&state.dailyQuests.includes(id);
}

export function isDailyDone(state,id){
 const d=state?.dailyDone;
 if(Array.isArray(d))return d.includes(id);
 return !!(d&&typeof d==='object'&&d[id]);
}

export function markDailyDone(state,id){
 if(!SOFT_QUEST_POOL.includes(id))return;
 if(!state.dailyDone||typeof state.dailyDone!=='object'||Array.isArray(state.dailyDone))state.dailyDone={};
 state.dailyDone[id]=true;
}

/**
 * ThuanLead Form 3 soft nudge gate.
 * Mute only when sold_form_day === currentTownDay. Ignore met_thuan / talks_today.
 * Caller marks dailyDone after one attempt (max one per dayKey).
 */
export function form3NudgeAllowed(state,minutes){
 if(!hasDailyQuest(state,'form3_sell')||isDailyDone(state,'form3_sell'))return false;
 const sold=state?.story?.sold_form_day;
 if(Number.isFinite(sold)&&sold===townDay(minutes))return false;
 return true;
}

export function recordFormSale(state,minutes){
 if(!state.story||typeof state.story!=='object')state.story={};
 state.story.sold_model=true;
 state.story.sold_form_day=townDay(minutes);
}

export const NOTICE_NUDGE='Minato Ferry · last sailing 22:00 from the outer pier. Tickets at the booth on the quay, not the till.';
export const RADIO_821='Eighty-two-one: clear evening, light chop on the quay. Evening press as posted.';
export const FORM3_NUDGE='Thuan buys Form 3D prints at Sakura, if you have one to sell.';
export const QUAY_NUDGE='The evening paper comes in on the ferry at half past six. Worth a walk down to the quay.';
