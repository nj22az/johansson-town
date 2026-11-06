# Harbour noticeboard remake - design issue, 24 October 2026

**Updated:** 13:35 CEST / 11:35 UTC.  
**Status:** implemented in the game from revision A and published to `main` on the owner's word (24 October, 18:20: "Bring it to main after you built it", "Push pls"). See *Implementation* below.  
**Baseline:** `main` at `f3d7a4e03dbfc421f79d1ca9dd266c0946fe4d47`. This handover/index change is documentation only.

## Owner request

After the completed bench removal and before/after screenshots, the owner requested a technical drawing of the noticeboard so it can be remade realistically and correctly, followed by a request for a screenshot. The drawing is the next task; it does not reopen the bench removal or remove the accepted woodland poster.

## Delivered design

Four A3 sheets, **JW-NB-001 through JW-NB-004, revision A**, cover the general arrangement, weather/support details, artwork and corrected wording, and model/material/acceptance brief. Deliverables supplied to the owner:

- `Minato_Noticeboard_CAD_Rev_A.pdf`
- `Minato_Noticeboard_Rev_A.dxf` - editable R2010 model space, 1:1 millimetres
- `Minato_Noticeboard_Design_Package_Rev_A.zip` - drawings, dimension JSON, generator, unchanged woodland image, corrected flyer SVG, font/licence, full remake brief and verification
- `Minato_Noticeboard_General_Arrangement.png` and `Minato_Noticeboard_Display_Layout.png`

The proposed case has a muted green aluminium frame, a supported sloping rain hood, two clear acrylic leaves, a warm pinboard surface, service hardware and a drained sill. Its central frame avoids the woodland image. This is a World asset design, not a real-site structural or fabrication approval. Manufacturer examples are contemporary construction references, not 1997 provenance.

## Existing condition and source findings

`prop-factory.js noticeBoard()` is a 1480 x 1100 x 100 mm backing block at world heights 1000-2100, with two octagonal diameter-110 posts at 1240 mm centres. It has no hood, frame, glazing or header. The real woodland print/flyer stand 40/35 mm in front of the backing; four blank 15 mm blocks are on the reverse. The generic factory is also used by the building catalogue: scope the remake to a dedicated harbour assembly.

Placement is world X 5.5, Z -33.2 m, yaw zero, front towards world +Z. The left post is on paving at Y +40 mm and the right is on grass at +20 mm. The post bottoms are shallowly embedded at +5 mm, not floating. The existing walking collider is 1550 x 260 mm in plan. See `src/world/town.js`, `ground-plan.js`, `ground-standard.js` and `harbour-park-garden.js`.

## Proposed dimension schedule

All values are millimetres. Use **U = 1000*(world X-5.5), V = 1000*world Y, D = 1000*(world Z+33.2)**; front is +D. For Z-up CAD use X=U, Y=-D, Z=V. The PDF's finished-ground height is distinct from its world-datum level.

| Part | Control |
| --- | --- |
| Cabinet outer envelope | U -740..740; V 1000..2100; D -50..50 |
| Hood outer envelope | U -775..775; D -120..130 |
| Hood levels | Rear top 2180; front top 2150; front drip bottom 2130 |
| Hood construction | 2 mm sheet; 30 fall in 250 projection; rear upstand to underside V 2169.6 and side cheeks |
| Posts | 80 x 80 x 3; U centres -620/+620; D centre -90; tops V 2100 |
| Post bottoms / lengths | Left -560 / 2660; right -580 / 2680; 600 below respective local grade |
| Frame allocation vertically | 40 lower + 900 window + 40 transom + 80 header + 40 upper = 1100 |
| Nominal openings | Left U -700..205; right 230..700; both V 1040..1940 |
| Clear sight openings | Left U -675..180; right 255..675; both V 1065..1915 |
| Central opaque band | U 180..255, including both door frames and the 25 mm mullion |
| Backing / acrylic | Backing front D -20; 5 mm acrylic D 40..45; door front D 50 |
| Woodland paper | 800 x 560; centre U -247.5, V 1530; print box 780 x 520, contain-fit |
| Flyer | A3 297 x 420; centre U 465, V 1530; contain-fit the 900:1280 SVG |
| Cabinet fixings | Two levels per post: V 1210 and 1900; M8 into reinforced frame |
| Drainage | Three 6 x 20 underside sill slots; 5 mm post drain 30 above each local grade |

The closed **plan** envelope remains 1550 x 260, including caps and hardware. The proposed top V 2180 is 25 mm above the old maximum: derive collider height from the completed above-ground model. Below-grade support must not enlarge the walking obstruction. Footing/socket size is not specified by this asset design.

The left/right doors have nominal 905/470 mm service swings outside the closed envelope; they remain closed in ordinary gameplay. The closed hood clears the adjacent bed by 70 mm in plan. The existing reading anchor D 700 remains 570 mm forward of the hood. Opening clearances, gasket allowances and hidden acrylic engagement belong inside the nominal sections; sight sizes are not cutting sizes.

## Corrected wording

Header: **みなと掲示板 / MINATO NOTICEBOARD**.

The current SVG generator prints `OPEN DAILY 09:00-20:00` (with typographic dash in the source), but `src/commerce/sakura-rota.js` specifies Sunday-Friday 09:00-20:30, till cutoff 20:00, Saturdays closed. Corrected design artwork reads:

```text
OPEN SUN-FRI 09:00-20:30 | PURCHASES UNTIL 20:00
CLOSED SATURDAYS | CASH ONLY | PRICES INCLUDE TAX
```

The retired bus-stop label/description is removed in the supplied SVG; use Main Street and the harbour. Its old Bookshop label becomes Front-Row reading room. At implementation, change `scripts/build-sakura-flyer.mjs`, generated `assets/papers/sakura-flyer.svg` and accessible `src/commerce/sakura-flyer.js` copy together. Prices/stamp terms must remain catalogue-backed. No runtime copy is changed by this documentation issue.

## Implementation requirements

1. Build one harbour-specific local group from the dimension data; parent case, papers, hood and supports to it. Follow the current workflow: detailed prototype on `development`; no new remote branch.
2. Keep the accepted R3 woodland image/viewer/model bytes. Keep `harbour-notice-board`, Look, flyer reading/collection/filing, lazy model loading, single iframe, source/origin/token checks, Close/Escape/Back cleanup, paused hidden World and preserved return position.
3. Make the clear pane route picking correctly. Keep the poster legible without heavy reflections and preserve its accepted colour/material treatment.
4. Eliminate the floating paper slabs. Use a single printed display surface or remove underlying covered backing faces. Do not stack nearly coplanar print/backing surfaces or weaken `no-z-fighting`; the current poster's deliberate 6 mm workaround must be replaced coherently.
5. Show real hood support, mounting to reinforced frame, drainage into the open sill outlet and the two ground levels. Include all hardware in the stated closed envelope. Keep foundations schematic.
6. When implemented, rebuild runtime and run the full World guard plus relevant woodland/flyer checks. Capture actual compiled-game front, oblique, rear and phone views, inspect text and verify Look/open/close. Report physical-device testing separately.

The older generic "Other harbour notices" prose mentions tide times and fish-market hours without authored data. Do not invent a tide timetable or administering body; align visible notices and menu wording when implementing the case.

## Verification of this design issue

- 17 drawing/content/file assertions pass: paper containment, aspect, envelope, embedment, cabinet dimensions, corrected hours, removed bus-stop wording, unchanged approved artwork, DXF reopening/audit and millimetre units.
- Four A3 PDF pages rendered and inspected; Japanese heading embedded and visibly verified. Final changed sheets re-inspected after layout corrections.
- Independent geometry review corrected the right-side datum to V 20, the 1:2 post detail to a true 3 mm wall and the sill slot to an open drain passage. Hood support, nominal sight-opening definitions and hardware-envelope constraints are explicit.
- ZIP integrity checked. No game source/runtime change and no game tests claimed for this design-only issue.

## References

- [Shinyei SK-2071](https://www.shinyei-shc.co.jp/product/board/bd_sk2071.html), [manufacturer drawing](https://www.shinyei-shc.co.jp/catalog/web_download/board/SK-2071-1.pdf).
- [Kashii NBM](https://ps.kashii.co.jp/products/products-NBM-S-K.php), [manufacturer drawing](https://ps.kashii.co.jp/download/file/NBM-1210S_A01.pdf), [installation details](https://ps.kashii.co.jp/download/file/OD-K213.pdf).
- [Woodland poster handover](HANDOFF-WOODLAND-POSTER-2026-10-24.md) and [completed bench/frontage correction](HANDOFF-FERRY-OFFICE-FRONTAGE-2026-10-24.md).

**Next action:** use revision A as the measured basis for the noticeboard prototype and correct the generator/accessibility text together. The drawing task is complete; implementation and in-game acceptance remain outstanding.

## Implementation — 24 October 2026, evening

Built on `main` from the schedule above, and published to `main` on the owner's instruction (not via `development`).

- `src/world/harbour-noticeboard.js`: `NOTICEBOARD` holds the revision A numbers; `buildHarbourNoticeboard()` builds the case
  (back panel, stiles, sill rail with three underside drain slots, transom, header plate, top rail), the pinboard core and a
  cork face cut away where the papers and the mullion are, the 25 mm mullion, two 25 mm door frames with clear acrylic at
  D 40–45, hinges and cylinder locks, the 2 mm hood (30 mm fall over 250 mm) with front drip, rear upstand to V 2169.6,
  side cheeks and two gusset brackets on the post lines, and the 80 x 80 posts from 5 mm under their own grades (left +40,
  right +20) with side drain holes. Foundations stay schematic (nothing below grade is built). Collider 1550 x 260 as
  before; height comes from the model (2180).
- Envelope: the M8 fixings are drawn from inside the case into inserts in the posts, so no hardware passes D -130; the
  test asserts the built box is U ±775, D ±130, V top 2180.
- Papers: woodland sheet 800 x 560 (print 780 x 520) at U -247.5 / V 1530; flyer contain-fitted to the A3 space at U 465
  (420 mm high). Both lie 0.5 mm proud of the cork *in its cut-outs*: no paper lies over another face (the old 6 mm
  workaround is gone). The paper margin is a ring round the print in the print's own plane.
- Clear panes do not take clicks (`raycast` is empty), so a click on the glass reaches the paper behind and opens the board.
- Header plate artwork: `assets/graphics/noticeboard/header.webp`, printed by `scripts/build-noticeboard-header.py`
  (Noto Sans CJK JP Bold, OFL).
- Wording: flyer generator, `src/commerce/sakura-flyer.js` and regenerated `src/office/town-papers.js` now read
  "OPEN SUN–FRI 09:00–20:30 · PURCHASES UNTIL 20:00 / CLOSED SATURDAYS · CASH ONLY · PRICES INCLUDE TAX" (hours from
  `SAKURA_HOURS`), "Front-Row reading room" instead of Bookshop, Main Street instead of the retired bus stop. The board menu's
  invented "Other harbour notices" (tide times, fish market) became "About the board", describing what is actually pinned.
- Tests: `woodland-poster.test.mjs` rewritten for the drawn places, envelope, hood fall, post grades, click-through glazing
  and zero coplanar faces (10/10); `sakura-bench` (board name), `sakura-flyer`, `context-actions` pass; `no-z-fighting` 13/13
  (needs `NODE_OPTIONS=--max-old-space-size=4600` in this container). Full `ci-guard` not run locally; GitHub's run on the push
  is the full guard.
- Compiled game (`tools/woodland-poster-review.mjs`, now also shooting oblique, rear, header and flyer close-ups): all entry
  and return checks passed (Look opens one viewer, hidden World stops rendering, Escape/Back/Close clean up, position kept,
  phone fits, no page errors). Not checked: a physical iPhone/iPad, FPS.
- Open: the board's colours were judged in SwiftShader screenshots only; the cork was warmed once after the first capture.
