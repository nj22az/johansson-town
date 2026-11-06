# Boku no Natsuyasumi (PS1, SCPS-10088, EN patch) — lessons for Johansson Town

Study notes from a local reverse-engineering pass (Ghidra 12.1.4 headless + Python data parsing).
Everything extracted lives only under `/Volumes/Instron/PSX/re-bokunatsu/` and is for study; nothing was
copied into the Johansson Town repo. No game text or art is reproduced here beyond names and counts.

Legend: **[C]** confirmed (decompiled code and/or parsed data agree), **[I]** inferred (strong hint, not proven).

---

## 0. How the study was done (reproducible)

| Step | Tool / file |
|---|---|
| BIN/CUE → ISO9660 (MODE2/2352, user data @ +24) | `tools/extract_iso.py` → `iso/` (29 files: `SCPS_100.88`, `SYSTEM.CNF`, `BOKU.BIN` 109 MB, `__STR/*.IKI` 25 FMVs, `__STR/BOKU_XA.XAM` 197 MB XA audio) |
| Split `BOKU.BIN` (packed `_DATA` dir) | `tools/split_boku.py` → `data/` (+ `data_index.txt`). The EXE embeds the dev-disc file table at `0x800241d4`: 305 name pointers, preceded by parallel size[] and LBA[] arrays. `offset = (LBA − 0x416) × 2048`. The `M_FILES.BIN` entry is stale (LBA 281 = bias used by `M_FILES.SEC`). |
| Split maps | `M_FILES.SEC` (555 × {name[8], size u32, sector u16}) → `maps/*.BIN` (546/555 validated by header) |
| Ghidra | `ghidra/boku.gpr`; `main.raw` = EXE minus 0x800 header, MIPS:LE:32:default @ `0x80010000`, entry `0x80049154`. Seeded 355 `addiu sp,-N` prologues → 1376 functions. Scripts in `ghidra/scripts/` (`Dec.java`, `Refs.java`, `Strs.java`, `Seed.java`). Decompile dumps `ghidra/dec*.c`. |
| Formats | `tools/tim.py` (TIM parse/render), `tools/evparse.py` (event index, message count, glyph decode) |

---

## 1. Findings

### 1.1 Clock & calendar — a 31-day summer with an *hour/minute* clock that only moves when you act **[C]**

* Current date/time struct at `0x80028fa0` = `{u8 day 1..31, u8 hour, u8 minute}` (mirror at `0x80028fb0`).
  New game starts **day 1, 14:00** (`FUN_8002e19c`). Debug editor (`FUN_80034110`) clamps day 1..31, hour 7..22.
* **Time does not tick in real time.** It is advanced only by:
  * **Screen transitions**: `FUN_80018f8c` adds minutes from a per-area table at `0x800246d7` indexed by the map's
    area letter: **A 9 min, B 12, C 7, D 7, E 2, G 4, H 4, I/J 0** (two hub maps H19/H26 are exempt).
    → far-flung areas cost more of the day; the home cluster is cheap.
  * **Each conversation/event**: `FUN_8002ce8c` adds **4 minutes** after any event that ran a "real" opcode, unless the
    script set the time itself.
  * **Scripted jumps**: event opcode 0x1D (`FUN_8002ff8c`) sets an absolute time or adds h/m.
  * A handful of hard-coded long walks (e.g. A19←H27 adds 21 min, `FUN_800197b0`).
* **Day phases are hour bands**, used consistently by several subsystems (`FUN_8001d824`, `FUN_8001ad5c`):
  `<10:00 morning`, `10–14 midday`, `15–18 afternoon`, `19+ night`, with **10:00 and 15:00 as cross-fade hours**
  (minute/60 blend between neighbouring bands).
* **Summer is split into thirds** (`(day−1)/10` → early / mid / late) — the second calendar axis used by ambience
  and insect spawning.
* **Curfew**: `FUN_80019054` clamps the clock at 17:00 while outside (day mode) and at 22:00 in night mode;
  `FUN_8001933c` fires a "go home" event (id 8 / 0xFD7) when hour > 16 in any of 17 outlying maps
  (`0x8002472c`: A02, A04, A10, …) and a bed-time event (id 0x11) at night after 21:00.
  Night mode (`0x80024724`) only allows the house/garden areas (G*, H*).
* **Day rollover** `FUN_80019184`: day++, time = 07:00. Naps/sleep `FUN_800192d4`: wake at 07:00, 15:00, or 19:00
  (the last one switches to night mode).
* Practical day length: 07:00→17:00 = 600 "minutes" ≈ 50–80 screen changes + chats. The player *spends* the day.

### 1.2 Events, flags and per-day NPC presence — data-driven, keyed by **day × hour × map × flags** **[C]**

* **Event IDs encode the date**: `id = day*100 + slot` (e.g. 104, 112, 140 = day 1). `FUN_80030784` admits an event
  only if `id/100 == today` (or 0 / ≥40 = evergreen). Slots `xx01..xx04` are **fixed-hour routine events** that
  require hour == 7, 8, 18, 19 respectively (wake-up/breakfast/evening/dinner style anchors), each latched once
  per day.
* 265 events in `EV.BIN` (`EV.SEC` = {id, bytes, sector}); 6–17 per day (avg ≈ 8.5). Ids 4000–6105 are evergreen
  (hobbies, ending). Each map additionally embeds its own event table (map section 1); maps average 2.6 events,
  **the dining room G02 has 27 (meals on 19 different days)**, a riverside map D07 26, H09 21.
* Every placed event has a **condition tree** (`FUN_800305f4`): AND/OR nodes over leaves *map* (8), *flag* (9),
  *hour* (0x0A), *day* (0x0B). An NPC "being somewhere" is simply an event whose **setup prologue**
  (opcodes < 6, run by `FUN_8002d6d8` on map entry, ends at op 0x15) spawns the actor; talking runs the rest.
  So a schedule is not a separate table — it is *"this person appears at this spot when (day, hour-range, flags)"*.
* Script VM: `FUN_8002d23c`; `{op u8, len u8 (halfwords), args…}`; 40 opcodes, jump table `0x80029014`.
  Each event declares its cast (char id + animation-set) in section 0.
* Flags: 64 per-map local slots × 8 bytes at `0x80035c48` (`{map[3], event id, value}`) + 256 global byte
  counters at `0x80035e48`. Debug HUD prints `MMDD_TT`, `EVENT n`, `FLAG n`.
* **Cast is tiny**: 20 model ids (`H_FILES.SEC`, 115 model files, avg 45 KB). Dialogue speakers in events ≈ 10
  (the boy, uncle, aunt, 2–3 cousins, 4 village kids, a few adults). 921 event messages total, avg ≈ 70 glyphs —
  i.e. **~30 short lines per day**, nearly all date-specific. Uncle speaks on all 31 days, the aunt on 25,
  a cousin on 28, village kids on 15–18 days, one girl on only 7 (scarcity = specialness).
* **Outfits change by day** **[C code / I meaning]**: `FUN_80018620` adds +50 to the model variant for the 5 main
  characters when bit *n* of `dayMask[day]` (`0x80024b28`) is set. Bits rotate every 1–3 days for the cousins;
  the boy's alternate set is only used on day 1 and day 31 (arrival/departure clothes).

### 1.3 The world physically changes with the calendar **[C data / I meaning]**

* 165 scenes (areas A–E outdoors, G house interior, H house/garden, I close-ups/minigames, J special).
  555 background files = **scene × lighting × variant**: name `A04 1 01` → scene A04, lighting 0 = day,
  1 = evening, 2 = night (night only exists for the home areas G/H), variant 01.
* `EVVER.BIN` selects variants with a **32-bit day mask** + lighting field, e.g. G02 (dining room) has 21 variants
  each on 2–8 specific days → *the food on the table differs from meal to meal* (verified visually);
  H13–H26 change for days 24–31 (end-of-summer/festival set dressing); G06 has single-day variants (days 2, 5, 8, 14);
  A10 changes from day 21, B13/D01 for days 16–26.
* Special ambience is hard-coded to dates too (`FUN_8001d708`): one emitter class plays only on day 25 after 17:00
  and day 26 before 14:00 (a festival evening), another on day 8 morning.

### 1.4 Diary — one picture per day, chosen by *significance*, never repeated **[C]**

* `NIKKI.BIN`: 94 pages, each a **240×192 8-bpp image of a child's drawing with a one-sentence caption baked in**.
* Anything diary-worthy calls `FUN_80031cb0(id)`: keeps the candidate with the **highest priority**
  (table `0x80029890`: ids 1–71 priority 3–16; ids 72–100 priority 1). Callers: event VM, bug-catching code.
* At bedtime `FUN_8002e8ec` stores the winner into a per-day array (`0x8004612f + day`). If the day produced only
  a "boring" entry (ids 20, 38, 39, 50, 52, 55, 57, 69, 70 at `0x800294a0`) a **filler page from 72+ is issued
  sequentially** (`FUN_80031b50`: max used + 1), so no two days ever share a page. Day 31 has a special
  check that can award page 100 **[I: exact condition]**.
* Diary is re-viewable later from the title's "MEMORY/DIARY" modes (`TITLE.OVL` strings).

### 1.5 Hobbies / collecting — small, statistical, calendar-aware **[C]**

* **Insects**: 60 species (`MUSIDATA.BIN` 60 × 10 bytes). Per species:
  `[early%, mid%, late%, morning%, midday%, afternoon%, night%, category, sizeMin_mm, sizeMax_mm]`.
  Spawn roll (`FUN_8001ad5c`): `rand < spot% × third% × band% × luck`, per spawn group (map section 4;
  97 of 157 base maps have 1–N groups, avg 3.3). Sizes give every catch a *record* to beat.
  Collection state: 60-entry arrays (`FUN_80037f70`), encyclopaedia overlay `ZUKAN.OVL`, specimen `HHON.OVL`.
* **Beetle sumo** (`MUSI.OVL`): beetles have HP/STR/DEF0/DEF1/SPD stats; 5 rival beetles (`KABU_00..04.KBD`).
* **Fishing** (`FUN_80021274`): bite chance from a 3-D table (`0x8002505c`): bait (4) × midday-or-not × spot type
  (3) → 5/15/25 %, plus a luck bonus; fish steer toward the lure with randomised headings.
* Also: treasure items (`TK_ITM`, `TZKAN`), photos/pocket (`PK_PHO`, `PK_ITM`), a kite-like flying minigame
  (`TAKO.OVL`: tilt/rise/fall limits) **[I]**.

### 1.6 Soundscape — per-scene emitter table × summer third × time band, with cross-fades **[C]**

* Map section 5 = 12-byte records `{u8 third, u8 band, u16 alwaysOn, u16 bank, u16 sound, u16 volL, u16 volR}`
  (avg 43 records per scene, max 70). `FUN_8001d824` picks records for (third, band), cross-fades between bands
  during the 10:00 and 15:00 hours, and diff-starts/stops voices (`FUN_8001d06c`).
* 29 distinct ambient sounds total; bank 1 (six loops, presumably cicada species) dominates, plus water
  (bank 11), wind/birds etc. **232 of 249 scenes change their ambience between early, mid and late summer**.
  Hand-panned L/R volumes make each camera angle sound placed.
* Area SFX banks per area letter (`S_A_AREA.SE`… `S_H_AREA.SE`); 15 sequenced BGM tracks (`SBGM01–15`);
  streamed XA (`BOKU_XA.XAM`, channel table `BOKU_XA.XCH`); 25 FMVs (`*.IKI`).

### 1.7 Pre-rendered backgrounds + 3D actors **[C format / I compositing details]**

* Every scene background is a single **8-bpp TIM** (546/546), typically 320×240 up to 720×240 (pannable),
  with **avg 5.8 / max 21 CLUTs** — each fragment gets its own 256-colour palette.
* The page is an atlas: the painted view **plus cut-out foreground fragments** (tree trunks, rocks, car,
  furniture, plates) that are re-drawn over actors as occluders; section 2 holds small UV rects
  (animated overlay frames, e.g. water glints/leaves) **[I]**.
* A 98×79 8-bpp **mini-map thumbnail** per scene (section 3) for the "where am I" view.
* Scene files average 148 KB (max 215 KB). Lighting variants are separate paintings, not runtime tints.

### 1.8 Scale (for calibration)

165 scenes · 31 days · ~10 speaking characters · 20 models · ~920 event lines · 94 diary pages ·
60 insects · 29 ambient loops · 15 BGM tracks. Small numbers, very dense *variation over time*.

---

## 2. Recommendations for Johansson Town

Johansson Town context (from a read-only survey, 2026-10-05): real-time clock (`src/town-clock.js`, 1 town day = 1440 real minutes, 1997 calendar, weekday); phases in `src/render/dusk.js`; 11 active residents with rule-function schedules (`src/people/social.js` `residentPlan`, `commuter-schedule.js`, `home-life.js`), the same every day apart from day%2 toggles and rain; `anchored-cast.js` dayOff data is unused; 17 chat topics × 4 temperaments filtered by hour and rain only; journal = `state.notes` "field book" (`activities.js` ~l.225/250); fishing catches one species; no bugs, shells or catalogue; weather sunny/cloudy/rain Markov in untracked `src/world/weather.js`; audio = cicadas by day and crickets at night sharing one point, water, radio, train, and the rain parameter is unused (`src/audio/town-audio.js`). Docs: `docs/AMPLIFY-AUDIT.md` §7/§8 already ask for a Town Book, seasons and festivals, and a "life engine".

The core lesson: **Boku no Natsuyasumi is small but almost everything varies with the date.** Johansson Town has the space and the people, but every day plays the same. Most of the items below add a **date axis** to systems that already exist.

### P1 — Add a `townDay` calendar axis and date-keyed content (foundation)
* **What:** in `src/town-clock.js`, export `townDay(minutes)` (days since a fixed epoch, or the 1997 day-of-year) and `seasonPhase(day)` → early/mid/late (BokuNatsu uses `(day-1)/10`; for us, use 10-day blocks or real 1997 months). Also export `phaseBand(minutes)` with the same 4 bands and explicit cross-fade hours (morning <10, midday 10–14, afternoon 15–18, night 19+, blending during 10:00 and 15:00).
* **Why:** every BokuNatsu subsystem (events, ambience, insects, outfits, scene variants) keys off the same two numbers, day-third and hour band (§1.1). Reusing one helper keeps them in step.
* **Where:** `town-clock.js`, `render/dusk.js` (reuse the bands for `periodLabel`).
* **Effort:** S.

### P2 — A calendar of dated "happenings" with condition trees, not new AI
* **What:** a data file, for example `src/people/happenings.js`: `[{id, days:[…]|mask|weekday, hours:[from,to], place, cast:[…], flags, setup(), talk()}]`. Evaluate it on area entry, the way `FUN_800197b0` does. A happening *places* residents (overriding `residentPlan` for that window) and supplies date-specific lines. Seed it with about 1 happening per day per neighbourhood (BokuNatsu: ~8.5 events/day across the whole game, ~30 short lines/day). Use fixed-hour anchors (breakfast/lunch/evening, like slots xx01–xx04) for the daily rhythm and one-off dated scenes for memorable moments.
* **Why:** NPC presence in BokuNatsu *is* events gated by AND/OR conditions on day/hour/map/flag (§1.2). It is cheap to author and gives each day its own character.
* **Where:** a new module consulted at the top of `residentPlan` (`social.js` l.380); lines feed `schedules.js` `DIALOGUE`; activate `anchored-cast.js` `dayOff`.
* **Effort:** M (engine about 150 lines; content grows over time).

### P3 — Per-day variation that costs nothing: outfits and set dressing by day mask
* **What:** (a) a `wardrobeByDay` bitmask per resident: swap clothing colour or an accessory variant on rotating days (BokuNatsu rotates main-cast outfits every 1–3 days via a 32-entry bitmask, §1.2). Hook it into the existing `-resident-wardrobes` / avatar builder. (b) "Scene variants" keyed by day masks: different meals on the izakaya/home tables, laundry on lines, a bicycle moved, shop A-boards with the day's special, festival lanterns going up in the last week (BokuNatsu EVVER: 21 dining-table variants, §1.3).
* **Where:** `src/avatars/*` wardrobe, `src/world/interiors/*` (tatami home, izakaya), `prop-factory.js`. Implement as `variantFor(sceneId, day)` returning prop-set ids.
* **Why:** players read the world as lived-in when *things are not where they were yesterday*. This also answers the `MCP-WORLD-AUDIT` note about homes with blank walls and household detail that is only readable from text.
* **Effort:** S–M.

### P4 — A diary that picks the day's single most significant moment
* **What:** extend `state.notes` into a per-day diary. Every notable action calls `diaryCandidate(id)` with a priority; the highest wins (ties keep the newer one). At "sleep" or day rollover, write `{day, id}`. If nothing notable happened, issue the next unused *filler* entry (weather, a smell, a sound) so no two days repeat. Show it as one illustrated card (a hand-drawn style image + one sentence), browsable as an album.
* **Why:** §1.4. It is the emotional payoff that makes days feel *distinct*, and priority + filler guarantees variety with little content. 94 entries cover a 31-day game.
* **Where:** `activities.js` (`note()` l.250, the field book view l.225), `save.js` (add `diary: {[day]: id}`), and a capture hook in the photo module (`src/photo/`) to reuse a snapshot as the card picture.
* **Effort:** M.

### P5 — "Town Book" collecting with tiny stat tables (cicadas, shells, fish)
* **What:** one table per hobby with BokuNatsu's 10-byte shape: `{early%, mid%, late%, morning%, midday%, afternoon%, night%, category, sizeMin, sizeMax}` and spawn spots per area (`spot%`). Roll on area entry: `spot × phase × band × luck`. Record the size of each catch so repeats still matter ("biggest so far"). Start with about 12 species per hobby (BokuNatsu: 60 insects). Fishing: replace the single species with a bite table (bait × time window × spot type → 5/15/25 %, §1.5).
* **Where:** `activities.js` fishing (l.764) → a `src/progression/town-book.js`; spots from `world/okinawa/*` coastline/park builders. AMPLIFY-AUDIT §7 already plans this.
* **Effort:** M.

### P6 — Soundscape table per area × season phase × time band, with cross-fades and rain
* **What:** replace the single cicada/cricket point with per-zone emitter records `{phase, band, sound, gainL/R or position, alwaysOn|dateCondition}`. Blend gains linearly through the transition hours. Add several cicada species that change over the summer (in Okinawa, *kumazemi* loud mornings, *higurashi*-like at dusk, *tsukutsukuboshi* late), plus water, wind, birds and harbour. Wire the unused `rain` parameter: rain bed, gutter drips, cicadas muted. Add dated emitters (festival taiko or eisa practice on certain evenings).
* **Why:** §1.6: 232 of 249 BokuNatsu scenes change their ambience across the summer, from only 29 loops. Sound is the cheapest way to make time feel like it is passing.
* **Where:** `src/audio/town-audio.js` (l.80+), zones from `world/town.js` districts, `world/weather.js`.
* **Effort:** S–M (assets: 6–10 extra loops).

### P7 — Make time a resource, optionally: action-paced day
* **What:** keep real time as the default, but add an optional "summer mode" clock in which minutes advance per district crossing (cost by distance, as in BokuNatsu A 9 / B 12 / E 2 min) and per conversation (+4 min), plus a soft curfew (residents say "go home, it's getting late" after 17:00 in outlying areas; night allows only the home quarter). This fits the existing `clock.pass()` and `CLOCK_SPEEDS`.
* **Why:** §1.1. The player *spends* the day, so choices matter and each day has an arc (morning plan → afternoon → dinner → diary).
* **Where:** `town-clock.js` (`createClock`, a new mode in `CLOCK_KEY`), district boundaries in `world/town.js`, chat end in `neighbour-chats.js` / dialogue.
* **Effort:** M.

### P8 — Calendar of town events and weather with a script, not just a Markov chain
* **What:** a `TOWN_CALENDAR` of fixed dates (Obon, an eisa festival, a typhoon day + the day after, ferry cancellation, market day) that overrides `nextWeather` and triggers the happenings (P2), set dressing (P3), sound (P6) and a diary entry (P4). BokuNatsu hard-codes its festival ambience to day 25 evening / day 26 morning (`FUN_8001d708`) and dresses the house for days 24–31.
* **Where:** `world/weather.js` (`nextWeather`), a new `src/world/calendar.js`; AMPLIFY-AUDIT Phase 5.
* **Effort:** M.

### P9 — Dialogue budget: fewer lines, all dated
* **What:** cap ambient chatter and spend authoring effort on *date-specific* lines: per resident, 1–3 lines tied to today's happening + 1 generic fallback. Let a scarce character appear only on a few days (BokuNatsu: one character speaks on only 7 of 31 days). Extend `topicFits` (`chat-lines.js` l.227) to take `{day, phase, weather, recentEvents}` so topics like "typhoon" or "festival" only appear around those dates.
* **Effort:** S (engine) + ongoing writing.

### P10 — Asset and performance lessons for a web Three.js build
* **Indexed colour + per-fragment palettes:** BokuNatsu ships 165 scenes × 3 lightings at ~150 KB each using 8-bpp pages with up to 21 palettes. For us, this argues for **KTX2/Basis or palette-quantised PNG atlases** for painted signage and decals, with **swappable palettes/LUTs for time of day** instead of duplicate textures. Use a shared `DataTexture` LUT in a custom `onBeforeCompile` for dusk/night tints of painted props.
* **Lighting variants baked where it matters:** BokuNatsu bakes day/evening/night as separate paintings for the home areas only. For us, bake lightmaps for the 2–3 most-visited interiors (tatami home, izakaya) in day and night versions and swap them at dusk, rather than adding real-time lights (AMPLIFY-AUDIT §12 flags unfinished night/interior lighting).
* **Cut-out occluders:** foreground fragments drawn over actors give depth for almost nothing. The analogue for us is camera-facing alpha cards (plants, laundry, noren curtains) in the foreground layer near fixed camera spots.
* **Small cast, many variants:** 20 models, 115 files (animation sets + alternate outfits). Prefer outfit/material variants over new characters to stay within the 4–6k-triangle avatar budget.
* **Per-scene thumbnail mini-map** (98×79) is a cheap, charming way-finding aid; a hand-drawn district map card would fit the field book.
* **Effort:** varies; LUT time-of-day tint S, baked lightmaps M.

### Suggested order
P1 → P2 (+ activate `anchored-cast`) → P6 → P4 → P3 → P5 → P8 → P7 (optional). P1–P2 unlock everything else, P6 is the cheapest "feels alive" win, and P4 gives the emotional loop.

