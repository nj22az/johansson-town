# Kitahama Danchi: the port's apartment block (batch 8, planned 2026-10-12)

> **Not built; history (19 October 2026).** The danchi was planned on 12 October and overtaken: the housing project of 18 October and the consolidation of 19 October ([CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md)) reduced Kitahama to 1, 2, 3 and 8 Kitahama and two attached ground-floor houses at Kitahama Heights (Mac and Ms Ganaha), with ten residents retired; the counts and names below are of that day.

The creator, 2026-10-12: *"I want to consolidate some of the homes in the port, I think an apartment complex would be
more fitting for most of the people there."*

## 1. What is there now (who lives where in the port)

| Home | Who | Kind |
|---|---|---|
| 1 Kitahama (`kitahama-1`) | Thuan (weekdays), Thao, Chin | rented red-tile house |
| 2 Kitahama | Mrs Sato | rented concrete house |
| 3 Kitahama (Uehara) | Kōji | family house |
| 4 Kitahama (Tōma) | Postman Tōma | house |
| 5 Kitahama | nobody | to let |
| 6, 9, 10 Kitahama | the Tairas, Grandmother Gushiken, the Tamashiros | the old families, gardens |
| 7 Kitahama | Mr and Mrs Chinen (the water lorry, the nurse) | family house |
| 8 Kitahama | Ms Uezu | house |
| 11, 12 Kitahama | Mr Iha; Mrs Kohagura (her salon in the front room) | houses |
| Kitahama Heights (`kitahama-flats`) | Ms Ganaha, Mr Higa Jr, two more | the small two-storey block of four flats |
| 1, 2 Front-Row Yard | Nhung and Reiko; Tetsuo | two rented houses behind the bookshop |
| over the shops, the office, the koban, the clinic | the shopkeepers, the harbour master, Officer Mori, the doctor | rooms where they work |
| Nishi-machi, the east back | the Higas, Kinjōs, Ōshiros, Nakasones, Miyagis, Tamakis, Mrs Kamiya | the old houses |

Twelve houses in Kitahama for a town this size is a suburb; the single workers and the young couples of a 1990s port
town lived in a **町営住宅 (town-run apartment block, a danchi)**: a concrete block of three or four storeys with an
outside stair at each end, an open gallery along the lane side, balconies to the sea with the washing out, a bank of
mailboxes, a bicycle shed, drying poles and a swing on the gravel. That is what the creator asked for.

## 2. The decision (the defaults, unless the creator says otherwise)

- **Kitahama Danchi, Block A** (北浜団地 A棟): RC, three storeys, 20 × 9 m, four flats a floor (2DK, 40 m²: genkan, a
  dining-kitchen, two tatami rooms, a bath and WC, a balcony), twelve flats; built 1979, cream render, the town's teal
  doors, an outside stair at each end, the gallery on the lane side (north), the balconies to the sea (south).
- **Site**: the north row's two plots, `kitahama-1` and `kitahama-2` (x 33.5–54, z 55–64, gates on the cross lane). The
  block stands where the two houses were, its gravel yard with the bicycle shed, the mailboxes and the swing towards the
  lane; nothing else in Kitahama moves.
- **Who moves in** (flats by floor, the sea side numbered first): 101 Thuan, Thao and Chin · 102 Mrs Sato · 103 Kōji ·
  104 Postman Tōma · 201 Nhung and Reiko · 202 Tetsuo · 203 Ms Uezu · 204 Mr Iha · 301–304 to let (the town lets them;
  one is kept for the Minato Maru's relief crew). Kitahama Heights stays as it is (Ms Ganaha, Mr Higa Jr). The old
  families, the shopkeepers over their shops and the ones who live where they work stay put.
- **What is freed**: 1 and 2 Front-Row Yard (to let, the bookshop's landlord), 3, 4, 8 and 11 Kitahama (to let, with
  5). Six empty houses is too many for a living town: in a later batch two of them come down for the block's parking
  and a small park, and the rest are let to people the stories need (the open list in §5).
- **Save destinations keep their ids** (`yuri-home`, `resident-home-aya`, `resident-home-kenji`, the Kitahama ids): only
  their doors and addresses change, so old saves load.

## 3. The impact list (checked one by one, per CLAUDE.md "plan a change before making it")

- `world/kitahama-layout.js`: plots 1 and 2 removed, `KITAHAMA.danchi` added (the block, its yard, its stairs, the
  gallery floors at 2.8 and 5.6 m), `KITAHAMA_RESIDENTS` and `kitahamaHomeFor` (flat doors on the gallery).
- `world/okinawa/kitahama-quarter.js`: the block built (walls, gallery, stairs, balconies, laundry, mailboxes, bicycle
  shed, swing, drying poles, notice board), colliders and public floors at three levels (`walkLevels`), flat doors as
  sites `home-kitahama-101` … with a **2DK flat interior** (`world/interiors/flat-2dk.js`, new: one layout, dressed by
  household), lights per flat (`home-lights.js`).
- `people/island-households.js`, `people/households.js`, `people/residents.js` (home getters, "I live at…" lines),
  `people/home-life.js` (routines and bed/table positions in the 2DK), `world/home-exit-label.js` ("Exit to the gallery").
- `world/yard-homes.js`: both yard houses to let. `world/kitahama-layout.js` plots 3, 4, 8, 11: to let.
- Walking: the stairs and galleries are the first multi-level public floor in the town outside the ferry: `walkLevels`
  in the quarter's kit; the lens in the gallery (the ferry's head camera rule may apply).
- The film: `remotion/tools/impact.py` for every shot that photographed Kitahama's north row or the Front-Row yard
  (the sisters' house, Mrs Sato's gate) before anything is removed.
- Tests: `kitahama-*`, `island-homes`, `home-interiors`, `resident-home-plan`, `thuan-*`, `continuous-life`, `boot`,
  `neighbourhood-access`, `home-lights`, `yard-homes`, `living-town`, and a new `kitahama-danchi.test.mjs` (the block's
  floors and stairs, every flat's door reachable, every mover's home and routine).

## 4. Batches

| Batch | What | Check |
|---|---|---|
| 8a | The site: plots 1 and 2 come down; the block's shell, yard, stairs and galleries; walkable to every door; nobody moves yet (the sisters and Mrs Sato keep their old ids with doors on the gallery) | walk every stair and gallery headless; the film impact list |
| 8b | The 2DK interior and the movers: households, home getters, routines, lights; the freed houses to let | every mover sleeps, eats and leaves from the right door; the suite |
| 8c | Dressing: bicycles, laundry by household, mailboxes with names, the swing, the notice board, the sound of the stair | photographs morning and evening |
| 8d | The freed houses: two come down for parking and a park; the rest let (who, from the stories' needs) | the suite, the film |

## 5. Open questions for the creator

- Whether the block stands on plots 1–2 (the default) or on the cane field (which the hamlet's cane cut uses).
- Whether Thuan's weekday room stays with her sisters in 101, or she keeps a flat of her own.
- Who, if anybody, takes the freed houses.
