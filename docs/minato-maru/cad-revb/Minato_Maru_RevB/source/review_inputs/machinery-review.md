# Minato Maru — machinery design review M1

**Issue purpose:** preliminary engineering and game coordination. **Construction release:** withheld. **Reviewed basis:** current main snapshot e87c06b16734d882626be7fe6cdd2ab153d649c4, 13 October 2026. Equipment and arrangement reservations below must retain their qualification on drawing sheets.

The 1994 fictional Johansson Marine JM6-160 machinery remains the game identity. The physical reference is a later Japanese manufacturer package; it does not establish what a 1994 ferry actually carried. The installed-fiction fields and manufacturer-reference fields are separated in the data model to prevent that substitution becoming an undocumented assertion.

## Engine particulars and checked arithmetic

| Particular | Installed game design | Evidence/status |
|---|---:|---|
| Main engines | 2 | Existing design |
| Power, each | 460 kW at 1,350 rpm | Fictional design, not an OEM rating |
| Cylinders | 6 inline, four-stroke | Existing design |
| Bore × stroke | 160 × 200 mm | Fictional design |
| Swept volume, calculated | 24.127 L | π/4 × bore² × stroke × cylinders |
| Brake mean effective pressure | 16.947 bar | 1,200 × kW / (rpm × litres) |
| Mean piston speed | 9.00 m/s | 2 × stroke × rpm / 60 |
| Rated crankshaft torque | 3,253.83 Nm | Power / angular speed |
| Fictional engine dry mass | 3,000 kg | Unverified supplier mass |
| Gear ratio | 3.00:1 | Existing design, no capacity certificate |
| Propeller speed | 450 rpm | Consistent with the game engine and ratio |
| Shaft torque, assumed 97% gear efficiency | 9,468.66 Nm | Calculated screening value |

These values describe a plausible engine class. Numerical consistency does not prove thermal capability, durability, emissions, noise, thrust capacity or suitability for the selected propeller. The original rounded 24 L and 17 bar may remain short labels; the engineering record must use the calculated values and their basis.

## Manufacturer comparison, deliberately separate

The official Yanmar 2020 brochure identifies the mechanically controlled 6AYM-WST C-rating at 485 kW/1,900 rpm: six 155 × 180 mm cylinders, 20.379 L, 207 g/kWh at rated output, 60 L jacket-water capacity and 91 L lubricating-oil capacity. It lists a 24 V/8 kW electric starter with air starting optional. [S1]

The manufacturer-channel legacy WST datasheet gives the engine-only outline as 2,000 × 1,305 × 1,431 mm, with dry mass 2,365 kg. Its matched YX-181 hydraulic reversing gear weighs 560 kg and offers 2.08, 2.55 and 3.03 ratios. The illustrated package is 2,364 mm long; aggregate dry mass is 2,925 kg. This sheet calls the engine H-rating and lists a 7 kW starter, so that legacy hardware description must not be silently merged with the later C-rating configuration. [S2]

The reference package is attractive because it has mechanical control, individual-cylinder construction and published package geometry. Its 1,900 rpm rated speed is materially different from the game engine's 1,350 rpm. The reference 3.03 ratio yields approximately 627 rpm, rather than the game's 450 rpm. It is therefore a comparison candidate, not a confirmed replacement with the existing shaft line and propeller.

Mitsubishi's S6A3-MPTAW offers another documented physical comparison: 18.56 L, 1,636 × 1,036 × 1,421 mm and 1,900 kg. No complete matched gearbox interface was obtained. The S6A3-MPTA page includes generator-engine ratings; these must not be represented as approval for propulsion duty. [S3]

The gear offset, output coupling, foot coordinates, mounting bolts, flexible-coupling particulars and certified equipment centres of gravity remain **unknown**. Neither an outline sheet nor a flywheel-housing designation substitutes for installation drawings. The 2020 brochure's optional resilient mounts are shown for a freestanding gear arrangement; they must not be copied into an integral gear installation without confirmation.

## Dimensioned arrangement and removal reservations

Coordinates are metres: **x positive to port**, **y above keel**, **z forward from the transom**. A 2.70 m long × 1.50 m wide × 1.65 m high assembly reservation is centred at x = ±1.55 m, z = 10.70 m, with lower edge y = 0.90 m. Each envelope spans z = 9.35–12.05 m. The port envelope occupies x = 0.80–2.30 m; starboard occupies x = −2.30–−0.80 m. The envelope centre y = 1.725 m is a geometric planning point, **not certified equipment CoG**.

Reserve 3,600 kg per assembly: 3,000 kg fictional engine plus a 600 kg gearbox allowance. Foundations, shafting, insulation, liquids and lift rigging are additional. Actual weights and CoG must replace these allowances in the weight register before stability or foundation approval.

Planning access targets are 1.00 m on the operating side, 0.80 m opposite and 0.60 m at each longitudinal end. They are yard targets, not manufacturer or class minima. Existing nearby equipment, casing, control booth and generator geometry require a coordinated clash review. No relocation is authorised merely by drawing a rectangle in another already occupied room.

Current floor-plate elevation is 0.90 m and nominal underside of the deckhead is 2.80 m: clear height is only 1.90 m. The reserved machinery reaches 2.55 m, leaving 0.25 m overhead. That space cannot be certified for piston/liner lifting or a chain block. The 2.00 m clear-route planning target is not met before adding piping, cables and structure. This is an unresolved physical constraint, not a passing clearance calculation.

Draw 2.90 × 1.80 m clear removal-hatch reservations above each engine. The proposed clearance over the assembly outline is 100 mm at either end and 150 mm at either side. These are reserved openings only. A continuous vertical removal route, deck cut-outs and reinforcement, closure arrangements, lifting eyes, crane radius and vessel stability during the lift remain undemonstrated. The notional 3,600 kg assembly plus 400 kg rigging produces a 4,000 kg planning lift; **no lifting-appliance WLL or safe lift plan is selected**. Whole-engine extraction alongside with a shore crane is an option to investigate, not an established operation.

## Fuel budget and corrected endurance claim

Use explicit duty assumptions: both engines at 80% of rating; assumed SFC 210 g/kWh; fuel density 0.86 kg/L; 22-minute crossing; 20 crossings/day. Assume 65 kW total generator electrical load and 260 g/kWhe. The generator figure is separate from engine shaft SFC and includes the chosen aggregate conversion assumption.

| Calculated result | Value |
|---|---:|
| Main-engine fuel use, both | 154.56 kg/h |
| Generator fuel use | 16.90 kg/h |
| Propulsion fuel per crossing | 65.90 L |
| Crossing fuel including generators | 73.10 L |
| Crossing-only daily budget | 1,462.06 L/day |
| Usable storage: 15 m³ gross less 10% | 13,500 L |
| Endurance on that crossing budget | 9.23 days |
| Usable 1.5 m³ day tank autonomy | 6.77 h |

The former 46 L/crossing and sixteen-day tank endurance are not supported by this duty basis. Alongside/overnight operation, warm-up, diversions, reserve policies and weather are excluded; actual endurance may be shorter. No fuel-economy guarantee is implied. Service-tank volume also varies between the original arrangement prose (1.6 m³) and machinery particulars (1.5 m³); this must be normalised, not left as two different capacities.

## Ventilation, cooling, shaft and starting-air screens

Ventilation assumes 100 kW total room sensible heat, ambient air density 1.18 kg/m³, specific heat 1.005 kJ/kg K and permissible rise 10 K. Heat-removal flow is 30,356.7 m³/h. At full propulsion rating, fuel use is 193.2 kg/h; assumed 32:1 combustion-air/fuel mass ratio adds 5,239.3 m³/h. The conservative sum is 35,596.0 m³/h. Reserve 40,000 m³/h for a supplier design exercise. At an assumed 750 Pa and 65% total efficiency, this needs 12.82 kW total electrical input, 6.41 kW per fan for two equal units. Existing two 3.7 kW motors cannot prove delivered flow. This calculation does **not** select a fan, verify a trunk or revise a cable rating; actual OEM heat/air figures and measured duct losses are missing.

Cooling assumes fuel LHV 42,700 kJ/kg and 30% of fuel input rejected to cooling water. Per main engine, input heat is 1,145.78 kW and assumed water heat is 343.735 kW. At seawater density 1,025 kg/m³, cp 3.99 kJ/kg K and 10 K rise, screening raw-water flow is 30.26 m³/h per engine. The value is neither the engine pump rating nor an approved pipe size. Separate jacket, charge-air, oil and gear cooler duties, tropical seawater limit, fouling, pressure losses and pump NPSH remain open.

The existing solid 110 mm shaft carries 36.23 MPa in a pure-torsion screen. With arbitrarily assumed 40 MPa screening allowable, torsion-only diameter is 106.43 mm. That narrow nominal comparison cannot establish adequacy: propeller bending, cyclic thrust, fatigue, material certificate, keyways, bearing span, alignment and torsional vibration are excluded. Retain the 110 mm diameter only as a game assumption pending a class shaft calculation.

Two 150 L receivers falling from 30 to 18 bar gauge provide an isothermal reference-air estimate of 3.60 m³ at 1 bar absolute and the same assumed temperature as the receivers. This is not a normal-cubic-metre specification. Manufacturer air consumption per start, temperature correction and required consecutive starts are unknown; the available engine-start count must remain null. The game's three-bar deduction per start is a gameplay rule, not a receiver-capacity proof. The original 2.94 MPa equals 29.4 bar rather than exactly 30 bar; drawings must distinguish design pressure, normal working pressure and nominal legacy kgf/cm² labels.

## Review disposition

**Closed by this review:** arithmetic for displacement/BMEP/piston speed/torque; source separation; package-length identity; duty-defined fuel calculation; transparent screening formulas; explicit reservation versus actual installation data.

**Construction holds:** verified OEM engine/gear duty and period identity; certified weights/CoG; hull/shaft-line geometry and propeller matching; foundations and thrust reactions; fuel quality/pressures; cooling and sea-chest geometry; air-start capacity; ventilation fan/duct verification; exhaust backpressure, expansion and heat shielding; component overhaul access; vertical removal route and lift study; fire suppression protected volume and boundaries; shutdown/quick-closing valve arrangements. These holds remain outstanding and must be included in the final combined review.

Source code: `src/world/ferry-machinery-design.js`. Regression checks: `tests/ferry-machinery-design.test.mjs`. Machine-readable report: `machinery-specs.json`. Software checks validate the design record's calculations; they do not provide ship or equipment certification.

## Sources

[S1] YANMAR, 6AYM-WST/WET manufacturer brochure, engine and marine-gear specifications; accessed 13 October 2026: <https://www.yanmar.com/media/news/2020/05/22051608/6aym-wstwet.pdf>.

[S2] YANMAR Norway, legacy 6AYM-WST datasheet, specification table and combined YX181 outline; accessed 13 October 2026: <https://www.yanmar.no/theme/yanmarportal/uploadedFiles/Marine/productDownloads/Commercial-datasheet/6148-Datasheet-6AYM-WST.pdf>.

[S3] Mitsubishi Turbocharger and Engine Europe, S6A3-MPTAW product particulars; accessed 13 October 2026: <https://engine-genset.mhi.com/marine-engine/s6a3-mptaw>.
