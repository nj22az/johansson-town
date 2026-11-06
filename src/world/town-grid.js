import {DOCK_WORKSHOP_PLOT} from './dock-workshop-layout.js';
import {westShopDoor} from './west-shops.js';
import {consolidateBusinesses} from './businesses.js';
import {transitStop} from './transit.js';
export const SHOP_ADDRESSES=Object.freeze({
 market:{side:-1,z:-28.5},
});
// Street door and the last outdoor step through the opening. Keep profile.work
// off this doorway so the player entrance stays clear while staff are inside.
export const MARKET_DOOR=Object.freeze([SHOP_ADDRESSES.market.side*5.5,SHOP_ADDRESSES.market.z]);
export const MARKET_THRESHOLD=Object.freeze([SHOP_ADDRESSES.market.side*6.3,SHOP_ADDRESSES.market.z]);
export const TOWN_DESTINATIONS=Object.freeze({
 // The stop is read too: on the island it is the ferry terminal on the quay.
 get bus(){return [...transitStop().queue];},get busArrival(){return [...transitStop().arrival];},get busDriver(){return [...transitStop().driver];},
 get workshop(){return [DOCK_WORKSHOP_PLOT.door[0],DOCK_WORKSHOP_PLOT.door[2]];},
 get books(){return westShopDoor('frontrow');},
 pier:[-1.6,-62],
});
export function applyShopAddresses(sites){
 consolidateBusinesses(sites);
 for(const site of sites){const address=SHOP_ADDRESSES[site.id];if(address)Object.assign(site,address);}
}
