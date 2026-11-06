# Save-consolidation regression check — 22 October 2026

## Scope and verified state

The owner requested merging PR #368, then the next outstanding handover fix.
Read the root instructions, World instructions, current handover index and its
21–22 October World and frozen-audit notes. The 21 October morning handoff lists
`consolidation.test.mjs` among the failing systems checks; the afternoon handoff
retains those groups as issue 10.

PR #368 is merged to main as `67856af51864165014f12299966065411b3eb381`, after
its GitHub guard passed. That commit is this work's base. No other open PR was
merged or changed. The selected save test still failed on that base because it
expected retired Reiko's saved location to survive the approved cast migration.

- Branch: `codex/consolidation-save-guard`.
- PR: [#369](https://github.com/nj22az/nj22az.github.io/pull/369).
- Implementation commit: `0ac026969b1e7643933403c2a624b81661d5b8e6`.
- State: merged to main as `97579cc0b4bfd4af3523e3ae0bf25d672643d82b` on the owner's instruction; no new Linux release published.

## Fix and acceptance

Corrected the obsolete expectation in `tests/consolidation.test.mjs`. The real
`readSave` path must merge old business visits, preserve inventory, quest/escort
progress and inspected content IDs, retain live Thao's location, move old Kenji's
record to Chin and drop retired Reiko. It must leave the original stored save
untouched and load a saved migration identically the second time.

Removed unused scene-building helpers and imports left in that test file. Added
the repaired test to `tests/ci-guard.txt`, taking the guard from 65 to 66 files.
No migration logic, production source, generated runtime, graphics, geometry or
existing player saves were modified. No runtime rebuild is needed.

## Checks actually run

- Before repair: the consolidation test failed at Reiko's location expectation;
  the seven related cast-migration checks passed.
- After repair: `node --test tests/consolidation.test.mjs tests/cast-migration.test.mjs`:
  **8 passed, 0 failed**.
- Three temporary result mutations were rejected: lost inventory, lost live Thao,
  and restored retired Reiko. Temporary files were removed.
- `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`:
  **350 passed, 0 failed; 66 files; 188 seconds**. The checked tree includes the
  frozen-audit repair now merged through #368.
- `git diff --check` and local handover Markdown links: passed.

No screenshots, physical-device acceptance, installed Linux acceptance or new
release are claimed. Other outstanding test groups were not recounted.

## Sign-off and next action

**Signed off by Codex — 2026-10-22T22:30:07+02:00 (Europe/Copenhagen): implementation and local
verification complete.** GitHub checks for #369 were still running when recorded;
no remote pass is claimed. The subsequent handover commit changes documentation only.

Next: inspect GitHub checks, then merge #369 only on the owner's instruction.
Keep the remaining afternoon-handoff issues open; two formerly failing files
have now been repaired across #368 and #369.


## Merge and remaining-work review — 2026-10-22T22:34:52+02:00

PR #369 was squash-merged on the owner's instruction after the
[GitHub guard](https://github.com/nj22az/nj22az.github.io/actions/runs/39849438531)
passed on final head `a9ab4dcfc5b335d4d84b84213606646b1bbef5b3`.
Merge: `97579cc0b4bfd4af3523e3ae0bf25d672643d82b`. Linux CI was still running at the merge;
no installed Linux or physical-controller acceptance is claimed.

The two selected test repairs (#368 and #369) are now on main. The guarded set
is 66 files; the local candidate passed 350 tests. This is not a claim that the
entire repository test suite passes. No full-suite recount was performed.

Verified open PRs relevant to the remaining World work:

| Work | Current state and next action |
| --- | --- |
| Withdraw current fighting | [#365](https://github.com/nj22az/nj22az.github.io/pull/365) implemented and open. Highest recovery priority: integrate against current main, verify, merge on owner approval, then package a new Linux version. |
| Sakura stockroom stair entrance | [#364](https://github.com/nj22az/nj22az.github.io/pull/364) implemented with comparisons; draft awaiting visual acceptance. |
| Doctor identity and controller settings repair | [#362](https://github.com/nj22az/nj22az.github.io/pull/362) implemented and open. Nhung's new role supersedes the old “choose a doctor” handover question. Controller hardware verification remains. |
| Higa Liquor closure into Sakura | [#363](https://github.com/nj22az/nj22az.github.io/pull/363) implemented and open, stacked on #362; integrate #362 first. Reconcile older shop/bench tasks with the closure. |
| Catalogue consistency | [#329](https://github.com/nj22az/nj22az.github.io/pull/329) remains open with its own tests; check current-base compatibility rather than duplicate the repair. |
| Ferry ownership/crew, Sakura facilities, relocated school and community kitchen | [#367](https://github.com/nj22az/nj22az.github.io/pull/367), alongside [#366](https://github.com/nj22az/nj22az.github.io/pull/366), is planning only. Site verification and implementation remain; no island walk, demolition or runtime role change established. |

Still outstanding in the source handovers: banner/pole and dock clearances,
quay/junction markings, residential/service-corner dressing and planting;
Community Hall dressing; clinic seating; fixed-pose NPC seat edges; older comic
seat metadata; Umi-no-yu's outdoor bench; police/terminal comic backdrops;
remaining Japanese signs, park canopy and tending routines; phone performance;
and other failing-test groups. The clinic/doctor and Higa items must be reconciled
with #362/#363 before further work.

The release list was checked: the latest published Linux version is still
`johansson-world-linux-v0.2.16`. A later accepted game change needs a new version;
do not overwrite that release. Studio identity/hand redesign also remains on
separate open branches; these test merges do not implement it.

Next recommended work: review and integrate #365 combat withdrawal, then the
visible recovery items. No other open PR was authorised for merge in this task.
This addendum changes documentation only; checked Markdown targets and preserved
the existing handover history.
