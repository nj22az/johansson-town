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

## Re-keyed to the animation standard (27 November, the owner: "make strict adherence to" dylantarre/animation-principles)
Register: everyday (calm). Beats (s): reach to the ring 0.2-0.8 (anticipation 0-0.2), hook 0.8-0.93, lift 0.93-1.12, the
give 1.12-1.22, tear 1.22-1.46, to the pocket 1.66-1.95 (anticipation 1.56-1.66), back to his side 2.16-2.97, glance
2.2-2.45, raise 2.75-3.45 (anticipation 2.45-2.75), first pull 3.45-5.10, breath 5.35-5.58, second pull 5.72-6.05
(anticipation 5.58-5.72) to 7.40, off the lips 7.40-7.72, "ahh" 7.72-7.86, lowering 8.06-8.66 (anticipation 7.86-8.06),
settle to 8.98 (drinkEnd moved from 8.8). Primary: the can (the left hook in the opening); secondary: breathing (chest,
0.006 rad, 4.8 s), a small weight shift (spine lean), the free left hand alive at his side while he drinks.
- The opening: the can at his middle in front of the lower breastbone, tipped to the left hand, its ring turned to it; the
  left elbow low by his side, the forearm up and across from below; the forefinger hooks the ring from his side of it,
  the lift is the wrist bending back, a give before the tear, the tab peeled back toward him then up and out.
- The pocket: the elbow out and forward, the hand down into it from above: in Blender the hooked fingertip is 8.7 mm from
  the pocket (was 66 mm), the wrists within their limits.
- Overlap: the spine and chest keyed 8 frames before each pose, the neck and head 4 (but held back till the can leaves
  the lips, and after the eyes at the reach); each hand's turn dragged 4 frames behind its forearm off contacts; the hook
  closes 4 frames after the hand arrives; the head turns to what the eyes look at 5 frames after them.
- Exaggeration: head back on the first pull 20% past the old key, the second 10% (more and the can's base meets the nose
  on the bigger heads), the breath-out nod 20%.
- The rig: IK control turns kept in one hemisphere between keys (a hand went over the long way in a frame); a measure of
  the hook at the pocket; the can's aluminium a mid silver-grey (its ends read as white discs).
- The game: the drink blends in over 0.7 s (out over 0.45); the ring held through the tear (the coordinator's 75c31b7 put
  the events after the pose; RINGW now ends at 1.34) so the torn tab hangs from the finger on every body; elbow-way
  changes rate-limited (0.06 rad and a tenth of the hand-turn hold a frame); the re-place loop up to five passes.
- Sheets: front and three-quarter now end with a black-silhouette row of eight story poses (from the render's alpha).

## Proved
- `node --test tests/drink-can.test.mjs tests/open-can.test.mjs`: 14 pass (with 75c31b7's tab-in-the-fingers test).
- Blender: rim to lip max 5.1 mm, mean 1.2 mm; hook to ring max 4.8 mm; hook to pocket max 8.7 mm; wrists within limits.
- Game, seven bodies: rim on the lip 0.0 mm; worst correction: lip 23 mm, ring 10 mm, pocket 61 mm (Thao; Johansson 27),
  the hands' paths 80 mm (Thao; Johansson 4); no joint over 0.29 rad a frame, the can at most 28.9 mm a frame, in the
  lowering (8.22 s), not in the blend.
- The principles audit (scratch script on the exported motion): anticipation 33-48% of each action on all six beats,
  opposite to it (cos -0.68 to -0.94) on five; arcs 13-21% off the chord in the world; overshoots 2.8% (can), 6.7% (left
  hand), 18.5% of a 38 mm head move; eyes before the head by 2 frames measured (5 by construction); holds: glance 4.3, rim
  3.0, deep pull 7.4, "ahh" 11 mm a frame; no linear interpolation set.
- CI guard as before the re-key: 704 of 706 (the two known).

## Remains
- The owner has not seen any of it.
- Staging, by the silhouette rows: from the front the opening's story poses (0.90, 1.38, 1.95, 2.45 s) do not read in
  black: the can and both hands are inside the body's outline (the can at his middle, as asked). From the three-quarter
  the pocket (1.95) and the "ahh" (7.80) read; the drink's poses read from both.
- The pocket the hand goes to is the game's pocketSpot (where the torch clips), near the placket under the collar; the
  shirt's printed pocket is lower and further out, so in the renders the tab goes in beside it.
- The lowering's anticipation does not go against the lowering (cos +0.48): the can rises off his lips while his head
  nods down for the breath out; lifting it more broke the wrist limits on Thuan and made the elbow pop.
- Arcs outside 10-20% from some cameras: the raise (three-quarter 8%), the second pull (three-quarter 4%), the lowering
  (side 5%), the tear (front 9%), the pocket (front 24%, three-quarter 23%).
- The drag hierarchy is in the keys, but the measured stagger (half-move times) is not consistent: the IK keeps the upper
  arm and the hand together (dragging the forearm three frames made the can fling at 107 mm a frame).
- In the game the opening's reach and its anticipation play inside the 0.7 s blend-in, so they are softened.
- Squash and stretch: the faces are painted (no cheek or chin shapes, no face bones): none.
- The 190 g can is held and its rim put on the lip at its own size; it is drunk in the same two pulls (a one-pull
  version would need its own keys).
- Residents sip at 1.25 times its speed; glasses and bottles still drink by the old consumption path.

## Then: the principles audit merged (964f071, work in progress)
- `audit/principles` merged into `drink/can`. On top: the root alone leads (spine 4 frames), the forearm half-dragged 3
  frames off contacts, the strokes to and from the lip bowed, the reach's anticipation out and back, a slower return from
  the pocket, and the game blends the move level by level (`drink-can.js levelWeights`, the can block of `animate.js`).
- `tests/drink-can.test.mjs` now has Vy and Sverker and checks steps of joint speed (0.06 rad a frame at 60 fps). It
  FAILS: Vy's lip and ring corrections 24.5 and 26.4 mm (limits 12 and 25), the can 6.5 mm into Vy's face, Vy's right
  wrist 0.16 rad past its limit at 8.0 s, Johansson's left shoulder 0.31 rad in a frame at 2.43 s.
- `node tools/animation-audit.mjs --moves DrinkCan,DrinkCanOpened`: both still fail ease, anticipation, arcs and overlap
  on Vy, Johansson and Sverker (fewer ease segments than before: Johansson's DrinkCan 10 of 30, was 12 of 40). What is
  left: speed steps at key times (the head at 1.23 s, the left shoulder at 2.5 and 6.53 s, the chest at 8.98 s); the
  counter-movement before the can goes up (Johansson 0 of 26 mm in DrinkCan, 23 of 39 mm in DrinkCanOpened); the strokes
  off the lip after the first pull (4.9-5.65 s) and up to it (2.52-3.17 s in DrinkCanOpened) 5.5-7% off straight; overlap
  primary to secondary 0 frames (the IK moves the upper arm and the hand together; the half forearm drag is not enough).
  The baseline is unchanged. The sheets are 56c3b82's.

## Then: the seven review notes (drink/can, after 964f071; not pushed)
Times below are the exported motion's (the old keys moved: +0.35 s before old 2.45 s, +1.10 s after it).
Beats (s): still beat 0-0.35 (the game's blend in, the hands' level over 0.32 s, inside it); the opening reach 0.54-1.1 with
its counter-movement (down and in) 0.54-0.75; the ring 1.15-1.65, torn 1.65; to the pocket 1.97-2.5 (the tab in at 2.5);
the left hand down 2.65-3.2; the can down to the waist 2.8, lifted to look at it 3.15, held (DrinkCan's drink and
DrinkCanOpened start at 3.2, a still beat); the dip 3.54-3.86, the raise to the lip 3.86-4.55; first pull to 6.2; release,
breath, dip, second pull 7.15-8.5; off the lips 8.57-8.8, "ahh" 8.96, the lowering's counter-movement (tipped back, up) 9.16,
down 9.45-9.85, settled 10.08 (drinkEnd); the sip 10.1-13.1.
1. Staging: the can opened out to his right and forward (LOWCHEST (-0.11, chestY+0.035, 0.37)k, the ring turned to the left
   hand), the chest turned to it (spine -0.04, chest -0.09 rad), the head and eyes on it. The left elbow is about 10 cm
   below the shoulder there, not by his side (the reach across is too far for a low elbow; and the opening has to be clearly
   past half of the hand's furthest travel or the audit takes another stroke for the action). `hand-shots --can` now
   shoots from the game's own camera (outdoors 3.2 m, indoors 2.2 m). From it, behind and over his right shoulder, the
   opening does NOT show: his head and right shoulder hide anything at lower-chest height nearer than about 25 cm to his
   right, which the left hand cannot reach. The drink's raised arm and can show past his shoulder. From the front the
   opening's silhouette is still a blob; the pocket and the drink read.
2. The pocket: pocketSpot now follows the breast pocket drawn on the shirt where the top has one (garment.js: the island
   shirt, the office shirt; `mouth` added). Measured on Johansson: the drawn mouth at chest-local (0.117, 0.121, 0.121), the
   old clip's top at (0.053, 0.163, 0.151): 64 mm further in and 42 mm higher. The tab goes 12 mm out from the mouth
   (drink-can.js pocketMouth). The left elbow out about 45 degrees and low, the wrist flexed, the fingers down into it. The
   torch on Tetsuo (jacket, no breast pocket) is where it was; the torch tests pass in the guard.
3. Other bodies (drink-can.js): each wrist's path is put right near a contact for what is not in the body's proportion (the
   can in its socket, the hooked finger, the pocket drawn on its own shirt: sizeContacts, from the maker's measure written
   into the motion's props); the rim near the mouth is kept where the motion's own was from its lip, brought onto the lip
   over 0.3 s (madeRimOff, LIP_NEAR); the left hand's turn held from well before the ring and through the tear; the elbow's
   way about the arm follows a damped spring; the free left arm's fit steadied; the right wrist eased into its limits off the
   lip. Vy: lip and ring corrections 4.6 and 24.3 mm (limits 12, 25); the face, the wrists and Johansson's shoulder pass.
   The ring "correction" the test reads is the hook's last approach as the contact comes on (19-24 mm on every body).
4. Overlap at the bake: the forearm and the hand 3 frames after the upper arm, the IK's own arm eased back in over 8 frames
   each side of a contact (the ring, the pocket; the right arm also near his face, where a late forearm put the can into it);
   then every joint from the spine up evened over five frames each side (one each side at the lip), the hands twice.
5. The lowering's counter-movement: the can tipped back to 28 degrees and up 2.5 cm, toward him, at 9.16.
6. The still beat at the start and before the drink, the shorter level blend (in 0.25 s, the hands 0.32 s, 0.1 s apart; out
   0.45 s), the stance kept under the can (until the merge, below).
7. The second pull: spine -0.075, chest -0.17, neck -0.2, head -0.38 (was -0.055, -0.13, -0.18, -0.44).
Also: a can in tests/avatar-polish.test.mjs is checked as the Blender sip places it (it failed since 59e05bc); the test is
in the CI guard now. A play of the drink forgets the elbow ways of the last one (results depended on the order played).

Proved: drink-can, open-can and avatar-polish tests pass (23). The audit: both moves pass anticipation, arcs, twins and
volume on Vy, Johansson and Sverker; ease passes on Johansson (both moves); the baseline only shrank (DrinkCan and
DrinkCanOpened: ease on Vy and Sverker, overlap on all three). Before merging claude/dreamy-ritchie-cxufpl (the general
stance easing, stanceStep) overlap passed on all three; after it, the primary and secondary levels stop in the same frame
as the move ends (the stance's return moves both), with or without the can block's own stance correction (removed: the
general one now does it). Ease left: DrinkCan on Vy (the hand starts at 58% after the first pull, 6.23 s) and Sverker (the
elbow at the opening's dip 0.8 s, 52-68%; the hand at the first pull's onset 4.48 s, 64%); DrinkCanOpened on Vy (63% as
the can comes off the lips, 8.63-9.0 s) and Sverker (64% at 4.48 s). Sheets: art/characters/body-kit/review/drink-can-{front,
three-quarter,side,opening}.jpg (Blender, with the silhouette rows) and drink-can-game-{johansson,thao-seated,vy}.jpg.

Remains: the overlap at the move's end with the general stance; the last ease steps on Vy and Sverker; the opening seen
from the game camera (needs the camera, or the body turned, not the arms); the owner has not seen any of it.

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

# 27 November, morning: a real collar round Johansson's neck, the neck into the shirt, no line across it

The owner, from the live game: "Johansson's shirt needs a real collar with a rounded neck"; "And no line on his neck like
that"; "You see his shirt doesn't have a collar" (a screenshot from behind); "Johansson's neck needs to fit in the shirt
he is wearing the shirt outside his body".

## Found
- **The collar's stand was sized from the arm** (`m.armR`), not the neck. On Johansson's 104 mm neck it was 69 mm, inside
  the neck and never seen. From behind, his shirt simply stopped at the neck, which sat on it; on the others it barely
  cleared the neck.
- **The open V started out at the shoulders** (a fixed 62% of the half-width), not round the neck.
- **The line across the neck was the outline's shell** round the neck's foot, standing out in front of the chest where
  the neck goes into it.

## Done
- **The stand** (`garment.js COLLAR_STAND`): round the neck it is worn on, 6 mm clear of it, 44 mm tall and rolling out at
  its top, open at the front. From behind and the sides the neck goes down into the collar; the shirt is outside it.
- **The open neck starts where the stand comes round to the front** (`collarNeckF`, `campCollarOutline`): the leaves fold
  down from there, the V's top is round the neck, and the tank top's straps and scoop are fitted to that opening.
- **The neck's outline fades out over its last 3 cm** above where it meets the body; its sides keep theirs.
- **Tests** (`avatar-polish`): the stand is chest cloth behind the neck and outside it (this fails on the old collar);
  the neck's foot has no outline and its sides do.

# 27 November, last: stage 2 begun, wind-ups read from the move (branch `anim/stage2`)

From the merge 8eeb14f. Not pushed. Stopped early on purpose, at a committed, passing state, with the rest written here: the
session's context was near its end.

## Done
- Stage 1's fault in `tests/avatar-wardrobe-sets.test.mjs` test 4 (outside the guard; the coordinator found it): a move cut
  off mid-way let go of its pose in a frame, and the drag moved that step into the frames the test counts. A cut now fades
  over `FADE` (0.32 s). The test passes three runs in three (it is random: each body's animator draws its own time).
- `animate.js` `WIND`, `windRead`, `windStep`: a move's action read from the move as it starts (its pose tried ten times
  through its first half), a wind-up the other way before it (40% of the action, 0.08–0.3 s; 15% of the turn everyday, 35%
  comedy), the move then a little quicker so it ends on time; the head leads unless it makes the move; never into the
  body. On the 23 moves in `WIND_ON` only, where it passes and breaks nothing (section 6 lists them and why not the rest).
- Baseline rewritten: 1181 entries to 1102 (57 anticipation, 22 overlap, 1 ease off; DeepThinker off altogether; one on,
  ReachBack's overlap on Vy, explained in section 6). Anticipation 1 → 15 of 141, overlap 49 → 55, ease 121 → 122; every
  check 5 → 6.
- ReachBack (`fujitas-back-moves`, outside the guard): its mitten came a level late to the breaker's lever; the reaching arm
  is pinned from the move's start, and a pin lets go eased.

- Every test file that plays the animator or dresses bodies and is not in the guard (51), at the head and at e8759bc (before
  stage 1): two had got worse and are mended (above, and `drink-grip` "Harbour visitor first frame rim reaches lips"); the
  wind-up had put FingerStop's forearm into Miss Higa sat (`story-gestures`), mended by no wind-up while sat. Every other
  file fails what it failed before (afterbath-outfit, avatar-floor-contact, avatar-polish, avatar-wardrobe-sets test 1,
  drink-grip's hand and thumb vertices, izakaya-lived-in, onsen-noren-heads, onsen-seats, owned-vehicles, pole-hug,
  story-gestures' KneelHug and mitten, underarm-coverage, wardrobe-batch2, work-kit; wardrobe-batch3 one fewer). 34 are
  fully green; none of the files that got worse is, so none was added to the guard. Run again at the last commit
  (8f289a3): every file fails exactly what it failed before stage 1, or less. `fun-poses` could not be compared: it ran
  past 50 minutes without finishing, before stage 1 and at the head alike.

## Remains (the coordinator's stage 2, in order)
1. Anticipation for the rest, the most-seen first (Talk, Wave, Point, Shrug, Laugh, Bow, the habits, and the 13 that newly
   need it). The joint-turn wind-up cannot do them: an arm raised from the side has no room to turn the other way, so
   these want a dip of the shoulder or the chest that carries the hand back along the action's line (5% of its travel, for
   30–50% of the action), and Bow's wants the root to move first so the levels stagger. Try them by adding a move to
   `WIND_ON` and running the audit on every move: it must take entries off and add none.
2. Squash on impacts (0 of 15): Jump's crouch to reach the hips first (they rise 6 mm and leave at 1.2 m/s in a frame),
   then 2–5% everyday, 10–20% comedy, by bone scales whose product is 1, eased; check the clothes, the outline and the
   feet.
3. Twins: a lead hand. Beware the moves whose hands meet (Clap, CupHands): a lag on one arm parts them.
4. The arcs the stance's blend bends (13 entries from stage 1) and `ARCS_WITHOUT_DRAG` (19 moves).
5. The settle's micro-overshoot (under 5% of the travel, on the main effectors).
6. The lift to the mouth's velocity steps (the reach folding, 50–72%) and Vy's run knee at its stop (57%).

# 27 November: beer in the drinks machines, the cans drawn in Python (branch `vending/beer`)

The owner: "replace the generic teas and coffe we need the vending machine to sell beer and you need to use Disney art
style and draw them in Python". From `claude/dreamy-ritchie-cxufpl` at 30f0f3b; not pushed, not on `main`. The decision is
in `AGENTS.md` (the owner's decision of this date).

## Decided, and why (the reasons are in the data: `src/commerce/vending-catalogue.js`, each can's `for`, `who`, `why`, `placed`)
- **Out:** Harbour Tea (green tea), Dockside (canned coffee) and Sanpin (jasmine tea), the generic ones. They are
  `RETIRED_VENDING`: a can of 'Green tea', 'Canned coffee' or 'Sanpin jasmine tea' in a saved bag still drinks, leaves its
  empty, keeps its colour and is printed as itself in his hand (the coffee at its 190 g size). Sakura's own 'Green tea' and
  'Canned coffee' share those bag names, and stay drinkable with them.
- **In, the top row (at a grown-up's eye, above the children's drinks):**
  - **Kame island lager**, 350 ml, ¥220 (Sakura's own counter price for a can of lager, so the machine is never the dearer
    way), three columns. For Tetsuo and Erik on the bench outside Sakura of an evening, Johansson on the walk home, and
    anybody of age on a Saturday, when Sakura is shut and the machine is the only can in town.
  - **Jugon big draft**, the 500 ml long can (66 × 168 mm), ¥280, three columns (a long-can column holds 18 to a 350's 25).
    For the Minato Maru's crew off the last boat at 22:20 (Ryo, Ren, Chin, Jun): forty minutes before the beer stops.
  - **Tako black**, a dark lager, 350 ml, ¥240, two columns (it sells slower). For the men who sip slowly: Sverker, Erik,
    Johansson.
- **Kept, the bottom row:** J-Coffee (two columns now: the quay crew's, and what sells at night when the beer has stopped),
  the shikuwasa soda and Ryukyu cola at a child's hand and eye (Vy, Riku), hot corn soup at the right end (red buttons).
  Each now has its `for`, `who`, `why` and `placed` too.
- **Whose beer:** Sakura's. Japan has granted no licence to sell alcohol from machines alone since 1973 (National Tax
  Agency), and Sakura holds the island's only licence since Higa Liquor closed; so Minato Drinks' van loads the beer at
  Sakura Trading's depot each morning with the rest (`VENDING_BEER_STOCK`, `VENDING_MACHINE.operator`, a line on
  `SUPPLIERS.sakura.alcohol`), and the machine's sticker names Sakura as the seller. Found: who restocks is Minato Drinks'
  van every morning (`VENDING_MACHINE.operator`); no account was added to `ACCOUNTS.sakura` (a test holds those to the
  round's four drink customers).
- **The night (checked on the web):** since 1977 the National Tax Agency has had the trade sell no alcohol from vending
  machines from 23:00 to 05:00 (自動販売機による酒類の深夜販売の自粛指導, 昭和52年～; NTA 酒類の概況), and since 1989 every
  alcohol machine carries its stop hours and the warning to minors (the Brewers Association of Japan's English page says the
  same). It was the NTA's guidance from 1977, not an agreement of the 1990s; the trade's own 1990s step was the May 1995
  resolution to take the outdoor machines away by May 2000. So: from 23:00 to 05:00 the beer buttons are dark with 販売中止
  and the soft drinks still sell, on every machine (`VENDING_BEER_HOURS`, `beerOnSale`); the Port Terminal's indoor machine
  keeps the same hours and would also stop with its hall, which is open round the clock (`PORT_HALL.open`).
- **Nobody under twenty** (the 1922 act): `vendingRefusal` and `residentVendingChoice`. Residents do use the machines
  (`people/town-activities.js`, the 'Buy a drink' affordance): the can is now chosen at the machine by who they are, their
  age and the hour; a beer only for a grown-up in their own evening, while the machine sells it and they have room for it,
  and it counts on their drunkenness scale as a bar's does. The player as Johansson is a grown man; the Linux edition's
  resident play (`playingResident`) is not age-checked at the machine (it was not asked for; see Remains).
- **Drinking it:** a machine beer counts as Sakura's can does (`game.js` consume reads `alcoholOf`: Kame .8, Tako .88,
  Jugon 1.14 on `people/drunk.js`'s scale, "Enough for tonight" past the limit). Only the consume line and an import changed
  in `game.js`.

## Drawn (`tools/draw-vending-cans.py`, pycairo 1.29 from pip, Pillow for the WebP and the sheet)
- Each can's wrap-around print, the front at the middle, at the proportions of the band the machine's dummy can shows
  (0.86 of its height, π × its diameter round): 1024 × 518 for 350 ml, 1024 × 714 for the long can, in
  `assets/graphics/vending/*.webp`; the machine's side poster `beer-poster.webp` (512 × 832, the three together at dusk,
  the hours and the warning). The review sheet: `art/vending-cans/review/cans-sheet.jpg` (flat, as cylinders front,
  three-quarter and back, and at the size the window shows them, ×1 and ×4).
- **Kame** (turtle, sunset, teal and gold): sat back on the tide line, a towel round his neck, eyes shut in bliss, one
  flipper up: "otsukare". **Jugon** (dugong, night blue and gold): leaping out of the sea under the moon, stretched from
  fluke to snout, laughing. **Tako** (octopus, black and coral): a skipper's cap, squashed down wide, one eye winking, an arm
  curled up to tell a tale. Logos are drawn as brush strokes (`GLYPHS`, ten letters), outlined, dropped and lit; small
  print in IPA Gothic and Inter. The backs carry what a Japanese can of beer carries (kind, strength, contents, the
  minors' warning, the brewer: ヨハンソン麦酒, a Johansson company by the Acme rule, the アルミ mark).
- **The passes:** (1) Kame's logo ran off the top and the turtle's head covered it, the sun sat in the sea and the swash
  crossed his face: the logo moved down, the turtle scaled to 0.8 under it, the sun set behind him, the English and
  Japanese set apart. (2) A towel to say "after work" (a first one read as a bottle on his chest; redrawn under the chin
  with its fringed end down his front), the raised flipper given a curve and two wave lines. Jugon (1) read as a dolphin
  with stick flippers: rebuilt as a dugong's barrel with a big downturned whiskery snout; (2) the nostrils read as a
  second face and a brow stood outside the head: removed, the eyes moved in and enlarged; (3) the near flipper swept back
  as a paddle (it follows the leap). Tako (1) had no visible outline on the black (ink on near-black) and ran off the top:
  a gold rim round the lettering, the figure lowered; (2) fewer, bigger suckers, the head squashed wider.
- **Redraw:** `python3 tools/draw-vending-cans.py` (or `--only kame-lager`), then look at the sheet. Never edit the WebP.

## In the game
- `world/vending.js`: the new columns; the top band 1.5 cm taller (the long can stands 16.8 cm on its 3.4 cm lip with room
  above; the lit header moved up the cabinet to make room, same size); the drawn prints loaded once (`withArt`) and drawn
  into the window's label cells, the side poster's cell and the hand can's canvas, with a plain brand print until they are
  in; the beer's button lamps a mesh of their own (`Beer buttons`, the machine's own lit material, so a story still dims
  them) swapped whole between lit and 販売中止 (`userData.beerOnSale`); the alcohol sticker on the face (the warning, the
  stop hours, さくら商店 as the seller). `vendingCanTexture` keeps its interface (and prints retired ids).
- The street (`okinawa/quarters.js`, every outdoor machine) and the Port Terminal (`interiors/port-hall.js`) switch the
  beer by the clock; the menu (`activities.js`) shows the beer's buttons disabled at night ("not sold until 5:00") and refuses them.
- `commerce/bought-can.js`: the can in his hand is sold sealed at its column's size (the long can 1.38 × taller), and a
  drawn print shows its middle at the same scale (its UVs, `ART_SHARE`).
- `studio/prop-registry.js`: the three beer cans as props with their who, why and where; the machine's purpose updated.
- Tools: `hand-shots.mjs --can … --bought "Jugon big draft"` holds the can as sold; `vending-drink-shots.mjs --machine`
  photographs Sakura's machine at noon, 21:00 and 23:30.
- The menu speaks English (controls and dialogue stay English, `scripts/english-inventory.mjs`): at night the beer's
  buttons read "Kame · Island lager · not sold until 5:00" and refuse with "Sale stopped …"; only the machine's lamps and
  sticker carry 販売中止 and the Japanese warning (vending.js is scenery).

## Proved
- `node --test tests/vending-beer.test.mjs` (new, in the guard; 9 tests): the line-up and its reasons (every name a
  resident, the beer named only for grown-ups, own brand names, Sakura's price and supply); the long can clear in the
  window; the night rule and its source, the beer lamps' atlas cells by day and night, the alcohol sticker; the Port
  Terminal's machine dark at 23:20 and lit at 05:10; the menu at 23:30 (beer refused, soda sold) and at 19:00 (a long can
  bought); residents: no child ever gets a beer at any hour or place, each grown-up's evening beer is the one naming them,
  none after eleven, at work, past their limit or with no recorded age, and in the street Ryo pays ¥280 and grows
  tipsier, Vy and Riku buy sodas; old saves' tea and coffee drink, empty, keep their colours and prints and sit in the
  bag's drinks; each WebP is the size and proportion the catalogue says and the hand maps its middle; Johansson and
  Sverker drink a long can with its rim on the lip (under 2 mm) and never in the face.
- Updated and passing: `vending.test.mjs`, `vending-loop.test.mjs` (both now in the guard), `open-can.test.mjs` (a Kame,
  an old Green tea and a Tako opened and drunk; every can at its column's size), `systems.test.mjs` (the v4 save buys a
  J-Coffee; no beer without the yen). Also run and passing: halloween-street, asset-modeller, vending-placement,
  port-hall-finish, resident-life, npc-seating, staff-bench, studio-assets, lot-dressing, kitahama-park-grounded,
  sakura-back, sakura-merchandising, higa-liquor-laundry, english-language.
- **CI guard** (`node tools/ci-guard.mjs --test-concurrency=2`, 137 files, 2475 s on a machine shared with other guards):
  738 of 740; the two failures were english-language (my Japanese menu labels: fixed after, it passes) and the published
  runtime package (not rebuilt here, expected). The resident-guide portraits passed.
- **In the game** (`node tools/vending-drink-shots.mjs --source --machine --drinks "Kame lager,Jugon big draft"`, software
  Chromium; sheet `art/vending-cans/review/game-machine-and-drink.jpg`): Sakura's machine at noon from the pavement and
  close on its window (Kame, Jugon's long cans, Tako in the top row at ¥220/¥280/¥240; J-Coffee, the sodas and corn soup
  below; the alcohol sticker readable), at 21:00 lit, and at 23:30 the top row's buttons dark with 販売中止 while the
  bottom row's are lit. Then Johansson buys each (the audit's `buy`, as the machine's pocket gives it) and drinks it in
  the third-person game: the Kame can and the Jugon long can in his hand printed as themselves, opened, the tab pocketed,
  drunk; no page errors.
- **Close up** (`node tools/hand-shots.mjs --can 1.5,5.0 --name Johansson --bought "Kame lager"` and `"Jugon big draft"`;
  `art/vending-cans/review/hand-kame.jpg`, `hand-jugon.jpg`): the first shots showed the can's back panel outward (the
  hand's socket holds the can's -z to the front), so the print was turned; now the logo and the mascot face out of his
  hand when opening and at his lips, the long can at its length.
- Looked at: every can's print, the review sheet, the poster, both hand sheets and the game sheet.

## Remains
- The owner has not seen any of it. The runtime is not rebuilt (`npm run build:runtime`).
- Every Johansson Vending machine shares one line-up (`VENDING_COLUMNS`), so the beer is in all of them: Sakura's wall,
  the fish market's, the Main Street drinks corner's pair, Kitahama Heights' pair across from the park, Fumoto's and the
  Port Terminal's. In 1990s Japan a beer machine stood at its licensed shop; if the owner wants the beer at Sakura's
  machine only, the columns need a layout per machine.
- The Linux edition's resident play (`playingResident`) is not age-checked at the machine (the player is taken to be
  Johansson); the refusal is ready (`vendingRefusal(…,{age})`) if it is wanted.
- The storyteller (`src/feed/`) keeps generic drinks lists and has no age filter; the beers are not added to its
  `DRINKS` (a child could be given one). They are registered for it through `vendingBuyersOf`/`vendingLinesFor` and the
  Studio's prop registry (`kame-lager-can`, `jugon-draft-can`, `tako-black-can`, each with who, why and where).
- Found, not changed: the izakaya still names a real brewer, Orion, on its drinks (`people/izakaya-beer.js` DRINKS);
  Sakura's Umineko can, like the machines' cans before today, is printed with its front toward his palm
  (`bought-can.js shopPrint`); `tests/products-move.test.mjs` failed before this branch (not in the guard) and its legacy
  snapshot of the machine's line-up is now older still; `hand-shots.mjs` exits 1 on the page's missing favicon.
- The ferry's lobby machines (`ferry-ship.js`, "Canned coffee and tea") and Johansson Mart's two (`kitahama-shop-build.js`)
  are other machines, not this model, and are unchanged.

# 27 November, later: stage 3 begun, the trunk's wind-up (branch `anim/stage3`)

From `claude/dreamy-ritchie-cxufpl` at afb2fcb. Not pushed. Stopped at a committed, passing state with the rest written
here: the session's context was near its end. What each change does and why is in `docs/ANIMATION-STANDARD.md` section 6,
"Stage 3".

## Done
- `animate.js`:
  - **`TRUNK`, `WIND_TRUNK`, `windTrunk`:** the wind-up as a dip of the shoulder, solved on the body's own bones.
  - **`RISE`:** the everyday arm raises at a natural pace, from where the arm hangs.
  - **The Wave** lasts 2 s (from 1.6).
  - **`windStep`/`windTime`:** a hold at the bottom of the wind-up.
- `tools/hand-shots.mjs --wind`: a strip of every third frame over the wind-up.
- `tests/wave-gesture.test.mjs` (guard): looks for the raised arm where it is now up, 0.67-1.67 s.
- Commits: ba79fb7 (the trunk's wind-up, the rise), 4b01670 (Shrug; the dip a centimetre clear of the body).
  ba79fb7 alone fails `stance-release` by 0.2 mm (Vy's waving hand), which 4b01670 mends.
- Baseline 1088 → 1062 entries, none added. Every check 6 → 7 (the Wave). Anticipation 17 → 19 of 141, ease 122 → 123,
  overlap 55 → 56. Off:
  - the Wave altogether;
  - ScratchHead's anticipation and arcs on all three;
  - anticipation on two bodies each for Point, ChinTap, Clap and Shrug, and on Vy and Sverker for CollarTug;
  - Kachashi's ease on all three;
  - Shrug's twins on Vy and Johansson.
- Sheets before and after, the seven moves on Johansson and Thao: `output/anim-stage3/wind/` (not in git).

## Proved
- `node --test tests/animation-principles.test.mjs`: 8 of 8.
- Guard tests that play the changed moves pass:
  - `stance-release`, `wave-gesture`, `avatar-polish` (with the collar under the sleeve in Clap and CollarTug);
  - `conversation-eyes`, `vy-reference`, `drinking-game`, `player-seating`, `open-can`.
- **The 51 animator and avatar files outside the guard**, each alone, at afb2fcb and at 4b01670: all 50 that finish give the
  same results at both, test by test, nothing worse and nothing newly fixed. `fun-poses` runs past its hour at both, as
  stage 2 found. The ones that fail, fail what they failed before stage 3:
  - afterbath-outfit, avatar-floor-contact, avatar-wardrobe-sets test 1, drink-grip (2);
  - expressive-poses, fujitas-back-moves' plank, izakaya-lived-in, onsen-noren-heads, onsen-seats;
  - owned-vehicles (2), pole-hug (2), story-gestures (2), underarm-coverage;
  - wardrobe-batch2, wardrobe-batch3 (2), work-kit.
- **The full guard** (`node tools/ci-guard.mjs`, 134 files, 2222 s with the machine at load 15): 703 of 706.
  - floor-sit and no-z-fighting ran past the guard's 900 s a file. Alone, floor-sit passes 7 of 7 (6 min) and
    no-z-fighting 13 of 13 at the head as at the base (run directly; under `node --test` it reports a bare "test failed"
    at both).
  - The runtime package and the portraits did not fail here.

## Found
- **The audit counts a counter-movement only where it moves faster than a tenth of the action's top speed** (its rest).
  Against a raise ramped in a quarter second (the Wave's hand at 4.2 m/s), no calm dip registers. So a move that wants a
  calm wind-up wants an action at a natural pace first (`RISE`).
- **A root that moves only in the wind-up fails overlap:** the root must stop first, but it stops a second before the
  arms. And a moving root holds the chest a lag behind it, which halves the dip's speed. The dip is the chest's.
- **The moves' poses started from an arm straight down against the side** (shoulder z 0), not the body's hang (0.13 rad
  out). Held at its start through the wind-up, Wave's and ScratchHead's hand went 5-9 mm into the hip. Now they start
  from the hang.
- **The other hand in a pocket still swings about 3 cm out** as the chest leans. Its forearm already lies 11-19 mm into the
  hip's measured core at the pocket stance, so turning it all the way back presses it deeper (`TRUNK.keep` 0.3 is the most
  the stance test allows).
- **Vy needs about 0.28 rad (16 degrees) of lean** to carry her hand back 5% of its way: her trunk carries the hand about
  half as far per radian as Johansson's. On her it is not subtle.
- **The machine's load (about 15 on 4 cores) made the whole-animator benchmark meaningless:** the base's idle read 95 to
  193 µs between runs. The start frame of a trunk move was measured alone instead: about 0.3 ms where it was 0.05, once,
  as the move starts; the frames after, 26-27 µs as before.

## Remains (stage 3, in order)
1. **Anticipation for the rest of the most-seen moves.** Try a move by adding it to `WIND_TRUNK` (its own share and hold
   in `TRUNK_OWN`) and auditing it (`node tools/animation-audit.mjs --moves X`). Then audit every move: it must take entries
   off and add none, and `stance-release` must pass.
   - **Talk:** no depth on any body. Its hands start from the stance and sway at once (no ramp), and it adds arcs on Vy.
     It wants a ramped raise of its own first.
   - **Laugh:** passes on Johansson and Sverker. On Vy no depth; on Sverker the wind-up's own stroke curves 62% (13 cm).
   - **Bow:** the spine leads (`TRUNK.rooted` does this) and passes on Johansson and Sverker. But Johansson's head lean
     back is a straight 10 cm stroke (an arc failure), and Vy's levels start together. Try a share under 7% so the stroke
     stays under 10 cm.
   - **HairTuck:** Sverker's hand from behind his back to the ear goes past a half circle with any wind-up or slower rise.
   - **HeelRock, DramaFinish:** their levels start out of order.
   - **Point, ChinTap, Clap on Sverker (hands behind his back):** the release from behind the back runs forward along the
     action and cancels the dip. Try holding the stance through the wind-up and releasing with the action.
   - **CollarTug on Johansson.**
   - The 13 that newly needed it after stage 1, SitDown and StandUp.
2. **Squash on impacts, 0 of 15** (not begun). A plan:
   - Read the impact in the animator as the audit does: the hips falling at 0.3 m/s or faster and stopping.
   - Squash the waist: the spine's scale y by (1 - s) and x, z by 1/sqrt(1 - s). Scale the chest by the inverse, so the
     head and arms keep their shape and every bone's product stays 1.
   - Size it by the fall: everyday 2.5-4.5%, comedy 11-18%. Ease it over about 10 frames, peaking within the audit's 8.
   - Jump's crouch first: `foot-ground.js` only lifts an airborne body (`Math.max(0, correction)`), and Jump counts as
     airborne from its first frame, so its crouch never brings the hips down.
   - Check the clothes, the outline and the hem springs. `springs.js` belongs to the shirt helper.
3. The twins' offsets.
4. The 13 arcs entries from stage 1, and `ARCS_WITHOUT_DRAG`.
5. The settle's micro-overshoot.
6. The lift's velocity steps, and Vy's run knee.
7. The drink's leftover failures (DrinkCan and DrinkCanOpened). Untouched in stage 3.

# 27 November, night: the owner's YouTube videos on Minato's television (branch `tv/youtube`)

The owner: "I want to change the video in the izikaya to embedded YouTube videos from my channel can a short be
embedded?"; then "Can't the embed option be used? So it plays a random video of mine? And we can choose if we want to
listen"; and the channel, https://youtube.com/@johanssonanimationstudios.

## Done
- **The real YouTube player on the set** (`src/world/izakaya-tv-youtube.js`, `attachYouTube`): the IFrame Player API's
  page (youtube-nocookie.com; `playsinline`, `controls=0`, `rel=0`, `iv_load_policy=3`, `disablekb=1`, `mute=1`), 640 × 480
  CSS px, laid over the canvas and turned into the tube every frame by one CSS `matrix3d` (`tvOverlayMatrix`: the
  camera's projection and the face's world matrix), `pointer-events:none`. The game places it in `present()`, after the
  camera is final and before the draw (`game.js placeTelevision`); a frame drawn without it hides it at once (a watchdog
  on the next animation frame), so it cannot lag or float. It sits over the vignette (`#ink`), under the room fade, the
  HUD and every card.
- **Shown only in clear view** (`tvOverlayDecision`, pure): the set on (Minato or Sato Ramen in their hours), nothing over
  the game, the look Natural (the drawn looks cannot filter a YouTube page: with any other look, or the Pocket Gentleman
  raised, the tube shows the still), reduced motion off, near (4 m), facing (cos 0.42), all of it on screen, at least
  200 × 200 px, nothing between the lens and the screen's corners, edge middles and middle, and no HUD piece over it.
  Otherwise the tube shows the video's thumbnail (i.ytimg.com allows it as a texture), else the old advert's poster, else
  a quiet test card, and the player is paused. 250 ms in (easing out), 150 ms out (easing in), opacity only; it comes in
  only once the video moves, never over YouTube's loading screen. Hidden at once when something is actually in the way.
- **What is in the way** (`src/world/tv-occlusion.js`): the room's triangles within reach of the screen in a
  bounding-volume tree (the izakaya is about 105,000 triangles in a few room-wide batches), meshes that move, appear or are
  skinned raycast on their own, the residents in the room and Johansson as capsules (his own body ignored only with the
  lens in his head), what hangs off the camera (a held can). An early warning (people 12 cm wider and a fifth of a second
  ahead, the lens likewise) starts the fade before anything arrives.
- **A random video of the owner's**: `TV_YOUTUBE = {videos:['ozpLFCdrAfk'], uploads:'UUechhQjAeM3xkuRDXof1CmA'}`. The
  player reads the uploads playlist (every upload, Shorts included, new ones automatically) and plays them by ID, picked
  with the town's `shuffledPlaylist` (`createVideoPicker`): never the same twice in a row, also on coming back in; the
  next random one when one ends; one that will not play is skipped. No playlist: the `videos` list.
- **Listening** (the TV prompt, `minato-compact-room.js`, follows the set): "Listen to the TV" / "Mute the TV" while it
  plays in view, inside the tap (and again on its release, for Safari), volume 45 of 100 (Safari ignores it), and the
  town's sound ducked to half (`town-audio.js duck`). Walking away, the set going off or another look mutes it again; a
  card over the game only pauses it. Not a view (YouTube's own help: autoplayed embeds do not count).
- **"Watch on the TV"** (the prompt when it is not live, the rail's new TV button beside "Listen" when it is): the same
  video in an ordinary YouTube player in the activity card (`activities.js youtubeViewer`, `quiet-ui.css .youtube-view`),
  centred over the dimmed game and all of it in view (926 × 521 px at 1180 × 820, never under 356 × 200),
  YouTube's controls, nothing starting by itself: the viewer presses play, and YouTube counts that as a view. Closing it
  gives the game back.
- **Fallbacks**: offline, the API unreachable (a timeout that counts only time the page was free, `patientTimeout`: the
  room's build stalls the page), the player not starting, or every video refused: the set plays
  `video/izakaya-ad.mp4` exactly as before (`advertising-billboard.js hold(false)`). Leaving the room stops and destroys
  the player and removes its page.
- **YouTube's rules** (links in the module): 200 × 200 px; no automatic playback until visible (here: all of it, clear);
  nothing over the player and its look unchanged. **The one thing to keep an eye on**: the perspective `matrix3d` is only
  positioning, but it is a transform of YouTube's page; if YouTube ever objects, show it flat (no perspective) or only the
  still and "Watch on the TV".

## How to add videos or change the channel
- Edit `TV_YOUTUBE` in `src/world/izakaya-tv-youtube.js`: IDs in `videos` (a Short's ID is the part after `/shorts/`);
  another channel's uploads playlist is its channel ID with `UC` turned into `UU` (`uploadsPlaylist()`). Then rebuild the
  runtime (`npm run build:runtime`).

## Proved
- `node --test tests/izakaya-tv-youtube.test.mjs` (in the guard, with `advertising-billboard` and `context-actions`):
  the seeded random choice (no repeat, every one once a round, the uploads list, a failed one skipped), the decision
  (shown in view and clear; hidden for each of: off, a card, another look, reduced motion, too far, facing away, behind,
  a corner off screen, under 200 px either way, occluded, the HUD over it; the hysteresis), the CSS transform's corners on
  the projected corners within a pixel from five poses in three viewports, the triangle tree against three.js's raycast,
  one corner blocked, moved, hidden, added and see-through meshes, capsules and a held can, and the set with a fake API
  (muted start, nothing played unseen, fade only once moving, listen/mute, hidden and paused at once when Thao steps in,
  re-muted walking away, the watchdog, "Watch on the TV", dispose; the uploads mode; offline, unreachable, every video
  refused: the old film).
- `node tools/tv-overlay-shots.mjs` (new; software Chromium, the game from source with `?audit&visual-audit`, YouTube
  replaced by a local stand-in that shows a 640 × 480 grid with a red rim): see the report below in this section's
  last list. `--youtube` uses the real YouTube.
- **The shots** (1180 × 820, an iPad on its side, then 820 × 1180 upright; `docs/qa/izakaya-tv/`, all of them in
  `output/tv-overlay/` and `output/tv-overlay-youtube/` when the tool is run):
  - at the set, first person (straight on and looking across): the stand-in's grid on the tube, its red rim on the
    tube's rim, inside the bezel; the browser's own box of the transformed page against the corners three.js projects:
    at most 0.03 px apart in every shot;
  - from the counter (too small: under 200 px) and from the door (too far): the still, the video's thumbnail;
  - at the set in the woodblock look: the still, drawn in the look;
  - third person beside him: the grid on the tube; from the counter: too small, the still;
  - upright, third person, his head in front of the screen and his shoulder over a corner: the still (his body, a
    capsule); clear of him, and first person from the counter: the grid;
  - with the HUD: the place chip, the action "Listen to the TV" with "Watch on the TV" beside it, the grid clear of them;
  - "Watch on the TV" pressed (the rail's button, a real click): the card with the same video's player, 926 × 521 px,
    all of it in view, and closed again to the game;
  - "Listen": the set called unMute and setVolume(45).
- **The real YouTube, here** (`--youtube`): the IFrame API loaded, the player was made on the set (its page placed on
  the tube exactly as the stand-in's), the uploads playlist gave all 12 of the owner's videos and their thumbnails came
  as textures; but every video, asked to play, answered error 150 (the standard youtube.com host the same), while
  YouTube's oEmbed says the Short may be embedded: YouTube will not play to this cloud sandbox (an unlisted, headless
  browser on a server address, page on 127.0.0.1). The set showed the thumbnail, never YouTube's error screen, and once
  every video had been refused it went back to its own film, as designed. **Playback has not been seen yet: the first
  look must be on the owner's iPad**, on the published site.
- **Cost** (software Chromium, this cloud machine): the sight-line tree is 78,401 of the room's triangles (those within
  4.8 m of the screen), about 0.12–0.21 s of work, built a few milliseconds a frame from the moment the set comes on (a
  sixth of a frame, at least 3 ms); a frame that checks the sight lines spends 0.1–4.5 ms on them (once warm, under
  0.5 ms) and reads the HUD's boxes at most every 120 ms (about 1 ms, a layout read). Not measured on an iPad.
- **The guard** (`node tools/ci-guard.mjs --test-concurrency=2`, on a machine shared with three other helpers' suites): 137
  files, 732 tests, 729 pass. The 3 that fail: the two runtime-package checks (the runtime is not rebuilt here, and
  `quiet-ui.css` changed, so its link's hash is stale: `npm run build:runtime` rewrites both), and `no-z-fighting`,
  killed by the machine's out-of-memory killer while it built the town beside the others' (dmesg); run alone it passes,
  13 of 13. `controller-game` and `neighbourhood-access` (not in the guard) fail the same way on the base commit.
- **The pictures**: `docs/qa/izakaya-tv/` (the stand-in's sheet and four of its shots, the real YouTube's sheet and its
  shot at the set).

## Not done, and to watch
- **Seeing it play**: on the iPad, in Safari, published. Check that the Short and an ordinary video play muted on their
  own when you stand under the set, that "Listen to the TV" brings the sound up (Safari: in the tap), and that "Watch on
  the TV" plays with sound when its play button is pressed.
- **The player only shows from near**: YouTube's 200 × 200 px puts it within about 1.4 m of the screen on an iPad on its
  side (2 m upright, about 2.7 m on a big monitor at the narrowest field of view). From the counter or the door it is the
  thumbnail. That is the rule, not a fault.
- **The perspective placement** is the point to keep an eye on with YouTube (above).
- **Not in the runtime yet**: `npm run build:runtime` before publishing (the guard's runtime-package test fails on this
  branch until then).

---

# 27 November: no real brands, only the island's own (branch `brands/fictional`)

The owner: "Yes, no real brand only fictional brands that fit into the Jansson world and if you can't make up a good one
just use the Johansson name as a brand" (AGENTS.md, the decision of this date). From `claude/dreamy-ritchie-cxufpl` at
6c8a001; not pushed, not on `main`.

## The rule, as applied
Nothing the player or the storyteller can meet names a real maker, shop, drink, paper, broadcaster, team or product:
products and menus, signs, posters and painted textures, scene names, dialogue, the storyteller, the guide, the Studio's
data. Real places stay (Nago, Naha, Kokusai-dōri, Shuri), and so do words that are only words. Comments are ours and may
quote the owner, the research and the sources.

## Found and replaced, and why
- **Orion (a real Okinawan brewer)** on Minato's draught, large bottle and can (`people/izakaya-beer.js DRINKS`), the bar's
  tap, its badge and its bottle (`minato-bar.js`, `izakaya-bar.js`), the labels on the izakaya's glasses and bottles, also
  Mr Fujita's crates (`izakaya-serving-visuals.js`, the label string only), Sato Ramen's bottle (`sato-ramen-layout.js`,
  `ramen-kitchen.js`), the house fridge: **Umineko**, the town's own lager. Decided against Kame draught because every
  other piece of the town already said Umineko: Sakura's account with Minato ("Umineko lager, kegs and bottles",
  `commerce/merchandising.js`), the economy's keg and bottle that Minato's ¥450 mug and ¥600 bottle are priced from
  (`economy/goods.js`), Thao's own summer poster, the crates to Sato Ramen, the Coral Bay Bar and Mr Fujita. A Kame
  draught would have left all of that pointing at a beer Minato no longer poured. **Umineko is Johansson Brewery's**
  (Nago), like the machines' Kame, Jugon and Tako, so the town's beer is one company: `izakaya-beer.js MINATO_BEER` (brand,
  brewer, from, who, why), a line in `vending-catalogue.js`. The tap's badge is Umineko's green (#38523d), not a blue.
- **The red-and-white beer can on Minato's and Sato Ramen's posters** (brand-rules' "livery" known issues): repainted in
  Umineko's own paper, ink and accent. While there: the sun on Minato's poster covered the end of 夏だ！ウミネコ, and the
  can's UMINEKO ran past the can on both posters; both fixed.
- **Zuisen and Kumesen (real awamori distilleries)** on the bottle keep and the player's kept bottle: **Shimakaze**, the
  island's awamori that Sakura supplies (Chin; the player), and **Shimakaze kūsu**, its aged one (Mr Higa).
  `izakaya-dressing.js RENAMED_KEEP` renames a bottle kept in an old save the first time the keep is opened, pours kept.
- **Spam:** luncheon meat (Sakura's pork-tamago note, the gōya trellis, the yard's gōya, a neighbour's line). The town
  already called the depot's tins "tinned pork" and the storyteller "luncheon meat".
- **A&W (Okinawa's root-beer drive-ins):** the **Shisa Drive-In** in Naha (three chat lines, the city's neon).
- **Tamagotchi:** the **Pocket Piyo**, an egg-shaped key-ring chick from the same imaginary hand-helds as the Pocket
  Gentleman and Pocket Lady cameras (chat topic id `pocket-pet`; ids were never saved).
- **The Hawks (a real pro team) on Tetsuo's radio:** the **Habus**.
- **NHK:** **JHK Okinawa**, the public broadcaster by the Acme rule (Johansson Hōsō Kyōkai): the typhoon bulletin, the
  house television, the magazine's TV listing (beside Shima TV, Southwest Broadcasting and MinatoTV).
- **Okinawa TV** on Sato Ramen's autograph board: **Shima TV**. **The Ryūkyū Shimpō** round Thuan's tuna head: **the
  Minato Shimbun**. **Purikura** in the magazines: photo-sticker. **"Harley Tournament"** on the school's board was the
  Hārī mistranslated: **Hārī boat race**.
- **The postman's Super Cub** (Kuro's purpose in the Studio's prop registry): the postman's red motorbike. **A Johansson
  Washlet**: a Johansson bidet seat. **Thermos** (a maker's name in Japan): flask, in the house, the police station, the
  storyteller's places and Mori's guide article (the guide's catalogue refreshed with `render-resident-guide.mjs
  --catalogue-only`, portraits kept). **Risograph** (a look's label): Stencil print (its id stays `riso`). **Excel** on
  the office workbooks' download: the spreadsheet (.xlsx). **Asahikage** (the real police emblem) in the station's
  dressing: the harbour-moon emblem, as `police-data.js` draws it. **IKEA** in the furniture's scene names: Town side
  table, Home furniture, pine cabinet (`ikea-furniture.js CALLED`).

## Kept, and why
- Real places; Orion as the night sky (none in the text today; a sense in the test lets it through); Asahi as a street.
- **Not brands:** laserdisc (a medium), the onsen's bandai counter, awamori, chūhai, ramune, root beer, cup noodles
  (generic; the brand is the singular Cup Noodle), the Konami-style cheat code on a magazine page (a code, no name).
- **Ordinary words that are also brands** (national, sharp, canon, citizen, boss, hope, peace, crown …): left to the
  reader; brand-rules.json `leftOut.words`.
- **Outside the World, with their reasons in the test's ALLOWED:** the credits (IKEA's furniture models, as their terms
  ask), the real-money shop (Shopify), the install help (iPhone, iPad), Studio's device record (`by:'ipad'`, 'iPad
  Safari'), the speech voice "Google Japanese" matched for Thuan, the ferry's engineering references (Yanmar, Mitsubishi:
  research data never shown; the fitted engine is the fictional Johansson Marine JM6-160), `RENAMED_KEEP`'s old names.
- **Real people, not brands:** a neighbour hearing Amuro Namie on the radio (`chat-lines.js`). Left; the owner may want a
  fictional singer.
- **Other repositories:** the owner's YouTube videos on Minato's television (branch `tv/youtube`) are a real service by
  his request; "youtube" is not listed, so that branch's file names pass.

## Bitmaps and assets not changed
- `assets/models/furniture/ikea-lack.glb`, `ikea-ivar.glb`: the downloaded product models (no brand is printed on them;
  the World loads the `town-*.glb` variants under neutral names).
- `assets/images/feed/sato-ramen*.webp`, `minato*.webp`: comic backdrops captured before today: Sato Ramen's shows the
  old red poster and a red-and-white can on a table, Minato's ORION on its bottles is not legible at their size. They are
  generated, not the owner's art: re-capture with `tools/render-feed-backdrops.mjs`.
- Looked at and clean: the izakaya's and advertising posters (`assets/graphics/izakaya/`, `advertising/`), Sakura's
  trade posters, the vending cans. Not looked at one by one: `assets/magazines/*.png` (manga pages and posters).

## The guard
- `data/studio/brand-rules.json` version 2: `about` says the ruling covers the whole World; `brands` grown from 56 to 324
  (drinks, Okinawa's own brands and distilleries, snacks, shops, tobacco, vehicles and fuel, electronics and toys,
  household names, clothes, papers, broadcasters, teams, airlines, cards, phones, web); `kana` to 133 (substring
  forms only where unambiguous: no ファンタ in ファンタジー, no キリン the giraffe); `contextual` for 22 brands that are
  also a street, a city, a god, an era, a surname or a word here (the Studio does not refuse those); `knownIssues` empty.
  `copiedFrom.note`: **jojo's `town-studio/modeller/rules.json` should be brought in step with this list** (not done:
  other repositories untouched). This repository's copy of it, `src/studio/modeller/rules.json`, is unchanged; the
  modeller reads World's list through `extraBrands`.
- `tests/no-real-brands.test.mjs` (in `tests/ci-guard.txt`): every string and template text of src/ (comments, regular
  expressions and module paths are not read; base64 tables are skipped), the JSON of src/, data/ and guide/, the root
  content files, index.html and the Studio's page. `SENSES` (each ordinary sense, blanked out before the word is looked
  for again, so "Mr Honda's Honda" still fails) and `ALLOWED` (a file, a context and a reason; one no longer needed
  fails). It also checks Minato's beer against Sakura's account and the economy, and an old save's kept bottle. Against
  the sources before the replacements it lists all 54 uses that were there.
- Updated: `studio-data.test.mjs` (the list's length is `copiedFrom.grownTo`, lower case, no repeats),
  `studio-mcp.test.mjs` (validate reports no known issue), `izakaya-beer`, `living-town`, the two izakaya MCP tours.

## Proved
- `node --test` on no-real-brands and 31 related files (izakaya ×8, living-town, chats, happenings, feed, guide ×2,
  sato-ramen ×3, police, magazines, looks, label-spec, open-can, vending-beer, english-language, town-economy,
  merchandising, studio-data, studio-assets, asset-modeller, halloween-street, minato-compact): all pass except, as on the
  base commit, `office-workbooks` (a cached cell 'Harbour master' against 'Sverker') and `studio-data`'s two tests that
  read the parent folder's other checkout. Neither is in the guard.
- **Hand shots** (`node tools/hand-shots.mjs --can 1.5,5.0 --name Johansson --bought "Umineko lager" …`):
  `art/brands/review/hand-umineko-before.jpg` (the plain back panel faced out at the chest and the lips) and
  `-after.jpg` (`bought-can.js shopPrint` turned half round as the machines' cans were: the label, "Beer" and the gull face
  out while he opens it and drinks).
- **In the game** (software Chromium, the source tree, 19:00 in Minato; a short script on `tools/izakaya-bar-look.mjs`'s
  set-up, which now serves this checkout): `art/brands/review/izakaya-umineko.jpg`: the drinks menu ("Umineko draught,
  medium mug · ¥450", "Umineko large bottle · ¥600", "Umineko can · ¥300"), the large bottle at the booth reading
  UMINEKO · LARGE BOTTLE, Minato's and Sato Ramen's posters, the bottle keep.
- **CI guard** (`node tools/ci-guard.mjs --test-concurrency=3`, 138 files, 873 s on a machine shared with another guard):
  745 of 746 pass; the one failure is the published runtime package (not rebuilt on a branch, expected). The resident
  guide's portraits pass (the catalogue was refreshed without rendering).

## Remains
- The owner has seen none of it; the runtime is not rebuilt (`npm run build:runtime`).
- Re-capture the Minato and Sato Ramen comic backdrops; decide on the real singer in the chat line.
- Minato's wall menu strips (`minato-compact-room.js`, not touched: the TV helper's file) spell the drinks' English
  names down the strip letter by letter, as they did with the old names; `okinawa/signs.js SIGN_JAPANESE` has no entry
  for them (生ビール 中ジョッキ, 大瓶, 缶ビール would read as Japanese).
- Bring jojo's brand list in step.

# 27 November, afternoon: two comic backdrops left stale on purpose

- **Stale:** `assets/images/feed/sato-ramen*.webp` still shows the old red-and-white beer poster; `minato*` has bottle
  labels too small to read. The brand sweep asked for both to be re-captured.
- **Why they stay:** `tools/render-feed-backdrops.mjs sato-ramen minato` no longer frames these rooms. The rooms have
  moved since the views were made:
  - Minato's views now look into a corner and find Sato Ramen's counter seats;
  - Sato Ramen's push view sits on the counter.
  So `tests/feed-seating.test.mjs` fails ("residents sit on real seats", 1 of 2). The capture was reverted.
- **Remains:** fit the capture's cameras to today's rooms (`src/feed/places.js`), re-capture both, and keep
  feed-seating green.

# 27 November, day: Johansson's aloha shirt, phase 1, the plain-blue block-in (branch `shirt/aloha`)

The owner's brief, "Johansson World | Aloha shirt brief": shape the shirt before painting the flowers; then the print with a
deliberate rhythm; then the print behaving like fabric; then checks in Sakura Shop. Phase 1 only, for the owner to see the
plain-blue block-in before the print goes on. Not pushed, not on `main`.

## Done
- **The shape is one spec, `garment.js KARIYUSHI`.** The plain block-in is the recipe with `outfit.pattern: 'none'`
  (`tools/hand-shots.mjs --set outfit.pattern=none`, as `avatar-turnaround.mjs --set` already had).
- **The collar** (`build.js alohaCollar`), one piece of cloth: a narrow band round the nape whose fold stands a little up
  the neck (18 mm behind, 11 mm at the sides) and whose fall lies 36 mm over the shoulders and back, its outer edge springing
  off a little; at the front it folds into two short points over a small V, no notch. It is drawn on a chart of the body
  round the neck (`collarChart`: the torso's own meridians, the neck's foot spanned), as a strip between its inner and
  outer edges (`collarStrip`), with a top, an underside 6 mm off the neck and 4 mm off the shirt, and an edge all round.
  The shirt's V, the tank top in it, the collar's painted shadow (now all round), the placket and buttons follow it.
- **The body** (`build.js alohaBody`): below the chest (`top`, t 0.56) the shirt is cloth of its own, falling from the
  widest of the body above, clear of the waist, easing out to a level hem at the upper hip (16 mm above the hip joint),
  turned 6 mm, its inside drawn up to the waist in the cloth's shadow. It enters the chest steeply (3 mm in to 1 mm out
  over 2 mm) so the two cross in one clean line. The torso under it keeps its own line and outline: a tuck or a faded ink
  under the shirt stood out from the game's camera as a dotted ring. The shirt's own ink comes in over its first 2 cm (at
  full width at once, its open top showed specks from behind and above). Under it, below the shirt's inside, the torso is
  his tank top (or skin); the swing quarters now start at t 0.2 (`springs.js hemSpec`).
- **Ink:** the outline is drawn by an inflated copy's back faces, so anything inked that tucks in or fades out going down
  shows from above as a line or dots. The collar's underside has none (it stood into the neck and came out in specks in
  the walk); under the kariyushi the neck's ink fades over its lower 18 mm, under the collar's fold, not 30.
- **Under the short sleeves** the arm is the sleeve's inside, darker, down to just above the hem: no bare patch when the
  arm is raised. `tests/underarm-coverage.test.mjs` passes now (all short-sleeved tops, both bodies).
- **Measured, before → after** (Johansson): collar top above the neck's base 34 → 19 mm behind, 34 → 27 mm at the sides;
  the neck showing under the jaw in profile 63 → 68 mm; V 165 → 111 mm deep, about 120 → 114 mm wide; points 157 → 140 mm out
  and 77 → 54 mm below the neck's base; pocket 103 × 100 → 84 × 77 mm, 117 → 112 mm out, its middle 224 → 197 mm below the
  neck's base; hem 28 mm below → 16 mm above the hip joint (shorts showing 95 → 139 mm); air at the waist 0 → 14 mm in front
  and behind, at the hip about 10 → 34 mm. The sleeves are as they were: 90 mm openings round a 63 mm arm, 120 mm down it.
- **Tests** (`avatar-polish`): the collar is low (its top under 30 mm above the neck's base, 60 mm and more of neck under
  the jaw, the V 80-140 mm), the body falls free of the waist to a level hem above the hip joint with its inside, on
  Johansson, Vy and Sverker. The collar-under-the-arms test, the stand outside the neck, the neck's foot and the tank top
  still pass.
- **Tools:** `avatar-turnaround.mjs` serves the Town from its own checkout (a worktree's parent is not the Office site),
  as `hand-shots.mjs` does; `hand-shots.mjs --moves` swings the hems on their springs as the game does.

## Not done (phases 2-4)
- The print (Johansson's own layout; the tiled `flowers` stays for everyone else), the print as fabric, the checks in Sakura
  Shop at the gameplay camera.

## Seen, not fixed
- Close up (under a metre), a faint line where the shirt's body leaves the chest, clearer when he arches back (Stretch).
  Not seen at the gameplay distance.
- At the gameplay distance the collar's fold line behind the neck is a thin outline that breaks into dashes in the walk;
  for phase 3 (the outline treatment).
- Seated, the shirt's front hem goes into the lap: the thighs come up past it, and the hem quarters' spring tips sit
  between the thigh spheres, so nothing pushes them out. So it was before (the old hem was lower still).
- The Kikkou ink (Sakura) draws the collar's band behind the neck faintly at full-figure scale.
- The shorts' crotch, where the leg tubes meet the torso lathe, draws two dark slanted lines in front; the higher hem shows
  more of the shorts. It is the shorts' construction, not the shirt's.

# 27 November, day: Johansson's aloha shirt, phases 2-4, the print, the print as fabric, the checks (branch `shirt/aloha`)

The owner approved the phase 1 block-in ("Yes, proceed. I want proceed."). Not pushed, not on `main`.

## Phase 2: the print with a deliberate rhythm
- **`outfit.pattern: 'aloha'`** (appended to `recipe.js PATTERNS`, so no saved look moves; the maker calls it "Aloha"), worn
  by Johansson (`cast.js`). Everyone else's `'flowers'` is the tiled print it was.
- **`garment.js ALOHA`**: one blossom (five rounded petals, each a little uneven; warm cream `#f7edd4`, a faint crease where a
  petal lies over the next, a golden eye `#ecb12e`) on the recipe's sky blue, and eight blooms placed by hand, each with its
  angle round the body, its height, its size, its turn and why it is there. `alohaLayout` says where each lies on a body.
- **Laid on the cloth as worn**: `stamp` measures the texels round each flower on the garment (`shirtSurface`: the chest's
  lathe, and below it the kariyushi's own body, `kariyushiBody`, now the one place its rows are worked out, read by
  `build.js alohaBody` too) and draws through the inverse, so a flower is round on the body.
- **Each sleeve has its own band** of the garment texture (`GARMENT.SLEEVE`, `SLEEVE_R`; the texture is 512 x 448, each
  band as many texels as the shared one had), so one sleeve can carry a bloom. Every other print paints both alike.
  `sleeveUV` now takes the angle round the arm's axis, not round the shoulder end's upright (the hem's print was askew by
  up to a tenth of a turn). `shortSleeve` is the one spec of a short sleeve's tube.
- Under a kariyushi the torso below its body is not printed (whole triangles sample the empty strip), so nothing of the
  print shows under the hem or on the shorts; under the aloha print the underarm gussets are plain cloth.
- `tests/aloha-print.test.mjs`: the placement's intent, measured on his body.

## Phase 3: the print as fabric
- **Matte**: the body is the town's toon material (no highlight). The flowers lie on the cloth and move with it; a flank
  bloom narrows, goes round his side and comes back as he turns (the turn strips).
- **Mipmapped garment texture**, kept premultiplied by its alpha (`build.js bodyMaterial`): with one level, the petals,
  buttons and fine lines skipped texels as he walked off; close up the full level is drawn as before, and an edge between a
  drawn texel and an empty one no longer filters to a dark fringe. Parts that sample the empty strip never step down a
  level (their UV is one point).
- **Quieter than his face** (the kariyushi only): the placket, the pocket and the hem's stitch in a blue a little darker
  than the cloth and finer than any ink; the shell buttons a pale blue near the cloth, the wooden one smaller and softer;
  the sleeve's turned hem a little paler, its fold a quiet line.
- **The heavy band across every short sleeve was the sleeve's lining** standing out through the wall (`sleeveTube`): a
  straight cylinder from the hem while a roomy sleeve narrows above it. It follows the wall now, 7.5 mm inside, on every
  sleeve, cuff and trouser hem that uses it.
- **A restrained shadow under the sleeve hems**: on a kariyushi the arm is a shade darker (0.88) for 22 mm below the hem,
  between two rings of its own (`limb` `rings`, `HEM_SHADOW`), so the band's edges are lines; under the collar, the painted
  shadow it had, its edge softened by most of a texel (drawn hard, its long level edge came out close up as a row of teeth).
- **The dashed fold behind the neck** (phase 1's "seen, not fixed"): the fold's own edge had ink, whose shell, 6 mm off a
  neck of flat facets, went in and out of it. The fold has no ink now (blue meeting skin draws it); in the walk strips at
  the game's distance it is one line where phase 1's broke into dashes in every frame. The collar's edge wall is lit one
  way across its height.

## Phase 4: checked in Johansson World
The sheets are in the session's scratchpad (`shirt/p2/final/`), not in the repository; the tools that made them are beside
them (`turntable.mjs`, `motion.mjs`, `motion-far.mjs`, `texdump.mjs`, `sakura4.mjs`: the running game from the worktree's
source, `SHIRT=none` swaps his recipe to the plain block-in as it is served, `LOOK` the game's look, lenses checked clear
with the game's own `probe`).
- **The placement**: `placement-chart.png`, the texture with each bloom labelled and the band under the face kept clear.
- **Turnaround**: `turnaround-plain-vs-aloha.png`, front, three-quarter, side and back at one scale in the game's shader,
  phase 1's plain block-in above the finished shirt; `turn-final.png` all eight. The collar holds from point to nape and the
  sleeve from shoulder to opening, all round.
- **Motion** (`motion/`): idle, walk, a turn on the spot and a turn into a walk, front, back and side, and close on the nape
  and the hem. The flowers move with the cloth; the flank bloom narrows, goes round his side and comes back; the hem stays
  over the shorts; nothing pokes through. `walk-nape-compare.png`: the fold behind the neck, phase 1 dashed, now whole.
  `far-walk-shimmer.png`: eight walk frames at 8 m, one texture level against mipmaps (the pocket, buttons and petals
  flickered; now steady).
- **In Sakura Shop, its own light and the reference's look** (`sakura-plain-vs-aloha.jpg`, `sakura-aloha-sheet.jpg`):
  - At the top-left reference's size against the stocked shelves, his face (brows, eyes, stubble) draws the first glance and
    the blue shirt, its flowers low, the second.
  - Close in front, nothing bright lies across the shoulders under his face.
  - From the game's own camera behind him (2.2 m, over his right shoulder), the back's readable flower and the small one
    above it show above the crates by the door; the lowest is behind them.
  - The plain block-in is shot with the same lenses (its recipe swapped as it is served).
- **Measured on the materials**: the face's ink and eyes are the darkest marks; the placket, the pocket and the buttons sit
  a step off the cloth, and the sleeve hems no longer carry the dark band (`sleeve-band-before-after.png`).

## Seen, not fixed
- Close up, a few specks remain at the nape, where the neck's outline (11 mm thick at full ink, faded over the lower 18 mm
  under the kariyushi) passes the collar's fold; not seen at the game's distance.
- Faint dotted lines on the shoulders at the game's distance, from behind (the sleeve's round top meeting the shoulder
  cap), as in phase 1.
- The collar shadow's soft edge uses the canvas's `filter`; a browser without it draws the edge hard, as before (the teeth
  close up only).
- Phase 1's other items stand: seated, the front hem goes into the lap; the shorts' crotch lines.

## Proved (27 November, the branch's last commit)
- `tests/aloha-print.test.mjs` (7, now in the guard), `avatar-polish`, `underarm-coverage`, `vy-reference`: pass.
- Phase 1's wider avatar list with those: 210 tests, 202 pass; the 8 that fail failed before this work (the vest's straps
  and tenugui, Thuan's supporting foot, the batch-1 sets' draws and moves, batch 2's and batch 3's standard check S, the
  hair clip).
- `node tools/ci-guard.mjs`: 136 files; it fails the published runtime and the residents' portraits (rebuilt when this is
  published). Four files ran out of time or were killed while other sessions' tests loaded the machine (load 18):
  `drink-can`, `floor-sit`, `no-z-fighting`, `boot`; run again alone, all 30 of their tests pass.
- `recipe.js PATTERNS` gains `'aloha'` at the end (`wardrobe-batch2` holds the list).

# 27 November, evening: Johansson's aloha shirt, a real Hawaii shirt (branch `shirt/aloha`)

The owner: "The shirt you may look like a dress make it look more like a real Hawaii shirt". Not pushed, not on `main`.

## Measured, why it read as a dress
- The body flared from the chest to the hem: 140 → 161 mm half-depth in front and behind (21 mm out each side, an
  A-line), the sides 233 → 227 mm (straight from the front: the dress read was the side and three-quarter views).
- The hem was 16 mm over the hip joint and 61 mm under the shorts' waistband: 142 mm of shorts showed on legs of 522 mm,
  the shirt 573 mm from the neck's base. With his big head and short legs it read as a long tunic.
- Eight flowers on broad blue: a plain tunic, not an aloha print (the owner's reference sheet had the tiled print).
- Sleeves (unchanged, they already read): 118 mm long, ending 111 mm above the elbow, a 90 mm opening round a 60 mm arm.

## Done
- **Shape** (c9751ad; `garment.js KARIYUSHI.body`, `kariyushiBody`, `kariyushiHemY`, `build.js alohaBody`,
  `springs.js hemSpec`): boxy and straight, 6 mm clear of the body and 5 mm of ease in front and behind, the side seams
  0.7 of the way out to the chest's width; the level hem covers the shorts' waistband by 3 cm on every body (`cover`, set
  from the waistband, so Vy's is right too). After: hem 45 mm over the hip joint, 31 mm under the waistband, 171 mm of
  shorts showing, 544 mm from the neck's base; 150 mm half-depth at the hem against 140 at the chest, 234 mm half-width
  against 234. A vent at
  each side seam, 32 mm high, 18 mm wide at the hem: the hem, its turned edge and the inside rise in a V there, and one
  sheet facing out shows the inside's shadow in it, edge to edge with the inside's own V (never two faces in one place,
  JSY-STD-403 rules 3, 4 and 7). The collar is as approved.
- **Print** (2740ace; `garment.js ALOHA`, `alohaPrint`, `paintPrint`, `clothFrame`): the heroes where the brief put them
  and the print's largest flowers; round them an all-over print tossed on a fixed low-discrepancy sequence (R2: the same
  every time, no grid, no rows), 20 smaller blossoms on the body and 7 on the sleeves, dense up to the chest and thinning
  toward the shoulders, none above 0.68 of the torso, on a sleeve's top or under the arms; tonal leaves (`#5a91bb`, a
  deeper blue, quieter than the cream) behind every blossom and in pairs in the gaps, about 180. The widest field of
  plain blue is 49 mm from a motif (was 291). The pocket is pattern-matched (its stitching only), the buttons coconut.
  Two hero companions moved to keep blue between them (`flank`, `back-low`, `back-high`), the large one a little up and
  off the placket, clear of the new hem.
- **Passes** (sheets in the session's scratchpad, `shirt/p5/`, not in the repository): print pass 1 (`p1-*.png`), dense
  to 0.7 and on the sleeves' tops: a bright row under his face, front and back; pass 2 (`p2-*`), nothing above 0.62:
  the cream in a band round the bottom, a stripe of flowers; pass 3 (`p3-*`), thinning out to 0.68 with smaller ones high
  up: the gradient kept. Reshape pass 1 (`r1-*`): the vent at 26 mm read too small, so 32.
- **The pair poses read the shirt's air** (`pair-poses.js bodyOf`: how far the clothes stand off the chest, the 90th
  percentile of the chest's and spine's points, clamped to 6-18 mm): with the shirt 3 mm off the body it fell from 7.6 to
  4.9 mm, the pair came 1.3 mm nearer and in Fight Thuan's body met Johansson's collar points, 6.8 mm in (the limit is
  6). The shirt is 6 mm off the body now (`gap`): 7.9 mm, and `pair-poses` passes. A shirt brought nearer the body moves
  every pair pose that holds him.
- **Tests**: `avatar-polish`'s hem test now says boxy (no more than 12 mm off the widest of the body above the hem, on
  Johansson, Vy and Sverker; the old shirt fails it at 21 mm), the hem 15-45 mm under the waistband, level but at the
  vents, a vent at each side seam 20-45 mm high. `aloha-print`: the hero placements stand; "broad blue between groups",
  "the other sleeve is plain" and "one flower above the chest" gave way to blue between every two blossoms but no bare
  field over 6 cm, both sleeves printed and none on the arm's inside or a sleeve's top, nothing above the yoke and few
  and small high up, thinning upward, tonal leaves, the pocket pattern-matched.

## Proved (looked at)
- `turnaround-before-after.png` (four views at one scale, old above new), `silhouette-before-after.png` (black; the side
  view's trapezoid is gone, straight now), `torso-before-after.png`, `sakura-before-after.jpg` (the reference framing,
  the game camera front and behind, the back; the running game from the worktree's source), `motion-front.png`,
  `motion-back.png` (idle, walk, turn, sit, walk and turn: the print stays on the cloth, nothing through it),
  `r1-hem.png` (the vents close up).
- `node tools/ci-guard.mjs --test-concurrency=2` on the branch's last commit: 136 files, 736 tests, 734 pass; the two
  that fail are the published runtime and the residents' portraits (rebuilt when this is published); none ran out of
  time. (The run before the 6 mm gap failed `pair-poses`' Fight as above; run alone after it, it passes.)
- The wider avatar list of phase 1 with the shirt's own files: 211 tests, 202 pass; the 9 that fail are the ones phase
  1's record lists (the vest's straps and tenugui, identical on 2dd979c; Thuan's supporting foot; the batch-1 sets' draws
  and moves; batch 2's and batch 3's standard check S, two each; the hair clip). None is the kariyushi.

## Not done
- **Seated, the front hem still goes into the lap**: the shorts' thighs come up 46 mm through it (78 before). The hem
  quarters' spring tips sit between the thigh spheres, so nothing pushes them. A fix in `springs.js createSprings`: from
  the thighs' rotation in the hips' frame, find the smallest forward turn of the hem's front and side quarters' targets
  that clears the shorts (legR × 1.27) over each thigh, about 22° seated; with the swing starting at 0.2 of the torso,
  linear blend skinning folds the rows just under the waist by a few millimetres, so start the swing at 0.3 (the rows
  then compress without crossing). Not started: test it on the lap with a penetration measure first.
- Close up (under a metre), the turned edge's ink shows as a dashed line on the shorts just under the hem; it did before.
- Everything in "Seen, not fixed" above that is not the lap still stands (nape specks close up, the shorts' crotch lines).

# 27 November, night: stage 4 begun, squash on impacts, the jump, Talk (branch `anim/stage4`)

From `claude/dreamy-ritchie-cxufpl` at 00e0c0c, with 0118a61 (the owner's aloha shirt) merged in part way. Not pushed.
Stopped at a committed, passing state with the rest written here: the session's context was near its end. What each change
does and why is in `docs/ANIMATION-STANDARD.md` section 6, "Stage 4".

## Done
- **Squash on impacts** (`animate.js` `SQUASH`, `squashStep`): 0 → 15 of 15. The spine shortens about the hips and widens,
  the chest takes the inverse; everyday 2.5-4.5%, comedy 11-17%, by the fall's speed; volume 155 of 155 still.
- **Jump** (`JUMP`, `jumpMove`): keyed on its legs. The crouch reaches the hips with the feet planted and flat; the take-off
  with bent knees; a parabola measured on the soles (`calibrate`); a landing into a squat. The player's physics jump gives at
  the knees after the scene lands it. It now fails only overlap (a planted foot holds its knee to its thigh), which is kept.
  `foot-ground.js`: `lift` for a jump; the foot supports built once a body.
- **The seat's edge** (`seat-support.js`): soft while sitting down or standing up, hard once still. SitDown's 10-14 mm step
  in a frame is gone.
- **The shirt merge's stance-release failure** (the coordinator's fix first): the pocketed forearm in the trunk's wind-up is
  measured against the body and kept no deeper than at the stance (`forearmDepth`); the shirt unchanged.
- **Talk** passes every check: a natural raise, the sway eased in and curved, a small unheld dip. Hands behind the back held
  through the trunk's wind-up: Point, ChinTap and Clap pass anticipation on Sverker.
- `tools/hand-shots.mjs`: `--strip 0.72:2` (a landing's frames), `--fixed` (the camera where the body began).
- Commits: 33ad065 (squash, Jump, seat), cfad576 (the merge), 559e5ef (the wave's other hand), 4601fbd (Talk, the stance
  behind the back), then the handover and the shared foot supports.
- Baseline 1062 → 1010 entries, none added. Every check 7 → 8.

## Proved
- `node --test tests/animation-principles.test.mjs`: 8 of 8 at each commit.
- Guard tests that play the changed moves, at 4601fbd: 65 of 65 (animation-principles, stance-release, wave-gesture,
  vy-reference, pair-poses, npc-seating, context-actions, sakura-dialogue, aloha-print, avatar-polish, conversation-eyes);
  the seat tests (seated-pose, bench-two-seats, player-seating, floor-sit, pair-poses, stance-release) 20 of 20.
- The full guard and the 55 files outside it: below, under "Proved, last".

## Found
- **For the shirt helper (`springs.js`, read, not changed):** the aloha shirt's hem swings at most 2.3° through a whole jump
  and 0.8° in a frame (`SWING.hem`: stiffness 0.3, damping 0.24, limit 14°). Its follow-through after a landing hardly shows
  ("After landing, the squash ripples through secondary elements", squash-stretch-mastery). Softer, or a little mass, would
  show it; that is the hem's own setting to change.
- The squash's chest counter-scale is exact only while the chest is not turned against the spine: S·R·S⁻¹ shears the upper
  body by about (1-(1-s)^1.5)·sin(lean). Everyday (4.5%, a 0.2 rad lean) about 1%; comedy at 17% with a 0.3 rad lean about 7%,
  for a few frames. Tada's sheet does not show it; a hard comedy landing leaning far over might.
- The audit counts a jump's legs in the overlap from its first frame because the feet leave the floor later; a planted crouch
  cannot pass (the knee and the thigh start together to keep the foot where it is). The audit's rule is the standard's; not
  changed.
- The player's jump (characters.js) flies 0.8 m high at 4.25 m/s from the first frame; no crouch can come before it within
  100 ms, so its anticipation is the push's pointed toes and the arms. The squash and the give at the knees sell its landing.

## Remains (stage 4, in order)
1. **Anticipation for the rest.** Try a move in `WIND_TRUNK` (its own `TRUNK_OWN`: `share`, `hold`, `behind`) and audit it,
   then every move: entries off, none added, and `stance-release` passing.
   - Laugh (Vy no depth; Sverker's wind-up stroke curves 62%), Bow (try `TRUNK.rooted` with a share under 7%), HairTuck
     (Sverker's hand from behind the back past a half circle; the stance is now held through the wind-up, try again),
     HeelRock and DramaFinish (levels out of order), CollarTug on Johansson, the 13 from stage 1, SitDown and StandUp.
   - Kachashi and Shrug on Sverker: the behind-the-back hold may help or hurt; check.
   - What worked for Talk: a natural raise (`RISE`), any looping sway eased in once the raise arrives (so the raise is a
     stroke of its own), and the dip sized to the move.
2. Twins. 3. The 13 arcs entries from stage 1 and `ARCS_WITHOUT_DRAG` (Jump plays without the drag still; try it with).
4. The settle's micro-overshoot. 5. The lift's velocity steps in Eat, Drink and the seated versions, and Vy's run knee.
6. Stomp has no squash (its hips do not fall, so neither the animator nor the audit sees the stomp's impact).

## Proved, last
- **The full guard** (`node tools/ci-guard.mjs --test-concurrency=2`, at 4601fbd, 1680 s with other helpers' load at 9-11):
  777 of 778. The one failure is the published runtime package ("published runtime matches the current source"), stale
  on a branch until it is rebuilt. No file timed out.
- **The 55 animator and avatar files outside the guard** (each alone, two at a time, 15 minutes each; fun-poses left out as it
  runs past its hour), at the base 0118a61 and at the head 90ce252: every file fails exactly the same tests at both, test by
  test, none newly failing and none newly passing; none timed out. 37 pass at both. The 18 that fail, fail what they did:
  afterbath-outfit, avatar-floor-contact, avatar-wardrobe-sets, drink-grip (2), expressive-poses, ferry-engine-room-access,
  fujitas-back-moves, looks-data (2), onsen-noren-heads, onsen-seats, owned-vehicles (2), pole-hug (2), port-shed,
  story-gestures (2), wardrobe-batch2, wardrobe-batch3 (2), work-kit, izakaya-lived-in.
- 90ce252's shared foot supports came after the guard's snapshot: the principles test and player-seating pass on it (11 of
  11), and the 55 files above ran on it.

# 27 November, evening: the outstanding failures, data, tooling and the ferry (branch `fix/data-ferry`)

The owner: "Fix all outstanding errors". This branch took one group: the data and tooling files and the ferry's. From
`claude/dreamy-ritchie-cxufpl` at 1dfc816; commits b9da0a3 (data and tooling), 22f5f05 (the ferry), 50d99a3 (the guide's
portraits), then the guard list and this note. Not pushed; the runtime is not rebuilt.

"Old" means the file fails at fc7281f, the repository's first commit (7 November), run in a detached worktree; "new" means
it passes at the commit before the one named. Every test change cites the decision it follows, in the test.

## Data and tooling
- **products-data**, **studio-data** (1): products-data.js's FINGERPRINT was stale. 9ca68be (26 November, the renames)
  edited products.json and the module by hand. *Code (a generated file)*: regenerated with build-data's own generator
  (`productsModule`; see Found for why not its CLI). New.
- **studio-data** (2), "draft must be git-ignored": the test asked the site's repository about the town's paths. Since
  7 November the town is its own repository and the site's .gitignore leaves out all of /johansson-town/, so in the
  documented layout looks.json read as ignored too (shown in a scratch layout). *Test out of date (the move)*: each path is
  asked of its own repository (the town's for johansson-town/…, the site's for output/studio-mcp). Old. From a checkout
  outside a site checkout (here /home/user/jt-fix, whose CODE_ROOT is /home/user, no repository) output/studio-mcp cannot
  be answered: *environment*. 5 of 5 in the documented layout.
- **products-move**, four causes: Kissa Higa's new Sakura account (the owner, 30 October; old), the paused community
  kitchen, so the hall orders only the office's lines (31 October; old: the first failure at fc7281f), Grandmother Higa
  and the Harbour master renamed Christina and Sverker (26 November; new), beer in the machines (27 November, 08ed267;
  new). *Tests out of date*: a dated section each, asserting what must still hold (the shelf lines, every snapshot drink
  still drinks in its colour and leaves its empty, the kept cans keep every field) before taking the data's values.
- **studio-mcp** (11, validate and publish_check): `publishCheck` ran git at CODE_ROOT outside any try; here that is no
  repository, so the whole tool failed. In the documented layout it asked the site's git about the town's files (all
  ignored there, so "uncommitted" always read committed) and checked the site's main. *Code*: it asks the town's own
  repository (the checkout the tool is in) for its branch, main (FETCH_HEAD through --git-common-dir, so a worktree works)
  and files, the site's only for avatar-creator and .mcp.json; an unreadable repository is a failed item in words. Old (the
  code is fc7281f's). render_portrait passed once the avatar-creator symlink existed.
- **looks-data** (4), body.frame "unknown": Studio's look fields did not know the body kit's frames (1f675a0, 26 November),
  the tank top under an open shirt (6c349e4) or the eye's shine, whose default is absent. *Code*: `BODY_FRAMES` exported from
  recipe.js and used by normalizeRecipe and Studio; outfit.under is `UNDER_LAYERS`; eyes.shine a 0-1 number; head.scale
  0.7-1.3 as recipe.js reads it (it was offered as 0-1). New.
- **looks-data** (5), "Emi": the townsfolk profile Emi is Emi Nakamura, retired by the owner on 31 October; the test skipped
  only retired recipe names. *Test out of date*: a retired identity is asserted absent from the live lists. Old.
- **The guide's portraits**: looks.js and recipe.js are among their sources, so they were rendered again
  (`TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/render-resident-guide.mjs`; Playwright's own chromium-1228 is not
  installed here): 23 pictures byte-identical, only guide/portraits.json's hash changed.
- **office-workbooks: NOT FIXED.** service-work-log.xlsx's cached cell reads "Harbour master": 9ca68be renamed him in the
  builder (scripts/build-office-workbooks.mjs) and catalogue.json, not in the workbook. *Code (a generated file)*. The
  builder imports `@oai/artifact-tool`, which is not on the npm registry (404) and nowhere on this machine; the workbook was
  not edited by hand. New. Next: `node scripts/build-office-workbooks.mjs` where that package is installed (it writes the
  three .xlsx and catalogue.json's bytes and sha256), then the test.
- **controller-game**: the test expected the ferry landing at x -1.5 (written 30 October); the H1 arrangement (the owner,
  31 October, "Implement and push to main") moved the shore waiting point and the ferry opening to x 0.3, beyond the 4 m
  gangway's sweep. *Test out of date*. Old. (The trucker-cap 404 in the log is the test's stubbed fetch, a warning.) Past the
  landing the test imports ../../steam-deck/ui/controller.mjs, the site's: outside a site checkout that is
  /home/user/steam-deck, *environment*. 1 of 1 in the documented layout.
- **motor-bench**: ENOENT /home/user/motor-90l/motor.js. The test reads the site's own `motor-90l/` (nj22az.github.io), the
  town's sibling in the documented layout; that folder's motor.js and calc.mjs match the provenance's sha256. *Environment*;
  3 of 3 in the documented layout. Nothing was made outside the repository.

## The ferry
One cause for nearly all: the H1 arrangement (the owner, 31 October 2026; briefs/HANDOFF-FERRY-ENGINE-ROOM-H1-2026-10-31.md)
raised every deck over the engine room a metre (car deck 2.1 m ship-local, the lobby 6.5, the forecastle tops 4.56), and
code and tests kept the old heights. None came from the z-fighting overhaul: all but the design book fail at fc7281f.
- **owned-vehicles** (3, 4) and **airport-ferry** (8), stuck at "securing", "The car door has no clear, supported exit":
  vehicle-driver.js walked a driver to a passenger point at 5.5 m, a metre under the lobby floor, so no exit had a route.
  *Code*: the upper deck's height (`FERRY_DECKS.upper.y`); ferry-crew-walk.js's obstacle with no height stands on the car
  deck, not at 1.1. Old (fc7281f aims at 5.5 with the lobby at 6.5).
- **ferry-driver-securing** (1, 2): the test parked the car at 1.1 and expected 5.5. *Test out of date* (with the code
  fix). Old. **ferry-crew-tasks** (8): a start at 1.1, under the deck; tests 7 and 9 probed under their floors too and are
  moved to 2.1 and 6.5. *Test out of date*. Old. **ferry-forecastle** (1): the stations at 3.56 against the tops at 4.56
  (H1: "forward crew station derives from actual forecastle floor"); test 3's car at 1.1 moved too. *Test out of date*. Old.
- **ferry-engine-room-access** (2), "ladder at x 3.19": the ladder's walking band was the old 0.75 m ladder's fixed
  0.34 m half-width; H1's ladder is 0.8 m clear. *Code*: walked between its stringers' inner faces. Old.
- **ferry-johansson-marine** (2), "built: camshaft": H1 builds no open No.4 crankcase (its record: "Starboard crankcase
  stays closed") but the prompts still called it open. *Test out of date, and code*: the open-crankcase prompt and its
  sentence belong to the earlier arrangement only. Past that, "in the engine room: low table": the carpet room's low tables,
  tea cups and pothos (the owner, 3 November: "the accommodation needs to be more cosy") are cylinders too; the test keeps
  the engine room for machinery and puts the furnishings on the passenger deck. Old.
- **ferry-machinery-design** (5), "2.9 != 1.9": the test asserted the pre-H1 room, too low. *Test out of date, and code*:
  the report's deckhead is H1's structural underside (+3,600 mm, `FERRY_H1.deckhead`), not the car deck less 0.2 m: 2.7 m
  clear, 1.05 m over the machinery, the 2 m route met; the overhaul envelope and the removal path still unproven. Old.
- **ferry-ship** (11), "56 meshes" against under 40: the 17 over are the owner's Blender parts of 2 November, the
  pantograph wipers (twelve draws by design) and the navigation feeder's panel with its four switches; the rest is 39.
  *Test out of date*: those are counted exactly, the rest kept under 40. Old (56 at fc7281f).
- **ferry-design-book**: the H1-F2 side frames (53782b3) and the castings (399eaf3, 4397257), all 25 November, changed the
  machinery without redrawing the book. *Code (generated)*: `node tools/ferry-drawings.mjs` (two SVGs); `--check` passes. New.

## Proved
- Each file alone, in /home/user/jt-fix: products-data 3/3, products-move 3/3, studio-mcp 13/13, looks-data 6/6,
  ferry-design-book 4/4, ferry-crew-tasks 9/9, ferry-driver-securing 5/5, ferry-engine-room-access 4/4, ferry-forecastle
  3/3, ferry-johansson-marine 3/3, ferry-machinery-design 9/9, ferry-ship 12/12, airport-ferry 12/12, owned-vehicles 13/13,
  resident-guide 2/2. studio-data 4/5, controller-game 0/1, motor-bench 0/3 there (environment, above); in the documented
  layout (a sparse local clone of the site with a detached worktree of this branch at johansson-town/ inside it):
  studio-data 5/5, motor-bench 3/3 (at 22f5f05), controller-game 1/1 (at 50d99a3). office-workbooks 2/3.
- Tests that read the changed code, run alone: studio-apply, avatar-customization (34 with the data files, all pass);
  police-uniform, wardrobe-batch2, wardrobe-batch3: 21 of 24, the 3 the handover above lists as failing at its base.
- The fourteen files that now pass in a checkout anywhere are added to tests/ci-guard.txt.
- **The guard** (`node tools/ci-guard.mjs --test-concurrency=2`, the 157 files with the fourteen added, 2187 s with the
  machine's load at 9-13): 876 of 877. The one failure is the published runtime package ("published runtime matches the
  current source"), stale on a branch until it is rebuilt. Nothing was cancelled or ran out of time.

## Found
- **A Studio CLI run from a checkout outside a site checkout writes into another checkout.** build-data.mjs (and every
  tool on tools/studio/repo.mjs) takes CODE_ROOT three folders up and writes CODE_ROOT/johansson-town/…: from
  /home/user/jt-fix that is /home/user/johansson-town, the main checkout. Run once here, it rewrote that checkout's
  products-data.js (one fingerprint line); restored at once (`git checkout --` of that file; its tree was otherwise clean).
  repo.mjs refuses links, so a symlinked layout does not help. Run the Studio CLIs only from <site>/johansson-town, or use
  their exported generators.
- studio-data, controller-game and motor-bench pass in the documented layout (CI's) but not in a checkout outside one, so
  they are not in the guard: local runs here would fail on the environment. Add them if every local run is in the layout.
- ferry-ship.js's general arrangement still calls the engine room "Low: 1.9 m clear, and tall men duck under the pipes"
  with its top at 2.8 m, pre-H1 words and height that the design book prints. Not changed.
- The closed H1 crankcase lost the open-door scene of the owner's photographs (6o-3); if the owner wants it back, it belongs in the
  Blender model (the code's fallback still has it, under `!FERRY_H1_ENABLED`).

# 27 November, evening: beer from a glass, animated in Blender (branch `drink/beer`)

The owner: "How about a pint glass at the izikaya does it work?", then "Remake it follow Disney principles how should it look
when anyone drinks beer". From `claude/dreamy-ritchie-cxufpl` at e28d51b, merged with it at 00e0c0c (Umineko). Not pushed.

## The beats (everyday register; the comedy push only on the first "kaa!"; brief in `tools/blender/drink-beer-keys.py`)
Four parts joining on one pose (C: leaning in, the right hand on the glass where it stands on the counter), so the game plays
TAKE, then FIRST or SIP, then LET. Times (s) from each part's start, at the keys' own timing:
- TAKE 0-1.75: still 0-0.35; the eyes to the glass 0.35 (the head 5 frames after); the reach's counter-move (the hand down and
  back on the thigh) 0.45-0.62; the lean in and the reach on an arc 0.62-1.22; the hand slides on, closes 1.3-1.42.
- FIRST 1.75-8.35: still to 0.2; anticipation 0.2-0.5 (a breath in, a lean in, the glass rocked 5 degrees forward on its foot's
  front edge and slid 15 mm: the dip, 40% of the lift); the lift on an arc 0.5-1.25 (slow out, the elbow rising, sitting back);
  contact 1.25-1.4 (the head meets it); the gulp 1.4-3.2 (the tilt following the fill, the head back, the eyes shut, three
  swallows); off the lip 3.2-3.5 and down on an arc to his chest; "kaa!" 3.5-4.1 (brows up, the mouth open: the face's laugh;
  the shoulders up then down; the chin up then a nod); the foam moustache wiped with the back of the left fingers from his left
  to his right 4.0-4.6 (the hand up from his thigh in 0.6 s); the set-down 5.1-5.95 (up and back first, forward and down on
  an arc, the tap); still from 6.35.
- SIP 8.35-12.6: the same keys smaller and quieter: one swallow, no foam, a content breath out for the "kaa".
- LET 12.6-14.0: the hand off the glass, back to the thigh on an arc, the body back past upright and settling.
- Each drinks as themselves (`drink-beer.js BEER_STYLES`, by beat): gulpers (Mr Fujita, Masaru, Kai, Kōji, Ryo) quick to the
  glass, a 35% longer draught, the head 25% further back, a bigger "kaa!"; sippers (Thao, Christina) slower to it, a draught
  40% shorter, the head barely back, a content breath; Johansson looks at his dark beer 50% longer first, slow to the lips, a
  long draught, a slow satisfied breath out.

## The pipeline
- `tools/drink-beer-kit.mjs` (the seated body on Minato's stool, the counter, the glass's place, each glass and how the hand
  holds it, the beer's tilt-for-fill table from `drinking/liquid.js requiredTilt`), `tools/blender/drink-beer.py` (generated from
  drink-can.py's rig, bake and sheet code plus the beer's parts; `--vessel mug|pint|glass`, `--sheet`, `--frames`),
  `drink-beer-keys.py` (the brief and the keys). The beer in the Blender glass is the inside cut level in the world at the height
  that holds what is left (bisected), the head a slab on it. Writes `src/avatars/motions/drink-beer-{mug,pint,glass}.js` (v2: new
  face cues kaa, foam, swallow, shrug; contacts counter, hold, wipe, lean; reach paths mouthL, foot, spot, up) and
  `tests/drink-beer-*.verify.json`.
- `src/avatars/beer-hold.js`: the sockets (the mug by its handle's bar in the fist's hollow, the jug beyond the fingers; the pint
  wrapped as the can, tipped by its taper; the small glass 0.3 hand lengths out on the fingertips, the hand 0.62 of the wrap).
- `src/avatars/drink-beer.js`: the player (as the can's: the body by level weights, the wrists by the paths in the body's size;
  then the foot on this counter where the glass stands and stood as the motion has it, the rim on this lower lip with the glass
  tipped as far as the beer left needs, never through the counter, the back of the fingers on the upper lip); the right shoulder
  forward 5 cm with the lean (a reach); both up on the "kaa!"; the throat squashed 3.5% on a swallow (the neck's scale, volume
  kept); a slosh (the beer's surface a damped spring lagging the glass, `table-drink.js` fluid `surface`); a foam moustache (nine
  blobs on the head's own surface, 2.5 mm out, wiped from his left); per-person timing (`beerWarp`, speeds eased across beats).
  `createBeerTableDrink`: Johansson's glass at the counter (`actors.js drinkFromTable` with `animated`, which game.js sipDrink
  passes; without it the table performance, which `tests/drinking-game.test.mjs` keeps testing on a mug; TABLE_DRINK_KINDS +pint).
- The pint (`izakaya-serving-visuals.js PINT`, a nonic, black lager under a tan head) and Umineko Black on the menu
  (`izakaya-beer.js DRINKS.pint`, `BEER_SERVES`: who and why for the mug, the pint and the small glass); Thao pours it as she does
  oolong: the rack's pint glass (it takes the third mug's place), the cold store's black-lager bottle (in one big-bottle set's
  place), poured on the mat, the bottle back (`minato-bar.js BAR_ROUNDS.pint`, `blackLager`; `izakaya-bar.js fromStore`). Not on
  the wall's strips (Thao keeps one glass for him); MINATO_MENU is 17.
- `tools/hand-shots.mjs --beer pint --name X`: the game's sheets (key moments, strips of 8 frames over the lift, the gulp and the
  set-down, the third-person camera indoors).

## Numbers
- Blender: rim to lip max 5.2 mm (pint), 5.6 (mug), 7.4 (glass); the foot on the counter while there within 3.6 mm, at worst
  0.8 mm under its top in the rock; wrists within limits; the back of the fingers 5.5-32 mm off the upper lip across the wipe.
- Game, Johansson at the counter, all three glasses: the rim on the lip 0.0 mm over 135 frames (put right by 8.7-11.5 mm); the
  foot within 16 mm of its place while on the counter (the rock's 15 mm slide), never under its top, lifted 2-3 mm at most;
  the glass tipped at least what the beer needs on every frame it flows; the eyes shut for most of the draught; "kaa!"; the
  foam on and wiped; the slosh at the tap settles under 0.5 degrees in 1.5 s; the parts join within 0.005 rad.
- `tests/drink-beer.test.mjs`: 9 pass, 1 todo (below); in the guard list.
- The CI guard (`node tools/ci-guard.mjs --test-concurrency=2`, before drink-beer was listed): 759 of 766, 1101 s. Six failed
  that the branch then fixed and were re-run alone, passing: the drinking game's five (they test the table performance, which
  `animated` now leaves to them) and the English inventory (the menu's 大ジョッキ, now "jokki"). The seventh is the published
  runtime package (not rebuilt on a branch). The principles audit in it: as the baseline, nothing added (ease 123/154,
  anticipation 19/141, arcs 69/145, overlap 56/146, twins 63/129, squash 0/15, volume 155/155).

## Remains
- **The right elbow letting go** (the test's todo): 0.5 s into LET it swings 0.4 rad over five frames (0.127 rad in one; its
  speed steps 0.096 rad a frame, the limit 0.06), on the mug and the small glass, whatever the keys and the let-go easing were
  changed to; not found yet.
- **Other bodies at the counter:** only Johansson's arm reaches the glass where Thao sets it (the stool is 42 cm from the
  counter's edge and the body sits 10 cm back on it); the others come 2-5 cm short, with the lean in to 32 degrees and the
  shoulder 5 cm forward (`extraLean` finds no shortfall by the arm's length; the cause is not found). Residents keep the old
  drink from the hand.
- **A glass already in the hand** (residents at a venue, Johansson's small glass): built (`BEER_HELD`, animate.js) but off: fitted
  into a venue's 3 s drink step the glass came up 41-74 mm a frame and the mug's wall went 5-13 mm into Johansson's face.
  Venue-service's drink step would want to span the following rest step.
- **The handle hand** (fingers through the mug's handle, the thumb on top): not made; the mug is held in the fist round its bar
  (the fingers do go through the handle). A HANDLE shape in hand_model.py, the kit and build.js grip is next.
- **The kanpai clink** (optional): not made.
- The audit cannot play the counter performance (not a GESTURES move); Drink and SitDrink are unchanged (the held path is off).
- The coordinator's addition, the can's leftover audit failures (DrinkCan, DrinkCanOpened: ease on Vy and Sverker, overlap on
  all three since stanceStep): not started.
- The owner has not seen any of it.

# 27 November, night: the beer drink finished for every body at the counter (branch `drink/beer`)

The owner: "Remake it follow Disney principles how should it look when anyone drinks beer"; "anyone" is every resident. From
c58f5bd, merged with `claude/dreamy-ritchie-cxufpl` at 626f29a (the real Hawaii shirt, stage 3, the brand sweep, the TV). Not
pushed. Commits: e750767 (the pop), 21b265e (every body at the counter), 609feea (residents), 4741f33 (the merge), and the sheets.

## Found, and fixed at the cause
- **The pop letting go** (0.4 rad over five frames 0.5 s into LET): two causes in the bake. The hand's way from the glass to
  the thigh went out of the arm's reach as the body sat back, so the IK took the arm straight and bent it again in five frames;
  and where the arm was straight `settle_roll` dropped the upper arm's roll to none and gave it back, the elbow taking it. Now
  the way back is keyed every 0.1 s within 0.9 of the arm from the shoulder (`within_reach`), the take's counter-move goes back
  along the thigh, and the upper arm's roll is chosen over the whole move, carried across straight frames (`settled_rolls`).
- **Why the other bodies came short** (measured): (1) `motion.js normalizeMotion` dropped `fps`, so every widened contact in
  `drink-beer.js` (the foot on the counter, the wrist at the glass, the lip's approach, the wipe) and the can's ring and pocket
  for another body (`drink-can.js sizeContacts`) were empty: nothing brought another body's hand to the glass. (2) The kit
  seated the body 10 cm back on the stool where the game slides it 10 cm forward (the animator's `root.position.z = -slide` on
  a root the kit had turned to face +z), so Blender's counter was 20 cm further than the game's (the glass 0.58 m ahead of
  the root, not 0.39) and the lean 0.58 rad. The test and hand-shots placed the glass the kit's way.
- **The glass Thao sets down** was left as her hand had it, 46 degrees off; a mug would have turned round in the drinker's hand
  in a frame. She now turns it in her fingers as she sets it down (`izakaya-bar.js turnHeld`, eased over the 1.1 s), its
  drinking side to the customer and a mug's handle to their right; residents' requests say which way they face.

## Done
- Blender (`tools/drink-beer-kit.mjs`, `tools/blender/drink-beer{,-keys}.py`): the body forward on the stool; C re-leant for the
  near counter (0.155 rad, its breakdowns about it); the IK's own pose kept at the lip and on the glass (evening the trunk
  under them carried the rim 5-9 mm off); poles that keep the wrist clear of soft_wrist's ends, evened five times; the joins
  held on one pose on both frames about each marker; the glass to the lip nearly at its drinking tilt (`('lip', -8, .025)`),
  down from it in 0.35 s. Blender: rim to lip at most 5.4/5.6/5.2 mm (mug/pint/glass), the foot within 3 mm of its place and
  at worst 1.8 mm under the top in the rock.
- Game (`drink-beer.js`): a hand resting on the thigh rests on this body's own and leaves it over 18 cm; a soft reach on the
  wrist goals (never past 97.5% of the arm); the wrist to the glass only near it; the hand's socket brought to the glass's
  place (the standing glass jumped 5-7 mm into it); the rim onto the lip over its last 0.3 s; the hand's twist into the forearm
  over a contact's first quarter (`bring`'s new `twist` argument, the can's unchanged); beat speeds eased over 0.15 s.
  `beerPlan`, `beerPlanAt`, `beerDrunkAt`, `beerSipLength`.
- **Who drinks the animated way now:** Johansson at Minato's counter (game.js, the mug, the pint), and every resident with a
  beer at a counter stool (venue-service.js: Sverker and Tetsuo by taste, Thuan by game.js; the mug), each in their own time
  (`BEER_STYLES`). The venue's drink step is the drink's own length (7-12 s, not 3: `mealState`'s `drinkLength`, the beer going
  down at the lip as the motion's does); animate.js plays it once the body is set on its seat (before, the seat's lift carried
  the glass 31 mm). Beer only for a grown-up by recorded age (`DRINKING_AGE`, as the machines): a child never gets beer
  (Vy is 11; `izakaya-food`'s test guest is now 40).
- Measured, first draught at the counter, 8 bodies x 3 glasses (Johansson, Thao, Mr Fujita, Sverker, Thuan, Tetsuo, Masaru,
  Christina): the rim on the lip 0.0 mm; the foot within 15.4 mm of its place (the rock's 15 mm slide), never under the top;
  no joint over 0.35 rad a frame, no step of speed over 0.06 rad (worst 0.057); the glass at most 25.4 mm a frame; wrists
  within 0.05 rad of their limits. Residents through the animator (Sverker, Tetsuo, Thuan; a fresh glass and a later sip):
  the same, set down within 2 mm of where it stood.
- The can (`drink-can.js`): its ring and pocket weights sampled between frames, the hook eased off past the tear (the hand
  jumped 19 mm on Vy once the weights came on). The principles audit's baseline is unchanged.

## Proved
- `tests/drink-beer.test.mjs` 11 of 11 (the todo now passes; eight bodies at the game's seat; a resident at the counter);
  drink-can, izakaya-bar, izakaya-beer, izakaya-food, the drinking game, motion and the principles audit pass (the baseline
  unchanged: ease 124/154 ... squash 15/15 after the merge).
- The CI guard (`node tools/ci-guard.mjs --test-concurrency=2`, after the merge): 788 of 789 in 1685 s, no timeouts; the one
  failure is the published runtime package (not rebuilt on a branch).

## Sheets (looked at: no pop, no slide, nothing through the glass or the counter)
- Blender: `art/characters/body-kit/review/drink-beer-{mug,pint,glass}-{front,three-quarter,side}.jpg` (the shirt, the near
  counter).
- Game (`node tools/hand-shots.mjs --beer pint|mug[:resident] --name X`, now at the game's seat): `drink-beer-game-{pint,mug}-
  {johansson,thao,mr-fujita,sverker}.jpg` and a resident at the venue `drink-beer-game-mug-resident-{sverker,tetsuo}.jpg`:
  key moments, strips of 8 over the lift, the gulp, the set-down and the let-go, the third-person camera at the "kaa!".

## Remains
- **The handle hand** (item 4): not made; the mug is held in the fist round its bar. A HANDLE shape in
  `tools/blender/hand_model.py`, the kit and build.js grip (`HANDS`) is next.
- **The kanpai** (optional): not made.
- **The can's leftover audit failures** (ease on Vy and Sverker, overlap on all three): not started; unchanged in the baseline.
- A later sip (not in the test): wrists up to 0.058 rad past their limits (Christina, Tetsuo), Thao's small glass 0.062 rad.
- A booth's table and a standing drinker keep the drink from the hand (the counter's motion at a booth: steps up to 0.13 rad,
  the glass 32 mm a frame; the held sip ends at the chest and blends out at 55-78 mm a frame). Johansson's small glass of the
  bottle is not in `TABLE_DRINK_KINDS` (its prop is the bottle-and-glass set) and keeps the old sip.
- The owner has not seen any of it.

# 27 November, late night: the beer drink at the booth, held, later sips; the handoff after a can (branch `drink/beer`, WIP)

The owner: "Remake it follow Disney principles how should it look when anyone drinks beer". From 1935a6d. Handed over to Codex
mid-way at the coordinator's word; not pushed; `claude/dreamy-ritchie-cxufpl` (9f7a4e9) **not yet merged in** (it touches
animate.js and tests/drink-grip.test.mjs: merge before going on).

## Done (in the WIP commit; the counter's own tests pass)
- **Blender pipeline for any table** (`tools/drink-beer-kit.mjs --seat counter2|window|--standing`; `tools/blender/drink-beer.py
  --table counter|booth|held`, each with its own `--out`: two bakes sharing `output/drink-beer` raced on kit.json). Writes
  `src/avatars/motions/drink-beer-<vessel>[-booth|-held].js` and `tests/drink-beer-<vessel>[...].verify.json`. Batch:
  `bakeall.sh` pattern (one `--out output/drink-beer-<v>-<t>` per job, two at a time, ~40 s a bake).
- **LAST part** (`drink-beer-keys.py drink(t0,'last')`): SIP's beats at SIP's times, the glass from 22% to empty, the head
  back 1.55 x the first draught's, `POLE_LAST`, the eyes 0.85 shut, `('in', 34, 24)` so the glass comes up already over. Parts
  now TAKE 0, FIRST 1.75, SIP 8.35, LAST 12.6, LET 16.85, end 18.25. In Blender: rim to lip <= 6.5 mm, tilt at the lip 81-92
  degrees in LAST, wrists 0.000 past.
- **Booth** (`BOOTH` in drink-beer-keys.py): CPOSE leaning in a third as much and a little toward the glass (z), `POLE_REACH`
  down and back by his side, `POLE_LIFT` (the counter's elbow) from the anticipation on, `POLE_EVEN` 14 (drink-beer.py). In
  Blender the foot at most 1.2-7.8 mm under the top at the tap (the game lifts it), wrists 0.000.
- **Held** (`tools/blender/drink-beer-held-keys.py`, standing): HOLD 0-0.5 at H (the glass at the waist), SIP 0.5-4.75, LAST
  4.75-9.0. Sheet: `art/characters/body-kit/review/drink-beer-mug-held-*.jpg` (an earlier keying: the head looked at the glass
  all through H; now only to take it up and put it back). Booth sheet (earlier keying): `drink-beer-mug-booth-*.jpg`. Not
  re-rendered after the last keys; pint/glass booth and held sheets not rendered.
- **The head after the eyes, slower** (drink-beer.py headLook keys +0.12 s on the way to the glass): 7 rad/s at the booth before.
- **Game** (`src/avatars/drink-beer.js`): `BEER_TABLE_MOTIONS`, `beerMotion(prop,table,side)`, `mirrorMotion` (left hand: joints
  L<->R with (x,-y,-z,w), paths x negated, R/L paths swapped; checked against bones), `beerSide`, `beerParts` (generic from
  markers), `sampler` (SIP with LAST blended by `last`), `beerLastBlend(M,prop,endFraction)`, `beerTableFor`, `beerSideFor`,
  `beerRestAt`, `restTurn(root,side)`, `beerPlan(prop,style,{table,side,first,last})`, `beerFreeHand`, `BEER_HELD_POSES`;
  `playBeerDrink` takes `last` and works for either hand (G/W); `createBeerTableDrink` picks table, hand and blend itself.
  `beer-hold.js`: `BASIS_L`, `beerRim(prop,side)`.
- **animate.js**: a beer in 'Drink'/'DrinkStanding' with no `drinkRest` plays the held motion (timed by `consumeElapsed`, or
  in the drinker's own rhythm, `BEER_STYLES.between`); `drinkRest` at the booth picks the booth motion and the hand by side;
  `drinkLast`; a play cut off eases out over 0.65 s (`beerLastPlay`, `blend.scale`). **The can handoff (coordinator's item):**
  `ownArmLast`, `handoffFrom`, `HANDOFF` 0.35 s: a drink in the hand after a can or a beer as animated takes its pose at once,
  eased from where that drink left the arm. Probe: rim to lips at the sip 16.2 mm -> 0.0 (Johansson, can -> coffee), the hand
  at the change <= 11.4 mm a frame. **No test added yet** (planned: tests/drink-grip.test.mjs, can -> coffee at phase 1.2).
- **Venue** (`venue-service.js beerAtTable`, `handFor`, `tableOf`): booth plans, the left hand where Thao sets the glass to the
  left, `drinkLast` per sip; nobody drinks or eats standing (the glass and the plate stay on the table, visible). Thao turns the
  glass for the hand that takes it (`izakaya-beer.js glassYawAt`, player seats' `glassYaw`).
- Probe numbers (scratch, first draught, game): booth both sides, 8 bodies x mug: worst step 0.057 rad, glass <= 22.5 mm a
  frame, wrists <= 0.049; pint/glass on 4 bodies the same order. Before: steps up to 0.5 rad, glass 35 mm, wrists 0.18 past.

## Tests (focused, at the WIP commit)
- `tests/drink-beer.test.mjs` 11/11 pass (the counter, re-baked with LAST). izakaya-beer + izakaya-bar 15/15 pass.
- New `tests/drink-beer-sips.test.mjs` (later sips 60%->45% on 8 bodies, the last of it on 4): **fails**. Johansson's mug
  60%->45% puts the glass 24.2 mm into the face (not yet looked at: the LAST blend or the mug's far wall with the head back);
  the new hand-through-the-table check (`tests/drink-beer-fixtures.mjs handInTable`, HAND.touch and the fist's) finds 12-20 mm
  on the pint and the small glass at the counter: decide whether that is the fingers really in the counter at the grab (look at
  a sheet) or the fist's envelope being the wrong one for a wrap; do not loosen it without looking.
- New `tests/drink-beer-tables.test.mjs` (booth both sides, a later sip, held standing/seated, the blend's shape): **1 of 14
  pass** (the seats' glass yaw). Every booth run fails only the new hand-through-the-table check (24-25 mm on Johansson, mug,
  pint and glass alike, both sides): look first at whether the resting hand on the thigh is under the booth's 5 cm top (its
  xz inside the table, its y between 0.67 and 0.72 m) and so a real clip of the seated body with the booth (there before this
  work), or the check's box. Test 1 fails on 'lip the same in SIP and LAST': the test compares samples half a frame apart
  (8.35 s and 12.6 s are not on 30 fps frames); compare with sampleTrack at equal times instead (the game's sampler does).
  The held and blend tests' failures were not read before hand-over: run them alone (`node --test --test-name-pattern held
  tests/drink-beer-tables.test.mjs`).
- `tests/drink-grip.test.mjs` (as on this branch, before the merge): **fails 3 of 4** (grips throughout sips, Fujita's first frame, creator proportions), as expected: draft and bottle in 'Drink' now play the held motion, so its check of the
  rim at the lips at consumeElapsed 1.2 (the old sip's timing) and `fitAvatarHeldProp` no longer apply to beer glasses. After
  merging 9f7a4e9 (whose SIPPED already leaves the can out for the same reason), leave the beer glasses out of SIPPED the same
  way (drink-beer-tables holds their rim) and add the can-handoff check there.
- Not run: drink-can, izakaya-food, the drinking game, motion, animation-principles, avatar-polish.

## Not started
- The handle hand (item 2), Johansson's small glass from the bottle (item 3), kanpai (item 4), the can's audit leftovers
  (item 5). Game sheets (tools/hand-shots.mjs) for the booth and held: not made; hand-shots still places the glass the counter
  way only.
- The resident can sip ('Drink' with a can, animate.js `CAN_PARTS.sip` at w 1) has no blend in or out at all (seen, not fixed);
  the old drink from the hand (tea, coffee) moves the hand 80 mm in a frame at 1.7 s (seen in the handoff probe, not fixed).
- The owner has not seen any of it.
