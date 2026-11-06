# Minato consolidation and home directions

> **History (19 October 2026).** The homes table below is the 17 October walkthrough's. The consolidation ([CAST-CONSOLIDATION.md](CAST-CONSOLIDATION.md); the report [CAST-CONSOLIDATION-REPORT.md](CAST-CONSOLIDATION-REPORT.md)) has since retired ten of the residents named here and removed their houses; the 14 households of today are in `src/people/roster.js` HOUSEHOLDS. The directions and the public-space changes stand.

Implemented following the requested MCP walkthrough of Johansson World on 17 October 2026. The changes address blocked-looking open space, too many overlapping garden and shop destinations, the approach to Umi-no-yu, and uncertainty about villagers' homes.

## Changes in order

1. **Police box treeline:** replace broad invisible collision strips with bounds matching the visible trunks. The existing passage beside the police box is walkable; the trees and the building remain solid.
2. **Shop and pavement collision:** use true circle/rectangle contact at corners. Align Higa's floor, shelves, counter and pots with their collision. Keep the main pavement and the vehicle turning space clear when placing benches, the postbox and the utility cabinet.
3. **Home identity:** one household registry supplies nameplates, addresses, home entrances, People/Homes cards, the resident guide and Studio's read tools. It contains all 31 cast members and 24 distinct occupied residences, including Thuan's secondary weekday room. Vacant flats are not offered as occupied homes; retired Kamiya and Tamaki plots are removed.
4. **One Harbour Park:** consolidate the garden and Onsen destinations into the park beside Sakura. Put Umi-no-yu on a broad, continuous paved approach with a visible entrance, a cherry tree, one koi pond, a small shrine, lamps, seating and a shore connection. Remove the old Aoba/east garden compounds, raised garden mound and separate decorative Rainflower Lane enclosure. Preserve useful connecting paths.
5. **Two compact counters:** retain Rainflower as a flower pavilion at the park edge. Incorporate Blue Coral's ice cream at Nakamura's frontage with one attendant and consistent opening hours. Keep the functioning police box and Higa liquor shop, with repaired access and fittings.
6. **Walking directions:** Places, Homes and People are separately searchable. Show home marks the household's public entrance; Find person uses current visible world positions or clearly labelled schedule information. The local map and waypoint follow a collision-aware route, update as the player walks and use an explicit ferry leg for Kitano. Earned shortcuts remain separate from directions.

## Destination decisions

| Destination | Result | Reason |
|---|---|---|
| Harbour Park near Sakura | Keep and enlarge into the principal park | Gives the island one legible garden destination and a usable Onsen setting. |
| Umi-no-yu | Relocate into Harbour Park | Its door and public approach now join the park paths directly. Existing bath interior, paid bath and free footbath remain. |
| Aoba / Japanese / east gardens | Consolidate into Harbour Park | Removes overlapping gardens and paths leading to retired enclosures. |
| Rainflower Lane | Replace with Rainflower Florist pavilion | Keeps flower buying without a separate compound and its obstructing decoration. |
| Blue Coral | Incorporate at Nakamura | Keeps ice cream, tea and soda alongside the existing sweets, without another shop building or attendant. |
| Minato Police Box | Keep and repair adjoining access | It is a useful service and Officer Mori's residence. |
| Higa liquor shop | Keep and repair | Its service remains; fitting collision and the customer approach match the visible shop. |
| Vacant / retired home plots | Remove inactive destination entries | Occupied households retain their homes and usable approaches. |

Old destination IDs are mapped to current park/counter IDs where appropriate, so saved visits and older links can still resolve.

## Occupied homes

| Address | Residents |
|---|---|
| Johansson & Thuan's House, Kitano hamlet | Johansson; Thuan |
| Chinen house, Kitano hamlet | Grandmother Chinen |
| 1 Kitahama | Thao; Chin; Vy; Thuan's weekday room |
| 2 Kitahama | Mrs Sato |
| 3 Kitahama | Kōji; Riku |
| 4 Kitahama | Postman Tōma |
| 6 Kitahama | Bus driver |
| 8 Kitahama | Ms Uezu |
| Flat 1, Kitahama Heights, Fukugi Lane | Mr Higa Jr |
| Flat 2, Kitahama Heights, Fukugi Lane | Ms Ganaha |
| 1 Front-Row Yard | Nhung; Reiko |
| 2 Front-Row Yard | Tetsuo |
| Higa house, Nishi-machi | Miss Higa; Grandmother Higa |
| Kinjō house, Nishi-machi | Mrs Kinjō |
| Ōshiro house, Nishi-machi | Mr Ōshiro |
| Flat above Sakura Shōten | Grandmother Sakurai |
| Above Nakamura Zenzai | Mrs Nakamura; Mai |
| Above the post office | Mr Shimabukuro |
| Minato Police Box residence | Officer Mori |
| Harbour Office residence behind the screen | Harbour master |
| Doctor's flat, Town Hall Clinic | Dr Kakazu |
| Minato Izakaya | Barfly |
| Chief engineer's cabin, Minato Maru | Mr Nakandakari |
| Shiosai houseboat, west pier | Mr Fujita |

Nhung's registered home remains 1 Front-Row Yard with Reiko; her family supper with Kōji and Riku is at 3 Kitahama. Thuan's primary home is on Kitano; the separate weekday room is labelled explicitly. Riku and Vy's guide copy and routines identify them as schoolchildren, consistent with the household registry.

The directory records real exterior approaches. It does not imply that every exterior-only residence has a playable interior. Public businesses sharing a residence, including Sakura, the clinic, harbour office, police box and izakaya, remain available under Places.

## Route behaviour

- Selecting Directions or Show home does not teleport, including after shortcuts have been earned.
- A seated player receives a route beginning at the seat's real standing point. An indoor player is told to exit to the street.
- Route sampling checks the body against the world's standing collision and ground heights, including both component orders used by movement. Direction simplification must retain the same clearance.
- Directions cross Main Street at the marked crossings. Moving vehicles and people remain real obstacles and may require a brief wait.
- Leaving a route or encountering a newly blocked segment triggers a fresh plan from the actual position.
- A destination on the other island first leads to the actual ferry landing or terminal. While aboard, the route says to continue by ferry; it does not draw a walking line through the sea. Walking directions resume ashore.
- The default map is local. Whole-world view is explicit, and the selected address has priority over incidental labels. Map text is sized in screen pixels so it remains readable on a phone.

## Verification

Verification uses both the constructed world and the actual game through the repository's MCP server. The MCP path tools send normal camera, keyboard and UI controls; they do not set the player's coordinates.

Completed control walkthroughs include the original police-box passage in both directions; the repaired Higa frontage and main pavement; Sakura to the Onsen's new entrance, actual entry and exit, and the return through the park; a Rainflower bouquet purchase for ¥250; and a Blue Coral ice cream purchase for ¥150. Both purchases changed the test bag and wallet correctly.

A compiled phone session at 390 × 844 searched for Riku, selected the Kōji/Riku household, stood normally from Sakura's bench and walked every point of the returned route to 3 Kitahama. The player finished approximately 0.04 m from the public gate, and the waypoint displayed arrival. The gate's inspection names both occupants and the address.

Focused regression coverage includes actual-world walking routes, Onsen approach width and visible-floor agreement, treeline and shop collision, all occupied household targets, every home entrance/exit, public seat standing clearance, traffic body clearance, directory actions, map bounds and MCP input limits. The full regression run is followed by individual reruns for retired-layout fixtures and dependencies omitted by the initial sparse checkout. The final compiled runtime is rebuilt from the integrated source and checked against its source fingerprint before publication.

The final combined rerun covered 37 relevant files and passed **186 of 186 tests**, including every initially failing group, the full boot walkthrough, Studio application, and the concurrently published resident, lyrics and expressive-pose features. A subsequent phone spacing correction passed another **7 of 7 directory and runtime packaging tests**. The initial broad run was not clean: it exposed obsolete layout fixtures and missing sparse-checkout dependencies. Those were corrected and their groups are included in the successful combined rerun.

The integrated compiled MCP session also followed Thuan's home directions to the actual Minato ferry terminal, reached the public boarding approach without teleporting, and displayed the onward Kitano ferry instructions. Town tools → Residents → Chin opened the existing resident record correctly. The final phone check at 390 × 844 shows Thuan's primary home, weekday room, current location, and both walking actions in the first visible card.

Actual compiled-build screenshots:

- [Onsen entrance reached on foot](qa/minato/onsen-approach.png)
- [Phone household card](qa/minato/phone-home-directory.png)
- [Phone walking map and ferry leg](qa/minato/phone-walking-map.png)

### Reproduction commands

Run from `johansson-town` with its dependencies installed:

```sh
node --test tests/minato-walking-routes.test.mjs tests/walking-route.test.mjs
node --test tests/home-directory.test.mjs tests/town-directory.test.mjs tests/town-map-viewport.test.mjs
node --test tests/boot.test.mjs tests/mcp-audit.test.mjs tests/travel-webmcp.test.mjs
npm run build:runtime
node --test tests/runtime-package.test.mjs
```

For visual verification, start `tools/mcp/server.mjs`, open a compiled test session at Sakura's bench at 12:00, search People, use Show home, stand through Interact and follow the returned walking path. Repeat Directions for Umi-no-yu and verify its actual doorway and interior. The MCP session uses an isolated test save.


## Photo and story guide consistency follow-up

A final check found active photo and story references still pointing to the retired Aoba garden and Rainflower Lane. The Photo Studio, pocket-camera captions and feed now share the current park and florist definitions. Existing `photo-garden`, `photo-rainflower`, `garden` and `rainflower` IDs are retained so saved records can still resolve.

| Feature | Current destination |
|---|---|
| Garden photo destination | Harbour Park pond; the public pond-bench approach at (26, −34.2). |
| Florist photo destination | Rainflower Florist; its public approach at (5, −16.7). |
| Garden story setting | The pond, gravel circuit, bench, bathhouse roof and shore walk in Harbour Park. |
| Florist story setting | Mrs Kinjō’s open park-edge pavilion and flower counter. |
| Sakura ice-cream mural | Its historical mural story remains, followed by current directions to Nakamura’s dessert counter beside Harbour Park. |

The cached garden and florist scenery is also recaptured from the current game. Each location has a main image and four matched colour/depth views; their camera and standing-position records are updated together. The garden camera looks across a dry foreground path towards the pond, leaving room for the characters. All eight colour/depth pairs passed alignment checks. Actual comic character placement is dry and clear at both locations, and the existing feed and seating regressions passed 11/11. The [capture evidence](qa/minato/feed-cache-refresh.json) records the standing-position, framing and depth checks, including the single rasterized-edge depth sample. The other 126 feed files and 14 cached location records remain unchanged.

The affected source checks passed **16/16**, including collision-aware walks to both public photo destinations and the actual Sakura mural interaction. Native boot and all interior visits passed. The final packaging group passed **3/3**; the final camera correction changes the lazy feed chunk while the tested boot and game bundles remain identical. The compiled graph guard now explicitly allows one additional, 2,521-byte shared Harbour Park data module, keeping the canonical location definitions in one place; all dependency, lazy-loading, audio and stylesheet assertions remain in force.

Detailed release evidence is recorded in [guide-consistency.json](qa/minato/guide-consistency.json). The [new park view](../assets/images/feed/garden.webp) and [florist view](../assets/images/feed/rainflower.webp) show the current consolidated locations.
