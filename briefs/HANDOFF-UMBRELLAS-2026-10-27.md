# Handover: residents open umbrellas in the rain (27 October 2026)

**State: implemented on branch `claude/umbrellas-in-rain` (from `main` at `f2361443`). Not published.** It goes to
`main` only on the owner's word.

## Why

The owner asked to learn from Shenmue's town simulation (studied from LemonHaze420's decompilation, kept as a private
archive for study only; no code or data from it is used here). Most of what makes Shenmue's town feel alive World already
has: the device calendar, weekday/weekend rotas, catch-up on return, residents keeping their timetables out of sight. The
visible gap was rain: residents mentioned it in greetings but nobody carried an umbrella. The owner chose this first
(27 October 2026).

## What it does

- Everyone out in the street when it rains has an umbrella up in the right hand. It folds away indoors, and nobody has
  one with their hands busy: carrying, a drink or dish, a tool, seated, asleep, cycling, driving, climbing a stair, using
  a town object, or while the player is steering them (`wantsUmbrella`).
- Colours have reasons (`UMBRELLA_COLOURS`): navy for grown-ups, the everyday long umbrella of 1990s Japan (and the one
  Sakura keeps by the door); yellow for children under 13, the school safety colour; pink for Thuan, her favourite.
- Held as people hold one: the elbow down, forearm up, the hand still at the chest while the rest of the walk carries on;
  the shaft leaned towards the head (at most 0.32 rad) so the canopy is over it, raised until its low side clears the head.

## Where

| File | What |
| --- | --- |
| `src/avatars/umbrella.js` | the umbrella (eight ribs, crook handle), colours with reasons, `fitUmbrella`, `wantsUmbrella` |
| `src/avatars/animate.js` | the umbrella arm pose (`s.umbrella`) |
| `src/avatars/actors.js` | builds, attaches and fits it from `userData.umbrella` |
| `src/people/schedules.js` | sets `userData.umbrella` for street residents each update |
| `tests/umbrella.test.mjs` | the rule, the colours, and for Thuan, Mr Fujita and Johansson walking: canopy within 0.1 m over the head, low side clear, lean within limit, steady |

## Checked

- `tests/umbrella.test.mjs` 7/7 on `main`'s code.
- Headless renders of Thuan, Mr Fujita and Johansson walking (front, side, oblique and straight down). The first fit held
  the arm too far forward and put the canopy 0.4 m off the head; the renders caught it, the test was tightened and the
  pose corrected. Straight down, every head is under its canopy.
- Not yet walked in the live game with the audit MCP server (not available in this session): check a rainy street
  before publishing.

## Open

- A resident who waves while holding an umbrella may lift it with the wave.
- Only the street residents of `schedules.js` carry umbrellas. Workplace residents' doorways, neighbour chats in the
  street, the ferry's deck crew and Johansson himself (the player) do not yet.
- The umbrella appears and disappears at the door rather than being opened and furled.

## Next, already decided by the owner

**Sakura closes 1–3 January** (the owner, 27 October 2026, answering which of "stay open / close / short hours"):
Thuan stays home on Kitano-jima over New Year. It is the first rule of a holiday layer for the rotas (public holidays,
Obon, New Year), to be built on `src/town-clock.js` and `commerce/sakura-rota.js` with the Saturday closing now on `main`.
