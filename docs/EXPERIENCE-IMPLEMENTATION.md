# Experience improvement implementation

This is the sequential continuation of the experience audit initiated on 18 October 2026. Keep one substantial task active. Existing accepted game behaviour, occupied homes, compact Minato and iPhone resource safeguards remain authoritative.

## A01 - truthful saves and safe player changes

Published through PR #233 in main commit `29ca9a24ed185d8afa25469e4a60199e4e3b0a8b`, starting from main `1e792f781b54f9b0bd5cbc06141117d145304ea0`.

The original reproduction rejected storage writes after changing the live balance from 1,200 to 8,123 yen. `Save now` displayed `Saved` while the old balance remained on disk. The failed write also advanced the displayed successful-save time. Switching/new-player actions reloaded without checking whether the current progress had saved.

Changes:

- `activities.js::save` updates the successful-save timestamp only after the current state has actually been written. Preparation errors use the same failure status.
- Manual save and navigation use `saveBeforeLeaving`. A failed write keeps the live session and offers retry, export or continued play. Export can capture unsaved progress when local writes remain unavailable.
- Switching and creating players require the current save to succeed, then check the roster write before reloading. Leaving for Johansson Studio uses the same guard.
- `src/save.js::addPlayer` reports failed creation. Imported progress is stored before selecting its new slot; failed roster activation removes that newly created inactive save where storage permits. Existing players are not selected on import failure.
- In-game and title imports share the same activation path and reject array-shaped save states. A failed title import clears the input so the same file can be retried.
- Existing save keys, old-save migration, previous-copy recovery, rescue copies and export format remain supported. No new save system or schema is introduced.

Validation: 48 focused checks pass across `save-feedback`, `save-safety`, `town-clock`, `title-preview-save`, `pocket-album-save`, `year-loop`, `resident-life-enhancements` and `runtime-package`. The production runtime build passes. Fourteen new checks exercise player-visible behaviour and write failures, including title import retry and exporting a live unsaved state. This is logic/DOM-fixture validation, not physical-device acceptance.

## A02/A03 - source fixes published; acceptance remains open

PR #229 was merged in main commit `a35a579d87a7463dd28a281cc9f9f771ea7f207c`, preserving A01. Its first successful WebKit workflow was `39170288260`; the bone-texture correction passed `39170930724`, and the combined main integration passed `39171587323`. The published source fingerprint is `f085c7585f47fc6c1f4bbc23d0cc250c77acbb22e6c169dfba52132395cab741`, matching the independently rebuilt local integration. Dependencies of the last published main manifest are retained.

The recorded result shows cleared room children and zero portal-cache bytes after exit, stable post-warm-up geometry counts and an indoor town clock advancing from minute 145 to 148 while a shore resident reaches home. Source review confirms that the fix retains the actual window outlook and live storefront occupants. Captures of the Sakura outlook and izakaya interior were inspected.

The first report's izakaya-exit textures increased from 471 to 474 across four cycles. The corrected owned-mascot lifecycle disposes cloned skeleton bone textures while preserving shared assets. The new WebKit report has exactly 1,410 geometries and 469 textures after every izakaya exit, across all four cycles, and no page errors. Its strict post-warm-up texture assertion passes. This resolves the measured leak in that scenario; it does not certify total memory, frame rate or physical Safari stability. Render-call/triangle values are accumulated diagnostics, not measured frames per second. Physical iPhone crash reproduction and sustained play remain unverified.

The audit's four legacy neighbourhood-access failures must also be reconciled with the intended compact-town routes before A03 closes. Do not remove assertions simply to make the suite green.

## Later order

A04: reconcile the actual published Linux binary with accepted web fixes. Linux 0.2.8 was published during this work, but its integration predates A01 and PR #229; do not claim it includes these later changes. A05: foliage and houseboat visual/camera defects. A06: complete the existing Sakura office T02 acceptance. A07: controls/readability. A08: one complete short visit using existing favours and memory. A09: domestic pilot, then one retained household per change. A10: individual stories and atmosphere refinements.

Do not begin T03 home decoration before T02's remaining acceptance gate closes. Do not add festivals, combat, districts or speculative empty dwellings as part of this programme.

## Handover discipline

For each stage record base/commit/PR, exact scope, code owners, reproductions, checks and results, inspected views, remaining limitations and the next action. Rebuild the runtime for source changes, retain dependencies of the last published manifest, and verify the actual published build. A successful build or a merged PR is not full play acceptance.

## Combined integration validation

The A01 and interior/resident sources were merged without replacing either source change. Generated runtime conflicts were resolved by rebuilding from the combined source, using the currently published main manifest for dependency retention. Combined regression coverage is 96 checks; the only initial failure was the sparse checkout omitting the two existing izakaya GLBs. After fetching those unchanged assets, the living-town suite passes. The production runtime and all three package checks pass. The combined local run includes the save-failure regressions alongside interior lifecycle checks; the WebKit workflow separately verifies the rendered resource and continuity behaviour. Physical-device and broader neighbourhood acceptance remain open.
