# Johansson House - final game integration contract

Revision F, 13 October 2026. This is a coordinated game production reference. The architectural asset and reference system behaviour are validated; this file does not claim construction approval or a tested live Johansson World deployment.

## Import

1. Import `Johansson_House_Architecture.glb` and `Johansson_House_Services.glb` at scale 1. GLB is in metres, Y up; CAD/JSON is in millimetres, Z up. Transform CAD points to game `(X/1000, Z/1000, -Y/1000)` exactly once. The southwest ground corner is the origin. Do not add the former 100 mm floor offset.
2. Read `building_manifest.json` schema 2. Each GLB node name is a stable ID. Original room IDs survive. `migration_from_E` covers all 58 prior assets: preserve or alias supported IDs, retire superseded extract relationships. Rebind saved states by ID, never mesh order. Do not import either inherited Revision E GLB alongside the replacement.
3. Static collider data is in `collision.json`. Use solids, guards, the six internal ramp/landing proxies and the external ramp proxy. Do not turn every visible triangle into a collider. Services, glass, fixtures and equipment envelopes are non-static. Sliding-door panels need dynamic collision and must disappear from the passage when open.
4. Player reference capsule is radius 0.25 m, height 1.8 m, maximum step 0.2 m and slope 40 degrees. Internal and garden stairs have 0.175 m terminal steps and approximately 35 degree ramp slopes. Rebuild host navigation with doors open; close/open nav links by persistent door IDs. Flood alarm disables basement entry links.
5. Use level and kind prefixes to group B1, G0, L1, roof, yard, services and fixtures. Hide roof/upper level groups when the indoor camera enters a room. Disable shadows for service lines. Use room occlusion and static batching; reference exports together contain fewer than 1000 nodes and 20000 triangles. Host frame rate is a separate acceptance test.

## Systems

The functional graphs use namespaced logical nodes; `nodes_mm` are real positions. The old schematic drawing coordinates are superseded. Each spatial route has its own source/destination physical port. Hot and cold ports, air and condensate ports, and electrical terminals are separated within a 250 mm envelope of their logical equipment centre. The service GLB includes round visual envelopes. Same-family lines may share a trunk or conduit run; sanitary vent and soil are a continuous stack. Distinct service families have zero checked tube-envelope collisions.

Electrical supply is a game assumption: single-phase three-wire 100/200 V, 60 Hz. 100 V branches are assigned L1/L2; 200 V loads use both. Schedule amperes are W/V for the simulation model. Ratings and trip thresholds define gameplay, not installation cable or protection requirements. The groups distribute 19 local room lights and 11 dry-room sockets. Room light toggles combine with upstream circuit availability. The aggregate active demand also trips MAIN above 12 kW. Protective-earth fault state trips the affected branch and is restored only through the repair gate. Branch isolation affects descendants; board isolation affects its entire zone; main isolation affects all consumers.

Cold water enters via island service, meter, shutoff and manifold. Hot water depends on cold availability, fuel, healthy heater and HEATER_E power. Use the pressure assumptions and fixture flow schedule, not inferred real pipe capacity. The 180 L tank is bounded, with 0.05 L/s game recovery. Sanitary gravity paths all fall at least 2%; the basement lift requires PUMP power, healthy pump, check-valve state and clear soil/outlet nodes. Roof, courtyard and lightwell drainage are separate from sanitary wastewater. Storm sump needs STORM_PUMP power and an unobstructed independent outlet.

General, sauna and smoking extract are independent ducts and fans. Full design mode uses 400 m3/h supply and 180+100+120 m3/h exhaust. An extract fault must not implicitly disable an unrelated fan. Local cooling G/L depends on its own circuit and condensate availability. Two 4 kW cooling zones cover selected 50 m2 zones; remaining spaces use fans and operable windows. This is an explicit game climate model.

## State, faults and interactions

Use `source/reference_sim.py` as the executable state contract. All breakers and valves start closed, fans off, door panels closed, no faults, tank full and empty sumps. Room light switches start on. Persist `schema`, breaker/valve/fan/door/light switch states, protective-earth states and requested load demands, faults, fuel/heater availability, verified-isolation state and tank/sump volumes under `johansson.house.v2`. Serialize by stable ID. An unknown schema requires explicit migration; reject unknown door and breaker IDs and out-of-range volumes.

Repairs require upstream isolation and simulated verification before changing the fault state. Resetting a breaker does not repair its fault. Visible equipment envelopes provide interaction targets; approach positions are metadata and require host path projection. Do not teach live electrical repair through gameplay. Fault states include branch trip, open conductor, leakage, supply failure, water shutoff, blockage, pump failure, fan failure, condensate blockage and flood. The reference model bounds its time step to 60 simulated seconds and raises overflow alarms instead of treating lost discharge as harmless.

## Host acceptance

These are integration specifications, not outstanding defects in the reference package. The following host checks are required after import:

- Walk to all 19 rooms with open doors at desktop and phone aspect ratios; ascend/descend both internal flights and the garden stair without snagging, falling through seams or hitting upper-camera geometry.
- Confirm transparent windows, door travel and collision state; ensure basement court and lightwell voids remain unfilled by host terrain.
- Import node IDs unchanged, apply coordinate conversion once and confirm southwest origin and the three FFL datums.
- Exercise all 31 reference regression cases inside the live host and verify state survives a full game reload; prove Revision E save-state mapping before replacing an existing player's house.
- Verify equipment approach markers are reachable; roof vents and flue are maintenance-only, not player access routes.
- Verify room lighting toggles, isolation, water loss, lift and storm pump alarms, extract independence and condensate interlocks are reflected visually.
- Check frame rate under the actual town workload, memory, draw calls, shadows, occlusion and indoor camera transitions. Reference targets remain 60 fps desktop / 30 fps iPad; this package cannot certify host performance.

## Rebuild and verification

Install the Python dependencies listed in `source/requirements.txt`. Run `python source/build.py`, `python source/test_sim.py` and `python source/validate.py` in that order. The builder rewrites CAD, GLB, schedules and the drawing book. It does not re-author this final report or decision register. The independent validator writes machine-readable findings. `source/RevisionE_Input.json` is retained solely as provenance and migration input; its design holds do not describe the final issue.
