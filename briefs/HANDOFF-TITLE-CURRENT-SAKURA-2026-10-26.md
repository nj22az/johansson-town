# Current Sakura on the title screen — 26 October 2026

## Request and base

The owner: "Also remove the demo showcase from the title screen it's showing the old design of Sakura too make it show the current".
Direct main maintenance from `b1d35bb9dc55d3e44b7a8def239ea74e19ba49fe`, following the current root and World
instructions and the website capture handover. Sakura retains its upstairs office and rest room.

## Changes

- Removed the title's "Browser showcase · Download the offline Steam Deck edition" banner and its obsolete desktop
  text replacement. Existing Start, player, Guide and installation controls remain available.
- Replaced all four obsolete title fallback references with an exact copy of the verified current-game Sakura
  capture already used at `/assets/world/sakura-current.webp`. The local, content-hashed file is
  `assets/images/title/sakura-current-119667983af8.webp`; its provenance is in `current-capture.json` beside it.
  SHA-256: `119667983af80d566880cebfdc1d31437961b73b0816d48a39a85141a398d316`, 1600 × 1000 pixels.
  The Guide's opening image now uses the same current shop instead of the older street capture.
- Responsive cover cropping uses that actual game capture in either orientation. Night presentation adds a CSS tint;
  this is not a separately rendered night photograph. No AI generation or reconstruction was used. The already-current
  live town still replaces the fallback when the renderer is ready; no game camera or geometry changed.
- `npm run build:runtime` passed, updating the stylesheet hash and service-worker version. Compiled JavaScript is
  unchanged; the previous production runtime files were retained for existing open/cached sessions.

## Checks and limits

- Focused runtime-package, loading-progress, title-preview-save, save-feedback and resident-guide suites: **25/26 passed**.
  All title, runtime and save checks passed. The additional resident-portrait provenance assertion already fails on
  the base: recorded hash `d5bb532e802068149ea08e7e072d81132459f6c07ae5b05ce0b1ffab66b915ad`, computed source hash
  `77b120a82f3976e17f1969318c3babab4d48ab45b011b5560f0fbc7659157aa8`. Every listed source file and the manifest
  are unchanged against the base. This unguarded, unrelated portrait-refresh issue is not concealed or weakened.
- Exact image-copy hash and dimensions, local CSS image paths, removal of the banner/dangling element lookup,
  complete inline-script syntax and `git diff --check`: passed.
- Before-change desktop browser review confirmed the old title photograph. The available browser disables WebGL,
  so it cannot verify the live 3D title or gameplay. No physical phone, Safari or Steam Deck acceptance is claimed.
  The Linux installer is not repackaged by this website correction.

## Publication

The exact publication commit, hosted World guard, Pages run and live verification are recorded in this note's row in
the [root handover index](../../HANDOVER.md). That record supersedes the preparation state here. Before promotion,
compare the API-created tree with the locally staged tree; after deployment verify the page, stylesheet, service worker
and both new asset files byte-for-byte, then review the static title in the browser.

Next maintenance: refresh resident portraits from current avatar sources separately; make new title captures when
Sakura's actual approved architecture changes. Preserve the upper floor and use the real game assets.
