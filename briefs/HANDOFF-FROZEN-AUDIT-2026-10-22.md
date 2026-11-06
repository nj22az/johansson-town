# Frozen screenshot regression check — 22 October 2026

## Scope and repository state

The owner requested one outstanding handover fix and a sign-off. Selected the
`visual-audit-freeze` failure in the 21 October morning handoff's systems group,
carried forward as issue 10 in the 22 October afternoon handoff. Read those notes,
the intervening handoffs, root instructions and `johansson-town/AGENTS.md` first.
Verified main at `a0fb347ced9250b2e5a6210ba068bf595a7ca310` and the open PRs;
the selected file was still outside the guard and failed locally.

- Branch: `codex/frozen-audit-guard`.
- PR: [#368](https://github.com/nj22az/nj22az.github.io/pull/368).
- Implementation commit: `fc00962b7c8f33802b8085517bf1523772af2cb1`.
- Delivery: merged to main on the owner’s instruction, squash `67856af51864165014f12299966065411b3eb381`; no Linux package release performed by this task.

## Fix

The VM fixture failed at `ReferenceError: graphics is not defined` before its
frozen-render assertions. Added the production `graphicsProfile()` and the
current lighting/audit dependencies to the fixture. The real `setTime` and audit
`render` bodies still execute. Added finite sun-position and shadow-target
checks. Registered `visual-audit-freeze.test.mjs` in `tests/ci-guard.txt`, taking
the guard from 64 to 65 files.

This repairs test coverage; it does not establish a new gameplay animation bug.
No production source, generated runtime, graphics, geometry, schedules or saves
changed. No runtime rebuild is needed for this test-only change.

## Verification

- Before: 2 passed, 1 failed (`graphics` undefined).
- After: `node --test tests/visual-audit-freeze.test.mjs`: **3 passed, 0 failed**.
- Mutation check: a temporary test copy replaced frozen rendering's
  `setTime({updateHours:false})` with `setTime()`. The shutter assertion rejected
  that deliberate regression. The temporary file was removed.
- `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`: **349 passed, 0 failed; 65 files; 211 seconds**.
- `git diff --check`: passed.

No screenshots, GPU rendering, physical-device acceptance or Linux release
acceptance are claimed by these CPU fixture checks. Other known-failing test
groups were not rerun or recounted.

## Sign-off and next action

**Signed off by Codex — 2026-10-22T22:22:28+02:00 (Europe/Copenhagen): implementation and local verification complete.** GitHub guard and Linux checks were still running at this sign-off; neither is claimed passed here.

Next: inspect GitHub checks and merge PR #368
only on the owner's instruction, following the repository's merge rule. Keep
the remaining afternoon-handoff issues open; this resolves one test file only.

## Merge addendum — 2026-10-22T22:30:07+02:00

The owner instructed “Merge to main then fix next”. PR #368 was squash-merged
after the [GitHub guard](https://github.com/nj22az/nj22az.github.io/actions/runs/39848342531)
passed on final head `78ddd90be39d9fc223ed48c02c49c6b9470a6190`. Linux CI was
still running at the merge; no Linux acceptance result is claimed here. Main now
contains the repair. The next selected failure is covered by
[the save-consolidation handover](HANDOFF-SAVE-CONSOLIDATION-2026-10-22.md).
