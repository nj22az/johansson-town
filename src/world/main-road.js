// A six-metre street between the shop frontages, quay, and northern terminal.
// The live shopping district ends at the bus station instead of carrying an
// empty road through the old northern housing frontage.
// One lane each way, 4.5 m, as on an island shōtengai. The carriageway used to be 6 m
// and ran right up to Sakura's front step, leaving the west side a 1 m strip that the
// shops covered: no pavement at all. Now both sides have a footway behind a kerb.
export const MAIN_ROAD=Object.freeze({x:-2.75,width:4.5,west:-5,east:-.5,minZ:-38,maxZ:20.5,pavementWest:-7.55,pavementEast:5.2});
export const SHOP_CROSSING_Z=5.1;

/** The shopping street’s open service turnout: deliveries turn here without mounting a kerb. */
export const MAIN_SERVICE_COURT=Object.freeze({id:'main-service-court',minX:-7.1,maxX:.35,minZ:13.3,maxZ:20.3});

/**
 * A parking lay-by on the east side at the top of the street, between the lamp at the
 * office crossing and the market crossing: the harbour master parks here, by the crossing
 * to his office, rather than on the port apron. The kerb is dropped from its north end
 * through the market crossing, so a car pulls in and out without mounting it.
 */
export const MAIN_PARKING_LAYBY=Object.freeze({minX:-.5,maxX:1.65,minZ:-33.9,maxZ:-27.5,kerbTo:-24.5});

/** Freight stops in a west-side pullout, keeping the southbound lane open. */
export const MAIN_LOADING_APRON=Object.freeze({minX:-7.1,maxX:-4.95,minZ:2,maxZ:13.3});
