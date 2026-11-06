# Handover: Pixar Thuận in Johansson World (26 October 2026)

The owner, 26 October 2026, in order: "Continue to work in Pixar avatars and see if you can implement Pixar Thuận into the
game"; "Her eyes need to be rigged too"; "Show screenshots in game"; "Yes the eyes need to work properly and be rigged and
animated in her head beautifully"; "Why is she so brown in your screenshot? She is a pale light skinned girl"; "I think you
need to rig the nose and eyebrows and mouth too"; "Make the eyebrows individual, they shouldn't be mirrored"; and **"Replace
her in the live game and studio now"**. Two pasted critiques (a cosy-anime/Pixar facial-performance review) set the list
of what the face must do.

**Decision recorded:** the owner's workflow of 24 October keeps `main` cartoon until the Pixar world is complete; for
Thuan, by his word of 26 October, the Pixar body replaces the cartoon in the live game and in Studio. Everyone else stays
the cartoon. `?pixar=0` on any World or Studio page shows the cartoon Thuan, to compare.

## State

**Published to `main` on the owner's word ("Replace her in the live game and studio now", 26 October 2026)** from branch
`claude/vibrant-brown-0udpq3` (site repo) by fast-forward; the publication commit and its GitHub checks are recorded in the
section "Publication" below. Studio repo: branch `claude/vibrant-brown-0udpq3` of `nj22az/jojo` (the export script,
`3d/cast/GAME.md`, review images in `3d/cast/renders/game/`), not merged into jojo's `main`.

## Publication (verified 26 October 2026)

- `main` fast-forwarded `9c7db3e8..b427c89e` ("Pixar Thuận replaces the cartoon Thuan in World and Studio").
- GitHub **Johansson World guard run 253: success** on `b427c89e`; **Pages build and deployment run 1438: success**.
- Live: 8 of 8 files checked on `https://nj22az.github.io/` match the commit byte for byte (the model and card, World's
  `index.html` and `runtime/boot-BPtKRZQl.js`, `src/avatars/pixar.js` and `face-features.js`, Studio's `studio.js` and
  `index.html`); the live game page loads `runtime/boot-BPtKRZQl.js`. Not looked at in a browser on the live site itself
  (the booted-game screenshots are of the same files served locally).

## Then: Pixar Johansson audited (not started as a game model)

The owner: "Audit him thoroughly use what you learned from Thuan". Studio repo `3d/cast/AUDIT-JOHANSSON-GAME.md`
(`audit_game.py`, evidence `3d/cast/renders/game/johansson-audit-*.jpg`): **not ready**. His arms turn 45° to World's rest
and push through his fused sleeves; the hand graft shows (a jagged, darker wrist); his texture is the concept projected
from front and back (seams down the sides of his face, the shirt's blue on his neck); the sculpt has a fold from nose to
jaw; his skin is far darker than his film render; the speck cleaner would take his stubble; Thuận's face windows find
nothing on him. Order of work and the step-by-step: `AUDIT-JOHANSSON-GAME.md`, `GAME.md`. Nothing in World changed for him.

## What it is

- **The model** (`assets/avatars/pixar/thuan.glb`, 1.39 MB; card `thuan.json`): her film model (studio repo `nj22az/jojo`,
  `3d/cast/game_thuan.py`, how it works in `3d/cast/GAME.md`) posed into World's rest (arms and legs straight down), on
  World's own bones plus the face's (jaw, nose, cheekL, cheekR), 21,398 triangles body and hands, 480 eyes, 560 brows,
  384 mouth; one 2048 JPEG texture; World's height for her (1.6211).
- **`src/avatars/pixar.js`**: loads the model and card at boot (`src/boot.js`, beside the controls, before the town builds
  its people; Studio: `avatar-creator/studio.js`). `buildAvatar` (build.js) takes her card's measures and joint places in
  place of the cartoon's when it builds Thuan, so World's walking, sitting, reaching, feet and braid springs (springs.js
  `m.braids`) meet her own body; the cartoon's meshes stay built and hidden (`hideCartoon`, also after `wear()`). Versioned
  URLs (`PIXAR_BODIES.Thuan.version`, the GLB's SHA-256 prefix) so a new export is never served from a cache.
- **Her face, rigged**: her painted eyes, brows and mouth are painted out of her texture (and their sculpted bumps
  smoothed, so World's ink does not trace them) and drawn live on decals:
  - **Eyes** (`eyes3d.js`, the rigged eyes already on main, with new parameters that are 0 for the cartoon): her own size
    and lashes; lids that follow the gaze (a third: up into the brow, down over the iris); the highlight stays where the
    light is while the iris slides under it; the iris lies under the cornea (parallax as the head turns); the caruncle;
    wide eyes open in her own socket; blinks per eye; a wink; the painter-only eyes (stars, hearts, spirals, pain…) stand
    in as drawn ones.
  - **Brows and mouth** (`face-features.js`): each brow its own measured shape (not mirrored), lifting, tilting, arching
    and pinching per side; the mouth's corners, width, opening (with shaded interior, separate upper teeth, tongue),
    O-shape, smirk, pucker, wobble, sideways shift; talking opens a vowel. Every feeling of World's painter (`face.js`
    `moodOf`, newly exported) maps to them, each leaning to one side (never twinned); pain knits the brows, wrinkles the
    nose and clenches the teeth.
  - **Bones**: the jaw drops with the mouth (the chin moves, the face lengthens), the cheeks rise (up, forward, out) with
    smiles and winks, the nose scrunches with anger, pain and a laugh. Everything eases between feelings (0.08 s).
- **Skin**: graded in the export to the pale tone of her film renders (World's sRGB renderer showed the raw texture
  tanned); shaded on the town's high-key ramp, blended (smooth) rather than stepped for her modelled face.

## Checks run (26 October)

- `node --test tests/pixar-thuan.test.mjs`: 5/5 (the model's version, size ≤ 2.2 MB and ≤ 24k triangles, a body, eyes,
  brows and mouth; World's bone names and every joint's rest place; her height and hips where World's animation puts
  them; `?pixar` semantics; every feeling of the painter with and without talking gives finite, bounded features; angry
  is not twinned and not smiling; pain knits, wrinkles and clenches; her eye shapes in every drawn state, **and the
  cartoon eyes' new parameters all 0**). Added to `tests/ci-guard.txt`.
- `node --test tests/eyes3d.test.mjs`: 6/6 (one assertion follows the shader call's new argument).
- Full guard `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`: **443/443 pass**, 0 fail (5.7 min), with the
  rebuilt runtime.
- `npm run build:runtime`: rebuilt (`runtime/boot-BPtKRZQl.js`, after a 20 s load timeout was added: a stalled model download draws the cartoon rather than holding the town). On that final build: runtime-package, pixar-thuan and eyes3d tests 15/15; `node tools/cloud-boot-smoke.mjs`: island ready 32 s, playing 42 s, street and Community Hall photographed, no page errors.
- `node tools/pixar-shots.mjs` on the built runtime (software Chromium, 900×900): island ready 40 s, playing 58 s, **no page
  errors**; Thuan found on Main Street walking with Grandmother Higa, drawn as her Pixar body; full front, three-quarter,
  face and four more face frames as the town moved on (gaze and blinks). jojo `3d/cast/renders/game/thuan-in-game.jpg`,
  `thuan-in-game-face.jpg`.
- `node tools/pixar-sheet.mjs Thuan` (the game's ink pipeline): 29 face states (at rest, gaze four ways, half and full
  blink, wink, three-quarter, side, smile, happy, angry, sad, surprised, worried, shy, shock, daze, sleep, talking, grin,
  laugh, grumpy, wink expression, kiss, smug, pain, scared) and the body in seven views and moves (walk, wave, think);
  jojo `3d/cast/renders/game/thuan-face-sheet.jpg`, `thuan-body-sheet.jpg`. Looked at cell by cell; the faint traces
  under "Not done" remain.
- Studio (`/avatar-creator/?r=<Thuan>`): the editor draws Pixar Thuan, and the cartoon with `?pixar=0`; no page errors (one
  404 for the site's favicon, which the test server does not serve). jojo `3d/cast/renders/game/thuan-studio.jpg`.
- Not checked: a physical phone, a GPU browser, the Linux edition, every room and story Thuan appears in (onsen, ferry,
  comics' staging, pair poses with her partner: these build her with her card's measures; pair contacts were tuned for
  the cartoon).

## Not done / limits (and what to do next)

- **Volume and sculpt** (the critiques): the face's silhouette moves by the jaw, nose and cheek bones only; no blendshapes
  (fat pads, brow ridge, lip volume), ears unsculpted, no brow ridge or cheek shelf. Next: a sculpt pass and shape keys in
  Blender, exported as glTF morph targets, driven by `face-features.js`.
- **Drawn features**: eyes, brows and mouth are 2D shapes on the 3D head (decals); no groomed lashes, refractive cornea,
  modelled teeth or tear meniscus.
- **Ink**: World's ink is depth-based and global; her nose's profile is still inked side-on. Drawing her without ink needs
  an ink mask in `src/render/ink-pipeline.js`.
- **Outfits**: only her polo and shorts. Swimwear, the bath towel, the sailor and shopping outfits are not drawn for her
  (she stays dressed in the onsen). Next: the wardrobe (jojo `wardrobe.py`) as further GLB bodies.
- **Studio's avatar maker** edits her recipe, but her body is the film model: its sliders change nothing for her.
- **Faint traces**: a smooth patch a shade off the skin under each eye at a blink; tiny marks where the lash fins were.
- **Devices**: software GL in a cloud container only; no physical phone or GPU browser yet. The model adds about 1.4 MB
  to the first load (fetched beside the controls). The Linux edition (`steam-deck/`) is not repackaged.
- **Pixar Johansson**: the step-by-step is in jojo `3d/cast/GAME.md` ("Pixar Johansson: step by step"); not started.

## Files

`src/avatars/pixar.js` (new), `src/avatars/face-features.js` (new), `src/avatars/eyes3d.js` (rigEyes split out; own eyes;
lid follow, still highlight, parallax, caruncle; make/stand options), `src/avatars/build.js` (pixar option, measures and
rest, hideCartoon), `src/avatars/springs.js` (`m.braids`), `src/avatars/face.js` (`moodOf`), `src/boot.js` (preload),
`assets/avatars/pixar/thuan.glb|json`, `tests/pixar-thuan.test.mjs` (in the guard), `tests/eyes3d.test.mjs` (the shader
call's new argument), `tools/pixar-sheet.mjs`, `tools/pixar-shots.mjs`, `avatar-creator/studio.js` and `index.html`,
`runtime/` (rebuilt).
