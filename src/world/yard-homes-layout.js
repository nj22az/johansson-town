/**
 * The little house in the yard behind Front-Row Books & Workshop, where the shop's
 * staff live: Tetsuo's, 2 Front-Row Yard. It sits between the bookshop's back wall
 * (x -15.2) and the yard's west edge (x -24.6), north of the path that runs in from the
 * lane gap at z 1.5; the passage beside Minato (z below -3) stays clear.
 *
 * 1 Front-Row Yard, the tiled house south of the path (x −24.1..−18.5, z −2.8..0.4), was
 * removed in phase 4 of docs/CAST-CONSOLIDATION.md: Nhung had moved home to 3 Kitahama in
 * phase 3 and Reiko retired. Its ground is the yard's lawn again (YARD_CLEARED, okinawa/lots.js).
 *
 * `door` is where you stand to go in; `inward` is the heading of somebody walking in
 * (0 walks towards -z, PI towards +z), which is what a site's entryFacing means.
 *
 * It is 5.6 m wide, the most the yard takes with the laundry beside it, so the 1K
 * staff house inside (interiors/yard-home.js, tetsuo-flat.js) is the size of the house you see.
 */
export const YARD_RESIDENT_NAMES=Object.freeze(['Tetsuo']);
export const YARD_HOMES=Object.freeze({
 'resident-home-kenji':Object.freeze({x:-21.3,z:5.5,w:5.6,d:3.6,height:2.7,door:Object.freeze([-20.6,3.05]),doorFace:3.7,inward:Math.PI,
  number:'2',address:'2 Front-Row Yard',walls:0xf1e6cf,trim:0x2a8fcc,roof:'flat'}),
});
