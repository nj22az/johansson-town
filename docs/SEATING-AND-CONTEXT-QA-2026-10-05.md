# Seating and context acceptance · 5 October 2026

**Accepted locally; these changes have not been published.** Final runtime: `game-BQeaasBb.js`. The original workspace source and compiled artifacts match the tested local copy. Verified source fingerprint: `2fa0f177f37c04c9aaf313b89a2c66aeeb579e00f4d6babbc3fa83a84c9b7f7c`. Park/Minato GLBs, bench dimensions and context CSS also match; previous runtime graphs remain available for cached pages.

## Changes

- Player and residents share measured pelvis/thigh clothing support against actual seat surfaces. Read, Phone, Eat and Drink preserve seated legs; sit/stand transitions, reservations and clear walking approaches are consistent. Low cushions retain their authored support heights. Short seated legs can naturally dangle; standing shoes are grounded, and seated shoes clear the bench and floor.
- Corrected seat surfaces, facing and positions throughout homes, shops, civic rooms, onsen and public benches. Added missing ferry/airport waiting seats. Furniture and mounted serving props follow the same elevations without raising residents off their floor.
- Replaced the Harbour Park bench with original Blender geometry. Editable source: [harbour-bench.blend](../art/park/harbour-bench.blend); generator: [build-harbour-bench.py](../tools/blender/build-harbour-bench.py); dimensions: [harbour-bench-spec.json](../art/park/harbour-bench-spec.json). Shipped [GLB](../assets/models/park/harbour-bench.glb): 67,964 bytes, 3 meshes/materials, 1,284 triangles. The compiled scene confirms this asset and its provenance.
- The LINE action rail offers one primary action and relevant secondary choices. Idle exploration has no generic Action button. Meals expose usable Order/Eat/Drink/Stand choices; closed kitchens suppress Order. Door prompts are deduplicated, menus clear controls, utilities remain in the Town book, and phone captions omit keyboard instructions. Native touch gestures and keyboard activation remain available.

Shared ordinary furniture elevations, measured from the local floor:

| Surface | Height |
|---|---:|
| Dining seat | 0.46 m |
| Dining table | 0.72 m |
| Service counter | 0.78 m |
| Till equipment top | 1.04 m |

## Evidence

- **Full suite:** 854 tests, 849 passed, 0 failed, 5 explicit skips. [TAP log](../../output/playwright/seating-accepted-phone/test-suite.tap) and [build log](../../output/playwright/seating-accepted-phone/build-runtime.log). This includes the 10 context state/DOM regressions.
- **Compiled phone seats:** [accepted report](../../output/playwright/seating-accepted-phone/report.json), `complete=true`: 145 unique targets and 145 successful interactions; one occupied observation passed after resident release/retest; zero failures, errors or callback fixtures. Setup used controlled stand points/cameras and room entry; seating, standing and walking used real controls. [Blender bench identity](../../output/playwright/blender-bench-final-phone/glb-identity.json) and [front/side audit](../../output/playwright/blender-bench-final-phone/report.json) verify the replacement.
- **Checkout/shortest cover:** [report](../../output/playwright/checkout-height/report.json), [Mrs Sato front](../../output/playwright/checkout-height/cover-mrs-sato-front.png) and [side](../../output/playwright/checkout-height/cover-mrs-sato-side.png). Mrs Sato, the shortest actual covering resident, measures 1.4048 m with shoulder height 0.8535 m and a clear face above the 0.78 m counter; both she and Thuan retain floor Y=0. Real green-tea pickup and service-bell checkout paid ¥120 from ¥500, returned ¥380, cleared the basket and delivered inventory, with zero errors. That capture exposed a fractional receipt timestamp; its correction is included in the final passing suite.
- **UI:** [audit report](../output/playwright/context-actions/ui-audit.md) with inspected final desktop and native-touch portrait/landscape frames. Visible primary E, single Tab/Enter activation, pauses, doorways, meals and hidden inactive movement controls passed.
- **Skill client:** [final first state](../../output/playwright/seating-skill-final/state-0.json), [second state](../../output/playwright/seating-skill-final/state-1.json) and [final image](../../output/playwright/seating-skill-final/shot-1.png). The installed web-game client used a launch-only Mac Metal adaptation; two actual input bursts moved from seated to normal walking. PNG/JSON outputs were inspected with no errors. This is separate evidence from the 145-target seat audit.
