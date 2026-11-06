# Food-service and seating integration handover — 22 October 2026

## State

**Owner approved the combined screenshots and instructed “Looks good merge” on 22 October 2026. PR #356 is squash-merged into main as `2fd64868fe6da67619cef618ed8c67174843a96f`. Integration is complete.**

Original combined implementation: `b446e39f662b4d004e6c76cb6067d77d22e84d45`; review documentation: `20e6fc6f6b7b475142f4fb9872f4d059e26ace49`; reconciled approved head: `b0605d032a6e17921e8184b899b868e75fac9d44`. Branch: `codex/food-seating-integration`.

PR #350 was already merged as `16407e2822ce2379fb0661042d2c21ddd7334c8d`. Another session merged PR #351 as `096ee3c97c9f8df1c94add4a47215e8c46f109b8` while this approval was pending. Fresh comparison showed its game sources and runtime identical to this reviewed integration. The merge-time rebuild reproduced the same current chunks and source hash; previous-generation compatibility chunks were retained. The capture-tool conflict was resolved with the reviewed integration tool. The reconciled commit's entire tree is identical to the approved review tree.

Hosted **Johansson World guard #70 passed** on the reconciled head ([run](https://github.com/nj22az/nj22az.github.io/actions/runs/39749540716)). Main then gained test-fixture repairs through PR #353 (`9f7ccd4`), with no game-code changes; those four files passed an additional **9 tests** locally against this integration. A merge-time drinking/runtime-package run also passed **10 tests**. PR #356 was merged onto that newer main after those checks. Linux console acceptance #66 was still running at sign-off; it is not claimed passed. Physical iPhone/Safari, native Linux/Electron and Steam Deck acceptance remain unperformed. No new Linux release or deployment acceptance is claimed.

## Changes and resolution

- Preserved main's independent resident food/drink records, preparation and delivery rounds, food/prop clearances, partial-save restoration and the measured body-separation fix.
- Incorporated #351's measured front-edge data for chairs, stools, cushions and benches; multi-place indoor benches; clinic facing; resident/player/comic consumers of the data.
- The only shared source path, `src/people/izakaya-beer.js`, combined cleanly: food service is retained and seats gain their measured `front`. The other 12 overlapping paths are generated output or runtime references.
- Restored main's previous runtime generation as the build baseline and rebuilt from the combined sources. Did not select either PR's generated runtime as the final integration.
- Drinking regression fixture now passes each actual seat's `front` to the actor. The existing seven-seat tests therefore check the new posture and glass/wrist/lip contacts together.
- Photo tooling can capture the built runtime at desktop and phone dimensions, includes booth sitters and records cameras/conditions. Natural service captures include separate drink and meal placement plus a visible-HUD frame. Staged seating photographs use the actual game rooms, recipes and animator; they do not prove those residents' schedules bring them to those places.

## Verification

- Full repository guard: **336 tests, 60 files, all passed**, including z-fighting and interior geometry, seating/contact, independent food service, drinking and runtime packaging.
- Focused run: **68 passed**, covering food preparation/delivery/cancellation/partial saves/clearance, drinking with seat-front data, body collision, save safety/feedback, grip and the onsen chair.
- Web-edition run: **30 passed** (food service, body collision and resident-personalities suites).
- Rebuilt runtime package: **3 passed**. Build and source-only `git diff --check` passed. The complete staged diff reports the seating branch’s pre-existing whitespace inside embedded GLSL in `runtime/compact-shops-M6EJ8ghC.js`; generated shader text was not edited. Capture scripts parse successfully.
- [QA record, traces and evidence](../docs/qa/food-seating-integration/README.md). Software Chromium only. No native release or deployment claim.

## Next actions

1. No food-service or seating integration work remains. Both original improvements and this verification/evidence change are on main; do not merge the old branches again.
2. Check the outstanding Linux console acceptance result and record any demonstrated defect separately. Its status at this sign-off was in progress.
3. Physical iPhone/Safari and Steam Deck confirmation remain outstanding.
4. A new Linux release is separate work; no installer or release version was changed here.
