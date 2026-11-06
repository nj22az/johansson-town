/**
 * Who someone is, not only what they look like: four dials, a voice, a birthday, a
 * favourite colour and a catchphrase, kept in the recipe's `profile`.
 *
 * The four dials each run in eight steps. Which half of each dial you are on gives one
 * of sixteen island personalities. The names and lines are the town's own.
 */

/** The dials, in order, with what each end means. */
export const DIALS=Object.freeze([
 Object.freeze({key:'pace',label:'Pace',low:'Unhurried',high:'Brisk'}),
 Object.freeze({key:'talk',label:'Talk',low:'Careful',high:'Frank'}),
 Object.freeze({key:'show',label:'Feelings',low:'Calm',high:'Lively'}),
 Object.freeze({key:'outlook',label:'Outlook',low:'Serious',high:'Easygoing'}),
]);
export const DIAL_STEPS=8;

/** The sixteen, indexed pace·talk·feelings·outlook (high = 1). */
const ISLAND_MOMENTS=[
 ['Notices what others miss and follows through.','Checking the quay lamps before a storm.'],
 ['Makes room for people who need to be heard.','Sharing tea on a shaded porch.'],
 ['Keeps memories vivid and welcomes a good listener.','Retelling a fishing adventure after supper.'],
 ['Finds possibilities in an ordinary afternoon.','Sketching clouds from the garden bridge.'],
 ['Brings care and patience to difficult work.','Finishing a small repair at the dock workshop.'],
 ['Offers practical help without making a fuss.','Lending a ladder across the garden fence.'],
 ['Makes it easy for friends to share their feelings.','Cheering loudest at the island school match.'],
 ['Turns a detour into a new experience.','Following the coastal path past the cape.'],
 ['Keeps a busy day manageable for everyone.','Organising the morning harbour deliveries.'],
 ['Brings useful energy to a neighbour’s problem.','Carrying shopping home for someone else.'],
 ['Helps a good idea find an audience.','Rehearsing for the Community Hall concert.'],
 ['Draws newcomers into the fun.','Saving a seat at the festival table.'],
 ['Makes decisions when everyone else hesitates.','Sorting out a delayed cargo delivery.'],
 ['Finds the humour that eases a tense moment.','Making the shop queue laugh on a rainy day.'],
 ['Stands up for friends with wholehearted feeling.','Arguing a point, then buying everyone supper.'],
 ['Starts adventures and takes friends along.','Planning three outings before the ferry docks.'],
];
export const PERSONALITIES=Object.freeze([
 ['Lighthouse keeper','Steady and watchful. Keeps a promise to the letter.','#3d6a8a'],
 ['Porch sitter','In no hurry at all. Always has time to listen.','#8a5a2e'],
 ['Old storyteller','Slow to start, but tells it with all their heart.','#8a4ab8'],
 ['Cloud watcher','Drifts happily along with a head full of ideas.','#7fb0d8'],
 ['Quiet craftsman','Few words, all of them meant. Does things properly.','#6d7478'],
 ['Easy neighbour','Plain-spoken and relaxed. Will lend you a ladder.','#8fbf4a'],
 ['Big heart','Laughs loudest, cries at films, says how they feel.','#e98aa6'],
 ['Wanderer','Says what they like and goes where the day takes them.','#2a8a5a'],
 ['Timekeeper','Quick, polite and composed. Has a list for everything.','#2f5f9e'],
 ['Helping hand','First to help, and pleasant about it.','#3fa0c8'],
 ['Rising star','Polished, quick and fond of an audience.','#f4d23c'],
 ['Festival friend','Everywhere at once and friends with all of it.','#e8742a'],
 ['Straight shooter','Fast and blunt. Gets it done.','#27304d'],
 ['Joker','Quick, frank, and always up to something.','#d8342c'],
 ['Firecracker','Quick to flare up, quick to laugh. Big energy.','#c8402e'],
 ['Typhoon','Never still, says everything, enjoys every minute.','#45b7f0'],
].map(([name,line,colour],i)=>Object.freeze({name,line,colour,strength:ISLAND_MOMENTS[i][0],islandMoment:ISLAND_MOMENTS[i][1]})));

const clamp01=v=>Math.min(1,Math.max(0,Number.isFinite(+v)?+v:.5));
/** A dial's value (0–1) as a step, 1–8. */
export const dialStep=v=>Math.min(DIAL_STEPS,1+Math.floor(clamp01(v)*DIAL_STEPS*.9999));
/** A step (1–8) back to a dial value, at the middle of its step. */
export const stepValue=step=>(Math.min(DIAL_STEPS,Math.max(1,step))-.5)/DIAL_STEPS;

/** Which of the sixteen a profile is. */
export function personalityOf(profile={}){
 const bit=key=>dialStep(profile[key])>DIAL_STEPS/2?1:0;
 return PERSONALITIES[bit('pace')*8+bit('talk')*4+bit('show')*2+bit('outlook')];
}

/** The Ryukyu scale the town's voices are pitched in (dialogue-box.js uses it too). */
const RYUKYU=[261.6,329.6,349.2,392,493.9,523.3,659.3,698.5,784,987.8,1046.5];
/**
 * A voice from the profile: the note a blip is pitched at, its timbre and how fast the
 * letters come. Lively people sing a little; frank people sound a little brighter.
 */
export function voiceOf(profile={}){
 const pitch=clamp01(profile.pitch),speed=clamp01(profile.speed);
 return {
  freq:RYUKYU[Math.round(pitch*(RYUKYU.length-1))],
  type:['sine','triangle'].includes(profile.timbre)?profile.timbre:clamp01(profile.talk)>.62?'triangle':'sine',
  volume:.06*(1.5-clamp01(profile.softness)),
  vibrato:clamp01(profile.vibrato??0),
  letterMs:Math.round(34-speed*20),
  swing:clamp01(profile.show)>.5?1.0595:1,
 };
}

export const MONTHS=Object.freeze(['January','February','March','April','May','June','July','August','September','October','November','December']);
const DAYS_IN=[31,29,31,30,31,30,31,31,30,31,30,31];
export const daysIn=month=>DAYS_IN[Math.min(11,Math.max(0,month-1))];
export const birthdayText=profile=>`${clampDay(profile.month,profile.day)} ${MONTHS[(profile.month||1)-1]}`;
function clampDay(month,day){return Math.min(daysIn(month||1),Math.max(1,day|0||1));}

/** Legacy dialogue voices remain name-based until a voice control has been changed. */
export const hasVoiceRefinement=p=>!!p&&(p.pitch!==undefined&&p.pitch!==.5||p.speed!==undefined&&p.speed!==.5||p.timbre!==undefined&&p.timbre!=='auto'||p.softness!==undefined&&p.softness!==.5||p.vibrato>0);

/** What they say when they first meet you. */
export function hello(recipe){
 const name=recipe.name||'your new islander',p=recipe.profile||{},type=personalityOf(p);
 const catch_=p.catchphrase?` ${p.catchphrase}`:'';
 const opener=dialStep(p.talk)>4?`Hey! I'm ${name}.`:`Hello. My name is ${name}.`;
 const middle=dialStep(p.show)>4?' I am so happy to be here!':' Nice to meet you.';
 return `${opener}${middle}${catch_}\n\n${type.name} · born ${birthdayText(p)}`;
}

/**
 * The town's own people, on the four dials (pace, talk, feelings, outlook), read from who
 * they are: their lines, their work and the one-line personality profiles.js gives them.
 * Anyone not listed gets dials drawn from their name, the same every time.
 */
export const TOWN_DIALS=Object.freeze(Object.fromEntries(Object.entries({
 Johansson:[.3,.7,.7,.8],          // Wanderer: sixty-odd, sunburnt, in no hurry, glad of everything
 Thuan:[.7,.35,.75,.75],           // Festival friend: quick, polite, bright as her blouse
 'Miss Higa':[.25,.3,.3,.3],        // Lighthouse keeper: steady at the blackboard and the bandai
 Nhung:[.6,.65,.4,.75],             // Joker: the eldest sister, playful mischief behind the doctor’s desk
 Chin:[.7,.4,.75,.7],             // Festival friend: enthusiastic tinkerer
 'Mrs Sato':[.4,.75,.7,.3],        // Big heart: affectionately formidable
 'Harbour master':[.3,.7,.3,.65],  // Easy neighbour: dry wit, soft heart
 'Bus driver':[.25,.35,.7,.3],     // Old storyteller: patient storyteller
 'Cold-storage kid':[.4,.25,.35,.7],// Porch sitter: shy, unexpectedly funny
 'Officer Mori':[.7,.3,.4,.6],     // Helping hand: earnest, easily teased
 Hana:[.7,.75,.75,.4],             // Firecracker: bold little artist
 Daichi:[.3,.3,.7,.7],             // Cloud watcher: big dreams, gentle nature
 'Mr Fujita':[.35,.75,.75,.75],    // Wanderer: cheerful embellisher
 Masaru:[.75,.8,.8,.7],            // Typhoon: boisterous cook-at-heart
 Yoshiko:[.25,.4,.25,.6],          // Porch sitter: calm neighbourhood anchor
 Reiko:[.75,.7,.65,.6],            // Typhoon: curious, loves a scoop
 Tetsuo:[.3,.65,.2,.35],           // Quiet craftsman: deadpan music lover
 'Mr Tanabe':[.25,.3,.65,.75],     // Cloud watcher: playful philosopher
 Naoko:[.8,.35,.35,.35],           // Timekeeper: brisk, remembers everyone
 Hiroshi:[.65,.4,.8,.3],           // Rising star: proud amateur singer
 Fumiko:[.7,.85,.4,.3],            // Straight shooter: fearless neighbourhood aunt
 Kenta:[.4,.25,.6,.65],            // Cloud watcher: sweetly awkward inventor
 Thao:[.7,.85,.4,.45],              // Straight shooter: stubborn but friendly; will not be talked out of it
 Barfly:[.15,.65,.35,.8],         // Easy neighbour: unhurried, permanently thirsty
}).map(([name,[pace,talk,show,outlook]])=>[name,Object.freeze({pace,talk,show,outlook})])));

const DIAL_KEYS=['pace','talk','show','outlook'];
const isDefaultDials=p=>!p||DIAL_KEYS.every(k=>p[k]===undefined||p[k]===.5);
/**
 * A recipe with its owner's dials. A recipe whose dials somebody has set (the islander
 * maker, a shared code) keeps them; one still on the factory middle takes the town's.
 */
export function withTownDials(recipe,name=recipe?.name){
 if(!recipe||!isDefaultDials(recipe.profile))return recipe;
 let dials=TOWN_DIALS[name];
 if(!dials&&name){
  let h=2166136261;for(const c of String(name))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
  dials=Object.fromEntries(DIAL_KEYS.map((k,i)=>[k,((h>>>(i*7))&127)/127*.8+.1]));
 }
 return dials?{...recipe,profile:{...(recipe.profile||{}),...dials}}:recipe;
}
