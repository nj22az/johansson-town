# Shiosai phone acceptance — PR #156

Tested the repaired published runtime in Chromium at **390 × 844**, with mobile/touch emulation and actual CDP touch joystick/swipe input. The original desktop and phone baseline also passed before the repair.

The first touch approach stopped at z = −54.54 m: the freshwater tank narrowed the cabin approach. `defect.json` preserves the movement evidence. Moved the tank and collider to the port foredeck, regenerated the reusable GLB and published runtime, and added a regression check using the player's 0.28 m radius.

Final acceptance passed:

- 23:30 shed departure, gangway crossing, settling and sleeping; beer prop cleared.
- Touch movement across gangway, bow deck, open cabin doorway and berth aisle; return route completed.
- Normal cabin camera has clear collision clearance; roof cutaway is active inside and restored outside after waking.
- Starboard wall stops the player; no penetration or invalid transforms.
- 06:00 return finishes in the original shed chair. `wakeSteps` records the return walk.
- Twelve samples across both cargo calls have no overlap with boat or gangway.
- Fourteen focused source/runtime/harbour checks passed; final browser errors and request cancellations were empty.

`report.json` records the repaired runtime source hash, input coverage, camera, collision, night/wake positions and cargo samples. The font CSS is stubbed because external Google fonts are unavailable in this environment; local fallback fonts are used. Chromium uses software WebGL. This is browser emulation, not a physical iPhone run.

## Compact phone evidence

- [Boat and shed by day](phone-day.png)
- [Night boarding](phone-boarding.png)
- [Sleeping berth and cutaway](phone-berth.png)
- [Normal cabin camera](phone-cabin-camera.png)
- [Touch return across gangway](phone-gangway-return.png)
- [06:00 shed endpoint](phone-wake-return.png)
- [Cargo berth clearance](phone-harbour-clearance.png)

The last two are separately staged endpoint illustrations for clearer framing; `endpoints.json` records their capture. The complete routine and collision results are in `report.json`.

Reproduce the full acceptance with `node tools/fujita-houseboat-audit.mjs` from `johansson-town`. Set `TOWN_AUDIT_PHONE_ONLY=1` for phone only. `TOWN_AUDIT_CHROMIUM` selects an installed Chromium binary. `TOWN_AUDIT_ENDPOINTS_ONLY=1` captures the two staged endpoint illustrations separately.
