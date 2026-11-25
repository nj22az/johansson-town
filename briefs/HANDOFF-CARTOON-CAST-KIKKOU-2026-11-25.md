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
