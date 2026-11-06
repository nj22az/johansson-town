# Shenmue (Dreamcast, Disc 1) — lessons for Johansson Town

Research date: 2026-10-05. Source: the user's own GDI dump (`Disc 1`, track03 + track06 high-density area). All extraction and analysis stayed inside `/Volumes/Instron/DC/re-shenmue/`. **Nothing from Shenmue (art, models, code, text, audio) is to be copied into Johansson Town** — this document records *numbers, data layouts and techniques* only.

Labels: **[confirmed]** = read directly from bytes/Ghidra; **[inferred]** = strong interpretation of confirmed data; **[community]** = matches widely-known Shenmue modding knowledge, not re-proven here.

---

## 0. How this was produced (reproducible)

| Step | Tool / output |
|---|---|
| ISO9660 from GDI (multi-track, LBA 45000, 2352-byte Mode-1 sectors) | `tools/gdi_extract.py` → `disc1_files.tsv` (2271 files) |
| Extracted | `disc1/1ST_READ.BIN`, `disc1/MISC/*`, `disc1/SCENE/01/*` (except STREAM/SOUND), `disc1/SCENE/01/STREAM/HUMANS.*`, `disc1/SPRITE/WEA*.BIN` |
| gzip packs decompressed | `work/gunz/` (159 PKF/PKS/GZ) |
| Asset stats (MT5 / PVRT / IPAC parser) | `tools/shen_stats.py`, `tools/survey.py`, `tools/survey2.py`, `tools/extent.py` → `work/survey_scene01.json`, `work/survey2.json`, `work/npc_cast_per_area.json` |
| Ghidra 12.1.4 headless | project `ghidra/proj/shenmue`, scripts `ghidra/scripts/{SeedEntry,StringXrefs,Callers}.java`, output `ghidra/xrefs.tsv`, `ghidra/callers.txt` |

Ghidra notes: `1ST_READ.BIN` (2,755,492 B, not scrambled) is **linked at `0x0C010000`** (P0 mirror), not `0x8C010000` — pointer words in the binary are `0x0C0xxxxx–0x0C2xxxxx`. Loading at 0x8C010000 gives zero string xrefs. With prologue seeding + aggressive instruction finder: 6,536 functions / 672k instructions. Scripts must live on APFS (the exFAT volume creates `._*.java` AppleDouble files that break Ghidra's script compiler) — run from scratch dir, copies kept in `ghidra/scripts/`.

Parser caveat: my MT5 strip decoder rejects ~5–50 % of meshes in some areas (unknown opcode variants). Triangle counts below are **lower bounds from accepted meshes**; vertex counts are complete.

---

## 1. What Shenmue does — findings with evidence

### 1.1 World is split into small, separately loaded scenes  [confirmed]

- Disc 1 `SCENE/01/` has 40 area folders, each a self-contained scene: `MAPINFO.BIN` (metadata), `MPK00.PKF` (texture pack) + `MPK00.PKS` (model pack), plus small optional packs.
- Ghidra: scene loader `FUN_0C0F0432` (936 B, 81 callees) builds `/scene/%02d/%s` paths and dispatches tags `SNDD, MSTS, TXMO, FOCK, SHRG, COLS, CHRD`; `FUN_0C0F24F2` loads `MAPINFO.BIN`; map loader `FUN_0C130B40` handles `MAPR/MAPP/MAPE/MAPT` and calls `FUN_0C1309D0` (`MAP%02d.MT5`/`MAP.MT5`); `FUN_0C0F258A` handles `BLKS/MAPD/PRER/SCLM`; pack loader `FUN_0C130AAE` uses `MPK%02d`. Pack chunk dispatcher `FUN_0C138374` recognises `SCR0 SCR1 MAPD AUTH COLI SCRL DYNM MAPM CHRM MOTN CHRT`.
- A loading-screen table in 1ST_READ maps every area code to a loading image (`D000→LDDOBUIT`, `DCBN→LDTOMATO`, `JOMO→LDOMOYA`, `DCHA→LDAJIITI`, `DSLI→LDLINDA`, `DJAZ→LDBARMJQ`, `DBYO→LDBARYKS`, `DBHB→LDBARHAR` …). Every interior is a **separate scene behind a door + loading screen**.
- Exterior Dobuita (`D000`): 10.8 MB of files. Interiors: typically **0.6–1.0 MB** (range 0.57–2.5 MB).
- Packs use a uniform container: gzip → `PAKS` → `IPAC` directory (8-char name, 4-char type, offset, size) or `PAKF` → list of `TEXN` (8-byte texture id + `GBIX` + `PVRT`).

### 1.2 Interiors — measured budgets  [confirmed numbers; names inferred where marked]

Footprint = 5th–95th percentile of map-vertex extents (units ≈ metres: door props have ~1.14 m bounding radius, ceilings 2.4–2.7).

| Area | Type | Footprint W×D, ceiling (m) | Map tris (≥) | Prop models (CHRM) | Textures | Texture MB (VQ-compressed) | Ambient loops (SNDD) |
|---|---|---|---|---|---|---|---|
| DCBN Tomato | konbini | 7.1 × 10.8, 2.5 | 5,161 | **54** (median **12 tris**) | 222 | 1.53 | 1 amb + 1 BGM + area loop |
| JABE Abe Store | small shop | 5.1 × 8.4, 2.2 | 5,939 | 19 | 147 | 0.97 | area loop |
| DBHB (Heartbeats, inferred) | bar | 7.9 × 10.4, 2.0 | 6,668 | 9 | 85 | 0.62 | 1 amb + area loop + jukebox |
| DSLI Bar Linda | bar | 4.3 × 8.0, 2.6 | 4,124 | 9 | 88 | 0.55 | 1 amb + BGM + area loop |
| DJAZ Bar MJQ | bar | 6.4 × 16.0, 2.7 | 6,098 | 13 | 95 | 0.63 | 1 amb + BGM + area loop |
| DBYO Bar Yokosuka | bar | 6.9 × 14.0, 2.4 | 4,948 | 14 | 65 | 0.71 | BGM + area loop |
| DCHA Ajiichi | Chinese restaurant | 5.4 × 9.3, 2.4 | 8,112 | 14 | 140 | 0.61 | 1 amb + BGM + area loop |
| DRHT (Chinese rest., inferred) | restaurant | 9.8 × 5.2, 2.4 | 5,347 | 8 | 105 | 0.65 | BGM + area loop |
| DRME Manpukuken | ramen | 7.3 × 3.6, 2.4 | 8,908 | 24 (17 unique geo) | 245 | 1.49 | 1 amb + BGM + area loop |
| DSBA soba | restaurant | 8.5 × 14.4, 2.7 | 5,579 | 12 | 101 | 0.66 | BGM + area loop |
| DPIZ Bob's Pizza | restaurant | 4.5 × 7.2, 2.7 | 5,329 | 3 | 117 | 0.62 | 1 amb + BGM + area loop |
| JOMO Hazuki main house | home (many rooms) | 24.8 × 11.2, 2.8 | 22,096 | **150** | 554 | 8.10 | 1 amb + BGM + area loop |
| D000 Dobuita | exterior street | 155 × 84 (core) | 58,947 | 134 | 486 | 4.80 | 5 amb + area loop |

Patterns:
- **A whole room is ~5–9k triangles and ~65–250 textures in < 1 MB of texture memory.** Room shells are single `MAPM` models (2 per interior: room + a second section), not assembled from many props.
- **Clutter is baked into the room mesh + textures.** Interiors have only 3–24 separate CHRM objects (the interactive or animated ones: doors, drawers, items you can pick up/inspect). The konbini is the exception: 54 tiny product models (median 12 triangles each) because each is an inspectable/buyable item.
- **Texture sizes**: overwhelmingly **64×64 and 128×128** (e.g. Tomato 111×64², 56×128², 29×256², 3×512²). 512² only for a few hero surfaces/posters. Formats: ~65–80 % VQ-compressed RGB565 (≈8:1), ARGB4444/1555 VQ for cut-outs, a handful of uncompressed twiddled 16-bit for small textures.
- **Texture sharing across scenes**: 3,142 unique texture IDs across disc-1 scenes, **1,016 (32 %) appear in more than one scene** (one texture id appears in 20 scenes). Shenmue builds a shared surface library (wood, tile, signage, fittings) and reuses it everywhere.
- **Prop reuse via the 107 identical CHRM geometries that occur in more than one scene** (same bytes, e.g. doors). Inside a scene, duplicate geometry is rare (0–7) — duplicates are placed by instancing at runtime (CHRD/SCN3 entries), not duplicated in packs. Colour variants are separate tiny models sharing a mesh shape (capsule-toy machines `CAPS5BLG/…FTG/…GRG/…RDG/…YEG` in `D000/OMG.PKS`).
- **Vertex format** = position + normal (24 B); materials set per strip-group with an ARGB colour op (0x000E) and texture index op (0x0009). No per-vertex colour strip types were found in the parsed maps → **lighting is realtime per-vertex from small per-scene light tables, with the "lived-in" grime painted into textures** [inferred]. Interior `LGHT` tables are tiny: Tomato has **2 lights** (96 B), bars 288 B; Dobuita has three LGHT sets (~100, ~45, ~6 entries — inferred day/dusk/night or zone sets). Values are stored as half-floats.
- **Collision is cheap for interiors**: `COLS` 0.6–3.7 KB per interior vs 87 KB for Dobuita.
- **Each interior has its own ambience**: `SNDD` lists a per-room loop (`f1tomato.snd`, `f1barhea.snd`, `f1aziich.snd`…), usually one shared ambience bed (`amb0xx`) and a BGM; the exterior has 5 ambience beds.

### 1.3 Exterior street (Dobuita, D000) [confirmed]

- 27 map sections (`MAPM`) in `MPK00` + 4 extra map sections in `MAP0–3.PKS` (455–4,003 tris each, 4–18 textures) — the street is **chunked** into blocks the engine can show/hide (`BLKS`, `MAPD`, `SCLM` tags; "Max Clip Area Over!" error string).
- **Night variant pack** `YORU.PKS/PKF` ("yoru" = night): 5 small models + 3 textures + 3 event sequences (~100 tris). Night is mostly realtime lighting + a tiny swap-in of lit signage.
- Separate small packs per street feature: vending machines (`COKE`, `VMSA` — one model, 1–5 textures each), capsule toys (`OMG`, 18 models), parked bikes/odds (`SHUKI`, 55 props, ~12k tris, 117 textures).
- 134 CHRM objects, median 96 tris.

### 1.4 NPCs / lived-in systems

- **Streamed NPC library** [confirmed]: `SCENE/01/STREAM/HUMANS.AFS` (64 MB) + `HUMANS.IDX` = **369 characters**, each = 1 texture pack (median **4 textures**, mostly 128×128, ~128 KB) + 1 model pack (median 679 vertices, ~35 rigid nodes). Only the residents needed by the current scene/time are streamed in.
- **Character definition vocabulary** [confirmed strings in 1ST_READ at 0x0C27E2xx; parser `FUN_0C0F1950`, flag parser `FUN_0C0F1788`]: an NPC is a bag of components: `Human, Object, Face, Hand, Item, Range, Coli/ColiOff, LineWalk, Walk3D, Patrol, Vender, Bicycle, Vehicle, Shadow/ShadowOff, FootMark, Cloth, LowQuality, Clock, Calendar, TailLamp, TinyMot, PreLoad, DefImage, LocalPos` and flags `DISP, KILL, MAPEV, NOMAPEV, NOCLIPPER, SLEEP, NOTMIRRORED`, priority `NONE/HIGH`. `CHRD` in each MAPINFO is a key/value tree using these names (e.g. the player is assembled from 7 body-part models).
- **Time-tabled movers** [confirmed strings, inferred mechanism]: "moveobj Change Time table[%s(%d)]", `NL_POINT3 Root%02d[]`, `CM_D000.BIN`/`CYCLEMAN.BIN` (`MOBJ` file with per-scene sections `D000, JD00, JU00, DSBA, DCHA, DCBN…`, containing XZ float polylines). NPCs follow authored root/waypoint lines and switch time tables at set clock times.
- **Per-scene scripts** [confirmed]: `SCN3` chunk in MAPINFO is the biggest part of every scene (Dobuita 733 KB, Hazuki house 648 KB, interiors 120–300 KB). It references NPC IDs; ≥20 distinct HUMANS IDs are referenced in D000's script, 1–7 in most interiors (shopkeeper + regulars). [inferred lower bound]
- **Weather is an authored calendar timeline** [confirmed format, inferred semantics]: `SPRITE/WEATHER.BIN` (loaded by `FUN_0C1C2D64`, also loads `WEAT_ORG.BIN`) = `WDAT` with tracks `CLUD` (413 keys), `RAIN` (297), `SNOW` (152), `FCAS` (143 daily forecast codes). Each key is one u32: `month(8) | day(5) | hour(5) | minute(6)` + intensity byte quantised to ~6 levels (0, 95, 127, 159, 191, 255). Month runs 11→20 (Nov 1986 → summer 1987). Two variants ship (`WEAT_ORG` = original data with less snow; the other is a softened set — strings "Weather Org_Data Read" / "Weather Soft2_Data Read"). Weather areas: "DefaultWeatherArea", "AppendWeatherAir()", "Busy Rain To Snow" (transition state).
- **Renderer budget knobs** [confirmed]: `FUN_0C045904` configures Kamui with `VertexBuffer, ObjListSize, ISPParamSize, TSPParamSize, RenderTimeOut, VertexTimeOut` — fixed-size per-frame vertex/param buffers; content must fit them.
- **Heap/texture accounting** [confirmed strings]: "FreeTexture / MaxBlockSize / Heap Rest / Heap Max / Heap Waste", "Texture Regist Over!!" — the engine runs with explicit texture-slot and heap budgets per scene.


---

## 2. Johansson Town today (from a read-only pass of the repo, HEAD `75e4aba8`)

- **Schedules**: 11 residents run `residentPlan()` (`src/people/social.js:380`), a pure function with hard-coded minute literals per person; ~20 `neighbours.js` people stand in place; pupils/venue extras are room-local. Pathing = 1 m grid A* (`src/people/navmesh.js`, linear open list, 30k-node cap). No NPC LOD/despawn; sim runs for everyone; avatars `frustumCulled=false` (`src/avatars/build.js:698,788`).
- **Clock**: real local time mapped to 1997 (`src/town-clock.js`); weekday used only by `classroom.js`; no seasons/holidays.
- **Weather**: uncommitted `src/world/weather.js` — 3-state random Markov roll every 120 town-min; rain is a boolean.
- **Hours**: inline literals (`izakayaOpen` 960–1620 in `social.js:28`; ramen 09–21 `social.js:237`; Sakura in `residents.js`). Docs disagree with code on izakaya closing (LIVING-TOWN.md says 23:30).
- **World**: one exterior scene built at boot; `town-sections.js` CPU distance-culls 24 m cells (36/54 m reach); `detail-stream.js` streams 5 GLBs; no `THREE.LOD`; static props merged per 24 m cell (`src/render/static-props.js`), harbour InstancedMesh per 48 m (`harbour-instances.js`). Interiors are built on entry in `enterRoom` (`game.js:882`).
- **Budgets**: ~575–660 draws / ~200k tris at start view vs. stated 110 draws / 150k tris per quarter (AMPLIFY-AUDIT, LIVING-TOWN.md:48); Sakura interior test allows ≤813 draws / 450k tris (`tests/sakura-budget.test.mjs`). Avatars 2 draws (4 with outlines), hair alone 6–15k tris.
- **Pipeline**: no Draco/meshopt/KTX2 compression; assets 54 MB in git (GLB 27.8 MB); game chunk ~1.6 MB min. No size checks in `scripts/build-runtime.mjs`.
- **Audio**: 5 positional loops town-wide; no per-interior soundscape.

### Side-by-side

| Metric | Shenmue (DC, 1999) | Johansson Town |
|---|---|---|
| Interior room geometry | 4–9k tris, 1–2 meshes | Sakura test allows 450k tris / 813 draws |
| Interior textures | 65–250 tex, 0.5–1.5 MB, mostly 64²/128² | canvas textures per object (256² typical), photo materials |
| Interactive props per room | 3–24 (54 in the konbini) | many separate meshes, merged after the fact |
| Character | ~680 verts, 4 textures @128² | 4–6k tri budget, hair 6–15k |
| NPC roster | 369 streamed on demand | ~40 named, 11 scheduled, all resident in memory |
| Weather | authored calendar timeline, 4 tracks, minute resolution | random 3-state roll |
| Streaming | every interior/area is its own pack (≤1 MB), loading screen | one exterior scene; rooms built on entry |
| Ambience | per-room loop + shared bed + BGM in scene data | 5 town-wide loops |

---

## 3. Recommendations (prioritised)

Effort: S ≤ 1 day, M 2–4 days, L ≥ 1 week.

### A. Lived-in town

**A1. Move schedules from code to data (time tables).** — *M*
- What: a `src/people/timetables.json` (or `.js`) of rows `{who, days:'mon-fri'|'sat'|'rain', from:'07:30', to:'08:10', place, anchor, activity}`; `residentPlan()` becomes a lookup + fallbacks. Keep the current function as the fallback.
- Why: Shenmue switches movers between authored time tables ("moveobj Change Time table") with per-scene waypoint sets (`CYCLEMAN.BIN`/`MOBJ` sections per area). Data lets you add the other ~30 named islanders without code.
- Where: `src/people/social.js`, `residents.js`, `commuter-schedule.js`, `home-life.js`.

**A2. Single source of truth for business hours.** — *S*
- What: `src/world/business-hours.js` exporting `{id, open, close, closedDays, lastOrder}`; used by `social.js`, `sato-ramen-layout.js`, signage (OPEN/CLOSED, shutters), and NPC staff shifts. Fixes the izakaya 03:00 vs 23:30 docs mismatch.
- Why: Shenmue shops have distinct hours that the whole town honours (shutters, staff, "Req Closed"/"until nighttime" strings).

**A3. Promote the ~20 static neighbours to "light" schedule agents.** — *M*
- What: give each a 3–4 row time table (home → spot → errand → home) and a "sleep = not spawned" state. Use the existing grid A*.
- Why: Shenmue's interiors only hold 1–7 people and the street ~20, but each is where you expect them at that hour — consistency beats density.
- Where: `src/people/neighbours.js`, `island-households.js`.

**A4. Authored weather timeline instead of random roll.** — *S–M*
- What: generate (offline, by a seeded script) a 1997 calendar of keyframes `{month, day, hour, minute, cloud, rain, wind}` quantised to ~6 levels, plus a daily forecast code (for the radio/newspaper). Ship as ~5 KB JSON. Interpolate between keys at runtime; keep "random" as an option.
- Why: `WEATHER.BIN` is exactly this: 4 tracks (cloud/rain/snow/forecast), 152–413 keys each, packed into u32s, ~4 KB for 8 months. It makes weather repeatable, forecastable, and consistent across save/load and catch-up.
- Where: `src/world/weather.js` (currently uncommitted), `town-clock.js`, `aoba-radio.js` (forecast), `dusk.js`.
- Okinawa twist: add a "typhoon" track (wind + rain + closures) for Aug–Sep; tie business closures from A2 to it.

**A5. Per-area ambience + per-room loop.** — *S*
- What: each district and each interior declares `{bed:'harbour-day', loop:'konbini-hum', music?:...}`; crossfade on enter. Generate beds procedurally with WebAudio (filtered noise for AC/fridge hum, rain on roof, distant traffic) to avoid new audio assets.
- Why: every Shenmue scene's `SNDD` names a room loop + shared bed + BGM; 5 beds for the street.
- Where: audio module used by `game.js` `enterRoom`; district data in `src/world/districts.js`.

**A6. Weekday/season variation + small events.** — *M*
- What: `days` column in A1 tables; market day, shop closed day, festival dates (Obon, Eisā) as calendar entries.
- Why: Shenmue's scene scripts (`SCN3`) carry date-gated events and its weather/forecast track runs on a real calendar.

**A7. Night variant packs for signs.** — *S*
- What: for each sign in `okinawa/signs.js`, an emissive version (canvas texture with glow) swapped in after dusk; shutters down when closed.
- Why: Dobuita ships a tiny `YORU` (night) pack — 5 models, 3 textures — rather than re-lighting everything.

### B. Environments built in code (techniques, not art)

**B1. "Bake the clutter into the shell" room builder.** — *M*
- What: for each interior, generate the static clutter (shelves, stock rows, posters, wall stains, menus, bottles) procedurally, then **merge into 1–3 meshes per material** at build time; keep only interactive items separate (target 5–25).
- Why: Shenmue interiors are 1–2 map meshes (4–9k tris) + 3–24 interactive objects; the konbini's 54 items are each ~12 tris.
- Where: extend `src/render/static-props.js` merge to run on room build in `enterRoom`; `interiors/house-plan.js` already gives walls.
- Budget proposal per room: ≤ 15k tris, ≤ 40 draws, ≤ 2 MB GPU texture.

**B2. Shared procedural texture atlas library.** — *M*
- What: one canvas-generated atlas (e.g. 2048² split into 128² tiles) of surfaces: tatami, wood grain, tile, concrete stain, posters, product labels, menu boards, shutters. All props sample by UV rect.
- Why: Shenmue reuses 32 % of textures across scenes and keeps nearly all at 64²–128²; 65–250 textures/room fit in < 1 MB.
- Where: new `src/render/surface-atlas.js`; `prop-factory.js` material cache keyed by atlas tile.

**B3. Grime and lived-in detail as decals.** — *S*
- What: procedural decals (water stains under AC units, scuffs near doors, worn paths on floors, tape on windows, faded posters) as alpha cut-outs from the atlas, placed by rules (near doors, under sills, at counter edges).
- Why: Shenmue's ARGB4444/1555 cut-out textures (15–25 % of each room's set) carry most of the "used" look; geometry stays simple.

**B4. Vertex-colour AO/light bake for generated rooms.** — *S–M*
- What: at room build, compute cheap AO (corner/height darkening, distance to walls) into vertex colours; use 1–2 realtime lights per room.
- Why: Shenmue rooms use 2–4 lights (`LGHT` 96–560 B) with detail painted into textures; vertex colour is already used by `static-props.js`.

**B5. Colour/variant families for props.** — *S*
- What: one geometry + per-instance colour (InstancedMesh `instanceColor`) for capsule machines, crates, bikes, chairs, bottles.
- Why: Shenmue's capsule toy set is 5 colour variants of one shape; 107 identical props reused across scenes.

### C. Performance / consolidation

**C1. Per-district scenes with load gates.** — *L*
- What: split the exterior into districts (Main Street, harbour, Kitahama, island…) each built/streamed on approach (dynamic import + build), with the far districts reduced to impostor/merged silhouettes.
- Why: Shenmue never holds more than one area; Dobuita is chunked into ~31 map sections with block show/hide; interiors ≤ 1 MB each.
- Where: `src/world/town.js`, `town-sections.js`, `detail-stream.js` (generalise from 5 GLBs to all districts).

**C2. Interior budget tests for every room.** — *S*
- What: copy `tests/sakura-budget.test.mjs` pattern to all interiors with Shenmue-like targets (≤ 15k tris, ≤ 40 draws). Tighten Sakura from 450k/813.

**C3. NPC LOD + sleep.** — *M*
- What: (1) enable frustum culling with a fixed bounding sphere; (2) beyond ~30 m use a single merged low-poly body + no outline (1 draw); (3) people not in the player's district are simulated as schedule state only (no mesh, no pathing — teleport to plan target).
- Why: Shenmue's `LowQuality` and `SLEEP` character flags; only the current scene's cast is loaded; characters are ~680 verts with 4 small textures.
- Where: `src/avatars/build.js`, `src/people/schedules.js`.

**C4. Avatar triangle diet.** — *M*
- What: cap hair at ~1.5k tris (card-based), whole body ≤ 4k; use 1 atlas texture per avatar.
- Why: Shenmue NPC median 679 verts; your hair alone is 6–15k tris.

**C5. Compress what ships.** — *S*
- What: run glTF assets through meshopt (`EXT_meshopt_compression`) + KTX2/Basis textures; add a size check to `scripts/build-runtime.mjs` (fail if any GLB > budget, total > N MB).
- Why: Shenmue ships every pack gzipped and textures VQ-compressed (~8:1). Your 27.8 MB of GLB is uncompressed.

**C6. Pathing open list → binary heap; cache common routes.** — *S*
- Where: `src/people/navmesh.js`. Why: Shenmue uses authored polylines (`MOBJ`, `NL_POINT3 Root%02d`) — consider precomputed route graphs between named anchors (doors, stops) and A* only for the last metres.

### D. Other metrics

- **Load time**: add a loading screen per district/interior (Shenmue has one per area: `LD*.GZ`) and measure `performance.now()` to first frame on iPad; record in `docs/`.
- **Memory**: explicit texture/heap counters in a debug overlay (Shenmue prints "FreeTexture / Heap Rest / Heap Max"); use `renderer.info`.
- **Save consistency**: with A1/A4 being deterministic from the clock, residents' positions and weather can be *recomputed* after load rather than saved, shrinking the save and removing drift.

---

## 4. Environment-type recipes (procedural, our own content)

### Konbini (ref. Tomato: 7 × 11 m, 2.5 m ceiling, ~5k tris shell, 54 tiny products, 222 small textures, 2 lights, fridge/AC hum loop)
1. Shell from `house-plan.js`: 7×11 m, 2.5 m, glass front.
2. Gondola shelf generator: N runs × 4 tiers; products = 3 box/cylinder shapes × atlas labels; merge all non-buyable stock into one mesh per shelf run.
3. Buyable items (≤ 50): instanced low-poly (≤ 20 tris) with per-instance label UV offset.
4. Decals: price strips, floor scuffs along aisles, poster on glass.
5. Lighting: 1 hemisphere + 1 cool fluorescent area fill; emissive ceiling panels; fridge glow emissive.
6. Audio: fridge hum + door chime + low radio.

### Bar / izakaya (ref. Heartbeats/Linda/MJQ/Yokosuka: 4–8 × 8–16 m, 2.0–2.7 m, 4–7k tris, 9–14 objects, 65–95 textures, 3–4 lights, jukebox/BGM)
1. Long narrow plan: counter along one wall, 6–10 stools (instanced), 2–4 tables.
2. Back-bar: bottle wall = one instanced bottle mesh × 60 with colour variants; mirror strip.
3. Low ceiling + warm point at counter + neon emissive sign; everything else vertex-colour AO.
4. Interactive: jukebox/radio, darts board, menu — ≤ 10 separate.
5. Audio: room tone + music source + glass clinks.

### Restaurant (ref. Ajiichi/ramen/soba: 5–10 × 4–14 m, 2.4–2.7 m, 5–9k tris, 8–24 objects, 100–250 textures)
1. Counter + kitchen pass with steam particle; menu boards from atlas (handwritten-style canvas text in our own words).
2. Table sets as one instanced group (table + 4 chairs + condiment tray).
3. Grime: wall grease gradient behind stove, worn floor near counter.
4. Hours from A2; staff from A1 tables.

### Home (ref. Hazuki main house: 25 × 11 m multi-room, 2.8 m, ~22k tris across rooms, 150 interactive objects (drawers, cupboards, items), 554 textures)
1. Rooms from `house-plan.js` with fusuma/shoji; tatami via atlas tile at 128² repeated.
2. Lots of *openable* small things (drawers, cupboards, boxes) — cheap (dozens of tris each) and they make a home feel real; contents drawn from the household data in `island-households.js`.
3. Personal clutter generated from the resident's profile (job, hobby): calendar, radio, photos, shoes at genkan.
4. Per-room 1–2 lights; daylight through windows via dusk knobs.

### Street (ref. Dobuita: ~155 × 84 m core, ~31 map sections, 134 props, 5 ambience beds, night pack)
1. Chunk the street into ~20–30 blocks with independent show/hide (already 24 m cells — add district-level unload).
2. Feature packs: vending machines, capsule toys, bikes as instanced families.
3. Night swap: emissive sign set + shutter states.

---

## 5. Things not done / open

- Disc 2/3 (Harbour areas) not surveyed; numbers are Disc 1 only.
- `SCN3` (scene script) is compiled SH-4 code + data; not decompiled here. The per-NPC daily schedule format inside it is therefore **not** confirmed — only the time-table switching and waypoint concepts are.
- MT5 strip decoder rejects a fraction of meshes; triangle counts are lower bounds.
- Area names DBHB/DRHT/DSUS/DTKY/DMAJ/DRSA are inferred from loading-image names.
