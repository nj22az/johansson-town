/**
 * The consolidated cast, as data (docs/CAST-CONSOLIDATION.md: the owner's brief of 19 October 2026, the addendum
 * winning where they differ). One identity record per person: 18 core and 5 supporting identities, the thirteen retired
 * ones and where their purpose went, the 12 core households, the supporting quarters, the eight ship posts and the
 * shore roles. This is what the phases switch the game over to (the brief, "How it is run": 2 the ship, 3 the
 * households, 4 the removals, 5 the stories and directories, all done). The game reads it for name resolution (cast.js
 * castMember, renamed.js formerNames, avatars/cast.js recipeFor) and the save migration (save.js migrateCast); from
 * phase 2 the ferry's manning (people/ferry-crew.js) reads the ship posts and shore roles from it, so who holds each
 * post is decided here and only here. Who walks, works and sleeps where is still cast.js.
 *
 * `id` is a stable machine key, never shown and never the same string as a name. `name` is the short display name
 * the brief gives; `fullName` the profile's full name only where the source or the brief has one (nothing invented);
 * `was` the historical names, oldest last, which keep resolving: the name cast.js uses today is among them until the
 * phase that renames the person. `home` is the primary home (a registry id, island-households.js), `berth` duty
 * accommodation aboard, `room` a secondary shore room (none now: Thuan's weekday room is dropped, addendum 4), and
 * `oldHomes` the home ids the person no longer has, for the save migration. `avatar` names the authored look World
 * draws them as until a later phase decides otherwise (Jack and Mac keep the looks of the people they replace; the
 * supporting crew have recipes of their own since phase 2, avatars/cast.js CREW_LOOKS).
 *
 * Reconciled against the source, 19 October 2026 (the brief asks for one plan, not two):
 *  - Yui, Aya and Nao, three of the brief's display names, are the sisters' names in the oldest saves (renamed.js:
 *    Yui and Yuri were Thuan, Aya was Nhung, Nao was Thao). Those are save-era aliases only: they are not `was` here,
 *    and save.js applies them once, to saves written before this roster (castRevision 1). From this roster on Yui is
 *    the teacher, Aya the purser and Nao the bosun. The old townsfolk drawing Emi (profiles.json) remains historical artwork.
 *    Emi Nakamura and Mai retired on 31 October 2026, with every name of theirs resolving to the retired record.
 *  - The manning plan's post key stays `oiler` (world/ferry-ship.js FERRY_MANNING; ferry-operations.js tasks and
 *    scenarios key on it). The post's title is Motorman; SHIP_POST_ALIASES maps `motorman` to it, the brief's
 *    compatibility layer, so no machinery task or safe-departure check changes with the label.
 *  - Jack takes both of the Harbour master's shore keys (`port`: the berth and the office radio) and Mr Fujita's
 *    `linesman` at Minato, since Fuji goes to the bridge. Kai keeps `airport-linesman`.
 *  - Kai's home: the brief (§10) recommends kitano-2, the vacant Shiroma house, if its access and interior suit. Phase 2
 *    inspected it (world/kitano-hamlet.js): a walled plot with its gate on the hamlet lane, a concrete house with the
 *    family-home interior every Kitahama house has (world/interiors/family-home.js: a bed, a table, a door), its
 *    nameplate and visit prompt, 25 m from the pier he works. He rents it from the Shiromas in Naha. It is recorded
 *    as supporting accommodation (QUARTERS, the registry's `quarters` flag), outside the core households.
 *  - Ages and sexes come from cast.js. Jack and Mac carry the ages of the identities they replace (58 and 61); the
 *    brief gives none. Dr Ken's full name joins the brief's display name to the source's surname Kakazu. The
 *    supporting crew's ages are phase 2's (cast.js gives everybody one).
 *  - The aboard quarters of the supporting crew (QUARTERS) are the brief's "existing officer/crew accommodation
 *    aboard", bound in phase 2 to the ship's cabins (world/ferry-ship.js FERRY_GA, people/island-households.js). As
 *    drawn she has berths for the mate (his cabin), the deck hand (the deckhand's cabin) and two in the crew cabin,
 *    the bosun's on her week on and the relief engineer's duty berth; the purser's and the cook's berths are two more
 *    bunks in the crew cabin that the docks-and-boats job draws (recorded in QUARTERS, not invented here).
 *  - Display names: the live cast still calls Fuji, Jack, Nao and Koji by their former names (castMember resolves
 *    both); phase 5's directory and story sweep renames them with the rest of the cast. Mac is renamed in phase 2,
 *    since a Japanese surname on an American relief engineer's prompt would contradict his biography.
 */
const who=(id,o)=>Object.freeze({id,name:o.name,fullName:o.fullName||o.name,category:o.category||'core',sex:o.sex,
 age:o.age??null,nationality:o.nationality||null,was:Object.freeze(o.was||[]),avatar:o.avatar||null,role:o.role,
 post:o.post||null,relief:o.relief||null,shore:Object.freeze(o.shore||[]),home:o.home||null,berth:o.berth||null,
 room:o.room||null,oldHomes:Object.freeze(o.oldHomes||[]),household:o.household===undefined?o.home||null:o.household});

/** The core residents (brief §4: 21, less Dr Ken and the retired Nakamura family), in the brief's order. */
export const CORE=Object.freeze([
 who('nils',{name:'Nils',fullName:'Nils Johansson',sex:'m',nationality:'Swedish',was:['Johansson'],avatar:'Johansson',post:'chief',home:'kitano-1',berth:'ferry-chief-cabin',oldHomes:['ferry'],
  role:'the player; Swedish chief engineer of the Minato Maru; married to Thuan'}),
 who('thuan',{name:'Thuan',sex:'f',age:25,nationality:'Vietnamese',was:['Yuri'],avatar:'Thuan',home:'kitano-1',oldHomes:['kitahama-1'],
  role:'owns and runs Sakura Shōten outright: purchasing, accounts, stock, shop and supply; Nils’s wife; sister of Thao and Nhung'}),
 who('thao',{name:'Thao',sex:'f',age:34,nationality:'Vietnamese',avatar:'Thao',home:'kitahama-1',
  role:'runs Minato Izakaya; Chin’s wife and Vy’s mother; the middle sister'}),
 who('chin',{name:'Chin',sex:'m',age:36,was:['Kenji'],avatar:'Chin',post:'oiler',home:'kitahama-1',
  role:'motorman aboard the Minato Maru; mechanical repairman at the workshop with Tetsu when ashore; Thao’s husband and Vy’s father'}),
 who('vy',{name:'Vy',sex:'f',age:11,avatar:'Vy',home:'kitahama-1',role:'Thao and Chin’s daughter; a pupil at the island school'}),
 who('nhung',{name:'Nhung',sex:'f',age:37,nationality:'Vietnamese',avatar:'Nhung',home:'kitahama-3',oldHomes:['resident-home-aya'],
  role:'the island doctor (the owner, 22 October 2026: the clinic doctor’s look and post are hers, Dr Ken retired into her): surgery at the town hall clinic weekdays and Saturday mornings, house calls, on call at night; prints the town’s small paper in the evenings at the back bench of the old Front-Row shop; Sakura’s Sunday clerk; the eldest sister; Koji’s wife and Riku’s mother'}),
 who('koji',{name:'Koji',fullName:'Kōji',sex:'m',age:38,was:['Kōji'],avatar:'Kōji',relief:'bosun',home:'kitahama-3',
  role:'fisherman and the bosun’s relief; drives Sakura Trading’s round in his kei truck on his weeks ashore, paid by the round (Higa Liquor’s until it closed, 22 October 2026); Nhung’s husband and Riku’s father'}),
 who('riku',{name:'Riku',sex:'m',age:9,avatar:'Riku',home:'kitahama-3',role:'Nhung and Koji’s son; a pupil at the island school; Vy’s cousin'}),
 who('yui',{name:'Yui',fullName:'Yui Higa',sex:'f',age:29,nationality:'Japanese',was:['Yonamine-sensei','Mrs Higa','Miss Higa'],avatar:'Miss Higa',home:'higa',
  role:'the island’s schoolteacher; Gran Higa’s granddaughter; helps at the bathhouse after school and at weekends'}),
 who('gran-higa',{name:'Gran Higa',fullName:'Grandmother Higa',sex:'f',age:78,nationality:'Japanese',was:['Grandmother Higa'],avatar:'Grandmother Higa',home:'higa',
  role:'owns Umi-no-yu and keeps it by day; her liquor shop is shut, its trade Sakura’s (the owner, 22 October 2026), and its room is Kissa Higa, her morning coffee shop on weekdays (30 October 2026); the family’s ties in town'}),
 who('tetsu',{name:'Tetsu',fullName:'Tetsuo Chinen',sex:'m',age:40,nationality:'Japanese',was:['Tetsuo'],avatar:'Tetsuo',shore:['electrician'],home:'resident-home-kenji',
  role:'electrician; workshop partner of Chin; maintains the ship’s electrical equipment, the bathhouse’s plant and the island’s electrical systems'}),
 who('aki',{name:'Aki',fullName:'Aki Sato',sex:'f',age:68,nationality:'Japanese',was:['Mrs Sato'],avatar:'Mrs Sato',home:'kitahama-2',
  role:'owns Sato Ramen, which keeps its name; stays ashore'}),
 who('mori',{name:'Mori',fullName:'Officer Mori',sex:'m',age:45,nationality:'Japanese',was:['Officer Mori'],avatar:'Officer Mori',home:'koban',
  role:'the island’s police officer; the desk and the night patrol; his accommodation moves into the police station to come (addendum 1), koban staying his home id'}),
 who('fuji',{name:'Fuji',fullName:'Fujita',sex:'m',age:63,nationality:'Japanese',was:['Mr Fujita'],avatar:'Mr Fujita',post:'master',home:'fujita-houseboat',
  role:'master of the Minato Maru; sober on watch, the shed and the beer only after he signs off; lives aboard Shiosai'}),
 who('jack',{name:'Jack',fullName:'Jack Reed',sex:'m',age:58,nationality:'American',was:['Harbour master'],avatar:'Harbour master',shore:['port','linesman'],home:'office',
  role:'harbour agent: berth communications, freight and Minato’s shore-side mooring; an American former merchant seaman, long settled here'}),
 who('mac',{name:'Mac',fullName:'Mac Turner',sex:'m',age:61,nationality:'American',was:['Mr Nakandakari'],avatar:'Mr Nakandakari',relief:'chief',shore:['relief-engineer'],home:'kitahama-flat-3',berth:'ferry-engineer-duty-berth',oldHomes:['ferry'],
  role:'relief engineer of the Minato Maru; an older American engineer, an established island resident; a shore home and a separate duty berth'}),
 who('nao',{name:'Nao',fullName:'Nao Uezu',sex:'f',age:44,nationality:'Japanese',was:['Ms Uezu'],avatar:'Ms Uezu',post:'bosun',home:'kitahama-8',
  role:'bosun of the Minato Maru; a shore home and a credible relief rota with Koji'}),
 who('mika',{name:'Mika',fullName:'Mika Ganaha',sex:'f',age:27,nationality:'Japanese',was:['Ms Ganaha'],avatar:'Ms Ganaha',shore:['tickets'],home:'kitahama-flat-4',
  role:'port clerk: passenger tickets, parcels and the postal counter, all at the Port Terminal; keeps the coin laundry on the side, its morning round before the mailbag (the owner, 21 October 2026)'}),
]);

/** The five existing crew and pier workers, now named (brief §5). Their quarters are not households. */
export const SUPPORTING=Object.freeze([
 who('ryo',{name:'Ryo',category:'supporting',sex:'m',age:41,nationality:'Japanese',was:['Chief officer'],avatar:'Ryo',post:'mate',berth:'ferry-officer-cabin',household:null,role:'chief officer of the Minato Maru: the lookout, access and the ramp; from Itoman, six years on the Kerama ferries before her'}),
 who('ren',{name:'Ren',category:'supporting',sex:'m',age:23,nationality:'Japanese',was:['Deck hand'],avatar:'Ren',post:'deck',berth:'ferry-crew-cabin',household:null,role:'deck hand: the forward mooring station, the gangway and passenger-deck rounds; from Nago, his first ship'}),
 who('aya',{name:'Aya',category:'supporting',sex:'f',age:31,nationality:'Japanese',was:['Purser'],avatar:'Aya',post:'purser',berth:'ferry-crew-cabin',household:null,role:'the sailing purser: the passenger count, the vehicle deck and the lobby; came from the Kume line for the short crossings'}),
 who('jun',{name:'Jun',category:'supporting',sex:'m',age:52,nationality:'Japanese',was:['Cook-steward'],avatar:'Jun',post:'cook',berth:'ferry-crew-cabin',household:null,role:'cook-steward: the crew’s meals, the galley and the kiosk; twenty years in the galleys of the cargo boats out of Naha'}),
 who('kai',{name:'Kai',category:'supporting',sex:'m',age:47,nationality:'Japanese',was:['Kitano line hand'],avatar:'Kai',shore:['airport-linesman'],home:'kitano-2',household:null,role:'the Kitano shore line hand: the shore eyes at the Kitano berth every call; rents the Shiroma house across the lane from the pier'}),
]);

export const ROSTER=Object.freeze([...CORE,...SUPPORTING]);

/**
 * The retired core identities (brief §6's ten, and Dr Ken on 22 October 2026): who takes over what they did, and the home each leaves. A retired person
 * keeps no body, schedule, home, shift, directory entry or scene; their former work is transferred or explicitly left vacant, their home registration retires (RETIRED_HOMES),
 * their relationships are rewritten by phase 4, and only coherent historical mentions remain.
 */
const gone=(id,o)=>Object.freeze({id,name:o.name,category:'retired',was:Object.freeze(o.was||[]),home:o.home,
 transfer:Object.freeze({to:Object.freeze(o.to),purpose:o.purpose})});
export const RETIRED=Object.freeze([
 gone('bus-driver',{name:'Bus driver',home:'kitahama-6',to:['fuji'],purpose:'the master’s post; Fuji does not inherit his home'}),
 gone('higa-jr',{name:'Mr Higa Jr',home:'kitahama-flat-1',to:['chin'],purpose:'the motorman post (the oiler key); Chin takes neither his flat nor the Higa family'}),
 gone('gran-sakurai',{name:'Grandmother Sakurai',home:'kitahama-flat-2',to:['thuan'],purpose:'Sakura Shōten, which Thuan owns outright'}),
 gone('gran-chinen',{name:'Grandmother Chinen',home:'kitahama-5',to:['tetsu'],purpose:'only compatible family history, as Tetsu’s mother'}),
 gone('toma',{name:'Postman Tōma',home:'kitahama-4',to:['mika'],purpose:'tickets, parcels and the postal collection at Mika’s port counter'}),
 gone('shimabukuro',{name:'Mr Shimabukuro',home:'shimabukuro',to:['chin','tetsu'],purpose:'mechanical work to Chin, electrical maintenance to Tetsu; the power station stays, unmanned'}),
 gone('oshiro',{name:'Mr Ōshiro',home:'oshiro',to:['koji','chin','fuji'],purpose:'Koji fishes on his own; Chin mends the boats; Fuji keeps the old seamen’s stories'}),
 gone('kinjo',{name:'Mrs Kinjō',home:'kinjo',to:['thuan'],purpose:'flowers and decorations, supplied by Sakura; the florist pavilion goes'}),
 gone('barfly',{name:'Barfly',home:'izakaya',to:['fuji'],purpose:'the izakaya’s regulars and gossip, from the residents themselves, Fuji among them off duty'}),
 gone('reiko',{name:'Reiko',home:'resident-home-aya',to:['nhung'],purpose:'a smaller local paper, beside the bookshop; her friendship with Nhung stays as backstory'}),
 // The owner, 22 October 2026 ("Have this female doctor replace Nhung"): the clinic's doctor is Nhung; Dr Ken's post,
 // patients and evenings go to her. His flat behind the clinic goes with him; in RETIRED_HOMES `clinic` lands on itself,
 // because the id also names the clinic, which stays: a saved `clinic` or `home-clinic` lands at the clinic's door.
 gone('dr-ken',{name:'Dr Kakazu',was:['Dr Ken','Dr Ken Kakazu'],home:'clinic',to:['nhung'],purpose:'the island doctor: the clinic, its hours, house calls and the night telephone'}),
 // The owner, 31 October 2026: remove the ice-cream family and finish facilities before adding people.
 // No resident inherits their work or family: the dessert counter and upstairs flat remain vacant.
 gone('emi',{name:'Mrs Nakamura',was:['Emi','Emi Nakamura'],home:'nakamura',to:[],purpose:'the dessert counter, upstairs flat and community-kitchen programme wait for future staffing; no replacement resident is assigned'}),
 gone('mai',{name:'Mai',was:['Nakamura Mai','Mai Nakamura'],home:'nakamura',to:[],purpose:'the daughter retires with her mother; her school and friendship roles are not transferred to another child'}),
]);

/** The core households (brief §7's 14 less the doctor's flat and the Nakamura household; addendum 1, 4 and 6): primary homes and who sleeps there. */
const household=(home,members,note)=>Object.freeze({home,members:Object.freeze(members),note});
export const HOUSEHOLDS=Object.freeze([
 household('kitano-1',['nils','thuan'],'Johansson & Thuan’s house on Kitano-jima; Nils’s cabin aboard is duty accommodation, not a home'),
 household('kitahama-1',['thao','chin','vy'],'purely Thao, Chin and Vy: Thuan’s weekday room is dropped (addendum 4)'),
 household('kitahama-3',['nhung','koji','riku'],'reunited as one household; Nhung moves here from 1 Front-Row Yard (phase 3)'),
 household('higa',['yui','gran-higa'],'the Higa house, Nishi-machi'),
 household('resident-home-kenji',['tetsu'],'2 Front-Row Yard'),
 household('kitahama-2',['aki'],'2 Kitahama'),
 household('koban',['mori'],'Mori’s accommodation moves inside the police station built next to the kōban, a later job; koban stays the logical id (addendum 1)'),
 household('office',['jack'],'the Harbour Office residence'),
 household('kitahama-flat-3',['mac'],'one of the two attached ground-floor houses Kitahama Heights becomes (addendum 6); the id is kept for migration'),
 household('kitahama-flat-4',['mika'],'the other attached ground-floor house; the id is kept for migration'),
 household('kitahama-8',['nao'],'8 Kitahama'),
 household('fujita-houseboat',['fuji'],'Shiosai, the houseboat at the west pier'),
]);

/** Accommodation that is not a household: duty berths aboard and the supporting workers’ quarters (brief §5, §7, §10). */
export const QUARTERS=Object.freeze([
 Object.freeze({id:'ferry-chief-cabin',who:['nils'],aboard:true,registered:true,what:'the chief engineer’s duty cabin'}),
 Object.freeze({id:'ferry-engineer-duty-berth',who:['mac'],aboard:true,registered:true,what:'the relief engineer’s separate duty berth'}),
 Object.freeze({id:'ferry-officer-cabin',who:['ryo'],aboard:true,registered:true,what:'the chief officer’s cabin aboard (FERRY_GA mate-cabin)'}),
 Object.freeze({id:'ferry-crew-cabin',who:['ren','aya','jun'],aboard:true,registered:true,what:'the crew accommodation aboard: the deckhand’s cabin (Ren) and the crew cabin; the crew cabin is drawn with one two-tier bunk, the bosun’s week-on berth and the relief engineer’s duty berth, so the purser’s and the cook’s berths are two more bunks for the docks-and-boats job'}),
 Object.freeze({id:'kitano-2',who:['kai'],aboard:false,registered:true,what:'the Shiroma house on Kitano-jima, rented from the Shiromas in Naha: its gate on the hamlet lane, a bed, a table and a door, 25 m from the pier (phase 2 inspected it)'}),
]);

/**
 * The eight posts of the manning plan (world/ferry-ship.js FERRY_MANNING keys) and who holds each; a relief covers the
 * holder on the existing rota (the bosun’s week off; the chief engineer when the player is away). SHORE_ROLES are the
 * ferry-crew.js FERRY_SHORE keys.
 */
const post=(key,title,holder,extra={})=>Object.freeze({key,title,holder,relief:extra.relief||null,alias:extra.alias||null});
export const SHIP_POSTS=Object.freeze([
 post('master','Master','fuji'),
 post('mate','Chief officer','ryo'),
 post('chief','Chief engineer','nils',{relief:'mac'}),
 post('oiler','Motorman','chin',{alias:'motorman'}),
 post('bosun','Bosun','nao',{relief:'koji'}),
 post('deck','Deck hand','ren'),
 post('purser','Purser','aya'),
 post('cook','Cook-steward','jun'),
]);
export const SHIP_POST_ALIASES=Object.freeze({motorman:'oiler'});
export const shipPostKey=key=>SHIP_POST_ALIASES[key]||key;
export const SHORE_ROLES=Object.freeze([
 Object.freeze({key:'tickets',title:'Port clerk',holder:'mika',does:'tickets, parcels and the postal counter'}),
 Object.freeze({key:'port',title:'Harbour agent',holder:'jack',does:'the berth, the office radio and the freight book'}),
 Object.freeze({key:'linesman',title:'Linesman at Minato',holder:'jack',does:'the shore end of every line at Minato'}),
 Object.freeze({key:'airport-linesman',title:'Kitano line hand',holder:'kai',does:'the shore eyes at the Kitano berth'}),
 Object.freeze({key:'relief-engineer',title:'Relief engineer',holder:'mac',does:'the machinery watches when the chief is away'}),
 Object.freeze({key:'electrician',title:'Electrician (under contract)',holder:'tetsu',does:'the ship’s electrical equipment, in port'}),
]);

/**
 * Homes that go, and where a saved reference to one lands: a retained public place (brief §8, §10, §11, addendum 3 and
 * 5). The town hall's is the Community Hall's door, the community kitchen, since the mayor's office went (21 October 2026,
 * briefs/town-hall-zone.md phase M). Both the registry id and its entrance id are listed. The former post office's parcels go to Mika's counter at the
 * terminal and the florist's flowers to Sakura, so their saved locations follow the service. Nhung's own records go to
 * her new home, not to the public fallback. kitahama-flat-1/2 are logical units retired with their residents. The
 * table is applied whether or not the building still stands (phase 4 removed them), so a save is safe in both states.
 */
export const RETIRED_HOMES=Object.freeze({
 'kitahama-4':'community-kitchen','kitahama-5':'community-kitchen','kitahama-6':'community-kitchen',kinjo:'community-kitchen',oshiro:'community-kitchen',
 'resident-home-aya':'community-kitchen','kitano-3':'community-kitchen','kitahama-flat-1':'community-kitchen','kitahama-flat-2':'community-kitchen',
 shimabukuro:'ferry-terminal','post-office':'ferry-terminal',florist:'market','rainflower-florist':'market',izakaya:'izakaya',
 // The doctor's flat (Dr Kakazu, retired 22 October 2026): the clinic itself stays, so the id lands on itself.
 clinic:'clinic',
 // Only the Nakamura household retires. The dessert building stays, vacant; old home links land at its public frontage.
 nakamura:'nakamura',
});
/** The home records that retire: the service ids above are counters, not homes; izakaya's building stays, Barfly's registration goes. */
export const RETIRED_HOME_IDS=Object.freeze(Object.keys(RETIRED_HOMES).filter(id=>!['post-office','florist','rainflower-florist'].includes(id)));
/** Where a saved home or entrance id lands once the home is gone; an id that stays is returned as it is. */
export function retiredHomeFallback(id){
 if(typeof id!=='string')return id;
 const bare=id.replace(/^home-/,'');
 return Object.hasOwn(RETIRED_HOMES,bare)?RETIRED_HOMES[bare]:id;
}

const INDEX=new Map();
for(const p of [...ROSTER,...RETIRED])for(const key of [p.id,p.name,p.fullName,...p.was])if(key){
 if(INDEX.has(key)&&INDEX.get(key)!==p)throw new Error('roster: '+key+' names both '+INDEX.get(key).id+' and '+p.id);
 INDEX.set(key,p);
}
/** The identity behind an id, a display name, a full name or any historical name; null for anyone not in the roster. */
export const identityOf=key=>INDEX.get(key)||null;
export const isRetired=key=>identityOf(key)?.category==='retired';
export const householdOf=id=>HOUSEHOLDS.find(h=>h.members.includes(identityOf(id)?.id))||null;
export const shipPostOf=id=>{const who=identityOf(id)?.id;return SHIP_POSTS.find(p=>p.holder===who)||null;};
export const holderOf=key=>{const k=shipPostKey(key);return identityOf(SHIP_POSTS.find(p=>p.key===k)?.holder||SHORE_ROLES.find(r=>r.key===k)?.holder)||null;};
/** Every name an identity has had, the display name first; what the wardrobe and the migration walk through. */
export const namesOf=key=>{const p=identityOf(key);return p?[p.name,...(p.fullName!==p.name?[p.fullName]:[]),...p.was]:[];};

/** The roster as a document: docs/cast-roster.json mirrors it (tools/write-cast-roster.mjs; tests/roster.test.mjs keeps them equal). */
export const rosterDocument=()=>({
 status:'31 October 2026: 18 core and 5 supporting residents; the Nakamura family retires without successors while its facilities remain vacant. The 13 retired identities retain historical drawings (avatars/cast.js RETIRED_RECIPES); the consolidation report is docs/CAST-CONSOLIDATION-REPORT.md',
 canonDate:'2026-10-19',source:'docs/CAST-CONSOLIDATION.md',counts:{core:CORE.length,supporting:SUPPORTING.length,retired:RETIRED.length,households:HOUSEHOLDS.length},
 core:CORE,supporting:SUPPORTING,retired:RETIRED,households:HOUSEHOLDS,quarters:QUARTERS,shipPosts:SHIP_POSTS,shipPostAliases:SHIP_POST_ALIASES,shoreRoles:SHORE_ROLES,retiredHomes:RETIRED_HOMES,
});
