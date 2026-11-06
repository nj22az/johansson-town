# Minato terminal interior refit

The owner supplied a Three.js HTML diorama of an older Okinawan ferry terminal as a visual brief on 20 October 2026. Adapt its period materials and fittings to the existing Minato hall; do not import its separate Three.js r128/CDN/Tailwind stack, oversized 16 x 20 m room, sample ferry, real brands or fictional route times. Minato remains in 1997 and the Port Building plan remains authoritative.

The existing 9 x 7 m hall now uses seeded terrazzo, vertical timber counter panels and a worn timber ledge, cream/grey-green walls, exposed concrete piers and beams, orange and olive vinyl bench rows with metal supports, two caged ceiling fans, a public-telephone fitting, a bin and an original island travel poster. Shared fan geometry/materials and small canvas atlases keep this local to the interior.

The chalk-style departures board uses the existing Minato/Kitano-jima/Naha service descriptions. Its former geometry extended above the ceiling; it now fits below it and above the individual window signs. The reference's real-world destination list, 1975 event poster, branding and sample timetable are not substituted for game data.

Ticket and cargo actions, Ganaha's hours and seated clerk, the post/parcel service, ten stable seat ids, the drink machine, stairs/Harbour Office, room size, exit and spawn remain. The decorative telephone does not introduce a new calling interaction. Bench colliders now follow their actual row footprints, keeping the central entrance aisle clear.

`tests/port-hall-finish.test.mjs` checks the service and seating registrations, staff hours, board/fan bounds, fan progression, bench collisions and deterministic textures. Run with `node --test tests/port-hall-finish.test.mjs` from `johansson-town`.

Publication requires the full runtime rebuild and `tests/runtime-package.test.mjs`. Browser screenshots, a physical phone/tablet pass, readable signage, lighting/shadows and room navigation must be inspected before visual acceptance. This workspace had no browser executable or complete runtime-build toolchain; no screenshots or full-game frame-rate claims are made.
