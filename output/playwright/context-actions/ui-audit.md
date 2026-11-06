# Context actions audit · 5 October 2026

Verified the integrated game in a real Chromium browser through Playwright CLI. Desktop viewport was 1440 × 900; an iPhone touch context used coarse pointer input and native touch events at 390 × 664 / 390 × 844 portrait and 844 × 390 landscape.

- Empty outdoors: no generic Action button and the rail is hidden.
- Harbour Park bench: only Stand up is available. A touch tap stands once; Tab reaches the Town book and then Stand, and native Enter stands once without reopening another interaction.
- Sakura doorway: one Enter outside, then one Exit inside. Both mouse and native touch pass through the threshold once.
- Town book: the rail and touch movement controls disappear while paused. Field book, photo studio, moves, player/save, controls, bag and settings are contained in the book.
- Ramen meal: six Eat clicks keep the player seated. Once the meal clears, Order and Stand appear. Ordering barley tea displays only Stand plus delivery status while pending; delivery exposes Drink and Stand. Four E presses consume the tea, then Order returns after the serving clears.
- Native touch: a swipe rotates the view, and left-thumb dragging moves the player and reveals the joystick ring and Run. Inactive Run/Jump are fully hidden when seated.
- Portrait and landscape screenshots were inspected. The context rail stays at the lower right, keyboard badges are hidden on touch, and captions do not cover the action buttons.

State/DOM regressions: `node --test tests/context-actions.test.mjs tests/context-controls.test.mjs` passed 10/10. They cover one primary action, distinct nearby Enter choices, pending/consumable states, stable presses, disabled hidden buttons, full accessible labels, shortcut changes, single pointer activation, native keyboard activation, awaited door transition completion and a single polite live announcement during unchanged delivery status.

The four `context-*` screenshots record the initial integrated runtime.

## Final compiled acceptance

Phone acceptance used `game-7RIMUKG1.js`; the final true desktop context used `game-BQeaasBb.js` with `pointer:coarse=false` and zero touch points. Both reported successful town stability and zero console errors.

- Ramen opening captions no longer include keyboard/action instructions. The phone shows Eat and Stand only, with keyboard badges hidden.
- The normal Harbour Park interaction shows one Stand button and the clean caption “Harbour Park bench · Make yourself comfortable.” Inactive Run/Jump remain completely hidden. Seated shoes are clear of the bench and floor and can naturally dangle for short legs.
- Portrait and landscape final frames were captured and visually inspected.
- Desktop Stand visibly advertises E. Tab first reaches the Town book, then Stand. A single native Enter stands once, with no activity opened. Q opens the book and clears the entire context rail.
- The closed-kitchen guard was verified on the standards runtime: existing food remains consumable after 14:00, but finishing it leaves only Stand, without an unusable Order action.
- The rendered park bench is the Blender asset: `benchSource=blender`, object name `Harbour Park Blender bench`, authoring source `tools/blender/build-harbour-bench.py`, dimensions source `art/park/harbour-bench-spec.json`. All three mesh descendants have `staticProp=true`.

## Evidence

- `context-desktop-bench.png`
- `context-desktop-service.png`
- `context-phone-portrait-bench.png`
- `context-phone-landscape-bench.png`
- `final-phone-portrait-meal.png`
- `final-phone-portrait-bench.png`
- `final-phone-landscape-bench.png`
- `final-desktop-bench.png`
