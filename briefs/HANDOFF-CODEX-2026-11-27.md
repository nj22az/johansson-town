# Handover to Codex · Johansson World · 27 November 2026, night

**Read this first. It's self-contained and points to everything else.** Claude's session ended here, at the owner's word:
"prepare to handover to codex now your usage is almost up". The long running record of the day, a section per piece of
work with every number, is `briefs/HANDOFF-SAKURA-RESTROOM-2026-11-26.md`. Look things up there; this file says what to
do next.

## 1. Where things stand

| | Commit | State |
|---|---|---|
| `main` (live at nj22az.github.io/johansson-town/) | `00e0c0c` | published 27 Nov |
| `claude/dreamy-ritchie-cxufpl` (the work branch) | this file's commit | pushed; 68+ commits ahead of `main`, which is its ancestor (a fast-forward) |

**The owner said "Yes" to publishing the branch to `main`** once the full guard passes (27 Nov, night, to "Do you want this
pushed to main when the tests are done?"). The guard was running at handover; its result is in section 2. If it was not
published by Claude:
1. `node tools/ci-guard.mjs --test-concurrency=2` on the branch head: about 25 to 30 minutes, 155+ files. Every file must
   pass (the runtime package passes once `npm run -s build:runtime` has been run on the head; it was, at `e212b54`).
2. If it is green: `git push origin claude/dreamy-ritchie-cxufpl:main` (a fast-forward; check with
   `git merge-base --is-ancestor origin/main HEAD`). The Pages run publishes it.
3. If anything fails: fix it, or leave `main` alone and tell the owner what failed.

**What the branch carries beyond `main`:**
- The real Hawaii shirt: boxy, straight hem with vents, an all-over print, the camp collar and the tank top under it.
- Stage 4 of the animation standard.
- The Chura Stars: the radio's singer, now fictional.
- The data and ferry test fixes, and the places and residents fixes.
- Tetsuo's bath boiler at Umi-no-yu.
- The bodies, poses and clothes fixes.
- The Blender beer drink at Minato's counter for every body.
- One skin colour for face and body.

## 2. The last guard

At `e212b54`, `node tools/ci-guard.mjs --test-concurrency=2`: *(Claude fills this in below if it finished before the
session ended; otherwise run it.)*

## 3. The owner's open requests, in order

1. **"Fix all outstanding errors"** (27 Nov). Done for most; four files still fail outside the guard, and each needs a decision
   or a tool rather than a code fix:
   - `tests/onsen-seats.test.mjs` test 2: the massage chair's clear space was measured in Studio on 14 Oct. Sverker's redrawn
     body leaves it by up to 38 mm, though it touches none of the chair's geometry. Re-measure with Studio's
     `modeller/tools/keep-clear.mjs`, which is in the Office site's checkout, not this one.
   - `tests/fujitas-back-moves.test.mjs`, the plank carry. Thuan carries at her knees with her forearms level. The kit's forearm
     is thicker than its flat hand, so his thigh sits 34 mm into her forearm. A choreography decision: either the load rests
     on the forearms, or the forearms slope up to the hands.
   - `tests/fun-poses.test.mjs`, HideFace on Mr Fujita: his right hand stays 52 mm from his face (the test asks for 50). His
     arm can't reach further. The pose's description says "the shoulders up", which it doesn't do yet.
   - `tests/drink-grip.test.mjs`: after a can, the next drink's first sip is 41 mm off the lips (`consumeW` reset to 0 by the
     can's drink in `src/avatars/animate.js`). Given to the beer work (item 2).
   - `tests/office-workbooks.test.mjs`: needs Codex's builder (`@oai/artifact-tool`). `service-work-log.xlsx`'s cached cell
     still reads "Harbour master"; he is Sverker since 26 Nov (`9ca68be`). Codex can rebuild it.
2. **The beer drink** ("Remake it follow Disney principles how should it look when anyone drinks beer"). Done: every body
   drinks the Blender-keyed mug, pint or small glass at Minato's counter (`src/avatars/drink-beer.js`,
   `tools/blender/drink-beer.py`, `drink-beer-keys.py`), and residents at the counter stools drink it too. Left, in this
   order (the beer section of the running handover has the numbers):
   - booths and standing drinkers still use the old drink, which steps 0.13 rad and 32 mm a frame;
   - wrists go up to 0.058 rad past their limits on a later sip, and one 0.062 rad step on Thao's small glass;
   - the mug's handle hand: fingers through, thumb on top (it is a fist round the bar now);
   - Johansson's small glass poured from the bottle;
   - a kanpai clink;
   - the can's audit leftovers;
   - the 41 mm sip after a can.

   A Claude helper was on these on local branch `drink/beer` when the session ended. Whatever it finished is merged and
   listed in section 5; anything not listed there was lost with the container.
3. **The animation standard** (the owner, 27 Nov: strict adherence to dylantarre/animation-principles):
   `docs/ANIMATION-STANDARD.md`, `.claude/skills/animation-standard/SKILL.md`, `tools/animation-audit.mjs` with
   `tests/animation-principles.test.mjs` and its baseline. The baseline is a ratchet: it only ever shrinks.
   - Stage 5 is next: the remaining anticipation (Laugh, Bow, HairTuck, HeelRock, DramaFinish, CollarTug, the 13 moves,
     SitDown and StandUp, Kachashi and Shrug on Sverker), the twins, the arcs (`ARCS_WITHOUT_DRAG`), micro-overshoot and
     velocity steps.
   - Stomp has no squash.
   - HoldOn's fists pass through the jaw on the way in (12.7 mm).
   - Vy's kneeling toes stay 16.6 mm off the floor.
4. **Queued by the owner, for when the animation is "truly spotless":** "audit this repo add it to our toolbox as well and
   give suggestions on how Johansson world can become a fun game https://github.com/nexu-io/opengame that someone would like
   to buy". Not started.
5. **A question the owner has not answered:** beer in Sakura's drinks machine only, or in every machine (it is in all of
   them now, `src/commerce/`, the vending products; beer stops 23:00 to 05:00).

## 4. Seen and not fixed (smaller)

- Clothes still laid on the generic neck radius:
  - the hair clip is 22 mm into the perm's curls and 8 mm into the swept ponytail, and floats 9 mm over a bald head;
  - a pendant sits 4 mm inside Johansson's neck;
  - the tee's neck rib and the contrast polo's collar band are laid the same way;
  - the one-piece swimsuit's straps sit 0.5 mm from Thuan's neck.

  The fix is the one `afterbath-outfit` took: use `m.neckR`.
- The seated shirt's hem goes into the lap (`src/avatars/springs.js`, `hemSpec`), and there are ink specks on the shirt close
  up.
- Two comic backdrops (sato-ramen, minato) are stale on purpose: their capture (`tools/render-feed-backdrops.mjs`,
  `views.json`) no longer frames the moved rooms. A re-capture moved the feed's cameras and seats and failed
  `feed-seating`, so it was reverted.
- On days Sakura's errand rota gives Tetsuo the last shopping slot (17:10 to 17:33), what's after 18:00 is now the boiler.
- A hat added to a resident outside `wear()` would miss the figure's light (`src/avatars/figure-light.js`); none found.

## 5. Merged at the very end

*(Claude adds the beer helper's last commits here if they came in before the session ended.)*

## 6. Working here

- **Rules:** `AGENTS.md` (the owner's decisions, newest first, take precedence), `CLAUDE.md`, and the Office site's
  `AGENTS.md`/`CLAUDE.md`.
  - Nothing random: every item has a who and why in its data.
  - No glitches: clipping, pops and floating are bugs.
  - No z-fighting (`ferry/yard/standards/JSY-STD-403-no-z-fighting.md` in the site).
  - Fictional brands only.
  - The owner's and family's photographs never go in this public repository.
  - Never weaken a test to pass it.
  - Never hand-edit generated files (motions, products data, workbooks, the design book, the runtime): run their tools.
  - Docs refer to "the owner", never "him".
  - Publish to `main` only on the owner's word, one push per word.
- **Layout:** clone the Office site (`nj22az/nj22az.github.io`) and put this repository at its `johansson-town/` (a clone or a
  symlink). The runtime build (`npm run -s build:runtime`) follows into the site's avatar creator and fails without it; the
  site ignores `/johansson-town`.
- **Tools that worked in a Linux container:**
  - The guard: `node tools/ci-guard.mjs --test-concurrency=2`. Higher concurrency timed out and ran out of memory on 4 cores
    and 15 GB.
  - Resident portraits, after any change to `build.js` (its hash is in `guide/portraits.json`):
    `TOWN_CHROMIUM_PATH=<chromium> node tools/render-resident-guide.mjs`.
  - Hand and move sheets (`--beer pint|mug[:resident]`, `--can`, `--moves … --wind --fixed`, `--hold`, `--set`):
    `node tools/hand-shots.mjs …`.
  - The game itself, in software WebGL: load `/johansson-town/?audit&visual-audit` and use `window.__JOHANSSON_AUDIT__`:
    `setTime(minutes,{rain})`, `teleport`, `stand`, `face`, `enter(room)`, `camera={pos,at}`, `render()`, `step(ms)`.
    `tools/tv-overlay-shots.mjs` is a working example.
  - Blender work runs on `bpy` from PyPI in a venv (Python 3.11). `tools/blender/drink-can.py` and `drink-beer.py` build and
    render the drinks.

  All of these renders are software renders, not a phone: say so when showing the owner.
- **Workflow** (the owner, 24 Oct): Codex prototypes detailed three.js rooms and characters on `development`; Claude takes
  them to Pixar standard in Blender (`nj22az/jojo`, branch `pixar`); `main` keeps the simplified cartoon World. This
  handover carries the work branch's state so Codex can continue it.
