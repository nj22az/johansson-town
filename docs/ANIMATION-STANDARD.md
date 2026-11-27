# Animation standard for Johansson World

**The owner, 27 November 2026:** "https://github.com/dylantarre/animation-principles use this as the guidelines for
animating Johansson world make strict adherence to it".

Everything that moves in Johansson World follows that guideline, strictly. That covers:

- residents and the player, in the town and on the ferry;
- their faces and hands, the props they hold, animals and vehicles;
- doors and machines, the camera, the comics' poses and the game's screens.

The guideline is kept here at the commit the owner gave ([animation-principles/](animation-principles/),
[VENDORED.md](animation-principles/VENDORED.md)). It is Disney's twelve principles, applied through 144 skills. This file
says:

- which of those skills govern which work here;
- what their numbers are at our frame rates;
- how a move is made, reviewed and checked.

Where it gives a number, the number is the guideline's, with the skill it comes from. Where the guideline gives none, the
number is ours and is marked **(ours)**.

It stands with the owner's earlier rulings and does not replace them. If anything here ever seems to contradict one of
the owner's explicit rulings, the owner's ruling governs and the conflict is written down here:

- "Follow Disney animation principles", "beautiful, low cortisol", "Nintendo", dolls wearing clothes, 25 November 2026:
  [../AGENTS.md](../AGENTS.md).
- "No glitches, jagged edges or unnatural behaviour": [../../CLAUDE.md](../../CLAUDE.md).
- "Drinking needs to be impeccable Disney animation standard", 27 November 2026.
- No z-fighting (JSY-STD-403).
- The site's [ANIMATION_DIRECTION.md](https://github.com/nj22az/nj22az.github.io/blob/main/ANIMATION_DIRECTION.md) for
  films.

## 1. Before you animate: read the skills for the work

Always read the twelve principle files, `animation-principles/skills/11-by-principle-focus/*/SKILL.md`. Then read the
skills for the work in hand:

| The work | Skills (under `animation-principles/skills/`) |
|---|---|
| A resident's or the player's move, pose or performance | `01-by-domain/game-development`, `01-by-domain/3d-spatial`, `03-by-role-persona/animator-traditional`, `02-by-thinking-style/naturalistic-motion`, `02-by-thinking-style/character-appeal` |
| Everyday life (walking, idling, talking, eating, drinking, work, sitting) | `06-by-emotional-outcome/calm-relaxation`, `06-by-emotional-outcome/friendliness-approachability` |
| Comedy and story beats (fun poses, Fujita's Back, slapstick, the comics) | `06-by-emotional-outcome/playfulness-fun`, `02-by-thinking-style/anticipation-payoff`, `02-by-thinking-style/exaggerated-clarity`, `02-by-thinking-style/emotional-narrative` |
| Props, falling and thrown things, doors, vehicles, machines | `02-by-thinking-style/physics-intuition`, `11-by-principle-focus/arc-mastery` |
| Hair, clothes, tails, ropes, the shirt hem | `11-by-principle-focus/follow-through-overlapping` |
| The camera | `12-by-problem-type/motion-sickness`, `01-by-domain/accessible-motion`, `03-by-role-persona/filmmaker` |
| The game's screens (menus, phone, bag, map, feed, dialogue) | `01-by-domain/game-development`, `08-by-industry/gaming-entertainment`, the element's own file in `07-by-ui-element/`, `12-by-problem-type/timing-calibration`, `01-by-domain/accessible-motion` |
| Films and comics shot from the town | `01-by-domain/video-motion-graphics`, `03-by-role-persona/filmmaker`, and the site's ANIMATION_DIRECTION.md |
| Something feels wrong | `02-by-thinking-style/problem-diagnosis`, `12-by-problem-type/implementation-debugging`, `12-by-problem-type/timing-calibration` |

## 2. How strong: the town's register

The guideline asks that motion be calibrated to its context and kept consistent within it
(`11-by-principle-focus/exaggeration-mastery`, "Context Calibration Method"; "Inconsistent exaggeration … creates
dissonance"). Johansson World has two registers. Every move belongs to one of them, and the move's file says which.

| | **Everyday** (calm, friendly) | **Comedy** (playful) |
|---|---|---|
| Used for | walking, idling, talking, listening, eating, drinking, work, sitting, the habits | fun poses, pair gags, Fujita's Back, slapstick, a take, a celebration |
| Squash and stretch | 2–5%, volume kept (`calm-relaxation`; `squash-stretch-mastery`: "2-3% for subtle polish", "Subtle contexts need 1-5%") | 10–20% (`friendliness-approachability`), more only on an impact gag the doll's construction carries (`exaggeration-mastery`: no distortion of proportions "unless the style supports it") |
| Exaggeration of poses | 20–30% past real (`game-development`: "Exaggerate poses 20-30% beyond realistic") | 30–50% (`playfulness-fun`; `exaggeration-mastery`: "30-50% for consumer/entertainment") |
| Anticipation | 30–50% of the action's length, opposite to it (`anticipation-mastery`) | the same ratio, the wind-up pushed: "big preparation for big payoff" (`playfulness-fun`) |
| Secondary action | 30–40% of the primary's amplitude (`secondary-action-mastery`, "Moderate") | 50–60% (`secondary-action-mastery`, "Expressive (entertainment, games)") |
| Arcs | 10–20% of the travel (`arc-mastery`, "subtle organic feel") | 30–50% (`arc-mastery`, "dramatic sweeping motion") |
| Follow-through | long, soft settles (`calm-relaxation`: "Long settling times (500ms+)") | overshoot, wobble and settle (`playfulness-fun`) |
| Breathing | a 4–6 s cycle (`calm-relaxation`) | as the beat needs |

The owner's "low cortisol" puts everyday life in the calm register. Nothing everyday snaps, jitters or startles.

## 3. The twelve principles, as rules

Frame counts in the guideline are at 24 fps. In the game (60 fps) multiply them by 2.5
(`timing-principle-mastery`). In the Blender motions (30 fps) multiply them by 1.25.

1. **Squash and stretch** (`squash-stretch-mastery`, `3d-spatial`).
   - Volume is always kept: what squashes widens.
   - Use the register's amounts (section 2), eased in and out, never snapped.
   - Required on every impact: a landing, a stomp, sitting down hard, a hop.
   - Also on the face: cheeks squash on a smile, stretch on surprise.
   - "Rigid" props get 1–2% only when it helps, never on a can, glass or tool the hand holds.
   - Done with shape keys, or with bone scale whose product stays 1 (±1%).
2. **Anticipation** (`anticipation-mastery`).
   - Every action longer than 200 ms has a counter-movement opposite to it, 30–50% of the action's length. The classic
     ratio is 1:2.
   - Small actions get 2–4 frames at 24 fps; major moments get 12–24 frames.
   - The eyes go first: "Character looks before moving" (`animator-traditional`). We use 6–10 game frames, as the site's
     ANIMATION_DIRECTION.md has it.
   - An inhale comes before speaking.
3. **Staging** (`staging-mastery`).
   - One idea per moment, readable as a black silhouette from the front and three-quarter views.
   - The hand, prop or face that tells the story is not covered by the body or another prop at the story pose.
   - Secondary motion never competes with it.
4. **Straight ahead and pose to pose** (`straight-ahead-pose-mastery`).
   - Acting is pose to pose, in four steps:
     1. block the story poses;
     2. add breakdowns that define the arcs;
     3. add the in-betweens;
     4. polish with overlap.
   - Hair, cloth, springs and effects are straight ahead (procedural or simulated) on top.
   - Johansson's performances are keyed in Blender (`tools/blender/drink-can.py` is the pattern) and played as motions
     (`src/avatars/motion.js`). Never edit an exported motion by hand.
5. **Follow-through and overlapping action** (`follow-through-overlapping`).
   - The drag hierarchy is root (hips, spine) → primary (chest, head, upper arms) → secondary (forearms, hands, face) →
     tertiary (fingers, hair, cloth, what is held).
   - Each level starts and stops 2–4 frames at 24 fps later than the one before: 5–10 game frames.
   - Nothing stops all at once.
   - A settle eases out past rest and back, with a micro-overshoot at most, and never snaps.
6. **Slow in and slow out** (`slow-in-out-mastery`).
   - No linear motion on anything alive: ease out of a pose and ease into the next, with flat tangents at holds.
   - Linear is for the mechanical only: an engine, a fan, a conveyor, a wheel at speed, a clock.
   - Blinks go down fast and come up slower.
7. **Arcs** (`arc-mastery`).
   - Hands, heads, feet and held props travel on curves: 10–20% of the travel off the straight line (30–50% when sweeping).
   - The path is asymmetric where the action is: fast one way, slower back.
   - Check arcs from the camera that will see them, not only in the world.
8. **Secondary action** (`secondary-action-mastery`).
   - Every primary action gets the single most valuable supporting action: breathing, a weight shift, the free hand doing
     something motivated, a face. It is kept below the primary in amplitude and offset in time.
   - Do the "remove and test" check: take it out, and the move should feel dead without it.
9. **Timing** (`timing-principle-mastery`).
   - Durations follow weight, size, age and feeling: an old resident's recovery is slower, a child's snappier.
   - Story poses are held long enough to read.
   - Timing varies by contrast, never uniform.
   - The game answers input within 100 ms (`game-development`).
10. **Exaggeration** (`exaggeration-mastery`).
    - Use the register's amounts (section 2), consistent within a move and between residents doing the same thing.
    - Push until it is clearly too much, then pull back 20% ("The Restraint Paradox").
11. **Solid drawing** (`solid-drawing-mastery`, `3d-spatial`).
    - Volumes, proportions and the model stay constant through the move.
    - No interpenetration, floating, sliding feet or hands through what they hold. These are already bugs here: "No
      glitches", the clipping and contact tests.
    - No twins: the left and right sides never mirror each other. Offset them in time (at least 2 frames at 24 fps) or
      in amount (at least 10%) **(ours)**.
12. **Appeal** (`appeal-mastery`, `character-appeal`).
    - Each resident moves as who they are: their own timing, habits and arcs (`body-language.js`, `gait.js`).
    - A move has to stand being seen for the thousandth time (`game-designer`: "Satisfying at 1000th repetition").

**The camera** (`motion-sickness`, `accessible-motion`):

- Eased, predictable moves.
- No bounce or overshoot.
- No rapid direction changes or full-screen spins.
- Shake only as feedback, small and short.
- With the system's reduced-motion setting on, camera shake, sways and long camera moves are removed. The guideline calls
  this "non-negotiable".

**The game's screens** (`timing-calibration`, `gaming-entertainment`, `accessible-motion`):

- 100–400 ms, from a small scale of fixed durations.
- Ease out for what arrives, ease in for what leaves.
- Respect reduced motion.
- Nothing makes the player wait.

## 4. Making a move, step by step

1. **Brief.** Write the move's register, its beats with times, the primary body part and the secondary action, before any
   keys (`animator-traditional`, "Thumbnails").
2. **Keys and breakdowns.**
   - In Blender for performances: tools/blender, on the game's rig, at 30 fps.
   - In `animate.js` or a move's own file for procedural moves. These are eased curves, never linear `lerp` in time.
3. **Measure.** Run the principles audit (section 5) and fix what it finds.
4. **Look.** Shoot sheets from the front, three-quarter and side, plus a black-silhouette row of the story poses. Look at
   the arcs of the hands and head (`tools/hand-shots.mjs`, the Blender playblasts). Ask the animator's mantra ("Does it
   feel alive? Does it have weight? Does it have thought? Does it have appeal?") and say the answer.
5. **In the game.** Shoot it in the running game on at least two bodies (a small one and a large one), standing and
   seated where it applies.

## 5. The checks

`tools/animation-audit.mjs` (a library and a command) and `tests/animation-principles.test.mjs` play every move in
`animate.js` `GESTURES`, and the walk, the run, the idle, sitting down and standing up, on three bodies picked by measure
(height by depth by shoulder width): the smallest of the residents (Vy), Johansson and the largest (Sverker). Each is
played as the game plays it:

- by `createAvatarAnimator` with a seeded random;
- the walk at a resident's 1.25 m/s and the run at the player's 3 m/s, the speed damped as `actors.js` damps it;
- a seat taken as `indoor-residents.js` takes one (`chairBlend` from 0 to 1 in half a second, and back);
- with what the game puts in the hands (the can, a draught beer, a rice bowl and its dish), seated where the move is a
  seated one.

Every joint and end effector is sampled at 60 fps: a timed move over its length and a second of settling, a held move
(`Infinity`) over its way in and a 2 s hold. `node tools/animation-audit.mjs [--moves a,b] [--bodies a,b] [--out dir]`
writes every move's, body's and check's numbers to `output/animation-audit/animation-audit.json` and the table to
`animation-audit.txt` (about 95 s).

| | What is measured | Passes when |
|---|---|---|
| Ease | each joint's movements from one rest to the next: its speed in the first and the last frame (above the rest), against its top speed; its velocity's change from one frame to the next | neither edge is over half the top speed, and the velocity never steps by over half of it in a frame (a movement under 8 frames: by over nine tenths) **(ours)** |
| Anticipation | the primary effector (whichever of the hands, the head, the hips and the feet travels furthest; the hips for sitting and the jumps). Its action is the stroke in which it first comes half way to its furthest; its counter-movement is how far it first goes back along that line, and for how long | an action over 200 ms has a counter-movement of at least 5% of its travel and 5 mm **(ours)**, lasting 30–50% of the action |
| Arcs | each stroke of the primary hand or head (a foot in a foot move; a held prop where a move names it) between two rests, over 10 cm: how far the path goes from the straight line between its ends, over that line's length | everyday 10–50%, comedy 30–50% (below) |
| Overlap | when each level of the drag hierarchy first and last turns faster than a tenth of its own top speed: root (hips, spine), primary (chest, neck, head, upper arms, thighs), secondary (forearms, hands, shins, feet) | each level starts and stops 5–10 game frames after the one before (10–20 across a level that does not move) |
| Twins | the left arm's turns (shoulder, elbow, wrist) against the right's mirrored, at the lag within half a second that brings them closest, when both arms move | that lag is 5 frames or more, or the arms still differ by 10% or more at it |
| Squash | impacts: the hips falling at 0.3 m/s or faster and stopped within 6 frames **(ours)**; the torso's shortening (bone scale) within 8 frames of it | 2–5% (comedy 10–20%), volume kept |
| Volume | every bone's scale, x × y × z, against its rest | within 1 ± 1% |

Each check passes, fails, does not apply (with the reason: no impact, an action under 200 ms, one arm still, no stroke of
10 cm), or is excluded for the move's class. Where the guideline gives a number the audit uses it, with the skill in its
comment (`THRESHOLDS`); where it gives none, the number is ours and its comment gives the reason. The thresholds were set
from the guideline and from what the measures do on eased and linear curves, and proved on fixtures in the test: a linear
lerp (no anticipation, straight paths, every joint starting and stopping together, the arms mirrored) fails ease,
anticipation, arcs, overlap and twins on every body; a reach built to this standard's numbers passes every check; a
landing passes squash with a 3% squash that keeps its volume, and fails without one or with one that loses it. They were
not tuned to make any move pass. Where a measurement had to be defined more closely than the table above once said:

- **Ease.** The guideline gives no number. A cubic ease-in-out over N frames is at 4/N of its top speed in its first frame;
  a linear lerp and a pose snapped to (the animator follows its target at 14/s) are at all of it. The game's own moves fall
  on either side of half, with few between: of the 462 moves and bodies measured, the worst edge is under 20% in 229 and
  90–100% in 181 (18 between 40 and 80%), the worst step under 30% in 227 and 100% or more in 200. An edge is judged above the rest it is cut at (a snap is all of its speed whatever the rest); a movement shorter
  than 8 frames (3 at 24 fps, "quick" to "instantaneous" in `timing-principle-mastery`) cannot show an ease and is held only
  to a lerp's step. This section once said the thresholds were calibrated on the Blender drink, "which passes": it does not
  pass (section 6), so the fixtures calibrate them.
- **Anticipation.** The counter-movement begins where the effector leaves the line of the action (a drift across the line
  does not count) and lasts to the bottom, or to the end of a hold there ("full crouch with held pose before launch",
  `anticipation-mastery`). The primary effector is set by hand where the largest travel misleads (`PRIMARY`): the hips
  for sitting down and standing up (the feet travel further only because the scene moves the body across the seat, which
  the audit does not play) and for the jumps (the arms flung up travel further, but the action is the body leaving the
  floor).
- **Arcs.** Each register's floor is the guideline's: the mistakes it names are the straight line and the flat arc. The
  ceiling of both is its largest arc, 50%, a half circle. Everyday's ceiling is not 20%: that is the guideline's default
  for the curve put into a move from one point to another, while a limb turning about its joint draws an arc set by how far
  it turns (90 degrees about the shoulder: 21%; 120: 29%; 180: 50%), and this table already took "30–50% when sweeping". A
  20% ceiling would fail every natural raise of an arm: the wave (43%), the stretch (42%), lifting the can to the mouth
  (24%), and 202 of the 433 everyday strokes measured. The owner may tighten it (`arcBands.everyday`). Arcs are measured in
  the world, not yet from the game's camera. The walk's and the run's feet slide in the body's frame and their stance is
  straight by nature, so cycles and seat changes are judged on the hands and the head.
- **Overlap.** The keyed joints only. The hair, the skirts and the hems swing on springs (`springs.js`, straight ahead);
  they hang from the hips and the head, not after the forearms, and their parent carries them from its first frame, so
  their own start shows no lag to measure. What is held is held rigidly and does not drag. The legs, which rule 5 does not
  place, are placed by their reach from the root **(ours)**. A held move whose pose keeps a little life never stops, so only
  its starts are judged.
- **Twins.** "At least 2 frames at 24 fps apart" is read as the lag that best lines the arms up. Two arms doing different
  things are far apart at every lag; a walk's arms in opposition differ by far more than 10%.
- **Squash.** Impacts are found from the hips alone: a stomp that does not move the hips is not seen. The body has no squash
  shape keys today; the audit reads bone scale (the torso's bones and the body's own).

Classes of move that a check cannot measure are excluded from it, with the reason (`EXCLUDED`, kept in the baseline):

| Class | Moves | Checks | Why |
|---|---|---|---|
| Cycles | the walk, the run, the idle | anticipation, overlap | a cycle has no single action to prepare and no one start or stop to stagger: the walk and the run start and stop when the scene changes their speed, and the idle never stops |
| Swings | Nod, HeadShake, LookAround | anticipation | the head swings back and forth through its rest, so every swing is the counter-movement of the next; a nod's own dip lasts 0.17 s, under the 200 ms anticipation is for |
| Wind-up | WindUp | anticipation | it is itself the anticipation, of the dash the scene plays after it |
| Lying | LieKnead, CarriedPlank | anticipation, arcs, squash | the whole body is tipped onto its back about the hips (and, carried, lifted): every point travels with the tipping |

Pair roles (`Hug:A` …) are played alone, as `pair-poses.js` plays a role without a partner (the fit of the body with
itself): their timing is their own, and their hands' paths are those for a partner of the same size.

The register of each move is in the audit (`registerOf`): comedy for the funny poses (`FUN_POSES`), the pair roles
(`PAIR_ROLES`), Fujita's Back and the other story moves (`STORY_POSES`, Ten Minutes of Heaven), and EvilLaugh, WindUp,
Tackle, Stomp, HeelKick, Tada and Cheer; everyday for the rest. `COMEDY_EXTRA` and `EVERYDAY_EXTRA` correct it.

**The rule (ours):** no new move, and no change to a move, may add a failure. The moves that fail today are listed in
`tests/animation-principles.baseline.json`, each with the checks it fails and the bodies it fails them on; it is written
by `node tools/animation-audit.mjs --write-baseline` and never edited by hand. The test fails:

- on a failure that is not listed (and a move with no entry must pass everything);
- on a listed failure that now passes, until it comes off the list. So the list only shrinks.

Moves come off it most-seen first: walk, idle, talk, wave, nod, eat, drink, sit. A move comes off when it passes the
audit and its sheets have been looked at.

## 6. Where we stand

**27 November 2026.** The standard is adopted. The can drink and its opening are being re-keyed in Blender to it
(briefs/HANDOFF-SAKURA-RESTROOM-2026-11-26.md). The audit and its first baseline are in (branch `audit/principles`): 155
moves (the 150 in `GESTURES`, the walk, the run, the idle, sitting down and standing up) on Vy, Johansson and Sverker.

| Check | Pass | Fail | Does not apply | Excluded |
|---|---|---|---|---|
| Ease | 77 | 77 | 1 | 0 |
| Anticipation | 0 | 132 | 14 | 9 |
| Arcs | 65 | 80 | 8 | 2 |
| Overlap | 0 | 152 | 0 | 3 |
| Twins | 75 | 69 | 11 | 0 |
| Squash | 0 | 15 | 138 | 2 |
| Volume | 155 | 0 | 0 | 0 |
| **Every check** | **1** (the idle, to which only volume applies) | 154 | | |

A move passes a check when it passes it on every body it applies to. What makes most of it fail is a handful of causes in
`animate.js`, not move by move:

- **One curve for the whole body.** Every procedural move drives all its joints from one envelope (its `q`, `e` or `w`),
  and the animator follows every target at the same 14/s, so every level of the drag hierarchy starts and stops in the same
  frame: overlap fails everywhere.
- **No wind-up.** No procedural move is made to go the other way first. Where the effector does go back first, by chance
  (Swipe's arms rising before they come down, SitPresentFood, ReachBack, the hop's bounces), it is for 11–24% of the
  action, or 54% between the hop's bounces, never 30–50%.
- **No squash.** Nothing scales a bone and the body has no squash shape key, so all 15 moves with an impact fail (the run,
  a hard sit, the jumps, the hop, Cheer, Tada, HeelKick, Tackle, Kiss:A and others).
- **The stance snap.** 16 of the 33 residents stand with their hands in their pockets or behind their back: Johansson,
  Thao and Vy among them, and all three bodies the audit picks. Every move that is not one of the story's eased moves
  drops that stance in its first frame and takes it up again in its last (`carryArms` runs only under the `EASED` moves),
  so the shoulders and elbows snap, and the two arms snap as each other's mirror. On Thuan, whose arms hang, 15 more moves
  pass ease (Nod, Wave, SitDown, ScratchHead, HairTuck, CollarTug, HeadShake, Point, Shrug, LookAround …) and 12 more pass
  twins.
- **Poses snapped to.** Moves whose targets jump at their first or last frame (Talk, Kachashi, Stretch, Cheer, Jump, the
  walk's stop) step by all of their speed in a frame.

The audit also found faults that "No glitches" forbids, whatever the principles say:

- **The can drink's motion has a pop.** In the exported motion (`motions/drink-can.js`), the right shoulder turns 0.35 rad
  between two 30 fps keys (at 5.53 s of the motion; 3.08 s into DrinkCanOpened), after 0.03 and before 0.18 and 0.18: in the
  game, 0.75 rad/s, then 10.6 rad/s for two frames, then 5.4. At 60 fps that is 0.18 rad a frame, under the 0.3 that
  `tests/drink-can.test.mjs` allows, so that test does not see it.
- **On Sverker, the drink flips his right elbow** about 0.6 rad and back within a frame, twice, as the rim comes to the lip
  (0.80–0.88 s into DrinkCanOpened, where the arm is put right for his body; up to 37 rad/s). He is not one of the drink
  test's seven bodies.
- **Johansson's head hitches** at 0.3 s into DrinkCanOpened: 1.6 rad/s, 0.3, then 1.75.
- **Jump's crouch never reaches the hips.** The root's 8 cm down is taken back by the feet held to the floor; the hips rise
  6 mm, then leave at 1.2 m/s in a frame.
- **Eating and drinking jump the hand.** In Eat, Drink, SitEat, SitDrink and SitToast the right hand jumps 9–22 cm in the
  move's first frame (the consumption pose takes the arm over without the animator's follow), and 7–25 cm in a frame as
  the move ends and lets it go: on every body.
- **Eat and Drink drop the hand from the mouth** to the waist, 47 cm in a fifth of a second (4.45 m/s at its fastest), on
  a dead straight line (0% off it).

The worst offenders, most seen in play first (the worst of the three bodies; frames are game frames):

| | Move | Fails | Measured |
|---|---|---|---|
| 1 | Walk | ease | at the stop the hips, chest and head step by all of their speed in a frame (from the stride to the idle as the speed falls below 0.08 m/s) |
| 2 | Talk | ease, arcs, overlap | the arms snap into the talking pose at 0 s (100% in a frame); the hand's first stroke 8–10% off a 20–28 cm chord; primary and secondary start together |
| 3 | Nod (listening) | ease, overlap, twins | the stance snap (elbows 100% at 0 s and at 1.1 s), mirrored; the nod itself is eased |
| 4 | Wave | ease, anticipation, overlap | the stance snap; no counter-movement before the 0.5 s raise; the shoulder, elbow and hand start in the same frame, stop 0–2 frames apart |
| 5 | Eat | ease, arcs, overlap | the hand jumps 9–22 cm in the first frame and 11–25 cm at the end; the hand's 47 cm drop from the mouth 0% off straight; levels start together |
| 6 | SitEat | ease, arcs, overlap | the hand jumps 10–21 cm in the first frame and 11–20 cm at the end; the same straight drop |
| 7 | Drink | ease, arcs, overlap | as Eat: the jumps, and the drop 0.8–0.9% off a 27–47 cm chord |
| 8 | SitDrink | ease, arcs, overlap | steps of 105–114% at 0 s and 2.43 s; straight strokes (0.8–0.9%); the secondary stops before the primary |
| 9 | DrinkCanOpened | ease, anticipation, arcs, overlap | the pop at 3.08 s (the right wrist's turn steps by 160% of its top speed in a frame), Sverker's elbow flip, the head's hitch, the stance snap; no counter-movement before the 0.97 s lift (5–28 mm back, 2.3–3.7 cm needed); the release from the lip and the return to it straight (2.6–7.7% off 15–26 cm); the blend starts every level together |
| 10 | DrinkCan | ease, anticipation, arcs, overlap | the same pop at 5.53 s; the opening's left hand starts at 71% of its top speed; no counter-movement before the lift; straight strokes (2.3–7.4%) |
| 11 | SitDown | ease, anticipation, overlap, twins, squash | the arms snap out of the standing stance at 0 s, mirrored; the hips go back and down with no counter-movement; on Vy and Sverker the hips land at 0.6–0.8 m/s with no squash |
| 12 | StandUp | ease, anticipation, overlap, twins | the head and shoulders step 100% at 0.48 s as the seat lets go; no counter-movement; mirrored |
| 13 | ScratchHead (habit) | ease, anticipation, arcs, overlap | the stance snap; no counter-movement; the hand over the head loops 51–54% off its chord, past a half circle |
| 14 | HairTuck (habit) | ease, anticipation, overlap | the stance snap; no counter-movement; levels start together |
| 15 | HeelRock (habit) | ease, anticipation, overlap, twins | the arms step 108–135% at 2.42 s, mirrored; no counter-movement |

The other habits (ChinTap, CollarTug) fail the same way; the run fails ease, arcs (Johansson's arm swing 9% off straight,
the others' hands looping as they stop) and squash (every footfall). The full list, every move with its numbers, is the baseline and the audit's report. Until a move is off
the baseline, assume it does not comply.
