# Inputs: Higa Liquor closes into Sakura (22 October 2026)

- **Task (the owner, 22 October 2026, during the Nhung change):** "The sisters basically run commerce and healthcare on
  the island … maybe we don't need a liquor store, Sakura can sell liquor too." The owner's answers, recorded in
  `briefs/nhung-doctor/progress.md` (Queued):
  - Close Higa Liquor.
  - Sakura sells all alcohol over the counter, and supplies Minato, Sato Ramen and the Coral Bay Bar from its depot.
  - Kōji's round becomes Sakura Trading's delivery round.
  - Gran Higa keeps only the bathhouse.
  - The Higa Liquor building stands shut, a notice on the shutter saying liquor is at Sakura (no new geometry).
  - Then, the owner's finishing brief: "close Higa Liquor. Sakura sells and supplies all alcohol, Kōji's round becomes
    Sakura Trading's, and the building stands shut with a notice on it."
- **Output:** `johansson-town/src` (commerce, people, world, economy, feed, studio rules), the guide, the tests that
  state the old arrangement, a rebuilt runtime, this folder.
- **Scope limits:** no new buildings or geometry beyond the notice; no new people. Thuan's weekend, Sakura's Saturday
  closing and the doctor's day stay as they are.
- **Fixed evaluator:** the full `tests/*.test.mjs` run against the doctor branch's run (the baseline), then
  `node tools/ci-guard.mjs` alone after `npm run build:runtime`.
