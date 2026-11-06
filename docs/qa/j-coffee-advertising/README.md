# J-Coffee and Sakura wall advertisements — 20 October 2026

The owner requested the approved J-Coffee banner on a blank building wall and the full portrait Sakura campaign inside Minato Izakaya.

- Warehouse: 5.1 × 1.7 m, south gable end, centred at (-13.6, 2.65, -45.58), clear of the corrugation, plinth, eave, shutter and entrance. Black/cream/gold J-Coffee branding from the game.
- Izakaya: 0.96 × 1.28 m, west wall at (-6.28, 1.96, -4), between the timber post and speaker. The first preview exposed a speaker overlap; the accepted placement below clears it. Full artwork, uncropped, original 3:4 aspect.
- Two WebP runtime textures, 297,242 bytes total. Static geometry; no animation or additional lights. Izakaya retains its shared texture cache and inspection prompt.

## Evidence and limits

`warehouse.webp` and `izakaya.webp` are placement previews rendered in Chromium/SwiftShader using the actual warehouse builder, Minato interior GLB and poster builder. The warehouse preview isolates the building on a plain ground plane; these are not screenshots of a running full town. They use preview lighting rather than the game's Ink postprocessing. The full-game screenshot attempt could not pass the existing disabled START/loading gate within 240 seconds. No physical-device claim is made.

`npm run build:runtime` succeeded. All ten focused checks passed: `node --test tests/izakaya-posters.test.mjs tests/warehouse.test.mjs tests/runtime-package.test.mjs`. Checks cover image availability, aspect, speaker/post clearance, warehouse wall fit, clear approach/navigation and current compiled runtime. `git diff --check` passed.
