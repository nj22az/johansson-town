# Progress: Nhung becomes the island doctor

## Task
See `sources/task.md`. Started on `claude/laughing-rubin-6p25x2`; finished on `claude/clever-ride-qdpo8s` (the same
commits, then the finishing ones; nj22az.github.io). The owner's finishing brief of 22 October (evening): fix the tests
that fail only because of this change, give Nhung's red car a doctor's purpose out of surgery, render her portraits and
look at them, rebuild the runtime last, the CI guard alone, a separate review, a PR to main (merged only on the owner's
word), then the queued Higa Liquor step.

## Outputs
- The change on `claude/clever-ride-qdpo8s`, PR to main (see HANDOVER.md for its number and state).
- Portraits: `assets/images/residents/07.webp` (Nhung), the shoot's `nhung-1`, `nhung-2` and `koji-2` (Kōji's photo with
  her); `guide/portraits.json`, `resident-guide.js`.
- The before/after sheet: sent to the owner in the session, not committed (scratchpad `nhung-before-after.png`).

## Completed
- Audit of the two doctors (clinic look chosen).
- Roster: `dr-ken` retired into `nhung`; the doctor's flat retired; people/cast.js Nhung's day, pairs, keepers.
- Avatars: Nhung = the clinic doctor's look; `FORMER_NHUNG_RECIPE` kept; Dr Kakazu in RETIRED_RECIPES.
- `people/clinic-hours.js`; social.js (surgery, evening paper at Front-Row, Saturday afternoon off, Sunday at Sakura);
  schedules.js place `paper` (indoors at Front-Row); workplaces.js (clinic, OWN_STAFF_ROOMS).
- Sakura: shut on Saturdays (rota, signs 土曜定休, paperwork, small office, staff board); Higa's Sakura drop on Friday.
- Merchandising: Front-Row's stationery trade to Sakura; the Front-Row invoice gone.
- Front-Row room text: honesty tin, reading copies stay; bookshop visits stopped.
- Dr Kakazu's references moved to Nhung (laundry, parking bay, places, belongings, products, guide).
- Guide: Nhung's article rewritten; Dr Kakazu's moved to RETIRED_ARTICLES; residents.json regenerated.
- Docs: root CLAUDE.md trade line; johansson-town/AGENTS.md owner's decision section.
- Finishing session (22 October, evening; `claude/clever-ride-qdpo8s`):
  - The eleven tests that failed only with this change, updated where they stated the old arrangement: lot-dressing
    (bay 2 is Nhung's), island-businesses (Nhung's work is the clinic, nobody keeps Front-Row's floor; the old shop's
    worker is Nhung at the paper at 19:40), resident-belongings (Front-Row's stationery is Sakura's: the five things
    bought there now come `from:'sakura'`), retired-recipes (eleven retired, nine drawn, the live 25), ship-posts (the
    roster is 25), sakura-evening-guests (her errand at Sakura is 17:00–18:00, after surgery), town-talk (her role).
  - Front-Row draws Nhung at the back bench while her plan says `paper` (`workplaces.js` EVENING_DESKS, `workRoomOf`;
    `workplace-residents.js`): before, the room was empty while she was "indoors" there. Her bookshop mornings
    (`stand-sequences.js` frontrow-morning) are gone; frontrow-paper's words are the evening's.
  - Her red car (`town-traffic.js`): the clinic's medicines from the airport freight, Mondays and Thursdays on the
    21:38 boat in and the 22:15 out (`weekdays` on an appointment), never in surgery; Wednesday evening is her laundry.
  - The clinic room draws her at her desk only when her own day has her at work there, read at the door (`buildClinic`
    `doctorIn`, game.js), with "Talk to Dr Nhung" (her conversation, so the cookery-book favour's "call in at the
    clinic" can be done); out of hours the stool and the scales say the doctor is out. Before, the room drew the doctor
    at all hours (as it did Dr Kakazu), so on a Sunday she was at her desk and behind Sakura's counter at once.
  - The avatar's open front (jacket, cardigan) is chosen by angle round the body, not distance across it
    (`avatars/build.js` torsoColour): on a narrow-waisted body the next column's triangles came in and the shirt was a
    jagged zigzag (Nhung's sage shirt, and Ms Uezu's). It is now the same two front columns at every height; at the
    shoulders, where the body rounds into the neck, the old rule had taken a few more triangles in, so the Harbour
    master's, Tetsuo's and Ren's lose a small notch there (the separate review counted 13 triangles each). Their
    portraits and article photos are re-rendered.
  - Leftover old-canon text: Sakura's flyer ("closed Saturdays"), the town papers regenerated (the clinic notice said
    the doctor lives behind the clinic), the small office's calendar writes both marks on the 31st (Higa and pay), the
    wardrobe notes, a chat clue, the doctor's bag ("on foot or by car", she has the bay-2 car).
  - The sisters test no longer passes without looking: there is no play day (see Open issues), so it reports a todo.

## Decisions
- ~~Sakura on Saturday opens at 13:00~~ (first considered; superseded by the owner's Saturday closing below).
- `clinic` is in `RETIRED_HOMES` landing on itself: the id also names the clinic, which stays, so a saved `clinic` or
  `home-clinic` lands at the clinic (`retiredHomeFallback` keeps it; the registry shows no fallback).
- Saturday (the owner, 22 October, asked): Sakura shuts on Saturdays; Higa's Sakura delivery moves to Friday; Nhung's
  day off is Saturday afternoon. (Supersedes the 13:00 opening first considered.)
- The clinic room keeps drawing the doctor at her desk itself; Nhung's walking body is never borrowed into the clinic.
- The sisters' jan-ken-pon in the park (14:40) does not happen while the clinic is open, so on weekdays Thuan takes her
  walk instead; the game survives only if the clinic is shut at that time.
- The red car keeps its home at the airport yard (the fleet's model); its run is on the timetable's evening boats so no
  surgery and no laundry evening is touched. The fleet's other appointments (10:00, 13:00) do not match the timetable
  either; that is the fleet's, not this change's (all five owned-vehicles tests fail on the base commit).
- Front-Row's door hours in `town.js` isOpen (closed at weekends, 9:00–18:30) only set a flag nothing reads; rooms open
  at any hour, so the player can walk in on Nhung at the paper. Left as it is.

## Open issues
- The owner (22 October): texts written before the consolidation still count the old island. Fixed in the clinic (the
  couch: Vy, Riku and Mai, and Kōji the one fisherman; the X-ray: Fujita, not the retired Ōshiro). Still open, not part
  of this change: the classroom's pupil list (`world/interiors/classroom.js`: Kinjo Yui, Higa Kenta, Oshiro Sakura, none
  in the cast; the island has three pupils) and the countryside's Ōshiro farm ("three generations", `world/countryside.js`).
- The game calls the player "Mayor" (the clinic's check-up and scales, mail/letters.js greetings), although the roster's
  Nils is the chief engineer and the mayor's office went on 21 October. A game-wide wording, left for the owner.
- **For the owner: the sisters' jan-ken-pon has no day now.** It is in Thuan's afternoon break (14:40), which is
  afternoon surgery on weekdays, and Thuan spends Saturday and Sunday on Kitano-jima, so over any fortnight it never
  happens (checked day by day; `tests/sisters.test.mjs` reports it as a todo rather than passing without looking).
  Where should it go: their lunch, the cones outside Sakura at eight, or a Sunday Thuan comes over?
- Sakura sells the books by order at the till (Front-Row's note: "ask Thuan at the till"); no book shelf was added
  (no new geometry). If the owner wants books on Sakura's shelves, that is a merchandising and layout job.
- The clinic room's lines still call the player "Mayor" (open issue above).
## Queued (the owner, 22 October, answered; done in its own stacked PR, `briefs/higa-liquor-closes/`)
- "The sisters basically run commerce and healthcare on the island … maybe we don't need a liquor store, Sakura can sell
  liquor too." Answers: close Higa Liquor; Sakura sells all alcohol over the counter and supplies Minato, Sato Ramen and
  the Coral Bay Bar from its depot; Kōji's round becomes Sakura Trading's delivery round; Gran Higa keeps only the
  bathhouse; the Higa Liquor building stands shut, a notice on the shutter saying liquor is at Sakura (no new geometry).
  Do it as its own step after this change is green.

## Separate review (22 October, evening)
A code-reviewer agent, given the diff, the owner's decisions and the project rules, found (all fixed in the finishing
commit unless said):
- Sakura still had shoppers on Saturdays, when it is shut (Thao's soda, the harbour master's lunch): `visitsMarket` and
  Thao's day now ask `sakuraOpenAt`.
- Her bedtime (22:20) cut off the Wednesday laundry she took over from Dr Kakazu (21:15–22:30): she goes to bed at 23:00,
  as he did (`home-life.js`); the folding happens, and the car's evening boats are over by then.
- The phone directory showed the raw place `paper`: `home-directory.js` maps it to Front-Row.
- On Sunday mornings she walked to the clinic before turning back to Sakura: her walk before nine goes to Sakura then.
- `products-move.test.mjs` had been loosened (six accounts replaced whole): it now replaces only the fields that changed.
- The sisters' game could send Nhung alone to the park while Thuan was on Kitano-jima: `sistersAtPlay` asks
  `thuanWeekendAway`, and the test checks both or neither, day by day.
- Text: Sakura's sales book, the bookshop bicycle, the bath's mirror adverts, the evening news, the Saturday happening's
  line, the cookery-book favour's letter, her listed day in `cast.js`, Thuan's medicine-shelf line (the "clinic boat"),
  paperwork comments.
- The coat fix changes the shoulders' band on every jacket or cardigan, not only the narrow-waisted: shown on the coat
  sheet (Tetsuo, the Harbour master, Ren, Ms Uezu).
- Not fixed, reported: her red car still borrows her body across to Kitano-jima for the evening run (the fleet's way of
  driving, older than this change); she owns two cars (the bay-2 kei car for house calls, the red one at the airport
  yard, the owner's to keep); the car has a quarter of an hour at Minato to catch the 22:15 back.
  `people/bookshop-customers.js` is dead code now that nobody browses at Front-Row; left in place.

## Checks run (22 October, evening, on this machine: node 22, 4 cores)
- Full `tests/*.test.mjs` on the base commit 84baf00: 2,102 tests, 54 failing. On the finishing commit before the review
  fixes: 4 failing that do not fail on the base: the two runtime tests (rebuilt since) and two directory tests that still
  counted 26 people (updated). fun-poses timed out on the base only because a render ran beside it; it passes here.
- After the review fixes: the 64 test files that read the residents' plans, the directory, the papers and the quarters:
  every failure there also fails on the base commit. `boot` and `runtime-package` pass after the rebuild.
- The full `tests/*.test.mjs` on the finished branch (`0ef8e9c`): 2,102 tests, 52 failing, every one of them failing on
  the base commit too; two that failed there pass (fun-poses, and the published photo articles' portraits).
- `node tools/ci-guard.mjs`, alone, after `npm run build:runtime`: 333 of 334. The one, `no-z-fighting.test.mjs`, runs
  out of memory on this machine's Node 22 heap on the base commit too; with `--max-old-space-size=10240` all ten of its
  tests pass. CI runs Node 24.
- steam-deck: 39/39 (the controller fix).

## Next action
1. The owner looks at the before/after sheets and says whether to merge [PR #362](https://github.com/nj22az/nj22az.github.io/pull/362) (main deploys the site). Merge only on
   their word.
2. The owner's answer on the sisters' jan-ken-pon (Open issues).
3. Higa Liquor closes into Sakura: its own stacked PR on `claude/clever-ride-qdpo8s-higa-liquor` (the owner, 22 October:
   "Own stacked PR"); its task folder is `briefs/higa-liquor-closes/`.
