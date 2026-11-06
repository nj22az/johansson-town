# World: the Look picker as a camera's strip, with live pictures — 29 October 2026

The owner: "Maybe use your work to enhance the UI in the game , shader picking is a surprise I want to be able to choose
from a menu like in the camera app you are making and see the results", and "In world the menu blocks the whole screen
the camera app looks more sophisticated" (with a phone screenshot of the old sheet: a full-screen grid of the same
little house in each style).

## What changed

- `src/ui/look-picker.js`: the picker is a strip along the foot of the screen, in the camera app's material (dark
  translucent glass, the camera's yellow ring for the chosen look), with the town left in full view above it. The
  head shows the chosen look's name and its one-line hint; × , Escape or a tap on the town closes it; Left/Right move
  along the strip, Enter or Space choose. A tap draws the town in that look at once and the strip stays open.
- Each tile is a **live picture of the town as it is on the screen, in that look**. The little-house swatch
  (`lookSwatch`, kept, still used by the free camera and the website's Pocket Camera) stands in until it is drawn.
- `src/render/ink-pipeline.js`: `shrinkPicture(target)` copies the last frame's graded picture (before any look) into
  a small target, sixteen samples per small pixel; `renderLookPreview(name, source, target)` draws that picture
  through **the look's own pass** (the one the town is drawn with, with the frame's depth and focus) into another
  small target. Every uniform it sets is set again by the next live frame.
- `src/render/look-previews.js`: one round per opening (the frame shrunk once), one look per animation frame, the
  chosen look first and then outwards, so compiling looks never chosen before costs a frame at a time.
- `src/game.js`: the picker is given the previews. Without the ink pipeline (CSS-only looks) the swatches stay.
- Runtime rebuilt (`npm run build:runtime`: the boot and game chunks changed; the build pruned the stale ones).

## Checks

- `node --test tests/look-picker.test.mjs` 2/2, `node --test tests/runtime-package.test.mjs` 4/4.
- The real game, booted from source in software Chromium (`?audit&visual-audit`, the method of
  `tools/cloud-boot-smoke.mjs`), at 390×844 touch and 1280×800: the picker opened from the Town book's Look button;
  18 of 19 and 14 of 19 live pictures drawn within the wait (the rest were still arriving one a frame on SwiftShader);
  Manga and Watercolour chosen from the strip and drawn on the town behind it; no page errors. Screenshots inspected.
- `node tools/ci-guard.mjs`: 451 of 452 passed; the one failure was `tests/no-z-fighting.test.mjs` running out of Node's
  default 2 GB heap (SIGABRT). With the heap CI gives it (`NODE_OPTIONS=--max-old-space-size=6144`,
  `.github/workflows/johansson-world.yml`) it passes 13/13. Run the guard with that option in a cloud session.

## Limits

- The pictures are drawn from the frame as the picker opens (the town is held still while it is open); they are not
  redrawn while it stays open.
- Under the Cartoon look the frame's surfaces are already flattened, so the other pictures show them flat too.
- Not checked on a physical phone or a real GPU (frame cost of compiling the looks for their pictures on first open).

Made on `claude/friendly-darwin-a4e3re`; published to `main` as `3e68490df` (a fast-forward) on the owner's word, 29 October
2026, when they could not find the camera on the live site.
