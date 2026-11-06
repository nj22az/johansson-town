// Named shore residents' overnight hours. Main-cast night shifts retain their
// established home-life.js hours; these cover the canonical neighbour controller.
const H=(sleep,wake)=>Object.freeze({sleep,wake});
export const CANONICAL_REST=Object.freeze({
 Vy:H(1260,420),'Kōji':H(1260,225),Riku:H(1260,420),
 // Grandmother Higa is up at half past five: breakfast, then the garden before she opens Kissa Higa at seven
 // (commerce/kissa-higa.js, 30 October 2026).
 'Miss Higa':H(1380,420),'Grandmother Higa':H(1260,330),
 Mac:H(1320,285),
 // Ms Ganaha keeps the port window until 22:15 (ganaha.js) and is home by half past.
 'Ms Uezu':H(1320,315),'Ms Ganaha':H(1380,420),
});
const minute=m=>((m%1440)+1440)%1440;
/** A home stays occupied through midnight and breakfast, even without a modelled bedroom. */
export function canonicalRest(name,minutes){
 const hours=CANONICAL_REST[name];if(!hours)return null;
 const m=minute(minutes),sinceWake=minute(m-hours.wake);
 if(minute(m-hours.sleep)<minute(hours.wake-hours.sleep))return {id:'sleep',activity:'sleeping at home'};
 if(sinceWake<15)return {id:'wake',activity:'waking up at home'};
 if(sinceWake<45)return {id:'breakfast',activity:'having breakfast at home'};
 return null;
}
