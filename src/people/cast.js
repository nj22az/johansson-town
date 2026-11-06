import {namesOf} from './roster.js';
/**
 * The cast: everybody who lives on the island, in one list (docs/CAST-PLAN.md).
 *
 * The creator (2026-10-13): "everyone who exists on the island needs a reason to be there", and (2026-10-14)
 * "consolidate and remove unused characters instead make every character have a purpose ... shops that have only a
 * still character is not purposeful". So a person is here only if all four hold, and tests/cast.test.mjs checks them:
 *   1. a home that stands in the world (`home`, a registry id in island-households.js);
 *   2. a purpose the town needs (`purpose`, at `work`); children go to school;
 *   3. a day that takes them through the town (`day`: home, work, a meal or leisure, home);
 *   4. at least three people they love, like, tease or can't stand (RELATIONSHIPS), one of them with some tension.
 *
 * `was` names the figures in the world that become this person (Mrs Higa and Yonamine-sensei become Miss Higa).
 * `alsoAt` is a second home: only duty berths aboard now (Johansson's cabin, Mac's berth), since Thuan's weekday room
 * was dropped (phase 3, addendum 4). Ages are numbers; Johansson, the player, has none.
 * The registry (island-households.js) builds its households from this list; the rest of the code moves over batch by
 * batch (the plan's section 6), and the test names who is still to follow.
 *
 * The consolidation (docs/CAST-CONSOLIDATION.md, roster.js) is switching this list over phase by phase. Phase 2 (the
 * ship): the five supporting crew are people here, with the ship's cabins and Kai's rented house as their homes
 * (`supporting`, so the registry counts them as quarters, not households); Mr Fujita is the master, Chin the
 * motorman, Mac the relief engineer. Phase 3 (the households): Nhung lives at 3 Kitahama with Kōji and Riku; Thuan
 * lives on Kitano-jima only and commutes by the ferry; Kitahama Heights is two ground-floor houses, Mac's and
 * Ms Ganaha's; Thuan owns Sakura outright, which now keeps shop hours; Sakura supplies the flowers and the Port
 * Terminal the post. Phase 4 (the retirements): the ten retired identities of roster.js RETIRED (the Bus driver,
 * Mr Higa Jr, Grandmother Sakurai, Grandmother Chinen, Postman Tōma, Mr Shimabukuro, Mr Ōshiro, Mrs Kinjō, Barfly
 * and Reiko) are no longer in this list, so they have no body, no household, no shift and no nameplate anywhere
 * (castMember returns null for them, and the save migration drops their records); what each did went where the
 * roster says (RETIRED[].transfer): Kōji fishes on his own and Chin mends the boats, Tetsuo keeps the island's
 * electrics, Nhung prints the town's small paper beside the bookshop, the regulars at Minato are the residents
 * themselves. Dr Kakazu retired on 22 October 2026 (the owner): Nhung is the island doctor in his place, and prints the
 * paper in the evenings; Front-Row's books and stationery are Sakura's. Only compatible history stays (Tetsuo's mother was a Chinen; Mr Fujita keeps the old seamen's
 * stories). Phase 5 (the stories and directories): the guide, the feed's places and the Studio tools list exactly this
 * cast; the short display names of the brief (Fuji, Jack, Nao, Koji, Mika, Yui, Tetsu, Aki, Emi, Nils) are the
 * roster's and resolve through castMember, while this list keeps the names the world, its saves and its drawings use.
 */
const person=(name,o)=>Object.freeze({name,sex:o.sex,age:o.age??null,home:o.home,alsoAt:Object.freeze(o.alsoAt||[]),
 purpose:o.purpose,work:o.work,family:o.family||null,was:Object.freeze(o.was||[]),supporting:!!o.supporting,day:Object.freeze(o.day.map(s=>Object.freeze(s)))});

export const CAST=Object.freeze([
 // Johansson's family, on Kitano-jima.
 person('Johansson',{sex:'m',home:'kitano-1',alsoAt:['ferry-chief-cabin'],work:'ferry',family:'Johansson',purpose:'chief engineer of the Minato Maru; shares his primary tropical home with Thuan and keeps his duty cabin aboard',
  day:[['06:30','kitano-1','breakfast with Thuan'],['07:40','ferry','the morning crossing'],['08:30','ferry','the engine room'],['12:00','sato-ramen','lunch'],['13:00','ferry','machinery rounds'],['18:30','ferry','the crossing home'],['19:30','kitano-1','supper and home']]}),
  // Thuan owns and runs Sakura outright (docs/CAST-CONSOLIDATION.md §3) and lives with Johansson on Kitano-jima only
 // (addendum 4): the 08:30 boat in, the shop from nine, the 22:00 boat home (commuter-schedule.js HARBOUR_LINE); Nhung
 // keeps the counter on Sunday while she stays on the island; the shop shuts on Saturdays (commerce/sakura-rota.js).
 person('Thuan',{sex:'f',age:25,home:'kitano-1',work:'sakura',family:'Johansson',purpose:'owns and runs Sakura Shōten: purchasing, accounts, stock, the shop and the supply trade; Johansson’s wife, home on Kitano-jima by the last boat',
  day:[['06:30','kitano-1','breakfast with Johansson'],['08:30','ferry','the morning boat to Minato'],['09:00','sakura','sweeping the pavement at opening',{stand:'sakura-doorstep'}],['09:12','sakura','opening Sakura Shōten: the till, the cooler and the window',{stand:'sakura-floor'}],['13:00','park','lunch in the park with her sisters'],['14:00','sakura','the afternoon till',{stand:'sakura-floor'}],['20:00','izakaya','supper at her sister’s'],['22:00','ferry','the last boat home'],['22:30','kitano-1','home to Kitano-jima']]}),
 // Thao's family, at 1 Kitahama.
 person('Thao',{sex:'f',age:34,home:'kitahama-1',work:'izakaya',family:'Nguyen',purpose:'runs Minato Izakaya; the middle sister',
  day:[['07:00','kitahama-1','breakfast and Vy off to school'],['10:00','market','buying for the izakaya'],['13:00','park','lunch with her sisters'],['16:00','izakaya','opening the izakaya'],['23:30','kitahama-1','home']]}),
 // Chin is the Minato Maru's motorman (the oiler post; roster.js SHIP_POSTS), aboard through the ship's day
 // (ferry-crew.js FERRY_WORKING_DAY: all hands signed on 06:05–23:15, to the last boat back from Kitano-jima, meals in the mess, rest alongside between
 // sailings); the workshop is his between watches and ashore, Tetsuo's bench while she sails. No Sakura duties.
 person('Chin',{sex:'m',age:36,home:'kitahama-1',work:'ferry',family:'Nguyen',purpose:'motorman of the Minato Maru; mechanical repairman at the Chin & Tetsuo workshop between watches; Thao’s husband and Vy’s father',
  day:[['05:30','kitahama-1','breakfast'],['06:05','ferry','signing on: the generators with the chief'],['12:00','ferry','lunch in the mess, alongside'],['13:00','ferry','machinery rounds and the afternoon sailings'],['23:15','izakaya','a late supper at Thao’s counter, off the last boat'],['23:45','kitahama-1','home']]}),
 person('Vy',{sex:'f',age:11,home:'kitahama-1',work:'school',family:'Nguyen',purpose:'Thao and Chin’s daughter; a pupil at the island school',
  day:[['07:00','kitahama-1','breakfast'],['08:15','school','school'],['15:30','park','a walk through Harbour Park after school'],['16:20','park','homework in the park'],['18:30','kitahama-1','home']]}),
 // Nhung lives at 3 Kitahama with Kōji and Riku (docs/CAST-CONSOLIDATION.md §7, phase 3): her room with Reiko at
 // 1 Front-Row Yard is history, their friendship is not. Since 22 October 2026 (the owner) she is the island doctor,
 // Dr Kakazu's post and patients hers (people/clinic-hours.js): surgery weekdays and Saturday morning, and the town's
 // paper in the evening at the back bench of the old Front-Row shop, whose books and stationery Sakura sells now.
 person('Nhung',{sex:'f',age:37,home:'kitahama-3',work:'clinic',family:'Nguyen',purpose:'the island doctor: surgery at the town hall clinic, house calls, on call at night; prints the town’s small paper in the evenings at the old Front-Row shop; the eldest sister; Sakura’s Sunday clerk; Kōji’s wife and Riku’s mother',
  day:[['07:00','kitahama-3','breakfast with Kōji and Riku'],['08:45','clinic','morning surgery'],['12:00','clinic','the morning’s notes, then lunch'],['13:00','park','lunch with her sisters'],['14:00','clinic','afternoon surgery and house calls'],['17:00','sakura','Thuan at Sakura’s counter'],['18:00','kitahama-3','supper with Kōji and Riku'],['19:30','books','the paper’s page at the back bench',{stand:'frontrow-paper'}],['21:00','kitahama-3','home, on call']]}),
 person('Kōji',{sex:'m',age:38,home:'kitahama-3',work:'fish-auction',family:'Nguyen',purpose:'fishes on his own sabani and sorts the catch at the fish auction and the ice plant; the ferry’s relief bosun on Ms Uezu’s week off; drives Sakura Trading’s round in his kei truck on his weeks ashore (Tuesdays and Fridays from 10:30, paid by the round; Higa Liquor’s until it closed; commerce/trade-round.js)',
  day:[['04:30','fish-auction','the morning auction'],['09:00','ice-plant','ice for the boats'],['12:00','kitahama-3','home to sleep'],['15:00','net-ground','the nets at his net ground: mending, and taking them down before dark',{stand:'koji-nets'}],['17:30','boatyard','his own sabani on the west quay'],['18:30','kitahama-3','supper with Nhung and Riku']]}),
 person('Riku',{sex:'m',age:9,home:'kitahama-3',work:'school',family:'Nguyen',purpose:'Nhung and Kōji’s son; a pupil at the island school; Vy’s cousin',
  day:[['07:00','kitahama-3','breakfast'],['08:15','school','school'],['15:30','quay','watching the boats come in'],['17:00','park','football in the park'],['18:30','kitahama-3','home']]}),
 // The Higas, in Nishi-machi.
 person('Miss Higa',{sex:'f',age:29,home:'higa',work:'school',family:'Higa',was:['Mrs Higa','Yonamine-sensei'],purpose:'teaches the island school; keeps the bandai at Umi-no-yu in the evenings and at weekends',
  // On weekdays her breakfast is at her grandmother's counter at Kissa Higa (commerce/kissa-higa.js), and she walks on to
  // school from there.
  day:[['07:00','higa','breakfast with her grandmother'],['07:45','school','the walk to school'],['08:00','school','teaching'],['15:30','school','marking'],['17:00','onsen','the bandai at Umi-no-yu'],['22:00','higa','home']]}),
 // Higa Liquor closed on 22 October 2026 (the owner: Sakura sells and supplies the drink; commerce/higa-liquor.js); the
 // bath is hers by day, from its opening at ten, Yui's from five. Since 30 October 2026 the shut shop is Kissa Higa, hers
 // from 06:45 to 09:50 on weekdays (commerce/kissa-higa.js; canonical-day.js puts her behind its counter), so her garden
 // round starts after her breakfast (up at half past five, canonical-rest.js) and on weekdays ends when she goes down to
 // open the shutter.
 person('Grandmother Higa',{sex:'f',age:78,home:'higa',work:'onsen',family:'Higa',purpose:'owns Umi-no-yu and keeps its bandai by day, 10:00–17:00; keeps Kissa Higa, the morning coffee shop in her old liquor shop on Main Street, 07:00–09:30 on weekdays (the drink is Sakura’s); since 27 October 2026 she keeps the till at Johansson Mart in Kitahama on weekday evenings and Saturdays, when Sakura is shut',
  day:[['06:00','higa','the garden across the lane: the vines, the beds and the altar flowers',{stand:'higa-garden'}],['08:30','higa','the verandah'],['10:00','onsen','the bandai at Umi-no-yu, the bath’s opening'],['12:00','higa','lunch'],['13:00','onsen','the bandai at Umi-no-yu'],['17:00','higa','home to the verandah']]}),
 // The Front-Row yard. Tetsuo keeps the island's electrics since the power house lost its keeper (roster.js RETIRED).
 person('Tetsuo',{sex:'m',age:40,home:'resident-home-kenji',work:'workshop',family:'Chinen',purpose:'radio repairer at the Chin & Tetsuo workshop; the ferry’s electrician under contract; tends the onsen’s boiler and pumps and the power house’s switchboard',
  day:[['07:30','resident-home-kenji','breakfast'],['09:00','workshop','the radio bench'],['13:00','ferry','the ferry’s workshop while she lies alongside'],['18:00','onsen','the boiler lit for the evening and the pumps'],['18:30','higa-bench','a bottle from Sakura on the bench outside the shut Higa Liquor, in earshot of the burner'],['20:00','onsen','the boiler, and closing up at ten'],['22:30','resident-home-kenji','home']]}),
 // The town's people.
 person('Mrs Sato',{sex:'f',age:68,home:'kitahama-2',work:'sato-ramen',family:'Sato',purpose:'cooks at Sato Ramen; buys fish at the morning auction; the izakaya’s rival for the evening crowd',
  day:[['05:30','fish-auction','the morning auction'],['07:00','sato-ramen','the stock pot',{stand:'ramen-stock'}],['11:00','sato-ramen','lunch service',{stand:'ramen-lunch'}],['21:00','kitahama-2','home']]}),
 person('Officer Mori',{sex:'m',age:45,home:'koban',work:'koban',family:'Mori',purpose:'the island’s police officer: the desk at Minato Police Station from four, the night patrol',
  day:[['09:00','koban','asleep after the night patrol'],['13:00','sato-ramen','lunch'],['16:00','koban','the desk',{stand:'station-desk'}],['21:00','main-street','the night patrol'],['02:00','koban','home upstairs at the station']]}),
  // Jack Reed (roster.js: the Harbour master's keys and Mr Fujita's Minato linesman duty since phase 2): the harbour
 // agent, an American former merchant seaman long settled here; the town still calls him the harbour master.
 person('Harbour master',{sex:'m',age:58,home:'office',work:'office',family:'Reed',purpose:'harbour agent: runs the harbour office, the berth radio, the moorings, the cargo yard and the freight book, and takes the Minato Maru’s lines at every call; an American former merchant seaman, long settled here',
  day:[['06:00','office','the morning boats'],['12:00','sato-ramen','ramen, every day'],['13:00','quay','the quay round with the freight book',{stand:'harbour-round'}],['15:00','office','the freight book and the berth radio'],['18:00','office','the evening boat'],['21:00','office','home behind the screen']]}),
 // The ferry and the port.
 // Mac Turner (docs/CAST-CONSOLIDATION.md §4): the relief engineer, renamed from Mr Nakandakari in phase 2 with his new
 // biography; an American who came with the diesels in the seventies and stayed. Kitahama Heights A (the logical id
 // kitahama-flat-3 kept for his saves, addendum 6) and a duty berth aboard.
 person('Mac',{sex:'m',age:61,home:'kitahama-flat-3',alsoAt:['ferry-engineer-duty-berth'],work:'ferry',family:'Turner',was:['Mr Nakandakari'],purpose:'relief engineer of the Minato Maru, an American who came to the island with the Caterpillar diesels in the seventies and stayed; takes the chief’s watch whenever Johansson is ashore; lives in Kitahama Heights A and keeps a duty berth aboard',
  day:[['05:30','ferry','the engine room'],['12:00','ferry','lunch in the mess'],['13:00','ferry','the engine room'],['19:30','higa-bench','half an hour on a crate outside the shut Higa Liquor'],['20:00','izakaya','one beer at Minato'],['21:00','kitahama-flat-3','home']]}),
 person('Ms Uezu',{sex:'f',age:44,home:'kitahama-8',work:'ferry',family:'Uezu',purpose:'bosun of the Minato Maru, a week on (living aboard) and a week off',
  day:[['06:00','ferry','the deck and the ramp'],['12:00','ferry','lunch in the mess'],['13:00','ferry','the deck and the ramp'],['19:00','sato-ramen','supper'],['20:30','kitahama-8','home (in her week off)']]}),
 // The port clerk (docs/CAST-CONSOLIDATION.md §4, §8): tickets, parcels and the postal counter at one window, from noon
 // to the last boat (people/ganaha.js GANAHA); the mailbag and the parcel shelf before it opens. Kitahama Heights B.
 person('Ms Ganaha',{sex:'f',age:27,home:'kitahama-flat-4',work:'port',family:'Ganaha',purpose:'port clerk at the Port Terminal: the Minato Maru’s tickets, parcels and the post, at one window; keeps the coin laundry on the side, its morning round before the mailbag',
  day:[['07:00','kitahama-flat-4','breakfast'],['08:00','coin-laundry','the coin laundry’s morning round: the floor, the filters, the coin boxes and the board',{stand:'laundry-round'}],['09:30','port','the mailbag off the morning boat: parcels on the shelf, letters in the pigeonholes'],['11:15','sato-ramen','an early lunch before the window opens'],['12:00','port','the window: tickets, parcels and post, and the ferry desk telephone'],['22:30','kitahama-flat-4','home']]}),
  // The master (roster.js SHIP_POSTS; phase 2): signed on 06:05–23:15 with the rest of the crew (ferry-crew.js
 // FERRY_WORKING_DAY, master-commute.js walks his one body between the shed and the gangway), sober the whole watch;
 // the shed, the set and the beer only after the shore power (world/fujita-day.js). He still takes the lines when she
 // is not sailing and he is ashore for a soak (the old fisherman's back; Nhung, his doctor, would like him to rest it).
 person('Mr Fujita',{sex:'m',age:63,home:'fujita-houseboat',work:'ferry',family:'Fujita',purpose:'master of the Minato Maru: the bridge from the generators to the shore power, every berthing conned himself, sober on watch; the pier shed and a beer only after he signs off; a fisherman once, with a bad back',
  day:[['05:40','fujita-houseboat','up aboard Shiosai; the kettle on in the shed'],['06:05','ferry','signs on: the bridge, the log and the first sailing'],['12:00','ferry','lunch in the mess, alongside'],['13:00','ferry','the afternoon sailings'],['23:15','fujita-shed','signed off from the last boat: the set and the first bottle in his pier shed'],['00:45','fujita-houseboat','home aboard Shiosai']]}),
 // The supporting crew (roster.js SUPPORTING; docs/CAST-CONSOLIDATION.md §5): the four who live aboard, in the cabins of
 // the ship's general arrangement (island-households.js binds them), and the Kitano line hand in the Shiroma house across
 // the lane from his pier. Their bodies are the ferry's (ferry-crew-aboard.js, ferry-shore-crew.js), not the street's;
 // their days are the ship's working day (ferry-crew.js FERRY_WORKING_DAY), with meals in the mess and an evening ashore.
 person('Ryo',{sex:'m',age:41,home:'ferry-officer-cabin',work:'ferry',family:'Ryo',was:['Chief officer'],supporting:true,purpose:'chief officer of the Minato Maru: the lookout, the ramp and the access; from Itoman, six years on the Kerama ferries before her',
  day:[['05:40','ferry-officer-cabin','up in his cabin'],['06:05','ferry','the bridge: the log, the weather and the berth'],['12:30','ferry','lunch in the mess'],['13:00','ferry','the afternoon sailings from the port wing'],['23:10','ferry','the last log entry with the master'],['23:30','ferry-officer-cabin','his cabin']]}),
 person('Ren',{sex:'m',age:23,home:'ferry-crew-cabin',work:'ferry',family:'Ren',was:['Deck hand'],supporting:true,purpose:'deck hand of the Minato Maru: the forward mooring station, the gangway and the passenger-deck rounds; from Nago, his first ship',
  day:[['05:40','ferry-crew-cabin','up in the deckhand’s cabin'],['06:00','ferry','the forward station and the gangway'],['12:00','ferry','lunch in the mess'],['13:00','ferry','the gangway and the saloon rounds'],['22:30','izakaya','a late bowl at Minato'],['23:30','ferry-crew-cabin','his bunk']]}),
 person('Aya',{sex:'f',age:31,home:'ferry-crew-cabin',work:'ferry',family:'Aya',was:['Purser'],supporting:true,purpose:'the sailing purser of the Minato Maru: the passenger count, the drivers off the vehicle deck and the lobby; came from the Kume line for the short crossings',
  day:[['05:50','ferry-crew-cabin','up in the crew cabin'],['06:10','ferry','the purser’s window and the first count'],['12:30','ferry','lunch in the mess'],['13:00','ferry','the lobby and the afternoon counts'],['23:10','ferry','the day’s takings and the passenger book'],['23:30','ferry-crew-cabin','her bunk']]}),
 person('Jun',{sex:'m',age:52,home:'ferry-crew-cabin',work:'ferry',family:'Jun',was:['Cook-steward'],supporting:true,purpose:'cook-steward of the Minato Maru: the crew’s meals from the three-plate range, the kiosk and the galley secured for every crossing; twenty years in the galleys of the cargo boats out of Naha',
  day:[['05:00','ferry-crew-cabin','up before the generators'],['05:20','ferry','the galley: the crew’s breakfast'],['11:00','ferry','lunch for eight, two sittings'],['15:00','ferry','a smoke on the open deck between sailings'],['21:30','ferry','the galley wiped down and the kiosk counted'],['22:40','ferry-crew-cabin','his bunk']]}),
 person('Kai',{sex:'m',age:47,home:'kitano-2',work:'kitano-pier',family:'Kai',was:['Kitano line hand'],supporting:true,purpose:'the Kitano shore line hand: the shore end of every line at the Kitano berth; rents the Shiroma house across the lane from the pier',
  day:[['06:00','kitano-2','breakfast'],['06:20','kitano-pier','standing by for her lines'],['12:00','kitano-pier','lunch on the pier between calls, on the inner bitt'],['12:40','kitano-pier','the afternoon calls'],['22:30','kitano-2','home']]}),
]);

export const CAST_NAMES=Object.freeze(CAST.map(p=>p.name));
/**
 * A member by the name this list uses, by a name they had before (`was`), or by any name or id the consolidated roster
 * (roster.js) gives them: castMember('Fuji') is Mr Fujita until the phase that renames him here, so stories, saves and
 * looks written under either name find the one body. Nobody the roster knows but this list does not (the supporting
 * crew before phase 2, the retired after phase 4) is null.
 */
export const castMember=name=>CAST.find(p=>p.name===name||p.was.includes(name))||rosterMember(name);
function rosterMember(name){
 const names=namesOf(name);
 return names.length?CAST.find(p=>names.includes(p.name)||p.was.some(w=>names.includes(w)))||null:null;
}
/** The name the live cast uses today for a person known by any of their names, or null while they have no body. */
export const liveNameFor=name=>castMember(name)?.name??null;

/**
 * Who loves, teases and quarrels with whom (docs/CAST-PLAN.md section 4). A pair has a kind, and `tension` when there
 * is something between them that stories can use; `story` is the line a story can quote.
 */
const pair=(a,b,kind,story,tension=null)=>Object.freeze({a,b,kind,story,tension});
export const RELATIONSHIPS=Object.freeze([
 pair('Johansson','Thuan','married','Weekends on Kitano-jima.','His engine-room watches against her shop hours.'),
 pair('Johansson','Tetsuo','friends at the bench','It was a dead radio that first brought him to the workshop.'),
 pair('Johansson','Thao','brother- and sister-in-law','Supper at Minato most evenings.','She says he works too late, and keeps his plate warm anyway.'),
 pair('Thao','Chin','married','Twelve years; they laugh at the counter at closing time.','They bicker about the ship’s hours.'),
 pair('Nhung','Kōji','married','The morning auction against morning surgery.','He smells of fish; she smells of the clinic.'),
 pair('Thuan','Thao','sisters','Rock-paper-scissors in the park.','Borrowed clothes that never come back.'),
 pair('Thuan','Nhung','sisters','Lunch in the park, all three.','The eldest who knows best.'),
 pair('Thao','Nhung','sisters','Nhung says Thao is stubborn; Thao says she is right.','Who is stubborn and who is right.'),
 pair('Thao','Vy','mother and daughter','Breakfast and the school run.','Homework against ice cream.'),
 pair('Chin','Vy','father and daughter','He mends whatever she breaks.'),
 pair('Nhung','Riku','mother and son','Bedtime stories, and the stethoscope he is not allowed to borrow.'),
 pair('Kōji','Riku','father and son','Riku wants to go out on the boat.','Riku is not allowed on the boat until he can swim to the buoy.'),
 pair('Vy','Riku','cousins and classmates','The only two in the class with the same grandmother.','A rivalry at school.'),
 pair('Miss Higa','Tetsuo','a slow spark','At the onsen after hours: he fixes the boiler, she pretends not to watch.','Neither will say it.'),
 pair('Miss Higa','Grandmother Higa','granddaughter and grandmother','The Higa house and the bath.','Grandmother wants her married.'),
 pair('Miss Higa','Vy','teacher and pupil','Vy asks the most questions.'),
 pair('Miss Higa','Riku','teacher and pupil','Riku talks in class.','He is moved to the front row every week.'),
 pair('Grandmother Higa','Tetsuo','employer','He keeps her boiler running for a bath and supper.','She pushes her granddaughter at him.'),
 pair('Mrs Sato','Harbour master','old flames','Widow and widower; he eats her ramen every day and never says why.','The thing they never say.'),
 pair('Thao','Mrs Sato','rivals','The evening crowd: izakaya against ramen.','They fall out, then make up over a delivery.'),
 pair('Chin','Tetsuo','partners','The workshop, since school; Tetsuo keeps the bench while Chin is aboard.','The odd quarrel over a botched job.'),
 pair('Kōji','Ms Uezu','deck hands','He relieves her every other week.'),
 pair('Mac','Tetsuo','relief engineer and contract electrician','The ship’s switchboard.','Mac guards his switchboard.'),
 pair('Mac','Ms Uezu','engine room and deck','The ferry’s two halves.','Deck against engine room, every day.'),
 pair('Ms Ganaha','Mr Fujita','the port','The ticket window and the lines.'),
 pair('Mr Fujita','Grandmother Higa','an onsen regular','A soak for his back whenever the sailings let him.','He says the bath is never hot enough.'),
 // Dr Kakazu's patients are Nhung's since 22 October 2026.
 pair('Mr Fujita','Nhung','patient and doctor','His back.','He will not rest it.'),
 pair('Nhung','Mrs Sato','the doctor everyone feeds','The bowl Mrs Sato sends over when surgery runs late, which Nhung is not allowed to pay for.'),
 pair('Nhung','Grandmother Higa','doctor and patient','Her blood pressure.','She ignores Nhung’s advice.'),
 pair('Harbour master','Mr Fujita','harbour master and linesman','Every call of the Minato Maru.'),
 // Phase 4 (roster.js RETIRED): the pairs that replace the retired people's. Nhung's paper takes Reiko's place with
 // Officer Mori; Mac is the night patrol's beer count at Minato; the two Heights neighbours; the port's two clerks.
 pair('Nhung','Officer Mori','the paper, the law and the night telephone','She wants his stories for the town’s paper; after dark both are on call.','He wants her to print fewer of them.'),
 pair('Officer Mori','Mac','the late hours','Mori stops at Minato on the night patrol; Mac has his one beer there.','Mori counts it.'),
 pair('Officer Mori','Mrs Sato','lunch at one','The same shoyu ramen every day of the year.','She wants him to try the miso once.'),
 pair('Ms Ganaha','Harbour master','the ferry desk and the office radio','The sailing list and the berth, every call.','Who tells the passengers why she is late.'),
 pair('Ms Ganaha','Mac','next door at the Heights','A and B, one roof.','His generator stories through the party wall.'),
 // The supporting crew (phase 2): the ship's two departments and the shore ends of her lines.
 pair('Ryo','Mr Fujita','master and chief officer','The log and the lookout, every call.','Fujita cons every berthing himself; Ryo wants the afternoon ones.'),
 pair('Ryo','Ms Uezu','bridge and deck','The ramp orders from the port wing.','Who counts the cars.'),
 pair('Ryo','Harbour master','the berth on the radio','Distance off and the berth, every call.'),
 pair('Ren','Ms Uezu','deck hand and bosun','Forward and aft.','She checks his coils.'),
 pair('Ren','Kōji','the forward station on Kōji’s weeks','Kōji ties a fisherman’s knot and Ren unties it.'),
 pair('Ren','Aya','the gangway and the count','The last passenger, counted twice.','Whose count is right.'),
 pair('Aya','Ms Ganaha','the ticket window and the purser’s window','The passenger count by radio before every departure.','A count that does not match.'),
 pair('Aya','Jun','the lobby and the kiosk','Cup noodles and the hot-water dispenser.'),
 pair('Jun','Mrs Sato','two cooks','Her stock recipe, which he says is his.','Whose stock it is.'),
 pair('Jun','Mr Fujita','the master’s tea','Tea on the bridge at every call.'),
 pair('Jun','Chin','the mess','The motorman’s second helping.'),
 pair('Kai','Ms Uezu','the Kitano lines','Her stern line and his bitt.','The after spring, which he says she pays out too fast.'),
 pair('Kai','Ren','the shore eye and the heaving line','Forward lines at Kitano.'),
 pair('Kai','Thuan','neighbours in Kitano hamlet','The Shiroma house across the lane from hers.'),
]);

/** Everyone who is in a pair with `name`, and the pair. */
export const relationshipsOf=name=>RELATIONSHIPS.filter(r=>r.a===name||r.b===name).map(r=>({with:r.a===name?r.b:r.a,...r}));

/**
 * The places that are open, and who keeps each (the creator: a place with only a still figure has no purpose; a
 * place nobody keeps is closed, merged or removed). `closed` places stand, shut, until the plan's batch 5 decides.
 */
export const PLACES=Object.freeze({
 sakura:{name:'Sakura Shōten, with the books and stationery Front-Row sold',keepers:['Thuan','Nhung']},
 izakaya:{name:'Minato Izakaya',keepers:['Thao','Chin']},
 'sato-ramen':{name:'Sato Ramen',keepers:['Mrs Sato']},
 // The shop floor closed on 22 October 2026 (its stock is Sakura's); the back bench prints the paper in the evenings.
 books:{name:'The town’s paper, at the old Front-Row shop',keepers:['Nhung']},
 workshop:{name:'Chin & Tetsuo Repairs',keepers:['Chin','Tetsuo']},
 office:{name:'Harbour Office, the cargo yard and the freight book',keepers:['Harbour master']},
 koban:{name:'Minato Koban',keepers:['Officer Mori']},
 clinic:{name:'Town hall clinic',keepers:['Nhung']},
 'town-hall':{name:'Town hall',keepers:['Nhung']},
 school:{name:'The island school',keepers:['Miss Higa']},
 onsen:{name:'Umi-no-yu',keepers:['Grandmother Higa','Miss Higa','Tetsuo']},
 // The owner, 21 October 2026: the coin laundry gets a keeper from the cast (commerce/coin-laundry.js LAUNDRY_KEEPER).
 'coin-laundry':{name:'Coin laundry',keepers:['Ms Ganaha']},
 zenzai:{name:'Nakamura Zenzai',closed:'The dessert counter is vacant until it has a keeper'},
 'blue-coral':{name:'Blue Coral',closed:'The dessert counter is vacant until it has a keeper'},
 // Unmanned since phase 4: Tetsuo keeps its switchboard under contract, as he keeps the ship's and the bathhouse's.
 'power-station':{name:'Power station',keepers:['Tetsuo']},
 // Kōji's own sabani on the west quay; Chin mends the boats between watches.
 boatyard:{name:'Boatyard',keepers:['Kōji','Chin']},
 'fish-auction':{name:'Fish auction and the ice plant',keepers:['Kōji']},
 ferry:{name:'Minato Maru',keepers:['Johansson','Mr Fujita','Mac','Chin','Ms Uezu','Kōji','Tetsuo','Ryo','Ren','Aya','Jun']},
 // The post and the parcels are Ms Ganaha's window (phase 3); the round went with the postman (phase 4).
 port:{name:'Port Terminal',keepers:['Ms Ganaha','Mr Fujita']},
 'kitano-pier':{name:'Kitano-jima ferry pier',keepers:['Kai']},
 warehouse:{name:'Quay Warehouse and the Sakura depot',keepers:['Harbour master','Thuan']},
 // The owner, 22 October 2026: Higa Liquor closes; Sakura sells and supplies all the alcohol (commerce/higa-liquor.js).
 // 30 October 2026: the room is Kissa Higa, Grandmother Higa's in the mornings (commerce/kissa-higa.js).
 'kissa-higa':{name:'Kissa Higa',keepers:['Grandmother Higa']},
 // Nobody keeps these any more (docs/CAST-PLAN.md section 3, who goes).
 'yonamine-fish':{name:'Yonamine Fresh Fish',closed:'Mrs Yonamine has gone; the morning catch is sold at the auction'},
 'aragaki-sweets':{name:'Aragaki Confectionery',closed:'Mr Arakaki has gone'},
 'hoshizaki-store':{name:'Hoshizaki village store',closed:'Mina has gone'},
 'fumoto-co-op':{name:'Fumoto co-op',closed:'Fumoto stays as fields'},
});
