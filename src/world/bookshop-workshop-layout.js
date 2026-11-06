// The bookshop retains its own street address after repairs move to the docks.
// The south wall is at z=-3.02, leaving just over 3 m to Minato's north gable.
export const BOOKSHOP_WORKSHOP_PLOT=Object.freeze({z:1.6,width:8.8,depth:7.4});
export const BOOKSHOP_WORKSHOP_ROOM=Object.freeze({
 width:8.4,depth:7,doorX:0,
 bounds:{minX:-4.2,maxX:4.2,minZ:-3.5,maxZ:3.5},
 spawn:[0,0,2.9],exit:[0,1.1,3.42],yaw:0,
 staff:{Nhung:[-2.6,0,1.2]},
});
export const BOOKSHOP_WORKSHOP=Object.freeze({
 title:'Front-Row Books',jp:'Front-Row Books',sub:'BOOKS · NEWSPAPERS · LOCAL STORIES',
 bookshop:true,side:-1,
 // Since 22 October 2026 (the owner) Nhung is the island doctor and Sakura sells the books and the stationery: the shop
 // floor is unstaffed, the reading copies and the last second-hand books sold from an honesty tin, and the back bench
 // prints the town's paper in the evenings. The room is as it was drawn.
 line:'The old bookshop, where Nhung prints the town’s small paper in the evenings; the reading copies stay, the last second-hand books go by the honesty tin, and the new ones are at Sakura.',
 directions:'On the west pavement, north of Minato Izakaya. The window reading chair is still there; leave the coins in the tin on the counter.',
});
