# Handoff, 22 October 2026 (afternoon)

Read first: `CLAUDE.md`, `AGENTS.md`, `johansson-town/AGENTS.md`, then `HANDOFF-2026-10-22.md` (this morning's) and the
two of 21 October it points to (the morning one has the working recipe). This note says what was done since.

## Owner direction — 23 October 2026: Minato comes first

The owner: “I want Minato to feel like a little paradise that you wish were real.”

**Priority 1 is making Minato impeccable and immersive.** The third city island is low priority and deferred;
retain its research and proposal for later. Do not begin further city design, prototyping or implementation
unless the owner explicitly reprioritises it. This supersedes the city proposal's earlier next-step recommendation.

The guiding experience is a small, believable paradise where someone would want to spend an ordinary day.
Apply this direction to the existing island:

- **Beautiful places:** shaded lanes, flowering gardens, clear water, inviting shopfronts and warm evening windows,
  consistent with Minato's 1997 Okinawan setting and established cartoon style.
- **A reassuring daily rhythm:** shops opening, deliveries arriving, neighbours greeting one another and the ferry
  sounding across the harbour. Residents have credible work, breaks, meals and journeys home.
- **Comfortable places to linger:** a favourite café seat, the onsen, a harbour bench and quiet rooms overlooking
  the sea. Sitting, ordering, drinking and watching the town should feel complete and dependable.
- **People worth knowing:** recognisable habits, friendships, small troubles and gentle humour. Their ordinary
  activities should make the island feel inhabited throughout the day.
- **Care in every detail:** convincing proportions, coherent interiors and exteriors, natural movement, pleasing
  sound, reliable interactions and smooth performance. Clipping, flickering, floating objects, broken routes and
  visibly artificial behaviour undermine the experience and remain defects to resolve.

Use this review question for every proposed improvement: **does this make being in Minato more pleasurable
and believable?** Prioritise completing and refining existing places and daily experiences. These examples
guide quality decisions; they do not authorise unrelated expansion or override newer specific owner instructions.

Handover update only: no game or runtime changes, no gameplay tests run, and no existing issue is signed off
by recording this direction.

## Checked at the start
#342 (benches), #340 (Linux 0.2.16, into `codex/johansson-world-steam-deck`) and #346 (handoff) were all merged already.
Nothing to finish there.

## The owner's three jobs of 22 October

| Job | PR | State |
|---|---|---|
| 1. Seated poses for chairs, stools and cushions; two places on the indoor benches; the clinic bench's facing | **#351** | **Merged** (squash `096ee3c9`) on the owner's word, after the before/after photos (`docs/qa/seated-interiors/`). Main (#350, Minato food) was merged into it first and the runtime rebuilt; guard and linux green. |
| 2. Comic backdrops for the town hall, the school and the clinic | **#352** | **Merged** (squash `7cfec5b8`) on the owner's word. Retargeted to `main` after #351, main merged in, runtime rebuilt; guard and linux green. Sample comics in `docs/qa/civic-backdrops/`. |
| 3. One group of the already-failing tests, into the CI guard | **#353** | **Merged** (squash `9f7ccd4c`). Tests only; the guard is 64 files with `izakaya-food`. |

### 1. What #351 does
- Every seat a player or resident sits on says where its front edge is (`front`, seat-slots.js), measured on its own
  mesh: the home table seats (`tableSeatFront` on every home layout, read by `home-seats.js` and `home-residents.js`),
  Minato and Sato Ramen (`SHARED_DINING_SEAT_FRONT`; residents via `indoor-residents.js`), the onsen's wash stools,
  tatami edge and massage chair, the ferry hall, office, classroom, Sakura's office, Front-Row's chair, the beach chairs,
  and Higa Liquor's bench and crate stools and the laundry bench (`stand-seat.js`). Comics carry it too.
- Domestic arrivals (three), the clinic, the police lobby and Umi-no-yu's changing bench seat two (`benchSeat`).
- The clinic bench faces the waiting room (its back is to the partition): `yaw: Math.PI`.
- Tests: `tests/seat-edge.mjs` measures a seat's front edge, back and thickness by rays and builds the rooms
  (`seatRooms()`); `seat-layouts.test.mjs` checks every seat's `front` against its mesh (1 cm); `seated-pose.test.mjs`
  sits the eleven bodies on eight real seats from the rooms as well (57 s). Without the data, feet go 7–20 cm into them.
- Photo harness: `node tools/seated-interior-photos.mjs <out> [--site=<main worktree>]`.

### 2. What #352 does
- `shot.camera` for `town-hall` (room `community-kitchen`), `school` and `clinic` in `src/feed/places.js`; all three
  are `captured:true`. The school is shot at noon on 22 October (`time:294*1440+720`): the blackboard prints the day,
  and the renderer's default day is 1 January.
- Run: `TOWN_CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/render-feed-backdrops.mjs town-hall school clinic`
  (about 4 minutes a place, alone).

## Found on the way (not done)
- **The Community Hall kitchen is bare**: the booking sheet is a blank cream box, the back wall has a large plain grey
  board, nothing on the request box. Comics there look empty. A dressing pass (writing on the sheet, the register, the
  petitions) would serve the stories; recapture `town-hall` after it.
- **Two Dr Kakazus**: the cast's resident (short dark hair, white sweater) and the clinic room's `DOCTOR_RECIPE`
  (ponytail, white coat) differ. Comics use the cast's.
- The clinic's comic view has no seat in it (the bench is in the waiting room behind the camera), so everyone stands
  there; the patient's stool is not a seat record.
- Higa Liquor's yuntaku bench says `front` 0.19; its drawn slats end about 0.16 ahead of the mark (#342's number).
- Still posing without `front`: the fixed-pose people (the clinic doctor, the school figures, Higa at the bandai,
  Ganaha at the port hall, Fujita's chair), and comic backdrops captured before #351 (`render-feed-backdrops.mjs
  --seats-only` refreshes only the seat records, cheaply).
- Umi-no-yu's outdoor bench ("Cool off on the bench") is a GLB streamed in later; it still has one place and no `front`.

## The Linux controller
The owner's devices are **a Steam Deck and an 8BitDo controller in Switch Pro mode (Bluetooth)**. Three questions are
still open (version and launch route; left stick vs right; the Controls page's device name and Look axes), as are the
likely causes: Steam Input's desktop layout, a saved Look axis past the normalised four, and the pad switching only on a
button press. All are in `HANDOVER-LINUX-JOYSTICK-2026-10-22.md` ("Update, 22 October 2026 (afternoon)"). No
controller code has changed.

## Outstanding issues (log; keep it current)
| # | Issue | State | Where |
|---|---|---|---|
| 1 | Right stick doesn't move the camera (Steam Deck, 8BitDo Switch Pro over Bluetooth) | Likely cause 2 (a saved Look axis past the pad's four axes) fixed on `claude/laughing-rubin-6p25x2`, for 0.2.17, unreleased; still waiting on the owner's three answers | Linux joystick handover |
| 2 | Community Hall kitchen is bare (blank booking sheet, plain grey board); comics there look empty | Open; recapture `town-hall` after dressing it | `interiors/town-hall.js` `buildCommunityKitchen` |
| 3 | Two Dr Kakazus: the cast's resident vs the clinic room's `DOCTOR_RECIPE` | **Done**: decided by the owner (22 October, evening): the clinic look is Nhung's, Dr Kakazu retired into her. Merged to main through #362 (23 October); was on `claude/laughing-rubin-6p25x2` (`briefs/nhung-doctor/`) | `avatars/cast.js`, `interiors/town-hall.js` |
| 4 | Clinic comic view has no seat (the bench is behind the camera); the patient's stool is not a seat | Open | `feed/places.js`, `interiors/town-hall.js` |
| 5 | Higa's yuntaku bench: `front` 0.19, its slats end about 0.16 | **Fixed and merged** (#359): the outer slats are flush with the bench's edges; `higa-liquor-laundry.test.mjs` measures it (1 cm) | `okinawa/higa-liquor-dressing.js` |
| 6 | Fixed-pose NPCs pose without `front` (clinic doctor, school figures, Higa at the bandai, Ganaha, Fujita's chair) | Open | each room's animator call |
| 7 | Comic sets captured before #351 lack `front` and bench places | Open; `render-feed-backdrops.mjs --seats-only` | `assets/images/feed/views.json` |
| 8 | Umi-no-yu's outdoor bench: GLB, one place, no `front` | Open | `world/park-onsen.js` |
| 9 | Police station and port terminal comic backdrops | Open since phase 5 | `render-feed-backdrops.mjs police-station port-hall` |
| 10 | About 32 already-failing test files (other groups of the 21 October morning handoff) | Two repaired: `visual-audit-freeze.test.mjs` in merged #368 and `consolidation.test.mjs` in merged #369, both in the main guard; see [latest signed handover](HANDOFF-SAVE-CONSOLIDATION-2026-10-22.md). Remaining groups open; not recounted | `HANDOFF-2026-10-21.md` |
| 12 | Texts that still count the island before the consolidation | Clinic fixed on the branch (the couch, the X-ray). Open: the classroom's pupil list names three children not in the cast; the countryside's Ōshiro farm has "three generations" nobody in the cast is | `interiors/classroom.js`, `world/countryside.js` |
| 13 | The player is called "Mayor" (clinic texts, letters) though the mayor's office went | Open; the owner to decide the word | `interiors/town-hall.js`, `mail/letters.js` |
| 14 | Higa Liquor closes; Sakura sells and supplies all alcohol; Kōji's round becomes Sakura Trading's; the building stands shut | **Done**: merged to main with #362 (as #363 into its branch, 23 October) | `briefs/higa-liquor-closes/progress.md` |
| 11 | English signs to make Japanese, the gajumaru crown, park keepers' routines, Higa's evening bench, phone performance | Open | `HANDOFF-2026-10-21.md` |

## Still open from earlier handoffs
English signs, the gajumaru crown, the park keepers' routines, Higa's evening bench, the other failing-test groups
(about 36 files: see the morning handoff of 21 October; the "undefined property" group is #353), performance.

## Working notes
- Worktrees this session: `scratchpad/{seats,backdrops,tests3,handoff,main}` of session bbcdc04d. Leave them alone.
- Run the guard and any browser one at a time: each takes 6–7 minutes alone, much longer together.
