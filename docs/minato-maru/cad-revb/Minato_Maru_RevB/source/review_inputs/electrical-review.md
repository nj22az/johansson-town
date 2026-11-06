# Minato Maru electrical engineering review

Revision: corrective engineering package, 13 October 2026. Source baseline e87c06b16734d882626be7fe6cdd2ab153d649c4.

**Status: engineering development — not for construction.** Numeric defects are corrected and regression checked. Manufacturer selection, generator dynamics, actual cable installation, fault duties and protection coordination remain review holds. No class approval or physical plant validation is asserted.

## Corrected transformer and shore schedules

The former lighting transformer record combined a 105 V, approximately 165 A secondary winding with the 440 V primary's 50 A breaker and 10 mm² cable. Each transformer now has separate primary and secondary records. Compatibility fields amps, breaker and cable describe the output winding. Frame and provisional long-time setting are distinct.

| Source | Side | Voltage V | Rated A | Frame A | Setting A | Live cores × mm² | PE mm² | Planning cable rating A |
|---|---|---:|---:|---:|---:|---|---:|---:|
| T1 | primary | 440 | 39.4 | 50 | 40 | 3 × 10 | 10 | 50 |
| T1 | secondary | 105 | 165 | 200 | 165 | 3 × 95 | 95 | 201 |
| T2 | primary | 440 | 39.4 | 50 | 40 | 3 × 10 | 10 | 50 |
| T2 | secondary | 105 | 165 | 200 | 165 | 3 × 95 | 95 | 201 |
| ETR | primary | 440 | 6.6 | 10 | 7 | 3 × 1.5 | 1.5 | 16 |
| ETR | secondary | 105 | 27.5 | 32 | 28 | 3 × 6 | 6 | 36 |
| shore | primary | 200 | 144.3 | 160 | 145 | 3 × 70 | 70 | 166 |
| shore | secondary | 440 | 65.6 | 80 | 66 | 3 × 25 | 25 | 89 |

Transformer line current is kVA × 1000 / (√3 × line-to-line voltage), assuming three-phase windings. The 105 V system supplies single-phase line-to-line circuits; secondary winding connection and phase balancing still require design. The ship shore connector receives 440 V from the quay's 200/440 V transformer. The former 75 A record did not identify its voltage side. New frames/settings are provisional selections, pending inrush, thermal, fault and time-current studies.

The main generators retain their 125 kVA/100 kW/445 V nameplates (162.2 A each) and 200 A frame/170 A game setting. Nominal distribution is explicitly 440 V; set-points and available kVA at that voltage require OEM confirmation. Both main generating sets are relocated to the auxiliary machinery room to clear the main-engine maintenance envelope. Two parallel 95 mm² sets per phase assume matched length and terminations. The space-centre route estimate to the control booth is 13 m. Each parallel set carries approximately 81.1 A; hot resistance-only generator-cable drop is 0.0964% at 445 V. Actual tray and transit routing remains unverified. The emergency generator remains 40 kVA/32 kW/445 V (51.9 A), with 63 A frame/52 A setting and 16 mm² live conductors plus PE. Those selections are not proof of generator thermal protection or starting capacity.

## Cable calculation and complete inventory

Copper resistivity is ρ(T) = 0.0175 × [1 + 0.00393 × (T − 20)] Ω·mm²/m. At 90 °C, ρ = 0.02231425, 27.51% above its 20 °C value. The full-load model now uses that hot-conductor value. Three-phase drop uses √3 × I × ρ × L / S / U; single-phase and 24 V DC use 2 × I × ρ × L / S / U. L is one-way length, so the two-wire formula includes the return conductor. These resistance-only estimates exclude transformer regulation and complete upstream impedance.

The cable selector now fails explicitly if its largest listed section cannot meet ampacity and drop; it cannot silently accept an inadequate final size. A 5% final-feeder budget reserves a nominal 1% for upstream cables, but that upstream allocation remains unverified. All modelled feeders include a separate, conservatively full-size PE. Three-phase board feeders have three live cores plus PE; single-phase feeders have two live cores plus PE. Star-delta motor tails identify six live cores plus PE and must not be confused with three-core supply feeders. Actual tail length and section still require terminal, thermal and short-circuit verification.

Two retained room-air-conditioner feeders now serve all four units, each carrying two units at 22.4 A, with 25 A protection and 6 mm² cable. The three workshop motors and two toilet fans now retain their complete inventories. Motors use the higher of declared current and the provisional 90%-efficiency/0.85-power-factor calculation; this avoids reducing an unverified declared current. Actual nameplates remain required.

Ampacity is a planning lower envelope bounded by the referenced three-loaded-core, 90 °C insulation, 45 °C ambient rule table. It is not a certified cable manufacturer schedule. Grouping factor 1.00 is assumed; a 0.85 sensitivity is published. The thruster's 200 A feeder has no adequate grouped selection in the retained maximum 120 mm² range. This is a route/installation review hold, not a claim that the eventual route must use that factor.

Numeric checks cover 58 feeders. Maximum final-feeder hot-resistance drop: 4.7%. Maximum base-case motor-start cable envelope: 4.5%.

## Declared operating-load scenarios

| Condition | Declared kW | Estimated kVA | Source kW | Source kVA | Active reserve kW | Apparent reserve kVA |
|---|---:|---:|---:|---:|---:|---:|
| sea | 40.1 | 45 | 100 | 125 | 59.9 | 80 |
| arrival | 110 | 127.5 | 200 | 250 | 90 | 122.5 |
| loading | 45.9 | 51.7 | 100 | 125 | 54.1 | 73.3 |
| night | 10.3 | 11.2 | 40 | 50 | 29.7 | 38.8 |
| blackout | 10 | 11.6 | 32 | 40 | 22 | 28.4 |

These are the game's declared diversity scenarios. Apparent-power estimates assume PF 0.85 for modelled motors, 1.00 for resistance heaters, and 0.90 for other loads. They do not establish worst-case simultaneous demand, loss-of-generator duty, load unbalance, losses or harmonic capacity. The connected apparent-load inventory totals approximately 300.8 kVA; that sum is not simultaneous demand.

## Motor starting and emergency-power hold

Base locked-rotor assumption is 6× running current for DOL; star connection draws one third of that DOL line current. The cable-only envelope uses hot resistance and explicit assumed reactance 0.12 Ω/km. Sections increase where needed to satisfy a 5% cable-only start target. It does not demonstrate source voltage dip, frequency recovery, acceleration or torque. Star-delta transition separately carries a DOL-current sensitivity and remains unverified.

| Emergency motor started | Start A | Start kVA | Background kVA | Total kVA | Generator continuous kVA | 5–7× total kVA range | Status |
|---|---:|---:|---:|---:|---:|---|---|
| steer-2 | 24 | 18.3 | 11 | 29.3 | 40 | 26.2–32.3 | HOLD: generator transient study |
| fire-emergency | 60.6 | 46.2 | 6.3 | 52.5 | 40 | 44.8–60.2 | HOLD: generator transient study |

The emergency fire-pump start exceeds the 40 kVA continuous rating under the simple scenario. Transient capability may exceed continuous rating, but it is unknown here. Obtain alternator reactances/excitation data, AVR and governor step-load response, engine response, motor locked-rotor current/torque and inertia. Establish whether staged load pickup, an approved reduced-current starter or a larger emergency set is needed. Rated current alone is not a start test.

## Unresolved release holds

- **ELEC-01:** Real generator/transformer/motor/cable selection and certified installation data.
- **ELEC-02:** Prospective fault levels, breaker making/breaking duties, time-current discrimination and cable fault withstand.
- **ELEC-03:** Generator step-load response; emergency fire-pump scenario exceeds 40 kVA continuous rating; current-only sizing is insufficient.
- **ELEC-04:** Actual cable routes, installation/grouping, transformer regulation, unbalance and complete upstream-to-consumer voltage drop.
- **ELEC-05:** Battery Ah/endurance, DC load inventory, 105/24 V emergency converters and independent transition lighting.
- **ELEC-06:** Emergency duration against vessel-specific flag/class requirements; a 60 L/15 h claim lacks fuel-consumption evidence.
- **ELEC-07:** Motor six-terminal compatibility, star torque/acceleration, transition inrush and vendor packaged-equipment starting currents.
- **ELEC-08:** Switchboard construction, earthing/insulation monitoring, shore isolation, EMC and factory/onboard acceptance testing.
- **ELEC-09:** Mechanical ventilation duty and fan curves; fan motor kW does not prove airflow.

- **ELEC-10:** Navigation-light dedicated circuits, panel indications, changeover and lamp-voltage requirements; general feeder-drop budget is not navigation-light approval.

The 24 V loop formula is corrected, but the underlying game inventory lacks a complete DC load schedule. Individual emergency DC circuits, 105/24 V converters and battery capacity/endurance remain to be designed. ETR is a lighting transformer, not a battery charger. Steering feeders identify overload alarm without an overload trip; final protection requires equipment-specific review.

## Primary reference and verification

[ClassNK Part H, June 2026](https://www.classnk.or.jp/hp/pdf/rules/420_part_h_e_202606.pdf), sections 1.1.6, 2.3, 2.8, 2.9 and 3.3; Table H2.15, printed page 34. Applicability to the intended domestic passenger/vehicle ferry must be agreed with flag and classification authorities. This is a reference basis, not an approval of the vessel.

Verification: node --test tests/ferry-electrical-engineering.test.mjs tests/ferry-kks-piping-electrical.test.mjs — nine tests passed, zero failed. Regression coverage: transformer side separation; hot-conductor and DC return formulas; all grouped consumers; PE and star-delta core counts; cable-only starting; emergency transient hold; grouping sensitivity. The relocation regression also verifies parallel-current sharing, route derivation and hot cable drop. Tests verify the software model and arithmetic, not a physical electrical plant.
