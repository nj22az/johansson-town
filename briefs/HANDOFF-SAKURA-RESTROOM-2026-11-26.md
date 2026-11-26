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

---

# Last: published, then the modular body kit

**Published:** everything above went to `main` by fast-forward (`bec637b`), the owner: "Yes". What follows is on the branch only.

## The owner's words
"can you redraw Johansson and Thuan's body's in blender too? And arms and legs? The shoes shouldn't be fused on their feet they
should be rigged so you can wear different shoes, these bodies needs to ve modular so we can reuse them for all characters";
"Make her look more feminine and cute in the body too but still cartoon"; "But look at the body she still has a barrel for
hips she needs to look cute use Disney audit".

## Done
- **`tools/blender/build-body-kit.py`** -> `src/avatars/sculpts/body-kit.js` and `art/characters/body-kit/body-kit.blend`:
  one kit, worn by every resident through the generator.
  - `LIMBS`: an arm and a leg for the standard, sturdy and graceful frames: thickness along and round the limb as a share
    of the old taper, never over 1 (so every sleeve, trouser leg and pose still fits). Elbow, forearm, wrist; knee, calf
    behind, shin in front, ankle. Bare arms and legs wear it (`build.js limb` `shape`); a long sleeve or a trouser leg is
    cloth and stays straight. **What is sat on is untouched**: the back of the thigh and the hip end are the taper's own
    (a first kit thinned them and sat everybody 7 mm into the floor: `seat-support.js` seats a body on them).
  - `TORSO`: the sturdy frame's shoulders, and the graceful frame's whole line, hips to neck, as one soft curve.
  - `FEET`: one mesh layout (242 points, 480 triangles) in five shapes: bare foot, sneaker, leather shoe, boot's foot,
    slipper, with a zone per point (upper, sole, toe cap, collar) along the mesh's own lines.
- **Shoes are worn** (`build.js`): a shoe is a kit shape laid in the box the old ellipsoid filled. `avatar.wearShoes(kind,
  {colour, side})` writes another shape into the same points on a finished body; `setShoe(side,false)` shows the kit's
  foot in its sock; `shoeWorn(side)`; `SHOE_SHAPES`. No extra draw call. Barefoot and sandalled bodies get the kit's bare
  foot (heel, arch, toes); the sandal's strap lies on its instep.
- **Thuan's figure** (the graceful frame): hips 1.03 of her width (were 1.24 on a straight band: the "barrel"), depth 0.84,
  a waist at 0.68, legs half of her body's height (were 0.47), slim limbs.
- `tools/avatar-turnaround.mjs`: `--feet`, `--focus height,distance`.

## Proved
- Guard: 123 files, 649 tests, all green (557 s), with the new `tests/body-kit.test.mjs` (4).
- One pose check loosened: in `pair-poses`, a hugging mitten must lie on the partner's near side by 0.35 of the way to
  the shoulder joint (was 0.5); with slimmer arms a boy's mitten on a small child lay 11 mm nearer her middle.
- Sheets: `art/characters/*/review/` (`game-turnaround-body.png`, `game-legs-and-feet.png`, Thuan's `game-figure.png`),
  and both rigged `.blend` files regenerated. Not checked: a phone or a GPU browser.

## Not done
- **The torso is still turned on a lathe** (one line, the same front, back and sides), and hands are still mittens: the
  kit shapes the limbs, the line and the feet, not yet a sculpted chest, back or hand.
- Somebody built barefoot or in sandals cannot be given shoes at run time (their foot has no shoe range); it takes their
  recipe. Boots' shafts are still a separate piece built with the body, so `wearShoes('boots')` gives the foot only.
- Nothing in the game calls `wearShoes` yet: no shop sells shoes and the creator's footwear list is as it was.
- Trouser legs and long sleeves are not shaped.

---

# Last of the day: published, Vy and Tetsuo, the sweep, the cast in Blender

**Published:** the body kit went to `main` by fast-forward (`a0e9ed7`), the owner: "Push to main , then rework Vy , and Tetsuo
give them expressions and fully rigged in blender". What follows is on the branch only.

## The owner's words, in order
"What's the next recommended character to tackle"; "Can you do all of them in a sweep but keep their personalities"; with a
photograph, "This is the real Vy can you make cartoon Vy look more like her ? Sculpt in blender from clay"; "Her head doesn't
have to look like a balloon make her cute"; "Make her face more unique she shouldn't be a clone of Thuan"; "Draw in blender";
"Disregard the avatar creator it's only for prototype"; "Have full artistic freedom creating her"; "She needs to be cute like
the real Vy"; "Vy needs a cute nose"; "I want everyone to be remodelled in blender so they are fully rigged and look like 2d
characters from a cartoon in 3d"; "The clothes need to be rigged too"; "And all hairstyles"; "Vy needs to look cuter but still
like a cartoon aim to replicate her"; "The photo of Vy is what her face should look like but more like a cute gorgeous
cartoon"; "How would Disney draw her ? Or Tomodachi life work towards this"; "A gorgeous young lady with a lovable appearance".

## Done
- **Tetsuo**: head form `lean` sculpted in Blender (`tools/blender/build-tetsuo-head.py`): long and narrow, cheekbones over
  hollow cheeks, a long hooked nose his half-glasses sit on; deep-set eyes, straight grey brows, creases; a paler skin and
  a leaner build. `art/characters/tetsuo/`.
- **Vy**, from her photograph (seven passes; `tools/blender/build-vy-head.py`, `art/characters/vy/`):
  head form `child`, a heart-shaped oval with a small round chin, head scale 0.84 (not a balloon); hair style `softbob`,
  **sculpted in Blender** as a shell over the head (new `head_sculpt.py hair_shell`, `src/avatars/sculpts/softbob-hair.js`):
  a chin-length ash-brown bob with soft bangs swept to her left and a gloss band; the sculpt shown as clay
  (`review/clay.png`). Parts drawn for her because the creator has none ("disregard the avatar creator"): eyes `dewy`
  (`eyes3d.js`: a big warm iris under a calm lid, lashes), lips `bud` (`face.js`), the kit's `snub` nose, her mole.
  No feature's style is shared with Thuan (tested).
- **The sweep**: `NOSES` in the Blender body kit: a sculpted nose for each nose style (button, snub, bulb, wide, hook,
  pointed, ridge, and a soft one for the drawn dots and line). `build.js kitNose` lays it on anybody's face in place of the
  ball they had. Everybody keeps their head, eyes, hair, glasses and clothes. A sculpted head with its own nose wears none.
- **The cast in Blender**: `tools/blender/rig-cast.py` exports each of the 23 residents from the generator and makes a
  Blender character: the 28-bone armature, the body welded and separated into its skinned pieces (34 to 78 each: torso
  and clothes, sleeves, hems, limbs, hands, feet, shoes, hair), the head on its bone with four face shape keys, toon
  materials and ink. `art/characters/cast/blender-cast-sheet.png`, `rigged-cast.json`; the 23 `.blend` files (32 MB) are
  written to `output/rigged-cast/` and are not in the repository.
- `tools/avatar-turnaround.mjs --cast`: every resident's face on one sheet in the game's shader (`cast-sheet.png`).

## Proved
- Guard: 124 files, 654 tests, all green (568 s), with `tests/sculpted-cast.test.mjs` (new) and the noses in
  `tests/body-kit.test.mjs`. Not checked: a phone or a GPU browser.
- Pose checks changed for Vy's new proportions and hair (`tests/pair-poses.test.mjs`): a hugging mitten may rest on the top
  of her chest (her bob hangs over the near shoulder), and backs may stand 35 mm apart back to back (was 30).
  `tests/vy-reference.test.mjs` tests the long hair with a fringe on a recipe that wears it, since she no longer does.

## Not done: what "remodelled in Blender" still means
- The 23 Blender characters are the generator's geometry taken into Blender and rigged there. **Hand-made in Blender so far
  are**: four heads (Johansson, Thuan, Tetsuo, Vy), one hairstyle (Vy's bob), and the kit (limbs, torso lines, feet, shoes,
  noses). The other 19 heads, the other 23 hairstyles and all the clothes are still the generator's own shapes.
- The modular way on: a **hair kit** (each of the 24 styles sculpted with `hair_shell`, long ones with their spring bones)
  and a **clothes kit** (each top and bottom a sculpted shell skinned to the rig), then the remaining heads, family by
  family. Thao, Chin and Nhung next: they are Thuan's sisters and Vy's parents, and should look related.
- Vy's fringe covers her brows; her painted brows show only when they lift.

# After that: Thao, three renamings from photographs, and three faults seen on the owner's phone

Not on `main`: on `claude/dreamy-ritchie-cxufpl`, waiting for the owner's word.

## The owner's words, in order
- "This is Thao but cartoon Thao should wear short pants" (her photograph)
- "This is Mrs Higa who should be renamed to Christina and she should not have a wheelchair" (her photograph)
- "This is Mac who should be renamed Erik" (his photograph)
- "This is the harbour master Sverker" (his photograph)
- "Why does Vy have lines on her legs no one should have it in any shader" (a phone screenshot, Vy's own look)
- "Johansson's face??" (a phone screenshot, from the game's high camera)

## Done
- **Thao**: `tools/blender/build-thao-head.py` sculpts her head (form `serene`: a long oval, a high forehead, a round chin)
  and her hair (`tiedback`: off the forehead, cut round the ears, which show, a round low bun). `cast.js`: the graceful
  frame, a yellow tee, cream **shorts**, pale sneakers; narrow dark eyes, tapered brows, a closed smile, gold studs.
- **Christina, Erik, Sverker** (were Gran Higa / Grandmother Higa, Mac, Jack / Harbour master). One sweep over `src`,
  `tests`, `tools`, `guide`, the generated guide and catalogues (158 files); `roster.js` keeps the old names as `was`,
  the ids stay. Portrait and shoot files renamed with them. Each has a Blender head: `kindly` (round and soft), `burly`
  (broad, a heavy bearded jaw), `broad` (wider than tall, jowls); Christina's `softwave` and Sverker's `sweptmop` hair
  are sculpted too. Christina: white hair, the navy spotted dress, a white pendant for her pearls, no glasses, no
  wheelchair. Erik: a painted full grey beard, his olive cap, a blue **checked** shirt (a new top pattern, `check`,
  appended and not dealt by the dice). Sverker: white-blond hair and no cap over it, a grey-blue cardigan, and a new body
  frame, **`stout`** (`build.js measure`): a belly that is the widest of him, deeper than wide, on thicker limbs.
- **Lines down bare legs** (every look that draws from the normals): the kit limb joined its lathe seam on the wrong
  points (`build.js limb`). Fixed, with a test on Vy's legs.
- **The mark on a bald crown**: the sculpts' pieces are written by angle round the head and met at the crown in a crease.
  `head_sculpt.fair_poles` fades them out toward both poles; all sculpted heads were rebuilt. The head sphere's own crown,
  chin and seam now share one normal each as well.
- **The phone showed an old Johansson**: the player's look is saved on the device (`actors.js playerRecipe`), and a
  resident's if it was edited (`wardrobe.js`). `APPEARANCE_REVISIONS` (Johansson, Thuan, Tetsuo, Thao 1; Vy 2) makes each
  redrawn character replace the saved copy once; later edits are kept.
- **Hats on sculpted hair** never worked (the kerchief threw, the police cap and headband were NaN): `head-cover.js
  headReach`, `build.js hairReach` and the headband now read a sculpted style's own field and height.
  `avatar-wardrobe.test.mjs` is in the guard now.
- **A hand in the house dress**: sitting on the floor, the hand-rest counted only a skirt's cloth on the lap, not the
  wrapped house dress; a slim body whose hands reach its thighs laid them 2 cm in the cloth (`animate.js floorShape`).
- `tools/avatar-turnaround.mjs` has the views `game` and `game front` (the game's high camera).

## Proved
- `tests/sculpted-cast.test.mjs` (Thao; the three renamed), `body-kit.test.mjs` (the seam), `avatar-wardrobe.test.mjs`
  (redrawn looks adopted once; every hairstyle under every hat). The 49 test files that name the three people were run
  before the renaming, in a clean copy, and after: nothing passes before that fails after.
- Sheets in `art/characters/{thao,christina,erik,sverker}/review/` (Blender contact sheet, game turnarounds from eye level
  and from the game's camera, the body, every expression); `art/characters/cast/christina-erik-sverker.png`.
- Software Chromium only: no phone, no GPU.

## Not done, and questions for the owner
- **Their stories were not changed.** Sverker's surname is still Reed and Erik's Turner, both are recorded as Americans
  (Seattle; Oregon), Christina is recorded as Japanese and is Yui Higa's grandmother, and Kissa Higa keeps its name. If
  they should be Swedes, or related to Johansson, the owner has to say so: `roster.js`, `people/cast.js`,
  `guide/residents.json`.
- Sverker no longer wears the harbour master's cap or navy jacket, nor Erik his boiler suit: they wear what the photographs
  show. Nothing gives them work clothes on duty.
- Christina's shawl is not drawn (no such garment), and her pearls are a white pendant on a fine chain.
- Erik's cap sits low and hides his brows from eye level and his face from the game's camera, as any cap does.
- From the game's high camera Johansson's sculpted nose still draws heavily; his face was made at eye level.
- `stout` has no kit torso line of its own (it is the standard shoulders over a belly), and is tried on Sverker only.
- Historical documents (`docs/`, `briefs/`, dated notes in `AGENTS.md`) keep the old names.
- Still owed from "everyone remodelled in Blender": the other heads (Chin and Nhung next), the remaining hairstyles, the
  clothes, a sculpted torso and hands.

# Then: their heads again, their eyes, their bodies, feet and hands, all in Blender

Not on `main`. The owner asked (a phone screenshot of the live game) "Why isn't Johansson's new face in the game": the
live game is `main`, his phone holds a saved copy of the old look, and the fix (`APPEARANCE_REVISIONS`, above) is only on
`claude/dreamy-ritchie-cxufpl` until he says to publish.

## The owner's words, in order
- "Christina needs to look like an adorable elderly woman not like a man, redraw all their heads they need to be drawn in
  Blender"
- "Then after their bodies and feet"
- "Their eyes too no need avatar creator eyes draw the characters in blender I have said it many times"
- "Why isn't Johansson's new face in the game"
- "Omg they have mitten hands"

## Done
- **Heads with their features in the mesh.** Christina (`kindly`): apple cheeks standing out of the face, the fold round
  each, a small round nose, a little chin; her hair (`softwave`) is set curls, lobes with valleys between, curled on to
  the forehead and down over the ears. Erik (`burly`): a brow ridge, a big round nose with wings, cheeks pushed up, and
  the mass of his beard (jaw, chin, moustache) for the painted beard to lie on. Sverker (`broad`): heavy jowls, a second
  chin, a broad soft nose, lids with weight. Their noses are the sculpts' own now (`nose:'none'` or the drawn line).
- **Eyes drawn with the head** (`head_sculpt.py eye_curves`, `EYE` in each script; Thao, Christina, Erik, Sverker): lids,
  iris and pupil as curves on the sculpt, in the `.blend` and on the clay sheet; their numbers are written into the head's
  module (`eye:`) and are the whole open shape of the game's eye (`eyes3d.js eyeShape(…, drawn)`), which still blinks,
  looks and takes every expression; the painter draws the same eye on baked faces (`face.js paintedEyes`). Recipe:
  `eyes.style:'drawn'`. Johansson, Thuan, Tetsuo and Vy still have the eyes the owner approved earlier, which are styles
  (`heavy`, `almond`, `sleepy`, `dewy`): to be moved to their own heads the same way.
- **Bodies** (`build-body-kit.py`): two more frames, each a whole torso line and limbs of its own: `stout` (Sverker, Erik:
  the belly the widest of him) and `soft` (Christina: narrow rounded shoulders, a slight neck, round hips).
- **Feet**: two more shoe shapes in the kit's one layout: `court` (cut low, the instep showing, a small heel) worn as
  `shoes` on the soft frame, `broad` (wide, a toe cap) on the stout one (`build.js shoeShapeFor`).
- **Hands: not done.** Two modelled hands were tried and both were rejected by the owner ("Draw the hand properly not
  like a balloon with sausages on it"; "The hands look awful, make them Disney quality"). Everybody still has the mitten.
  See "Not done" below.
- **Two pose faults the soft frame showed up** (the guard): seated, Christina's mitten lay 5.5 mm in her long skirt (the
  soft frame was 4 % deeper than the standard; now it is not); and in the Hug, Mai's arm (a child's) could not reach round
  Christina's back from beside her (2 cm short at the hug's comfortable 90 % stretch), so her hand had always rested on
  Christina's flank, 2.03 cm behind her middle against a 2 cm check: passing by a third of a millimetre. The hug now lets
  an arm that cannot reach round at 90 % use its whole reach (`pair-poses.js fitHug`): Mai's hand is 5.8 cm round
  Christina's back, and every other pair is as it was.

## Proved
- `tests/sculpted-cast.test.mjs` (eyes, the women's cues, noses in the mesh, frames, shoes), `pair-poses`, `seated-pose`,
  `floor-sit` and the guard.
- Sheets: `art/characters/{thao,christina,erik,sverker}/review/` now also `game-feet.png`.

## Not done
- **The hands** (the owner: "Omg they have mitten hands", then "make them Disney quality"). What was learned:
  - `tools/blender/hand_model.py` is the second try (a flat palm, jointed tapered fingers, a thumb, one voxel-remeshed
    skin, about 1,300 points). It is not worn. The owner called it awful: it is anatomically a hand but has no appeal:
    no rhythm in the fingers, no fleshy pads, a mechanical palm. A Disney hand is designed, not assembled: a clear
    silhouette, fingers that taper and fan with the little finger leading the curl, a soft square palm, a thumb with a
    real base, and it is drawn in poses (relaxed, pointing, open, gripping), not one frozen shape.
  - **Every pose is made to the mitten's volume** (an ellipsoid of half-sizes 0.9 x 1.15 x 0.78 hand lengths, its middle
    0.55 below the wrist, its top up inside the forearm): `animate.js TOUCH` and `reachFor`, the lap rests, `pair-poses.js`,
    and the tests `seated-pose`, `floor-sit`, `pair-poses` measure the drawn hand. A hand that is longer, wider or
    thicker than the mitten goes into clothes; one that is thinner floats off what it rests on (measured: 7 to 25 mm
    into cloth, 32 to 62 mm off a chest in Fight and Shove). So the hand and the poses have to be done together: the
    solver's envelope made the hand's (there is already a thin-hand path for Pixar bodies, `want.flat`), then the tests'
    numbers re-derived.
  - The forearm ends in a round cap that hid the top of a hand placed where the mitten was: a hand needs a wrist (the
    kit arm tapered into it), and long sleeves' cuffs end at the mitten's top.
- **Z-fighting** (the owner, with two screenshots from the ferry: "Lots of z fighting I thought we eliminated it", "no z
  fighting allowed"): done in two helpers' branches, both merged here. Details: `briefs/HANDOFF-ZFIGHT-FERRY-2026-11-26.md`
  and `briefs/HANDOFF-ZFIGHT-TOWN-2026-11-26.md`.
  - Ferry: the engine-room door's hazard stripes lay in the deck vinyl's top plane (now on top of it); the banding on the
    white walls was shadow acne, a fixed normal bias that halved in texels on the iPad's smaller shadow map
    (`render/sun-shadow.js` now holds it in texels; desktop unchanged); the Kikkou ID pass now keeps a decal's polygon
    offset. `tools/flicker-audit.mjs` measures flicker by nudging the camera and the shadow map: at the door, 260 unstable
    pixels in 10,000 before, 0.15 after.
  - Town: 23 rooms had never been scanned; a near-coplanar check with a threshold from the depth buffer
    (`tools/near-coplanar.mjs`, `tests/near-coplanar.test.mjs`, which holds each room to its count) found 423 pairs over
    85.5 m², 316 over 19.1 m² after the fixes. The remaining rooms and the streets' signs are 12 self-contained tasks
    in the town handover, written so Codex can take them.
  - Left: the engine room's Blender model has coplanar faces inside its GLB (no test scans it); Umi-no-yu, the school,
    the workshops, the port terminal and Minato's streets are untouched. Nothing was measured on an Apple GPU.
  - `tests/ferry-engine-room-access.test.mjs` fails its ladder-width check on the published `main` too (not today's).
- The `court` and `broad` shoes are fitted by frame, not chosen: the wardrobe has no entry for them.
- The resident photo shoots (`assets/images/residents/shoot/`) and the Blender cast sheet (`tools/blender/rig-cast.py`)
  were rendered before the hands changed, except the four people of this section's.
