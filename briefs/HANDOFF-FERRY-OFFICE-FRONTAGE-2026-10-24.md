# Ferry-office bench removal — 24 October 2026

## Owner request and cause

The owner again supplied the live scene and asked, “This bench is still there why?” The earlier request was to remove the bench among the flowering shrubs and the projecting beam over the ferry-office door, with removal of the sign suggested tentatively.

The earlier implementation was uploaded as an unreferenced review commit, [`87a93ad8db0d96c0ee1fda6e41da47189929ed9a`](https://github.com/nj22az/nj22az.github.io/commit/87a93ad8db0d96c0ee1fda6e41da47189929ed9a), followed by review handover `c82804fe02e3826c6cec485620cf80ac05198d24`. It never reached a publishing branch. The website still matched `main` `7356f64ad017afa2e38e41403ecbcd3fd83b1e09`: the entry page, boot/game bundles and inspected world modules were downloaded and compared byte for byte. The bench therefore remained in the published game.

The newer [woodland poster request](HANDOFF-WOODLAND-POSTER-2026-10-24.md), published as `afe5ba69526a5c20bc47ab53abfad412aae73159`, gives the harbour notice board an active purpose. This correction preserves that board, its flyer, the Look menu and its 3D viewer. The old review is selectively ported, not merged wholesale.

## Changes

- Remove `sakura-viewing-bench`, centred at `(6.6, -32)`, including its builder, deferred model registration, collider, seating marker and sit action. Other park benches remain.
- Remove the narrow concrete hood over the office door in `src/world/port-building.js`. The door, office sign, windows and ferry waiting canopy remain.
- Retire the Sakura bench opening. Old `?spawn=sakura-bench` links resolve to the existing clear fish-auction standing point at `(19.8, -40)`.
- Recover old Linux checkpoints inside the former rotated bench footprint to that standing point, for both the general checkpoint and per-resident records. Home, room, ship and neighbouring path checkpoints retain their positions.
- Update the existing startup, seat, opening, Linux-life and audit-tool checks/defaults. Keep the notice board’s interactions and the existing runtime stability threshold.
- Rebuild from the current published runtime manifest, retaining its chunks for open pages while publishing new content-hashed entry points and service-worker version.

## Validation

- `npm run build:runtime`: passed. Entry `boot-NaJQUdXp.js`; source fingerprint `71b35d7f78b51e7f166a42ed990b55125a24b8aae2fc672c6fcce9abe4bb82a2`; service-worker version `47d64e919d29c32b59f0`.
- Full local World guard: **400/400 checks across 76 files**, zero failures/skips/todos, 148 seconds (`NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`). The retired bench’s two old positive tests become one complete removal/preservation check, explaining the previous 401 → current 400 count.
- Additional existing `openings`, `port-building`, `spawn-scene` and Linux `life` test files: **20/20 passed**, zero failures/skips/todos.
- Actual compiled-game review: all six matching before/after photographs captured and visually inspected. Both reports have no page errors and passing runtime stability. The after report confirms no bench/seat/sit prompt, retained board/flyer, a standing legacy opening, and Look opening/closing the woodland viewer successfully.
- Syntax checks, `git diff --check`, and independent source review: passed; no remaining blocker. Review specifically covered the rotated checkpoint footprint, both saved seat slots, per-resident switching, streaming removal and preservation of the newer board.

Exact local verification metadata is in [verification.json](../docs/qa/ferry-office-frontage/verification.json).

The reproducible [before-and-after gallery](../docs/qa/ferry-office-frontage/README.md) uses the real compiled game, with matching portrait, desktop and phone doorway cameras. `tools/ferry-office-frontage-photos.mjs` also checks the deleted objects and seating prompt, safe legacy opening, retained board/flyer, and Look opening and closing the woodland viewer.

## Completion: published, verified and signed off

Published directly to `main` as [`580de3c1ed4f12c3e2f962dd49370435bf4256cb`](https://github.com/nj22az/nj22az.github.io/commit/580de3c1ed4f12c3e2f962dd49370435bf4256cb), with parent `7356f64ad017afa2e38e41403ecbcd3fd83b1e09`. The remote commit tree exactly matched the locally staged and tested tree, `c5b3f9b9b882bed15e88b6da5bd9cab18ee78b9d`. Promotion used an expected-head check and no force. No additional remote branch or prototype merge.

- [Pages deployment 40088349611](https://github.com/nj22az/nj22az.github.io/actions/runs/40088349611) succeeded at **13:04:42 CEST, 24 October 2026**.
- [GitHub World guard 40088350128](https://github.com/nj22az/nj22az.github.io/actions/runs/40088350128) succeeded for the exact implementation commit at **13:09:12 CEST**.
- **54/54 live files match the tested checkout byte for byte**, including the page, service worker, fingerprint, current runtime manifest, all 32 current runtime files and changed source modules. All 27 runtime references in the entry page resolve in that checked graph.
- All **11 woodland assets** still match their original manifest hashes, including the posters, viewer and compressed 3D model. Exact live hashes and workflow results are in [publication.json](../docs/qa/ferry-office-frontage/publication.json).

The final evidence/handover update changes documentation only; the tested and live source fingerprint above remains unchanged. It is based on `5a5bddb09c2445ccb1936b7e5e670db7366e3a6f`, preserving the concurrently published Linux 0.2.18 release records from PR #390; that commit changes no World source or runtime. The requested web removal is complete. An already-open game keeps its in-memory scene until reloaded; the site’s service worker retrieves navigations from the network and the new page uses the rebuilt content-hashed bundles. No saved-game deletion is required.

## Limits

Browser checks use software Chromium and emulated viewport sizes. No physical iPhone/iPad/Steam Deck test is claimed. Shared Linux source and save compatibility are updated, but this task does not publish a new Linux installer.
