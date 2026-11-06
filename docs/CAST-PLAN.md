# The cast plan: fewer people, each with a life

> **Superseded on 19 October 2026 by [CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md)** (the owner's cast, household and crew consolidation; its addendum wins). This document is kept as dependency evidence of the earlier design; where it names Johansson mayor, gives Grandmother Sakurai Sakura or a home, keeps Thuan a weekday room, or counts 31 residents and 23/24 households, the consolidation's 21 core and 5 supporting identities, 14 households and ten retirements are the plan of record (`src/people/roster.js`, `docs/cast-roster.json`). Corrections below are marked *(superseded …)*.

The creator (2026-10-13): "We need a plan to reduce the amount of people on the island everyone should have a life
and a purpose and they should be able to flirt among each other and have relationships and quarrel and get angry and
happy and laugh together, when walking around town it's like we are a part of a lived in world. Thao, Nhung and Thuan
are the leading women they should have families. Thuan has Johansson, everyone who exists on the island needs a
reason to be there. Thao have a daughter Vy of course she goes to school maybe miss Higa is the school teacher, and
she works at the Onsen when she is free and maybe Tetsuo also chips in at the Onsen when he is not in the workshop."

Status: **agreed and under way.** The creator (2026-10-14): "Yes proceed". The decisions in section 7 were taken as
proposed (Vy 11 and Thao 34; Kōji and Riku; Miss Higa single; the cut list goes; Fumoto stays as fields), with one
change: **Mr Higa Jr stays**, as Miss Higa's elder brother, because the Minato Maru's safe manning needs her oiler and
the ship is built true (CLAUDE.md). Batch 1 is done (section 6). The cast is 31 people, in `src/people/cast.js`.

## 1. What is there today, and why it feels empty

The island has grown four separate lists of people, and they don't agree:

| List | People | What they do |
|---|---|---|
| The walking cast (`residents.js`) | 10 | Walk the town on a schedule, go home, sleep, chat with each other |
| Neighbours (`neighbours.js`) | 21 | Stand at a fixed spot; a few walk a short route; no schedule, no chats |
| The town registry (`island-households.js`) | 59 | Mostly text: a name and a purpose on a nameplate |
| Rooms (classroom, onsen, ferry) | 8 pupils, 1 teacher, 1 bath keeper, 4 crew | Only exist inside their room or aboard |

- **Only 10 people actually live.** The other 21 people you meet in the street are scenery that talks.
- **About 30 people exist only as words.**
- **Relationships are thin:**
  - Hearts exist only between each resident and the player.
  - Two residents can chat when they pass, but nothing is remembered.
  - Moods last a single line; there is no anger, no quarrel and no romance.
  - The only couples are Thao and Chin, and Johansson and Thuan.
- **Vy has no family:** no parents, no home, no household. She is a teenager waiting for a ferry to a mainland high
  school.

## 2. The rule

**Everyone who exists on the island walks, works, goes home, and has people they love, like, tease or can't stand.**

There is one list: `src/people/cast.js` replaces the four. A person is in it only if all of these hold:

1. They have a **home** that exists in the world.
2. They have a **purpose**: a job or a role the town needs (a shop, a boat, the school, the law). Children go to
   school.
3. They follow a **daily schedule** that takes them through the town: home, work, a meal, leisure, home.
4. They have **at least three relationships** with others in the cast, and **at least one of those has some tension**
   (a rival, an old quarrel, a crush, a sibling).

A test checks all four, for everyone. Anyone who fails is cut, or given a reason to be there.

Every place that is open must have someone running it. A shop nobody keeps is closed, merged or removed.

## 3. The cast: 31 people

### Johansson's family (Kitano-jima)

| Who | Age | Purpose | Home |
|---|---|---|---|
| Johansson | — | ~~Mayor of Minato-chō~~ Chief engineer of the Minato Maru (the player) *(superseded 19 Oct 2026: Nils is chief engineer, not mayor)* | Kitano-jima |
| Thuan | 25 | His wife; ~~keeps~~ owns and runs Sakura Shōten outright *(superseded 19 Oct 2026)* | Kitano-jima ~~, with a weekday room in Minato as now~~ *(the weekday room is dropped, 19 Oct 2026)* |
| Grandmother Chinen | 70s | Tetsuo's mother; the hamlet's one neighbour *(superseded 19 Oct 2026: retired; only family history for Tetsu)* | Kitano-jima |

### Thao's family

| Who | Age | Purpose |
|---|---|---|
| Thao | **34** (was 28) | Runs Minato Izakaya |
| Chin | 36 | Her husband; repairman at the Chin & Tetsuo workshop |
| Vy | **11** (was a high-school teen) | Their daughter; pupil at the island school |

**(decide)** Vy as an 11-year-old at the island school, as the creator asked. That needs Thao to be older: 34 instead
of 28. The alternative is to keep Vy a teen at the mainland high school, with Thao at about 34–36. Either way, Chin is
her father.

### Nhung's family

| Who | Age | Purpose |
|---|---|---|
| Nhung | **37** (was 31) | Bookshop assistant at Front-Row Books; the eldest sister |
| **(decide)** Her husband | — | Proposal: **Kōji**, fisherman. He sorts the catch at the morning auction and crews Mr Ōshiro's boat. |
| **(decide)** Their son | ~9 | Proposal: **Riku**, already a character. A pupil, and Vy's classmate and rival. |

That makes the three sisters three households: Thuan married with no children yet, Thao with a daughter, Nhung with a
son. The cousins are in the same tiny class.

### The others

| Who | Purpose | Why they matter |
|---|---|---|
| **Miss Higa** | Teacher at the island school; keeps the bandai at Umi-no-yu in the evenings and at weekends | Replaces both Mrs Higa and Yonamine-sensei. Single. |
| Grandmother Higa | Owns Umi-no-yu (the Higa family bath); keeps the bandai by day | Miss Higa's grandmother. Wants her married. |
| Tetsuo | Radio repairer at the workshop; chips in at Umi-no-yu (the boiler, the pumps, closing up) | Single, deadpan, 40. |
| Reiko | Edits the evening paper | Nhung's best friend; nose for every story |
| Mrs Sato | Sato Ramen | Widow; the izakaya's rival for the evening crowd |
| Officer Mori | The island's police officer | Reiko's favourite source, and her favourite target |
| Harbour master | The harbour and the moorings | Widower; Mrs Sato's old flame from school |
| Barfly | Night watchman at the Quay Warehouse; Thao's most loyal regular | Given a job; the town's comic chorus |
| Grandmother Sakurai | ~~Owns Sakura Shōten~~ *(superseded 19 Oct 2026: retired; Thuan owns Sakura)* | Old rival of Grandmother Higa since primary school |
| Postman Tōma | The post office and the round | Carries everyone's letters and gossip |
| Dr Kakazu | The clinic | Posted from Naha; the outsider everyone feeds |
| Mr Ōshiro | Fisherman; builds and mends sabani | Kōji's boss |
| Mrs Kinjō | Rainflower Florist; supplies decorations to the town | Business partner, and quarrel partner, of the next |
| Mrs Nakamura | Blue Coral (ice cream and zenzai, merged into one shop) | Single mother |
| Mai | ~10, pupil | Mrs Nakamura's daughter; Vy's best friend |
| Ferry master | Master of the Minato Maru | The old bus driver, at sea |
| Mr Nakandakari | ~~Chief engineer of the Minato Maru~~ Relief engineer *(superseded 19 Oct 2026: Johansson is chief engineer; the identity becomes Mac Turner, with a shore flat and a duty berth)* | ~~Lives aboard~~ |
| Ms Uezu | Bosun of the Minato Maru | Week on, week off; Kōji relieves her |
| Mr Shimabukuro | Runs the power station | Keeps the island lit; Chin's fishing partner |
| Mr Higa Jr | Oiler on the Minato Maru | Miss Higa's elder brother; kept because her safe manning needs an oiler |
| Ms Ganaha | The Port Terminal's ticket window | A spark with Postman Tōma |
| Mr Fujita | The port's linesman | An onsen regular with a bad back; Mr Ōshiro's old racing rival |

The island school becomes a real small-island class: **three pupils** (Vy, Riku and Mai) and one teacher. That is
true to the place (a mixed-grade class) and small enough for each child to be a character.

### Who goes

These go, in favour of fewer people who live:
- the Kitahama households (Taira, Chinen, Gushiken, Tamashiro, Iha, Kohagura and others);
- the Fumoto farmers;
- the Nishi-machi and east-back families who exist only as text;
- the other pupils;
- Mrs Yonamine and Yonamine-sensei;
- neighbours with no purpose (Haru, Mina, Jun, Emi Kado, Mr Toguchi, Grandmother Tokashiki, Old Mr Zukeran, the
  gateball three).

**(decide)** Anyone the creator wants kept: name them, and they get a purpose and a family in the web below.

**(decide)** Fumoto has no one left in it. Either it stays as fields and an empty co-op, or it goes.

## 4. The web: who loves, teases and quarrels with whom

Relationships are data: a pair has a bond, a spark and a tension, plus a history line that stories can quote. These
are the starting points; the engine moves them.

| Pair | Kind | Story it makes |
|---|---|---|
| Johansson and Thuan | Married | The ~~mayor's~~ chief engineer's watches against her shop hours *(superseded 19 Oct 2026)*; weekends on Kitano-jima |
| Thao and Chin | Married, twelve years | They bicker about the workshop's hours and laugh at the izakaya counter at closing |
| Nhung and Kōji | Married | He smells of fish; she smells of books; the morning auction against the bookshop's opening |
| Thuan, Thao and Nhung | Sisters | Rock-paper-scissors in the park (as now), borrowed clothes, the eldest who knows best |
| Vy, Riku and Mai | Classmates (Vy and Riku are cousins) | A rivalry at school; Mai takes Vy's side; Blue Coral after school |
| **Miss Higa and Tetsuo** | Spark, slow | At the onsen after hours: he fixes the boiler, she pretends not to watch. Grandmother Higa pushes. |
| Reiko and Officer Mori | Spark, prickly | She wants his stories; he wants her to stop printing them |
| Mrs Sato and the Harbour master | Old flames | Widow and widower; he eats ramen every day and never says why |
| Thao and Mrs Sato | Rivals | The evening crowd: izakaya against ramen. They fall out, then make up over a delivery. |
| Grandmother Higa and Grandmother Sakurai | Rivals since school | Every town event is a contest |
| Barfly and Mrs Sato | Hopeless crush | Comic: he orders the ramen he can't afford |
| Mrs Kinjō and Mrs Nakamura | Shopmates, prickly | Two shops sharing one ground floor and its walkway |
| Chin and Tetsuo | Partners, old friends | The workshop; the odd quarrel over a botched job |
| Chin and Mr Shimabukuro | Fishing partners | Off the seawall at dawn on Sundays |

The rules **(decide if any should change)**:
- Flirting happens between single adults, and between spouses.
- Children have friendships, squabbles and crushes only in the playground sense.
- Jealousy is played for comedy, never for harm.
- Quarrels always have a way to be made up: an apology, a gift, or a shared laugh.

## 5. How it works in the game

1. **One cast file (`src/people/cast.js`).**
   - For each person: family, home, purpose, schedule, personality, look, and their relationships.
   - Everything else reads from it: the profiles, the households, the neighbours, the classroom, the onsen, the
     ferry crew, the Town Book, the guide and the storyteller.
2. **Everyone walks.**
   - All 26 run the schedule engine the 10 walking residents use today: home, work, a meal, leisure, home.
   - The fixed-spot neighbours retire.
   - Rooms (the school, the onsen, the ferry) show the person whose schedule puts them there. Miss Higa is in the
     classroom by day and at the bandai in the evening; Tetsuo walks from the workshop to the onsen's boiler room.
3. **Relationships and moods (`src/people/relationships.js`).**
   - Each pair has a bond, a spark, a tension and a memory of recent moments, saved with the game.
   - Each person has a mood (happy, cheerful, annoyed, angry, sad, embarrassed, smitten) that lasts hours, not a
     single line.
   - When two people meet (their schedules cross at a shop, the park, the onsen or the izakaya), the engine picks
     what happens from their state and personalities: they chat, laugh together, flirt, tease, quarrel, make up,
     gossip about a third, or give a gift.
   - Each moment changes the pair's numbers and both moods.
4. **It shows in town.**
   - Body language and faces carry the mood, building on the existing `lineFeeling`.
   - A couple walks side by side. Two people who have quarrelled sit apart at the counter and won't look at each
     other until they make up.
   - Someone smitten lingers.
   - The neighbour chats draw their lines from the pair's state, so the words match.
5. **Stories use it.**
   - The storyteller picks a pair with something going on: a quarrel, a spark or a rivalry.
   - The Town Book shows each person's family and their closest people.
   - The evening paper (Reiko's) can print the town's gossip.
6. **Homes: the ones that exist** (the creator, 2026-10-14: "Scrap my flat idea, consolidate and remove unused
   characters instead make every character have a purpose and I think there are enough homes").
   - No new buildings for people: everyone lives in a home that already stands. The apartment drawing set was removed.
   - A house nobody lives in after the cuts is either kept (to let, or turned to a use the town needs) or removed.

## 6. Order of work (small batches, each checked in the live game)

1. **Cast file and cuts.** Done (2026-10-14).
   - `src/people/cast.js`: the 31, with home, purpose, place, day, family and the relationships (`RELATIONSHIPS`), and
     `PLACES` with who keeps each, or why it is closed.
   - The registry (`island-households.js`) is built from it; a home nobody lives in is to let.
   - The cut people are gone from the neighbours, the registry, the guide, the storyteller's places, the shops' data,
     the avatars and the town's texts. Mrs Higa became Miss Higa, the teacher, with one face at the school and the bath.
   - `tests/cast.test.mjs` checks the four rules for everyone, that every open place has keepers, and that nobody in
     the world is outside the cast (the classroom's eight old pupils are the only ones waiting, for batch 2).
   - Still to follow in batch 2: Vy and Riku as children, the class of three, Nhung moving to 3 Kitahama, Barfly at
     the warehouse, the onsen shifts, and everyone on `cast.js`'s days. Closed shops still look open until batch 5.
2. **Families and schedules.**
   - Vy, Riku, Mai and Miss Higa with their days; the onsen shifts (Grandmother Higa by day, Miss Higa and Tetsuo in
     the evenings).
   - Everyone walking.
3. **Relationship and mood engine.**
   - Pairs, moods, encounters, saved state, tests.
   - Lines first, then body language.
4. **Showing it.**
   - Walking together, sitting apart, making up, gifts, faces; the Town Book page.
5. **Homes.**
   - Everyone in a home that exists; empty houses kept to let, given a use, or removed.
6. **Stories.**
   - The storyteller and the evening paper use the relationships.

What each batch touches (tests, routines, film shots that show a person who goes) is listed before it starts, as
CLAUDE.md asks.

## 7. Decisions for the creator

1. Vy's age: an 11-year-old pupil (Thao becomes 34), or a teen at the mainland high school?
2. Nhung's family: Kōji as her husband and Riku as their son? Or other names?
3. Miss Higa: she replaces Mrs Higa (who had two sons) and Yonamine-sensei. Is she single?
4. Anyone on the cut list to keep?
5. Fumoto: keep it as empty fields, or remove it?
6. Are the relationship rules in section 4 right?
