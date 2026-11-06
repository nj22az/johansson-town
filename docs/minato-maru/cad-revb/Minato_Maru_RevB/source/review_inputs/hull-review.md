# Minato Maru — hull and stability engineering review

Revision basis: source snapshot `e87c06b16734d882626be7fe6cdd2ab153d649c4`, reviewed 13 October 2026. Calculation source: `src/world/ferry-engineering-hydrostatics.js`. Detailed inputs and results: `hull-results.json`.

**Disposition: game hull inconsistencies corrected in the proposed particulars and tank allocation; real ship construction and stability release withheld.** Numerical consistency of a game envelope is distinct from an approved vessel design. This review is a second calculation discipline within the project, not a signed naval architect or classification-society approval.

## 1. Exact hull, dimensions and the displacement defect

The calculation reproduces the actual parametric hull in `ferry-model.js`, rather than assuming that a block coefficient describes it. The source functions are `sheer`, `deckEdge`, `halfBreadth`, `keelY`, `fullness`, `narrowing` and `sectionPoint`. The original shipyard frame is x positive to port, y above baseline, z forward from the transom. The game origin is amidships on the design waterline. All calculations use metres, cubic metres and tonnes.

| Quantity | Previous assertion | Calculated or controlled correction |
|---|---:|---:|
| Length overall | 34.500 m | 34.500 m retained |
| LBP reference | 31.000 m | 31.000 m retained as stated reference, not surveyed |
| Moulded breadth | 8.400 m | 8.400 m retained |
| Moulded depth / car deck | 3.000 m | 3.000 m retained |
| Design immersion | 1.900 m | 1.900 m retained to preserve physical propulsion arrangement |
| Immersed volume | Not calculated from hull | 366.254176 m³ |
| Displacement in seawater, density 1.025 t/m³ | 283.000 t | 375.410531 t |
| Block coefficient on stated LBP | 0.5600 | 0.7402663 |
| Block coefficient on LOA | Not stated | 0.6651669 |
| Waterplane area | Not stated | 259.2792 m² |
| LCB from transom | Not stated | 19.25083 m |
| KB | Not stated | 1.05678 m |
| Transverse BM | Not stated | 3.89221 m |
| Transverse KM | Not stated | 4.94898 m |
| TPC | Not stated | 2.65761 t/cm |
| Lightship | 210 t | Legacy assumed mass retained separately; not verified |
| Deadweight | 73 t | Arithmetic difference 165.41053 t only; not certified capacity |
| Loaded GM | 1.600 m | Animation assumption only; cannot be a verified stability particular |
| Gross tonnage | 199 GT | Fictional service descriptor; tonnage is not displacement or a verified measurement |

The old displacement differs from the current hull buoyancy by **92.41053 t, or 32.65%**. The corrected displacement is a calculation of the existing model at its chosen waterline. It is not proof that the real ship would weigh this amount. Neither lightship nor payload is increased to hide the difference.

## 2. Conditional immersion and propulsion consequences

Supplying the assumed 283 t weight gives an even-keel immersion of 1.521679992 m, and 210 t gives 1.198202014 m. These are conditional buoyancy solutions, not approved operating drafts. The 283 t case has KMt 5.46305 m; the 210 t case has KMt 6.42981 m.

The original propeller axis is physically 0.900 m above baseline, with 1.450 m nominal diameter. Its crown is 1.625 m above baseline and its bottom is 0.175 m above baseline. At the retained 1.900 m immersion the crown is 0.275 m underwater. At the conditional 283 t even-keel immersion the crown would be 0.10332 m above water, and at the 210 t even-keel immersion 0.42680 m above water. Stern-down trim can change these figures materially and must be solved before judging any actual loaded condition.

The model's old `SY=-1.0` was a waterline-relative number. Changing the draft while keeping it would silently move the physical shaft relative to the keel. The parent design therefore retains the 1.900 m waterline and corrects the particulars, while a weight and trim reconciliation remains open. A propeller-immersion and shaft-line check is required for every eventual loading condition.

## 3. Invalid aft peak and accepted tank relocation

The original aft-peak GA box occupied z=0–2.6 m, x=±3.5 m and y=0–1.0 m. Its nominal box volume is 18.2 m³, but its intersection with the actual hull is **0.000 m³**. The counter's bottom is 1.95 m above baseline at the transom. The claimed 4 m³ ballast cannot be installed in that position.

An initial alternative under the engine room fitted as an isolated geometric tank. The integrated whole-room tank budget then rejected it: the ER double bottom provides only 18.55260 m³ after explicit reserves, whereas existing fluids plus another 4 m³ would require 20.9 m³. The correct action is to move the aft trim tanks into the auxiliary double bottom and extend the principal ballast allocation forward under the workshop/store footprint.

| Tank zone | z range, m from transom | y range above baseline, m | Gross conformal envelope | After 10% planning deduction | Nominal target |
|---|---|---|---:|---:|---:|
| ER storage fluids | 8.5–14.0 | 0.10–0.68 | 20.61399 m³ | 18.55260 m³ | 16.9 m³ |
| Paired aft trim ballast | 14.1–15.4 | 0.10–0.68 | 5.39157 m³ | 4.85241 m³ | 2 × 2.0 m³ |
| Paired main ballast | 15.6–20.0 | 0.10–0.68 | 18.24865 m³ | 16.42379 m³ | 2 × 8.0 m³ |

The paired tanks start at x=±0.20 m. Their outboard sides follow the actual half-breadth minus 0.10 m. Their lower surface is max(0.10 m, hull bottom plus 0.10 m). The 0.10 m side/bottom reservation is a conceptual geometric clearance, **not a selected plating thickness**. The 10% deduction is a stated allowance for planning, **not calculated structure or a calibrated liquid capacity**. Whole forward DB envelope from z14–22.5 m is 35.24788 m³, with 31.72310 m³ after this allowance.

The original `aft-peak` source identifier may remain for compatibility, but its description and position must become the relocated aft trim DB tank, within `fwd-double-bottom`. Aft trim LCG is 14.75 m; main ballast LCG is 17.80 m. Tank partition, frame, manhole, sounding, vent, suction, drainage and neighbouring-service drawings remain required.

## 4. Explicit loading sensitivity

These scenarios deliberately disclose all masses and centres of gravity. Lightship is assumed at 210 t, KG=4.4 m, LCG=19.23 m. Passengers and crew use 90 kg/person including a baggage allowance; cars use 1.6 t each. The exact schedules are included in the JSON. The higher-KG case changes only assumed lightship KG to 5.4 m. Half-liquid cases retain full-state liquid CG heights as a conservative sensitivity assumption. Rectangular slack-tank dimensions are unverified bounding assumptions and do not define the actual tank construction.

| Conditional case | Weight, t | Even-keel draft, m | KG, m | FSC, m | Corrected initial GM, m | Indicative bow-down trim, m | Initial heel, deg |
|---|---:|---:|---:|---:|---:|---:|---:|
| legacy-lightship-only-assumed-KG4.4 | 210.000 | 1.1982 | 4.4000 | 0.0000 | 2.0298 | 0.061 | 0.00 |
| full-nominal-stores-and-all-ballast | 289.010 | 1.5474 | 3.8298 | 0.0000 | 1.5771 | -0.799 | 0.00 |
| half-liquids-all-slack-sensitivity | 259.665 | 1.4207 | 4.1401 | 0.4960 | 1.0734 | -0.467 | 0.00 |
| half-liquid-port-crowding-sensitivity | 259.665 | 1.4207 | 4.1401 | 0.4960 | 1.0734 | -0.467 | 5.53 |
| unverified-lightship-KG5.4-sensitivity | 289.010 | 1.5474 | 4.5564 | 0.0000 | 0.8505 | -0.812 | 0.00 |

Negative trim means stern-down. The full nominal schedule weighs 289.010 t, leaving **86.40053 t** unexplained relative to the retained design-waterline buoyancy. Its mass does not establish the actual lightship. Significant calculated trim requires a nonuniform-waterline hull solution; the table's initial GM and heel are upright, even-keel sensitivity outputs. A positive initial GM is not a completed passenger-ship stability assessment.

## 5. Verification and limits

Gauss-Legendre integration splits the hull at its geometry changes and waterline intersections. A transformed vertical coordinate removes the keel-section singularity. Orders 32, 64 and 128 produce displaced-volume agreement better than 0.000001 m³. Waterplane quantities converge separately, and the finite-difference displaced-weight derivative agrees with TPC. A separate direct-theta polygon-section calculation confirms volume within 0.04 m³; a direct parametric point test confirms the analytic inverse independently.

Ten numerical/regression tests pass. They cover original geometry equivalence, independent integration, convergence, unit consistency, density changes, conditional buoyancy roots, free-surface and CG arithmetic, negative GM/heel/trim flags, the impossible original aft peak, coordinated tank reserves and invalid numeric inputs. These checks establish calculation behaviour only. The game hull lacks evidence of actual plate offsets, sealed openings, appendage displacement, shell thickness, permeability and as-built weights.

The current local `ferry-ship.js` has also been checked against these results: published design displacement 375.41053 t differs from the calculated value by only 0.000000515 t; published Cb 0.74026634 agrees with the explicit LBP 31 m reference. The source retains 210 t lightship, 283 t operating target and the 165.41053 t arithmetic residual as unreconciled assumptions. It marks GM 1.6 m as game motion only, sets `massReconciled:false`, and withholds construction approval. Its relocated `aft-peak` identifier has z14.1–15.4 m and parent `fwd-double-bottom`, with a conformal shape and planning-capacity status. This verification concerns the local corrected source; it is not evidence of publication or a real ship approval. The exact checked fields are preserved under `currentSourceVerification` in the JSON.

## 6. Construction information still required

No plate thickness, beam section, weld size or engine-foundation bolt is invented or released by this review. A real drawing release requires the following controlled inputs and calculated documents:

- Confirmed service area, flag and applicable rules; assessed historical 1994 design basis separately from current reference guidance.
- Fair lines plan and offsets, watertight 3D hull, baseline/frame/perpendicular definitions, appendages and an independently checked hydrostatic dataset.
- Controlled structural and machinery weight estimate with VCG/LCG/TCG; hull and superstructure materials; completed lightship survey and inclining evidence at the applicable stage.
- Approved loading cases, KG limits, GZ curves and area checks, free surfaces, crowding/turning/wind, downflooding, trim, subdivision and damage stability.
- Scantling and global/local strength calculations: bottom/slamming and side/deck loads, vehicle concentrated/axle loads, bulkheads, tank hydrostatic loads, torsion, fatigue where applicable and buckling.
- Framing, shell/deck/bulkhead plating, connection/weld schedules and material specifications; fire and watertight boundary penetrations.
- Engine-bed local strength and fatigue, resilient-mount and bolt/chock design from vendor loads, lifting loads and overhaul paths, gearbox and thrust transmission.
- Shaft alignment and bearing reactions, shaft strength/critical speeds/torsional vibration, stern-tube and bracket/rudder/skeg construction, propeller/hull clearances and immersion in actual loading conditions.
- Tank boundaries and usable capacities including structural deductions; calibration/sounding tables; vents/overflow and internal access; corrosion/coating and pressure-test particulars.
- Freeboard/load-line and tonnage measurement, operating/loading limitations and flag/class plan disposition.

## 7. Primary reference evidence

These sources establish the scope of a genuine stability review. They do not certify this concept:

1. [IMO, Ship Design and Stability](https://www.imo.org/en/ourwork/safety/pages/shipdesignandstability-default.aspx): identifies subdivision, stability, free surfaces, watertight integrity and the relevant convention/code framework.
2. [IMO MSC.267(85), 2008 IS Code](https://wwwcdn.imo.org/localresources/en/KnowledgeCentre/IndexofIMOResolutions/MSCResolutions/MSC.267%2885%29.pdf): Part B 3.1 on liquid free surfaces, chapter 8 on lightship parameters and annex 1 on inclining procedures.
3. [ClassNK Passenger Ship Rules, December 2025](https://www.classnk.or.jp/hp/pdf/rules/501_passenger_e_202512.pdf): Part 4 chapter 4 calls for service-condition stability and heeling curves, determination of lightship centres of gravity and stability information for the master. Its applicability to any hypothetical real vessel must be determined by the chosen flag/class design basis.

**Final disposition:** the calculated design-waterline particulars and relocated tank envelopes are coherent at concept level. Weight, trimmed hydrostatics, full stability, actual tank capacity, scantlings and plan approval remain open engineering holds; the drawings must not be marked “approved for construction”.
