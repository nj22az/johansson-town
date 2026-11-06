# Original cargo ship and eastern berth — 25 October 2026

## Owner request and release scope

The owner supplied screenshots of the eastern jetty, requested a new CAD ship and dock from scratch, then asked to replace the app models and explicitly said: “Push it live so I can see the new ship and dock in the app.” This authorises publication to the current cartoon World on main. This is the eastern ship/jetty replacement, not the Minato Maru passenger ferry or the western scheduled supply boat; neither is replaced.

## Base and implementation

Prepared in an isolated checkout of main at `a2571ca7ad3bef882e198c6493550898a3d176f9`, because the original local checkout predates the current live app. Retained current main's town, cast, houseboats, ferry navigation, fuel-depot position, Sakura office and edition rules. No Linux package or Pixar branch is published by this job.

- Original CAD source: `cad/cargo-ship-berth/build.py`; parameters and limitations in `specification.txt`. Exterior concept: 72 m hull, 13.5 m beam, 100 × 18 m piled quay. No construction, stability, structural or load certification is implied.
- Runtime asset: `johansson-town/assets/models/harbour/cargo-berth.glb`, 2,068,760 bytes, 881 CAD components merged into 21 draws. Ship, quay and moorings/gangway remain independent groups. `tools/build-cargo-berth.mjs` rebuilds the packed asset after running the CAD source.
- Placement: ship datum `(42.5, -0.56, -95.5)`, yaw π/2; full metre scale. Quay rectangle x 50.4–68.4, z −145.5–−45.5, surface y 1.54. The berth extends seaward clear of the breakwater and airport. Shore approach at x 44.2–58.2, z −45.5–−43.3.
- `oil-jetty.js` loads the packed original model through the existing detail stream, replacing the old tanker and oil-jetty primitives. It retains the call calendar: every third day, alongside 08:00–15:00; mooring lines and gangway are visible only while moored. The quay remains when the ship is away.
- Shore grading uses `ground-plan-harbour.js` and `ground-build.js`, with a matching walking height. The old shore apron boundary is retained independently of the larger piled quay. The ground audit follows the planned grade and retains generated sloping ground that crosses its low sampling window, so it does not mistake land underneath the access ramp for a walking surface. No baseline violations are accepted.
- Latest main's larger passenger ferry already clears this berth: its current sailing profiles and paths are retained. The original stale-checkout ferry route edit is deliberately not carried to main.

## Verification / publication

Before publication: 4 focused CAD/dimension/navigation/calendar/ferry-clearance checks and all 5 ground-standard checks passed (9/9). The runtime was rebuilt against current main. The full CI guard, runtime package check, desktop/phone compiled-game review, publication commit and live Pages verification are recorded below when complete. Do not infer physical iPhone or Steam Deck verification from browser captures.

## Next action

Finish the release guard and compiled-game review, publish the checked main candidate on the owner's explicit request, and verify the live index, compiled graph, service-worker version and model bytes. Keep this note current with the exact release commit and deployment result.

## Release candidate validation

- Rebuilt current main's compiled graph: `boot-BdwN2QDm.js`; `runtime-package` checks passed.
- CI guard ran all 432 checks: 429 passed; three checks could not read reference files omitted by the sparse checkout (`art/izakaya/walnut-runtime-report.json`, `art/izakaya/compact/plan.json`, `docs/qa/minato-compact/browser-results.json`). Restored those exact tracked main files without editing them; both affected test files then passed all 17 checks. No product-code failure remains from the guard run. The complete GitHub guard reruns on publication.
- All 9 focused cargo/ground checks pass; the ground-standard baseline remains empty. The current main ferry route passes the new berth clearance check without modification.
- Actual compiled-game desktop overhead/pedestrian and 390×844 phone views reviewed. Quay navigation, shore walking and arrival/departure checks pass. A missing woodland poster and a reset on the small temporary HTTP server affected the preliminary browser runs; the tracked poster was restored and final verification uses the repository's audit server (128-connection backlog). Final browser and live verification follow below.
- Physical iPhone Safari and Steam Deck were not tested. No Linux installer/package was changed.

## Published and verified

- **Application published to main:** `fe9a38d9052ba6d05a9d36599ae9f4e1b46e4521` (original main parent `a2571ca7ad3bef882e198c6493550898a3d176f9`). The owner's explicit publication request was used; no prototype, Pixar, cast, housing or Linux release work was merged.
- **GitHub Pages succeeded:** [deployment 40199019181](https://github.com/nj22az/nj22az.github.io/actions/runs/40199019181).
- **Complete GitHub World guard succeeded:** [run 40199020429](https://github.com/nj22az/nj22az.github.io/actions/runs/40199020429), including the new cargo-berth regression. The initial sparse-checkout fixture omissions do not remain in the published guard.
- **37 live files verified byte-for-byte** against the release: index, service worker, source stamp, the new CAD GLB and every current manifest entry. Exact hashes are in `docs/qa/cargo-berth/live-files.json`.
- **Published-game browser review passed:** desktop overhead and pedestrian views, 390×844 phone dock and approach views, full dock navigation probes, actual keyboard movement on the shore approach, mooring removal on departure and the quay remaining when the ship is away. Zero browser errors. Screenshots and the report are in `docs/qa/cargo-berth/live/`; the candidate's four views and report are in `docs/qa/cargo-berth/`.
- Live app: <https://nj22az.github.io/johansson-town/?v=cargo-fe9a38d>. The new berth is off the eastern shore. The existing ship call calendar remains every third day, alongside 08:00–15:00; the quay is always present.

No further implementation action is required for this publication. Real iPhone/Safari and Steam Deck checks remain unperformed. The follow-up documentation commit records the verified application release without changing its runtime or model bytes.
