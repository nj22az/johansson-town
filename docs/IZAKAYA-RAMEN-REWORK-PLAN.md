# Minato Izakaya and Sato Ramen rework

Progress (tick as each part ships):

- [x] 1a Walls and posters of 1997
- [x] 1b Interactive items (pink phone, bottle keep, karaoke, inspects)
- [x] 1c People at every hour, cleaning when closed
- [x] 1d Light (open lantern glow, closed work light)
- [x] 2 Sato Ramen detail pass


## Context
The user wants Minato Izakaya brought up to the detail level of Thuan's konbini, then the same
for the Sato Ramen side shop. The izakaya must also have:
- posters typical of the period (1997);
- interactive items;
- people inside at all hours, even while it is closed. Entering when closed should show the
  staff cleaning.

Findings:
- **The building:** Minato is one GLB that we generate ourselves (`tools/blender/build-minato-interior.py`).
  It holds Minato, its kitchen and Sato Ramen (x 6.5–11.4). It is dressed at runtime by:
  - `buildIzakayaRoom` (`src/world/izakaya.js:105`): menu strips, nine point lights, the Barfly
    mascot, the Hawaii Lager sign;
  - three posters (`interiors/izakaya-posters.js`);
  - a CRT TV.
- **Blender is not installed here**, so all new detail is code-built and layered over the GLB, as
  in Sakura.
- **Hours and access:** open 16:00–03:00 (`izakayaOpen`, `people/social.js:25`). Entering is never
  blocked (game.js:831), but outside hours the room is empty apart from Nao's 15:00 "tidying".
- **People today:**
  - Nao stands at a fixed spot [3.5,0,-3.8] (`indoor-residents.js:23`).
  - Guests walk door → stand → seat (`createIzakayaGuests`).
  - The Barfly lives where he drinks.
  - Mrs Sato cooks at the ramen counter 10:30–14:00 (`people/ramen-kitchen.js`).
- **No cleaning animations exist:** there is no Sweep, Wipe or Mop pose for residents (only
  Use, CarryIdle and Greet; "wiping the counter" is just 'Use').
- **Reusable from Sakura:**
  - the print-sheet plus merged-mesh pattern (`sakura-corners.js`);
  - per-instance UV variation (`shelf-flavours.js`);
  - the poster helpers in `sakura-dressing.js` and `store-advertising.js`;
  - the swing door (`sakura-life.js`);
  - the budget test (`tests/sakura-budget.test.mjs`);
  - the screenshot rig (`scratchpad/room.mjs`, with `ROOM=izakaya`).

No new characters. "Always people" uses the existing cast:
- **Nao:** the owner.
- **The Barfly:** he already lives at Minato; he works off his tab by cleaning.
- **Mrs Sato:** she shares the kitchen.

The plan is also saved in the repo as `johansson-town/docs/IZAKAYA-RAMEN-REWORK-PLAN.md`, with
checkboxes, so it can be resumed or shared.

## Part 1: Minato Izakaya

### 1a. Walls and posters of 1997 (fictional, period-typical)
New `src/world/interiors/izakaya-dressing.js`: one print sheet (2048²) plus merged meshes, as in
`sakura-corners.js`.
- **Posters:**
  - a beer campaign (Umineko Beer, summer 1997);
  - an awamori brewery calendar, open at October 1997;
  - a local baseball team's schedule;
  - an enka singer's concert at the harbour hall;
  - an Eisa festival poster (reuse `eisaPoster` by exporting it);
  - a "No drink-driving" police notice;
  - a karaoke contest flyer.
  - All are aged a little: sun-faded and taped.
- **Wall menu:** the handwritten board of the day's specials, plus price tags on the tanzaku that
  already hang there.
- **Bottle keep:** a wall shelf of named regulars' awamori and shochu bottles, each with a
  hand-written neck tag (Kenji, Mr Higa, Officer Mori…). Instanced with per-instance label UVs
  (the `shelf-flavours.js` pattern).
- **On the counter:** a sake bottle row, oshibori warmer, ashtrays (it is 1997), soy and shichimi
  caddies on every table, chopstick boxes, a tanuki statue and a shisa pair at the door.
- **Above:** red chōchin lanterns over the counter.
- **Floor:** beer crates by the kitchen.

### 1b. Interactive items (new anchors and actions)
- **Pink public phone (ピンク電話):** "Make a call" with ¥10 coins. It rings the harbour office or
  the ferry desk with short scripted replies.
- **Bottle keep:** "Read the bottle tags" lists regulars and their bottles. "Keep a bottle"
  (¥2,500) adds your own tag to the shelf, saved.
- **Laserdisc karaoke:** "Sing a song" picks from three period songs and shows the lyric card.
  It is open-hours only, and Nao reacts.
- **Small inspects:** the day's specials board, the tanuki ("pat the tanuki"), the baseball
  schedule (the next home game), the drink-driving notice.
- **When closed,** order and karaoke anchors say "Minato opens at four", not "unavailable".

### 1c. People at every hour, cleaning when closed
New `src/people/izakaya-hours.js`, a closed-hours routine driven by the town clock:

| Time | Who | What |
|---|---|---|
| 03:00–04:00 | Nao and the Barfly | Closing: Nao wipes the counter; the Barfly stacks stools onto it and mops |
| 04:00–10:00 | The Barfly | Asleep on the koagari under a jacket (Nao goes home; her sleep 04:00–12:00 is unchanged) |
| 10:00–15:00 | The Barfly | Sweeps, washes and polishes glasses at the sink, carries crates in |
| 10:30–14:00 | Mrs Sato | At the shared kitchen line, already seen through the pass |
| 15:00–16:00 | Nao | Opening: prep at her station, the Barfly takes the stools down |

- **Animations:** new procedural poses in `src/avatars/animate.js`: Sweep, Wipe, Mop, Polish,
  Stack. Each is a looping arm and torso motion with a held prop (broom, cloth, mop, glass),
  attached to the hand bone the way existing carried items are. Reuse the route → walk → work
  state machine from `ramen-kitchen.js` for moving between cleaning stations.
- **Closed look of the room:**
  - stools upturned on the counter and benches;
  - noren taken inside and leaning by the door;
  - half lights (a work light over the counter, the rest dimmed);
  - a mop bucket on the floor;
  - the TV off.
  - All of this is toggled by `izakayaOpen(minutes)`.
- **Entering while closed:** the room loads normally, with the line "Minato is closed. Nao is
  cleaning up." (or the Barfly, depending on the hour). "Talk" works with whoever is there:
  short closed-hours lines.

### 1d. Light
- The warm lantern look when open, with a soft additive glow on the counter top like Sakura's
  floor sheen.
- The work-light look when closed.

## Part 2: Sato Ramen (after Part 1)
New `src/world/interiors/sato-ramen-dressing.js`, same patterns:
- **At the counter:** a condiment caddy at every seat (pepper, garlic press, pickled ginger, chilli
  oil), bowls stacked behind the counter, a noodle box and a broth pot with lid, water jug and
  cups, a tissue box per seat, a rice cooker.
- **On the walls:** 1997 posters (a beer brewery, a local festival, a noodle-maker's calendar),
  a "today's bowl" board, and a handwritten "closed on Wednesdays" note.
- **Interactive:**
  - the ticket machine with real buttons (pick → ticket → order, via `ramen-player-service.js`);
  - "Add pepper";
  - the delivery box (okamochi) by the door: "Ask about delivery".
- **Closed hours:**
  - stools up and noren in;
  - Mrs Sato washes up and wipes down 14:00–15:00 (Wipe and Polish poses), and preps broth
    09:30–10:30 after her fish run;
  - outside those times the ramen side is dark but tidy, with Minato's people visible through
    the shared room.

## Performance
- New `tests/izakaya-budget.test.mjs`: build the shared room and cap draws at today's + 30, with a
  triangle ceiling.
- Prints are one sheet each; props are merged; bottles and caddies are instanced.
- Check `vcalls`-style numbers on the phone viewport inside Minato and inside Sato Ramen.

## Rules
- Japanese text appears only inside `fillText`; new files go on the english-inventory scenery
  list, and the check stays at 0.
- No new characters. Follow CLAUDE.md: keep it clean even while dense.

## Critical files
- New:
  - `src/world/interiors/izakaya-dressing.js`
  - `src/world/interiors/izakaya-interactive.js` (phone, bottle keep, karaoke)
  - `src/people/izakaya-hours.js`
  - `src/world/interiors/sato-ramen-dressing.js`
  - tests: `izakaya-dressing`, `izakaya-hours`, `izakaya-budget`, `sato-ramen-dressing`
  - `docs/IZAKAYA-RAMEN-REWORK-PLAN.md`
- Edit:
  - `src/world/izakaya.js` (wire-up; closed look)
  - `src/avatars/animate.js` (cleaning poses and props)
  - `src/people/indoor-residents.js` and `social.js` (closed-hours occupants)
  - `src/game.js` (closed entry line, anchors gated by hours)
  - `src/world/interiors/sato-ramen.js`
  - `src/people/ramen-kitchen.js` (wash-up and prep jobs)
  - `scripts/english-inventory.mjs`

## Verification (each step)
- Screenshots in Minato at 20:00 (open, busy), 03:30 (closing), 08:00 (Barfly asleep) and 12:00
  (sweeping, with Mrs Sato at the kitchen). For Sato Ramen at 12:00 and at 14:30. Sent to the user.
- Tests:
  - the hours routine puts at least one person in Minato at every hour of a simulated day;
  - closed-hours poses are cleaning poses;
  - the anchors' open and closed behaviour;
  - the bottle-keep save round-trip;
  - the budget.
- Full `npm test`, `npm run build`, english-inventory at 0, and the `reload-ios.mjs` save restart.
- Commit and push the branch and `HEAD:main` after each sub-part (1a, 1b, 1c+1d, 2).
