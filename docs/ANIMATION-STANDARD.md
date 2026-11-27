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
| Arcs | at least 10% of the travel; 10–20% the default for a keyed stroke (`arc-mastery`, "subtle organic feel"), up to 50% where a turn about a joint sweeps it (a wave, a stretch) | 30–50% (`arc-mastery`, "dramatic sweeping motion") |
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
   - Hands, heads, feet and held props travel on curves, never on the straight line: at least 10% of the travel off it,
     10–20% by default, 30–50% when sweeping (a turn about a joint sets its own arc; the audit's ceiling is the guideline's 50%).
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
(`Infinity`) over its way in and a 2 s hold, each against the body at rest in the frame before it starts. `node tools/animation-audit.mjs [--moves a,b] [--bodies a,b] [--out dir]`
writes every move's, body's and check's numbers to `output/animation-audit/animation-audit.json` and the table to
`animation-audit.txt` (about 95 s).

| | What is measured | Passes when |
|---|---|---|
| Ease | each joint's movements from one rest to the next: its speed in the first and the last frame (above the rest), against its top speed; its velocity's change from one frame to the next | neither edge is over half the top speed, and the velocity never steps by over half of it in a frame (a movement under 8 frames: by over nine tenths) **(ours)** |
| Anticipation | the primary effector (whichever of the hands, the head, the hips and the feet travels furthest; the hips for sitting and the jumps). Its action is the stroke in which it first comes half way to its furthest; its counter-movement is how far it first goes back along that line, and for how long | an action over 200 ms has a counter-movement of at least 5% of its travel and 5 mm **(ours)**, lasting 30–50% of the action |
| Arcs | each stroke of the primary hand or head (a foot in a foot move; a held prop where a move names it) between two rests, over 10 cm: how far the path goes from the straight line between its ends, over that line's length | everyday 10–50%, comedy 30–50% (below) |
| Overlap | when each level of the drag hierarchy first and last moves: a joint starts where its first movement passes a tenth of that movement's own top speed, and stops where its last falls under a tenth of its own (never under 0.08 rad/s); root (hips, spine), primary (chest, neck, head, upper arms, thighs), secondary (forearms, hands, shins, feet), a leg only when its foot leaves the floor by 3 cm | each level starts and stops 5–10 game frames after the one before (10–20 across a level that does not move) |
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
  place, are placed by their reach from the root **(ours)**, and take part only when their foot leaves the floor by 3 cm
  **(ours)**: a foot on the floor holds its leg, and the overlap gives way to that contact. A held move whose pose keeps a
  little life never stops, so only its starts are judged. Starts and stops are read off each joint's own first and last
  movement **(ours)**: until stage 1 (section 6) they were read at a tenth of the joint's top speed over the whole move,
  which called a joint with one fast stroke stopped while it still turned back into its rest at half a radian a second,
  and one with a fast sway late in the move started late. A fixed speed instead kept a fast joint moving longer than a
  slow one with the same curve. The floor of 0.08 rad/s is above the idle's breath and sway (0.02–0.05 rad/s).
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

### Stage 3, begun: the trunk's wind-up (27 November 2026, branch `anim/stage3`)

**What was found.** The audit counts a counter-movement only where the effector moves faster than a tenth of the action's
top speed (a slower one is rest). The everyday arm raises ramped in a quarter of a second, linearly (4-6 frames at 24 fps,
"Quick (snappy responses)", `timing-principle-mastery`): the Wave's hand reached 4.2 m/s. Against that, no calm dip
registers. An arm hanging at the side also has no room to turn the other way in its own joints.

**What was done** (`animate.js` `TRUNK`, `WIND_TRUNK`, `RISE`, `windTrunk`):

- **The everyday raises rise at a natural pace** (`RISE`: Wave, Point, ScratchHead, ChinTap, CollarTug, Clap). They come
  in over 0.4 s, eased (the clap 0.5), and start from where the arm hangs, a little out from the side: their poses began
  from straight down, against the side. The Wave lasts 2 s (from 1.6), so its waving is not cut short by the wind-up.
- **The wind-up is the chest's: a dip of the shoulder.** As the move starts, its pose is tried (stage 2's tries). The
  hand that goes furthest, and the line of its action, are read by forward kinematics on the body's own bones. A weighted
  least-squares solve finds the chest's lean, dip or turn that carries that hand back along the line by 11.5% of how far it
  goes (everyday; 15% comedy). The arm adds only its own swing back along the line and away from the body (never in toward
  the side), and the elbow opens a little (at least 0.05 rad) so the forearm trails a level behind.
- **Its timing.** In over 20% of the action (0.08-0.12 s), held at the bottom for 40% of it ("full crouch with held pose
  before launch"; the shrug's 50%, the kachāshī's 35%), let go over 80% of it as the arm rises; the move waits for it.
- **Not the spine.** A root that moves only for the wind-up stops long before the rest (overlap), and the drag holds the
  chest a level behind a moving root, which spread the dip too thin to read. Where a move's own action bends the spine,
  the spine leads the wind-up instead (`TRUNK.rooted`); no move in the set does yet.
- **Never into the body.** The part of the dip that would carry a hand into the body beside it is taken out of the goal
  (the body's surface normal from `bodyVolume`), and the hand is led a centimetre clear. The other hand stays by the hip:
  its upper arm turns back against the lean, forward or back fully and sideways by 30%. Taking all of the sideways swing
  back pressed the forearm 7-17 mm deeper into the hip than the pocket has it (`tests/stance-release.test.mjs`), so that
  hand still swings out about 3 cm as the chest leans.
- **The head keeps level** (70% of the chest's tilt taken back at the neck) and leads toward the action.

Only the moves where it passes and adds no failure have it: Wave, Point, ScratchHead, ChinTap, CollarTug, Clap, Kachashi
(its ease), Shrug. The others want their own wind-ups (stage 3's list in the handover):

- Talk and Laugh: the hands' strokes flatten or bow past a half circle.
- HairTuck: Sverker's hand from behind his back to the ear goes past a half circle.
- Bow: its head's lean back is a straight 10 cm stroke on Johansson, and Vy's levels start together.
- HeelRock, DramaFinish: the levels start out of order.

| Check | Before stage 3 | Now |
|---|---|---|
| Ease | 122 of 154 | 123 of 154 |
| Anticipation | 17 of 141 | 19 of 141 |
| Arcs | 69 of 146 | 69 of 145 (Shrug's hand no longer makes a 10 cm stroke) |
| Overlap | 55 of 146 | 56 of 146 |
| Twins | 63 of 129 | 63 of 129 |
| Squash | 0 of 15 | 0 of 15 |
| Volume | 155 of 155 | 155 of 155 |
| **Every check** | **6** | **7** (the Wave) |

Off the baseline, none added (26 entries, 1088 to 1062):

- the Wave altogether;
- anticipation: ScratchHead on all three; Point, ChinTap, Clap and Shrug on Vy and Johansson; CollarTug on Vy and Sverker;
- arcs: ScratchHead on all three;
- ease: Kachashi on all three;
- twins: Shrug on Vy and Johansson.

The wind-up costs once a move, as it starts: that frame takes about 0.3 ms where it took 0.05 (Johansson, Wave: ten tries
of the move as in stage 2, and about forty short bone-chain evaluations); the frames after are unchanged (26-27 µs).

**Sheets**, before and after (`node tools/hand-shots.mjs --moves … --wind`, a new strip of every third frame over the
wind-up; `output/anim-stage3/wind/before/` and `after/`, the seven moves on Johansson and Thao):

- The wind-up reads as a dip of the shoulder: the chest leans 10-15 degrees toward the raised arm, its hand sinks and comes a
  little in front, the head stays nearly level, then the arm swings out and up.
- No pop: each strip moves evenly from frame to frame.
- It is not subtle on the small bodies. Vy needs about 0.28 rad of lean to carry her hand back 5% of its way: her trunk
  moves the hand about half as far per radian as Johansson's.
- The other hand hangs a little away from the hip while the chest leans, then is back.

### Stage 2, begun: wind-ups read from the move (27 November 2026, branch `anim/stage2`)

- **First, a stage 1 fault mended.** A move cut off before its end (stopped, or another played over it) let go of its pose
  in a frame; the drag carried that step into the frames after, and `tests/avatar-wardrobe-sets.test.mjs` (not in the
  guard) saw a garment set's points jump up to 24 cm in a frame where the bare body's jumped 21. A cut now fades over the
  same 0.32 s as a change of way of being (`FADE`).
- **Anticipation** (`animate.js` `WIND`, `windRead`, `windStep`). When a move starts, the animator tries its pose through
  its first half and reads its action from it: where it first comes nine tenths of the way to the furthest it goes (the
  action's length), and every joint's turn to get there. The move then waits 40% of that (0.08–0.3 s) while the trunk and
  the arms ease the other way, by 15% of the turn for everyday moves and 35% for comedy's, and plays on a little quicker,
  so it ends when it would have; the wind-up is let go over the action's first 60%. The head and the neck lead instead (the
  eyes go first) unless they make most of the move. Never into the body: an upper arm is not brought in against the side,
  an elbow never straightens past straight. It starts in the move's first frame, so a move the player asks for shows at
  once. Its one-off cost is ten tries of the move as it starts.
- Tried on every move, it passes the audit's anticipation and breaks nothing on 23 (`WIND_ON`: HeelRock, PickUp, Tackle,
  Hop, EvilLaugh, SwitchHigh, HeroicPride, DeepThinker, Heartbreak, BattleRage, BashfulPose, BowDeep, FingerStop, Tape,
  Offer, Reach, CordWrapped, BasketHead, PointLaugh, Sneak, Fume, Eyeroll, Seethe), and only those have it. On the rest:
  - too small: an arm raised from the side (Wave, Talk, ScratchHead, Laugh) has no room to go the other way in its joints
    without going into the body, so the hand goes back 0–5 mm of the 10–37 mm needed; Point and Bow come near it on some
    bodies, not on all;
  - it bows a hand's path past a half circle (HairTuck, ShakeFists, WriteAbove, Flex, VictoryStand, SitPresentFood) or
    flattens it (Talk on Vy);
  - it starts every level together (Bow, Fist, Hurt, EnkaReach, FishIdle, Cheer, Switch): the root does not move in it, so
    the upper level takes no lag.
  These want wind-ups made for them: a dip of the shoulder or the chest that carries the hand back, not the arm's own turn.

| Check | Before stage 2 | Now |
|---|---|---|
| Ease | 121 of 154 | 122 of 154 |
| Anticipation | 1 of 142 | 15 of 141 |
| Arcs | 67 of 146 | 67 of 146 |
| Overlap | 49 of 146 | 55 of 146 |
| Twins | 63 of 129 | 63 of 129 |
| Squash | 0 of 15 | 0 of 15 |
| Volume | 155 of 155 | 155 of 155 |
| **Every check** | **5** | **6** |

Off the baseline: DeepThinker altogether; 57 anticipation entries, 22 overlap entries and 1 ease (1181 entries to 1102).
One went on, explained: ReachBack's overlap on Vy. `tests/fujitas-back-moves.test.mjs` found ReachBack's mitten 13 cm from
the breaker's lever as the lever moves (stage 1: the hand came a level late); its reaching arm is now pinned from the
move's start and arrives on time, and on Vy, whose other hand stays in her pocket, the only forearm that moves is that
pinned one, so its levels stop 4 frames apart where 5 are asked. The contact wins. A pin now also lets go eased: dropped
in a frame, it stepped the elbow.

Not sat: tried on a chair, the turn the other way put FingerStop's forearm 59 mm into Miss Higa
(`tests/story-gestures.test.mjs`). Its cost is once a move, as it starts: that frame takes about 145 µs where the others
take 27 (Johansson, PointLaugh). A body already eating or drinking the first time it is seen now has the bite or the rim
where it is, not on its way (`tests/drink-grip.test.mjs`, a stage 1 fault).

Sheets, before and after (`output/anim-stage2/before/` and `after/`: PointLaugh, Eyeroll, BowDeep, Hop and Tackle on
Johansson and Thao). The wind-up is calm on the everyday moves: in PointLaugh's first frames the hands hardly move before
the point; it shows as a beat of stillness and a slight draw back rather than a gesture of its own.

Not done yet in stage 2: squash on impacts (Jump's crouch first), the twins' offsets, the arcs the stance's blend bends
and the moves still played without the drag (`ARCS_WITHOUT_DRAG`), the settle's micro-overshoot, the lift's and the run's
velocity steps. The handover has where each stands.

### Stage 1: the stance, the drag, the eating hand (27 November 2026, branch `anim/stage1`)

What was done, all in `animate.js` but for the lift's bow (`consume.js`):

- **The stance as a movement** (`stanceStep`, `STANCE`). An arm a move takes comes out of the pockets or from behind the
  back from the move's first frame, on an eased curve (a hermite from where it is and as fast as it is going) over 30% of
  the move (0.15–0.3 s), and goes back over the move's last 40% (0.17–0.35 s), so it is in the stance as the move ends.
  The two arms leave as their moves take them. From behind the back the upper arm swings out by up to 0.2 rad on the way,
  so the bent forearm does not drag across the back. `tests/stance-release.test.mjs` (in the guard) plays seven moves on
  five stance bodies: no hand or forearm goes deeper into the torso or the thighs on the way than at either end, and no
  hand jumps.
- **The drag hierarchy** (`dragStep`, `LAG` 7 game frames a level). Each joint plays the target its level had that long
  ago: the root leads; the chest, neck, head and upper arms follow; the forearms and hands follow them; the grip a level
  after the hands. The upper level's lag holds only while the root moves (a move that leaves the root still has nothing
  to follow, and the upper arms must answer within 100 ms), and takes its lag at once when the root sets off from
  stillness. The drag is on standing and sat on a chair; walking, running, riding, climbing, driving, in the air, lying,
  kneeling and on the floor keep no lag. Contacts pin it: an arm the reach solver has held on a wheel, a handlebar, a
  table, a partner or a placement for two lags moves as one with its hand, which never leaves what it holds. The settle
  is each joint's own follow: no overshoot. Nineteen moves whose hands were keyed on arcs made without the drag (Heart,
  HoldOn, IdolDance, Facepalm, Flex, Swoon, the dances and others, `ARCS_WITHOUT_DRAG`) play without it until stage 2
  keys them again.
- **From one way of being to another** (`FADE`, 0.32 s): standing, walking, running, sitting, climbing; the walk's stride
  eases down to its stop. The walk's stop and StandUp's step at 0.48 s no longer step.
- **Eating and drinking.** The consumption pose is blended in from where the arm was and out back to it, level by level,
  at a critically damped 9/s, and its reach starts each frame from where it left the arm (the forearm's twist no longer
  flips as the hand comes up). The lift to the mouth and the drop from it are bowed by 15% of their chord
  (`consume.js LIFT_ARC`), and the drink poses ease in. On the way back to hands in the pockets the hand lags half a level,
  behind the back a quarter: with the whole lag the arm was down by the side while the forearm was still bent for the
  mouth, and the hand went 2 cm into the hip. The overlap gives way to the body, as it does to what a hand holds.

| Check | Before | After |
|---|---|---|
| Ease | 77 of 154 | 121 of 154 |
| Anticipation | 0 of 132 | 1 of 142 |
| Arcs | 65 of 145 | 67 of 146 |
| Overlap | 0 of 152 | 49 of 146 |
| Twins | 75 of 144 | 63 of 129 (66 fail, from 69: more moves have one arm still) |
| Squash | 0 of 15 | 0 of 15 |
| Volume | 155 of 155 | 155 of 155 |
| **Every check** | **1** | **5** |

Off the baseline: the walk, Nod, HeadShake and LookAround altogether; 140 (move, body) failures of ease, 198 of overlap,
21 of arcs, 13 of twins and 1 of anticipation (1506 entries to 1181). On it now, and worse:

- **Anticipation, 35 entries on 13 moves** (Talk, Jab, JabL, Kachashi, Phone, FishIdle, IdolDance, AirGuitar, EnkaReach,
  RobotDance, ChickenDance, JellyWobble, DramaFinish). They were not judged before: their action snapped in under 200 ms;
  eased, it takes longer and has no wind-up. Stage 2.
- **Arcs, 13 entries.** The way out of the pockets and back is a blend of the stance and the move, and on these it bows
  past a half circle or too little: Talk on Johansson (56% off a 12 cm chord), HandsOnHips on Johansson (63%, 15 cm),
  HoldOn and Kachashi on Vy and Johansson (52–53%), Jump on Vy (9.9%), Fidget on Vy and Johansson (9.4–9.6%), AirGuitar on
  all three (5.7–8.2%), EvilLaugh on Sverker (25%, as it is on the others already). Stage 2 keys them with the stance in.
- **Eat and Drink keep failing overlap** (the secondary stops 1–3 frames after the primary), by the body rule above.

What is left on the most-seen moves: the walk passes everything that applies; Nod passes everything; Talk passes ease,
overlap and twins (anticipation, and arcs on Johansson and Sverker, fail); Wave passes ease and arcs (no wind-up, and its
levels start 11 frames apart on Vy and Johansson, over 10); Eat, Drink, SitEat, SitDrink and SitToast no longer jump the
hand and pass arcs but on Sverker, but the elbow or the hand still steps by 50–72% of its top speed in the quick lift at
0.7–1.75 s (the reach's fold, there before; stage 2); SitDown and StandUp pass ease (no wind-up, no squash, arms
mirrored); the run steps Vy's knee by 57% at its stop. The face and the fingers have no joints of their own in the
animator: the face keeps no lag yet, the grip lags its hand, and what the hand holds is held rigidly.

Sheets in the game's shader, before and after (`node tools/hand-shots.mjs --moves Walk,Talk,Nod,Wave,Eat,SitEat --name
<who> <dir>`; `output/anim-stage1/before/` and `after/`, Johansson and Thao): front and three-quarter at key moments, and
8 consecutive frames where the stance is left and taken again. Seen in them:

- **Eat (Thao).** Before, the right hand jumped from the pocket to the belly between frames −1 and 0, and back between
  frames 144 and 145. After, nothing jumps: the hand is still by the pocket at 0.15 s and lifts from there, and is back in
  the pocket by 2.7 s. The strip at the move's end shows the hand still holding the bite at the belly: the hand-back comes
  after the move's last frame, over about half a second, so the strip misses it.
- **Wave (Johansson).** The arm leaves the pocket gently (at 0.15 s a third of the way out, where before it was already
  swung far out at full speed); the wave itself is as it was; it comes back into the pocket eased, no pop.
- **Talk (Johansson).** The arms come out of the pockets over about half a second; before they were in the talking pose
  at once.
- **SitEat (Johansson).** No jump at either end; the hand comes back to the thigh eased.
- **Walk (Johansson).** The last step now finishes: at 3.1–3.2 s the right foot is still lifted in it, where before both
  feet were already together at 3.2 s. Whether that last step reads as a step or as a foot stepping in place after the body
  has stopped wants a look in motion.

The animator's cost, per resident per frame (`animator.update` alone, eight residents, medians of seven runs alternating
with the code before, on a shared machine, so to a few microseconds): idle 24 → 27 µs, walking 23 → 25, a gesture 19 →
24, a funny pose 19 → 22, eating 46 → 55, sat 113 → 113, eating sat 145 → 147. The edition's budgets (`src/edition.js`)
are by feature, not time; at 33 residents the extra is about 0.1 ms a frame, 0.3 ms if all of them ate at once.

### The first audit (27 November 2026, branch `audit/principles`)

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

- **The can drink's pops are gone** (re-keyed on drink/can): no joint's speed changes by 0.06 rad a frame on the nine bodies of
  `tests/drink-can.test.mjs`; Sverker's elbow flip and Johansson's head hitch with them.
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
| 9 | DrinkCanOpened | ease (Vy, Sverker), overlap | re-keyed (drink/can): anticipation, arcs, twins and volume pass on the three bodies, ease on Johansson; the last steps 63-64% (Vy as the can comes off the lips, Sverker at the first pull's onset); overlap: since the general stance easing, both levels stop in the move's last frame |
| 10 | DrinkCan | ease (Vy, Sverker), overlap | the same; the opening's anticipation 36-46% of the reach, the raise's 33-41%; Sverker's elbow steps 68% in the opening's dip |
| 11 | SitDown | ease, anticipation, overlap, twins, squash | the arms snap out of the standing stance at 0 s, mirrored; the hips go back and down with no counter-movement; on Vy and Sverker the hips land at 0.6–0.8 m/s with no squash |
| 12 | StandUp | ease, anticipation, overlap, twins | the head and shoulders step 100% at 0.48 s as the seat lets go; no counter-movement; mirrored |
| 13 | ScratchHead (habit) | ease, anticipation, arcs, overlap | the stance snap; no counter-movement; the hand over the head loops 51–54% off its chord, past a half circle |
| 14 | HairTuck (habit) | ease, anticipation, overlap | the stance snap; no counter-movement; levels start together |
| 15 | HeelRock (habit) | ease, anticipation, overlap, twins | the arms step 108–135% at 2.42 s, mirrored; no counter-movement |

The other habits (ChinTap, CollarTug) fail the same way; the run fails ease, arcs (Johansson's arm swing 9% off straight,
the others' hands looping as they stop) and squash (every footfall). The full list, every move with its numbers, is the baseline and the audit's report. Until a move is off
the baseline, assume it does not comply.
