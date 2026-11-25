# Handover · cartoon cast online, Kikkou ink · 25 November 2026

## The owner's words
"I just know I want the kikkou style for Johansson World and I want to simplify the characters there again the blender
avatars are better for Godot and Sakura world, the online game should use these cartoony characters even Johansson and
Thuan." Recorded in [AGENTS.md](../AGENTS.md).

## Done (branch `claude/dreamy-ritchie-cxufpl`, not published)
- `src/boot.js`: the Blender (Pixar) bodies load only when a page asks (`?pixar=1` or names). Without it every resident,
  Johansson and Thuan included, is the cartoon. `src/avatars/pixar.js` and the GLBs are unchanged; Studio
  (`avatar-creator/studio.js` in the Office repo) still calls `loadPixarBodies()` itself and is unaffected.
- `npm run build:runtime` rebuilt `runtime/` (the build pruned chunks no longer listed by this build or the previous one,
  as `scripts/build-runtime.mjs` does by design).

## Proved
- `node tools/ci-guard.mjs`: 118 files, 623 tests, all green (303 s).
- `node --test tests/runtime-package.test.mjs`: 4 pass.
- `node tools/cloud-boot-smoke.mjs --eyes3d` (software Chromium, phone viewport): island ready at 20 s, playing at 29 s,
  no page errors; the third-person face photograph shows Johansson as the cartoon. Not checked on a physical device or a
  GPU browser.

## Building it here
The runtime build resolves `../avatar-creator/` and that folder's `../johansson-town/` as in the old one-repo layout. In
a cloud session with both repos cloned side by side, link them first:
`ln -s <office>/avatar-creator <parent>/avatar-creator` and `ln -s <this repo> <office>/johansson-town` (remove the
second link afterwards; it must not be committed to the Office repo).

## Next: the Kikkou ink
Test pages made in the session (private artifacts of the owner): the Sakura test shelf (ID outline and three bands), the
residents at the shelf (the World's hull outline beside the ID outline, with depth "inner lines" for arms across a body),
and the sprite-stacked item previews (kept as an option for the shop's item viewer; the owner has not chosen it).
Plan for the World:
1. An object-ID pass in `src/render/ink-pipeline.js`: one override material that writes a per-object ID (set in
   `onBeforeRender`), skinning and instancing included, into a target beside rtScene; transparent and decal materials are
   left out of it.
2. Ink where the ID changes (16 directions, 2×2 resolve), plus the existing depth second difference only inside one
   object (arms over a body), replacing the hull outlines (`build.js addOutline`) while the look is on.
3. Behind a look first, measured on a phone (frame time in a street and a room), then the default if the owner agrees.

## Mrs Sato off Thuan's spot (same day)
The owner, of the first photograph of Thuan: "Remove grandmother samurai from the opening shot seems to be an error"
(it was Mrs Sato, misnamed in the session as Grandmother Sakurai). Her work spot in `src/people/profiles.js` was still
(-4.2, -26), Sakura's doorstep, half a metre from Thuan's (-4, -25.5), so the town stood them one inside the other.
`src/people/residents.js` now gives her `SATO_RAMEN_STEP`, the pavement in front of Sato Ramen's door (-6.1, -13.9).
Proved: the probe of the running game puts her there, on the pavement (ground +0.04, not blocked), 11.6 m from Thuan;
photographed with `tools/pixar-shots.mjs --name "Mrs Sato"`; the guard green (295 s, before the move from x −4.2 to the
pavement at −6.1; the focused tests and the runtime check after it).
**Thuan's spot (same day, the owner: "Yes"):** it was in the carriageway, a step off the kerb (-4, -25.5, ground −0.11).
`THUAN_PROFILE.work` is now (-6.1, -25.5), on Sakura's pavement where she sweeps at opening (ground +0.04, not blocked);
photographed in front of the shop window by the fruit trestle; the guard green (283 s).

## Kikkou ink: Sakura first (same day, the owner: "Start kikkou make the konbini first")
- **`src/render/kikkou-ids.js`** (new): the ID pass. The same draw run again (as `look-buffers.js` does for normals) with each
  visible mesh's material swapped for an ID material: the object's own ID (a WeakMap counter, 16 bits in red/green), the
  instance number in blue (each tin of an InstancedMesh its own), skinning/morphs/instancing by three's chunks, cut-outs by
  their map's alpha (a transparent mapped picture is cut by its alpha, not drawn as its rectangle). Left out (`idSkips`):
  opacity under ½, depthWrite off, colorWrite off, faint see-through without a map, `userData.noInk`, and the cartoon's
  hull outlines (`userData.outline`), which are also hidden from the picture while Kikkou is on (`drawWithoutHulls`). It has
  its own depth texture.
- **`src/render/ink-pipeline.js`**: `state.kikkou`; the composite draws a line where the ID changes (16 directions, two
  radii, ~2.2 device px each side), at full strength whatever the town's `uStrength`, and thinner with distance by the ID
  pass's own depth (full to 2.2 m, never under ⅖). It is found before the far-depth early return.
- **`src/game.js` `present`**: `pipeline.state.kikkou=kikkouWanted(current?.id)`. On in **Sakura (room id `market`)** only;
  `?kikkou=1` everywhere, `?kikkou=0` nowhere, `?kikkou=ids` / `?kikkou=edge` show what the line is drawn from.
- **`tools/kikkou-shots.mjs`** (new): boots, enters Sakura, photographs door/left/right/shelves/Thuan with and without.
- **`tests/kikkou-ink.test.mjs`** (new, in the guard).

**Found on the way (not changed):**
1. Inside a room the picture's depth target reads "far" over much of the frame (something in the room's draw clears or
   overwrites depth last), so the town's existing depth ink draws almost nothing indoors. Kikkou does not depend on it.
2. **The doubled shop front:** through Sakura's window the town's own Sakura storefront (`Sakura glass storefront`,
   mullions at x ≈ −7.38) stands just behind the room's window. In the plain picture a mullion is a faint hairline; Kikkou
   inks it as a rectangle in the glass. Fix by hiding the town's copy of the frontage while inside Sakura. Next step.

**Proved:** ci-guard 119 files green (310 s); `tools/kikkou-shots.mjs` on the built runtime and on `--source`, no errors;
`tools/cloud-boot-smoke.mjs` street boot no errors. Not measured: frame time on a phone or any GPU (software Chromium
only). Cost while on: one more draw of the scene in Sakura and a 32-tap test per pixel in the composite.

## Kikkou: the stray line in Sakura's glass fixed, and the two dining rooms (same day, the owner: "Proceed")
- **The rectangle in Sakura's glass was the ID pass's own bug, not the town's**: a ShaderMaterial is not clipped by
  `renderer.clippingPlanes` unless `clipping:true`, so the ID pass drew town geometry (a merged `static-props` batch) that
  the street-through-the-window pass (`render/shop-street-view.js`) clips away 13 cm beyond the glass. The ID material now
  clips (the clipping chunks are in its shaders). Item 2 of "Found on the way" above is therefore withdrawn: there is no
  doubled shop front to hide.
- `KIKKOU_ROOMS` is now Sakura (`market`), **Minato Izakaya (`izakaya`) and Sato Ramen (`ramen`)**.
- `tools/kikkou-shots.mjs --room <id>`; `KIKKOU_VIEWS=a,b` narrows the views; `KIKKOU_PROBE=x,y` (with
  `KIKKOU_MODES=ids:ids`) names the object drawn at a pixel (`?kikkou=ids` keeps the last frame's ID → object map in
  `globalThis.__JOHANSSON_KIKKOU__`).
- **Left:** through Sato Ramen's frosted door glass the street's lines come through crisp, not softened by the glass.
- **Proved:** guard 119 files green (294 s); shots in izakaya and ramen on `--source` and ramen on the built runtime, no
  errors. Z-fighting was not worked on: Kikkou neither fixes nor hides a surface drawn in another's plane.

## The Minato Maru (same day, the owner: "Work through the Minato Maru now I think it's problematic"; then, asked what:
## "Flicker / glitches, Looks plain / unfinished, Walking aboard / camera, Kikkou ink on her, Engine room doesn't look realistic")
**Found:**
- **Flicker:** her model passes `tests/ferry-z-fighting.test.mjs` (2 mm/4 cm² aboard, 5 mm/0.01 m² from the quay). Nothing
  new found in the running game in software Chromium; a phone's flicker has not been reproduced here.
- **Walking aboard:** `tools/ferry-exploration-check.mjs` run through Chromium (its smoke runner wants WebKit, absent in
  the cloud): all 11 steps pass, no page errors. The first engine-room explore view faces the aft bulkhead because that
  is where you stand at the ladder's foot.
- **`tools/ferry-look.mjs` (not changed):** its views are world offsets from her position, not her own frame, so at the
  present berth 02 (pier gangway) looks into her side and 06/12 (bow ramp) sit inside the port bow house, filling the
  frame with its cream wall. Her ramp is deck green with eleven anti-skid bars (`ferry-model.js` k2), not a blank slab.
- **The engine room** is `assets/models/ferry-engine-room/minato-engine-room-h1-f1.glb`, built in Blender from
  `ferry-interior.js` (README: `art/ferry-engine-room/`). It is two meshes (paint, metal), which is why it reads flat.
  Blender is not installed in the cloud; `pip install bpy==5.3.0` (Python 3.13) works in a venv, the scripts were written
  for 4.0.2 and have not been run on it yet.

**Done:**
- **Kikkou aboard her:** on whenever the player stands on one of her indoor floors (`KIKKOU_SHIP_FLOORS`: saloon to
  engine room), off on her open decks, walkways and wings (they stay with the street).
- **Lines within one object:** the ID line also falls where a part of the same object stands well in front of the part
  beside it (ID-pass depth, `|Δz| > 0.05 + 0.03 z`), both sides. The merged engine-room GLB gets its silhouettes from it.
- **Lettered plates** (`userData.plate==='text'`) are left out of the IDs: their frame crowded out a small label's words.
  Dials keep their rings.
- `tools/kikkou-shots.mjs --room ship`: the eight engine-room cameras, Kikkou as the game decides (`kikkou=auto`) and off.

**Proved:** guard 119 files green (329 s); `kikkou-ink.test.mjs` 4 tests; ship, Sakura shots on `--source`, no errors.

**Next:** the engine room's realism (the two-material GLB; Blender 5 in a venv, or the GLB split per part), then the plain
surfaces, then `ferry-look.mjs` in her own frame.

## The engine room's floor (same day)
- Its chequer plates and gratings (`ferry-interior.js` `floorPlate`) were left out where the Blender room stands
  (`ferry-model.js`: `['chequer','grating']…&&h1Point(…)` → skipped), so the room stood on plain grey paint: the GLB has
  none (its chequer relief is render-only, `tools/blender/build-ferry-engine-room-h1.py`). They are drawn again, decals
  with polygon offset as every plate aboard; `tests/ferry-z-fighting.test.mjs` passes 4/4.
- Floor plate and grating materials are at 0.6 of their colour: under the deckhead lamps a metre or two above, the
  steel washed out to tile white.
- **Pre-existing, not touched:** `tests/ferry-johansson-marine.test.mjs` fails 2 tests on the branch's base too (not in
  the guard).
- **Left for a decision:** the machinery itself is one merged Blender mesh in two colours (paint, metal) with baked
  contact shade; real realism (castings, pipework detail, wear, labels on parts) is a Blender rebuild. Blender 5.3 runs
  here as `pip install bpy==5.3.0` in a venv; the builder was written for 4.0.2 (e.g. `calc_normals_split` is gone in 4.1+).

## The engine room rebuilt in Blender: H1-F2 (same day, the owner: "Use your recommendations. And proceed")
- **Blender in the cloud:** `python3 -m venv … && pip install bpy==5.3.0` (Python 3.13); run the builder with that python
  (`python tools/blender/build-ferry-engine-room-h1.py`, no `blender -b`). The builder is ported: `calc_normals_split`
  guarded (gone in 4.1+), the colour quantizer accepts float, ushort or byte colours (5 exports normalized ushorts). Run
  unchanged it reproduced F1 exactly (80,376 triangles, 1,290 components) before anything was altered.
- **`geometry-h1.json` was stale** against `ferry-interior.js` (one line); re-exported.
- **Side frames** (`ferry-interior.js`, before the return of `FERRY_INTERIOR`): a 100 × 30 mm bar at each 600 mm station
  on both sides, aft bulkhead to the electrical workshop, drawn only in clear lengths (≥ 0.3 m, nothing within 40 mm), not
  at the room bulkheads; stringer lengths where a whole bay is clear. `deco` boxes: not solid, not camera-blocking.
  Honest result: they show mainly in the store and above fittings; the rooms' big bare walls are transverse bulkheads and
  partitions, which got none.
- **Contact shade:** radius 0.22 → 0.32, strength 0.22 → 0.42 (`cad/finish-h1-f1.json`); baked range now 0.58–1.0.
- **File:** `minato-engine-room-h1-f2.glb` (81096 triangles, 3519548 bytes: docs/qa/ferry-engine-room-h1/blender-finish-audit.json); F1
  removed; loader, tests, review page and check tool point to F2; `source_components` 1350 in the finish schedule and
  `tests/ferry-fixed-camera.test.mjs`. The scene's name in the game stays "Minato Maru H1-F1 / Blender CAD" (tools find it).
- Not re-run: `tools/ferry-engine-room-cad-h1.py` (the PDF/DXF sheets) and the Blender renders in `art/…/renders/`; both
  still show F1.
- **Proved:** guard 119 files green (323 s); ferry-exploration, fixed-camera and z-fighting tests 22/22; ship shots on
  `--source`, no errors.
- **Still open (task list):** the machinery's own shapes (block-built engines), the plain exterior surfaces, and
  `tools/ferry-look.mjs` in her own frame.

## Published, then the main engines as castings (same day, the owner: "Push to main then proceed with item 1")
- **Published:** `main` fast-forwarded to `576acc6` (everything above), after restoring the 203 older runtime chunks the
  builds had pruned (as earlier releases did) and a green guard. The live page serves the new boot chunk (checked).
- **After that, on the branch only (not published):** the main engines' blocks (`ferry-interior.js`, by the oil filler):
  on the outboard face a frame rib at each cylinder boundary and a bolted inspection cover per cylinder; four stud nuts
  on each head; holding-down bolts along the bedplate flanges. Small unbevelled `deco` boxes. GLB rebuilt (H1-F2 file,
  1,512 components, 83,040 triangles, 3,636,188 bytes; budget 100,000 / 4,000,000). Guard green (321 s); ferry
  z-fighting 4/4. Builds now restore pruned chunks from `origin/main` before committing.
- **Next for item 1:** the generators in the auxiliary room (same treatment), the gearboxes, pumps and the switchboard's
  cabinet; about 17,000 triangles and 360 kB of budget remain.

## The menu button's book, centred (same day, the owner, with a phone screenshot: "The ui icons needs to be centred now they are offset")
`town-book.css`: `#directoryButton` was `display:grid`, and its own word "Menu" (font-size 0) took a second grid row
(43 px + 15 px in the 60 px phone button), so the book sat 7 pt high. Now flex, centred both ways; the phone rule sets
`height:60px` with its `min-height`. Measured at iPhone 14 Pro size: the icon's centre 89.5 of 90 px (3×) down the
circle. `index.html`'s `?h=` stamp updated. Guard green (325 s). Not published yet. The white strip under the game in the
owner's screenshot was not reproduced here (the page fills the viewport in Chromium's phone emulation); not looked into.

## The generators as castings (same day, the owner: "Proceed")
`ferry-interior.js`, the JG-125 sets: frame ribs and bolted inspection covers on both long faces, head nuts, bed bolts.
GLB rebuilt: 1,664 components, 84,864 triangles, 3,745,628 bytes (budget 100,000 / 4,000,000). Guard green (318 s),
ferry z-fighting 4/4. On the branch, not published. Left of item 1: gearboxes, pumps, the switchboard's cabinet.

## Z-fighting into Sakura from the street; Kikkou upstairs (same day)
- **The owner: "There is Z fighting when looking inside from the street to the Sakura konbini".** Measured in the running
  game: the town's storefront slab (`world/storefront.js`, top at y 0.180) and the shop's own floor drawn through the
  window (the stand-in's `sakura-floor`, y 0.180) lay in one plane, both facing up. The slab is now 0.16 high, 20 mm
  under the floor. A test in `tests/kikkou-ink.test.mjs` holds it there. `tools/z-fighting.mjs` did **not** report the
  pair in the live scene (0 findings even at 30 mm with decals and identical faces kept): it does not see the street
  stand-in against the merged town props; not looked into. Not ruled out: other causes of flicker there on a phone (the
  flicker itself cannot be seen in software Chromium).
- (The "stand-in" is not a double: while it shows, its sources are on layer 31, `render/static-props.js` `show`.)
- **The owner: "Also the upper floor need kikkou style too".** `KIKKOU_ROOMS` gains `sakura-office`.
  `tools/kikkou-shots.mjs --room sakura-office` goes in at the shop and up the stair (stepping the frozen game until the
  room changes). Its lenses there start inside the player's head; the room behind is right.
- Guard green (294 s). On the branch, not published.

## Published again (same day, the owner: "Publish")
`main` fast-forwarded to `d68747f`: the menu button's icon, the main engines' and generators' detail, the storefront
slab under Sakura's floor, Kikkou in Sakura's office. Checked live: the page serves `boot-B3RGc1u6.js`,
`town-book.css?h=61d9ed28` and the F2 engine-room model (HTTP 200). Left of item 1: gearboxes, pumps, the switchboard's
cabinet; then the plain exterior surfaces and `tools/ferry-look.mjs` in her own frame.

## The way along the west quay (same day, the owner, with a phone screenshot: "Make this way traversable I hate that he takes up the whole walkway")
Mapped with the game's own collision probe (0.25 m grid): the blue sabani (`okinawa/quarters.js` `buildWestQuay`) and the
freight hoist's footing behind its stern made one wall from the fish boxes to the quay edge. The sabani lies 1 m further
north (z −43.5); the gap behind its stern is three clear rows (z −47.0 to −47.5). Kōji's `boatyard`/`sea` point
(`people/canonical-day.js`) is at his boat's side (−33, −43.5), not mid-lane (−31.8, −45). `tests/port-access.test.mjs`
holds the gap open. Guard green (308 s). `tests/housing-consolidation.test.mjs` fails one test with and without this
change (pre-existing, not in the guard). On the branch, not published.

## The web game stands alone: stage 1, conversations (same day)
The owner's new ruling is in AGENTS.md (25 November 2026: the web game stands alone), superseding 19 October's "demo".
`src/edition.js`: the web's `conversations` and `pouring` are on; `tests/edition.test.mjs` follows. Checked in the web
edition in Chromium (`--source`): "Talk to Harbour master" opens the full conversation (greeting by name, a line, a
favour asked, four topics, "Sell a catch"), no page errors. Guard green (307 s). On the branch, not published.
`JOHANSSON_EDITION=web node --test tests/edition.test.mjs` fails one test with and without this change (pre-existing).
The owner also asked about google-gemini/gemini-api-cli: a CLI for Gemini models (text, image, speech, music, video),
needing a third-party binary and the owner's API key; not used. Recommended only for voices or art, if asked.
