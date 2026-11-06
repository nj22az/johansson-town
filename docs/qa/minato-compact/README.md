# Compact Minato / Sato refit

## Result

Minato and Sato now load one fitted Blender interior built from `art/izakaya/compact/plan.json`, revision 8. The room has a shorter five-stool Minato counter, one four-place booth, a three-stool Sato counter, two ledge places, a shared cooking/washing route, cold storage and an actual guest WC. The commissioned walnut cabinet and its 42 bottles remain at their original scale.

The former room had a 202.26 m² shared movement domain behind a much smaller street building. Its long counter, oversized tables and unused raised area spread the activity out. The new plan keeps the social activity around the counter and booth while retaining a continuous route between both venues.

## Measurements

| Measure | Previous fitted interior | Compact refit |
|---|---:|---:|
| Shared movement domain, counted once | 202.26 m² | 64.488 m² |
| Main clear rectangle | 12.4 × 12.4 m | 6.4 × 7.2 m |
| Sato clear rectangle | 5.0 × 9.7 m | 3.24 × 5.2 m |
| Minato counter length | 8.4 m | 4.35 m |
| Main stool spacing | 1.5 m centres | 0.8 m centres |
| Ceiling surface elevation | 3.8 m | 2.94 m |
| Main exterior width × depth | 6.7 × 5.6 m | 6.7 × 7.5 m |
| Sato exterior width × depth | 3.3 × 5.5 m | 3.54 × 5.5 m |

The shared domain is about 68.1% smaller. This is the plan polygon, including the area occupied by walls, furniture and the WC; it is **not net walkable area**. The survey independently samples 64.411 m² of supporting floor geometry. The floorboard datum is Y=0.04 m, so clear height to the 2.94 m ceiling is 2.90 m, with lower beams and passage heads tested separately.

Minato has nine physical places and Sato five. Seven Minato positions are exposed as player seating interactions; guest assignment and occupied-seat checks prevent two people taking the same place. Food and drinks use each assigned seat's actual supporting surface.

The main staff aisle is 1.25 m between the backbar and workbench; Sato's is 1.12 m. The shared kitchen opening is 1.50 m wide. The WC's 0.86 m opening stays clear because its two 0.43 m leaves fold beside it. These are model measurements and game clearances, not a certified construction or accessibility assessment.

The exterior rear was extended within the existing plot, preserving the street entrances. Exterior walls now use the plan's 0.15 m thickness. Interior and town remain separate scenes: the street camera retains the existing recessed-door mapping. Dimensional agreement does not imply exact registration of every interior surface in world coordinates.

## Asset cost

| Runtime asset measure | Previous room + cabinet + counter | New complete room |
|---|---:|---:|
| GLB files fetched | 3 | 1 |
| Triangles | 184,126 | 51,547 |
| Material primitives | 19 | 35 |
| File bytes | 10,824,256 | 3,840,276 |

The export reduces triangles by about 72.0% and bytes by about 64.5%. Material primitives increase because the complete fitted shell and props use more distinct finishes. These asset counts do not establish an FPS gain or a whole-frame draw-call reduction. Dynamic posters, television, characters and interactions remain part of the game renderer.

The original cabinet, counter and legacy room assets remain available as source/reference material. The active interior loader requests only `minato-interior-compact.glb`; both import variants and both entrances share the same cache.

## Gameplay changes

- Both entrances build the same room, all 35 collision solids, saved discoveries, seating and both dining services. Opening hours and staff availability still apply.
- Thao follows collision-aware routes to cooking and serving positions, checks the last few centimetres, waits when blocked and replans. Every player seat and all five cooking stations have completed delivery/return tests.
- NPC meal placement uses the actual guest seat's table or counter top. It no longer assumes the old oversized furniture's position or height.
- The WC, booth backs, ticket machine, phone, karaoke unit and bottle-keep shelf have matching collision coverage.
- Each door exits to its own street site. The contextual Exit control uses the nearby physical door.
- Sato's persistent kitchen and guests keep their existing lifecycle. Minato guests, television, calendar and discovery state work from either entry.
- Menus and receipts follow the occupied seat or current dining area. Japanese remains on physical scenery; the inspected menu is English.

## Verification

### Blender and actual asset geometry

The saved `.blend`, GLB, font and source hashes match `art/izakaya/compact/compact-report.json`. The editable scene contains separate props and editable Japanese text. Its neutral seated adult is a scale reference excluded from the runtime export.

Tests inspect the actual exported geometry for full-size furniture, floor and overhead enclosure, bottle bodies/labels/shelf support, serving-surface contact, bounded geometry and overlapping planes. A deliberately doubled counter finish is detected by the overlap test. Independent Blender review identified the folded-door and booth-back collision underfits; both are corrected and have reproducing regressions.

### Actual browser walkthrough

`browser-results.json` records two successful runs of the compiled game: a 1280 × 800 desktop viewport entering Minato at 20:30, and a 390 × 844 phone viewport entering Sato at 12:30. Both use Chromium with software WebGL. This is not a physical iPhone Safari test or a performance benchmark.

Both runs verified:

- Exactly one fitted cabinet and counter, with persistent calendar and discovery state.
- Real keyboard movement through the dining circulation, shared passage and WC.
- First-person camera clearance and a third-person entrance view.
- Leaving through the opposite venue's door and arriving at that door's clear street position.
- Re-entering through the other entrance without duplicating furniture.
- No invalid transforms, browser/shader exceptions or failed asset responses.

The screenshots are from the game's actual materials, lighting and ink pass. The browser report retains the source digest it executed. After that run, the three measured door/booth collision solids, Sato's exterior wall thickness and the English menu inspect text were corrected. The acceptance suite rechecks all **27 recorded movement segments / 619 samples** against the final colliders at 5 cm spacing; every sample remains clear. Geometry and service tests use the final source.

The separate `art/izakaya/compact/entry.png`, `counter.png` and `overhead.png` are Blender Cycles architectural renders with review lighting. They are labelled separately from game captures.

### Automated gates

The compact acceptance, cabinet geometry, service layout and shared-entry suites are added to `tests/ci-guard.txt`. Adjacent lifecycle, survey, beer service, opening-hours, resident-life, living-town, ramen-player, dressing, devices and posters suites also passed.

Original compact-release CI guard: **40 test files passed, 0 failed**, in 181 seconds, including the compiled-package/source-digest check and the full-town surface-overlap scan. See `ci-results.txt`.

Before merging, the release was reconciled with main at `d6f599e8dc15f9ec123321c942f64a2f1d7e9ade`, preserving the beach/yard restoration and Johansson's study move from PRs #319 and #320. The source merge retains the compact interior and removes the retired mayor-office import/dispatch. Generated runtime files, entry references and the service-worker stamp were rebuilt from the combined source; the preceding main runtime remains available under the existing cache policy.

The combined CI guard passed **42 test files, 0 failures**, in 194 seconds, including both incoming beach/study suites and all four compact-interior suites. See `merge-ci-results.txt`. Its runtime source digest is `862a479e6579e2737a3e5791825fa6277e379687da086fd3c78f0fc4f46b8081`. The browser captures above retain their original tested digest; no additional browser run is claimed for this reconciliation.

Main advanced again to `1a337bf49b349513c51b1588375d61130710ee65` with PR #321's town-hall buildings and power compound. That update is also preserved. Only generated files conflicted; Minato's geometry, services and `src/game.js` were unchanged. After rebuilding, eight focused suites passed in 23 seconds: runtime packaging, compact geometry, cabinet support, service routes, shared entry, ground quarters, sign backs and every enterable site. See `final-merge-checks.txt`. The final runtime source digest is `3abbc200423b4e98beef5d4030957c64d07913d05306d4b8485d96248e064e28`; see PR #322 for the hosted 42-file guard result on this revision.

The broader retired Barfly auto-drinking and Reiko kitchen fixtures have pre-existing failures reproduced against the original HEAD; they are outside this change and were not revived. No physical phone or Linux handheld performance result is claimed.

## Reproduce

From `johansson-town`:

```sh
node tools/build-minato-plan.mjs
blender -b --threads 6 --python tools/blender/build-minato-compact.py -- --root . --samples 32 --width 1440 --height 960
node scripts/build-minato-audit.mjs
npm run build:runtime
NODE_OPTIONS=--max-old-space-size=8192 node tools/ci-guard.mjs --test-concurrency=1
CHROMIUM_EXECUTABLE=/path/to/chromium JOHANSSON_SWIFTSHADER=1 node tests/minato-compact.browser.mjs
```

`build-minato-audit.mjs` refreshes only Minato/Sato rows and plans. The 25 unrelated analysis rows and nine unrelated measurement-review entries remain unchanged. Blender's `--no-render` option rebuilds the editable scene and runtime asset without recreating the review images.
