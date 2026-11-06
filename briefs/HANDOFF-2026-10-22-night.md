# Handoff, 22 October 2026 (night)

Read first: `CLAUDE.md`, `AGENTS.md`, `johansson-town/AGENTS.md` (its two newest decisions: "Nhung is the island
doctor" and "Higa Liquor closes into Sakura", and the short one on the money model at the end), then the two task folders
below. This note says where the day's work stands and what the owner decided last.

## The two PRs: merged (the owner, 23 October: "Merge")

| PR | What | How it reached main |
|---|---|---|
| [#363](https://github.com/nj22az/nj22az.github.io/pull/363) | Higa Liquor closes into Sakura: Sakura sells and supplies all the drink, Kōji's round is Sakura Trading's, the shop stands shut with a notice on its shutter | Merged into #362's branch `claude/clever-ride-qdpo8s` (merge commit `41fed9ec`) |
| [#362](https://github.com/nj22az/nj22az.github.io/pull/362) | Nhung becomes the island doctor (Dr Kakazu retired into her; Front-Row's trade is Sakura's; Sakura shuts on Saturdays), and the Linux controller fix `84baf00` as its own commit | `main` merged into the branch (48 commits since the PRs opened: comics, looks, the combat withdrawal, Linux 0.2.17), the runtime rebuilt once from main's, then squash-merged to `main` with #363 inside it |

Why one deploy: each runtime build keeps the previous build's chunks and prunes older ones, so two builds landing on
main back to back would drop the chunks of the build players have loaded now. Merging #363 into #362's branch first
gave one build on top of main's.

**Linux:** 0.2.17 was published from main on 22 October without the controller fix (`HANDOVER-LINUX-JOYSTICK-2026-10-22.md`,
release update). The fix is on main now and ships in the next Linux release, 0.2.18 or later; still unconfirmed on hardware.

The work, the checks and the reviews: `briefs/nhung-doctor/` and `briefs/higa-liquor-closes/` (each has `progress.md`,
`checks.md`, `sources/task.md`). The before/after sheets were sent to the owner in the session and are not committed.

## Checks actually run (this container: Node 22, 4 cores; CI is Node 24)
- Full `tests/*.test.mjs`: base `84baf00` 2,102 tests, 54 failing; #362 52 failing, none new. #363's full run had two
  new against #362: the runtime (then rebuilt; `boot` and `runtime-package` pass) and `east-lawn` (then updated to state
  the shut shop, whose floor is a closed room behind the shutter; it passes). The full suite was not run again after
  those two.
- `node tools/ci-guard.mjs` alone after `npm run build:runtime` (once, last), on each branch: 333 of 334, the one
  `no-z-fighting` out of memory on this container's heap as on the base; it passes with `--max-old-space-size=10240`.
  On GitHub both guards pass in full.
- A separate code review of each change; their findings fixed, the rest reported in the task folders.
- On the merge (23 October; #363 inside, main merged in, the runtime rebuilt once on main's): full `tests/*.test.mjs`
  2,115 tests, 50 failing; against the Higa branch's run the one new failure is `resident-guide` ("Portraits must be
  regenerated after avatar source changes"), which fails on `main` itself: main changed `src/render/cel.js` (the looks
  work) without regenerating the portraits. `node tools/ci-guard.mjs` alone: 70 files, 359 of 360, `no-z-fighting` out
  of memory here and 13 of 13 with `--max-old-space-size=10240`. GitHub's guard passed on the merge.
- Not run: anything on a physical device (the controller fix is still unconfirmed on hardware; see
  `HANDOVER-LINUX-JOYSTICK-2026-10-22.md`).

## The owner's last word (22 October, night)
"Make a new handover note, close the money model for now, we need to simplify background processes."

- **The money model is closed for now.** `src/economy/town-economy.js` (the year-by-day simulation of households,
  shops, the ferry's orders and the bars) is not extended or wired into anything; the open issue that it does not know
  Sakura's Saturday closing is closed with it. Facts for whoever reopens it: no game code runs it (no import outside
  `src/economy/`); only `tests/town-economy.test.mjs` does (not in the CI guard), and the studio's product findings name
  it. `economy/goods.js` stays in use (`commerce/konbini.js` reads its landed costs for Sakura's bottles). Recorded in
  `johansson-town/AGENTS.md` (not in the file itself: a comment there changes the runtime's source fingerprint, and a
  second runtime build would prune #362's chunks).
- **Next: simplify background processes.** Closing the model removes nothing that runs, because it never ran. What
  does run in the background is listed by `src/edition.js` per edition. The Linux edition has everything on:
  `residentsEverywhere`, `neighbourChats`, `conversations`, `trade` (Sakura's stock per facing, orders, deliveries, the
  till and the day's settlement: `people/shop-retail.js`, `commerce/sakura-economy.js`, `commerce/shop-ledger.js`),
  `machinery`, `countedMoney`, `liveDocuments` and `pouring`. The web edition (the live site) has them off and walks
  only the residents within `residentRadius` (45 m). Which of these to switch off or cut is the owner's to choose; ask
  before changing any flag, since each changes what the player sees.

## Open on main (not from this work)
- `tests/resident-guide.test.mjs` fails on main: the portraits' fingerprint (`guide/portraits.json`) includes
  `src/render/cel.js`, which the looks work changed without re-rendering. Regenerate with
  `node tools/render-resident-guide.mjs` (and the shoot) when the looks settle, and look at the portraits.

## Open for the owner
- The sisters' jan-ken-pon has no day now (`tests/sisters.test.mjs` reports it as a todo).
- Saturdays, with Sakura shut: the bench's regulars buy Saturday's bottle on Friday. Keep?
- Which background processes to simplify (above).
- Smaller, in the task folders: the walking Kōji keeps to the ice plant between the depot and the crate yard; the
  Higa feed backdrop is still to be captured; the shut shop's upstairs windows glow at dusk with the rest of the quarter.

## Session housekeeping
- Both PRs were merged on the owner's word; the session's subscriptions end with them, and no check-ins are pending.
- The worktrees it used are in its scratchpad and go with the container; nothing in them is unpushed.
