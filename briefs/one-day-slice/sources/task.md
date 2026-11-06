# One-day slice: inputs

- **Task** (the creator, 2026-10-11, "Yes proceed" to the chief-designer plan): build one day in Minato Machi worth
  coming back for, on the branch `claude/animal-crossing-lessons`, checked in the real game step by step.
- **Output**: World code under `johansson-town/` (src, activities.js, game.js, tests), this folder's progress.md and
  checks.md, a chosen set of screenshots in `shots/` (the raw captures are working files, not kept).
- **Checks**: `checks.md` here; the town's `npm test`; the real game driven through `tools/mcp/session.mjs`
  (TownAuditSession, headless Chromium), because the `johansson-town-audit` MCP server is not connected in this session.
- **Sources**: `docs/ANIMAL-CROSSING-STUDY.md` (what the games teach); the town's own data: `src/people/profiles.json`
  (Emi: seamstress, her gossip about Nhung's novels and the deep pockets; Nhung: bookshop assistant, carries a satchel),
  `src/world/interiors/town-hall.js` (the mayor's home, its door, its television), `src/progression/diary.js` (moments),
  `src/people/friendship.js` (hearts, the "!" card).
- **Scope**: the moments ledger extended; the evening news on the mayor's television; the post through the mayor's door;
  situational greetings on the first talk of the day; beats in the typewriter; one favour (Emi → Nhung's satchel) with
  the "!" card, the wrong-person correction, the hand-over, the thank-you; the next morning's letter.
  Out of scope: the island's other residents' favours, real birthdays, a weather forecast, the feed page on the landing
  site, publishing to the live branch (that waits for the creator).
- **Fiction**: Johansson is the mayor and has lived here since 1979 (`buildMayorHome`'s photograph). Nobody greets him as a
  newcomer. Residents call him Mayor or by his name.
- **Limit**: the batches in checks.md; nothing goes live without the creator choosing it.
- **Sources checked**: 2026-10-11, at commit 5d75e96.
