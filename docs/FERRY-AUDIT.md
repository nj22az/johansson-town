# The Minato–Kitano-jima ferry: audit and plan

> **The manning table is history (19 October 2026).** The ship, her general arrangement and the audit stand; the people at the posts changed with the consolidation ([CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md) §9; `src/people/roster.js` SHIP_POSTS): Mr Fujita is the master (the Bus driver retired), Nils the chief engineer with Mac Turner (Mr Nakandakari renamed) as relief, Chin the motorman (Mr Higa Jr retired), Ms Uezu the bosun with Kōji her relief, and Ryo, Ren, Aya and Jun the chief officer, deck hand, purser and cook-steward; Jack Reed takes the Minato lines and Kai the Kitano ones.

The creator, 2026-10-10: *"audit it as marine ship construction engineer in Japan in the 1990's — now it looks like a
floating toy, it needs to be a realistic functional ship with loading decks, passenger waiting spaces, a realistic
functional engine room … and have a crew (some of our NPCs can be the crew …)"*; *"there are only two maybe 3 cars that
need to go on the ferry"*; *"the whole ship need to be modelled, we will have a dry dock later"*; and the rule that
came with it: *"don't take or make shortcuts when making the world"* (CLAUDE.md).

The audit is written as a 1990s Japanese ship-construction surveyor would write it for a small island car ferry
(小型カーフェリー) inspected by the government (JG) for smooth-water service (平水区域).


> **Decision, the creator, 2026-10-11 (supersedes the size in sections 2 and 4):** asked to choose between keeping this
> 22 m, three-car Minato Maru in today's harbour and a bigger ship with a bigger harbour, the creator chose **"Bigger
> ship, bigger harbour"**, keeping the name **Minato Maru (みなと丸)**; and answered yes to **crossings in real time
> with a doze option** and to **walking freely into the bridge and the engine room**. The bigger ship's particulars,
> machinery, electrics and harbour changes are in `briefs/ferry-audit.md` (about 34.5 × 8.4 m, 10 cars or 2 trucks and
> 5 cars, 100 passengers, the breakwater moved seaward and the outer pier lengthened). The work below (the model's
> construction, the crew, the paths, the look tool and the checks) carries over and is grown to that size, not thrown
> away. **One session builds the ferry at a time:** before ferry work, fetch the branch and read the latest commits on
> `src/world/ferry*` and this file.

## 1. Findings on the old ferry (ferry.js before this change)

| # | Finding | Severity |
|---|---|---|
| 1 | 15 m × 4.4 m with a 0.7 m draft: the size of a harbour launch. Its one "lane" was 1.1 m between the lines, narrower than a kei car (1.48 m); the deck held one car. | Major |
| 2 | Hull an extruded prism: vertical sides to a flat bottom, no sheer, no flare, no bilge, no keel. Seen from a dry dock it would be a box. | Major |
| 3 | Nothing under the water: no screws, shafts, rudders, skeg, thruster, bilge keels, anodes or sea chests. A ferry with nothing to drive or steer it. | Major |
| 4 | No draft marks, no load line mark, no name or port of registry. Every Japanese ship carries all three. | Major |
| 5 | The bow ramp a plate with two painted "chains": no hinge, no hydraulic rams, no side girders or toe. | Major |
| 6 | No mooring fittings at all (bitts, fairleads, windlass, anchor, capstan): moored by nothing. | Major |
| 7 | No navigation lights (masthead, sidelights, stern light), no radar, no whistle, no searchlight, no antennas: it could not legally sail at night. | Major |
| 8 | Lifesaving: two rings. No life floats, life-jacket lockers, muster signs, extinguishers. | Major |
| 9 | No crew anywhere; ramp and gangway moved by themselves. | Major |
| 10 | No engine room, switchboard, generators, steering gear or tanks: nothing for stories about breakdowns. | Major |
| 11 | Passengers rode the car deck among the cars (forbidden on Japanese ferries during the passage). | Minor |
| 12 | The code called the side against the pier "starboard"; she lies port side to the pier. | Minor |
| 13 | Cars boarding at Minato did a U-turn of 1.1 m radius on the spot (no car turns that tightly). | Minor (a shortcut) |

## 2. The ship: the Minato Maru (みなと丸), 1991

Data: `src/world/ferry-ship.js`. Model: `src/world/ferry-model.js`.

**Why this size.** Three cars (or a 4-tonne truck and a kei truck) in two lanes need a beam of about 6.4 m; two cars
nose to tail plus the ramp and the deckhouse need about 22 m. That is a 95-ton ferry, the smallest that carries a
deckhouse, a wheelhouse and a proper engine room, and it fits Minato harbour as it is: she berths port side to the
outer pier with her ramp on the quay, and swings in the basin with a metre to spare off the breakwater. The harbour
did not need to grow.

| | |
|---|---|
| Length overall / between perpendiculars | 22.0 m / 19.6 m |
| Beam / depth / draft / freeboard | 6.4 m / 2.48 m / 1.35 m / 1.13 m |
| Gross tonnage | 95 |
| Passengers / cars / crew | 60 / 3 / 4 |
| Speed | 10.5 kn service, 11.8 kn trial |
| Owner | Minato-chō (the town ferry, 町営フェリー); registered at Minato |

**General arrangement (fore to aft).** Car deck with the hydraulic bow ramp, two 2.6 m lanes, lashing points,
scuppers, inner bulwark stiffeners, a hydrant and extinguisher, and ladders up the deckhouse front. The deckhouse:
the passenger saloon with side and front doors and the muster and life-jacket signs. The stern mooring deck: capstan,
two pairs of bitts, closed fairleads, the flagstaff and two lifebuoys. The upper deck on the saloon roof: open deck
with benches, two rigid life floats, life-jacket lockers, lifebuoys, the funnel (both exhausts in one casing) and
the engine-room vents; the wheelhouse forward, its open wings with dodgers and wing consoles; the mast with masthead
light, radar scanner, whistle, VHF whips, GPS and searchlight; sidelights in their screens, red to port.
Below the car deck (data now, modelled in batch 3): steering-gear room, engine room, fuel and fresh-water tanks, crew
quarters (mess and galley, master's cabin, crew cabin, shower, changing room), fore peak and chain locker.

**Hull and underwater body.** Lofted from sections every 0.5 m: parallel midbody, a spoon forefoot under the ramp,
a counter rising over the screws, flare forward, a 0.6 m bilge. Keel bar and skeg; two shafts in stern-tube bosses
on A-brackets; two four-bladed bronze screws (1.05 m) that turn under way; two spade rudders with anodes; the
bow-thruster tunnel and its grilles; bilge keels; sea-chest gratings; antifouling, black boot-top, company teal
topsides and white bulwarks; rubbing strake; draft marks fore and aft, the JG load line amidships, the name forward
and name and port on the transom; the starboard anchor in its pocket.

**Machinery.** Two 257 kW high-speed diesels at 1 800 rpm through 2.47:1 reverse-reduction gears; engine-driven
sea-water, jacket-water and lube-oil pumps; 24 V electric start. A 30 kW bow thruster. Electro-hydraulic steering,
two pumps, hand pump for emergency steering. Fuel: A-type heavy oil (A重油).

**Electrics.** Two 60 kVA (48 kW) 445 V 60 Hz generators; IT main switchboard with insulation monitor; 445/105 V
lighting transformers; 24 V emergency bank; 30 kVA shore supply through a 200/445 V transformer at Minato. The load
balance (`FERRY_LOADS`, tested): at sea 35 kW on one set (72 %), manoeuvring 63 kW on two (66 %), loading 32 kW on
one, night 8 kW on shore power. The car deck is open to the sky and needs no exhaust fans. The bow thruster will not start on one generator; a preferential trip sheds the air
conditioning, galley and water heater. The emergency bank holds the emergency lighting, navigation lights, VHF and
alarms for about 7 hours.

**Scenarios for stories** (`FERRY_SCENARIOS`, each step a post and a place on board): blackout halfway across (bad fuel,
steering by hand pump), a net round the port screw, the ramp hose bursting at Kitano-jima, the shore power and the
rice cooker.

## 3. The crew (src/people/ferry-crew.js)

Safe manning for her size is four. Three are islanders who were already in the town; one is new.

| Post | Who | Why them |
|---|---|---|
| Master (船長) | **the Bus driver** | He drove the Harbour Line bus; when the line became the ferry he took his deck licence and went with it. Master since 1994. The town still calls him the bus driver (saves and looks keep the name). |
| Chief engineer (機関長) | **Mr Nakandakari** (new, 61) | Twenty years in the Naha cargo boats' engine rooms; Mr Shimabukuro of the power house sailed with him and sent for him. Lives aboard in the chief's cabin. |
| Oiler (機関員) | **Mr Higa Jr** | Grandmother Higa's grandson (his grandfather drove the harbour bus for thirty years). Served his time at Mr Ōshiro's boatyard. |
| Deck hand and bosun (甲板員) | **Ms Uezu**, week on / week off | Already "deckhand on the ferry, a week on and a week off"; lives aboard on her week on. |
| Relief deck hand | **Kōji** | Crews on the Ōshiro boat; takes the deck on Ms Uezu's week off. |
| Ticket clerk (ashore) | **Ms Ganaha** | Already sells the tickets at the Port Terminal window. |
| Linesman at Minato | **Mr Fujita** | Lives in his shed on the pier; takes the bow line at every call for a can of coffee. |
| Port | **Harbour master** | Gives the berth, keeps the port radio. |

Each post has a station and a job in every phase of a call (`FERRY_WATCH`: arriving, waiting, reversing, swinging,
leaving, crossing, night). `crewFor`, `crewDoing` and `crewOnDuty` answer who and what for stories and the game.
The island households (`island-households.js`) and the resident guide (the master's role) say the same.

## 4. What changed around her (the impact list, and how each was checked)

- **Berth:** centre (−7.45, −61.5), port side 0.15 m off the pier, bow 0.5 m off the quay wall; the ramp lands where
  it did. Hull collider follows. *Checked:* `tests/ferry.test.mjs` (every hull point, not just the centre).
- **Harbour paths:** keyed paths (`ferry-paths.js`) with the bow's heading set apart from the track: astern off the
  berth, swing on the thruster, ahead round the breakwater; the reverse to come in. *Checked:* a metre off the
  breakwater, 0.1 m+ off both piers, never over the quay, no spinning.
- **Kitano-jima crossing:** the same departure, the sea route, then bow in to the jetty 1.9 m off; leaving it, astern
  16 m before swinging. *Checked:* `tests/airport-ferry.test.mjs` with the real hull outline, and against the new
  tropical Kitano-jima (merged from main the same day): the seabed shelves from 2.2 m under her after body to 1.3 m
  under her bow, where her forefoot draws 0.35 m, and her ramp lands between the jetty's side rails
  (`docs/qa/ferry/16-…`, `17-…`).
- **Gangway, queue and landing:** the gangway now runs from the deckhouse's port door, through a gangway gate in the
  bulwark (shut at sea, folded back and hooked alongside), to the pier end (z −63.5); the queue and the arrival point
  moved south of the crate stack.
- **The pier's berthing face:** the guard rails on the outer pier's west flank are gone (they stood across her gangway
  and would foul her lines); four D-section rubber fenders hang there instead, where her side lies. *Checked:* `tests/airport-dock-access.test.mjs`.
- **Cars:** ride in car place 1 (starboard lane forward). Boarding at Minato is now a three-point turn: down, left onto
  the open quay, back round a 3 m arc onto her centreline and straight back down the ramp. *Checked:*
  `tests/kitano-link.test.mjs` (the full car body against every solid), `tests/airport-ferry.test.mjs`.
- **Quay:** the net-drying rack moved north to the warehouse frontage line, clear of the cars' arc; its rope coil now
  lies by the bollard her bow line goes to. *Checked:* `tests/port-access.test.mjs` (frontage clear).
- **Passengers:** ride the open upper deck aft, between the benches. *Checked:* clear of funnel, benches and vents.
- **Films and comics:** `remotion/tools/impact.py` finds no view of the berth in any episode. The storyteller's
  harbour and pier backdrops were photographed again, and a new place, *the Minato Maru* (`ferry`), was added with its
  own backdrops. *Checked:* `tests/feed-storyteller.test.mjs`.
- **Looked at in the game:** `tools/ferry-look.mjs` photographs her from the quay, the pier, broadside, astern, above,
  the bow and ramp (down and up), the car deck, the waterline (draft marks, load line) and lifted out of the water as a
  dry dock would see her (the reviewed set: `docs/qa/ferry/`). Faults those photographs found and fixed: the car deck and inner bulwarks drawn facing
  down (see-through), the transom's paint smeared and then half missing, the bow name half inside the plating, the
  draft marks inside the curved bow, the wheelhouse wings floating at half height, the gangway through the bulwark and
  across the pier's rail, a car-deck fan housing hanging in the air (and the fans themselves, which an open car deck
  does not need), a sign over the door frame.

## 5. Open: what is not built yet (in this order)

1. **Interiors** (batch 3): the saloon (carpet area to sit and lie on, seats, purser's window, toilets, vending corner,
   safety plan), the wheelhouse inside (wheel and autopilot, radar, magnetic compass, the throttles and telegraph,
   VHF, chart table, echo sounder, the navigation-lights panel), the crew quarters below (mess and galley, cabins,
   shower, changing room), entered from the ship like any building.
2. **Machinery modelled** (batch 4): engine room and steering-gear room in 3D (mains, gears, generators, main
   switchboard and 24 V board, pumps, tanks, CO₂ cabinet), and the switchboard as a live state (generators on and off,
   the preferential trip, the thruster interlock, shore power) that the scenarios drive.
3. **Crew in the world** (characters batch, never with ground or lighting): looks for Mr Nakandakari, Ms Uezu,
   Mr Higa Jr; the crew at their stations through each phase; Mr Fujita taking the line; guide entries and
   portraits so the storyteller can cast them; backdrops on board.
4. **Behaviour:** real mooring lines that run from the bitts to the bollards and slacken and tighten; the ramp lowered
   by the bosun, not by itself; the whistle; the wake and the engine sound; three cars at once (traffic loads one at
   a time today).
5. **The quay end:** a linkspan (可動橋) at Minato that follows the tide, as a real ferry port has, instead of the ramp
   landing straight on the quay edge.
6. **Kitano-jima:** cars there still do a half turn of 1.5 m radius on the plaza before backing aboard (the same
   shortcut Minato had); give it a real three-point turn too.
7. **Dry dock** (later, the creator): the underwater body is modelled for it now.

## 6. The bigger Minato Maru, batch by batch (from 2026-10-11)

The creator chose the bigger ship and the bigger harbour (the banner at the top; `briefs/ferry-audit.md` has her
particulars, electrics and crew). She is built in batches, each one kind, each planned before it is made (what it
touches: colliders, standing spots, walking routes, residents' routines, cars, tests, the storyteller's backdrops,
the films' shots via the studio's `remotion/tools/impact.py`), then changed, tested and looked at
(`tools/ferry-look.mjs`, which now photographs the source tree with `--source`, so the runtime need not be rebuilt
to look). Each batch is its own commit.

### Batch 1: behaviour that was wrong (today's 22 m ship, today's harbour)

**Plan: what it touches.**

| Change | Touches | Checked by |
|---|---|---|
| Crossings sailed as *passages* (`ferry-paths.js` `passage`): each leg (astern, swing, out of harbour, sea, approach, berthing) in its minutes, speed continuous from rest to rest, the bow turning through its keyed headings at no more than 3°/s in harbour and 1°/s at sea, the sea's corners rounded on steady turns (`roundedTrack`). The 18 s ride is the 18-minute passage played sixty times faster until crossings are sailed in real time | `airport-ferry.js` (both crossings), the ride in `island/play.js` (the camera follows her as before), cars aboard (`town-traffic.js` `sitOnDeck` copies her pose, so they roll with her), the player on her upper deck | `tests/airport-ferry.test.mjs`: every hull point a metre and more off the breakwater, the second pier, its arm, the houseboat and Kitano-jima's real shore, 0.1 m off the outer pier, 0.5 m off the quay; turn rates within the limits for each leg; speed never jumping; 18 minutes, 10 at sea |
| The harbour manoeuvres re-keyed (`TOWN_UNBERTHING`, `TOWN_BERTHING`): the old swing put her bow 2 m into the second pier's east arm (x −38.3…−23.7, z −64.3…−59.7) and her arrival touched it; no test looked at the arm | the same paths, and the timetable's arrival and departure (`ferry.js`, now passages too) | the tests above and `tests/ferry.test.mjs` (the arm and the houseboat added). Clearances now: breakwater 1.8 m, arm 1.27 m, second pier 4.2 m, houseboat 8 m |
| Her motion (`ferry.js` `shipMotion`): heave with the swell, roll at her own period (IMO estimate, 5.5 s), ±0.35° alongside and in harbour, ±2° at sea, pitch to ±0.5°; one model for moored, crossing and timetable, so nothing jumps when she casts off. The ramp's toe and the gangway's foot now rest on the quay and the pier while she heaves (they bobbed ±0.1 m into and above the concrete) | the model's ramp and gangway (`ferry-model.js` `restRamp`, `restGangway`); the cars' lane onto the ramp is unchanged (the toe stays where it lay) | `tests/ferry.test.mjs`: roll and pitch amplitudes; toe and foot within 2 mm of where they always lay while she heaves |
| Her lights: navigation lights under way from sunset to sunrise (none alongside), the saloon lit by the clock in service and only the night watch's light after the last boat; before, only the timetable mode (not used in play) lit her | `ferry-model.js` (`setNavigationLights`, `setCabinLights`), `ferry-ship.js` `FERRY_DAY` | `tests/ferry.test.mjs` (night crossing lit, red to port; dark alongside; none by day) |
| Her sound: the whistle at 350 Hz (COLREGs Annex III for 20–75 m; it was a liner's 110 Hz), sounding Rule 34's signals from her passage (one prolonged and three short leaving the berth, one prolonged passing the breakwater's end), played where she is; her engines follow her (idle alongside, louder under way, off on shore power after the last boat) instead of a fixed point by the Port Building | `town-audio.js`, the ferry's state passed to it from `game.js` (`world.ferry.audio`) | `tests/ferry.test.mjs` (the signals and where they are sounded; engine states by phase and hour) |
| One timetable: crossings on request, with the commuter boats in at 08:30, 14:30 and 22:00, on the poster under the canopy, the hall's board, the boarding menu, the harbour office and the ticket clerk on the izakaya telephone; Vy waits for the ferry to school, not a bus | `commuter-schedule.js`, `port-building.js` (poster), `island/play.js`, `izakaya-play.js`, `neighbours.js` (Vy's words only: her places and hours are unchanged) | `tests/ferry-timetable-words.test.mjs` |
| The power house reads 60 cycles (Okinawa is 60 Hz) | `school.js` | the same test |
| The fishing boat at the east quay called herself "the Minato Maru"; she is the Daisan Minatomaru, and the ferry has the name | `okinawa/quarters.js` (the inspect text) | read |
| Seen from the pier she no longer vanishes at the harbour mouth: the town draws streets only within 54 m of the player and treated her as a point with a ±4 m box (`render/town-sections.js`), so she popped out of sight as she left; she is now drawn wherever she is in view, like the islands on the horizon | `ferry.js` (`userData.horizon`) | `tests/ferry.test.mjs`; photographs 03 and 04 |

Not moved in this batch: **the cargo ship**. In today's 31 m basin there is nowhere a 26 m coaster can come in bow
first and leave again: the pocket west of the ferry (between her and the second pier) is 23 × 10 m, so a ship lying
there cannot turn to get out; the outer pier's east face needs a turn of 90° within 31 m of a breakwater, and her
stern would hit it; the east quay is full with the fishing boats. Every one of them also crosses the ferry's swing.
Its berth moves with the bigger basin, in batch 4 (to the outer pier's east face, in and out round the
breakwater's east end), and its clipping and sideways arrival end there.

**Looked at** (`node tools/ferry-look.mjs <dir> --source --jpg --set=crossing,night`, the reviewed set in
`docs/qa/ferry/b1-*.webp`): the swing clear of the second pier's arm (01), the ramp's toe on the quay (02), the ship
leaving and at sea seen from the pier (03, 04), at sea with the player aboard (05), her lights crossing at night (06:
masthead, green sidelight, stern light, the saloon lit) and dark alongside after the last boat (07), the timetable
poster (08), in at Kitano-jima (09). Two things the photographs taught the look tool: far from the player the game
draws neither the sea nor (until this batch) the ship, so a crossing is photographed with the player carried aboard,
as the ride does; and teleporting is not followed by a step, which would walk the player back to dry ground.

Not affected: no film view sees the berth or the poster (`impact.py` over x −45…10, z −120…−48: the `cloud` view of
`thuan-poster` sees 1 % of the berth's box, none of it in plain view); the storyteller's harbour, pier and ferry
backdrops show her alongside, where she lies as before.

### Batch 2: the ship as data at the new size (no visual change)

**Plan: what it touches.** `ferry-ship.js` becomes the 34.5 m Minato Maru as designed (`briefs/ferry-audit.md`
§2–§5): her particulars, heights, the general arrangement deck by deck (every space with where it is, what is in it,
why, and its ways out), the ten car places and the trucks' loading plan, the machinery and its systems, the electrics
(generators, emergency generator, shore power, boards, the preference trip) and the load table in five conditions
(at sea, arriving and leaving, loading, at night on shore power, blackout), the lifesaving and fire appliances, the
safe manning of eight, and the scenarios grown to her equipment. Nothing is drawn differently: the model and
everything that places things on her keep the 22 m hull's numbers, which move to the model
(`ferry-model.js` `FERRY_HULL`, `FERRY_DECKS`, the hull as drawn) until batch 5 grows her.

| Touches | How | Checked by |
|---|---|---|
| The model, the paths and berths, the crossing, the cars' deck place and the passenger's place (`ferry-model.js`, `ferry-paths.js`, `ferry.js`, `airport-ferry.js`, `town-traffic.js`) | read `FERRY_HULL`/`FERRY_DECKS` from the model instead of `FERRY_SHIP`/`FERRY_DECKS` from the data; the same numbers | every ferry test unchanged and passing; the model's triangle count and bounding box the same |
| Her roll period | `shipMotion` rolls at the drawn hull's period (`rollPeriod(FERRY_HULL)`), 5.5 s | `tests/ferry.test.mjs` |
| The crew (`people/ferry-crew.js`) | its four posts are four of the eight in `FERRY_MANNING`; who fills the other four is the crew batch's (the brief and the earlier plan cast them differently: an open decision) | `tests/ferry-ship.test.mjs` |
| The stories (`FERRY_SCENARIOS`) | the four kept and grown: the blackout now comes at the breakwater and the emergency generator takes the load; the net is round the starboard screw; the ramp hose; the shore power plugged in with two phases crossed (at 50 kVA the rice cooker no longer trips it) | every step's post is in the manning and its place in the general arrangement |
| Residents, routines, colliders, walking routes, cars, backdrops, films | none: data only | — |

**Checked.** `tests/ferry-ship.test.mjs` holds the data to the brief and the rules: displacement from her block
coefficient (within 2 %), depth = draft + freeboard, the masthead light six metres and a breadth above the hull, 4.2 m
clear under the passenger deck; every space inside her hull, none overlapping another unless it is inside it, every
manned space with two ways out (or one into a space with two), a hundred passenger places (36 + 42 + 22), the engine
room's ways out through the casings and the emergency-generator and CO₂ rooms opening to the open deck only; ten car
places and the trucks' plan sized for the town's longest and widest vehicle, half a metre apart, clear of the casings,
the walkway and the bow houses; the bilge main and the CO₂ by their rules; the load table's totals within 0.15 kW of
the brief (39.9, 109.8, 45.7, 10.3, 10.0 kW against its rounded 39.8, 109.7, 45.6, 10.3, 9.9), the generators at 40 %,
55 % on two, 46 %, shore power at 26 %, the emergency generator at 31 %, the preference trip shedding 14.4 kW at
stage 1, the thruster's 122 A and its star-delta start within two generators, the lighting transformer at 44–54 %;
rafts, jackets and lifebuoys for 108; the scenarios' posts and places. The model is unchanged: built from batch 1's
code and from this one, its 47,158 vertices give the same checksum, so there is nothing new to photograph; the 79
ferry, harbour, traffic and storyteller tests pass.

### Batch 3: the harbour, ground only (the breakwater out, the outer pier longer)

**Plan: what it touches.** The basin is made big enough for her: the breakwater moves 23 m seaward (its centre from
z −83 to −106, the same 68 × 4 m wall, its two beacons with it), so the basin is 54 m from the quay instead of 31;
the outer pier is lengthened from 15.3 m to 38.35 m (to z −88), slab, coping and edge beams, so the 34.5 m ship
will lie along its west face with her stern line on it. No prop moves in this batch: the old end rail at z −64.18,
the bollards, the bait station, the winch, the crates, the lamp and the fenders stay where they are, and the
extension stays shut behind the rail until batch 4 moves the rail and the pier-end props to the new end.

| Touches | How | Checked by |
|---|---|---|
| The breakwater and its beacons (`harbour.js`) | moved to z −106 | the tests that pin it (`ferry.test.mjs`, `airport-ferry.test.mjs`, `kitano-link.test.mjs`: its beacon is there, the open water inside and outside is clear) |
| The outer pier (`layout.js` `OUTER_PIER`, `town.js`) | slab, deck surface, coping and edge beams to z −88 | `routeAt`, `groundHeight` on the new slab; `open-street.test.mjs` |
| Walking on the pier | unchanged: the walkable pier still ends where it did (z −64.95, `OUTER_PIER.open`), so the extension beyond the old end rail is not walkable yet. (Stopping it at the rail itself was tried and undone: two of today's queue spots, z −63.85 and −64.15, stand in the rail; they move with the gangway in batch 4) | `port-access`, `airport-dock-access`, `bus-boarding`, `open-street` |
| Today's 22 m ship's passages (`ferry-paths.js`, `airport-ferry.js`) | her old swing put her stern where the longer pier now is (x −2.7, z −76.6 as she turned); she now backs out south-west, clear of the pier, and swings in the western basin the breakwater has opened. The mouth's corner moves out with the breakwater's west end (to −47, −86; the sea corner to −42, −124), her way in starts its swing a little further south (−29, −73.5), and the minutes are shared again (in from the mouth 1.5 min, the sea 9.5; out unchanged); the breakwater's prolonged blast is sounded at its new end | `tests/airport-ferry.test.mjs`, `tests/ferry.test.mjs` against the new pier and breakwater (whole hull outline, turn rates, speed and acceleration) |
| Standing spots and routines | none move: the pier-end spot (`openings.js` 'pier'), the fishing, bait and winch prompts, Vy's place and the queue are all north of the rail | the same tests |
| Cars and traffic | none: the cars' lanes are on the quay and the ship | `kitano-link.test.mjs` |
| The storyteller's harbour, pier and ferry backdrops | the breakwater and the extension are in their background | looked at from the same cameras (below); rendered again with the new ship in batch 5, so the pictures are not committed three times |
| Films | `impact.py` for the old and new breakwater and the extension | below |

**Checked.** The related suites pass (85 tests: `ferry`, `ferry-ship`, `ferry-timetable-words`, `airport-ferry`,
`airport-island`, `airport-dock-access`, `kitano-link`, `port-access`, `open-street`, `bus-boarding`,
`lived-in-island`, `fujita-houseboat`, `owned-vehicles`, `harbour-instances`, `feed-storyteller`, `spawn-scene`).
`kitano-link.test.mjs` now finds the breakwater at its new place and keeps the open water clear inside and outside it.
The whole hull outline, every second of both timetables: 3.84 m off the breakwater (its south-east head, on the way to
Kitano-jima; 1.8 m before), 3.75 m off the second pier arm going out and 1.78 m coming in, 6.65 m off its north face,
12.6 m off Fujita's houseboat; she lies 0.15 m off the outer pier only at the berth, on her fenders. Photographed from
source (`tools/ferry-look.mjs --source --set=harbour`, its harbour views moved out with the basin): the plan, the
extension from the quay, the swing in the western basin, out round the breakwater, the way in, and the storyteller's
pier camera with the extension and the breakwater behind the rail (`docs/qa/ferry/b3-01` to `b3-06`). Films:
`impact.py` finds no view that sees the old or new breakwater or the extension, in either episode.

**Still open after batch 3.** The cargo ship still comes in sideways along x −20.5 and now passes through the
breakwater at its new place (it passed through the old one too); batch 4 gives her a berth and a way in. The sea leg
to Kitano-jima joins its leading line 3.8 m off the breakwater's south-east head: good enough for today's ship at
the time-lapse's speed, not for a 34.5 m ship; batch 5 lays her passages again (the east gap, or the leading line
joined further east).

### Batch 4: berths, props and colliders

Done in three parts, each checked and committed on its own: (a) Minato's ferry berth, (b) the cargo ship's berth,
(c) Kitano-jima's berth (after the island work merged from main the same day has been read). Today's 22 m ship still
sails until batch 5; everything here is laid out for the 34.5 m ship and works for both.

#### 4a: the ferry's berth at Minato

**Plan: what it touches.** The pier's west face becomes a berthing face for the 34.5 m ship (stem at z −52, stern
at −86.5): nine V-type rubber fenders (250 mm, 1 m long) at 4 m centres from −52 to −84 on the coping face, in place
of the four D-fenders that served the 22 m ship; four cast bitts on the edge, 0.45 m in from the face, where her
lines lead (−53 head line, −62 forward spring, −77 after spring, −87 stern line), in place of the two mushroom
bollards that stood in the middle of the west half (2.75 m in, where the passengers will walk to her gangway); a
ladder recessed into the face at −66; a lamp at −79.5 (the old one at −63.25 stays). The pier end moves to the new
end: the end rail (to z −87.6) and the anglers' corner with it (the bait station, the winch, the crates, the rope
coil, the fishing prompt, a lifebuoy on the end rail), and the walkable pier with it. At the quay, a steel landing
plate for her ramp, flush with the quay (x −10.8 to −6.3, the 4.4 m ramp's footprint and its run-off); the quay
bollard that stood in it (x −10) and its rope coil move 2.3 m west, and the quay rail stops short of the plate.

| Touches | How | Checked by |
|---|---|---|
| Her berth (`ferry-paths.js` BERTH_X) | she lies on the fender faces, not 0.15 m off a bare face: her centre from x −7.45 to −7.64 for today's ship (−8.64 for the 34.5 m one); leaving, she comes 0.3 m off the fenders while she backs | `ferry.test.mjs`, `airport-ferry.test.mjs` (whole hull against the fenders, the pier, the arm, the breakwater) |
| Colliders | the two bollards in the walk go; four bitts on the edge, the bait station, winch and crates at the new end; nothing new stands in the walk from the quay to the gangway or the queue | `airport-dock-access` (street to the queue and landing), `port-access`, `bus-boarding`, `ferry` (queue places on the pier) |
| Walking on the pier | to the new end rail (z −87.4) instead of −64.95 | `stability.test.mjs`, `systems.test.mjs` (the new end stops you), `open-street.test.mjs` |
| The gangway, the queue, the arrival point | unchanged in z (they follow the ship's door, `FERRY_BERTH.gangwayZ`); the gangway is 0.19 m longer across to the pier; no bitt within a metre of it | `ferry.test.mjs`, photographs |
| Cars and traffic | the ramp and the cars' line move 0.19 m west with her; the landing plate is flush, the nets keep 0.26 m to a car's mirror | `owned-vehicles`, `kitano-link`, photographs (the nets move in batch 5, with her new centreline) |
| Standing spots and routines | the spawn 'end of the pier' (`openings.js`) moves to the new end; residents' places (`town-grid.js` pier, the cat, the ballgame) are characters' routines and are left for their own batch | `openings.test.mjs`, `spawn-scene.test.mjs` |
| The storyteller | the pier's camera (`feed/places.js`) moves to the new end, where its things now are (the end, the rod, the bait, the light); the pictures are rendered again in batch 5 with the new ship | `feed-storyteller.test.mjs` |
| Films | `impact.py` for the pier, the quay plate and the bollard | below |

**Checked.** The related suites pass (126 tests, the batch 3 set and `stability`, `systems`, `openings`,
`port-shed`, `port-building`, `feed-seating`, `east-garden`, `office`, `resident-life`, `town-sections`,
`quest-customization-audit`). Two new checks: she lies on the fenders' faces (to 5 mm), with four or more along her
side, and no point of her hull goes into them at any moment of either timetable (`ferry.test.mjs`, and
`airport-ferry.test.mjs` for the Kitano-jima passages). Doing that showed she touched the forward fenders by a centimetre
in the last metre of coming alongside, turning as she slid in; her last key now has her parallel to them, 0.36 m
off, so she closes the last metres square. Clearances as before (3.84 m off the breakwater, 1.78 m off the arm
coming in, 3.75 m going out); turn rates within the limits. Walking: Main Street to the queue and the landing point,
the pier to its new end (−87.35, the lifebuoy on the rail) and not past it. Films: `impact.py` finds the quay corner
by the landing in one wide view of `thuan-poster` (beat 5, the cloud view), but neither the plate nor the old or new
bollard in plain view; nothing of the pier. Photographed from source (`docs/qa/ferry/b4a-01` to `b4a-08`): the pier
from the quay, her side on the fenders, the empty berthing face with the ladder's recess and the bitts, the gangway
clear of the forward spring's bitt, the ramp on the landing plate with the kerb cut away, the anglers' corner, the
view from the moved spawn, the plan. The anglers' things were moved once after looking: the winch to the east edge
and the crates beside the bait station, so the spawn's view of the lighthouse is not across a crate stack.

**Left for later.** Her lines to the bitts are drawn with the new ship (batch 5), when her own bitts and fairleads
are where they will stay; the drying nets north of the ramp move with her new centreline then too. The residents'
'pier' place (`town-grid.js`, used by the cat and Sunday's ballgame) stays at z −62: that is a routine, not a prop.

#### 4b: the island cargo boat's berth

**Plan: what it touches.** The cargo boat lay "3.5 m off the west quay" with her bow inside the ferry, and came and
went sideways through the breakwater (finding 5). The brief's first choice, the outer pier's east face for the 26 m
ship, does not work once it is drawn: with the breakwater 16 m off the pier's end, a 26 m hull cannot be turned
onto the face without her bow crossing the pier or her stern the breakwater (tried with the whole hull outline at
every second: −0.3 to −4 m into one or the other). The west quay's pocket is a trap the ferry's bow closes. So she
becomes what an island of this size is actually served by, a **19-ton class island cargo boat (19トン型貨物船), 20 × 5
m** (the brief's own fallback length), and lies at the **pier's east face**, starboard side to, bow 2 m off the quay,
on five V-fenders, her four lines on bitts on the east edge (z −53 head line, −60 forward spring, −64 after spring,
−73 stern line). In: from beyond sight to the south, up the open water east of the harbour, round the breakwater's
east end (9 m off it), across the eastern basin on a slant to the pier, the stern brought in last. Out: the stern
sprung off, astern 22 m until her bow is past the pier's end, ahead hard to port across the eastern basin (her stern
kicks to 2 m off the pier's end), past the breakwater's end and away south. Her speed is held to what she can carry
(0.05 m/s² ahead, 0.03 astern, 2.4 °/s on her turns: `ferry-paths.js` `profiledTrack`). The fishing boat that lay off
the east face goes alongside the main quay east of the pier, by the east quay's boats, on the quay wall's tyre at
x 14, her lines to the quay bollards at x 10 and 15; the east face's rails and her two bollards go.

| Touches | How | Checked by |
|---|---|---|
| The cargo boat (`cargo-shipping.js`) | 20 × 5 m (her old 26 m model drawn to scale), floats 0.7 m deep instead of 0.14, real passages in and out, four mooring lines drawn to the bitts while alongside, in place of the single rope to the west quay | `tests/cargo-shipping.test.mjs` (new): every half second of both passages, the whole hull outline against the pier, its fenders, the ferry's fenders, the quay, the breakwater, the moved fishing boat, the east quay's boats and Kitano-jima's shore; never west of the pier; speed, turn rate and acceleration; she lies on her fenders |
| Her timetable (`CARGO_CALLS`) | alongside 07:30–08:55 and 15:00–16:30 (the morning boat used to leave at 08:40, in the ferry's 08:30 call); in and out take her passages' minutes (4.4 and 5.7) | the same test: her harbour minutes fall outside the ferry's timetable calls |
| The pier's east face (`town.js`, `minato-berth.js` `CARGO_BERTH`) | five V-fenders, four bitts on the edge; the two bollards 2.75 m in, the rails on the east flank and the fishing boat's ropes go; the ladder stays between her fenders | `airport-dock-access`, `port-access`, `stability` (walking on the pier) |
| The fishing boat (`harbour.js`) | alongside the main quay at x 13.5–19.8, lines to the quay's bollards | `cargo-shipping.test.mjs` (4 m off the cargo boat), photographs |
| Her board (`cargo-shipping.js`, the west quay) | the real times, and which side she berths | `lived-in-island.test.mjs` |
| Residents | none: Riku, Emi and the forklift keep their places and hours (`docklands-life.js`); the freight board's shifts are unchanged | `lived-in-island.test.mjs` |
| The ferry | none: the two never share water (the cargo boat never comes west of the pier) | `cargo-shipping.test.mjs` |
| The storyteller | the harbour camera (16:00) now has her alongside the east face in its view; rendered again with the new ship in batch 5 | batch 5 |
| Films | `impact.py`: neither the east face, the fishing boat's new place nor her old place is in plain view of any shot | done |

**Checked.** The related suites pass (115 tests, with the new `cargo-shipping.test.mjs`). Her clearances, whole
hull, every quarter second: 0.70 m off the pier and its fenders while she slants in, 2.0 m off the pier's end as her
stern kicks on the way out, 7.8 m off the breakwater, 3.6 m off the fishing boat, 10.6 m off the east quay's boats,
2.0 m off the quay with her bow alongside; never west of the pier. Her passages: in 4.4 minutes, out 5.7; at most 3.2
m/s (6 knots) at sea, 2.4 °/s on her turns, 0.05 m/s² changing speed. Walking on the pier and to the queue as before.
Photographed from source (`docs/qa/ferry/b4b-01` to `b4b-07`): round the breakwater's east end, slanting in to the
pier, alongside with her lines and fenders, swinging out across the eastern basin, the fishing boat on the quay, and
the harbour from above at 08:00 with both ships at their berths.

**Left for later.** Her hull is still the old box model drawn smaller (a flat-sided hull, the deck overhanging its
bow); she deserves the ferry's lofting in her own batch. An on-request ferry crossing to Kitano-jima can meet her
on her sea leg south-east of the breakwater (only the timetable calls are kept apart); the call batch should have the
ferry wait for her, as a harbour master would.

#### 4c: Kitano-jima's berth

Waits for the merge of main's island work (Kitano-jima and Mount Aoba grown in detail, another session, 2026-10-11)
into this working copy, which another session's unfinished files hold up; it is done on the merged island.

### Batch 5: the hull and decks at the new size

**Plan.** `ferry-model.js` is drawn again from the data (`ferry-ship.js`), not scaled: the hull lofted by the same
method at 34.5 × 8.4 m, 3.0 m deep, floating at her laden draft of 1.9 m (car deck 1.1 m above the water: the ramp
lies at 5° on the quay), a blunt island-ferry bow with the ramp's opening and the two bow houses, the spoon forefoot,
the counter over twin 1.45 m screws, two spade rudders, the 0.9 m thruster tunnel; white topsides over red-brown
antifouling with the teal sheer band; the car deck (2.5–30 m from the transom) with two lanes, ten numbered places,
48 lashing sockets, the casings either side (3–20 m) and the railed walkway to the gangway door; the passenger deck
over it (0–23 m: the open deck aft with its benches and twin funnels, the deckhouse with windows the length of the
lobby, carpet room and saloon, the side walkways); the bridge deck (the crew house, the wheelhouse and its open
wings); the compass deck and the mast with its lights at their heights (masthead 15 m above the keel); the 4 m ramp
and 2 m flap on their rams; the lifesaving gear where the GA puts it. Every deck a person uses is a floor at its GA
height with the headroom and the stairs between, listed in ship coordinates for the walking batch (`FERRY_WALK`).
One correction to the data: the gangway door and the walkway to it go to the **port** casing, the side she lies to
at Minato (the brief put them to starboard, which would face the open water there).

| Touches | How | Checked by |
|---|---|---|
| The model and its parts (`ferry-model.js`: hull, decks, ramp, gangway, gate, lights, screws, radar) | drawn from `FERRY_SHIP`, `FERRY_HEIGHTS`, `FERRY_GA`; the same parts and controls (`setRamp`, `restRamp`, `restGangway`, `setGate`, lights) | `ferry-ship.test.mjs` (the model's sizes and decks against the data, the screws in their apertures, the ramp's width and reach), draw calls |
| Her berth at Minato (`ferry-paths.js`) | on the fenders (x −8.64), the stem 2.2 m off the quay (centre z −69.45), the gangway door at z −72.7 | `ferry.test.mjs`, `airport-ferry.test.mjs` (whole hull) |
| Her passages in and out of Minato and to Kitano-jima | laid again for 34.5 m: astern off the berth, the swing in the western basin round (−24, −84), out by the mouth; the sea route joining Kitano-jima's leading line clear of the breakwater's head | the same tests; turn rates, speed, acceleration |
| The gangway, the queue, the arrival point | follow her door (`FERRY_BERTH.gangwayZ`) to z −72, on the new pier length | `ferry.test.mjs` (queue on the pier), `airport-dock-access.test.mjs` (the walk to it) |
| Cars (`town-traffic.js`) | the ramp's landing and the deck place from `FERRY_CAR_PLACES` (the first car to the aft end of the starboard lane, as a loader fills her); the drying nets out of her ramp's line | `owned-vehicles`, `kitano-link`, `bus-boarding` |
| The passenger's place on a crossing (`play.js` via `FERRY_DECKS.passenger`) | the open deck aft, between the benches | `airport-ferry.test.mjs` |
| Kitano-jima's berth | her ramp on its landing (after 4c) | `airport-ferry.test.mjs`, `airport-dock-access.test.mjs` |
| The storyteller | the harbour, pier and ferry pictures rendered again (`tools/render-feed-backdrops.mjs`, from source) | `feed-storyteller.test.mjs`, looked at |
| Films | `impact.py` for her new footprint | below |

**What changed from the plan, once it was drawn.** (1) Her ramp, centred on her centreline at x −8.64, would have
landed 0.37 m inside the warehouse's south-east corner (x −10.57 from z −47.96), as would the brief's (x −10.8): the
quay between the pier and the warehouse is 6.4 m wide. So her stem lies 2.2 m off the quay, the 4.6 m leaf lands
0.33 m short of the corner, and the 2 m flap that lies on the quay is 3.6 m wide, 0.13 m clear of the wall; the
landing plate is narrower under the flap. (2) The row of three fish crates under the floats on the warehouse's wall
(`okinawa/old-town.js`) stood where the flap lies now, and the corner from there to the forklift's shutter is swept
by the cars coming off her (`kitano-link` found a car's tail in the one stack first kept there): the crates are gone,
as a ferry's apron is kept clear, and the floats stay hung on the wall above it. The quay wall's tyre fender at x −7,
which had stood in the coping and was left standing on the plate when 4a cut the coping away, is gone too (her stem
lies 2.2 m off the quay). The drying nets move 1.3 m north: the cars
backing round onto her centreline, a metre further west than the 22 m ship's, sweep their old place. (3) Her harbour work takes longer than the small ship's: in, four and a half minutes (the timetable's
`FERRY_TIMES.harbour`, 3.5 before), with a pivot leg of its own; to Kitano-jima the harbour work at both ends takes
about ten minutes of the eighteen and the sea seven. (4) The sea route to Kitano-jima now runs 28 m south of the
breakwater and joins the leading line east of its head (the 34.5 m ship's berth there is 6 m further out along it);
her hull passes the head 3.4 m off going and 3.2 m coming back (3.8 m for the 22 m ship): the leading line itself runs
that close, and 4c, which lays Kitano-jima's berth for her, is the place to move it out. (5) The passage planner can now ease a
leg's speed in from the last one's over a given distance (`ease`), so the slow pivots and the brisk legs either side
join without a jump. (6) The landing plate of 4a lay on the quay's slab, its top 4 mm over the concrete across 21 m²,
which a phone draws as two flickering surfaces (`ground-clearance.test.mjs` found it). The slab (`harbour.js`) is now
cast round the plate and recessed under it: the plate and the steel angle in front of it are let in, their tops flush
with the concrete (`MINATO_BERTH.landing.top`, −0.016), and plate and concrete meet edge to edge.

**Checked.** `ferry-ship.test.mjs`: her particulars from the data, her decks at their heights, the mast top and the
masthead light where the GA puts them, ten car places in two lanes stopping at the casings, the screws under the
counter, the lights and the ramp's rams, and every deck a person walks on outside (`FERRY_WALK`: the car-deck walkway
and lanes, the aft mooring station, the open deck, the side walkways, the bridge deck's ledges and aft platform, the
wings, the compass deck) is a drawn floor with two metres over it; 31 meshes, about 25,000 triangles.
`ferry.test.mjs`, `airport-ferry.test.mjs`: the whole 34.5 × 8.4 m hull against the pier, its fenders, the second
pier's arm (1.9 m in the pivot), the breakwater (2.1 m), the houseboat (10.6 m), the quay and Kitano-jima's shore
(4.1 m), every half second of every passage; turn rates within their limits and no speed jumps; the ramp's leaf on
the landing plate and its flap flat, the gangway's foot on the pier, as she heaves and rolls. `owned-vehicles`,
`kitano-link`: the crossing car backs aboard to the aft place in the starboard lane, its whole body clear of every
solid on the quay. `airport-dock-access`: Main Street to the queue at her new door. `ground-clearance`: no two surfaces in one plane
(the plate let into the slab), with `boot`, `collider-grid`, `consolidation`, `warehouse` and the rest of the harbour's
suites. Films: `impact.py` finds nothing of
her, her ramp or the plate in any shot; the moved nets and the crates' empty place are in plain view of `thuan-poster`'s cloud shot
(beat 5, down Main Street): its plates `main-street` and `main-street-2` must be photographed again before that film
is rendered again (the published film is unchanged). Photographed from source (`docs/qa/ferry/b5-01` to `b5-16`): at
the berth from the quay, the ramp on the plate by the warehouse's corner, the gangway from the pier, broadside, the
stern quarter, along the car deck from the ramp, the open deck aft, the bridge and mast, from above, in dry dock,
pivoting in the western basin, out round the breakwater, bow-in at Kitano-jima, alongside at night, the landing
plate flush with the quay (b5-15), and the quay's kerb across the pier's root (b5-16, found; below). The storyteller's
harbour, pier and ferry pictures are rendered again from source (`tools/render-feed-backdrops.mjs --source`).

**The Kitano-jima passages on the merged island.** This batch was built on the island as it stood in this working
copy, Kitano-jima 150 m east of the harbour. On the branch Kitano-jima had moved far across the strait (main,
`48431b8b`, to x 270, z −290) and the crossing had been re-timed from its legs' lengths (`8ebecf2c`). In the merge,
`airport-ferry.js` keeps `8ebecf2c`'s paces (28 m a town minute at sea, 24 out of the harbour) and its crossing timed
from the legs' lengths, with this batch's harbour keys, eased legs and harbour minutes for the 34.5 m ship
(`FIXED_MINUTES`: 7.6 to Kitano-jima, 9.5 back; out of each harbour at least 3 and 1.5 minutes). Her sea route is laid
again for her: from the mouth south to (−42, −132), a 60 m turn there to the south-east across the strait, and a 60 m
turn onto the leading line 65 m short of her berth (which lies 6.25 m further out along it than the 22 m ship's). The
22 m ship's 40 m turns took her to 1.03°/s where a turn meets a straight; on 60 m turns she turns at most 0.62°/s going
and 0.69°/s coming back. The crossing is 22 minutes (19 for the 22 m ship; the ride 13 seconds): out, 2 astern, 2.5
the pivot, 3 out by the mouth, 11.4 at sea, 1.5 the approach and 1.6 alongside; back, 1.5 astern, 2 her swing, 1.5
out along the leading line, 11 at sea, 1.5 in through the mouth, 1.6 the pivot and 2.9 alongside. Her hull keeps 2.1 m
off the breakwater (in the pivot) and 3.95 m coming in, 1.88 m off the second pier's arm, 10.6 m off the houseboat and
4.1 m off Kitano-jima's shore at the jetty. Checked on the merged tree: `airport-ferry`, `airport-dock-access`,
`ferry-timetable-words`, `ferry`, `ferry-ship`, `kitano-link`, `owned-vehicles`, `cargo-shipping`, `airport-island`,
`ocean`, `ground-clearance`; photographed on the merged island (`docs/qa/ferry/b5-17` to `b5-24`: the pivot in the western basin, out past
the breakwater, at sea with Kitano-jima ahead, on its leading line, alongside, and bow-in at its jetty with the ramp
on the landing). Kitano-jima's berth itself is still 4c: the jetty has no fenders or bollards for the bigger ship.

**Left for later.** Her mooring lines to the bitts (the call batch); Kitano-jima's berth for her (4c); the interiors,
the engine room and the bridge to walk in; the timetable's real-time crossings.
Found while photographing the plate, not changed here: the quay's coping and kerb (`harbour.js`) run on across the
outer pier's root (x −4.1 to 4.1), so everyone walking onto the pier walks through a 28 cm kerb, and the tyre fender at
x 0 stands in it. A props batch cuts them there; the pier's deck then stands 11 cm over the quay at its root, which
wants a short ramp (`layout.js` steps the walking height there from 0 to 0.098).


### Batch 6a: walking aboard alongside (2026-10-11)

The creator, 2026-10-11 (a phone screenshot at the gangway): *"I want to be able to board and explore the ferry,
whenever it's in port."* Until now "Board" opened the ticket menu and the crossing was a ride; nobody set foot on her.

**What changed.** `src/world/ferry-walk.js`: her decks are floors in her own frame (the ship, the ramp's leaf, its flap,
the gangway), so they heave and roll with her and can stack (the car deck under the passenger deck); the floor under
you is the highest one no more than a step above your feet. Her casings, bow houses, the walkway's rail, the pillars,
the capstan and bitts, the forecastle ladders, the ramp's rams and the gangway's rails are solids in the same frames.
Where a floor ends you step ashore only where the shore is there: off the gangway's foot onto the pier, off the
ramp's flap onto the quay's landing plate (Minato) or the pier (Kitano-jima). The gangway is a floor only while it is
run out, the ramp only while it is down, and nothing is a floor while she is under way: **only in port**.
`game.js` walks the player on them (`deckUnder`, `playerGround`; her own solids instead of the town's bounds and the
hull collider while aboard; the third-person lens kept out of her casings and from under the passenger deck's slab).
A vehicle's crossing (`island/play.js`) waits while the player is aboard, so she never sails off with a visitor; the
player's own crossing is still bought on the pier and ridden on the open deck as before.

**The model.** The gangway door was painted on a solid casing. The port casing now has the passage the general
arrangement gives it (shipyard z 13.5–14.5): the gangway door in her side, hooked back against the passage's aft wall
alongside; the gate leaf hooked back against its forward wall (it used to swing into the casing); a 2 m deckhead with
its light; the shore-power box (440 V) on the forward wall; and the inboard door onto the walkway, hooked back against
the casing's face.

**What you can walk now.** The pier → the gangway → the passage → the walkway (its rail keeps you off the lane until
its ends) → the whole car deck from the aft mooring station to the bow houses → the ramp → the quay, and back; at
Kitano-jima the ramp from the pier.

**Checked.** `tests/ferry-walk.test.mjs`: the walk from the pier up the gangway, through the casing to the walkway and
the lane with no jump in height; the bulwark, the casings and the gangway's rails stop you; down the ramp to the quay
and back; at sea, nothing; up the ramp at Kitano-jima; every floor 4 cm or less from the surface the model draws.
In the running game (source tree, headless): the same walk by the keyboard, photographed on the pier, in the passage,
on the walkway, down the lane, on the ramp and on the quay. The whole suite (`npm test`).

**Open, next batches (in this order).**
1. **Stair P and the lobby** (6b). The general arrangement's passenger stair P (casing P, z 10–13.5) cannot top out in
   the lobby (z 6–9.5) as drawn: rising aft from the walkway's door at z 11.8 at 48°, it needs its well open from
   z 7.4 to 9.4, under the 0.5 m side walkway. The lobby is made full breadth (to her sides, z 6–9.5) with the stair
   heads P and S in its wings, and the side walkways start at its forward doors (z 9.5).
2. **The side walkways are 0.5 m wide** (x 3.6–4.1), too narrow to walk (a person needs 0.56 m, and the walkways'
   liferafts stand in them). The deckhouse goes to 6.8 m (walkways 0.7 m clear), the liferafts onto cradles outboard
   of the rail.
3. The lobby's furniture (purser's window, kiosk, vending corner, boards), the toilets, the carpet room, the saloon;
   the open deck aft and its ladders up to the bridge deck; the wheelhouse and the crew's rooms; the engine room
   (from the casing's door at z 7). Each with its floors and solids in `ferry-walk.js`.
4. The forecastle tops (a vertical ladder each): a climb, not a walk.
5. Tapping to walk (point-walk) plans over the town's ground only, so it does not route aboard yet; walking with the
   stick or the keys does.

**The ramp head cleared (the creator, 2026-10-11, with a marked-up phone screenshot: "remove anything that blocks the
drive up the ramp, just delete them, we will decide later if we need any of them"; "the ramp shouldn't poke under the
warehouse").** Deleted: the nets' drying frame against the warehouse (`harbour.js`), the harbour hand pump and its
prompt (`town.js`), the net of floats on the warehouse's corner (`okinawa/old-town.js`) and the quay bollard at x −5
beside the landing (`harbour.js`). The warehouse (`warehouse.js`) is 2.5 m shorter at its quay end (z −45.4 instead
of −47.9): its east wall stood 0.4 m over the landing plate's west edge, so the ramp ran under it. Its street end,
doors, signs and shutter are where they were. Open: whether any of the deleted things come back, and where.

### Batch 6b: her houses walked inside (2026-10-11)

The creator, 2026-10-11: *"The ferry needs to be explorable."* Her decks above the car deck are now walked, inside and
out, while she lies alongside.

**One list for what is built and what is walked.** `src/world/ferry-interior.js` holds her casings, stairwells, the
passenger deck's slab, the deckhouse, its rooms and furniture, the walkways, the ladders and the wheelhouse as boxes,
bars, panes and floors. `ferry-model.js` draws them; `ferry-walk.js` stands people on the floors (a stair's or a
ladder's floor slopes, `y` given at each end) and stops them at the boxes marked solid; the third-person lens stays out
of the boxes marked for it (the deckheads, the awning, the bridge deck's platform). So what you see and where you can go
cannot disagree, and the tests check every floor against the surface the model draws.

**The general arrangement corrected (`ferry-ship.js` FERRY_GA).**
- *Stairs P and S:* in the casings, z 7.4–12.3, the door from the car deck at z 11.3–12.3 (P from the walkway), the flight
  rising aft at 48° (22 risers of 0.2 m) to the lobby, the well open in the passenger deck from z 7.4 to 9.4 where the
  stair passes under it with headroom. (As drawn before, z 10–13.5, a stair could not top out in the lobby.) The crew
  changing room (P) and the bosun's store (S) are under the flights.
- *The lobby* is the deckhouse's full breadth (z 6–9.5, x ±4.1), its wings the stair heads.
- *The house forward of it is 6.8 m wide* (was 7.2): the side walkways are 0.7 m, wide enough to walk (0.5 m was not),
  from z 9.5; their liferafts are in cradles outboard of the rail (they stood in the walkway).
- *The saloon* has a cross passage at its aft end (z 16.5–17.6) to its side doors (moved from z 21.7 to 17.05), then
  the seven rows of 42 seats.
- *Each walkway ends in a ladder to its bridge wing* (z 17.6–19.5, 53°), and the wing's door opens into the wheelhouse.
  (The open deck no longer opens onto the walkways: the lobby's wings stand between.)

**What you can walk now.** From the walkway on the car deck, through stair P's door and up into the lobby (the
purser's window, the drink machines, the toilets' doors, benches, the timetable board); aft through the double door to
the open deck (benches under the awning, the funnels, the liferaft, the rescue boat) and up either ladder to the bridge
deck's aft platform (the emergency-generator and CO₂ rooms' doors); forward along the corridor between the toilets, up
two steps into the carpet room (carpet, cushions, the shoe shelves, the life-jacket lockers, the blanket rack, the
television), down two into the saloon; out through a side door onto the walkway, up the ladder to the bridge wing (the
dodger, the wing console) and in through the wing door to the wheelhouse (the console under the windows with the radar,
the engine levers and the VHF, the steering stand and its wheel, the master's chair, the chart table). Stair S from the
starboard lane the same way. The windows are glass now: you see out, and in from outside.

**In the game.** While aboard, the town's fixed colliders (the pier's bitts and fenders alongside) no longer stop the
player or the lens: only what moves with her (the cars on her deck) and her own solids.

**Checked.** `tests/ferry-walk.test.mjs`: up stair P to the lobby, through the corridor, the carpet room's steps, the
saloon, the side door, the walkway and the ladder to the wing and into the wheelhouse, and back down to the car deck,
with no jump in height over 0.16 m; from the lobby to the open deck and up a ladder to the platform; the walls hold
(the saloon's side, the toilets, the stair well, the wing's aft edge, the wheelhouse's front); every floor on the
surface the model draws (stairs within half a riser of their treads). `ferry-ship.test.mjs` (the general arrangement,
the open decks drawn with headroom, 33 meshes, about 33,000 triangles), `ferry`, `airport-ferry`. In the running game:
photographed at the stair door, on the stair, in the lobby, the carpet room, the saloon, on the walkway, in the
wheelhouse, on the wing, the open deck and the platform, and from outside; walked by the keyboard from the walkway up the
stair, across the lobby and through the carpet room into the saloon.

**Open.** The toilets, the crew's rooms (cabins, mess, galley), the emergency-generator and CO₂ rooms and the engine
room are behind closed doors; the compass deck (no ladder yet); the forecastle tops (vertical ladders: a climb); the
crew aboard; tapping to walk aboard. In small rooms the third-person lens comes in close behind him.

### Batch 6c: the engine room and the crew's spaces (2026-10-11)

The creator, 2026-10-11: *"Build the engine room, accommodation spaces etc, be a ship construction engineer in the 90's"*,
and *"The engine room needs focus too."*

**What a 1990s yard drawing office would have caught in the general arrangement, and changed.**
- *The engine room cannot start at z 5.* The hull's counter rises aft of z 10.5: at z 8 her bottom is already above the
  floor plates' level (0.9 m over the keel), at z 5 above the tank top. The engine room is z 8.5–14 (floor plates at
  0.9 m, 1.9 m clear under the car deck); aft of it a **shaft space** (z 5–8.5, over the counter, reached by a manhole)
  carries the shafts to the stern tubes. The fresh-water tanks (z 2.6–5) and the steering-gear room (z 0.3–2.6) sit on
  the counter (2.0 and 1.95 m over the keel), not below her bottom. (`ferry-ship.js` FERRY_GA.)
- *The generators* stand athwartships forward of the mains (the length forward of the engines is 2 m, not enough for
  them fore and aft), and *the control booth* moves aft to starboard (z 8.6–10.9), so the ladder's foot, the strip along
  each side and the cross passage forward are free to walk.
- *The crew's stair to the lobby* had no place a passenger would not walk into. The crew go up the open deck's ladders
  to the bridge deck's aft platform and in through **their own door** between the emergency-generator and CO₂ rooms.

**Built (ferry-interior.js; drawn and walked from the same list).**
- **Engine room:** in by casing P's door (z 6.6–7.4) and a 53° ladder down through a hatch cut in the car deck (the
  plating is open there, `ferry-model.js`), into the port aft corner. Two main engines (x ±1.55, six rocker covers, the
  turbocharger forward, the lagged exhaust led aft to the uptake, a gauge board), their gearboxes and local control
  stands aft, the shafts through the aft bulkhead in their seals; two generators athwartships forward (engine inboard,
  alternator outboard); the control booth (the main switchboard on the aft bulkhead, the engine panel and log desk, a
  chair, the telephone, a window to the engines); along starboard the two fire and general-service pumps, the bilge,
  sanitary and hydrophore pumps; the 1.6 m³ fuel service tank (gauge glass, quick-closing valve) in the forward corner;
  along port the air compressor and the two 150 L starting-air bottles against the aft bulkhead, the workbench and vice,
  the purifier, the oily-water separator, two lubricating-oil drums; the sea chests and their valves low forward; the
  fuel lines; the fire main's hydrant and extinguishers; CO₂ nozzles, lights and the coloured service pipes overhead
  (fuel brown, sea water green, fresh water blue, fire main red); sounding pipes; the escape ladder in the aft starboard
  corner; lining on her sides, chequer floor plates, the deckhead under the car deck.
- **Crew house (bridge deck):** the corridor from the crew's door to the wheelhouse (whose aft door now stands open);
  to port the crew cabin (two bunks), the deckhand's cabin, the mess (a table for six, benches, television, kettle, duty
  board), the chief engineer's cabin; to starboard the chief officer's cabin, the crew WC and shower, the galley
  (range and hood, sink, fridge-freezer, provision locker), the master's cabin (desk, bunk, safe); square ports in each.
- **Emergency-generator room** (the 40 kVA set, the emergency switchboard, batteries, day tank, louvres) and **CO₂ room**
  (four bottles in their rack, the release cabinet, the firemen's locker, the fan stops), open from the platform.
- **Toilets** in the passenger deckhouse open: men's (a WC cubicle, two urinals, a basin) and women's (two cubicles, a
  basin), tiled.
- **What you can look at** (`ferry-inspect.js`): 17 prompts with her real figures (the main engine, the gearbox, a
  generator, the main switchboard, the log, the pumps, the starting air, the service tank, the purifier, the emergency
  generator, the CO₂, the wheel, the radar and console, the chart table, the purser's window, the mess, the galley).
  A ship's prompt is offered only on the deck you stand on (`game.js`: no engine-room prompt through the car deck).

**Two things the walk found.** The sea's surface ran through the engine room at waist height (it is below her
waterline): the ocean is no longer drawn inside her parallel body (`ocean.js` `setOceanHole`, set by `ferry.js` each
frame from her pose). And the third-person lens was held 35 cm over the town's ground, which is 1.9 m above her
engine-room floor: aboard it follows her decks.

**Checked.** `ferry-walk.test.mjs`: down into the engine room by the door, the ladder and round the engines to the
control booth and back up, no jump over 0.16 m, no walking through an engine; the crew house from the platform: the
corridor, a cabin, the mess, the wheelhouse; the EG room; every floor on the surface the model draws (where nothing
stands on it). `ferry-ship.test.mjs` (the general arrangement, now with the shaft space; 33 meshes, about 39,000
triangles: the cap is raised to 60,000 for her interiors). In the running game: photographed in the engine room
(ladder foot, the aisle both ways, the port strip, the booth), the corridor, a cabin, the mess, the galley, the master's
cabin, the EG room and the men's toilet; the engine's prompt offered below and not from the car deck above; the wheel's
card read.

**Open.** The steering-gear room and the bow-thruster room (hatches, not yet walked); the shaft space; the compass
deck; the crew aboard at their posts; machinery that runs (the engines' sound and the switchboard as a live state).

### Batch 6d: realism, and a lens for her rooms (2026-10-12)

The creator, 2026-10-12: *"Make the ferry more realistic and improve the camera angle so it's easy to explore."*

**The lens in her rooms (`game.js`).** Aboard, with a deckhead over him within 2.0–2.45 m (`shipRoom`: the walk's own
camera solids), the third-person lens pivots at his chest (1.3 m, not 1.6), stands 2 m back at most (not 3.2), and
rises sooner and higher (from 2.1 m in, up to 0.5 m) to look down over him; the deckhead stops it. Nearer than
0.85 m (a wall at his back, a passage, the engine room's ladder foot) it becomes a **head camera**: he is hidden and
the view keeps his own pitch, instead of a screen full of the back of his head (the engine room, the mess and the
wheelhouse were that). Found and fixed on the way: in the engine room (1.9 m clear) a 1.82 m man's eye pivot stood in
the deckhead's margin, so the boom was 0 m and the view was his skull; the crew house and wheelhouse had no deckhead for
the lens (it rose out through the compass deck) and were never "a room". The audit page has `probe(x, y, z)` for the
lens's tests at a point.

**Realism (`ferry-model.js`, `ferry-interior.js`, `ferry.js`).**
- **Mooring lines.** Alongside at Minato she is tied up: four vinylon lines (`FERRY_MOORING`), the head line and the
  forward spring from the forward station on the port bow house out through a fairlead, the after spring and the stern
  line from the aft station through a fairlead at the bulwark, each to its own bitt on the pier (`MINATO_BERTH.bitts`:
  z −53, −62, −77, −87). Laid every frame from her pose, so they stay on her bitts as she heaves; gone the moment she
  casts off; none yet at Kitano-jima (no bitts there until 4c).
- **Window frames.** Every pane (51) in an anodised frame 5 cm wide, 1 cm proud of the plating: a window is a fitting,
  not a hole in a flat wall.
- **Her name boards** (みなと丸 · MINATO MARU, white with a teal border) on the wheelhouse front and both sides of the
  bridge house; **the ship's flag** (日の丸) on the stern staff.
- **Bulwark stiffeners**, a flat bar every 1.25 m inside the car deck's bulwark, as a plated bulwark has.
- **Grab rails** at 1.0 m along the deckhouse's and the lobby's outer sides, and down both sides of the crew's corridor.
- **Fire-hose boxes** (red, with their window) on the casings' faces by the car deck's hydrants.
- **Engine room:** hand rails on stanchions round each main engine, 0.4 m off the block, yellow (you hold them in a
  seaway and never step over them), and **cable trays** along the deckhead either side from the switchboard forward.

**Checked.** `ferry.test.mjs`: moored alongside at Minato with one line to each of the pier's bitts, each run leaving
her side and sloping down to the pier, none at sea and none at Kitano-jima; the ship's own tests (33 meshes, about
43,000 triangles; the stern flag inside her length). `ferry-walk`: the engines' rails stand where the walk already kept
clear. In the running game: the lobby, carpet room, saloon, corridor, mess, engine room (two views), wheelhouse and
car deck photographed with the new lens; from outside, the frames, the name board, the flag and the lines.

### Batch 6e: a new world when you step aboard (2026-10-12)

The creator, 2026-10-12: *"Audit the ship again, I want the ferry to be at least as detailed as the Sakura konbini but
bigger and when we are on the ship offload the city we should still be able to see it live as from the door of the
izakaya and Sakura but when we are on the ship we are basically on a new world even when it's moored or when it's
sailing during development Johansson can sail for free to the tropical island so implement it pls, add to the title
screen work in progress to signify the game is not 'ready'"*, and then: *"I think the entrance to the engine room
should be easier to find, I want to be able to explore the engine room now, and the bridge, make the interior more
realistic."* The audit against the konbini is section 7 below.

**Aboard is a place (`game.js`).** With a deck under him the HUD says **MINATO MARU** and where on her he is (the car
deck, the saloon, the engine room, the wheelhouse …), the way it says SAKURA at the konbini's door; the town stays live
outside her windows and doors (the town already streams by distance, so nothing is unloaded: she is the place, the town
the view from her, as the izakaya's door frames the street).

**Sailing for free, on foot (`island/play.js`, `island/services.js`, `ferry-walk.js`).** `FERRY_FARE` is 0 while the
game is in development: the purser's window and the ferry menu offer *Sail now* (*Board the local ferry* when she is
not alongside), one press, no ticket. A crossing started aboard is **afoot**: Johansson is not put in a car and the
cinematic camera is not taken; he stays where he stands (the open deck, the saloon, the engine room) and the ship
carries him (`advanceTown` snapshots his position in her frame before the island tick and the world update, and puts
him back in it after, turning him with her yaw). The ship's floors are open whenever she is visible, under way as
alongside; only the ramp and the gangway are open while she waits. The crossing takes 60 s afoot (the cars' crossing is
unchanged). At the far side he is on her deck alongside Kitano-jima, free to walk off down the ramp. The HUD follows:
*at sea*, then *alongside Kitano-jima*. Crossing back is the same from her deck there.

**The way down is found (`ferry-interior.js`, `ferry-model.js`, `ferry-inspect.js`).** The engine room's door on the
casing's car-deck face carries a lit **機関室 ENGINE ROOM** sign with a light hood over it, yellow-and-black hazard
stripes on the deck through the doorway, ear defenders on a hook inside and the green escape sign; a prompt at the door
(*Engine room: through the door and down the ladder*) says what is behind it, and one at the crew's door on the bridge
deck's aft platform (*Crew only*) says how the corridor leads to the wheelhouse and that the wings' ladders do too.
**CREW ONLY** and **WHEELHOUSE** decals mark the crew's door and both wing doors.

**Realism below and above.** Engine room: the mains have their gauge boards, maker's plates, red exhaust manifolds,
air filters, flywheel housings, oil fillers and injection-pump covers; the general alarm bell, the first-aid box and the
engine room's own sign. Wheelhouse: the magnetic-compass periscope down from the compass deck to the steering stand,
the radar's hood, the telegraph's lever box, the VHF handset on its cradle, the PA microphone, the echo sounder, the
navigation-lights panel with its lamps, the window sills with the binoculars and the log, the wipers, the clock and
barometer, the fire-detection panel and the muster list, the deckhead lights, the chart-table lamp, drawers and
instruments. Open deck: the benches are two a side with a 1.1 m aisle down the middle (they met in the middle before,
so the open deck could not be walked fore and aft).

**Title screen.** A **WORK IN PROGRESS** stamp under the title (`index.html`, `landing.css`), so no one takes the game
for finished.

**Found and fixed on the way.** The first carry took his place in her frame before his own walk and put it back
after, so aboard he could not walk at all (every step undone the same frame). It is now taken and put back twice,
round the two moves of hers only (the crossing in `islandPlay.tick`, the swell in `world.update`), never round his.

**Checked.** Tests: `airport-ferry`, `island-growth` and `ferry-walk` follow the free fare and the open floors (a
crossing under way keeps his place in her frame; 43 ferry tests). In the running game (`tools` harness): the title
stamp; *Sail now* from her deck, his position in her frame constant for the whole 66 s crossing while the HUD went
*at sea* → *alongside Kitano-jima*; the engine room's door and sign from the walkway and head on; the engines' detail
and the view aft from the forward end; the wheelhouse console and its aft bulkhead; the crew's door and its sign; the
open deck's aisle, walked.

## 7. Audit: the Minato Maru against the Sakura konbini (2026-10-12)

The creator's bar: *"at least as detailed as the Sakura konbini but bigger."* Measured honestly, by what each has:

| | Sakura konbini | Minato Maru (after 6e) |
|---|---|---|
| Fabric | one room, a backroom, a restroom; shelves, counter, windows, signage, surfaces with patina | 872 boxes, 215 rails, 51 windows, 44 floors over three decks: car deck, lobby, carpet room, saloon, open deck, corridor, cabins, mess, galley, engine room, wheelhouse, wings; the hull with its underwater body |
| Things to look at | every product with who it is for and why it is there (`commerce/merchandising.js`), the magazine rack, the specials board, flyers | 19 inspect prompts with her real numbers (engines, board, pumps, tanks, CO₂, radar, chart) |
| People | staff on shift with routines, customers who browse, queue, pay and leave; dialogue (`sakura-script.js`) | the crew exist as data (`people/ferry-crew.js`) but **nobody is aboard**: no master on the bridge, no chief below, no purser at the window |
| Life | opening hours, lights, the door's chime, cheer, the restroom used | she sails, moors and loads cars; **no engine sound, no whistle, no wake, no running engines to see** |
| Trade | buy anything on the shelves; the flyer | the kiosk and the purser's window sell nothing; the fare is free |
| Stories | the storyteller shoots in her rooms (backdrops) | **no backdrops captured** aboard yet |

So the ship is bigger and, as fabric, at least as detailed; what the konbini has and she lacks is **life**. In this
order, each its own batch (never with ground or lighting):

1. **Crew at their posts (people batch):** the master in the wheelhouse, the chief in the booth, the purser at her
   window, the bosun at the ramp, each with a look, a routine through the phases (waiting, loading, at sea) and a few
   lines; guide entries and portraits so the storyteller can cast them.
2. **Running engines:** the mains' sound and a turbocharger whine below when she is under way, the exhaust from the
   funnel, the whistle on casting off, the wake; gauges that read differently stopped and running.
3. **The kiosk and the purser sell:** canned coffee, the ferry's own senbei, the ticket as a keepsake, tied to the
   town's trade (Sakura supplies the kiosk).
4. **Backdrops aboard** for the storyteller (`tools/render-feed-backdrops.mjs`): the saloon, the open deck, the
   wheelhouse, the engine room.
5. **Still open from before:** the steering-gear and bow-thruster rooms, the compass deck walked, mooring bitts at
   Kitano-jima, tap-to-walk aboard, the linkspan at Minato.

### Batch 6f: the ways aboard widened, collision that holds, a smaller car deck (2026-10-12)

The creator, 2026-10-12: *"Collision onboard needs to be improved I don't want to clip through any ramp or door, the
entrance through the gangway, and stairways needs to be widened, car deck doesn't have to be so big, eat in to the
loading deck, and make it one or two lanes for the cars and trucks."*

**What is wrong today.** Johansson is 0.28 m in radius for the walk but about 0.6 m across to look at, so in a 0.9 m
door, on the 0.9 m gangway between its rails and on the 0.85 m stairs his shoulders pass through the jambs and the
rails. The raised ramp and the shut gangway gate are no solids: the floors end there, which stops his centre, not his
body, and at the bow he can stand half through the ramp. The car deck has two lanes of 3.1 m and ten places for a
town whose longest vehicle is 3.9 m; the walkway along the port lane narrows it and keeps the passage, the walkway
and the stair as three separate 0.9 m ways.

**The design (a small Japanese ferry of 1991 would be built so).**
- **The casings 1.3 m wide** (inner face at x ±2.75, not ±3.1): the car deck between them is 5.5 m, **two lanes of
  2.75 m** (a car is 1.62 m wide, an 8-tonne truck 2.5 m; two trucks side by side still fit, 0.25 m to the casings).
- **One way aboard, 1.4 m wide the whole way:** the gangway 1.4 m between its rails, the gate and the passage through
  casing P 1.4 m (shipyard z 13.3–14.7), and from the passage the casing is **hollow aft to the stair's foot** (a foyer,
  z 11.3–14.7): a foot passenger never steps onto the car deck. Stair P and stair S **1.2 m clear**, their doors onto
  the car deck 1.2 m (z 11.35–12.55). The engine room's door 1.1 m (z 6.3–7.4). The railed walkway along the port
  lane goes (its job is done inside the casing), so the port lane is full width.
- **Solids that follow her moving parts:** the raised ramp is a wall across the bow while it is up (and while it moves);
  the gate and the gangway door are a wall in her side while the gangway is in; the gate leaf and the gangway door
  hooked back are solids against the passage's walls while it is out (the passage keeps 1.2 m between them).
- **The car deck shortened** (6f-b): six places, three a lane, from z 11.3 to the bow houses; aft of the forward
  bulkhead at z 11.3 the car deck's level becomes the **lower lobby** (z 2.5–11.3, between the casings, 2.5 m deckhead),
  into which the passage, both stairs' feet, the engine room's door (easier to find: it faces the lobby under its sign)
  and the aft mooring station's door all open: the drivers' waiting corner with benches, the bicycle and baggage bay,
  a vending machine, the safety plan, and its two 1.2 m doors in the forward bulkhead onto the lanes.

**Impact list (what each touches, checked one by one).**
- `ferry-ship.js`: FERRY_SHIP.vehicles 10 → 6; the GA spaces car-deck, casing-p/s, walkway → foyer, a lower-lobby
  space; FERRY_CAR_PLACES (x ±1.375, three a lane from z 16.6); FERRY_TRUCK_PLAN (two trucks, two cars).
- `ferry-model.js`: GATE (−3.95 … −2.55), FERRY_CASINGS.inner 2.75, FERRY_DECKS.car (lanes ±1.375 of 2.75, walkway
  1.35, slots), the lane lines and sockets, the walkway's hatching and rail gone, the passage's inboard door gone, the
  gangway 1.4 m, FERRY_WALK's car-deck entries, the ENGINE ROOM decal at z 6.85.
- `ferry-interior.js`: CAS_IN 2.75, FERRY_STAIRS (x, door, wellFore), FERRY_ENGINE_ROOM.door/entrance, the gate
  passage, the foyer's deckhead, the lower lobby's bulkheads, doors, deckhead and fittings; `underStair`.
- `ferry-walk.js`: pseudo-parts `bow` (ramp up), `gate` (gangway in) and `shore` (gangway out) in `partOpen`; their
  solids; the gangway floor 1.4 m; the walkway rail and inboard door leaf gone.
- `ferry-inspect.js`: er-door at z 6.85. `town-traffic.js`: FIRST_PLACE follows the slots (the aft starboard place is
  now at z 16.6); the drive from the bow to it is shorter.
- Tests: `ferry-walk` (the route from the pier now pier → gangway → passage → foyer → stair; the engine-room route's
  start), `ferry-ship` (six places, two trucks and two cars, lanes against the casings, the foyer in the solids list),
  `ferry` (hull unchanged). Residents' routines: none walk the car deck. Films: `remotion/tools/impact.py` on the
  ferry's car deck shots (none photographed inside her yet).
- Looked at in the game after each half: the gangway, the passage and foyer, both stairs, the ramp up and down from the
  car deck and from the quay, the gate at sea and at Kitano-jima; the lanes with a car aboard.

**Built (two commits, 6f-a the widths and the walls, 6f-b the car deck and the lower lobby).** As designed above, with
three changes found in the building: the gangway door hinges on its forward jamb and hooks back along the passage's
forward wall (its aft side is now the foyer, so a leaf there would have closed the way); the gate leaf swings out and
lies against the bulwark's outside, forward of the gate (1.34 m of leaf does not fit inside a 1.3 m passage); and the
loading plan carries **one** 8-tonne truck on the centreline, not two side by side (in 2.75 m lanes they would stand
0.25 m apart). The lower lobby's crew door is on the centreline, the bicycle rack (two bicycles) to port of it and the
baggage shelf with the lifejacket lockers to starboard, so neither stands in the doorway. The forward bulkhead's fire
doors are 1.1 m sliding doors at x ±1.0, their leaves parked outboard on the lobby side (a hinged 1.2 m leaf has no
wall to hook back on between the door and the casing).

**Checked.** Tests: `ferry-ship` (six places, a truck and two cars, every place clear of the casings, the foyer and the
lower lobby, the lanes against the casings; every FERRY_WALK rectangle, the lower lobby and the foyer among them, has a
drawn floor under it), `ferry-walk` (pier → gangway → passage → foyer → stair door → lane; the engine-room route from
the lobby; stair P to the wheelhouse; the ramp down and back; under way), `ferry`, `airport-ferry`, `owned-vehicles`
(the traffic's car place). In the game, before the cherry-pick (a worktree of the branch served to the harness): walked
out along the gangway onto the pier and back in, aft through the foyer and up stair P, through the stair door onto the
lane, down the ramp onto the quay, through the starboard fire door from the lobby onto the lane, and aft through the
crew door to the mooring station; photographed the gangway from the pier, the passage and the foyer, the stair, the
lanes from the bow and from the lobby's bulkhead, the engine room's door, the lower lobby both ways and its bicycles.
Still open: the raised ramp's wall and the shut gate are proven by the walk's tests only (no photograph under way yet).

### The trip audited in the running game (2026-10-12, after 6f went live)

The creator: *"Audit the ferry trip."* Ridden in the headless game (the harness drives the same audit API as the MCP
server), with her headings taken from her own frame once she was under way (walks aimed by the world's compass proved
nothing while she turned):
- **Minato → Kitano-jima → Minato on foot.** Up the gangway from the pier (the HUD turns to MINATO MARU · ALONGSIDE ·
  MINATO OUTER PIER as he steps aboard), through the passage and the foyer, up stair P to the lobby; *Sail now* from the
  open deck; AT SEA · BOUND FOR KITANO-JIMA, the town falling astern; ALONGSIDE · KITANO-JIMA PIER after the crossing;
  down the ramp onto the pier (KITANO-JIMA AIRPORT · PASSENGER TERMINAL); back aboard, *Sail now*, BOUND FOR MINATO,
  alongside Minato again. His place in her frame held through both crossings.
- **Walls at sea.** Walking forward along the centreline he stops 0.68 m short of the stem at the raised ramp (local
  z 16.57 = half her length − 0.4 − his radius), photographed with the ramp filling the bow. Walking to port in the
  passage he stops at x 3.67 at the shut gate. Walking aft on the open deck he stops at the stern rail.
- **Looked at on the way:** the lower lobby at sea (the crew door open on the water), the wheelhouse at sea (the chart
  table, the fire panel), the open deck both ways.

**Found and fixed.** The head camera (less than 0.85 m behind him in her rooms) kept the lens where the boom had
stopped, pressed against the wall at his back; in the 1.3 m passage, the foyer and at the stairs' heads the near plane
cut that wall in half across the frame (a blank grey screen with the gate shut). The lens now moves to his eyes, a
hand's breadth back, and he is hidden; the cramped lift is skipped there. At the engine room's ladder foot the lens
backed in under the rungs and looked up through them: the ladder's volume is now a lens box. Checked again: the
passage facing the open gate (the pier and the sea through it), the passage looking aft (the stair), the stair head,
the shut gate at sea, the raised ramp close to.


## 8. Batch 6g: down to the engine room, ear defenders, no flashing, the crew's looks (2026-10-12)

The creator, 2026-10-12, from the phone: *"I want to be able to go down in the engine room and he should take on ear
protectors automatically when he goes down or anyone goes down"*; *"And I don't want flashing graphics like that"* (the
hazard stripes at the engine-room door flickering in a yellow-and-black hatch); *"Flashing in the accommodation too and
the oiler is cloned, why"*.

- **Down and up** (`ferry-inspect.js FERRY_LADDER`, `ferry.js`, `game.js ferryLadder`): the casing door's prompt is now
  *Go down to the engine room* and takes him through the veil to the floor plates at the ladder's foot; there, *Climb up
  to the car deck* brings him back out through the door. The ladder is still walkable, and across its whole width now
  (`er-ladder` floors: ±0.34 m, not ±0.12 m, which a thumb on a phone could not hit).
- **Ear defenders** (`avatars/ear-defenders.js`): a black band and two yellow cups built to each head's measurements and
  hung on the head bone. He puts them on whenever his feet are on an engine-room floor (`game.js updateEarDefenders`,
  floors `er-…`) and takes them off when he comes up; the note at the ladder says so. The crew wear them at every post
  below the car deck (`ferry-crew-aboard.js BELOW_DECK_PLACES`: the engine room and the steering gear), and their line
  says "nobody goes below without them". Open: the sound. Below, the engines should be loud and the defenders should
  muffle them (`townAudio`'s ferry channel); nothing is heard yet.
- **No flashing** (`ferry-model.js createKit.block`): paint thinner than 2 cm (the vinyl floor coverings laid 3–8 mm over
  the decks, the hazard stripes, painted signs) is drawn as its own class, `decal`, with a depth offset
  (`polygonOffset -1/-4`). The note at `game.js`'s camera says why: a phone cannot tell a few millimetres apart at a few
  metres, so two faces that close flicker between each other; an offset settles which is in front. The lower lobby and
  saloon floors were the "accommodation" flicker.
- **The oiler is not cloned** (`avatars/cast.js CREW_LOOKS`): the chief, the oiler and the deck hand had generated looks,
  and the generator gave the oiler and Ms Uezu the same spiky hair, polo and trousers (it did not know "Ms" is a woman:
  fixed too). They are drawn now: the chief grey and square-jawed in the navy boiler suit with reading glasses, Mr Higa
  Jr with a buzz cut and a red kerchief in the same boiler suit, Ms Uezu with a swept ponytail under a white cap, a work
  jacket and cropped trousers. Tests: `ferry-engine-room-access.test.mjs`.
- Checked in the headless game at 12:06 alongside: the door prompt, the descent (he lands on `er-ladder-foot`, ear
  defenders on, the chief below wearing his), the climb back (defenders off).

## 9. Audit: shipbuilder, game developer, marine engineer (2026-10-12)

The creator: *"Audit the ferry as a ship builder, game developer and a marine engineer, it lacks polish and doesn't feel
alive."* Evidence: the code (what her run animates, sounds and populates), eight photographs from the quay, aboard and at
night (`/tmp/claude-0/shots/f1…f8`, taken at 12:06 and 21:30 alongside), and a trace of her run from 08:20 to 10:00.

### 9.1 The one finding that explains "not alive"

**She never sails on her own.** `island/play.js` parks her at boot (`run.parkAt`, which sets `localService`), and in
that mode `ferry.js update()` does nothing but hold her alongside: the timetable (`HARBOUR_LINE`, `FERRY_TIMES`, the
whistle signals, the lights under way, the crew's arriving and crossing watches) only runs when the player buys a
crossing. Traced from 08:20 to 10:00 she stays `waiting/town` through the 08:30 service. So the harbour's clock has no
ship in it: nobody sees her come in, blow for the breakwater, swing in the basin, lower the ramp, load, and leave; the
crew never change watch; the lights never show her under way. Everything else below is polish; this is the life.

### 9.2 As a shipbuilder (the hull, the fit-out, the finish)

- **The finish is new-build paint with no sea on it.** No weathering at all (`ferry-model.js` has no rust streaks, no
  scuffed bulwark tops, no boot-top scum line, no grime under the scuppers, no fender marks on the hull where she lies
  port side to). A 1994 ship in 1997 has rust at every scupper and a dark line at the waterline.
- **The pier side is bare.** No fenders on the pier taking her weight (photo f2: a flat pier and a bollard), no rubbing
  marks, no tyre fenders on her side, no mooring-line chafe. The lines are drawn (`FERRY_MOORING`) but nothing between
  ship and pier.
- **Decks without their clutter**: the car deck has no lashing chains in use, no wheel chocks out, no oil stain under
  the lanes, no "no smoking" and "stay in your vehicle" stencils in Japanese, no deck numbers; the open deck's benches
  carry nobody and nothing (no bag, no bicycle lashed, no wet footprints).
- **Flags**: no ensign at the stern, no house flag, no courtesy signal, nothing that moves in the wind.
- **The hull is too full** (design book finding 1): block coefficient 0.71 against a stated 0.56. Her bow and stern are
  box-like in the water. D3 fairs her; the wake and bow wave below depend on it.

### 9.3 As a game developer (what moves, what sounds, who is there)

- **Nothing on the water moves with her**: no bow wave, no wash at the screws, no wake astern, no foam at the quay when
  she thrusts in (`ferry.js` has roll and pitch, turning screws and a sweeping radar, and that is all). A ship with no
  wake reads as a model on a table.
- **No exhaust.** Two diesels and two generators, and the funnels show nothing: no haze under way, no puff when she
  starts, no shimmer.
- **Nobody rides her.** The passenger saloon (photo f5), the carpet room, the open deck (f7) and the car deck (f4) are
  empty at noon alongside. The town's commuters are "away" (hidden) when they should be seen boarding and standing at
  the rail; the kei trucks and cars drive the roads but none wait in the lane or board.
- **The crew are statues**: five bodies at five posts (batch 7c) with one prompt each; nobody walks the deck, lashes a
  car, handles a line, climbs to the bridge. `FERRY_WATCH` names the actions; the bodies do not do them.
- **Sound is one loop**: an engine loop by phase and the whistle. No ramp hydraulics, no chain and windlass, no PA
  ("the ferry for Kitano-jima is now boarding"), no ticket-hall bell, no gulls, no slap of water on the hull alongside,
  no door-closing thunk, nothing below with the ear defenders on (open from batch 6g).
- **Night (photo f8)**: the saloon glows faintly; the pier and the ramp are unlit, no deck lights on the car deck, no
  floodlight over the gangway, no reflection of her lights in the water. Night alongside should be the prettiest
  picture in the harbour.
- **The crossing is a cut**: a player's crossing is a camera pose and 60 seconds (`AFOOT_SECONDS`), not a sailing you
  stand on deck for with the town going away behind you and the island coming up ahead.
- **Loading is a prompt**: the player buys a ticket at a window and is placed aboard; nobody walks up the gangway with a
  ticket torn by the oiler, nobody waits in the hall when she is late.

### 9.4 As a marine engineer (does she work like a ship)

- **The timetable and the watches exist as data and are not run** (9.1). `FERRY_SCENARIOS` (blackout, the net round
  the screw, the ramp hose) exist for stories and never happen to her.
- **The engine room is a diorama**: the engines never start (no vibration, no change of sound between idle and ahead),
  the control booth's board shows nothing live (the generators' kW, the shore-power lamp, the earth lamps), the
  tachometers do not turn, the bilge is dry and still. The chief stands and says one line.
- **Shore power is a text**: at night she is "on shore power" in the data; no cable from the quay kiosk to her side,
  no lamp, no generator stop at 22:15 you can hear.
- **Nothing is ever done to her**: no bunkering (the fuel lorry), no water from Mr Chinen's lorry every fifth morning
  (the data says so), no stores, no washing down the car deck, no ropes being coiled. Her day has no tasks.
- **Berthing has no physics you can see**: she arrives in the pose the timetable says. No thruster wash at the bow, no
  fenders compressing, no line thrown and made fast, no "all fast" moment.

### 9.5 What is right (keep)

Her general arrangement is coherent and walkable from the pier to the wheelhouse and down to the floor plates; the
head camera works in her passages; the lower lobby, foyer, stairs and doors hold collision; the crew have posts and
reasons; the lights follow the clock; her data would let a yard build her (design book D1). The bones are good. What
is missing is the ship in motion and the people around her.

### 9.6 The plan (in this order; each batch checked in the live game)

| Batch | What | Why first |
|---|---|---|
| **6h** | **She sails her timetable.** Island play no longer parks her: the run keeps the timetable and a player's crossing becomes one sailing of it (you board the next boat, or ask the purser to call her early if the design wants that). Away at the island berth between calls; whistle, lights, crew watches and the ramp follow. Commuters, the vehicles' crossings and the afoot ride are retimed to the sailings. Impact: `island/play.js`, `town-traffic.js`, `commuter-schedule.js`, tests `airport-ferry`, `ferry`, `bus-boarding`, `thuan-commute-yield`. | It is the life. Without it nothing below is ever seen happening. |
| 6i | **Wake, wash and exhaust**: bow wave and stern wake scaled to speed, thruster foam at the bow when berthing, prop wash astern when she backs off, funnel haze under way and a puff at the start. Water slap alongside. | The first thing a phone sees from the quay. |
| 6j | **People aboard and on the pier**: the commuters who take her (Thuan on Friday evening and Monday morning, Tetsuo's visits to his mother, Jun) walk the gangway with tickets, stand at the rail, sit in the saloon, and walk off; a few townsfolk ride for errands; the cars queue in the lane and are waved aboard by the deck hand; the hall fills before a sailing. | A ship is alive because of who is on her. |
| 6k | **The crew work**: between posts they walk (the deck hand from bow to car deck to gangway, the oiler to the capstan and down the ladder), lash a car, throw and make fast a line, blow the whistle from the wing; a watch change you can watch. | The data (`FERRY_WATCH`) already says what they do. |
| 6l | **Sound**: ramp hydraulics and the thud on the landing, windlass and chain, the PA before sailing, the gangway's rattle, doors, gulls, water on the hull, the engine room loud with the ear defenders muffling it, shore power's silence at night. | Half of "alive" is heard. |
| 6m | **Weathering and the pier**: rust at the scuppers and chain pipes, a scum line, fender marks, tyre fenders on the pier and her side, chafed lines, oil on the car deck, stencils; the ensign and house flag in the wind; night lights on the gangway, the car deck and the pier, reflected in the water. | The finish a shipbuilder would be ashamed of today. |
| 6n | **The engine room runs**: engines start at 06:10 (sound, vibration, tachometers), the board shows the generators and shore power, the bilge pump runs, the chief's rounds; the scenarios can happen (a blackout halfway across, the net round the screw) as stories. | A marine engineer's ship works. |
| D2–D3 | The weight estimate and the finer hull (design book). | The wake and the drawings depend on the real hull. |

## 10. Audit: the engine room and the bridge, as places to explore (2026-10-12)

The creator: *"Audit the ferry again and the engine room and the bridge, it needs to feel like we are exploring a real
ship … report back what needs to be added or have more details."* Method: the data (`FERRY_MACHINERY`, `FERRY_ELECTRICS`,
`FERRY_GA`), the interior as built (`ferry-interior.js`, 29 named parts below, 12 on the bridge deck), every prompt
aboard (20 in `ferry-inspect.js`), and 17 photographs at eye height (`/tmp/claude-0/shots/e1…e9, b1…b8`).

### 10.1 The engine room: what is there

Two main engines with gearboxes and turbochargers, two generators on beds, the main switchboard and the booth with its
desk and chair, the air compressor and bottles, the fuel purifier and service tank, pumps, the oily-water separator,
sea chests, the workbench, lube-oil drums, a hydrant, the escape ladder, hand rails round the engines, colour-coded
pipes along the sides, cable trays, the hatch and ladder. Twelve prompts, each a paragraph of true data (the switchboard
reads `FERRY_ELECTRICS`; the log reads the fuel figures). The arrangement is right and the data is right.

### 10.2 The engine room: why it does not feel real (the photographs)

- **Every machine is a plain box.** The main engines (e2, e3) are teal slabs with a white tube on top: no cylinder
  heads and rocker covers in a row of six, no fuel pumps and injector lines, no exhaust manifold in lagging under
  aluminium cladding, no turbocharger as a snail with its air filter, no flywheel housing, no coupling to the gearbox,
  no gauge board with its round dials, no local control stand with the tachometer, the start lever and the stop
  button, no nameplate with the maker's name and the serial. A visitor cannot tell the engine from the generator from
  a box.
- **The booth's switchboard is five grey squares** (e5, e7): no meters with needles, no synchroscope, no earth lamps,
  no breaker handles, no mimic lines, no labels (DG1, DG2, SHORE, 440 V), nothing lit. The desk has no log book, no
  telephone, no pen, no coffee cup, no chart of the day's temperatures.
- **The pipes fan out from a point** (e8, e5, e1): several colour-coded runs converge on one spot by the booth like
  spokes, because they are drawn as straight bars from source to destination. Real pipes run along bulkheads and
  under the deckhead in parallel with 90° bends, hangers, flanges and valves with handwheels. This is a glitch, not
  detail.
- **The floor is a flat colour.** Floor plates are chequer plate with raised edging and lifting rings; there are
  gratings over the bilge wells, sounding pipes with brass caps, drip trays under every pump, oil stains, a rag on the
  rail. None of it is there.
- **No light fittings and no shadow of them**: the room is lit from nowhere. A real engine room has caged fluorescent
  tubes under the deckhead, one over the booth desk, the emergency lamp with its red stripe, and a torch on a hook.
- **No small things a person works with**: fire extinguishers (CO₂ and foam) by the door, the fire blanket, the
  ear-defender hooks (batch 6g puts the defenders on you but there is no hook they came from), the telephone to the
  bridge with its sound-powered handset, the engine-room telegraph or its lamp, the oil cans, grease gun, spanner
  rack over the bench, the vice, the parts bins, the rags bin, the bilge alarm's red lamp, the escape-route arrows
  on the plates, the "No.1 MAIN ENGINE" stencils in Japanese and English.
- **Nothing happens.** No sound below (batch 6g's open item), no vibration, no heat shimmer at the exhaust, no
  needles moving, no running lamp on the generator, no bilge pump cycling, no chief on his rounds. At 22:00 (e9) it
  is a dark version of the same room: shore power, the generators stopped, the night lamp over the booth should read
  as a different room.

### 10.3 The engine room: what to add (batch 6o, "a working space")

1. **The engines as engines**: six rocker covers and the camshaft cover, the fuel pumps and injector lines, the
   manifold in silver lagging, the turbo and air filter, the coupling guard, the gauge board (lube-oil pressure,
   water temperature, exhaust temperature) with real dial faces, the local control stand, the maker's plate. Same
   for the two generators at smaller scale. Data for every number is already in `FERRY_MACHINERY`.
2. **Pipes routed like pipes**: along the sides and the deckhead in parallel, bends, hangers every 1.5 m, flanges,
   valves with handwheels painted by service, labels on the pipes (JIS colours: fuel red-brown, lube oil yellow, sea
   water green, fresh water blue, air white, fire main red, exhaust silver). The fan of cones goes.
3. **The switchboard as a board**: panels with meters (V, A, kW, Hz), the synchroscope, three earth lamps, breaker
   handles, labels, the shore-power lamp; read from `FERRY_ELECTRICS`, and **live**: which generator is on the board
   follows the condition (`FERRY_SUPPLY`), the kW meter follows `FERRY_LOADS`, the shore lamp lights at night.
4. **Floor and lighting**: chequer plate, edging, bilge gratings and wells, sounding pipes, drip trays, caged tubes
   (lit at day, the night lamp alone after 22:15), escape arrows, stencils.
5. **The watchkeeper's things**: extinguishers, the fire blanket, the ear-defender hooks (the ones you take), the
   telephone, the bench with its vice and spanner rack, drums, the rag bin, the log book and pen on the desk, a mug.
6. **It runs**: engine sound by state (stopped at shore power, idling alongside, ahead under way), vibration, needles
   that read the data, the running lamps, the bilge pump that cycles, the chief's rounds between the booth, the
   engines and the purifier; and the scenarios can happen (6n).

### 10.4 The bridge: what is there

The wheelhouse with five raked windows, the console, the steering stand, the magnetic compass, the radar under its
hood, two engine levers and the thruster lever, the clock and barometer, the chart table aft, the wing doors and the
wings with their consoles and dodgers; aft, the corridor with the crew's cabins, the mess, the galley, the emergency
generator and CO₂ rooms. Five prompts on this deck. The master stands at the wheel.

### 10.5 The bridge: why it does not feel real (the photographs)

- **The console is a grey slab with four blobs** (b2): no instrument faces, no telegraph levers you can read AHEAD
  and ASTERN on, no rudder-angle indicator, no tachometers for each engine, no clinometer, no nav-light switch
  panel with its lamps, no VHF with a handset on its hook, no PA microphone, no echo sounder's paper, no GPS plotter,
  no whistle button, no searchlight control, no window wiper switches. Nothing glows, by day or at night (b8).
- **The chart table is a prompt**, not a table: no chart under perspex with the course pencilled from Minato to
  Kitano-jima, no tide table, no log book, no dividers and parallel ruler, no desk lamp with a red filter for night.
- **The deckhead is a radial pattern** (b1, b3, b5): the cel pass's dots converge on the deckhead's centre and read as
  a sunburst in every room of the bridge deck. Glitch.
- **The windows are plain glass**: no frames with handles, no wipers' arcs, no clear-view screen, no sun visors, no
  handrail under the windows, no non-slip matting at the wheel, no pilot chair.
- **Nothing on the walls**: the ship's licence in its frame, the muster list, the safety plan, the passenger count
  slate, the fire-detection panel with its zone lamps, the bell, the binoculars on their hook, the ensign in its
  locker, the "操舵室 WHEELHOUSE" sign on the door, the no-entry sign on its outside.
- **The crew's rooms are empty boxes** (b6, b7): the mess has a table and nothing on it (no rice cooker, kettle,
  television, duty board, muster list, the kettle's tea); the master's cabin has a desk and a bunk and no bedding, no
  papers, no safe, no family photo, no uniform cap on the hook. The corridor has no doors with name plates, no fire
  extinguisher, no deck-plan frame.
- **Nothing happens**: the master is a statue; the radar does not sweep on its screen (the scanner outside does); no
  VHF chatter, no clock tick, no whistle you can sound from the wing, no wipers in the rain, no instruments following
  the ship (rudder angle, rpm, heading).

### 10.6 The bridge: what to add (batch 6p, "a working bridge")

1. **The console as instruments**: two telegraph levers with AHEAD / STOP / ASTERN faces, the thruster lever, two
   tachometers, the rudder-angle indicator, the clinometer, the nav-light panel with lamps, the VHF with handset and
   channel display, the PA microphone, the echo sounder, the GPS plotter, the whistle button, the wiper switches; and
   **live**: rpm, rudder angle, heading and the radar screen's sweep follow her run; the nav-light lamps follow
   `setNavigationLights`; everything lit red at night.
2. **The chart table as a table**: the chart with the course, the tide table, the log book open at today, dividers,
   parallel ruler, pencil, the red lamp.
3. **Windows and handrails**: frames, wipers that run in the rain, a clear-view screen, the handrail, the matting, the
   pilot chair, sun visors.
4. **The walls**: the licence, the muster list, the safety plan, the fire panel with zone lamps, the bell, the
   binoculars, the passenger count slate, the door sign, the no-entry sign.
5. **The crew's rooms**: the mess dressed (rice cooker, kettle, television on a bracket, the duty board, cups, the
   newspaper), the galley's range and pots, the cabins with bedding, lockers with names, a photo, a cap, the
   corridor's name plates and extinguisher, the CO₂ room's release cabinet labelled.
6. **It works**: the master's hands on the wheel under way and on the wing throttles berthing, the whistle you can
   sound from the wing (through `ferry.js`'s signals), VHF calls at the breakwater, the bell at the change of watch.
7. **Fix the deckhead sunburst** (the cel pass on flat deckheads: a pattern, not shading).

### 10.7 Order

6h (she sails) stays first, because the instruments and the engines are only alive when she moves. Then **6o** and
**6p** before the wake and the people (6i, 6j): the creator wants to explore her, and these two rooms are where the
exploring is. The crew's rooms (10.6 item 5) can ride with 6p.

### 10.8 Batch 6o-1, built: the machines as Johansson Marine machines (2026-10-12)

The creator: *"I want them to look like real machines similar to Volvo but brand every engineering part as a Johansson
brand."* Built:

- **The brand** (`world/johansson-marine.js`, and the rule in CLAUDE.md): Johansson Marine (ヨハンソン舶用機械),
  Johansson Marine Works, Naha, 1961; the livery (the green block, black covers, silver lagging, the aluminium plate,
  the works' blue for alternators); a catalogue of every machine aboard with a model number (JM6-160 mains, JR-30
  gears, JG-125 sets, JG-40E emergency set, JT-75 thruster, JS-22 steering gear, JE-440 switchboard, JC-30 compressor,
  JF-1 purifier, JP-40 and JP-25 pumps, JO-15 separator, JW-75 windlass, JW-55 capstan, JH-55 ramp pack, JN-1800
  radar, JN-25 VHF, JN-AP2 autopilot), every spec read from the ship's own data so the catalogue can never contradict
  it; `makerPlate(key)` gives the lines of a plate with a works number.
- **The main engines, built like engines** (`ferry-interior.js`): bedplate, sump and crankcase with six crankcase
  doors, the block in the green, six heads under six black rocker covers with the oil filler, the fuel rail and
  injection-pump block with a line to each head and two fuel filters, the exhaust manifold in silver lagging with a
  branch from each head to the turbocharger forward (turbine, compressor, the air-filter drum, the charge-air
  cooler) and the exhaust up to the casing, cooling-water and sea-water pumps and two lube-oil filters on the forward
  end, the flywheel housing and coupling guard aft, the JR-30 gearbox with its round cover and output flange, the
  gauge board with three gauges on its stand, the local control stand with tachometer, stop button and start lever;
  the maker's plate on the block and the JOHANSSON wordmark along the covers. 78 cylinders and 6 textured plates,
  drawn by the model (`cyls`, `plates` in `FERRY_INTERIOR`; `plateMesh` in `ferry-model.js`).
- **The generator sets**: four-cylinder engines with heads, covers, manifold and a small turbo, the alternator in the
  works' blue with cooling ribs and terminal box, on a common bed, each with its plate.
- The prompts name the models. Test: `ferry-johansson-marine.test.mjs`. Photographed from the aisle, the aft end, the
  turbo end and the generators (`/tmp/claude-0/shots/m1…m7`).
- Open after 6o-1: the switchboard as a board, the pumps, purifier, compressor and separator as machines, pipes routed
  like pipes, chequer plate, caged lights, the watchkeeper's things, sound and vibration by state (6o-2 below).

### 10.9 6o-2 built: the engine room from the creator's photographs

The creator sent sixteen photographs of real engine rooms (2026-10-12: "Here are some engine room photos can you use
them to enhance the engine room? As inspiration? Model what we need in code or blender"): Volvo Penta mains with
black valve covers and a silver badge on green blocks, chequer-plate floors, exhausts in quilted silver lagging held
by stainless bands, gauge boards of round dials, gensets with louvred alternators, shutdown/reset boxes and start
panels on the engines, braided hoses, filters with the change date written on them, a row of sensor boxes along a
block, cable trays, a compressor, a burner, a MAN gauge panel. Everything is modelled in code, in the town's own
procedural style (`ferry-interior.js`, drawn by `ferry-model.js`); nothing needed Blender.

What each photograph gave, and where it now is:
- **Round dials** (the gauge boards, the gensets' panels, the MAN panel): `plateMesh` draws a `dial` kind, a round
  gauge with a bezel, ticks, a red zone, a needle at a value 0–1 and its label; `dial()` in the interior places one.
  Each main engine's gauge board carries six (lube-oil pressure, water, fuel, exhaust, charge air, lube-oil
  temperature) and the tachometer on the stand is a dial face-up; each genset's panel an rpm dial with start and
  stop; the booth desk's panel the two shaft rpm dials and eight engine-alarm lamps with their legend.
- **The main switchboard** (JE-440) is a board: five panels under a name strip (GENERATOR No.1, SYNCHRONISING,
  GENERATOR No.2, 440 V FEEDERS, 105 V LIGHTING). A generator panel has kW, A, V and Hz meters, the breaker in its
  frame with the handle up when closed, closed and open lamps, governor and ammeter switches with labels; the
  synchronising panel the synchroscope (SLOW · FAST), bus and incoming voltmeters, three synchronising lamps, the
  selector switch and the board's maker's plate; the feeder panel three earth lamps (IT system: all alight when
  nothing is earthed), the insulation meter in MΩ with the test switch, and eight labelled breakers (steering, fire
  pumps, thruster, ramp pack, galley, windlass, ER pumps); the lighting panel its V and A, the 440/105 V transformer
  label, eight breakers and the shore-connected lamp. In port No.1 carries the ship (its meters read), No.2 stands
  at zero.
- **Black valve covers with the badge**: cast ribs along each cover, and a silver JOHANSSON badge on the inboard
  face of No.3's cover; the wordmark stays along the outboard side.
- **Quilted lagging with bands**: stainless bands every 0.36 m along each exhaust manifold and every 0.5 m along the
  uptake, with a band at the elbow.
- **Shutdown/reset box** on each block's inboard face aft (the red mushroom, the reset button, the amber alarm lamp,
  the label) and the **start panel** on the local stand (green start, key switch, hour meter, LOCAL CONTROL label).
- **Dated filters**: each fuel filter reads FUEL FILTER · CHG 12 MAR 94, each lube-oil filter LO FILTER · CHG 8 FEB
  94, and **braided hoses** run from the filters to the pump block.
- **The sensor row**: a sensor box on each head along the block's top inboard edge, cabled together.
- **Louvred alternators**: an end bell outboard with five louvre slats.
- **Chequer plate**: the floor is a repeating chequer texture (raised diamonds, a seam every 0.6 m) everywhere but
  the booth, which keeps its own floor.
- **Caged bulkhead lamps**: three a side, a lamp in a wire cage over the machines.
- **The pumps are machines**: six on a drip tray, each a coloured pump casing (red fire, green general service,
  blue bilge, sanitary and hydrophore), the yellow coupling guard, a motor in the works' blue with its terminal box,
  the delivery rising with a flange to join its overhead run (the fire pumps the fire main, the hydrophore the fresh
  water, the rest the sea-water run), a maker's plate and a label. The catalogue gained JP-32 (general service),
  JP-15 (sanitary) and JQ-2 (hydrophore).
- **Compressor, purifier, separator as machines**: the JC-30 a two-stage V compressor on its motor with the flywheel,
  its air gauge and delivery lines to the bottles (each bottle with its gauge and STARTING AIR label); the JF-1 its
  frame, bowl, hood and motor with a bowl-rpm dial; the JO-15 a vessel on legs with its sight glass and the 15 ppm
  bilge monitor. Each with its plate. The compressor moved outboard (x 2.7–3.1): it had stood inside the port
  engine's local control stand.
- **Pipes routed like pipes**: the fuel line runs from the service tank's quick-closing valve up to the deckhead,
  across at z 13.6, and to each engine drops by the turbo end inboard through a valve with a red handwheel to a run
  along the block's inboard edge; the diagonal bars (the fan of cones) are gone. The overhead runs along her sides
  carry hangers from the deckhead every 1.2 m and flange pairs.
- **The watchkeeper's things**: the engine-room log open on the desk, a pen, a coffee mug.
- Test (`ferry-johansson-marine.test.mjs`): 14 maker's plates, the badges, 24+ dials reading 0–1, the chequer floor,
  the dated filters, and every new part by name. 218 cylinders and 112 plates. Photographed with the audit's free
  camera (`/tmp/claude-0/shots/p1…p12`, `q1…q6`, `r1`).
- Open: sound and vibration by state (the engines are silent in port and at sea alike); the plate on the block still
  sits low; a cable tray from the switchboard to the panels; the compressor's bottles' relief lines.

### 10.10 6o-3 built: the second photo set, the action button, the yard's drawings, the safety plan

The creator's second set (2026-10-12: "Upper grating", "Sea water filter, control panel, cams etc"): a big engine
room's open grating walkway between the engines over the red bilge, a sea-water strainer full of mussels with its
basket, a reduction gear opened, a clutch pack on a pallet, a camshaft seen through an open crankcase door, an engine
control room's mint-green console, a wiped bearing. Built in code:
- **Gratings over the bilge** (`floorPlate('grating', …)`): the aisle between the rails and the strips inside each
  engine's rails, the bilge red under the bars.
- **The sea chests and strainers**: the chests are under the floor plates against her sides (a hatch over each);
  both strainers stand in the port forward corner, the starboard chest's suction crossing under the plates, each a
  housing with a bolted cover on eight studs, the suction valve's handwheel, the drain cock and a label, with the
  Monday-morning basket in the prompt. They had stood inside the fuel tank and the separator, and then in the
  walkway along the forward bulkhead (`ferry-walk.test.mjs` walks it); a test now proves no two solid things of the
  engine room overlap. The 200 L lubricating-oil drums are stowed in casing P's store, out of the walkway.
- **The control console**: the booth desk is a mint-green console with a raised panel of six dials (shaft rpm port
  and starboard, lube-oil pressures, water temperatures), a 4 × 8 alarm matrix with FUEL LEVEL lit amber, two
  telegraph levers at STOP, the telephone, the grab rail, the log, the pen, the mug, the clock and the safety plan
  over it.
- **No.4 crankcase door off the starboard engine**: the red inside, the camshaft and a lobe, the crank web; the
  door on a rag on the plates with its six bolts; a prompt tells why (the second engineer looked at the cams).
- **A spare JR-30 clutch pack** on a pallet under the bench's aft end, tagged, with its story (the port gear
  chattered in April); the oil drums side by side against the forward bulkhead (they stood inside the separator).
- **The action button** (the creator: "The green action button doesn't make sense it seems buggy"): aboard, the
  prompts were offered 3.1 m away whatever you faced, there was no prompt for the starboard engine or gearbox or
  No.1 generator (so facing them offered "No.2 generator" or the port engine), and the labels were cut on the phone's
  round button ("Look at No.2···"). Now every ferry prompt has a reach (2.2 m, 1.6 m for small things) and wants to be
  faced (`userData.reach`, `userData.facing`, game.js interaction), there are prompts for the starboard engine and
  gearbox, No.1 generator, the open crankcase, the strainer, the compressor and the spare clutch pack, and every
  label is short enough for the button (the eye icon already says "look"). Probed at ten points and four headings
  (`/tmp/claude-0/probe-prompts.mjs`).
- **The yard's drawings** (the creator: "give me a schematic over what the engine room looks like a construction
  drawing, from Johansson Shipyard"; "The drawings don't look real and text overflowing"): sheet 5, the engine room
  arrangement (plan at the floor plates on the frame grid, centreline elevation, hatched section through the mains,
  dimensions, equipment list), and every sheet reframed as a yard drawing with a zoned border, a title-block grid and
  notes that wrap; labels shrink to their rooms. `docs/minato-maru/README.md` D9, D9a; the builder is Johansson
  Shipyard, Innoshima, hull No. 127 (CLAUDE.md: Johansson is this universe's Acme).
- **The safety plan** (the creator: "There needs to be a safety plan posted as well, on the vessel"): drawn from
  the ship's data by `src/world/ferry-safety-plan.js` with a pen that writes to a canvas aboard and to SVG in the
  book (sheet 6); posted in the lower lobby over the drink machine and in the control booth, each marked YOU ARE
  HERE. Open: posting it in the saloon and the crew corridor too (the walls there are drawn by other code).
- The hull's triangle budget rose from 60 000 to 66 000 for the machines (`ferry-ship.test.mjs`).
- Open from the photographs: the gearbox opened for inspection (the gears), the bilge trough, the sludge tank's
  sight glass, the wiped bearing as a spare on the bench.

### 10.11 6q-1 built: several levels and many rooms, the first batch (2026-10-13)

The creator, 2026-10-13: *"The engine room should be several levels and have many rooms."* As a naval architect reads
it for a 34.5 m, 199-ton ferry with 2.1 m under her car deck: not a tall engine room with platforms (she has no height
for one; a D16-class high-speed diesel wants none), but **machinery spaces on every level the hull has, each a room with
a door**, in the order a yard arranges them. The design (README finding 5, sheet 7 `machinery-spaces.svg`):

| Level (above base) | What is there |
|---|---|
| 0.7 m, the tank top | The double bottom (fuel, lube oil, bilge holding and sludge under the engine room; ballast P and S under the aux room), the bilge wells under the gratings: 6q-3 |
| 0.9 m, the floor plates | **Engine room** (Fr 17–28) with the **control booth** → the **watertight sliding door** at Fr 28 → **auxiliary machinery room** (Fr 28–38) → the door at Fr 38 → **workshop** (port) and **engine store** (starboard, behind a mesh partition), Fr 38–45; the shaft space and steering-gear room aft at 2.0 m are crawl spaces |
| 3.0 m, the car deck | The engine-room entrance and ladder in casing P; the two escape trunks' hatches in casing S (z 6–7 and 18.4–19) |
| 5.5 m, the fan flat | Over the lower lobby, under the passenger deck: the engine-room fans and their trunks down the casings, a ladder from the casing P landing, a hatch to the open deck: 6q-2 |

Built in this batch (`ferry-ship.js` FERRY_GA: `aux-room`, `workshop`, `engine-store`, `fwd-double-bottom`, `void`;
`ferry-interior.js` FERRY_MACHINERY_SPACES and the rooms; `ferry-inspect.js` ten prompts; `ferry-safety-plan.js` the
extinguishers, the escape and the watertight-door symbol; `tools/ferry-drawings.mjs` sheet 7):
- **The watertight door at Fr 28** on the centreline between the generators (the extinguisher that stood there moved
  beside the tool board): 0.8 × 1.9 m, the full height under the deckhead (the first cut, 0.75 × 1.75, the yard's usual size, stopped the game's 1.82 m people at its lintel: `ferry-walk.test.mjs` now walks through it), the leaf slid open to port in its frame with its stiffeners, the hand pump and
  lever beside it, the notice KEEP CLOSED AT SEA. A prompt tells why it is open alongside.
- **The auxiliary machinery room** (z 14–19): the ballast and bilge manifold on the starboard side (six valves with red
  handwheels on a header, labelled BALLAST P · BALLAST S · AFT PEAK · BILGE ER · BILGE AUX · OVERBOARD, the lines down to
  the tanks), the ballast pump (Johansson Marine JP-32 No. 2), two sounding caps on the plates; the sewage holding tank
  (4 m³, the rule's "nothing into the strait") to port with its manhole, sight glass, vent and discharge pump (JP-15 No. 2);
  the escape trunk in the forward starboard corner, a ladder in its own trunk with the hatch above; caged lamps, detector
  heads, the pipe runs and the ballast line overhead, the cable tray.
- **The workshop** (port, z 19–22.5): the bench along the forward bulkhead with its vice, the bench grinder, a toolbox,
  and the wiped No.3 main-bearing shell kept for the surveyor (open since 6o-3); the JL-400 centre lathe along her side
  (cabinets, bed, headstock and chuck, tailstock, carriage, leadscrew, chip tray), the JD-13 pedestal drill by the door,
  the JW-250 welding set, the tool board, a stool; the frames showing on the shell. Johansson Machine Tools and Johansson
  Welding are two more Johansson companies (CLAUDE.md: Johansson is this universe's Acme).
- **The engine store** (starboard, behind the mesh partition with its opening by the door): the spares rack with eight
  labelled boxes, the two 200 L lubricating-oil drums on their rack over the drip tray with taps (out of casing P's
  store, which was a stand-in), the oily-rag bin, the chain block on the deckhead.
- **Walking**: the floors `aux-room` and `workshop` reach back through each doorway so a door is never a gap; both
  count as below decks (ear defenders). The engine-room floor reaches through the watertight door.
- **The data**: the ballast tanks move from "tanks" into `fwd-double-bottom` (Fr 28–38, under the valves that work them);
  the sewage tank is a built tank in the aux room; the sewage pump and the workshop's machines are where they stand in
  the load analysis; a ballast pump (3.7 kW) is added, run between boats and so in no condition's total; the engine room
  carries four portable extinguishers below now, not two.
- **Tests**: the GA (every new space inside the hull, none overlapping, ways out), 16 maker's plates, the triangle
  budget raised 66 000 → 70 000 for three rooms, the floors drawn where they lie, every sheet regenerated (sheet 7 new,
  every title block now n / 7).
- **Open**: 6q-2 the fan flat; 6q-3 the bilge level; the CO₂ system covers the engine room only (the aux room, the
  workshop and the store rely on extinguishers and detection; a yard would ask whether to extend it, and the answer
  for a 1994 199-ton ferry is no: a watertight door between them, and the rule's portable appliances); the oiler's
  rounds and the chief's day could pass through the new rooms (ferry-crew.js); the steering-gear room and the shaft
  space stay crawl spaces reached by their hatch and manhole.

### 10.12 D10, D15 and KKS: the piping and electrical drawings, tagged (2026-10-13)

The creator, 2026-10-13: *"Make a piping diagram too, so all pipes are correct, and redundant motors so you can
alternate"*; *"And electrical drawings for the ship; when the electrical drawings are correct, we can proceed to draw a
house and make it correct, with proper cabling and piping"*; *"Use correct KKS codes for the drawings"*.
- **KKS** (`src/world/ferry-kks.js`, README § Tags): the VGB structure and counting rules (from the one open text of
  them, Eskom's 240-93576498), the ship as plant 1 and the shore as plant 0, F0 for the identical engines, the
  function keys with their source marked (published key tables, or the yard's reading of the key part's lettering,
  each with its reason), the equipment and component keys, the cable numbering. `kks()` refuses an unknown key or a
  number outside its rule; `kksExplain()` reads a tag out as the crew would.
- **Piping** (`src/world/ferry-piping.js`, sheets 8.1–8.11): eleven systems as data (nodes with kind, tag, space and
  grid place; lines with bores), drawn as ISO 10628 diagrams by `tools/ferry-drawings.mjs pipingSheet` (symbols,
  orthogonal runs in the system's colour, DN labels, the tag over and the name under every node, a reading of the
  tags, the duty/standby table). Redundancy as the rules want it, `FERRY_SERVICES`: fourteen services with two
  means; the ship gains compressor No.2, fuel transfer pumps No.1 and No.2, hydrophore No.2, sanitary No.2 and sewage
  No.2 (in the load analysis at zero draw: they alternate with No.1), the general-service pump stands by for either
  main engine's cooling and for the ballast, the fire and bilge pump for the bilge, the emergency fire pump outside the
  engine room, the hand pumps third for steering and the ramp.
- **Electrical** (`src/world/ferry-electrical.js`, sheets 3, 3b, 3c): boards, sources and every feeder derived from
  the load analysis by IEC 60092 as a small yard applied it: FLA from kW, η and cos φ; DOL to 7.5 kW and star-delta
  above; the breaker the next standard rating over 1.25 × FLA; marine EPR cable by rating at 45 °C and by voltage drop
  (≤ 5 %) over the route (manhattan between the spaces' centres, 4 m a deck, 15 % slack); the route in words; the
  KKS cable number. `electricalChecks()` is empty and tested: every cable carries its breaker, every drop under 6 %,
  the thruster on 95 mm² and a 200 A star-delta, the generators' 200 AF breakers over their 162 A.
- **Tests** `tests/ferry-kks-piping-electrical.test.mjs`: the tag rules; eleven systems with unique tags, every node in
  a space, every line between nodes, every valve numbered by its kind, every pumped service with a standby, every
  motor on the diagrams a consumer in the load analysis; every consumer a feeder with a standard breaker, a cable that
  carries it, unique tags and cable numbers.
- **Open**: the standby machines in the model (6q-2: compressor No.2 beside No.1, the transfer pumps under the tool
  board, the No.2 pumps along the aux room's port side) with KKS tag plates on every machine; the engine room's pipe
  runs generated from `FERRY_PIPING` rather than painted; control cabling, starter schematics and lighting circuits;
  then the house, with the same data-first method (its own piping and cabling modules, drawn by the same tools).

### 10.13 6r-1 built: the pipes from the diagrams (2026-10-13)

The creator, 2026-10-13: *"So audit the engine room are pipes connected to they lead to systems? Can you stop the
engines and overhaul them? Turn off help systems?"*, then *"So proceed"*. The audit's answer was no on all three
(37 hand-painted runs, none from data; no machinery state). 6r-1 answers the first:
- **Anchors** (`ferry-interior.js`, `FERRY_INTERIOR.anchors`): 151 points where a pipe meets a thing, keyed as the
  diagrams' nodes (`system/node`): the pumps' delivery tops and low suctions, the engines' and generators' own
  connections, the strainers and the sea chests' hatches, the crossover's valve chest, the overboard valves, the tanks'
  stubs on the plates (a flanged fitting; the pipe drops through the plates), the penetrations where a line leaves the
  space (a flange on the deckhead, bulkhead or lining: the fire main's riser up casing S, the fresh water to the galley,
  the sewage from the toilets, the aft peak and fore peak, the shaft space and steering-gear bilges), the new
  hydrophore pressure tank and the engines' priming pumps.
- **The router** (`ferry-pipe-routes.js`): overhead lanes by system along both sides under the deckhead (fuel, sea
  water, fresh water, fire main, air, sewage), low lanes under the floor plates (bilge and ballast, lubricating oil),
  cross-ship runs along the forward bulkhead of the room (never the aft one, where the switchboard stands), a machine's
  own circuit routed straight round the machine (both orders tried against the solids). 172 routes, every segment
  axis-aligned, shared segments drawn once, bends at the corners, radius from the bore.
- **Removed**: the painted mains, pump branches, fuel drops, service-tank line, compressor lines, strainer suction and
  the aux room's mains. The service tank is 1.55 m high and 0.75 m wide now (1.6 m³ still) so the lanes clear it.
- **Reviewed** by a separate reviewer before publishing: it found the suctions run straight across the walkways, the
  cross-ship runs stacked on one line and through the aux room's bulkhead, and overlapping bars. Fixed: a run with both
  ends low (a sea chest, a tank stub, a pump's suction, a bilge well) goes under the plates on its system's low lane; a
  cross-ship run follows the forward bulkhead of the compartment both ends stand in, each lane 11 cm aft of the last;
  collinear spans are merged (874 bars); a ring is drawn at each bulkhead penetration and a stem with a handwheel on each
  overboard.
- **Tests** `tests/ferry-pipes.test.mjs`: every machinery-space node anchored; every line between anchors routed from
  anchor to anchor; no run through a machine (found five and fixed them); no run in a walkway between 5 cm and 1.75 m
  over the plates; no run along inside a bulkhead; the lanes distinct; the budget raised to 100 000 triangles
  (95 442 now) with the reason.
- **Sheets** 5 and 7 draw the runs on the plan in their colours.
- **The plant's state** (6r-2's core, `src/world/ferry-plant.js`, tested by `tests/ferry-plant.test.mjs`): a pure model
  of every engine and motor-driven machine of the diagrams with the duty/standby pairs, a chief's interlocks (air,
  priming, fuel, cooling, the board, the thruster's two generators, the shore connection), the blackout and the
  emergency generator, change-over, isolate → open → close for an overhaul, the crew's routine by FERRY_DAY and time
  passing (air bottles, hydrophore, warm-up, the service tank). Not yet wired into the game.
- **Open** (6r-2, 6r-3): the console, prompts, sound and routine reading the plant; the lines to other decks drawn on
  those decks; valves drawn on every valve node (the hand valves at the tank stubs and overboards are; the isolating
  valves either side of each pump are not yet).

### 10.14 6r-2 built: the plant runs, and the player works it (2026-10-13)

The creator, 2026-10-13: *"Can you stop the engines and overhaul them? Turn off help systems?"* Now yes:
- **One plant** (`src/world/ferry-plant.js`, pure) drives everything: `ferry.js` creates it, runs the crew's routine every
  town minute (FERRY_DAY: shore power until 6:10, No.1 generator on the board, the engines for the first boat at 6:25,
  shore power again after the last at 22:15), lets time pass (air bottles, the hydrophore's pressure tank, warm-up, the
  service tank by the telegraph's order, which follows her phase: STOP alongside, SLOW ASTERN off the berth, SLOW AHEAD
  on the swing, HALF then FULL AHEAD out), and tells the sound what she is doing (`town-audio.js` ENGINE: off, the
  generators' hum, idle, manoeuvring, at sea, the emergency generator alone).
- **The console reads it** (`ferry-interior.js` plates with a `live` key, `ferry-model.js` redraws them, 35 plates): the
  shaft rpm, oil pressures and water temperatures on the panel, the engines' own gauge boards, the generator panels'
  kW · A · V · Hz, the air gauges, and the alarm matrix, now one plate of 4 × 8 lamps lit from `readings().alarms`
  (PLANT_ALARMS) instead of 32 painted squares with one fixed amber.
- **Stations** (`src/world/ferry-plant-controls.js`, 18): the local control stand at each main engine's forward end (the
  engine and its priming pump), each generator's panel on the switchboard (start, stop, the breaker), each pump and
  compressor at its box (the row in the engine room, the aux room's pumps and compressor No.2, the ballast pump) and the
  console (the readings, the alarms, change-over of every duty/standby pair). The prompt reads the machine's state; the
  menu offers only what it can do now (stop · start · standby · isolate and tag out · open for overhaul · box up ·
  return to service; a generator's breaker), each button naming its machine, and every refusal is the chief's reason
  ("She is under way: bring the telegraph to STOP first", "Prime the lubricating oil first", "Starting air is down to
  17 bar"). The old console note is gone: its words were fixed, the console is live.
- **Checked** in the headless game: the console photographed before and after stopping the port engine (its rpm and
  oil-pressure needles at zero after), the stand's prompt and menu, the alarm matrix with lamps lit. Tests:
  `tests/ferry-plant-game.test.mjs` (the routine by the clock and the sound, every station on a floor with its machines
  and prompt, the menus by state, every live plate reading the plant and redrawn when it changes).
- **The crew's hands** on it as well: at first load the day so far is replayed from midnight in five-minute steps, so
  the engines are warm with their hours on the counter when the player comes aboard at two (not just started); the
  watch pumps the aft bilge well before its float alarm (0.4) and stops the pump when it sucks air; No.2 generator goes
  on the board for the thruster as she comes in past the breakwater and for the departure, and off again once the
  thruster is done (FERRY_WATCH's own words), unless the player has it in hand.
- **Moved, with its effects listed first** (CLAUDE.md: plan before moving anything): the chief stood in the booth door
  in front of the switchboard, where "Talk to" (people before things, game.js) took every prompt within 0.6 m, so the
  generator panels could not be worked. He stands at the console's forward end now, facing the panel
  (`people/ferry-crew-aboard.js` CREW_POSTS); the booth floor's strip in front of the switchboard runs to the lining (the
  desk is forward of it); the switchboard's note moved to the lighting panel (x −2.65). Checked: the crew posts test, the
  walk tests, the headless prompts at both panels (p8) and the chief at the console (p9); no film shot stages the booth
  (`jojo/remotion/episodes`).
- **Readable** (the creator, on the first console photograph: "It needs to be easier to read and more detailed"): every
  live dial has a numbered scale from its range (0–6 bar, 0–100 °C, 0–10 ×100 rpm, 0–30 bar air, the generators'
  0–150 kW · 0–250 A · 0–500 V · 55–65 Hz), lettering twice the size on a 384 px face, and its reading written in a
  window under the pivot; the air gauges' red zone is at the low end, where it belongs. Under the console's dials a
  readout strip writes every reading out in two lines (each engine's rpm, oil, jacket water, exhaust and telegraph
  order; the board, the air, the service tank, the fresh water, the aft bilge). The alarm matrix's names sit on two
  lines in their lamps, twice the size.
- **Open** (6r-3): the overhaul scenes themselves (covers off, parts on the plates, the crankcase inspected) when a
  machine is opened; the crew's bodies at the handles when the routine starts a machine; the alarm acknowledge; the
  plant saved with the game.
