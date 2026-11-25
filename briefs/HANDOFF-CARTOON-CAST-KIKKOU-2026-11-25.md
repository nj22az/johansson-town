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
