# Minato Port Building, and what to consolidate

4 October 2026. A plan you can resume or share. Tick the boxes as work lands.

## Progress
- [x] Phase 0: plan saved in the repo
- [x] Phase 1: layout constants (`port-building-layout.js`), terminal points moved to the forecourt
- [x] Phase 2: exterior (`port-building.js`), old terminal box and office exterior removed
- [x] Phase 3: waiting hall interior (`interiors/port-hall.js`)
- [x] Phase 4: one ticket counter for all departures; bus-station leftovers renamed
- [x] Phase 5: polish, screenshots, draw calls, tests

**Built (4 October 2026):** the Port Building stands at x 5.6–17.2, z -48…-38.4 (`src/world/port-building.js`).
The waiting hall (`src/world/interiors/port-hall.js`) has three ticket windows (mainland ferry, airport ferry,
evening boat to Naha), a departures board, benches facing the pier, a strait map, a vending machine and stairs to the
Harbour Office. The quay's loose airport-ticket and Naha prompts are gone, the island projects review moved to the
harbour master's desk, and the old "BUS TERMINAL" sign now points to the port. Harbour view: about 107 draw calls on a
phone (was about 143). Tests: `tests/port-building.test.mjs`.

## Consolidation round
- [x] Part A: airport radio repair moved inside the workshop; one family per surname (Higa, Kinjō, Tōma);
  sata andagi moved to Nakamura (the Arakaki shop is closed, the family lives there); Rainflower Lane's
  travel agent and grocer are lane houses now; the airport keeps three shops (coffee, noodles, crafts)
- [x] Part B: legacy town modes deleted. The town is always the island: `town-mode.js`, `full-town-state.js`, FULL_TOWN, every mode branch, the Main Street frontage, dining lane, Willow Alley homes, tea house, alley shops, Inakaya and Thuan's supplied apartment are gone with their models, pack tools and tests. Supplied rooms are office-only; shared layout files keep only what the island reads.

**Decisions (agreed):** one Port Building replaces the Harbour Office and the ferry terminal on the same site;
you can walk into its waiting hall; no new characters (the Harbour master runs it).


## Context
The ferry terminal is the first thing a visitor sees, but today it is a 4.8 × 4 m cream box squeezed
between the pier and the Harbour Office (`src/world/ferry.js:247-301`). It is not enterable, has no
staff, and three separate departure prompts sit within 6 m of each other on the quay (mainland ferry,
airport ferry tickets, the Naha evening boat). The user chose: **merge the Harbour Office and the
terminal into one Port Building on the same site, with a walk-in waiting hall. No new characters.**
The user also asked for an audit of businesses/locations that can be combined (report at the end).


---

## Where it goes
Same quay, replacing both buildings, so the arrival view (pier → Main Street) keeps its axis.
- Today: terminal x 4.7..9.5, z -49.3..-45.3; Harbour Office x 9.7..16.9, z -45.6..-38.4
  (`src/world/business-layout.js:16`).
- **Port Building footprint: x 4.6..17.0, z -48.0..-38.6** (12.4 × 9.4 m). South face stays 0.45 m
  inside the quay-edge bollard line (bollards at x ±5/10/15, z -48.45, `harbour.js:268`).
- Clock tower at the **south-west corner (x 4.6..7.4, z -48.0..-45.2)**: the one tall landmark you see
  from the incoming ferry and down Main Street.
- Moves needed: rope coil at (8.9,-47.2) and the east bench at (4.7,-43.2) (`harbour.js:273,314`);
  `FERRY_TERMINAL.platform/exit` (6.4,-42.9) and `driver` (5,-43.2) move out to the new west
  forecourt under the canopy (≈ (3.4,-44.2) / (3.4,-42.6)). `queue` and `arrival` stay on the pier
  (pinned by `tests/ferry.test.mjs:23-30`). Quay bays and ferry lanes (`town-traffic.js:28,70-88`)
  already run west of x 4.6 — keep that clearance.
- Keep the 大漁 flag pole (9.1,-38.9) as the forecourt flag at the north-west corner; ice cabinet stays.

## How it looks (art direction)
A 1960s–70s Okinawan public building, Nintendo-clean: few big shapes, one landmark, warm materials.
- **Massing:** two storeys. Ground floor 3.4 m: the waiting hall, glazed to the pier (west) and the
  quay (south). Upper floor 3.0 m, set back 1 m: the Harbour Office. Flat roof with a low parapet
  and a red-tile pent roof (Okinawan 赤瓦) over the ground-floor eaves on all sides.
- **Clock & lookout tower:** square, 11 m, white render, a clock face south (to the sea) and north
  (to the town), a small open lookout with a railing and the harbour radio mast on top.
- **Walls:** white/cream render with a hana-block (花ブロック) screen band along the upper floor
  (reuse the flower-block pattern from the Kitahama walls). Teal fascia band reused from today's
  terminal palette so it still reads as the same company.
- **West face (pier side):** a deep canopy on 4 slim steel columns over the forecourt where the queue
  forms; big glass doors; the fascia sign "港湾ターミナル / MINATO PORT TERMINAL" (English source text +
  `SIGN_JAPANESE` entry, per the English-inventory rule).
- **North face (town side):** the Harbour Office entrance (keeps its current door position
  ≈ (13.3,-37.55) so existing routes/schedules still work), a notice board and the flag.
- **Night:** lit hall windows and a lit clock face (emissive, works with the existing dusk glow hooks).
- Built with the kit (`src/world/okinawa/kit.js`) so it merges to a few draw calls; signs via
  `kit.sign` (both-faced where seen from behind) and `poster()` (`okinawa/signs.js`).

## Interior — the waiting hall
A code-built room like `src/world/interiors/town-hall.js` / the office room in `supplied-rooms.js:19`.
- ~11 × 8 m hall: rows of moulded benches, a ticket counter with the **Harbour master** behind it
  (existing resident, already works here), a departures board (live from `HARBOUR_LINE` and
  `ferry.board()` departures), a wall map of the strait, luggage shelves, a vending machine (reuse
  `createVendingMachine`), a rack of Sakura ferry punch cards (an honour box — no new seller),
  big windows onto the pier, a staircase to the upper office.
- **One ticket counter sells all departures:** mainland ferry (today `onAction('bus')`), airport
  ferry (today the separate quay prompt in `island-landscape.js:36`), Naha evening boat
  (today `city-trip` in `game.js:~393`). Remove the three loose quay prompts.
- **Upstairs = the Harbour Office:** the existing office interior is reached by "Go up to the
  Harbour Office" inside the hall (and still by its own north door). The "Review island development
  projects" prompt moves from the office door to a desk inside the office.
- Uses the new Enter/Exit buttons; third-person camera works (room is roomy on purpose).

## Phases
1. **Layout constants** — new `src/world/port-building-layout.js` (footprint, tower, canopy,
   forecourt points, hall spawn/exit); `FERRY_TERMINAL` platform/exit/driver read from it; office
   site/door in `business-layout.js` points at it. No visuals yet; all tests green.
2. **Exterior** — `buildPortBuilding()` in a new `src/world/port-building.js`; remove the old terminal
   box from `buildFerryTerminal` (keep its returned `place`/queue API) and the old office exterior;
   move rope coil/bench; colliders in `{x,z,w,d,height}` form (the format bug from last round).
3. **Waiting hall interior** — `src/world/interiors/port-hall.js`, registered as an enterable site
   (`businesses.js` / SITES) with Harbour master as staff via existing workplace schedules.
4. **Consolidate departures** — single counter menu; delete the three quay prompts; update text that
   still mentions the bus plaza/bus terminal in peninsula mode (`districts.js:63`, koban text).
5. **Polish & QA** — daylight/night screenshots from the pier, Main Street and inside; mobile draw
   calls (`renderInfo`) no worse than today at the harbour (≈ 140); wire/pole clearance test still
   green.

## Verification
- `npm test` (full suite), `npm run build`, `node scripts/english-inventory.mjs` (0 strings).
- New tests: `tests/port-building.test.mjs` — footprint clear of quay bays/ferry lanes/bollards,
  forecourt points reachable and unobstructed, hall enter→exit round trip, one counter offers all
  three departures, no leftover quay departure prompts.
- Existing pins: `tests/ferry.test.mjs`, `tests/boot.test.mjs` (landmark `ferry-terminal`),
  `tests/kitano-link.test.mjs` lanes, `tests/town-power-wires.test.mjs` (no wire through the tower).
- Screenshots with the audit hooks (`__JOHANSSON_AUDIT__.time(780)`, `teleport`) from the pier
  (0,-58), Main Street (1.5,0) and inside; saved-game restart check (`reload-ios.mjs`).

---

# Consolidation report (findings)

**Do together with the Port Building (same area, low risk)**
1. Three departure points → one counter (above).
2. Peninsula still carries bus-station leftovers: the "BUS TERMINAL" sign (`districts.js:63`), the
   police box described "at the bus plaza", and the "Harbour Line" naming. Rename to the ferry/port.
3. Prompts squatting on doors: "Review island development projects" (Harbour Office door) and
   "Complete the airport radio service" (Dock Workshop door, `island-landscape.js:36`) → move inside
   those rooms as desk/bench actions.

**Recommended next (content cleanup, no new characters)**
4. **Duplicate homes**: Thuan & Nao have the legacy `yuri-home` flat and Kitahama-1; Mrs Sato's legacy
   household id equals her Kitahama-2 site; Officer Mori has a legacy 4B entry but lives in the koban.
   → one home each (Kitahama for Thuan/Nao and Mrs Sato, koban for Mori); delete legacy entries.
5. **Name collisions**: Higa (Nishi facade house vs Higa Liquor), Kinjō (Nishi facade vs florist),
   Tōma (Kitahama household vs postman) → make each one family (the shopkeeper lives in that house).
6. **Snack/drink overload**: Sakura, Arakaki Sweets, Nakamura Zenzai, Blue Coral, two vending spots,
   Pocket Grocer facade, Hoshizaki store, two airport cafés. → merge **Arakaki Sweets into Nakamura
   Zenzai** ("Nakamura Zenzai & Sweets", Mrs Nakamura); drop the Pocket Grocer facade; keep Blue Coral
   as the one ice-cream place and remove the duplicate shaved-ice line.
7. **Rainflower Lane** (far east, z ≈ 113): 4 of 6 shops are read-only facades (Harbour Travel, Town
   Tailor, Secondhand Records, Pocket Grocer). → keep Florist + Blue Coral, turn the rest into homes
   or remove; Harbour Travel duplicates the new port counter.
8. **Airport's 8 anchor shops** duplicate town ones (Island Books ↔ Front-Row, Seaside Postcards &
   Travel Essentials ↔ Post Office, Departure Coffee + Blue Strait Tea). → keep 3: one café, Noodle
   Kitchen, Island Crafts.
9. **Quay sheds**: warehouse, dock workshop, net shed, Mr Fujita's shed, auction shed — keep (each has a
   distinct role; only warehouse + workshop have rooms). No change.

**Bigger decision for later (needs your call)**
10. Several features exist only for the old non-peninsula town modes and are switched off in the
    published game: tea house, Inakaya ramen fallback, Harbour Line bus station, Main Street homes 1–5,
    dining lane, old frontrow/form3d aliases. Removing the legacy modes would delete a large amount of
    code (in the "say more with less code" spirit) but is irreversible for those modes.
