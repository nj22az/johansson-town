# Device calendar and Thuan's weekend presence — 26 October 2026

## Owner decision and base

The owner: "Can you implement a game changing calendar they use normal date device date, they only live like it’s the 90’s".
Implemented from main `d5206c7fe55c0e75add7976e32c1fd399f31e06b`, after reading the root and World instructions,
current handovers and the NPC social/Pixar Thuan publication notes. No character or setting replacement is part of this work.

## Behaviour

- `src/town-clock.js` keeps the device's actual local year, month, day and weekday, including 29 February. The saved
  minute axis was already local civil minutes since 1970, so no save reset, epoch change or progress migration is needed.
  Existing real-time, set-time, faster-clock and event time-advance choices are retained.
- Monday 26 October 2026 is Monday for the shop rota, clinic, school, residents and weekly happenings. The title board's
  date, weekday, document number and clock explanation follow the actual date too. The 1990s remain the town's way of life.
- `people/schedules.js` reads the daily plan before deciding whether a commuter is away. A weekend plan cannot leave
  Thuan visible at the terminal during her ordinary weekday shift hours. A fresh load already marked away is not held
  for another ferry, even when a ferry is alongside. Existing visible departures still use boarding rather than a teleport.
  The away-location description now receives the actual resident name, restoring "at home on Kitano-jima".
- The same actor returns when the Monday morning ferry is present, then resumes her Sakura routine. Old saved terminal
  positions do not create another actor. Pixar appearance, outfits and social budgets are unchanged.
- Authored annual festival dates, the historical storm story pattern, period prices/props and the separate Stockholm
  Future Calendar prop are retained. This task does not claim a newly researched lunar-festival or live-weather feed.

## Verification

- `tests/device-calendar.test.mjs`, `town-clock.test.mjs` and `kitano-residents.test.mjs`: **16/16 passed**.
  Includes the complete title-board script in a DOM fixture, actual shop/clinic/school schedules, real `createCastAI`
  absence with both travelling/alongside ferries and saved terminal coordinates, the same actor returning on Monday,
  and saved-minute/date round trips in UTC, Stockholm, Los Angeles, Tokyo and Kiritimati across midnight, DST, leap day
  and year end. No graphics renderer is substituted for those controller tests.
- Runtime rebuilt successfully with the locked Vite dependencies. Current source fingerprint, manifest, page and service
  worker are delivered together; the previous production runtime generation is retained by the normal build.
- Final focused acceptance after the final title/save-screen wording and cache rebuild: **20/20 passed** (the 16
  calendar/controller checks above plus all four runtime-package checks). Additional daily/evening/Kitano/runtime
  suites: **17/17 passed**.
- Complete **87-file World guard**: 442 assertions passed; only the no-z-fighting worker was killed at the environment's
  8 GiB memory ceiling (the initial `NODE_OPTIONS=--max-old-space-size=10240` exceeded that ceiling). Its first isolated
  3 GiB retry exhausted the JS heap. The unchanged scan then passed **13/13** in 109 s when run alone with
  `NODE_OPTIONS=--max-old-space-size=5120 node --test --test-concurrency=1 tests/no-z-fighting.test.mjs`.
  **All 455 guard assertions therefore passed across the complete run and isolated retry.** No scan, tolerance,
  assertion or game geometry was weakened to obtain that result. The initial full invocation reported failure for the
  resource-killed worker; this is not represented as a single uninterrupted green invocation.
- Source/documentation whitespace check passed. Generated shader string whitespace is retained as emitted by Vite.
- Existing unguarded festival assertion: `happenings.test.mjs` expects all three named residents at the eisa, but at least
  one is retained by an existing higher-priority routine. Reproduced with the original main clock and original main test
  through a temporary Node loader. It is not a new calendar failure. Its historical-story fixture now explicitly requests
  1997 instead of relying on the removed year projection.
- Two older routine assertions expected no opening sweep even though current main has a doorstep sweep. Those expected
  phases are updated, and the consecutive-day fixture now uses the actual 1970 weekdays of its epoch-minute inputs.
- Physical iPhone/iPad, GPU rendering and Steam Deck are unverified. This task does not publish a new Linux installer.

## Publication and next actions

The exact main publication commit and hosted guard/Pages evidence are maintained in this note's row in the
[root handover index](../../HANDOVER.md); that publication record supersedes the preparation state of this note.
The uploaded Git tree is checked against the locally staged tree before promotion. Verify the live page, calendar
source, compiled boot/game, manifest and service worker against the tested bytes after Pages deployment.
The downloadable Linux edition needs a later repackaging; this task changes its shared source only.
Physical Safari acceptance remains: observe Thuan's ordinary weekday and weekend routines.
