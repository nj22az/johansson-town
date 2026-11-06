# Kissa Higa independent review — 30 October 2026

Unpublished work on `codex/kissa-higa-review`, based on `claude/great-sagan-mvc9bb` at `a7809833`.
Fix commit: `75a8e72bdc2e4324f724de4e00843ad01ed8db3e`. The draft targets the source branch, not `main`.
The [handover](../../../../briefs/HANDOFF-KISSA-HIGA-2026-10-30.md#codex-review--30-october-2026-unpublished)
records each original finding's fixed/open disposition and the additional atlas overlap.

## Reproducible checks

Run from `johansson-town/`. Chromium was supplied with `CHROMIUM_PATH` for the Kissa tools and
`TOWN_CHROMIUM_PATH` for backdrops. Node 24.22.1, Chromium 153, SwiftShader, Linux cloud session.

| Command | Result | Log / evidence |
| --- | --- | --- |
| `npm run build:runtime` | passed; `boot-DfkZ-ZpG.js`; source SHA-256 `116a61c368eaeb4b9d57762f1aed26e1c5581704f734b27057861acbe8610d3a` | [build-runtime.txt](build-runtime.txt) |
| `node --test tests/feed-storyteller.test.mjs tests/feed-seating.test.mjs tests/kissa-higa.test.mjs tests/higa-shop-collision.test.mjs tests/higa-liquor-laundry.test.mjs` | 51/51 | [focused-tests.txt](focused-tests.txt) |
| `node --test tests/feed-storyteller.test.mjs tests/feed-seating.test.mjs tests/runtime-package.test.mjs` | 16/16 after both captured flags enabled | [captured-runtime-tests.txt](captured-runtime-tests.txt) |
| `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs` | 482/482, 91 files, all green in 248 s | [ci-guard.txt](ci-guard.txt) |
| `node tools/kissa-higa-live.mjs docs/qa/kissa-higa/review-live` | passed, no page errors; actual running controllers in built game | [report.json](../review-live/report.json) |
| `node tools/kissa-higa-photos.mjs after` | ten static source-scene photos, models loaded, no page errors | [report.json](../after/report.json) |
| `node tools/render-feed-backdrops.mjs --source kissa-higa higa-liquor` | eight views, two thumbnails, eight depth maps and metadata, no page errors | [backdrops.txt](backdrops.txt) |
| `git diff --check` | clean | checked before commit |

The live clock is frozen between explicit simulation steps. These residents are not posed or teleported for the
photographs. Days 4 and 6 are Monday and Wednesday. Day 11 is the next Monday, rota week 1. All three show Tetsuo on
stool-2 at 08:20 and Mori on that stool at 08:35 with Tetsuo gone. Day 11 also shows Ms Uezu on chair-1. The closure
case holds the shutter and both colliders open with the player inside at 09:52, then closes after release at 09:57;
Grandmother Higa waits outside. The 19:41 baseline has Tetsuo on the old bench and Mac standing beside it.
Per-case JSON also records controller positions, seat keys and bone heights. Bone heights from different bodies are
not the same-body shoe measurements used for the 0.21–0.25 m cartoon-foot finding.

## Visual inspection

Every final colour photograph was opened at its original resolution before acceptance:

- **21 live photographs, 960 × 640:** the room, counter and table at 08:20 and 08:35 for each of Monday, Wednesday and
  rota-1 Monday (18); `closing-held-0952.jpg`, `closing-clear-0957.jpg`; `05-live-bench-baseline-1941.jpg`.
- **Ten static photographs, 900 × 600:** every numbered file in [`after/`](../after/). The old 06:52 shutter photo is
  replaced by `06-shutter-rising-0650.jpg`, at 06:50:04.5, halfway through the nine-second roll.
- **Eight backdrops, 1600 × 1200:** `kissa-higa-{wide,push,low,high}.webp` and
  `higa-liquor-{wide,push,low,high}.webp`, plus both 960 × 720 thumbnails, in
  [`assets/images/feed/`](../../../../assets/images/feed/). The morning reads as the coffee room; the evening shows the
  closed shutter, notice, bench, bicycle and empties. Both places were set `captured:true` only after this inspection.
  Their eight packed depth maps are 800 × 600 with nonconstant depth; `views.json` contains seat and camera metadata.

The table close-up frames Ms Uezu's body and seat; the cap top is outside that lens. No seat height was changed to
hide the hanging cartoon feet. The keeper is now visible beside the register; the board is beside the leaf and clear
of the bicycle and empties; the menu, hours and notice no longer paint over one another in the atlas.

The backdrop tool hides complete resident roots and re-samples the empty room's clock state. This matters: an earlier
rejected evening capture retained a hidden morning keeper as an occupant and left the shutter open; its camera also
looked past a large road sign. The final eight views replace that attempt. An earlier live run reached the three
resident cases but timed out during its extra evening case; the complete final run supplies the report here.

## Limits and next steps

Cartoon shoes remain about 0.21–0.25 m above the floor on chair-height seats across town. The owner decides that
proportion; heights are unchanged. The lunch garden half remains unbuilt and Yui's breakfast choice remains subject
to the owner. Public holidays have no dedicated layer.

No phone, iPad, physical device, touch control or hardware GPU was checked. No Linux package was rebuilt, no installed
Linux edition checked, no Studio sync performed and no public deployment requested or performed. No Meshy calls,
credits or new model assets; only the requested renders and evidence are added. Owner review precedes publication.

PR/commit record: [draft PR #404](https://github.com/nj22az/nj22az.github.io/pull/404), head `codex/kissa-higa-review`, base
`claude/great-sagan-mvc9bb`; fixes `75a8e72b`, evidence/runtime `50fee3d3748101a1d1591f5a0581dd90f112d370`.
Confirmed open, draft, conflict-free and unmerged. Hosted World guard was in progress at the 12:08 UTC read;
only the local 482/482 result is claimed green here. The following documentation commit records this link; no game
source, runtime or accepted photograph changes after validation. Re-check current hosted checks before any merge.
