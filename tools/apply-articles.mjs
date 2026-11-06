/** Merges guide/articles.mjs into guide/residents.json: the live cast only, each with its article.
 * node tools/apply-articles.mjs  (then tools/render-resident-shoot.mjs and tools/render-resident-guide.mjs)
 */
import {readFile,writeFile} from 'node:fs/promises';
import {ARTICLES} from '../guide/articles.mjs';
const path=new URL('../guide/residents.json',import.meta.url);
const old=JSON.parse(await readFile(path,'utf8')),byName=new Map(old.map(r=>[r.name,r]));
// Residents renamed in the game (src/people/renamed.js) keep their old facts under the new name,
// unless a newer catalogue entry for them is supplied: node tools/apply-articles.mjs newer.json
import {RENAMED_RESIDENTS} from '../src/people/renamed.js';
for(const [was,now] of Object.entries(RENAMED_RESIDENTS))if(byName.has(was)&&!byName.has(now))byName.set(now,{...byName.get(was),name:now});
if(process.argv[2])for(const r of JSON.parse(await readFile(process.argv[2],'utf8')))if(!byName.has(r.name)||Object.values(RENAMED_RESIDENTS).includes(r.name))byName.set(r.name,{...byName.get(r.name),...r});
const slug=name=>name.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// The facts the articles do not carry: the role, the place, the friend a story pairs them with, the line they say and
// the island personality, for everybody whose facts changed with the consolidation (docs/CAST-CONSOLIDATION.md, phase 5)
// and for the eleven who joined the guide then. Everything else comes from the entry already in residents.json.
const FIX={
 Johansson:{friend:'Tetsuo',role:'Chief engineer of the Minato Maru',place:'Minato Maru; home with Thuan on Kitano-jima'},
 Thuan:{friend:'Thao',role:'Owner of Sakura Shōten',place:'Sakura Shōten, and the boat home to Kitano-jima',
  islandPersonality:{title:'Neighbourhood spark',traits:['Warm','independent','observant'],habit:'Sets aside a regular’s favourite tea before they ask.',ambition:'Make Sakura the shop every island household can rely on.',favourite:'The last boat home, with the shop’s takings counted'}},
 Thao:{friend:'Thuan'},
 // Nhung is the island doctor since 22 October 2026 (the owner): Dr Kakazu's post, look and patients are hers.
 Nhung:{friend:'Officer Mori',role:'Island doctor and editor of the town paper',place:'The town hall clinic, and the printing bench of the old Front-Row shop in the evenings',
  dailyLife:'Next, please. And then the paper.'},
 'Harbour master':{friend:'Mrs Sato',role:'Harbour agent',place:'Harbour Office and the Minato berth'},
 Chin:{friend:'Tetsuo',role:'Motorman of the Minato Maru and workshop repairman',place:'The engine room and the Chin & Tetsuo workshop',
  islandPersonality:{title:'The careful maker',traits:['Inventive','patient','dry-witted'],habit:'Lines up his tools before touching a new repair.',ambition:'Keep the ship’s diesels and the town’s boats running on the same bench.',favourite:'A finished repair that looks effortless'}},
 Tetsuo:{friend:'Chin',role:'Electrician and radio repairer',place:'Dock Electrical & Repair Workshop, the ferry and the power house'},
 'Officer Mori':{friend:'Nhung',role:'Police officer',place:'Minato Police Station and the night patrol',
  islandPersonality:{title:'A considerate watchman',traits:['Conscientious','composed','lightly amused'],habit:'Checks on an elderly neighbour on the way back to the station.',ambition:'Make the streets feel safe without making them feel watched.',favourite:'A quiet patrol through Main Street'}},
 'Mrs Sato':{friend:'Thao',role:'Ramen cook',place:'Sato Ramen'},
 'Miss Higa':{friend:'Tetsuo',role:'Schoolteacher; keeps the Umi-no-yu bandai in the evenings and at weekends',place:'The island school and the Umi-no-yu bandai',portrait:'assets/images/residents/higa.webp',
  islandPersonality:{title:'Teacher by day, keeper of the bandai by night',traits:['Patient','observant','dry'],habit:'Marks the class’s homework at the bandai between customers.',ambition:'Send every pupil in her class on to the mainland high school able to read, reckon and swim.',favourite:'The rock bath after dark, once the boiler is running sweet'}},
 // Her liquor shop shut on 22 October 2026 (the owner; commerce/higa-liquor.js); its room is Kissa Higa on weekday
 // mornings since 30 October (commerce/kissa-higa.js), and the bath is hers by day.
 'Grandmother Higa':{friend:'Mr Fujita',role:'Owner of Umi-no-yu and Kissa Higa',place:'Umi-no-yu, Kissa Higa on weekday mornings, and her Nishi-machi verandah'},
 'Kōji':{friend:'Ms Uezu',role:'Fisherman and relief bosun',place:'The fish auction quay and his sabani on the west quay',
  islandPersonality:{title:'The keen-eyed sorter',traits:['Quick','observant','ambitious'],habit:'Can spot a mixed crate before it reaches his sorting bench.',ambition:'Bring the sabani in with a catch worth the auction’s first call.',favourite:'The moment the morning catch is laid out'}},
 Riku:{friend:'Vy'},
 Vy:{friend:null,place:'Island school and Harbour Park'},
 // The eleven who joined the guide in phase 5: the ship's people, the port clerk, the doctor and the relief engineer.
 Mac:{friend:'Ms Ganaha',role:'Relief engineer of the Minato Maru',place:'The engine room, and Kitahama Heights A',portrait:'assets/images/residents/mac.webp',
  dailyLife:'She is running fine. She is running my way, which is the same thing.',
  islandPersonality:{title:'The engineer who stayed',traits:['Exacting','loud','loyal'],habit:'Puts his reading glasses on for the gauges and takes them off before anybody sees.',ambition:'Hand the engine room over one day in better order than he found it.',favourite:'The one beer at Minato, counted'}},
 'Ms Uezu':{friend:'Kōji',role:'Bosun of the Minato Maru',place:'The aft deck and the ramp; 8 Kitahama on her week off',portrait:'assets/images/residents/ms-uezu.webp',
  dailyLife:'Lashings checked. Ramp coming up. Whose week is it? Does not matter.',
  islandPersonality:{title:'Deck, not engine room',traits:['Decisive','exact','unbeaten'],habit:'Checks the deck hand’s coils forward before every departure.',ambition:'Run the deck so well that nobody notices it is being run.',favourite:'Supper at Sato Ramen on her week off'}},
 'Ms Ganaha':{friend:'Aya',role:'Port clerk',place:'The ticket, parcel and post window at the Port Terminal',portrait:'assets/images/residents/ms-ganaha.webp',
  dailyLife:'Where are you off to, love? Tickets here, parcels behind me, letters by half past four.',
  islandPersonality:{title:'The window that knows',traits:['Brisk','exact','kind under it'],habit:'Has the parcel shelf sorted before the window opens at noon.',ambition:'Send every traveller to the right island with the right ticket.',favourite:'The early lunch at Sato Ramen before the window opens'}},
 'Mr Fujita':{friend:'Grandmother Higa',role:'Master of the Minato Maru',place:'The bridge; the pier shed and Shiosai after he signs off',portrait:'assets/images/residents/mr-fujita.webp',
  dailyLife:'Shore power on. Signed off. Now the set goes on.',
  islandPersonality:{title:'Sober on watch, loud in the shed',traits:['Steady','stubborn','a cheerful embellisher'],habit:'Cons every berthing himself and keeps the log in his own hand.',ambition:'Bring her alongside on time every day until somebody takes the wheel from him.',favourite:'The first bottle after the shore power goes on'}},
 Ryo:{friend:'Mr Fujita',role:'Chief officer of the Minato Maru',place:'The port wing and the ramp controls',portrait:'assets/images/residents/ryo.webp',
  dailyLife:'Distance off, fifty metres. Yes, Captain. Next time, perhaps.',
  islandPersonality:{title:'The patient second',traits:['Precise','ambitious','even-tempered'],habit:'Checks the berth from the wing at every call and says fifty metres before he is asked.',ambition:'Con the afternoon berthings himself.',favourite:'The last log entry, written with the master'}},
 Ren:{friend:'Kai',role:'Deck hand of the Minato Maru',place:'The forward mooring station and the gangway',portrait:'assets/images/residents/ren.webp',
  dailyLife:'Heaving line away. That one was yours, Kai.',
  islandPersonality:{title:'First ship, first in',traits:['Eager','quick','easily teased'],habit:'Unties every fisherman’s knot Kōji ties, on principle.',ambition:'Have the bosun stop checking his coils.',favourite:'A late bowl at Minato once the shore power is on'}},
 Aya:{friend:'Ms Ganaha',role:'Purser of the Minato Maru',place:'The purser’s window and the lobby',portrait:'assets/images/residents/aya.webp',
  dailyLife:'Fourteen. I counted twice. The bridge has it.',
  islandPersonality:{title:'The count that is always right',traits:['Calm','thorough','a little sharp'],habit:'Counts the last passenger twice and radios the count ashore.',ambition:'A season in which her count and the terminal’s agree every day.',favourite:'Cup noodles from the kiosk between sailings'}},
 Jun:{friend:'Mrs Sato',role:'Cook-steward of the Minato Maru',place:'The galley and the kiosk',portrait:'assets/images/residents/jun.webp',
  dailyLife:'Two sittings. Second helpings are a privilege, not a right.',
  islandPersonality:{title:'A galley is a small country',traits:['Gruff','generous','territorial'],habit:'Secures the galley for every crossing before anybody asks.',ambition:'Have Mrs Sato admit whose stock recipe it is.',favourite:'A smoke on the open deck at three'}},
 Kai:{friend:'Ms Uezu',role:'Kitano line hand',place:'The Kitano pier and the Shiroma house across the lane',portrait:'assets/images/residents/kai.webp',
  dailyLife:'Heaving line! Got it. Now we are talking.',
  islandPersonality:{title:'The shore eyes',traits:['Unhurried','sharp-eyed','dry'],habit:'Stands by on the pier before the crew sign on, hat on.',ambition:'Never once miss a line, and have the bosun admit the after spring was too fast.',favourite:'Lunch at home between calls, twenty-five metres from the bitts'}},
};
const catalogue=Object.entries(ARTICLES).map(([name,article])=>{
 const base={...(byName.get(name)||{name}),...(FIX[name]||{})};
 const photos=article.photos.map((p,i)=>({...p,file:`assets/images/residents/shoot/${slug(name)}-${i+1}.webp`}));
 return {...base,name,bio:article.standfirst,backstory:article.body.join(' '),article:{headline:article.headline,standfirst:article.standfirst,body:article.body,quote:article.quote,photos}};
});
await writeFile(path,JSON.stringify(catalogue,null,1)+'\n');
console.log('Catalogue:',catalogue.length,'residents;',old.length-catalogue.filter(r=>byName.has(r.name)).length,'retired.');
