# What Animal Crossing teaches Johansson World and Studio

A study of two Animal Crossing games (2026-10-11), and what we built from it.

## What was studied

The two games were:
- **Dōbutsu no Mori** (N64, 2001), in the English fan translation. It is a 32 MB cartridge image.
- **Animal Crossing: Wild World** (Nintendo DS, 2005, US v1.1).

The tools were:
- **Ghidra 11.4** (headless) for the DS game's ARM9 program. It found about 12,000 functions, and every function was decompiled and searched.
- Our own small readers for the file tables:
  - the N64 `dmadata` table and its Yaz0 compression;
  - the DS NitroFS, the LZ10 wrapper and the BMG message files.

**Nothing from the games is in this repository.** We copied no art, models, sounds, text or code. The ROMs, the files taken from them and the readers stay outside the repo.
- What we took is **how the games are organised**: the structure, the counts and the rules.
- Everything under "What we built" below is new: our code and our own words, set in Minato Machi.

## 1. The engine: one shared shape for everything

**The N64 game is built on the Zelda 64 engine.**
- The cartridge's build tag reads `forest@srd038J.srd.nintendo.co.jp`. The Zelda games read `zelda@srd…`.
- The data is a table of **3,375 files** (`dmadata`), and 3,299 of them are compressed.
- The source file names left in the build show how the code is divided:

| Prefix | What it is | Examples |
|---|---|---|
| `ac_` | an **actor**: anything that lives in the world and updates every frame | `ac_snowman`, `ac_weather`, `ac_house_clock`, `ac_insect_ctrl`, `ac_my_room`, `ac_shop_manekin`, `ac_gyo_kage` (a fish's shadow) |
| `bg_` | items that lie on the ground | `bg_item`, `bg_cherry_item`, `bg_xmas_item`, `bg_winter_item` |
| `ef_` | effects | `ef_yukidama` (a snowball), `ef_mizutama` (a water drop), `ef_turi_suiteki` (drips off a fishing line) |
| `m_` | managers and screens | `m_msg_main`, `m_choice_main`, `m_field_make`, `m_scene_ftr`, `m_item_name`, `m_handbill` (letters), `m_inventory_ovl`, `m_catalog_ovl`, `m_submenu_ovl` |

**Every actor has the same four-part life: init, destroy, update and draw.**
- A table of actor profiles records each actor's id, category and which art it needs.
- Actor code is loaded only while the actor is in use. These "overlays" are what the debug strings `oactor_dlftbls` and `Actor_draw` refer to.
- The developers tuned the game through **named banks of live debug numbers**, one bank per person or system: `CAMREG`, `PLAYERREG`, `DEMOREG`, `SAKREG`, `TAKREG` and so on.

**The DS game is written in C++,** with virtual methods and objects that carry a table of their methods.
- Its main program is 1.3 MB. It has **148 code overlays**: big ones for whole modes, and about 35 tiny ones (128–700 bytes) that are loaded at one shared address. Those small ones are probably one-off behaviours swapped in and out.

**Lessons for World:**
- `game.js` updates each system by hand in one loop of about 1,800 lines.
- A small **actor registry** (`{id, category, init, update, draw, destroy}`, plus a list of what each one needs loaded) would let new things (a snowman, a stall, a ferry crew member) plug in without editing the loop. It would also let us load their code only near the player.
- Live tuning banks per system (camera, player, cast) would be a cheap upgrade on the Settings sliders.

## 2. The content database

The DS game is **9,504 files**:

| Folder | Files | What it holds |
|---|---|---|
| `ftr/` | 3,585 | Furniture: **700 models**, 140 of them with up to four extra colourways (`a`–`d`), each one a model and its textures |
| `script/ENG/` | 1,791 | All the words (see section 3) |
| `menu/` | 734 | The screens: inventory, catalogue, letter, keyboard chat, map, bank, museum, clock |
| `npc/model` | 300 | **150 villagers**, each a model and a texture, about 6 KB each |
| `FcAnm/`, `PFcTx/` | 367 + 32 | Faces drawn as **swapped textures**, animated by switching between them |
| `cloth/` | 256 | Shirts. They are **textures only**, worn by just **two body models** (`PBody/boy`, `PBody/grl`) |
| `PHead/`, `PGls/`, `PItm/` | 158 + 75 + 98 | Hats, glasses, and items held in the hand |
| `fish/`, `insect/` | 284 + 129 | The creatures you can catch |
| `str/arc/*` | 336 | Buildings, each with an **`s` (summer) and `w` (winter) version and an `_lt` night-lit version** |
| `fg_data/`, `bg/rndCand.bin` | — | **Hand-made templates for town blocks**: the town is assembled from these designed pieces, not from random noise |
| `item_info/`, `ftr_info/` | — | Item tables (12-byte records) and furniture tables (8-byte records: footprint, category, flags) |
| `item_info/series.bin` | — | Furniture **series** (named sets of matching furniture) |

**Lessons:**
- **A wardrobe of textures, not meshes.** Hundreds of outfits cost almost nothing when clothes are textures on one shared body. World's procedural avatars could take printed patterns the same way.
- **Seasons and night as data.** Each building ships with its summer, winter and lit versions. World's rainy season, typhoon days and evenings could switch a building's look by its id, not by code written for each building.
- **Towns from designed blocks.** Studio's island builder (`briefs/NEXT.md` section 6) can work the same way: hand-made street and plot templates, joined by rules. Every block then has a purpose, which keeps "nothing is random".
- **Items need real records:** id, name, price, category, footprint, series and seasonal versions. World's bag is a list of plain strings. Studio's asset format (`asset.json`, section 5) is the right place to start these records.
- **Small is fine.** A whole villager is about 6 KB and a piece of furniture about 1.5 KB. Charm comes from proportion, colour and motion, not polygons.

## 3. The dialogue system: the heart of it

The DS game has **12,903 messages**. 9,100 of them are what villagers say, and they are organised like this:

```
script/ENG/message/<personality>/<category>/<name>_.bmg     (3 variants per file is typical)
  personality: bo, fu, ge, ha, ko, ta  (the six villager types)
  category:    ai   greetings by situation: first meeting, not seen for 7 or 30 days, rain, snow, indoors,
                    angry, sad, stung by bees, fell in a pit, a shop sale today …
               tsu  ordinary talk by topic (clothes, fish, flowers, fossils, furniture, insects …), each topic
                    in two kinds: _act (what I've been doing) and _hint (a tip that teaches the game)
               3p   what this personality says about each of the other personalities (gossip by type)
               ap   requests: buy from you, sell to you, trade, a present, a new nickname, a new catchphrase
               q01–q12 the twelve kinds of errand, each with the same steps (see below)
               ev   events: fireworks, the fishing tourney, the flea market, karaoke, countdown, birthdays
```

**Ghidra showed how the code reaches these files.**
- The game code never names a file. It asks for a **key and a variant count**, for example `ai_rain2`/6, `ai_30days`/6, `tsu_always`/20 or `q_error1`/2.
- The loader (at `0x02066978`) splits the key at `_`. It then builds `%s/%s/%s/%s_.bmg` from the **speaker's personality**.
- So one line of game logic ("greet the player, it's raining") serves all six personalities, and a writer can add a personality without touching code.

**Inside a line, control codes direct the delivery** (`0x1A`, then its length, a group and a type):

| Group | What it does | Seen |
|---|---|---|
| 01 | timing: wait N frames, wait for the button, start or end of a shout | 33,000 waits |
| 02 | a choice menu: the reply lines and where each one leads | 312 messages |
| 04 | fill-ins: villager name, catchphrase, town, player, item | 13,000+ |
| 06 | jump to one of several messages | |
| 07 | **the speaker's face or animation, mid-line** | 19,000+ |
| 0b | letter fill-ins: the item, the signature | |
| ff | text colour | |

These numbers set our house rules:

| Measure | Value |
|---|---|
| Message length | about 100 characters (median 101, p95 218) |
| Characters per line | 22 (median), at most 31 |
| Lines per box | 3 |
| Pauses per message | 3.6 on average |
| Expression changes per message | 2.2 |
| Fill-ins per message | 1.4 |

A line is *directed*: the beats and faces are written into it. The N64 game does the same with its own codes. `0x7F 0x03 nn` pauses for nn frames and `0x7F 0x04` waits for a button, so the delivery reads "So,<pause 6> I'm going to ask a few questions".

**Word pools make the lines vary.**
- `string/st_food`, `st_drink`, `st_sweet`, `st_sports`, `st_music`, `st_object` and `st_fashion` are lists that a template fills a slot from.
- `st_npc_habit` holds 150 catchphrases, and `st_nickn` the nicknames villagers give you.
- `st_impress` holds 88 impressions villagers form of you ("pizza face", "black thumb"). The villagers *remember who you are*.
- `st_learn` holds the expressions you can learn from them.

**Letters are assembled from parts.**
- `mail/super` is the greeting, `mail/msg` the body and `mail/ps` the P.S. Each is written per personality and occasion, with three variants of each.
- That gives 27 letters per occasion per personality, and each one still sounds like one person.
- The game also **grades the player's letters** (`st_mailcheck` is a table of three-letter word fragments it recognises) and filters bad words.

**Every errand runs through the same steps.**
- The steps are: request, then confirm, then hand-over or "pockets full", then thanks. Things can also go wrong: too late, wrong person, cancelled.
- A new errand is new lines, not new code.

**Lessons for World:**
- World already has some of this:
  - the four temperaments in `people/chat-lines.js` (any opener, reply and comeback combine);
  - friendship hearts and daily wants;
  - the `|` beat and `&` name in `dialogue-engine.js`.
- What it lacks:
  - **beats and faces written inside the line**;
  - **greetings that notice the moment**;
  - **letters**;
  - **a shared errand shape**;
  - **gossip by temperament**;
  - **impressions the residents form of Johansson.**
- Each of these makes more stories for the storyteller. That is why they come first.

## 4. The interface

The DS game puts the world on the top screen and all the controls on the touch screen. The bottom screen has:
- a row of tabs: items, clothes, map, letters, catalogue, design, the town notice board;
- a portrait of the player;
- money as one big number;
- a grid of pockets (15 slots, with clothes and tools as icons);
- a column of letters.

What makes it work:
- **Everything is a thing you can see.** Items are icons in slots, not names in a list, and letters are envelopes. A full bag is visible before the game tells you.
- **Drag to act.** You drop an item on the portrait to wear it, on a slot to swap it, on the bin to throw it away. There are no menus inside menus.
- **One big number** for money, one portrait, one grid. There is nothing else to read.
- **The keyboard is part of the game** (`menu/chat2/key0–9`). Writing letters and chatting is a feature, not a settings screen.

**For World:**
- The phone controls already have the joystick and the action rail.
- The bag should become a grid of item icons once items have ids (section 2).
- Letters need a mailbox screen showing the stationery (below).
- The "Town book" can hold the tabs.

## 5. What we built (our own versions)

These are new modules in World, with tests. All the words are our own and set in Minato Machi. They follow the house rules: nothing is random, and every face used is one the town can draw.

| File | What it is | What it learned from |
|---|---|---|
| `src/dialogue/markup.js` | Inline cues for a line: `{p}` / `{p:3}` beats, `{face:happy}` mid-line faces, `{big}…{/big}` emphasis, `{name}` `{me}` `{catch}` `{town}`, `{pool:food}` and `{any:a/b}` picks fixed by a seed, and a linter that uses the numbers above. Its output has the shape the existing dialogue box already takes (`pauses`). | control codes, word pools |
| `src/mail/letters.js` | Letters assembled from a greeting, a body and a P.S., for 4 temperaments and 5 occasions: a favour to ask, a thank-you for a present, a thank-you for help, missed you, and typhoon. Nobody writes to the mayor as a newcomer: he has lived here since 1979. See the rules below the table. | the letter system, letter grading |
| `src/people/greetings.js` | The opening line chosen by the most specific true situation: their birthday (only once residents have real birthdays), away 30 or more real days, away 7 or more, typhoon, rain, late night, early morning, or usual. Two lines per temperament for each, rotated by the day. | `ai_*` greetings |
| `src/people/errands.js` | One shared shape for errands: deliver, fetch or return. The steps are ask, yes or no, check-in, hand-over or hand-back, done, late, pockets full, and wrong person. Each step has lines per temperament, and each ending records a **moment** the storyteller can use ("Johansson promised Emi he would take a sanshin string to Kenta, and the day ran out."). | `q01–q12` |
| `tests/animal-crossing-lessons.test.mjs` | 11 tests. They cover every combination of temperament and occasion, the mailbox rules, the greeting priority, every errand step, and checks that no markup is left over and no face is unknown. | |

The rules in `letters.js`:
- A present is enclosed only with a thank-you, and it is always the sender's own favourite.
- The P.S. is the sender's own clue when they have one, so it points somewhere real.
- Each temperament has its own stationery: Hibiscus, Storm sky, Kraft or Ledger. The town's own Quay blue is the fifth. Each is drawn as an SVG (`stationerySvg`).
- The mailbox holds 10 letters, never delivers the same letter twice, and keeps unread letters.
- `rateLetter` grades a letter Johansson writes the way a reader would. Did he greet them, use their name, say something, and sign it? Was he shouting or mashing keys?

**Switched on by the one-day slice** (2026-10-11, `briefs/one-day-slice/`, each batch checked in the game):
1. **Greetings.** The first talk of the day with anyone, resident or neighbour, opens with the greeting for the moment (`activities.js` `openingGreeting`). Its beats hold the typewriter (`dialogue-box.js`), and its first face shows on the speaker.
2. **The post.** Postman Tōma's 10:30 round brings letters to the box inside the mayor's door (`src/mail/post.js`, `buildMayorHome`). They read on the sender's own paper, and a present inside goes into the bag once. A present given today brings a thank-you letter tomorrow.
3. **One favour** (`src/people/favours.js`). Nhung writes asking the mayor to call in. At the bookshop she asks him to take a Ryūkyū cookery book, bookmarked at the small-fish page, to her stubborn sister Thao at Minato. The steps:
   - Anyone else shown it says it is for Thao.
   - Thao sees straight through it.
   - The diary and the Minato Evening News on the mayor's television retell it.
   - Nhung writes to say thank you the next morning.

**Still to switch on:**
- the long-absence letter;
- typhoon days (there is no typhoon weather yet);
- real birthdays;
- more favours;
- moving the Sakura script and the residents' lines over to the line cues.

## 6. Recommendations, in order of how many stories they make

1. **Letters** (built here). They are a story in a box, and they bring the player back.
2. **Situational greetings** (built here). The town notices you.
3. **Errands with moments** (built here). Every ending feeds the storyteller.
4. **Impressions and nicknames.** Residents remember what Johansson does (always fishing, never pays at Minato, helped in the typhoon) and say so, in greetings and letters.
5. **Gossip by temperament** (`3p`): what a sunny resident says about a dry one. It fits `neighbour-chats.js` directly.
6. **Hints in small talk** (`tsu_*_hint`): ordinary talk that teaches the game and points to places not yet found. This is a natural home for the profile clues.
7. **An item database with ids** (section 2), then the bag as an icon grid (section 4).
8. **An actor registry** for `game.js` (section 1).
9. **Studio:** seasonal and night versions as asset data, and designed block templates for the island builder (`NEXT.md` sections 5 and 6).

## 7. The Tomodachi Collection guide (a second source)

**The source.** *Tomodachi Collection: Shin Seikatsu, Kurashi Kaiteki Guide* (トモダチコレクション 新生活 暮らし快適ガイド). It is a 36-page supplement to Famitsu DS+Wii, May 2013, for the 3DS game known in the West as *Tomodachi Life*. It is a scan with no text layer, so it was read page by page. It explains systems, not data, and its screenshots are Nintendo's, so we use the ideas only.

**What World already has.** The town already took two of these ideas:
- Personality from dials: the game uses 5 sliders giving 16 types in 4 families (easygoing, outgoing, cool, confident). World has `avatars/personality.js` (4 dials, 16 island personalities, 4 temperaments).
- A voice from sliders: the game has pitch, speed, quality, tone, accent and intonation. World has `voiceOf`.

**What it adds, by how many stories it makes:**

1. **The nightly news from what really happened** (Mii News).
   - A bulletin every morning and evening reports the island's own events: who became friends, who broke up, a new facility opening. It also runs absurd items (a new squid-flavoured toothpaste, "the world's smallest resident found: 3 mm").
   - The earlier game had over 130 kinds of news.
   - *For World:* a "Minato Evening News" in the feed (`src/feed/`), written from the day's `moment`s. The errands in `people/errands.js` already record these; friendship hearts, letters and purchases would add more. Each item is true to the town and shot in the real rooms.
2. **Dreams.** At night, a sleeping resident's dream can be watched.
   - The dreams are surreal little scenes starring other residents: a factory making copies of someone, a ninja behind the paper door. Watching one gives an item.
   - *For World:* a dream is a comic the storyteller is allowed to make silly. It is still cast from the dreamer's real friends, places and worries, so it keeps "silly but makes sense".
3. **Residents' needs as one picture** (the apartment block).
   - The hub screen is the building, with a window per resident. An icon in the window says what they want: an orange icon to make a friend, green to play, a pink heart for love, a dark cloud for a worry.
   - *For World:* the minimap or the Town book can show who wants something today, as one icon per kind of need. The daily wants and errands are the first two kinds.
4. **Relationships between residents, steered by the player.**
   - Residents ask for advice ("I'd like to be friends with Emiko"). The player chooses the topic or the place, and the result plays out: friendship, a quarrel and a making-up (or not), a confession that succeeds, or one that fails.
   - A confession can fail at the park, fail at the café, fail because they already like someone else, or a rival can step in at the last moment.
   - There is a chart of who is friends, best friends or a couple with whom.
   - *For World:* a relationship graph between residents (it can start from `profiles.json` `friend`). Johansson's advice becomes an errand kind, and each ending is a moment the news can report.
5. **Tastes that are discovered, not shown.**
   - Each resident has one all-time favourite food and one they can't stand. The profile shows "???" until the player has fed them and found out.
   - *For World:* the tastes in `resident-personalities.js` start hidden, and finding one out is a field-book entry and a story ("Mr Tanabe tried goya champuru. Never again.").
6. **Satisfaction that levels up into a choice.**
   - Presents, food and help fill a resident's satisfaction. At each level the player picks one reward for them: a song, a phrase, an item, or a room style.
   - A separate fullness meter falls over time.
   - *For World:* this fits beside friendship hearts. "Teach them a phrase" is the catchphrase that `{catch}` in `dialogue/markup.js` already fills in.
7. **Small things the town could add:**
   - **Daily rankings** on a notice board: the luckiest today (from the birthday), the most popular this week.
   - **A compatibility reading** from two birthdays, with a named type: "75%, the matching-outfits pair"; "100%, friends for life".
   - **Shops whose stock changes daily:** the food shop's menu turns over every day.
   - **Room styles sold as whole sets:** Shōwa, a child's room, a fast-food room, a live house.
   - **A pawnshop for odd treasures.**
   - **A photo studio** with group poses and backdrops. It belongs in Studio.
   - **A concert hall** where residents sing lyrics the player writes. The Minato izakaya's karaoke is the natural place for this.
   - **Quick games** when a resident wants to play: a silhouette quiz, a mosaic quiz, catch, old maid, paper sumo.

**The design idea under all of it.** The guide says on page 3: there are no goals and no ending, and what happens is decided by the residents' own wills. The player's part is to watch, help and meddle. That is a storytelling game's whole method: the town makes situations, the player nudges them, and the news, the dreams and the letters retell them.
