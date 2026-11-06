# Minato food-service handover — 22 October 2026

## State and integration

Implemented on `codex/izakaya-food-service`, from main `8e234f1bb407611d37101247eff0f56c1facb5f3`.
Implementation commit: `648fabc74902934d5c5cb2c42ca9a3e92aef87cf`.
Merged review: [PR #350](https://github.com/nj22az/nj22az.github.io/pull/350).
PR #341 was verified merged. The existing merged drink service was reused rather than replaced.
The owner reviewed the captured screenshots and authorised integration: "Merge to main and sign off in handover".
PR #350 was squash-merged on 22 October 2026 as `16407e2822ce2379fb0661042d2c21ddd7334c8d`.
The approved head was `2a93876f7e631650a9bc4cbaf0960767d16515c0`; GitHub World guard
[run 39737568380](https://github.com/nj22az/nj22az.github.io/actions/runs/39737568380) and Linux console acceptance
[run 39737568313](https://github.com/nj22az/nj22az.github.io/actions/runs/39737568313) both completed successfully.
Main remained at the branch's base before integration, so no runtime conflict resolution or rebuild was needed.
**Signed off for main following owner visual approval and passing hosted checks.** The morning World handoff and its
referenced handoffs still apply. This sign-off does not claim a verified Pages deployment or a new Linux release.

## Behaviour

- The existing drink-source rounds (`izakaya-bar.js`) are unchanged. The same service queue now accepts resident food.
- `izakaya-food.js` uses the existing grill, oden bath, preparation board, range and fryer. All ten menu dishes plus
  residents' existing rice are supported; `fish` still means the existing hokke serving. No menu price was changed.
- Thao works at the appropriate station with a kitchen utensil, plates on the clear steel beside the cutting board,
  collects that same dish, carries it around the counter, steps in beside the actual seat and puts it down there.
  The towel warmer is included in arm/prop clearance checks. Her arm needs the plating pass clear of its corner.
- Resident `foodDelivered` and `drinkDelivered` flags and consumption clocks are separate. A delivered drink can be
  consumed while food is pending. Eating cannot begin before the food callback. Payment is still one existing meal
  purchase at the original total, with the original mouthfuls, sips, beer limits, rounds and customer timetable.
- Old delivered records migrate to both parts delivered. Partial deliveries, payment and clocks survive restoration.
  Leaving cancels the requests and clears props. Cancellation beside an appliance backs out to the walking aisle
  before the return walk, so a full-radius walker is never started inside a worktop clearance.
- The leftmost stool's food route keeps its walking circle inside the room. The final approach uses the existing
  measured 0.13 m working clearance. `body-collision.js` now accepts a radius per body, and `characters.js` reads the
  service's radius: the old fixed 0.26 m circle repeatedly pushed Thao off a valid serving point in the real game.
  This was visible in the baseline captures and prevented the drink service from finishing there. All other bodies
  retain the existing default. No character, furniture or room is rescaled.

## Verification and evidence

See [the QA record](../docs/qa/izakaya-food/README.md), before/after comparison and sampled sequence. These are captures
of the running game, not a separate render scene. Final desktop captures use the rebuilt runtime and Linux-edition
budgets in software Chromium. Phone-sized captures were also reviewed. Physical iPhone/Safari, native Linux and Steam
Deck acceptance remain unperformed.

Final verification: the full repository guard passed **334 tests across 60 files** on the delivered source and rebuilt
runtime. The food/contact/cancellation/booth-spacing suite passed **23 tests**, and the focused food/drink/service-route
run passed **45 tests**. Web-edition food/resident-life/body checks passed **35 tests**. Runtime-package validation and
`git diff --check` passed. Final game traces show beer received with food pending, then the separately delivered bowl.
The four booth seats have distinct supported dish and glass positions; residents use the existing outer glass row.

An extra, non-guard `ramen-kitchen.test.mjs` test still fails on its removed-resident fixture (`profile` undefined),
consistent with the morning handoff's known failures; that unrelated fixture was not changed.

## Next

1. Implementation and owner visual approval are complete; PR #350 is merged into main. No food-service integration work remains.
2. Physical iPhone/Safari and Steam Deck checks remain outstanding. Hosted Linux console acceptance passed; it is not a physical-device test.
3. Linux release integration is a separate action. No installer, release version or published download was changed here.
