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

# Then: the hands, worn, and every pose remade to them (branch `hands/kit`)

Merged into `claude/dreamy-ritchie-cxufpl` (0fc7bea); the runtime and the residents' portraits rebuilt with it (97e42f6).
Not on `main`. The owner: "Omg they have mitten hands"; of a palm of spheres with spheres for fingers, "Draw the hand
properly not like a balloon with sausages on it"; of a lumpy anatomical one, "The hands look awful, make them Disney
quality". The owner has not yet seen this hand worn.

## Done
- **The hand** is the body kit's (`tools/blender/hand_model.py`: a palm block tapering to the wrist, four fingers extruded
  in three joints with a fan and a curl, a thumb grown from the palm's side, subdivision surface; 2,210 points a side),
  worn by everybody in place of the mitten (`build.js kitHandGeometry`). The mitten's four capsule fingers, opened only
  for an export, are gone (`setOpenHands` is kept, and does nothing).
- **A closed hand of the same points** (`hand_model.GRIP`: every finger curled at its three joints, the thumb across the
  forefinger; checked in Blender to leave the skin clear of itself), exported as `HANDS.grip` with the knuckle line.
  `avatar.grip(side, 0..1)` writes between the resting and the closed hand in every body the avatar wears (clothes,
  swimwear, the bath's), as a shoe is worn; `gripOf(side)`. The animator closes it once a frame: a move's fists
  (`FISTS` in animate.js, `grip` on a fun pose, a pair role's `grip`), what is held (consume.js `heldGrip`: round a
  handle's bar all the way, round a glass's body as far as its curve lets the fingers come), an umbrella, a tool, a
  steering wheel, the handlebars, the torch, the paper's edges, and a performance's own wish (`avatar.handHeld`, the
  table drink, eased in as the hand reaches and out as it lets go).
- **One contact shape, measured from the kit** (`build.js HAND`, and `HAND.fist` for the closed hand): the envelope (30
  points of the drawn surface: five bands, every fingertip, the thumb's tip), the palm's middle (half way from the wrist
  to the knuckles: where a reach puts the hand), the flat's ellipsoid (the tests' and the pair poses' core), `lie` (how far
  a laid hand's middle stands off what it rests on), `reach`, the palm's way, and the closed hand's hollow (`hold`).
  `handShape(m)` gives it (the mitten's, `MITTEN`, for a Pixar body, whose poses were made to it); `handOff(m, extra)`,
  `handHold(m, radius)`, `handleAt(m, side, radius)`. Nothing reads 0.55 or 0.9 of a hand any more: every offset that
  was "a mitten's thickness off the surface" is the hand's `lie` and the same few millimetres it had over the mitten's.
- **The reach solver** (`animate.js reachFor`): the hand's envelope; the palm turned to what it is laid on (`palm`: 'in',
  'out', or a way of the move's own), by the forearm's twist and the wrist within what a wrist does (`PALM`), after the
  arm has found the place, then the arm brought back to it; a hand laid on the partner kept on them where its place is out
  of reach (`CONTACT`), and a hand laid on the face or the hair on it the same way (`cover`; a palm laid there placed as far
  off it as the hand's `lie`, not the mitten's); every fingertip and the wrist end kept out of what the hand lies on,
  including the cloth on a lap as it is drawn (`seatedScan groundAt`, `underCloth`: a height field and the drape, both
  over the thigh's own line, which rises to the knees on the floor: over the hips' height alone, Miss Higa's house dress at
  her knees was left out and her hands went into it); the fingers of a hand on the lap along the thigh (`fingers`); and a
  side that is the other's mirror ends as its mirror (each arm is solved on its own, and an elder's arms found one hand on
  the top of the thigh and the other down its outer side: each is now tried from the other's, the better kept for both).
- **Palms turned to what they touch**: the shove (palms on the chest), the fight (fists on the collar: `fist`, the closed
  hand's envelope and lie), the hug (the hand over the partner's shoulder palm to it, the hand on the back), arms folded
  (Huff, BackToBack), hands on the hips and the back, the lap (chair, bench, floor, beside the hips), the face (JawDrop,
  Facepalm, HideFace, OhNo; the back of the hand to the brow in Swoon), carrying under a load.
- **Held things**: the drink against the palm or its handle's bar in the fist (`drinkGrip`), the mug at the table clear
  of the closed hand's curled fingers (`tableGrip`), the bar work (`work-hands.js`), the umbrella, the torch, the tester
  and the paper in the closed hand's hollow; the steering wheel's rim at nine and three, the bicycle's rubber grips, and
  Mr Fujita's glass and bottle as he pours (`port-shed.js holdRound`: across the hand, the palm against it, the wrist
  straight where the arm allows) in it too, where the mitten's wrist or middle went; the rubber gloves' thumb where the
  hand's thumb is. A Pixar body keeps the mitten's ways in all of these.
- **Tools**: `tools/hand-shots.mjs` (the hand at rest from six sides, `--grip`, `--pairs`, `--poses`, `--sit`, `--hold`,
  `--drive`, `--ride`), in the game's own shader.
- **Tests**: `body-kit.test.mjs` "the hand is a hand" (four fingers and a thumb, one closed skin with no hole, within its
  2,210 points, worn on both wrists, the right the left's mirror, the envelope on its surface, it closes and opens again).
  Tests that encoded the mitten now read the hand's shape, with the reason beside them: `body-contact.mjs` (a body's core:
  the hand's ellipsoid, closed when the hand is), `pair-poses.test.mjs` (the hand's middle), `izakaya-bar` and
  `izakaya-food` (where a held thing sits: drinkGrip from the hand's hold), `fujitas-back-moves` (the paper's edges in the
  closed hand's hollow, `handleAt`, not the mitten's middle, which is inside the hand's palm), `driver-grip` and
  `bicycle-rider` (the hollow on the rim, on the grip's line). No threshold was loosened.

## Proved (26 November 2026, the branch's last commit)
- `node tools/ci-guard.mjs`: 125 files, 667 tests, 665 pass, 2 fail, both expected on a branch that changes the avatars
  without rebuilding what is published from them: `resident-guide` ("Portraits must be regenerated after avatar source
  changes") and `runtime-package` ("Run npm run build:runtime with every source change"). Neither was rebuilt here.
- Outside the guard: `body-kit` 7/7, `driver-grip` 1/1, `bicycle-rider` 3/3, `seated-pose` and `pixar-seated-hands` 3/3,
  `floor-sit` 7/7 (in the guard too; 160 s, was over 900), `pair-poses` (in the guard).
- `fujitas-back-moves` 21/22: CarriedPlank fails (Nhung's left hand 9.0 mm into his underside, 8 allowed: her thumb's tip,
  under a load the hand's top), as it failed before the hands. `port-shed` 2/3: "Both shoes rest on the timber
  footstool" fails the same at e4cdcdc, before the hands.
- `fun-poses` 1/4, against 2/4 before the hands (e4cdcdc): in nothing, Huff on the elder round body 24 mm into the body
  (before: Huff on three round bodies, up to 35 mm); the hands on the head, HideFace on Mr Fujita 52 mm from his face
  (50 allowed: the hand lies on his glasses, which the test does not count as his head); smoothly, Facepalm on the round
  adult turns the right shoulder 0.18 rad in a frame (0.15 allowed: the kit's hand laid flat on the face finds a shoulder
  turned round to -3.4 rad, 2.5 rad from the move's seed, and lets go the long way; a first stage that placed the arm as the
  mitten did first was tried and left the hands 35 to 50 mm off the face). Salute's jerk, failing before, passes.
- Looked at: `art/characters/body-kit/review/` (rest, closed, poses, pairs, sit, hold, drive, ride; the game's shader).

- After the merge, on 97e42f6 in a fresh checkout: `node tools/ci-guard.mjs`, 129 files, 692 tests, all green in 462 s
  (the z-fighting tests and the rebuilt runtime and portraits included).

## Remains
- The owner has not seen the hand worn. Show the owner the review sheets before this goes to `main`. The runtime and the
  portraits are rebuilt (97e42f6); the resident photo shoots and the Blender cast sheet are not.
- The Hug's free hands and the `Peace` move (moves.js: "Hand by the cheek", played by four personalities) were drawn as
  peace signs on a mitten. With two shapes the kit's open hand lies by the cheek and reads as a hand holding its own head
  (`hands-pairs.jpg`, Hug). A peace sign (index and middle up, the rest closed) is the first third shape to add.
- Facepalm's shoulder on the round adult (above): a stage that keeps the shoulder's twist where the seed has it while the
  palm is turned is the likely fix. HideFace on Mr Fujita: count his glasses in the test's head, or lay the hand on the face
  past them (it should not: they are in front of his eyes).
- Mr Fujita pouring: his left wrist bends 42 degrees round the bottle, and his left forearm is 14 mm into his belly as it was
  with the mitten (16).
- The hand has two shapes, resting and closed, blended straight between them: no pointing finger, no thumb up, no peace
  sign; the blend between was not checked for the fingers passing through one another.
- A Pixar body keeps the mitten's measures (`MITTEN`, `m.realHand`) everywhere.

# 27 November: a bought can in his hand, opened before it is drunk

The owner, of the hands: "These hands are near perfect but are they rigged? Can they still drink beer or anything from the
vending machines?"; then "A can needs to be opened also, removing the tab". Not on `main`.

## What was found
- The hand is skinned to the hand bone (it follows the arm everywhere) and closes by blending between two shapes drawn in
  Blender (open, closed: `avatar.grip`). It has no finger bones: no finger moves on its own.
- Residents and the player at the izakaya and the ramen counter held their drinks. A can from a machine or from Sakura,
  drunk with R in the third-person view, was not in his hand at all: he played the drink with an empty hand, and the can
  was drawn only in front of the first-person camera (`interact/hands.js`). That was so before the hands.

## Done
- `src/commerce/bought-can.js`: the can he bought, built on the izakaya's can (whose grip, rim and tilt the hand is fitted
  to), printed as what was bought: a machine's own print (`world/vending.js vendingCanTexture`, from `paintCan`) at its
  column's size (the 190 g coffee and corn soup smaller, the grip and rim measured to it), Sakura's Umineko in its shelf
  label from the packaging atlas.
- Sold sealed (`izakaya-serving-visuals.js`, `sealed`): a ring-pull tab whose tongue covers the opening, and the opening,
  each its own part, centred on the lid's plane (JSY-STD-403).
- `src/avatars/open-can.js` and the `OpenCan` move (`animate.js`): the can held up in front of his chest a little right
  of his middle; the left hand's hollow to the ring, the fingers closed on it (0.8), the ring lifted about the tongue's
  front end, the tab torn off whole into the hand, the opening shown, the tab carried to the shirt's chest pocket on the
  left (`story-props.js pocketSpot`) and put away, the hand back; then the drink, then the empty can put away
  (`actors.js drinkBought`). Another move before it is open opens it all the same and puts it away.
- `game.js` (R in the third-person view) drinks a bought can by `drinkBought`; the audit can `buy(name)` (as a machine's
  pocket gives it) and report what he `held`. `tools/vending-drink-shots.mjs` photographs it all in the running game.

# 27 November, later: the drink animated in Blender (branch `drink/can`)

The owner: "He is holding the can very weird, can you research how others did this? Drinking needs to be impeccable Disney
animation standard"; then "You need to animate the beer drinking in blender and bring it to the game after, the rigging
might need improvement". On `drink/can` (from `claude/dreamy-ritchie-cxufpl`), not pushed, not on `main`.

## Done
- The hands (`tools/blender/hand_model.py`, `build-body-kit.py`): a WRAP shape round a 66 mm can (the fingers' pads on its
  side, the thumb across) on the closure from rest to fist (`HAND.wrapAt`), and a HOOK shape (the forefinger crooked
  under a ring, the others easy), all built on the rest cage's own topology; `avatar.grip(side, amount, shape)`.
- The socket (`consume.js canSocket`, `socketHold`): the can's axis along the knuckle line, the palm on it.
- The rig (`tools/blender/drink-can.py`): the game's 28 bones from `export-avatar-glb`, arm IK with poles, a `look`
  target, `socket.R` and `hook.L` bones, the hand shapes as shape keys driven by custom properties, the can and its tab as
  objects. No finger bones (three shapes do what the hand does here; finger bones would take every body from 28 bones to
  58). Fixed today: the left IK's pole angle was half a turn out (its elbow went into his chest; now measured: R 0, L 180
  degrees); the upper arm's roll settled at the bake (the elbow bends about its x, no roll where the arm is straight); the
  poles the wrist limits ask for eased into one another; the wrist limits in the game's Euler order (Blender ZYX); the
  left hand at rest bent as the game's arm hangs; the releases from the lip slowed (the first 0.25 s, the second 0.3 s).
- The performance, keyed pose to pose at 30 fps: the opening out in front at the lower chest (forefinger under the ring,
  lift, tear, the tab to the shirt pocket), the drink in two pulls with a breath between, the settle; a sip for residents.
- The export: `src/avatars/motions/drink-can.js`, johansson-motion v2 (`motion.js normalizeMotion`: shapes, face, prop,
  contacts, fill, events, markers, reach paths); `tests/drink-can.verify.json` for the round trip.
- The game (`src/avatars/drink-can.js`, `animate.js` DrinkCan/DrinkCanOpened, `actors.js drinkBought`, `open-can.js`): the
  motion over the animator's pose, blended in and out against the motion's own full pose (the shoulder no longer turns over
  in the blend); each wrist from the chest in the body's size, the rim to this body's lower lip, the hook to the ring, the
  tab to this body's pocket; the elbow way remembered per contact and turned only as far as the contact is on.

## Proved
- `node --test tests/drink-can.test.mjs tests/open-can.test.mjs`: 14 pass (new: nothing pops, every body: no joint turns
  more than 0.3 rad between frames at 60 fps, the can never moves 30 mm in one; the worst now 0.29 rad and 29 mm).
- Blender: rim to lip at contact max 4.9 mm, mean 1.4 mm over 113 frames; hook to ring max 3.5 mm; right wrist within its
  limits, left 0.08 rad past them at the pocket in Blender's own measure (within them in the game).
- In the game, seven bodies standing and seated: the rim on the lower lip 0.0 mm at every contact frame; the arm put right
  for the lip by up to 23 mm, the ring by up to 9 mm, the wrists from the chest by up to 79 mm (Thao), Johansson 2 mm.
- Sheets: `art/characters/body-kit/review/drink-can-{front,three-quarter,side,opening}.jpg` (Blender),
  `drink-can-game-johansson.jpg`, `drink-can-game-thao-seated.jpg` (the game, `tools/hand-shots.mjs --can`).
- CI guard (`node tools/ci-guard.mjs`): 704 of 706 pass; the two that fail are the known ones (resident-guide portraits, the
  published runtime package, which is not rebuilt on a branch).

## Remains
- The owner has not seen any of it.
- At the pocket the motion's hooked fingertip is 6.6 cm off the pocket on Johansson himself (up to 10.7 cm on others): the
  game's pocket hold puts it there. Re-key the pocket in Blender so it lands there.
- Seen from the front, the forearm crosses his face while he drinks (from his right, the can to the middle of the mouth).
- The can's speed peaks (29 mm a frame) in the blend in, from where the animator held it.
- Residents sip the same motion at 1.25 times its speed; glasses and bottles sit in the socket but still drink by the old
  consumption path; the 190 g can is held and drunk as the 350 ml one is.
- The swallow is a chin dip, not a throat; the Blender can is a stand-in in its materials.

# 27 November, evening: the animation guideline, adopted strictly

The owner: "https://github.com/dylantarre/animation-principles use this as the guidelines for animating Johansson world
make strict adherence to it".

## Done
- The guideline is in the repository at the owner's commit (`docs/animation-principles/`, MIT, unchanged; `VENDORED.md`).
- How it applies here: `docs/ANIMATION-STANDARD.md`. It covers:
  - which skills govern which work;
  - the two registers (everyday calm and friendly, comedy playful) with the guideline's numbers;
  - the twelve principles as rules at 60 fps and 30 fps;
  - the camera and the screens;
  - making, reviewing and checking a move.
- The rule is in `AGENTS.md` (a new owner's decision at the top), `CLAUDE.md`, and a project skill
  (`.claude/skills/animation-standard`) that loads it. In the site repository it is in `ANIMATION_DIRECTION.md`,
  `CLAUDE.md`, `AGENTS.md` and `HANDOVER.md`.
- The can drink's re-key in Blender (the helper on `drink/can`) was given the standard's numbers for every beat.
- The torn tab hung half a metre from the fingers (fixed earlier today in 75c31b7).

## Remains
- **The principles audit** (`tools/animation-audit.mjs`, `tests/animation-principles.test.mjs`) and its first baseline
  (`tests/animation-principles.baseline.json`), as the standard's section 5 describes. The baseline may only shrink.
- **Bringing the existing moves up to the standard**, the most-seen first: walk, idle, talk, wave, nod, eat, drink, sit.
- The camera and the screens against `motion-sickness`, `accessible-motion` (reduced motion) and `timing-calibration`.
- **Queued by the owner, for when the animation is spotless** (27 November 2026): "When the animation is truly spotless,
  audit this repo add it to our toolbox as well and give suggestions on how Johansson world can become a fun game
  https://github.com/nexu-io/opengame that someone would like to buy". Not started: it waits on the can drink's re-key and
  the principles audit with its fixes. When it starts, audit the repository (what it does, licence, quality, what it
  needs), add it to the toolbox as REA and Lightpanda were added (AGENTS.md, a pinned version), and write the
  suggestions for a game someone would buy.
- The principles audit: built, next section.

# 27 November, night: the principles audit and its first baseline (branch `audit/principles`)

The audit the standard's section 5 asked for, from `claude/dreamy-ritchie-cxufpl` at 10adb74. Not pushed, not on `main`. No
move was changed: fixing them comes next, from the baseline.

## Done
- `tools/animation-audit.mjs`, a library and a command (`node tools/animation-audit.mjs [--moves a,b] [--bodies a,b]
  [--out dir] [--write-baseline]`): every move in `GESTURES`, and the walk, the run, the idle, sitting down and standing up,
  played by the game's animator on the smallest resident by measure (Vy), Johansson and the largest (Sverker), sampled at
  60 fps, measured for ease, anticipation, arcs, overlap, twins, squash and volume. The thresholds, their sources (the
  skill, or "ours" with the reason), the register of each move, the primary-effector overrides and the classes a check
  cannot measure (with why) are all in the file; the report is `output/animation-audit/` (not kept: about 95 s to make).
- `tests/animation-principles.test.mjs` (in the CI guard): a linear lerp fixture fails ease, anticipation, arcs, overlap
  and twins on every body; a reach built to the standard passes every check; a landing passes squash only with a squash
  that keeps its volume; every move is audited; no move fails a check on a body the baseline does not list, and a listed
  failure that now passes must come off it.
- `tests/animation-principles.baseline.json`: what fails today, per move, check and body.
- `docs/ANIMATION-STANDARD.md`: section 5 says what is measured as built (and where it had to be defined more closely:
  the everyday arcs' ceiling, the springs left out of overlap, the excluded classes); section 6 is where we stand.

## Proved
- 155 moves: ease passes 77 of 154, anticipation 0 of 132, arcs 65 of 145, overlap 0 of 152, twins 75 of 144, squash 0 of
  15, volume 155 of 155; every check, 1 (the idle). The causes are in section 6: one curve for the whole body, no wind-up,
  no squash anywhere, the stance snap (hands out of the pockets or from behind the back in a frame, 16 of 33 residents,
  Johansson among them), poses snapped to.
- Glitches it found: the can drink's exported motion turns the right shoulder 0.35 rad between two 30 fps keys (5.53 s of
  the motion), under `drink-can.test.mjs`'s 0.3 rad a frame at 60 fps; on Sverker the drink flips the right elbow about
  0.6 rad and back in a frame at the lip; Johansson's head hitches 0.3 s into DrinkCanOpened; Jump's crouch never reaches
  the hips; in Eat, Drink, SitEat, SitDrink and SitToast the hand jumps 9–22 cm in the first frame and 7–25 cm as the move
  ends, and Eat and Drink drop it 47 cm from the mouth in 0.2 s on a straight line.
- `node --test tests/animation-principles.test.mjs`: 8 pass, 91 s alone.
- CI guard (`node tools/ci-guard.mjs`, 132 files, 679 s): 712 of 714 pass; the two that fail are the known ones, the
  resident-guide portraits (failing at 10adb74 too: the avatar sources changed since the portraits were made) and the
  published runtime package (not rebuilt on a branch).

## Remains
- Bring the moves up to the standard, the most-seen first (section 6's table), and take each off the baseline with
  `--write-baseline` once it passes and its sheets have been looked at.
- For the owner: whether everyday arcs keep the guideline's 50% ceiling (as built) or 20% (which fails 202 of 433 natural
  strokes); whether the theatrical poses (`expressive-poses.js`) and the dances (`music-moves.js`) are comedy.
- Not measured: arcs from the game's camera, staging, timing by weight and age, secondary action's amplitude, the face,
  the camera and the screens; the hair and the cloth's drag.

# 27 November, night: Johansson's collar

The owner: "I do believe Johansson's Rigged Hawaii shirt needs to be improved too the collar is way too big going under
his arms when drinking".

## Done
- **The collar was too big:** the kariyushi's camp collar leaves reached 221 mm of his 234 mm half-width, nearly to the
  shoulder seam. Raised or crossing arms went over them: 29 mm into the sleeve drinking, 55 mm pointing, 47 mm clapping,
  40 mm tugging the collar, 19 mm scratching his head.
- **Now a camp collar's size** (`garment.js CAMP_COLLAR`; the painted shadow under it follows the same outline): leaf
  point at 68% of the half-width, the notch and lapel in proportion, the V where it was.
- **Clear in every move measured:** drinking (the izakaya drink and the Blender can drink), pointing, clapping,
  stretching, collar-tugging, head-scratching and the hair tuck, on Vy, Johansson, Sverker, Thuan, Tetsuo and Mr Fujita
  wearing it.
- **A test** in `tests/avatar-polish.test.mjs`: the collar ends well inside the shoulders and never goes under the
  sleeve in Drink, Point, Clap and CollarTug, on the smallest, Johansson's and the largest body.
- Guard: 712 of 714, the two known failures (the published runtime, the resident-guide portraits).

## Found, not fixed (neither file is in the guard)
- `tests/avatar-polish.test.mjs` "glasses stay clear of the hand …" fails since 59e05bc for the can: a resident's can
  is placed by the Blender sip now, and the test fits the old way on top of it. Given to the drink helper, with adding
  the file to the guard.
- `tests/underarm-coverage.test.mjs` fails: 168 underarm points expose the base arm under sleeved tops. It failed as far
  back as 28c9449.

# 27 November, late night: stage 1 of bringing the moves up to the standard (branch `anim/stage1`)

From `claude/dreamy-ritchie-cxufpl` at 2d61531, the coordinator's stage 1: the stance snap, the drag hierarchy, the eating
and drinking hand, the walk's stop and StandUp's step. Not pushed, not on `main`. Stage 2 (wind-ups for the procedural
moves, squash on impacts with the Jump crouch reaching the hips, the twins' offsets, the habits) waits for review of the
sheets. The drink helper's can block in `animate.js` and its files were not touched.

## Done
- `animate.js`: the stance as a movement (`stanceStep`, `STANCE`); the drag hierarchy (`dragStep`, `LAG`, `HISTORY`, the
  pins for reach-solver placements, `ARCS_WITHOUT_DRAG`); the cross-fade between ways of being (`modeFade`, `FADE`); the
  walk's stride eased to its stop; the consumption pose blended in and out level by level, with a reach that goes on from
  its last frame; the drink poses eased. `consume.js`: the lift and the drop bowed (`LIFT_ARC`); `drinking/cycle.js`
  exports `LIFT_STAGE`. What each does and why is in `docs/ANIMATION-STANDARD.md` section 6, "Stage 1".
- `tools/animation-audit.mjs`: overlap reads each joint's own first and last movement, and a leg only when its foot lifts
  (section 5 says why). `tests/animation-principles.baseline.json` rewritten from the run: 1506 entries to 1181.
- `tests/stance-release.test.mjs` (in the guard): seven moves on five stance bodies, no hand or forearm deeper into the
  body on the way than at either end, no hand jumping.
- `tools/hand-shots.mjs --moves`: a move's sheet (front and three-quarter at key moments, 8-frame strips over the stance's
  release and return). Before and after sheets of Walk, Talk, Nod, Wave, Eat and SitEat on Johansson and Thao:
  `output/anim-stage1/before/` and `output/anim-stage1/after/` (not kept in git: 2 MB each).

## Proved
- The audit: ease 77 → 121 of 154, anticipation 0 → 1 of 142, arcs 65 → 67 of 146, overlap 0 → 49 of 146, twins 75 → 63
  of 129 (fewer failures, more moves with one arm still), squash 0 of 15, volume 155 of 155; every check 1 → 5. Off the
  baseline altogether: the walk, Nod, HeadShake, LookAround.
- `node --test tests/stance-release.test.mjs`: passes, 7 s. Before the hand-back was shortened it caught Thao's hand 22 mm
  into her hip on the way back from Eat, and Sverker's forearm 6 mm across his back on the way out of Point.
- CI guard (`node tools/ci-guard.mjs`, 133 files, 678 s): 713 of 715 pass; the two that fail are the known ones (the
  resident-guide portraits and the published runtime package).
- The animator's cost per resident per frame (medians of seven runs against the code before, on a shared machine): idle
  24 → 27 µs, walking 23 → 25, a gesture 19 → 24, eating 46 → 55, sat 113 → 113, eating sat 145 → 147.
- Sheets looked at: no hand jumps at either end of Eat, SitEat, Wave or Talk; what was seen is in section 6.

## Remains
- On the baseline now and not before: anticipation on 13 moves (35 entries) whose action was a snap under 200 ms and is
  now eased and longer, with no wind-up; arcs on 13 (move, body) pairs where the blend out of the pockets or back bows past
  a half circle or under 10% (Talk and HandsOnHips on Johansson, HoldOn and Kachashi, Fidget, AirGuitar, Jump on Vy,
  EvilLaugh on Sverker). Stage 2 keys them with the stance in.
- Eat and Drink keep failing overlap: on the way back to the pockets the hand lags half a level (a quarter behind the
  back) so that it does not go into the hip. 19 moves play without the drag (`ARCS_WITHOUT_DRAG`) until stage 2.
- Not done in stage 1: the face keeps no lag (the animator has no face joints); the stance's release has no anticipation of
  its own (a counter-move inside the release was tried and did not show: the move's own pose starts near its zero); the
  settle has no overshoot at all (each joint's own follow), not the micro-overshoot allowed; the run still steps Vy's knee
  by 57% at its stop; the quick lift to the mouth
  still steps the elbow or the hand by 50–72% of its top speed (the reach folding, there before).
- Look in motion at the walk's last step (section 6).
- `claude/dreamy-ritchie-cxufpl` moved on (e8759bc, 08a73c4) while this was done; this branch is from 2d61531.

# 27 November, late night: a tank top under Johansson's shirt

The owner: "He should be wearing a 'wife beater' tank top under his shirt".

## Done
- **A new outfit field, `outfit.under`** (`recipe.js UNDER_LAYERS`: 'none' or 'tank'): what is worn under an open top.
  Johansson has `under: 'tank'` (`cast.js`).
- **Painted in the kariyushi's open V** (`garment.js`, `UNDER.tank`): off-white #f2efe6, ribbed, with a bound edge. Its
  wide scoop sits between straps that show at the V's top corners, with his chest hair above the scoop. It is clipped to
  the V; the shirt covers the rest.
- **A test** in `tests/avatar-polish.test.mjs`: he wears it, it is painted, his chest hair shows above it, a kariyushi
  alone has skin in its V, and an unknown under layer is normalised to none.
- **Not yet:** the creator (Studio) has no control for `under`. A saved or shared recipe keeps it (`normalizeRecipe`).

## Found
- `tests/avatar-wardrobe-sets.test.mjs` test 4 ("… without popping") passes before stage 1 (e8759bc) and fails after it
  (8eeb14f): "cold-store on Thuan: Wave pops 0.239 m in a frame". The file is not in the guard. Given to the stage 2
  helper, along with running every animator-touching test file before and after. Test 1 there (draw counts on a child)
  failed before stage 1 too.

# 27 November, late night: published to `main` (the owner: "Push to main so I can try Johansson")

- **Rebuilt:** the runtime (`npm run build:runtime`) and the residents' portraits (`tools/render-resident-guide.mjs`, with
  `TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium`).
  - The runtime build follows `src/scene/scene-world.js` into the site's `avatar-creator/fujita-stage.js`, which imports
    `../johansson-town/src/world/port-shed.js`. So the town must sit at the site's `johansson-town/` path (a clone or a
    symlink there; the site ignores the folder).
- **The guard on the rebuilt branch:** 715 of 715, all green.
- **What `main` now has:**
  - the can drink keyed in Blender, its first version: the opening is the stiff one being re-keyed on `drink/can`;
  - the torn tab in the fingers;
  - the animation standard and its audit;
  - stage 1 of the moves: the stance release, the drag hierarchy, eating and drinking without jumps, the walk's stop;
  - the smaller collar and the tank top.
- **Known and not yet fixed on `main`:**
  - stage 1's faster Wave makes a padded outfit set's surface move 4 cm more than the bare body in a frame
    (`avatar-wardrobe-sets` test 4; not in the guard);
  - the opening's staging and the pocket (on `drink/can`);
  - stage 2 of the moves (on `anim/stage2`).
