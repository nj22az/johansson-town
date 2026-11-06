# Progress: Higa Liquor closes into Sakura

## Task
See `sources/task.md`. The owner, 22 October 2026: "close Higa Liquor. Sakura sells and supplies all alcohol, Kōji's round
becomes Sakura Trading's, and the building stands shut with a notice on it." Done as its own stacked PR on
`claude/clever-ride-qdpo8s-higa-liquor`, on top of the Nhung doctor PR (#362), merged only on the owner's word and after
#362 (the owner: "Own stacked PR").

## Outputs
- The change on `claude/clever-ride-qdpo8s-higa-liquor` (nj22az.github.io), its PR based on `claude/clever-ride-qdpo8s`
  (see HANDOVER.md for its number and state).
- The owner's decision: `johansson-town/AGENTS.md`, "Owner's decision — 22 October 2026: Higa Liquor closes into
  Sakura"; root CLAUDE.md's trade line.
- Photographs of the shut front, before and after: sent to the owner in the session, not committed.

## Completed
- `commerce/higa-liquor.js`: the hours, the 留守 card, the counter's goods, the keeper and the round are gone; what is
  left is the closing notice (`HIGA_NOTICE`), the family kusu and the yuntaku bench (no longer tied to the shop's hours).
- `commerce/trade-round.js` (new): Sakura Trading's round, Kōji's on his weeks ashore, Tuesdays and Fridays from 10:30:
  loading at the depot in the Quay Warehouse (a world point, the canonical day's `warehouse`), Minato, Sato Ramen, the
  Port Terminal's freight counter for the Coral Bay Bar's ice boxes (the 14:45 boat), Mr Fujita's shed, the empties to
  the crate yard; its delivery book is read in
  Sakura's back office ("Read the drink round's book").
- Merchandising: one supplier, Sakura, with `alcohol` on its record and `alcohol` lines on the accounts of Minato, Sato
  Ramen, the Coral Bay Bar and Mr Fujita's shed (a new account: the Higas' six o'clock van is gone, the round swaps his
  crate); `SOURCED_FROM` is empty; products.json's beer is `supplier: "sakura"`; `studio/rules.js` now asks that
  alcohol be Sakura's; `tools/studio/references.mjs` reads the accounts' `alcohol` lines too, so a retire of the beer
  still sees the bars that order it.
- Sakura's till sells the bottles the Higas sold (`konbini.js` `SAKURA_BOTTLES`, at the Higas' prices); the cans stay in
  the cold cabinet.
- Economy (`economy/town-economy.js`, `goods.js`): the Higa business is gone; the bars pay Sakura's `barTrade` for drink;
  Sakura's counter sells the drink the Higas sold; Sakura keeps more drink in its stock room (8 kegs, 14 of the rest).
- People: Grandmother Higa keeps only the bath (bandai 10–12 and 13–17); Yui minds no counter on Saturdays; Kōji's
  purpose and role; `shop-days.js` (the round, the bench, the laundry); `canonical-day.js`; the place `higa-liquor` is
  closed in `cast.js` PLACES; the directory calls her the bathhouse owner.
- The shut front (`higa-liquor-dressing.js`, `quarters.js`): the shutter down and the doors shut at every hour, the
  lights off, nothing on the clock; the notice on the shutter's face (the lettering sheet, 6 mm in front of the steel),
  read from the street ("Read the notice on the shutter"); the delivery book and kusu prompts are gone (they are behind
  the shutter); the bench's prompt says the bottles come from Sakura. No new geometry.
- Texts that named the old trade: Sakura's paperwork (the Higa invoice gone, as Front-Row's went), the small office's
  cork-board note and calendar (the round's Tuesdays and Fridays), the bath's mirror advert, Mr Fujita's shed and day,
  the quay crates, the harbour boats, the island guide, the airport, the storefront's empties, the Minato back bar, the
  Johansson house bar, the Sakura office, the crate yard's lot, the feed's place, the wardrobe, the garden round, the
  guide (Grandmother Higa's article) and the cast roster, the studio's product findings and `STUDIO-MCP.md`.
- Tests that stated the old arrangement, rewritten to state the new one (none weakened): `higa-liquor-laundry` (shut for
  good, nobody keeps it, the round is Sakura Trading's, the shut front at every hour and the notice on the shutter),
  `products-move`, `sakura-merchandising`, `paperwork`, `sakura-small-office`, `town-economy`, `izakaya-backbar`,
  `okinawa-quarters`, `studio-apply` (the beer cannot go back to the Higas), `studio-mcp` (the beer's references show
  Sato Ramen ordering it from Sakura), `no-z-fighting` (the shut front with its notice), and after the review
  `island-guide`, `fujita-day` and `east-lawn` (the shut shop's own floor is a closed room, not stranded ground).

## Separate review (22 October, late evening)
A code-reviewer agent, given the diff, the owner's decision and the project rules, ran the tests on the change and on
its base. Its findings, all fixed in the second commit unless said:
- Two tests failing only with the change: `island-guide` (the bath's entry checked "owns Umi-no-yu and Higa Liquor" in
  cast.js, and said she keeps the counter in the afternoon) and `resident-guide` (`resident-guide.js` not regenerated
  from the guide: `scripts/sync-resident-guide.mjs`).
- There is no late-morning ferry (the ferry is at Kitano-jima from 08:45 to the afternoon; the Higas' account had said
  so too): the round leaves the Coral Bay Bar's ice boxes at the Port Terminal's freight counter for the 14:45 boat, and
  its juice goes on the morning boat as the cork board and the departures board say. A test now pins the boat.
- Mr Fujita's beer: the guide still had the Higas' van, and "two crates" and "the crate by the door" are not what the
  shed shows. The round swaps the one crate by his chair, full for empties, and at six he stands the night's empties
  back in it; the guide, the account, the day module, the shed and the test say so.
- Saturdays: the bench's regulars sit with a bottle while Sakura is shut all day: they buy Saturday's on Friday.
- The delivery bicycle's text sent her to the bath with lunch in it, while the bike never moves and she lunches at home:
  it stands unridden against the shut front.
- The notice's title was Japanese in the English UI; the notice sent people "across Main Street" to Sakura, which is
  down the street towards the harbour; the feed's regulars named Grandmother Higa, whom nothing puts there; the crate
  yard's story still clinked at half past seven; the empties by the door were "for the round", which does not stop there.
- The shut shutter and doors stopped only the player: they stop everybody now that nobody walks in.
- The till's bottles rang in at the default cost: they carry their landed cost from `economy/goods.js` by the millilitre.
- Not changed, reported: `studio/rules.js`'s alcohol rule cannot fire while Sakura is the only supplier (any other
  supplier is refused first); it is kept as the guard for a supplier added later. The economy model sells at Sakura on
  Saturdays, groceries and drink alike: it does not know the Saturday closing (older than this change).

## Decisions
- Mr Fujita's beer: the round swaps the crate by his chair on Tuesdays and Fridays, a full one for the empties (a crate
  of twenty is about half a week's); at six he stands the night's empties back in it. His three to six bottles an
  evening are unchanged.
- The Coral Bay Bar's beer: in ice boxes at the Port Terminal's freight counter at 10:58 for the 14:45 boat; its juice
  and water every morning on the morning boat, on Thuan's cart.
- The crate yard across Main Street is rented by Sakura Trading from Grandmother Higa; its painted sign (HIGA LIQUOR ·
  EMPTIES) stays, as the shop's sign does: no new geometry.
- The Minato back bar's measured plan (`art/izakaya/compact/plan.json`, `compact-report.json`,
  `tools/blender/build-minato-compact.py`) keeps "Higa Liquor's fourteen fictional brands" as the brands' origin: the
  plan is hash-pinned by the building survey and the GLB built from it. What the World says (`izakaya-walnut.js`) is
  that Sakura Trading supplies them.
- The dated planning documents in `johansson-town/docs/` (MASTER-PLAN, CAST-CONSOLIDATION and the like) are records of
  their day and are left; AGENTS.md's decision supersedes them.
- On Saturdays, when Sakura is shut, there is no bottle to take away; the bars still pour. The bench is sat on as on
  other days, with the bottle bought on Friday.

## Open issues
- The walking Kōji goes to the depot at 10:30 and to the crate yard at 11:30; between them his body keeps to the ice
  plant, as it did on the Higas' round (the residents' planner gives the drops no point; the canonical day, the stories
  and the tests have every stop).
- Feed backdrops for `higa-liquor` (the shut front) are still to be captured with `render-feed-backdrops.mjs`, as they
  were before this change.
- The upstairs windows of the shut shop glow at dusk with every window of the quarter (one shared material), as they did
  while it was open; nobody lives over the shop.
- ~~The economy model does not know Sakura's Saturday closing (see the review).~~ Closed: the owner closed the money
  model for now (22 October, night; AGENTS.md).

## Next action
Every check in checks.md passes. The owner looks at the before/after photographs and merges the doctor PR (#362) first
and this one, [PR #363](https://github.com/nj22az/nj22az.github.io/pull/363), after it, each on their word.
