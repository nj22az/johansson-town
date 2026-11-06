# Fish-market board — 25 October 2026

Owner request: replace the floating fish-market price panels with the same kind of board as the harbour noticeboard.

Baseline: main `7c048393daaf614e242956cf3ee7b3f9bdc0f626`; existing noticeboard design and implementation handover read.
This is a small correction to the cartoon World, not the development/Pixar room replacement.

## Implemented

- Removed the separate, unsupported 1600 × 1000 backing and 1100 × 1500 price sign in the east-quay auction shed.
- Reused `buildHarbourNoticeboard` through an optional drawing specification/header texture. Its default harbour
  geometry, woodland poster, flyer and viewer remain unchanged.
- `src/world/auction-board.js` places the same green aluminium cabinet, glazed doors, hood, hardware and two 80 mm
  posts at X 28.9, Z -43.7, facing west. Both post grades equal the auction floor (apron + 100 mm), with 5 mm embedment.
- Prices remain Maguro ¥2,800, Gurukun ¥900, Irabuchā ¥1,200, Sēika ¥1,500. Right-hand notice states the existing
  auction description's hours. Both sheets occupy cut-outs in the backing, inside the glazing.
- Added a rotated 1550 × 260 mm walking/camera collider, height 2180 mm. Geometry assertions verify clearance from
  the catch and containment on the shed floor, both supports, sheet fit and no coplanar overlaps.
- Rebuilt the shipped runtime, manifest, HTML entry points and service-worker version.

## Validation and limits

- Focused noticeboard suite: 11/11 passed, including the new auction geometry check and retained harbour viewer tests.
- Runtime build completed successfully.
- Full World guard: 422/422 passed across 81 files (146 seconds), including no-z-fighting.
- Separate runtime-package suite: 4/4 passed; `git diff --check` passed.
- Screenshot check unavailable: no installed Chromium; Playwright's browser download failed with a truncated/invalid
  archive. No screenshot or physical iPad/Steam Deck acceptance is claimed.

## Delivery

Published to `main` as [`ef546ca6`](https://github.com/nj22az/nj22az.github.io/commit/ef546ca6b54ae1b0c0a82f7420a518263d2d434a) through the connected GitHub plugin after the owner explicitly instructed “@GitHub push to main”.
The remote tree `61247b259612bc8ad52e962c7ce3c7f8a1deeb5b` exactly matches the tested local candidate (local implementation `2d4a8006` plus approval notes). The command-line push lacked credentials; no force-push was used.

[Pages deployment](https://github.com/nj22az/nj22az.github.io/actions/runs/40168563690): in_progress at this handover update.
[Hosted World guard](https://github.com/nj22az/nj22az.github.io/actions/runs/40168564357) started; local guard passed 422/422.
No physical-device or screenshot acceptance is claimed. The Linux 0.2.20 package is immutable and does not contain this change; include it in a future release after normal package acceptance.
