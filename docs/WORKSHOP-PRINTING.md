# Workshop printing and Sakura sales

Kenji & Tetsuo Repairs now contains a Form 3D printer on the existing rear bench
and a usable StepWise calculator. The current shop footprint, staff, arcade and
entrance are retained. Approach either tool and use E or the touch action.

1. Select a pattern at the printer. StepWise shows its material cost, Thuan's
   buying price and the resulting earnings. The actual StepWise app can also be
   opened inside the game from the estimate. Form 3D Studio can be opened from
   the printer. Closing either tool returns to the workshop without navigation.
2. Pay the displayed material cost once. The machine runs for 8–16 seconds of
   active exploration, even when visiting another location. Menus pause it along
   with the game. The moving head, rail, spool and growing sample show progress.
3. Return to collect the finished model. A full bag leaves it on the printer.
   Only one of each design can be carried. The Field book offers a rotatable 3D
   inspection of each model in the bag.
4. Talk to Thuan inside Sakura Konbini and choose **Sell my workshop models**.
   Thuan must be present and working, 09:00–20:00. Each sale removes the model and
   credits its displayed price. A replacement can then be printed.

| Form 3D pattern | Materials | Thuan pays | Time |
| --- | ---: | ---: | ---: |
| Johansson cable ring | ¥40 | ¥120 | 8 s |
| Johansson pencil capsule | ¥100 | ¥280 | 16 s |
| Involute spur gear | ¥60 | ¥180 | 10 s |
| Threaded hex bolt | ¥30 | ¥100 | 8 s |
| Reinforced L-bracket | ¥80 | ¥220 | 12 s |

These are fictional town prices. The printer stocks these five patterns; edits
in the separate full Form 3D application do not become additional inventory
recipes. Both full apps load only after their button is chosen. No real-money
transaction, external checkout or uploaded user model is involved.

The catalogue meshes are generated from the existing MIT-licensed recipes in
`../form-3d-studio/src/open-models.mjs` (the sibling Form 3D Studio project), then simplified to at most 3,000 triangles
per solid for game use. All five total approximately 338 kB of JSON; only the
selected model downloads. They are display meshes, not manufacturing exports.
Use the full Form 3D application for its original STL and STEP export.

To regenerate: install `form-3d-studio` dependencies, then run
`node scripts/build-workshop-models.mjs` from `johansson-town`. Rebuild the
published runtime with `npm run build:runtime` after source changes.

Printing state and inventory remain in `johansson-town-1988-v5`. Old saves gain
an idle printer; paid progress and ready prints survive reload. Printed models
are deduplicated when restoring a save; fish and ordinary shop purchases still
stack. Transactions reject stale input, insufficient funds, full bags and
out-of-hours sales without consuming the player's item or payment.
