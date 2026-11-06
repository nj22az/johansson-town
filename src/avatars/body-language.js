import {personalityOf,dialStep,DIAL_STEPS} from './personality.js';

/**
 * How each of the sixteen island personalities carries itself (personality.js). Every
 * islander uses the same moves (animate.js); who they are decides which ones, and how
 * often:
 *
 *   feel   the move a feeling brings with it: a Festival friend kicks up a heel when
 *          she is happy, a Lighthouse keeper only nods.
 *   idle   what they do with themselves standing about: a stretch, a look round, hands
 *          on hips, a little heart for nobody in particular.
 *   talk   what their hands do as they start to say something.
 *   quirk  their little habit, the thing they do without knowing it while somebody
 *          else is talking: rocking on their heels, scratching their head, tucking
 *          their hair, tapping their chin, tugging their collar.
 *
 * Moves are names from animate.js GESTURES. Lists repeat a move to make it likelier.
 */
const STYLE=Object.freeze({
 'Lighthouse keeper':{feel:{happy:'Nod',laugh:'Nod',shy:'Bow'},idle:['LookAround','LookAround','Think'],talk:['Nod','Think'],quirk:'HeelRock'},
 'Porch sitter':     {feel:{happy:'Nod',laugh:'Laugh',shy:'Fidget'},idle:['Stretch','LookAround'],talk:['Nod','Talk'],quirk:'ScratchHead'},
 'Old storyteller':  {feel:{happy:'Clap',laugh:'Laugh',shy:'Fidget'},idle:['Think','LookAround'],talk:['Talk','Talk','Point','Clap'],quirk:'ChinTap'},
 'Cloud watcher':    {feel:{happy:'Heart',laugh:'Laugh',shy:'CheekRest'},idle:['Stretch','LookAround','Coy','CheekRest'],talk:['Coy','Heart','Talk'],quirk:'HairTuck'},
 'Quiet craftsman':  {feel:{happy:'Nod',laugh:'Nod',shy:'Shrug'},idle:['HandsOnHips','Think'],talk:['Nod','Shrug'],quirk:'ScratchHead'},
 'Easy neighbour':   {feel:{happy:'Laugh',laugh:'Laugh',shy:'Shrug'},idle:['Stretch','HandsOnHips'],talk:['Shrug','Talk','Laugh'],quirk:'HeelRock'},
 'Big heart':        {feel:{happy:'Heart',laugh:'Laugh',shy:'CheekRest',sad:'Slump'},idle:['Heart','Clap','HandsOnHips','CheekRest'],talk:['Heart','Talk','Laugh'],quirk:'HairTuck'},
 'Wanderer':         {feel:{happy:'Tada',laugh:'Laugh',shy:'Shrug'},idle:['Stretch','Kachashi','LookAround'],talk:['Shrug','Laugh','Peace'],quirk:'ScratchHead'},
 'Timekeeper':       {feel:{happy:'Bow',laugh:'Nod',shy:'Bow'},idle:['HandsOnHips','LookAround'],talk:['Bow','Nod','Point'],quirk:'CollarTug'},
 'Helping hand':     {feel:{happy:'Clap',laugh:'Laugh',shy:'Fidget'},idle:['Wave','HandsOnHips'],talk:['Nod','Clap','Point'],quirk:'HeelRock'},
 'Rising star':      {feel:{happy:'Peace',laugh:'Laugh',shy:'CheekRest'},idle:['Peace','Coy','HeelKick','CheekRest','DoubleCheek'],talk:['Peace','Coy','Heart','CheekRest'],quirk:'HairTuck'},
 'Festival friend':  {feel:{happy:'HeelKick',laugh:'Laugh',shy:'DoubleCheek'},idle:['Heart','HeelKick','Kachashi','DoubleCheek'],talk:['Heart','Peace','Clap'],quirk:'HeelRock'},
 'Straight shooter': {feel:{happy:'Nod',laugh:'Laugh',shy:'HandsOnHips'},idle:['HandsOnHips','HandsOnHips','LookAround'],talk:['Point','HandsOnHips','Nod'],quirk:'CollarTug'},
 'Joker':            {feel:{happy:'Peace',laugh:'Laugh',shy:'Shrug'},idle:['Peace','Shrug','Coy'],talk:['Peace','Laugh','Shrug'],quirk:'ChinTap'},
 'Firecracker':      {feel:{happy:'Tada',laugh:'Laugh',shy:'HandsOnHips',angry:'Stomp'},idle:['HandsOnHips','Fist','Tada'],talk:['Point','Fist','HandsOnHips'],quirk:'CollarTug'},
 'Typhoon':          {feel:{happy:'Tada',laugh:'Laugh',shy:'Coy'},idle:['Tada','Kachashi','HeelKick','Cheer'],talk:['Tada','Peace','Laugh'],quirk:'HeelRock'},
});

/**
 * A few residents whose body language is their own, over their type's: Tetsuo, awkward with people (the owner, 28 October
 * 2026, "can you make Tetsuo look more awkward"), fidgets where a Quiet craftsman would stand with his hands on his hips,
 * tugs his collar while you talk and answers a laugh with a fidget.
 */
export const PERSONAL_STYLE=Object.freeze({
 Tetsuo:Object.freeze({feel:{happy:'Nod',laugh:'Fidget',shy:'Fidget'},idle:['Fidget','LookAround','Fidget','ScratchHead'],talk:['Fidget','Nod','Shrug'],quirk:'CollarTug'}),
});

const lively=p=>(dialStep(p.show)-1)/(DIAL_STEPS-1),brisk=p=>(dialStep(p.pace)-1)/(DIAL_STEPS-1),frank=p=>(dialStep(p.talk)-1)/(DIAL_STEPS-1),sunny=p=>(dialStep(p.outlook)-1)/(DIAL_STEPS-1);

/**
 * Moves too big for the middle of a conversation: in one, the body keeps its attention
 * on the other person, and a feeling comes out as their quirk instead.
 */
export const CONVERSATION_BIG=Object.freeze(new Set(['Tada','HeelKick','Kachashi','Cheer','Stomp','Fist','Hop','Stretch','LookAround','Wave','Jump']));

/**
 * The body language of a profile (and, for the residents in PERSONAL_STYLE, of their `name`).
 * @returns {{type:string,feel:object,idle:string[],talk:string[],quirk:string,idleEvery:[number,number],talkChance:number,listen:object}}
 *   idleEvery: seconds between flourishes standing about (lively, brisk people fidget
 *   more); talkChance: how often a new line comes with a move.
 *   listen: how they listen. nodEvery, seconds between little nods (sunny, frank people
 *   nod along more); tilt, how far the head leans over (dreamy, unhurried people
 *   tilt); glanceAway, the chance of looking off for a moment instead of holding
 *   your eye (quiet people do it more); quirkEvery, seconds between their habit.
 */
export function bodyLanguage(profile={},name){
 const type=personalityOf(profile),style={...STYLE[type.name],...PERSONAL_STYLE[name]},l=lively(profile),b=brisk(profile),f=frank(profile),o=sunny(profile);
 const base=34-l*20-b*6,nod=6.5-o*3-f*1.5,quirk=16-l*6-b*4;
 return {type:type.name,feel:style.feel,idle:style.idle,talk:style.talk,quirk:style.quirk,
  idleEvery:[base*.6,base*1.4],talkChance:Math.min(.85,.3+l*.4+f*.15),
  listen:{nodEvery:[nod*.7,nod*1.3],tilt:.03+(1-b)*.1,glanceAway:.12+(1-l)*.3,quirkEvery:[quirk*.7,quirk*1.3]}};
}

/** Every move any personality uses, so a test can check animate.js knows them all. */
export const BODY_LANGUAGE_MOVES=Object.freeze([...new Set([...Object.values(STYLE),...Object.values(PERSONAL_STYLE)].flatMap(s=>[...Object.values(s.feel),...s.idle,...s.talk,s.quirk]))]);

/**
 * The feeling in a line of dialogue, from the words, or null when it is just talk. It
 * gives the speaker the face, and with it the move, their personality has for it.
 */
export function lineFeeling(text=''){
 const t=String(text).toLowerCase();
 if(/\b(ha){2,}|\bhehe|\bahaha|\blol\b|funny|joke|laugh/.test(t))return 'laugh';
 if(/\bsorry\b|\bsad\b|\bmiss (him|her|them|it)|lonely|\balas\b|passed away|can't sleep|worried/.test(t))return 'sad';
 if(/\?!|!\?|\breally\?|\bno way\b|\bwhat\?|goodness|\bwow\b/.test(t))return 'surprised';
 if(/\b(love|wonderful|lovely|great|welcome|thank(s| you)|congratulations|happy|delicious|perfect|yay)\b|!/.test(t))return 'happy';
 if(/\bhmm+\b|\bwell\.\.\.|let me think|i wonder/.test(t))return 'thinking';
 return null;
}
