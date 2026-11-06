# Painted face visibility — 25 October 2026

## Delivery

Maintenance correction for `main`, based on `b998e375344804717fa338d1afe622efe2a94637`.
Source, rebuilt runtime, tests and visual evidence: [`b2f6f71fbae218c3f20ef9f0498657eb50860252`](https://github.com/nj22az/nj22az.github.io/commit/b2f6f71fbae218c3f20ef9f0498657eb50860252).
The commit adding this note is its direct child. No new branch or PR; `development` and `pixar` remain separate.
Promotion and Pages publication must be verified against the actual refs/workflows; the pre-publication checks below do not substitute for that.

## Owner report and cause

Johansson's eyes and the rest of his face disappear under different filters; the supplied screenshot is a midnight Sketchbook view.
Reproduced in actual WebGL with the canonical shared avatar under dim lighting.
This is separate from the earlier conversation greeting selecting a closed-eye expression.

The head's painted albedo loses contrast in dim lighting before the filters run. Nose geometry and the inverted-hull outline survive while painted eyes, brows and mouth fade.
The shared head material now floors outgoing light at 0.5 times its painted albedo; lighting above the floor retains its original result.
The toon shader/tint hook, face texture and UVs, forms, blink/speech/expressions and body/scenery materials are preserved.
Sketchbook reuses the existing local dark-mark detector to retain dark facial marks through its wash.
No geometry, render pass, target or frame traversal added; Sketchbook does add local colour samples.

## Checks actually completed

- Original main fails the new actual-WebGL regression: 390px dim Natural eye contrasts **0.0252 / 0.0246**, below **0.045**.
- Corrected WebGL test **passes**: **92 cases**, all **19 Looks**, dim/day light, **390×600** and **1024×768**, plus repeated switching. Minimum eye contrast **0.0646**; dim Natural **0.1664 / 0.1649**. No page/shader errors. Final rerun 12.6 s.
- Actual shared-head material/animation checks across Johansson, Thuan, Vy and Mr Fujita; added to the full guard.
- Focused shared-avatar, conversation-eyes, look/material and runtime-package checks **20/20**.
- `npm run build:runtime` passed, **8.88 s**; entry `boot-Dxv7PTWJ.js`. Existing build warnings retained; predecessor chunks preserved by the existing builder.
- Full World guard **413/413**, **80 files**, no failures/skips/todos, **152 s**. Command: `NODE_OPTIONS=--max-old-space-size=8192 node tools/ci-guard.mjs`.
- Complete **rebuilt-game** smoke **12 steps**, **eight captures**, **zero errors**, **121.8 s**. Johansson at midnight in Natural/Sketchbook/Cartoon/Oil; Community Hall in the same four Looks. All four street captures inspected.
- Local staged tree and GitHub tree match exactly: `557e2a5ca7ee1f2b6de6c26c8dcc63c810c2a162`.
- `git diff --check` passed.

Evidence and reproducible WebGL command: [face visibility QA](../docs/qa/face-visibility/README.md).
Measurements: [filter report](../docs/qa/face-visibility/filter-report.json).
Built-game run: [game report](../docs/qa/face-visibility/game-report.json).

## Limits and next steps

Software Chromium **153 / SwiftShader**, emulated widths. Physical iPad/iPhone Safari, hardware FPS and every combination of expression/camera/distance have not been verified.
Pixel/print filters retain their intended coarse patterns; this does not promise readability below their sampling resolution.
At the original browser delivery no new Linux package was released. The follow-up below records its verified inclusion in Linux 0.2.20.

After main promotion, confirm the Pages deployment and public boot graph before calling it live.
Check the owner's reported view on physical iPad Safari when available.
Keep this regression and the earlier conversation-expression tests; do not merge the two causes or reintroduce the closed-eye greeting.

## Linux follow-up — 25 October 2026

The correction is now included in [published Linux 0.2.20](https://github.com/nj22az/nj22az.github.io/releases/tag/johansson-world-linux-v0.2.20), release merge `a56db3686b853907f08335c88e0197b96b972b47` through PR #397. Final source is frozen from production main `aa792244`; candidate/release tree `156956a70be12d3f49026df6615a982ca8bd5167` is identical. No new geometry, animation or controller changes.

The final package passes the same **92 WebGL cases across 19 Looks**, with minimum contrast **0.0646**; four dim captures are byte-identical to the reviewed candidate. The public archive's shared-avatar/filter sources and all **32 runtime modules** match production; all **1,621 archive files** match its inventory. Complete Linux controller/layout/resident/save acceptance, native startup/disk saves, offline operation and public installer/checksum verification pass. [Release evidence, checksums and screenshots](../../linux-port/acceptance-0.2.20.md).

Physical Steam Deck, 8BitDo Bluetooth and Safari acceptance remain unverified. Existing coarse pixel/print sampling limits remain. Later concurrent main changes are not folded into this immutable package.
