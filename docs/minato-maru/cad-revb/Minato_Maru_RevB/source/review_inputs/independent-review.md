# Minato Maru — independent chief review IR1

**Reviewed issue:** CAD Revision B and the corrected local source based on commit `e87c06b16734d882626be7fe6cdd2ab153d649c4`, 13 October 2026.

**Disposition:** accepted as a checked correction and preliminary engineering-reference package for design review. **Construction release remains withheld.** This independent AI review is not a registered engineer's signature, survey, flag approval or classification approval. It does not describe a complete real-vessel building design.

## Independent evidence

The reviewer reran every available `tests/ferry-*.test.mjs` test against the final local source: **80 passed, zero failed**, in 5.02 seconds. This includes generator relocation and centre/outer-aisle walking, longitudinal pipe bounds, engineering-route rejection, hydrostatic convergence/independent polygon integration, electrical side records and source-generated drawing consistency. Tests establish the model's behaviour and arithmetic; they do not prove real escape adequacy or physical-system performance.

The final drawing book contains **55 pages: nine A2 sheets and 46 A3 sheets**. All 55 final pages were visually inspected through seven montages; dense schedules and source ratings received closer inspection. Independent PDF inspection found correct paper sizes, Revision B, APPROVAL NONE and construction-withheld status on every page, with no off-page text words. The earlier table-note overlaps are closed. Measured PDF vector lengths confirm a 5 m scale bar is 50.000006 mm on the 1:100 context and 100.000006 mm on the 1:50 arrangement. The plan transform also gives 110 mm for the 5,500 mm engine-room length and 159.2 mm for 7,960 mm breadth.

Every one of the **55 sheet DXFs and the separate spatial DXF** was reopened independently with ezdxf and audited. All use millimetres; no errors or automatic fixes were reported. The section-sheet LINE entities now all lie in the XY drawing plane, closing the original mixed 2D/3D projection defect. The separate spatial model remains explicitly an equipment-envelope and pipe-centreline reference.

Live corrected ship particulars, GA, machinery, electrical particulars, loads, sources and feeders exactly match the final CAD source snapshot. The accepted engineering-pipe collection and unresolved registry also match. Final physical CAD uses **55 conceptually accepted paths**; **151 positive-DN connections remain unresolved**. Four additional topology links are signals. The **172 game previews remain unverified visual representations**, retained only as such. Accepted paths do not prove actual nozzle ownership, pipe classes, penetration integrity or a full-hull clash check.

Independent Python recalculation reproduced the machinery record without discrepancy: 24.12743158 L swept volume, 16.947054 bar BMEP, 9.00 m/s mean piston speed, 3,253.834 Nm crankshaft torque, 73.1031 L/crossing including assumed generator duty, and 9.2335 days on the crossing-only usable-fuel basis. Alongside operation, reserve policy and adverse conditions remain excluded.

The corrected one-line was checked against live records. Shore primary is 200 V, 144.3 A, 160 A frame/145 A provisional setting; ship-side secondary is 440 V, 65.6 A, 80 A frame/66 A provisional setting. ETR is 5 kVA at 440/105 V, with 6.6/27.5 A and 10/32 A frames, 7/28 A settings. The emergency set is correctly distinguished as 445 V nameplate and 440 V nominal distribution. Manufacturer selection, transient performance and protection coordination remain open.

## Review findings closed before issue

| Finding | Verified repair |
|---|---|
| Section DXF boundaries and equipment occupied different planes | Both use consistent 2D view projections; spatial model is separate |
| One-line retained old 75 A shore and 10 kVA ETR literals | Final page 50 is derived from side-specific corrected source records |
| Dense schedule rows overlapped verification headings | Line and feeder page chunks reduced; final pages inspected with clear note separation |
| Game previews could enter engineering CAD without acceptance | Physical export uses `engineeringPipes`; unresolved connections receive a separate register |
| Routing envelope lacked longitudinal bounds | Radius-aware longitudinal checks and regression pass; nozzle ownership limitation is explicit |
| Revision, physical scale and creator-approval metadata were inconsistent | Final B issue, actual mm scales, distinct manufacturer references and APPROVAL NONE verified |

No remaining defect blocks issuing this bounded reference package. The following items still block real ship construction and physical acceptance.

## Construction and physical-design holds

1. **Service and approval basis:** agree actual flag/class, domestic passenger/vehicle service, tonnage and applicable rules. The 1994 setting and nominal 199 GT are design narrative, not evidence of registration or certification.
2. **Weight and stability:** retained 1.900 m immersion gives 375.41053 t geometric seawater displacement. The conditional nominal 289.010 t schedule leaves 86.40053 t unexplained. The 210 t lightship is unverified; GM 1.6 m is a game-motion parameter. Resolve verified weights/CoG, trimmed hydrostatics, loading cases, GZ, downflooding, intact and damage stability. Arithmetic residuals are not payload approval.
3. **Structure and tanks:** the relocated paired trim tanks and extended main ballast allocation fit concept reserves: respectively 4.8524 m3 versus 4 m3 nominal and 16.4238 m3 versus 16 m3 nominal. ER fluid reservations of 16.9 m3 fit within 18.5526 m3 planning reserve. These values include stated geometric/structure allowances and are not fabricated net capacities. Plate/frame/foundation calculations, welds, partition/access/vent/suction arrangements and calibrated tank volumes remain missing.
4. **Actual machinery and shaft line:** the Johansson engine remains fictional; later OEM outlines and ratings are separate comparisons. Obtain selected engine/gear duty, certified mass/CoG, bolts/mounts/nozzles, foundations and thrust reactions, shaft alignment/bearings, propeller matching, fatigue and torsional vibration.
5. **Access and overhaul:** moving the generators into the auxiliary room corrects the demonstrated blocked service band and model-walk routes. Nominal room headroom remains 1.90 m versus a 2.00 m yard route target; the proposed engine envelope leaves 0.25 m overhead. Protected escape continuity, piston/liner/head removal, deck covers, lifting points, rigging, crane capacity/reach and lift stability remain unresolved.
6. **Piping and service duties:** resolve the 151 unsupported, missing or obstructed positive-DN connections. Conceptually accepted routes use planning radii and recorded game terminals. Actual pipe outside diameters/walls/insulation, fittings, supports, ownership, hull/fire/watertight penetrations, hydraulic losses and pump curves remain open. Ventilation, cooling, exhaust backpressure, fuel/air starting and fire-suppression protected volumes require selected-equipment calculations.
7. **Electrical installation:** complete actual generator/transformer/motor/cable selection, fault duties and discrimination, grouping/temperature installation checks, upstream-to-terminal drops, DC inventory and battery/endurance arrangements. The 52.5 kVA emergency fire-pump starting scenario exceeds the 40 kVA continuous rating; transient capacity is unknown. Current-only arithmetic cannot prove acceleration or voltage recovery.
8. **Final approval and acceptance:** qualified human review, selected suppliers, accepted class/flag drawings and applicable fabrication, shop, onboard and sea-trial testing are required. The package contains no such certification.

## Scope and traceability

This review covers the supplied partial source snapshot, the generated CAD package and the listed engineering records. It does not establish a full town runtime build, browser performance, published-site deployment, as-built ship or real machinery trial. The 92,316-triangle/39-mesh regression is a software budget result, not a measured frame-rate guarantee.

The numerical/reference checks were informed by the independently opened primary ClassNK Part H June 2026 reference and Yanmar 2020 brochure. Applicability remains to be agreed. The legacy H physical reference and later C operating reference remain explicitly separate; outline literature does not supply a vessel-specific installation drawing.

Machine-readable evidence, reviewed artifact hashes, check counts, closed findings and hold IDs are in `independent-review.json`. The drawing-book SHA-256 is `58cdb31dee474ef41c7361196294cb159ed47df62fd31467c200068db2071d0d`.
