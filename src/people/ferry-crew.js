import {FERRY_MANNING,FERRY_DAY} from '../world/ferry-ship.js';
import {SHIP_POSTS,SHORE_ROLES,shipPostKey} from './roster.js';
import {liveNameFor} from './cast.js';

/**
 * The eight posts of the game's manning plan (world/ferry-ship.js FERRY_MANNING) and who holds each: the holders are the
 * consolidated roster's (people/roster.js SHIP_POSTS, docs/CAST-CONSOLIDATION.md §9), resolved to the name the live cast
 * uses today (cast.js liveNameFor), so a display-name change in cast.js never changes who is signed on. Nobody is
 * invented for a post and no post has an anonymous body: the five who were job roles are people (Ryo, Ren, Aya, Jun,
 * Kai), with cabins aboard and, for Kai, the Shiroma house.
 *
 * Her working day (FERRY_WORKING_DAY). The ship is in service from the generators at 06:10 to the shore power at 23:10
 * (FERRY_DAY), and she sails her timetable within it (world/ferry-timetable.js), the last boat back from Kitano-jima
 * at 22:45, so the crew keep one long day aboard, the way a small island ferry's crew does: all eight signed on from 06:05, every station manned when she moves, rest and meals alongside between
 * sailings (the `waiting` watch below), everyone off at 23:15 once the log is written. The bosun's week on and week off
 * (Kōji's relief weeks) and the relief engineer's cover for the chief (ferry-crew-aboard.js) are the only reliefs the
 * roster has, so a day off for the rest is not modelled; nobody holds two stations at once. The master is sober for the
 * whole of it: Fujita's shed, the set and the beer begin after he signs off (world/fujita-day.js reads this constant).
 */
export const FERRY_WORKING_DAY=Object.freeze({signOn:FERRY_DAY.generators-5,signOff:FERRY_DAY.shorePower+5});
const minute=m=>((m%1440)+1440)%1440;
/** Whether the crew are signed on at this town minute: aboard, at their stations or resting alongside. */
export const onWatch=minutes=>{const m=minute(minutes);return m>=FERRY_WORKING_DAY.signOn&&m<FERRY_WORKING_DAY.signOff;};

/** What each post does and where its holder sleeps; the biographies the "Talk to" prompt aboard shows. */
const people={
 master:{known:'the master',
  why:'Fujita, the master: forty years on the island boats, the last ten on the Harbour Line, and the fourth-grade ticket he sat for at fifty. He cons every berthing himself and keeps the log. Sober on watch, from the generators at ten past six to the shore power at a quarter past ten; the shed, the television and the beer are for after he signs off.',
  lives:'Shiosai, his houseboat at the west pier; the master’s cabin aboard is his day cabin'},
 mate:{known:'the chief officer',
  why:'Ryo, 41, chief officer, from Itoman: a fifth-grade deck licence and six years on the Kerama ferries before the Minato Maru. He keeps the lookout, supervises access and works the ramp controls, and checks the berth from the wing while the master stays at the conning position.',
  lives:'The chief officer’s cabin aboard'},
 chief:{known:'the chief engineer',
  why:'Chief engineer of the Minato Maru; responsible for the machinery, engineering watches and maintenance alongside his relief engineer, Mac Turner, who takes the working watch whenever the chief is ashore.',
  lives:'Duty cabin aboard; primary home with Thuan on Kitano-jima',trait:'Careful engineer and patient mentor'},
 oiler:{known:'the motorman',
  why:'Chin, the motorman: Thao’s husband and the island’s mechanical repairman, who took the engine-room rating post when it came free. He tends the diesels, the bilges and the lubricating oil under the chief, and keeps the workshop with Tetsuo between watches; while she sails, Tetsuo keeps the bench alone.',
  lives:'1 Kitahama, with Thao and Vy'},
 bosun:{known:'the bosun',
  why:'The bosun supervises the deck work, the aft mooring lines and vehicle securing. Ferry work runs in her family; she does a week on and a week off, with Kōji covering her relief week.',
  lives:'8 Kitahama; aboard in the crew cabin on her week on'},
 deck:{known:'the deck hand',
  why:'Ren, 23, deck hand, from Nago, on his first ship. He works the forward mooring station and the passenger gangway, then makes the passenger-deck rounds. Keeping this post separate leaves the bosun free to work aft.',
  lives:'The deckhand’s cabin aboard'},
 purser:{known:'the purser',
  why:'Aya, 31, the sailing purser, who came from the Kume line for the short crossings. She counts the passengers, checks that drivers leave the vehicle deck and answers questions in the lobby. The passenger count goes to the bridge before departure.',
  lives:'The crew accommodation aboard'},
 cook:{known:'the cook-steward',
  why:'Jun, 52, cook-steward, after twenty years in the galleys of the cargo boats out of Naha. He prepares the crew’s meals on the three-plate range and attends to refreshments at the kiosk. Before departure the galley equipment and loose stores are secured for the crossing.',
  lives:'The crew accommodation aboard'},
};
const holder=post=>SHIP_POSTS.find(p=>p.key===shipPostKey(post));
/** The live name of a roster holder: the body the cast gives them today (Mr Fujita for Fuji until phase 5 renames him). */
const live=id=>liveNameFor(id)||id;
export const FERRY_CREW=Object.freeze(FERRY_MANNING.map(({post,title,jp,licence})=>{
 const p=holder(post);
 return Object.freeze({post,title,jp,name:live(p.holder),...people[post],supporting:!!p&&['mate','deck','purser','cook'].includes(post),licence:'Game manning plan: '+licence});
}));
/** The reliefs the roster has: Kōji for the bosun's week off, Mac for the chief whenever the player is ashore. */
const bosunRelief=Object.freeze({name:live(holder('bosun').relief),why:'He knows the island boats, lines and weather, and covers Ms Uezu’s relief week as bosun.'});
export const FERRY_RELIEF=Object.freeze({
 bosun:bosunRelief,
 chief:Object.freeze({name:live(holder('chief').relief),why:'Mac Turner, the relief engineer: takes the chief’s working watch in the engine room whenever Johansson is ashore, and keeps a duty berth aboard.'}),
 // The old deck rota lookup remains an alias; the signed-on post is correctly called bosun.
 deck:bosunRelief,
});

/** The shore roles (roster.js SHORE_ROLES): where each holder is and what they do for the ship. */
const shore={
 tickets:{where:'The Port Building’s waiting hall',does:'Sells tickets, keeps the post and parcel counter and gives the passenger count to the purser'},
 linesman:{where:'The Harbour Office and the ferry bitts on the outer pier',does:'Walks from the office to the bitts before every call to handle the shore end of each line, and keeps the berth radio between calls',
  why:'Jack Reed, the harbour agent: an American who came to Okinawa as a merchant seaman in the sixties, paid off in Naha and never went home; thirty years on this quay, the berth and the office radio, the freight book, and the shore end of every line since Fujita went to the bridge.'},
 port:{where:'The Harbour Office',does:'Gives the berth and keeps the port radio'},
 'relief-engineer':{where:'Minato Maru and Kitahama Heights A',does:'Relieves Johansson on machinery watches; keeps a separate duty berth aboard',
  why:'Mac Turner, 61, relief engineer: an American who came to the island with the diesels, Caterpillars for the Naha fishing boats in the seventies, and stayed for the quiet; a house in Kitahama Heights and a duty berth aboard.'},
 electrician:{where:'The electrical workshop aboard, alongside at Minato',does:'Maintains the ferry’s electrical equipment while she is in port'},
 'airport-linesman':{where:'Kitano-jima ferry pier',does:'Handles the shore eyes at the Kitano berth',
  why:'Kai, 47, the Kitano line hand: born in the hamlet, a deckhand on the Naha boats until his knees, and back on the pier he grew up beside; the shore end of every line at Kitano, and the Shiroma house across the lane, rented from the family in Naha.'},
};
export const FERRY_SHORE=Object.freeze(SHORE_ROLES.map(r=>Object.freeze({post:r.key,title:r.title,name:live(r.holder),...shore[r.key],supporting:r.key==='airport-linesman'})));

const waiting={
 master:['wheelhouse','Keeps the log and watches the berth from the wheelhouse'],
 mate:['port-wing','Checks traffic and the landing before supervising the ramp'],
 chief:['engine-room','Checks the plant and switchboard before accepting a departure order'],
 oiler:['engine-room','Checks the machinery, bilges and lubricating oil'],
 bosun:['car-deck','Supervises vehicle parking and wheel securing'],
 deck:['gangway','Supervises the gangway and gives passengers a hand with their bags'],
 purser:['purser','Checks tickets, the passenger count and the passenger exits'],
 cook:['mess','Prepares meals and secures the galley’s loose equipment'],
 tickets:['waiting-hall','Sells tickets and sends the count to the purser aboard'],
};
const manoeuvring={...waiting,
 master:['wheelhouse','Cons the ship alongside and gives the mooring orders'],
 mate:['port-wing','Reports distance off the berth and keeps a lookout'],
 bosun:['stern','Works the after mooring lines with the shore line hand'],
 deck:['bow','Works the forward mooring lines from the forecastle'],
 linesman:['quay','Walks to each bitt and handles the shore end of the line'],
};
const crossing={...waiting,
 master:['wheelhouse','Keeps the navigation watch and watches for fishing boats'],
 mate:['port-wing','Keeps a lookout and checks the bridge instruments'],
 oiler:['steering-gear','Makes the machinery rounds and checks temperatures and pressures'],
 bosun:['car-deck','Checks the secured vehicles and keeps the vehicle deck clear'],
 deck:['saloon','Checks passenger exits and helps passengers in the saloon'],
 purser:['purser','Attends the passengers from the lobby'],
 cook:['kiosk','Attends to refreshments and checks the galley'],
};
/** Default watches. Live operation tasks take precedence and are reached by walking. */
export const FERRY_WATCH=Object.freeze(Object.fromEntries(Object.entries({
 waiting,arriving:manoeuvring,reversing:manoeuvring,swinging:manoeuvring,leaving:crossing,crossing,
 // After the shore power goes on: the chief sleeps aboard in his duty cabin, the bosun in the crew cabin on her week on
 // (her relief goes home to 3 Kitahama); the four who live aboard have turned in and are not drawn.
 night:{chief:['mess','Aboard on shore power, checking the machinery before bed'],bosun:['cabin','Resting in the crew cabin during the working week']},
}).map(([key,value])=>[key,Object.freeze(value)])));
const DAY=1440;
export const rotaWeek=minutes=>((Math.floor(Math.floor(minutes/DAY)/7)%2)+2)%2;
export const bosunFor=minutes=>rotaWeek(minutes)===0?FERRY_CREW.find(c=>c.post==='bosun').name:FERRY_RELIEF.bosun.name;
/** Legacy rota API, retained for existing stories and saved references. */
export const deckHandFor=bosunFor;
export function crewFor(post,minutes=0){
 const key=shipPostKey(post);
 if(key==='bosun')return bosunFor(minutes);
 return FERRY_CREW.find(c=>c.post===key)?.name||FERRY_SHORE.find(s=>s.post===key)?.name||null;
}
export const crewOnDuty=(minutes=0)=>FERRY_CREW.map(c=>({post:c.post,title:c.title,jp:c.jp,name:crewFor(c.post,minutes),supporting:c.supporting}));
export function crewDoing(phase,minutes=0){
 const watch=FERRY_WATCH[phase];if(!watch)throw new RangeError('Unknown ferry phase '+phase);
 return Object.entries(watch).map(([post,[where,doing]])=>({post,name:crewFor(post,minutes),where,doing}));
}
/** Everyone the ship signs on, ashore and aboard: all of them people of the cast (cast.js), none invented. */
export const FERRY_PEOPLE=Object.freeze([...new Set([...FERRY_CREW.map(c=>c.name),FERRY_RELIEF.bosun.name,FERRY_RELIEF.chief.name,...FERRY_SHORE.map(s=>s.name)])]);
