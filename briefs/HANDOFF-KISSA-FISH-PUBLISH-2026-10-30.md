# Kissa Higa and fish-market publication — 30 October 2026

The owner said **“Push”** after being told that the reviewed café, fish-market rework and co-op sales counter were
pushed on their branches but were not on `main` or live. This is the publication authority for these changes.
It supersedes the earlier “awaiting the owner's word” status for this scope; the remaining design decisions below are
not silently resolved by publication.

[**Publication PR #407**](https://github.com/nj22az/nj22az.github.io/pull/407) **merged into `main` as
`1c4d6c33d5f0447676cb4edcb22a25480e6e1adc`** on the owner’s “Push”.
Prepared combined snapshot: `c86c9a0ff10cdc703f4c3c696f12ce0a678655d1`; the following documentation commit only records
this PR and its evidence pointer. Final pre-merge head: `089f1294fa36d175f9956ac9a951934bd439740c` (the deterministic
controller fixture correction). The merge tree exactly matched that tested head. Publication results follow below.

## Candidate and scope

- Publication branch: `codex/kissa-higa-publication`, from `main` at
  `37befc31db79e09ac2a1507663f80d6f0cc65ee3`.
- Reviewed branch: `codex/kissa-higa-review` at `c95ad9dd353e1ece88cd20781b9fe4a615ae81b6`.
  Its [draft PR #404](https://github.com/nj22az/nj22az.github.io/pull/404) keeps its original target,
  `claude/great-sagan-mvc9bb`; publication uses a separate PR into `main`.
- Fish market and sales counter: `58e6117004e17b87f05595560bb4d9302892b443`.
- Café build: `89d99d70`; review fixes: `75a8e72bdc2e4324f724de4e00843ad01ed8db3e`;
  reviewed runtime, captures and evidence: `50fee3d3748101a1d1591f5a0581dd90f112d370`.
- The main merge preserves the newer Pocket Camera work. The sole conflict was the handover index: resolved by keeping
  main's current entries and adding the café/market entries. `camera/` is byte-identical to current main.
- `johansson-town/src` and assets are byte-identical to the reviewed branch. The sole later test-fixture correction is
  described below; production input and gameplay code are unchanged. The runtime is rebuilt from that
  same World source, keeping the previous published main chunks for clients still finishing an old load.
- This publishes the fish market's co-op counter and its existing displays/dressing, plus Kissa Higa. It does not invent
  or change other town stalls, and does not create a Linux release or sync Studio.

## Checks and evidence

- Prior review's hosted [World guard run 41053209821](https://github.com/nj22az/nj22az.github.io/actions/runs/41053209821):
  **passed** on `c95ad9dd` (re-checked in this publication session).
- `npm run build:runtime`: **passed; `boot-DfkZ-ZpG.js`, source SHA-256 `116a61c368eaeb4b9d57762f1aed26e1c5581704f734b27057861acbe8610d3a`; 60 runtime files including the previous published main chunks**.
- `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`: **482/482, 91 files, all green in 261 s** on the combined candidate.
- Fish-market and runtime-package focused checks: **13/13 passed after the final retention rebuild**.
- All nine existing `docs/qa/fish-market/after/*.jpg` photographs were opened at original 900 × 600 resolution in this
  publication session. These are source-scene photographs, not a new running-game simulation. They read as the revised
  shed, sales counter with fish displayed on ice, wash corner, scale/bell and quay dressing.
- The prior café evidence remains applicable: all 21 live, ten static and eight backdrop views plus two thumbnails were
  inspected in the review. Monday day 4, Wednesday day 6 and rota-week-1 Monday day 11 passed the required 08:20/08:35
  seat checks and the occupied closing/release case, with no page errors. This publication merge does not change those
  source or asset bytes. The café live tool has not been rerun in this publication session.
- The guard followed the first combined build. The final rebuild changes only retention of the old main chunks;
  current source and bundle bytes are unchanged, and the 13 focused fish/runtime checks passed afterwards.
- Local build/guard/focused logs: [`docs/qa/kissa-higa/publication/`](../docs/qa/kissa-higa/publication/).
- Authored-file whitespace check (`git diff origin/main HEAD --check -- . ':!johansson-town/runtime'`): clean.
  Existing generated shader-string whitespace is preserved in the runtime.

## Verified publication

- **Live:** https://nj22az.github.io/johansson-town/ ; merge `1c4d6c33d5f0447676cb4edcb22a25480e6e1adc`, PR #407.
- Final PR [World guard 41083420592](https://github.com/nj22az/nj22az.github.io/actions/runs/41083420592):
  **482/482, 91 files, success in 359 s**. Log: `publication/hosted-world-guard.txt`.
- Post-merge [World guard 41084575777](https://github.com/nj22az/nj22az.github.io/actions/runs/41084575777): **success**.
- Post-merge [island tree review 41084575881](https://github.com/nj22az/nj22az.github.io/actions/runs/41084575881): **success**.
- [Pages deployment 41084570648](https://github.com/nj22az/nj22az.github.io/actions/runs/41084570648): **success** for that merge.
- **92/92 checked deployed files match the merge byte for byte**: changed source/assets/guide/entry points and current
  runtime dependencies. `publication/delivery.json` records every expected/observed SHA-256 and HTTP result.
- The deployed runtime source fingerprint is `116a61c368eaeb4b9d57762f1aed26e1c5581704f734b27057861acbe8610d3a`.
- Browser smoke: **passed**, Chromium 153/SwiftShader, 960 × 640, using a loopback mirror of verified deployed bytes.
  All **98 requested files (25,615,415 bytes)** were fetched from Pages over the configured, verified HTTPS connection
  and compared with the merge before serving. `mirror-requests.json` records them; all match, no failed requests.
  The café is open at 07:42 with four model instances loaded; the fish counter's wares are shown at 07:40 and hidden
  at 10:00 on Monday day 4. No page errors. `live-smoke.json` records the exact scope and state.
- Both new photographs, `live-cafe-0742.jpg` and `live-fish-counter-0740.jpg`, were inspected at their original 960 × 640
  resolution. They show the café in use and the co-op counter with its fish on ice. The earlier complete resident audit
  remains the evidence for the exact Monday/Wednesday/rota-week seat handovers and closing safety.
- **Direct live-origin browser verification was not completed.** Chromium first lacked the cloud proxy connection,
  then its certificate trust. Automatic approval review rejected a proposed persistent user NSS trust-store change
  because it would broaden trust beyond this one browser run. That change was not performed or retried. The verified
  public-byte mirror above was the safer alternative; its Python HTTPS fetches used the inherited certificate bundle.
- Hosted [Linux acceptance 41083420584](https://github.com/nj22az/nj22az.github.io/actions/runs/41083420584): controller/
  gameplay regressions, package build, facial visibility, controller recovery, native startup/disk saves and offline
  checks passed at the last step read; the full resident/controller acceptance was still running. It is **not claimed
  fully green** here, and no new public Linux release was made. `publication-pr-checks.json` records the last workflow state.
- This following documentation/evidence commit records publication and adds the two inspected captures and reports.
  It does not change World source, runtime, tests, game assets, the camera or the installed Linux edition.


## Publication CI finding: deterministic controller fixture

The first publication [World guard](https://github.com/nj22az/nj22az.github.io/actions/runs/41081356763) passed.
The extra [Linux regression job](https://github.com/nj22az/nj22az.github.io/actions/runs/41081356967) failed its input smoke:
“Unmapped Linux left stick moves the actual player”. Seven controlled opening diagnostics isolated the fish-auction
arrival; all six other sampled docks moved 0.34095 m in the same input sequence. The failure reproduces identically
on unchanged main `37befc31`: the player starts beside an occupied mark, finds a nearby standing point, and forward
movement stops after **0.0273095 m**. Static collision at the initial mark is clear; resident avoidance stops the step.
This is a nondeterministic test setup, not a café/fish-market controller regression.

`tests/controller-game.test.mjs` now requests the existing clear ferry opening explicitly and asserts the initial
`[-1.5, -72.7]` position. **Every existing stick, menu, pause/resume and 30/60/90 Hz assertion is retained unchanged.**
No controller, spawn, collision or other production code is changed. The corrected input smoke passes on both the
publication candidate and unchanged main (results/logs in the evidence folder). The fresh hosted check result is
recorded in the publication follow-up.

## Remaining limits and owner decisions

Seat heights are unchanged. Cartoon shoes still hang about 0.21–0.25 m on chair-height seats across town; that proportion
is the owner's decision. The weekday lunch half of Grandmother Higa's garden round remains unbuilt. Yui's counter
breakfast remains the original builder's choice, which the owner may reverse. Public holidays have no separate layer;
the money model remains closed. The fish counter's board is fixed, the damp band is not animated with washing, and
Kōji's dialogue/storyteller integration remains as recorded in the [fish-market handover](HANDOFF-FISH-MARKET-2026-10-30.md).

No Meshy calls, new credit spend, new model or new scene prop asset in this review/publication. Existing approved models
and the requested backdrop/evidence renders are included. No phone, iPad, physical device, touch control or hardware
GPU has been checked in the cloud session. No installed Linux acceptance or packaging was run locally; hosted checks
are reported separately when available. Studio is not synced.
