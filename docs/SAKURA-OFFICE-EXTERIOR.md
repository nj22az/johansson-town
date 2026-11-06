# Sakura office exterior

The owner's direction is a beautiful, cohesive 1990s Okinawan shop building.
The upper floor retains its existing room, stair access and port/town outlooks.

The facade continues the ground shop's cream plaster, warm dark window frames,
concrete slab colour and restrained red tile hood. Thin sliding-sash divisions,
projecting sills and shallow rain shades give the long windows a human scale.
A low concrete parapet finishes the flat roof; a downpipe occupies the service
corner. The harbour-side rear wall is closed behind the existing window opening.
The two window faces share the town's existing dusk circuit.

This is game art direction, rather than a reconstruction of a particular historic
building. It adds no image assets, point lights, render targets or room loads.
The upper shell and trim use two merged meshes, with two shared-material window
meshes (6,944 vertices total). Existing mobile resolution safeguards are retained.

Acceptance checks:

- Seated town and harbour sightlines pass through the window openings.
- Internal stairs and the registered outside office entrance remain unchanged.
- Facade geometry stays batched; both panes join the existing night lighting.
- Build the runtime and pass the runtime-package check.
- Inspect mobile WebKit street, roof and portrait daylight views, the street at
  00:30, and the office outlook at 00:30. Evidence is recorded under
  `docs/qa/sakura-office-exterior/` by `tools/sakura-exterior-smoke.mjs`.

Physical iPhone Safari and Steam Deck visual parity require device testing.

Verification on 18 October 2026: the runtime build, 60 focused checks and three
runtime-package checks passed. All five WebKit views were captured with the ink
path enabled and zero reported GPU errors. The two exterior panes reach 0.75
emissive intensity at 00:30. Render counters in the JSON report accumulate across
frozen audit draws; they are not per-frame performance measurements.
