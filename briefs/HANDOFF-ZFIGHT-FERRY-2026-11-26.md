# Handover · Flicker aboard the Minato Maru: the hazard stripes, shadow acne, the Kikkou IDs · 26 November 2026

## The owner's words
On his iPad (Safari), with two photographs (the car deck at the engine-room door; the engine room):
"Lots of z fighting I thought we eliminated it"; "There is still z fighting in the engine room too, why is there so much
z fighting ... no z fighting allowed".

## Done (branch `zfight/ferry`, not pushed; the runtime is not rebuilt)
Both photographs were reproduced headlessly (Chromium, swiftshader, an iPad mini in portrait at 1×: 744 × 1133, the
tablet tier, so the sun's shadow map is 1024² over ±26 m, 5 cm a texel). Two separate faults made what he saw at the
engine-room door; neither was visible to the coplanar scans.

1. **The hazard stripes fought the lower lobby's vinyl** (z-fighting, measured). The stripes (`ferry-interior.js`, the
   engine room's entrance) were drawn from CAR+.004 to +.008, *inside* the vinyl covering (`deco` from CAR+.003 to
   +.008): their tops lay in the vinyl's top plane, both in the `decal` class with one polygon offset. The vinyl's two long
   triangles cut saw-toothed wedges through the yellow and black, different at every camera position (his photograph).
   Fix: the stripes lie on the vinyl as a 4 mm layer (CAR+.008 to +.012; JSY-STD-403 rule 4).
   Why the scans missed it: `tests/ferry-z-fighting.test.mjs` called `coplanarOverlaps` without `offsetPairs`, which
   leaves every polygon-offset face out. A new test there compares decals with each other; it fails on the old stripes
   (0.456 m², ferry-interior.js:264 against :747) and passes now. It found nothing else aboard but the navigation
   lantern's stand-in pair the file already excuses.

2. **Shadow acne on the walls** (the diagonal light and dark bands with saw-toothed edges; measured). A wall turned from
   the sun is itself drawn into the shadow map (three.js casts a one-sided solid from its far side), so it is compared
   with its own depth; the cel ramp still lights such a face with its darkest band, so the comparison decides between
   that band and shadow, texel by texel. The sun's normal bias was a fixed 0.045 m: 1.77 texels of the desktop's 2048²
   map, but 0.89 of the tablet's 1024², under the PCF filter's reach. Fix (global, `src/render/sun-shadow.js`, used by
   `src/game.js` where the sun is made): the normal bias is held in texels, the desktop's 1.77 on every map, so the desktop
   is unchanged (0.045 m) and the tablet gets 0.09 m. Phones draw no sun shadow (`graphicsProfile`), so they never had this.
   The walls inside the casing now read as the sign wall beside them does (in the shade of the deck over them).

3. **Kikkou IDs keep a decal's polygon offset** (`src/render/kikkou-ids.js`, the town helper's finding, made here once):
   the ID material dropped the offset, so in the Kikkou pass (on aboard indoors) a decal was drawn at its backing's depth
   and their IDs could fight, scribbling ink. One ID material per source material, so nothing leaks. Test added to
   `tests/kikkou-ink.test.mjs` (fails without the change). On the ferry views measured it changed nothing measurable
   (engine room 1.08 / 10 000 before and after): aboard, the decals stand millimetres off their backings, which 24-bit depth
   tells apart; the change matters where a decal lies exactly on its backing (the town's prints and posters).

## The flicker detector: `tools/flicker-audit.mjs`
`node tools/flicker-audit.mjs --profile=ipad|iphone|desktop [--views=…] [--src=dir] [--still] [--variants=game,no-shadow,no-ink]`.
It boots the real game from this checkout's source, stands him aboard, photographs a view, then moves the camera
0.4 mm along each axis and turns it 0.004° (z-fighting changes under such moves, real edges move under a pixel), and
slides the sun's shadow map 4 to 25 mm under her with nothing on the screen moving (what she does at sea and alongside;
acne and crawling shadow saw-teeth change). A pixel counts when its colour changes (by 40/255 under camera moves, 16/255
under shadow moves: acne's bands are only a cel band apart) and no pixel within one of it in the other picture matches.
It writes the picture, a heat map (red: camera, blue: shadow) and a JSON report. 17 views are defined (both photographs,
car deck, stairs, lobby, saloon, carpet room, wheelhouse, crew corridor, mess, open deck, starboard walkway, the engine
room, aux room, workshop). `--src=dir` serves `dir/src` for a before-and-after (`git archive <commit> src | tar -x -C dir`).
`tests/flicker-audit.test.mjs` tests its comparison (in the guard). Run it alone: a view takes about three minutes in
swiftshader on four busy cores.

## Proof (iPad profile, 12:00, alongside at Minato; unstable pixels per 10 000; swiftshader)
| View | before: camera / shadow | after: camera / shadow |
|---|---|---|
| Car deck, engine-room door (photograph 1) | 259.69 / 55.79 | 0.15 / 3.05 |
| Engine room, port side forward (photograph 2's side) | 1.08 / 1.77 | 1.08 / 1.29 |
| Car deck forward | 2.25 / 1.14 | 2.24 / 0.87 |
| Saloon | 0.04 / 0 | 0.04 / 0 |
| Starboard walkway (outside, a face turned from the sun) | 14.92 / 5.94 | 12.79 / 0.36 |

Pictures and the detector's reports: `art/ferry-zfight/` (the door view before and after, and its heat maps; the engine
room after with its heat map; the starboard walkway before and after: the deckhouse's side turned from the sun keeps its
tone outside, so the look is unchanged there). What is left at the door is the crawl of real shadow edges (the ladder
trunk's edge) as the map slides, a shadow map's nature, not acne; on the walkway the camera's 12.79 are thin rails and
frames aliasing at their edges, as before. The engine room's 1.08 are scattered edge pixels; nothing fights there in these
views (see What remains).

Tests run, all passing: `node --test tests/no-z-fighting.test.mjs tests/ferry-z-fighting.test.mjs` (18/18);
`tests/sun-shadow.test.mjs`, `tests/flicker-audit.test.mjs` (new, added to `tests/ci-guard.txt`), `tests/kikkou-ink.test.mjs`
(6/6), `ferry.test.mjs`, `ferry-accommodation`, `ferry-walk`, `ferry-exploration`, `startup-recovery`, `render-stability`,
and the tests that read `game.js` (`boot`, `start-order`, `dusk`, `sun-path`, `visual-audit-freeze`, `graphics-lifecycle`,
`single-pass-colour`, `resolution-governor`, `audit-boot`: 37/37). Failing before and after this work, on e4cdcdc as well
(not touched): `ferry-engine-room-access` "the engine-room ladder is walked across its whole width" (ladder at x 3.19) and
"the crew are drawn" (Mr Nakandakari has no drawn look); `ferry-ship` "the hull as drawn is the ship as designed"
(56 meshes). `runtime-package` was not run: the runtime is not rebuilt here.

## What remains (not fixed, measured or seen)
- **The engine room's Blender model has coplanar faces inside it.** `coplanarOverlaps` over the loaded GLB
  (`assets/models/ferry-engine-room/minato-engine-room-h1-f2.glb`, mesh `Cube883`, same material, different contact
  vertex colours) finds 4.33, 4.31, 3.91, 1.79, 0.61 and 0.59 m² overlaps with gaps of 1e-7 to 2e-6 m, plus three small
  ones between `Cube883` and `Cube883_1`. No test scans the GLB (the ferry's scan builds only `buildFerryModel()`). The
  detector saw almost no flicker in the engine-room views measured (1.08 / 10 000, scattered edge pixels), so these may be
  hidden inside solids or the two colours may be too close to show; they belong to the Blender build and should be
  removed there, then a test should scan the GLB. Not proven either way on the owner's iPad.
- **Saw-toothed cel bands on the engine room's side frames** (seen, not flicker): along the shaded side of the white
  hull frames the cel ramp's boundary zig-zags in triangles, stable under the camera moves. Likely smooth normals across
  a coarse bar (`bar`, six sides) so the band boundary follows its long triangles; flat shading or more sides would cure
  it. Not changed.
- **The desktop has the same acne at half the size**: the desktop still of the door view shows fine diagonal lines on the
  same wall (2048², 0.045 m kept). A slope-scaled bias in the shadow pass would cure every tier; it changes the look of
  every face turned from the sun (they would read as shaded, not in the cel ramp's darkest band), so it is the owner's
  call. A first attempt here (offsetting a turned face's sample towards the sun) removed the bands but let light through
  thin parts (a door leaf and a bench back banded instead) and was dropped.
- **The wheelhouse wipers**: 15 tiny identical-looking coplanar pairs (≤ 7 cm² each) between the pantograph wipers'
  separate meshes; drawn alike so no colour flicker, but in the Kikkou ID pass two meshes have two IDs and can scribble
  ink there. Not measured.
- **Not proven on the owner's devices**: software GL is not an Apple GPU. iOS stores a 24-bit depth request as 32-bit
  float, which near 1.0 resolves about as finely, so the depth arguments here should hold, but no iPad was used. The
  stripes and the acne were the faults seen in both photographs; the engine room's own complaint is not reproduced
  beyond scattered edge pixels.
- The runtime (`runtime/`) is not rebuilt: `npm run build:runtime` when this is merged.
