# Johansson World title screen · 11 October 2026

The title now previews the real world using the same scene, renderer and assets as play. Sakura, the shopping street, harbour and the active player's character remain visible around a compact warm panel. The primary action is Continue for an existing save or Start Exploring for a fresh player. Settings groups weather, random weather and installation; Studio retains its original `/avatar-creator/` destination.

The existing save picker and import workflow remain in use. Changing players reloads the preview so the runtime restores the selected slot. New Game confirms when progress exists and creates a separate player. Previewing never calls the progress writer. The shared shader preparation avoids an async renderer poll over disposed streaming materials.

## Before and after

The before captures use main revision `0a2306ad` on localhost, not an attached user screenshot. The baseline includes its localhost decorator. The final implementation incorporates the subsequent World/Studio update from `9183e52e`, including removal of that legacy entry and the new Studio handoff.

| View | Before | After |
| --- | --- | --- |
| 390 × 844 | [Before](before-390x844.png) | [After](after-390x844.png) |
| 1280 × 800 | [Before](before-1280x800.png) | [After](after-1280x800.png) |

Additional captures: [393 × 852](after-393x852.png), [430 × 932](after-430x932.png), [768 × 1024](after-768x1024.png), [1920 × 1080](after-1920x1080.png), [844 × 390 landscape](after-844x390.png), [320 × 568 short screen](after-320x568.png), [Continue](continue-390.png), [save management](save-picker-390.png), [playing after Continue](playing-390.png).

## Validation

Run `python3 tools/serve-audit.py --port 8767` from Johansson Town, then `node tools/title-screen-audit.mjs`. Override `TITLE_AUDIT_URL` or `TITLE_AUDIT_OUTPUT` when needed. The [browser report](report.json) records layout bounds and behavior checks.

The browser audit checks all six requested viewports plus landscape and a short screen, 44px targets, equal secondary controls, no horizontal scrolling, stable primary action during loading, fresh/existing player labels, save preservation, switching and import, New Game confirmation, keyboard focus and Continue, Guide history, Studio routing, weather, relevant installation and reduced motion. It also rejects browser exceptions and local request failures.

Chromium on macOS with touch emulation and DPR 1 was used. Hardware iPhone Safari safe-area/browser-chrome behavior has not been tested. No merge or deployment is part of this change.

Results:

- `npm run build`: passed; runtime artifacts and service-worker version regenerated. Existing large-chunk and classic-script bundling warnings remain.
- `npm test`: 1,183 passed, 5 skipped, one missing sparse-checkout dependency (`motor-90l/motor.js`). Restoring that folder and rerunning `tests/motor-bench.test.mjs` passed all 3 cases; no failing case remains.
- Final `boot.test.mjs`, `start-order.test.mjs`, and `title-preview-save.test.mjs`: all 3 passed.
- Save-safety/start-order/preview focused run: all 7 passed.
- After integrating the latest main: the 47 World/Studio feature checks and the 7 save-safety/start-order/preview checks passed.
- Browser acceptance: all 8 viewports and all behavior checks passed; 0 browser exceptions and 0 failed local requests.
