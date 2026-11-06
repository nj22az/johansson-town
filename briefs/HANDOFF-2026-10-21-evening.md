# Handoff: 21 October 2026, evening

A fresh session starts here. Read these first, in order:
1. `CLAUDE.md`, `AGENTS.md` and `johansson-town/AGENTS.md` (the owner's decisions);
2. the morning handoff, `briefs/HANDOFF-2026-10-21.md` (its working recipe still holds);
3. this file.

Main is at #325 or later. The branch `claude/dreamy-gates-zq8kvo` is restarted from main for each piece of work.

## Done and merged this afternoon

**The town hall zone** (#319, #320, #321, #323). The plan and a record of each phase are in
`briefs/town-hall-zone.md`. Before-and-after photos are in `docs/qa/town-hall-zone/compare/`.

- **R: the ground restored.**
  - The north end of the east beach no longer holds a slab of sand over the sea (`beach-layout.js` `BEACH_SHORE`,
    `tests/beach-shore.test.mjs`).
  - The sea's foam is drawn from a finer shore field with soft edges, in `ocean.js`; the field stores the square root
    of the distance.
  - The wet sand blends over 6 cm (`ground-standard.js` `wetBlend`).
  - The yard is lawn, with rolled stone only where people walk (`TOWN_HALL_GROUND.stone`).
  - The plates are Japanese again through `SIGN_JAPANESE`.
  - The switchgear is on the power house's wall, and the fuel pipe is buried.
- **M: the mayor's office became Nils's study on Kitano-jima.**
  - The study (`johansson-house-interior.js`, L1 study) has the office's CRT with the town register on it and the
    Merry Moose (`tests/johansson-study.test.mjs`).
  - The `mayor-office` site and room are gone. Saves and every retired home land at `community-kitchen`
    (`HOME_ALIASES`, `RETIRED_HOMES`).
  - The office's trade accounts are the Community Hall's.
- **S: the campus split** (`school-layout.js` `TOWN_HALL_BUILDINGS`).
  - Three buildings: 港小学校 (with a faint 港小中学校 under the paint), 港町公民館 and 港町診療所. Every door stayed
    where it was.
  - 1.5 m passages run between them through to Kitahama's north lane. The old "seawall to the south" was stale; the
    lane runs at z 44.5.
  - The power house has a fenced gravel compound with the day tank inside.
  - The school and the clinic are story places of their own (`feed/places.js`).
  - The register in the Community Hall is self-service.

**Cloud boot** (#324). The whole game boots and plays in a cloud session.
- **The cause:** the `?visual-audit` frozen frame loop never drew the title, so START never opened and every
  visual-audit tool waited at 97% for ever.
- **The fix:** `game.js` now draws the title in the frozen loop until START. `tests/audit-boot.test.mjs` is in the CI
  guard.
- **The check:** `node tools/cloud-boot-smoke.mjs` boots the game, presses START and photographs a street and a room.
  It takes about 25 s to "Island ready" and 35 s to play on a 4-core machine.
  - Run it alone. With test suites or another browser running, swiftshader is starved and the island takes many
    minutes to draw. That is what made the game look broken before.
  - `--source` serves the source modules without a rebuild. It logs "Multiple instances of Three.js" but works.

**From others the same day:**
- #322 (Codex): the compact Minato/Sato Blender interior.
- #325: the owner's decision that the ferry keeps her timetable and never waits for Nils. See
  `briefs/ferry-timetable.md` and johansson-town/AGENTS.md.

## Next, in the order recommended to the owner

1. **Comic backdrops for the three new places** (the owner leaned towards this as the next job).
   - `node tools/render-feed-backdrops.mjs town-hall school clinic` now runs in the cloud: alone, about 5 minutes a
     place.
   - First give each place camera views that frame the room. `town-hall`'s views in
     `assets/images/feed/views.json` are the old mayor's office's; rendered in the kitchen, all four stare into the
     cupboard corner. Those renders were thrown away.
   - Check every still as the owner would before committing, then set `captured:true` (drop `captured:false`) in
     `src/feed/places.js`.
   - Then do the police station and the port terminal (`police-station port-hall`), which have waited since phase 5.
2. **Look at the town hall zone on the owner's phone.** The photos came from swiftshader. The hall's pale green and
   the clinic's white read close to cream there.
3. **The morning handoff's open items, still open:**
   - the last English signs: the fish auction, the laundry's upright, Sakura's flower bucket, and Old Cave in
     `game.js`;
   - the gajumaru's heavy crown;
   - the park keepers' routines;
   - the empty Higa Liquor bench;
   - performance on the phone (the three buildings and the fence added draw calls; not yet measured).
4. **The 40 test files that fail on main.**
   - The easy first one is `boot.test.mjs`. Its expected lists of sites and visits are stale: it still lists the
     removed Fumoto and Kitahama homes and lacks `home-clinic`, `home-higa`, `home-nakamura` and the Heights flats.
     Regenerate the expectation from the live sites, check the difference is only removed or renamed homes, and add
     it to `tests/ci-guard.txt`.

## Working recipe additions (learned today)

- **Merging.** Merge only on the owner's word, after the CI guard is green on GitHub. Squash-merge, then restart the
  branch from `origin/main`.
- **Runtime conflicts.** Codex and other sessions merge too, so a PR's `runtime/`, `index.html` and `sw.js` can
  conflict. Use the morning recipe: take main's runtime, `index.html` and `sw.js`, rebuild, then push a merge commit.
- **Photos.** `tools/town-hall-zone-photos.mjs` (static `createTown`) and `tools/johansson-study-photos.mjs` (one
  interior) are the light harnesses. Prefer the real game through `cloud-boot-smoke.mjs` and the `?audit` API:
  `a.camera`, `a.render()`, `a.enter(id)`.
- **Visual changes.** These need before-and-after photos from the owner's spots. Use a worktree of `origin/main` for
  "before", and symlink `node_modules` into it.
- **Story places.** A story place may only list things that exist in its room. Grep the room builder's names before
  writing `things`.
- **Killing browsers.** Never `pkill -f` a pattern that also matches your own shell command; that kills the shell.
  Use a bracketed pattern such as `pkill -f "[t]own-hall-zone"`.

## Added by the owner, 21 October, late

The owner asked for these three to go into the handoff. Do them in a fresh session, in this order.

1. **A Bluetooth controller doesn't work when playing on Linux.**
   - Reproduce from the code path first:
     - the Electron shell in `steam-deck/` (branch `codex/johansson-world-steam-deck`);
     - the controller mapping and repair code;
     - the Gamepad API (`navigator.getGamepads`), and whether Electron needs a flag or permission for HID/Bluetooth
       pads;
     - the `controller-repair` smoke.
   - Likely suspects:
     - a pad that connects after the page has loaded and is never picked up (no `gamepadconnected` handling, or
       polling of index 0 only);
     - a non-standard mapping (`mapping !== 'standard'`) that is ignored;
     - the Steam Input / SDL layer hiding the pad from Chromium.
   - Ask the owner which controller and Linux distribution if it isn't clear (Steam Deck desktop mode or another PC).
   - Fix it, add a test with a fake late-connecting non-standard pad, and ship it in the next Linux release.
2. **The izakaya: Thao should fetch drinks from the bottles on the back bar.** Thao serves at Minato Izakaya. The
   owner: "it's better if the bottles in the izakaya bar desk is where Thao gets the drink for the person who orders…
   beer and drinking works nice, now she just brings by magic".
   - When someone orders, she:
     - walks to the back bar (Codex fitted the walnut back bar with 42 bottles in #318);
     - takes the right bottle, or pulls the beer at the tap if there is one;
     - pours at the counter;
     - carries the glass to the customer.
   - The bottle she uses is the brand on the shelf the order names. No drink appears out of nowhere.
   - Keep the existing "beer and drinking" animations, which the owner likes.
   - Collisions intact: her hands meet the bottle and the glass, nothing passes through the counter.
   - Web: a simple version of the walk and pour. Linux: the full one.
3. **A clipping prop on the izakaya counter.** In the owner's photo (`owner-shots/izakaya-counter-2026-10-21.jpg`),
   on a wooden cutting board, are two small cream bowls drawn into each other, merged as one. The owner: "whatever
   that is, maybe it needs to be split".
   - Find it (the counter dressing from #318 or the izakaya dressing).
   - Split them into two separate bowls side by side that don't intersect. Give them a purpose: e.g. otōshi
     (the small dish served with the first drink) waiting to go out.
   - Check the knife lies on the board, not in it.
   - Add the izakaya counter to the no-z-fighting / overlap checks.

4. **Sitting: two people on one bench, and no clipping when seated.** In the owner's photo
   (`owner-shots/bench-sitting-2026-10-21.jpg`, a resident in a skirt on a park bench at night, on Linux), the hands pass
   through the skirt and the legs pass through the bench. The owner: "two people should be able to sit together on a
   bench, and the avatars need better animation her hands shouldn't clip through the skirt and the legs shouldn't clip
   through the bench".
   - **Two seats per bench.** Give every bench two (or, by length, more) seat slots in the seat data (see
     `tests/seat-layouts.test.mjs` and the bench builders). Each slot has its own position and facing.
     - Two residents, or a resident and the player, sit side by side without overlapping.
     - Sitting beside someone is also a storyteller moment and a chance for a pair pose. Reuse the pair-pose work
       (`pair-poses.js`).
   - **Seated pose fits the body and the seat.**
     - The thighs rest on the seat top, the knees bend over its front edge and the shins hang in front of it, never
       through it. The pose comes from the seat's height and depth, not a fixed angle.
     - The hands rest on the lap or the seat edge outside the skirt's volume. Skirts, dresses and long shirts get a
       seated shape, or the hands are placed on top of the cloth.
     - Check every outfit category: skirt, shorts, trousers, dress.
   - **Tests.**
     - A seated-pose collision test: for every outfit and every seat type (bench, chair, zabuton, stool), no hand or arm
       vertex inside the garment volume, and no leg inside the seat solid. Contact is allowed to a few millimetres,
       like the film collision rule in jojo/CLAUDE.md.
     - A two-on-a-bench test.
     - Add both to `tests/ci-guard.txt`.
   - **Photos.** Before and after of the owner's spot at night, two people on one bench, and a skirt, trousers and a
     dress seated.

The ferry timetable (`briefs/ferry-timetable.md`) is also ready to build. The owner approved it.
