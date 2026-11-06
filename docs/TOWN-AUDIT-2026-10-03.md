# Johansson Town audit — 3 October 2026

This pass inspected the working game and repaired reproducible graphics, household,
quest and customization defects. The direction is everyday credibility inspired by
Shenmue, readable toy-like people and props inspired by Tomodachi Life, and neighbour
requests with personal, earned home choices inspired by Animal Crossing.

## Graphics

- Repair thirteen overlapping ground-surface pairs, including airport paving,
  Rainflower Lane, terrain, coastal routes, Blue Coral floor tiles and roof landings.
  The overlap detector now covers the whole island and airport, including large
  triangles crossing its sampling boundary.
- Restore the framebuffer after failure in any post-processing pass. Check actual
  float-target support and use byte targets where required. Respect zero-sample
  drivers and the pixel budget on large Retina buffers.
- Refresh packed instance colours after live changes and refresh moving props in
  the Sakura shop-window view.
- Recover a lost WebGL context while keeping the live player, open room and save.
  Pause rendering during loss, rebuild graphics and resume the town clock.
- Refresh all forty resident portraits and their source fingerprint; the checked-in
  portrait package was stale before this pass.
- Keep START disabled until its launch handler has loaded. A reload could expose
  the title button before its audio/loading dependencies were ready.

See [the graphics audit](GRAPHICS-STABILITY-AUDIT.md) for causes, coverage and
renderer-specific regression tests.

## Homes

Every occupied household now has cooking and tea traces, shoes, family photographs
and belongings drawn from its residents' work or interests. Fishing households have
mending gear; other households show weaving, music, clinic, ferry, gardening, postal,
repair, reading or household-account objects. Inspectable descriptions connect the
objects to an ordinary day without filling the rooms with unrelated clutter.

Shared homes use their own bed, bedside, breakfast and doorway positions. Previously,
roommates could inherit another apartment's coordinates, placing their routines
outside the room. Tests now walk each roommate from sleep to breakfast and departure.
Cushions are inside the walls, and bedding hooks and kitchen props share those same
local coordinates. Shared and generic rooms have closed ceilings. Photograph layers
face into the rooms. Intersecting paper partitions and doorway beams expose a single
surface, and their dark rail/dado end caps clear the light panels rather than flicker.
Raycasts verify the visible picture, ceiling and junction faces. The available rental
remains prepared for a future occupant.

The mayor's home has visible harbour photographs and a saved keepsake shelf. Wall
colour and textile changes affect only that player's home, including the wall above
the exit, without changing cached materials in other rooms.

## Requests and personal choices

- Use the actual town plan when describing residents and homes.
- Generate daily requests for the reachable walking cast. Retired personalities
  previously generated requests that could not be delivered.
- Request the obtainable Sea bream and accept the old Mackerel item name in legacy
  saves. Point fish requests towards the pier.
- Page through the whole gift inventory. Previously, items after the first eight
  could not be selected, including the item needed for a daily request.
- Save avatar recipes with each player and include the appearance snapshot in save
  exports, so newly imported player slots retain their appearance.
- Save wall colours, textiles and the equipped keepsake with each player. Fishing,
  returning Tama and completing Kenji's workshop walk unlock shelf objects. Locked
  objects cannot be equipped through the normal menu.

## Verification and scope

- `npm run build`: passed. The build emits the updated public runtime and refreshes
  the service-worker release. The previous published graph is retained for cached
  pages. Vite retains its existing large-chunk advisory.
- `npm test`: 674 tests, **669 passed, zero failed, five skipped**. The skips are
  authored checks for the disabled cave/headland and gateball court.
- Browser acceptance: **all 15 accessible homes** entered and exited at 1280×800
  and 390×844. Saved colours, textiles and earned keepsakes survive reload. Forced
  WebGL loss/restoration retains the game instance, current room, player and décor.
  Final runs report no page exceptions or WebGL errors and finite scene transforms.
- Exterior screenshots inspected at noon and 21:00: Rainflower Lane, the garden,
  Sakura frontage/window view and airport concourse/paving junctions.
- Deliberately held back `loading-facts.js`: START stays disabled, ignores premature
  programmatic activation, then starts after the dependency resolves on both sizes.
- The original develop-web-game input client completed two bursts in the compiled
  game. Its screenshots and text state were inspected; no console-error file emitted.
- `git diff --check`: passed.

The browser checks use the compiled runtime served by the public page. Their reusable
driver is [tools/audit-town.mjs](../tools/audit-town.mjs); serve the repository root on
port 8765 and provide Playwright to run it. `--entry-gate`, `--recovery`, and
`--outdoors --night` cover the extra scenarios. Local evidence is in
`output/acceptance/` and `output/skill-final/` at the repository root, outside the
published game. Reload diagnostics from earlier failed runs are retained there too;
the final complete home tour and isolated recovery run passed both viewports.

These repairs preserve the existing town's visual language. The customization pass
adds saved colours, textiles and earned shelf objects; arbitrary furniture placement
is a separate feature. There are three wall colours, three textile colours and one
displayed keepsake from four choices. Three requests are drawn each town day from
eight reachable residents; Thuan has her own gift reactions. The two existing favour
chains, calendar nudges and municipal projects remain finite authored content.
Resident wardrobe choices remain device-wide and are outside player save exports.
The home routine checks cover the current walking cast;
household-specific furnishings do not imply a new daily simulation for every named
family member. Desktop Chromium at phone viewport sizes verifies layout and recovery,
but physical iOS/Android GPU and touch-device acceptance remains unverified.
