# Woodland poster acceptance

Actual compiled World in software Chromium. Desktop 1280 × 900 and phone-sized 390 × 844 screenshots come from `tools/woodland-poster-review.mjs`; all fourteen acceptance checks passed, with zero page errors. Screenshots are lossless WebP conversions of browser PNG captures.

- [Before](board-before.webp) and [after](board-after.webp): the existing harbour notice board. The camera is fixed and the same in both.
- [Phone board](board-phone.webp).
- [Look menu](look-menu.webp) and [phone menu](look-menu-phone.webp).
- [Desktop viewer](viewer-desktop.webp) and [phone viewer](viewer-phone.webp).
- [Actual-game report](game-report.json): on-demand loading, preserved flyer, one iframe, held hidden renderer, Escape, Close, browser Back, replacement activity and preserved position.
- [Hosted-viewer report](hosted-viewer-report.json): native/fallback decoding, orbit and zoom controls, full scene integrity, and model-failure poster fallback. This isolated report predates only the fallback message being moved from the image centre to its top edge.

The before image was captured from main `a3a4ad0`, and the after images from the integrated rebuilt source atop `2cc5a6b`, runtime source hash `48d8fd3dbb11414d0a8139cbe1e4342e90f613d1186ff507608aeaf2e1292079`. The intervening main change did not alter the harbour board.

No physical-device, Safari or packaged Linux acceptance is implied.

[Validation summary](validation-summary.json) records the initial geometry failure, its correction and passing rerun. [Full geometry rerun](geometry-check.txt): 13/13 pass.

[Live publication verification](publication.json): all ten downloaded files match the reviewed build. The implementation commit’s [full GitHub guard](https://github.com/nj22az/nj22az.github.io/actions/runs/40083681589) passed 401/401 tests across 76 files.
