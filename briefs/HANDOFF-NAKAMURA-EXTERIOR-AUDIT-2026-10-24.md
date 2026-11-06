# Nakamura / Blue Coral exterior CAD audit — 24 October 2026

## Status and scope

Source-and-owner-screenshot audit only. No game geometry, collision, runtime or release changed. Reviewed main `ab36d61bdcf9ba0f8af2a1b568c67818f52ed37c`; source blobs: nakamura-dressing.js `d8802b63bdd2ba2ee9cdbab719635fefc15ef30b`, houses.js `355a161add4fa5f08d8002402101637adb24052f`.
The owner supplied a street view and asked for a CAD audit of the outside, especially the oddly placed pole and flag.
Read repository instructions, World instructions, HANDOVER.md and the applicable afternoon World handover.
This is a measured audit of procedural geometry, not an issued construction drawing or a runtime acceptance sign-off.

## Coordinate system and measured existing arrangement

All dimensions below are millimetres in the building's local frame: X along the frontage toward the family entrance; Z out toward the street; Y up from the town datum. The facade is Z=3850. Source: `src/world/okinawa/nakamura-dressing.js` NAKAMURA_FRAME / nakamuraFrontage, `houses.js` shopHouse.

| Element | Existing geometry |
| --- | --- |
| Building footprint | 4900 frontage × 7700 depth |
| Family doorway jamb centre lines | X=1120 and 2180, Z=3870; jamb width 70 |
| Geometric gap between jamb inner edges | X=1155–2145, width 990; not a certified usable passage width |
| Pole | X=2100, Z=4200; diameter 60; Y=0–2600 |
| Banner | Centre X=1880, Y=1850, Z=4200; 420 wide × 1300 high × 15 thick |
| Banner rotation | Local Y rotation 90 degrees: width runs along Z, not X |
| Banner extents | Approximately X=1872.5–1887.5, Y=1200–2500, Z=3990–4410 |
| Crossarm | X=1650–2100, Y=2520, Z=4200; diameter 30 |
| Foreground offset | Pole axis is 350 in front of facade datum, 330 ahead of jamb centre plane |

## Findings

1. **Entrance conflict — confirmed.** The pole's full X=2070–2130 diameter is within the 990-wide jamb gap, only 15 from its right inner edge in frontage projection. Its base stands directly on the approach to the family door; the banner is in the same approach at head/body height. This is not a kerb placement despite the source comment saying “at the kerb”. A moving-resident clearance test was not performed; do not infer a measured NPC collision from the screenshot alone.

2. **Flag and crossarm do not share a plane — confirmed.** The flag's 420-wide upper edge runs along Z, while the 450-long crossarm runs along X. They meet in projection near the flag centre instead of supporting its top edge. The banner's nearest X face is about 182.5 clear of the pole surface. This is a construction/attachment fault, not merely camera perspective. Its top is also 5 below the crossarm's underside at the crossing, with no ties.

3. **No credible base or wall fixing — confirmed in this builder.** The 2600-high pole is a bare cylinder ending at datum zero: no weighted foot, socket, fixing plate or brackets. It is presented as a movable opening-hours prop, but has no carrying base.

4. **Visible obstruction without a corresponding pole collider — confirmed in this builder.** nakamuraFrontage returns canopy and shutter solids, but no pole/base solid. Its opening-hours update hides the flag group; a future collision addition must follow those hours too. Whole-world interaction and collision registration have not been exercised.

5. **Banner is built as a rigid sign — confirmed.** kit.sign creates a board with thickness/edge, here 15. The intended kakigori cloth would read better as thin two-sided fabric with a hem and attachment loops. Retain the existing cartoon rendering; no new cloth simulation is needed for this repair.

6. **Awning and entrance need one coordinated check.** The existing full-width awning covers the counter and family doorway. The flag pole ends below it, rather than being structurally mounted to it. Keep the doorway, counter queue, lanterns and flag as separate occupied envelopes. The screenshot does not establish a collision between the lantern and flag, and none is claimed.

## Recommended correction, pending implementation

Prefer a compact wall-mounted ice flag on the **counter-side outer pier**, away from the family entrance. This avoids adding a weighted foot to a narrow customer apron. Retain the opening-hours visibility behaviour. Do not relocate to the park corner without checking the existing bench/table/parasol and bougainvillea.

Provisional design targets, not measured existing dimensions and not a claim of regulatory compliance:

- Cloth: approximately 450 wide × 600 high, lower edge at least 2000 above the finished walking surface if it projects into a pedestrian approach.
- Two visible wall brackets, supporting rod and crossarm; all cloth attachment points lie on that crossarm's plane.
- Pole/rod and wall fixtures stay outside the family doorway's 990-wide geometric opening and its forward approach.
- Preserve at least a 1000-wide unobstructed approach outside the existing doorway wherever the site allows; do not describe the existing door itself as 1000 clear.
- Reserve the counter's customer standing/queue space and preserve clear sight of the menu.
- Read the actual paving elevation from the ground plan; do not introduce a separate slab or use Y=0 as an assumed finished ground.
- If a freestanding alternative is chosen instead, provide a deliberate weighted base, ground contact, collider and a location wholly outside door/queue/walking envelopes.

## Acceptance and next concrete action

Implement the small repair using shared placement data for geometry, purpose notes and collision. A larger architectural prototype belongs on development under the three-branch workflow; this audit does not authorise an unrelated rebuild.

Check the resulting full flag/bracket envelope against jambs, counter queue, awning, lanterns, nearby planting and pedestrian routes. Verify opening and closing remove/show all relevant parts and colliders. Run focused Nakamura/enterable-site/ground/sign geometry checks, the World CI guard, then rebuild runtime and verify its package for a runtime change. Capture front, both obliques and overhead views, open and closed, plus walk-through at the family entrance and counter. Physical iPhone/iPad acceptance remains pending.

Checks actually performed here: read and compared the current source construction and the owner's supplied image; calculated jamb gap, pole projection, flag extents and attachment-plane mismatch from those constants. No automated gameplay tests, new rendered views, GPU checks or physical-device tests were run. All six findings remain open; none is signed off by this documentation.

## Drawing delivery — 24 October 2026

Owner requested to see the CAD. Delivered a two-sheet A3 PDF (existing simplified front elevation 1:40, entrance plan 1:10, flag plan 1:10, proposed mount 1:25), plus millimetre DXF model-space views. Proposal is explicitly provisional; the PDF is an audit drawing, not a complete architectural survey. Both final PDF pages visually inspected after correcting layout. DXF reopened with ezdxf: zero audit errors and zero fixes. PDF reopened: two pages. DXF dimensions are drawn linework/text, not native associative dimension entities. No runtime changes or new gameplay tests.

- [Drawing PDF](https://chatgpt.com/library?file_id=libfile_ec512abac9648191b9fc7f5fd62d2ba0&account_id=personal)
- [CAD DXF](https://chatgpt.com/library?file_id=libfile_ad0ec431df908191917443393c812a2d&account_id=personal)
