# Inakaya and the crystal-room neighbour

The supplied Inakaya model replaces the active corridor's ramen exterior. Its
right-hand restaurant door retains Sato Ramen's playable interior and purchases;
the adjoining timber building opens into the crystal room. StepWise returns to
its measurement workshop interior. The town map and directory register the
neighbour as The Timber House, leaving the interior as a surprise.

Both doors face the east lane. Exit points are (24.65, 14.7) and (21.2, 14.7).
Source foreground paving, poles and crossing wires were removed to keep the lane
clear. The facade solids, approach paving and transitions were updated together.
The source's original branding remains part of its textures.

The new exterior is 8,511,072 bytes versus 20,465,048 supplied (58.4% smaller),
with six mesh primitives and 94,129 triangles. Textures are capped at 2048 for
base colour and 1024 for the other maps, with the transparent atlas retained.
The original playable ramen interior now loads on entry, like the crystal room.
The input model is unchanged. Reproduction and credit are in assets/ATTRIBUTION.md.

Validation: production build passed. Nine focused tests passed, including the
CPU game startup, entry/exit for every registered interior, door approaches,
crystal-room interaction reachability, retry/caching and asset integrity. The
boot test was updated for the existing separate Sakura facade, current clerk
position and Thuan bedroom entry facing. No browser or iPad rendering/performance
claim is made. The broader suite has three existing failing tests (legacy full
supplied overworld, harbour-block shop count and Japanese-town shop count),
reproduced on the unchanged ad0f893 baseline.

## Playable Inakaya interior and regular customers

Sato Ramen now uses Inakaya's actual furnished interior. `ramen` aliases the
already-loaded exterior asset: no second GLB download or texture decode occurs.
A cached geometry copy restores the source's width and depth, lowers the actual
tiled floor to Y=0, and adds 0.6 m within the customer passage. The exterior and
its shared textures remain unchanged. The counter and wall fixtures retain
their proportions. Six static mesh draws remain; no device FPS claim is made.

The public aisle has measured counter, stool-row, basin and display-case solids.
The rear kitchen/furniture area is not a customer passage. Two player stools
have explicit standing positions; separate NPC stools use the measured cushion
height of 0.559 m. Warm interior fill supplements the original materials.
Ordering, reading, conversations, the street exit and the crystal-room neighbour
remain available.

Nine active residents have staggered visits between 09:15 and 20:55, with at
most two seated diners. They alternate sitting, eating and drinking and retain
individual seats as other guests leave. Thuan keeps her after-work stop and
standing greeting rig, with ramen-specific conversation. Existing actors are
reused indoors; outdoor schedules approach the ramen door, and completed visits
resume outside it. Interior population follows the schedule when entering a room
(the existing room-transition mechanism, not animated walking to a stool).
An active Kenji escort takes priority. Leaving the room does not prematurely
end a meal. Officer Mori's night patrol and Minato's closing schedule remain.

Validation: production build and 24 focused tests passed, covering the full
CPU game startup and every room's entry/exit, actual GLB floor/ceiling/stool
raycasts, an aisle traversable with occupied seats, stable seat assignment,
shared request/cache/retry behaviour, skinned seating contact, conversations,
closing, departures and escort priority. Browser visual verification was blocked
because the preview browser could not reach the local server. No browser/iPad
rendering or performance claim is made.
