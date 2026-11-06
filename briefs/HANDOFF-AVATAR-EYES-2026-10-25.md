# Handover: rigged cartoon eyes in World (25 October 2026)

Step 1 of the avatar remake (the creator: "remake the characters in the game with Blender … improve the current
avatars: eyes, neck, hands, feet, hair, clothes"; "We are not looking for uncanny valley we want rigged cartoon eyes"; the
cosy-anime critique of 13:19). Plan and Blender proofs: studio repo `nj22az/jojo`, `3d/cast/avatars-cad/HANDOFF.md`.

**State: the creator saw the sheets (25 October: "I think it looks better already"). On branch
`claude/avatar-remake-continue-llretw` the eyes are now on for everyone (`?eyes3d=0` shows the painted ones), main merged
in, runtime rebuilt. **Published to main on the owner's word ("Push", 25 October 2026)** by fast-forward from that branch
as `b3ebec8a`. Verified live: GitHub's Johansson World guard run 251 passed on that commit, and Pages serves the new
runtime (`runtime/boot-Ban7D3-8.js`; the eye shader is in the live `runtime/animate-lYukqVp_.js`).**

## What it is

`src/avatars/eyes3d.js`: one shallow curved disc per eye on the head bone (both eyes one mesh, one material, 480
triangles), laid where the painter draws each eye (the head's own projection, `face-objects.js faceObjectPoint`), 1 mm off
the skin and about 4 mm at the middle of the eye. A fragment shader draws the eye in the painter's own units
(`face.js drawEye`): each style's sizes, the dark ovals (with a little of the eye colour low in them) and the white eyes
(iris gradient, limbal ring, pupil), **two highlights**, a **thicker curved upper lash line** with an outer flick, a soft
warm line on the outer third of the lower lid, the lid shapes of each feeling (cross, sad with a tear, shy, smiling, daze,
deadpan, the big reaction eyes) and a **2D blink**: the lash line pulled down into the closed ∪ (happy: the ∩).

- Gaze and blinks are numbers on the material: no repaint of the face canvas (`paintFace` keys the canvas without them
  while the discs draw). The iris slides; per-eye blinks from a performance (`blinkLeft/Right`) are each eye's own.
- The disc draws only the eye: transparent, no depth write, `renderOrder -1`. The ink pass (which reads depth), the Looks'
  normals buffer (`look-buffers.js` skips materials without depth) and everything painted round the eyes (brows, the
  nose bump) are exactly as before; glasses' lenses and a painted beard still draw over the eyes. An earlier version that
  painted skin round the eye left rim dots, nudged brows a pixel and nicked the nose bump: found by a render diff, fixed.
- The painter keeps the eyes the discs do not draw (stars, hearts, spirals, pain, wink, smug, droop, dreamy, and the
  `squint` style in every feeling): the discs hide and the canvas paints them, as today.
- `animate.js`: a blink now closes over 0.04 s, holds and opens over 0.06 s (fractional values); the painted eyes are shut
  while it is past half, about 0.126 s against the 0.13 s before. Everything else that reads `blink` thresholds at 0.5.
- Switch: `buildAvatar(recipe,{eyes3d})`, default `eyes3dOn()`: on, unless the page asks `?eyes3d=0` (World, Studio, any
  page that builds avatars). The GLB export (`export.js`) always builds with painted eyes.

## Checks run (25 October)

- `node --test tests/eyes3d.test.mjs`: 6/6 (off by default; placement against the head's own texture coordinates for all
  six residents, within 1.5 canvas units; 1–8 mm off the skin; ≤ 600 triangles, one draw, no depth write; a shape for
  every style × drawn state; the canvas skips exactly the eyes the discs draw, for every expression; gaze and blinks
  reach the shader without a repaint). Added to `tests/ci-guard.txt`.
- `FACE_BROWSER_TEST=1 FACE_EYES3D=1 node --test tests/face-lighting.browser.mjs`: pass; minimum eye contrast in dim light
  over every Look 0.0646, the same as the painted eyes (floor 0.045).
- `EYES_BROWSER_TEST=1 TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium node --test tests/eyes3d.browser.mjs`: pass. The six
  residents front and three-quarter in the ink pipeline: 3,854–15,009 eye pixels drawn per view, **0 pixels changed
  outside the eyes**. (After `npm ci` the local Playwright wants its own browser; point it at the container's.)
- `node tools/eyes3d-sheet.mjs`: a sheet per resident (painted today, rigged, four looks, half and full blink,
  three-quarter, side, eleven feelings, dizzy painted). Copies for the creator: jojo `3d/cast/avatars-cad/eyes-game/`.
  Every cell looked at: no clipping, glasses in front, Vy's fringe clear, Thuan's heavy lid at its painted height.
- Full CI guard (`node tools/ci-guard.mjs`, 83 files): 419/422 in one run. The three failures, none in avatar code, pass on
  rerun: `english-language` (this container had no `node_modules`; passes after `npm ci`), `runtime-package` (passes after
  `npm run build:runtime`, committed), `no-z-fighting` (the town scan ran out of node's default 2 GB heap here; 13/13
  with `NODE_OPTIONS=--max-old-space-size=6144`, as on CI's larger runner).
- `node tools/cloud-boot-smoke.mjs --eyes3d` on the rebuilt runtime (phone viewport, third person): island ready in 31 s,
  no page errors, street, room and `player-face` photographed; Johansson's eyes in the game: jojo
  `3d/cast/avatars-cad/eyes-game/Johansson-in-game.jpg`.
- **After switching on by default and merging main** (`fe9a38d9`, the cargo berth): runtime rebuilt; full guard
  `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs` **438/438, 84 files, all green**;
  `cloud-boot-smoke --eyes3d` on the built runtime: no page errors, Johansson's face photographed (in the rain);
  `eyes3d.browser.mjs` pass; `face-lighting.browser.mjs` pass with the rigged eyes (now its default) and with
  `FACE_EYES3D=0` (painted). Run that one without `TOWN_CHROMIUM_PATH`: the full Chromium binary requests
  `/favicon.ico`, which the test counts as an error (the headless shell does not).
- Not checked: a physical phone or a GPU browser (software GL only); the Studio avatar creator page.

## Next

1. ~~The creator judges the sheets~~ (done: "looks better already"); ~~switch on by default~~ (done on the branch).
2. ~~Publish~~ (done: `b3ebec8a`, guard run 251 green, live on Pages). Not yet looked at on a physical phone.
3. Notes on the look go into `eyeShape` (sizes, lids, lash weight). Then the rest of the cosy-anime critique (the face
   painter: brows, mouth line, stubble, blush, nose, ears) and the remake's step 2, the neck (a drawing first).
