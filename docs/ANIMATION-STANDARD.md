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

`tests/animation-principles.test.mjs` and `tools/animation-audit.mjs` will play every move in `animate.js` `GESTURES`
(and the walk, run, idle and sitting) on three bodies, sampled at 60 fps. They measure:

| | What is measured | Passes when |
|---|---|---|
| Ease | each joint's angular speed at the start and end of each segment; its change from frame to frame | it starts and ends near rest, with no step in velocity (thresholds calibrated on the Blender drink, which passes, and on a linear `lerp` fixture, which must fail) |
| Anticipation | the primary hand or head along the action's direction, for actions over 200 ms | it first moves the other way, for 30–50% of the action's length |
| Arcs | the primary hand, head or held prop between rests, for travel over 10 cm | its path is 10–20% (or 30–50% when sweeping) off the straight line |
| Overlap | when each level of the drag hierarchy starts and stops | each level 5–10 game frames after the one before |
| Twins | the two arms in a move where both move | not mirror images (≥ 2 frames at 24 fps apart, or ≥ 10% different) |
| Squash | impacts (the hips' fall reversing) | a 2–5% (comedy: 10–20%) squash at contact, volume kept |
| Volume | every bone's scale | the product stays 1 (±1%) outside squash |

**The rule (ours):** no new move, and no change to a move, may add a failure. The moves that fail today are listed in
`tests/animation-principles.baseline.json`. That list may only shrink, most-seen moves first: walk, idle, talk, wave,
nod, eat, drink, sit. A move comes off the list when it passes the audit and its sheets have been looked at.

## 6. Where we stand

- **27 November 2026.** The standard is adopted. The can drink and its opening are being re-keyed in Blender to it
  (briefs/HANDOFF-SAKURA-RESTROOM-2026-11-26.md). The audit and the first baseline are being built. Until the baseline
  exists, assume a move does not comply until it has been checked against section 3.
