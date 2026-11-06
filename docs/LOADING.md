# Loading: what the phone fetches before the town runs

Measured 2026-10-13 with a headless browser against the published page (`tools/measure-load.mjs`: bytes by file
from the first request to `__JOHANSSON_RUNNING__`), before and after the first batch. The creator: "the game loads too
slow, is it possible to optimise the code or loading, can the code be consolidated? Say more with less code."

| | Before | After batch 1 |
|---|---|---|
| JavaScript fetched before the Enter button | 5 695 KB | 3 546 KB |
| Everything fetched before the town runs | 24 661 KB over 178 files | 11 943 KB over 89 files |
| Raw (unminified) source modules fetched | three.js 1 284 KB + 60 modules, one after another | none |

## Batch 1 (built)

- **The title menu imported the source tree.** `index.html` imported `title-menu.js`, which imports `save.js` and
  `friendship.js`, which import the residents, who import the town's layouts, the ferry, the ocean and three.js. The
  title screen therefore fetched 1.3 MB of unminified three.js and sixty source modules in a serial waterfall, and
  the game then fetched three.js again inside its own chunk. `scripts/build-runtime.mjs` now builds `title-menu.js` as
  a runtime entry: it shares the game's chunks (three.js once, minified) and is preloaded with them.
- **Food art as WebP.** The five `assets/food/island-*.png` (1.2–1.9 MB each, the ice cream loaded at boot by the Blue
  Coral shop) are WebP at 180–280 KB; `commerce/food-art.js` points at them. 7.8 MB → 1.1 MB.
- **Boot-time material textures re-encoded.** Nine plaster, timber and roof textures (1024², JPEG at quality ~100)
  at quality 82: 5.3 MB → 1.5 MB. Normal maps keep full chroma.

## Batch 2: the title while it builds, and the docks opening (2026-10-13)

The creator: "The loading screen is unreadable while it loads for the landing page I mean, can you enhance loading ? Move
some loading to the opening scene ? Where Johansson has spawned randomly ?", then "Change the spawn point so Johansson
always spawns at the docks , looking at something new , the animation should be long enough to load the rest of the
town and tropical island doesn't need to load until we are there we see it in the distance but it's not the whole
island".

- **What it looked like.** The page imports the game at once, and the game builds the whole town behind the title
  (about 9 s of CPU measured in node; minutes in a slowed headless browser). Until the first 3D frame the title stood
  on the page's own dark background: a black slab under the logo, "BUILDING TOWN…" in 11 px grey on it, the footer
  dark on dark. At night the live title's stamp and footer were unreadable too.
- **The title's own view as its backdrop** (`title-screen.css`, `.title-backdrop` in `index.html`). It is a still of
  the title camera's view (`renderTitle` in `game.js`), by day or by night by the hour (`data-title-light`, set before
  the first paint), landscape or portrait. It fades into the live view when the town is ready (`data-scene=ready`).
  It adds 8–39 KB to the first visit (`assets/images/title/`, WebP at 960×600 and 540×960), the one deliberate
  exception to the rule below: a readable start is worth one small picture.
- **Readable status.** "Loading the island…", then "Building the town…", is a pill on a light backing over a running
  bar. The bar moves by transform, so the compositor keeps it moving while the town is built. The footer and the
  work-in-progress stamp have a light backing at every hour.
- **Always at the docks** (`world/openings.js`, `docks`). Eight sights, each only while it is there to be seen: the
  gangway's foot, the Minato Maru alongside (only when she is), the end of the pier, the cargo boat unloading (only at
  her calls), the fish auction's catch, Mr Fujita's houseboat, a fishing boat on the quay, and the landing sign with
  Kitano-jima across the strait. Each start shows one not yet seen, until all have been. The town's other openings
  (Minato, Sato Ramen, the benches, the seawall) are kept for `?spawn=`.
- **The opening holds while the town loads** (`render/spawn-scene.js`). A docks opening begins high and wide over the
  harbour, turning slowly round him. It holds there while anything near him is still loading
  (`detailStream.pendingNear`, once the stream has started), for at least 2.2 s and at most 20 s: on a slow line he is
  not kept standing longer, and what has not come streams in as he walks.
  Then it comes down to him and the lens returns behind him, onto what he is looking at. While it holds he stands
  still, and only a placement, a room or another view can end it, so nobody walks into a town still being built.
- **Found on the way: Kitano-jima's batches were culled from Minato.** `batchStaticProps` put the island's merged
  meshes (runway, quay wall, plaza…) under `world.group`, outside the island's horizon group, so section culling hid
  them beyond 54 m while its unbatched glass and beacon still drew. One batch also lost part of the terminal plaza.
  Batches now stay inside their horizon group (`render/static-props.js`). That showed a real 6 cm lip where the trail
  meets the plaza's edge, which the island's walk floors now count as plaza (`airport-ground.js`: a micrometre of
  slack on floor bounds).

## Batch 3: Kitano-jima when he goes there (2026-10-13)

"tropical island doesn't need to load until we are there we see it in the distance but it's not the whole island".
Kitano-jima was about 410k triangles, ~320 colliders and ~60 prompts, all built at startup and drawn from Minato.

- **At startup** (`createTown({kitano:'distant'})`, `world/kitano-on-demand.js`): the island's ground and quay, its
  airport buildings (a few thousand triangles), the vehicle yard, the hamlet's sites, gate prompts and nameplates, the
  ocean's dry pits, and a view of the rest as it is read from across the strait. The distant view has the plants at
  their own places, sizes and turns as a few simple shapes (`farPlants`, under 20k triangles for the 355k of the real
  ones). The airport district is its plaza, kiosks, thatch, parasols and lookout deck (`buildAirportDistrictFar`).
  The hamlet is its yards and three houses, Johansson's from its drawings' walls, eaves and ridge (`hamletFar`).
- **When he heads there:** boarding the Minato Maru for Kitano-jima starts `prepare()`, a builder a step, so it is
  ready long before she berths. The quick crossing waits for it behind its veil. Anything that puts him on or by the
  island (a save that wakes there, the Town Book, a room's door, the audit) calls `ensure()` first, which builds it
  at once. Then the stand-ins go, everything static is batched in the island's own group, its window glass joins the
  clock, the game shades and compiles it, and the neighbours plan their walks again round its new walls.
- **After that** the real plants show within 240 m of the island and the simple ones beyond 260 m (`tropic.lod`).
- **The same island either way:** `tests/kitano-on-demand.test.mjs` builds it both ways and compares colliders,
  prompts and meshes one by one. The tests, the tools and Studio build it whole (`kitano:'full'`, the default).

## Batch 4: the same plan, answered faster (2026-10-13)

The town's build was 9.3 s of CPU in node (`--cpu-prof`). A fifth of it was two questions every builder asks
thousands of times: which route is under a point (`routeAt`), and how high the ground is there (`groundHeight`).
Each answer scanned every route's every segment (37 routes, 121 segments, a fresh copy of each list every time), the
island's routes the same way, and every coastline edge for "is this land". The sea's shore texture asked for the
distance to every coastline edge for each of its 200k texels.

- `src/world/plan-index.js`: a grid of where each route segment reaches (`routeFinder`), still asked in the routes'
  own order, so the first route found is the scan's; a grid of the coast that answers inside or outside at once
  wherever no edge crosses the cell (`polygonTest`); and only the coast edges that can be within the shore field's
  80 m (`edgesNear`). The park access paths' heights answer "none" at once outside their reach.
- The answers are the same: `tests/plan-index.test.mjs` asks 40 000 points both ways each, and the shore texture is
  identical texel for texel. The power lines (108 wires, the same two clipped), the countryside's placements, the
  colliders and the prompts are unchanged.
- **Measured (node, CPU only):** `routeAt` and `groundHeight` over 73 000 points 14.5 s → 1.1 s; the town's build
  9.3 s → 4.6 s (the east lawn 2.4 s → 0.6 s, the countryside 1.3 s → 0.2 s, the harbour 1.7 s → 0.7 s); the shore
  texture 1.3 s → 0.3 s. Walking and the residents ask the same questions every frame, so they gain too.
- Batches kept in a moved group (Kitano-jima's) get their world matrix at once (`render/static-props.js`), so a
  ray cast before the first frame finds them where they are drawn.

## Batch 5: the audit of the start itself (2026-10-13)

The creator: "Improve the loading times, audit why it loads so slow and improve loading time to enhance playability".
Measured from Enter to a running town in a headless browser (`tools/measure-load.mjs`, and a CPU profile of the same
run through the runtime's source maps). The start was not the download: it was the first frame. Of 33 s, 14 s went
compiling shader programs and 5.5 s uploading geometry, against 5 s building the town.

- **Every material was compiled twice.** `game.js` compiled the town's shaders ahead of time for the screen (sRGB
  output), but the town is drawn into the ink pipeline's offscreen target (linear output), a different program. So the
  first frame compiled them all again: 190 programs where 134 were needed. They are now compiled for the target the
  town is drawn into (`compileTown`, and Kitano-jima's on arrival): 93 programs before the town runs, where it was 141.
- **Sakura's back-room figurine (5 MB, the town's heaviest model) was fetched with the town**, and Sakura's window
  view and its door both waited for it. Nobody sees the back room from the street: it is fetched when Johansson is
  within 30 m of the shop on the street or goes in (`sakura-shop.js`, `owned-characters.js` `lazy`). The docks openings
  are farther than that, so it does not compete with what they stream.
- **The shelf labels read their canvas back from the GPU** once per flavour (1.4 s of the build, and the browser's
  "multiple readback" warning). The atlas canvas is kept in memory (`willReadFrequently`), which reads back at once.

| | Batch 4 | Batch 5 |
|---|---|---|
| Everything fetched before the town runs | 15 817 KB over 96 files | 8 066 KB over 91 files |
| Enter to running (headless, software GPU) | 59 s | 30 s |
| Shader programs compiled before it runs | 141 | 93 |

Found and left for their own batches, in order of size:

1. **Each resident's body is about 4 MB of vertex data**, unindexed (50 000 vertices at 76 bytes each), and there are
   22 of them: most of the 146 MB uploaded to the GPU at the first frame. The body is unindexed on purpose (the
   shoes, the hat's hair and the towel are edited as vertex ranges), so indexing it, or packing its colours and
   weights in bytes, has to change those edits too (`avatars/build.js`).
2. **The walk surface** (`walk-surface.js`, where feet stand on what is drawn) asks the plan's height at 874 000 grid
   cells at startup: 2.8 s in node, most of it `coastalSurface`. It could be built near Johansson first and the rest
   during the opening, or answered from the plan's indexes.
3. The JavaScript before Enter is unchanged (3.8 MB): the interiors are still static imports of `game.js`.

## What is still large, in order (the plan for batch 2 and 3)

1. **The game's static import graph is one 3.5 MB download before the first frame.** `game.js` statically imports
   every interior (onsen 180 KB, Sakura 160 KB, the quarters 650 KB, compact shops, Sato Ramen, the town hall), so
   they all load before Enter. Each interior should be a dynamic import when its door is opened (the chunks already
   exist; only the `import` statements in `game.js` and `enterRoom` change). Expected: about 1.4 MB off the boot path.
2. **`spector.bundle` (1.2 MB)** is a WebGL debugger. It is a separate chunk and not preloaded; confirm it is only
   imported behind the inspector flag, never in a normal session.
3. **Models at boot.** The resident figurines and display GLBs (`thuan-display.glb` 5 MB, `maneki-neko-display.glb`
   1 MB) are only needed in their rooms; load them on entry. The HDR sky (1.5 MB) could be a 512 px version on phones.
4. **The avatar code** (`swept-ponytail-mesh.js` 260 KB of source, `build.js` 137 KB, `animate.js` 125 KB) and
   `game.js` (196 KB, one file) are where "say more with less code" applies: the ponytail mesh is generated data
   that could be built at runtime from a few parameters, and `game.js` carries room entry, seating, eating, the ferry,
   the island and the audit API in one file. Splitting it by concern is a refactor to do room by room, with the test
   suite as the net.
5. **Service worker.** `sw.js` caches the runtime; a returning phone should not refetch 12 MB. Check its cache list
   covers the hashed chunks and the textures.

Rule for every batch: measure with the script before and after, and never ship a change that moves the first-frame
bytes up.
