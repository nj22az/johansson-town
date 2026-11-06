# Minato Maru engine-room CAD - Revision B

Status: **FOR DESIGN REVIEW - CONSTRUCTION NOT APPROVED**. This package records the Johansson World vessel, corrected engineering metadata and explicitly proposed machinery reservations. It is not an approved real-ship building package.

## File use

- `Minato_Maru_Engine_Room_CAD_RevB.pdf`: fixed A2/A3 landscape drawing book. Physical views are1:50 or1:100 as stated at 100% print; all system and electrical diagrams are NTS. A5 m scale bar measures100 mm at 1:50 or50 mm at 1:100.
- `dxf/`: editable R2010 DXF sheets, units millimetres (INSUNITS4). Physical geometry is1:1 model space; plot at stated PDF scale. Geometry plan X/Y, profile X/Z and transverse Y/Z. Diagram coordinates are NTS.
- `models/`: source equipment envelope OBJ/MTL and 3D DXF with pipe centre-lines. This is a spatial reference, not an approved complete hull or fabrication solid. OBJ units are millimetres.
- `data/`: immutable source snapshot and complete schedules. Empty physical coordinates mean missing model anchors; `MISSING` does not imply a disconnected source graph.
- `drawing_register.csv/json`: all drawing identifiers, sizes, scales and PDF page numbers.

## Datums

CAD X forward from transom, Y to port from centreline, Z up from baseline. Game coordinates are metres with x port, y up from laden waterline, z forward of amidships. Transform: X=1000*(game.z+LOA/2), Y=1000*game.x, Z=1000*(game.y+draft). Dimension values govern; no scaling of browser screenshots is valid.

Source base commit: `e87c06b16734d882626be7fe6cdd2ab153d649c4`. Snapshot export: `2026-10-13T14:22:50.760Z`. Generation issue date: 2026-10-13.

## Existing versus proposed

Current floor Z 900, deck underside Z 2800, nominal clear height1900 mm; existing engine-room X 8500..14000. Existing model equipment is not supplier geometry. Proposed2700 x 1500 x 1650 mm, 3.6 t engine+gear reservations and2900 x 1800 mm removable-cover reservations are design targets only; service envelope overlaps are explicitly unresolved. Engine rating remains the fictional Johansson source rating, not an attributed Yanmar rating.

Separate references: legacy H outline2000 x 1305 x 1431 mm, dry engine2365 kg, YX181gear560 kg/3.03ratio and combined length2364 mm; later2020 C operating rating485kW1900 rpm. The teal reserve uses combinedLwith engine-onlyW/H; gear/accessory extremes are unverified. These are not a selected Minato Maru installation. References:

- https://www.yanmar.no/theme/yanmarportal/uploadedFiles/Marine/productDownloads/Commercial-datasheet/6148-Datasheet-6AYM-WST.pdf
- https://www.yanmar.com/media/news/2020/05/22051608/6aym-wstwet.pdf

## Construction release holds

Flag/class design basis, tonnage, hull scantlings, stability and damage stability, fire boundaries and evacuation, engine installation and nozzle/bolt geometry, shaft alignment/thrust/torsional checks, foundations, cooling/ventilation sizing, pipe classes/supports/penetrations, hydraulic capacity, electrical fault/selectivity/starting studies, certified lifting/removal route, signed drawings and survey acceptance. None of these are automatically satisfied by a game-model test pass.

## Reproduction

Run `node export_ferry_data.mjs REPO SNAPSHOT.json`, then `python3 ferry_cad_package.py --data SNAPSHOT.json --out OUTPUT --commit BASE_COMMIT`. Dependencies: Node, Python3, reportlab, ezdxf. The generator does not modify the game repository. For final validation render the PDF at 100dpi or better and inspect all pages; reopen every DXF with ezdxf, verify millimetre units, inspect schedules against live corrected source.
