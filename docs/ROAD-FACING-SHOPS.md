# Road-facing shops

The two sides of the night alley now form two four-building rows along Main Street, opposite the existing residential frontage. All eight shopfronts face west towards the road. Minato Izakaya sits at the northern end and the Inakaya restaurant pair at the southern end, also facing west. A three-metre cross-street separates the two small shop rows.

| Frontage | Buildings | Approximate north–south extent |
| --- | --- | --- |
| Minato | Existing supplied izakaya | 21–27 m |
| North row | A–D, including Books & Press | 7–18 m |
| South row | E–H, including the repair workshop | −6–3 m |
| Inakaya | Sato Ramen and the timber neighbour | −15–−9 m |

The road is six metres wide and shifted towards the homes. The timber section now shares that width instead of forming a 23-metre slab. Separate pavements carry the entrances, while the new street furniture positions leave the full roadway clear. The existing home thresholds, seven households, interiors and port remain in place.

The alley asset downloads once. Its two halves are transformed once during loading, with original geometry, UVs, textures and material batches retained. The old cross-alley light wires and broad floor are omitted; Main Street supplies the pavement. Thirty draws render the transformed shop rows and their sealed rear walls. This requires no duplicate GLB or texture downloads. Source credit remains in the existing asset manifest.

Entrance prompts, collision footprints, door-facing directions, map markers, NPC work and evening destinations, and return positions use the same transforms. Automated checks cover source-facing joinery, both sides of the rear closures, direct road-to-door walks, the entire six-metre roadway, a continuous pavement, late loading, home routines and entry/exit through every current interior. The production build passes. The three existing legacy-overworld, office-fixture and Kenji-subtitle test failures remain outside this change. Offline geometry views were inspected; this environment does not provide live WebGL rendering.
