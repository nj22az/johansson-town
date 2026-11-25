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
