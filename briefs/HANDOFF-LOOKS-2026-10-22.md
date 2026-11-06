# Handoff — Look setting (shader styles), 22 October 2026

## Owner's request
"https://github.com/daniel-ilett/smo-shaders is it possible to implement this shaders in a settings menu? To change what
the game looks like", then: "Yea but I want one more, manga or pencil crayon graphics". Both manga and pencil crayon were built.

## What changed (branch `claude/upbeat-hamilton-4bhz8q`, not yet merged; no PR opened)
- `johansson-town/src/render/looks.js` (new): the catalogue (Natural, Black & white, Sepia, Pocket Gentleman, 16-bit,
  Line drawing, Old TV, Manga, Pencil crayon) and one GLSL fragment shader each, written new for three.js. Its set of
  looks comes from Daniel Ilett's smo-shaders (MIT, Unity HLSL); no code from it is copied. Credited in `RESOURCE_SOURCES.md`.
- `johansson-town/src/render/ink-pipeline.js`: an optional final look pass after FXAA, using a lazily allocated `rtLook`
  target. Natural adds no pass; each look's shader compiles the first time it is chosen. `pipeline.setLook(name)`.
- `johansson-town/src/game.js`: the Town book gets a **Settings › Look** row (`#lookButton`) that opens a menu.
  The choice was first saved in `localStorage` key `johansson-town-look`; see "Not saved" below. Without the ink pipeline (reduced graphics) only
  Black & white and Sepia are offered, as a CSS filter on the canvas. Audits use `__JOHANSSON_LOOK__.style` / `.setStyle(name)`.
- `index.html`: the setting row. `src/ui/icon-controls.js`: its icon. `runtime/` rebuilt.
- `tests/looks.test.mjs` (new, added to `tests/ci-guard.txt`).

## Checks actually run
- `node --test tests/looks.test.mjs tests/cel-look.test.mjs tests/runtime-package.test.mjs`: 27 pass.
- `node tools/ci-guard.mjs`: 337 pass, 1 fail. The failure is `no-z-fighting.test.mjs` aborting with a V8 out-of-memory
  error. It fails the same way on unmodified main in this container and passes (13/13) with `--max-old-space-size=8192`.
- Software Chromium (swiftshader) boot via a copy of `tools/cloud-boot-smoke.mjs`: all nine looks rendered at the town hall
  gate, plus Manga and Pencil crayon in the Community Hall, with no shader or page errors. The first pass showed horizontal
  stripes on flat ground (depth-precision noise in the outline detector) in Line drawing, Manga and Crayon; the threshold
  was raised and the stripes are gone. The built runtime menu was clicked through (Town book › Settings › Look › Manga):
  it applies and is stored.
- Not done: no GPU browser, phone or Steam Deck check; performance not measured on real devices. The menu was not
  photographed at the 390 px mobile width.

## Known limits / next actions
- Patterns (screentone, hatching, paper, dither) are fixed to the screen, so they stay still while the world moves
  under them (the "shower door" look). They never flicker on a still camera.
- Manga in very bright interiors is mostly white line art with little tone; consider starting the tone at a higher
  luminance if the owner wants more grey.
- Photo studio captures already include the live look (they read the canvas); its own films still apply on top.
- Possible follow-ups: let the storyteller's comics choose a look; an oil-painting look for the photo studio only.

## Free camera (same branch, second commit)
Owner: "Could you add a free camera option too? So I could rotate and view the scene from any angle; it freezes the game".

- `johansson-town/src/input/free-camera.js` (new): a pure flight step (`stepFreeCamera`) and the controller. Keys: W A S D or
  arrows to fly, E/Space up, Q/C down, Shift faster, Alt slower, mouse drag to look, wheel forward and back. Touch: one finger
  looks, pinch moves, two-finger drag slides. Controller: left stick flies, right stick looks, triggers/bumpers go down and up,
  B leaves. Esc, O or Exit leaves; "Back to start" returns to the entry view. Movement eases in and out. The camera never goes
  below the ground or the room floor and stays on a leash (80 m outdoors, 14 m indoors) so streamed districts stay drawn.
  It respects the player's sensitivity and invert-Y settings.
- `johansson-town/src/game.js`: Town book tile **Free camera** (`#freeCameraButton`) and the O key. While free, the loop
  consumes the clock delta and draws through `renderStill` (the audit's former `render()` body, now shared), so no simulation,
  animation, input or saves advance. Johansson's body is shown even in first person, and the first-person hands are hidden.
  Leaving needs no restore, because play recomputes the camera on the next frame.
- `tests/free-camera.test.mjs` (new, in the CI guard).

Checks: `node --test` on the free-camera, looks, cel-look, runtime-package and audit-boot tests: 35 pass. CI guard: 344 pass,
1 fail (the same `no-z-fighting` out-of-memory failure; `--max-old-space-size` does not reach its child process). `node tools/cloud-boot-smoke.mjs`
on the rebuilt runtime: clean, so audit stills still work through `renderStill`. Source boot in software Chromium at 960×600:
O entered (HUD hidden, bar shown); E+S rose and backed off; a mouse drag turned the view. Two screenshots 4 s apart with no
input were pixel-identical (the world is frozen). Esc returned to the original view with the HUD back.
Not checked: touch gestures and controller on real devices; the bar at phone width.
Known: with the clock on real time, the wall clock keeps running while frozen, so the town catches up on leaving, as after any
pause. The lens passes through walls, by design.

## Pushed to main — 22 October 2026
Owner: "Push camera to main". The branch, both the Look setting and the free camera since the camera commit builds on it,
was merged with `origin/main` (3 commits: PRs #368 and #369 and their handover) and pushed to `main` directly, with no PR.
`tests/visual-audit-freeze.test.mjs` (new on main) reads the audit's render body from `game.js` as text. It now also loads
`renderStill`, which that body delegates to; its assertions are unchanged. After the merge: that test, consolidation,
runtime-package, audit-boot, free-camera and looks tests: 19 pass. CI guard: 348 pass, 1 fail (the `no-z-fighting` out-of-memory
abort in this container, also on main). Watch the `johansson-world.yml` run on main for the real result.

## Easier to find — 22 October 2026, evening
Owner: "The shaders doesn't work? Or I can't find them". The live site (boot `CrnpvRVi`) had them and they worked at phone
size, but the Look row was folded two levels deep (Town book › Town tools › Settings). Changes:
- The Look control is now a Town tools tile beside Free camera (`#lookButton`, text "Look · <current>"), not a Settings row.
- The free camera bar has a "Look · <current>" button, and L steps through the looks while flying (`look` option of
  `createFreeCamera`; `nextLook`/`drawableLooks` in game.js). Reduced graphics only step through the colour looks.
- The free camera bar wraps at phone width (the hint was squeezed into a narrow column and Exit was cut off).
Checks: focused tests 40 pass. CI guard: 355 pass, 1 fail (the same `no-z-fighting` out-of-memory abort here). A built runtime
run at 390×844 with touch: the tile is visible in Town tools; free camera opened from the tile; the bar's Look button stepped
Natural › Black & white › Sepia … › Manga, each drawn. Live site before this change was checked the same way: the old path
worked, so nothing was broken, only hidden.

## Icons instead of text — 22 October 2026, night
Owner: "The menus are too text heavy, can they be more icon based?"; asked which menus, they chose the Look picker and the free
camera bar (not the Town book or the shared activity menus).
- `src/ui/look-picker.js` (new): a 3×3 bottom sheet. Each look is shown as the same little house drawn in that style
  (`lookSwatch`, inline SVG) with a one-word name (`LOOKS[id].short`). A tap applies the look live and the sheet stays open;
  ×, Escape or a tap above the sheet closes it. While open it swallows keys and wheel, and stops pointer events reaching the
  game. It replaces the activities.menu Look list.
- The Town tools tile now just reads "Look".
- Free camera bar: three round icon buttons (current look's picture, which steps to the next; reset; close). The controls
  hint shows as keycaps/short gestures for 4.5 s, then fades.
- `tests/look-picker.test.mjs` (new, in the guard).
Checks: focused tests (free camera, looks, picker, visual-audit-freeze, runtime-package, audit-boot) pass. Built runtime at
390×844 touch: the picker opened from the tile, Crayon applied live, the free camera bar showed icons and stepped looks.

## Four more looks — 22 October 2026, night
Owner: "Add the shaders you suggested". Added to `src/render/looks.js` and the picker (`src/ui/look-picker.js` swatches):
- **Miniature** (`tilt`): tilt-shift. A sharp band at 46% height, a 24-tap golden-angle blur growing above and below, and
  stronger saturation and contrast.
- **Woodblock print** (`print`): ukiyo-e. Nearest of ten woodblock inks, a key-block outline, wood/paper grain, and the sky
  replaced by a Prussian-blue-to-paper bokashi.
- **Watercolour** (`watercolour`): domain-warped, softened and partly posterised washes over paper. It has blooms, darker
  wet edges, granulation, and unpainted paper in the lightest tones.
- **Oil painting** (`oil`): a 4-sector Kuwahara (64 samples a pixel) with brush-stroke and canvas texture. `heavy:true`:
  `drawableLooks` leaves it off handheld devices, and a saved `oil` falls back to Natural on one.
FSR 1 (the DLSS alternative the owner asked about) was suggested as a performance feature and is **not** built: it is
an upscaler, not a look. It would replace the final bilinear scale when the resolution governor drops below 1 and needs
measuring on real devices first.
Checks: focused tests 43 pass. Software Chromium: all four rendered on the street, Print and Oil in the Community Hall, with
no shader errors. Miniature, Watercolour and Oil were strengthened after the first look. The picker shows 13 looks on desktop.
Not measured: frame cost of Oil/Watercolour/Miniature on real GPUs.

## Not saved: every start is Natural — 22 October 2026, night
Owner: "Should revert to normal when restarting the game regardless which one I have used". The look is no longer saved.
`game.js` starts at `look='none'` and calls `clearSavedLook`, which removes the old `johansson-town-look` key, on every start;
`readLook`/`writeLook` are gone. Checked in software Chromium: Manga chosen and an old `oil` key planted, then reload and
START gave `none`, with the key removed. Focused tests pass.

## Oil painting on phones and tablets too — 22 October 2026, night
Owner: "I really like oil, are you sure it won't work on the website". It always worked on the website on computers; it was
hidden on handheld devices. Now every device offers it. `lookFragment(name,{light})` prepends `#define LIGHT`, and the oil
shader then takes 2×2 samples a sector over the same reach (16 a pixel, not 64). `createInkPipeline({lightLooks})` passes
it, and game.js sets `lightLooks:handheld`. `heavy`/`lookIsHeavy` are removed. Checked in software Chromium at 390×844 with
touch: 13 looks offered, and Oil drew the light version without shader errors, close to the computer version. Not measured:
frame rate on a real phone or iPad.

## Oil keeps faces and lettering — 22 October 2026, night
Owner: "facial features should still be able to show even in oil… And signs too… face details and text should be able to show
even though it's so heavily stylised". In the oil shader, after the Kuwahara, any pixel whose luminance differs from the painted
stroke by more than ~0.06–0.18 gets its original colour back, at full strength up to 9 m and fading out by 22 m. That covers
eyes, brows, mouth, stubble and sign letters. The phone version shares it. Checked in software Chromium with Johansson's face
from the front at 0.8 m and the Sakura Shōten front from 2.4 m behind him: before, the sign text and can-bin label were
illegible; after, "SAKURA SHŌTEN · FOOD & DAILY GOODS", 冷たい飲み物 and his features show, and the brushwork elsewhere stays.

## Cartoon look, and outlines from 1/depth — 23 October 2026, small hours
Owner (with a Crayon Shin-chan game screenshot): "a manga filter that makes it look flat like shin chan even though it's 3d,
like a screenshot looks like it's drawn". New look **Cartoon** (`flat`):
- `LOOKS.flat.flatten=0`. `applyLook` calls `celPass.scaleFlatten(lookFlatten(look))`, new in render/cel.js. That scales every
  photographic map's own amount (FLATTEN/ARCH_FLATTEN) and gives each back when the look changes; districts streamed in while
  it is on arrive scaled too (test in cel-look.test.mjs). Without the pipeline the scale stays 1.
- Shader: a light 2×2 Kuwahara to remove grain; faces and lettering restored as in Oil; tones stepped (hue kept) up close;
  saturation up; thick ink that wanders slightly. Smoothing and steps fade out 8–20 m and the thick ink 25–50 m, so distant
  texture is not turned into contour lines.
- `edges()` (shared by Lines, Manga, Crayon, Print, Watercolour, Cartoon) now takes the second difference of **1/depth**,
  which is exactly zero on any plane in perspective. Depth's own second difference grows on grazing ground with the square of
  the line width, and drew wavy stripes across the paving with Cartoon's thick line. Checked: Cartoon, Lines, Manga and Crayon
  still draw silhouettes and creases; the wavy stripes are gone except a faint trace far down the road.
Checks: focused tests pass. Software Chromium shots of Johansson's face, the Sakura front, the school gate and the Community
Hall in Cartoon (several rounds: grass specks, a jagged dress edge and the paving waves were found and fixed).

## Town book as icon tiles; its button within thumb reach — 23 October 2026, morning
Owner (iPad screenshots): "It's difficult to reach the menu buttons, and when I'm in the menu I want the menu to be more icon
based, too much tapping and looking for what I want."
- `index.html`: Settings moved out of Town tools. Settings, Map ("Walking map") and Places ("Places, homes and people") sit
  in a new `.book-sections` wrapper, all still `<details>`. Town tools is open by default and Places no longer is. The Field
  book tile's icon is now book and Look's is star.
- `src/ui/town-book-home.js` (new): the home screen. `#directory[data-page]` is `home` or the open section, and opening a
  section's summary (also by webmcp.js and the MCP session) closes the others and shows it as a page; closing it goes home.
  The book always opens on home (`toggleDir` → `townBook.home()`), and tapping the dimmed town around it closes it. Some
  tile labels are shortened (Photo, Free camera, Ferry, Save …); Pocket and Bag keep theirs.
- `town-book.css` (new, loaded last): a 4-column grid (3 under 520 px) of 94 px icon tiles, the section tiles beneath, and a
  page header with a back arrow. On touch screens the book button is a 60 px round button at bottom right, above the
  movement button, and fades no further than 0.8.
Checks: CI guard 359 pass, 1 fail (the same `no-z-fighting` out-of-memory abort). Built runtime in software Chromium at
820×1180 and 390×844 with touch: the button is visible at bottom right; home grid → Settings page → back → Places page →
close → reopen shows home; the Free camera tile works from the grid. Not done: a real iPad, and the desktop editions'
own menu (`johanssonDesktopUI`), which is untouched.

## Town book folded to eight tiles; shorter place cards — 23 October 2026
Owner, yes to the proposal: fold 15 tiles into 8, shorten the place cards, merge the stylesheets.
- `index.html`: `#townControls` is the whole home screen (the Town tools / book-sections wrappers are gone). It holds
  Camera (`details.menu-camera`: Photo, Pocket, Free camera, Clean view, Look), Map (`details.menu-places`: the walking map
  above the place list; `.menu-map` is gone, merged in), People (`#peopleButton`), Field book, Moves, Ferry, Settings
  (`details.menu-settings`: Controls and Save tiles above the rows), and Bag, which hud-icons appends and shows only when
  something is carried. CSS `order` puts them as Camera, Map, People, Field book, Bag, Moves, Ferry, Settings.
- The Residents tile is gone: People opens the Map page on its People list, whose cards already have Resident record.
  Its `onclick` line in game.js is removed; `activities.residentRecords` stays (the record's "Back to residents").
- `src/ui/town-directory.js`: a place card shows its name, one line and Directions; its tags and walking directions are in
  `.town-more`, opened by a tap on the card.
Checks: town-directory, boot, travel-webmcp, ui-icons, runtime-package, audit-boot and visual-audit-freeze pass. Built
runtime at 390×844 and 820×1180 with touch: home has 8 tiles; Camera, Map, People (People list) and Settings pages; back;
close and reopen go home; Free camera works from the Camera page.

## Oil: faces painted, features as thick flat marks — 23 October 2026
Owner: "The characters and their faces should be applied by the shaders too in oil… letters and details of the faces could
be strengthened… I couldn't see the faces… maybe just thicker flat 2D details". The oil shader no longer pastes the
original pixels back. Everything stays painted, and up to 9 m (fading by 22 m) a pixel whose 8-tap ring (radius 1.25 px)
holds something much darker than the painted stroke gets a flat dark mark (0.16, 0.12, 0.11); something much lighter gets
a flat cream one. That makes eyes, brows, smile and sign letters thick and readable. Checked in software Chromium on
Johansson's face at 0.8 m and the Sakura front at 2.4 m. A first, stronger setting inked the shop interior too heavily and
was eased (thresholds 0.1–0.22, 90%).

## Spot blacks and colour lines in the drawn looks — 23 October 2026
Owner (Line drawing screenshot at the izakaya): "his eyebrows should be fully black here and his eyes too… the collar on the
shirt should have its outline on the chest". In `looks.js`:
- New shared `spotBlack()`, used by Line drawing, Manga and Cartoon. Within 6–16 m, a pixel darker than its surroundings by
  more than 0.1–0.15 luminance (the best of three rings, 6/14/28 px) is filled solid, if it is not itself light (luma under
  0.55–0.65). That makes eyes and brows solid black; big dark areas stay outlined. Partial fills first left grey smudges,
  so the step is narrow.
- `edges()` now takes its Sobel on colour (RGB length × 0.577), not luminance, with lower thresholds within 4–14 m, so a
  light-blue collar on a light-blue shirt is drawn. This affects every look that uses `edges()`.
Checked in software Chromium with Johansson's face at 1 m and the Sakura front, in Lines, Manga and Cartoon.

## One stylesheet for the Town book — 23 October 2026
Owner, yes to "merge the stylesheets: less code, nothing looks different".
- Every rule whose own target is the book or its button (`#directory…` outside any `:is()/:has()/:not()/:where()`) was moved
  out of base, context-controls, dual-controls, tomodachi-ui, quiet-ui, context-rail, line-ui, quiet-hud and
  town-directory into `town-book.css`, in cascade order (172 rules). Shared rules such as line-ui's
  `:is(#directory,#activity,…)` stay where they are. One moved declaration had to change, because a later shared rule had
  always overridden it: `#directory h3{color:#41584d}` lost its colour.
- Pruning: each moved declaration was deleted if no element its rule matches changed any computed value, across 7 viewports
  (340–1280 wide, one landscape) × 6 states (closed, closed and idle, home, Camera, Map, Settings) in a touch and a
  mouse Chromium, on a snapshot of the real HUD and book. Rules with :hover/:focus etc., or with any selector matching
  nothing in the snapshot, were kept whole. That removed 433 of 833 declarations. A further 17 selectors naming classes
  that exist nowhere in the game's HTML/JS (`.menu-tools`, `.menu-map`, `.izakaya-shortcut`, `.directory-section`) went.
- Final full comparison (every computed property of every element and pseudo-element under the book and button): identical
  to the original, for touch and mouse. Totals for those 10 files: 150.4 KB → 138.3 KB, `!important` 198 → 162; the
  book's rules are in 1 file instead of 8. Orphaned comments removed; quiet-hud's header now points to town-book.css.
- The tools (CSS parser, mover, pruner, oracle) are scratch scripts, not committed. The test page cannot cover hover/focus,
  states while other dialogues are open, or person and home cards beyond the snapshot; those rules were kept whole.
Checks: CI guard 359 pass, 1 fail (the known `no-z-fighting` out-of-memory abort). Real game at 390×844 touch and 1280×800
mouse: HUD, home, Camera, Map, Settings render as before.
