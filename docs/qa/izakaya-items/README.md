# Minato items and exploration review · 5 October 2026

The existing Minato interior and adjoining Sato kitchen have recognizable shaped items throughout: real dishes/glasses with inner cavities, labeled bottles, open crates, working equipment, food shapes, household textiles, detailed appliances and furnished seating. The worn/cozy room keeps its original floor and service reserves.

The street window and open doorway show a small live render of the actual town. Folded curtains operate normally and close across the full window. Door pulls, pockets, tracks and threshold keep the full existing exit clear. Four physical discoveries connect the guestbook, ferry ticket, old radio and house recipe into First Lantern Night; completing them saves a field-book story and one readable recipe card. A full bag defers collection safely.

## Checked behavior

- Public MCP walkthrough: 210 calls, 14 captures, all planned walks reached, four physical discoveries completed, phone call and karaoke worked, reachable exit returned to town. Zero browser errors and invalid transforms. No scene/player fixture placement was used. The optional drink-service probe did not complete in its bounded menu check; the drink service behavior tests pass.
- Normal browser persistence: four physical reads, Save now, page reload and Enter, retained six markers, one story and one recipe card. The restored card was read through Menu → Bag; six screenshots and zero errors.
- Desktop and 390×844 phone: 21 actual WebGL detail views inspected, including shared kitchen, vessels, food, devices, seating, window and door. These use fixed review cameras; they are visual fixtures, not walking evidence.
- Installed develop-web-game client: actual spawn-street movement captured and text state inspected, no collected errors. Its entrance click did not open Minato; the MCP and persistence runs cover the interior with normal controls.
- Focused tests: 54 passed for food/drinks, service, appliances, memories/save bounds, curtains/door clearance, actual GLB cavities, camera clearance and calendar. Model/export plus existing venue tests separately pass 12/12.
- Runtime build succeeds and source fingerprint matches. Final GLB has seven material batches, 203,549 triangles and 10,850,976 bytes. It is larger than the earlier model; real-device frame-rate benchmarking across low-end hardware was not performed.

## Saving

Existing local autosave runs every 15 seconds and on actions/leaving. Menu → Town book → Player & save includes Save now, Export save file and Import save file. Discovery progress uses those same player slots. Import creates a new local player and preserves the previous slot. The game has no cloud-save account system.

See `mcp-report.json`, `persistence-report.json`, `results.json` and the PNGs here. Model source coverage and exported geometry review: `../izakaya-model-realism.md`.
