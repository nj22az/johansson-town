# Woodland diorama on the harbour notice board — 24 October 2026

## Owner request and scope

“Can you bring this diorama to the Johansson World? As a poster on the notice board? And when the look is chosen it opens the viewer.”

The accepted input is the corrected R3 Blender woodland diorama and its front render. Earlier previews had obscured bodies; the delivered R3 scene has five complete characters and corrected shelf clearances. This integration uses those final bytes without remodelling them. It is a small cartoon World feature on `main`, not a replacement of World or a merge of the `development`/`pixar` prototypes.

## Implementation

- `src/world/woodland-poster.js` pins a 0.62 × 0.413 m landscape print to the existing harbour board, centred at `[5.12,1.58,-33.11]`. Thuan’s existing flyer remains to its right. The visible sheet and walking anchor open one **Harbour notice board** menu.
- The menu offers **Look**, **Read Thuan’s flyer**, and **Close**. The flyer retains its free-copy and document collection behaviour.
- Look creates one local iframe at `diorama/woodland/index.html?embedded=1&token=…`. The embedded view has one host title/close control and supports **Front view**, **Explore 3D**, **Poster**, zoom and reset. The corrected poster appears while the model loads, and remains usable if the model cannot load.
- Ready/close messages require the exact iframe window, document origin and per-opening token. Relative URLs and the actual document origin support the desktop custom scheme without `window.open`.
- Close, Escape, browser Back and replacement activities remove the iframe/listeners. Pending browser-history traversal is serialized before a rapid reopening installs a new marker.
- `activities.viewerActive` holds the hidden World renderer and clock while the diorama is open, keeping controller Back and paused audio responsive. The same World scene, player position and save remain in memory.

## Assets

`diorama/woodland/` contains the standalone viewer and locally licensed dependencies, using World’s existing Three.js/GLTFLoader. The 1024 px board texture is 114,994 bytes; the 2048 px viewer poster is 312,538 bytes. The 5,639,752-byte gzip expands losslessly to the exact 21,194,248-byte R3 GLB. No model request occurs during ordinary World startup or simply opening the board menu.

Original GLB SHA-256: `94ad597834509739204ac7b0374a33ee50eac7f59678c8f6cb8efc2b99fbe549`. Compressed SHA-256: `0ef693d2c19e5a64db68b68044bcfe198cda54d370740dc0d8be6346a4b677c1`. Full asset provenance, hashes and camera are in `diorama/woodland/build-manifest.json`; extraction instructions are in its README. The native Blender/source package and full PNG were delivered separately.

## Validation and review

- The focused `woodland-poster`, `activity-lifecycle`, `sakura-flyer` and `runtime-package` test files passed. The new file has ten checks, including source/token/origin rejection, asynchronous close/reopen, replacement activity, Back, Escape, flyer preservation and physical sheet fit; it is included in the CI guard.
- The hosted-viewer harness passed desktop 1200 × 900 native decoding, emulated touch 820 × 1180 with native decoding disabled, and 390 × 844 model-download failure. It verified exact model integrity, one model request per opening, all 2,675 meshes, orbit/pan/zoom/reset, no external requests, no overflow and no page errors. The phone fallback’s initial central error message was then moved to the top edge.
- Independent code and visual review found no remaining blocker. A second review confirmed the async history and registered custom-origin corrections.
- The full local guard ran all 76 files in 487 seconds: 75 passed, with `no-z-fighting` finding a real new poster-layer issue. Float32 rounding put the print 1.999999974 mm from its paper backing, within the scanner’s 2 mm tolerance over 0.256 m². Moving only the backing 4 mm farther back gives a 6 mm separation. A focused scan reproduces the old fault and passes the corrected geometry.
- After the correction, all 13 full `no-z-fighting` checks passed, including all Minato and interior regions and their sensitivity proofs. The four focused poster/lifecycle/flyer/runtime files passed again against the rebuilt runtime. The other 75 guard files passed in the full run; no source change except this backing separation occurred afterward.
- The first actual-game run passed all 14 acceptance checks at 1280 × 900 and 390 × 844, with zero page errors: normal board interaction, Look, model loading only on demand, one iframe, held hidden renderer, flyer, Escape, Back, replacement, Close and preserved position. The final rebuilt-game run is recorded in the completion section below.

## Branch/build state

Started from `main` `a3a4ad044f9e85224eab1ad8e80b717ce4092ce3`, then integrated current `main` `2cc5a6b07727e8ece77c238d611166a97f1d3971` before building, retaining the newer Eisa poster, cold-cabinet and catalogue/test fixes. No remote feature branch was created. Runtime was rebuilt from main’s manifest so the currently published chunks remain available to older open pages.

Built entry: `boot-DiC5Khan.js`. Source fingerprint: `48d8fd3dbb11414d0a8139cbe1e4342e90f613d1186ff507608aeaf2e1292079`.

## Completion

The final rebuilt-game run passed all 14 acceptance checks in 122.3 seconds, with zero page errors. Final desktop and phone captures, the exact report and the geometry rerun are in [the QA folder](../docs/qa/woodland-poster-2026-10-24/README.md).

**Published and verified.** Implementation commit [`afe5ba69526a5c20bc47ab53abfad412aae73159`](https://github.com/nj22az/nj22az.github.io/commit/afe5ba69526a5c20bc47ab53abfad412aae73159) was promoted directly to `main` on the owner’s request. The full [GitHub World guard](https://github.com/nj22az/nj22az.github.io/actions/runs/40083681589) passed **401/401 tests across 76 files**, with zero failures, skips or todos, in 285 seconds.

The [Pages deployment](https://github.com/nj22az/nj22az.github.io/actions/runs/40083680718) succeeded. Ten live files were downloaded and compared byte-for-byte with the reviewed checkout: game entry/source fingerprint/service worker, viewer HTML/JavaScript/CSS, both poster images, and the complete compressed Blender model. All matched. Exact live checks are in [publication.json](../docs/qa/woodland-poster-2026-10-24/publication.json).

Live entry: <https://nj22az.github.io/johansson-town/>. Walk to the harbour notice board and choose **Look**. Direct viewer: <https://nj22az.github.io/johansson-town/diorama/woodland/>. Existing open game sessions should reload to receive the updated runtime.

This final sign-off changes only handover/verification records. The tested and live source fingerprint remains `48d8fd3dbb11414d0a8139cbe1e4342e90f613d1186ff507608aeaf2e1292079`. No further implementation work is outstanding.

## Verification limits

The checks use software Chromium and emulated viewport/touch sizes. No physical iPhone/iPad, hardware performance or packaged Linux acceptance is claimed. The shared source includes the feature for the next Linux package; the currently published 0.2.17 installer is not rebuilt by this task.
