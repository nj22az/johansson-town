# Startup crash audit and iPhone simulation — 30 October 2026

**Published status, 31 October 2026:** This work is merged and live through [PR #415](https://github.com/nj22az/nj22az.github.io/pull/415), main `4a06f5fcc9f60ce447a6a28b915b3f8d087a087c`. Its tree `dbe595ac4a19f6390ba5613558d8e64803a6fb68` is identical to native-passed candidate `b8a3174e`. Earlier review PRs [#410](https://github.com/nj22az/nj22az.github.io/pull/410) and [#413](https://github.com/nj22az/nj22az.github.io/pull/413) are closed and superseded by #415.

**Latest handover:** [Room recovery and Nakamura retirement](HANDOFF-ROOM-CRASH-FAMILY-2026-10-31.md). Final guard: **560/560, 109 files**; native iPhone-profile WebKit run **41153437339 passed**, including three visit pairs with zero resource growth; Pages deployment **41154350179 succeeded**; public verification **63/63 passed**. The owner's physical iPhone failure remains unobserved.

**Historical record:** The original branch, review, verification and unpublished-delivery statements below describe their earlier stages and are preserved as history. Use the latest handover above for current continuation and publication state.


**Combined follow-up, 31 October 2026:** see [Sakura/izakaya integration](HANDOFF-SAKURA-IZAKAYA-INTEGRATION-2026-10-31.md). `codex/sakura-office-izakaya-review` brings the three candidates together, with exactly KITANO 12 and UMINEKO Black in the upstairs office. The original results below describe this branch independently; combined results and publication state are in the new note.


Owner: game does not start properly and kicks the player out; audit and remedy. Follow-up: “Run a simulated iPhone”.

## Branch and scope

`codex/world-startup-repair`, from production `ff76aee1a30ff1d000bd5bb9ecf0475543915899`.
[PR #413](https://github.com/nj22az/nj22az.github.io/pull/413), into `main`; ready for review. Not merged or published.
Code candidate `6d064234099d943d00e991d8455467063877de9b`, exact tested tree `4a87db3b53d49f27010f728619683b0ef6637f28`.
Current main `87f47e8f6e5fafdb586ac723e9aa3cc704d11345` is merged into this branch: preserve the concurrent Lightpanda
documentation and Blender sign correction. The handover conflict retains both entries. No running World source changed
in that main update. The separate Izakaya CAD repair (#410) is not included. No character, scene, shader-quality or Linux release change.

## Final verification — 31 October 2026

**Completed and pushed; not published.** Final app code: `4a37c11da8c0674145e4b3ad03facc28d223158e`.
Tested code plus explicit cartoon-quality assertions: `6d43b4283f1035b1afb3e5e7169f7eaec2d5064d`.
Runtime source SHA-256: `6873e9c7ca4e9ba346ff2d05e8c5263d7904e579fdedc3e03df3ada171fa7fdc`.
The following documentation/evidence commit changes no source, tests or runtime.

- **Full World guard: 513/513, 99 files, passed** locally (219 s) and in hosted
  [run 41136194829](https://github.com/nj22az/nj22az.github.io/actions/runs/41136194829) (356 s).
- **All eight iPhone-profile WebKit/Mesa scenarios passed**, zero page errors and zero failed requests: cold start,
  advancing live frames, landscape/portrait rotation, warm reload, real Izakaya entry, saved discovery, forced real GPU
  context loss during startup, and the ordinary entry URL after a seeded twelve-hour absence.
- The seeded twelve-hour return completed Entering in **22,762 ms**. The earlier ordinary-clock return had taken
  **139,799 ms**; its gap and opening differed, so these are recorded test cases, not a controlled hardware benchmark.
- Every launch explicitly retained **cartoon ink, colour grade, HDR and four-sample antialiasing**. No normal graphics
  profile, lighting, texture/model resolution or scene geometry is reduced. Cold-start program count was 133 in this
  run (timing of streaming affects the count; do not treat it as a hardware-memory measurement).
- [`iphone-final.json`](../docs/qa/startup-2026-10-30/iphone-final.json) retains the complete report, timings and graphics
  states. [Original report and five PNGs](https://github.com/nj22az/nj22az.github.io/actions/runs/41136194829/artifacts/13017012512).
  The final portrait and actual-clock night opening were opened and inspected: the real game and current resident,
  with the cartoon appearance retained. This is desktop WebKit mobile emulation, not a physical iPhone photograph.
- The unchanged published main boot graph is retained for cached clients. Final runtime-package checks pass; 35
  manifest entries. Authored-file whitespace and JavaScript syntax checks pass. No merge to main or new Linux release.

## Owner's visual constraint — 31 October 2026

The owner: “Don’t revert to bad graphics we need it to feel like we are playing a cartoon”. The normal rendering
profile, cartoon ink and colour grade, HDR, four-sample antialiasing, lighting, complete models and full-resolution
textures are retained. The iPhone test now explicitly asserts ink, grade, HDR and four samples after every launch,
including after forced context restoration. Work is confined to scheduling, resource lifetime and unnecessary warm-up.

## Reproduced startup stall and final correction

The ordinary real-clock URL exposed the significant fault that a fixed-clock/ferry fixture missed: the simulated
phone spent **139,799 ms (about 140 seconds)** between START and its first playable frame. Its title/preview had
already finished; it was replaying hours of missed town time, not downloading the game. See
[`startup-root-cause.json`](../docs/qa/startup-2026-10-30/startup-root-cause.json) and
[`iphone-recovery-passed.json`](../docs/qa/startup-2026-10-30/iphone-recovery-passed.json), the final natural-clock case.

The catch-up scheduler allowed only 4 ms / 40 steps between full scene renders. At software phone frame rates,
drawing the loading scene dominated the wait. Until the first playable frame, the exact same 0.2-minute simulation
steps now receive 32 ms / 320 steps per batch. Once playable, the original 4 ms / 40-step budget returns. A regression
compares every step and every saved remainder for a twelve-hour return; none is dropped and no background process
is disabled. A second check retains the hard cap and the immediate return to the normal budget.

Also corrected two avoidable memory/compilation peaks: six full character models previously loaded concurrently
(their decoded base colour images alone are 97 MiB); two jobs now run at once, retaining every original model and
texture. Shader warm-up now excludes hidden subtrees, including unused outfits and closed interiors, instead of
Three.js compile() traversing them all. They compile normally if shown. The initial-frame breadcrumb is written once,
rather than synchronously rewriting localStorage on every stalled frame; “Playing” is recorded only after play begins.

The iPhone fixture now deliberately seeds a twelve-hour absence at the device's current civil time, enters through
the ordinary URL with a natural opening, and fails if Entering takes a minute. This reproduces the return condition
at any hour, including after midnight. Final focused checks after these changes: **54/54 passed**. The final runtime
has been rebuilt while retaining the currently published main graph, rather than an unpublished intermediate build.

## Findings and corrections

The long startup delay is reproduced above. An OS-level physical-device kick-out is not observed. Other confirmed defects:

- The released-canvas registry retained disposed room textures, canvases and redraw closures. A context restore
  repainted those obsolete pictures. The regression first failed on unchanged code: all 12 disposed entries remained.
  Disposal now unregisters them and releases their canvases. The same regression passes with zero retained entries.
- World's own WebGL lifecycle listened only after town construction and shader warm-up. Loss/restoration during
  those loading stages missed the game's pause, pipeline rebuild and released-canvas redraw. Three.js already handles
  the underlying context's `preventDefault`; the missing part was the game's own state and resources. Its listener now
  attaches before the first loading yield and defers callbacks that need gameplay state until that state exists.
  It records loss/restore locally.
- The interrupted-start marker began in `game.js`, after the Pixar models loaded. It now starts in `boot.js` before
  model fetch/decoding; the game reuses it, and an import retry cannot count the page twice. The 45-second settling
  period begins after an actual playable frame, rather than on the START click.
- A failed title preview enabled START and hid the useful error until the player clicked. It now immediately shows
  the startup error and Retry, and keeps START disabled. A behavioural test executes the actual inline loader with
  rejected WebGL creation and verifies the visible error, disabled button and working reload action.

Full normal graphics and the six current Pixar characters are preserved. Recovery still waits for two interrupted
launches; no general phone quality reduction. Saves are not cleared or migrated by these changes.

## Simulated iPhone baseline

The connected cloud browser reaches the published title but WebGL creation fails with GL_RENDERER Disabled. That
is an environment limit, not evidence of a fault in the owner's phone. The automated test instead ran WebKit/Mesa
with Playwright's iPhone 13 user agent, DPR 3, touch, phone viewport, portrait and landscape, against the compiled
production World. Full HDR, four-sample antialiasing and ink remained enabled.

[Run 41131374437](https://github.com/nj22az/nj22az.github.io/actions/runs/41131374437), test-only commit
`a1a011619151f6b557d1836290cc11727218b1d4`: **iPhone WebKit test and full World guard passed**.
Cold launch, live frame progression, rotation, warm reload and real Izakaya entry passed; no page errors or failed
requests. Cold-start check at 38.4 seconds, all five groups by 72.93 seconds on the hosted software renderer.
These are test-harness elapsed times, not physical iPhone loading or FPS claims.

[Machine-readable baseline](../docs/qa/startup-2026-10-30/iphone-baseline.json).
[Original report and three PNGs](https://github.com/nj22az/nj22az.github.io/actions/runs/41131374437/artifacts/13012329471).
The portrait screenshot was opened and inspected at full resolution: actual World scene, current resident, controls
and harbour, not a blank or loading frame. The baseline does **not** reproduce the owner's kick-out.

## Correction validation

- Runtime rebuilt with pinned Vite 7.3.6; the previous live boot and its dependency graph are retained for cached pages.
- Focused source/package/loader/lifecycle/canvas checks: **27/27 passed** locally.
- New early graphics-loss ordering test failed before moving the lifecycle and passed afterwards.
- All five startup/lifecycle/canvas test files are now in the World guard, rather than outside it.
- Corrected source plus current main: `8dedc787cabdb54020d360100a9a793d5a135397`, tree
  `1fbf00304e9b0edbdde1ea58afbcf159ec319898`, [run 41133019214](https://github.com/nj22az/nj22az.github.io/actions/runs/41133019214).
  **Full hosted World guard passed (505/505)**. All seven WebKit scenario checks completed, including persisted discovery and a real forced loading-screen context
  loss/restoration with HDR restored. **The job failed its final no-error assertion**: a bentwood-chair blob texture
  was cancelled by a fixture reload; WebKit reported an access-control error from the outgoing document. Report:
  `docs/qa/startup-2026-10-30/iphone-stress-first.json`; original artifact `13013808600`. The restored startup capture
  was inspected: the harbour and current character render normally after the real GPU loss.
- The fixture now waits for in-flight network/decode work before planned reloads, and records error phase/time/stack.
  Every error assertion remains; no exception text is suppressed. A repeat also checks the ordinary URL with the real
  device clock and an unforced opening, beyond the deterministic ferry fixture. That repeat **passed all eight scenarios**, with zero page errors and failed requests:
  [run 41133968473](https://github.com/nj22az/nj22az.github.io/actions/runs/41133968473), artifact `13014388815`.
  Its ordinary-clock Entering delay exposed the 140-second scheduling defect fixed in the final candidate above.
  The final code candidate is `4a37c11da8c0674145e4b3ad03facc28d223158e`, exact tree `429840f50166cd6272eec5f6017da60af8cf0b8f`.
  It is rerun with the deterministic twelve-hour absence, a strict startup-time assertion and explicit full-cartoon checks.
- Authored-file whitespace and JavaScript syntax checks passed.
- Earlier correction guard: **505/505 passed, 96 files, 208 seconds**. The final source passes **513/513** above.
- Full-game CPU wiring/interior smoke plus runtime package: **5/5 passed**, 159.8 seconds. The fixture reports its
  existing placements-fetch warning; stability checks pass. It substitutes the renderer and does not establish GPU acceptance.

## Remaining acceptance

A desktop WebKit engine with a mobile profile does not model iOS jetsam/process limits, Mobile Safari's exact GPU
implementation, or the owner's existing tabs, saved state and network. No physical iPhone/iPad/Steam Deck claim.
The corrected source and captures are verified above. Next: publish the reviewed repair on the owner's instruction,
then verify the actual phone's original failure on the deployed build. Its OS-level kick-out remains unobserved here.
