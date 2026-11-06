# Ganbare Goemon (N64 ×2, DS, GBC) — lessons for Johansson Town

Study of the user's own dumps in `/Volumes/Instron/PC/`. Main target: **Mystical Ninja Starring Goemon (USA, N64, `NG5E`)**, the "MN64" below. Lighter passes over **Goemon's Great Adventure (USA, N64, `NGME`)** ("GGA"), **Ganbare Goemon: Tōkai Dōchū (DS, `A5EJ`)** and **Hoshizorashi Dynamites Arawaru!! (GBC)**. The **Goemon 64 Recompiled v0.0.2** folder was read but not run.

Labels: **[C]** means confirmed from bytes or code. **[I]** means inferred, a reasonable reading that I have not proven. Function addresses are MN64 virtual addresses. `FUN_xxxxxxxx` names are Ghidra's.

Johansson Town ("JT") was read only, at HEAD `75e4aba8` plus the untracked `happenings.js`, `soundscape.js` and `diary.js`. Nothing was copied into it.

This report does not repeat what the Shenmue report (scene chunking, time tables, business hours, weather keys, night sign packs, merged clutter, atlases) or the Boku no Natsuyasumi report (calendar axis, dated happenings, diary significance, collecting stat tables, soundscape per time band) already cover.

---

## 0. How it was produced (reproducible, all under `/Volumes/Instron/PC/re-goemon/`)

| Step | Tool / output |
|---|---|
| MN64 file system | Found the **"Nisitenma-Ichigo" table** at ROM `0x57FC8`. The entries are u32: bit 31 = compressed, low 31 bits = ROM offset. There are **1,134 entries** from `0x576E00` to `0xFDB7F0`, and 912 of them are compressed. Output: `nisi_table.json`, `file_index.tsv`. **[C]** |
| Decompression | **LZKN64**: a u32 compressed-size header, then a command stream: `<0x80` = window copy (10-bit offset, length `((c&0x7C)>>2)+2`), `0x80–0x9F` = raw, `0xA0–0xDF` = byte RLE, `0xE0–0xFE`/`0xFF` = zero RLE. All 1,128 non-empty files decode. In the game this is `FUN_80005394` (window mask `0x3FF`, `<0x80` branch). Script: `tools/extract.py` → `files/NNNN.bin` (14 MB). **[C]** |
| File loader | `FUN_80001C00(id, dest)`. It accepts ids up to `0x520`, reads table entries `id-1`/`id`, decompresses when the flag is set and otherwise DMAs via `FUN_80001640`. Getters: `FUN_80001D68` and `FUN_80001D94`. Index in `files/` = id − 1. **[C]** |
| Ghidra 12.1.4 | Flat images: main code (ROM `0x1000–0x80000` → `0x80000400`) plus the overlay at its VRAM. The `SeedMips.java` pre-script seeds functions at `addiu sp,-N`, then `DecompAll.java`. For `img/main_ov10.bin` that gives 1,857 functions in `ghidra/dec_ov10.c`. Scripts are in `ghidra/scripts/`. |
| Overlays (from loader call sites) **[C]** | The field engine, file 10, loads to `0x801CB460` (`FUN_80002718`). File 11 (actors, shop and talk tasks) loads to `0x8020D2A0` (`FUN_8001FA80`). File 16 (map and diary screen) loads to `0x8020D2A0`. Files 12, 13, 14, 21 and 22 load to `0x801CB460` (boss, minigame, credits). File 7 loads to `0x80261000` and file 9 to `0x80304000` (`FUN_80000580`). The recomp exe only exposes about 102 patched `func_VRAM_ROM` symbols, which agree with these bases (for example `func_801CB460_*`, `func_801F87F8_*`). It ships **no** symbol list or overlay table. Its other strings are Zelda64Recomp leftovers. |
| Text | Files 88–121 use a 16-bit encoding: `char = w + 0x20` for `w < 0x60`, and `0xFFxx` is a control code. Decoded locally to `text/` for study only. Scripts: `tools/dectext.py`. **[C]** |
| Geometry | F3DEX 1.23 (the ucode string is in ROM). `tools/dlstats.py`, `tools/vtxscan.py` and `tools/room.py` walk display lists and measure triangles, textures, tile modes, combiners and vertex normals. Plots are in `plots/`. |
| GGA / DS / GBC | GGA uses the same Nisitenma table (at `0x2C784`). Its debug room-name list is near ROM `0x5E9C00`. DS: NitroFS walked to `nds_files.txt` (1,628 files). GBC: header and bank entropy only, because Ghidra has no SM83 module (Z80 is not a safe substitute). |

---

## 1. Findings

### 1.1 Shops, inns and teahouses: one fixed price ladder with local flavour **[C]**

Five shop text banks (files 106–110) follow an identical template, one per town. Each has a **General Store, an Inn and a Restaurant** (speaker tags confirm all three). In the game's debug names they are `m_mise00…04`, next to `m_tyamise` (teahouse) and `m_uranai` (fortune teller), at `0x80077740+`.

- **Restaurant**: always three dishes at **15 / 25 / 45 ryō**, restoring **+2 / +3 / +5** health. Only the dish changes by region: Edo has oden and sushi, Kyoto-style hot tofu, Shikoku bonito, Tōhoku kiritanpo, Kyūshū chanpon noodles. Each dish has a one-line local boast.
- **Inn**: always **60 / 100 / 200** for a Bronze / Silver / Gold room, with a different flavour line per room. The inn is also **where you save** ("Adventure Diary"), and the innkeeper wishes you good morning afterwards. Restaurant and inn are the two places that heal.
- **General store**: 3–5 items whose tier rises with story progress: rice balls 50 → 120 → 200, armour 200 → 350, and a 500 "surprise pack".
- **Teahouses** ("Coffee Shop" in the US script; named per province: Kai's, Kii's, Iyo's, Izumo's, Kompira's, in file 16) sit **between towns on the highways** as rest and heal stops with a named owner and gossip.
- **Fortune teller**: costs **10 ryō** and is the game's **hint system**. Town signs point to it.
- **Souvenir stall**: three gifts at 400 / 600 / 800.

**The three-tier room ladder appears in all three games** **[C]**:

| Game | Room tiers |
|---|---|
| MN64 | Bronze / Silver / Gold |
| GGA | `YADOYA MATSU / TAKE / UME` rooms |
| DS | `ss_yadoya.dat`: `yadoya_ume / take / matu` |

Each DS area's shop script (`ss_shop_areaN.dat`, about 8 KB each) defines `yorozuya` (general store), `meshiya` (eatery), `yadoya` (inn) and **`sentou` (public bath)**. Each has `enter`, `exit`, `shopping` and exactly **`goods1–3`**.

### 1.2 What a Goemon town contains: the interior roster **[C names / I categories]**

GGA's debug room list names every enterable room per town:

| Town | Interiors | Businesses | Homes and other |
|---|---|---|---|
| 1 (Edo) | 21 | general store, 2 eateries, inn, teahouse, guard hut | 6 *nagaya* row-house units, farmhouse, hut, hermit's hut, Goemon's house, named homes, a well |
| 2 | 12 | inn, eatery, teahouse, general store, guard hut, fortune teller | 5 *minka* houses, a well |
| 3–6 | 11–15 each | teahouse, inn, general store and fortune teller every time, plus 1–2 specialty shops | 4–6 houses, often 1–4 wells (secret routes) |

Specialty shops include a sweets (*yōkan*) shop and the **rival "GANSO" vs "HONKE" shops**, the classic "the original" vs "the main house" feud between two shops in one town. That is a humour device built from signage alone. **[I: reading of the names]**

The DS game types its interior residents by **social class × role**: `karyu / churyu / jyoryu` (lower, middle, upper) × `otoko / onna / kodomo` (man, woman, child), plus `nagaya_0/1`, `tabe_0–2` (diners). Town scripts also include `check_koban` (police box) and `ojizou_hint` (a Jizō statue that gives hints). **[C names]**

### 1.3 Townsfolk: an archetype cast, not individuals **[C names / I behaviour]**

The DS character list (`ec_chara_npc_*`, 158 files) is a ready-made taxonomy:

- **Posture pools**: `people0–5` (walkers), `stand0–5`, `suwari0–5` (sitting), `talker0–1`, `dochu_0–5` (road travellers), plus `area4_0…area7_3` re-skins per area.
- **Venue triads**: teahouse cook, clerk and three customers. Eatery clerk and three diners. Inn front-desk clerk and proprietress. General-store owner and clerk. Dry-goods owner, clerk and customer. **Bathhouse owner and four bathers.**
- **Street-life workers**: `mizumaki` (splashing water on the street, *uchimizu*), `niguruma`/`nigurumahiki` (handcart and puller), `usi`/`usihiki` (ox and leader), `kagoya` (palanquin), `zaimo_otoko1/2` and `zaimo_toryo` (timber yard men and foreman), `monouri` (peddler), `suri` (pickpocket), `monban0/1` (gate guards).
- **Animals**: `neko0`, `niwatori0`.
- **Comic elders**: the mean old man and mean old woman, the know-it-all old man (`monosirijijii`; MN64 has the same "monoshiri" string at ROM `0x7DAAC`).
- Staff have `_ninjya` variants for a story event: the same venue, recast.

MN64 has about **46 small character models** (files 625–678): median **177 triangles and 5 textures** each **[C counts / I that they are townsfolk]**. In the US script only **36 %** of dialogue pages carry a speaker name. Anonymous townsfolk just talk; named characters get a "Name:" prefix. **[C]**

### 1.4 Dialogue is a flag-driven script in the same file as the text **[C structure / I opcode meaning]**

Files 88–121 hold about **5,700 text segments**: 3 lines per page median, **22 characters per line** median (p90 30). Mixed in are script opcodes `0x80NN` with 32-bit arguments:

| Opcode | Count | Meaning |
|---|---|---|
| `0x8010` + `0x0800xxxx` | 9,708 | show text at an offset in the same file (segment 8) |
| `0x8004` addr | 4,304 | variable write. Targets include `0x801C7740`, `0x801C7768` and `0x8015C5xx` (money and inventory area) |
| `0x8006` addr | 423 | variable read |
| `0x800A` | 1,180 | branch |
| `0x8011` / `0x8012` | 222 / 202 | yes/no choice branches |
| `0x8020` / `0x8021` | 296 / 300 | set / clear flag |
| `0x8022` flag, target | 428 | test flag and branch |
| `0x8008` | 1,385 | end |

Flag ids run **0–455**, and **126 distinct flags** are set. The Oedo/Musashi townsfolk bank (file 95) has **74 flag tests**, and file 96 has 72. So **ordinary townsfolk change what they say as the story moves**. **[C counts; opcode semantics I]**

The DS version makes this explicit as files: **`ss_npc_town1_n0 … n4`, `ss_npc_town2_n0…n4`, …, `town7_n1…n5` plus `townN_in`**. That is **4–6 swappable NPC script sets per town, one per story phase**, plus one for interiors. Each set lists which `people_N` exist in that phase (2 in town 1's opening phase, 12 in phase n1) and which special NPCs appear (`sendou_yoru`, a **night ferryman**). **[C]**

**Keyword highlighting**: `0xFFDF … 0xFFE0` wraps place names, items and key nouns in a highlight colour **1,863 times** across the banks. Signposts are ordinary "talk" objects (the `ene_board_talk_tsk` debug string) that give directions and point to the fortune teller. **[C]**

### 1.5 Rooms, streaming and reuse **[C]**

`FUN_801F8C4C` and `FUN_801F87F8` (the latter patched by the recomp) load the current room from **game state `+0x3ADF6` (region byte) and `+0x3ADF8` (room u16)**. The room tables live in overlay 10:

- `0x802098DC[region]` holds 20-byte records `{DL root (seg 8), draw routine 0x8006D9F0…, geometry file id, bank, bank}`.
- `0x8020990C[region]` holds 8-byte file sets `{geom, texbank, texbank2, extra}`. `FUN_801F87F8` always prepends common file `0x7F`.
- `0x80209924` and `0x8020993C` hold per-room segment pointers to **collision** (plane equations and triangle-index grids inside the geometry file).

| Region | Room slots | Unique meshes | Notes |
|---|---|---|---|
| 0 (interiors) | 90 | 45 | in 7 files |
| 1 | 49 | 42 | |
| 2 | 40 | 31 | |
| 3 (castle/dungeon) | 84 | 20 | |
| 4 | 38 | 24 | |
| 5 | 70 | 47 | |
| **Total** | **371** | **109 geometry files** | |

**Interior reuse**: one **158-triangle, 9-texture shell is used for 20 room slots** (rooms 27–46, about 4.2 × 4.0 m, 1.85 m tall), another for 11, two more for 4 each. The generic house interior is one shell, dressed and peopled differently. **[C counts / I that it is the house shell]**

A whole region shares 1–2 texture banks plus per-room banks. For example, all 49 rooms of region 1 use bank `0x91` plus one of `0x93–0x9E`.

Room transitions are explicit **switch points**. A debug dump in overlay 11 shows `Kirikae_point (x<<16|z) (x<<16|z) (angle | dest-room | flags)` alongside `husuma` (sliding door), `Normal_tobira` (door), `bom_tobira` (bomb door) and "end of obj". So doors are objects with a destination room. **[C strings]**

### 1.6 Budgets and the look **[C]**

| Measure | Value |
|---|---|
| Room meshes (163 unique roots) | median **309 triangles**, p90 522, max 1,170; median **12 textures**, p90 18 |
| Interiors | median 280 triangles, 10 textures, about 6 × 5.5 m and 2.4 m ceiling (scale I: 1 unit ≈ 1.2 cm, from character height) |
| Exterior rooms | up to about 3,300 × 3,300 units (≈ 40 m). Example: file 161 is 861 triangles and 21 textures, with the ground mesh holed where buildings stand **[I]** |
| Textures | **4,027 of 4,246 tile setups are RGBA16**, and **1,700 tile sizes are 32 × 64**, i.e. exactly 4 KB = the whole TMEM. The rest are 64 × 32, 32 × 128, 64 × 64 and 214 CI4 |
| Wrap modes | most common is **wrap S + clamp T** (1,282), then clamp/clamp (974), mirror S + clamp T (693), wrap/wrap (641) |
| Unique texture images | 740 across all rooms |
| Lighting | **Hardware lighting with vertex normals, not baked vertex colours**: every map vertex sampled has unit normals, and most room lists set `G_LIGHTING\|G_CULL_BACK` |
| Combiners | `TEX0×SHADE` for textured surfaces; **`PRIM×SHADE` (flat colour × light) for about 25 %** of material sets, with 303 distinct prim colours, mostly greys |

The wall textures are strips: they repeat along a wall and clamp vertically. Untextured faces are coloured by the prim colour. Light colour and direction are the only "mood" knobs, and a debug class list confirms `[Light] [Ambient]` objects.

### 1.7 Other systems **[C strings / I behaviour]**

- **Record-and-replay paths ("OCS")**: overlay 11 can record the player's position and buttons (`ocs_record_play_init`, `Eocs_record_pos`). It prints them as C arrays (`OCS_W ocs%d[]={`, `OCS_BUTTON_W ocs%d_b[]={`) and replays them on actors (`ocs_set`, `ocs speed`). Actor movement also has tiny commands such as `ECPMOVE_POINT`, `ECPJUMP` and `EC_SYNC: waiting for %d`. In other words, NPC and cutscene routes were authored by walking them.
- **NPCs turn to face you** before talking (`turn_to_player`). There is also `shopForceTalkWith` / `pseudoTalkWith` (a shop clerk talking across a counter) and `sc_money_add`.
- **Collectible lucky cats**: Silver Fortune Doll = `Enemy_ginneko` (silver cat) objects, with `MANEKI NEKO CHECK`. Four silver cats give +1 maximum health; a gold one gives it at once. They are hidden in rooms and wells.
- **Day/night**: no time-of-day system was found in MN64's strings or its 5,700 text segments (no evening, tonight or sunset). Its towns feel alive through flags, not a clock. The DS game does have phase-specific night NPCs (`sendou_yoru`).
- **Debug stage list** (`0x80077698`): Kurashiki, Zazen, Omatsu (Festival Village), Hagure (Folkypoke), Sogen, Impact, and shop stages `ShopChamise`, `ShopZazen`, `ShopUranai`, …. Shops are separate stages, i.e. interiors.
- **GBC**: 1 MB, MBC5 with RAM and battery, CGB-only, 60 of 64 banks used. Nothing actionable without an SM83 disassembler.

---

## 2. Recommendations for Johansson Town (prioritised; new compared with the Shenmue and Bokunatsu reports)

Effort: S ≤ 1 day, M 2–4 days, L ≥ 1 week.

**R1. Story-phase chatter sets per district, gated by flags. — M**
- **What:** add a `phase` (0–5) to the story state. For each district, keep `chatter[district][phase] = {cast:[archetype ids], lines:{who:[...]}}`, plus `interior` sets. A line can carry `when:{flag}`. The phase advances on milestones such as the first ferry trip, a Haarii win, or the typhoon passing.
- **Why:** MN64 townsfolk banks contain 74 flag tests each (126 flags in total). The DS game literally ships `ss_npc_townN_n0…n5` plus `_in`: same streets, a different crowd and topics per phase.
- **Where:** `src/dialogue/town-dialogue.js` (STORY_FLAGS is Thuan-only today), `src/people/chat-lines.js`, `src/people/happenings.js` (a happening can bump the phase), `src/people/residents.js`.

**R2. One price ladder with local flavour for every eatery and shop. — S**
- **What:** every food venue offers exactly three items at fixed tiers (for example ¥150 / ¥400 / ¥800). The top item is always the local dish, and each tier gives a fixed effect: mood or energy +2 / +3 / +5. Each item gets a one-line boast. Shops sell 3 goods, and their tier rises with the phase from R1.
- **Why:** MN64 runs 15/25/45 → +2/+3/+5 in every town, swapping only the dish and line. The DS game has `goods1–3` in every shop. The player learns the economy once and enjoys the regional difference.
- **Where:** `src/commerce/store-menu.js`, `catalogue.js`, `src/people/ramen-*`, `izakaya-*`, `venue-service.js`.

**R3. A minshuku with three room tiers as rest, save and diary. — M**
- **What:** a small inn interior with a front-desk clerk and proprietress. Three rooms (ume/take/matsu, ¥3,000 / ¥5,000 / ¥9,000 in 1997 money) skip to morning, restore energy by tier, and **write the day's diary entry and save**. The proprietress greets you in the morning.
- **Why:** all three Goemon games make the inn the save, heal and time-skip point with a three-tier room ladder. It gives the existing diary a physical place in the world.
- **Where:** a new `src/world/interiors/minshuku*.js`, `src/progression/diary.js`, `src/people/sleep-cover.js`, `src/town-clock.js`.

**R4. A townsfolk archetype catalogue: posture pools, venue triads and street-life workers. — M**
- **What:** a data table of archetypes:
  - Posture pools: walker, stander, sitter, talker, traveller.
  - Venue triads (owner, clerk, 1–3 customers) for every business, including the onsen (owner plus four bathers).
  - Street-life workers with one looping job each, in 1997 Okinawa: a shopkeeper splashing water on the pavement at opening, a *tōfu*/*Yakult* seller on a bike, a sugar-cane truck, a fish handcart at the port, a koban officer on rounds.
  - Animals: cats, chickens, the odd goat.
  Class tags (lower, middle, upper household) set clothing and home dressing.
- **Why:** the DS cast is built this way (158 NPC files). Archetypes are cheap to multiply with `area`-style re-skins.
- **Where:** `src/people/anchored-cast.js`, `residents.js`, `staff-bench-routine.js`, `venue-service.js`, `src/avatars/wardrobe.js`.

**R5. Readable signs and in-world hint givers. — S–M**
- **What:** make signposts and notice boards "talk" objects (a direction line plus a highlighted place name). Add one paid hint source, such as a *yuta* or an omikuji box at the shrine for ¥100, that reads the next `happenings.js` entry or an unmet flag and answers in character. A Jizō or shīsā statue can give a free hint.
- **Why:** MN64's fortune teller (10 ryō) and signposts that point to it, the DS `ojizou_hint`, and the know-it-all old man all act as the hint system without any UI.
- **Where:** `src/world/okinawa/signs.js`, `src/interact/aim.js`, `src/people/happenings.js`.

**R6. Interior shells × dressing sets × class. — M**
- **What:** for each `house-plan` kind, build 2–3 generic shells (≤ 300 triangles, ≤ 10 materials). Generate many homes from one shell plus a class-based dressing set (furniture count, butsudan, TV, tatami or carpet) plus 1–3 residents. Keep a per-district roster like GGA's: 4–6 businesses, 5–14 homes, one secret (a well or the back stairs).
- **Why:** MN64 uses one 158-triangle shell for 20 interiors and 45 meshes for 90 interiors. GGA towns have 11–21 enterable rooms each. This is how density stays cheap.
- **Where:** `src/world/interiors/house-plan.js`, `home-residents.js`, `indoor-residents.js`, `prop-factory.js`.

**R7. A dev tool to record a path and replay it on an NPC. — S**
- **What:** a dev key starts recording the player's `{t, x, z, yaw, action}` at 10 Hz. Stopping dumps JSON, which `room-walk.js` or a happening can replay with speed scaling and sync points ("wait for X").
- **Why:** Konami authored NPC and cutscene routes by walking them (OCS record → `ocs%d[]` arrays → replay) with `EC_SYNC` waits. That is faster and more natural than placing waypoints by hand.
- **Where:** `src/people/room-walk.js`, `navmesh.js`, `src/people/happenings.js` (cast `route` field), `src/game.js` (dev hotkey).

**R8. Rendering conventions from a 4 KB-TMEM world. — S–M**
- **What:**
  - Make strip textures 32 × 64-ratio canvas tiles with RepeatWrapping on U and ClampToEdge on V for walls, eaves and fences, and mirror for symmetric panels.
  - Draw about a quarter of surfaces as flat colour × light, with no texture.
  - Set a per-room budget of about 300 triangles and 12 textures for interiors and about 900 / 20 for street blocks.
  - Express mood through light colour only (already JT's cel rule in `dusk.js`).
  - Share one texture bank per district plus one per room.
- **Why:** these are the measured MN64 figures (§1.6). They complement Shenmue B2 (atlas) with the tiling and clamp rules and an all-lit, no-bake approach that suits Three.js.
- **Where:** `src/render/materials.js`, `world-uv.js`, `toy-surfaces.js`, `light-budget.js`, the budget tests.

**R9. Keyword highlighting in the dialogue box. — S**
- **What:** markup `[[Kitahama]]` renders in a highlight colour. Highlighted nouns go into the diary's "heard about" list, and a later line or sign can check that the player heard of a place.
- **Why:** MN64 has 1,863 highlight spans. They steer the player through the world without quest markers.
- **Where:** `src/dialogue/dialogue-box.js`, `dialogue-engine.js`, `src/progression/diary.js`.

**R10. Roadside teahouse rest stops between districts. — S–M**
- **What:** a small stand (a *sata andagi* or kissaten counter) on the routes to the airport, the island ferry and the Kitahama quarter. Its owner has a recurring personality, it restores energy, and it sells one cheap item plus that phase's rumour.
- **Why:** Goemon's "coffee shops" sit between towns as the friendly midpoint with a named, comic owner.
- **Where:** `src/progression/travel.js`, `src/world/docklands-life.js` or a new small venue.

**R11. Humour through rival signage and character tics. — S**
- **What:** two shops that both claim to be the original (for example two andagi stands or two soba shops, "元祖" vs "本家", feuding over the street). Give each quirky regular one verbal tic used sparingly, the way Plasma Man ends sentences with "plasma".
- **Why:** GGA's GANSO and HONKE shops, and MN64's catch-phrase cast.
- **Where:** `src/world/okinawa/signs.js`, `src/people/voice-lines.js`, `resident-personalities.js`.

**R12. Hidden maneki-neko collectibles inside homes. — S** (complements Bokunatsu P5)
- **What:** 20–30 small lucky cats in the corners of interiors and odd spots. Four silver cats give a permanent perk (more stamina, or a discount); a gold one gives it at once.
- **Why:** MN64's Silver and Gold Fortune Dolls (`Enemy_ginneko`, `MANEKI NEKO CHECK`) reward entering every house, which R6 makes cheap.
- **Where:** `src/world/interiors/*`, `src/progression/soft-quests.js`.

**Suggested order:** R2 → R9 → R1 → R3 → R4 → R6 → R5 → R7 → R8 → R10–R12.

---

## 3. Not done / open

- I did not find the object-placement lists (NPC positions per room). They are not in the room geometry files, which hold DLs and collision. The next step is to trace the actor spawner in overlay 11 (`0x8020D2A0`, Ghidra `img/main_ov11.bin` is ready) from the `Kirikae_point` and `husuma` handlers. That would give exact NPC counts per town.
- The script opcode meanings in §1.4 are inferred from argument patterns. Confirming them needs the interpreter, which lives in an overlay not yet decompiled. The `sc*` strings in main are dead debug literals with no references.
- The music-per-area mapping (Konami sequence tables) was not decoded.
- GBC: no SM83 processor in Ghidra, so only data-level analysis was done.
