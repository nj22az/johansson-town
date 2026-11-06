# Johansson Town: MCP world walkthrough, 4–5 October 2026

The town has usable, detailed places, but the finish is not yet uniform. Sakura,
Front-Row Books, the warehouse and parts of the bathhouse establish a much higher
standard than the plain household furniture and some civic rooms. The next art pass
should bring the weaker places up to that standard, with readable silhouettes,
consistent materials, useful cameras and visible evidence of each resident's life.

The audit includes normal MCP walking sessions through all authored town interiors,
public districts and the airport connection. The release also incorporates the current
unified island, family-home and ramen-shop work from main. Initial art findings are
identified below; final compiled verification and remaining recommendations are separate.

## How the walkthrough was conducted

The clients connect to the shipped local server through the official MCP SDK. They
start at normal opening scenes, use keyboard movement, camera dragging, actual doors,
visible interaction buttons and ordinary purchases. They save tool inputs, observed
state and screenshots. The tours do not use the fixture's teleport, room-entry or
save-writing functions. Separate regression fixtures are identified as fixtures.

Navigation inspection reads the game's standing collision and floor rules. Proposed
routes are then walked with the real controls. Clear grid cells alone are not treated
as proof that a player can reach somewhere. Doors change the coordinate frame, so a
route stops at an actual room transition.

The town is paused between explicit test steps to make observations repeatable.
Screenshots render the normal game pipeline. This makes repeatable movement and
interaction checks possible; it does not prove long sessions on every physical GPU,
all weather states or every possible save.

## Improvements needed for a uniformly polished world

| Priority | Observed problem | Improvement and acceptance check |
| --- | --- | --- |
| High | Current compiled home views still show large blank walls, block-shaped cupboards/TVs and simple flat bedding. The integrated release supplies distinct family-home plans, shared daily routines, room partitions and usable work areas, but those additions do not yet reach the shop’s visual finish. | Continue the visual identity pass with one distinctive furnishing and a recognizable active work/hobby area per occupant. Judge the current final screenshots, rather than treating the superseded Thuan apartment as the current room. |
| High | Third-person views in compact apartments and the repair workshop are obstructed by Johansson's head or the structure. | Use a consistent interior camera with collision handling and character fading near the lens. Walk every wall, chair and doorway in both camera modes; no head or beam should obscure the primary action. |
| High | The classroom noticeboard visibly superimposes several large headings. Sakura's rack, newspaper and till lettering also had overlapping lines. | Use one typesetting system for signs, labels and papers: bounded line layout, consistent margins, separate title/subtitle baselines and natural letter proportions. Check actual pixels at desktop and phone sizes, including oblique views. Sakura's three overlaps have been repaired; the classroom remains a recorded finish defect. |
| High | The initial bathhouse view shows distracting internal triangular rock linework. Sakura's window speckling was a separate confirmed depth overlap and is repaired. | Simplify rock edge treatment while preserving outer silhouettes. Recheck adjoining materials at noon, dusk and rain, on actual target devices. |
| High | Materials, modelling detail and lighting vary sharply between furnished shop assets and basic room geometry. | Establish one shared prop/material kit: consistent edge treatment, outlines, wood/tile scale, roughness and room lighting. Keep the toy-like style while making furniture recognizably usable. Compare adjoining rooms and districts side by side at noon and at night. |
| Medium | The police-box interior displays the imported asset's “ForestHouse” identity. | Replace asset branding and unrelated signs with Minato Police Box information, local notices and a consistent police-office palette. |
| Medium | Community Kitchen and Mayor's Office read as broad flat walls and simple counters/panels compared with the shops. | Add functional task areas: food preparation, utensils and bookings in the kitchen; harbour paperwork, personal photographs and a coherent visitor/desk arrangement in the office. Objects need appropriate scale, contact with surfaces and clear walking space. |
| Medium | The shrine and lanterns use plain block geometry beside the more finished bathhouse. Blue Coral's compact signs squeeze the lettering. | Give garden objects the same silhouette and surface finish as the bathhouse. Redesign small signs for their available space instead of compressing words horizontally. |
| Medium | Hoshizaki buildings are simple box facades, trees use prominent faceted ball canopies, and broad grassy stretches repeat without enough purpose. The pier landmark ends beside grass/rock. | Finish buildings and landscape as coherent usable places; add carefully placed frontage details, paths and vegetation variation. Give the fishing pier a convincing water connection and retain the tested coastal walking corridor. |
| Medium | Airport facade/wall areas and Naha Arrivals are visibly sparse; the plane is a simple silhouette. | Give passenger facilities clear functional zones, wayfinding, seating and restrained service activity; refine the aircraft silhouette and materials without compromising the proven transfers. |
| Medium | Personal household detail is often easier to learn from text than to see in the room. | Make everyday traces visible and intentional: shoes at the entrance, a used tea setting, work left in progress, family photographs and suitable storage. Avoid filling the room with tiny indistinct cubes. Keep routes to beds, tables, cupboards and doors clear. |

Examples from the initial normal walking sessions (before the later home integration):

- [Classroom noticeboard and furnishings](qa/mcp-world/interiors-before.png).
- [Thuan and Nao's apartment](qa/mcp-world/homes-before.png).
- [Bathhouse pool and rock edges](qa/mcp-world/interiors-before.png).
- [Civic rooms and bathhouse comparison](qa/mcp-world/interiors-before.png).
- [Repeated family-home layouts](qa/mcp-world/homes-before.png).

Current home views after the integration: [Aya and Reiko’s bedding](qa/mcp-world/aya-home-current.png), [Thuan and Nao’s living room](qa/mcp-world/thuan-home-current.png), and [Kitahama family room](qa/mcp-world/kitahama-home-current.png). These confirm that household furnishing quality is still an art priority.

## Household art direction

These are continuing art targets. The release preserves authored occupation details,
shared-home sleeping, waking, breakfast and door routes, with nighttime workers'
errands scheduled while awake. A few distinctive, finished objects help more than
many small indistinct props.

| Home | Identity to make visible |
| --- | --- |
| Aya and Reiko | Aya's reading/printing work and Reiko's newspaper materials, with separate bedside belongings. |
| Kenji and Tetsuo | An orderly repair bench, current radio project and separate instrument/pattern storage. |
| Thuan and Nao | Shop accounts and a packed work bag for Thuan; an evening-service detail for Nao; shared living space with individual ownership. |
| Mrs Sato | Recipe notes, an actual meal-preparation area and a personal tea/rest corner. |
| Kōji | Recognizable everyday tools and a cared-for personal work area. |
| Postman Tōma | Sorted mail, a delivery bag and a clear entrance routine. |
| Grandfather and Grandmother Taira | Two distinct places to sit, family photographs and useful household storage. |
| Mr and Mrs Chinen | Individual daily belongings and a visible shared task area. |
| Ms Uezu | A distinctive personal work/hobby arrangement and textiles. |
| Grandmother Gushiken | Family history, tea and objects at a comfortable reach and scale. |
| Mr and Mrs Tamashiro | A clearly occupied couple's home, with separate belongings and an active household task. |
| Mr Iha | A recognizable work or hobby station instead of the same generic arrangement. |
| Mrs Kohagura | Distinctive plants/textiles/personal storage tied to existing character descriptions. |
| Mayor | Harbour photographs, paperwork, a visitor area and the saved keepsake/customization choices presented coherently. |
| House to let | A deliberately prepared rental: clean, usable basics and a clear vacancy identity. |

Confirm occupation details against the authored character descriptions before adding
new objects. The goal is ordinary credibility inspired by Shenmue, readable stylized
objects and people inspired by Tomodachi Life, and personal, earned choices inspired
by Animal Crossing.

## Defects repaired during the audit

- **Garden bridge and pond loop:** the old east end of the bridge ended against the
  footbath. The whole crossing, rails and rock opening moved 1.7 metres north;
  the adjoining loop now bypasses the bath and porch posts. Regression checks walk
  the actual player body across both directions and verify the rendered floor.
- **Sakura magazine-rack customer:** old saved customer positions could place a
  browser inside the real magazine rack. Restored positions are checked against
  the actual shop geometry and occupancy. Customers must reach the real shelf
  before collecting goods and complete one payment before leaving.
- **Sakura inventory restoration:** the current stock catalogue remains authoritative
  while saved picked goods retain their claims. A saved pickup with an occupied
  shelf must walk to the shelf rather than remove stock at the entrance.
- **Sakura lettering:** category/subtitle, newspaper masthead/edition and till
  title/subtitle now have separate bounded positions.
- **MCP observation parity:** hidden old prompts and retired destination names no
  longer describe the current scene. The avatar editor and item viewer report their
  real movement lock; normal close buttons return to the room. Explicit test steps
  also advance the same hand-animation timers as normal gameplay.

The earlier work also relocated Rainflower into the town–garden–residential connection,
removed the airport bridge and retired decorative road vehicles, and made the
passenger/occasional-car ferry use one shared hull with real resident drivers.
Those changes are tested separately from the visual recommendations above.

## Coverage and evidence

Normal SDK/MCP clients entered 29 town interiors: Sakura, Front Row Books, Sato
Ramen, Minato Izakaya, Form3D, the harbour office, warehouse, port waiting hall,
school, Community Kitchen, Mayor's Office, clinic, police box, bathhouse and all
15 authored homes/rental rooms. Naha Arrivals was also entered through the actual
flight. Exterior airport shops and gate menus are not additional rooms.

The tours record actual entries, movements, interaction choices and exits. Shops
included ordinary purchases and food/drink service; the mayor's room included the
avatar editor's movement lock and normal close control. Public sessions covered
Main Street, the relocated Rainflower/park link, garden/pond/shrine, Kitahama house
gates, radio stairs/roof, coastal connector and Hoshizaki. Additional final coastal
coverage is recorded in the validation evidence.

The new port waiting hall was walked and its real counter ticket bought through
169 official MCP calls. Boarding from inside clears the interior and uses the same
passenger/car ferry for the outbound and return crossings. [Ticket menu](qa/mcp-world/ferry-ticket.png)
and [normal passenger crossing](qa/mcp-world/ferry-crossing.png) are preserved.

The audit uses separate legitimate starts for daytime interiors, evening service,
public coastal routes and transport. It is a set of walking sessions, not one
uninterrupted journey. A room counts only after an actual entry. The disabled cave,
planned hotel and closed terminal expansion are not claimed as visited.

Controlled fixtures separately exercise restored rack saves, exact window/camera
views, avatar foot contact, seven opening scenes, occupied car loading/unloading
and screenshot baselines. Their setup can select a room or position; that is not
reported as normal MCP walking evidence.

## Repaired causes

- Aya's 18:35 Sakura visit used the retired north guest-chair coordinates when her
  grocery visit had already finished. That point was inside the widened magazine
  rack. Evening guests now claim one of the real clear standing slots, validate
  current player/NPC occupancy, and defer if all three are occupied. Standing
  arrivals retain their walked position rather than snapping to a removed seat.
- Aya and Reiko's exterior return routes are checked by actual forward-facing
  schedule controllers: Sakura to Front Row and Front Row to their shared home,
  including the exact door thresholds, full body clearance, drawn floors and steps.
- Ambient residents now participate in the same real player-body collision test as the scheduled cast. The Hoshizaki clerk, customer and lunch queue have separate clear positions and facing directions; actual MCP walking stops at both NPC bodies and reaches the purchase spot.
- The old saved “away” position is discarded for residents whose current life is local. Obsolete bus-station coordinates no longer replace their actual home/door route after restoration.
- The Mayor’s earned keepsake shelf and decoration control have moved out of the new bathroom into the main room. The display faces the accessible room and the complete doorway–control–door route clears the current furniture and partitions.
- Sakura window speckling came from exterior glass/shallow sashes overlapping the
  mapped interior window. The outgoing portal clips those surfaces by 13cm, while
  retaining the actual deeper awning, ink and shadow pipeline.
- Late street mounting now synchronizes the shop's interior-light visibility
  immediately. Newly created strip lights cannot leak daytime illumination onto
  the street until the next simulation tick; the periodic late-model rescan remains.
- Thuan's standing animations now ground the rendered supporting shoe geometry.
  The artificial 20cm CounterIdle lift is removed: a downward ray confirms the actual Sakura floor beneath her. Every grounded gesture and all four outfits retain floor contact; genuine jumps,
  seated support and riding keep their intended support. Johansson's conversation
  greeting uses a nod; his optional bow is a small inclination.
- The stock catalogue remains authoritative after restoring saved picked goods.
  Customers collect at a reachable shelf, preserve stock claims and make one payment.
  The detailed konbini includes original packaging, stocked fresh food, till equipment, heated food displays and a working shop routine. Its static figurine and lucky-cat models preserve every original painted face and UV corner. Lossy reductions were rejected after actual close-up comparisons showed fractured paint; the supplied originals remain unchanged. The figurine keeps its physical material, and the static export removes its unused rig and animation data. The honest fully loaded measurement is 435,172 triangles and 787 draws, including asynchronous owned models, within the documented 450,000-triangle/813-draw ceiling. Further performance work must preserve the reviewed appearance. Reviewed controlled detail views: [lucky cat](qa/mcp-world/sakura-lucky-cat-current.png) and [Thuan figurine](qa/mcp-world/sakura-thuan-figurine-current.png).
- Garden bridge/pond circulation, central Rainflower pole placement, graded coastal
  road paint, radio-floor joins and airport/quay support heights use the same
  physical and rendered surfaces. Obsolete airport-bridge and decorative truck
  geometry is removed; service vehicles have named drivers and connected routes.
- Car body checks use the rendered 3.915m by 1.694m envelope and oriented overlap,
  including both service bays, an occupied neighbouring bay and actual ferry ramps.
- MCP state, current visible prompts and modal controls agree with the game.
  The optional local server supplies bounded controls, navigation, screenshots,
  findings and reproducible actions; no unrestricted evaluation tool is exposed.

## Resources requested

[System Design Academy](https://github.com/systemdesign42/system-design-academy)
is a collection of system-design/AI engineering references. It can inform save
consistency, caching, asset streaming and observability decisions; it is not a game
engine or a dependency to import wholesale. [Awesome](https://github.com/sindresorhus/awesome)
is a directory of specialist lists, including game development, engine development,
production and static analysis. My recommendation is to use it for targeted research
when a concrete gap is identified, then evaluate the actual project and its license.
Neither directory needs to become a runtime dependency of this build.

## Validation

The complete source suite returned 763 passes, no failures and five explicit
skips (768 tests total). The final share-dialog focus and cache-stamp adjustments
then passed 16 focused checks and the real four-viewport creator review. The installed web-game Playwright client completed real
action bursts; the latest rendered screenshot and text state were inspected, with
no recorded browser errors. The final immediate shop-light transition passed its
lifecycle regression and related source checks; rebuilt runtime and stylesheet/hash
checks passed. All 76 final desktop/phone world comparison views match their reviewed
references exactly, with no browser errors, missing assets, invalid transforms or
unstable captures. Reference updates were limited to the reviewed LINE home-exit
controls and the faithful painted Sakura display; all pixels outside those bounded
areas were unchanged.

The final compiled floor fixture measures Thuan's supporting shoes against a downward
ray to the drawn Sakura floor throughout her wave. Her support is at floor height;
Johansson's optional greeting inclines by approximately 12 degrees. Normal MCP
sessions record Aya collecting stock and paying once (109 calls in the narrow viewport),
and walking to the actual shop exit at 19:15 (77 desktop calls). Her later vehicle
assignment is a separate scheduled job; it is not claimed as a photographed walk to
the bookshop. The actual exterior schedule-controller regression independently walks
both bookkeepers' shop and home return routes with full body and floor clearance.

The compiled saved-rack fixture uses Reiko's current schedule and lets her walk to
Sakura from her restored exterior location. She stands clear of the actual rack,
detours around the stationary player, reaches the real pudding shelf, pays once
and walks out without duplicate actors. Normal coffee purchase/consumption sessions
also pass on desktop and the narrow viewport, using actual movement, vending
choices, inventory actions and view switching. The empty can remains for recycling
and the wallet is charged once.

The final MCP smoke passes handshake, gameplay controls, camera input, navigation,
modal movement lock and real screenshot capture. Its startup waits for the
asynchronously installed agent API; the preview normalizes directory paths before
its containment check. These repair test-tool errors rather than game-world defects.

Reviewed floor/window evidence: [Thuan's wave on the actual floor](qa/mcp-world/thuan-wave-floor.png)
and [clean outgoing shop window in the narrow viewport](qa/mcp-world/sakura-window-phone-after.png).

The original interior tour preceded the latest household-layout integration. A final
normal MCP tour then entered, explored and exited all 15 current homes/rental rooms,
reaching all 72 requested interior walking targets through 2,098 official tool calls.
It saved 120 screenshots with no invalid transforms. One cancelled tatami-model request
is preserved in the request log; Mrs Sato's loaded model remained visibly present and
reported ready. Thuan's home was verified in a separate normal-opening segment after
the first route helper stalled in the civic enclosure. Frozen visual fixtures remain
camera tests, not additional MCP walking sessions.

The UI overhaul requested during this audit uses the nominated
[LINE design template](https://kzhrknt.github.io/awesome-design-md-jp/design-md/line/DESIGN.md).
It is included with the game repairs, with shared typography, spacing,
green actions, white cards, messenger-style dialogue and consistent icon placement.
Actual touch-device emulation is required for its portrait and landscape checks;
narrow fine-pointer MCP captures alone do not validate touch controls. The final
normal UI review covers desktop 1280×800, touch portrait 390×844, touch landscape
844×390 and compact touch 320×568: 36 actual captures, with no exposed button
overlaps or browser errors. See [the LINE interface review](LINE-UI-2026-10-05.md)
for dialogue, bag, magazines, records, camera/photo and creator coverage. Separate
controlled presentation fixtures exercise specific content; they do not count as
additional world walking sessions.

See [AI-GAME-TESTING.md](AI-GAME-TESTING.md) for the installed local MCP server and its
bounded controls, and [the earlier audit](TOWN-AUDIT-2026-10-03.md) for prior household,
quest, customization and graphics repairs.
