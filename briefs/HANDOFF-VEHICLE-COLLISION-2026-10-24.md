# Vehicle collision repair — 24 October 2026

## Owner report
The phone screenshot shows overlapping bodies in Tetsuo’s green kei truck outside Sakura, with a Talk to Tetsuo prompt.

## Cause and correction
Departing vehicles moved their pedestrian collider off-map until parking again. The shared road placement now synchronises the same oriented collider for parked, driving, held, reversing, waiting and ferry-carried vehicles. Vertical bounds follow wheel height instead of blocking the ground underneath a raised car. The collision grid queries the small dynamic set at its current pose without rebuilding all static cells. Driving residents are excluded from proximity prompts, direct clicks and queued click arrivals; vehicle inspection and ordinary walking conversations remain available.

## Evidence
Nine new regression checks cover all four sides, rotations, forward/reverse/held states, old-bay clearance, visibility, elevated deck bounds, live spatial cells, Tetsuo’s real departure and driver prompt/click gating. The full World guard and the production-runtime check passed. Actual compiled-game acceptance walks the player into each side of the held truck, checks the moving boundary and old-overlap recovery, and captures desktop and phone-width views. See [QA evidence](../docs/qa/vehicle-collision-2026-10-24/report.json), focused.txt and guard.txt in that folder.

## Publication state
Verified candidate, not yet promoted to main. Validation workflow 40098829273. Main must be fast-forwarded only after reviewing screenshots and checking its current head; preserve concurrent unrelated changes. This candidate is retained by a review tag, not a new branch. No physical iPhone/Safari, packaged Linux or live GPS test was performed.

## Next action
Review screenshots, promote this checked candidate to main, verify Pages deployment, then remove the temporary validation transport files from development. Do not merge the development prototype branch.
