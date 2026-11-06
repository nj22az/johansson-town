# Four experimental print and paint looks - 23 October 2026

## Scope and status

Owner requested Risograph, Manga with pencil strokes, Oil with heavy facial brushwork, then added Rubber Stamp and explicitly requested Izakaya renders. Implemented on `codex/print-media-looks-2026-10-23`, based on main `d4912912128e035c8336665a040e7c391f9580d8`. Local implementation commit `7e72a19`; review branch, not merged or deployed. Read alongside [the accepted shared-shader recovery](HANDOFF-SHARED-SHADERS-2026-10-23.md). Preserve Minato priority and the retirement of Storybook, Sunday Strip and Impasto Gouache.

## Delivered behaviour

World, Studio and After effects now discover nineteen looks: the accepted fifteen plus four explicitly experimental catalogue entries. Source kernels are in `src/render/print-media-shaders.js`, consumed by the existing shared `looks.js` factory; no second renderer or character system.

- `riso` / Risograph: coral and teal screened colour plates, indigo contours, warm paper, grain and small plate offsets. Patterns are deterministic.
- `pencilManga` / Pencil manga: white paper and porous graphite contours with short broken pencil strokes restricted to the deepest tones (below 0.28). This is a conservative luminance fallback, not a new lighting/shadow buffer. Lit mid-tone faces remain clear; the hero backdrop is thresholded once.
- `brushOil` / Heavy brush oil: wide directionally oriented, low-variance colour clusters; depth guards against borrowing background colour across silhouettes. Preview and export share the broad footprint with different sample counts. High-contrast facial features, ink contours and the World ink prepass remain. It is an image-space painterly approximation, not simulated 3D impasto.
- `stamp` / Rubber stamp: burgundy pigment, cream paper, solid cut shapes, variable pressure and sparse pinholes. This deliberately loses some tonal detail in dark rooms, as the review images show.

Accepted Manga, Cartoon, Oil and Crayon main fragment bodies were compared byte-for-byte against the main base and are unchanged. The new looks do not install the earlier material-pencil hook or replace accepted material settings. Geometry normals/depth are requested for the new looks. Studio letters stay on the later compositing layer; new styles use the existing slightly irregular bubble/panel outlines. Each new look survives scene, effect and layered-project normalization. The icon picker has distinct swatches and a scrollable height bound for the larger catalogue. Studio imports use `20261023-print-media` cache versions.

`avatar-creator/render-print-media.mjs` reproduces four complete production strips with the actual cast, booth, low-angle fist-pump hero and beer/football shed ending. `tools/shader-world-smoke.mjs --looks=riso,pencilManga,brushOil,stamp --izakaya <output>` reproduces the full-game views, including the requested bottle shelves and bar. The old helper invocation keeps its previous scope.

## Verification actually completed

- Initial focused catalogue/material/project tests: 24 passed.
- Final focused catalogue, picker, materials, capture/effects, scene and current-runtime set: 28 passed, zero failures.
- Real WebGL acceptance: 56 day/night environment/look combinations passed, plus numeric depth, normal and alpha-cutout captures, material restoration, warm-skin preservation and unchanged binary Manga/neutral Cartoon fixtures. New legacy picture-only shaders compiled in preview and export.
- Real After effects MCP stdio/Chromium acceptance passed in 24.0 s: nineteen looks discovered, editable text/assets exported and reopened, prior translation/removal checks retained.
- Runtime rebuilt in 12.11 s: `boot-CSqOOSL-.js`, `game-C38xgZqd.js`; current-source/runtime tests passed.
- Full compiled game, standard quality, 390 x 844 viewport: seventeen steps, twelve screenshots, zero reported page/shader errors or style fallbacks, 176.2 s. Four styles each in Minato Street, Community Hall and Minato Izakaya. Cloud software WebGL, not physical-device performance acceptance.
- All four 3200 x 1079 comic PNGs inspected. Eight-page review PDF rendered; comic lettering and the twelve game views visually checked. Riso is intentionally strongly coral/teal; Stamp is deliberately graphic and can merge dark colour regions. No claim of universal artistic acceptance.

## Deliverables and continuation

Saved eleven final deliverables successfully: four comic PNGs, four standalone Izakaya PNGs, `johansson-print-media-review.pdf` (eight pages), `johansson-print-media-game-screenshots.zip` (twelve game PNGs and report), and `johansson-print-media-editable.zip` (four layered Studio projects). Local directory: `deliverables/print-media/`. Previous accepted deliveries remain untouched.

Next: owner visual review of the four independent experiments, then merge only the accepted work. No physical-device FPS, Safari or native Linux package acceptance has been performed for these new looks; no Linux release or live Pages publication is claimed. Retain accepted presets unchanged during further tuning. The PR and exact publishing commit are recorded in the final review update below.

## Published review update

[PR #383](https://github.com/nj22az/nj22az.github.io/pull/383) is open, not merged: publishing implementation commit `9aa922e1f754b2e742b3598f0403f99d8206d261`, based on main `d4912912`. Local documentation commit `10bbb85`. Eleven final files were saved with their persistent identities verified. Review PDF and individual previews are delivered with the response. CI may still be running; the local checks above are completed evidence, not a claim about an unfinished cloud run.

## Approved merge and discreet creator mark - 23 October 2026

Owner approved proceeding. PR #383 merged into main as `2b836773c689afb672a7d2f1d661e3fd8228fc1f`. GitHub World guard run 39972713434 passed. Linux acceptance run 39972713417 passed regression tests, packaging, controller recovery, native/disk-save smoke, offline smoke and layout/resident checks, then hit the workflow's 20-minute timeout during conversation escalation (exit 124, not a reported shader assertion). Failed jobs were retried; completion is still pending. The earlier blanket "checks passed" referred to the completed local checks, not this later cloud timeout. No new Linux release is claimed.

Follow-up `codex/comic-creator-mark-2026-10-23`, based on that merge, implements the owner's standing request for a discreet signature/logo on future comics. Chosen first implementation: small italic "Johansson" wordmark and fine underline, once on the final panel, lifted above any bottom caption. Colour follows Stamp/Riso ink; other looks use subdued dark ink. `creator-mark.mjs` is independent of the shaders and clean layers. New workspaces default enabled and remember the owner's choice locally. Creator mark controls remain available in both comic steps: text, left/right corner, opacity, enabled. Projects, exports, sharing links and After effects carry the setting. Legacy projects/links without it remain unmarked. This is not a claimed authentic handwritten signature. The standing decision is recorded in avatar-creator/AGENTS.md.

Validation: thirteen focused creator-setting, Unicode lettering, link/effect and current-runtime checks passed. Real Chromium exported a signed Manga strip, changed the wordmark/corner, removed it and reopened the signed project with byte-identical output, zero warnings. Actual After effects MCP export/edit/reopen regression passed in 24.9 s. Full strip and enlarged signature crop inspected: above the football caption, no extra mark in other panels. Delivered signed PNG and editable .studio.json under `deliverables/creator-mark/`, both saved persistently. Avatar-only follow-up; existing compiled World runtime remains current. Creator-mark implementation pushed to main as `9f546d5b8f819fd5aae5020a372a8cb502138784` (local implementation `dcdb6b6`). Public Pages deployment was not yet verified at this handover update. Linux retry remains in progress.
