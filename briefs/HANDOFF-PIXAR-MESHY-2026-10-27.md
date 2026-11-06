# Handover: Meshy Johansson and Meshy Thao in Johansson World (27 October 2026)

The owner, 27 October 2026, in order: a Meshy model of Johansson ("maybe it can help with Johansson"); "Use the Meshy
model and rig it"; "We are stuck on polishing a turd, so use Meshy Johansson and Meshy Thao, bring them to the world";
"Don't delete the old simple characters, I want them for other things like merch and prints and my website"; "Can you
remove goatee and moustache?"; "Remember to write handovers when you complete something".

## State

- **Branch `claude/vibrant-brown-0udpq3`** of this repo and of the studio repo (`nj22az/jojo`). **Not on `main`:**
  publishing waits for the owner's word. On the branch every World and Studio page draws Pixar Johansson (the player)
  and Pixar Thao from the Meshy models; `?pixar=0` shows the cartoon. **The cartoon characters are untouched** (the
  recipes in `src/avatars/cast.js`, the cartoon build): they stay for merch, prints and the website.
- **Models:** `assets/avatars/pixar/johansson.glb` (1.83 MB, version `7fa87c4213`) and `thao.glb` (1.70 MB, version
  `14fcbc8287`), cards beside them; 20,000 body triangles each plus the eyes, brows and mouth decals, one 2048 texture.
  Made by the studio repo's `3d/cast/game_meshy.py` (its `GAME.md`, "The Meshy bodies"): the sculpt's own hands kept,
  World's rest with the hand straight on from the forearm, bound with the arms out 35 degrees (the card's `bind`),
  the painted eyes, brows and mouth painted out and World's rigged ones laid over them, his moustache and goatee
  painted over and smoothed away.
- **World:** `PIXAR_BODIES.Thao` added (`src/avatars/pixar.js`); the Pixar body's own lips for a drink or a morsel
  (`pixar.js` `mouthPoint`/`lipsLocal`, read by `table-drink.js` and `consume.js`); the audit harness serves and sips
  a draught at his izakaya seat (`__JOHANSSON_AUDIT__.serve/sip/drinking`, game.js); the shot tool
  (`tools/pixar-shots.mjs`) shoots gestures at the open spot, the seated views over the counter, a sip series, with
  `--part street|izakaya|sip` and Thao found at the izakaya. Tests: `tests/pixar-meshy.test.mjs` (both bodies, 6/6),
  `pixar-johansson.test.mjs` slimmed to his acting.
- **Evidence** (studio repo `3d/cast/renders/game/`): `johansson-meshy-body.jpg` (front, three-quarter, side, back,
  walking, wave, think, sit drink), `johansson-meshy-face.jpg`, `thao-meshy-body.jpg`, `thao-meshy-face.jpg`,
  `thao-meshy-in-game.jpg` and `-face.jpg` (the izakaya's door, 17:30), the painted-out faces.

## Afternoon, 27 October 2026: the sit-drink pose, his face, Thao's eyes

The owner, in order: a diagnostics note on the sheet's "sit drink" cell (the right elbow up beside the head, the hand
dangling at the collarbone, no grip; the hips "not lowered", the thighs "crushed", the feet floating; the left arm
hanging); "His face needs to be cleaner too"; "He looks like a burn victim now make his head gorgeous so he fits in and
Thao's eyes were all over the place"; "Shouldn't the elbow be down when he is drinking"; "he looks good now but the arm
gets stuck in his head".

**World (`src/avatars/animate.js`, `consume.js`):**
- The drinking arm on a Pixar body (`drinkArm`, and the sip's own IK in `poseAvatarConsumption`): the elbow hangs below
  the shoulder and a little forward (the reach's pole `[-.45,-1,.25]`), the forearm folds up and turns across to the
  mouth. The cartoon keeps its raised arm (short arms, big head). A toast raises the glass before the face with the
  elbow bent, not a straight arm overhead.
- What meets the lips on a Pixar body is the rim's near edge (`rimNear`, the glass's radius), not the rim's centre: its
  lips are its own skin, and with the centre there the glass stood through his cheek and chin.
- The draught at the counter is the table-drink performance (`table-drink.js`), not the gesture: its arm takes the same
  elbow-down pole on a Pixar body. In the booted game the sip's rim error is 0 (`johansson-meshy-game-report.json`).
- Seated in shorts or trousers, a Pixar body's hands rest on its thighs (the cartoon's rest on the lap only over a
  skirt's cloth). The owner: "Sitting is awkward like he is stretched": a Pixar body now sits as a person does on a
  stool (`CHAIR_SIT.pixar`): the thighs sloping a little down to the knees (-1.36 rad), the knees a hand apart, the
  shins hanging, and a soft back (spine and chest curved forward a touch, the chin level). The cartoon's square toy sit
  (`CHAIR_SIT.cartoon`) is unchanged.
- **The hips and thighs are right for this body.** Measured on the Meshy mesh (`scratchpad legs.py`): his crotch is at
  0.59 m of 1.80 (a third of his height; a person's is near half), the knee at 0.46, so his thigh bone is 0.19 m and his
  shin 0.34. Seated on the izakaya's 0.46 m stool the animator lowers him 9 cm (the seat under his own bottom,
  `seat-support.js`) and his feet hang 10 cm off the floor, on the stool's rail in the game. The sheet draws no stool,
  so he looks as if he floats; nothing to fix in the rig short of resculpting his legs (not done: the owner's model).
- **The hand at the glass** (the owner, a frame from their own game: the jug at his mouth, his hand by his ear, "Do you
  look at the photos yourself? Because this is wrong"): the table-drink's grip placed the palm by the cartoon mitten's
  clearance (a palm 0.9 hand radii wide plus a thumb sphere), 16 cm from the glass's axis for his hand measure. A body
  with `measure.realHand` (the Pixar bodies, `pixar.js`) takes a real hand's grip (`consume.js drinkGrip`: the fingers
  through a handle with a finger's clearance, or the palm on a glass's body) and holds a mug with the fingers hanging
  down through the handle and the palm toward the glass (`table-drink.js wrist`). The side and close lenses had hidden
  the distance; the front lens shows it: judge the front frame first.
- **The draught is a big jug now** (大ジョッキ: 9.6 cm across, 18 cm tall, a handle for four fingers;
  `izakaya-serving-visuals.js`): the owner, "he needs to be able to grab the beer jug, if the jug is too small make it
  bigger". The sculpted fingers wrap it; they do not close (no finger bones): `3. Open` below.
- **A proper seat** (the owner: "he needs a proper butt and not be stretched like this"): the studio's
  `game_meshy.py clip_leg_weights`. Bone heat had given the thigh bones a quarter of the trunk up to the waist and more
  than half of the seat of the shorts (measured: 0.25 at z 0.74 to 0.86, 0.56 to 0.65 at the back of the pelvis), so the
  sit dragged the shirt and waist down and flattened the pelvis. Above the hip joint a thigh's weight now falls to
  nothing within 7 cm at the front and 3.5 cm at the back; the glutes are the pelvis's. Both bodies re-exported
  (`johansson.glb` `dae59dce26`, `thao.glb` `8929092308`).
- The owner's link (gist Fedik/082902e91b5407b5b97f) is a 2015 CSS and jQuery beer-pour animation in a web page, foam
  rising in a div: nothing for the 3D rig; the izakaya pours its own stream. Not used.
- A gripping hand is still open (World's skeleton has no finger bones): `3. Open` below.

**Studio (`3d/cast/game_thuan.py paint_out_face`, `game_meshy.py`, the landmarks):**
- `clean=True` (the Meshy bodies): the holes fill from the skin's own tone round them (a wide normalised blur, wider
  where little skin is near), feathered, and the whole front of the face is smoothed of blotches and stubble
  (`clean_skin`). The old fill was one flat lighter pink in jagged patches, and a tanned skin's shaded side passed the
  brow-remnant test by luminance alone, so his forehead and cheeks were patched all over: now a remnant must be dark
  *and* grey (`sat < .24`), and the found brow's own box goes too.
- `tone=L['skin_tone']`: his skin brought from the texture's red-orange (0.90, 0.58, 0.49) to (0.93, 0.66, 0.53), toward
  the cartoon Johansson's #dc9d7a, by hue so the khaki shorts stay khaki (`tone_skin`). Shave zones: the goatee's zone
  widened over the jaw, the tuft painted at his hairline added.
- Thao: her brows lie 2 to 6 cm above her eyes (`face_zones.brow_above`), lower than Thuận's, so they were missed and
  the painted brows stayed under the rigged ones; her left brow hides under her bob from its middle out, so a brow
  with less than two thirds of the other's span takes the other's shape. Her iris measured as wide as the eye
  (`IRIS_MOST = .72` of the half width now): with white either side, her look about stays inside the eye.
- Exports of the afternoon: `johansson.glb` `dae59dce26`, `thao.glb` `8929092308` (the last, with the leg weights
  clipped); runtime rebuilt.

**Evidence** (studio repo `3d/cast/renders/game/`): `johansson-meshy-body.jpg` (turned round, walking, wave, think,
drink, sit drink, sit toast, sit), `johansson-meshy-face.jpg`, `johansson-meshy-face-painted-out.jpg`,
`thao-meshy-face.jpg` (at rest, looking, three-quarter, side, the feelings), `thao-meshy-face-painted-out.jpg`,
`johansson-meshy-game-izakaya-sip-*.jpg` (the draught at the counter in the booted game: the elbow down, the jug at
his lips in his hand, the feet on the stool's rail), `johansson-meshy-body-seated.jpg` (the seat of the shorts kept). World tests:
`player-seating`, `avatar-dining-combat`, `pixar-meshy`, `pixar-johansson`, `avatar-polish`, `afterbath-outfit` pass.

## Evening, 27 October 2026: a butt, no stretch, a hand that grips, cartoon drinking; published to the game

The owner: "What's your plan? Make a plan, then work according to the plan to make the beer drinking look like it's
from a cartoon and give him a butt and not stretch"; then "Push him to the game and I'll fault find while playing but
drinking is not right his hand disappears for some reason"; "Thuan needs to be able to interact with the items in
Sakura too, pick up a can etc, hands is something you need to put some effort in"; four hand links.

**Done, in the plan's order:**
1. **A butt** (studio `game_meshy.py sculpt_seat`): the back of the pelvis pushed out in two lobes over the hip joints,
   5 cm at the fullest, blending into the thighs and the back; UVs untouched. Both Meshy bodies (she has hips under her
   dress). `renders/game/johansson-meshy-seat-sculpt.jpg` before and after.
2. **No stretch**: with the thigh weights kept to the legs (midday) the sit no longer drags the trunk; the seat of the
   shorts keeps its shape (`johansson-meshy-body-seated.jpg`, side view standing and seated).
3. **A hand that grips** (`game_meshy.py grip_keys` → morph targets `gripL`/`gripR` in the GLB, `export_morph=True`;
   World `pixar.js grip(side, v)`, named from the model's `targetNames`): the fingers past the knuckles curled toward the
   palm at three joints (70, 70, 60 degrees), fingertip first about the sculpted joint lines; the thumb as sculpted.
   World closes the hand on a held glass (`consume.js fitAvatarHeldProp`), through the counter performance from the
   reach to the release (`table-drink.js`), half on a morsel's sticks, and opens it when the prop goes
   (`actors.js hold`). `johansson-meshy-hand-grip.jpg`: open above, closed below. `tools/pixar-sheet.mjs --grip`
   renders the hands closed.
4. **Cartoon drinking** (`table-drink.js`, Pixar bodies only): the head goes back as the jug tips (0.24 rad at full
   tilt), three gulps bob it through the sip, the chest leans back, the elbow comes up and out as he drains it (the
   reach's pole swings with the tilt), and he comes down with a satisfied nod and a happy face. The liquid, the rim at
   the lips and the timing are the sober performance's; the sip still reads `valid` (rim error 0).
5. **Checked front first**: `johansson-meshy-game-izakaya-sip-*.jpg`. From the camera's usual side the hand is behind
   the jug at the grasp (the handle is on his right): that is the "hand disappears" of the owner's frame, most likely,
   not a missing hand; the open hand earlier also sat inside the glass. If it still vanishes in play, say which camera.
6. **Published to the game** (the owner: "Push him to the game and I'll fault find while playing"): the branch merged
   into `main` and pushed, see the commit log. The cartoon characters are untouched (`?pixar=0`).

**The hand links** (the owner, for Thuận's hands): `JackTisdell/hand` is a p5.js hand built from joint-angle components
(phalanx, metacarpal, carpal group: a good model for finger bones, no mesh); `tubakhxn/Advanced-Hand-Gesture-3D-Visualizer`
is a MediaPipe webcam demo (Python, no model); `jperedadnr/RiggedHand` is a Java and Leap Motion skinned-hand project
(Apache-2.0; its model files are not visible from the page); animations-maschine.com is an agency's service page, no
download. None gives a rigged hand mesh for World; the route stays our own: finger bones on World's skeleton from the
Meshy hands (the next step below).

## Night, 27 October 2026: finger bones; the owner's faults from play, fixed

The owner: "Can you build finger bones"; then, playing the published game: "the butt should come when he sits, this
looks too crappy, and his mouth needs to show in all shaders and even normal"; "His feet should point forward when he
is running too, now they point outwards"; "risograph really captures the hand drawn comic feel"; "I just want you to
fix my issues"; "You can't be happy with what the face looks like, align it properly and the hand too so he can drink
beer"; "Audit your screenshots ... as you are Akira Kurosawa or Miyazaki or Disney yourself".

- **Finger bones** (studio `game_meshy.py finger_joints`, `finger_weights`, `finger_rest`; World `pixar.js`): fifteen
  a hand on World's skeleton under the hand bone, thumb (root in the palm) and four fingers, three joints each. Found
  on the full mesh before it is lightened: past the knuckle line the Meshy hand is one block of four fingers (cut into
  four bands across its width, the index nearest the thumb) and the thumb apart; the joints at the knuckle, 40 and 70
  per cent of the way to the tip. The hand's weight past the knuckles goes onto them with a band at every joint. The
  card carries each bone's rest and bend axis (`fingers.L/R.bend`, World's frame, a positive turn curls toward the
  palm). World builds them as children of the hand (no turn at rest, so the card's axes apply as they are) and
  `grip(side, v, shape)` turns each joint (`GRIP_TURN`, the index least). The grip morph is gone; the first-person arm
  keeps the finger bones. Both bodies. `johansson-meshy-hand-grip.jpg` (open above, closed below), `thao-meshy-fingers.jpg`.
- **The hold** (`table-drink.js`): a real hand holds the jug as a person does: the wrist beside the handle, the palm
  toward the glass, the fingers through the handle's hole to curl round its bar, the thumb on top (`HOLD_Q`,
  `holdOffset`); the jug is turned in the hand as it is lifted so its handle is at his right (`heldQ`), and stays so
  when set down. The sip still validates (rim error 0, wrist error 0).
- **The seat only when he sits**: the sculpt is a shape key `seat` now (`sculpt_seat(..., key='seat')`, 4 cm), and
  World brings it in with `chairBlend` (`pixar.seat(v)`, animate.js); standing he is the sculpt as it came (the back
  view the owner sent, the lumpy shorts, is gone).
- **The mouth in every look**: the seam between the lips in a dark warm ink (`inkFor`) and twice as thick
  (`rigMouth({seam})`, `uSeam`), the lips a shade deeper than the skin; and **placed from the landmark**
  (`johansson_meshy.py mouth_at=1.545, mouth_half=0.033`; `plain_mouth`): the painted lips were a sliver under the
  moustache, found on the nose and fitted into curves that shot off past five units, so his mouth drew as a dot under
  his nose. World also guards a card's curves (`saneMouth`). `johansson-meshy-face.jpg`.
- **Feet forward**: the sculpt stands toes-out 12.3 degrees (Thao 4.4); `a_pose(rig, L)` turns each foot to point
  forward in the bind, so the walk and run swing straight feet.
- `tests/pixar-meshy.test.mjs` accepts and checks the finger bones (30, each rested, bend axes in the card).
- Risograph: the owner likes it; nothing changed there, the mouth now reads in it.

## Late night, 27 October 2026: the jug in his hand

The owner: "how about Johansson's hands???? he is not holding the beer, model a beer jug that fits in his hand and
obeys gravity pls"; "Screenshots"; a frame with the thumb standing up beside the jug: "What's this?"

- **Measured, not eyeballed** (`tools/pixar-shots.mjs --part sip`, `table-drink.js` diagnostics): per moment of the
  performance, each finger's nearest distance to the handle's bar, fingertips inside the glass, the jug's lean off
  upright, its base above its counter spot, the rim to the lips; the frames from his right (the handle side) and close.
  Before: the hand sat beside the jug by a guessed offset; the bar was nowhere near the fingers.
- **A jug that fits his hand** (`izakaya-serving-visuals.js` `JUG`): 大ジョッキ, 9.4 cm across, 19 cm tall on a thick base,
  a D-handle (a tube on a rounded D) whose opening is 11.4 cm tall and 3.5 cm deep for his four fingers (their knuckles
  span 5.9 cm centre to centre, a finger 2.2 cm thick) and whose bar is 15 mm thick to curl round. Its grip data says
  where the bar is (`handle`, `bar`, `height`, `opening`).
- **The hold is built from the fingers** (`pixar.js holdPoint`: forward kinematics of the finger bones at the grip, the
  hollow the curled fingers make; `table-drink.js wrist`): the wrist goes where that hollow meets the bar, the palm
  toward the glass, the knuckle line up the bar, the thumb on top (`HOLD_Q`, right-handed). Measured from the grasp to
  the set-down: every finger 11 to 16 mm off the bar (a finger's half thickness plus the bar's radius), no fingertip in
  the glass, the jug upright (lean 0) carried, tipped only at the sip (22 degrees) and swallow (30), level again set
  down, rim error 0 at the sip.
- **The thumb ("What's this?")**: the digit standing up beside the jug was his real thumb, never rigged. The studio's
  first finger cut (`game_meshy.py finger_joints`) took the hand past half its length as one block of four fingers and
  a separate thumb; on his Meshy hand the index stands apart there and the short thumb ends before it, so the index
  was rigged as the thumb (and swept across the palm), the three other fingers were cut into four bands, and the thumb
  stayed on the hand bone. Seen with the vertices coloured by bone (a scratch render) and fixed in the studio: the five
  tips are found as the points farthest along the mesh from the wrist, the thumb is the tip most to the front, every
  vertex goes to the digit whose tip it reaches most directly (fused fingers part along their creases), the lightened
  mesh takes each vertex's digit from the nearest labelled one, and the thumb's root sits in the ball of the thumb and
  curls across the palm to meet the fingers. Both casts re-exported (Johansson `5fef83b9f0`, Thao `be1dcce7d0`; Thao's
  index is her longest finger, and the split follows it). Now the thumb lies along the top of the fist over the index,
  the four fingers close through the handle (10 to 21 mm off its bar), none in the glass (`shots-sip19`).
- **Gravity**: the jug hangs vertical from the hand through the lift and the carry, tips with the sip, is set down on its
  spot (base 0 above rest); the beer's surface stays level (the liquid system). The NPCs' held glasses go through
  `consume.js fitAvatarHeldProp` unchanged.
- **Audited by independent judges** (three lenses: Kurosawa for weight and truth, Miyazaki for physics, Disney for
  appeal; every fault then challenged by two refuters; `tools` of the session, a workflow over the frames and the
  report). Round one (on the first frames) found: the thumb standing up beside the jug, things behind the beer drawn
  through it (chopsticks, the ink of the chin and collar: the liquid had no depth write), the free hand hanging in
  the air at counter height, the reach's open fingers passing through the bar, the set-down still shot before the jug
  landed, and the lenses named from the wrong side. Fixed: the thumb folds over (`GRIP_TURN.thumb`); beer is drawn
  opaque and writes depth (`drinking/vessel.js`, `liquidOpacity` 1 for the draught); the free hand rests on the counter
  beside the jug's spot, palm down, fingers forward (`table-drink.js counterHand`); the reach stops a finger's length
  behind the handle with the fingers open, the grasp slides the hand on and closes the fingers after
  (`reachHand`, the grip ramp); a `landed` moment (base 0 above its spot); the `right` lens is his right. Also the jug
  filled to 2 cm under the rim (a fresh 大ジョッキ), so it tips 13 degrees at the sip, and his eyes on the jug as he
  reaches and lifts, shut as he drinks. The judges' one wrong call, recorded so nobody chases it: "the beer never
  reaches his lips": seen from the front the beer stands lower at the near wall of a tilted jug while it touches the
  rim at the lips; it is level and it reaches the rim (rim error 0, `valid` at the sip). Resting hands on a Pixar body
  are a little curled, never splayed (`animate.js`, grip 0.28).

- **Audit of the new hold** (`shots-sip19`, three lenses and two refuters a fault): all three pass the seat, the fist
  round the handle (four fingers through the loop, the handle seen above and below), no finger in the glass, the jug
  upright carried and back on its spot, the rim at the lips, the face acting. The thumbs-up is gone. Confirmed, and
  fixed: the beer read as milky tea (a saturated gold now, `0xf0a400`, with a whiter head; a deep amber came out as cocoa). Their call that the beer tips with the
  glass is wrong again: at the swallow the beer's top is a horizontal line across a jug leaning 29 degrees (checked in
  the frame). Left open, all rated should or nit: the knuckles close to his jaw at the sip from the side lens, the
  swallow tipping further than the sip (the cycle's choice), the jug a few degrees off upright at approach and recover,
  his head staying fairly upright under a litre jug, a dark stripe down his jaw and neck (the texture).

## Later: Thuận and Thao drink beer the same way (the owner: "Can we use what we learned from Johansson?")

The owner, 27 October 2026: "Can you do so Thuan and Thao also can drink beer now?"; "Everyone should eventually be
Pixar style"; "Audit yourself"; "Thuan is better but the beer doesn't reach her mouth either".

- **One hold for every hand with fingers** (`consume.js` `fingerHold`, `HOLD_Q`, used by `poseAvatarConsumption` and
  `fitAvatarHeldProp`): a resident's jug sits with its bar in the curled fingers' hollow, the thumb on top, as
  Johansson's at the counter; any Pixar body with finger bones gets it, the cartoon keeps its mitten grip. The held
  jug's beer is the levelled liquid (`table-drink.js levelHeldDrink`), not a cylinder tipping with the glass; the
  resting hand comes up and forward when it holds a jug, so the base clears the thighs (it went into Thuận's lap).
- **Thuận has finger bones** (jojo `game_thuan.py` with `game_meshy.finger_joints(..., whole=True)` on each of her
  procedural hands): GLB `7c2477169d`; a stray unweighted vertex by her hand now takes its neighbour's weights instead of
  stopping the export.
- **The lips point and the rim** (`pixar.js lipsNow`, `consume.js poseAvatarConsumption`), found by looking at the
  frames, not the numbers (the owner: "Audit yourself"; "the beer doesn't reach her mouth"; "do you look at the
  screenshots? Look and correct"). The point was the mouth decal's unskinned box: for Thao 10 cm behind her face, so
  the rim went into her head; on the decal's centre it was a centimetre low; pushed to the face's front it stood 4 cm
  in the air before the mouth. Now it is the middle of the line between the lips (where the decal's jaw weight changes
  over), on the skin. And the rim point brought to the lips was the jug's far edge (the offset's sign: the body faces
  +z), so the near edge and the rim went under the chin toward the throat while the numbers said "2 mm". Now the near
  edge sits on the lower lip, the jug stands in front of the face tipped toward it, its far edge clear of the nose, and
  the beer reaches the rim at the lips (the empty glass is the far, high side). Checked in close frames from both
  sides with the lips and rim points marked (scratch probe), for Thuận and Thao; every finger 7 to 20 mm off the bar.
  Lesson: a distance between two points is only as good as the points; mark them on the frame.
- **The free hand** relaxes (grip 0.28) while the other holds a drink; it closed into a fist.
- **Self-audit of Thao's face** (her probe frames), not yet fixed: her irises disagree (one centred, one pulled in), the
  painted-out face reads flat and pale round the eyes and nose, pale gaps between her hair's ends and her neck, a
  dark strand by her eye in profile and a doubled hairline, eyes that read as stickers in profile, her dress texture
  smeared into zigzags, and her underwear showing when she sits (her Meshy dress). Next for her: the eyes' centres from
  her own sockets, the painted-out skin blended to her cheeks, the hair's holes.
- **Why Thuận is better** (the owner asked): she was made over two days on the owner's notes by her own route
  (`game_thuan.py`, GAME.md): a film model from the owner's design, her hands built procedurally with nails, her face
  painted out and rebuilt with her own measured eyes, lashes, brows and mouth in every feeling, a jaw, nose and cheeks,
  her braids on springs, her skin matched to the film renders. Thao's Meshy model went through the quick route in an
  afternoon: a generated textured sculpt with its own fused hands, its painted face cleaned and the same rigged
  features laid over it.
- **When they drink**: their routines still order tea (`resident-personalities.js`: Thuan `drink:'tea'`, Thao works
  Minato's counter); the owner to say when each has a beer.

## Thao's face: her hair a rigged mesh of its own, her skin even, her eyes smaller and almond

The owner, 27 October 2026: "Fix her face, her face should be uniform"; "remove her hair to fix her eyes, and add it
back as a rigged hairstyle not a painted or modelled hairstyle"; "make her look prettier, the skin, and make her eyes a
bit smaller"; "they are Vietnamese women, her eyes should be rigged but a bit more almond shaped and smaller".

- **Her hair is its own mesh** (jojo `game_meshy.split_hair`, `rig_hair_sides`; `thao_meshy.py rig_hair`): the sculpt's
  black-textured surface on the head, the one large dark mass (opened three rings first, so a painted lash running into
  it is the face's), copied out with the texture as it is (512 px, its own material `hair`), 6,000 triangles; under it on
  the body the same faces pulled 3 mm in, a dark layer, so nothing shows through. Weighted to the head from the body
  under it, the bob's sides on the braid bones (root at the temple, joint, end at the bob's tip). World: `pixar.js`
  part `hair` (cel ramp, no skin shading), `springs.js` `SWING.bob` (stiff, 14 degrees at most) when the card says
  `hair: {style: 'bob', rigged: true}`, the cartoon recipe's ponytail spring off for a body with its own hair.
- **Her face clean-up** (`game_thuan.paint_out_face`, for the Meshy bodies): the hair (a thick dark mass reaching the
  view's edge) kept out of every hole, fill and blur (the brows' search and the widened holes had painted skin into her
  hairline at the temple, the "bite"); grey shading lines inside the face painted over (not flattened); 3 mm holes and a
  2.5 mm feather round the painted features (their outlines stayed as rims); the skin evened over 8 mm; her cheeks and
  jaw cleaned from each side (`side_clean`, 60 degrees each way, only the lines found and only well inside the skin seen:
  a first try repainted the whole skin from the side and drew her profile as a dashed line down her face); her face's
  skin painted as Thuận's is (`paint_skin`: one tone, a soft blush on the apples of the cheeks, faded at the hairline and
  down the neck), all her skin a little less orange (`skin_tone`).
- **Her eyes**: the face is symmetric about its middle to a millimetre and the painted eyes were placed alike (my "8 mm
  to the side" measured from the nose bone, not the tip; corrected); the left one looked under her hair because her bob
  sweeps over that temple. Smaller and almond: `eye_scale` 0.86, `iris_scale` 0.86, `eye_shape: 'almond'` with the outer
  corner lifted 1.2 (`eyes3d.js` takes `own.shape`/`own.corner`); a first try at 0.84 and a narrower opening squinted.
- GLB `thao` 2.1 MB, 25,423 triangles; tests 33/33 with `pixar-meshy` knowing a rigged hairstyle (its bones, its texture).

## Tetsuo and Mr Fujita: clones of Meshy Johansson, palette-swapped and reshaped

The owner, 27 October 2026: "for Tetsuo can you clone Johansson, and make his head more egg shaped? and give him
Tetsuos clothes instead? and glasses? and for Fujita, clone Johansson and make him shorter and fatter with square
glasses, start by cloning and palette swap the outfit and skin tone"; then "the glasses are not right", "Tetsuo should
be totally bald with some strands of hair look at his cartoon avatar", "Give Fujita a walrus moustache", "Fujitas head
is rounder too", "Look where the mouth is".

- **The route** (jojo `3d/cast/tetsuo_meshy.py`, `fujita_meshy.py`; `game_meshy.py tetsuo|fujita
  models/johansson-meshy.glb <out>`): Johansson's sculpt and landmarks, loaded at his own 1.80 m (`sculpt_height`), then
  reshaped before rigging (`reshape`: Tetsuo's `egg`, the crown 35 mm up from the sculpt's own crown and the jaw 10%
  narrower, 1.835 m; Fujita's `round` crown 20 mm down and the head 7% wider, and `fatten`: belly, waist, thighs, jowls,
  1.78 m). World's heights: Tetsuo 1.6328 m, Mr Fujita 1.5505 m (`WORLD_HEIGHTS`, `pixar-meshy` test).
- **The mouth, fixed tonight**: Tetsuo had been loaded at his `height` 1.835, 2% bigger than the landmarks he borrows,
  so his mouth, the jaw's split, the eye zone and the face window all sat 2–3 cm low on his face (his mouth on his chin,
  his brows cut by the window's top) and he stood 3 cm too tall. Now loaded at 1.80; his brows are found whole (the egg
  stretches them past 2 cm: `face_zones.brow_max` 0.032, the window to 1.77). A mouth sliver with no upper lip takes
  its lip colour from the lips it has (it was NaN and stopped the card).
- **The clothes painted on** (`texture_paint` rules in each landmark module): the trousers from the ankle to the waist
  first (the khaki shorts and the legs under them alike, not the hands or the sleeves; the shorts had read as skin and
  stayed light over dark legs), then the jacket or polo over the shirt (blues, whites, its flowers), Tetsuo's long
  sleeves on the arm, the shoes. Every painted colour is bled 8 texels into the margin round its UV island (the margins
  kept the shirt's blue and the skin, and the texture's smaller copies drew them as streaks along the seams).
- **Tetsuo bald**: the grey horseshoe round the ears closed (`close` 10 texels: the pink between the strands passed as
  skin and the patch stayed striped) and painted in the skin of the ring round it (`around`); the tops of the brow ridges
  and a mark by the nose, which the front's paint-out cannot see, painted out too (`what='face'`); three grey strands
  over the crown and round wire glasses (1.22 of the eye wide: at 1.02 the rims lay on the eyes' outline and vanished).
- **Fujita**: his side hair `#d2ccba` (closed the same way), square glasses, a walrus moustache over the upper lip.
- Evidence: jojo `3d/cast/renders/game/clones-tetsuo-*.png`, `clones-fujita-*.png`; tests 39/39.

## 28 October 2026: the clones' faces, a Pixar audit

The owner: "I think the faces need to be more flat under the nose now you see Johansson's old face in them"; "Audit
yourself as a Pixar artist"; "Move their mouths Fujita should had a nose like super Mario".

- **Under the nose** (jojo `game_meshy.flatten_muzzle`, `muzzle` in each clone's module): the face from the nose's base to
  the chin seen from the front as a depth map, a smooth surface fitted over it (a 2D polynomial) and only what differs
  from it blurred (longer up and down than across); front-facing skin moved to it. Johansson's sculpted open smile (the
  dents at its corners, the crease under the nose), the moustache's ridge and the goatee's bump are gone; the face keeps
  its roundness. (A blur of the depth itself pulled the jaw's sides 3 cm forward; the residual blur does not.)
- **The audit's faults, fixed**: the side clean-up ran at Thao's face height (1.22–1.43 m: his neck) and never cleaned
  their cheeks; now `side_window` at their own. Thuận's painted eyeliner flick on both old men: `eye_lines` (no flick).
  Tetsuo's brows heavy dark bars: light grey `#aaa59d`, 0.7 as thick (`brow_thin`). Johansson's sculpted brow blades
  (thin fins with an undercut) smoothed into the forehead (`face_zones.brow_smooth` 400 passes, `brow_grow` 4 mm; a
  front-only smoothing tore them, dropped). Tetsuo's temples: the horseshoe's pale strands painted his skin
  (`what='temples'`), the stubble's smudges on the jaw evened (`what='jaw'`), the scalp's sculpted hair block smoothed of
  its grooves (`smooth_scalp`, from each side and from behind, the ears left). Each man a nose of his own (`nose_shape`
  in `reshape`): Tetsuo's narrower and longer (his cartoon's tall oval), Fujita's Super Mario's (1.32 across, 1.15 deep,
  1.2 long, its whole ball).
- **The mouths moved**: Tetsuo's right under his nose as his cartoon's (`mouth_at` 1.555, the jaw's split with it);
  Fujita's Mario arrangement, the moustache tucked under the nose and the mouth just below its fringe (1.536), no wider
  than the moustache, at the face's middle (his painted sliver had been found 1 cm to one side).
- Checked: clay renders against Johansson's (`renders/game/clones-clay.jpg`), World's faces, and both drinking the jug
  with the rim on the lower lip at the sip (2 mm; `clones-drink.jpg`); tests 39/39.
- **Not yet right** (the audit's rest): a brownish patch beside each nose (the old smile's laugh line painted in the
  texture, inside the front's clean-up); the ears faceted at the rim (the 20,000-triangle budget) and plain; a faint
  plateau where Tetsuo's sculpted hair block was; the mouth line reads lipstick red on the men (World's mouth shader,
  shared with Johansson); Tetsuo's chin is still Johansson's long one, his cartoon's egg would want it shorter.

## 28 October 2026, later: full glasses and an awkward Tetsuo

The owner: "Make the glasses full can you make Tetsuo look more awkward".

- **The glasses full**: both clones' frames hold glass and a glint, as the cartoon's glasses do (face-objects.js: faint
  `#dbeaf2` glass at 0.12, a white diagonal stroke and a dot high on each lens). jojo `build_glasses` makes them two
  small parts of their own (materials `lens`, `glint`, on the head bone); World's `pixar.js` draws them see-through, no
  shadow, after the eyes. Tetsuo's round rims thicker (2.2 mm, as Fujita's square ones).
- **Tetsuo awkward**: his ears stand out 11 degrees (jojo `reshape`, `ears_out`), his trousers stop above the ankle over
  white socks (`what='socks'`); World: his own face acting (`face-acting.js` TETSUO: never at ease at rest, the inner
  brows a little up, the mouth a tight line to one side, the eyes off to the side; the smile too wide with teeth and
  worried brows; looks down and away when shy; brows that hop when he talks, `talkBrows` 1.7), an awkward walk
  (`gait.js`: stooped, short bouncy steps, arms held stiff and bent, no swagger, the feet a little in, nervous glances
  and a rub of his bald head), and his own habits (`body-language.js PERSONAL_STYLE`: he fidgets where a Quiet
  craftsman stands with his hands on his hips, tugs his collar while you talk; `bodyLanguage(profile, name)`).
- Checked: World's face sheets (rest, smile, happy, shy, embarrassed, thinking), the body sheet, a walk filmed beside
  Johansson's (`renders/game/tetsuo-walk.jpg`); tests 52/52 (Pixar bodies, gait, body language, skin).

## 28 October 2026, evening: Tetsuo's trousers, whole glasses, darker brows

The owner: "Fix Tetsuos pants and make the glasses whole and his eyebrows a bit more black"; "And fix his pants".

- **Trousers** (jojo `reshape`, `trouser_legs`): he wore Johansson's short shorts with his bare legs painted dark below
  them (shorts over leggings). Now each leg below the shorts' rolled hem (0.58–0.60 m in the film frame, mid-thigh) is a
  trouser leg round its own line: shaped from the shorts' own section at the hem all round the leg, tapering to a 53 mm
  cuff at 0.15 m over a little white sock; round the hem every point (the hips' roll too) goes onto that surface, so
  the roll and the groove under it are gone; 12 mm kept off the middle at the crotch. Wrong turns, for the next one:
  the knee taken for the hem (the thigh left bare above it), the texture's khaki taken for the hem (it passes as skin;
  the roll stood over a groove), and a smoothing of the hem's band (it folded the roll's inner layers into a ridge).
- **Whole glasses** (`build_glasses`): each rim set at the eye's depth sank into the bridge of the nose, and the frame
  read as two broken arcs; now each rim comes forward as one, flat, until all of it is 4 mm clear of the face (17 mm
  for Tetsuo), and the bridge is lifted over the nose point by point.
- **Brows** charcoal `#5c5853`.
- Checked in clay (the legs from three sides) and in World's sheets; tests 52/52.

## 28 October 2026, night: Tetsuo's sleeves and an egg of a face

The owner: "How about his sleeves? And the face should be more egg like".

- **Sleeves** (jojo `reshape`, `sleeve_arms`): his long sleeves were the jacket's colour painted on Johansson's bare
  arms below a short sleeve. Now each arm below the short sleeve's hem (0.15 m down the arm's line from the shoulder,
  where its blue gives way to skin) is a sleeve round its own line (shoulder to wrist, the arm out in the bind's A),
  shaped from the short sleeve's own section at the hem and a little looser than the arm, closing round the wrist over
  24 mm at 0.49 m; round the hem every point of the arm onto that surface (its roll goes); the fill fades with the
  hand's weight (a hard cut left shards). The paint's sleeves end 6 mm past the cuff, cut per texel along the arm
  (`texture_paint(..., cuffs)`: a cut by the forearm's weight left green on the back of the hand, a mark on the mesh's
  points a sawtooth). A cuff closing over 4 mm broke into teeth when the mesh was thinned.
- **The egg** (`reshape`, `egg_face`): each height of the head scaled across to an egg seen from the front, widest at the
  temples (1.695 m, 102 mm a side), a long half-oval narrowing a little more (`taper` 0.12) down to a round chin and a
  short one up to the crown; his jaw comes in by 10 to 19% (a taper of 0.25 made a V, not an egg).
- Checked: clay of the arms, World's sheets, the jug held and at the lips (rim 2 mm at the sip); tests 52/52.

## 28 October 2026, late: Tetsuo's ears smaller, sideburns drawn

The owner: "Make his ears smaller and give him small side burns"; "Smaller ears and draw his sideburns in python".

- Ears 0.66 of their size (jojo `reshape`, `ear_scale`: drawn in toward where each joins the head, before they are
  turned out). Sideburns drawn as hair in `build_glasses` (`sideburns`): seven short grey strands a side lying on the
  skin in front of the ear from the temple down, the ones by the ear longest, so the tuft narrows toward the jaw (a
  painted patch first read as a dark block). Tests 52/52.
- His nose smaller (the owner: "Make his nose smaller"): `nose_shape` 0.68 across, 0.75 deep, 0.85 long, reaching the
  whole ball (6.2 cm; at 5 cm only its tip shrank).
- **The awkward nerd** (the owner: "make him look more like an awkward nerd. Work in blender"; jojo `build_glasses`):
  heavier black frames a size bigger (3.4 mm, 1.3 of the eye), white tape wound round the bridge (`glasses.tape`), and a
  pocket protector on his left chest (`pocket`: a sheet lying on the chest 3 mm off it, a flat slab sank into its curve)
  with a blue and a red pen, clips on, and a small yellow-handled screwdriver, the electrician's; on the chest bone.
- **Hair on the back** (the owner: "He needs some hair on the back too"; `build_glasses` `back_hair`): a horseshoe
  fringe of 62 short grey strands from behind one ear round to the other, two staggered rows found by rays in toward the
  head's middle, higher at the sides (meeting the sideburns) and lower and ragged at the nape (an even band read as a
  headband). Hair strands are four-sided tubes and his body 18,500 triangles: with eight-sided strands he passed the
  phone budget (30,300 of 26,000; `pixar-meshy` failed and that push went to `main` before it was caught); now 25,048,
  GLB 2.3 MB, tests 52/52.

## 28 October 2026, night: the older failing tests, and everyone Pixar begun

The owner: "Fix now everyone should eventually be Pixar class so you can reuse the body's of Thuan and Thao and then we
need to make faces as you reuse Johansson".

**The full suite: 67 failing this morning (`f56d7896`), 6 now**, none new. Five agents took them in groups (draw counts,
calendar and cast, street layout, interiors, poses); each fix found a root cause; a stale test was updated only where a
recorded decision changed what is right, and that decision is cited beside it; no check skipped or weakened. Real faults
fixed among them: the diary's impossible "Monday 17 August 1997" (the device calendar), the eisa that never brought the
street out (Tetsuo's bench beat the happening), Nhung walking to nobody's door to open the clinic, Mrs Sato's cooking
spots outside the compact ramen room, the draught mugs' handles in each other on the back bar and two flickers in the jug,
the coin laundry's floor flickering on the slab, power poles in a planter, a school column and a rubbish cage, a flagpole in
a lane, a planter's solid in the shop wall, the ice-cream freezer with no collider, Kōji's ice-plant errand aimed inside
the vending machine, Mr Fujita's hand off the jug on his last sips, Mr Fujita's squint lost to a later eye style, a walker
stuck turning on the spot, Thuan snapped round at the till, and the lawn's south return wall (described, never built:
a 0.85 m gap 0.4 deep between the lawn and the quay; now built, `east-lawn-south-return`).

**Left for the owner** (tests still failing, the options in the agents' notes):
- `architect-masterplan`: props placed on 20 and 21 October (your fish-market drinks machine among them) stand in the 1.9 m
  walk band kept round buildings since 17 October. A: move them all; B (recommended): a measured minimum clear width past a
  fixture (e.g. 1.2 m); C: adjust some walk bounds.
- `izakaya-lived-in`: the leftover-evening props are all in the old walnut room's places and no longer built: (a) place them
  in the compact room, or (b) retire the module.
- `pole-hug` (Miss Higa): her long skirt hangs across the pole between her knees: (a) the skirt's cloth drapes round the
  pole, (b) a skirt variant of the hug, knees together, or (c) accepted.
- `onsen-seats`: three sitters 1 to 4 mm (a head 1.5 cm) outside the massage chair's keepClear: re-measure in Studio and
  republish the card once the bodies settle.
- `published photo articles retain their real model portraits`: already failing this morning, not yet looked at.

**Everyone Pixar** (jojo `3d/cast/clones/progress.md`, `checks.md`): World's `tools/cast-recipes.mjs` writes every active
resident's look and height (17, 13 still cartoon); jojo `clone_recipe.py` makes the first pass from it (the donor's sculpt
at the resident's height, skin, eyes, brows, clothes painted and shaped, shoes or sandals, short hair painted, stubble
evened), and `game_meshy.py <key>` uses it when the resident has no `<key>_meshy.py`. Men from Johansson, women in a skirt
from Thao, women in trousers from Thuận (her export cannot clone yet), children want a child's sculpt. **Chin** first:
`chin_meshy.py` (a narrow younger face, smaller ears close to the head, a smaller nose, the donor's smile lines and goatee
smoothed off), checked (ground, car floor, the sip), in World; sheets `jojo 3d/cast/renders/game/chin-*-world.png`. Hats
(his cap) and longer hair are still to make.

## 28 October 2026, latest: Chin's rounded-rectangle face and his own hair

The owner: "His face should be more like a rounded rectangle and have a hair like a young boy". jojo `game_meshy.py`:
`egg_face.square` (a superellipse below the widest: sides nearly straight to a broad jaw, the corners rounded into a flat
chin; Chin's power 3.5, widest at 1.64 m of the sculpt) and `build_boy_hair` (a modelled cap from rays onto the scalp:
thick on top, short over the ears and the nape, short sideburns, a fringe of rounded locks above the brows; coloured per
vertex, weighted as the scalp under it; World draws a `hair` part without a texture per vertex, pixar.js). The painted
temples only under the sideburns. Chin: body 17,000, hair 3,136, card 21,560 triangles. Avatar tests 102/102; the sip
2 mm from the lips. Sheets `jojo 3d/cast/renders/game/chin-face-world.png`, `chin-body-world.png`. Then, the owner: "Fix why would I accept any faults ?". Seen from behind (the sheet's
face cells now include `back` and `back three-quarter`) and fixed: the donor's grey behind the ears and across the nape
painted his skin (`grey_off`, first of his paint rules); the shirt's paint stopped at its collar (`clone_recipe` top rule
to 1.515 m: above it the donor's grey read as cloth and showed as a pale strip; every clone); the scalp's dark paint only on
the crown under the hair; the hair's edge thinning to the skin over the ears and at the nape (no ledge), locks all round,
grooves down from the crown, its clumps lit along their ridges (near-black alone read as a flat cap). Nothing clips in the
poses (the think pose's fingers on the hair). The sip 2 mm from the lips; avatar tests 102/102. Full suite: the same 6 older failures, none new. On main (`7bfc2ba8`).

## 28 October 2026, latest: Chin's second mouth gone

The owner, circling Chin's mouth: "It's like he has two mouths". The donor's upper lip stood forward and ended in a crease
1.5 cm under the nose, where `flatten_muzzle` stops short of the nostrils; it read as a second mouth over the drawn one.
jojo `game_meshy.smooth_upper_lip` (Chin's `muzzle.upper_lip`, z 1.538 to 1.575 of the sculpt) lays each front column
from the mouth to the nose's base on one slope (measured: the 5 mm step at 1.369 m is gone). Re-exported, in World;
sheets `jojo 3d/cast/renders/game/chin-face-world.png`, `chin-mouth-before-after.png`. Avatar tests 99/99.

## 28 October 2026, latest: the clones' faces from the avatar creator

The owner: "Can you combine them with the old avatar creator? To make the faces more interesting". A clone's card says
`face: 'recipe'` (jojo `game_meshy.py` writes it for a `clone_recipe` body; Chin's card has it), and World reshapes the
donor's modelled face from the resident's recipe (`src/avatars/pixar-face.js`, used by `pixar.js dressPixar`, which now
takes the recipe from `build.js`): each creator eye style as the modelled eye's width, height, iris, lid line, slant,
corner and lashes (size, width and tilt sliders too; kept inside the decal's disc); each brow style as an arch, a slope,
a flattening, a thickness, a length, a taper and bushy hair (size, height and tilt too; `none`: no brows); each mouth
style as how the mouth rests under every feeling (featuresOf `base`) and its width. eyes3d.js `eyeShape` now takes an own
eye's `cut`, `slant` and a round eye's `corner`. The hand-made faces (Johansson, Thuận, Thao, Tetsuo, Mr Fujita) are
unchanged. `tools/pixar-sheet.mjs --face '<json>'` tries other parts on a face; tests `tests/pixar-face.test.mjs`.
Sheet: `jojo 3d/cast/renders/game/chin-recipe-faces.png` (Chin as his recipe, and four other combinations). Not yet
carried over (export-side, `clone_recipe.py`): the nose's style (only its size), glasses, moustache and beard. Seen: the
painter's `smile` feeling barely lifts a clone's mouth (it did before this). Published to main with Chin's fixes below
(the owner: "Yes push"; `7bfc2ba8`).

## 28 October 2026, last: corrected and audited ("Correct it audit yourself")

Corrected, each measured (scratchpad probe-cab.mjs, probe-stand.mjs) and the full suite run before and after:
- **Every Pixar sole on its foot bone** (jojo `game_thuan.soles_on_foot`, in the game export and the film rig): World keeps a
  foot on the floor by the points its foot bone carries rigidly (foot-ground.js), and Johansson's soles (0.6 foot, 0.4 shin)
  went 9 cm into a car's floor, Thao's 4, Thuận's 6. Johansson, Thao, Thuận and Tetsuo re-exported (cards otherwise
  identical): seated in the car and the kei truck their soles are on the floor (0), standing and walking on the ground (0).
- **Drivers**: never the floor-sit (animate.js `floorWeight`: a car's 0.46 seat over its 0.265 floor read as a cushion and
  threw the legs 8 to 12 cm toward the pedals; found by the audit), and their heels planted on the cab floor
  (`heelsOnFloor` when driving). The harbour master, Nhung, Johansson, Thao, Tetsuo and Thuận: soles on a car's floor.
- **The vehicle errands** (town-traffic.js): on the Minato Maru's own sailings, one car a sailing (the errands still ran at
  the times set before her timetable of 21 October, when she lay at Kitano-jima, and a car waited at the ramp with no boat):
  Tetsuo 07:30 over, 08:08 back, Mon/Wed/Fri; the harbour master the same, Tue/Thu/Sat; Thao 14:08 over, 14:45 back, daily;
  Nhung 21:38/22:15 Mon/Thu; Mrs Sato the same, Tue/Fri. The tests brought up to date: Reiko retired with her car (five
  vehicles), the times on their weekdays (day 0 a Thursday), the 0.19 jug, a skirt's lap hand (Vy).
- From the audit too: the bushy brow tufts laid along the brow (they slid through a pattern fixed on the skin as his brows
  moved), the first-person sip back on its own curve (hands.js; the residents' gentler sip had changed it), the weakened
  test checks restored, the film scalp's skin read from the top of whichever head.
Full suite: 67 failures this morning (`f56d7896`), 60 now; none new, 7 fixed. The 60 left are older and outside this work
(building circuits, stairs, hats and necklaces, the countryside, dining surfaces, Obon, the ferry design book and others).
Not fixed: Mrs Sato's feet hang 9.6 cm over her kei truck's floor (a short body on its 0.56 seat; the door and dash hide it);
the harbour master's cap touches a car's roof (it did this morning); the errands' far-shore stop is a turnaround (their
`back` falls before the boat arrives, as the airport errand's test has it); no one drives the delivery truck.

## 28 October 2026, latest: Tetsuo in his kei truck, and his shoes on the ground

The owner: "Will he fit in the car now on Minato island". Measured (scratchpad probe-cab.mjs: every drawn vertex of him,
skinned, against the cab, as vehicle-driver.js seats him; and a cut-away of the footwell): his head, glasses and all,
11.8 cm under the kei truck's roof (car 8.5, kei car 4.6), nothing through the cab. Two faults found and fixed:
- **The shoes**: their weights had been copied from the skin nearest them after the foot inside was deleted, so they rode
  the ankle and shin: his toe went 7.8 cm into the ground in his stride, and the heel block hung 1.2 cm under the sole.
  Now each shoe rides its foot bone (`footL`/`footR`, and `foot.L`/`foot.R` for the film rig) and the heel is built up
  inside it: standing and walking, his lowest point is the ground (probe-stand.mjs: 0, 0; this morning's sandals 0, 0).
- **The cab** (every driver): drivers' feet were set on 0.22 and the floor's top is 0.265 in all four vehicles (measured
  by rays), so soles stood 4 to 8 cm in it; `DRIVER_SEATS.floor` 0.265, `vehicle-driver.js` uses it. The kei truck's front
  wheels lie under the footwell and the outer foot stood 3 cm into the tyre: its driver sits 0.27 from the middle (was
  0.32), the seats drawn under where they sit. Tetsuo in the kei truck: soles on the floor, nothing in a tyre.
Sheet: `jojo 3d/cast/renders/game/tetsuo-kei-truck.jpg`. Published `d7e5505d`.

Found, not fixed: Johansson's sandal soles are weighted 0.6 foot / 0.4 shin, so seated his lowest points go 4 to 9 cm into
a car's floor whatever the floor height (the feet are planted by the foot bone); his export wants the sole on the foot
bone as Tetsuo's shoes are. In the delivery truck a Pixar driver's feet hang 8 to 9 cm over its floor (its seat is 0.72
high; nobody Pixar drives it yet). `tests/owned-vehicles.test.mjs` fails 5 tests already at `f56d7896` (05:48 today),
before the day's work, as `drink-grip` fails 2.

## 28 October 2026, latest: Tetsuo's brows bushier

The owner: "Make his eyebrows bushier" ("I mean Tetsuo"). Thicker (`brow_thin` 0.7 to 1.05 of the painted brow, jojo
`tetsuo_meshy.py`) and with a bushy edge: World's brow shader takes a body's own `browBushy` (face-acting.js, Tetsuo 1;
face-features.js `uBrowBushy`: the outline in tufts, hairs standing out of the top and the ends, a grain along the brow);
the film model draws the same tufts (`film_meshy._brow`, `brow_bushy`). Sheet: `jojo 3d/cast/renders/game/tetsuo-brows-world.png`
(at rest, three-quarter, happy, angry, surprised, thinking). Tests 65/65.
Then "They are too long": cut to (-10.5, 15.5) of the eye's units (`brow_span`, read where the export takes the brows, so
the game and the film model both get it; they ran from -12.6 to 23, an eye's width past its corner), the outer ends tapered
(`browTaper` .3).

## 28 October 2026, last but two: the seated drink

The owner: "Sit drink is still not right". Two faults. The review sheet (`tools/pixar-sheet.mjs`) posed `sit drink` with
no glass, so the drink arm's empty fist rammed his chin: its drinking cells (drink, sit drink, sit toast) now hold a
draught glass as the game does at a table (`createDrinkProp`, `fitAvatarHeldProp` each frame). And the sip itself
(`consume.js`, for every Pixar body): a full glass was tipped 31 degrees with the head nearly still, so the beer stood 13 mm
over the lip side of the rim and the glass's far wall swung into the nose. Now a full glass tips 11.5 degrees and more as it
empties (`drinkTilt` 0.2 + 0.75 x drunk), and the head goes back 0.14 to 0.30 rad to meet it (`drinkHeadTilt`). Measured
(scratchpad probe-resident-drink.mjs) for Tetsuo and Johansson at the sip: rim 2 mm from the lips, the beer 2 mm under
the rim, the nose clear. Evidence: `jojo 3d/cast/renders/game/tetsuo-drink-world.png`, `tetsuo-sip-world.jpg`.

Not from this work: `tests/drink-grip.test.mjs` fails 2 of its tests ("Fujita and every actor receive the correct vessel
... keep gripping", 0.19 against 0.15; "Vy free arm rests beside the thighs") already at `f56d7896` (05:48 today), before
the day's Tetsuo work.

## 28 October 2026, last but one: real shoes for Tetsuo

The owner: "Replace his feet with real shoes". `jojo 3d/cast/game_meshy.py build_shoes` (spec `shoes` in
`tetsuo_meshy.py`): on each foot a closed brown leather lace-up lofted along the sandal's own footbed (smoothed, 10%
narrower), a dark sole with a welt and a heel block, a round toe box, five pale laces across the instep, the collar at
8.5 cm so his white socks show (sock paint now from 7 cm). The donor's foot is pressed inside and every face wholly inside
deleted (124,724 at the sculpt's resolution), so no toe shows and its triangles went to the shoes; the shoe takes the foot's
own weights (`hair_weights_from`), so it walks and sits with him. World draws a new part `shoes` (pixar.js: coloured per
vertex as the glasses are, lifted 1.9 under the cel ramp, which turned the brown near black). Body 17,000 triangles, shoes
2,288, 25,836 in all, GLB 2.2 MB; tests 52/52; sheet `jojo 3d/cast/renders/game/tetsuo-shoes-world.png` (no clipping
standing, walking or sitting). The film model takes the same shoes with the film rig's foot and toe weights.

## 28 October 2026, last: film Tetsuo in Blender

The owner: "These changes you made to the game model? Can't you do that to the blender model as well? Make a copy of
Johansson and add these changes to the model". Done in the studio repo (`jojo`, branch `claude/vibrant-brown-0udpq3`):
`game_meshy.py tetsuo ... --resume --film` (`3d/cast/film_meshy.py`) runs every clone change on Johansson's sculpt and
keeps it at film quality: 410,804 triangles, 4K textures, the film rig (IK legs, jaw, arms) bound again at rest (0.00 mm),
eyes, brows and mouth painted for Cycles, 26,550 real hairs (a Curves object on the head bone), the skull under the
donor's sculpted hair rebuilt smooth, the scalp shaded in the shader. The file: `jojo/3d/cast/models/tetsuo/tetsuo-film.blend`
(31 MB); renders `3d/cast/renders/game/tetsuo-film-body.jpg`, `tetsuo-film-face.jpg`; notes in `3d/cast/GAME.md`. World
is unchanged by this. Left: the shorts' roll at the knee from behind, laugh lines, goatee marks under the chin, the
fringe reading as close-cropped felt in wide shots; Fujita not yet run with `--film`.

## Open

0. **A new head for Tetsuo** (the owner, 27 October 2026, with a picture of a bald old man in round glasses: "Can you use
   this head for Tetsuo", pointing at Hi3D v1.0, <https://github.com/hi3d-official/Hi3Dv1.0>). Hi3D refines a coarse mesh
   to fine geometry from the picture; it makes no colours and needs an NVIDIA GPU (no CPU path). The Space
   `hugging-apps/hi3dv1` runs it (Hunyuan3D-2mini coarse mesh, then Hi3D), but this container's free GPU quota is spent and
   the Hugging Face connector here cannot run Spaces: a read-only `HF_TOKEN` in the environment, or the owner running the
   Space and handing over the GLB, unblocks it. The picture, cropped: scratchpad `tetsuo-head/input.png` (copy in
   jojo `3d/cast/models/tetsuo/reference.jpg`). Then: the head cut at the neck, fitted on the clone's neck, the picture
   projected on its front and the rest painted his skin, the glasses taken off the mesh (World draws its own), the face
   run through `paint_out_face` for rigged eyes, brows and mouth.
1. **Faces, the last details:** a few dark specks remain beside Thao's eyes and on her nose (lash-fin and nostril
   remnants under the dilation); his hair at the temples is the texture's painted streaks (the side view). His iris
   decal's seam at its edge. (The brows' remnants and his blotched skin: done this afternoon, above.)
2. **Thuận's hands and the things in Sakura** (the owner, 27 October 2026, evening: "Thuan needs to be able to
   interact with the items in Sakura too, pick up a can etc, hands is something you need to put some effort in"). Her
   Pixar body is the Tripo model with grafted hands; the plan: (a) when the owner gives a Meshy Thuận, her own hands with
   grip keys as his; until then, graft the Meshy hands onto her (`game_thuan.py`'s graft, the Meshy hand mesh as the
   donor) and give them the same keys; (b) finger bones on World's skeleton (thumb, index, the three others as one
   chain) driven by the grip, so a can, a bottle, a basket and a broom each get their hold; (c) the Sakura shelves'
   items made holdable (`heldProp` with `grip` data: radius or handle, height), the pick-up and put-back as the izakaya's
   table performance. Start with (c) and the existing grip keys: a can in her hand at once; the fingers later.
3. **His in-game checks, done once** (`node tools/pixar-shots.mjs --scenes --name Johansson <out>`, 81 steps; the
   studio repo's `renders/game/johansson-meshy-game-*.jpg`): idle, walk, gestures and the counter are clean, and the
   draught served at his seat is drunk by the game's own performance with the rim at his lips (`report.json`
   `sip.moments`: `valid` at the sip). The hand stays open around the mug: a holding hand shape is the next step
   (World's skeleton has no finger bones; a closed-hand shape key on the Meshy hand, driven by `heldProp`, is the
   likely route) — done at night: finger bones, above. The stools fit him (feet on the rail, knees at the counter);
   then the izakaya redrawn in CAD.
4. Thuận is still on her Tripo model; the same route takes a Meshy Thuận when the owner gives one.
5. The earlier Pixar Johansson route (the free sculpt, separate shirt and shorts) is kept in the studio repo out of the
   game; its last fixes of the morning (the wrist graft, the hand straight at rest, a wrist weight ramp) live in the
   shared code and serve the Meshy route.


## 29 October 2026: Sakura can handling — investigation only

Owner requested Thuận pick up, hold and return a canned drink naturally at Sakura, preserving stock and routines, with actual-game movement screenshots and verified integration.

Investigated main at `bbea598ea7ece51ddb574c91e04201d718fc780f`. No implementation, PR, screenshots, or release was produced in this pass; the request remains open. The older open note above saying her fingers are a later step is stale: the 27 October beer section and `assets/avatars/pixar/thuan.json` record her finger bones. `node --test tests/pixar-thuan.test.mjs` passed 6/6 on the inspected checkout; this is not a can-contact or game interaction test.

`src/people/retail-clerk.js` and `shop-retail.js` set `shop-<id>` held items and shelf reach flags; `src/avatars/actors.js` does not currently create a prop for that kind. Shelf goods are instanced in `sakura-interior.js` and controlled by stock counts, so a pickup needs a reversible visual reservation of the specific occupied instance, with cancellation and concurrent stock changes handled without changing the ledger. Use the existing hand/IK and grip code, and interrupt safely for customer service, shift changes, leaving the shop and save/reload. Verify reachable placement, hand and finger contacts, fixture clearance, stock conservation and normal routines in the built game; capture reach, grasp, lift, hold, return and release from informative views. Run focused tests, runtime build and the World guard before integration.

