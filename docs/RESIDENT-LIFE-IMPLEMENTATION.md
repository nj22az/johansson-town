# Resident life and inventory improvements

## Scope and order

1. Bag: stable categories, counts, search, and return to the previous filter, item and scroll position. Studio wardrobe: retain category/scroll per feature and show the current outfit and colour in words as well as pictures.
2. Studio: four optional everyday personality questions fill the existing four dials as one undoable edit. Keep all sixteen original types reachable and manual controls available. Provide a sixteen-type reference, and optional voice timbre, softness and vibrato with a working preview.
3. World: persist bounded resident-to-resident memories only after completed conversations. Distinguish a shared meal from small talk; support explicit help, disagreements and reconciliations without inventing them from dialogue text. Memories influence subsequent conversation choice and who stops to chat; existing schedules and family identities remain authoritative. A read-only resident record compares interests and temperament and explains observed connections.
4. Verify old saves and recipe codes, interrupted conversations, duplicate encounters, malformed saved records, all sixteen questionnaire outcomes, touch layouts and keyboard operation. Build the published runtime and run World/Studio checks.

## Source assessment

- https://github.com/cenyi/LifeSimGrid — questionnaire, type reference and procedural voice controls as design references. Its personality/MBTI and zodiac compatibility estimates are not imported.
- https://github.com/kiyoshithekidd/TomodachiLife_3DS_SaveEditior/discussions/2 — inventory grouping, variant selection and menu-position restoration as references. No binary offsets, game datasets or console code are imported.

All implementation is original and uses the town's existing types, artwork, catalogue and voices. No new service or runtime dependency. Changes target the publishing work branch named in WHERE-TO-EDIT.md.

## Acceptance

- Empty, filtered and populated bags remain usable; inspecting an item and returning preserves its browsing context.
- Questionnaire answers change personality only when applied; cancel does nothing; Undo restores all four dials together.
- Legacy recipes retain their existing voice by default. Voice refinements round-trip through design/share codes.
- An interrupted or blocked conversation changes no relationship. Completed encounters count at most once per pair, kind and town day and survive reload.
- Read-only records show authored ties separately from observed encounters. No compatibility percentage or automatic romance.
- Resident memories use the existing save slot; each pair retains at most eight recent encounters. The year loop preserves connection totals but clears dated encounters.

## Implemented routes

- World: Town Book → Residents → a resident → optional comparison. The existing resident rows also open the same record. MCP `ui_control` accepts `residents`.
- Studio: Edit character → Personality & voice. Appearance returns to the existing feature rail. Undo remains visible in the phone's personality view.
- Bag: select a category or search, inspect an item, then Back to the bag restores the filter, search, selected item and scroll position.

## Validation, 17 October 2026

- 54 focused personality, dialogue, wardrobe, friendship, year-loop, resident-memory, save-slot and MCP checks pass.
- 12 browser scenarios pass at 390×844, 820×1180, 1280×800 and 844×390; the complete Studio also passes all four sizes after the phone Undo refinement. Captures are under `docs/qa/resident-life/`.
- Studio: 73 active tests pass; its existing floor-sitting skirt TODO is unchanged.
- Broad World run: 1,520 passed, seven skipped, one existing TODO, and one portrait freshness failure. Regenerated all 23 portraits with the canonical renderer, then reran both resident-guide checks successfully.
- Compiled World browser smoke passes: enter town, open Town Book → Residents, compare Chin and Tetsuo, close the record and resume movement. No page errors or invalid scene transforms.
- Published runtime and stylesheet fingerprints pass all three packaging checks. Chunks from the previously published manifest are retained for cached pages.

External web fonts are blocked during isolated browser acceptance; local fallback fonts are used. Streamed model requests intentionally cancelled by World are distinguished from missing assets or script errors.

## Publishing-branch integration

Integrated publishing commit `4db918e` (typed karaoke lyrics and shared expressive poses) after it arrived during implementation. Both source changes are retained; generated-runtime conflicts were resolved by rebuilding the combined sources. The combined revision passes 64 focused checks, including live lyrics, expressive poses, resident guide and runtime packaging. Studio again passes its 73 active checks with the existing skirt TODO unchanged.
