# Linux port, iPhone appearance and loading audit — 18 October 2026

## Finding

The initial Linux port did not replace the web renderer or rewrite its cel/ink
shaders. The largest verified changes to iPhone appearance came afterwards, in
mobile recovery changes. The screenshot is not evidence that the Linux port itself
corrupted the artwork. There is no recorded before/after physical-iPhone capture
that proves a complete visual regression date or an exact Safari process-kill cause.

This audit compares the pre-port commit `777ad8b8491e6db7979782702a5e5e595bb648e3`,
the port `84264961`, mobile recovery changes and the later rendering fixes.

| Change | Verified effect |
| --- | --- |
| `84264961` — 17 October, 20:20 Stockholm | Added native integration, checkpoints and festival-related code; no changes under `johansson-town/src/render/`. The port's additions do not establish the cause of a later web visual defect. |
| `fb2062a5` — 17 October, 20:41 | Added bounded wider native asset preloading and diagnostics. Native integration and the web/mobile graphics profiles must be assessed separately. |
| `d95397bb` — 18 October, 04:58 | Replaced the previous phone 1.5× draw ratio, native AA and four-sample postprocessing with a lower mobile ratio, no native/offscreen MSAA, byte colour targets and a tighter pixel ceiling. These were resource safeguards after reload reports; they also reduced edge quality. |
| `3dc3c4c8` — 18 October, 05:36 | Forced iPhones to 1×, disabled postprocessing and background details, and capped the canvas at 650,000 pixels. This removed ink/grade/FXAA and left simplified exterior assets in place. |
| `a42fad65` / PR #221 | Applied cel shading to animated residents and adjusted single-pass colour. It did not restore screen-space effects, and its visual verification was incomplete. |
| `a4348160` / PR #222 | Restored ink, grade, FXAA and small sun shadows; fused ink and grade to remove one colour buffer. Kept the phone at 1× and used a 512px shadow map over a 52 m-wide region. Its GPU checks passed, but they did not prove satisfactory quality in the user's park scene. |

For a 390 × 844 CSS-pixel viewport, 1× gives 329,160 scene pixels; the previous
1.5× ratio gave 740,610. The fixed 1× policy left almost half of the existing
650,000-pixel allowance unused. This is a concrete source of softness and jagged
edges, independent of whether the cel effects run successfully.

## Corrections in this change

- Let the phone request up to 1.5× while retaining the same 650,000-pixel canvas
  and postprocessing ceilings. The governor can reduce it under load. This uses
  the already bounded budget; it does not restore the former unbounded allocations.
- Keep the 512px phone sun-shadow map but narrow its orthographic coverage from
  52 m to 28 m around the existing player-relative light target. This improves
  near-field shadow detail without increasing shadow-map storage. Distant shadow
  coverage is consequently shorter.
- Correct an exact-overlap case in `body-collision.js`: the old code replaced a
  zero distance with 1 metre before computing penetration, producing only a 2 mm
  correction. A coincident pair now receives the full body-width separation,
  respecting fixed bodies and walls. This does not claim to resolve every possible
  crowd-schedule or fixed/fixed placement conflict in the supplied screenshot.

The pointed leaves are intentional geometry. `src/world/okinawa/trees.js` is
byte-identical before the port and at the audited main branch (blob
`151a6bdfee789fb0fdc9f14ca03c5517b8bb98ca`). Its tree implementation predates the port
(commit `35115192`, 1 October). The collision helper is also byte-identical across
that interval (old blob `f4eded0e8251ae6c8bfbb4ede428b9af383f8f23`). My earlier broad
screenshot diagnosis did not establish that the leaf shapes were a new defect or
that the port introduced the crowd issue.

## Real loading progress

The old `.title-bar span` was a 40%-wide segment translated repeatedly by
`bar-run`, a 1.3-second infinite animation. Git blame dates that code to
`7e45b42bc`, 30 September — before the Linux port. It measured no loading work.
The rotating island facts were also informational, not progress.

The replacement has eight explicit startup tasks: controls, code, accessories,
graphics, town construction, residents, walking routes and the first playable
frame. Each advances once, after its actual work returns. The bar reports
**completed startup tasks**, not an invented download percentage or time estimate.
File-request counts are displayed separately, including failures. Their requested
total can grow as scene loaders discover files; it is not presented as a fixed
whole-game download size. Optional streamed details can still arrive after entry.

The launch overlay remains until a usable first frame has been drawn, including
an indoor opening. Failed or stalled work does not fill the bar. Large synchronous
jobs yield once before starting so their current label/count can be painted; the
yield timer does not award progress. Reduced-motion styles no longer force a false
full-width bar. Rotating facts may continue, independently of the measured bar.

This changes the shared game source and published browser build. It does not claim
that an existing installed Linux archive has been rebuilt or updated automatically.

## Verification and limits

55 focused checks passed locally, including real-task counting, out-of-order and
duplicate completions, growing file queues, failure, first-frame readiness,
coincident-body separation, phone budgets, rendering recovery and runtime packaging.
A full-game CPU smoke reaches game startup but fails an existing stale home-list
expectation (removed `home-fumoto-*` entries and omitted newer occupied homes /
`sakura-office`); the same failure was reproduced against unchanged main-branch
game source. This is recorded separately
rather than describing the entire repository test suite as passing.

The browser check `tools/loading-audit-smoke.mjs` holds an actual model request,
confirms that time alone cannot advance the bar, releases it and requires 8/8 tasks
and a hidden loading overlay only after first-frame readiness. It captures the park
in portrait and landscape and Sakura's interior using Linux WebKit with an iPhone
viewport. The completed run's evidence is stored in `docs/qa/loading-render-audit/`.
Portrait, landscape and interior captures passed with full effects and no WebGL
error. Their images also passed a scene-content check and were visually reviewed.
The held-download check passed: the bar remained at 2/8 tasks (25%) while a
catalog model request was blocked, then reached 8/8 after entry. The portrait
render used 548 × 1186 scene pixels (649,928), with ink, grading and FXAA enabled
and no WebGL error. These are Linux WebKit measurements, not a physical-phone
benchmark. The initial landscape evidence raced the resize and paused drawing before its
screenshot. Visual review caught the blank image despite the GPU-state assertions
passing. The corrected harness waits for the resized buffer, keeps rendering and
rejects captures without a drawn scene. The final landscape buffer is 1186 × 548.

Visual review of the park portrait still shows conspicuous layered bands on the
tree canopy. The pointed leaf geometry predates the port, but that fact does not
establish that every aspect of its current shading is satisfactory. This remains
a visual issue to investigate, and the camera is a park test view rather than an
exact reproduction of the supplied screenshot. The native Steam Deck image has
not been captured alongside it for an equivalent comparison.
Physical iPhone Safari performance and an exact reproduction of the user's crowd
scene remain separate acceptance work.

## Audit of the verification process

The previous checks correctly established shader execution, resource bounds and
context recovery. They did not justify a general claim that the game now looked
satisfactory on the user's phone. The selected street/shop captures omitted the
park bench, tree and live crowd in the user's screenshot. Future graphics reviews
must name the actual scene, viewport, device/profile and remaining visual defects;
a successful renderer smoke test must not be described as completed visual approval.
