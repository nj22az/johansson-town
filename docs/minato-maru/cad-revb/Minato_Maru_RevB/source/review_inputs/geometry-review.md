# Minato Maru machinery arrangement and piping review

Reviewed source baseline: e87c06b16734d882626be7fe6cdd2ab153d649c4. This review does not confer class, flag or construction approval.

## Demonstrated corrections

Both generator sets have moved forward 2.65 m into the existing auxiliary machinery room. Their beds formerly occupied yard z12.55–13.40 m and now occupy z15.20–16.05 m. All generator geometry, maker plates and fuel/oil/water/air anchors follow that translation. Remote generator operation remains at the main switchboard; two local operating stations follow the auxiliary-room panels.

The main-engine air filter reaches yard z13.00 m. Relocating the generators removes the overlapping plan footprints at its forward end and leaves a 1.00 m service band to the engine-room forward bulkhead at z14.00 m. In the auxiliary room, the innermost generator panel faces are at x±0.50 m, giving a 1.00 m centre aisle. The outboard alternator features reach approximately x±2.445 m against side plant beginning at x±3.48 m, giving at least 1.035 m nominal side clearance. These are measured model clearances, not supplier overhaul minima. Model walks verify the centre aisle, both outer aisles and access to the local generator panels. The route crosses the auxiliary room orthogonally at z16.55 m, avoiding the sewage tank and generators.

The fuel quick-closing valve was placed at the deckhead and directed its 0.25 m terminal stub upwards into the car-deck structure. Its operating anchor has moved from 1.90 m to 1.50 m above the floor plates, with a 0.12 m stub. The outside-radius check places the terminal below the deckhead.

The watertight-door top frame projected 50 mm into the deckhead; its frame now finishes at the underside. The door notice and workshop sign were above the available 1.90 m room height; both are now on adjacent bulkhead panels below the deckhead. Door widths and room-to-room passage topology remain unchanged.

Engineering routing now checks every segment against conservative outside-radius-expanded equipment boxes and against already accepted independent pipe routes. It checks transverse, vertical and longitudinal machinery-room limits. Only a declared first/last terminal penetration may leave those limits. A first/last stub may enter a conceptual equipment box containing its recorded terminal; this does not establish physical nozzle ownership. Empty and nonfinite paths are rejected. Unsupported, missing and obstructed positive-DN edges produce explicit issues rather than assumed valid pipes. A bounded set of alternative lane positions/orders is attempted. Engineering segments retain source-line identity, so overlapping independent loops are not silently combined into a fabricated main.

The game retains its 172 illustrative paths, explicitly marked `visual-preview-unverified`, in `FERRY_INTERIOR.pipes`. Only `FERRY_INTERIOR.engineeringPipes` is the accepted engineering registry. The visual union of coincident preview bars and bends is solely a game rendering operation. The strict registry is cached on first access, keeping the approximately 1.3-second audit out of ordinary game startup. A measured standalone module import took about94 ms in this environment.

## Actual arrangement and open holds

The floor remains0.90 m above the keel and the deckhead2.80 m above the keel:1.90 m nominal clear height before services. The engine-room plan remains yardz8.50–14.00 m andx±3.98 m. No deck elevation or ship stability property has been altered by this geometry work.

The main-engine guard rails leave approximately1.26 m between their inside faces in the centre aisle. This is a game collision measurement, not a supplier or statutory access approval. The primary ladder is0.75 m wide. The decorative aft starboard escape ladder is only0.40 m wide; no complete protected trunk, openable hatch and operating escape arrangement has been verified.

The lagged main exhaust run has a nominal outer top1.89 m against a1.90 m deckhead, leaving only10 mm nominal model clearance. Supports, insulation tolerances and hot-surface separation remain unverified. The restored forward service band does not establish a complete engine-overhaul procedure.

The current diagram-node anchors often use one position and one leaving direction for both device inlet and outlet. Fuel supply/return paths, serial valves and independent engine coolant/oil loops need separate physical ports and explicit manifold junction/spool records. Additional candidate paths cannot establish the correctness of an unknown port arrangement.

The current strict bounded result is55 clear paths and151 explicit issues across206 positive-DN diagram edges:9 missing physical terminals,25 systems without coordinated3D routing(exhaust and hydraulics),94 pipe-clearance candidate failures,18 equipment-clearance candidate failures and5 machinery-space-envelope failures. These are algorithm results, not proof that no feasible physical design exists. A complete piping redesign remains necessary. The JSON records every accepted edge, issue and current anchor coordinate.

No engineered removable hatch, lifting beam, rigging envelope, foundations, vibration isolation, flexible connection specification, hot-surface separation, pipe supports or watertight penetration schedule is validated. The check is against conceptual equipment boxes and a rectangular machinery-space envelope; it is not a complete closed-hull plating or supplier-nozzle clash approval. `FERRY_ENGINEERING_ARRANGEMENT` exports these holds for drawings and review.

## Verification

Thirteen new regressions cover rejected-route handling, finite outside radius, terminal equipment-entry scope, successful alternative routing, independent-loop identity, all-edge coverage including unsupported systems, revalidation of the accepted registry, preview preservation, relocated generator footprints/labels/ports, local operating positions, all three auxiliary aisles, invalid-path rejection and longitudinal envelope limits.

The six-file scoped run comprises48 tests covering these changes plus existing ship geometry, machinery operation, game pipe preview, ladder access and below-deck walking. The unchanged render budget is100,000 triangles and fewer than40 meshes; the corrected model measures92,316 triangles in39 meshes. Passing game software checks does not release the vessel for construction.
