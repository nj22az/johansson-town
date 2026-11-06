# Sakura internal stair and night lighting

**20 October 2026: the stair is a passage, not walked.** The owner, on his iPhone: "I don't want the stairs to be
traversable it's too much errors when running up the stairs, I want the stairs to lead up to a black hole and we
disappear into there and when it loads we come up on the upper floor." The shop and the office are two rooms again.
In the stockroom five treads rise into an unlit black (`sakura-stairs.js` `SAKURA_STAIR_PASSAGE.foot`); stepping onto
them, or "Go upstairs", walks him into the dark for 1.1 s while the picture fades, and the office storey opens as its
own room (`sakura-office-room.js` `buildSakuraOfficeRoom`) with him at the stair head facing up the hall. From the
stair head four treads go down into the dark; the same passage brings him to the stair's foot in the stockroom. The
office is entered only from inside (its site is `insideOnly`), and its fire door only from inside ("Evacuate by the fire
escape", down the caged ladder to the yard). The walked flights, the turning landing, the landing lens, the storey
switching (`sakura-storey-view.js`) and `tools/sakura-stairs-smoke.mjs` are gone; what follows is the record of the
walked stair of 18 and 19 October. Tests: `tests/sakura-stairs.test.mjs`, `tests/sakura-upstairs.test.mjs`,
`tests/sakura-back.test.mjs`, `tests/no-z-fighting.test.mjs` (rooms at a phone's size).

## The walked stair (18 and 19 October 2026, superseded)

18 October 2026. The office and konbini now share one continuous two-storey
interior. Walk through the stockroom and up two flights, turning at the western
landing; walk back down the same route. The upper floor is 4.01m above the shop.
There is no separate office instance: the directory's office entry opens the same
interior on the upper floor.

19 October 2026: the outside stair, its landing and the outside office door are
gone (the creator: "Remove the outdoor stairs to Sakura's office, add windows on
the back and a fire escape"). The office is reached only through the shop and up
this stair. Its rear door is a fire door onto a steel landing and a caged escape
ladder down the back wall, solid and on no route; the back wall has two office
sashes, a frosted stair window and the kitchenette's vent, and the lawn behind the
shop is a concrete service apron (`okinawa/old-town.js` `SAKURA_BACK`,
`thuan-flat.js` `SAKURA_OFFICE_BACK`, `tests/sakura-back.test.mjs`).

The western stockroom has a real ceiling opening, stepped treads, handrails,
guarded upper-floor opening and a lit turning landing. The office floor is split
around the opening. The kitchenette is moved clear of the stair arrival. Stock
racks are shortened, and cartons, bottle crates and the delivery trolley are
repositioned. Sales aisles, till, goods capacities and delivery entrance remain.

Office fixtures have steady fluorescent diffusers; the existing shop hemisphere
fill remains on throughout the night. The stair bulkhead also remains visible.
No point lights, shadow maps, downloaded models or framebuffer allocations are
added. The upper windows use the existing live street renderer with the upper
floor and local origin accounted for. Upstairs occupants do not block people on
the shop floor at the same horizontal position.

## Verification

Local checks cover walking both stair flights in both directions at normal player
radius, standing headroom, shifted seat coordinates, lit fixtures, shop business,
restocking, existing resident homes and the runtime build. The compiled graph gains
one small shared house-walk helper chunk; the packaging bound increases from 35
to 36 manifest entries for this measured reason.

`tools/sakura-stairs-smoke.mjs` replays forward movement through the actual game
physics up and down the stairs. It captures the office in daylight and after
midnight, plus the stair at night; it checks image content, lighting fixtures,
full postprocessing, GPU errors and outside-door entry. Results are recorded in
`docs/qa/sakura-internal-stairs/` after verification. Physical iPhone Safari
testing remains unavailable; Linux WebKit is not a physical-phone benchmark.

## Recorded result

The final release passed 60 focused and runtime-package checks. Linux WebKit
completed 419 actual input steps upstairs and 419 downstairs with zero recorded
position drift. The outside office entrance also placed the player on the same
upper floor. Four captures were reviewed: office daylight, office at 00:30,
whole-office overview at 00:30 and the stairwell at 00:30. Fixtures remained on,
full postprocessing remained active and each view reported no WebGL error.

The full-game replay caught an initial boundary error at the rear upper landing;
its correction is included in both the runtime boundary helper and the traversal
check. Image review also corrected missing desk/tea-table supports and enclosed
the shaft above the old stockroom ceiling. These results concern this office and
stair route; they do not constitute physical iPhone or whole-town acceptance.
