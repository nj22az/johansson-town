# Johansson conversation eyes — 24 October 2026

Owner authorisation: **"Push to main if it works."**

## Delivery and provenance

Signed off for the owner-authorised direct push to `main`, after the complete validation below. The final delivery preserves the tested source, runtime and tests byte-for-byte; its only changes from the validated candidate are this final handover and removal of the temporary branch-only validation workflow. No permanent workflow or unrelated feature is added.

- Original main: `aee7515f53817cb743c820607baf2e8c6d6a27ab`.
- Validation branch: `chatgpt/conversation-eyes-validation-20261024`.
- Validation setup: `a62fad74052a4b6eb8438a72e5d1a465ea6d199e`.
- Tested source/runtime commit: `6c4f6a44b63566fd87ebcedb8cf770753b0f4930`.
- Final sign-off/promotion commit: the commit introducing this revision of the note, a direct child of the tested commit. Main must be advanced without force and only if it still points to the original main above.
- [Completed validation run](https://github.com/nj22az/nj22az.github.io/actions/runs/40073107742), job `120810614116`; artifact `conversation-eyes-validation`, ID `12551983409`.

The root `HANDOVER.md` links to this note. No pull request is required by the owner's explicit direct-push instruction. Repository promotion and Pages deployment are separate from the pre-push tests recorded here: verify the actual main ref and deployment run before claiming the website is live. No new downloadable Linux release is included.

## Change

Only the player gesture mapping `Nod: content` becomes `Nod: smile` in `src/avatars/actors.js`. Conversation entry already uses Nod. Its former content expression deliberately draws closed eyes. The existing smile leaves the eyes open except for ordinary blinks. The change fixes the repeated greeting closure; it does not assert that every reported instance of closed eyes in an arbitrary long conversation has been reproduced.

No face artwork, nod motion, gesture duration, speaking, sleeping, other expressions, appearance recipes or saves changed. Added four regression tests using the real shared avatar geometry, player controller and animator; only the Node DOM/canvas uses the existing repository fixture. The suite is registered in the full World guard. Runtime, index, manifest and service-worker outputs were rebuilt **once**, with the existing builder retaining the preceding published graph for cached pages.

## Checks actually completed

- The new greeting test failed on unchanged source with `GREETING_EYES_REGRESSION`: actual `content`, expected `smile`.
- **4/4 actual-controller tests passed** after the fix: greeting, repeated greeting/expiry, speech and natural blink reopening, and authored closed-eye gestures/sleep.
- `npm run build:runtime` passed; 628 modules transformed. Existing large-chunk warnings were not suppressed.
- **4/4 runtime-package tests passed**, including source fingerprint, local hashed dependencies, stylesheet hashes and continued combat withdrawal.
- **Full World guard: 381/381 passed, 72 files, zero failures/skips/todos**, in 235 seconds. No test, tolerance or baseline was weakened.
- **Built-game software Chromium smoke: all six steps passed**, including START/play, street rendering, Community Hall entry and room rendering, with **zero page errors**. The 390 × 844 street and room captures and JSON report were downloaded and inspected. This is the built runtime, not source-mode startup.
- Changed-path scope and handwritten whitespace checks passed. Review confirmed the only game-source change is the single nod-expression mapping; other implementation changes are generated runtime files, tests and handover records.

Environment: GitHub-hosted Ubuntu 24.04, Node 24.21.0, Chromium 149.0.7827.55 with SwiftShader. The 6144 MB Node heap setting is for the test runner, not a game graphics change. Complete logs, before/after results, screenshots and report are in the linked validation run/artifact.

## Remaining verification limits

The full-game smoke covers startup and room entry, **not a photographed dialogue interaction**. The controller tests exercise the greeting directly. Physical iPhone/iPad Safari, Steam Deck, hardware performance and a newly packaged Linux installer remain untested/unreleased by this task.

After promotion, verify the new main head and Pages status separately; ordinary main CI also reruns automatically. Keep the four regression checks in the guard. A future Linux release will pick up the shared-source correction through its normal build process.
