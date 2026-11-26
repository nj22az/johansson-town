# Handover · Sakura's restroom drawn in CAD and Blender; Johansson's face · 26 November 2026

## The owner's words, in order
1. "The toilet and faucet needs to be more realistic can you draw it in cad then redraw it in blender ? And the door should be closed by default"
2. "And make the room more cute, remember a a Japanese cute girl has decorated it"
3. "Seems like Johansson's face needs some improvement"
4. "Add cute stickers on the wall and floor, maybe use stickers from pocket camera to keep consistency"
5. "Signs can't be truncated like this, add icons to explain. And reduce the big English bits that flow ower"
6. "And the soap or whatever that round thing is can't be transparent"
7. With his own photograph: "I want you to make Johansson look a bit more manly and not so round, he is supposed to look more like me"; "Use blender to redraw him if needed"
8. "And the hair should be more visible"; then "Make the hair look better who grows hair around the ear like that"

## Done (branch `claude/dreamy-ritchie-cxufpl`, not published to `main`)
**Sanitary ware, drawing SK-401 (`art/sakura-restroom/`).**
- `spec.json`: sizes, who, why and where. `tools/cad/build-sakura-restroom-cad.py` (build123d 0.13) draws the solids in
  millimetres: a close-coupled toilet (bowl with its well and water, seat, lid up, hinge, cistern, lid with the
  hand-wash dish, swan-neck spout, side lever, stop valve and supply) and a pedestal basin with a cross-head pillar tap.
  It stops if two parts occupy the same space (it found eleven clashes on the way). It writes `cad/toilet.step`,
  `cad/washbasin.step`, the sheet `cad/SK-401-sanitary-ware.svg` / `.dxf`, `cad/parts.json` and the STL parts (ignored).
- `tools/blender/build-sakura-restroom.py` (bpy 5.3 from pip) redraws them as game meshes: welds, a triangle budget per
  part, hard edges and weighted normals, finishes, joins what never moves, puts the lever's and the tap head's origin on
  their spindles, dresses the seat and lid in pink terry. It writes `assets/models/sakura-restroom/sakura-restroom-fixtures.glb`
  (19 335 triangles, 437 kB), the `.blend`, `blender-report.json` and, with `--render`, the stills in `review/`.
- `src/world/interiors/sakura-restroom.js`: `RESTROOM_FIXTURES` loads and stands them; the lever dips and returns when
  the toilet is flushed; plain stand-ins only where the model cannot be had (tests, a failed download). The shell no
  longer draws the box toilet and basin (`sakura-toilet` is gone from `sakura-shell.js`).

**The door** (`RESTROOM_DOOR`): a flush leaf hung in the wall's thickness on the north jamb, shut until somebody in the
shop comes within 1.25 m, opening into the room and shutting behind them; no collider (as the office door). A plate
"Toilet", a louvre, lever handles, and a small window green for free, red when somebody is inside. Fed from
`people/sakura-shop.js` with the office door.

**Thuan's room** (`RESTROOM_DECOR`, `RESTROOM_STICKERS`, each with who and why): pink covers, a mat cut round the foot,
pink slippers with a bow (moved clear of the door's swing), a gingham paper cover, a hibiscus in a bud vase on the
basin's ledge, a framed cat under cherry blossom, a pink-edged towel; seven of the Pocket Camera's own Friends stickers
(copied from the Office site's `camera/stickers/cute` thumbnails to `assets/graphics/sakura-restroom/stickers/`) on the
tiles, the door and the mosaic. The notices are redrawn with icons and words measured to fit, and moved west of the
fan's pull cord. The soap globe is solid.

**Johansson** (`src/avatars/cast.js`, from the owner's photograph): head form `strong` (new, appended in
`head-profile.js`), dark thick brows, dark brown heavy-lidded eyes, a smaller nose set higher so the mouth shows, the
painted stubble shadow in place of 120 raised bristles, darker grey hair. The horseshoe hair (`build.js`, shared with
the two other residents who wear it) now runs above the ear with a sideburn in front and the nape behind, never over
or under the ear. Guide portraits re-rendered (`TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/render-resident-guide.mjs`).

## Proved
- `node tools/ci-guard.mjs`: 120 files, 634 tests, all green (293 s), with the new `tests/sakura-restroom.test.mjs`.
- `node tools/restroom-shots.mjs` (new) on the built runtime and on `--source`, software Chromium: no page errors; the
  door shut with nobody near, open at the door, shut again from the toilet. Photographs in `art/sakura-restroom/review/game/`.
- `tools/pixar-shots.mjs --name Johansson --cartoon`: before and after in the same folder.
- Not checked: a phone or any GPU browser; frame time with the model (19 k triangles, 14 draws).

## Known, not done
- `tests/sakura-surfaces.test.mjs` fails on this branch without these changes too: the stockroom's amber bottles and a
  cardboard strut, 0.05 mm apart at (0.91, 0.23, -6.64). It is not in the guard. Not touched.
- Johansson's side hair is still a slab of the hair shell; a hairline that tapers needs its own mesh (Blender), and the
  beard is only the shadow: a short full beard as in the photograph would need a new painted style between `scruff`
  (too faint in grey) and `full` (far too large). The Blender (Pixar) body used by Godot and Sakura world is unchanged.
- The tap's cross head is its own node (`TapHandle`) but does not turn yet, and no water runs.
- Nothing is published: `main` is untouched.

## Rebuilding here
`python -m venv v && v/bin/pip install bpy==5.3.0 build123d`, then the CAD script, then the Blender one (`--render` takes
three minutes on a CPU). The runtime build needs the two links described in the handover of 25 November.
