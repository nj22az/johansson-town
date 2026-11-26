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

---

# Later the same day: published, then Johansson redrawn in Blender

**Published:** the restroom work above went to `main` by fast-forward (`1f2f923`), the owner: "Push to main then redesign
Johansson's hair and beard". What follows is on the branch only.

## The owner's words
"Inspect refs/me.jpg and our current avatar .blend / generation script ... shift the character from cute chibi to rugged,
sturdy, manly cartoon caricature" (the full brief: head 1.15-1.25 x as tall as wide, flat temples, a wide jaw, a squared
chin; a neck about 60% of the jaw, square shoulders, a barrel chest; a brow ridge over recessed eyes 30% smaller; a
vertical nose with a bridge and a tip that stands forward; tight buzzed horseshoe hair; a readable five-o'clock shadow
in salt and pepper; heavier, lower brows; three forehead creases, short folds from the nose, subtle crow's feet; small eye
highlights; a mouth 40% wider and flatter; chest hair in the collar; not realistic, not angry, not shrunken). Then:
"He is not supposed to be Brown, he is a Swedish man", "With dark features", "Make him in blender", "Fully rigged",
"Oh yeah this is much better", "When happy redraw Thuan in Blender too".

## What was found
The Johansson the online game draws had no `.blend`: he is generated by `src/avatars/build.js` (the ruling of 25 November).
So Blender sculpts his head and the generator wears the sculpt (AGENTS.md, 26 November). The owner's photographs were
used to look at and are not in the repository.

## Done
- **Sculpt** `tools/blender/build-johansson-head.py`: a 192 x 128 sphere displaced and smoothed in Blender, ray-cast into a
  241 x 121 table (`src/avatars/sculpts/rugged-head.js`, 78 kB), saved as `art/characters/johansson/johansson-head.blend`.
  Half-axes 0.92 x 1.12 (1.22). Six passes, each with its sheet; the last, by measurement, made the jaw the widest part.
- **Game** `head-profile.js`: form `rugged` reads the table (`shapeHeadPoint`); `build.js buildHead` uses a 120 x 84 sphere
  for a sculpted head and leans its normals less, so the relief takes the cel bands.
- **Frame** `recipe.js body.frame: 'sturdy'` (`measure`, `torsoProfile`, the neck's tube and `bodyVolume`): neck 1.95 x the
  arm's radius (about 60% of his jaw), chest 10% wider and 17% deeper, square shoulders.
- **Face** (`face.js`, all appended parts, nobody else changed): brows `strong`, mouth `dry`, `eyes.shine`, the marks
  `creases`, `nostrils`, `folds`, `finecrows`, `chesthair` (drawn in `garment.js` in the kariyushi's open collar), and the
  beard paint `shadow` on the scruff's shell at twice its size (`drawBeardShell`).
- **Hair** `build.js HORSESHOE`: redrawn in degrees with a height at every point: it rises from nothing at its edge, is
  cut round the ear, comes down as a sideburn into the shadow, and leaves the crown and the nape bare. It is every
  horseshoe wearer's (two other residents); their portraits were re-rendered with his.
- **Rig** `art/characters/johansson/johansson-rigged.blend` and `rig-report.json`: 28 bones, the skinned body, the head on
  its bone with four shape keys, toon materials. Made by `--sheet` from `tools/export-avatar-glb.mjs` (new).
- **Tools** `tools/avatar-turnaround.mjs` (new): six views of anybody's head or whole figure in the game's shader, 2 s.
- **Tests** `tests/rugged-head.test.mjs` (in the guard): proportions, jaw against temples, brow against socket, nose,
  the neck's share of the jaw, the appended parts, fair skin and dark features.

## Proved
- Guard: 121 files, 638 tests, all green (311 s). Sheets in `art/characters/johansson/review/` (Blender `contact-sheet.png`,
  the game's `game-turnaround-head.png` and `-body.png`). `tools/pixar-shots.mjs --name Johansson --cartoon` in the street: no errors.
- Not checked: a phone or a GPU browser; his head is 20 160 triangles where the others' are 1 872.

## Not done (Johansson)
- The upper neck carries no stubble tone (the neck is the body's mesh, not the shell's).
- The Blender (Pixar) Johansson of Godot and Sakura world (`nj22az/jojo`) is untouched: this session cannot reach it.

---

# Later still: Johansson leaner, Thuan redrawn, the warehouse

## The owner's words, in order
"When happy redraw Thuan in Blender too"; "Make her ear smaller and cuter"; "The blender thuan is the inspiration"; "She looks
grotesque can you use Disney art design this is real life Thuan it should look like her but a cute cartoon" (with her
photograph); "Also bring this warehouse to the island" (with a three.js storage bay of his: mezzanine, stair, racks);
"Make her look more feminine and fully rigged but still a cartoon don't be restricted by the avatar creator"; "I want her
mouth to be very expressive like Miis and eyes too"; "Ok but the eyes need to fit her"; "The wink was a wrong as you can
see"; "Oh Johansson isn't fat he should have a neck and a maybe smaller face"; "Make the head even smaller".

## Done
- **The Blender head tool is shared**: `tools/blender/head_sculpt.py` (sculpt, measure, the game's module, the sheet, the
  rigged `.blend`); `build-johansson-head.py` and `build-thuan-head.py` each define one head and call `run()`.
- **Johansson, leaner**: `head.scale` (recipe.js, 0.7 to 1.3, not a creator dial) 0.84 with size 0.3; build 0.58; the sturdy
  frame's neck is 1.9 x as long and 1.72 x the arm's radius (was 1.95), its chest 7% wider and 6% deeper (was 10% and 17%);
  the sculpt's jaw flare cut by more than half (the jaw now equals the temples), half-axes 0.90 x 1.12.
- **Thuan** (`cast.js THUAN_REDRAWN`: every value that differs from the Studio design, which is unchanged):
  head form `gentle` (a soft oval with a small round chin and a low soft nose, sculpted; the first attempt kept her
  kite-shaped head and was rejected); dark almond eyes, long and a little lifted, set wide and low; soft straight brows;
  her red lips in a small smile; a blush; fair skin; a drawn nose curve; the `graceful` frame (slim limbs, a slender neck,
  narrow sloping shoulders, a waist). Her ear, where the braids show it, is two thirds the size and sits on the head's
  surface (`build.js ears`, the braid cap's opening to match). `art/characters/thuan/`: sculpt, rigged `.blend` (28 bones,
  both braids skinned, four face shape keys), the Blender sheet, the game's turnarounds, and `review/expressions.png`,
  all 46 expressions on her.
- **The wink** (`eyes3d.js`): rigged eyes shut one of their own; the painter's wink drew a second, bigger eye as an arch.
  Everybody's wink changes.
- **The Harbour Warehouse inside** (`src/world/interiors/warehouse.js`, replacing it and `warehouse-port.js`): the owner's
  bay at the tin shed's own size (5.8 x 10.4 m, eave 4.2, ridge 5.6): concrete floor with aisle lines, block and tin
  walls, collar-tie trusses, clerestory windows, a roll-up door where the shutter is outside; a timber mezzanine at 2.6 m
  on steel columns with a guardrail and a pallet gate under a chain hoist; a steel stair of 13 risers along the east
  wall. The stair and the mezzanine are walked (`house-walk.js`). `WAREHOUSE_STOCK`: fourteen pieces, each with what, who
  and why: the quay's stores and the ledger bench, Sakura Trading's depot, the town's decorations and the festival drum
  upstairs. One light, 44 batches, 14 872 triangles. `tools/warehouse-shots.mjs` (new) photographs it in the game.
- `tools/avatar-turnaround.mjs`: `--views`, `--set path=value;...` (try a recipe without editing it), `--expressions`.

- **Johansson's expressions** (the owner: "Give the expressions to Johansson as well"): all 46 checked on his face,
  `art/characters/johansson/review/expressions.png`. His forehead creases now ride up with the brows and close together
  (`face.js drawFaceMarks`, the `creases` mark): lifted brows used to cover them.
- **Three tests' assumptions updated**: `floor-sit` builds its generic bodies on the standard frame (it borrowed Thuan's
  recipe and so her graceful frame); `eyes3d` expects the rigged eyes to draw a wink; `pair-poses` lets a braid, which
  hangs on springs, lie against the other body as a mitten does (16 mm, was 6).

## Proved
- `tests/warehouse-port.test.mjs` (4), `tests/rugged-head.test.mjs` (8, with Thuan's), `tests/thuan-studio-design.test.mjs`.
- Guard: 122 files, 645 tests, all green (535 s), before the creases' change; after it the face, eye, sitting, pair and
  portrait tests were run again and pass. `tools/warehouse-shots.mjs --source`: no page errors, the player
  stood half way up the stair (y 1.3) and on the mezzanine (y 2.6); photographs in `art/warehouse/review/`.
- Not checked: a phone or a GPU browser.

## Not done
- The warehouse's outside is unchanged; its clerestory windows and roll-up door are not drawn on the outside wall.
- Thuan's Blender (Pixar) body for Godot and Sakura world is untouched (`nj22az/jojo`, not reachable here).
- The owner's and Thuan's photographs are not in the repository (it is public).
