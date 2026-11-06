import {TROPIC_PLACES} from './tropical-island.js';
/**
 * The airport's public side, in Kitano-jima's local frame: a small terminal plaza beside
 * check-in with three kiosks a traveller needs, and the departure lounge looking at the
 * runway. Books, post and souvenirs that duplicated the town's shops went: the town has
 * its own bookshop and post office. The rest of the island is beach and jungle.
 */
export const AIRPORT_PLAZA=TROPIC_PLACES.plaza;
export const AIRPORT_SHOPS=Object.freeze([
 {title:'Departure Coffee',item:'Departure coffee',price:100},
 {title:'Noodle Kitchen',item:'Airport noodle lunch',price:280},
 {title:'Island Crafts',item:'Woven island souvenir',price:400},
].map((shop,i)=>Object.freeze({...shop,x:TROPIC_PLACES.kiosks[i][0],z:TROPIC_PLACES.kiosks[i][1]})));
/** Two gates out of the lounge: the Naha commuter boards at Gate 1. */
export const AIRPORT_GATES=Object.freeze([{id:1,title:'GATE 1 · NAHA'},{id:2,title:'GATE 2'}].map(Object.freeze));
