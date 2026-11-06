# Sakura/izakaya room recovery and Nakamura retirement — 31 October 2026

## Owner request and state

Owner: “The game crashes in Sakura office too, find the issues. Izikaya and Sakura, remove the ice cream family now ... we need to build facilities before we populate them”.

**Published to main through [PR #415](https://github.com/nj22az/nj22az.github.io/pull/415)** as `4a06f5fcc9f60ce447a6a28b915b3f8d087a087c`. Its tree `dbe595ac4a19f6390ba5613558d8e64803a6fb68` exactly equals the final accepted candidate `b8a3174ee4d7a2d4977fe34c8a9c4b2ad76d679e`. [Pages deployment 41154350179](https://github.com/nj22az/nj22az.github.io/actions/runs/41154350179) succeeded. [Post-merge World guard and native acceptance](https://github.com/nj22az/nj22az.github.io/actions/runs/41154351097) also succeeded. **63/63 checked public files**, plus the unversioned entry page and service worker, match the published Git blobs; see [public-byte evidence](../docs/qa/room-crash-family-2026-10-31/publication-live.json).

The repair retains Pocket Camera's current publication and integrates the existing startup/resource repair (#413), CAD Rev 9/entry recovery (#410), published artwork (#409) and the owner's two-office-poster selection (KITANO 12 and UMINEKO Black). Source PRs #410 and #413 are closed as superseded by #415; do not merge them independently. No unrelated Camera source changed. Shell Git lacked write credentials; the connected GitHub app delivered SHA-verified trees. No automatic approval rejection occurred on this delivery.

## Confirmed faults

- Main's released-canvas registry retained disposed room textures, backing canvases and painter closures. The existing startup repair unregisters them on disposal; its regression reproduces twelve retained entries before the fix and zero afterwards.
- Six concurrent full-character decodes and shader warm-up of hidden subtrees caused avoidable memory/compilation peaks. The integrated repair uses two concurrent jobs and compiles drawable subtrees, retaining the normal cartoon rendering and original models/textures.
- Entry lacked complete recovery around prerequisite loads and allowed another entry between loading phases. One lock now spans prerequisites and construction; rejected loads retain the current room and can be retried. A construction exception uses the ordinary street rollback and logs the original error.
- Sakura's stair transition ignored a false readiness result, discarded its loaded storey and announced arrival even after failure. Failed prerequisites now keep the original floor, return the player to its safe stair arrival and clear passage/input state for a retry. Successful swaps dispose the preceding room once.
- Sakura's cached poster/case atlases were disposed by office cleanup despite also belonging to the persistent shop. The shared textures now declare that ownership. The regression first reproduced three poster and one case disposal event; five office build/cleanup cycles now preserve the cached atlases while disposing room-owned resources.

- The extended native WebKit run then exposed a real five-geometry increase on each izakaya visit. Actual fitted-GLB/real-clearRoom probes confirmed five private edited-index wrappers escaped cleanup under a shared-model ancestor, plus six extracted door/bottle geometries. `liftPiece.dispose()` now restores the cached source, detaches borrowed attributes before releasing its private index, frees extracted geometry and guards late service callbacks. Three actual-room cycles release all eleven private geometries exactly once, with cached geometry/morph/index/material data untouched. Existing bar/backbar/lifetime checks pass 30/30.

These are reproduced code/resource faults. They do not establish the exact cause of an OS-level physical iPhone page closure; that reported failure remains distinct from the automated checks below.

## Facilities before residents

Exactly Emi Nakamura (`emi`, Mrs Nakamura) and Mai Nakamura (`mai`, Mai) retire from active cast, households, schedules, school presence, social choices and resident guides. Historical recipes/assets remain available for existing creative work. Their retained dessert/ice-cream premises are vacant, shuttered and unstaffed, and cannot take an order. Their former upstairs home is no longer an occupied address; the premises remain. The community-kitchen programme pauses while civic register/clinic facilities remain.

Save migration removes retired aliases and relationships, remaps the old home discovery, drops errands from or to either retiree, and retains surviving progress. Desktop life already recovers an absent controlled resident to Johansson; regression coverage checks the new retired aliases without replacing that implementation. No replacement resident or best friend is invented.

## Final verification

The final application commit is `e13f14afbf653361a9df6d35ec1df57164c6fe09`, source SHA-256 `64e1d6e1f45a6865e3555fb1325eb1c18c4c66dbb5f89f523890098f79812392`. The final browser-fixture follow-up `b8a3174e` changes no application code. The rebuilt runtime has 35 manifest entries and retains all 35 preceding production cache-entry files byte-for-byte.

- Final local guard: **560/560 across 109 files**, no skipped/TODO, 393 seconds (6 GB heap, two-file concurrency). Final full-game CPU boot/interior smoke: **1/1, 154.2 seconds**, with actual room builders, simulation and saves but a substituted renderer.
- [Exact-candidate hosted run 41153437339](https://github.com/nj22az/nj22az.github.io/actions/runs/41153437339): guard and native WebKit acceptance **passed**. [Artifact 13024636306](https://github.com/nj22az/nj22az.github.io/actions/runs/41153437339/artifacts/13024636306) contains the report and nine captures. Actual office, both selected print close-ups, izakaya and restored-startup captures were opened and inspected.
- Three measured Sakura-office/izakaya visit pairs after full warm-up and fresh matching per-venue baselines: **all six samples show zero texture, geometry and released-canvas growth**, with zero allowance. The fixture also passes cold/warm boot, rotation, both dining doors, saved discovery/reload, forced loading-context loss/recovery and a normal URL return after twelve hours. Final natural-return Entering time: **55,161 ms**; complete run: 402.79 seconds.
- No uncaught page errors. One normal `izakaya-ad.mp4` request cancellation is retained in the report when room media is disposed; this is not presented as zero failed requests. Normal ink/colour grade, HDR, four-sample antialiasing, original models and textures remain enabled.
- Actual-model bar cleanup plus existing serving/backbar checks: **30/30**; independent review subset **19/19**. Each of three actual-room visits frees five private index wrappers and six extracted geometries exactly once while preserving cached model attributes/morphs/index/materials. Late callbacks and repeated disposal are guarded.
- Room recovery **19/19**, facility batches **40/40**, World Library **3/3**, portrait catalogue **8/8**. Retirement/save/directory/recipe/guide checks pass. Active roster is **18 core + 5 supporting = 23 identities**, with 13 retired and 12 core households.

No portraits were rerendered: `--catalogue-only` reconstructs the previous recorded input hash using the old catalogue and current visual sources, refuses changed sources/new names/changed image paths, retains the prior render hash/count and records `rendered: 0` for the 23 retained portraits. Original image bytes remain unchanged. World Library live choices remove retirees; historical creative recipes remain.

Full evidence is under `docs/qa/room-crash-family-2026-10-31/`: `verification.json`, `guard.txt`, `cpu-boot.txt`, `iphone-final-report.json`, `publication-live.json`, guide/build records and prior diagnostic reports. The final guard/CPU logs supersede the preserved pre-bar-fix 559-check/157.9-second logs.

## Diagnostic history and limits

Earlier hosted fixture attempts exposed an exit tap away from the authored door and transient arriving-guest obstruction; the fixture now waits at most ten seconds using unchanged real collision/resident/exit-site predicates before tapping the visible enabled control. Permanent obstruction still fails with diagnostics. A subsequent native run exposed the real +5 private-geometry leak described above. After the fix, three pairs had stable geometry/canvas counts but distinct stable office/izakaya texture counts (235/234); the final fixture compares fresh matching per-venue baselines after full warm-up rather than comparing different venue states. It still rejects the actual recurring +5 leak; no growth allowance was introduced. Earlier reports are diagnostic history, not passed acceptance.

Native testing used Linux WebKit/Mesa with an iPhone 13 viewport, user agent, DPR and touch profile. **Physical iPhone/Safari OS-level page closure remains unobserved**; this work does not claim physical-device acceptance. No new Linux release, Studio sync, paid asset generation or Blender rebuild. Existing Rev 9 model and Artlist artwork are reused.

The owner's facilities-before-population ruling is recorded in World AGENTS and the cast-consolidation addendum. Any future staffing/population proposal starts from the retained vacant facilities rather than silently restoring this household.
