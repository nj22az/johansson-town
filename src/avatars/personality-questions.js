import {DIALS,PERSONALITIES,stepValue} from './personality.js';

/** Original island situations; these choose game behaviour, not a psychological diagnosis. */
export const PERSONALITY_QUESTIONS=Object.freeze([
 {key:'pace',question:'An afternoon errand takes you past the harbour. How do you go?',answers:['Take the scenic path, with time to stop.','Go straight there, then plan the next errand.']},
 {key:'talk',question:'A friend asks what you think of their idea. What comes first?',answers:['Choose the words carefully before answering.','Say what you think, plainly and directly.']},
 {key:'show',question:'Your favourite song comes on the café radio. What shows?',answers:['A quiet smile while you listen.','Your hands, feet and face join in.']},
 {key:'outlook',question:'Rain changes the plans for your day off. What now?',answers:['Work out a replacement plan.','See where the afternoon takes you.']},
].map(q=>Object.freeze({...q,answers:Object.freeze(q.answers)})));

/** A complete set only: no hidden defaults for unanswered questions. */
export function answeredPersonality(answers){
 if(!PERSONALITY_QUESTIONS.every(q=>answers?.[q.key]===0||answers?.[q.key]===1))return null;
 return Object.fromEntries(PERSONALITY_QUESTIONS.map(q=>[q.key,stepValue(answers[q.key]?6:3)]));
}

export const personalityDials=index=>Object.fromEntries(DIALS.map((d,i)=>[d.key,stepValue(index&(1<<(3-i))?6:3)]));

/** Reusable, read-only reference for Studio and the town's records. */
export function personalityReference(doc=globalThis.document){
 const details=doc.createElement('details'),summary=doc.createElement('summary'),list=doc.createElement('div');
 details.className='personality-reference';summary.textContent='The sixteen island personalities';list.className='personality-reference-grid';
 PERSONALITIES.forEach((type,i)=>{
  const card=doc.createElement('article'),name=doc.createElement('h4'),line=doc.createElement('p'),dials=doc.createElement('small');
  name.textContent=type.name;line.textContent=type.strength;dials.textContent=DIALS.map((d,j)=>d[indexHigh(i,j)?'high':'low']).join(' · ');
  card.style.borderLeftColor=type.colour;card.append(name,line,dials);list.append(card);
 });
 details.append(summary,list);return details;
}
const indexHigh=(i,j)=>!!(i&(1<<(3-j)));
