# One-day slice: progress

## Task
Build one day in Minato Machi worth coming back for (sources/task.md), on `claude/animal-crossing-lessons`.

## Outputs
- `src/progression/diary.js`: moments carry `who`, `news`, `id`; `momentsOn(state, day)`.
- `src/feed/evening-news.js`: the bulletin; `town-hall.js` television; `activities.js` `watch` action.
- `src/mail/post.js`, `src/mail/letters.js` (favour and helped occasions), the letter box in `buildMayorHome`,
  `activities.js` post and letter views, `context-controls.css` letter paper; the round runs in `game.js` `simulate()`.
- `src/people/greetings.js` (no first meeting), `activities.js` `openingGreeting`, beats in `dialogue-box.js`.
- `src/people/favours.js` (Nhung's cookery book for Thao), `errands.js` (a delivery ends at the hand-over),
  `friendship.js` `helped()`, the "!" card in `game.js`.
- Tests: `tests/one-day-slice.test.mjs`; `tests/animal-crossing-lessons.test.mjs` updated.

## Completed
- Plan and checks written (2026-10-11).
- Batch 1, the evening news: built, tested, checked in the game.
- Batch 2, the post: built, tested, checked in the game (Tōma's 10:30 round, the letter box, letters on paper).
- Batch 3, greetings and beats: built, tested, checked in the game.
- Batch 4, the favour: built, tested, walked through in the game end to end (letter, card, ask, wrong person,
  hand-over, hearts, moments, news, thank-you letter, thanks in person).
- Separate review: P1–P9 fixed (stale favour letter, repeated check-in, facts the game overrides, card before the
  letter, the book as a present, two news items not true to the town, endings out of order, the ask without its
  greeting, crafted save keys), re-tested and walked through again; the full `npm test` passes (1123/1128, 5 skipped).

## Decisions
- The favour is Nhung → a cookery book, bookmarked at the dashi-omelette page → her sister Thao at Minato. The chat
  proposal's Kenta and Yui, and then Emi, are not active residents (`ACTIVE_RESIDENT_NAMES`). Facts come from what the
  game shows, not the raw profiles (`residents.js` overrides them): Thao's "Nhung says I am stubborn. I say I am
  right.", the three sisters (`neighbour-chats.js`), Nhung's bookmarks, Minato's dashi omelette, the Cookery wall.
  Letters read the senders' P.S. from `RESIDENTS` for the same reason.
- A favour never taken up is offered again on the next day with time left, up to three times, and each offer's
  letter replaces the last; the "!" waits for the letter.
- A delivery is done at the hand-over (Nhung leaves work at 18:30, Minato opens at 16:00); she says thank you the next
  time they meet and by letter the next morning.
- The post comes with Postman Tōma's 10:30 round (island-households.js), not at 08:00.
- The game page runs the compiled runtime: every in-game check is preceded by `npm run build:runtime`.
- The post round runs in `simulate()`, not the render loop: it is game logic, and the audit steps the simulation.
- The diary's moments are the shared memory; they gain `who` and `news`, so each retelling uses its own words.
- The evening news is on the mayor's own television, which already exists; the post comes through his door.
- The "!" card means "has something to ask you", for wants and favours alike: one signal per concept.
- The audit MCP server is not connected here; the same session class is driven by a script instead.

## Open issues
- Residents' birthdays are all the placeholder 1 July: the birthday greeting stays off.
- Weather is rolled per day, so the news has no forecast yet; there is no typhoon weather kind, so the typhoon greeting
  and letter are never triggered yet.
- Only the thank-you letters (for a present, for a favour) and the favour letter are triggered; the 'missed' letter
  after a long absence is written but not yet sent.
- One favour exists.
- A favour's day can fall on Nhung's or Thao's recorded day off (`anchored-cast.js`); the schedules do not use days off
  yet (review P10).
- "Ryūkyū" rendered broken in the headless browser's fallback font; the item is now "Cookery book", but any ū in other
  lines should be checked on the iPad.
- Thao was reached in the audit through her own interaction handler (time jumps leave Minato shut); walking to her at
  Minato in real play is the existing conversation and was not re-walked here.
- Pre-existing browser error in every audit session: `assets/figurines/thuan/thuan-display.glb` request aborted.

## Round 2 state (2026-10-11)
- Done and checked in the game (checks.md 13–16, 18): Thao on foot, the long-absence letter, Thuan's beats, typhoon
  days from 1997's real typhoons, the news covering the calendar (tomorrow's happening; a festival as it went).
- Interrupted by the creator's "I want all customisation be in Johansson Studio" (checks.md 22, NEXT.md section 8):
  done, reviewed separately, fixed, published with round 2 (2/3) through the live workflow.
- Done since: the favour calendar and two favours (17), impressions (19), birthdays wired to a table the creator fills (20);
  reviewed, fixed, published (21). Round 2 is complete.
- Test-tool note: the audit's setTime fixes the weather while the button still reads "Random"; press the weather
  button to Random after setting the time, or typhoons and random rain never run.

## Next action
The creator decides: real birthdays (`src/people/birthdays.js`), and whether the Photo studio's per-photo wardrobe and
`?avatar=` links move to Studio (NEXT.md section 8). More favours need new facts between daytime residents.
