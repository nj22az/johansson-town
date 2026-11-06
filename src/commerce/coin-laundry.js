import {townCalendarAt} from '../town-clock.js';
import {rotaWeek} from '../people/ferry-crew.js';
import {happeningsOn} from '../people/happenings.js';
import {typhoonTomorrow} from '../world/typhoons.js';

/**
 * The coin laundry (コインランドリー) on the west side of Main Street, between Higa Liquor's crate yard and the bus
 * plaza: four washers, two gas dryers, a bench, a folding table, a stack of old manga and the street's noticeboard. Open
 * twenty-four hours; nobody works in it, but somebody keeps it (the owner, 21 October 2026: "the laundromat, how can we
 * bring them more life and interactivity"; the plan approved: "Yes go on", no new people).
 *
 * Everything that happens in it is data and a pure function of the town clock: who keeps it and when, who does their
 * washing there and why on that day, which machine is turning at any minute, and what is pinned on the board, so the
 * world, the stories, the film and the tests ask the same questions.
 */
const minute=m=>((m%1440)+1440)%1440;
const DAY=1440;

/**
 * The keeper: Ms Ganaha (Kitahama Heights B). Of the cast nobody lives nearer but Officer Mori (a policeman may not run
 * a business on the side, and he sleeps through the morning after the night patrol) and Tetsuo, whose days are full
 * (the workshop's radio bench, the ship's electrics, the bath's boiler, the power house). Her mornings are her own until
 * the mailbag at 9:30, the laundry is on her way from Fukugi Lane to the Port Terminal, and a port clerk with a ticket
 * window is used to counting coins: she rents the shop and runs it on the side, a coin laundry being the side business a
 * Japanese wage earner took on precisely because it runs itself. Tetsuo mends the machines when they need it.
 */
export const LAUNDRY_KEEPER=Object.freeze({name:'Ms Ganaha',from:480,to:555,
 round:'sweeps the floor, clears the dryers’ lint filters, wipes the machines, empties the coin boxes into a cloth bag for the bank, fills the powder box and pins up the new notices',
 why:'She lives nearest of everyone with a free morning (Kitahama Heights B, 22 m), passes the door on her way to the terminal, and counts coins for a living; Officer Mori, as near, may not keep a business and sleeps after the night patrol, and Tetsuo, as near, has no free hour.',
 repairs:'Tetsuo, when a machine sticks or a dryer eats a coin (the board says so).'});

/** The machines, by id, with what a wash costs and how long it runs in town minutes (1997 prices). */
export const LAUNDRY_MACHINES=Object.freeze([
 Object.freeze({id:'W1',kind:'washer',load:'7 kg',cost:200,minutes:30}),
 Object.freeze({id:'W2',kind:'washer',load:'7 kg',cost:200,minutes:30}),
 Object.freeze({id:'W3',kind:'washer',load:'7 kg',cost:200,minutes:30}),
 Object.freeze({id:'W4',kind:'washer',load:'12 kg, for futon covers and blankets',cost:400,minutes:40}),
 Object.freeze({id:'D1',kind:'dryer',load:'gas, 14 kg',cost:100,minutes:30,per:'¥100 for 10 minutes'}),
 Object.freeze({id:'D2',kind:'dryer',load:'gas, 14 kg',cost:100,minutes:30,per:'¥100 for 10 minutes'}),
]);
/** The powder from the box by the door, a cup a wash. */
export const LAUNDRY_POWDER=Object.freeze({cost:50,what:'a paper cup of washing powder from the vending box'});
/** Loading takes this long; moving the wet washing to a dryer this long (town minutes). */
const LOAD=4,MOVE=2;

/**
 * Who does their washing here, when, and why that day: each derived from their own day (people/cast.js) and the ship's
 * rota (people/ferry-crew.js), not placed for the sake of it. `on(minutes)` says whether today is their day; `from` and
 * `to` are the visit, in minutes of the day.
 */
export const LAUNDRY_VISITS=Object.freeze([
 Object.freeze({name:'Thao',from:855,to:945,washers:Object.freeze(['W4']),dryer:'D1',
  when:'Sundays, 14:15–15:45',
  what:'the family’s futon covers and Minato’s hand towels and noren, in the big washer',
  why:'She sleeps until noon after the izakaya’s late close (people/home-life.js) and has lunch with her sisters at one; Sunday afternoon, before the noren goes up at four, is the one stretch the week leaves her, and 1 Kitahama has only a small twin-tub for the everyday wash.',
  on:minutes=>townCalendarAt(minutes).weekday===0}),
 Object.freeze({name:'Ms Uezu',from:600,to:690,washers:Object.freeze(['W1','W2']),dryer:'D2',
  when:'the first day of her week ashore, 10:00–11:30',
  what:'the crew cabin’s sheets and her own week’s clothes, off the ship',
  why:'She lives aboard on her week on (people/ferry-crew.js); the first morning of her week off she brings the linen ashore to the machines nearest the quay, two washers at once.',
  on:minutes=>rotaWeek(minutes)===1&&Math.floor(minutes/DAY)%7===0}),
 // Dr Kakazu's evening until he retired into Nhung (22 October 2026): the clinic's washing is the doctor's, whoever she is.
 Object.freeze({name:'Nhung',from:1275,to:1350,washers:Object.freeze(['W3']),dryer:'D2',
  when:'Wednesdays, 21:15–22:30',
  what:'her white coats and the clinic’s towels',
  why:'The clinic has no machine, and the family’s twin-tub at 3 Kitahama is for Kōji’s and Riku’s things, not the patients’ towels: one evening a week, after the paper’s page is set and on call from nine, she washes here with the clinic’s pager on the bench beside her.',
  on:minutes=>townCalendarAt(minutes).weekday===3}),
]);

/** One visit's timeline in minutes of the day: when the washers and the dryer run, and the fold. */
export function visitTimeline(visit){
 const washer=Math.max(...visit.washers.map(id=>LAUNDRY_MACHINES.find(m=>m.id===id).minutes));
 const wash=[visit.from+LOAD,visit.from+LOAD+washer],dry=[wash[1]+MOVE,wash[1]+MOVE+LAUNDRY_MACHINES.find(m=>m.id===visit.dryer).minutes];
 return {wash,dry,fold:[dry[1],visit.to]};
}

/** The visits of the day at `minutes` (whichever are on). */
export const laundryVisitsOn=minutes=>LAUNDRY_VISITS.filter(v=>v.on(minutes));
/** The visit a resident is on at this minute, with its stage ('loading', 'waiting', 'folding'), or null. */
export function laundryVisitAt(name,minutes){
 const m=minute(minutes),v=LAUNDRY_VISITS.find(v=>v.name===name);
 if(!v||!v.on(minutes)||m<v.from||m>=v.to)return null;
 const t=visitTimeline(v),stage=m<t.wash[0]?'loading':m>=t.wash[1]&&m<t.dry[0]?'loading':m>=t.fold[0]?'folding':'waiting';
 return {...v,stage,timeline:t};
}
/** Whether the keeper is on her morning round. */
export const laundryKeeperAt=minutes=>{const m=minute(minutes);return m>=LAUNDRY_KEEPER.from&&m<LAUNDRY_KEEPER.to;};

/**
 * Every machine at this minute: {id, kind, running ('wash' | 'dry' | null), by, basket}. `wash` is the player's own, if
 * any ({machine, start, dryer, dryStart}: absolute town minutes, people/../activities.js keeps it in the save). A basket
 * sits on a machine from when it is loaded until its washing is folded.
 */
export function laundryMachinesAt(minutes,wash=null){
 const m=minute(minutes),out=new Map(LAUNDRY_MACHINES.map(x=>[x.id,{id:x.id,kind:x.kind,running:null,by:null,basket:false}]));
 for(const v of laundryVisitsOn(minutes)){
  if(m<v.from||m>=v.to)continue;
  const t=visitTimeline(v);
  for(const id of v.washers){const s=out.get(id);s.basket=m<t.dry[0];s.by=v.name;if(m>=t.wash[0]&&m<t.wash[1])s.running='wash';}
  const d=out.get(v.dryer);d.by=v.name;d.basket=m>=t.wash[1];if(m>=t.dry[0]&&m<t.dry[1])d.running='dry';
 }
 if(wash){
  const run=playerWashStage(wash,minutes);
  const w=out.get(wash.machine);if(w&&['washing','washed'].includes(run.stage)){w.by='you';w.basket=true;if(run.stage==='washing')w.running='wash';}
  const d=wash.dryer&&out.get(wash.dryer);if(d&&['drying','dried'].includes(run.stage)){d.by='you';d.basket=true;if(run.stage==='drying')d.running='dry';}
 }
 return [...out.values()];
}

/**
 * The player's wash, as the save keeps it: where it is at `minutes`. 'washing' (the drum turning), 'washed' (wet, waiting
 * to go in a dryer), 'drying', 'dried' (warm, waiting to be folded); a folded wash is taken home and leaves the save.
 */
export function playerWashStage(wash,minutes){
 if(!wash)return {stage:'none'};
 const washer=LAUNDRY_MACHINES.find(x=>x.id===wash.machine),dryer=wash.dryer&&LAUNDRY_MACHINES.find(x=>x.id===wash.dryer);
 if(!dryer){const left=wash.start+washer.minutes-minutes;return left>0?{stage:'washing',left}:{stage:'washed',left:0};}
 const left=wash.dryStart+dryer.minutes-minutes;return left>0?{stage:'drying',left}:{stage:'dried',left:0};
}
/** A machine of `kind` free for the player at this minute: not turning, nobody's basket on it, and nobody's booked within its run. */
export function freeMachine(kind,minutes,wash=null){
 const now=laundryMachinesAt(minutes,wash),soon=laundryMachinesAt(minutes+(kind==='washer'?30:30),wash);
 return LAUNDRY_MACHINES.filter(x=>x.kind===kind&&x.id!=='W4').find(x=>{const a=now.find(s=>s.id===x.id),b=soon.find(s=>s.id===x.id);return !a.basket&&!a.running&&!(b.by&&b.by!=='you');})?.id
  ||(kind==='washer'&&!now.find(s=>s.id==='W4').basket?'W4':null);
}

/**
 * The manga on the shelf by the bench: weekly anthologies' collected volumes that people left and nobody took home, one
 * open on the bench each day. Invented titles (no publisher's or artist's work is named), each a kind the period read.
 */
export const LAUNDRY_MANGA=Object.freeze([
 Object.freeze({title:'Diamond of Kōshien, volume 14',text:'A baseball manga, the spine taped twice. The pitcher from the island school has thrown two hundred pitches and his arm is about to go. Somebody has pencilled “NO!” in the margin.'}),
 Object.freeze({title:'Captain of the Coral Sea, volume 3',text:'A boy, a wooden boat and a typhoon. The pages with the storm are softer than the rest.'}),
 Object.freeze({title:'Ramen Wars, volume 7',text:'Two noodle shops on one street, at war over a broth. It reads a little like Sato Ramen and Minato across the road.'}),
 Object.freeze({title:'Mahjong Wind, volume 22',text:'Four men round a table at night, one of them about to lose a bar. Volume 21 has been missing for years.'}),
 Object.freeze({title:'Classroom of the Sea, volume 1',text:'A young teacher posted to a tiny island school. Somebody has drawn glasses on the teacher and written “Miss Higa” beside her.'}),
]);

/**
 * The noticeboard by the bench. What is pinned is real: each standing notice is a story hook with who posted it and the
 * thing in the town it is about; the week's events come from the town's calendar (people/happenings.js), and a typhoon
 * warning from the weather (world/typhoons.js). Headings are Japanese, as the cards are written; the text the player
 * reads is English.
 */
export const LAUNDRY_NOTICES=Object.freeze([
 Object.freeze({id:'missing-cat',kind:'missing',jp:'迷い猫',title:'Missing: Tama',colour:'#f6d36a',
  text:'MISSING CAT. Tama, ginger and white, a quay cat with a torn left ear. Last seen leaving the market with a whole squid. Answers to dried fish. If found, tell Front-Row Books.',
  by:'Nhung',hook:'Tama, the quay cat the bookshop feeds (feed/places.js, the evening news): where has he gone with the squid, and who is hiding him?'}),
 Object.freeze({id:'lost-sandal',kind:'found',jp:'落とし物',title:'Found: one blue sandal',colour:'#a9d4ec',
  text:'FOUND by the school wash taps: one child’s blue island sandal (shima-zōri), left foot. It is on the shelf by the powder box. The right one must be somewhere.',
  by:'Ms Ganaha',hook:'The blue sandal by the school taps (school.js, the wash station): whose is it, and where is the other one?'}),
 Object.freeze({id:'swimming',kind:'lessons',jp:'水泳教室',title:'Swimming to the buoy',colour:'#bfe3c0',
  text:'SWIMMING LESSONS. Children over eight, to the buoy off the west quay and back. Sunday afternoons in summer, a grown-up on the seawall. Ask Kōji at the fish auction.',
  by:'Kōji',hook:'Riku is not allowed on his father’s boat until he can swim to the buoy (cast.js RELATIONSHIPS): the lessons are Kōji’s way of saying yes.'}),
 Object.freeze({id:'dryer-two',kind:'laundry',jp:'お願い',title:'Dryer 2 eats coins',colour:'#ffffff',
  text:'PLEASE. Dryer 2 sometimes keeps your ¥100. Write your name on the card and I will pay you back. Tetsuo is coming to look at it. Do not hit it. — Ganaha',
  by:'Ms Ganaha',hook:'A dryer that keeps coins, a keeper who pays them back from her own purse, and Tetsuo who keeps not coming.'}),
 Object.freeze({id:'overnight',kind:'laundry',jp:'お願い',title:'Do not leave washing overnight',colour:'#ffffff',
  text:'Please do not leave your washing in the machines overnight. (Everybody does.)',
  by:'Ms Ganaha',hook:'Whose washing is always still in the dryer in the morning.'}),
]);

/** The calendar's days that go up on a public board: the festivals and the public weekly ones, not somebody's day off. */
const PINNED_WEEKLY=Object.freeze(['fish-auction','morning-market','star-port-night']);
const pinned=h=>!!(h.on.date||h.on.dates)||PINNED_WEEKLY.includes(h.id);
/**
 * What is on the board at this minute: the standing notices, then the week's events from the calendar (the next seven
 * days) and a typhoon warning if one is coming tomorrow. Each is {id, jp, title, text, by, hook?}.
 */
export function laundryNotices(minutes){
 const out=[...LAUNDRY_NOTICES];
 const t=typhoonTomorrow(minutes);
 if(t)out.unshift(Object.freeze({id:'typhoon',kind:'warning',jp:'台風',title:'Typhoon tomorrow',colour:'#f08a7a',
  text:`TYPHOON No. ${t.number} is expected tomorrow. Bring your washing in tonight; the laundry stays open, the machines stay on.`,by:'Ms Ganaha'}));
 const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],seen=new Set();
 for(let d=0;d<7;d++){
  const at=minutes+d*DAY;
  for(const h of happeningsOn(at)){
   if(seen.has(h.id)||!pinned(h))continue;seen.add(h.id);
   const hours=h.hours[1]>h.hours[0]?` from ${Math.floor(h.hours[0]/60)}:${String(h.hours[0]%60).padStart(2,'0')}`:'';
   out.push(Object.freeze({id:'event-'+h.id,kind:'event',jp:'お知らせ',title:h.title,colour:'#f7e7c4',
    text:`${d===0?'Today':d===1?'Tomorrow':days[townCalendarAt(at).weekday]}: ${h.title}${hours}.`,by:'the town calendar'}));
  }
 }
 return out;
}
