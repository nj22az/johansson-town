# The cast, household and crew consolidation: the report

The deliverable of [CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md) §13, written at the end of phase 5 (19 October 2026)
on the branch `claude/consolidation-5-finish`, from main after PR #254. The data of record is `src/people/roster.js`
(mirrored in `docs/cast-roster.json`); the tables below are read from it, from `src/people/cast.js` (the names the world
uses) and from `src/people/island-households.js` (the registry), not written by hand. Each phase's own record is in
`johansson-town/AGENTS.md`.

## 1. The 26: the final roster and the old-name map

21 core identities and 5 supporting, each with a stable id (never shown), the brief's short display name, the name the
world calls them by today (prompts, drawings, saves, tests: `cast.js`; `castMember` resolves every column), the full
name where the source has one, and every historical name, which keeps resolving.

| id | display name | the world's name | full name | was | post / relief / shore role | primary home | duty berth |
|---|---|---|---|---|---|---|---|
| nils | Nils | Johansson | Nils Johansson | Johansson | chief engineer (`chief`) | Johansson & Thuan’s House, Kitano hamlet (`kitano-1`) | `ferry-chief-cabin` |
| thuan | Thuan | Thuan | Thuan | Yuri | owns Sakura Shōten | Johansson & Thuan’s House, Kitano hamlet (`kitano-1`) | — |
| thao | Thao | Thao | Thao | — | runs Minato Izakaya | 1 Kitahama (`kitahama-1`) | — |
| chin | Chin | Chin | Chin | Kenji | motorman (`oiler`, alias `motorman`) | 1 Kitahama (`kitahama-1`) | — |
| vy | Vy | Vy | Vy | — | pupil, 11 | 1 Kitahama (`kitahama-1`) | — |
| nhung | Nhung | Nhung | Nhung | — | Front-Row Books and the town paper | 3 Kitahama (`kitahama-3`) | — |
| koji | Koji | Kōji | Kōji | Kōji | fisherman; relief bosun | 3 Kitahama (`kitahama-3`) | — |
| riku | Riku | Riku | Riku | — | pupil, 9 | 3 Kitahama (`kitahama-3`) | — |
| yui | Yui | Miss Higa | Yui Higa | Yonamine-sensei, Mrs Higa, Miss Higa | schoolteacher; the bandai evenings and weekends | Higa house, Nishi-machi (`higa`) | — |
| gran-higa | Gran Higa | Grandmother Higa | Grandmother Higa | Grandmother Higa | Umi-no-yu and Higa Liquor | Higa house, Nishi-machi (`higa`) | — |
| tetsu | Tetsu | Tetsuo | Tetsuo Chinen | Tetsuo | electrician (shore role `electrician`) | 2 Front-Row Yard (`resident-home-kenji`) | — |
| aki | Aki | Mrs Sato | Aki Sato | Mrs Sato | Sato Ramen | 2 Kitahama (`kitahama-2`) | — |
| mori | Mori | Officer Mori | Officer Mori | Officer Mori | police officer | Officer Mori’s quarters, Minato Police Station (`koban`) | — |
| dr-ken | Dr Ken | Dr Kakazu | Dr Ken Kakazu | Dr Kakazu | island doctor | Doctor’s flat, Town Hall Clinic (`clinic`) | — |
| emi | Emi | Mrs Nakamura | Emi Nakamura | Mrs Nakamura | Nakamura Zenzai, Blue Coral, the community kitchen | Above Nakamura Zenzai (`nakamura`) | — |
| mai | Mai | Mai | Mai Nakamura | Nakamura Mai | pupil, 10 | Above Nakamura Zenzai (`nakamura`) | — |
| fuji | Fuji | Mr Fujita | Fujita | Mr Fujita | master (`master`) | Shiosai houseboat, west pier (`fujita-houseboat`) | — |
| jack | Jack | Harbour master | Jack Reed | Harbour master | harbour agent (shore roles `port`, `linesman`) | Harbour Office · residence behind the screen (`office`) | — |
| mac | Mac | Mac | Mac Turner | Mr Nakandakari | relief chief engineer (shore role `relief-engineer`) | Kitahama Heights A, Fukugi Lane (`kitahama-flat-3`) | `ferry-engineer-duty-berth` |
| nao | Nao | Ms Uezu | Nao Uezu | Ms Uezu | bosun (`bosun`) | 8 Kitahama (`kitahama-8`) | — |
| mika | Mika | Ms Ganaha | Mika Ganaha | Ms Ganaha | port clerk (shore role `tickets`) | Kitahama Heights B, Fukugi Lane (`kitahama-flat-4`) | — |
| ryo | Ryo | Ryo | Ryo | Chief officer | chief officer (`mate`) | — (quarters aboard) | `ferry-officer-cabin` |
| ren | Ren | Ren | Ren | Deck hand | deck hand (`deck`) | — (quarters aboard) | `ferry-crew-cabin` |
| aya | Aya | Aya | Aya | Purser | purser (`purser`) | — (quarters aboard) | `ferry-crew-cabin` |
| jun | Jun | Jun | Jun | Cook-steward | cook-steward (`cook`) | — (quarters aboard) | `ferry-crew-cabin` |
| kai | Kai | Kai | Kai | Kitano line hand | Kitano line hand (shore role `airport-linesman`) | Shiroma house, Kitano hamlet (`kitano-2`, quarters) | — |

All 26 display names are unique (`tests/roster.test.mjs`); Jack and Mac carry the ages of the identities they replaced
(58, 61) and their own biographies (`guide/articles.mjs`, `cast.js`). The save-era names Yui, Aya and Nao (the sisters'
names in the oldest saves, `renamed.js`) apply only to saves from before the roster (castRevision 1) and now belong to
the teacher, the purser and the bosun.

**The old-name map, the ten retired** (`roster.js RETIRED`): who took what they did, and the home each left.

| retired | former home | purpose went to | what |
|---|---|---|---|
| Bus driver | 6 Kitahama (`kitahama-6`) | Mr Fujita | the master’s post; Fuji does not inherit his home |
| Mr Higa Jr | Former Flat 1, Kitahama Heights (`kitahama-flat-1`) | Chin | the motorman post (the `oiler` key); Chin takes neither his flat nor the Higa family |
| Grandmother Sakurai | Former Flat 2, Kitahama Heights (`kitahama-flat-2`) | Thuan | Sakura Shōten, which Thuan owns outright |
| Grandmother Chinen | 5 Kitahama (`kitahama-5`) | Tetsuo | only compatible family history, as Tetsu’s mother |
| Postman Tōma | 4 Kitahama (`kitahama-4`) | Ms Ganaha | tickets, parcels and the postal collection at the port counter |
| Mr Shimabukuro | Former flat above the post office (`shimabukuro`) | Chin, Tetsuo | mechanical work to Chin, electrical maintenance to Tetsu; the power station stays, unmanned |
| Mr Ōshiro | Former Ōshiro house, Nishi-machi (`oshiro`) | Kōji, Chin, Mr Fujita | Koji fishes on his own; Chin mends the boats; Fuji keeps the old seamen’s stories |
| Mrs Kinjō | Former Kinjō house, Nishi-machi (`kinjo`) | Thuan | flowers and decorations, supplied by Sakura; the florist pavilion went |
| Barfly | Minato Izakaya · former private room (`izakaya`) | Mr Fujita | the izakaya’s regulars and gossip, from the residents themselves, Fuji among them off duty |
| Reiko | Former 1 Front-Row Yard (`resident-home-aya`) | Nhung | a smaller local paper, beside the bookshop; her friendship with Nhung stays as backstory |

None of the ten has a body, household, shift, seat, nameplate, home pin, directory card, guide entry, story role,
relationship pair, costume or Studio listing (`tests/cast.test.mjs`, `tests/retired-recipes.test.mjs`,
`tests/town-directory.test.mjs`, `tests/feed-storyteller.test.mjs`). Their drawings, walks and costumes are kept for
Studio and for a history story only (`avatars/cast.js RETIRED_RECIPES`, `gait.js RETIRED_GAITS`,
`dungeon/costumes.js RETIRED_COSTUMES`); their magazine features are kept as history (`guide/articles.mjs
RETIRED_ARTICLES`) and are not applied to the guide.

## 2. The 14 households, and the accommodation that is not a household

**Core households** (`roster.js HOUSEHOLDS`; the registry `island-households.js` builds the same from `cast.js`, and
`tests/housing-consolidation.test.mjs` holds the count: 13 on Minato, one shared on Kitano-jima).

| home id | address | members | note |
|---|---|---|---|
| `kitano-1` | Johansson & Thuan’s House, Kitano hamlet | Johansson, Thuan | Nils’s cabin aboard is duty accommodation, not a home |
| `kitahama-1` | 1 Kitahama | Thao, Chin, Vy | purely the three: Thuan’s weekday room is dropped (addendum 4) |
| `kitahama-3` | 3 Kitahama | Nhung, Kōji, Riku | reunited; Nhung moved here from 1 Front-Row Yard (phase 3) |
| `higa` | Higa house, Nishi-machi | Miss Higa, Grandmother Higa | |
| `resident-home-kenji` | 2 Front-Row Yard | Tetsuo | the yard behind the bookshop is his alone since 1 Front-Row Yard went |
| `kitahama-2` | 2 Kitahama | Mrs Sato | |
| `koban` | Officer Mori’s quarters, Minato Police Station | Officer Mori | upstairs in the station built on the lot beside the former police box (PR #252); the id kept (addendum 1) |
| `office` | Harbour Office · residence behind the screen | Harbour master (Jack Reed) | |
| `clinic` | Doctor’s flat, Town Hall Clinic | Dr Kakazu | |
| `nakamura` | Above Nakamura Zenzai | Mrs Nakamura, Mai | |
| `kitahama-flat-3` | Kitahama Heights A, Fukugi Lane | Mac | the north of the two attached ground-floor houses (addendum 6); the id kept for migration |
| `kitahama-flat-4` | Kitahama Heights B, Fukugi Lane | Ms Ganaha | the south house; the id kept for migration |
| `kitahama-8` | 8 Kitahama | Ms Uezu | on her week off; the crew cabin on her week on |
| `fujita-houseboat` | Shiosai houseboat, west pier | Mr Fujita | |

**Duty berths and supporting quarters** (`roster.js QUARTERS`; registered with `aboard`/`quarters` flags so the housing
code never counts a cabin as a shore household or invents a house):

| id | where | who | what |
|---|---|---|---|
| `ferry-chief-cabin` | Johansson’s duty cabin, Minato Maru | Johansson | the chief engineer’s duty cabin (secondary; his home is `kitano-1`) |
| `ferry-engineer-duty-berth` | Relief engineer’s duty berth, Minato Maru | Mac | a separate duty berth (secondary; his home is Heights A) |
| `ferry-officer-cabin` | Chief officer’s cabin, Minato Maru | Ryo | his primary accommodation |
| `ferry-crew-cabin` | Crew accommodation, Minato Maru | Ren, Aya, Jun | the deckhand’s cabin (Ren) and the crew cabin; the crew cabin as drawn has one two-tier bunk (the bosun’s week-on berth and the relief engineer’s duty berth), so the purser’s and the cook’s bunks are the docks-and-boats job’s (recorded, not invented) |
| `kitano-2` | Shiroma house, Kitano hamlet | Kai | rented from the Shiromas in Naha: a gate on the hamlet lane, a bed, a table, a door, 25 m from the pier; supporting accommodation, outside the 14 |

The visiting cargo boat keeps its own crew and calls; nobody from it is housed ashore.

## 3. Removals and street changes of this job, and what was history already

**Removed by the consolidation (phase 4; each lot recorded in `okinawa/lots.js CLEARED_LOTS` with its ground and the
reason, dressing deferred to the pass that follows the final layout, ruling 2):**

| building | id | what happened |
|---|---|---|
| 4 Kitahama | `kitahama-4` | removed with Postman Tōma; grass |
| 5 Kitahama | `kitahama-5` | removed with Grandmother Chinen; grass (the merged 4/5 lawn) |
| 6 Kitahama | `kitahama-6` | removed with the Bus driver; grass |
| Kinjō house, seawall walk | `kinjo` | removed with Mrs Kinjō; coral sand; the lane at z −13 stays as the Higa house’s side |
| Ōshiro house, seawall walk | `oshiro` | removed with Mr Ōshiro; coral sand; the lanes to 2 Front-Row Yard and the utaki stay |
| 1 Front-Row Yard | `resident-home-aya` | removed after Nhung moved home and Reiko retired; the yard’s lawn, the path to Tetsuo’s door |
| Post-office shop-house, East Row | `shimabukuro` (home) / `post-office` (counter) | removed once Ms Ganaha’s window had the parcels; the park’s lawn meets Main Street there |
| Rainflower Florist pavilion | `florist` / `rainflower-florist` | removed once Sakura had the flowers; the bouquets at Sakura’s door (`old-town.js SAKURA_FLOWER_STAND`) |
| Chinen house, Kitano-jima | `kitano-3` | removed (addendum 5); the island’s ground and plantings take the plot back |
| Kitahama Heights, Flats 1 and 2 (logical units) | `kitahama-flat-1`, `-2` | retired with the upper storey (phase 3): the block is two attached ground-floor houses, A and B, no stair, no corridor |

Streets: the two Kitahama side lanes north of the cross lane that served only 4 and 5 now end at the cross lane, the
spine kept as the loop; gutters, lamps and wires follow; the East Row’s apron is paved per standing shop; the Nishi lanes
stay (the Higa house’s side, the way to 2 Front-Row Yard, the utaki’s approach). Kitahama’s plots are 1, 2, 3 and 8. The
Kitahama lots and the police lot were not touched by the consolidation (rulings 1 and 2); the police station was then
built on its lot (PR #252), the former police box becoming its yard.

**History, not this job:** 7, 9, 10, 11 and 12 Kitahama, the Nakasone, Miyagi, Tamaki and Kamiya houses, the flats above
Aragaki Confectionery and Yonamine Fresh Fish were removed by the housing project of 18 October 2026
(`docs/MINATO-HOMES-IMPLEMENTATION.md`); the registry keeps every one of them, and every removal above, as a `retired`
record so that a save that names it still lands somewhere.

## 4. Crew, watches, shore roles and opening hours

**The eight posts** (`roster.js SHIP_POSTS`, read by `people/ferry-crew.js`; the manning plan’s key stays `oiler` with the
title Motorman and a `motorman` alias, so no machinery task or safe-departure check changed with the label):

| post | holder | relief |
|---|---|---|
| master | Mr Fujita (Fuji) | — |
| chief officer (`mate`) | Ryo | — |
| chief engineer | Johansson (Nils) | Mac, whenever the player is away (the existing mechanism; no second Nils) |
| motorman (`oiler`) | Chin | — |
| bosun | Ms Uezu (Nao) | Kōji, on her week off (the existing rota; never both fishing and aboard) |
| deck hand | Ren | — |
| purser | Aya | — |
| cook-steward | Jun | — |

**Shore roles** (`SHORE_ROLES`): tickets, parcels and the post at one window, Ms Ganaha; the berth, the office radio and
the freight book, and the shore end of every line at Minato, the Harbour master (Jack Reed, who took Mr Fujita’s linesman
duty when Fuji went to the bridge; `ferry-shore-crew.js`, `shore-duty.js`); the Kitano lines, Kai; the relief watches,
Mac; the ship’s electrical equipment in port, Tetsuo under contract, never on the sailing crew.

**The ship’s day** (`ferry-crew.js FERRY_WORKING_DAY`, `ferry-ship.js FERRY_DAY`): all eight signed on at 06:05, the
generators at 06:10, in service from 06:25 to the shore power at 22:15, signed off at 22:20; sailings on request within
it, rest and meals alongside between them; one body per person (the master’s shed body walks to and from the gangway,
`master-commute.js`). Fuji is sober for the whole of it: the shed, the set and the beer begin at 22:20
(`fujita-day.js`); the Higas’ van collects the empties at 06:00. Chin’s workshop hours are the evening after 22:20 and
the bench is Tetsuo’s while she sails.

**Opening hours:** Sakura Shōten 09:00–20:30 every day, the till to 20:00 and the last half hour the restock, nobody at
night (`commerce/sakura-rota.js`), Thuan over on the 08:30 boat and home on the 22:00, Nhung keeping the counter at the
weekend; the port counter (tickets, parcels, post) 12:00–22:15, letters and parcels in by 16:30 for the evening boat,
parcels on the shelf from noon, the mailbag off the morning boat sorted by 09:30 (`people/ganaha.js`); Front-Row Books
from 09:30, shut at the weekend; Sato Ramen lunch 11:00–14:00, shut on Wednesdays; Umi-no-yu’s bandai Grandmother Higa
13:00–17:00 and Miss Higa 17:00–22:00; the police station desk 16:00–22:00 with the night patrol after (the station’s
duty roster); Nakamura 10:00–19:00 with Blue Coral from 15:00; the ferry as above.

## 5. Save migration

`src/save.js`: three idempotent, versioned steps run on every load, in order, each a no-op once applied.

1. `migrateThuan` (castRevision < 1): the save-era renames of the oldest saves (Yuri and Yui to Thuan, Aya to Nhung, Nao
   to Thao, Kenji to Chin, Mrs Higa to Miss Higa), once only, so that from castRevision 1 Yui, Aya and Nao are the
   teacher, the purser and the bosun.
2. `migrateHousing` (housingRevision 1): the housing project of 18 October: the four people it rehoused that day lose
   their saved home fields and a saved home target goes through the registry’s aliases. Its name list is that day’s
   (two of them retired a day later; the step is kept as it was for a save from before 18 October).
3. `migrateCast` (castRevision 2): a record under a historical name (the roster’s `was`, or an id) moves to the name the
   live cast uses today (so it follows a later rename by itself); a retired person’s records (location, friendship,
   treats, greetings, impressions, relationship pairs, bookshop jobs, an errand) are dropped; prose (notes, the shop
   ledger, the archive) reads historical names as live ones, except the player’s surname; a saved home or entrance id of
   a home that went lands at a retained public place whether or not the building still stands (`roster.js
   RETIRED_HOMES`, `households.js HOME_ALIASES`: 4, 5 and 6 Kitahama, the Kinjō and Ōshiro houses, 1 Front-Row Yard,
   the Chinen house and Flats 1 and 2 at the town hall; the flat over the former post office and the post-office
   counter at the ferry terminal; the florist at Sakura; Barfly’s room at the izakaya, which stands); a person’s own
   home fields follow their move (Nhung to 3 Kitahama). Inventory, money, clothing, vehicle state and unrelated quest
   progress are untouched. `tests/cast-migration.test.mjs` applies every step twice, loads a save made inside a removed
   building and reads the same after a second save.

## 6. What phase 5 changed

- **Stories.** The storyteller’s catalogue (`guide/residents.json`, built from `guide/articles.mjs` by
  `tools/apply-articles.mjs`) is exactly the 26: the 15 features rewritten to the consolidated facts (no present-tense
  line names a vanished place or a retired person except as history), 11 written new (Dr Kakazu, Mai, Mac, Ms Uezu,
  Ms Ganaha, Mr Fujita, Ryo, Ren, Aya, Jun, Kai) with a role, a place, a friend, a line, an island personality
  (`tools/apply-articles.mjs FIX`), one belonging each (`people/belongings.js`), a photo shoot and a portrait rendered
  from the live avatars (`tools/render-resident-shoot.mjs`, `tools/render-resident-guide.mjs`,
  `scripts/sync-resident-guide.mjs`; the portraits’ source hash is current again). Every one of the 26 is a regular
  somewhere (`feed/places.js`), the ship’s people aboard her, and the police station (`koban`) and the terminal counter
  are storyteller places. Sakura’s products are for the living (`data/studio/products.json`,
  `tools/studio/build-data.mjs`), as are the wardrobe’s and outfits’ “who wears it” lines, the ferry’s and the power
  house’s prose, the izakaya’s tanuki and the town hall’s petitions (`scripts/build-town-papers.mjs`).
- **Directories and maps.** The town book lists the 26 and 19 homes; the map names the police station; the island guide
  addresses the player as the Chief, not the Mayor; the Studio tools list the 26 by the names World uses, the crew as a
  group of their own (`character_list group:'crew'`), so `Mac` and `Ms Ganaha` resolve.
- **Hygiene.** The retired drawings, walks and costumes marked and kept (above); the dead `rainflower-shop` branch gone
  from `island/play.js`; the night-keeper check gone from `game.js`; `migrateHousing` documented as the history it is;
  `cast.js` has Fuji as the master (his day aboard 06:05–22:20, the shed after) and the Harbour master as Jack Reed with
  the Minato lines; the English inventory treats painted boat names, shelf talkers, face glyphs and `plateTexture` signs
  as scenery, and the one narration string that carried a Japanese name is English.
- **Docs.** `docs/CAST-CONSOLIDATION.md` closed; `AGENTS.md` records phase 5; the roster document’s status and
  `docs/cast-roster.json` updated; the docs that describe the cast of before (KITANO-JIMA, MINATO-CONSOLIDATION,
  KITAHAMA-DANCHI, FERRY-AUDIT) carry a history banner, as INTERIOR-INVENTORY, CAST-PLAN, MINATO-HOMES-PLAN and
  MINATO-HOMES-IMPLEMENTATION already did. The repo CLAUDE.md trade line is right as phase 3 left it (Sakura supplies
  flowers and decorations since Mrs Kinjō retired; Rainflower Florist supplies nothing).

## 7. Build and test results

Run in `johansson-town/` on the branch head, after the merge of main (PR #254), in this order:

- `npm run build:runtime`: built; "Published runtime entry points: boot-DLUfyAhC.js audio-CbrYD3VV.js files: 57"; the
  rebuilt `runtime/`, `index.html` and `sw.js` are the branch's last commit.
- `node --test tests/runtime-package.test.mjs`: 3 pass, 0 fail.
- The focused suites, 31 files, 163 pass, 3 fail: feed-storyteller 9/0, retired-recipes 3/0, products-move 3/0,
  seat-layouts 4/0, resident-guide 2/0, cast 8/0, town-directory 4/0, home-directory 5/0, housing-consolidation 12/0,
  cast-migration 7/0, english-language 1/0, okinawa-quarters 7/0, minato-business-consolidation 4/0,
  bookshop-customers 5/0, **neighbourhood-access 5/3**, island-guide 3/0, roster 9/0, avatars 8/0, avatar-gait 1/0,
  feed-seating 3/0, resident-belongings 4/0, products-data 3/0, police-station 7/0, wardrobe-catalogue 8/0,
  dialogue-engine 9/0, happenings 8/0, neighbour-chats 3/0, birthdays 2/0, personality 4/0, story-gestures 9/0,
  avatar-silhouette 3/0.
- `node --test tests/resident-journeys.test.mjs` (run on its own, it takes minutes): 19 pass, 1 fail ("Thuan reaches
  home and daily indoor destinations against runtime street colliders").

**Of the failures the phase started with on main** (bookshop-customers ×4, english-language, minato-business
"Vy and Riku", neighbourhood-access ×3, okinawa-quarters "Grandmother Higa keeps the wrong hours", resident-guide
portraits sha, resident-journeys "Thuan", seat-layouts "every outdoor public seat", products-move, avatar-gait "Personal
gait for someone who lives here: Mr Ōshiro"): all but neighbourhood-access ×3 and resident-journeys "Thuan" are fixed,
each as a stale test or a small real bug (§6; the bookshop's afternoon visit went from Chin, aboard all day, to Mrs Sato;
the neighbourhood bench's stand point was on the bench's own collider; the station's bench and the dessert bench are
public seats; the guide's portrait hash is current; the retired walks left the live gait list). The four that remain
are diagnosed in §8. The whole suite was not run (it stalls); nothing above claims it was.

## 8. Unresolved

- **The police station's and the terminal's story backdrops are not photographed.** `node tools/render-feed-backdrops.mjs
  police-station port-hall` (from `johansson-town/`, Playwright's Chromium with WebGL; `TOWN_CHROMIUM_PATH` names the
  binary) captures the four views and the depth of each and writes `assets/images/feed/views.json`; then remove
  `captured:false` from the two places in `src/feed/places.js` and commit the pictures. In this cloud session the game
  boots under swiftshader to "Drawing the island" and the first frame never finishes (probed for ten minutes; the
  renderer's 240 s and a 25-minute copy both timed out), so the places are wired and gated, and no story is set there
  until the pictures exist.
- **The world's names are not yet the brief's short display names.** Fuji, Jack, Nao, Koji, Mika, Yui, Tetsu, Aki,
  Dr Ken, Emi and Nils are the roster's and resolve everywhere (`castMember`, the save migration follows a rename by
  itself), but prompts, drawings, saves, the guide's portraits and some three hundred tests key on Mr Fujita, Harbour
  master, Ms Uezu, Kōji, Ms Ganaha, Miss Higa, Tetsuo, Mrs Sato, Dr Kakazu, Mrs Nakamura and Johansson. That rename is a
  sweep of its own (the portrait hash and the wardrobe keys change with it), not a phase-5 side effect.
- **`neighbourhood-access` ×3 fail on main and still fail**, all in the cleared-lot geometry the dressing pass owns
  (ruling 2; `okinawa/lots.js`, `kitahama-quarter.js`), so they were not widened into this branch: (1) *authored park
  walks have no height cliffs or objects across the walking centre*: the neighbourhood-residential connector is crossed
  at (−19.3, 40.5) by the `park-rail` collider (0.1 × 9 m at x −19, z 34.5–43.5), a railing drawn across the authored
  connector; the fix is to end the rail short of the connector or move the connector a metre east, in the park layout.
  (2) *rendered paths remain connected after the game installs its walking surface*: the town-to-Kitahama footpath at
  x 1.9 is cut at z 47.5 by a `block-wall` collider (8.1 × 0.3 m at x −2, z 48), a block wall of the compacted north
  Kitahama frontage that now spans the footpath; the wall needs a gap at the path or the path a dog-leg round its end.
  (3) *visible garden approaches match walking heights across the whole entrance*: at (−34, 30.5), the Nishi garden
  approach beside the cleared Kinjō and Ōshiro lots, the visible ground is at −0.015 m and the walking plan at 0.04 m
  (no collider): the lots' coral-sand ground and the garden apron are at different heights, which the dressing of
  those lots settles.
- **`resident-journeys` "Thuan reaches home and daily indoor destinations"** fails on main and still fails. On a Monday
  at 08:30 she "arrives on the ferry" at the terminal quay (`social.js`, `transitStop().arrival`, (−3.2, −73.4)) and at
  09:00 must walk to Sakura; under the test's runtime predicate she takes no step in 900 s, while with no colliders she
  reaches the shop. The fixture's walking surface stopped at z −72, short of the quay, and now reaches z −78, which was
  not the cause: the arrival spot and the 7 m corridor north of it are on the route raster at the walkers' radius, no
  collider hits the spot or the next step, and the walker's record simply carries no path. So the cast AI's own
  pathfinder (`schedules.js createNavigation`, under the collider grid and the ground-continuity rule) finds no route
  from the quay into town; a fix needs that search walked from the quay against the terminal's and the new docks'
  colliders to the point it dies, in the docks job's geometry, and is not a one-line change.
- **Officer Mori's hours disagree between two sources:** `cast.js` has the night patrol from 21:00 and bed at 02:00; the
  station's duty roster (PR #252, `interiors/police-station.js`) prints desk 16:00–22:00 and patrol 22:00–06:00, and
  his morning routine (`social.js`) has him up at 15:00. Nothing breaks, but one of them should give.
- **The master's drawing is at the elder age class** (`profiles.js` keeps Mr Fujita at 73, a retired fisherman; the
  roster says 63). The portrait and the body follow the profile; changing it changes his look, so it is left for a
  deliberate decision.
- **The purser's and the cook's bunks** are recorded in `QUARTERS` and drawn by the docks-and-boats job, not here.
- **The lot dressing** (ruling 2) follows on the final layout, in the parallel pass.
- **Not performed here:** rendered pedestrian and overhead views of the affected blocks, the physical iPhone check and
  the before/after geometry and actor-cost measurements the brief's §13 asks for. The only pictures made in this phase
  are the 11 portraits and 52 photo-shoot frames rendered from the avatar pipeline (contact sheets were looked at) and
  none of the town itself, for the reason above.
