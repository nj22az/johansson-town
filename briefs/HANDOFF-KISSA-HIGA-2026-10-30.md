# Kissa Higa in the shut Higa Liquor — handover, 30 October 2026

**Published, 30 October 2026:** on the owner’s **“Push”**, [PR #407](https://github.com/nj22az/nj22az.github.io/pull/407)
merged into main as `1c4d6c33d5f0447676cb4edcb22a25480e6e1adc`. Pages and source guard passed; 92/92 checked live files
match. Full check scope and limits are in [the publication handover](HANDOFF-KISSA-FISH-PUBLISH-2026-10-30.md).
Earlier unpublished/awaiting-owner statements below describe the earlier review stage.

Branch `claude/great-sagan-mvc9bb` (nj22az.github.io), on top of the fish-market rework
([its handover](HANDOFF-FISH-MARKET-2026-10-30.md)). **Not on `main`; not published.** Main deploys the site: publish
only on the owner's word. The task folder is [`higa-kissaten/`](higa-kissaten/progress.md) (`progress.md` the map, the
plan, the Meshy audit and what was built; `checks.md`; `sources/task.md` the owner's words).

## Codex review — 30 October 2026 (unpublished)

Current work is on **`codex/kissa-higa-review`**, branched from `claude/great-sagan-mvc9bb`. The base advanced by a
document-only independent-review note during this session; that note, `a78098332c48d933ee871ac784dda2ef95eb9cc2`, is
included. The fixes are **`75a8e72bdc2e4324f724de4e00843ad01ed8db3e`**. The runtime, accepted photographs and handover are
**`50fee3d3748101a1d1591f5a0581dd90f112d370`**. [**Draft PR #404**](https://github.com/nj22az/nj22az.github.io/pull/404) targets
**`claude/great-sagan-mvc9bb`**, from `codex/kissa-higa-review`, never `main`.
**Nothing has been merged or published; only the owner can authorise publication.**

The review read `89d99d7` independently, excluding generated runtime, `index.html`, `sw.js` and `resident-guide.js`.
The frame conversion (`x = 9.55 - local z`, `z = 8.4 + local x`, rotation −π/2), `yawFacing` signs, absolute-minute
hooks, Thursday day zero, weekday boundaries and supplies were checked. No conversion or yaw defect was found.
Regression tests now hold the frame, facings and fractional minute boundaries as well as the fixes below.

| Initial finding | Current disposition |
| --- | --- |
| 1. Tetsuo and Mori never come | **Fixed.** The actual street `residentPlan` reads the kissaten visit before home preparation. Sleep agrees: Tetsuo 23:00–07:00; Mori 09:00–15:00. Tetsuo's obsolete commuter shift now agrees with his authored 09:00 radio-bench day. Tests ask the actual street planner, not just `canonicalDay`; all three live cases pass. The front prompt names bodies actually present. |
| 2. A customer shut inside | **Fixed.** Occupancy of the room and threshold holds both shutter and door collider open. It includes the player and visible residents, excludes the upper floor, and restarts the normal nine-second close only after the last body clears. Grandmother Higa waits at the front, then resumes her bathhouse day. Tests cover re-entry, time seeks and day changes. Live: held at 09:52, closed after the player leaves, photographed at 09:57. |
| 3. Inside prompts through steel | **Fixed.** All six anchors are hidden while the actual frontage is impassable; stale callbacks recheck access before selling, seating or reading. Tested. |
| 4. Four-minute shutter | **Fixed.** `roll:.15`: nine real seconds at the default clock speed. Starts remain 06:50 and 09:44; the keeper's safety margins remain. Fractional-roll tests replace obsolete timing assertions, with dated explanations. |
| 5. Ganaha turns back home | **Fixed.** Breakfast ends at 08:00, directly into her laundry round. Tested. |
| 6. Story cast disagrees with shot | **Fixed.** Monday day 4, 07:42; regulars derive from `kissaPeopleAt(shot.time)`. The Mori-specific dozing line is removed. Tested. Both places now have accepted captures and `captured:true`. |
| 7. Whole-town replan | **Fixed.** Navigation caches are invalidated in both resident controllers. Only current positions, targets or paths near the changed entrance (12 m) restart; seated neighbours keep their seat, and stairs finish normally. Distant journeys and seated bodies are tested. The A-board's obstacle changes also invalidate local routes. |
| 8. Board, tubes, paper and text | **Fixed.** The board is put out and taken in at the keeper's shutter operations. Tubes follow her inside phase or actual occupancy. The paper translates with the slats and is cropped by the top box without shrinking. Opening/closing prompts no longer offer the rolled-away notice. Tests and refreshed stills hold these states. |
| 9. Shared-minute stool handover | **Fixed.** Tetsuo leaves at 08:25, Mori starts at 08:30; five clear minutes. Per-minute seat exclusivity and live 08:20/08:35 checks pass. |
| 10. Board, shelf, keeper | **Fixed.** Board at local (−1.55, 4.65), beside the leaf and clear of the empties and bicycle; shelf collider includes its uprights; keeper at local (−0.9, −1.15), visible beside the register and reachable on the 0.5 m navigation grid. Tested and photographed. |
| 11. Garden and Yui decisions | **Still open to the owner.** The weekday lunch half of the garden round is not built. Yui's counter breakfast remains the earlier builder's choice without a specific recommendation; the owner may reverse it. No additional decision is inferred here. |
| 12. Cartoon feet | **Reported, unchanged.** Chair-height cartoon seats across town leave shoes about 0.21–0.25 m off the floor. These are the same-body shoe measurements in the original checks, not a comparison of unlike foot bones. No seat height was changed. Rules and source comments no longer promise feet on the floor. |
| Additional independent finding: print atlas overlap | **Fixed.** The shutter notice's atlas region overlapped the menu/hours print. It now has its own unused rectangle. A pairwise atlas-bounds test reproduced the overlap and holds the separation. The refreshed notice, menu and hours photographs read. |

### Checks actually completed in this review

Cloud Linux, Node **24.22.1**, Chromium **153** with software WebGL (SwiftShader), no physical device. The existing
Japanese fallback font was installed in the capture environment only; no font or model was added to the game.

- `npm run build:runtime`: **passed**; entry `boot-DfkZ-ZpG.js`, source SHA-256
  `116a61c368eaeb4b9d57762f1aed26e1c5581704f734b27057861acbe8610d3a`.
- Final focused suite (feed storyteller/seating, Kissa Higa, Higa collisions and laundry): **51/51**.
- After enabling the accepted backdrops, feed storyteller/seating and runtime-package: **16/16**.
- Exact required full guard: **482/482, 91 files, all green in 248 s**.
- Built running game: `CHROMIUM_PATH=… node tools/kissa-higa-live.mjs docs/qa/kissa-higa/review-live`:
  **passed**, no page errors. Monday day 4 and Wednesday day 6: Tetsuo on `kissa-stool-2` at 08:20, Mori there at
  08:35, Tetsuo no longer seated. Rota week 1 Monday day 11: the same, plus Ms Uezu on `kissa-chair-1` at both times.
  These are the running controllers, not posed residents. The 09:52 occupancy hold keeps both collider minimum heights
  at 1000 and the visible shutter up; the 09:57 photograph shows it down after release. The evening baseline is 19:41:
  Tetsuo sits on the existing bench; Mac stands beside it in this run.
- Static source scene: `CHROMIUM_PATH=… node tools/kissa-higa-photos.mjs after`: **10 photographs**, models loaded,
  no page errors. This is the source town with cel/ink rendering and directly loaded props, not a resident simulation.
  The obsolete 06:52 rising-shutter photograph is replaced by 06:50:04.5, halfway through the new roll.
- Backdrops: `TOWN_CHROMIUM_PATH=… node tools/render-feed-backdrops.mjs --source kissa-higa higa-liquor`:
  **eight views**, two thumbnails and eight packed depth maps plus `views.json`; no page errors. The four morning and
  four evening colour views (1600 × 1200) and both thumbnails were inspected at full size before setting the flags.
  Depth maps are 800 × 600 with nonconstant packed depth. The evening camera is now beside the bench, clear of the
  road sign; capture hides whole resident roots and re-samples the empty room so a hidden keeper cannot hold it open.
- **Every final photograph was opened at its original resolution:** 21 live, 10 static, eight backdrop views, and both
  backdrop thumbnails. The live close-up of Ms Uezu frames the seat and body; the top of her cap is outside that lens.
  The hanging cartoon feet remain the explicit owner decision above.
- `git diff --check`: clean. No test was weakened. No Meshy call, credit spend, new model or new scene prop asset.

Hosted verification: at the 30 October 12:08 UTC read, [World guard run 41053053294](https://github.com/nj22az/nj22az.github.io/actions/runs/41053053294) on `50fee3d3` was **in progress**. The PR was confirmed draft, open, conflict-free and unmerged, with the correct base/head. Hosted CI is not claimed green; re-check the current PR head before any merge.

Logs, exact commands and evidence index: [`docs/qa/kissa-higa/review/`](../docs/qa/kissa-higa/review/README.md).
Resident JSON and photographs: [`review-live/`](../docs/qa/kissa-higa/review-live/).

Preliminary captures are not acceptance evidence: an early live run timed out after the three resident cases; an early
backdrop attempt stalled in continuous rendering; the next evening set had a hidden morning keeper holding the shutter
open and a road sign in front. The final complete runs above replace them. No green result is claimed for those
attempts.

**Not checked:** a phone, iPad, physical device, touch controls or hardware GPU in this cloud session; Linux packaging or
installed edition; Studio (`jojo`) sync; public Pages deployment (none requested or performed). The public-holiday layer
is still absent, the money model remains closed, and no Pixar Grandmother Higa was added. Next: owner reviews the draft,
settles the remaining decisions and asks for publication if desired; hardware/device checks remain outstanding.

## The owner's words

- 30 October: "Since the liquor store is closed maybe it can be replaced by one of the buildings maybe the cafe";
  Grandmother Higa to keep it in the mornings.
- "Use my credits on meshy audit where it would make the scene better."
- "I need you to work automatically can you work accordingly to your own recommendations pls audit yourself and decide
  from the audits and proceed."
- "Don't publish to main without my word."

## Commits

| Commit | What |
| --- | --- |
| `dda83ff` | The map of every place that said the shop was shut, the plan, Meshy's costs. |
| `cff7b18` | The Meshy audit: 105 credits, nine props tried, photographed beside code versions in the real shop. |
| `89d99d7` | Kissa Higa built. |
| `67e6629b` | Original build handover and photographs. |
| `a7809833` | Initial independent-review findings, included as the review base. |
| `75a8e72bdc2e4324f724de4e00843ad01ed8db3e` | Codex fixes and regression tests. |
| `50fee3d3748101a1d1591f5a0581dd90f112d370` | Final runtime, accepted backdrops, live/static evidence, logs and updated handover. |
| Following documentation commit in [draft PR #404](https://github.com/nj22az/nj22az.github.io/pull/404) | PR link and exact evidence commit recorded; game/build unchanged. |

## Original build description (`89d99d7`; timings below are historical)

The data is in `src/commerce/kissa-higa.js`; the ruling is in `johansson-town/AGENTS.md`, "Owner's decision — 30 October
2026".

- **Who and when.** 喫茶ひが, kept by Grandmother Higa. Open Monday to Friday, 07:00–09:30.
  - She is at the front from 06:45, and the shutter goes up 06:50–06:54.
  - She is behind the counter until 09:40.
  - Then she is out on the pavement while the shutter comes down (09:44–09:48), and goes up to the bath at 09:50.
  - The weekend has no kissaten: on Saturday she opens Johansson Mart at 08:45.
- **The menu.** The morning set, blend coffee and iced coffee, ¥300 each. **No alcohol**: the drink stays Sakura's.
- **Supplies.** Bread and milk are on Sakura's account, taken at its till at five the afternoon before, because Sakura is
  shut before nine. Beans, eggs and butter come with Sakura Trading's Monday order.
- **The regulars, from their own days.**
  - Yui has her breakfast at the counter before school; it replaces her breakfast at home.
  - Ms Ganaha, before she opens the laundry.
  - Tetsuo, on Monday, Wednesday and Friday.
  - Officer Mori, before he goes to sleep.
  - Ms Uezu, on her weeks off watch.
- **The room.**
  - The counter is the coffee counter. In front of it is a ledge at 0.74 m with three stools at 0.46 m (the izakaya's
    pairing); the ledge stops short of the register.
  - Two siphons, a kettle, the cup shelf, and the family kusu, kept.
  - A table for two with bentwood chairs.
  - The record player and her husband's 45s.
  - A green awning, an A-board, and a paper on the shutter that still sends the drink to Sakura.
- **Meshy models.** The record player, the chairs and the grinder are Meshy models, streamed in near the shop
  (`src/world/okinawa/kissa-higa-props.js`, `assets/models/kissaten/`, 512 px). If one fails to load, a code stand-in takes
  its place. Everything else is drawn in code.
- **The clock.** The front follows the kissaten's clock: shutter, doors, tubes, lamp flames, board and paper. When the
  way in opens or shuts, the neighbours search their routes again (`neighbours.js` `replan`, `game.js` `passagesChanged`).
- **The storyteller.** A morning place, `kissa-higa`; the bench is the evening place `higa-liquor` (both
  `captured:false`).
- **Her guide article** is rewritten.
- **Rules.** Root `CLAUDE.md` and `johansson-town/AGENTS.md` are updated.

## Original build checks (previous session)

Node 22, swiftshader; no GPU and no physical device.

- **Full CI guard** with CI's heap (`NODE_OPTIONS=--max-old-space-size=6144 node tools/ci-guard.mjs`): **473/473,
  91 files**, after the final change. A first run failed 472/473 on `no-z-fighting`, a test still asserting the shut
  front; it now scans the front open and shut.
- **The new test** `tests/kissa-higa.test.mjs` is in the guard. Six tests that stated the shut shop were updated with
  dated notes; none was weakened.
- **Static photographs:** `node tools/kissa-higa-photos.mjs after` → `docs/qa/kissa-higa/after/`, ten views, looked at.
- **Live game:** `node tools/kissa-higa-live.mjs` → `docs/qa/kissa-higa/live/`, at 07:42 on a Tuesday.
  - Grandmother Higa stands at her place behind the counter.
  - Yui and Ms Ganaha sit on stool-1 and stool-0.
  - The bench baseline was taken at 19:41.
- **Routes:** every route into the room arrives on the neighbours' 0.5 m grid with the doors open (a script run against
  the built town's solids).
- **Meshy:** 105 credits spent (2,753 → 2,648); `art/kissaten/meshy/provenance.json` holds every prompt, task id and
  verdict.

## Original build limits (current disposition above)

- **Cartoon residents' shoes hang 0.21–0.25 m** above the floor on every chair-height seat in town: 0.23 m on the 0.44 m
  benches, 0.25 m on these 0.46 m stools. It comes from the cartoon bodies' short legs. Their feet would only reach the
  floor at a 0.21 m seat. Not changed here: it is a town-wide question.
- Not checked live: Tetsuo, Officer Mori and Ms Uezu walking in (the Tuesday run has no Tetsuo, Mori comes from 08:30,
  Ms Uezu only on her weeks off). Their plans are covered by `kissa-higa.test.mjs`.
- The kissaten opens on public holidays (there is no holiday layer yet).
- The storyteller's backdrops are not captured yet.
- The Linux edition is not rebuilt, and Studio (`jojo`) is not synced.
- The town's money model is closed (22 October), so the kissaten's takings are not in it.
- No Pixar Grandmother Higa: the owner's 24 October plan builds heads from the owner's picture.

## Initial independent review (30 October 2026, night)

A separate reviewer read `89d99d7`. It confirmed these are right:
- the frame conversions, every yaw, the minute boundaries and weekdays, and the supply timing;
- every collider against what is drawn, and the clear doorway;
- that no test assertion was weakened.

It recorded the following at base `a7809833`. **Current fixed/open dispositions are in the Codex review above.** Item 1 was re-checked by the original reviewer.

1. **Blocker: Tetsuo and Officer Mori never come.**
   - Both are in the walking street cast, so the game plans them with `social.js` `residentPlan`, not `canonicalDay`.
   - There `homeRoutine` (`social.js` ~469) sends them home before `shopDayPlan` (~479) is read. `home-life.js` has Mori
     asleep 07:00–15:00 and Tetsuo asleep 02:20–10:20.
   - Re-checked: `residentPlan` gives both "sleeping at home" at 07:40–08:50 on a Monday, while `canonicalDay` says
     `kissa-higa`.
   - `kissaFront` (`quarters.js`) and the story place still name them, and `kissa-higa.test.mjs` passes because it asks
     `canonicalDay`.
   - Fix: put the kissaten visit ahead of `homeRoutine` and make their sleep hours agree, or pick regulars from the
     canonical neighbours. Have the front prompt name only bodies actually present. Test `residentPlan` for every regular.
2. **Blocker: the player can be shut inside.**
   - `game.js` `evictIfClosed` does nothing for this room, and nothing checks for the player when the shutter comes down.
   - Example: sit at the table at 09:40 and stand at 09:47. The player is walled in until 06:52 on the next weekday.
   - Fix: hold the shutter (and the doors' solid) while anyone is inside the room's rectangle, or move the player to
     `KISSA_KEEPER.front` with a line from her. Test it.
3. **The prompts inside work through the shut shutter.** Prompts reach 3.1 m with no line-of-sight check: "Sit at the
   table", the records and the jar can be reached from the pavement. Fix: show and allow them only while `kissaPassable`.
4. **The shutter rolls for 4 real minutes.** `roll:4` is in town minutes, and the default clock runs at real speed
   (speeds 1, 2 and 4). Nakamura's takes 0.15. Fix: a shorter roll, keeping the `out`/`shutterDown` margins.
5. **Ms Ganaha turns round in the street.** Her visit ends at 07:55, then her day sends her home before the laundry at
   08:00. Fix: `to:480`.
6. **The story place doesn't fit its shot.** Its shot is at 07:40 on a Thursday, but it lists Tetsuo and Mori, and
   "nodding off over the toast". Fix: regulars from `kissaPeopleAt(shot.time)`, with a test.
7. **`replan` reaches the whole town** (`neighbours.js` ~213).
   - Twice a weekday it clears the whole cache and resets every canonical neighbour: a stall risk on phones, and
     out-of-view walkers jump to their targets.
   - A resident seated on a stand-seat gets a path blocked by their own seat's collider.
   - The street cast's cache (`schedules.js` 93) is never cleared.
   - Fix: replan only those whose target is within about 12 m of the door, and skip anyone seated.
8. **Things that appear or vanish with nobody doing it.**
   - The A-board is out from 07:00 to 09:30, but nobody carries it.
   - The paper vanishes as soon as the roll starts.
   - The tubes are on while she is outside (06:50–06:54, 09:40–09:48).
   - The front prompt says "read the paper on the shutter" while the shutter is up (06:54–07:00, 09:30–09:48).
9. **Mori takes Tetsuo's stool in the same minute** (510). Leave about 5 minutes between them once item 1 is fixed.
10. **Small points.**
    - The A-board stands in front of the left door leaf (the way in narrows to about 1.4 m); move it beside the door.
    - The cup-shelf uprights stand 4 cm outside its collider.
    - In `live/02` Grandmother Higa is half hidden behind the register; a stand point near local x −0.9 shows her.
11. **Decisions.**
    - Decision 3 is half built (no lunch round).
    - Decision 4 (Yui at the counter) had no recommendation and was decided for the owner.
    - Both are now flagged in the task folder.
12. **The feet.** The live report's foot bones (0.33 m on the stools, 0.17 m on the bench) compare different bodies: the
    bench sitter was the Pixar Tetsuo. The same-body figure is from `tests/seating-contact.mjs` `shoeHeight`: Miss Higa
    0.231 m at 0.44 and 0.251 m at 0.46. The AGENTS.md line that said "seated feet reach the floor" is corrected.

## Next

1. Review the draft into `claude/great-sagan-mvc9bb` and the evidence above; no merge has been performed.
2. Owner decisions: the cartoon foot gap, the unbuilt lunch garden round, and Yui's counter breakfast.
3. Phone, touch and hardware-GPU checks remain outstanding.
4. Publication to `main` only on the owner's explicit word, with its build, guard and Pages checks then.

## Original continuation prompt (historical; this review uses `codex/kissa-higa-review`)

```text
Continue the Johansson World work on branch claude/great-sagan-mvc9bb in nj22az/nj22az.github.io. Work on a branch of
your own made from it (codex/kissa-higa-fixes) and open a draft PR into claude/great-sagan-mvc9bb, not into main. Do not
merge or push to main: main deploys the site, and the owner publishes only on their own word.

Read first, in order: HANDOVER.md; AGENTS.md (the handover rules); johansson-town/AGENTS.md (above all "Owner's
decision — 30 October 2026: Kissa Higa in the shut Higa Liquor"); johansson-town/briefs/HANDOFF-KISSA-HIGA-2026-10-30.md,
especially "Independent review: findings to fix"; johansson-town/briefs/higa-kissaten/progress.md and checks.md. The
owner's rules in the root CLAUDE.md hold: no glitches, clipping, floating or unnatural behaviour; nothing random (every
item has a who, a why and a where); tests may be updated for a decided change, never weakened.

Kissa Higa (src/commerce/kissa-higa.js) is built in commit 89d99d7; the CI guard is at 473/473. An independent review
found problems that are not fixed. Do this, in order, each fix with a test where a test can hold it:

1. Blocker: Tetsuo and Officer Mori are street-cast walkers planned by src/people/social.js residentPlan, where
   homeRoutine (home-life.js sleep hours) sends them home before shopDayPlan is read, so they never come to the kissaten.
   Make the kissaten visit win in residentPlan (and make their home-life sleep hours agree with it), or replace them with
   canonical neighbours, as their days make sense. Add a test that asks residentPlan for every street-cast regular. Make
   quarters.js kissaFront name only people actually there.
2. Blocker: the player can be shut inside (stand up after 09:46; game.js evictIfClosed does nothing for this room). Hold
   the shutter and the door solid while the player or anyone is inside the room, or move them out to KISSA_KEEPER.front
   with a line from Grandmother Higa. Test it.
3. The inside prompts (order, the table, the records, the jar in quarters.js higaPrompts) only while kissaPassable.
4. The shutter's roll: KISSA.roll is 4 town minutes, which is 4 real minutes at the default speed. Make it short (Nakamura's
   is 0.15) and keep the margins: she is out before it comes down.
5. Ms Ganaha's visit to:480, so she goes straight to the laundry. Leave about 5 minutes between Tetsuo leaving stool-2 and
   Officer Mori taking it.
6. The story place kissa-higa (src/feed/places.js): its regulars and doings from who is really there at its shot time
   (kissaPeopleAt), with a test.
7. neighbours.js replan: only residents whose target is near the kissaten's door (about 12 m), and never someone seated;
   check the street cast's route cache in schedules.js too.
8. Nothing appears or vanishes with nobody doing it: the A-board carried out and in by Grandmother Higa (or set out when
   she lifts the shutter and taken in when she pulls it down), the tubes on only while she is inside, the paper rolling
   with the shutter, the front prompt's text matching the shutter's state. Move the A-board beside the door, not in front
   of a leaf; widen the cup-shelf collider to its uprights; move her stand point so the register does not hide her
   (about local x -0.9), checking it stays clear of solids and reachable on the neighbours' 0.5 m grid.
9. Check it all in the running game with tools/kissa-higa-live.mjs (from johansson-town/; change its times or add runs):
   a Monday at 07:45 and 08:40 (town day 4), a Wednesday (day 6), a rota-week-1 Monday (day 11) for Ms Uezu at chair-1,
   and the shutter coming down at 09:44 with the player sitting at the table. Look at every photograph at full size.
   Re-shoot the static photos with tools/kissa-higa-photos.mjs after.
10. Do not change seat heights for the cartoon residents' hanging feet (0.21-0.25 m on every chair-height seat in town;
    the owner's call). Do not spend Meshy credits or add new assets without the owner's word.

Before you finish: npm run build:runtime (from johansson-town/); NODE_OPTIONS=--max-old-space-size=6144 node
tools/ci-guard.mjs, all green; update the handover note (mark each review item fixed or not, with how) and HANDOVER.md,
with the commits, the checks you actually ran and their results, and what is still open. Say plainly what you did not
check (no phone, no physical device in a cloud session).
```
