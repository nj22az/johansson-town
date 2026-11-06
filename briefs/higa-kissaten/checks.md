# Checks: a kissaten in the shut Higa Liquor

Run in the cloud session of 30 October 2026 (Node 22.22). Nothing in the game was changed, so no game tests were run.

| Check | Command | Result |
| --- | --- | --- |
| The Meshy key is in the environment | a shell test that it is non-empty (the value never printed) | set |
| Meshy's CLI and its API origin | `npm exec --yes --package=meshy-cli@0.4.0 -- meshy doctor …` | CLI 0.4.0; credential from the environment; `api.meshy.ai` |
| The key works (one free call) | `meshy balance --output-schema v1 --format json` | ok, 2,753 credits |
| What a model costs (calls nothing) | `meshy make "…" --dry-run`, a prompt and an image URL | text: preview 20 + refine 10 = 30; image, textured: 30 |
| Every other price | <https://docs.meshy.ai/en/api/pricing>, read 30 October 2026 | table in `progress.md` |
| The map | `git grep -i -E "higa[ -_]?liquor|higaLiquor|higa-saketen|比嘉酒店"` (127 files), then the shut shop in other words ("liquor shop", "keeps only the bath", "the shut shop", 酒屋), the guide, the town papers, the CI guard list, and the studio repo `jojo` | `progress.md`, sections A–D |
| The cast's mornings | a script calling `canonicalDay` for every resident, 06:30–10:00 each half hour, on a Monday, a Saturday and a Sunday | free and near: Tetsuo, Officer Mori, Ms Ganaha, Ms Uezu on her weeks off; Grandmother Higa at Johansson Mart from 09:00 on Saturdays |

## The Meshy audit (later the same day)

| Check | Command | Result |
| --- | --- | --- |
| Nine shapes, judged on Meshy's free preview renders before colour was paid for | `meshy text-to-3d create` (smart topology, `meshy-t2.5`), `wait`, `download --asset thumbnail.primary` | 6 kept, 3 rejected (siphon, morning set, fortune machine) |
| Six coloured | `meshy text-to-3d create --mode refine` (`enable_pbr false`, 2k) | all SUCCEEDED; 1,548–3,100 triangles, one 2048 px colour map each |
| Credits | `consumed_credits` on each task, and `meshy balance` before and after | 9 × 5 + 6 × 10 = 105; 2,753 → 2,648 |
| The models load and render in World | `node tools/kissaten-meshy-look.mjs docs/qa/kissaten-meshy` (Chromium, swiftshader, the real town, cel and ink) | 8 photographs, no page errors; looked at, every pair |
| Side by side | the tool's photographs laid in pairs with Python (PIL), Meshy left, code right | `docs/qa/kissaten-meshy/pair-*.jpg` |
| Shrunk to 1024 px | `python3 tools/shrink-glb-textures.py` | 1.8–2.6 MB → 190–280 KB each; photographed again from the shrunk files, the same look |

The first photographs set the counter props 8 cm into the counter: the harness had the counter top at 0.95 m, but the
fitted interior stands on the 8 cm shop floor (`houses.js` 197). Corrected to floor + 0.95 and photographed again.

Not done: no build into the game, no CI guard run (no game code changed), no phone or real-GPU look.

## The build (30 October 2026, evening)

| Check | Command | Result |
| --- | --- | --- |
| The tests around the change | `node --test` on 32 files (the Higa, seats, cast, merchandising, feed, routes, neighbours tests) | the tests stating the shut shop failed as the map said; updated with dated notes, none weakened |
| The new test | `node --test tests/kissa-higa.test.mjs` | 9/9 |
| English | `node --test tests/english-language.test.mjs` | 1/1 (the kissaten's data listed as scenery: its Japanese is on the sign, the paper and the menu) |
| Z-fighting, open and shut | `node --test --test-name-pattern="Kissa Higa and the coin laundry" tests/no-z-fighting.test.mjs` | 1/1 at 07:40, 14:00 and 22:00 |
| Full CI guard, CI's heap | `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs` | first 472/473 (`no-z-fighting` still asserting the shut front; fixed), then **473/473, 91 files, 364 s** |
| Guide portraits | `TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/render-resident-guide.mjs` | 25 rendered; only Mr Fujita's image changed, and it caught him mid-blink, so the old image was kept (the fingerprint covers source files, not images) |
| Runtime | `npm run build:runtime` | built; boot `boot-BK2UaaMs.js` |
| Static photographs | `node tools/kissa-higa-photos.mjs after` | ten views, looked at; re-shot after the last fixes |
| Live game | `node tools/kissa-higa-live.mjs` | Tuesday 07:42: Grandmother Higa at her place, Yui on stool-1, Ms Ganaha on stool-0; the bench baseline at 19:41 |
| Routes into the room | a script: `createNavigation(blocked,{step:.5})` on the built town's solids at 07:40 | all seven targets arrive (the keeper, her front, three stools' and two chairs' stand points) |
| Seated shoes | a script with `tests/seating-contact.mjs` `shoeHeight` | Miss Higa 0.231 m at 0.44, 0.251 m at 0.46; Officer Mori 0.209 / 0.229 m: the town's cartoon bodies hang their feet on every chair-height seat |

Not done: a phone or a real GPU, physical devices, the Linux edition, the storyteller's backdrops; and the independent
review, still running at handover.

## Codex review (30 October 2026; Node 24.22.1, Chromium 153, SwiftShader)

| Check | Command / evidence | Result |
| --- | --- | --- |
| Focused schedules, feed, collision and frontage regressions | `node --test tests/feed-storyteller.test.mjs tests/feed-seating.test.mjs tests/kissa-higa.test.mjs tests/higa-shop-collision.test.mjs tests/higa-liquor-laundry.test.mjs` | **51/51** |
| Accepted places and final runtime | `node --test tests/feed-storyteller.test.mjs tests/feed-seating.test.mjs tests/runtime-package.test.mjs` | **16/16** |
| Runtime | `npm run build:runtime` | **passed**, `boot-DfkZ-ZpG.js`; source SHA-256 `116a61c368eaeb4b9d57762f1aed26e1c5581704f734b27057861acbe8610d3a` |
| Full CI guard | `NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs` | **482/482, 91 files, all green in 248 s** |
| Built live residents | `CHROMIUM_PATH=… node tools/kissa-higa-live.mjs docs/qa/kissa-higa/review-live` | **passed**: days 4, 6 and 11, Tetsuo stool-2 at 08:20 then Mori at 08:35; Ms Uezu chair-1 on day 11; no page errors |
| Closing with a customer | same live run; `review-live/report.json`, `closing-held-0952.jpg`, `closing-clear-0957.jpg` | **passed**: shutter up, both solids passable while occupied; keeper waits outside; closes after release |
| Refreshed static photographs | `CHROMIUM_PATH=… node tools/kissa-higa-photos.mjs after` | ten, existing models loaded; no page errors; source scene, no residents |
| Storyteller backdrops | `TOWN_CHROMIUM_PATH=… node tools/render-feed-backdrops.mjs --source kissa-higa higa-liquor` | eight views, two thumbnails, eight depth maps and seat metadata; final empty-set open/shut assertions pass, no page errors; both flags true after inspection |
| Visual inspection | each final file opened at original resolution | all 21 live and ten static photographs, eight 1600×1200 backdrop views, both thumbnails inspected; accepted for their stated scope; cartoon feet unchanged |
| Whitespace | `git diff --check` | clean |

Fixes: `75a8e72b`, on `codex/kissa-higa-review`, intended draft target `claude/great-sagan-mvc9bb`; no merge to main.
Logs and evidence index: [`docs/qa/kissa-higa/review/`](../../docs/qa/kissa-higa/review/README.md).
No Meshy calls or credit spend. No phone/iPad, physical device, hardware GPU, touch-control check, Linux packaging,
Studio sync or public deployment. The original sessions and their historical results above are preserved.

PR/commit record: [draft PR #404](https://github.com/nj22az/nj22az.github.io/pull/404), head `codex/kissa-higa-review`, base
`claude/great-sagan-mvc9bb`; fixes `75a8e72b`, evidence/runtime `50fee3d3748101a1d1591f5a0581dd90f112d370`.
Confirmed open, draft, conflict-free and unmerged. Hosted World guard was in progress at the 12:08 UTC read;
only the local 482/482 result is claimed green here. The following documentation commit records this link; no game
source, runtime or accepted photograph changes after validation. Re-check current hosted checks before any merge.

## Owner-authorised publication — 30 October 2026

The owner said “Push” after the branch-only status was explained. Publication now combines the reviewed café and the
fish-market/co-op-counter work with current main. [The publication handover](../HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md)
is the current source for the candidate, exact checks, merge and live-delivery verification. The earlier unpublished
state above is historical. The foot-gap/garden/Yui decisions and physical-device limits remain open.

### Published and verified

[PR #407](https://github.com/nj22az/nj22az.github.io/pull/407) merged into main as
`1c4d6c33d5f0447676cb4edcb22a25480e6e1adc` on the owner’s “Push”. Final PR World guard 482/482; post-merge World guard,
island review and Pages passed. 92/92 checked deployed files match; verified public-byte mirror smoke passes, 98/98
requested files matched and both new captures inspected at full size. The direct live-origin browser check was not
completed: automatic review rejected the persistent certificate trust-store change, and the verified mirror was used.
The pre-existing controller fixture failure reproduces on unchanged main; the clear ferry fixture retains every
original assertion and adds a starting-position assertion. The hosted Linux workflow’s earlier acceptance stages pass;
its full resident/controller acceptance was still running at the last check. No new public Linux package, physical
device check, Meshy spend or Studio sync. See [the current publication handover](../HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md)
for exact runs, logs, remaining decisions and scope.
