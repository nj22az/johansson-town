# Johansson World reference enhancement plan

Updated: 18 October 2026.
Status: T01 complete; T02 housing prerequisite and office implementation complete in main, visual/device acceptance open. This reconciliation changes documentation only.
Execution rule: one active task at a time. Complete and verify it before starting the next task.

## Start here for Claude or another developer

Read repository AGENTS.md and CLAUDE.md, johansson-town/AGENTS.md and johansson-town/CLAUDE.md, then this plan, [MINATO-HOMES-IMPLEMENTATION.md](MINATO-HOMES-IMPLEMENTATION.md) and docs/MINATO-HOMES-PLAN.md. The implementation record and current source supersede the earlier proposed assignments. Owner decisions in those instructions govern household assignments and ship roles. This plan adds an interior/reference work queue; it does not replace the housing programme.

T01 is complete: see [REFERENCE-ENHANCEMENT-AUDIT.md](REFERENCE-ENHANCEMENT-AUDIT.md).
Current next task: **T02 acceptance review — inspect the existing Sakura office; do not rebuild it or Sakurai's home.** Housing commit `dc3a15bbc5b3b5549bd4563cce3ebb48002b1459` already moved Sakurai to ground-floor Flat 2 and Ganaha to Flat 4, authored their homes and converted upstairs. T02 is not fully accepted until its remaining checks below pass. T03 is the next new interior implementation only after that gate.

Reconciled source: main `6b9f5ea56d71e581355384e77ada0c4f987c7f55` (18 October 2026), which contains the housing commit and later iPhone cel-shading work. The original T01 audit at `c5e36e578a3aa7ba6dea6b07a9cb89284edbfad9` is historical; use the current reconciliation at the top of [REFERENCE-ENHANCEMENT-AUDIT.md](REFERENCE-ENHANCEMENT-AUDIT.md), not its superseded prerequisite.

Only work on the first incomplete eligible task. If it is blocked, record the concrete dependency and resolve it within the existing stability/housing programme. Do not silently start another feature. Break each multi-room queue item into one named room or household per change.

## Purpose and constraints

Use the reference to improve coherent, inhabited interiors and reusable character/content systems within the existing Okinawa 1997 world. Prefer coordinated materials, understandable layouts and useful furniture to extra ornament.

Keep Minato compact; preserve its road hierarchy, coast, working businesses, port/ferry, park and Umi-no-yu. Existing loading, geometry, scenery-placement and iPhone Safari defects take priority over additional content. Check their current status rather than assuming old reports are still unresolved.

Preserve the owner's established households. Johansson is chief engineer with a duty cabin and a shared tropical primary home with Thuan. Thuan also has her room with Thao and Chin. Sakura upstairs is the main office/kitchenette, with harbour and town views; the small downstairs office remains. Grandmother Sakurai now lives in the completed ground-floor Flat 2; Ganaha lives in Flat 4. Preserve those implemented assignments and the existing office conversion.

Use existing furniture, placement, interaction, save and story systems where possible. Build reusable components only when the current room needs them; do not create a speculative furnishing framework. New props should have a named user, purpose and story use. Avatar-related work must remain compatible with Johansson Studio and all supported residents.

## Evidence and source handling

Source workbook:
https://docs.google.com/spreadsheets/d/18nNVMXyrPFj3Ta_4_fQIKTVhj9OcjQli47Pb-fwQ2B4/edit

Image repository:
https://github.com/ltdimages/images

Verified in the downloaded XLSX:
- 105 Interior sets entries, with 272 IMAGE formulas.
- 86 Objects entries, with 377 IMAGE formulas.
- 10,046 IMAGE formulas across the workbook. These are formula counts, not unique-image counts.
- Image URLs survive in formulas even where cached cell values show #REF!.
- The supplied file is an XLSX accessible through a Google Sheets URL. Inspect formulas as well as cached values.
- Twelve first-variant interior images were visually reviewed: Bathhouse, Bookworm, Chic, Food Mart, Garage, Kitchen, Natural Wood, Office, Sea Captain, Shōwa-Era Nostalgia, Simple Living and Teahouse.
- Other categories were inspected as data; their entire image collections have not been visually reviewed.
- The workbook identifies itself as community-organised datamined parameter data. It does not establish complete behaviour algorithms.

Use images to study layout, scale, materials and grouping. They are rendered views, not supplied 3D room models. An image showing a cupboard does not provide a separate cupboard mesh. Create original game assets; check any third-party asset licence before incorporating its bytes. Public image access alone is not a reuse licence.

Do not load the workbook or thousands of remote images during game startup. Keep reference metadata outside the runtime asset path and only ship the small original assets used by the completed task.

## Useful material and recommended treatment

| Material | Value | Treatment |
| --- | --- | --- |
| Office + Kitchen | Strong | First interior pilot: working upstairs office and modest kitchenette. |
| Shōwa-Era Nostalgia + Teahouse | Strong | Domestic proportions, tatami, sliding storage and restrained timber detailing for appropriate homes. |
| Natural Wood + Simple Living | Strong | Practical counters, dining furniture and household storage; choose palettes per household. |
| Food Mart | Strong | Shelf rhythm, departments, checkout visibility and coherent product displays in Sakura. |
| Bathhouse | Strong | Repeated wash stations and tile palette; adapt to existing authentic bathing arrangements. |
| Bookworm + Garage | Selective | Bookshop shelving and purposeful workshop storage, in separate later tasks. |
| Objects | Strong but selective | Consolidated benches, tables, lamps, railings and planters; obey shoreline/route placement constraints. |
| Treasures + Goods | Selective | Personal possessions and activity props with actual owners and story uses. |
| Clothing categories and outfit composition | Later | Shared catalogue structure, compatible slots, shop stock and Studio preview. |
| Little quirks | Later | Shared greetings, posture and idle variation available to every resident. |
| Food metadata | Later | Original taste preferences and shop/menu consistency; tune yen prices independently. |
| Relationship stages | Later, audit required | Compare with existing personality/relationship work; do not import questionable ranges or duplicate systems. |
| Travel souvenirs | Deferred | Small additions to existing island travel after stability and interiors. |
| Sea Captain, fantasy, spectacle and festival rooms | Low priority | The reviewed Sea Captain image is a pirate deck, unsuitable for the chief engineer's cabin. No festival/combat expansion in this programme. |

Reference images use this base URL:
https://raw.githubusercontent.com/ltdimages/images/refs/heads/main/

| Set | First reviewed image |
| --- | --- |
| Office | Room_Style_Office00.png |
| Kitchen | Room_Style_BigFlower00.png |
| Shōwa-Era Nostalgia | Room_Style_Japanese00.png |
| Natural Wood | Room_Style_SmallFlower00.png |
| Simple Living | Room_Style_WoodBoard00.png |
| Teahouse | Room_Style_Shoji00.png |
| Food Mart | Room_Style_Market00.png |
| Bathhouse | Room_Style_PublicBath00.png |
| Bookworm | Room_Style_Book00.png |
| Garage | Room_Style_Garage00.png |

Record actual workbook tab, cell, image URL and variant when a specific feature is selected. Names alone are not sufficient provenance.

## Sequential work queue

T01 is complete as a source/reference audit. T02 implementation is complete, but acceptance remains open. T03–T09 remain pending. Keep T02 acceptance as the sole active task; no later room starts while it is unresolved.

### T01 Reconcile references and current implementation

Status: complete. Findings, measured code coordinates, reuse decisions, source assertions and verification limits are in [REFERENCE-ENHANCEMENT-AUDIT.md](REFERENCE-ENHANCEMENT-AUDIT.md).

Scope: read-only source/runtime audit plus a small documentation shortlist. Do not alter rooms yet.

Inspect existing home, furniture, Sakura, save and story systems and relevant open work. Identify which desired components already exist. Record current loading/scenery issues and whether they block the pilot.

Starting points, relative to johansson-town:
- src/world/furniture-standards.js
- src/build/home-furniture.js
- src/build/home-decorate.js
- src/progression/home-decor.js
- src/world/interiors/home-customization.js
- src/world/interiors/sakura-layout.js
- src/world/interiors/sakura-shell.js
- src/world/interiors/sakura-interior.js
- src/world/interiors/sakura-backroom.js
- src/world/interiors/office-workplace.js
- src/people/island-households.js
- src/people/home-directory.js
- src/feed/ and src/studio/prop-registry.js

Deliverable: docs/REFERENCE-ENHANCEMENT-AUDIT.md, containing current commit, exact owning functions, existing component reuse, selected image/cell references, measured room constraints, dependencies and before views if a renderer is available.

Done when: each pilot requirement has an identified code owner and reuse/new-work decision; no duplicate framework is proposed; blockers and unavailable visual checks are explicit.

### T02 Sakura upstairs office and kitchenette

Status: **implemented; acceptance open**. Prerequisite A is complete, including the Flat 2/4 mobility exchange, furnished private rooms, entrances, sleeping places, occupancy, routines, directory and idempotent save migration. Do not repeat the move. The enterable main office/kitchenette is also implemented; retain the downstairs office, shop and stockroom.

Evidence: [MINATO-HOMES-IMPLEMENTATION.md](MINATO-HOMES-IMPLEMENTATION.md), housing commit `dc3a15bbc5b3b5549bd4563cce3ebb48002b1459`, and the current-source/test reconciliation in [REFERENCE-ENHANCEMENT-AUDIT.md](REFERENCE-ENHANCEMENT-AUDIT.md). The housing report's 130 focused tests and runtime build are prior implementation evidence, not this session's test count.

Current owners: `src/world/interiors/sakura-office-room.js::buildSakuraOfficeRoom` and `SAKURA_OFFICE`; `src/world/thuan-flat.js::buildThuanFlat` (historical filename, now office shell/entrance/portals); `src/game.js::addRoomProps` dispatch and `streetFrontageOf`; `src/render/shop-street-view.js`. Reuse these; do not create a second upstairs room or portal system.

| Acceptance area | Verified implementation / automated evidence | Still required before T02 closes |
| --- | --- | --- |
| Replacement homes and routines | Sakurai Flat 2, Ganaha Flat 4; registered doors, bedding, room routes, shore schedules and upper-flat outward/return walking tests pass. | Observe the moved residents' entry, sleep/wake and return in the running game. |
| Street → rear stair → office → exit | Office entry/exit and room spawn exist; town stair/landing clearance tests pass. | Walk the entire street-to-office route both ways with normal controls; inspect landing, door, collision and camera transitions. Stair sampling is not an end-to-end player walkthrough. |
| Harbour and town outlooks | Two live street portals; seated observer maps to the same world position at y=5.13; directions east/town and south/harbour pass geometry tests. | Capture actual standing and seated camera views, confirm the harbour/Minato Maru and town are visible, with no opaque shell, clipping, wrong origin or blocked view. Compass transforms alone do not prove the scenery is visible. |
| Furniture and interactions | Desk, chair, visitor bench/table, ledger, telephone, shelves, sink, cupboards, kettle and fridge exist. CPU paths reach ledger, tea and both outlook prompts. | Exercise reachable prompts and desk sit/stand with supported avatar sizes; inspect seat contact and clipping, visitor seating and stair/window clearance. Generic seating tests do not certify this chair. Tea is an existing read action; telephone/storage are props, and the visitor bench has no separately registered seating action in this builder. Verify required use without claiming an appliance simulation. |
| Existing shop and saves | Housing migration/idempotence and save-safety suites pass; Sakura shop budget and runtime-package checks pass. | Exercise downstairs trading/stockroom and a legacy-save → enter/exit → save/reload cycle in the running game. |
| Mobile rendering and resources | iPhone/safe single-pass profile, no background detail streaming, DPR/pixel limits and recovery checks pass; existing cel-shading path retained. | Phone viewport/touch inspection and comparable resource measurements, then physical iPhone Safari start/play/reload and sustained office use. Emulation is separate evidence. |

Feasible visual attempt on 18 October: the public game was opened in remote desktop Chrome. The title UI appeared, but Start Exploring reported that the 3D graphics engine could not start, also after one Retry. No playable office view, mobile viewport review, draw-call/frame-rate baseline or physical iPhone check was obtained. This is a limitation of that observed session, not proof of the cause or of a general site failure. Do not waive acceptance or change safeguards to force this environment through it.

Prerequisites for closure: T01 and the housing move are satisfied. Use a working GPU browser to finish the acceptance checks above; fix only a demonstrated T02 defect, then rerun its focused checks. Preserve the original Office/Kitchen reference requirements and exact workbook cells recorded in the audit. No new room is authorised by this acceptance task.

Scope: upstairs only, plus shared components strictly required by it. Main desk with real harbour outlook; second town sightline; modest visitor seating; ledgers, telephone and storage; kitchenette with sink, worktop, cupboards, kettle and small fridge. Furnish for 1997. Keep windows and stair landing clear.

Done when: street-to-stairs-to-desk/kitchen route works; both views are verified from actual camera positions; furniture does not clip actors; seated pose fits the chair; kitchen/office interactions are reachable; downstairs shop/stockroom still operate; nobody tries to sleep upstairs; saves and mobile resource safeguards survive.

### T03 One domestic pilot

Scope: Thao and Chin's existing house, retaining Vy's and Thuan's established spaces. Reconcile with any concurrent home work first. Use timber, domestic storage and selected Japanese-room references according to the actual household, rather than applying a generic Japanese theme to every resident.

Done when: occupants retain their sleeping places and routes; cupboards, cooking, dining and personal possessions form a coherent layout; access and save compatibility pass the common checks. List the original components ready for reuse.

### T04 Retained homes, one household per change

Prerequisites: T03 complete and the retained housing list reconciled with MINATO-HOMES-PLAN.md.

Choose the first incomplete occupied dwelling in that plan; name it in the handover before editing. Apply proven components, then add a small number of resident-specific details. Verify entrance, sleeping capacity, privacy, lighting and work/home route. Repeat sequentially; do not decorate every building in one sweep or furnish a house scheduled for removal.

### T05 Sakura ground-floor merchandise layout

Scope: one store layout change, using Food Mart as a reference for grouping and shelf consistency. Preserve established town suppliers and merchandising philosophy in src/commerce/merchandising.js.

Done when: checkout and stockroom access remain clear, products match their labels and departments, shopping interactions still work, and saved purchases survive reload. Use inexpensive product textures/geometry; do not turn each package into a detailed independent mesh.

### T06 Umi-no-yu washing area

Scope: washing stations and coordinated finishes only. Preserve the existing bathing, towel, admissions, boiler and electrical arrangements.

Done when: stations and props have consistent dimensions; users can approach and use them; wet/dry transitions and privacy remain coherent; admissions and existing interactions pass regression checks. Handle lobby or changing-room improvements as a separate subsequent room task.

### T07 Bookshop, then workshop

Two separate changes: finish and verify bookshop shelving/reading area first, then workshop workbench/tool storage. Each object needs a workplace purpose and reachable placement. Preserve current businesses and their story locations.

### T08 Outdoor furniture consolidation

Prerequisites: coastline/scenery-placement fixes verified. Choose one class at a time: benches, then lamps, then barriers/planters as needed. Reuse the existing road philosophy.

Done when: placement lies on valid ground or intended structures, paths remain walkable, seating fits supported avatar sizes, and no duplicate old props/colliders remain. Add no extra stalls or attractions.

### T09 Character and catalogue improvements

Only after the interior queue and stability checks. Execute as separate tasks in this order:
1. Audit and unify existing clothing catalogue/slot behaviour, including Studio.
2. Add a small shared greeting/idle set with per-resident selection.
3. Audit existing food preferences and add original taste metadata only where needed.
4. Review relationship stages against existing implementations before proposing changes.

Each task needs its own scope and observable acceptance checks before editing. Do not copy workbook algorithms, prices or thresholds without validating their meaning.

## Common completion checks

For each runtime task:
1. Record the starting commit, affected room, before view and baseline render/resource measurements.
2. Check entrances, stairs, door clearance, actual actor collision, furniture contact and camera movement.
3. Check relevant interactions, resident schedules, story references, old saves and save/reload.
4. Run the focused tests required by the changed system. From johansson-town run `npm run build:runtime` and `node --test tests/runtime-package.test.mjs`.
5. Inspect desktop and mobile views where available. Physical iPhone Safari checks are separate from browser emulation; record which was performed.
6. Compare draw calls, texture/resource use and loading behaviour against the same baseline. Preserve existing Safari limits and do not introduce background asset floods.
7. Register new shared props with the existing storyteller/Studio systems where applicable. Verify their use rather than only adding catalogue labels.
8. Review the diff for unrelated changes, record the commit/PR and rollback point, and update this plan's handover before proceeding.

A successful build does not establish that a room is visually correct or that physical-device stability passed. Record unavailable checks as unverified.

## Handover record

Update this section after every completed task or interrupted session. Keep exactly one active task.

- Last completed work: T01 source/reference audit; T02 housing prerequisite and office implementation integrated by the housing programme at `dc3a15bbc5b3b5549bd4563cce3ebb48002b1459`.
- Active task: T02 acceptance review only; not a new construction task.
- First genuinely incomplete work: rendered harbour/town outlooks and normal-control office route/furniture review, followed by mobile and physical-device acceptance. T03 remains queued.
- Current audited source: main `6b9f5ea56d71e581355384e77ada0c4f987c7f55`.
- Historical T01 audit commit: `8f57583c316f80de6f0af2fdbb6450f451dcc0f1`; its old home/office findings are explicitly superseded in the audit addendum.
- This reconciliation: documentation only in this plan and `docs/REFERENCE-ENHANCEMENT-AUDIT.md`; no runtime, asset, save identifier or resource-policy changes.
- Checks actually rerun: 14 tests across housing-consolidation and runtime-package; 29 across building-stairs, player-seating, save-safety, sakura-budget, shop-street-view, startup-recovery and single-pass-colour. Runtime build passed; its 3 package checks passed again after building. See audit for exact commands and limits.
- Visual result: remote Chrome title/start attempt and one Retry ended in graphics-engine startup failure. No office screenshots or physical iPhone results exist from this review.
- Remaining gate: all outstanding cells in T02's acceptance table; no missing replacement home or missing office implementation.
- Exact next action: refresh main and read the implementation record plus current audit addendum; in a working GPU browser walk Sakura's rear stair to the existing office, capture standing/seated harbour and town outlooks, exercise ledger/tea and desk sit/stand, return to the street, and record device, viewport, source build and results. Then finish mobile/save/shop checks; do not start T03 until T02 is accepted.
- Rollback: revert this documentation reconciliation only; retain the housing/office implementation. If a later runtime defect needs rollback, identify its own commit and preserve saves rather than reverting all housing.

For later sessions append: task ID and scope; commit/PR; changed files; decisions and reasons; checks and results; screenshots when available; remaining defects; exact next action; rollback commit. Never mark a task complete while its required checks remain unresolved.

## Continuation instruction

"Read johansson-town/docs/REFERENCE-ENHANCEMENT-PLAN.md and the applicable AGENTS.md/CLAUDE.md files. Refresh the recorded state against current main. Continue only the first incomplete eligible task: T02 acceptance of the existing office, as recorded in its acceptance table and current audit addendum. Sakurai's Flat 2 home, Ganaha's Flat 4 home and Sakura's upstairs office already exist; do not reconstruct them. T03 is the next new interior only after T02 acceptance closes. Preserve the Minato housing decisions, 1997 setting, save compatibility and Safari safeguards. Update the handover with real evidence before starting another task."
