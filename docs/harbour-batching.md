# Harbour instance colour consolidation

Based on main `b75b1d8` (includes Thuan's readable greeting, PR #21).

The harbour shape builder previously separated otherwise compatible instance batches by base colour. `createHarbourInstances` now carries that colour in `instanceColor`, matching all other serialized material properties and texture identities. It partitions immutable shapes into 48-metre XZ cells and computes instance bounds. It does not change geometry, UVs or transforms. The road keeps its original material reference so rain changes its roughness. Shared source materials are never whitened or otherwise modified.

Only shapes already sent to the harbour's instance builder participate. Resident rigs, schedules, shutters, glass, moving boats, content objects, interiors, collision and interaction anchors remain outside this operation. This preserves the current engine and gameplay structure.

## Measurement

The old probe redirected realistic GLBs to the resident asset directory, silently replacing Kenji with an older model. It now preserves character subdirectories, supports embedded blob images with a CPU image stub, and fails if any of the eight current local assets cannot load. This is geometry validation, not image decoding or visual validation.

From `johansson-town/`:

```sh
node tools/measure-art-scene.mjs --legacy
node tools/measure-art-scene.mjs
node tools/measure-art-scene.mjs --cell=24
node tools/measure-art-scene.mjs --cell=Infinity
```

An optional repository game-directory argument is retained. The default uses 48-metre cells. `--legacy` retains the old batching layout with the corrected asset loader, giving a like-for-like comparison on current content. These diagnostic options are constructor/script options, not public gameplay controls.

Daytime CPU estimates:

| View | Legacy draws | 48 m draws | Legacy triangles | 48 m triangles |
| --- | ---: | ---: | ---: | ---: |
| Start | 721 | 660 | 116,067 | 116,079 |
| Street | 442 | 402 | 106,721 | 106,857 |
| Quay | 82 | 68 | 74,737 | 76,905 |
| Pier looking back | 805 | 742 | 116,751 | 116,383 |
| Shrine looking back | 822 | 760 | 118,195 | 117,959 |

The default saves 61 draws (8.5%) at the start and improves all five sampled views in both day and rain/night states. Global consolidation saves 99 starting draws, but increases submitted triangles at the quay from 74,737 to 87,909 (17.6%). The 48-metre configuration limits that increase to 2.9%. Smaller 24-metre cells save fewer calls. These samples support 48 metres as a conservative initial choice, not a proven GPU optimum.

Full measurements for all four variants, including rainy night and contributor categories, are in `harbour-batching-measurements.json`. Resident population remains fixed at the starting state for camera comparisons; this is not a simulated walking route. The counter excludes shadow passes, Points, player/held objects, interiors and WebGL driver work. Triangle counts include all instances in an intersecting batch. Counts are not FPS measurements and remain over the requested draw budget.

## Validation and remaining gate

All 32 tests pass, including transform/colour equivalence, material/cell separation, mutable-road updates, original anchors/colliders, all nine interior entry/exit cycles, resident navigation and Thuan's existing greeting. Vite production build passes.

The cloud browser rejected both local preview addresses with `net::ERR_BLOCKED_BY_CLIENT`. This is a preview-access failure; WebGL availability was not tested in this session. No rendered gameplay, GPU timings or device FPS is claimed.

Before merging, compare the baseline and this branch on desktop and iPad using actual renderer draw/triangle counters and p95 frame times. Walk start → street → quay → outer pier and the shrine approach; include rain/night, enter/exit the market and other interiors, and check Thuan's greeting. Confirm colour/texture parity, shadows, no culling pop-in, road wetness and interactions. Retain 48-metre cells unless measured device results justify changing them.
