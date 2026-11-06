import {canonicalHomeId} from './people/households.js';
import {migratedVisits} from './world/businesses.js';
import {RENAMED_RESIDENTS,renameResidents} from './people/renamed.js';
import {identityOf,ROSTER,retiredHomeFallback} from './people/roster.js';
import {liveNameFor} from './people/cast.js';
export {RENAMED_RESIDENTS,renameResidents};

/** Withdraw the retired fighting save records without changing earned possessions or relationships.
 * Shipped bouts lived in memory, not in saves. The defensive active/resume fields below also cover imported
 * and audit saves. Progress alone never relocates an ordinary player. Re-run on every load so old imports work. */
export function migrateCombat(saved){
 const retired=id=>typeof id==='string'&&/^(dungeon|arena|personal-quarrel|harbour-festival|festival-bout|ferry-arena)$/.test(id);
 const encounter=record=>record&&typeof record==='object'&&(record.active===true||record.bout||record.encounter||record.activeEncounter||record.resume);
 const pointInCombat=p=>p&&[p.room,p.roomId,p.site,p.siteId,p.location,p.mode].some(retired);
 const active=!!(encounter(saved.harbourFestival)||encounter(saved.combat)||encounter(saved.fight)||encounter(saved.quarrel)||saved.activeEncounter||saved.dungeonRun||saved.activeBout||saved.arenaResume||pointInCombat(saved)||pointInCombat(saved.desktopCheckpoint)||Object.values(saved.desktopLife?.people||{}).some(p=>pointInCombat(p?.checkpoint)));
 for(const key of ['harbourFestival','combat','fight','quarrel','activeEncounter','activeBout','dungeonRun','dungeonDeepest','arenaResume','hostility'])delete saved[key];
 if(saved.desktopLife&&saved.desktopLife.version!==2)delete saved.desktopLife.tempers;
 if(active){
  // This is the existing fish-auction opening, tested for clear feet, camera and two-way street access.
  const safe={x:19.8,z:-40,yaw:-1.03,pitch:0,ship:false};
  saved.desktopCheckpoint={...safe};saved.combatRecovery=true;
  if(saved.island?.journey&&typeof saved.island.journey==='object')saved.island.journey.location='town';
  for(const key of ['room','roomId','site','siteId','location','mode'])if(retired(saved[key]))delete saved[key];
  for(const p of Object.values(saved.desktopLife?.people||{}))if(p&&typeof p==='object'&&(pointInCombat(p.checkpoint)||p===saved.desktopLife.people[saved.desktopLife.active]))p.checkpoint={x:safe.x,z:safe.z,yaw:safe.yaw,atHome:false};
 }
 saved.combatRevision=1;return saved;
}

export const SAVE_KEY='johansson-town-1988-v5';
export const LEGACY_KEYS=['johansson-town-1988-v4','johansson-town-1988-v3'];
/** Moves records kept under an old name to the new one; a record already under the new name wins; null drops it. */
function renameKeys(records,key=k=>RENAMED_RESIDENTS[k]){
 if(!records||typeof records!=='object'||Array.isArray(records))return;
 for(const old of Object.keys(records)){const now=key(old);if(now===undefined||now===old)continue;if(now!==null&&!Object.hasOwn(records,now))records[now]=records[old];delete records[old];}
}
/**
 * The save-era renames (Yuri and Yui to Thuan, Aya to Nhung, Nao to Thao, Kenji to Chin, Mrs Higa to Miss Higa). They
 * apply once, to a save from before the consolidated roster: from castRevision 1 (SAVE_ERA_REVISION) on, Yui, Aya and
 * Nao are the teacher, the purser and the bosun (people/roster.js), and a record under those names is theirs.
 */
export function migrateThuan(saved){
  if((saved.castRevision|0)>=SAVE_ERA_REVISION)return saved;
  // Keep the existing home IDs (resident-home-aya, yuri-home) and move only the renamed
  // residents' records.
  for(const key of ['residentLocations','residentLife','friendship','treats'])renameKeys(saved[key]);
  // The bookshop remembers finished jobs as `day:Name`.
  renameKeys(saved.bookshop?.completed,k=>{const at=k.lastIndexOf(':');return at<0?null:k.slice(0,at+1)+renameResidents(k.slice(at+1));});
  if(Array.isArray(saved.notes))saved.notes=[...new Set(saved.notes.map(renameResidents))];
  for(const record of Object.values(saved.residentLife||{}))if(Array.isArray(record?.activities))record.activities=record.activities.map(renameResidents);
  // The ledger prints the buyer column, so untouched rows would still show the old name.
  if(Array.isArray(saved.sakura?.journal))for(const row of saved.sakura.journal)if(row&&typeof row==='object')row.buyer=renameResidents(row.buyer);
  if(Array.isArray(saved.documentArchive))for(const doc of saved.documentArchive)if(doc&&typeof doc==='object')doc.author=renameResidents(doc.author);
  return saved;
}
/**
 * The housing project of 18 October 2026 (docs/MINATO-HOMES-IMPLEMENTATION.md), as a one-time, idempotent migration
 * (housingRevision 1): the four people it rehoused then lose their saved home fields so the registry's homes of that
 * day apply, and a saved home target goes through the registry's aliases. The names are the names of that day: two of
 * them (Grandmother Chinen, Grandmother Sakurai) retired a day later in the consolidation and Mr Nakandakari became
 * Mac, which migrateCast (castRevision 2, below) handles after this has run; a save from before 18 October still needs
 * this step first, so the list is kept as it was. Never treats a shop visit as an old home visit.
 */
export function migrateHousing(saved){
 if(saved.housingRevision>=1)return saved;
 const moved=['Grandmother Chinen','Grandmother Sakurai','Mr Nakandakari','Ms Ganaha'];
 for(const name of moved)if(saved.residentLocations)delete saved.residentLocations[name];
 for(const name of moved){const life=saved.residentLife?.[name];if(life){delete life.home;delete life.homeId;delete life.sleepingPlace;}}
 for(const key of ['homeTarget','navigationTarget','lastHome'])if(typeof saved[key]==='string')saved[key]=canonicalHomeId(saved[key]);
 saved.housingRevision=1;return saved;
}
/**
 * The cast consolidation (docs/CAST-CONSOLIDATION.md §11; people/roster.js). Versioned by castRevision and idempotent:
 * applied to every load, it moves nothing a second time.
 *  - Names: a record kept under a historical name (the roster's `was`, or an id) moves to the name the live cast uses
 *    today (cast.js liveNameFor), so it follows each phase's renames by itself: 'Mr Fujita' stays 'Mr Fujita' until
 *    cast.js calls him Fuji, then moves. A retired person's record (a location, a friendship, a treat, a greeting, an
 *    impression, a relationship pair, a bookshop job, an errand) is dropped, since they have no body (phase 4, castRevision
 *    2); the Nakamura family's names retire too (31 October 2026, castRevision 3). Other display names not yet live are left alone.
 *  - Homes: a saved location that names a home that goes (RETIRED_HOMES) lands at a retained public place, whether or
 *    not the building still stands (since phase 4 none of them does: 4, 5 and 6 Kitahama, the Kinjō and Ōshiro houses,
 *    1 Front-Row Yard and the Chinen house at the town hall; the flat over the former post office at the terminal, where
 *    its post went; Barfly's room at the izakaya, which stands); a person's own home fields follow their move (Nhung to
 *    3 Kitahama).
 *  - Prose: notes, the shop ledger and the archive read the historical names as the live ones, except the player's,
 *    whose surname is in 'Johansson Harbour Office' and the like.
 * Revisions: 1 the roster and its aliases (phase 1); 2 the retirements (phase 4); 3 the Nakamura family retirement. Every step is a no-op on a save that
 * has had it, so the stamp records what the save has been through, not what still has to run.
 */
export const CAST_REVISION=3,SAVE_ERA_REVISION=1;
const historical=key=>{const who=identityOf(key);return who&&(who.category==='retired'||who.id===key||who.was.includes(key))?who:null;};
/** Where a record under `key` sits now: itself, the live name, or null for a retired person with no body. */
export function castKey(key){
 const who=historical(key);if(!who)return key;
 return liveNameFor(key)??(who.category==='retired'?null:key);
}
/** Prose reads a historical name as the live one: the pairs that differ today, as one replacement. */
function proseRenamer(){
 const now=new Map(ROSTER.filter(p=>p.id!=='nils').flatMap(p=>p.was.map(old=>[old,liveNameFor(old)])).filter(([old,live])=>live&&live!==old));
 if(!now.size)return text=>text;
 const pattern=new RegExp('\\b(?:'+[...now.keys()].map(old=>old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','g');
 return text=>typeof text==='string'?text.replace(pattern,old=>now.get(old)):text;
}
const stable=(id,step)=>{for(let i=0;i<4;i++){const next=step(id);if(next===id)return id;id=next;}return id;};
export function migrateCast(saved){
 if(!saved||typeof saved!=='object')return saved;
 for(const key of ['residentLocations','residentLife','friendship','treats','greeted','impressions'])renameKeys(saved[key],castKey);
 renameKeys(saved.relationships,k=>{const ids=k.split('|');if(ids.length!==2)return k;const now=ids.map(castKey);return now.includes(null)?null:[...new Set(now)].length<2?null:now.sort().join('|');});
 renameKeys(saved.bookshop?.completed,k=>{const at=k.lastIndexOf(':');if(at<0)return k;const now=castKey(k.slice(at+1));return now===null?null:k.slice(0,at+1)+now;});
 for(const field of ['from','to'])if(typeof saved.errand?.[field]==='string'){
  const now=castKey(saved.errand[field]);if(now===null){delete saved.errand;break;}saved.errand[field]=now;
 }
 const prose=proseRenamer();
 if(Array.isArray(saved.notes))saved.notes=[...new Set(saved.notes.map(prose))];
 for(const record of Object.values(saved.residentLife||{}))if(Array.isArray(record?.activities))record.activities=record.activities.map(prose);
 if(Array.isArray(saved.sakura?.journal))for(const row of saved.sakura.journal)if(row&&typeof row==='object')row.buyer=prose(row.buyer);
 if(Array.isArray(saved.documentArchive))for(const doc of saved.documentArchive)if(doc&&typeof doc==='object')doc.author=prose(doc.author);
 // A saved location inside a home that goes: through the registry's aliases, then to the retained public place.
 for(const key of ['homeTarget','navigationTarget','lastHome'])if(typeof saved[key]==='string')saved[key]=stable(saved[key],id=>retiredHomeFallback(canonicalHomeId(id)));
 // A person's own home fields follow their move; the record's key is the live name by now.
 for(const p of ROSTER)if(p.oldHomes.length){
  const live=liveNameFor(p.id);if(!live)continue;
  for(const record of [saved.residentLocations?.[live],saved.residentLife?.[live]])if(record&&typeof record==='object')
   for(const field of ['home','homeId','sleepingPlace'])if(typeof record[field]==='string'){
    const entrance=/^home-/.test(record[field]),bare=record[field].replace(/^home-/,'');
    if(p.oldHomes.includes(bare))record[field]=(entrance?'home-':'')+p.home;
   }
 }
 saved.castRevision=Math.max(saved.castRevision|0,CAST_REVISION);return saved;
}
/**
 * Local players. Everybody who plays on this device can have their own save: a name and
 * a slot in localStorage. The first player keeps the original save key, so progress from
 * before players existed is simply theirs.
 */
export const PLAYERS_KEY='johansson-town-players';
export const DEFAULT_PLAYER=Object.freeze({id:'player-1',name:'Visitor'});
export const slotKey=id=>id===DEFAULT_PLAYER.id?SAVE_KEY:SAVE_KEY+'@'+id;
const cleanName=name=>String(name||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,24);
export function readPlayers(storage){
  let data=null;try{data=JSON.parse(storage?.getItem?.(PLAYERS_KEY));}catch{}
  const players=Array.isArray(data?.players)?data.players.filter(p=>p&&typeof p.id==='string'&&/^[\w-]{1,40}$/.test(p.id)).map(p=>({id:p.id,name:cleanName(p.name)||'Visitor',created:Number(p.created)||0,lastPlayed:Number(p.lastPlayed)||0})):[];
  if(!players.some(p=>p.id===DEFAULT_PLAYER.id))players.unshift({...DEFAULT_PLAYER,created:0,lastPlayed:0});
  const active=players.some(p=>p.id===data?.active)?data.active:DEFAULT_PLAYER.id;
  return {active,players};
}
export function writePlayers(storage,roster){try{storage.setItem(PLAYERS_KEY,JSON.stringify(roster));return true;}catch{return false;}}
export const activePlayer=storage=>{const roster=readPlayers(storage);return roster.players.find(p=>p.id===roster.active);};
// Imported progress is written before its slot becomes active. A failed write
// must leave the current player selected, rather than opening an empty story.
export function addPlayer(storage,name,now=Date.now(),initialSave=null){
  const roster=readPlayers(storage),id='player-'+now.toString(36)+Math.floor(Math.random()*1296).toString(36);
  if(initialSave!==null)try{storage.setItem(slotKey(id),JSON.stringify(initialSave));}catch{return null;}
  roster.players.push({id,name:cleanName(name)||'Visitor',created:now,lastPlayed:now});roster.active=id;
  if(writePlayers(storage,roster))return id;
  if(initialSave!==null)try{storage.removeItem(slotKey(id));}catch{}
  return null;
}
export function switchPlayer(storage,id){const roster=readPlayers(storage);if(!roster.players.some(p=>p.id===id))return false;roster.active=id;return writePlayers(storage,roster);}
export function renamePlayer(storage,name){const roster=readPlayers(storage),p=roster.players.find(p=>p.id===roster.active);if(!p||!cleanName(name))return false;p.name=cleanName(name);return writePlayers(storage,roster);}
export function touchPlayer(storage,now=Date.now()){const roster=readPlayers(storage),p=roster.players.find(p=>p.id===roster.active);if(p){p.lastPlayed=now;writePlayers(storage,roster);}}
/**
 * Never destroy the only good copy (Mario Artist's file system writes a temporary file, then renames: research/mario-artist
 * report.md §2.5). localStorage writes a key whole, so the dangers here are different: a save that no longer reads (a bug,
 * an extension), a full storage quota, and a load that half-fails and is then saved over with defaults.
 *   writeSave  keeps the last save that reads as the previous copy (<key>~prev) before writing the new one; when the
 *              storage is full it gives up the previous copy first, never the save itself
 *   readSave   falls back to the previous copy when the save does not read
 *   rescueSave keeps the raw save once (<key>~rescue, never overwritten) when loading it failed part-way, so the next
 *              auto-save cannot destroy the only good copy; the game says so
 */
export const PREV_SUFFIX='~prev',RESCUE_SUFFIX='~rescue';
const readsAsSave=text=>{try{const v=JSON.parse(text);return !!v&&typeof v==='object'&&!Array.isArray(v);}catch{return false;}};
export function writeSave(storage,key,json){
  const now=storage.getItem(key);
  if(now!=null&&now!==json&&readsAsSave(now))try{storage.setItem(key+PREV_SUFFIX,now);}catch{try{storage.removeItem(key+PREV_SUFFIX);}catch{}}
  try{storage.setItem(key,json);return true;}catch{}
  // Full: give up the previous copies (every player's: they are the least needed things here), then try again. A
  // rescued save is the player's own progress and is never dropped to make room.
  try{
   const prevs=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k?.endsWith(PREV_SUFFIX))prevs.push(k);}
   for(const k of prevs.length?prevs:[key+PREV_SUFFIX])storage.removeItem(k);
   storage.setItem(key,json);return true;
  }catch{return false;}
}
export function rescueSave(storage,key){
  try{if(storage.getItem(key+RESCUE_SUFFIX)!=null)return false;const raw=storage.getItem(key);if(raw==null)return false;storage.setItem(key+RESCUE_SUFFIX,raw);return true;}catch{return false;}
}
/** The key the active player's save lives under. */
export const activeSlot=storage=>slotKey(readPlayers(storage).active);
export function readSave(storage){
  const slot=slotKey(readPlayers(storage).active);
  for(const key of slot===SAVE_KEY?[SAVE_KEY,SAVE_KEY+PREV_SUFFIX,...LEGACY_KEYS]:[slot,slot+PREV_SUFFIX])try{const value=JSON.parse(storage.getItem(key));if(value&&typeof value==='object'&&!Array.isArray(value)){if(Array.isArray(value.visited))value.visited=migratedVisits(value.visited.filter(id=>typeof id==='string'));const out=migrateCombat(migrateCast(migrateHousing(migrateThuan(value))));Object.defineProperty(out,'readFrom',{value:key,enumerable:false});return out;}}catch{}
  return null;
}
