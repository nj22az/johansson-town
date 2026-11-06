# Sakura's two office posters and Minato's dining repair — 31 October 2026

**Published status, 31 October 2026:** This work is merged and live through [PR #415](https://github.com/nj22az/nj22az.github.io/pull/415), main `4a06f5fcc9f60ce447a6a28b915b3f8d087a087c`. Its tree `dbe595ac4a19f6390ba5613558d8e64803a6fb68` is identical to native-passed candidate `b8a3174e`. Earlier review PRs [#410](https://github.com/nj22az/nj22az.github.io/pull/410) and [#413](https://github.com/nj22az/nj22az.github.io/pull/413) are closed and superseded by #415.

**Latest handover:** [Room recovery and Nakamura retirement](HANDOFF-ROOM-CRASH-FAMILY-2026-10-31.md). Final guard: **560/560, 109 files**; native iPhone-profile WebKit run **41153437339 passed**, including three visit pairs with zero resource growth; Pages deployment **41154350179 succeeded**; public verification **63/63 passed**. The owner's physical iPhone failure remains unobserved.

**Historical record:** The original branch, review, verification and unpublished-delivery statements below describe their earlier stages and are preserved as history. Use the latest handover above for current continuation and publication state.


## Scope and delivery

Owner: “Pick the best two posters you made and decorate the upstairs office from Sakura”. Follow-up: the game crashes on entering the izakaya; draw it in CAD and rebuild without Z-fighting, with Meshy or Artlist available for assets.

Work branch: `codex/sakura-office-izakaya-review`, based on the current startup-repair candidate. This is a combined review candidate, not a main publication or a Linux release. It integrates the existing, independently reviewed work rather than commissioning another replacement interior:

- PR #413, `codex/world-startup-repair`, `b09e2564ec0834e312f2eb263210dad6a121ce32`: startup catch-up, bounded character decoding, visible shader compilation, canvas lifetime and early graphics recovery.
- PR #410, `codex/izakaya-entry-cad-repair`, `6e1ccdbe41b41bdb79e99d9682c0d274ae511f92`: CAD Rev 9, fitted Blender model, corrected surfaces and failed-entry recovery. Local integration commit `73bf7ae`.
- PR #409, `codex/item-magazine-viewer`, `415f1d601d04a17d2f5ac510a60e1ceeef7e6bd5`: approved poster artwork, physical placements and inspection/zoom/download. Local integration commit `f0d3545`.
- Production `main`, `87f47e8f6e5fafdb586ac723e9aa3cc704d11345`, including the Lightpanda documentation and the correctly facing Blender washroom sign, is retained in the ancestry.

The old PRs describe their independent verification. Their results are historical evidence, not a substitute for testing this combination. Review this integration as a whole before publishing; do not substitute one of the old runtime folders for its rebuilt package.

## Sakura office

The selected original Artlist campaigns are **KITANO 12** and **UMINEKO Black**. The amber whisky and blue harbour-at-dusk artwork suit the office and reflect suppliers whose stock Sakura actually handles. They flank the existing street window at one height:

| Campaign | Paper centre, metres | Facing | Clear Look anchor, metres |
| --- | --- | --- | --- |
| UMINEKO Black | [1.18, 2.30, 4.49] | -Z | [1.18, 1.50, 3.25] |
| KITANO 12 | [5.15, 2.30, 4.49] | -Z | [5.15, 1.50, 3.20] |

Exactly two office campaign prints remain. The former office gift/rouge selection is superseded; the rouge and gift artwork remains in its existing hall locations and in the reader. Original image proportions, full-resolution inspection and downloads remain. No new image generation or credit expenditure. Doors, windows, furniture, colliders, routes, stairs and the rest room are preserved.

Measured elevations: `docs/qa/sakura-surfaces/sakura-model-walls.json`, **SK-ST-004 Rev B**, and `Sakura-Model-Walls-Rev-B.svg`. The existing Rev A drawing remains as history. The geometric acceptance now asserts the two selected campaigns in the assembled room, retaining the wall-support/sight rays and collision-aware routes.

## Izakaya

The current live main still has the older room; the existing Rev 9 repair was not published. This candidate includes the actual repaired model and its source, not just the drawings. Clear plan remains Minato 6.40 × 7.20 m with the connected Sato annex. Door joinery and window apertures fit their frames; print faces belong to their solids; appliance details and topping pans have fitted, supported surfaces.

The Sango Quay house-awamori artwork from PR #410 is retained, mounted once in its existing slot. Its Artlist provenance is recorded in `docs/qa/izakaya-rebuild-2026-10-30/artlist-provenance.json`. No new Meshy model, asset request or credit expenditure is needed for this integration.

The failed-entry handler and startup/resource fixes coexist in `src/game.js`. A setup exception returns the player to the street and records the original error. This does not establish the cause of an OS-level Safari process closure. No normal graphics setting, character model or texture resolution is reduced.

The dimensioned three-page A3 PDF, DXF, SVG and architectural Blender views remain in `art/izakaya/compact/`. The current Library Rev 9 PDF was read and all three pages visually inspected in this session; it already contains the completed redraw. These architectural views are not gameplay photographs.

## Verification in this session

- `build_model_walls.py`: **28/28** measured clearances passed for the two office and three stockroom additions.
- Focused assembled-wall, trade-poster, shared-entry and appliance checks: **16/16 passed**.
- `audit-izakaya-room.mjs`: **0 closed-door surface conflicts, 0 open-door conflicts, 0 invalid transforms**, at 2 mm / 0.0005 m² including identical finishes; 194 meshes and 108,355 triangles. Fresh evidence: `docs/qa/sakura-izakaya-integration-2026-10-31/geometry.json`.
- All 18 game WebPs decode at their recorded dimensions and match the manifest hashes; both selected source PNGs match the original Library poster pack. Evidence: `docs/qa/sakura-izakaya-integration-2026-10-31/verification.json`.
- Pinned runtime build passed: 656 modules; 35 manifest entries. Source SHA-256 `e15a990389f94387f9aaa63dac7da136243e9011b3639bd005c05ea6195019d4`. All 35 current production manifest entry files are retained byte-for-byte for cached pages. The first local attempt lacked the external avatar-creator subtree in the sparse checkout; restoring it resolved that environment omission without changing source or the lockfile.
- Full-game CPU wiring/room-transition smoke: **1/1 passed in 159 seconds**, with real room builders, geometry, simulation and saves and a substituted renderer. Evidence: `docs/qa/sakura-izakaya-integration-2026-10-31/cpu-boot.txt`. This establishes code-level entry/exit acceptance, not WebGL or physical-device acceptance.
- Full combined World guard: **538/538 passed, 103 files, 0 skipped/TODO**, in 405 seconds, with 6 GB heap and two-file concurrency. Complete log: `docs/qa/sakura-izakaya-integration-2026-10-31/guard.txt`.
- The iPhone-profile WebKit fixture is extended to exit Minato, enter Sato, exit, re-enter Minato and load Sakura's office with both real Look anchors, in addition to the existing startup/save/context-loss checks. It captures both selected office prints from the actual renderer. Not run on this combination: automatic approval review blocked pushing the branch, so no new hosted run or PR exists.
- The managed preview reaches the immediate Retry error correctly, but its cloud browser reports `GL_VENDOR = Disabled, GL_RENDERER = Disabled`; it cannot create WebGL. Vite's development transform also gives the classic landing script an import error; the hosted fixture serves static compiled bytes, as production does. This preview does not reproduce the owner's device crash and supplies no room screenshots.

## Remaining acceptance

The local combined guard and full-game CPU smoke passed. Request approval to push this concrete candidate so GitHub can run the extended WebKit checks. Inspect those in-game captures before describing browser acceptance as passed. The owner's physical iPhone/Safari process closure remains unobserved. Publication requires the owner's instruction; no main merge, Linux release or Studio sync is performed here.

## Upload limitation

Local implementation commit `41b7a930e101bd95cbd78fe31e87f2151851ae33`, tree `8c391a6081888d2a870e6d2d14e2746bcdc78319`; subsequent changes record evidence/documentation only. Shell Git push was rejected by automatic approval review: it classified exporting repository contents and creating an external review branch as not explicitly authorised. No connector/API workaround, remote branch, PR or publication was attempted after that rejection. Request permission for the review-branch upload; this does not include merging to main.

## Entry recovery follow-up — 31 October 2026

Applied to the current integration checkout (`crash-fix`, integration base `2f645b0`), before its next build. `src/game.js` holds one entry lock through all prerequisite loads and construction. Rejected or false readiness keeps the current room, records the original rejection when available, clears the lock and permits retry. The catalogue loader also consumes background prefetch rejections. The existing construction exception handler still returns to the street through the normal disposal path; graphics startup/lifecycle handling from #413 is preserved.

Sakura's stair previously ignored false prerequisite readiness, discarded its current storey and announced arrival after failed entry. It now keeps the existing storey until entry prerequisites succeed. On failure, the player returns to that storey's safe stair arrival, outside the trigger, with input/passage state cleared and no false arrival announcement. Successful switching retires the previous storey once through `roomShell`. `audit.renderInfo.releasedCanvases` exposes the existing released-canvas registry count for repeated-entry acceptance.

The stale `dessert-menu` action also checks `BLUE_CORAL.staffed` and its controller's current `isOpen()` before opening a menu and again before purchase. A vacant counter shows the shared closed notice; the former live Mrs Nakamura service description is removed. This complements the facility agent's retained, closed shop shell.

Focused actual-source VM regressions plus existing shared-dining/stair tests passed **19/19** in 2.63 seconds. They cover rejection/false readiness for Sakura, both dining entrances, Johansson Mart, onsen and the upstairs office; overlapping entries across two pending prerequisite phases; a late construction failure and retry; background rejection/retry; failed stair readiness and retry in both directions; and stale dessert dispatch. Syntax and diff whitespace checks passed. No runtime rebuild, full combined guard, browser or physical-device result is claimed for this follow-up. Normal Izakaya fetch/parse failures were already consumed by its loader; these recovery defects are not a confirmed explanation of the owner's OS-level device closure. The integration owner will record the final commit/build and broader acceptance.

## Fitted bar geometry lifetime — 31 October 2026

The hosted iPhone-profile renderer subsequently exposed a five-geometry increase after another Minato visit. A focused probe loaded the actual fitted GLB, built the real room and executed the actual `clearRoom` function with geometry disposal listeners over three visits. Every visit left **five private index wrappers and six extracted door/bottle geometries undisposed**. The wrappers borrowed cached GLB vertex buffers beneath a `sharedAsset` ancestor, so generic room cleanup skipped them; the bar's previous disposal only restored/detached its extracted pieces.

`minato-bar.js` now explicitly owns and releases those private geometries. It restores the retired clone's original geometry, detaches borrowed vertex/morph attributes before disposing the private index wrapper (the existing window-batch disposal pattern), and disposes extracted triangles even when the door is detached or the bottle is in a hand. Borrowed model materials remain untouched. Disposal is idempotent, and a later service cancellation cannot reattach a freed bottle. The actual-model regression `tests/minato-bar-lifetime.test.mjs` observes **zero undisposed private wrappers or extracted geometries** after every exit, exactly one disposal each, and unchanged cached vertex/morph/index/material resources.

The new regression plus existing bar behaviour and fitted-backbar/room checks passed **30/30** in 6.23 seconds. A final isolated regression after adding the explicit cached-morph assertion passed **1/1**; whitespace checks passed. These are CPU disposal/geometry checks, not a substitute for the next hosted uploaded-resource comparison. No runtime build or commit is performed by the sub-agent; the integration owner must add the new regression to the guard, rebuild and record the complete combined results before publication.
